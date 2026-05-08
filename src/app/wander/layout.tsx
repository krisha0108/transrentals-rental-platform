import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wander Experiences - Curated Travel & Adventure Tours | TransRentals',
  description: 'Discover curated travel experiences, adventure tours, group trips, and cultural journeys across India. Book unique wander experiences with TransRentals.',
  keywords: [
    'wander experiences india',
    'travel tours india',
    'adventure trips india',
    'group tours india',
    'curated travel experiences',
    'cultural tours india',
    'weekend getaways india',
    'nature trips india',
    'pilgrimage tours',
    'hill station trips',
  ],
  openGraph: {
    title: 'Wander Experiences - Adventure & Cultural Tours | TransRentals',
    description: 'Curated travel experiences, adventure tours, group trips across India. Mountains, beaches, heritage, wildlife.',
    type: 'website',
    url: 'https://transrentals.in/wander',
    images: [{ url: 'https://transrentals.in/images/og-image.jpg', width: 1200, height: 630, alt: 'Wander Experiences - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wander Experiences - Adventure & Cultural Tours | TransRentals',
    description: 'Curated travel experiences across India — mountains, beaches, heritage, wildlife.',
    images: ['https://transrentals.in/images/og-image.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/wander' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const wanderSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'Wander Experiences - Curated Travel & Adventure Tours',
      description: 'Discover curated travel experiences, adventure tours, group trips across India.',
      url: 'https://transrentals.in/wander',
      provider: {
        '@type': 'Organization',
        name: 'TransRentals',
        url: 'https://transrentals.in',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
        { '@type': 'ListItem', position: 2, name: 'Wander Experiences', item: 'https://transrentals.in/wander' },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'Popular Wander Experiences in India',
      url: 'https://transrentals.in/wander',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Adventure Experiences', url: 'https://transrentals.in/wander?category=adventure' },
        { '@type': 'ListItem', position: 2, name: 'Beach & Coastal Trips', url: 'https://transrentals.in/wander?category=beach' },
        { '@type': 'ListItem', position: 3, name: 'Pilgrimage Tours', url: 'https://transrentals.in/wander?category=pilgrimage' },
        { '@type': 'ListItem', position: 4, name: 'Heritage & Culture', url: 'https://transrentals.in/wander?category=heritage' },
        { '@type': 'ListItem', position: 5, name: 'Wildlife Tours', url: 'https://transrentals.in/wander?category=wildlife' },
        { '@type': 'ListItem', position: 6, name: 'Hill Station Getaways', url: 'https://transrentals.in/wander?category=hills' },
      ],
    },
  ],
};

export default function WanderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(wanderSchema) }}
      />
      {children}
    </>
  );
}
