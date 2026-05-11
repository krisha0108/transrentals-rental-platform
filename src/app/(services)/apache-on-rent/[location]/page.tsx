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
import { getServiceLocations } from '@/lib/services/service-locations';;
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
  return getServiceLocations('bike-on-rent');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  const _seoDb = await resolvePageMeta(`apache-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Apache on Rent in ${locationName} | TVS Apache Rental @₹499/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent TVS Apache bikes in ${locationName}. Apache RTR 160, RTR 180, RTR 200 4V, RR 310 available. Racing DNA bikes. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `apache on rent in ${locationName}`,
      `tvs apache rental ${locationName}`,
      `${locationName} apache rental`,
      `rent apache in ${locationName}`,
      `apache rtr on rent ${locationName}`,
    ],
    openGraph: {
      title: `Apache on Rent in ${locationName} @₹499/Day | TransRentals`,
      description: `Rent TVS Apache bikes in ${locationName} starting @₹499/day. Racing DNA.`,
      type: 'website',
      url: `https://transrentals.in/apache-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/apache-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Apache Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Apache on Rent in ${locationName} | TransRentals`,
      description: `Rent Apache bikes in ${locationName} starting @₹499/day.`,
      images: ['https://transrentals.in/images/og/apache-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/apache-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which Apache models are available for rent?', answer: 'We have Apache RTR 160, RTR 180, RTR 200 4V, and Apache RR 310 available for rent.' },
  { question: 'What is the security deposit for Apache rental?', answer: 'Security deposit ranges from ₹3,000 to ₹15,000 depending on the model. This is fully refundable upon return.' },
  { question: 'Is Apache good for long rides?', answer: 'Apache RTR 200 4V and RR 310 are excellent for long rides with their comfortable riding position and performance.' },
  { question: 'What is the mileage of Apache bikes?', answer: 'Apache bikes give approximately 40-50 km/litre depending on the model and riding conditions.' },
];

const schemaVehicles = [
  { name: 'TVS Apache RTR 160', brand: 'TVS', price: 499 },
  { name: 'TVS Apache RTR 180', brand: 'TVS', price: 549 },
  { name: 'TVS Apache RTR 200 4V', brand: 'TVS', price: 699 },
  { name: 'TVS Apache RR 310', brand: 'TVS', price: 1299 },
];

export default async function ApacheLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('apache-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="apache-on-rent" serviceName="Apache on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'TVS Apache RTR 160',
        image: '/images/bikes/apache-rtr-160.jpg',
        price: 499,
        rating: 4.7,
      },
      {
        id: 2,
        name: 'TVS Apache RTR 180',
        image: '/images/bikes/apache-rtr-180.jpg',
        price: 549,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'TVS Apache RTR 200 4V',
        image: '/images/bikes/apache-rtr-200.jpg',
        price: 699,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'TVS Apache RR 310',
        image: '/images/bikes/apache-rr-310.jpg',
        price: 1299,
        rating: 4.9,
      },
    ],
  };

  const seoData = await resolvePageMeta(`apache-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Which Apache models are available for rent?', answer: 'We offer TVS Apache RTR 160, RTR 160 4V, RTR 200 4V — sporty commuters and performance bikes.' },
    { question: 'What is the Apache rental rate per day?', answer: 'Apache RTR 160 starts at ₹499/day; Apache RTR 200 4V starts at ₹699/day, inclusive of helmet and standard permit.' },
    { question: 'Is a security deposit mandatory for Apache rental?', answer: 'Yes, a refundable security deposit of ₹1500–₹3000 is held at the time of pickup and fully returned upon safe return.' },
    { question: 'Can I use the Apache bike for daily office commute?', answer: 'Absolutely — Apache bikes are ideal for city commuting. Unlimited km packages are available for monthly rentals.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`Apache on Rent in ${locationName}`}
        serviceSlug="apache-on-rent"
        description={`Rent TVS Apache bikes in ${locationName}. RTR 160, RTR 180, RTR 200 4V, RR 310 available. Starting @₹499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 499, max: 1299 }}
        rating={4.8}
        reviewCount={384}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/apache-on-rent" className="hover:text-primary">Apache on Rent</a>
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
          title={`Available Apache Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />

        <PopularRoutes
          location={locationName}
          locationSlug={params.location}
          serviceSlug="apache-on-rent"
        />

        <FAQSection service="bike-on-rent" location={locationName} customFaqs={pageFaqs} />

        <NearbyLocations
          locationSlug={params.location}
          service="apache-on-rent"
        />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="apache-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="apache-on-rent"
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
