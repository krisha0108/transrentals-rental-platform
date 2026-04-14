'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Package,
  Download,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Wallet,
  Filter,
  CalendarDays,
  Activity,
  Landmark,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedJobs: number;
  averagePerJob: number;
}

interface Transaction {
  id: string;
  bookingNumber: string;
  customerName: string;
  shiftingType: string;
  route: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'processing';
  date: string;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 485000,
  thisMonth: 78500,
  lastMonth: 65200,
  pendingPayout: 32500,
  completedJobs: 42,
  averagePerJob: 11547,
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    bookingNumber: 'PM-BK-2024-0003',
    customerName: 'Rajesh Kumar',
    shiftingType: 'Home',
    route: 'Delhi → Noida',
    amount: 8500,
    commission: 850,
    netAmount: 7650,
    status: 'completed',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '2',
    bookingNumber: 'PM-BK-2024-0004',
    customerName: 'Vikram Singh',
    shiftingType: 'Office',
    route: 'Gurgaon → Delhi',
    amount: 45000,
    commission: 4500,
    netAmount: 40500,
    status: 'completed',
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: '3',
    bookingNumber: 'PM-BK-2024-0001',
    customerName: 'Priya Sharma',
    shiftingType: 'Home',
    route: 'Bangalore → Chennai',
    amount: 18500,
    commission: 1850,
    netAmount: 16650,
    status: 'pending',
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id: '4',
    bookingNumber: 'PM-BK-2024-0002',
    customerName: 'TechStart Solutions',
    shiftingType: 'Office',
    route: 'Mumbai → Pune',
    amount: 28000,
    commission: 2800,
    netAmount: 25200,
    status: 'processing',
    date: new Date(Date.now() + 10 * 86400000).toISOString(),
  },
];

// Sparkline data (visual only)
const SPARK_TOTAL = [82, 91, 78, 112, 98, 124, 105, 142, 118, 136, 152, 148];
const SPARK_MONTH = [21, 34, 28, 42, 39, 51, 46, 58, 42, 62, 54, 68];
const SPARK_PENDING = [22, 18, 31, 24, 19, 28, 32, 21, 38, 26, 34, 29];
const SPARK_AVG = [12, 13.5, 12.8, 14.2, 13.8, 15.2, 14.6, 15.8, 15.1, 16.2, 15.4, 15.8];

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

// ── Fade-in ──
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)', transition: `opacity .55s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .55s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Donut chart ──
function DonutChart({ data, size = 200 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnimated(true), 200); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = 18;
  const radius = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;
  let cumulative = 0;
  return (
    <svg ref={ref} width={size} height={size} className="-rotate-90 overflow-visible">
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`pkr-donut-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={d.color} stopOpacity="1" />
            <stop offset="100%" stopColor={d.color} stopOpacity="0.75" />
          </linearGradient>
        ))}
        <filter id="pkr-donut-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <g filter="url(#pkr-donut-shadow)">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = Math.max(pct * circumference - gap, 0);
          const startOffset = -cumulative;
          cumulative += pct * circumference;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={`url(#pkr-donut-grad-${i})`}
              strokeWidth={animated ? stroke : 0}
              strokeDasharray={`${animated ? dash : 0} ${circumference}`}
              strokeDashoffset={startOffset}
              strokeLinecap="round"
              style={{ transition: `stroke-dasharray 1.1s cubic-bezier(.34,1.56,.64,1) ${i * 180}ms, stroke-width .5s cubic-bezier(.34,1.56,.64,1) ${i * 180}ms` }}
            />
          );
        })}
      </g>
    </svg>
  );
}

// ── Sparkline ──
function Sparkline({ data, color = '#10b981', width = 72, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  const areaPath = [`${pad},${height - pad}`, ...pts, `${width - pad},${height - pad}`].join(' ');
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg width={width} height={height} className="overflow-visible sparkline-svg">
      <defs>
        <linearGradient id={`pkr-spk-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPath} fill={`url(#pkr-spk-${color.replace('#', '')})`} className="sparkline-area" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sparkline-line" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} className="sparkline-dot" />
    </svg>
  );
}

export default function VendorPackersEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    setTimeout(() => {
      setSummary(SAMPLE_SUMMARY);
      setTransactions(SAMPLE_TRANSACTIONS);
      setIsLoading(false);
    }, 500);
  }, []);

  const growthPercent = summary
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
    : '0';
  const isPositiveGrowth = summary ? summary.thisMonth >= summary.lastMonth : true;

  // Animated counters
  const totalEarnings = useCountUp(summary?.totalEarnings ?? 0, 1600);
  const thisMonth = useCountUp(summary?.thisMonth ?? 0, 1400);
  const pendingPayout = useCountUp(summary?.pendingPayout ?? 0, 1200);
  const avgPerJob = useCountUp(summary?.averagePerJob ?? 0, 1000);

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-emerald-100 ${shimmer}`} />
            <div className="space-y-1.5">
              <div className={`h-5 w-32 bg-gray-200 rounded ${shimmer}`} />
              <div className={`h-3 w-44 bg-gray-100 rounded ${shimmer}`} />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className={`h-9 w-32 bg-gray-100 rounded-lg ${shimmer}`} />
            <div className={`h-9 w-24 bg-gray-100 rounded-lg ${shimmer}`} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-36 bg-white border border-gray-100 rounded-2xl p-5 ${shimmer}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" />
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-7 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className={`h-5 w-44 bg-gray-100 rounded ${shimmer}`} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-14 bg-gray-50 rounded-xl ${shimmer}`} />
          ))}
        </div>
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
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Earnings</h1>
              <p className="text-xs text-gray-400 mt-0.5">Track your packers & movers revenue</p>
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
                <option value="last-3-months">Last 3 Months</option>
                <option value="all-time">All Time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
            <Button variant="outline" className="h-9 px-4 rounded-lg text-sm font-medium border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all">
              <Download className="w-3.5 h-3.5 mr-2" />
              Export
            </Button>
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
              <div className="mt-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline data={SPARK_TOTAL} color="#ffffff" width={80} height={26} />
              </div>
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
            <div className="mt-2 flex items-end justify-between">
              <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline data={SPARK_MONTH} color="#3b82f6" width={72} height={22} />
              </div>
              <p className="text-[10px] text-gray-400">vs ₹{summary?.lastMonth.toLocaleString()}</p>
            </div>
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
            <div className="mt-2 flex items-end justify-between">
              <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline data={SPARK_PENDING} color="#f97316" width={72} height={22} />
              </div>
              <p className="text-[10px] text-gray-400">Mon payout</p>
            </div>
          </div>
        </FadeIn>

        {/* Avg per Job */}
        <FadeIn delay={270}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 mb-1">Avg Per Job</p>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              <span className="text-lg text-gray-300">₹</span>{avgPerJob.toLocaleString()}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline data={SPARK_AVG} color="#8b5cf6" width={72} height={22} />
              </div>
              <p className="text-[10px] text-gray-400">{summary?.completedJobs} jobs</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Main Content (8/4 split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ── Recent Transactions ── */}
      <FadeIn delay={180} className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{transactions.length}</span>
          </div>

          <div>
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className="px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group"
                style={{ animation: 'fadeSlideUp .45s ease both', animationDelay: `${280 + i * 55}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-200">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:animate-[bounceArrow_.4s_ease]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.customerName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center flex-wrap gap-x-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{tx.bookingNumber}</span>
                      <span>{tx.shiftingType}</span>
                      <span>·</span>
                      <span className="truncate">{tx.route}</span>
                    </p>
                  </div>
                  <div className="hidden sm:block shrink-0 text-xs text-gray-400 w-24 text-center">
                    {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="shrink-0 text-right min-w-[110px]">
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">+₹{tx.netAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                      ₹{tx.amount.toLocaleString()} · Fee ₹{tx.commission.toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      tx.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : tx.status === 'pending'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-blue-600'
                    )}>
                      {tx.status === 'completed' && <CheckCircle className="w-2.5 h-2.5" />}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 text-center">
            <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              View All Transactions
            </button>
          </div>
        </div>
      </FadeIn>

      {/* ── Earnings Share — Donut ── */}
      <FadeIn delay={300} className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Earnings Share</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">By shifting type</p>
          </div>
          <div className="p-5">
            {(() => {
              const groups = transactions.reduce<Record<string, { name: string; value: number; jobs: number }>>((acc, tx) => {
                const key = tx.shiftingType;
                if (!acc[key]) acc[key] = { name: key, value: 0, jobs: 0 };
                acc[key].value += tx.netAmount;
                acc[key].jobs += 1;
                return acc;
              }, {});
              const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'];
              const items = Object.values(groups).map((g, i) => ({ ...g, color: palette[i % palette.length] }));
              const total = items.reduce((s, x) => s + x.value, 0);
              return (
                <>
                  <div className="relative flex items-center justify-center mb-4">
                    <DonutChart data={items.map((g) => ({ name: g.name, value: g.value, color: g.color }))} size={200} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                      <p className="text-lg font-extrabold text-gray-900 tabular-nums">₹{total.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((g) => {
                      const pct = total ? ((g.value / total) * 100).toFixed(0) : '0';
                      return (
                        <div key={g.name} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                            <span className="flex-1 truncate text-gray-700 font-medium">{g.name}</span>
                            <span className="text-gray-400 tabular-nums shrink-0">{pct}%</span>
                            <span className="text-gray-900 font-semibold tabular-nums shrink-0 w-20 text-right">₹{g.value.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-4 mt-0.5 text-[10px] text-gray-400">
                            <span>{g.jobs} {g.jobs === 1 ? 'job' : 'jobs'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </FadeIn>

      </div>

      {/* ── Payout Info ── */}
      <FadeIn delay={300}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Payout Information</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Payouts are processed every Monday. Completed jobs from the previous week will be credited
                to your registered bank account within 2-3 business days. A 10% platform commission is
                deducted from each booking.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
        @keyframes bounceArrow {
          0%, 100% { transform: translate(0, 0); }
          40% { transform: translate(2px, -2px); }
          70% { transform: translate(0, 0); }
        }
        .sparkline-line {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawLine 1.2s ease forwards;
          animation-delay: 0.6s;
        }
        .sparkline-area {
          opacity: 0;
          animation: fadeIn 0.5s ease forwards;
          animation-delay: 1.4s;
        }
        .sparkline-dot {
          opacity: 0;
          animation: popDot 0.3s ease forwards;
          animation-delay: 1.8s;
        }
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes popDot {
          0% { opacity: 0; r: 0; }
          60% { r: 3.5; }
          100% { opacity: 1; r: 2.5; }
        }
      `}</style>
    </div>
  );
}
