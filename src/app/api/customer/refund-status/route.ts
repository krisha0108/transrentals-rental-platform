import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { sourceFor } from '@/lib/refunds/refund-sources';

export const dynamic = 'force-dynamic';

/**
 * What the customer is told for each internal state.
 *
 * The amount is written into the sentence rather than set beside it as a
 * figure of its own: on a cancellation with nothing owed, a large ₹0 sitting
 * in the corner reads as a bill, not as reassurance. `money` is the formatted
 * amount, and is only ever used where there is something to pay back.
 */
const CUSTOMER_VIEW: Record<
  string,
  {
    label: string;
    detail: (money: string) => string;
    aside?: string;
    tone: 'waiting' | 'moving' | 'done' | 'none';
    /** Where this sits on the three-step rail the card draws. 'none' means
     *  there is no journey to draw, because no money is moving. */
    stage: 'arranged' | 'sending' | 'sent' | 'retry' | 'none';
  }
> = {
  PENDING: {
    label: 'Your refund is being arranged',
    detail: (money) =>
      `Our team has your cancellation and is arranging your refund of ${money}. It will be sent back to the account you paid from.`,
    aside: 'Nothing for you to do — we will tell you the moment it is on its way.',
    tone: 'waiting',
    stage: 'arranged',
  },
  PROCESSING: {
    label: 'Your refund is on its way',
    detail: (money) =>
      `Our team is putting your refund of ${money} through right now. Once it leaves us, your bank takes a few working days to show it.`,
    aside: 'Nothing for you to do — we will confirm as soon as it is sent.',
    tone: 'moving',
    stage: 'sending',
  },
  COMPLETED: {
    label: 'Refund sent',
    detail: (money) =>
      `Your refund of ${money} has been sent back to the account you paid from. Banks usually take 5 to 7 working days to show it.`,
    aside: 'If it has not appeared after a week, our support team can trace it for you.',
    tone: 'done',
    stage: 'sent',
  },
  FAILED: {
    label: 'Your refund needs a moment',
    detail: (money) =>
      `The first attempt to send your refund of ${money} did not go through. Our team has already been alerted and is sorting it out.`,
    aside: 'You do not need to raise anything — someone is on it.',
    tone: 'waiting',
    stage: 'retry',
  },
  NOT_REQUIRED: {
    // Leads into the explanation rather than announcing the refusal. The
    // sentence underneath still says plainly that nothing is coming back —
    // the headline just does not have to be the bad news on its own.
    label: 'How your refund was worked out',
    detail: () =>
      'This cancellation falls inside the no-refund window under the cancellation policy for this booking, so there is nothing to send back this time.',
    aside: 'Our support team can walk you through how it was worked out if you would like.',
    tone: 'none',
    stage: 'none',
  },
};

/**
 * GET /api/customer/refund-status?source=bike_bookings&bookingId=…
 *
 * What the customer is told about a refund on a cancelled booking. Reads the
 * refunds queue, which is where the state actually lives, and translates the
 * internal status into something worth reading.
 *
 * Returns `{ refund: null }` when there is nothing to show — an uncancelled
 * booking, or one where nothing was owed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || '';
    const bookingId = searchParams.get('bookingId') || '';

    if (!source || !bookingId) {
      return NextResponse.json({ error: 'source and bookingId are required' }, { status: 400 });
    }
    // Only tables the refunds desk knows about, so this cannot be pointed
    // anywhere else.
    if (!sourceFor(source)) {
      return NextResponse.json({ error: 'Unknown booking type' }, { status: 400 });
    }

    const row = await prisma.refund_followups.findUnique({
      where: { source_bookingId: { source, bookingId } },
      select: { amount: true, status: true, createdAt: true, handledAt: true },
    });

    if (!row) return NextResponse.json({ refund: null });

    const view = CUSTOMER_VIEW[row.status] ?? CUSTOMER_VIEW.PENDING;
    const money = `₹${Math.round(row.amount).toLocaleString('en-IN')}`;

    // Internal notes, who handled it and the gateway id stay inside.
    return NextResponse.json({
      refund: {
        label: view.label,
        detail: view.detail(money),
        aside: view.aside ?? null,
        stage: view.stage,
        tone: view.tone,
        settled: row.status === 'COMPLETED',
        raisedAt: row.createdAt,
        updatedAt: row.handledAt,
      },
    });
  } catch (error) {
    logger.error('Refund status lookup failed', error);
    return NextResponse.json({ error: 'Could not load refund status' }, { status: 500 });
  }
}
