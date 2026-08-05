'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bike, Bus, Car, Package, Truck, Compass, Star, BookOpen, Layers,
  Search, X, ChevronRight, Calendar, IndianRupee,
  Clock, CheckCircle2, AlertCircle, Zap, RotateCcw, RefreshCw,
  Loader2, Filter, ArrowUpDown, ChevronLeft,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface Booking {
  id: string; bookingNumber: string;
  service: string; serviceKey: string;
  customerName: string; customerPhone: string;
  totalAmount: number; paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  rawStatus: string; status: 'new' | 'active' | 'completed' | 'cancelled';
  tripDate: string | null; createdAt: string;
  detailUrl: string;
}
interface ServiceOption { key: string; label: string; count: number; }
interface Counts { all: number; new: number; active: number; completed: number; cancelled: number; }

// ── Config ───────────────────────────────────────────────────────
const SVC_ICON: Record<string, any> = {
  bike:    Bike, bus: Bus, car: Car, luxury: Star,
  packers: Package, truck: Truck, wander: Compass, direct: BookOpen,
};
const SVC_COLOR: Record<string, string> = {
  bike:    'bg-orange-500', bus:     'bg-blue-500',
  car:     'bg-violet-500', luxury:  'bg-amber-500',
  packers: 'bg-teal-500',   truck:   'bg-red-500',
  wander:  'bg-emerald-500', direct: 'bg-indigo-500',
};
const SVC_LIGHT: Record<string, string> = {
  bike:    'bg-orange-50 text-orange-700 border-orange-200',
  bus:     'bg-blue-50 text-blue-700 border-blue-200',
  car:     'bg-violet-50 text-violet-700 border-violet-200',
  luxury:  'bg-amber-50 text-amber-700 border-amber-200',
  packers: 'bg-teal-50 text-teal-700 border-teal-200',
  truck:   'bg-red-50 text-red-700 border-red-200',
  wander:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  direct:  'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const STATUS_CFG = {
  new:       { label: 'New',       badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    icon: Clock },
  active:    { label: 'Active',    badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500',  icon: Zap },
  completed: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500',     icon: AlertCircle },
};
const PAY_CFG = {
  paid:    { label: 'Paid',    color: 'text-emerald-600' },
  partial: { label: 'Partial', color: 'text-blue-600' },
  pending: { label: 'Due',     color: 'text-amber-600' },
};

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const TAB_ORDER = ['all', 'new', 'active', 'completed', 'cancelled'] as const;
const TAB_LABELS: Record<string, string> = { all: 'All', new: 'New', active: 'Active', completed: 'Completed', cancelled: 'Cancelled' };

export default function AllBookingsPage() {
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [counts,     setCounts]     = useState<Counts>({ all: 0, new: 0, active: 0, completed: 0, cancelled: 0 });
  const [services,   setServices]   = useState<ServiceOption[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [limit,      setLimit]      = useState(10);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<typeof TAB_ORDER[number]>('all');
  const [svcFilter,  setSvcFilter]  = useState('');
  const [search,     setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true); else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (tab !== 'all')  params.set('status',  tab);
      if (svcFilter)      params.set('service', svcFilter);
      if (search)         params.set('q',       search);
      if (page > 1)       params.set('page',    String(page));
      params.set('limit', String(pageSize));
      const res  = await fetch(`/api/vendor/all-bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      setBookings(data.bookings || []);
      setCounts(data.counts   || { all: 0, new: 0, active: 0, completed: 0, cancelled: 0 });
      setServices(data.services || []);
      setTotal(data.total || 0);
      setLimit(data.limit || pageSize);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [tab, svcFilter, search, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  // Any filter or page-size change invalidates the current page
  useEffect(() => { setPage(1); }, [tab, svcFilter, search, pageSize]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5 pb-10">

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 10% 60%, #6366f1 0%, transparent 50%), radial-gradient(circle at 90% 20%, #0ea5e9 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">All Services</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">All Bookings</h1>
            <p className="text-slate-400 text-sm">Every booking across all your approved services in one place</p>
          </div>

          {/* Summary pills */}
          <div className="flex gap-3 shrink-0 flex-wrap">
            {[
              { label: 'Total',     value: counts.all,       color: 'bg-white/10 border-white/15 text-white' },
              { label: 'New',       value: counts.new,       color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
              { label: 'Active',    value: counts.active,    color: 'bg-violet-500/20 border-violet-400/30 text-violet-300' },
              { label: 'Completed', value: counts.completed, color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${s.color}`}>
                <span className="text-xl font-black">{loading ? '—' : s.value}</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 opacity-80">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: Service filter (sticky) ── */}
        <div className="w-56 xl:w-64 shrink-0 sticky top-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-bold text-gray-700">By Service</span>
              </div>
              {svcFilter && (
                <button onClick={() => setSvcFilter('')} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">Clear</button>
              )}
            </div>
            <div className="p-2">
              <button
                onClick={() => setSvcFilter('')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-1 ${
                  !svcFilter ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  All Services
                </div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${!svcFilter ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {counts.all}
                </span>
              </button>

              {services.map(svc => {
                const Icon = SVC_ICON[svc.key] ?? Zap;
                const isSel = svcFilter === svc.key;
                return (
                  <button
                    key={svc.key}
                    onClick={() => setSvcFilter(isSel ? '' : svc.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-0.5 ${
                      isSel
                        ? `${SVC_LIGHT[svc.key] ?? 'bg-gray-100 text-gray-700 border-gray-200'} border`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${SVC_COLOR[svc.key] ?? 'bg-gray-400'}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="truncate">{svc.label}</span>
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${isSel ? 'bg-white/60' : 'bg-gray-100 text-gray-500'}`}>
                      {svc.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Bookings ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Status tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shrink-0 flex-wrap">
              {TAB_ORDER.map(t => {
                const cfg = t === 'all' ? null : STATUS_CFG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                    {TAB_LABELS[t]}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      tab === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                    }`}>{counts[t]}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, booking no, phone…"
                className="w-full pl-9 pr-9 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => load({ quiet: true })}
              disabled={refreshing}
              className="shrink-0 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Bookings table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-44 bg-gray-100 rounded" />
                      <div className="h-2.5 w-28 bg-gray-50 rounded" />
                    </div>
                    <div className="h-8 w-20 bg-gray-100 rounded-xl" />
                    <div className="h-4 w-16 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Layers className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No bookings found</p>
                <p className="text-xs text-gray-400 mt-1">Try changing the filter or search term</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Service</span>
                  <span>Customer</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Trip Date</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {bookings.map(b => {
                    const Icon     = SVC_ICON[b.serviceKey] ?? Zap;
                    const stCfg    = STATUS_CFG[b.status];
                    const payCfg   = PAY_CFG[b.paymentStatus];
                    const balance  = Math.max(0, b.totalAmount - b.paidAmount);
                    const StatusIcon = stCfg.icon;

                    return (
                      <Link
                        key={b.id}
                        href={b.detailUrl}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* Service icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${SVC_COLOR[b.serviceKey] ?? 'bg-gray-400'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        {/* Customer info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.customerName}</p>
                            <span className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${SVC_LIGHT[b.serviceKey] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {b.service}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400">{b.bookingNumber}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">{fmt(b.totalAmount)}</p>
                          {balance > 0
                            ? <p className={`text-[10px] font-semibold ${payCfg.color}`}>{fmt(balance)} due</p>
                            : <p className="text-[10px] text-emerald-600 font-semibold">Paid ✓</p>
                          }
                        </div>

                        {/* Trip date */}
                        <div className="text-right shrink-0">
                          {b.tripDate ? (
                            <>
                              <p className="text-xs font-semibold text-gray-700">
                                {new Date(b.tripDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(b.tripDate).getFullYear()}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-300">—</p>
                          )}
                        </div>

                        {/* Status + arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl ${stCfg.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {stCfg.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">
                    Showing {(page - 1) * limit + 1}–{(page - 1) * limit + bookings.length} of {total} bookings
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      Per page
                      <select
                        value={pageSize}
                        onChange={e => setPageSize(Number(e.target.value))}
                        className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[10, 20, 50, 100].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold text-gray-600 px-2">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
