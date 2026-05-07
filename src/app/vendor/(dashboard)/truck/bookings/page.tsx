'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,

  Eye,
  Navigation,
  IndianRupee,
  RefreshCw,
  TruckIcon,
  Loader2,
  Key,
} from 'lucide-react';

interface TruckBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  vehicleCategory: string;
  vehicleName?: string;
  goodsType: string;
  customerName: string;

  pickupCity: string;
  pickupAddress?: string;
  dropCity: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  status: string;
  paymentStatus?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  createdAt: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
  };
}

interface Stats {
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  LOADING: { label: 'Loading', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'bg-pink-100 text-pink-700', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRUCK_TYPES: Record<string, string> = {
  'tata-ace': 'Tata Ace / Mini Truck',
  'pickup': 'Pickup Truck',
  'canter-14ft': '14 Feet Truck (Canter)',
  'canter-17ft': '17 Feet Truck (Canter)',
  'canter-19ft': '19 Feet Truck',
  'canter-22ft': '22 Feet Truck',
  'container': '32 Feet Container',
  'trailer': 'Trailer / Multi-Axle',
  'refrigerated': 'Refrigerated Truck',
  'tanker': 'Tanker Truck',
  'tipper': 'Tipper Truck',
};

export default function VendorTruckBookingsPage() {
  const [bookings, setBookings] = useState<TruckBooking[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, confirmed: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map filter to API type parameter
      let type = '';
      if (filter === 'upcoming') type = 'confirmed';
      else if (filter === 'active') type = 'active';
      else if (filter === 'completed') type = 'completed';
      else if (filter === 'cancelled') type = 'cancelled';

      const [bookingsRes, statsRes] = await Promise.all([
        fetch(`/api/vendor/truck-bookings?type=${type}`),
        fetch('/api/vendor/truck-bookings', { method: 'POST' }),
      ]);

      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.bookings || []);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings;

  const getTruckTypeName = (id: string) => TRUCK_TYPES[id] || id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Truck Bookings</h1>
            <p className="text-gray-600">Manage your truck rental bookings</p>
          </div>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">
            {stats.pending + stats.confirmed}
          </p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            {stats.active}
          </p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {stats.completed}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">
            ₹{stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'active', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === f.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-500">
              {filter !== 'all' ? 'No bookings match this filter' : 'Accepted quotes will appear here'}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
            const StatusIcon = statusConfig.icon;
            const isUpcoming = new Date(booking.pickupDate) > new Date();
            const balanceAmount = booking.totalAmount - (booking.advancePaid || 0);

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      #{booking.bookingNumber}
                    </span>
                    {booking.quoteRequest?.requestNumber && (
                      <span className="text-xs text-gray-500">
                        Quote: {booking.quoteRequest.requestNumber}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.vehicleName || getTruckTypeName(booking.vehicleCategory) || booking.vehicleCategory}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Package className="w-3 h-3" />
                          <span>{booking.goodsType}</span>
                        </div>
                        {booking.serviceType && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {booking.serviceType.replace('-', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{booking.totalAmount.toLocaleString()}
                      </p>
                      {balanceAmount > 0 && (
                        <p className="text-sm text-blue-600">
                          Balance: ₹{balanceAmount.toLocaleString()}
                        </p>
                      )}
                      {booking.advancePaid && (
                        <p className="text-xs text-green-600 mt-1">
                          Advance: ₹{booking.advancePaid.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>
                          <span className="font-medium">{booking.pickupCity}</span>
                          <span className="text-gray-400"> → </span>
                          <span className="font-medium">{booking.dropCity}</span>
                        </div>
                        {(booking.pickupAddress || booking.dropAddress) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.pickupAddress && <span>{booking.pickupAddress}</span>}
                            {booking.pickupAddress && booking.dropAddress && <span> → </span>}
                            {booking.dropAddress && <span>{booking.dropAddress}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {booking.pickupTime}
                    </div>
                  </div>

                  {/* Customer & Vehicle Info */}
                  <div className="grid md:grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                    </div>
                    {booking.vehicleNumber && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Vehicle Assigned</span>
                        <p className="font-medium text-gray-900">{booking.vehicleName || 'Vehicle'}</p>
                        <p className="text-sm text-gray-600">{booking.vehicleNumber}</p>
                        {booking.driverName && (
                          <p className="text-sm text-gray-600">
                            Driver: {booking.driverName} ({booking.driverPhone})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* OTP Information */}
                  {(booking.loadingOtp || booking.deliveryOtp) && (
                    <div className="grid md:grid-cols-2 gap-4 bg-yellow-50 p-3 rounded-lg mb-4">
                      {booking.loadingOtp && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            Loading OTP
                          </span>
                          <p className="font-mono text-lg font-bold text-blue-600">{booking.loadingOtp}</p>
                        </div>
                      )}
                      {booking.deliveryOtp && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            Delivery OTP
                          </span>
                          <p className="font-mono text-lg font-bold text-green-600">{booking.deliveryOtp}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === 'DROPPED' && (
                    <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2 mb-2">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Booking Dropped</span>
                        {(booking as any).dropReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {(booking as any).dropReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/truck/bookings/${booking.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {!booking.vehicleNumber && isUpcoming && booking.status === 'CONFIRMED' && (
                      <Link
                        href={`/vendor/truck/bookings/${booking.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Truck className="w-4 h-4" />
                        Assign Vehicle
                      </Link>
                    )}
                    {booking.status === 'VEHICLE_ASSIGNED' && isUpcoming && (
                      <Link
                        href={`/vendor/truck/bookings/${booking.id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                      >
                        <Navigation className="w-4 h-4" />
                        Start Loading
                      </Link>
                    )}
                    {['LOADING', 'IN_TRANSIT', 'UNLOADING'].includes(booking.status) && (
                      <div className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg flex items-center gap-1">
                        <Navigation className="w-4 h-4 animate-pulse" />
                        Trip in Progress
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
