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
  Smartphone, Copy, CreditCard, Banknote, Plus,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BookingPayment } from '@/components/payment/BookingPayment';
import WanderChat from '@/components/wander/WanderChat';
import TravelAgentChat from '@/components/travel-agent/chat/TravelAgentChat';
import { quoteDisplay } from '@/lib/quote-font';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import QuotePaymentSafetyNotice from '@/components/customer/QuotePaymentSafetyNotice';

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
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />

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
              <h1 className="quote-serif text-[30px] md:text-[40px] font-medium text-white leading-[1.05] mb-2">
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

      {/* ══ TOUR DETAILS — description / highlights / itinerary / terms ═════ */}
      {(listing?.description ||
        listing?.itinerary ||
        listing?.termsConditions ||
        (listing?.tourHighlights && listing.tourHighlights.length > 0) ||
        (listing?.tourInclusions && listing.tourInclusions.length > 0) ||
        (listing?.tourExclusions && listing.tourExclusions.length > 0)) && (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
          <TourDetailsSection listing={listing} />
        </div>
      )}

      {/* ══ BODY — two-column grid ════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* B2B Company Booking — invoice awaited banner */}
            {isAccepted && wanderBooking?.isB2BBooking && wanderBooking?.status === 'CONFIRMED' && !wanderBooking?.invoiceSent && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-base">B2B Company Booking</p>
                    <p className="text-blue-100 text-xs">Invoice after trip completion</p>
                  </div>
                </div>
                <p className="text-sm text-blue-50 leading-relaxed mt-2">
                  No advance payment required. The vendor will send an invoice after your tour is completed.
                </p>
                {wanderBooking?.companyName && (
                  <p className="text-xs text-blue-200 mt-2">Company: <span className="font-semibold text-white">{wanderBooking.companyName}</span></p>
                )}
                {wanderBooking?.bookingId && (
                  <p className="text-xs text-blue-200 mt-1 font-mono">{wanderBooking.bookingId}</p>
                )}
              </div>
            )}

            {/* B2B Invoice Sent banner */}
            {isAccepted && wanderBooking?.isB2BBooking && wanderBooking?.invoiceSent && (
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-base">Invoice Received</p>
                    <p className="text-amber-100 text-xs">Please process payment</p>
                  </div>
                </div>
                <p className="text-sm text-amber-50 leading-relaxed mt-2">
                  Your vendor has sent an invoice of <span className="font-bold">₹{Number(wanderBooking.amount).toLocaleString('en-IN')}</span>. Please process the payment to complete the booking.
                </p>
                {wanderBooking?.invoiceNotes && (
                  <p className="text-xs text-amber-200 mt-2">{wanderBooking.invoiceNotes}</p>
                )}
              </div>
            )}

            {/* Payment UI — advance payment pending (non-B2B only) */}
            {isAccepted && !wanderBooking?.isB2BBooking && wanderBooking?.advanceAmount && wanderBooking?.status === 'PAYMENT_PENDING' && (
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
                    // Refetch from server — Razorpay sets CONFIRMED, manual sets PAYMENT_SUBMITTED
                    fetch(`/api/customer/wander-quote-requests/${id}`)
                      .then(r => r.json())
                      .then(d => { if (d.booking) setWanderBooking(d.booking); })
                      .catch(() => setWanderBooking((b: any) => ({ ...b, status: 'PAYMENT_SUBMITTED' })));
                  }}
                />
              </div>
            )}

            {/* Payment Under Review banner — manual payment submitted, awaiting admin (non-B2B only) */}
            {isAccepted && !wanderBooking?.isB2BBooking && wanderBooking?.status === 'PAYMENT_SUBMITTED' && (
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

            {/* Confirmed banner (non-B2B only) — skipped for travel-agent leads (their card handles it) */}
            {isAccepted && !data.isTravelAgentLead && !wanderBooking?.isB2BBooking && (!wanderBooking?.advanceAmount || wanderBooking?.status === 'CONFIRMED') && (
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

            {/* Travel-agent payment flow — only after the customer accepts */}
            {data.isTravelAgentLead && data.customerAcceptedAt && data.quotes?.[0] && (() => {
              const q = data.quotes[0];
              const adv = calcAdvance(Number(q.amount));
              const amountDue = adv ?? Number(q.amount);
              const pStatus = data.payment?.status || 'PENDING';

              // Verified — done
              if (pStatus === 'VERIFIED') {
                return (
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-base">Payment Confirmed!</p>
                        <p className="text-emerald-100 text-xs">Booking is confirmed</p>
                      </div>
                    </div>
                    <p className="text-sm text-emerald-50 leading-relaxed mt-2">
                      Advance of ₹{amountDue.toLocaleString('en-IN')} verified. The agent will contact you shortly with trip details.
                    </p>
                    {data.payment?.txnId && (
                      <p className="text-[11px] text-emerald-100 mt-2 font-mono">Txn: {data.payment.txnId}</p>
                    )}
                  </div>
                );
              }

              // Submitted — under review
              if (pStatus === 'SUBMITTED') {
                return (
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Hourglass className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-base">Payment Under Review</p>
                        <p className="text-amber-100 text-xs">Agent is verifying your payment</p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-50 leading-relaxed mt-2">
                      Advance of ₹{amountDue.toLocaleString('en-IN')} submitted. You'll be notified once the agent confirms.
                    </p>
                    <div className="mt-3 bg-white/10 rounded-xl p-3 space-y-1 text-xs">
                      {data.payment.txnId ? (
                        <p><span className="text-amber-100">Txn ID:</span> <span className="font-mono font-semibold">{data.payment.txnId}</span></p>
                      ) : (
                        <p className="text-amber-100">Submitted via screenshot</p>
                      )}
                      {data.payment.note && <p><span className="text-amber-100">Note:</span> {data.payment.note}</p>}
                      {data.payment.images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {data.payment.images.map((src: string, i: number) => (
                            <a key={i} href={src} target="_blank" rel="noreferrer">
                              <img src={src} className="w-12 h-12 rounded-lg object-cover border-2 border-white/40" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {data.payment.rejectReason && (
                      <p className="text-xs text-amber-100 mt-2">
                        Note from agent: {data.payment.rejectReason}
                      </p>
                    )}
                  </div>
                );
              }

              // Pending — payment needed
              return (
                <>
                  {data.agentPaymentMethod && (
                    <UpiPaymentCard
                      upiId={data.agentPaymentMethod.upiId}
                      payeeName={data.agentPaymentMethod.payeeName}
                      amount={amountDue}
                      reference={`Advance-${data.requestId || data.id}`}
                      bank={data.agentPaymentMethod.bank}
                    />
                  )}
                  <PaymentProofForm
                    leadId={data.id}
                    expectedAmount={amountDue}
                    rejectReason={data.payment?.rejectReason}
                    onSubmitted={async () => {
                      const res = await fetch(`/api/customer/wander-quote-requests/${data.id}`);
                      if (res.ok) {
                        const fresh = await res.json();
                        setData(fresh);
                      }
                    }}
                  />
                </>
              );
            })()}

            {/* Request details card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="quote-serif font-medium text-gray-900 text-[18px]">Your Request</h3>
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

            {/* Travel-agent leads → use the dedicated travel-agent chat
                (different table + auth model). The customer authenticates
                here via their phone, which the API matches against
                conv.customerPhone. */}
            {(data.isTravelAgentLead || data.source === 'TRAVEL_AGENT') &&
              data.travelAgentId &&
              data.customer?.phone && (
                <TravelAgentChat
                  senderType="customer"
                  senderName={data.customer.name || 'Customer'}
                  customerPhone={data.customer.phone}
                  travelAgentId={data.travelAgentId}
                  customerName={data.customer.name || 'Customer'}
                  customerEmail={data.customer.email || undefined}
                  leadId={data.id}
                  subject={data.listing?.title || 'Travel Enquiry'}
                  title={data.listing?.vendor?.businessName || 'Travel Agent'}
                  description="Direct message your agent"
                  heightClass="h-96"
                />
              )}

            {/* Chat with vendor — vendor-wander quotes only. Travel-agent
                leads use a separate chat system (travel_agent_chat_conversations)
                and would fail the vendors FK here. */}
            {(() => {
              if (data.isTravelAgentLead || data.source === 'TRAVEL_AGENT') return null;
              const acceptedQuote = data.quotes?.find((q: any) => q.status === 'ACCEPTED');
              if (!acceptedQuote || !data.customer?.id) return null;
              // Once a booking exists, match the vendor's chat key exactly
              // (bookingType='wander_booking', bookingId=booking.id) so both
              // sides share one conversation instead of creating siblings.
              const hasBooking = !!wanderBooking?.id;
              return (
                <WanderChat
                  vendorId={acceptedQuote.vendor?.id || data.listing?.vendor?.id}
                  customerId={data.customer.id}
                  senderType="customer"
                  senderId={data.customer.id}
                  senderName={data.customer.name || 'Customer'}
                  otherName={acceptedQuote.vendor?.businessName || 'Vendor'}
                  bookingType={hasBooking ? 'wander_booking' : 'wander_quote'}
                  bookingId={hasBooking ? wanderBooking.id : (id as string)}
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
              <h2 className="quote-serif font-medium text-gray-900 text-[24px]">
                {quoteCount === 0 ? 'Vendor Quotes' : `${quoteCount} Quote${quoteCount !== 1 ? 's' : ''} Received`}
              </h2>
            </div>

            {/* Payment safety notice — stays visible whether quotes are
                still pending or have already arrived */}
            <div className="mb-5">
              <QuotePaymentSafetyNotice />
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
                            <p className={`quote-serif text-[38px] font-medium ${isThisAccepted ? 'text-emerald-700' : 'text-indigo-700'}`}>
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
                            {/* Payment breakdown */}
                            {(() => {
                              const adv = calcAdvance(Number(quote.amount));
                              if (!adv) return null;
                              const total = Number(quote.amount);
                              const balance = total - adv;
                              const advPct = total > 0 ? Math.round((adv / total) * 100) : 0;
                              return (
                                <div className="mt-3 bg-white border-2 border-amber-200 rounded-2xl p-3.5 shadow-sm">
                                  <div className="flex items-center justify-between mb-2.5">
                                    <p className="text-[10px] text-amber-600 uppercase tracking-wider font-bold flex items-center gap-1">
                                      ⚡ Payment Plan
                                    </p>
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                      {listing.advancePaymentType === 'PERCENTAGE'
                                        ? `${listing.advancePaymentValue}% advance`
                                        : 'Fixed advance'}
                                    </span>
                                  </div>
                                  {/* Visual split bar */}
                                  <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-gray-100">
                                    <div
                                      className="bg-gradient-to-r from-amber-400 to-orange-500"
                                      style={{ width: `${advPct}%` }}
                                    />
                                    <div
                                      className="bg-gradient-to-r from-emerald-400 to-teal-500"
                                      style={{ width: `${100 - advPct}%` }}
                                    />
                                  </div>
                                  {/* Pay now */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Pay Now</p>
                                      </div>
                                      <p className="text-xl font-black text-amber-700 leading-tight">
                                        ₹{adv.toLocaleString('en-IN')}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">to confirm booking</p>
                                    </div>
                                    <div className="flex-1 text-right">
                                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Balance</p>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      </div>
                                      <p className="text-xl font-black text-emerald-700 leading-tight">
                                        ₹{balance.toLocaleString('en-IN')}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-0.5">on trip day</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="mt-3 text-xs text-gray-400">
                              <span>Received {fmt(quote.createdAt)}</span>
                              {quote.validUntil && (() => {
                                const expired = new Date(quote.validUntil) < new Date();
                                return (
                                  <span
                                    className={`block font-semibold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                                      expired
                                        ? 'bg-red-50 text-red-600 border-red-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {expired ? 'Expired' : `Valid till ${fmt(quote.validUntil)}`}
                                  </span>
                                );
                              })()}
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

              <h2 className="quote-serif text-[26px] font-medium text-gray-900 text-center mb-1">Accept this quote?</h2>
              <p className="text-sm text-gray-400 text-center mb-5 leading-relaxed">
                This will confirm the quote from <span className="font-semibold text-gray-700">{confirmQuote.vendor?.businessName || 'this vendor'}</span>. All other quotes will be declined.
              </p>

              {/* Quote summary card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Total Quoted Price</span>
                  <span className="text-xs text-gray-500 font-medium">{confirmQuote.vendor?.businessName}</span>
                </div>
                <p className="quote-serif text-[38px] font-medium text-indigo-700">
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
                const total = Number(confirmQuote.amount);
                const balance = total - adv;
                const advPct = total > 0 ? Math.round((adv / total) * 100) : 0;
                return (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                        ⚡ Payment Plan
                      </p>
                      <span className="text-[10px] font-bold text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded-full">
                        {listing.advancePaymentType === 'PERCENTAGE'
                          ? `${listing.advancePaymentValue}% advance`
                          : 'Fixed advance'}
                      </span>
                    </div>

                    {/* Visual split bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden mb-3.5 bg-white border border-amber-100">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-end pr-1"
                        style={{ width: `${advPct}%` }}
                      />
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-500"
                        style={{ width: `${100 - advPct}%` }}
                      />
                    </div>

                    {/* Two-column breakdown */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Pay Now</p>
                        </div>
                        <p className="text-2xl font-black text-amber-700 leading-tight">
                          ₹{adv.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {advPct}% to confirm
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Balance</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-700 leading-tight">
                          ₹{balance.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {100 - advPct}% on trip day
                        </p>
                      </div>
                    </div>

                    {/* Validity reminder */}
                    {confirmQuote.validUntil && (
                      <div className="text-[10px] text-amber-700 bg-white/60 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Quote valid till {fmt(confirmQuote.validUntil)}
                      </div>
                    )}
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

/* ─── Itinerary renderer ─── */
function ItineraryView({ raw }: { raw: string }) {
  let stops: any[] | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) stops = parsed;
  } catch {}

  if (!stops) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(raw) }} />;
  }

  const visible = stops.filter((s: any) => {
    const title = (s?.title || '').trim();
    const time = (s?.time || '').trim();
    const desc = (s?.description || '').toString().replace(/<[^>]*>/g, '').trim();
    const hasActivities = Array.isArray(s?.activities) && s.activities.filter(Boolean).length > 0;
    return !!(title || time || desc || hasActivities);
  });

  if (visible.length === 0) {
    return <p className="text-sm text-gray-500">Itinerary will be shared shortly.</p>;
  }

  const groups: Record<string, any[]> = {};
  visible.forEach((s: any) => {
    const key = s?.day ? `Day ${s.day}` : 'Day 1';
    (groups[key] ||= []).push(s);
  });

  return (
    <div className="space-y-6 not-prose">
      {Object.entries(groups).map(([dayLabel, dayStops]) => (
        <div key={dayLabel}>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
            {dayLabel}
          </p>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100" />
            <div className="space-y-0">
              {dayStops.map((stop: any, i: number) => (
                <div key={i} className="relative flex gap-4 pb-5">
                  <div className="w-10 h-10 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-lg">
                    {stop.emoji || (stop.type === 'break' ? '☕' : '📍')}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {stop.time && (
                        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                          {stop.time}
                        </span>
                      )}
                      {stop.timeSpent && (
                        <span className="text-xs text-gray-400">{stop.timeSpent}</span>
                      )}
                    </div>
                    {stop.title && (
                      <h3 className="font-bold text-gray-900 text-sm">{stop.title}</h3>
                    )}
                    {stop.description && (
                      <div
                        className="text-xs text-gray-500 mt-1 leading-relaxed prose prose-xs max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-strong:text-gray-900 prose-p:my-1 prose-headings:my-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichText(stop.description) }}
                      />
                    )}
                    {Array.isArray(stop.activities) && stop.activities.filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stop.activities.filter(Boolean).map((a: string, j: number) => (
                          <span key={j} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tour Details Section ─── */
function TourDetailsSection({ listing }: { listing: any }) {
  const [tab, setTab] = useState<'overview' | 'itinerary' | 'terms'>(
    listing?.description ? 'overview' : listing?.itinerary ? 'itinerary' : 'terms',
  );
  const highlights: string[] = listing?.tourHighlights || [];
  const inclusions: string[] = listing?.tourInclusions || [];
  const exclusions: string[] = listing?.tourExclusions || [];

  const tabs = [
    listing?.description && { key: 'overview', label: 'Overview' },
    listing?.itinerary && { key: 'itinerary', label: 'Itinerary' },
    listing?.termsConditions && { key: 'terms', label: 'Terms' },
  ].filter(Boolean) as { key: typeof tab; label: string }[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Compass className="w-4 h-4 text-indigo-500" />
        <h2 className="quote-serif font-medium text-gray-900 text-[24px]">Tour Details</h2>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="px-6 pt-5">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">
            ✨ Highlights
          </p>
          <div className="flex flex-wrap gap-2">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs (only if more than one tab to show) */}
      {tabs.length > 0 && (
        <>
          <div className="px-6 pt-5 flex gap-1 border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                  tab === t.key
                    ? 'border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-strong:text-gray-900 prose-a:text-emerald-700">
            {tab === 'overview' && listing?.description && (
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(listing.description) }} />
            )}
            {tab === 'itinerary' && listing?.itinerary && (
              <ItineraryView raw={listing.itinerary} />
            )}
            {tab === 'terms' && listing?.termsConditions && (
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(listing.termsConditions) }} />
            )}
          </div>
        </>
      )}

      {/* Inclusions / Exclusions */}
      {(inclusions.length > 0 || exclusions.length > 0) && (
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inclusions.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> What's Included
              </p>
              <ul className="space-y-1.5">
                {inclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exclusions.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Not Included
              </p>
              <ul className="space-y-1.5">
                {exclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                    <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Payment Proof Form ─── */
function PaymentProofForm({
  leadId,
  expectedAmount,
  rejectReason,
  onSubmitted,
}: {
  leadId: string;
  expectedAmount: number;
  rejectReason?: string | null;
  onSubmitted: () => void | Promise<void>;
}) {
  const [txnId, setTxnId] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const next = [...files, ...picked].slice(0, 5);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeAt = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const hasTxn = txnId.trim().length > 0;
  const hasFiles = files.length > 0;
  const canSubmit = hasTxn || hasFiles;

  const submit = async () => {
    setError('');
    if (!canSubmit) {
      setError('Please enter a transaction ID or upload a screenshot');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (hasTxn) fd.append('txnId', txnId.trim());
      if (note.trim()) fd.append('note', note.trim());
      files.forEach((f) => fd.append('files', f));
      const res = await fetch(
        `/api/customer/wander-quote-requests/${leadId}/payment-proof`,
        { method: 'POST', body: fd },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to submit proof');
        return;
      }
      await onSubmitted();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <h3 className="font-bold text-sm">Submit Payment Proof</h3>
        </div>
        <p className="text-xs text-amber-50 mt-0.5">
          After paying ₹{expectedAmount.toLocaleString('en-IN')}, share the transaction ID <span className="opacity-80">or</span> a screenshot
        </p>
      </div>

      <div className="p-5 space-y-3.5">
        {rejectReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
            <p className="font-bold mb-0.5">Previous submission rejected</p>
            <p>{rejectReason}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-800">
          ℹ️ Provide <strong>either</strong> the transaction ID <strong>or</strong> a screenshot — or both. At least one is needed.
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Transaction ID / UTR{' '}
            <span className="text-gray-400 font-normal">(optional if screenshot uploaded)</span>
          </label>
          <input
            type="text"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="e.g. 412345678901"
            maxLength={64}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            UTR / reference number from your UPI app or bank
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Payment Screenshots{' '}
            <span className="text-gray-400 font-normal">
              {hasTxn ? '(optional, up to 5)' : '(or upload up to 5 instead of txn ID)'}
            </span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {files.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 flex items-center justify-center cursor-pointer transition">
                <Plus className="w-5 h-5 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPick}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
            Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the agent should know"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !canSubmit}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Payment Proof</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── UPI Payment Card ─── */
function UpiPaymentCard({
  upiId,
  payeeName,
  amount,
  reference,
  bank,
}: {
  upiId: string | null;
  payeeName: string | null;
  amount: number;
  reference: string;
  bank: any;
}) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const upiUri = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}` +
      (payeeName ? `&pn=${encodeURIComponent(payeeName)}` : '') +
      (amount > 0 ? `&am=${amount}` : '') +
      `&cu=INR&tn=${encodeURIComponent(reference)}`
    : '';

  useEffect(() => {
    if (!upiUri) { setQrSrc(''); return; }
    QRCode.toDataURL(upiUri, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
      .then(setQrSrc)
      .catch(() => setQrSrc(''));
  }, [upiUri]);

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  if (!upiId && !bank) return null;

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          <h3 className="font-bold text-sm">Pay Advance to Confirm</h3>
        </div>
        {amount > 0 && (
          <p className="text-xs text-indigo-100 mt-0.5">
            Amount due: <span className="font-bold text-white">₹{amount.toLocaleString('en-IN')}</span>
          </p>
        )}
      </div>

      {/* UPI block */}
      {upiId && (
        <div className="p-5 space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center">
            {qrSrc ? (
              <img src={qrSrc} alt="UPI QR" className="w-44 h-44 rounded-xl bg-white p-2 shadow-sm" />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-white flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            )}
            <p className="text-[11px] text-indigo-500 font-semibold mt-3 text-center">
              Scan with any UPI app to pay
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-indigo-400 font-medium">
              <span>GPay</span>•<span>PhonePe</span>•<span>Paytm</span>•<span>BHIM</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">UPI ID</p>
            <button
              type="button"
              onClick={() => copy(upiId, 'upi')}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 transition group"
            >
              <span className="font-mono text-sm font-semibold text-gray-800 truncate">{upiId}</span>
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 shrink-0 ml-2">
                {copied === 'upi' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </span>
            </button>
            {payeeName && (
              <p className="text-[11px] text-gray-500 mt-1.5">
                Payee: <span className="font-semibold text-gray-700">{payeeName}</span>
              </p>
            )}
          </div>

          <a
            href={upiUri}
            className="md:hidden flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm shadow-md"
          >
            <Smartphone className="w-4 h-4" /> Open in UPI App
          </a>
        </div>
      )}

      {/* Bank block */}
      {bank && (
        <div className={`px-5 pb-5 ${upiId ? 'pt-1' : 'pt-5'}`}>
          {upiId && (
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">or bank transfer</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-gray-500" />
              <p className="text-xs font-bold text-gray-700">{bank.bankName}</p>
            </div>
            <BankRow label="A/C Holder" value={bank.accountHolderName} onCopy={(v) => copy(v, 'name')} copied={copied === 'name'} />
            <BankRow label="A/C Number" value={bank.accountNumber} onCopy={(v) => copy(v, 'acc')} copied={copied === 'acc'} mono />
            <BankRow label="IFSC" value={bank.ifscCode} onCopy={(v) => copy(v, 'ifsc')} copied={copied === 'ifsc'} mono />
            {bank.branchName && <BankRow label="Branch" value={bank.branchName} />}
            <p className="text-[10px] text-gray-400 mt-1">
              Type: {bank.accountType}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pb-4 -mt-1">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          ⚠️ After paying, share the screenshot/UTR with the agent on chat so they can confirm your booking.
        </p>
      </div>
    </div>
  );
}

function BankRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy?: (v: string) => void;
  copied?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`font-semibold text-gray-800 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
        {onCopy && (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="text-gray-400 hover:text-indigo-600 transition shrink-0"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
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
  const [existingReview, setExistingReview] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) { setCheckingExisting(false); return; }
    fetch(`/api/wander/reviews?bookingId=${bookingId}`)
      .then(r => r.json())
      .then(d => { if (d.exists) setExistingReview(d.review); })
      .catch(() => {})
      .finally(() => setCheckingExisting(false));
  }, [bookingId]);

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

  if (checkingExisting) return null;

  if (submitted || existingReview) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Review Submitted</p>
            <p className="text-xs text-gray-500">Thank you! Your feedback helps other travelers</p>
          </div>
        </div>
        {existingReview && (
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="flex items-center gap-0.5 mb-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              {existingReview.title && <p className="text-sm font-semibold text-gray-800">{existingReview.title}</p>}
              {existingReview.review && <p className="text-xs text-gray-600 mt-0.5">{existingReview.review}</p>}
            </div>
            {existingReview.vendorReply && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Vendor Reply
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">{existingReview.vendorReply}</p>
                {existingReview.vendorRepliedAt && (
                  <p className="text-[10px] text-indigo-400 mt-1">
                    {new Date(existingReview.vendorRepliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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
