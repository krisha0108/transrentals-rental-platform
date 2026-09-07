// Edit/delete a single call-report row. Only the manager who logged it (or
// an admin) may change it — everyone else on the shared sheet has read-only
// access to each other's rows.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const STATUS_VALUES = [
  'VENDOR_CREATED',
  'TRAVEL_AGENT_CREATED',
  'INTERESTED',
  'FOLLOW_UP',
  'NOT_INTERESTED',
  'NO_ANSWER',
  'CALLBACK_LATER',
  'WRONG_NUMBER',
  'CONVERTED',
] as const;

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;
  if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return null;
  return { id: session.user.id, name: session.user.name || null, role };
}

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return 'then' in params ? await params : params;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }
    const { id } = await resolveParams(params);

    const r = await prisma.manager_call_reports.findUnique({
      where: { id },
      include: {
        manager_call_report_locations: { include: { locations: { select: { id: true, name: true, slug: true, type: true } } } },
        manager_call_report_services: { include: { services: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!r) return NextResponse.json({ error: 'Call report not found' }, { status: 404 });

    const [vendor, travelAgent] = await Promise.all([
      r.vendorId
        ? prisma.vendors.findUnique({ where: { id: r.vendorId }, select: { id: true, businessName: true, vid: true, status: true } })
        : null,
      r.travelAgentId
        ? prisma.travel_agents.findUnique({ where: { id: r.travelAgentId }, select: { id: true, agencyName: true, tid: true, status: true } })
        : null,
    ]);

    return NextResponse.json({
      report: {
        id: r.id,
        vendorId: r.vendorId,
        vendor,
        travelAgentId: r.travelAgentId,
        travelAgent,
        vendorName: r.vendorName,
        companyName: r.companyName,
        companyDetails: r.companyDetails,
        phone: r.phone,
        email: r.email,
        address: r.address,
        city: r.city,
        contactType: r.contactType,
        services: r.manager_call_report_services.map((s) => s.services),
        locations: r.manager_call_report_locations.map((l) => l.locations),
        status: r.status,
        nextFollowUpDate: r.nextFollowUpDate,
        nextFollowUpTime: r.nextFollowUpTime,
        nextAction: r.nextAction,
        notes: r.notes,
        callDate: r.callDate,
        managerId: r.managerId,
        canEdit: r.managerId === manager.id || ['ADMIN', 'SUPER_ADMIN'].includes(manager.role),
      },
    });
  } catch (error) {
    logger.error('Failed to load manager call report', error);
    return NextResponse.json({ error: 'Failed to load call report' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }
    const { id } = await resolveParams(params);

    const existing = await prisma.manager_call_reports.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Call report not found' }, { status: 404 });

    const body = await request.json();
    const bodyKeys = Object.keys(body || {});
    // Quick status changes (the pill dropdown on the shared call sheet) are
    // open to every manager, matching the sheet's "shared spreadsheet" model —
    // everything else stays restricted to the report's own manager (or an admin).
    const isStatusOnlyUpdate = bodyKeys.length === 1 && bodyKeys[0] === 'status';
    const isOwner = existing.managerId === manager.id || ['ADMIN', 'SUPER_ADMIN'].includes(manager.role);
    if (!isOwner && !isStatusOnlyUpdate) {
      return NextResponse.json({ error: 'You can only edit call reports you added' }, { status: 403 });
    }
    const data: any = {};
    if (typeof body?.vendorName === 'string' && body.vendorName.trim()) data.vendorName = body.vendorName.trim();
    if (body?.companyName !== undefined) data.companyName = (body.companyName || '').trim() || null;
    if (body?.companyDetails !== undefined) data.companyDetails = (body.companyDetails || '').trim() || null;
    if (body?.phone !== undefined) data.phone = (body.phone || '').trim() || null;
    if (body?.email !== undefined) data.email = (body.email || '').trim().toLowerCase() || null;
    if (body?.address !== undefined) data.address = (body.address || '').trim() || null;
    if (body?.city !== undefined) data.city = (body.city || '').trim() || null;
    if (body?.contactType !== undefined) data.contactType = body.contactType === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : 'VENDOR';
    if (body?.notes !== undefined) data.notes = (body.notes || '').trim() || null;
    if (body?.status !== undefined && STATUS_VALUES.includes(body.status)) data.status = body.status;
    if (body?.callDate) data.callDate = new Date(body.callDate);
    if (body?.vendorId !== undefined) data.vendorId = body.vendorId || null;
    if (body?.travelAgentId !== undefined) data.travelAgentId = body.travelAgentId || null;
    if (body?.nextFollowUpDate !== undefined) data.nextFollowUpDate = body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null;
    if (body?.nextFollowUpTime !== undefined) data.nextFollowUpTime = (body.nextFollowUpTime || '').trim() || null;
    if (body?.nextAction !== undefined) data.nextAction = (body.nextAction || '').trim() || null;

    // Replacing the whole location/service set is simpler and safer here
    // than diffing add/remove — a call report only ever has a handful of rows.
    const locationIds: string[] | undefined = Array.isArray(body?.locationIds)
      ? [...new Set(body.locationIds.filter(Boolean))]
      : undefined;
    if (locationIds && locationIds.length) {
      const found = await prisma.locations.count({ where: { id: { in: locationIds } } });
      if (found !== locationIds.length) {
        return NextResponse.json({ error: 'One or more selected locations were not found' }, { status: 400 });
      }
    }

    const serviceIds: string[] | undefined = Array.isArray(body?.serviceIds)
      ? [...new Set(body.serviceIds.filter(Boolean))]
      : undefined;
    if (serviceIds && serviceIds.length) {
      const found = await prisma.services.count({ where: { id: { in: serviceIds } } });
      if (found !== serviceIds.length) {
        return NextResponse.json({ error: 'One or more selected services were not found' }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (locationIds !== undefined) {
        await tx.manager_call_report_locations.deleteMany({ where: { callReportId: id } });
        if (locationIds.length) {
          await tx.manager_call_report_locations.createMany({
            data: locationIds.map((locationId) => ({ callReportId: id, locationId })),
          });
        }
      }
      if (serviceIds !== undefined) {
        await tx.manager_call_report_services.deleteMany({ where: { callReportId: id } });
        if (serviceIds.length) {
          await tx.manager_call_report_services.createMany({
            data: serviceIds.map((serviceId) => ({ callReportId: id, serviceId })),
          });
        }
      }
      return tx.manager_call_reports.update({
        where: { id },
        data,
        include: {
          manager_call_report_locations: { include: { locations: { select: { id: true, name: true, slug: true, type: true } } } },
          manager_call_report_services: { include: { services: { select: { id: true, name: true, slug: true } } } },
        },
      });
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    logger.error('Failed to update manager call report', error);
    return NextResponse.json({ error: 'Failed to update call report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }
    const { id } = await resolveParams(params);

    const existing = await prisma.manager_call_reports.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Call report not found' }, { status: 404 });

    const isOwner = existing.managerId === manager.id || ['ADMIN', 'SUPER_ADMIN'].includes(manager.role);
    if (!isOwner) {
      return NextResponse.json({ error: 'You can only delete call reports you added' }, { status: 403 });
    }

    await prisma.manager_call_reports.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete manager call report', error);
    return NextResponse.json({ error: 'Failed to delete call report' }, { status: 500 });
  }
}
