// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Loader2, ChevronDown, User } from 'lucide-react';

interface ReviewsSectionProps {
  listingId: string;
}

export default function ReviewsSection({ listingId }: ReviewsSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/wander/reviews?listingId=${listingId}&page=${page}&limit=5`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId, page]);

  if (loading) return (
    <div className="py-8 flex justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
    </div>
  );

  if (!data || data.totalRatings === 0) return null;

  const { reviews, avgRating, totalRatings, distribution, totalPages } = data;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        Reviews & Ratings
      </h2>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
        <div className="flex items-start gap-6">
          {/* Big rating */}
          <div className="text-center flex-shrink-0">
            <p className="text-4xl font-black text-gray-900">{avgRating}</p>
            <div className="flex items-center gap-0.5 justify-center my-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">{totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {(distribution || []).map((d: any) => (
              <div key={d.rating} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4 text-right">{d.rating}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: totalRatings > 0 ? `${(d.count / totalRatings) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {reviews.map((r: any) => {
          const images: string[] = (() => { try { return JSON.parse(r.images || '[]'); } catch { return []; } })();
          return (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  {r.customer?.avatar ? (
                    <Image src={r.customer.avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.customer?.name || 'Traveler'}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {r.isVerified && <span className="text-emerald-500 ml-1.5">Verified</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>

              {r.title && <p className="font-semibold text-gray-800 text-sm mb-1">{r.title}</p>}
              {r.review && <p className="text-sm text-gray-600 leading-relaxed">{r.review}</p>}

              {images.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {images.map((img: string, i: number) => (
                    <Image key={i} src={img} alt="" width={64} height={64} className="rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              )}

              {r.vendorReply && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                  <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider mb-1">Vendor Reply</p>
                  <p className="text-sm text-indigo-800">{r.vendorReply}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {page < totalPages && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-5 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition font-medium"
          >
            <ChevronDown className="w-4 h-4" /> Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
}
