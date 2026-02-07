'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface Quote {
  id: string;
  quoteNumber: string;
  totalAmount: number;
  packingCharges: number;
  loadingCharges: number;
  transportCharges: number;
  unloadingCharges: number;
  unpackingCharges: number;
  teamSize: number;
  estimatedDays: number;
  status: string;
  validTill: string;
  createdAt: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    shiftingType: string;
    pickupCity: string;
    dropCity: string;
    preferredDate: string;
    status: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
};

export default function VendorPackersQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    fetchQuotes();
  }, [filter, currentPage, dateFilter]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filter !== 'all') params.set('status', filter);

      // Pagination params
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // Date filter params
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/packers-quotes?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.quotes || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to load quotes');
      }
    } catch (err) {
      setError('Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isExpired = (validTill: string) => {
    return new Date(validTill) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === 'SENT' || q.status === 'VIEWED').length,
    accepted: quotes.filter((q) => q.status === 'ACCEPTED').length,
    rejected: quotes.filter((q) => q.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
            <p className="text-gray-600">Track your submitted quotes</p>
          </div>
        </div>

        <Link
          href="/vendor/packers/requests"
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          View Requests
        </Link>
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
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Quotes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          <p className="text-sm text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-100">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All Quotes' },
              { value: 'SENT', label: 'Sent' },
              { value: 'VIEWED', label: 'Viewed' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'REJECTED', label: 'Rejected' },
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

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-sm text-gray-500 mb-4">Your submitted quotes will appear here</p>
            <Link
              href="/vendor/packers/requests"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Quote Requests
            </Link>
          </div>
        ) : (
          quotes.map((quote) => {
            const expired = isExpired(quote.validTill);
            const effectiveStatus = expired && quote.status === 'SENT' ? 'EXPIRED' : quote.status;
            const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      #{quote.quoteNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      for #{quote.request.requestNumber}
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
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{quote.request.customerName}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {quote.request.shiftingType} Shifting
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {quote.request.pickupCity}
                          <ArrowRight className="w-3 h-3" />
                          {quote.request.dropCity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-end">
                        <IndianRupee className="w-5 h-5" />
                        {quote.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Quoted Amount</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Shifting: {new Date(quote.request.preferredDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Quoted: {getTimeAgo(quote.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={expired ? 'text-red-500' : 'text-green-500'}>
                        Valid till: {new Date(quote.validTill).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Service details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Team: {quote.teamSize} members
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Duration: {quote.estimatedDays} day(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/packers/quotes/${quote.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {quote.status === 'ACCEPTED' && (
                      <Link
                        href={`/vendor/packers/bookings`}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View Booking
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
      {quotes.length > 0 && (
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
