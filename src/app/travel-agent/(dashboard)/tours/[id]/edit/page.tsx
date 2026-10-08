// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import {
  Compass, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Plus, Trash2, MapPin, Search, X, Clock, Users, Car, GripVertical, Coffee,
  CalendarRange, ChevronDown, Eye, Sparkles, Images, Save, Zap, ArrowLeft, Fuel, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

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

function parseJSON(str: any, fallback: any) {
  if (!str) return fallback;
  if (Array.isArray(str) || typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

// Some legacy travel-agent tours stored inclusions as { highlights: [], items: [] }.
// Always normalize to an array.
function asArray<T = any>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return asArray(parsed);
    } catch { return []; }
  }
  if (typeof val === 'object') {
    if (Array.isArray((val as any).items)) return (val as any).items;
    if (Array.isArray((val as any).highlights)) return (val as any).highlights;
  }
  return [];
}

// Extract a `highlights` array from a possibly-legacy inclusions blob.
function extractLegacyHighlights(inclusionsRaw: any): any[] {
  if (!inclusionsRaw) return [];
  if (typeof inclusionsRaw === 'string') {
    try { return extractLegacyHighlights(JSON.parse(inclusionsRaw)); } catch { return []; }
  }
  if (Array.isArray(inclusionsRaw)) return [];
  if (typeof inclusionsRaw === 'object' && Array.isArray(inclusionsRaw.highlights)) {
    return inclusionsRaw.highlights;
  }
  return [];
}

function tourToForm(tour: any) {
  const rawPlaces = parseJSON(tour.customPlaces, []);
  const places = (Array.isArray(rawPlaces) ? rawPlaces : [])
    .map((p: any) => (typeof p === 'string' ? p : p.name))
    .filter(Boolean);

  const itineraryRaw = parseJSON(tour.itinerary, []);
  const itinerary = Array.isArray(itineraryRaw) && itineraryRaw.length > 0
    ? itineraryRaw.map((stop: any) => ({
        id: Date.now() + Math.random(),
        type: stop.type === 'break' ? 'break' : 'stop',
        emoji: stop.emoji || '📍',
        time: stop.time || '',
        title: stop.title || '',
        description: stop.description || '',
        activities: Array.isArray(stop.activities) && stop.activities.length ? stop.activities : [''],
        timeSpent: stop.timeSpent || '',
        breakNote: stop.breakNote || '',
      }))
    : [{ id: Date.now(), type: 'stop', emoji: '📍', time: '', title: '', description: '', activities: [''], timeSpent: '', breakNote: '' }];

  const priceTiersRaw = parseJSON(tour.priceTiers, null);
  const priceTiers = Array.isArray(priceTiersRaw) && priceTiersRaw.length > 0
    ? priceTiersRaw
    : [{ groupSize: '2', price: '' }, { groupSize: '4', price: '' }];

  const meetingPoint = tour.meetingPoint || '';
  const pickupAreas = meetingPoint ? meetingPoint.split(', ').filter(Boolean) : [];

  const isKnownDuration = DURATION_OPTIONS.filter((d) => d !== 'Custom').includes(tour.duration);

  // Map stored priceType back to form priceType
  const priceTypeMap: Record<string, any> = { PER_GROUP: 'GROUP_BASED', PER_PERSON: 'PER_PERSON', ON_REQUEST: 'ON_REQUEST' };
  const formPriceType = priceTypeMap[tour.priceType] || 'ON_REQUEST';

  // Build images array (cover + gallery)
  let images: string[] = [];
  if (tour.coverImage) images.push(tour.coverImage);
  const gal = parseJSON(tour.galleryImages, []);
  if (Array.isArray(gal)) images = images.concat(gal.filter((u: string) => u && u !== tour.coverImage));

  // Robust extraction (handles legacy { highlights, items } inclusions shape)
  const inclusionsArr = asArray<string>(tour.inclusions);
  const exclusionsArr = asArray<string>(tour.exclusions);
  const directHighlights = asArray<string>(tour.highlights);
  const legacyHighlights = extractLegacyHighlights(tour.inclusions);
  const mergedHighlights = directHighlights.length ? directHighlights : legacyHighlights;
  const vehicleIdsArr = asArray<string>(tour.vehicleIds);

  return {
    categoryId: tour.categoryId || '',
    subCategoryId: tour.subCategoryId || '',
    title: tour.title || '',
    shortDescription: tour.shortDescription || '',
    mainLocationId: tour.mainLocationId || '',
    placesTag: '',
    places,
    pickupAreaInput: '',
    pickupAreas,
    description: tour.description || '',
    duration: isKnownDuration ? tour.duration : (tour.duration ? 'Custom' : ''),
    customDuration: !isKnownDuration && tour.duration ? tour.duration : '',
    highlights: mergedHighlights.length ? mergedHighlights : [''],
    isFixedDate: !!(tour.tourStartDate && tour.tourEndDate),
    tourStartDate: tour.tourStartDate ? new Date(tour.tourStartDate).toISOString().split('T')[0] : '',
    tourEndDate: tour.tourEndDate ? new Date(tour.tourEndDate).toISOString().split('T')[0] : '',
    itinerary,
    priceType: formPriceType,
    basePrice: tour.basePrice ? String(tour.basePrice) : (tour.startingPrice ? String(tour.startingPrice) : ''),
    priceTiers,
    vehicleIds: vehicleIdsArr,
    advanceNoticeHours: tour.advanceNoticeHours || 24,
    cancellationPolicy: tour.cancellationPolicy || 'MODERATE',
    cancellationNotes: tour.cancellationNotes || '',
    requireAdvancePayment: !!tour.requireAdvancePayment,
    advancePaymentType: tour.advancePaymentType || 'PERCENTAGE',
    advancePaymentValue: tour.advancePaymentValue ? String(tour.advancePaymentValue) : '',
    inclusions: inclusionsArr,
    customInclusion: '',
    exclusions: exclusionsArr,
    customExclusion: '',
    images,
    termsConditions: tour.termsConditions || '',
    status: tour.status || 'DRAFT',
    slug: tour.slug || '',
  };
}

export default function EditTravelAgentTourPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const tourId = params?.id as string;
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageWarning, setImageWarning] = useState('');
  const [error, setError] = useState('');
  const [switchingMode, setSwitchingMode] = useState(false);

  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const locationRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subCategories =
    categories.find((c: any) => c.id === form?.categoryId)?.subCategories?.filter((s: any) => s.isActive) ?? [];

  async function switchToQuick() {
    setSwitchingMode(true);
    setError('');
    try {
      const res = await fetch(`/api/travel-agent/tours/${tourId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createMode: 'QUICK' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to switch'); setSwitchingMode(false); return; }
      router.push(`/travel-agent/tours/${tourId}/edit/quick`);
    } catch (err: any) {
      setError(err.message || 'Failed to switch');
      setSwitchingMode(false);
    }
  }

  // Restore step from URL
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('step');
    const n = parseInt(s || '1');
    if (n >= 1 && n <= 6) setStep(n);
  }, []);

  // Load tour + categories + fleet on mount
  useEffect(() => {
    if (!tourId) return;
    async function load() {
      try {
        const [tourRes, catsRes, fleetRes] = await Promise.all([
          fetch(`/api/travel-agent/tours/${tourId}`),
          fetch('/api/travel-agent/categories'),
          fetch('/api/travel-agent/fleet'),
        ]);
        const tour = await tourRes.json();
        const cats = await catsRes.json();
        const fleet = fleetRes.ok ? await fleetRes.json() : { fleets: [] };
        if (!tourRes.ok) { setError(tour.error || 'Failed to load tour'); return; }
        setCategories(Array.isArray(cats) ? cats : []);
        setAvailableVehicles((fleet.fleets || []).filter((f: any) => f.isActive));
        setForm(tourToForm(tour));
        if (tour.mainLocation) {
          setSelectedLocation({
            id: tour.mainLocationId,
            name: tour.mainLocation.name,
            displayName: tour.mainLocation.name,
            type: tour.mainLocation.type,
          });
          setLocationSearch(tour.mainLocation.name);
        }
      } catch {
        setError('Failed to load tour');
      } finally {
        setLoading(false);
        setLoadingVehicles(false);
      }
    }
    load();
  }, [tourId]);

  // Outside click closes location dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocations([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setForm((f: any) => ({ ...f, [field]: value }));
  }

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

  function updateTier(idx: number, field: string, value: string) {
    const tiers = [...form.priceTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    update('priceTiers', tiers);
  }

  const toggleVehicle = (id: string) => {
    update(
      'vehicleIds',
      form.vehicleIds.includes(id)
        ? form.vehicleIds.filter((x: string) => x !== id)
        : [...form.vehicleIds, id],
    );
  };

  function readImageSize(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ w: 0, h: 0 }); };
      img.src = url;
    });
  }

  const MIN_IMAGE_WIDTH = 1600;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageWarning('');
    const dims = await Promise.all(files.map((f) => readImageSize(f)));
    const lowRes = files.filter((_, i) => dims[i].w > 0 && dims[i].w < MIN_IMAGE_WIDTH);
    if (lowRes.length) {
      const names = lowRes.map((f) => `${f.name} (${dims[files.indexOf(f)].w}×${dims[files.indexOf(f)].h}px)`).join(', ');
      setImageWarning(`${lowRes.length} image${lowRes.length > 1 ? 's are' : ' is'} low-resolution and may look blurry in the hero — use at least ${MIN_IMAGE_WIDTH}px wide (ideally 2000px+). Low-res: ${names}`);
    }
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

  async function handleSave(publish: boolean | null = null) {
    setSaving(true);
    setError('');
    try {
      const apiPriceType =
        form.priceType === 'GROUP_BASED' ? 'PER_GROUP' : form.priceType === 'PER_PERSON' ? 'PER_PERSON' : 'ON_REQUEST';

      const finalDuration = form.duration === 'Custom' ? form.customDuration.trim() : form.duration;
      const cleanTiers = (form.priceTiers || []).filter((t: any) => t.price);
      const lowestTier = cleanTiers.length > 0 ? Math.min(...cleanTiers.map((t: any) => Number(t.price))) : null;
      const basePriceVal = form.priceType === 'PER_PERSON' && form.basePrice ? Number(form.basePrice) : null;
      const startingPriceVal = basePriceVal != null ? basePriceVal : lowestTier;

      const payload: any = {
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        mainLocationId: form.mainLocationId,
        title: form.title.trim(),
        shortDescription: form.shortDescription?.trim() || null,
        description: form.description?.trim() || null,
        duration: finalDuration,
        destination: selectedLocation?.name || selectedLocation?.displayName || null,
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

        coverImage: form.images[0] || null,
        galleryImages: form.images.slice(1).filter(Boolean),

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
      };

      if (publish !== null) payload.status = publish ? 'ACTIVE' : 'DRAFT';

      const res = await fetch(`/api/travel-agent/tours/${tourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      showToast({ type: 'success', title: publish === true ? 'Tour published' : 'Saved' });
      if (publish === true) {
        router.push('/travel-agent/tours');
      }
    } catch {
      setError('Failed to save tour');
    } finally {
      setSaving(false);
    }
  }

  useTravelAgentPageHeader(
    'Edit Tour',
    form ? `Step ${step} of ${STEPS.length} — ${STEPS[step - 1].label}` : undefined,
  );

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
          <AlertCircle className="w-5 h-5" /> {error || 'Tour not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={() => router.push('/travel-agent/tours')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Edit Tour</h1>
          <p className="text-sm text-gray-500">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
        </div>
        <button
          type="button"
          onClick={switchToQuick}
          disabled={switchingMode || saving}
          title="Switch this tour to Quick edit mode"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex-shrink-0 disabled:opacity-60"
        >
          {switchingMode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Quick mode
        </button>
        <button
          type="button"
          onClick={() => handleSave(null)}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition flex-shrink-0 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
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
                  </button>
                ))}
              </div>
            </div>

            {form.categoryId && subCategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sub-Category</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => update('subCategoryId', '')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                      !form.subCategoryId ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}>
                    All / Any
                  </button>
                  {subCategories.map((sub: any) => (
                    <button key={sub.id} type="button" onClick={() => update('subCategoryId', sub.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                        form.subCategoryId === sub.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                      }`}>
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
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
                placeholder='e.g. "1 Day Goa Sightseeing Tour Package"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <input type="text" value={form.shortDescription}
                onChange={(e) => update('shortDescription', e.target.value.slice(0, 120))}
                placeholder='e.g. "Explore North Goa forts, beaches & markets in one day"'
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                  <input type="text" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search city, state or destination..."
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  {locationLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                  {locations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                      {locations.map((loc: any) => (
                        <button key={loc.id} type="button"
                          onClick={() => { setSelectedLocation(loc); update('mainLocationId', loc.id); setLocationSearch(loc.displayName || loc.name); setLocations([]); }}
                          className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-emerald-50 text-sm text-left">
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
                <input type="text" value={form.placesTag} onChange={(e) => update('placesTag', e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && form.placesTag.trim()) {
                      e.preventDefault();
                      addPlace(form.placesTag.replace(',', ''));
                    }
                  }}
                  placeholder='Type place name'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => { if (form.placesTag.trim()) addPlace(form.placesTag); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Areas</label>
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
                <input type="text" value={form.pickupAreaInput} onChange={(e) => update('pickupAreaInput', e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && form.pickupAreaInput.trim()) {
                      e.preventDefault();
                      addPickupArea(form.pickupAreaInput.replace(',', ''));
                    }
                  }}
                  placeholder='Type area'
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                  <button key={d} type="button" onClick={() => update('duration', d)}
                    className={`py-2 px-3 rounded-lg border text-sm transition ${
                      form.duration === d ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-emerald-200'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              {form.duration === 'Custom' && (
                <input type="text" value={form.customDuration} onChange={(e) => update('customDuration', e.target.value)}
                  placeholder="e.g. 10 Days 9 Nights"
                  className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tour Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
                placeholder="Describe this tour..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tour Highlights</label>
              {form.highlights.map((h: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-9 flex items-center text-gray-400 text-sm">✦</span>
                  <input type="text" value={h} onChange={(e) => {
                    const updated = [...form.highlights];
                    updated[i] = e.target.value;
                    update('highlights', updated);
                  }}
                    placeholder="e.g. Visit iconic beaches"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isFixedDate ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFixedDate ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.isFixedDate && (
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-gray-200 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                    <input type="date" value={form.tourStartDate}
                      onChange={(e) => update('tourStartDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                    <input type="date" value={form.tourEndDate} min={form.tourStartDate}
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
            <p className="text-sm text-gray-500">Edit time-based stops for this tour</p>

            {form.itinerary.map((stop: any, si: number) => (
              <div key={stop.id} className={`border rounded-xl overflow-hidden ${stop.type === 'break' ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white'}`}>
                {stop.type === 'break' ? (
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input type="text" value={stop.time} onChange={(e) => updateStop(si, 'time', e.target.value)}
                        placeholder="Time"
                        className="w-32 border border-emerald-200 bg-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <input type="text" value={stop.breakNote} onChange={(e) => updateStop(si, 'breakNote', e.target.value)}
                        placeholder="Break note"
                        className="flex-1 border border-emerald-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">BREAK</span>
                    <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
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
                      <input type="text" value={stop.time} onChange={(e) => updateStop(si, 'time', e.target.value)}
                        placeholder="Time"
                        className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input type="text" value={stop.title} onChange={(e) => updateStop(si, 'title', e.target.value)}
                        placeholder="Stop name"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
                      {form.itinerary.length > 1 && (
                        <button onClick={() => removeStop(si)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <textarea value={stop.description} onChange={(e) => updateStop(si, 'description', e.target.value)} rows={2}
                        placeholder="Description"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">Activities</p>
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
                          placeholder="Time spent"
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
                <Coffee className="w-4 h-4" /> Add Break
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 */}
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
                    <span>Group Size</span>
                    <span>Price (₹)</span>
                  </div>
                  {form.priceTiers.map((tier: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <input type="text" value={tier.groupSize} onChange={(e) => updateTier(i, 'groupSize', e.target.value)}
                        placeholder="e.g. 2, 4, Upto 4"
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                          <input type="number" value={tier.price} onChange={(e) => updateTier(i, 'price', e.target.value)}
                            placeholder="2999"
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
                    <Plus className="w-4 h-4" /> Add Tier
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
                    placeholder="1500"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            )}

            {/* Agent fleet */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" /> Vehicles for this tour
              </label>
              {loadingVehicles ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold">No vehicles in your fleet</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableVehicles.map((v: any) => {
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Refund Notes</label>
              <textarea value={form.cancellationNotes} onChange={(e) => update('cancellationNotes', e.target.value)} rows={3}
                placeholder="Additional details about your refund policy"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => update('requireAdvancePayment', !form.requireAdvancePayment)}
                className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition">
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Require Advance Payment</p>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ml-4 ${form.requireAdvancePayment ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requireAdvancePayment ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.requireAdvancePayment && (
                <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Type</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'PERCENTAGE', label: '% Percentage' },
                        { value: 'FIXED', label: '₹ Fixed Amount' },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => update('advancePaymentType', opt.value)}
                          className={`flex-1 p-3 rounded-xl border-2 text-left transition ${
                            form.advancePaymentType === opt.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                          }`}>
                          <p className={`text-sm font-bold ${form.advancePaymentType === opt.value ? 'text-emerald-700' : 'text-gray-700'}`}>{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      {form.advancePaymentType === 'PERCENTAGE' ? '%' : '₹'}
                    </label>
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        {form.advancePaymentType === 'PERCENTAGE' ? '%' : '₹'}
                      </span>
                      <input type="number" value={form.advancePaymentValue} onChange={(e) => update('advancePaymentValue', e.target.value)}
                        placeholder={form.advancePaymentType === 'PERCENTAGE' ? '30' : '2000'}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6 */}
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
                  placeholder="Add custom inclusion"
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
                  placeholder="Add custom exclusion"
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
              <p className="text-xs text-gray-500 mb-3">First image becomes cover. For a sharp hero, use images at least <strong>1600px</strong> wide (ideally 2000px+).</p>
              {imageWarning && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>{imageWarning}</span>
                </div>
              )}
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
              <textarea value={form.termsConditions} onChange={(e) => update('termsConditions', e.target.value)} rows={3}
                placeholder="e.g. Refund policy, restrictions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep((s) => Math.max(s - 1, 1))} disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-40 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex gap-3">
          {step === STEPS.length ? (
            <>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save as Draft
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save & Publish
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
