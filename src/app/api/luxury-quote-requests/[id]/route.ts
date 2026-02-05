// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const prefix = 'LB'; // Luxury Booking
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET - Get Luxury Quote Request details with all quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by requestNumber
    let quoteRequest = await prisma.luxury_quote_requests.findUnique({
      where: { id },
      include: {
        luxury_quotes: {
          where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED'] } },
          include: {
            vendors: { select: { id: true, businessName: true, rating: true, phone: true } },
            vendor_fleets: {
              select: {
                id: true,
                images: true,
              },
            },
          },
          orderBy: { totalAmount: 'asc' },
        },
        locations: { select: { name: true, slug: true } },
      },
    });

    if (!quoteRequest) {
      quoteRequest = await prisma.luxury_quote_requests.findUnique({
        where: { requestNumber: id },
        include: {
          luxury_quotes: {
            where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED'] } },
            include: {
              vendors: { select: { id: true, businessName: true, rating: true, phone: true } },
              vendor_fleets: {
                select: {
                  id: true,
                  images: true,
                },
              },
            },
            orderBy: { totalAmount: 'asc' },
          },
          locations: { select: { name: true, slug: true } },
        },
      });
    }

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Mark SENT quotes as VIEWED
    await prisma.luxury_quotes.updateMany({
      where: { requestId: quoteRequest.id, status: 'SENT' },
      data: { status: 'VIEWED', viewedAt: new Date() },
    });

    // Transform quotes to handle vehicle images
    const transformedQuoteRequest = {
      ...quoteRequest,
      luxury_quotes: quoteRequest.luxury_quotes.map((q) => {
        // Get vehicle images from fleet if available
        let vehicleImages = q.vehicleImages;
        if (q.vendor_fleets?.images) {
          let fleetImages = typeof q.vendor_fleets.images === 'string'
            ? (q.vendor_fleets.images === 'null' ? null : JSON.parse(q.vendor_fleets.images))
            : q.vendor_fleets.images;

          // Convert object to array
          if (fleetImages && typeof fleetImages === 'object' && !Array.isArray(fleetImages)) {
            vehicleImages = Object.values(fleetImages).filter(img => img);
          } else if (Array.isArray(fleetImages)) {
            vehicleImages = fleetImages;
          } else {
            vehicleImages = fleetImages;
          }
        }

        return {
          ...q,
          vehicleImages: vehicleImages ? JSON.stringify(vehicleImages) : null,
        };
      }),
    };

    return NextResponse.json({ success: true, quoteRequest: transformedQuoteRequest });
  } catch (error: any) {
    logger.error('Failed to fetch luxury quote request', error);
    return NextResponse.json({ error: 'Failed to fetch request', details: error?.message }, { status: 500 });
  }
}

// PATCH - Accept a quote (creates LuxuryBooking) or cancel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, quoteId } = body;

    const quoteRequest = await prisma.luxury_quote_requests.findUnique({ where: { id } });
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept_quote': {
        if (!quoteId) return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
          return NextResponse.json({ error: 'This request cannot accept quotes anymore' }, { status: 400 });
        }

        const quote = await prisma.luxury_quotes.findUnique({
          where: { id: quoteId },
          include: { vendors: { select: { id: true, businessName: true } } },
        });

        if (!quote || quote.requestId !== quoteRequest.id) {
          return NextResponse.json({ error: 'Quote not found for this request' }, { status: 404 });
        }
        if (quote.status !== 'SENT' && quote.status !== 'VIEWED') {
          return NextResponse.json({ error: 'This quote cannot be accepted' }, { status: 400 });
        }
        if (new Date() > new Date(quote.validTill)) {
          return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        }

        const bookingNumber = generateBookingNumber();
        const advanceAmount = quote.advanceAmount || Math.round(quote.totalAmount * (quote.advancePercent / 100));
        const balanceAmount = quote.totalAmount - advanceAmount;

        // Find location for the booking
        const location = await prisma.locations.findFirst({
          where: {
            OR: [
              { name: { contains: quoteRequest.pickupCity } },
              { slug: quoteRequest.pickupCity.toLowerCase().replace(/\s+/g, '-') },
            ],
            isActive: true,
          },
        });

        const result = await prisma.$transaction(async (tx) => {
          // Update quote status
          await tx.luxury_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });

          // Reject other quotes
          await tx.luxury_quotes.updateMany({
            where: { requestId: quoteRequest.id, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } },
            data: { status: 'REJECTED' },
          });

          // Update quote request status
          await tx.luxury_quote_requests.update({
            where: { id: quoteRequest.id },
            data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
          });

          // Create LuxuryBooking
          return tx.luxury_bookings.create({
            data: {
              bookingNumber,
              quoteRequestId: quoteRequest.id,
              acceptedQuoteId: quoteId,
              customerId: quoteRequest.customerId,
              customerName: quoteRequest.customerName,
              customerEmail: quoteRequest.customerEmail,
              customerPhone: quoteRequest.customerPhone,
              locationId: location?.id || quoteRequest.locationId || null,
              locationName: location?.name || quoteRequest.pickupCity,
              tripType: quoteRequest.tripType,
              occasion: quoteRequest.occasion,
              carCategory: quoteRequest.vehicleCategory,
              carCategoryName: quoteRequest.vehicleCategoryName,
              preferredModels: quoteRequest.specificModel ? JSON.stringify([quoteRequest.specificModel]) : null,
              pickupCity: quoteRequest.pickupCity,
              pickupAddress: quoteRequest.pickupAddress,
              dropCity: quoteRequest.dropCity,
              dropAddress: quoteRequest.dropAddress,
              pickupDate: quoteRequest.pickupDate,
              pickupTime: quoteRequest.pickupTime,
              returnDate: quoteRequest.returnDate,
              returnTime: quoteRequest.returnTime,
              totalHours: quoteRequest.tripHours,
              totalDays: quoteRequest.tripDays,
              needDecoration: quoteRequest.needDecoration,
              decorationType: quoteRequest.decorationType,
              needChauffeur: quoteRequest.needChauffeur,
              customerNotes: quoteRequest.requirements,
              // Pricing from quote
              baseFare: quote.baseAmount,
              decorationCharges: quote.decorationCharges,
              chauffeurCharges: quote.chauffeurCharges,
              extraHourRate: quote.extraHourRate,
              gstAmount: quote.gstAmount,
              grandTotal: quote.totalAmount,
              // Advance Payment
              advanceAmount,
              advancePercent: quote.advancePercent || 30,
              // Vendor
              acceptedVendorId: quote.vendorId,
              // Status
              status: 'PENDING_PAYMENT',
              paymentStatus: 'PENDING',
              // OTP for trip start
              tripStartOtp: generateOTP(),
            },
          });
        });

        return NextResponse.json({
          success: true,
          message: 'Quote accepted! Please pay the advance to confirm your booking.',
          booking: {
            id: result.id,
            bookingNumber: result.bookingNumber,
            status: result.status,
            totalAmount: result.grandTotal,
            advanceAmount,
            balanceAmount,
          },
        });
      }

      case 'cancel': {
        await prisma.$transaction([
          prisma.luxury_quote_requests.update({ where: { id }, data: { status: 'CANCELLED' } }),
          prisma.luxury_quotes.updateMany({
            where: { requestId: id, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } },
            data: { status: 'REJECTED' },
          }),
        ]);
        return NextResponse.json({ success: true, message: 'Quote request cancelled' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update luxury quote request', error);
    return NextResponse.json({ error: 'Failed to update request', details: error?.message }, { status: 500 });
  }
}
