'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Truck,
  CalendarCheck,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  Clock,
  Search,
  X,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

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

interface Stats {
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  totalEarnings: number;
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
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorTransporterBookingsPage() {
  const [bookings, setBookings] = useState<TruckBooking[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, confirmed: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const config = TRANSPORTER_CONFIG;

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filter, currentPage, dateFilter, search]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'upcoming' ? 'confirmed' : filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : '';
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (search) params.set('search', search);

      const response = await fetch(`/api/vendor/truck-bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/vendor/truck-bookings', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by customer name, phone, email, booking number..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {stats.pending + stats.confirmed}
          </p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            {stats.active}
          </p>
          <p className="text-sm text-gray-500">In Transit</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {stats.completed}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <p className="text-2xl font-bold text-indigo-600">
            ₹{(stats.totalEarnings || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'active', label: 'In Transit' },
            { value: 'completed', label: 'Delivered' },
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
                  ? 'bg-indigo-100 text-indigo-700'
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
