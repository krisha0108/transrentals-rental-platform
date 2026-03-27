'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Car, Loader2, Save, Upload, X, Camera } from 'lucide-react';

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const inputCls = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function EditVehiclePage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [docPhotos, setDocPhotos] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [rcExpiry, setRcExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('');

  useEffect(() => {
    fetch(`/api/driver/fleet/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.vehicle) {
          const v = d.vehicle;
          setMake(v.make || '');
          setModel(v.model || '');
          setYear(v.year ? String(v.year) : '');
          setRegistrationNo(v.registrationNo || '');
          setColor(v.color || '');
          setCategory(v.category || '');
          setSeatingCapacity(v.seatingCapacity ? String(v.seatingCapacity) : '');
          setFuelType(v.fuelType || '');
          setCurrentOdometer(v.currentOdometer ? String(v.currentOdometer) : '');
          setInsuranceNumber(v.insuranceNumber || '');
          setInsuranceExpiry(v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '');
          setRcNumber(v.rcNumber || '');
          setRcExpiry(v.rcExpiry ? v.rcExpiry.split('T')[0] : '');
          setFitnessExpiry(v.fitnessExpiry ? v.fitnessExpiry.split('T')[0] : '');
          setPermitExpiry(v.permitExpiry ? v.permitExpiry.split('T')[0] : '');
          setDocPhotos({
            insurance: v.insuranceDocument || '',
            rc: v.rcDocument || '',
            fitness: v.fitnessDocument || '',
            permit: v.permitDocument || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  const uploadDocPhoto = async (file: File, type: string) => {
    setUploadingDoc(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch(`/api/driver/fleet/${id}/photos`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setDocPhotos(p => ({ ...p, [type]: data.url }));
    } catch {}
    setUploadingDoc(null);
  };

  const handleSave = async () => {
    if (!make.trim() || !model.trim()) return setError('Make and model are required');
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: make.trim(),
          model: model.trim(),
          year: year || null,
          registrationNo: registrationNo.trim() || null,
          color: color || null,
          category: category || null,
          seatingCapacity: seatingCapacity || null,
          fuelType: fuelType || null,
          currentOdometer: currentOdometer || null,
          insuranceNumber: insuranceNumber || null,
          insuranceExpiry: insuranceExpiry || null,
          rcNumber: rcNumber || null,
          rcExpiry: rcExpiry || null,
          fitnessExpiry: fitnessExpiry || null,
          permitExpiry: permitExpiry || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/driver/fleet/${id}`);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    }
    setSaving(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-sm text-gray-500">Update vehicle details</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {/* Vehicle Details */}
      <div className="bg-white rounded-xl border p-4 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <Car className="w-4 h-4" /> Vehicle Details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Make / Brand *</label>
            <input value={make} onChange={e => setMake(e.target.value)} placeholder="Maruti, Hyundai..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Model *</label>
            <input value={model} onChange={e => setModel(e.target.value)} placeholder="Swift, Innova..." className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2020" className={inputCls} maxLength={4} />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <input value={color} onChange={e => setColor(e.target.value)} placeholder="White, Black..." className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Registration Number</label>
          <input value={registrationNo} onChange={e => setRegistrationNo(e.target.value.toUpperCase())} placeholder="MH12AB1234" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${category === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Seating Capacity</label>
            <input type="number" value={seatingCapacity} onChange={e => setSeatingCapacity(e.target.value)} placeholder="5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Current Odometer (km)</label>
            <input type="number" value={currentOdometer} onChange={e => setCurrentOdometer(e.target.value)} placeholder="45000" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Fuel Type</label>
          <div className="flex flex-wrap gap-2">
            {FUEL_TYPES.map(f => (
              <button key={f} type="button" onClick={() => setFuelType(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${fuelType === f ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border p-4 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Documents</h2>

        {/* Insurance */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Insurance Number</label>
              <input value={insuranceNumber} onChange={e => setInsuranceNumber(e.target.value)} placeholder="INS-XXXX" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Insurance Expiry</label>
              <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {docPhotos.insurance && <a href={docPhotos.insurance} target="_blank" rel="noopener noreferrer"><img src={docPhotos.insurance} className="w-14 h-14 rounded-lg object-cover border" /></a>}
            <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-lg border transition ${uploadingDoc === 'insurance' ? 'opacity-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
              {uploadingDoc === 'insurance' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {docPhotos.insurance ? 'Replace Photo' : 'Upload Insurance Photo'}
              <input type="file" accept="image/*" className="hidden" disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocPhoto(f, 'insurance'); e.target.value = ''; }} />
            </label>
          </div>
        </div>

        {/* RC */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>RC Number</label>
              <input value={rcNumber} onChange={e => setRcNumber(e.target.value)} placeholder="RC-XXXX" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>RC Expiry</label>
              <input type="date" value={rcExpiry} onChange={e => setRcExpiry(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {docPhotos.rc && <a href={docPhotos.rc} target="_blank" rel="noopener noreferrer"><img src={docPhotos.rc} className="w-14 h-14 rounded-lg object-cover border" /></a>}
            <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-lg border transition ${uploadingDoc === 'rc' ? 'opacity-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
              {uploadingDoc === 'rc' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {docPhotos.rc ? 'Replace Photo' : 'Upload RC Photo'}
              <input type="file" accept="image/*" className="hidden" disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocPhoto(f, 'rc'); e.target.value = ''; }} />
            </label>
          </div>
        </div>

        {/* Fitness + Permit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Fitness Expiry</label>
              <input type="date" value={fitnessExpiry} onChange={e => setFitnessExpiry(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              {docPhotos.fitness && <a href={docPhotos.fitness} target="_blank" rel="noopener noreferrer"><img src={docPhotos.fitness} className="w-10 h-10 rounded object-cover border" /></a>}
              <label className={`flex items-center gap-1 text-xs font-semibold cursor-pointer px-2 py-1 rounded border transition ${uploadingDoc === 'fitness' ? 'opacity-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                {uploadingDoc === 'fitness' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Photo
                <input type="file" accept="image/*" className="hidden" disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocPhoto(f, 'fitness'); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Permit Expiry</label>
              <input type="date" value={permitExpiry} onChange={e => setPermitExpiry(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              {docPhotos.permit && <a href={docPhotos.permit} target="_blank" rel="noopener noreferrer"><img src={docPhotos.permit} className="w-10 h-10 rounded object-cover border" /></a>}
              <label className={`flex items-center gap-1 text-xs font-semibold cursor-pointer px-2 py-1 rounded border transition ${uploadingDoc === 'permit' ? 'opacity-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                {uploadingDoc === 'permit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Photo
                <input type="file" accept="image/*" className="hidden" disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocPhoto(f, 'permit'); e.target.value = ''; }} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
