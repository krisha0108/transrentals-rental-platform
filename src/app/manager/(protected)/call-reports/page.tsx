'use client';

// Vendor-acquisition call sheet — a log for outbound calls managers make to
// prospective vendors while out in the field. Each manager only sees their
// own rows, and only they (or an admin, elsewhere) can edit/delete a row.
// Adding/editing a row happens on its own full page (see ./new and
// ./[id]/edit) rather than in a modal here.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall, Plus, Loader2, Search, ChevronDown, Pencil,
  CheckCircle2, ThumbsUp, Clock, ThumbsDown, PhoneOff, PhoneForwarded,
  XCircle, Award, Download, Store, RefreshCw, MapPin, Layers,
  Eye, X, User, Building2, Phone, Home, Calendar, MessageSquare, Bell, UserPlus, Mail, Briefcase,
  Upload, AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SearchableSelect, type SelectOption } from './_components/SearchableSelect';
import { MultiSelect } from './_components/MultiSelect';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

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
  notes: string | null;
  nextFollowUpDate: string | null;
  nextFollowUpTime: string | null;
  nextAction: string | null;
  callDate: string;
  createdAt: string;
  managerId: string;
  managerName: string | null;
  canEdit: boolean;
}

// One sheet from an uploaded workbook, already parsed and mapped onto the
// API's field names, pending the manager's review in ImportPreviewModal.
interface ImportSheetPreview {
  name: string;
  rows: Record<string, any>[];
  include: boolean;
  serviceId: string;
}
interface ImportPreview {
  fileName: string;
  locationIds: string[];
  sheets: ImportSheetPreview[];
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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ManagerCallReportsPage() {
  const [items, setItems] = useState<CallReport[]>([]);
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number> }>({ total: 0, byStatus: {} });
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Drives the Clear all button — every filter this page applies.
  const activeFilterCount =
    (status !== 'all' ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0) +
    (cityFilter ? 1 : 0) + (serviceFilter ? 1 : 0) + (locationFilter ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const clearFilters = () => {
    setStatus('all');
    setFrom('');
    setTo('');
    setCityFilter('');
    setServiceFilter('');
    setLocationFilter('');
    setQuery('');
  };

  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<SelectOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);

  const [viewingReport, setViewingReport] = useState<CallReport | null>(null);

  const reqRef = useRef(0);

  useEffect(() => {
    fetch('/api/services?parentsOnly=true')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setServiceOptions((d.services || []).map((s: any) => ({ id: s.id, label: s.name })));
      })
      .catch(() => {});
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const locs = d.locations || [];
        setLocationOptions(locs.map((l: any) => ({
          id: l.id,
          label: l.name,
          sublabel: l.type === 'UNION_TERRITORY' ? undefined : l.locations?.name,
        })));
        const byName = new Map<string, string | undefined>();
        locs.forEach((l: any) => {
          if (!byName.has(l.name)) byName.set(l.name, l.type === 'UNION_TERRITORY' ? undefined : l.locations?.name);
        });
        setCityOptions(
          [...byName.entries()]
            .map(([name, state]) => ({ id: name, label: name, sublabel: state }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('mine', 'true');
      if (status !== 'all') params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (cityFilter) params.set('city', cityFilter);
      if (serviceFilter) params.set('serviceId', serviceFilter);
      if (locationFilter) params.set('locationId', locationFilter);

      const res = await fetch(`/api/manager/call-reports?${params.toString()}`);
      const data = await res.json();
      if (myReq !== reqRef.current) return;
      if (!res.ok) throw new Error(data?.error || 'Failed to load call reports');
      setItems(data.items || []);
      setCounts(data.counts || { total: 0, byStatus: {} });
      setTodayCount(data.todayCount || 0);
    } catch (e: any) {
      if (myReq !== reqRef.current) return;
      setError(e?.message || 'Failed to load call reports');
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  }, [status, query, from, to, cityFilter, serviceFilter, locationFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleQuickStatusChange = async (r: CallReport, newStatus: CallReportStatus) => {
    setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, status: newStatus } : i)));
    try {
      const res = await fetch(`/api/manager/call-reports/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      load();
    } catch {
      setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, status: r.status } : i)));
      setError('Could not update status — please try again.');
    }
  };

  // ── Bulk import ─────────────────────────────────────────────────────────────
  // The column names below match what exportSheet() writes, so a sheet exported
  // from this page can be edited and imported straight back.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number; failed: number; total: number; errors: { row: number; message: string }[];
  } | null>(null);

  const COLUMN_ALIASES: Record<string, string> = {
    'date': 'callDate',
    'call date': 'callDate',
    'contact type': 'contactType',
    'vendor name': 'vendorName',
    'company name': 'companyName',
    'company details': 'companyDetails',
    'phone': 'phone',
    // Raw vendor-list scrapes (e.g. a Google Maps export) use "Contact Number"
    // rather than "Phone", and misspell it "Contect Number" often enough to
    // alias both.
    'contact number': 'phone',
    'contect number': 'phone',
    'email': 'email',
    'email / website': 'email',
    'address': 'address',
    'city': 'city',
    'service': 'services',
    'services': 'services',
    'location': 'locations',
    'locations': 'locations',
    'status': 'status',
    'notes': 'notes',
    'next follow up date': 'nextFollowUpDate',
    'next follow-up date': 'nextFollowUpDate',
    'next follow up time': 'nextFollowUpTime',
    'next action': 'nextAction',
  };

  // A sheet's name hints at which service it's a list for (e.g. a scraped
  // vendor-list workbook with one sheet per vehicle type). Only a starting
  // point — the manager confirms or changes it per sheet before importing.
  const guessServiceIdForSheet = (sheetName: string, options: SelectOption[]): string => {
    const s = sheetName.toLowerCase();
    let keywords: string[] = [];
    if (s.includes('bike')) keywords = ['bike'];
    else if (s.includes('self drive') || s.includes('self-drive')) keywords = ['self drive'];
    else if (s.includes('bus') || s.includes('tempo')) keywords = ['bus'];
    else if (s.includes('truck') || s.includes('track')) keywords = ['truck'];
    else if (s.includes('driver')) keywords = ['car rental'];
    else if (s.includes('equipment')) keywords = ['equipment'];
    else if (s.includes('luxury')) keywords = ['luxury'];
    else if (s.includes('packer') || s.includes('mover')) keywords = ['packers'];
    if (!keywords.length) return '';
    return options.find((o) => keywords.some((k) => o.label.toLowerCase().includes(k)))?.id || '';
  };

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);

  // Reads every sheet in the workbook (not just the first) and maps each
  // row's headers onto the API's field names, so a multi-sheet, one-sheet-
  // per-vehicle-type file (e.g. a scraped vendor list) can be reviewed
  // before anything is imported — see ImportPreviewModal below.
  const handleFileSelected = async (file: File) => {
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      if (wb.SheetNames.length === 0) throw new Error('That file has no sheets in it.');

      const sheets: ImportSheetPreview[] = wb.SheetNames.map((name) => {
        const sheet = wb.Sheets[name];
        const raw = sheet ? XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' }) : [];

        // Map whatever the header row says onto the API's field names. Unknown
        // columns are ignored rather than rejected, so extra notes columns are fine.
        const mapped = raw.map((r) => {
          const out: Record<string, any> = {};
          Object.entries(r).forEach(([key, value]) => {
            const field = COLUMN_ALIASES[String(key).trim().toLowerCase()];
            if (field) out[field] = value;
          });
          return out;
        }).filter((r) => String(r.vendorName ?? r.companyName ?? '').trim());

        return {
          name: name.trim(),
          rows: mapped,
          include: mapped.length > 0,
          serviceId: guessServiceIdForSheet(name, serviceOptions),
        };
      });

      if (sheets.every((s) => s.rows.length === 0)) {
        throw new Error('No sheet in that file has any rows with a vendor or company name.');
      }

      setImportPreview({ fileName: file.name, locationIds: [], sheets });
    } catch (e: any) {
      setError(e?.message || 'Could not read that file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    const locationName = locationOptions
      .filter((o) => importPreview.locationIds.includes(o.id))
      .map((o) => o.label)
      .join('; ');

    const rows = importPreview.sheets
      .filter((s) => s.include && s.rows.length > 0)
      .flatMap((s) => {
        const serviceName = serviceOptions.find((o) => o.id === s.serviceId)?.label;
        return s.rows.map((r) => ({
          ...r,
          // The API requires vendorName specifically; a sheet whose header is
          // "Company Name" rather than "Vendor Name" (e.g. the with-driver /
          // bus / truck templates) would otherwise fail as "Vendor name is
          // empty" even though it clearly names a business.
          vendorName: String(r.vendorName ?? '').trim() || String(r.companyName ?? '').trim(),
          ...(serviceName ? { services: serviceName } : {}),
          ...(locationName ? { locations: locationName } : {}),
        }));
      });

    if (rows.length === 0) {
      setError('Pick at least one sheet with rows to import.');
      return;
    }

    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const res = await fetch('/api/manager/call-reports/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Import failed');

      setImportResult({
        created: data.created, failed: data.failed, total: data.total, errors: data.errors || [],
      });
      setImportPreview(null);
      if (data.created > 0) load();
    } catch (e: any) {
      setError(e?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const exportSheet = () => {
    const header = [
      'Date', 'Contact Type', 'Vendor Name', 'Company Name', 'Company Details', 'Phone', 'Email', 'Address', 'City',
      'Service', 'Location', 'Status', 'Notes', 'Added By',
    ];
    const rows = items.map((r) => [
      formatDate(r.callDate),
      r.contactType === 'TRAVEL_AGENT' ? 'Travel Agent' : 'Vendor',
      r.vendorName,
      r.companyName || '',
      (r.companyDetails || '').replace(/\n/g, ' '),
      r.phone || '',
      r.email || '',
      r.address || '',
      r.city || '',
      r.services.map((s) => s.name).join('; '),
      r.locations.map((l) => l.name).join('; '),
      STATUS_META[r.status].label,
      (r.notes || '').replace(/\n/g, ' '),
      r.managerName || '',
    ]);
    // A real workbook rather than a .csv, so it opens in Excel with proper columns
    // instead of everything crammed into column A — and so the file round-trips
    // back through Import Excel.
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = header.map((h, i) => ({
      wch: Math.min(40, Math.max(h.length + 2, ...rows.map((r) => String(r[i] ?? '').length + 2))),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Call Reports');
    XLSX.writeFile(wb, `call-reports-${todayStr()}.xlsx`);
  };

  const statTiles = useMemo(() => ([
    { label: "Today's Calls", value: todayCount, icon: PhoneCall, color: 'text-blue-600 bg-blue-50' },
    { label: 'Vendors Created', value: counts.byStatus.VENDOR_CREATED || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Follow-ups Pending', value: counts.byStatus.FOLLOW_UP || 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total in View', value: counts.total, icon: PhoneCall, color: 'text-gray-600 bg-gray-100' },
  ]), [todayCount, counts]);

  // Title and the action buttons all go into the shared sticky bar (the row with the
  // bell), which was otherwise sitting empty above a second header row.
  useManagerPageHeader(
    'Vendor Call Reports',
    'Log outbound vendor calls and track follow-up status — shared across the team.',
    <div key="actions" className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => { setLoading(true); load(); }}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>
      <button
        onClick={exportSheet}
        disabled={items.length === 0}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition disabled:opacity-40"
      >
        <Download className="w-3.5 h-3.5" /> Export as Sheet
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        title="Bulk-add call reports from an Excel sheet"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition disabled:opacity-40"
      >
        {importing
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Upload className="w-3.5 h-3.5" />}
        {importing ? 'Importing…' : 'Import Excel'}
      </button>
      <Link
        href="/manager/call-reports/new"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
      >
        <Plus className="w-4 h-4" /> Add Call Report
      </Link>
    </div>,
  );

  return (
    <div className="space-y-5">

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statTiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`inline-flex w-8 h-8 items-center justify-center rounded-lg ${t.color}`}>
              <t.icon className="w-4 h-4" />
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900 tabular-nums">{t.value}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}{counts.byStatus[s] ? ` (${counts.byStatus[s]})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
        />
        <span className="text-sm text-gray-400">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
        />

        <div className="w-40">
          <SearchableSelect
            options={cityOptions}
            value={cityFilter}
            onChange={setCityFilter}
            placeholder="All cities"
            icon={MapPin}
            dense
          />
        </div>
        <div className="w-40">
          <SearchableSelect
            options={serviceOptions}
            value={serviceFilter}
            onChange={setServiceFilter}
            placeholder="All services"
            icon={Layers}
            dense
          />
        </div>
        <div className="w-40">
          <SearchableSelect
            options={locationOptions}
            value={locationFilter}
            onChange={setLocationFilter}
            placeholder="All locations"
            icon={MapPin}
            dense
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor name, phone, email or city..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
          />
        </div>

        {/* Clear all — only shown once something is actually filtered. */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-sm text-gray-500 hover:text-red-500 transition shrink-0"
          >
            <X className="w-4 h-4" />
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Import outcome — says exactly which rows did not go in, rather than a
          bare "done" that hides skipped rows. */}
      {importResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            importResult.failed > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold flex items-center gap-1.5">
                {importResult.failed > 0
                  ? <AlertTriangle className="w-4 h-4 shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                Imported {importResult.created} of {importResult.total} rows
                {importResult.failed > 0 && ` — ${importResult.failed} skipped`}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {importResult.errors.map((er) => (
                    <li key={er.row} className="text-xs">
                      Row {er.row}: {er.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="p-1 rounded hover:bg-black/5 shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sheet */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <PhoneCall className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No call reports yet</p>
          <p className="text-xs text-gray-400 mt-1">Log your first outbound vendor call with "Add Call Report" above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Company / Vendor</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address / City</th>
                  <th className="px-4 py-3">Service / Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Added By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 tabular-nums">{formatDate(r.callDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">{r.companyName || r.vendorName}</span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${r.contactType === 'TRAVEL_AGENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {r.contactType === 'TRAVEL_AGENT' ? 'Travel Agent' : 'Vendor'}
                          </span>
                        </div>
                        {r.companyName && r.companyName !== r.vendorName && (
                          <div className="text-xs text-gray-400">Contact: {r.vendorName}</div>
                        )}
                        {r.vendor && (
                          <Link href={`/manager/vendors/${r.vendor.id}`} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                            <Store className="w-3 h-3" /> {r.vendor.vid ? r.vendor.vid.toUpperCase() : 'View vendor'}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.address && <div className="text-xs">{r.address}</div>}
                        <div>{r.city || '—'}</div>
                      </td>
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
                          {r.services.length === 0 && r.locations.length === 0 && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={r.status}
                            onChange={(e) => handleQuickStatusChange(r, e.target.value as CallReportStatus)}
                            className={`appearance-none pl-2.5 pr-7 py-1 rounded-full border text-xs font-semibold cursor-pointer whitespace-nowrap ${meta.pill}`}
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-gray-500" title={r.notes || ''}>{r.notes || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{r.managerName || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReport(r)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {r.canEdit && (
                            <Link
                              href={`/manager/call-reports/${r.id}/edit`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
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

      {viewingReport && (
        <ViewReportModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      {importPreview && (
        <ImportPreviewModal
          preview={importPreview}
          onChange={setImportPreview}
          serviceOptions={serviceOptions}
          locationOptions={locationOptions}
          importing={importing}
          onCancel={() => setImportPreview(null)}
          onConfirm={confirmImport}
        />
      )}
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
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{r.companyName || r.vendorName}</h2>
            {r.companyName && r.companyName !== r.vendorName && (
              <p className="text-sm text-gray-400">Contact: {r.vendorName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0">
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
            {r.vendor ? (
              <Link href={`/manager/vendors/${r.vendor.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                <Store className="w-3.5 h-3.5" /> {r.vendor.vid ? r.vendor.vid.toUpperCase() : 'View vendor profile'}
              </Link>
            ) : r.travelAgent ? (
              <Link href={`/manager/travel-agents/${r.travelAgent.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                <Briefcase className="w-3.5 h-3.5" /> {r.travelAgent.tid ? r.travelAgent.tid.toUpperCase() : 'View travel agent profile'}
              </Link>
            ) : r.canEdit && r.contactType === 'VENDOR' ? (
              <Link
                href={`/manager/vendors/create?${new URLSearchParams({
                  businessName: r.companyName || r.vendorName || '',
                  ownerName: r.vendorName || '',
                  phone: r.phone || '',
                  email: r.email || '',
                  address: r.address || '',
                  city: r.city || '',
                  callReportId: r.id,
                }).toString()}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Ready to Become Vendor
              </Link>
            ) : r.canEdit && (
              <Link
                href={`/manager/travel-agents/create?${new URLSearchParams({
                  agencyName: r.companyName || r.vendorName || '',
                  ownerName: r.vendorName || '',
                  phone: r.phone || '',
                  email: r.email || '',
                  address: r.address || '',
                  city: r.city || '',
                  callReportId: r.id,
                }).toString()}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Ready to Become Travel Agent
              </Link>
            )}
          </div>

          {/* Contact & Company */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Contact & Company</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Vendor Name</p>
                  <p className="font-medium text-gray-800 truncate">{r.vendorName || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Company</p>
                  <p className="font-medium text-gray-800 truncate">{r.companyName || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="font-medium text-gray-800 truncate">{r.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Email</p>
                  <p className="font-medium text-gray-800 truncate">{r.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">City</p>
                  <p className="font-medium text-gray-800 truncate">{r.city || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Address</p>
                  <p className="font-medium text-gray-800">{r.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service & Location */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Service(s)
                {r.services.length > 0 && <span className="text-gray-300 font-normal normal-case">· {r.services.length}</span>}
              </p>
              {r.services.length === 0 ? (
                <p className="text-gray-400 text-xs">—</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {r.services.map((s) => (
                    <span key={s.id} className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-1 text-xs font-medium">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> Location(s)
                {r.locations.length > 0 && <span className="text-gray-300 font-normal normal-case">· {r.locations.length}</span>}
              </p>
              {r.locations.length === 0 ? (
                <p className="text-gray-400 text-xs">—</p>
              ) : (
                <div className={`flex flex-wrap gap-1.5 ${r.locations.length > 12 ? 'max-h-32 overflow-y-auto pr-1' : ''}`}>
                  {r.locations.map((l) => (
                    <span key={l.id} className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2.5 py-1 text-xs font-medium">{l.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Call info */}
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Call Date</p>
                  <p className="font-medium text-gray-800">{formatDate(r.callDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Added By</p>
                  <p className="font-medium text-gray-800 truncate">{r.managerName || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {(r.nextFollowUpDate || r.nextAction) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-bold text-gray-900">Next Follow-up</p>
              </div>
              {r.nextFollowUpDate && (
                <p className="text-xs text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {formatDate(r.nextFollowUpDate)}
                  {r.nextFollowUpTime && <><Clock className="w-3 h-3 ml-1" /> {r.nextFollowUpTime}</>}
                </p>
              )}
              {r.nextAction && <p className="text-xs text-amber-900 mt-1">{r.nextAction}</p>}
            </div>
          )}

          {r.notes && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <p className="text-xs font-bold text-gray-900">Notes</p>
              </div>
              <p className="text-xs text-purple-900 whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// A raw vendor-list workbook (e.g. scraped from Google Maps) usually has one
// sheet per vehicle type and no per-row service/location columns at all — the
// sheet name and file name carry that instead. This lets the manager assign a
// service per sheet and one location for the whole file before anything is
// imported, rather than requiring 1000 rows to spell it out themselves.
function ImportPreviewModal({
  preview, onChange, serviceOptions, locationOptions, importing, onCancel, onConfirm,
}: {
  preview: ImportPreview;
  onChange: (p: ImportPreview) => void;
  serviceOptions: SelectOption[];
  locationOptions: SelectOption[];
  importing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const setSheet = (i: number, patch: Partial<ImportSheetPreview>) => {
    const sheets = preview.sheets.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...preview, sheets });
  };

  const includedCount = preview.sheets.filter((s) => s.include).length;
  const totalRows = preview.sheets.filter((s) => s.include).reduce((n, s) => n + s.rows.length, 0);
  const missingService = preview.sheets.some((s) => s.include && s.rows.length > 0 && !s.serviceId);
  const canImport = includedCount > 0 && totalRows > 0 && !missingService && !importing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={importing ? undefined : onCancel}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Import Excel</h2>
            <p className="text-sm text-gray-400 truncate">{preview.fileName}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={importing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Location for this whole file
            </label>
            <MultiSelect
              options={locationOptions}
              value={preview.locationIds}
              onChange={(ids) => onChange({ ...preview, locationIds: ids })}
              placeholder="Select location(s) (optional)"
              searchPlaceholder="Search locations..."
              icon={MapPin}
            />
            <p className="text-xs text-gray-400 mt-1">Applied to every row imported below — e.g. Chandigarh covers more than one location, so pick all that apply.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
              Sheets found in this file
            </label>
            {preview.sheets.map((s, i) => (
              <div
                key={s.name}
                className={`rounded-xl border p-3 ${s.rows.length === 0 ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={s.include}
                    disabled={s.rows.length === 0}
                    onChange={(e) => setSheet(i, { include: e.target.checked })}
                    className="rounded border-gray-300 disabled:opacity-30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">
                      {s.rows.length === 0 ? 'No rows with a vendor or company name' : `${s.rows.length} row${s.rows.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
                {s.include && s.rows.length > 0 && (
                  <div className="mt-2.5 pl-6">
                    <SearchableSelect
                      options={serviceOptions}
                      value={s.serviceId}
                      onChange={(id) => setSheet(i, { serviceId: id })}
                      placeholder="Which service is this sheet for?"
                      dense
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {missingService && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Pick a service for every included sheet before importing.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500">
            {totalRows} row{totalRows === 1 ? '' : 's'} from {includedCount} sheet{includedCount === 1 ? '' : 's'} will be imported
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={importing}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-40"
            >
              {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {importing ? 'Importing…' : `Import ${totalRows} row${totalRows === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
