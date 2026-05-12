import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where bike-on-rent is available
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

  const _seoDb = await resolvePageMeta(`ktm-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `KTM on Rent in ${locationName} | Duke & RC Rental @₹999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent KTM bikes in ${locationName}. Duke 200, Duke 390, RC 200, RC 390 available. High performance sports bikes. Book your KTM rental now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `ktm on rent in ${locationName}`,
      `ktm duke rental ${locationName}`,
      `${locationName} ktm rental`,
      `rent ktm in ${locationName}`,
      `duke 390 on rent ${locationName}`,
    ],
    openGraph: {
      title: `KTM on Rent in ${locationName} @₹999/Day | TransRentals`,
      description: `Rent KTM Duke & RC bikes in ${locationName} starting @₹999/day. High performance.`,
      type: 'website',
      url: `https://transrentals.in/ktm-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/ktm-rental.jpg',
          width: 1200,
          height: 630,
          alt: `KTM Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `KTM on Rent in ${locationName} | TransRentals`,
      description: `Rent KTM bikes in ${locationName} starting @₹999/day.`,
      images: ['https://transrentals.in/images/og/ktm-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/ktm-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which KTM models are available for rent?', answer: 'We have KTM Duke 200, Duke 390, RC 200, and RC 390 available for rent.' },
  { question: 'What is the security deposit for KTM rental?', answer: 'Security deposit ranges from ₹10,000 to ₹20,000 depending on the model. This is fully refundable upon return.' },
  { question: 'Do I need a specific license for KTM bikes?', answer: 'You need a valid motorcycle license. For Duke 390/RC 390, we recommend experienced riders due to high performance.' },
  { question: 'Is fuel included in KTM rental?', answer: 'Fuel is not included. KTM bikes give approximately 25-35 km/litre depending on riding style.' },
];

const schemaVehicles = [
  { name: 'KTM Duke 200', brand: 'KTM', price: 999 },
  { name: 'KTM Duke 390', brand: 'KTM', price: 1499 },
  { name: 'KTM RC 200', brand: 'KTM', price: 1099 },
  { name: 'KTM RC 390', brand: 'KTM', price: 1599 },
];

export default async function KTMLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('ktm-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="ktm-on-rent" serviceName="KTM on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'KTM Duke 200',
        image: '/images/bikes/ktm-duke-200.jpg',
        price: 999,
        rating: 4.9,
      },
      {
        id: 2,
        name: 'KTM Duke 390',
        image: '/images/bikes/ktm-duke-390.jpg',
        price: 1499,
        rating: 4.9,
      },
      {
        id: 3,
        name: 'KTM RC 200',
        image: '/images/bikes/ktm-rc-200.jpg',
        price: 1099,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'KTM RC 390',
        image: '/images/bikes/ktm-rc-390.jpg',
        price: 1599,
        rating: 4.9,
      },
    ],
  };

  const seoData = await resolvePageMeta(`ktm-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Which KTM bikes are available on rent?', answer: 'We offer KTM Duke 200, Duke 390, RC 200, and RC 390 — all premium performance bikes with regular servicing.' },
    { question: 'What is the minimum age to rent a KTM bike?', answer: 'You must be at least 21 years old with a valid motorcycle licence to rent a KTM Duke or RC series.' },
    { question: 'Is riding gear included with KTM rental?', answer: 'A certified helmet is provided. We recommend bringing your own gloves and jacket for best safety on performance bikes.' },
    { question: 'Can I rent a KTM for a track day or hill station trip?', answer: 'Yes, KTM bikes are available for both track days and adventure road trips. Inform us in advance for route-specific preparation.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`KTM on Rent in ${locationName}`}
        serviceSlug="ktm-on-rent"
        description={`Rent KTM bikes in ${locationName}. Duke 200, Duke 390, RC 200, RC 390 available. Starting @₹999/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 999, max: 1599 }}
        rating={4.9}
        reviewCount={347}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/ktm-on-rent" className="hover:text-primary">KTM on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

        <BikeSearchHero
          city={locationName}
          citySlug={params.location}
          pageHeading={seoData?.pageHeading || undefined}
          pageDescription={seoData?.pageDescription || undefined}
        />

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available KTM Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />

        <PopularRoutes
          location={locationName}
          locationSlug={params.location}
          serviceSlug="ktm-on-rent"
        />

        <FAQSection service="bike-on-rent" location={locationName} customFaqs={pageFaqs} />

        <NearbyLocations
          locationSlug={params.location}
          service="ktm-on-rent"
        />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="ktm-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="ktm-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
          { slug: 'pulsar-on-rent', name: 'Pulsar on Rent' },
          { slug: 'apache-on-rent', name: 'Apache on Rent' },
          { slug: 'splendor-on-rent', name: 'Splendor on Rent' },
          { slug: 'himalayan-on-rent', name: 'Himalayan on Rent' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
          { slug: 'electric-scooter-rental', name: 'Electric Scooter' },
        ]}
      />
      </div>
    </>
  );
}
