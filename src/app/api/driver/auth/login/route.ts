import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import {
  checkRateLimit,
  RATE_LIMITS,
  checkLoginAllowed,
  recordFailedLogin,
  clearLockoutOnSuccess,
  logger,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

// JWT secret for driver tokens
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'driver-secret-key'
);

// Helper to get client IP
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// POST - Driver login
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // Rate limiting
    const { limited, remaining, resetIn } = checkRateLimit(
      request,
      RATE_LIMITS.login,
      'driver-login'
    );

    if (limited) {
      logger.logSecurityEvent('Driver login rate limit exceeded', 'medium', { ip });
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.', retryAfter: resetIn },
        { status: 429, headers: { 'Retry-After': String(resetIn) } }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check account lockout
    const lockoutCheck = checkLoginAllowed(normalizedEmail, ip);
    if (!lockoutCheck.allowed) {
      logger.logSecurityEvent('Driver login blocked - account locked', 'medium', { email: normalizedEmail, ip });
      return NextResponse.json(
        {
          success: false,
          error: lockoutCheck.reason,
          unlockIn: lockoutCheck.unlockIn,
        },
        { status: 429 }
      );
    }

    // Find driver by email
    const driver = await prisma.vendor_staff.findUnique({
      where: { email: normalizedEmail },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
      },
    });

    if (!driver) {
      recordFailedLogin(normalizedEmail, ip);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if driver has a password
    if (!driver.password) {
      return NextResponse.json(
        { success: false, error: 'Account not set up for login. Contact your vendor.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, driver.password);
    if (!isValidPassword) {
      const lockoutResult = recordFailedLogin(normalizedEmail, ip);
      logger.logSecurityEvent('Failed driver login attempt', 'low', { email: normalizedEmail, ip });

      if (lockoutResult.locked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed attempts. Account temporarily locked.',
            unlockIn: lockoutResult.unlockIn,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
          attemptsRemaining: lockoutResult.attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // Check if driver is active
    if (driver.status !== 'ACTIVE') {
      logger.logSecurityEvent('Inactive driver login attempt', 'low', { driverId: driver.id });
      return NextResponse.json(
        { success: false, error: 'Your account is inactive. Contact your vendor.' },
        { status: 401 }
      );
    }

    // Check if driver role
    if (driver.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Only drivers can access the driver app' },
        { status: 401 }
      );
    }

    // Clear lockout on successful login
    clearLockoutOnSuccess(normalizedEmail, ip);

    // Generate JWT token
    const token = await new SignJWT({
      driverId: driver.id,
      vendorId: driver.vendorId,
      email: driver.email,
      name: driver.name,
      role: 'driver',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Token valid for 7 days
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Prepare driver data (exclude password)
    const { password: _, ...driverData } = driver;

    logger.info('Driver login successful', { driverId: driver.id, vendorId: driver.vendorId });

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      driver: {
        id: driverData.id,
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        profilePhoto: driverData.profilePhoto,
        licenseNumber: driverData.licenseNumber,
        licenseType: driverData.licenseType,
        licenseExpiry: driverData.licenseExpiry,
        vendor: driverData.vendor,
      },
      token,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetIn));

    // Set HTTP-only cookie for secure token storage
    response.cookies.set('driver-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Driver login error', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
