import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_BOOKING_TYPES = ['TOUR', 'PROPERTY', 'TRANSPORT', 'CUSTOM'];

function generateBookingNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TA-${datePart}-${rand}`;
}

// POST: convert a lead into a booking
//   body: {
//     bookingType?: 'TOUR'|'PROPERTY'|'TRANSPORT'|'CUSTOM' (default: derive from lead.tripType),
//     totalAmount?: number,
//     paidAmount?: number,
//     referenceId?: string, referenceTitle?: string,
//     extraNotes?: string,
//   }
// Side effects:
//   - creates booking with lead's customer + trip details
//   - sets lead.status = BOOKED, lead.convertedBookingId
//   - appends a note to the lead's timeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.travel_agent_leads.findUnique({ where: { id } });
    if (!lead || lead.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.convertedBookingId) {
      return NextResponse.json(
        { error: 'Lead has already been converted to a booking' },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      bookingType: requestedType,
      totalAmount,
      paidAmount,
      referenceId,
      referenceTitle,
      extraNotes,
    } = body;

    // Default booking type — TOUR_PACKAGE/ACCOMMODATION map cleanly; otherwise CUSTOM
    let bookingType: string;
    if (requestedType && VALID_BOOKING_TYPES.includes(requestedType)) {
      bookingType = requestedType;
    } else if (lead.tripType === 'ACCOMMODATION') {
      bookingType = 'PROPERTY';
    } else if (lead.tripType === 'TOUR_PACKAGE') {
      bookingType = 'TOUR';
    } else if (lead.tripType === 'ONE_WAY' || lead.tripType === 'ROUND_TRIP') {
      bookingType = 'TRANSPORT';
    } else {
      bookingType = 'CUSTOM';
    }

    let bookingNumber = generateBookingNumber();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.travel_agent_bookings.findUnique({
        where: { bookingNumber },
        select: { id: true },
      });
      if (!exists) break;
      bookingNumber = generateBookingNumber();
    }

    const finalTotal = totalAmount ? Number(totalAmount) : (lead.quotedAmount ?? lead.estimatedValue ?? 0);
    const finalPaid = paidAmount ? Number(paidAmount) : 0;

    // Derive check-in/-out for property bookings from travelDate / returnDate
    const isProperty = bookingType === 'PROPERTY';

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.travel_agent_bookings.create({
        data: {
          travelAgentId: auth.travelAgentId!,
          bookingNumber,
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          customerEmail: lead.customerEmail,
          bookingType,
          referenceId: referenceId || null,
          referenceTitle: referenceTitle || null,
          pickupLocation: lead.pickupLocation,
          dropLocation: lead.dropLocation,
          travelDate: !isProperty ? lead.travelDate : null,
          returnDate: !isProperty ? lead.returnDate : null,
          checkInDate: isProperty ? lead.travelDate : null,
          checkOutDate: isProperty ? lead.returnDate : null,
          passengers: lead.passengers ?? 1,
          rooms: 1,
          totalAmount: finalTotal,
          paidAmount: finalPaid,
          paymentStatus: finalPaid > 0 ? (finalPaid >= finalTotal ? 'PAID' : 'PARTIAL') : 'PENDING',
          notes: extraNotes || lead.requirement || null,
          status: 'CONFIRMED',
        },
      });

      await tx.travel_agent_leads.update({
        where: { id: lead.id },
        data: {
          status: 'BOOKED',
          convertedBookingId: booking.id,
        },
      });

      await tx.travel_agent_lead_notes.create({
        data: {
          leadId: lead.id,
          note: `Converted to booking ${booking.bookingNumber}${
            finalTotal ? ` (₹${finalTotal.toLocaleString('en-IN')})` : ''
          }`,
        },
      });

      return booking;
    });

    return NextResponse.json({ booking: result }, { status: 201 });
  } catch (error: any) {
    logger.error('Convert lead to booking error', error);
    return NextResponse.json(
      { error: 'Failed to convert lead', details: error?.message },
      { status: 500 },
    );
  }
}
