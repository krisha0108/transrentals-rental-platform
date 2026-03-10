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
  const { type, serviceType, requestId, bookingId, bookingNumber } = notification;
  const routePrefix = serviceType ? SERVICE_ROUTE_MAP[serviceType] : null;

  // Quote request → go to specific request detail page
  if (type === 'quote_request' && routePrefix && requestId) {
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
    if (routePrefix === 'car-rental' && bookingNumber) {
      return `/vendor/car-rental/bookings/${bookingNumber}`;
    }
    if (bookingId) {
      return `/vendor/${routePrefix}/bookings/${bookingId}`;
    }
  }

  // Payment/advance related → go to specific booking detail
  if ((type === 'advance_paid' || type === 'payment') && routePrefix) {
    if (routePrefix === 'car-rental' && bookingNumber) {
      return `/vendor/car-rental/bookings/${bookingNumber}`;
    }
    if (bookingId) {
      return `/vendor/${routePrefix}/bookings/${bookingId}`;
    }
  }

  // Trip started/completed → go to specific booking detail
  if ((type === 'trip_started' || type === 'trip_complete' || type === 'trip_completed') && routePrefix && bookingId) {
    if (routePrefix === 'car-rental' && bookingNumber) {
      return `/vendor/car-rental/bookings/${bookingNumber}`;
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

export default function VendorNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
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

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchNotifications(), 15000);
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
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'p2p') return n.type?.startsWith('p2p_') || n.serviceType === 'p2p';
    if (filter === 'booking') return n.type?.includes('booking') || n.type === 'booking_confirmed' || n.type === 'booking_assigned';
    if (filter === 'quote_request') return n.type === 'quote_request' || n.type === 'quote_accepted';
    if (filter === 'payment') return n.type === 'payment' || n.type === 'payout' || n.type === 'advance_paid';
    return n.type === filter;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-blue-200 text-sm">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={() => fetchNotifications(true)}
              className={`p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 flex gap-4 mt-6">
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-blue-300 text-xs font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{notifications.length}</p>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-blue-300 text-xs font-medium mb-1">Unread</p>
            <p className="text-2xl font-bold text-white">{unreadCount}</p>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-blue-300 text-xs font-medium mb-1">P2P</p>
            <p className="text-2xl font-bold text-white">{p2pCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {FILTERS.map(f => {
          const Icon = f.icon;
          const isActive = filter === f.id;
          const count = f.id === 'unread' ? unreadCount : f.id === 'p2p' ? p2pCount : 0;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
              {count > 0 && (
                <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${
                  isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-in slide-in-from-top">
          <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
            {selectedIds.length} selected
          </span>
          <button onClick={() => handleMarkAsRead(selectedIds)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-100 rounded-lg transition">
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
            <BellOff className="w-12 h-12 text-gray-400 -rotate-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {filter === 'all'
              ? "You're all caught up! New notifications will appear here."
              : `No ${FILTERS.find(f => f.id === filter)?.label.toLowerCase() || filter} notifications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.filter(g => grouped[g]).map(group => (
            <div key={group}>
              {/* Date Group Header */}
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{group}</h3>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{grouped[group].length}</span>
              </div>

              {/* Notifications in this group */}
              <div className="space-y-2">
                {grouped[group].map((notification, idx) => {
                  const config = getConfig(notification.type);
                  const Icon = config.icon;
                  const isSelected = selectedIds.includes(notification.id);

                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) handleMarkAsRead([notification.id]);
                        const redirectUrl = getRedirectUrl(notification);
                        if (redirectUrl) router.push(redirectUrl);
                      }}
                      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                        !notification.read
                          ? 'border-blue-200 shadow-md shadow-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10'
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    >
                      {/* Unread indicator line */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-2xl" />
                      )}

                      <div className="flex items-start gap-4 p-5 pl-6">
                        {/* Checkbox */}
                        <label className="flex items-center pt-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(notification.id)}
                            className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer"
                          />
                        </label>

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10`}>
                          <Icon className={`w-6 h-6 ${config.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-semibold leading-snug ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap font-medium flex-shrink-0">
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>

                          <p className={`text-sm leading-relaxed line-clamp-2 mb-2 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.body || notification.message}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${config.gradient} text-white`}>
                              {config.label}
                            </span>
                            {notification.bookingNumber && (
                              <span className="text-xs text-gray-400 font-mono">
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
                              className="p-2 hover:bg-blue-50 rounded-xl transition text-blue-600"
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
  );
}
