// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { sendWanderBookingEmail } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { quoteId } = await request.json();
    if (!quoteId) return NextResponse.json({ error: 'quoteId required' }, { status: 400 });

    const quoteRequest = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: {
          select: {
            title: true,
            requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true,
          },
        },
        customer: { select: { id: true, name: true } },
      },
    });
    if (!quoteRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    if (quoteRequest.status === 'ACCEPTED') {
      const existing = await (prisma as any).wander_bookings.findFirst({
        where: { quoteRequestId: params.id },
      });
      if (existing) return NextResponse.json({ success: true, booking: existing });
      return NextResponse.json({ error: 'Quote already accepted' }, { status: 400 });
    }

    const quote = await (prisma as any).wander_quotes.findFirst({
      where: { id: quoteId },
    });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

    const allQuotes = await (prisma as any).wander_quotes.findMany({
      where: { quoteRequestId: params.id },
    });
    await Promise.all(
      allQuotes.map((q) =>
        (prisma as any).wander_quotes.update({
          where: { id: q.id },
          data: { status: q.id === quoteId ? 'ACCEPTED' : 'REJECTED' },
        })
      )
    );

    await (prisma as any).wander_quote_requests.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
    });

    const listing = quoteRequest.listing;
    let advanceAmount = null;
    if (listing?.requireAdvancePayment && listing?.advancePaymentValue) {
      advanceAmount = listing.advancePaymentType === 'PERCENTAGE'
        ? Math.round((Number(quote.amount) * listing.advancePaymentValue) / 100)
        : Number(listing.advancePaymentValue);
    }

    const bookingNumber = 'WND-' + Date.now().toString(36).toUpperCase();
    const booking = await (prisma as any).wander_bookings.create({
      data: {
        bookingId: bookingNumber,
        quoteRequestId: params.id,
        quoteId,
        customerId: quoteRequest.customerId,
        vendorId: quote.vendorId,
        travelDate: quoteRequest.travelDate,
        groupSize: quoteRequest.groupSize,
        amount: quote.amount,
        advanceAmount,
        status: advanceAmount ? 'PAYMENT_PENDING' : 'CONFIRMED',
      },
    });

    // Notify vendor — quote accepted by customer
    try {
      const customerName = quoteRequest.customer?.name || 'Customer';
      const tourTitle = quoteRequest.listing?.title || 'a tour';
      await sendVendorDirectNotification({
        vendorId: quote.vendorId,
        title: '🎉 Quote Accepted!',
        body: `${customerName} has accepted your quote of ₹${Number(quote.amount).toLocaleString('en-IN')} for "${tourTitle}". Booking #${bookingNumber} created.`,
        type: 'quote_accepted',
        serviceType: 'wander',
        bookingId: booking.id,
        bookingNumber,
        data: { screen: 'WanderBookingDetail', bookingId: booking.id },
      });
    } catch (notifErr) {
      console.error('[Wander Quote Accept Notification]', notifErr);
    }

    // Send confirmation email to customer
    try {
      const customerEmail = quoteRequest.customer?.email;
      if (customerEmail && !customerEmail.endsWith('@wander.local')) {
        const travelDateStr = new Date(quoteRequest.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        await sendWanderBookingEmail({
          to: customerEmail,
          customerName: quoteRequest.customer.name || 'Traveler',
          tourTitle: quoteRequest.listing?.title || 'Tour',
          bookingNumber,
          travelDate: travelDateStr,
          groupSize: quoteRequest.groupSize || 1,
          amount: Number(quote.amount),
          vendorName: 'Tour Operator',
          status: booking.status,
        });
      }
    } catch (emailErr) {
      console.error('[Wander Booking Email]', emailErr);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('[Customer Wander Quote Accept]', error);
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 });
  }
}
