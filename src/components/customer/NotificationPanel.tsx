'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  ChevronRight,
  Loader2,
  BellOff,
  RefreshCw,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  image?: string | null;
  booking_id?: string | null;
  quote_id?: string | null;
  type: string;
  service_type?: string | null;
  is_read: boolean;
  created_at: string;
  relative_time: string;
}

// Normalize service type names (matching mobile app logic)
const SERVICE_TYPE_MAP: Record<string, string> = {
  'packers-and-movers': 'packers',
  'truck-rental': 'truck',
  'bus-rental': 'bus',
  'equipment-rental': 'equipment',
  'luxury-car-rental': 'luxury',
  'chauffeur-service': 'chauffeur-service',
  'self-drive': 'self-drive',
  'bike-rental': 'bike',
};

function getNotificationRoute(item: Notification): string {
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();
  const notifType = (item.type || '').toLowerCase();
  let serviceType = item.service_type || '';

  // Chat notification
  if (notifType === 'chat' || title.includes('new message')) {
    const bookingId = item.booking_id;
    if (bookingId && bookingId !== 'null' && bookingId.length >= 10) {
      return `/customer/booking/${bookingId}`;
    }
    return '/customer/dashboard';
  }

  // B2B notification
  const isB2B = notifType.startsWith('b2b_') || title.includes('b2b') || body.includes('b2b');
  if (isB2B) {
    const bookingId = item.booking_id;
    if (bookingId && bookingId !== 'null' && bookingId.length >= 10) {
      return `/customer/b2b-bookings/${bookingId}`;
    }
    return '/customer/b2b-bookings';
  }

  // Normalize service type
  if (serviceType && SERVICE_TYPE_MAP[serviceType]) {
    serviceType = SERVICE_TYPE_MAP[serviceType];
  }

  // Detect service type from title/body if not set
  if (!serviceType || serviceType === 'general') {
    if (title.includes('bike') || body.includes('bike')) serviceType = 'bike';
    else if (title.includes('self-drive') || title.includes('self drive') || body.includes('self-drive')) serviceType = 'self-drive';
    else if (title.includes('luxury') || body.includes('luxury')) serviceType = 'luxury';
    else if (title.includes('bus') || body.includes('bus')) serviceType = 'bus';
    else if (title.includes('truck') || body.includes('truck')) serviceType = 'truck';
    else if (title.includes('equipment') || body.includes('equipment')) serviceType = 'equipment';
    else if (title.includes('packers') || title.includes('movers') || body.includes('packers') || body.includes('movers')) serviceType = 'packers';
    else if (title.includes('chauffeur') || title.includes('driver') || body.includes('chauffeur')) serviceType = 'chauffeur-service';
    else if (title.includes('car') || body.includes('car rental')) serviceType = 'car';
    else return '/customer/dashboard';
  }

  const isQuote = item.type === 'quote' || (item.quote_id && !item.booking_id);
  const itemId = isQuote ? item.quote_id : item.booking_id;

  if (!itemId || itemId === 'null' || itemId.length < 10) {
    return '/customer/dashboard';
  }

  // Route map matching web app pages
  // bike/car/chauffeur booking pages expect booking NUMBER (e.g. BK-2026-0382, CB-2026-LJPHUM)
  // but notifications store raw prisma ID → use universal /customer/booking/[id] which auto-redirects
  // bus/truck/equipment/packers/luxury/self-drive booking pages accept raw ID directly
  // All quote pages accept raw ID directly
  const routeMap: Record<string, { booking: string; quote: string }> = {
    'bike':              { booking: `/customer/booking/${itemId}`, quote: `/customer/bike-quotes/${itemId}` },
    'car':               { booking: `/customer/booking/${itemId}`, quote: `/customer/self-drive-quotes/${itemId}` },
    'chauffeur-service': { booking: `/customer/booking/${itemId}`, quote: `/customer/booking/${itemId}` },
    'bus':               { booking: `/customer/bus-bookings/${itemId}`, quote: `/customer/bus-quotes/${itemId}` },
    'truck':             { booking: `/customer/truck-bookings/${itemId}`, quote: `/customer/truck-quotes/${itemId}` },
    'packers':           { booking: `/customer/packers-bookings/${itemId}`, quote: `/customer/packers-quotes/${itemId}` },
    'equipment':         { booking: `/customer/equipment-bookings/${itemId}`, quote: `/customer/equipment-quotes/${itemId}` },
    'luxury':            { booking: `/customer/luxury-bookings/${itemId}`, quote: `/customer/luxury-quotes/${itemId}` },
    'self-drive':        { booking: `/customer/self-drive-bookings/${itemId}`, quote: `/customer/self-drive-quotes/${itemId}` },
  };

  const routes = routeMap[serviceType];
  if (routes) {
    return isQuote ? routes.quote : routes.booking;
  }

  return '/customer/dashboard';
}

export default function NotificationPanel() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const id = parsed?.id ?? parsed?.customer_id ?? parsed?.customerId;
        if (id) setCustomerId(String(id));
      } catch {}
    }
  }, []);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!customerId) return;
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/customer/notifications?customer_id=${customerId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) fetchNotifications();
  }, [customerId, fetchNotifications]);

  // Poll every 30s
  useEffect(() => {
    if (!customerId) return;
    const interval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(interval);
  }, [customerId, fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!customerId) return;
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      await fetch('/api/customer/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
    } catch {
      // Revert on error
      fetchNotifications(true);
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    // Mark as read
    if (!item.is_read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      try {
        await fetch(`/api/customer/notifications/${item.id}/read`, { method: 'POST' });
      } catch {}
    }

    // Navigate
    const route = getNotificationRoute(item);
    router.push(route);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#056040] to-[#09B368] px-4 py-3 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-2 w-12 h-12 bg-white/10 rounded-full" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-5 h-5 text-[#09B368] animate-spin" />
            <p className="text-xs text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <BellOff className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 text-center mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50/80 transition-colors group ${
                  !item.is_read ? 'bg-emerald-50/40' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    !item.is_read
                      ? 'bg-[#09B368] shadow-sm shadow-emerald-200'
                      : 'bg-gray-100'
                  }`}>
                    {!item.is_read ? (
                      <BellRing className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Bell className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs leading-snug line-clamp-2 ${
                        !item.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                      }`}>
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="w-2 h-2 bg-[#09B368] rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${
                      !item.is_read ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {item.body}
                    </p>
                    {item.image && (
                      <div className="mt-1.5 rounded-lg overflow-hidden">
                        <Image src={item.image} alt="" width={300} height={80} className="w-full object-cover rounded-lg" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px]">{item.relative_time}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#09B368] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-medium">View</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
