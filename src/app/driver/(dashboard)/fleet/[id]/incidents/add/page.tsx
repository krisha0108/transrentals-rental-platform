'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const INCIDENT_TYPES = ['Accident', 'Breakdown', 'Theft', 'Damage', 'Traffic Violation', 'Other'];
const SEVERITIES = [{ v: 'LOW', label: 'Low', cls: 'bg-green-600' }, { v: 'MEDIUM', label: 'Medium', cls: 'bg-amber-500' }, { v: 'HIGH', label: 'High', cls: 'bg-red-600' }];
const STATUSES = [{ v: 'PENDING', label: 'Pending' }, { v: 'IN_PROGRESS', label: 'In Progress' }, { v: 'RESOLVED', label: 'Resolved' }];

export default function AddIncidentPage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();

  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity]       = useState('MEDIUM');
  const [repairCost, setRepairCost]   = useState('');
  const [repairStatus, setRepairStatus] = useState('PENDING');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!type) { setError('Please select an incident type'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, description: description || null, severity, repairCost: repairCost || null, repairStatus, notes: notes || null }),
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
        <h1 className="text-xl font-bold text-gray-900">Report Incident</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border p-5 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Type *</label>
          <div className="flex flex-wrap gap-2">
            {INCIDENT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${type === t ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button key={s.v} type="button" onClick={() => setSeverity(s.v)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${severity === s.v ? `${s.cls} text-white border-transparent` : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea rows={3} placeholder="What happened?" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Repair Cost (₹)</label>
            <input type="number" step="0.01" placeholder="e.g. 5000" value={repairCost} onChange={e => setRepairCost(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Repair Status</label>
            <div className="flex flex-col gap-1">
              {STATUSES.map(s => (
                <button key={s.v} type="button" onClick={() => setRepairStatus(s.v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition text-left ${repairStatus === s.v ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea rows={2} placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Incident Report'}
        </button>
      </form>
    </div>
  );
}
