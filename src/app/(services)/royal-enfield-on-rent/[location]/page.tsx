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
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

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

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  const _seoDb = await resolvePageMeta(`royal-enfield-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Royal Enfield on Rent in ${locationName} | Bullet Rental @₹899/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Royal Enfield bikes in ${locationName}. Classic 350, Himalayan, Meteor, Hunter available. Perfect for road trips & touring. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `royal enfield on rent in ${locationName}`,
      `bullet rental ${locationName}`,
      `${locationName} royal enfield rental`,
      `rent bullet in ${locationName}`,
      `classic 350 on rent ${locationName}`,
    ],
    openGraph: {
      title: `Royal Enfield on Rent in ${locationName} @₹899/Day | TransRentals`,
      description: `Rent Royal Enfield bikes in ${locationName} starting @₹899/day. Perfect for road trips.`,
      type: 'website',
      url: `https://transrentals.in/royal-enfield-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/royal-enfield-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Royal Enfield Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Royal Enfield on Rent in ${locationName} | TransRentals`,
      description: `Rent Royal Enfield bikes in ${locationName} starting @₹899/day.`,
      images: ['https://transrentals.in/images/og/royal-enfield-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/royal-enfield-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Schema data
const schemaFaqs = [
  { question: 'Which Royal Enfield models are available for rent?', answer: 'We have Classic 350, Himalayan, Meteor 350, Hunter 350, Interceptor 650, and Continental GT 650 available for rent.' },
  { question: 'What is the security deposit for Royal Enfield rental?', answer: 'Security deposit ranges from ₹5,000 to ₹15,000 depending on the model. This is fully refundable upon return.' },
  { question: 'Can I take Royal Enfield for long trips?', answer: 'Yes, our Royal Enfield bikes are perfect for long trips. We also offer one-way drops for Ladakh, Spiti, and Rajasthan trips.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, we provide 24/7 roadside assistance across India. For remote areas, we have tie-ups with local mechanics.' },
];

const schemaVehicles = [
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 899 },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 1099 },
  { name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', price: 999 },
  { name: 'Royal Enfield Hunter 350', brand: 'Royal Enfield', price: 899 },
];

export default async function RoyalEnfieldLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('royal-enfield-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="royal-enfield-on-rent" serviceName="Royal Enfield on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Royal Enfield on Rent',
      slug: 'royal-enfield-on-rent',
    },
    vehicles: [
      {
        id: 1,
        name: 'Royal Enfield Classic 350',
        brand: 'Cruiser',
        image: '/images/bikes/classic-350.jpg',
        price: 899,
        rating: 4.9,
      },
      {
        id: 2,
        name: 'Royal Enfield Himalayan',
        brand: 'Adventure',
        image: '/images/bikes/himalayan.jpg',
        price: 1099,
        rating: 4.8,
      },
      {
        id: 3,
        name: 'Royal Enfield Meteor 350',
        brand: 'Cruiser',
        image: '/images/bikes/meteor-350.jpg',
        price: 999,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'Royal Enfield Hunter 350',
        brand: 'Roadster',
        image: '/images/bikes/hunter-350.jpg',
        price: 899,
        rating: 4.7,
      },
    ],
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`royal-enfield-on-rent:${params.location}`),
    getServiceCityContent('royal-enfield-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which Royal Enfield models are available on rent?', answer: 'We offer Classic 350, Bullet 350, Meteor 350, and Himalayan — all well-maintained with valid insurance and permits.' },
    { question: 'What documents are required to rent a Royal Enfield?', answer: 'You need a valid two-wheeler driving licence and one government-issued photo ID (Aadhaar, passport, or voter card).' },
    { question: 'Is a security deposit required for Royal Enfield rental?', answer: 'Yes, a refundable security deposit of ₹2000–₹5000 is collected at the time of delivery, returned on safe return of the bike.' },
    { question: 'Can I take the Royal Enfield on a highway or outstation trip?', answer: 'Yes, highway and outstation trips are permitted. Inform us in advance so we can ensure the bike is fully serviced and cleared for long-distance.' },
  ];

  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName={`Royal Enfield on Rent in ${locationName}`}
        serviceSlug="royal-enfield-on-rent"
        description={`Rent Royal Enfield bikes in ${locationName}. Classic 350, Himalayan, Meteor, Hunter available. Starting @₹899/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 899, max: 1299 }}
        rating={4.8}
        reviewCount={612}
      />
      <div className="flex flex-col">
      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
      />

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Royal Enfield Bikes in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="royal-enfield-on-rent"
      />

      <FAQSection service="bike-on-rent" location={locationName} customFaqs={pageFaqs} />

      <NearbyLocations
        locationSlug={params.location}
        service="royal-enfield-on-rent"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="royal-enfield-on-rent"
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
