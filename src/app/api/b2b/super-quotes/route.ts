// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onSuperQuoteSent } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateSuperQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SQ-${year}-${random}`;
}

// POST - Manager creates a Super Quote by combining vendor quotes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, vendorQuoteIds, companyMargin, notes, vendorCostOverride } = body;

    // vendorQuoteIds = array of vendor quote IDs to combine

    if (!bookingId || !vendorQuoteIds || !Array.isArray(vendorQuoteIds) || vendorQuoteIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, vendorQuoteIds[]' },
        { status: 400 }
      );
    }
    if (companyMargin === undefined || companyMargin < 0) {
      return NextResponse.json({ error: 'companyMargin is required and must be >= 0' }, { status: 400 });
    }

    // Verify booking
    const booking = await prisma.b2b_bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'B2B booking not found' }, { status: 404 });
    }
    if (!['QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot create super quote when booking is ${booking.status}` }, { status: 400 });
    }

    // Fetch selected vendor quotes
    const vendorQuotes = await prisma.b2b_vendor_quotes.findMany({
      where: { id: { in: vendorQuoteIds }, bookingId, status: { in: ['SUBMITTED', 'REVISED'] } },
    });

    if (vendorQuotes.length !== vendorQuoteIds.length) {
      return NextResponse.json({ error: 'Some vendor quotes are invalid or not in submittable status' }, { status: 400 });
    }

    // Calculate totals
    const totalVehicles = vendorQuotes.reduce((sum, q) => sum + q.vehicleCount, 0);
    const autoVendorCost = vendorQuotes.reduce((sum, q) => sum + q.totalPrice, 0);
    // For direct assignments (car/bike/luxury), vendor cost is 0 — manager sets it manually
    const vendorCostTotal = vendorCostOverride !== undefined && vendorCostOverride !== null
      ? parseFloat(vendorCostOverride)
      : autoVendorCost;
    const margin = parseFloat(companyMargin);
    const finalAmount = vendorCostTotal + margin;

    const superQuoteId = generateId();
    const quoteNumber = generateSuperQuoteNumber();

    await prisma.$transaction(async (tx) => {
      // Create super quote
      await tx.b2b_super_quotes.create({
        data: {
          id: superQuoteId,
          quoteNumber,
          bookingId,
          createdById: session.user.id,
          vendorCostTotal,
          companyMargin: margin,
          gstPercent: 0,
          gstAmount: 0,
          finalAmount,
          notes: notes || null,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Create super quote items
      const items = vendorQuotes.map(vq => ({
        id: generateId(),
        superQuoteId,
        vendorQuoteId: vq.id,
        vehicleCount: vq.vehicleCount,
        vendorPrice: vq.totalPrice,
      }));
      await tx.b2b_super_quote_items.createMany({ data: items });

      // Update booking
      await tx.b2b_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'SUPER_QUOTE_SENT',
          totalVehiclesFilled: totalVehicles,
          vendorCostTotal,
          companyMargin: margin,
          gstAmount: 0,
          finalAmount,
          acceptedSuperQuoteId: superQuoteId,
        },
      });

      // Mark selected vendor quotes as CONFIRMED
      await tx.b2b_vendor_quotes.updateMany({
        where: { id: { in: vendorQuoteIds }, bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Mark non-selected vendor quotes as REJECTED
      await tx.b2b_vendor_quotes.updateMany({
        where: {
          bookingId,
          id: { notIn: vendorQuoteIds },
          status: { in: ['SUBMITTED', 'REVISED'] },
        },
        data: { status: 'REJECTED' },
      });
    });

    // Notify customer about super quote (async, non-blocking)
    onSuperQuoteSent({
      bookingId,
      bookingNumber: booking.bookingNumber,
      quoteNumber,
      finalAmount,
      customerId: booking.customerId,
      serviceType: booking.serviceType,
    }).catch(e => console.error('Super quote notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: 'Super Quote created and sent to HR',
      superQuote: {
        id: superQuoteId,
        quoteNumber,
        totalVehicles,
        vendorCostTotal,
        companyMargin: margin,
        finalAmount,
      },
    });
  } catch (error: any) {
    console.error('Super Quote POST error:', error);
    return NextResponse.json({ error: 'Failed to create super quote' }, { status: 500 });
  }
}
