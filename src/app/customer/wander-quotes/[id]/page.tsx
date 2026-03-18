// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Compass, MapPin, Clock, Users, Calendar, Star,
  Loader2, AlertCircle, CheckCircle, Phone,
  MessageSquare, ChevronRight, Building2, Send,
  ArrowLeft, Info, Check, X, ChevronLeft,
  TrendingUp, TrendingDown, Minus, Hourglass,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';
import WanderChat from '@/components/wander/WanderChat';

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseList(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (typeof parsed === 'string') return [parsed];
  } catch {}
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-amber-100 text-amber-700 border border-amber-200' },
  QUOTED:    { label: 'Quoted',    pill: 'bg-blue-100 text-blue-700 border border-blue-200' },
  ACCEPTED:  { label: 'Accepted',  pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  CANCELLED: { label: 'Cancelled', pill: 'bg-red-100 text-red-600 border border-red-200' },
  EXPIRED:   { label: 'Expired',   pill: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const QUOTE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Awaiting',  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ACCEPTED:  { label: 'Accepted',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-50 text-red-600 border border-red-200' },
  EXPIRED:   { label: 'Expired',   color: 'bg-gray-50 text-gray-500 border border-gray-200' },
};

export default function CustomerWanderQuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [confirmQuote, setConfirmQuote] = useState<any>(null);
  const [wanderBooking, setWanderBooking] = useState<any>(null); // booking created after accept

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) { router.push('/customer/login'); return; }
    fetch(`/api/customer/wander-quote-requests/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          if (d.booking) setWanderBooking(d.booking);
        }
      })
      .catch(() => setError('Failed to load details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async (quoteId: string) => {
    setConfirmQuote(null);
    setAccepting(quoteId);
    try {
      const res = await fetch(`/api/customer/wander-quote-requests/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      // Store the created booking (has advanceAmount if payment needed)
      if (d.booking) setWanderBooking(d.booking);
      const refresh = await fetch(`/api/customer/wander-quote-requests/${id}`);
      const refreshed = await refresh.json();
      if (!refreshed.error) setData(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to accept quote');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error || 'Request not found'}</p>
        <Link href="/customer/dashboard" className="text-indigo-600 hover:underline text-sm font-medium">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const images: string[] = (() => { try { return JSON.parse(data.listing?.images || '[]'); } catch { return []; } })();
  const sc = STATUS_CONFIG[data.status] || STATUS_CONFIG.PENDING;
  const isAccepted = data.status === 'ACCEPTED';
  const quoteCount = data.quotes?.length || 0;
  const clampedIdx = Math.min(slideIdx, Math.max(0, images.length - 1));
  const prev = () => setSlideIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setSlideIdx(i => (i + 1) % images.length);

  const listing = data.listing;
  const hasAdvance = listing?.requireAdvancePayment && listing?.advancePaymentValue;
  function calcAdvance(quoteAmount: number): number | null {
    if (!hasAdvance) return null;
    return listing.advancePaymentType === 'PERCENTAGE'
      ? Math.round((quoteAmount * listing.advancePaymentValue) / 100)
      : listing.advancePaymentValue;
  }

  // Returns { listedPP, quotedPP, diff, pct } for per-person comparison
  function getPriceDiff(quote: any): { listedPP: number; quotedPP: number; diff: number; pct: number } | null {
    if (!listing?.basePrice) return null;
    const priceType = listing.priceType || 'PER_PERSON';
    const groupSize = data.groupSize || 1;

    let listedPP = 0;
    if (priceType === 'PER_PERSON') {
      listedPP = Number(listing.basePrice);
    } else {
      // GROUP_BASED — find matching tier
      try {
        const tiers: any[] = JSON.parse(listing.priceTiers || '[]');
        const sorted = tiers.filter(t => Number(t.groupSize || t.persons || t.maxPeople) >= groupSize)
          .sort((a, b) => Number(a.groupSize || a.persons || a.maxPeople) - Number(b.groupSize || b.persons || b.maxPeople));
        const tier = sorted[0] || tiers[tiers.length - 1];
        if (tier?.price) listedPP = Number(tier.price) / groupSize;
      } catch {}
    }
    if (!listedPP) return null;

    const quotedPP = quote.perPersonAmount
      ? Number(quote.perPersonAmount)
      : Number(quote.amount) / groupSize;

    const diff = Math.round(quotedPP - listedPP);
    const pct = listedPP > 0 ? Math.round((diff / listedPP) * 100) : 0;
    return { listedPP: Math.round(listedPP), quotedPP: Math.round(quotedPP), diff, pct };
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO — full-width image slider ════════════════════════════════════ */}
      <div className="relative bg-[#0a0f1e]">

        {/* Slider */}
        <div className="relative w-full h-[55vh] min-h-[320px] max-h-[540px] overflow-hidden">
          {images.length > 0 ? (
            <>
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === clampedIdx ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              {/* dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/30 to-transparent" />

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition z-10">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition z-10">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        className={`rounded-full transition-all ${i === clampedIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>

                  {/* counter */}
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white/80 text-xs px-2.5 py-1 rounded-full z-10">
                    {clampedIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            /* no images — dark bg with icon */
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-30">{data.listing?.category?.icon || '🗺️'}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent" />
            </>
          )}

          {/* Back button overlaid top-left */}
          <div className="absolute top-4 left-4 z-10">
            <Link href="/customer/dashboard" className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* Thumbnail strip (only if 2+ images) */}
        {images.length > 1 && (
          <div className="flex gap-2 px-6 lg:px-10 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition ${i === clampedIdx ? 'border-indigo-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Tour info block (below slider, still on dark bg) */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-5 pb-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              {data.listing?.category && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold mb-2">
                  {data.listing.category.icon} {data.listing.category.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                {data.listing?.title}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/50">
                {data.listing?.mainLocation?.name && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400" />{data.listing.mainLocation.name}</span>
                )}
                {data.listing?.duration && (
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" />{data.listing.duration}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 pt-1">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${sc.pill}`}>{sc.label}</span>
              <span className="text-white/30 text-xs font-mono">{data.requestId}</span>
              <span className="text-xs text-white/30">Submitted {fmt(data.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY — two-column grid ════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Payment UI — advance payment pending */}
            {isAccepted && wanderBooking?.advanceAmount && wanderBooking?.status === 'PAYMENT_PENDING' && (
              <div>
                <div className="mb-3">
                  <p className="text-sm font-bold text-gray-900">Complete Your Booking</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pay ₹{Number(wanderBooking.advanceAmount).toLocaleString('en-IN')} advance to confirm your tour.
                  </p>
                </div>
                <BookingPayment
                  bookingId={wanderBooking.id}
                  bookingType="wander_quote"
                  amount={wanderBooking.advanceAmount}
                  bookingNumber={wanderBooking.bookingId}
                  serviceSlug="wander"
                  onSuccess={() => {
                    setWanderBooking((b: any) => ({ ...b, status: 'PAYMENT_SUBMITTED' }));
                  }}
                />
              </div>
            )}

            {/* Payment Under Review banner — manual payment submitted, awaiting admin */}
            {isAccepted && wanderBooking?.status === 'PAYMENT_SUBMITTED' && (
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Hourglass className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-base">Payment Under Review</p>
                    <p className="text-amber-100 text-xs">Awaiting admin verification</p>
                  </div>
                </div>
                <p className="text-sm text-amber-50 leading-relaxed mt-2">
                  Your payment of ₹{Number(wanderBooking.advanceAmount).toLocaleString('en-IN')} has been submitted and is being verified. Your booking will be confirmed shortly.
                </p>
                {wanderBooking?.advancePaymentRef && (
                  <p className="text-xs text-amber-200 mt-2">Ref: {wanderBooking.advancePaymentRef}</p>
                )}
                {wanderBooking?.bookingId && (
                  <p className="text-xs text-amber-200 mt-1 font-mono">{wanderBooking.bookingId}</p>
                )}
              </div>
            )}

            {/* Confirmed banner */}
            {isAccepted && (!wanderBooking?.advanceAmount || wanderBooking?.status === 'CONFIRMED') && (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-base">Tour Confirmed!</p>
                    <p className="text-emerald-100 text-xs">
                      {wanderBooking?.transactionId || wanderBooking?.advancePaymentRef
                        ? 'Advance payment verified'
                        : 'Quote accepted successfully'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-emerald-50 leading-relaxed mt-2">
                  {wanderBooking?.advanceAmount
                    ? `Advance of ₹${Number(wanderBooking.advanceAmount).toLocaleString('en-IN')} confirmed. The vendor will contact you shortly.`
                    : 'The vendor will contact you shortly to confirm tour details and payment.'}
                </p>
                {wanderBooking?.bookingId && (
                  <p className="text-xs text-emerald-200 mt-2 font-mono">{wanderBooking.bookingId}</p>
                )}
              </div>
            )}

            {/* Write Review — only for COMPLETED bookings */}
            {wanderBooking?.status === 'COMPLETED' && (
              <ReviewCard bookingId={wanderBooking.id} customerId={data.customer?.id} />
            )}

            {/* Request details card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-gray-900 text-sm">Your Request</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Travel Date</span>
                  <span className="font-bold text-gray-800 text-sm text-right">{fmt(data.travelDate)}</span>
                </div>
                <div className="border-t border-gray-50" />
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Group Size</span>
                  <span className="font-bold text-gray-800 text-sm flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {data.groupSize} person{data.groupSize !== 1 ? 's' : ''}
                  </span>
                </div>
                {data.pickupLocation && (
                  <>
                    <div className="border-t border-gray-50" />
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Pickup</span>
                      <span className="font-semibold text-gray-800 text-sm text-right flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        {data.pickupLocation}
                      </span>
                    </div>
                  </>
                )}
                {data.requirements && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mt-1">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1">Special Requirements</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{data.requirements}</p>
                  </div>
                )}
              </div>
            </div>

            {/* View tour page link */}
            <Link
              href={`/wander/${data.listing?.slug || data.listing?.id}`}
              className="flex items-center justify-between px-4 py-4 bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition shadow-sm group"
            >
              <span className="text-sm text-indigo-600 font-semibold flex items-center gap-2 group-hover:text-indigo-700">
                <Compass className="w-4 h-4" /> View Full Tour Page
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition" />
            </Link>

            {/* Chat with vendor */}
            {(() => {
              const acceptedQuote = data.quotes?.find((q: any) => q.status === 'ACCEPTED');
              if (!acceptedQuote || !data.customer?.id) return null;
              return (
                <WanderChat
                  vendorId={acceptedQuote.vendor?.id || data.listing?.vendor?.id}
                  customerId={data.customer.id}
                  senderType="customer"
                  senderId={data.customer.id}
                  senderName={data.customer.name || 'Customer'}
                  otherName={acceptedQuote.vendor?.businessName || 'Vendor'}
                  bookingType="wander_quote"
                  bookingId={wanderBooking?.id || (id as string)}
                  quoteId={acceptedQuote.id}
                />
              );
            })()}

            {/* Quote count summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Quote Summary</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-gray-900">{quoteCount}</span>
                <span className="text-sm text-gray-400 mb-1">quote{quoteCount !== 1 ? 's' : ''} received</span>
              </div>
              {quoteCount > 0 && !isAccepted && (
                <p className="text-xs text-indigo-500 mt-2">Compare and accept the best one ↓</p>
              )}
            </div>
          </div>

          {/* ── RIGHT — QUOTES ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-gray-900 text-base">
                {quoteCount === 0 ? 'Vendor Quotes' : `${quoteCount} Quote${quoteCount !== 1 ? 's' : ''} Received`}
              </h2>
            </div>

            {quoteCount === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-indigo-300" />
                </div>
                <p className="font-bold text-gray-700 mb-2">Waiting for quotes</p>
                <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Tour operators are reviewing your request. You'll see their quotes here once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {data.quotes.map((quote: any) => {
                  const qs = QUOTE_STATUS[quote.status] || QUOTE_STATUS.PENDING;
                  const isThisAccepted = quote.status === 'ACCEPTED';
                  const isRejected = quote.status === 'REJECTED';
                  const canAccept = !isAccepted && !isRejected && !isThisAccepted;
                  const inclusions = parseList(quote.customInclusions);
                  const exclusions = parseList(quote.customExclusions);

                  return (
                    <div
                      key={quote.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-shadow ${
                        isThisAccepted ? 'border-emerald-300 shadow-emerald-100/60'
                        : isRejected ? 'border-gray-100 opacity-55'
                        : 'border-gray-100 hover:shadow-md'
                      }`}
                    >
                      {isThisAccepted && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span className="text-white text-xs font-bold">You accepted this quote</span>
                        </div>
                      )}

                      <div className="p-6">
                        {/* Vendor + status row */}
                        <div className="flex items-center justify-between gap-4 mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{quote.vendor?.businessName || 'Tour Operator'}</p>
                              {quote.vendor?.phone && (
                                <a href={`tel:${quote.vendor.phone}`} className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" /> {quote.vendor.phone}
                                </a>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${qs.color}`}>{qs.label}</span>
                        </div>

                        {/* Price + inclusions/exclusions side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-5">
                          {/* Price */}
                          <div className={`sm:col-span-2 rounded-2xl p-4 ${isThisAccepted ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'}`}>
                            <p className="text-xs text-gray-400 mb-1">Total Quoted Price</p>
                            <p className={`text-3xl font-black ${isThisAccepted ? 'text-emerald-700' : 'text-indigo-700'}`}>
                              ₹{Number(quote.amount).toLocaleString('en-IN')}
                            </p>
                            {quote.perPersonAmount && (
                              <p className="text-xs text-gray-400 mt-2">
                                ₹{Number(quote.perPersonAmount).toLocaleString('en-IN')} / person × {data.groupSize}
                              </p>
                            )}

                            {/* Price comparison vs listing */}
                            {(() => {
                              const pd = getPriceDiff(quote);
                              if (!pd) return null;
                              const isHigher = pd.diff > 0;
                              const isLower = pd.diff < 0;
                              const isSame = pd.diff === 0;
                              return (
                                <div className={`mt-3 rounded-xl p-3 border ${
                                  isHigher ? 'bg-red-50 border-red-100' :
                                  isLower  ? 'bg-emerald-50 border-emerald-100' :
                                             'bg-gray-50 border-gray-100'
                                }`}>
                                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1 text-gray-400">
                                    vs. Tour Listed Price
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-400 leading-tight">Listed</p>
                                      <p className="text-sm font-bold text-gray-600">₹{pd.listedPP.toLocaleString('en-IN')}<span className="text-xs font-normal">/person</span></p>
                                    </div>
                                    <div className={`flex flex-col items-center px-2 ${
                                      isHigher ? 'text-red-500' : isLower ? 'text-emerald-600' : 'text-gray-400'
                                    }`}>
                                      {isHigher ? <TrendingUp className="w-4 h-4" /> : isLower ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                      <span className="text-[10px] font-bold">
                                        {isSame ? 'Same' : `${isHigher ? '+' : ''}${pd.pct}%`}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-400 leading-tight">Quoted</p>
                                      <p className={`text-sm font-bold ${isHigher ? 'text-red-600' : isLower ? 'text-emerald-600' : 'text-gray-600'}`}>
                                        ₹{pd.quotedPP.toLocaleString('en-IN')}<span className="text-xs font-normal">/person</span>
                                      </p>
                                    </div>
                                  </div>
                                  {!isSame && (
                                    <p className={`text-[10px] font-semibold mt-1.5 text-center ${isHigher ? 'text-red-500' : 'text-emerald-600'}`}>
                                      {isHigher
                                        ? `₹${Math.abs(pd.diff).toLocaleString('en-IN')} more per person than listed`
                                        : `₹${Math.abs(pd.diff).toLocaleString('en-IN')} less per person than listed`}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                            {/* Advance payment pill */}
                            {(() => {
                              const adv = calcAdvance(Number(quote.amount));
                              if (!adv) return null;
                              return (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold mb-0.5">
                                    ⚡ Advance Required
                                    {listing.advancePaymentType === 'PERCENTAGE' ? ` (${listing.advancePaymentValue}%)` : ''}
                                  </p>
                                  <p className="text-lg font-black text-amber-700">₹{adv.toLocaleString('en-IN')}</p>
                                  <p className="text-[10px] text-amber-400 mt-0.5">
                                    Balance ₹{(Number(quote.amount) - adv).toLocaleString('en-IN')} on trip day
                                  </p>
                                </div>
                              );
                            })()}
                            <div className="mt-3 text-xs text-gray-400">
                              <span>Received {fmt(quote.createdAt)}</span>
                              {quote.validUntil && (
                                <span className="block text-amber-600 font-medium mt-0.5">Valid until {fmt(quote.validUntil)}</span>
                              )}
                            </div>
                          </div>

                          {/* Includes / Excludes */}
                          {(inclusions.length > 0 || exclusions.length > 0) ? (
                            <div className="sm:col-span-3 grid grid-cols-2 gap-3">
                              {inclusions.length > 0 && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Includes</p>
                                  <ul className="space-y-1.5">
                                    {inclusions.map((item, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-800">
                                        <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {exclusions.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Excludes</p>
                                  <ul className="space-y-1.5">
                                    {exclusions.map((item, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                                        <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="sm:col-span-3 flex items-center justify-center text-gray-300 text-sm">
                              No inclusions / exclusions listed
                            </div>
                          )}
                        </div>

                        {/* Vendor note */}
                        {quote.notes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                            <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1">
                              <Info className="w-3 h-3" /> Note from Vendor
                            </p>
                            <p className="text-sm text-amber-800 leading-relaxed">{quote.notes}</p>
                          </div>
                        )}

                        {/* Accept button */}
                        {canAccept && (
                          <button
                            onClick={() => setConfirmQuote(quote)}
                            disabled={!!accepting}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                          >
                            {accepting === quote.id
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                              : <><CheckCircle className="w-4 h-4" /> Accept This Quote</>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pb-12" />
      </div>

      {/* ══ CONFIRM MODAL ════════════════════════════════════════════════════ */}
      {confirmQuote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmQuote(null)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="p-6">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-indigo-600" />
              </div>

              <h2 className="text-xl font-black text-gray-900 text-center mb-1">Accept this quote?</h2>
              <p className="text-sm text-gray-400 text-center mb-5 leading-relaxed">
                This will confirm the quote from <span className="font-semibold text-gray-700">{confirmQuote.vendor?.businessName || 'this vendor'}</span>. All other quotes will be declined.
              </p>

              {/* Quote summary card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Total Quoted Price</span>
                  <span className="text-xs text-gray-500 font-medium">{confirmQuote.vendor?.businessName}</span>
                </div>
                <p className="text-3xl font-black text-indigo-700">
                  ₹{Number(confirmQuote.amount).toLocaleString('en-IN')}
                </p>
                {confirmQuote.perPersonAmount && (
                  <p className="text-xs text-gray-400 mt-1">
                    ₹{Number(confirmQuote.perPersonAmount).toLocaleString('en-IN')} per person
                  </p>
                )}
              </div>

              {/* Advance payment breakdown */}
              {(() => {
                const adv = calcAdvance(Number(confirmQuote.amount));
                if (!adv) return null;
                const balance = Number(confirmQuote.amount) - adv;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      ⚡ Advance Payment Required
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-700">
                          Pay now
                          {listing.advancePaymentType === 'PERCENTAGE' ? ` (${listing.advancePaymentValue}%)` : ''}
                        </span>
                        <span className="text-xl font-black text-amber-700">₹{adv.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-amber-100 pt-2">
                        <span>Balance due on trip day</span>
                        <span className="font-semibold text-gray-600">₹{balance.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmQuote(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAccept(confirmQuote.id)}
                  disabled={!!accepting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {accepting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                    : <><CheckCircle className="w-4 h-4" /> Yes, Accept</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Review Card ─── */
function ReviewCard({ bookingId, customerId }: { bookingId: string; customerId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/wander/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, customerId, rating, title: title.trim(), review: review.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setSubmitted(true);
    } catch { setError('Failed to submit'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center">
        <Star className="w-8 h-8 text-amber-400 fill-amber-400 mx-auto mb-2" />
        <p className="font-bold text-gray-900 text-sm">Thank you for your review!</p>
        <p className="text-xs text-gray-500 mt-1">Your feedback helps other travelers</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400" />
        <h3 className="font-bold text-gray-900 text-sm">Rate Your Experience</h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Stars */}
        <div className="flex items-center gap-1 justify-center">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`w-8 h-8 transition-colors ${
                s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
              }`} />
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Review title (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting || !rating}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit Review
        </button>
      </div>
    </div>
  );
}
