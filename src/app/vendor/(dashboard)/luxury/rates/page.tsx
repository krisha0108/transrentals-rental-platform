'use client';

import { useState, useEffect } from 'react';
import {
  Crown,
  Car,
  MapPin,
  Clock,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface LuxuryRate {
  id: string;
  locationId: string;
  carCategory: string;
  packageType: string;
  packageHours: number;
  packageKm: number;
  basePrice: number;
  extraKmRate: number;
  extraHourRate: number;
  vehicleName: string | null;
  vehicleNumber: string | null;
  vehicleYear: number | null;
  vehicleColor: string | null;
  isActive: boolean;
  location: { id: string; name: string; slug: string };
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface CarCategory {
  id: string;
  name: string;
  examples: string;
}

interface PackageType {
  id: string;
  label: string;
  hours: number;
  km: number;
}

export default function VendorLuxuryRatesPage() {
  const [rates, setRates] = useState<LuxuryRate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategory[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<LuxuryRate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    locationId: '',
    carCategory: '',
    packageType: '',
    basePrice: '',
    extraKmRate: '',
    extraHourRate: '',
    vehicleName: '',
    vehicleNumber: '',
    vehicleYear: '',
    vehicleColor: '',
  });

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterLocation) params.set('locationId', filterLocation);
      if (filterCategory) params.set('carCategory', filterCategory);

      const res = await fetch(`/api/vendor/luxury-rates?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRates(data.rates || []);
        setLocations(data.locations || []);
        setCarCategories(data.carCategories || []);
        setPackageTypes(data.packageTypes || []);
      } else {
        setError(data.error || 'Failed to fetch rates');
      }
    } catch (err) {
      setError('Failed to fetch rates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [filterLocation, filterCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = '/api/vendor/luxury-rates';
      const method = editingRate ? 'PATCH' : 'POST';
      const body = editingRate
        ? { id: editingRate.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        setEditingRate(null);
        resetForm();
        fetchRates();
      } else {
        alert(data.error || 'Failed to save rate');
      }
    } catch (err) {
      alert('Failed to save rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rate: LuxuryRate) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;

    try {
      const res = await fetch(`/api/vendor/luxury-rates?id=${rate.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        fetchRates();
      } else {
        alert(data.error || 'Failed to delete rate');
      }
    } catch (err) {
      alert('Failed to delete rate');
    }
  };

  const handleToggleActive = async (rate: LuxuryRate) => {
    try {
      const res = await fetch('/api/vendor/luxury-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rate.id, isActive: !rate.isActive }),
      });

      const data = await res.json();

      if (data.success) {
        fetchRates();
      } else {
        alert(data.error || 'Failed to update rate');
      }
    } catch (err) {
      alert('Failed to update rate');
    }
  };

  const resetForm = () => {
    setFormData({
      locationId: '',
      carCategory: '',
      packageType: '',
      basePrice: '',
      extraKmRate: '',
      extraHourRate: '',
      vehicleName: '',
      vehicleNumber: '',
      vehicleYear: '',
      vehicleColor: '',
    });
  };

  const openEditModal = (rate: LuxuryRate) => {
    setEditingRate(rate);
    setFormData({
      locationId: rate.locationId,
      carCategory: rate.carCategory,
      packageType: rate.packageType,
      basePrice: rate.basePrice.toString(),
      extraKmRate: rate.extraKmRate.toString(),
      extraHourRate: rate.extraHourRate.toString(),
      vehicleName: rate.vehicleName || '',
      vehicleNumber: rate.vehicleNumber || '',
      vehicleYear: rate.vehicleYear?.toString() || '',
      vehicleColor: rate.vehicleColor || '',
    });
    setShowAddModal(true);
  };

  const getCategoryName = (categoryId: string) => {
    return carCategories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const getPackageLabel = (packageId: string) => {
    return packageTypes.find(p => p.id === packageId)?.label || packageId;
  };

  // Group rates by location and category for better display
  const groupedRates = rates.reduce((acc, rate) => {
    const key = `${rate.location.name}-${rate.carCategory}`;
    if (!acc[key]) {
      acc[key] = {
        location: rate.location,
        carCategory: rate.carCategory,
        rates: [],
      };
    }
    acc[key].rates.push(rate);
    return acc;
  }, {} as Record<string, { location: Location; carCategory: string; rates: LuxuryRate[] }>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your luxury rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">Luxury Local Rates</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Set your pricing for local luxury packages (4hr, 8hr, 12hr)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRates}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingRate(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-600"
          >
            <Plus className="w-5 h-5" />
            Add Rate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by City
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">All Cities</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Car Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              {carCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Rates List */}
      {rates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No rates configured yet</h3>
          <p className="text-gray-500 mb-6">
            Add your luxury car rates to start receiving instant bookings for local trips.
          </p>
          <button
            onClick={() => {
              resetForm();
              setEditingRate(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-600"
          >
            <Plus className="w-5 h-5" />
            Add Your First Rate
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedRates).map((group) => (
            <div
              key={`${group.location.id}-${group.carCategory}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-900 to-amber-900 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-300" />
                      <span className="font-semibold">{group.location.name}</span>
                    </div>
                    <span className="text-amber-300">|</span>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-amber-300" />
                      <span>{getCategoryName(group.carCategory)}</span>
                    </div>
                  </div>
                  <span className="text-sm text-amber-200">
                    {group.rates.length} package{group.rates.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="divide-y">
                {group.rates.map((rate) => (
                  <div
                    key={rate.id}
                    className={`p-4 flex items-center justify-between ${
                      !rate.isActive ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{getPackageLabel(rate.packageType)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-lg font-bold text-amber-600">
                        <DollarSign className="w-4 h-4" />
                        ₹{rate.basePrice.toLocaleString()}
                      </div>

                      {rate.vehicleName && (
                        <span className="text-sm text-gray-500">
                          {rate.vehicleName}
                          {rate.vehicleYear && ` (${rate.vehicleYear})`}
                        </span>
                      )}

                      <div className="text-xs text-gray-500">
                        Extra: ₹{rate.extraKmRate}/km, ₹{rate.extraHourRate}/hr
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(rate)}
                        className={`p-2 rounded-lg ${
                          rate.isActive
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={rate.isActive ? 'Active' : 'Inactive'}
                      >
                        {rate.isActive ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(rate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rate)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRate ? 'Edit Rate' : 'Add New Rate'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingRate && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        value={formData.locationId}
                        onChange={(e) =>
                          setFormData({ ...formData, locationId: e.target.value })
                        }
                        required
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select City</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Car Category *
                      </label>
                      <select
                        value={formData.carCategory}
                        onChange={(e) =>
                          setFormData({ ...formData, carCategory: e.target.value })
                        }
                        required
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select Category</option>
                        {carCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.examples})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Type *
                    </label>
                    <select
                      value={formData.packageType}
                      onChange={(e) =>
                        setFormData({ ...formData, packageType: e.target.value })
                      }
                      required
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="">Select Package</option>
                      {packageTypes.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    required
                    min="0"
                    placeholder="e.g., 8999"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extra Km Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.extraKmRate}
                    onChange={(e) =>
                      setFormData({ ...formData, extraKmRate: e.target.value })
                    }
                    min="0"
                    placeholder="e.g., 35"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extra Hour Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.extraHourRate}
                    onChange={(e) =>
                      setFormData({ ...formData, extraHourRate: e.target.value })
                    }
                    min="0"
                    placeholder="e.g., 350"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Vehicle Details (Optional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Name
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleName}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleName: e.target.value })
                      }
                      placeholder="e.g., Mercedes E-Class"
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleNumber: e.target.value })
                      }
                      placeholder="e.g., GJ 05 XX 1234"
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={formData.vehicleYear}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleYear: e.target.value })
                      }
                      min="2015"
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g., 2023"
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleColor}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleColor: e.target.value })
                      }
                      placeholder="e.g., Black"
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRate(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingRate ? 'Update Rate' : 'Add Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
