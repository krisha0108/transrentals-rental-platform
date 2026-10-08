import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_STATUS = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'QUOTED',
  'NEGOTIATING',
  'BOOKED',
  'LOST',
  'COLD',
] as const;

const VALID_PRIORITY = ['HOT', 'WARM', 'COLD'] as const;

const VALID_TRIP_TYPE = ['ONE_WAY', 'ROUND_TRIP', 'TOUR_PACKAGE', 'ACCOMMODATION'] as const;

const SORTS: Record<string, any> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  followup: { nextFollowUp: 'asc' },
  value_desc: { estimatedValue: 'desc' },
  value_asc: { estimatedValue: 'asc' },
  travel_date: { travelDate: 'asc' },
};

const VALID_SOURCE = [
  'MANUAL',
  'CAPTURE_LINK',
  'WEBSITE',
  'REFERRAL',
  'WALK_IN',
  'SOCIAL_MEDIA',
  'GOOGLE_ADS',
  'WHATSAPP',
  'OTHER',
] as const;

// GET: list leads with filters/search/pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const tripType = searchParams.get('tripType');
    const search = searchParams.get('search');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');
    const travelFrom = searchParams.get('travelFrom');
    const travelTo = searchParams.get('travelTo');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Parsed as local midnight so an IST date picker value doesn't shift a
    // day when compared against a UTC-stored timestamp.
    const dayStart = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };
    const dayEnd = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    };

    const where: any = { travelAgentId: auth.travelAgentId };
    if (status && status !== 'ALL' && VALID_STATUS.includes(status as any)) where.status = status;
    if (priority && priority !== 'ALL' && VALID_PRIORITY.includes(priority as any)) where.priority = priority;
    if (source && source !== 'ALL' && VALID_SOURCE.includes(source as any)) where.source = source;
    if (tripType && tripType !== 'ALL' && VALID_TRIP_TYPE.includes(tripType as any)) where.tripType = tripType;
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = dayStart(createdFrom);
      if (createdTo) where.createdAt.lte = dayEnd(createdTo);
    }
    if (travelFrom || travelTo) {
      where.travelDate = {};
      if (travelFrom) where.travelDate.gte = dayStart(travelFrom);
      if (travelTo) where.travelDate.lte = dayEnd(travelTo);
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
        { destination: { contains: search } },
      ];
    }

    // Stats reflect the current filter set MINUS status (so the chip row can
    // show the breakdown-by-status for the user's view). This lets the
    // Tour Quote Requests page (always source=WEBSITE) show its own NEW /
    // CONTACTED / BOOKED counts without bleeding in non-website leads.
    const statsWhere: any = { travelAgentId: auth.travelAgentId };
    if (priority && priority !== 'ALL' && VALID_PRIORITY.includes(priority as any)) statsWhere.priority = priority;
    if (source && source !== 'ALL' && VALID_SOURCE.includes(source as any)) statsWhere.source = source;
    if (tripType && tripType !== 'ALL' && VALID_TRIP_TYPE.includes(tripType as any)) statsWhere.tripType = tripType;
    if (where.createdAt) statsWhere.createdAt = where.createdAt;
    if (where.travelDate) statsWhere.travelDate = where.travelDate;
    if (search) {
      statsWhere.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
        { destination: { contains: search } },
      ];
    }

    const [leads, total, statsByStatus] = await Promise.all([
      prisma.travel_agent_leads.findMany({
        where,
        orderBy: SORTS[sortBy] || SORTS.newest,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { travel_agent_lead_notes: true } },
        },
      }),
      prisma.travel_agent_leads.count({ where }),
      prisma.travel_agent_leads.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { _all: true },
      }),
    ]);

    const stats: Record<string, number> = {
      total: 0,
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      QUOTED: 0,
      NEGOTIATING: 0,
      BOOKED: 0,
      LOST: 0,
      COLD: 0,
    };
    for (const row of statsByStatus) {
      stats[row.status] = row._count._all;
      stats.total += row._count._all;
    }

    return NextResponse.json({
      leads: leads.map(({ _count, ...rest }) => ({
        ...rest,
        notesCount: _count.travel_agent_lead_notes,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: any) {
    logger.error('List travel agent leads error', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error?.message },
      { status: 500 },
    );
  }
}

// POST: create a new lead manually
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      source,
      tripType,
      pickupLocation,
      dropLocation,
      destination,
      travelDate,
      returnDate,
      passengers,
      requirement,
      estimatedValue,
      priority,
      assignedToName,
      nextFollowUp,
      tourId,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 },
      );
    }

    const lead = await prisma.travel_agent_leads.create({
      data: {
        travelAgentId: auth.travelAgentId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        source: VALID_SOURCE.includes(source) ? source : 'MANUAL',
        tripType: tripType || null,
        pickupLocation: pickupLocation || null,
        dropLocation: dropLocation || null,
        destination: destination || null,
        travelDate: travelDate ? new Date(travelDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        passengers: passengers ? Number(passengers) : 1,
        requirement: requirement || null,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        status: 'NEW',
        priority: VALID_PRIORITY.includes(priority) ? priority : 'WARM',
        assignedToName: assignedToName || null,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        tourId: tourId || null,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent lead error', error);
    return NextResponse.json(
      { error: 'Failed to create lead', details: error?.message },
      { status: 500 },
    );
  }
}
