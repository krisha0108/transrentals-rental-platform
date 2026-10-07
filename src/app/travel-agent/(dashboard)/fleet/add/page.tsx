'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Save,
  UploadCloud,
  X,
  ImagePlus,
  FileText,
  Car,
  CarFront,
  CarTaxiFront,
  Bus,
  Gem,
  Bike,
  Caravan,
  Info,
  UserRound,
  IndianRupee,
  Sparkles,
  AlignLeft,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

const VEHICLE_TYPES = [
  { value: 'SEDAN', label: 'Sedan', icon: Car },
  { value: 'SUV', label: 'SUV', icon: CarFront },
  { value: 'MUV', label: 'MUV', icon: CarTaxiFront },
  { value: 'HATCHBACK', label: 'Hatchback', icon: Car },
  { value: 'TEMPO_TRAVELLER', label: 'Tempo Traveller', icon: Bus },
  { value: 'MINI_BUS', label: 'Mini Bus', icon: Bus },
  { value: 'BUS', label: 'Bus', icon: Bus },
  { value: 'LUXURY_CAR', label: 'Luxury Car', icon: Gem },
  { value: 'BIKE', label: 'Bike', icon: Bike },
  { value: 'SCOOTER', label: 'Scooter', icon: Bike },
  { value: 'CAMPER_VAN', label: 'Camper Van', icon: Caravan },
  { value: 'OTHER', label: 'Other', icon: Car },
];

const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'LPG', 'EV', 'HYBRID', 'OTHER'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];

const BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'MG',
  'Renault', 'Nissan', 'Ford', 'Volkswagen', 'Skoda', 'Force Motors',
  'Ashok Leyland', 'Eicher', 'Volvo', 'Scania', 'BMW', 'Mercedes-Benz', 'Audi',
  'Royal Enfield', 'Bajaj', 'TVS', 'Hero', 'Yamaha',
];

const MODELS_BY_BRAND: Record<string, string[]> = {
  'Maruti Suzuki': ['Swift Dzire', 'Ertiga', 'XL6', 'Eeco', 'Omni', 'Wagon R'],
  'Toyota': ['Innova Crysta', 'Innova Hycross', 'Fortuner', 'Etios', 'Glanza', 'Camry'],
  'Hyundai': ['Aura', 'Verna', 'Creta', 'Alcazar', 'Tucson', 'Xcent'],
  'Mahindra': ['Xylo', 'Marazzo', 'Scorpio', 'XUV700', 'Bolero', 'Bolero Camper'],
  'Tata': ['Winger', 'Indica', 'Nexon', 'Harrier', 'Safari', 'Indigo'],
  'Force Motors': ['Tempo Traveller', 'Trax', 'Urbania'],
  'Kia': ['Carens', 'Carnival', 'Seltos'],
  'MG': ['Hector', 'Gloster'],
  'Honda': ['City', 'Amaze', 'WR-V'],
  'Ashok Leyland': ['Viking', 'Falcon', 'Oyster'],
  'Eicher': ['Skyline Pro', 'Starline'],
  'Volvo': ['9400', 'B11R', 'Multi-Axle'],
  'Scania': ['Metrolink', 'Touring'],
  'Royal Enfield': ['Classic 350', 'Bullet', 'Himalayan'],
  'Bajaj': ['Pulsar', 'Avenger', 'Platina'],
  'TVS': ['Apache', 'Jupiter', 'Ntorq'],
  'Hero': ['Splendor', 'Passion', 'Glamour'],
  'Yamaha': ['FZ', 'R15', 'Fascino'],
};

const FALLBACK_MODELS = [
  'Innova Crysta', 'Ertiga', 'Swift Dzire', 'XL6', 'Tempo Traveller',
  'Winger', 'Xylo', 'Urbania', 'Force Traveller',
];

const COMMON_AMENITIES = [
  'Air Conditioning',
  'Bluetooth',
  'GPS Navigation',
  'Charging Port',
  'Bottled Water',
  'First Aid Kit',
  'Music System',
  'Reclining Seats',
  'Sunroof',
  'Leather Seats',
  'WiFi Hotspot',
  'Refrigerator',
];

export default function AddFleetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [docUploading, setDocUploading] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    vehicleType: 'SEDAN',
    vehicleName: '',
    brand: '',
    model: '',
    registrationNumber: '',
    yearOfManufacture: '',
    color: '',
    fuelType: '',
    transmission: '',
    seatingCapacity: 4,
    luggageCapacity: '',
    chauffeurIncluded: true,
    chauffeurName: '',
    chauffeurPhone: '',
    chauffeurLanguages: '',
    amenities: [] as string[],
    customAmenity: '',
    baseLocation: '',
    ratePerDay: '',
    ratePerKm: '',
    minimumBookingHours: '',
    description: '',
    coverImage: '',
    galleryImages: [] as string[],
    rcImage: '',
    insuranceImage: '',
    fitnessImage: '',
    permitImage: '',
    insuranceProvider: '',
    insuranceValidity: '',
    fitnessValidity: '',
    permitType: '',
  });

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleAmenity = (a: string) => {
    update(
      'amenities',
      form.amenities.includes(a)
        ? form.amenities.filter((x) => x !== a)
        : [...form.amenities, a],
    );
  };

  const addCustomAmenity = () => {
    const v = form.customAmenity.trim();
    if (!v || form.amenities.includes(v)) {
      setForm((p) => ({ ...p, customAmenity: '' }));
      return;
    }
    update('amenities', [...form.amenities, v]);
    setForm((p) => ({ ...p, customAmenity: '' }));
  };

  // ─── Image uploads ─────────────────────────────────────────────────────────
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Please select an image file' });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Image must be under 5 MB' });
      return null;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Upload failed' });
      return null;
    }
    const json = await res.json();
    return json.url;
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    const url = await uploadFile(file, 'fleet');
    if (url) update('coverImage', url);
    setCoverUploading(false);
  };

  const uploadGallery = async (files: FileList | File[]) => {
    setGalleryUploading(true);
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const fd = new FormData();
    arr.forEach((f) => fd.append('files', f));
    fd.append('folder', 'fleet');
    const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const json = await res.json();
      const newUrls: string[] = (json.uploaded || []).map((u: any) => u.url);
      update('galleryImages', [...form.galleryImages, ...newUrls]);
      showToast({ type: 'success', title: `${newUrls.length} image(s) uploaded` });
    } else {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Upload failed' });
    }
    setGalleryUploading(false);
  };

  const uploadDoc = async (
    file: File,
    docKey: 'rcImage' | 'insuranceImage' | 'fitnessImage' | 'permitImage',
  ) => {
    setDocUploading(docKey);
    const url = await uploadFile(file, 'fleet-docs');
    if (url) update(docKey, url);
    setDocUploading(null);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleName.trim()) {
      showToast({ type: 'error', title: 'Vehicle name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities: form.amenities.length > 0 ? JSON.stringify(form.amenities) : null,
        galleryImages:
          form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
        yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : null,
        seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : null,
        luggageCapacity: form.luggageCapacity ? Number(form.luggageCapacity) : null,
        ratePerDay: form.ratePerDay ? Number(form.ratePerDay) : null,
        ratePerKm: form.ratePerKm ? Number(form.ratePerKm) : null,
        minimumBookingHours: form.minimumBookingHours ? Number(form.minimumBookingHours) : null,
      };
      const res = await fetch('/api/travel-agent/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Vehicle added to fleet' });
        router.push('/travel-agent/fleet');
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to add vehicle' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  useTravelAgentPageHeader(
    'Add Vehicle',
    undefined,
    undefined,
    <Link
      key="back"
      href="/travel-agent/fleet"
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
    >
      <ArrowLeft className="w-4 h-4" /> All Vehicles
    </Link>,
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:items-start">
        {/* ── section quick-nav ── */}
        <nav className="hidden lg:block lg:sticky lg:top-6 space-y-0.5">
          {NAV_SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-emerald-700"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                {i + 1}
              </span>
              {s.label}
            </a>
          ))}
        </nav>

        <form id="add-fleet-form" onSubmit={handleSubmit} className="min-w-0 space-y-6 pb-24">
        {/* Vehicle Type */}
        <FormSection id="type" icon={<Car className="w-4 h-4" />} title="Vehicle Type" color="emerald">
          <div className="sm:col-span-2">
            <label className={labelCls}>Type *</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('vehicleType', t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                    form.vehicleType === t.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <t.icon className={`w-6 h-6 ${form.vehicleType === t.value ? 'text-emerald-600' : 'text-gray-500'}`} />
                  <span className="text-xs font-medium text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection id="basics" icon={<Info className="w-4 h-4" />} title="Basic Info" color="blue">
          <Field label="Vehicle Name *" required>
            <input
              type="text"
              required
              value={form.vehicleName}
              onChange={(e) => update('vehicleName', e.target.value)}
              placeholder="e.g. Toyota Innova Crysta"
              className={inputCls}
            />
          </Field>
          <Field label="Brand">
            <AutocompleteField
              value={form.brand}
              onChange={(v) => update('brand', v)}
              options={BRANDS}
              placeholder="e.g. Toyota — or type your own"
            />
          </Field>
          <Field label="Model">
            <AutocompleteField
              value={form.model}
              onChange={(v) => update('model', v)}
              options={MODELS_BY_BRAND[form.brand] || FALLBACK_MODELS}
              placeholder="e.g. Innova Crysta — or type your own"
            />
          </Field>
          <Field label="Registration Number">
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => update('registrationNumber', e.target.value.toUpperCase())}
              placeholder="MH 12 AB 1234"
              className={inputCls}
            />
          </Field>
          <Field label="Year of Manufacture">
            <input
              type="number"
              min={1980}
              max={new Date().getFullYear() + 1}
              value={form.yearOfManufacture}
              onChange={(e) => update('yearOfManufacture', e.target.value)}
              placeholder="e.g. 2022"
              className={inputCls}
            />
          </Field>
          <Field label="Color">
            <input
              type="text"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              placeholder="e.g. White"
              className={inputCls}
            />
          </Field>
          <Field label="Fuel Type">
            <select
              value={form.fuelType}
              onChange={(e) => update('fuelType', e.target.value)}
              className={inputCls}
            >
              <option value="">Select fuel type</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select
              value={form.transmission}
              onChange={(e) => update('transmission', e.target.value)}
              className={inputCls}
            >
              <option value="">Select transmission</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Seating Capacity">
            <input
              type="number"
              min={1}
              max={60}
              value={form.seatingCapacity}
              onChange={(e) => update('seatingCapacity', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Luggage Capacity (bags)">
            <input
              type="number"
              min={0}
              value={form.luggageCapacity}
              onChange={(e) => update('luggageCapacity', e.target.value)}
              placeholder="e.g. 4"
              className={inputCls}
            />
          </Field>
          <Field label="Base Location (city)">
            <input
              type="text"
              value={form.baseLocation}
              onChange={(e) => update('baseLocation', e.target.value)}
              placeholder="e.g. Mumbai"
              className={inputCls}
            />
          </Field>
        </FormSection>

        <FormSection id="driver" icon={<UserRound className="w-4 h-4" />} title="Driver / Chauffeur" color="purple">
          <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.chauffeurIncluded}
              onChange={(e) => update('chauffeurIncluded', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Chauffeur / driver included with this vehicle
            </span>
          </label>
          {form.chauffeurIncluded && (
            <>
              <Field label="Chauffeur Name">
                <input
                  type="text"
                  value={form.chauffeurName}
                  onChange={(e) => update('chauffeurName', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Chauffeur Phone">
                <input
                  type="tel"
                  value={form.chauffeurPhone}
                  onChange={(e) => update('chauffeurPhone', e.target.value)}
                  placeholder="10-digit"
                  className={inputCls}
                />
              </Field>
              <div className="sm:col-span-2">
                <label className={labelCls}>Languages spoken</label>
                <input
                  type="text"
                  value={form.chauffeurLanguages}
                  onChange={(e) => update('chauffeurLanguages', e.target.value)}
                  placeholder="e.g. Hindi, English, Marathi"
                  className={inputCls}
                />
              </div>
            </>
          )}
        </FormSection>

        <FormSection id="pricing" icon={<IndianRupee className="w-4 h-4" />} title="Pricing" color="amber">
          <Field label="Rate per Day (₹)">
            <input
              type="number"
              min={0}
              value={form.ratePerDay}
              onChange={(e) => update('ratePerDay', e.target.value)}
              placeholder="e.g. 3500"
              className={inputCls}
            />
          </Field>
          <Field label="Rate per KM (₹)">
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.ratePerKm}
              onChange={(e) => update('ratePerKm', e.target.value)}
              placeholder="e.g. 14"
              className={inputCls}
            />
          </Field>
          <Field label="Minimum Booking Hours">
            <input
              type="number"
              min={1}
              value={form.minimumBookingHours}
              onChange={(e) => update('minimumBookingHours', e.target.value)}
              placeholder="e.g. 4"
              className={inputCls}
            />
          </Field>
        </FormSection>

        <FormSection id="amenities" icon={<Sparkles className="w-4 h-4" />} title="Amenities" color="teal">
          <div className="sm:col-span-2">
            <label className={labelCls}>What this vehicle offers</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_AMENITIES.map((a) => {
                const active = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-200'
                    }`}
                  >
                    {active && '✓ '}
                    {a}
                  </button>
                );
              })}
            </div>

            {/* Custom amenities the user has added — not in the common list above */}
            {form.amenities.filter((a) => !COMMON_AMENITIES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.amenities
                  .filter((a) => !COMMON_AMENITIES.includes(a))
                  .map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                    >
                      ✓ {a}
                      <button
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className="hover:text-red-600"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={form.customAmenity}
                onChange={(e) => setForm((p) => ({ ...p, customAmenity: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
                placeholder="Add custom amenity…"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                disabled={!form.customAmenity.trim()}
                className="inline-flex items-center gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </FormSection>

        <FormSection id="photos" icon={<ImagePlus className="w-4 h-4" />} title="Images" color="pink">
          {/* Cover image */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Cover Image</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const arr = Array.from(files);
                  uploadCover(arr[0]);
                  if (arr.length > 1) uploadGallery(arr.slice(1));
                }
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
                  {coverUploading ? 'Uploading…' : 'Click to upload photos'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG / PNG / WebP — up to 5 MB each. Select multiple — the first becomes the cover, the rest go to the gallery.
                </p>
              </button>
            )}
          </div>

          {/* Gallery */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Gallery Images</label>
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
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {form.galleryImages.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative aspect-square group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
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
                  className="aspect-square border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600"
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
        </FormSection>

        <FormSection id="documents" icon={<FileText className="w-4 h-4" />} title="Vehicle Documents" color="green">
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { key: 'rcImage', label: 'RC Document', validityKey: null },
                { key: 'insuranceImage', label: 'Insurance', validityKey: 'insuranceValidity' },
                { key: 'fitnessImage', label: 'Fitness Certificate', validityKey: 'fitnessValidity' },
                { key: 'permitImage', label: 'Permit', validityKey: null },
              ] as const
            ).map((d) => (
              <DocUploadCard
                key={d.key}
                label={d.label}
                imageUrl={form[d.key as 'rcImage'] as string}
                uploading={docUploading === d.key}
                onUpload={(file) => uploadDoc(file, d.key as any)}
                onRemove={() => update(d.key as any, '')}
              />
            ))}
          </div>
          <Field label="Insurance Provider">
            <input
              type="text"
              value={form.insuranceProvider}
              onChange={(e) => update('insuranceProvider', e.target.value)}
              placeholder="e.g. ICICI Lombard"
              className={inputCls}
            />
          </Field>
          <Field label="Insurance Valid Till">
            <input
              type="date"
              value={form.insuranceValidity}
              onChange={(e) => update('insuranceValidity', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Fitness Valid Till">
            <input
              type="date"
              value={form.fitnessValidity}
              onChange={(e) => update('fitnessValidity', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Permit Type">
            <input
              type="text"
              value={form.permitType}
              onChange={(e) => update('permitType', e.target.value)}
              placeholder="e.g. All India Tourist Permit"
              className={inputCls}
            />
          </Field>
        </FormSection>

        <FormSection id="description" icon={<AlignLeft className="w-4 h-4" />} title="Description" color="gray">
          <div className="sm:col-span-2">
            <label className={labelCls}>About this vehicle</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Anything customers should know — condition, special features, etc."
              className={inputCls}
            />
          </div>
        </FormSection>

        </form>
      </div>

      {/* ── sticky action bar ── */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-gray-200 bg-white/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex justify-end gap-3">
          <Link href="/travel-agent/fleet" className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5">
            Cancel
          </Link>
          <button
            type="submit"
            form="add-fleet-form"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Add Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'type', label: 'Vehicle Type' },
  { id: 'basics', label: 'Basic Info' },
  { id: 'driver', label: 'Driver / Chauffeur' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'photos', label: 'Images' },
  { id: 'documents', label: 'Vehicle Documents' },
  { id: 'description', label: 'Description' },
];

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

const SECTION_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  pink: 'bg-pink-50 text-pink-700',
  teal: 'bg-teal-50 text-teal-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  gray: 'bg-gray-100 text-gray-700',
};

function FormSection({
  id, icon, title, color, children,
}: {
  id: string; icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${SECTION_COLORS[color] || 'bg-gray-100 text-gray-700'}`}>
          {icon}
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function AutocompleteField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = value.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exactMatch = options.some((o) => o.toLowerCase() === q);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputCls} pr-9`}
        />
        <ChevronDown
          onClick={() => setOpen((o) => !o)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => { onChange(o); setOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {o}
              </button>
            ))
          ) : (
            <p className="px-3.5 py-2 text-xs text-gray-400">No matches — your typed value will be used</p>
          )}
          {q && !exactMatch && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3.5 py-2 text-sm font-semibold text-emerald-700 border-t border-gray-100 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Use "{value.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DocUploadCard({
  label,
  imageUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
        <FileText className="w-3 h-3 text-gray-400" /> {label}
      </p>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          if (ref.current) ref.current.value = '';
        }}
      />
      {imageUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs text-emerald-700 hover:underline truncate bg-emerald-50 rounded px-2 py-1.5"
          >
            ✓ Uploaded
          </a>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="text-xs text-gray-500 hover:text-emerald-600 px-1.5"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-600 px-1.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-gray-300 hover:border-emerald-300 rounded-lg py-3 text-xs font-semibold text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-1.5"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="w-3 h-3" /> Upload {label}
            </>
          )}
        </button>
      )}
    </div>
  );
}
