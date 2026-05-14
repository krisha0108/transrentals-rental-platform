import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

// Strip whitespace, dashes, and Indian country-code prefixes ('+91' or leading
// '0') so the same physical number always normalizes to the same 10-digit form.
// Without this, "+91 97379 65551", "9737965551" and "09737965551" each pass
// the unique check independently and either create duplicates or 500 randomly.
function normalizeIndianPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
}

// `new Date('')` and `new Date('not a date')` yield Invalid Date which Prisma
// throws on at create time. Return null instead so the column stays NULL.
function safeDate(input: unknown): Date | null {
  if (!input) return null;
  const d = new Date(input as any);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

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

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
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

    // Pre-check existing (still useful for the friendly 409, even though a race
    // can sneak past — the P2002 catch below handles that case).
    const existing = await prisma.drivers.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: normalizedPhone }] },
      select: { id: true, email: true, phone: true },
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
        name: String(name).trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        dateOfBirth: safeDate(dateOfBirth),
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        salary: salary != null && !isNaN(parseFloat(salary)) ? parseFloat(salary) : 0,
        joiningDate: safeDate(joiningDate) ?? new Date(),
        aadharNumber: aadharNumber || null,
        panNumber: panNumber || null,
        licenseNumber: licenseNumber || null,
        licenseType: licenseType || null,
        licenseExpiry: safeDate(licenseExpiry),
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
    // P2002 = Prisma unique constraint violation. Happens on race conditions
    // (two simultaneous registrations with same phone/email) or when the
    // pre-check misses due to slight format differences slipping through.
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
