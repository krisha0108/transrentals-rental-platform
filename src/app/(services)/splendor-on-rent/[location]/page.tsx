import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { CityContentSection } from '@/components/location/CityContentSection';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`splendor-on-rent:${params.location}`),
    getServiceCityContent('splendor-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Splendor on Rent in ${locationName} | Hero Splendor Rental @₹299/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Hero Splendor bikes in ${locationName}. Splendor Plus, iSmart, Super Splendor available. Best mileage bike. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `splendor on rent in ${locationName}`,
      `hero splendor rental ${locationName}`,
      `${locationName} splendor rental`,
      `rent splendor in ${locationName}`,
      `splendor plus on rent ${locationName}`,
    ],
    openGraph: {
      title: `Splendor on Rent in ${locationName} @₹299/Day | TransRentals`,
      description: `Rent Hero Splendor bikes in ${locationName} starting @₹299/day. Best mileage.`,
      type: 'website',
      url: `https://transrentals.in/splendor-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/splendor-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Splendor Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Splendor on Rent in ${locationName} | TransRentals`,
      description: `Rent Splendor bikes in ${locationName} starting @₹299/day.`,
      images: ['https://transrentals.in/images/og/splendor-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/splendor-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which Splendor models are available for rent?', answer: 'We have Splendor Plus, Splendor iSmart, Super Splendor, and HF Deluxe available for rent.' },
  { question: 'What is the security deposit for Splendor rental?', answer: 'Security deposit is ₹2,000-3,000 depending on the model. This is fully refundable upon return.' },
  { question: 'What is the mileage of Splendor bikes?', answer: 'Hero Splendor gives approximately 65-75 km/litre - the best mileage in its class.' },
  { question: 'Can I rent Splendor for delivery work?', answer: 'Yes, Splendor is perfect for delivery work. We offer special monthly plans for delivery executives.' },
];

const schemaVehicles = [
  { name: 'Hero Splendor Plus', brand: 'Hero', price: 299, image: 'https://transrentals.in/images/fleet/hero-splendor-plus.jpg', description: "Rent Hero Splendor Plus — India's highest-selling commuter bike with 97.2cc air-cooled engine, 65+ kmpl mileage, alloy wheels, and ultra-reliable performance. Lightweight at 112 kg with comfortable seating. Ideal for daily office commutes, delivery work, and city errands. Helmet and insurance included. Book at TransRentals from ₹299/day." },
  { name: 'Hero Splendor iSmart', brand: 'Hero', price: 349, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent Hero Splendor iSmart — advanced commuter bike with i3S idle start-stop technology that automatically switches off the engine at traffic lights for 10-15% extra fuel savings. 97.2cc engine with 70+ kmpl mileage — the most fuel-efficient bike in its segment. Daily rental from ₹349/day with doorstep delivery.' },
  { name: 'Hero Super Splendor', brand: 'Hero', price: 399, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent Hero Super Splendor — premium 125cc commuter with 10.7 PS power, 60+ kmpl mileage, front disc brake option, digital speedometer, and side stand engine cut-off. More power and highway confidence than standard Splendor. Perfect for both city and short highway rides. Available from ₹399/day with helmet.' },
  { name: 'Hero HF Deluxe', brand: 'Hero', price: 279, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent Hero HF Deluxe — budget-friendly 97.2cc commuter with 65+ kmpl mileage, self-start, alloy wheels, and tubeless tires. Extremely reliable and easy to maintain with simple controls ideal for beginners. The most affordable bike rental for daily commuting needs. Starting from ₹279/day at TransRentals.' },
];

export default async function SplendorLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('splendor-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="splendor-on-rent" serviceName="Splendor on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'Hero Splendor Plus',
        image: '/images/bikes/splendor-plus.jpg',
        price: 299,
        rating: 4.7,
      },
      {
        id: 2,
        name: 'Hero Splendor iSmart',
        image: '/images/bikes/splendor-ismart.jpg',
        price: 349,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'Hero Super Splendor',
        image: '/images/bikes/super-splendor.jpg',
        price: 399,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'Hero HF Deluxe',
        image: '/images/bikes/hf-deluxe.jpg',
        price: 279,
        rating: 4.6,
      },
    ],
  };

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`splendor-on-rent:${params.location}`),
    getServiceCityContent('splendor-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is Splendor available as a daily rental bike?', answer: 'Yes, Hero Splendor Plus and Splendor+ i3S are available for daily rental — India\'s most fuel-efficient commuter bike.' },
    { question: 'What mileage does the rental Splendor give?', answer: 'The Hero Splendor delivers approximately 60–70 km/l under normal city conditions, making it the most economical rental option.' },
    { question: 'Can I rent a Splendor for 1 week or 1 month?', answer: 'Yes, we offer weekly and monthly packages with discounted rates. Monthly rentals start from ₹3999 for Hero Splendor.' },
    { question: 'Does the Splendor rental include fuel?', answer: 'The bike is provided with a full tank. You are responsible for fuel during the rental period and must return with the same level.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`Splendor on Rent in ${locationName}`}
        serviceSlug="splendor-on-rent"
        description={`Rent Hero Splendor bikes in ${locationName}. Splendor Plus, iSmart, Super Splendor available. Starting @₹299/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 279, max: 399 }}
        rating={4.7}
        reviewCount={843}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/splendor-on-rent" className="hover:text-primary">Splendor on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

        <BikeSearchHero
          city={locationName}
          citySlug={params.location}
          pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
          pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        />

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available Splendor Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />


        <NearbyLocations
          locationSlug={params.location}
          service="splendor-on-rent"
        />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="splendor-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="splendor-on-rent"
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
