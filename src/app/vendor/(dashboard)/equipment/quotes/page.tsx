'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Wrench,
  FileText,
  MapPin,
  Calendar,
  IndianRupee,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface Quote {
  id: string;
  quoteNumber: string;
  totalAmount: number;
  dailyRate: number;
  equipmentModel?: string;
  status: string;
  validTill: string;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    equipmentCategory: string;
    equipmentType: string;
    city: string;
    startDate: string;
    status: string;
  };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  SENT: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Send },
  VIEWED: { label: 'Viewed', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Trash2 },
};

export default function VendorEquipmentQuotesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
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

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchQuotes();
  }, [sessionStatus, filter, currentPage, dateFilter]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      const status = filter === 'all' ? '' : filter === 'active' ? 'SENT' : filter === 'accepted' ? 'ACCEPTED' : '';
      if (status) params.set('status', status);

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/equipment-quotes?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.quotes || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
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

  const isExpiringSoon = (dateString: string) => {
    const diff = new Date(dateString).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  };

  // Stats
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => ['SENT', 'VIEWED'].includes(q.status)).length;
  const acceptedQuotes = quotes.filter((q) => q.status === 'ACCEPTED').length;
  const totalValue = quotes.filter((q) => q.status === 'ACCEPTED').reduce((sum, q) => sum + q.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
            <p className="text-gray-600">Quotes you&apos;ve sent to customers</p>
          </div>
        </div>

        <Link
          href="/vendor/equipment/requests"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-500">Total Quotes</p>
          <p className="text-2xl font-bold text-gray-900">{totalQuotes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-500">Pending Response</p>
          <p className="text-2xl font-bold text-amber-600">{pendingQuotes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{acceptedQuotes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4" />
            Won Value
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'expired', label: 'Expired' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setCurrentPage(1); // Reset to page 1 when filter changes
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
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

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-sm text-gray-500 mb-4">
              You haven&apos;t sent any quotes yet
            </p>
            <Link
              href="/vendor/equipment/requests"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
            >
              <Send className="w-4 h-4" />
              Browse Requests
            </Link>
          </div>
        ) : (
          quotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-700">
                      #{quote.quoteNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(quote.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon(quote.validTill) && quote.status === 'SENT' && (
                      <span className="text-xs text-red-600 font-medium">Expires soon!</span>
                    )}
                    <span className={`px-2 py-0.5 ${statusConfig.bgColor} ${statusConfig.color} text-xs font-medium rounded-full flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {/* Quote Details */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {quote.equipmentModel || quote.request.equipmentType}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {quote.request.equipmentCategory}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Request: #{quote.request.requestNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">
                        ₹{quote.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{quote.dailyRate.toLocaleString()}/day
                      </p>
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      {quote.request.city}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {new Date(quote.request.startDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      Customer: {quote.request.customerName}
                    </div>
                  </div>

                  {/* Valid Till */}
                  <p className="text-xs text-gray-500 mb-4">
                    Valid until: {new Date(quote.validTill).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/equipment/quotes/${quote.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>

                    {['SENT', 'VIEWED'].includes(quote.status) && (
                      <>
                        <button className="px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition">
                          Revise Quote
                        </button>
                        <button className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition">
                          Withdraw
                        </button>
                      </>
                    )}

                    {quote.status === 'ACCEPTED' && (
                      <Link
                        href={`/vendor/equipment/bookings`}
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
      {quotes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Help */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <h4 className="font-medium text-amber-800 mb-2">Quote Status Guide</h4>
        <div className="grid md:grid-cols-3 gap-2 text-sm text-amber-700">
          <div><span className="font-medium">Sent:</span> Customer hasn&apos;t viewed yet</div>
          <div><span className="font-medium">Viewed:</span> Customer is reviewing</div>
          <div><span className="font-medium">Accepted:</span> You won the booking!</div>
        </div>
      </div>
    </div>
  );
}
