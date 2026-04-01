'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Droplets, Gauge, Zap } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'LPG'];

const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function EditFuelPage() {
  const params = useParams()!;
  const id = params.id as string;
  const logId = params.logId as string;
  const router = useRouter();

  const [date, setDate]                   = useState('');
  const [liters, setLiters]               = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [totalAmount, setTotalAmount]     = useState('');
  const [autoCalced, setAutoCalced]       = useState(false);
  const [odometer, setOdometer]           = useState('');
  const [fuelStation, setFuelStation]     = useState('');
  const [fuelType, setFuelType]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    fetch(`/api/driver/fleet/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.vehicle?.fuel_logs) {
          const log = d.vehicle.fuel_logs.find((l: any) => l.id === logId);
          if (log) {
            setDate(log.date ? log.date.split('T')[0] : '');
            setLiters(log.liters ? String(log.liters) : '');
            setPricePerLiter(log.pricePerLiter ? String(log.pricePerLiter) : '');
            setTotalAmount(log.totalAmount ? String(log.totalAmount) : '');
            setOdometer(log.odometer ? String(log.odometer) : '');
            setFuelStation(log.fuelStation || '');
            setFuelType(log.fuelType || '');
            setNotes(log.notes || '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, logId]);

  function onLitersChange(v: string) {
    setLiters(v);
    if (v && pricePerLiter) {
      const t = (parseFloat(v) * parseFloat(pricePerLiter)).toFixed(2);
      if (!isNaN(Number(t))) { setTotalAmount(t); setAutoCalced(true); }
    } else setAutoCalced(false);
  }
  function onPriceChange(v: string) {
    setPricePerLiter(v);
    if (liters && v) {
      const t = (parseFloat(liters) * parseFloat(v)).toFixed(2);
      if (!isNaN(Number(t))) { setTotalAmount(t); setAutoCalced(true); }
    } else setAutoCalced(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!liters || !totalAmount) { setError('Liters and total amount are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/fuel/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, liters, pricePerLiter: pricePerLiter || null, totalAmount, odometer: odometer || null, fuelStation: fuelStation || null, fuelType: fuelType || null, notes: notes || null }),
      });
      const data = await res.json();
      if (data.success) router.push(`/driver/fleet/${id}`);
      else setError(data.error || 'Failed to save');
    } catch { setError('Something went wrong'); }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-blue-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Edit Fuel Log</h1>
            <p className="text-blue-100 text-xs mt-0.5">Update fuel entry details</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Fuel Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Fuel Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} required className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Liters *</label>
                <input type="number" step="0.1" placeholder="e.g. 30" value={liters} onChange={e => onLitersChange(e.target.value)} required className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Price / Liter (₹)</label>
                <input type="number" step="0.01" placeholder="e.g. 96.50" value={pricePerLiter} onChange={e => onPriceChange(e.target.value)} className={inp} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Amount (₹) *</label>
                {autoCalced && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Zap className="w-3 h-3" /> Auto-calculated
                  </span>
                )}
              </div>
              <input type="number" step="0.01" placeholder="e.g. 2895" value={totalAmount}
                onChange={e => { setTotalAmount(e.target.value); setAutoCalced(false); }} required
                className={`${inp} ${autoCalced ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-500' : ''}`} />
            </div>
          </div>
        </div>

        {/* Fuel Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-purple-50 border-b border-purple-100">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Fuel Type</span>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <button key={f} type="button" onClick={() => setFuelType(fuelType === f ? '' : f)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition ${fuelType === f ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-400'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Additional Info</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Odometer Reading (km)</label>
              <input type="number" placeholder="e.g. 45230" value={odometer} onChange={e => setOdometer(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Fuel Station</label>
              <input type="text" placeholder="e.g. HP Petrol Pump, Main Road" value={fuelStation} onChange={e => setFuelStation(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
              <textarea rows={2} placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-cyan-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
        </button>
      </form>
      <div className="h-8" />
    </div>
  );
}
