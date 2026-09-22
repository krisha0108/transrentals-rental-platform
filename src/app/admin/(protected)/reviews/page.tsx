'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Star,
  Check,
  X,
  Trash2,
  Search,
  Loader2,
  MessageSquareQuote,
  Globe,
  CalendarCheck,
  Mail,
  Phone,
} from 'lucide-react';

interface Review {
  id: string;
  /** 'site' = written from the homepage form; 'booking' = left after a trip. */
  source: 'site' | 'booking';
  bookingTable: string | null;
  bookingNumber: string | null;
  customerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  service: string | null;
  rating: number;
  comment: string;
  tags: string | null;
  photos: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  /** False for a booking review: the row belongs to the booking. */
  canDelete: boolean;
}

type Tab = 'all' | 'pending' | 'approved' | 'rejected';
type SourceFilter = 'all' | 'site' | 'booking';

const EMPTY_COUNTS = { pending: 0, approved: 0, rejected: 0, site: 0, booking: 0 };

/** Where a review came from — the two carry different weight, so they look different. */
const SOURCE_LABELS: Record<
  Review['source'],
  { label: string; hint: string; badge: string; avatar: string; Icon: typeof Globe }
> = {
  site: {
    label: 'Website form',
    hint: 'Written on the homepage, without logging in',
    badge: 'bg-sky-50 text-sky-700 ring-sky-100',
    avatar: 'bg-sky-50 text-sky-700 ring-sky-100',
    Icon: Globe,
  },
  booking: {
    label: 'After booking',
    hint: 'Left by a customer on a booking they actually took',
    badge: 'bg-violet-50 text-violet-700 ring-violet-100',
    avatar: 'bg-violet-50 text-violet-700 ring-violet-100',
    Icon: CalendarCheck,
  },
};

/** The stripe down the side of a card, so a queue can be read at a glance. */
const STATUS_STYLES: Record<Review['status'], { accent: string; pill: string; label: string }> = {
  PENDING: {
    accent: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-700 ring-amber-100',
    label: 'Pending',
  },
  APPROVED: {
    accent: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    label: 'Approved',
  },
  REJECTED: {
    accent: 'bg-rose-400',
    pill: 'bg-rose-50 text-rose-700 ring-rose-100',
    label: 'Rejected',
  },
};

/** The count beside a tab, tinted to match the state it counts. */
const TAB_BADGES: Record<Tab, string> = {
  all: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-gray-200 text-gray-500',
};

/** Stored as JSON text; a bad value must not break the queue. */
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [tab, setTab] = useState<Tab>('pending');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, source: sourceFilter, limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setCounts(data.counts || EMPTY_COUNTS);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, sourceFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchReviews, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchReviews, search]);

  // A booking review's id carries a colon, which has to survive the URL.
  const moderate = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchReviews();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
      fetchReviews();
    } finally {
      setBusy(null);
    }
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.pending + counts.approved + counts.rejected },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  const SOURCE_FILTERS: { key: SourceFilter; label: string; Icon: typeof Globe | null }[] = [
    { key: 'all', label: 'All sources', Icon: null },
    { key: 'site', label: 'Website form', Icon: Globe },
    { key: 'booking', label: 'After booking', Icon: CalendarCheck },
  ];

  return (
    <div className="space-y-5">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600">
              <MessageSquareQuote className="h-5 w-5" />
            </span>
            Customer Reviews
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-500">
            Reviews written on the homepage and ratings customers leave after a booking. Neither
            is shown on the site until it is approved here.
          </p>
        </div>

        {/* The two numbers a moderator actually acts on. */}
        <div className="flex gap-2.5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Waiting</p>
            <p className="text-xl font-bold leading-tight text-amber-900">{counts.pending}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Live on site
            </p>
            <p className="text-xl font-bold leading-tight text-gray-900">{counts.approved}</p>
          </div>
        </div>
      </div>

      {/* ── one toolbar: state, kind, search ───────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* State is the primary axis, so it gets the larger control. */}
          <div className="flex items-center gap-0.5 rounded-xl bg-gray-100 p-1">
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
                <span
                  className={`rounded-md px-1.5 text-[11px] font-bold ${TAB_BADGES[t.key]}`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

          {/* Which kind of review — the second question, visibly secondary. */}
          <div className="flex items-center gap-0.5 rounded-xl bg-gray-100 p-1">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  sourceFilter === f.key
                    ? 'bg-white font-semibold text-gray-900 shadow-sm'
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                {f.Icon && <f.Icon className="h-3.5 w-3.5" />}
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto min-w-[160px] flex-1 sm:max-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── the queue ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          {tab === 'all' ? 'No reviews yet.' : `No ${tab} reviews.`}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const origin = SOURCE_LABELS[r.source] ?? SOURCE_LABELS.site;
            const state = STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
            const meta = [r.service, r.city].filter(Boolean).join(' · ');

            return (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex">
                  <div className={`w-1 shrink-0 ${state.accent}`} />
                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${origin.avatar}`}
                        >
                          {initialsOf(r.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-gray-900">{r.name}</span>
                            <span
                              title={origin.hint}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${origin.badge}`}
                            >
                              <origin.Icon className="h-3 w-3" />
                              {origin.label}
                            </span>
                            {r.source === 'booking' && r.bookingNumber && (
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600">
                                {r.bookingNumber}
                              </span>
                            )}
                            {r.source === 'site' && r.customerId && (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                                Logged-in customer
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {meta || 'No service or city given'} · {shortDate(r.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5">
                          <span className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < r.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {r.rating.toFixed(1)}
                          </span>
                        </div>
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${state.pill}`}
                        >
                          {state.label}
                        </span>
                      </div>
                    </div>

                    {r.comment?.trim() ? (
                      <blockquote className="mt-4 whitespace-pre-line border-l-2 border-gray-200 pl-3.5 text-sm leading-relaxed text-gray-700">
                        {r.comment}
                      </blockquote>
                    ) : (
                      <p className="mt-4 text-sm italic text-gray-400">Rating only — no text</p>
                    )}

                    {parseList(r.tags).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {parseList(r.tags).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {parseList(r.photos).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parseList(r.photos).map((src) => (
                          <a
                            key={src}
                            href={'/' + src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-16 w-20 overflow-hidden rounded-lg border border-gray-200 transition-transform hover:scale-105"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={'/' + src} alt="" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3.5">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        {r.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {r.email}
                          </span>
                        )}
                        {r.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {r.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {r.status !== 'APPROVED' && (
                          <button
                            disabled={busy === r.id}
                            onClick={() => moderate(r.id, { status: 'APPROVED' })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <button
                            disabled={busy === r.id}
                            onClick={() => moderate(r.id, { status: 'REJECTED' })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        )}
                        {r.canDelete && (
                          <button
                            disabled={busy === r.id}
                            title="Delete permanently"
                            onClick={() => remove(r.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
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
