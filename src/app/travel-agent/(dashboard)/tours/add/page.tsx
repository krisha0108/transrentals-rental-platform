'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Save,
  Compass,
  UploadCloud,
  X,
  ImagePlus,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  IndianRupee,
  Sparkles,
  Globe,
  Lock,
  Car,
  Users,
  Fuel,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

const STEPS = [
  { id: 1, label: 'Category & Title' },
  { id: 2, label: 'Destination & Overview' },
  { id: 3, label: 'Duration & Pricing' },
  { id: 4, label: 'Itinerary & Highlights' },
  { id: 5, label: 'Vehicles & Inclusions' },
  { id: 6, label: 'Images & Publish' },
];

const CATEGORIES = [
  { name: 'Adventure', icon: '🏞️' },
  { name: 'Beach', icon: '🏖️' },
  { name: 'Family', icon: '👨‍👩‍👧' },
  { name: 'Honeymoon', icon: '💑' },
  { name: 'Pilgrimage', icon: '🛕' },
  { name: 'Wildlife', icon: '🦁' },
  { name: 'Trekking', icon: '🥾' },
  { name: 'City Break', icon: '🏙️' },
  { name: 'Cultural', icon: '🎭' },
  { name: 'Luxury', icon: '👑' },
  { name: 'Hill Station', icon: '⛰️' },
  { name: 'Custom', icon: '✨' },
];

const DURATION_PRESETS = [
  { days: 1, nights: 0, label: 'Half Day / 1 Day' },
  { days: 2, nights: 1, label: '2D / 1N' },
  { days: 3, nights: 2, label: '3D / 2N' },
  { days: 4, nights: 3, label: '4D / 3N' },
  { days: 5, nights: 4, label: '5D / 4N' },
  { days: 6, nights: 5, label: '6D / 5N' },
  { days: 7, nights: 6, label: '7D / 6N' },
  { days: 0, nights: 0, label: 'Custom' },
];

const COMMON_INCLUSIONS = [
  'Hotel Pickup & Drop',
  'AC Vehicle',
  'Professional Driver',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Hotel Stay',
  'Tour Guide',
  'Entry Tickets',
  'Fuel Charges',
  'Toll Charges',
  'Parking Charges',
  'Bottled Water',
  'Sightseeing as per itinerary',
  'All applicable taxes',
];

const COMMON_EXCLUSIONS = [
  'Airfare / Train fare',
  'Personal expenses',
  'Lunch & Dinner (unless mentioned)',
  'Tips & Gratuities',
  'Travel Insurance',
  'Camera Fees',
  'Alcohol',
  'Room Service',
  'Adventure Activity charges',
  'Anything not mentioned in inclusions',
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function AddTourPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    // Step 1
    category: '',
    title: '',
    // Step 2
    destination: '',
    description: '',
    // Step 3
    durationDays: 3,
    durationNights: 2,
    durationPreset: '3D / 2N',
    startingPrice: '',
    // Step 4
    highlights: [''] as string[],
    itinerary: '',
    // Step 5
    inclusions: [] as string[],
    customInclusion: '',
    exclusions: [] as string[],
    customExclusion: '',
    vehicleIds: [] as string[],
    // Step 6
    coverImage: '',
    galleryImages: [] as string[],
    termsConditions: '',
  });

  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetch('/api/travel-agent/fleet')
      .then((r) => (r.ok ? r.json() : { fleets: [] }))
      .then((j) => setAvailableVehicles((j.fleets || []).filter((f: any) => f.isActive)))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // ─── Step validation ───────────────────────────────────────────────────────
  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.category) return 'Please pick a category';
      if (!form.title.trim()) return 'Tour title is required';
      if (form.title.trim().length < 10) return 'Title should be at least 10 characters';
    }
    if (s === 2) {
      if (!form.destination.trim()) return 'Destination is required';
      if (!form.description.trim()) return 'A short overview is required';
      if (form.description.trim().length < 30)
        return 'Overview should be at least 30 characters';
    }
    if (s === 3) {
      if (form.durationDays < 1) return 'Duration must be at least 1 day';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    if (step < STEPS.length) setStep(step + 1);
  };

  const goBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  // ─── Highlights ────────────────────────────────────────────────────────────
  const updateHighlight = (i: number, v: string) =>
    update('highlights', form.highlights.map((h, idx) => (idx === i ? v : h)));
  const addHighlight = () => update('highlights', [...form.highlights, '']);
  const removeHighlight = (i: number) =>
    update('highlights', form.highlights.filter((_, idx) => idx !== i));

  // ─── Inclusions / Exclusions chips ─────────────────────────────────────────
  const toggleInclusion = (item: string) => {
    const has = form.inclusions.includes(item);
    update('inclusions', has ? form.inclusions.filter((x) => x !== item) : [...form.inclusions, item]);
  };
  const addCustomInclusion = () => {
    const val = form.customInclusion.trim();
    if (!val) return;
    if (form.inclusions.includes(val)) {
      setForm((p) => ({ ...p, customInclusion: '' }));
      return;
    }
    update('inclusions', [...form.inclusions, val]);
    setForm((p) => ({ ...p, customInclusion: '' }));
  };

  const toggleExclusion = (item: string) => {
    const has = form.exclusions.includes(item);
    update('exclusions', has ? form.exclusions.filter((x) => x !== item) : [...form.exclusions, item]);
  };
  const addCustomExclusion = () => {
    const val = form.customExclusion.trim();
    if (!val) return;
    if (form.exclusions.includes(val)) {
      setForm((p) => ({ ...p, customExclusion: '' }));
      return;
    }
    update('exclusions', [...form.exclusions, val]);
    setForm((p) => ({ ...p, customExclusion: '' }));
  };

  // ─── Vehicles ──────────────────────────────────────────────────────────────
  const toggleVehicle = (id: string) => {
    update(
      'vehicleIds',
      form.vehicleIds.includes(id)
        ? form.vehicleIds.filter((v) => v !== id)
        : [...form.vehicleIds, id],
    );
  };

  // ─── Image uploads ─────────────────────────────────────────────────────────
  const uploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Please select an image file' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast({ type: 'error', title: 'Image must be under 5 MB' });
      return;
    }
    setCoverUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'tours');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: data });
      if (res.ok) {
        const json = await res.json();
        update('coverImage', json.url);
        showToast({ type: 'success', title: 'Cover image uploaded' });
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Upload failed' });
    } finally {
      setCoverUploading(false);
    }
  };

  const uploadGallery = async (files: FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    setGalleryUploading(true);
    try {
      const data = new FormData();
      arr.forEach((f) => data.append('files', f));
      data.append('folder', 'tours');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: data });
      if (res.ok) {
        const json = await res.json();
        const newUrls: string[] = (json.uploaded || []).map((u: any) => u.url);
        update('galleryImages', [...form.galleryImages, ...newUrls]);
        showToast({ type: 'success', title: `${newUrls.length} image(s) uploaded` });
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Upload failed' });
    } finally {
      setGalleryUploading(false);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (publish: boolean) => {
    if (publish && !isApproved) {
      openVerificationModal();
      return;
    }
    // final pass on required fields
    for (let s = 1; s <= 3; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const cleanHighlights = form.highlights
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const payload = {
        title: form.title.trim(),
        destination: form.destination.trim(),
        description: form.description.trim(),
        durationDays: form.durationDays,
        durationNights: form.durationNights,
        startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
        category: form.category,
        coverImage: form.coverImage || null,
        galleryImages:
          form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
        vehicleIds:
          form.vehicleIds.length > 0 ? JSON.stringify(form.vehicleIds) : null,
        // Encode highlights as JSON inside itinerary's first line, or store as part of inclusions
        // To keep schema unchanged we serialize highlights into inclusions as a list with "✨" prefix
        inclusions:
          form.inclusions.length > 0 || cleanHighlights.length > 0
            ? JSON.stringify({ highlights: cleanHighlights, items: form.inclusions })
            : null,
        exclusions: form.exclusions.length > 0 ? JSON.stringify(form.exclusions) : null,
        itinerary: form.itinerary.trim() || null,
        termsConditions: form.termsConditions.trim() || null,
      };

      const res = await fetch('/api/travel-agent/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error || 'Failed to create tour');
        return;
      }
      const json = await res.json();

      // If user clicked Publish, also flip isPublic
      if (publish) {
        await fetch(`/api/travel-agent/tours/${json.tour.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: true }),
        });
      }

      showToast({
        type: 'success',
        title: publish ? 'Tour published 🎉' : 'Draft saved',
      });
      router.push('/travel-agent/tours');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href="/travel-agent/tours"
          className="text-gray-500 hover:text-emerald-600"
          aria-label="Back to tours"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create New Tour</h1>
          <p className="text-sm text-gray-500">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s.id <= step ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step labels (mobile-hidden) */}
      <div className="hidden md:flex justify-between mb-6 text-[11px] font-medium text-gray-500">
        {STEPS.map((s) => (
          <div key={s.id} className={s.id === step ? 'text-emerald-700 font-bold' : ''}>
            {s.id}. {s.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7">
        {/* ─── STEP 1: Category & Title ─────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tour Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => update('category', cat.name)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-left ${
                      form.category === cat.name
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tour Title <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Make it clear and compelling — this is what customers see first.
              </p>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Magical Goa Beach Holiday — 4 Days 3 Nights"
                maxLength={100}
                className={inputCls}
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {form.title.length} / 100
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Destination & Overview ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The main city / region this tour is in.
              </p>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => update('destination', e.target.value)}
                  placeholder="e.g. Goa, Manali, Kerala"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Short Overview <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                A 2-3 line pitch shown in search results and tour cards.
              </p>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What makes this tour special? Key experiences, vibe, who it's for…"
                maxLength={400}
                className={inputCls}
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {form.description.length} / 400
              </p>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Duration & Pricing ──────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Duration <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_PRESETS.map((p) => {
                  const active = form.durationPreset === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          durationPreset: p.label,
                          ...(p.label !== 'Custom'
                            ? { durationDays: p.days, durationNights: p.nights }
                            : {}),
                        }))
                      }
                      className={`text-sm font-semibold py-2.5 rounded-xl border-2 transition ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {form.durationPreset === 'Custom' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Days</label>
                    <input
                      type="number"
                      min={1}
                      value={form.durationDays}
                      onChange={(e) => update('durationDays', Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nights</label>
                    <input
                      type="number"
                      min={0}
                      value={form.durationNights}
                      onChange={(e) => update('durationNights', Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Starting Price (per person)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Minimum price you charge. Leave blank if "On Request".
              </p>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={form.startingPrice}
                  onChange={(e) => update('startingPrice', e.target.value)}
                  placeholder="e.g. 12500"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Itinerary & Highlights ──────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tour Highlights
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Top 3-5 things customers will love. Shows up as bullet points on your tour page.
              </p>
              <div className="space-y-2">
                {form.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-600 text-lg">✨</span>
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => updateHighlight(i, e.target.value)}
                      placeholder="e.g. Sunset cruise on the Mandovi river"
                      className={inputCls}
                    />
                    {form.highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHighlight(i)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addHighlight}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add another highlight
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Day-by-Day Itinerary
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use Day 1, Day 2 format — what happens, where, when.
              </p>
              <textarea
                rows={8}
                value={form.itinerary}
                onChange={(e) => update('itinerary', e.target.value)}
                placeholder={`Day 1: Arrival in Goa\n• Pickup from airport\n• Check-in to hotel\n• Evening at Calangute Beach\n\nDay 2: North Goa Sightseeing\n• Aguada Fort\n• Anjuna Flea Market\n• Sunset Cruise`}
                className={`${inputCls} font-mono text-xs leading-relaxed`}
              />
            </div>
          </div>
        )}

        {/* ─── STEP 5: Vehicles & Inclusions ─────────────────────── */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Vehicles section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                Vehicles for this tour
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Pick from your fleet — customers will see exactly which vehicle(s) to expect.
              </p>

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
                      You can still publish this tour without a vehicle.{' '}
                      <a
                        href="/travel-agent/fleet/add"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline hover:text-amber-900"
                      >
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
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicle(v.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                          active
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {v.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.coverImage}
                              alt={v.vehicleName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {v.vehicleName}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{v.vehicleType.replace(/_/g, ' ')}</span>
                            {v.seatingCapacity && (
                              <span className="flex items-center gap-0.5">
                                <Users className="w-2.5 h-2.5" /> {v.seatingCapacity}
                              </span>
                            )}
                            {v.fuelType && (
                              <span className="flex items-center gap-0.5">
                                <Fuel className="w-2.5 h-2.5" /> {v.fuelType}
                              </span>
                            )}
                            {v.ratePerDay && (
                              <span className="font-semibold text-emerald-700">
                                ₹{v.ratePerDay.toLocaleString('en-IN')}/day
                              </span>
                            )}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-gray-300'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {form.vehicleIds.length > 0 && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  ✓ {form.vehicleIds.length} vehicle
                  {form.vehicleIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Inclusions section */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What&apos;s included?
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Tap to add items. Anything customers expect.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INCLUSIONS.map((item) => {
                  const active = form.inclusions.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInclusion(item)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1.5 ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.customInclusion}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, customInclusion: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomInclusion();
                    }
                  }}
                  placeholder="Add custom inclusion…"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addCustomInclusion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 rounded-xl"
                >
                  Add
                </button>
              </div>
              {form.inclusions.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {form.inclusions.length} included • {COMMON_INCLUSIONS.length} suggestions
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What&apos;s NOT included?
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Set clear expectations to avoid surprises.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_EXCLUSIONS.map((item) => {
                  const active = form.exclusions.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleExclusion(item)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition flex items-center gap-1.5 ${
                        active
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-red-200'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.customExclusion}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, customExclusion: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomExclusion();
                    }
                  }}
                  placeholder="Add custom exclusion…"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addCustomExclusion}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 6: Images & Publish ────────────────────────────── */}
        {step === 6 && (
          <div className="space-y-6">
            {/* Cover */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Image
              </label>
              <p className="text-xs text-gray-500 mb-3">
                The hero photo customers see first. Pick a great one.
              </p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                  if (coverInputRef.current) coverInputRef.current.value = '';
                }}
              />
              {form.coverImage ? (
                <div className="relative w-full max-w-md aspect-[16/9] rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => update('coverImage', '')}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    {coverUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-3 h-3" /> Replace
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="w-full max-w-md border-2 border-dashed border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl px-6 py-8 text-center transition-colors"
                >
                  {coverUploading ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  )}
                  <p className="text-sm font-semibold text-gray-700">
                    {coverUploading ? 'Uploading…' : 'Click to upload cover image'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">JPG / PNG / WebP — up to 5 MB</p>
                </button>
              )}
            </div>

            {/* Gallery */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gallery Images
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Add 4-8 photos to give customers a real feel of the tour.
              </p>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) uploadGallery(e.target.files);
                  if (galleryInputRef.current) galleryInputRef.current.value = '';
                }}
              />
              {form.galleryImages.length === 0 ? (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={galleryUploading}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-xl px-6 py-8 text-center transition-colors"
                >
                  {galleryUploading ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 animate-spin" />
                  ) : (
                    <ImagePlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  )}
                  <p className="text-sm font-semibold text-gray-700">
                    {galleryUploading ? 'Uploading…' : 'Click to add gallery images'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pick multiple at once • 5 MB each
                  </p>
                </button>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {form.galleryImages.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative aspect-square group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            'galleryImages',
                            form.galleryImages.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={galleryUploading}
                    className="aspect-square border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    {galleryUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-semibold">Add more</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Terms & Cancellation Policy
                <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.termsConditions}
                onChange={(e) => update('termsConditions', e.target.value)}
                placeholder="e.g. Full refund up to 48 hrs before. 50% refund within 48 hrs. No refund after departure."
                className={inputCls}
              />
            </div>

            {/* Preview banner */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-bold text-emerald-900">Ready to go live?</p>
                <p className="text-xs text-emerald-800 mt-1">
                  {isApproved
                    ? 'Click Publish to make this tour visible on /wander to all customers. Choose Save Draft to keep it private and finish later.'
                    : 'You can save as draft now. Publishing requires KYC verification — we\'ll let you know when you\'re approved.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Footer Actions ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save as Draft
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50"
                title={!isApproved ? 'KYC verification required to publish' : ''}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isApproved ? (
                  <>
                    <Globe className="w-4 h-4" /> Publish Now
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Publish (verify first)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
