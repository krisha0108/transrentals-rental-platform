// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Star, Eye, EyeOff, MessageSquare, Loader2, Check, RefreshCw,
  ThumbsUp, BarChart2, Award,
} from 'lucide-react';

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? 'fill-emerald-400 text-emerald-400' : 'fill-gray-100 text-gray-200'}`} />
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

const TABS = [
  { key: 'all',    label: 'All Reviews' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'HIDDEN', label: 'Hidden' },
];

export default function VendorWanderReviewsPage() {
  const [reviews, setReviews]               = useState<any[]>([]);
  const [total, setTotal]                   = useState(0);
  const [loading, setLoading]               = useState(true);
  const [tab, setTab]                       = useState('all');
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [replyOpen, setReplyOpen]           = useState<Record<string, boolean>>({});
  const [replyText, setReplyText]           = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<string | null>(null);
  const [replySuccess, setReplySuccess]     = useState<Record<string, boolean>>({});

  const fetchReviews = async (status: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/vendor/wander/reviews?page=1&limit=50&status=${status}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(tab); }, [tab]);

  const handleAction = async (reviewId: string, action: 'hide' | 'show') => {
    setActionLoading(reviewId + '_' + action);
    try {
      const res = await fetch(`/api/vendor/wander/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await fetchReviews(tab);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply) return;
    setReplySubmitting(reviewId);
    try {
      const res = await fetch(`/api/vendor/wander/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', reply }),
      });
      if (res.ok) {
        setReplySuccess(prev => ({ ...prev, [reviewId]: true }));
        setReplyOpen(prev => ({ ...prev, [reviewId]: false }));
        setReplyText(prev => ({ ...prev, [reviewId]: '' }));
        await fetchReviews(tab);
      }
    } finally {
      setReplySubmitting(null);
    }
  };

  const avgRating    = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const activeCount  = reviews.filter(r => r.status === 'ACTIVE').length;
  const hiddenCount  = reviews.filter(r => r.status === 'HIDDEN').length;
  const repliedCount = reviews.filter(r => r.vendorReply).length;

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count:  reviews.filter(rv => rv.rating === r).length,
  }));

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-screen">

      {/* ── Dark Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" /> Wander Tours
              </span>
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">Tour Reviews</h1>
            <p className="text-emerald-100/70 text-sm">Manage customer feedback and respond to reviews</p>
          </div>
          <button
            onClick={() => fetchReviews(tab)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition text-sm font-medium flex-shrink-0 mt-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reviews',  value: total,          icon: MessageSquare, iconBg: 'bg-white/10',        iconColor: 'text-emerald-200',   valColor: 'text-white' },
            { label: 'Avg Rating',     value: avgRating || '—', icon: Star,        iconBg: 'bg-emerald-500/20',    iconColor: 'text-emerald-400',   valColor: 'text-emerald-300' },
            { label: 'Active',         value: activeCount,    icon: Eye,           iconBg: 'bg-white/15',    iconColor: 'text-emerald-200',   valColor: 'text-emerald-200' },
            { label: 'Replied',        value: repliedCount,   icon: ThumbsUp,      iconBg: 'bg-teal-500/20',     iconColor: 'text-teal-400',    valColor: 'text-teal-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{m.label}</p>
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${m.valColor} leading-none`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Toolbar ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 sticky top-[57px] z-20 shadow-sm">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-44 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-400 font-medium">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-emerald-200" />
            </div>
            <p className="font-bold text-gray-800 mb-1 text-base">No reviews yet</p>
            <p className="text-sm text-gray-400">Reviews from completed tours will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review: any) => {
                const isHidden    = review.status === 'HIDDEN';
                const isReplyOpen = replyOpen[review.id];
                const hasReply    = !!review.vendorReply;

                return (
                  <div
                    key={review.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                      isHidden ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:shadow-md'
                    }`}
                  >
                    {/* Top rating color bar */}
                    <div className={`h-1 ${
                      review.rating >= 4 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                      review.rating === 3 ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-black text-base shadow-sm">
                          {review.customer?.name?.[0]?.toUpperCase() || 'C'}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="font-bold text-gray-900 text-sm">{review.customer?.name || 'Customer'}</span>
                                <span className="text-[11px] text-gray-400">{fmt(review.createdAt)}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isHidden
                                    ? 'bg-gray-50 text-gray-500 border-gray-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isHidden ? 'Hidden' : 'Active'}
                                </span>
                                {review.isVerified && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> Verified
                                  </span>
                                )}
                              </div>
                              {review.listing?.title && (
                                <p className="text-[11px] text-emerald-500 font-medium">📍 {review.listing.title}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!isHidden ? (
                                <button
                                  onClick={() => handleAction(review.id, 'hide')}
                                  disabled={actionLoading === review.id + '_hide'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition disabled:opacity-50"
                                >
                                  {actionLoading === review.id + '_hide'
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <EyeOff className="w-3 h-3" />}
                                  Hide
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(review.id, 'show')}
                                  disabled={actionLoading === review.id + '_show'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-xl transition disabled:opacity-50"
                                >
                                  {actionLoading === review.id + '_show'
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Eye className="w-3 h-3" />}
                                  Show
                                </button>
                              )}
                              <button
                                onClick={() => setReplyOpen(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition ${
                                  isReplyOpen
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-emerald-600'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                {hasReply ? 'Edit Reply' : 'Reply'}
                              </button>
                            </div>
                          </div>

                          {/* Stars + score */}
                          <div className="flex items-center gap-2 mb-2.5">
                            <StarRow rating={review.rating} />
                            <span className="text-sm font-black text-gray-700">{review.rating}/5</span>
                          </div>

                          {review.title && (
                            <p className="font-bold text-gray-900 text-sm mb-1">{review.title}</p>
                          )}
                          {review.review && (
                            <p className="text-sm text-gray-600 leading-relaxed">{review.review}</p>
                          )}

                          {/* Existing reply */}
                          {hasReply && (
                            <div className="mt-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                              <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Your Reply
                                {review.vendorRepliedAt && (
                                  <span className="ml-1 font-normal normal-case text-emerald-400">· {fmt(review.vendorRepliedAt)}</span>
                                )}
                              </p>
                              <p className="text-sm text-emerald-800 leading-relaxed">{review.vendorReply}</p>
                            </div>
                          )}

                          {/* Reply input */}
                          {isReplyOpen && (
                            <div className="mt-4 space-y-2">
                              <textarea
                                value={replyText[review.id] || ''}
                                onChange={e => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                                placeholder={hasReply ? 'Update your reply...' : 'Write a professional reply...'}
                                rows={3}
                                className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50/50 resize-none bg-emerald-50/30 transition"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => setReplyOpen(prev => ({ ...prev, [review.id]: false }))}
                                  className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReplySubmit(review.id)}
                                  disabled={replySubmitting === review.id || !replyText[review.id]?.trim()}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-600 disabled:bg-gray-200 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                >
                                  {replySubmitting === review.id
                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                                    : <><Check className="w-3 h-3" /> {hasReply ? 'Update Reply' : 'Submit Reply'}</>
                                  }
                                </button>
                              </div>
                            </div>
                          )}

                          {replySuccess[review.id] && !isReplyOpen && (
                            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                              <Check className="w-3 h-3" /> Reply saved successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar: Rating Summary */}
            <div className="space-y-4 lg:sticky lg:top-[120px]">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 mb-5">
                  <Award className="w-4 h-4 text-emerald-500" /> Rating Summary
                </h3>

                {/* Big avg rating */}
                <div className="flex flex-col items-center py-4 mb-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-5xl font-black text-emerald-500 leading-none">{avgRating || '—'}</p>
                  <div className="mt-2">
                    <StarRow rating={Math.round(Number(avgRating) || 0)} size="lg" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">{total} review{total !== 1 ? 's' : ''}</p>
                </div>

                {/* Distribution bars */}
                <div className="space-y-2.5">
                  {dist.map(d => (
                    <RatingBar key={d.rating} rating={d.rating} count={d.count} total={reviews.length} />
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                  <div className="bg-emerald-50 rounded-xl py-3">
                    <p className="text-xl font-black text-emerald-700">{activeCount}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mt-0.5">Active</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl py-3">
                    <p className="text-xl font-black text-emerald-700">{repliedCount}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mt-0.5">Replied</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
