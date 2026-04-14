import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';

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

  const _seoDb = await resolvePageMeta(`self-drive-suv-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Self Drive SUV Rental in ${locationName} | Rent SUV @₹1999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent SUV without driver in ${locationName}. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV for road trips & family travel.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `self drive suv rental ${locationName}`,
      `suv on rent ${locationName}`,
      `rent suv without driver ${locationName}`,
      `creta on rent ${locationName}`,
      `suv rental ${locationName}`,
    ],
    openGraph: {
      title: `Self Drive SUV Rental in ${locationName} @₹1999/Day | TransRentals`,
      description: `Rent SUVs without driver in ${locationName}. Creta, Seltos, Fortuner available.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-suv-rental/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-suv-rental/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Self Drive SUV Rental in ${locationName} | TransRentals`,
      description: `Rent SUV without driver in ${locationName} starting @₹1499/day. Creta, Seltos, Fortuner available.`,
    },
  };
}

const suvModels = [
  { name: 'Hyundai Creta', price: 1999, seats: 5, fuel: 'Petrol/Diesel' },
  { name: 'Kia Seltos', price: 1999, seats: 5, fuel: 'Petrol/Diesel' },
  { name: 'Mahindra Scorpio N', price: 2299, seats: 7, fuel: 'Diesel' },
  { name: 'Mahindra XUV700', price: 2499, seats: 7, fuel: 'Petrol/Diesel' },
  { name: 'Toyota Fortuner', price: 3999, seats: 7, fuel: 'Diesel' },
  { name: 'Tata Harrier', price: 2199, seats: 5, fuel: 'Diesel' },
];

export default async function SUVRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-suv-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-suv-rental" serviceName="Self Drive SUV Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`self-drive-suv-rental:${params.location}`);

  const pageFaqs = [
    { question: 'Which SUVs are available for self-drive rental?', answer: 'We offer Hyundai Creta, Kia Seltos, MG Hector, XUV700, and Fortuner — top SUVs with automatic and manual transmission options.' },
    { question: 'Do I need a special licence to drive a self-drive SUV?', answer: 'A standard LMV car licence is sufficient for all SUVs except commercial-category vehicles. Minimum 1 year of licence validity required.' },
    { question: 'Is unlimited km allowed in self-drive SUV rental?', answer: 'We offer both limited and unlimited km packages. Unlimited km packages start from ₹2499/day for a 3-day minimum booking.' },
    { question: 'What happens if the SUV meets with an accident?', answer: 'All SUVs are insured. Comprehensive damage waiver is available as an add-on. A damage liability applies without the waiver.' },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/self-drive-suv-rental" className="hover:text-blue-700">Self Drive SUV Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Self Drive SUV"
        selfDrivePrice="₹1,999/day"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-blue-900 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Self Drive SUV Rental in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Drive yourself in a powerful SUV. Perfect for {locationName} roads and beyond.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,999/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Available</p>
              <p className="text-xl font-bold">6+ SUV Models</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">5-7 Seater</p>
            </div>
          </div>
        </div>
      </section>

      {/* SUV Models */}
      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            SUVs Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {suvModels.map((suv) => (
              <div key={suv.name} className="bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-xl transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{suv.name}</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹{suv.price}</p>
                      <p className="text-xs text-gray-500">/day</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <span>👥 {suv.seats} Seats</span>
                    <span>⛽ {suv.fuel}</span>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Rent SUV in {locationName}?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🛣️', title: 'Road Trips', desc: `Explore around ${locationName}` },
              { icon: '👨‍👩‍👧‍👦', title: 'Family Travel', desc: 'Spacious & comfortable' },
              { icon: '🧳', title: 'Luggage Space', desc: 'Large boot capacity' },
              { icon: '🏔️', title: 'Any Terrain', desc: 'Highways, hills, off-road' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-4 rounded-lg text-center shadow">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Options */}
      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">
            Other Self Drive Options in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href={`/self-drive-sedan-rental/${params.location}`} className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Sedan Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,299/day</p>
            </Link>
            <Link href={`/self-drive-hatchback-rental/${params.location}`} className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Hatchback Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹899/day</p>
            </Link>
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Self Drive Cars</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="self-drive-suv-rental"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Self Drive SUV Rental"
        serviceSlug="self-drive-suv-rental"
        description={`Rent SUV without driver in ${locationName} starting @₹1499/day. Creta, Seltos, Fortuner available.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="self-drive-suv-rental"
        siblings={[
          { slug: 'hourly-car-rental', name: 'Hourly Car Rental' },
          { slug: 'self-drive-suv-rental', name: 'Self Drive SUV' },
          { slug: 'self-drive-sedan-rental', name: 'Self Drive Sedan' },
          { slug: 'self-drive-hatchback-rental', name: 'Self Drive Hatchback' },
          { slug: 'swift-on-rent', name: 'Swift on Rent' },
          { slug: 'creta-on-rent', name: 'Creta on Rent' },
          { slug: 'innova-on-rent', name: 'Innova on Rent' },
          { slug: 'fortuner-on-rent', name: 'Fortuner on Rent' },
          { slug: 'seltos-on-rent', name: 'Seltos on Rent' },
          { slug: 'xuv700-on-rent', name: 'XUV700 on Rent' },
          { slug: 'scorpio-on-rent', name: 'Scorpio on Rent' },
        ]}
      />
    </>
  );
}
