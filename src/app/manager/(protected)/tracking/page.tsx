'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, Store, User, Phone, Search, RefreshCcw, Play, Pause,
  Navigation, AlertTriangle, Car, Map as MapIcon, X,
} from 'lucide-react';
import LiveMap, { LiveMarker } from '@/components/tracking/LiveMap';

interface MgrDriver {
  id: string; name: string; phone: string; profilePhoto: string | null; vendorName: string | null;
  city: string | null; state: string | null; independent: boolean;
  status: 'moving' | 'idle' | 'offline'; speed: number; heading: number;
  lat: number | null; lng: number | null; updatedAt: string | null;
}
interface MgrVendor {
  id: string; name: string; city: string | null; state: string | null; status: string; logo: string | null;
  slug: string | null; driverCount: number; lat: number | null; lng: number | null;
}
interface StateCount { state: string; vendors: number; drivers: number; total: number; }

const DRIVER_STATUS = {
  moving: { hex: '#16a34a', dot: 'bg-green-500', text: 'text-green-600', label: 'Moving' },
  idle: { hex: '#ca8a04', dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Idle' },
  offline: { hex: '#9ca3af', dot: 'bg-gray-400', text: 'text-gray-500', label: 'Offline' },
} as const;
const VENDOR_HEX = '#6366f1';
const POLL_MS = 10000;
type Filter = 'all' | 'vendor-drivers' | 'independent' | 'vendors';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return s <= 5 ? 'just now' : `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

export default function ManagerTrackingPage() {
  const [drivers, setDrivers] = useState<MgrDriver[]>([]);
  const [vendors, setVendors] = useState<MgrVendor[]>([]);
  const [stateCounts, setStateCounts] = useState<StateCount[]>([]);
  const [stats, setStats] = useState({ vendors: 0, drivers: 0, vendorDrivers: 0, independentDrivers: 0, driversLive: 0 });
  const [filter, setFilter] = useState<Filter>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/tracking/live', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setDrivers(data.drivers); setVendors(data.vendors); setStats(data.stats);
      setStateCounts(data.stateCounts || []); setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tracking');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isLive, load]);

  const q = search.toLowerCase();
  const showVendorDrivers = filter === 'all' || filter === 'vendor-drivers';
  const showIndependent = filter === 'all' || filter === 'independent';
  const showVendors = filter === 'all' || filter === 'vendors';

  // City list for the location filter — scoped to the selected state (if
  // any) so the dropdown only ever offers cities that actually narrow the
  // current view further, from vendors + vendor-driver + independent-driver
  // cities.
  const cities = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => { if (v.city && (stateFilter === 'all' || v.state === stateFilter)) set.add(v.city); });
    drivers.forEach((d) => { if (d.city && (stateFilter === 'all' || d.state === stateFilter)) set.add(d.city); });
    return Array.from(set).sort();
  }, [vendors, drivers, stateFilter]);
  const cityOk = (c: string | null) => cityFilter === 'all' || c === cityFilter;
  // Case-insensitive — the state chip's label comes from the API's
  // normalized grouping, but individual records keep their raw (possibly
  // differently-cased) state string.
  const stateOk = (s: string | null) => stateFilter === 'all' || (!!s && s.trim().toLowerCase() === stateFilter.trim().toLowerCase());

  const fDrivers = useMemo(
    () => drivers.filter((d) => {
      if (d.independent ? !showIndependent : !showVendorDrivers) return false;
      if (!stateOk(d.state) || !cityOk(d.city)) return false;
      return d.name.toLowerCase().includes(q) || (d.vendorName || '').toLowerCase().includes(q);
    }),
    [drivers, showVendorDrivers, showIndependent, q, cityFilter, stateFilter],
  );
  const fVendors = useMemo(
    () => (showVendors ? vendors.filter((v) => stateOk(v.state) && cityOk(v.city) && (v.name.toLowerCase().includes(q) || (v.city || '').toLowerCase().includes(q))) : []),
    [vendors, showVendors, q, cityFilter, stateFilter],
  );

  const markers: LiveMarker[] = useMemo(() => {
    const dm: LiveMarker[] = fDrivers
      .filter((d) => d.lat != null && d.lng != null)
      .map((d) => ({
        id: `d_${d.id}`, lat: d.lat as number, lng: d.lng as number, heading: d.heading,
        color: DRIVER_STATUS[d.status].hex, label: d.name,
        sublabel: d.vendorName || (d.status === 'moving' ? `${d.speed} km/h` : DRIVER_STATUS[d.status].label),
        icon: 'driver', pulse: d.status !== 'offline', photo: d.profilePhoto,
      }));
    const vm: LiveMarker[] = fVendors
      .filter((v) => v.lat != null && v.lng != null)
      .map((v) => ({
        id: `v_${v.id}`, lat: v.lat as number, lng: v.lng as number, color: VENDOR_HEX,
        label: v.name, sublabel: `${v.city || ''}${v.driverCount ? ` · ${v.driverCount} drivers` : ''}`,
        icon: 'vendor',
      }));
    return [...vm, ...dm];
  }, [fDrivers, fVendors]);

  const FilterChip = ({ value, label, icon: Icon }: { value: Filter; label: string; icon: any }) => (
    <button
      onClick={() => setFilter(value)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === value ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-4 pb-10">
      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 10% 60%, #10b981 0%, transparent 50%), radial-gradient(circle at 90% 20%, #059669 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">Live Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">Vendors &amp; Drivers</h1>
            <p className="text-slate-400 text-sm">Real-time locations across your assigned cities</p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Vendors', value: stats.vendors, color: 'bg-white/10 border-white/15 text-white' },
                { label: 'Vendor Drivers', value: stats.vendorDrivers, color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
                { label: 'Independent', value: stats.independentDrivers, color: 'bg-violet-500/20 border-violet-400/30 text-violet-300' },
                { label: 'Live Now', value: stats.driversLive, color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${s.color}`}>
                  <span className="text-xl font-black">{loading ? '—' : s.value}</span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 opacity-80">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isLive ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-white/10 border-white/15 text-white'}`}
              >
                {isLive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} {isLive ? 'Live' : 'Paused'}
              </button>
              <button
                onClick={load}
                className="p-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 transition-colors"
                title="Refresh"
              >
                <RefreshCcw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STATE-WISE COUNTS ═══════════════════════════════════════ */}
      {stateCounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Coverage by State</p>
            {stateFilter !== 'all' && (
              <button
                onClick={() => { setStateFilter('all'); setCityFilter('all'); }}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-1 rounded-full"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stateCounts.map((s) => {
              const active = stateFilter === s.state;
              return (
                <button
                  key={s.state}
                  onClick={() => { setStateFilter(active ? 'all' : s.state); setCityFilter('all'); }}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-left transition-colors ${
                    active ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold whitespace-nowrap">{s.state}</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {s.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip value="all" label="All" icon={MapPin} />
          <FilterChip value="vendor-drivers" label={`Vendor Drivers (${stats.vendorDrivers})`} icon={Car} />
          <FilterChip value="independent" label={`Independent (${stats.independentDrivers})`} icon={User} />
          <FilterChip value="vendors" label={`Vendors (${stats.vendors})`} icon={Store} />
        </div>
        {cities.length > 0 && (
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {stats.driversLive} drivers live now
        </span>
      </div>

      {/* Main: list + map — both panels share one height so neither looks
          ragged next to the other; capped lower on mobile so the page
          doesn't turn into two independently-tall stacked boxes. */}
      <div className="grid lg:grid-cols-[20rem_1fr] gap-4 lg:h-[75vh] items-stretch">
        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-[50vh] lg:h-full">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendor / driver…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
            {!loading && error && <p className="p-4 text-sm text-red-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}

            {showVendors && fVendors.map((v) => (
              <button key={`v_${v.id}`} onClick={() => setSelectedId(`v_${v.id}`)}
                className={`flex items-center gap-3 w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 ${selectedId === `v_${v.id}` ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: VENDOR_HEX }}>
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.city} · {v.driverCount} drivers</p>
                </div>
              </button>
            ))}

            {fDrivers.map((d) => (
              <button key={`d_${d.id}`} onClick={() => setSelectedId(`d_${d.id}`)}
                className={`flex items-center gap-3 w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 ${selectedId === `d_${d.id}` ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                <div className="relative shrink-0">
                  {d.profilePhoto
                    ? <img src={d.profilePhoto} alt={d.name} className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: DRIVER_STATUS[d.status].hex }}>{d.name.charAt(0).toUpperCase()}</div>}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${DRIVER_STATUS[d.status].dot}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    {d.name}
                    {d.independent && <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full shrink-0">Independent</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{d.independent ? '' : `${d.vendorName || '—'} · `}{d.status === 'moving' ? `${d.speed} km/h` : DRIVER_STATUS[d.status].label}</p>
                </div>
                <a href={`tel:${d.phone}`} onClick={(e) => e.stopPropagation()} className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200"><Phone className="w-3.5 h-3.5 text-green-600" /></a>
              </button>
            ))}

            {!loading && !error && fVendors.length === 0 && fDrivers.length === 0 && (
              <p className="p-4 text-sm text-gray-400">Nothing to show for this filter.</p>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden h-[50vh] lg:h-full">
          {/* Map is ALWAYS rendered; an overlay shows when there are no live pins. */}
          <LiveMap markers={markers} selectedId={selectedId} onMarkerClick={setSelectedId} />
          {!loading && markers.length === 0 && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center text-center px-6 bg-white/70 backdrop-blur-[1px] pointer-events-none">
              <Navigation className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-gray-600 font-medium">No live locations to show</p>
              <p className="text-gray-400 text-sm">Drivers appear here once they share their live location.</p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow px-3 py-2 text-xs space-y-1.5">
            <p className="font-semibold text-gray-700 mb-1">Legend</p>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-green-500" /> Driver (live)</div>
            <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: VENDOR_HEX }} /> Vendor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
