'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Loader2,
  Edit,
  MapPin,
  CheckCircle,
  XCircle,
  Fuel,
  Settings,
  Users,
  Gauge,
  IndianRupee,
  Calendar,
  Building2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleDetails {
  id: string;
  name: string;
  slug: string;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  engineCC: number | null;
  mileage: string | null;
  sideImage: string | null;
  specs: any;
  features: any;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  brands?: {
    id: string;
    name: string;
    logo: string | null;
  };
  services_vehicle_models_serviceIdToservices?: {
    id: string;
    name: string;
    slug: string;
  };
  services_vehicle_models_subServiceIdToservices?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  chauffeur_vehicle_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  vehicle_model_locations?: Array<{
    id: string;
    basePricePerDay: number | null;
    isActive: boolean;
    locations?: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  vendor_fleets?: Array<{
    id: string;
    vendors?: {
      id: string;
      businessName: string;
    };
  }>;
}

export default function VehicleViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`/api/admin/services/${slug}/fleet/${vehicleId}`);
        if (res.ok) {
          const data = await res.json();
          setVehicle(data.vehicle);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to fetch vehicle');
        }
      } catch (err) {
        setError('Failed to fetch vehicle');
      } finally {
        setLoading(false);
      }
    };

    if (slug && vehicleId) {
      fetchVehicle();
    }
  }, [slug, vehicleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <Link href={`/admin/services/${slug}/fleet`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-500">{error || 'Vehicle not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}/fleet`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fleet
          </Link>
          <div className="flex items-center gap-4">
            {vehicle.sideImage ? (
              <img src={vehicle.sideImage} alt={vehicle.name} className="w-20 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
              <p className="text-gray-600">{vehicle.brands?.name || 'Unknown Brand'} - {vehicle.services_vehicle_models_serviceIdToservices?.name || 'Unknown Service'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/services/${slug}/fleet`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        {vehicle.isActive ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Inactive
          </span>
        )}
        {(vehicle.services_vehicle_models_subServiceIdToservices || vehicle.chauffeur_vehicle_categories) && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {vehicle.services_vehicle_models_subServiceIdToservices?.name || vehicle.chauffeur_vehicle_categories?.name}
          </span>
        )}
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Specs */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicle.fuelType && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Fuel className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Fuel Type</p>
                    <p className="font-medium">{vehicle.fuelType}</p>
                  </div>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Transmission</p>
                    <p className="font-medium">{vehicle.transmission}</p>
                  </div>
                </div>
              )}
              {vehicle.seatingCapacity && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Seating</p>
                    <p className="font-medium">{vehicle.seatingCapacity} Seats</p>
                  </div>
                </div>
              )}
              {vehicle.engineCC && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Gauge className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Engine</p>
                    <p className="font-medium">{vehicle.engineCC} CC</p>
                  </div>
                </div>
              )}
              {vehicle.mileage && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Gauge className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Mileage</p>
                    <p className="font-medium">{vehicle.mileage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Locations */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Assigned Locations</h2>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                {vehicle.vehicle_model_locations?.length || 0} locations
              </span>
            </div>
            {!vehicle.vehicle_model_locations || vehicle.vehicle_model_locations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No locations assigned yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {vehicle.vehicle_model_locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{loc.locations?.name || 'Unknown Location'}</p>
                      {loc.basePricePerDay && (
                        <p className="text-xs text-green-600">₹{loc.basePricePerDay}/day</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Slug</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{vehicle.slug}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Brand</span>
                <span className="font-medium">{vehicle.brands?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{vehicle.services_vehicle_models_serviceIdToservices?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Category</span>
                <span className="font-medium">
                  {vehicle.services_vehicle_models_subServiceIdToservices?.name ||
                    vehicle.chauffeur_vehicle_categories?.name ||
                    'Uncategorized'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Locations</span>
                <span className="font-medium">{vehicle.vehicle_model_locations?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Vendors</span>
                <span className="font-medium">{vehicle.vendor_fleets?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Display Order</span>
                <span className="font-medium">{vehicle.displayOrder}</span>
              </div>
            </div>
          </div>

          {/* Vendors */}
          {vehicle.vendor_fleets && vehicle.vendor_fleets.length > 0 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Vendors ({vehicle.vendor_fleets.length})
              </h2>
              <div className="space-y-2">
                {vehicle.vendor_fleets.map((vf) => (
                  <div key={vf.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{vf.vendors?.businessName || 'Unknown Vendor'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Created: {new Date(vehicle.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
