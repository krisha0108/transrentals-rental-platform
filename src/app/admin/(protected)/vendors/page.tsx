'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  FileText,
  Layers,
  MapPin,
  Car,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  CalendarDays,
  X,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FilterMultiSelect from '@/components/manager/FilterMultiSelect';

interface Vendor {
  id: string;
  vid?: string | null;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  rating?: number | null;
  totalRatings?: number | null;
  locationNames?: string[];
  serviceNames?: string[];
  pendingLocationNames?: string[];
  pendingServiceNames?: string[];
  _count: {
    documents: number;
    serviceRequests: number;
    locationRequests: number;
    approvedServices: number;
    approvedLocations: number;
    fleets: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Counted over the whole filtered set by the API, so paging does not move them.
interface Stats {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
}

// Presence — "is this vendor online right now" — same mechanism as the admin
// managers list (see /api/vendor/heartbeat, /api/admin/vendors/presence).
type PresenceStatus = 'active' | 'idle' | 'offline';

interface PresenceInfo {
  status: PresenceStatus;
  lastSeenAt: string | null;
}

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active now', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700' },
  offline: { label: 'Offline', dot: 'bg-gray-300', text: 'text-gray-500' },
};

function timeAgo(iso: string | null): string {
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  DOCUMENTS_PENDING: { label: 'Documents Pending', color: 'bg-orange-100 text-orange-800', icon: FileText },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', color: 'bg-gray-100 text-gray-800', icon: Ban },
};

type DatePreset = 'all' | 'last7Days' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

const datePresetLabels: Record<DatePreset, string> = {
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

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'rating_desc', label: 'Top Ranking' },
  { value: 'rating_asc', label: 'Low Ranking' },
  { value: 'fleet_desc', label: 'Big Fleet First' },
  { value: 'fleet_asc', label: 'Small Fleet' },
];

const statusActions: Record<string, { action: string; label: string; color: string }[]> = {
  PENDING: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  DOCUMENTS_PENDING: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  UNDER_REVIEW: [
    { action: 'APPROVE', label: 'Approve', color: 'text-green-700 hover:bg-green-50' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  APPROVED: [
    { action: 'SUSPEND', label: 'Suspend', color: 'text-purple-700 hover:bg-purple-50' },
    { action: 'BLOCK', label: 'Block', color: 'text-gray-700 hover:bg-gray-100' },
    { action: 'REJECT', label: 'Reject', color: 'text-red-700 hover:bg-red-50' },
  ],
  REJECTED: [
    { action: 'APPROVE', label: 'Re-Approve', color: 'text-green-700 hover:bg-green-50' },
  ],
  SUSPENDED: [
    { action: 'UNSUSPEND', label: 'Reinstate', color: 'text-green-700 hover:bg-green-50' },
    { action: 'BLOCK', label: 'Block', color: 'text-gray-700 hover:bg-gray-100' },
  ],
  BLOCKED: [
    { action: 'UNSUSPEND', label: 'Unblock', color: 'text-green-700 hover:bg-green-50' },
  ],
};

function ActionDropdown({
  vendor,
  onAction,
}: {
  vendor: Vendor;
  onAction: (vendorId: string, action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actions = statusActions[vendor.status] || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="gap-1"
      >
        <MoreHorizontal className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border rounded-lg shadow-lg z-10 py-1">
          {actions.map(({ action, label, color }) => (
            <button
              key={action}
              className={`w-full text-left px-4 py-2 text-sm font-medium ${color}`}
              onClick={() => {
                setOpen(false);
                onAction(vendor.id, action);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RejectModal({
  vendorName,
  onConfirm,
  onCancel,
  loading,
}: {
  vendorName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject Vendor</h2>
        <p className="text-sm text-gray-500 mb-4">
          Provide a rejection reason for <span className="font-medium text-gray-800">{vendorName}</span>.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [requestFilter, setRequestFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [stats, setStats] = useState<Stats | null>(null);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);

  // Status change state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Vendor | null>(null);

  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  const fetchPresence = async () => {
    try {
      const res = await fetch('/api/admin/vendors/presence');
      const data = await res.json();
      if (data.presence) setPresence(data.presence);
    } catch (error) {
      console.error('Failed to fetch vendor presence:', error);
    }
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (locationFilters.length) params.append('location', locationFilters.join(','));
      if (serviceFilters.length) params.append('service', serviceFilters.join(','));
      if (requestFilter !== 'all') params.append('request', requestFilter);
      if (sortBy !== 'date_desc') params.append('sort', sortBy);

      if (datePreset !== 'all' && !(datePreset === 'custom' && !customFrom && !customTo)) {
        const [from, to] = getDateRange(datePreset, customFrom, customTo);
        if (from) params.append('dateFrom', from.toISOString());
        if (to) params.append('dateTo', to.toISOString());
      }

      const res = await fetch(`/api/admin/vendors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
        // The option lists cover every vendor, so they do not narrow as the
        // current filters narrow; keeping the last non-empty list avoids the
        // dropdowns blinking empty between requests.
        if (Array.isArray(data.locations) && data.locations.length) setLocationOptions(data.locations);
        if (Array.isArray(data.services) && data.services.length) setServiceOptions(data.services);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page, statusFilter, search, datePreset, customFrom, customTo,
    locationFilters, serviceFilters, requestFilter, sortBy,
  ]);

  // Every filter change starts again from page 1 — landing on page 4 of a
  // result set that now has one page shows an empty table.
  const applyFilter = (change: () => void) => {
    change();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('ALL');
    setLocationFilters([]);
    setServiceFilters([]);
    setRequestFilter('all');
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setSortBy('date_desc');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    locationFilters.length +
    serviceFilters.length +
    (requestFilter !== 'all' ? 1 : 0) +
    (datePreset !== 'all' ? 1 : 0) +
    (sortBy !== 'date_desc' ? 1 : 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAction = (vendorId: string, action: string) => {
    if (action === 'REJECT') {
      const vendor = vendors.find((v) => v.id === vendorId);
      if (vendor) setRejectTarget(vendor);
      return;
    }
    executeAction(vendorId, action);
  };

  const executeAction = async (vendorId: string, action: string, rejectionReason?: string) => {
    setActionLoading(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, status: updated.status } : v))
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {rejectTarget && (
        <RejectModal
          vendorName={rejectTarget.businessName}
          loading={actionLoading === rejectTarget.id}
          onConfirm={(reason) => executeAction(rejectTarget.id, 'REJECT', reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage vendor registrations and approvals</p>
        </div>
        {datePreset !== 'all' && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 text-sm">
            <CalendarDays className="w-3.5 h-3.5" />
            {pagination.total} joined {datePresetLabels[datePreset] === 'Custom Range' ? 'in range' : datePresetLabels[datePreset].replace('🆕 ', '').toLowerCase()}
          </span>
        )}
      </div>

      {/* Counts across the whole filtered set. The pills that used to sit in
          the header counted only the twenty rows on the current page, so they
          disagreed with themselves as soon as you turned the page. Clicking a
          card filters to it. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats?.total, status: 'ALL', icon: Store, iconWrap: 'bg-slate-100 text-slate-600', valColor: 'text-slate-900', accent: 'bg-slate-300' },
          { label: 'Approved', value: stats?.approved, status: 'APPROVED', icon: CheckCircle, iconWrap: 'bg-green-100 text-green-600', valColor: 'text-green-600', accent: 'bg-green-400' },
          { label: 'Pending', value: stats?.pending, status: 'PENDING_ALL', icon: Clock, iconWrap: 'bg-yellow-100 text-yellow-600', valColor: 'text-yellow-600', accent: 'bg-yellow-400' },
          { label: 'Suspended', value: stats?.suspended, status: 'SUSPENDED', icon: AlertTriangle, iconWrap: 'bg-purple-100 text-purple-600', valColor: 'text-purple-600', accent: 'bg-purple-400' },
        ].map(({ label, value, status, icon: Icon, iconWrap, valColor, accent }) => {
          const selected = statusFilter === status;
          return (
            <button
              key={label}
              type="button"
              onClick={() => applyFilter(() => setStatusFilter(status))}
              aria-pressed={selected}
              className={`relative overflow-hidden bg-white rounded-xl p-4 border shadow-sm text-left transition hover:shadow ${selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
              <div className="flex items-center gap-3 pl-1">
                <div className={`p-2.5 rounded-lg ${iconWrap}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className={`text-2xl font-bold leading-none ${valColor}`}>
                    {value === undefined ? '—' : value.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        {/* Row 1: Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, owner, email, phone, VN-ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => applyFilter(() => { setSearchInput(''); setSearch(''); })}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Location — multi-select */}
          <FilterMultiSelect
            variant="labeled"
            label="Location"
            allLabel="All Locations"
            options={locationOptions.map((l) => ({ value: l, label: l }))}
            values={locationFilters}
            onChange={(v) => applyFilter(() => setLocationFilters(v))}
          />

          {/* Service — multi-select */}
          <FilterMultiSelect
            variant="labeled"
            label="Service"
            allLabel="All Services"
            options={serviceOptions.map((sv) => ({ value: sv, label: sv }))}
            values={serviceFilters}
            onChange={(v) => applyFilter(() => setServiceFilters(v))}
          />

          {/* Status */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => applyFilter(() => setStatusFilter(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_ALL">Pending (All)</option>
              <option value="PENDING">Pending</option>
              <option value="DOCUMENTS_PENDING">Documents Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* New request */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">New Request</label>
            <select
              value={requestFilter}
              onChange={(e) => applyFilter(() => setRequestFilter(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Vendors</option>
              <option value="any">Any Pending Request</option>
              <option value="location">New Location Requested</option>
              <option value="service">New Service Requested</option>
            </select>
          </div>

          {/* Joined date */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Joined</label>
            <select
              value={datePreset}
              onChange={(e) => applyFilter(() => setDatePreset(e.target.value as DatePreset))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {(Object.keys(datePresetLabels) as DatePreset[]).map((preset) => (
                <option key={preset} value={preset}>{datePresetLabels[preset]}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => applyFilter(() => setSortBy(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date range inputs */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => applyFilter(() => setCustomFrom(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => applyFilter(() => setCustomTo(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Active filter chips + clear */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {search && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                <Search className="w-3 h-3" /> &quot;{search}&quot;
                <button type="button" onClick={() => applyFilter(() => { setSearchInput(''); setSearch(''); })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {locationFilters.map((loc) => (
              <span key={`loc-${loc}`} className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-medium border border-sky-200">
                <MapPin className="w-3 h-3" /> {loc}
                <button type="button" onClick={() => applyFilter(() => setLocationFilters(locationFilters.filter((l) => l !== loc)))}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            ))}
            {serviceFilters.map((svc) => (
              <span key={`svc-${svc}`} className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                <Layers className="w-3 h-3" /> {svc}
                <button type="button" onClick={() => applyFilter(() => setServiceFilters(serviceFilters.filter((x) => x !== svc)))}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            ))}
            {statusFilter !== 'ALL' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                {statusFilter === 'PENDING_ALL' ? 'Pending (All)' : (statusConfig[statusFilter]?.label || statusFilter)}
                <button type="button" onClick={() => applyFilter(() => setStatusFilter('ALL'))}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {requestFilter !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                <Bell className="w-3 h-3" /> {requestFilter === 'location' ? 'New Location Requested' : requestFilter === 'service' ? 'New Service Requested' : 'Any Pending Request'}
                <button type="button" onClick={() => applyFilter(() => setRequestFilter('all'))}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {datePreset !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-200">
                <CalendarDays className="w-3 h-3" /> {datePresetLabels[datePreset]}
                <button type="button" onClick={() => applyFilter(() => { setDatePreset('all'); setCustomFrom(''); setCustomTo(''); })}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            {sortBy !== 'date_desc' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <button type="button" onClick={() => applyFilter(() => setSortBy('date_desc'))}><X className="w-3 h-3 ml-0.5" /></button>
              </span>
            )}
            <button type="button" onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 underline ml-1 transition">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Store className="w-12 h-12 mb-4" />
            <p>No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Online</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Stats</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Registered</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((vendor) => {
                  const statusInfo = statusConfig[vendor.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const isUpdating = actionLoading === vendor.id;
                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {vendor.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor.businessName}</p>
                            <p className="text-sm text-gray-500">{vendor.ownerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{vendor.email}</p>
                        <p className="text-sm text-gray-500">{vendor.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const p = presence[vendor.id];
                          const meta = PRESENCE_META[p?.status || 'offline'];
                          return (
                            <div>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                {meta.label}
                              </span>
                              {p?.status !== 'active' && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {p ? `Last seen ${timeAgo(p.lastSeenAt)}` : 'Never logged in'}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1" title="Documents">
                            <FileText className="w-4 h-4" />
                            {vendor._count.documents}
                          </span>
                          <span className="flex items-center gap-1" title="Services">
                            <Layers className="w-4 h-4" />
                            {vendor._count.approvedServices}
                          </span>
                          <span className="flex items-center gap-1" title="Locations">
                            <MapPin className="w-4 h-4" />
                            {vendor._count.approvedLocations}
                          </span>
                          <span className="flex items-center gap-1" title="Fleet">
                            <Car className="w-4 h-4" />
                            {vendor._count.fleets}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/vendors/${vendor.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <ActionDropdown vendor={vendor} onAction={handleAction} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vendors
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
