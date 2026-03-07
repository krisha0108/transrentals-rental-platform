import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';

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
    title: `Self Drive Hatchback Rental in ${locationName} | Rent @₹899/Day | TransRentals`,
    description: `Rent hatchback without driver in ${locationName}. Swift, i20, Baleno, Tiago available. Most affordable self-drive option.`,
    keywords: [
      `self drive hatchback rental ${locationName}`,
      `hatchback on rent ${locationName}`,
      `swift on rent ${locationName}`,
      `i20 rental ${locationName}`,
    ],
    openGraph: {
      title: `Self Drive Hatchback Rental in ${locationName} @₹899/Day | TransRentals`,
      description: `Rent hatchbacks without driver in ${locationName}. Swift, i20, Baleno available.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-hatchback-rental/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-hatchback-rental/${locationSlug}`,
    },
  };
}

const hatchbackModels = [
  { name: 'Maruti Swift', price: 899, fuel: 'Petrol/CNG' },
  { name: 'Hyundai i20', price: 999, fuel: 'Petrol' },
  { name: 'Maruti Baleno', price: 949, fuel: 'Petrol/CNG' },
  { name: 'Tata Tiago', price: 799, fuel: 'Petrol/CNG' },
  { name: 'Hyundai Grand i10', price: 849, fuel: 'Petrol' },
  { name: 'Maruti Wagon R', price: 799, fuel: 'Petrol/CNG' },
];

export default async function HatchbackRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-hatchback-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-hatchback-rental" serviceName="Self Drive Hatchback Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/self-drive-hatchback-rental" className="hover:text-green-700">Self Drive Hatchback Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Hatchback Rental in ${locationName}`}
        title="Self Drive Hatchback Rental"
        titleHighlight="Starting @₹899/Day"
        description={`Rent hatchback without driver in ${locationName}. Swift, i20, Baleno, Tiago available. Most affordable and fuel-efficient option.`}
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Best Mileage', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="blue-50"
      />

      <section className="bg-gradient-to-br from-green-700 to-blue-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Self Drive Hatchback Rental in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Most affordable option for city driving. Easy to drive and park.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹799/day</p>
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
            Hatchbacks Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {hatchbackModels.map((car) => (
              <div key={car.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{car.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹{car.price}</p>
                    <p className="text-xs text-gray-500">/day</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">⛽ {car.fuel} • 👥 5 Seats</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
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
            <Link href={`/self-drive-sedan-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Sedan Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,299/day</p>
            </Link>
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">SUV Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Self Drive Cars</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="self-drive-hatchback-rental"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} />
    </>
  );
}
