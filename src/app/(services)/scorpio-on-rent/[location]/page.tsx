import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const _seoDb = await resolvePageMeta(`scorpio-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Scorpio on Rent in ${locationName} | @₹2499/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Mahindra Scorpio without driver in ${locationName}. Rugged SUV for adventure & outstation.`,
    alternates: { canonical: `https://transrentals.in/scorpio-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Scorpio on Rent in ${locationName} | TransRentals`,
      description: `Rent Mahindra Scorpio without driver in ${locationName} starting @₹1499/day.`,
    },
  };
}

export default async function ScorpioLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('scorpio-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="scorpio-on-rent" serviceName="Scorpio on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`scorpio-on-rent:${params.location}`),
    getServiceCityContent('scorpio-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which Scorpio model is available for self-drive rental?', answer: 'We offer Mahindra Scorpio N (2022+) and Scorpio Classic — both available in diesel manual variants with 4WD options.' },
    { question: 'What is the rental price for Mahindra Scorpio per day?', answer: 'Scorpio Classic starts from ₹1499/day; Scorpio N starts from ₹1799/day. 250 km included per day in all packages.' },
    { question: 'Is Scorpio 4WD available for self-drive on hill roads?', answer: 'Yes, Scorpio N Z8 4WD variant is available and cleared for hill stations and rough terrain with prior route intimation.' },
    { question: 'How many people can travel in the rental Scorpio?', answer: 'Scorpio N and Classic seat up to 7 passengers. All three rows are functional for full-family group travel.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/scorpio-on-rent" className="hover:text-amber-700">Scorpio on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Mahindra Scorpio"
        selfDrivePrice="₹2,499"
      />

      <section className="bg-gradient-to-br from-amber-700 to-orange-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Scorpio on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹2,499</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Type</p>
              <p className="text-xl font-bold">Rugged SUV</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other SUVs in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/xuv700-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">XUV700</h3><p className="text-sm text-gray-600 mt-2">From ₹2,999</p>
            </Link>
            <Link href={`/fortuner-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Fortuner</h3><p className="text-sm text-gray-600 mt-2">From ₹4,999</p>
            </Link>
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Creta</h3><p className="text-sm text-gray-600 mt-2">From ₹1,999</p>
            </Link>
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All SUVs</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="scorpio-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Scorpio on Rent"
        serviceSlug="scorpio-on-rent"
        description={`Rent Mahindra Scorpio without driver in ${locationName} starting @₹1499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="scorpio-on-rent"
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
