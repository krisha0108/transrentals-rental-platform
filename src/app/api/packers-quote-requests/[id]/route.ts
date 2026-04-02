// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const prefix = 'PB';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET - Get Packers Quote Request details with all quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let quoteRequest = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        packers_quotes: {
          where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] } },
          include: {
            vendors: { select: { id: true, businessName: true, rating: true, phone: true } },
          },
          orderBy: { totalAmount: 'asc' },
        },
        locations: { select: { name: true, slug: true } },
      },
    });

    if (!quoteRequest) {
      quoteRequest = await prisma.packers_quote_requests.findUnique({
        where: { requestNumber: id },
        include: {
          packers_quotes: {
            where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] } },
            include: {
              vendors: { select: { id: true, businessName: true, rating: true, phone: true } },
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

    await prisma.packers_quotes.updateMany({
      where: { requestId: quoteRequest.id, status: 'SENT' },
      data: { status: 'VIEWED', viewedAt: new Date() },
    });

    // Map packers_quotes to quotes for React Native compatibility
    const formattedQuoteRequest = {
      ...quoteRequest,
      quotes: quoteRequest.packers_quotes || [],
    };

    return NextResponse.json({ success: true, quoteRequest: formattedQuoteRequest });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote request', error);
    return NextResponse.json({ error: 'Failed to fetch request', details: error?.message }, { status: 500 });
  }
}

// PATCH - Accept a quote (creates PackersBooking) or cancel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, quoteId } = body;

    const quoteRequest = await prisma.packers_quote_requests.findUnique({ where: { id } });
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept_quote': {
        if (!quoteId) return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
          return NextResponse.json({ error: 'This request cannot accept quotes anymore' }, { status: 400 });
        }

        const quote = await prisma.packers_quotes.findUnique({
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
        const advanceAmount = (quote.advanceAmount != null && quote.advanceAmount > 0)
          ? quote.advanceAmount
          : Math.round(quote.totalAmount * 0.3);
        const balanceAmount = quote.totalAmount - advanceAmount;

        const result = await prisma.$transaction(async (tx) => {
          await tx.packers_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.packers_quotes.updateMany({
            where: { requestId: quoteRequest.id, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } },
            data: { status: 'REJECTED' },
          });
          await tx.packers_quote_requests.update({
            where: { id: quoteRequest.id },
            data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
          });

          return tx.packers_bookings.create({
            data: {
              bookingNumber,
              quoteRequestId: quoteRequest.id,
              acceptedQuoteId: quoteId,
              vendorId: quote.vendorId,
              customerId: quoteRequest.customerId,
              customerName: quoteRequest.customerName,
              customerEmail: quoteRequest.customerEmail,
              customerPhone: quoteRequest.customerPhone,
              serviceType: quoteRequest.serviceType,
              shiftingType: quoteRequest.shiftingType,
              pickupCity: quoteRequest.pickupCity,
              pickupAddress: quoteRequest.pickupAddress,
              pickupFloor: quoteRequest.pickupFloor,
              dropCity: quoteRequest.dropCity,
              dropAddress: quoteRequest.dropAddress,
              dropFloor: quoteRequest.dropFloor,
              scheduledDate: quoteRequest.preferredDate,
              teamSize: quote.teamSize,
              packingCharges: quote.packingCharges,
              loadingCharges: quote.loadingCharges,
              transportCharges: quote.transportCharges,
              unloadingCharges: quote.unloadingCharges,
              unpackingCharges: quote.unpackingCharges,
              storageCharges: quote.storageCharges,
              insuranceCharges: quote.insuranceCharges,
              materialCharges: quote.materialCharges,
              gstAmount: quote.gstAmount,
              totalAmount: quote.totalAmount,
              advanceAmount,
              balanceAmount,
              packingOtp: generateOTP(),
              loadingOtp: generateOTP(),
              deliveryOtp: generateOTP(),
              status: 'PENDING_PAYMENT',
              customerNotes: quoteRequest.requirements,
            },
          });
        });

        return NextResponse.json({
          success: true,
          message: 'Quote accepted! Please pay the advance to confirm your booking.',
          booking: { id: result.id, bookingNumber: result.bookingNumber, status: result.status, totalAmount: result.totalAmount, advanceAmount: result.advanceAmount },
        });
      }

      case 'cancel': {
        await prisma.$transaction([
          prisma.packers_quote_requests.update({ where: { id }, data: { status: 'CANCELLED' } }),
          prisma.packers_quotes.updateMany({ where: { requestId: id, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } }, data: { status: 'REJECTED' } }),
        ]);
        return NextResponse.json({ success: true, message: 'Quote request cancelled' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update packers quote request', error);
    return NextResponse.json({ error: 'Failed to update request', details: error?.message }, { status: 500 });
  }
}
