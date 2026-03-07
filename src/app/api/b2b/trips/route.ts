// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - List trips for a booking (HR dashboard, manager dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    if (!bookingId && !vendorId) {
      return NextResponse.json({ error: 'booking_id or vendor_id is required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (bookingId) whereClause.bookingId = bookingId;
    if (vendorId) whereClause.vendorId = vendorId;
    if (status && status !== 'all') whereClause.status = status;

    const [trips, total] = await Promise.all([
      prisma.b2b_trips.findMany({
        where: whereClause,
        include: {
          vendor: { select: { id: true, businessName: true } },
          booking: {
            select: { bookingNumber: true, companyName: true, serviceType: true, pickupLocation: true, dropLocation: true }
          },
        },
        orderBy: { createdAt: 'asc' },
        skip, take: limit,
      }),
      prisma.b2b_trips.count({ where: whereClause }),
    ]);

    // Summary stats
    const allTrips = await prisma.b2b_trips.groupBy({
      by: ['status'],
      where: bookingId ? { bookingId } : { vendorId: vendorId! },
      _count: true,
    });

    const stats: Record<string, number> = {};
    allTrips.forEach(s => { stats[s.status] = s._count; });

    return NextResponse.json({
      status: 'success',
      trips,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('B2B Trips GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}
