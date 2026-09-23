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
      bankName, accountHolderName, accountNumber, ifscCode, upiId,
      emergencyContact, emergencyPhone,
      bio, yearsExperience, isProfilePublic, slug,
    } = body;

    if (name && !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
    }
    // Only enforced when the field is actually part of this request — partial
    // updates like the public-profile slug toggle never send these.
    if (licenseNumber !== undefined && !String(licenseNumber).trim()) {
      return NextResponse.json({ success: false, error: 'License number is required' }, { status: 400 });
    }
    if (licenseType !== undefined && !String(licenseType).trim()) {
      return NextResponse.json({ success: false, error: 'License type is required' }, { status: 400 });
    }
    if (licenseExpiry !== undefined && !licenseExpiry) {
      return NextResponse.json({ success: false, error: 'License expiry date is required' }, { status: 400 });
    }
    if (upiId && !/^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(String(upiId).trim())) {
      return NextResponse.json({ success: false, error: 'Enter a valid UPI ID (e.g. name@okhdfcbank)' }, { status: 400 });
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
      ...(upiId !== undefined && { upiId: upiId ? String(upiId).trim() : null }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
      // Public profile (/captain/<slug>)
      ...(bio !== undefined && { bio }),
      ...(yearsExperience !== undefined && { yearsExperience: yearsExperience === null || yearsExperience === '' ? null : Number(yearsExperience) }),
      ...(isProfilePublic !== undefined && { isProfilePublic: !!isProfilePublic }),
    };

    // Slug: normalize + ensure unique within the relevant driver table.
    if (slug !== undefined) {
      const normalized = String(slug || '')
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!normalized) {
        data.slug = null;
      } else if (normalized.length < 3) {
        return NextResponse.json({ success: false, error: 'Slug must be at least 3 characters' }, { status: 400 });
      } else {
        const model: any = isStaff ? prisma.vendor_staff : prisma.drivers;
        const clash = await model.findFirst({ where: { slug: normalized, NOT: { id: driver.id } }, select: { id: true } });
        if (clash) {
          return NextResponse.json({ success: false, error: 'That profile link is already taken' }, { status: 409 });
        }
        data.slug = normalized;
      }
    }

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
