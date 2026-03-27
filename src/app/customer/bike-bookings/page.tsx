'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bike,
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
} from 'lucide-react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { cn } from '@/lib/utils';

// Bike booking status types
type BikeBookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_VENDOR'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

interface BikeBooking {
  id: string;
  bookingNumber: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  assignedVehicle?: string;
  location?: { name: string; slug: string };
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  gstAmount: number;
  securityDeposit: number;
  grandTotal: number;
  status: BikeBookingStatus;
  paymentStatus: string;
  vendor?: { id: string; name: string; phone: string; rating: number };
  acceptedAt?: string;
  pickedUpAt?: string;
  returnedAt?: string;
  createdAt: string;
  rating?: number;
  review?: string;
  cancellationReason?: string;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

export default function CustomerBikeBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BikeBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState<{ name: string; phone: string } | null>(null);

  const fetchBookings = async (phone: string, status?: string) => {
    try {
      const statusParam = status && status !== 'all' ? `&status=${status}` : '';
      const response = await fetch(`/api/bike-bookings?phone=${encodeURIComponent(phone)}${statusParam}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bike bookings:', error);
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
      const locationText = booking.locationName || booking.location?.name || '';
      return (
        booking.bookingNumber.toLowerCase().includes(query) ||
        booking.vehicleName.toLowerCase().includes(query) ||
        locationText.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusConfig = (status: BikeBookingStatus | string) => {
    const configs: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
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
        bg: 'bg-purple-100',
        text: 'text-purple-700',
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
        icon: <Bike className="w-4 h-4" />,
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

    // Return matching config or default for unknown status
    return configs[status] || {
      label: status || 'Unknown',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: <AlertCircle className="w-4 h-4" />,
    };
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#09B368] mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <CustomerHeader
        showBackButton
        backHref="/customer/dashboard"
        title="Bike Rentals"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="pt-16 pb-12">
        {/* Hero */}
        <div className="bg-[#09B368] pt-8 pb-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 60%)'}} />
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Bike Rentals
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">My Bike Bookings</h1>
              <p className="text-white/70 text-sm mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/bike-on-rent"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#09B368] rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow-sm"
            >
              <Bike className="h-4 w-4" />
              Rent a Bike
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-5">

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by booking number, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/20 focus:border-[#09B368] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'active', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                      statusFilter === status
                        ? 'bg-[#09B368] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Bookings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Showing {filteredBookings.length} of {bookings.length}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No bookings found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : "You haven't made any bike rentals yet"}
                </p>
                <Link href="/bike-on-rent" className="inline-flex items-center gap-2 px-4 py-2 bg-[#09B368] text-white rounded-xl text-sm font-semibold hover:bg-[#078F53] transition">
                  <Bike className="w-4 h-4" />
                  Rent a Bike
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map((booking) => {
                      const statusConfig = getStatusConfig(booking.status);
                      return (
                        <tr
                          key={booking.id}
                          onClick={() => window.location.href = `/customer/bike-bookings/${booking.bookingNumber}`}
                          className="hover:bg-gray-50/80 group cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#09B368]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Bike className="w-4 h-4 text-[#09B368]" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{booking.vehicleName}</p>
                                <p className="text-xs text-gray-400">#{booking.bookingNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{booking.locationName || booking.location?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="text-sm text-gray-600">
                              <p>{formatDate(booking.pickupDate)}</p>
                              <p className="text-xs text-gray-400">{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.text)}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right hidden sm:table-cell">
                            <p className="font-semibold text-gray-900 text-sm">₹{booking.grandTotal?.toLocaleString('en-IN')}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#09B368] transition-colors ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom nav cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/bike-on-rent"
              className="bg-[#09B368] text-white rounded-2xl p-5 flex items-center justify-between hover:bg-[#078F53] transition"
            >
              <div>
                <h3 className="font-bold mb-0.5">Rent Another Bike</h3>
                <p className="text-white/70 text-sm">Browse scooters, bikes & more</p>
              </div>
              <Bike className="w-10 h-10 opacity-40" />
            </Link>
            <Link
              href="/customer/dashboard"
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-[#09B368]/30 transition"
            >
              <div>
                <h3 className="font-bold text-gray-900 mb-0.5">All Bookings</h3>
                <p className="text-gray-500 text-sm">View all your travel bookings</p>
              </div>
              <Calendar className="w-10 h-10 text-gray-200" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
