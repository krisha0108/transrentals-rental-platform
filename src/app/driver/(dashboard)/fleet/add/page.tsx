'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Loader2 } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const CATEGORIES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Van', 'Minibus', 'Bus', 'Truck'];

export default function AddVehiclePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    make: '', model: '', year: '', registrationNo: '', color: '',
    category: '', seatingCapacity: '', fuelType: '',
    insuranceExpiry: '', rcExpiry: '', fitnessExpiry: '', permitExpiry: '',
    nextServiceDate: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) {
      setError('Make and model are required');
      return;
    }
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
      router.push('/driver/fleet');
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Vehicle</h1>
          <p className="text-sm text-gray-500">Add a vehicle to your fleet</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-600" /> Vehicle Details
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Make *</label>
              <input className={inputClass} placeholder="e.g. Maruti, Toyota" value={form.make} onChange={e => set('make', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Model *</label>
              <input className={inputClass} placeholder="e.g. Swift, Innova" value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Year</label>
              <input type="number" className={inputClass} placeholder="2020" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" />
            </div>
            <div>
              <label className={labelClass}>Color</label>
              <input className={inputClass} placeholder="White, Black…" value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Registration Number</label>
            <input
              className={inputClass}
              placeholder="MH12AB1234"
              value={form.registrationNo}
              onChange={e => set('registrationNo', e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fuel Type</label>
              <select className={inputClass} value={form.fuelType} onChange={e => set('fuelType', e.target.value)}>
                <option value="">Select</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Seating Capacity</label>
            <input type="number" className={inputClass} placeholder="4" value={form.seatingCapacity} onChange={e => set('seatingCapacity', e.target.value)} min="1" max="60" />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Documents & Expiry</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Insurance Expiry</label>
              <input type="date" className={inputClass} value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>RC Expiry</label>
              <input type="date" className={inputClass} value={form.rcExpiry} onChange={e => set('rcExpiry', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Fitness Expiry</label>
              <input type="date" className={inputClass} value={form.fitnessExpiry} onChange={e => set('fitnessExpiry', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Permit Expiry</label>
              <input type="date" className={inputClass} value={form.permitExpiry} onChange={e => set('permitExpiry', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Next Service Date</label>
            <input type="date" className={inputClass} value={form.nextServiceDate} onChange={e => set('nextServiceDate', e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Vehicle'}
        </button>
      </form>
    </div>
  );
}
