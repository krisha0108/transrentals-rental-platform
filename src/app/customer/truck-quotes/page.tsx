'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Truck,
  MapPin,
  Calendar,
  Weight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Send,
  MessageSquare,
  Inbox,
  Package,
  X,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  truckMode: string;
  truckType: string;
  vehicleCategoryName?: string;
  truckBodyType?: string;
  tripDirection?: string;
  goodsType: string;
  goodsDescription?: string;
  weight: number;
  weightUnit: string;
  estimatedWeight?: number;
  estimatedVolume?: string;
  pickupCity: string;
  pickupAddress?: string;
  pickupPincode?: string;
  dropCity: string;
  dropAddress?: string;
  dropPincode?: string;
  preferredDate: string;
  pickupDate?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  requiresPOD?: boolean;
  requiresLabour?: boolean;
  hasMultipleStops?: boolean;
  status: string;
  totalQuotesReceived: number;
  quotes: { id: string; totalAmount: number }[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Awaiting Quotes', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  QUOTES_RECEIVED: { label: 'Quotes Available', color: 'bg-green-100 text-green-700', icon: MessageSquare },
  QUOTE_ACCEPTED: { label: 'Quote Accepted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  BOOKING_CREATED: { label: 'Booking Created', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

type DateFilterKey = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

function getDateRange(key: DateFilterKey, customStart?: string, customEnd?: string): { startDate?: string; endDate?: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (key === 'today') { const s = fmt(today); return { startDate: s, endDate: s }; }
  if (key === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); const s = fmt(y); return { startDate: s, endDate: s }; }
  if (key === 'this_week') { const start = new Date(today); start.setDate(today.getDate() - today.getDay()); return { startDate: fmt(start), endDate: fmt(today) }; }
  if (key === 'last_week') { const start = new Date(today); start.setDate(today.getDate() - today.getDay() - 7); const end = new Date(start); end.setDate(start.getDate() + 6); return { startDate: fmt(start), endDate: fmt(end) }; }
  if (key === 'this_month') { const start = new Date(today.getFullYear(), today.getMonth(), 1); return { startDate: fmt(start), endDate: fmt(today) }; }
  if (key === 'last_month') { const start = new Date(today.getFullYear(), today.getMonth() - 1, 1); const end = new Date(today.getFullYear(), today.getMonth(), 0); return { startDate: fmt(start), endDate: fmt(end) }; }
  if (key === 'custom') { return { startDate: customStart, endDate: customEnd }; }
  return {};
}

function TruckQuotesContent() {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !customer) {
      router.push('/customer/login?redirect=/customer/truck-quotes');
      return;
    }

    submitPendingQuoteThenLoad();
  }, [authLoading, isAuthenticated, customer]);

  // If the customer filled the marketplace Truck form while logged out,
  // their trip was stashed in sessionStorage (see handleTruckSubmit in
  // src/app/marketplace/page.tsx) instead of being lost. Submit it now that
  // we have a real logged-in customer, then jump straight to its detail
  // page instead of showing this list with no sign the request happened —
  // same pattern as the Bus tab's bus-quotes page.
  const submitPendingQuoteThenLoad = async () => {
    const pendingRaw = sessionStorage.getItem('pendingTruckQuote');
    if (!pendingRaw) {
      fetchRequests();
      return;
    }
    sessionStorage.removeItem('pendingTruckQuote');
    try {
      const pending = JSON.parse(pendingRaw);
      const res = await fetch('/api/truck-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pending,
          customerName: customer!.name,
          customerEmail: customer!.email,
          customerPhone: customer!.phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.replace(`/customer/truck-quotes/${data.quoteRequest.id}`);
        return;
      }
    } catch {
      // fall through to the normal list on any failure
    }
    fetchRequests();
  };

  const fetchRequests = async () => {
    try {
      const identifier = customer?.phone || customer?.email;
      const response = await fetch(`/api/bookings?type=truck&phone=${identifier}`);
      const data = await response.json();

      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch truck quote requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'active' && !['PENDING', 'QUOTES_RECEIVED'].includes(r.status)) return false;
    if (filter === 'booked' && !['QUOTE_ACCEPTED', 'BOOKING_CREATED'].includes(r.status)) return false;
    if (dateFilter !== 'all') {
      const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);
      const created = new Date(r.createdAt);
      if (startDate) { const [sy, sm, sd] = startDate.split('-').map(Number); if (created < new Date(sy, sm - 1, sd)) return false; }
      if (endDate) { const [ey, em, ed] = endDate.split('-').map(Number); if (created > new Date(ey, em - 1, ed, 23, 59, 59)) return false; }
    }
    return true;
  });

  const getLowestQuote = (quotes: { totalAmount: number }[]) => {
    if (!quotes || quotes.length === 0) return null;
    return Math.min(...quotes.map(q => q.totalAmount));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-8 h-8" />
            <h1 className="text-2xl font-bold">My Truck Rental Requests</h1>
          </div>
          <p className="text-blue-100">Track your quote requests and compare vendor quotes</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/mini-truck-rental"
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            New Request
          </Link>
          <Link
            href="/customer/truck-bookings"
            className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition border"
          >
            View Bookings
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setShowDateFilter(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${dateFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateFilter === 'all' ? 'Date Filter' : dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'this_week' ? 'This Week' : dateFilter === 'last_week' ? 'Last Week' : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'last_month' ? 'Last Month' : 'Custom'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
            </button>
            {dateFilter !== 'all' && <button type="button" onClick={() => { setDateFilter('all'); setCustomStart(''); setCustomEnd(''); }} className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"><X className="w-3.5 h-3.5" /> Clear</button>}
          </div>
          {showDateFilter && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'custom'] as DateFilterKey[]).map((key) => {
                  const label = key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key === 'this_week' ? 'This Week' : key === 'last_week' ? 'Last Week' : key === 'this_month' ? 'This Month' : key === 'last_month' ? 'Last Month' : 'Custom';
                  return <button key={key} type="button" onClick={() => { setDateFilter(key); if (key !== 'custom') setShowDateFilter(false); }} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${dateFilter === key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{label}</button>;
                })}
              </div>
              {dateFilter === 'custom' && (
                <div className="flex gap-3 pt-1">
                  <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">From</p><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
                  <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">To</p><input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No requests found</h3>
              <p className="text-sm text-gray-500 mb-4">
                Submit a request to get quotes from truck vendors
              </p>
              <Link
                href="/mini-truck-rental"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                Get Quotes
              </Link>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;
              const hasNewQuotes = request.status === 'QUOTES_RECEIVED' && request.totalQuotesReceived > 0;
              const lowestQuote = getLowestQuote(request.quotes);

              return (
                <Link
                  key={request.id}
                  href={`/customer/truck-quotes/${request.id}`}
                  className="block bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className={`px-4 py-2 flex items-center justify-between ${
                    hasNewQuotes ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <span className="font-mono text-sm text-gray-700">
                      #{request.requestNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Main Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {request.truckMode === 'personal' ? 'Personal' : 'Commercial'} Transport
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.truckType} • {request.goodsType}
                          </p>
                        </div>
                      </div>

                      {request.totalQuotesReceived > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="font-bold text-gray-900">{request.totalQuotesReceived}</span>
                            <span className="text-sm text-gray-500">quotes</span>
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
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{request.pickupCity} → {request.dropCity}</div>
                          {(request.pickupAddress || request.dropAddress) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {request.pickupAddress && <span>{request.pickupAddress}</span>}
                              {request.pickupAddress && request.dropAddress && <span> → </span>}
                              {request.dropAddress && <span>{request.dropAddress}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(request.preferredDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {request.weight && (
                        <div className="flex items-center gap-1.5">
                          <Weight className="w-4 h-4 text-blue-500" />
                          {request.weight} {request.weightUnit}
                        </div>
                      )}
                    </div>

                    {/* Extended truck attribute chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {request.truckBodyType && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {(() => {
                            const m: Record<string, string> = {
                              OPEN: 'Open Truck',
                              CLOSED_BODY: 'Closed Body',
                              CONTAINER: 'Container',
                              TRAILER: 'Trailer',
                              LCV: 'LCV',
                              REFRIGERATED: 'Refrigerated',
                              FLATBED: 'Flatbed',
                              OTHER: 'Other',
                            };
                            return m[request.truckBodyType!] || request.truckBodyType;
                          })()}
                        </span>
                      )}
                      {request.tripDirection && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {request.tripDirection === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                        </span>
                      )}
                      {request.requiresLabour && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Labour
                        </span>
                      )}
                      {request.hasMultipleStops && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                          Multi-stop
                        </span>
                      )}
                      {request.requiresPOD && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                          POD
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    {hasNewQuotes && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          New quotes available!
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                          View Quotes <ChevronRight className="w-4 h-4" />
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

export default function CustomerTruckQuotesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TruckQuotesContent />
    </Suspense>
  );
}
