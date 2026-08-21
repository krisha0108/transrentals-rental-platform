'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Star,
  CreditCard,
  Settings,
  ChevronRight,
  RefreshCw,
  Truck,
  Handshake,
  XCircle,
  Rocket,
  MessageSquare,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Eye,
  Clock,
  Filter,
  Inbox,
  BellRing,
  ChevronDown,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  body?: string;
  bookingId?: string;
  bookingNumber?: string;
  requestId?: string;
  requestNumber?: string;
  reviewId?: string;
  serviceType?: string;
  read: boolean;
  createdAt: string;
}

// Notification type config map
const NOTIF_CONFIG: Record<string, { icon: any; gradient: string; iconColor: string; label: string }> = {
  // Booking types
  booking: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', iconColor: 'text-white', label: 'Booking' },
  booking_confirmed: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', iconColor: 'text-white', label: 'Booking' },
  booking_assigned: { icon: Calendar, gradient: 'from-blue-500 to-blue-600', iconColor: 'text-white', label: 'Booking' },
  quote_request: { icon: Inbox, gradient: 'from-violet-500 to-purple-600', iconColor: 'text-white', label: 'Quote' },
  quote_accepted: { icon: Check, gradient: 'from-green-500 to-emerald-600', iconColor: 'text-white', label: 'Quote' },
  advance_paid: { icon: CreditCard, gradient: 'from-emerald-500 to-green-600', iconColor: 'text-white', label: 'Payment' },
  review: { icon: Star, gradient: 'from-amber-400 to-orange-500', iconColor: 'text-white', label: 'Review' },
  payment: { icon: CreditCard, gradient: 'from-green-500 to-emerald-600', iconColor: 'text-white', label: 'Payment' },
  payout: { icon: CreditCard, gradient: 'from-purple-500 to-violet-600', iconColor: 'text-white', label: 'Payout' },
  system: { icon: Settings, gradient: 'from-slate-500 to-gray-600', iconColor: 'text-white', label: 'System' },
  // P2P types
  p2p_vehicle_requested: { icon: Truck, gradient: 'from-orange-500 to-amber-600', iconColor: 'text-white', label: 'P2P Request' },
  p2p_booking_accepted: { icon: Handshake, gradient: 'from-emerald-500 to-green-600', iconColor: 'text-white', label: 'P2P Accepted' },
  p2p_deal_confirmed: { icon: Handshake, gradient: 'from-emerald-500 to-teal-600', iconColor: 'text-white', label: 'P2P Deal' },
  p2p_request_accepted: { icon: Check, gradient: 'from-green-500 to-emerald-600', iconColor: 'text-white', label: 'P2P Accepted' },
  p2p_transaction_created: { icon: ArrowRightLeft, gradient: 'from-blue-500 to-indigo-600', iconColor: 'text-white', label: 'P2P Transaction' },
  p2p_request_rejected: { icon: XCircle, gradient: 'from-red-500 to-rose-600', iconColor: 'text-white', label: 'P2P Declined' },
  p2p_request_closed: { icon: XCircle, gradient: 'from-gray-500 to-slate-600', iconColor: 'text-white', label: 'P2P Closed' },
  p2p_transaction_cancelled: { icon: XCircle, gradient: 'from-red-500 to-rose-600', iconColor: 'text-white', label: 'P2P Cancelled' },
  p2p_posting_cancelled: { icon: XCircle, gradient: 'from-gray-500 to-slate-600', iconColor: 'text-white', label: 'P2P Withdrawn' },
  p2p_trip_started: { icon: Rocket, gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-white', label: 'P2P Trip' },
  p2p_trip_completed: { icon: Check, gradient: 'from-emerald-500 to-green-600', iconColor: 'text-white', label: 'P2P Complete' },
  p2p_rating_received: { icon: Star, gradient: 'from-amber-400 to-yellow-500', iconColor: 'text-white', label: 'P2P Rating' },
  p2p_new_comment: { icon: MessageSquare, gradient: 'from-indigo-500 to-violet-600', iconColor: 'text-white', label: 'P2P Comment' },
  p2p_posting_reactivated: { icon: RotateCcw, gradient: 'from-teal-500 to-cyan-600', iconColor: 'text-white', label: 'P2P Reactivated' },
  p2p_new_vehicle_posted: { icon: Truck, gradient: 'from-blue-500 to-indigo-600', iconColor: 'text-white', label: 'New Vehicle' },
  p2p_new_booking_posted: { icon: Inbox, gradient: 'from-violet-500 to-purple-600', iconColor: 'text-white', label: 'New Booking' },
};

const DEFAULT_CONFIG = { icon: Bell, gradient: 'from-gray-400 to-gray-500', iconColor: 'text-white', label: 'Notification' };

function getConfig(type: string) {
  return NOTIF_CONFIG[type] || DEFAULT_CONFIG;
}

// Redirect mapping for each notification type
const NOTIF_REDIRECT: Record<string, string> = {
  // P2P types
  p2p_new_vehicle_posted: '/vendor/p2p/vehicles',
  p2p_new_booking_posted: '/vendor/p2p/bookings',
  p2p_vehicle_requested: '/vendor/p2p/my-postings',
  p2p_booking_accepted: '/vendor/p2p/my-postings',
  p2p_deal_confirmed: '/vendor/p2p/activity',
  p2p_request_accepted: '/vendor/p2p/activity',
  p2p_request_rejected: '/vendor/p2p/activity',
  p2p_request_closed: '/vendor/p2p/vehicles',
  p2p_transaction_created: '/vendor/p2p/activity',
  p2p_trip_started: '/vendor/p2p/activity',
  p2p_trip_completed: '/vendor/p2p/activity',
  p2p_transaction_cancelled: '/vendor/p2p/activity',
  p2p_posting_cancelled: '/vendor/p2p/vehicles',
  p2p_posting_reactivated: '/vendor/p2p/my-postings',
  p2p_rating_received: '/vendor/p2p/activity',
  p2p_new_comment: '/vendor/p2p/my-postings',
  // Booking types
  booking: '/vendor/bookings',
  booking_confirmed: '/vendor/bookings',
  booking_assigned: '/vendor/bookings',
  quote_request: '/vendor/quotes',
  quote_accepted: '/vendor/quotes',
  advance_paid: '/vendor/earnings',
  review: '/vendor/reviews',
  payment: '/vendor/earnings',
  payout: '/vendor/earnings',
};

// Map serviceType to vendor dashboard route prefix
const SERVICE_ROUTE_MAP: Record<string, string> = {
  bike: 'bike-rentals',
  bus: 'bus',
  truck: 'truck',
  luxury: 'luxury',
  packers: 'packers',
  equipment: 'equipment',
  'self-drive': 'self-drive',
  'car-rental': 'car-rental',
  chauffeur: 'car-rental',
};

function getRedirectUrl(notification: Notification): string | null {
  const { type, serviceType, requestId, bookingId, bookingNumber, requestNumber } = notification;
  const routePrefix = serviceType ? SERVICE_ROUTE_MAP[serviceType] : null;
  const carBookingRef = bookingNumber || requestNumber;

  // Quote request → go to specific request detail page
  if (type === 'quote_request' && routePrefix && requestId) {
    // Car rental has no quote flow — redirect to booking details
    if (routePrefix === 'car-rental') {
      return `/vendor/car-rental/bookings/${carBookingRef || requestId}`;
    }
    if (routePrefix === 'luxury') {
      return `/vendor/luxury/send-quote/${requestId}`;
    }
    return `/vendor/${routePrefix}/requests/${requestId}/quote`;
  }

  // Quote accepted → go to specific quote/booking
  if (type === 'quote_accepted' && routePrefix && (bookingId || requestId)) {
    return `/vendor/${routePrefix}/bookings/${bookingId || requestId}`;
  }

  // Booking related → go to specific booking detail
  if ((type === 'booking' || type === 'booking_confirmed' || type === 'booking_assigned') && routePrefix) {
    if (routePrefix === 'car-rental' && carBookingRef) {
      return `/vendor/car-rental/bookings/${carBookingRef}`;
    }
    if (bookingId) {
      return `/vendor/${routePrefix}/bookings/${bookingId}`;
    }
  }

  // Payment/advance related → go to specific booking detail
  if ((type === 'advance_paid' || type === 'payment') && routePrefix) {
    if (routePrefix === 'car-rental' && carBookingRef) {
      return `/vendor/car-rental/bookings/${carBookingRef}`;
    }
    if (bookingId) {
      return `/vendor/${routePrefix}/bookings/${bookingId}`;
    }
  }

  // Trip started/completed → go to specific booking detail
  if ((type === 'trip_started' || type === 'trip_complete' || type === 'trip_completed') && routePrefix && bookingId) {
    if (routePrefix === 'car-rental' && carBookingRef) {
      return `/vendor/car-rental/bookings/${carBookingRef}`;
    }
    return `/vendor/${routePrefix}/bookings/${bookingId}`;
  }

  // Fallback to static redirect map
  return NOTIF_REDIRECT[type] || null;
}

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 30) return 'Just now';
  if (minutes < 1) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDay.getTime() === today.getTime()) return 'Today';
  if (notifDay.getTime() === yesterday.getTime()) return 'Yesterday';
  if (now.getTime() - notifDay.getTime() < 7 * 86400000) return 'This Week';
  return 'Earlier';
}

const FILTERS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'unread', label: 'Unread', icon: Bell },
  { id: 'p2p', label: 'P2P', icon: ArrowRightLeft },
  { id: 'booking', label: 'Bookings', icon: Calendar },
  { id: 'quote_request', label: 'Quotes', icon: Inbox },
  { id: 'payment', label: 'Payments', icon: CreditCard },
];

const DATE_FILTERS = [
  { id: 'all',       label: 'All Time' },
  { id: 'today',     label: 'Today'     },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week',      label: 'This Week' },
  { id: 'month',     label: 'This Month'},
];

function isInDateRange(dateStr: string, dateFilter: string): boolean {
  const date = new Date(dateStr);
  const now  = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const today     = startOfDay(now);
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo   = new Date(today.getTime() - 6 * 86400000);
  const monthAgo  = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (dateFilter) {
    case 'today':     return date >= today;
    case 'yesterday': return date >= yesterday && date < today;
    case 'week':      return date >= weekAgo;
    case 'month':     return date >= monthAgo;
    default:          return true;
  }
}

export default function VendorNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/vendor/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Close date dropdown on outside click
  useEffect(() => {
    if (!showDateDropdown) return;
    const handler = () => setShowDateDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showDateDropdown]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchNotifications(), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', notificationIds: ids }),
      });
      const data = await res.json();
      if (data.success) { setNotifications(data.notifications); setSelectedIds([]); }
    } catch (error) { console.error('Failed to mark as read:', error); }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (error) { console.error('Failed to mark all as read:', error); }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationIds: ids }),
      });
      const data = await res.json();
      if (data.success) { setNotifications(data.notifications); setSelectedIds([]); }
    } catch (error) { console.error('Failed to delete notifications:', error); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredNotifications = notifications.filter(n => {
    // Type filter
    if (filter === 'unread' && n.read) return false;
    if (filter === 'p2p' && !(n.type?.startsWith('p2p_') || n.serviceType === 'p2p')) return false;
    if (filter === 'booking' && !(n.type?.includes('booking') || n.type === 'booking_confirmed' || n.type === 'booking_assigned')) return false;
    if (filter === 'quote_request' && !(n.type === 'quote_request' || n.type === 'quote_accepted')) return false;
    if (filter === 'payment' && !(n.type === 'payment' || n.type === 'payout' || n.type === 'advance_paid')) return false;
    // Date filter
    if (!isInDateRange(n.createdAt, dateFilter)) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const p2pCount = notifications.filter(n => n.type?.startsWith('p2p_') || n.serviceType === 'p2p').length;

  // Group by date
  const grouped: Record<string, Notification[]> = {};
  filteredNotifications.forEach(n => {
    const group = getDateGroup(n.createdAt);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(n);
  });
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  // Track global index for staggered animations (cap at 20)
  let globalIdx = 0;

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
        <style jsx>{`
          @keyframes shimmer-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes scale-in {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <div className="w-full">
          {/* Skeleton header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 sm:p-6 mb-6" style={{ animation: 'scale-in 0.4s ease-out' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-3 w-48 rounded-lg bg-white/15 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {[1,2,3].map(i => (
                <div key={i} className="flex-1 rounded-xl bg-white/10 p-3">
                  <div className="h-3 w-12 rounded bg-white/20 animate-pulse mb-2" />
                  <div className="h-6 w-8 rounded bg-white/25 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          {/* Skeleton filter pills */}
          <div className="flex gap-2 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-10 w-24 rounded-full bg-white animate-pulse relative overflow-hidden">
                <div className="absolute inset-0" style={{ animation: 'shimmer-sweep 1.5s infinite', background: 'linear-gradient(90deg, transparent, rgba(5,150,105,0.08), transparent)' }} />
              </div>
            ))}
          </div>
          {/* Skeleton notification rows */}
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-start gap-4 relative overflow-hidden" style={{ animation: `scale-in 0.4s ease-out ${i * 0.08}s both` }}>
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-full rounded bg-gray-50 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-gray-50 animate-pulse" />
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ animation: 'shimmer-sweep 2s infinite', background: 'linear-gradient(90deg, transparent, rgba(5,150,105,0.04), transparent)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes bubble-rise-1 {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(0) scale(0.8); opacity: 0.4; }
          100% { transform: translateY(-50px) scale(0.3); opacity: 0; }
        }
        @keyframes bubble-drift {
          0% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
          100% { transform: translateY(-60px) translateX(-5px); opacity: 0; }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.3); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.6); }
        }
        @keyframes slide-in-left {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .notif-icon-hover:hover .notif-icon-spin {
          transform: rotate(20deg);
          transition: transform 0.3s ease;
        }
        .notif-icon-spin {
          transition: transform 0.3s ease;
        }
      `}</style>

      <div className="w-full">
        {/* Hero Header - Animated Emerald */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-6"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857, #10b981, #059669)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 8s ease infinite',
          }}
        >
          {/* Shimmer sweep overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0" style={{ animation: 'shimmer-sweep 4s infinite', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
          </div>

          {/* Floating filled bubbles - right side */}
          <div className="absolute right-8 top-3 w-8 h-8 rounded-full bg-white/10" style={{ animation: 'float-slow 4s ease-in-out infinite' }} />
          <div className="absolute right-20 top-6 w-5 h-5 rounded-full bg-white/8" style={{ animation: 'float-rev 3.5s ease-in-out infinite' }} />
          <div className="absolute right-14 bottom-4 w-6 h-6 rounded-full bg-white/10" style={{ animation: 'float-slow 5s ease-in-out infinite 0.5s' }} />

          {/* Sparkle dots */}
          <div className="absolute right-32 top-4 w-1.5 h-1.5 rounded-full bg-white/60" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
          <div className="absolute right-10 top-12 w-1 h-1 rounded-full bg-white/50" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }} />
          <div className="absolute right-24 bottom-6 w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-16 bottom-0 w-3 h-3 rounded-full bg-white/15" style={{ animation: 'bubble-rise-1 3s ease-in-out infinite' }} />
          <div className="absolute right-28 bottom-0 w-2 h-2 rounded-full bg-white/10" style={{ animation: 'bubble-rise-2 4s ease-in-out infinite 1s' }} />
          <div className="absolute right-6 bottom-2 w-2.5 h-2.5 rounded-full bg-white/12" style={{ animation: 'bubble-drift 3.5s ease-in-out infinite 0.5s' }} />

          {/* Header row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Glassmorphic icon badge */}
              <div
                className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20"
                style={{ animation: 'bounce-in 0.6s ease-out' }}
              >
                {unreadCount > 0
                  ? <BellRing className="w-5 h-5 text-white" />
                  : <Bell className="w-5 h-5 text-white" />
                }
              </div>
              <div style={{ animation: 'slide-in-left 0.5s ease-out' }}>
                <h1 className="text-lg sm:text-xl font-bold text-white">Notifications</h1>
                <p className="text-emerald-100 text-xs sm:text-sm">
                  {unreadCount > 0
                    ? <>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</>
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl text-xs sm:text-sm font-medium transition-all border border-white/20"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => fetchNotifications(true)}
                className={`p-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl transition-all border border-white/20 ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Stats Row */}
          <div className="relative z-10 flex gap-3 mt-4">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <p className="text-emerald-200 text-[10px] font-medium mb-0.5">Total</p>
              <p className="text-xl font-bold text-white">{notifications.length}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <p className="text-emerald-200 text-[10px] font-medium mb-0.5">Unread</p>
              <p className="text-xl font-bold text-white">{unreadCount}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
              <p className="text-emerald-200 text-[10px] font-medium mb-0.5">P2P</p>
              <p className="text-xl font-bold text-white">{p2pCount}</p>
            </div>
          </div>
        </div>

        {/* Filter Pills + Date Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
          {/* Type filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = filter === f.id;
              const count = f.id === 'unread' ? unreadCount : f.id === 'p2p' ? p2pCount : 0;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {f.label}
                  {count > 0 && (
                    <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${
                      isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Date filter dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowDateDropdown(v => !v)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                dateFilter !== 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {DATE_FILTERS.find(d => d.id === dateFilter)?.label || 'All Time'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[160px] overflow-hidden">
                {DATE_FILTERS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setDateFilter(d.id); setShowDateDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-emerald-50 ${
                      dateFilter === d.id ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4" style={{ animation: 'fade-up 0.3s ease-out' }}>
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
              {selectedIds.length} selected
            </span>
            <button onClick={() => handleMarkAsRead(selectedIds)} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-100 rounded-lg transition">
              <Eye className="w-4 h-4" /> Mark read
            </button>
            <button onClick={() => handleDelete(selectedIds)} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-500 font-medium ml-auto hover:text-gray-700 transition">
              Cancel
            </button>
          </div>
        )}

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center" style={{ animation: 'scale-in 0.5s ease-out' }}>
            <div
              className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ animation: 'bounce-in 0.6s ease-out 0.2s both' }}
            >
              <BellOff className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {filter === 'all'
                ? "You're all caught up! New notifications will appear here."
                : `No ${FILTERS.find(f => f.id === filter)?.label.toLowerCase() || filter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupOrder.filter(g => grouped[g]).map(group => (
              <div key={group}>
                {/* Date Group Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group}</h3>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-medium">{grouped[group].length}</span>
                </div>

                {/* Notifications in this group */}
                <div className="space-y-2">
                  {grouped[group].map((notification) => {
                    const config = getConfig(notification.type);
                    const Icon = config.icon;
                    const isSelected = selectedIds.includes(notification.id);
                    const currentIdx = globalIdx++;
                    const shouldAnimate = currentIdx < 20;

                    return (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read) handleMarkAsRead([notification.id]);
                          const redirectUrl = getRedirectUrl(notification);
                          if (redirectUrl) router.push(redirectUrl);
                        }}
                        className={`notif-icon-hover group relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 ${
                          !notification.read
                            ? 'bg-emerald-50/60 border border-emerald-200/60 shadow-sm'
                            : 'bg-white border border-gray-100 hover:border-emerald-200'
                        } ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                        style={shouldAnimate ? { animation: `fade-up 0.4s ease-out ${currentIdx * 0.05}s both` } : undefined}
                      >
                        {/* Unread accent bar */}
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-l-xl" />
                        )}

                        <div className="flex items-start gap-3 sm:gap-4 p-4 pl-5">
                          {/* Checkbox */}
                          <label className="flex items-center pt-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(notification.id)}
                              className="w-4 h-4 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer"
                            />
                          </label>

                          {/* Icon - color coded, rotates on hover */}
                          <div className={`notif-icon-spin w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm font-semibold leading-snug ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium flex-shrink-0">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                            </div>

                            <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 mb-1.5 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.body || notification.message}
                            </p>

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r ${config.gradient} text-white`}>
                                {config.label}
                              </span>
                              {notification.bookingNumber && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {notification.bookingNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            {getRedirectUrl(notification) && (
                              <Link
                                href={getRedirectUrl(notification)!}
                                className="p-2 hover:bg-emerald-50 rounded-xl transition text-emerald-600"
                                title="View details"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </Link>
                            )}
                            <button
                              onClick={() => handleDelete([notification.id])}
                              className="p-2 hover:bg-red-50 rounded-xl transition text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
