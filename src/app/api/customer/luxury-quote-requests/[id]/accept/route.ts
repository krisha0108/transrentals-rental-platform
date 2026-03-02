import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const prefix = 'LB';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * POST - Accept a luxury quote and create booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { success: false, message: 'Quote ID is required' },
        { status: 400 }
      );
    }

    logger.info('Accepting luxury quote', {
      requestId: resolvedParams.id,
      quoteId,
    });

    // Get quote with quote request and vendor details
    const quote = await prisma.luxury_quotes.findUnique({
      where: { id: quoteId },
      include: {
        luxury_quote_requests: true,
        vendors: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, message: 'Quote not found' },
        { status: 404 }
      );
    }

    // Verify quote belongs to this request
    if (quote.requestId !== resolvedParams.id) {
      return NextResponse.json(
        { success: false, message: 'Quote does not belong to this request' },
        { status: 400 }
      );
    }

    // Check if quote is still valid
    if (quote.status === 'EXPIRED' || quote.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, message: 'This quote is no longer valid' },
        { status: 400 }
      );
    }

    if (quote.validTill && new Date(quote.validTill) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'This quote has expired' },
        { status: 400 }
      );
    }

    const quoteRequest = quote.luxury_quote_requests;

    // Idempotency: check if a booking already exists for this quote (handles retries)
    const existingBookingByQuote = await prisma.luxury_bookings.findUnique({
      where: { acceptedQuoteId: quoteId },
    });
    if (existingBookingByQuote) {
      // Booking already created from a previous attempt — return it as success
      // Also ensure the quote request and quote statuses are updated (in case they weren't)
      await prisma.luxury_quote_requests.update({
        where: { id: resolvedParams.id },
        data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
      }).catch(() => {});
      await prisma.luxury_quotes.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Quote accepted successfully',
        booking: {
          id: existingBookingByQuote.id,
          bookingNumber: existingBookingByQuote.bookingNumber,
          grandTotal: existingBookingByQuote.grandTotal,
          advanceAmount: existingBookingByQuote.advanceAmount,
        },
      });
    }

    // Also check by quoteRequestId (another unique field)
    const existingBookingByRequest = await prisma.luxury_bookings.findUnique({
      where: { quoteRequestId: resolvedParams.id },
    });
    if (existingBookingByRequest) {
      return NextResponse.json({
        success: true,
        message: 'Quote accepted successfully',
        booking: {
          id: existingBookingByRequest.id,
          bookingNumber: existingBookingByRequest.bookingNumber,
          grandTotal: existingBookingByRequest.grandTotal,
          advanceAmount: existingBookingByRequest.advanceAmount,
        },
      });
    }

    // Check if request is already accepted (but no booking found — shouldn't happen, but handle it)
    if (quoteRequest.status === 'QUOTE_ACCEPTED') {
      return NextResponse.json(
        { success: false, message: 'A quote has already been accepted for this request' },
        { status: 400 }
      );
    }

    const bookingNumber = generateBookingNumber();
    const pickupOtp = generateOTP();
    const dropOtp = generateOTP();

    // Use transaction for atomicity — all-or-nothing
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking from quote
      const newBooking = await tx.luxury_bookings.create({
        data: {
          bookingNumber,
          customerName: quoteRequest.customerName,
          customerEmail: quoteRequest.customerEmail,
          customerPhone: quoteRequest.customerPhone,
          ...(quoteRequest.customerId ? { customers: { connect: { id: quoteRequest.customerId } } } : {}),
          ...(quoteRequest.locationId ? { locations: { connect: { id: quoteRequest.locationId } } } : {}),
          locationName: quoteRequest.pickupCity,

          // Trip Details
          tripType: quoteRequest.tripType,
          eventType: null,
          occasion: quoteRequest.occasion,

          // Vehicle Details from quote
          carCategory: quote.vehicleCategory,
          carCategoryName: quoteRequest.vehicleCategoryName || quote.vehicleCategory,
          vehicleNumber: quote.vehicleNumber,
          vehicleModel: quote.vehicleModel,
          vehicleBrand: quote.vehicleName?.split(' ')[0] || null,
          vehicleColor: null,
          vehicleImages: typeof quote.vehicleImages === 'string'
            ? quote.vehicleImages
            : JSON.stringify(quote.vehicleImages),

          // Route
          pickupCity: quoteRequest.pickupCity,
          pickupAddress: quoteRequest.pickupAddress,
          dropCity: quoteRequest.dropCity,
          dropAddress: quoteRequest.dropAddress,

          // Schedule
          pickupDate: quoteRequest.pickupDate,
          pickupTime: quoteRequest.pickupTime,
          returnDate: quoteRequest.returnDate,
          returnTime: quoteRequest.returnTime,
          totalDays: quoteRequest.tripDays,
          totalHours: quoteRequest.tripHours,

          // Requirements
          needDecoration: quoteRequest.needDecoration,
          decorationType: quoteRequest.decorationType,
          needChauffeur: quoteRequest.needChauffeur,

          // Driver Details from quote
          driverName: quote.driverName,
          driverPhone: quote.driverPhone,

          // Pricing from quote
          baseFare: quote.baseAmount,
          decorationCharges: quote.decorationCharges || 0,
          chauffeurCharges: quote.chauffeurCharges || 0,
          gstAmount: quote.gstAmount || 0,
          grandTotal: quote.totalAmount,
          advanceAmount: quote.advanceAmount || 0,
          advancePercent: quote.advancePercent || 0,

          // Status
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',

          // Vendor Assignment
          vendors_luxury_bookings_acceptedVendorIdTovendors: { connect: { id: quote.vendorId } },
          acceptedAt: new Date(),

          // Link to source quote request and accepted quote
          luxury_quote_requests: { connect: { id: resolvedParams.id } },
          luxury_quotes: { connect: { id: quoteId } },

          // OTPs
          tripStartOtp: pickupOtp,
          tripEndOtp: dropOtp,

          // Notes
          customerNotes: quoteRequest.requirements,
        },
      });

      // Update quote request status
      await tx.luxury_quote_requests.update({
        where: { id: resolvedParams.id },
        data: {
          status: 'QUOTE_ACCEPTED',
          acceptedQuoteId: quoteId,
        },
      });

      // Update accepted quote status
      await tx.luxury_quotes.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      });

      // Reject other quotes for this request
      await tx.luxury_quotes.updateMany({
        where: {
          requestId: resolvedParams.id,
          id: { not: quoteId },
          status: { in: ['SENT', 'VIEWED'] },
        },
        data: { status: 'REJECTED' },
      });

      return newBooking;
    });

    logger.info('Luxury quote accepted and booking created', {
      requestId: resolvedParams.id,
      quoteId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    });

    // Non-blocking: notify the vendor whose luxury quote was accepted
    sendVendorDirectNotification({
      vendorId: quote.vendorId,
      title: '🎉 Quote Accepted!',
      body: `Your luxury car quote has been accepted. Booking #${booking.bookingNumber} created. Payment pending from customer.`,
      type: 'quote_accepted',
      serviceType: 'luxury',
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    }).catch((err: any) => console.error('[LuxuryAccept] Vendor notification failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to accept luxury quote', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to accept quote',
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
