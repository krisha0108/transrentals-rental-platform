// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "2026-02"

    // ── Fetch bookings (standard Prisma — table exists in client) ──
    const bookingWhere: any = { vendorId: auth.vendorId };
    if (month) {
      const [yr, mo] = month.split('-').map(Number);
      bookingWhere.createdAt = {
        gte: new Date(yr, mo - 1, 1),
        lte: new Date(yr, mo, 0, 23, 59, 59, 999),
      };
    }

    const bookings = await prisma.vendor_direct_bookings.findMany({
      where: bookingWhere,
      select: {
        id: true, bookingNumber: true,
        customerName: true, customerPhone: true,
        serviceType: true, status: true,
        totalAmount: true, paidAmount: true,
        paymentStatus: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── Fetch expenses via raw SQL (new table — Prisma client not yet regenerated) ──
    let expenses: any[] = [];
    try {
      if (month) {
        const [yr, mo] = month.split('-').map(Number);
        const start = new Date(yr, mo - 1, 1);
        const end   = new Date(yr, mo, 0, 23, 59, 59, 999);
        expenses = await prisma.$queryRaw`
          SELECT id, bookingId, category, amount, note, expenseDate
          FROM vendor_direct_booking_expenses
          WHERE vendorId = ${auth.vendorId}
            AND expenseDate >= ${start}
            AND expenseDate <= ${end}
        `;
      } else {
        expenses = await prisma.$queryRaw`
          SELECT id, bookingId, category, amount, note, expenseDate
          FROM vendor_direct_booking_expenses
          WHERE vendorId = ${auth.vendorId}
        `;
      }
    } catch (_) {
      // Table may not exist yet — treat as no expenses
      expenses = [];
    }

    // ── Aggregate bookings ──
    const totalRevenue   = bookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
    const totalCollected = bookings.reduce((s, b) => s + Number(b.paidAmount  || 0), 0);
    const totalPending   = bookings
      .filter(b => b.paymentStatus !== 'collected' && b.paymentStatus !== 'paid_online' && b.paymentStatus !== 'waived')
      .reduce((s, b) => s + Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0)), 0);

    // ── Aggregate expenses ──
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netEarnings   = totalCollected - totalExpenses;

    // ── Expense breakdown by category ──
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }
    const expenseBreakdown = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => (b.amount as number) - (a.amount as number));

    // ── Pending payment bookings list ──
    const pendingBookings = bookings
      .filter(b =>
        b.paymentStatus !== 'collected' &&
        b.paymentStatus !== 'paid_online' &&
        b.paymentStatus !== 'waived' &&
        Number(b.totalAmount || 0) > 0
      )
      .map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        serviceType: b.serviceType,
        status: b.status,
        totalAmount:  Number(b.totalAmount || 0),
        paidAmount:   Number(b.paidAmount  || 0),
        balanceDue:   Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0)),
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      }))
      .sort((a, b) => b.balanceDue - a.balanceDue);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCollected,
        totalPending,
        totalExpenses,
        netEarnings,
        bookingCount: bookings.length,
        expenseCount: expenses.length,
      },
      expenseBreakdown,
      pendingBookings,
    });
  } catch (err) {
    console.error('[financials] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
