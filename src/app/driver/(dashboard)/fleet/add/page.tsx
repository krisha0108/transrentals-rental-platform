'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Camera, Loader2, X, Shield, Gauge, Fuel, Hash, Palette } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const CATEGORIES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Van', 'Minibus', 'Bus', 'Truck'];

const PHOTO_SLOTS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'leftSide', label: 'Left' },
  { key: 'rightSide', label: 'Right' },
  { key: 'interior', label: 'Interior' },
];

const DOC_SLOTS = [
  { key: 'insurance', label: 'Insurance', fieldKey: 'insuranceExpiry', numberKey: 'insuranceNumber', numberPlaceholder: 'Insurance number' },
  { key: 'rc', label: 'RC Certificate', fieldKey: 'rcExpiry', numberKey: 'rcNumber', numberPlaceholder: 'RC number' },
  { key: 'fitness', label: 'Fitness Certificate', fieldKey: 'fitnessExpiry', numberKey: null, numberPlaceholder: '' },
  { key: 'permit', label: 'Permit', fieldKey: 'permitExpiry', numberKey: null, numberPlaceholder: '' },
];

const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

export default function AddVehiclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    make: '', model: '', year: '', registrationNo: '', color: '',
    category: '', seatingCapacity: '', fuelType: '', currentOdometer: '',
    insuranceNumber: '', insuranceExpiry: '',
    rcNumber: '', rcExpiry: '',
    fitnessExpiry: '', permitExpiry: '',
    nextServiceDate: '',
  });

  const [photos, setPhotos] = useState<Record<string, { file: File; preview: string }>>({});
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  function selectPhoto(slotKey: string, file: File) {
    const preview = URL.createObjectURL(file);
    setPhotos(p => ({ ...p, [slotKey]: { file, preview } }));
  }
  function removePhoto(slotKey: string) {
    setPhotos(p => {
      const next = { ...p };
      if (next[slotKey]) URL.revokeObjectURL(next[slotKey].preview);
      delete next[slotKey];
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) { setError('Make and model are required'); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/driver/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add vehicle');
      const vehicleId = data.vehicle.id;
      for (const [slotKey, { file }] of Object.entries(photos)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', slotKey);
        await fetch(`/api/driver/fleet/${vehicleId}/photos`, { method: 'POST', body: fd });
      }
      router.push(`/driver/fleet/${vehicleId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-emerald-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Add Vehicle</h1>
            <p className="text-emerald-100 text-xs mt-0.5">Add a new vehicle to your fleet</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Vehicle Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Make *</label>
                <input className={inp} placeholder="e.g. Maruti, Toyota" value={form.make} onChange={e => set('make', e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Model *</label>
                <input className={inp} placeholder="e.g. Swift, Innova" value={form.model} onChange={e => set('model', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Year</label>
                <input type="number" className={inp} placeholder="2020" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Color</label>
                <input className={inp} placeholder="White, Black…" value={form.color} onChange={e => set('color', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Registration Number</label>
              <input className={inp} placeholder="MH12AB1234" value={form.registrationNo} onChange={e => set('registrationNo', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => set('category', form.category === c ? '' : c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition ${form.category === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Fuel Type</label>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map(f => (
                  <button key={f} type="button" onClick={() => set('fuelType', form.fuelType === f ? '' : f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition ${form.fuelType === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Seating Capacity</label>
              <input type="number" className={inp} placeholder="4" value={form.seatingCapacity} onChange={e => set('seatingCapacity', e.target.value)} min="1" max="60" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Current Odometer (km)</label>
              <input type="number" className={inp} placeholder="e.g. 45000" value={form.currentOdometer} onChange={e => set('currentOdometer', e.target.value)} min="0" />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Documents & Expiry</span>
          </div>
          <div className="p-5 space-y-3">
            {DOC_SLOTS.map(doc => (
              <div key={doc.key} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">{doc.label}</span>
                  {photos[doc.key] ? (
                    <div className="flex items-center gap-2">
                      <img src={photos[doc.key].preview} className="w-8 h-8 rounded-lg object-cover border border-gray-200" alt={doc.label} />
                      <button type="button" onClick={() => removePhoto(doc.key)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 cursor-pointer hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <Camera className="w-3 h-3" /> Upload Photo
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) selectPhoto(doc.key, f); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
                {doc.numberKey && (
                  <input className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-2"
                    placeholder={doc.numberPlaceholder}
                    value={(form as any)[doc.numberKey] || ''}
                    onChange={e => set(doc.numberKey!, e.target.value)} />
                )}
                <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={(form as any)[doc.fieldKey]} onChange={e => set(doc.fieldKey, e.target.value)} />
              </div>
            ))}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="text-sm font-semibold text-gray-700 mb-2.5 block">Next Service Date</label>
              <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={form.nextServiceDate} onChange={e => set('nextServiceDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Vehicle Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-b border-purple-100">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Vehicle Photos</span>
            <span className="text-xs text-purple-400 font-normal">(optional)</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2.5">
              {PHOTO_SLOTS.map(slot => {
                const photo = photos[slot.key];
                return (
                  <div key={slot.key} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                      {photo ? (
                        <>
                          <img src={photo.preview} alt={slot.label} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePhoto(slot.key)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 w-full h-full justify-center">
                          <Camera className="w-5 h-5 text-gray-300" />
                          <span className="text-xs text-gray-400">Add</span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) selectPhoto(slot.key, f); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{Object.keys(photos).length > 0 ? 'Adding & uploading photos...' : 'Adding vehicle...'}</>
            : 'Add Vehicle to Fleet'}
        </button>
      </form>
      <div className="h-8" />
    </div>
  );
}
