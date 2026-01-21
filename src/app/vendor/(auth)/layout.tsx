'use client';

import { SessionProvider } from 'next-auth/react';

export default function VendorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
