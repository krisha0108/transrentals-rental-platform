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
  Zap,
  ExternalLink,
  Wallet,
} from 'lucide-react';
// BackrCard import kept alongside the commented-out usage below — re-enable when ready to launch.
// import BackrCard from '@/components/backr/BackrCard';

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
  id?: string;
  name?: string;
  bankDetailsComplete?: boolean;
}

/** Morning / afternoon / evening, by the driver's own clock. */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
  // null until the fleet call answers, so the prompt never flashes up for a
  // driver who does have vehicles.
  const [fleetCount, setFleetCount] = useState<number | null>(null);
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [meRes, bookingsRes, fleetRes] = await Promise.all([
        fetch('/api/driver/auth/me'),
        fetch('/api/driver/bookings?filter=active'),
        fetch('/api/driver/fleet'),
      ]);
      const meData = await meRes.json();
      const bookingsData = await bookingsRes.json();

      const fleetData = await fleetRes.json().catch(() => null);
      if (fleetData?.success) {
        setFleetCount((fleetData.vehicles || fleetData.fleet || []).length);
      }

      if (meData.success) {
        setDriverInfo({
          userType: meData.driver?.userType,
          id: meData.driver?.id,
          name: meData.driver?.name,
          bankDetailsComplete: meData.driver?.bankDetailsComplete,
        });
      }
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
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="dv-hero">
        <div className="dv-hero-copy">
          <p className="dv-hero-eyebrow">{greeting()}</p>
          <h1 className="dv-hero-title">{driverInfo.name ? driverInfo.name.split(' ')[0] : 'Welcome back'}</h1>
          <p className="dv-hero-sub">
            {stats.active > 0
              ? `You have ${stats.active} trip${stats.active > 1 ? 's' : ''} on the go right now.`
              : 'No trips on the go right now — you are all clear.'}
          </p>
        </div>
        <Link href="/driver/bookings" className="dv-hero-cta">
          View my trips <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Bank Details Banner — every new driver hits this until they fill it in,
          since payouts have nowhere to go without it. */}
      {driverInfo.bankDetailsComplete === false && (
        <Link href="/driver/profile/edit" className="dv-prompt dv-prompt-amber">
          <span className="dv-prompt-icon"><Wallet className="w-5 h-5" /></span>
          <span className="dv-prompt-text">
            <span className="dv-prompt-title">Add your bank details to get paid</span>
            <span className="dv-prompt-sub">Your trip earnings can&apos;t be paid out until this is set up — takes under a minute</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 opacity-60" />
        </Link>
      )}

      {/* Fleet Banner — a driver with nothing on file cannot be matched to a
          trip, so it sits beside the bank prompt rather than being something
          they have to go looking for. */}
      {fleetCount === 0 && (
        <Link href="/driver/fleet/add" className="dv-prompt dv-prompt-green">
          <span className="dv-prompt-icon"><Car className="w-5 h-5" /></span>
          <span className="dv-prompt-text">
            <span className="dv-prompt-title">Add your fleet</span>
            <span className="dv-prompt-sub">No vehicle on your account yet — add one so you can be given trips</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 opacity-60" />
        </Link>
      )}

      {/* Available Trips Banner — independent drivers only */}
      {driverInfo.userType === 'independent' && (
        <Link href="/driver/available-trips" className="dv-prompt dv-prompt-blue">
          <span className="dv-prompt-icon"><Radio className="w-5 h-5" /></span>
          <span className="dv-prompt-text">
            <span className="dv-prompt-title">Available Trips</span>
            <span className="dv-prompt-sub">
              {availableCount > 0
                ? `${availableCount} trip${availableCount > 1 ? 's' : ''} waiting for acceptance`
                : 'Check for new trips near you'}
            </span>
          </span>
          {availableCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">{availableCount}</span>
          )}
          <ArrowRight className="w-5 h-5 shrink-0 opacity-60" />
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active Trips', value: stats.active, icon: AlertCircle, accent: 'bg-amber-400', wrap: 'bg-amber-100 text-amber-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, accent: 'bg-green-400', wrap: 'bg-green-100 text-green-600' },
          { label: 'Total Trips', value: stats.total, icon: Calendar, accent: 'bg-blue-400', wrap: 'bg-blue-100 text-blue-600' },
          { label: 'Earnings', value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, icon: TrendingUp, accent: 'bg-teal-400', wrap: 'bg-teal-100 text-teal-600' },
        ].map(({ label, value, icon: Icon, accent, wrap }) => (
          <div key={label} className="dv-stat">
            <span className={`dv-stat-accent ${accent}`} />
            <div className="dv-stat-body">
              <span className={`dv-stat-icon ${wrap}`}><Icon className="w-5 h-5" /></span>
              <div className="min-w-0">
                <p className="dv-stat-value truncate">{value}</p>
                <p className="dv-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Trips */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Active Trips</h2>
          <Link
            href="/driver/bookings"
            className="text-green-600 text-sm font-medium flex items-center gap-1 hover:underline"
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
                    ? 'bg-green-600 text-white shadow'
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
              <div className="dv-empty">
                <span className="dv-empty-icon"><Car className="w-7 h-7" /></span>
                <p className="dv-empty-title">No active trips</p>
                <p className="dv-empty-sub">
                  {serviceFilter === 'all'
                    ? 'Nothing is assigned to you right now. New trips show up here the moment they are.'
                    : `No active ${serviceFilter} trips at the moment.`}
                </p>
                {driverInfo.userType === 'independent' ? (
                  <Link href="/driver/available-trips" className="dv-empty-cta">
                    Browse available trips <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link href="/driver/bookings" className="dv-empty-cta">
                    See past trips <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          }

          return (
          <div className="space-y-4 sm:space-y-5">
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
                return { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
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
                <div
                  key={booking.id}
                  className="relative bg-white rounded-2xl border shadow-sm p-5 sm:p-6 transition hover:shadow-md hover:border-green-200 focus-within:ring-2 focus-within:ring-green-400"
                >
                  <Link
                    href={`/driver/bookings/${booking.bookingNumber}`}
                    aria-label={`Open trip ${booking.bookingNumber}`}
                    className="absolute inset-0 z-0 rounded-2xl"
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${serviceColors.bg}`}>
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
                        <h3 className="text-[15px] font-semibold text-gray-900 mt-1">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
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
                      <Clock className="w-4 h-4 text-green-500 mt-0.5" />
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
                      <User className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Customer</p>
                        <p className="font-medium">{booking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <a
                          href={`tel:${booking.customerPhone}`}
                          className="relative z-10 font-medium text-green-600 hover:underline"
                        >
                          {booking.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Trip in progress indicator */}
                  {['IN_PROGRESS', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'PACKING', 'UNPACKING', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'].includes(booking.status) && (
                    <div className={`mt-5 pt-3 border-t -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3 rounded-b-2xl ${
                      booking.status === 'LOADING' ? 'bg-blue-50' :
                      booking.status === 'UNLOADING' ? 'bg-orange-50' :
                      booking.status === 'PACKING' ? 'bg-cyan-50' :
                      booking.status === 'UNPACKING' ? 'bg-teal-50' :
                      booking.status === 'DELIVERED' ? 'bg-blue-50' :
                      booking.status === 'IN_USE' ? 'bg-purple-50' :
                      booking.status === 'PICKUP_SCHEDULED' ? 'bg-orange-50' :
                      'bg-green-50'
                    }`}>
                      <div className={`flex items-center gap-2 ${
                        booking.status === 'LOADING' ? 'text-blue-700' :
                        booking.status === 'UNLOADING' ? 'text-orange-700' :
                        booking.status === 'PACKING' ? 'text-cyan-700' :
                        booking.status === 'UNPACKING' ? 'text-teal-700' :
                        booking.status === 'DELIVERED' ? 'text-blue-700' :
                        booking.status === 'IN_USE' ? 'text-purple-700' :
                        booking.status === 'PICKUP_SCHEDULED' ? 'text-orange-700' :
                        'text-green-700'
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
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      {/* BACKR Rewards — hidden for now, not ready to launch yet */}
      {/* <BackrCard type="driver" /> */}
    </div>
  );
}
