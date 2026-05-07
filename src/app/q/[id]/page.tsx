// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle, XCircle, Calendar, MapPin, Users, Clock, Loader2,
  AlertCircle, Share2, Bike, Bus, Tent, Wrench, Package, Truck, Car,
  Shield, ChevronDown, ChevronUp, Star, CreditCard, BadgeCheck,
  ArrowLeft, IndianRupee, FileText, MessageCircle, Award, Copy,
  CircleDot, Timer, Phone, LayoutDashboard, Building2, Sparkles,
  CheckCheck, TrendingUp, Info, Check,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';

const META: Record<string, {
  grad: string; heroGrad: string; lightGrad: string;
  iconBg: string; iconColor: string; ringColor: string;
  accentText: string; accentBg: string; accentBorder: string; icon: any;
}> = {
  bike:        { grad: 'from-orange-500 to-amber-500',        heroGrad: 'from-orange-600 via-orange-500 to-amber-400',   lightGrad: 'from-orange-50 to-amber-50',   iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  ringColor: 'ring-orange-200',  accentText: 'text-orange-600',  accentBg: 'bg-orange-50',  accentBorder: 'border-orange-200', icon: Bike },
  bus:         { grad: 'from-blue-600 to-indigo-500',         heroGrad: 'from-blue-700 via-blue-600 to-indigo-500',      lightGrad: 'from-blue-50 to-indigo-50',    iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    ringColor: 'ring-blue-200',    accentText: 'text-blue-600',    accentBg: 'bg-blue-50',    accentBorder: 'border-blue-200',   icon: Bus },
  equipment:   { grad: 'from-purple-600 to-violet-500',       heroGrad: 'from-purple-700 via-purple-600 to-violet-500',  lightGrad: 'from-purple-50 to-violet-50',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  ringColor: 'ring-purple-200',  accentText: 'text-purple-600',  accentBg: 'bg-purple-50',  accentBorder: 'border-purple-200', icon: Wrench },
  packers:     { grad: 'from-rose-500 to-pink-500',           heroGrad: 'from-rose-600 via-rose-500 to-pink-400',        lightGrad: 'from-rose-50 to-pink-50',      iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',    ringColor: 'ring-rose-200',    accentText: 'text-rose-600',    accentBg: 'bg-rose-50',    accentBorder: 'border-rose-200',   icon: Package },
  selfdrive:   { grad: 'from-sky-500 to-cyan-500',            heroGrad: 'from-sky-600 via-sky-500 to-cyan-400',          lightGrad: 'from-sky-50 to-cyan-50',       iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     ringColor: 'ring-sky-200',     accentText: 'text-sky-600',     accentBg: 'bg-sky-50',     accentBorder: 'border-sky-200',    icon: Car },
  transporter: { grad: 'from-slate-600 to-gray-600',          heroGrad: 'from-slate-700 via-slate-600 to-gray-600',      lightGrad: 'from-slate-50 to-gray-100',    iconBg: 'bg-slate-100',   iconColor: 'text-slate-600',   ringColor: 'ring-slate-200',   accentText: 'text-slate-600',   accentBg: 'bg-slate-50',   accentBorder: 'border-slate-200',  icon: Truck },
  wander:      { grad: 'from-emerald-500 to-teal-500',        heroGrad: 'from-emerald-600 via-emerald-500 to-teal-400',  lightGrad: 'from-emerald-50 to-teal-50',   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', ringColor: 'ring-emerald-200', accentText: 'text-emerald-600', accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-200', icon: Tent },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  SENT:      { label: 'Quote Sent',  cls: 'bg-blue-100 text-blue-700' },
  VIEWED:    { label: 'Viewed',      cls: 'bg-violet-100 text-violet-700' },
  ACCEPTED:  { label: 'Accepted',   cls: 'bg-emerald-100 text-emerald-700' },
  PENDING:   { label: 'Pending',    cls: 'bg-amber-100 text-amber-700' },
  WITHDRAWN: { label: 'Withdrawn',  cls: 'bg-gray-100 text-gray-500' },
  DRAFT:     { label: 'Active',     cls: 'bg-blue-100 text-blue-700' },
};

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtAmt(n?: number | null) {
  if (n == null || n === 0) return '₹0';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded-xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${className}`} />
  );
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);

export default function PublicQuotePage() {
  const { id } = useParams();
  const [quote, setQuote]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [showTerms, setShowTerms]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [accepting, setAccepting]   = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [booking, setBooking]       = useState<any>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    bookingId: string; bookingType: string; amount: number; bookingNumber: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/public/quote/${id}`)
      .then(r => r.json())
      .then(d => setQuote(d.error ? null : d))
      .catch(() => setQuote(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (quote?.existingBooking && !booking) {
      const eb = quote.existingBooking;
      setBooking(eb);
      if (['PAYMENT_VERIFIED', 'ADVANCE_PAID', 'CONFIRMED'].includes(eb.status)) {
        setPaymentDone(true);
      } else if (eb.status === 'PENDING_PAYMENT' && (eb.advanceAmount || quote.advanceAmount) > 0) {
        setPendingPayment({
          bookingId: eb.id,
          bookingType: quote.bookingType,
          amount: eb.advanceAmount || quote.advanceAmount,
          bookingNumber: eb.bookingNumber,
        });
      }
    }
  }, [quote]);

  async function handleAccept() {
    if (!quote) return;
    setAccepting(true);
    setAcceptError('');
    try {
      const res  = await fetch(`/api/public/quote/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: quote.bookingType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setAcceptError(data.error || 'Failed to accept quote'); return; }
      const { bookingId, bookingType, advanceAmount, needsPayment, bookingNumber, status } = data;
      setBooking({ id: bookingId, bookingNumber, status });
      if (!needsPayment || advanceAmount <= 0) { setPaymentDone(true); }
      else { setPendingPayment({ bookingId, bookingType, amount: advanceAmount, bookingNumber }); }
    } catch (err: any) {
      setAcceptError(err?.message || 'Something went wrong.');
    } finally {
      setAccepting(false);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    if (!quote?.vendorPhone) return;
    const text = encodeURIComponent(`Hi, I received your ${quote.serviceName} quote #${quote.quoteNumber}.\nAmount: ${fmtAmt(quote.amount)}\nI'd like to proceed.`);
    window.open(`https://wa.me/91${quote.vendorPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  }

  function handleGoDashboard() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    window.location.href = token ? '/customer/dashboard' : '/customer/login';
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
      <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 space-y-3 pb-10">
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!quote) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Quote Not Found</h2>
        <p className="text-sm text-gray-400 leading-relaxed">This quote may have expired or the link is incorrect.</p>
      </div>
    </div>
  );

  const meta        = META[quote.serviceType] || META.transporter;
  const Icon        = meta.icon;
  const statusInfo  = STATUS_LABELS[quote.status] || { label: quote.status, cls: 'bg-gray-100 text-gray-600' };
  const isWithdrawn = quote.status === 'WITHDRAWN';
  const isExpired   = quote.validTill && new Date(quote.validTill) < new Date();
  const isWon       = quote.status === 'ACCEPTED' || paymentDone;
  const canAccept   = !isWithdrawn && !isExpired && !paymentDone && !booking?.id;
  const hasAdvance  = (quote.advanceAmount || 0) > 0;
  const inclusions: string[] = quote.inclusions || [];
  const exclusions: string[] = quote.exclusions || [];
  const terms: string[]      = quote.termsConditions || [];
  const pricing: any[]       = quote.pricing || [];

  /* ── Payment success screen ── */
  if (paymentDone && booking) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Checkmark */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
              <CheckCheck className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-2 border-emerald-100 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 text-center mb-1">Booking Confirmed!</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Your advance payment was received successfully.</p>

        {/* Booking number */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 mb-4 text-center shadow-lg shadow-emerald-100">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Booking Number</p>
          <p className="text-3xl font-black text-white tracking-wide">{booking.bookingNumber}</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-5 overflow-hidden">
          {[
            { label: 'Service', value: quote.serviceName },
            ...(quote.serviceDetail ? [{ label: 'Details', value: quote.serviceDetail }] : []),
            { label: 'Vendor', value: quote.vendorName },
            { label: 'Advance Paid', value: fmtAmt(quote.advanceAmount), highlight: true },
            { label: 'Balance Due', value: fmtAmt(quote.balanceAmount) },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-400">{row.label}</span>
              <span className={`text-sm font-bold ${row.highlight ? 'text-emerald-600' : 'text-gray-800'}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button onClick={handleGoDashboard}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition text-sm shadow-sm">
            <LayoutDashboard className="w-4 h-4" /> Go to My Dashboard
          </button>
          {quote.vendorPhone && (
            <button onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#22c55e] text-white font-bold rounded-2xl transition text-sm">
              {WA_ICON} Contact Vendor on WhatsApp
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-300 mt-6">Powered by TransRentals</p>
      </div>
    </div>
  );

  // Pending payment is now rendered INLINE inside the main quote page (below the hero),
  // so the customer keeps the full quote context (price breakdown, trip details, vendor)
  // visible while completing payment — instead of a near-empty narrow page.
  const showPaymentSection = pendingPayment && !paymentDone && quote;

  /* ══════════════════════════════════════════════════════════════════
     MAIN QUOTE PAGE
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 ${canAccept && !showPaymentSection ? 'pb-32' : 'pb-12'}`}>

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 ${meta.iconBg} rounded-lg flex items-center justify-center ring-1 ${meta.ringColor} shrink-0`}>
              <Icon className={`w-4 h-4 ${meta.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none truncate">{quote.serviceName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-mono">#{quote.quoteNumber}</p>
            </div>
          </div>
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${statusInfo.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {statusInfo.label}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-4">

        {/* ── Hero Card ── */}
        <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Top accent bar */}
          <div className={`h-1.5 bg-gradient-to-r ${meta.heroGrad}`} />
          {/* Soft brand wash in corner */}
          <div className={`absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br ${meta.heroGrad} opacity-[0.08] rounded-full blur-3xl pointer-events-none`} />

          <div className="relative p-5 sm:p-7">
            {/* Vendor identity + status */}
            <div className="flex items-start justify-between gap-3 pb-5 mb-5 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                {quote.vendorLogo ? (
                  <img src={quote.vendorLogo} alt="" className="w-12 h-12 rounded-xl object-cover bg-white ring-1 ring-gray-200 shadow-sm shrink-0" />
                ) : (
                  <div className={`w-12 h-12 ${meta.iconBg} rounded-xl flex items-center justify-center ring-1 ${meta.ringColor} shrink-0`}>
                    <span className={`text-lg font-black ${meta.iconColor}`}>{quote.vendorName?.charAt(0)?.toUpperCase() || 'V'}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none">Quoted by</p>
                  <p className="text-base font-black text-gray-900 mt-1 truncate">{quote.vendorName}</p>
                  {(quote.vendorCity || quote.vendorState) && (
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {[quote.vendorCity, quote.vendorState].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${statusInfo.cls}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {statusInfo.label}
              </span>
            </div>

            {/* Service + Amount */}
            <div className="grid sm:grid-cols-[1fr_auto] gap-5 sm:gap-8 sm:items-end">
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${meta.accentText} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                  <Icon className="w-3.5 h-3.5" /> {quote.serviceName}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">
                  {quote.serviceDetail || quote.serviceName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                  <span className="font-mono font-semibold">#{quote.quoteNumber}</span>
                  {quote.validTill && (
                    <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
                      <Timer className="w-3 h-3" />
                      {isExpired ? 'Expired ' : 'Valid till '}{fmt(quote.validTill)}
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Amount</p>
                <p className={`text-4xl sm:text-5xl font-black tracking-tight leading-none ${meta.accentText}`}>{fmtAmt(quote.amount)}</p>
                {quote.perPersonAmount && (
                  <p className="text-xs text-gray-500 mt-1.5">{fmtAmt(quote.perPersonAmount)}/person × {quote.request?.groupSize}</p>
                )}
                {hasAdvance && (
                  <p className="text-[11px] text-gray-500 mt-2.5 flex sm:justify-end items-center gap-1.5">
                    <span className={`font-bold ${meta.accentText}`}>{fmtAmt(quote.advanceAmount)}</span> advance
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-semibold text-gray-700">{fmtAmt(quote.balanceAmount)}</span> later
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* ── Alert banners ── */}
      <div className="space-y-2">
        {isWithdrawn && (
          <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
            <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-700">Quote Withdrawn</p>
              <p className="text-xs text-gray-400">This quote has been withdrawn by the vendor.</p>
            </div>
          </div>
        )}
        {!isWithdrawn && isExpired && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700">Quote Expired</p>
              <p className="text-xs text-amber-600">This quote expired on {fmt(quote.validTill)}. Request a new quote.</p>
            </div>
          </div>
        )}
        {isWon && booking && !paymentDone && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <Award className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Quote Accepted — Booking Created</p>
              <p className="text-xs text-emerald-600 font-mono">#{booking.bookingNumber}</p>
            </div>
          </div>
        )}
        {acceptError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{acceptError}</p>
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ═══ Left column (2/3) ═══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Price Breakdown */}
          {pricing.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className={`w-8 h-8 ${meta.iconBg} rounded-xl flex items-center justify-center`}>
                  <IndianRupee className={`w-4 h-4 ${meta.iconColor}`} />
                </div>
                <h3 className="font-black text-gray-900 text-[15px]">Price Breakdown</h3>
              </header>
              <div className="p-5 space-y-3">
                {pricing.map((item: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between ${item.isTotal ? 'pt-3 mt-1 border-t-2 border-dashed border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm truncate ${item.isTotal ? 'font-black text-gray-900' : item.isAdvance ? `font-bold ${meta.accentText}` : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                      {item.note && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold shrink-0">{item.note}</span>
                      )}
                    </div>
                    <span className={`shrink-0 ${item.isTotal ? `text-xl font-black ${meta.accentText}` : item.isAdvance ? `font-bold ${meta.accentText}` : 'text-sm font-bold text-gray-800'}`}>
                      {fmtAmt(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inclusions & Exclusions */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900">What's Included</h3>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-3">
                {inclusions.length > 0 && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Included</p>
                    </div>
                    <ul className="space-y-2">
                      {inclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-xs font-black text-red-600 uppercase tracking-wider">Not Included</p>
                    </div>
                    <ul className="space-y-2">
                      {exclusions.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms */}
          {terms.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setShowTerms(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4 text-gray-500" />
                  </div>
                  <h3 className="font-bold text-gray-900">Terms & Conditions</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{terms.length}</span>
                </div>
                {showTerms
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showTerms && (
                <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-4">
                  {terms.map((term: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                      <span className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0 mt-0.5 shadow-sm">{i + 1}</span>
                      <p className="text-sm text-gray-600 leading-relaxed">{term}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Inline Payment Section (after Terms) ── */}
          {showPaymentSection && (
            <section className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
              {/* Compact header — matches Trip Details card style */}
              <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-[15px] leading-none">Complete Your Payment</h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-1 truncate">#{pendingPayment.bookingNumber}</p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  <Timer className="w-2.5 h-2.5" /> Pending
                </span>
              </header>

              {/* Compact amount rows */}
              <div className="divide-y divide-gray-50">
                <div className="px-5 py-3 flex items-center justify-between gap-3 bg-emerald-50/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Pay Now</span>
                  </div>
                  <span className="text-base font-black text-emerald-700 shrink-0">{fmtAmt(pendingPayment.amount)}</span>
                </div>
                <div className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BadgeCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">{fmtAmt(quote.amount)}</span>
                </div>
                <div className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Balance Later</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700 shrink-0">{fmtAmt(quote.balanceAmount)}</span>
                </div>
              </div>

              {/* Razorpay widget — embedded mode (no duplicate header/wrapper) */}
              <div className="px-5 py-4 border-t border-gray-100">
                <BookingPayment
                  bookingId={pendingPayment.bookingId}
                  bookingType={pendingPayment.bookingType as any}
                  amount={pendingPayment.amount}
                  bookingNumber={pendingPayment.bookingNumber}
                  serviceSlug={pendingPayment.bookingType}
                  onSuccess={() => setPaymentDone(true)}
                  embedded
                />
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 text-[11px] text-gray-400">
                <button
                  onClick={() => setPendingPayment(null)}
                  className="hover:text-gray-600 transition flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to quote
                </button>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Razorpay secured
                </span>
              </div>
            </section>
          )}

          {/* Vendor Note */}
          {quote.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900">Note from Vendor</h3>
              </div>
              <div className="p-5">
                <div className={`${meta.accentBg} ${meta.accentBorder} border rounded-xl px-4 py-3`}>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{quote.notes}"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Right sidebar (1/3) ═══ */}
        <aside className="space-y-4 lg:sticky lg:top-[72px]">

          {/* Trip Details */}
          {(quote.request?.date || quote.request?.location || quote.request?.duration || quote.request?.groupSize) && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className={`w-8 h-8 ${meta.iconBg} rounded-xl flex items-center justify-center`}>
                  <Calendar className={`w-4 h-4 ${meta.iconColor}`} />
                </div>
                <h3 className="font-black text-gray-900 text-[15px]">Trip Details</h3>
              </header>
              <div className="divide-y divide-gray-50">
                {quote.request?.date && (
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CircleDot className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Start</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 text-right">{fmt(quote.request.date)}</span>
                  </div>
                )}
                {quote.request?.endDate && (
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CircleDot className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">End</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 text-right">{fmt(quote.request.endDate)}</span>
                  </div>
                )}
                {quote.request?.duration && (
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Timer className={`w-3.5 h-3.5 ${meta.iconColor} shrink-0`} />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Duration</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 text-right">{quote.request.duration}</span>
                  </div>
                )}
                {quote.request?.groupSize && (
                  <div className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className={`w-3.5 h-3.5 ${meta.iconColor} shrink-0`} />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Group</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 text-right">{quote.request.groupSize} {quote.request.groupSize > 1 ? 'people' : 'person'}</span>
                  </div>
                )}
                {quote.request?.location && (
                  <div className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 shrink-0">
                      <MapPin className={`w-3.5 h-3.5 ${meta.iconColor} shrink-0`} />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Location</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 text-right break-words">{quote.request.location}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Customer */}
          {quote.request?.customerName && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-base font-black text-white shadow-sm shrink-0">
                {quote.request.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Customer</p>
                <p className="text-sm font-black text-gray-900 mt-1 truncate">{quote.request.customerName}</p>
                {quote.request.customerPhone && (
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{quote.request.customerPhone}</p>
                )}
              </div>
            </section>
          )}

          {/* Vendor Card */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative px-5 py-5 border-b border-gray-100 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.heroGrad} opacity-[0.06]`} />
              <div className="relative flex items-center gap-3">
                {quote.vendorLogo ? (
                  <img src={quote.vendorLogo} alt="" className="w-12 h-12 rounded-xl object-cover bg-white ring-1 ring-gray-200 shadow-sm shrink-0" />
                ) : (
                  <div className={`w-12 h-12 ${meta.iconBg} rounded-xl flex items-center justify-center ring-1 ${meta.ringColor} shrink-0`}>
                    <span className={`text-lg font-black ${meta.iconColor}`}>{quote.vendorName?.charAt(0)?.toUpperCase() || 'V'}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Vendor</p>
                  <p className="font-black text-gray-900 truncate mt-1">{quote.vendorName}</p>
                  {(quote.vendorCity || quote.vendorState) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {[quote.vendorCity, quote.vendorState].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {quote.vendorDescription && (
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">{quote.vendorDescription}</p>
              </div>
            )}
            {quote.vendorPhone && (
              <div className="p-3 grid grid-cols-2 gap-2">
                <a href={`tel:${quote.vendorPhone}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-100 active:scale-95">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <button onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs rounded-xl transition border border-[#25D366]/20 active:scale-95">
                  <span className="text-[#128C7E]">{WA_ICON}</span> WhatsApp
                </button>
              </div>
            )}
          </section>

          <p className="text-center text-[11px] text-gray-300 pt-1 pb-1">Powered by <span className="font-semibold">TransRentals</span></p>
        </aside>
      </div>
      </main>

      {/* ── Sticky Accept CTA ── (hidden while in-page payment is active) */}
      {canAccept && !showPaymentSection && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl px-4 sm:px-6 pt-3 pb-5">
            <div className="max-w-7xl mx-auto">
              {acceptError && (
                <p className="text-xs text-red-600 text-center mb-2">{acceptError}</p>
              )}
              <div className="flex items-center gap-3">
                {hasAdvance && (
                  <div className="shrink-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Pay Now</p>
                    <p className={`text-xl font-black ${meta.accentText}`}>{fmtAmt(quote.advanceAmount)}</p>
                    {quote.balanceAmount > 0 && (
                      <p className="text-[10px] text-gray-400">{fmtAmt(quote.balanceAmount)} later</p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-4 font-black rounded-2xl transition text-white text-base shadow-lg active:scale-[0.98] ${
                    accepting ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${meta.grad}`
                  }`}
                >
                  {accepting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                  ) : hasAdvance ? (
                    <><CreditCard className="w-5 h-5" /> Accept & Pay {fmtAmt(quote.advanceAmount)}</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Accept Quote</>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Shield className="w-3 h-3" /> Razorpay secured
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <p className="text-[10px] text-gray-400">UPI · Cards · Net Banking · Bank Transfer</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
