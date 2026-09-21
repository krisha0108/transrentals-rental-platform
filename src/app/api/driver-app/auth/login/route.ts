import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    // A request that arrives with no body at all — a cut connection, a probe,
    // a proxy that dropped it — used to throw a JSON SyntaxError and surface
    // as a 500, which reads like the server is broken. It is a bad request.
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    const { identifier: rawIdentifier, email: rawEmail, password, fcmToken } = body;
    const raw = rawIdentifier || rawEmail;

    if (!raw || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedIdentifier = raw.toLowerCase().trim();
    const isDriverId = /^dr-\d+$/i.test(normalizedIdentifier);

    // 1. Check independent drivers table first
    const driver = await prisma.drivers.findFirst({
      where: isDriverId ? { did: normalizedIdentifier } : { email: normalizedIdentifier },
    });

    if (driver) {
      const isValid = await bcrypt.compare(password, driver.password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
      if (driver.status === 'INACTIVE' || driver.status === 'SUSPENDED') {
        return NextResponse.json({ success: false, error: 'Your account has been suspended. Contact support.' }, { status: 401 });
      }
      await prisma.drivers.update({
        where: { id: driver.id },
        data: { lastLoginAt: new Date(), ...(fcmToken ? { fcmToken } : {}) },
      });
      const token = await new SignJWT({
        driverAppId: driver.id,
        email: driver.email,
        name: driver.name,
        role: 'driver-app',
        userType: 'driver',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .setIssuedAt()
        .sign(JWT_SECRET);

      const { password: _, ...driverData } = driver;
      return NextResponse.json({ success: true, driver: { ...driverData, userType: 'driver' }, token });
    }

    // 2. Check vendor_staff table (DRIVER role only)
    const staff = await prisma.vendor_staff.findFirst({
      where: isDriverId ? { did: normalizedIdentifier } : { email: normalizedIdentifier },
      include: { vendors: { select: { id: true, businessName: true, city: true } } },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!staff.password) {
      return NextResponse.json({ success: false, error: 'Password not set. Contact your admin.' }, { status: 401 });
    }

    const isStaffValid = await bcrypt.compare(password, staff.password);
    if (!isStaffValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (staff.status === 'INACTIVE' || staff.status === 'TERMINATED') {
      return NextResponse.json({ success: false, error: 'Your account is inactive. Contact your vendor admin.' }, { status: 401 });
    }

    await prisma.vendor_staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date(), ...(fcmToken ? { fcmToken } : {}) },
    });

    const staffToken = await new SignJWT({
      driverAppId: staff.id,
      email: staff.email,
      name: staff.name,
      role: 'driver-app',
      userType: 'vendor_staff',
      vendorId: staff.vendorId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    const { password: __, ...staffData } = staff;
    return NextResponse.json({
      success: true,
      driver: {
        ...staffData,
        userType: 'vendor_staff',
        vendorName: staff.vendors?.businessName,
      },
      token: staffToken,
    });
  } catch (error: any) {
    console.error('Driver app login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
