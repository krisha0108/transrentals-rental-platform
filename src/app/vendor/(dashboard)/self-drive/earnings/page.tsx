'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Download,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  Clock,
  Filter,
  Landmark,
  CalendarDays,
  Activity,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// ── Animated bar ──
function AnimatedBar({ percent, delay = 0 }: { percent: number; delay?: number }) {
  const [w, setW] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setW(percent), 120 + delay); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [percent, delay]);
  return (
    <div ref={ref} className="ml-[34px] h-[5px] bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: `${w}%`, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
}

// ── Animated Donut chart (SVG) ──
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
  const gap = 4; // px gap between segments
  let cumulative = 0;

  return (
    <svg ref={ref} width={size} height={size} className="-rotate-90 overflow-visible">
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`donut-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={d.color} stopOpacity="1" />
            <stop offset="100%" stopColor={d.color} stopOpacity="0.75" />
          </linearGradient>
        ))}
        <filter id="donut-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Track */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />

      {/* Segments */}
      <g filter="url(#donut-shadow)">
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
              stroke={`url(#donut-grad-${i})`}
              strokeWidth={animated ? stroke : 0}
              strokeDasharray={`${animated ? dash : 0} ${circumference}`}
              strokeDashoffset={startOffset}
              strokeLinecap="round"
              style={{
                transition: `stroke-dasharray 1.1s cubic-bezier(.34,1.56,.64,1) ${i * 180}ms, stroke-width .5s cubic-bezier(.34,1.56,.64,1) ${i * 180}ms`,
              }}
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
        <linearGradient id={`spk-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPath} fill={`url(#spk-${color.replace('#', '')})`} className="sparkline-area" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sparkline-line" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} className="sparkline-dot" />
    </svg>
  );
}

const SPARK_TOTAL = [82, 91, 78, 112, 98, 124, 105, 142, 118, 136, 152, 148];
const SPARK_MONTH = [21, 34, 28, 42, 39, 51, 46, 58, 42, 62, 54, 68];
const SPARK_PENDING = [22, 18, 31, 24, 19, 28, 32, 21, 38, 26, 34, 29];
const SPARK_AVG = [12, 13.5, 12.8, 14.2, 13.8, 15.2, 14.6, 15.8, 15.1, 16.2, 15.4, 15.8];

const MOCK_EARNINGS = {
  totalEarnings: 254256,
  thisMonth: 48750,
  lastMonth: 42300,
  monthGrowth: 15.2,
  pendingPayout: 15200,
  completedPayouts: 239056,
  avgPerBooking: 2103,
  totalBookings: 121,
};

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'earning', bookingNumber: 'CB-2024-001', vehicleName: 'Hyundai Creta', customerName: 'Amit Kumar', amount: 6720, platformFee: 1185, netAmount: 5535, date: '2024-12-12', status: 'completed' },
  { id: '2', type: 'earning', bookingNumber: 'CB-2024-002', vehicleName: 'Honda City', customerName: 'Priya Sharma', amount: 2998, platformFee: 529, netAmount: 2469, date: '2024-12-11', status: 'completed' },
  { id: '3', type: 'payout', description: 'Weekly Payout - Dec Week 2', amount: 15200, bankAccount: '****4532', date: '2024-12-10', status: 'completed' },
  { id: '4', type: 'earning', bookingNumber: 'CB-2024-003', vehicleName: 'Maruti Swift', customerName: 'Rahul Verma', amount: 2697, platformFee: 476, netAmount: 2221, date: '2024-12-09', status: 'completed' },
  { id: '5', type: 'earning', bookingNumber: 'CB-2024-004', vehicleName: 'Toyota Fortuner', customerName: 'Vikram Singh', amount: 19956, platformFee: 3489, netAmount: 16467, date: '2024-12-08', status: 'completed' },
  { id: '6', type: 'payout', description: 'Weekly Payout - Dec Week 1', amount: 22300, bankAccount: '****4532', date: '2024-12-02', status: 'completed' },
];

const MOCK_CAR_EARNINGS = [
  { id: '1', name: 'Honda City', bookings: 38, earnings: 56962, avgPerBooking: 1499 },
  { id: '2', name: 'Toyota Innova', bookings: 18, earnings: 53982, avgPerBooking: 2999 },
  { id: '3', name: 'Hyundai Creta', bookings: 24, earnings: 52776, avgPerBooking: 2199 },
  { id: '4', name: 'Maruti Swift', bookings: 56, earnings: 50344, avgPerBooking: 899 },
  { id: '5', name: 'Toyota Fortuner', bookings: 8, earnings: 39992, avgPerBooking: 4999 },
];

type TimeFilter = 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function VendorSelfDriveEarningsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'earning' | 'payout'>('all');
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 700); return () => clearTimeout(t); }, []);

  const totalEarnings = useCountUp(MOCK_EARNINGS.totalEarnings, 1600);
  const thisMonth = useCountUp(MOCK_EARNINGS.thisMonth, 1400);
  const lastMonth = useCountUp(MOCK_EARNINGS.lastMonth, 1300);
  const pendingPayout = useCountUp(MOCK_EARNINGS.pendingPayout, 1200);

  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    (t) => transactionFilter === 'all' || t.type === transactionFilter
  );

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className={`h-5 w-44 bg-gray-100 rounded ${shimmer}`} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-14 bg-gray-50 rounded-xl ${shimmer}`} />
            ))}
          </div>
          <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-4">
            <div className={`h-5 w-32 bg-gray-100 rounded self-start ${shimmer}`} />
            <div className={`w-44 h-44 rounded-full border-[18px] border-gray-100 ${shimmer}`} />
            <div className="w-full space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-3 bg-gray-50 rounded ${shimmer}`} />
              ))}
            </div>
          </div>
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
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/25 overflow-hidden group/icon cursor-default">
              <div className="absolute inset-0 -translate-x-full group-hover/icon:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute inset-0 rounded-xl animate-[iconPulse_3s_ease-in-out_infinite] bg-emerald-400/20" />
              <Wallet className="w-5 h-5 text-white relative z-10 animate-[walletBob_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Earnings</h1>
              <p className="text-xs text-gray-400 mt-0.5">Track your self-drive rental income</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="appearance-none h-9 pl-3.5 pr-9 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
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
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                MOCK_EARNINGS.monthGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              )}>
                {MOCK_EARNINGS.monthGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(MOCK_EARNINGS.monthGrowth)}%
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
              <p className="text-[10px] text-gray-400">vs ₹{MOCK_EARNINGS.lastMonth.toLocaleString()}</p>
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

        {/* Last Month */}
        <FadeIn delay={270}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:animate-[iconJiggle_.5s_ease] transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 mb-1">Last Month</p>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              <span className="text-lg text-gray-300">₹</span>{lastMonth.toLocaleString()}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline data={SPARK_AVG} color="#8b5cf6" width={72} height={22} />
              </div>
              <p className="text-[10px] text-gray-400">November 2024</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Main Content (8/4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <FadeIn delay={180} className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'earning', label: 'Earnings' },
                  { value: 'payout', label: 'Payouts' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTransactionFilter(f.value as 'all' | 'earning' | 'payout')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200',
                      transactionFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              {filteredTransactions.map((transaction, i) => (
                <div
                  key={transaction.id}
                  className="px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group"
                  style={{ animation: 'fadeSlideUp .45s ease both', animationDelay: `${280 + i * 55}ms` }}
                >
                  {transaction.type === 'earning' ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-200">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:animate-[bounceArrow_.4s_ease]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{transaction.vehicleName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mr-1.5">#{transaction.bookingNumber}</span>
                          {transaction.customerName}
                        </p>
                      </div>
                      <div className="hidden sm:block shrink-0 text-xs text-gray-400 w-20 text-center">{transaction.date}</div>
                      <div className="shrink-0 text-right min-w-[90px]">
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">+₹{transaction.netAmount}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">₹{transaction.amount} · Fee ₹{transaction.platformFee}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-200">
                        <Landmark className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{transaction.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Bank: {transaction.bankAccount}</p>
                      </div>
                      <div className="hidden sm:block shrink-0 text-xs text-gray-400 w-20 text-center">{transaction.date}</div>
                      <div className="shrink-0 text-right min-w-[90px]">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">₹{transaction.amount.toLocaleString()}</p>
                        <span className={cn(
                          'inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          transaction.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {transaction.status === 'completed' ? 'Completed' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">View All Transactions</button>
            </div>
          </div>
        </FadeIn>

        {/* Earnings Share — Donut */}
        <FadeIn delay={300} className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Earnings Share</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Top revenue-generating cars</p>
            </div>
            <div className="p-5">
              {/* Donut */}
              <div className="relative flex items-center justify-center mb-4">
                <DonutChart
                  data={MOCK_CAR_EARNINGS.map((c, i) => ({
                    name: c.name,
                    value: c.earnings,
                    color: ['#0ea5e9', '#6366f1', '#ec4899', '#f97316', '#22c55e'][i],
                  }))}
                  size={200}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-extrabold text-gray-900 tabular-nums">
                    ₹{MOCK_CAR_EARNINGS.reduce((s, c) => s + c.earnings, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5">
                {MOCK_CAR_EARNINGS.map((c, i) => {
                  const total = MOCK_CAR_EARNINGS.reduce((s, x) => s + x.earnings, 0);
                  const pct = ((c.earnings / total) * 100).toFixed(0);
                  const color = ['#0ea5e9', '#6366f1', '#ec4899', '#f97316', '#22c55e'][i];
                  return (
                    <div key={c.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="flex-1 truncate text-gray-700 font-medium">{c.name}</span>
                        <span className="text-gray-400 tabular-nums shrink-0">{pct}%</span>
                        <span className="text-gray-900 font-semibold tabular-nums shrink-0 w-16 text-right">₹{c.earnings.toLocaleString()}</span>
                      </div>
                      <div className="ml-4 mt-0.5 text-[10px] text-gray-400">
                        {c.bookings} bookings · Avg ₹{c.avgPerBooking}/booking
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Payout Settings ── */}
      <FadeIn delay={350}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Payout Settings</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">HDFC Bank ****4532</p>
                <p className="text-sm text-gray-500">Weekly payouts every Monday</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Verified</span>
            </div>
            <Button variant="outline" size="sm">
              Update Details
            </Button>
          </div>
        </div>
      </FadeIn>

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
