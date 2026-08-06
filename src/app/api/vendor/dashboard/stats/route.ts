// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function getPeriodRange(period: string, request: NextRequest, now: Date) {
  let periodStart: Date;
  let periodEnd: Date | null = null; // null = no upper bound (open-ended, up to now)

  if (period === 'today') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    periodStart = new Date(now.getFullYear(), now.getMonth(), diff);
  } else if (period === 'quarter') {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (period === 'year') {
    periodStart = new Date(now.getFullYear(), 0, 1);
  } else if (period === 'all') {
    periodStart = new Date(2000, 0, 1);
  } else if (period === 'custom') {
    const fromParam = request.nextUrl.searchParams.get('from');
    const toParam = request.nextUrl.searchParams.get('to');
    periodStart = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    if (toParam) {
      periodEnd = new Date(toParam);
      periodEnd.setHours(23, 59, 59, 999);
    }
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { periodStart, periodEnd };
}

// Same-length window immediately preceding the current period, for a
// "vs previous period" comparison — works uniformly for every period type
// (today/week/month/quarter/year/custom) without special-casing each one.
// "all" has no meaningful predecessor, so growth is not computed for it.
function getPreviousPeriodRange(period: string, periodStart: Date, periodEnd: Date | null, now: Date) {
  if (period === 'all') return null;
  const end = periodEnd || now;
  const durationMs = end.getTime() - periodStart.getTime();
  if (durationMs <= 0) return null;
  const prevEnd = new Date(periodStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { prevStart, prevEnd };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    const now = new Date();
    const period = request.nextUrl.searchParams.get('period') || 'month';
    const { periodStart, periodEnd } = getPeriodRange(period, request, now);
    const previousRange = getPreviousPeriodRange(period, periodStart, periodEnd, now);

    // Per-table exclusions — only use statuses that actually exist in each enum
    // Batch 1: bike, chauffeur, self-drive, bus
    const [bikeBookings, chauffeurBookings, selfDriveBookings, busBookings] = await Promise.all([
      prisma.bike_bookings.findMany({
        where: {
          OR: [{ acceptedVendorId: vendorId }, { assignedVendorId: vendorId }],
          status: { notIn: ['CANCELLED', 'DROPPED', 'EXPIRED', 'REFUNDED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] bike_bookings query failed:', e.message); return []; }),

      prisma.chauffeur_bookings.findMany({
        where: {
          OR: [{ acceptedVendorId: vendorId }, { assignedVendorId: vendorId }],
          status: { notIn: ['CANCELLED', 'DROPPED', 'EXPIRED'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] chauffeur_bookings query failed:', e.message); return []; }),

      prisma.car_bookings.findMany({
        where: {
          OR: [{ acceptedVendorId: vendorId }, { assignedVendorId: vendorId }],
          status: { notIn: ['CANCELLED', 'DROPPED', 'EXPIRED', 'REFUNDED'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] car_bookings query failed:', e.message); return []; }),

      prisma.bus_bookings.findMany({
        where: {
          vendorId,
          status: { notIn: ['CANCELLED', 'DROPPED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] bus_bookings query failed:', e.message); return []; }),
    ]);

    // Batch 2: luxury, packers, truck, equipment
    const [luxuryBookings, packersBookings, truckBookings, equipmentBookings] = await Promise.all([
      prisma.luxury_bookings.findMany({
        where: {
          OR: [{ acceptedVendorId: vendorId }, { assignedVendorId: vendorId }],
          status: { notIn: ['CANCELLED', 'DROPPED', 'EXPIRED'] },
        },
        select: { grandTotal: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] luxury_bookings query failed:', e.message); return []; }),

      prisma.packers_bookings.findMany({
        where: {
          vendorId,
          status: { notIn: ['CANCELLED', 'DROPPED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] packers_bookings query failed:', e.message); return []; }),

      prisma.truck_bookings.findMany({
        where: {
          vendorId,
          status: { notIn: ['CANCELLED', 'DROPPED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] truck_bookings query failed:', e.message); return []; }),

      prisma.equipment_bookings.findMany({
        where: {
          vendorId,
          status: { notIn: ['CANCELLED', 'DROPPED'] },
        },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] equipment_bookings query failed:', e.message); return []; }),
    ]);

    // Batch 3: wander, direct bookings
    const [wanderBookings, directBookings] = await Promise.all([
      prisma.wander_bookings.findMany({
        where: { vendorId, status: { notIn: ['CANCELLED', 'DROPPED'] } },
        select: { amount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] wander_bookings query failed:', e.message); return []; }),

      prisma.vendor_direct_bookings.findMany({
        where: { vendorId, status: { notIn: ['cancelled', 'dropped', 'rejected'] } },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] vendor_direct_bookings query failed:', e.message); return []; }),
    ]);

    // Combine all bookings with service info (exactly like mobile app).
    // `isCompleted` is normalized here since vendor_direct_bookings uses a
    // lowercase free-text status ("completed") while every other table uses
    // an uppercase enum ("COMPLETED") — everything downstream (revenue,
    // booking counts, breakdown) only trusts this flag, never raw booking
    // status, since "not cancelled" is not the same thing as "earned".
    const allBookings = [
      ...bikeBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'bike', isCompleted: b.status === 'COMPLETED' })),
      ...chauffeurBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'chauffeur', isCompleted: b.status === 'COMPLETED' })),
      ...selfDriveBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'self-drive', isCompleted: b.status === 'COMPLETED' })),
      ...busBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'bus', isCompleted: b.status === 'COMPLETED' })),
      ...luxuryBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'luxury', isCompleted: b.status === 'COMPLETED' })),
      ...packersBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'packers', isCompleted: b.status === 'COMPLETED' })),
      ...truckBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'truck', isCompleted: b.status === 'COMPLETED' })),
      ...equipmentBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'equipment', isCompleted: b.status === 'COMPLETED' })),
      ...wanderBookings.map(b => ({ ...b, amount: Number(b.amount) || 0, service: 'wander', isCompleted: b.status === 'COMPLETED' })),
      ...directBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'direct', isCompleted: String(b.status).toLowerCase() === 'completed' })),
    ];

    // Only COMPLETED bookings count as revenue — a booking that's merely
    // accepted/broadcasted/pending-payment hasn't actually been earned yet,
    // so it must not be counted as "revenue" (it was previously, which
    // inflated this number with unpaid/in-pipeline bookings).
    const completedBookings = allBookings.filter((b) => b.isCompleted);

    const inRange = (b: typeof allBookings[number], start: Date, end: Date | null) => {
      const d = new Date(b.createdAt);
      return d >= start && (end === null || d <= end);
    };

    const periodCompleted = completedBookings.filter((b) => inRange(b, periodStart, periodEnd));
    const revenue = periodCompleted.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Revenue growth vs the immediately preceding period of equal length.
    let revenueGrowthPct: number | null = null;
    if (previousRange) {
      const previousCompleted = completedBookings.filter((b) => inRange(b, previousRange.prevStart, previousRange.prevEnd));
      const previousRevenue = previousCompleted.reduce((sum, b) => sum + (b.amount || 0), 0);
      if (previousRevenue > 0) {
        revenueGrowthPct = ((revenue - previousRevenue) / previousRevenue) * 100;
      } else if (revenue > 0) {
        revenueGrowthPct = 100; // went from nothing to something
      } else {
        revenueGrowthPct = 0;
      }
    }

    // Service breakdown — completed revenue within the selected period only,
    // so the pie/bars/podium always match the headline revenue number.
    const svc = (key: string) => periodCompleted.filter(b => b.service === key);
    const rev = (arr: typeof allBookings) => arr.reduce((sum, b) => sum + b.amount, 0);

    const serviceBreakdown = [
      { service: 'Bike Rentals',      icon: '🏍️', key: 'bike'      },
      { service: 'Car Rentals',       icon: '🚗', key: 'chauffeur' },
      { service: 'Self-Drive',        icon: '🔑', key: 'self-drive'},
      { service: 'Bus Rentals',       icon: '🚌', key: 'bus'       },
      { service: 'Luxury Cars',       icon: '💎', key: 'luxury'    },
      { service: 'Packers & Movers',  icon: '📦', key: 'packers'   },
      { service: 'Truck Transport',   icon: '🚚', key: 'truck'     },
      { service: 'Equipment Rental',  icon: '⚙️', key: 'equipment' },
      { service: 'Wander Tours',      icon: '🗺️', key: 'wander'    },
      { service: 'Direct Bookings',   icon: '📋', key: 'direct'    },
    ]
      .map(s => ({ service: s.service, icon: s.icon, bookings: svc(s.key).length, revenue: rev(svc(s.key)) }))
      .filter(s => s.bookings > 0 || s.revenue > 0);

    return NextResponse.json({
      success: true,
      stats: {
        revenue,
        revenueGrowthPct,
        totalBookings: periodCompleted.length,
        serviceBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor dashboard stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error?.message },
      { status: 500 }
    );
  }
}
