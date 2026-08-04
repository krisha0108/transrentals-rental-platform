'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  BookOpen,
  Search,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CheckCircle2,
  Clock,
  IndianRupee,
  SlidersHorizontal,
  X,
  Map,
  Building2,
  Car,
  FileText,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  bookingType: string;
  referenceTitle: string | null;
  travelDate: string | null;
  checkInDate: string | null;
  totalAmount: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  status: string;
  shareToken: string | null;
  customerFilledAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  DRAFT: number;
  PENDING_CUSTOMER: number;
  CONFIRMED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
}

interface SelfBooking {
  id: string;
  service: string;
  bookingNumber: string | null;
  amount: number;
  bookingDate: string | null;
  status: string;
  createdAt: string;
  trackUrl: string;
}

const SERVICE_META: Record<string, { label: string; icon: string; color: string }> = {
  BIKE:      { label: 'Bike Rental',      icon: '🏍️', color: 'bg-orange-100 text-orange-700' },
  CAR:       { label: 'Car Rental',       icon: '🚗', color: 'bg-blue-100 text-blue-700' },
  BUS:       { label: 'Bus Charter',      icon: '🚌', color: 'bg-purple-100 text-purple-700' },
  LUXURY:    { label: 'Luxury Vehicle',   icon: '🏎️', color: 'bg-amber-100 text-amber-700' },
  CHAUFFEUR: { label: 'Chauffeur',        icon: '🚖', color: 'bg-cyan-100 text-cyan-700' },
  TRUCK:     { label: 'Truck Hire',       icon: '🚚', color: 'bg-slate-100 text-slate-700' },
  PACKERS:   { label: 'Packers & Movers', icon: '📦', color: 'bg-pink-100 text-pink-700' },
  EQUIPMENT: { label: 'Equipment',        icon: '🛠️', color: 'bg-teal-100 text-teal-700' },
  WANDER:    { label: 'Group Trip',       icon: '🌄', color: 'bg-indigo-100 text-indigo-700' },
  B2B_CAR:       { label: 'TA · Car (Manager)',    icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_BIKE:      { label: 'TA · Bike (Manager)',   icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_BUS:       { label: 'TA · Bus (Manager)',    icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_LUXURY:    { label: 'TA · Luxury (Manager)', icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_CHAUFFEUR: { label: 'TA · Chauffeur (Mgr)',  icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_TRUCK:     { label: 'TA · Truck (Manager)',  icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
  B2B_SELF_DRIVE:{ label: 'TA · Self-Drive (Mgr)', icon: '👔', color: 'bg-indigo-100 text-indigo-800' },
};

const STATUS_CFG: Record<string, { label: string; bar: string; badge: string }> = {
  DRAFT:             { label: 'Draft',            bar: 'bg-gray-300',    badge: 'text-gray-600 bg-gray-100 border-gray-200' },
  PENDING_CUSTOMER:  { label: 'Pending Customer',  bar: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONFIRMED:         { label: 'Confirmed',         bar: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  IN_PROGRESS:       { label: 'In Progress',       bar: 'bg-blue-500',    badge: 'text-blue-700 bg-blue-50 border-blue-200' },
  COMPLETED:         { label: 'Completed',         bar: 'bg-green-500',   badge: 'text-green-700 bg-green-50 border-green-200' },
  CANCELLED:         { label: 'Cancelled',         bar: 'bg-red-300',     badge: 'text-red-600 bg-red-50 border-red-200' },
};

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  TOUR:      { label: 'Tour',      icon: Map,       color: 'text-violet-500' },
  PROPERTY:  { label: 'Property',  icon: Building2,  color: 'text-sky-500' },
  TRANSPORT: { label: 'Transport', icon: Car,        color: 'text-amber-500' },
  CUSTOM:    { label: 'Custom',    icon: FileText,   color: 'text-gray-400' },
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_CUSTOMER', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

/* Fade-up on mount */
function AnimateIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selfBookings, setSelfBookings] = useState<SelfBooking[]>([]);
  const [showAllSelf, setShowAllSelf] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totals, setTotals] = useState({ bookedAmount: 0, receivedAmount: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.append('page', String(pagination.page));
      qs.append('limit', String(pagination.limit));
      if (statusFilter !== 'ALL') qs.append('status', statusFilter);
      if (typeFilter !== 'ALL') qs.append('bookingType', typeFilter);
      if (search) qs.append('search', search);

      const res = await fetch(`/api/travel-agent/bookings?${qs}`);
      if (res.ok) {
        const json = await res.json();
        setBookings(json.bookings);
        setSelfBookings(json.selfBookings || []);
        setStats(json.stats);
        setTotals(json.totals);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, typeFilter, search]);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const activeFilters = [typeFilter !== 'ALL'].filter(Boolean).length;

  if (loading && bookings.length === 0 && !stats) {
    return (
      <div className="-m-4 lg:-m-6">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-4 sm:px-6 pt-5 pb-16">
          <div className="flex items-center gap-3 mb-4 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-white/20" />
            <div className="space-y-2.5">
              <div className="h-5 w-32 bg-white/20 rounded-lg" />
              <div className="h-3 w-44 bg-white/15 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-5 animate-pulse flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/15 rounded-2xl w-40 h-[64px]" />
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-6 -mt-8 pb-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 lg:-m-6">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 relative overflow-hidden px-4 sm:px-6 pt-5 pb-16">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative w-full">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Bookings</h1>
                <p className="text-emerald-200 text-sm">{stats?.total ?? 0} total bookings</p>
              </div>
            </div>
            <Link
              href="/travel-agent/bookings/add"
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Booking</span>
            </Link>
          </div>

          {/* Stats pills */}
          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Booked Value', value: `₹${totals.bookedAmount.toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" /> },
              { label: 'Received', value: `₹${totals.receivedAmount.toLocaleString('en-IN')}`, icon: <TrendingUp className="w-5 h-5" /> },
              { label: 'Confirmed', value: stats?.CONFIRMED ?? 0, icon: <CheckCircle2 className="w-5 h-5" /> },
              { label: 'Awaiting Customer', value: stats?.PENDING_CUSTOMER ?? 0, icon: <Clock className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/[0.18] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner shadow-white/10">{stat.icon}</div>
                <div>
                  <p className="text-xl font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 -mt-8 pb-12 w-full space-y-4">

        {/* Search + filter row */}
        <AnimateIn delay={40}>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking #, customer or reference..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
                showFilters || activeFilters > 0
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200/50'
                  : 'bg-white border-gray-200/80 text-gray-600 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-600 text-xs font-bold flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
          </div>
        </AnimateIn>

        {showFilters && (
          <AnimateIn delay={0}>
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by</p>
                {activeFilters > 0 && (
                  <button onClick={() => setTypeFilter('ALL')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-semibold">Booking Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                  className="w-full sm:w-64 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 transition-all"
                >
                  <option value="ALL">All Types</option>
                  <option value="TOUR">Tour</option>
                  <option value="PROPERTY">Property</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          </AnimateIn>
        )}

        {/* Status tabs */}
        <AnimateIn delay={80}>
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide bg-gray-100/80 rounded-xl p-1">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === 'ALL' ? stats?.total ?? 0 : (stats as any)?.[tab.key] ?? 0;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setPagination((p) => ({ ...p, page: 1 })); }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-400'}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </AnimateIn>

        {/* Self-bookings */}
        {!loading && selfBookings.length > 0 && (
          <AnimateIn delay={100}>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-bold text-indigo-900">My Self-Bookings</h2>
                    <p className="text-[11px] text-indigo-700">
                      Bookings you placed on the customer side ({selfBookings.length})
                    </p>
                  </div>
                </div>
                {selfBookings.length > 5 && (
                  <button
                    onClick={() => setShowAllSelf((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    {showAllSelf ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></> : <>Show all <ChevronDown className="w-3.5 h-3.5" /></>}
                  </button>
                )}
              </div>
              <div className="bg-white border-t border-indigo-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50/50 border-b border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase">
                      <th className="text-left px-5 py-2">Service</th>
                      <th className="text-left px-5 py-2">Booking #</th>
                      <th className="text-left px-5 py-2">Date</th>
                      <th className="text-left px-5 py-2">Amount</th>
                      <th className="text-left px-5 py-2">Status</th>
                      <th className="text-right px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllSelf ? selfBookings : selfBookings.slice(0, 5)).map((sb) => {
                      const meta = SERVICE_META[sb.service] || { label: sb.service, icon: '📋', color: 'bg-gray-100 text-gray-700' };
                      return (
                        <tr key={`${sb.service}-${sb.id}`} className="border-b border-gray-100 hover:bg-indigo-50/30">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
                              <span>{meta.icon}</span> {meta.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-800">
                            {sb.bookingNumber || sb.id.slice(0, 10)}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-700">
                            {sb.bookingDate ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {new Date(sb.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-bold text-gray-900">
                            {sb.amount > 0 ? `₹${sb.amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase">
                              {sb.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link href={sb.trackUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                              Track <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateIn>
        )}

        {/* Booking cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : bookings.length === 0 ? (
          <AnimateIn delay={100}>
            <div className="bg-white rounded-2xl border border-gray-200/80 py-20 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-gray-700 font-bold text-base">No bookings found</p>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
                {search || activeFilters > 0 || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or clearing the filters'
                  : 'Add a booking manually or convert a lead from the leads page'}
              </p>
              {!search && activeFilters === 0 && statusFilter === 'ALL' && (
                <Link href="/travel-agent/bookings/add" className="inline-flex items-center gap-2 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-emerald-600/20 active:scale-95">
                  <Plus className="w-4 h-4" /> Add Booking
                </Link>
              )}
            </div>
          </AnimateIn>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {bookings.map((b, index) => {
                const sc = STATUS_CFG[b.status] ?? STATUS_CFG.DRAFT;
                const tm = TYPE_META[b.bookingType] ?? TYPE_META.CUSTOM;
                const TypeIcon = tm.icon;
                return (
                  <AnimateIn key={b.id} delay={100 + index * 40}>
                    <Link
                      href={`/travel-agent/bookings/${b.id}`}
                      className="group flex items-stretch bg-white rounded-2xl border border-gray-200/80 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    >
                      <div className={`w-1.5 shrink-0 ${sc.bar}`} />
                      <div className="flex-1 p-4 sm:p-5 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-[15px]">{b.customerName}</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc.badge}`}>
                                {sc.label}
                              </span>
                              {b.shareToken && b.status === 'PENDING_CUSTOMER' && !b.customerFilledAt && (
                                <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                  Awaiting customer
                                </span>
                              )}
                              {b.shareToken && b.customerFilledAt && (
                                <span className="inline-flex text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                  Filled by customer
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-medium">
                                <TypeIcon className={`w-3.5 h-3.5 ${tm.color}`} /> {tm.label}
                              </span>
                              {b.referenceTitle && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="truncate max-w-[160px]">{b.referenceTitle}</span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" /> {b.customerPhone}
                              </span>
                              {(b.travelDate || b.checkInDate) && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-emerald-400" />
                                    {formatDate(b.travelDate || b.checkInDate)}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                              <span
                                className={`text-xs font-semibold ${
                                  b.paymentStatus === 'PAID' ? 'text-green-600' : b.paymentStatus === 'PARTIAL' ? 'text-amber-600' : 'text-gray-400'
                                }`}
                              >
                                {b.paymentStatus === 'PAID' ? 'Paid' : b.paymentStatus === 'PARTIAL' ? `₹${(b.paidAmount || 0).toLocaleString('en-IN')} paid` : b.paymentStatus.charAt(0) + b.paymentStatus.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[10px] text-gray-400 font-mono tracking-wide">{b.bookingNumber}</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors duration-200">
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimateIn>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <AnimateIn delay={0}>
                <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-gray-200/80 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <p className="text-gray-500">
                    Page {pagination.page} of {pagination.pages} • {pagination.total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </AnimateIn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
