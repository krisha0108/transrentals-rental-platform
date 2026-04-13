'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  CalendarDays,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Animated counter ──
function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setCount(target); return; }
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick); else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

// ── Fade-in on scroll ──
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity .55s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .55s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedRentals: number;
  averagePerRental: number;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 875000,
  thisMonth: 145000,
  lastMonth: 125000,
  pendingPayout: 62500,
  completedRentals: 24,
  averagePerRental: 36458,
};

export default function VendorEquipmentEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    setTimeout(() => {
      setSummary(SAMPLE_SUMMARY);
      setIsLoading(false);
    }, 500);
  }, []);

  const growthPercent = summary
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
    : '0';
  const isPositiveGrowth = summary ? summary.thisMonth >= summary.lastMonth : true;

  // Animated counters
  const totalEarnings = useCountUp(summary?.totalEarnings || 0, 1600);
  const thisMonth = useCountUp(summary?.thisMonth || 0, 1400);
  const pendingPayout = useCountUp(summary?.pendingPayout || 0, 1200);
  const avgPerRental = useCountUp(summary?.averagePerRental || 0, 1000);

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-emerald-100 ${shimmer}`} />
            <div className="space-y-1.5">
              <div className={`h-5 w-44 bg-gray-200 rounded ${shimmer}`} />
              <div className={`h-3 w-52 bg-gray-100 rounded ${shimmer}`} />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className={`h-9 w-32 bg-gray-100 rounded-lg ${shimmer}`} />
            <div className={`h-9 w-24 bg-gray-100 rounded-lg ${shimmer}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-32 bg-white border border-gray-100 rounded-2xl p-5 ${shimmer}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" />
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-7 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className={`h-20 bg-emerald-50 border border-emerald-100 rounded-xl ${shimmer}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25 overflow-hidden group/icon cursor-default">
              <div className="absolute inset-0 -translate-x-full group-hover/icon:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute inset-0 rounded-xl animate-[iconPulse_3s_ease-in-out_infinite] bg-emerald-400/20" />
              <Wallet className="w-5 h-5 text-white relative z-10 animate-[walletBob_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Equipment Earnings</h1>
              <p className="text-xs text-gray-400 mt-0.5">Track your rental revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none h-9 pl-3.5 pr-9 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="all-time">All Time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
            <button className="h-9 px-4 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all flex items-center gap-2 bg-white">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </FadeIn>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <FadeIn delay={60}>
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white h-full hover:shadow-lg hover:shadow-emerald-500/15 hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">All Time</span>
              </div>
              <p className="text-xs font-medium text-white/70 mb-1">Total Earnings</p>
              <p className="text-3xl font-extrabold tracking-tight tabular-nums">
                <span className="text-xl opacity-60">₹</span>{totalEarnings.toLocaleString()}
              </p>
              <p className="text-[11px] text-white/70 mt-1">{summary?.completedRentals} rentals completed</p>
            </div>
          </div>
        </FadeIn>

        {/* This Month */}
        <FadeIn delay={130}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                isPositiveGrowth ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              )}>
                {isPositiveGrowth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {growthPercent}%
              </span>
            </div>
            <p className="text-xs font-medium text-gray-400 mb-1">This Month</p>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              <span className="text-lg text-gray-300">₹</span>{thisMonth.toLocaleString()}
            </p>
          </div>
        </FadeIn>

        {/* Pending Payout */}
        <FadeIn delay={200}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-gray-400 mb-1">Pending Payout</p>
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
              <span className="text-lg opacity-50">₹</span>{pendingPayout.toLocaleString()}
            </p>
          </div>
        </FadeIn>

        {/* Avg per Rental */}
        <FadeIn delay={270}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 mb-1">Avg. per Rental</p>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              <span className="text-lg text-gray-300">₹</span>{avgPerRental.toLocaleString()}
            </p>
          </div>
        </FadeIn>
      </div>

      {/* Payout Information */}
      <FadeIn delay={340}>
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
          <h3 className="font-semibold text-emerald-800 mb-1.5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Payout Information
          </h3>
          <p className="text-xs text-emerald-700">
            Payouts are processed weekly. A 10% platform commission is deducted from each rental.
          </p>
        </div>
      </FadeIn>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes walletBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-2px) rotate(-5deg); }
          40% { transform: translateY(0) rotate(0deg); }
          60% { transform: translateY(-1.5px) rotate(4deg); }
          80% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes iconPulse {
          0%, 70%, 100% { transform: scale(1); opacity: 0; }
          20% { transform: scale(1.35); opacity: 0.25; }
          40% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes iconJiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          50% { transform: rotate(6deg); }
          75% { transform: rotate(-4deg); }
        }
      `}</style>
    </div>
  );
}
