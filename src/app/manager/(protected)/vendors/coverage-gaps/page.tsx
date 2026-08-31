'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MapPinOff, AlertCircle, RefreshCw, Search, Calendar, User, Hash,
  Bike, Key, Bus, Truck, Gem, Package, Wrench,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

interface GapRecord {
  id: string;
  serviceType: string;
  requestId: string;
  requestNumber: string;
  locationName: string;
  customerName: string;
  createdAt: string;
}

interface LocationGap {
  locationName: string;
  count: number;
  lastInquiry: string | null;
  byService: { serviceType: string; count: number }[];
}

const SERVICE_META: Record<string, { label: string; icon: any; color: string }> = {
  bike: { label: 'Bike Rental', icon: Bike, color: '#F97316' },
  'self-drive': { label: 'Self Drive', icon: Key, color: '#3B82F6' },
  bus: { label: 'Bus Rental', icon: Bus, color: '#0EA5E9' },
  truck: { label: 'Transporter', icon: Truck, color: '#EF4444' },
  luxury: { label: 'Luxury Car', icon: Gem, color: '#F59E0B' },
  packers: { label: 'Packers & Movers', icon: Package, color: '#14B8A6' },
  equipment: { label: 'Equipment Rental', icon: Wrench, color: '#8B5CF6' },
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(new Date(value));
};

export default function ManagerCoverageGapsPage() {
  const [gaps, setGaps] = useState<GapRecord[]>([]);
  const [byLocation, setByLocation] = useState<LocationGap[]>([]);
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [locationsAffected, setLocationsAffected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [service, setService] = useState('');

  const fetchData = useCallback(async (quiet = false) => {
    if (quiet) setIsRefreshing(true); else setIsLoading(true);
    try {
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (service) params.set('service', service);
      const res = await fetch(`/api/manager/vendors/coverage-gaps?${params}`);
      const data = await res.json();
      if (data.success) {
        setGaps(data.gaps || []);
        setByLocation(data.byLocation || []);
        setTotal(data.total || 0);
        setTodayCount(data.todayCount || 0);
        setWeekCount(data.weekCount || 0);
        setLocationsAffected(data.locationsAffected || 0);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, service]);

  useManagerPageHeader(
    'Coverage Gaps',
    'Inquiries from your assigned locations where no vendor was eligible to receive them',
    <button
      key="refresh"
      onClick={() => fetchData(true)}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6 pb-10">

      {/* ══ STATS & CONTROLS ════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total', value: total, color: 'bg-gray-50 border-gray-200 text-gray-700' },
            { label: 'Today', value: todayCount, color: 'bg-red-50 border-red-200 text-red-600' },
            { label: 'This Week', value: weekCount, color: 'bg-amber-50 border-amber-200 text-amber-600' },
            { label: 'Locations', value: locationsAffected, color: 'bg-indigo-50 border-indigo-200 text-indigo-600' },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${s.color}`}>
              <span className="text-xl font-black">{isLoading ? '—' : s.value}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 opacity-80">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* ══ FILTERS ═════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by location, customer, request no…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        >
          <option value="">All Services</option>
          {Object.entries(SERVICE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-11 h-11 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-44 bg-gray-100 rounded" />
                <div className="h-2.5 w-28 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ══ LOCATION BREAKDOWN ══════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-800">Your Locations Without an Available Vendor</h2>
              <p className="text-xs text-gray-400 mt-0.5">Where to prioritize vendor recruitment</p>
            </div>
            {byLocation.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                  <MapPinOff className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No coverage gaps recorded</p>
                <p className="text-xs text-gray-400 mt-1">Every inquiry in your locations found an eligible vendor</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {byLocation.map((loc) => (
                  <div key={loc.locationName} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <MapPinOff className="w-4.5 h-4.5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{loc.locationName}</p>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        {loc.count}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-12">
                      {loc.byService.map((s) => {
                        const meta = SERVICE_META[s.serviceType];
                        const Icon = meta?.icon || Package;
                        return (
                          <span
                            key={s.serviceType}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[0.7rem] font-medium text-gray-600"
                          >
                            <Icon className="w-3 h-3" style={{ color: meta?.color }} />
                            {meta?.label || s.serviceType}
                            <span className="text-gray-400">{s.count}</span>
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 ml-12">Last inquiry {formatDateTime(loc.lastInquiry)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ INDIVIDUAL RECORDS ══════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
              <p className="text-sm font-semibold text-gray-600">
                {total === 0 ? 'No coverage-gap inquiries found' : `Showing ${gaps.length} of ${total} inquiries`}
              </p>
            </div>

            {gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <MapPinOff className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">No coverage-gap inquiries found</p>
                {(search || service) && <p className="text-xs text-gray-400 mt-1">Try a different filter</p>}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {gaps.map((gap) => {
                  const meta = SERVICE_META[gap.serviceType];
                  const Icon = meta?.icon || Package;
                  return (
                    <div key={gap.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${meta?.color || '#94a3b8'}1a` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: meta?.color || '#64748b' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-gray-500 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> {gap.requestNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            {meta?.label || gap.serviceType}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{gap.locationName}</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {gap.customerName}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
                        <Calendar className="w-3 h-3" /> {formatDateTime(gap.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
