'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Car,
  Send,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  IndianRupee,
  Settings2,
  Fuel,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicleCategory?: string;
  transmission?: string;
  fuelType?: string;
  dailyRate: number;
  grandTotal: number;
  advanceAmount: number;
  advancePercent: number;
  kmLimitPerDay?: number;
  extraKmRate?: number;
  status: string;
  validTill: string;
  viewCount: number;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    vehicleCategoryName?: string;
    transmission?: string;
    locationName: string;
    pickupDate: string;
    dropDate: string;
    totalDays: number;
    status: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  wonValue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Edit },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function VendorSelfDriveQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, accepted: 0, wonValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      let status = '';
      if (filter === 'active') status = 'SENT';
      else if (filter === 'accepted') status = 'ACCEPTED';
      else if (filter === 'expired') status = 'EXPIRED';

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/self-drive-quotes?${params}`);
      const data = await response.json();

      if (data.success) {
        const allQuotes = data.quotes || [];
        setQuotes(allQuotes);

        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }

        if (filter === 'all') {
          setStats({
            total: allQuotes.length,
            pending: allQuotes.filter((q: Quote) => ['SENT', 'VIEWED'].includes(q.status)).length,
            accepted: allQuotes.filter((q: Quote) => q.status === 'ACCEPTED').length,
            wonValue: allQuotes.filter((q: Quote) => q.status === 'ACCEPTED').reduce((sum: number, q: Quote) => sum + q.grandTotal, 0),
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentPage, dateFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = quotes.filter((q) => {
    if (filter === 'active') return ['SENT', 'VIEWED'].includes(q.status);
    if (filter === 'accepted') return q.status === 'ACCEPTED';
    if (filter === 'expired') return ['EXPIRED', 'REJECTED', 'WITHDRAWN'].includes(q.status);
    return true;
  });

  const isExpiringSoon = (validTill: string) => {
    if (!validTill) return false;
    const diff = new Date(validTill).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
            <p className="text-gray-600">Self-drive car quotes you&apos;ve sent</p>
          </div>
        </div>

        <Link
          href="/vendor/self-drive/requests"
          className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
        >
          View New Requests
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Quotes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending Response</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          <p className="text-sm text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-orange-100">
          <p className="text-2xl font-bold text-orange-600">
            ₹{stats.wonValue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Won Value</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All Quotes' },
          { value: 'active', label: 'Active' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'expired', label: 'Expired/Rejected' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === f.value
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
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

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {filter !== 'all' ? 'No quotes match this filter' : 'Send quotes from the requests page'}
            </p>
            <Link
              href="/vendor/self-drive/requests"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              View Requests
            </Link>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-700">#{quote.quoteNumber}</span>
                    <span className="text-xs text-gray-500">
                      for {quote.request?.requestNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon(quote.validTill) && quote.status === 'SENT' && (
                      <span className="text-xs text-yellow-600 font-medium">
                        Expiring soon!
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{quote.vehicleName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {quote.vehicleBrand && <span>{quote.vehicleBrand}</span>}
                          {quote.transmission && (
                            <span className="flex items-center gap-1">
                              <Settings2 className="w-3 h-3" />
                              {quote.transmission}
                            </span>
                          )}
                          {quote.fuelType && (
                            <span className="flex items-center gap-1">
                              <Fuel className="w-3 h-3" />
                              {quote.fuelType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{quote.request?.customerName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">
                        ₹{quote.grandTotal.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">₹{quote.dailyRate}/day</p>
                      <p className="text-xs text-gray-500">
                        Valid until {new Date(quote.validTill).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {quote.request?.locationName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      {quote.request?.pickupDate && new Date(quote.request.pickupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' → '}
                      {quote.request?.dropDate && new Date(quote.request.dropDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      <span className="text-orange-600 font-medium">
                        ({quote.request?.totalDays} days)
                      </span>
                    </div>
                    {quote.kmLimitPerDay && (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {quote.kmLimitPerDay} km/day • ₹{quote.extraKmRate}/extra km
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/self-drive/quotes/${quote.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {['SENT', 'VIEWED'].includes(quote.status) && (
                      <button
                        onClick={async () => {
                          if (!confirm('Withdraw this quote?')) return;
                          try {
                            const res = await fetch(`/api/vendor/self-drive-quotes/${quote.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'withdraw' }),
                            });
                            if (res.ok) {
                              fetchQuotes();
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Failed to withdraw quote');
                            }
                          } catch (error) {
                            console.error('Failed to withdraw:', error);
                            alert('Failed to withdraw quote');
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Withdraw
                      </button>
                    )}
                    {quote.status === 'ACCEPTED' && (
                      <Link
                        href={`/vendor/self-drive/bookings?quote=${quote.id}`}
                        className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition flex items-center gap-1"
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
      {filteredQuotes.length > 0 && (
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
