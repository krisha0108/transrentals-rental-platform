import type { Metadata } from 'next';
import { INDIAN_STATES, getCitiesByState } from '@/data/indian-cities';
import { LocationsClient } from './LocationsClient';

export const metadata: Metadata = {
  title: 'Locations | TransRentals — Services Across India',
  description: 'Find rental services in 500+ cities across India. Browse by state — bike rental, cab, packers & movers, bus rental and more.',
  alternates: { canonical: 'https://transrentals.in/locations' },
  openGraph: {
    title: 'Locations | TransRentals',
    description: 'Rental services across 500+ cities and all states in India.',
    url: 'https://transrentals.in/locations',
    type: 'website',
  },
};

export default function LocationsPage() {
  const statesWithCities = INDIAN_STATES.map((state) => ({
    ...state,
    cities: getCitiesByState(state.code).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
  })).filter((s) => s.cities.length > 0).sort((a, b) => b.cities.length - a.cities.length);

  return <LocationsClient statesWithCities={statesWithCities} />;
}
