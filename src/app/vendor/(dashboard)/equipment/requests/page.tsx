'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Wrench,
  Inbox,
  MapPin,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  Building2,
  User,
  Package,
  Truck,
  HardHat,
  Settings,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  FileText,
  RefreshCw,
  XCircle,
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

interface QuoteRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  equipmentCategory: string;
  equipmentType: string;
  equipmentName?: string;
  specificModel?: string;
  quantity: number;
  rentalDuration: number;
  rentalDays: number;
  durationUnit: string;
  city: string;
  deliveryCity: string;
  deliveryAddress?: string;
  siteType?: string;
  startDate: string;
  endDate?: string;
  needOperator?: boolean;
  needDelivery?: boolean;
  needInstallation?: boolean;
  requirements?: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  totalQuotesReceived: number;
  quotesOpenTill?: string;
  expiresAt?: string;
  createdAt: string;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string };
}

export default function VendorEquipmentRequestsPage() {
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

  const config = EQUIPMENT_CONFIG;

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

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);

      const response = await fetch(`/api/vendor/equipment-quote-requests?${params}`);
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

  // Filtering is done server-side
  const filteredRequests = requests;

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

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
            <Inbox className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-gray-600">Equipment rental inquiries</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No requests found</h3>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const hasQuoted = !!request.myQuote;
            return (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${
                hasQuoted ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{request.customerName}</span>
                  <span className="text-xs text-gray-500">{getTimeAgo(request.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {request.totalQuotesReceived > 0 && (
                    <span className="text-xs text-gray-500">
                      {request.totalQuotesReceived} quotes received
                    </span>
                  )}
                  {hasQuoted && request.myQuote?.status === 'EXPIRED' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Quote Expired
                    </span>
                  ) : hasQuoted ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Quoted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      New
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {/* Equipment Info */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {request.equipmentName || EQUIPMENT_TYPE_NAMES[request.equipmentType] || request.equipmentType}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{request.equipmentCategory}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded capitalize">
                      {request.rentalDays || request.rentalDuration} days ({request.durationUnit})
                    </span>
                    {request.quantity > 1 && (
                      <p className="text-sm text-gray-600 mt-1">Qty: {request.quantity}</p>
                    )}
                  </div>
                </div>

                {/* Customer Info Card */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <User className="w-4 h-4 text-blue-500" />
                      {request.customerName}
                    </div>
                    {request.customerPhone && (
                      <a href={`tel:${request.customerPhone}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {request.customerPhone}
                      </a>
                    )}
                    {request.customerEmail && (
                      <a href={`mailto:${request.customerEmail}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Mail className="w-3.5 h-3.5" />
                        {request.customerEmail}
                      </a>
                    )}
                    {request.companyName && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {request.companyName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location, Date & Duration Row */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {request.city}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    {new Date(request.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {request.endDate && (
                      <> — {new Date(request.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}</>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {request.rentalDays || request.rentalDuration} days ({request.durationUnit})
                  </div>
                  {request.quantity > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-gray-400" />
                      Qty: {request.quantity}
                    </div>
                  )}
                </div>

                {/* Service Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.needOperator && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <HardHat className="w-3 h-3" /> Operator Needed
                    </span>
                  )}
                  {request.needDelivery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <Truck className="w-3 h-3" /> Delivery Required
                    </span>
                  )}
                  {request.needInstallation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      <Settings className="w-3 h-3" /> Installation Needed
                    </span>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  className="flex items-center gap-1 text-sm text-amber-600 font-medium hover:text-amber-700 mb-3"
                >
                  {expandedId === request.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expandedId === request.id ? 'Hide Details' : 'View Full Details'}
                </button>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 space-y-4">
                    {/* Delivery Details */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">City:</span>{' '}
                          <span className="font-medium text-gray-900">{request.deliveryCity || request.city}</span>
                        </div>
                        {request.deliveryAddress && (
                          <div>
                            <span className="text-gray-500">Address:</span>{' '}
                            <span className="font-medium text-gray-900">{request.deliveryAddress}</span>
                          </div>
                        )}
                        {request.siteType && (
                          <div>
                            <span className="text-gray-500">Site Type:</span>{' '}
                            <span className="font-medium text-gray-900">{request.siteType}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Budget */}
                    {(request.budgetMin || request.budgetMax) && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Budget</h4>
                        <p className="text-sm font-medium text-gray-900">
                          {request.budgetMin && request.budgetMax
                            ? `₹${request.budgetMin.toLocaleString()} — ₹${request.budgetMax.toLocaleString()}`
                            : request.budgetMin
                            ? `Min ₹${request.budgetMin.toLocaleString()}`
                            : `Max ₹${request.budgetMax!.toLocaleString()}`}
                        </p>
                      </div>
                    )}

                    {/* Quotes Window */}
                    {request.quotesOpenTill && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quotes Open Till</h4>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(request.quotesOpenTill).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {request.requirements && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Special Requirements</h4>
                        <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200">
                          {request.requirements}
                        </p>
                      </div>
                    )}

                    {/* Your Quote */}
                    {request.myQuote && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Your Quote</span>
                        <p className="text-sm font-medium text-green-800 mt-1">
                          ₹{request.myQuote.totalAmount.toLocaleString()} — {request.myQuote.status}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {!hasQuoted ? (
                    <Link
                      href={`/vendor/equipment/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/vendor/equipment/quotes/${request.myQuote?.id}`}
                        className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View Quote
                      </Link>
                      {request.myQuote?.status === 'EXPIRED' && request.status === 'PENDING' && (
                        <Link
                          href={`/vendor/equipment/requests/${request.id}/quote`}
                          className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Resubmit Quote
                        </Link>
                      )}
                    </>
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
    </div>
  );
}
