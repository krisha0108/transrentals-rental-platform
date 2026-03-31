// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const prefix = 'EB';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET - Get Equipment Quote Request details with all quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let quoteRequest = await prisma.equipment_quote_requests.findUnique({
      where: { id },
      include: {
        equipment_quotes: {
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
      quoteRequest = await prisma.equipment_quote_requests.findUnique({
        where: { requestNumber: id },
        include: {
          equipment_quotes: {
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

    await prisma.equipment_quotes.updateMany({
      where: { requestId: quoteRequest.id, status: 'SENT' },
      data: { status: 'VIEWED', viewedAt: new Date() },
    });

    return NextResponse.json({ success: true, quoteRequest });
  } catch (error: any) {
    logger.error('Failed to fetch equipment quote request', error);
    return NextResponse.json({ error: 'Failed to fetch request', details: error?.message }, { status: 500 });
  }
}

// PATCH - Accept a quote (creates EquipmentBooking) or cancel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, quoteId } = body;

    const quoteRequest = await prisma.equipment_quote_requests.findUnique({ where: { id } });
    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept_quote': {
        if (!quoteId) return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
          return NextResponse.json({ error: 'This request cannot accept quotes anymore' }, { status: 400 });
        }

        const quote = await prisma.equipment_quotes.findUnique({
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
        const advanceAmount = Math.round(quote.totalAmount * 0.3);
        const balanceAmount = quote.totalAmount - advanceAmount;

        const result = await prisma.$transaction(async (tx) => {
          await tx.equipment_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.equipment_quotes.updateMany({
            where: { requestId: quoteRequest.id, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } },
            data: { status: 'REJECTED' },
          });
          await tx.equipment_quote_requests.update({
            where: { id: quoteRequest.id },
            data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId },
          });

          return tx.equipment_bookings.create({
            data: {
              bookingNumber,
              quoteRequestId: quoteRequest.id,
              acceptedQuoteId: quoteId,
              vendorId: quote.vendorId,
              customerId: quoteRequest.customerId,
              customerName: quoteRequest.customerName,
              customerEmail: quoteRequest.customerEmail,
              customerPhone: quoteRequest.customerPhone,
              companyName: quoteRequest.companyName,
              equipmentCategory: quoteRequest.equipmentCategory,
              equipmentType: quoteRequest.equipmentType,
              equipmentName: quoteRequest.equipmentName || quote.equipmentModel || quoteRequest.equipmentType,
              equipmentModel: quote.equipmentModel,
              quantity: quoteRequest.quantity,
              deliveryCity: quoteRequest.deliveryCity,
              deliveryAddress: quoteRequest.deliveryAddress,
              startDate: quoteRequest.startDate,
              endDate: quoteRequest.endDate,
              rentalDays: quoteRequest.rentalDays,
              baseAmount: quote.totalAmount - (quote.gstAmount || 0),
              operatorCharges: quote.operatorCharges || 0,
              deliveryCharges: quote.deliveryCharges || 0,
              pickupCharges: quote.pickupCharges || 0,
              installationCharges: quote.installationCharges || 0,
              securityDeposit: quote.securityDeposit || 0,
              gstAmount: quote.gstAmount || 0,
              totalAmount: quote.totalAmount,
              advanceAmount,
              balanceAmount,
              deliveryOtp: generateOTP(),
              status: 'PENDING_PAYMENT',
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
          prisma.equipment_quote_requests.update({ where: { id }, data: { status: 'CANCELLED' } }),
          prisma.equipment_quotes.updateMany({ where: { requestId: id, status: { in: ['SENT', 'VIEWED', 'DRAFT'] } }, data: { status: 'REJECTED' } }),
        ]);
        return NextResponse.json({ success: true, message: 'Quote request cancelled' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update equipment quote request', error);
    return NextResponse.json({ error: 'Failed to update request', details: error?.message }, { status: 500 });
  }
}
