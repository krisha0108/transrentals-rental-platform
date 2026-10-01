'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Loader2, MessageSquare, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type VendorReviewSummary = {
  average: number;
  total: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

type AdminVendorReview = {
  id: string;
  source: string;
  serviceLabel: string;
  bookingId: string;
  bookingNumber: string | null;
  rating: number;
  review: string | null;
  subRatings: Record<string, number>;
  customerName: string | null;
  tripDate: string | null;
  reviewedAt: string | null;
  moderationStatus: string;
};

const SERVICES = [
  { key: 'car', label: 'Car Rental' },
  { key: 'self-drive', label: 'Self Drive' },
  { key: 'bike', label: 'Bike Rental' },
  { key: 'luxury', label: 'Luxury Cars' },
  { key: 'bus', label: 'Bus & Tempo' },
  { key: 'truck', label: 'Transporter' },
  { key: 'packers', label: 'Packers & Movers' },
  { key: 'equipment', label: 'Equipment Rental' },
  { key: 'wander', label: 'Wander Tour' },
];

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-700',
  HIDDEN: 'bg-gray-100 text-gray-600',
  FLAGGED: 'bg-red-100 text-red-700',
};

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Stars({ rating, className = 'w-4 h-4' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${className} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}`}
        />
      ))}
    </span>
  );
}

/** Every review customers left on this vendor's bookings, with moderation status. */
export default function VendorReviewsTab({ vendorId }: { vendorId: string }) {
  const [summary, setSummary] = useState<VendorReviewSummary | null>(null);
  const [reviews, setReviews] = useState<AdminVendorReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState<number | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number) => {
      const append = nextPage > 1;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(nextPage), limit: '20' });
        if (rating) qs.set('rating', String(rating));
        if (service) qs.set('service', service);
        const res = await fetch(`/api/admin/vendors/${vendorId}/reviews?${qs}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load reviews');
        setSummary(data.summary);
        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (e: any) {
        setError(e?.message || 'Failed to load reviews');
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [vendorId, rating, service]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const total = summary?.total ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" /> Rating Summary
        </h3>
        {!summary ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-5">
              <p className="text-4xl font-bold text-gray-900">{total ? summary.average.toFixed(1) : '—'}</p>
              <div>
                <Stars rating={summary.average} />
                <p className="text-sm text-gray-500 mt-1">
                  {total} review{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((r) => {
                const count = summary.distribution[String(r) as '1'];
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-600">{r}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Booking reviews appear on the public site only once approved in{' '}
              <Link href="/admin/reviews" className="text-blue-600 hover:underline">Reviews</Link>.
            </p>
          </>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rating ?? ''}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
            ))}
          </select>
          <select
            value={service ?? ''}
            onChange={(e) => setService(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All services</option>
            {SERVICES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-xl border">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border p-8 text-center text-sm text-red-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {rating || service ? 'No reviews match these filters.' : 'No customer has rated this vendor yet.'}
            </p>
          </div>
        ) : (
          <>
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars rating={r.rating} />
                    <span className="text-sm font-semibold text-gray-900">{r.rating}/5</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">{r.serviceLabel}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[r.moderationStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {r.moderationStatus}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.customerName || 'Customer'}</span>
                  {r.bookingNumber && (
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {r.bookingNumber}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Trip {fmt(r.tripDate)}</span>
                  <span>Reviewed {fmt(r.reviewedAt)}</span>
                </div>
                {r.review ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line">{r.review}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No written comment</p>
                )}
                {Object.keys(r.subRatings).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(r.subRatings).map(([label, value]) => (
                      <span key={label} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {label}: {value}/5
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {page < totalPages && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => load(page + 1)} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
