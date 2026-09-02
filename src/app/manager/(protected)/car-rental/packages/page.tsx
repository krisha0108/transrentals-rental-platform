'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Clock,
  Car,
  Star,
  MapPin,
  Download,
  ArrowLeft,
  ChevronDown,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react';

// Custom searchable dropdown — filter/type to narrow a long city or vehicle
// category list instead of scrolling a native <select>. Mirrors the pattern
// already used on the manager City Pricing and Car Rental Routes pages.
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

// Reusable toggle-switch look for a plain checkbox — the <input> keeps its
// normal checked/onChange wiring, only the visual track+thumb is decorative.
// Mirrors the pattern used on the manager Car Rental Routes page.
function ToggleRow({
  checked, onChange, label, icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="w-9 h-5 rounded-full bg-gray-300 transition-colors peer-checked:bg-green-600" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-gray-900">
        {icon}
        {label}
      </span>
    </label>
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

interface LocalPackage {
  id: string;
  vehicleCategoryId: string;
  locationId: string | null;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  nightChargesApply: boolean;
  nightChargeAmount: number | null;
  isPopular: boolean;
  displayOrder: number;
  isActive: boolean;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string };
  location: { id: string; name: string; slug: string } | null;
  createdBy: { id: string; name: string; role: string } | null;
  updatedBy: { id: string; name: string; role: string } | null;
}

const defaultFormData = {
  id: '',
  vehicleCategoryId: '',
  locationId: '',
  name: '',
  hours: 4,
  kms: 40,
  basePrice: 999,
  extraKmCharge: 12,
  extraHourCharge: 100,
  nightChargesApply: true,
  nightChargeAmount: 150,
  isPopular: false,
  displayOrder: 0,
  isActive: true,
};

// Manager-scoped mirror of src/app/admin/(protected)/services/[slug]/packages/page.tsx,
// hardcoded to car-rental — only reachable by managers with
// canManageCarRentalContent set (see src/lib/auth/car-rental-content-access.ts,
// which gates the underlying /api/admin/services/car-rental/packages write endpoints).
export default function ManagerCarRentalPackagesPage() {
  useManagerPageHeader('Car Rental — Local Packages', 'Configure hourly packages like 4hr/40km, 8hr/80km');

  const [packages, setPackages] = useState<LocalPackage[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPackageType, setFilterPackageType] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [filterPopular, setFilterPopular] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  const fetchData = async () => {
    try {
      const cacheBust = `_t=${Date.now()}`;
      const [packagesRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`/api/admin/services/${SERVICE_SLUG}/packages?${cacheBust}`, { cache: 'no-store' }),
        fetch(`/api/admin/services/${SERVICE_SLUG}/vehicles?${cacheBust}`, { cache: 'no-store' }),
        fetch(`/api/services/${SERVICE_SLUG}/locations?${cacheBust}`, { cache: 'no-store' }),
      ]);

      const packagesData = await packagesRes.json();
      const categoriesData = await categoriesRes.json();
      const locationsData = await locationsRes.json();

      if (packagesData.success) setPackages(packagesData.packages);
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
    setFormData({
      ...defaultFormData,
      vehicleCategoryId: categories[0]?.id || '',
    });
    setShowForm(true);
  };

  const handleEdit = (pkg: LocalPackage) => {
    setFormData({
      id: pkg.id,
      vehicleCategoryId: pkg.vehicleCategoryId,
      locationId: pkg.locationId || '',
      name: pkg.name,
      hours: pkg.hours,
      kms: pkg.kms,
      basePrice: pkg.basePrice,
      extraKmCharge: pkg.extraKmCharge,
      extraHourCharge: pkg.extraHourCharge,
      nightChargesApply: pkg.nightChargesApply,
      nightChargeAmount: pkg.nightChargeAmount || 150,
      isPopular: pkg.isPopular,
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const method = formData.id ? 'PATCH' : 'POST';
      const response = await fetch(`/api/admin/services/${SERVICE_SLUG}/packages`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: `${formData.hours}hr/${formData.kms}km`,
          locationId: formData.locationId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        setFormData(defaultFormData);
        if (method === 'PATCH' && data.package) {
          setPackages(prev => prev.map(p => {
            if (p.id === data.package.id) {
              return {
                ...p,
                ...data.package,
                location: data.package.locations || p.location,
              };
            }
            return p;
          }));
        } else {
          await fetchData();
        }
      } else {
        setError(data.error || 'Failed to save package');
      }
    } catch (err) {
      setError('Failed to save package');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`/api/admin/services/${SERVICE_SLUG}/packages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete package');
    }
  };

  const handleExport = (exportFiltered = false) => {
    const packagesToExport = exportFiltered ? filteredPackages : packages;

    if (packagesToExport.length === 0) {
      alert('No packages to export');
      return;
    }

    const headers = [
      'Vehicle Category (slug)',
      'Location (slug or empty)',
      'Name',
      'Hours',
      'Kilometers',
      'Base Price',
      'Extra Km Charge',
      'Extra Hour Charge',
      'Night Charges Apply (true/false)',
      'Night Charge Amount',
      'Is Popular (true/false)',
      'Is Active (true/false)',
      'Display Order'
    ];

    const rows = packagesToExport.map(pkg => {
      const categorySlug = pkg.chauffeur_vehicle_categories?.slug || '';
      const locationSlug = pkg.location?.slug || '';

      return [
        categorySlug,
        locationSlug,
        pkg.name,
        pkg.hours,
        pkg.kms,
        pkg.basePrice,
        pkg.extraKmCharge,
        pkg.extraHourCharge,
        pkg.nightChargesApply,
        pkg.nightChargeAmount || '',
        pkg.isPopular,
        pkg.isActive,
        pkg.displayOrder
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    const suffix = exportFiltered ? 'filtered' : 'all';
    a.download = `car-rental-packages-${suffix}-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredPackages = packages.filter((p) => {
    if (filterCategory && p.vehicleCategoryId !== filterCategory) return false;

    if (filterLocation) {
      if (filterLocation === 'all-cities') {
        if (p.locationId !== null) return false;
      } else {
        if (p.locationId !== filterLocation) return false;
      }
    }

    if (filterPackageType && p.hours !== parseInt(filterPackageType)) return false;
    if (filterStatus === 'active' && !p.isActive) return false;
    if (filterStatus === 'inactive' && p.isActive) return false;
    if (filterPopular && !p.isPopular) return false;
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      const haystack = `${p.name} ${p.chauffeur_vehicle_categories?.name || ''} ${p.location?.name || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const uniquePackageTypes = Array.from(new Set(packages.map((p) => p.hours)))
    .sort((a, b) => a - b);

  const locationFilterOptions = [
    { id: 'all-cities', name: 'Default (All Cities)' },
    ...locations.map((l) => ({ id: l.id, name: l.name })),
  ];
  const packageTypeOptions = uniquePackageTypes.map((h) => ({ id: String(h), name: `${h} Hour${h !== 1 ? 's' : ''}` }));

  const activeFilterCount = [
    filterCategory, filterLocation, filterPackageType, filterStatus,
    filterPopular ? 'popular' : '', filterSearch.trim(),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory('');
    setFilterLocation('');
    setFilterPackageType('');
    setFilterStatus('');
    setFilterPopular(false);
    setFilterSearch('');
  };

  const stats = {
    total: packages.length,
    cities: new Set(packages.filter((p) => p.locationId).map((p) => p.locationId)).size,
    popular: packages.filter((p) => p.isPopular).length,
    vehicleTypes: new Set(packages.map((p) => p.vehicleCategoryId)).size,
  };

  const groupedByCategory: Record<string, LocalPackage[]> = {};
  filteredPackages.forEach((p) => {
    const cat = p.chauffeur_vehicle_categories?.name || 'Uncategorized';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(p);
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
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(false)}
            disabled={packages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition"
            title={packages.length === 0 ? 'No packages to export' : 'Export all packages to CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {activeFilterCount > 0 && filteredPackages.length > 0 && (
            <button
              onClick={() => handleExport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
              title={`Export ${filteredPackages.length} filtered package(s)`}
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered ({filteredPackages.length})
            </button>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Package
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Packages', value: stats.total, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Cities Covered', value: stats.cities, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Popular', value: stats.popular, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Vehicle Types', value: stats.vehicleTypes, color: 'text-blue-600', bg: 'bg-blue-50' },
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
              placeholder="Search by package name or city..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <SearchableSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories}
            placeholder="All Vehicle Categories"
          />

          <SearchableSelect
            value={filterLocation}
            onChange={setFilterLocation}
            options={locationFilterOptions}
            placeholder="All Locations"
          />

          <SearchableSelect
            value={filterPackageType}
            onChange={setFilterPackageType}
            options={packageTypeOptions}
            placeholder="All Package Types"
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
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium">Showing:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredPackages.length} of {packages.length} packages
            </span>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.id ? 'Edit Package' : 'Add Local Package'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Category *
                  </label>
                  <select
                    value={formData.vehicleCategoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleCategoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City (optional)
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Cities (Default)</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to apply to all cities
                  </p>
                </div>
              </div>

              <div className="bg-green-50/70 border border-green-100 rounded-xl p-4">
                <h3 className="flex items-center gap-1.5 font-semibold text-green-900 text-sm mb-3">
                  <Clock className="w-3.5 h-3.5" /> Package Details
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours *
                    </label>
                    <input
                      type="number"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      min={1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kilometers *
                    </label>
                    <input
                      type="number"
                      value={formData.kms}
                      onChange={(e) =>
                        setFormData({ ...formData, kms: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      min={1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                <h3 className="font-semibold text-amber-900 text-sm mb-3">Extra Charges</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extra Km Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.extraKmCharge}
                      onChange={(e) =>
                        setFormData({ ...formData, extraKmCharge: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extra Hour Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.extraHourCharge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          extraHourCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <ToggleRow
                  checked={formData.nightChargesApply}
                  onChange={(v) => setFormData({ ...formData, nightChargesApply: v })}
                  label="Night Charges Apply"
                />

                {formData.nightChargesApply && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Amount: ₹</span>
                    <input
                      type="number"
                      value={formData.nightChargeAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nightChargeAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
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

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Display Order:</span>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Package
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages Grid by Category */}
      {Object.keys(groupedByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, items]) => (
            <div key={categoryName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 bg-slate-50">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-700">{categoryName}</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-500 border border-slate-200">
                  {items.length} package{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 p-3">
                {items.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                      pkg.isActive ? 'border-gray-200' : 'border-red-200'
                    }`}
                  >
                    {/* Status accent bar */}
                    <div className={`h-1 ${pkg.isActive ? 'bg-green-500' : 'bg-red-400'}`} />

                    <div className="p-2.5">
                      {/* Header: package chip + actions */}
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          {pkg.name}
                        </span>
                        <div className="flex gap-0 flex-shrink-0 -mt-1 -mr-1">
                          <button
                            onClick={() => handleEdit(pkg)}
                            title="Edit package"
                            className="p-1 text-green-600 hover:bg-green-100 rounded-full transition"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            title="Delete package"
                            className="p-1 text-red-600 hover:bg-red-100 rounded-full transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 flex-wrap mb-1">
                        <span className="text-lg font-bold text-gray-900">₹{pkg.basePrice.toLocaleString()}</span>
                        {pkg.isPopular && (
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        )}
                        {!pkg.isActive && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate mb-1.5">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {pkg.location ? pkg.location.name : 'All Cities'}
                      </p>

                      {/* Extra charges */}
                      <p className="text-[11px] text-gray-500 mb-1">
                        +₹{pkg.extraKmCharge}/km · +₹{pkg.extraHourCharge}/hr
                      </p>

                      {pkg.nightChargesApply && (
                        <p className="text-[10px] text-amber-700">
                          Night charge: ₹{pkg.nightChargeAmount}
                        </p>
                      )}

                      {pkg.updatedBy && (
                        <p className="mt-1.5 pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 truncate">
                          By {pkg.updatedBy.name}
                          {pkg.updatedBy.role === 'MANAGER' && ' · Manager'}
                        </p>
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
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No packages configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create local packages like 4hr/40km, 8hr/80km for different vehicle categories
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      )}
    </div>
  );
}
