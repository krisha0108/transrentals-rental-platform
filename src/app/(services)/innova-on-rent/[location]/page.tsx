import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
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
    title: `Innova on Rent in ${locationName} | Rent Innova @₹2499/Day | TransRentals`,
    description: `Rent Toyota Innova Crysta without driver in ${locationName}. Self-drive Innova rental for family trips, weddings. 7+1 seater. GX, VX, ZX variants available.`,
    keywords: [
      `innova on rent ${locationName}`,
      `toyota innova rental ${locationName}`,
      `rent innova without driver ${locationName}`,
      `7 seater car rental ${locationName}`,
    ],
    openGraph: {
      title: `Innova on Rent in ${locationName} @₹2499/Day | TransRentals`,
      description: `Self-drive Toyota Innova Crysta rental in ${locationName}. Best rates guaranteed.`,
      type: 'website',
      url: `https://transrentals.in/innova-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/innova-on-rent/${locationSlug}`,
    },
  };
}

const innovaVariants = [
  { name: 'Toyota Innova Crysta GX', price: 2499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta GX AT', price: 2799, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta VX', price: 2999, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta ZX AT', price: 3499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova HyCross', price: 3999, fuel: 'Hybrid', seats: 7 },
];

export default async function InnovaOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('innova-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="innova-on-rent" serviceName="Innova on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/innova-on-rent" className="hover:text-purple-700">Innova on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Innova Rental in ${locationName}`}
        title="Toyota Innova on Rent"
        titleHighlight="Starting @₹2499/Day"
        description={`Rent Toyota Innova Crysta without driver in ${locationName}. India's most trusted 7-seater MPV with legendary comfort and reliability.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: '7+1 Seater', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
      />

      <section className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Innova on Rent in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Self-drive Toyota Innova Crysta. Best MPV for family trips & group travel.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹2,499/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">7+1 Seats</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Variants</p>
              <p className="text-xl font-bold">5 Options</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Innova Variants in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {innovaVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{variant.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">₹{variant.price}</p>
                    <p className="text-xs text-gray-500">/day</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">⛽ {variant.fuel} • 👥 {variant.seats} Seats • 🚐 MPV</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
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
            Other Cars in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/fortuner-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Fortuner on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹4,999/day</p>
            </Link>
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">Seltos, Scorpio, XUV700</p>
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
