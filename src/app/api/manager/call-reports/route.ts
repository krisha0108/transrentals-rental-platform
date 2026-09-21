// Manager vendor-acquisition call sheet — a shared reporting log for
// outbound calls managers make to prospective vendors while out in the
// field. Every manager can see the full sheet (like a shared spreadsheet)
// and add their own rows; each row is tagged with who added it. A report can
// cover several locations and several services at once, tracked via the
// manager_call_report_locations / manager_call_report_services join tables.
//
//   GET  ?status=<call_report_status|all>&from=<yyyy-mm-dd>&to=<yyyy-mm-dd>
//        &q=<search>&mine=true&city=<name>&serviceId=<id>&locationId=<id>
//        &flagged=<true|false>&limit=<n>
//        → { items, counts: { total, byStatus, flagged }, todayCount }
//   POST body: { vendorName, companyName?, companyDetails?, phone?, email?, address?,
//        city?, contactType?: 'VENDOR'|'TRAVEL_AGENT', serviceIds?: string[],
//        locationIds?: string[], status?, notes?, vendorId?, callDate? }
//        → { success, report }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { logCallReportAction } from '@/lib/manager-call-report-log';

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

export async function GET(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toUpperCase();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const q = (searchParams.get('q') || '').trim();
    const mine = searchParams.get('mine') === 'true';
    const city = (searchParams.get('city') || '').trim();
    const serviceId = (searchParams.get('serviceId') || '').trim();
    const locationId = (searchParams.get('locationId') || '').trim();
    // Absent means "don't care" — only an explicit true/false narrows the list,
    // so the default sheet still shows flagged rows alongside everything else.
    const flaggedParam = searchParams.get('flagged');
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, Math.floor(limitRaw)) : 200;

    const where: any = {};
    if (mine) where.managerId = manager.id;
    if (STATUS_VALUES.includes(status as any)) where.status = status;
    if (from || to) {
      where.callDate = {};
      if (from) where.callDate.gte = new Date(`${from}T00:00:00`);
      if (to) where.callDate.lte = new Date(`${to}T23:59:59`);
    }
    if (q) {
      where.OR = [
        { vendorName: { contains: q } },
        { companyName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
        { address: { contains: q } },
      ];
    }
    if (city) where.city = city;
    if (serviceId) where.manager_call_report_services = { some: { serviceId } };
    if (locationId) where.manager_call_report_locations = { some: { locationId } };
    if (flaggedParam === 'true') where.isFlagged = true;
    else if (flaggedParam === 'false') where.isFlagged = false;

    const rows = await prisma.manager_call_reports.findMany({
      where,
      orderBy: { callDate: 'desc' },
      take: limit,
      include: {
        manager_call_report_locations: {
          include: { locations: { select: { id: true, name: true, slug: true, type: true } } },
        },
        manager_call_report_services: {
          include: { services: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    const managerIds = [...new Set([
      ...rows.map((r) => r.managerId),
      ...rows.map((r) => r.flaggedById).filter(Boolean) as string[],
    ])];
    const managers = managerIds.length
      ? await prisma.admin_users.findMany({ where: { id: { in: managerIds } }, select: { id: true, name: true } })
      : [];
    const managerById = new Map(managers.map((m) => [m.id, m.name]));

    const vendorIds = [...new Set(rows.map((r) => r.vendorId).filter(Boolean))] as string[];
    const vendors = vendorIds.length
      ? await prisma.vendors.findMany({ where: { id: { in: vendorIds } }, select: { id: true, businessName: true, vid: true, status: true } })
      : [];
    const vendorById = new Map(vendors.map((v) => [v.id, v]));

    const travelAgentIds = [...new Set(rows.map((r) => r.travelAgentId).filter(Boolean))] as string[];
    const travelAgents = travelAgentIds.length
      ? await prisma.travel_agents.findMany({ where: { id: { in: travelAgentIds } }, select: { id: true, agencyName: true, tid: true, status: true } })
      : [];
    const travelAgentById = new Map(travelAgents.map((a) => [a.id, a]));

    const items = rows.map((r) => ({
      id: r.id,
      vendorId: r.vendorId,
      vendor: r.vendorId ? vendorById.get(r.vendorId) || null : null,
      travelAgentId: r.travelAgentId,
      travelAgent: r.travelAgentId ? travelAgentById.get(r.travelAgentId) || null : null,
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
      isFlagged: r.isFlagged,
      flagReason: r.flagReason,
      flaggedAt: r.flaggedAt,
      flaggedById: r.flaggedById,
      flaggedByName: r.flaggedById ? managerById.get(r.flaggedById) || null : null,
      callDate: r.callDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      managerId: r.managerId,
      managerName: managerById.get(r.managerId) || null,
      canEdit: r.managerId === manager.id || ['ADMIN', 'SUPER_ADMIN'].includes(manager.role),
    }));

    // Counts scoped to the same filters (minus status) so the status-pill
    // tally on screen matches what "clearing" that one filter would show.
    const countWhere: any = { ...where };
    delete countWhere.status;
    // The flagged tally ignores the flagged filter itself, for the same reason
    // the status tally ignores the status filter — the chip has to keep showing
    // its own number once you have clicked it.
    const flaggedCountWhere: any = { ...countWhere };
    delete flaggedCountWhere.isFlagged;
    const grouped = await prisma.manager_call_reports.groupBy({
      by: ['status'],
      where: countWhere,
      _count: { _all: true },
    });
    const byStatus: Record<string, number> = {};
    let total = 0;
    grouped.forEach((g) => {
      byStatus[g.status] = g._count._all;
      total += g._count._all;
    });

    const flagged = await prisma.manager_call_reports.count({
      where: { ...flaggedCountWhere, isFlagged: true },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await prisma.manager_call_reports.count({
      where: { callDate: { gte: startOfToday }, ...(mine ? { managerId: manager.id } : {}) },
    });

    return NextResponse.json({ items, counts: { total, byStatus, flagged }, todayCount });
  } catch (error) {
    logger.error('Failed to list manager call reports', error);
    return NextResponse.json({ error: 'Failed to load call reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body: any = await request.json();
    const vendorName = (body?.vendorName || '').trim();
    const companyName = (body?.companyName || '').trim() || null;
    const companyDetails = (body?.companyDetails || '').trim() || null;
    const phone = (body?.phone || '').trim() || null;
    const email = (body?.email || '').trim().toLowerCase() || null;
    const address = (body?.address || '').trim() || null;
    const city = (body?.city || '').trim() || null;
    const contactType = body?.contactType === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : 'VENDOR';
    const notes = (body?.notes || '').trim() || null;
    const vendorId = (body?.vendorId || '').trim() || null;
    const serviceIds: string[] = Array.isArray(body?.serviceIds) ? [...new Set<string>(body.serviceIds.filter(Boolean))] : [];
    const locationIds: string[] = Array.isArray(body?.locationIds) ? [...new Set<string>(body.locationIds.filter(Boolean))] : [];
    const status = STATUS_VALUES.includes(body?.status) ? body.status : 'FOLLOW_UP';
    const callDate = body?.callDate ? new Date(body.callDate) : new Date();
    const nextFollowUpDate = body?.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null;
    const nextFollowUpTime = (body?.nextFollowUpTime || '').trim() || null;
    const nextAction = (body?.nextAction || '').trim() || null;

    if (!vendorName) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    if (vendorId) {
      const vendor = await prisma.vendors.findUnique({ where: { id: vendorId }, select: { id: true } });
      if (!vendor) {
        return NextResponse.json({ error: 'Linked vendor not found' }, { status: 400 });
      }
    }
    if (serviceIds.length) {
      const found = await prisma.services.count({ where: { id: { in: serviceIds } } });
      if (found !== serviceIds.length) {
        return NextResponse.json({ error: 'One or more selected services were not found' }, { status: 400 });
      }
    }
    if (locationIds.length) {
      const found = await prisma.locations.count({ where: { id: { in: locationIds } } });
      if (found !== locationIds.length) {
        return NextResponse.json({ error: 'One or more selected locations were not found' }, { status: 400 });
      }
    }

    const report = await prisma.manager_call_reports.create({
      data: {
        managerId: manager.id,
        vendorId,
        vendorName,
        companyName,
        companyDetails,
        phone,
        email,
        address,
        city,
        contactType,
        status,
        nextFollowUpDate,
        nextFollowUpTime,
        nextAction,
        notes,
        callDate,
        manager_call_report_locations: locationIds.length
          ? { create: locationIds.map((locationId) => ({ locationId })) }
          : undefined,
        manager_call_report_services: serviceIds.length
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
      include: {
        manager_call_report_locations: { include: { locations: { select: { id: true, name: true, slug: true, type: true } } } },
        manager_call_report_services: { include: { services: { select: { id: true, name: true, slug: true } } } },
      },
    });

    // Mirror it into the action log so the admin performance numbers, which
    // are counted from that log, include this call.
    await logCallReportAction({
      managerId: manager.id,
      reportId: report.id,
      status,
      contactType,
      note: notes,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    logger.error('Failed to create manager call report', error);
    return NextResponse.json({ error: 'Failed to save call report' }, { status: 500 });
  }
}
