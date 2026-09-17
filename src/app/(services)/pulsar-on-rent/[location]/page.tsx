import React from 'react';
import type { Metadata } from 'next';
import { LazyServiceFleetDisplay } from '@/components/services/LazyServiceFleetDisplay';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { stripPricesFromText } from '@/lib/content/strip-prices';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
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
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Award, Fuel, Gauge, Wallet, ShieldCheck, Headphones } from 'lucide-react';

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
    resolvePageMeta(`pulsar-on-rent:${params.location}`),
    getServiceCityContent('pulsar-on-rent', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Pulsar on Rent in ${locationName} | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent Bajaj Pulsar bikes in ${locationName}. Pulsar 150, 180, NS200, RS200 available. Reliable sports bikes. Book your Pulsar rental now!`),
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `pulsar on rent in ${locationName}`,
      `bajaj pulsar rental ${locationName}`,
      `${locationName} pulsar rental`,
      `rent pulsar in ${locationName}`,
      `pulsar 150 on rent ${locationName}`,
    ],
    openGraph: {
      title: `Pulsar on Rent in ${locationName} | TransRentals`,
      description: `Rent Bajaj Pulsar bikes in ${locationName} from verified partners.`,
      type: 'website',
      url: `https://transrentals.in/pulsar-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/pulsar-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Pulsar Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Pulsar on Rent in ${locationName} | TransRentals`,
      description: `Rent Pulsar bikes in ${locationName} from verified partners.`,
      images: ['https://transrentals.in/images/og/pulsar-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/pulsar-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which Pulsar models are available for rent?', answer: 'We have Pulsar 150, Pulsar 180, Pulsar NS200, and Pulsar RS200 available for rent.' },
  { question: 'What is the security deposit for Pulsar rental?', answer: 'A refundable security deposit is collected at pickup, and returned in full when you bring the bike back.' },
  { question: 'What is the mileage of Pulsar bikes?', answer: 'Pulsar bikes give approximately 45-55 km/litre depending on the model and riding conditions.' },
  { question: 'Can I rent Pulsar for monthly basis?', answer: 'Yes, we offer monthly rental plans with free maintenance.' },
];

export default async function PulsarLocationPage({ params }: PageProps) {
  // Availability follows Bike Rental: there is no services row under
  // "pulsar-on-rent" (an unknown slug used to read as "available everywhere"),
  // and a Pulsar is a bike — wherever bike rental is live, so is this.
  // One admin screen controls all of these pages.
  const pageContext = await resolveServicePage('pulsar-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'bike-on-rent',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="pulsar-on-rent" serviceName="Pulsar on Rent" />;

  // No partners onboarded here yet — no booking hero, because there is
  // nothing to search. The page says where we're at and points at the
  // nearest city that is bookable today.
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/pulsar-on-rent" className="hover:text-primary">Pulsar on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="Pulsar rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="pulsar-on-rent"
            serviceName="Pulsar on Rent"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} selectionDesc="Pulsar 150, 180, NS200, RS200 — the full Bajaj Pulsar range." />
        <FAQSection service="pulsar-on-rent" location={cityName} customFaqs={schemaFaqs} />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`pulsar-on-rent:${params.location}`),
    getServiceCityContent('pulsar-on-rent', params.location),
  ]);

  // No rate is quoted anywhere on this page — the real price depends on the
  // partner and the dates, so a number in the copy would only mislead.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;

  const pageFaqs = [
    { question: 'Which Pulsar models are available for rent?', answer: 'We offer Bajaj Pulsar 150, Pulsar 180, Pulsar NS200, and Pulsar RS200 — well-maintained bikes for daily and weekend rides.' },
    { question: 'Is insurance covered during the Pulsar rental period?', answer: 'Yes, all our Pulsar bikes carry valid third-party insurance. Comprehensive coverage is optional at an additional fee.' },
    { question: 'Can I extend my Pulsar rental period mid-trip?', answer: 'Yes, rental extensions are allowed subject to availability. Contact our support team at least 4 hours before your current booking expires.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`Pulsar on Rent in ${locationName}`}
        serviceSlug="pulsar-on-rent"
        description={`Rent Bajaj Pulsar bikes in ${locationName}. Pulsar 150, 180, NS200, RS200 available, all from verified partners.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        rating={4.8}
        reviewCount={756}
        hidePrices
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/pulsar-on-rent" className="hover:text-primary">Pulsar on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

        <BikeSearchHero
          city={locationName}
          citySlug={params.location}
          pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
          pageDescription={heroDescription}
        />

        {/* Why Pulsar */}
        <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage:
                'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
              maskImage:
                'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            }}
          />
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Why Rent Pulsar in <span className="text-emerald-600">{locationName}?</span>
              </h2>
            </div>
            {/* The generic "Why Rent Here" block used to sit below this one
                and asked the same question again — its two points are folded
                in here so the page makes the case once. */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
              {[
                { Icon: Award, title: 'Proven Reliability', desc: "India's best-selling sports bike" },
                { Icon: Fuel, title: 'Fuel Efficient', desc: '45-55 km/litre mileage' },
                { Icon: Gauge, title: 'Sporty Design', desc: 'Aggressive looks, smooth ride' },
                { Icon: Wallet, title: 'Affordable', desc: 'Best value for money' },
                { Icon: ShieldCheck, title: 'Verified Partners', desc: 'Every vendor is background-checked' },
                { Icon: Headphones, title: '24/7 Support', desc: 'Round-the-clock roadside assistance' },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                  style={{ animation: `pls-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
                >
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.Icon className="w-5 h-5 text-emerald-600 transition-colors duration-500 group-hover:text-white" />
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pls-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { [style*="pls-rise"] { animation: none !important; opacity: 1 !important; } }
          ` }} />
        </section>

        {/* Available bikes — purely whatever the admin has published for this
            city. Nothing hardcoded, and the section renders nothing at all
            when the city has no published fleet. */}
        <LazyServiceFleetDisplay
          serviceSlug="pulsar-on-rent"
          locationSlug={params.location}
          title={`Available Pulsar Bikes in ${locationName}`}
          showCategories={true}
          limit={12}
          hidePrices
        />


        <NearbyLocations
          locationSlug={params.location}
          service="pulsar-on-rent"
        />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="pulsar-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="pulsar-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="pulsar-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
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
