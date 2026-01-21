'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Package,
} from 'lucide-react';

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  yearOfManufacture: string | null;
  color: string | null;
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  vehicle_models: {
    id: string;
    name: string;
    brand: { id: string; name: string; logo?: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  service: { id: string; name: string; slug: string } | null;
  services_vehicle_models_subServiceIdToservices: { id: string; name: string } | null;
  fleetLocations: { location: { id: string; name: string } }[];
  createdAt: string;
}

export default function TransporterFleetPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;
    fetchFleet();
  }, [sessionStatus]);

  const fetchFleet = async () => {
    try {
      const response = await fetch('/api/vendor/fleet');
      const data = await response.json();

      if (data.success && data.fleet) {
        // Filter for truck/transporter service vehicles
        const truckFleet = data.fleet.filter((v: FleetVehicle) => {
          const svc = (v as any).services || v.service;
          const slug = svc?.slug?.toLowerCase() || '';
          const name = svc?.name?.toLowerCase() || '';
          return slug.includes('truck') ||
            name.includes('truck') ||
            slug.includes('transporter') ||
            name.includes('transporter') ||
            name.includes('packers');
        });
        setFleet(truckFleet);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (vehicleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        setFleet(fleet.map(v => v.id === vehicleId ? { ...v, isAvailable: !currentStatus } : v));
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`/api/vendor/fleet/${vehicleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFleet(fleet.filter(v => v.id !== vehicleId));
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const filteredFleet = fleet.filter(v => {
    if (filter === 'available') return v.isAvailable;
    if (filter === 'unavailable') return !v.isAvailable;
    return true;
  });

  const getVehicleDisplayName = (vehicle: FleetVehicle) => {
    if (vehicle.vehicle_models) {
      return vehicle.vehicle_models.brand?.name
        ? `${vehicle.vehicle_models.brand.name} ${vehicle.vehicle_models.name}`
        : vehicle.vehicle_models.name;
    }
    if (vehicle.brand && vehicle.vehicle_category) {
      return `${vehicle.brand.name} ${vehicle.vehicle_category.name}`;
    }
    return vehicle.vehicle_category?.name || 'Vehicle';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Truck Fleet</h1>
            <p className="text-gray-600">Manage your transport vehicles</p>
          </div>
        </div>
        <Link
          href="/vendor/fleet/add"
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">{fleet.length}</p>
          <p className="text-sm text-gray-500">Total Vehicles</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {fleet.filter(v => v.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-600">
            {fleet.filter(v => !v.isAvailable).length}
          </p>
          <p className="text-sm text-gray-500">Unavailable</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">
            {fleet.filter(v => v.isVerified).length}
          </p>
          <p className="text-sm text-gray-500">Verified</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Vehicles' },
          { value: 'available', label: 'Available' },
          { value: 'unavailable', label: 'Unavailable' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Fleet List */}
      {filteredFleet.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">
            {fleet.length === 0 ? 'No vehicles in your fleet' : 'No vehicles match the filter'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {fleet.length === 0
              ? 'Add your trucks and transport vehicles to start receiving quote requests'
              : 'Try changing the filter to see more vehicles'}
          </p>
          {fleet.length === 0 && (
            <Link
              href="/vendor/fleet/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First Vehicle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleet.map(vehicle => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Vehicle Image */}
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={getVehicleDisplayName(vehicle)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Truck className="w-16 h-16 text-indigo-300" />
                )}
              </div>

              <div className="p-4">
                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  {vehicle.isVerified && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Vehicle Name */}
                <h3 className="font-bold text-gray-900 mb-1">
                  {getVehicleDisplayName(vehicle)}
                </h3>
                {vehicle.registrationNumber && (
                  <p className="text-sm text-gray-500 font-mono mb-2">
                    {vehicle.registrationNumber}
                  </p>
                )}

                {/* Locations */}
                {vehicle.fleetLocations && vehicle.fleetLocations.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {vehicle.fleetLocations.slice(0, 2).map(l => l.location.name).join(', ')}
                      {vehicle.fleetLocations.length > 2 && ` +${vehicle.fleetLocations.length - 2}`}
                    </span>
                  </div>
                )}

                {/* Service Info */}
                {vehicle.service && (
                  <p className="text-xs text-indigo-600 mb-3">
                    {vehicle.service.name}
                    {vehicle.sub_service && ` - ${vehicle.sub_service.name}`}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleToggleAvailability(vehicle.id, vehicle.isAvailable)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                      vehicle.isAvailable
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <Link
                    href={`/vendor/fleet/${vehicle.id}/edit`}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Fleet Management Tips
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Keep your fleet updated to receive relevant quote requests</li>
          <li>• Mark vehicles as unavailable when they're on a trip</li>
          <li>• Add vehicle photos to build customer trust</li>
          <li>• Verified vehicles get priority in customer searches</li>
        </ul>
      </div>
    </div>
  );
}
