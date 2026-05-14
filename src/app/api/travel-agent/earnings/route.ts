// @ts-nocheck
//
// Aggregated earnings analytics for a travel agent. Pulls revenue from three
// sources and projects a uniform summary + trend + breakdown view:
//   1. travel_agent_bookings        — direct bookings (TOUR/PROPERTY/TRANSPORT/CUSTOM)
//   2. travel_agent_leads           — lead quotes with verified payments
//   3. travel_agent_fleet_bookings  — fleet-only customer bookings
//
// `period` controls the summary window; trend is always last 6 months.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

type Period = 'month' | 'last30' | 'year' | 'all';

function periodRange(period: Period): { from: Date | null; to: Date } {
  const now = new Date();
  const to = now;
  if (period === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  }
  if (period === 'last30') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to };
  }
  if (period === 'year') {
    return { from: new Date(now.getFullYear(), 0, 1), to };
  }
  return { from: null, to };
}

function previousRange(period: Period): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === 'month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  if (period === 'last30') {
    const to = new Date(now);
    to.setDate(to.getDate() - 30);
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return { from, to };
  }
  if (period === 'year') {
    return {
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
    };
  }
  return null;
}

// Advance amount for a lead — either fixed (quoteAdvanceAmount) or percent of quotedAmount.
function leadAdvance(l: any): number {
  if (l.quoteAdvanceAmount) return Number(l.quoteAdvanceAmount) || 0;
  if (l.quoteAdvancePercent && l.quotedAmount) {
    return Math.round((Number(l.quotedAmount) * Number(l.quoteAdvancePercent)) / 100);
  }
  return 0;
}

const COUNTED_BOOKING_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
const COUNTED_FLEET_STATUSES = ['CONFIRMED', 'COMPLETED'];

// Fetch all three revenue sources for an optional date range.
async function fetchSources(agentId: string, from: Date | null, to: Date) {
  const dateFilter = from ? { gte: from, lte: to } : undefined;

  const [bookings, leads, fleetBookings] = await Promise.all([
    prisma.travel_agent_bookings.findMany({
      where: {
        travelAgentId: agentId,
        status: { in: COUNTED_BOOKING_STATUSES as any },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true, bookingNumber: true, customerName: true, bookingType: true,
        referenceTitle: true, totalAmount: true, paidAmount: true,
        paymentStatus: true, status: true, createdAt: true,
      },
    }),
    prisma.travel_agent_leads.findMany({
      where: {
        travelAgentId: agentId,
        OR: [
          { paymentStatus: 'VERIFIED' },
          { paymentStatus: 'SUBMITTED' },
        ],
        ...(dateFilter ? { customerAcceptedAt: dateFilter } : {}),
      },
      select: {
        id: true, customerName: true, customerPhone: true, destination: true,
        quotedAmount: true, quoteAdvanceAmount: true, quoteAdvancePercent: true,
        paymentStatus: true, customerAcceptedAt: true, paymentVerifiedAt: true,
        paymentSubmittedAt: true,
      },
    }),
    prisma.travel_agent_fleet_bookings.findMany({
      where: {
        travelAgentId: agentId,
        bookingType: 'CUSTOMER',
        status: { in: COUNTED_FLEET_STATUSES as any },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true, customerName: true, amount: true, status: true, createdAt: true,
        startDate: true, endDate: true,
      },
    }),
  ]);

  return { bookings, leads, fleetBookings };
}

// Aggregate totals across the three sources.
function rollup(sources: Awaited<ReturnType<typeof fetchSources>>) {
  let totalRevenue = 0;
  let collected = 0;
  let pending = 0;
  let count = 0;

  for (const b of sources.bookings) {
    const total = Number(b.totalAmount || 0);
    const paid = Number(b.paidAmount || 0);
    totalRevenue += total;
    collected += paid;
    pending += Math.max(0, total - paid);
    count += 1;
  }
  for (const l of sources.leads) {
    const total = Number(l.quotedAmount || 0);
    const adv = leadAdvance(l);
    totalRevenue += total;
    if (l.paymentStatus === 'VERIFIED') {
      collected += adv;
      pending += Math.max(0, total - adv);
    } else if (l.paymentStatus === 'SUBMITTED') {
      pending += adv;
    }
    count += 1;
  }
  for (const f of sources.fleetBookings) {
    const amt = Number(f.amount || 0);
    totalRevenue += amt;
    collected += amt;
    count += 1;
  }
  return { totalRevenue, collected, pending, count };
}

// Group revenue by category for the breakdown chart.
function breakdown(sources: Awaited<ReturnType<typeof fetchSources>>) {
  const map = new Map<string, { amount: number; count: number }>();
  const add = (k: string, amount: number) => {
    if (!map.has(k)) map.set(k, { amount: 0, count: 0 });
    const e = map.get(k)!;
    e.amount += amount;
    e.count += 1;
  };
  for (const b of sources.bookings) add(b.bookingType || 'OTHER', Number(b.totalAmount || 0));
  for (const l of sources.leads) add('LEAD_QUOTE', Number(l.quotedAmount || 0));
  for (const f of sources.fleetBookings) add('FLEET', Number(f.amount || 0));
  return Array.from(map.entries())
    .map(([type, v]) => ({ type, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);
}

// Build the 6-month trend regardless of `period`.
async function trendLast6Months(agentId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sources = await fetchSources(agentId, start, now);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, 0);
  }
  const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  for (const b of sources.bookings) {
    const k = keyOf(new Date(b.createdAt));
    if (buckets.has(k)) buckets.set(k, buckets.get(k)! + Number(b.totalAmount || 0));
  }
  for (const l of sources.leads) {
    const ts = l.customerAcceptedAt || l.paymentVerifiedAt || l.paymentSubmittedAt;
    if (!ts) continue;
    const k = keyOf(new Date(ts));
    if (buckets.has(k)) buckets.set(k, buckets.get(k)! + Number(l.quotedAmount || 0));
  }
  for (const f of sources.fleetBookings) {
    const k = keyOf(new Date(f.createdAt));
    if (buckets.has(k)) buckets.set(k, buckets.get(k)! + Number(f.amount || 0));
  }

  return Array.from(buckets.entries()).map(([month, revenue]) => ({ month, revenue }));
}

// Recent earnings list — top 10 paid/verified items in the window.
function recentList(sources: Awaited<ReturnType<typeof fetchSources>>) {
  const items: any[] = [];
  for (const b of sources.bookings) {
    items.push({
      kind: 'BOOKING',
      id: b.id,
      ref: b.bookingNumber,
      customerName: b.customerName,
      type: b.bookingType,
      title: b.referenceTitle || b.bookingType,
      amount: Number(b.totalAmount || 0),
      paidAmount: Number(b.paidAmount || 0),
      status: b.status,
      paymentStatus: b.paymentStatus,
      date: b.createdAt,
    });
  }
  for (const l of sources.leads) {
    items.push({
      kind: 'LEAD',
      id: l.id,
      ref: null,
      customerName: l.customerName,
      type: 'LEAD_QUOTE',
      title: l.destination || 'Custom quote',
      amount: Number(l.quotedAmount || 0),
      paidAmount: l.paymentStatus === 'VERIFIED' ? leadAdvance(l) : 0,
      status: null,
      paymentStatus: l.paymentStatus,
      date: l.paymentVerifiedAt || l.customerAcceptedAt || l.paymentSubmittedAt,
    });
  }
  for (const f of sources.fleetBookings) {
    items.push({
      kind: 'FLEET',
      id: f.id,
      ref: null,
      customerName: f.customerName || '—',
      type: 'FLEET',
      title: 'Fleet booking',
      amount: Number(f.amount || 0),
      paidAmount: Number(f.amount || 0),
      status: f.status,
      paymentStatus: null,
      date: f.createdAt,
    });
  }
  items.sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  return items.slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const agentId = auth.travelAgentId;

    const period = ((request.nextUrl.searchParams.get('period') || 'month') as Period);
    const range = periodRange(period);
    const prev = previousRange(period);

    const [current, previous, trend] = await Promise.all([
      fetchSources(agentId, range.from, range.to),
      prev ? fetchSources(agentId, prev.from, prev.to) : Promise.resolve(null),
      trendLast6Months(agentId),
    ]);

    const cur = rollup(current);
    const prv = previous ? rollup(previous) : null;

    const deltaPercent = prv && prv.totalRevenue > 0
      ? Math.round(((cur.totalRevenue - prv.totalRevenue) / prv.totalRevenue) * 100)
      : null;

    return NextResponse.json({
      period,
      summary: {
        totalRevenue: cur.totalRevenue,
        collectedRevenue: cur.collected,
        pendingRevenue: cur.pending,
        bookingCount: cur.count,
        trend: {
          current: cur.totalRevenue,
          previous: prv?.totalRevenue ?? null,
          deltaPercent,
        },
      },
      trend,
      breakdownByType: breakdown(current),
      recent: recentList(current),
    });
  } catch (error: any) {
    logger.error('Travel agent earnings error', error);
    return NextResponse.json({ error: 'Failed to load earnings', details: error?.message }, { status: 500 });
  }
}
