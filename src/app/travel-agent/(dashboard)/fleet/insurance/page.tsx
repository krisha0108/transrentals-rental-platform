'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Loader2,
  X,
  UploadCloud,
  FileText,
  Calendar,
  Save,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface FleetDoc {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  rcImage: string | null;
  insuranceImage: string | null;
  fitnessImage: string | null;
  permitImage: string | null;
  insuranceProvider: string | null;
  insuranceValidity: string | null;
  fitnessValidity: string | null;
  permitType: string | null;
  coverImage: string | null;
  isActive: boolean;
}

type StatusKind = 'expired' | 'expiring' | 'valid' | 'missing';

function statusOf(date: string | null): StatusKind {
  if (!date) return 'missing';
  const d = new Date(date);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

function daysLeft(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

const STATUS_STYLES: Record<StatusKind, { bg: string; text: string; border: string; label: string; icon: any }> = {
  expired:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Expired',         icon: ShieldX     },
  expiring: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Expiring soon',   icon: ShieldAlert },
  valid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Valid',           icon: ShieldCheck },
  missing:  { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',    label: 'Not added',       icon: AlertTriangle },
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FleetInsurancePage() {
  const { showToast } = useToast();
  const [fleets, setFleets] = useState<FleetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusKind>('ALL');
  const [editing, setEditing] = useState<FleetDoc | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/travel-agent/fleet');
      if (res.ok) {
        const j = await res.json();
        setFleets(j.fleets || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Worst-status (insurance/fitness/permit) per vehicle for filtering
  const worstStatus = (f: FleetDoc): StatusKind => {
    const order: StatusKind[] = ['expired', 'expiring', 'missing', 'valid'];
    const ss = [statusOf(f.insuranceValidity), statusOf(f.fitnessValidity)];
    for (const s of order) if (ss.includes(s)) return s;
    return 'valid';
  };

  const filtered = useMemo(() => {
    return fleets.filter((f) => {
      if (search) {
        const q = search.toLowerCase();
        const hay = [f.vehicleName, f.brand, f.model, f.registrationNumber, f.insuranceProvider]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && worstStatus(f) !== statusFilter) return false;
      return true;
    });
  }, [fleets, search, statusFilter]);

  const summary = useMemo(() => {
    const buckets: Record<StatusKind, number> = { expired: 0, expiring: 0, valid: 0, missing: 0 };
    for (const f of fleets) {
      buckets[statusOf(f.insuranceValidity)]++;
    }
    return buckets;
  }, [fleets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/travel-agent/fleet"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Back to fleet"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insurance & Documents</h1>
            <p className="text-sm text-gray-500">
              Track insurance, fitness and permit validity for every vehicle
            </p>
          </div>
        </div>
      </div>

      {/* Insurance summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <ShieldX className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Expired</p>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">{summary.expired}</p>
          <p className="text-xs text-red-600 mt-1">vehicles need renewal</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Expiring soon</p>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{summary.expiring}</p>
          <p className="text-xs text-amber-600 mt-1">within 30 days</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Valid</p>
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{summary.valid}</p>
          <p className="text-xs text-emerald-600 mt-1">currently in policy</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gray-700">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Not added</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.missing}</p>
          <p className="text-xs text-gray-500 mt-1">missing details</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle, registration or insurer…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['ALL', 'expired', 'expiring', 'valid', 'missing'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s === 'ALL' ? 'All' : STATUS_STYLES[s].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No vehicles match the filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Insurance</th>
                  <th className="px-4 py-3">Fitness (RC)</th>
                  <th className="px-4 py-3">Permit</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => {
                  const ins = statusOf(f.insuranceValidity);
                  const fit = statusOf(f.fitnessValidity);
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {f.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.coverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">🚗</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{f.vehicleName}</p>
                            <p className="text-xs text-gray-500 truncate font-mono">
                              {f.registrationNumber || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <DocCell
                          status={ins}
                          dateLabel={fmtDate(f.insuranceValidity)}
                          extra={f.insuranceProvider || undefined}
                          imageUrl={f.insuranceImage}
                          daysLeft={daysLeft(f.insuranceValidity)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <DocCell
                          status={fit}
                          dateLabel={fmtDate(f.fitnessValidity)}
                          imageUrl={f.fitnessImage || f.rcImage}
                          daysLeft={daysLeft(f.fitnessValidity)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <DocCell
                          status={f.permitImage ? 'valid' : 'missing'}
                          dateLabel={f.permitType || (f.permitImage ? 'Uploaded' : '—')}
                          imageUrl={f.permitImage}
                          daysLeft={null}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditing(f)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <InsuranceModal
          fleet={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await load();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DocCell({
  status,
  dateLabel,
  extra,
  imageUrl,
  daysLeft,
}: {
  status: StatusKind;
  dateLabel: string;
  extra?: string;
  imageUrl: string | null;
  daysLeft: number | null;
}) {
  const s = STATUS_STYLES[status];
  const Icon = s.icon;
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text} ${s.border}`}
      >
        <Icon className="w-3 h-3" /> {s.label}
      </span>
      <div className="text-xs text-gray-700 mt-1.5 flex items-center gap-1">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span>{dateLabel}</span>
        {daysLeft !== null && status !== 'missing' && (
          <span className={`text-[10px] ${status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
            ({daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`})
          </span>
        )}
      </div>
      {extra && <p className="text-[11px] text-gray-500 mt-0.5">{extra}</p>}
      {imageUrl && (
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 mt-1"
        >
          <FileText className="w-3 h-3" /> View doc <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}

// ─── Insurance edit modal ───────────────────────────────────────────────────

function InsuranceModal({
  fleet,
  onClose,
  onSaved,
}: {
  fleet: FleetDoc;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [docUploading, setDocUploading] = useState<string | null>(null);

  const toInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

  const [form, setForm] = useState({
    insuranceProvider: fleet.insuranceProvider || '',
    insuranceValidity: toInput(fleet.insuranceValidity),
    insuranceImage: fleet.insuranceImage || '',
    fitnessValidity: toInput(fleet.fitnessValidity),
    fitnessImage: fleet.fitnessImage || '',
    rcImage: fleet.rcImage || '',
    permitType: fleet.permitType || '',
    permitImage: fleet.permitImage || '',
  });

  const set = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const uploadDoc = async (file: File, field: keyof typeof form) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File must be under 5 MB' });
      return;
    }
    setDocUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'fleet-docs');
      const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', title: j.error || 'Upload failed' });
        return;
      }
      set(field, j.url);
      showToast({ type: 'success', title: 'Document uploaded' });
    } finally {
      setDocUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/travel-agent/fleet/${fleet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          insuranceValidity: form.insuranceValidity || null,
          fitnessValidity: form.fitnessValidity || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', title: j.error || 'Failed to save' });
        return;
      }
      showToast({ type: 'success', title: 'Documents updated' });
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{fleet.vehicleName}</h2>
            <p className="text-xs text-gray-500">{fleet.registrationNumber || fleet.vehicleType}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-6">
          {/* Insurance */}
          <Section title="Insurance" icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider">
                <input
                  type="text"
                  value={form.insuranceProvider}
                  onChange={(e) => set('insuranceProvider', e.target.value)}
                  placeholder="e.g. ICICI Lombard"
                  className="form-input"
                />
              </Field>
              <Field label="Valid till">
                <input
                  type="date"
                  value={form.insuranceValidity}
                  onChange={(e) => set('insuranceValidity', e.target.value)}
                  className="form-input"
                />
              </Field>
            </div>
            <DocUploader
              label="Insurance certificate"
              field="insuranceImage"
              url={form.insuranceImage}
              uploading={docUploading === 'insuranceImage'}
              onUpload={(file) => uploadDoc(file, 'insuranceImage')}
              onClear={() => set('insuranceImage', '')}
            />
          </Section>

          {/* Fitness */}
          <Section title="Fitness Certificate / RC" icon={<FileText className="w-4 h-4 text-amber-600" />}>
            <Field label="Fitness valid till">
              <input
                type="date"
                value={form.fitnessValidity}
                onChange={(e) => set('fitnessValidity', e.target.value)}
                className="form-input"
              />
            </Field>
            <DocUploader
              label="Fitness certificate"
              field="fitnessImage"
              url={form.fitnessImage}
              uploading={docUploading === 'fitnessImage'}
              onUpload={(file) => uploadDoc(file, 'fitnessImage')}
              onClear={() => set('fitnessImage', '')}
            />
            <DocUploader
              label="RC (Registration Certificate)"
              field="rcImage"
              url={form.rcImage}
              uploading={docUploading === 'rcImage'}
              onUpload={(file) => uploadDoc(file, 'rcImage')}
              onClear={() => set('rcImage', '')}
            />
          </Section>

          {/* Permit */}
          <Section title="Permit" icon={<FileText className="w-4 h-4 text-indigo-600" />}>
            <Field label="Permit type">
              <input
                type="text"
                value={form.permitType}
                onChange={(e) => set('permitType', e.target.value)}
                placeholder="e.g. All India Tourist, State"
                className="form-input"
              />
            </Field>
            <DocUploader
              label="Permit document"
              field="permitImage"
              url={form.permitImage}
              uploading={docUploading === 'permitImage'}
              onUpload={(file) => uploadDoc(file, 'permitImage')}
              onClear={() => set('permitImage', '')}
            />
          </Section>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save documents
            </button>
          </div>
        </form>

        <style jsx>{`
          .form-input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }
          .form-input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DocUploader({
  label,
  field,
  url,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  field: string;
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        {url ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
              View uploaded
            </a>
            <button type="button" onClick={onClear} className="ml-1 p-0.5 hover:bg-emerald-100 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-600 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
