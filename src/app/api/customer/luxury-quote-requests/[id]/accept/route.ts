import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

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
        request: true,
        vendor: true,
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

    // Check if request is already accepted
    if (quote.request.status === 'QUOTE_ACCEPTED') {
      return NextResponse.json(
        { success: false, message: 'A quote has already been accepted for this request' },
        { status: 400 }
      );
    }

    const bookingNumber = generateBookingNumber();
    const pickupOtp = generateOTP();
    const dropOtp = generateOTP();

    // Create booking from quote
    const booking = await prisma.luxury_bookings.create({
      data: {
        bookingNumber,
        customerName: quote.request.customerName,
        customerEmail: quote.request.customerEmail,
        customerPhone: quote.request.customerPhone,
        ...(quote.request.customerId ? { customer: { connect: { id: quote.request.customerId } } } : {}),
        ...(quote.request.locationId ? { location: { connect: { id: quote.request.locationId } } } : {}),
        locationName: quote.request.pickupCity,

        // Trip Details
        tripType: quote.request.tripType,
        eventType: null,
        occasion: quote.request.occasion,

        // Vehicle Details from quote
        carCategory: quote.vehicle_category,
        carCategoryName: quote.request.vehicleCategoryName || quote.vehicle_category,
        vehicleNumber: quote.vehicleNumber,
        vehicle_models: quote.vehicle_models,
        vehicleBrand: quote.vehicleName?.split(' ')[0] || null,
        vehicleColor: null,
        vehicleImages: typeof quote.vehicleImages === 'string'
          ? quote.vehicleImages
          : JSON.stringify(quote.vehicleImages),

        // Route
        pickupCity: quote.request.pickupCity,
        pickupAddress: quote.request.pickupAddress,
        dropCity: quote.request.dropCity,
        dropAddress: quote.request.dropAddress,

        // Schedule
        pickupDate: quote.request.pickupDate,
        pickupTime: quote.request.pickupTime,
        returnDate: quote.request.returnDate,
        returnTime: quote.request.returnTime,
        totalDays: quote.request.tripDays,
        totalHours: quote.request.tripHours,

        // Requirements
        needDecoration: quote.request.needDecoration,
        decorationType: quote.request.decorationType,
        needChauffeur: quote.request.needChauffeur,

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
        acceptedVendor: { connect: { id: quote.vendorId } },
        acceptedAt: new Date(),

        // OTPs
        tripStartOtp: pickupOtp,
        tripEndOtp: dropOtp,

        // Notes
        customerNotes: quote.request.requirements,
      },
    });

    // Update quote request status
    await prisma.luxury_quote_requests.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'QUOTE_ACCEPTED',
        acceptedQuoteId: quoteId,
      },
    });

    // Update accepted quote status
    await prisma.luxury_quotes.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Reject other quotes for this request
    await prisma.luxury_quotes.updateMany({
      where: {
        requestId: resolvedParams.id,
        id: { not: quoteId },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: { status: 'REJECTED' },
    });

    logger.info('Luxury quote accepted and booking created', {
      requestId: resolvedParams.id,
      quoteId,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    });

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
    logger.error('Failed to accept luxury quote', error);
    return NextResponse.json(
      { success: false, message: 'Failed to accept quote', details: error?.message },
      { status: 500 }
    );
  }
}
