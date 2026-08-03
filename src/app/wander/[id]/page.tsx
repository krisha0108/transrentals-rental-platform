// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Compass, MapPin, Clock, Users, ChevronLeft, ChevronRight,
  Check, X, Star, Shield, Globe, Loader2, AlertCircle,
  Calendar, Phone, Mail, User, MessageSquare, ChevronDown,
  Car, Info, ArrowLeft, ArrowRight, Sparkles, CheckCircle, Building2, UserPlus, TrendingUp, Images,
  Lock, Eye, EyeOff,
  Utensils, Coffee, Camera, Mountain, Waves, Trees, Landmark, Footprints, ShoppingBag, BedDouble, Sunrise, Flag, Ship, Plane, Bus, Train, Tent, Wine,
} from 'lucide-react';

// Pick a contextual timeline icon from an itinerary stop's title / activities / description.
function getStopIcon(stop: any) {
  const text = [stop?.title, stop?.description, ...(Array.isArray(stop?.activities) ? stop.activities : [])]
    .filter(Boolean).join(' ').toLowerCase().replace(/<[^>]*>/g, ' ');
  // match at word starts so "views" / "temples" hit, but internal substrings
  // (e.g. "eat" inside "breathtaking") do not.
  const has = (...w: string[]) => w.some((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text));
  if (has('lunch', 'dinner', 'meal', 'food', 'restaurant', 'dining', 'thali', 'buffet')) return Utensils;
  if (has('breakfast', 'tea', 'coffee', 'snack', 'cafe', 'refreshment', 'brunch')) return Coffee;
  if (has('wine', 'brewery', 'drinks', 'nightlife')) return Wine;
  if (has('flight', 'airport', 'fly', 'plane')) return Plane;
  if (has('train', 'railway', 'metro')) return Train;
  if (has('bus', 'coach')) return Bus;
  if (has('cruise', 'ferry', 'boat', 'yacht', 'kayak')) return Ship;
  if (has('return', 'drop-off', 'drop off', 'depart to', 'back to', 'transfer', 'drive back', 'homeward', 'journey back')) return Car;
  if (has('pickup', 'pick up', 'pick-up', 'departure', 'start', 'begin', 'assemble', 'meet', 'kick off')) return Flag;
  if (has('camp', 'bonfire', 'tent', 'glamping')) return Tent;
  if (has('waterfall', 'river', 'lake', 'beach', 'water', 'dam', 'stream', 'falls')) return Waves;
  if (has('hike', 'trek', 'mountain', 'hill', 'climb', 'peak', 'valley', 'cliff')) return Mountain;
  if (has('walk', 'stroll', 'leisure walk', 'promenade')) return Footprints;
  if (has('temple', 'mandir', 'monument', 'heritage', 'museum', 'fort', 'palace', 'mosque', 'church', 'landmark', 'shrine', 'stepwell', 'mahal', 'gurudwara')) return Landmark;
  if (has('garden', 'park', 'nature', 'forest', 'zoo', 'wildlife', 'sanctuary', 'botanical', 'jungle', 'safari')) return Trees;
  if (has('photo', 'sightsee', 'viewpoint', 'view point', 'scenic', 'gallery', 'circuit')) return Camera;
  if (has('shopping', 'market', 'bazaar', 'mall', 'souvenir', 'shop')) return ShoppingBag;
  if (has('hotel', 'resort', 'check-in', 'checkin', 'check in', 'stay', 'rest', 'overnight', 'lodge')) return BedDouble;
  if (has('sunrise', 'sunset', 'morning')) return Sunrise;
  return MapPin;
}

// Rich-text description that collapses to the first `limit` block-level elements
// (paragraphs/headings/lists) with a "View more" toggle to reveal the rest.
function CollapsibleRichText({ html, className, limit = 2 }: { html: string; className?: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const blocks = useMemo(() => {
    if (typeof window === 'undefined' || !html) return null;
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nodes = Array.from(doc.body.children).map((n) => (n as HTMLElement).outerHTML);
      return nodes.length ? nodes : null;
    } catch { return null; }
  }, [html]);

  // Can't split, or already short enough — render everything, no toggle.
  if (!blocks || blocks.length <= limit) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const shown = expanded ? blocks : blocks.slice(0, limit);
  return (
    <div className="relative">
      <div className="relative">
        <div className={className} dangerouslySetInnerHTML={{ __html: shown.join('') }} />
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/70 to-transparent" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="relative mt-4 inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-all hover:border-teal-300 hover:bg-teal-50"
      >
        {expanded ? 'View less' : 'View more'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
import { sanitizeRichText } from '@/lib/utils/sanitize';

function parseJSON(str: any, fallback: any) {
  if (Array.isArray(str) || (str && typeof str === 'object')) return str;
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

const CANCEL_LABELS: Record<string, { label: string; desc: string; color: string; tint: string; ring: string }> = {
  FLEXIBLE: { label: 'Flexible', desc: 'Full refund up to 24 hrs before', color: 'text-emerald-600', tint: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-200/70' },
  MODERATE: { label: 'Moderate', desc: 'Full refund up to 48 hrs before', color: 'text-amber-600', tint: 'bg-amber-50 text-amber-700', ring: 'ring-amber-200/70' },
  STRICT: { label: 'Strict', desc: 'No refund after confirmation', color: 'text-red-600', tint: 'bg-red-50 text-red-700', ring: 'ring-red-200/70' },
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

  /* ── hero already shows the first image; nothing extra below when 0/1 image ── */
  if (images.length <= 1) return null;

  const gridImages = images.slice(1); // hero already shows images[0]
  const shown = gridImages.slice(0, 5);
  const more = gridImages.length - shown.length;

  return (
    <>
      {/* ══ PHOTO GRID (remaining images — reference style) ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 auto-rows-[100px] sm:auto-rows-[125px]">
        {shown.map((src, i) => {
          const big = i === 0;
          const isLast = i === shown.length - 1;
          return (
            <button
              key={i}
              onClick={() => setLightboxIdx(i + 1)}
              className={`relative group overflow-hidden rounded-2xl ${big ? 'col-span-2 row-span-2' : ''}`}
            >
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {isLast && more > 0 && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white">
                  <Images className="w-5 h-5 mb-1" />
                  <span className="text-sm font-semibold">+{more} photos</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

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
          className="block w-full text-sm text-teal-600 hover:underline"
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
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${bookingFor === 'PERSONAL' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  Personal
                </button>
                <button type="button" onClick={() => setBookingFor('COMPANY')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${bookingFor === 'COMPANY' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  For Company
                </button>
              </div>
              {bookingFor === 'COMPANY' && loggedInCustomer.companyName && (
                <p className="text-xs text-teal-600 mt-1.5 pl-1">Booking under: <span className="font-semibold">{loggedInCustomer.companyName}</span></p>
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
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Phone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="10-digit"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" required placeholder="you@example.com"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
          <div className="col-span-2 mt-1 p-3 bg-teal-50/60 border border-teal-100 rounded-xl">
            <p className="text-[11px] font-semibold text-teal-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Set a password to track your quote
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={form.password} onChange={e => set('password', e.target.value)}
                    type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Min 8 characters"
                    className="w-full pl-8 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Group Size</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={form.groupSize} onChange={e => set('groupSize', e.target.value)}
              type="number" min="1" max="200"
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Special Requirements</label>
        <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
          rows={3} placeholder="Any specific needs, dietary requirements, accessibility..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
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
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-600 font-medium">
                {priceType === 'PER_PERSON'
                  ? `Estimated for ${qty} person${qty !== 1 ? 's' : ''}`
                  : 'Estimated total'}
              </span>
              <span className="text-lg font-black text-teal-700">
                ~₹{estPrice.toLocaleString('en-IN')}
              </span>
            </div>
            {priceType === 'PER_PERSON' && basePrice && (
              <p className="text-xs text-teal-400">₹{Number(basePrice).toLocaleString('en-IN')} × {qty} person{qty !== 1 ? 's' : ''}</p>
            )}
            {advAmt && (
              <div className="border-t border-teal-100 pt-1.5 flex items-center justify-between">
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  ⚡ Advance required
                  {advancePaymentType === 'PERCENTAGE' ? ` (${advancePaymentValue}%)` : ''}
                </span>
                <span className="text-sm font-bold text-amber-700">₹{advAmt.toLocaleString('en-IN')}</span>
              </div>
            )}
            <p className="text-[10px] text-teal-400">Final price confirmed by vendor in the quote</p>
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
                className="inline-block mt-1.5 font-semibold text-teal-600 hover:underline"
              >
                Login to your account →
              </Link>
            )}
          </div>
        </div>
      )}
      <button
        type="submit" disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 flex items-center justify-center gap-2"
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
    <div className="bg-gradient-to-br from-gray-50 to-teal-50/30 border border-gray-200/80 rounded-2xl p-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Your Tour Operator</p>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {showLogo ? (
            <img src={vendor.logo} alt={vendor.businessName} onError={() => setLogoError(true)} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white">
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
      className="group flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:shadow-md hover:border-teal-100 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-teal-50">
        {cover ? (
          <img src={cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">{listing.category?.icon || '🗺️'}</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">{listing.title}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          {listing.duration && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {listing.duration}</span>
          )}
          {listing.basePrice && (
            <span className="text-xs font-bold text-teal-600">₹{Number(listing.basePrice).toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-400 flex-shrink-0 self-center transition-colors" />
    </Link>
  );
}

/* ─── Section kicker (editorial eyebrow) ─────────────────────────────────────── */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-teal-700">
      <span className="h-px w-8 bg-teal-600/50" /> {children}
    </div>
  );
}

/* ─── RelatedCard (reference-style image card) ───────────────────────────────── */
function RelatedCard({ listing }: { listing: any }) {
  const imgs: string[] = Array.isArray(listing.images) ? listing.images : (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const cover = imgs[0] || null;
  return (
    <Link
      href={`/wander/${listing.slug || listing.id}`}
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.32)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        {cover ? (
          <img src={cover} alt={listing.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-teal-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {listing.duration && (
          <div className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-800 backdrop-blur">{listing.duration}</div>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          {listing.mainLocation?.name && (
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{listing.mainLocation.name}</p>
          )}
          <h3 className="mt-0.5 font-display text-lg font-light leading-snug line-clamp-2 drop-shadow">{listing.title}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1.5 text-sm">
          {listing.rating > 0 ? (
            <><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> <span className="font-semibold text-slate-800">{Number(listing.rating).toFixed(1)}</span></>
          ) : (
            <span className="text-slate-400 text-xs">New tour</span>
          )}
        </div>
        {listing.basePrice ? (
          <p className="text-sm"><span className="text-slate-400">from </span><span className="font-bold text-slate-900">₹{Number(listing.basePrice).toLocaleString('en-IN')}</span></p>
        ) : (
          <span className="text-xs font-semibold text-teal-700">Get quote</span>
        )}
      </div>
    </Link>
  );
}

/* ─── FAQ accordion (editorial) ──────────────────────────────────────────────── */
function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    { q: 'How do I book this tour?', a: "Send a free quote request through the form — the operator replies with custom pricing for your group and dates. No payment is needed to enquire." },
    { q: 'Can I customise the itinerary?', a: 'Yes. Mention your preferences in the "Special requirements" box and the operator will tailor stops, pace and inclusions to your group.' },
    { q: "What's the cancellation policy?", a: 'It follows the operator\'s policy shown in the "Cancellation Policy" section above — most allow a full refund up to 48 hours before departure.' },
    { q: 'Is this suitable for families and groups?', a: 'Absolutely. Group pricing tiers make it cost-effective for families and larger groups — share your group size to get the best rate.' },
    { q: 'How will I get my confirmation?', a: 'Once you accept a quote, you receive confirmation and the operator\'s contact on WhatsApp and email — support is available before, during and after your trip.' },
  ];
  return (
    <div>
      <Kicker>Questions, answered</Kicker>
      <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">The details worth knowing.</h2>
      <div className="space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden transition-shadow hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-900">{f.q}</span>
                <span className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full transition-colors ${isOpen ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {isOpen && <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{f.a}</div>}
            </div>
          );
        })}
      </div>
    </div>
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
          // Fetch similar tours — prefer same category, fall back to other tours to fill
          const catParam = l.categoryId ? `&categoryIds=${l.categoryId}` : '';
          fetch(`/api/wander/listings?limit=6&page=1${catParam}`)
            .then(r => r.json())
            .then(sd => {
              const others = (sd.listings || []).filter((s: any) => s.id !== l.id);
              if (others.length < 3 && catParam) {
                // Not enough in this category — top up with any other tours
                return fetch(`/api/wander/listings?limit=6&page=1`)
                  .then(r => r.json())
                  .then(sd2 => {
                    const seen = new Set(others.map((o: any) => o.id));
                    for (const m of (sd2.listings || [])) {
                      if (m.id !== l.id && !seen.has(m.id)) { others.push(m); seen.add(m.id); }
                    }
                    setSimilarListings(others.slice(0, 3));
                  });
              }
              setSimilarListings(others.slice(0, 3));
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
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
          <Link href="/wander" className="text-teal-600 hover:underline text-sm">← Back to Tours</Link>
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
    <div className="wander-lux min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .wander-lux{ background:#FAFAF8; }
        .wander-lux .font-display{ font-family:var(--font-display),"Fraunces",Georgia,serif; letter-spacing:-.02em; }
        .wander-lux .wg-chip{ display:inline-flex; align-items:center; gap:.4rem; padding:.4rem .85rem; border-radius:9999px; font-size:11px; font-weight:600; letter-spacing:.02em; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.24); backdrop-filter:blur(12px); color:#fff; }
        .wander-lux .wg-btn-luxe{ background:linear-gradient(135deg,#0F766E,#14B8A6); color:#fff; box-shadow:0 10px 40px -8px rgba(15,118,110,.5); transition:transform .3s, box-shadow .3s; }
        .wander-lux .wg-btn-luxe:hover{ transform:translateY(-2px); box-shadow:0 16px 52px -8px rgba(15,118,110,.6); }
        .wander-lux .wg-btn-ghost{ border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.1); color:#fff; backdrop-filter:blur(12px); transition:background .3s; }
        .wander-lux .wg-btn-ghost:hover{ background:rgba(255,255,255,.2); }
        @keyframes lux-kenburns{ 0%{transform:scale(1.02);} 100%{transform:scale(1.06);} }
        .wander-lux .wg-kenburns{ animation:lux-kenburns 20s ease-out infinite alternate; }
        @media (prefers-reduced-motion:reduce){ .wander-lux .wg-kenburns{ animation:none !important; } }
      ` }} />
      {/* Preview banner */}
      {isPreviewMode && (
        <div className="bg-amber-400 text-amber-900 text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span>👁️ Preview Mode — This tour is not yet published</span>
        </div>
      )}

      {/* ══════════════ PREMIUM HERO ══════════════ */}
      <section className="relative h-[68vh] min-h-[540px] w-full overflow-hidden bg-slate-950">
        {images[0] ? (
          <img src={images[0]} alt={listing.title} className="absolute inset-0 h-full w-full object-cover wg-kenburns" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-end px-4 sm:px-6 pb-10 pt-32">
          <div className="text-white max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="wg-chip"><CheckCircle className="w-3.5 h-3.5" /> Verified Tour</span>
              {(listing._count?.quoteRequests ?? 0) > 5 && <span className="wg-chip"><Sparkles className="w-3.5 h-3.5" /> Bestseller</span>}
              {listing.category && <span className="wg-chip">{listing.category.icon} {listing.category.name}</span>}
              {listing.mainLocation?.name && <span className="wg-chip"><MapPin className="w-3.5 h-3.5" /> {listing.mainLocation.name}</span>}
            </div>
            <h1 className="font-display font-light leading-[1.0] tracking-tight" style={{ fontSize: 'clamp(2rem,4.6vw,3.75rem)' }}>
              {listing.title}
            </h1>
            {listing.shortDescription && (
              <p className="mt-3.5 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed line-clamp-2">{listing.shortDescription}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/85">
              {listing.rating > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</span>
                  {Number(listing.rating).toFixed(1)}{listing.totalRatings ? ` · ${listing.totalRatings} reviews` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/20 backdrop-blur">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> New · No reviews yet
                </span>
              )}
              {listing.duration && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {listing.duration}</span>}
              {(listing.minGroupSize > 1 || listing.maxGroupSize) && (
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {listing.maxGroupSize ? `${listing.minGroupSize || 1}–${listing.maxGroupSize} pax` : `Min ${listing.minGroupSize} pax`}</span>
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="wg-btn-luxe inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Book now{priceLabel ? ` · from ${priceLabel}` : ''} <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={handleWhatsApp} className="wg-btn-ghost inline-flex items-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-medium">
                💬 WhatsApp
              </button>
              <button onClick={handleShare} className="wg-btn-ghost inline-flex items-center gap-1.5 rounded-full px-5 py-3.5 text-sm font-medium">
                <Info className="w-4 h-4" /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/wander" className="hover:text-teal-600 flex items-center gap-1">
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
          <div className="lg:col-span-2 space-y-10 sm:space-y-14">

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

            {/* At a glance — quick facts grid */}
            <div>
              <Kicker>At a glance</Kicker>
              <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">Everything, taken care of.</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[
                  listing.duration && { icon: Clock, label: 'Duration', value: listing.duration },
                  (listing.minGroupSize > 1 || listing.maxGroupSize) && { icon: Users, label: 'Group size', value: listing.maxGroupSize ? `${listing.minGroupSize || 1}–${listing.maxGroupSize} pax` : `Min ${listing.minGroupSize} pax` },
                  listing.mainLocation?.name && { icon: MapPin, label: 'Location', value: listing.mainLocation.name },
                  listing.tourStartDate && { icon: Calendar, label: 'Dates', value: `${new Date(listing.tourStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${listing.tourEndDate ? ` – ${new Date(listing.tourEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}` },
                  guideLanguages.length > 0 && { icon: Globe, label: 'Languages', value: guideLanguages.join(', ') },
                  listing.pickupType && { icon: Car, label: 'Pickup', value: listing.pickupType === 'HOTEL_PICKUP' ? 'Hotel pickup' : listing.pickupType === 'FIXED_POINT' ? 'Meeting point' : 'Included' },
                  cancelInfo && { icon: Shield, label: 'Cancellation', value: cancelInfo.label || 'Flexible' },
                  inclusions.length > 0 && { icon: Check, label: 'Inclusions', value: `${inclusions.length} included` },
                  { icon: CheckCircle, label: 'Local guide', value: 'Included' },
                ].filter(Boolean).map((c: any) => (
                  <div key={c.label} className="group rounded-2xl border border-slate-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-24px_rgba(15,23,42,0.25)]">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description — premium editorial */}
            {listing.description && (
              <div>
                <Kicker>About this journey</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-4 max-w-2xl">
                  The story behind this journey.
                </h2>
                <div className="mb-9 h-px w-24 bg-gradient-to-r from-teal-500 to-amber-400" />
                <div className="grid items-start gap-10 md:grid-cols-[1.85fr_1fr]">
                  {/* Reading column — editorial card with drop-cap + optimal measure */}
                  <div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/70 p-7 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.28)] sm:p-10">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-teal-200/40 to-amber-100/0 blur-3xl" />
                    <div className="pointer-events-none absolute left-0 top-9 bottom-9 w-[3px] rounded-full bg-gradient-to-b from-teal-500 via-teal-400 to-amber-400/70" />
                    <CollapsibleRichText
                      html={sanitizeRichText(listing.description)}
                      limit={2}
                      className="relative font-display prose prose-sm max-w-[62ch] text-[15px] leading-[1.75] tracking-[0.003em] text-slate-600 prose-p:font-normal
                        prose-p:my-0 prose-p:mb-5 last:prose-p:mb-0
                        prose-headings:font-display prose-headings:font-medium prose-headings:text-slate-900 prose-headings:mt-8 prose-headings:mb-3
                        prose-a:text-teal-700 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-strong:font-semibold prose-strong:text-slate-900
                        prose-li:marker:text-teal-500 prose-li:my-1.5
                        [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-[52px] [&>p:first-of-type]:first-letter:font-medium [&>p:first-of-type]:first-letter:leading-[0.7] [&>p:first-of-type]:first-letter:text-teal-700"
                    />
                  </div>
                  <aside className="space-y-4 self-start md:sticky md:top-24">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.6)]">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
                      <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                        <Sparkles className="h-4 w-4 text-amber-400" /> Wander promise
                      </div>
                      <p className="relative mt-4 font-display text-lg font-light leading-snug">
                        Verified local operators, transparent pricing, and real support on WhatsApp — before, during &amp; after your trip.
                      </p>
                    </div>
                    {images[1] && (
                      <div className="group overflow-hidden rounded-3xl ring-1 ring-slate-900/5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)]">
                        <img src={images[1]} alt="" loading="lazy" className="w-full object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <Kicker>Experience highlights</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">Moments you'll never scroll past.</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_rgba(15,23,42,0.28)]">
                      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-amber-300/25 to-teal-400/0 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                      <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lg shadow-teal-500/25 transition-transform group-hover:scale-110">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h3 className="mt-5 font-display text-base font-medium leading-snug text-slate-900">{h}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary — only render when at least one stop has meaningful
                content (title / time / description / activities). Skip the
                section entirely if the agent / vendor never filled stops. */}
            {(() => {
              const visibleStops = (itinerary || []).filter((s: any) => {
                const title = (s?.title || '').trim();
                const time = (s?.time || '').trim();
                const desc = (s?.description || '').toString().replace(/<[^>]*>/g, '').trim();
                const hasActivities = Array.isArray(s?.activities) && s.activities.filter(Boolean).length > 0;
                return !!(title || time || desc || hasActivities);
              });
              if (visibleStops.length === 0) return null;
              return (
              <div>
                <Kicker>Day by day</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">Your day, hour by hour.</h2>
                <ol className="relative space-y-4">
                  <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-teal-600 via-teal-400 to-amber-400" />
                  {visibleStops.map((stop: any, i: number) => (
                    <li key={i} className="relative flex gap-5">
                      {(() => {
                        const StopIcon = getStopIcon(stop);
                        return (
                          <div className="relative z-10 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lg shadow-teal-500/25 ring-4 ring-white">
                            <StopIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                          </div>
                        );
                      })()}
                      <details
                        {...(i === 0 ? { open: true } : {})}
                        className="group flex-1 rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all open:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {stop.time && (
                                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">{stop.time}</span>
                              )}
                              {stop.timeSpent && (
                                <span className="text-xs text-slate-400">· {stop.timeSpent}</span>
                              )}
                            </div>
                            <h3 className="font-display text-lg font-medium text-slate-900">{stop.title}</h3>
                          </div>
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition-transform group-open:rotate-180">
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        </summary>
                        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                          {stop.description && (
                            <div
                              className="text-sm text-slate-500 leading-relaxed prose prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-semibold prose-strong:text-slate-900 prose-p:my-1 prose-headings:my-2"
                              dangerouslySetInnerHTML={{ __html: sanitizeRichText(stop.description) }}
                            />
                          )}
                          {stop.activities?.filter(Boolean).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {stop.activities.filter(Boolean).map((a: string, j: number) => (
                                <span key={j} className="text-xs bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </li>
                  ))}
                </ol>
              </div>
              );
            })()}

            {/* Inclusions & Exclusions */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div>
                <Kicker>What's inside</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">Included &amp; not included.</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {inclusions.length > 0 && (
                    <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/60 p-6 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(16,185,129,0.5)]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4" /> Included
                      </div>
                      <ul className="mt-4 space-y-2.5 text-[14px] text-slate-700">
                        {inclusions.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                              <Check className="h-3 w-3" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="rounded-3xl border border-rose-200/60 bg-rose-50/60 p-6 shadow-[0_20px_50px_-30px_rgba(244,63,94,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(244,63,94,0.42)]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                        <X className="h-4 w-4" /> Not included
                      </div>
                      <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
                        {exclusions.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-rose-100 text-rose-500">
                              <X className="h-3 w-3" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Options */}
            {vehicleOptions.length > 0 && (
              <div>
                <Kicker>Getting around</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-3">Available Vehicles</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicleOptions.map((v: string, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-xl">
                      <Car className="w-3.5 h-3.5 text-teal-400" /> {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Places */}
            {customPlaces.length > 0 && (
              <div>
                <Kicker>Places to visit</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-8">Places you'll visit.</h2>
                {(() => {
                  const pts = customPlaces.slice(0, 9).map((p: { name: string }, i: number, arr: any[]) => ({
                    l: p.name,
                    x: 115 + i * (570 / Math.max(1, arr.length - 1)),
                    y: 165 + Math.sin(i * 0.95) * 85,
                    // first/last labels anchor inward so long names don't clip at edges
                    anchor: arr.length > 1 && i === 0 ? 'start' : arr.length > 1 && i === arr.length - 1 ? 'end' : 'middle',
                  }));
                  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' ');
                  return (
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-teal-50/60 via-white to-amber-50/30">
                      <svg viewBox="0 0 800 340" className="h-64 w-full md:h-80">
                        <defs>
                          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0F766E" />
                            <stop offset="100%" stopColor="#F59E0B" />
                          </linearGradient>
                          <pattern id="rdots" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="rgba(15,118,110,0.16)" />
                          </pattern>
                        </defs>
                        <rect width="800" height="340" fill="url(#rdots)" />
                        <path d={d} fill="none" stroke="url(#routeGrad)" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="9" fill="white" stroke="#0F766E" strokeWidth="2" />
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#0F766E" />
                            <text x={p.x} y={p.y + (i % 2 ? 26 : -16)} textAnchor={p.anchor} style={{ fontSize: '11px', fontWeight: 600, fill: '#334155' }}>{p.l}</text>
                          </g>
                        ))}
                      </svg>
                      <div className="grid grid-cols-3 gap-4 border-t border-teal-100/70 bg-white/70 p-6 backdrop-blur">
                        <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Stops</p><p className="mt-1 text-lg font-semibold text-slate-900">{customPlaces.length} places</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Duration</p><p className="mt-1 text-lg font-semibold text-slate-900">{listing.duration || 'Flexible'}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Region</p><p className="mt-1 text-lg font-semibold text-slate-900">{listing.mainLocation?.name || 'India'}</p></div>
                      </div>
                    </div>
                  );
                })()}
                {/* All stops — full list preserved */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {customPlaces.map((p: { name: string }, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 text-xs px-2.5 py-1.5 rounded-lg">
                      <MapPin className="w-3 h-3 text-teal-500" /> {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            {(listing.priceType === 'ON_REQUEST' || priceLabel || priceTiers.length > 0) && (
              <div>
                <Kicker>Investment</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-6">Pricing</h2>
                {priceTiers.length > 0 ? (
                  <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.25)]">
                    <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 text-white">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/85">Group size</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/85">Price / person</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {priceTiers.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-teal-50/40">
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <Users className="h-4 w-4 text-teal-500" />
                            {t.groupSize ? `${t.groupSize} persons` : '—'}
                          </span>
                          <span className="font-display text-lg font-semibold text-slate-900">
                            {t.price ? `₹${Number(t.price).toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white py-5 pl-7 pr-6 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.28)]">
                    <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-teal-500 to-amber-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">{priceLabel ? 'Starting from' : 'Custom pricing'}</p>
                    {priceLabel ? (
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-4xl font-medium tracking-tight text-slate-900">{priceLabel}</span>
                        {priceSuffix && <span className="text-sm font-light text-slate-400">/ {priceSuffix}</span>}
                      </div>
                    ) : (
                      <p className="mt-2 font-display text-3xl font-medium tracking-tight text-slate-900">Price on request</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Available Days */}
            {availableDays.length > 0 && (
              <div>
                <Kicker>Availability</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-3">Available Days</h2>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((d, i) => (
                    <div key={d}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        availableDays.includes(i)
                          ? 'bg-teal-600 text-white'
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
              <Kicker>Good to know</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-6">Cancellation Policy</h2>
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/70 p-7 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.25)] sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-100/40 to-amber-100/0 blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl ring-1 ${cancelInfo.tint} ${cancelInfo.ring}`}>
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cancelInfo.tint}`}>
                      {cancelInfo.label} cancellation
                    </span>
                    <p className="mt-2.5 font-display text-xl font-medium leading-snug text-slate-900">{cancelInfo.desc}</p>
                  </div>
                </div>
                {listing.cancellationNotes && (
                  <div className="relative mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <Info className="h-3.5 w-3.5" /> Good to know
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">{listing.cancellationNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pickup info */}
            {(listing.pickupType || listing.meetingPoint) && (
              <div>
                <Kicker>Meeting point</Kicker>
                <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-6">Pickup Information</h2>
                <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-1 divide-y divide-slate-100">
                  {listing.pickupType && (
                    <div className="flex items-start gap-3 py-3">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pickup type</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">{
                          listing.pickupType === 'HOTEL_PICKUP' ? 'Hotel Pickup'
                          : listing.pickupType === 'FIXED_POINT' ? 'Fixed Meeting Point'
                          : listing.pickupType
                        }</p>
                      </div>
                    </div>
                  )}
                  {listing.meetingPoint && (
                    <div className="flex items-start gap-3 py-3">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Meeting points</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {listing.meetingPoint.split(',').map((m: string, i: number) => {
                            const t = m.trim();
                            return t ? (
                              <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{t}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {listing.advanceNoticeHours && (
                    <div className="flex items-start gap-3 py-3">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Advance notice</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">{listing.advanceNoticeHours} hours required</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAQ */}
            <FaqAccordion />

            {/* Why Wander — the trust behind the trip */}
            <div>
              <Kicker>Why Wander</Kicker>
              <h2 className="font-display text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] mb-6">The trust behind the trip.</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Shield, title: 'Verified vendor', copy: 'Background checked & approved.' },
                  { icon: Star, title: 'Trusted by travelers', copy: '1000+ bookings completed.' },
                  { icon: Sparkles, title: 'No commitment', copy: 'Free quotes, cancel anytime.' },
                ].map((t) => (
                  <div
                    key={t.title}
                    className="group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-200 hover:shadow-[0_28px_60px_-28px_rgba(13,148,136,0.35)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-600 via-teal-400 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lg shadow-teal-500/25 transition-transform duration-300 group-hover:scale-110">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-medium text-slate-900">{t.title}</h3>
                    <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">{t.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: inline form */}
            <div className="lg:hidden bg-white border border-teal-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(79,70,229,0.1)]">
              <div className="bg-gradient-to-r from-teal-600 to-teal-600 px-5 py-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-200" /> Get a Free Quote
                </h2>
                <p className="text-xs text-teal-200 mt-0.5">Vendors will reply with custom pricing</p>
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
            <div id="book" className="sticky top-24 space-y-4">
              {/* Price + Quote card — premium */}
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-[0_10px_50px_-20px_rgba(15,23,42,0.28)]">
                {/* Premium green gradient header */}
                <div className="relative overflow-hidden px-6 pt-6 pb-5 bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-500 text-white">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
                  <div className="relative">
                    {listing.priceType === 'ON_REQUEST' ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">Price</p>
                        <p className="font-display text-3xl font-medium">Custom Quote</p>
                        <p className="text-white/80 text-xs mt-1">Tailored to your group &amp; dates</p>
                      </div>
                    ) : priceLabel ? (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Starting from</p>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-white/20 px-2 py-0.5 rounded-full">No booking fee</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <p className="font-display text-4xl font-semibold tracking-tight">{priceLabel}</p>
                          {priceSuffix && <p className="text-white/70 text-sm">{priceSuffix}</p>}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">Pricing</p>
                        <p className="font-display text-2xl font-medium">Get Free Quote</p>
                      </div>
                    )}
                    {/* Quick stats */}
                    {(listing.duration || listing.mainLocation?.name) && (
                      <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4">
                        {listing.duration && (
                          <div className="flex items-center gap-1.5 text-white/90 text-xs">
                            <Clock className="w-3.5 h-3.5" /> {listing.duration}
                          </div>
                        )}
                        {listing.mainLocation?.name && (
                          <div className="flex items-center gap-1.5 text-white/90 text-xs">
                            <MapPin className="w-3.5 h-3.5" /> {listing.mainLocation.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-500" />
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
                  {/* Micro-features */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-teal-600 flex-shrink-0" /> Secure — no payment needed to enquire</span>
                    <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-600 flex-shrink-0" /> Free to cancel · vendors reply fast</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-teal-600 flex-shrink-0" /> Compare multiple quotes</span>
                  </div>
                </div>
              </div>

              {/* Vendor Profile Card */}
              {listing.vendor && (
                <VendorCard vendor={listing.vendor} listingCount={listing.vendor._count?.wander_listings} />
              )}

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

      {/* Similar Tours — full width below reviews (mobile) */}
      {similarListings.length > 0 && (
        <div className="lg:hidden bg-gray-50 border-t border-gray-100 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">More Tours</p>
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
              <p className="font-bold text-teal-600 text-sm">Custom Quote</p>
            </div>
          )}
          <button
            onClick={() => document.querySelector('.lg\\:hidden.bg-white')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/30 active:scale-95 transition-transform"
          >
            Get Free Quote
          </button>
        </div>
      </div>
    </div>
  );
}
