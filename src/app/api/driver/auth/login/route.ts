import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import {
  checkRateLimit, RATE_LIMITS, checkLoginAllowed,
  recordFailedLogin, clearLockoutOnSuccess, logger,
} from '@/lib/security';
import { addFcmToken } from '@/lib/utils/driver-notification-sender';
import { generateDid } from '@/lib/utils/generate-did';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown';
}

function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('driver-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    const { limited, remaining, resetIn } = checkRateLimit(request, RATE_LIMITS.login, 'driver-login');
    if (limited) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.', retryAfter: resetIn },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identifier: rawIdentifier, email: rawEmail, password, fcmToken } = body;
    const raw = rawIdentifier || rawEmail;
    if (!raw || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const isDriverId = /^dr-\d+$/i.test(raw.trim());
    const normalizedIdentifier = raw.toLowerCase().trim();

    const lockoutCheck = checkLoginAllowed(normalizedIdentifier, ip);
    if (!lockoutCheck.allowed) {
      return NextResponse.json({ success: false, error: lockoutCheck.reason, unlockIn: lockoutCheck.unlockIn }, { status: 429 });
    }

    // ── 1. Try vendor_staff first ──────────────────────────────────────────
    const staffDriver = await prisma.vendor_staff.findFirst({
      where: isDriverId ? { did: normalizedIdentifier } : { email: normalizedIdentifier },
      include: { vendors: { select: { id: true, businessName: true, phone: true } } },
    });

    if (staffDriver) {
      if (!staffDriver.password) {
        return NextResponse.json({ success: false, error: 'Account not set up for login. Contact your vendor.' }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, staffDriver.password);
      if (!valid) {
        const r = recordFailedLogin(normalizedIdentifier, ip);
        if (r.locked) return NextResponse.json({ success: false, error: 'Too many failed attempts. Account temporarily locked.', unlockIn: r.unlockIn }, { status: 429 });
        return NextResponse.json({ success: false, error: 'Invalid email or password', attemptsRemaining: r.attemptsRemaining }, { status: 401 });
      }
      if (staffDriver.status !== 'ACTIVE') return NextResponse.json({ success: false, error: 'Your account is inactive. Contact your vendor.' }, { status: 401 });
      if (staffDriver.role !== 'DRIVER') return NextResponse.json({ success: false, error: 'Only drivers can access the driver portal.' }, { status: 401 });

      clearLockoutOnSuccess(normalizedIdentifier, ip);

      // Generate DID if missing (for existing vendor staff drivers)
      let staffDid = staffDriver.did;
      if (!staffDid) {
        try {
          staffDid = await generateDid();
          await prisma.vendor_staff.update({
            where: { id: staffDriver.id },
            data: { did: staffDid },
          });
          logger.info('Generated DID for existing vendor staff driver', { staffId: staffDriver.id, did: staffDid });
        } catch (error) {
          logger.error('Failed to generate DID for vendor staff driver', error);
        }
      }

      const token = await new SignJWT({
        driverId: staffDriver.id, vendorId: staffDriver.vendorId,
        email: staffDriver.email, name: staffDriver.name,
        role: 'driver', userType: 'vendor_staff',
      }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').setIssuedAt().sign(JWT_SECRET);

      // Append mobile FCM token to array (supports multiple devices)
      if (fcmToken) {
        await Promise.all([
          addFcmToken(`driver_mobile_fcm_${staffDriver.id}`, fcmToken),
          prisma.vendor_staff.update({ where: { id: staffDriver.id }, data: { fcmToken } }),
        ]).catch(() => {});
      }

      const response = NextResponse.json({
        success: true, message: 'Login successful',
        driver: {
          id: staffDriver.id, did: staffDid, name: staffDriver.name, email: staffDriver.email,
          phone: staffDriver.phone, profilePhoto: staffDriver.profilePhoto,
          licenseNumber: staffDriver.licenseNumber, licenseType: staffDriver.licenseType,
          licenseExpiry: staffDriver.licenseExpiry,
          vendor: staffDriver.vendors, userType: 'vendor_staff',
        },
        token,
      });
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      setTokenCookie(response, token);
      return response;
    }

    // ── 2. Try independent driver ──────────────────────────────────────────
    const indDriver = await prisma.drivers.findFirst({
      where: isDriverId ? { did: normalizedIdentifier } : { email: normalizedIdentifier },
    });

    if (!indDriver) {
      recordFailedLogin(normalizedIdentifier, ip);
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, indDriver.password);
    if (!valid) {
      const r = recordFailedLogin(normalizedIdentifier, ip);
      if (r.locked) return NextResponse.json({ success: false, error: 'Too many failed attempts. Account temporarily locked.', unlockIn: r.unlockIn }, { status: 429 });
      return NextResponse.json({ success: false, error: 'Invalid email or password', attemptsRemaining: r.attemptsRemaining }, { status: 401 });
    }
    if (indDriver.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Your account is under review. Please wait for approval.' }, { status: 401 });
    }

    clearLockoutOnSuccess(normalizedIdentifier, ip);

    // Generate DID if missing (for existing drivers)
    let driverDid = indDriver.did;
    if (!driverDid) {
      try {
        driverDid = await generateDid();
        await prisma.drivers.update({
          where: { id: indDriver.id },
          data: { did: driverDid },
        });
        logger.info('Generated DID for existing driver', { driverId: indDriver.id, did: driverDid });
      } catch (error) {
        logger.error('Failed to generate DID for driver', error);
      }
    }

    const token = await new SignJWT({
      driverId: indDriver.id, email: indDriver.email,
      name: indDriver.name, role: 'driver', userType: 'independent',
    }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').setIssuedAt().sign(JWT_SECRET);

    // Append mobile FCM token to array (supports multiple devices)
    if (fcmToken) {
      await addFcmToken(`driver_mobile_fcm_${indDriver.id}`, fcmToken).catch(() => {});
    }

    const response = NextResponse.json({
      success: true, message: 'Login successful',
      driver: {
        id: indDriver.id, did: driverDid, name: indDriver.name, email: indDriver.email,
        phone: indDriver.phone, profilePhoto: indDriver.profilePhoto,
        licenseNumber: indDriver.licenseNumber, licenseType: indDriver.licenseType,
        licenseExpiry: indDriver.licenseExpiry, userType: 'independent',
      },
      token,
    });
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    setTokenCookie(response, token);
    logger.info('Independent driver login', { driverId: indDriver.id });
    return response;

  } catch (error) {
    logger.error('Driver login error', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
