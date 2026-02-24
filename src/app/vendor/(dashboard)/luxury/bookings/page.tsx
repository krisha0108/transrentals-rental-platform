// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  TrendingUp,
  Filter,
  Crown,
  Star,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface LuxuryItem {
  id: string;
  bookingNumber: string;
  type: 'quote_request' | 'quoted' | 'booking';
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  specificModel: string | null;
  customerName: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress: string | null;
  dropCity: string | null;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  tripDays: number | null;
  tripHours: number | null;
  needDecoration: boolean;
  decorationType: string | null;
  occasion: string | null;
  requirements: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  totalAmount: number | null;
  status: string;
  paymentStatus: string | null;
  driverName: string | null;
  driverPhone: string | null;
  quotesOpenTill: string | null;
  totalQuotesReceived: number | null;
  myQuote: { id: string; quoteNumber: string; totalAmount: number; status: string } | null;
  createdAt: string;
}

interface Stats {
  openRequests: number;
  myQuotes: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OPEN_REQUEST: { label: 'New Request', color: 'bg-amber-500 text-white', icon: AlertCircle },
  QUOTE_SENT: { label: 'Quote Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-indigo-100 text-indigo-700', icon: User },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TRIP_TYPES: Record<string, string> = {
  local: 'Local',
  outstation: 'Outstation',
  airport: 'Airport',
};

const VEHICLE_CATEGORIES: Record<string, string> = {
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
  vintage: 'Vintage',
  sports: 'Sports Car',
  limousine: 'Limousine',
};

export default function VendorLuxuryBookingsPage() {
  const [items, setItems] = useState<LuxuryItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    openRequests: 0,
    myQuotes: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', filter);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const [bookingsRes, statsRes] = await Promise.all([
        fetch(`/api/vendor/luxury-bookings?${params}`),
        fetch('/api/vendor/luxury-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stats' }),
        }),
      ]);

      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();

      if (bookingsData.success) {
        setItems(bookingsData.bookings);
        // Set pagination state
        if (bookingsData.pagination) {
          setTotalPages(bookingsData.pagination.totalPages);
          setTotalItems(bookingsData.pagination.total);
        }
      } else {
        setError(bookingsData.error || 'Failed to fetch data');
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, currentPage, dateFilter]);

  const getTimeRemaining = (quotesOpenTill: string) => {
    const now = new Date();
    const deadline = new Date(quotesOpenTill);
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    return `${hours}h left`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Luxury Bookings</h1>
            <p className="text-gray-600">Quote requests & confirmed bookings</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => {
            setFilter('open');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'open' ? 'ring-2 ring-amber-500' : ''} bg-gradient-to-br from-amber-500 to-yellow-500 text-white`}
        >
          <p className="text-2xl font-bold">{stats.openRequests}</p>
          <p className="text-xs opacity-80">New Requests</p>
        </button>
        <button
          onClick={() => {
            setFilter('quoted');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'quoted' ? 'ring-2 ring-blue-500' : ''} bg-white border shadow-sm`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.myQuotes}</p>
          <p className="text-xs text-gray-500">My Quotes</p>
        </button>
        <button
          onClick={() => {
            setFilter('confirmed');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'confirmed' ? 'ring-2 ring-green-500' : ''} bg-white border shadow-sm`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.pending + stats.confirmed}</p>
          <p className="text-xs text-gray-500">Confirmed</p>
        </button>
        <button
          onClick={() => {
            setFilter('active');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'active' ? 'ring-2 ring-purple-500' : ''} bg-white border shadow-sm`}
        >
          <p className="text-2xl font-bold text-purple-600">{stats.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </button>
        <button
          onClick={() => {
            setFilter('completed');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'completed' ? 'ring-2 ring-gray-500' : ''} bg-white border shadow-sm`}
        >
          <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </button>
        <button
          onClick={() => {
            setFilter('all');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl text-left transition ${filter === 'all' ? 'ring-2 ring-gray-900' : ''} bg-gray-900 text-white`}
        >
          <p className="text-2xl font-bold">{stats.openRequests + stats.myQuotes + stats.pending + stats.confirmed + stats.active}</p>
          <p className="text-xs opacity-80">All</p>
        </button>
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <p className="text-2xl font-bold">₹{(stats.totalEarnings / 1000).toFixed(0)}K</p>
          <p className="text-xs opacity-80">Earned</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
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

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-amber-100">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No items found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'open' ? 'No new quote requests in your area.' : 'No bookings matching this filter.'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN_REQUEST;
            const isOpenRequest = item.type === 'quote_request';
            const isQuoted = item.type === 'quoted';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                  isOpenRequest ? 'border-2 border-amber-300' : 'border border-gray-100'
                }`}
              >
                {/* Header */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  isOpenRequest
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                    : isQuoted
                    ? 'bg-blue-50 text-blue-900'
                    : 'bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 text-white'
                }`}>
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${isOpenRequest ? 'text-white' : isQuoted ? 'text-blue-500' : 'text-amber-400'}`} />
                    <span className="font-mono text-sm">#{item.bookingNumber}</span>
                    {isOpenRequest && (
                      <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
                        NEW REQUEST
                      </span>
                    )}
                    {isQuoted && item.myQuote && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Quote: ₹{item.myQuote.totalAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.quotesOpenTill && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isOpenRequest ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {getTimeRemaining(item.quotesOpenTill)}
                      </span>
                    )}
                    {!isOpenRequest && !isQuoted && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {/* Vehicle & Price */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {item.vehicleName || item.vehicleCategoryName || VEHICLE_CATEGORIES[item.chauffeur_vehicle_categories] || item.chauffeur_vehicle_categories}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {TRIP_TYPES[item.tripType] || item.tripType}
                          {item.specificModel && ` • ${item.specificModel}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.totalAmount ? (
                        <p className="text-2xl font-bold text-amber-600">₹{item.totalAmount.toLocaleString()}</p>
                      ) : item.budgetMax ? (
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-bold text-gray-700">₹{item.budgetMin?.toLocaleString() || 0} - ₹{item.budgetMax.toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Quote Required</p>
                      )}
                      {item.occasion && (
                        <span className="inline-flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full mt-1">
                          <Gift className="w-3 h-3" />
                          {item.occasion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Route</p>
                        <p className="text-sm font-medium">{item.pickupCity}{item.dropCity && ` → ${item.dropCity}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm font-medium">
                          {new Date(item.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {item.pickupTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium">{item.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium">
                          {item.tripHours ? `${item.tripHours} hours` : `${item.tripDays || 1} day(s)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.needDecoration && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Decoration</span>
                    )}
                    {item.totalQuotesReceived !== null && item.totalQuotesReceived > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {item.totalQuotesReceived} quote(s)
                      </span>
                    )}
                  </div>

                  {/* Requirements */}
                  {item.requirements && (
                    <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100">
                      <p className="text-xs text-amber-700 font-medium">Requirements:</p>
                      <p className="text-sm text-amber-800">{item.requirements}</p>
                    </div>
                  )}

                  {/* Driver Info */}
                  {item.driverName && (
                    <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100">
                      <p className="text-xs text-green-700 font-medium mb-1">Driver Assigned</p>
                      <div className="flex gap-4 text-sm">
                        <span><User className="w-4 h-4 inline mr-1" />{item.driverName}</span>
                        {item.driverPhone && <span><Phone className="w-4 h-4 inline mr-1" />{item.driverPhone}</span>}
                        {item.vehicleNumber && <span><Car className="w-4 h-4 inline mr-1" />{item.vehicleNumber}</span>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {isOpenRequest && (
                      <Link
                        href={`/vendor/luxury/send-quote/${item.id}`}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Quote
                      </Link>
                    )}
                    {isQuoted && item.myQuote && (
                      <Link
                        href={`/vendor/luxury/quotes/${item.myQuote.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Quote
                      </Link>
                    )}
                    {item.type === 'booking' && ['ADVANCE_PAID', 'CONFIRMED'].includes(item.status) && !item.driverName && (
                      <Link
                        href={`/vendor/luxury/bookings/${item.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                      >
                        Assign Driver
                      </Link>
                    )}
                    {item.type === 'booking' && ['DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(item.status) && (
                      <Link
                        href={`/vendor/luxury/bookings/${item.id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                      >
                        Manage Trip
                      </Link>
                    )}
                    {item.type === 'booking' && ['COMPLETED', 'PAYMENT_SUBMITTED', 'PENDING_PAYMENT'].includes(item.status) && (
                      <Link
                        href={`/vendor/luxury/bookings/${item.id}`}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
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
      {items.length > 0 && (
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
