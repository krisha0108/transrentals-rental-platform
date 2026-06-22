// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { canStartTrip } from '@/lib/utils/booking-date-guard';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId)
      return NextResponse.json({ error: auth.error }, { status: 401 });

    const booking = await (prisma as any).wander_bookings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        quoteRequest: {
          include: {
            listing: {
              select: {
                title: true, duration: true, images: true,
                requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true,
                category: { select: { name: true, icon: true } },
                mainLocation: { select: { name: true } },
              },
            },
          },
        },
        quote: {
          select: {
            amount: true, perPersonAmount: true, notes: true,
            customInclusions: true, customExclusions: true,
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error('[Vendor Wander Booking Detail]', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId)
      return NextResponse.json({ error: auth.error }, { status: 401 });

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const { action, invoiceNotes } = await request.json();

    const booking = await (prisma as any).wander_bookings.findFirst({
      where: { id: params.id, vendorId: auth.vendorId },
      include: {
        quoteRequest: {
          include: { listing: { select: { title: true } } },
        },
      },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (action === 'start') {
      if (!['CONFIRMED', 'GUIDE_ASSIGNED'].includes(booking.status)) {
        return NextResponse.json({ error: 'Booking cannot be started from its current status' }, { status: 400 });
      }
      const guard = canStartTrip(booking.travelDate);
      if (!guard.allowed) {
        return NextResponse.json({ error: guard.message }, { status: 400 });
      }
      const updated = await (prisma as any).wander_bookings.update({
        where: { id: params.id },
        data: { status: 'STARTED' },
      });

      // Notify customer — trip started
      try {
        const tourTitle = booking.quoteRequest?.listing?.title || 'your tour';
        const notifTitle = '🚀 Your Tour Has Started!';
        const notifBody = `Your tour "${tourTitle}" has started. Have an amazing experience!`;
        await prisma.notifications.create({
          data: {
            customerId: booking.customerId,
            title: notifTitle,
            body: notifBody,
            type: 'booking',
            serviceType: 'wander',
            bookingId: booking.id,
          },
        });
        await sendNotificationToCustomer(
          booking.customerId,
          { title: notifTitle, body: notifBody },
          { type: 'trip_started', screen: 'WanderQuoteDetail', bookingId: booking.id }
        );
      } catch (notifErr) {
        console.error('[Wander Trip Start Notification]', notifErr);
      }

      return NextResponse.json({ success: true, status: updated.status });
    }

    if (action === 'complete') {
      if (booking.status !== 'STARTED') {
        return NextResponse.json({ error: 'Booking must be STARTED before completing' }, { status: 400 });
      }
      const updated = await (prisma as any).wander_bookings.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      });

      // Notify customer — trip completed
      try {
        const tourTitle = booking.quoteRequest?.listing?.title || 'your tour';
        const notifTitle = '✅ Tour Completed!';
        const notifBody = `Your tour "${tourTitle}" has been completed. Thank you for choosing us!`;
        await prisma.notifications.create({
          data: {
            customerId: booking.customerId,
            title: notifTitle,
            body: notifBody,
            type: 'booking',
            serviceType: 'wander',
            bookingId: booking.id,
          },
        });
        await sendNotificationToCustomer(
          booking.customerId,
          { title: notifTitle, body: notifBody },
          { type: 'trip_completed', screen: 'WanderQuoteDetail', bookingId: booking.id }
        );
      } catch (notifErr) {
        console.error('[Wander Trip Complete Notification]', notifErr);
      }

      return NextResponse.json({ success: true, status: updated.status });
    }

    if (action === 'send_invoice') {
      if (!booking.isB2BBooking) {
        return NextResponse.json({ error: 'Invoice can only be sent for B2B company bookings' }, { status: 400 });
      }
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json({ error: 'Invoice can only be sent after trip is completed' }, { status: 400 });
      }
      if (booking.invoiceSent) {
        return NextResponse.json({ error: 'Invoice already sent for this booking' }, { status: 400 });
      }
      await (prisma as any).wander_bookings.update({
        where: { id: params.id },
        data: {
          invoiceSent: true,
          invoiceSentAt: new Date(),
          invoiceNotes: invoiceNotes?.trim() || null,
        },
      });

      // Notify customer — invoice sent
      try {
        const tourTitle = booking.quoteRequest?.listing?.title || 'your tour';
        const notifTitle = '🧾 Invoice Sent!';
        const notifBody = `Your invoice of ₹${Number(booking.amount).toLocaleString('en-IN')} for "${tourTitle}" has been sent. Please process the payment.`;
        await prisma.notifications.create({
          data: {
            customerId: booking.customerId,
            title: notifTitle,
            body: notifBody,
            type: 'booking',
            serviceType: 'wander',
            bookingId: booking.id,
          },
        });
        await sendNotificationToCustomer(
          booking.customerId,
          { title: notifTitle, body: notifBody },
          { type: 'invoice_sent', screen: 'WanderQuoteDetail', bookingId: booking.id }
        );
      } catch (notifErr) {
        console.error('[Wander Invoice Notification]', notifErr);
      }

      return NextResponse.json({ success: true, message: 'Invoice sent successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Vendor Wander Booking PATCH]', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
