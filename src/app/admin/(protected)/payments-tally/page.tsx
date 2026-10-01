'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee,
  Wallet,
  Clock,
  RotateCcw,
  RefreshCw,
  Receipt,
  CalendarRange,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import ServiceTabs from '../payments/_components/ServiceTabs';

interface ServiceRow {
  key: string;
  label: string;
  count: number;
  value: number;
  collected: number;
  refunded: number;
}

interface MethodRow {
  key: string;
  count: number;
  collected: number;
}

interface DateRow {
  date: string;
  value: number;
  collected: number;
}

interface TallyResponse {
  success: boolean;
  totals: {
    totalBookings: number;
    totalValue: number;
    totalCollected: number;
    totalPending: number;
    totalRefunded: number;
  };
  byService: ServiceRow[];
  byMethod: MethodRow[];
  byStatus: Record<string, number>;
  byDate: DateRow[];
}

const SERVICE_BADGES: Record<string, string> = {
  bike: 'bg-purple-100 text-purple-700',
  car: 'bg-orange-100 text-orange-700',
  chauffeur: 'bg-blue-100 text-blue-700',
  bus: 'bg-emerald-100 text-emerald-700',
  truck: 'bg-amber-100 text-amber-700',
  equipment: 'bg-teal-100 text-teal-700',
  packers: 'bg-pink-100 text-pink-700',
  luxury: 'bg-yellow-100 text-yellow-800',
  wander: 'bg-indigo-100 text-indigo-700',
};

const METHOD_LABELS: Record<string, string> = {
  RAZORPAY: 'Razorpay / Online',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  UNKNOWN: 'Not recorded',
};

const METHOD_COLORS: Record<string, string> = {
  RAZORPAY: '#4F46E5', // indigo — matches "Direct" convention on /admin/payments
  UPI: '#D97706', // amber — matches "Manual" convention
  BANK_TRANSFER: '#0D9488', // teal
  UNKNOWN: '#9CA3AF', // gray
};

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-gray-100 text-gray-700',
  REFUNDED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['all', 'PAID', 'PARTIAL', 'SUBMITTED', 'PENDING', 'REFUNDED', 'FAILED'];

const RANGE_OPTIONS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'custom', label: 'Custom' },
];

const VALUE_COLOR = '#D1D5DB'; // neutral — represents booking value, not yet collected
const COLLECTED_COLOR = '#059669'; // emerald — matches "Total Collected" stat tile

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function PaymentsTallyPage() {
  const router = useRouter();
  const [data, setData] = useState<TallyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [service, setService] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchTally = useCallback(async () => {
    if (range === 'custom' && (!customFrom || !customTo)) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (range === 'custom') {
        params.set('from', customFrom);
        params.set('to', customTo);
      }
      if (service !== 'all') params.set('services', service);
      if (status !== 'all') params.set('status', status);

      const response = await fetch(`/api/admin/payments/tally?${params.toString()}`, { cache: 'no-store' });
      const json = await response.json();
      setData(json.success ? json : null);
    } catch (err) {
      console.error('Failed to fetch payments tally:', err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [range, customFrom, customTo, service, status]);

  useEffect(() => {
    fetchTally();
  }, [fetchTally]);

  const totals = data?.totals;

  const serviceChartData = useMemo(() => {
    if (!data) return [];
    return data.byService
      .slice()
      .sort((a, b) => b.value - a.value)
      .map((s) => ({ name: s.label, Value: s.value, Collected: s.collected }));
  }, [data]);

  const methodChartData = useMemo(() => {
    if (!data) return [];
    return data.byMethod
      .slice()
      .sort((a, b) => b.collected - a.collected)
      .map((m) => ({ name: METHOD_LABELS[m.key] || m.key, key: m.key, Collected: m.collected }));
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    return data.byDate.slice(-30).map((d) => ({ ...d, label: formatShortDate(d.date) }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Payments Tally</h1>
          <p className="text-sm text-gray-600">Revenue reconciliation across all services — booking value, collected, pending, and refunds.</p>
        </div>
        <Button onClick={fetchTally} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3.5">
        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Date</span>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition inline-flex items-center gap-1.5',
                range === r.key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              {r.key === 'custom' && <CalendarRange className="w-3.5 h-3.5" />}
              {r.label}
            </button>
          ))}
          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Service */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Service</span>
          <ServiceTabs value={service} onChange={setService} allCount={data?.totals.totalBookings ?? 0} />
        </div>

        {/* Payment status */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-16 shrink-0">Status</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                status === s
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500 text-sm">
          Loading tally...
        </div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-red-600 text-sm">
          Failed to load payments tally. Try refreshing.
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              icon={<IndianRupee className="w-5 h-5" />}
              label="Total Booking Value"
              value={formatPrice(totals!.totalValue)}
              accent="bg-gray-100 text-gray-700"
            />
            <StatTile
              icon={<Wallet className="w-5 h-5" />}
              label="Total Collected"
              value={formatPrice(totals!.totalCollected)}
              accent="bg-emerald-100 text-emerald-700"
            />
            <StatTile
              icon={<Clock className="w-5 h-5" />}
              label="Pending / Due"
              value={formatPrice(totals!.totalPending)}
              accent="bg-amber-100 text-amber-700"
            />
            <StatTile
              icon={<RotateCcw className="w-5 h-5" />}
              label="Total Refunded"
              value={formatPrice(totals!.totalRefunded)}
              accent="bg-red-100 text-red-700"
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            {totals!.totalBookings} bookings with payment activity in this selection
          </div>

          {/* Collected trend */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Collected Over Time</h2>
            <p className="text-xs text-gray-500 mb-3">{trendData.length > 0 ? `Last ${trendData.length} day${trendData.length > 1 ? 's' : ''} with activity in this selection` : 'No activity to chart'}</p>
            {trendData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLLECTED_COLOR} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLLECTED_COLOR} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatPrice(v)} width={80} />
                    <Tooltip
                      formatter={(value) => formatPrice(Number(value))}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke={COLLECTED_COLOR} strokeWidth={2} fill="url(#collectedFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400">Not enough data points for this range.</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue by service — chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Value vs Collected — by Service</h2>
              {serviceChartData.length > 0 ? (
                <div style={{ height: Math.max(220, serviceChartData.length * 44) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatPrice(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip formatter={(value) => formatPrice(Number(value))} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Value" fill={VALUE_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
                      <Bar dataKey="Collected" fill={COLLECTED_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-sm text-gray-400">No payment activity in this selection.</div>
              )}
            </div>

            {/* By payment method — chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Collected — by Payment Method</h2>
              {methodChartData.length > 0 ? (
                <div style={{ height: Math.max(180, methodChartData.length * 56) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={methodChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatPrice(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip formatter={(value) => formatPrice(Number(value))} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                      <Bar dataKey="Collected" radius={[0, 4, 4, 0]} barSize={20}>
                        {methodChartData.map((m) => (
                          <Cell key={m.key} fill={METHOD_COLORS[m.key] || '#9CA3AF'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-sm text-gray-400">No payment activity in this selection.</div>
              )}
            </div>
          </div>

          {/* Breakdown by service — table (click a row to open its bookings on /admin/payments) */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">By Service — Detail</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click a service to open its individual bookings (with verify/reject actions) on the Payments page.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-4 py-2.5">Service</th>
                    <th className="px-4 py-2.5 text-right">Bookings</th>
                    <th className="px-4 py-2.5 text-right">Value</th>
                    <th className="px-4 py-2.5 text-right">Collected</th>
                    <th className="px-4 py-2.5 text-right">Pending</th>
                    <th className="px-4 py-2.5 text-right">Refunded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byService
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((s) => (
                      <tr
                        key={s.key}
                        className="hover:bg-gray-50 cursor-pointer group"
                        onClick={() => router.push(`/admin/payments?type=${s.key}`)}
                      >
                        <td className="px-4 py-2.5">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1', SERVICE_BADGES[s.key] || 'bg-gray-100 text-gray-700')}>
                            {s.label}
                          </span>
                          <ExternalLink className="inline w-3 h-3 ml-1.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{s.count}</td>
                        <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{formatPrice(s.value)}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-700">{formatPrice(s.collected)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-700">{formatPrice(Math.max(s.value - s.collected - s.refunded, 0))}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{s.refunded > 0 ? formatPrice(s.refunded) : '—'}</td>
                      </tr>
                    ))}
                  {data.byService.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payment activity in this selection.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* By status */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">By Payment Status</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {Object.entries(data.byStatus).map(([s, count]) => (
                <span
                  key={s}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold', STATUS_STYLES[s] || 'bg-gray-100 text-gray-700')}
                >
                  {s} · {count}
                </span>
              ))}
              {Object.keys(data.byStatus).length === 0 && (
                <span className="text-gray-400 text-sm">No payment activity in this selection.</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', accent)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-gray-900 truncate leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}
