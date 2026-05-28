import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { resolveAssetUrl } from '@/lib/utils';
import logger from '@/lib/security/logger';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

const RECENT_LIMIT = 50;

// GET - Travel agent detail for the manager portal. Mirrors the admin
// endpoint but enforces the MANAGER role.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Fetch the agent shell + all related entities in parallel for snappier
    // detail loads. Vehicles/tours/properties are full lists (vendor-style
    // browsable inventory); leads/bookings are capped to RECENT_LIMIT (with
    // total counts surfaced separately) — these can be very large.
    const [agent, fleets, tours, properties, leads, bookings, leadsCount, bookingsCount, fleetsCount] = await Promise.all([
      prisma.travel_agents.findUnique({
        where: { id },
        include: {
          travel_agent_documents: {
            include: {
              verifiedByAdmin: { select: { id: true, name: true, email: true } },
              uploadedByAdmin: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          travel_agent_bank_accounts: { where: { isActive: true } },
          admin_users: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.travel_agent_fleets.findMany({
        where: { travelAgentId: id },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.travel_agent_tours.findMany({
        where: { travelAgentId: id },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.travel_agent_properties.findMany({
        where: { travelAgentId: id },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.travel_agent_leads.findMany({
        where: { travelAgentId: id },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      prisma.travel_agent_bookings.findMany({
        where: { travelAgentId: id },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      prisma.travel_agent_leads.count({ where: { travelAgentId: id } }),
      prisma.travel_agent_bookings.count({ where: { travelAgentId: id } }),
      prisma.travel_agent_fleets.count({ where: { travelAgentId: id } }),
    ]);

    if (!agent) {
      return NextResponse.json({ error: 'Travel agent not found' }, { status: 404 });
    }

    const {
      password,
      travel_agent_documents,
      travel_agent_bank_accounts,
      admin_users,
      ...rest
    } = agent;

    // Cover images live as relative paths in DB; resolve to absolute so the
    // browser doesn't 404 on them when the asset host differs.
    const resolveCover = (v: any) => ({ ...v, coverImage: v.coverImage ? resolveAssetUrl(v.coverImage) : null });

    return NextResponse.json({
      ...rest,
      documents: travel_agent_documents.map((doc: any) => ({
        ...doc,
        verifiedBy: doc.verifiedByAdmin,
        uploadedBy: doc.uploadedByAdmin,
        verifiedByAdmin: undefined,
        uploadedByAdmin: undefined,
      })),
      bankAccounts: travel_agent_bank_accounts,
      approvedBy: admin_users,
      fleets: fleets.map(resolveCover),
      tours: tours.map(resolveCover),
      properties: properties.map(resolveCover),
      leads,
      bookings,
      _count: {
        documents: travel_agent_documents.length,
        bankAccounts: travel_agent_bank_accounts.length,
        fleets: fleetsCount,
        tours: tours.length,
        properties: properties.length,
        leads: leadsCount,
        bookings: bookingsCount,
      },
    });
  } catch (error: any) {
    logger.error('Manager get travel agent error', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel agent', details: error?.message },
      { status: 500 },
    );
  }
}

// PUT - Apply a lifecycle action (APPROVE / REJECT / SUSPEND / UNSUSPEND /
// BLOCK / MARK_UNDER_REVIEW). Notifies the agent.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    const agent = await prisma.travel_agents.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'Travel agent not found' }, { status: 404 });
    }

    let updateData: any = {};
    switch (action) {
      case 'APPROVE':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: session.user.id,
          rejectionReason: null,
        };
        break;
      case 'REJECT':
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }
        updateData = {
          status: 'REJECTED',
          rejectionReason,
          approvedAt: null,
          approvedById: session.user.id,
        };
        break;
      case 'SUSPEND':
        updateData = { status: 'SUSPENDED' };
        break;
      case 'UNSUSPEND':
        updateData = { status: 'APPROVED' };
        break;
      case 'BLOCK':
        updateData = { status: 'BLOCKED' };
        break;
      case 'MARK_UNDER_REVIEW':
        updateData = { status: 'UNDER_REVIEW' };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.travel_agents.update({
      where: { id },
      data: updateData,
    });

    const statusNotice: Record<string, { title: string; body: string; link: string }> = {
      APPROVE:            { title: 'Account approved 🎉',     body: 'Your travel agent account has been approved. You can now start posting tours and accepting leads.',                          link: '/travel-agent/dashboard' },
      REJECT:             { title: 'Account rejected',         body: rejectionReason ? `Reason: ${rejectionReason}` : 'Your account application was rejected. Please contact support.',          link: '/travel-agent/profile'   },
      SUSPEND:            { title: 'Account suspended',        body: 'Your travel agent account has been suspended. Please contact support for details.',                                        link: '/travel-agent/profile'   },
      UNSUSPEND:          { title: 'Account reactivated',      body: 'Your account has been reactivated and is back to APPROVED status.',                                                       link: '/travel-agent/dashboard' },
      BLOCK:              { title: 'Account blocked',          body: 'Your travel agent account has been blocked. Please contact support immediately.',                                          link: '/travel-agent/profile'   },
      MARK_UNDER_REVIEW:  { title: 'Account under review',     body: "Your account is being reviewed. We'll notify you once verification is complete.",                                          link: '/travel-agent/profile'   },
    };
    const notice = statusNotice[action];
    if (notice) {
      await notifyTravelAgent(id, {
        type: 'SYSTEM',
        title: notice.title,
        body: notice.body,
        link: notice.link,
        metadata: { action, newStatus: updateData.status, rejectionReason: rejectionReason || null },
      });
    }

    const { password, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (error: any) {
    logger.error('Manager update travel agent error', error);
    return NextResponse.json(
      { error: 'Failed to update travel agent', details: error?.message },
      { status: 500 },
    );
  }
}
