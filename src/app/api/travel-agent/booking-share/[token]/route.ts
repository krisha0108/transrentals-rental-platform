import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';

export const dynamic = 'force-dynamic';

// PUBLIC — fetch a booking by share token (read-only view for the customer)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const booking = await prisma.travel_agent_bookings.findUnique({
      where: { shareToken: token },
      include: {
        travel_agents: {
          select: { agencyName: true, logo: true, status: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking link is invalid' }, { status: 404 });
    }

    // Expired link
    if (booking.shareExpiresAt && new Date(booking.shareExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This booking link has expired. Please contact your travel agent.' },
        { status: 410 },
      );
    }

    // Block public access if agent is no longer in good standing
    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(booking.travel_agents.status)) {
      return NextResponse.json(
        { error: 'This booking link is no longer available.' },
        { status: 403 },
      );
    }

    // Strip private data — only what the customer needs to see
    return NextResponse.json({
      bookingNumber: booking.bookingNumber,
      bookingType: booking.bookingType,
      referenceTitle: booking.referenceTitle,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: booking.travelDate,
      returnDate: booking.returnDate,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      passengers: booking.passengers,
      rooms: booking.rooms,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      customerFilledAt: booking.customerFilledAt,
      agency: {
        name: booking.travel_agents.agencyName,
        logo: booking.travel_agents.logo,
        phone: booking.travel_agents.phone,
      },
    });
  } catch (error: any) {
    logger.error('Public booking-share GET error', error);
    return NextResponse.json(
      { error: 'Failed to load booking', details: error?.message },
      { status: 500 },
    );
  }
}

// PUBLIC — customer submits/updates their details on the booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.contact,
    'booking-share-fill',
  );
  if (limited) {
    logger.logSecurityEvent('Booking share rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  try {
    const { token } = await params;
    const booking = await prisma.travel_agent_bookings.findUnique({
      where: { shareToken: token },
      include: { travel_agents: { select: { status: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking link is invalid' }, { status: 404 });
    }
    if (booking.shareExpiresAt && new Date(booking.shareExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'This booking link has expired.' }, { status: 410 });
    }
    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(booking.travel_agents.status)) {
      return NextResponse.json(
        { error: 'This booking link is no longer available.' },
        { status: 403 },
      );
    }

    // Once confirmed/in-progress/etc., the customer can't keep editing
    if (['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return NextResponse.json(
        {
          error:
            'This booking is no longer accepting customer edits. Please contact your travel agent for changes.',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropLocation,
      travelDate,
      returnDate,
      checkInDate,
      checkOutDate,
      passengers,
      rooms,
      notes,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const phoneClean = String(customerPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const updated = await prisma.travel_agent_bookings.update({
      where: { id: booking.id },
      data: {
        customerName: String(customerName).trim(),
        customerPhone: phoneClean,
        customerEmail: customerEmail || null,
        pickupLocation: pickupLocation ?? booking.pickupLocation,
        dropLocation: dropLocation ?? booking.dropLocation,
        travelDate: travelDate ? new Date(travelDate) : booking.travelDate,
        returnDate: returnDate ? new Date(returnDate) : booking.returnDate,
        checkInDate: checkInDate ? new Date(checkInDate) : booking.checkInDate,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : booking.checkOutDate,
        passengers: passengers ? Number(passengers) : booking.passengers,
        rooms: rooms ? Number(rooms) : booking.rooms,
        notes: notes ? String(notes).trim() : booking.notes,
        customerFilledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thanks! Your details have been saved. The agent will reach out shortly.',
      bookingNumber: updated.bookingNumber,
    });
  } catch (error: any) {
    logger.error('Public booking-share POST error', error);
    return NextResponse.json(
      { error: 'Failed to save details', details: error?.message },
      { status: 500 },
    );
  }
}
