import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

// PATCH - Verify or reject a single travel-agent document (manager portal).
// Body: { documentId, action: 'VERIFY' | 'REJECT', rejectionReason? }
// Auto-promotes the agent to APPROVED once the required KYC doc
// (ADDRESS_PROOF; GST & PAN are optional) is VERIFIED — same gating as
// the admin endpoint.
export async function PATCH(
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

    const { id: travelAgentId } = await params;
    const body = await request.json();
    const { documentId, action, rejectionReason } = body;

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'documentId and action are required' },
        { status: 400 },
      );
    }

    const doc = await prisma.travel_agent_documents.findUnique({
      where: { id: documentId },
    });
    if (!doc || doc.travelAgentId !== travelAgentId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let updateData: any = {};
    if (action === 'VERIFY') {
      updateData = {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: session.user.id,
        rejectionReason: null,
      };
    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }
      updateData = {
        status: 'REJECTED',
        rejectionReason,
        verifiedAt: new Date(),
        verifiedById: session.user.id,
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.travel_agent_documents.update({
      where: { id: documentId },
      data: updateData,
    });

    const docLabel = String(doc.documentType || 'Document').replace(/_/g, ' ').toLowerCase();

    prisma.manager_action_logs.create({
      data: {
        recordType: 'TRAVEL_AGENT',
        serviceType: 'travel-agent',
        recordId: travelAgentId,
        actionType: 'NOTE_ADDED',
        previousStatus: doc.status,
        newStatus: updateData.status,
        note: `Document ${docLabel} ${action === 'VERIFY' ? 'verified' : 'rejected'}${rejectionReason ? `: ${rejectionReason}` : ''}`,
        managerId: session.user.id,
      },
    }).catch((err) => logger.error('Manager TA document action log failed', err));
    if (action === 'VERIFY') {
      await notifyTravelAgent(travelAgentId, {
        type: 'SYSTEM',
        title: 'Document verified ✅',
        body: `Your ${docLabel} was verified by our team.`,
        link: '/travel-agent/documents',
        metadata: { documentId, documentType: doc.documentType, action: 'VERIFY' },
      });
    } else if (action === 'REJECT') {
      await notifyTravelAgent(travelAgentId, {
        type: 'SYSTEM',
        title: 'Document rejected',
        body: rejectionReason
          ? `Your ${docLabel} was rejected. Reason: ${rejectionReason}`
          : `Your ${docLabel} was rejected. Please re-upload.`,
        link: '/travel-agent/documents',
        metadata: { documentId, documentType: doc.documentType, action: 'REJECT', rejectionReason },
      });
    }

    // Auto-promote agent when all required KYC docs are VERIFIED.
    // Only Address Proof is mandatory now (GST & PAN are optional).
    const REQUIRED_TYPES = ['ADDRESS_PROOF'] as const;
    let autoStatus: string | null = null;

    if (action === 'VERIFY') {
      const verifiedRequired = await prisma.travel_agent_documents.count({
        where: {
          travelAgentId,
          documentType: { in: REQUIRED_TYPES as any },
          status: 'VERIFIED',
        },
      });

      if (verifiedRequired >= REQUIRED_TYPES.length) {
        const agent = await prisma.travel_agents.findUnique({
          where: { id: travelAgentId },
          select: { status: true },
        });
        // Only promote agents in an "in-progress" state — don't override
        // SUSPENDED / BLOCKED / REJECTED.
        if (
          agent &&
          ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'].includes(agent.status)
        ) {
          await prisma.travel_agents.update({
            where: { id: travelAgentId },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              approvedById: session.user.id,
              rejectionReason: null,
            },
          });
          autoStatus = 'APPROVED';
          logger.info('Travel agent auto-approved after all required docs verified (manager)', {
            travelAgentId,
            verifiedById: session.user.id,
          });
          prisma.manager_action_logs.create({
            data: {
              recordType: 'TRAVEL_AGENT',
              serviceType: 'travel-agent',
              recordId: travelAgentId,
              actionType: 'STATUS_CHANGED',
              previousStatus: agent.status,
              newStatus: 'APPROVED',
              note: 'Auto-approved after all required documents verified',
              managerId: session.user.id,
            },
          }).catch((err) => logger.error('Manager TA auto-approve action log failed', err));
          await notifyTravelAgent(travelAgentId, {
            type: 'SYSTEM',
            title: 'Account approved 🎉',
            body: 'All required documents verified — your account is now active. You can start posting tours and accepting leads.',
            link: '/travel-agent/dashboard',
            metadata: { autoApproved: true },
          });
        }
      }
    }

    return NextResponse.json({ ...updated, autoPromotedStatus: autoStatus });
  } catch (error: any) {
    logger.error('Manager update travel agent document error', error);
    return NextResponse.json(
      { error: 'Failed to update document', details: error?.message },
      { status: 500 },
    );
  }
}
