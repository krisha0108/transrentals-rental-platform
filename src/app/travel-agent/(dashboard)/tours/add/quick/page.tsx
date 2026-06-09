// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, ChevronLeft, Loader2, AlertCircle, Search, MapPin, X,
  Image as ImageIcon, Save, Send, Trash2, Eye, Sparkles, RefreshCw,
} from 'lucide-react';
import TourDescriptionEditor, { type TourDescriptionEditorRef } from '@/components/admin/wander/TourDescriptionEditor';
import WanderQuickPreviewModal from '@/components/admin/wander/WanderQuickPreviewModal';

const DURATION_OPTIONS = [
  'Half Day (4-5 hrs)', 'Full Day (8-10 hrs)', '2 Days 1 Night',
  '3 Days 2 Nights', '4 Days 3 Nights', '5 Days 4 Nights',
  '6 Days 5 Nights', '7 Days 6 Nights', 'Custom',
];

export default function TravelAgentQuickAddTourPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    mainLocationId: '',
    duration: '',
    customDuration: '',
    basePrice: '',
    description: '',
    images: [] as string[],
  });

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const descEditorRef = useRef<TourDescriptionEditorRef | null>(null);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    fetch('/api/travel-agent/categories')
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : d.categories || []))
      .catch(() => {});
  }, []);

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
        const res = await fetch(`/api/travel-agent/locations?search=${encodeURIComponent(locationSearch)}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : data.locations || []);
      } catch { setLocations([]); }
      finally { setLocationLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [locationSearch]);

  async function uploadFiles(files: File[]): Promise<string[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    fd.append('folder', 'tours');
    const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    if (Array.isArray(data.uploaded)) return data.uploaded.map((f: any) => f.url);
    if (data.url) return [data.url];
    return [];
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
    update('images', form.images.filter((_: any, i: number) => i !== idx));
  }

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
          basePrice: form.basePrice,
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

  const aiDisabled = aiAvailable === false;

  function validate(forPublish: boolean): string {
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
    const finalDuration = form.duration === 'Custom' ? form.customDuration.trim() : form.duration;
    const payload: any = {
      categoryId: form.categoryId,
      title: form.title.trim(),
      mainLocationId: form.mainLocationId || null,
      destination: selectedLocation?.name || selectedLocation?.displayName || null,
      duration: finalDuration || null,
      description: descText ? form.description : null,
      basePrice: form.basePrice || null,
      startingPrice: form.basePrice || null,
      priceType: form.basePrice ? 'PER_PERSON' : 'ON_REQUEST',
      images: form.images,
      coverImage: form.images[0] || null,
      createMode: 'QUICK',
      status: publish ? 'ACTIVE' : 'DRAFT',
      publish,
    };

    try {
      const res = await fetch('/api/travel-agent/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
      router.push('/travel-agent/tours');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -mx-6 -mt-6">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/travel-agent/tours"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quick Add Tour</h1>
                <p className="text-xs text-gray-500">Just the essentials — full details can be added later.</p>
              </div>
            </div>
          </div>
          <Link
            href="/travel-agent/tours/add"
            className="text-xs text-indigo-600 hover:underline"
          >
            Switch to detailed →
          </Link>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <div className="relative group">
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={aiLoading || aiDisabled || aiAvailable === null}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm
                    ${aiDisabled
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 disabled:opacity-60'
                    }`}
                >
                  {aiLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : aiAvailable === null
                    ? <><Sparkles className="w-3.5 h-3.5 opacity-50" /> AI…</>
                    : aiDisabled
                    ? <><Sparkles className="w-3.5 h-3.5" /> AI Unavailable</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>
                  }
                </button>
                {aiDisabled && (
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-56 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    DeepSeek balance is empty. Recharge at{' '}
                    <span className="text-violet-300 font-medium">platform.deepseek.com</span>
                  </div>
                )}
              </div>
            </div>
            {aiError && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {aiError}
                <button onClick={() => setAiError('')} className="ml-auto"><X className="w-3 h-3" /></button>
              </div>
            )}
            <TourDescriptionEditor
              content={form.description}
              onChange={(html: string) => update('description', html)}
              editorRef={descEditorRef}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Use the toolbar for bullet points, headings, bold, and more. AI generates based on title, location, duration & price.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tour Images <span className="text-xs text-gray-400 font-normal">({form.images.length} added)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
            href="/travel-agent/tours"
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
            Save & Publish
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
          coverImage={form.images[0]}
          images={form.images}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
