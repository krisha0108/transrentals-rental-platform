'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Plus, Trash2, Save, Loader2, ArrowRight,
  Clock, AlertCircle, ArrowLeft,
  Search, Pencil, Route, ShieldCheck, X, ChevronDown, Wand2, CheckCircle,
  Layers, CheckSquare, Square,
} from 'lucide-react';

interface Location { id: string; name: string; slug: string; }

interface CityDistance {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  distanceKm: number;
  durationMinutes: number | null;
  durationText: string | null;
  routeVia: string | null;
  tollEstimate: number | null;
  statePermit: boolean;
  isVerified: boolean;
  source: string | null;
  isActive: boolean;
  fromLocation: { id: string; name: string; slug: string };
  toLocation: { id: string; name: string; slug: string };
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

const defaultFormData = {
  fromLocationId: '',
  toLocationId: '',
  distanceKm: 0,
  durationMinutes: 0,
  durationText: '',
  routeVia: '',
  tollEstimate: 0,
  statePermit: false,
  isVerified: false,
  source: 'manual',
  isActive: true,
  createReverse: true,
};

// Searchable dropdown component
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  excludeId,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Location[];
  placeholder: string;
  excludeId?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) => o.id !== excludeId && o.name.toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(''); }}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-left bg-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2"
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search city..."
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 text-left"
              >
                — Clear
              </button>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition ${
                  value === o.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                {o.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">No cities found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceDistancesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [distances, setDistances] = useState<CityDistance[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ source: string; label: string } | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Bulk auto-fetch state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<'intra' | 'inter'>('intra');
  const [bulkStateName, setBulkStateName] = useState('');
  const [bulkStateNameB, setBulkStateNameB] = useState('');
  const [bulkOverwrite, setBulkOverwrite] = useState(false);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkError, setBulkError] = useState('');

  const fetchData = async () => {
    try {
      const [distancesRes, locationsRes] = await Promise.all([
        fetch('/api/admin/distances'),
        fetch(`/api/services/${serviceSlug}/locations`),
      ]);
      const distancesData = await distancesRes.json();
      const locationsData = await locationsRes.json();
      if (distancesData.success) setDistances(distancesData.distances);
      if (locationsData.success) setLocations(locationsData.locations || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setFetchStatus(null);
    setError('');
    setShowForm(true);
  };

  const handleAutoFetch = async () => {
    if (!formData.fromLocationId || !formData.toLocationId) return;
    setIsFetching(true);
    setFetchStatus(null);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/distances/auto-fetch?from=${formData.fromLocationId}&to=${formData.toLocationId}`
      );
      const data = await res.json();
      if (data.success) {
        const d = data.distance;
        setFormData((prev) => ({
          ...prev,
          distanceKm: d.distanceKm ?? prev.distanceKm,
          durationMinutes: d.durationMinutes ?? prev.durationMinutes,
          durationText: d.durationText || '',
          routeVia: d.routeVia || prev.routeVia,
          tollEstimate: d.tollEstimate ?? prev.tollEstimate,
          statePermit: d.statePermit ?? prev.statePermit,
          isVerified: data.source === 'osrm' ? false : (d.isVerified ?? prev.isVerified),
        }));
        setFetchStatus({ source: data.source, label: data.sourceLabel });
      } else {
        setError(data.reason || data.error || 'Could not auto-fetch distance');
      }
    } catch {
      setError('Auto-fetch failed. Please enter distance manually.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleEdit = (d: CityDistance) => {
    setFetchStatus(null);
    setError('');
    setFormData({
      fromLocationId: d.fromLocationId,
      toLocationId: d.toLocationId,
      distanceKm: d.distanceKm,
      durationMinutes: d.durationMinutes || 0,
      durationText: d.durationText || '',
      routeVia: d.routeVia || '',
      tollEstimate: d.tollEstimate || 0,
      statePermit: d.statePermit,
      isVerified: d.isVerified,
      source: d.source || 'manual',
      isActive: d.isActive,
      createReverse: false,
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/distances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) { setShowForm(false); fetchData(); }
      else setError(data.error || 'Failed to save distance');
    } catch {
      setError('Failed to save distance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this distance route?')) return;
    try {
      const res = await fetch(`/api/admin/distances?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error || 'Failed to delete');
    } catch { alert('Failed to delete'); }
  };

  const handleBulkFetch = async () => {
    if (bulkMode === 'intra' && !bulkStateName.trim()) { setBulkError('Please select a state'); return; }
    if (bulkMode === 'inter' && (!bulkStateName.trim() || !bulkStateNameB.trim())) { setBulkError('Please select both states'); return; }
    if (bulkMode === 'inter' && bulkStateName === bulkStateNameB) { setBulkError('State A and State B must be different'); return; }
    setIsBulkRunning(true);
    setBulkResult(null);
    setBulkError('');
    try {
      const body = bulkMode === 'inter'
        ? { mode: 'inter', stateNameA: bulkStateName, stateNameB: bulkStateNameB, serviceSlug, overwrite: bulkOverwrite, createReverse: true }
        : { mode: 'intra', stateName: bulkStateName, serviceSlug, overwrite: bulkOverwrite, createReverse: true };
      const res = await fetch('/api/admin/distances/bulk-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(data.summary);
        fetchData(); // refresh distances list
      } else {
        setBulkError(data.error || 'Bulk fetch failed');
      }
    } catch {
      setBulkError('Request failed. Please try again.');
    } finally {
      setIsBulkRunning(false);
    }
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60), m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const filtered = useMemo(() => {
    return distances.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        d.fromLocation.name.toLowerCase().includes(q) ||
        d.toLocation.name.toLowerCase().includes(q) ||
        (d.routeVia || '').toLowerCase().includes(q);
      const matchFrom = !filterFrom || d.fromLocationId === filterFrom;
      const matchTo = !filterTo || d.toLocationId === filterTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [distances, search, filterFrom, filterTo]);

  const grouped = useMemo(() => {
    const g: Record<string, CityDistance[]> = {};
    filtered.forEach((d) => {
      const key = d.fromLocation.name;
      if (!g[key]) g[key] = [];
      g[key].push(d);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: distances.length,
    verified: distances.filter((d) => d.isVerified).length,
    origins: new Set(distances.map((d) => d.fromLocationId)).size,
    withToll: distances.filter((d) => d.tollEstimate && d.tollEstimate > 0).length,
  }), [distances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div>
        <Link href={`/admin/services/${serviceSlug}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to {serviceTitle}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Distance Matrix</h1>
            <p className="text-sm text-gray-500 mt-0.5">City-to-city distances for outstation pricing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBulk(true); setBulkResult(null); setBulkError(''); setBulkStateName(''); setBulkStateNameB(''); setBulkMode('intra'); }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-purple-200 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition"
            >
              <Layers className="w-4 h-4" /> Bulk by State
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Route
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Routes', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Origin Cities', value: stats.origins, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Verified', value: stats.verified, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'With Toll Data', value: stats.withToll, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3.5 flex items-center gap-3`}>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
        <span>
          <strong>Pricing priority:</strong> Distance Matrix + City Pricing takes precedence over Route Packages. Add both to enable dynamic date-based pricing for a route.
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {/* Text search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by city name or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* From filter — searchable */}
        <div className="w-52">
          <SearchableSelect
            value={filterFrom}
            onChange={setFilterFrom}
            options={locations}
            placeholder="All Origins"
          />
        </div>

        {/* To filter — searchable */}
        <div className="w-52">
          <SearchableSelect
            value={filterTo}
            onChange={setFilterTo}
            options={locations}
            placeholder="All Destinations"
          />
        </div>

        {(search || filterFrom || filterTo) && (
          <button
            onClick={() => { setSearch(''); setFilterFrom(''); setFilterTo(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white"
          >
            Clear
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} route{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Routes — Grouped by Origin, Horizontal Cards */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(grouped).map(([fromCity, items]) => (
            <div key={fromCity}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800">From {fromCity}</span>
                <span className="text-xs text-gray-400">· {items.length} destination{items.length > 1 ? 's' : ''}</span>
              </div>

              {/* Horizontal cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    {/* Destination name + actions */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-900 truncate">{d.toLocation.name}</span>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(d)}
                          className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Distance */}
                    <p className="text-xl font-bold text-gray-900 leading-none">
                      {d.distanceKm} <span className="text-xs font-normal text-gray-400">km</span>
                    </p>

                    {/* Duration */}
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {d.durationText || formatDuration(d.durationMinutes)}
                    </p>

                    {/* Route via */}
                    {d.routeVia && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate" title={d.routeVia}>
                        {d.routeVia}
                      </p>
                    )}

                    {/* Toll */}
                    {d.tollEstimate ? (
                      <p className="text-xs text-orange-500 mt-1">Toll ₹{d.tollEstimate}</p>
                    ) : null}

                    {/* Badges */}
                    {(d.isVerified || d.statePermit) && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {d.isVerified && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] rounded-full border border-green-100">
                            <ShieldCheck className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                        {d.statePermit && (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded-full border border-purple-100">
                            Permit
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Route className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            {distances.length === 0 ? 'No routes configured yet' : 'No routes match your filters'}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {distances.length === 0
              ? 'Add city-to-city distances to enable dynamic outstation pricing'
              : 'Try adjusting your search or filters'}
          </p>
          {distances.length === 0 && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add First Route
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? 'Edit Route' : 'Add Route Distance'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Route selector with searchable dropdowns */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From City *</label>
                    <SearchableSelect
                      value={formData.fromLocationId}
                      onChange={(v) => { setFormData({ ...formData, fromLocationId: v }); setFetchStatus(null); }}
                      options={locations}
                      placeholder="Select origin"
                      excludeId={formData.toLocationId}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To City *</label>
                    <SearchableSelect
                      value={formData.toLocationId}
                      onChange={(v) => { setFormData({ ...formData, toLocationId: v }); setFetchStatus(null); }}
                      options={locations}
                      placeholder="Select destination"
                      excludeId={formData.fromLocationId}
                    />
                  </div>
                </div>

                {/* Auto-fetch button — shows when both cities selected */}
                {formData.fromLocationId && formData.toLocationId && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleAutoFetch}
                      disabled={isFetching}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 transition"
                    >
                      {isFetching
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching...</>
                        : <><Wand2 className="w-3.5 h-3.5" /> Auto-fetch Distance</>
                      }
                    </button>
                    {fetchStatus && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        fetchStatus.source === 'osrm'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        Filled from {fetchStatus.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Distance + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    value={formData.distanceKm || ''}
                    onChange={(e) => setFormData({ ...formData, distanceKm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 215"
                    required min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes || ''}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 180"
                  />
                </div>
              </div>

              {/* Toll + Route Via */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Toll Estimate (₹)</label>
                  <input
                    type="number"
                    value={formData.tollEstimate || ''}
                    onChange={(e) => setFormData({ ...formData, tollEstimate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Route Via</label>
                  <input
                    type="text"
                    value={formData.routeVia}
                    onChange={(e) => setFormData({ ...formData, routeVia: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Via NH48"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-1">
                {[
                  { key: 'statePermit', label: 'State Permit Required' },
                  { key: 'isVerified', label: 'Verified Distance' },
                  { key: 'createReverse', label: 'Create Both Directions', hide: !!editingId },
                ].filter((c) => !c.hide).map((c) => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData as any)[c.key]}
                      onChange={(e) => setFormData({ ...formData, [c.key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">{c.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk by State Modal ── */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-900">Bulk Auto-fetch Routes</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically calculate distances for all city pairs in a state
                </p>
              </div>
              <button onClick={() => setShowBulk(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Mode toggle */}
              {!bulkResult && (
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setBulkMode('intra'); setBulkStateName(''); setBulkStateNameB(''); setBulkError(''); }}
                    className={`flex-1 py-2 text-sm font-medium transition ${
                      bulkMode === 'intra'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Within a State
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBulkMode('inter'); setBulkStateName(''); setBulkStateNameB(''); setBulkError(''); }}
                    className={`flex-1 py-2 text-sm font-medium transition border-l border-gray-200 ${
                      bulkMode === 'inter'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    State A → State B
                  </button>
                </div>
              )}

              {/* How it works */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-800 space-y-1">
                <p className="font-semibold">How it works:</p>
                {bulkMode === 'intra' ? (
                  <>
                    <p>1. Geocodes cities without coordinates via OpenStreetMap (free)</p>
                    <p>2. Calls OSRM routing — single batch call returns all distances at once</p>
                    <p>3. Saves all city pairs within the selected state</p>
                  </>
                ) : (
                  <>
                    <p>1. Loads cities from State A and State B separately</p>
                    <p>2. OSRM computes only A→B distances (efficient, not full N×N)</p>
                    <p>3. Saves all inter-state routes in both directions</p>
                  </>
                )}
                <p className="text-purple-500 mt-1">⏱ May take 30–90s if many cities need geocoding</p>
              </div>

              {bulkError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {bulkError}
                </div>
              )}

              {/* Result summary */}
              {bulkResult ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <CheckCircle className="w-4 h-4" /> Bulk fetch completed!
                  </div>
                  {/* Inter-state: citiesFound is an object */}
                  {typeof bulkResult.citiesFound === 'object' && bulkResult.citiesFound !== null ? (
                    <div className="text-xs text-gray-600 bg-white rounded-lg p-2.5 border border-green-100">
                      {Object.entries(bulkResult.citiesFound).map(([state, count]) => (
                        <p key={state}><strong>{state}:</strong> {count as number} cities</p>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ...(typeof bulkResult.citiesFound !== 'object'
                        ? [{ label: 'Cities found', value: bulkResult.citiesFound, color: 'text-gray-900' }]
                        : [{ label: 'Cities with coords', value: bulkResult.citiesWithCoords, color: 'text-gray-900' }]),
                      { label: 'Routes added', value: bulkResult.routesAdded, color: 'text-green-600' },
                      { label: 'Skipped (exist)', value: bulkResult.routesSkipped, color: 'text-gray-400' },
                      { label: 'Geocoded', value: bulkResult.geocodedCities?.length || 0, color: 'text-purple-600' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-lg p-2.5 border border-green-100">
                        <p className="text-gray-400">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {bulkResult.failedGeocoding?.length > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                      <p className="font-medium mb-1">⚠ Could not geocode (add lat/lon manually):</p>
                      <p>{bulkResult.failedGeocoding.join(', ')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* State selector(s) */}
                  {bulkMode === 'intra' ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">State *</label>
                      <SearchableSelect
                        value={bulkStateName}
                        onChange={setBulkStateName}
                        options={Array.from(new Set(
                          (locations as any[]).map((l) => l.state).filter(Boolean)
                        )).sort().map((s: any) => ({ id: s, name: s, slug: s }))}
                        placeholder="Select state"
                      />
                      {bulkStateName && (() => {
                        const n = (locations as any[]).filter((l) => l.state === bulkStateName).length;
                        return (
                          <p className="text-xs text-gray-400 mt-1.5">
                            <strong>{n} cities</strong> → up to <strong>{n * (n - 1)} routes</strong> (both directions)
                          </p>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">State A (source) *</label>
                        <SearchableSelect
                          value={bulkStateName}
                          onChange={setBulkStateName}
                          options={Array.from(new Set(
                            (locations as any[]).map((l) => l.state).filter(Boolean)
                          )).sort().map((s: any) => ({ id: s, name: s, slug: s }))}
                          placeholder="Select State A"
                          excludeId={bulkStateNameB}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-t border-dashed border-gray-200" />
                        <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div className="flex-1 border-t border-dashed border-gray-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">State B (destination) *</label>
                        <SearchableSelect
                          value={bulkStateNameB}
                          onChange={setBulkStateNameB}
                          options={Array.from(new Set(
                            (locations as any[]).map((l) => l.state).filter(Boolean)
                          )).sort().map((s: any) => ({ id: s, name: s, slug: s }))}
                          placeholder="Select State B"
                          excludeId={bulkStateName}
                        />
                      </div>
                      {bulkStateName && bulkStateNameB && (() => {
                        const nA = (locations as any[]).filter((l) => l.state === bulkStateName).length;
                        const nB = (locations as any[]).filter((l) => l.state === bulkStateNameB).length;
                        return (
                          <p className="text-xs text-gray-400">
                            <strong>{nA}</strong> cities in {bulkStateName} × <strong>{nB}</strong> cities in {bulkStateNameB} = up to <strong>{nA * nB * 2}</strong> routes (both directions)
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={bulkOverwrite}
                      onChange={(e) => setBulkOverwrite(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300" />
                    <div>
                      <span className="text-sm text-gray-700">Overwrite existing routes</span>
                      <p className="text-xs text-gray-400">Uncheck to skip routes already in DB</p>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 pb-5 border-t pt-4">
              <button type="button" onClick={() => setShowBulk(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                {bulkResult ? 'Close' : 'Cancel'}
              </button>
              {bulkResult ? (
                <button type="button"
                  onClick={() => { setBulkResult(null); setBulkStateName(''); setBulkStateNameB(''); setBulkError(''); setBulkMode('intra'); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  <Layers className="w-4 h-4" /> Fetch Another
                </button>
              ) : (
                <button type="button" onClick={handleBulkFetch}
                  disabled={isBulkRunning || !bulkStateName || (bulkMode === 'inter' && !bulkStateNameB)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-60 transition">
                  {isBulkRunning
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    : <><Wand2 className="w-4 h-4" /> Start Bulk Fetch</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
