'use client';

import React, { useEffect, useRef, useState } from 'react';
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

const toDateInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function EditFleetPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
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
    isActive: true,
    isAvailable: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/fleet/${id}`);
        if (res.ok) {
          const f = await res.json();
          let amenities: string[] = [];
          let gallery: string[] = [];
          try {
            if (f.amenities) amenities = JSON.parse(f.amenities);
          } catch {}
          try {
            if (f.galleryImages) gallery = JSON.parse(f.galleryImages);
          } catch {}
          setForm({
            vehicleType: f.vehicleType || 'SEDAN',
            vehicleName: f.vehicleName || '',
            brand: f.brand || '',
            model: f.model || '',
            registrationNumber: f.registrationNumber || '',
            yearOfManufacture: f.yearOfManufacture ? String(f.yearOfManufacture) : '',
            color: f.color || '',
            fuelType: f.fuelType || '',
            transmission: f.transmission || '',
            seatingCapacity: f.seatingCapacity || 4,
            luggageCapacity: f.luggageCapacity ? String(f.luggageCapacity) : '',
            chauffeurIncluded: !!f.chauffeurIncluded,
            chauffeurName: f.chauffeurName || '',
            chauffeurPhone: f.chauffeurPhone || '',
            chauffeurLanguages: f.chauffeurLanguages || '',
            amenities,
            baseLocation: f.baseLocation || '',
            ratePerDay: f.ratePerDay ? String(f.ratePerDay) : '',
            ratePerKm: f.ratePerKm ? String(f.ratePerKm) : '',
            minimumBookingHours: f.minimumBookingHours ? String(f.minimumBookingHours) : '',
            description: f.description || '',
            coverImage: f.coverImage || '',
            galleryImages: gallery,
            rcImage: f.rcImage || '',
            insuranceImage: f.insuranceImage || '',
            fitnessImage: f.fitnessImage || '',
            permitImage: f.permitImage || '',
            insuranceProvider: f.insuranceProvider || '',
            insuranceValidity: toDateInput(f.insuranceValidity),
            fitnessValidity: toDateInput(f.fitnessValidity),
            permitType: f.permitType || '',
            isActive: !!f.isActive,
            isAvailable: !!f.isAvailable,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await fetch(`/api/travel-agent/fleet/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Vehicle updated' });
        router.push('/travel-agent/fleet');
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to update' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Vehicle Type">
          <div className="sm:col-span-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
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
        </Section>

        <Section title="Basic Info">
          <Field label="Vehicle Name *" required>
            <input
              type="text"
              required
              value={form.vehicleName}
              onChange={(e) => update('vehicleName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Brand">
            <input type="text" value={form.brand} onChange={(e) => update('brand', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Model">
            <input type="text" value={form.model} onChange={(e) => update('model', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Registration Number">
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => update('registrationNumber', e.target.value.toUpperCase())}
              className={inputCls}
            />
          </Field>
          <Field label="Year of Manufacture">
            <input
              type="number"
              value={form.yearOfManufacture}
              onChange={(e) => update('yearOfManufacture', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Color">
            <input type="text" value={form.color} onChange={(e) => update('color', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Fuel Type">
            <select value={form.fuelType} onChange={(e) => update('fuelType', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select value={form.transmission} onChange={(e) => update('transmission', e.target.value)} className={inputCls}>
              <option value="">—</option>
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
              value={form.seatingCapacity}
              onChange={(e) => update('seatingCapacity', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Luggage Capacity">
            <input
              type="number"
              value={form.luggageCapacity}
              onChange={(e) => update('luggageCapacity', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Base Location">
            <input
              type="text"
              value={form.baseLocation}
              onChange={(e) => update('baseLocation', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Pricing">
          <Field label="Rate per Day (₹)">
            <input type="number" value={form.ratePerDay} onChange={(e) => update('ratePerDay', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Rate per KM (₹)">
            <input type="number" step="0.1" value={form.ratePerKm} onChange={(e) => update('ratePerKm', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Minimum Booking Hours">
            <input type="number" value={form.minimumBookingHours} onChange={(e) => update('minimumBookingHours', e.target.value)} className={inputCls} />
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
            <span className="text-sm font-semibold text-gray-700">Chauffeur included</span>
          </label>
          <Field label="Chauffeur Name">
            <input type="text" value={form.chauffeurName} onChange={(e) => update('chauffeurName', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Chauffeur Phone">
            <input type="tel" value={form.chauffeurPhone} onChange={(e) => update('chauffeurPhone', e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>Languages</label>
            <input type="text" value={form.chauffeurLanguages} onChange={(e) => update('chauffeurLanguages', e.target.value)} className={inputCls} />
          </div>
        </Section>

        <Section title="Visibility">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => update('isAvailable', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">Available for booking</span>
          </label>
        </Section>

        <Section title="Description">
          <div className="sm:col-span-2">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
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
                <Save className="w-4 h-4" /> Save Changes
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
