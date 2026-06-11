'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, Save } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'NEW',         label: 'New',         pill: 'bg-blue-50 text-blue-700 border-blue-200',     icon: AlertCircle },
  { value: 'IN_PROGRESS', label: 'In Progress',  pill: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  { value: 'RESOLVED',    label: 'Resolved',     pill: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle },
  { value: 'CLOSED',      label: 'Closed',       pill: 'bg-gray-100 text-gray-600 border-gray-200',    icon: XCircle },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]['value'];

interface Props {
  inquiryId: string;
  currentStatus: string;
  currentResolution: string | null;
}

export default function StatusUpdater({ inquiryId, currentStatus, currentResolution }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusValue>((currentStatus as StatusValue) || 'NEW');
  const [resolution, setResolution] = useState(currentResolution || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentOpt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  const StatusIcon = currentOpt.icon;
  const isDirty = status !== currentStatus || resolution !== (currentResolution || '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/manager/contact-inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution: resolution.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <StatusIcon className="w-4 h-4 text-indigo-600" />
        <h2 className="font-semibold text-slate-900">Status & Resolution</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Current status badge */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Current Status</p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentOpt.pill}`}>
            <StatusIcon className="w-3 h-3" />
            {currentOpt.label}
          </span>
        </div>

        {/* Status selector */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Change Status</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                    isSelected
                      ? `${opt.pill} ring-2 ring-offset-1 ring-current`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution notes */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Resolution Notes</p>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Add notes about how this inquiry was resolved..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition ${
            saved
              ? 'bg-green-600 text-white'
              : isDirty
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
