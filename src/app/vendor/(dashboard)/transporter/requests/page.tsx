'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Inbox,
  MapPin,
  Calendar,
  Package as PackageIcon,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  User,
  ArrowRight,
  Weight,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  truckMode: string;
  truckType: string;
  goodsType: string;
  weight: number;
  weightUnit: string;
  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  requirements?: string;
  status: string;
  totalQuotesReceived: number;
  createdAt: string;
  hasQuoted: boolean;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string };
}

export default function VendorTransporterRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const config = TRANSPORTER_CONFIG;

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

  // When using API, the filtering is done server-side, so just use all requests
  const filteredRequests = requests;

  const getTruckTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'mini-truck': 'Mini Truck',
      'tata-ace': 'Tata Ace',
      'tata-407': 'Tata 407',
      'eicher': 'Eicher',
      'trailer': 'Trailer',
      'container': 'Container',
    };
    return typeMap[type] || type || 'Truck';
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
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <p className="text-gray-600">Transport inquiries from customers</p>
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
                  ? 'bg-white text-indigo-600 shadow-sm'
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
                request.hasQuoted ? 'bg-green-50' : 'bg-indigo-50'
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
                  {request.hasQuoted ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Quoted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full flex items-center gap-1">
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
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {getTruckTypeName(request.truckType)}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {request.truckMode || 'Transport'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.goodsType || 'General Goods'}</p>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
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
                    {request.weight && (
                      <div className="flex items-center gap-1 text-indigo-600 font-semibold">
                        <Weight className="w-4 h-4" />
                        {request.weightUnit === 'KG' ? `${request.weight} kg` : `${request.weight} tons`}
                      </div>
                    )}
                   <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                      <Calendar className="w-4 h-4" />
                      {request.pickupDate
                        ? new Date(request.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Date not set'}
                    </div>
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
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
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

                  {!request.hasQuoted ? (
                    <Link
                      href={`/vendor/transporter/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/transporter/quotes/${request.myQuote?.id}`}
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

      {/* Info */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h4 className="font-medium text-indigo-800 mb-2">Tips for Better Quotes</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• Consider distance and fuel costs carefully</li>
          <li>• Account for loading/unloading time</li>
          <li>• Factor in toll charges and permits</li>
          <li>• Be competitive - customers compare multiple quotes</li>
        </ul>
      </div>
    </div>
  );
}
