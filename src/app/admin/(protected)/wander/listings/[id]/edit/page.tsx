// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Compass, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Plus, Trash2, MapPin, Search, X, Clock, Car, GripVertical, Coffee,
  CalendarRange, ChevronDown, Eye, Images, Calendar, Save, Sparkles,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Category & Title' },
  { id: 2, label: 'Location & Places' },
  { id: 3, label: 'Overview' },
  { id: 4, label: 'Itinerary' },
  { id: 5, label: 'Pricing & Vehicle' },
  { id: 6, label: 'Inclusions & Images' },
];

const DURATION_OPTIONS = [
  'Half Day (4-5 hrs)', 'Full Day (8-10 hrs)', '2 Days 1 Night',
  '3 Days 2 Nights', '4 Days 3 Nights', '5 Days 4 Nights',
  '6 Days 5 Nights', '7 Days 6 Nights', 'Custom',
];

const VEHICLE_OPTIONS = [
  'Sedan', 'SUV', 'MUV', 'Tempo Traveller (12 Seater)',
  'Tempo Traveller (17 Seater)', 'Mini Bus', 'Bus', 'Luxury Car',
];

const COMMON_INCLUSIONS = [
  'Hotel Pickup & Drop', 'AC Vehicle', 'Professional Driver',
  'Breakfast', 'Lunch', 'Dinner', 'Hotel Stay',
  'Tour Guide', 'Entry Tickets', 'Fuel Charges',
  'Toll Charges', 'Parking Charges', 'Bottled Water',
];

const COMMON_EXCLUSIONS = [
  'Entry Tickets (if any)', 'Water Sports Activities',
  'Lunch & Personal Expenses', 'Club Entry Fees',
  'Tips & Gratuities', 'Travel Insurance',
  'Camera Fees', 'Alcohol', 'Room Service',
];

const STOP_EMOJIS = ['🏖', '🏰', '⛪', '🌅', '🍽', '🌊', '🏝', '🌙', '🚗', '🎭', '🛕', '🏔', '🦁', '🌿', '🎪'];

const CANCELLATION_OPTIONS = [
  { value: 'FLEXIBLE', label: 'Flexible', desc: 'Full refund up to 24 hrs before' },
  { value: 'MODERATE', label: 'Moderate', desc: 'Full refund up to 48 hrs before' },
  { value: 'STRICT', label: 'Strict', desc: 'No refund after booking confirmed' },
];

function safeJson(val: string | null, fallback: any) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function toDateInput(val: string | Date | null): string {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

function listingToForm(l: any) {
  const rawPriceType = l.priceType || 'GROUP_BASED';
  const priceType = rawPriceType === 'PER_GROUP' ? 'GROUP_BASED' : rawPriceType;

  const rawPlaces = safeJson(l.customPlaces, []);
  const places = rawPlaces.map((p: any) => (typeof p === 'string' ? p : p.name || '')).filter(Boolean);

  const pickupAreas = l.pickupType === 'HOTEL_PICKUP' && l.meetingPoint
    ? l.meetingPoint.split(', ').filter(Boolean)
    : [];

  const rawItinerary = safeJson(l.itinerary, []);
  const itinerary = rawItinerary.length > 0
    ? rawItinerary.map((stop: any, i: number) => ({
        id: Date.now() + i,
        type: stop.type || 'stop',
        emoji: stop.emoji || '📍',
        time: stop.time || '',
        title: stop.title || '',
        description: stop.description || '',
        activities: Array.isArray(stop.activities) && stop.activities.length > 0 ? stop.activities : [''],
        timeSpent: stop.timeSpent || '',
        breakNote: stop.breakNote || '',
      }))
    : [{ id: Date.now(), type: 'stop', emoji: '🚗', time: '', title: '', description: '', activities: [''], timeSpent: '', breakNote: '' }];

  const rawPriceTiers = safeJson(l.priceTiers, []);
  const priceTiers = rawPriceTiers.length > 0
    ? rawPriceTiers.map((t: any) => ({ groupSize: String(t.groupSize || ''), price: String(t.price || '') }))
    : [{ groupSize: '2', price: '' }, { groupSize: '4', price: '' }];

  const rawDuration = l.duration || '';
  const isCustomDuration = rawDuration && !DURATION_OPTIONS.slice(0, -1).includes(rawDuration);

  const tourStartDate = toDateInput(l.tourStartDate);
  const tourEndDate = toDateInput(l.tourEndDate);

  return {
    categoryId: l.categoryId || '',
    subCategoryId: l.subCategoryId || '',
    experienceId: l.experienceId || '',
    title: l.title || '',
    shortDescription: l.shortDescription || '',
    mainLocationId: l.mainLocationId || '',
    placesTag: '',
    places,
    pickupAreaInput: '',
    pickupAreas,
    description: l.description || '',
    duration: isCustomDuration ? 'Custom' : rawDuration,
    customDuration: isCustomDuration ? rawDuration : '',
    highlights: safeJson(l.highlights, ['']).length > 0 ? safeJson(l.highlights, ['']) : [''],
    isFixedDate: !!(tourStartDate),
    tourStartDate,
    tourEndDate,
    itinerary,
    priceType,
    basePrice: l.basePrice ? String(l.basePrice) : '',
    priceTiers,
    vehicleOptions: safeJson(l.vehicleOptions, []),
    advanceNoticeHours: l.advanceNoticeHours ?? 24,
    cancellationPolicy: l.cancellationPolicy || 'MODERATE',
    cancellationNotes: l.cancellationNotes || '',
    requireAdvancePayment: l.requireAdvancePayment || false,
    advancePaymentType: l.advancePaymentType || 'PERCENTAGE',
    advancePaymentValue: l.advancePaymentValue ? String(l.advancePaymentValue) : '',
    inclusions: safeJson(l.inclusions, []),
    customInclusion: '',
    exclusions: safeJson(l.exclusions, []),
    customExclusion: '',
    images: safeJson(l.images, []),
  };
}

// ─── Preview Gallery ──────────────────────────────────────────────────────────

function PreviewGallery({ images, title }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const timerRef = React.useRef(null);

  useEffect(() => {
    if (images.length <= 1 || paused || lightboxIdx !== null) return;
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % images.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, paused, lightboxIdx]);

  const goTo   = (i) => { setCurrent(i); setPaused(true); };
  const goPrev = () => goTo((current - 1 + images.length) % images.length);
  const goNext = () => goTo((current + 1) % images.length);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setLightboxIdx(i => (i + 1) % images.length);
      if (e.key === 'Escape')     setLightboxIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, images.length]);

  if (!images.length) {
    return (
      <div className="relative w-full h-64 md:h-[400px] bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-3 shadow-lg border border-white">
            <span className="text-4xl">🗺️</span>
          </div>
          <p className="text-sm font-semibold text-gray-500">No photos added yet</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-64 md:h-[400px] overflow-hidden bg-gray-900 select-none"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {images.map((src, i) => (
          <img key={i} src={src} alt={i === 0 ? title : ''} onClick={() => setLightboxIdx(i)}
            className={`absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-20 pointer-events-none" />
        {images.length > 1 && (
          <>
            <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-lg"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-lg"><ChevronRight className="w-5 h-5" /></button>
          </>
        )}
        <div className="absolute bottom-3 left-0 right-0 z-30 px-4 flex items-center justify-between">
          {images.length > 1 ? (
            <div className="flex items-center gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
              ))}
            </div>
          ) : <span />}
          <button onClick={() => setLightboxIdx(current)} className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors border border-white/10">
            <Images className="w-3.5 h-3.5" /> {images.length > 1 ? `${current + 1} / ${images.length}` : '1 photo'}
          </button>
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 px-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => goTo(i)} className={`flex-shrink-0 w-14 h-9 rounded-lg overflow-hidden transition-all duration-200 ${i === current ? 'ring-2 ring-indigo-500 ring-offset-1 opacity-100' : 'opacity-50 hover:opacity-90'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95" onClick={() => setLightboxIdx(null)}>
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/10" onClick={e => e.stopPropagation()}>
            <span className="text-white/50 text-sm font-medium">{lightboxIdx + 1} / {images.length}</span>
            <p className="text-white font-semibold text-sm truncate max-w-xs">{title}</p>
            <button onClick={() => setLightboxIdx(null)} className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-14 min-h-0" onClick={e => e.stopPropagation()}>
            <img src={images[lightboxIdx]} alt={title} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" style={{ maxHeight: 'calc(100vh - 180px)' }} />
            {images.length > 1 && (
              <>
                <button onClick={() => setLightboxIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-3 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setLightboxIdx(i => (i + 1) % images.length)} className="absolute right-3 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes slideProgress { from { width: 0% } to { width: 100% } }`}</style>
    </>
  );
}

// ─── Tour Preview Modal ───────────────────────────────────────────────────────

const CANCEL_INFO = {
  FLEXIBLE: { label: 'Flexible', icon: '✅', desc: 'Full refund if cancelled 24 hrs before', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MODERATE: { label: 'Moderate', icon: '⚠️', desc: 'Full refund if cancelled 48 hrs before', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  STRICT:   { label: 'Strict',   icon: '🚫', desc: 'No refund after booking confirmed',      color: 'text-red-700',   bg: 'bg-red-50',     border: 'border-red-200' },
};

function TourPreviewModal({ form, selectedLocation, onClose }) {
  const images         = form.images.filter(Boolean);
  const highlights     = form.highlights.filter(Boolean);
  const itinerary      = (form.itinerary || []).filter(s => s.title?.trim() || s.breakNote?.trim());
  const inclusions     = form.inclusions || [];
  const exclusions     = form.exclusions || [];
  const vehicleOptions = form.vehicleOptions || [];
  const priceTiers     = (form.priceTiers || []).filter(t => t.price);
  const duration       = form.duration === 'Custom' ? form.customDuration : form.duration;
  const cancelInfo     = CANCEL_INFO[form.cancellationPolicy] || CANCEL_INFO.MODERATE;
  const locationName   = selectedLocation?.displayName || selectedLocation?.name || '';

  const lowestPrice = form.priceType === 'PER_PERSON' && form.basePrice
    ? Number(form.basePrice)
    : form.priceType === 'GROUP_BASED' && priceTiers.length > 0
      ? Math.min(...priceTiers.filter(t => t.price).map(t => Number(t.price)))
      : null;
  const priceDisplay = lowestPrice ? `₹${lowestPrice.toLocaleString('en-IN')}` : null;
  const priceSuffix  = form.priceType === 'PER_PERSON' ? 'per person' : form.priceType === 'GROUP_BASED' ? 'per group' : '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[998] flex flex-col bg-white">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono truncate">
          transrentals.in/wander/{form.title ? form.title.toLowerCase().replace(/\s+/g, '-').substring(0, 40) : 'your-tour'}
        </div>
        <span className="flex-shrink-0 text-[10px] font-black bg-amber-400 text-amber-900 px-2 py-0.5 rounded tracking-widest uppercase">Preview</span>
        <button onClick={onClose} className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg transition">
          <X className="w-3.5 h-3.5" /> Close Preview
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
            <Compass className="w-3.5 h-3.5" /><span>Tours</span><ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium truncate">{form.title || 'Your Tour'}</span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <PreviewGallery images={images} title={form.title || 'Tour Preview'} />
            <div>
              <h1 className="text-2xl md:text-[2rem] font-black text-gray-900 mb-3 leading-tight tracking-tight">
                {form.title || <span className="text-gray-300 italic font-light">Tour title here…</span>}
              </h1>
              {form.shortDescription && <p className="text-gray-500 text-base leading-relaxed mb-4">{form.shortDescription}</p>}
              <div className="flex flex-wrap gap-2">
                {locationName && <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {locationName}</span>}
                {duration && <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {duration}</span>}
                {form.places?.length > 0 && <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl"><Compass className="w-3.5 h-3.5 text-indigo-400" /> {form.places.slice(0, 3).join(', ')}{form.places.length > 3 ? ` +${form.places.length - 3} more` : ''}</span>}
                {form.isFixedDate && form.tourStartDate && <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {new Date(form.tourStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{form.tourEndDate ? ` – ${new Date(form.tourEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</span>}
                {form.pickupAreas?.length > 0 && <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl"><Car className="w-3.5 h-3.5 text-indigo-400" /> Hotel Pickup Available</span>}
              </div>
            </div>
            {form.description?.trim() && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">About this Tour</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{form.description}</p>
              </div>
            )}
            {highlights.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /></span>
                  Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-white" /></span>{h}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {itinerary.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Itinerary</h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-100" />
                  <div className="space-y-0">
                    {itinerary.map((stop, i) => (
                      <div key={i} className="relative flex gap-4 pb-6">
                        <div className="w-10 h-10 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-lg">{stop.emoji || '📍'}</div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {stop.time && <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">{stop.time}</span>}
                            {stop.timeSpent && <span className="text-xs text-gray-400">{stop.timeSpent}</span>}
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm">{stop.title || stop.breakNote}</h3>
                          {stop.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{stop.description}</p>}
                          {stop.activities?.filter(Boolean).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {stop.activities.filter(Boolean).map((a, j) => (
                                <span key={j} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
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
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inclusions.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Included</p>
                      <div className="space-y-2">{inclusions.map((item, i) => <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> {item}</div>)}</div>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Not Included</p>
                      <div className="space-y-2">{exclusions.map((item, i) => <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600"><X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {item}</div>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {vehicleOptions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Available Vehicles</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicleOptions.map((v, i) => <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-xl"><Car className="w-3.5 h-3.5 text-indigo-400" /> {v}</span>)}
                </div>
              </div>
            )}
            {(form.priceType === 'ON_REQUEST' || priceDisplay || priceTiers.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pricing</h2>
                {priceTiers.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-4 py-2.5 font-semibold text-gray-600">Group Size</th><th className="text-right px-4 py-2.5 font-semibold text-gray-600">Price</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">{priceTiers.map((t, i) => <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-2.5 text-gray-700">{t.groupSize ? `${t.groupSize} persons` : '—'}</td><td className="px-4 py-2.5 text-right font-bold text-gray-900">₹{Number(t.price).toLocaleString('en-IN')}</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : priceDisplay ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <span className="text-3xl font-black text-indigo-700">{priceDisplay}</span>
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
            {(form.priceType === 'ON_REQUEST' || priceDisplay || priceTiers.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Cancellation Policy</h2>
                <div className={`${cancelInfo.bg} ${cancelInfo.border} border rounded-xl p-4`}>
                  <p className={`font-bold mb-1 ${cancelInfo.color}`}>{cancelInfo.label}</p>
                  <p className="text-sm text-gray-600">{cancelInfo.desc}</p>
                  {form.cancellationNotes?.trim() && <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-200">{form.cancellationNotes}</p>}
                </div>
              </div>
            )}
            {form.pickupAreas?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pickup Information</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                  <p><span className="font-semibold text-gray-700">Type:</span> Hotel Pickup</p>
                  <p><span className="font-semibold text-gray-700">Areas:</span> {form.pickupAreas.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEditWanderListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [categories, setCategories] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [experiences, setExperiences] = useState([]);

  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const locationRef = useRef(null);
  const fileInputRef = useRef(null);

  // Restore step from URL on mount
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('step');
    const n = parseInt(s || '1');
    if (n >= 1 && n <= 6) setStep(n);
  }, []);

  // Fetch listing data
  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/admin/wander/listings/${listingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); return; }
        setForm(listingToForm(data));
        if (data.mainLocation) {
          setSelectedLocation({
            id: data.mainLocation.id,
            name: data.mainLocation.name,
            displayName: data.mainLocation.name,
            type: data.mainLocation.type,
          });
          setLocationSearch(data.mainLocation.name);
        }
      })
      .catch(() => setFetchError('Failed to load listing'))
      .finally(() => setLoadingListing(false));
  }, [listingId]);

  useEffect(() => {
    fetch('/api/admin/wander/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d.filter(c => c.isActive) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form?.categoryId) { setExperiences([]); return; }
    fetch(`/api/admin/wander/experiences?categoryId=${form.categoryId}`)
      .then(r => r.json())
      .then(d => setExperiences(Array.isArray(d) ? d : []))
      .catch(() => setExperiences([]));
  }, [form?.categoryId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocations([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!locationSearch || locationSearch.length < 2) { setLocations([]); return; }
    if (selectedLocation && locationSearch === (selectedLocation.displayName || selectedLocation.name)) return;
    const timer = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/admin/wander/locations?search=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch { setLocations([]); }
      finally { setLocationLoading(false); }
    }, 150);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const subCategories = categories.find(c => c.id === form?.categoryId)?.subCategories?.filter(s => s.isActive) ?? [];

  function update(field: string, value: any) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'categoryId') { next.subCategoryId = ''; next.experienceId = ''; }
      return next;
    });
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!form.categoryId) { setError('Please select a category'); return; }
      if (!form.title.trim()) { setError('Please enter a tour title'); return; }
    }
    if (step === 2 && !form.mainLocationId) { setError('Please select a main location'); return; }
    if (step === 3) {
      if (!form.duration) { setError('Please select a duration'); return; }
      if (form.isFixedDate && !form.tourStartDate) { setError('Please select a start date'); return; }
      if (form.isFixedDate && !form.tourEndDate) { setError('Please select an end date'); return; }
      if (form.isFixedDate && form.tourStartDate > form.tourEndDate) { setError('End date must be after start date'); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length));
  }

  function addPlace(name: string) {
    const t = name.trim();
    if (t && !form.places.includes(t)) update('places', [...form.places, t]);
    update('placesTag', '');
  }

  function addPickupArea(name: string) {
    const t = name.trim();
    if (t && !form.pickupAreas.includes(t)) update('pickupAreas', [...form.pickupAreas, t]);
    update('pickupAreaInput', '');
  }

  function addStop() {
    update('itinerary', [...form.itinerary, { id: Date.now(), type: 'stop', emoji: '📍', time: '', title: '', description: '', activities: [''], timeSpent: '' }]);
  }

  function updateStop(idx: number, field: string, value: any) {
    const updated = [...form.itinerary];
    updated[idx] = { ...updated[idx], [field]: value };
    update('itinerary', updated);
  }

  function removeStop(idx: number) { update('itinerary', form.itinerary.filter((_: any, i: number) => i !== idx)); }

  function addActivity(si: number) {
    const updated = [...form.itinerary];
    updated[si] = { ...updated[si], activities: [...updated[si].activities, ''] };
    update('itinerary', updated);
  }

  function updateActivity(si: number, ai: number, value: string) {
    const updated = [...form.itinerary];
    const acts = [...updated[si].activities];
    acts[ai] = value;
    updated[si] = { ...updated[si], activities: acts };
    update('itinerary', updated);
  }

  function removeActivity(si: number, ai: number) {
    const updated = [...form.itinerary];
    updated[si].activities = updated[si].activities.filter((_: any, i: number) => i !== ai);
    update('itinerary', updated);
  }

  function addBreak() {
    update('itinerary', [...form.itinerary, { id: Date.now(), type: 'break', emoji: '☕', time: '', title: 'Break', description: '', activities: [], timeSpent: '', breakNote: '' }]);
  }

  const dragIdx = React.useRef<number | null>(null);
  function handleDragStart(idx: number) { dragIdx.current = idx; }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const items = [...form.itinerary];
    const dragged = items.splice(dragIdx.current, 1)[0];
    items.splice(idx, 0, dragged);
    dragIdx.current = idx;
    update('itinerary', items);
  }
  function handleDragEnd() { dragIdx.current = null; }

  function updateTier(idx: number, field: string, value: string) {
    const tiers = [...form.priceTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    update('priceTiers', tiers);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      const urls = data.images
        || (data.uploaded ? data.uploaded.map((f: any) => f.url) : null)
        || (data.url ? [data.url] : []);
      update('images', [...form.images, ...urls]);
    } catch { setError('Image upload failed'); }
    finally { setUploadingImages(false); e.target.value = ''; }
  }

  async function handleSubmit(publish = false, openPreview = false) {
    setSaving(true); setError('');
    try {
      const payload = {
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        experienceId: form.experienceId || null,
        mainLocationId: form.mainLocationId,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim(),
        duration: form.duration === 'Custom' ? form.customDuration : form.duration,
        highlights: form.highlights.filter(Boolean),
        customPlaces: form.places.map(p => ({ name: p })),
        itinerary: form.itinerary.map((stop: any, i: number) => ({
          day: i + 1,
          emoji: stop.emoji,
          time: stop.time,
          title: stop.type === 'break' ? (stop.breakNote || stop.title) : stop.title,
          description: stop.description,
          activities: stop.activities.filter(Boolean),
          timeSpent: stop.timeSpent,
        })),
        priceType: form.priceType === 'GROUP_BASED' ? 'PER_GROUP' : form.priceType,
        basePrice: form.priceType === 'PER_PERSON' ? form.basePrice : null,
        priceTiers: form.priceType === 'GROUP_BASED' ? form.priceTiers : null,
        vehicleOptions: form.vehicleOptions,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        images: form.images.filter(Boolean),
        pickupType: form.pickupAreas.length > 0 ? 'HOTEL_PICKUP' : 'FIXED_POINT',
        meetingPoint: form.pickupAreas.join(', '),
        advanceNoticeHours: form.advanceNoticeHours,
        cancellationPolicy: form.cancellationPolicy,
        cancellationNotes: form.cancellationNotes?.trim() || null,
        requireAdvancePayment: form.requireAdvancePayment,
        advancePaymentType: form.requireAdvancePayment ? form.advancePaymentType : null,
        advancePaymentValue: form.requireAdvancePayment ? (parseFloat(form.advancePaymentValue) || null) : null,
        minGroupSize: 1,
        tourStartDate: form.isFixedDate && form.tourStartDate ? form.tourStartDate : null,
        tourEndDate: form.isFixedDate && form.tourEndDate ? form.tourEndDate : null,
        publish,
      };

      const res = await fetch(`/api/admin/wander/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      if (openPreview) setShowPreview(true);
    } catch {
      setError('Failed to save tour');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loadingListing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {fetchError}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Compass className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Edit Tour</h1>
          <p className="text-sm text-gray-500 truncate">{form.title || 'Unnamed Tour'} · Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit(false, false)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition flex-shrink-0 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false, true)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex-shrink-0 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          Save & Preview
        </button>
        <button
          onClick={() => router.push('/admin/wander/listings')}
          className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
        >
          ← Back
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${s.id <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tour Category <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => update('categoryId', cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-left ${form.categoryId === cat.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                    <span className="text-2xl">{cat.icon || '🗺️'}</span>
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    {(cat.subCategories?.filter(s => s.isActive)?.length ?? 0) > 0 && <ChevronDown className="w-3.5 h-3.5 ml-auto text-gray-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {form.categoryId && subCategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sub-Category <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span></label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => update('subCategoryId', '')}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${!form.subCategoryId ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                    All / Any
                  </button>
                  {subCategories.map(sub => (
                    <button key={sub.id} type="button" onClick={() => update('subCategoryId', sub.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition ${form.subCategoryId === sub.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                      {sub.icon && <span>{sub.icon}</span>}{sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.categoryId && experiences.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Experience <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span></label>
                <select value={form.experienceId} onChange={e => update('experienceId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">— Don't link (list as standalone) —</option>
                  {experiences.map(exp => (
                    <option key={exp.id} value={exp.id}>{exp.category?.icon} {exp.title}{exp.location ? ` · ${exp.location.name}` : ''}{exp.duration ? ` · ${exp.duration}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder='e.g. "1 Day Goa Sightseeing Tour Package"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <input type="text" value={form.shortDescription} onChange={e => update('shortDescription', e.target.value.slice(0, 120))}
                placeholder='e.g. "Explore North Goa forts, beaches & markets in one day"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.shortDescription.length}/120</p>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Main Destination <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-3">Primary city/state for this tour</p>
              {selectedLocation ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">{selectedLocation.displayName || selectedLocation.name}</span>
                    <span className="text-xs text-indigo-400 uppercase">{selectedLocation.type}</span>
                  </div>
                  <button onClick={() => { setSelectedLocation(null); update('mainLocationId', ''); setLocationSearch(''); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={locationRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={locationSearch} onChange={e => setLocationSearch(e.target.value)}
                    placeholder="Search city, state or destination..."
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {locationLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                  {locations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                      {locations.map(loc => (
                        <button key={loc.id} type="button"
                          onClick={() => { setSelectedLocation(loc); update('mainLocationId', loc.id); setLocationSearch(loc.displayName || loc.name); setLocations([]); }}
                          className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-indigo-50 text-sm text-left">
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{loc.displayName || loc.name}</span></div>
                          <span className="text-xs text-gray-400 uppercase">{loc.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Places Covered</label>
              <p className="text-xs text-gray-500 mb-3">Add all stops — press Enter or comma to add</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.places.map(place => (
                  <span key={place} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-sm text-indigo-800">
                    {place}<button onClick={() => update('places', form.places.filter(p => p !== place))} className="text-indigo-400 hover:text-indigo-700 ml-1"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.placesTag} onChange={e => update('placesTag', e.target.value)}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && form.placesTag.trim()) { e.preventDefault(); addPlace(form.placesTag.replace(',', '')); } }}
                  placeholder='Type place name — e.g. "Fort Aguada"'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => { if (form.placesTag.trim()) addPlace(form.placesTag); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Areas</label>
              <p className="text-xs text-gray-500 mb-3">Where can customers be picked up from?</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.pickupAreas.map(area => (
                  <span key={area} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-sm text-indigo-800">
                    <MapPin className="w-3 h-3" /> {area}
                    <button onClick={() => update('pickupAreas', form.pickupAreas.filter(a => a !== area))} className="text-indigo-400 hover:text-indigo-700 ml-1"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.pickupAreaInput} onChange={e => update('pickupAreaInput', e.target.value)}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && form.pickupAreaInput.trim()) { e.preventDefault(); addPickupArea(form.pickupAreaInput.replace(',', '')); } }}
                  placeholder='Type area — e.g. "Calangute", "Baga"'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => { if (form.pickupAreaInput.trim()) addPickupArea(form.pickupAreaInput); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DURATION_OPTIONS.map(d => (
                  <button key={d} type="button" onClick={() => update('duration', d)}
                    className={`py-2 px-3 rounded-lg border text-sm transition ${form.duration === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-indigo-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
              {form.duration === 'Custom' && (
                <input type="text" value={form.customDuration} onChange={e => update('customDuration', e.target.value)}
                  placeholder="e.g. 10 Days 9 Nights"
                  className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
                placeholder="Describe this tour..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tour Highlights</label>
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-9 flex items-center text-gray-400 text-sm">✦</span>
                  <input type="text" value={h} onChange={e => { const u = [...form.highlights]; u[i] = e.target.value; update('highlights', u); }}
                    placeholder="e.g. Visit iconic beaches of North Goa"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {form.highlights.length > 1 && (
                    <button onClick={() => update('highlights', form.highlights.filter((_: any, idx: number) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => update('highlights', [...form.highlights, ''])}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-1">
                <Plus className="w-4 h-4" /> Add Highlight
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => update('isFixedDate', !form.isFixedDate)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex items-center gap-2.5">
                  <CalendarRange className="w-4 h-4 text-indigo-500" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">Fixed Tour Dates</p>
                    <p className="text-xs text-gray-500">This tour only runs between specific dates</p>
                  </div>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-colors flex items-center px-0.5 ${form.isFixedDate ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFixedDate ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.isFixedDate && (
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-gray-200 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.tourStartDate}
                      onChange={e => { update('tourStartDate', e.target.value); if (form.tourEndDate && e.target.value > form.tourEndDate) update('tourEndDate', ''); }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.tourEndDate} min={form.tourStartDate}
                      onChange={e => update('tourEndDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Add time-based stops — drag <GripVertical className="w-3.5 h-3.5 inline text-gray-400" /> to reorder</p>
            {form.itinerary.map((stop: any, si: number) => (
              <div key={stop.id} draggable onDragStart={() => handleDragStart(si)} onDragOver={e => handleDragOver(e, si)} onDragEnd={handleDragEnd}
                className={`border rounded-xl overflow-hidden transition-shadow ${stop.type === 'break' ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-white'}`}>
                {stop.type === 'break' ? (
                  <div className="flex items-center gap-3 px-3 py-3">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><Coffee className="w-4 h-4 text-indigo-600" /></div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input type="text" value={stop.time} onChange={e => updateStop(si, 'time', e.target.value)} placeholder="Time" className="w-32 border border-indigo-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      <input type="text" value={stop.breakNote} onChange={e => updateStop(si, 'breakNote', e.target.value)} placeholder="Break note" className="flex-1 border border-indigo-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      <input type="text" value={stop.timeSpent} onChange={e => updateStop(si, 'timeSpent', e.target.value)} placeholder="Duration" className="w-28 border border-indigo-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex-shrink-0">BREAK</span>
                    <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 border-b border-gray-200">
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                      <div className="relative group">
                        <button type="button" className="text-2xl leading-none hover:scale-110 transition">{stop.emoji}</button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-10 w-48">
                          {STOP_EMOJIS.map(em => (
                            <button key={em} type="button" onClick={() => updateStop(si, 'emoji', em)} className="w-8 h-8 text-lg hover:bg-indigo-50 rounded-lg flex items-center justify-center">{em}</button>
                          ))}
                        </div>
                      </div>
                      <input type="text" value={stop.time} onChange={e => updateStop(si, 'time', e.target.value)} placeholder="Time (e.g. 10:00 AM)" className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="text" value={stop.title} onChange={e => updateStop(si, 'title', e.target.value)} placeholder="Stop name" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                      {form.itinerary.filter(s => s.type === 'stop').length > 1 && (
                        <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <textarea value={stop.description} onChange={e => updateStop(si, 'description', e.target.value)} rows={2} placeholder="Description..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">Activities at this stop</p>
                        {stop.activities.map((act: string, ai: number) => (
                          <div key={ai} className="flex gap-2 mb-1.5">
                            <span className="flex-shrink-0 text-gray-400 text-sm mt-1.5">•</span>
                            <input type="text" value={act} onChange={e => updateActivity(si, ai, e.target.value)} placeholder="e.g. Lighthouse viewpoint" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            {stop.activities.length > 1 && <button onClick={() => removeActivity(si, ai)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
                          </div>
                        ))}
                        <button type="button" onClick={() => addActivity(si)} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1"><Plus className="w-3.5 h-3.5" /> Add activity</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input type="text" value={stop.timeSpent} onChange={e => updateStop(si, 'timeSpent', e.target.value)} placeholder="Time spent (e.g. 45 minutes)" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={addStop} className="flex items-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-sm text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition justify-center"><Plus className="w-4 h-4" /> Add Stop</button>
              <button type="button" onClick={addBreak} className="flex items-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-sm text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition justify-center"><Coffee className="w-4 h-4" /> Add Break</button>
            </div>
          </div>
        )}

        {/* ── STEP 5 ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: 'GROUP_BASED', label: 'Group Size Based', desc: 'Different price per group size' }, { value: 'PER_PERSON', label: 'Per Person', desc: 'Fixed price per traveler' }, { value: 'ON_REQUEST', label: 'On Request', desc: 'Price on enquiry' }].map(pt => (
                  <button key={pt.value} type="button" onClick={() => update('priceType', pt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition ${form.priceType === pt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                    <p className="text-sm font-semibold text-gray-800">{pt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.priceType === 'GROUP_BASED' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Tiers</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500 px-1"><span>Group Size</span><span>Price (₹)</span></div>
                  {form.priceTiers.map((tier: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <input type="text" value={tier.groupSize} onChange={e => updateTier(i, 'groupSize', e.target.value)} placeholder="e.g. 2, 4 or Upto 4" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                          <input type="number" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="2999" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {form.priceTiers.length > 1 && <button onClick={() => update('priceTiers', form.priceTiers.filter((_: any, idx: number) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => update('priceTiers', [...form.priceTiers, { groupSize: '', price: '' }])} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-1"><Plus className="w-4 h-4" /> Add Tier</button>
                </div>
              </div>
            )}

            {form.priceType === 'PER_PERSON' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price Per Person (₹)</label>
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" value={form.basePrice} onChange={e => update('basePrice', e.target.value)} placeholder="1500" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Options</label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_OPTIONS.map(v => (
                  <button key={v} type="button" onClick={() => { const curr = form.vehicleOptions; update('vehicleOptions', curr.includes(v) ? curr.filter(x => x !== v) : [...curr, v]); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${form.vehicleOptions.includes(v) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                    <Car className="w-3 h-3" /> {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Advance Notice (hours)</label>
                <input type="number" value={form.advanceNoticeHours} onChange={e => update('advanceNoticeHours', parseInt(e.target.value) || 24)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cancellation Policy</label>
                <select value={form.cancellationPolicy} onChange={e => update('cancellationPolicy', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {CANCELLATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Refund / Cancellation Notes</label>
              <textarea value={form.cancellationNotes} onChange={e => update('cancellationNotes', e.target.value)} rows={3}
                placeholder="e.g. Cancellations must be made via WhatsApp..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => update('requireAdvancePayment', !form.requireAdvancePayment)}
                className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition">
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Require Advance Payment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Collect partial payment upfront on quote acceptance</p>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-4 ${form.requireAdvancePayment ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requireAdvancePayment ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.requireAdvancePayment && (
                <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    {[{ value: 'PERCENTAGE', label: '% Percentage', hint: 'e.g. 30% of total' }, { value: 'FIXED', label: '₹ Fixed Amount', hint: 'e.g. ₹2,000 flat' }].map(opt => (
                      <button key={opt.value} type="button" onClick={() => update('advancePaymentType', opt.value)}
                        className={`flex-1 p-3 rounded-xl border-2 text-left transition ${form.advancePaymentType === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                        <p className={`text-sm font-bold ${form.advancePaymentType === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.hint}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{form.advancePaymentType === 'PERCENTAGE' ? '%' : '₹'}</span>
                    <input type="number" value={form.advancePaymentValue} onChange={e => update('advancePaymentValue', e.target.value)}
                      placeholder={form.advancePaymentType === 'PERCENTAGE' ? '30' : '2000'}
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 6 ── */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✅ Tour Includes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INCLUSIONS.map(inc => (
                  <button key={inc} type="button" onClick={() => { const curr = form.inclusions; update('inclusions', curr.includes(inc) ? curr.filter(x => x !== inc) : [...curr, inc]); }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${form.inclusions.includes(inc) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                    {inc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.customInclusion} onChange={e => update('customInclusion', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && form.customInclusion.trim()) { update('inclusions', [...form.inclusions, form.customInclusion.trim()]); update('customInclusion', ''); } }}
                  placeholder="Type custom inclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => { if (form.customInclusion.trim()) { update('inclusions', [...form.inclusions, form.customInclusion.trim()]); update('customInclusion', ''); } }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex-shrink-0"><Plus className="w-4 h-4" /> Add</button>
              </div>
              {form.inclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.inclusions.map(inc => (
                    <span key={inc} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-800">
                      ✅ {inc}<button onClick={() => update('inclusions', form.inclusions.filter(x => x !== inc))} className="ml-1 text-indigo-400 hover:text-indigo-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">❌ Tour Excludes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_EXCLUSIONS.map(exc => (
                  <button key={exc} type="button" onClick={() => { const curr = form.exclusions; update('exclusions', curr.includes(exc) ? curr.filter(x => x !== exc) : [...curr, exc]); }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${form.exclusions.includes(exc) ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-red-200'}`}>
                    {exc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.customExclusion} onChange={e => update('customExclusion', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && form.customExclusion.trim()) { update('exclusions', [...form.exclusions, form.customExclusion.trim()]); update('customExclusion', ''); } }}
                  placeholder="Type custom exclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => { if (form.customExclusion.trim()) { update('exclusions', [...form.exclusions, form.customExclusion.trim()]); update('customExclusion', ''); } }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium flex-shrink-0"><Plus className="w-4 h-4" /> Add</button>
              </div>
              {form.exclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.exclusions.map(exc => (
                    <span key={exc} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-800">
                      ❌ {exc}<button onClick={() => update('exclusions', form.exclusions.filter(x => x !== exc))} className="ml-1 text-red-400 hover:text-red-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Images</label>
              <p className="text-xs text-gray-500 mb-3">Upload photos or paste image URLs</p>
              {form.images.map((img: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  {img && <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => (e.target as any).style.display = 'none'} />}
                  <input type="text" value={img} onChange={e => { const u = [...form.images]; u[i] = e.target.value; update('images', u); }}
                    placeholder="https://..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => update('images', form.images.filter((_: any, idx: number) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-1 flex-wrap">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60">
                  {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploadingImages ? 'Uploading...' : 'Upload Photos'}
                </button>
                <button type="button" onClick={() => update('images', [...form.images, ''])}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  <Plus className="w-4 h-4" /> Add URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-3">
          {step === STEPS.length ? (
            <>
              <button onClick={() => handleSubmit(false)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save as Draft
              </button>
              <button onClick={() => handleSubmit(true)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save & Publish
              </button>
            </>
          ) : (
            <button onClick={nextStep} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showPreview && form && (
        <TourPreviewModal
          form={form}
          selectedLocation={selectedLocation}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
