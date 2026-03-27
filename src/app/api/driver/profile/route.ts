import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/auth/driver-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const isStaff = (driver as any).userType === 'vendor_staff';

  try {
    const body = await request.json();
    const {
      name, address, city, state, pincode, dateOfBirth,
      licenseNumber, licenseType, licenseExpiry,
      bankName, accountHolderName, accountNumber, ifscCode,
      emergencyContact, emergencyPhone,
    } = body;

    if (name && !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
    }

    const data: any = {
      ...(name !== undefined && { name: name.trim() }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
      ...(licenseNumber !== undefined && { licenseNumber }),
      ...(licenseType !== undefined && { licenseType }),
      ...(licenseExpiry !== undefined && { licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null }),
      ...(bankName !== undefined && { bankName }),
      ...(accountHolderName !== undefined && { accountHolderName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(ifscCode !== undefined && { ifscCode }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
    };

    if (isStaff) {
      await prisma.vendor_staff.update({ where: { id: driver.id }, data });
    } else {
      await prisma.drivers.update({ where: { id: driver.id }, data });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
