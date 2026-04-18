'use client';

import { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  XCircle,
  Search,
  MessageCircle,
  X,
  ArrowLeft,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { EQUIPMENT_CONFIG } from '@/lib/quote-services';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

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

/* ── Urgency helper ── */
function getUrgency(startDate: string): { label: string; color: string; urgent: boolean } {
  const diff = new Date(startDate).getTime() - Date.now();
  const hours = diff / 3600000;
  if (hours < 0) return { label: 'Started', color: 'text-gray-400', urgent: false };
  if (hours < 3) return { label: `In ${Math.ceil(hours)}h`, color: 'text-red-600', urgent: true };
  if (hours < 12) return { label: `In ${Math.ceil(hours)}h`, color: 'text-red-600', urgent: true };
  if (hours < 24) return { label: 'Tomorrow', color: 'text-emerald-600', urgent: false };
  const days = Math.ceil(hours / 24);
  return { label: `In ${days}d`, color: 'text-gray-500', urgent: false };
}

const getEquipmentName = (req: QuoteRequest) =>
  req.equipmentName || EQUIPMENT_TYPE_NAMES[req.equipmentType] || req.equipmentType;

export default function VendorEquipmentRequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;
    fetchRequests();
  }, [sessionStatus, filter, currentPage, dateFilter, debouncedSearch]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const type = filter === 'new' ? 'new' : filter === 'quoted' ? 'quoted' : '';
      if (type) params.set('type', type);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/vendor/equipment-quote-requests?${params}`);
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

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const selected = useMemo(() => filteredRequests.find(r => r.id === selectedId) ?? null, [filteredRequests, selectedId]);
  const newCount = filteredRequests.filter(r => !r.myQuote).length;
  const quotedCount = filteredRequests.filter(r => !!r.myQuote).length;

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
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Quote Requests</h1>
                <p className="text-[11px] text-gray-400">{filteredRequests.length} requests</p>
              </div>
            </div>
            <DateFilterDropdown
              onFilterChange={(start, end) => {
                setDateFilter({ start, end });
                setCurrentPage(1);
              }}
              initialStartDate={dateFilter.start || undefined}
              initialEndDate={dateFilter.end || undefined}
            />
          </div>

          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {[
              { value: 'new',    label: 'New',    count: newCount,                  activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25' },
              { value: 'quoted', label: 'Quoted', count: quotedCount,               activeColor: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' },
              { value: 'all',    label: 'All',    count: filteredRequests.length,   activeColor: 'bg-gray-800 text-white shadow-md' },
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.value ? 'bg-white/25 text-white' : 'bg-gray-200/60 text-gray-400'
                }`}>{f.count}</span>
              </button>
            ))}
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
              const hasQuoted = !!req.myQuote;
              const urgency = getUrgency(req.startDate);
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left rounded-xl transition-all duration-150 overflow-hidden ${
                    isSelected ? 'bg-white shadow-md ring-1 ring-emerald-200' : 'bg-transparent hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex">
                    <div className={`w-1 shrink-0 rounded-l-xl ${isSelected ? 'bg-emerald-600' : hasQuoted ? 'bg-emerald-400' : 'bg-emerald-300'}`} />

                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Equipment name */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {getEquipmentName(req)}
                            </span>
                            {req.quantity > 1 && (
                              <span className="text-[10px] text-gray-400 shrink-0">×{req.quantity}</span>
                            )}
                          </div>

                          {/* Location */}
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {req.deliveryCity || req.city}
                          </p>

                          {/* Date + Duration */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {req.rentalDays || req.rentalDuration} {req.durationUnit}
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
                          {hasQuoted && req.myQuote?.status === 'EXPIRED' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-200 flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" />EXPIRED
                            </span>
                          ) : hasQuoted ? (
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
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900">{getEquipmentName(selected)}</h2>
                      {selected.equipmentCategory && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium capitalize">{selected.equipmentCategory}</span>
                      )}
                      {selected.myQuote?.status === 'EXPIRED' ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold flex items-center gap-1 border border-red-200">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : selected.myQuote ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Quoted
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                          <AlertCircle className="w-3 h-3" /> New
                        </span>
                      )}
                      {(() => {
                        const u = getUrgency(selected.startDate);
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
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.deliveryCity || selected.city}</span>
                      <span className="text-gray-300">·</span>
                      <span>{getTimeAgo(selected.createdAt)}</span>
                      {selected.totalQuotesReceived > 0 && (
                        <><span className="text-gray-300">·</span><span>{selected.totalQuotesReceived} quotes</span></>
                      )}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                {!selected.myQuote ? (
                  <Link
                    href={`/vendor/equipment/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Send Quote
                  </Link>
                ) : selected.myQuote?.status === 'EXPIRED' && selected.status === 'PENDING' ? (
                  <Link
                    href={`/vendor/equipment/requests/${selected.id}/quote`}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resubmit Quote
                  </Link>
                ) : (
                  <Link
                    href={`/vendor/equipment/quotes/${selected.myQuote?.id}`}
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
                const urgency = getUrgency(selected.startDate);
                if (urgency.urgent) {
                  return (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <Zap className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm font-semibold text-red-700">
                        Rental starts {urgency.label.toLowerCase()} — respond quickly to win this job!
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Section 1: Rental Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rental Details</h3>

                <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-700">
                      {selected.rentalDays || selected.rentalDuration}
                      <span className="text-xs ml-1 font-semibold">{selected.durationUnit}</span>
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Start</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(selected.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">End</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {selected.endDate
                        ? new Date(selected.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Secondary info row */}
                <div className="flex flex-wrap gap-2.5">
                  <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Location</p>
                      <p className="text-sm font-bold text-gray-900">{selected.deliveryCity || selected.city}</p>
                    </div>
                  </div>
                  {selected.quantity > 1 && (
                    <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Quantity</p>
                        <p className="text-sm font-bold text-gray-900">{selected.quantity}</p>
                      </div>
                    </div>
                  )}
                  {selected.siteType && (
                    <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Site Type</p>
                        <p className="text-sm font-bold text-gray-900">{selected.siteType}</p>
                      </div>
                    </div>
                  )}
                  {(selected.budgetMin || selected.budgetMax) && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Budget</p>
                        <p className="text-sm font-bold text-emerald-700">
                          {selected.budgetMin && selected.budgetMax
                            ? `₹${selected.budgetMin.toLocaleString()} – ₹${selected.budgetMax.toLocaleString()}`
                            : selected.budgetMin
                            ? `Min ₹${selected.budgetMin.toLocaleString()}`
                            : `Up to ₹${selected.budgetMax!.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service badges */}
                {(selected.needOperator || selected.needDelivery || selected.needInstallation) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selected.needOperator && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold rounded-full">
                        <HardHat className="w-3 h-3" /> Operator Needed
                      </span>
                    )}
                    {selected.needDelivery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold rounded-full">
                        <Truck className="w-3 h-3" /> Delivery Required
                      </span>
                    )}
                    {selected.needInstallation && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold rounded-full">
                        <Settings className="w-3 h-3" /> Installation Needed
                      </span>
                    )}
                  </div>
                )}

                {selected.deliveryAddress && (
                  <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 mt-2.5">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Delivery Address</p>
                    <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{selected.deliveryAddress}</p>
                  </div>
                )}
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
                      {selected.companyName && <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {selected.companyName}</p>}
                      {selected.customerPhone && <p className="text-xs text-gray-400">{selected.customerPhone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.customerPhone && (
                      <>
                        <a href={`tel:${selected.customerPhone}`} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a href={`https://wa.me/${selected.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </>
                    )}
                    {selected.customerEmail && (
                      <a href={`mailto:${selected.customerEmail}`} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all">
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
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{selected.requirements}</p>
                  </div>
                </div>
              )}

              {/* Section 4: Your Quote */}
              {selected.myQuote && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Quote</h3>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">{selected.myQuote.quoteNumber}</p>
                        <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">₹{selected.myQuote.totalAmount.toLocaleString()}</p>
                        <p className="text-xs mt-1.5 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            selected.myQuote.status === 'accepted' || selected.myQuote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                            selected.myQuote.status === 'rejected' || selected.myQuote.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {selected.myQuote.status === 'accepted' || selected.myQuote.status === 'ACCEPTED' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {selected.myQuote.status}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={`/vendor/equipment/quotes/${selected.myQuote.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips for new requests */}
              {!selected.myQuote && (
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
                      <li>Confirm equipment availability for the requested dates</li>
                      <li>Be clear about delivery, operator & installation charges</li>
                      <li>Factor in mobilization & demobilization costs</li>
                      <li>Competitive pricing wins more bids</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky CTA Bar (mobile) ── */}
            <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
              {!selected.myQuote ? (
                <Link
                  href={`/vendor/equipment/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" /> Send Quote
                </Link>
              ) : selected.myQuote?.status === 'EXPIRED' && selected.status === 'PENDING' ? (
                <Link
                  href={`/vendor/equipment/requests/${selected.id}/quote`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" /> Resubmit Quote
                </Link>
              ) : (
                <Link
                  href={`/vendor/equipment/quotes/${selected.myQuote?.id}`}
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
