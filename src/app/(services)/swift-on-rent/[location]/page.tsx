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

interface PageProps {
  params: {
    location: string;
  };
}

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
  const locationSlug = params.location;

  const _seoDb = await resolvePageMeta(`swift-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Swift on Rent in ${locationName} | Rent Swift @₹899/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Maruti Swift without driver in ${locationName}. Self-drive Swift rental for city commute. Swift LXi, VXi, ZXi, CNG available.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `swift on rent ${locationName}`,
      `maruti swift rental ${locationName}`,
      `rent swift without driver ${locationName}`,
      `swift self drive ${locationName}`,
    ],
    openGraph: {
      title: `Swift on Rent in ${locationName} @₹899/Day | TransRentals`,
      description: `Self-drive Maruti Swift rental in ${locationName}. Best rates guaranteed.`,
      type: 'website',
      url: `https://transrentals.in/swift-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/swift-on-rent/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Swift on Rent in ${locationName} | TransRentals`,
      description: `Rent Maruti Swift without driver in ${locationName} starting @₹899/day.`,
    },
  };
}


export default async function SwiftOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('swift-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="swift-on-rent" serviceName="Swift on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`swift-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Is Maruti Swift available as automatic for self-drive?', answer: 'Yes, both manual and AMT (automatic) variants of Maruti Swift are available — choose based on your driving preference.' },
    { question: 'What is the fuel type for the rental Swift?', answer: 'We offer Maruti Swift in Petrol and CNG variants. CNG is more economical for city driving; petrol is ideal for highway trips.' },
    { question: 'Can I rent a Swift for just 1 day?', answer: 'Yes, single-day rentals are available. Minimum booking is 12 hours with 120 km included. Additional km at ₹12/km.' },
    { question: 'What documents are needed to rent a Maruti Swift?', answer: 'You need a valid driving licence (LMV category), government-issued photo ID, and a security deposit of ₹3000–₹5000.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/swift-on-rent" className="hover:text-red-700">Swift on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Maruti Swift"
        selfDrivePrice="₹899"
      />

      <section className="bg-gradient-to-br from-red-600 to-orange-600 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Swift on Rent in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Self-drive Maruti Swift rental. Sporty, fuel-efficient, easy to drive.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹899</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Mileage</p>
              <p className="text-xl font-bold">22 km/l</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Variants</p>
              <p className="text-xl font-bold">5 Options</p>
            </div>
          </div>
        </div>
      </section>


      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">
            Other Cars in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/self-drive-hatchback-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Hatchbacks</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹799/day</p>
            </Link>
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Creta on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/self-drive-sedan-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Sedan Rental</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹1,299/day</p>
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
        serviceSlug="swift-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Swift on Rent"
        serviceSlug="swift-on-rent"
        description={`Rent Maruti Swift without driver in ${locationName} starting @₹899/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="swift-on-rent"
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
