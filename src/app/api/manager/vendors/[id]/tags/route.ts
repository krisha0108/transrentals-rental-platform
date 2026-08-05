// @ts-nocheck
// Vendor CRM tags — manager-only mutations.
//
// POST   { tag } → add tag to vendor (idempotent via unique constraint)
// DELETE ?tag=X  → remove tag from vendor
//
// These tags are independent of `vendors.status`. They're the manager's
// follow-up/quality layer; the formal approval state is still vendors.status.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_TAGS = new Set([
  'FOLLOW_UP_REQUIRED', 'CONNECTED', 'RESPONDED',
  'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED',
  'WRONG_VENDOR_DETAILS', 'NOT_INTERESTED', 'NO_RESPONSE',
  'VEHICLE_DETAILS_PENDING', 'ACTIVE_VENDOR', 'SUSPENDED',
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

// POST - add a tag to a vendor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id: vendorId } = await params;
    const { tag } = await request.json();

    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    const vendor = await prisma.vendors.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    // upsert by (vendorId, tag) — idempotent re-tagging
    await (prisma as any).vendor_tag_assignments.upsert({
      where: { vendorId_tag: { vendorId, tag } },
      create: { id: generateId(), vendorId, tag, assignedById: user.id },
      update: { assignedById: user.id },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'VENDOR',
        serviceType: 'vendor',
        recordId: vendorId,
        actionType: 'NOTE_ADDED',
        newStatus: tag,
        note: `Tagged: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Vendor tag action log failed', err));

    const tags = await (prisma as any).vendor_tag_assignments.findMany({
      where: { vendorId },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t: any) => t.tag) });
  } catch (error: any) {
    logger.error('Vendor tag add error', error);
    return NextResponse.json({ error: 'Failed to add tag', details: error?.message }, { status: 500 });
  }
}

// DELETE - remove a tag (?tag=X)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id: vendorId } = await params;
    const tag = new URL(request.url).searchParams.get('tag');
    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    await (prisma as any).vendor_tag_assignments.deleteMany({
      where: { vendorId, tag: tag as any },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'VENDOR',
        serviceType: 'vendor',
        recordId: vendorId,
        actionType: 'NOTE_ADDED',
        previousStatus: tag,
        note: `Removed tag: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Vendor tag remove action log failed', err));

    const tags = await (prisma as any).vendor_tag_assignments.findMany({
      where: { vendorId },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t: any) => t.tag) });
  } catch (error: any) {
    logger.error('Vendor tag remove error', error);
    return NextResponse.json({ error: 'Failed to remove tag', details: error?.message }, { status: 500 });
  }
}
