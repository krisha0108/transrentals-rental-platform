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
  AlertCircle,
  FileText,
  RefreshCw,
  Bike,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ChevronLeft,
} from 'lucide-react';

interface Inquiry {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  totalAmount: number;
  advancePaymentVerified: boolean;
  advancePaymentProof?: string;
  advancePaymentRef?: string;
  createdAt: string;
}

const INQUIRY_STATUSES = [
  'PENDING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'PAYMENT_VERIFIED',
  'PENDING_VENDOR',
  'BROADCASTED',
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; description: string }> = {
  PENDING_PAYMENT: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    label: 'Pending Payment',
    description: 'Customer needs to pay advance',
  },
  PAYMENT_SUBMITTED: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    label: 'Payment Submitted',
    description: 'Awaiting payment verification',
  },
  PAYMENT_VERIFIED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    label: 'Payment Verified',
    description: 'Ready to assign vendor',
  },
  PENDING_VENDOR: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    label: 'Pending Vendor',
    description: 'Waiting for vendor response',
  },
  BROADCASTED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    label: 'Broadcasted',
    description: 'Open for all vendors',
  },
};

type DateFilter = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'all', label: 'All Bookings' },
];

export default function ManagerInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    pendingPayment: 0,
    paymentSubmitted: 0,
    paymentVerified: 0,
    pendingVendor: 0,
    broadcasted: 0,
    total: 0,
  });

  const fetchInquiries = async () => {
    try {
      setError(null);
      const response = await fetch('/api/manager/dashboard');
      const data = await response.json();

      if (data.success) {
        // Filter only inquiry-stage bookings
        const allBookings = data.bookings || [];
        const inquiryBookings = allBookings.filter((b: any) =>
          INQUIRY_STATUSES.includes(b.status)
        );

        setInquiries(inquiryBookings);

        // Calculate stats
        setStats({
          pendingPayment: allBookings.filter((b: any) => b.status === 'PENDING_PAYMENT').length,
          paymentSubmitted: allBookings.filter((b: any) => b.status === 'PAYMENT_SUBMITTED').length,
          paymentVerified: allBookings.filter((b: any) => b.status === 'PAYMENT_VERIFIED').length,
          pendingVendor: allBookings.filter((b: any) => b.status === 'PENDING_VENDOR').length,
          broadcasted: allBookings.filter((b: any) => b.status === 'BROADCASTED').length,
          total: inquiryBookings.length,
        });
      } else {
        setError(data.error || 'Failed to fetch inquiries');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inquiries');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Filter by date
  const filterByDate = (inquiry: Inquiry, filter: DateFilter): boolean => {
    if (filter === 'all') return true;

    const inquiryDate = new Date(inquiry.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
      case 'today':
        return inquiryDate >= today;
      case 'yesterday':
        const tomorrowOfYesterday = new Date(yesterday);
        tomorrowOfYesterday.setDate(tomorrowOfYesterday.getDate() + 1);
        return inquiryDate >= yesterday && inquiryDate < tomorrowOfYesterday;
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return inquiryDate >= thisMonthStart;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return inquiryDate >= lastMonthStart && inquiryDate <= lastMonthEnd;
      default:
        return true;
    }
  };

  useEffect(() => {
    let filtered = inquiries;

    // Apply date filter
    filtered = filtered.filter((i) => filterByDate(i, dateFilter));

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.bookingNumber?.toLowerCase().includes(term) ||
          i.customerName?.toLowerCase().includes(term) ||
          i.customerPhone?.includes(term) ||
          i.locationName?.toLowerCase().includes(term)
      );
    }

    setFilteredInquiries(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, dateFilter, inquiries]);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInquiries = filteredInquiries.slice(startIndex, endIndex);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInquiries();
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Inquiries</h1>
          <p className="text-gray-500 mt-1">Pending bookings that need your attention</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { key: 'PAYMENT_SUBMITTED', count: stats.paymentSubmitted, label: 'Payment Submitted', color: 'orange' },
          { key: 'PENDING_PAYMENT', count: stats.pendingPayment, label: 'Pending Payment', color: 'yellow' },
          { key: 'PAYMENT_VERIFIED', count: stats.paymentVerified, label: 'Payment Verified', color: 'blue' },
          { key: 'PENDING_VENDOR', count: stats.pendingVendor, label: 'Pending Vendor', color: 'purple' },
          { key: 'BROADCASTED', count: stats.broadcasted, label: 'Broadcasted', color: 'indigo' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key)}
            className={`p-4 rounded-xl border transition text-left ${
              statusFilter === stat.key
                ? `bg-${stat.color}-50 border-${stat.color}-200`
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-4">
          {/* Date Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">📅 Period:</span>
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  dateFilter === filter.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

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

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
              >
                <option value="all">All Inquiries ({stats.total})</option>
                <option value="PAYMENT_SUBMITTED">Payment Submitted ({stats.paymentSubmitted})</option>
                <option value="PENDING_PAYMENT">Pending Payment ({stats.pendingPayment})</option>
                <option value="PAYMENT_VERIFIED">Payment Verified ({stats.paymentVerified})</option>
                <option value="PENDING_VENDOR">Pending Vendor ({stats.pendingVendor})</option>
                <option value="BROADCASTED">Broadcasted ({stats.broadcasted})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredInquiries.length)} of {filteredInquiries.length} inquiries
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Inquiries List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {currentInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'All caught up! No pending inquiries at the moment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentInquiries.map((inquiry) => {
              const statusConfig = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.PENDING_PAYMENT;
              const needsAttention = inquiry.status === 'PAYMENT_SUBMITTED';

              return (
                <Link
                  key={inquiry.id}
                  href={`/manager/bookings/${inquiry.id}`}
                  className={`block p-4 sm:p-5 hover:bg-gray-50 transition ${
                    needsAttention ? 'bg-orange-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        needsAttention ? 'bg-orange-100' : 'bg-green-100'
                      }`}
                    >
                      {needsAttention ? (
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      ) : (
                        <Bike className="w-6 h-6 text-green-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          #{inquiry.bookingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-gray-400">{getTimeAgo(inquiry.createdAt)}</span>
                      </div>

                      <p className="text-sm text-gray-500 mb-3">{statusConfig.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{inquiry.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{inquiry.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{inquiry.locationName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(inquiry.pickupDate)}</span>
                          {inquiry.pickupTime && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400 ml-2" />
                              <span>{inquiry.pickupTime}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Payment info for PAYMENT_SUBMITTED */}
                      {inquiry.status === 'PAYMENT_SUBMITTED' && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Payment verification required
                          </p>
                          {inquiry.advancePaymentRef && (
                            <p className="text-xs text-orange-600 mt-1">
                              Ref: {inquiry.advancePaymentRef}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {formatCurrency(inquiry.totalAmount).replace('₹', '')}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {inquiry.advancePaymentVerified ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400">
                              <XCircle className="w-3 h-3" />
                              Unverified
                            </span>
                          )}
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
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
