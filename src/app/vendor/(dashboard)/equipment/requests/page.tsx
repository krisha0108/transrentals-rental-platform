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
} from 'lucide-react';
import { EQUIPMENT_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  specificModel?: string;
  quantity: number;
  rentalDuration: number;
  durationUnit: string;
  city: string;
  deliveryAddress?: string;
  startDate: string;
  endDate?: string;
  needOperator?: boolean;
  requirements?: string;
  status: string;
  totalQuotesReceived: number;
  createdAt: string;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string };
}

export default function VendorEquipmentRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const config = EQUIPMENT_CONFIG;

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchRequests();
  }, [sessionStatus, filter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'new' ? 'new' : filter === 'quoted' ? 'quoted' : '';
      const response = await fetch(`/api/vendor/equipment-quote-requests?type=${type}`);
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
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
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
                  <span className="font-mono text-sm text-gray-700">#{request.requestNumber}</span>
                  <span className="text-xs text-gray-500">{getTimeAgo(request.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {request.totalQuotesReceived > 0 && (
                    <span className="text-xs text-gray-500">
                      {request.totalQuotesReceived} quotes received
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${
                    hasQuoted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {hasQuoted ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {hasQuoted ? 'Quoted' : 'New'}
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{request.equipmentType}</h3>
                      <p className="text-sm text-gray-500">{getCategoryName(request.equipmentCategory)}</p>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{request.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded capitalize">
                      {request.rentalDuration} {request.durationUnit?.toLowerCase()}
                    </span>
                    {request.quantity > 1 && (
                      <p className="text-sm text-gray-600 mt-1">Qty: {request.quantity}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Start: {new Date(request.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                  {request.needOperator && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Operator Needed
                    </span>
                  )}
                </div>

                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    {request.deliveryAddress && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Delivery Address</span>
                        <p className="text-sm text-gray-700">{request.deliveryAddress}</p>
                      </div>
                    )}
                    {request.requirements && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Requirements</span>
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

                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === request.id ? 'Less' : 'Details'}
                  </button>
                  {!hasQuoted ? (
                    <Link
                      href={`/vendor/equipment/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/equipment/quotes/${request.myQuote?.id}`}
                      className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Quote
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );})
        )}
      </div>
    </div>
  );
}
