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

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where self-drive-car-rentals is available
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
  const locationSlug = params.location;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-sedan-rental:${params.location}`),
    getServiceCityContent('self-drive-sedan-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive Sedan Rental in ${locationName} | Rent Sedan @₹1299/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent sedan without driver in ${locationName}. Honda City, Verna, Ciaz, Dzire available. Self-drive sedan for business & outstation travel.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
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
    twitter: {
      card: 'summary_large_image' as const,
      title: `Self Drive Sedan Rental in ${locationName} | TransRentals`,
      description: `Rent sedan without driver in ${locationName} starting @₹999/day. Honda City, Verna, Ciaz available.`,
    },
  };
}


export default async function SedanRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-sedan-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-sedan-rental" serviceName="Self Drive Sedan Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-sedan-rental:${params.location}`),
    getServiceCityContent('self-drive-sedan-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which sedan models are available for self-drive rental?', answer: 'We offer Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia — comfortable sedans perfect for business and family travel.' },
    { question: 'What is the daily rate for a self-drive sedan?', answer: 'Self-drive sedan rental starts at ₹999/day for Maruti Dzire and goes up to ₹1899/day for premium sedans like Skoda Slavia.' },
    { question: 'Is fuel included in the self-drive sedan package?', answer: 'Fuel is not included. You receive the car with a full tank and must return it with the same fuel level to avoid surcharges.' },
    { question: 'Can I take the self-drive sedan for an outstation trip?', answer: 'Yes, outstation travel is permitted. Inform us of your plan at booking time to ensure correct permit and insurance coverage.' },
  ];

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

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Self Drive Sedan"
        selfDrivePrice="₹1,299"
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
              <p className="text-xl font-bold">₹1,299</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Available</p>
              <p className="text-xl font-bold">6+ Models</p>
            </div>
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

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="self-drive-sedan-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Self Drive Sedan Rental"
        serviceSlug="self-drive-sedan-rental"
        description={`Rent sedan without driver in ${locationName} starting @₹999/day. Honda City, Verna, Ciaz available.`}
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
        currentSlug="self-drive-sedan-rental"
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
