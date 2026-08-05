'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Menu, X, Home, FileText, MapPin, Briefcase, LogOut, Users, Store, MessageSquare, Headphones, TrendingUp, Building2, IndianRupee, Navigation, Plane, Mail, UserCog, Bell, MapPinPlus, Layers, MapPinOff } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';
import { useManagerActivityHeartbeat } from '@/hooks/useManagerActivityHeartbeat';

const SIDEBAR_LINKS = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: Home },
  { href: '/manager/notifications', label: 'Notifications', icon: Bell },
  { href: '/manager/vendor-performance', label: 'Performance', icon: TrendingUp },
  { href: '/manager/inquiries', label: 'My Inquiries', icon: FileText },
  { href: '/manager/bookings', label: 'My Bookings', icon: Briefcase },
  { href: '/manager/vendors', label: 'Vendors', icon: Store },
  { href: '/manager/vendors/by-location', label: 'Location Coverage', icon: MapPin },
  { href: '/manager/vendors/coverage-gaps', label: 'Coverage Gaps', icon: MapPinOff },
  { href: '/manager/drivers', label: 'Drivers', icon: Users },
  { href: '/manager/travel-agents', label: 'Travel Agents', icon: Plane },
  { href: '/manager/b2b', label: 'B2B Bookings', icon: Briefcase },
  { href: '/manager/b2b-companies', label: 'B2B Companies', icon: Building2 },
  { href: '/manager/tracking', label: 'Live Tracking', icon: Navigation },
  { href: '/manager/contact-inquiries', label: 'Contact Inquiries', icon: Mail },
  { href: '/manager/contact-requests', label: 'Contact Requests', icon: UserCog },
  { href: '/manager/chats', label: 'Chats', icon: MessageSquare },
  { href: '/manager/locations', label: 'My Locations', icon: MapPin },
  { href: '/manager/city-pricing', label: 'City Pricing', icon: IndianRupee },
  { href: '/manager/helpdesk', label: 'Helpdesk', icon: Headphones },
];

interface ManagerNotification {
  id: string;
  type: 'NEW_LOCATION_REQUEST' | 'NEW_SERVICE_REQUEST' | 'NEW_CONTACT_INQUIRY' | 'NEW_TRAVEL_AGENT_REGISTRATION';
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ManagerSidebar({
  isOpen,
  onClose,
  vendorBadgeCount,
  contactInquiryBadgeCount,
  notificationsBadgeCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  vendorBadgeCount: number;
  contactInquiryBadgeCount: number;
  notificationsBadgeCount: number;
}) {
  const { data: session } = useSession();
  const badgeCountByHref: Record<string, number> = {
    '/manager/vendors': vendorBadgeCount,
    '/manager/notifications': notificationsBadgeCount,
    '/manager/contact-inquiries': contactInquiryBadgeCount,
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-green-600 to-teal-700 text-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate">Manager Panel</h2>
                  <p className="text-xs text-green-200 truncate">TransRentals</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              const badgeCount = badgeCountByHref[link.href] || 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{link.label}</span>
                  {badgeCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-orange-400 text-teal-900 text-[11px] font-bold">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-green-500">
            <div className="mb-3 px-4">
              <p className="font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-green-200 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/manager/login' })}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-white/10 transition text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const NOTIFICATION_ICON: Record<string, any> = {
  NEW_LOCATION_REQUEST: MapPinPlus,
  NEW_SERVICE_REQUEST: Layers,
  NEW_CONTACT_INQUIRY: Mail,
  NEW_TRAVEL_AGENT_REGISTRATION: Plane,
};

function ManagerNotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: ManagerNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (n: ManagerNotification) => {
    if (!n.isRead) onMarkRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-30 top-full right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-medium text-green-600 hover:text-green-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-400 text-center">No notifications yet</p>
            ) : (
              notifications.map((n) => {
                const Icon = NOTIFICATION_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full flex items-start gap-2.5 px-3 py-3 text-left border-b border-gray-50 hover:bg-gray-50 transition ${!n.isRead ? 'bg-green-50/50' : ''}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${!n.isRead ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<ManagerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [vendorUnreadCount, setVendorUnreadCount] = useState(0);
  const [contactInquiryCount, setContactInquiryCount] = useState(0);

  useManagerActivityHeartbeat(status === 'authenticated' && session?.user?.role === 'MANAGER');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/notifications?limit=15');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
      const byType = data.unreadByType || {};
      setVendorUnreadCount((byType.NEW_LOCATION_REQUEST || 0) + (byType.NEW_SERVICE_REQUEST || 0));
    } catch {
      // silent — notifications are non-critical, don't disrupt the page
    }
  }, []);

  const fetchContactInquiryCount = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/contact-inquiries/count');
      if (!res.ok) return;
      const data = await res.json();
      setContactInquiryCount(data.count || 0);
    } catch {
      // silent — badge count is non-critical, don't disrupt the page
    }
  }, []);

  // Must be before any early returns — hooks cannot be called conditionally
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/manager/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchNotifications();
    fetchContactInquiryCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchContactInquiryCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [status, fetchNotifications, fetchContactInquiryCount]);

  // Other pages (dashboard widget, the standalone notifications page) mark
  // notifications read via their own PATCH calls, not through this layout's
  // handlers — they broadcast this event afterward so the sidebar/bell badge
  // (owned here) stays in sync instantly instead of waiting for the next poll.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const handler = () => fetchNotifications();
    window.addEventListener('manager-notifications-updated', handler);
    return () => window.removeEventListener('manager-notifications-updated', handler);
  }, [status, fetchNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch('/api/manager/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', ids: [id] }),
      });
    } catch {
      // best-effort; next poll will resync
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/manager/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
    } catch {
      // best-effort; next poll will resync
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Check if user has MANAGER role
  if (session?.user?.role !== 'MANAGER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <Link href="/" className="text-green-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        vendorBadgeCount={vendorUnreadCount}
        contactInquiryBadgeCount={contactInquiryCount}
        notificationsBadgeCount={unreadCount}
      />

      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1" />
          <ManagerNotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ManagerLayoutContent>{children}</ManagerLayoutContent>
      </ToastProvider>
    </SessionProvider>
  );
}
