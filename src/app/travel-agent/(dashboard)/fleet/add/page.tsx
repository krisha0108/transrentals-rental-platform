'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Save,
  Car,
  UploadCloud,
  X,
  ImagePlus,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const VEHICLE_TYPES = [
  { value: 'SEDAN', label: 'Sedan', icon: '🚗' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'MUV', label: 'MUV', icon: '🚐' },
  { value: 'HATCHBACK', label: 'Hatchback', icon: '🚗' },
  { value: 'TEMPO_TRAVELLER', label: 'Tempo Traveller', icon: '🚐' },
  { value: 'MINI_BUS', label: 'Mini Bus', icon: '🚌' },
  { value: 'BUS', label: 'Bus', icon: '🚌' },
  { value: 'LUXURY_CAR', label: 'Luxury Car', icon: '🏎️' },
  { value: 'BIKE', label: 'Bike', icon: '🏍️' },
  { value: 'SCOOTER', label: 'Scooter', icon: '🛵' },
  { value: 'CAMPER_VAN', label: 'Camper Van', icon: '🚐' },
  { value: 'OTHER', label: 'Other', icon: '🚗' },
];

const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'LPG', 'EV', 'HYBRID', 'OTHER'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];

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

  const uploadGallery = async (files: FileList) => {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/travel-agent/fleet"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Vehicles
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Car className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle Type */}
        <Section title="Vehicle Type">
          <div className="sm:col-span-2">
            <label className={labelCls}>Type *</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('vehicleType', t.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    form.vehicleType === t.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Basic Info">
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
            <input
              type="text"
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
              placeholder="e.g. Toyota"
              className={inputCls}
            />
          </Field>
          <Field label="Model">
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder="e.g. Innova Crysta"
              className={inputCls}
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
        </Section>

        <Section title="Driver / Chauffeur">
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
        </Section>

        <Section title="Pricing">
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
        </Section>

        <Section title="Amenities">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        </Section>

        <Section title="Images">
          {/* Cover image */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Cover Image</label>
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
        </Section>

        <Section title="Vehicle Documents">
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
        </Section>

        <Section title="Description">
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
        </Section>

        <div className="flex justify-end gap-2">
          <Link
            href="/travel-agent/fleet"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
          >
            Cancel
          </Link>
          <button
            type="submit"
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
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">{title}</h2>
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
