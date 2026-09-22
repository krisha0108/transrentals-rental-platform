'use client';

// Admin view of the manager call sheet.
//
// Everything a manager logs in /manager/call-reports shows up here, across
// every manager, with the flagged rows floated to the top. Flagging happens on
// the manager side; deleting happens only here — one row at a time, or the
// whole flagged set after a bad import.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall, ArrowLeft, RefreshCw, Search, X, Flag, Trash2, Eye, Loader2,
  CheckCircle2, ThumbsUp, Clock, ThumbsDown, PhoneOff, PhoneForwarded,
  XCircle, Award, Briefcase, MapPin, Layers, Mail, Phone, Home, Calendar,
  Building2, User, MessageSquare, AlertTriangle, Store, Download,
} from 'lucide-react';

type CallReportStatus =
  | 'VENDOR_CREATED' | 'TRAVEL_AGENT_CREATED' | 'INTERESTED' | 'FOLLOW_UP' | 'NOT_INTERESTED'
  | 'NO_ANSWER' | 'CALLBACK_LATER' | 'WRONG_NUMBER' | 'CONVERTED';

interface CallReport {
  id: string;
  vendorId: string | null;
  vendor: { id: string; businessName: string; vid: string | null; status: string } | null;
  travelAgentId: string | null;
  travelAgent: { id: string; agencyName: string; tid: string | null; status: string } | null;
  vendorName: string;
  companyName: string | null;
  companyDetails: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  contactType: 'VENDOR' | 'TRAVEL_AGENT';
  services: { id: string; name: string; slug: string }[];
  locations: { id: string; name: string; slug: string; type: string }[];
  status: CallReportStatus;
  nextFollowUpDate: string | null;
  nextFollowUpTime: string | null;
  nextAction: string | null;
  notes: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  flaggedAt: string | null;
  flaggedByName: string | null;
  callDate: string;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  managerName: string | null;
}

const STATUS_META: Record<CallReportStatus, { label: string; pill: string; icon: any }> = {
  VENDOR_CREATED: { label: 'Vendor Created', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  TRAVEL_AGENT_CREATED: { label: 'Travel Agent Created', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Briefcase },
  INTERESTED: { label: 'Interested', pill: 'bg-blue-50 text-blue-700 border-blue-200', icon: ThumbsUp },
  FOLLOW_UP: { label: 'Follow-up', pill: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  NOT_INTERESTED: { label: 'Not Interested', pill: 'bg-gray-100 text-gray-600 border-gray-200', icon: ThumbsDown },
  NO_ANSWER: { label: 'No Answer', pill: 'bg-slate-100 text-slate-600 border-slate-200', icon: PhoneOff },
  CALLBACK_LATER: { label: 'Callback Later', pill: 'bg-purple-50 text-purple-700 border-purple-200', icon: PhoneForwarded },
  WRONG_NUMBER: { label: 'Wrong Number', pill: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  CONVERTED: { label: 'Converted', pill: 'bg-teal-50 text-teal-700 border-teal-200', icon: Award },
};

const STATUS_ORDER: CallReportStatus[] = [
  'FOLLOW_UP', 'INTERESTED', 'CALLBACK_LATER', 'VENDOR_CREATED', 'TRAVEL_AGENT_CREATED', 'CONVERTED',
  'NOT_INTERESTED', 'NO_ANSWER', 'WRONG_NUMBER',
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminCallReportsPage() {
  const [items, setItems] = useState<CallReport[]>([]);
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number>; flagged: number }>({
    total: 0, byStatus: {}, flagged: 0,
  });
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [status, setStatus] = useState('all');
  const [managerId, setManagerId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('managerId') || '';
  });
  const [contactType, setContactType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('flagged') === 'true';
  });

  const [viewing, setViewing] = useState<CallReport | null>(null);
  // What the confirm dialog is about to remove: one row, or the whole flagged set.
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'one'; report: CallReport } | { kind: 'all' } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeFilterCount =
    (status !== 'all' ? 1 : 0) + (managerId ? 1 : 0) + (contactType ? 1 : 0) +
    (from ? 1 : 0) + (to ? 1 : 0) + (query.trim() ? 1 : 0) + (flaggedOnly ? 1 : 0);

  const clearFilters = () => {
    setStatus('all');
    setManagerId('');
    setContactType('');
    setFrom('');
    setTo('');
    setQuery('');
    setFlaggedOnly(false);
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (managerId) params.set('managerId', managerId);
      if (contactType) params.set('contactType', contactType);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (query.trim()) params.set('q', query.trim());
      if (flaggedOnly) params.set('flagged', 'true');

      const res = await fetch(`/api/admin/call-reports?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load call reports');
      setItems(data.items || []);
      setCounts(data.counts || { total: 0, byStatus: {}, flagged: 0 });
      setManagers(data.managers || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load call reports');
    } finally {
      setLoading(false);
    }
  }, [status, managerId, contactType, from, to, query, flaggedOnly]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(t);
  }, [load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = pendingDelete.kind === 'one'
        ? await fetch(`/api/admin/call-reports/${pendingDelete.report.id}`, { method: 'DELETE' })
        : await fetch('/api/admin/call-reports/flagged', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: items.filter((i) => i.isFlagged).map((i) => i.id) }),
          });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Delete failed');

      setNotice(pendingDelete.kind === 'one'
        ? `Deleted "${pendingDelete.report.companyName || pendingDelete.report.vendorName}".`
        : `Deleted ${data.deleted} flagged call report${data.deleted === 1 ? '' : 's'}.`);
      setPendingDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    const header = [
      'Date', 'Contact Type', 'Vendor Name', 'Company Name', 'Phone', 'Email', 'Address', 'City',
      'Services', 'Locations', 'Status', 'Next Action', 'Notes', 'Logged By', 'Flagged', 'Flag Reason', 'Flagged By',
    ];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const rows = items.map((r) => [
      formatDate(r.callDate),
      r.contactType === 'TRAVEL_AGENT' ? 'Travel Agent' : 'Vendor',
      r.vendorName, r.companyName, r.phone, r.email, r.address, r.city,
      r.services.map((s) => s.name).join('; '),
      r.locations.map((l) => l.name).join('; '),
      STATUS_META[r.status].label,
      r.nextAction, r.notes, r.managerName,
      r.isFlagged ? 'Yes' : '', r.flagReason, r.flaggedByName,
    ].map(esc).join(','));

    const blob = new Blob([[header.map(esc).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const flaggedInView = useMemo(() => items.filter((i) => i.isFlagged).length, [items]);

  const tiles = [
    { label: 'Total in View', value: items.length, icon: PhoneCall, color: 'text-slate-600 bg-slate-100' },
    { label: 'Flagged', value: counts.flagged, icon: Flag, color: 'text-amber-600 bg-amber-50' },
    { label: 'Vendors Created', value: counts.byStatus.VENDOR_CREATED || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Follow-ups Pending', value: counts.byStatus.FOLLOW_UP || 0, icon: Clock, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/managers"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Back to managers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manager Call Reports</h1>
            <p className="text-sm text-slate-500">
              Every outbound call logged by a manager. Flagged rows can be deleted here.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={`inline-flex w-8 h-8 items-center justify-center rounded-lg ${t.color}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums">{t.value}</p>
            <p className="text-xs text-slate-500">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All managers</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}{counts.byStatus[s] ? ` (${counts.byStatus[s]})` : ''}
            </option>
          ))}
        </select>

        <select
          value={contactType}
          onChange={(e) => setContactType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Vendors & agents</option>
          <option value="VENDOR">Vendors only</option>
          <option value="TRAVEL_AGENT">Travel agents only</option>
        </select>

        <button
          type="button"
          onClick={() => setFlaggedOnly((v) => !v)}
          aria-pressed={flaggedOnly}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
            flaggedOnly
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700'
          }`}
        >
          <Flag className="w-4 h-4" />
          Flagged{counts.flagged ? ` (${counts.flagged})` : ''}
        </button>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <span className="text-sm text-slate-400">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />

        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor, company, phone, email or city..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-sm text-slate-500 hover:text-red-500 transition shrink-0"
          >
            <X className="w-4 h-4" /> Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Flagged action bar — only when there is something to act on. */}
      {flaggedInView > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <Flag className="w-4 h-4 shrink-0" />
            <span>
              <strong>{flaggedInView}</strong> flagged report{flaggedInView === 1 ? '' : 's'} in this view — a manager
              marked {flaggedInView === 1 ? 'it' : 'them'} for review.
            </span>
          </p>
          <button
            onClick={() => setPendingDelete({ kind: 'all' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" /> Delete all flagged ({flaggedInView})
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} className="p-1 rounded hover:bg-black/5 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <PhoneCall className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No call reports match these filters</p>
          <p className="text-xs text-slate-400 mt-1">Managers log calls from their Call Reports page.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Company / Vendor</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Service / Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Logged By</th>
                  {/* Pinned: the table scrolls sideways on narrow screens and
                      the delete button is the reason this page exists. */}
                  <th className="px-4 py-3 text-right sticky right-0 bg-slate-50 z-10 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => {
                  const meta = STATUS_META[r.status];
                  const StatusIcon = meta.icon;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${r.isFlagged ? 'bg-amber-50 hover:bg-amber-100/70' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">{formatDate(r.callDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{r.companyName || r.vendorName}</span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${r.contactType === 'TRAVEL_AGENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {r.contactType === 'TRAVEL_AGENT' ? 'Travel Agent' : 'Vendor'}
                          </span>
                          {r.isFlagged && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold">
                              <Flag className="w-2.5 h-2.5" /> Flagged
                            </span>
                          )}
                        </div>
                        {r.companyName && r.companyName !== r.vendorName && (
                          <div className="text-xs text-slate-400">Contact: {r.vendorName}</div>
                        )}
                        {r.isFlagged && r.flagReason && (
                          <div className="text-[11px] text-amber-700/90 max-w-[260px] truncate" title={r.flagReason}>
                            {r.flagReason}{r.flaggedByName ? ` — ${r.flaggedByName}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{r.city || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {r.services.length > 0 && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-[11px] font-medium" title={r.services.map((s) => s.name).join(', ')}>
                              <Layers className="w-3 h-3" />
                              {r.services.length === 1 ? r.services[0].name : `${r.services.length} services`}
                            </span>
                          )}
                          {r.locations.length > 0 && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-sky-50 text-sky-700 px-1.5 py-0.5 text-[11px] font-medium" title={r.locations.map((l) => l.name).join(', ')}>
                              <MapPin className="w-3 h-3" />
                              {r.locations.length === 1 ? r.locations[0].name : `${r.locations.length} locations`}
                            </span>
                          )}
                          {r.services.length === 0 && r.locations.length === 0 && <span className="text-slate-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${meta.pill}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-500" title={r.notes || ''}>{r.notes || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {r.managerName ? (
                          <Link href={`/admin/settings/managers/performance/${r.managerId}`} className="hover:text-emerald-600 hover:underline">
                            {r.managerName}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 sticky right-0 bg-inherit z-10 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewing(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="View full report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete is only offered on flagged rows — the API
                              refuses the rest anyway, so an always-on button
                              would just be a button that fails. */}
                          {r.isFlagged ? (
                            <button
                              onClick={() => setPendingDelete({ kind: 'one', report: r })}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                              title="Delete this flagged report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                              title="Only flagged reports can be deleted"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewing && <ViewReportModal report={viewing} onClose={() => setViewing(null)} />}

      {pendingDelete && (
        <ConfirmDeleteModal
          pending={pendingDelete}
          count={flaggedInView}
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="mt-0.5 text-sm text-slate-800 break-words">{value || '—'}</p>
    </div>
  );
}

function ViewReportModal({ report: r, onClose }: { report: CallReport; onClose: () => void }) {
  const meta = STATUS_META[r.status];
  const StatusIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{r.companyName || r.vendorName}</h2>
            {r.companyName && r.companyName !== r.vendorName && (
              <p className="text-sm text-slate-400">Contact: {r.vendorName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.pill}`}>
              <StatusIcon className="w-3.5 h-3.5" /> {meta.label}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${r.contactType === 'TRAVEL_AGENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {r.contactType === 'TRAVEL_AGENT' ? 'Travel Agent' : 'Vendor'}
            </span>
            {r.isFlagged && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-semibold">
                <Flag className="w-3.5 h-3.5" /> Flagged
              </span>
            )}
            {r.vendor && (
              <Link href={`/admin/vendors/${r.vendor.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                <Store className="w-3.5 h-3.5" /> {r.vendor.vid ? r.vendor.vid.toUpperCase() : 'View vendor'}
              </Link>
            )}
            {r.travelAgent && (
              <Link href={`/admin/travel-agents/${r.travelAgent.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                <Briefcase className="w-3.5 h-3.5" /> {r.travelAgent.tid ? r.travelAgent.tid.toUpperCase() : 'View travel agent'}
              </Link>
            )}
          </div>

          {r.isFlagged && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Flagged for review
              </p>
              <p className="text-sm text-amber-900">{r.flagReason || 'No reason given.'}</p>
              <p className="mt-1.5 text-xs text-amber-700/80">
                {r.flaggedByName ? `by ${r.flaggedByName}` : ''}
                {r.flaggedByName && r.flaggedAt ? ' · ' : ''}
                {r.flaggedAt ? formatDate(r.flaggedAt) : ''}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">Contact &amp; Company</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
              <Field icon={User} label="Contact person" value={r.vendorName} />
              <Field icon={Building2} label="Company" value={r.companyName} />
              <Field icon={Phone} label="Phone" value={r.phone} />
              <Field icon={Mail} label="Email" value={r.email} />
              <Field icon={Home} label="Address" value={r.address} />
              <Field icon={MapPin} label="City" value={r.city} />
            </div>
            {r.companyDetails && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Field icon={Building2} label="Company details" value={r.companyDetails} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">Call &amp; Follow-up</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
              <Field icon={Calendar} label="Call date" value={formatDate(r.callDate)} />
              <Field icon={User} label="Logged by" value={r.managerName} />
              <Field icon={Calendar} label="Next follow-up" value={
                r.nextFollowUpDate
                  ? `${formatDate(r.nextFollowUpDate)}${r.nextFollowUpTime ? ` at ${r.nextFollowUpTime}` : ''}`
                  : null
              } />
              <Field icon={Layers} label="Services" value={r.services.map((s) => s.name).join(', ') || null} />
              <Field icon={MapPin} label="Locations" value={r.locations.map((l) => l.name).join(', ') || null} />
              <Field icon={MessageSquare} label="Next action" value={r.nextAction} />
            </div>
            {r.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Field icon={MessageSquare} label="Notes" value={r.notes} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  pending, count, busy, onCancel, onConfirm,
}: {
  pending: { kind: 'one'; report: CallReport } | { kind: 'all' };
  count: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isBulk = pending.kind === 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={busy ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2.5">
          <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-red-50 text-red-600 shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </span>
          <h2 className="text-base font-bold text-slate-900">
            {isBulk ? `Delete ${count} flagged report${count === 1 ? '' : 's'}?` : 'Delete this call report?'}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
          {isBulk ? (
            <p>
              This removes every flagged report currently in view. The managers&apos; activity log keeps a
              record of the calls, but the report rows themselves are gone.
            </p>
          ) : (
            <>
              <p>
                <strong className="text-slate-900">{pending.report.companyName || pending.report.vendorName}</strong>
                {pending.report.phone ? ` · ${pending.report.phone}` : ''}
                {pending.report.managerName ? ` · logged by ${pending.report.managerName}` : ''}
              </p>
              {pending.report.flagReason && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-xs">
                  <Flag className="w-3 h-3 inline mr-1" /> {pending.report.flagReason}
                </p>
              )}
            </>
          )}
          <p className="text-xs text-slate-400">This cannot be undone.</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isBulk ? 'Delete all' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
