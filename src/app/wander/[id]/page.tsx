// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Compass, MapPin, Clock, Users, ChevronLeft, ChevronRight,
  Check, X, Star, Shield, Globe, Loader2, AlertCircle,
  Calendar, Phone, Mail, User, MessageSquare, ChevronDown,
  Car, Info, ArrowLeft, Sparkles, CheckCircle,
} from 'lucide-react';
import ReviewsSection from '@/components/wander/ReviewsSection';

function parseJSON(str: string | null, fallback: any) {
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
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="h-72 md:h-[420px] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center rounded-2xl">
        <span className="text-8xl opacity-30">🗺️</span>
      </div>
    );
  }
  return (
    <div className="relative rounded-2xl overflow-hidden h-72 md:h-[420px] bg-gray-900">
      <img src={images[active]} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActive(i => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`rounded-full transition-all ${i === active ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-10 right-3 flex flex-col gap-1 max-h-32 overflow-y-auto">
          {images.slice(0, 4).map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-12 h-9 rounded overflow-hidden border-2 transition ${i === active ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
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
  const [loggedInCustomer, setLoggedInCustomer] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', travelDate: '', groupSize: '2', pickupLocation: '', requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const token = localStorage.getItem('customerToken') || localStorage.getItem('token');
      const raw = localStorage.getItem('customer');
      if (token && raw) {
        const c = JSON.parse(raw);
        if (c?.name && c?.phone) {
          setLoggedInCustomer({ name: c.name, phone: c.phone, email: c.email || '' });
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
    if (!form.travelDate) return setError('Travel date is required');

    setSubmitting(true);
    try {
      const res = await fetch('/api/wander/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
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
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {loggedInCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{loggedInCustomer.name}</p>
            <p className="text-xs text-gray-500 truncate">{loggedInCustomer.phone}{loggedInCustomer.email ? ` · ${loggedInCustomer.email}` : ''}</p>
          </div>
        </div>
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
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="Optional"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
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
      {/* Live price estimate */}
      {(() => {
        const qty = parseInt(form.groupSize) || 1;
        let estPrice: number | null = null;
        if (priceType === 'PER_PERSON' && basePrice) {
          estPrice = qty * Number(basePrice);
        } else if (priceType === 'GROUP_BASED' && priceTiers?.length) {
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
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}
      <button
        type="submit" disabled={submitting}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Get Free Quote'}
      </button>
      <p className="text-center text-xs text-gray-400">Free · No payment required · Vendors will contact you</p>
    </form>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function TourDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileForm, setShowMobileForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/wander/listings/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setListing(d);
      })
      .catch(() => setError('Failed to load tour'))
      .finally(() => setLoading(false));
  }, [id]);

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
  const cancelInfo = CANCEL_LABELS[listing.cancellationPolicy] || CANCEL_LABELS.MODERATE;

  const priceLabel = listing.priceType === 'ON_REQUEST'
    ? null
    : listing.basePrice
      ? `₹${Number(listing.basePrice).toLocaleString('en-IN')}`
      : null;
  const priceSuffix = listing.priceType === 'PER_PERSON' ? 'per person' : listing.priceType === 'GROUP_BASED' ? 'per group' : '';

  return (
    <div className="min-h-screen bg-white">
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
            <Gallery images={images} title={listing.title} />

            {/* Title & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {listing.category && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {listing.category.icon} {listing.category.name}
                  </span>
                )}
                {listing._count?.quoteRequests > 5 && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                    🔥 Popular
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">
                {listing.title}
              </h1>

              {listing.shortDescription && (
                <p className="text-gray-600 text-base leading-relaxed mb-4">{listing.shortDescription}</p>
              )}

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {listing.mainLocation?.name && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" /> {listing.mainLocation.name}
                  </span>
                )}
                {listing.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" /> {listing.duration}
                  </span>
                )}
                {(listing.minGroupSize > 1 || listing.maxGroupSize) && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    {listing.maxGroupSize
                      ? `${listing.minGroupSize || 1}–${listing.maxGroupSize} pax`
                      : `Min ${listing.minGroupSize} pax`}
                  </span>
                )}
                {guideLanguages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" /> {guideLanguages.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">About this Tour</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-indigo-600" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {inclusions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Included</p>
                      <div className="space-y-1.5">
                        {inclusions.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Not Included</p>
                      <div className="space-y-1.5">
                        {exclusions.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
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

            {/* Pricing */}
            {(priceLabel || priceTiers.length > 0) && (
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
                ) : null}
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
                    <p><span className="font-semibold text-gray-700">Type:</span> {listing.pickupType}</p>
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
            <div className="lg:hidden bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" /> Get a Free Quote
              </h2>
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

          {/* ── RIGHT / SIDEBAR ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Price summary card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="mb-4 pb-4 border-b border-gray-100">
                  {listing.priceType === 'ON_REQUEST' ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Starting from</p>
                      <p className="text-xl font-black text-indigo-600">Custom Quote</p>
                      <p className="text-xs text-gray-400 mt-1">Based on your group size & dates</p>
                    </div>
                  ) : priceLabel ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Starting from</p>
                      <p className="text-2xl font-black text-gray-900">{priceLabel}</p>
                      {priceSuffix && <p className="text-xs text-gray-400">{priceSuffix}</p>}
                    </div>
                  ) : null}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Request a Quote</h3>
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

              {/* Trust badges */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="space-y-2.5">
                  {[
                    { icon: Shield, text: 'Verified vendor' },
                    { icon: Star, text: 'Trusted by 1000+ travelers' },
                    { icon: Sparkles, text: 'Free quote, no commitment' },
                  ].map(b => (
                    <div key={b.text} className="flex items-center gap-2 text-xs text-gray-600">
                      <b.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <ReviewsSection listingId={listing.id} />
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {priceLabel && (
            <div className="flex-1">
              <p className="text-xs text-gray-500">From</p>
              <p className="font-black text-gray-900">{priceLabel} <span className="text-xs text-gray-400 font-normal">{priceSuffix}</span></p>
            </div>
          )}
          <button
            onClick={() => document.querySelector('.lg\\:hidden.bg-white.border.border-gray-200.rounded-2xl')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm"
          >
            Get Free Quote
          </button>
        </div>
      </div>
    </div>
  );
}
