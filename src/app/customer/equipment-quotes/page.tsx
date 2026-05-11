'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wrench,
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
  HardHat,
  X,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import CustomerHeader from '@/components/customer/CustomerHeader';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  quantity: number;
  rentalDuration: number;
  durationUnit: string;
  city?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  startDate: string;
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

const EQUIPMENT_NAMES: Record<string, string> = {
  '1': 'Grove Crane',
  '2': 'Truck Mounted Crane',
  '3': 'Tower Crane',
  '4': 'Telescopic Crane',
  '5': 'Rough Terrain Crane',
  '6': 'Overhead Crane',
  '7': 'Bulldozer',
  '8': 'Dumper',
  '9': 'Loader',
  '10': 'Excavator',
  '11': 'Backhoe Loader',
};

export default function CustomerEquipmentQuotesPage() {
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
      router.push('/customer/login?redirect=/customer/equipment-quotes');
      return;
    }

    fetchRequests();
  }, [authLoading, isAuthenticated, customer]);

  const fetchRequests = async () => {
    try {
      const identifier = customer?.phone || customer?.email;
      const response = await fetch(`/api/bookings?type=equipment&phone=${identifier}`);
      const data = await response.json();

      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch equipment quote requests:', error);
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

  const getEquipmentName = (type: string) => {
    return EQUIPMENT_NAMES[type] || type;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <HardHat className="w-8 h-8" />
            <h1 className="text-2xl font-bold">My Equipment Rental Requests</h1>
          </div>
          <p className="text-amber-100">Track your quote requests and compare vendor quotes</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/equipment-rental"
            className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            New Request
          </Link>
          <Link
            href="/customer/equipment-bookings"
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
                  ? 'bg-amber-500 text-white'
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
            <button type="button" onClick={() => setShowDateFilter(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${dateFilter !== 'all' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
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
                  return <button key={key} type="button" onClick={() => { setDateFilter(key); if (key !== 'custom') setShowDateFilter(false); }} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${dateFilter === key ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{label}</button>;
                })}
              </div>
              {dateFilter === 'custom' && (
                <div className="flex gap-3 pt-1">
                  <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">From</p><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300" /></div>
                  <div className="flex-1"><p className="text-xs text-gray-500 font-semibold mb-1">To</p><input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300" /></div>
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
                Submit a request to get quotes from equipment vendors
              </p>
              <Link
                href="/equipment-rental"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
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
                  href={`/customer/equipment-quotes/${request.id}`}
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
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {getEquipmentName(request.equipmentType)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Qty: {request.quantity} • {request.rentalDuration} {request.durationUnit}
                          </p>
                        </div>
                      </div>

                      {request.totalQuotesReceived > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-amber-500" />
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

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{request.deliveryCity || request.city}</div>
                          {request.deliveryAddress && (
                            <p className="text-xs text-gray-500 mt-0.5">{request.deliveryAddress}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        {new Date(request.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {request.rentalDuration} {request.durationUnit}
                      </div>
                    </div>

                    {/* CTA */}
                    {hasNewQuotes && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          New quotes available!
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-medium text-sm">
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
