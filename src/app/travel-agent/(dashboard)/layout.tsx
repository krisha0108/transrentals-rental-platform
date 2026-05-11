'use client';

import { SessionProvider } from 'next-auth/react';
import { TravelAgentLayout } from '@/components/travel-agent/layout/TravelAgentLayout';

export default function TravelAgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <TravelAgentLayout>{children}</TravelAgentLayout>
    </SessionProvider>
  );
}
