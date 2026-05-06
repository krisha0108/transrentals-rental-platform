// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Compass, MapPin, Clock, Users, ChevronLeft, ChevronRight,
  Check, X, Star, Shield, Globe, Loader2, AlertCircle,
  Calendar, Phone, Mail, User, MessageSquare, ChevronDown,
  Car, Info, ArrowLeft, Sparkles, CheckCircle, Building2, UserPlus, TrendingUp, Images,
  Lock, Eye, EyeOff,
} from 'lucide-react';
import ReviewsSection from '@/components/wander/ReviewsSection';
import { sanitizeRichText } from '@/lib/utils/sanitize';

function parseJSON(str: any, fallback: any) {
  if (Array.isArray(str) || (str && typeof str === 'object')) return str;
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

const CANCEL_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  FLEXIBLE: { label: 'Flexible', desc: 'Full refund up to 24 hrs before', color: 'text-emerald-600' },
  MODERATE: { label: 'Moderate', desc: 'Full refund up to 48 hrs before', color: 'text-amber-600' },
  STRICT: { label: 'Strict', desc: 'No refund after confirmation', color: 'text-red-600' },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Image Gallery ─────────────────────────────────────────────────────────── */
function Gallery({ images, title, meta }: {
  images: string[];
  title: string;
  meta?: {
    category?: { icon: string; name: string } | null;
    location?: string | null;
    duration?: string | null;
    rating?: number | null;
    totalRatings?: number;
    popular?: boolean;
  };
}) {
  const [current, setCurrent]     = useState(0);
  const [paused, setPaused]       = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── auto-slide every 3s (pause on hover / lightbox open) ── */
  useEffect(() => {
    if (images.length <= 1 || paused || lightboxIdx !== null) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % images.length);
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, paused, lightboxIdx]);

  const goTo   = (i: number) => { setCurrent(i); setPaused(true); };
  const goPrev = () => goTo((current - 1 + images.length) % images.length);
  const goNext = () => goTo((current + 1) % images.length);

  /* ── lightbox keyboard ── */
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => (i! - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight') setLightboxIdx(i => (i! + 1) % images.length);
      else if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, images.length]);

  /* ── no images ── */
  if (!images.length) {
    return (
      <div className="h-72 md:h-[480px] bg-gradient-to-br from-slate-800 to-indigo-900 flex flex-col items-center justify-center rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <span className="text-8xl opacity-10 mb-4 relative z-10">🗺️</span>
        <p className="text-sm text-white/40 relative z-10">No photos yet</p>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          <h1 className="font-black text-white text-xl md:text-2xl leading-tight drop-shadow-xl">{title}</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ══ SLIDER ══ */}
      <div
        className="relative w-full h-72 md:h-[520px] rounded-2xl overflow-hidden bg-gray-900 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* slides */}
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={i === 0 ? title : ''}
            onClick={() => setLightboxIdx(i)}
            className={`absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-700 ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}

        {/* Strong bottom-heavy gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-20 pointer-events-none" />
        {/* Side vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-20 pointer-events-none" />

        {/* Top bar: category + popular */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 flex items-start justify-between">
          {meta?.category && (
            <span className="inline-flex items-center gap-1.5 bg-black/45 backdrop-blur-md text-[11px] font-bold text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
              {meta.category.icon} {meta.category.name}
            </span>
          )}
          {meta?.popular && (
            <div className="ml-auto bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-lg">
              <TrendingUp className="w-2.5 h-2.5" /> Hot
            </div>
          )}
        </div>

        {/* prev / next arrows — only when 2+ images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom overlay: title + meta + dots + counter */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-5 pb-4 pt-20">
          {/* Title */}
          <h1 className="font-black text-white text-xl md:text-[1.65rem] leading-snug mb-2.5 drop-shadow-xl tracking-tight">
            {title}
          </h1>
          {/* Location + Duration + Rating */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {meta?.location && (
              <span className="flex items-center gap-1.5 text-white/85 text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" /> {meta.location}
              </span>
            )}
            {meta?.duration && (
              <span className="flex items-center gap-1.5 text-white/70 text-sm">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {meta.duration}
              </span>
            )}
            {meta?.rating != null && meta.rating > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-gray-900 text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                <Star className="w-3 h-3 fill-gray-900" /> {meta.rating}
                {meta.totalRatings != null && meta.totalRatings > 0 && (
                  <span className="font-normal ml-0.5 text-gray-700">({meta.totalRatings})</span>
                )}
              </span>
            )}
          </div>
          {/* Dots + counter row */}
          <div className="flex items-center justify-between">
            {images.length > 1 ? (
              <div className="flex items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/45 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            ) : <span />}
            <button
              onClick={() => setLightboxIdx(current)}
              className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <Images className="w-3.5 h-3.5" />
              {images.length > 1 ? `${current + 1} / ${images.length}` : '1 photo'}
            </button>
          </div>
        </div>

        {/* progress bar */}
        {images.length > 1 && !paused && lightboxIdx === null && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] z-40 bg-white/20">
            <div
              key={current}
              className="h-full bg-white/80 rounded-full"
              style={{ animation: 'slideProgress 3s linear forwards' }}
            />
          </div>
        )}
      </div>

      {/* progress bar keyframe */}
      <style>{`
        @keyframes slideProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>

      {/* ══ THUMBNAIL STRIP (below slider, 2+ images) ══ */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex-shrink-0 w-16 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === current
                  ? 'border-indigo-500 scale-105 shadow-md'
                  : 'border-transparent opacity-55 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ══ LIGHTBOX ══ */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[999] flex flex-col backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxIdx(null)}
        >
          {/* top bar */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-white/55 text-sm">{lightboxIdx + 1} / {images.length}</span>
            <p className="text-white font-semibold text-sm truncate max-w-xs text-center">{title}</p>
            {/* Prominent close button */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="w-10 h-10 bg-white/15 hover:bg-white/30 border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* image */}
          <div className="flex-1 flex items-center justify-center relative px-14 min-h-0" onClick={e => e.stopPropagation()}>
            <img
              src={images[lightboxIdx]}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 180px)' }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx(i => (i! - 1 + images.length) % images.length)}
                  className="absolute left-3 w-11 h-11 bg-white/15 hover:bg-white/30 border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightboxIdx(i => (i! + 1) % images.length)}
                  className="absolute right-3 w-11 h-11 bg-white/15 hover:bg-white/30 border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* thumbnail strip */}
          {images.length > 1 && (
            <div className="flex-shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-center" onClick={e => e.stopPropagation()}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all duration-200 ${
                    i === lightboxIdx
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Quote Form ────────────────────────────────────────────────────────────── */
function QuoteForm({
  listingId, listingTitle, priceType, basePrice, priceTiers,
  requireAdvancePayment, advancePaymentType, advancePaymentValue,
}: {
  listingId: string; listingTitle: string;
  priceType?: string; basePrice?: number | null;
  priceTiers?: { groupSize: string; price: string }[];
  requireAdvancePayment?: boolean; advancePaymentType?: string; advancePaymentValue?: number | null;
}) {
  const [loggedInCustomer, setLoggedInCustomer] = useState<{ id: string; name: string; phone: string; email: string; isB2B?: boolean; companyName?: string } | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    travelDate: '', groupSize: '2', pickupLocation: '', requirements: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [bookingFor, setBookingFor] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const token = localStorage.getItem('customerToken') || localStorage.getItem('token');
      const raw = localStorage.getItem('customer');
      if (token && raw) {
        const c = JSON.parse(raw);
        if (c?.id && c?.name && c?.phone) {
          setLoggedInCustomer({ id: c.id, name: c.name, phone: c.phone, email: c.email || '', isB2B: !!c.isB2B && c.b2bStatus === 'APPROVED', companyName: c.companyName || '' });
          setForm(f => ({ ...f, name: c.name, phone: c.phone, email: c.email || '' }));
        }
      }
    } catch {}
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.phone.trim() || form.phone.length < 10) return setError('Valid phone is required');
    if (!form.email.trim()) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Please enter a valid email');
    if (!loggedInCustomer) {
      if (!form.password) return setError('Please choose a password');
      if (form.password.length < 8) return setError('Password must be at least 8 characters');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    }
    if (!form.travelDate) return setError('Travel date is required');

    setSubmitting(true);
    try {
      const isB2BCompany = loggedInCustomer?.isB2B && bookingFor === 'COMPANY';
      const { confirmPassword: _cp, password, ...rest } = form;
      const res = await fetch('/api/wander/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          ...rest,
          ...(loggedInCustomer
            ? { customerId: loggedInCustomer.id }
            : { password }),
          bookingFor: isB2BCompany ? 'COMPANY' : 'PERSONAL',
          companyName: isB2BCompany ? (loggedInCustomer?.companyName || '') : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresLogin) setNeedsLogin(true);
        throw new Error(data.error || 'Failed');
      }
      setSuccess(data.requestId);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Request Submitted!</h3>
        <p className="text-sm text-gray-500 mb-3">
          Vendors will get back to you with custom quotes.
        </p>
        <p className="text-xs font-mono bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg inline-block mb-4">{success}</p>
        <button
          onClick={() => { setSuccess(''); setForm(f => ({ ...f, travelDate: '', groupSize: '2', pickupLocation: '', requirements: '' })); }}
          className="block w-full text-sm text-indigo-600 hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Logged-in customer: show identity card, skip name/phone/email fields */}
      {loggedInCustomer ? (
        <>
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {loggedInCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{loggedInCustomer.name}</p>
              <p className="text-xs text-gray-500 truncate">{loggedInCustomer.phone}{loggedInCustomer.email ? ` · ${loggedInCustomer.email}` : ''}</p>
            </div>
          </div>
          {!loggedInCustomer.email && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={form.email} onChange={e => set('email', e.target.value)}
                  type="email" required placeholder="you@example.com"
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">We'll send tour quotes & updates to this email.</p>
            </div>
          )}
          {/* B2B customers only: trip is personal or for company */}
          {loggedInCustomer.isB2B && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">This trip is for?</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBookingFor('PERSONAL')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${bookingFor === 'PERSONAL' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  Personal
                </button>
                <button type="button" onClick={() => setBookingFor('COMPANY')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${bookingFor === 'COMPANY' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  For Company
                </button>
              </div>
              {bookingFor === 'COMPANY' && loggedInCustomer.companyName && (
                <p className="text-xs text-indigo-600 mt-1.5 pl-1">Booking under: <span className="font-semibold">{loggedInCustomer.companyName}</span></p>
              )}
              {bookingFor === 'COMPANY' && (
                <p className="text-[11px] text-emerald-600 mt-1 pl-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> No advance payment — invoice after trip completion
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Your name"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Phone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="10-digit"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" required placeholder="you@example.com"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div className="col-span-2 mt-1 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <p className="text-[11px] font-semibold text-indigo-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Set a password to track your quote
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={form.password} onChange={e => set('password', e.target.value)}
                    type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Min 8 characters"
                    className="w-full pl-8 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Confirm *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Re-enter"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              We'll create your account so you can login with your email + password to view quotes & updates.
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Travel Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={form.travelDate} onChange={e => set('travelDate', e.target.value)}
              type="date" min={today}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Group Size</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={form.groupSize} onChange={e => set('groupSize', e.target.value)}
              type="number" min="1" max="200"
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Pickup Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
          <input value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)}
            placeholder="Hotel name / area"
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Special Requirements</label>
        <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
          rows={3} placeholder="Any specific needs, dietary requirements, accessibility..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
      {/* Advance payment notice */}
      {bookingFor === 'COMPANY' ? (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <span className="text-emerald-600 text-sm mt-0.5">✅</span>
          <div>
            <p className="text-xs font-semibold text-emerald-700">No advance payment for company bookings</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Vendor will send an invoice after trip completion</p>
          </div>
        </div>
      ) : requireAdvancePayment && advancePaymentValue ? (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <span className="text-amber-600 text-sm mt-0.5">⚡</span>
          <div>
            <p className="text-xs font-semibold text-amber-700">
              {advancePaymentType === 'PERCENTAGE'
                ? `${advancePaymentValue}% advance payment required to confirm this tour`
                : `₹${Number(advancePaymentValue).toLocaleString('en-IN')} advance payment required to confirm this tour`}
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">Remaining balance due after the trip</p>
          </div>
        </div>
      ) : null}

      {/* Live price estimate */}
      {(() => {
        const qty = parseInt(form.groupSize) || 1;
        let estPrice: number | null = null;
        if (priceType === 'PER_PERSON' && basePrice) {
          estPrice = qty * Number(basePrice);
        } else if (priceType === 'PER_GROUP' && priceTiers?.length) {
          // find best matching tier (closest groupSize that covers qty)
          const sorted = [...priceTiers].sort((a, b) => parseInt(a.groupSize) - parseInt(b.groupSize));
          const match = sorted.find(t => parseInt(t.groupSize) >= qty) || sorted[sorted.length - 1];
          if (match?.price) estPrice = Number(match.price);
        }
        if (!estPrice) return null;
        const advAmt = requireAdvancePayment && advancePaymentValue
          ? advancePaymentType === 'PERCENTAGE'
            ? (estPrice * advancePaymentValue) / 100
            : advancePaymentValue
          : null;
        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-600 font-medium">
                {priceType === 'PER_PERSON'
                  ? `Estimated for ${qty} person${qty !== 1 ? 's' : ''}`
                  : 'Estimated total'}
              </span>
              <span className="text-lg font-black text-indigo-700">
                ~₹{estPrice.toLocaleString('en-IN')}
              </span>
            </div>
            {priceType === 'PER_PERSON' && basePrice && (
              <p className="text-xs text-indigo-400">₹{Number(basePrice).toLocaleString('en-IN')} × {qty} person{qty !== 1 ? 's' : ''}</p>
            )}
            {advAmt && (
              <div className="border-t border-indigo-100 pt-1.5 flex items-center justify-between">
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  ⚡ Advance required
                  {advancePaymentType === 'PERCENTAGE' ? ` (${advancePaymentValue}%)` : ''}
                </span>
                <span className="text-sm font-bold text-amber-700">₹{advAmt.toLocaleString('en-IN')}</span>
              </div>
            )}
            <p className="text-[10px] text-indigo-400">Final price confirmed by vendor in the quote</p>
          </div>
        );
      })()}

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            {needsLogin && (
              <Link
                href={`/customer/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                className="inline-block mt-1.5 font-semibold text-indigo-600 hover:underline"
              >
                Login to your account →
              </Link>
            )}
          </div>
        </div>
      )}
      <button
        type="submit" disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Get Free Quote'}
      </button>
      <p className="text-center text-xs text-gray-400">Free · No payment required · Vendors will contact you</p>

      <div className="relative flex items-center gap-2 my-1">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <PlanWithFriendsInline listingId={listingId} />
    </form>
  );
}

/* ─── Plan with Friends Modal (shared) ───────────────────────────────────────── */
function PlanWithFriendsModal({ listingId, listingTitle, onClose }: { listingId: string; listingTitle?: string; onClose: () => void }) {
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [tripNote, setTripNote] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarRef = React.useRef<HTMLInputElement>(null);

  const handlePickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('customer') : null;
      const cust = stored ? JSON.parse(stored) : null;
      if (!cust?.id) { alert('Please log in first to create a group.'); setCreating(false); return; }
      const res = await fetch('/api/wander/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          createdById: cust.id,
          creatorName: cust.name,
          creatorPhone: cust.phone,
          listingId,
          travelDate: travelDate || null,
          tripNote: tripNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const gc = data.group?.groupCode || data.groupCode;
      const memberId = data.memberId;
      if (avatarFile && gc && memberId) {
        try {
          const fd = new FormData();
          fd.append('memberId', memberId);
          fd.append('file', avatarFile);
          await fetch(`/api/wander/groups/${gc}/avatar`, { method: 'POST', body: fd });
        } catch {}
      }
      window.location.href = `/wander/group/${gc}`;
    } catch (e: any) {
      alert(e.message || 'Something went wrong');
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Green header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight">Plan with Friends</p>
                {listingTitle && <p className="text-emerald-200 text-xs mt-0.5 truncate max-w-[200px]">{listingTitle}</p>}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <>
            {/* Photo + name row */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => avatarRef.current?.click()}
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 transition overflow-hidden flex-shrink-0">
                  {avatarPreview
                    ? <img src={avatarPreview} className="w-16 h-16 object-cover" />
                    : <><span className="text-2xl">📷</span><span className="text-[9px] text-emerald-500 font-semibold mt-0.5">Add Photo</span></>}
                </button>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Group Name *</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400"
                    placeholder='e.g. "College Gang", "Family Trip"'
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    autoFocus
                  />
                </div>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} />
              </div>

              {/* Travel date */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Travel Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-700"
                  />
                </div>
              </div>

              {/* Trip note */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Trip Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea rows={2} value={tripNote} onChange={e => setTripNote(e.target.value)}
                  placeholder="e.g. Annual trip! Budget ~₹5000 per person"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-gray-400 resize-none"
                />
              </div>

              <button type="button" onClick={handleCreate} disabled={creating || !groupName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><UserPlus className="w-4 h-4" /> Create Group & Invite Friends</>}
              </button>
          </>
        </div>
      </div>
    </div>
  );
}

/* ─── Plan with Friends Inline (inside QuoteForm) ────────────────────────────── */
function PlanWithFriendsInline({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-sm py-3 rounded-xl transition">
        <UserPlus className="w-4 h-4" /> Plan with Friends
      </button>
      {open && <PlanWithFriendsModal listingId={listingId} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ─── Plan with Friends Card ─────────────────────────────────────────────────── */
function PlanWithFriendsCard({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-sm py-3 rounded-2xl transition">
        <UserPlus className="w-4 h-4" /> Plan with Friends
      </button>
      {open && <PlanWithFriendsModal listingId={listingId} listingTitle={listingTitle} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ─── Vendor Profile Card ────────────────────────────────────────────────────── */
function VendorCard({ vendor, listingCount }: { vendor: any; listingCount?: number }) {
  const [logoError, setLogoError] = useState(false);
  const yearsActive = vendor.createdAt
    ? new Date().getFullYear() - new Date(vendor.createdAt).getFullYear()
    : null;
  const showLogo = vendor.logo && !logoError;
  return (
    <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 border border-gray-200/80 rounded-2xl p-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Your Tour Operator</p>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {showLogo ? (
            <img src={vendor.logo} alt={vendor.businessName} onError={() => setLogoError(true)} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white">
              <span className="text-2xl font-black text-white">{vendor.businessName?.[0]?.toUpperCase() || '?'}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-base">{vendor.businessName}</h3>
              <div className="flex items-center gap-3 mt-1">
                {vendor.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{Number(vendor.rating).toFixed(1)}</span>
                    <span className="text-gray-400">({vendor.totalRatings})</span>
                  </span>
                )}
                {yearsActive !== null && yearsActive > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" /> {yearsActive}y on platform
                  </span>
                )}
              </div>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
              <Check className="w-2.5 h-2.5" /> Verified
            </span>
          </div>
          {vendor.description && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{vendor.description}</p>
          )}
        </div>
      </div>
      {/* Stats strip */}
      <div className="flex items-center gap-0 mt-4 pt-4 border-t border-gray-200/80">
        {[
          { label: 'Response', value: 'Fast' },
          { label: 'Tours', value: listingCount != null ? `${listingCount}` : '—' },
          { label: 'Languages', value: 'Hindi, Eng' },
        ].map((s, i, arr) => (
          <div key={s.label} className={`flex-1 text-center ${i < arr.length - 1 ? 'border-r border-gray-200' : ''}`}>
            <p className="text-sm font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Similar Tour Mini-Card ─────────────────────────────────────────────────── */
function SimilarCard({ listing }: { listing: any }) {
  const images: string[] = Array.isArray(listing.images) ? listing.images : (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const cover = images[0] || null;
  return (
    <Link href={`/wander/${listing.slug || listing.id}`}
      className="group flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:shadow-md hover:border-indigo-100 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-50">
        {cover ? (
          <img src={cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">{listing.category?.icon || '🗺️'}</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">{listing.title}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          {listing.duration && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {listing.duration}</span>
          )}
          {listing.basePrice && (
            <span className="text-xs font-bold text-indigo-600">₹{Number(listing.basePrice).toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 self-center transition-colors" />
    </Link>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function TourDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
    const previewQuery = isPreview ? '?preview=1' : '';
    fetch(`/api/wander/listings/${id}${previewQuery}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          const l = d.listing ?? d;
          setListing(l);
          // Fetch similar tours
          const catParam = l.categoryId ? `&categoryIds=${l.categoryId}` : '';
          fetch(`/api/wander/listings?limit=4&page=1${catParam}`)
            .then(r => r.json())
            .then(sd => {
              const others = (sd.listings || []).filter((s: any) => s.id !== l.id).slice(0, 3);
              setSimilarListings(others);
            })
            .catch(() => {});
        }
      })
      .catch(() => setError('Failed to load tour'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out this tour: ${listing?.title}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Inject SEO meta tags
  useEffect(() => {
    if (!listing) return;
    const title = listing.metaTitle || listing.title;
    const description = listing.metaDescription || listing.shortDescription || '';
    const keywords = listing.metaKeywords || '';
    const ogImage = listing.ogImage || (() => { try { return JSON.parse(listing.images || '[]')[0]; } catch { return ''; } })();

    document.title = `${title} | TransRentals Wander`;

    const setMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    if (ogImage) setMeta('og:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`, true);
    setMeta('og:type', 'website', true);
    setMeta('og:url', window.location.href, true);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);
    setMeta('twitter:card', 'summary_large_image');
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">Tour not found</h2>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <Link href="/wander" className="text-indigo-600 hover:underline text-sm">← Back to Tours</Link>
        </div>
      </div>
    );
  }

  // Parse JSON fields
  const images = parseJSON(listing.images, []);
  const highlights = parseJSON(listing.highlights, []);
  const itinerary = parseJSON(listing.itinerary, []);
  const inclusions = parseJSON(listing.inclusions, []);
  const exclusions = parseJSON(listing.exclusions, []);
  const vehicleOptions = parseJSON(listing.vehicleOptions, []);
  const priceTiers = parseJSON(listing.priceTiers, []);
  const guideLanguages = parseJSON(listing.guideLanguages, []);
  const availableDays = parseJSON(listing.availableDays, []);
  const customPlaces: { name: string }[] = parseJSON(listing.customPlaces, []);
  const cancelInfo = CANCEL_LABELS[listing.cancellationPolicy] || CANCEL_LABELS.MODERATE;

  const priceLabel = listing.priceType === 'ON_REQUEST'
    ? null
    : listing.basePrice
      ? `₹${Number(listing.basePrice).toLocaleString('en-IN')}`
      : null;
  const priceSuffix = listing.priceType === 'PER_PERSON' ? 'per person' : listing.priceType === 'PER_GROUP' ? 'per group' : '';

  const isPreviewMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      {isPreviewMode && (
        <div className="bg-amber-400 text-amber-900 text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span>👁️ Preview Mode — This tour is not yet published</span>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/wander" className="hover:text-indigo-600 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Tours
          </Link>
          <ChevronRight className="w-3 h-3" />
          {listing.category && (
            <>
              <span>{listing.category.icon} {listing.category.name}</span>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT / MAIN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Gallery */}
            <Gallery
              images={images}
              title={listing.title}
              meta={{
                category: listing.category || null,
                location: listing.mainLocation?.name || null,
                duration: listing.duration || null,
                rating: listing.rating > 0 ? listing.rating : null,
                totalRatings: listing.totalRatings,
                popular: (listing._count?.quoteRequests ?? 0) > 5,
              }}
            />

            {/* Info below image */}
            <div>
              {listing.shortDescription && (
                <p className="text-gray-500 text-base leading-relaxed mb-5">{listing.shortDescription}</p>
              )}

              {/* Quick stats — only additional info not already shown in gallery */}
              <div className="flex flex-wrap gap-2">
                {(listing.minGroupSize > 1 || listing.maxGroupSize) && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {listing.maxGroupSize
                      ? `${listing.minGroupSize || 1}–${listing.maxGroupSize} pax`
                      : `Min ${listing.minGroupSize} pax`}
                  </span>
                )}
                {guideLanguages.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> {guideLanguages.join(', ')}
                  </span>
                )}
                {listing.tourStartDate && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {new Date(listing.tourStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {listing.tourEndDate && ` – ${new Date(listing.tourEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </span>
                )}
              </div>

              {/* Share row */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 mr-1">Share:</span>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition border border-emerald-200/80"
                >
                  <span className="text-sm">💬</span> WhatsApp
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</>
                  ) : (
                    <><Info className="w-3.5 h-3.5" /> Copy Link</>
                  )}
                </button>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">About this Tour</h2>
                <div
                  className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-emerald-700 prose-strong:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(listing.description) }}
                />
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  </span>
                  Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Itinerary</h2>
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100" />
                  <div className="space-y-0">
                    {itinerary.map((stop: any, i: number) => (
                      <div key={i} className="relative flex gap-4 pb-6">
                        <div className="w-10 h-10 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-lg">
                          {stop.emoji || '📍'}
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
                          <h3 className="font-bold text-gray-900 text-sm">{stop.title}</h3>
                          {stop.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{stop.description}</p>
                          )}
                          {stop.activities?.filter(Boolean).length > 0 && (
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
            )}

            {/* Inclusions & Exclusions */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inclusions.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Included
                      </p>
                      <div className="space-y-2">
                        {inclusions.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" /> Not Included
                      </p>
                      <div className="space-y-2">
                        {exclusions.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Options */}
            {vehicleOptions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Available Vehicles</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicleOptions.map((v: string, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-xl">
                      <Car className="w-3.5 h-3.5 text-indigo-400" /> {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Places */}
            {customPlaces.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Places You'll Visit</h2>
                <div className="flex flex-wrap gap-2">
                  {customPlaces.map((p: { name: string }, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm px-3 py-1.5 rounded-xl">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            {(listing.priceType === 'ON_REQUEST' || priceLabel || priceTiers.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pricing</h2>
                {priceTiers.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Group Size</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {priceTiers.map((t: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">
                              {t.groupSize ? `${t.groupSize} persons` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                              {t.price ? `₹${Number(t.price).toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : priceLabel ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <span className="text-3xl font-black text-indigo-700">{priceLabel}</span>
                    {priceSuffix && <span className="text-sm text-indigo-400 ml-2">{priceSuffix}</span>}
                  </div>
                ) : (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-lg font-bold text-indigo-700">Price on Request</p>
                    <p className="text-sm text-indigo-400 mt-1">Get a custom quote tailored to your group & dates</p>
                  </div>
                )}
              </div>
            )}

            {/* Available Days */}
            {availableDays.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Available Days</h2>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((d, i) => (
                    <div key={d}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        availableDays.includes(i)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Cancellation Policy</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className={`font-bold mb-1 ${cancelInfo.color}`}>{cancelInfo.label}</p>
                <p className="text-sm text-gray-600">{cancelInfo.desc}</p>
                {listing.cancellationNotes && (
                  <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-200">{listing.cancellationNotes}</p>
                )}
              </div>
            </div>

            {/* Pickup info */}
            {(listing.pickupType || listing.meetingPoint) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pickup Information</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                  {listing.pickupType && (
                    <p><span className="font-semibold text-gray-700">Type:</span> {
                      listing.pickupType === 'HOTEL_PICKUP' ? 'Hotel Pickup'
                      : listing.pickupType === 'FIXED_POINT' ? 'Fixed Meeting Point'
                      : listing.pickupType
                    }</p>
                  )}
                  {listing.meetingPoint && (
                    <p><span className="font-semibold text-gray-700">Meeting Point:</span> {listing.meetingPoint}</p>
                  )}
                  {listing.advanceNoticeHours && (
                    <p><span className="font-semibold text-gray-700">Advance Notice:</span> {listing.advanceNoticeHours} hours required</p>
                  )}
                </div>
              </div>
            )}

            {/* Mobile: inline form */}
            <div className="lg:hidden bg-white border border-indigo-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(79,70,229,0.1)]">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-200" /> Get a Free Quote
                </h2>
                <p className="text-xs text-indigo-200 mt-0.5">Vendors will reply with custom pricing</p>
              </div>
              <div className="p-5 space-y-3">
              <QuoteForm
                listingId={listing.id}
                listingTitle={listing.title}
                priceType={listing.priceType}
                basePrice={listing.basePrice}
                priceTiers={priceTiers}
                requireAdvancePayment={listing.requireAdvancePayment}
                advancePaymentType={listing.advancePaymentType}
                advancePaymentValue={listing.advancePaymentValue}
              />
              </div>
            </div>
          </div>

          {/* ── RIGHT / SIDEBAR ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Price + Quote card — premium */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(79,70,229,0.12),0_1px_4px_rgba(0,0,0,0.06)] border border-indigo-100/60">
                {/* Gradient header */}
                <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 py-5">
                  {listing.priceType === 'ON_REQUEST' ? (
                    <div>
                      <p className="text-indigo-200 text-xs font-medium mb-1">Price</p>
                      <p className="text-3xl font-black text-white">Custom Quote</p>
                      <p className="text-indigo-200 text-xs mt-1">Tailored to your group & dates</p>
                    </div>
                  ) : priceLabel ? (
                    <div>
                      <p className="text-indigo-200 text-xs font-medium mb-1">Starting from</p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-3xl font-black text-white">{priceLabel}</p>
                        {priceSuffix && <p className="text-indigo-200 text-sm">{priceSuffix}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-indigo-200 text-xs font-medium mb-1">Pricing</p>
                      <p className="text-2xl font-black text-white">Get Free Quote</p>
                    </div>
                  )}
                  {/* Quick stats */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/20">
                    {listing.duration && (
                      <div className="flex items-center gap-1.5 text-indigo-100 text-xs">
                        <Clock className="w-3.5 h-3.5" /> {listing.duration}
                      </div>
                    )}
                    {listing.mainLocation?.name && (
                      <div className="flex items-center gap-1.5 text-indigo-100 text-xs">
                        <MapPin className="w-3.5 h-3.5" /> {listing.mainLocation.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Request a Quote — It's Free
                  </h3>
                  <QuoteForm
                    listingId={listing.id}
                    listingTitle={listing.title}
                    priceType={listing.priceType}
                    basePrice={listing.basePrice}
                    priceTiers={priceTiers}
                    requireAdvancePayment={listing.requireAdvancePayment}
                    advancePaymentType={listing.advancePaymentType}
                    advancePaymentValue={listing.advancePaymentValue}
                  />
                </div>
              </div>

              {/* Vendor Profile Card */}
              {listing.vendor && (
                <VendorCard vendor={listing.vendor} listingCount={listing.vendor._count?.wander_listings} />
              )}

              {/* Trust badges */}
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50/40 border border-gray-200/80 rounded-2xl p-4">
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: 'Verified vendor', sub: 'Background checked & approved' },
                    { icon: Star, text: 'Trusted by travelers', sub: '1000+ bookings completed' },
                    { icon: Sparkles, text: 'No commitment', sub: 'Free quotes, cancel anytime' },
                  ].map(b => (
                    <div key={b.text} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <b.icon className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{b.text}</p>
                        <p className="text-[10px] text-gray-400">{b.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar Tours in sidebar */}
              {similarListings.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">You Might Also Like</p>
                  <div className="space-y-2.5">
                    {similarListings.map(s => <SimilarCard key={s.id} listing={s} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <ReviewsSection listingId={listing.id} />
      </div>

      {/* Similar Tours — full width below reviews (mobile) */}
      {similarListings.length > 0 && (
        <div className="lg:hidden bg-gray-50 border-t border-gray-100 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">More Tours</p>
            <h3 className="text-lg font-black text-gray-900 mb-4">You Might Also Like</h3>
            <div className="space-y-3">
              {similarListings.map(s => <SimilarCard key={s.id} listing={s} />)}
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-4 py-3 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {priceLabel ? (
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Starting from</p>
              <p className="font-black text-gray-900 text-lg leading-tight">{priceLabel} <span className="text-xs text-gray-400 font-normal">{priceSuffix}</span></p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Price on request</p>
              <p className="font-bold text-indigo-600 text-sm">Custom Quote</p>
            </div>
          )}
          <button
            onClick={() => document.querySelector('.lg\\:hidden.bg-white')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
          >
            Get Free Quote
          </button>
        </div>
      </div>
    </div>
  );
}
