'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Inbox,
  Radio,
  Wifi,
  WifiOff,
  Bell,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVendorBookings } from '@/hooks/useVendorBookings';
import { useSession } from 'next-auth/react';
import { NewBookingNotification } from '@/components/vendor/NewBookingNotification';
import { AcceptBookingModal } from '@/components/vendor/AcceptBookingModal';
import { BookingNotification } from '@/lib/socket/types';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  vehicleType?: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  grandTotal: number;
  status: string;
  type: 'direct' | 'open';
  createdAt: string;
  requestedModelId?: string;
}

interface VehicleOption {
  id: string;
  name: string;
  registrationNumber?: string;
  dailyRate: number;
  fleetPricing: any[];
  fleetLocations: any[];
}

const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Awaiting Payment',
    color: 'bg-orange-100 text-orange-700',
    icon: Clock,
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
  },
  PENDING_VENDOR: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
  BROADCASTED: {
    label: 'Open',
    color: 'bg-blue-100 text-blue-700',
    icon: Radio,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-700',
    icon: Bike,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-700',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

export default function VendorBikeBookingsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);

  // Modal states
  const [showNotification, setShowNotification] = useState(false);
  const [latestNotification, setLatestNotification] = useState<BookingNotification | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Fetch vendor info and bookings
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch vendor info
      const vendorRes = await fetch('/api/vendor/profile');
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        setVendorId(vendorData.id);

        // Fetch vendor fleet
        const fleetRes = await fetch('/api/vendor/fleet?serviceSlug=bike-rental');
        if (fleetRes.ok) {
          const fleetData = await fleetRes.json();
          setVendorFleet(fleetData.fleet?.map((f: any) => ({
            id: f.id,
            name: f.vehicle_models?.name || 'Unknown',
            registrationNumber: f.registrationNumber,
            dailyRate: f.fleetPricing?.[0]?.perDayRate || f.fleetPricing?.[0]?.basePrice || 0,
            fleetPricing: f.fleetPricing || [],
            fleetLocations: f.fleetLocations || [],
          })) || []);
        }
      }

      // Fetch bookings
      const params = new URLSearchParams();

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const bookingsRes = await fetch(`/api/vendor/bike-bookings?${params}`);
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);

        // Set pagination state from response
        if (bookingsData.pagination) {
          setTotalPages(bookingsData.pagination.totalPages);
          setTotalItems(bookingsData.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time booking notifications
  const {
    isConnected,
    pendingBookings,
    lastNotification,
    removeBooking,
    clearLastNotification,
  } = useVendorBookings({
    vendorId: vendorId || '',
    onNewBooking: (booking) => {
      setLatestNotification(booking);
      setShowNotification(true);
      // Also refresh the bookings list
      fetchData();
    },
    onBookingExpired: (bookingId) => {
      // Remove from local state
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    },
    onPaymentReceived: (payment) => {
      // Update booking status in local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === payment.bookingId
            ? { ...b, status: 'CONFIRMED', paymentStatus: 'COMPLETED' }
            : b
        )
      );
    },
    playSound: soundEnabled,
  });

  // Handle accept from notification
  const handleAcceptFromNotification = () => {
    if (latestNotification) {
      // Find the booking in the list or create a temporary one
      const existingBooking = bookings.find(
        (b) => b.id === latestNotification.bookingId
      );

      if (existingBooking) {
        setSelectedBooking(existingBooking);
      } else {
        // Create temporary booking from notification
        setSelectedBooking({
          id: latestNotification.bookingId,
          bookingNumber: latestNotification.bookingNumber,
          customerName: latestNotification.customerName,
          customerPhone: '',
          vehicleName: latestNotification.vehicle_modelsName,
          locationId: latestNotification.locationId,
          locationName: latestNotification.locationName,
          pickupDate: latestNotification.pickupDate,
          pickupTime: latestNotification.pickupTime,
          dropDate: latestNotification.dropDate,
          dropTime: latestNotification.dropTime,
          totalDays: latestNotification.totalDays,
          dailyRate: latestNotification.estimatedAmount / latestNotification.totalDays,
          totalAmount: latestNotification.estimatedAmount,
          grandTotal: latestNotification.estimatedAmount,
          status: 'BROADCASTED',
          type: 'open',
          createdAt: latestNotification.createdAt,
          requestedModelId: latestNotification.vehicle_modelsId,
        });
      }

      setShowNotification(false);
      setAcceptModalOpen(true);
    }
  };

  // Handle accept booking
  const handleAcceptBooking = async (data: {
    vehicleId: string;
    vehicleName: string;
    customRate?: number;
  }) => {
    if (!selectedBooking) return;

    const response = await fetch(
      `/api/vendor/bike-bookings/${selectedBooking.id}/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.error || 'Failed to accept booking');
      (error as any).status = response.status;
      throw error;
    }

    // Update local state
    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: 'ACCEPTED' } : b
      )
    );

    // Remove from pending notifications
    if (lastNotification?.bookingId === selectedBooking.id) {
      clearLastNotification();
    }
    removeBooking(selectedBooking.id);

    // Refresh data
    fetchData();
  };

  // Filter bookings
  const filteredBookings = bookings
    .filter((booking) => {
      if (filter === 'direct') return booking.type === 'direct';
      if (filter === 'open') return booking.type === 'open' || booking.status === 'BROADCASTED';
      if (filter === 'pending')
        return booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED';
      if (filter === 'active')
        return ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status);
      return true;
    })
    .filter((booking) => {
      if (!searchQuery) return true;
      return (
        booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehicleName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING_VENDOR').length,
    open: bookings.filter((b) => b.status === 'BROADCASTED').length + pendingBookings.length,
    active: bookings.filter((b) => ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Real-time Notification Banner */}
      <NewBookingNotification
        booking={latestNotification}
        isVisible={showNotification}
        onAccept={handleAcceptFromNotification}
        onDismiss={() => {
          setShowNotification(false);
          clearLastNotification();
        }}
      />

      {/* Accept Booking Modal */}
      <AcceptBookingModal
        isOpen={acceptModalOpen}
        onClose={() => {
          setAcceptModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        vehicles={vendor_fleet}
        onAccept={handleAcceptBooking}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bike Rental Bookings</h1>
          <p className="text-gray-600">Manage your bike rental bookings in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'p-2 rounded-lg transition',
              soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            )}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Pending Notifications */}
          {pendingBookings.length > 0 && (
            <button
              onClick={() => {
                if (pendingBookings[0]) {
                  setLatestNotification(pendingBookings[0]);
                  setShowNotification(true);
                }
              }}
              className="relative p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingBookings.length}
              </span>
            </button>
          )}

          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Bookings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Inbox className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-sm text-gray-500">Open Requests</p>
            </div>
          </div>
          {pendingBookings.length > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/vendor/bike-rentals/bookings/direct"
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Direct Requests</h3>
              <p className="text-orange-100">Bookings for your specific vehicles</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.pending}</span>
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </Link>
        <Link
          href="/vendor/bike-rentals/bookings/open"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white hover:shadow-lg transition-shadow relative"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Open Requests</h3>
              <p className="text-blue-100">Available for you to accept</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.open}</span>
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          {pendingBookings.length > 0 && (
            <span className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              {pendingBookings.length} NEW
            </span>
          )}
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID, customer, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'direct', label: 'Direct' },
              { value: 'open', label: 'Open' },
              { value: 'active', label: 'Active' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors',
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <DateFilterDropdown
            onFilterChange={(start, end) => {
              setDateFilter({ start, end });
              setCurrentPage(1); // Reset to page 1 when filter changes
            }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon || AlertCircle;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        #{booking.bookingNumber}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          statusConfig?.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig?.label}
                      </span>
                      {(booking.type === 'open' || booking.status === 'BROADCASTED') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Radio className="w-3 h-3" />
                          Open Request
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bike className="w-4 h-4" />
                        <span>{booking.vehicleName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.locationName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>
                        {formatDate(booking.pickupDate)} {booking.pickupTime} →{' '}
                        {formatDate(booking.dropDate)} {booking.dropTime}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>{booking.totalDays} days</span>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{booking.grandTotal || booking.totalAmount}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount</p>
                    </div>

                    <div className="flex gap-2">
                      {(booking.status === 'PENDING_VENDOR' || booking.status === 'BROADCASTED' || booking.status === 'PAYMENT_VERIFIED') && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setAcceptModalOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Link href={`/vendor/bike-rentals/bookings/${booking.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
