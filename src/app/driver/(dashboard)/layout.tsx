'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Home,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Download,
  Loader2,
  TrendingUp,
  Bell,
  MessageCircle,
} from 'lucide-react';
import { useDriverWebNotifications } from '@/hooks/useDriverWebNotifications';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  userType?: string;
  vendor?: {
    businessName: string;
  };
}

export default function DriverDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for new booking assignment notifications (web/PWA)
  useDriverWebNotifications();

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = () => {
      fetch('/api/driver/notifications')
        .then(r => r.json())
        .then(d => {
          if (d.notifications) {
            setUnreadCount(d.notifications.filter((n: any) => !n.read).length);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkAuth();

    // ── PWA: point to driver-specific manifest ──────────────────────────────
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = '/driver-manifest.json';

    // ── PWA: detect standalone mode (already installed) ────────────────────
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // ── PWA: capture install prompt ────────────────────────────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    // ── PWA: hide banner once installed ───────────────────────────────────
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // ── Notifications: request permission + Firebase Web Push ─────────────
    (async () => {
      if ('Notification' in window) {
        const permission = Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission;

        if (permission === 'granted') {
          import('@/lib/firebase-client').then(({ initFirebaseMessaging }) => {
            initFirebaseMessaging().then(result => {
              if (result?.token) {
                fetch('/api/driver/web-push-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: result.token }),
                }).catch(() => {});
              }
            });
          }).catch(() => {});
        }
      }
    })();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/driver/auth/me');
      const data = await response.json();

      if (!data.success) {
        router.push('/driver/login');
        return;
      }

      setDriver(data.driver);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/driver/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear web FCM token before logout
      fetch('/api/driver/web-push-token', { method: 'DELETE' }).catch(() => {});
      await fetch('/api/driver/auth/logout', { method: 'POST' });
      localStorage.removeItem('driver-token');
      router.push('/driver/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const isIndependent = driver?.userType === 'independent';

  const navItems = [
    { href: '/driver/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/driver/bookings', icon: Calendar, label: 'My Trips' },
    { href: '/driver/fleet', icon: Car, label: 'Fleet' },
    { href: '/driver/earnings', icon: TrendingUp, label: 'Earnings' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <Download className="w-4 h-4 shrink-0" />
            <span>Install Driver App on your phone for quick access</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Menu Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-emerald-700 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link href="/driver/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-bold text-lg leading-none">Driver App</p>
                  <p className="text-emerald-200 text-xs">
                    {driver.vendor?.businessName || (isIndependent ? 'Independent Driver' : '')}
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-emerald-100 hover:bg-emerald-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {(item as any).badge > 0 && (
                      <span className="ml-0.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {(item as any).badge > 9 ? '9+' : (item as any).badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Chat Icon */}
              <Link href="/driver/chat" className={`relative p-2 hover:bg-emerald-700 rounded-lg ${pathname.startsWith('/driver/chat') ? 'bg-emerald-700' : ''}`}>
                <MessageCircle className="w-5 h-5" />
              </Link>
              {/* Notification Bell */}
              <Link href="/driver/notifications" className={`relative p-2 hover:bg-emerald-700 rounded-lg ${pathname === '/driver/notifications' ? 'bg-emerald-700' : ''}`}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              {/* Install button (desktop) — only shown when not yet installed */}
              {installPrompt && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                  title="Install as app"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}
              <div className="hidden sm:block text-right">
                <p className="font-medium text-sm">{driver.name}</p>
                <p className="text-emerald-200 text-xs">{driver.phone}</p>
              </div>
              <Link
                href="/driver/profile"
                className="w-10 h-10 bg-emerald-700 hover:bg-emerald-800 rounded-full flex items-center justify-center font-bold transition"
                title="My Profile"
              >
                {driver.name.charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-emerald-700 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-emerald-700 border-t border-emerald-600">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-emerald-800 text-white'
                        : 'text-emerald-100 hover:bg-emerald-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/driver/chat"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  pathname.startsWith('/driver/chat')
                    ? 'bg-emerald-800 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Messages
              </Link>
              <Link
                href="/driver/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  pathname === '/driver/profile'
                    ? 'bg-emerald-800 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
              {/* Install option in mobile menu */}
              {installPrompt && !isInstalled && (
                <button
                  onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800"
                >
                  <Download className="w-5 h-5" />
                  Install App
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center py-3 px-4 ${
                  isActive ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                <item.icon className="w-6 h-6" />
                {(item as any).badge > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
