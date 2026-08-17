'use client';

import { SessionProvider } from 'next-auth/react';
import { VendorHelpBotWidget } from '@/components/vendor/VendorHelpBotWidget';

export default function VendorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <VendorHelpBotWidget />
    </SessionProvider>
  );
}
