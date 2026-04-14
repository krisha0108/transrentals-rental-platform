'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Fuel,
  Settings2,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  IndianRupee,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FleetVehicle {
  id: string;
  vehicle_models: {
    id: string;
    name: string;
    brand: { id: string; name: string; logo?: string };
    sideImage?: string;
    fuelType?: string;
    transmission?: string;
    seatingCapacity?: number;
  };
  service: { id: string; name: string; slug: string };
  registrationNumber?: string;
  yearOfManufacture?: number;
  color?: string;
  images?: string[];
  isActive: boolean;
  isAvailable: boolean;
  fleetPricing: {
    id: string;
    priceType: string;
    basePrice: number;
    perDayRate?: number;
    kmLimitPerDay?: number;
    extraKmCharge?: number;
    deposit?: number;
  }[];
  fleetLocations: {
    location: { id: string; name: string };
  }[];
  createdAt: string;
}

export default function VendorSelfDriveFleetPage() {
  const [loading, setLoading] = useState(true);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFleet();
  }, []);

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/vendor/fleet');
      const data = await res.json();
      if (res.ok && data.success) {
        // Filter for self-drive service only
        const selfDriveFleet = (data.fleet || []).filter((v: FleetVehicle) => {
          const svc = (v as any).services || v.service;
          const slug = svc?.slug?.toLowerCase() || '';
          const name = svc?.name?.toLowerCase() || '';
          return slug === 'self-drive-car-rental' ||
            slug === 'self-drive-car-rentals' ||
            slug === 'self-drive' ||
            name.includes('self-drive') ||
            name.includes('self drive');
        });
        setFleet(selfDriveFleet);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFleet = fleet.filter((car) => {
    const carName = car.vehicle_models?.name || '';
    const brandName = car.vehicle_models?.brand?.name || '';
    const regNumber = car.registrationNumber || '';

    const matchesSearch =
      carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      regNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && car.isActive && car.isAvailable) ||
      (filterStatus === 'inactive' && !car.isActive);

    return matchesSearch && matchesStatus;
  });

  const toggleCarStatus = async (carId: string, currentStatus: boolean) => {
    setTogglingId(carId);
    try {
      const res = await fetch(`/api/vendor/fleet/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setFleet(fleet.map(v =>
          v.id === carId ? { ...v, isActive: !currentStatus } : v
        ));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setTogglingId(null);
      setShowMenu(null);
    }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    setDeletingId(carId);
    try {
      const res = await fetch(`/api/vendor/fleet/${carId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFleet(fleet.filter(v => v.id !== carId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete car');
    } finally {
      setDeletingId(null);
      setShowMenu(null);
    }
  };

  // Stats
  const totalCars = fleet.length;
  const activeCars = fleet.filter((c) => c.isActive).length;

  const getPricing = (vehicle: FleetVehicle) => {
    const pricing = vehicle.fleetPricing?.[0];
    return {
      dailyRate: pricing?.perDayRate || pricing?.basePrice || 0,
      kmLimit: pricing?.kmLimitPerDay || 200,
      extraKm: pricing?.extraKmCharge || 10,
      deposit: pricing?.deposit || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Self-Drive Fleet</h1>
          <p className="text-gray-600">Manage your self-drive car inventory</p>
        </div>
        <Link href="/vendor/self-drive/fleet/add">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-5 h-5 mr-2" />
            Add New Car
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Car className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCars}</p>
              <p className="text-sm text-gray-500">Total Cars</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCars}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <XCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCars - activeCars}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">—</p>
              <p className="text-sm text-gray-500">Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand or registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet List */}
      {filteredFleet.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
          <p className="text-gray-500 mb-4">Add your first car to start accepting bookings</p>
          <Link href="/vendor/self-drive/fleet/add">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-5 h-5 mr-2" />
              Add Car
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFleet.map((car) => {
            const pricing = getPricing(car);
            const carImage = car.images?.[0] || car.vehicle_models?.sideImage;

            return (
              <div
                key={car.id}
                className={cn(
                  'bg-white rounded-xl shadow-sm border overflow-hidden',
                  car.isActive ? 'border-gray-100' : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Car Image */}
                    <div className="w-full lg:w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {carImage ? (
                        <img
                          src={carImage}
                          alt={car.vehicle_models?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    {/* Car Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {car.vehicle_models?.brand?.name} {car.vehicle_models?.name}
                            </h3>
                            {car.isActive ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {car.yearOfManufacture && `${car.yearOfManufacture} • `}
                            {car.color && `${car.color} • `}
                            {car.registrationNumber}
                          </p>
                          {car.fleetLocations?.length > 0 && (
                            <p className="text-sm text-gray-500">
                              📍 {car.fleetLocations.map(l => l.location.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(showMenu === car.id ? null : car.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          {showMenu === car.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                              <Link
                                href={`/vendor/self-drive/fleet/${car.id}/edit`}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Details
                              </Link>
                              <button
                                onClick={() => toggleCarStatus(car.id, car.isActive)}
                                disabled={togglingId === car.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                {togglingId === car.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : car.isActive ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Mark Inactive
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    Mark Active
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deleteCar(car.id)}
                                disabled={deletingId === car.id}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                {deletingId === car.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {car.vehicle_models?.transmission && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Settings2 className="w-4 h-4" />
                            <span>{car.vehicle_models.transmission}</span>
                          </div>
                        )}
                        {car.vehicle_models?.fuelType && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Fuel className="w-4 h-4" />
                            <span>{car.vehicle_models.fuelType}</span>
                          </div>
                        )}
                        {car.vehicle_models?.seatingCapacity && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{car.vehicle_models.seatingCapacity} Seats</span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-gray-500">Daily Rate</p>
                          <p className="font-semibold text-emerald-600">₹{pricing.dailyRate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">KM Limit/Day</p>
                          <p className="font-semibold text-gray-900">{pricing.kmLimit} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Extra KM</p>
                          <p className="font-semibold text-gray-900">₹{pricing.extraKm}/km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Deposit</p>
                          <p className="font-semibold text-gray-900">₹{pricing.deposit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
