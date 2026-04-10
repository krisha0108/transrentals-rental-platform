import { Metadata } from 'next';
import { CarSubServicesGrid } from '@/components/services/CarSubServicesGrid';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';

export const metadata: Metadata = {
  title: 'Car Rental - Rent Self Drive Cars Starting @₹999/Day | TransRentals',
  description: 'Rent cars across India at the best prices. Self-drive cars, cars with drivers, SUVs, sedans, hatchbacks available in 250+ cities. Book online instantly!',
  keywords: ['car rental', 'car on rent', 'self drive car', 'car hire', 'rent a car', 'car booking', 'car rental near me'],
  alternates: {
    canonical: 'https://transrentals.in/car-rental',
  },
  openGraph: {
    title: 'Car Rental India - Starting @₹999/Day | TransRentals',
    description: 'Book self-drive cars and cars with drivers across 250+ Indian cities. Verified vendors, best prices, instant booking.',
    type: 'website',
    url: 'https://transrentals.in/car-rental',
    images: [{ url: 'https://transrentals.in/images/og/car-rental.jpg', width: 1200, height: 630, alt: 'Car Rental India - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Rental India - Starting @₹999/Day | TransRentals',
    description: 'Book self-drive cars and cars with drivers across 250+ Indian cities. Verified vendors, best prices.',
    images: ['https://transrentals.in/images/og/car-rental.jpg'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function CarRentalPage() {
  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Car Rental India',
            description: 'Rent cars across India at the best prices. Self-drive cars, cars with drivers, SUVs, sedans, hatchbacks available in 250+ cities.',
            url: 'https://transrentals.in/car-rental',
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Car Rental',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '999',
              highPrice: '9999',
              priceSuffix: '/day',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '10000',
              bestRating: '5',
            },
          }),
        }}
      />

      {/* Hero Section */}
      <SimpleServiceHero
        badge="Car Rental Services"
        title="Car Rental"
        titleHighlight="Starting @₹999/Day"
        description="Rent cars with driver across 250+ cities. Roundtrip, one-way, airport transfers. Choose from our wide range of vehicles!"
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Drivers', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="car-rental"
        title="Types of Cars Available"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="car-rental"
        title="Car Rental in Popular Cities"
        startingPrice="₹999"
        priceUnit="/day"
      />

      {/* Specialized Car Services */}
      <CarSubServicesGrid />
    </>
  );
}
