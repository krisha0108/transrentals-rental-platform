'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Save,
  Search,
  Route,
  MapPin,
  Calendar,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  requiresFromLocation: boolean;
  requiresToLocation: boolean;
  requiresReturnDate: boolean;
  isActive: boolean;
  displayOrder: number;
  isEnabled?: boolean; // Whether this trip type is enabled for the current service
  serviceTripTypeId?: string; // The ServiceTripType ID if enabled
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

export default function ServiceTripTypesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;

  const [service, setService] = useState<Service | null>(null);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Fetch service details
  const fetchService = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/services?slug=${serviceSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setService(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch service:', error);
    }
  }, [serviceSlug]);

  // Fetch trip types with service-specific status
  const fetchTripTypes = useCallback(async () => {
    if (!service?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/trip-types`);
      if (res.ok) {
        const data = await res.json();
        setTripTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch trip types:', error);
    } finally {
      setLoading(false);
    }
  }, [service?.id, serviceSlug]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    if (service?.id) {
      fetchTripTypes();
    }
  }, [service?.id, fetchTripTypes]);

  const toggleTripType = async (tripType: TripType) => {
    if (!service?.id) return;
    setSaving(tripType.id);

    try {
      if (tripType.isEnabled) {
        // Disable - delete the ServiceTripType
        const res = await fetch(`/api/admin/services/${serviceSlug}/trip-types/${tripType.serviceTripTypeId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchTripTypes();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to disable trip type');
        }
      } else {
        // Enable - create a new ServiceTripType
        const res = await fetch(`/api/admin/services/${serviceSlug}/trip-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripTypeId: tripType.id }),
        });
        if (res.ok) {
          fetchTripTypes();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to enable trip type');
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to toggle trip type');
    } finally {
      setSaving(null);
    }
  };

  const filteredTripTypes = search
    ? tripTypes.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase())
      )
    : tripTypes;

  const enabledCount = tripTypes.filter((t) => t.isEnabled).length;

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Types</h1>
          <p className="text-gray-600">
            Manage trip types for {service.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Enabled</p>
          <p className="text-2xl font-bold text-blue-600">{enabledCount}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Route className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">About Trip Types</h3>
            <p className="text-sm text-blue-700 mt-1">
              Enable the trip types that are available for {service.name}. Each trip type defines what information
              is required from the customer (pickup location, drop location, return date, etc.).
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trip types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" onClick={fetchTripTypes}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Trip Types List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredTripTypes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Route className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trip types available</h3>
          <p className="text-gray-500">
            Create trip types in the global settings first, then enable them here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requirements</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTripTypes.map((tripType) => (
                <tr key={tripType.id} className={`hover:bg-gray-50 ${!tripType.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tripType.isEnabled ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Route className={`w-5 h-5 ${tripType.isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{tripType.name}</div>
                        <div className="text-xs text-gray-500">{tripType.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      {tripType.requiresFromLocation && (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                          <MapPin className="w-3 h-3" /> From
                        </span>
                      )}
                      {tripType.requiresToLocation && (
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs">
                          <MapPin className="w-3 h-3" /> To
                        </span>
                      )}
                      {tripType.requiresReturnDate && (
                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs">
                          <Calendar className="w-3 h-3" /> Return
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!tripType.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Inactive (Global)
                      </span>
                    ) : tripType.isEnabled ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-1" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tripType.isActive && (
                      <Button
                        variant={tripType.isEnabled ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleTripType(tripType)}
                        disabled={saving === tripType.id}
                      >
                        {saving === tripType.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tripType.isEnabled ? (
                          'Disable'
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
