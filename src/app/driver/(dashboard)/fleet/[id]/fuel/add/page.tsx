'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG'];

export default function AddFuelPage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();

  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0]);
  const [liters, setLiters]               = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [totalAmount, setTotalAmount]     = useState('');
  const [odometer, setOdometer]           = useState('');
  const [fuelStation, setFuelStation]     = useState('');
  const [fuelType, setFuelType]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  function onLitersChange(v: string) {
    setLiters(v);
    if (v && pricePerLiter) {
      const t = (parseFloat(v) * parseFloat(pricePerLiter)).toFixed(2);
      if (!isNaN(Number(t))) setTotalAmount(t);
    }
  }
  function onPriceChange(v: string) {
    setPricePerLiter(v);
    if (liters && v) {
      const t = (parseFloat(liters) * parseFloat(v)).toFixed(2);
      if (!isNaN(Number(t))) setTotalAmount(t);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!liters || !totalAmount) { setError('Liters and total amount are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, liters, pricePerLiter: pricePerLiter || null, totalAmount, odometer: odometer || null, fuelStation: fuelStation || null, fuelType: fuelType || null, notes: notes || null }),
      });
      const data = await res.json();
      if (data.success) router.push(`/driver/fleet/${id}`);
      else setError(data.error || 'Failed to save');
    } catch { setError('Something went wrong'); }
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/driver/fleet/${id}`} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-gray-900">Add Fuel Log</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border p-5 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Liters *</label>
            <input type="number" step="0.1" placeholder="e.g. 30" value={liters} onChange={e => onLitersChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Liter (₹)</label>
            <input type="number" step="0.01" placeholder="e.g. 96.50" value={pricePerLiter} onChange={e => onPriceChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount (₹) *</label>
            <input type="number" step="0.01" placeholder="e.g. 2895" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Odometer Reading (km)</label>
          <input type="number" placeholder="e.g. 45230" value={odometer} onChange={e => setOdometer(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fuel Type</label>
          <div className="flex flex-wrap gap-2">
            {FUEL_TYPES.map(f => (
              <button key={f} type="button" onClick={() => setFuelType(fuelType === f ? '' : f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${fuelType === f ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Fuel Station</label>
          <input type="text" placeholder="e.g. HP Petrol Pump, Main Road" value={fuelStation} onChange={e => setFuelStation(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea rows={2} placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Fuel Log'}
        </button>
      </form>
    </div>
  );
}
