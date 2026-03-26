import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

export async function getDriverAppUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.cookies.get('driver-app-token')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.driverAppId) return null;

    // vendor_staff token
    if (payload.userType === 'vendor_staff') {
      const staff = await prisma.vendor_staff.findUnique({
        where: { id: payload.driverAppId as string },
      });
      if (!staff || staff.status === 'INACTIVE' || staff.status === 'TERMINATED') return null;
      return { ...staff, userType: 'vendor_staff' } as any;
    }

    // independent driver token
    const driver = await prisma.drivers.findUnique({
      where: { id: payload.driverAppId as string },
    });

    if (!driver || driver.status === 'INACTIVE' || driver.status === 'SUSPENDED') {
      return null;
    }

    return { ...driver, userType: 'driver' } as any;
  } catch {
    return null;
  }
}
