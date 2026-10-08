'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, CheckCircle, Car, Calendar, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { PageHeader } from '../_components/PortalUI';

interface Notification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  bookingNumber?: string;
  createdAt?: string;
}

interface Alert {
  type: string;
  title: string;
  message: string;
  urgent: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'notifications' | 'alerts'>('notifications');

  const load = async () => {
    setIsLoading(true);
    try {
      const [notifRes, alertRes] = await Promise.all([
        fetch('/api/driver/notifications'),
        fetch('/api/driver/alerts'),
      ]);
      const notifData = await notifRes.json();
      const alertData = await alertRes.json();

      if (notifData.notifications) setNotifications(notifData.notifications);
      if (alertData.success) setAlerts(alertData.alerts || []);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/driver/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await fetch('/api/driver/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead', notificationIds: [n.id] }),
        });
        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
      } catch {}
    }
    if (n.bookingNumber) {
      router.push(`/driver/bookings/${n.bookingNumber}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="Trip assignments and account updates"
        actions={
          <button type="button" onClick={load} disabled={isLoading} className="dv-action-ghost disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('notifications')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'notifications' ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Booking Alerts
          {unreadCount > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'alerts' ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Document Alerts
          {alerts.filter(a => a.urgent).length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{alerts.filter(a => a.urgent).length}</span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Booking Notifications */}
          {tab === 'notifications' && (
            <div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-sm text-green-600 font-medium hover:underline mb-3 block">
                  Mark all as read
                </button>
              )}
              {notifications.length === 0 ? (
                <div className="bg-white rounded-xl border p-10 text-center">
                  <Bell className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-1">Booking assignments will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`bg-white rounded-xl border p-4 transition ${!n.read ? 'border-green-300 bg-green-50/30' : ''} ${n.bookingNumber ? 'cursor-pointer hover:shadow-md hover:border-green-400' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Car className={`w-4 h-4 ${!n.read ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            {!n.read && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                          </div>
                          {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
                          {n.bookingNumber && (
                            <p className="text-xs text-green-600 font-medium mt-1">Booking #{n.bookingNumber}</p>
                          )}
                          {n.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        {n.bookingNumber && (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Document Alerts */}
          {tab === 'alerts' && (
            <div>
              {alerts.length === 0 ? (
                <div className="bg-white rounded-xl border p-10 text-center">
                  <CheckCircle className="w-14 h-14 text-green-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">All Clear!</p>
                  <p className="text-sm text-gray-500 mt-1">No expiring documents in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, i) => (
                    <div key={i} className={`rounded-xl border-l-4 p-4 ${alert.urgent ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-400'}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${alert.urgent ? 'text-red-600' : 'text-amber-600'}`} />
                        <div>
                          <p className={`font-semibold text-sm ${alert.urgent ? 'text-red-800' : 'text-amber-800'}`}>{alert.title}</p>
                          <p className={`text-sm mt-0.5 ${alert.urgent ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
