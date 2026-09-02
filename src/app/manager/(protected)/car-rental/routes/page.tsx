'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import {
  Route,
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowRight,
  Car,
  Star,
  Pencil,
  MapPin,
  ArrowLeft,
  Download,
  Plane,
  Zap,
  ChevronDown,
  Search,
  X,
  SlidersHorizontal,
  Navigation,
} from 'lucide-react';

// Reusable toggle-switch look for a plain checkbox — the <input> keeps its
// normal checked/onChange wiring, only the visual track+thumb is decorative.
function ToggleRow({
  checked, onChange, label, description, icon, accent = 'green',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  accent?: 'green' | 'purple' | 'orange';
}) {
  const trackColor = accent === 'purple' ? 'peer-checked:bg-purple-600' : accent === 'orange' ? 'peer-checked:bg-orange-600' : 'peer-checked:bg-green-600';
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className={`w-9 h-5 rounded-full bg-gray-300 transition-colors ${trackColor}`} />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 group-hover:text-gray-900">
          {icon}
          {label}
        </div>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

// Custom searchable dropdown — filter/type to narrow a long city or vehicle
// category list instead of scrolling a native <select>. Mirrors the pattern
// already used on the manager City Pricing page.
function SearchableSelect({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
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
        className={`w-full min-w-[180px] px-3 py-2 text-sm border rounded-lg text-left bg-white flex items-center justify-between gap-2 transition ${
          open ? 'border-green-500 ring-2 ring-green-500' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
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
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
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
                className={`w-full px-3 py-2 text-sm text-left hover:bg-green-50 transition ${
                  value === o.id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                }`}
              >
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

const SERVICE_SLUG = 'car-rental';

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface RoutePackage {
  id: string;
  vehicleCategoryId: string;
  fromLocationId: string;
  toLocationId: string;
  estimatedKm: number;
  estimatedDuration: string | null;
  routeDescription: string | null;
  basePrice: number;
  returnMultiplier: number;
  tollsEstimate: number | null;
  statePermitCharge: number | null;
  nightSurcharge: number | null;
  airportSurcharge: number | null;
  isPopular: boolean;
  displayOrder: number;
  isActive: boolean;
  isAirportTransfer: boolean;
  forcePackagePricing: boolean;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string };
  fromLocation: { id: string; name: string; slug: string };
  toLocation: { id: string; name: string; slug: string };
  createdBy: { id: string; name: string; role: string } | null;
  updatedBy: { id: string; name: string; role: string } | null;
}

const defaultFormData = {
  vehicleCategoryId: '',
  fromLocationId: '',
  toLocationId: '',
  estimatedKm: 0,
  estimatedDuration: '',
  routeDescription: '',
  basePrice: 0,
  returnMultiplier: 1.8,
  tollsEstimate: 0,
  statePermitCharge: 0,
  nightSurcharge: 0,
  airportSurcharge: 0,
  isPopular: false,
  displayOrder: 0,
  isActive: true,
  isAirportTransfer: false,
  forcePackagePricing: false,
};

// Manager-scoped mirror of src/app/admin/(protected)/services/[slug]/routes/page.tsx,
// hardcoded to car-rental — only reachable by managers with
// canManageCarRentalContent set (see src/lib/auth/car-rental-content-access.ts,
// which gates the underlying /api/admin/services/car-rental/routes endpoint).
export default function ManagerCarRentalRoutesPage() {
  useManagerPageHeader('Car Rental — Routes', 'Configure fixed-price routes like Delhi - Jaipur, Mumbai - Pune');

  const [routes, setRoutes] = useState<RoutePackage[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [filterPopular, setFilterPopular] = useState(false);
  const [filterAirport, setFilterAirport] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [routesRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`/api/admin/services/${SERVICE_SLUG}/routes`),
        fetch(`/api/admin/services/${SERVICE_SLUG}/vehicles`),
        fetch(`/api/services/${SERVICE_SLUG}/locations`),
      ]);

      const routesData = await routesRes.json();
      const categoriesData = await categoriesRes.json();
      const locationsData = await locationsRes.json();

      if (routesData.success) setRoutes(routesData.routes);
      if (categoriesData.success) setCategories(categoriesData.categories);
      if (locationsData.success) setLocations(locationsData.locations || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      ...defaultFormData,
      vehicleCategoryId: categories[0]?.id || '',
      basePrice: 3500,
    });
    setShowForm(true);
  };

  const handleEdit = (route: RoutePackage) => {
    setEditingId(route.id);
    setFormData({
      vehicleCategoryId: route.vehicleCategoryId,
      fromLocationId: route.fromLocationId,
      toLocationId: route.toLocationId,
      estimatedKm: route.estimatedKm,
      estimatedDuration: route.estimatedDuration || '',
      routeDescription: route.routeDescription || '',
      basePrice: route.basePrice,
      returnMultiplier: route.returnMultiplier,
      tollsEstimate: route.tollsEstimate || 0,
      statePermitCharge: route.statePermitCharge || 0,
      nightSurcharge: route.nightSurcharge || 0,
      airportSurcharge: route.airportSurcharge || 0,
      isPopular: route.isPopular,
      displayOrder: route.displayOrder,
      isActive: route.isActive,
      isAirportTransfer: route.isAirportTransfer || false,
      forcePackagePricing: route.forcePackagePricing || false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/services/${SERVICE_SLUG}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save route');
      }
    } catch (err) {
      setError('Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleForcePackage = async (id: string, current: boolean) => {
    try {
      const route = routes.find((r) => r.id === id);
      if (!route) return;

      const response = await fetch(`/api/admin/services/${SERVICE_SLUG}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleCategoryId: route.vehicleCategoryId,
          fromLocationId: route.fromLocationId,
          toLocationId: route.toLocationId,
          estimatedKm: route.estimatedKm,
          estimatedDuration: route.estimatedDuration,
          routeDescription: route.routeDescription,
          basePrice: route.basePrice,
          returnMultiplier: route.returnMultiplier,
          tollsEstimate: route.tollsEstimate,
          statePermitCharge: route.statePermitCharge,
          nightSurcharge: route.nightSurcharge,
          airportSurcharge: route.airportSurcharge,
          isPopular: route.isPopular,
          displayOrder: route.displayOrder,
          isActive: route.isActive,
          isAirportTransfer: route.isAirportTransfer,
          forcePackagePricing: !current,
        }),
      });
      const data = await response.json();
      if (data.success) fetchData();
    } catch (err) {
      alert('Failed to update route');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const response = await fetch(`/api/admin/services/${SERVICE_SLUG}/routes?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete route');
    }
  };

  const handleExport = (exportFiltered = false) => {
    const routesToExport = exportFiltered ? filteredRoutes : routes;

    if (routesToExport.length === 0) {
      alert('No routes to export');
      return;
    }

    const headers = [
      'Vehicle Category (slug)',
      'From City (slug)',
      'To City (slug)',
      'Estimated Km',
      'Estimated Duration',
      'One-way Price',
      'Return Multiplier',
      'Toll Estimate',
      'State Permit Charge',
      'Night Surcharge',
      'Airport Surcharge',
      'Is Popular',
      'Display Order',
      'Is Active',
      'Route Description'
    ];

    const rows = routesToExport.map(r => {
      const categorySlug = r.chauffeur_vehicle_categories?.slug || '';
      const fromSlug = r.fromLocation?.slug || '';
      const toSlug = r.toLocation?.slug || '';

      return [
        categorySlug,
        fromSlug,
        toSlug,
        r.estimatedKm,
        r.estimatedDuration || '',
        r.basePrice,
        r.returnMultiplier,
        r.tollsEstimate || 0,
        r.statePermitCharge || 0,
        r.nightSurcharge || 0,
        r.airportSurcharge || 0,
        r.isPopular,
        r.displayOrder,
        r.isActive,
        r.routeDescription || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    const suffix = exportFiltered ? 'filtered' : 'all';
    a.download = `car-rental-routes-${suffix}-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredRoutes = routes.filter((r) => {
    if (filterCategory && r.vehicleCategoryId !== filterCategory) return false;
    if (filterFrom && r.fromLocationId !== filterFrom) return false;
    if (filterTo && r.toLocationId !== filterTo) return false;
    if (filterStatus === 'active' && !r.isActive) return false;
    if (filterStatus === 'inactive' && r.isActive) return false;
    if (filterPopular && !r.isPopular) return false;
    if (filterAirport && !r.isAirportTransfer) return false;
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      const haystack = `${r.fromLocation.name} ${r.toLocation.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeFilterCount = [
    filterCategory, filterFrom, filterTo, filterStatus,
    filterPopular ? 'popular' : '', filterAirport ? 'airport' : '', filterSearch.trim(),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory('');
    setFilterFrom('');
    setFilterTo('');
    setFilterStatus('');
    setFilterPopular(false);
    setFilterAirport(false);
    setFilterSearch('');
  };

  const stats = {
    total: routes.length,
    origins: new Set(routes.map((r) => r.fromLocationId)).size,
    popular: routes.filter((r) => r.isPopular).length,
    airport: routes.filter((r) => r.isAirportTransfer).length,
  };

  const groupedByCategory: Record<string, RoutePackage[]> = {};
  filteredRoutes.forEach((r) => {
    const cat = r.chauffeur_vehicle_categories.name;
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(r);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <Link href="/manager/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(false)}
            disabled={routes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition"
            title={routes.length === 0 ? 'No routes to export' : 'Export all routes to CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {activeFilterCount > 0 && filteredRoutes.length > 0 && (
            <button
              onClick={() => handleExport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
              title={`Export ${filteredRoutes.length} filtered route(s)`}
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered ({filteredRoutes.length})
            </button>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Route
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Routes', value: stats.total, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Origin Cities', value: stats.origins, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Popular', value: stats.popular, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Airport Transfers', value: stats.airport, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3.5`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
              {activeFilterCount} active
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search by city name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>

          <SearchableSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories}
            placeholder="All Vehicle Categories"
          />

          <SearchableSelect
            value={filterFrom}
            onChange={setFilterFrom}
            options={locations}
            placeholder="All Origin Cities"
          />

          <SearchableSelect
            value={filterTo}
            onChange={setFilterTo}
            options={locations}
            placeholder="All Destination Cities"
          />

          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {([
              { key: '', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
            ] as const).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilterStatus(s.key)}
                className={`px-3 py-2 text-sm font-medium transition ${
                  filterStatus === s.key
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFilterPopular((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
              filterPopular
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterPopular ? 'fill-amber-500 text-amber-500' : ''}`} />
            Popular
          </button>

          <button
            type="button"
            onClick={() => setFilterAirport((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
              filterAirport
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            Airport
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium">Showing:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              {filteredRoutes.length} of {routes.length} routes
            </span>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Route Package' : 'Add Route Package'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Category *
                </label>
                <select
                  value={formData.vehicleCategoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleCategoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-green-50/70 border border-green-100 rounded-xl p-4">
                <h3 className="flex items-center gap-1.5 font-semibold text-green-900 text-sm mb-3">
                  <Navigation className="w-3.5 h-3.5" /> Route Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From City *
                    </label>
                    <select
                      value={formData.fromLocationId}
                      onChange={(e) =>
                        setFormData({ ...formData, fromLocationId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      required
                    >
                      <option value="">Select Origin</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To City *
                    </label>
                    <select
                      value={formData.toLocationId}
                      onChange={(e) =>
                        setFormData({ ...formData, toLocationId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      required
                    >
                      <option value="">Select Destination</option>
                      {locations
                        .filter((l) => l.id !== formData.fromLocationId)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Distance (km)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedKm}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedKm: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedDuration}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedDuration: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      placeholder="e.g., 5h 30m"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-900 text-sm mb-3">Pricing</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      One-way Price (Rs) *
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Round-trip Multiplier
                    </label>
                    <input
                      type="number"
                      value={formData.returnMultiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          returnMultiplier: parseFloat(e.target.value) || 1.8,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                      step={0.1}
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Round-trip = Rs{Math.round(formData.basePrice * formData.returnMultiplier)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                <h3 className="font-semibold text-amber-900 text-sm mb-3">Additional Charges</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toll Estimate (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.tollsEstimate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tollsEstimate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State Permit (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.statePermitCharge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statePermitCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 px-1">
                <ToggleRow
                  checked={formData.isPopular}
                  onChange={(v) => setFormData({ ...formData, isPopular: v })}
                  label="Mark as Popular"
                  icon={<Star className="w-3.5 h-3.5 text-amber-500" />}
                />
                <ToggleRow
                  checked={formData.isActive}
                  onChange={(v) => setFormData({ ...formData, isActive: v })}
                  label="Active"
                />
              </div>

              {/* Pricing behaviour toggles */}
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-purple-900 text-sm">Pricing Behaviour</h3>

                <ToggleRow
                  checked={formData.isAirportTransfer}
                  onChange={(v) => setFormData({ ...formData, isAirportTransfer: v })}
                  label="Airport Transfer"
                  description="Mark this as an airport route. Pricing API will treat it as fixed airport fare."
                  icon={<Plane className="w-3.5 h-3.5 text-blue-500" />}
                  accent="purple"
                />

                <ToggleRow
                  checked={formData.forcePackagePricing}
                  onChange={(v) => setFormData({ ...formData, forcePackagePricing: v })}
                  label="Force Package Pricing"
                  description="Override distance matrix — use this fixed package price for outstation trips on this route. Takes priority over city-pricing + distance matrix calculation."
                  icon={<Zap className="w-3.5 h-3.5 text-orange-500" />}
                  accent="orange"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Route
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routes by Category */}
      {Object.keys(groupedByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, items]) => (
              <div key={categoryName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 bg-slate-50">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-700">{categoryName}</h2>
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-500 border border-slate-200">
                    {items.length} route{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold">Route</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Distance</th>
                        <th className="px-4 py-2.5 text-right font-semibold">One-way</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Round-trip</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Toll Est.</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Last Edited By</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((route) => (
                        <tr key={route.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 font-medium text-gray-900">
                                <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                {route.fromLocation.name}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <span className="font-medium text-gray-900">{route.toLocation.name}</span>
                              {route.isPopular && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                              )}
                              {route.isAirportTransfer && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                                  <Plane className="w-2.5 h-2.5" /> Airport
                                </span>
                              )}
                              {route.forcePackagePricing && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                                  <Zap className="w-2.5 h-2.5" /> Fixed
                                </span>
                              )}
                            </div>
                            {route.estimatedDuration && (
                              <p className="text-xs text-gray-400 mt-1 ml-5">
                                ~{route.estimatedDuration}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {route.estimatedKm} km
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-green-600">
                            Rs{route.basePrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-500">
                            Rs{Math.round(route.basePrice * route.returnMultiplier).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {route.tollsEstimate ? `Rs${route.tollsEstimate}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                route.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                              {route.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {route.updatedBy ? (
                              <div className="flex items-center gap-1.5">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 flex-shrink-0">
                                  {route.updatedBy.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-gray-700">{route.updatedBy.name}</span>
                                {route.updatedBy.role === 'MANAGER' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                                    Manager
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleToggleForcePackage(route.id, route.forcePackagePricing)}
                                title={route.forcePackagePricing ? 'Force Package ON — click to disable' : 'Force Package OFF — click to enable (ignore distance matrix)'}
                                className={`p-1.5 rounded-full transition ${route.forcePackagePricing ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'}`}
                              >
                                <Zap className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(route)}
                                title="Edit route"
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(route.id)}
                                title="Delete route"
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Route className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No routes configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add fixed-price route packages like Delhi - Jaipur, Mumbai - Pune
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>
      )}
    </div>
  );
}
