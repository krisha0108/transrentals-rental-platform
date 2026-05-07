'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  TrendingUp,
  Sparkles,
  Award,
  Zap,
  ChevronRight,
  Edit,
  ArrowUpRight,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  vehicleCategory: string;
  totalAmount: number;
  status: string;
  validTill: string;
  viewCount: number;
  bookingId?: string | null;
  bookingNumber?: string | null;
  bookingStatus?: string | null;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    pickupCity: string;
    pickupAddress?: string;
    dropCity: string;
    dropAddress?: string;
    pickupDate: string;
    status: string;
  };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string; glow: string; icon: any }> = {
  DRAFT:     { label: 'Draft',              color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'bg-gray-300',     glow: '',                                              icon: Edit },
  SENT:      { label: 'Awaiting Response',  color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    accent: 'bg-blue-500',     glow: '',                                              icon: Send },
  VIEWED:    { label: 'Viewed',             color: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-200',  accent: 'bg-purple-500',   glow: '',                                              icon: Eye },
  ACCEPTED:  { label: 'Won',                color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', accent: 'bg-emerald-500',  glow: 'shadow-emerald-100 ring-1 ring-emerald-200',    icon: CheckCircle },
  REJECTED:  { label: 'Rejected',           color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     accent: 'bg-red-400',      glow: '',                                              icon: XCircle },
  EXPIRED:   { label: 'Expired',            color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   accent: 'bg-amber-400',    glow: '',                                              icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn',          color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'bg-gray-300',     glow: '',                                              icon: XCircle },
};

export default function VendorTransporterQuotesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');

  const config = TRANSPORTER_CONFIG;

  const handleSearch = () => setCommittedSearch(searchInput);
  const handleClearSearch = () => { setSearchInput(''); setCommittedSearch(''); };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;
    fetchQuotes();
  }, [sessionStatus, filter, committedSearch]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const status = filter !== 'all' ? filter : '';
      if (status) params.set('status', status);
      if (committedSearch) params.set('search', committedSearch);
      const response = await fetch(`/api/vendor/truck-quotes?${params}`);
      const data = await response.json();
      if (data.success) {
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes = quotes;

  const stats = useMemo(() => ({
    total: quotes.length,
    pending: quotes.filter((q) => ['SENT', 'VIEWED'].includes(q.status)).length,
    accepted: quotes.filter((q) => q.status === 'ACCEPTED').length,
    wonValue: quotes.filter((q) => q.status === 'ACCEPTED').reduce((s, q) => s + (q.totalAmount || 0), 0),
  }), [quotes]);

  const conversionRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id || 'Transport';
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isExpiringSoon = (validTill: string) => {
    if (!validTill) return false;
    const diff = new Date(validTill).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  };

  const filterTabs = [
    { value: 'all',      label: 'All',      icon: Send,        count: stats.total,    activeColor: 'bg-white text-gray-900 shadow-lg shadow-gray-200/50' },
    { value: 'SENT',     label: 'Pending',  icon: Clock,       count: quotes.filter(q => q.status === 'SENT').length,   activeColor: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' },
    { value: 'VIEWED',   label: 'Viewed',   icon: Eye,         count: quotes.filter(q => q.status === 'VIEWED').length, activeColor: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' },
    { value: 'ACCEPTED', label: 'Won',      icon: Award,       count: stats.accepted, activeColor: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
    { value: 'REJECTED', label: 'Rejected', icon: AlertCircle, count: quotes.filter(q => q.status === 'REJECTED').length, activeColor: 'bg-red-500 text-white shadow-lg shadow-red-500/30' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ══════════ Hero Header ══════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">My Quotes</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Track all your transport quotes</p>
            </div>
          </div>

          <Link
            href="/vendor/transporter/requests"
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 group"
          >
            <Sparkles className="w-4 h-4" />
            View New Requests
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* ══════════ Stats Cards ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">quotes sent</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-3xl font-extrabold text-blue-600">{stats.pending}</p>
          <p className="text-[11px] text-blue-400 mt-0.5">awaiting response</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Won</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{stats.accepted}</p>
          <p className="text-[11px] text-emerald-500 mt-0.5">bookings converted</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50/50 rounded-2xl p-4 border border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Revenue</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">₹{stats.wonValue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">total won value</p>
        </div>
      </div>

      {/* ══════════ Conversion Rate Bar ══════════ */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-600">Conversion Rate</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-600">{conversionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">{stats.accepted} won out of {stats.total} quotes</span>
            {conversionRate >= 30 && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> Great performance!
              </span>
            )}
          </div>
        </div>
      )}

      {/* ══════════ Filters + Search ══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 overflow-x-auto">
            {filterTabs.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    filter === f.value
                      ? f.activeColor
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                    filter === f.value
                      ? f.value === 'all' ? 'bg-gray-100 text-gray-600' : 'bg-white/25 text-white'
                      : 'bg-gray-200/60 text-gray-400'
                  }`}>{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by quote #, booking #, customer, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchInput && (
                <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <X className="w-3 h-3 text-gray-500" />
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
        </div>
      </div>

      {/* ══════════ Quotes Grid ══════════ */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm">
              <Send className="w-9 h-9 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">No quotes found</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            {committedSearch ? 'No quotes match your search.' : filter !== 'all' ? 'No quotes match this filter.' : 'Start sending quotes to transport requests and track them here.'}
          </p>
          <Link
            href="/vendor/transporter/requests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Browse Requests
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;
            const expiringSoon = isExpiringSoon(quote.validTill) && quote.status === 'SENT';
            const isWon = quote.status === 'ACCEPTED';

            return (
              <Link
                key={quote.id}
                href={`/vendor/transporter/quotes/${quote.id}`}
                className={`block bg-white rounded-2xl border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative ${
                  isWon
                    ? 'border-emerald-200 shadow-sm ' + statusConfig.glow
                    : expiringSoon
                    ? 'border-amber-200 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`h-1 w-full ${statusConfig.accent}`} />

                {isWon && (
                  <div className="absolute top-3 -right-8 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest py-0.5 px-10 rotate-45 shadow-sm">
                    Won
                  </div>
                )}

                {/* Card Header */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">#{quote.quoteNumber}</span>
                    {isWon && quote.bookingNumber && (
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Bkg #{quote.bookingNumber}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{getTimeAgo(quote.createdAt)}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-4 pb-4">
                  {expiringSoon && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 animate-pulse">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-700">Expiring soon — respond quickly!</span>
                    </div>
                  )}

                  {/* Vehicle + Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isWon ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' : 'bg-gradient-to-br from-emerald-100 to-emerald-50'
                      }`}>
                        <Truck className={`w-5 h-5 ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                          {quote.vehicleName || getCategoryName(quote.vehicleCategory)}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium inline-block mt-0.5">
                          {getCategoryName(quote.vehicleCategory)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-extrabold ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`}>
                        ₹{quote.totalAmount?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">total amount</p>
                    </div>
                  </div>

                  {/* Customer row */}
                  <div className="flex items-center gap-2.5 mb-3 bg-gray-50/80 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm shadow-blue-500/20">
                      <span className="text-[10px] font-bold text-white">
                        {quote.request?.customerName?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 truncate">{quote.request?.customerName}</p>
                      <p className="text-[10px] text-gray-400">Req #{quote.request?.requestNumber}</p>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Route</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-700 truncate flex items-center gap-1">
                        {quote.request?.pickupCity}
                        <ArrowRight className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        {quote.request?.dropCity}
                      </p>
                      {(quote.request?.pickupAddress || quote.request?.dropAddress) && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {quote.request?.pickupAddress && <span>{quote.request.pickupAddress}</span>}
                          {quote.request?.pickupAddress && quote.request?.dropAddress && <span> → </span>}
                          {quote.request?.dropAddress && <span>{quote.request.dropAddress}</span>}
                        </p>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Pickup</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-700">
                        {quote.request?.pickupDate
                          ? new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Valid till {new Date(quote.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {quote.viewCount > 0 && (
                      <div className="flex items-center gap-1 bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" />
                        <span>{quote.viewCount}x viewed</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.preventDefault()}>
                    <Link
                      href={`/vendor/transporter/quotes/${quote.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Quote Details
                      <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                    </Link>
                    {quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status) && (
                      <Link
                        href={`/vendor/transporter/requests/${quote.request.id}/quote`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-Quote
                      </Link>
                    )}
                    {isWon && (
                      <Link
                        href={quote.bookingId ? `/vendor/transporter/bookings/${quote.bookingId}` : `/vendor/transporter/bookings`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        View Booking
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
