import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import razorpayInstance from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';
import { REFUND_STATUSES, sourceFor } from '@/lib/refunds/refund-sources';

export const dynamic = 'force-dynamic';

/** The tables that carry the gateway payment id, and what to write back. */
const GATEWAY_TABLES: Record<string, { delegate: string; hasRefundColumn: boolean }> = {
  car_bookings: { delegate: 'car_bookings', hasRefundColumn: true },
  bike_bookings: { delegate: 'bike_bookings', hasRefundColumn: false },
  bus_bookings: { delegate: 'bus_bookings', hasRefundColumn: false },
  chauffeur_bookings: { delegate: 'chauffeur_bookings', hasRefundColumn: true },
};

async function requireDesk() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 as const };
  const user = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    return { error: 'Access denied', status: 403 as const };
  }
  return { user };
}

/**
 * PATCH /api/admin/refunds/[id]
 *
 * Two ways to settle a refund:
 *
 *   { action: 'process' }            send it through Razorpay now
 *   { action: 'mark', status, notes} record what was done by hand
 *
 * Services that do not store the gateway payment id can only be marked — the
 * money moves in someone's banking app and this records that it did.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDesk();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');

    const refund = await prisma.refund_followups.findUnique({ where: { id } });
    if (!refund) return NextResponse.json({ error: 'Refund not found' }, { status: 404 });

    if (['COMPLETED', 'NOT_REQUIRED'].includes(refund.status)) {
      return NextResponse.json(
        { error: `This refund is already ${refund.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    // ── recorded by hand ──────────────────────────────────────────────────
    if (action === 'mark') {
      const status = String(body.status || '').toUpperCase();
      if (!REFUND_STATUSES.includes(status as any) || status === 'PENDING') {
        return NextResponse.json(
          { error: 'status must be PROCESSING, COMPLETED, FAILED or NOT_REQUIRED' },
          { status: 400 }
        );
      }
      const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
      if (['COMPLETED', 'NOT_REQUIRED', 'FAILED'].includes(status) && !notes) {
        return NextResponse.json(
          { error: 'Please say how this was settled — the note is the record.' },
          { status: 400 }
        );
      }

      const updated = await prisma.refund_followups.update({
        where: { id },
        data: {
          status,
          notes: notes || refund.notes,
          handledBy: auth.user.id,
          handledAt: new Date(),
        },
      });

      logger.info('Refund marked', {
        refundId: id,
        status,
        actorId: auth.user.id,
        actorEmail: auth.user.email,
      });
      return NextResponse.json({ success: true, refund: updated });
    }

    // ── sent through the gateway ──────────────────────────────────────────
    if (action === 'process') {
      const src = sourceFor(refund.source);
      const gw = GATEWAY_TABLES[refund.source];
      if (!src?.gateway || !gw) {
        return NextResponse.json(
          {
            error: `${src?.label ?? refund.source} does not store a gateway payment id. Settle it by hand and mark it here.`,
          },
          { status: 400 }
        );
      }

      const delegate = (prisma as any)[gw.delegate];
      const booking = await delegate.findUnique({ where: { id: refund.bookingId } });
      if (!booking) {
        return NextResponse.json({ error: 'The booking behind this refund is gone.' }, { status: 404 });
      }
      if (!booking.transactionId) {
        return NextResponse.json(
          { error: 'No gateway payment id on this booking. Settle it by hand and mark it here.' },
          { status: 400 }
        );
      }

      const paise = Math.round(refund.amount * 100);
      if (paise <= 0) {
        return NextResponse.json({ error: 'Nothing to refund on this booking.' }, { status: 400 });
      }

      // Claim it first, so two people on the queue cannot both fire a refund.
      const claimed = await prisma.refund_followups.updateMany({
        where: { id, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'PROCESSING', handledBy: auth.user.id, handledAt: new Date() },
      });
      if (claimed.count === 0) {
        return NextResponse.json(
          { error: 'Someone else is already working on this refund.' },
          { status: 409 }
        );
      }

      try {
        const gatewayRefund = await razorpayInstance.payments.refund(booking.transactionId, {
          amount: paise,
          notes: {
            bookingId: refund.bookingId,
            bookingNumber: refund.bookingNumber,
            reason: 'Customer cancellation refund',
          },
        });

        await prisma.refund_followups.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            gatewayRefundId: gatewayRefund.id,
            handledBy: auth.user.id,
            handledAt: new Date(),
          },
        });

        // Write back what the booking table can hold.
        await delegate
          .update({
            where: { id: refund.bookingId },
            data: {
              refundAmount: refund.amount,
              paymentStatus: 'REFUNDED',
              ...(gw.hasRefundColumn ? { refundTransactionId: gatewayRefund.id } : {}),
            },
          })
          .catch((err: unknown) => logger.error('Refund write-back failed', { id, err }));

        // Tell the customer. notifications is their table, keyed by customerId.
        if (refund.customerId) {
          prisma.notifications
            .create({
              data: {
                customerId: refund.customerId,
                title: 'Refund on the way',
                body: `Your refund of ₹${Math.round(refund.amount).toLocaleString(
                  'en-IN'
                )} for booking #${refund.bookingNumber} has been sent to your bank. It usually lands in 5–7 working days.`,
                type: 'REFUND_PROCESSED',
                bookingId: refund.bookingId,
                serviceType: refund.serviceType,
              },
            })
            .catch((err: unknown) => logger.error('Refund customer notification failed', err));
        }

        logger.info('Refund processed through gateway', {
          refundId: id,
          gatewayRefundId: gatewayRefund.id,
          amount: refund.amount,
          actorId: auth.user.id,
        });

        return NextResponse.json({
          success: true,
          message: `₹${Math.round(refund.amount).toLocaleString('en-IN')} sent back to the customer.`,
          gatewayRefundId: gatewayRefund.id,
        });
      } catch (err: any) {
        // Put it back on the queue with the reason, so it can be retried.
        await prisma.refund_followups.update({
          where: { id },
          data: {
            status: 'FAILED',
            notes: `Gateway refused: ${err?.description || err?.message || 'unknown error'}`,
            handledBy: auth.user.id,
            handledAt: new Date(),
          },
        });
        logger.error('Gateway refund failed', { refundId: id, err });
        return NextResponse.json(
          { error: err?.description || err?.message || 'The gateway refused the refund.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    logger.error('Refund action error', error);
    return NextResponse.json({ error: 'Failed to update this refund' }, { status: 500 });
  }
}
