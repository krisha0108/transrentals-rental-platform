import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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
