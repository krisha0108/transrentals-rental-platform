'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Bus,
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
  User,
  Users,
  RefreshCw,
  XCircle,
  Search,
  MessageCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { BUS_CATEGORIES, BUS_TRIP_TYPES } from '@/lib/bus-categories';
import Pagination from '@/components/vendor/Pagination';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName?: string;
  passengers: number;
  pickupCity: string;
  dropCity?: string;
  pickupDate: string;
  returnDate?: string;
  pickupTime?: string;
  routeDetails?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  requirements?: string;
  status: string;
  totalQuotesReceived: number;
  createdAt: string;
  hasQuoted: boolean;
  myQuote?: { id: string; quoteNumber: string; totalAmount: number; status: string; bookingId?: string | null; bookingNumber?: string | null };
}

type DateFilterKey = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

function getDateRange(key: DateFilterKey, customStart?: string, customEnd?: string): { startDate?: string; endDate?: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (key === 'today') { const s = fmt(today); return { startDate: s, endDate: s }; }
  if (key === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); const s = fmt(y); return { startDate: s, endDate: s }; }
  if (key === 'this_week') { const start = new Date(today); start.setDate(today.getDate() - today.getDay()); return { startDate: fmt(start), endDate: fmt(today) }; }
  if (key === 'last_week') { const start = new Date(today); start.setDate(today.getDate() - today.getDay() - 7); const end = new Date(start); end.setDate(start.getDate() + 6); return { startDate: fmt(start), endDate: fmt(end) }; }
  if (key === 'this_month') { const start = new Date(today.getFullYear(), today.getMonth(), 1); return { startDate: fmt(start), endDate: fmt(today) }; }
  if (key === 'last_month') { const start = new Date(today.getFullYear(), today.getMonth() - 1, 1); const end = new Date(today.getFullYear(), today.getMonth(), 0); return { startDate: fmt(start), endDate: fmt(end) }; }
  if (key === 'custom') { return { startDate: customStart, endDate: customEnd }; }
  return {};
}

/* ── Urgency helper ── */
function getUrgency(pickupDate: string): { label: string; color: string; urgent: boolean } {
  const diff = new Date(pickupDate).getTime() - Date.now();
  const hours = diff / 3600000;
  if (hours < 0) return { label: 'Started', color: 'text-gray-400', urgent: false };
  if (hours < 3) return { label: `In ${Math.ceil(hours)}h`, color: 'text-red-600', urgent: true };
  if (hours < 12) return { label: `In ${Math.ceil(hours)}h`, color: 'text-red-600', urgent: true };
  if (hours < 24) return { label: 'Tomorrow', color: 'text-amber-600', urgent: false };
  const days = Math.ceil(hours / 24);
  return { label: `In ${days}d`, color: 'text-gray-500', urgent: false };
}

function getTripDuration(req: QuoteRequest): string {
  if (!req.returnDate) return 'One way';
  const days = Math.max(1, Math.ceil((new Date(req.returnDate).getTime() - new Date(req.pickupDate).getTime()) / 86400000));
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function getTripExactHours(req: QuoteRequest): string | null {
  if (!req.returnDate) return null;
  const diffMs = new Date(req.returnDate).getTime() - new Date(req.pickupDate).getTime();
  if (diffMs <= 0) return null;
  const totalHours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  return mins > 0 ? `${totalHours}h ${mins}m` : `${totalHours}h`;
}

export default function VendorBusRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;
    fetchRequests();
  }, [sessionStatus, filter, currentPage, searchQuery, dateFilter, customStart, customEnd]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const type = filter === 'new' ? 'open' : filter === 'quoted' ? 'quoted' : '';
      if (type) params.set('type', type);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (searchQuery) params.set('search', searchQuery);
      const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/vendor/bus-quote-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
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

  const getCategoryName = (id: string) =>
    BUS_CATEGORIES.find((c) => c.id === id)?.shortName || id;

  const getTripTypeName = (id: string) =>
    BUS_TRIP_TYPES.find((t) => t.id === id)?.name || id;

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const selected = useMemo(
    () => filteredRequests.find((r) => r.id === selectedId) ?? null,
    [filteredRequests, selectedId]
  );

  // Counts only valid for the currently active filter (API returns filtered list).
  // Show totalItems on the active tab; hide counts for inactive tabs.
  const activeCount = totalItems;

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-gray-200/60 bg-white shadow-sm">
        <div className="w-full lg:w-[360px] border-r border-gray-100 p-4 space-y-3 animate-pulse">
          <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg" />)}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-gray-200/60 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">

      {/* ══════════ LEFT PANEL — Request List ══════════ */}
      <div className={`w-full lg:w-[360px] xl:w-[400px] shrink-0 border-r border-gray-100 flex flex-col bg-[#fafbfc] ${selected ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header */}
        <div className="p-4 pb-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Quote Requests</h1>
                <p className="text-[11px] text-gray-400">{filteredRequests.length} requests</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput); setCurrentPage(1); } }}
                placeholder="Search requests..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
              className="px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center gap-1 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {[
              { value: 'new',    label: 'Open',   activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25' },
              { value: 'quoted', label: 'Quoted', activeColor: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' },
              { value: 'all',    label: 'All',    activeColor: 'bg-gray-800 text-white shadow-md' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setCurrentPage(1); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  filter === f.value
                    ? f.activeColor
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {f.label}
                {filter === f.value && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/25 text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDateFilter(v => !v)}
                className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  dateFilter !== 'all'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>{dateFilter === 'all' ? 'Filter by date' : dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'this_week' ? 'This Week' : dateFilter === 'last_week' ? 'Last Week' : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'last_month' ? 'Last Month' : 'Custom Range'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
              </button>
              {dateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => { setDateFilter('all'); setCustomStart(''); setCustomEnd(''); }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showDateFilter && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { key: 'today', label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: 'this_week', label: 'This Week' },
                    { key: 'last_week', label: 'Last Week' },
                    { key: 'this_month', label: 'This Month' },
                    { key: 'last_month', label: 'Last Month' },
                    { key: 'custom', label: 'Custom' },
                  ] as { key: DateFilterKey; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setDateFilter(key); setCurrentPage(1); if (key !== 'custom') setShowDateFilter(false); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        dateFilter === key
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {dateFilter === 'custom' && (
                  <div className="flex gap-2 pt-1">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">From</p>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => { setCustomStart(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">To</p>
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart}
                        onChange={(e) => { setCustomEnd(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No requests found</p>
              <p className="text-xs text-gray-400 mt-1">
                {filter === 'new' ? 'No new requests at the moment' : 'No requests match this filter'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isSelected = selectedId === req.id;
              const urgency = getUrgency(req.pickupDate);
              const catName = req.vehicleCategoryName || getCategoryName(req.chauffeur_vehicle_categories);
              const route = req.pickupCity + (req.dropCity ? ` → ${req.dropCity}` : '');
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left rounded-xl transition-all duration-150 overflow-hidden ${
                    isSelected
                      ? 'bg-white shadow-md ring-1 ring-emerald-200'
                      : 'bg-transparent hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex">
                    {/* Left accent bar */}
                    <div className={`w-1 shrink-0 rounded-l-xl ${isSelected ? 'bg-emerald-500' : req.hasQuoted ? 'bg-emerald-400' : 'bg-emerald-300'}`} />

                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Vehicle name */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {catName}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />{req.passengers}
                            </span>
                          </div>

                          {/* Route */}
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {route}
                          </p>

                          {/* Date + Duration */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(req.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {getTripDuration(req)}
                            </span>
                          </div>

                          {/* Customer + Price row */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" /> {req.customerName}
                            </span>
                            {req.myQuote && (
                              <>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-[11px] font-bold text-emerald-600">₹{req.myQuote.totalAmount.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right meta */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400">{getTimeAgo(req.createdAt)}</span>
                          {req.hasQuoted && req.myQuote?.status === 'EXPIRED' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-200 flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" />EXPIRED
                            </span>
                          ) : req.hasQuoted ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">QUOTED</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">NEW</span>
                          )}
                          {urgency.urgent && (
                            <span className={`text-[9px] font-bold ${urgency.color} flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200`}>
                              <Zap className="w-2.5 h-2.5" />{urgency.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={20}
              onPageChange={(page) => setCurrentPage(page)}
              compact
            />
          </div>
        )}
      </div>

      {/* ══════════ RIGHT PANEL — Request Detail ══════════ */}
      <div className={`flex-1 flex flex-col bg-white ${selected ? 'flex' : 'hidden lg:flex'}`}>
        {selected ? (
          <>
            {/* ── Detail Header (sticky) ── */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="lg:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg">🚌</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900">
                        {selected.vehicleCategoryName || getCategoryName(selected.chauffeur_vehicle_categories)}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                        {getTripTypeName(selected.tripType)}
                      </span>
                      {selected.hasQuoted && selected.myQuote?.status === 'EXPIRED' ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold flex items-center gap-1 border border-red-200">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : selected.hasQuoted ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Quoted
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                          <AlertCircle className="w-3 h-3" /> New
                        </span>
                      )}
                      {(() => {
                        const u = getUrgency(selected.pickupDate);
                        return u.urgent ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 bg-red-50 border border-red-200 ${u.color}`}>
                            <Zap className="w-3 h-3" /> {u.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-semibold text-gray-500">#{selected.requestNumber}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selected.pickupCity}
                        {selected.dropCity && <><ArrowRight className="w-2.5 h-2.5" />{selected.dropCity}</>}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>{getTimeAgo(selected.createdAt)}</span>
                      {selected.totalQuotesReceived > 0 && (
                        <><span className="text-gray-300">·</span><span>{selected.totalQuotesReceived} quotes</span></>
                      )}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                {!selected.hasQuoted ? (
                  <Link
                    href={`/vendor/bus/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Send Quote
                  </Link>
                ) : selected.myQuote?.status === 'EXPIRED' ? (
                  <Link
                    href={`/vendor/bus/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resubmit Quote
                  </Link>
                ) : (
                  <Link
                    href={`/vendor/bus/quotes/${selected.myQuote?.id}`}
                    className="hidden sm:flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Quote
                  </Link>
                )}
              </div>
            </div>

            {/* ── Detail Content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Urgency banner */}
              {(() => {
                const urgency = getUrgency(selected.pickupDate);
                if (urgency.urgent) {
                  return (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <Zap className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm font-semibold text-red-700">
                        Pickup starts {urgency.label.toLowerCase()} — respond quickly to win this booking!
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Section 1: Trip details */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trip Details</h3>

                <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Passengers</span>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-700">{selected.passengers}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pickup</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(selected.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {selected.pickupTime && <p className="text-[11px] text-gray-400 mt-0.5">{selected.pickupTime}</p>}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Return</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {selected.returnDate
                        ? new Date(selected.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'One way'}
                    </p>
                  </div>
                </div>

                {/* Secondary info row */}
                <div className="flex flex-wrap gap-2.5">
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Route</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selected.pickupCity}{selected.dropCity && ` → ${selected.dropCity}`}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Duration</p>
                      <p className="text-sm font-bold text-gray-900">{getTripDuration(selected)}</p>
                      {(() => { const h = getTripExactHours(selected); return h ? <p className="text-[11px] text-gray-400 mt-0.5">{h}</p> : null; })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Customer Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600">
                      {selected.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selected.customerName}</p>
                      {selected.customerPhone && <p className="text-xs text-gray-400">{selected.customerPhone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.customerPhone && (
                      <>
                        <a
                          href={`tel:${selected.customerPhone}`}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${selected.customerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </>
                    )}
                    {selected.customerEmail && (
                      <a
                        href={`mailto:${selected.customerEmail}`}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Route Details */}
              {selected.routeDetails && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Route Details</h3>
                  <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{selected.routeDetails}</p>
                  </div>
                </div>
              )}

              {/* Section 4: Special Requirements */}
              {selected.requirements && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Special Requirements</h3>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{selected.requirements}</p>
                  </div>
                </div>
              )}

              {/* Section 5: Your Quote (if quoted) */}
              {selected.myQuote && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Quote</h3>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">{selected.myQuote.quoteNumber}</p>
                        <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">₹{selected.myQuote.totalAmount.toLocaleString()}</p>
                        <p className="text-xs mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selected.myQuote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                            selected.myQuote.status === 'REJECTED' || selected.myQuote.status === 'EXPIRED' ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {selected.myQuote.status === 'ACCEPTED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {selected.myQuote.status}
                          </span>
                          {selected.myQuote.bookingNumber && (
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Bkg #{selected.myQuote.bookingNumber}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Link
                          href={`/vendor/bus/quotes/${selected.myQuote.id}`}
                          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Quote
                        </Link>
                        {selected.myQuote.bookingId && (
                          <Link
                            href={`/vendor/bus/bookings/${selected.myQuote.bookingId}`}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Booking
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No response signal + Tips for new requests */}
              {!selected.hasQuoted && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">You haven&apos;t quoted yet</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {selected.totalQuotesReceived > 0
                          ? `${selected.totalQuotesReceived} other vendor${selected.totalQuotesReceived > 1 ? 's' : ''} already quoted — act fast!`
                          : 'Be the first to quote and increase your chances!'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-gray-500 mb-1.5">💡 Quick Tips</p>
                    <ul className="text-[11px] text-gray-400 space-y-0.5">
                      <li>Respond quickly — first good quote usually wins</li>
                      <li>Be clear about inclusions (driver, fuel, tolls)</li>
                      <li>Competitive pricing gets more conversions</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky CTA Bar (mobile) ── */}
            <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
              {!selected.hasQuoted ? (
                <Link
                  href={`/vendor/bus/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" /> Send Quote
                </Link>
              ) : selected.myQuote?.status === 'EXPIRED' ? (
                <Link
                  href={`/vendor/bus/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" /> Resubmit Quote
                </Link>
              ) : (
                <Link
                  href={`/vendor/bus/quotes/${selected.myQuote?.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4" /> View Your Quote
                </Link>
              )}
            </div>
          </>
        ) : (
          /* Empty state — no selection */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-emerald-300" />
            </div>
            <p className="text-gray-500 font-semibold">Select a request</p>
            <p className="text-gray-400 text-sm mt-1">Choose a request from the list to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
