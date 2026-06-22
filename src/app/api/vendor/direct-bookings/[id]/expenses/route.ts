// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

function cuid() {
  // Simple cuid-like ID generator for raw inserts
  const ts  = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rand}`;
}

// GET — list all expenses for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking belongs to this vendor
    const booking = await prisma.vendor_direct_bookings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      select: { id: true },
    });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Raw query — new table may not be in Prisma client yet
    const expenses: any[] = await prisma.$queryRaw`
      SELECT id, bookingId, category, amount, note, expenseDate, createdAt
      FROM vendor_direct_booking_expenses
      WHERE bookingId = ${params.id}
      ORDER BY expenseDate DESC
    `;

    return NextResponse.json({ expenses });
  } catch (err) {
    console.error('[expenses GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — add an expense to a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking belongs to this vendor
    const booking = await prisma.vendor_direct_bookings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      select: { id: true },
    });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { category, amount, note, expenseDate } = body;

    if (!category || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'category and amount are required' }, { status: 400 });
    }

    const id  = cuid();
    const now = new Date();
    const expDate = expenseDate ? new Date(expenseDate) : now;
    const noteVal = note?.trim() || null;
    const amountVal = parseFloat(amount);
    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;
    const bookingId = params.id;

    await prisma.$executeRaw`
      INSERT INTO vendor_direct_booking_expenses
        (id, bookingId, vendorId, category, amount, note, expenseDate, createdAt, updatedAt)
      VALUES
        (${id}, ${bookingId}, ${vendorId}, ${category.trim()}, ${amountVal}, ${noteVal}, ${expDate}, ${now}, ${now})
    `;

    const expense = {
      id, bookingId, vendorId,
      category: category.trim(),
      amount: amountVal,
      note: noteVal,
      expenseDate: expDate,
      createdAt: now,
    };

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    console.error('[expenses POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
