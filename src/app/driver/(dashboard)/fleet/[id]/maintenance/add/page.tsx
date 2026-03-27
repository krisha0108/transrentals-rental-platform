'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Wrench, Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'OTHER', label: 'Other' },
];

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
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, cost, date, odometer, nextDueDate }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/driver/fleet/${id}`);
      } else {
        setError(data.error || 'Failed to save log');
      }
    } catch {
      setError('Network error');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Maintenance Log</h1>
          <p className="text-sm text-gray-500">Record a service or repair</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div className="bg-white rounded-xl border p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                  type === t.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Cost */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cost (₹)</label>
            <input
              type="number"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Odometer (km)</label>
            <input
              type="number"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              placeholder="e.g. 45000"
              min="0"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Changed engine oil and filter"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Next Due Date */}
        <div className="bg-white rounded-xl border p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Next Due Date</label>
          <p className="text-xs text-gray-400 mb-2">When is the next service/repair due?</p>
          <input
            type="date"
            value={nextDueDate}
            onChange={e => setNextDueDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Log'}
        </button>
      </form>
    </div>
  );
}
