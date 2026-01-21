'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';

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

const serviceNames: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

export default function ServicePackagesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceName = serviceNames[serviceSlug] || serviceSlug;

  const [packages, setPackages] = useState<LocalPackage[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = async () => {
    try {
      const [packagesRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`/api/admin/services/${serviceSlug}/packages`),
        fetch(`/api/admin/services/${serviceSlug}/vehicles`),
        fetch(`/api/services/${serviceSlug}/locations`),
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
    if (serviceSlug) {
      fetchData();
    }
  }, [serviceSlug]);

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
      const response = await fetch(`/api/admin/services/${serviceSlug}/packages`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name || `${formData.hours}hr/${formData.kms}km`,
          locationId: formData.locationId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchData();
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
      const response = await fetch(`/api/admin/services/${serviceSlug}/packages?id=${id}`, {
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

  const filteredPackages = filterCategory
    ? packages.filter((p) => p.vehicleCategoryId === filterCategory)
    : packages;

  // Group packages by vehicle category
  const groupedByCategory: Record<string, LocalPackage[]> = {};
  filteredPackages.forEach((p) => {
    const cat = p.chauffeur_vehicle_categories?.name || 'Uncategorized';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(p);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Packages</h1>
          <p className="text-gray-600">Configure hourly packages like 4hr/40km, 8hr/80km for {serviceName}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {formData.id ? 'Edit Package' : 'Add Local Package'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!formData.id}
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!!formData.id}
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

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Package Details</h3>
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-medium text-amber-900 mb-3">Extra Charges</h3>
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.nightChargesApply}
                    onChange={(e) =>
                      setFormData({ ...formData, nightChargesApply: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Night Charges Apply</span>
                </label>

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
                      className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
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

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Display Order:</span>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
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
            <div key={categoryName} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <Car className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{categoryName}</h2>
                <span className="text-sm text-gray-500">({items.length} packages)</span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {items.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-xl p-4 ${
                      pkg.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                            {pkg.name}
                            {pkg.isPopular && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                          </h3>
                          {pkg.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pkg.location.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ₹{pkg.basePrice.toLocaleString()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div>Extra Km: ₹{pkg.extraKmCharge}</div>
                      <div>Extra Hr: ₹{pkg.extraHourCharge}</div>
                    </div>

                    {pkg.nightChargesApply && (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Night charge: ₹{pkg.nightChargeAmount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No packages configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create local packages like 4hr/40km, 8hr/80km for different vehicle categories
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      )}
    </div>
  );
}
