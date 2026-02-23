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
    <div className="min-h-screen -m-6 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 pt-5 pb-14">
        <h1 className="text-2xl font-bold text-white">Financials</h1>
        <p className="text-white/70 text-sm mt-1">Earnings, expenses &amp; pending payments</p>
      </div>

      <div className="px-4 sm:px-6 -mt-8 pb-10 space-y-4">

        {/* Month filter */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Month</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Time</option>
            {months.map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : summary ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{fmt(summary.totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{summary.bookingCount} bookings</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collected</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">₹{fmt(summary.totalCollected)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Cash in hand</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Dues</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">₹{fmt(summary.totalPending)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pending.length} bookings</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
                <p className="text-2xl font-bold text-red-500 mt-1">₹{fmt(summary.totalExpenses)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{summary.expenseCount} entries</p>
              </div>
            </div>

            {/* Net earnings banner */}
            <div className={`rounded-2xl p-5 flex items-center justify-between ${summary.netEarnings >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Earnings</p>
                <p className="text-xs text-gray-400 mt-0.5">Collected − Expenses</p>
              </div>
              <div className="flex items-center gap-2">
                {summary.netEarnings >= 0
                  ? <TrendingUp className="w-5 h-5 text-emerald-500" />
                  : <TrendingDown className="w-5 h-5 text-red-500" />
                }
                <p className={`text-3xl font-bold ${summary.netEarnings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {summary.netEarnings >= 0 ? '+' : ''}₹{fmt(summary.netEarnings)}
                </p>
              </div>
            </div>

            {/* Expense breakdown */}
            {breakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Expense Breakdown</p>
                <div className="space-y-3">
                  {breakdown.map(item => {
                    const cat = EXPENSE_CATEGORIES[item.category] ?? { label: item.category, emoji: '📋' };
                    const pct = summary.totalExpenses > 0 ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
                    return (
                      <div key={item.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cat.emoji} {cat.label}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">₹{fmt(item.amount)}</span>
                            <span className="text-xs text-gray-400 ml-1.5">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-700"
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Payments</p>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                    {pending.length} due
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {pending.map(b => (
                    <Link
                      key={b.id}
                      href={`/vendor/direct-bookings/${b.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition"
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-sm shrink-0">
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
                        <p className="text-sm font-bold text-orange-600">₹{fmt(b.balanceDue)}</p>
                        <p className="text-[10px] text-gray-400">due</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && summary.bookingCount > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">All payments collected for this period!</p>
              </div>
            )}

            {summary.bookingCount === 0 && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-500">No bookings found for this period.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
