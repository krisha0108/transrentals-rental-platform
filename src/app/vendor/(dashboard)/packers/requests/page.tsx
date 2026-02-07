'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Package,
  Inbox,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Home,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { PACKERS_MOVERS_CONFIG } from '@/lib/quote-services';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  shiftingType: string;
  propertySize: string;
  pickupCity: string;
  dropCity: string;
  pickupAddress: string;
  dropAddress: string;
  pickupFloor: string;
  dropFloor: string;
  hasPickupLift: boolean;
  hasDropLift: boolean;
  preferredDate: string;
  requirements?: string;
  status: string;
  totalQuotesReceived: number;
  createdAt: string;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string };
}

export default function VendorPackersRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const config = PACKERS_MOVERS_CONFIG;

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchRequests();
  }, [sessionStatus, filter, currentPage, dateFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      const type = filter === 'new' ? 'new' : filter === 'quoted' ? 'quoted' : '';
      if (type) params.set('type', type);

      // Pagination params
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // Date filter params
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/packers-quote-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering is done server-side now
  const filteredRequests = requests;

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-gray-600">Packers & Movers inquiries from customers</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'new', label: 'New Requests' },
              { value: 'quoted', label: 'My Quotes' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f.value
                    ? 'bg-white text-blue-600 shadow-sm'
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
              setCurrentPage(1);
            }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No requests found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'new'
                ? 'No new quote requests at the moment'
                : 'No requests match this filter'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const hasQuoted = !!request.myQuote;
            return (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Header */}
              <div className={`px-4 py-2 flex items-center justify-between ${
                hasQuoted ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-700">
                    #{request.requestNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(request.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {request.totalQuotesReceived > 0 && (
                    <span className="text-xs text-gray-500">
                      {request.totalQuotesReceived} quotes received
                    </span>
                  )}
                  {hasQuoted ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Quoted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      New
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {/* Main Info */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      {request.shiftingType === 'office' ? (
                        <Building2 className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Home className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {getCategoryName(request.propertySize)}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {request.shiftingType} Shifting
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {request.pickupCity}
                          <ArrowRight className="w-3 h-3 inline mx-1" />
                          {request.dropCity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Calendar className="w-4 h-4" />
                      {new Date(request.preferredDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Floor Info */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  {request.pickupFloor && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">From:</span>
                      Floor {request.pickupFloor}
                      {request.hasPickupLift && (
                        <span className="text-green-600">(Lift ✓)</span>
                      )}
                    </div>
                  )}
                  {request.dropFloor && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">To:</span>
                      Floor {request.dropFloor}
                      {request.hasDropLift && (
                        <span className="text-green-600">(Lift ✓)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    {request.pickupAddress && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">From Address</span>
                        <p className="text-sm text-gray-700">{request.pickupAddress}</p>
                      </div>
                    )}
                    {request.dropAddress && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">To Address</span>
                        <p className="text-sm text-gray-700">{request.dropAddress}</p>
                      </div>
                    )}
                    {request.requirements && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Special Requirements</span>
                        <p className="text-sm text-gray-700">{request.requirements}</p>
                      </div>
                    )}
                    {request.myQuote && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-xs text-green-600 uppercase tracking-wide">Your Quote</span>
                        <p className="text-sm font-medium text-green-800">
                          ₹{request.myQuote.totalAmount.toLocaleString()} - {request.myQuote.status}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === request.id ? 'Less Details' : 'View Details'}
                  </button>

                  {!hasQuoted ? (
                    <Link
                      href={`/vendor/packers/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/packers/quotes/${request.myQuote?.id}`}
                      className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Your Quote
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );})
        )}
      </div>

      {/* Pagination */}
      {requests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="font-medium text-blue-800 mb-2">Tips for Better Quotes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Consider floor access and lift availability when pricing</li>
          <li>• Be clear about packing material quality</li>
          <li>• Offer insurance options for valuable items</li>
          <li>• Respond quickly - customers compare multiple quotes</li>
        </ul>
      </div>
    </div>
  );
}
