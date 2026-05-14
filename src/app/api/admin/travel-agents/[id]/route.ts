import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const agent = await prisma.travel_agents.findUnique({
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
        _count: {
          select: {
            travel_agent_leads: true,
            travel_agent_tours: true,
            travel_agent_properties: true,
            travel_agent_bookings: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Travel agent not found' }, { status: 404 });
    }

    const {
      password,
      travel_agent_documents,
      travel_agent_bank_accounts,
      admin_users,
      _count,
      ...rest
    } = agent;

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
      _count: {
        leads: _count.travel_agent_leads,
        tours: _count.travel_agent_tours,
        properties: _count.travel_agent_properties,
        bookings: _count.travel_agent_bookings,
      },
    });
  } catch (error: any) {
    logger.error('Admin get travel agent error', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel agent', details: error?.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

    // Notify the agent about the account status change
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
    logger.error('Admin update travel agent error', error);
    return NextResponse.json(
      { error: 'Failed to update travel agent', details: error?.message },
      { status: 500 },
    );
  }
}
