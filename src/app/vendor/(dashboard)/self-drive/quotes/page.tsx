'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Car,
  Send,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Settings2,
  Fuel,
  RefreshCw,
  TrendingUp,
  Clock,
  Inbox,
  Search,
  X,
  ChevronRight,
  Sparkles,
  Award,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  vehicleBrand?: string;
  vehicleCategory?: string;
  transmission?: string;
  fuelType?: string;
  dailyRate: number;
  grandTotal: number;
  advanceAmount: number;
  advancePercent: number;
  kmLimitPerDay?: number;
  extraKmRate?: number;
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
    vehicleCategoryName?: string;
    transmission?: string;
    numberOfVehicles?: number;
    locationName: string;
    pickupDate: string;
    dropDate: string;
    totalDays: number;
    status: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  wonValue: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; accent: string; icon: any }> = {
  DRAFT:     { label: 'Draft',     color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'bg-gray-300',    icon: Edit },
  SENT:      { label: 'Sent',      color: 'text-emerald-600',    bg: 'bg-emerald-50',     border: 'border-emerald-200',    accent: 'bg-emerald-500',    icon: Send },
  VIEWED:    { label: 'Viewed',    color: 'text-emerald-600',  bg: 'bg-emerald-50',   border: 'border-emerald-200',  accent: 'bg-emerald-500',  icon: Eye },
  ACCEPTED:  { label: 'Won',       color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', accent: 'bg-emerald-500', icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     accent: 'bg-red-400',     icon: XCircle },
  EXPIRED:   { label: 'Expired',   color: 'text-emerald-600',   bg: 'bg-emerald-50',    border: 'border-emerald-200',   accent: 'bg-emerald-400',   icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    accent: 'bg-gray-300',    icon: XCircle },
};

export default function VendorSelfDriveQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, accepted: 0, wonValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const [committedSearch, setCommittedSearch] = useState('');

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      let status = '';
      if (filter === 'active') status = 'SENT,VIEWED';
      else if (filter === 'accepted') status = 'ACCEPTED';
      else if (filter === 'expired') status = 'EXPIRED,REJECTED,WITHDRAWN';

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (committedSearch) params.set('search', committedSearch);

      const response = await fetch(`/api/vendor/self-drive-quotes?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.quotes || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentPage, dateFilter, committedSearch]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const handleSearch = () => {
    setCommittedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCommittedSearch('');
    setCurrentPage(1);
  };

  const filteredQuotes = quotes;

  const isExpiringSoon = (validTill: string) => {
    if (!validTill) return false;
    const diff = new Date(validTill).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  const filterTabs = [
    { value: 'all',      label: 'All',     icon: Send,        count: stats.total,    activeColor: 'bg-white text-gray-900 shadow-lg shadow-gray-200/50' },
    { value: 'active',   label: 'Active',  icon: Zap,         count: stats.pending,  activeColor: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
    { value: 'accepted', label: 'Won',     icon: Award,       count: stats.accepted, activeColor: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
    { value: 'expired',  label: 'Closed',  icon: AlertCircle, count: 0,              activeColor: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
  ];

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Hero header skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-8 w-20 h-20 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 bg-white/20 rounded-2xl ${shimmer}`} />
              <div className="space-y-2">
                <div className={`h-6 w-36 bg-white/25 rounded-lg ${shimmer}`} />
                <div className={`h-3 w-52 bg-white/15 rounded ${shimmer}`} />
              </div>
            </div>
            <div className={`h-10 w-40 bg-white/20 rounded-xl hidden sm:block ${shimmer}`} />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { border: 'border-gray-100', iconBg: 'bg-gray-100' },
            { border: 'border-emerald-100', iconBg: 'bg-emerald-50' },
            { border: 'border-emerald-100', iconBg: 'bg-emerald-50' },
            { border: 'border-emerald-100', iconBg: 'bg-emerald-50' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl p-4 border ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${s.iconBg} rounded-xl ${shimmer}`} />
                <div className={`h-3 w-12 bg-gray-100 rounded ${shimmer}`} />
              </div>
              <div className={`h-8 w-16 bg-gray-100 rounded-lg mb-1 ${shimmer}`} />
              <div className={`h-3 w-20 bg-gray-50 rounded ${shimmer}`} />
            </div>
          ))}
        </div>

        {/* Conversion bar skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`h-4 w-28 bg-gray-100 rounded ${shimmer}`} />
            <div className={`h-4 w-10 bg-gray-100 rounded ${shimmer}`} />
          </div>
          <div className={`w-full h-2.5 bg-gray-100 rounded-full ${shimmer}`} />
        </div>

        {/* Filter + grid skeleton */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-3 ${shimmer}`}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-20 bg-gray-200/50 rounded-lg" />)}
            </div>
            <div className="h-9 flex-1 max-w-xs bg-gray-50 rounded-xl border border-gray-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className={`h-1 w-full ${i % 3 === 0 ? 'bg-emerald-300' : i % 2 === 0 ? 'bg-emerald-400' : 'bg-emerald-300'}`} />
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className={`h-5 w-16 bg-gray-100 rounded-md ${shimmer}`} />
                <div className={`h-6 w-16 bg-gray-100 rounded-lg ${shimmer}`} />
              </div>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 bg-emerald-50 rounded-xl ${shimmer}`} />
                    <div className="space-y-1.5">
                      <div className={`h-4 w-28 bg-gray-100 rounded ${shimmer}`} />
                      <div className={`h-3 w-20 bg-gray-50 rounded ${shimmer}`} />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`h-6 w-20 bg-emerald-50 rounded-lg ml-auto ${shimmer}`} />
                    <div className={`h-2.5 w-14 bg-gray-50 rounded ml-auto ${shimmer}`} />
                  </div>
                </div>
                <div className={`flex items-center gap-2.5 bg-gray-50/80 rounded-xl px-3 py-2.5 ${shimmer}`}>
                  <div className="w-7 h-7 bg-emerald-100 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-24 bg-gray-200/60 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <div className={`h-2.5 w-14 bg-gray-200/60 rounded mb-1.5 ${shimmer}`} />
                    <div className={`h-3.5 w-20 bg-gray-100 rounded ${shimmer}`} />
                  </div>
                  <div className="bg-emerald-50/30 border border-emerald-100/30 rounded-xl px-3 py-2.5">
                    <div className={`h-2.5 w-10 bg-emerald-100/60 rounded mb-1.5 ${shimmer}`} />
                    <div className={`h-3.5 w-24 bg-emerald-50 rounded ${shimmer}`} />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className={`h-10 w-full bg-gray-100 rounded-xl ${shimmer}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ══════════ Hero Header ══════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-5 md:p-6 animate-slide-down">
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
              <p className="text-emerald-100 text-sm mt-0.5">Self-drive car rental quotes</p>
            </div>
          </div>
          <Link
            href="/vendor/self-drive/requests"
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 group"
          >
            <Sparkles className="w-4 h-4" />
            View New Requests
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* ══════════ Stats Cards ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{stats.pending}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">awaiting response</p>
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
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-2xl p-4 border border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
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

      {/* ══════════ Conversion Rate ══════════ */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-600">Conversion Rate</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-600">{conversionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${conversionRate}%` }} />
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
      <div className="relative z-10 bg-white rounded-2xl border border-gray-100 p-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {filterTabs.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    filter === f.value ? f.activeColor : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
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

          <div className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, vehicle, location, booking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          <DateFilterDropdown
            onFilterChange={(start, end) => { setDateFilter({ start, end }); setCurrentPage(1); }}
            initialStartDate={dateFilter.start || undefined}
            initialEndDate={dateFilter.end || undefined}
          />
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
            {searchQuery ? 'No quotes match your search.' : filter !== 'all' ? 'No quotes match this filter.' : 'Start sending quotes to self-drive rental requests.'}
          </p>
          <Link href="/vendor/self-drive/requests" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95">
            <Sparkles className="w-4 h-4" /> Browse Requests
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredQuotes.map((quote, index) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;
            const expiringSoon = isExpiringSoon(quote.validTill) && quote.status === 'SENT';
            const isWon = quote.status === 'ACCEPTED';

            return (
              <Link
                key={quote.id}
                href={`/vendor/self-drive/quotes/${quote.id}`}
                style={{ animationDelay: `${0.25 + index * 0.06}s` }}
                className={`block bg-white rounded-2xl border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative opacity-0 animate-fade-in-up ${
                  isWon
                    ? 'border-emerald-200 shadow-sm ring-1 ring-emerald-100'
                    : expiringSoon
                    ? 'border-emerald-200 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Status accent bar */}
                <div className={`h-1 w-full ${statusConfig.accent}`} />

                {/* Won ribbon */}
                {isWon && (
                  <div className="absolute top-3 -right-8 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest py-0.5 px-10 rotate-45 shadow-sm">Won</div>
                )}

                {/* Card Header */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">#{quote.quoteNumber}</span>
                    {isWon && quote.bookingNumber && (
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Bkg #{quote.bookingNumber}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{getTimeAgo(quote.createdAt)}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                    <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-4 pb-4">
                  {expiringSoon && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3 animate-pulse">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px] font-bold text-emerald-700">Expiring soon!</span>
                    </div>
                  )}

                  {/* Vehicle + Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isWon ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' : 'bg-gradient-to-br from-emerald-100 to-emerald-50'}`}>
                        <Car className={`w-5 h-5 ${isWon ? 'text-emerald-600' : 'text-emerald-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{quote.vehicleName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {quote.vehicleBrand && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">{quote.vehicleBrand}</span>}
                          {quote.transmission && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Settings2 className="w-2.5 h-2.5" /> {quote.transmission}
                            </span>
                          )}
                          {quote.fuelType && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Fuel className="w-2.5 h-2.5" /> {quote.fuelType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-extrabold ${isWon ? 'text-emerald-600' : 'text-emerald-600'}`}>₹{quote.grandTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-medium">₹{quote.dailyRate}/day</p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-2.5 mb-3 bg-gray-50/80 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm shadow-emerald-500/20">
                      <span className="text-[10px] font-bold text-white">{quote.request?.customerName?.charAt(0)?.toUpperCase() || 'C'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {quote.request?.customerName}
                        {quote.request?.numberOfVehicles && quote.request.numberOfVehicles > 1 && (
                          <span className="ml-1 text-gray-500 font-medium">· × {quote.request.numberOfVehicles} cars</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400">Req #{quote.request?.requestNumber}</p>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Location</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{quote.request?.locationName}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Trip</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-700">
                        {quote.request?.pickupDate && new Date(quote.request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' - '}
                        {quote.request?.dropDate && new Date(quote.request.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        <span className="text-emerald-600 ml-1 font-extrabold">({quote.request?.totalDays}d)</span>
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
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" /> {quote.viewCount}x
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.preventDefault()}>
                    <Link
                      href={`/vendor/self-drive/quotes/${quote.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                      <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                    </Link>
                    {['SENT', 'VIEWED'].includes(quote.status) && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (!confirm('Withdraw this quote?')) return;
                          try {
                            const res = await fetch(`/api/vendor/self-drive-quotes/${quote.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'withdraw' }),
                            });
                            if (res.ok) fetchQuotes();
                            else { const data = await res.json(); alert(data.error || 'Failed'); }
                          } catch { alert('Failed to withdraw quote'); }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all border border-red-100 active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    )}
                    {quote.status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(quote.request?.status) && (
                      <Link
                        href={`/vendor/self-drive/requests/${quote.request.id}/quote`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-Quote
                      </Link>
                    )}
                    {isWon && (
                      <Link
                        href={quote.bookingId ? `/vendor/self-drive/bookings/${quote.bookingId}` : `/vendor/self-drive/bookings`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> View Booking
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ══════════ Pagination ══════════ */}
      {filteredQuotes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={20}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
