import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { capitalize } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

interface PageProps {
  params: {
    location: string;
  };
}

export async function generateStaticParams() {
  return STATIC_CITIES.map((city) => ({
    location: city.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  return {
    title: `Fortuner on Rent in ${locationName} | Rent Fortuner @₹4999/Day | TransRentals`,
    description: `Rent Toyota Fortuner without driver in ${locationName}. Self-drive Fortuner rental for VIP travel, weddings. 4x2, 4x4, Legender variants available.`,
    keywords: [
      `fortuner on rent ${locationName}`,
      `toyota fortuner rental ${locationName}`,
      `rent fortuner without driver ${locationName}`,
      `luxury suv rental ${locationName}`,
    ],
    openGraph: {
      title: `Fortuner on Rent in ${locationName} @₹4999/Day | TransRentals`,
      description: `Self-drive Toyota Fortuner rental in ${locationName}. Premium luxury SUV.`,
      type: 'website',
      url: `https://transrentals.in/fortuner-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/fortuner-on-rent/${locationSlug}`,
    },
  };
}

const fortunerVariants = [
  { name: 'Toyota Fortuner 4x2', price: 4999, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Fortuner 4x2 AT', price: 5499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Fortuner 4x4', price: 5999, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Fortuner 4x4 AT', price: 6499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Fortuner Legender', price: 7499, fuel: 'Diesel', seats: 7 },
];

export default function FortunerOnRentLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-yellow-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/fortuner-on-rent" className="hover:text-yellow-700">Fortuner on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Fortuner Rental in ${locationName}`}
        title="Toyota Fortuner on Rent"
        titleHighlight="Starting @₹4999/Day"
        description={`Rent Toyota Fortuner without driver in ${locationName}. India's most aspirational SUV with commanding presence and premium luxury.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Luxury SUV', color: 'text-yellow-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="amber-50"
      />

      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Fortuner on Rent in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Self-drive Toyota Fortuner. Premium luxury SUV for VIP travel & special occasions.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold text-yellow-400">₹4,999/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">7 Seats</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Engine</p>
              <p className="text-xl font-bold">2.8L Diesel</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Fortuner Variants in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {fortunerVariants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{variant.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">₹{variant.price}</p>
                    <p className="text-xs text-gray-500">/day</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">⛽ {variant.fuel} • 👥 {variant.seats} Seats • 🚙 Premium SUV</p>
                <button className="w-full bg-yellow-500 text-black py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
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
            Other Premium Cars in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/innova-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Innova on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
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
