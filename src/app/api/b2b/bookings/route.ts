// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onB2BBookingCreated } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B2B-${year}-${random}`;
}

// GET - List B2B bookings (for HR/customer, manager, admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    // allow manager/admin to see all
    const viewAll = searchParams.get('view_all') === 'true';

    const whereClause: any = {};

    if (customerId && !viewAll) {
      whereClause.customerId = customerId;
    } else if (email && !viewAll) {
      // Find customer by email, then filter by their ID
      const customer = await prisma.customers.findFirst({
        where: { email },
        select: { id: true },
      });
      if (customer) {
        whereClause.customerId = customer.id;
      } else {
        whereClause.customerEmail = email;
      }
    }
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const serviceType = searchParams.get('serviceType');
    if (serviceType && serviceType !== 'all') {
      whereClause.serviceType = serviceType;
    }

    const [bookings, total] = await Promise.all([
      prisma.b2b_bookings.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true, companyName: true }
          },
          vendorQuotes: {
            select: { id: true, quoteNumber: true, vendorId: true, vehicleCount: true, totalPrice: true, status: true },
          },
          _count: {
            select: { trips: true, vendorQuotes: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.b2b_bookings.count({ where: whereClause }),
    ]);

    // Enrich with travelAgentId / bookingMode (columns not yet in generated client)
    if (bookings.length) {
      const ids = bookings.map((b: any) => b.id);
      const placeholders = ids.map(() => '?').join(',');
      const taRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT id, travelAgentId, bookingMode FROM b2b_bookings WHERE id IN (${placeholders})`,
        ...ids,
      );
      const taMap = new Map(taRows.map((r) => [r.id, r]));
      for (const b of bookings as any[]) {
        const r = taMap.get(b.id);
        b.travelAgentId = r?.travelAgentId || null;
        b.bookingMode = r?.bookingMode || null;
      }
    }

    return NextResponse.json({
      status: 'success',
      bookings,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('B2B Bookings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch B2B bookings' }, { status: 500 });
  }
}

// POST - HR creates a new B2B bulk booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      serviceType,
      vehiclesRequired,
      passengerCount,
      vehicleCategory,
      pickupLocation,
      dropLocation,
      tripType,
      scheduledDate,
      scheduledTime,
      returnDate,
      returnTime,
      specialNotes,
      // Travel-agent flow
      taBookingMode, // 'PERSONAL' | 'COMPANY'
    } = body;

    // Validations
    if (!customerId || !serviceType || !vehiclesRequired || !pickupLocation || !tripType || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, serviceType, vehiclesRequired, pickupLocation, tripType, scheduledDate, scheduledTime' },
        { status: 400 }
      );
    }

    if (vehiclesRequired < 1 || vehiclesRequired > 500) {
      return NextResponse.json({ error: 'vehiclesRequired must be between 1 and 500' }, { status: 400 });
    }

    // Look up customer + check linked TA (raw SQL because the column isn't in
    // the generated Prisma client yet)
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true, phone: true, companyName: true, isB2B: true, b2bStatus: true, isBanned: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (customer.isBanned) {
      return NextResponse.json({ error: 'Account is suspended' }, { status: 403 });
    }

    // Only COMPANY-mode TA bookings belong in b2b_bookings. PERSONAL TA
    // bookings should be routed to the normal customer flow (per service)
    // — reject them here so a misconfigured caller can't dump them into the
    // manager queue.
    if (taBookingMode === 'PERSONAL') {
      return NextResponse.json(
        { error: 'PERSONAL travel-agent bookings are not accepted here. Use the regular service quote-request endpoint instead.' },
        { status: 400 },
      );
    }

    let linkedTravelAgentId: string | null = null;
    if (taBookingMode === 'COMPANY') {
      const linkedRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
        customer.id,
      );
      linkedTravelAgentId = linkedRows[0]?.linkedTravelAgentId || null;
    }

    // Allow if either: (a) classic B2B-approved customer, or (b) linked TA (COMPANY)
    if (!linkedTravelAgentId && (!customer.isB2B || customer.b2bStatus !== 'APPROVED')) {
      return NextResponse.json({ error: 'B2B access not approved. Please wait for admin approval.' }, { status: 403 });
    }

    const bookingId = generateId();
    let companyName = customer.companyName || customer.name;
    let bookingNumber = generateBookingNumber();
    // For travel-agent COMPANY bookings, prefer the agent's real phone over
    // the shadow customer's placeholder (`ta-<id>`).
    let resolvedCustomerPhone: string = customer.phone;
    if (linkedTravelAgentId) {
      // Use agency name + TA-CO prefix (only COMPANY reaches this path)
      const agentRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT agencyName, phone FROM travel_agents WHERE id = ? LIMIT 1`,
        linkedTravelAgentId,
      );
      if (agentRows[0]?.agencyName) companyName = agentRows[0].agencyName;
      const agentPhone: string | null = agentRows[0]?.phone || null;
      if (
        agentPhone &&
        (typeof resolvedCustomerPhone !== 'string' || resolvedCustomerPhone.startsWith('ta-'))
      ) {
        resolvedCustomerPhone = agentPhone;
      }
      bookingNumber = `TA-CO-${new Date()
        .getFullYear()}-${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0')}`;
    }

    const booking = await prisma.b2b_bookings.create({
      data: {
        id: bookingId,
        bookingNumber,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: resolvedCustomerPhone,
        companyName,
        serviceType,
        vehiclesRequired: parseInt(vehiclesRequired),
        passengerCount: passengerCount ? parseInt(passengerCount) : null,
        vehicleCategory: vehicleCategory || null,
        pickupLocation,
        dropLocation: dropLocation || null,
        tripType,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        returnDate: returnDate ? new Date(returnDate) : null,
        returnTime: returnTime || null,
        specialNotes: specialNotes || null,
        status: 'OPEN_FOR_QUOTES',
      },
    });

    // Tag with TA fields (columns not in generated Prisma client yet)
    if (linkedTravelAgentId) {
      await (prisma as any).$executeRawUnsafe(
        `UPDATE b2b_bookings SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
        linkedTravelAgentId,
        taBookingMode,
        booking.id,
      );
    }

    // Send notifications to vendors in pickup location (async, non-blocking)
    onB2BBookingCreated({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceType: booking.serviceType,
      pickupLocation,
      companyName: customer.companyName || customer.name,
      vehiclesRequired: booking.vehiclesRequired,
    }).catch(e => console.error('B2B notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: 'B2B booking created successfully. Vendors will be notified.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        serviceType: booking.serviceType,
        vehiclesRequired: booking.vehiclesRequired,
        scheduledDate: booking.scheduledDate,
      },
    });
  } catch (error: any) {
    console.error('B2B Bookings POST error:', error);
    return NextResponse.json({ error: 'Failed to create B2B booking' }, { status: 500 });
  }
}
