'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Wrench, Loader2, Calendar, IndianRupee, Gauge, FileText, Clock } from 'lucide-react';

const TYPES = [
  { value: 'SERVICE',    label: 'Service',    color: 'emerald' },
  { value: 'REPAIR',     label: 'Repair',     color: 'red' },
  { value: 'FUEL',       label: 'Fuel',       color: 'blue' },
  { value: 'INSURANCE',  label: 'Insurance',  color: 'purple' },
  { value: 'TIRE',       label: 'Tire',       color: 'amber' },
  { value: 'BATTERY',    label: 'Battery',    color: 'yellow' },
  { value: 'OIL_CHANGE', label: 'Oil Change', color: 'orange' },
  { value: 'OTHER',      label: 'Other',      color: 'gray' },
];

const TYPE_ACTIVE: Record<string, string> = {
  emerald: 'bg-green-600 text-white border-green-600',
  red: 'bg-red-500 text-white border-red-500',
  blue: 'bg-blue-600 text-white border-blue-600',
  purple: 'bg-purple-600 text-white border-purple-600',
  amber: 'bg-amber-500 text-white border-amber-500',
  yellow: 'bg-yellow-500 text-white border-yellow-500',
  orange: 'bg-orange-500 text-white border-orange-500',
  gray: 'bg-gray-600 text-white border-gray-600',
};

const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition';

export default function AddMaintenancePage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();

  const [type, setType] = useState('SERVICE');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, cost, date, odometer, nextDueDate }),
      });
      const data = await res.json();
      if (data.success) router.push(`/driver/fleet/${id}`);
      else setError(data.error || 'Failed to save log');
    } catch { setError('Network error'); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 via-violet-600 to-purple-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-violet-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Add Maintenance Log</h1>
            <p className="text-violet-100 text-xs mt-0.5">Record a service or repair</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-amber-50 border-b border-amber-100">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Log Type *</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition text-center ${type === t.value ? TYPE_ACTIVE[t.color] : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date / Cost / Odometer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Cost (₹)</label>
                <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" min="0" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Odometer (km)</label>
                <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="e.g. 45000" min="0" className={inp} />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-violet-50 border-b border-violet-100">
            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <span className="text-xs font-bold text-violet-800 uppercase tracking-wider">Description</span>
          </div>
          <div className="p-5">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Changed engine oil and filter, replaced brake pads..." rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none" />
          </div>
        </div>

        {/* Next Due Date */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-amber-50 border-b border-amber-100">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Next Due Date</span>
            <span className="text-xs text-amber-400 font-normal">(optional)</span>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 mb-3">Schedule the next service or inspection reminder</p>
            <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className={inp} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-bold text-sm hover:from-violet-700 hover:to-purple-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Wrench className="w-4 h-4" />Save Maintenance Log</>}
        </button>
      </form>
      <div className="h-8" />
    </div>
  );
}
