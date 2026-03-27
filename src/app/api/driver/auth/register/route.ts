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
      aadharNumber, licenseNumber, licenseType, licenseExpiry,
      bankName, accountHolderName, accountNumber, ifscCode,
      emergencyContact, emergencyPhone,
    } = body;

    // Required fields
    if (!name || !phone || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, phone, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicates
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.drivers.findUnique({ where: { email: normalizedEmail } }),
      prisma.drivers.findUnique({ where: { phone: phone.trim() } }),
    ]);
    if (existingEmail) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    if (existingPhone) return NextResponse.json({ success: false, error: 'Phone number already registered' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 10);

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
        aadharNumber: aadharNumber || null,
        licenseNumber: licenseNumber || null,
        licenseType: licenseType || null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        bankName: bankName || null,
        accountHolderName: accountHolderName || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        status: 'ACTIVE',
        role: 'DRIVER',
      },
    });

    // Generate JWT
    const token = await new SignJWT({
      driverId: driver.id, email: driver.email,
      name: driver.name, role: 'driver', userType: 'independent',
    }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').setIssuedAt().sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      driver: {
        id: driver.id, name: driver.name, email: driver.email,
        phone: driver.phone, userType: 'independent',
      },
      token,
    });

    response.cookies.set('driver-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Driver register error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
  }
}
