'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, IndianRupee, AlertCircle, Loader2,
  ChevronRight, Clock, CheckCircle2, ArrowUpRight, Wallet,
  BarChart3, CircleDollarSign, Filter, Search, X, Receipt,
  Bike, Bus, Car, Package, Truck, Compass, Star, Zap, BookOpen,
  TrendingUp as TrendUp, TrendingDown as TrendDown, ToggleLeft, ToggleRight,
  RotateCcw, Ban,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface Summary {
  totalRevenue: number; totalCollected: number; totalPending: number;
  totalExpenses: number; netEarnings: number;
  bookingCount: number; paidCount: number; pendingCount: number; partialCount: number;
}
interface ServiceRow { service: string; revenue: number; collected: number; pending: number; count: number; }
interface Booking {
  service: string; id: string; bookingNumber: string; customerName: string;
  totalAmount: number; paidAmount: number; balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  status: string; createdAt: string; detailUrl: string;
  expenses: number; netEarnings: number;
}
interface ExpenseItem { category: string; amount: number; }
interface Refund {
  service: string; id: string; bookingNumber: string; customerName: string;
  totalAmount: number; refundAmount: number; cancellationReason: string | null;
  cancelledAt: string | null; status: string; detailUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function getLast6Months() {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      val:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    });
  }
  return out;
}

const SERVICE_ICONS: Record<string, any> = {
  'Bike Rental':      Bike,
  'Bus & Tempo':      Bus,
  'Car Rental':       Car,
  'Luxury Cars':      Star,
  'Packers & Movers': Package,
  'Transporter':      Truck,
  'Wander Tours':     Compass,
  'Direct Booking':   BookOpen,
};
const SERVICE_COLORS: Record<string, string> = {
  'Bike Rental':      'bg-orange-500',
  'Bus & Tempo':      'bg-blue-500',
  'Car Rental':       'bg-violet-500',
  'Luxury Cars':      'bg-amber-500',
  'Packers & Movers': 'bg-teal-500',
  'Transporter':      'bg-red-500',
  'Wander Tours':     'bg-emerald-500',
  'Direct Booking':   'bg-indigo-500',
};
const SERVICE_LIGHT: Record<string, string> = {
  'Bike Rental':      'bg-orange-50 text-orange-700',
  'Bus & Tempo':      'bg-blue-50 text-blue-700',
  'Car Rental':       'bg-violet-50 text-violet-700',
  'Luxury Cars':      'bg-amber-50 text-amber-700',
  'Packers & Movers': 'bg-teal-50 text-teal-700',
  'Transporter':      'bg-red-50 text-red-700',
  'Wander Tours':     'bg-emerald-50 text-emerald-700',
  'Direct Booking':   'bg-indigo-50 text-indigo-700',
};

const EXPENSE_LABELS: Record<string, string> = {
  fuel: '⛽ Fuel', driver_payment: '👤 Driver', toll: '🛣️ Toll',
  parking: '🅿️ Parking', maintenance: '🔧 Maintenance',
  cleaning: '🧹 Cleaning', other: '📋 Other',
};

const PAY_STATUS = {
  paid:    { label: 'Collected',   badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  partial: { label: 'Partial',     badge: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  pending: { label: 'Pending',     badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
};

// ── Component ────────────────────────────────────────────────────
export default function FinancialsPage() {
  const months = getLast6Months();
  const [month,     setMonth]     = useState(months[0].val);
  const [summary,   setSummary]   = useState<Summary | null>(null);
  const [services,  setServices]  = useState<ServiceRow[]>([]);
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [expenses,  setExpenses]  = useState<ExpenseItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'all' | 'pending' | 'paid' | 'partial' | 'refunds'>('all');
  const [search,    setSearch]    = useState('');
  const [svcFilter, setSvcFilter] = useState('');
  const [showPL,    setShowPL]    = useState(false);
  const [refunds,   setRefunds]   = useState<Refund[]>([]);

  const load = (m: string) => {
    setLoading(true);
    fetch(`/api/vendor/financials?month=${m}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setSummary(d.summary);
        setServices(d.serviceBreakdown || []);
        setBookings(d.bookings || []);
        setExpenses(d.expenseBreakdown || []);
        setRefunds(d.refunds || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(month); }, [month]);

  const isRefundTab = tab === 'refunds';

  const filtered = useMemo(() => {
    if (isRefundTab) {
      if (!search.trim()) return refunds;
      const q = search.toLowerCase();
      return refunds.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.bookingNumber.toLowerCase().includes(q)
      );
    }
    let list = bookings;
    if (showPL) list = list.filter(b => b.service === 'Direct Booking');
    else {
      if (tab !== 'all') list = list.filter(b => b.paymentStatus === tab);
      if (svcFilter)     list = list.filter(b => b.service === svcFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.customerName.toLowerCase().includes(q) ||
        b.bookingNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, refunds, tab, svcFilter, search, showPL, isRefundTab]);

  const allServices = [...new Set(bookings.map(b => b.service))];

  return (
    <div className="space-y-5 pb-10">

      {/* ══════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 15% 60%, #10b981 0%, transparent 55%), radial-gradient(circle at 85% 15%, #3b82f6 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 sm:px-8 pt-7 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">All Services</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">Financial Overview</h1>
              <p className="text-slate-400 text-sm">Revenue, payments & P&L across all your services</p>
            </div>

            {/* Month selector */}
            <div className="shrink-0">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1.5">Period</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="" className="text-gray-900">All Time</option>
                {months.map(m => <option key={m.val} value={m.val} className="text-gray-900">{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* 4 stat cards */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Revenue',   value: summary.totalRevenue,   sub: `${summary.bookingCount} bookings`,  color: 'from-blue-400 to-blue-600',     icon: '💰' },
                { label: 'Collected',       value: summary.totalCollected, sub: `${summary.paidCount} paid`,          color: 'from-emerald-400 to-emerald-600', icon: '✅' },
                { label: 'Pending Dues',    value: summary.totalPending,   sub: `${summary.pendingCount + summary.partialCount} bookings`, color: 'from-amber-400 to-orange-500', icon: '⏳' },
                { label: 'Net Earnings',    value: summary.netEarnings,    sub: 'after expenses',                     color: summary.netEarnings >= 0 ? 'from-teal-400 to-emerald-600' : 'from-red-400 to-rose-600', icon: summary.netEarnings >= 0 ? '📈' : '📉' },
              ].map(s => (
                <div key={s.label} className="bg-white/8 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</span>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                    {fmt(s.value)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BODY — Left sidebar + Right main
      ══════════════════════════════════════════ */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: Service breakdown (sticky) ── */}
        <div className="w-64 xl:w-72 shrink-0 sticky top-6 space-y-4">

          {/* Service P&L cards */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">Revenue by Service</span>
            </div>
            <div className="p-3 space-y-2">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)
              ) : services.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
              ) : services.map(s => {
                const Icon = SERVICE_ICONS[s.service] ?? Zap;
                const pct  = s.revenue > 0 ? Math.round((s.collected / s.revenue) * 100) : 0;
                const isSel = svcFilter === s.service;
                return (
                  <button
                    key={s.service}
                    onClick={() => setSvcFilter(isSel ? '' : s.service)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSel ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${SERVICE_COLORS[s.service] ?? 'bg-gray-500'}`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{s.service}</p>
                        <p className="text-[9px] text-gray-400">{s.count} booking{s.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">{fmt(s.collected)} collected</span>
                      <span className="font-bold text-gray-800">{pct}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SERVICE_COLORS[s.service] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    {s.pending > 0 && (
                      <p className="text-[9px] text-amber-600 mt-1.5 font-semibold">{fmt(s.pending)} pending</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expense breakdown */}
          {expenses.length > 0 && summary && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-700">Expenses</span>
                <span className="ml-auto text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {fmt(summary.totalExpenses)}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {expenses.map(e => {
                  const pct = summary.totalExpenses > 0 ? Math.round((e.amount / summary.totalExpenses) * 100) : 0;
                  return (
                    <div key={e.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-600">{EXPENSE_LABELS[e.category] ?? e.category}</span>
                        <span className="text-[11px] font-bold text-gray-800">{fmt(e.amount)}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Bookings table ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Filters bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Tabs — hidden in P&L mode */}
            <div className={`flex gap-1 bg-gray-100 p-1 rounded-xl shrink-0 ${showPL ? 'opacity-40 pointer-events-none' : ''}`}>
              {([
                { key: 'all',     label: 'All',       count: bookings.length },
                { key: 'pending', label: 'Pending',   count: summary?.pendingCount ?? 0 },
                { key: 'partial', label: 'Partial',   count: summary?.partialCount ?? 0 },
                { key: 'paid',    label: 'Collected', count: summary?.paidCount ?? 0 },
                { key: 'refunds', label: 'Refunds',   count: summary?.refundCount ?? 0, red: true },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.key === 'refunds' && <RotateCcw className="w-3 h-3" />}
                  {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    tab === t.key
                      ? (t.key === 'refunds' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')
                      : (t.key === 'refunds' && t.count > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-200 text-gray-500')
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search customer or booking no…"
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* P&L toggle — hidden on refunds tab */}
            {!isRefundTab && <button
              onClick={() => setShowPL(p => !p)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                showPL
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {showPL
                ? <ToggleRight className="w-4 h-4" />
                : <ToggleLeft className="w-4 h-4" />
              }
              Personal
            </button>}

            {/* Active filter chip */}
            {svcFilter && (
              <button
                onClick={() => setSvcFilter('')}
                className={`shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${SERVICE_LIGHT[svcFilter] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {svcFilter} <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Bookings list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 bg-gray-100 rounded" />
                      <div className="h-2.5 w-24 bg-gray-50 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <IndianRupee className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  {showPL ? 'No direct bookings with expense data' : 'No bookings found'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Try changing the filter or month</p>
              </div>
            ) : isRefundTab ? (
              /* ══ REFUNDS VIEW ══ */
              <>
                {/* Refund summary strip */}
                {(() => {
                  const totalCancelled = (filtered as Refund[]).reduce((s, r) => s + r.totalAmount, 0);
                  const totalRefundAmt = (filtered as Refund[]).reduce((s, r) => s + r.refundAmount, 0);
                  return (
                    <div className="grid grid-cols-3 divide-x divide-red-100 bg-red-50 border-b border-red-100">
                      {[
                        { label: 'Cancelled Bookings', value: String(filtered.length),    color: 'text-gray-900' },
                        { label: 'Total Booking Value', value: fmt(totalCancelled),        color: 'text-gray-700' },
                        { label: 'Total Refund Amount', value: fmt(totalRefundAmt),        color: 'text-red-700' },
                      ].map(s => (
                        <div key={s.label} className="px-4 py-3 text-center">
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                          <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Refunds table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Booking</span>
                  <span className="text-right">Booking Value</span>
                  <span className="text-right text-red-500">Refund Due</span>
                  <span className="text-right">Cancelled On</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {(filtered as Refund[]).map(r => {
                    const Icon = SERVICE_ICONS[r.service] ?? Zap;
                    return (
                      <Link
                        key={r.id}
                        href={r.detailUrl}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                            <Ban className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{r.customerName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-400">{r.bookingNumber}</span>
                              <span className="text-gray-300">·</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SERVICE_LIGHT[r.service] ?? 'bg-gray-100 text-gray-600'}`}>
                                {r.service}
                              </span>
                            </div>
                            {r.cancellationReason && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[260px]">
                                Reason: {r.cancellationReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-500 line-through">{fmt(r.totalAmount)}</p>
                        </div>

                        <div className="text-right shrink-0">
                          {r.refundAmount > 0
                            ? <p className="text-sm font-black text-red-600">{fmt(r.refundAmount)}</p>
                            : <p className="text-xs text-gray-400">—</p>
                          }
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2 justify-end">
                          <p className="text-xs text-gray-500">
                            {r.cancelledAt
                              ? new Date(r.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                              : '—'
                            }
                          </p>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Refund footer */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500">{filtered.length} cancelled bookings</p>
                  <p className="text-sm font-black text-gray-400 line-through text-right">{fmt((filtered as Refund[]).reduce((s, r) => s + r.totalAmount, 0))}</p>
                  <p className="text-sm font-black text-red-600 text-right">{fmt((filtered as Refund[]).reduce((s, r) => s + r.refundAmount, 0))}</p>
                  <div />
                </div>
              </>
            ) : showPL ? (
              /* ══ P&L VIEW — Direct Bookings only ══ */
              <>
                {/* P&L summary strip */}
                {(() => {
                  const totalRevenue  = filtered.reduce((s, b) => s + b.totalAmount,  0);
                  const totalExpenses = filtered.reduce((s, b) => s + b.expenses,     0);
                  const totalCollected= filtered.reduce((s, b) => s + b.paidAmount,   0);
                  const totalPL       = totalCollected - totalExpenses;
                  return (
                    <div className="grid grid-cols-4 divide-x divide-violet-100 bg-violet-50 border-b border-violet-100">
                      {[
                        { label: 'Total Revenue',  value: fmt(totalRevenue),   color: 'text-gray-900' },
                        { label: 'Total Collected', value: fmt(totalCollected), color: 'text-emerald-700' },
                        { label: 'Total Expenses',  value: fmt(totalExpenses),  color: 'text-red-600' },
                        { label: 'Net Profit / Loss', value: (totalPL >= 0 ? '+' : '') + fmt(totalPL), color: totalPL >= 0 ? 'text-emerald-700' : 'text-red-600' },
                      ].map(s => (
                        <div key={s.label} className="px-4 py-3 text-center">
                          <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                          <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* P&L table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Booking</span>
                  <span className="text-right">Revenue</span>
                  <span className="text-right text-red-400">Expenses</span>
                  <span className="text-right text-emerald-500">Collected</span>
                  <span className="text-right text-violet-500">Profit / Loss</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {filtered.map(b => {
                    const Icon = SERVICE_ICONS[b.service] ?? Zap;
                    const pl  = b.paidAmount - b.expenses;
                    const pos = pl >= 0;
                    return (
                      <Link
                        key={b.id}
                        href={b.detailUrl}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${SERVICE_COLORS[b.service] ?? 'bg-gray-400'}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.customerName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-400">{b.bookingNumber}</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-[9px] text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">{fmt(b.totalAmount)}</p>
                        </div>

                        {/* Expenses */}
                        <div className="text-right shrink-0">
                          {b.expenses > 0
                            ? <p className="text-sm font-bold text-red-600">-{fmt(b.expenses)}</p>
                            : <p className="text-xs text-gray-300">—</p>
                          }
                        </div>

                        {/* Collected */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${b.paymentStatus === 'paid' ? 'text-emerald-600' : b.paymentStatus === 'partial' ? 'text-blue-600' : 'text-gray-400'}`}>
                            {fmt(b.paidAmount)}
                          </p>
                          {b.balanceDue > 0 && <p className="text-[10px] text-amber-600">{fmt(b.balanceDue)} due</p>}
                        </div>

                        {/* Profit / Loss */}
                        <div className="text-right shrink-0">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                            pos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {pos ? <TrendUp className="w-3 h-3" /> : <TrendDown className="w-3 h-3" />}
                            {pos ? '+' : ''}{fmt(pl)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* P&L footer */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500">{filtered.length} bookings</p>
                  <p className="text-sm font-black text-gray-900 text-right">{fmt(filtered.reduce((s, b) => s + b.totalAmount, 0))}</p>
                  <p className="text-sm font-black text-red-600 text-right">-{fmt(filtered.reduce((s, b) => s + b.expenses, 0))}</p>
                  <p className="text-sm font-black text-emerald-600 text-right">{fmt(filtered.reduce((s, b) => s + b.paidAmount, 0))}</p>
                  {(() => {
                    const pl = filtered.reduce((s, b) => s + b.paidAmount - b.expenses, 0);
                    return <p className={`text-sm font-black text-right ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{pl >= 0 ? '+' : ''}{fmt(pl)}</p>;
                  })()}
                </div>
              </>
            ) : (
              /* ══ NORMAL PAYMENT VIEW ══ */
              <>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Booking</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Collected</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-gray-50">
                  {filtered.map(b => {
                    const Icon = SERVICE_ICONS[b.service] ?? Zap;
                    const ps   = PAY_STATUS[b.paymentStatus];
                    return (
                      <Link
                        key={b.id}
                        href={b.detailUrl}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${SERVICE_COLORS[b.service] ?? 'bg-gray-400'}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.customerName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-400">{b.bookingNumber}</span>
                              <span className="text-gray-300">·</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SERVICE_LIGHT[b.service] ?? 'bg-gray-100 text-gray-600'}`}>
                                {b.service}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">{fmt(b.totalAmount)}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${b.paymentStatus === 'paid' ? 'text-emerald-600' : b.paymentStatus === 'partial' ? 'text-blue-600' : 'text-gray-400'}`}>
                            {fmt(b.paidAmount)}
                          </p>
                          {b.balanceDue > 0 && <p className="text-[10px] text-amber-600">{fmt(b.balanceDue)} due</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${ps.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                            {ps.label}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500">{filtered.length} bookings shown</p>
                  <p className="text-sm font-black text-gray-900 text-right">{fmt(filtered.reduce((s, b) => s + b.totalAmount, 0))}</p>
                  <p className="text-sm font-black text-emerald-600 text-right">{fmt(filtered.reduce((s, b) => s + b.paidAmount, 0))}</p>
                  <p className="text-sm font-black text-amber-600 text-right">{fmt(filtered.reduce((s, b) => s + b.balanceDue, 0))} due</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
