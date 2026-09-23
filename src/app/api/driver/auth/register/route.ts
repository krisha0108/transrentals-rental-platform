import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { generateDid } from '@/lib/utils/generate-did';
import { getAllActiveAdmins, notifyManagers } from '@/lib/notifications/manager-notify';

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

function isAtLeast18(dob: Date): boolean {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
}

// Mirrors the format check in the vendor's driver register page — server
// side, so a direct API call can't skip past what the form already enforces.
const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DN', 'DH', 'DL', 'GA', 'GJ',
  'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ',
  'NL', 'OD', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
];
const DL_NUMBER_REGEX = /^([A-Z]{2})(\d{2})(\d{4})(\d{7})$/;

function normalizeAndValidateDlNumber(raw: unknown): { value: string | null; error: string | null } {
  if (typeof raw !== 'string') return { value: null, error: 'License number is required' };
  const value = raw.trim().toUpperCase().replace(/[\s-]/g, '');
  const match = DL_NUMBER_REGEX.exec(value);
  if (!match) {
    return { value: null, error: 'Enter a valid 15-character DL number (e.g. DL0120110012345), or check "issued before 2011" if yours is an older licence.' };
  }
  const [, stateCode, , yearStr] = match;
  if (!INDIAN_STATE_CODES.includes(stateCode)) {
    return { value: null, error: `"${stateCode}" isn't a recognized state/UT code` };
  }
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  if (year < 1950 || year > currentYear) {
    return { value: null, error: `License issue year (${year}) looks invalid` };
  }
  return { value, error: null };
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
      aadharNumber, licenseNumber, licenseType, licenseExpiry, isOldLicense,
      bankName, accountHolderName, accountNumber, ifscCode,
      emergencyContact, emergencyPhone,
    } = body;

    // Required fields
    if (!name || !phone || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, phone, email and password are required' }, { status: 400 });
    }

    // Pre-2011 booklet-format licences don't follow a single standard format
    // across states, so a self-declared "old licence" checkbox skips the
    // strict regex and just requires a plausible, non-trivial value instead.
    let normalizedLicenseNumber: string | null;
    if (isOldLicense) {
      const trimmed = typeof licenseNumber === 'string' ? licenseNumber.trim().toUpperCase() : '';
      if (trimmed.length < 4) {
        return NextResponse.json({ success: false, error: 'Enter your licence number exactly as printed on your card' }, { status: 400 });
      }
      normalizedLicenseNumber = trimmed;
    } else {
      const dlCheck = normalizeAndValidateDlNumber(licenseNumber);
      if (dlCheck.error) {
        return NextResponse.json({ success: false, error: dlCheck.error }, { status: 400 });
      }
      normalizedLicenseNumber = dlCheck.value;
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const parsedDob = safeDate(dateOfBirth);
    if (dateOfBirth && (!parsedDob || !isAtLeast18(parsedDob))) {
      return NextResponse.json(
        { success: false, error: 'You must be at least 18 years old to register as a driver' },
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
        dateOfBirth: parsedDob,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        aadharNumber: aadharNumber || null,
        licenseNumber: normalizedLicenseNumber,
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

    // Let admins know a new driver signed up. Awaited so it actually runs
    // before the response goes out (this route can run somewhere that kills
    // work after the response), but notifyManagers swallows its own
    // failures — it can never fail or slow down registration itself.
    await notifyManagers(await getAllActiveAdmins(), {
      type: 'NEW_DRIVER_REGISTRATION',
      title: 'New driver registered',
      body: `${driver.name} (${normalizedPhone}) just signed up as a driver.`,
      link: `/admin/drivers/${driver.id}`,
      dedupeKey: driver.id,
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
        id: driver.id, did: driver.did, name: driver.name, email: driver.email,
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
