'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Car, Plus, Trash2, Save, Loader2, IndianRupee,
  ArrowLeft, Download, Search, Pencil, X, ChevronDown,
  AlertCircle, Layers, CheckSquare, Square,
} from 'lucide-react';

interface VehicleCategory { id: string; name: string; slug: string; }
interface LocationWithState { id: string; name: string; slug: string; state: string | null; }

interface CityPricing {
  id: string;
  vehicleCategoryId: string;
  locationId: string;
  baseKmRate: number;
  minKmPerDay: number;
  driverDayAllowance: number;
  driverNightAllowance: number;
  nightSurcharge: number;
  airportSurcharge: number;
  outstationMinDays: number;
  tollsIncluded: boolean;
  statePermitIncluded: boolean;
  parkingIncluded: boolean;
  isActive: boolean;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string };
  locations: { id: string; name: string; slug: string };
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

// Generic searchable dropdown
function SearchableSelect({
  value, onChange, options, placeholder, required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
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
              <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search..." />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {!required && value && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                className="w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 text-left">— Clear</button>
            )}
            {filtered.map((o) => (
              <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition ${value === o.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
                {o.name}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-gray-400 text-center">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const defaultForm = (serviceSlug: string) => ({
  vehicleCategoryId: '',
  locationId: '',
  baseKmRate: serviceSlug === 'luxury-car-rental' ? 25 : 12,
  minKmPerDay: 250,
  driverDayAllowance: serviceSlug === 'luxury-car-rental' ? 500 : 300,
  driverNightAllowance: serviceSlug === 'luxury-car-rental' ? 400 : 250,
  nightSurcharge: 0,
  airportSurcharge: 0,
  outstationMinDays: 1,
  tollsIncluded: false,
  statePermitIncluded: false,
  parkingIncluded: false,
  isActive: true,
});

// Pricing fields form (shared between single + bulk)
function PricingFields({ formData, setFormData }: {
  formData: ReturnType<typeof defaultForm>;
  setFormData: (d: ReturnType<typeof defaultForm>) => void;
}) {
  return (
    <>
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Base Rates</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Per Km Rate (₹) *</label>
            <input type="number" step={0.5} min={0} required value={formData.baseKmRate}
              onChange={(e) => setFormData({ ...formData, baseKmRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., 12" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Km Per Day</label>
            <input type="number" min={1} value={formData.minKmPerDay}
              onChange={(e) => setFormData({ ...formData, minKmPerDay: parseInt(e.target.value) || 250 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., 250" />
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Driver Allowance</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day Allowance (₹)</label>
            <input type="number" min={0} value={formData.driverDayAllowance}
              onChange={(e) => setFormData({ ...formData, driverDayAllowance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., 300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Night Halt (₹)</label>
            <input type="number" min={0} value={formData.driverNightAllowance}
              onChange={(e) => setFormData({ ...formData, driverNightAllowance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., 250" />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Surcharges</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Night (₹)</label>
            <input type="number" min={0} value={formData.nightSurcharge}
              onChange={(e) => setFormData({ ...formData, nightSurcharge: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Airport (₹)</label>
            <input type="number" min={0} value={formData.airportSurcharge}
              onChange={(e) => setFormData({ ...formData, airportSurcharge: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Days</label>
            <input type="number" min={1} value={formData.outstationMinDays}
              onChange={(e) => setFormData({ ...formData, outstationMinDays: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-5 pt-1">
        {[
          { key: 'tollsIncluded', label: 'Tolls Included' },
          { key: 'statePermitIncluded', label: 'State Permit Included' },
          { key: 'parkingIncluded', label: 'Parking Included' },
          { key: 'isActive', label: 'Active' },
        ].map((c) => (
          <label key={c.key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={(formData as any)[c.key]}
              onChange={(e) => setFormData({ ...formData, [c.key]: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <span className="text-sm text-gray-600">{c.label}</span>
          </label>
        ))}
      </div>
    </>
  );
}

export default function ServiceCityPricingPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [pricing, setPricing] = useState<CityPricing[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [locations, setLocations] = useState<LocationWithState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single add/edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultForm(serviceSlug));

  // Bulk add form
  const [showBulk, setShowBulk] = useState(false);
  const [bulkState, setBulkState] = useState('');
  const [bulkSelectedCities, setBulkSelectedCities] = useState<string[]>([]);
  const [bulkForm, setBulkForm] = useState(defaultForm(serviceSlug));
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = async () => {
    try {
      const [pricingRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`/api/admin/services/${serviceSlug}/city-pricing`),
        fetch(`/api/admin/services/${serviceSlug}/vehicles`),
        fetch(`/api/services/${serviceSlug}/locations`),
      ]);
      const pricingData = await pricingRes.json();
      const categoriesData = await categoriesRes.json();
      const locationsData = await locationsRes.json();
      if (pricingData.success) setPricing(pricingData.pricing);
      if (categoriesData.success) setCategories(categoriesData.categories);
      if (locationsData.success) setLocations(locationsData.locations || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [serviceSlug]);

  // All unique states from locations
  const allStates = useMemo(() => {
    const stateSet = new Set<string>();
    locations.forEach((l) => { if (l.state) stateSet.add(l.state); });
    return Array.from(stateSet).sort().map((s) => ({ id: s, name: s }));
  }, [locations]);

  // Cities for the selected bulk state
  const bulkStateCities = useMemo(() => {
    if (!bulkState) return [];
    return locations.filter((l) => l.state === bulkState).sort((a, b) => a.name.localeCompare(b.name));
  }, [bulkState, locations]);

  // When state changes in bulk, pre-select all cities
  useEffect(() => {
    setBulkSelectedCities(bulkStateCities.map((c) => c.id));
  }, [bulkState, bulkStateCities]);

  const handleCreate = () => {
    setFormData(defaultForm(serviceSlug));
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const handleEdit = (p: CityPricing) => {
    setFormData({
      vehicleCategoryId: p.vehicleCategoryId,
      locationId: p.locationId,
      baseKmRate: p.baseKmRate,
      minKmPerDay: p.minKmPerDay,
      driverDayAllowance: p.driverDayAllowance,
      driverNightAllowance: p.driverNightAllowance,
      nightSurcharge: p.nightSurcharge || 0,
      airportSurcharge: p.airportSurcharge || 0,
      outstationMinDays: p.outstationMinDays,
      tollsIncluded: p.tollsIncluded,
      statePermitIncluded: p.statePermitIncluded,
      parkingIncluded: p.parkingIncluded,
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = editingId ? { ...formData, id: editingId } : formData;
      const res = await fetch(`/api/admin/services/${serviceSlug}/city-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { setShowForm(false); fetchData(); }
      else setError(data.error || 'Failed to save pricing');
    } catch { setError('Failed to save pricing'); }
    finally { setIsSaving(false); }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.vehicleCategoryId) { setBulkError('Please select a vehicle category'); return; }
    if (bulkSelectedCities.length === 0) { setBulkError('Please select at least one city'); return; }
    setIsBulkSaving(true);
    setBulkError('');
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/city-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bulkForm, bulk: true, locationIds: bulkSelectedCities }),
      });
      const data = await res.json();
      if (data.success) { setShowBulk(false); setBulkState(''); fetchData(); }
      else setBulkError(data.error || 'Failed to save');
    } catch { setBulkError('Failed to save'); }
    finally { setIsBulkSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pricing configuration?')) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/city-pricing?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error || 'Failed to delete');
    } catch { alert('Failed to delete'); }
  };

  const handleExport = (exportFiltered = false) => {
    const list = exportFiltered ? filteredPricing : pricing;
    if (list.length === 0) { alert('No pricing data to export'); return; }

    // Enrich each entry with state name
    const enriched = list.map((p) => ({
      ...p,
      stateName: locations.find((l) => l.id === p.locationId)?.state || 'Other',
    }));

    // Sort: state → vehicle category name → city name
    enriched.sort((a, b) => {
      const s = a.stateName.localeCompare(b.stateName);
      if (s !== 0) return s;
      const v = (a.chauffeur_vehicle_categories?.name || '').localeCompare(b.chauffeur_vehicle_categories?.name || '');
      if (v !== 0) return v;
      return (a.locations?.name || '').localeCompare(b.locations?.name || '');
    });

    const COL_HEADER = 'State,Vehicle Category,City,Per Km (₹),Min Km/Day,Driver/Day (₹),Night Halt (₹),Night Sur. (₹),Airport Sur. (₹),Min Days,Tolls Incl.,Permit Incl.,Parking Incl.,Active';

    const lines: string[] = [];
    lines.push(`${serviceTitle} - City-wise Pricing Export`);
    lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`);
    lines.push(`Total configs: ${enriched.length}`);
    lines.push('');

    // Group by state, within state group by vehicle
    let currentState = '';
    let currentVehicle = '';

    for (const p of enriched) {
      // State section header
      if (p.stateName !== currentState) {
        if (currentState !== '') lines.push(''); // blank line between states
        lines.push(`## ${p.stateName}`);
        lines.push(COL_HEADER);
        currentState = p.stateName;
        currentVehicle = '';
      }
      // Vehicle sub-header (blank line between vehicle groups within same state)
      if (p.chauffeur_vehicle_categories?.name !== currentVehicle) {
        if (currentVehicle !== '') lines.push('');
        currentVehicle = p.chauffeur_vehicle_categories?.name || '';
      }

      const row = [
        `"${p.stateName}"`,
        `"${p.chauffeur_vehicle_categories?.name || ''}"`,
        `"${p.locations?.name || ''}"`,
        p.baseKmRate,
        p.minKmPerDay,
        p.driverDayAllowance,
        p.driverNightAllowance,
        p.nightSurcharge || 0,
        p.airportSurcharge || 0,
        p.outstationMinDays,
        p.tollsIncluded ? 'Yes' : 'No',
        p.statePermitIncluded ? 'Yes' : 'No',
        p.parkingIncluded ? 'Yes' : 'No',
        p.isActive ? 'Yes' : 'No',
      ].join(',');
      lines.push(row);
    }

    const csv = lines.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serviceSlug}-city-pricing-${exportFiltered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredPricing = useMemo(() => {
    return pricing.filter((p) => {
      const q = search.toLowerCase();
      const cityState = locations.find((l) => l.id === p.locationId)?.state || '';
      const matchSearch = !q ||
        p.chauffeur_vehicle_categories?.name.toLowerCase().includes(q) ||
        p.locations?.name.toLowerCase().includes(q) ||
        cityState.toLowerCase().includes(q);
      const matchCat = !filterCategory || p.vehicleCategoryId === filterCategory;
      const matchState = !filterState || cityState === filterState;
      return matchSearch && matchCat && matchState;
    });
  }, [pricing, search, filterCategory, filterState, locations]);

  // Group: State → City → [pricing entries]
  const grouped = useMemo(() => {
    const g: Record<string, Record<string, CityPricing[]>> = {};
    filteredPricing.forEach((p) => {
      const cityState = locations.find((l) => l.id === p.locationId)?.state || 'Other';
      const city = p.locations?.name || 'Unknown';
      if (!g[cityState]) g[cityState] = {};
      if (!g[cityState][city]) g[cityState][city] = [];
      g[cityState][city].push(p);
    });
    return g;
  }, [filteredPricing, locations]);

  const stats = useMemo(() => ({
    total: pricing.length,
    states: new Set(locations.filter((l) => pricing.some((p) => p.locationId === l.id)).map((l) => l.state)).size,
    cities: new Set(pricing.map((p) => p.locationId)).size,
    vehicles: new Set(pricing.map((p) => p.vehicleCategoryId)).size,
  }), [pricing, locations]);

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
            <h1 className="text-xl font-bold text-gray-900">City-wise Pricing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Per-km rates grouped by state → city</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport(false)} disabled={pricing.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => { setBulkForm(defaultForm(serviceSlug)); setBulkState(''); setBulkError(''); setShowBulk(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-purple-200 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition"
            >
              <Layers className="w-4 h-4" /> Bulk by State
            </button>
            <button onClick={handleCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Add Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Configs', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'States Covered', value: stats.states, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Cities Covered', value: stats.cities, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Vehicle Types', value: stats.vehicles, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3.5`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <span>
          <strong>Bulk tip:</strong> Use "Bulk by State" to set the same pricing across all cities in a state at once — great when an entire state has uniform rates.
        </span>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by state, city or vehicle..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="w-48">
          <SearchableSelect value={filterState} onChange={setFilterState} options={allStates} placeholder="All States" />
        </div>
        <div className="w-48">
          <SearchableSelect value={filterCategory} onChange={setFilterCategory} options={categories} placeholder="All Vehicles" />
        </div>
        {(search || filterState || filterCategory) && (
          <button onClick={() => { setSearch(''); setFilterState(''); setFilterCategory(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
            Clear
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filteredPricing.length} config{filteredPricing.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content — State → City → Vehicle cards */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([stateName, cities]) => {
            const totalConfigs = Object.values(cities).reduce((acc, arr) => acc + arr.length, 0);
            return (
              <div key={stateName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* State header */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold text-gray-900">{stateName}</span>
                  <span className="text-xs text-gray-400">
                    · {Object.keys(cities).length} cities · {totalConfigs} configs
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {Object.entries(cities).sort(([a], [b]) => a.localeCompare(b)).map(([cityName, items]) => (
                    <div key={cityName}>
                      {/* City sub-header */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-xs font-semibold text-gray-600">{cityName}</span>
                        <span className="text-xs text-gray-400">({items.length})</span>
                      </div>
                      {/* Vehicle cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                        {items.map((p) => (
                          <div key={p.id}
                            className={`rounded-lg border p-3 hover:shadow-sm transition-all ${p.isActive ? 'border-gray-200 hover:border-blue-200' : 'border-dashed border-gray-200 opacity-55'}`}>
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Car className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="font-semibold text-xs text-gray-800 truncate">{p.chauffeur_vehicle_categories?.name}</span>
                              </div>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <button onClick={() => handleEdit(p)} className="p-0.5 text-gray-300 hover:text-blue-600 rounded transition" title="Edit">
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="p-0.5 text-gray-300 hover:text-red-500 rounded transition" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-lg font-bold text-gray-900 leading-none">
                              ₹{p.baseKmRate}<span className="text-[10px] font-normal text-gray-400">/km</span>
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Min {p.minKmPerDay} km/day</p>
                            <div className="text-[11px] text-gray-500 mt-1.5 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Driver</span><span className="text-gray-700">₹{p.driverDayAllowance}</span>
                              </div>
                              {p.nightSurcharge > 0 && (
                                <div className="flex justify-between">
                                  <span>Night</span><span className="text-orange-500">₹{p.nightSurcharge}</span>
                                </div>
                              )}
                            </div>
                            {(p.tollsIncluded || p.statePermitIncluded || p.parkingIncluded) && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {p.tollsIncluded && <span className="px-1 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded border border-blue-100">Tolls</span>}
                                {p.statePermitIncluded && <span className="px-1 py-0.5 bg-purple-50 text-purple-600 text-[9px] rounded border border-purple-100">Permit</span>}
                                {p.parkingIncluded && <span className="px-1 py-0.5 bg-green-50 text-green-600 text-[9px] rounded border border-green-100">Parking</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            {pricing.length === 0 ? 'No pricing configured' : 'No configs match your filters'}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {pricing.length === 0 ? 'Use "Add Pricing" for a single city or "Bulk by State" for an entire state' : 'Try adjusting your search or filters'}
          </p>
          {pricing.length === 0 && (
            <div className="flex justify-center gap-2">
              <button onClick={handleCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Pricing
              </button>
              <button onClick={() => setShowBulk(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50">
                <Layers className="w-4 h-4" /> Bulk by State
              </button>
            </div>
          )}
        </div>
      )}

      {/* Single Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Pricing' : 'Add City Pricing'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Category *</label>
                    <SearchableSelect value={formData.vehicleCategoryId} onChange={(v) => setFormData({ ...formData, vehicleCategoryId: v })} options={categories} placeholder="Select vehicle" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                    <SearchableSelect value={formData.locationId} onChange={(v) => setFormData({ ...formData, locationId: v })} options={locations} placeholder="Select city" required />
                  </div>
                </div>
              </div>
              <PricingFields formData={formData} setFormData={setFormData} />
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk by State Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-900">Bulk Pricing by State</h2>
                <p className="text-xs text-gray-500 mt-0.5">Set the same pricing for all cities in a state at once</p>
              </div>
              <button onClick={() => setShowBulk(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              {bulkError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {bulkError}
                </div>
              )}

              {/* State + Vehicle */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select State & Vehicle</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                    <SearchableSelect value={bulkState} onChange={setBulkState} options={allStates} placeholder="Select state" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Category *</label>
                    <SearchableSelect value={bulkForm.vehicleCategoryId} onChange={(v) => setBulkForm({ ...bulkForm, vehicleCategoryId: v })} options={categories} placeholder="Select vehicle" required />
                  </div>
                </div>
              </div>

              {/* City selection */}
              {bulkState && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-700">
                      Cities in {bulkState} ({bulkSelectedCities.length}/{bulkStateCities.length} selected)
                    </span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setBulkSelectedCities(bulkStateCities.map((c) => c.id))}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                        <CheckSquare className="w-3.5 h-3.5" /> All
                      </button>
                      <button type="button" onClick={() => setBulkSelectedCities([])}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                        <Square className="w-3.5 h-3.5" /> None
                      </button>
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {bulkStateCities.map((city) => {
                      const isSelected = bulkSelectedCities.includes(city.id);
                      return (
                        <label key={city.id}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-sm transition ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setBulkSelectedCities((prev) => [...prev, city.id]);
                              else setBulkSelectedCities((prev) => prev.filter((id) => id !== city.id));
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 flex-shrink-0" />
                          <span className="truncate">{city.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing fields */}
              <PricingFields formData={bulkForm} setFormData={setBulkForm} />

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBulk(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={isBulkSaving || bulkSelectedCities.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-60 transition">
                  {isBulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  {isBulkSaving ? 'Saving...' : `Save for ${bulkSelectedCities.length} Cities`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
