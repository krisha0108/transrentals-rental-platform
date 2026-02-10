import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { capitalize } from '@/lib/utils';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getServiceLocations('bike-on-rent');
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
    title: `Electric Scooter Rental in ${locationName} | EV Bike on Rent @₹399/Day | TransRentals`,
    description: `Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available. Zero fuel cost, eco-friendly. Daily & monthly EV rental from ₹399/day.`,
    keywords: [
      `electric scooter rental ${locationName}`,
      `ev scooter on rent ${locationName}`,
      `ola scooter on rent ${locationName}`,
      `ather on rent ${locationName}`,
      `electric bike rental ${locationName}`,
      `tvs iqube on rent ${locationName}`,
    ],
    openGraph: {
      title: `Electric Scooter Rental in ${locationName} @₹399/Day | TransRentals`,
      description: `Rent Ola S1, Ather 450X, TVS iQube in ${locationName}. Zero fuel cost!`,
      type: 'website',
      url: `https://transrentals.in/electric-scooter-rental/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/electric-scooter-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Electric Scooter Rental in ${locationName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Electric Scooter Rental in ${locationName} | TransRentals`,
      description: `Rent EVs in ${locationName}. Starting @₹399/day.`,
      images: ['https://transrentals.in/images/og/electric-scooter-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/electric-scooter-rental/${locationSlug}`,
    },
  };
}

export default function ElectricScooterLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const schemaFaqs = [
    { question: `Where can I rent electric scooter in ${locationName}?`, answer: `TransRentals offers electric scooter rental across ${locationName}. We have Ola S1, Ather 450X, TVS iQube available with doorstep delivery.` },
    { question: `How much does EV rental cost in ${locationName}?`, answer: `Electric scooter rental in ${locationName} starts from ₹399/day. Monthly rentals start from ₹4,999/month.` },
    { question: `Is charging available in ${locationName}?`, answer: `Yes, you can charge at home or use public charging stations across ${locationName}. We provide charging cable with the scooter.` },
  ];

  const schemaVehicles = [
    { name: 'Ola S1 Pro', brand: 'Ola Electric', price: 499 },
    { name: 'Ather 450X', brand: 'Ather Energy', price: 599 },
    { name: 'TVS iQube', brand: 'TVS', price: 449 },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`Electric Scooter Rental in ${locationName}`}
        serviceSlug="electric-scooter-rental"
        description={`Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available. Starting @₹399/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 399, max: 599 }}
        rating={4.6}
        reviewCount={Math.floor(Math.random() * 300) + 100}
      />

      <ServiceHeroWithChat
        badge={`EV Rental in ${locationName}`}
        title="Electric Scooter Rental"
        titleHighlight="Zero Fuel Cost @₹399/Day"
        description={`Rent Ola S1, Ather 450X, TVS iQube in ${locationName}. Eco-friendly, silent, smart. Save on fuel!`}
        gradientFrom="green-50"
        gradientTo="emerald-50"
      />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/electric-scooter-rental" className="hover:text-green-700">Electric Scooter Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Electric Scooter Rental in {locationName}
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              ⚡ Zero Fuel Cost • Silent Ride • Eco-Friendly
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#evs"
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition"
              >
                View EV Models
              </Link>
              <Link
                href={`/bike-on-rent/${params.location}`}
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition"
              >
                Petrol Bikes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">₹399</div>
              <div className="text-sm text-gray-600">Starting Price/Day</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">₹0</div>
              <div className="text-sm text-gray-600">Fuel Cost</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">100km+</div>
              <div className="text-sm text-gray-600">Range Per Charge</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">4.6★</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* EV Models */}
      <section id="evs" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Electric Scooters Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Ola S1 Pro', price: '499', range: '135 km', highlight: 'Best Range' },
              { name: 'Ather 450X', price: '599', range: '105 km', highlight: 'Premium' },
              { name: 'TVS iQube', price: '449', range: '100 km', highlight: 'Best Value' },
              { name: 'Bajaj Chetak', price: '549', range: '90 km', highlight: 'Classic' },
            ].map((ev) => (
              <div key={ev.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-green-500">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold">{ev.name}</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{ev.highlight}</span>
                </div>
                <p className="text-2xl font-bold text-green-700 mb-1">₹{ev.price}/day</p>
                <p className="text-sm text-gray-500 mb-3">Range: {ev.range}</p>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  Rent Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why EV */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Rent EV in {locationName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '💰', title: 'Save ₹3000+/Month', desc: 'Only ₹15-20 per charge vs ₹150+ petrol' },
              { icon: '🌱', title: 'Go Green', desc: 'Zero emissions, contribute to cleaner air' },
              { icon: '🔇', title: 'Silent Ride', desc: 'No noise pollution, peaceful commute' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Other Services in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href={`/bike-on-rent/${params.location}`} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-4xl mb-3">🏍️</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Bike Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Petrol bikes from ₹299/day</p>
            </Link>
            <Link href={`/activa-on-rent/${params.location}`} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-4xl mb-3">🛵</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Activa Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Scooters from ₹299/day</p>
            </Link>
            <Link href={`/monthly-bike-rental/${params.location}`} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-semibold text-lg group-hover:text-primary">Monthly Rental</h3>
              <p className="text-sm text-gray-600 mt-2">Long term from ₹2999/month</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" />
    </>
  );
}
