'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  Plus,
  Trash2,
  Save,
  Loader2,
  MapPin,
  Edit2,
  Check,
  X,
  ArrowLeft,
  AlertCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Navigation,
  DollarSign,
} from 'lucide-react';

interface Airport {
  id: string;
  name: string;
  code: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  _count?: { routesFrom: number; routesTo: number };
}

interface City {
  id: string;
  name: string;
  slug: string;
}

interface TransferRoute {
  id: string;
  fromLocation: { id: string; name: string; code: string | null };
  toLocation: { id: string; name: string; code: string | null };
  estimatedKm: number;
  estimatedDuration: string | null;
  basePrice: number;
  chauffeur_vehicle_categories: { id: string; name: string };
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

const defaultFormData = {
  name: '',
  code: '',
  parentId: '',
  latitude: '',
  longitude: '',
  description: '',
  distanceFromCity: '',
  isActive: true,
};

export default function ServiceAirportsPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [airports, setAirports] = useState<Airport[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [transferRoutes, setTransferRoutes] = useState<TransferRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRoutes, setShowRoutes] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [airportsRes, citiesRes] = await Promise.all([
        fetch(`/api/admin/airports?serviceSlug=${serviceSlug}`),
        fetch(`/api/services/${serviceSlug}/locations?type=CITY`),
      ]);

      const airportsData = await airportsRes.json();
      const citiesData = await citiesRes.json();

      if (airportsData.success) setAirports(airportsData.airports);
      if (citiesData.success) setCities(citiesData.locations || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransferRoutes = async (airportId: string) => {
    try {
      const res = await fetch(`/api/admin/airports/${airportId}/routes?serviceSlug=${serviceSlug}`);
      const data = await res.json();
      if (data.success) setTransferRoutes(data.routes);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceSlug]);

  const handleCreate = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (airport: Airport) => {
    setFormData({
      name: airport.name,
      code: airport.code || '',
      parentId: airport.parent?.id || '',
      latitude: airport.latitude?.toString() || '',
      longitude: airport.longitude?.toString() || '',
      description: airport.description || '',
      distanceFromCity: '',
      isActive: airport.isActive,
    });
    setEditingId(airport.id);
    setShowForm(true);
  };

  const handleViewRoutes = (airportId: string) => {
    if (showRoutes === airportId) {
      setShowRoutes(null);
    } else {
      setShowRoutes(airportId);
      fetchTransferRoutes(airportId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const url = editingId ? `/api/admin/airports/${editingId}` : '/api/admin/airports';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceSlug,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          distanceFromCity: formData.distanceFromCity ? parseInt(formData.distanceFromCity) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save airport');
      }
    } catch (err) {
      setError('Failed to save airport');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (airport: Airport) => {
    try {
      const response = await fetch(`/api/admin/airports/${airport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !airport.isActive }),
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle airport status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this airport? This will also remove all associated routes and pricing.')) return;

    try {
      const response = await fetch(`/api/admin/airports/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete airport');
    }
  };

  const filteredAirports = airports.filter(
    (airport) =>
      airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.parent?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plane className="w-7 h-7 text-blue-600" />
            Airports - {serviceTitle}
          </h1>
          <p className="text-gray-600">
            Manage airports and airport transfer routes for {serviceTitle}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Airport
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Airport Transfer Management:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Add airports and link them to their nearest city</li>
              <li>Airport transfers include special pricing and pickup charges</li>
              <li>Routes are automatically created for all vehicle categories</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search airports by name, code, or city..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                {editingId ? 'Edit Airport' : 'Add New Airport'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airport Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Indira Gandhi International Airport"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IATA Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="e.g., DEL"
                    maxLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance from City (km)
                  </label>
                  <input
                    type="number"
                    value={formData.distanceFromCity}
                    onChange={(e) => setFormData({ ...formData, distanceFromCity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 28.5562"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 77.1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional information about the airport..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (available for bookings)
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
                      {editingId ? 'Update Airport' : 'Add Airport'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Airports List */}
      {filteredAirports.length > 0 ? (
        <div className="space-y-4">
          {filteredAirports.map((airport) => (
            <div key={airport.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Plane className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{airport.name}</h3>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                        {airport.code}
                      </span>
                      {!airport.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {airport.parent?.name || 'No city linked'}
                      </span>
                      {airport.description && (
                        <span className="text-gray-400">{airport.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewRoutes(airport.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      showRoutes === airport.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    Routes
                  </button>
                  <button
                    onClick={() => handleToggleActive(airport)}
                    className={`p-2 rounded-lg ${
                      airport.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={airport.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {airport.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(airport)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(airport.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transfer Routes Panel */}
              {showRoutes === airport.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Airport Transfer Pricing
                  </h4>
                  {transferRoutes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white text-xs text-gray-600 uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">Route</th>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-right">Distance</th>
                            <th className="px-3 py-2 text-right">Duration</th>
                            <th className="px-3 py-2 text-right">Base Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {transferRoutes.slice(0, 10).map((route) => (
                            <tr key={route.id} className="bg-white">
                              <td className="px-3 py-2">
                                <span className="font-medium">
                                  {route.fromLocation.code || route.fromLocation.name}
                                </span>
                                <span className="text-gray-400 mx-1">→</span>
                                <span>{route.toLocation.name}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {route.vehicle_category.name}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">
                                {route.estimatedKm} km
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                {route.estimatedDuration || '-'}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-green-600">
                                ₹{route.basePrice.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {transferRoutes.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          And {transferRoutes.length - 10} more routes...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No transfer routes configured for this airport.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No airports configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add airports to enable airport transfer bookings
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add First Airport
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {airports.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{airports.length}</p>
              <p className="text-sm text-gray-500">Total Airports</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {airports.filter((a) => a.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(airports.map((a) => a.parent?.id).filter(Boolean)).size}
              </p>
              <p className="text-sm text-gray-500">Cities Covered</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
