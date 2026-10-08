import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { sourceFor } from '@/lib/refunds/refund-sources';

export const dynamic = 'force-dynamic';

// Booking table -> the customer-facing route each source's detail page lives at.
const BOOKING_ROUTE: Record<string, string> = {
  bike_bookings: 'bike-bookings',
  car_bookings: 'self-drive-bookings',
  chauffeur_bookings: 'car-rental-bookings',
  bus_bookings: 'bus-bookings',
  truck_bookings: 'truck-bookings',
  packers_bookings: 'packers-bookings',
  luxury_bookings: 'luxury-bookings',
  equipment_bookings: 'equipment-bookings',
};

/**
 * GET /api/customer/refunds?customer_id=…
 *
 * Every refund_followups row for this customer, most recent first. Only the
 * fields needed to identify each one and link to its booking — the actual
 * status wording comes from /api/customer/refund-status (RefundStatusCard
 * fetches that itself per row), so the two stay in sync automatically.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    const rows = await prisma.refund_followups.findMany({
      where: { customerId },
      select: {
        source: true,
        bookingId: true,
        bookingNumber: true,
        serviceType: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const refunds = rows.map((r) => ({
      source: r.source,
      bookingId: r.bookingId,
      bookingNumber: r.bookingNumber,
      serviceType: r.serviceType,
      amount: r.amount,
      raisedAt: r.createdAt.toISOString(),
      bookingUrl: BOOKING_ROUTE[r.source] ? `/customer/${BOOKING_ROUTE[r.source]}/${r.bookingId}` : null,
      // Defensive — sourceFor keeps this list scoped to tables the refunds
      // desk actually knows about, same rule refund-status enforces.
      known: !!sourceFor(r.source),
    })).filter((r) => r.known);

    return NextResponse.json({ refunds });
  } catch (error) {
    logger.error('Customer refunds list failed', error);
    return NextResponse.json({ error: 'Could not load refunds' }, { status: 500 });
  }
}
