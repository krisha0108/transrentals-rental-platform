'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Menu, X, Home, FileText, MapPin, Briefcase, LogOut, Users, Store, MessageSquare, Headphones, TrendingUp, Building2, IndianRupee, Navigation, Plane, Mail, UserCog, Bell, MapPinPlus, Layers, MapPinOff, Search, Route, Package, ArrowRightCircle, Ruler, Car, ChevronDown, FileSignature, PhoneCall, Download, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';
import { useManagerActivityHeartbeat } from '@/hooks/useManagerActivityHeartbeat';
import { ManagerPageHeaderProvider, useManagerPageHeaderContext } from '@/hooks/useManagerPageHeader';

const SIDEBAR_LINKS = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: Home },
  { href: '/manager/notifications', label: 'Notifications', icon: Bell },
  { href: '/manager/call-reports', label: 'Call Reports', icon: PhoneCall },
  { href: '/manager/refunds', label: 'Refunds', icon: IndianRupee },
  { href: '/manager/vendor-performance', label: 'Performance', icon: TrendingUp },
  { href: '/manager/inquiries', label: 'My Inquiries', icon: FileText },
  { href: '/manager/bookings', label: 'My Bookings', icon: Briefcase },
  { href: '/manager/vendors', label: 'Vendors', icon: Store },
  { href: '/manager/vendors/by-location', label: 'Location Coverage', icon: MapPin },
  { href: '/manager/vendors/coverage-gaps', label: 'Coverage Gaps', icon: MapPinOff },
  { href: '/manager/vendor-agreements', label: 'Vendor Agreements', icon: FileSignature },
  { href: '/manager/drivers', label: 'Drivers', icon: Users },
  { href: '/manager/travel-agents', label: 'Travel Agents', icon: Plane },
  { href: '/manager/b2b', label: 'B2B Bookings', icon: Briefcase },
  { href: '/manager/b2b-companies', label: 'B2B Companies', icon: Building2 },
  { href: '/manager/tracking', label: 'Live Tracking', icon: Navigation },
  { href: '/manager/contact-requests', label: 'Contact Requests', icon: UserCog },
  { href: '/manager/chats', label: 'Chats', icon: MessageSquare },
  { href: '/manager/locations', label: 'My Locations', icon: MapPin },
  { href: '/manager/helpdesk', label: 'Helpdesk', icon: Headphones },
];

// Shown only to managers the admin has explicitly granted
// canManageCarRentalContent (src/app/admin/(protected)/settings/managers/page.tsx)
// — appended conditionally in ManagerSidebar rather than kept in the static
// list above, since every other link there is visible to all managers.
const CAR_RENTAL_CONTENT_LINKS = [
  { href: '/manager/car-rental/routes', label: 'Route Packages', icon: Route },
  { href: '/manager/car-rental/packages', label: 'Local Packages', icon: Package },
  { href: '/manager/car-rental/city-pricing', label: 'City Pricing', icon: IndianRupee },
  { href: '/manager/car-rental/oneway', label: 'One-Way Routes', icon: ArrowRightCircle },
  { href: '/manager/car-rental/distances', label: 'Distance Matrix', icon: Ruler },
];

// Curated PWA v1 scope — just the "something needs a response right now"
// screens, not the full ~18-item desktop sidebar. Shown as a bottom tab bar
// on mobile viewports only (desktop keeps using ManagerSidebar as-is).
const MOBILE_PRIMARY_TABS = [
  { href: '/manager/notifications', label: 'Alerts', icon: Bell },
  { href: '/manager/helpdesk', label: 'Helpdesk', icon: Headphones },
  { href: '/manager/inquiries', label: 'Inquiries', icon: FileText },
  { href: '/manager/chats', label: 'Customer Chat', icon: MessageSquare },
];

// Lower-frequency approval queues — still part of the "24/7 away from desk"
// scope, but don't need their own bottom-tab slot. One tap away via "More".
const MOBILE_MORE_ITEMS = [
  { href: '/manager/refunds', label: 'Refunds', icon: IndianRupee },
  { href: '/manager/vendor-agreements', label: 'Vendor Agreements', icon: FileSignature },
  { href: '/manager/contact-requests', label: 'Contact Requests', icon: UserCog },
];

interface ManagerNotification {
  id: string;
  type:
    | 'NEW_LOCATION_REQUEST'
    | 'NEW_SERVICE_REQUEST'
    | 'NEW_CONTACT_INQUIRY'
    | 'NEW_TRAVEL_AGENT_REGISTRATION'
    | 'NEW_VENDOR_AGREEMENT_SIGNED';
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
  notificationsBadgeCount,
  agreementBadgeCount,
  refundBadgeCount,
  canInstall,
  isInstalled,
  onInstallClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  vendorBadgeCount: number;
  notificationsBadgeCount: number;
  agreementBadgeCount: number;
  refundBadgeCount: number;
  canInstall: boolean;
  isInstalled: boolean;
  onInstallClick: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [navSearch, setNavSearch] = useState('');
  // Starts open if the manager lands directly on a car-rental content page
  // (e.g. a bookmark or refresh); after that, only the toggle button and
  // search below control it — it must not re-force-open just because the
  // manager is still on one of those pages, or the toggle can never close it.
  const [carRentalOpen, setCarRentalOpen] = useState(
    () => CAR_RENTAL_CONTENT_LINKS.some((l) => pathname === l.href || pathname?.startsWith(`${l.href}/`))
  );
  const badgeCountByHref: Record<string, number> = {
    '/manager/vendors': vendorBadgeCount,
    '/manager/notifications': notificationsBadgeCount,
    '/manager/vendor-agreements': agreementBadgeCount,
    '/manager/refunds': refundBadgeCount,
  };
  const canManageCarRentalContent = !!(session?.user as any)?.canManageCarRentalContent;
  const sidebarLinks = canManageCarRentalContent
    ? [...SIDEBAR_LINKS, ...CAR_RENTAL_CONTENT_LINKS]
    : SIDEBAR_LINKS;
  // Longest-prefix match so a nested route (e.g. /manager/vendors/by-location)
  // highlights its own link instead of also lighting up the shorter parent link.
  const activeHref = sidebarLinks
    .map((l) => l.href)
    .filter((href) => pathname === href || pathname?.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  const query = navSearch.trim().toLowerCase();
  const visibleLinks = query
    ? SIDEBAR_LINKS.filter((l) => l.label.toLowerCase().includes(query))
    : SIDEBAR_LINKS;

  // The 5 car-rental content links collapse into a single "Car Rental
  // Content" group instead of 5 flat sidebar entries. A live search still
  // force-expands it so matching links stay visible while typing — that's
  // temporary and goes away once the search is cleared.
  const visibleCarRentalLinks = query
    ? CAR_RENTAL_CONTENT_LINKS.filter((l) => l.label.toLowerCase().includes(query))
    : CAR_RENTAL_CONTENT_LINKS;
  const isOnCarRentalPage = CAR_RENTAL_CONTENT_LINKS.some(
    (l) => pathname === l.href || pathname?.startsWith(`${l.href}/`)
  );
  const showCarRentalGroup = canManageCarRentalContent && visibleCarRentalLinks.length > 0;
  const carRentalExpanded = carRentalOpen || (!!query && visibleCarRentalLinks.length > 0);

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

          {/* Nav search — filters the list below so managers don't have to
              scroll through all ~18 links to find one. */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleLinks.length === 0 && !showCarRentalGroup ? (
              <p className="px-4 py-6 text-center text-sm text-white/50">No menu items match "{navSearch}"</p>
            ) : (
              <>
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const badgeCount = badgeCountByHref[link.href] || 0;
                  const isActive = link.href === activeHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-white/20 font-semibold shadow-sm'
                          : 'hover:bg-white/10'
                      }`}
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

                {showCarRentalGroup && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setCarRentalOpen((o) => !o)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isOnCarRentalPage ? 'bg-white/20 font-semibold shadow-sm' : 'hover:bg-white/10'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                      <span className="flex-1 text-left">Car Rental Content</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${carRentalExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {carRentalExpanded && (
                      <div className="mt-1 ml-4 pl-3 border-l border-white/20 space-y-1">
                        {visibleCarRentalLinks.map((link) => {
                          const Icon = link.icon;
                          const isActive = link.href === activeHref;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={onClose}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                                isActive
                                  ? 'bg-white/20 font-semibold shadow-sm'
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="flex-1">{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Download PWA — last item in the sidebar, above the user/logout
              footer. Hidden once already installed; if the browser hasn't
              fired beforeinstallprompt yet, still shown but disabled rather
              than disappearing, so it's not confusing why it's missing. */}
          {!isInstalled && (
            <div className="px-4 pb-1">
              <button
                onClick={onInstallClick}
                disabled={!canInstall}
                title={canInstall ? 'Install Manager App' : 'Install prompt not ready yet — reload and try again'}
                className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm text-green-100 hover:bg-white/10 hover:text-white transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="flex-1">Download App</span>
              </button>
            </div>
          )}

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
  NEW_VENDOR_AGREEMENT_SIGNED: FileSignature,
  NEW_PROPERTY_ENQUIRY: Building2,
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
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<ManagerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [vendorUnreadCount, setVendorUnreadCount] = useState(0);
  const [agreementUnreadCount, setAgreementUnreadCount] = useState(0);
  const [refundUnreadCount, setRefundUnreadCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  useManagerActivityHeartbeat(status === 'authenticated' && session?.user?.role === 'MANAGER');

  // ── PWA: install prompt capture + standalone detection ──────────────────
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setIsInstalled(true);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
      // Pop the install modal once per browser, not on every single page
      // load — a manager who already said "not now" shouldn't get nagged
      // again until the browser forgets (or the app gets installed).
      let dismissed = false;
      try {
        dismissed = localStorage.getItem('manager-pwa-install-dismissed') === '1';
      } catch {}
      if (!dismissed) setShowInstallModal(true);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setShowInstallModal(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setShowInstallModal(false);
    }
  };

  const dismissInstallModal = () => {
    setShowInstallModal(false);
    try {
      localStorage.setItem('manager-pwa-install-dismissed', '1');
    } catch {}
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/notifications?limit=15');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
      const byType = data.unreadByType || {};
      setVendorUnreadCount((byType.NEW_LOCATION_REQUEST || 0) + (byType.NEW_SERVICE_REQUEST || 0));
      setAgreementUnreadCount(byType.NEW_VENDOR_AGREEMENT_SIGNED || 0);
    } catch {
      // silent — notifications are non-critical, don't disrupt the page
    }
  }, []);

  // Pulled from the refunds queue itself rather than the notification's
  // read/unread state — a refund still needs a decision for as long as it
  // sits PENDING, whether or not the manager has opened the alert about it.
  const fetchRefundCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/refunds?status=pending&limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setRefundUnreadCount(data.counts?.pending || 0);
    } catch {
      // silent — same as notifications, non-critical
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
    fetchRefundCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchRefundCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [status, fetchNotifications, fetchRefundCount]);

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
      {/* PWA Install Banner — mobile only, dismissible */}
      {showInstallBanner && !isInstalled && (
        <div className="lg:hidden bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-green-900 min-w-0">
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Install Manager App on your phone</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-green-700 hover:text-green-900 p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ManagerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        vendorBadgeCount={vendorUnreadCount}
        agreementBadgeCount={agreementUnreadCount}
        notificationsBadgeCount={unreadCount}
        refundBadgeCount={refundUnreadCount}
        canInstall={!!installPrompt && !isInstalled}
        isInstalled={isInstalled}
        onInstallClick={handleInstallClick}
      />

      <div className="lg:pl-64">
        <ManagerTopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          canInstall={!!installPrompt && !isInstalled}
          onInstallClick={handleInstallClick}
        />

        <main className="p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar — PWA v1's curated "needs a response" set ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_-8px_rgba(9,40,24,0.25)] z-40">
        <div className="flex justify-around">
          {MOBILE_PRIMARY_TABS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const badge =
              item.href === '/manager/notifications' ? unreadCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center py-2.5 px-3 transition ${
                  isActive ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                <span className={`flex items-center justify-center w-10 h-7 rounded-full transition ${isActive ? 'bg-green-100' : ''}`}>
                  <item.icon className="w-[21px] h-[21px]" />
                </span>
                {badge > 0 && (
                  <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                <span className="text-[10.5px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            className={`relative flex flex-col items-center py-2.5 px-3 transition ${
              showMoreSheet ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            <span className="flex items-center justify-center w-10 h-7 rounded-full">
              <MoreHorizontal className="w-[21px] h-[21px]" />
            </span>
            {(refundUnreadCount + agreementUnreadCount) > 0 && (
              <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {(refundUnreadCount + agreementUnreadCount) > 9 ? '9+' : refundUnreadCount + agreementUnreadCount}
              </span>
            )}
            <span className="text-[10.5px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* "More" bottom sheet — the lower-frequency approval queues */}
      {showMoreSheet && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMoreSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-bold text-gray-900">More</h2>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 pb-2">
              {MOBILE_MORE_ITEMS.map((item) => {
                const badge =
                  item.href === '/manager/refunds' ? refundUnreadCount :
                  item.href === '/manager/vendor-agreements' ? agreementUnreadCount : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreSheet(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-700 shrink-0">
                      <item.icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-800">{item.label}</span>
                    {badge > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Install app popup — appears once per browser (see
          handleBeforeInstall) across both desktop and mobile, since the
          topbar button covers "install any time" and this covers "ask once". */}
      {showInstallModal && !isInstalled && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={dismissInstallModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-teal-700 flex items-center justify-center mb-4">
              <Download className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Install Manager App</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Add it to your home screen for one-tap access to Helpdesk, Inquiries, Chats and approvals — even away from your desk.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={dismissInstallModal}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Split out from ManagerLayoutContent so it can consume the page-header
// context — the title/subtitle a page registers via useManagerPageHeader()
// renders here, on the left of the same sticky bar the notification bell
// already lives in, instead of every page repeating its own header block
// below it (saves a whole row of vertical space, and the title stays
// visible on scroll since this bar is sticky).
function ManagerTopBar({
  onOpenSidebar,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  canInstall,
  onInstallClick,
}: {
  onOpenSidebar: () => void;
  notifications: ManagerNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  canInstall: boolean;
  onInstallClick: () => void;
}) {
  const { header } = useManagerPageHeaderContext();

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        {header?.leading}
        {header && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{header.title}</h1>
            {header.subtitle && (
              <p className="text-xs text-gray-500 truncate hidden sm:block">{header.subtitle}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canInstall && (
          <button
            onClick={onInstallClick}
            className="hidden sm:inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            title="Install Manager App"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
        )}
        {header?.action}
        <ManagerNotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
        />
      </div>
    </div>
  );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ManagerPageHeaderProvider>
          <ManagerLayoutContent>{children}</ManagerLayoutContent>
        </ManagerPageHeaderProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
