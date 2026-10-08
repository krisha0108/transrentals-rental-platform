'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import RefundStatusCard from './RefundStatusCard';

interface RefundRow {
  source: string;
  bookingId: string;
  bookingNumber: string;
  serviceType: string;
  amount: number;
  raisedAt: string;
  bookingUrl: string | null;
}

/**
 * Every refund the customer has ever raised, across every service — so a
 * cancellation from three bookings ago does not require remembering which
 * booking page it was on. Each row hands off to RefundStatusCard for the
 * actual status wording, so this and the per-booking card can never disagree.
 *
 * Renders nothing when the customer has never had a refund, same rule
 * RefundStatusCard itself follows — an empty "Refunds" section reads as
 * something broken, not as good news.
 */
export default function CustomerRefundsList({ customerId }: { customerId: string }) {
  const [refunds, setRefunds] = useState<RefundRow[] | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/customer/refunds?customer_id=${encodeURIComponent(customerId)}`);
        const data = await res.json();
        if (alive) setRefunds(data.refunds ?? []);
      } catch {
        if (alive) setRefunds([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [customerId]);

  // Self-contained: this includes its own section header, so the page
  // never shows a "Refunds" title over an empty area for a customer who has
  // never cancelled anything.
  if (!refunds || refunds.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10 pt-[60px]">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E7EEE9] pb-[18px]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Your money</p>
          <h2 className="quote-serif mt-2 text-[40px] font-medium leading-none">Refunds</h2>
        </div>
        <span className="text-[12.5px] text-[#78857C]">
          {refunds.length} refund{refunds.length !== 1 ? 's' : ''} raised
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 py-8 lg:grid-cols-2">
        {refunds.map((r) => (
          <div key={`${r.source}-${r.bookingId}`} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold text-[#0B1610]">{r.serviceType}</p>
                <p className="text-[11.5px] text-[#78857C]">
                  #{r.bookingNumber} · Raised {new Date(r.raisedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {r.bookingUrl && (
                <Link
                  href={r.bookingUrl}
                  className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-[#056B3E] hover:underline"
                >
                  View booking <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <RefundStatusCard source={r.source} bookingId={r.bookingId} />
          </div>
        ))}
      </div>
    </div>
  );
}
