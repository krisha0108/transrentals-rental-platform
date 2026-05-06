// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Zap, ChevronLeft, Loader2, AlertCircle, Search, MapPin, X,
  Image as ImageIcon, Save, Send, Trash2, Eye,
} from 'lucide-react';
import TourDescriptionEditor from '@/components/admin/wander/TourDescriptionEditor';
import WanderQuickPreviewModal from '@/components/admin/wander/WanderQuickPreviewModal';

const DURATION_OPTIONS = [
  'Half Day (4-5 hrs)', 'Full Day (8-10 hrs)', '2 Days 1 Night',
  '3 Days 2 Nights', '4 Days 3 Nights', '5 Days 4 Nights',
  '6 Days 5 Nights', '7 Days 6 Nights', 'Custom',
];

function parseImages(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch { return []; }
  }
  return [];
}

export default function AdminQuickEditTourPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    mainLocationId: '',
    duration: '',
    customDuration: '',
    basePrice: '',
    description: '',
    images: [] as string[],
    status: 'DRAFT',
  });

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  async function switchToDetailed() {
    setSwitching(true);
    setError('');
    try {
      const res = await fetch('/api/admin/wander/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listingId, createMode: 'DETAILED' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to switch'); setSwitching(false); return; }
      router.push(`/admin/wander/listings/${listingId}/edit`);
    } catch (err: any) {
      setError(err.message || 'Failed to switch');
      setSwitching(false);
    }
  }

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    fetch('/api/admin/wander/categories')
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/wander/listings/${listingId}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to load listing'); setLoading(false); return; }

        const allImages = parseImages(data.images);

        const knownDurations = DURATION_OPTIONS.filter((d) => d !== 'Custom');
        const isCustom = data.duration && !knownDurations.includes(data.duration);

        setForm({
          categoryId: data.categoryId || '',
          title: data.title || '',
          mainLocationId: data.mainLocationId || '',
          duration: isCustom ? 'Custom' : (data.duration || ''),
          customDuration: isCustom ? data.duration : '',
          basePrice: data.basePrice?.toString() || '',
          description: data.description || '',
          images: allImages,
          status: data.status || 'DRAFT',
        });

        if (data.mainLocation) {
          setSelectedLocation({ id: data.mainLocation.id, name: data.mainLocation.name });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocations([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (locationSearch.length < 2) { setLocations([]); return; }
    setLocationLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/wander/locations?search=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : data.locations || []);
      } catch { setLocations([]); }
      finally { setLocationLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [locationSearch]);

  async function uploadFiles(files: File[]) {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return (
      data.images
      || (data.uploaded ? data.uploaded.map((f: any) => f.url) : null)
      || (data.url ? [data.url] : [])
    ) as string[];
  }

  async function handleImagesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await uploadFiles(files);
      update('images', [...form.images, ...urls]);
    } catch (err: any) { setError(err.message); }
    finally { setUploadingImages(false); e.target.value = ''; }
  }

  function removeImage(idx: number) {
    update('images', form.images.filter((_, i) => i !== idx));
  }

  function validate(forPublish: boolean) {
    if (!form.categoryId) return 'Please select a category';
    if (!form.title.trim()) return 'Tour title is required';
    if (forPublish && !form.mainLocationId) return 'Main location is required to publish';
    if (forPublish && !form.duration) return 'Duration is required to publish';
    return '';
  }

  async function handleSubmit(publish: boolean) {
    const v = validate(publish);
    if (v) { setError(v); return; }
    setSaving(true);
    setError('');

    const descText = form.description.replace(/<[^>]*>/g, '').trim();

    const payload = {
      categoryId: form.categoryId,
      title: form.title.trim(),
      mainLocationId: form.mainLocationId || null,
      duration: form.duration === 'Custom' ? form.customDuration.trim() : form.duration,
      description: descText ? form.description : null,
      basePrice: form.basePrice || null,
      priceType: form.basePrice ? 'PER_PERSON' : 'ON_REQUEST',
      images: form.images,
      publish,
    };

    try {
      const res = await fetch(`/api/admin/wander/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
      router.push('/admin/wander/listings');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/wander/listings"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quick Edit Tour</h1>
                <p className="text-xs text-gray-500">Update the essentials. Need more fields? Switch to detailed.</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={switchToDetailed}
            disabled={switching}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline disabled:opacity-60"
          >
            {switching && <Loader2 className="w-3 h-3 animate-spin" />}
            Switch to detailed →
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => update('categoryId', cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                    form.categoryId === cat.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tour Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Goa 3-day beach getaway"
              maxLength={120}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
            />
          </div>

          <div ref={locationRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Location</label>
            {selectedLocation ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedLocation.displayName || selectedLocation.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedLocation(null); update('mainLocationId', ''); setLocationSearch(''); }}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search city or location"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                  {locationLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {locations.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {locations.map((loc: any) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          update('mainLocationId', loc.id);
                          setLocationSearch('');
                          setLocations([]);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-emerald-50"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{loc.displayName || loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white"
              >
                <option value="">Select duration</option>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {form.duration === 'Custom' && (
                <input
                  type="text"
                  value={form.customDuration}
                  onChange={(e) => update('customDuration', e.target.value)}
                  placeholder="e.g. 10 Days 9 Nights"
                  className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price <span className="text-xs text-gray-400 font-normal">(per person, leave blank for "On Request")</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) => update('basePrice', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <TourDescriptionEditor
              content={form.description}
              onChange={(html) => update('description', html)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tour Images <span className="text-xs text-gray-400 font-normal">({form.images.length} added)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={img} alt={`Tour ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} disabled={uploadingImages} />
                {uploadingImages ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Add more</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6">
          <Link
            href="/admin/wander/listings"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 text-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {form.status === 'ACTIVE' ? 'Save & Keep Active' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {showPreview && (
        <WanderQuickPreviewModal
          title={form.title}
          description={form.description}
          locationName={selectedLocation?.displayName || selectedLocation?.name || ''}
          duration={form.duration === 'Custom' ? form.customDuration : form.duration}
          basePrice={form.basePrice}
          images={form.images}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
