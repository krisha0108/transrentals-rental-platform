'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  CalendarCheck,
  MapPin,
  Calendar,

  Eye,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  Weight,
  Clock,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface TruckBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  vehicleCategory: string;
  vehicleName: string;
  goodsType: string;
  customerName: string;

  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: boolean;
  status: string;
  paymentStatus: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  quoteRequest?: { id: string; requestNumber: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: 'bg-orange-100 text-orange-700', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  LOADING: { label: 'Loading', color: 'bg-orange-100 text-orange-700', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'bg-teal-100 text-teal-700', icon: Truck },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorTransporterBookingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [bookings, setBookings] = useState<TruckBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  const config = TRANSPORTER_CONFIG;

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchBookings();
  }, [sessionStatus, filter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'upcoming' ? 'confirmed' : filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : '';
      const response = await fetch(`/api/vendor/truck-bookings?type=${type}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering is done server-side now
  const filteredBookings = bookings;

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600">Manage your confirmed transport jobs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'].includes(b.status)).length}
          </p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            {bookings.filter((b) => b.status === 'IN_TRANSIT').length}
          </p>
          <p className="text-sm text-gray-500">In Transit</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <p className="text-2xl font-bold text-indigo-600">
            ₹{bookings.reduce((sum, b) => sum + (b.totalAmount - (b.advancePaid ? (b.advanceAmount || 0) : 0)), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pending Balance</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'active', label: 'In Transit' },
          { value: 'completed', label: 'Delivered' },
          { value: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === f.value
                ? 'bg-indigo-100 text-indigo-700'
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
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
            const StatusIcon = statusConfig.icon;
            const isUpcoming = new Date(booking.pickupDate) > new Date();
            const balanceAmount = booking.totalAmount - (booking.advancePaid ? (booking.advanceAmount || 0) : 0);

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      #{booking.bookingNumber}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.vehicleName || getCategoryName(booking.vehicleCategory) || booking.vehicleCategory}</h3>
                        <p className="text-sm text-gray-500">{booking.goodsType || 'Transport'}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {booking.pickupCity}
                          <ArrowRight className="w-3 h-3" />
                          {booking.dropCity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{booking.totalAmount?.toLocaleString()}
                      </p>
                      {balanceAmount > 0 && (
                        <p className="text-sm text-indigo-600">
                          Balance: ₹{balanceAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {booking.pickupTime && ` at ${booking.pickupTime}`}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                    </div>
                    {booking.vehicleNumber && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</span>
                        <p className="font-medium text-gray-900">{booking.vehicleNumber}</p>
                        {booking.driverName && (
                          <p className="text-sm text-gray-600">
                            Driver: {booking.driverName} {booking.driverPhone && `(${booking.driverPhone})`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/transporter/bookings/${booking.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {!booking.vehicleNumber && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                      <Link
                        href={`/vendor/transporter/bookings/${booking.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                      >
                        <Truck className="w-4 h-4" />
                        Assign Driver & Vehicle
                      </Link>
                    )}
                    {booking.status === 'VEHICLE_ASSIGNED' && isUpcoming && (
                      <Link
                        href={`/vendor/transporter/bookings/${booking.id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                      >
                        <Navigation className="w-4 h-4" />
                        Start Transit
                      </Link>
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
