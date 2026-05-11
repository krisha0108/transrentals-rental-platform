import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { agencyName: { contains: search } },
        { ownerName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [agents, total] = await Promise.all([
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Admin list travel agents error', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel agents', details: error?.message },
      { status: 500 },
    );
  }
}
