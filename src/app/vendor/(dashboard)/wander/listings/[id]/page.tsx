// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Compass, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Plus, Trash2, MapPin, Search, X, Clock, Car, ArrowLeft,
} from 'lucide-react';

// ─── Constants (same as new page) ─────────────────────────────────────────────

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

// ─── Parse stored data into form state ────────────────────────────────────────

function parseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function listingToForm(listing) {
  const rawPlaces = parseJSON(listing.customPlaces, []);
  const places = rawPlaces.map((p) => (typeof p === 'string' ? p : p.name)).filter(Boolean);

  const itineraryRaw = parseJSON(listing.itinerary, []);
  const itinerary = itineraryRaw.length > 0
    ? itineraryRaw.map((stop) => ({
        id: Date.now() + Math.random(),
        emoji: stop.emoji || '📍',
        time: stop.time || '',
        title: stop.title || '',
        description: stop.description || '',
        activities: Array.isArray(stop.activities) && stop.activities.length ? stop.activities : [''],
        timeSpent: stop.timeSpent || '',
      }))
    : [{ id: Date.now(), emoji: '🚗', time: '8:30 AM', title: 'Pickup', description: '', activities: [''], timeSpent: '' }];

  const priceTiersRaw = parseJSON(listing.priceTiers, null);
  const priceTiers = Array.isArray(priceTiersRaw) && priceTiersRaw.length > 0
    ? priceTiersRaw
    : [{ groupSize: '2', price: '' }, { groupSize: '4', price: '' }];

  const meetingPoint = listing.meetingPoint || '';
  const pickupAreas = meetingPoint ? meetingPoint.split(', ').filter(Boolean) : [];

  // Detect if duration is a custom value
  const isKnownDuration = DURATION_OPTIONS.filter((d) => d !== 'Custom').includes(listing.duration);

  // Map stored priceType back to form priceType
  const priceTypeMap = { PER_GROUP: 'GROUP_BASED', PER_PERSON: 'PER_PERSON', ON_REQUEST: 'ON_REQUEST' };
  const formPriceType = priceTypeMap[listing.priceType] || 'ON_REQUEST';

  return {
    categoryId: listing.categoryId || '',
    subCategoryId: listing.subCategoryId || '',
    experienceId: listing.experienceId || '',
    title: listing.title || '',
    shortDescription: listing.shortDescription || '',
    mainLocationId: listing.mainLocationId || '',
    placesTag: '',
    places,
    pickupAreaInput: '',
    pickupAreas,
    description: listing.description || '',
    duration: isKnownDuration ? listing.duration : 'Custom',
    customDuration: !isKnownDuration ? listing.duration : '',
    highlights: parseJSON(listing.highlights, ['']).length ? parseJSON(listing.highlights, ['']) : [''],
    itinerary,
    priceType: formPriceType,
    basePrice: listing.basePrice ? String(listing.basePrice) : '',
    priceTiers,
    vehicleOptions: parseJSON(listing.vehicleOptions, []),
    advanceNoticeHours: listing.advanceNoticeHours || 24,
    cancellationPolicy: listing.cancellationPolicy || 'MODERATE',
    cancellationNotes: listing.cancellationNotes || '',
    requireAdvancePayment: listing.requireAdvancePayment || false,
    advancePaymentType: listing.advancePaymentType || 'PERCENTAGE',
    advancePaymentValue: listing.advancePaymentValue ? String(listing.advancePaymentValue) : '',
    inclusions: parseJSON(listing.inclusions, []),
    customInclusion: '',
    exclusions: parseJSON(listing.exclusions, []),
    customExclusion: '',
    images: parseJSON(listing.images, []),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditWanderListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const locationRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load listing + categories on mount
  useEffect(() => {
    async function load() {
      try {
        const [listingRes, catsRes] = await Promise.all([
          fetch(`/api/vendor/wander/listings/${listingId}`),
          fetch('/api/admin/wander/categories'),
        ]);
        const listing = await listingRes.json();
        const cats = await catsRes.json();
        if (!listingRes.ok) { setError(listing.error || 'Failed to load listing'); return; }
        setCategories(Array.isArray(cats) ? cats.filter((c) => c.isActive) : []);
        setForm(listingToForm(listing));
        // Pre-fill location display
        if (listing.mainLocation) {
          setSelectedLocation({ id: listing.mainLocationId, name: listing.mainLocation.name, displayName: listing.mainLocation.name });
          setLocationSearch(listing.mainLocation.name);
        }
      } catch {
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  const [experiences, setExperiences] = useState([]);
  useEffect(() => {
    if (!form?.categoryId) { setExperiences([]); return; }
    fetch(`/api/vendor/wander/experiences?categoryId=${form.categoryId}`)
      .then(r => r.json())
      .then(d => setExperiences(Array.isArray(d) ? d : []))
      .catch(() => setExperiences([]));
  }, [form?.categoryId]);

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (locationRef.current && !locationRef.current.contains(e.target)) setLocations([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (locationSearch.length < 2) { setLocations([]); return; }
    const timer = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/vendor/wander/locations?search=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch { setLocations([]); }
      finally { setLocationLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  // ── Step navigation ────────────────────────────────────────────────────────

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!form.categoryId) { setError('Please select a category'); return; }
      if (!form.title.trim()) { setError('Please enter a tour title'); return; }
    }
    if (step === 2 && !form.mainLocationId) { setError('Please select a main location'); return; }
    if (step === 3 && !form.duration) { setError('Please select a duration'); return; }
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  // ── Places tags ────────────────────────────────────────────────────────────

  function addPlace(name) {
    const trimmed = name.trim();
    if (trimmed && !form.places.includes(trimmed)) update('places', [...form.places, trimmed]);
    update('placesTag', '');
  }

  function addPickupArea(name) {
    const trimmed = name.trim();
    if (trimmed && !form.pickupAreas.includes(trimmed)) update('pickupAreas', [...form.pickupAreas, trimmed]);
    update('pickupAreaInput', '');
  }

  // ── Itinerary helpers ──────────────────────────────────────────────────────

  function addStop() {
    update('itinerary', [...form.itinerary, { id: Date.now(), emoji: '📍', time: '', title: '', description: '', activities: [''], timeSpent: '' }]);
  }

  function updateStop(idx, field, value) {
    const updated = [...form.itinerary];
    updated[idx] = { ...updated[idx], [field]: value };
    update('itinerary', updated);
  }

  function removeStop(idx) { update('itinerary', form.itinerary.filter((_, i) => i !== idx)); }

  function addActivity(stopIdx) {
    const updated = [...form.itinerary];
    updated[stopIdx] = { ...updated[stopIdx], activities: [...updated[stopIdx].activities, ''] };
    update('itinerary', updated);
  }

  function updateActivity(stopIdx, actIdx, value) {
    const updated = [...form.itinerary];
    const acts = [...updated[stopIdx].activities];
    acts[actIdx] = value;
    updated[stopIdx] = { ...updated[stopIdx], activities: acts };
    update('itinerary', updated);
  }

  function removeActivity(stopIdx, actIdx) {
    const updated = [...form.itinerary];
    updated[stopIdx].activities = updated[stopIdx].activities.filter((_, i) => i !== actIdx);
    update('itinerary', updated);
  }

  function updateTier(idx, field, value) {
    const tiers = [...form.priceTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    update('priceTiers', tiers);
  }

  // ── Image upload ───────────────────────────────────────────────────────────

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await fetch('/api/vendor/wander/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      update('images', [...form.images, ...data.images]);
    } catch { setError('Image upload failed'); }
    finally { setUploadingImages(false); e.target.value = ''; }
  }

  // ── Submit (PUT) ───────────────────────────────────────────────────────────

  async function handleSave(publish = null) {
    setSaving(true);
    setError('');
    try {
      const payload = {
        categoryId: form.categoryId,
        experienceId: form.experienceId || null,
        mainLocationId: form.mainLocationId,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim(),
        duration: form.duration === 'Custom' ? form.customDuration : form.duration,
        highlights: form.highlights.filter(Boolean),
        customPlaces: form.places.map((p) => ({ name: p })),
        itinerary: form.itinerary.map((stop, i) => ({
          day: i + 1,
          emoji: stop.emoji,
          time: stop.time,
          title: stop.title,
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
      };

      if (publish !== null) payload.status = publish ? 'ACTIVE' : 'DRAFT';

      const res = await fetch(`/api/vendor/wander/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      router.push('/vendor/wander/listings');
    } catch {
      setError('Failed to save tour');
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5" /> {error || 'Listing not found'}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/vendor/wander/listings')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Tour</h1>
          <p className="text-sm text-gray-500">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
      </div>

      {/* Progress bar */}
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

        {/* ── STEP 1: Category & Title ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tour Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
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
                  </button>
                ))}
              </div>
            </div>

            {/* Experience (optional) */}
            {form.categoryId && experiences.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Link to Experience
                  <span className="ml-2 text-xs font-normal text-gray-400">(optional — recommended)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Linking lets customers compare your tour alongside other vendors offering the same experience.
                </p>
                <select
                  value={form.experienceId}
                  onChange={(e) => update('experienceId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">— Don't link (list as standalone) —</option>
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.category?.icon} {exp.title}{exp.location ? ` · ${exp.location.name}` : ''}{exp.duration ? ` · ${exp.duration}` : ''}
                    </option>
                  ))}
                </select>
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

        {/* ── STEP 2: Location & Places ─────────────────────────────────── */}
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
                      {locations.map((loc) => (
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

            {/* Places Covered */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Places Covered</label>
              <p className="text-xs text-gray-500 mb-3">Add all stops/places on this tour — press Enter or comma to add</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.places.map((place) => (
                  <span key={place} className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-800">
                    {place}
                    <button onClick={() => update('places', form.places.filter((p) => p !== place))} className="text-emerald-400 hover:text-emerald-700 ml-1">
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
                <button
                  type="button"
                  onClick={() => { if (form.placesTag.trim()) addPlace(form.placesTag); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Pickup Areas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Areas</label>
              <p className="text-xs text-gray-500 mb-3">Where can customers be picked up from?</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.pickupAreas.map((area) => (
                  <span key={area} className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-800">
                    <MapPin className="w-3 h-3" /> {area}
                    <button onClick={() => update('pickupAreas', form.pickupAreas.filter((a) => a !== area))} className="text-emerald-400 hover:text-emerald-700 ml-1">
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
                <button
                  type="button"
                  onClick={() => { if (form.pickupAreaInput.trim()) addPickupArea(form.pickupAreaInput); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Overview ──────────────────────────────────────────── */}
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                placeholder="Describe this tour — what makes it special, what customers will experience..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tour Highlights</label>
              {form.highlights.map((h, i) => (
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
                    <button onClick={() => update('highlights', form.highlights.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => update('highlights', [...form.highlights, ''])}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mt-1"
              >
                <Plus className="w-4 h-4" /> Add Highlight
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Itinerary ─────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Edit time-based stops for this tour — from pickup to drop</p>

            {form.itinerary.map((stop, si) => (
              <div key={stop.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
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
                  <input
                    type="text"
                    value={stop.time}
                    onChange={(e) => updateStop(si, 'time', e.target.value)}
                    placeholder="Time (e.g. 10:00 AM)"
                    className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={stop.title}
                    onChange={(e) => updateStop(si, 'title', e.target.value)}
                    placeholder="Stop name (e.g. Fort Aguada)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  {form.itinerary.length > 1 && (
                    <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <textarea
                    value={stop.description}
                    onChange={(e) => updateStop(si, 'description', e.target.value)}
                    rows={2}
                    placeholder="Description of this stop..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Activities / Highlights at this stop</p>
                    {stop.activities.map((act, ai) => (
                      <div key={ai} className="flex gap-2 mb-1.5">
                        <span className="flex-shrink-0 text-gray-400 text-sm mt-1.5">•</span>
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => updateActivity(si, ai, e.target.value)}
                          placeholder="e.g. Lighthouse viewpoint, Water sports"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {stop.activities.length > 1 && (
                          <button onClick={() => removeActivity(si, ai)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addActivity(si)} className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-700 mt-1">
                      <Plus className="w-3.5 h-3.5" /> Add activity
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={stop.timeSpent}
                      onChange={(e) => updateStop(si, 'timeSpent', e.target.value)}
                      placeholder="Time spent (e.g. 45 minutes, 1 hour)"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStop}
              className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-emerald-200 rounded-xl text-sm text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition justify-center"
            >
              <Plus className="w-4 h-4" /> Add Stop
            </button>
          </div>
        )}

        {/* ── STEP 5: Pricing & Vehicle ─────────────────────────────────── */}
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
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => update('priceType', pt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      form.priceType === pt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
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
                  {form.priceTiers.map((tier, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={tier.groupSize}
                        onChange={(e) => updateTier(i, 'groupSize', e.target.value)}
                        placeholder="e.g. 2, 4, 6 or Upto 4"
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => updateTier(i, 'price', e.target.value)}
                            placeholder="e.g. 2999"
                            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        {form.priceTiers.length > 1 && (
                          <button onClick={() => update('priceTiers', form.priceTiers.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update('priceTiers', [...form.priceTiers, { groupSize: '', price: '' }])}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 mt-1"
                  >
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
                  <input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => update('basePrice', e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Options</label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const curr = form.vehicleOptions;
                      update('vehicleOptions', curr.includes(v) ? curr.filter((x) => x !== v) : [...curr, v]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${
                      form.vehicleOptions.includes(v) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}
                  >
                    <Car className="w-3 h-3" /> {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Advance Notice (hours)</label>
                <input
                  type="number"
                  value={form.advanceNoticeHours}
                  onChange={(e) => update('advanceNoticeHours', parseInt(e.target.value) || 24)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cancellation Policy</label>
                <select
                  value={form.cancellationPolicy}
                  onChange={(e) => update('cancellationPolicy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CANCELLATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cancellation Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Refund / Cancellation Notes</label>
              <p className="text-xs text-gray-500 mb-2">Any additional details about your refund policy (optional)</p>
              <textarea
                value={form.cancellationNotes}
                onChange={(e) => update('cancellationNotes', e.target.value)}
                rows={3}
                placeholder="e.g. Cancellations must be made via WhatsApp. No refund for no-shows or weather-related changes..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Advance Payment */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => update('requireAdvancePayment', !form.requireAdvancePayment)}
                className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Require Advance Payment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Collect a partial payment upfront when customer accepts a quote</p>
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
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('advancePaymentType', opt.value)}
                          className={`flex-1 p-3 rounded-xl border-2 text-left transition ${
                            form.advancePaymentType === opt.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-200'
                          }`}
                        >
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
                      <input
                        type="number"
                        value={form.advancePaymentValue}
                        onChange={(e) => update('advancePaymentValue', e.target.value)}
                        placeholder={form.advancePaymentType === 'PERCENTAGE' ? '30' : '2000'}
                        min="1"
                        max={form.advancePaymentType === 'PERCENTAGE' ? '100' : undefined}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {form.advancePaymentType === 'PERCENTAGE' && form.advancePaymentValue && (
                      <p className="text-xs text-emerald-600 mt-1">
                        e.g. for ₹10,000 tour → advance = ₹{((parseFloat(form.advancePaymentValue) / 100) * 10000).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 text-xs text-emerald-700">
                    💡 Customers will see this advance payment requirement on the quote acceptance screen.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 6: Inclusions & Images ───────────────────────────────── */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✅ Tour Includes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INCLUSIONS.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const curr = form.inclusions;
                      update('inclusions', curr.includes(inc) ? curr.filter((x) => x !== inc) : [...curr, inc]);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      form.inclusions.includes(inc) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}
                  >
                    {inc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.customInclusion}
                  onChange={(e) => update('customInclusion', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.customInclusion.trim()) {
                      update('inclusions', [...form.inclusions, form.customInclusion.trim()]);
                      update('customInclusion', '');
                    }
                  }}
                  placeholder="Type custom inclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => { if (form.customInclusion.trim()) { update('inclusions', [...form.inclusions, form.customInclusion.trim()]); update('customInclusion', ''); } }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.inclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.inclusions.map((inc) => (
                    <span key={inc} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800">
                      ✅ {inc}
                      <button onClick={() => update('inclusions', form.inclusions.filter((x) => x !== inc))} className="ml-1 text-emerald-400 hover:text-emerald-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">❌ Tour Excludes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_EXCLUSIONS.map((exc) => (
                  <button
                    key={exc}
                    type="button"
                    onClick={() => {
                      const curr = form.exclusions;
                      update('exclusions', curr.includes(exc) ? curr.filter((x) => x !== exc) : [...curr, exc]);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${
                      form.exclusions.includes(exc) ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-red-200'
                    }`}
                  >
                    {exc}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.customExclusion}
                  onChange={(e) => update('customExclusion', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.customExclusion.trim()) {
                      update('exclusions', [...form.exclusions, form.customExclusion.trim()]);
                      update('customExclusion', '');
                    }
                  }}
                  placeholder="Type custom exclusion and press Enter"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => { if (form.customExclusion.trim()) { update('exclusions', [...form.exclusions, form.customExclusion.trim()]); update('customExclusion', ''); } }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.exclusions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.exclusions.map((exc) => (
                    <span key={exc} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-800">
                      ❌ {exc}
                      <button onClick={() => update('exclusions', form.exclusions.filter((x) => x !== exc))} className="ml-1 text-red-400 hover:text-red-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Images</label>
              <p className="text-xs text-gray-500 mb-3">Upload photos or paste image URLs</p>

              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  {img && <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={(e) => e.target.style.display = 'none'} />}
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => {
                      const updated = [...form.images];
                      updated[i] = e.target.value;
                      update('images', updated);
                    }}
                    placeholder="https://..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button onClick={() => update('images', form.images.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-1 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-60"
                >
                  {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploadingImages ? 'Uploading...' : 'Upload Photos'}
                </button>
                <button
                  type="button"
                  onClick={() => update('images', [...form.images, ''])}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex gap-3">
          {step === STEPS.length ? (
            <>
              <button
                onClick={() => handleSave(null)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save & Publish
              </button>
            </>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
