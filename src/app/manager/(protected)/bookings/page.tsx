'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bike,
  RefreshCw,
  Car,
  Bus,
  Truck,
  Package,
  Layers,
  ChevronLeft,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  vendorName?: string;
  locationName: string;
  serviceName?: string;
  serviceSlug?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  totalAmount: number;
  advancePaymentVerified: boolean;
  createdAt: string;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'bike-rental': Bike,
  'car-rental': Car,
  'chauffeur': Car,
  'luxury-car-rental': Car,
  'bus-rental': Bus,
  'truck-rental': Truck,
  'packers-movers': Package,
  'equipment-rental': Package,
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_PAYMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Payment' },
  PAYMENT_SUBMITTED: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Payment Submitted' },
  PAYMENT_VERIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Payment Verified' },
  PENDING_VENDOR: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Pending Vendor' },
  BROADCASTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Broadcasted' },
  ACCEPTED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  READY_FOR_PICKUP: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Ready for Pickup' },
  IN_PROGRESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'In Progress' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
  EXPIRED: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Expired' },
  REFUNDED: { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Refunded' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAYMENT_SUBMITTED', label: 'Payment Submitted' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

type DateFilter = 'all' | 'today' | 'yesterday' | 'thisMonth' | 'lastMonth';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'all', label: 'All Bookings' },
];

export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBookings = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (serviceFilter !== 'all') {
        params.set('service', serviceFilter);
      }

      const response = await fetch(`/api/manager/dashboard?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        if (data.assignedServices) {
          setAssignedServices(data.assignedServices);
        }
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, serviceFilter]);

  // Date filtering helper
  const filterByDate = (booking: Booking, filter: DateFilter): boolean => {
    if (filter === 'all') return true;

    const bookingDate = new Date(booking.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
      case 'today':
        return bookingDate >= today;
      case 'yesterday':
        return bookingDate >= yesterday && bookingDate < today;
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return bookingDate >= thisMonthStart;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        return bookingDate >= lastMonthStart && bookingDate < lastMonthEnd;
      default:
        return true;
    }
  };

  useEffect(() => {
    let filtered = bookings;

    // Apply date filter
    filtered = filtered.filter((b) => filterByDate(b, dateFilter));

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookingNumber?.toLowerCase().includes(term) ||
          b.customerName?.toLowerCase().includes(term) ||
          b.customerPhone?.includes(term) ||
          b.locationName?.toLowerCase().includes(term) ||
          b.vendorName?.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, bookings, dateFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">Manage bookings for your assigned locations</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === filter.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by booking #, customer, phone, location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Service Filter */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
            >
              <option value="all">All Services</option>
              {assignedServices.map((service) => (
                <option key={service.id} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          Showing {filteredBookings.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
        </p>
        {totalPages > 1 && (
          <p>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {currentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Bike className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No bookings are assigned to your locations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentBookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
              const ServiceIcon = SERVICE_ICONS[booking.serviceSlug || 'bike-rental'] || Bike;
              return (
                <Link
                  key={booking.id}
                  href={`/manager/bookings/${booking.id}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ServiceIcon className="w-6 h-6 text-green-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          #{booking.bookingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                        {booking.advancePaymentVerified && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Payment Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{booking.locationName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(booking.pickupDate)}</span>
                          {booking.pickupTime && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400 ml-2" />
                              <span>{booking.pickupTime}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {booking.serviceName && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                            {booking.serviceName}
                          </span>
                        )}
                        {booking.vendorName && (
                          <span>
                            Vendor: <span className="font-medium text-gray-700">{booking.vendorName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {formatCurrency(booking.totalAmount).replace('₹', '')}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
