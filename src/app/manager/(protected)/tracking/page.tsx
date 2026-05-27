'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, Store, User, Phone, Search, RefreshCcw, Play, Pause,
  Navigation, AlertTriangle, Users, Car,
} from 'lucide-react';
import LiveMap, { LiveMarker } from '@/components/tracking/LiveMap';

interface MgrDriver {
  id: string; name: string; phone: string; profilePhoto: string | null; vendorName: string | null;
  independent: boolean;
  status: 'moving' | 'idle' | 'offline'; speed: number; heading: number;
  lat: number; lng: number; updatedAt: string | null;
}
interface MgrVendor {
  id: string; name: string; city: string | null; status: string; logo: string | null;
  slug: string | null; driverCount: number; lat: number; lng: number;
}

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
  const [stats, setStats] = useState({ vendors: 0, drivers: 0, vendorDrivers: 0, independentDrivers: 0, driversLive: 0 });
  const [filter, setFilter] = useState<Filter>('all');
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
      setDrivers(data.drivers); setVendors(data.vendors); setStats(data.stats); setError(null);
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

  const fDrivers = useMemo(
    () => drivers.filter((d) => {
      if (d.independent ? !showIndependent : !showVendorDrivers) return false;
      return d.name.toLowerCase().includes(q) || (d.vendorName || '').toLowerCase().includes(q);
    }),
    [drivers, showVendorDrivers, showIndependent, q],
  );
  const fVendors = useMemo(
    () => (showVendors ? vendors.filter((v) => v.name.toLowerCase().includes(q) || (v.city || '').toLowerCase().includes(q)) : []),
    [vendors, showVendors, q],
  );

  const markers: LiveMarker[] = useMemo(() => {
    const dm: LiveMarker[] = fDrivers.map((d) => ({
      id: `d_${d.id}`, lat: d.lat, lng: d.lng, heading: d.heading,
      color: DRIVER_STATUS[d.status].hex, label: d.name,
      sublabel: d.vendorName || (d.status === 'moving' ? `${d.speed} km/h` : DRIVER_STATUS[d.status].label),
      icon: 'driver', pulse: d.status !== 'offline', photo: d.profilePhoto,
    }));
    const vm: LiveMarker[] = fVendors.map((v) => ({
      id: `v_${v.id}`, lat: v.lat, lng: v.lng, color: VENDOR_HEX,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-500 text-sm">Vendors and drivers across your locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLive(!isLive)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isLive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} {isLive ? 'Live' : 'Paused'}
          </button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip value="all" label="All" icon={MapPin} />
          <FilterChip value="vendor-drivers" label={`Vendor Drivers (${stats.vendorDrivers})`} icon={Car} />
          <FilterChip value="independent" label={`Independent (${stats.independentDrivers})`} icon={User} />
          <FilterChip value="vendors" label={`Vendors (${stats.vendors})`} icon={Store} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5 ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {stats.driversLive} drivers live now
        </span>
      </div>

      {/* Main: list + map */}
      <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col max-h-[70vh]">
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
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden h-[70vh]">
          {markers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <Navigation className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">No locations to show</p>
              <p className="text-gray-400 text-sm">Vendors plot at their city; drivers appear once they share live location.</p>
            </div>
          ) : (
            <LiveMap markers={markers} selectedId={selectedId} onMarkerClick={setSelectedId} />
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
