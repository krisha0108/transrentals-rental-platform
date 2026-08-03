// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Loader2, ChevronDown, User, BadgeCheck } from 'lucide-react';

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
      <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
    </div>
  );

  if (!data || data.totalRatings === 0) return null;

  const { reviews, avgRating, totalRatings, distribution, totalPages } = data;

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl sm:text-3xl font-light text-slate-900 tracking-tight mb-6">
        Real trips, real words.
      </h2>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-6">
          {/* Big rating */}
          <div className="text-center flex-shrink-0">
            <p className="text-3xl font-black text-gray-900">{avgRating}</p>
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

    </div>
  );
}
