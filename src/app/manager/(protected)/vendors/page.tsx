'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import FilterMultiSelect from '@/components/manager/FilterMultiSelect';
import Pagination from '@/components/manager/Pagination';
import {
  Loader2, Search, Store, Phone, Mail, MapPin, Layers,
  ChevronRight, ChevronDown, RefreshCw, AlertCircle, CheckCircle, Clock,
  XCircle, FileText, Car, Star, TrendingUp, TrendingDown,
  Calendar, X, Tag, Plus, CalendarDays, MapPinPlus, Bell,
  Globe, Smartphone, Sparkles,
} from 'lucide-react';

type DatePreset = 'all' | 'last7Days' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: 'All Time',
  last7Days: '🆕 New (Last 7 Days)',
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  custom: 'Custom Range',
};

// Returns [from, to] as Date objects (local time, full-day bounds) for a preset.
// 'thisWeek' uses a Monday-start calendar week.
function getDateRange(preset: DatePreset, customFrom: string, customTo: string): [Date | null, Date | null] {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'last7Days': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return [startOfDay(weekAgo), endOfDay(now)];
    }
    case 'today':
      return [startOfDay(now), endOfDay(now)];
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return [startOfDay(y), endOfDay(y)];
    }
    case 'thisWeek': {
      const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      return [startOfDay(monday), endOfDay(now)];
    }
    case 'thisMonth': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return [startOfDay(first), endOfDay(now)];
    }
    case 'custom':
      return [
        customFrom ? startOfDay(new Date(customFrom)) : null,
        customTo ? endOfDay(new Date(customTo)) : null,
      ];
    default:
      return [null, null];
  }
}

// Manager-managed CRM tags — coexist with vendor.status. Keep enum order
// stable; server validates against the same list.
const VENDOR_TAGS = [
  { key: 'FOLLOW_UP_REQUIRED',     label: 'Follow-Up Required',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'CONNECTED',              label: 'Connected',              color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'RESPONDED',              label: 'Responded',              color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DOCUMENTS_PENDING',      label: 'Documents Pending',      color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'DOCUMENTS_VERIFIED',     label: 'Documents Verified',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'WRONG_VENDOR_DETAILS',   label: 'Wrong Vendor Details',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'NOT_INTERESTED',         label: 'Not Interested',         color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { key: 'NO_RESPONSE',            label: 'No Response',            color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { key: 'VEHICLE_DETAILS_PENDING', label: 'Vehicle Details Pending', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'ACTIVE_VENDOR',          label: 'Active Vendor',          color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'SUSPENDED',              label: 'Suspended',              color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const;
const TAG_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  VENDOR_TAGS.map((t) => [t.key, { label: t.label, color: t.color }])
);

interface Vendor {
  id: string;
  vid: string | null;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  rating: number;
  totalRatings: number;
  locations: string[];
  locationNames: string[];
  services: string[];
  serviceNames: string[];
  hasPendingLocationRequest: boolean;
  hasPendingServiceRequest: boolean;
  pendingLocationNames: string[];
  pendingServiceNames: string[];
  documentCount: number;
  fleetCount: number;
  tags: string[];
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ElementType; accent: string }> = {
  PENDING:           { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending',      icon: Clock,       accent: 'bg-yellow-400' },
  DOCUMENTS_PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Docs Pending', icon: FileText,    accent: 'bg-orange-400' },
  UNDER_REVIEW:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Under Review', icon: Clock,       accent: 'bg-blue-400' },
  APPROVED:          { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Approved',     icon: CheckCircle, accent: 'bg-green-400' },
  REJECTED:          { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected',     icon: XCircle,     accent: 'bg-red-400' },
  SUSPENDED:         { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Suspended',    icon: AlertCircle, accent: 'bg-purple-400' },
  BLOCKED:           { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Blocked',      icon: XCircle,     accent: 'bg-gray-400' },
};

// Presence — "is this vendor online right now" — same mechanism as the admin
// managers list (see /api/vendor/heartbeat, /api/admin/vendors/presence,
// reused as-is here since it has no admin-only role gate).
type PresenceStatus = 'active' | 'idle' | 'offline';

interface PresenceInfo {
  status: PresenceStatus;
  lastSeenAt: string | null;
  // Every platform (web/app) currently active or idle — a vendor logged
  // into both at once shows an entry for each, so the badge can render an
  // icon per live client instead of picking just one.
  platforms: { platform: 'web' | 'app'; status: PresenceStatus; lastSeenAt: string }[];
}

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active now', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700' },
  offline: { label: 'Offline', dot: 'bg-gray-300', text: 'text-gray-500' },
};

// Which client sent the vendor's last heartbeat — shown next to the presence
// dot so a manager can tell a web-dashboard login from an app login at a
// glance, not just that the vendor is online somewhere.
const PLATFORM_META: Record<'web' | 'app', { label: string; icon: typeof Globe }> = {
  web: { label: 'Web', icon: Globe },
  app: { label: 'App', icon: Smartphone },
};

function presenceTimeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// A vendor needs manager attention (and gets pinned to the top + highlighted)
// when they have a pending location/service request, or just uploaded docs
// and are awaiting review (UNDER_REVIEW is set purely by document upload —
// see the vendor status lifecycle notes elsewhere in this codebase).
function needsAttention(v: Vendor): boolean {
  return v.hasPendingLocationRequest || v.hasPendingServiceRequest || v.status === 'UNDER_REVIEW';
}

// Same 7-day window as the "New (Last 7 Days)" Joined filter — a vendor
// counts as new right up until it falls out of that filter's range.
const NEW_VENDOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
function isNewVendor(v: Vendor): boolean {
  return Date.now() - new Date(v.createdAt).getTime() <= NEW_VENDOR_WINDOW_MS;
}

const SORT_OPTIONS = [
  { value: 'date_desc',    label: 'Newest First',    icon: Calendar },
  { value: 'date_asc',     label: 'Oldest First',    icon: Calendar },
  { value: 'rating_desc',  label: 'Top Ranking',     icon: TrendingUp },
  { value: 'rating_asc',   label: 'Low Ranking',     icon: TrendingDown },
  { value: 'fleet_desc',   label: 'Big Fleet First', icon: Car },
  { value: 'fleet_asc',    label: 'Small Fleet',     icon: Car },
];

function ManagerVendorsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters — read from the URL (not local state) so applying a filter,
  // opening a vendor's detail page, then hitting Back restores exactly what
  // was selected instead of resetting to defaults. See clearFilters()/
  // updateFilter() below for how changes get written back into the URL.
  const search = searchParams.get('search') || '';
  // Location and Service are multi-select: the URL carries a comma-separated
  // list, so the selection survives the browser Back button like the rest.
  const csv = (name: string): string[] => {
    const raw = (searchParams.get(name) || '').trim();
    return !raw || raw === 'all' ? [] : raw.split(',').map((v) => v.trim()).filter(Boolean);
  };
  const locationFilters = csv('location');
  const serviceFilters = csv('service');
  const statusFilter = searchParams.get('status') || 'all';
  const tagFilter = searchParams.get('tag') || 'all';
  const requestFilter = searchParams.get('request') || 'all';
  const dateFilter = (searchParams.get('joined') || 'all') as DatePreset;
  const customFrom = searchParams.get('from') || '';
  const customTo = searchParams.get('to') || '';
  const sortBy = searchParams.get('sort') || 'date_desc';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('perPage') || '20', 10);
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  // Local echo of the search box so typing feels instant; committed into the
  // URL on a short debounce instead of on every keystroke.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => { setSearchInput(search); }, [search]);

  const [tagEditorOpenFor, setTagEditorOpenFor] = useState<string | null>(null);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  // Writes the given filter(s) into the URL query string, merged with
  // whatever's already there, and always resets pagination back to page 1
  // (matches the old reset-on-filter-change behaviour). Pass '' to remove a
  // param entirely rather than writing its default value into the URL.
  const updateFilter = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    router.push(`/manager/vendors?${params.toString()}`);
  }, [searchParams, router]);

  const setPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    router.push(`/manager/vendors?${params.toString()}`);
  }, [searchParams, router]);

  // Commit the search box into the URL after the manager stops typing.
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => updateFilter({ search: searchInput }), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const res = await fetch('/api/admin/vendors/presence');
        const data = await res.json();
        if (data.presence) setPresence(data.presence);
      } catch (error) {
        console.error('Failed to fetch vendor presence:', error);
      }
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);

    // Browsers throttle setInterval in a backgrounded tab (Chrome can drop
    // it to once a minute or slower), so a manager who tabs away and back
    // was seeing a stale "Active" badge until the throttled timer next
    // fired — sometimes minutes later. Refetch immediately on refocus so
    // the moment they're actually looking at the page, it's current.
    const onVisible = () => { if (document.visibilityState === 'visible') fetchPresence(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Filtering, sorting, and pagination all happen server-side now — this
  // fetch re-runs whenever any URL filter param (including page) changes,
  // since they're all read from searchParams above.
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueServices, setUniqueServices] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVendors = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (locationFilters.length) params.set('location', locationFilters.join(','));
      if (serviceFilters.length) params.set('service', serviceFilters.join(','));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (tagFilter !== 'all') params.set('tag', tagFilter);
      if (requestFilter !== 'all') params.set('request', requestFilter);
      if (dateFilter !== 'all') params.set('joined', dateFilter);
      if (customFrom) params.set('from', customFrom);
      if (customTo) params.set('to', customTo);
      if (sortBy !== 'date_desc') params.set('sort', sortBy);
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));

      const response = await fetch(`/api/manager/vendors?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setAllVendors(data.vendors);
        setStats(data.stats);
        setUniqueLocations(data.locations || []);
        setUniqueServices(data.services || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [searchParams.toString()]);

  const handleRefresh = () => { setIsRefreshing(true); fetchVendors(); };

  // The server already returns exactly this page's rows, filtered/sorted/
  // pinned — no further client-side work needed.
  const vendors = allVendors;
  const filteredStats = stats || { total: 0, approved: 0, pending: 0, suspended: 0 };
  const paginatedVendors = allVendors;

  const activeFilterCount = [
    search, locationFilters.length ? 'location' : '', serviceFilters.length ? 'service' : '',
    statusFilter !== 'all' ? statusFilter : '', tagFilter !== 'all' ? tagFilter : '',
    requestFilter !== 'all' ? requestFilter : '',
    dateFilter !== 'all' ? dateFilter : '',
    sortBy !== 'date_desc' ? sortBy : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput('');
    router.push('/manager/vendors');
  };

  useManagerPageHeader(
    'Vendors',
    `${totalCount} vendor${totalCount === 1 ? '' : 's'}${activeFilterCount > 0 ? ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)` : ''}${totalPages > 1 ? ` · Page ${currentPage}/${totalPages}` : ''}`,
    <button
      key="refresh"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

  // Optimistic tag toggle — adds/removes the tag locally, then syncs server.
  // Rolls back on failure. Keeps the inline editor snappy.
  const handleToggleTag = async (vendorId: string, tag: string, present: boolean) => {
    const key = `${vendorId}:${tag}`;
    setTagSaving(key);
    const prev = allVendors;
    setAllVendors(curr => curr.map(v => v.id === vendorId
      ? { ...v, tags: present ? v.tags.filter(t => t !== tag) : [...(v.tags || []), tag] }
      : v));
    try {
      const res = present
        ? await fetch(`/api/manager/vendors/${vendorId}/tags?tag=${tag}`, { method: 'DELETE' })
        : await fetch(`/api/manager/vendors/${vendorId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag }),
          });
      if (!res.ok) throw new Error('Server rejected tag change');
      const data = await res.json();
      if (Array.isArray(data?.tags)) {
        setAllVendors(curr => curr.map(v => v.id === vendorId ? { ...v, tags: data.tags } : v));
      }
    } catch (e) {
      setAllVendors(prev);
      alert('Could not update tag. Please try again.');
    } finally {
      setTagSaving(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats + Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid flex-1 min-w-[280px] grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: filteredStats.total,     icon: Store,        ring: 'ring-slate-200',  iconWrap: 'bg-slate-100 text-slate-600',   valColor: 'text-slate-900',  accent: 'bg-slate-300' },
            { label: 'Approved',  value: filteredStats.approved,  icon: CheckCircle,  ring: 'ring-green-100',  iconWrap: 'bg-green-100 text-green-600',   valColor: 'text-green-600',  accent: 'bg-green-400' },
            { label: 'Pending',   value: filteredStats.pending,   icon: Clock,        ring: 'ring-yellow-100', iconWrap: 'bg-yellow-100 text-yellow-600', valColor: 'text-yellow-600', accent: 'bg-yellow-400' },
            { label: 'Suspended', value: filteredStats.suspended, icon: AlertCircle,  ring: 'ring-purple-100', iconWrap: 'bg-purple-100 text-purple-600', valColor: 'text-purple-600', accent: 'bg-purple-400' },
          ].map(({ label, value, icon: Icon, iconWrap, valColor, accent }) => (
            <div key={label} className="relative overflow-hidden bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
              <div className="flex items-center gap-3 pl-1">
                <div className={`p-2.5 rounded-lg ${iconWrap}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className={`text-2xl font-bold leading-none ${valColor}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, phone, email, VN-ID..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); updateFilter({ search: '' }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {/* Location — multi-select */}
          <FilterMultiSelect
            variant="labeled"
            label="Location"
            allLabel="All Locations"
            options={uniqueLocations.map((l) => ({ value: l, label: l }))}
            values={locationFilters}
            onChange={(v) => updateFilter({ location: v.join(',') })}
          />

          {/* Service — multi-select */}
          <FilterMultiSelect
            variant="labeled"
            label="Service"
            allLabel="All Services"
            options={uniqueServices.map((sv) => ({ value: sv, label: sv }))}
            values={serviceFilters}
            onChange={(v) => updateFilter({ service: v.join(',') })}
          />

          {/* Status */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
            <select value={statusFilter} onChange={e => updateFilter({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending (All)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_PENDING">Docs Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Tag</label>
            <select value={tagFilter} onChange={e => updateFilter({ tag: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Tags</option>
              <option value="__none__">🏷️ No Tag (Untagged)</option>
              {VENDOR_TAGS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          {/* New request */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">New Request</label>
            <select value={requestFilter} onChange={e => updateFilter({ request: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              <option value="all">All Vendors</option>
              <option value="any">Any Pending Request</option>
              <option value="location">New Location Requested</option>
              <option value="service">New Service Requested</option>
            </select>
          </div>

          {/* Joined date */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Joined</label>
            <select value={dateFilter} onChange={e => updateFilter({ joined: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map(preset => (
                <option key={preset} value={preset}>{DATE_PRESET_LABELS[preset]}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Sort By</label>
            <select value={sortBy} onChange={e => updateFilter({ sort: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Custom date range inputs */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} max={customTo || undefined}
              onChange={e => updateFilter({ from: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={customTo} min={customFrom || undefined}
              onChange={e => updateFilter({ to: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
          </div>
        )}

        {/* Active filter chips + clear */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {search && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                <Search className="w-3 h-3" /> "{search}"
                <button onClick={() => { setSearchInput(''); updateFilter({ search: '' }); }}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {locationFilters.map((loc) => (
              <span key={`loc-${loc}`} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                <MapPin className="w-3 h-3" /> {loc}
                <button onClick={() => updateFilter({ location: locationFilters.filter((l) => l !== loc).join(',') })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            ))}
            {serviceFilters.map((svc) => (
              <span key={`svc-${svc}`} className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                <Layers className="w-3 h-3" /> {svc}
                <button onClick={() => updateFilter({ service: serviceFilters.filter((x) => x !== svc).join(',') })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            ))}
            {statusFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                {statusFilter}
                <button onClick={() => updateFilter({ status: '' })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {tagFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
                <Tag className="w-3 h-3" /> {tagFilter === '__none__' ? 'No Tag (Untagged)' : (TAG_BY_KEY[tagFilter]?.label || tagFilter)}
                <button onClick={() => updateFilter({ tag: '' })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {requestFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                <Bell className="w-3 h-3" /> {requestFilter === 'location' ? 'New Location Requested' : requestFilter === 'service' ? 'New Service Requested' : 'Any Pending Request'}
                <button onClick={() => updateFilter({ request: '' })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-200">
                <CalendarDays className="w-3 h-3" /> {DATE_PRESET_LABELS[dateFilter]}
                <button onClick={() => updateFilter({ joined: '', from: '', to: '' })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {sortBy !== 'date_desc' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <button onClick={() => updateFilter({ sort: '' })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 underline ml-1 transition">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Vendors List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {vendors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'No vendors in your assigned locations yet'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {paginatedVendors.map((vendor) => {
              const statusConfig = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;
              const isTagEditorOpen = tagEditorOpenFor === vendor.id;
              const stopRow = (e: React.MouseEvent) => { e.stopPropagation(); };
              const flagged = needsAttention(vendor);
              return (
                <div key={vendor.id}
                  onClick={() => router.push(`/manager/vendors/${vendor.id}`)}
                  className={`group relative block p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer ${flagged ? 'bg-orange-50/40' : ''}`}>
                  <span className={`absolute inset-y-0 left-0 w-1 ${flagged ? 'bg-orange-400' : statusConfig.accent}`} />
                  <div className="flex items-start gap-4 pl-1.5">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.bg}`}>
                      <Store className={`w-6 h-6 ${statusConfig.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{vendor.businessName}</span>
                        {vendor.vid && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-500 border border-gray-200 tracking-wider">
                            {vendor.vid.toUpperCase()}
                          </span>
                        )}
                        {isNewVendor(vendor) && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                            title={`Joined ${formatDate(vendor.createdAt)}`}
                          >
                            <Sparkles className="w-3 h-3" /> NEW
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        {(() => {
                          const p = presence[vendor.id];
                          const meta = PRESENCE_META[p?.status || 'offline'];
                          const livePlatforms = p?.platforms || [];
                          const title = livePlatforms.length > 0
                            ? `Active on ${livePlatforms.map((lp) => PLATFORM_META[lp.platform].label).join(' + ')}`
                            : p ? `Last seen ${presenceTimeAgo(p.lastSeenAt)}` : 'Never logged in';
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.text}`}
                              title={title}
                            >
                              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                              {meta.label}
                              {livePlatforms.map((lp) => {
                                const platformMeta = PLATFORM_META[lp.platform];
                                const PlatformIcon = platformMeta.icon;
                                return (
                                  <React.Fragment key={lp.platform}>
                                    <span className="text-gray-300">·</span>
                                    <PlatformIcon className="w-3 h-3" />
                                    {platformMeta.label}
                                  </React.Fragment>
                                );
                              })}
                            </span>
                          );
                        })()}
                        {vendor.rating > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {vendor.rating.toFixed(1)}
                            <span className="text-amber-500/70">({vendor.totalRatings})</span>
                          </span>
                        )}
                        {vendor.hasPendingLocationRequest && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <MapPinPlus className="w-3 h-3" />
                            New Location Request
                          </span>
                        )}
                        {vendor.hasPendingServiceRequest && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <Layers className="w-3 h-3" />
                            New Service Request
                          </span>
                        )}
                        {vendor.status === 'UNDER_REVIEW' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <FileText className="w-3 h-3" />
                            Needs Review
                          </span>
                        )}
                      </div>

                      {/* Info row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{vendor.ownerName}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {vendor.phone}
                        </span>
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {vendor.fleetCount} vehicles
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          {formatDate(vendor.createdAt)}
                        </span>
                      </div>

                      {/* Location & Service chips */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {vendor.locationNames.slice(0, 3).map((loc, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${locationFilters.includes(loc) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
                            <MapPin className="w-3 h-3" />{loc}
                          </span>
                        ))}
                        {vendor.locationNames.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{vendor.locationNames.length - 3}</span>
                        )}
                        {vendor.serviceNames.slice(0, 2).map((svc, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${serviceFilters.includes(svc) ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`}>
                            <Layers className="w-3 h-3" />{svc}
                          </span>
                        ))}
                        {vendor.serviceNames.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{vendor.serviceNames.length - 2}</span>
                        )}
                      </div>

                      {/* Tag chips + inline editor — clicks stopped from
                          bubbling so they don't navigate the row. */}
                      <div className="mt-2 flex flex-wrap gap-1.5 items-center" onClick={stopRow}>
                        {(vendor.tags || []).map((t) => {
                          const meta = TAG_BY_KEY[t];
                          if (!meta) return null;
                          const saving = tagSaving === `${vendor.id}:${t}`;
                          return (
                            <span key={t}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color} ${saving ? 'opacity-50' : ''}`}>
                              <Tag className="w-3 h-3" />
                              {meta.label}
                              <button
                                type="button"
                                disabled={saving}
                                onClick={(e) => { e.stopPropagation(); handleToggleTag(vendor.id, t, true); }}
                                className="ml-0.5 hover:opacity-70"
                                title="Remove tag"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTagEditorOpenFor(isTagEditorOpen ? null : vendor.id); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <Plus className="w-3 h-3" />
                          {(vendor.tags || []).length === 0 ? 'Add tag' : 'Edit tags'}
                        </button>
                      </div>

                      {isTagEditorOpen && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg" onClick={stopRow}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Toggle tags</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTagEditorOpenFor(null); }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {VENDOR_TAGS.map((t) => {
                              const present = (vendor.tags || []).includes(t.key);
                              const saving = tagSaving === `${vendor.id}:${t.key}`;
                              return (
                                <button
                                  key={t.key}
                                  type="button"
                                  disabled={saving}
                                  onClick={(e) => { e.stopPropagation(); handleToggleTag(vendor.id, t.key, present); }}
                                  className={`px-2 py-1 rounded-full text-xs font-medium border transition ${
                                    present
                                      ? `${t.color} ring-1 ring-offset-1 ring-current`
                                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                                  } ${saving ? 'opacity-50' : ''}`}
                                >
                                  {present ? '✓ ' : '+ '}{t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {vendors.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium text-gray-700">{totalCount}</span> vendors
            </p>
            <span className="hidden sm:inline text-gray-300">·</span>
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-500">Show</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={e => updateFilter({ perPage: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white cursor-pointer transition-colors"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
          <Pagination
            className="flex-wrap"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}


export default function ManagerVendorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    }>
      <ManagerVendorsPageInner />
    </Suspense>
  );
}
