'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Phone,
  User,
  Navigation,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Radio,
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
  serviceType?: 'car' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury';
  goodsType?: string;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

interface DriverInfo {
  userType?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  // Car/Bus/Truck statuses
  DRIVER_ASSIGNED: { label: 'Assigned', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  VEHICLE_ASSIGNED: { label: 'Vehicle Ready', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  LOADING: { label: 'Loading', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  UNLOADING: { label: 'Unloading', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  // Packers & Movers statuses
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PACKING: { label: 'Packing', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  UNPACKING: { label: 'Unpacking', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  // Equipment Rental statuses
  CONFIRMED: { label: 'Confirmed', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  DELIVERED: { label: 'Delivered', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_USE: { label: 'In Use', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  RETURNED: { label: 'Returned', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
  FULL_LOAD: 'Full Load',
  PART_LOAD: 'Part Load',
  CONTAINER: 'Container',
  ODC: 'ODC (Over Dimensional Cargo)',
};

const SERVICE_ICONS: Record<string, any> = {
  car: Car,
  bus: Bus,
  truck: Truck,
  packers: Package,
  equipment: Wrench,
  luxury: Crown,
  b2b: Car,
};

const SERVICE_FILTERS = [
  { value: 'all', label: 'All', icon: Car },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'luxury', label: 'Luxury', icon: Crown },
  { value: 'packers', label: 'Packers', icon: Package },
  { value: 'equipment', label: 'Equipment', icon: Wrench },
  { value: 'b2b', label: 'B2B', icon: Building2 },
];

export default function DriverDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [driverInfo, setDriverInfo] = useState<DriverInfo>({});
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [meRes, bookingsRes] = await Promise.all([
        fetch('/api/driver/auth/me'),
        fetch('/api/driver/bookings?filter=active'),
      ]);
      const meData = await meRes.json();
      const bookingsData = await bookingsRes.json();

      if (meData.success) setDriverInfo({ userType: meData.driver?.userType });
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
        setStats(bookingsData.stats);
      }

      // If independent driver, fetch available count
      if (meData.driver?.userType === 'independent') {
        const avail = await fetch('/api/driver/available-bookings');
        const availData = await avail.json();
        if (availData.success) setAvailableCount(availData.bookings?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome Back!</h1>
        <p className="text-emerald-100 mt-1">Here's your trip summary for today</p>
      </div>

      {/* Available Trips Banner — independent drivers only */}
      {driverInfo.userType === 'independent' && (
        <Link
          href="/driver/available-trips"
          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Available Trips</p>
              <p className="text-sm text-blue-600">
                {availableCount > 0 ? `${availableCount} trip${availableCount > 1 ? 's' : ''} waiting for acceptance` : 'Check for new trips near you'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {availableCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{availableCount}</span>
            )}
            <ArrowRight className="w-5 h-5 text-blue-500" />
          </div>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Trips</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Active Trips</h2>
          <Link
            href="/driver/bookings"
            className="text-emerald-600 text-sm font-medium flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Service Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {SERVICE_FILTERS.map((tab) => {
            const TabIcon = tab.icon;
            const count = tab.value === 'all'
              ? bookings.length
              : bookings.filter(b => (b.serviceType || 'car') === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setServiceFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  serviceFilter === tab.value
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    serviceFilter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {(() => {
          const filtered = serviceFilter === 'all'
            ? bookings
            : bookings.filter(b => (b.serviceType || 'car') === serviceFilter);

          if (filtered.length === 0) {
            return (
              <div className="bg-white rounded-xl border p-8 text-center">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-1">No Active Trips</h3>
                <p className="text-sm text-gray-500">
                  {serviceFilter === 'all' ? "You don't have any assigned trips right now" : `No active ${serviceFilter} trips`}
                </p>
              </div>
            );
          }

          return (
          <div className="space-y-4">
            {filtered.slice(0, 5).map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.DRIVER_ASSIGNED;
              const ServiceIcon = SERVICE_ICONS[booking.serviceType || 'car'] || Car;
              const isTruck = booking.serviceType === 'truck';
              const isBus = booking.serviceType === 'bus';
              const isPackers = booking.serviceType === 'packers';
              const isEquipment = booking.serviceType === 'equipment';
              const isLuxury = booking.serviceType === 'luxury';
              const isB2B = booking.serviceType === 'b2b';

              // Color config based on service type
              const getServiceColors = () => {
                if (isB2B) return { bg: 'bg-teal-100', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' };
                if (isTruck) return { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' };
                if (isBus) return { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' };
                if (isPackers) return { bg: 'bg-cyan-100', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' };
                if (isEquipment) return { bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
                if (isLuxury) return { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' };
                return { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
              };
              const serviceColors = getServiceColors();

              const getServiceLabel = () => {
                if (isB2B) return 'B2B';
                if (isTruck) return 'Truck';
                if (isBus) return 'Bus';
                if (isPackers) return 'Packers';
                if (isEquipment) return 'Equipment';
                if (isLuxury) return 'Luxury';
                return 'Car';
              };

              return (
                <Link
                  key={booking.id}
                  href={`/driver/bookings/${booking.bookingNumber}`}
                  className="block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${serviceColors.bg}`}>
                        <ServiceIcon className={`w-5 h-5 ${serviceColors.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">
                            #{booking.bookingNumber}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${serviceColors.badge}`}>
                            {getServiceLabel()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-1">
                          {booking.carCategoryName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {isTruck && booking.goodsType ? booking.goodsType :
                           isPackers ? 'Packers & Movers' :
                           isEquipment ? 'Equipment Rental' :
                           isLuxury ? 'Luxury Car Rental' :
                           (TRIP_TYPE_LABELS[booking.tripType] || booking.tripType)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
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

                  {/* Trip in progress indicator */}
                  {['IN_PROGRESS', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'PACKING', 'UNPACKING', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'].includes(booking.status) && (
                    <div className={`mt-4 pt-3 border-t -mx-4 -mb-4 px-4 py-3 rounded-b-xl ${
                      booking.status === 'LOADING' ? 'bg-blue-50' :
                      booking.status === 'UNLOADING' ? 'bg-orange-50' :
                      booking.status === 'PACKING' ? 'bg-cyan-50' :
                      booking.status === 'UNPACKING' ? 'bg-teal-50' :
                      booking.status === 'DELIVERED' ? 'bg-blue-50' :
                      booking.status === 'IN_USE' ? 'bg-purple-50' :
                      booking.status === 'PICKUP_SCHEDULED' ? 'bg-orange-50' :
                      'bg-emerald-50'
                    }`}>
                      <div className={`flex items-center gap-2 ${
                        booking.status === 'LOADING' ? 'text-blue-700' :
                        booking.status === 'UNLOADING' ? 'text-orange-700' :
                        booking.status === 'PACKING' ? 'text-cyan-700' :
                        booking.status === 'UNPACKING' ? 'text-teal-700' :
                        booking.status === 'DELIVERED' ? 'text-blue-700' :
                        booking.status === 'IN_USE' ? 'text-purple-700' :
                        booking.status === 'PICKUP_SCHEDULED' ? 'text-orange-700' :
                        'text-emerald-700'
                      }`}>
                        <Navigation className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">
                          {booking.status === 'LOADING' ? 'Loading in progress' :
                           booking.status === 'UNLOADING' ? 'Unloading in progress' :
                           booking.status === 'IN_TRANSIT' ? 'In transit' :
                           booking.status === 'PACKING' ? 'Packing in progress' :
                           booking.status === 'UNPACKING' ? 'Unpacking in progress' :
                           booking.status === 'DELIVERED' ? 'Equipment delivered' :
                           booking.status === 'IN_USE' ? 'Equipment in use' :
                           booking.status === 'PICKUP_SCHEDULED' ? 'Pickup scheduled' :
                           'Trip in progress'}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          );
        })()}
      </div>
    </div>
  );
}
