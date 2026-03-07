import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

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

  const _seoDb = await resolvePageMeta(`splendor-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Splendor on Rent in ${locationName} | Hero Splendor Rental @₹299/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Hero Splendor bikes in ${locationName}. Splendor Plus, iSmart, Super Splendor available. Best mileage bike. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
  { name: 'Hero Splendor Plus', brand: 'Hero', price: 299 },
  { name: 'Hero Splendor iSmart', brand: 'Hero', price: 349 },
  { name: 'Hero Super Splendor', brand: 'Hero', price: 399 },
  { name: 'Hero HF Deluxe', brand: 'Hero', price: 279 },
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

        <ServiceHeroWithChat
          badge={`Splendor Rental in ${locationName}`}
          title="Hero Splendor on Rent"
          titleHighlight="Starting @₹299/day"
          description={`Rent Hero Splendor bikes in ${locationName}. India's most trusted bike with best-in-class mileage. Perfect for daily commute.`}
          features={[
            { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
            { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
            { icon: 'zap', text: '70+ km/l Mileage', color: 'text-green-600' },
          ]}
          gradientFrom="green-50"
          gradientTo="emerald-50"
        />

        {/* Available Models */}
        <section className="py-12 bg-white">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Splendor Models in {locationName}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Splendor Plus', cc: '97cc', price: '₹299/day', mileage: '70 km/l' },
                { name: 'Splendor iSmart', cc: '110cc', price: '₹349/day', mileage: '75 km/l' },
                { name: 'Super Splendor', cc: '125cc', price: '₹399/day', mileage: '65 km/l' },
                { name: 'HF Deluxe', cc: '97cc', price: '₹279/day', mileage: '70 km/l' },
              ].map((model) => (
                <div key={model.name} className="bg-gradient-to-br from-green-50 to-white p-5 rounded-lg border-2 border-green-200">
                  <div className="text-3xl mb-2">🏍️</div>
                  <h3 className="font-bold mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.mileage}</p>
                  <p className="text-green-600 font-bold">{model.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available Splendor Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />

        <PopularRoutes
          location={locationName}
          locationSlug={params.location}
          serviceSlug="splendor-on-rent"
        />

        <FAQSection service="bike-on-rent" location={locationName} />

        <NearbyLocations
          locationSlug={params.location}
          service="splendor-on-rent"
        />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="splendor-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      </div>
    </>
  );
}
