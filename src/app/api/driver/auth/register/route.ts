import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { generateDid } from '@/lib/utils/generate-did';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

// Strip whitespace/dashes/Indian country-code prefixes so the same physical
// number always normalizes to one 10-digit form (prevents dup rows + P2002
// surprises later).
function normalizeIndianPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
}

function safeDate(input: unknown): Date | null {
  if (!input) return null;
  const d = new Date(input as any);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
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
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)' },
        { status: 400 }
      );
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Pre-check duplicates (race still possible — handled in P2002 catch below)
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.drivers.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
      prisma.drivers.findUnique({ where: { phone: normalizedPhone }, select: { id: true } }),
    ]);
    if (existingEmail) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    if (existingPhone) return NextResponse.json({ success: false, error: 'Phone number already registered' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const did = await generateDid();

    const driver = await prisma.drivers.create({
      data: {
        did,
        name: String(name).trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        dateOfBirth: safeDate(dateOfBirth),
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        aadharNumber: aadharNumber || null,
        licenseNumber: licenseNumber || null,
        licenseType: licenseType || null,
        licenseExpiry: safeDate(licenseExpiry),
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
    if (error?.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(',') : String(error?.meta?.target || '');
      const field = target.includes('email') ? 'Email'
                  : target.includes('phone') ? 'Phone number'
                  : 'Account';
      return NextResponse.json(
        { success: false, error: `${field} already registered` },
        { status: 409 }
      );
    }
    console.error('Driver register error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed', details: error?.message },
      { status: 500 }
    );
  }
}
