'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { Loader2, BarChart3, ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <CustomerHeader title="Expense Summary" showBackButton backHref="/customer/dashboard" />

      <main className="pt-20 md:pt-24 pb-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-sky-600" />
                  Expense history
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  {customerName ? `${customerName}'s` : 'Your'} expenses
                </h1>
              </div>
              <button
                type="button"
                onClick={() => router.push('/customer/dashboard')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </button>
            </div>

            {error && (
              <div className="p-6 md:p-8 border-b border-dashed border-red-200 bg-red-50 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="p-8 flex flex-col items-center gap-3 text-sm text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <p>Loading your expense history...</p>
              </div>
            ) : (
              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total Expense</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{currencyFormatter.format(totalExpense)}</p>
                    <p className="text-xs text-gray-400 mt-1">Total amount spent</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Expense entries
                  </p>
                  {expenses.length ? (
                    <div className="mt-4 space-y-3">
                      {expenses.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                            {item.vendor && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.vendor}</p>
                            )}
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                            )}
                            {item.date && (
                              <p className="text-xs text-gray-400 mt-1">{formatExpenseDate(item.date)}</p>
                            )}
                          </div>
                          <p className="text-sm font-bold text-red-600">
                            -{currencyFormatter.format(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">We don't have any expenses recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
