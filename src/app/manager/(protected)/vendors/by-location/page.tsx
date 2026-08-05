'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin, AlertCircle, Users, CheckCircle2, RefreshCw, Search, ChevronRight,
  MapPinOff, Layers, Building2, Plane, Home, TreePine, Globe2,
} from 'lucide-react';

interface LocationRow {
  locationId: string;
  locationName: string;
  locationType: string;
  total: number;
  active: number;
  servicesCovered: number;
  serviceVendors: { id: string; businessName: string }[] | null;
}

const LOCATION_TYPES = ['COUNTRY', 'STATE', 'UNION_TERRITORY', 'CITY', 'AREA', 'AIRPORT', 'VILLAGE'];

const SERVICE_LABELS: Record<string, string> = {
  bike: 'Bike Rental',
  'self-drive': 'Self Drive',
  bus: 'Bus Rental',
  truck: 'Transporter',
  luxury: 'Luxury Car',
  packers: 'Packers & Movers',
  equipment: 'Equipment Rental',
};

const TYPE_ICON: Record<string, any> = {
  COUNTRY: Globe2,
  STATE: Layers,
  UNION_TERRITORY: Layers,
  CITY: Building2,
  AREA: Home,
  AIRPORT: Plane,
  VILLAGE: TreePine,
};

export default function ManagerVendorsByLocationPage() {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [activeLinks, setActiveLinks] = useState(0);
  const [coreServiceCount, setCoreServiceCount] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [type, setType] = useState('');
  const [service, setService] = useState('');

  const fetchData = useCallback(async (quiet = false) => {
    if (quiet) setIsRefreshing(true); else setIsLoading(true);
    try {
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (service) params.set('service', service);
      const res = await fetch(`/api/manager/vendors/by-location?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.locations || []);
        setTotalLinks(data.totalLinks || 0);
        setActiveLinks(data.activeLinks || 0);
        setCoreServiceCount(data.coreServiceCount || 7);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, type, service]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6 pb-10">

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 10% 60%, #10b981 0%, transparent 50%), radial-gradient(circle at 90% 20%, #059669 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">My Coverage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">Location Coverage</h1>
            <p className="text-slate-400 text-sm">How many approved vendors — and which services — serve each of your assigned locations</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Summary pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Locations', value: rows.length, color: 'bg-white/10 border-white/15 text-white' },
                { label: 'Approvals', value: totalLinks, color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
                { label: 'Active', value: activeLinks, color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${s.color}`}>
                  <span className="text-xl font-black">{isLoading ? '—' : s.value}</span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 opacity-80">{s.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="shrink-0 p-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
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
            placeholder="Search your locations…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
        >
          <option value="">All Location Types</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
        >
          <option value="">All Services</option>
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* ══ TABLE ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <p className="text-sm font-semibold text-gray-600">
            {isLoading
              ? 'Loading…'
              : service
              ? `${rows.length} location${rows.length === 1 ? '' : 's'} covering ${SERVICE_LABELS[service]}`
              : `${rows.length} location${rows.length === 1 ? '' : 's'} with an approved vendor`}
          </p>
          <Link
            href="/manager/vendors/coverage-gaps"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-full"
          >
            <MapPinOff className="w-3.5 h-3.5" />
            Locations with NO vendor
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-11 h-11 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 bg-gray-100 rounded" />
                  <div className="h-2.5 w-20 bg-gray-50 rounded" />
                </div>
                <div className="h-8 w-24 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              {service ? `No locations covering ${SERVICE_LABELS[service]}` : 'No locations with an approved vendor'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search || type || service ? 'Try a different filter' : 'None of your assigned locations have an approved vendor yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Location</span>
              <span className="text-right">Total Vendors</span>
              <span className="text-right w-32">Coverage</span>
              <span className="text-right">{service ? SERVICE_LABELS[service] : 'Services'}</span>
              <span></span>
            </div>

            <div className="divide-y divide-gray-50">
              {rows.map((row) => {
                const Icon = TYPE_ICON[row.locationType] || MapPin;
                const pct = row.total > 0 ? Math.round((row.active / row.total) * 100) : 0;
                const servicesFull = row.servicesCovered === coreServiceCount;
                const servicesZero = row.servicesCovered === 0;
                return (
                  <Link
                    key={row.locationId}
                    href={`/manager/vendors/by-location/${row.locationId}`}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{row.locationName}</p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{row.locationType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 flex items-center justify-end gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {row.total}
                      </p>
                    </div>

                    <div className="text-right shrink-0 w-32">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          {row.active} active
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 max-w-[12rem]">
                      {row.serviceVendors ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {row.serviceVendors.length} vendor{row.serviceVendors.length === 1 ? '' : 's'}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1 truncate">
                            {row.serviceVendors.map((v) => v.businessName).join(', ')}
                          </p>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            servicesFull ? 'bg-emerald-50 text-emerald-700' : servicesZero ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          {row.servicesCovered}/{coreServiceCount}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all justify-self-end" />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
