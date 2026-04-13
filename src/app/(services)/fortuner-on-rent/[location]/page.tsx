import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';

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

  const _seoDb = await resolvePageMeta(`fortuner-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Fortuner on Rent in ${locationName} | Rent Fortuner @₹4999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Toyota Fortuner without driver in ${locationName}. Self-drive Fortuner rental for VIP travel, weddings. 4x2, 4x4, Legender variants available.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
    twitter: {
      card: 'summary_large_image' as const,
      title: `Fortuner on Rent in ${locationName} | TransRentals`,
      description: `Rent Toyota Fortuner without driver in ${locationName} starting @₹3499/day.`,
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

export default async function FortunerOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('fortuner-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="fortuner-on-rent" serviceName="Fortuner on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`fortuner-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Is Toyota Fortuner available for self-drive without a driver?', answer: 'Yes, Toyota Fortuner (4x2 and 4x4) is available for self-drive. A valid LMV licence with minimum 2 years of driving experience is required.' },
    { question: 'What is the daily rent for a Fortuner self-drive?', answer: 'Toyota Fortuner self-drive rental starts from ₹3499/day for 2WD manual and ₹4299/day for 4WD automatic, including insurance.' },
    { question: 'Can I drive the Fortuner to hill stations or off-road?', answer: 'Yes, Fortuner 4x4 is cleared for hill stations and moderate off-road trails. Notify us at booking for route-specific insurance clearance.' },
    { question: 'What is the security deposit for renting a Fortuner?', answer: 'A refundable security deposit of ₹10,000–₹15,000 is collected at pickup and returned within 48 hours of damage-free return.' },
  ];

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

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Toyota Fortuner"
        selfDrivePrice="₹4,999/day"
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
                <p className="text-sm text-emerald-600 font-medium text-center mt-2">Use the chat below to book</p>
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

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="fortuner-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Fortuner on Rent"
        serviceSlug="fortuner-on-rent"
        description={`Rent Toyota Fortuner without driver in ${locationName} starting @₹3499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="fortuner-on-rent"
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
