'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Bus,
  Calendar,
  MapPin,
  Clock,
  Phone,
  User,
  Navigation,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Loader2,
  Wrench,
  Crown,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategoryName: string;
  customerName: string;
  customerPhone: string;
  pickupCity: string;
  dropCity?: string;
  pickupAddress?: string;
  pickupDate: string;
  pickupTime: string;
  status: string;
  grandTotal: number;
  tripStartOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  driverBatta?: number;
  serviceType?: 'car' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury';
  passengers?: number;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  totalEarnings: number;
  carCount?: number;
  busCount?: number;
  luxuryCount?: number;
  equipmentCount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  DRIVER_ASSIGNED: { label: 'Assigned', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: AlertCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Ready', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Bus },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
};

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [serviceType, setServiceType] = useState<'car' | 'bus' | 'equipment' | 'luxury' | 'all'>('all');

  useEffect(() => {
    fetchBookings();
  }, [filter, serviceType]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/driver/bookings?filter=${filter}&serviceType=${serviceType}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600">Manage your assigned bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Service Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setServiceType('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
            serviceType === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          All Services
          {stats.total > 0 && (
            <span className="text-xs">({stats.total})</span>
          )}
        </button>
        <button
          onClick={() => setServiceType('car')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
            serviceType === 'car'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Car className="w-4 h-4" />
          Car Rental
          {(stats.carCount || 0) > 0 && (
            <span className="text-xs">({stats.carCount})</span>
          )}
        </button>
        <button
          onClick={() => setServiceType('bus')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
            serviceType === 'bus'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Bus className="w-4 h-4" />
          Bus Rental
          {(stats.busCount || 0) > 0 && (
            <span className="text-xs">({stats.busCount})</span>
          )}
        </button>
        <button
          onClick={() => setServiceType('luxury')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
            serviceType === 'luxury'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Crown className="w-4 h-4" />
          Luxury Car
          {(stats.luxuryCount || 0) > 0 && (
            <span className="text-xs">({stats.luxuryCount})</span>
          )}
        </button>
        <button
          onClick={() => setServiceType('equipment')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
            serviceType === 'equipment'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Equipment
          {(stats.equipmentCount || 0) > 0 && (
            <span className="text-xs">({stats.equipmentCount})</span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border transition ${
            filter === 'active' ? 'bg-amber-50 border-amber-300' : 'bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-xl border transition ${
            filter === 'completed' ? 'bg-green-50 border-green-300' : 'bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition ${
            filter === 'all' ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">All</p>
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No Trips Found</h3>
          <p className="text-sm text-gray-500">
            {filter === 'active'
              ? "You don't have any active trips"
              : filter === 'completed'
              ? "You haven't completed any trips yet"
              : 'No trips assigned to you'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.DRIVER_ASSIGNED;
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={booking.id}
                href={`/driver/bookings/${booking.bookingNumber}`}
                className="block bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Status Bar */}
                <div className={`px-4 py-2 ${statusConfig.bgColor} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {booking.serviceType === 'bus' ? (
                      <Bus className={`w-4 h-4 ${statusConfig.color}`} />
                    ) : booking.serviceType === 'equipment' ? (
                      <Wrench className={`w-4 h-4 ${statusConfig.color}`} />
                    ) : booking.serviceType === 'luxury' ? (
                      <Crown className={`w-4 h-4 ${statusConfig.color}`} />
                    ) : (
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    )}
                    <span className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {booking.serviceType && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.serviceType === 'bus'
                          ? 'bg-orange-200 text-orange-700'
                          : booking.serviceType === 'luxury'
                          ? 'bg-purple-200 text-purple-700'
                          : booking.serviceType === 'equipment'
                          ? 'bg-amber-200 text-amber-700'
                          : 'bg-emerald-200 text-emerald-700'
                      }`}>
                        {booking.serviceType === 'bus' ? 'Bus' : booking.serviceType === 'equipment' ? 'Equipment' : booking.serviceType === 'luxury' ? 'Luxury' : 'Car'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-gray-600">
                    #{booking.bookingNumber}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {booking.serviceType === 'bus' ? (
                        <Bus className="w-5 h-5 text-orange-500" />
                      ) : booking.serviceType === 'equipment' ? (
                        <Wrench className="w-5 h-5 text-amber-500" />
                      ) : booking.serviceType === 'luxury' ? (
                        <Crown className="w-5 h-5 text-purple-500" />
                      ) : (
                        <Car className="w-5 h-5 text-emerald-500" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.carCategoryName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}
                          {booking.passengers && ` • ${booking.passengers} passengers`}
                        </p>
                      </div>
                    </div>
                    {booking.driverBatta && booking.status === 'COMPLETED' && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Your Batta</p>
                        <p className="font-bold text-emerald-600">₹{booking.driverBatta}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Route</p>
                        <p className="font-medium">
                          {booking.dropCity
                            ? `${booking.pickupCity} → ${booking.dropCity}`
                            : booking.pickupCity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Pickup</p>
                        <p className="font-medium">
                          {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          {booking.pickupTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Customer</p>
                        <p className="font-medium">{booking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <a
                          href={`tel:${booking.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-emerald-600"
                        >
                          {booking.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Trip Timestamps */}
                  {(booking.tripStartedAt || booking.tripEndedAt) && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      {booking.tripStartedAt && (
                        <p>Started: {new Date(booking.tripStartedAt).toLocaleString('en-IN')}</p>
                      )}
                      {booking.tripEndedAt && (
                        <p>Ended: {new Date(booking.tripEndedAt).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
