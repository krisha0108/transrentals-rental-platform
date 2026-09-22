// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function dateRange(month: string | null) {
  if (!month) return null;
  const [yr, mo] = month.split('-').map(Number);
  return {
    gte: new Date(yr, mo - 1, 1),
    lte: new Date(yr, mo, 0, 23, 59, 59, 999),
  };
}

// Normalize payment status to: 'paid' | 'partial' | 'pending'
function normPayStatus(ps: string | null | undefined): 'paid' | 'partial' | 'pending' {
  const s = (ps ?? '').toUpperCase();
  if (['PAID', 'PAID_ONLINE', 'COLLECTED', 'WAIVED'].includes(s)) return 'paid';
  if (s === 'PARTIAL') return 'partial';
  return 'pending';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month      = searchParams.get('month');
    const dateFilter = dateRange(month);
    const vid        = auth.vendorId;

    // ─── Unified booking row shape ───────────────────────────────────
    // { service, id, bookingNumber, customerName, totalAmount, paidAmount, paymentStatus, status, createdAt, detailUrl }
    type UB = {
      service: string;
      serviceType: string;
      id: string;
      bookingNumber: string;
      customerName: string;
      totalAmount: number;
      paidAmount: number;
      paymentStatus: 'paid' | 'partial' | 'pending';
      status: string;
      createdAt: Date;
      detailUrl: string;
    };

    const all: UB[] = [];

    // ── 1. Direct Bookings ──────────────────────────────────────────
    try {
      const rows = await prisma.vendor_direct_bookings.findMany({
        where: { vendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, serviceType: true,
                  totalAmount: true, paidAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        all.push({
          service: 'Direct Booking',
          serviceType: 'direct',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.totalAmount || 0), paidAmount: Number(b.paidAmount || 0),
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/direct-bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 2. Bike Bookings ────────────────────────────────────────────
    try {
      const rows = await prisma.bike_bookings.findMany({
        where: { acceptedVendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  totalAmount: true, paidAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        all.push({
          service: 'Bike Rental',
          serviceType: 'bike',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.totalAmount || 0), paidAmount: Number(b.paidAmount || 0),
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/bike-rentals/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 3. Bus Bookings ─────────────────────────────────────────────
    try {
      const rows = await prisma.bus_bookings.findMany({
        where: { vendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  totalAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const paid = normPayStatus(b.paymentStatus) === 'paid' ? Number(b.totalAmount || 0) : 0;
        all.push({
          service: 'Bus & Tempo',
          serviceType: 'bus',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.totalAmount || 0), paidAmount: paid,
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/bus/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 4. Packers Bookings ─────────────────────────────────────────
    try {
      const rows = await prisma.packers_bookings.findMany({
        where: { vendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  totalAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const paid = normPayStatus(b.paymentStatus) === 'paid' ? Number(b.totalAmount || 0) : 0;
        all.push({
          service: 'Packers & Movers',
          serviceType: 'packers-movers',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.totalAmount || 0), paidAmount: paid,
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/packers/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 5. Truck Bookings ───────────────────────────────────────────
    try {
      const rows = await prisma.truck_bookings.findMany({
        where: { vendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  totalAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const paid = normPayStatus(b.paymentStatus) === 'paid' ? Number(b.totalAmount || 0) : 0;
        all.push({
          service: 'Transporter',
          serviceType: 'transporter',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.totalAmount || 0), paidAmount: paid,
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/transporter/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 6. Car Bookings (chauffeur/car-with-driver) ─────────────────
    try {
      const rows = await prisma.chauffeur_bookings.findMany({
        where: { acceptedVendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  grandTotal: true, paidAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        all.push({
          service: 'Car Rental',
          serviceType: 'car-with-driver',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: Number(b.grandTotal || b.paidAmount || 0), paidAmount: Number(b.paidAmount || 0),
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/car-rental/bookings/${b.bookingNumber}`,
        });
      }
    } catch (_) {}

    // ── 7. Luxury Bookings ──────────────────────────────────────────
    try {
      const rows = await prisma.luxury_bookings.findMany({
        where: { acceptedVendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true,
                  finalAmount: true, paymentStatus: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const total = Number(b.finalAmount || 0);
        const paid  = normPayStatus(b.paymentStatus) === 'paid' ? total : 0;
        all.push({
          service: 'Luxury Cars',
          serviceType: 'luxury',
          id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName,
          totalAmount: total, paidAmount: paid,
          paymentStatus: normPayStatus(b.paymentStatus), status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/luxury/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── 8. Wander Tour Bookings ─────────────────────────────────────
    try {
      const rows = await prisma.wander_bookings.findMany({
        where: { vendorId: vid, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { id: true, bookingId: true, vendorId: true,
                  amount: true, advanceAmount: true, advancePaid: true,
                  balancePaid: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const b of rows) {
        const total   = Number(b.amount || 0);
        const advance = Number(b.advanceAmount || 0);
        const paid    = b.balancePaid ? total : b.advancePaid ? advance : 0;
        const ps      = b.balancePaid ? 'paid' : b.advancePaid ? 'partial' : 'pending';
        all.push({
          service: 'Wander Tours',
          serviceType: 'wander',
          id: b.id, bookingNumber: b.bookingId, customerName: 'Tour Customer',
          totalAmount: total, paidAmount: paid,
          paymentStatus: ps as 'paid' | 'partial' | 'pending', status: b.status,
          createdAt: b.createdAt, detailUrl: `/vendor/wander/bookings/${b.id}`,
        });
      }
    } catch (_) {}

    // ── Expenses (direct bookings only for now) ──────────────────────
    let expenses: any[] = [];
    try {
      const expWhere = dateFilter
        ? `AND expenseDate >= '${dateFilter.gte.toISOString()}' AND expenseDate <= '${dateFilter.lte.toISOString()}'`
        : '';
      expenses = await prisma.$queryRawUnsafe(`
        SELECT id, bookingId, category, CAST(amount AS DECIMAL) as amount, note, expenseDate
        FROM vendor_direct_booking_expenses
        WHERE vendorId = '${vid}' ${expWhere}
      `);
    } catch (_) { expenses = []; }

    // ── 9. Cancelled / Refund bookings across all services ──────────
    type RB = {
      service: string; id: string; bookingNumber: string; customerName: string;
      totalAmount: number; refundAmount: number; cancellationReason: string | null;
      cancelledAt: Date | null; status: string; detailUrl: string;
    };
    const refunds: RB[] = [];

    const refundDateFilter = dateFilter ? { cancelledAt: dateFilter } : {};

    try {
      // bike_bookings has no cancelledAt column (unlike the other 9 booking
      // tables) — using it in where/select/orderBy threw a Prisma validation
      // error on every request, silently caught below, so this section was
      // always empty. updatedAt is the closest available proxy: it moves
      // whenever the row's status flips to CANCELLED.
      const rows = await prisma.bike_bookings.findMany({
        where: { acceptedVendorId: vid, status: 'CANCELLED', ...(dateFilter ? { updatedAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, totalAmount: true, refundAmount: true, cancellationReason: true, updatedAt: true, status: true },
        orderBy: { updatedAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Bike Rental', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.totalAmount || 0), refundAmount: Number(b.refundAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.updatedAt, status: b.status, detailUrl: `/vendor/bike-rentals/bookings/${b.id}` });
    } catch (error) {
      logger.error('Vendor financials: bike_bookings refunds query failed', error);
    }

    try {
      const rows = await prisma.bus_bookings.findMany({
        where: { vendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, totalAmount: true, refundAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Bus & Tempo', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.totalAmount || 0), refundAmount: Number(b.refundAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/bus/bookings/${b.id}` });
    } catch (_) {}

    try {
      const rows = await prisma.packers_bookings.findMany({
        where: { vendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, totalAmount: true, refundAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Packers & Movers', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.totalAmount || 0), refundAmount: Number(b.refundAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/packers/bookings/${b.id}` });
    } catch (_) {}

    try {
      const rows = await prisma.truck_bookings.findMany({
        where: { vendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, totalAmount: true, refundAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Transporter', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.totalAmount || 0), refundAmount: Number(b.refundAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/transporter/bookings/${b.id}` });
    } catch (_) {}

    try {
      const rows = await prisma.chauffeur_bookings.findMany({
        where: { acceptedVendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, grandTotal: true, refundAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Car Rental', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.grandTotal || 0), refundAmount: Number(b.refundAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/car-rental/bookings/${b.bookingNumber}` });
    } catch (_) {}

    try {
      const rows = await prisma.luxury_bookings.findMany({
        where: { acceptedVendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingNumber: true, customerName: true, finalAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Luxury Cars', id: b.id, bookingNumber: b.bookingNumber, customerName: b.customerName, totalAmount: Number(b.finalAmount || 0), refundAmount: 0, cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/luxury/bookings/${b.id}` });
    } catch (_) {}

    try {
      const rows = await prisma.wander_bookings.findMany({
        where: { vendorId: vid, status: 'CANCELLED', ...(dateFilter ? { cancelledAt: dateFilter } : {}) },
        select: { id: true, bookingId: true, amount: true, advanceAmount: true, cancellationReason: true, cancelledAt: true, status: true },
        orderBy: { cancelledAt: 'desc' },
      });
      for (const b of rows) refunds.push({ service: 'Wander Tours', id: b.id, bookingNumber: b.bookingId, customerName: 'Tour Customer', totalAmount: Number(b.amount || 0), refundAmount: Number(b.advanceAmount || 0), cancellationReason: b.cancellationReason, cancelledAt: b.cancelledAt, status: b.status, detailUrl: `/vendor/wander/bookings/${b.id}` });
    } catch (_) {}

    refunds.sort((a, b) => (b.cancelledAt?.getTime() ?? 0) - (a.cancelledAt?.getTime() ?? 0));

    const totalRefunds = refunds.reduce((s, r) => s + r.refundAmount, 0);

    // ── Sort combined list ───────────────────────────────────────────
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ── Aggregates ──────────────────────────────────────────────────
    const totalRevenue   = all.reduce((s, b) => s + b.totalAmount, 0);
    const totalCollected = all.reduce((s, b) => s + b.paidAmount,  0);
    const totalPending   = all
      .filter(b => b.paymentStatus !== 'paid')
      .reduce((s, b) => s + Math.max(0, b.totalAmount - b.paidAmount), 0);
    const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netEarnings    = totalCollected - totalExpenses;

    // ── Expense breakdown by category ───────────────────────────────
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }
    const expenseBreakdown = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => (b.amount as number) - (a.amount as number));

    // ── Per-service breakdown ────────────────────────────────────────
    const byService: Record<string, { revenue: number; collected: number; pending: number; count: number }> = {};
    for (const b of all) {
      if (!byService[b.service]) byService[b.service] = { revenue: 0, collected: 0, pending: 0, count: 0 };
      byService[b.service].revenue   += b.totalAmount;
      byService[b.service].collected += b.paidAmount;
      byService[b.service].count     += 1;
      if (b.paymentStatus !== 'paid') {
        byService[b.service].pending += Math.max(0, b.totalAmount - b.paidAmount);
      }
    }
    const serviceBreakdown = Object.entries(byService)
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Pending bookings list ─────────────────────────────────────────
    const pendingBookings = all
      .filter(b => b.paymentStatus !== 'paid' && b.totalAmount > 0)
      .map(b => ({ ...b, balanceDue: Math.max(0, b.totalAmount - b.paidAmount) }))
      .sort((a, b) => b.balanceDue - a.balanceDue);

    // ── Expense per booking ───────────────────────────────────────────
    const expByBooking: Record<string, number> = {};
    for (const e of expenses) {
      expByBooking[e.bookingId] = (expByBooking[e.bookingId] || 0) + Number(e.amount);
    }

    const bookingsList = all.map(b => ({
      ...b,
      expenses:    expByBooking[b.id] || 0,
      netEarnings: b.paidAmount - (expByBooking[b.id] || 0),
      balanceDue:  Math.max(0, b.totalAmount - b.paidAmount),
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCollected,
        totalPending,
        totalExpenses,
        netEarnings,
        bookingCount:  all.length,
        expenseCount:  expenses.length,
        paidCount:     all.filter(b => b.paymentStatus === 'paid').length,
        pendingCount:  all.filter(b => b.paymentStatus === 'pending').length,
        partialCount:  all.filter(b => b.paymentStatus === 'partial').length,
        refundCount:   refunds.length,
        totalRefunds,
      },
      serviceBreakdown,
      expenseBreakdown,
      pendingBookings,
      bookings: bookingsList,
      refunds,
    });
  } catch (err) {
    console.error('[financials] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
