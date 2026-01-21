// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';

export const dynamic = 'force-dynamic';

// POST - Mobile Login for Vendor App
export async function POST(request: NextRequest) {
  // Rate limiting
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.login,
    'vendor-mobile-login'
  );

  if (limited) {
    logger.logSecurityEvent('Vendor mobile login rate limit exceeded', 'high', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find vendor
    const vendor = await prisma.vendors.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        phone: true,
        businessName: true,
        ownerName: true,
        status: true,
        businessType: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!vendor) {
      logger.logSecurityEvent('Vendor mobile login failed - user not found', 'medium', {
        email: email.toLowerCase(),
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      logger.logSecurityEvent('Vendor mobile login failed - wrong password', 'medium', {
        vendorId: vendor.id,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check vendor status
    if (vendor.status === 'BLOCKED') {
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact support.' },
        { status: 403 }
      );
    }
    if (vendor.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account is suspended. Please contact support.' },
        { status: 403 }
      );
    }
    if (vendor.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your application was rejected. Please contact support.' },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.vendors.update({
      where: { id: vendor.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT token for mobile
    const token = jwt.sign(
      {
        id: vendor.id,
        email: vendor.email,
        role: 'VENDOR',
        userType: 'vendor',
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );

    // Remove password from response
    const { password: _, ...vendorData } = vendor;

    logger.info('Vendor mobile login successful', { vendorId: vendor.id });

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendorData,
        role: 'VENDOR',
        userType: 'vendor',
      },
      token,
    });
  } catch (error) {
    console.error('Vendor mobile login error:', error);
    logger.error('Vendor mobile login error', error);
    return NextResponse.json(
      {
        error: 'Login failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
