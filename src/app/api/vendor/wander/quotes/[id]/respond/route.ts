// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// POST - Vendor responds to a quote request with a price
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });


    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const quoteRequest = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: { select: { vendorId: true, title: true, vendor: { select: { businessName: true } } } },
        customer: { select: { id: true, name: true } },
        quotes: { where: { vendorId: auth.vendorId } },
      },
    });

    if (!quoteRequest) return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });

    const isAdminTour = quoteRequest.listing.vendorId === null;
    const isOwnTour = quoteRequest.listing.vendorId === auth.vendorId;

    if (!isOwnTour && !isAdminTour) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Marketplace eligibility — vendor must have at least 1 wander listing
    if (isAdminTour) {
      const listingCount = await (prisma as any).wander_listings.count({ where: { vendorId: auth.vendorId } });
      if (listingCount === 0) {
        return NextResponse.json({ error: 'You must have at least one wander listing to quote on marketplace tours' }, { status: 403 });
      }
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
            type: 'WANDER_QUOTE',
            serviceType: 'wander',
            quoteId: quote.id,
            bookingId: params.id,
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

    // Notify ALL group members if this is a group quote
    try {
      const groupTrip = await (prisma as any).wander_group_trips.findFirst({
        where: { quoteRequestId: params.id },
        include: {
          group: {
            include: {
              members: {
                include: { customer: { select: { id: true, fcmToken: true } } },
              },
            },
          },
        },
      });

      if (groupTrip?.group) {
        const group = groupTrip.group;
        const vendorName = quoteRequest.listing?.vendor?.businessName || 'A vendor';
        const tourTitle = quoteRequest.listing?.title || 'your tour';
        const perPerson = body.perPersonAmount
          ? `₹${parseFloat(body.perPersonAmount).toLocaleString('en-IN')}/person`
          : `₹${parseFloat(amount).toLocaleString('en-IN')} total`;
        const grpTitle = `${group.name} — Quote Received! 📩`;
        const grpBody = `${vendorName} quoted ${perPerson} for "${tourTitle}". Open the group to view details.`;

        const tokens = group.members
          .filter((m: any) => m.customer?.fcmToken)
          .map((m: any) => m.customer.fcmToken);

        if (tokens.length > 0) {
          const { sendMulticastNotification } = await import('@/lib/services/push-notification-service');
          await sendMulticastNotification(tokens, { title: grpTitle, body: grpBody }, {
            type: 'GROUP_QUOTE_RECEIVED',
            groupCode: group.groupCode,
          });
        }

        // Save to notifications DB for all group members
        const memberCustomers = group.members.filter((m: any) => m.customer?.id);
        if (memberCustomers.length > 0) {
          await prisma.notifications.createMany({
            data: memberCustomers.map((m: any) => ({
              customerId: m.customer.id,
              title: grpTitle,
              body: grpBody,
              type: 'GROUP_QUOTE_RECEIVED',
              bookingId: group.groupCode,
            })),
            skipDuplicates: true,
          });
        }
      }
    } catch (grpNotifErr) {
      console.error('[Group Quote Notification]', grpNotifErr);
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('[Vendor Wander Quote Respond]', error);
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 });
  }
}
