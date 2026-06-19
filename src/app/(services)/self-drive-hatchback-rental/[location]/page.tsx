import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CarSearchHero } from '@/components/car';
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
    resolvePageMeta(`self-drive-hatchback-rental:${params.location}`),
    getServiceCityContent('self-drive-hatchback-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive Hatchback Rental in ${locationName} | Rent @₹899/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent hatchback without driver in ${locationName}. Swift, i20, Baleno, Tiago available. Most affordable self-drive option.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
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
    twitter: {
      card: 'summary_large_image' as const,
      title: `Self Drive Hatchback Rental in ${locationName} | TransRentals`,
      description: `Rent hatchback without driver in ${locationName} starting @₹699/day. Swift, i20, Baleno available.`,
    },
  };
}


export default async function HatchbackRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-hatchback-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-hatchback-rental" serviceName="Self Drive Hatchback Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-hatchback-rental:${params.location}`),
    getServiceCityContent('self-drive-hatchback-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which hatchback cars are available for self-drive?', answer: 'We offer Maruti Swift, Hyundai i20, Maruti Baleno, Honda Jazz, and Tata Tiago — affordable and fuel-efficient hatchbacks.' },
    { question: 'What is the cheapest self-drive hatchback rental option?', answer: 'Maruti Alto and WagonR start from ₹699/day. Baleno and i20 start from ₹899/day including comprehensive insurance.' },
    { question: 'Is a hatchback suitable for a 4–5 person family trip?', answer: 'Hatchbacks comfortably seat 4 adults. For 5 people with luggage, we recommend upgrading to a sedan or MUV for better comfort.' },
    { question: 'How do I return the self-drive hatchback?', answer: 'Return at any of our city drop points or we can arrange doorstep pickup. Ensure the car is clean, damage-free, and with the same fuel level.' },
  ];

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

      <CarSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
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
              <p className="text-xl font-bold">₹799</p>
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

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="self-drive-hatchback-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Self Drive Hatchback Rental"
        serviceSlug="self-drive-hatchback-rental"
        description={`Rent hatchback without driver in ${locationName} starting @₹699/day. Swift, i20, Baleno available.`}
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
        currentSlug="self-drive-hatchback-rental"
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
