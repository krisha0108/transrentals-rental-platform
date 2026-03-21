import { Metadata } from 'next';
import { CarSubServicesGrid } from '@/components/services/CarSubServicesGrid';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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
  },
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

      {/* Hero with booking form */}
      <ServiceHeroWithChat
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
