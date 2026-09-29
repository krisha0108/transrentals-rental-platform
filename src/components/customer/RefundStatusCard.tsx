'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Check, Loader2, Headphones, AlertTriangle } from 'lucide-react';

// Shown on a cancelled booking so the customer can see what is happening with
// their money. Before this, a paid booking could be cancelled and the page
// said nothing at all about the refund.
//
// Two things shape the design:
//
//   * the amount lives inside the sentence, never as a figure of its own. A
//     large ₹0 in the corner of a no-refund cancellation reads as a bill.
//   * when money is actually moving, the question is "where has it got to",
//     so the card draws the three steps and marks the one it is on. A
//     cancellation that owes nothing has no journey, so it gets no rail —
//     just the reason and a way to ask about it.
//
// Renders nothing when there is no refund to talk about, so it is safe to drop
// onto any booking page.

type Stage = 'arranged' | 'sending' | 'sent' | 'retry' | 'none';

interface Refund {
  label: string;
  detail: string;
  aside: string | null;
  tone: 'waiting' | 'moving' | 'done' | 'none';
  stage: Stage;
  settled: boolean;
  raisedAt: string;
  updatedAt: string | null;
}

const TONE: Record<
  Refund['tone'],
  {
    ring: string;
    bar: string;
    head: string;
    body: string;
    chipBg: string;
    chipFg: string;
    fill: string;
    footer: string;
    /** Halo on the step you are standing on. Spelled out per tone because an
     *  opacity modifier on currentColor is not dependable in Tailwind. */
    halo: string;
    Icon: typeof Clock;
  }
> = {
  waiting: {
    ring: 'border-amber-200',
    bar: 'bg-amber-50',
    head: 'text-amber-950',
    body: 'text-amber-950/70',
    chipBg: 'bg-amber-500',
    chipFg: 'text-white',
    fill: 'bg-amber-500',
    footer: 'bg-amber-50/70 text-amber-900/80',
    halo: 'ring-amber-200',
    Icon: Clock,
  },
  moving: {
    ring: 'border-blue-200',
    bar: 'bg-blue-50',
    head: 'text-blue-950',
    body: 'text-blue-950/70',
    chipBg: 'bg-blue-600',
    chipFg: 'text-white',
    fill: 'bg-blue-600',
    footer: 'bg-blue-50/70 text-blue-900/80',
    halo: 'ring-blue-200',
    Icon: Loader2,
  },
  done: {
    ring: 'border-emerald-200',
    bar: 'bg-emerald-50',
    head: 'text-emerald-950',
    body: 'text-emerald-950/70',
    chipBg: 'bg-emerald-600',
    chipFg: 'text-white',
    fill: 'bg-emerald-600',
    footer: 'bg-emerald-50/70 text-emerald-900/80',
    halo: 'ring-emerald-200',
    Icon: Check,
  },
  none: {
    ring: 'border-gray-200',
    bar: 'bg-gray-50',
    head: 'text-gray-900',
    body: 'text-gray-600',
    chipBg: 'bg-gray-700',
    chipFg: 'text-white',
    fill: 'bg-gray-400',
    footer: 'bg-gray-50 text-gray-600',
    halo: 'ring-gray-200',
    Icon: ShieldCheck,
  },
};

/** The three steps a refund travels, and how far each stage has got. */
const STEPS = ['Cancelled', 'Being arranged', 'Sent to your bank'] as const;
const REACHED: Record<Exclude<Stage, 'none'>, number> = {
  arranged: 1,
  retry: 1,
  sending: 2,
  sent: 3,
};

export default function RefundStatusCard({
  source,
  bookingId,
}: {
  /** Booking table this booking lives in, e.g. 'bike_bookings'. */
  source: string;
  bookingId: string;
}) {
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/customer/refund-status?source=${encodeURIComponent(source)}&bookingId=${encodeURIComponent(bookingId)}`
        );
        const data = await res.json();
        if (alive) setRefund(data.refund ?? null);
      } catch {
        // A refund panel that cannot load is not worth an error on the page.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [source, bookingId]);

  if (loading || !refund) return null;

  const t = TONE[refund.tone] ?? TONE.waiting;
  const { Icon } = t;
  const showRail = refund.stage !== 'none';
  const reached = showRail ? REACHED[refund.stage as Exclude<Stage, 'none'>] : 0;

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white ${t.ring}`}>
      {/* ── header ── */}
      <div className={`flex items-center gap-3 px-5 py-4 ${t.bar}`}>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipBg} ${t.chipFg}`}
        >
          <Icon className={`h-[18px] w-[18px] ${refund.stage === 'sending' ? 'animate-spin' : ''}`} />
        </span>
        <h3 className={`text-[15px] font-extrabold leading-snug ${t.head}`}>{refund.label}</h3>
        {refund.stage === 'retry' && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Retrying
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {/* ── where it has got to ── */}
        {showRail && (
          <ol className="mb-4 flex items-start">
            {STEPS.map((step, i) => {
              const n = i + 1;
              const done = n < reached || refund.stage === 'sent';
              const here = n === reached && refund.stage !== 'sent';
              const live = done || here;
              return (
                <li key={step} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {/* the line coming in */}
                    <span
                      className={`h-[3px] flex-1 rounded-full ${i === 0 ? 'bg-transparent' : n <= reached ? t.fill : 'bg-gray-200'}`}
                    />
                    <span
                      className={`mx-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors ${
                        live ? `${t.fill} text-white` : 'bg-gray-200 text-gray-500'
                      } ${here ? `ring-4 ${t.halo}` : ''}`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
                    </span>
                    {/* the line going out */}
                    <span
                      className={`h-[3px] flex-1 rounded-full ${i === STEPS.length - 1 ? 'bg-transparent' : n < reached ? t.fill : 'bg-gray-200'}`}
                    />
                  </div>
                  <p
                    className={`mt-1.5 px-1 text-center text-[10.5px] font-bold leading-tight ${
                      live ? t.head : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        <p className={`text-[13.5px] leading-relaxed ${t.body}`}>{refund.detail}</p>
      </div>

      {/* ── what happens next ── */}
      {refund.aside && (
        <p
          className={`flex items-start gap-2 border-t px-5 py-3 text-[12.5px] leading-relaxed ${t.ring} ${t.footer}`}
        >
          <Headphones className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {refund.aside}
        </p>
      )}
    </div>
  );
}
