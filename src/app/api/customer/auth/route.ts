import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
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

// The travel-agent provider is registered in the SHARED authOptions (used by
// /api/auth/[...nextauth]) — that uses the default NextAuth cookie name and is
// what the middleware/getToken read from.
const TA_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
const TA_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Try to authenticate the request as a travel agent (same email + password as
 * the agent's profile). If successful, set the NextAuth travel-agent session
 * cookie on the response and return a payload telling the client to redirect
 * to the travel-agent dashboard.
 */
async function tryTravelAgentLogin(
  email: string,
  password: string,
  request: NextRequest,
  ip: string,
): Promise<NextResponse | null> {
  if (!prisma) return null;

  const agent = await (prisma as any).travel_agents.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!agent || !agent.password) return null;

  const ok = await bcrypt.compare(password, agent.password);
  if (!ok) return null;

  // Block disallowed account states with a clear error so the agent knows why
  if (agent.status === 'BLOCKED') {
    return NextResponse.json(
      { status: 'error', message: 'Your travel agent account has been blocked. Contact support.' },
      { status: 403 },
    );
  }
  if (agent.status === 'SUSPENDED') {
    return NextResponse.json(
      { status: 'error', message: 'Your travel agent account is suspended. Contact support.' },
      { status: 403 },
    );
  }
  if (agent.status === 'REJECTED') {
    return NextResponse.json(
      { status: 'error', message: 'Your travel agent application was rejected. Contact support.' },
      { status: 403 },
    );
  }

  // Update last login (best-effort)
  await (prisma as any).travel_agents
    .update({ where: { id: agent.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {});

  // ── Shadow customer: ensure this TA has a linked customer record so the
  //    customer-side booking flows treat them as logged-in.
  const shadowCustomer = await ensureShadowCustomer(agent, password);

  // Encode a NextAuth-compatible JWT for the TA dashboard cookie.
  const now = Math.floor(Date.now() / 1000);
  const sessionToken = await encode({
    token: {
      id: agent.id,
      sub: agent.id,
      email: agent.email,
      name: agent.agencyName,
      role: 'TRAVEL_AGENT',
      userType: 'travel_agent',
      status: agent.status,
      phone: agent.phone,
      ownerName: agent.ownerName,
      iat: now,
      exp: now + TA_SESSION_MAX_AGE,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: TA_SESSION_MAX_AGE,
  });

  // Also issue a customer JWT (for localStorage) so customer-side booking
  // forms see this TA as a logged-in customer when they self-book.
  const fingerprint = generateFingerprint(
    request.headers.get('user-agent') || undefined,
    ip,
  );
  const { token: customerToken, expiresAt, expiresIn } = await createAccessToken(
    shadowCustomer.id,
    fingerprint,
  );

  const response = NextResponse.json({
    status: 'success',
    message: 'Travel agent login successful',
    userType: 'travel_agent',
    // Redirect to the customer dashboard — TA stays in "as a customer" mode
    // so booking flows treat them as logged-in. The customer dashboard shows
    // a banner with a one-click link back to /travel-agent/bookings when needed.
    redirect: '/customer/dashboard',
    travelAgent: {
      id: agent.id,
      email: agent.email,
      agencyName: agent.agencyName,
      ownerName: agent.ownerName,
      phone: agent.phone,
      status: agent.status,
    },
    // Customer-shaped payload for the existing /customer/login form to
    // persist into localStorage — keeps customer flows happy.
    token: customerToken,
    expiresAt: expiresAt.toISOString(),
    expiresIn,
    customers: {
      id: shadowCustomer.id,
      name: shadowCustomer.name,
      email: shadowCustomer.email,
      // Always surface the agent's REAL phone to the client. The shadow
      // customer's DB row may carry a `ta-<id>` placeholder (when the
      // agent's actual phone collided with another customer at shadow
      // creation time) — that placeholder fails Indian-mobile validation
      // in booking endpoints. Prefer agent.phone; if agent has no phone
      // either, send empty string so booking forms render a blank input
      // (never the `ta-<id>` placeholder).
      phone:
        agent.phone ||
        (typeof shadowCustomer.phone === 'string' && shadowCustomer.phone.startsWith('ta-')
          ? ''
          : shadowCustomer.phone || ''),
      avatar: shadowCustomer.avatar || null,
      isB2B: false,
      companyName: null,
      b2bStatus: null,
      linkedTravelAgentId: agent.id,
    },
  });

  response.cookies.set(TA_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TA_SESSION_MAX_AGE,
  });

  logger.info('Travel agent login via customer auth route', {
    agentId: agent.id,
    shadowCustomerId: shadowCustomer.id,
  });

  return response;
}

/**
 * Make sure a customer row exists for the given travel agent, linked via
 * `linkedTravelAgentId`. Returns the (existing or freshly created) customer.
 *
 * Phone uniqueness: customers.phone is UNIQUE. If the agent's phone is already
 * taken by another customer, we fall back to a deterministic placeholder
 * (`ta-<agentId>`) so creation doesn't fail.
 */
async function ensureShadowCustomer(agent: any, plaintextPassword: string) {
  // 1) Already a customer with this email?
  const existingByEmail: any = await (prisma as any).customers.findFirst({
    where: { email: agent.email.toLowerCase() },
  });

  if (existingByEmail) {
    // Link it (idempotent — raw SQL because the field isn't in the generated client yet)
    await (prisma as any).$executeRawUnsafe(
      `UPDATE customers SET linkedTravelAgentId = ? WHERE id = ? AND (linkedTravelAgentId IS NULL OR linkedTravelAgentId = ?)`,
      agent.id,
      existingByEmail.id,
      agent.id,
    );
    return existingByEmail;
  }

  // 2) No customer yet — create one. Use the agent's hashed password directly
  //    so the same credentials work standalone too if ever needed.
  const hashedPassword =
    agent.password ?? (await bcrypt.hash(plaintextPassword, 12));

  // Determine a non-conflicting phone
  let phoneToUse = agent.phone || `ta-${agent.id}`;
  if (agent.phone) {
    const phoneTaken: any = await (prisma as any).customers.findFirst({
      where: { phone: agent.phone },
    });
    if (phoneTaken) phoneToUse = `ta-${agent.id}`;
  }

  const newId = await generateCustomerId();
  const created: any = await (prisma as any).customers.create({
    data: {
      id: newId,
      name: agent.ownerName || agent.agencyName || agent.email.split('@')[0],
      email: agent.email.toLowerCase(),
      phone: phoneToUse,
      password: hashedPassword,
      isEmailVerified: true,
    },
  });

  // Set the link via raw SQL (column not in generated Prisma client yet)
  await (prisma as any).$executeRawUnsafe(
    `UPDATE customers SET linkedTravelAgentId = ? WHERE id = ?`,
    agent.id,
    created.id,
  );

  return created;
}

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
        response = await handleRegister(body, ip, request);
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
    // No customer with this email — try travel-agent credentials before failing
    const taResponse = await tryTravelAgentLogin(normalizedEmail, password, request, ip);
    if (taResponse) {
      clearLockoutOnSuccess(normalizedEmail, ip);
      return taResponse;
    }

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
    // Customer password mismatch — same email may be a travel agent's email,
    // try TA credentials before treating this as a hard failure.
    const taResponse = await tryTravelAgentLogin(normalizedEmail, password, request, ip);
    if (taResponse) {
      clearLockoutOnSuccess(normalizedEmail, ip);
      return taResponse;
    }

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

  // If this customer is a shadow for a travel agent with a `ta-<id>`
  // placeholder phone, surface the agent's real phone for the client.
  // If the agent also has no phone, return empty (never the placeholder).
  let surfacedPhone: string = customer.phone;
  let linkedAgentId: string | null = null;
  try {
    const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
      customer.id,
    );
    linkedAgentId = linkRows[0]?.linkedTravelAgentId || null;
    if (linkedAgentId && (!surfacedPhone || surfacedPhone.startsWith('ta-'))) {
      const linkedAgent: any = await (prisma as any).travel_agents.findUnique({
        where: { id: linkedAgentId },
      });
      surfacedPhone = linkedAgent?.phone || '';
    }
  } catch { /* non-fatal */ }

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
      phone: surfacedPhone,
      avatar: customer.avatar || null,
      isB2B: customer.isB2B || false,
      companyName: customer.companyName || null,
      b2bStatus: customer.b2bStatus || null,
      ...(linkedAgentId ? { linkedTravelAgentId: linkedAgentId } : {}),
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

  // Also surface travel-agent accounts as "existing" so booking modals open the
  // login (password) step instead of the register flow. handleLogin has a TA
  // fallback that authenticates the agent and provisions a shadow customer.
  const agentConditions: { phone?: string; email?: string }[] = [];
  if (phone) agentConditions.push({ phone: phone.trim() });
  if (email) agentConditions.push({ email: email.toLowerCase().trim() });

  const agent: any = await (prisma as any).travel_agents.findFirst({
    where: { OR: agentConditions },
  });

  if (agent) {
    return NextResponse.json({
      status: 'success',
      exists: true,
      customers: {
        id: agent.id,
        name: agent.ownerName || agent.agencyName || agent.email,
        email: agent.email,
        phone: agent.phone || '',
        hasPassword: !!agent.password,
      },
      isTravelAgent: true,
    });
  }

  return NextResponse.json({
    status: 'success',
    exists: false,
  });
}

// Handle customer registration
async function handleRegister(
  body: { name: string; email: string; phone: string; password: string; address?: string; city?: string; state?: string; pincode?: string; isB2B?: boolean; companyName?: string; gstin?: string; businessType?: string; companyAddress?: string; companyPhone?: string; companyEmail?: string },
  ip: string,
  request?: NextRequest
): Promise<NextResponse> {
  const { name, email, phone, password, address, city, state, pincode, isB2B, companyName, gstin, businessType, companyAddress, companyPhone, companyEmail } = body;

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
      // Email is already in the system. If the password the user typed matches
      // the existing customer (or the matching travel agent), treat this as a
      // login so the booking flow can proceed instead of bailing with an error.
      if (existingCustomer.password) {
        const passOk = await bcrypt.compare(password, existingCustomer.password);
        if (passOk) {
          if (existingCustomer.isBanned) {
            return NextResponse.json(
              { status: 'error', message: 'Your account has been suspended. Please contact support.' },
              { status: 403 }
            );
          }
          const fingerprint = generateFingerprint(
            request?.headers.get('user-agent') || undefined,
            ip
          );
          const { token, expiresAt, expiresIn } = await createAccessToken(
            existingCustomer.id,
            fingerprint
          );
          await prisma.customers
            .update({ where: { id: existingCustomer.id }, data: { lastLoginAt: new Date() } })
            .catch(() => {});
          // If this customer is a shadow for a travel agent and carries a
          // placeholder `ta-<id>` phone, surface the agent's real phone so
          // booking forms validate correctly. Empty out the placeholder if
          // neither has a usable phone.
          let surfacedPhone: string = existingCustomer.phone;
          let linkedAgentId: string | null = null;
          try {
            const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
              `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
              existingCustomer.id,
            );
            linkedAgentId = linkRows[0]?.linkedTravelAgentId || null;
            if (linkedAgentId && (!surfacedPhone || surfacedPhone.startsWith('ta-'))) {
              const linkedAgent: any = await (prisma as any).travel_agents.findUnique({
                where: { id: linkedAgentId },
              });
              surfacedPhone = linkedAgent?.phone || '';
            }
          } catch { /* non-fatal */ }
          logger.info('Customer login via register fallback', { customerId: existingCustomer.id });
          return NextResponse.json({
            status: 'success',
            message: 'Login successful',
            token,
            expiresAt: expiresAt.toISOString(),
            expiresIn,
            customers: {
              id: existingCustomer.id,
              name: existingCustomer.name,
              email: existingCustomer.email,
              phone: surfacedPhone,
              avatar: existingCustomer.avatar || null,
              isB2B: existingCustomer.isB2B || false,
              companyName: existingCustomer.companyName || null,
              b2bStatus: existingCustomer.b2bStatus || null,
              ...(linkedAgentId ? { linkedTravelAgentId: linkedAgentId } : {}),
            },
          });
        }
      }
      // Password didn't match an existing customer — try as a travel agent.
      // Travel agents log in with the same form on the booking modal; their
      // customer-shaped payload triggers a shadow-customer for the booking.
      if (request) {
        const taResponse = await tryTravelAgentLogin(normalizedEmail, password, request, ip);
        if (taResponse) return taResponse;
      }
      return NextResponse.json(
        { status: 'error', message: 'Email already registered. Please use your existing password.' },
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

  // No customer collision, but the email/phone might belong to a travel agent
  // that has never logged in as a customer (so no shadow customer exists yet).
  // Authenticate them as a TA — that creates the shadow and returns the same
  // customer-shaped payload booking flows expect.
  if (request) {
    const agent: any = await (prisma as any).travel_agents.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });
    if (agent) {
      const taResponse = await tryTravelAgentLogin(normalizedEmail, password, request, ip);
      if (taResponse) return taResponse;
      return NextResponse.json(
        { status: 'error', message: 'Email already registered. Please use your existing password.' },
        { status: 400 }
      );
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create customer
  const customerId = await generateCustomerId();
  const customerData: any = {
    id: customerId,
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    address: address?.trim() || null,
    city: city?.trim() || null,
    state: state?.trim() || null,
    pincode: pincode?.trim() || null,
  };

  // B2B fields
  if (isB2B) {
    customerData.isB2B = true;
    customerData.companyName = companyName?.trim() || null;
    customerData.gstin = gstin?.trim() || null;
    customerData.businessType = businessType?.trim() || null;
    customerData.companyAddress = companyAddress?.trim() || null;
    customerData.companyPhone = companyPhone?.trim() || null;
    customerData.companyEmail = companyEmail?.trim().toLowerCase() || null;
    customerData.b2bStatus = 'PENDING';
  }

  const customer = await prisma.customers.create({
    data: customerData,
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
      isB2B: customer.isB2B || false,
      companyName: customer.companyName || null,
      b2bStatus: customer.b2bStatus || null,
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
      isB2B: customer.isB2B || false,
      companyName: customer.companyName || null,
      b2bStatus: customer.b2bStatus || null,
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
      isB2B: customer.isB2B || false,
      companyName: customer.companyName || null,
      b2bStatus: customer.b2bStatus || null,
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
        isB2B: customer.isB2B || false,
        companyName: customer.companyName || null,
        b2bStatus: customer.b2bStatus || null,
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
