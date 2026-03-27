import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get current logged in driver
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriver(request);

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        profilePhoto: (driver as any).profilePhoto,
        licenseNumber: (driver as any).licenseNumber,
        licenseType: (driver as any).licenseType,
        licenseExpiry: (driver as any).licenseExpiry,
        status: driver.status,
        userType: (driver as any).userType,
        vendor: (driver as any).vendors || null,
      },
    });
  } catch (error: any) {
    logger.error('Get driver error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get driver info', details: error?.message },
      { status: 500 }
    );
  }
}
