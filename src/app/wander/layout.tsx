import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import { prisma } from '@/lib/db/prisma';

// Premium serif display font — scoped to the /wander route only
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

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

export default async function WanderLayout({ children }: { children: React.ReactNode }) {
  // Fetch top active listings for ItemList schema — real URLs, not filter params
  let listings: Array<{ slug: string | null; title: string; shortDescription: string | null }> = [];
  try {
    if (process.env.SKIP_DATABASE_CALLS !== '1') {
      listings = await prisma.wander_listings.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, title: true, shortDescription: true },
        orderBy: { totalBookings: 'desc' },
        take: 8,
      });
    }
  } catch {
    // DB unavailable at build time — schema rendered without ItemList
  }

  const graphNodes: object[] = [
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
  ];

  if (listings.length > 0) {
    graphNodes.push({
      '@type': 'ItemList',
      name: 'Popular Wander Experiences in India',
      url: 'https://transrentals.in/wander',
      numberOfItems: listings.length,
      itemListElement: listings.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: l.title,
        url: l.slug
          ? `https://transrentals.in/wander/${l.slug}`
          : 'https://transrentals.in/wander',
        ...(l.shortDescription && { description: l.shortDescription }),
      })),
    });
  }

  const wanderSchema = { '@context': 'https://schema.org', '@graph': graphNodes };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(wanderSchema) }}
      />
      <div className={fraunces.variable}>{children}</div>
    </>
  );
}
