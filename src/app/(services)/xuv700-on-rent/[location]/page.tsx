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
import { formatPriceHighlight } from '@/lib/utils';
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
  const _seoDb = await resolvePageMeta(`xuv700-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || formatPriceHighlight(`XUV700 on Rent in ${locationName} | @₹2999/Day | TransRentals`),
    description: _seoDb?.metaDescription || formatPriceHighlight(`Rent Mahindra XUV700 without driver in ${locationName}. India's safest SUV with ADAS.`),
    alternates: { canonical: `https://transrentals.in/xuv700-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `XUV700 on Rent in ${locationName} | TransRentals`,
      description: `Rent Mahindra XUV700 without driver in ${locationName} starting @₹1999/day.`,
    },
  };
}

export default async function XUV700LocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('xuv700-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="xuv700-on-rent" serviceName="XUV700 on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`xuv700-on-rent:${params.location}`),
    getServiceCityContent('xuv700-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is Mahindra XUV700 available for self-drive without a chauffeur?', answer: 'Yes, Mahindra XUV700 AX5 and AX7 are available for self-drive with ADAS features and panoramic sunroof.' },
    { question: 'What is the daily rent for XUV700 self-drive?', answer: 'XUV700 self-drive rental starts from ₹1999/day for petrol and ₹2299/day for diesel, including insurance and 250 km limit.' },
    { question: 'Does the XUV700 rental include ADAS features?', answer: 'Yes, the rental XUV700 includes ADAS (auto emergency braking, lane keep assist) — all systems are active and tested before delivery.' },
    { question: 'Can I rent XUV700 for a 7-seater family trip?', answer: 'Absolutely — XUV700 is a true 7-seater SUV with 3 rows. Ideal for family vacations and long-distance road trips.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/xuv700-on-rent" className="hover:text-red-700">XUV700 on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Mahindra XUV700"
        selfDrivePrice="₹2,999"
      />

      <section className="bg-gradient-to-br from-red-700 to-rose-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">XUV700 on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹2,999</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Safety</p>
              <p className="text-xl font-bold">5-Star GNCAP</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other SUVs in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/scorpio-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Scorpio</h3><p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
            </Link>
            <Link href={`/fortuner-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Fortuner</h3><p className="text-sm text-gray-600 mt-2">From ₹4,999/day</p>
            </Link>
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Creta</h3><p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
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
              serviceSlug="xuv700-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="XUV700 on Rent"
        serviceSlug="xuv700-on-rent"
        description={`Rent Mahindra XUV700 without driver in ${locationName} starting @₹1999/day.`}
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
        currentSlug="xuv700-on-rent"
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
