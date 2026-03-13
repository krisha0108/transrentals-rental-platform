'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  CalendarCheck,
  MapPin,
  Calendar,
  Phone,
  Eye,
  IndianRupee,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  Truck,
  Loader2,
  Users,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface PackersBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  shiftingType: string;
  customerName: string;

  pickupCity: string;
  pickupAddress: string;
  pickupFloor?: number;
  dropCity: string;
  dropAddress: string;
  dropFloor?: number;
  scheduledDate: string;
  teamSize: number;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: boolean;
  status: string;
  paymentStatus: string;
  teamLeaderName?: string;
  teamLeaderPhone?: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
  };
  createdAt: string;
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
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Users },
  PACKING: { label: 'Packing', color: 'bg-orange-100 text-orange-700', icon: Package },
  LOADING: { label: 'Loading', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'bg-teal-100 text-teal-700', icon: Truck },
  UNPACKING: { label: 'Unpacking', color: 'bg-pink-100 text-pink-700', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorPackersBookingsPage() {
  const [bookings, setBookings] = useState<PackersBooking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filter, currentPage, dateFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filter === 'upcoming') params.set('type', 'pending');
      else if (filter === 'confirmed') params.set('type', 'confirmed');
      else if (filter === 'active') params.set('type', 'active');
      else if (filter === 'completed') params.set('type', 'completed');

      // Pagination params
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // Date filter params
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/packers-bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/vendor/packers-bookings', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      // Silent fail for stats
    }
  };

  const getBalanceAmount = (booking: PackersBooking) => {
    return booking.advancePaid ? booking.totalAmount - booking.advanceAmount : booking.totalAmount;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600">Manage your confirmed shifting jobs</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {stats ? stats.pending + stats.confirmed : 0}
          </p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            {stats?.active || 0}
          </p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {stats?.completed || 0}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">
            ₹{(stats?.totalEarnings || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'active', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
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

          <DateFilterDropdown
            onFilterChange={(start, end) => {
              setDateFilter({ start, end });
              setCurrentPage(1);
            }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-500">
              {filter !== 'all' ? 'No bookings match this filter' : 'Accepted quotes will appear here'}
            </p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
            const StatusIcon = statusConfig.icon;
            const isUpcoming = new Date(booking.scheduledDate) > new Date();
            const balanceAmount = getBalanceAmount(booking);

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
                    {booking.quoteRequest && (
                      <span className="text-xs text-gray-500">
                        Request: {booking.quoteRequest.requestNumber}
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
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.customerName}</h3>
                        <p className="text-sm text-gray-500 capitalize">{booking.shiftingType} Shifting</p>
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
                        ₹{booking.totalAmount.toLocaleString()}
                      </p>
                      {balanceAmount > 0 && (
                        <p className="text-sm text-blue-600">
                          Balance: ₹{balanceAmount.toLocaleString()}
                        </p>
                      )}
                      {booking.advancePaid && (
                        <p className="text-xs text-green-600">
                          Advance: ₹{booking.advanceAmount.toLocaleString()} paid
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      Team Size: {booking.teamSize}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                    </div>
                    {booking.teamLeaderName && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Team Leader</span>
                        <p className="font-medium text-gray-900">{booking.teamLeaderName}</p>
                        {booking.teamLeaderPhone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.teamLeaderPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

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

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/packers/bookings/${booking.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {!booking.teamLeaderName && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && isUpcoming && (
                      <Link
                        href={`/vendor/packers/bookings/${booking.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Users className="w-4 h-4" />
                        Assign Team
                      </Link>
                    )}
                    {booking.status === 'TEAM_ASSIGNED' && isUpcoming && (
                      <Link
                        href={`/vendor/packers/bookings/${booking.id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                      >
                        <Navigation className="w-4 h-4" />
                        Start Shifting
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {bookings.length > 0 && (
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
