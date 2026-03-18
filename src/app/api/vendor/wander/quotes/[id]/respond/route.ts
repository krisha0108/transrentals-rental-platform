// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';

export const dynamic = 'force-dynamic';

// POST - Vendor responds to a quote request with a price
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const quoteRequest = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: { select: { vendorId: true, title: true, vendor: { select: { businessName: true } } } },
        customer: { select: { id: true, name: true } },
        quotes: { where: { vendorId: auth.vendorId } },
      },
    });

    if (!quoteRequest) return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    if (quoteRequest.listing.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (quoteRequest.status === 'ACCEPTED' || quoteRequest.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot respond to this request' }, { status: 400 });
    }
    if (quoteRequest.quotes.length > 0) {
      return NextResponse.json({ error: 'Quote already submitted' }, { status: 400 });
    }

    const body = await request.json();
    const { amount, perPersonAmount, customInclusions, customExclusions, validUntil, notes } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const [quote] = await (prisma as any).$transaction([
      (prisma as any).wander_quotes.create({
        data: {
          quoteRequestId: params.id,
          vendorId: auth.vendorId,
          amount: parseFloat(amount),
          perPersonAmount: perPersonAmount ? parseFloat(perPersonAmount) : null,
          customInclusions: customInclusions ? JSON.stringify(customInclusions) : null,
          customExclusions: customExclusions ? JSON.stringify(customExclusions) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          notes: notes?.trim() || null,
          status: 'PENDING',
        },
      }),
      (prisma as any).wander_quote_requests.update({
        where: { id: params.id },
        data: { status: 'QUOTED' },
      }),
    ]);

    // Notify customer — vendor submitted a quote
    try {
      if (quoteRequest.customer?.id) {
        const vendorName = quoteRequest.listing?.vendor?.businessName || 'A vendor';
        const tourTitle = quoteRequest.listing?.title || 'your tour request';
        const notifTitle = '📩 New Quote Received!';
        const notifBody = `${vendorName} has sent you a quote of ₹${parseFloat(amount).toLocaleString('en-IN')} for "${tourTitle}". Tap to view and compare.`;

        await prisma.notifications.create({
          data: {
            customerId: quoteRequest.customer.id,
            title: notifTitle,
            body: notifBody,
            type: 'quote',
            serviceType: 'wander',
            quoteId: quote.id,
          },
        });

        await sendNotificationToCustomer(
          quoteRequest.customer.id,
          { title: notifTitle, body: notifBody },
          { type: 'quote', screen: 'WanderQuoteDetail', requestId: params.id }
        );
      }
    } catch (notifErr) {
      console.error('[Wander Quote Notification]', notifErr);
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('[Vendor Wander Quote Respond]', error);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }
}
