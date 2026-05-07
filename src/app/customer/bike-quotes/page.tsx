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
  ChevronDown,
  Send,
  MessageSquare,
  Inbox,
  Timer,
  X,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { formatBookingDuration } from '@/lib/utils/duration';
import CustomerHeader from '@/components/customer/CustomerHeader';

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
  numberOfVehicles?: number;
  pickupAddress?: string;
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

export default function CustomerBikeQuotesPage() {
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
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
    if (filter === 'active' && !['PENDING', 'QUOTES_RECEIVED'].includes(r.status)) return false;
    if (filter === 'booked' && !['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED'].includes(r.status)) return false;
    if (dateFilter !== 'all') {
      const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);
      const created = new Date(r.createdAt);
      if (startDate) { const [sy, sm, sd] = startDate.split('-').map(Number); if (created < new Date(sy, sm - 1, sd)) return false; }
      if (endDate) { const [ey, em, ed] = endDate.split('-').map(Number); if (created > new Date(ey, em - 1, ed, 23, 59, 59)) return false; }
    }
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="animate-spin w-9 h-9 border-4 border-[#09B368] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <CustomerHeader showBackButton backHref="/customer/dashboard" title="Bike Quotes" />

      <main className="pt-16 pb-12">
        {/* Hero */}
        <div className="bg-[#09B368] pt-8 pb-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 75% 50%, #ffffff 0%, transparent 60%)'}} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Bike Rentals
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">My Bike Inquiries</h1>
              <p className="text-white/70 text-sm mt-1">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/bike-on-rent" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#09B368] rounded-xl text-sm font-semibold hover:bg-white/90 transition shadow-sm">
              <Send className="h-4 w-4" />
              New Request
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-5">
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All Requests' },
              { value: 'active', label: 'Active' },
              { value: 'booked', label: 'Booked' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowDateFilter(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  dateFilter !== 'all' ? 'bg-[#09B368]/10 border border-[#09B368]/30 text-[#09B368]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateFilter === 'all' ? 'Date Filter' : dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'this_week' ? 'This Week' : dateFilter === 'last_week' ? 'Last Week' : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'last_month' ? 'Last Month' : 'Custom'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
              </button>
              {dateFilter !== 'all' && (
                <button type="button" onClick={() => { setDateFilter('all'); setCustomStart(''); setCustomEnd(''); }} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            {showDateFilter && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'custom'] as DateFilterKey[]).map((key) => {
                    const label = key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key === 'this_week' ? 'This Week' : key === 'last_week' ? 'Last Week' : key === 'this_month' ? 'This Month' : key === 'last_month' ? 'Last Month' : 'Custom';
                    return (
                      <button key={key} type="button" onClick={() => { setDateFilter(key); if (key !== 'custom') setShowDateFilter(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${dateFilter === key ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>
                    );
                  })}
                </div>
                {dateFilter === 'custom' && (
                  <div className="flex gap-3 pt-1">
                    <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">From</p><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#09B368]/30" /></div>
                    <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">To</p><input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#09B368]/30" /></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Quote Requests</h2>
              <p className="text-xs text-gray-400 mt-0.5">Showing {filteredRequests.length} of {requests.length}</p>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No requests found</h3>
                <p className="text-sm text-gray-500 mb-4">Browse bikes and request a quote to get started</p>
                <Link href="/bike-on-rent" className="inline-flex items-center gap-2 px-4 py-2 bg-[#09B368] text-white rounded-xl text-sm font-semibold hover:bg-[#078F53] transition">
                  <Bike className="w-4 h-4" /> Browse Bikes
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 hidden sm:table-cell">Quotes</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRequests.map((request) => {
                      const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
                      const quotesCount = request.totalQuotesReceived || request.quotes?.length || 0;
                      const lowestQuote = getLowestQuote(request.quotes);
                      return (
                        <tr key={request.id} onClick={() => window.location.href = `/customer/bike-quotes/${request.id}`}
                          className="hover:bg-gray-50/80 group cursor-pointer transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#09B368]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Bike className="w-4 h-4 text-[#09B368]" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {request.vehicleCategoryName || 'Any Bike'}
                                  {request.numberOfVehicles && request.numberOfVehicles > 1 && (
                                    <span className="ml-1 text-xs text-gray-500">× {request.numberOfVehicles}</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">#{request.requestNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex items-start gap-1.5 text-sm text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="block truncate max-w-[180px]">{request.locationName}</span>
                                {request.pickupAddress && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{request.pickupAddress}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-600">
                            {new Date(request.pickupDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                            {' → '}
                            {new Date(request.dropDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right hidden sm:table-cell">
                            {quotesCount > 0 ? (
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{quotesCount} quote{quotesCount !== 1 ? 's' : ''}</p>
                                {lowestQuote && <p className="text-xs text-[#09B368]">From ₹{lowestQuote.toLocaleString()}</p>}
                              </div>
                            ) : <span className="text-xs text-gray-400">Awaiting</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#09B368] transition-colors ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
