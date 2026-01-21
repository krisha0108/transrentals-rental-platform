'use client';

import { SessionProvider } from 'next-auth/react';
import { VendorLayout } from '@/components/vendor/layout/VendorLayout';

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <VendorLayout>{children}</VendorLayout>
    </SessionProvider>
  );
}
