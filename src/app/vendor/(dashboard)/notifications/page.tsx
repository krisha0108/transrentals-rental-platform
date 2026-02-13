'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Star,
  CreditCard,
  Settings,
  AlertTriangle,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking' | 'review' | 'payment' | 'payout' | 'system';
  title: string;
  message: string;
  bookingId?: string;
  reviewId?: string;
  read: boolean;
  createdAt: string;
}

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/vendor/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', notificationIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-9 h-9 text-blue-600" />;
      case 'review':
        return <Star className="w-9 h-9 text-yellow-500" />;
      case 'payment':
        return <CreditCard className="w-9 h-9 text-green-600" />;
      case 'payout':
        return <CreditCard className="w-9 h-9 text-purple-600" />;
      case 'system':
        return <Settings className="w-9 h-9 text-gray-600" />;
      default:
        return <Bell className="w-9 h-9 text-gray-600" />;
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100';
      case 'review':
        return 'bg-yellow-100';
      case 'payment':
        return 'bg-green-100';
      case 'payout':
        return 'bg-purple-100';
      case 'system':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-lg text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up! 🎉'}
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition shadow-sm"
          title="Refresh"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-8 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'booking', label: 'Bookings' },
            { id: 'review', label: 'Reviews' },
            { id: 'payment', label: 'Payments' },
            { id: 'system', label: 'System' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-white/30 rounded-lg text-sm font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-base text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <CheckCheck className="w-5 h-5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm text-blue-700">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => handleMarkAsRead(selectedIds)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Mark as read
          </button>
          <button
            onClick={() => handleDelete(selectedIds)}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium ml-auto"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-14 h-14 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-lg text-gray-500">
              {filter === 'all'
                ? "You're all caught up! 🎉"
                : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select all</span>
              </label>
            </div>

            {/* Notification Items */}
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-7 hover:bg-gray-50 transition-all duration-200 ${
                    !notification.read ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-[6px] border-blue-600 shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <label className="flex items-center cursor-pointer pt-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${getTypeBgColor(
                        notification.type
                      )} ${!notification.read ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4
                          className={`text-2xl font-bold leading-tight ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-3 inline-block w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-lg"></span>
                          )}
                        </h4>
                        <span className="text-base text-gray-500 whitespace-nowrap font-semibold bg-gray-100 px-3 py-1 rounded-full">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed line-clamp-3 mb-4">
                        {notification.message}
                      </p>
                      {(notification.bookingId || notification.reviewId) && (
                        <div className="mt-4">
                          <a
                            href={
                              notification.bookingId
                                ? `/vendor/bookings?id=${notification.bookingId}`
                                : `/vendor/reviews`
                            }
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            View details
                            <ChevronRight className="w-5 h-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notification Settings Link */}
      <div className="mt-6 text-center">
        <a
          href="/vendor/settings"
          className="text-sm text-gray-600 hover:text-gray-700 inline-flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Notification Settings
        </a>
      </div>
    </div>
  );
}
