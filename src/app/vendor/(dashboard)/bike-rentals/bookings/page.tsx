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
  Eye,
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
  numberOfVehicles?: number;
  pickupAddress?: string;
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
    color: 'bg-emerald-100 text-emerald-700',
    icon: Clock,
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'bg-emerald-100 text-emerald-700',
    icon: Clock,
  },
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle,
  },
  PENDING_VENDOR: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
  BROADCASTED: {
    label: 'Open',
    color: 'bg-emerald-100 text-emerald-700',
    icon: Radio,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-emerald-100 text-emerald-700',
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
  DROPPED: {
    label: 'Dropped',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
};

export default function VendorBikeBookingsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor_fleet, setVendorFleet] = useState<VehicleOption[]>([]);

  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [latestNotification, setLatestNotification] = useState<BookingNotification | null>(null);
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
    <div className="space-y-5">
      {/* Real-time Notification Banner */}
      <NewBookingNotification
        booking={latestNotification}
        isVisible={showNotification}
        onAccept={() => setShowNotification(false)}
        onDismiss={() => {
          setShowNotification(false);
          clearLastNotification();
        }}
      />

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-500 p-5 animate-slide-down">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Bike Bookings</h1>
              <p className="text-emerald-100 text-xs mt-0.5">Manage bookings in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm border', isConnected ? 'bg-emerald-500/20 text-white border-emerald-400/30' : 'bg-red-500/20 text-white border-red-400/30')}>
              {isConnected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Offline</>}
            </div>

            <button onClick={() => setSoundEnabled(!soundEnabled)} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition backdrop-blur-sm border', soundEnabled ? 'bg-white/20 text-white border-white/20' : 'bg-white/10 text-white/50 border-white/10')} title={soundEnabled ? 'Sound On' : 'Sound Off'}>
              <Volume2 className="w-4 h-4" />
            </button>

            {pendingBookings.length > 0 && (
              <button onClick={() => { if (pendingBookings[0]) { setLatestNotification(pendingBookings[0]); setShowNotification(true); } }} className="relative w-8 h-8 bg-white/20 backdrop-blur-sm text-white rounded-lg flex items-center justify-center hover:bg-white/30 transition border border-white/20">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">{pendingBookings.length}</span>
              </button>
            )}

            <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition border border-white/20">
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {[
          { label: 'Total', value: stats.total, icon: <CalendarCheck className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-gray-100 to-gray-50', iconColor: 'text-gray-500', border: 'border-gray-100', sub: 'all bookings' },
          { label: 'Pending', value: stats.pending, icon: <Inbox className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'awaiting action' },
          { label: 'Open', value: stats.open, icon: <Radio className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'available to accept', pulse: pendingBookings.length > 0 },
          { label: 'Active', value: stats.active, icon: <CheckCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'in progress' },
        ].map((s: any) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group cursor-default`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center ${s.iconColor} group-hover:scale-110 transition-transform`}>{s.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            {s.pulse && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
          </div>
        ))}
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <Link href="/vendor/bike-rentals/bookings/direct" className="relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-emerald-500 hover:from-emerald-600 hover:to-emerald-600 rounded-2xl px-5 py-4 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]">
          <div className="absolute inset-0 opacity-10"><div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white" /></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base">Direct Requests</h3>
              <p className="text-emerald-100 text-xs mt-0.5">Bookings for your vehicles</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold">{stats.pending}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
        <Link href="/vendor/bike-rentals/bookings/open" className="relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-2xl px-5 py-4 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]">
          <div className="absolute inset-0 opacity-10"><div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white" /></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base">Open Requests</h3>
              <p className="text-emerald-100 text-xs mt-0.5">Available to accept</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold">{stats.open}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          {pendingBookings.length > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-lg shadow-red-500/30">{pendingBookings.length} NEW</span>
          )}
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'direct', label: 'Direct' },
              { value: 'open', label: 'Open' },
              { value: 'active', label: 'Active' },
            ].map((f) => (
              <button key={f.value} onClick={() => { setFilter(f.value); setCurrentPage(1); }} className={cn('px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap', filter === f.value ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50')}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search booking, customer, vehicle..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput); setCurrentPage(1); } }}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition"
                >
                  <XCircle className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
              className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          <DateFilterDropdown
            onFilterChange={(start, end) => { setDateFilter({ start, end }); setCurrentPage(1); }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
        </div>
      </div>

      {/* ── Bookings List ── */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map(i => {
            const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
            const borderColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
            return (
              <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${borderColors[i - 1]}` }}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 bg-gray-200 rounded-lg w-28 ${shimmer}`} />
                        <div className={`h-5 bg-gray-100 rounded-full w-20 ${shimmer}`} />
                      </div>
                      <div className="flex gap-3">
                        <div className={`h-3 bg-gray-100 rounded w-24 ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-28 ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-20 ${shimmer}`} />
                      </div>
                      <div className="flex gap-2">
                        <div className={`h-3 bg-gray-100 rounded w-44 ${shimmer}`} />
                        <div className={`h-3 bg-emerald-100 rounded w-10 ${shimmer}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="space-y-1.5 text-right">
                        <div className={`h-6 bg-gray-200 rounded-lg w-20 ml-auto ${shimmer}`} />
                        <div className={`h-3 bg-gray-100 rounded w-14 ml-auto ${shimmer}`} />
                      </div>
                      <div className={`w-8 h-8 bg-gray-100 rounded-lg ${shimmer}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm">
              <CalendarCheck className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <p className="text-gray-900 font-bold text-base">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBookings.map((booking) => {
            const sc = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = sc?.icon || AlertCircle;
            const statusBorder = booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' ? '#10B981'
              : booking.status === 'IN_PROGRESS' ? '#8B5CF6'
              : booking.status === 'BROADCASTED' ? '#3B82F6'
              : booking.status === 'CANCELLED' || booking.status === 'DROPPED' ? '#EF4444'
              : booking.status === 'COMPLETED' ? '#6B7280'
              : '#F59E0B';

            return (
              <Link key={booking.id} href={`/vendor/bike-rentals/bookings/${booking.id}`}
                className="block bg-white rounded-2xl hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${statusBorder}` }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-bold text-gray-900">#{booking.bookingNumber}</span>
                        <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold', sc?.color)}>
                          <StatusIcon className="w-2.5 h-2.5" /> {sc?.label}
                        </span>
                        {(booking.type === 'open' || booking.status === 'BROADCASTED') && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                            <Radio className="w-2.5 h-2.5" /> Open
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700"><User className="w-3 h-3 text-gray-400" /> {booking.customerName}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><Bike className="w-3 h-3 text-gray-400" /> {booking.vehicleName}{booking.numberOfVehicles && booking.numberOfVehicles > 1 ? ` × ${booking.numberOfVehicles}` : ''}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {booking.locationName}</span>
                      </div>
                      {booking.pickupAddress && (
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate" title={booking.pickupAddress}>{booking.pickupAddress}</div>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" />
                          {formatDate(booking.pickupDate)} {booking.pickupTime} → {formatDate(booking.dropDate)} {booking.dropTime}
                        </span>
                        <span className="font-semibold text-emerald-600">({booking.totalDays}d)</span>
                      </div>

                      {booking.status === 'DROPPED' && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span className="font-medium">Dropped</span>
                          {(booking as any).dropReason && <span>· {(booking as any).dropReason}</span>}
                        </div>
                      )}
                    </div>

                    {/* Right — Price + View */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-gray-900">₹{(booking.grandTotal || booking.totalAmount).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">₹{booking.dailyRate}/day</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
