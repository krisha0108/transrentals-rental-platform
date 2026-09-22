// Admin view of the manager call sheet.
//
// Managers file call reports from /manager/call-reports, but until now the
// admin side only ever saw a *count* of them on the performance page. This
// route exposes the rows themselves — every field, across every manager — so
// an admin can audit the actual work, and can act on the rows managers have
// flagged as bad.
//
//   GET  ?status=<call_report_status|all>&managerId=<id>&from=&to=&q=
//        &city=&contactType=&flagged=<true|false>&limit=<n>
//        → { items, counts: { total, byStatus, flagged }, managers }
//
// Deleting lives in ./[id] and ./flagged — deliberately separate, because a
// delete here is permanent and should not share a handler with a read.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { requireAdmin } from '@/lib/auth/require-admin';

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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toUpperCase();
    const managerId = (searchParams.get('managerId') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const q = (searchParams.get('q') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    const contactType = (searchParams.get('contactType') || '').trim().toUpperCase();
    const flaggedParam = searchParams.get('flagged');
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(1000, Math.floor(limitRaw)) : 300;

    const where: any = {};
    if (managerId) where.managerId = managerId;
    if (STATUS_VALUES.includes(status as any)) where.status = status;
    if (contactType === 'VENDOR' || contactType === 'TRAVEL_AGENT') where.contactType = contactType;
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
    if (flaggedParam === 'true') where.isFlagged = true;
    else if (flaggedParam === 'false') where.isFlagged = false;

    const rows = await prisma.manager_call_reports.findMany({
      where,
      // Flagged rows first: they are the ones needing a decision. Within each
      // group the sheet's own newest-first order is kept.
      orderBy: [{ isFlagged: 'desc' }, { callDate: 'desc' }],
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

    const peopleIds = [...new Set([
      ...rows.map((r) => r.managerId),
      ...(rows.map((r) => r.flaggedById).filter(Boolean) as string[]),
    ])];
    const people = peopleIds.length
      ? await prisma.admin_users.findMany({ where: { id: { in: peopleIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(people.map((p) => [p.id, p.name]));

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
      flaggedByName: r.flaggedById ? nameById.get(r.flaggedById) || null : null,
      callDate: r.callDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      managerId: r.managerId,
      managerName: nameById.get(r.managerId) || null,
    }));

    // Tallies drop the filter they describe, so a chip keeps showing its own
    // number after you click it.
    const statusCountWhere: any = { ...where };
    delete statusCountWhere.status;
    const flaggedCountWhere: any = { ...where };
    delete flaggedCountWhere.isFlagged;

    const [grouped, flagged, managers] = await Promise.all([
      prisma.manager_call_reports.groupBy({
        by: ['status'],
        where: statusCountWhere,
        _count: { _all: true },
      }),
      prisma.manager_call_reports.count({ where: { ...flaggedCountWhere, isFlagged: true } }),
      prisma.admin_users.findMany({
        where: { role: 'MANAGER' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let total = 0;
    grouped.forEach((g) => {
      byStatus[g.status] = g._count._all;
      total += g._count._all;
    });

    return NextResponse.json({ items, counts: { total, byStatus, flagged }, managers });
  } catch (error) {
    logger.error('Failed to list call reports for admin', error);
    return NextResponse.json({ error: 'Failed to load call reports' }, { status: 500 });
  }
}
