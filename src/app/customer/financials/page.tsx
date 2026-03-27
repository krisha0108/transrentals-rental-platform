'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { Loader2, BarChart3, ArrowLeft, IndianRupee, TrendingDown, Calendar, ChevronRight, HelpCircle, ArrowUpRight } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface ExpenseDetail {
  id?: string | number;
  title: string;
  amount: number;
  description?: string;
  date?: string;
  vendor?: string;
}

const formatExpenseDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const normalizeExpense = (item: any, index: number): ExpenseDetail => ({
  id: item?.id ?? item?.transaction_id ?? `${index}-${item?.source_name ?? 'expense'}`,
  title: item?.source_name || item?.description || `Expense #${item?.id ?? index + 1}`,
  amount: Math.abs(Number.isFinite(Number(item?.amount)) ? Number(item?.amount) : 0),
  description: item?.description || item?.note,
  date: item?.date,
  vendor: item?.vendor?.name || item?.vendor_name || item?.receiver_name,
});

export default function CustomerFinancialsPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const customerPayload = localStorage.getItem('customer');
    if (!token || !customerPayload) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerPayload);
      setCustomerName(parsed?.name || parsed?.full_name || '');
      if (parsed?.id) {
        setCustomerId(`${parsed.id}`);
      } else {
        router.push('/customer/login');
      }
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (!customerId) {
      setIsLoading(false);
      setError('Customer ID is missing.');
      return;
    }

    const fetchExpenses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const query = new URLSearchParams({ customer_id: customerId });
        const response = await fetch(`/api/customer/financials?${query.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          throw new Error(payload?.message || 'Unable to load expense details.');
        }

        const mapped = Array.isArray(payload.expenses)
          ? payload.expenses.map((item: any, index: number) => normalizeExpense(item, index))
          : [];
        setExpenses(mapped);
        const summed = mapped.reduce(
          (sum: number, item: ExpenseDetail) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
          0
        );
        setTotalExpense(summed);
      } catch (err) {
        console.error('Failed to load customer expenses:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch expenses.');
        setExpenses([]);
        setTotalExpense(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [customerId]);

  const avgExpense = expenses.length ? Math.round(totalExpense / expenses.length) : 0;
  const maxExpense = expenses.length ? Math.max(...expenses.map(e => e.amount)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader title="Financials" showBackButton backHref="/customer/dashboard" />

      <main className="pt-16">

        {/* ── HERO ── */}
        <div className="bg-[#09B368] relative overflow-hidden">
          {/* subtle grid lines */}
          <div className="absolute inset-0" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

              {/* Left: title */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-white/70" />
                  <span className="text-white/70 text-sm font-medium tracking-wide">Expense Analytics</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {customerName ? `${customerName}'s` : 'Your'} Expenses
                </h1>
                <p className="text-white/70 mt-2 text-sm">Track every rupee you've spent through TransRentals</p>
                <button
                  type="button"
                  onClick={() => router.push('/customer/dashboard')}
                  className="mt-5 inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </div>

              {/* Right: big stat card */}
              {!isLoading && (
                <div className="lg:min-w-[320px] bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl p-6">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="text-4xl md:text-5xl font-bold text-white mt-1">{currencyFormatter.format(totalExpense)}</p>
                  <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{expenses.length}</p>
                      <p className="text-white/60 text-xs mt-0.5">Total Entries</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{expenses[0] ? currencyFormatter.format(expenses[0].amount) : '—'}</p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {expenses[0]?.date ? formatExpenseDate(expenses[0].date) : 'Latest expense'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── LEFT: Expense Table ── */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Table Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Expense Log</h2>
                  <p className="text-xs text-gray-400 mt-0.5">All transactions recorded by your account manager</p>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  {expenses.length} {expenses.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Loading */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#09B368]" />
                  <p className="text-sm text-gray-400">Loading expense history...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <TrendingDown className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-700">No expenses recorded yet</p>
                  <p className="text-sm text-gray-400">Your spending history will appear here</p>
                </div>
              ) : (
                /* Table */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Service</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest hidden md:table-cell">Vendor</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-[#09B368]/3 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <IndianRupee className="h-4 w-4 text-red-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="text-sm text-gray-500">{item.vendor || <span className="text-gray-300">—</span>}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Calendar className="h-3.5 w-3.5 text-gray-300" />
                              {item.date ? formatExpenseDate(item.date) : <span className="text-gray-300">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-red-600">
                              -{currencyFormatter.format(item.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50/80 border-t border-gray-100">
                        <td colSpan={2} className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-500">{expenses.length} transactions</span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell"></td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-gray-900">{currencyFormatter.format(totalExpense)}</span>
                          <p className="text-xs text-gray-400 mt-0.5">total</p>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

              {/* Summary Stats */}
              {!isLoading && !error && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Summary</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-600">Total Spent</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{currencyFormatter.format(totalExpense)}</span>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-sm text-gray-600">Average</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{currencyFormatter.format(avgExpense)}</span>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-sm text-gray-600">Highest</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{currencyFormatter.format(maxExpense)}</span>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#09B368]/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-[#09B368]" />
                        </div>
                        <span className="text-sm text-gray-600">Entries</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{expenses.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Cards */}
              <Link
                href="/customer/dashboard"
                className="flex items-center justify-between gap-3 bg-[#09B368] text-white rounded-2xl p-4 hover:bg-[#078F53] transition-colors shadow-sm group"
              >
                <div>
                  <p className="font-semibold text-sm">My Dashboard</p>
                  <p className="text-white/70 text-xs mt-0.5">View all bookings & activity</p>
                </div>
                <ChevronRight className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/customer/helpdesk"
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#09B368]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-[#09B368]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-[#09B368]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Need Help?</p>
                  <p className="text-gray-400 text-xs mt-0.5">Open a support ticket</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#09B368] transition-colors" />
              </Link>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-amber-800 mb-1">About Expenses</p>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  Expenses are recorded by your account manager. Contact helpdesk if you notice any discrepancy.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
