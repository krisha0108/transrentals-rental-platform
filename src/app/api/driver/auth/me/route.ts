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
        did: (driver as any).did ?? null,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        profilePhoto: (driver as any).profilePhoto,
        licenseNumber: (driver as any).licenseNumber,
        licenseType: (driver as any).licenseType,
        licenseExpiry: (driver as any).licenseExpiry,
        status: driver.status,
        userType: (driver as any).userType,
        joiningDate: (driver as any).joiningDate ?? null,
        createdAt: (driver as any).createdAt ?? null,
        city: (driver as any).city ?? null,
        state: (driver as any).state ?? null,
        slug: (driver as any).slug ?? null,
        bio: (driver as any).bio ?? null,
        yearsExperience: (driver as any).yearsExperience ?? null,
        isProfilePublic: (driver as any).isProfilePublic ?? true,
        vendor: (driver as any).vendors || null,
        // Payout details aren't shown here (the raw account number/IFSC
        // aren't needed just to render a dashboard) — only whether they're
        // complete, so the dashboard can prompt a driver to fill them in.
        bankDetailsComplete: Boolean(
          (driver as any).bankName && (driver as any).accountNumber && (driver as any).ifscCode
        ),
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
