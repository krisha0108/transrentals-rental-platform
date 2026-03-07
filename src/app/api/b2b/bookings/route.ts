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

    // Verify customer is B2B approved
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
    if (!customer.isB2B || customer.b2bStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'B2B access not approved. Please wait for admin approval.' }, { status: 403 });
    }

    const bookingId = generateId();
    const bookingNumber = generateBookingNumber();

    const booking = await prisma.b2b_bookings.create({
      data: {
        id: bookingId,
        bookingNumber,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        companyName: customer.companyName || customer.name,
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
