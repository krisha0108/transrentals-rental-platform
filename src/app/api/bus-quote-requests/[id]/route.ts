// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate booking number
function generateBookingNumber(): string {
  const prefix = 'BB'; // Bus Booking
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// Helper to generate OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET - Get Bus Quote Request details with all quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    logger.info('Fetching bus quote request', { id });

    // Try by ID first, then by request number
    let quoteRequest;
    try {
      quoteRequest = await prisma.bus_quote_requests.findUnique({
        where: { id },
        include: {
          bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
            where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] } },
            include: {
              vendors: {
                select: {
                  id: true,
                  businessName: true,
                  rating: true,
                  totalRatings: true,
                  phone: true,
                },
              },
            },
            orderBy: { totalAmount: 'asc' },
          },
          locations: {
            select: { name: true, slug: true },
          },
        },
      });
    } catch (findError: any) {
      logger.error('Error finding quote request by ID', { id, error: findError?.message });
      // Try by request number as fallback
    }

    if (!quoteRequest) {
      try {
        quoteRequest = await prisma.bus_quote_requests.findUnique({
          where: { requestNumber: id },
          include: {
            bus_quotes: {
              where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] } },
              include: {
                vendors: {
                  select: {
                    id: true,
                    businessName: true,
                    rating: true,
                    totalRatings: true,
                    phone: true,
                  },
                },
                vendor_fleets: {
                  select: {
                    id: true,
                    images: true,
                  },
                },
              },
              orderBy: { totalAmount: 'asc' },
            },
            locations: {
              select: { name: true, slug: true },
            },
          },
        });
      } catch (findError: any) {
        logger.error('Error finding quote request by requestNumber', { id, error: findError?.message });
      }
    }

    if (!quoteRequest) {
      logger.warn('Quote request not found', { id });
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    logger.info('Quote request found', {
      id: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      quotesCount: quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests?.length || 0
    });

    // Mark quotes as viewed - simplified without increment
    if (quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests && quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests.length > 0) {
      try {
        await prisma.bus_quotes.updateMany({
          where: {
            requestId: quoteRequest.id,
            status: 'SENT',
          },
          data: {
            status: 'VIEWED',
            viewedAt: new Date(),
          },
        });
        logger.info('Marked quotes as viewed', { requestId: quoteRequest.id });
      } catch (viewError: any) {
        logger.error('Error updating quote views', {
          requestId: quoteRequest.id,
          error: viewError?.message
        });
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({
      success: true,
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        tripType: quoteRequest.tripType,
        vehicleCategory: quoteRequest.vehicleCategory,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        passengers: quoteRequest.passengers,
        pickupCity: quoteRequest.pickupCity,
        pickupAddress: quoteRequest.pickupAddress,
        dropCity: quoteRequest.dropCity,
        dropAddress: quoteRequest.dropAddress,
        routeDetails: quoteRequest.routeDetails,
        stops: quoteRequest.stops,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        returnDate: quoteRequest.returnDate,
        returnTime: quoteRequest.returnTime,
        tripDays: quoteRequest.tripDays,
        requirements: quoteRequest.requirements,
        needAC: quoteRequest.needAC,
        needLuxury: quoteRequest.needLuxury,
        needSleeper: quoteRequest.needSleeper,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        expiresAt: quoteRequest.expiresAt,
        location: quoteRequest.locations?.name,
        createdAt: quoteRequest.createdAt,
        quotes: quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests.map((q) => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          vehicleName: q.vehicleName,
          vehicleCategory: q.vehicleCategory,
          seats: q.seats,
          vehicleFeatures: q.vehicleFeatures,
          vehicleImages: q.vehicleImages,
          baseAmount: q.baseAmount,
          driverAllowance: q.driverAllowance,
          nightHaltCharges: q.nightHaltCharges,
          tollEstimate: q.tollEstimate,
          permitCharges: q.permitCharges,
          gstAmount: q.gstAmount,
          totalAmount: q.totalAmount,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          validTill: q.validTill,
          status: q.status,
          vendors: {
            id: q.vendors.id,
            name: q.vendors.businessName,
            rating: q.vendors.rating,
            reviews: q.vendors.totalRatings,
          },
        })),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch bus quote request', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Accept a quote (creates BusBooking) or cancel request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, quoteId } = body;

    const quoteRequest = await prisma.bus_quote_requests.findUnique({
      where: { id },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept_quote': {
        if (!quoteId) {
          return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        }

        if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
          return NextResponse.json(
            { error: 'This request cannot accept quotes anymore' },
            { status: 400 }
          );
        }

        // Get the quote
        const quote = await prisma.bus_quotes.findUnique({
          where: { id: quoteId },
          include: {
            vendors: { select: { id: true, businessName: true } },
          },
        });

        if (!quote || quote.requestId !== quoteRequest.id) {
          return NextResponse.json({ error: 'Quote not found for this request' }, { status: 404 });
        }

        if (quote.status !== 'SENT' && quote.status !== 'VIEWED') {
          return NextResponse.json({ error: 'This quote cannot be accepted' }, { status: 400 });
        }

        // Check quote validity
        if (new Date() > new Date(quote.validTill)) {
          return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        }

        // Generate booking number
        const bookingNumber = generateBookingNumber();

        // Calculate advance amount (typically 20-30% of total)
        const advanceAmount = (quote.advanceAmount != null && quote.advanceAmount > 0)
          ? quote.advanceAmount
          : Math.round(quote.totalAmount * 0.25);
        const balanceAmount = quote.totalAmount - advanceAmount;

        // Create the booking in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Update quote status
          await tx.bus_quotes.update({
            where: { id: quoteId },
            data: { status: 'ACCEPTED' },
          });

          // Reject other quotes
          await tx.bus_quotes.updateMany({
            where: {
              requestId: quoteRequest.id,
              id: { not: quoteId },
              status: { in: ['SENT', 'VIEWED', 'DRAFT'] },
            },
            data: { status: 'REJECTED' },
          });

          // Update quote request
          await tx.bus_quote_requests.update({
            where: { id: quoteRequest.id },
            data: {
              status: 'QUOTE_ACCEPTED',
              acceptedQuoteId: quoteId,
            },
          });

          // Create the booking
          const booking = await tx.bus_bookings.create({
            data: {
              bookingNumber,
              quoteRequestId: quoteRequest.id,
              acceptedQuoteId: quoteId,
              vendorId: quote.vendorId,
              customerId: quoteRequest.customerId,
              customerName: quoteRequest.customerName,
              customerEmail: quoteRequest.customerEmail,
              customerPhone: quoteRequest.customerPhone,
              tripType: quoteRequest.tripType,
              vehicleCategory: quote.vehicleCategory || quoteRequest.vehicleCategory,
              vehicleName: quote.vehicleName,
              passengers: quoteRequest.passengers,
              pickupCity: quoteRequest.pickupCity,
              pickupAddress: quoteRequest.pickupAddress,
              dropCity: quoteRequest.dropCity,
              dropAddress: quoteRequest.dropAddress,
              routeDetails: quoteRequest.routeDetails,
              pickupDate: quoteRequest.pickupDate,
              pickupTime: quoteRequest.pickupTime,
              returnDate: quoteRequest.returnDate,
              returnTime: quoteRequest.returnTime,
              tripDays: quoteRequest.tripDays,
              vehicleNumber: quote.vehicleNumber,
              vehicleModel: quote.vehicleModel,
              driverName: quote.driverName,
              driverPhone: quote.driverPhone,
              baseAmount: quote.baseAmount,
              additionalCharges: quote.driverAllowance + quote.nightHaltCharges + quote.tollEstimate + quote.permitCharges,
              gstAmount: quote.gstAmount,
              totalAmount: quote.totalAmount,
              advanceAmount,
              balanceAmount,
              status: 'PENDING_PAYMENT',
              customerNotes: quoteRequest.requirements,
              tripStartOtp: generateOTP(),
              tripEndOtp: generateOTP(),
            },
          });

          return booking;
        });

        return NextResponse.json({
          success: true,
          message: 'Quote accepted! Please pay the advance to confirm your booking.',
          booking: {
            id: result.id,
            bookingNumber: result.bookingNumber,
            status: result.status,
            totalAmount: result.totalAmount,
            advanceAmount: result.advanceAmount,
            balanceAmount: result.balanceAmount,
          },
        });
      }

      case 'cancel': {
        if (quoteRequest.status === 'BOOKING_CONFIRMED') {
          return NextResponse.json(
            { error: 'Cannot cancel a confirmed booking. Please cancel the booking instead.' },
            { status: 400 }
          );
        }

        // Update request and reject all quotes
        await prisma.$transaction([
          prisma.bus_quote_requests.update({
            where: { id },
            data: { status: 'CANCELLED' },
          }),
          prisma.bus_quotes.updateMany({
            where: {
              requestId: id,
              status: { in: ['SENT', 'VIEWED', 'DRAFT'] },
            },
            data: { status: 'REJECTED' },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: 'Quote request cancelled',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update bus quote request', error);
    return NextResponse.json(
      { error: 'Failed to update request', details: error?.message },
      { status: 500 }
    );
  }
}
