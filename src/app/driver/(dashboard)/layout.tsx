'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import LocationToggleButton from '@/components/driver/LocationToggleButton';

interface Driver {
  id: string;
  did?: string | null;
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
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="dv-app min-h-screen bg-[#F4F7F5]">
      <ShellStyles />

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <Download className="w-4 h-4 shrink-0" />
            <span>Install Driver App on your phone for quick access</span>
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

      {/* Header */}
      <header className="dv-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Menu Toggle */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              {/* The real mark, not a stand-in car icon. */}
              <Link href="/driver/dashboard" className="flex items-center gap-2.5 min-w-0" aria-label="TransRentals Driver">
                <Image
                  src="/assets/logo-white.png"
                  alt="TransRentals"
                  width={3358}
                  height={591}
                  priority
                  className="h-[26px] w-auto"
                />
                <span className="hidden sm:inline-flex items-center rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                  Driver
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`dv-nav ${isActive ? 'is-active' : ''}`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.label}
                    {(item as any).badge > 0 && (
                      <span className="dv-badge">{(item as any).badge > 9 ? '9+' : (item as any).badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <LocationToggleButton />
              <Link
                href="/driver/chat"
                title="Messages"
                className={`dv-icon ${pathname.startsWith('/driver/chat') ? 'is-active' : ''}`}
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link
                href="/driver/notifications"
                title="Notifications"
                className={`dv-icon ${pathname === '/driver/notifications' ? 'is-active' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="dv-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </Link>
              {installPrompt && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="hidden xl:flex items-center gap-1.5 bg-white text-green-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                  title="Install as app"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}

              <span className="hidden lg:block w-px h-7 bg-white/20 mx-1" />

              <Link href="/driver/profile" className="dv-user" title="My Profile">
                <span className="dv-avatar">{driver.name.charAt(0).toUpperCase()}</span>
                <span className="hidden md:block text-left leading-tight min-w-0">
                  <span className="block text-[13px] font-semibold truncate max-w-[140px]">{driver.name}</span>
                  <span className="block text-[11px] text-white/70 truncate max-w-[140px]">
                    {driver.did ?? driver.vendor?.businessName ?? (isIndependent ? 'Independent Driver' : driver.phone)}
                  </span>
                </span>
              </Link>
              <button onClick={handleLogout} className="dv-icon" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/15 bg-[#0F5A31]">
            <nav className="px-3 py-2 space-y-1">
              {[...navItems,
                { href: '/driver/chat', icon: MessageCircle, label: 'Messages' },
                { href: '/driver/profile', icon: User, label: 'Profile' },
              ].map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              {installPrompt && !isInstalled && (
                <button
                  onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10"
                >
                  <Download className="w-5 h-5" />
                  Install App
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_-8px_rgba(9,40,24,0.25)] z-40">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/driver/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center py-2.5 px-4 transition ${
                  isActive ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                <span className={`flex items-center justify-center w-10 h-7 rounded-full transition ${isActive ? 'bg-green-100' : ''}`}>
                  <item.icon className="w-[22px] h-[22px]" />
                </span>
                {(item as any).badge > 0 && (
                  <span className="absolute top-1.5 right-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
                <span className="text-[11px] mt-0.5 font-medium">{item.label}</span>
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

// The portal's chrome. Green here is the brand green the rest of the site and
// the sign-in screens use (#16A34A), not the emerald this area had drifted to.
function ShellStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      /* The site-wide stylesheet sizes bare headings for marketing pages
         (h2 reaches 48px, h3 36px at desktop widths). Inside the portal that
         made a vehicle name louder than the page title. :where() carries no
         specificity, so any page that sets its own size still wins. */
      .dv-app :where(h1) { font-size: 22px; line-height: 1.25; }
      .dv-app :where(h2) { font-size: 17px; line-height: 1.3; }
      .dv-app :where(h3) { font-size: 15px; line-height: 1.35; }
      .dv-app :where(h4, h5, h6) { font-size: 14px; line-height: 1.4; }

      .dv-header {
        color: #fff;
        background: linear-gradient(103deg, #0F5A31 0%, #15803D 45%, #16A34A 100%);
        box-shadow: 0 10px 30px -18px rgba(6, 46, 26, 0.9);
      }
      .dv-nav {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 14px; border-radius: 10px;
        font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.82);
        transition: background 0.18s ease, color 0.18s ease;
      }
      .dv-nav:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .dv-nav.is-active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600; }
      .dv-badge {
        margin-left: 2px; background: #EF4444; color: #fff;
        font-size: 11px; font-weight: 700; line-height: 1;
        padding: 3px 6px; border-radius: 999px;
      }
      .dv-icon {
        position: relative; display: grid; place-items: center;
        width: 38px; height: 38px; border-radius: 10px; color: #fff;
        transition: background 0.18s ease;
      }
      .dv-icon:hover { background: rgba(255,255,255,0.12); }
      .dv-icon.is-active { background: rgba(255,255,255,0.18); }
      .dv-dot {
        position: absolute; top: 4px; right: 4px;
        min-width: 16px; height: 16px; padding: 0 3px;
        background: #EF4444; color: #fff;
        font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
        border-radius: 999px;
      }
      .dv-user {
        display: flex; align-items: center; gap: 9px;
        padding: 4px 10px 4px 4px; border-radius: 999px;
        transition: background 0.18s ease;
      }
      .dv-user:hover { background: rgba(255,255,255,0.12); }
      .dv-avatar {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 34px; height: 34px; border-radius: 50%;
        background: rgba(255,255,255,0.2); font-weight: 700; font-size: 14px;
      }

      /* ── Page furniture, shared by every screen in the portal ─────────── */

      /* The strip at the top of the dashboard. */
      .dv-hero {
        display: flex; flex-wrap: wrap; align-items: center; gap: 16px;
        justify-content: space-between;
        position: relative; overflow: hidden;
        border-radius: 20px; padding: 22px 24px; color: #fff;
        background:
          radial-gradient(120% 140% at 88% 10%, rgba(255,255,255,0.16), transparent 60%),
          linear-gradient(103deg, #0F5A31 0%, #15803D 52%, #16A34A 100%);
        box-shadow: 0 18px 40px -26px rgba(6, 46, 26, 0.85);
      }
      .dv-hero-eyebrow {
        font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase; color: rgba(255,255,255,0.72);
      }
      .dv-hero-title {
        font-size: clamp(22px, 3vw, 30px); font-weight: 800;
        letter-spacing: -0.02em; line-height: 1.1; margin-top: 4px;
      }
      .dv-hero-sub { margin-top: 6px; font-size: 14px; color: rgba(255,255,255,0.8); }
      .dv-hero-cta {
        display: inline-flex; align-items: center; gap: 8px;
        border-radius: 12px; background: #fff; color: #14532D;
        padding: 11px 18px; font-size: 14px; font-weight: 700;
        transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
      }
      .dv-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -14px rgba(0,0,0,0.6); }

      /* "You still need to do this" rows. One shape, three tones. */
      .dv-prompt {
        display: flex; align-items: center; gap: 14px;
        border-radius: 16px; border: 1px solid; padding: 14px 18px;
        transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
      }
      .dv-prompt:hover { transform: translateY(-1px); box-shadow: 0 12px 24px -18px rgba(9,40,24,0.7); }
      .dv-prompt-icon {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 42px; height: 42px; border-radius: 12px;
      }
      .dv-prompt-text { min-width: 0; flex: 1 1 auto; }
      .dv-prompt-title { display: block; font-weight: 700; font-size: 15px; }
      .dv-prompt-sub { display: block; font-size: 13px; margin-top: 2px; opacity: 0.85; }

      .dv-prompt-green { background: #F0FAF3; border-color: #BBE7CB; color: #14532D; }
      .dv-prompt-green .dv-prompt-icon { background: #DCF3E4; color: #15803D; }
      .dv-prompt-green:hover { background: #E7F6ED; }

      .dv-prompt-amber { background: #FFFAEB; border-color: #FDE68A; color: #78350F; }
      .dv-prompt-amber .dv-prompt-icon { background: #FEF3C7; color: #B45309; }
      .dv-prompt-amber:hover { background: #FEF6DE; }

      .dv-prompt-blue { background: #EFF6FF; border-color: #BFDBFE; color: #1E3A8A; }
      .dv-prompt-blue .dv-prompt-icon { background: #DBEAFE; color: #2563EB; }
      .dv-prompt-blue:hover { background: #E4EFFE; }

      /* Figure tiles, the same ones the admin lists use. */
      .dv-stat {
        position: relative; overflow: hidden;
        background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
        padding: 16px 18px;
        box-shadow: 0 1px 2px rgba(16,24,40,0.05);
      }
      .dv-stat-accent { position: absolute; inset-block: 0; left: 0; width: 4px; }
      .dv-stat-body { display: flex; align-items: center; gap: 12px; padding-left: 4px; }
      .dv-stat-icon { display: grid; place-items: center; flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; }
      .dv-stat-value { font-size: 26px; font-weight: 800; line-height: 1; color: #111827; }
      .dv-stat-label { font-size: 12.5px; color: #6B7280; margin-top: 5px; }

      /* Page header: the same title block on every screen. */
      .dv-page-head {
        display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
        justify-content: space-between; margin-bottom: 4px;
      }
      .dv-page-icon {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 42px; height: 42px; border-radius: 13px;
        background: #E7F6ED; color: #15803D;
      }
      .dv-page-title {
        font-size: 21px; font-weight: 800; letter-spacing: -0.015em; color: #0F1F17;
      }
      .dv-page-sub { font-size: 13.5px; color: #6B7280; margin-top: 2px; }

      .dv-action {
        display: inline-flex; align-items: center; gap: 7px;
        border-radius: 11px; background: #16A34A; color: #fff;
        padding: 9px 16px; font-size: 13.5px; font-weight: 700;
        transition: background 0.18s ease, transform 0.18s cubic-bezier(0.22,1,0.36,1);
      }
      .dv-action:hover { background: #15803D; transform: translateY(-1px); }
      .dv-action-ghost {
        display: inline-flex; align-items: center; gap: 7px;
        border: 1px solid #E5E7EB; border-radius: 11px; background: #fff; color: #374151;
        padding: 9px 14px; font-size: 13.5px; font-weight: 600;
        transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }
      .dv-action-ghost:hover { background: #F6FAF7; border-color: #BBE7CB; color: #15803D; }

      .dv-stat-hint { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
      .dv-stat-button { cursor: pointer; transition: box-shadow 0.18s ease, border-color 0.18s ease; width: 100%; }
      .dv-stat-button:hover { box-shadow: 0 10px 22px -16px rgba(9,40,24,0.6); border-color: #BBE7CB; }
      .dv-stat-button.is-selected { border-color: #16A34A; box-shadow: 0 0 0 3px rgba(22,163,74,0.14); }

      /* Panels. */
      .dv-panel {
        background: #fff; border: 1px solid #E5E7EB; border-radius: 18px;
        box-shadow: 0 1px 2px rgba(16,24,40,0.05); overflow: hidden;
      }
      .dv-panel-head {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 14px 18px; border-bottom: 1px solid #F1F3F5; background: #FBFDFC;
      }
      .dv-panel-title { font-size: 15px; font-weight: 700; color: #0F1F17; }

      /* Filter pills. */
      .dv-pills { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
      .dv-pill {
        display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto;
        border: 1px solid #E5E7EB; border-radius: 999px; background: #fff;
        padding: 7px 14px; font-size: 13px; font-weight: 600; color: #4B5563;
        transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
      }
      .dv-pill:hover { background: #F6FAF7; border-color: #BBE7CB; color: #15803D; }
      .dv-pill.is-active { background: #16A34A; border-color: #16A34A; color: #fff; }
      .dv-pill-count {
        border-radius: 999px; background: rgba(0,0,0,0.08);
        padding: 1px 7px; font-size: 11px; font-weight: 700;
      }
      .dv-pill.is-active .dv-pill-count { background: rgba(255,255,255,0.24); }

      /* Empty states, so a screen with nothing on it still says something. */
      .dv-empty {
        display: flex; flex-direction: column; align-items: center;
        background: #fff; border: 1px solid #E5E7EB; border-radius: 20px;
        padding: 44px 24px; text-align: center;
      }
      .dv-empty-icon {
        display: grid; place-items: center; width: 64px; height: 64px;
        border-radius: 50%; background: #F0FAF3; color: #16A34A; margin-bottom: 16px;
      }
      .dv-empty-title { font-size: 16px; font-weight: 700; color: #111827; }
      .dv-empty-sub { font-size: 13.5px; color: #6B7280; margin-top: 6px; max-width: 42ch; }
      .dv-empty-cta {
        display: inline-flex; align-items: center; gap: 8px; margin-top: 18px;
        border-radius: 12px; background: #16A34A; color: #fff;
        padding: 11px 20px; font-size: 14px; font-weight: 700;
        transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), background 0.2s ease;
      }
      .dv-empty-cta:hover { background: #15803D; transform: translateY(-2px); }

      @media (prefers-reduced-motion: reduce) {
        .dv-hero-cta, .dv-prompt, .dv-empty-cta { transition: none; }
      }
    `,
      }}
    />
  );
}
