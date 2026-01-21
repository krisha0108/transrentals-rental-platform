'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
}

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
  createReverse: true, // Create both directions by default
};

export default function ServiceDistancesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [distances, setDistances] = useState<CityDistance[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterFrom, setFilterFrom] = useState('');

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
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (distance: CityDistance) => {
    setFormData({
      fromLocationId: distance.fromLocationId,
      toLocationId: distance.toLocationId,
      distanceKm: distance.distanceKm,
      durationMinutes: distance.durationMinutes || 0,
      durationText: distance.durationText || '',
      routeVia: distance.routeVia || '',
      tollEstimate: distance.tollEstimate || 0,
      statePermit: distance.statePermit,
      isVerified: distance.isVerified,
      source: distance.source || 'manual',
      isActive: distance.isActive,
      createReverse: false, // Don't create reverse when editing
    });
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

      if (data.success) {
        setShowForm(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save distance');
      }
    } catch (err) {
      setError('Failed to save distance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, deleteBoth: boolean = false) => {
    if (!confirm(`Delete this distance${deleteBoth ? ' (both directions)' : ''}?`)) return;

    try {
      const response = await fetch(
        `/api/admin/distances?id=${id}${deleteBoth ? '&both=true' : ''}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete distance');
    }
  };

  // Convert minutes to readable format
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const filteredDistances = filterFrom
    ? distances.filter((d) => d.fromLocationId === filterFrom)
    : distances;

  // Group by from location
  const groupedByFrom: Record<string, CityDistance[]> = {};
  filteredDistances.forEach((d) => {
    const from = d.fromLocation.name;
    if (!groupedByFrom[from]) groupedByFrom[from] = [];
    groupedByFrom[from].push(d);
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
            Distance Matrix - {serviceTitle}
          </h1>
          <p className="text-gray-600">
            Manage city-to-city distances for accurate outstation pricing
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Distance
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How Outstation Pricing Works:</p>
            <p>
              Outstation Price = (Distance x Per-Km Rate) + Driver Allowance + Tolls
            </p>
            <p className="mt-1 text-blue-600">
              Example: 280km x Rs12/km = Rs3,360 + Rs300 driver = Rs3,660 base fare
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add City Distance</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Route</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From City *
                    </label>
                    <select
                      value={formData.fromLocationId}
                      onChange={(e) =>
                        setFormData({ ...formData, fromLocationId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    value={formData.distanceKm}
                    onChange={(e) =>
                      setFormData({ ...formData, distanceKm: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 330 for 5h 30m"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toll Estimate (Rs)
                  </label>
                  <input
                    type="number"
                    value={formData.tollEstimate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tollEstimate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route Via
                  </label>
                  <input
                    type="text"
                    value={formData.routeVia}
                    onChange={(e) => setFormData({ ...formData, routeVia: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Via NH48"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.statePermit}
                    onChange={(e) => setFormData({ ...formData, statePermit: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Needs State Permit</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Verified Distance</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.createReverse}
                    onChange={(e) =>
                      setFormData({ ...formData, createReverse: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <ArrowLeftRight className="w-4 h-4" />
                    Create Both Directions
                  </span>
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
                      Save Distance
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distance Matrix by Origin */}
      {Object.keys(groupedByFrom).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByFrom).map(([fromCity, items]) => (
            <div key={fromCity} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <MapPin className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">From {fromCity}</h2>
                <span className="text-sm text-gray-500">({items.length} destinations)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">To</th>
                      <th className="px-4 py-3 text-right">Distance</th>
                      <th className="px-4 py-3 text-right">Duration</th>
                      <th className="px-4 py-3 text-right">Toll Est.</th>
                      <th className="px-4 py-3 text-center">Permit</th>
                      <th className="px-4 py-3 text-center">Verified</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((dist) => (
                      <tr key={dist.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{dist.toLocation.name}</span>
                          </div>
                          {dist.routeVia && (
                            <p className="text-xs text-gray-500 ml-6">{dist.routeVia}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {dist.distanceKm} km
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {dist.durationText || formatDuration(dist.durationMinutes)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {dist.tollEstimate ? `Rs${dist.tollEstimate}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {dist.statePermit ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {dist.isVerified ? (
                            <Check className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleEdit(dist)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                              title="Edit"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dist.id, false)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                              title="Delete"
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
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No distances configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add city-to-city distances for accurate outstation pricing calculation
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add First Distance
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {distances.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{distances.length}</p>
              <p className="text-sm text-gray-500">Total Routes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {distances.filter((d) => d.isVerified).length}
              </p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(distances.map((d) => d.fromLocationId)).size}
              </p>
              <p className="text-sm text-gray-500">Origin Cities</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
