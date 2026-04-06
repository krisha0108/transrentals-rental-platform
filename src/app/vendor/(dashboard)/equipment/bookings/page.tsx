'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CalendarCheck,
  MapPin,
  Calendar,

  Eye,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  X,
} from 'lucide-react';
import { EQUIPMENT_CONFIG } from '@/lib/quote-services';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

// Equipment type ID to name mapping (IDs from customer booking form)
const EQUIPMENT_TYPE_NAMES: Record<string, string> = {
  '1': 'Grove Crane',
  '2': 'Truck Mounted Crane',
  '3': 'Tower Crane',
  '4': 'Telescopic Crane',
  '5': 'Rough Terrain Crane',
  '6': 'Overhead Crane',
  '7': 'Bulldozer',
  '8': 'Dumper',
  '9': 'Loader',
  '10': 'Excavators',
  '11': 'Backhoe Loader',
};

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  equipmentName?: string;
  equipmentModel?: string;
  quantity: number;
  rentalDays?: number;
  startDate: string;
  endDate?: string;
  city: string;
  deliveryAddress: string;
  customerName: string;

  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  status: string;
  paymentStatus?: string;
  operatorName?: string;
  operatorPhone?: string;
  deliveryOtp?: string;
  returnOtp?: string;
  rating?: number;
  quoteRequest?: { id: string; requestNumber: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DISPATCHED: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-700', icon: Wrench },
  DELIVERED: { label: 'Delivered', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle },
  ON_RENT: { label: 'On Rent', color: 'bg-purple-100 text-purple-700', icon: Clock },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'bg-orange-100 text-orange-700', icon: Calendar },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorEquipmentBookingsPage() {
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
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

  // Fetch bookings from API
  const fetchBookings = async (type?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (type && type !== 'all') {
        params.set('type', type);
      }

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (search) params.set('search', search);

      const url = `/api/vendor/equipment-bookings?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/vendor/equipment-bookings', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchBookings(filter);
    fetchStats();
  }, [filter, currentPage, dateFilter, search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // API already filters, so just use the bookings directly
  const filteredBookings = bookings;

  const getCategoryName = (category: string) => {
    const cat = EQUIPMENT_CONFIG?.categories?.find((c) => c.id === category);
    return cat?.shortName || cat?.name || category || 'Equipment';
  };

  const getEquipmentDisplayName = (booking: EquipmentBooking) => {
    return booking.equipmentName || booking.equipmentModel || booking.equipmentType || 'Equipment';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => { setError(null); fetchBookings(filter); }}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Bookings</h1>
            <p className="text-gray-600">Manage your rental contracts</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => ['CONFIRMED', 'DISPATCHED', 'DELIVERED', 'ON_RENT'].includes(b.status)).length}
          </p>
          <p className="text-sm text-gray-500">Active Rentals</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'COMPLETED').length}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-100">
          <p className="text-2xl font-bold text-amber-600">
            ₹{bookings.reduce((sum, b) => sum + (b.totalAmount - (b.advancePaid || 0)), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pending Balance</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Value</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 items-center">
        {[
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setCurrentPage(1); // Reset to page 1 when filter changes
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === f.value
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}

        <DateFilterDropdown
          onFilterChange={(start, end) => {
            setDateFilter({ start, end });
            setCurrentPage(1); // Reset to page 1 when filter changes
          }}
          initialStartDate={dateFilter.start || undefined}
          initialEndDate={dateFilter.end || undefined}
        />
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900">No bookings found</h3>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">#{booking.bookingNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.equipmentName || EQUIPMENT_TYPE_NAMES[booking.equipmentType] || booking.equipmentType}</h3>
                        <p className="text-sm text-gray-500">{getCategoryName(booking.equipmentCategory)}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {booking.city}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString() || '0'}</p>
                      {(booking.totalAmount - (booking.advancePaid || 0)) > 0 && (
                        <p className="text-sm text-amber-600">Balance: ₹{(booking.totalAmount - (booking.advancePaid || 0)).toLocaleString()}</p>
                      )}
                      {booking.rating && (
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {booking.endDate && ` - ${new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </div>
                    {booking.rentalDays && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded">{booking.rentalDays} days</span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                    </div>
                    {booking.operatorName && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Operator</span>
                        <p className="font-medium text-gray-900">{booking.operatorName}</p>
                        <p className="text-sm text-gray-600">{booking.operatorPhone}</p>
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
                      href={`/vendor/equipment/bookings/${booking.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
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
