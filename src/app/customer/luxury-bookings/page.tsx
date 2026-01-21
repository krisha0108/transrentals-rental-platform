'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Plane,
  ChevronRight,
  RefreshCw,
  Inbox,
  DollarSign,
} from 'lucide-react';

interface LuxuryBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  vehiclePreference: string | null;
  assignedVehicle: string | null;
  pickupCity: string;
  dropCity: string | null;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number | null;
  advanceAmount: number | null;
  status: string;
  paymentStatus: string | null;
  chauffeurName: string | null;
  chauffeurPhone: string | null;
  rating: number | null;
  vendors: { name: string; phone: string; rating: number } | null;
  pendingBidsCount: number;
  broadcastExpiresAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_VENDOR: { label: 'Finding Driver', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  BROADCASTED: { label: 'Awaiting Quotes', color: 'bg-blue-100 text-blue-700', icon: Inbox },
  PENDING_PAYMENT: { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CHAUFFEUR_ASSIGNED: { label: 'Chauffeur Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Star },
  EN_ROUTE_PICKUP: { label: 'En Route', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  ARRIVED_PICKUP: { label: 'Arrived', color: 'bg-purple-100 text-purple-700', icon: MapPin },
  TRIP_STARTED: { label: 'Trip in Progress', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRIP_TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  LOCAL: { label: 'Local', icon: Navigation },
  'one-way': { label: 'One Way', icon: MapPin },
  'round-trip': { label: 'Round Trip', icon: MapPin },
  OUTSTATION_ONEWAY: { label: 'Outstation', icon: MapPin },
  OUTSTATION_ROUNDTRIP: { label: 'Outstation', icon: MapPin },
  AIRPORT_PICKUP: { label: 'Airport Pickup', icon: Plane },
  AIRPORT_DROP: { label: 'Airport Drop', icon: Plane },
};

export default function CustomerLuxuryBookingsPage() {
  const [bookings, setBookings] = useState<LuxuryBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // For demo, use phone/email from localStorage or session
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get customer identifier - in production, use auth session
      const phone = localStorage.getItem('customerPhone') || '';
      const email = localStorage.getItem('customerEmail') || '';

      if (!phone && !email) {
        // No customer info, show empty state
        setBookings([]);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (phone) params.set('phone', phone);
      else if (email) params.set('email', email);

      const res = await fetch(`/api/luxury-bookings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['PENDING_VENDOR', 'BROADCASTED', 'PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'CHAUFFEUR_ASSIGNED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP', 'TRIP_STARTED'].includes(b.status);
    }
    if (filter === 'completed') {
      return b.status === 'COMPLETED';
    }
    if (filter === 'cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your luxury bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-8 h-8 text-amber-400" />
                <h1 className="text-2xl font-bold">My Luxury Bookings</h1>
              </div>
              <p className="text-amber-200">Your premium chauffeur-driven experiences</p>
            </div>
            <button
              onClick={fetchBookings}
              className="p-2 text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Bookings' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === f.value
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {filter !== 'all'
                  ? 'No bookings match this filter'
                  : 'Book a luxury car for your next special occasion'}
              </p>
              <Link
                href="/luxury-car-rental"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-600"
              >
                <Car className="w-4 h-4" />
                Book Now
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
              const tripConfig = TRIP_TYPE_CONFIG[booking.tripType] || TRIP_TYPE_CONFIG.LOCAL;
              const StatusIcon = statusConfig.icon;
              const TripIcon = tripConfig.icon;

              return (
                <Link
                  key={booking.id}
                  href={`/customer/luxury-bookings/${booking.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-amber-50 overflow-hidden hover:shadow-md transition"
                >
                  {/* Premium Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-amber-900 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-sm text-amber-200">
                        #{booking.bookingNumber}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Car & Price */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Car className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {booking.assignedVehicle || booking.vehiclePreference || booking.vehicle_category}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <TripIcon className="w-3 h-3" />
                            {tripConfig.label}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {booking.totalAmount ? (
                          <p className="text-lg font-bold text-amber-600">
                            ₹{booking.totalAmount.toLocaleString()}
                          </p>
                        ) : booking.pendingBidsCount > 0 ? (
                          <p className="text-sm font-medium text-blue-600">
                            {booking.pendingBidsCount} quote{booking.pendingBidsCount > 1 ? 's' : ''} received
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Awaiting quotes</p>
                        )}
                        {booking.rating && (
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium">{booking.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {booking.dropCity
                          ? `${booking.pickupCity} → ${booking.dropCity}`
                          : booking.pickupCity}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {booking.pickupTime}
                      </div>
                    </div>

                    {/* Quotes Badge for BROADCASTED */}
                    {booking.status === 'BROADCASTED' && booking.pendingBidsCount > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Inbox className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            View {booking.pendingBidsCount} quote{booking.pendingBidsCount > 1 ? 's' : ''} from vendors
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-blue-400" />
                      </div>
                    )}

                    {/* Driver Info */}
                    {booking.chauffeurName && !['COMPLETED', 'CANCELLED'].includes(booking.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.chauffeurName}</p>
                            {booking.assignedVehicle && (
                              <p className="text-xs text-gray-500">{booking.assignedVehicle}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    {/* Vendor Info */}
                    {booking.vendor && !booking.chauffeurName && !['COMPLETED', 'CANCELLED', 'BROADCASTED'].includes(booking.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.vendor.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {booking.vendor.rating}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
