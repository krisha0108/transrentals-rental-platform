import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where self-drive-car-rentals is available
export async function generateStaticParams() {
  return getServiceLocations('self-drive-car-rentals');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  return {
    title: `Self Drive Sedan Rental in ${locationName} | Rent Sedan @₹1299/Day | TransRentals`,
    description: `Rent sedan without driver in ${locationName}. Honda City, Verna, Ciaz, Dzire available. Self-drive sedan for business & outstation travel.`,
    keywords: [
      `self drive sedan rental ${locationName}`,
      `sedan on rent ${locationName}`,
      `rent sedan without driver ${locationName}`,
      `honda city on rent ${locationName}`,
    ],
    openGraph: {
      title: `Self Drive Sedan Rental in ${locationName} @₹1299/Day | TransRentals`,
      description: `Rent sedans without driver in ${locationName}. City, Verna, Ciaz available.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-sedan-rental/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-sedan-rental/${locationSlug}`,
    },
  };
}

const sedanModels = [
  { name: 'Maruti Dzire', price: 1299, fuel: 'Petrol/CNG' },
  { name: 'Honda Amaze', price: 1399, fuel: 'Petrol/Diesel' },
  { name: 'Hyundai Verna', price: 1699, fuel: 'Petrol/Diesel' },
  { name: 'Honda City', price: 1799, fuel: 'Petrol/Hybrid' },
  { name: 'Skoda Slavia', price: 1899, fuel: 'Petrol' },
  { name: 'Maruti Ciaz', price: 1599, fuel: 'Petrol/CNG' },
];

export default function SedanRentalLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/self-drive-sedan-rental" className="hover:text-blue-700">Self Drive Sedan Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Sedan Rental in ${locationName}`}
        title="Self Drive Sedan Rental"
        titleHighlight="Starting @₹1299/Day"
        description={`Rent sedan without driver in ${locationName}. Honda City, Verna, Ciaz, Dzire available. Comfortable for business and outstation travel.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Great Mileage', color: 'text-blue-600' },
        ]}
        gradientFrom="gray-50"
        gradientTo="blue-50"
      />

      <section className="bg-gradient-to-br from-gray-800 to-blue-900 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Self Drive Sedan Rental in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Comfortable, stylish sedans for business and leisure travel.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,299/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Available</p>
              <p className="text-xl font-bold">6+ Models</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Sedans Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sedanModels.map((sedan) => (
              <div key={sedan.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{sedan.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">₹{sedan.price}</p>
                    <p className="text-xs text-gray-500">/day</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">⛽ {sedan.fuel} • 👥 5 Seats</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">
            Other Options in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">SUV Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/self-drive-hatchback-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Hatchback Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹899/day</p>
            </Link>
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Self Drive Cars</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="self-drive-car-rental" location={locationName} />
    </>
  );
}
