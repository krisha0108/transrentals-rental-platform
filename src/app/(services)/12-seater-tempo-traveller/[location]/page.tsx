import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: { location: string };
}

// Generate static params from DATABASE - Only locations where tempo-traveller is available
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
    resolvePageMeta(`12-seater-tempo-traveller:${params.location.toLowerCase()}`),
    getServiceCityContent('12-seater-tempo-traveller', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `12 Seater Tempo Traveller in ${locationName} | Hire @₹18/km | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book 12 seater tempo traveller on rent in ${locationName}. AC/Non-AC options with driver. Perfect for family trips, weddings, pilgrimages.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [`12 seater tempo traveller ${locationName}`, `tempo traveller hire ${locationName}`, `12 seater van rental ${locationName}`],
    openGraph: {
      title: `12 Seater Tempo Traveller in ${locationName} @₹18/km`,
      description: `Hire 12 seater tempo traveller with driver in ${locationName}.`,
      url: `https://transrentals.in/12-seater-tempo-traveller/${params.location.toLowerCase()}`,
    },
    alternates: { canonical: `https://transrentals.in/12-seater-tempo-traveller/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `12 Seater Tempo Traveller in ${locationName} | TransRentals`,
      description: `Book 12 seater tempo traveller in ${locationName} starting @₹18/km with driver.`,
    },
  };
}

const variants = [
  { name: '12 Seater Non-AC', price: 18 },
  { name: '12 Seater AC', price: 22 },
  { name: '12 Seater Deluxe', price: 26 },
  { name: '12 Seater Maharaja', price: 32 },
];

export default async function TwelveSeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('12-seater-tempo-traveller', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="12-seater-tempo-traveller" serviceName="12 Seater Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`12-seater-tempo-traveller:${params.location.toLowerCase()}`),
    getServiceCityContent('12-seater-tempo-traveller', params.location),
  ]);

  const pageFaqs = [
    { question: 'How many people can travel in a 12-seater tempo traveller?', answer: 'A 12-seater tempo traveller comfortably seats 11–12 adults with small luggage. It\'s ideal for family picnics, pilgrimages, and corporate offsites.' },
    { question: 'Is a 12-seater available with push-back seats and AC?', answer: 'Yes, AC 12-seater with push-back seats, music system, and curtains is available for both local and outstation trips.' },
    { question: 'What is the per-km rate for a 12-seater tempo traveller?', answer: '12-seater non-AC starts from ₹18/km; AC starts from ₹22/km. Driver bata and toll charges are additional.' },
    { question: 'Can I book a 12-seater tempo traveller for a one-day local trip?', answer: 'Yes, half-day (4 hours) and full-day (8 hours, 80 km) local packages are available in addition to outstation per-km pricing.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/12-seater-tempo-traveller" className="hover:text-blue-700">12 Seater Tempo Traveller</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`12 Seater Tempo in ${locationName}`}
        title="12 Seater Tempo Traveller"
        titleHighlight="Small Groups @₹18/km"
        description={`The perfect 12-seater for small group trips from ${locationName}. Family outings, pilgrimage tours, corporate offsites — AC Force Tempo Traveller with push-back seats.`}
        features={[
          { icon: 'zap', text: 'Push-Back Seats', color: 'text-orange-600' },
          { icon: 'shield', text: 'AC & Non-AC', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            12 Seater Tempo Traveller in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Comfortable group travel with professional driver. AC & Non-AC available.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹18/km</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">12 Seats</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Variants</p>
              <p className="text-xl font-bold">4 Options</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            12 Seater Options in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <h3 className="text-lg font-bold mb-2">{variant.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600">₹{variant.price}</span>
                  <span className="text-gray-500">/km</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Professional driver</li>
                  <li>✓ Fuel included</li>
                  <li>✓ All permits</li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/17-seater-tempo-traveller/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">17 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹20/km</p>
            </Link>
            <Link href={`/tempo-traveller/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Tempo Travellers</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
            <Link href={`/bus-rental/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Bus Rental</h3>
              <p className="text-sm text-gray-600 mt-2">26+ seater</p>
            </Link>
            <Link href={`/wedding-bus-rental/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Wedding Bus</h3>
              <p className="text-sm text-gray-600 mt-2">For weddings</p>
            </Link>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="12-seater-tempo-traveller"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="12 Seater Tempo Traveller"
        serviceSlug="12-seater-tempo-traveller"
        description={`Book 12 seater tempo traveller in ${locationName} starting @₹18/km with driver.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="12-seater-tempo-traveller"
        siblings={[
          { slug: 'tempo-traveller', name: 'Tempo Traveller' },
          { slug: 'wedding-bus-rental', name: 'Wedding Bus' },
          { slug: 'corporate-bus-rental', name: 'Corporate Bus' },
          { slug: '12-seater-tempo-traveller', name: '12 Seater Tempo' },
          { slug: '17-seater-tempo-traveller', name: '17 Seater Tempo' },
          { slug: '20-seater-tempo-traveller', name: '20 Seater Tempo' },
          { slug: '26-seater-bus', name: '26 Seater Bus' },
        ]}
      />
    </>
  );
}
