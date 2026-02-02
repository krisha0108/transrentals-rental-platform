'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Car,
  Bike,
  Bus,
  Crown,
  Plus,
  MapPin,
  IndianRupee,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  yearOfManufacture: number | null;
  color: string | null;
  images: string[] | null;
  isAvailable: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  vehicle_model?: {
    id: string;
    name: string;
    slug: string;
    sideImage: string | null;
    brand: { id: string; name: string; slug: string };
  } | null;
  // Car rental specific fields
  vehicle_category?: {
    id: string;
    name: string;
    slug: string;
    seatingCapacity?: number;
    image?: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  } | null;
  service: { id: string; name: string; slug: string };
  fleetLocations: Array<{
    id: string;
    location: { id: string; name: string; slug: string; parentId?: string | null };
  }>;
  fleetPricing: Array<{
    id: string;
    tripTypeId: string;
    priceType: string;
    basePrice: number;
    perDayRate: number | null;
    perHourRate: number | null;
  }>;
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'available' | 'unavailable';

export default function VendorFleetPage() {
  const searchParams = useSearchParams();
  const serviceFilter = searchParams.get('service');

  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [approvedServices, setApprovedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>(serviceFilter || 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/vendor/fleet');
      const data = await res.json();

      if (res.ok && data.success) {
        setFleet(data.fleet || []);
        setApprovedServices(data.approvedServices || []);
      } else {
        setError(data.error || data.details || 'Failed to fetch fleet');
      }
    } catch (err: any) {
      console.error('Failed to fetch fleet:', err);
      setError(err?.message || 'Failed to fetch fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Set service filter from URL params
  useEffect(() => {
    if (serviceFilter) {
      const service = approvedServices.find(s => s.slug === serviceFilter);
      if (service) {
        setSelectedService(service.id);
      }
    }
  }, [serviceFilter, approvedServices]);

  // Helper to normalize vehicle field names (handles both API formats)
  const normalizeVehicle = (vehicle: any) => {
    const service = vehicle.services || vehicle.service;
    const vehicleModel = vehicle.vehicle_models || vehicle.vehicle_model;
    const vehicleCategory = vehicle.chauffeur_vehicle_categories || vehicle.vehicle_category;
    const brandData = vehicle.brands || vehicle.brand;
    const fleetLocations = vehicle.vendor_fleet_locations || vehicle.fleetLocations || [];
    const fleetPricing = vehicle.fleet_pricing || vehicle.fleetPricing || [];
    return { service, vehicleModel, vehicleCategory, brandData, fleetLocations, fleetPricing };
  };

  // Helper to get vehicle name (handles both bike-rental and car-rental)
  const getVehicleName = (vehicle: FleetVehicle) => {
    const { vehicleModel, vehicleCategory, brandData } = normalizeVehicle(vehicle);
    // For bike-rental: Brand + Model name
    if (vehicleModel) {
      const brand = vehicleModel.brands || vehicleModel.brand;
      return `${brand?.name || ''} ${vehicleModel.name || ''}`.trim();
    }
    // For car-rental: Brand + Category name
    if (brandData || vehicleCategory) {
      return `${brandData?.name || ''} ${vehicleCategory?.name || ''}`.trim();
    }
    return 'Unknown Vehicle';
  };

  // Filter fleet
  const filteredFleet = fleet.filter((vehicle) => {
    // Search filter
    const vehicleName = getVehicleName(vehicle);
    const matchesSearch =
      vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Service filter - handle both API field names
    const { service } = normalizeVehicle(vehicle);
    const matchesService = selectedService === 'all' || service?.id === selectedService;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = vehicle.isActive;
    else if (statusFilter === 'inactive') matchesStatus = !vehicle.isActive;
    else if (statusFilter === 'available') matchesStatus = vehicle.isAvailable && vehicle.isActive;
    else if (statusFilter === 'unavailable') matchesStatus = !vehicle.isAvailable || !vehicle.isActive;

    return matchesSearch && matchesService && matchesStatus;
  });

  const handleToggleActive = async (vehicle: FleetVehicle) => {
    setActionLoading(vehicle.id);
    try {
      const res = await fetch(`/api/vendor/fleet/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFleet((prev) =>
          prev.map((v) => (v.id === vehicle.id ? { ...v, isActive: !v.isActive } : v))
        );
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/vendor/fleet/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFleet((prev) => prev.filter((v) => v.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(data.error || 'Failed to delete vehicle');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

  const getServiceIcon = (slug: string) => {
    if (slug?.includes('bike')) return <Bike className="w-4 h-4" />;
    if (slug?.includes('bus') || slug?.includes('tempo')) return <Bus className="w-4 h-4" />;
    if (slug?.includes('luxury')) return <Crown className="w-4 h-4" />;
    return <Car className="w-4 h-4" />;
  };

  const getDailyRate = (vehicle: FleetVehicle) => {
    const { fleetPricing } = normalizeVehicle(vehicle);
    const pricing = fleetPricing?.[0];
    return pricing?.perDayRate || pricing?.basePrice || 0;
  };

  const getVehicleImage = (vehicle: FleetVehicle) => {
    const { vehicleModel, vehicleCategory, brandData } = normalizeVehicle(vehicle);
    // ONLY show featured image (admin's model/category image) in list view
    // Do NOT show vendor uploaded images in list
    if (vehicleModel?.sideImage) return vehicleModel.sideImage;
    if (vehicleCategory?.image) return vehicleCategory.image;
    return null;
  };

  // Stats
  const stats = {
    total: fleet.length,
    active: fleet.filter((v) => v.isActive).length,
    available: fleet.filter((v) => v.isAvailable && v.isActive).length,
    verified: fleet.filter((v) => v.isVerified).length,
    pending: fleet.filter((v) => !v.isVerified).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Fleet</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => { setError(null); setLoading(true); fetchFleet(); }}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600">Manage all your vehicles across services</p>
        </div>
        <Link href="/vendor/fleet/add">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Service Filter */}
          {approvedServices.length > 1 && (
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Services</option>
              {approvedServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Fleet List */}
      {filteredFleet.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {fleet.length === 0 ? 'No vehicles yet' : 'No matching vehicles'}
          </h3>
          <p className="text-gray-500 mb-6">
            {fleet.length === 0
              ? 'Add your first vehicle to start accepting bookings'
              : 'Try adjusting your filters'}
          </p>
          {fleet.length === 0 && (
            <Link href="/vendor/fleet/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleet.map((vehicle) => {
            const { service, vehicleCategory, fleetLocations } = normalizeVehicle(vehicle);
            return (
            <div
              key={vehicle.id}
              className={cn(
                'bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md',
                !vehicle.isActive && 'opacity-70'
              )}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                {getVehicleImage(vehicle) && !getVehicleImage(vehicle)?.startsWith('file://') ? (
                  <img
                    src={getVehicleImage(vehicle)!}
                    alt={getVehicleName(vehicle)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getServiceIcon(service?.slug)}
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {vehicle.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  {!vehicle.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  ) : vehicle.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Booked
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getVehicleName(vehicle)}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      {getServiceIcon(service?.slug)}
                      {service?.name}
                    </p>
                    {/* Show seating capacity for car-rental */}
                    {vehicleCategory?.seatingCapacity && (
                      <p className="text-xs text-gray-400 mt-1">
                        {vehicleCategory.seatingCapacity} Seater
                      </p>
                    )}
                  </div>
                  {vehicle.color && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {vehicle.color}
                    </span>
                  )}
                </div>

                {/* Registration & Year */}
                <div className="text-sm text-gray-600 mb-3">
                  {vehicle.registrationNumber && (
                    <p><span className="font-medium">Reg:</span> {vehicle.registrationNumber}</p>
                  )}
                  {vehicle.yearOfManufacture && (
                    <p><span className="font-medium">Year:</span> {vehicle.yearOfManufacture}</p>
                  )}
                </div>

                {/* Pricing */}
                {getDailyRate(vehicle) > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600">{getDailyRate(vehicle)}</span>
                    <span className="text-xs text-gray-500">/day</span>
                  </div>
                )}

                {/* Locations */}
                {fleetLocations && fleetLocations.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    {fleetLocations.slice(0, 2).map((fl: any) => fl.locations?.name || fl.location?.name).join(', ')}
                    {fleetLocations.length > 2 && ` +${fleetLocations.length - 2}`}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleToggleActive(vehicle)}
                    disabled={actionLoading === vehicle.id}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
                      vehicle.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      actionLoading === vehicle.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {actionLoading === vehicle.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : vehicle.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Inactive
                      </>
                    )}
                  </button>
                  <Link
                    href={`/vendor/fleet/${vehicle.id}`}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/vendor/fleet/${vehicle.id}/edit`}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(vehicle.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Vehicle</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this vehicle from your fleet? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
