// Inquiry CRM tags — manager-only mutations. Mirrors
// /api/manager/vendors/[id]/tags. Independent of the inquiry's own pipeline
// status and of manager_action_logs (the action-history layer) — these are
// a toggleable current-state classification.
//
// POST   { tag } → add tag to inquiry (idempotent via unique constraint)
// DELETE ?tag=X  → remove tag from inquiry

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';
import { resolveInquiryService } from '../route';

export const dynamic = 'force-dynamic';

const VALID_TAGS = new Set([
  'FOLLOW_UP_REQUIRED', 'CUSTOMER_CONNECTED', 'NO_VENDOR_AVAILABLE', 'NOT_INTERESTED', 'VENDOR_NOT_RESPONDING',
  'WRONG_NUMBER', 'PRICE_TOO_HIGH', 'AWAITING_VENDOR_QUOTE', 'CUSTOMER_NOT_RESPONDING', 'CONVERTED', 'DUPLICATE_INQUIRY',
  'VENDOR_DECLINED', 'VENDOR_CANT_FULFILL', 'NOT_SERVICEABLE', 'CUSTOMER_BOOKED_ELSEWHERE',
  'QUOTE_NOT_SUBMITTED', 'WAITING_CUSTOMER_CONFIRMATION', 'ADVANCE_PAYMENT_PENDING',
  'INVALID_LEAD', 'CANCELLED', 'OTHER_REASON',
]);

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

async function requireManagerOrAdmin(session: any) {
  if (!session?.user?.id) return null;
  const user = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const resolvedParams = 'then' in params ? await params : params;
    const { id: recordId } = resolvedParams;
    const { tag } = await request.json();

    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    const serviceType = await resolveInquiryService(recordId);
    if (!serviceType) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });

    await prisma.inquiry_tag_assignments.upsert({
      where: { recordId_tag: { recordId, tag } },
      create: { id: generateId(), recordId, serviceType, tag, assignedById: user.id },
      update: { assignedById: user.id },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'INQUIRY',
        serviceType,
        recordId,
        actionType: 'NOTE_ADDED',
        newStatus: tag,
        note: `Tagged: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Inquiry tag action log failed', err));

    const tags = await prisma.inquiry_tag_assignments.findMany({
      where: { recordId },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t) => t.tag) });
  } catch (error: any) {
    logger.error('Inquiry tag add error', error);
    return NextResponse.json({ error: 'Failed to add tag', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const resolvedParams = 'then' in params ? await params : params;
    const { id: recordId } = resolvedParams;
    const tag = new URL(request.url).searchParams.get('tag');
    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    await prisma.inquiry_tag_assignments.deleteMany({
      where: { recordId, tag: tag as any },
    });

    const serviceType = await resolveInquiryService(recordId);
    prisma.manager_action_logs.create({
      data: {
        recordType: 'INQUIRY',
        serviceType: serviceType || 'unknown',
        recordId,
        actionType: 'NOTE_ADDED',
        previousStatus: tag,
        note: `Removed tag: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Inquiry tag remove action log failed', err));

    const tags = await prisma.inquiry_tag_assignments.findMany({
      where: { recordId },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t) => t.tag) });
  } catch (error: any) {
    logger.error('Inquiry tag remove error', error);
    return NextResponse.json({ error: 'Failed to remove tag', details: error?.message }, { status: 500 });
  }
}
