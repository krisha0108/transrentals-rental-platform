'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Save, Building2, Upload, X, ImageIcon,
  MapPin, Bed, Shield, Plus, Sparkles, ClipboardCheck, IndianRupee,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { AMENITY_GROUPS, CANCELLATION_POLICIES } from '@/lib/property-amenities';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

const PROPERTY_TYPES = [
  { value: 'RESORT', label: 'Resort', desc: 'Beach, hill station or destination resort' },
  { value: 'HOTEL', label: 'Hotel', desc: 'Commercial lodging with rooms & services' },
  { value: 'HOMESTAY', label: 'Homestay', desc: 'Local home experience with hosts' },
  { value: 'APARTMENT', label: 'Apartment', desc: 'Self-contained apartment / flat' },
  { value: 'VILLA', label: 'Villa', desc: 'Private villa with exclusive use' },
  { value: 'GUEST_HOUSE', label: 'Guest House', desc: 'Budget-friendly guesthouse' },
  { value: 'HOSTEL', label: 'Hostel', desc: 'Dormitory / shared rooms' },
  { value: 'ROOMS', label: 'Rooms', desc: 'Individual rooms for rent' },
  { value: 'OTHER', label: 'Other', desc: 'Any other type of stay' },
];

type FormState = {
  name: string;
  propertyType: string;
  description: string;
  highlights: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  latitude: string;
  longitude: string;
  totalRooms: number;
  bedroomsCount: string;
  bathroomsCount: string;
  maxGuests: string;
  startingPrice: string;
  minNights: string;
  maxNights: string;
  cancellationPolicy: string;
  amenityIds: string[];
  customAmenities: string[];
  inclusions: string;
  exclusions: string;
  rules: string;
  checkInTime: string;
  checkOutTime: string;
  coverImage: string;
  galleryImages: string[];
};

export default function AddPropertyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '', propertyType: 'RESORT', description: '', highlights: '',
    address: '', city: '', state: '', pincode: '', landmark: '',
    latitude: '', longitude: '',
    totalRooms: 1, bedroomsCount: '', bathroomsCount: '', maxGuests: '',
    startingPrice: '', minNights: '1', maxNights: '',
    cancellationPolicy: '', amenityIds: [], customAmenities: [],
    inclusions: '', exclusions: '', rules: '',
    checkInTime: '14:00', checkOutTime: '11:00',
    coverImage: '', galleryImages: [],
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));
  const [customInput, setCustomInput] = useState('');

  const toggleAmenity = (id: string) => {
    setForm((p) => ({
      ...p,
      amenityIds: p.amenityIds.includes(id)
        ? p.amenityIds.filter((a) => a !== id)
        : [...p.amenityIds, id],
    }));
  };

  const addCustomAmenity = () => {
    const val = customInput.trim();
    if (!val) return;
    if (form.customAmenities.includes(val)) { setCustomInput(''); return; }
    setForm((p) => ({ ...p, customAmenities: [...p.customAmenities, val] }));
    setCustomInput('');
  };

  const removeCustomAmenity = (val: string) => {
    setForm((p) => ({ ...p, customAmenities: p.customAmenities.filter((a) => a !== val) }));
  };

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'properties');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && j.url) { update('coverImage', j.url); showToast({ type: 'success', title: 'Cover uploaded' }); }
      else showToast({ type: 'error', title: j.error || 'Upload failed' });
    } catch { showToast({ type: 'error', title: 'Upload failed' }); }
    finally { setUploadingCover(false); }
  };

  const uploadGallery = async (files: FileList) => {
    if (!files?.length) return;
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('folder', 'properties');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (res.ok && Array.isArray(j.uploaded)) {
        const urls = j.uploaded.map((u: any) => u.url).filter(Boolean);
        update('galleryImages', [...form.galleryImages, ...urls]);
        showToast({ type: 'success', title: `${urls.length} image(s) uploaded` });
      } else showToast({ type: 'error', title: j.error || 'Upload failed' });
    } catch { showToast({ type: 'error', title: 'Upload failed' }); }
    finally { setUploadingGallery(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities: (form.amenityIds.length > 0 || form.customAmenities.length > 0)
          ? JSON.stringify([...form.amenityIds, ...form.customAmenities.map((a) => `custom:${a}`)])
          : null,
        highlights: form.highlights.trim() || null,
        startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
        totalRooms: Number(form.totalRooms) || 1,
        bedroomsCount: form.bedroomsCount ? Number(form.bedroomsCount) : null,
        bathroomsCount: form.bathroomsCount ? Number(form.bathroomsCount) : null,
        maxGuests: form.maxGuests ? Number(form.maxGuests) : null,
        minNights: form.minNights ? Number(form.minNights) : 1,
        maxNights: form.maxNights ? Number(form.maxNights) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        galleryImages: form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
      };
      const res = await fetch('/api/travel-agent/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        showToast({ type: 'success', title: 'Property created' });
        router.push(`/travel-agent/properties/${json.property.id}/edit`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to create property' });
      }
    } catch { showToast({ type: 'error', title: 'Server error' }); }
    finally { setSaving(false); }
  };

  useTravelAgentPageHeader(
    'Add New Property',
    'Fill in the details below to list your property',
    undefined,
    <Link key="back" href="/travel-agent/properties" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600">
      <ArrowLeft className="w-4 h-4" /> All Properties
    </Link>,
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:items-start">
        {/* ── section quick-nav — this form runs 8 sections long, so a jump
             list earns its keep on desktop; mobile just scrolls ── */}
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

        <form id="add-property-form" onSubmit={submit} className="min-w-0 space-y-6 pb-24">

        {/* ── 1. BASICS ── */}
        <FormSection id="basics" icon={<Building2 className="w-4 h-4" />} title="Listing Basics" color="emerald">
          <div className="sm:col-span-2">
            <Label required>Property Name</Label>
            <input required type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Sunrise Beach Resort, Goa" className={inp} />
          </div>

          {/* Type selector */}
          <div className="sm:col-span-2">
            <Label required>Property Type</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
              {PROPERTY_TYPES.map((t) => (
                <button
                  type="button" key={t.value}
                  onClick={() => update('propertyType', t.value)}
                  title={t.desc}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                    form.propertyType === t.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label>Description</Label>
            <textarea rows={4} value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe your property — what makes it special, the ambiance, what guests can expect..."
              className={inp} />
          </div>

          <div className="sm:col-span-2">
            <Label>
              Key Highlights
              <span className="ml-2 text-[10px] font-normal text-gray-400">One per line — shown as bullet points</span>
            </Label>
            <textarea rows={3} value={form.highlights}
              onChange={(e) => update('highlights', e.target.value)}
              placeholder={`Stunning sea-facing rooms\nPrivate beach access\n10 minutes from airport`}
              className={inp} />
          </div>
        </FormSection>

        {/* ── 2. CAPACITY & ROOMS ── */}
        <FormSection id="capacity" icon={<Bed className="w-4 h-4" />} title="Capacity & Rooms" color="blue">
          <Field label="Total Rooms *">
            <input required type="number" min={1} value={form.totalRooms}
              onChange={(e) => update('totalRooms', Number(e.target.value))} className={inp} />
          </Field>
          <Field label="Bedrooms">
            <input type="number" min={0} value={form.bedroomsCount}
              onChange={(e) => update('bedroomsCount', e.target.value)}
              placeholder="e.g. 2" className={inp} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min={0} value={form.bathroomsCount}
              onChange={(e) => update('bathroomsCount', e.target.value)}
              placeholder="e.g. 2" className={inp} />
          </Field>
          <Field label="Max Guests">
            <input type="number" min={1} value={form.maxGuests}
              onChange={(e) => update('maxGuests', e.target.value)}
              placeholder="e.g. 6" className={inp} />
          </Field>
        </FormSection>

        {/* ── 3. LOCATION ── */}
        <FormSection id="location" icon={<MapPin className="w-4 h-4" />} title="Location" color="purple">
          <div className="sm:col-span-2">
            <Label>Street Address</Label>
            <textarea rows={2} value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="e.g. 123, Beach Road, Calangute" className={inp} />
          </div>
          <Field label="City">
            <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)}
              placeholder="e.g. Goa" className={inp} />
          </Field>
          <Field label="State">
            <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)}
              placeholder="e.g. Goa" className={inp} />
          </Field>
          <Field label="Pincode">
            <input type="text" value={form.pincode} onChange={(e) => update('pincode', e.target.value)}
              placeholder="e.g. 403516" className={inp} />
          </Field>
          <Field label="Nearby Landmark">
            <input type="text" value={form.landmark}
              onChange={(e) => update('landmark', e.target.value)}
              placeholder="e.g. Near Baga Beach" className={inp} />
          </Field>
          <Field label="Latitude (optional)">
            <input type="number" step="any" value={form.latitude}
              onChange={(e) => update('latitude', e.target.value)}
              placeholder="e.g. 15.5527" className={inp} />
          </Field>
          <Field label="Longitude (optional)">
            <input type="number" step="any" value={form.longitude}
              onChange={(e) => update('longitude', e.target.value)}
              placeholder="e.g. 73.7771" className={inp} />
          </Field>
        </FormSection>

        {/* ── 4. PHOTOS ── */}
        <FormSection id="photos" icon={<ImageIcon className="w-4 h-4" />} title="Photos" color="pink">
          <div className="sm:col-span-2">
            <Label>Cover Photo <span className="text-gray-400 font-normal text-xs ml-1">— main photo shown on listings</span></Label>
            {form.coverImage ? (
              <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => update('coverImage', '')}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center shadow">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full max-w-sm h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition">
                {uploadingCover ? <><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /><span className="text-xs text-gray-500">Uploading…</span></>
                  : <><Upload className="w-6 h-6 text-gray-400" /><span className="text-sm font-medium text-gray-700">Click to upload cover photo</span><span className="text-[11px] text-gray-400">JPG / PNG / WEBP · max 5 MB</span></>}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingCover}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ''; }} />
              </label>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label>Gallery Photos <span className="text-gray-400 font-normal text-xs ml-1">— up to 20 images</span></Label>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl cursor-pointer mb-3">
              {uploadingGallery ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Photos</>}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGallery}
                onChange={(e) => { const f = e.target.files; if (f?.length) uploadGallery(f); e.target.value = ''; }} />
            </label>
            {form.galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {form.galleryImages.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={() => update('galleryImages', form.galleryImages.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-700 shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> No gallery photos yet.</p>
            )}
          </div>
        </FormSection>

        {/* ── 5. AMENITIES ── */}
        <FormSection id="amenities" icon={<Sparkles className="w-4 h-4" />} title="Amenities" color="teal">
          <div className="sm:col-span-2 space-y-5">
            {AMENITY_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {group.items.map((item) => {
                    const selected = form.amenityIds.includes(item.id);
                    return (
                      <button
                        type="button" key={item.id}
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                          selected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          selected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                        }`}>
                          {selected && (
                            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                              <path d="M1 4l3 3 5-6" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Custom / manual amenities */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add Custom Amenity</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                  placeholder="e.g. Bonfire area, Telescope, Bicycle rental…"
                  className={`${inp} flex-1`}
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  disabled={!customInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.customAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.customAmenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-full">
                      {a}
                      <button type="button" onClick={() => removeCustomAmenity(a)} className="hover:text-red-500 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {(form.amenityIds.length > 0 || form.customAmenities.length > 0) && (
              <p className="text-xs text-emerald-700 font-semibold">
                {form.amenityIds.length + form.customAmenities.length} amenit{(form.amenityIds.length + form.customAmenities.length) === 1 ? 'y' : 'ies'} selected
              </p>
            )}
          </div>
        </FormSection>

        {/* ── 6. INCLUSIONS / EXCLUSIONS ── */}
        <FormSection id="inclusions" icon={<ClipboardCheck className="w-4 h-4" />} title="What's Included" color="green">
          <div className="sm:col-span-2">
            <Label>Inclusions <span className="text-gray-400 font-normal text-xs ml-1">— what's included in the price</span></Label>
            <textarea rows={3} value={form.inclusions}
              onChange={(e) => update('inclusions', e.target.value)}
              placeholder={`• Daily breakfast for 2 guests\n• Welcome drinks\n• Airport pickup\n• All government taxes`}
              className={inp} />
          </div>
          <div className="sm:col-span-2">
            <Label>Exclusions <span className="text-gray-400 font-normal text-xs ml-1">— not included</span></Label>
            <textarea rows={3} value={form.exclusions}
              onChange={(e) => update('exclusions', e.target.value)}
              placeholder={`• Lunch & dinner\n• Alcohol & beverages\n• Personal expenses`}
              className={inp} />
          </div>
        </FormSection>

        {/* ── 7. RULES & POLICIES ── */}
        <FormSection id="rules" icon={<Shield className="w-4 h-4" />} title="Rules & Policies" color="amber">
          <div className="sm:col-span-2">
            <Label>House Rules</Label>
            <textarea rows={3} value={form.rules}
              onChange={(e) => update('rules', e.target.value)}
              placeholder={`• No smoking inside rooms\n• Pets not allowed\n• No outside food\n• Quiet hours 10 PM – 7 AM`}
              className={inp} />
          </div>

          <Field label="Cancellation Policy">
            <div className="grid grid-cols-2 gap-2">
              {CANCELLATION_POLICIES.map((cp) => (
                <button type="button" key={cp.value}
                  onClick={() => update('cancellationPolicy', form.cancellationPolicy === cp.value ? '' : cp.value)}
                  className={`p-3 rounded-xl border text-left transition ${
                    form.cancellationPolicy === cp.value
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-white border-gray-200 hover:border-emerald-300'
                  }`}>
                  <p className={`text-xs font-bold ${form.cancellationPolicy === cp.value ? 'text-emerald-800' : 'text-gray-800'}`}>
                    {cp.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{cp.description}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Check-in Time">
            <input type="time" value={form.checkInTime}
              onChange={(e) => update('checkInTime', e.target.value)} className={inp} />
          </Field>
          <Field label="Check-out Time">
            <input type="time" value={form.checkOutTime}
              onChange={(e) => update('checkOutTime', e.target.value)} className={inp} />
          </Field>
          <Field label="Minimum Nights">
            <input type="number" min={1} value={form.minNights}
              onChange={(e) => update('minNights', e.target.value)}
              placeholder="1" className={inp} />
          </Field>
          <Field label="Maximum Nights (optional)">
            <input type="number" min={1} value={form.maxNights}
              onChange={(e) => update('maxNights', e.target.value)}
              placeholder="No limit" className={inp} />
          </Field>
        </FormSection>

        {/* ── 8. PRICING ── */}
        <FormSection id="pricing" icon={<IndianRupee className="w-4 h-4" />} title="Pricing" color="emerald">
          <Field label="Starting Price (₹ / night)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
              <input type="number" min={0} value={form.startingPrice}
                onChange={(e) => update('startingPrice', e.target.value)}
                placeholder="e.g. 3500" className={`${inp} pl-7`} />
            </div>
          </Field>
          <div className="sm:col-span-2 flex items-start gap-2 rounded-xl bg-emerald-50/60 border border-emerald-100 px-3.5 py-3 text-xs text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            This is the "from" price shown on your listing card. You can adjust it anytime from the property's edit page.
          </div>
        </FormSection>

        </form>
      </div>

      {/* ── sticky action bar — this form is long; Save shouldn't require
           scrolling all the way back down to find it ── */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-gray-200 bg-white/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex justify-end gap-3">
          <Link href="/travel-agent/properties" className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5">
            Cancel
          </Link>
          <button type="submit" form="add-property-form" disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-xl">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Create Property</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'basics', label: 'Listing Basics' },
  { id: 'capacity', label: 'Capacity & Rooms' },
  { id: 'location', label: 'Location' },
  { id: 'photos', label: 'Photos' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'inclusions', label: "What's Included" },
  { id: 'rules', label: 'Rules & Policies' },
  { id: 'pricing', label: 'Pricing' },
];

const inp = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
const labelBase = 'block text-sm font-semibold text-gray-700 mb-1.5';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className={labelBase}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelBase}>{label}</label>
      {children}
    </div>
  );
}

const SECTION_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  pink: 'bg-pink-50 text-pink-700',
  teal: 'bg-teal-50 text-teal-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
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
