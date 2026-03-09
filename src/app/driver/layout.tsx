import type { Metadata, Viewport } from 'next';

// Sets driver-specific PWA manifest for all /driver/* routes
export const metadata: Metadata = {
  manifest: '/driver-manifest.json',
  title: {
    default: 'Driver App | TransRentals',
    template: '%s | TR Driver',
  },
  description: 'Manage your trips and bookings as a TransRentals driver',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TR Driver',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
};

export default function DriverRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
