'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Timer,
  AlertCircle,
  Phone,
  MessageCircle,
  IndianRupee,
  Star,
  RefreshCw,
  Home,
  User,
  Loader2,
  Fuel,
  Settings2,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CustomerHeader from '@/components/customer/CustomerHeader';

// Car booking status types
type CarBookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_VENDOR'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

interface CarBooking {
  id: string;
  bookingNumber: string;
  vehicleName: string;
  vehicleType?: string;
  vehicle_category?: string;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  location?: string;
  locationSlug?: string;
  pickupAddress?: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  grandTotal: number;
  securityDeposit: number;
  kmLimitPerDay?: number;
  extraKmRate?: number;
  status: CarBookingStatus;
  paymentStatus: string;
  vendor?: { name: string; phone: string; rating: number };
  rating?: number;
  review?: string;
  cancellationReason?: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

export default function CustomerCarBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<CarBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState<{ name: string; phone: string } | null>(null);

  const fetchBookings = async (phone: string, status?: string) => {
    try {
      const statusParam = status && status !== 'all' ? `&status=${status}` : '';
      const response = await fetch(`/api/self-drive-bookings?phone=${encodeURIComponent(phone)}${statusParam}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch car bookings:', error);
    }
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const customerData = localStorage.getItem('customer');

    if (!token || !customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
      fetchBookings(parsed.phone, statusFilter).finally(() => setIsLoading(false));
    } catch (e) {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (customer?.phone) {
      fetchBookings(customer.phone, statusFilter);
    }
  }, [statusFilter, customer?.phone]);

  const handleRefresh = async () => {
    if (!customer?.phone) return;
    setIsRefreshing(true);
    await fetchBookings(customer.phone, statusFilter);
    setIsRefreshing(false);
  };

  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter === 'active') {
      if (!['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
        return false;
      }
    } else if (statusFilter === 'completed') {
      if (booking.status !== 'COMPLETED') return false;
    } else if (statusFilter === 'cancelled') {
      if (!['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(booking.status)) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const locationText = booking.pickupAddress || booking.location || '';
      return (
        booking.bookingNumber.toLowerCase().includes(query) ||
        booking.vehicleName.toLowerCase().includes(query) ||
        locationText.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusConfig = (status: CarBookingStatus) => {
    const configs: Record<CarBookingStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
      PENDING_PAYMENT: {
        label: 'Payment Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      PENDING_VENDOR: {
        label: 'Awaiting Confirmation',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Timer className="w-4 h-4" />,
      },
      BROADCASTED: {
        label: 'Finding Vendor',
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        icon: <RefreshCw className="w-4 h-4" />,
      },
      ACCEPTED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      IN_PROGRESS: {
        label: 'Ongoing',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: <Car className="w-4 h-4" />,
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <XCircle className="w-4 h-4" />,
      },
      EXPIRED: {
        label: 'Expired',
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        icon: <Timer className="w-4 h-4" />,
      },
      REFUNDED: {
        label: 'Refunded',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <IndianRupee className="w-4 h-4" />,
      },
    };
    return configs[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto" />
          <p className="text-indigo-200 mt-4">Loading your car bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/customer/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">My Car Rentals</h1>
                  <p className="text-indigo-300 text-xs">{filteredBookings.length} bookings</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <RefreshCw className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
              </button>
              <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition">
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-6xl py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking number, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition',
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You haven't made any car rentals yet"}
            </p>
            <Link href="/self-drive-car-rentals">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Car className="w-5 h-5 mr-2" />
                Rent a Car
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const isActive = ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'IN_PROGRESS'].includes(
                booking.status
              );

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md',
                    isActive ? 'border-indigo-200' : 'border-gray-100'
                  )}
                >
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Vehicle Image */}
                      <div className="relative w-full md:w-48 h-32 md:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                          <Car className="w-12 h-12 text-indigo-400" />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {booking.vehicleType || booking.vehicle_category || 'Car'}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900">{booking.vehicleName}</h3>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                  statusConfig.bg,
                                  statusConfig.text
                                )}
                              >
                                {statusConfig.icon}
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">#{booking.bookingNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">₹{booking.grandTotal.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {/* Car Specs */}
                        <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
                          {booking.transmission && (
                            <span className="flex items-center gap-1">
                              <Settings2 className="w-3 h-3" />
                              {booking.transmission}
                            </span>
                          )}
                          {booking.fuelType && (
                            <span className="flex items-center gap-1">
                              <Fuel className="w-3 h-3" />
                              {booking.fuelType}
                            </span>
                          )}
                          {booking.seats && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {booking.seats} Seats
                            </span>
                          )}
                          {booking.kmLimitPerDay && (
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {booking.kmLimitPerDay} km/day
                            </span>
                          )}
                        </div>

                        {/* Trip Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <span className="truncate">{booking.pickupAddress || booking.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>
                              {formatDate(booking.pickupDate)} - {formatDate(booking.dropDate)}
                            </span>
                          </div>
                        </div>

                        {/* Vendor Info (if assigned) */}
                        {booking.vendor && (
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{booking.vendor.name}</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs text-gray-500">{booking.vendor.rating}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${booking.vendor.phone}`}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                              <a
                                href={`https://wa.me/${booking.vendor.phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Status Messages */}
                        {booking.status === 'BROADCASTED' && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700">
                            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                            Looking for available vendors in {booking.location || 'your area'}...
                          </div>
                        )}
                        {booking.status === 'PENDING_VENDOR' && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <Timer className="w-4 h-4 inline mr-2" />
                            Waiting for vendor confirmation. Usually takes 2-4 hours.
                          </div>
                        )}

                        {/* Completed - Review */}
                        {booking.status === 'COMPLETED' && booking.review && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'w-4 h-4',
                                    i < (booking.rating || 0)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300'
                                  )}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-700">{booking.review}</p>
                          </div>
                        )}

                        {/* Cancelled Reason */}
                        {booking.status === 'CANCELLED' && booking.cancellationReason && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                            <XCircle className="w-4 h-4 inline mr-2" />
                            Cancelled: {booking.cancellationReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-gray-100 bg-gray-50 px-4 md:px-6 py-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Booked on {formatDate(booking.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === 'COMPLETED' && !booking.review && (
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-200">
                          <Star className="w-4 h-4 mr-1" />
                          Rate
                        </Button>
                      )}
                      {isActive && booking.status !== 'PENDING_PAYMENT' && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                          Cancel
                        </Button>
                      )}
                      <Link href={`/customer/car-bookings/${booking.id}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/self-drive-car-rentals"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-6 flex items-center justify-between hover:opacity-90 transition"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Rent Another Car</h3>
              <p className="text-indigo-200 text-sm">Browse self-drive cars</p>
            </div>
            <Car className="w-12 h-12 opacity-50" />
          </Link>
          <Link
            href="/customer/dashboard"
            className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-300 transition"
          >
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">All Bookings</h3>
              <p className="text-gray-500 text-sm">View all your travel bookings</p>
            </div>
            <Calendar className="w-12 h-12 text-gray-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
