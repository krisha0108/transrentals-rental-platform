import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';

const COMING_SOON_SLUGS = new Set([
  'okhla',
  'panihati',
  'yapral',
]);

const PACKERS_FALLBACK_FAQS = [
  {
    question: 'What is the cost of packers and movers in India?',
    answer: 'Packers and movers costs depend on home size, distance, and goods volume. Local shifts (1BHK) start from ₹3,999 and 2BHK intercity moves from ₹8,000–₹15,000. Get free quotes from verified movers on TransRentals to compare prices for your specific shift.',
  },
  {
    question: 'How long does it take to shift a 2BHK house?',
    answer: 'A professional team of 3–4 people takes 6–10 hours for a 2BHK intra-city shift including packing, loading, transit, and unloading. Intercity moves add 1–7 days transit time depending on distance.',
  },
  {
    question: 'Is transit insurance available for household shifting?',
    answer: 'Yes, all TransRentals-listed movers offer optional transit insurance at 0.5–1% of declared goods value. Strongly recommended for electronics, appliances, and high-value items. Confirm insurance coverage before booking.',
  },
  {
    question: 'Do movers disassemble and reassemble furniture?',
    answer: 'Yes, professional movers include dismantling and reassembly of beds, wardrobes, and modular furniture as a standard service. Always confirm this is included in your quote before booking.',
  },
  {
    question: 'How far in advance should I book packers and movers?',
    answer: 'Book at least 5–7 days in advance for month-end dates (28th–2nd), which are the busiest. Mid-month weekdays are easier to schedule and often priced lower. During peak transfer season (March–June) book 2–3 weeks ahead.',
  },
];

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where packers-and-movers is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`packers-and-movers:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Packers and Movers in ${locationName} | Starting from ₹3,999 | TransRentals`,
    description: _seoDb?.metaDescription || `Verified packers and movers in ${locationName}. Local & intercity home shifting, office relocation. IBA-approved, insured moving teams. Get free quotes and book online.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `packers and movers in ${locationName}`,
      `movers and packers ${locationName}`,
      `home shifting ${locationName}`,
      `office relocation ${locationName}`,
      `${locationName} relocation services`,
      `household shifting ${locationName}`,
      `intercity movers ${locationName}`,
    ],
    alternates: {
      canonical: `https://transrentals.in/packers-and-movers/${params.location}`,
    },
    openGraph: {
      title: `Packers and Movers in ${locationName} | TransRentals`,
      description: `Verified packers and movers in ${locationName}. Home shifting, office relocation, intercity moves. IBA-approved and insured. Get free quotes.`,
      type: 'website',
      url: `https://transrentals.in/packers-and-movers/${params.location}`,
      images: [{ url: `https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(locationName)}`, width: 1200, height: 630, alt: `Packers and Movers in ${locationName}` }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Packers and Movers in ${locationName} | TransRentals`,
      description: `Verified packers and movers in ${locationName}. IBA-approved and insured. Home shifting, office relocation, intercity moves.`,
      images: [`https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export default async function PackersMoversLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('packers-and-movers', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="packers-and-movers"
            serviceName="Packers & Movers"
            themeColor="blue"
          />
        </>
      );
    }
    notFound();
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="packers-and-movers" serviceName="Packers and Movers" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
          themeColor="pink"
        />
        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  const seoData = await resolvePageMeta(`packers-and-movers:${params.location}`);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['packers-and-movers'] || [];

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/packers-and-movers" className="hover:text-primary">
              Packers and Movers
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Packers and Movers in ${locationName}`}
        title="Professional Moving Services"
        titleHighlight="Trusted & Insured Relocation"
        description={`Reliable packers and movers in ${locationName}. Local & intercity relocation, office shifting, household moving. Insured and professional service.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Insured Moving', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Service', color: 'text-green-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="packers-and-movers"
      />

      {cityFAQs.length === 0 && <FAQSection service="packers-and-movers" location={locationName} customFaqs={PACKERS_FALLBACK_FAQS} />}
      {cityFAQs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
              Frequently Asked Questions — Packers and Movers in {locationName}
            </h2>
            <div className="space-y-6">
              {cityFAQs.map((faq) => (
                <div key={faq.q} className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <NearbyLocations
        locationSlug={params.location}
        service="packers-and-movers"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="packers-and-movers"
        cityName={locationName}
        stateCode={cityData?.stateCode}
      />

      <ServiceAreasSection
        serviceSlug="packers-and-movers"
        citySlug={params.location}
        cityName={locationName}
        serviceName="Packers and Movers"
      />

      <CrossServiceLinks
        citySlug={params.location}
        cityName={locationName}
        currentServiceSlug="packers-and-movers"
      />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="packers-and-movers"
        parentName="Packers & Movers"
        currentSlug="packers-and-movers"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'bus-rental', name: 'Bus Rental' },
        ]}
      />

      {/* MovingCompany Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MovingCompany',
            name: `Packers and Movers in ${locationName} — TransRentals`,
            description: `Verified packers and movers in ${locationName}. Local and intercity home shifting, office relocation, and vehicle transport. IBA-approved, insured moving teams.`,
            url: `https://transrentals.in/packers-and-movers/${params.location}`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Packers and Movers Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Home Shifting' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Office Relocation' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Intercity Moving' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vehicle Transport' } },
              ],
            },
          }),
        }}
      />
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: cityFAQs.length > 0
              ? cityFAQs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                }))
              : PACKERS_FALLBACK_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Packers and Movers', item: 'https://transrentals.in/packers-and-movers' },
              { '@type': 'ListItem', position: 3, name: `Packers and Movers in ${locationName}`, item: `https://transrentals.in/packers-and-movers/${params.location}` },
            ],
          }),
        }}
      />
    </div>
  );
}
