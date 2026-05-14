import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

// PATCH - Verify or reject a document for a travel agent
// Body: { documentId, action: 'VERIFY' | 'REJECT', rejectionReason? }
export async function PATCH(
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

    // Notify agent about the verify/reject decision (skip the auto-approve
    // notification for now — that's emitted below if auto-promotion fires).
    const docLabel = String(doc.documentType || 'Document').replace(/_/g, ' ').toLowerCase();
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

    // Auto-promote agent status when all required KYC docs are VERIFIED
    // (mirrors vendor's 3-required-docs gating).
    const REQUIRED_TYPES = ['GST_CERTIFICATE', 'PAN_CARD', 'ADDRESS_PROOF'] as const;
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
        // Only promote agents that are in an "in-progress" state — don't override
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
          logger.info('Travel agent auto-approved after all required docs verified', {
            travelAgentId,
            verifiedById: session.user.id,
          });
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
    logger.error('Admin update travel agent document error', error);
    return NextResponse.json(
      { error: 'Failed to update document', details: error?.message },
      { status: 500 },
    );
  }
}
