import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import {
  checkRateLimit,
  RATE_LIMITS,
  checkLoginAllowed,
  recordFailedLogin,
  clearLockoutOnSuccess,
  createOTP,
  verifyOTP,
  createAccessToken,
  generateFingerprint,
  logger,
} from '@/lib/security';
import { sendOTPEmail } from '@/lib/services/email-service';
import { generateCustomerId } from '@/lib/utils/id-generator';

// Helper to get client IP
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// POST /api/customer/auth - Login or Register
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);

  try {
    // Check if database is available
    if (!prisma) {
      logger.error('Prisma client not available - database not connected');
      return NextResponse.json(
        { status: 'error', message: 'Database not available. Please try again later.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Apply rate limiting based on action type
    let rateLimitConfig = RATE_LIMITS.api;
    let rateLimitKey = 'customer-auth';

    switch (action) {
      case 'login':
      case 'register':
      case 'google-login':
        rateLimitConfig = RATE_LIMITS.login;
        rateLimitKey = `customer-${action}`;
        break;
      case 'send-otp':
      case 'verify-otp':
        rateLimitConfig = RATE_LIMITS.otp;
        rateLimitKey = `customer-otp`;
        break;
      case 'forgot-password':
      case 'reset-password':
        rateLimitConfig = RATE_LIMITS.passwordReset;
        rateLimitKey = `customer-password-reset`;
        break;
    }

    // Check rate limit
    const { limited, remaining, resetIn } = checkRateLimit(request, rateLimitConfig, rateLimitKey);
    if (limited) {
      logger.logSecurityEvent('Rate limit exceeded', 'medium', { action, ip });
      return NextResponse.json(
        { status: 'error', message: 'Too many requests. Please try again later.', retryAfter: resetIn },
        { status: 429, headers: { 'Retry-After': String(resetIn) } }
      );
    }

    let response: NextResponse;

    switch (action) {
      case 'login':
        response = await handleLogin(body, ip, request);
        break;
      case 'register':
        response = await handleRegister(body, ip);
        break;
      case 'check-exists':
        response = await handleCheckExists(body);
        break;
      case 'send-otp':
        response = await handleSendOTP(body);
        break;
      case 'verify-otp':
        response = await handleVerifyOTP(body, request);
        break;
      case 'forgot-password':
        response = await handleForgotPassword(body);
        break;
      case 'reset-password':
        response = await handleResetPassword(body);
        break;
      case 'google-login':
        response = await handleGoogleLogin(body, request);
        break;
      case 'set-password':
        response = await handleSetPassword(body, request);
        break;
      default:
        response = NextResponse.json(
          { status: 'error', message: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetIn));

    const duration = Date.now() - startTime;
    logger.debug('Customer auth request', { action, duration, status: response.status });

    return response;
  } catch (error) {
    logger.error('Customer auth error', error);
    return NextResponse.json(
      { status: 'error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// Handle customer login with account lockout
async function handleLogin(
  body: { email: string; password: string },
  ip: string,
  request: NextRequest
): Promise<NextResponse> {
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { status: 'error', message: 'Email and password are required' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  // Check if account is locked
  const lockoutCheck = checkLoginAllowed(normalizedEmail, ip);
  if (!lockoutCheck.allowed) {
    logger.logSecurityEvent('Login blocked - account locked', 'medium', { email: normalizedEmail, ip });
    return NextResponse.json(
      {
        status: 'error',
        message: lockoutCheck.reason,
        unlockIn: lockoutCheck.unlockIn,
      },
      { status: 429 }
    );
  }

  // Find customer by email
  const customer = await prisma.customers.findFirst({
    where: { email: normalizedEmail },
  });

  if (!customer) {
    // Record failed attempt (but don't reveal if user exists)
    recordFailedLogin(normalizedEmail, ip);
    return NextResponse.json(
      { status: 'error', message: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Check if customer is banned
  if (customer.isBanned) {
    logger.logSecurityEvent('Banned customer login attempt', 'high', { customerId: customer.id });
    return NextResponse.json(
      { status: 'error', message: 'Your account has been suspended. Please contact support.' },
      { status: 403 }
    );
  }

  // Check if customer has a password
  if (!customer.password) {
    return NextResponse.json(
      { status: 'error', message: 'Please set a password first or use Google login' },
      { status: 401 }
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, customer.password);

  if (!isValidPassword) {
    const lockoutResult = recordFailedLogin(normalizedEmail, ip);
    logger.logSecurityEvent('Failed login attempt', 'low', { email: normalizedEmail, ip });

    if (lockoutResult.locked) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Too many failed attempts. Account temporarily locked.',
          unlockIn: lockoutResult.unlockIn,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid email or password',
        attemptsRemaining: lockoutResult.attemptsRemaining,
      },
      { status: 401 }
    );
  }

  // Successful login - clear lockout and generate token
  clearLockoutOnSuccess(normalizedEmail, ip);

  const fingerprint = generateFingerprint(
    request.headers.get('user-agent') || undefined,
    ip
  );

  const { token, expiresAt, expiresIn } = await createAccessToken(customer.id, fingerprint);

  // Update last login
  await prisma.customers.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => { /* ignore update errors */ });

  logger.info('Customer login successful', { customerId: customer.id });

  return NextResponse.json({
    status: 'success',
    message: 'Login successful',
    token,
    expiresAt: expiresAt.toISOString(),
    expiresIn,
    customers: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar: customer.avatar || null,
    },
  });
}

// Check if customer exists by phone or email
async function handleCheckExists(body: { phone?: string; email?: string }): Promise<NextResponse> {
  const { phone, email } = body;

  if (!phone && !email) {
    return NextResponse.json(
      { status: 'error', message: 'Phone or email is required' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  // Build query conditions
  const conditions: { phone?: string; email?: string }[] = [];
  if (phone) {
    conditions.push({ phone: phone.trim() });
  }
  if (email) {
    conditions.push({ email: email.toLowerCase().trim() });
  }

  // Find customer by phone or email
  const customer = await prisma.customers.findFirst({
    where: { OR: conditions },
  });

  if (customer) {
    return NextResponse.json({
      status: 'success',
      exists: true,
      customers: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        hasPassword: !!customer.password,
      },
    });
  }

  return NextResponse.json({
    status: 'success',
    exists: false,
  });
}

// Handle customer registration
async function handleRegister(
  body: { name: string; email: string; phone: string; password: string },
  ip: string
): Promise<NextResponse> {
  const { name, email, phone, password } = body;

  if (!name || !email || !phone || !password) {
    return NextResponse.json(
      { status: 'error', message: 'All fields are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { status: 'error', message: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check if customer already exists
  const existingCustomer = await prisma.customers.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    },
  });

  if (existingCustomer) {
    if (existingCustomer.email === normalizedEmail) {
      return NextResponse.json(
        { status: 'error', message: 'Email already registered' },
        { status: 400 }
      );
    }
    if (existingCustomer.phone === normalizedPhone) {
      return NextResponse.json(
        { status: 'error', message: 'Phone number already registered' },
        { status: 400 }
      );
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create customer
  const customerId = await generateCustomerId();
  const customer = await prisma.customers.create({
    data: {
      id: customerId,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
    },
  });

  // Generate token
  const fingerprint = generateFingerprint(undefined, ip);
  const { token, expiresAt, expiresIn } = await createAccessToken(customer.id, fingerprint);

  logger.info('Customer registration successful', { customerId: customer.id });

  return NextResponse.json({
    status: 'success',
    message: 'Registration successful',
    token,
    expiresAt: expiresAt.toISOString(),
    expiresIn,
    customers: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      image: null,
    },
  });
}

// Handle send OTP using secure OTP manager
async function handleSendOTP(
  body: { name: string; email: string; phone: string; password: string }
): Promise<NextResponse> {
  const { name, email, phone, password } = body;

  if (!name || !email || !phone || !password) {
    return NextResponse.json(
      { status: 'error', message: 'All fields are required' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check if customer already exists
  const existingCustomer = await prisma.customers.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    },
  });

  if (existingCustomer) {
    if (existingCustomer.email === normalizedEmail) {
      return NextResponse.json(
        { status: 'error', message: 'Email already registered. Please login.' },
        { status: 400 }
      );
    }
    if (existingCustomer.phone === normalizedPhone) {
      return NextResponse.json(
        { status: 'error', message: 'Phone number already registered. Please login.' },
        { status: 400 }
      );
    }
  }

  // Store registration data temporarily (will be used on OTP verification)
  // We store the password hash to avoid storing plaintext
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.settings.upsert({
      where: { key: `pending_registration:${normalizedEmail}` },
      update: {
        value: JSON.stringify({ name, email: normalizedEmail, phone: normalizedPhone, password: hashedPassword }),
        updatedAt: new Date(),
      },
      create: {
        key: `pending_registration:${normalizedEmail}`,
        value: JSON.stringify({ name, email: normalizedEmail, phone: normalizedPhone, password: hashedPassword }),
        type: 'JSON',
        group: 'pending_registration',
      },
    });
  } catch (error) {
    logger.error('Failed to store pending registration', error);
  }

  // Generate OTP using secure OTP manager
  const otpResult = await createOTP(normalizedEmail, 'registration');

  if (!otpResult.success) {
    return NextResponse.json(
      { status: 'error', message: otpResult.error, waitSeconds: otpResult.waitSeconds },
      { status: 429 }
    );
  }

  // Send OTP via email
  const emailResult = await sendOTPEmail(normalizedEmail, otpResult.otp!, 'registration');

  if (!emailResult.success) {
    logger.error('Failed to send registration OTP email', { email: normalizedEmail, error: emailResult.error });
    return NextResponse.json(
      { status: 'error', message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }

  logger.info('Registration OTP sent successfully', { email: normalizedEmail });

  return NextResponse.json({
    status: 'success',
    message: 'OTP sent to your email',
    expiresIn: otpResult.expiresIn,
  });
}

// Handle verify OTP and complete registration
async function handleVerifyOTP(
  body: { email: string; otp: string },
  request: NextRequest
): Promise<NextResponse> {
  const { email, otp } = body;

  if (!email || !otp) {
    return NextResponse.json(
      { status: 'error', message: 'Email and OTP are required' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP using secure OTP manager
  const verifyResult = await verifyOTP(normalizedEmail, otp, 'registration');

  if (!verifyResult.valid) {
    return NextResponse.json(
      {
        status: 'error',
        message: verifyResult.error,
        attemptsRemaining: verifyResult.attemptsRemaining,
      },
      { status: 400 }
    );
  }

  // Get pending registration data
  let registrationData: { name: string; email: string; phone: string; password: string } | null = null;

  try {
    const pendingRecord = await prisma.settings.findUnique({
      where: { key: `pending_registration:${normalizedEmail}` },
    });

    if (pendingRecord) {
      registrationData = JSON.parse(pendingRecord.value);
      // Clean up pending registration
      await prisma.settings.delete({ where: { key: `pending_registration:${normalizedEmail}` } });
    }
  } catch (error) {
    logger.error('Failed to retrieve pending registration', error);
  }

  if (!registrationData) {
    return NextResponse.json(
      { status: 'error', message: 'Registration data expired. Please start again.' },
      { status: 400 }
    );
  }

  // Create customer (password is already hashed)
  const customerId = await generateCustomerId();
  const customer = await prisma.customers.create({
    data: {
      id: customerId,
      name: registrationData.name,
      email: registrationData.email,
      phone: registrationData.phone,
      password: registrationData.password,
      isEmailVerified: true,
    },
  });

  // Generate token
  const ip = getClientIP(request);
  const fingerprint = generateFingerprint(request.headers.get('user-agent') || undefined, ip);
  const { token, expiresAt, expiresIn } = await createAccessToken(customer.id, fingerprint);

  logger.info('Customer registration via OTP successful', { customerId: customer.id });

  return NextResponse.json({
    status: 'success',
    message: 'Registration successful',
    token,
    expiresAt: expiresAt.toISOString(),
    expiresIn,
    customers: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      image: null,
    },
  });
}

// Handle forgot password
async function handleForgotPassword(body: { email: string }): Promise<NextResponse> {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { status: 'error', message: 'Email is required' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if customer exists
  const customer = await prisma.customers.findFirst({
    where: { email: normalizedEmail },
  });

  // Always return success to prevent email enumeration
  if (!customer) {
    logger.debug('Password reset requested for non-existent email', { email: normalizedEmail });
    return NextResponse.json({
      status: 'success',
      message: 'If an account exists with this email, you will receive an OTP.',
    });
  }

  // Generate OTP using secure OTP manager
  const otpResult = await createOTP(normalizedEmail, 'password_reset');

  if (!otpResult.success) {
    return NextResponse.json(
      { status: 'error', message: otpResult.error, waitSeconds: otpResult.waitSeconds },
      { status: 429 }
    );
  }

  // Send OTP via email
  const emailResult = await sendOTPEmail(normalizedEmail, otpResult.otp!, 'password-reset');

  if (!emailResult.success) {
    logger.error('Failed to send password reset OTP email', { email: normalizedEmail, error: emailResult.error });
    // In development, log OTP to console for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔐 ==========================================`);
      console.log(`🔐 DEV MODE - Password Reset OTP`);
      console.log(`🔐 Email: ${normalizedEmail}`);
      console.log(`🔐 OTP: ${otpResult.otp}`);
      console.log(`🔐 ==========================================\n`);
      return NextResponse.json({
        status: 'success',
        message: 'If an account exists with this email, you will receive an OTP.',
        expiresIn: otpResult.expiresIn,
      });
    }
    // Still return success to prevent email enumeration
    return NextResponse.json({
      status: 'success',
      message: 'If an account exists with this email, you will receive an OTP.',
    });
  }

  logger.info('Password reset OTP sent successfully', { email: normalizedEmail });

  return NextResponse.json({
    status: 'success',
    message: 'If an account exists with this email, you will receive an OTP.',
    expiresIn: otpResult.expiresIn,
  });
}

// Handle reset password
async function handleResetPassword(
  body: { email: string; otp: string; password: string }
): Promise<NextResponse> {
  const { email, otp, password } = body;

  if (!email || !otp || !password) {
    return NextResponse.json(
      { status: 'error', message: 'All fields are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { status: 'error', message: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP
  const verifyResult = await verifyOTP(normalizedEmail, otp, 'password_reset');

  if (!verifyResult.valid) {
    return NextResponse.json(
      {
        status: 'error',
        message: verifyResult.error,
        attemptsRemaining: verifyResult.attemptsRemaining,
      },
      { status: 400 }
    );
  }

  // Update password
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await prisma.customers.updateMany({
    where: { email: normalizedEmail },
    data: { password: hashedPassword },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { status: 'error', message: 'Customer not found' },
      { status: 404 }
    );
  }

  logger.info('Password reset successful', { email: normalizedEmail });

  return NextResponse.json({
    status: 'success',
    message: 'Password reset successful. Please login with your new password.',
  });
}

// Handle set password for existing customer without password
async function handleSetPassword(
  body: { email: string; password: string; customerId?: string },
  request: NextRequest
): Promise<NextResponse> {
  const { email, password, customerId } = body;

  if (!email || !password) {
    return NextResponse.json(
      { status: 'error', message: 'Email and password are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { status: 'error', message: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find customer
  const whereClause: { email: string; id?: string } = { email: normalizedEmail };
  if (customerId) {
    whereClause.id = customerId;
  }

  const customer = await prisma.customers.findFirst({
    where: whereClause,
  });

  if (!customer) {
    return NextResponse.json(
      { status: 'error', message: 'Customer not found' },
      { status: 404 }
    );
  }

  // Check if customer already has a password
  if (customer.password) {
    return NextResponse.json(
      { status: 'error', message: 'Password already set. Please use login instead.' },
      { status: 400 }
    );
  }

  // Hash and set password
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.customers.update({
    where: { id: customer.id },
    data: { password: hashedPassword },
  });

  // Generate token
  const ip = getClientIP(request);
  const fingerprint = generateFingerprint(request.headers.get('user-agent') || undefined, ip);
  const { token, expiresAt, expiresIn } = await createAccessToken(customer.id, fingerprint);

  logger.info('Customer password set', { customerId: customer.id });

  return NextResponse.json({
    status: 'success',
    message: 'Password set successfully. You are now logged in.',
    token,
    expiresAt: expiresAt.toISOString(),
    expiresIn,
    customers: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar: customer.avatar || null,
    },
  });
}

// Handle Google login
async function handleGoogleLogin(
  body: { idToken: string; email?: string; name?: string },
  request: NextRequest
): Promise<NextResponse> {
  console.log('🔵 Google login started');
  const { idToken, email: providedEmail, name: providedName } = body;

  if (!idToken) {
    console.log('❌ No idToken provided');
    return NextResponse.json(
      { status: 'error', message: 'Google token is required' },
      { status: 400 }
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    console.log('❌ Prisma not available');
    return NextResponse.json(
      { status: 'error', message: 'Database not available. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    let email = providedEmail;
    let name = providedName;
    let picture = null;

    console.log('🔵 Step 1: Decoding token, providedEmail:', providedEmail, 'providedName:', providedName);

    // Try to decode the Google JWT token if email not provided
    if (!email) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          email = payload.email;
          name = name || payload.name;
          picture = payload.picture;
          console.log('🔵 Decoded from token - email:', email, 'name:', name);
        }
      } catch (decodeError) {
        console.log('❌ Failed to decode token:', decodeError);
        logger.error('Failed to decode Google token', decodeError);
        // Continue with provided email/name if available
      }
    }

    if (!email) {
      console.log('❌ No email found');
      return NextResponse.json(
        { status: 'error', message: 'Could not get email from Google' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔵 Step 2: Searching for customer with email:', normalizedEmail);

    // Find or create customer
    let customer = await prisma.customers.findFirst({
      where: { email: normalizedEmail },
    });

    console.log('🔵 Step 3: Customer found?', !!customer);

    if (!customer) {
      console.log('🔵 Step 4: Creating new customer with data:', {
        name: name || email.split('@')[0],
        email: normalizedEmail,
        phone: null,
        avatar: picture || null,
        isEmailVerified: true,
      });

      // Create new customer from Google data
      const customerId = await generateCustomerId();
      customer = await prisma.customers.create({
        data: {
          id: customerId,
          name: name || email.split('@')[0],
          email: normalizedEmail,
          phone: null, // Google doesn't provide phone
          avatar: picture || null,
          isEmailVerified: true,
        },
      });
      console.log('✅ Customer created successfully, id:', customer.id);
      logger.info('New customer created via Google login', { customerId: customer.id });
    } else {
      console.log('🔵 Step 4: Using existing customer, id:', customer.id);
      // Check if banned
      if (customer.isBanned) {
        console.log('❌ Customer is banned');
        logger.logSecurityEvent('Banned customer Google login attempt', 'high', { customerId: customer.id });
        return NextResponse.json(
          { status: 'error', message: 'Your account has been suspended. Please contact support.' },
          { status: 403 }
        );
      }
    }

    console.log('🔵 Step 5: Generating token for customer:', customer.id);
    // Generate token
    const ip = getClientIP(request);
    const fingerprint = generateFingerprint(request.headers.get('user-agent') || undefined, ip);
    const { token, expiresAt, expiresIn } = await createAccessToken(customer.id, fingerprint);

    console.log('🔵 Step 6: Updating last login');
    // Update last login
    await prisma.customers.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    }).catch((err) => {
      console.log('⚠️ Failed to update lastLoginAt:', err);
    });

    console.log('✅ Google login successful, returning response');
    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      token,
      expiresAt: expiresAt.toISOString(),
      expiresIn,
      customers: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar || null,
      },
    });
  } catch (error) {
    console.log('❌ GOOGLE LOGIN ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };
    console.log('Error details:', errorDetails);
    logger.error('Google login error', error);

    // Return more detailed error in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        status: 'error',
        message: isDevelopment ? `Google login failed: ${errorMessage}` : 'Failed to verify Google token',
        ...(isDevelopment && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}
