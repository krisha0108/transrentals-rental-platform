'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Clock,
  Layers,
  Star,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface TripType {
  id: string;
  name: string;
  slug: string;
}

interface LocalPackage {
  id: string;
  serviceId: string;
  tripTypeId: string;
  name: string;
  hours: number;
  kms: number;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  service: { id: string; name: string; slug: string };
  tripType: { id: string; name: string; slug: string };
}

const defaultFormData = {
  id: '',
  serviceId: '',
  tripTypeId: '',
  name: '',
  hours: 4,
  kms: 40,
  description: '',
  isActive: true,
  displayOrder: 0,
};

export default function AdminLocalPackagesPage() {
  const [packages, setPackages] = useState<LocalPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterService, setFilterService] = useState('');

  const fetchData = async () => {
    try {
      const [packagesRes, servicesRes, tripTypesRes] = await Promise.all([
        fetch('/api/admin/booking/local-packages'),
        fetch('/api/admin/services?parentsOnly=true'),
        fetch('/api/admin/booking/trip-types'),
      ]);

      const packagesData = await packagesRes.json();
      const servicesData = await servicesRes.json();
      const tripTypesData = await tripTypesRes.json();

      if (packagesData.success) setPackages(packagesData.packages);
      if (servicesData.success) setServices(servicesData.services || []);
      if (tripTypesData.success) setTripTypes(tripTypesData.tripTypes || []);
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
    // Find "Local" trip type
    const localTripType = tripTypes.find(
      (t) => t.slug === 'local' || t.name.toLowerCase().includes('local')
    );
    setFormData({
      ...defaultFormData,
      serviceId: services[0]?.id || '',
      tripTypeId: localTripType?.id || tripTypes[0]?.id || '',
    });
    setShowForm(true);
  };

  const handleEdit = (pkg: LocalPackage) => {
    setFormData({
      id: pkg.id,
      serviceId: pkg.serviceId,
      tripTypeId: pkg.tripTypeId,
      name: pkg.name,
      hours: pkg.hours,
      kms: pkg.kms,
      description: pkg.description || '',
      isActive: pkg.isActive,
      displayOrder: pkg.displayOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const method = formData.id ? 'PATCH' : 'POST';
      const response = await fetch('/api/admin/booking/local-packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name || `${formData.hours}hr/${formData.kms}km`,
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
      const response = await fetch(`/api/admin/booking/local-packages?id=${id}`, {
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

  const filteredPackages = filterService
    ? packages.filter((p) => p.serviceId === filterService)
    : packages;

  // Group packages by service
  const groupedByService: Record<string, LocalPackage[]> = {};
  filteredPackages.forEach((p) => {
    const svc = p.service.name;
    if (!groupedByService[svc]) groupedByService[svc] = [];
    groupedByService[svc].push(p);
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
          <p className="text-gray-600">
            Configure hourly packages like 4hr/40km, 8hr/80km for Self-Drive & Bike Rentals
          </p>
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
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
                    Service *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!formData.id}
                  >
                    <option value="">Select Service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Type *
                  </label>
                  <select
                    value={formData.tripTypeId}
                    onChange={(e) => setFormData({ ...formData, tripTypeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!formData.id}
                  >
                    <option value="">Select Trip Type</option>
                    {tripTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Package Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 4hr/40km"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated if empty</p>
                  </div>

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
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="e.g., Best for local city travel"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-4">
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

      {/* Packages Grid by Service */}
      {Object.keys(groupedByService).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByService).map(([serviceName, items]) => (
            <div key={serviceName} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{serviceName}</h2>
                <span className="text-sm text-gray-500">({items.length} packages)</span>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
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
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          <p className="text-xs text-gray-500">{pkg.tripType.name}</p>
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

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {pkg.hours} hrs
                      </span>
                      <span>{pkg.kms} km</span>
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-gray-500 mt-2">{pkg.description}</p>
                    )}

                    {!pkg.isActive && (
                      <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Inactive
                      </span>
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
            Create local packages like 4hr/40km, 8hr/80km for different services
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
