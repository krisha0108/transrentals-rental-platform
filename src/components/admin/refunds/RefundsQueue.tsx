'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Send,
  ClipboardCheck,
  UserCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Refund {
  id: string;
  source: string;
  bookingId: string;
  bookingNumber: string;
  serviceType: string;
  customerId: string | null;
  customerName: string | null;
  amount: number;
  status: 'PENDING' | 'MANAGER_REVIEWED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NOT_REQUIRED';
  gatewayRefundId: string | null;
  notes: string | null;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
  /** Whether this service stores a gateway payment id we can refund against. */
  gateway: boolean;
  /** The booking's own service slug — for linking straight to it. Null if unmapped. */
  serviceSlug: string | null;
  /** The manager's call — null until reviewed. */
  customerRefundApproved: boolean | null;
  approvedAmount: number | null;
  vendorPayoutApproved: boolean | null;
  managerNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

type Tab = 'pending' | 'manager_reviewed' | 'processing' | 'failed' | 'completed' | 'not_required' | 'all';
type ViewerRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';

const EMPTY = {
  pending: 0,
  managerReviewed: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  notRequired: 0,
  outstandingAmount: 0,
};

const STATUS_STYLE: Record<Refund['status'], { pill: string; accent: string; label: string }> = {
  PENDING: { pill: 'bg-amber-50 text-amber-700 ring-amber-100', accent: 'bg-amber-400', label: 'Pending' },
  MANAGER_REVIEWED: { pill: 'bg-indigo-50 text-indigo-700 ring-indigo-100', accent: 'bg-indigo-400', label: 'Sent to admin' },
  PROCESSING: { pill: 'bg-blue-50 text-blue-700 ring-blue-100', accent: 'bg-blue-400', label: 'Processing' },
  COMPLETED: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100', accent: 'bg-emerald-500', label: 'Completed' },
  FAILED: { pill: 'bg-rose-50 text-rose-700 ring-rose-100', accent: 'bg-rose-500', label: 'Failed' },
  NOT_REQUIRED: { pill: 'bg-gray-100 text-gray-500 ring-gray-200', accent: 'bg-gray-300', label: 'Not required' },
};

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function RefundsQueue() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [counts, setCounts] = useState(EMPTY);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Manager's decision form — one open at a time, same as the "record by
  // hand" note box below.
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [reviewApprove, setReviewApprove] = useState<boolean | null>(null);
  const [reviewAmount, setReviewAmount] = useState('');
  const [reviewVendorPayout, setReviewVendorPayout] = useState<boolean | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/refunds?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRefunds(data.refunds || []);
        setCounts(data.counts || EMPTY);
        if (data.viewerRole) setViewerRole(data.viewerRole);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(fetchRefunds, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchRefunds, search]);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/refunds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'That did not work.');
        return;
      }
      setNoteFor(null);
      setNote('');
      setReviewFor(null);
      setReviewApprove(null);
      setReviewAmount('');
      setReviewVendorPayout(null);
      setReviewNotes('');
      fetchRefunds();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(null);
    }
  };

  const openReview = (r: Refund) => {
    setReviewFor(r.id);
    setReviewApprove(null);
    setReviewAmount(String(Math.round(r.amount)));
    setReviewVendorPayout(null);
    setReviewNotes('');
    setError(null);
  };

  const submitReview = (id: string) => {
    if (reviewApprove === null || reviewVendorPayout === null) {
      setError('Answer both questions before sending this to admin.');
      return;
    }
    if (!reviewNotes.trim()) {
      setError('Add a note explaining the decision.');
      return;
    }
    act(id, {
      action: 'review',
      customerRefundApproved: reviewApprove,
      approvedAmount: reviewApprove ? Number(reviewAmount) : undefined,
      vendorPayoutApproved: reviewVendorPayout,
      managerNotes: reviewNotes.trim(),
    });
  };

  const isManager = viewerRole === 'MANAGER';
  const isSuperAdmin = viewerRole === 'SUPER_ADMIN';

  const TABS: { key: Tab; label: string; count: number | null }[] = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'manager_reviewed', label: 'Sent to admin', count: counts.managerReviewed },
    { key: 'processing', label: 'Processing', count: counts.processing },
    { key: 'failed', label: 'Failed', count: counts.failed },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'not_required', label: 'Not required', count: counts.notRequired },
    { key: 'all', label: 'All', count: null },
  ];

  return (
    <div className="space-y-5">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </span>
            Refunds
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-500">
            {isManager
              ? 'Every cancelled booking that may owe a customer money. Decide what happens and hand it to admin.'
              : 'Every cancelled booking that owes a customer money, across all services. A refund leaves this queue only when someone says what happened to it.'}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
            Still owed
          </p>
          <p className="text-xl font-bold leading-tight text-amber-900">
            {money(counts.outstandingAmount)}
          </p>
        </div>
      </div>

      {/* ── toolbar ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-0.5 rounded-xl bg-gray-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
                  tab === t.key
                    ? 'bg-white font-semibold text-gray-900 shadow-sm'
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
                {t.count !== null && (
                  <span className="rounded-md bg-gray-200/70 px-1.5 text-[11px] font-bold text-gray-600">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative ml-auto min-w-[170px] flex-1 sm:max-w-[250px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Booking no. or customer"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-300 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* ── the queue ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          {tab === 'pending' ? 'Nothing waiting. Every refund is settled.' : `No ${tab.replace('_', ' ')} refunds.`}
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => {
            const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING;
            const displayAmount = r.approvedAmount ?? r.amount;

            // A manager can review anything that has never been reviewed —
            // even a FAILED one from before this flow existed. Once reviewed,
            // a later FAILED retry is admin's job, not a fresh review.
            // NOT_REQUIRED is reviewable too — the customer owes nothing, but
            // the manager still needs to weigh in on the vendor's payout.
            const canReview = isManager && !r.reviewedAt && ['PENDING', 'FAILED', 'NOT_REQUIRED'].includes(r.status);
            // A plain admin needs that review on record first; super admins
            // can act on anything open, review or not.
            const canExecute =
              !isManager &&
              ['PENDING', 'MANAGER_REVIEWED', 'PROCESSING', 'FAILED'].includes(r.status) &&
              (isSuperAdmin || !!r.reviewedAt);
            const declinedByManager = r.status === 'MANAGER_REVIEWED' && r.customerRefundApproved === false;
            // Admins and managers land on different booking-detail routes —
            // this is the one thing on the card that lets whoever's reading
            // it actually open the booking and see the full picture (dates,
            // vehicle, payment, cancellation reason) instead of just a number.
            const bookingHref = isManager
              ? `/manager/bookings/${r.bookingId}`
              : r.serviceSlug
                ? `/admin/services/${r.serviceSlug}/bookings/${r.bookingId}`
                : null;

            return (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex">
                  <div className={`w-1 shrink-0 ${s.accent}`} />
                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold text-gray-900">
                            {r.customerName || 'Customer'}
                          </span>
                          {bookingHref ? (
                            <Link
                              href={bookingHref}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 hover:text-blue-800"
                              title="Open this booking in a new tab"
                            >
                              {r.bookingNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600">
                              {r.bookingNumber}
                            </span>
                          )}
                          <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">
                            {r.serviceType}
                          </span>
                          {!r.gateway && (
                            <span
                              title="This service does not store a gateway payment id — settle it by hand, then record it here."
                              className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-100"
                            >
                              Manual only
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Cancelled {shortDate(r.createdAt)}
                          {r.handledAt ? ` · last touched ${shortDate(r.handledAt)}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[20px] font-extrabold tabular-nums text-gray-900">
                          {money(displayAmount)}
                        </span>
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${s.pill}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="mt-3 whitespace-pre-line border-l-2 border-gray-200 pl-3.5 text-sm leading-relaxed text-gray-600">
                        {r.notes}
                      </p>
                    )}

                    {r.gatewayRefundId && (
                      <p className="mt-3 text-xs text-gray-500">
                        Gateway refund{' '}
                        <span className="font-mono text-gray-700">{r.gatewayRefundId}</span>
                      </p>
                    )}

                    {/* ── manager's decision, once one exists ── */}
                    {r.reviewedAt && (
                      <div className="mt-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                          <UserCheck className="h-3.5 w-3.5" />
                          Manager&apos;s decision · {shortDate(r.reviewedAt)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-indigo-950">
                          <span>
                            Customer refund:{' '}
                            <strong>{r.customerRefundApproved ? `Yes, ${money(r.approvedAmount ?? 0)}` : 'No'}</strong>
                          </span>
                          <span>
                            Vendor keeps their share:{' '}
                            <strong>{r.vendorPayoutApproved ? 'Yes' : 'No'}</strong>
                          </span>
                        </div>
                        {r.managerNotes && (
                          <p className="mt-1.5 text-sm leading-relaxed text-indigo-900">{r.managerNotes}</p>
                        )}
                      </div>
                    )}

                    {/* ── manager's decision form ── */}
                    {reviewFor === r.id ? (
                      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                        <p className="mb-3 text-sm font-semibold text-gray-800">
                          Review this refund for admin
                        </p>

                        <div className="space-y-3">
                          <div>
                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Does the customer get a refund?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setReviewApprove(true)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                  reviewApprove === true
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-white'
                                }`}
                              >
                                Yes, refund owed
                              </button>
                              <button
                                onClick={() => setReviewApprove(false)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                  reviewApprove === false
                                    ? 'bg-gray-700 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-white'
                                }`}
                              >
                                No, nothing owed
                              </button>
                            </div>
                          </div>

                          {reviewApprove === true && (
                            <div>
                              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                                Approved amount (owed: {money(r.amount)})
                              </p>
                              <div className="relative max-w-[160px]">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={Math.round(r.amount)}
                                  value={reviewAmount}
                                  onChange={(e) => setReviewAmount(e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-6 pr-3 text-sm outline-none focus:border-emerald-300"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Does the vendor keep their share of this booking?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setReviewVendorPayout(true)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                  reviewVendorPayout === true
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-white'
                                }`}
                              >
                                Yes, vendor keeps it
                              </button>
                              <button
                                onClick={() => setReviewVendorPayout(false)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                  reviewVendorPayout === false
                                    ? 'bg-gray-700 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-white'
                                }`}
                              >
                                No, hold it back
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                              Note for admin
                            </label>
                            <textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={2}
                              placeholder="Why, and anything admin should know before paying this out…"
                              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                          </div>
                        </div>

                        <div className="mt-3.5 flex flex-wrap gap-2">
                          <button
                            disabled={busy === r.id}
                            onClick={() => submitReview(r.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Send to admin
                          </button>
                          <button
                            disabled={busy === r.id}
                            onClick={() => { setReviewFor(null); setError(null); }}
                            className="ml-auto rounded-lg px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : noteFor === r.id ? (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          What happened to this refund?
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          placeholder="Paid by NEFT on 28 Sep, ref XXXX…"
                          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            disabled={busy === r.id || !note.trim()}
                            onClick={() => act(r.id, { action: 'mark', status: 'COMPLETED', notes: note })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                          </button>
                          <button
                            disabled={busy === r.id || !note.trim()}
                            onClick={() => act(r.id, { action: 'mark', status: 'NOT_REQUIRED', notes: note })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-white disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" /> Nothing owed
                          </button>
                          <button
                            disabled={busy === r.id}
                            onClick={() => { setNoteFor(null); setNote(''); }}
                            className="ml-auto rounded-lg px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : canReview ? (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5">
                        <button
                          disabled={busy === r.id}
                          onClick={() => openReview(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" /> Review & decide
                        </button>
                      </div>
                    ) : canExecute ? (
                      declinedByManager ? (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5">
                          <button
                            disabled={busy === r.id}
                            onClick={() =>
                              act(r.id, {
                                action: 'mark',
                                status: 'NOT_REQUIRED',
                                notes: r.managerNotes || 'Closed — manager found no refund owed.',
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                          >
                            {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                            Close — no refund owed
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3.5">
                          {r.gateway && (
                            <button
                              disabled={busy === r.id}
                              onClick={() => act(r.id, { action: 'process' })}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busy === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Refund {money(displayAmount)} now
                            </button>
                          )}
                          <button
                            disabled={busy === r.id}
                            onClick={() => { setNoteFor(r.id); setNote(''); setError(null); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Record by hand
                          </button>
                          {r.status !== 'PROCESSING' && (
                            <button
                              disabled={busy === r.id}
                              onClick={() => act(r.id, { action: 'mark', status: 'PROCESSING' })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Clock className="h-3.5 w-3.5" /> I&apos;m on it
                            </button>
                          )}
                        </div>
                      )
                    ) : !isManager && ['PENDING', 'FAILED'].includes(r.status) && !r.reviewedAt ? (
                      <p className="mt-4 flex items-center gap-1.5 border-t border-gray-100 pt-3.5 text-xs font-semibold text-gray-400">
                        <ArrowRight className="h-3.5 w-3.5" /> Waiting on a manager to review this
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
