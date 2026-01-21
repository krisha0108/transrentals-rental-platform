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
    } = body;

    // Validation
    if (!email || !password || !phone || !businessName || !ownerName) {
      return NextResponse.json(
        { error: 'Email, password, phone, business name, and owner name are required' },
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

    // Create vendor
    const vendor = await prisma.vendors.create({
      data: {
        id: generateId(),
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
        email: true,
        phone: true,
        businessName: true,
        ownerName: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Vendor registered successfully', { vendorId: vendor.id });

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
