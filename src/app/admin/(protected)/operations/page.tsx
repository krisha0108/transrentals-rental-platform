'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Activity, AlertTriangle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Inbox,
  Loader2, MapPin, Phone, RefreshCw, Store, TrendingDown, Users,
  Search, PackageX, Radar, UserX, PhoneCall, StickyNote, X, CreditCard,
  Server, Bell, XCircle, MinusCircle, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';

// Validated categorical palette (dataviz skill) — fixed hue order, first two
// slots (blue/orange) clear the CVD adjacent-pair gate. Status colors reuse
// the emerald/slate pairing already established on the sibling Manager
// Performance page for the same Total-vs-Actioned semantic.
const CHART_COLOR = {
  categorical1: '#2a78d6', // blue — slot 1
  categorical2: '#eb6834', // orange — slot 2
  statusGood: '#10b981',   // emerald — "actioned" (matches manager-performance page)
  neutral: '#cbd5e1',      // slate-300 — "total" backdrop
  critical: '#e34948',     // red — slot 8, coverage gaps (lost business)
  warning: '#eda100',      // yellow/amber — slot 4, idle vendor coverage
  grid: '#f1f5f9',
  axis: '#94a3b8',
};

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

const PREVIOUS_PERIOD_LABEL: Record<DatePreset, string> = {
  today: 'yesterday',
  yesterday: 'day before',
  thisWeek: 'previous week',
  thisMonth: 'previous month',
  lastMonth: 'month before',
  all: '',
  custom: 'previous period',
};

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Date' },
];

type TabKey = 'overview' | 'inquiries' | 'bookings' | 'managers' | 'vendors' | 'gaps' | 'idle' | 'systemHealth';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'inquiries', label: 'Untouched Inquiries', icon: Inbox },
  { key: 'bookings', label: 'Untouched Bookings', icon: PackageX },
  { key: 'managers', label: 'Manager Performance', icon: Users },
  { key: 'vendors', label: 'Vendors Needing Action', icon: Store },
  { key: 'gaps', label: 'Coverage Gaps', icon: Radar },
  { key: 'idle', label: 'Idle Vendors', icon: UserX },
  { key: 'systemHealth', label: 'System Health', icon: Server },
];

const PAGE_LIMIT = 20;

interface Paginated<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }

interface TrackedItem {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceSlug: string;
  locationName: string;
  createdAt: string;
}

interface Summary {
  inquiries: { total: number; actioned: number; untouched: number; previousTotal: number | null };
  bookings: { total: number; actioned: number; untouched: number; previousTotal: number | null };
  vendorsNeedingAction: number;
  coverageGaps: { total: number; locations: number };
  idleVendorCoverage: number;
  paymentFailures: number;
  paymentFailuresPrevious: number | null;
}

// Renders a "+18% vs yesterday"-style trend chip. `goodDirection` says which
// way is good news — 'up' for volume metrics (more inquiries = good),
// 'down' for failure/backlog metrics (fewer = good) — so the color reflects
// business meaning, not just the raw sign of the change.
function TrendChip({ current, previous, goodDirection, periodLabel }: { current: number; previous: number | null; goodDirection: 'up' | 'down'; periodLabel: string }) {
  if (previous === null) return null;
  if (previous === 0 && current === 0) {
    return <span className="text-xs font-medium text-slate-400">No change vs {periodLabel}</span>;
  }
  const deltaPct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isUp = current > previous;
  const isFlat = current === previous;
  const isGood = isFlat ? null : (goodDirection === 'up' ? isUp : !isUp);
  const color = isFlat ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-rose-600';
  const arrow = isFlat ? '→' : isUp ? '↑' : '↓';
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {Math.abs(deltaPct)}% vs {periodLabel} ({previous})
    </span>
  );
}

interface PaymentFailureItem {
  id: string; requestNumber: string; customerName: string; customerPhone: string;
  serviceName: string; serviceSlug: string; locationName: string;
  amount: number; paymentMethod: string | null; createdAt: string;
}

interface CronJobHealth {
  sourceName: string;
  lastStatus: 'SUCCESS' | 'FAILURE' | null;
  lastRunAt: string | null;
  lastMessage: string | null;
  lastDurationMs: number | null;
  runsLast7d: number;
  failuresLast7d: number;
}

interface NotificationHealth {
  sourceName: string;
  successLast7d: number;
  failureLast7d: number;
}

// "auto-drop-bookings" -> "Auto Drop Bookings"
function humanizeSourceName(name: string) {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface VendorNeedingAction {
  id: string; businessName: string; ownerName: string; phone: string; email: string;
  city: string | null; status: string; daysSinceUpdate: number;
}

interface CoverageGapGroup { locationName: string; serviceType: string; count: number; latest: string; requestNumbers: string[] }
interface DemandCoverageItem { locationName: string; serviceName: string; serviceSlug: string; inquiryCount: number; vendorCount: number }
type VendorThreshold = 'zero' | 5 | 10 | 20;
const VENDOR_THRESHOLD_OPTIONS: { key: VendorThreshold; label: string }[] = [
  { key: 'zero', label: 'Exact gaps (0 vendors)' },
  { key: 5, label: '≤ 5 vendors' },
  { key: 10, label: '≤ 10 vendors' },
  { key: 20, label: '≤ 20 vendors' },
];
interface IdleVendorRow { locationName: string; serviceName: string; vendorCount: number }
interface IdleLocationSummary { locationName: string; total: number; serviceCount: number; services: { serviceName: string; vendorCount: number }[] }
interface ManagerRow {
  id: string; name: string; email: string;
  inquiries: { total: number; actioned: number; coveragePct: number | null };
  bookings: { total: number; actioned: number; coveragePct: number | null };
  vendors: { created: number; approved: number };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Exports always fetch every matching row (not just the current page) — an
// export that silently only covered the visible 20 would be a trap for
// whoever opens the file expecting a complete list. High enough to clear the
// same MAX_ROWS_PER_TABLE cap the backend list endpoints already use.
const EXPORT_LIMIT = 5000;

function downloadWorkbook(sheets: { name: string; rows: Record<string, any>[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'No data': 'No data in this period' }]);
    // Excel sheet names cap at 31 chars and can't hold /\?*[]:
    const safeName = name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet';
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }
  XLSX.writeFile(wb, filename);
}

function exportFilenameDate() {
  return new Date().toISOString().split('T')[0];
}

// One row-shaper per exportable dataset — plain, human-labeled columns
// rather than the raw API field names, matching the convention already used
// by the fleet page's Excel export.
const rowsForTrackedItems = (items: TrackedItem[]) => items.map((i) => ({
  'Request #': i.requestNumber,
  'Customer': i.customerName,
  'Phone': i.customerPhone,
  'Service': i.serviceName,
  'Location': i.locationName,
  'Created At': formatDateTime(i.createdAt),
}));

const rowsForVendors = (items: VendorNeedingAction[]) => items.map((v) => ({
  'Business Name': v.businessName,
  'Owner': v.ownerName,
  'Phone': v.phone,
  'Email': v.email,
  'City': v.city || '—',
  'Status': v.status,
  'Days Stuck': v.daysSinceUpdate,
}));

const rowsForGaps = (items: CoverageGapGroup[]) => items.map((g) => ({
  'Location': g.locationName,
  'Service': g.serviceType,
  'No-Vendor Inquiries': g.count,
  'Sample Requests': g.requestNumbers.join(', '),
  'Last Occurred': formatDateTime(g.latest),
}));

const rowsForDemandCoverage = (items: DemandCoverageItem[]) => items.map((d) => ({
  'Location': d.locationName,
  'Service': d.serviceName,
  'Inquiries': d.inquiryCount,
  'Vendors Available': d.vendorCount,
}));

const rowsForIdleVendors = (items: IdleVendorRow[]) => items.map((r) => ({
  'Location': r.locationName,
  'Service': r.serviceName,
  'Approved Vendors': r.vendorCount,
}));

const rowsForManagers = (items: ManagerRow[]) => items.map((m) => ({
  'Manager': m.name,
  'Email': m.email,
  'Inquiries Total': m.inquiries.total,
  'Inquiries Actioned': m.inquiries.actioned,
  'Inquiries Coverage %': m.inquiries.coveragePct ?? '—',
  'Bookings Total': m.bookings.total,
  'Bookings Actioned': m.bookings.actioned,
  'Bookings Coverage %': m.bookings.coveragePct ?? '—',
  'Vendors Created': m.vendors.created,
  'Vendors Approved': m.vendors.approved,
}));

const rowsForPaymentFailures = (items: PaymentFailureItem[]) => items.map((p) => ({
  'Request #': p.requestNumber,
  'Customer': p.customerName,
  'Phone': p.customerPhone,
  'Service': p.serviceName,
  'Location': p.locationName || '—',
  'Amount (₹)': p.amount ?? '—',
  'Payment Method': p.paymentMethod || '—',
  'Failed At': formatDateTime(p.createdAt),
}));

const rowsForCronJobs = (items: CronJobHealth[]) => items.map((j) => ({
  'Job': humanizeSourceName(j.sourceName),
  'Status': j.lastStatus ?? 'NEVER_RUN',
  'Last Run': j.lastRunAt ? formatDateTime(j.lastRunAt) : '—',
  'Last Duration (s)': j.lastDurationMs != null ? (j.lastDurationMs / 1000).toFixed(1) : '—',
  'Runs (7d)': j.runsLast7d,
  'Failures (7d)': j.failuresLast7d,
  'Last Message': j.lastMessage || '—',
}));

const rowsForNotifications = (items: NotificationHealth[]) => items.map((n) => ({
  'Source': humanizeSourceName(n.sourceName),
  'Success (7d)': n.successLast7d,
  'Failure (7d)': n.failureLast7d,
}));

// Full (non-paginated) fetchers for export — same endpoints the tabs use,
// just with EXPORT_LIMIT instead of PAGE_LIMIT and no page number.
async function fetchAllInquiries(filter: DatePreset, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/inquiries?filter=${filter}${range}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as TrackedItem[];
}
async function fetchAllBookings(filter: DatePreset, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/bookings?filter=${filter}${range}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as TrackedItem[];
}
async function fetchAllVendorsNeedingAction(q: string) {
  const res = await fetch(`/api/admin/operations/vendors?page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as VendorNeedingAction[];
}
async function fetchAllGaps(filter: DatePreset, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/coverage-gaps?filter=${filter}${range}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as CoverageGapGroup[];
}
async function fetchAllDemandCoverage(filter: DatePreset, maxVendors: number, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/demand-coverage?filter=${filter}${range}&maxVendors=${maxVendors}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as DemandCoverageItem[];
}
async function fetchAllIdleVendors(filter: DatePreset, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/idle-vendors?filter=${filter}${range}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as IdleVendorRow[];
}
async function fetchAllPaymentFailures(filter: DatePreset, q: string, range = '') {
  const res = await fetch(`/api/admin/operations/payment-failures?filter=${filter}${range}&page=1&limit=${EXPORT_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  const data = await res.json();
  return (data.items || []) as PaymentFailureItem[];
}
async function fetchManagers(filter: DatePreset, range = '') {
  const res = await fetch(`/api/admin/managers/performance?filter=${filter}${range}`);
  const data = await res.json();
  return (data.managers || []) as ManagerRow[];
}
async function fetchSystemHealth() {
  const res = await fetch('/api/admin/operations/system-health');
  const data = await res.json();
  return { cronJobs: (data.cronJobs || []) as CronJobHealth[], notifications: (data.notifications || []) as NotificationHealth[] };
}

// Coverage Gaps and Idle Vendors silently widen a too-narrow date selection
// (Today/Yesterday have almost no data to show a meaningful "top locations"
// ranking) — this makes that substitution visible instead of just showing
// numbers that don't match the selected filter pill above.
function PeriodNote({ selected, effective }: { selected: DatePreset; effective: DatePreset }) {
  if (selected === effective) return null;
  const label = DATE_PRESETS.find((p) => p.key === effective)?.label || effective;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
      <Clock className="w-3 h-3" /> Showing {label} — too little data day-to-day
    </span>
  );
}

function coverageColor(pct: number | null) {
  if (pct === null) return 'text-slate-400 bg-slate-100';
  if (pct >= 80) return 'text-emerald-700 bg-emerald-50';
  if (pct >= 40) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

const VENDOR_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  DOCUMENTS_PENDING: 'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
};

const MANAGER_PAGE_LIMIT = 15;

export default function AdminOperationsTrackerPage() {
  const [filter, setFilter] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Only appended for the custom preset, and only once both ends are set —
  // a half-filled range would silently widen to "everything after From".
  const rangeQS =
    filter === 'custom' && customFrom && customTo
      ? `&dateFrom=${customFrom}&dateTo=${customTo}`
      : '';
  const [tab, setTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<Paginated<TrackedItem> | null>(null);
  const [inquiriesPage, setInquiriesPage] = useState(1);

  const [bookings, setBookings] = useState<Paginated<TrackedItem> | null>(null);
  const [bookingsPage, setBookingsPage] = useState(1);

  const [vendors, setVendors] = useState<Paginated<VendorNeedingAction> | null>(null);
  const [vendorsPage, setVendorsPage] = useState(1);

  // The gaps API's `total` is the raw count of no-vendor inquiry EVENTS, not
  // the number of grouped rows the list/pagination actually shows — that's
  // `groupsTotal`. Keeping both distinct avoids the pagination bar quoting a
  // "47 total" that doesn't match a 2-row list.
  const [gaps, setGaps] = useState<Paginated<CoverageGapGroup> & { groupsTotal: number } | null>(null);
  const [gapsPage, setGapsPage] = useState(1);
  const [vendorThreshold, setVendorThreshold] = useState<VendorThreshold>('zero');
  const [demandCoverage, setDemandCoverage] = useState<Paginated<DemandCoverageItem> | null>(null);
  const [demandCoveragePage, setDemandCoveragePage] = useState(1);

  const [idle, setIdle] = useState<Paginated<IdleVendorRow> & { byLocation: IdleLocationSummary[] } | null>(null);
  const [idlePage, setIdlePage] = useState(1);

  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [managersPage, setManagersPage] = useState(1);

  const [paymentFailures, setPaymentFailures] = useState<Paginated<PaymentFailureItem> | null>(null);
  const [paymentFailuresPage, setPaymentFailuresPage] = useState(1);

  // Cron/notification health is a fixed last-7-days window server-side (see
  // getSystemHealth) — not paginated and not affected by the date filter above.
  const [systemHealth, setSystemHealth] = useState<{ cronJobs: CronJobHealth[]; notifications: NotificationHealth[] } | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // A new filter or search invalidates whatever page each tab was sitting
  // on — reset all of them back to page 1 rather than showing an
  // out-of-range page against the new result set.
  useEffect(() => {
    setInquiriesPage(1); setBookingsPage(1); setVendorsPage(1);
    setGapsPage(1); setIdlePage(1); setManagersPage(1); setPaymentFailuresPage(1); setDemandCoveragePage(1);
  }, [filter, debouncedSearch]);

  // Switching the vendor-count threshold only needs to reset its own page —
  // the tab-data effect below re-fetches because vendorThreshold is in its
  // dependency array.
  useEffect(() => { setDemandCoveragePage(1); }, [vendorThreshold]);

  const loadSummary = useCallback(async (preset: DatePreset) => {
    try {
      const res = await fetch(`/api/admin/operations/summary?filter=${preset}${rangeQS}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load summary');
      setSummary(data);
      setLastUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load summary');
    }
    // rangeQS must be a dependency — with an empty array this closure keeps
    // the value it had on first render and the custom dates never ship.
  }, [rangeQS]);

  // Fetches only the ACTIVE tab's data — the point of lazy-per-tab loading is
  // that switching to "Idle Vendors" doesn't also re-run the (much heavier)
  // admin-wide inquiry scan that "Untouched Inquiries" needs, and vice versa.
  const loadTabData = useCallback(async (
    activeTab: TabKey, preset: DatePreset, q: string,
    page: { inquiries: number; bookings: number; vendors: number; gaps: number; idle: number; managers: number; paymentFailures: number; demandCoverage: number },
    vendorThresholdParam: VendorThreshold,
  ) => {
    setTabLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        // Light (limit=8) pulls of every section so the Overview tab can show
        // a mini chart from each area without a presenter having to click
        // through every tab in a meeting — full-detail data still only loads
        // when that section's own tab is opened.
        const gapsFilter = preset === 'today' || preset === 'yesterday' ? 'thisWeek' : preset;
        const idleFilter = preset === 'today' || preset === 'yesterday' || preset === 'thisWeek' ? 'thisMonth' : preset;
        const [gapsRes, idleRes, managersRes, paymentsRes] = await Promise.all([
          fetch(`/api/admin/operations/coverage-gaps?filter=${gapsFilter}${rangeQS}&page=1&limit=8`),
          fetch(`/api/admin/operations/idle-vendors?filter=${idleFilter}${rangeQS}&page=1&limit=8`),
          fetch(`/api/admin/managers/performance?filter=${preset}${rangeQS}`),
          fetch(`/api/admin/operations/payment-failures?filter=${preset}${rangeQS}&page=1&limit=8`),
        ]);
        const [gapsData, idleData, managersData, paymentsData] = await Promise.all([gapsRes.json(), idleRes.json(), managersRes.json(), paymentsRes.json()]);
        if (!gapsRes.ok || gapsData.error) throw new Error(gapsData?.error || 'Failed to load coverage gaps');
        if (!idleRes.ok || idleData.error) throw new Error(idleData?.error || 'Failed to load idle vendor coverage');
        if (!managersRes.ok || managersData.error) throw new Error(managersData?.error || 'Failed to load manager performance');
        if (!paymentsRes.ok || paymentsData.error) throw new Error(paymentsData?.error || 'Failed to load payment failures');
        setGaps(gapsData);
        setIdle(idleData);
        setManagers(managersData.managers || []);
        setPaymentFailures(paymentsData);
      } else if (activeTab === 'inquiries') {
        const res = await fetch(`/api/admin/operations/inquiries?filter=${preset}${rangeQS}&page=${page.inquiries}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load inquiries');
        setInquiries(data);
      } else if (activeTab === 'bookings') {
        const res = await fetch(`/api/admin/operations/bookings?filter=${preset}${rangeQS}&page=${page.bookings}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load bookings');
        setBookings(data);
      } else if (activeTab === 'vendors') {
        const res = await fetch(`/api/admin/operations/vendors?page=${page.vendors}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load vendors');
        setVendors(data);
      } else if (activeTab === 'gaps') {
        const gapsFilter = preset === 'today' || preset === 'yesterday' ? 'thisWeek' : preset;
        if (vendorThresholdParam === 'zero') {
          const res = await fetch(`/api/admin/operations/coverage-gaps?filter=${gapsFilter}${rangeQS}&page=${page.gaps}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load coverage gaps');
          setGaps(data);
        } else {
          const res = await fetch(`/api/admin/operations/demand-coverage?filter=${gapsFilter}${rangeQS}&maxVendors=${vendorThresholdParam}&page=${page.demandCoverage}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load demand coverage');
          setDemandCoverage(data);
        }
      } else if (activeTab === 'idle') {
        const idleFilter = preset === 'today' || preset === 'yesterday' || preset === 'thisWeek' ? 'thisMonth' : preset;
        const res = await fetch(`/api/admin/operations/idle-vendors?filter=${idleFilter}${rangeQS}&page=${page.idle}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load idle vendor coverage');
        setIdle(data);
      } else if (activeTab === 'managers') {
        const res = await fetch(`/api/admin/managers/performance?filter=${preset}${rangeQS}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data?.error || 'Failed to load manager performance');
        setManagers(data.managers || []);
      } else if (activeTab === 'systemHealth') {
        const [healthRes, paymentsRes] = await Promise.all([
          fetch('/api/admin/operations/system-health'),
          fetch(`/api/admin/operations/payment-failures?filter=${preset}${rangeQS}&page=${page.paymentFailures}&limit=${PAGE_LIMIT}${q ? `&search=${encodeURIComponent(q)}` : ''}`),
        ]);
        const [healthData, paymentsData] = await Promise.all([healthRes.json(), paymentsRes.json()]);
        if (!healthRes.ok || healthData.error) throw new Error(healthData?.error || 'Failed to load system health');
        if (!paymentsRes.ok || paymentsData.error) throw new Error(paymentsData?.error || 'Failed to load payment failures');
        setSystemHealth(healthData);
        setPaymentFailures(paymentsData);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setTabLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeQS]);

  useEffect(() => {
    (async () => { setSummaryLoading(true); await loadSummary(filter); setSummaryLoading(false); })();
    // rangeQS is a dependency too: picking a custom From/To changes what
    // should be on screen without changing `filter`.
  }, [filter, rangeQS, loadSummary]);

  useEffect(() => {
    loadTabData(tab, filter, debouncedSearch, {
      inquiries: inquiriesPage, bookings: bookingsPage, vendors: vendorsPage, gaps: gapsPage, idle: idlePage, managers: managersPage, paymentFailures: paymentFailuresPage, demandCoverage: demandCoveragePage,
    }, vendorThreshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filter, rangeQS, debouncedSearch, inquiriesPage, bookingsPage, vendorsPage, gapsPage, idlePage, paymentFailuresPage, demandCoveragePage, vendorThreshold, loadTabData]);

  // Same substitution loadTabData applies before fetching — kept here too so
  // the render side (chart titles, PeriodNote) can show what period the data
  // on screen actually reflects.
  const gapsFilter: DatePreset = filter === 'today' || filter === 'yesterday' ? 'thisWeek' : filter;
  const idleFilter: DatePreset = filter === 'today' || filter === 'yesterday' || filter === 'thisWeek' ? 'thisMonth' : filter;

  const handleRefresh = () => {
    loadSummary(filter);
    loadTabData(tab, filter, debouncedSearch, {
      inquiries: inquiriesPage, bookings: bookingsPage, vendors: vendorsPage, gaps: gapsPage, idle: idlePage, managers: managersPage, paymentFailures: paymentFailuresPage, demandCoverage: demandCoveragePage,
    }, vendorThreshold);
  };

  const [exportingTab, setExportingTab] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  // Exports the ACTIVE tab's full dataset (every matching row, not just the
  // current page) as a single .xlsx — same filters/search/vendor-threshold
  // as what's on screen, so the file matches what the admin is looking at.
  const handleExportTab = async () => {
    setExportingTab(true);
    setError(null);
    try {
      const q = debouncedSearch;
      const dateStamp = exportFilenameDate();
      switch (tab) {
        case 'inquiries': {
          const items = await fetchAllInquiries(filter, q, rangeQS);
          downloadWorkbook([{ name: 'Untouched Inquiries', rows: rowsForTrackedItems(items) }], `untouched_inquiries_${filter}_${dateStamp}.xlsx`);
          break;
        }
        case 'bookings': {
          const items = await fetchAllBookings(filter, q, rangeQS);
          downloadWorkbook([{ name: 'Untouched Bookings', rows: rowsForTrackedItems(items) }], `untouched_bookings_${filter}_${dateStamp}.xlsx`);
          break;
        }
        case 'managers': {
          const items = await fetchManagers(filter, rangeQS);
          downloadWorkbook([{ name: 'Manager Performance', rows: rowsForManagers(items) }], `manager_performance_${filter}_${dateStamp}.xlsx`);
          break;
        }
        case 'vendors': {
          const items = await fetchAllVendorsNeedingAction(q);
          downloadWorkbook([{ name: 'Vendors Needing Action', rows: rowsForVendors(items) }], `vendors_needing_action_${dateStamp}.xlsx`);
          break;
        }
        case 'gaps': {
          if (vendorThreshold === 'zero') {
            const items = await fetchAllGaps(gapsFilter, q, rangeQS);
            downloadWorkbook([{ name: 'Coverage Gaps', rows: rowsForGaps(items) }], `coverage_gaps_${gapsFilter}_${dateStamp}.xlsx`);
          } else {
            const items = await fetchAllDemandCoverage(gapsFilter, vendorThreshold, q, rangeQS);
            downloadWorkbook([{ name: `Demand (le ${vendorThreshold} vendors)`, rows: rowsForDemandCoverage(items) }], `underserved_demand_le${vendorThreshold}v_${gapsFilter}_${dateStamp}.xlsx`);
          }
          break;
        }
        case 'idle': {
          const items = await fetchAllIdleVendors(idleFilter, q, rangeQS);
          downloadWorkbook([{ name: 'Idle Vendors', rows: rowsForIdleVendors(items) }], `idle_vendors_${idleFilter}_${dateStamp}.xlsx`);
          break;
        }
        case 'systemHealth': {
          const [health, failures] = await Promise.all([fetchSystemHealth(), fetchAllPaymentFailures(filter, q, rangeQS)]);
          downloadWorkbook([
            { name: 'Cron Jobs', rows: rowsForCronJobs(health.cronJobs) },
            { name: 'Notification Sends', rows: rowsForNotifications(health.notifications) },
            { name: 'Payment Failures', rows: rowsForPaymentFailures(failures) },
          ], `system_health_${filter}_${dateStamp}.xlsx`);
          break;
        }
        default:
          break;
      }
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setExportingTab(false);
    }
  };

  // One workbook, one sheet per section — everything the tracker covers for
  // the currently selected date filter, fetched in parallel.
  const handleExportAll = async () => {
    setExportingAll(true);
    setError(null);
    try {
      const q = debouncedSearch;
      const dateStamp = exportFilenameDate();
      const [inquiriesAll, bookingsAll, vendorsAll, gapsAll, idleAll, managersAll, health, failuresAll] = await Promise.all([
        fetchAllInquiries(filter, q, rangeQS),
        fetchAllBookings(filter, q, rangeQS),
        fetchAllVendorsNeedingAction(q),
        fetchAllGaps(gapsFilter, q, rangeQS),
        fetchAllIdleVendors(idleFilter, q, rangeQS),
        fetchManagers(filter, rangeQS),
        fetchSystemHealth(),
        fetchAllPaymentFailures(filter, q, rangeQS),
      ]);
      downloadWorkbook([
        { name: 'Untouched Inquiries', rows: rowsForTrackedItems(inquiriesAll) },
        { name: 'Untouched Bookings', rows: rowsForTrackedItems(bookingsAll) },
        { name: 'Vendors Needing Action', rows: rowsForVendors(vendorsAll) },
        { name: 'Coverage Gaps', rows: rowsForGaps(gapsAll) },
        { name: 'Idle Vendors', rows: rowsForIdleVendors(idleAll) },
        { name: 'Manager Performance', rows: rowsForManagers(managersAll) },
        { name: 'Cron Jobs', rows: rowsForCronJobs(health.cronJobs) },
        { name: 'Notification Sends', rows: rowsForNotifications(health.notifications) },
        { name: 'Payment Failures', rows: rowsForPaymentFailures(failuresAll) },
      ], `operations_tracker_all_${filter}_${dateStamp}.xlsx`);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setExportingAll(false);
    }
  };

  // Inline "Called"/"Note" actions log the action but don't refetch the whole
  // list — just drop the row locally (it's no longer "untouched") and nudge
  // the KPI tiles so the numbers stay right without a round-trip. If that
  // local removal empties the page (e.g. the last row on page 2), silently
  // refetch that same page number in the background — paginate() on the
  // server clamps an out-of-range page down to the new last page on its own,
  // so this self-corrects instead of leaving a blank page with rows waiting
  // on the previous one.
  const handleInquiryActioned = (id: string) => {
    let emptied = false;
    setInquiries((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.id !== id);
      const total = Math.max(0, prev.total - 1);
      emptied = items.length === 0 && total > 0;
      return { ...prev, items, total };
    });
    setSummary((prev) => prev ? { ...prev, inquiries: { ...prev.inquiries, untouched: Math.max(0, prev.inquiries.untouched - 1), actioned: prev.inquiries.actioned + 1 } } : prev);
    if (emptied) {
      fetch(`/api/admin/operations/inquiries?filter=${filter}${rangeQS}&page=${inquiriesPage}&limit=${PAGE_LIMIT}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`)
        .then((r) => r.json()).then((data) => { if (!data.error) setInquiries(data); }).catch(() => {});
    }
  };

  const handleBookingActioned = (id: string) => {
    let emptied = false;
    setBookings((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.id !== id);
      const total = Math.max(0, prev.total - 1);
      emptied = items.length === 0 && total > 0;
      return { ...prev, items, total };
    });
    setSummary((prev) => prev ? { ...prev, bookings: { ...prev.bookings, untouched: Math.max(0, prev.bookings.untouched - 1), actioned: prev.bookings.actioned + 1 } } : prev);
    if (emptied) {
      fetch(`/api/admin/operations/bookings?filter=${filter}${rangeQS}&page=${bookingsPage}&limit=${PAGE_LIMIT}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`)
        .then((r) => r.json()).then((data) => { if (!data.error) setBookings(data); }).catch(() => {});
    }
  };

  const handleVendorActioned = (id: string) => {
    let emptied = false;
    setVendors((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((v) => v.id !== id);
      const total = Math.max(0, prev.total - 1);
      emptied = items.length === 0 && total > 0;
      return { ...prev, items, total };
    });
    setSummary((prev) => prev ? { ...prev, vendorsNeedingAction: Math.max(0, prev.vendorsNeedingAction - 1) } : prev);
    if (emptied) {
      fetch(`/api/admin/operations/vendors?page=${vendorsPage}&limit=${PAGE_LIMIT}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`)
        .then((r) => r.json()).then((data) => { if (!data.error) setVendors(data); }).catch(() => {});
    }
  };

  const managerTotalPages = Math.max(1, Math.ceil(managers.length / MANAGER_PAGE_LIMIT));
  const pagedManagers = managers.slice((managersPage - 1) * MANAGER_PAGE_LIMIT, managersPage * MANAGER_PAGE_LIMIT);

  const overviewChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Inquiries', Total: summary.inquiries.total, Actioned: summary.inquiries.actioned },
      { name: 'Bookings', Total: summary.bookings.total, Actioned: summary.bookings.actioned },
    ];
  }, [summary]);

  // Every manager, not just the current table page — the list is small
  // enough that a fuller comparison is more useful than a chart that
  // reshuffles as someone pages through the table below it.
  const managerChartData = useMemo(() => managers.map((m) => ({
    name: m.name.length > 14 ? `${m.name.slice(0, 13)}…` : m.name,
    Inquiries: m.inquiries.coveragePct ?? 0,
    Bookings: m.bookings.coveragePct ?? 0,
  })), [managers]);

  const gapsChartData = useMemo(() => (gaps?.items || []).slice(0, 8).map((g) => ({
    name: `${g.locationName} · ${g.serviceType}`,
    count: g.count,
  })), [gaps]);

  const demandCoverageChartData = useMemo(() => (demandCoverage?.items || []).slice(0, 8).map((d) => ({
    name: `${d.locationName} · ${d.serviceName}`,
    count: d.inquiryCount,
    vendorCount: d.vendorCount,
  })), [demandCoverage]);

  // Rolled up per location (not per location+service row) — the row-level
  // list is almost always dominated by ties (a location's services tend to
  // share the same small approved-vendor count), which made the chart look
  // flat. Summing per location gives real variation across bars.
  const idleChartData = useMemo(() => (idle?.byLocation || []).map((loc) => ({
    name: loc.locationName,
    vendorCount: loc.total,
    serviceCount: loc.serviceCount,
  })), [idle]);

  // Grouped from this page's own loaded rows (not a separate query) — good
  // enough for "which service is failing most" at a glance; the full
  // breakdown across every failure is what the paginated list below is for.
  const paymentFailuresChartData = useMemo(() => {
    const byService = new Map<string, number>();
    for (const item of paymentFailures?.items || []) {
      byService.set(item.serviceName, (byService.get(item.serviceName) || 0) + 1);
    }
    return [...byService.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [paymentFailures]);

  // ── Overview "mission control" mini-charts — same data each tab already
  // loads, just the 5 that most need attention rather than the full top-8/
  // full list, so a meeting can see every area at a glance on one screen. ──
  const gapsChartDataMini = useMemo(() => gapsChartData.slice(0, 5), [gapsChartData]);
  const idleChartDataMini = useMemo(() => idleChartData.slice(0, 5), [idleChartData]);
  const paymentFailuresChartDataMini = useMemo(() => paymentFailuresChartData.slice(0, 5), [paymentFailuresChartData]);

  // Worst coverage first — the point of an "at a glance" card is surfacing
  // who needs attention, not who's already doing well.
  const managerAttentionChartData = useMemo(() => {
    return [...managers]
      .map((m) => ({
        name: m.name.length > 14 ? `${m.name.slice(0, 13)}…` : m.name,
        Inquiries: m.inquiries.coveragePct ?? 0,
        Bookings: m.bookings.coveragePct ?? 0,
        avg: ((m.inquiries.coveragePct ?? 0) + (m.bookings.coveragePct ?? 0)) / 2,
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);
  }, [managers]);

  if (summaryLoading) {
    return (
      <div className="min-h-full flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operations Tracker</h1>
            <p className="text-sm text-slate-500">Everything that needs attention across inquiries, bookings, vendors and managers — in one place.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tab !== 'overview' && (
            <button
              onClick={handleExportTab}
              disabled={exportingTab}
              title="Export this tab's full data (every matching row, not just this page)"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50 transition"
            >
              {exportingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export {TABS.find((t) => t.key === tab)?.label}
            </button>
          )}
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            title="Export every section as one Excel file, one sheet per section"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50 transition"
          >
            {exportingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export All
          </button>
          <button
            onClick={handleRefresh}
            disabled={tabLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${tabLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="flex items-center gap-2">
          <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo || new Date().toISOString().split('T')[0]}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          {(!customFrom || !customTo) && (
            <span className="shrink-0 whitespace-nowrap text-xs font-medium text-amber-600">
              Pick both dates
            </span>
          )}
        </div>
      )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Overview KPI tiles — always visible, click jumps to that tab */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
          <button onClick={() => setTab('inquiries')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-red-200 transition">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-2"><Inbox className="w-4 h-4 text-red-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.inquiries.untouched}</p>
            <p className="text-xs text-slate-500">Untouched Inquiries</p>
          </button>
          <button onClick={() => setTab('bookings')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mb-2"><PackageX className="w-4 h-4 text-orange-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.bookings.untouched}</p>
            <p className="text-xs text-slate-500">Untouched Bookings</p>
          </button>
          <button onClick={() => setTab('vendors')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2"><Store className="w-4 h-4 text-amber-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.vendorsNeedingAction}</p>
            <p className="text-xs text-slate-500">Vendors Needing Action</p>
          </button>
          <button onClick={() => setTab('gaps')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center mb-2"><TrendingDown className="w-4 h-4 text-rose-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.coverageGaps.locations}</p>
            <p className="text-xs text-slate-500">Locations w/ Coverage Gaps</p>
          </button>
          <button onClick={() => setTab('idle')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-2"><UserX className="w-4 h-4 text-slate-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.idleVendorCoverage}</p>
            <p className="text-xs text-slate-500">Idle Vendor Coverage</p>
          </button>
          <button onClick={() => setTab('managers')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-emerald-600" /></div>
            <p className="text-xl font-bold text-slate-900">{managers.length || '—'}</p>
            <p className="text-xs text-slate-500">Managers Tracked</p>
          </button>
          <button onClick={() => setTab('systemHealth')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-red-200 transition">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-2"><CreditCard className="w-4 h-4 text-red-600" /></div>
            <p className="text-xl font-bold text-slate-900">{summary.paymentFailures}</p>
            <p className="text-xs text-slate-500">Payment Failures</p>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-100 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition ${
                  active ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}

          {(tab === 'inquiries' || tab === 'bookings' || tab === 'vendors' || tab === 'gaps' || tab === 'idle' || tab === 'systemHealth') && (
            <div className="relative ml-auto mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or city..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-56"
              />
            </div>
          )}
        </div>

        {tabLoading && tab !== 'overview' && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        )}

        {!tabLoading && (
          <>
            {/* Overview — the "meeting" view: every section's headline number
                and top-5 chart in one screen, so a presenter doesn't have to
                click through tabs live. Each card links to its full tab. */}
            {tab === 'overview' && summary && (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Inquiries ({DATE_PRESETS.find((p) => p.key === filter)?.label})</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.inquiries.actioned} <span className="text-base text-slate-400 font-medium">/ {summary.inquiries.total}</span></p>
                    <p className="text-xs text-red-600 font-medium mt-1">{summary.inquiries.untouched} still untouched</p>
                    <div className="mt-2">
                      <TrendChip current={summary.inquiries.total} previous={summary.inquiries.previousTotal} goodDirection="up" periodLabel={PREVIOUS_PERIOD_LABEL[filter]} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Bookings ({DATE_PRESETS.find((p) => p.key === filter)?.label})</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.bookings.actioned} <span className="text-base text-slate-400 font-medium">/ {summary.bookings.total}</span></p>
                    <p className="text-xs text-orange-600 font-medium mt-1">{summary.bookings.untouched} still untouched</p>
                    <div className="mt-2">
                      <TrendChip current={summary.bookings.total} previous={summary.bookings.previousTotal} goodDirection="up" periodLabel={PREVIOUS_PERIOD_LABEL[filter]} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Payment Failures ({DATE_PRESETS.find((p) => p.key === filter)?.label})</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.paymentFailures}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">failed payment attempts</p>
                    <div className="mt-2">
                      <TrendChip current={summary.paymentFailures} previous={summary.paymentFailuresPrevious} goodDirection="down" periodLabel={PREVIOUS_PERIOD_LABEL[filter]} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Total vs Actioned ({DATE_PRESETS.find((p) => p.key === filter)?.label})</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} vertical={false} />
                        <XAxis dataKey="name" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Total" fill={CHART_COLOR.neutral} radius={[6, 6, 0, 0]} maxBarSize={64} />
                        <Bar dataKey="Actioned" fill={CHART_COLOR.statusGood} radius={[6, 6, 0, 0]} maxBarSize={64} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Where Attention Is Needed</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <MiniChartCard title="Manager Coverage (lowest first)" onViewAll={() => setTab('managers')} empty={managerAttentionChartData.length === 0} emptyText="No manager data for this period.">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={managerAttentionChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} vertical={false} />
                            <XAxis dataKey="name" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} formatter={(v: any) => [`${v}%`, undefined]} />
                            <Bar dataKey="Inquiries" fill={CHART_COLOR.categorical1} radius={[4, 4, 0, 0]} maxBarSize={24} />
                            <Bar dataKey="Bookings" fill={CHART_COLOR.categorical2} radius={[4, 4, 0, 0]} maxBarSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </MiniChartCard>

                    <MiniChartCard title="Top Coverage Gaps" meta={<PeriodNote selected={filter} effective={gapsFilter} />} onViewAll={() => setTab('gaps')} empty={gapsChartDataMini.length === 0} emptyText="No coverage gaps in this period.">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gapsChartDataMini} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                            <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                            <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={10} tickLine={false} axisLine={false} width={130} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                            <Bar dataKey="count" name="No-vendor inquiries" fill={CHART_COLOR.critical} radius={[0, 4, 4, 0]} maxBarSize={16}>
                              <LabelList dataKey="count" position="right" fill={CHART_COLOR.axis} fontSize={11} fontWeight={600} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </MiniChartCard>

                    <MiniChartCard title="Top Idle Vendor Coverage" meta={<PeriodNote selected={filter} effective={idleFilter} />} onViewAll={() => setTab('idle')} empty={idleChartDataMini.length === 0} emptyText="No idle vendor coverage in this period.">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={idleChartDataMini} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                            <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                            <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={10} tickLine={false} axisLine={false} width={130} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                            <Bar dataKey="vendorCount" name="Approved vendors" fill={CHART_COLOR.warning} radius={[0, 4, 4, 0]} maxBarSize={16}>
                              <LabelList dataKey="vendorCount" position="right" fill={CHART_COLOR.axis} fontSize={11} fontWeight={600} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </MiniChartCard>

                    <MiniChartCard title="Payment Failures by Service" onViewAll={() => setTab('systemHealth')} empty={paymentFailuresChartDataMini.length === 0} emptyText="No failed payments in this period.">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={paymentFailuresChartDataMini} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                            <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                            <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={10} tickLine={false} axisLine={false} width={130} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                            <Bar dataKey="count" name="Failed payments" fill={CHART_COLOR.critical} radius={[0, 4, 4, 0]} maxBarSize={16}>
                              <LabelList dataKey="count" position="right" fill={CHART_COLOR.axis} fontSize={11} fontWeight={600} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </MiniChartCard>
                  </div>
                </div>

                {lastUpdatedAt && (
                  <p className="text-xs text-slate-400 text-center">Last updated {lastUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — click Refresh above for the latest.</p>
                )}
              </div>
            )}

            {/* Untouched Inquiries */}
            {tab === 'inquiries' && (
              !inquiries || inquiries.items.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="Every inquiry in this period has been actioned." good />
              ) : (
                <>
                  <RowList items={inquiries.items} recordType="INQUIRY" onActioned={handleInquiryActioned} />
                  <PaginationBar page={inquiries.page} totalPages={inquiries.totalPages} total={inquiries.total} onChange={setInquiriesPage} />
                </>
              )
            )}

            {/* Untouched Bookings */}
            {tab === 'bookings' && (
              !bookings || bookings.items.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="Every booking in this period has been actioned." good />
              ) : (
                <>
                  <RowList items={bookings.items} recordType="BOOKING" onActioned={handleBookingActioned} />
                  <PaginationBar page={bookings.page} totalPages={bookings.totalPages} total={bookings.total} onChange={setBookingsPage} />
                </>
              )
            )}

            {/* Manager Performance */}
            {tab === 'managers' && (
              managers.length === 0 ? (
                <EmptyState icon={Users} text="No managers found." />
              ) : (
                <>
                  <div className="p-5 border-b border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Coverage % by Manager</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={managerChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} vertical={false} />
                          <XAxis dataKey="name" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                          <YAxis stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                          <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} formatter={(v: any) => [`${v}%`, undefined]} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Inquiries" fill={CHART_COLOR.categorical1} radius={[6, 6, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="Bookings" fill={CHART_COLOR.categorical2} radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          <th className="px-4 py-3">Manager</th>
                          <th className="px-4 py-3">Inquiries</th>
                          <th className="px-4 py-3">Bookings</th>
                          <th className="px-4 py-3">Vendors Created</th>
                          <th className="px-4 py-3">Vendors Approved</th>
                          <th className="px-4 py-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pagedManagers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{m.name}</p>
                              <p className="text-xs text-slate-400">{m.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${coverageColor(m.inquiries.coveragePct)}`}>
                                {m.inquiries.actioned}/{m.inquiries.total} {m.inquiries.coveragePct !== null ? `(${m.inquiries.coveragePct}%)` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${coverageColor(m.bookings.coveragePct)}`}>
                                {m.bookings.actioned}/{m.bookings.total} {m.bookings.coveragePct !== null ? `(${m.bookings.coveragePct}%)` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{m.vendors.created}</td>
                            <td className="px-4 py-3 text-slate-600">{m.vendors.approved}</td>
                            <td className="px-4 py-3 text-right">
                              <Link href={`/admin/settings/managers/performance/${m.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                                View <ChevronRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar page={managersPage} totalPages={managerTotalPages} total={managers.length} onChange={setManagersPage} />
                </>
              )
            )}

            {/* Vendors Needing Action */}
            {tab === 'vendors' && (
              !vendors || vendors.items.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="No vendors stuck without action." good />
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {vendors.items.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 p-4 flex-wrap hover:bg-slate-50/60 transition-colors"
                      >
                        <Link href={`/admin/vendors/${v.id}`} target="_blank" className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-sm truncate hover:underline">{v.businessName}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${VENDOR_STATUS_STYLE[v.status] || 'bg-slate-100 text-slate-500'}`}>
                              {v.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3" /> {v.phone} {v.city && <><MapPin className="w-3 h-3 ml-1.5" /> {v.city}</>}
                          </p>
                        </Link>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> {v.daysSinceUpdate}d stuck
                          </span>
                          <InlineActions
                            recordType="VENDOR"
                            recordId={v.id}
                            serviceType="vendor"
                            onDone={() => handleVendorActioned(v.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <PaginationBar page={vendors.page} totalPages={vendors.totalPages} total={vendors.total} onChange={setVendorsPage} />
                </>
              )
            )}

            {/* Coverage Gaps */}
            {tab === 'gaps' && (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400 mr-1">Vendor threshold:</span>
                  {VENDOR_THRESHOLD_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setVendorThreshold(opt.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        vendorThreshold === opt.key ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {vendorThreshold === 'zero' ? (
                  !gaps || gaps.items.length === 0 ? (
                    <EmptyState icon={CheckCircle2} text="No coverage gaps in this period — every inquiry had an eligible vendor." good />
                  ) : (
                    <>
                      {gaps.page === 1 && (
                        <div className="p-5 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Radar className="w-3.5 h-3.5" /> Top Locations by Gap Count</p>
                            <PeriodNote selected={filter} effective={gapsFilter} />
                          </div>
                          <p className="text-xs text-slate-500 mb-3">
                            <span className="font-bold text-rose-600">{gaps.total}</span> inquir{gaps.total === 1 ? 'y' : 'ies'} had zero eligible vendors, across <span className="font-bold text-slate-700">{gaps.groupsTotal}</span> location + service combo{gaps.groupsTotal === 1 ? '' : 's'}
                          </p>
                          <div style={{ height: Math.max(160, gapsChartData.length * 34) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={gapsChartData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                                <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                                <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} width={160} />
                                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                                <Bar dataKey="count" name="No-vendor inquiries" fill={CHART_COLOR.critical} radius={[0, 6, 6, 0]} maxBarSize={20}>
                                  <LabelList dataKey="count" position="right" fill={CHART_COLOR.axis} fontSize={12} fontWeight={600} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      <div className="divide-y divide-slate-50">
                        {gaps.items.map((g, i) => (
                          <div key={i} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {g.locationName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{g.serviceType} · {g.requestNumbers.join(', ')}{g.count > g.requestNumbers.length ? '…' : ''}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-rose-600">{g.count}</p>
                              <p className="text-[11px] text-slate-400">no vendor · last {formatDateTime(g.latest)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <PaginationBar page={gaps.page} totalPages={gaps.totalPages} total={gaps.groupsTotal} onChange={setGapsPage} />
                    </>
                  )
                ) : (
                  !demandCoverage || demandCoverage.items.length === 0 ? (
                    <EmptyState icon={CheckCircle2} text={`No demand sitting on ${vendorThreshold} or fewer vendors in this period.`} good />
                  ) : (
                    <>
                      {demandCoverage.page === 1 && (
                        <div className="p-5 border-b border-slate-100">
                          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Radar className="w-3.5 h-3.5" /> Top Underserved Locations (≤ {vendorThreshold} vendors)</p>
                            <PeriodNote selected={filter} effective={gapsFilter} />
                          </div>
                          <p className="text-xs text-slate-500 mb-3">
                            <span className="font-bold text-rose-600">{demandCoverage.total}</span> location + service combo{demandCoverage.total === 1 ? '' : 's'} with demand sitting on {vendorThreshold} or fewer vendors
                          </p>
                          <div style={{ height: Math.max(160, demandCoverageChartData.length * 34) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={demandCoverageChartData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                                <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                                <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} width={160} />
                                <RechartsTooltip
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }}
                                  labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                                  formatter={(value: any, _name: any, props: any) => [`${value} inquiries · ${props.payload.vendorCount} vendor${props.payload.vendorCount === 1 ? '' : 's'}`, undefined]}
                                />
                                <Bar dataKey="count" name="Inquiries" fill={CHART_COLOR.critical} radius={[0, 6, 6, 0]} maxBarSize={20}>
                                  <LabelList dataKey="count" position="right" fill={CHART_COLOR.axis} fontSize={12} fontWeight={600} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      <div className="divide-y divide-slate-50">
                        {demandCoverage.items.map((d, i) => (
                          <div key={i} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {d.locationName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{d.serviceName} · {d.inquiryCount} inquir{d.inquiryCount === 1 ? 'y' : 'ies'} this period</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${d.vendorCount === 0 ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50'}`}>
                                <Store className="w-3 h-3" /> {d.vendorCount} vendor{d.vendorCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <PaginationBar page={demandCoverage.page} totalPages={demandCoverage.totalPages} total={demandCoverage.total} onChange={setDemandCoveragePage} />
                    </>
                  )
                )}
              </>
            )}

            {/* Idle Vendors */}
            {tab === 'idle' && (
              !idle || idle.items.length === 0 ? (
                <EmptyState icon={CheckCircle2} text="No idle vendor coverage found — supply is being used everywhere." good />
              ) : (
                <>
                  {idle.page === 1 && (
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><UserX className="w-3.5 h-3.5" /> Top Locations by Idle Vendor Coverage</p>
                        <PeriodNote selected={filter} effective={idleFilter} />
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        <span className="font-bold text-amber-700">{idle.total}</span> location + service combo{idle.total === 1 ? '' : 's'} idle this period — approved vendor-slots summed per location below
                      </p>
                      <div style={{ height: Math.max(160, idleChartData.length * 34) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={idleChartData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                            <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                            <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} width={160} />
                            <RechartsTooltip
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }}
                              labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                              formatter={(value: any, _name: any, props: any) => [`${value} vendor-slots across ${props.payload.serviceCount} idle service${props.payload.serviceCount === 1 ? '' : 's'}`, undefined]}
                            />
                            <Bar dataKey="vendorCount" name="Approved vendors" fill={CHART_COLOR.warning} radius={[0, 6, 6, 0]} maxBarSize={20}>
                              <LabelList dataKey="vendorCount" position="right" fill={CHART_COLOR.axis} fontSize={12} fontWeight={600} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-slate-50">
                    {idle.items.map((row, i) => (
                      <div key={i} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {row.locationName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.serviceName} — vendors approved, but zero inquiries this period</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0">
                          <Store className="w-3 h-3" /> {row.vendorCount} vendor{row.vendorCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <PaginationBar page={idle.page} totalPages={idle.totalPages} total={idle.total} onChange={setIdlePage} />
                </>
              )
            )}

            {/* System Health */}
            {tab === 'systemHealth' && (
              <div className="divide-y divide-slate-50">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cron Jobs</p>
                    <p className="text-[11px] text-slate-400">Last 7 days — independent of the date filter above</p>
                  </div>
                  {!systemHealth || systemHealth.cronJobs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
                  ) : (
                    <div className="space-y-2">
                      {systemHealth.cronJobs.map((job) => {
                        const neverRun = job.lastStatus === null;
                        const failed = job.lastStatus === 'FAILURE';
                        const badge = neverRun
                          ? { icon: MinusCircle, classes: 'bg-slate-100 text-slate-500', label: 'Never run' }
                          : failed
                          ? { icon: XCircle, classes: 'bg-rose-50 text-rose-700', label: 'Failing' }
                          : { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700', label: 'Healthy' };
                        const BadgeIcon = badge.icon;
                        return (
                          <div key={job.sourceName} className="rounded-xl border border-slate-100 p-3.5 flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm">{humanizeSourceName(job.sourceName)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {job.lastRunAt ? `Last ran ${formatDateTime(job.lastRunAt)}` : 'No runs logged in the last 7 days'}
                                {job.lastDurationMs != null ? ` · ${(job.lastDurationMs / 1000).toFixed(1)}s` : ''}
                              </p>
                              {failed && job.lastMessage && (
                                <p className="text-xs text-rose-600 mt-1 max-w-md truncate" title={job.lastMessage}>{job.lastMessage}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <p className="text-xs text-slate-400">
                                {job.runsLast7d} run{job.runsLast7d === 1 ? '' : 's'}
                                {job.failuresLast7d > 0 && <span className="text-rose-600 font-semibold"> · {job.failuresLast7d} failed</span>}
                              </p>
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${badge.classes}`}>
                                <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Notification Sends</p>
                    <p className="text-[11px] text-slate-400">Last 7 days</p>
                  </div>
                  {!systemHealth || systemHealth.notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No notification sends logged in the last 7 days.</div>
                  ) : (
                    <div className="space-y-2">
                      {systemHealth.notifications.map((n) => {
                        const total = n.successLast7d + n.failureLast7d;
                        const failurePct = total > 0 ? Math.round((n.failureLast7d / total) * 100) : 0;
                        return (
                          <div key={n.sourceName} className="rounded-xl border border-slate-100 p-3.5 flex items-center justify-between gap-3 flex-wrap">
                            <p className="font-semibold text-slate-900 text-sm">{humanizeSourceName(n.sourceName)}</p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-emerald-600 font-semibold">{n.successLast7d} sent</span>
                              {n.failureLast7d > 0 ? (
                                <span className="text-rose-600 font-semibold">{n.failureLast7d} failed ({failurePct}%)</span>
                              ) : (
                                <span className="text-slate-400">0 failed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  {!paymentFailures || paymentFailures.items.length === 0 ? (
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Payment Failures</p>
                      <EmptyState icon={CheckCircle2} text="No failed payments in this period." good />
                    </div>
                  ) : (
                    <>
                      {paymentFailures.page === 1 && (
                        <div className="p-5 border-b border-slate-100">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Payment Failures by Service</p>
                          <div style={{ height: Math.max(160, paymentFailuresChartData.length * 34) }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={paymentFailuresChartData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLOR.grid} horizontal={false} />
                                <XAxis type="number" stroke={CHART_COLOR.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.max(max + 1, 1)]} />
                                <YAxis type="category" dataKey="name" stroke={CHART_COLOR.axis} fontSize={11} tickLine={false} axisLine={false} width={160} />
                                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }} />
                                <Bar dataKey="count" name="Failed payments" fill={CHART_COLOR.critical} radius={[0, 6, 6, 0]} maxBarSize={20}>
                                  <LabelList dataKey="count" position="right" fill={CHART_COLOR.axis} fontSize={12} fontWeight={600} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      <p className="px-5 pt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Failed Payments</p>
                      <div className="divide-y divide-slate-50">
                        {paymentFailures.items.map((p) => (
                          <div key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50/60 transition-colors">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{p.customerName}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3" /> {p.customerPhone}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{p.serviceName} · {p.locationName || '—'} · {p.requestNumber}{p.paymentMethod ? ` · ${p.paymentMethod}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <p className="text-sm font-bold text-rose-600">₹{p.amount?.toLocaleString('en-IN') ?? '—'}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateTime(p.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <PaginationBar page={paymentFailures.page} totalPages={paymentFailures.totalPages} total={paymentFailures.total} onChange={setPaymentFailuresPage} />
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MiniChartCard({ title, meta, onViewAll, empty, emptyText, children }: { title: string; meta?: ReactNode; onViewAll: () => void; empty: boolean; emptyText: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
        <button onClick={onViewAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0">View all →</button>
      </div>
      {meta && <div className="mb-2">{meta}</div>}
      {empty ? (
        <div className="h-40 flex items-center justify-center text-center text-xs text-slate-400 px-4">{emptyText}</div>
      ) : children}
    </div>
  );
}

function EmptyState({ icon: Icon, text, good }: { icon: any; text: string; good?: boolean }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Icon className={`w-9 h-9 mx-auto mb-2 ${good ? 'text-emerald-200' : 'text-slate-200'}`} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function RowList({ items, recordType, onActioned }: { items: TrackedItem[]; recordType: 'INQUIRY' | 'BOOKING'; onActioned: (id: string) => void }) {
  return (
    <div className="divide-y divide-slate-50">
      {items.map((item) => (
        <div key={item.id} className="p-4 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50/60 transition-colors">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{item.customerName}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3" /> {item.customerPhone}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{item.serviceName} · {item.locationName || '—'} · {item.requestNumber}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDateTime(item.createdAt)}
            </p>
            <InlineActions
              recordType={recordType}
              recordId={item.id}
              serviceType={item.serviceSlug}
              onDone={() => onActioned(item.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Quick "Mark Called" / "Add Note" buttons that log a manager_action_logs
// entry via /api/admin/operations/action — this is what flips a row from
// "untouched" to "actioned" without leaving the tracker.
function InlineActions({
  recordType, recordId, serviceType, onDone,
}: { recordType: 'INQUIRY' | 'BOOKING' | 'VENDOR'; recordId: string; serviceType: string; onDone: () => void }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<'called' | 'note' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logAction = async (actionType: 'CALLED' | 'NOTE_ADDED', noteText?: string) => {
    setSaving(actionType === 'CALLED' ? 'called' : 'note');
    setError(null);
    try {
      const res = await fetch('/api/admin/operations/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordType, recordId, serviceType, actionType, note: noteText }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data?.error || 'Failed to log action');
      onDone();
    } catch (e: any) {
      setError(e?.message || 'Failed to log action');
    } finally {
      setSaving(null);
    }
  };

  if (noteOpen) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick note..."
          autoFocus
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
        />
        <button
          onClick={() => note.trim() && logAction('NOTE_ADDED', note.trim())}
          disabled={!note.trim() || saving !== null}
          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition"
        >
          {saving === 'note' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
        </button>
        <button
          onClick={() => { setNoteOpen(false); setNote(''); setError(null); }}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition"
        >
          <X className="w-3 h-3" />
        </button>
        {error && <span className="text-[11px] text-rose-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => logAction('CALLED')}
        disabled={saving !== null}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-40 transition"
      >
        {saving === 'called' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneCall className="w-3 h-3" />} Called
      </button>
      <button
        onClick={() => setNoteOpen(true)}
        disabled={saving !== null}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition"
      >
        <StickyNote className="w-3 h-3" /> Note
      </button>
      {error && <span className="text-[11px] text-rose-600">{error}</span>}
    </div>
  );
}

function PaginationBar({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return (
    <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">{total} total</div>
  );

  // Up to 5 page numbers around the current one, with the first/last page
  // always pinned and an ellipsis bridging any gap — same pattern as the
  // vendors list pagination elsewhere in the admin panel.
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2">
      <span className="text-xs text-slate-400">Page {page} of {totalPages} · {total} total</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={page === 1}
          className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          «
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pageItems.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`e${idx}`} className="px-2 py-1.5 text-xs text-slate-400">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                page === item
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={page === totalPages}
          className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          »
        </button>
      </div>
    </div>
  );
}
