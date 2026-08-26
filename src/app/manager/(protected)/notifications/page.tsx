'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import { Bell, BellRing, Loader2, MapPinPlus, Layers, Mail, Plane, CheckCheck, RefreshCw, Inbox } from 'lucide-react';

interface ManagerNotification {
  id: string;
  type: 'NEW_LOCATION_REQUEST' | 'NEW_SERVICE_REQUEST' | 'NEW_CONTACT_INQUIRY' | 'NEW_TRAVEL_AGENT_REGISTRATION';
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_ICON: Record<string, any> = {
  NEW_LOCATION_REQUEST: MapPinPlus,
  NEW_SERVICE_REQUEST: Layers,
  NEW_CONTACT_INQUIRY: Mail,
  NEW_TRAVEL_AGENT_REGISTRATION: Plane,
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ManagerNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ManagerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPage = useCallback(async (reset: boolean) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = new URLSearchParams({ filter, limit: '20' });
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      const res = await fetch(`/api/manager/notifications?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPage(true);
  };

  useManagerPageHeader(
    'Notifications',
    unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : "You're all caught up",
    <button
      key="refresh"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/manager/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
    } catch {
      // best-effort
    } finally {
      window.dispatchEvent(new Event('manager-notifications-updated'));
    }
  };

  const handleItemClick = async (n: ManagerNotification) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await fetch('/api/manager/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead', ids: [n.id] }),
        });
      } catch {
        // best-effort
      } finally {
        window.dispatchEvent(new Event('manager-notifications-updated'));
      }
    }
    if (n.link) router.push(n.link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600"><Inbox className="w-5 h-5" /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{items.length}{nextCursor ? '+' : ''}</p>
              <p className="text-xs text-gray-500">{filter === 'unread' ? 'Unread Shown' : 'Total Shown'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><BellRing className="w-5 h-5" /></div>
            <div>
              <p className="text-xl font-bold text-orange-600">{unreadCount}</p>
              <p className="text-xs text-gray-500">Unread</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                filter === f ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{filter === 'unread' ? "You're all caught up" : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((n) => {
              const Icon = NOTIFICATION_ICON[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex items-start gap-3 px-4 sm:px-5 py-4 text-left hover:bg-gray-50 transition ${!n.isRead ? 'bg-orange-50/50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${!n.isRead ? 'text-orange-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(n.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {nextCursor && (
          <div className="p-4 text-center border-t border-gray-100">
            <button
              onClick={() => fetchPage(false)}
              disabled={loadingMore}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
