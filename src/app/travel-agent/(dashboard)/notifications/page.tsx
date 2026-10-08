'use client';

// Travel agent notifications inbox. Backed by the proper
// travel_agent_notifications table — no settings-blob hack. Supports filter
// tabs (with live per-type counts), mark-as-read (single + all), delete
// (single + all), cursor pagination, date-grouped list, and 30s background
// polling so the unread count stays fresh.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCheck, Trash2, Loader2, Inbox, Target, Wallet, Compass,
  MessageSquare, Settings, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

type NotificationType = 'LEAD' | 'PAYMENT' | 'BOOKING' | 'CHAT' | 'SYSTEM';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  metadata: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

type Filter = 'all' | 'unread' | 'lead' | 'payment' | 'booking' | 'chat' | 'system';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'      },
  { key: 'unread',  label: 'Unread'   },
  { key: 'lead',    label: 'Leads'    },
  { key: 'payment', label: 'Payments' },
  { key: 'booking', label: 'Bookings' },
  { key: 'chat',    label: 'Chats'    },
  { key: 'system',  label: 'System'   },
];

const TYPE_META: Record<NotificationType, { icon: any; cls: string; ring: string }> = {
  LEAD:    { icon: Target,        cls: 'bg-rose-100 text-rose-600',       ring: 'ring-rose-200'    },
  PAYMENT: { icon: Wallet,        cls: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-200' },
  BOOKING: { icon: Compass,       cls: 'bg-indigo-100 text-indigo-600',   ring: 'ring-indigo-200'  },
  CHAT:    { icon: MessageSquare, cls: 'bg-blue-100 text-blue-600',       ring: 'ring-blue-200'    },
  SYSTEM:  { icon: Settings,      cls: 'bg-gray-100 text-gray-600',       ring: 'ring-gray-200'    },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Buckets a already-sorted (newest-first) list into Today / Yesterday / This
// week / Earlier sections, without reshuffling order within a bucket.
function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], 'This week': [], Earlier: [] };
  for (const n of items) {
    const t = startOfDay(new Date(n.createdAt));
    if (t === today) buckets.Today.push(n);
    else if (t === yesterday) buckets.Yesterday.push(n);
    else if (t > weekAgo) buckets['This week'].push(n);
    else buckets.Earlier.push(n);
  }
  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }));
}

function NotificationRow({
  n,
  onMarkRead,
  onDelete,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
  const Icon = meta.icon;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    if (!n.isRead) onMarkRead(n.id);
  };

  const inner = (
    <div className="flex items-start gap-3 w-full min-w-0">
      <div className={`p-2 rounded-xl ${meta.cls} flex-shrink-0 ${!n.isRead ? `ring-2 ${meta.ring}` : ''}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-tight break-words ${n.isRead ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
            {n.title}
          </p>
          <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
        </div>
        <p className={`text-xs mt-1 leading-relaxed line-clamp-2 break-words ${n.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
          {n.body}
        </p>
        {n.link && (
          <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 group-hover/row:text-emerald-700 transition-colors">
            View <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>
      {!n.isRead && (
        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" aria-label="Unread" />
      )}
    </div>
  );

  return (
    <div className={`relative group/row border-l-2 ${
      !n.isRead ? 'bg-emerald-50/30 border-l-emerald-500' : 'border-l-transparent hover:bg-gray-50'
    } transition-colors`}>
      {n.link ? (
        <Link href={n.link} onClick={handleClick}
          className="block px-4 sm:px-5 py-4 pr-12">
          {inner}
        </Link>
      ) : (
        <button onClick={handleClick} className="block w-full text-left px-4 sm:px-5 py-4 pr-12">
          {inner}
        </button>
      )}

      {/* Per-row actions — always visible on touch screens (no hover there
          to reveal them), hover-reveal only once a pointer device is likely. */}
      <div className="absolute right-2 top-3 flex items-center gap-1">
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 focus:opacity-100"
            aria-label="More">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <button onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" aria-label="Close" />
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                {!n.isRead && (
                  <button onClick={() => { onMarkRead(n.id); setMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <CheckCheck className="h-3.5 w-3.5" /> Mark as read
                  </button>
                )}
                <button onClick={() => { onDelete(n.id); setMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TravelAgentNotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (opts: { cursor?: string | null; replace?: boolean } = {}) => {
    const params = new URLSearchParams({ filter, limit: '20' });
    if (opts.cursor) params.set('cursor', opts.cursor);
    try {
      const res = await fetch(`/api/travel-agent/notifications?${params}`);
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        return;
      }
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
      setTypeCounts(data.typeCounts ?? {});
      setNextCursor(data.nextCursor ?? null);
      setItems(prev => opts.replace ? data.items : [...prev, ...data.items]);
      setError(null);
    } catch {
      setError('Network error');
    }
  }, [filter]);

  // Initial load + filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setNextCursor(null);
    fetchPage({ replace: true }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [filter, fetchPage]);

  // Background poll every 30s — keeps unread count + new items fresh
  useEffect(() => {
    const t = setInterval(() => fetchPage({ replace: true }), 30_000);
    return () => clearInterval(t);
  }, [fetchPage]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchPage({ cursor: nextCursor });
    setLoadingMore(false);
  };

  const markRead = async (id: string) => {
    // Optimistic
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await fetch('/api/travel-agent/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', ids: [id] }),
      });
    } catch { /* leave optimistic state */ }
  };

  const markAllRead = async () => {
    if (bulkBusy || unreadCount === 0) return;
    setBulkBusy(true);
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/travel-agent/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
    } catch { /* leave optimistic */ }
    setBulkBusy(false);
  };

  const deleteOne = async (id: string) => {
    const removed = items.find(n => n.id === id);
    setItems(prev => prev.filter(n => n.id !== id));
    if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
    try {
      await fetch('/api/travel-agent/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch { /* leave optimistic */ }
  };

  const clearAll = async () => {
    if (bulkBusy || items.length === 0) return;
    if (typeof window !== 'undefined' && !window.confirm('Clear all notifications? This cannot be undone.')) return;
    setBulkBusy(true);
    setItems([]);
    setUnreadCount(0);
    try {
      await fetch('/api/travel-agent/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch { /* leave optimistic */ }
    setBulkBusy(false);
  };

  const grouped = groupByDate(items);

  useTravelAgentPageHeader(
    'Notifications',
    'Updates about your leads, payments, bookings and chats',
    <div key="actions" className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      <button onClick={markAllRead} disabled={unreadCount === 0 || bulkBusy}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <CheckCheck className="h-3.5 w-3.5" />
        <span className="sm:inline">Mark all read</span>
      </button>
      <button onClick={clearAll} disabled={items.length === 0 || bulkBusy}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sm:inline">Clear all</span>
      </button>
    </div>,
  );

  return (
    <div className="space-y-5">
      {/* Filter tabs — live counts per type */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const count = f.key === 'unread' ? unreadCount : typeCounts[f.key];
          const showBadge = typeof count === 'number' && count > 0;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200/50'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}>
              {f.label}
              {showBadge && (
                <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 ${
                  isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-16 flex justify-center bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-rose-600 font-semibold">{error}</p>
          <button onClick={() => fetchPage({ replace: true })}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center px-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
            <Inbox className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-gray-700 font-semibold">No notifications</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            {filter === 'unread'
              ? 'You\'re all caught up'
              : 'Updates from your leads, payments and bookings will show up here'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ label, items: groupItems }) => (
            <div key={label}>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
              <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {groupItems.map(n => (
                  <NotificationRow key={n.id} n={n} onMarkRead={markRead} onDelete={deleteOne} />
                ))}
              </div>
            </div>
          ))}
          {nextCursor && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-5 py-3">
              <button onClick={loadMore} disabled={loadingMore}
                className="w-full py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors">
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </span>
                ) : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
