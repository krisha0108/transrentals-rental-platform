import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

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
  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`himalayan-on-rent:${params.location}`),
    getServiceCityContent('himalayan-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Himalayan on Rent in ${locationName} | @₹1499/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Royal Enfield Himalayan in ${locationName}. Adventure touring bike for mountain trips.`,
    alternates: { canonical: `https://transrentals.in/himalayan-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Royal Enfield Himalayan on Rent in ${locationName} | TransRentals`,
      description: `Rent Royal Enfield Himalayan in ${locationName} starting @₹1499/day. Adventure touring bike for mountain trips.`,
    },
  };
}

export default async function HimalayanLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('himalayan-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="himalayan-on-rent" serviceName="Himalayan on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`himalayan-on-rent:${params.location}`),
    getServiceCityContent('himalayan-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is the Royal Enfield Himalayan good for mountain trips?', answer: 'Yes — the Himalayan 411 is built for adventure touring with long-travel suspension, 21-inch front wheel, and fuel range of 400+ km.' },
    { question: 'What documents do I need to rent a Himalayan?', answer: 'A valid gear motorcycle licence (MCWG), one government ID (Aadhaar/passport), and a refundable security deposit are required.' },
    { question: 'Can I ride the Himalayan on unpaved or off-road trails?', answer: 'Light off-road use on gravel and forest tracks is permitted. Extreme off-roading voids the damage waiver — contact us for specific route approval.' },
    { question: 'How much does Himalayan rental cost per day?', answer: 'Royal Enfield Himalayan rental starts at ₹1499/day including helmet and insurance. Weekly packages offer up to 20% savings.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/himalayan-on-rent" className="hover:text-slate-700">Himalayan on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
      />

      <section className="bg-gradient-to-br from-slate-800 to-blue-900 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Himalayan on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,499/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Engine</p>
              <p className="text-xl font-bold">411cc / 450cc</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Himalayan Options in {locationName}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              { name: 'Himalayan 411cc', price: 1499 },
              { name: 'Himalayan 450', price: 1799 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">{v.name}</h3>
                <p className="text-3xl font-bold text-slate-700 mb-4">₹{v.price}<span className="text-sm text-gray-500">/day</span></p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Helmet included</li>
                  <li>✓ Insurance covered</li>
                  <li>✓ Panniers available</li>
                </ul>
                <button className="w-full bg-slate-800 text-white py-2 rounded-lg">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Bikes in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/royal-enfield-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Royal Enfield</h3><p className="text-sm text-gray-600 mt-2">Classic, Bullet</p>
            </Link>
            <Link href={`/ktm-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">KTM</h3><p className="text-sm text-gray-600 mt-2">Duke, RC</p>
            </Link>
            <Link href={`/bike-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Bikes</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
            <Link href="/bike-tours/leh-ladakh" className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Ladakh Tour</h3><p className="text-sm text-gray-600 mt-2">Guided tours</p>
            </Link>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="himalayan-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Royal Enfield Himalayan on Rent"
        serviceSlug="himalayan-on-rent"
        description={`Rent Royal Enfield Himalayan in ${locationName}. Adventure touring bike for mountain trips.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="himalayan-on-rent"
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
    </>
  );
}
