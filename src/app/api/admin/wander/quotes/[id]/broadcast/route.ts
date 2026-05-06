// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

// POST - Broadcast an admin-tour quote request to all wander vendors
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const quoteRequest = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: { select: { title: true, vendorId: true } },
        customer: { select: { name: true } },
      },
    });

    if (!quoteRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // Only admin tours can be broadcasted (vendor tours go directly to the owning vendor)
    if (quoteRequest.listing?.vendorId) {
      return NextResponse.json({ error: 'This request belongs to a vendor tour and cannot be broadcasted.' }, { status: 400 });
    }

    if (quoteRequest.broadcastedAt) {
      return NextResponse.json({ error: 'Already broadcasted', broadcastedAt: quoteRequest.broadcastedAt }, { status: 400 });
    }

    if (quoteRequest.status === 'ACCEPTED' || quoteRequest.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot broadcast a closed request' }, { status: 400 });
    }

    const now = new Date();
    await (prisma as any).wander_quote_requests.update({
      where: { id: params.id },
      data: { broadcastedAt: now },
    });

    // Notify all wander vendors
    let notifiedCount = 0;
    try {
      const wanderVendors = await (prisma as any).wander_listings.findMany({
        where: { vendorId: { not: null } },
        select: { vendorId: true },
        distinct: ['vendorId'],
      });

      const tourTitle = quoteRequest.listing?.title || 'a tour';
      const customerName = quoteRequest.customer?.name || 'A customer';

      await Promise.all(
        wanderVendors.map((v: any) =>
          sendVendorDirectNotification({
            vendorId: v.vendorId,
            title: '🌍 New Marketplace Tour Request',
            body: `${customerName} requested a quote for "${tourTitle}". Open Marketplace tab to send your quote.`,
            type: 'wander_marketplace_request',
            serviceType: 'wander',
            data: { screen: 'WanderQuotes', tab: 'marketplace', requestId: quoteRequest.id },
          })
            .then(() => { notifiedCount++; })
            .catch((e) => console.error('[Marketplace Notify]', v.vendorId, e?.message))
        )
      );
    } catch (notifErr) {
      console.error('[Wander Marketplace Broadcast]', notifErr);
    }

    return NextResponse.json({
      success: true,
      broadcastedAt: now,
      vendorsNotified: notifiedCount,
    });
  } catch (error) {
    console.error('[Admin Wander Broadcast]', error);
    return NextResponse.json({ error: 'Failed to broadcast request' }, { status: 500 });
  }
}
