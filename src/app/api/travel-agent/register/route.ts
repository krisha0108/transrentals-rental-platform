import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';
import { getAllActiveManagers, notifyManagers } from '@/lib/notifications/manager-notify';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export async function POST(request: NextRequest) {
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.auth,
    'travel-agent-register',
  );

  if (limited) {
    logger.logSecurityEvent('Travel agent registration rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  try {
    const body = await request.json();
    const {
      email,
      password,
      phone,
      agencyName,
      agencyType,
      ownerName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
    } = body;

    if (!email || !password || !phone || !agencyName || !ownerName) {
      return NextResponse.json(
        { error: 'Email, password, phone, agency name, and owner name are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, '').slice(-10))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const existingEmail = await prisma.travel_agents.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      logger.logSecurityEvent('Travel agent registration with existing email', 'low', {
        email: email.toLowerCase(),
      });
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingPhone = await prisma.travel_agents.findUnique({ where: { phone } });
    if (existingPhone) {
      logger.logSecurityEvent('Travel agent registration with existing phone', 'low', {
        phone: phone.slice(-4),
      });
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const agent = await prisma.travel_agents.create({
      data: {
        id: generateId(),
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        agencyName,
        agencyType: agencyType || null,
        ownerName,
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: 'DOCUMENTS_PENDING',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        agencyName: true,
        ownerName: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Travel agent registered successfully', { travelAgentId: agent.id });

    // Travel agents aren't location/service-scoped (like contact inquiries),
    // so every active manager gets notified — never block the response on this.
    getAllActiveManagers()
      .then((managerIds) =>
        notifyManagers(managerIds, {
          type: 'NEW_TRAVEL_AGENT_REGISTRATION',
          title: 'New travel agent registered',
          body: `${agent.agencyName} (${agent.ownerName}) just signed up and needs review.`,
          link: `/manager/travel-agents/${agent.id}`,
          metadata: { travelAgentId: agent.id },
          dedupeKey: agent.id,
        })
      )
      .catch((notifyError) => logger.error('Failed to notify managers of new travel agent registration', notifyError));

    return NextResponse.json(
      {
        message: 'Registration successful! Please upload your business documents.',
        travelAgent: agent,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error('Travel agent registration error', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 },
    );
  }
}
