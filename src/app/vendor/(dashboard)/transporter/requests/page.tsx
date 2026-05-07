'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import TruckRequestDetails from '@/components/truck/TruckRequestDetails';
import {
  Truck,
  Inbox,
  MapPin,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  User,
  ArrowRight,
  Weight,
  RefreshCw,
  XCircle,
  Search,
  MessageCircle,
  X,
  ArrowLeft,
  Zap,
  Package as PackageIcon,
  ChevronDown,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';
import VendorCallButton from '@/components/vendor/VendorCallButton';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  truckMode: string;
  truckType: string;
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
  pickupDate: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  requirements?: string;
  requiresLabour?: boolean;
  labourCount?: number;
  hasMultipleStops?: boolean;
  multipleStopsDetails?: string;
  receiverName?: string;
  receiverPhone?: string;
  requiresPOD?: boolean;
  isFlexibleDate?: boolean;
  needInsurance?: boolean;
  needPackaging?: boolean;
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

export default function VendorTransporterRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');

  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const handleSearch = () => { setCommittedSearch(searchInput); };
  const handleClearSearch = () => { setSearchInput(''); setCommittedSearch(''); };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;
    fetchRequests();
  }, [sessionStatus, filter, committedSearch, dateFilter, customStart, customEnd]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const type = filter === 'new' ? 'open' : filter === 'quoted' ? 'quoted' : filter === 'cancelled' ? 'cancelled' : '';
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (committedSearch) params.set('search', committedSearch);
      const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await fetch(`/api/vendor/truck-quote-requests?${params}`);
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

  const filteredRequests = requests;

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const selected = useMemo(() => filteredRequests.find(r => r.id === selectedId) ?? null, [filteredRequests, selectedId]);

  const newCount = filteredRequests.filter(r => !r.hasQuoted).length;
  const quotedCount = filteredRequests.filter(r => r.hasQuoted).length;
  const cancelledCount = filteredRequests.filter(r => r.status === 'CANCELLED').length;

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-gray-200/60 bg-white shadow-sm">
        <div className="w-full lg:w-[360px] border-r border-gray-100 p-4 space-y-3 animate-pulse">
          <div className="h-8 bg-gray-100 rounded-lg w-2/3" />
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg" />)}
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
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
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Quote Requests</h1>
                <p className="text-[11px] text-gray-400">{filteredRequests.length} requests</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-3 flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search by name, city, request #..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="shrink-0 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {[
              { value: 'new',       label: 'New',       count: newCount,                   activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25' },
              { value: 'quoted',    label: 'Quoted',    count: quotedCount,                activeColor: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' },
              { value: 'all',       label: 'All',       count: filteredRequests.length,    activeColor: 'bg-gray-800 text-white shadow-md' },
              { value: 'cancelled', label: 'Cancelled', count: filter === 'cancelled' ? filteredRequests.length : 0, activeColor: 'bg-red-600 text-white shadow-md shadow-red-500/25' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  filter === f.value
                    ? f.activeColor
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.value ? 'bg-white/25 text-white' : 'bg-gray-200/60 text-gray-400'
                }`}>{f.count}</span>
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
                      onClick={() => { setDateFilter(key); if (key !== 'custom') setShowDateFilter(false); }}
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
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">To</p>
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart}
                        onChange={(e) => setCustomEnd(e.target.value)}
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
                    <div className={`w-1 shrink-0 rounded-l-xl ${req.status === 'CANCELLED' ? 'bg-red-400' : isSelected ? 'bg-emerald-600' : req.hasQuoted ? 'bg-emerald-400' : 'bg-emerald-300'}`} />

                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Truck type */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {getTruckTypeName(req.truckType)}
                            </span>
                            {req.truckMode && (
                              <span className="text-[10px] text-gray-400 shrink-0 capitalize">{req.truckMode}</span>
                            )}
                          </div>

                          {/* Route */}
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {req.pickupCity} <ArrowRight className="w-2.5 h-2.5 inline" /> {req.dropCity}
                          </p>

                          {/* Date + Weight */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {req.pickupDate
                                ? new Date(req.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : 'No date'}
                            </span>
                            {req.weight ? (
                              <>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                  <Weight className="w-3 h-3" />
                                  {req.weightUnit === 'KG' ? `${req.weight} kg` : `${req.weight} t`}
                                </span>
                              </>
                            ) : null}
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
                          {req.status === 'CANCELLED' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-200 flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" />CANCELLED
                            </span>
                          ) : req.hasQuoted && req.myQuote?.status === 'EXPIRED' ? (
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
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900">
                        {getTruckTypeName(selected.truckType)}
                      </h2>
                      {selected.truckMode && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium capitalize">{selected.truckMode}</span>
                      )}
                      {selected.status === 'CANCELLED' ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold flex items-center gap-1 border border-red-200">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      ) : selected.hasQuoted && selected.myQuote?.status === 'EXPIRED' ? (
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
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.pickupCity} → {selected.dropCity}</span>
                      <span className="text-gray-300">·</span>
                      <span>{getTimeAgo(selected.createdAt)}</span>
                      {selected.totalQuotesReceived > 0 && (
                        <><span className="text-gray-300">·</span><span>{selected.totalQuotesReceived} quotes</span></>
                      )}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                {selected.status === 'CANCELLED' ? (
                  <span className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-500 border border-red-200">
                    <XCircle className="w-4 h-4" /> Cancelled
                  </span>
                ) : !selected.hasQuoted ? (
                  <Link
                    href={`/vendor/transporter/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Send Quote
                  </Link>
                ) : selected.myQuote?.status === 'EXPIRED' && selected.status === 'PENDING' ? (
                  <Link
                    href={`/vendor/transporter/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resubmit Quote
                  </Link>
                ) : (
                  <Link
                    href={`/vendor/transporter/quotes/${selected.myQuote?.id}`}
                    className="hidden sm:flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Quote
                  </Link>
                )}
              </div>
            </div>

            {/* ── Detail Content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Cancellation banner */}
              {selected.status === 'CANCELLED' && (
                <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-100/60 border-b border-red-200">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-sm font-bold text-red-800">Request Cancelled by Customer</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-red-700">The customer cancelled this quote request. Your submitted quote is no longer active.</p>
                  </div>
                </div>
              )}

              {/* Urgency banner */}
              {selected.status !== 'CANCELLED' && (() => {
                const urgency = getUrgency(selected.pickupDate);
                if (urgency.urgent) {
                  return (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <Zap className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm font-semibold text-red-700">
                        Pickup starts {urgency.label.toLowerCase()} — respond quickly to win this load!
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Section 1: Trip Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Trip Details</h3>

                <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                      <Weight className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Weight</span>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-700">
                      {selected.weight
                        ? selected.weightUnit === 'KG' ? `${selected.weight} kg` : `${selected.weight} t`
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pickup</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{selected.pickupCity}</p>
                    {selected.pickupAddress && <p className="text-xs text-gray-500 mt-0.5 truncate">{selected.pickupAddress}</p>}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Drop</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{selected.dropCity}</p>
                    {selected.dropAddress && <p className="text-xs text-gray-500 mt-0.5 truncate">{selected.dropAddress}</p>}
                  </div>
                </div>

                {/* Secondary info row */}
                <div className="flex flex-wrap gap-2.5">
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pickup Date</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selected.pickupDate
                          ? new Date(selected.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Goods Type</p>
                      <p className="text-sm font-bold text-gray-900">{selected.goodsType || 'General Goods'}</p>
                    </div>
                  </div>
                </div>

                {/* Truck attribute chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selected.truckBodyType && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {(() => {
                        const m: Record<string, string> = {
                          OPEN: 'Open Truck', CLOSED_BODY: 'Closed Body', CONTAINER: 'Container',
                          TRAILER: 'Trailer', LCV: 'LCV', REFRIGERATED: 'Refrigerated',
                          FLATBED: 'Flatbed', OTHER: 'Other',
                        };
                        return m[selected.truckBodyType!] || selected.truckBodyType;
                      })()}
                    </span>
                  )}
                  {selected.tripDirection && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {selected.tripDirection === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                    </span>
                  )}
                  {selected.requiresLabour && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      Labour Needed{selected.labourCount ? ` (${selected.labourCount})` : ''}
                    </span>
                  )}
                  {selected.hasMultipleStops && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                      Multi-stop
                    </span>
                  )}
                  {selected.requiresPOD && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                      POD Required
                    </span>
                  )}
                  {selected.estimatedVolume && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-50 text-gray-700 border border-gray-100">
                      Volume: {selected.estimatedVolume}
                    </span>
                  )}
                </div>

                {/* Full quotation details */}
                <div className="mt-4">
                  <TruckRequestDetails data={selected as any} hideVehicle={true} />
                </div>
              </div>

              {/* Section 2: Customer */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {selected.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selected.customerName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.customerPhone && (
                      <>
                        <VendorCallButton phone={selected.customerPhone} bookingType="truck_quote_request" bookingId={selected.id} variant="blue" />
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

              {/* Section 3: Special Requirements */}
              {selected.requirements && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Special Requirements</h3>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{selected.requirements}</p>
                  </div>
                </div>
              )}

              {/* Section 4: Your Quote */}
              {selected.myQuote && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Quote</h3>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-xs text-emerald-600 font-medium">{selected.myQuote.quoteNumber}</p>
                          {selected.myQuote.bookingNumber && (
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Bkg #{selected.myQuote.bookingNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">₹{selected.myQuote.totalAmount.toLocaleString()}</p>
                        <p className="text-xs mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selected.myQuote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                            selected.myQuote.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {selected.myQuote.status === 'ACCEPTED' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {selected.myQuote.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link
                          href={`/vendor/transporter/quotes/${selected.myQuote.id}`}
                          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Quote
                        </Link>
                        {selected.myQuote.bookingId && (
                          <Link
                            href={`/vendor/transporter/bookings/${selected.myQuote.bookingId}`}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-all active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> View Booking
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips for new requests */}
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
                      <li>Consider distance and fuel costs carefully</li>
                      <li>Account for loading/unloading time</li>
                      <li>Factor in toll charges and permits</li>
                      <li>Be competitive — customers compare multiple quotes</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky CTA Bar (mobile) ── */}
            <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
              {!selected.hasQuoted ? (
                <Link
                  href={`/vendor/transporter/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" /> Send Quote
                </Link>
              ) : selected.myQuote?.status === 'EXPIRED' && selected.status === 'PENDING' ? (
                <Link
                  href={`/vendor/transporter/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" /> Resubmit Quote
                </Link>
              ) : (
                <Link
                  href={`/vendor/transporter/quotes/${selected.myQuote?.id}`}
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
