'use client';

// Travel agent earnings dashboard. Pulls aggregated revenue across direct
// bookings, lead quotes and fleet bookings from /api/travel-agent/earnings,
// then renders summary cards, a 6-month trend chart, type breakdown and a
// recent earnings table.

import { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, ChevronDown,
  Sparkles, Calendar, Compass, Building2, Truck, FileText, Car, Loader2,
  IndianRupee,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

type Period = 'month' | 'last30' | 'year' | 'all';

interface SummaryTrend {
  current: number;
  previous: number | null;
  deltaPercent: number | null;
}

interface Summary {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  bookingCount: number;
  trend: SummaryTrend;
}

interface TrendPoint { month: string; revenue: number; }
interface BreakdownRow { type: string; amount: number; count: number; }
interface RecentRow {
  kind: 'BOOKING' | 'LEAD' | 'FLEET';
  id: string;
  ref: string | null;
  customerName: string;
  type: string;
  title: string;
  amount: number;
  paidAmount: number;
  status: string | null;
  paymentStatus: string | null;
  date: string;
}

interface EarningsData {
  period: Period;
  summary: Summary;
  trend: TrendPoint[];
  breakdownByType: BreakdownRow[];
  recent: RecentRow[];
}

const PERIOD_LABELS: Record<Period, string> = {
  month: 'This Month',
  last30: 'Last 30 Days',
  year: 'This Year',
  all: 'All Time',
};

const TYPE_META: Record<string, { label: string; icon: any; cls: string }> = {
  TOUR:       { label: 'Tours',       icon: Compass,    cls: 'bg-emerald-100 text-emerald-700' },
  PROPERTY:   { label: 'Properties',  icon: Building2,  cls: 'bg-indigo-100 text-indigo-700'   },
  TRANSPORT:  { label: 'Transport',   icon: Truck,      cls: 'bg-blue-100 text-blue-700'       },
  CUSTOM:     { label: 'Custom',      icon: Sparkles,   cls: 'bg-amber-100 text-amber-700'     },
  FLEET:      { label: 'Fleet',       icon: Car,        cls: 'bg-purple-100 text-purple-700'   },
  LEAD_QUOTE: { label: 'Lead Quotes', icon: FileText,   cls: 'bg-rose-100 text-rose-700'       },
  OTHER:      { label: 'Other',       icon: Wallet,     cls: 'bg-gray-100 text-gray-700'       },
};

function inr(n: number): string {
  if (!isFinite(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short' });
}

function dateShort(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function TypeChip({ type }: { type: string }) {
  const meta = TYPE_META[type] || TYPE_META.OTHER;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent = 'emerald' }: {
  icon: any; label: string; value: string; sub?: React.ReactNode; accent?: 'emerald' | 'amber' | 'indigo' | 'gray';
}) {
  const tint = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    gray:    'bg-gray-100 text-gray-600',
  }[accent];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl ${tint}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
        <Calendar className="h-3.5 w-3.5" />
        {PERIOD_LABELS[value]}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <button onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" aria-label="Close" />
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} onClick={() => { onChange(p); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  p === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TravelAgentEarningsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/travel-agent/earnings?period=${period}`)
      .then(async r => {
        if (cancelled) return;
        if (!r.ok) {
          setError(`Failed to load (${r.status})`);
          setLoading(false);
          return;
        }
        const d = await r.json();
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError('Network error'); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [period]);

  useTravelAgentPageHeader(
    'Earnings',
    'Your revenue across tours, properties, fleet and lead quotes',
    <PeriodSelector key="period" value={period} onChange={setPeriod} />,
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <Wallet className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-gray-700 font-semibold">Couldn't load earnings</p>
        <p className="text-sm text-gray-400 mt-1">{error || 'Try again in a moment'}</p>
      </div>
    );
  }

  const { summary, trend, breakdownByType, recent } = data;
  const delta = summary.trend.deltaPercent;
  const deltaPositive = delta !== null && delta >= 0;
  const totalBreakdown = breakdownByType.reduce((s, r) => s + r.amount, 0) || 1;
  const maxTrend = Math.max(1, ...trend.map(t => t.revenue));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={inr(summary.totalRevenue)}
          accent="emerald"
          sub={delta !== null ? (
            <span className={`inline-flex items-center gap-1 ${deltaPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta)}% vs previous
            </span>
          ) : 'No comparison data'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={inr(summary.collectedRevenue)}
          accent="emerald"
          sub="Payments received"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={inr(summary.pendingRevenue)}
          accent="amber"
          sub="Awaiting collection"
        />
        <StatCard
          icon={Sparkles}
          label="Bookings"
          value={summary.bookingCount.toString()}
          accent="indigo"
          sub="In this period"
        />
      </div>

      {/* Trend chart */}
      <div className="mt-6 bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Revenue Trend
          </h2>
          <span className="text-[11px] text-gray-400 font-medium">Last 6 months</span>
        </div>
        <div className="h-64 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <defs>
                <linearGradient id="emeraldBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                formatter={(value: number) => [inr(value), 'Revenue']}
                labelFormatter={(l: string) => {
                  const [y, m] = l.split('-').map(Number);
                  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                }}
              />
              <Bar dataKey="revenue" fill="url(#emeraldBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-6 bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Breakdown by Type
        </h2>
        {breakdownByType.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No earnings in this period yet</p>
        ) : (
          <div className="space-y-3">
            {breakdownByType.map(row => {
              const pct = (row.amount / totalBreakdown) * 100;
              const meta = TYPE_META[row.type] || TYPE_META.OTHER;
              const Icon = meta.icon;
              return (
                <div key={row.type}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg ${meta.cls}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
                      <span className="text-[11px] text-gray-400">· {row.count} {row.count === 1 ? 'booking' : 'bookings'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-900">{inr(row.amount)}</span>
                      <span className="text-[11px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent earnings table */}
      <div className="mt-6 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-emerald-500" /> Recent Earnings
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No bookings or quotes recorded yet</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Customer</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-right px-5 py-3">Amount</th>
                    <th className="text-right px-5 py-3">Collected</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent.map(r => (
                    <tr key={`${r.kind}-${r.id}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{dateShort(r.date)}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{r.customerName}</p>
                        {r.title && <p className="text-xs text-gray-400">{r.title}</p>}
                      </td>
                      <td className="px-5 py-3"><TypeChip type={r.type} /></td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">{inr(r.amount)}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{inr(r.paidAmount)}</td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {r.paymentStatus || r.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {recent.map(r => (
                <div key={`${r.kind}-${r.id}`} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.customerName}</p>
                      {r.title && <p className="text-xs text-gray-400 truncate">{r.title}</p>}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <TypeChip type={r.type} />
                        <span className="text-[10px] text-gray-400">{dateShort(r.date)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{inr(r.amount)}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold">+{inr(r.paidAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
