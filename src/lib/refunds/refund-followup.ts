// Opening a refund follow-up.
//
// Every service cancels in its own route and works out its own refundAmount.
// Before this, that number was written to the booking row and that was the end
// of it — no queue, no owner, no way to tell a refund that had been paid from
// one nobody had looked at. This puts one row in `refund_followups` and tells
// the people who have to act on it.
//
// Nothing here is allowed to fail a cancellation. A customer cancelling must
// always succeed; a missing notification is a smaller problem than a booking
// that would not cancel.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { notifyManagers, getAllActiveManagers } from '@/lib/notifications/manager-notify';

export interface OpenRefundFollowupInput {
  /** The booking table this refund belongs to, e.g. 'bike_bookings'. */
  source: string;
  bookingId: string;
  bookingNumber: string;
  /** How the service is named to a human: 'Bike Rental', 'Truck', … */
  serviceType: string;
  customerId?: string | null;
  customerName?: string | null;
  /** What the cancel handler worked out was owed. */
  amount: number;
  /** Why the customer cancelled — useful context on the queue. */
  reason?: string | null;
  /** What the customer had actually paid. Decides whether a zero refund is
   *  worth recording at all. */
  paidAmount?: number;
}

/** Active admins. Managers come from getAllActiveManagers. */
async function getAllActiveAdmins(): Promise<string[]> {
  const rows = await prisma.admin_users.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Records that a cancelled booking owes money back, and notifies the desk.
 *
 * Safe to call more than once for the same booking: the row is keyed on
 * (source, bookingId) and an existing one is left alone, so a retried cancel
 * cannot raise a second refund or a second alert.
 */
export async function openRefundFollowup(input: OpenRefundFollowupInput): Promise<void> {
  const { source, bookingId, bookingNumber, serviceType, customerId, customerName, amount, reason, paidAmount } =
    input;

  // A cancellation that owes nothing still has to be recorded when the
  // customer had paid. Otherwise the page goes silent on someone who just
  // lost money to the policy, which reads as a broken page rather than a
  // rule. It lands as NOT_REQUIRED: visible to them, no work for the desk.
  const owesNothing = !amount || amount <= 0;
  if (owesNothing && !(paidAmount && paidAmount > 0)) return;

  try {
    const existing = await prisma.refund_followups.findUnique({
      where: { source_bookingId: { source, bookingId } },
      select: { id: true },
    });
    if (existing) return;

    await prisma.refund_followups.create({
      data: {
        source,
        bookingId,
        bookingNumber,
        serviceType,
        customerId: customerId ?? null,
        customerName: customerName ?? null,
        amount,
        status: owesNothing ? 'NOT_REQUIRED' : 'PENDING',
        notes: [
          reason ? `Cancellation reason: ${reason}` : null,
          owesNothing
            ? `Nothing refundable under the policy — customer had paid ₹${Math.round(
                paidAmount || 0
              ).toLocaleString('en-IN')}.`
            : null,
        ]
          .filter(Boolean)
          .join(' ') || null,
      },
    });

    // Every cancellation reaches the desk, even a zero-refund one — the
    // manager still has to weigh in on whether the vendor keeps their share
    // of this booking, which is a real decision regardless of what (if
    // anything) goes back to the customer.
    const [managerIds, adminIds] = await Promise.all([
      getAllActiveManagers(),
      getAllActiveAdmins(),
    ]);

    const money = `₹${Math.round(amount).toLocaleString('en-IN')}`;
    const title = owesNothing
      ? `Booking cancelled — no refund owed`
      : `Refund pending — ${money}`;
    const body = owesNothing
      ? `${serviceType} booking #${bookingNumber} was cancelled${
          customerName ? ` by ${customerName}` : ''
        }. No refund is owed under the policy, but review it to confirm the vendor's payout.`
      : `${serviceType} booking #${bookingNumber} was cancelled${
          customerName ? ` by ${customerName}` : ''
        }. ${money} is owed back and is waiting in the refunds queue.`;
    const shared = {
      type: 'REFUND_PENDING' as const,
      title,
      body,
      metadata: { source, bookingId, bookingNumber, amount, serviceType },
      // A double-submitted cancel must not alert the desk twice.
      dedupeKey: bookingId,
    };

    // manager_notifications is keyed to admin_users, so one writer serves both
    // roles. Only the link differs: the two desks reach the same queue by
    // different paths, and a manager cannot open /admin.
    await Promise.all([
      notifyManagers(managerIds, { ...shared, link: '/manager/refunds' }),
      notifyManagers(adminIds, { ...shared, link: '/admin/refunds' }),
    ]);
  } catch (error) {
    logger.error('openRefundFollowup failed', { source, bookingId, error });
  }
}
