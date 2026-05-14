import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

  const _seoDb = await resolvePageMeta(`17-seater-tempo-traveller:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `17 Seater Tempo Traveller in ${locationName} | Hire @₹20/km | TransRentals`,
    description: _seoDb?.metaDescription || `Book 17 seater tempo traveller on rent in ${locationName}. AC/Non-AC options with driver. For large groups, weddings, corporate events.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [`17 seater tempo traveller ${locationName}`, `tempo traveller hire ${locationName}`],
    openGraph: {
      title: `17 Seater Tempo Traveller in ${locationName} @₹20/km`,
      url: `https://transrentals.in/17-seater-tempo-traveller/${params.location}`,
    },
    alternates: { canonical: `https://transrentals.in/17-seater-tempo-traveller/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `17 Seater Tempo Traveller in ${locationName} | TransRentals`,
      description: `Book 17 seater tempo traveller in ${locationName} starting @₹20/km with driver.`,
    },
  };
}

const variants = [
  { name: '17 Seater Non-AC', price: 20 },
  { name: '17 Seater AC', price: 25 },
  { name: '17 Seater Deluxe', price: 30 },
  { name: '17 Seater Maharaja', price: 38 },
];

export default async function SeventeenSeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('17-seater-tempo-traveller', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="17-seater-tempo-traveller" serviceName="17 Seater Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`17-seater-tempo-traveller:${params.location}`),
    getServiceCityContent('17-seater-tempo-traveller', params.location),
  ]);

  const pageFaqs = [
    { question: 'What is the seating capacity of a 17-seater tempo traveller?', answer: 'A 17-seater seats 16–17 adults comfortably with push-back seats, overhead luggage, and rear boot space for bags.' },
    { question: 'Is a 17-seater tempo traveller suitable for a wedding group?', answer: 'Yes, 17-seater AC Deluxe with LED lighting and music system is ideal for wedding parties, baraat, and family functions.' },
    { question: 'What is the rental rate for a 17-seater tempo traveller?', answer: '17-seater non-AC starts from ₹20/km; AC starts from ₹25/km; Maharaja variant from ₹38/km. Driver bata included.' },
    { question: 'Can a 17-seater tempo traveller travel interstate?', answer: 'Yes, our tempo travellers have all-India permits and valid interstate registration. Long-distance outstation trips are fully supported.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/17-seater-tempo-traveller" className="hover:text-purple-700">17 Seater Tempo Traveller</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`17 Seater Tempo in ${locationName}`}
        title="17 Seater Tempo Traveller"
        titleHighlight="Medium Groups @₹20/km"
        description={`The most popular group size — 17-seater AC Tempo Traveller for ${locationName} trips. Extended legroom, luggage space, perfect for wedding parties and tour groups.`}
        features={[
          { icon: 'zap', text: 'Extended Legroom', color: 'text-orange-600' },
          { icon: 'shield', text: 'Large Luggage Space', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      <section className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">17 Seater Tempo Traveller in {locationName}</h1>
          <p className="text-lg opacity-90 mb-6">Spacious group travel with professional driver. AC & Non-AC available.</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹20/km</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">17 Seats</p>
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">17 Seater Options in {locationName}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <h3 className="text-lg font-bold mb-2">{variant.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-purple-600">₹{variant.price}</span>
                  <span className="text-gray-500">/km</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Professional driver</li>
                  <li>✓ Fuel included</li>
                  <li>✓ All permits</li>
                </ul>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/12-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">12 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹18/km</p>
            </Link>
            <Link href={`/20-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">20 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹22/km</p>
            </Link>
            <Link href={`/tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Tempo Travellers</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
            <Link href={`/bus-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Bus Rental</h3>
              <p className="text-sm text-gray-600 mt-2">26+ seater</p>
            </Link>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="17-seater-tempo-traveller"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <FAQSection service="bus-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="17 Seater Tempo Traveller"
        serviceSlug="17-seater-tempo-traveller"
        description={`Book 17 seater tempo traveller in ${locationName} starting @₹20/km with driver.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="17-seater-tempo-traveller"
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
