'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Radio,
  IndianRupee,
  Search,
  Zap,
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

interface AvailableBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategoryName: string;
  pickupCity: string;
  dropCity?: string;
  pickupAddress?: string;
  pickupDate: string;
  pickupTime: string;
  estimatedDistance?: number;
  driverBatta?: number;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ACCEPTED: { label: 'Accepted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
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

const TRIP_TYPE_LABELS_MAP: Record<string, string> = {
  LOCAL: 'Local',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
};

export default function DriverBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [serviceType, setServiceType] = useState<'car' | 'bus' | 'equipment' | 'luxury' | 'all'>('all');
  const [tab, setTab] = useState<'my' | 'available'>('my');
  const [availableBookings, setAvailableBookings] = useState<AvailableBooking[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [availSort, setAvailSort] = useState<'soonest' | 'highest'>('soonest');
  const [availTripType, setAvailTripType] = useState('ALL');
  const [availShowAll, setAvailShowAll] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filter, serviceType]);

  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (tab === 'available') {
      fetchAvailable();
      autoRefreshRef.current = setInterval(() => fetchAvailable(), 30000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [tab]);

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

  const fetchAvailable = async () => {
    setAvailableLoading(true);
    try {
      const res = await fetch('/api/driver/available-bookings');
      const data = await res.json();
      if (data.success) setAvailableBookings(data.bookings || []);
    } catch {}
    setAvailableLoading(false);
  };

  const handleAccept = async (booking: AvailableBooking) => {
    setAccepting(booking.id);
    try {
      const res = await fetch('/api/driver/available-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAcceptedId(booking.id);
        fetchBookings();
        setTimeout(() => {
          setAvailableBookings(prev => prev.filter(b => b.id !== booking.id));
          setAcceptedId(null);
          router.push(`/driver/bookings/${booking.bookingNumber}`);
        }, 1000);
      } else {
        fetchAvailable();
      }
    } catch {}
    setAccepting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Trips</h1>
          <p className="text-xs text-gray-500">Your bookings & available trips</p>
        </div>
        <button
          onClick={tab === 'available' ? fetchAvailable : fetchBookings}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab('my')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'my' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" /> My Trips
          </button>
          <button
            onClick={() => setTab('available')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'available' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Radio className="w-4 h-4 text-blue-500" /> Available
            {availableBookings.length > 0 && tab !== 'available' && (
              <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {availableBookings.length > 9 ? '9+' : availableBookings.length}
              </span>
            )}
          </button>
        </div>

      {/* Available Trips Tab Content */}
      {tab === 'available' && (() => {
        const now = new Date();
        const AVAIL_TRIP_TYPES = ['ALL', 'LOCAL', 'OUTSTATION_ONEWAY', 'OUTSTATION_ROUNDTRIP', 'AIRPORT_PICKUP', 'AIRPORT_DROP'];
        const typeCounts = AVAIL_TRIP_TYPES.reduce((acc, t) => {
          acc[t] = t === 'ALL' ? availableBookings.length : availableBookings.filter(b => b.tripType === t).length;
          return acc;
        }, {} as Record<string, number>);

        let filtered = availableBookings.filter(b => {
          if (!availShowAll && new Date(b.pickupDate) < now) return false;
          if (availTripType !== 'ALL' && b.tripType !== availTripType) return false;
          return true;
        });
        filtered = [...filtered].sort((a, b) =>
          availSort === 'soonest'
            ? new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
            : (b.driverBatta || 0) - (a.driverBatta || 0)
        );

        return (
          <div className="space-y-4">
            {/* Sort + Toggle row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setAvailSort('soonest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${availSort === 'soonest' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  <Clock className="w-3 h-3" /> Soonest
                </button>
                <button
                  onClick={() => setAvailSort('highest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${availSort === 'highest' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  <IndianRupee className="w-3 h-3" /> Highest
                </button>
              </div>
              <button
                onClick={() => setAvailShowAll(v => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${availShowAll ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {availShowAll ? 'All Dates' : 'Upcoming'}
              </button>
            </div>

            {/* Trip type filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {AVAIL_TRIP_TYPES.filter(t => t === 'ALL' || typeCounts[t] > 0).map(t => (
                <button
                  key={t}
                  onClick={() => setAvailTripType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition flex items-center gap-1.5 ${
                    availTripType === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : TRIP_TYPE_LABELS_MAP[t] || t}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${availTripType === t ? 'bg-white/20' : 'bg-gray-100'}`}>{typeCounts[t]}</span>
                </button>
              ))}
            </div>

            {availableLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center">
                <Radio className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">No Available Trips</h3>
                <p className="text-sm text-gray-500">
                  {availTripType !== 'ALL' ? 'No trips for this type. Try changing the filter.' : 'No broadcasted trips right now. Check back later.'}
                </p>
                <button onClick={fetchAvailable} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                  Refresh
                </button>
              </div>
            ) : (
              filtered.map(booking => {
                const isAccepting = accepting === booking.id;
                const isAccepted = acceptedId === booking.id;
                const isNewTrip = booking.createdAt ? Date.now() - new Date(booking.createdAt).getTime() < 15 * 60 * 1000 : false;
                const isPast = new Date(booking.pickupDate) < now;
                return (
                  <Link key={booking.id} href={`/driver/bookings/${booking.bookingNumber}`}
                    className={`block bg-white rounded-xl border shadow-sm p-4 transition hover:border-emerald-300 hover:shadow-md ${isAccepted ? 'border-green-400 bg-green-50' : ''} ${isPast ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-mono text-gray-400">#{booking.bookingNumber}</p>
                            {isNewTrip && !isPast && <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full"><Zap className="w-2.5 h-2.5" /> NEW</span>}
                            {isPast && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">PAST</span>}
                          </div>
                          <p className="font-semibold text-gray-900">{booking.carCategoryName}</p>
                          <p className="text-xs text-gray-500">{TRIP_TYPE_LABELS_MAP[booking.tripType] || booking.tripType}</p>
                        </div>
                      </div>
                      {booking.driverBatta != null && booking.driverBatta > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Your Earning</p>
                          <p className="font-bold text-emerald-700 flex items-center gap-0.5 justify-end">
                            <IndianRupee className="w-3.5 h-3.5" />{booking.driverBatta.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="font-medium">{booking.dropCity ? `${booking.pickupCity} → ${booking.dropCity}` : booking.pickupCity}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Pickup</p>
                          <p className="font-medium">
                            {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {booking.pickupTime}
                          </p>
                        </div>
                      </div>
                      {booking.pickupAddress && (
                        <div className="col-span-2 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-gray-700 text-sm">{booking.pickupAddress}</p>
                        </div>
                      )}
                    </div>
                    {isAccepted ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium">
                        <CheckCircle className="w-5 h-5" /> Trip Accepted! Assigning vehicle...
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); if (!isPast) handleAccept(booking); }}
                        disabled={isAccepting || accepting !== null || isPast}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {isAccepting ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</> : isPast ? 'Trip Expired' : 'Accept Trip'}
                      </button>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        );
      })()}

      {/* My Trips */}
      {tab === 'my' && <><div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          placeholder="Search by booking#, city, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
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
          {bookings.filter(booking => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
              booking.bookingNumber?.toLowerCase().includes(q) ||
              booking.pickupCity?.toLowerCase().includes(q) ||
              booking.dropCity?.toLowerCase().includes(q) ||
              booking.customerName?.toLowerCase().includes(q)
            );
          }).map((booking) => {
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
      </>}
    </div>
  );
}
