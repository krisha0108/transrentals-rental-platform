import { Metadata } from 'next';
import { CarSubServicesGrid } from '@/components/services/CarSubServicesGrid';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';

export const metadata: Metadata = {
  title: 'Car Rental - Rent Self Drive Cars Starting @₹999/Day | TransRentals',
  description: 'Rent cars across India at the best prices. Self-drive cars, cars with drivers, SUVs, sedans, hatchbacks available in 250+ cities. Book online instantly!',
  keywords: ['car rental', 'car on rent', 'self drive car', 'car hire', 'rent a car', 'car booking', 'car rental near me'],
  openGraph: {
    title: 'Car Rental India - Starting @₹999/Day | TransRentals',
    description: 'Book self-drive cars and cars with drivers across 250+ Indian cities. Verified vendors, best prices, instant booking.',
  },
};

export default function CarRentalPage() {
  return (
    <>
      {/* Simple Hero without booking form */}
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
        stats={[
          { value: '1000+', label: 'Cars Available' },
          { value: '250+', label: 'Cities Covered' },
          { value: '100K+', label: 'Happy Customers' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
        gradientAccent="from-blue-600 to-indigo-600"
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
