'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Car,
  Plus,
  Trash2,
  Save,
  Loader2,
  IndianRupee,
  Settings2,
  ArrowLeft,
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

export default function ServiceCityPricingPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [pricing, setPricing] = useState<CityPricing[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
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
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/services/${serviceSlug}/city-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save pricing');
      }
    } catch (err) {
      setError('Failed to save pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing configuration?')) return;

    try {
      const response = await fetch(`/api/admin/services/${serviceSlug}/city-pricing?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete pricing');
    }
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
    setShowForm(true);
  };

  const filteredPricing = pricing.filter((p) => {
    if (filterCategory && p.vehicleCategoryId !== filterCategory) return false;
    if (filterLocation && p.locationId !== filterLocation) return false;
    return true;
  });

  // Group pricing by location
  const groupedByLocation: Record<string, CityPricing[]> = {};
  filteredPricing.forEach((p) => {
    const loc = p.locations?.name || 'Unknown Location';
    if (!groupedByLocation[loc]) groupedByLocation[loc] = [];
    groupedByLocation[loc].push(p);
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
            City-wise Pricing - {serviceTitle}
          </h1>
          <p className="text-gray-600">
            Set per-km rates for each vehicle category in each city
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              vehicleCategoryId: categories[0]?.id || '',
              locationId: locations[0]?.id || '',
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
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Pricing
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
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
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cities</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Set City Pricing</h2>
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
                    City *
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select City</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Base Rates</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Per Km Rate (Rs) *
                    </label>
                    <input
                      type="number"
                      value={formData.baseKmRate}
                      onChange={(e) =>
                        setFormData({ ...formData, baseKmRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                      step={0.5}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Km Per Day
                    </label>
                    <input
                      type="number"
                      value={formData.minKmPerDay}
                      onChange={(e) =>
                        setFormData({ ...formData, minKmPerDay: parseInt(e.target.value) || 250 })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-medium text-green-900 mb-3">Driver Allowance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day Allowance (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.driverDayAllowance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          driverDayAllowance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Night Halt (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.driverNightAllowance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          driverNightAllowance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-medium text-amber-900 mb-3">Surcharges</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Night Surcharge (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.nightSurcharge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nightSurcharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airport Surcharge (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.airportSurcharge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          airportSurcharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Outstation Days
                    </label>
                    <input
                      type="number"
                      value={formData.outstationMinDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          outstationMinDays: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tollsIncluded}
                    onChange={(e) => setFormData({ ...formData, tollsIncluded: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Tolls Included</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.statePermitIncluded}
                    onChange={(e) =>
                      setFormData({ ...formData, statePermitIncluded: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">State Permit Included</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.parkingIncluded}
                    onChange={(e) =>
                      setFormData({ ...formData, parkingIncluded: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Parking Included</span>
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
                      Save Pricing
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Table by Location */}
      {Object.keys(groupedByLocation).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByLocation).map(([locationName, items]) => (
            <div key={locationName} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{locationName}</h2>
                <span className="text-sm text-gray-500">({items.length} categories)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Vehicle</th>
                      <th className="px-4 py-3 text-right">Per Km</th>
                      <th className="px-4 py-3 text-right">Min Km/Day</th>
                      <th className="px-4 py-3 text-right">Driver/Day</th>
                      <th className="px-4 py-3 text-right">Night Halt</th>
                      <th className="px-4 py-3 text-center">Includes</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{p.chauffeur_vehicle_categories.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-green-600">
                          Rs{p.baseKmRate}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{p.minKmPerDay}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          Rs{p.driverDayAllowance}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          Rs{p.driverNightAllowance}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1 text-xs">
                            {p.tollsIncluded && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Tolls
                              </span>
                            )}
                            {p.statePermitIncluded && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                Permit
                              </span>
                            )}
                            {p.parkingIncluded && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                Parking
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              p.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
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
          <IndianRupee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No pricing configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Set per-km rates for vehicle categories in different cities
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Pricing
          </button>
        </div>
      )}
    </div>
  );
}
