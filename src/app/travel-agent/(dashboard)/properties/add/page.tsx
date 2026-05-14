'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Building2, Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const PROPERTY_TYPES = [
  { value: 'RESORT', label: 'Resort' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'HOMESTAY', label: 'Homestay' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'GUEST_HOUSE', label: 'Guest House' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'ROOMS', label: 'Rooms' },
  { value: 'OTHER', label: 'Other' },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [form, setForm] = useState({
    name: '',
    propertyType: 'RESORT',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    totalRooms: 1,
    startingPrice: '',
    amenities: '',
    inclusions: '',
    exclusions: '',
    rules: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    coverImage: '',
    galleryImages: [] as string[],
  });

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'properties');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && j.success && j.url) {
        update('coverImage', j.url);
        showToast({ type: 'success', title: 'Cover image uploaded' });
      } else {
        showToast({ type: 'error', title: j.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Upload failed' });
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadGallery = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('folder', 'properties');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && j.success && Array.isArray(j.uploaded)) {
        const urls = j.uploaded.map((u: any) => u.url).filter(Boolean);
        update('galleryImages', [...form.galleryImages, ...urls]);
        showToast({ type: 'success', title: `${urls.length} image(s) uploaded` });
        if (j.errors) showToast({ type: 'error', title: j.errors });
      } else {
        showToast({ type: 'error', title: j.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Upload failed' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (idx: number) =>
    update('galleryImages', form.galleryImages.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/travel-agent/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
          galleryImages:
            form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        showToast({ type: 'success', title: 'Property created' });
        router.push(`/travel-agent/properties/${json.property.id}/edit`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to create property' });
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
        href="/travel-agent/properties"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Properties
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Basic Info">
          <Field label="Property Name *" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Sunrise Beach Resort"
              className={inputCls}
            />
          </Field>
          <Field label="Property Type *" required>
            <select
              required
              value={form.propertyType}
              onChange={(e) => update('propertyType', e.target.value)}
              className={inputCls}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total Rooms *" required>
            <input
              type="number"
              min={1}
              required
              value={form.totalRooms}
              onChange={(e) => update('totalRooms', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Starting Price (₹/night)">
            <input
              type="number"
              min={0}
              value={form.startingPrice}
              onChange={(e) => update('startingPrice', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Check-in Time">
            <input
              type="time"
              value={form.checkInTime}
              onChange={(e) => update('checkInTime', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Check-out Time">
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => update('checkOutTime', e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={inputCls}
            />
          </div>
        </Section>

        <Section title="Address">
          <div className="sm:col-span-2">
            <label className={labelCls}>Street Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className={inputCls}
            />
          </div>
          <Field label="City">
            <input
              type="text"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Pincode">
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => update('pincode', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Images">
          {/* Cover Image */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Cover Image</label>
            {form.coverImage ? (
              <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => update('coverImage', '')}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center shadow"
                  aria-label="Remove cover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full max-w-sm h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition">
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="text-xs text-gray-500">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Click to upload cover image</span>
                    <span className="text-[11px] text-gray-400">JPG / PNG / WEBP — up to 5 MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCover(f);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          {/* Gallery Images */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Gallery Images</label>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60">
              {uploadingGallery ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload Images
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingGallery}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) uploadGallery(files);
                  e.target.value = '';
                }}
              />
            </label>
            {form.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                {form.galleryImages.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-700 shadow"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> No images uploaded yet.
              </p>
            )}
          </div>
        </Section>

        <Section title="Amenities & Policies">
          <div className="sm:col-span-2">
            <label className={labelCls}>Amenities</label>
            <textarea
              rows={3}
              value={form.amenities}
              onChange={(e) => update('amenities', e.target.value)}
              placeholder={`• Free WiFi\n• Swimming Pool\n• Restaurant\n• Parking\n• Air Conditioning`}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Inclusions</label>
            <textarea
              rows={3}
              value={form.inclusions}
              onChange={(e) => update('inclusions', e.target.value)}
              placeholder={`• Daily breakfast\n• Welcome drink\n• All taxes`}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Exclusions</label>
            <textarea
              rows={3}
              value={form.exclusions}
              onChange={(e) => update('exclusions', e.target.value)}
              placeholder={`• Lunch & dinner\n• Personal expenses`}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>House Rules</label>
            <textarea
              rows={3}
              value={form.rules}
              onChange={(e) => update('rules', e.target.value)}
              placeholder={`• No smoking inside rooms\n• Pets not allowed\n• Quiet hours 10pm – 7am`}
              className={inputCls}
            />
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Link
            href="/travel-agent/properties"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Create Property</>}
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
