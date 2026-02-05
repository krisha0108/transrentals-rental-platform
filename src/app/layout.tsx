import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { LocationProvider } from '@/contexts/LocationContext';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import VisitorTracker from '@/components/analytics/VisitorTracker';
import TrackingScripts from '@/components/analytics/TrackingScripts';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://transrentals.in'),
  title: {
    default: 'TransRentals - India\'s Largest Vehicle Rental Marketplace',
    template: '%s | TransRentals',
  },
  description:
    'Rent bikes, cars, buses, trucks & equipment across 150+ cities in India. Best prices guaranteed. Book now with TransRentals - India\'s trusted vehicle rental marketplace.',
  keywords: [
    'bike rental',
    'car rental',
    'bus rental',
    'truck rental',
    'vehicle rental india',
    'bike on rent',
    'transrentals',
    'self drive cars',
    'equipment rental',
    'packers and movers',
  ],
  authors: [{ name: 'TransRentals' }],
  creator: 'TransRentals',
  publisher: 'TransRentals',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'TransRentals - India\'s Largest Vehicle Rental Marketplace',
    description:
      'Rent bikes, cars, buses, trucks & equipment across 150+ cities in India. Best prices guaranteed.',
    siteName: 'TransRentals',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TransRentals - Vehicle Rental Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TransRentals - India\'s Largest Vehicle Rental Marketplace',
    description:
      'Rent bikes, cars, buses, trucks & equipment across 150+ cities in India.',
    images: ['/images/og-image.jpg'],
    creator: '@transrentals',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TransRentals',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Google Analytics 4 - Hardcoded with correct Measurement ID */}
        <GoogleAnalytics />
      </head>
      <body className="font-sans antialiased">
        <LocationProvider>
          {/* Track SPA route changes */}
          <PageViewTracker />
          <VisitorTracker />
          <TrackingScripts />
          {/* iOS PWA Install Prompt */}
          <IOSInstallPrompt />
          <LayoutWrapper>{children}</LayoutWrapper>
        </LocationProvider>
      </body>
    </html>
  );
}
