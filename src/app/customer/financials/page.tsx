'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import { ArrowLeft, IndianRupee, TrendingDown, Calendar, ChevronRight, HelpCircle, ArrowUpRight, Hash, Store, Clock, Info } from 'lucide-react';

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

  // Same gutter maths as the dashboard hero, so a full-bleed panel still starts
  // its content on the page's content column.
  const GUTTER = { paddingLeft: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const GUTTER_R = { paddingRight: 'max(24px, calc((100vw - 1240px) / 2))' } as const;

  // ── View-only derivations ────────────────────────────────────────────────
  // Everything below reads the `expenses` already in state. No new fetch, no
  // new state — only how the same rows are grouped for display.

  const latest = expenses[0];

  /** The ledger, bucketed by month. Buckets keep the order the months are first
   *  seen in, so the API's newest-first ordering carries through — and a row
   *  that arrives out of order still lands in its own month's bucket rather
   *  than opening a second heading for it. */
  const ledgerBuckets = new Map<string, { label: string; items: ExpenseDetail[]; total: number }>();
  expenses.forEach((item) => {
    const parsed = item.date ? new Date(item.date) : null;
    const label =
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Undated';
    const bucket = ledgerBuckets.get(label);
    if (bucket) {
      bucket.items.push(item);
      bucket.total += item.amount;
    } else {
      ledgerBuckets.set(label, { label, items: [item], total: item.amount });
    }
  });
  const ledgerGroups = Array.from(ledgerBuckets.values());

  /** Monthly totals for the chart — the last six months that have any spend. */
  const monthTotals = new Map<string, number>();
  expenses.forEach((item) => {
    const parsed = item.date ? new Date(item.date) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return;
    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
    monthTotals.set(key, (monthTotals.get(key) || 0) + item.amount);
  });
  const byMonth = Array.from(monthTotals.entries())
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, value, label: new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'short' }) };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-6);
  const monthPeak = byMonth.length ? Math.max(...byMonth.map((m) => m.value)) : 0;

  /** Chart geometry for the spend trend. The plot is drawn in a 600×190 user
   *  space and stretched to whatever width the card gets; points sit on the
   *  centre of their month's column, so the SVG line and the HTML dots/axis
   *  below it line up on the same percentages. */
  const CHART_W = 600;
  const CHART_H = 190;
  const CHART_TOP = 22;   // headroom for the peak's flag
  const CHART_FLOOR = 25; // so a zero month still sits above the axis
  const chartPoints = byMonth.map((m, i) => {
    const ratio = monthPeak > 0 ? m.value / monthPeak : 0;
    const y = CHART_TOP + (1 - ratio) * (CHART_H - CHART_TOP - CHART_FLOOR);
    return {
      ...m,
      isPeak: monthPeak > 0 && m.value === monthPeak,
      xPct: ((i + 0.5) / byMonth.length) * 100,
      x: ((i + 0.5) / byMonth.length) * CHART_W,
      y,
      bottomPct: ((CHART_H - y) / CHART_H) * 100,
    };
  });
  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = chartPoints.length
    ? `${linePath} L${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${CHART_H} L${chartPoints[0].x.toFixed(1)} ${CHART_H} Z`
    : '';

  /** Not every expense carries a vendor — for some accounts none of them do.
   *  When that is the case the vendor column and the breakdown below are just
   *  a row of dashes, so both stay out of the page entirely. */
  const hasVendors = expenses.some((item) => Boolean(item.vendor));

  /** Where the money went, biggest first. */
  const vendorTotals = new Map<string, number>();
  if (hasVendors) {
    expenses.forEach((item) => {
      const key = item.vendor || 'Unattributed';
      vendorTotals.set(key, (vendorTotals.get(key) || 0) + item.amount);
    });
  }
  const byVendor = Array.from(vendorTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const vendorTop = byVendor.length ? byVendor[0].value : 0;

  /** The four figures the hero carries, one card each and all the same size —
   *  the same set the old hero showed, and the numbers Summary lists again. */
  const heroStats = [
    {
      label: 'Total spent',
      value: currencyFormatter.format(totalExpense),
      hint: `Across ${expenses.length} ${expenses.length === 1 ? 'entry' : 'entries'}`,
      Icon: IndianRupee,
    },
    { label: 'Entries', value: `${expenses.length}`, hint: 'Recorded transactions', Icon: Hash },
    { label: 'Average', value: currencyFormatter.format(avgExpense), hint: 'Per transaction', Icon: TrendingDown },
    { label: 'Highest', value: currencyFormatter.format(maxExpense), hint: 'Single expense', Icon: ArrowUpRight },
  ];

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-white`}>
      <CustomerHeader title="Financials" showBackButton backHref="/customer/dashboard" />

      {/* pt-16 clears the fixed header; the rest is breathing room between the
          header and the hero band. */}
      <main className="pt-[88px] sm:pt-[96px]">

        {/* ══════════════ HERO — full-bleed ══════════════ */}
        <div className="relative grid grid-cols-1 overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] text-white lg:grid-cols-[0.74fr_auto_1.26fr]">
          <div className="fin-grid pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(760px 340px at 88% -25%, rgba(255,255,255,.20), transparent 62%), radial-gradient(520px 260px at 8% 130%, rgba(1,35,20,.55), transparent 60%)' }} />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#09B368]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#056040]/40 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* the ledger tape along the bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-10 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-5 border-t border-white/[0.18] bg-[#01230F]/55" />
            <div className="absolute inset-x-0 bottom-0 h-5"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, transparent 1px 26px)' }} />
          </div>

          {/* Stacked, the two halves' own paddings would meet as ~100px of dead
              green; they only need the full run once they sit side by side. */}
          <div className="relative z-10 flex items-center pb-7 pr-6 pt-12 lg:pb-[62px] lg:pr-[46px] lg:pt-[62px]" style={GUTTER}>
            <div className="fin-rise min-w-0">
              <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.55]">
                <span className="h-px w-6 bg-white/30" /> Money out
              </p>
              <h1 className="quote-serif mt-1.5 text-[36px] font-medium leading-[1] tracking-[-0.02em] [text-shadow:0_2px_20px_rgba(0,0,0,.28)] sm:text-[42px]">
                {customerName ? `${customerName}'s expenses` : 'Your expenses'}
              </h1>
              <p className="mt-1.5 text-[12.5px] tracking-[0.02em] text-white/[0.55]">
                Every rupee spent through TransRentals
              </p>

              {!isLoading && latest && (
                <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.08] px-3.5 py-2 text-[11.5px] text-white/[0.72] backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5 flex-none text-white/[0.55]" />
                  <span className="font-semibold text-white/[0.9]">Latest</span>
                  <span className="h-3 w-px bg-white/25" />
                  <span className="tabular-nums">{currencyFormatter.format(latest.amount)}</span>
                  {latest.date && (
                    <>
                      <span className="h-3 w-px bg-white/25" />
                      <span className="tabular-nums">{formatExpenseDate(latest.date)}</span>
                    </>
                  )}
                </p>
              )}

              <button
                type="button"
                onClick={() => router.push('/customer/dashboard')}
                className="group mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/[0.62] transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to dashboard
              </button>
            </div>
          </div>

          <div className="fin-perf relative z-10 hidden w-px lg:block" />

          {/* The four figures the old hero carried — one card each, all the
              same size, sitting on a single row. */}
          <div className="relative z-10 flex items-center pb-[62px] pl-6 pt-0 lg:pl-10 lg:pt-[62px]" style={GUTTER_R}>
            <div
              className="fin-rise grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5 xl:gap-3"
              style={{ ['--d' as any]: '.12s' }}
            >
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="relative flex flex-col overflow-hidden rounded-[18px] border border-white/[0.18] bg-white/[0.08] px-4 py-4 backdrop-blur-sm xl:px-5"
                >
                  {/* lit top edge, the same one the dashboard plates carry */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {/* a soft light inside the card, so it is not a flat pane */}
                  <span className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(220px 110px at 12% -10%, rgba(255,255,255,.13), transparent 62%)' }} />

                  <p className="relative flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.6] xl:text-[10px] xl:tracking-[0.18em]">
                    <span className="grid h-5 w-5 flex-none place-items-center rounded-lg border border-white/20 bg-white/[0.14]">
                      <stat.Icon className="h-[11px] w-[11px]" />
                    </span>
                    <span className="truncate">{stat.label}</span>
                  </p>
                  {/* Between lg and xl the four cards share a narrow column, so
                      the figure steps down rather than truncating. */}
                  <p className="quote-serif relative mt-3 truncate text-[22px] font-medium leading-none tracking-[-0.02em] tabular-nums [text-shadow:0_2px_18px_rgba(0,0,0,.25)] lg:text-[19px] xl:text-[25px]">
                    {isLoading ? '—' : stat.value}
                  </p>
                  {/* left to wrap rather than truncate — the grid stretches all
                      four cards to the tallest, so they stay level either way */}
                  <p className="relative mt-1.5 text-[11px] leading-[1.35] text-white/[0.5]">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ BODY ══════════════ */}
        <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-14 sm:px-8 lg:px-10">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#A6B1AA]">Your account</p>
          <h2 className="quote-serif mt-2 text-[34px] font-medium leading-none sm:text-[40px]">Financials</h2>

          <div className="mt-7 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_304px]">

            {/* ── LEFT ── */}
            <div>

              {/* spend over time */}
              {!isLoading && !error && byMonth.length > 0 && (
                <div className="mb-5 overflow-hidden rounded-[22px] border border-[#E7EEE9] bg-white">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-[#E7EEE9] px-6 py-4">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">How it moved</p>
                      <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none">Spend over time</h3>
                    </div>
                    <div className="flex items-center gap-[18px] text-[11px] text-[#78857C]">
                      <span className="inline-flex items-center gap-[7px]">
                        <i className="h-[9px] w-[9px] rounded-[3px] bg-[#09B368]" /> Monthly spend
                      </span>
                      <span className="inline-flex items-center gap-[7px]">
                        <i className="h-[9px] w-[9px] rounded-[3px] bg-[#B4700F]" /> Peak month
                      </span>
                    </div>
                  </div>

                  <div className="relative px-6 pt-7">
                    {/* something for the line's height to be read against */}
                    <div className="pointer-events-none absolute inset-x-6 top-7 bottom-[44px] flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-px bg-[#E7EEE9]/85" />)}
                    </div>

                    <div className="relative h-[190px]">
                      <svg
                        width="100%"
                        height={CHART_H}
                        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                        preserveAspectRatio="none"
                        className="block"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient id="finTrendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#09B368" stopOpacity="0.26" />
                            <stop offset="100%" stopColor="#09B368" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {chartPoints.length > 1 && (
                          <>
                            <path d={areaPath} fill="url(#finTrendFill)" />
                            {/* non-scaling stroke, or the horizontal stretch would
                                thin the line out unevenly */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#09B368"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </>
                        )}
                      </svg>

                      {chartPoints.map((p) => (
                        <span
                          key={`dot-${p.year}-${p.month}`}
                          title={`${p.label} · ${currencyFormatter.format(p.value)}`}
                          className={`absolute translate-x-[-50%] translate-y-[50%] rounded-full border-[3px] bg-white ${
                            p.isPeak
                              ? 'h-[13px] w-[13px] border-[#B4700F] shadow-[0_0_0_5px_rgba(180,112,15,.14)]'
                              : 'h-[11px] w-[11px] border-[#09B368]'
                          }`}
                          style={{ left: `${p.xPct}%`, bottom: `${p.bottomPct}%` }}
                        />
                      ))}

                      {monthPeak > 0 && chartPoints.length > 1 && (
                        <span
                          className="absolute top-[-4px] translate-x-[-50%] translate-y-[-100%] whitespace-nowrap rounded-lg bg-[#B4700F] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white after:absolute after:bottom-[-4px] after:left-1/2 after:h-2 after:w-2 after:translate-x-[-50%] after:rotate-45 after:rounded-[1px] after:bg-[#B4700F] after:content-['']"
                          style={{ left: `${chartPoints.find((p) => p.isPeak)?.xPct ?? 50}%` }}
                        >
                          {currencyFormatter.format(monthPeak)}
                        </span>
                      )}
                    </div>

                    <div
                      className="mt-3.5 grid border-t border-[#E7EEE9]"
                      style={{ gridTemplateColumns: `repeat(${byMonth.length}, minmax(0,1fr))` }}
                    >
                      {chartPoints.map((p) => (
                        <div key={`axis-${p.year}-${p.month}`} className="px-1 pb-5 pt-3 text-center">
                          <p className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${p.isPeak ? 'text-[#B4700F]' : 'text-[#A6B1AA]'}`}>
                            {p.label}
                          </p>
                          <p className={`mt-[5px] text-[12px] tabular-nums ${p.isPeak ? 'font-semibold text-[#B4700F]' : 'text-[#46524A]'}`}>
                            {currencyFormatter.format(p.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* expense log */}
              <div className="overflow-hidden rounded-2xl border border-[#F3D3D9] bg-white">
                <div className="flex items-end justify-between gap-3 border-b border-[#F3D3D9] bg-gradient-to-r from-[#FDF4F5] to-[#FFFCFC] px-5 py-4">
                  <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#B3253A]">Recorded by your account manager</p>
                    <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#8C1C2E]">Expense log</h3>
                  </div>
                  <span className="flex-none rounded-full bg-[#B3253A] px-2.5 py-[2px] text-[10px] font-bold text-white">
                    {expenses.length} {expenses.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {error && (
                  <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-xl border border-[#F3D3D9] bg-[#FDF4F5] px-4 py-3 text-[12.5px] text-[#8C1C2E]">
                    <span className="h-[7px] w-[7px] flex-none rounded-full bg-[#B3253A]" />
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="px-5 pb-4 pt-2" aria-label="Loading expense history">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4 border-b border-[#E7EEE9] py-3.5 last:border-b-0">
                        <span className="h-10 w-10 flex-none animate-pulse rounded-xl bg-[#EAF0EC]" />
                        <div className="min-w-0 flex-1">
                          <span className="block h-3 w-2/5 animate-pulse rounded bg-[#EAF0EC]" />
                          <span className="mt-2 block h-2.5 w-1/4 animate-pulse rounded bg-[#F1F5F2]" />
                        </div>
                        <span className="h-3 w-24 flex-none animate-pulse rounded bg-[#F1F5F2]" />
                        <span className="h-4 w-20 flex-none animate-pulse rounded bg-[#EAF0EC]" />
                      </div>
                    ))}
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-20">
                    <TrendingDown className="h-7 w-7 text-[#E4B7BF]" />
                    <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No expenses recorded yet</p>
                    <p className="max-w-xs text-center text-xs text-[#A6B1AA]">
                      Your spending history will appear here as your account manager records it.
                    </p>
                  </div>
                ) : (
                  <>
                    {ledgerGroups.map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-3.5 px-5 pb-2 pt-4">
                          <span className="whitespace-nowrap rounded-full bg-[#F4F8F5] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#78857C]">
                            {group.label}
                          </span>
                          <span className="h-px flex-1 bg-[#E7EEE9]" />
                          <span className="whitespace-nowrap text-[11px] tabular-nums text-[#A6B1AA] lg:w-[150px] lg:text-right">
                            {group.items.length} &middot; {currencyFormatter.format(group.total)}
                          </span>
                        </div>

                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className={`group relative grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 overflow-hidden border-b border-[#E7EEE9] px-5 py-3.5 transition last:border-b-0 after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-[#B3253A] after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100 lg:gap-x-[18px] lg:gap-y-0 ${
                              hasVendors
                                ? 'lg:grid-cols-[40px_minmax(0,1fr)_190px_140px_150px]'
                                : 'lg:grid-cols-[40px_minmax(0,1fr)_140px_150px]'
                            }`}
                          >
                            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#F3D3D9] bg-[#FDF4F5] text-[#B3253A]">
                              <IndianRupee className="h-[18px] w-[18px]" />
                            </span>

                            <div className="min-w-0">
                              <p className="quote-serif truncate text-[20px] font-semibold leading-[1.2]">{item.title}</p>
                              {item.description && <p className="mt-0.5 truncate text-[11.5px] text-[#A6B1AA]">{item.description}</p>}
                              {/* Below lg the vendor and date columns are gone, so they ride
                                  here instead — otherwise a phone never sees either. */}
                              {(item.vendor || item.date) && (
                                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#78857C] lg:hidden">
                                  {item.vendor && (
                                    <span className="inline-flex min-w-0 items-center gap-1.5">
                                      <Store className="h-3 w-3 flex-none text-[#A6B1AA]" />
                                      <span className="truncate">{item.vendor}</span>
                                    </span>
                                  )}
                                  {item.date && (
                                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                                      <Calendar className="h-3 w-3 flex-none text-[#A6B1AA]" />
                                      {formatExpenseDate(item.date)}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>

                            {hasVendors && (
                              <p className="hidden min-w-0 items-center gap-[7px] text-[12px] text-[#46524A] lg:flex">
                                <Store className="h-3.5 w-3.5 flex-none text-[#A6B1AA]" />
                                <span className="truncate">{item.vendor || <span className="text-[#D4DFD8]">&mdash;</span>}</span>
                              </p>
                            )}

                            <p className="hidden items-center gap-[7px] text-[12px] tabular-nums text-[#46524A] lg:flex">
                              <Calendar className="h-3.5 w-3.5 flex-none text-[#A6B1AA]" />
                              {item.date ? formatExpenseDate(item.date) : <span className="text-[#D4DFD8]">&mdash;</span>}
                            </p>

                            <p className="col-start-2 quote-serif whitespace-nowrap text-right text-[22px] font-semibold leading-none tabular-nums text-[#B3253A] lg:col-start-auto">
                              &minus;{currencyFormatter.format(item.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 border-t border-[#E7EEE9] bg-[#F4F8F5] px-5 py-4">
                      <span className="text-[12px] font-semibold text-[#78857C]">
                        {expenses.length} transaction{expenses.length === 1 ? '' : 's'}
                      </span>
                      <span className="text-right">
                        <span className="quote-serif block text-[26px] font-semibold leading-none tabular-nums">{currencyFormatter.format(totalExpense)}</span>
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#A6B1AA]">Total</span>
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* The caveat belongs directly under the ledger it qualifies. */}
              <div className="mt-5 flex flex-wrap items-start gap-4 rounded-2xl border border-[#F0E3C4] bg-gradient-to-br from-[#FEF8EA] to-[#FFFDF7] px-5 py-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#F0E3C4] bg-white text-[#B4700F]">
                  <Info className="h-[18px] w-[18px]" />
                </span>
                {/* basis keeps the copy from collapsing into a sliver beside the
                    button on a phone — below that width the button wraps under. */}
                <div className="min-w-0 flex-1 basis-[240px]">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#B4700F]">Good to know</p>
                  <h4 className="quote-serif mt-[3px] text-[20px] font-semibold text-[#3D2408]">About expenses</h4>
                  <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[#46524A]">
                    Expenses are recorded by your account manager. Contact the helpdesk if you notice any discrepancy.
                  </p>
                </div>
                {/* Solid gold, the same amber the chart's peak uses — the old
                    outline read as disabled against the card's cream. */}
                <Link
                  href="/customer/helpdesk"
                  className="group inline-flex flex-none items-center gap-2 self-center rounded-full bg-gradient-to-r from-[#D9930F] to-[#B4700F] px-[18px] py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(180,112,15,.85)] transition hover:-translate-y-0.5 hover:from-[#C8850D] hover:to-[#9A5F0B] hover:shadow-[0_14px_26px_-12px_rgba(180,112,15,.9)]"
                >
                  Contact helpdesk
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-[3px]" />
                </Link>
              </div>

            </div>

            {/* ── SIDEBAR ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-[88px] lg:self-start">

              {/* Summary — the four figures the old sidebar carried, given a
                  hierarchy: the total leads, the rest support it. */}
              {!isLoading && !error && (
                <div className="overflow-hidden rounded-2xl border border-[#C6E7D8] bg-white">
                  <div className="border-b border-[#C6E7D8] bg-gradient-to-r from-[#EAF8F1] to-[#F7FCFA] px-5 py-4">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#0E8552]">At a glance</p>
                    <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#04321F]">Summary</h3>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-[#E7EEE9] px-5 py-3.5">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-[#EAF8F1] text-[#056B3E]">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] text-[#0B1610]">Entries</span>
                        <span className="block text-[10.5px] text-[#A6B1AA]">Recorded transactions</span>
                      </span>
                    </span>
                    <span className="quote-serif flex-none text-[19px] font-semibold tabular-nums">{expenses.length}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-[#E7EEE9] px-5 py-3.5">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-[#E7EFFD] text-[#1D4ED8]">
                        <TrendingDown className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] text-[#0B1610]">Average</span>
                        <span className="block text-[10.5px] text-[#A6B1AA]">Per transaction</span>
                      </span>
                    </span>
                    <span className="quote-serif flex-none text-[19px] font-semibold tabular-nums">
                      {currencyFormatter.format(avgExpense)}
                    </span>
                  </div>

                  <div className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-[#FDF4F5] text-[#B3253A]">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] text-[#0B1610]">Highest</span>
                          <span className="block text-[10.5px] text-[#A6B1AA]">Single expense</span>
                        </span>
                      </span>
                      <span className="quote-serif flex-none text-[19px] font-semibold tabular-nums text-[#B3253A]">
                        {currencyFormatter.format(maxExpense)}
                      </span>
                    </div>
                    {/* what that one expense is worth against everything spent */}
                    {totalExpense > 0 && (
                      <>
                        <span className="mt-3 block h-[5px] overflow-hidden rounded-full bg-[#F4F8F5]">
                          <span
                            className="block h-full rounded-full bg-[#B3253A]/70"
                            style={{ width: `${Math.min(100, Math.max(3, Math.round((maxExpense / totalExpense) * 100)))}%` }}
                          />
                        </span>
                        <p className="mt-2 text-[10.5px] text-[#A6B1AA]">
                          <span className="font-semibold tabular-nums text-[#46524A]">
                            {Math.round((maxExpense / totalExpense) * 100)}%
                          </span>{' '}
                          of everything spent
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!isLoading && !error && byVendor.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[#E7EEE9] bg-white">
                  <div className="border-b border-[#E7EEE9] px-5 py-4">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#A6B1AA]">Who you paid</p>
                    <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none">By vendor</h3>
                  </div>
                  {byVendor.map((v) => (
                    <div key={v.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[#E7EEE9] px-5 py-3 last:border-b-0">
                      <span className="truncate text-[12.5px]">{v.name}</span>
                      <span className="text-[12.5px] font-semibold tabular-nums">{currencyFormatter.format(v.value)}</span>
                      <span className="col-span-2 h-[5px] overflow-hidden rounded-full bg-[#F4F8F5]">
                        <span className="block h-full rounded-full bg-[#09B368]" style={{ width: `${vendorTop > 0 ? Math.max(4, Math.round((v.value / vendorTop) * 100)) : 4}%` }} />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/customer/dashboard"
                className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#056040] to-[#09B368] px-5 py-4 text-white transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-28px_rgba(4,50,31,.5)]"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">My dashboard</span>
                  <span className="mt-0.5 block text-[11.5px] text-white/70">All bookings &amp; activity</span>
                </span>
                <ChevronRight className="ml-auto h-[18px] w-[18px] flex-none opacity-70 transition group-hover:translate-x-[3px] group-hover:opacity-100" />
              </Link>

              <Link
                href="/customer/helpdesk"
                className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-[#E7EEE9] bg-white px-5 py-4 text-[#0B7C74] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:border-[#BFE7E2] hover:after:scale-y-100"
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#BFE7E2] bg-[#F0FDFA]">
                  <HelpCircle className="h-[19px] w-[19px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-[#0B1610]">Need help?</span>
                  <span className="mt-0.5 block text-[11.5px] text-[#A6B1AA]">Open a support ticket</span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#0B7C74]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
