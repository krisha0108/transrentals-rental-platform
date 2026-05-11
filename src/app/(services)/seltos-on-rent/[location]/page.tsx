import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

interface PageProps { params: { location: string }; }

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
  const _seoDb = await resolvePageMeta(`seltos-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Seltos on Rent in ${locationName} | @₹1899/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Kia Seltos without driver in ${locationName}. Self-drive Seltos with connected car features.`,
    alternates: { canonical: `https://transrentals.in/seltos-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Seltos on Rent in ${locationName} | TransRentals`,
      description: `Rent Kia Seltos without driver in ${locationName} starting @₹1499/day.`,
    },
  };
}

export default async function SeltosLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('seltos-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="seltos-on-rent" serviceName="Seltos on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`seltos-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Which Kia Seltos variants are available for self-drive?', answer: 'We offer Kia Seltos HTE, HTK, HTX, and HTX+ in both petrol manual and petrol DCT automatic variants.' },
    { question: 'What is the daily rate for renting a Kia Seltos?', answer: 'Kia Seltos self-drive rental starts from ₹1499/day for manual and ₹1799/day for automatic, with 250 km included.' },
    { question: 'Is the Seltos suitable for long highway drives?', answer: 'Yes, Seltos is excellent for highway driving with its 1.5L petrol or 1.4 turbo GDi engine. Expect 14–17 km/l on highway.' },
    { question: 'What is the fuel type of the rental Seltos?', answer: 'We provide Kia Seltos in petrol variant for self-drive. Diesel variants may be available at select locations — check at booking.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/seltos-on-rent" className="hover:text-red-700">Seltos on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Kia Seltos"
        selfDrivePrice="₹1,899"
      />

      <section className="bg-gradient-to-br from-red-600 to-orange-600 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Seltos on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,899</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Type</p>
              <p className="text-xl font-bold">Compact SUV</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other SUVs in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Creta</h3><p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/xuv700-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">XUV700</h3><p className="text-sm text-gray-600 mt-2">From ₹2,999/day</p>
            </Link>
            <Link href={`/scorpio-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Scorpio</h3><p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
            </Link>
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All SUVs</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="seltos-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Seltos on Rent"
        serviceSlug="seltos-on-rent"
        description={`Rent Kia Seltos without driver in ${locationName} starting @₹1499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="seltos-on-rent"
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
