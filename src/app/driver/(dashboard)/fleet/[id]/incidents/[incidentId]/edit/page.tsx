'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, AlertCircle, XCircle, IndianRupee, FileText } from 'lucide-react';

const INCIDENT_TYPES = ['Accident', 'Breakdown', 'Theft', 'Damage', 'Traffic Violation', 'Other'];

const SEVERITIES = [
  { v: 'LOW',    label: 'Low',    desc: 'Minor issue, no major damage',    icon: CheckCircle, bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  activeBg: 'bg-green-600' },
  { v: 'MEDIUM', label: 'Medium', desc: 'Moderate damage, needs attention', icon: AlertCircle, bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  activeBg: 'bg-amber-500' },
  { v: 'HIGH',   label: 'High',   desc: 'Severe damage or safety risk',     icon: XCircle,     bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    activeBg: 'bg-red-600' },
];

const STATUSES = [
  { v: 'PENDING',     label: 'Pending',     activeBg: 'bg-gray-600' },
  { v: 'IN_PROGRESS', label: 'In Progress', activeBg: 'bg-blue-600' },
  { v: 'RESOLVED',    label: 'Resolved',    activeBg: 'bg-green-600' },
];

const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition';

export default function EditIncidentPage() {
  const params = useParams()!;
  const id = params.id as string;
  const incidentId = params.incidentId as string;
  const router = useRouter();

  const [date, setDate]               = useState('');
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity]       = useState('MEDIUM');
  const [repairCost, setRepairCost]   = useState('');
  const [repairStatus, setRepairStatus] = useState('PENDING');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    fetch(`/api/driver/fleet/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.vehicle?.incidents) {
          const inc = d.vehicle.incidents.find((i: any) => i.id === incidentId);
          if (inc) {
            setDate(inc.date ? inc.date.split('T')[0] : '');
            setType(inc.type || '');
            setDescription(inc.description || '');
            setSeverity(inc.severity || 'MEDIUM');
            setRepairCost(inc.repairCost ? String(inc.repairCost) : '');
            setRepairStatus(inc.repairStatus || 'PENDING');
            setNotes(inc.notes || '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, incidentId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!type) { setError('Please select an incident type'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/driver/fleet/${id}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, description: description || null, severity, repairCost: repairCost || null, repairStatus, notes: notes || null }),
      });
      const data = await res.json();
      if (data.success) router.push(`/driver/fleet/${id}`);
      else setError(data.error || 'Failed to save');
    } catch { setError('Something went wrong'); }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-red-200">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Edit Incident</h1>
            <p className="text-red-100 text-xs mt-0.5">Update incident details</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Incident Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-red-50 border-b border-red-100">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Incident Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} required className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Incident Type *</label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition ${type === t ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:border-red-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Severity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-amber-50 border-b border-amber-100">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Severity</span>
          </div>
          <div className="p-5 space-y-2">
            {SEVERITIES.map(s => {
              const Icon = s.icon;
              const isActive = severity === s.v;
              return (
                <button key={s.v} type="button" onClick={() => setSeverity(s.v)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left ${isActive ? `${s.bg} ${s.border}` : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? s.bg : 'bg-white'}`}>
                    <Icon className={`w-4.5 h-4.5 ${s.text}`} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${isActive ? s.text : 'text-gray-600'}`}>{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                  {isActive && <div className={`w-5 h-5 rounded-full ${s.activeBg} flex items-center justify-center shrink-0`}><CheckCircle className="w-3 h-3 text-white" /></div>}
                </button>
              );
            })}
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
            <textarea rows={3} placeholder="What happened? Describe the incident..." value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none" />
          </div>
        </div>

        {/* Repair */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-green-50 border-b border-green-100">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Repair Info</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Repair Cost (₹)</label>
              <input type="number" step="0.01" placeholder="e.g. 5000" value={repairCost} onChange={e => setRepairCost(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Repair Status</label>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button key={s.v} type="button" onClick={() => setRepairStatus(s.v)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition text-center ${repairStatus === s.v ? `${s.activeBg} text-white border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
              <textarea rows={2} placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-2xl font-bold text-sm hover:from-red-700 hover:to-rose-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
        </button>
      </form>
      <div className="h-8" />
    </div>
  );
}
