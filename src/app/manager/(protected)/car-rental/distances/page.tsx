'use client';

import { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import {
  MapPin, Plus, Trash2, Save, Loader2, ArrowRight,
  Clock, AlertCircle, ArrowLeft,
  Search, Pencil, Route, ShieldCheck, X, ChevronDown, Wand2, CheckCircle,
  Layers, SlidersHorizontal, BadgeCheck,
} from 'lucide-react';

const SERVICE_SLUG = 'car-rental';

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

// Reusable toggle-switch look for a plain checkbox — the <input> keeps its
// normal checked/onChange wiring, only the visual track+thumb is decorative.
// Mirrors the pattern used on the manager Car Rental Routes/Packages pages.
function ToggleRow({
  checked, onChange, label, description, icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="w-9 h-5 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-gray-900">
          {icon}
          {label}
        </span>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

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

export default function ManagerDistancesPage() {
  useManagerPageHeader('Car Rental — Distance Matrix', 'City-to-city distances for outstation pricing');

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
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterPermit, setFilterPermit] = useState(false);

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
        fetch(`/api/services/${SERVICE_SLUG}/locations`),
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
        ? { mode: 'inter', stateNameA: bulkStateName, stateNameB: bulkStateNameB, serviceSlug: SERVICE_SLUG, overwrite: bulkOverwrite, createReverse: true }
        : { mode: 'intra', stateName: bulkStateName, serviceSlug: SERVICE_SLUG, overwrite: bulkOverwrite, createReverse: true };
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
      const matchVerified = !filterVerified || d.isVerified;
      const matchPermit = !filterPermit || d.statePermit;
      return matchSearch && matchFrom && matchTo && matchVerified && matchPermit;
    });
  }, [distances, search, filterFrom, filterTo, filterVerified, filterPermit]);

  const activeFilterCount = [
    search.trim(), filterFrom, filterTo,
    filterVerified ? 'verified' : '', filterPermit ? 'permit' : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setFilterFrom('');
    setFilterTo('');
    setFilterVerified(false);
    setFilterPermit(false);
  };

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
    <div className="space-y-5">

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <Link href="/manager/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBulk(true); setBulkResult(null); setBulkError(''); setBulkStateName(''); setBulkStateNameB(''); setBulkMode('intra'); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm border border-purple-200 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition"
          >
            <Layers className="w-3.5 h-3.5" /> Bulk by State
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Route
          </button>
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
          <div key={s.label} className={`${s.bg} rounded-xl p-3.5`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
        <span><strong>Priority:</strong> Distance Matrix + City Pricing beats Route Packages for date-based pricing.</span>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
              {activeFilterCount} active
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          {/* Text search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city name or route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <button
            type="button"
            onClick={() => setFilterVerified((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
              filterVerified
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${filterVerified ? 'text-green-600' : ''}`} />
            Verified
          </button>

          <button
            type="button"
            onClick={() => setFilterPermit((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
              filterPermit
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BadgeCheck className={`w-3.5 h-3.5 ${filterPermit ? 'text-purple-600' : ''}`} />
            Permit
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <span className="font-medium">Showing:</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {filtered.length} of {distances.length} routes
            </span>
          </div>
        )}
      </div>

      {/* Routes — Grouped by Origin */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([fromCity, items]) => (
            <div key={fromCity} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-lg font-semibold text-slate-700">From {fromCity}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-500 border border-slate-200">
                  {items.length} destination{items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Destination cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 p-3">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`h-1 ${d.isVerified ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className="p-2.5">
                      {/* Destination chip + actions */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold truncate">
                          <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{d.toLocation.name}</span>
                        </span>
                        <div className="flex gap-0 flex-shrink-0 -mt-1 -mr-1">
                          <button
                            onClick={() => handleEdit(d)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Distance */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-gray-900">{d.distanceKm}</span>
                        <span className="text-[10px] font-medium text-gray-400">km</span>
                      </div>

                      {/* Duration + Toll stat boxes */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        <div className="bg-gray-50 rounded-md px-2 py-1">
                          <p className="text-[9px] text-gray-400 uppercase tracking-wide flex items-center gap-0.5">
                            <Clock className="w-2 h-2" /> Duration
                          </p>
                          <p className="text-xs font-semibold text-gray-700 truncate">
                            {d.durationText || formatDuration(d.durationMinutes)}
                          </p>
                        </div>
                        {d.tollEstimate ? (
                          <div className="bg-orange-50 rounded-md px-2 py-1">
                            <p className="text-[9px] text-orange-400 uppercase tracking-wide">Toll</p>
                            <p className="text-xs font-semibold text-orange-600">₹{d.tollEstimate}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-md px-2 py-1 flex items-center justify-center">
                            <p className="text-[10px] text-gray-300">No toll</p>
                          </div>
                        )}
                      </div>

                      {/* Route via */}
                      {d.routeVia && (
                        <p className="text-[10px] text-gray-400 truncate mt-1.5" title={d.routeVia}>
                          via {d.routeVia}
                        </p>
                      )}

                      {/* Badges */}
                      {(d.isVerified || d.statePermit) && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {d.isVerified && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-medium rounded-full border border-green-100">
                              <ShieldCheck className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                          {d.statePermit && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-medium rounded-full border border-purple-100">
                              Permit
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Route className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {distances.length === 0 ? 'No routes configured yet' : 'No routes match your filters'}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {distances.length === 0
              ? 'Add city-to-city distances to enable dynamic outstation pricing'
              : 'Try adjusting your search or filters'}
          </p>
          {distances.length === 0 && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
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
              <h2 className="text-xl font-semibold text-gray-900">
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
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                {[
                  { key: 'statePermit', label: 'State Permit Required' },
                  { key: 'isVerified', label: 'Verified Distance' },
                  { key: 'createReverse', label: 'Create Both Directions', hide: !!editingId },
                ].filter((c) => !c.hide).map((c) => (
                  <ToggleRow
                    key={c.key}
                    checked={(formData as any)[c.key]}
                    onChange={(v) => setFormData({ ...formData, [c.key]: v })}
                    label={c.label}
                  />
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
                <h2 className="text-xl font-semibold text-gray-900">Bulk Auto-fetch Routes</h2>
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

                  <ToggleRow
                    checked={bulkOverwrite}
                    onChange={setBulkOverwrite}
                    label="Overwrite existing routes"
                    description="Uncheck to skip routes already in DB"
                  />
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
