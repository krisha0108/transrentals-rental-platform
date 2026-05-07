import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_STATUS = [
  'DRAFT',
  'PENDING_CUSTOMER',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

const VALID_BOOKING_TYPES = ['TOUR', 'PROPERTY', 'TRANSPORT', 'CUSTOM'];

// Generates booking number like TA-20260429-A4F8
function generateBookingNumber(): string {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TA-${datePart}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const bookingType = searchParams.get('bookingType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { travelAgentId: auth.travelAgentId };
    if (status && status !== 'ALL' && VALID_STATUS.includes(status as any)) where.status = status;
    if (bookingType && bookingType !== 'ALL' && VALID_BOOKING_TYPES.includes(bookingType))
      where.bookingType = bookingType;
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { referenceTitle: { contains: search } },
      ];
    }

    const [bookings, total, statsByStatus, totalsAgg] = await Promise.all([
      prisma.travel_agent_bookings.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.travel_agent_bookings.count({ where }),
      prisma.travel_agent_bookings.groupBy({
        by: ['status'],
        where: { travelAgentId: auth.travelAgentId },
        _count: { _all: true },
      }),
      prisma.travel_agent_bookings.aggregate({
        where: { travelAgentId: auth.travelAgentId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const stats: Record<string, number> = {
      total: 0,
      DRAFT: 0,
      PENDING_CUSTOMER: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of statsByStatus) {
      stats[row.status] = row._count._all;
      stats.total += row._count._all;
    }

    // ── Self-bookings: any booking placed by a customer linked to this TA
    //    (i.e. the TA used their own customer-side login to book). Pull from
    //    the major customer booking tables and normalize.
    const selfBookings = await loadSelfBookings(auth.travelAgentId);

    return NextResponse.json({
      bookings,
      selfBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
      totals: {
        bookedAmount: totalsAgg._sum.totalAmount || 0,
        receivedAmount: totalsAgg._sum.paidAmount || 0,
      },
    });
  } catch (error: any) {
    logger.error('List bookings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 },
    );
  }
}

interface SelfBooking {
  id: string;
  service: string;       // BIKE | CAR | BUS | LUXURY | CHAUFFEUR | TRUCK | PACKERS | EQUIPMENT | WANDER
  bookingNumber: string | null;
  amount: number;
  bookingDate: Date | null;
  status: string;
  createdAt: Date;
  trackUrl: string;
}

async function loadSelfBookings(travelAgentId: string): Promise<SelfBooking[]> {
  // Find every customer record linked to this travel agent (raw SQL because
  // linkedTravelAgentId is not yet in the generated Prisma client).
  const linkedRows: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT id FROM customers WHERE linkedTravelAgentId = ?`,
    travelAgentId,
  );
  const customerIds = linkedRows.map((r) => r.id);

  // ── b2b_bookings: TA-routed manager-queue requests (Personal/Company) ──
  const b2bRows: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT id, bookingNumber, serviceType, vehiclesRequired, vehicleCategory,
            scheduledDate, status, finalAmount, vendorCostTotal, bookingMode, createdAt
     FROM b2b_bookings WHERE travelAgentId = ? ORDER BY createdAt DESC`,
    travelAgentId,
  );
  const b2bBookings: SelfBooking[] = b2bRows.map((r) => ({
    id: r.id,
    service: `B2B_${(r.serviceType || 'CAR').toUpperCase()}`,
    bookingNumber: r.bookingNumber,
    amount: r.finalAmount ?? r.vendorCostTotal ?? 0,
    bookingDate: r.scheduledDate,
    status: String(r.status) + (r.bookingMode ? ` (${r.bookingMode})` : ''),
    createdAt: r.createdAt,
    trackUrl: `/customer/b2b-bookings/${r.id}`,
  }));

  if (customerIds.length === 0) return b2bBookings;

  const idIn = { in: customerIds };

  // Each booking table has slightly different columns for amount/date — pick
  // a common projection so the UI can render them uniformly.
  const [bike, car, bus, luxury, chauffeur, truck, packers, equipment, wander] =
    await Promise.all([
      prisma.bike_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, grandTotal: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.car_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, grandTotal: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.bus_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, totalAmount: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.luxury_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, grandTotal: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.chauffeur_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, totalAmount: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.truck_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, totalAmount: true, pickupDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.packers_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, totalAmount: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.equipment_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, bookingNumber: true, totalAmount: true, status: true, createdAt: true },
        })
        .catch(() => []),
      prisma.wander_bookings
        .findMany({
          where: { customerId: idIn },
          select: { id: true, travelDate: true, status: true, createdAt: true },
        })
        .catch(() => []),
    ]);

  const merged: SelfBooking[] = [
    ...bike.map((b: any) => ({
      id: b.id, service: 'BIKE',
      bookingNumber: b.bookingNumber, amount: b.grandTotal ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...car.map((b: any) => ({
      id: b.id, service: 'CAR',
      bookingNumber: b.bookingNumber, amount: b.grandTotal ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...bus.map((b: any) => ({
      id: b.id, service: 'BUS',
      bookingNumber: b.bookingNumber, amount: b.totalAmount ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...luxury.map((b: any) => ({
      id: b.id, service: 'LUXURY',
      bookingNumber: b.bookingNumber, amount: b.grandTotal ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...chauffeur.map((b: any) => ({
      id: b.id, service: 'CHAUFFEUR',
      bookingNumber: b.bookingNumber, amount: b.totalAmount ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...truck.map((b: any) => ({
      id: b.id, service: 'TRUCK',
      bookingNumber: b.bookingNumber, amount: b.totalAmount ?? 0,
      bookingDate: b.pickupDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...packers.map((b: any) => ({
      id: b.id, service: 'PACKERS',
      bookingNumber: b.bookingNumber, amount: b.totalAmount ?? 0,
      bookingDate: null, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...equipment.map((b: any) => ({
      id: b.id, service: 'EQUIPMENT',
      bookingNumber: b.bookingNumber, amount: b.totalAmount ?? 0,
      bookingDate: null, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
    ...wander.map((b: any) => ({
      id: b.id, service: 'WANDER',
      bookingNumber: null, amount: 0,
      bookingDate: b.travelDate, status: String(b.status),
      createdAt: b.createdAt, trackUrl: `/customer/track/${b.id}`,
    })),
  ];

  merged.push(...b2bBookings);
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return merged;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      bookingType,
      referenceId,
      referenceTitle,
      pickupLocation,
      dropLocation,
      travelDate,
      returnDate,
      checkInDate,
      checkOutDate,
      passengers,
      rooms,
      totalAmount,
      paidAmount,
      paymentStatus,
      notes,
      status,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 },
      );
    }
    if (!bookingType || !VALID_BOOKING_TYPES.includes(bookingType)) {
      return NextResponse.json(
        { error: `bookingType must be one of: ${VALID_BOOKING_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Resolve referenceTitle from tour/property if only id given
    let resolvedTitle = referenceTitle || null;
    if (referenceId && !resolvedTitle) {
      if (bookingType === 'TOUR') {
        const t = await prisma.travel_agent_tours.findUnique({
          where: { id: referenceId },
          select: { title: true, travelAgentId: true },
        });
        if (t && t.travelAgentId === auth.travelAgentId) resolvedTitle = t.title;
      } else if (bookingType === 'PROPERTY') {
        const p = await prisma.travel_agent_properties.findUnique({
          where: { id: referenceId },
          select: { name: true, travelAgentId: true },
        });
        if (p && p.travelAgentId === auth.travelAgentId) resolvedTitle = p.name;
      }
    }

    // Generate a unique booking number, retrying on the (very rare) collision
    let bookingNumber = generateBookingNumber();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.travel_agent_bookings.findUnique({
        where: { bookingNumber },
        select: { id: true },
      });
      if (!exists) break;
      bookingNumber = generateBookingNumber();
    }

    const booking = await prisma.travel_agent_bookings.create({
      data: {
        travelAgentId: auth.travelAgentId,
        bookingNumber,
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone).trim(),
        customerEmail: customerEmail || null,
        bookingType,
        referenceId: referenceId || null,
        referenceTitle: resolvedTitle,
        pickupLocation: pickupLocation || null,
        dropLocation: dropLocation || null,
        travelDate: travelDate ? new Date(travelDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
        passengers: passengers ? Number(passengers) : 1,
        rooms: rooms ? Number(rooms) : 1,
        totalAmount: totalAmount ? Number(totalAmount) : 0,
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        paymentStatus: paymentStatus || 'PENDING',
        notes: notes || null,
        status: VALID_STATUS.includes(status) ? status : 'DRAFT',
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    logger.error('Create booking error', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error?.message },
      { status: 500 },
    );
  }
}
