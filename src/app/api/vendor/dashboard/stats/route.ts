// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;
    const now = new Date();
    const period = request.nextUrl.searchParams.get('period') || 'month';

    let periodStart: Date;
    let periodEnd: Date | null = null; // null = no upper bound

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
    const startOfMonth = periodStart;

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
        where: { vendorId, status: { notIn: ['CANCELLED', 'DROPPED'] } },
        select: { totalAmount: true, status: true, createdAt: true },
      }).catch((e) => { console.error('[Dashboard] vendor_direct_bookings query failed:', e.message); return []; }),
    ]);

    // Combine all bookings with service info (exactly like mobile app)
    const allBookings = [
      ...bikeBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'bike' })),
      ...chauffeurBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'chauffeur' })),
      ...selfDriveBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'self-drive' })),
      ...busBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'bus' })),
      ...luxuryBookings.map(b => ({ ...b, amount: Number(b.grandTotal) || 0, service: 'luxury' })),
      ...packersBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'packers' })),
      ...truckBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'truck' })),
      ...equipmentBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'equipment' })),
      ...wanderBookings.map(b => ({ ...b, amount: Number(b.amount) || 0, service: 'wander' })),
      ...directBookings.map(b => ({ ...b, amount: Number(b.totalAmount) || 0, service: 'direct' })),
    ];

    // Filter bookings by period
    const thisMonthBookings = allBookings.filter((b) => {
      const d = new Date(b.createdAt);
      return d >= startOfMonth && (periodEnd === null || d <= periodEnd);
    });

    // Calculate this month's earnings
    const monthlyEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Count completed bookings (all time, like mobile app)
    const completedBookings = allBookings.filter((b) => b.status === 'COMPLETED');
    const totalCompletedCount = completedBookings.length;

    // Service breakdown (this month only)
    const svc = (key: string) => thisMonthBookings.filter(b => b.service === key);
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

    // Debug logs
    console.log('[Dashboard Stats] Raw counts — bike:', bikeBookings.length, 'chauffeur:', chauffeurBookings.length, 'self-drive:', selfDriveBookings.length, 'bus:', busBookings.length, 'luxury:', luxuryBookings.length, 'wander:', wanderBookings.length);
    console.log('[Dashboard Stats] Total bookings fetched:', allBookings.length);
    console.log('[Dashboard Stats] This month bookings:', thisMonthBookings.length, '| period start:', startOfMonth.toISOString());
    console.log('[Dashboard Stats] This month earnings:', monthlyEarnings);
    console.log('[Dashboard Stats] Breakdown:', serviceBreakdown.map(s => `${s.service}: ${s.bookings} bookings ₹${s.revenue}`).join(', '));

    return NextResponse.json({
      success: true,
      stats: {
        monthlyEarnings,
        totalBookings: totalCompletedCount, // All time completed bookings (like mobile app)
        serviceBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor dashboard stats', error);
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error?.message },
      { status: 500 }
    );
  }
}
