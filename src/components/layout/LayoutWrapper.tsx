'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SmartShivi } from '@/components/chatbot/SmartShivi';

// Routes that should NOT show the default header/footer
const noLayoutRoutes = [
  '/admin',
  '/subadmin',
  '/manager',
  '/vendor',
  '/driver',
  '/customer/dashboard',
  '/customer/booking',
  '/customer/helpdesk',
  '/customer/financials',
  '/customer/login',
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current path should hide the default layout
  const hideDefaultLayout = noLayoutRoutes.some(route =>
    pathname?.startsWith(route)
  );

  if (hideDefaultLayout) {
    // Customer pages - no default header/footer, no SmartShivi
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Default layout with Header, Footer, and SmartShivi
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 md:pt-[88px]">{children}</main>
      <Footer />
      <SmartShivi />
    </div>
  );
}
