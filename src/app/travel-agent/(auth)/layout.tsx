'use client';

import { SessionProvider } from 'next-auth/react';
import { HelpBotWidget } from '@/components/travel-agent/HelpBotWidget';

export default function TravelAgentAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <HelpBotWidget />
    </SessionProvider>
  );
}
