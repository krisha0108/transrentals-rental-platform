import type { Metadata } from 'next';

// Sets driver-specific PWA manifest for all /driver/* routes
export const metadata: Metadata = {
  manifest: '/driver-manifest.json',
  title: {
    default: 'Driver App | TransRentals',
    template: '%s | TR Driver',
  },
  description: 'Manage your trips and bookings as a TransRentals driver',
  themeColor: '#059669',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TR Driver',
  },
};

export default function DriverRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
