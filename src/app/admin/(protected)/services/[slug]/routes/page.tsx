'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Route,
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowRight,
  Car,
  Star,
  Settings2,
  MapPin,
  ArrowLeft,
  Download,
  Plane,
  Zap,
  Search,
  X,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

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

export default function ServiceRoutesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

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
        fetch(`/api/admin/services/${serviceSlug}/routes`),
        fetch(`/api/admin/services/${serviceSlug}/vehicles`),
        fetch(`/api/services/${serviceSlug}/locations`),
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
  }, [serviceSlug]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      ...defaultFormData,
      vehicleCategoryId: categories[0]?.id || '',
      basePrice: serviceSlug === 'luxury-car-rental' ? 8000 : 3500,
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
      const response = await fetch(`/api/admin/services/${serviceSlug}/routes`, {
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

      const response = await fetch(`/api/admin/services/${serviceSlug}/routes`, {
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
      const response = await fetch(`/api/admin/services/${serviceSlug}/routes?id=${id}`, {
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

    // Create CSV headers
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

    // Convert routes to CSV rows
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

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    const suffix = exportFiltered ? 'filtered' : 'all';
    a.download = `${serviceSlug}-routes-${suffix}-${timestamp}.csv`;
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

  // Group by vehicle category
  const groupedByCategory: Record<string, RoutePackage[]> = {};
  filteredRoutes.forEach((r) => {
    const cat = r.chauffeur_vehicle_categories.name;
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(r);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/services/${serviceSlug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {serviceTitle}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Route Packages - {serviceTitle}
          </h1>
          <p className="text-gray-600">
            Configure fixed-price routes like Delhi - Jaipur, Mumbai - Pune
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport(false)}
              disabled={routes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={routes.length === 0 ? 'No routes to export' : 'Export all routes to CSV'}
            >
              <Download className="w-5 h-5" />
              Export All
            </button>
            {(filterCategory || filterFrom) && filteredRoutes.length > 0 && (
              <button
                onClick={() => handleExport(true)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm"
                title={`Export ${filteredRoutes.length} filtered route(s)`}
              >
                <Download className="w-4 h-4" />
                Export Filtered ({filteredRoutes.length})
              </button>
            )}
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Route
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
              {activeFilterCount} active
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {filteredRoutes.length} of {routes.length} routes
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search by city name..."
              className="pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vehicle Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Origin Cities</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Destination Cities</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg border overflow-hidden">
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
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
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
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
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            Airport
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Route Package' : 'Add Route Package'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Route Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From City *
                    </label>
                    <SearchableSelect
                      options={locations.map((l) => ({ id: l.id, label: l.name }))}
                      value={formData.fromLocationId}
                      onChange={(id) => setFormData({ ...formData, fromLocationId: id })}
                      placeholder="Select Origin"
                      emptyMessage="No cities found"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To City *
                    </label>
                    <SearchableSelect
                      options={locations
                        .filter((l) => l.id !== formData.fromLocationId)
                        .map((l) => ({ id: l.id, label: l.name }))}
                      value={formData.toLocationId}
                      onChange={(id) => setFormData({ ...formData, toLocationId: id })}
                      placeholder="Select Destination"
                      emptyMessage="No cities found"
                    />
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5h 30m"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-medium text-green-900 mb-3">Pricing</h3>
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      step={0.1}
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Round-trip = Rs{Math.round(formData.basePrice * formData.returnMultiplier)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-medium text-amber-900 mb-3">Additional Charges</h3>
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Mark as Popular</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              {/* Pricing behaviour toggles */}
              <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-purple-900 text-sm">Pricing Behaviour</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAirportTransfer}
                    onChange={(e) => setFormData({ ...formData, isAirportTransfer: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                      <Plane className="w-3.5 h-3.5 text-blue-500" />
                      Airport Transfer
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mark this as an airport route. Pricing API will treat it as fixed airport fare.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.forcePackagePricing}
                    onChange={(e) => setFormData({ ...formData, forcePackagePricing: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                      <Zap className="w-3.5 h-3.5 text-orange-500" />
                      Force Package Pricing
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Override distance matrix — use this fixed package price for outstation trips on this route. Takes priority over city-pricing + distance matrix calculation.
                    </p>
                  </div>
                </label>
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
            <div key={categoryName} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <Car className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{categoryName}</h2>
                <span className="text-sm text-gray-500">({items.length} routes)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Route</th>
                      <th className="px-4 py-3 text-right">Distance</th>
                      <th className="px-4 py-3 text-right">One-way</th>
                      <th className="px-4 py-3 text-right">Round-trip</th>
                      <th className="px-4 py-3 text-right">Toll Est.</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-left">Last Edited By</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((route) => (
                      <tr key={route.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{route.fromLocation.name}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{route.toLocation.name}</span>
                            {route.isPopular && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                            {route.isAirportTransfer && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                <Plane className="w-2.5 h-2.5" /> Airport
                              </span>
                            )}
                            {route.forcePackagePricing && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                                <Zap className="w-2.5 h-2.5" /> Fixed
                              </span>
                            )}
                          </div>
                          {route.estimatedDuration && (
                            <p className="text-xs text-gray-500 mt-1">
                              ~{route.estimatedDuration}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {route.estimatedKm} km
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-green-600">
                          Rs{route.basePrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          Rs{Math.round(route.basePrice * route.returnMultiplier).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {route.tollsEstimate ? `Rs${route.tollsEstimate}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              route.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {route.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {route.updatedBy ? (
                            <div className="flex items-center gap-1.5">
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
                              className={`p-1.5 rounded ${route.forcePackagePricing ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'}`}
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(route)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(route.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
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
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No routes configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add fixed-price route packages like Delhi - Jaipur, Mumbai - Pune
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>
      )}
    </div>
  );
}
