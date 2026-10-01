'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Star, MessageSquare, Award, RefreshCw, Loader2, Calendar, Hash } from 'lucide-react';

type Review = {
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
};

type Summary = {
  average: number;
  total: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

const PAGE_SIZE = 20;

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

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? 'fill-emerald-400 text-emerald-400' : 'fill-gray-100 text-gray-200'}`}
        />
      ))}
    </span>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-slate-500 w-3 text-right">{rating}</span>
      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-500 w-5 text-right">{count}</span>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
        active ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3.5 w-1/3 bg-gray-100 rounded" />
          <div className="h-3 w-1/4 bg-gray-100 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function VendorReviewsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
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
        const qs = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
        if (rating) qs.set('rating', String(rating));
        if (service) qs.set('service', service);
        const res = await fetch(`/api/vendor/reviews?${qs}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load reviews');
        setSummary(data.summary);
        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (e: any) {
        setError(e?.message || 'Failed to load reviews');
        if (!append) setReviews([]);
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [rating, service]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const total = summary?.total ?? 0;
  const filtered = rating !== null || service !== null;

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-dvh">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200 mb-3">
              <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" /> Customer Feedback
            </span>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">Customer Reviews</h1>
            <p className="text-emerald-100/70 text-sm">What customers said after their trips with you</p>
          </div>
          <button
            onClick={() => load(1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition text-sm font-medium flex-shrink-0 mt-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 sticky top-[57px] z-20 shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Chip active={rating === null} onClick={() => setRating(null)}>All ratings</Chip>
          {[5, 4, 3, 2, 1].map((r) => (
            <Chip key={r} active={rating === r} onClick={() => setRating(r)}>
              <span className="flex items-center gap-1">
                {r} <Star className={`w-3 h-3 ${rating === r ? 'fill-white text-white' : 'fill-emerald-400 text-emerald-400'}`} />
              </span>
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Chip active={service === null} onClick={() => setService(null)}>All services</Chip>
          {SERVICES.map((s) => (
            <Chip key={s.key} active={service === s.key} onClick={() => setService(s.key)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-8 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Reviews */}
          <div className="space-y-4 order-2 lg:order-1">
            {loading ? (
              [0, 1, 2].map((i) => <ReviewSkeleton key={i} />)
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-red-200 rounded-2xl">
                <p className="font-bold text-gray-800 mb-1">{error}</p>
                <button onClick={() => load(1)} className="text-sm text-emerald-600 font-semibold hover:underline">
                  Try again
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 bg-white border border-dashed border-gray-200 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-emerald-200" />
                </div>
                <p className="font-bold text-gray-800 mb-1 text-base">
                  {filtered ? 'No reviews match these filters' : 'No reviews yet'}
                </p>
                <p className="text-sm text-gray-400">
                  {filtered ? 'Try a different rating or service' : 'Ratings customers leave after completed trips will appear here'}
                </p>
              </div>
            ) : (
              <>
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md overflow-hidden transition-all">
                    <div
                      className={`h-1 ${
                        review.rating >= 4
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : review.rating === 3
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }`}
                    />
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-black text-base shadow-sm">
                          {review.customerName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-gray-900 text-sm">{review.customerName || 'Customer'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              {review.serviceLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-400 mb-3">
                            {review.bookingNumber && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" /> {review.bookingNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Trip {fmt(review.tripDate)}
                            </span>
                            <span>Reviewed {fmt(review.reviewedAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-2.5">
                            <StarRow rating={review.rating} />
                            <span className="text-sm font-black text-gray-700">{review.rating}/5</span>
                          </div>

                          {review.review ? (
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{review.review}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No written comment</p>
                          )}

                          {Object.keys(review.subRatings).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {Object.entries(review.subRatings).map(([label, value]) => (
                                <span
                                  key={label}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600"
                                >
                                  {label}
                                  <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                                  {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {page < totalPages && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => load(page + 1)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                      {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-4 lg:sticky lg:top-[160px] order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 mb-5">
                <Award className="w-4 h-4 text-emerald-500" /> Rating Summary
              </h3>
              {!summary ? (
                <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
              ) : (
                <>
                  <div className="flex flex-col items-center py-4 mb-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <p className="text-5xl font-black text-emerald-500 leading-none">
                      {total ? summary.average.toFixed(1) : '—'}
                    </p>
                    <div className="mt-2">
                      <StarRow rating={summary.average} size="lg" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {total} review{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {([5, 4, 3, 2, 1] as const).map((r) => (
                      <RatingBar key={r} rating={r} count={summary.distribution[String(r) as '1']} total={total} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
