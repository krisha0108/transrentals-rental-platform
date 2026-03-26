import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name, phone, email, password,
      dateOfBirth, address, city, state, pincode,
      salary, joiningDate,
      aadharNumber, panNumber,
      licenseNumber, licenseType, licenseExpiry,
      bankName, accountHolderName, accountNumber, ifscCode,
      emergencyContact, emergencyPhone,
      fcmToken,
    } = body;

    // Required fields
    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await prisma.drivers.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: phone.trim() }] },
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? 'Email' : 'Phone number';
      return NextResponse.json(
        { success: false, error: `${field} already registered` },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const driver = await prisma.drivers.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        salary: salary ? parseFloat(salary) : 0,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        aadharNumber: aadharNumber || null,
        panNumber: panNumber || null,
        licenseNumber: licenseNumber || null,
        licenseType: licenseType || null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        bankName: bankName || null,
        accountHolderName: accountHolderName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        fcmToken: fcmToken || null,
        status: 'ACTIVE', // auto-approve
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT
    const token = await new SignJWT({
      driverAppId: driver.id,
      email: driver.email,
      name: driver.name,
      role: 'driver-app',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    const { password: _, ...driverData } = driver;

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      driver: driverData,
      token,
    });
  } catch (error: any) {
    console.error('Driver register error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed', details: error?.message },
      { status: 500 }
    );
  }
}
