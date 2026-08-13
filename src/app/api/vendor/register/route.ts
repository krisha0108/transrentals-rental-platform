import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  checkRateLimit,
  RATE_LIMITS,
  logger,
} from '@/lib/security';
import { generateVid } from '@/lib/utils/generate-vid';
import { getManagersForLocation, notifyManagers } from '@/lib/notifications/manager-notify';

function generateLocationRequestId(): string {
  return 'vlr' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 21);
}

interface ServiceLocationInput {
  locationId: string | null; // null when isCustom — resolved server-side from `state`
  name: string;
  isCustom: boolean;
}

// Creates the vendor's first vendor_location_requests row(s) at registration
// time, reusing the exact same shape/notify flow as the existing
// POST /api/vendor/locations/bulk endpoint — so these show up identically
// in the manager/admin location-request queues. Never throws: registration
// must succeed even if location-request creation has a problem.
async function createInitialLocationRequests(
  vendorId: string,
  businessName: string,
  serviceLocations: ServiceLocationInput[],
  stateName: string | null,
) {
  try {
    if (!serviceLocations?.length) return;

    // Resolve custom entries to their state's locationId (best-effort).
    let fallbackStateId: string | null = null;
    const hasCustom = serviceLocations.some((l) => l.isCustom);
    if (hasCustom && stateName) {
      const stateLoc = await prisma.locations.findFirst({
        where: { name: stateName, type: { in: ['STATE', 'UNION_TERRITORY'] } },
        select: { id: true },
      });
      fallbackStateId = stateLoc?.id ?? null;
    }

    const rows = serviceLocations
      .map((loc) => {
        const locationId = loc.isCustom ? fallbackStateId : loc.locationId;
        if (!locationId) return null; // couldn't resolve — skip, don't block registration
        return {
          locationId,
          localAddress: loc.isCustom ? `Requested area not in list: "${loc.name}"` : null,
        };
      })
      .filter((r): r is { locationId: string; localAddress: string | null } => r !== null);

    if (!rows.length) return;

    const created = await prisma.$transaction(
      rows.map((r) =>
        prisma.vendor_location_requests.upsert({
          where: { vendorId_locationId: { vendorId, locationId: r.locationId } },
          update: {},
          create: {
            id: generateLocationRequestId(),
            vendorId,
            locationId: r.locationId,
            localAddress: r.localAddress,
            status: 'PENDING',
          },
        })
      )
    );

    // Notify managers scoped to each location — best-effort, never blocks.
    await Promise.all(
      created.map((req) =>
        getManagersForLocation(req.locationId).then((managerIds) =>
          notifyManagers(managerIds, {
            type: 'NEW_LOCATION_REQUEST',
            title: 'New vendor wants to operate here',
            body: `${businessName} has requested this as their first location.`,
            link: `/manager/vendors/${vendorId}?tab=locations`,
            metadata: { vendorId, locationId: req.locationId, requestId: req.id, isNewVendor: true },
            dedupeKey: req.id,
          })
        )
      )
    );
  } catch (error) {
    logger.error('Failed to create initial location requests at registration', error);
  }
}

export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// POST - Vendor Registration
export async function POST(request: NextRequest) {
  // Rate limiting for registration
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.auth,
    'vendor-register'
  );

  if (limited) {
    logger.logSecurityEvent('Vendor registration rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  try {
    const body = await request.json();
    const {
      email,
      password,
      phone,
      businessName,
      businessType,
      ownerName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      serviceLocations,
    } = body;

    // Validation
    if (!email || !password || !phone || !businessName || !ownerName) {
      return NextResponse.json(
        { error: 'Email, password, phone, business name, and owner name are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(serviceLocations) || serviceLocations.length === 0) {
      return NextResponse.json(
        { error: 'At least one service location is required' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone format validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, '').slice(-10))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.vendors.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      logger.logSecurityEvent('Vendor registration with existing email', 'low', {
        email: email.toLowerCase(),
      });
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.vendors.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      logger.logSecurityEvent('Vendor registration with existing phone', 'low', {
        phone: phone.slice(-4),
      });
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    // Hash password with strong cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    const vid = await generateVid();

    // Create vendor
    const vendor = await prisma.vendors.create({
      data: {
        id: generateId(),
        vid,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        businessName,
        businessType: businessType || null,
        ownerName,
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: 'DOCUMENTS_PENDING',
      },
      select: {
        id: true,
        vid: true,
        email: true,
        phone: true,
        businessName: true,
        ownerName: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Vendor registered successfully', { vendorId: vendor.id });

    // Vendor's chosen service location(s) become their first location
    // request(s) — same record type/queue managers already review, so no
    // separate "request a location" step is needed after registration.
    await createInitialLocationRequests(vendor.id, businessName, serviceLocations, state || null);

    return NextResponse.json({
      message: 'Registration successful! Please upload your business documents.',
      vendor,
    }, { status: 201 });

  } catch (error: unknown) {
    logger.error('Vendor registration error', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
