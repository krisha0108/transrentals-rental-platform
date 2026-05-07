'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Save,
  Compass,
  Globe,
  Lock,
  Car,
  Users,
  Fuel,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

const CATEGORIES = [
  'Adventure',
  'Beach',
  'Family',
  'Honeymoon',
  'Pilgrimage',
  'Wildlife',
  'Trekking',
  'City Break',
  'Cultural',
  'Luxury',
];

export default function EditTourPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    destination: '',
    description: '',
    durationDays: 3,
    durationNights: 2,
    startingPrice: '',
    category: '',
    coverImage: '',
    galleryImages: [] as string[],
    vehicleIds: [] as string[],
    inclusions: '',
    exclusions: '',
    itinerary: '',
    termsConditions: '',
    isActive: true,
    isPublic: false,
  });

  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetch('/api/travel-agent/fleet')
      .then((r) => (r.ok ? r.json() : { fleets: [] }))
      .then((j) => setAvailableVehicles((j.fleets || []).filter((f: any) => f.isActive)))
      .finally(() => setLoadingVehicles(false));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/tours/${id}`);
        if (res.ok) {
          const t = await res.json();
          let gallery: string[] = [];
          try {
            if (t.galleryImages) gallery = JSON.parse(t.galleryImages);
          } catch {
            gallery = [];
          }
          let vehicleIds: string[] = [];
          try {
            if (t.vehicleIds) vehicleIds = JSON.parse(t.vehicleIds);
          } catch {
            vehicleIds = [];
          }
          setForm({
            title: t.title || '',
            destination: t.destination || '',
            description: t.description || '',
            durationDays: t.durationDays || 1,
            durationNights: t.durationNights || 0,
            startingPrice: t.startingPrice ? String(t.startingPrice) : '',
            category: t.category || '',
            coverImage: t.coverImage || '',
            galleryImages: gallery,
            vehicleIds,
            inclusions: t.inclusions || '',
            exclusions: t.exclusions || '',
            itinerary: t.itinerary || '',
            termsConditions: t.termsConditions || '',
            isActive: !!t.isActive,
            isPublic: !!t.isPublic,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleVehicle = (vid: string) => {
    update(
      'vehicleIds',
      form.vehicleIds.includes(vid)
        ? form.vehicleIds.filter((x) => x !== vid)
        : [...form.vehicleIds, vid],
    );
  };

  const addGalleryImage = () => {
    const url = galleryInput.trim();
    if (!url) return;
    update('galleryImages', [...form.galleryImages, url]);
    setGalleryInput('');
  };

  const removeGalleryImage = (idx: number) =>
    update('galleryImages', form.galleryImages.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.isPublic && !isApproved) {
      openVerificationModal();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/travel-agent/tours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
          galleryImages:
            form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
          vehicleIds:
            form.vehicleIds.length > 0 ? JSON.stringify(form.vehicleIds) : null,
        }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Tour updated' });
        router.push('/travel-agent/tours');
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
        href="/travel-agent/tours"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Tours
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Tour</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section title="Basic Info">
          <Field label="Tour Title *" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Destination *" required>
            <input
              type="text"
              required
              value={form.destination}
              onChange={(e) => update('destination', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <input
              list="tour-categories"
              type="text"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className={inputCls}
            />
            <datalist id="tour-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Starting Price (₹)">
            <input
              type="number"
              min={0}
              value={form.startingPrice}
              onChange={(e) => update('startingPrice', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Duration (Days) *" required>
            <input
              type="number"
              min={1}
              required
              value={form.durationDays}
              onChange={(e) => update('durationDays', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Duration (Nights)">
            <input
              type="number"
              min={0}
              value={form.durationNights}
              onChange={(e) => update('durationNights', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>Short Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={inputCls}
            />
          </div>
        </Section>

        <Section title="Images">
          <div className="sm:col-span-2">
            <label className={labelCls}>Cover Image URL</label>
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => update('coverImage', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Gallery Images</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={galleryInput}
                onChange={(e) => setGalleryInput(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
              <button
                type="button"
                onClick={addGalleryImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 rounded-xl"
              >
                Add
              </button>
            </div>
            {form.galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                {form.galleryImages.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section title="Itinerary & Terms">
          <div className="sm:col-span-2">
            <label className={labelCls}>Itinerary</label>
            <textarea
              rows={6}
              value={form.itinerary}
              onChange={(e) => update('itinerary', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Inclusions</label>
            <textarea
              rows={4}
              value={form.inclusions}
              onChange={(e) => update('inclusions', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Exclusions</label>
            <textarea
              rows={4}
              value={form.exclusions}
              onChange={(e) => update('exclusions', e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Terms & Conditions</label>
            <textarea
              rows={4}
              value={form.termsConditions}
              onChange={(e) => update('termsConditions', e.target.value)}
              className={inputCls}
            />
          </div>
        </Section>

        <Section title="Vehicles">
          <div className="sm:col-span-2">
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
                          <img src={v.coverImage} alt={v.vehicleName} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{v.vehicleName}</p>
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
                          active ? 'bg-emerald-600 text-white' : 'border-2 border-gray-300'
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
                ✓ {form.vehicleIds.length} vehicle{form.vehicleIds.length !== 1 ? 's' : ''} attached
              </p>
            )}
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
            <span className="text-sm font-semibold text-gray-700">Active (visible in your dashboard)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => update('isPublic', e.target.checked)}
              disabled={!isApproved}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              {isApproved ? <Globe className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
              Publish (customer-facing)
              {!isApproved && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2">
                  Requires Verification
                </span>
              )}
            </span>
          </label>
        </Section>

        <div className="flex justify-end gap-2">
          <Link
            href="/travel-agent/tours"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
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
