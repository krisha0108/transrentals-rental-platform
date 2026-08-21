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
  Calendar,
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
      <div className="animate-pulse space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>
        {/* Stat boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        {/* Vehicle cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-20 bg-gray-100 rounded-xl"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                <div className="h-8 bg-gray-100 rounded-lg w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Fleet</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => { setError(null); setLoading(true); fetchFleet(); }}>
          Try Again
        </Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Vehicles', value: stats.total, icon: Car, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Active', value: stats.active, icon: ToggleRight, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Available', value: stats.available, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Verified', value: stats.verified, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Pending', value: stats.pending, icon: AlertCircle, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="absolute inset-0 bg-grid-white/5 opacity-20"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Fleet Management</h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">Manage all your vehicles across services</p>
            </div>
            <Link href="/vendor/fleet/add">
              <Button className="bg-white hover:bg-emerald-50 text-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className={cn('absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br', stat.gradient)}></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className={cn('text-2xl sm:text-3xl font-bold mt-1', stat.text)}>{stat.value}</p>
                  </div>
                  <div className={cn('p-2 rounded-lg', stat.bg)}>
                    <Icon className={cn('w-4 h-4', stat.text)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>

            {/* Service Filter */}
            {approvedServices.length > 1 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="all">All Services</option>
                  {approvedServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          {filteredFleet.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredFleet.length}</span> of <span className="font-semibold text-gray-900">{fleet.length}</span> vehicles
            </div>
          )}
        </div>

        {/* Fleet List */}
        {filteredFleet.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
              <Car className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {fleet.length === 0 ? 'No vehicles yet' : 'No matching vehicles'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {fleet.length === 0
                ? 'Add your first vehicle to start accepting bookings and grow your business'
                : 'Try adjusting your filters to see more results'}
            </p>
            {fleet.length === 0 && (
              <Link href="/vendor/fleet/add">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Vehicle
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFleet.map((vehicle) => {
              const { service, vehicleCategory, fleetLocations } = normalizeVehicle(vehicle);
              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    'group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
                    !vehicle.isActive && 'opacity-75'
                  )}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {getVehicleImage(vehicle) && !getVehicleImage(vehicle)?.startsWith('file://') ? (
                      <img
                        src={getVehicleImage(vehicle)!}
                        alt={getVehicleName(vehicle)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Car className="w-20 h-20 text-gray-300" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {vehicle.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-green-700 rounded-full text-xs font-semibold shadow-sm">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-emerald-700 rounded-full text-xs font-semibold shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      {!vehicle.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-sm">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      ) : vehicle.isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-sm">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-sm">
                          Booked
                        </span>
                      )}
                    </div>

                    {/* Service tag bottom-left */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-gray-700 rounded-full text-xs font-medium shadow-sm">
                        {getServiceIcon(service?.slug)}
                        {service?.name}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 truncate text-sm">
                          {getVehicleName(vehicle)}
                        </h3>
                        {vehicleCategory?.seatingCapacity && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {vehicleCategory.seatingCapacity} Seater
                          </p>
                        )}
                      </div>
                      {vehicle.color && (
                        <span className="shrink-0 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                          {vehicle.color}
                        </span>
                      )}
                    </div>

                    {/* Registration & Year */}
                    {(vehicle.registrationNumber || vehicle.yearOfManufacture) && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {vehicle.registrationNumber && (
                          <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Reg No.</p>
                            <p className="text-xs font-semibold text-gray-900 truncate">{vehicle.registrationNumber}</p>
                          </div>
                        )}
                        {vehicle.yearOfManufacture && (
                          <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <p className="text-[10px] text-gray-500 uppercase font-medium">Year</p>
                            <p className="text-xs font-semibold text-gray-900">{vehicle.yearOfManufacture}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing */}
                    {getDailyRate(vehicle) > 0 && (
                      <div className="flex items-baseline gap-1 mb-3">
                        <IndianRupee className="w-4 h-4 text-green-600 self-center" />
                        <span className="text-xl font-bold text-gray-900">{getDailyRate(vehicle).toLocaleString('en-IN')}</span>
                        <span className="text-xs text-gray-500 font-medium">/day</span>
                      </div>
                    )}

                    {/* Locations */}
                    {fleetLocations && fleetLocations.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {fleetLocations.slice(0, 2).map((fl: any) => fl.locations?.name || fl.location?.name).join(', ')}
                          {fleetLocations.length > 2 && ` +${fleetLocations.length - 2}`}
                        </span>
                      </div>
                    )}

                    {/* Next booking */}
                    {(() => {
                      const blockedDates = (vehicle as any).vendor_fleet_blocked_dates;
                      const nextBlock = blockedDates?.[0];
                      if (nextBlock) {
                        const startDate = new Date(nextBlock.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        return (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg mb-3 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            Next {nextBlock.reason === 'BOOKING' ? 'booking' : 'block'}: {startDate}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleActive(vehicle)}
                        disabled={actionLoading === vehicle.id}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                          vehicle.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200',
                          actionLoading === vehicle.id && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {actionLoading === vehicle.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : vehicle.isActive ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                      <Link
                        href={`/vendor/fleet/${vehicle.id}`}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/vendor/fleet/${vehicle.id}/edit`}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(vehicle.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Vehicle?</h2>
              <p className="text-gray-600 mb-6 text-center text-sm">
                Are you sure you want to remove this vehicle from your fleet? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  );
}
