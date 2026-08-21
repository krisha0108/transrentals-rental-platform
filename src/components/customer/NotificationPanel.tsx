'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  Car,
  Bike,
  Users,
  Truck,
  Star,
  Wrench,
  Package,
  MessageCircle,
  IndianRupee,
  CheckCircle,
  KeyRound,
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

// Notification titles are written with emoji by the API routes that create
// them. Strip them here and show an SVG icon instead — this also cleans the
// rows already stored in the database.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function stripEmoji(text?: string | null): string {
  if (!text) return '';
  return text.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/** Tint for the icon tile, matching the ledger's per-service colours. */
function getNotificationTint(item: Notification) {
  const raw = (item.service_type || '').toLowerCase();
  const service = SERVICE_TYPE_MAP[raw] || raw;
  const type = (item.type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const hay = `${service} ${title}`;

  if (type === 'chat' || title.includes('message'))
    return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' };
  if (title.includes('payment') || title.includes('refund'))
    return { bg: 'bg-[#EAF8F1]', border: 'border-[#BEE9D3]', text: 'text-[#056B3E]' };

  if (hay.includes('bike') || hay.includes('scooter'))
    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' };
  if (hay.includes('bus') || hay.includes('tempo'))
    return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' };
  if (hay.includes('truck') || hay.includes('transporter'))
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' };
  if (hay.includes('luxury'))
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
  if (hay.includes('packer') || hay.includes('mover'))
    return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' };
  if (hay.includes('equipment') || hay.includes('jcb') || hay.includes('crane'))
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' };
  if (hay.includes('self-drive') || hay.includes('self drive'))
    return { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600' };
  if (hay.includes('car') || hay.includes('chauffeur') || hay.includes('outstation') || hay.includes('airport'))
    return { bg: 'bg-[#EAF8F1]', border: 'border-[#BEE9D3]', text: 'text-[#056B3E]' };

  return { bg: 'bg-[#F4F8F5]', border: 'border-[#E7EEE9]', text: 'text-[#78857C]' };
}

/** Pick the icon from the notification's own service_type / type fields. */
function getNotificationIcon(item: Notification) {
  const raw = (item.service_type || '').toLowerCase();
  const service = SERVICE_TYPE_MAP[raw] || raw;
  const type = (item.type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  if (type === 'chat' || title.includes('message')) return MessageCircle;
  if (title.includes('otp')) return KeyRound;
  if (title.includes('accepted') || title.includes('confirmed')) return CheckCircle;
  if (title.includes('payment') || title.includes('refund')) return IndianRupee;

  if (service.includes('bus')) return Users;
  if (service.includes('truck') || service.includes('transporter')) return Truck;
  if (service.includes('luxury')) return Star;
  if (service.includes('equipment')) return Wrench;
  if (service.includes('packers')) return Package;
  if (service.includes('bike')) return Bike;
  if (service.includes('car') || service.includes('drive')) return Car;

  if (title.includes('bus')) return Users;
  if (title.includes('truck') || title.includes('transporter')) return Truck;
  if (title.includes('luxury')) return Star;
  if (title.includes('equipment')) return Wrench;
  if (title.includes('packers') || title.includes('movers')) return Package;
  if (title.includes('bike')) return Bike;
  if (title.includes('car') || title.includes('drive')) return Car;

  return Bell;
}

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
    let resolved: string | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const id = parsed?.id ?? parsed?.customer_id ?? parsed?.customerId;
        if (id) resolved = String(id);
      } catch {}
    }
    if (resolved) setCustomerId(resolved);
    // Without this the spinner never clears: fetchNotifications returns early
    // when there is no id, so `loading` would stay true forever.
    else setLoading(false);
  }, []);

  // Guards the 30s poll: on a slow connection the previous request can still
  // be open when the next tick fires, which stacks requests and keeps the card
  // in its refreshing state indefinitely.
  const inFlight = useRef(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!customerId) return;
    if (inFlight.current) return;
    inFlight.current = true;
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
      inFlight.current = false;
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

  // Presentation only — the same list, split into two dated groups so the
  // timeline reads like a diary. Nothing is filtered out, dropped or reordered.
  const groups = useMemo(() => {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recent: Notification[] = [];
    const older: Notification[] = [];
    notifications.forEach((n) => {
      const t = new Date(n.created_at).getTime();
      if (Number.isFinite(t) && now - t < WEEK_MS) recent.push(n);
      else older.push(n);
    });
    return [
      { label: 'This week', items: recent },
      { label: 'Earlier', items: older },
    ].filter((g) => g.items.length > 0);
  }, [notifications]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#C3D6F5] bg-white">
      {/* Header — blue. Green sits in the column to the left, so this card
          needs a hue the eye separates at a glance, not a near-green. */}
      <div className="flex items-end justify-between gap-3 border-b border-[#C3D6F5] bg-gradient-to-r from-[#E7EFFD] to-[#F7FAFF] px-5 py-4">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#1D4ED8]">Activity</p>
          <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#122A5E]">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#09B368] px-2.5 py-[2px] text-[10px] font-bold text-white">
              {unreadCount} new
            </span>
          )}
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="grid h-7 w-7 place-items-center rounded-[9px] border border-[#C3D6F5] bg-white text-[#1D4ED8] transition hover:border-[#1D4ED8] hover:text-[#122A5E] disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-[#09B368]' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="grid h-7 w-7 place-items-center rounded-[9px] border border-[#C3D6F5] bg-white text-[#1D4ED8] transition hover:border-[#1D4ED8] hover:text-[#122A5E]"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notification List — scrolls inside the card */}
      <div className="max-h-[452px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <div className="px-5 pb-4 pt-1" aria-label="Loading notifications">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3.5 py-3">
                <span className="h-[34px] w-[34px] flex-none animate-pulse rounded-[11px] bg-[#EAF0EC]" />
                <div className="min-w-0 flex-1">
                  <span className="block h-3 w-3/5 animate-pulse rounded bg-[#EAF0EC]" />
                  <span className="mt-2 block h-2.5 w-full animate-pulse rounded bg-[#F1F5F2]" />
                  <span className="mt-1.5 block h-2.5 w-2/5 animate-pulse rounded bg-[#F1F5F2]" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-10">
            <BellOff className="mb-2.5 h-5 w-5 text-[#D4DFD8]" />
            <p className="text-[13px] font-semibold text-[#78857C]">No notifications</p>
            <p className="mt-1 text-center text-xs text-[#A6B1AA]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="px-5 pb-4">
            {groups.map((group) => (
              <div key={group.label}>
                {/* day divider */}
                <div className="flex items-center gap-3 pb-2 pt-3.5">
                  <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5B7FD4]">
                    {group.label}
                  </span>
                  <span className="h-px flex-1 bg-[#DCE6FA]" />
                </div>

                {group.items.map((item, i) => {
                  const Icon = getNotificationIcon(item);
                  const tint = getNotificationTint(item);
                  // The spine runs between the icon tiles: it starts at the first
                  // tile and stops at the last, so it never dangles past the group.
                  const spine = `${i === 0 ? 'top-3' : 'top-0'} ${
                    i === group.items.length - 1 ? 'h-3.5' : 'bottom-0'
                  }`;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className="group relative grid w-full grid-cols-[34px_1fr] gap-3.5 py-3 text-left"
                    >
                      <span className={`pointer-events-none absolute left-[16px] w-px bg-[#E7EEE9] ${spine}`} />

                      {/* SVG icon picked from the notification's service_type / type. */}
                      <span
                        className={`relative z-[1] grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] border bg-white ${tint.bg} ${tint.border} ${tint.text} ${
                          item.is_read ? 'opacity-50' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 rounded-xl py-[2px] pl-[2px] pr-3 transition group-hover:bg-[#F4F8F5]">
                        <div className="flex items-start justify-between gap-2.5">
                          <p
                            className={`line-clamp-2 text-[13px] leading-[1.35] ${
                              !item.is_read ? 'font-semibold text-[#0B1610]' : 'font-medium text-[#46524A]'
                            }`}
                          >
                            {stripEmoji(item.title)}
                          </p>
                          {!item.is_read && (
                            <span className="flex-none rounded-full bg-[#EAF8F1] px-2 py-px text-[9px] font-bold uppercase tracking-[0.06em] text-[#056B3E]">
                              New
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-[5px] line-clamp-2 text-[11.5px] leading-[1.55] ${
                            !item.is_read ? 'text-[#78857C]' : 'text-[#A6B1AA]'
                          }`}
                        >
                          {stripEmoji(item.body)}
                        </p>
                        {item.image && (
                          <div className="mt-2 overflow-hidden rounded-lg">
                            <Image src={item.image} alt="" width={300} height={80} className="w-full rounded-lg object-cover" />
                          </div>
                        )}
                        <div className="mt-[7px] flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[10px] text-[#A6B1AA]">
                            <Clock className="h-[11px] w-[11px]" />
                            {item.relative_time}
                          </span>
                          <span className="flex -translate-x-1 items-center gap-0.5 text-[10.5px] font-semibold text-[#056B3E] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                            View <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
