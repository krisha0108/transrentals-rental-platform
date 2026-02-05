'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Car,
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
  Settings2,
  Fuel,
  Users,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName?: string;
  vehicleType?: string;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  customerName: string;
  customerPhone: string;
  locationId: string;
  locationName: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  isDeliveryRequested: boolean;
  customerNotes?: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  totalQuotesReceived: number;
  quotesOpenTill: string;
  hasQuoted: boolean;
  myQuote?: { id: string; quoteNumber: string; grandTotal: number; status: string };
  createdAt: string;
}

export default function VendorSelfDriveRequestsPage() {
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

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchRequests();
  }, [sessionStatus, filter, currentPage, dateFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'new' ? 'open' : filter === 'quoted' ? 'quoted' : '';
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/self-drive-quote-requests?${params}`);
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

  const filteredRequests = requests;

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
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-gray-600">Self-drive car rental inquiries</p>
          </div>
        </div>

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
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
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
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Header */}
              <div className={`px-4 py-2 flex items-center justify-between ${
                request.hasQuoted ? 'bg-green-50' : 'bg-orange-50'
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
                  {request.hasQuoted ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Quoted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
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
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {request.vehicle_modelsName || request.vehicleCategoryName || request.vehicle_category || 'Any Car'}
                        </h3>
                        {request.vehicleBrand && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {request.vehicleBrand}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{request.locationName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-600 font-semibold">
                      <Calendar className="w-4 h-4" />
                      {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                    </div>
                    {request.budgetMax && (
                      <span className="text-xs text-gray-500">
                        Budget: up to ₹{request.budgetMax.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vehicle Preferences */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.transmission && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      <Settings2 className="w-3 h-3" />
                      {request.transmission}
                    </span>
                  )}
                  {request.fuelType && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                      <Fuel className="w-3 h-3" />
                      {request.fuelType}
                    </span>
                  )}
                  {request.minSeats && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                      <Users className="w-3 h-3" />
                      {request.minSeats}+ seats
                    </span>
                  )}
                  {request.isDeliveryRequested && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                      Delivery Requested
                    </span>
                  )}
                </div>

                {/* Rental Details */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    <span>→</span>
                    {new Date(request.dropDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  {request.pickupTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {request.pickupTime}
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    {request.pickupAddress && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Pickup Address</span>
                        <p className="text-sm text-gray-700">{request.pickupAddress}</p>
                      </div>
                    )}
                    {request.dropAddress && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Drop Address</span>
                        <p className="text-sm text-gray-700">{request.dropAddress}</p>
                      </div>
                    )}
                    {request.customerNotes && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Customer Notes</span>
                        <p className="text-sm text-gray-700">{request.customerNotes}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Customer</span>
                        <p className="text-sm font-medium text-gray-900">{request.customerName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {request.customerPhone}
                        </p>
                      </div>
                    </div>
                    {request.myQuote && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-xs text-green-600 uppercase tracking-wide">Your Quote</span>
                        <p className="text-sm font-medium text-green-800">
                          ₹{request.myQuote.grandTotal.toLocaleString()} - {request.myQuote.status}
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

                  {!request.hasQuoted ? (
                    <Link
                      href={`/vendor/self-drive/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/self-drive/quotes/${request.myQuote?.id}`}
                      className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Your Quote
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Info */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <h4 className="font-medium text-orange-800 mb-2">Tips for Better Quotes</h4>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>Respond quickly - customers often accept the first good quote</li>
          <li>Be clear about km limits and extra charges</li>
          <li>Offer competitive security deposits</li>
          <li>Include delivery charges if customer requests delivery</li>
        </ul>
      </div>
    </div>
  );
}
