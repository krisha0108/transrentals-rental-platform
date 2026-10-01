'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Car, Loader2, Save, Upload, X, Camera, Shield, Pencil } from 'lucide-react';

const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const VEHICLE_PHOTO_SLOTS = [
  { key: 'photoFront',     type: 'front',     label: 'Front' },
  { key: 'photoBack',      type: 'back',      label: 'Back' },
  { key: 'photoLeftSide',  type: 'leftSide',  label: 'Left' },
  { key: 'photoRightSide', type: 'rightSide', label: 'Right' },
  { key: 'photoInterior',  type: 'interior',  label: 'Interior' },
];

const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition';

export default function EditVehiclePage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [docPhotos, setDocPhotos] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<Record<string, string>>({});
  const [uploadingVehicleSlot, setUploadingVehicleSlot] = useState<string | null>(null);

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
          setVehiclePhotos({
            front: v.photoFront || '',
            back: v.photoBack || '',
            leftSide: v.photoLeftSide || '',
            rightSide: v.photoRightSide || '',
            interior: v.photoInterior || '',
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

  const uploadVehiclePhoto = async (file: File, slotType: string) => {
    setUploadingVehicleSlot(slotType);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', slotType);
      const res = await fetch(`/api/driver/fleet/${id}/photos`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setVehiclePhotos(p => ({ ...p, [slotType]: data.url }));
    } catch {}
    setUploadingVehicleSlot(null);
  };

  const removeVehiclePhoto = async (slotType: string) => {
    if (!confirm('Remove this photo?')) return;
    try {
      await fetch(`/api/driver/fleet/${id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: slotType }),
      });
      setVehiclePhotos(p => ({ ...p, [slotType]: '' }));
    } catch {}
  };

  const handleSave = async () => {
    if (!make.trim() || !model.trim()) return setError('Make and model are required');
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: make.trim(), model: model.trim(), year: year || null,
          registrationNo: registrationNo.trim() || null, color: color || null,
          category: category || null, seatingCapacity: seatingCapacity || null,
          fuelType: fuelType || null, currentOdometer: currentOdometer || null,
          insuranceNumber: insuranceNumber || null, insuranceExpiry: insuranceExpiry || null,
          rcNumber: rcNumber || null, rcExpiry: rcExpiry || null,
          fitnessExpiry: fitnessExpiry || null, permitExpiry: permitExpiry || null,
        }),
      });
      const data = await res.json();
      if (data.success) router.push(`/driver/fleet/${id}`);
      else setError(data.error || 'Failed to save');
    } catch { setError('Network error'); }
    setSaving(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  const DOC_SLOTS = [
    { key: 'insurance', label: 'Insurance', numberVal: insuranceNumber, setNumber: setInsuranceNumber, numberPlaceholder: 'INS-XXXX', expiryVal: insuranceExpiry, setExpiry: setInsuranceExpiry },
    { key: 'rc', label: 'RC Certificate', numberVal: rcNumber, setNumber: setRcNumber, numberPlaceholder: 'RC-XXXX', expiryVal: rcExpiry, setExpiry: setRcExpiry },
    { key: 'fitness', label: 'Fitness Certificate', numberVal: '', setNumber: () => {}, numberPlaceholder: '', expiryVal: fitnessExpiry, setExpiry: setFitnessExpiry },
    { key: 'permit', label: 'Permit', numberVal: '', setNumber: () => {}, numberPlaceholder: '', expiryVal: permitExpiry, setExpiry: setPermitExpiry },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-teal-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-green-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Edit Vehicle</h1>
            <p className="text-green-100 text-xs mt-0.5">Update vehicle details</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}

      <div className="space-y-4">
        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-green-50 border-b border-green-100">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Vehicle Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Make *</label>
                <input value={make} onChange={e => setMake(e.target.value)} placeholder="Maruti, Hyundai..." className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Model *</label>
                <input value={model} onChange={e => setModel(e.target.value)} placeholder="Swift, Innova..." className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Year</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2020" className={inp} maxLength={4} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Color</label>
                <input value={color} onChange={e => setColor(e.target.value)} placeholder="White, Black..." className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Registration No.</label>
                <input value={registrationNo} onChange={e => setRegistrationNo(e.target.value.toUpperCase())} placeholder="MH12AB1234" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Seating Capacity</label>
                <input type="number" value={seatingCapacity} onChange={e => setSeatingCapacity(e.target.value)} placeholder="5" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Current Odometer (km)</label>
              <input type="number" value={currentOdometer} onChange={e => setCurrentOdometer(e.target.value)} placeholder="45000" className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(category === c ? '' : c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition ${category === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Fuel Type</label>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map(f => (
                  <button key={f} type="button" onClick={() => setFuelType(fuelType === f ? '' : f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition ${fuelType === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Documents</span>
          </div>
          <div className="p-5 space-y-3">
            {DOC_SLOTS.map(doc => (
              <div key={doc.key} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{doc.label}</span>
                  <div className="flex items-center gap-2">
                    {docPhotos[doc.key] && (
                      <a href={docPhotos[doc.key]} target="_blank" rel="noopener noreferrer">
                        <img src={docPhotos[doc.key]} className="w-8 h-8 rounded-lg object-cover border border-gray-200" alt={doc.label} />
                      </a>
                    )}
                    <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-2.5 py-1.5 rounded-lg border transition ${uploadingDoc === doc.key ? 'opacity-50' : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'}`}>
                      {uploadingDoc === doc.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {docPhotos[doc.key] ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocPhoto(f, doc.key); e.target.value = ''; }} />
                    </label>
                  </div>
                </div>
                {doc.numberPlaceholder && (
                  <input value={doc.numberVal} onChange={e => doc.setNumber(e.target.value)} placeholder={doc.numberPlaceholder}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                )}
                <input type="date" value={doc.expiryVal} onChange={e => doc.setExpiry(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-b border-purple-100">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Vehicle Photos</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2.5">
              {VEHICLE_PHOTO_SLOTS.map(slot => {
                const url = vehiclePhotos[slot.type];
                const isUploading = uploadingVehicleSlot === slot.type;
                return (
                  <div key={slot.key} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                      ) : url ? (
                        <>
                          <img src={url} alt={slot.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-end justify-between p-1 opacity-0 hover:opacity-100">
                            <label className="cursor-pointer bg-white/90 rounded-md p-1">
                              <Camera className="w-3 h-3 text-gray-700" />
                              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVehiclePhoto(f, slot.type); e.target.value = ''; }} />
                            </label>
                            <button type="button" onClick={() => removeVehiclePhoto(slot.type)} className="bg-red-500 text-white rounded-md p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 w-full h-full justify-center">
                          <Camera className="w-5 h-5 text-gray-300" />
                          <span className="text-xs text-gray-400">Add</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVehiclePhoto(f, slot.type); e.target.value = ''; }} />
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

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-500 text-white rounded-2xl font-bold text-sm hover:from-green-700 hover:to-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
        </button>
      </div>
      <div className="h-8" />
    </div>
  );
}
