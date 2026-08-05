// @ts-nocheck
// Driver CRM tags — manager/admin-only mutations.
//
// POST   { tag, source } → add tag to driver (idempotent via unique constraint)
// DELETE ?tag=X&source=Y → remove tag from driver
//
// Drivers are polymorphic: they live in either the `drivers` table
// (source='standalone') or `vendor_staff` (source='vendor'). The (driverId,
// source) pair identifies the driver. These tags are independent of the
// driver's status — they're the manager's follow-up/quality layer.

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
  'WRONG_DRIVER_DETAILS', 'NOT_INTERESTED', 'NO_RESPONSE',
  'VEHICLE_DETAILS_PENDING', 'ACTIVE_DRIVER', 'SUSPENDED',
]);

function normalizeSource(raw: any): 'standalone' | 'vendor' {
  return String(raw || '').toLowerCase() === 'vendor' ? 'vendor' : 'standalone';
}

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

async function requireManagerOrAdmin(session: any) {
  if (!session?.user?.id) return null;
  const user = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) return null;
  return user;
}

// Verify the driver actually exists in the table the source points to.
async function driverExists(driverId: string, source: 'standalone' | 'vendor') {
  if (source === 'vendor') {
    const s = await prisma.vendor_staff.findUnique({ where: { id: driverId }, select: { id: true } });
    return !!s;
  }
  const d = await prisma.drivers.findUnique({ where: { id: driverId }, select: { id: true } });
  return !!d;
}

// POST - add a tag to a driver
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id: driverId } = await params;
    const body = await request.json();
    const tag = body?.tag;
    const source = normalizeSource(body?.source);

    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    if (!(await driverExists(driverId, source))) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // upsert by (driverId, source, tag) — idempotent re-tagging
    await (prisma as any).driver_tag_assignments.upsert({
      where: { driverId_source_tag: { driverId, source, tag } },
      create: { id: generateId(), driverId, source, tag, assignedById: user.id },
      update: { assignedById: user.id },
    });

    // Mirror into the manager accountability log (same table/pattern as
    // inquiries/bookings) so this shows up on the admin Manager Performance
    // pages, same as every other manager action.
    prisma.manager_action_logs.create({
      data: {
        recordType: 'DRIVER',
        serviceType: source,
        recordId: driverId,
        actionType: 'NOTE_ADDED',
        newStatus: tag,
        note: `Tagged: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Driver tag action log failed', err));

    const tags = await (prisma as any).driver_tag_assignments.findMany({
      where: { driverId, source },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t: any) => t.tag) });
  } catch (error: any) {
    logger.error('Driver tag add error', error);
    return NextResponse.json({ error: 'Failed to add tag', details: error?.message }, { status: 500 });
  }
}

// DELETE - remove a tag (?tag=X&source=Y)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = await requireManagerOrAdmin(session);
    if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id: driverId } = await params;
    const url = new URL(request.url);
    const tag = url.searchParams.get('tag');
    const source = normalizeSource(url.searchParams.get('source'));

    if (!tag || !VALID_TAGS.has(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    await (prisma as any).driver_tag_assignments.deleteMany({
      where: { driverId, source, tag: tag as any },
    });

    prisma.manager_action_logs.create({
      data: {
        recordType: 'DRIVER',
        serviceType: source,
        recordId: driverId,
        actionType: 'NOTE_ADDED',
        previousStatus: tag,
        note: `Removed tag: ${tag.replace(/_/g, ' ')}`,
        managerId: user.id,
      },
    }).catch((err) => logger.error('Driver tag remove action log failed', err));

    const tags = await (prisma as any).driver_tag_assignments.findMany({
      where: { driverId, source },
      select: { tag: true },
    });

    return NextResponse.json({ success: true, tags: tags.map((t: any) => t.tag) });
  } catch (error: any) {
    logger.error('Driver tag remove error', error);
    return NextResponse.json({ error: 'Failed to remove tag', details: error?.message }, { status: 500 });
  }
}
