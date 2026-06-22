// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import {
  Compass, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Plus, Trash2, MapPin, Search, X, Clock, Users, Car, GripVertical, Coffee,
  CalendarRange, ChevronDown, Eye, Sparkles, Images, Calendar, Save,
  Fuel, RefreshCw,
} from 'lucide-react';
import TourDescriptionEditor, { type TourDescriptionEditorRef } from '@/components/admin/wander/TourDescriptionEditor';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

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

const LS_KEY = 'travel_agent_tour_new_draft';

// ─── Preview Modal (lightweight) ─────────────────────────────────────────────

const CANCEL_INFO: Record<string, any> = {
  FLEXIBLE: { label: 'Flexible', desc: 'Full refund if cancelled 24 hrs before', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MODERATE: { label: 'Moderate', desc: 'Full refund if cancelled 48 hrs before', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  STRICT: { label: 'Strict', desc: 'No refund after booking confirmed', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

function PreviewGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  if (!images.length) {
    return (
      <div className="relative w-full h-64 md:h-[400px] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center rounded-2xl border border-emerald-100">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-3 shadow-sm border border-emerald-100">
          <span className="text-4xl">🗺️</span>
        </div>
        <p className="text-sm font-semibold text-gray-500">No photos added yet</p>
      </div>
    );
  }
  return (
    <div className="relative w-full h-64 md:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[current]} alt={title} className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((i) => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

function TourPreviewModal({ form, selectedLocation, onClose }: any) {
  const images = (form.images || []).filter(Boolean);
  const highlights = (form.highlights || []).filter(Boolean);
  const itinerary = (form.itinerary || []).filter((s: any) => s.title?.trim() || s.breakNote?.trim());
  const inclusions = form.inclusions || [];
  const exclusions = form.exclusions || [];
  const priceTiers = (form.priceTiers || []).filter((t: any) => t.price);
  const duration = form.duration === 'Custom' ? form.customDuration : form.duration;
  const cancelInfo = CANCEL_INFO[form.cancellationPolicy] || CANCEL_INFO.MODERATE;
  const locationName = selectedLocation?.displayName || selectedLocation?.name || '';

  const lowestPrice =
    form.priceType === 'PER_PERSON' && form.basePrice
      ? Number(form.basePrice)
      : form.priceType === 'GROUP_BASED' && priceTiers.length > 0
        ? Math.min(...priceTiers.filter((t: any) => t.price).map((t: any) => Number(t.price)))
        : null;
  const priceDisplay = lowestPrice ? `₹${lowestPrice.toLocaleString('en-IN')}` : null;
  const priceSuffix = form.priceType === 'PER_PERSON' ? 'per person' : form.priceType === 'GROUP_BASED' ? 'per group' : '';

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
        <button
          onClick={onClose}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg transition"
        >
          <X className="w-3.5 h-3.5" /> Close Preview
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <PreviewGallery images={images} title={form.title || 'Tour Preview'} />

          <div>
            <h1 className="text-2xl md:text-[2rem] font-black text-gray-900 mb-3 leading-tight tracking-tight">
              {form.title || <span className="text-gray-300 italic font-light">Tour title here…</span>}
            </h1>
            {form.shortDescription && (
              <p className="text-gray-500 text-base leading-relaxed mb-4">{form.shortDescription}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {locationName && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {locationName}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> {duration}
                </span>
              )}
              {form.places?.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" /> {form.places.slice(0, 3).join(', ')}{form.places.length > 3 ? ` +${form.places.length - 3} more` : ''}
                </span>
              )}
            </div>
          </div>

          {form.description?.replace(/<[^>]*>/g, '').trim() && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this Tour</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-emerald-700"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(form.description) }}
              />
            </div>
          )}

          {highlights.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {itinerary.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Itinerary</h2>
              <div className="space-y-3">
                {itinerary.map((stop: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-2xl">{stop.emoji || '📍'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {stop.time && (
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">{stop.time}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{stop.title || stop.breakNote}</h3>
                      {stop.description && <p className="text-xs text-gray-500 mt-1">{stop.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inclusions.length > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Included</p>
                    <div className="space-y-2">
                      {inclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Not Included</p>
                    <div className="space-y-2">
                      {exclusions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(priceDisplay || priceTiers.length > 0 || form.priceType === 'ON_REQUEST') && (
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
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-gray-700">{t.groupSize ? `${t.groupSize} persons` : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">₹{Number(t.price).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : priceDisplay ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <span className="text-3xl font-black text-emerald-700">{priceDisplay}</span>
                  {priceSuffix && <span className="text-sm text-emerald-500 ml-2">{priceSuffix}</span>}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-lg font-bold text-emerald-700">Price on Request</p>
                </div>
              )}

              <div className="mt-4">
                <h2 className="text-base font-bold text-gray-900 mb-2">Cancellation Policy</h2>
                <div className={`${cancelInfo.bg} ${cancelInfo.border} border rounded-xl p-4`}>
                  <p className={`font-bold mb-1 ${cancelInfo.color}`}>{cancelInfo.label}</p>
                  <p className="text-sm text-gray-600">{cancelInfo.desc}</p>
                  {form.cancellationNotes?.trim() && (
                    <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-200">{form.cancellationNotes}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initForm = () => ({
  // Step 1
  categoryId: '',
  subCategoryId: '',
  title: '',
  shortDescription: '',
  // Step 2
  mainLocationId: '',
  placesTag: '',
  places: [] as string[],
  pickupAreaInput: '',
  pickupAreas: [] as string[],
  // Step 3
  description: '',
  duration: '',
  customDuration: '',
  highlights: [''] as string[],
  isFixedDate: false,
  tourStartDate: '',
  tourEndDate: '',
  // Step 4
  itinerary: [
    {
      id: Date.now(),
      type: 'stop',
      emoji: '🚗',
      time: '',
      title: '',
      description: '',
      activities: [''] as string[],
      timeSpent: '',
      breakNote: '',
    },
  ],
  // Step 5
  priceType: 'GROUP_BASED' as 'GROUP_BASED' | 'PER_PERSON' | 'ON_REQUEST',
  basePrice: '',
  priceTiers: [
    { groupSize: '2', price: '' },
    { groupSize: '4', price: '' },
  ],
  vehicleIds: [] as string[],
  advanceNoticeHours: 24,
  cancellationPolicy: 'MODERATE' as 'FLEXIBLE' | 'MODERATE' | 'STRICT',
  cancellationNotes: '',
  requireAdvancePayment: false,
  advancePaymentType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  advancePaymentValue: '',
  // Step 6
  inclusions: [] as string[],
  customInclusion: '',
  exclusions: [] as string[],
  customExclusion: '',
  images: [] as string[],
  termsConditions: '',
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateTravelAgentTourPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(initForm());
  const [categories, setCategories] = useState<any[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const descEditorRef = useRef<TourDescriptionEditorRef | null>(null);

  const locationRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derived: sub-categories of the selected category
  const subCategories =
    categories.find((c: any) => c.id === form.categoryId)?.subCategories?.filter((s: any) => s.isActive) ?? [];

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (saved.form) setForm((prev: any) => ({ ...prev, ...saved.form }));
      if (saved.step && saved.step >= 1 && saved.step <= 6) setStep(saved.step);
      if (saved.selectedLocation) setSelectedLocation(saved.selectedLocation);
    } catch {}
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify({ form, step, selectedLocation })); } catch {}
  }, [form, step, selectedLocation, draftLoaded]);

  // Categories
  useEffect(() => {
    fetch('/api/travel-agent/categories')
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Vehicles (agent fleet)
  useEffect(() => {
    fetch('/api/travel-agent/fleet')
      .then((r) => (r.ok ? r.json() : { fleets: [] }))
      .then((j) => setAvailableVehicles((j.fleets || []).filter((f: any) => f.isActive)))
      .finally(() => setLoadingVehicles(false));
  }, []);

  // AI balance check
  useEffect(() => {
    fetch('/api/travel-agent/tours/ai-status')
      .then((r) => r.json())
      .then((d) => setAiAvailable(d.available !== false))
      .catch(() => setAiAvailable(true));
  }, []);

  async function generateAIDescription() {
    if (!form.title.trim()) { setAiError('Add a tour title first — AI uses it to write the description.'); return; }
    setAiLoading(true); setAiError('');
    try {
      const res = await fetch('/api/travel-agent/tours/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          destination: selectedLocation?.displayName || selectedLocation?.name || '',
          duration: form.duration === 'Custom' ? form.customDuration : form.duration,
          mode: 'full',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 502 && data.error?.includes('402')) {
          setAiAvailable(false);
          setAiError('');
          return;
        }
        setAiError(data.error || 'AI generation failed');
        return;
      }
      const html = `<p>${data.description}</p>`;
      update('description', html);
      descEditorRef.current?.setContent(html);
    } catch {
      setAiError('Network error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocations([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Location search
  useEffect(() => {
    if (locationSearch.length < 2) { setLocations([]); return; }
    const timer = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/travel-agent/locations?search=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch { setLocations([]); }
      finally { setLocationLoading(false); }
    }, 200);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  function update(field: string, value: any) {
    setForm((f: any) => {
      const next = { ...f, [field]: value };
      if (field === 'categoryId') next.subCategoryId = '';
      return next;
    });
  }

  // ── Step nav ───────────────────────────────────────────────────────────────
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
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  // ── Place tags ─────────────────────────────────────────────────────────────
  function addPlace(name: string) {
    const trimmed = name.trim();
    if (trimmed && !form.places.includes(trimmed)) update('places', [...form.places, trimmed]);
    update('placesTag', '');
  }

  function addPickupArea(name: string) {
    const trimmed = name.trim();
    if (trimmed && !form.pickupAreas.includes(trimmed)) update('pickupAreas', [...form.pickupAreas, trimmed]);
    update('pickupAreaInput', '');
  }

  // ── Itinerary helpers ──────────────────────────────────────────────────────
  function addStop() {
    update('itinerary', [
      ...form.itinerary,
      { id: Date.now(), type: 'stop', emoji: '📍', time: '', title: '', description: '', activities: [''], timeSpent: '' },
    ]);
  }
  function updateStop(idx: number, field: string, value: any) {
    const updated = [...form.itinerary];
    updated[idx] = { ...updated[idx], [field]: value };
    update('itinerary', updated);
  }
  function removeStop(idx: number) {
    update('itinerary', form.itinerary.filter((_: any, i: number) => i !== idx));
  }
  function addActivity(stopIdx: number) {
    const updated = [...form.itinerary];
    updated[stopIdx] = { ...updated[stopIdx], activities: [...updated[stopIdx].activities, ''] };
    update('itinerary', updated);
  }
  function updateActivity(stopIdx: number, actIdx: number, value: string) {
    const updated = [...form.itinerary];
    const acts = [...updated[stopIdx].activities];
    acts[actIdx] = value;
    updated[stopIdx] = { ...updated[stopIdx], activities: acts };
    update('itinerary', updated);
  }
  function removeActivity(stopIdx: number, actIdx: number) {
    const updated = [...form.itinerary];
    updated[stopIdx].activities = updated[stopIdx].activities.filter((_: any, i: number) => i !== actIdx);
    update('itinerary', updated);
  }
  function addBreak() {
    update('itinerary', [
      ...form.itinerary,
      { id: Date.now(), type: 'break', emoji: '☕', time: '', title: 'Break', description: '', activities: [], timeSpent: '', breakNote: '' },
    ]);
  }

  // Drag & drop
  const dragIdx = useRef<number | null>(null);
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

  // Price tiers
  function updateTier(idx: number, field: string, value: string) {
    const tiers = [...form.priceTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    update('priceTiers', tiers);
  }

  // Vehicle toggle (agent fleet)
  const toggleVehicle = (id: string) => {
    update(
      'vehicleIds',
      form.vehicleIds.includes(id)
        ? form.vehicleIds.filter((x: string) => x !== id)
        : [...form.vehicleIds, id],
    );
  };

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('folder', 'tours');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      const urls: string[] = Array.isArray(data.uploaded) ? data.uploaded.map((u: any) => u.url) : data.url ? [data.url] : [];
      update('images', [...form.images, ...urls]);
    } catch { setError('Image upload failed'); }
    finally { setUploadingImages(false); (e.target as HTMLInputElement).value = ''; }
  }

  // Submit
  async function handleSubmit(publish: boolean) {
    if (publish && !isApproved) {
      openVerificationModal();
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Compute basePrice / priceTiers / startingPrice
      const apiPriceType =
        form.priceType === 'GROUP_BASED' ? 'PER_GROUP' : form.priceType === 'PER_PERSON' ? 'PER_PERSON' : 'ON_REQUEST';

      const finalDuration = form.duration === 'Custom' ? form.customDuration.trim() : form.duration;

      // Convert tier prices to numbers and pick lowest as startingPrice
      let lowestTier: number | null = null;
      const cleanTiers = (form.priceTiers || []).filter((t: any) => t.price);
      if (cleanTiers.length > 0) {
        lowestTier = Math.min(...cleanTiers.map((t: any) => Number(t.price)));
      }
      const basePriceVal = form.priceType === 'PER_PERSON' && form.basePrice ? Number(form.basePrice) : null;
      const startingPriceVal = basePriceVal != null ? basePriceVal : lowestTier;

      const payload: any = {
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        mainLocationId: form.mainLocationId,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description?.trim() || null,
        duration: finalDuration,
        destination: selectedLocation?.name || selectedLocation?.displayName || null,
        // category legacy free-text
        category: categories.find((c: any) => c.id === form.categoryId)?.name || null,

        priceType: apiPriceType,
        basePrice: basePriceVal,
        startingPrice: startingPriceVal,
        priceTiers: form.priceType === 'GROUP_BASED' ? cleanTiers : null,

        highlights: form.highlights.filter(Boolean),
        customPlaces: form.places.map((p: string) => ({ name: p })),
        itinerary: form.itinerary.map((stop: any, i: number) => ({
          day: i + 1,
          emoji: stop.emoji,
          time: stop.time,
          title: stop.type === 'break' ? (stop.breakNote || stop.title) : stop.title,
          description: stop.description,
          activities: (stop.activities || []).filter(Boolean),
          timeSpent: stop.timeSpent,
          type: stop.type,
        })),
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        termsConditions: form.termsConditions?.trim() || null,

        // Cover/gallery
        coverImage: form.images[0] || null,
        galleryImages: form.images.slice(1).filter(Boolean),

        // Vehicles — agent fleet (Option B) + generic types
        vehicleIds: form.vehicleIds,

        pickupType: form.pickupAreas.length > 0 ? 'HOTEL_PICKUP' : 'FIXED_POINT',
        meetingPoint: form.pickupAreas.join(', '),

        advanceNoticeHours: form.advanceNoticeHours,
        cancellationPolicy: form.cancellationPolicy,
        cancellationNotes: form.cancellationNotes?.trim() || null,
        requireAdvancePayment: form.requireAdvancePayment,
        advancePaymentType: form.requireAdvancePayment ? form.advancePaymentType : null,
        advancePaymentValue:
          form.requireAdvancePayment && form.advancePaymentValue ? parseFloat(form.advancePaymentValue) : null,

        tourStartDate: form.isFixedDate && form.tourStartDate ? form.tourStartDate : null,
        tourEndDate: form.isFixedDate && form.tourEndDate ? form.tourEndDate : null,

        createMode: 'DETAILED',
        status: publish ? 'ACTIVE' : 'DRAFT',
        publish,
      };

      const res = await fetch('/api/travel-agent/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      try { localStorage.removeItem(LS_KEY); } catch {}
      showToast({ type: 'success', title: publish ? 'Tour published' : 'Draft saved' });
      router.push('/travel-agent/tours');
    } catch {
      setError('Failed to save tour');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Create New Tour</h1>
          <p className="text-sm text-gray-500">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-60"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s) => (
          <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${s.id <= step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tour Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => update('categoryId', cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-left ${
                      form.categoryId === cat.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon || '🗺️'}</span>
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    {(cat.subCategories?.filter((s: any) => s.isActive)?.length ?? 0) > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 ml-auto text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {form.categoryId && subCategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sub-Category <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Pick a more specific type under {categories.find((c: any) => c.id === form.categoryId)?.name}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update('subCategoryId', '')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                      !form.subCategoryId ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}
                  >
                    All / Any
                  </button>
                  {subCategories.map((sub: any) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => update('subCategoryId', sub.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                        form.subCategoryId === sub.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                      }`}
                    >
                      {sub.icon && <span>{sub.icon}</span>}
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tour Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder='e.g. "1 Day Goa Sightseeing Tour Package"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <p className="text-xs text-gray-500 mb-2">One-liner shown on listing cards — max 120 characters</p>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => update('shortDescription', e.target.value.slice(0, 120))}
                placeholder='e.g. "Explore North Goa forts, beaches & markets in one day"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.shortDescription.length}/120</p>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Main Destination <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Primary city/state for this tour (from our database)</p>
              {selectedLocation ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">{selectedLocation.displayName || selectedLocation.name}</span>
                    <span className="text-xs text-emerald-500 uppercase">{selectedLocation.type}</span>
                  </div>
                  <button onClick={() => { setSelectedLocation(null); update('mainLocationId', ''); setLocationSearch(''); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={locationRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search city, state or destination..."
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {locationLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                  {locations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                      {locations.map((loc: any) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => { setSelectedLocation(loc); update('mainLocationId', loc.id); setLocationSearch(loc.displayName || loc.name); setLocations([]); }}
                          className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-emerald-50 text-sm text-left"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{loc.displayName || loc.name}</span>
                          </div>
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
              <p className="text-xs text-gray-500 mb-3">Add all stops/places on this tour — press Enter or comma to add</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.places.map((place: string) => (
                  <span key={place} className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-800">
                    {place}
                    <button onClick={() => update('places', form.places.filter((p: string) => p !== place))} className="text-emerald-400 hover:text-emerald-700 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.placesTag}
                  onChange={(e) => update('placesTag', e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && form.placesTag.trim()) {
                      e.preventDefault();
                      addPlace(form.placesTag.replace(',', ''));
                    }
                  }}
                  placeholder='Type place name — e.g. "Fort Aguada"'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="button" onClick={() => { if (form.placesTag.trim()) addPlace(form.placesTag); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Areas</label>
              <p className="text-xs text-gray-500 mb-3">Where can customers be picked up from?</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.pickupAreas.map((area: string) => (
                  <span key={area} className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-800">
                    <MapPin className="w-3 h-3" /> {area}
                    <button onClick={() => update('pickupAreas', form.pickupAreas.filter((a: string) => a !== area))} className="text-emerald-400 hover:text-emerald-700 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.pickupAreaInput}
                  onChange={(e) => update('pickupAreaInput', e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && form.pickupAreaInput.trim()) {
                      e.preventDefault();
                      addPickupArea(form.pickupAreaInput.replace(',', ''));
                    }
                  }}
                  placeholder='Type area — e.g. "Calangute", "Baga", "Panaji"'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="button" onClick={() => { if (form.pickupAreaInput.trim()) addPickupArea(form.pickupAreaInput); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('duration', d)}
                    className={`py-2 px-3 rounded-lg border text-sm transition ${
                      form.duration === d ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-emerald-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {form.duration === 'Custom' && (
                <input
                  type="text"
                  value={form.customDuration}
                  onChange={(e) => update('customDuration', e.target.value)}
                  placeholder="e.g. 10 Days 9 Nights"
                  className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Tour Description</label>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={aiAvailable === false || aiLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      aiAvailable === false
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {aiAvailable === false ? 'AI Unavailable' : aiLoading ? 'Generating…' : 'Generate with AI'}
                  </button>
                  {aiAvailable === false && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-10 hidden group-hover:block">
                      DeepSeek balance is empty. Recharge at platform.deepseek.com
                    </div>
                  )}
                </div>
              </div>
              {aiError && (
                <p className="text-xs text-red-600 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {aiError}
                </p>
              )}
              <TourDescriptionEditor
                content={form.description}
                onChange={(html) => update('description', html)}
                editorRef={descEditorRef}
                minHeight={160}
                maxHeight={300}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tour Highlights</label>
              <p className="text-xs text-gray-500 mb-2">Key selling points — shown prominently to customers</p>
              {form.highlights.map((h: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-9 flex items-center text-gray-400 text-sm">✦</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => {
                      const updated = [...form.highlights];
                      updated[i] = e.target.value;
                      update('highlights', updated);
                    }}
                    placeholder="e.g. Visit iconic beaches of North Goa"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {form.highlights.length > 1 && (
                    <button onClick={() => update('highlights', form.highlights.filter((_: any, idx: number) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => update('highlights', [...form.highlights, ''])}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mt-1">
                <Plus className="w-4 h-4" /> Add Highlight
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => update('isFixedDate', !form.isFixedDate)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex items-center gap-2.5">
                  <CalendarRange className="w-4 h-4 text-emerald-500" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">Fixed Tour Dates</p>
                    <p className="text-xs text-gray-500">This tour only runs between specific dates</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isFixedDate ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFixedDate ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.isFixedDate && (
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-gray-200 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.tourStartDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        update('tourStartDate', e.target.value);
                        if (form.tourEndDate && e.target.value > form.tourEndDate) update('tourEndDate', '');
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.tourEndDate}
                      min={form.tourStartDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => update('tourEndDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 - Itinerary */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Add time-based stops — drag <GripVertical className="w-3.5 h-3.5 inline text-gray-400" /> to reorder</p>

            {form.itinerary.map((stop: any, si: number) => (
              <div
                key={stop.id}
                draggable
                onDragStart={() => handleDragStart(si)}
                onDragOver={(e) => handleDragOver(e, si)}
                onDragEnd={handleDragEnd}
                className={`border rounded-xl overflow-hidden ${stop.type === 'break' ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white'}`}
              >
                {stop.type === 'break' ? (
                  <div className="flex items-center gap-3 px-3 py-3">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input type="text" value={stop.time} onChange={(e) => updateStop(si, 'time', e.target.value)}
                        placeholder="Time (e.g. 1:00 PM)"
                        className="w-32 border border-emerald-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <input type="text" value={stop.breakNote} onChange={(e) => updateStop(si, 'breakNote', e.target.value)}
                        placeholder="Break note (e.g. Lunch break)"
                        className="flex-1 border border-emerald-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <input type="text" value={stop.timeSpent} onChange={(e) => updateStop(si, 'timeSpent', e.target.value)}
                        placeholder="Duration"
                        className="w-28 border border-emerald-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">BREAK</span>
                    <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 border-b border-gray-200">
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                      <div className="relative group">
                        <button type="button" className="text-2xl leading-none hover:scale-110 transition" title="Change icon">
                          {stop.emoji}
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-10 w-48">
                          {STOP_EMOJIS.map((em) => (
                            <button key={em} type="button" onClick={() => updateStop(si, 'emoji', em)}
                              className="w-8 h-8 text-lg hover:bg-emerald-50 rounded-lg flex items-center justify-center">
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input type="text" value={stop.time} onChange={(e) => updateStop(si, 'time', e.target.value)}
                        placeholder="Time (e.g. 10:00 AM)"
                        className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input type="text" value={stop.title} onChange={(e) => updateStop(si, 'title', e.target.value)}
                        placeholder="Stop name (e.g. Fort Aguada)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
                      {form.itinerary.filter((s: any) => s.type === 'stop').length > 1 && (
                        <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <textarea value={stop.description} onChange={(e) => updateStop(si, 'description', e.target.value)} rows={2}
                        placeholder="Description of this stop..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">Activities / Highlights at this stop</p>
                        {stop.activities.map((act: string, ai: number) => (
                          <div key={ai} className="flex gap-2 mb-1.5">
                            <span className="flex-shrink-0 text-gray-400 text-sm mt-1.5">•</span>
                            <input type="text" value={act} onChange={(e) => updateActivity(si, ai, e.target.value)}
                              placeholder="e.g. Lighthouse viewpoint"
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            {stop.activities.length > 1 && (
                              <button onClick={() => removeActivity(si, ai)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addActivity(si)}
                          className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-700 mt-1">
                          <Plus className="w-3.5 h-3.5" /> Add activity
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input type="text" value={stop.timeSpent} onChange={(e) => updateStop(si, 'timeSpent', e.target.value)}
                          placeholder="Time spent (e.g. 45 minutes)"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={addStop}
                className="flex items-center gap-2 py-3 border-2 border-dashed border-emerald-200 rounded-xl text-sm text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition justify-center">
                <Plus className="w-4 h-4" /> Add Stop
              </button>
              <button type="button" onClick={addBreak}
                className="flex items-center gap-2 py-3 border-2 border-dashed border-emerald-200 rounded-xl text-sm text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition justify-center">
                <Coffee className="w-4 h-4" /> Add Break / Rest
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 - Pricing & Vehicle */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'GROUP_BASED', label: 'Group Size Based', desc: 'Different price per group size' },
                  { value: 'PER_PERSON', label: 'Per Person', desc: 'Fixed price per traveler' },
                  { value: 'ON_REQUEST', label: 'On Request', desc: 'Price on enquiry' },
                ].map((pt) => (
                  <button key={pt.value} type="button" onClick={() => update('priceType', pt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      form.priceType === pt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                    }`}>
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
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500 px-1">
                    <span>Group Size (persons)</span>
                    <span>Price (₹)</span>
                  </div>
                  {form.priceTiers.map((tier: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <input type="text" value={tier.groupSize} onChange={(e) => updateTier(i, 'groupSize', e.target.value)}
                        placeholder="e.g. 2, 4, 6 or Upto 4"
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                          <input type="number" value={tier.price} onChange={(e) => updateTier(i, 'price', e.target.value)}
                            placeholder="e.g. 2999"
                            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        {form.priceTiers.length > 1 && (
                          <button onClick={() => update('priceTiers', form.priceTiers.filter((_: any, idx: number) => idx !== i))} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => update('priceTiers', [...form.priceTiers, { groupSize: '', price: '' }])}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mt-1">
                    <Plus className="w-4 h-4" /> Add Price Tier
                  </button>
                </div>
              </div>
            )}

            {form.priceType === 'PER_PERSON' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price Per Person (₹)</label>
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" value={form.basePrice} onChange={(e) => update('basePrice', e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            )}

            {/* Agent fleet vehicles */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" /> Vehicles for this tour
              </label>
              <p className="text-xs text-gray-500 mb-3">Pick from your fleet — customers will see exactly which vehicle(s) to expect.</p>
              {loadingVehicles ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold">No vehicles in your fleet yet</p>
                    <p className="text-xs mt-0.5">
                      You can still publish without a vehicle.{' '}
                      <a href="/travel-agent/fleet/add" target="_blank" rel="noopener noreferrer"
                        className="font-bold underline hover:text-amber-900">
                        Add your first vehicle →
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableVehicles.map((v) => {
                    const active = form.vehicleIds.includes(v.id);
                    return (
                      <button key={v.id} type="button" onClick={() => toggleVehicle(v.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                          active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                        }`}>
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {v.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.coverImage} alt={v.vehicleName} className="w-full h-full object-cover" />
                          ) : <Car className="w-6 h-6 text-emerald-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{v.vehicleName}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{v.vehicleType?.replace(/_/g, ' ')}</span>
                            {v.seatingCapacity && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {v.seatingCapacity}</span>}
                            {v.fuelType && <span className="flex items-center gap-0.5"><Fuel className="w-2.5 h-2.5" /> {v.fuelType}</span>}
                            {v.ratePerDay && <span className="font-semibold text-emerald-700">₹{v.ratePerDay.toLocaleString('en-IN')}/day</span>}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-emerald-600 text-white' : 'border-2 border-gray-300'}`}>
                          {active && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {form.vehicleIds.length > 0 && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  ✓ {form.vehicleIds.length} vehicle{form.vehicleIds.length !== 1 ? 's' : ''} attached
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Advance Notice (hours)</label>
                <input type="number" value={form.advanceNoticeHours}
                  onChange={(e) => update('advanceNoticeHours', parseInt(e.target.value) || 24)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cancellation Policy</label>
                <select value={form.cancellationPolicy} onChange={(e) => update('cancellationPolicy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {CANCELLATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Refund / Cancellation Notes</label>
              <p className="text-xs text-gray-500 mb-2">Any additional details about your refund policy (optional)</p>
              <textarea value={form.cancellationNotes} onChange={(e) => update('cancellationNotes', e.target.value)} rows={3}
                placeholder="e.g. Cancellations must be made via WhatsApp..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => update('requireAdvancePayment', !form.requireAdvancePayment)}
                className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition">
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Require Advance Payment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Collect a partial payment upfront</p>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-4 ${form.requireAdvancePayment ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requireAdvancePayment ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.requireAdvancePayment && (
                <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Payment Type</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'PERCENTAGE', label: '% Percentage', hint: 'e.g. 30% of total' },
                        { value: 'FIXED', label: '₹ Fixed Amount', hint: 'e.g. ₹2,000 flat' },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => update('advancePaymentType', opt.value)}
                          className={`flex-1 p-3 rounded-xl border-2 text-left transition ${
                            form.advancePaymentType === opt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                          }`}>
                          <p className={`text-sm font-bold ${form.advancePaymentType === opt.value ? 'text-emerald-700' : 'text-gray-700'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      {form.advancePaymentType === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                    </label>
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        {form.advancePaymentType === 'PERCENTAGE' ? '%' : '₹'}
                      </span>
                      <input type="number" value={form.advancePaymentValue} onChange={(e) => update('advancePaymentValue', e.target.value)}
                        placeholder={form.advancePaymentType === 'PERCENTAGE' ? '30' : '2000'} min="1"
                        max={form.advancePaymentType === 'PERCENTAGE' ? '100' : undefined}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6 - Inclusions & Images */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✅ Tour Includes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INCLUSIONS.map((inc) => (
                  <button key={inc} type="button" onClick={() => {
                    const curr = form.inclusions;
                    update('inclusions', curr.includes(inc) ? curr.filter((x: string) => x !== inc) : [...curr, inc]);
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      form.inclusions.includes(inc) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}>
                    {inc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.customInclusion} onChange={(e) => update('customInclusion', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.customInclusion.trim()) {
                      e.preventDefault();
                      update('inclusions', [...form.inclusions, form.customInclusion.trim()]);
                      update('customInclusion', '');
                    }
                  }}
                  placeholder="Type custom inclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => {
                  if (form.customInclusion.trim()) {
                    update('inclusions', [...form.inclusions, form.customInclusion.trim()]);
                    update('customInclusion', '');
                  }
                }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.inclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.inclusions.map((inc: string) => (
                    <span key={inc} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800">
                      ✅ {inc}
                      <button onClick={() => update('inclusions', form.inclusions.filter((x: string) => x !== inc))} className="ml-1 text-emerald-400 hover:text-emerald-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">❌ Tour Excludes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_EXCLUSIONS.map((exc) => (
                  <button key={exc} type="button" onClick={() => {
                    const curr = form.exclusions;
                    update('exclusions', curr.includes(exc) ? curr.filter((x: string) => x !== exc) : [...curr, exc]);
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      form.exclusions.includes(exc) ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-red-200'
                    }`}>
                    {exc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={form.customExclusion} onChange={(e) => update('customExclusion', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.customExclusion.trim()) {
                      e.preventDefault();
                      update('exclusions', [...form.exclusions, form.customExclusion.trim()]);
                      update('customExclusion', '');
                    }
                  }}
                  placeholder="Type custom exclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => {
                  if (form.customExclusion.trim()) {
                    update('exclusions', [...form.exclusions, form.customExclusion.trim()]);
                    update('customExclusion', '');
                  }
                }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.exclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.exclusions.map((exc: string) => (
                    <span key={exc} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-800">
                      ❌ {exc}
                      <button onClick={() => update('exclusions', form.exclusions.filter((x: string) => x !== exc))} className="ml-1 text-red-400 hover:text-red-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Images</label>
              <p className="text-xs text-gray-500 mb-3">Upload photos. The first image becomes the cover.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">COVER</span>
                    )}
                    <button type="button" onClick={() => update('images', form.images.filter((_: any, idx: number) => idx !== i))}
                      className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
                  {uploadingImages ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
                    <>
                      <Images className="w-5 h-5 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Add</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Terms & Conditions (preserved from existing flow) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Terms & Conditions <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={form.termsConditions} onChange={(e) => update('termsConditions', e.target.value)} rows={3}
                placeholder="e.g. Full refund up to 48 hrs before. 50% refund within 48 hrs. No refund after departure."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <TourPreviewModal form={form} selectedLocation={selectedLocation} onClose={() => setShowPreview(false)} />
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep((s) => Math.max(s - 1, 1))} disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex gap-3">
          {step === STEPS.length ? (
            <>
              <button onClick={() => handleSubmit(false)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save as Draft
              </button>
              <button onClick={() => handleSubmit(true)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Publish Tour
              </button>
            </>
          ) : (
            <button onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
