'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Navigation,
  Plane,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface ChauffeurBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategory: string;
  carCategoryName: string;
  pickupCity: string;
  dropCity?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageId?: string;
  grandTotal: number;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  rating?: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  PENDING_VENDOR: { label: 'Searching Driver', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  BROADCASTED: { label: 'Searching Driver', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  ACCEPTED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-indigo-100 text-indigo-700', icon: User },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRIP_ICONS: Record<string, any> = {
  LOCAL: Navigation,
  OUTSTATION_ONEWAY: MapPin,
  OUTSTATION_ROUNDTRIP: MapPin,
  AIRPORT_PICKUP: Plane,
  AIRPORT_DROP: Plane,
};

export default function CustomerCarRentalBookingsPage() {
  const [bookings, setBookings] = useState<ChauffeurBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/car-rental/bookings');
        const data = await response.json();
        if (data.success && data.bookings) {
          setBookings(data.bookings);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_payment') return b.status === 'PENDING_PAYMENT';
    if (statusFilter === 'upcoming') return ['ACCEPTED', 'DRIVER_ASSIGNED', 'PENDING_VENDOR', 'BROADCASTED'].includes(b.status);
    if (statusFilter === 'active') return b.status === 'IN_PROGRESS';
    if (statusFilter === 'completed') return b.status === 'COMPLETED';
    if (statusFilter === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-emerald-900 text-white py-8">
        <div className="container-custom">
          <h1 className="text-2xl font-bold">My Car Rental Bookings</h1>
          <p className="text-emerald-200">View and manage your car rental bookings</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'pending_payment', label: 'Pending Payment' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === filter.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {statusFilter !== 'all'
                  ? 'Try a different filter'
                  : "You haven't made any car rental bookings yet"}
              </p>
              <Link
                href="/car-rental/delhi"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Car className="w-4 h-4" />
                Book a Car
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
              const StatusIcon = statusConfig.icon;
              const TripIcon = TRIP_ICONS[booking.tripType] || Navigation;

              return (
                <Link
                  key={booking.id}
                  href={`/customer/car-rental-bookings/${booking.bookingNumber}`}
                  className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition"
                >
                  <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-gray-500">
                            #{booking.bookingNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{booking.carCategoryName}</h3>
                        {booking.vehicle_models && (
                          <p className="text-sm text-gray-500">{booking.vehicle_models}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600">
                          ₹{booking.grandTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                          <TripIcon className="w-3 h-3" />
                          {booking.tripType.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Trip Info */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        {booking.dropCity
                          ? `${booking.pickupCity} → ${booking.dropCity}`
                          : booking.pickupCity}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        {booking.pickupTime}
                      </div>
                    </div>

                    {/* Driver Info */}
                    {booking.driverName && booking.status !== 'COMPLETED' && (
                      <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-emerald-700 font-medium mb-1">Your Driver</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{booking.driverName}</p>
                              <p className="text-xs text-gray-500">{booking.vehicleNumber}</p>
                            </div>
                          </div>
                          <a
                            href={`tel:${booking.driverPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Rating for completed */}
                    {booking.status === 'COMPLETED' && booking.rating && (
                      <div className="flex items-center gap-1 text-amber-500 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < booking.rating! ? 'text-amber-500' : 'text-gray-300'}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-500 ml-1">Your rating</span>
                      </div>
                    )}

                    {/* Pay Now for pending payment */}
                    {booking.status === 'PENDING_PAYMENT' && (
                      <Link
                        href={`/pay/${booking.bookingNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 mb-4 text-sm font-medium"
                      >
                        Pay Now
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}

                    {/* View Details */}
                    <div className="flex items-center justify-end text-emerald-600 text-sm font-medium">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </div>
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
