import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getDriverAppUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  const { password: _, ...data } = user as any;
  return NextResponse.json({ success: true, driver: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getDriverAppUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const isStaff = (user as any).userType === 'vendor_staff';

  try {
    const body = await request.json();
    const {
      name, phone, dateOfBirth, address, city, state, pincode,
      aadharNumber, panNumber,
      licenseNumber, licenseType, licenseExpiry, licenseDocument,
      aadharDocument, panDocument, profilePhoto,
      bankName, accountHolderName, accountNumber, ifscCode,
      emergencyContact, emergencyPhone,
    } = body;

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(profilePhoto !== undefined && { profilePhoto }),
      ...(aadharNumber !== undefined && { aadharNumber }),
      ...(aadharDocument !== undefined && { aadharDocument }),
      ...(panNumber !== undefined && { panNumber }),
      ...(panDocument !== undefined && { panDocument }),
      ...(licenseNumber !== undefined && { licenseNumber }),
      ...(licenseType !== undefined && { licenseType }),
      ...(licenseExpiry !== undefined && { licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null }),
      ...(licenseDocument !== undefined && { licenseDocument }),
      ...(bankName !== undefined && { bankName }),
      ...(accountHolderName !== undefined && { accountHolderName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(ifscCode !== undefined && { ifscCode }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
    };

    let updated: any;

    if (isStaff) {
      // vendor_staff — check phone uniqueness in vendor_staff table
      if (phone && phone.trim() !== (user as any).phone) {
        const exists = await prisma.vendor_staff.findFirst({
          where: { phone: phone.trim(), id: { not: user.id } },
        });
        if (exists) {
          return NextResponse.json({ success: false, error: 'Phone already in use' }, { status: 409 });
        }
      }
      updated = await prisma.vendor_staff.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      // independent driver — check phone uniqueness in drivers table
      if (phone && phone.trim() !== (user as any).phone) {
        const exists = await prisma.drivers.findFirst({
          where: { phone: phone.trim(), id: { not: user.id } },
        });
        if (exists) {
          return NextResponse.json({ success: false, error: 'Phone already in use' }, { status: 409 });
        }
      }
      updated = await prisma.drivers.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    const { password: _, ...data } = updated as any;
    return NextResponse.json({ success: true, driver: { ...data, userType: (user as any).userType } });
  } catch (error: any) {
    console.error('[profile PATCH] error:', error?.message);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
