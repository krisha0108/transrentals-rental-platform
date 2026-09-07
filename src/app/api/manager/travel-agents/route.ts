import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { generateTaid } from '@/lib/utils/generate-taid';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List travel agents for the manager portal. Mirrors the admin list
// endpoint but enforces the MANAGER role. Scope is platform-wide (same as
// the manager vendors endpoint) — travel-agent KYC/onboarding isn't currently
// city-bound. Switch to manager_locations-based scoping here if/when that
// changes.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const agencyType = searchParams.get('agencyType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (city && city !== 'ALL') where.city = city;
    if (agencyType && agencyType !== 'ALL') where.agencyType = agencyType;
    if (search) {
      where.OR = [
        { agencyName: { contains: search } },
        { ownerName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
      ];
    }

    // Stats base — same filters as main query but without status so each chip
    // shows the count within the current search/city/agencyType scope.
    const whereForStats: any = {};
    if (city && city !== 'ALL') whereForStats.city = city;
    if (agencyType && agencyType !== 'ALL') whereForStats.agencyType = agencyType;
    if (search) whereForStats.OR = where.OR;

    const [agents, total, distinctCities, distinctTypes,
      statsTotal, statsApproved, statsPending, statsRejected] = await Promise.all([
      prisma.travel_agents.findMany({
        where,
        include: {
          _count: {
            select: {
              travel_agent_documents: true,
              travel_agent_leads: true,
              travel_agent_tours: true,
              travel_agent_properties: true,
              travel_agent_bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.travel_agents.count({ where }),
      prisma.travel_agents.findMany({ where: { city: { not: null } }, select: { city: true }, distinct: ['city'], orderBy: { city: 'asc' } }),
      prisma.travel_agents.findMany({ where: { agencyType: { not: null } }, select: { agencyType: true }, distinct: ['agencyType'], orderBy: { agencyType: 'asc' } }),
      prisma.travel_agents.count({ where: whereForStats }),
      prisma.travel_agents.count({ where: { ...whereForStats, status: 'APPROVED' } }),
      prisma.travel_agents.count({ where: { ...whereForStats, status: { in: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] } } }),
      prisma.travel_agents.count({ where: { ...whereForStats, status: { in: ['REJECTED', 'SUSPENDED', 'BLOCKED'] } } }),
    ]);

    const safeAgents = agents.map(({ password, _count, ...rest }) => ({
      ...rest,
      _count: {
        documents: _count?.travel_agent_documents || 0,
        leads: _count?.travel_agent_leads || 0,
        tours: _count?.travel_agent_tours || 0,
        properties: _count?.travel_agent_properties || 0,
        bookings: _count?.travel_agent_bookings || 0,
      },
    }));

    return NextResponse.json({
      travelAgents: safeAgents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      cities: distinctCities.map((r) => r.city).filter(Boolean),
      agencyTypes: distinctTypes.map((r) => r.agencyType).filter(Boolean),
      stats: {
        total: statsTotal,
        approved: statsApproved,
        pending: statsPending,
        rejected: statsRejected,
      },
    });
  } catch (error: any) {
    logger.error('Manager list travel agents error', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel agents', details: error?.message },
      { status: 500 },
    );
  }
}

// POST - Manager/Admin creates a travel agent profile on the agent's behalf,
// mirroring /api/manager/vendors/create for vendors.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!manager || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(manager.role)) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      phone,
      agencyName,
      agencyType,
      ownerName,
      address,
      city,
      state,
      pincode,
    } = body;

    if (!email || !password || !phone || !agencyName || !ownerName) {
      return NextResponse.json(
        { error: 'Email, password, phone, agency name, and owner name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, '').slice(-10))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const existingEmail = await prisma.travel_agents.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingPhone = await prisma.travel_agents.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const tid = await generateTaid();

    const agent = await prisma.travel_agents.create({
      data: {
        id: generateId(),
        tid,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        agencyName,
        agencyType: agencyType || null,
        ownerName,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: 'DOCUMENTS_PENDING',
      },
      select: {
        id: true,
        tid: true,
        email: true,
        phone: true,
        agencyName: true,
        ownerName: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Manager created travel agent profile', { managerId: session.user.id, travelAgentId: agent.id });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'TRAVEL_AGENT',
        serviceType: 'travel-agent',
        recordId: agent.id,
        actionType: 'NOTE_ADDED',
        newStatus: agent.status,
        note: `Travel agent created: ${agencyName}`,
        managerId: session.user.id,
      },
    }).catch((err) => logger.error('Manager travel agent create action log failed', err));

    return NextResponse.json({ success: true, travelAgent: agent }, { status: 201 });
  } catch (error: any) {
    logger.error('Manager create travel agent error', error);
    return NextResponse.json(
      { error: 'Failed to create travel agent', details: error?.message },
      { status: 500 }
    );
  }
}
