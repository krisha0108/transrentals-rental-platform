import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

export interface DriverPayload {
  driverId: string;
  vendorId?: string;
  email: string;
  name: string;
  role: 'driver';
  userType: 'vendor_staff' | 'independent';
}

export async function verifyDriverToken(request: NextRequest): Promise<DriverPayload | null> {
  try {
    const cookieToken = request.cookies.get('driver-token')?.value;
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || headerToken;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.driverId || payload.role !== 'driver') return null;

    return payload as unknown as DriverPayload;
  } catch {
    return null;
  }
}

export async function getDriver(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) return null;

  // Vendor staff driver
  if (payload.userType === 'vendor_staff') {
    const driver = await prisma.vendor_staff.findUnique({
      where: { id: payload.driverId },
      include: { vendors: { select: { id: true, businessName: true, phone: true } } },
    });
    if (!driver || driver.status !== 'ACTIVE' || driver.role !== 'DRIVER') return null;
    const { password: _, ...data } = driver as any;
    return { ...data, userType: 'vendor_staff' };
  }

  // Independent driver (default)
  const driver = await prisma.drivers.findUnique({
    where: { id: payload.driverId },
  });
  if (!driver || driver.status !== 'ACTIVE') return null;
  const { password: _, ...data } = driver as any;
  return { ...data, userType: 'independent' };
}
