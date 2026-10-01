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
        address: (driver as any).address ?? null,
        pincode: (driver as any).pincode ?? null,
        slug: (driver as any).slug ?? null,
        bio: (driver as any).bio ?? null,
        yearsExperience: (driver as any).yearsExperience ?? null,
        isProfilePublic: (driver as any).isProfilePublic ?? true,
        vendor: (driver as any).vendors || null,
        emergencyContact: (driver as any).emergencyContact ?? null,
        emergencyPhone: (driver as any).emergencyPhone ?? null,
        // This endpoint is only ever read by the driver themselves (about
        // their own account), so the full bank fields are fine to return —
        // the edit form needs them to let a driver review/change what's on
        // file. accountNumberLast4 stays too, for screens (the profile view
        // card) that only want a masked summary, not the full number.
        bankDetailsComplete: Boolean(
          (driver as any).bankName && (driver as any).accountNumber && (driver as any).ifscCode
        ),
        bankName: (driver as any).bankName ?? null,
        accountHolderName: (driver as any).accountHolderName ?? null,
        accountNumber: (driver as any).accountNumber ?? null,
        accountNumberLast4: (driver as any).accountNumber ? String((driver as any).accountNumber).slice(-4) : null,
        ifscCode: (driver as any).ifscCode ?? null,
        upiId: (driver as any).upiId ?? null,
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
