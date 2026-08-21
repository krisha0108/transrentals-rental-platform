import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { LocationProvider } from '@/contexts/LocationContext';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import VisitorTracker from '@/components/analytics/VisitorTracker';
import TrackingScripts, { getVerificationCodes } from '@/components/analytics/TrackingScripts';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import PageViewTracker from '@/components/analytics/PageViewTracker';
// import dynamic from 'next/dynamic';

// Dynamic imports with SSR disabled to prevent webpack errors
// const IOSInstallPrompt = dynamic(() => import('@/components/IOSInstallPrompt'), {
//   ssr: false,
// });
// const AppInstallBanner = dynamic(() => import('@/components/AppInstallBanner'), {
//   ssr: false,
// });

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#16a34a',
  // On Chromium mobile browsers, the on-screen keyboard opens without
  // shrinking the layout viewport by default (it only shrinks the visual
  // viewport), so 100vh/min-h-screen containers and fixed-position submit
  // buttons don't resize — the bottom of forms ends up hidden behind the
  // keyboard. This makes the layout viewport actually resize when the
  // keyboard opens, matching iOS Safari's behavior.
  interactiveWidget: 'resizes-content',
};

const BASE_METADATA: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://transrentals.in'),
  title: {
    default: 'TransRentals - India\'s Largest Vehicle Rental Marketplace',
    template: '%s',
  },
  description:
    'Rent bikes, cars, buses & trucks in 150+ Indian cities. Affordable prices, doorstep delivery. Book now on TransRentals.',
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TransRentals',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

// generateMetadata fetches verification codes from DB so admin can set them without code changes
export async function generateMetadata(): Promise<Metadata> {
  const codes = await getVerificationCodes();
  return {
    ...BASE_METADATA,
    ...(codes.googleVerificationCode && {
      verification: { google: codes.googleVerificationCode },
    }),
  };
}

const GLOBAL_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://transrentals.in/#organization',
      name: 'TransRentals',
      alternateName: ['Trans Rentals', 'TransRentals.in'],
      description: "TransRentals is India's vehicle rental marketplace offering car rental, self-drive cars, bike rental, bus rental, tempo traveller, mini truck rental, packers and movers, equipment rental (JCB, crane, excavator, hydra crane), and generator rental across 250+ cities in India.",
      url: 'https://transrentals.in',
      email: 'book@transrentals.in',
      foundingDate: '2022',
      logo: {
        '@type': 'ImageObject',
        url: 'https://transrentals.in/images/logo.png',
        width: 200,
        height: 60,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9737965551',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '215, Galaxy Business, 2nd Floor, SP Ring Road',
        addressLocality: 'Ahmedabad',
        addressRegion: 'Gujarat',
        postalCode: '382350',
        addressCountry: 'IN',
      },
      areaServed: { '@type': 'Country', name: 'India' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Vehicle and Equipment Rental Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Car Rental', description: 'Self-drive and chauffeur-driven car rental across India' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bike Rental', description: 'Honda Activa, Royal Enfield, KTM and all bikes on rent' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bus Rental', description: 'Mini bus, tempo traveller and luxury bus rental for group travel' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mini Truck Rental', description: 'Tata Ace and mini truck rental for goods transport and house shifting' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Packers and Movers', description: 'House shifting and relocation services across India' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Equipment Rental', description: 'JCB, crane, excavator, hydra crane and construction equipment rental' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Generator Rental', description: 'Diesel generator and DG set rental for events, construction and industrial use' } },
        ],
      },
      sameAs: [
        'https://www.facebook.com/Transrentalsindia/',
        'https://www.instagram.com/transrentals_in/',
        'https://twitter.com/transrentals',
        'https://in.linkedin.com/company/transrentals',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://transrentals.in/#website',
      url: 'https://transrentals.in',
      name: 'TransRentals',
      description: "India's vehicle rental marketplace — car, bike, bus, truck, equipment and more",
      publisher: { '@id': 'https://transrentals.in/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://transrentals.in/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-IN',
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(GLOBAL_SCHEMA) }}
        />
      </head>
      <body className="font-sans antialiased">
        <LocationProvider>
          {/* Track SPA route changes */}
          <PageViewTracker />
          <VisitorTracker />
          <TrackingScripts />
          {/* iOS PWA Install Prompt */}
          {/* <IOSInstallPrompt /> */}
          {/* Smart App Install Banner for Android & iOS */}
          {/* <AppInstallBanner /> */}
          <LayoutWrapper>{children}</LayoutWrapper>
        </LocationProvider>
      </body>
    </html>
  );
}
