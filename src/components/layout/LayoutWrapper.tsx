'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SmartShivi } from '@/components/chatbot/SmartShivi';
import { StickyCallBar } from '@/components/common/StickyCallBar';
import { useCustomerWebNotifications } from '@/hooks/useCustomerWebNotifications';

// Routes that should NOT show the default header/footer
const noLayoutRoutes = [
  '/admin',
  '/subadmin',
  '/manager',
  '/vendor/',
  '/travel-agent/', // travel-agent dashboard, auth, public lead-capture, booking-share pages (trailing slash so /travel-agents landing page is NOT matched)
  '/agent/',       // public agent profile pages (e.g. /agent/{slug})
  '/partner/',     // public vendor profile pages (e.g. /partner/{slug})
  '/captain/',     // public driver profile pages (e.g. /captain/{slug})
  '/driver/',
  '/customer/',  // all customer pages use CustomerHeader instead
  '/book',
  '/track',
  '/invoice',
  '/trip',
  '/stories/',   // web stories - full screen, no header/footer/login
  '/q/',         // public quote share pages - standalone
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Browser push notifications for logged-in customers (polling-based)
  useCustomerWebNotifications();

  // Check if current path should hide the default layout
  const hideDefaultLayout = noLayoutRoutes.some(route =>
    pathname?.startsWith(route)
  );

  // Exception: public property pages under /agent/<slug>/property/<id> should
  // still get the default header/footer (same shell as /wander/<id>). They
  // are customer-facing detail pages, not part of the agency-profile shell.
  const isAgentPropertyPage = /^\/agent\/[^/]+\/property\//.test(pathname || '');

  if (hideDefaultLayout && !isAgentPropertyPage) {
    // Customer/admin pages - no default header/footer, no bottom nav
    // SmartShivi shown on customer pages only (not admin/vendor/manager)
    const showShivi = pathname?.startsWith('/customer/');
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        {showShivi && <SmartShivi />}
      </div>
    );
  }

  // Default layout with Header, Footer, MobileBottomNav, and SmartShivi
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[109px] md:pt-[160px] lg:pt-[120px] pb-28 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <StickyCallBar />
      <SmartShivi />
    </div>
  );
}
