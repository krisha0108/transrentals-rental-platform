'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, User, Phone, Clock, Search, RefreshCcw, Play, Pause,
  Route, Gauge, Navigation, Car, AlertTriangle,
} from 'lucide-react';
import LiveMap, { LiveMarker } from '@/components/tracking/LiveMap';

interface LiveDriver {
  id: string;
  name: string;
  phone: string;
  profilePhoto: string | null;
  status: 'moving' | 'idle' | 'offline';
  isSharingLocation: boolean;
  speed: number; // km/h
  heading: number;
  location: { lat: number; lng: number; accuracy: number | null; updatedAt: string } | null;
  vehicle: { id: string; name: string | null; number: string | null; color: string | null } | null;
  currentTrip: {
    bookingNumber: string; customer: string; from: string | null; to: string | null;
    status: string; startedAt: string | null;
  } | null;
}

const statusConfig = {
  moving: { label: 'Moving', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100', hex: '#16a34a' },
  idle: { label: 'Idle', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-100', hex: '#ca8a04' },
  offline: { label: 'Offline', color: 'bg-gray-400', textColor: 'text-gray-500', bgLight: 'bg-gray-100', hex: '#9ca3af' },
} as const;

const POLL_MS = 5000;

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return s <= 5 ? 'Just now' : `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export default function GPSTrackingPage() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([]);
  const [stats, setStats] = useState({ total: 0, sharing: 0, moving: 0, idle: 0, offline: 0, onTrip: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/tracking/live', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setDrivers(data.drivers);
      setStats(data.stats);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isLive, load]);

  const filtered = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      (d.vehicle?.number || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Only drivers with a real fix go on the map.
  const markers: LiveMarker[] = useMemo(
    () =>
      drivers
        .filter((d) => d.location)
        .map((d) => ({
          id: d.id,
          lat: d.location!.lat,
          lng: d.location!.lng,
          heading: d.heading,
          color: statusConfig[d.status].hex,
          label: d.name,
          sublabel: d.vehicle?.number || `${d.speed} km/h`,
          icon: 'driver' as const,
          pulse: d.status !== 'offline',
          photo: d.profilePhoto,
        })),
    [drivers],
  );

  const selected = drivers.find((d) => d.id === selectedId) || null;

  return (
    <div className="h-[calc(100dvh-80px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live GPS Tracking</h1>
            <p className="text-gray-600">Real-time location of drivers sharing their position</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {isLive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isLive ? 'Live' : 'Paused'}
            </button>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          <button className="bg-gray-50 rounded-lg p-3 text-center" onClick={() => setStatusFilter('all')}>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Drivers</p>
          </button>
          <button className="bg-green-50 rounded-lg p-3 text-center" onClick={() => setStatusFilter('moving')}>
            <p className="text-2xl font-bold text-green-600">{stats.moving}</p>
            <p className="text-xs text-green-600">Moving</p>
          </button>
          <button className="bg-yellow-50 rounded-lg p-3 text-center" onClick={() => setStatusFilter('idle')}>
            <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
            <p className="text-xs text-yellow-600">Idle</p>
          </button>
          <button className="bg-gray-100 rounded-lg p-3 text-center" onClick={() => setStatusFilter('offline')}>
            <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
            <p className="text-xs text-gray-600">Offline</p>
          </button>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.sharing}</p>
            <p className="text-xs text-blue-600">Sharing</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.onTrip}</p>
            <p className="text-xs text-indigo-600">On Trip</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search driver / vehicle…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="p-4 text-sm text-gray-400">Loading drivers…</p>}
            {!loading && error && (
              <p className="p-4 text-sm text-red-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No drivers match.</p>
            )}
            {filtered.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedId === d.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${statusConfig[d.status].color}`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.vehicle?.number || d.phone}</p>
                    </div>
                  </div>
                  {d.status === 'moving' && <span className="text-sm font-medium text-green-600">{d.speed} km/h</span>}
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{d.location ? `${d.location.lat.toFixed(4)}, ${d.location.lng.toFixed(4)}` : 'No location'}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{timeAgo(d.location?.updatedAt ?? null)}</span>
                  {d.currentTrip && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">On Trip</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative bg-gray-100">
          {markers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No live locations yet</p>
                <p className="text-gray-400 text-sm">Drivers appear here once they start sharing from the driver app.</p>
              </div>
            </div>
          ) : (
            <LiveMap markers={markers} selectedId={selectedId} onMarkerClick={setSelectedId} />
          )}

          {/* Selected driver card */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-md z-[1000]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[selected.status].bgLight} ${statusConfig[selected.status].textColor}`}>
                      {statusConfig[selected.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selected.vehicle?.name || 'No vehicle assigned'} {selected.vehicle?.number ? `· ${selected.vehicle.number}` : ''}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">×</button>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selected.name}</p>
                  <p className="text-xs text-gray-500">{selected.phone}</p>
                </div>
                <a href={`tel:${selected.phone}`} className="p-2 bg-green-100 rounded-full hover:bg-green-200">
                  <Phone className="w-4 h-4 text-green-600" />
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Gauge className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selected.speed}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Car className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selected.vehicle?.color || '—'}</p>
                  <p className="text-xs text-gray-500">Vehicle</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Clock className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{timeAgo(selected.location?.updatedAt ?? null)}</p>
                  <p className="text-xs text-gray-500">Updated</p>
                </div>
              </div>

              {selected.currentTrip && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-600">Active Trip</span>
                    <span className="text-xs text-indigo-600">{selected.currentTrip.bookingNumber}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selected.currentTrip.customer}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <span className="truncate max-w-[40%]">{selected.currentTrip.from || '—'}</span>
                    <Route className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[40%]">{selected.currentTrip.to || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
