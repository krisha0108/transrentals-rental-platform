'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, IndianRupee, AlertCircle,
  Loader2, ChevronRight, Clock, CheckCircle2,
} from 'lucide-react';

interface Summary {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  totalExpenses: number;
  netEarnings: number;
  bookingCount: number;
  expenseCount: number;
}
interface PendingBooking {
  id: string; bookingNumber: string;
  customerName: string; customerPhone: string;
  serviceType: string; status: string;
  totalAmount: number; paidAmount: number;
  balanceDue: number; paymentStatus: string;
  createdAt: string;
}
interface ExpenseItem { category: string; amount: number; }

const EXPENSE_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  fuel:           { label: 'Fuel',           emoji: '⛽' },
  driver_payment: { label: 'Driver Payment',  emoji: '👤' },
  toll:           { label: 'Toll',            emoji: '🛣️' },
  parking:        { label: 'Parking',         emoji: '🅿️' },
  maintenance:    { label: 'Maintenance',     emoji: '🔧' },
  cleaning:       { label: 'Cleaning',        emoji: '🧹' },
  other:          { label: 'Other',           emoji: '📋' },
};

const SERVICE_LABELS: Record<string, string> = {
  bike: '🏍️ Bike', bus: '🚌 Bus', 'car-with-driver': '🚗 Car',
  'self-drive': '🚙 Self-Drive', luxury: '✨ Luxury',
  transporter: '🚛 Truck', 'packers-movers': '📦 Packers',
  equipment: '🔧 Equipment', general: '📋 General',
};

function fmt(n: number) { return n.toLocaleString('en-IN'); }

// Generate last 6 months for the month selector
function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    months.push({ val, label });
  }
  return months;
}

export default function FinancialsPage() {
  const months = getLast6Months();
  const [selectedMonth, setSelectedMonth] = useState(months[0].val);
  const [summary, setSummary]             = useState<Summary | null>(null);
  const [pending, setPending]             = useState<PendingBooking[]>([]);
  const [breakdown, setBreakdown]         = useState<ExpenseItem[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = (month: string) => {
    setLoading(true);
    fetch(`/api/vendor/financials?month=${month}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setSummary(d.summary);
        setPending(d.pendingBookings || []);
        setBreakdown(d.expenseBreakdown || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(selectedMonth); }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <div className="w-full">

        {/* Alive emerald finance header — P2P level energy */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 mb-5 shadow-xl text-white"
             style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 30%, #0d9488 60%, #059669 100%)', backgroundSize: '300% 300%', animation: 'gradient-x 8s ease infinite, fade-up 0.6s ease-out both' }}>

          {/* Radial glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(255,255,255,0.12)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(6,182,212,0.2)_0%,_transparent_50%)]"></div>

          {/* Grid texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {/* Big filled floating bubbles (right) */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/8 rounded-full" style={{ animation: 'float-slow 5s ease-in-out infinite' }}></div>
          <div className="absolute top-4 right-10 w-20 h-20 bg-white/10 rounded-full blur-sm" style={{ animation: 'float-rev 4s ease-in-out infinite' }}></div>
          <div className="absolute top-14 right-3 w-10 h-10 bg-white/12 rounded-full" style={{ animation: 'float-slow 6s ease-in-out infinite 0.5s' }}></div>
          <div className="absolute -top-3 right-24 w-8 h-8 bg-white/6 rounded-full" style={{ animation: 'bubble-drift 7s ease-in-out infinite' }}></div>

          {/* Left floating rings */}
          <div className="absolute -bottom-6 -left-6 w-28 h-28 border-2 border-white/8 rounded-full" style={{ animation: 'float-rev 7s ease-in-out infinite 1s' }}></div>
          <div className="absolute top-2 left-1/3 w-12 h-12 border border-white/5 rounded-full" style={{ animation: 'float-slow 8s ease-in-out infinite' }}></div>

          {/* Sparkle constellation */}
          {[
            { t: '10%', l: '50%', d: '0s', s: 'w-1.5 h-1.5' },
            { t: '30%', l: '70%', d: '1s', s: 'w-1 h-1' },
            { t: '60%', l: '85%', d: '2s', s: 'w-1 h-1' },
            { t: '20%', l: '35%', d: '1.5s', s: 'w-1 h-1' },
            { t: '75%', l: '55%', d: '0.5s', s: 'w-1.5 h-1.5' },
            { t: '45%', l: '92%', d: '2.5s', s: 'w-1 h-1' },
          ].map((s, i) => (
            <div key={i} className={`absolute ${s.s} bg-white rounded-full`} style={{ top: s.t, left: s.l, animation: `sparkle 3s ease-in-out ${s.d} infinite` }}></div>
          ))}

          {/* Rising bubbles — more of them */}
          <div className="absolute bottom-0 left-[10%] w-2.5 h-2.5 rounded-full bg-white/15" style={{ animation: 'bubble-rise-1 3.5s ease-in-out infinite' }}></div>
          <div className="absolute bottom-0 left-[25%] w-2 h-2 rounded-full bg-white/20" style={{ animation: 'bubble-rise-2 4.5s ease-in-out 0.8s infinite' }}></div>
          <div className="absolute bottom-0 left-[40%] w-1.5 h-1.5 rounded-full bg-white/15" style={{ animation: 'bubble-drift 5.5s ease-in-out 1.5s infinite' }}></div>
          <div className="absolute bottom-0 left-[55%] w-2 h-2 rounded-full bg-white/10" style={{ animation: 'bubble-rise-1 4s ease-in-out 0.3s infinite' }}></div>
          <div className="absolute bottom-0 left-[70%] w-3 h-3 rounded-full bg-white/8" style={{ animation: 'bubble-rise-2 5s ease-in-out 2s infinite' }}></div>
          <div className="absolute bottom-0 left-[85%] w-1.5 h-1.5 rounded-full bg-white/15" style={{ animation: 'bubble-drift 6s ease-in-out 1s infinite' }}></div>

          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer-sweep 3.5s ease-in-out infinite' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4" style={{ animation: 'slide-in-left 0.5s ease-out 0.2s both' }}>
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg" style={{ animation: 'bounce-in 0.6s ease-out 0.15s both' }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">Financials</h1>
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">Earnings, expenses &amp; pending payments</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3" style={{ animation: 'fade-up 0.5s ease-out 0.4s both' }}>
              <div className="text-right px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 shadow-lg">
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Period</p>
                <p className="text-sm font-extrabold text-white">{selectedMonth || 'All Time'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month filter */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-emerald-200/60 px-5 py-4 mb-4"
             style={{ animation: 'fade-up 0.6s ease-out 0.1s both' }}>
          <label className="block text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-2">Filter by Month</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full border border-emerald-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="">All Time</option>
            {months.map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          /* Shimmer skeleton */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 animate-pulse">
                  <div className="h-2.5 w-20 bg-emerald-100 rounded-full mb-3" />
                  <div className="h-6 w-24 bg-emerald-50 rounded-lg mb-2" />
                  <div className="h-2 w-16 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 animate-pulse">
              <div className="h-3 w-28 bg-emerald-100 rounded-full mb-4" />
              <div className="space-y-3">
                {[0,1,2].map(i => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <div className="h-3 w-20 bg-gray-100 rounded-full" />
                      <div className="h-3 w-16 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 animate-pulse">
              <div className="h-3 w-32 bg-emerald-100 rounded-full mb-4" />
              {[0,1].map(i => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 bg-gray-100 rounded-full" />
                    <div className="h-2 w-20 bg-gray-50 rounded-full" />
                  </div>
                  <div className="h-4 w-14 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : summary ? (
          <>
            {/* Summary cards — alive + animated */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Total Revenue', value: summary.totalRevenue, sub: `${summary.bookingCount} bookings`, icon: IndianRupee, gradient: 'from-emerald-500 to-emerald-600', color: 'text-emerald-600', glow: 'hover:shadow-emerald-200/60', tint: 'bg-emerald-50', delay: '0.15s' },
                { label: 'Collected', value: summary.totalCollected, sub: 'Cash in hand', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', color: 'text-emerald-600', glow: 'hover:shadow-emerald-200/60', tint: 'bg-emerald-50', delay: '0.25s' },
                { label: 'Pending Dues', value: summary.totalPending, sub: `${pending.length} bookings`, icon: Clock, gradient: 'from-amber-400 to-orange-500', color: 'text-amber-500', glow: 'hover:shadow-amber-200/60', tint: 'bg-amber-50', delay: '0.35s' },
                { label: 'Total Expenses', value: summary.totalExpenses, sub: `${summary.expenseCount} entries`, icon: TrendingDown, gradient: 'from-red-400 to-rose-500', color: 'text-red-500', glow: 'hover:shadow-red-200/60', tint: 'bg-red-50', delay: '0.45s' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label}
                    className={`group relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5 hover:shadow-xl ${card.glow} hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100/50 hover:border-emerald-200/50`}
                    style={{ animation: `fade-up 0.5s ease-out ${card.delay} both` }}>
                    {/* Background decorative blob */}
                    <div className={`absolute -right-4 -top-4 w-20 h-20 ${card.tint} rounded-full opacity-60 group-hover:scale-150 group-hover:opacity-80 transition-all duration-500`}></div>
                    {/* Shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className={`text-2xl sm:text-3xl font-extrabold ${card.color} group-hover:scale-105 origin-left transition-transform`}>₹{fmt(card.value)}</p>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">{card.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Net earnings banner */}
            <div className={`group relative rounded-2xl p-5 flex items-center justify-between mb-5 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all duration-300 ${summary.netEarnings >= 0 ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200' : 'bg-gradient-to-r from-red-50 via-white to-red-50 border border-red-200'}`}
                 style={{ animation: 'scale-in 0.5s ease-out 0.5s both' }}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-30 ${summary.netEarnings >= 0 ? 'bg-emerald-200' : 'bg-red-200'} group-hover:scale-150 transition-all duration-500`}></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Earnings</p>
                <p className="text-xs text-gray-400 mt-0.5">Collected − Expenses</p>
              </div>
              <div className="flex items-center gap-2">
                {summary.netEarnings >= 0
                  ? <TrendingUp className="w-5 h-5 text-emerald-500" />
                  : <TrendingDown className="w-5 h-5 text-red-500" />
                }
                <p className={`text-2xl sm:text-3xl font-extrabold ${summary.netEarnings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {summary.netEarnings >= 0 ? '+' : ''}₹{fmt(summary.netEarnings)}
                </p>
              </div>
            </div>

            {/* Expense breakdown */}
            {breakdown.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden mb-4"
                   style={{ animation: 'fade-up 0.5s ease-out 0.55s both' }}>
                <div className="bg-gradient-to-r from-emerald-50 to-white px-5 pt-5 pb-3">
                  <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">Expense Breakdown</p>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  {breakdown.map(item => {
                    const cat = EXPENSE_CATEGORIES[item.category] ?? { label: item.category, emoji: '📋' };
                    const pct = summary.totalExpenses > 0 ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
                    return (
                      <div key={item.category} className="hover:bg-emerald-50/30 rounded-lg px-1 py-0.5 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cat.emoji} {cat.label}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">₹{fmt(item.amount)}</span>
                            <span className="text-xs text-gray-400 ml-1.5 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending payments list */}
            {pending.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden mb-4"
                   style={{ animation: 'fade-up 0.5s ease-out 0.6s both' }}>
                <div className="bg-gradient-to-r from-emerald-50 to-white px-5 pt-5 pb-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">Pending Payments</p>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    {pending.length} due
                  </span>
                </div>
                <div className="divide-y divide-emerald-100/60">
                  {pending.map(b => (
                    <Link
                      key={b.id}
                      href={`/vendor/direct-bookings/${b.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-sm shrink-0">
                        {SERVICE_LABELS[b.serviceType]?.split(' ')[0] ?? '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.customerName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{b.bookingNumber}</span>
                          <span>·</span>
                          <span>{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-600">₹{fmt(b.balanceDue)}</p>
                        <p className="text-[10px] text-amber-500/70 font-medium">due</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && summary.bookingCount > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] mb-4"
                   style={{ animation: 'bounce-in 0.5s ease-out 0.55s both' }}>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">All payments collected for this period!</p>
              </div>
            )}

            {summary.bookingCount === 0 && (
              <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] mb-4"
                   style={{ animation: 'fade-up 0.5s ease-out 0.55s both' }}>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-500">No bookings found for this period.</p>
              </div>
            )}
          </>
        ) : null}

      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(6deg); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-5deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0.4; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0.3; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.4); }
        }
        @keyframes bubble-drift {
          0% { opacity: 0.25; transform: translateY(0) translateX(0) scale(1); }
          100% { opacity: 0; transform: translateY(-55px) translateX(10px) scale(0.3); }
        }
        @keyframes shimmer-sweep {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.15); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.3); }
        }
      `}</style>
    </div>
  );
}
