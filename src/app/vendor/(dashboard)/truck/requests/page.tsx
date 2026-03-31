'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Inbox,
  MapPin,
  Calendar,
  Clock,
  Package,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  User,
  Weight,
  Users,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  goodsType: string;
  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  requiresLabour: boolean;
  labourCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: string;
  totalQuotesReceived: number;
  createdAt: string;
  hasQuoted: boolean;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string };
}

const SERVICE_TYPES: Record<string, string> = {
  'local-shifting': 'Local Shifting',
  'intercity': 'Intercity Transport',
  'commercial': 'Commercial Goods',
};

const GOODS_TYPES: Record<string, string> = {
  'household': 'Household Items',
  'commercial': 'Commercial Goods',
  'industrial': 'Industrial Equipment',
  'fragile': 'Fragile Items',
  'machinery': 'Heavy Machinery',
};

export default function VendorTruckRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchRequests();
  }, [sessionStatus, filter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'new' ? 'open' : filter === 'quoted' ? 'quoted' : '';
      const response = await fetch(`/api/vendor/truck-quote-requests?type=${type}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
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
            <p className="text-gray-600">Truck rental inquiries from customers</p>
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
              onClick={() => setFilter(f.value)}
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
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
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
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Header */}
              <div className={`px-4 py-2 flex items-center justify-between ${
                request.hasQuoted ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{request.customerName}</span>
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
                  {request.hasQuoted && request.myQuote?.status === 'EXPIRED' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Quote Expired
                    </span>
                  ) : request.hasQuoted ? (
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
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {request.chauffeur_vehicle_categories}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {SERVICE_TYPES[request.serviceType] || request.serviceType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {request.pickupCity} → {request.dropCity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Package className="w-4 h-4" />
                      {GOODS_TYPES[request.goodsType] || request.goodsType}
                    </div>
                    {request.budgetMax && (
                      <p className="text-sm text-gray-500">
                        Budget: ₹{request.budgetMin?.toLocaleString()} - ₹{request.budgetMax?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trip Details */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  {request.requiresLabour && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      {request.labourCount || 0} labour required
                    </div>
                  )}
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
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
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

                  {!request.hasQuoted ? (
                    <Link
                      href={`/vendor/truck/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/vendor/truck/quotes/${request.myQuote?.id}`}
                        className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View Your Quote
                      </Link>
                      {request.myQuote?.status === 'EXPIRED' && request.status === 'PENDING' && (
                        <Link
                          href={`/vendor/truck/requests/${request.id}/quote`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
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
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="font-medium text-blue-800 mb-2">Tips for Better Quotes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Respond quickly - customers often accept the first good quote</li>
          <li>• Include loading/unloading charges if applicable</li>
          <li>• Be clear about toll and permit charges</li>
          <li>• Mention insurance coverage if available</li>
        </ul>
      </div>
    </div>
  );
}
