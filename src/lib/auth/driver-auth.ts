import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db/prisma';

// SECURITY: JWT secret must be set in environment - no fallback allowed
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('CRITICAL: NEXTAUTH_SECRET environment variable is not set. Driver authentication will not work securely.');
}

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export interface DriverPayload {
  driverId: string;
  vendorId: string;
  email: string;
  name: string;
  role: 'driver';
}

export async function verifyDriverToken(request: NextRequest): Promise<DriverPayload | null> {
  try {
    // Check for token in cookie first, then Authorization header
    const cookieToken = request.cookies.get('driver-token')?.value;
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validate payload
    if (
      !payload.driverId ||
      !payload.vendorId ||
      payload.role !== 'driver'
    ) {
      return null;
    }

    return payload as unknown as DriverPayload;
  } catch (error) {
    console.error('Driver token verification failed:', error);
    return null;
  }
}

export async function getDriver(request: NextRequest) {
  const payload = await verifyDriverToken(request);
  if (!payload) {
    return null;
  }

  // Fetch driver from database
  const driver = await prisma.vendor_staff.findUnique({
    where: { id: payload.driverId },
    include: {
      vendors: {
        select: {
          id: true,
          businessName: true,
          phone: true,
        },
      },
    },
  });

  if (!driver || driver.status !== 'ACTIVE' || driver.role !== 'DRIVER') {
    return null;
  }

  // Exclude password
  const { password: _, ...driverData } = driver;
  return driverData;
}
