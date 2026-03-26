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
    const { email, password, fcmToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find vendor first
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

    if (vendor) {
      // --- VENDOR LOGIN ---
      const isPasswordValid = await bcrypt.compare(password, vendor.password);
      if (!isPasswordValid) {
        logger.logSecurityEvent('Vendor mobile login failed - wrong password', 'medium', { vendorId: vendor.id });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      if (vendor.status === 'BLOCKED') {
        return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
      }
      if (vendor.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
      }
      if (vendor.status === 'REJECTED') {
        return NextResponse.json({ error: 'Your application was rejected. Please contact support.' }, { status: 403 });
      }

      await prisma.vendors.update({
        where: { id: vendor.id },
        data: { lastLoginAt: new Date(), ...(fcmToken ? { fcmToken } : {}) },
      });

      const token = jwt.sign(
        { id: vendor.id, email: vendor.email, role: 'VENDOR', userType: 'vendor' },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '30d' }
      );

      const { password: _, ...vendorData } = vendor;
      logger.info('Vendor mobile login successful', { vendorId: vendor.id });

      return NextResponse.json({
        success: true,
        vendor: { ...vendorData, role: 'VENDOR', userType: 'vendor' },
        token,
      });
    }

    // --- STAFF LOGIN ---
    const staff = await prisma.vendor_staff.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        vendorId: true,
        profilePhoto: true,
        city: true,
        state: true,
        createdAt: true,
        lastLoginAt: true,
        vendors: {
          select: { id: true, businessName: true, email: true, phone: true, city: true },
        },
      },
    });

    if (!staff) {
      logger.logSecurityEvent('Vendor mobile login failed - user not found', 'medium', { email: email.toLowerCase() });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!staff.password) {
      return NextResponse.json({ error: 'Password not set. Please contact your vendor admin.' }, { status: 401 });
    }

    const isStaffPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isStaffPasswordValid) {
      logger.logSecurityEvent('Staff mobile login failed - wrong password', 'medium', { staffId: staff.id });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (staff.status === 'INACTIVE' || staff.status === 'TERMINATED') {
      return NextResponse.json({ error: 'Your account is inactive. Please contact your vendor admin.' }, { status: 403 });
    }

    await prisma.vendor_staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date(), ...(fcmToken ? { fcmToken } : {}) },
    });

    const staffToken = jwt.sign(
      { id: staff.id, email: staff.email, role: staff.role, userType: 'staff', vendorId: staff.vendorId },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );

    const { password: __, ...staffData } = staff;
    logger.info('Staff mobile login successful', { staffId: staff.id, vendorId: staff.vendorId });

    return NextResponse.json({
      success: true,
      vendor: {
        ...staffData,
        businessName: staff.vendors?.businessName,
        ownerName: staff.name,
        userType: 'staff',
      },
      token: staffToken,
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
