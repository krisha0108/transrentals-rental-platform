'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SmartShivi } from '@/components/chatbot/SmartShivi';
import { useCustomerWebNotifications } from '@/hooks/useCustomerWebNotifications';

// Routes that should NOT show the default header/footer
const noLayoutRoutes = [
  '/admin',
  '/subadmin',
  '/manager',
  '/vendor/',
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

  if (hideDefaultLayout) {
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
      <main className="flex-1 pt-16 md:pt-[88px] pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <SmartShivi />
    </div>
  );
}
