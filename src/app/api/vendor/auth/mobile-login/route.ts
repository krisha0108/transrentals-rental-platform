// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';
import { generateDid } from '@/lib/utils/generate-did';
import { generateTaid } from '@/lib/utils/generate-taid';

export const dynamic = 'force-dynamic';

// Handle CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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
    const { identifier, email, password, fcmToken } = body;

    // Support both identifier (email or VID) and legacy email field
    const loginIdentifier = identifier || email;

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Email or Vendor ID and password are required' },
        { status: 400 }
      );
    }

    // Find vendor by VID (vn-0001) or email
    let vendor;
    const vendorSelect = {
      id: true,
      vid: true,
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
    };

    if (/^vn-\d+$/i.test(loginIdentifier)) {
      // Login via Vendor ID
      vendor = await prisma.vendors.findFirst({
        where: { vid: loginIdentifier.toLowerCase() },
        select: vendorSelect,
      });
    } else {
      // Login via email
      vendor = await prisma.vendors.findUnique({
        where: { email: loginIdentifier.toLowerCase() },
        select: vendorSelect,
      });
    }

    if (vendor) {
      // --- VENDOR LOGIN ---
      const isPasswordValid = await bcrypt.compare(password, vendor.password);
      if (!isPasswordValid) {
        logger.logSecurityEvent('Vendor mobile login failed - wrong password', 'medium', { vendorId: vendor.id });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Suspended vendors are let through — they can still view their
      // dashboard read-only, same as the web login. Every write route is
      // independently blocked by vendorStatusGuard regardless of this.
      if (vendor.status === 'BLOCKED') {
        return NextResponse.json({ error: 'Your account is blocked. Please contact our support team for any query.' }, { status: 403 });
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
      where: { email: loginIdentifier.toLowerCase() },
      select: {
        id: true,
        did: true,
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

    if (staff) {
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

      // Generate DID if missing (for existing staff)
      let staffDid = staff.did;
      if (!staffDid) {
        try {
          staffDid = await generateDid();
          await prisma.vendor_staff.update({
            where: { id: staff.id },
            data: { did: staffDid },
          });
          logger.info('Generated DID for existing vendor staff', { staffId: staff.id, did: staffDid });
        } catch (error) {
          logger.error('Failed to generate DID for vendor staff', error);
        }
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
      logger.info('Staff mobile login successful', { staffId: staff.id, vendorId: staff.vendorId, did: staffDid });

      return NextResponse.json({
        success: true,
        vendor: {
          ...staffData,
          did: staffDid,
          businessName: staff.vendors?.businessName,
          ownerName: staff.name,
          userType: 'staff',
        },
        token: staffToken,
      });
    }

    // --- TRAVEL AGENT LOGIN ---
    // Same form & endpoint as vendor; we detect TA credentials here and return userType='travel_agent'
    // so the mobile app can route to the Travel Agent dashboard instead.
    // findFirst, not findUnique: a TA can sign in with either their TAID
    // (ta-0001) or their email, and the two lookups take different shapes.
    const travelAgent = await prisma.travel_agents.findFirst({
      where: /^ta-\d+$/i.test(loginIdentifier)
        ? { tid: loginIdentifier.toLowerCase() }
        : { email: loginIdentifier.toLowerCase() },
      select: {
        id: true,
        tid: true,
        email: true,
        password: true,
        phone: true,
        agencyName: true,
        ownerName: true,
        agencyType: true,
        status: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logo: true,
        description: true,
        website: true,
        slug: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        approvedAt: true,
        rejectionReason: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (travelAgent) {
      const isTaPasswordValid = await bcrypt.compare(password, travelAgent.password);
      if (!isTaPasswordValid) {
        logger.logSecurityEvent('Travel agent mobile login failed - wrong password', 'medium', { travelAgentId: travelAgent.id });
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      if (travelAgent.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Your account is suspended. Please contact support.' }, { status: 403 });
      }
      if (travelAgent.status === 'REJECTED') {
        return NextResponse.json(
          { error: travelAgent.rejectionReason || 'Your application was rejected. Please contact support.' },
          { status: 403 }
        );
      }

      // Lazily assign a Travel Agent ID (ta-xxxx) to older accounts missing one.
      if (!travelAgent.tid) {
        try {
          travelAgent.tid = await generateTaid();
        } catch { /* non-fatal — login can proceed without a fresh tid */ }
      }

      await prisma.travel_agents.update({
        where: { id: travelAgent.id },
        data: {
          lastLoginAt: new Date(),
          ...(travelAgent.tid ? { tid: travelAgent.tid } : {}),
          ...(fcmToken ? { fcmToken } : {}),
        },
      });

      const taToken = jwt.sign(
        { id: travelAgent.id, email: travelAgent.email, role: 'TRAVEL_AGENT', userType: 'travel_agent' },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '30d' }
      );

      const { password: ___, ...taData } = travelAgent;
      logger.info('Travel agent mobile login successful', { travelAgentId: travelAgent.id });

      return NextResponse.json({
        success: true,
        travelAgent: { ...taData, role: 'TRAVEL_AGENT', userType: 'travel_agent' },
        token: taToken,
      });
    }

    // --- NO MATCH IN ANY TABLE ---
    logger.logSecurityEvent('Mobile login failed - user not found', 'medium', { email: loginIdentifier.toLowerCase() });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
