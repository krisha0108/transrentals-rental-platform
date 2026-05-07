'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Calendar, Car,
  ChevronRight, BookOpen, CheckCircle2,
  XCircle, AlertCircle, PlayCircle,
  Link2, SlidersHorizontal, X, MapPin,
  Users, TrendingUp, Clock,
} from 'lucide-react';

interface DirectBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  vehicleType: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  pickupLocation: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  paidAmount: number;
  bookingSource: string;
  createdAt: string;
}

/* ── Fade-up on scroll/mount ──────────────────────────────────────────── */
function AnimateIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
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

const STATUS_CONFIG: Record<string, { label: string; bar: string; badge: string; bg: string; icon: any }> = {
  inquiry:     { label: 'Inquiry',     bar: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200',    bg: 'bg-amber-50/40',   icon: AlertCircle },
  confirmed:   { label: 'Confirmed',   bar: 'bg-emerald-500',  badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', bg: 'bg-emerald-50/30', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bar: 'bg-emerald-600', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', bg: 'bg-emerald-50/30', icon: PlayCircle },
  completed:   { label: 'Completed',   bar: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', bg: 'bg-emerald-50/30', icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    bar: 'bg-red-400',     badge: 'text-red-600 bg-red-50 border-red-200',          bg: 'bg-red-50/20',     icon: XCircle },
  cancelled:   { label: 'Cancelled',   bar: 'bg-gray-300',    badge: 'text-gray-500 bg-gray-100 border-gray-200',      bg: 'bg-gray-50/40',    icon: XCircle },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Payment Pending', color: 'text-orange-500' },
  partial:     { label: 'Partial Paid',    color: 'text-amber-500' },
  collected:   { label: 'Paid',            color: 'text-emerald-600' },
  link_sent:   { label: 'Link Sent',       color: 'text-emerald-500' },
  paid_online: { label: 'Paid Online',     color: 'text-emerald-600' },
  waived:      { label: 'Waived',          color: 'text-gray-400' },
};

const STATUS_TABS = [
  { key: 'all',         label: 'All',        active: 'bg-white text-gray-900 shadow-md',              inactive: 'text-gray-400 hover:text-gray-600' },
  { key: 'inquiry',     label: 'Inquiries',  active: 'bg-white text-amber-700 shadow-md',             inactive: 'text-gray-400 hover:text-gray-600' },
  { key: 'confirmed',   label: 'Confirmed',  active: 'bg-white text-emerald-700 shadow-md',           inactive: 'text-gray-400 hover:text-gray-600' },
  { key: 'in_progress', label: 'Active',     active: 'bg-white text-emerald-700 shadow-md',           inactive: 'text-gray-400 hover:text-gray-600' },
  { key: 'completed',   label: 'Completed',  active: 'bg-white text-emerald-700 shadow-md',           inactive: 'text-gray-400 hover:text-gray-600' },
];

const SERVICE_LABELS: Record<string, string> = {
  bike:             '🏍️ Bike',
  bus:              '🚌 Bus',
  'car-with-driver':'🚗 Car w/ Driver',
  'self-drive':     '🚙 Self Drive',
  luxury:           '✨ Luxury',
  transporter:      '🚛 Transporter',
  'packers-movers': '📦 Packers & Movers',
  equipment:        '🔧 Equipment',
  general:          '📋 General',
};

export default function DirectBookingsPage() {
  const [bookings, setBookings] = useState<DirectBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search — wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBookings = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (source !== 'all') params.set('source', source);
      if (serviceFilter !== 'all') params.set('serviceType', serviceFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/vendor/direct-bookings?${params}`, { credentials: 'include' });
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      setBookings(data.bookings || []);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [activeTab, source, serviceFilter, debouncedSearch]);

  const initialLoad = useRef(true);
  useEffect(() => {
    fetchBookings(initialLoad.current);
    initialLoad.current = false;
  }, [fetchBookings]);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const pendingCount = bookings.filter(b => b.paymentStatus === 'pending' && b.status !== 'cancelled' && b.status !== 'rejected').length;
  const activeFilters = [source !== 'all', serviceFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setSource('all'); setServiceFilter('all'); };

  /* ── Stats ── */
  const totalRevenue = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="-m-6">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-6 pt-16 lg:pt-10 pb-16">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4 animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-white/20" />
              <div className="space-y-2.5">
                <div className="h-5 w-40 bg-white/20 rounded-lg" />
                <div className="h-3 w-56 bg-white/15 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/15 rounded-2xl w-36 h-[64px]" />
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10 px-4 sm:px-6 -mt-8 pb-10 w-full space-y-4">
          {/* Search skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
          {/* Tabs skeleton */}
          <div className="flex gap-2 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-9 w-24 bg-white rounded-xl shadow-sm" />
            ))}
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-3">
                  <div className="w-1.5 h-20 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
                    <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="h-4 bg-gray-200 rounded-lg w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6">

      {/* ══════════ Gradient Header ══════════ */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 relative overflow-hidden px-6 pt-16 lg:pt-10 pb-16">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

        <div className="relative w-full">
          {/* Title row */}
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Direct Bookings</h1>
                <p className="text-emerald-200 text-sm">Your personal clients & form submissions</p>
              </div>
            </div>
            <Link
              href="/vendor/direct-bookings/add"
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Booking</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>

          {/* Stats pills — glassmorphism */}
          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Total Bookings', value: bookings.length,  icon: <BookOpen className="w-5 h-5" /> },
              { label: 'Active',         value: activeBookings,    icon: <PlayCircle className="w-5 h-5" /> },
              { label: 'Revenue',        value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp className="w-5 h-5" /> },
              ...(pendingCount > 0 ? [{ label: 'Payment Due', value: pendingCount, icon: <Clock className="w-5 h-5" /> }] : []),
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-white/[0.18] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner shadow-white/10">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ Content ══════════ */}
      <div className="relative z-10 px-4 sm:px-6 -mt-8 pb-12 w-full space-y-4">

        {/* ── Pending alert ── */}
        {pendingCount > 0 && (
          <AnimateIn delay={0}>
            <div className="flex items-center gap-3 bg-white border-l-4 border-l-orange-400 rounded-2xl px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-sm text-gray-700 flex-1">
                <strong className="font-bold text-orange-600">{pendingCount}</strong> booking{pendingCount > 1 ? 's' : ''} awaiting payment collection
              </p>
            </div>
          </AnimateIn>
        )}

        {/* ── Search + filter row ── */}
        <AnimateIn delay={60}>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or booking #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
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

        {/* ── Filter panel ── */}
        {showFilters && (
          <AnimateIn delay={0}>
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by</p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors">
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-semibold">Service Type</label>
                  <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 transition-all">
                    <option value="all">All Services</option>
                    <option value="bike">🏍️ Bike</option>
                    <option value="bus">🚌 Bus & Tempo</option>
                    <option value="car-with-driver">🚗 Car w/ Driver</option>
                    <option value="self-drive">🚙 Self Drive</option>
                    <option value="luxury">✨ Luxury</option>
                    <option value="transporter">🚛 Transporter</option>
                    <option value="packers-movers">📦 Packers & Movers</option>
                    <option value="equipment">🔧 Equipment</option>
                    <option value="general">📋 General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-semibold">Booking Source</label>
                  <select value={source} onChange={e => setSource(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 transition-all">
                    <option value="all">All Sources</option>
                    <option value="manual">✏️ Manual Entry</option>
                    <option value="shared_form">🔗 Via Booking Form</option>
                  </select>
                </div>
              </div>
            </div>
          </AnimateIn>
        )}

        {/* ── Status tabs — pill style ── */}
        <AnimateIn delay={120}>
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide bg-gray-100/80 rounded-xl p-1">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === 'all' ? bookings.length : bookings.filter(b => b.status === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive ? tab.active : tab.inactive
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                      isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-400'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </AnimateIn>

        {/* ── Booking list ── */}
        {bookings.length === 0 ? (
          <AnimateIn delay={100}>
            <div className="bg-white rounded-2xl border border-gray-200/80 py-20 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-gray-700 font-bold text-base">No bookings found</p>
              <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
                {search || activeFilters > 0
                  ? 'Try adjusting your search or clearing the filters'
                  : 'Add a booking manually or share your form link with clients'}
              </p>
              {!search && activeFilters === 0 && activeTab === 'all' && (
                <Link href="/vendor/direct-bookings/add" className="inline-flex items-center gap-2 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-emerald-600/20 active:scale-95">
                  <Plus className="w-4 h-4" /> Add First Booking
                </Link>
              )}
            </div>
          </AnimateIn>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bookings.map((b, index) => {
              const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.inquiry;
              const StatusIcon = sc.icon;
              const pc = PAYMENT_CONFIG[b.paymentStatus] ?? { label: b.paymentStatus, color: 'text-gray-400' };
              const isUrgent = b.paymentStatus === 'pending' && b.status !== 'cancelled' && b.status !== 'rejected';
              const dueAmount = b.totalAmount && b.paidAmount != null ? b.totalAmount - b.paidAmount : null;

              return (
                <AnimateIn key={b.id} delay={80 + index * 40}>
                  <Link
                    href={`/vendor/direct-bookings/${b.id}`}
                    className={`group flex items-stretch bg-white rounded-2xl border border-gray-200/80 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}
                  >
                    {/* Left status bar */}
                    <div className={`w-1.5 shrink-0 ${sc.bar}`} />

                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                      <div className="flex items-start justify-between gap-3">

                        {/* Left content */}
                        <div className="flex-1 min-w-0 space-y-2">

                          {/* Row 1: Name + badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-[15px]">{b.customerName}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                            {b.bookingSource === 'shared_form' && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold">
                                <Link2 className="w-3 h-3" /> Form
                              </span>
                            )}
                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold animate-pulse">
                                ₹ Due
                              </span>
                            )}
                          </div>

                          {/* Row 2: service + vehicle */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span className="font-medium">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</span>
                            {b.vehicleType && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="flex items-center gap-1">
                                  <Car className="w-3 h-3 text-gray-400" /> {b.vehicleType}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Row 3: Date + location */}
                          {(b.pickupDate || b.pickupLocation) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              {b.pickupDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-emerald-400" />
                                  {formatDate(b.pickupDate)}
                                  {b.returnDate && <span className="text-gray-400"> → {formatDate(b.returnDate)}</span>}
                                </span>
                              )}
                              {b.pickupLocation && (
                                <>
                                  {b.pickupDate && <span className="text-gray-300">·</span>}
                                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="truncate">{b.pickupLocation}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Row 4: Amount */}
                          <div className="flex items-center gap-2">
                            {b.totalAmount ? (
                              <span className="text-sm font-bold text-gray-900">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                            ) : null}
                            <span className={`text-xs font-semibold ${pc.color}`}>{pc.label}</span>
                            {b.paymentStatus === 'partial' && dueAmount && dueAmount > 0 && (
                              <span className="text-xs text-orange-500 font-medium">(₹{dueAmount.toLocaleString('en-IN')} due)</span>
                            )}
                          </div>
                        </div>

                        {/* Right: booking # + arrow */}
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
        )}
      </div>
    </div>
  );
}
