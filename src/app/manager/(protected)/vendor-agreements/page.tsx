'use client';

// Manager queue for vendor partnership agreements. A vendor signs from
// /vendor/partnership-agreement, which drops a notification here; the
// partnership only counts as in force once a manager accepts it below.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileSignature, Loader2, Search, CheckCircle2, XCircle, Clock,
  MessageSquareWarning, Eye, CalendarClock, RefreshCw, Store, ChevronDown,
  PenLine, Hourglass, FileText, MapPin,
} from 'lucide-react';
import { TERM_OPTIONS_MONTHS } from '@/lib/content/partnership-agreement';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

type ReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface AgreementRow {
  id: string;
  vendorId: string;
  vendor: {
    id: string; businessName: string; vid: string | null; email: string;
    phone: string; city: string | null; status: string; logo: string | null;
  } | null;
  agreementVersion: string;
  signedByName: string;
  signedByTitle: string | null;
  queryNote: string | null;
  termMonths: number;
  acceptedAt: string;
  ipAddress: string | null;
  reviewStatus: ReviewStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
}

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

const STATUS_TONE: Record<ReviewStatus, { chip: string; dot: string; label: string; Icon: any }> = {
  PENDING: { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Awaiting review', Icon: Clock },
  ACCEPTED: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Accepted', Icon: CheckCircle2 },
  REJECTED: { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected', Icon: XCircle },
};

function when(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ManagerVendorAgreementsPage() {
  // Opens on everything by default — a manager scanning the queue wants the
  // full picture, not one slice of it.
  const [tab, setTab] = useState('all');
  const [term, setTerm] = useState('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<AgreementRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Rejection needs a reason, so the note box opens inline on that row.
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Changing a filter fires a new request while the previous one may still be
  // in flight. Without a token the slower (older) response lands last and
  // overwrites the list — which looked like "All shows nothing" even though
  // the API had returned the row.
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;
    setError(null);
    try {
      const res = await fetch(`/api/manager/vendor-agreements?status=${tab}&term=${term}&limit=100`);
      const data = await res.json();
      if (myReq !== reqRef.current) return; // superseded by a newer request
      if (!res.ok) throw new Error(data?.error || 'Failed to load agreements');
      setItems(data.items || []);
      setCounts(data.counts || { pending: 0, accepted: 0, rejected: 0, all: 0 });
    } catch (e: any) {
      if (myReq !== reqRef.current) return;
      setError(e?.message || 'Failed to load agreements');
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  }, [tab, term]);

  // Restore whatever filter the URL carries, so a reload (or a shared link)
  // lands on the same view instead of snapping back to the default.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get('status');
    const t = p.get('term');
    if (s && STATUS_OPTIONS.some((o) => o.id === s)) setTab(s);
    if (t && (t === 'all' || (TERM_OPTIONS_MONTHS as readonly number[]).includes(Number(t)))) setTerm(t);
  }, []);

  // Mirror the filters back into the URL. Defaults are left out so the plain
  // /manager/vendor-agreements link (the one notifications point at) stays clean.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (tab === 'all') p.delete('status'); else p.set('status', tab);
    if (term === 'all') p.delete('term'); else p.set('term', term);
    const qs = p.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [tab, term]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Managers leave this tab open while a vendor is signing, so keep it fresh:
  // refetch when the window regains focus and on a slow poll in the
  // background. Without this the list can show a decision that has already
  // been made elsewhere — and its action buttons would act on stale state.
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    const t = setInterval(refresh, 20000);
    return () => { window.removeEventListener('focus', refresh); clearInterval(t); };
  }, [load]);

  const review = async (id: string, action: 'accept' | 'reject', reason?: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch('/api/manager/vendor-agreements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: reason || undefined }),
      });
      const data = await res.json();

      // Someone already decided this one (another manager, or this page was
      // stale). Fold their decision in instead of pretending it failed.
      if (res.status === 409 && data?.agreement) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.agreement } : i)));
        setRejectingId(null);
        setNote('');
        setError(data.error || 'This agreement has already been reviewed.');
        await load();
        return;
      }

      if (!res.ok || !data.success) throw new Error(data?.error || 'Could not update the agreement');

      // Update this row in place first — the buttons disappear on the click
      // rather than a moment later when the refetch lands.
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.agreement } : i)));
      setRejectingId(null);
      setNote('');
      setFlash(action === 'accept' ? 'Accepted — the vendor has been notified.' : 'Rejected — the vendor has been notified.');
      setTimeout(() => setFlash(null), 4000);
      await load();
      // Keep the sidebar badge and bell in sync straight away.
      window.dispatchEvent(new Event('manager-notifications-updated'));
    } catch (e: any) {
      setError(e?.message || 'Could not update the agreement');
      // Resync so the card reflects whatever the server actually holds.
      load();
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      (i.vendor?.businessName || '').toLowerCase().includes(q) ||
      (i.vendor?.vid || '').toLowerCase().includes(q) ||
      i.signedByName.toLowerCase().includes(q),
    );
  }, [items, query]);

  // Header lives in the shared sticky bar rather than a second row underneath it.
  useManagerPageHeader(
    'Vendor Agreements',
    counts.pending > 0
      ? `${counts.pending} signed agreement${counts.pending === 1 ? '' : 's'} awaiting your review`
      : 'Nothing waiting on you right now',
    <button
      key="refresh"
      onClick={() => { setLoading(true); load(); }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Refresh
    </button>,
  );

  return (
    <div className="space-y-5">

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status — counts come from the API so they track the term filter */}
        <div className="relative">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
          >
            {STATUS_OPTIONS.map((o) => {
              const n = (counts as any)[o.id] || 0;
              return (
                <option key={o.id} value={o.id}>
                  {o.label}{n > 0 ? ` (${n})` : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Agreement term — same options the vendor picks when signing */}
        <div className="relative">
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
          >
            <option value="all">All terms</option>
            {TERM_OPTIONS_MONTHS.map((m) => (
              <option key={m} value={String(m)}>{m} Months</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor, VID or signer..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {flash && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4" /> {flash}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <FileSignature className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {query
              ? 'Nothing matches that search'
              : `No ${tab === 'all' ? '' : tab} agreements${term === 'all' ? '' : ` on a ${term}-month term`}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {tab === 'all' && term === 'all'
              ? 'Signed agreements show up here as soon as a vendor submits one.'
              : 'Try a different status or term.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const tone = STATUS_TONE[a.reviewStatus];
            const ToneIcon = tone.Icon;
            const busy = busyId === a.id;
            return (
              <div key={a.id} className={`relative rounded-2xl border bg-white shadow-sm overflow-hidden transition hover:shadow-md ${
                a.reviewStatus === 'PENDING' ? 'border-amber-200' : 'border-gray-100'
              }`}>
                {/* Status rail — the state reads before you get to the words */}
                <span className={`absolute inset-y-0 left-0 w-1 ${tone.dot}`} />

                <div className="p-5 pl-6">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Vendor */}
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {a.vendor?.logo
                        ? <img src={a.vendor.logo} alt="" className="w-full h-full object-cover" />
                        : <Store className="w-5 h-5 text-gray-400" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                          {a.vendor?.businessName || 'Unknown vendor'}
                        </h2>
                        {a.vendor?.vid && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-gray-500">
                            {a.vendor.vid.toUpperCase()}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
                          <ToneIcon className="w-3 h-3" />
                          {tone.label}
                        </span>
                      </div>

                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-gray-500">
                        <PenLine className="w-3.5 h-3.5 text-gray-400" />
                        Signed by <span className="font-semibold text-gray-900">{a.signedByName}</span>
                        {a.signedByTitle ? <span className="text-gray-400">&middot; {a.signedByTitle}</span> : null}
                      </p>
                    </div>

                    <Link
                      href={`/manager/vendors/${a.vendorId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> Vendor
                    </Link>
                  </div>

                  {/* The three things the vendor actually committed to. These
                      drive the decision, so they get their own panel instead of
                      the muted one-liner they used to share. */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 rounded-xl border border-gray-200 bg-gray-50/70 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 overflow-hidden">
                    <div className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <CalendarClock className="w-3 h-3" /> Signed on
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">{when(a.acceptedAt)}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <Hourglass className="w-3 h-3" /> Term
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        <span className="tabular-nums">{a.termMonths}</span> months
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <FileText className="w-3 h-3" /> Agreement
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900 font-mono">{a.agreementVersion}</p>
                    </div>
                  </div>

                  {/* Context that matters less — kept small and out of the way */}
                  {(a.vendor?.city || a.ipAddress) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                      {a.vendor?.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {a.vendor.city}
                        </span>
                      )}
                      {a.ipAddress && <span className="font-mono">Signed from {a.ipAddress}</span>}
                    </div>
                  )}

                  {/* The vendor's question, if they asked one at signing */}
                  {a.queryNote && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <MessageSquareWarning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                          Vendor&apos;s question at signing
                        </p>
                        <p className="mt-0.5 text-sm text-amber-800">{a.queryNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Review outcome, once it has one */}
                  {a.reviewStatus !== 'PENDING' && (
                    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {a.reviewStatus === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                        {a.reviewedByName ? ` by ${a.reviewedByName}` : ''}
                        {a.reviewedAt ? ` · ${when(a.reviewedAt)}` : ''}
                      </p>
                      {a.reviewNote && <p className="mt-1 text-sm text-gray-600">{a.reviewNote}</p>}
                    </div>
                  )}
                </div>

                {/* Actions — only while the agreement is still awaiting a decision. */}
                {a.reviewStatus === 'PENDING' && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                    {rejectingId === a.id ? (
                      <div className="space-y-2.5">
                        <label className="block text-xs font-semibold text-gray-600">
                          Why are you rejecting this? The vendor sees this note.
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          placeholder="e.g. Please re-sign with the registered owner's name."
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => review(a.id, 'reject', note)}
                            disabled={busy || !note.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-40 transition"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Confirm rejection
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setNote(''); }}
                            disabled={busy}
                            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => review(a.id, 'accept')}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Accept agreement
                        </button>
                        <button
                          onClick={() => { setRejectingId(a.id); setNote(''); }}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-rose-300 hover:text-rose-700 transition"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
