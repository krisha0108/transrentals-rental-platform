'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Send,
  MessageSquare,
  Inbox,
  Timer,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { formatBookingDuration } from '@/lib/utils/duration';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  vehicle_category?: string;
  vehicleCategoryName?: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  helmetsRequired?: number;
  status: string;
  totalQuotesReceived: number;
  quotes: { id: string; grandTotal: number; dailyRate: number }[];
  expiresAt?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Awaiting Quotes', color: 'bg-yellow-100 text-yellow-700', icon: Timer },
  QUOTES_RECEIVED: { label: 'Quotes Available', color: 'bg-green-100 text-green-700', icon: MessageSquare },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  BOOKING_CONFIRMED: { label: 'Booking Confirmed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function CustomerBikeQuotesPage() {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push('/customer/login?redirect=/customer/bike-quotes');
      return;
    }

    fetchRequests();
  }, [authLoading, isAuthenticated, customer]);

  const fetchRequests = async () => {
    try {
      const phone = customer?.phone;
      const email = customer?.email;
      const queryParam = phone ? `phone=${phone}` : `email=${email}`;
      const response = await fetch(`/api/bike-quote-requests?${queryParam}`);
      const data = await response.json();

      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch bike quote requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLowestQuote = (quotes: { grandTotal: number }[]) => {
    if (!quotes || quotes.length === 0) return null;
    return Math.min(...quotes.map((q) => q.grandTotal));
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'active') return ['PENDING', 'QUOTES_RECEIVED'].includes(r.status);
    if (filter === 'booked') return ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'].includes(r.status);
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Bike className="w-8 h-8" />
            <h1 className="text-2xl font-bold">My Bike Inquiries</h1>
          </div>
          <p className="text-emerald-100">Track your quote requests and view vendor quotes</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/bike-on-rent"
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            New Quote Request
          </Link>
          <Link
            href="/customer/dashboard"
            className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition border"
          >
            My Dashboard
          </Link>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Requests' },
            { value: 'active', label: 'Active' },
            { value: 'booked', label: 'Booked' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === f.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No quote requests found</h3>
              <p className="text-sm text-gray-500 mb-4">
                Browse bikes and request a quote to get started
              </p>
              <Link
                href="/bike-on-rent"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Send className="w-4 h-4" />
                Browse Bikes
              </Link>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;
              const quotesCount = request.totalQuotesReceived || request.quotes?.length || 0;
              const hasNewQuotes = request.status === 'QUOTES_RECEIVED' && quotesCount > 0;
              const lowestQuote = getLowestQuote(request.quotes);

              return (
                <Link
                  key={request.id}
                  href={`/customer/bike-quotes/${request.id}`}
                  className="block bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
                >
                  {/* Header */}
                  <div
                    className={`px-4 py-2 flex items-center justify-between ${
                      hasNewQuotes ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-mono text-sm text-gray-700">#{request.requestNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Main Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Bike className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {request.vehicle_modelsName || request.vehicleCategoryName || 'Any Bike'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.vehicleBrand && `${request.vehicleBrand} • `}
                            {formatBookingDuration(request)}
                          </p>
                        </div>
                      </div>

                      {quotesCount > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-gray-900">{quotesCount}</span>
                            <span className="text-sm text-gray-500">
                              {quotesCount === 1 ? 'quote' : 'quotes'}
                            </span>
                          </div>
                          {lowestQuote && (
                            <p className="text-sm text-green-600 font-medium">
                              From ₹{lowestQuote.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Trip Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        {request.locationName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' → '}
                        {new Date(request.dropDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      {request.pickupTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          {request.pickupTime}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    {hasNewQuotes && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          New quotes available! Compare and book.
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-sm">
                          View Quotes <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-yellow-600">
                          Waiting for vendors to respond...
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          View Details <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
