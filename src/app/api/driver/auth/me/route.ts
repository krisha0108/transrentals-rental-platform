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
        // Full account number/IFSC aren't returned here — just enough for the
        // profile page to show "bank name, ****1234" without exposing the
        // whole number over the wire for a screen that doesn't need it.
        bankDetailsComplete: Boolean(
          (driver as any).bankName && (driver as any).accountNumber && (driver as any).ifscCode
        ),
        bankName: (driver as any).bankName ?? null,
        accountNumberLast4: (driver as any).accountNumber ? String((driver as any).accountNumber).slice(-4) : null,
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
