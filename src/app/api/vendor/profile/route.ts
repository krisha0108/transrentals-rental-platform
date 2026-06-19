import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { smartRateLimit, getClientIdentifier } from '@/lib/utils/smart-rate-limit';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
import { generateVid } from '@/lib/utils/generate-vid';
export const dynamic = 'force-dynamic';

// In-flight request coalescing: multiple parallel calls for same vendorId share one DB query
const inFlightProfiles = new Map<string, Promise<any>>();

async function fetchVendorFromDB(vendorId: string) {
  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      vid: true,
      email: true,
      phone: true,
      businessName: true,
      businessType: true,
      ownerName: true,
      gstNumber: true,
      panNumber: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      logo: true,
      description: true,
      website: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      accountHolderName: true,
      status: true,
      slug: true,
      isProfilePublic: true,
      rating: true,
      totalRatings: true,
      createdAt: true,
      rejectionReason: true,
      vendor_approved_services: {
        where: { isActive: true },
        select: {
          services: {
            select: {
              id: true,
              name: true,
              slug: true,
              services: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
      vendor_approved_locations: {
        where: { isActive: true },
        select: {
          locations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          vendor_approved_services: true,
          vendor_approved_locations: true,
          vendor_fleets: true,
          vendor_documents: true,
          vendor_service_requests: true,
          vendor_location_requests: true,
        },
      },
    },
  });

  if (!vendor) return null;

  const approvedServiceIds = vendor.vendor_approved_services.map((as) => {
    return as.services.services?.id || as.services.id;
  });
  const uniqueServiceIds = [...new Set(approvedServiceIds)];

  const approvedServiceSlugs = vendor.vendor_approved_services.map((as) => {
    return as.services.services?.slug || as.services.slug;
  });
  const uniqueServiceSlugs = [...new Set(approvedServiceSlugs)];

  const approvedLocationIds = vendor.vendor_approved_locations.map((al) => al.locations.id);

  return {
    ...vendor,
    approvedServicesCount: vendor._count.vendor_approved_services,
    approvedLocationsCount: vendor._count.vendor_approved_locations,
    fleetsCount: vendor._count.vendor_fleets,
    documentsCount: vendor._count.vendor_documents,
    serviceRequestsCount: vendor._count.vendor_service_requests,
    locationRequestsCount: vendor._count.vendor_location_requests,
    approvedServiceIds: uniqueServiceIds,
    approvedServiceSlugs: uniqueServiceSlugs,
    approvedLocationIds,
    approvedLocationSlugs: vendor.vendor_approved_locations.map((al) => al.locations.slug),
  };
}

// GET - Get vendor profile
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;


    // Coalesce parallel requests for the same vendor into a single DB query
    let pending = inFlightProfiles.get(vendorId);
    if (!pending) {
      pending = fetchVendorFromDB(vendorId);
      inFlightProfiles.set(vendorId, pending);
      pending.finally(() => inFlightProfiles.delete(vendorId));
    }

    const vendorData = await pending;
    if (!vendorData) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Generate vid on first profile view if it wasn't set at login/register
    if (!vendorData.vid) {
      const vid = await generateVid();
      await prisma.vendors.update({ where: { id: vendorId }, data: { vid } });
      vendorData.vid = vid;
    }

    return NextResponse.json(vendorData);
  } catch (error: any) {
    logger.error('Get vendor profile error', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // ===== RATE LIMITING =====
    const clientId = getClientIdentifier(request);
    const rateLimitCheck = await smartRateLimit(clientId, true, {});
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    let {
      businessName,
      businessType,
      ownerName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      logo,
      description,
      website,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      slug,
      isProfilePublic,
    } = body;

    // ===== INPUT SANITIZATION =====
    businessName = sanitizeInput(businessName);
    businessType = sanitizeInput(businessType);
    ownerName = sanitizeInput(ownerName);
    gstNumber = sanitizeInput(gstNumber);
    panNumber = sanitizeInput(panNumber);
    address = sanitizeInput(address);
    city = sanitizeInput(city);
    state = sanitizeInput(state);
    pincode = sanitizeInput(pincode);
    description = sanitizeInput(description);
    website = sanitizeInput(website);
    bankName = sanitizeInput(bankName);
    accountNumber = sanitizeInput(accountNumber);
    ifscCode = sanitizeInput(ifscCode);
    accountHolderName = sanitizeInput(accountHolderName);

    // Validate required fields
    if (businessName !== undefined && !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    if (ownerName !== undefined && !ownerName.trim()) {
      return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    }

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (businessType !== undefined) updateData.businessType = businessType || null;
    if (ownerName !== undefined) updateData.ownerName = ownerName.trim();
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber?.toUpperCase() || null;
    if (panNumber !== undefined) updateData.panNumber = panNumber?.toUpperCase() || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;
    if (logo !== undefined) updateData.logo = logo || null;
    if (description !== undefined) updateData.description = description || null;
    if (website !== undefined) updateData.website = website || null;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode?.toUpperCase() || null;
    if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName || null;
    if (isProfilePublic !== undefined) updateData.isProfilePublic = !!isProfilePublic;

    // Public-profile slug (/partner/<slug>). Normalize to a URL-safe form and
    // guard uniqueness so we return a friendly error instead of a 500.
    if (slug !== undefined) {
      const normalized = String(slug || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!normalized) {
        updateData.slug = null;
      } else if (normalized.length < 3) {
        return NextResponse.json({ error: 'Slug must be at least 3 characters' }, { status: 400 });
      } else {
        const clash = await prisma.vendors.findFirst({
          where: { slug: normalized, NOT: { id: vendorId } },
          select: { id: true },
        });
        if (clash) {
          return NextResponse.json({ error: 'That profile link is already taken' }, { status: 409 });
        }
        updateData.slug = normalized;
      }
    }

    const vendor = await prisma.vendors.update({
      where: { id: vendorId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        businessName: true,
        businessType: true,
        ownerName: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logo: true,
        description: true,
        website: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        accountHolderName: true,
        status: true,
        slug: true,
        isProfilePublic: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
      },
    });

    return NextResponse.json(vendor);
  } catch (error: any) {
    logger.error('Update vendor profile error', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}
