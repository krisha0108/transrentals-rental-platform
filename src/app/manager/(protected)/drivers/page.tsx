'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  IdCard,
  Car,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Store,
  User,
  Tag,
  Plus,
  X,
  Filter,
  UserCheck,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type DriverStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type DriverSource = 'standalone' | 'vendor';

// Manager-managed CRM tags — mirrors the vendor tag system. Server validates
// against the same enum (see /api/manager/drivers/[id]/tags).
const DRIVER_TAGS = [
  { key: 'FOLLOW_UP_REQUIRED',      label: 'Follow-Up Required',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'CONNECTED',               label: 'Connected',               color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'RESPONDED',               label: 'Responded',               color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DOCUMENTS_PENDING',       label: 'Documents Pending',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'DOCUMENTS_VERIFIED',      label: 'Documents Verified',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'WRONG_DRIVER_DETAILS',    label: 'Wrong Driver Details',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'NOT_INTERESTED',          label: 'Not Interested',          color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { key: 'NO_RESPONSE',             label: 'No Response',             color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { key: 'VEHICLE_DETAILS_PENDING', label: 'Vehicle Details Pending', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'ACTIVE_DRIVER',           label: 'Active Driver',           color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'SUSPENDED',               label: 'Suspended',               color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const;
const TAG_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  DRIVER_TAGS.map((t) => [t.key, { label: t.label, color: t.color }])
);

interface Driver {
  id: string;
  source: DriverSource;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  city: string | null;
  state: string | null;
  status: string; // raw status from source table
  effectiveStatus: DriverStatus; // normalized for UI chips
  licenseNumber: string | null;
  licenseExpiry: string | null;
  joiningDate: string;
  lastLoginAt: string | null;
  createdAt: string;
  did: string | null;
  vendorId: string | null;
  vendorName: string | null;
  bookingsCount: number;
  vehiclesCount: number;
  tags: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  inactive: number;
}

const STATUS_CONFIG: Record<DriverStatus, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-500' },
  ACTIVE:    { label: 'Active',    pill: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  INACTIVE:  { label: 'Inactive',  pill: 'bg-gray-100 text-gray-700',      dot: 'bg-gray-400' },
  SUSPENDED: { label: 'Suspended', pill: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, suspended: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  // CRM tag editing (per-row)
  const [tagEditorOpenFor, setTagEditorOpenFor] = useState<string | null>(null);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  const fetchDrivers = async (
    page: number,
    currentStatus: string,
    currentSearch: string,
    currentTag: string,
    currentSource: string,
    currentLicense: string,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (currentStatus !== 'all') params.append('status', currentStatus);
      if (currentTag !== 'all') params.append('tag', currentTag);
      if (currentSource !== 'all') params.append('source', currentSource);
      if (currentLicense !== 'all') params.append('licenseStatus', currentLicense);
      if (currentSearch) params.append('search', currentSearch);

      const res = await fetch(`/api/manager/drivers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(pagination.page, statusFilter, search, tagFilter, sourceFilter, licenseFilter);
  }, [pagination.page, statusFilter, search, tagFilter, sourceFilter, licenseFilter]);

  // Optimistic per-row tag toggle — adds/removes locally, then syncs server.
  // Rolls back on failure. Tags are keyed by (driverId, source).
  const handleToggleTag = async (driverId: string, source: DriverSource, tag: string, present: boolean) => {
    const saveKey = `${source}:${driverId}:${tag}`;
    setTagSaving(saveKey);
    const snapshot = drivers;
    setDrivers((curr) =>
      curr.map((d) =>
        d.id === driverId && d.source === source
          ? { ...d, tags: present ? d.tags.filter((t) => t !== tag) : [...(d.tags || []), tag] }
          : d
      )
    );
    try {
      const res = present
        ? await fetch(`/api/manager/drivers/${driverId}/tags?tag=${tag}&source=${source}`, { method: 'DELETE' })
        : await fetch(`/api/manager/drivers/${driverId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag, source }),
          });
      if (!res.ok) throw new Error('Server rejected tag change');
      const data = await res.json();
      if (Array.isArray(data?.tags)) {
        setDrivers((curr) =>
          curr.map((d) => (d.id === driverId && d.source === source ? { ...d, tags: data.tags } : d))
        );
      }
    } catch {
      setDrivers(snapshot);
      alert('Could not update tag. Please try again.');
    } finally {
      setTagSaving(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const isLicenseExpiring = (expiry: string | null) => {
    if (!expiry) return false;
    const days = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };
  const isLicenseExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry).getTime() < Date.now();
  };

  const statusChips = [
    { id: 'all',       label: 'All',       count: stats.total,     icon: Users },
    { id: 'PENDING',   label: 'Pending',   count: stats.pending,   icon: Clock },
    { id: 'ACTIVE',    label: 'Active',    count: stats.active,    icon: ShieldCheck },
    { id: 'SUSPENDED', label: 'Suspended', count: stats.suspended, icon: ShieldX },
    { id: 'INACTIVE',  label: 'Inactive',  count: stats.inactive,  icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 text-sm mt-0.5">Manage drivers registered on TransRentals</p>
        </div>
      </div>

      {/* Status chips double as filters and stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusChips.map((chip) => {
          const Icon = chip.icon;
          const isActive = statusFilter === chip.id;
          const color = chip.id === 'PENDING'   ? 'yellow'
                      : chip.id === 'ACTIVE'    ? 'green'
                      : chip.id === 'SUSPENDED' ? 'red'
                      : chip.id === 'INACTIVE'  ? 'gray'
                      : 'blue';
          const colorClasses: Record<string, string> = {
            yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
            green:  'bg-green-50  text-green-700  ring-green-200',
            red:    'bg-red-50    text-red-700    ring-red-200',
            gray:   'bg-gray-50   text-gray-700   ring-gray-200',
            blue:   'bg-blue-50   text-blue-700   ring-blue-200',
          };
          return (
            <button
              key={chip.id}
              onClick={() => {
                setStatusFilter(chip.id);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 text-left hover:shadow-md transition ${
                isActive ? 'ring-2 ring-offset-1 ' + colorClasses[color] : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{chip.count.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">{chip.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, license, driver ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          </form>

          {/* Source filter */}
          <div className="relative sm:w-44">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white appearance-none"
            >
              <option value="all">All Drivers</option>
              <option value="standalone">Direct Only</option>
              <option value="vendor">Vendor Only</option>
            </select>
          </div>

          {/* License status filter */}
          <div className="relative sm:w-52">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={licenseFilter}
              onChange={(e) => { setLicenseFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white appearance-none"
            >
              <option value="all">All Licenses</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring (30 days)</option>
              <option value="expired">Expired</option>
              <option value="none">Not Provided</option>
            </select>
          </div>

          {/* Tag filter */}
          <div className="relative sm:w-56">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white appearance-none"
            >
              <option value="all">All Tags</option>
              {DRIVER_TAGS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(tagFilter !== 'all' || sourceFilter !== 'all' || licenseFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {sourceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                <UserCheck className="w-3 h-3" /> {sourceFilter === 'standalone' ? 'Direct' : 'Vendor'}
                <button type="button" onClick={() => { setSourceFilter('all'); setPagination((prev) => ({ ...prev, page: 1 })); }}>
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {licenseFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                <IdCard className="w-3 h-3" />
                {{ valid: 'Valid License', expiring: 'Expiring Soon', expired: 'Expired', none: 'No License' }[licenseFilter]}
                <button type="button" onClick={() => { setLicenseFilter('all'); setPagination((prev) => ({ ...prev, page: 1 })); }}>
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {tagFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                <Tag className="w-3 h-3" /> {TAG_BY_KEY[tagFilter]?.label || tagFilter}
                <button type="button" onClick={() => { setTagFilter('all'); setPagination((prev) => ({ ...prev, page: 1 })); }}>
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSourceFilter('all'); setLicenseFilter('all'); setTagFilter('all'); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="text-xs text-gray-400 hover:text-red-500 underline transition"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">No drivers found</p>
            <p className="text-sm mt-1">Try adjusting your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">License</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((driver) => {
                  const statusCfg = STATUS_CONFIG[driver.effectiveStatus] || STATUS_CONFIG.INACTIVE;
                  const licenseExpired = isLicenseExpired(driver.licenseExpiry);
                  const licenseSoon = !licenseExpired && isLicenseExpiring(driver.licenseExpiry);
                  const isVendorDriver = driver.source === 'vendor';
                  return (
                    <tr key={`${driver.source}-${driver.id}`} className="hover:bg-gray-50 transition-colors">
                      {/* Driver */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {driver.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={driver.profilePhoto} alt={driver.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                              isVendorDriver
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm">{driver.name}</p>
                              {isVendorDriver ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wider">
                                  <Store className="w-2.5 h-2.5" />
                                  Vendor
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase tracking-wider">
                                  <User className="w-2.5 h-2.5" />
                                  Direct
                                </span>
                              )}
                              {driver.did && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded font-mono">
                                  <Shield className="w-2.5 h-2.5" />
                                  {driver.did}
                                </span>
                              )}
                            </div>
                            {isVendorDriver && driver.vendorName && (
                              <p className="text-xs text-amber-700 mt-0.5 truncate max-w-[200px]">
                                via {driver.vendorName}
                              </p>
                            )}
                            {(driver.city || driver.state) && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {[driver.city, driver.state].filter(Boolean).join(', ')}
                              </div>
                            )}

                            {/* CRM tags — chips + inline editor (same as vendors) */}
                            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                              {(driver.tags || []).map((t) => {
                                const meta = TAG_BY_KEY[t];
                                if (!meta) return null;
                                const saving = tagSaving === `${driver.source}:${driver.id}:${t}`;
                                return (
                                  <span
                                    key={t}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${meta.color} ${saving ? 'opacity-50' : ''}`}
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {meta.label}
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => handleToggleTag(driver.id, driver.source, t, true)}
                                      className="ml-0.5 hover:opacity-70"
                                      title="Remove tag"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() =>
                                  setTagEditorOpenFor((cur) =>
                                    cur === `${driver.source}:${driver.id}` ? null : `${driver.source}:${driver.id}`
                                  )
                                }
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                {(driver.tags || []).length === 0 ? 'Add tag' : 'Edit'}
                              </button>
                            </div>

                            {tagEditorOpenFor === `${driver.source}:${driver.id}` && (
                              <div className="mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg max-w-md">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-semibold text-gray-700">Toggle tags</span>
                                  <button
                                    type="button"
                                    onClick={() => setTagEditorOpenFor(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {DRIVER_TAGS.map((t) => {
                                    const present = (driver.tags || []).includes(t.key);
                                    const saving = tagSaving === `${driver.source}:${driver.id}:${t.key}`;
                                    return (
                                      <button
                                        key={t.key}
                                        type="button"
                                        disabled={saving}
                                        onClick={() => handleToggleTag(driver.id, driver.source, t.key, present)}
                                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition ${
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
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {driver.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{driver.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* License */}
                      <td className="px-6 py-4">
                        {driver.licenseNumber ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <IdCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="font-mono text-xs">{driver.licenseNumber}</span>
                            </div>
                            <p className={`text-xs ${licenseExpired ? 'text-red-600 font-semibold' : licenseSoon ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                              {licenseExpired ? 'Expired ' : 'Expires '}{formatDate(driver.licenseExpiry)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not provided</span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Car className="w-3.5 h-3.5 text-gray-400" />
                            <span>{driver.vehiclesCount} vehicle{driver.vehiclesCount !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-xs text-gray-500">{driver.bookingsCount} bookings</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                          <CalendarDays className="w-3 h-3" />
                          Joined {formatDate(driver.joiningDate || driver.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <Link href={`/manager/drivers/${driver.id}?source=${driver.source}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
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
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} drivers
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
              <span className="px-3 py-1 text-sm text-gray-600">
                {pagination.page} / {pagination.pages}
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
