import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
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
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';
import { Mountain, Landmark, Compass, Clock } from 'lucide-react';

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
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`royal-enfield-on-rent:${params.location}`),
    getServiceCityContent('royal-enfield-on-rent', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Royal Enfield on Rent in ${locationName} | TransRentals`),
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Royal Enfield bikes in ${locationName}. Classic 350, Himalayan, Meteor, Hunter available. Perfect for road trips & touring. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `royal enfield on rent in ${locationName}`,
      `bullet rental ${locationName}`,
      `${locationName} royal enfield rental`,
      `rent bullet in ${locationName}`,
      `classic 350 on rent ${locationName}`,
    ],
    openGraph: {
      title: `Royal Enfield on Rent in ${locationName} | TransRentals`,
      description: `Rent Royal Enfield bikes in ${locationName} from verified partners. Perfect for road trips.`,
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
      description: `Rent Royal Enfield bikes in ${locationName} from verified partners. Perfect for road trips.`,
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
  { question: 'What is the security deposit for Royal Enfield rental?', answer: 'A refundable security deposit is collected at pickup, and returned in full when you bring the bike back.' },
  { question: 'Can I take Royal Enfield for long trips?', answer: 'Yes, our Royal Enfield bikes are perfect for long trips. We also offer one-way drops for Ladakh, Spiti, and Rajasthan trips.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, we provide 24/7 roadside assistance across India. For remote areas, we have tie-ups with local mechanics.' },
];

export default async function RoyalEnfieldLocationPage({ params }: PageProps) {
  // Availability follows Bike Rental: there is no services row under
  // "royal-enfield-on-rent" (an unknown slug used to read as "available
  // everywhere"), and a Royal Enfield is a bike — wherever bike rental is
  // live, so is this. One admin screen controls both pages.
  const pageContext = await resolveServicePage('royal-enfield-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'bike-on-rent',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="royal-enfield-on-rent" serviceName="Royal Enfield on Rent" />;

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
              <a href="/royal-enfield-on-rent" className="hover:text-primary">Royal Enfield on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="Royal Enfield rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="royal-enfield-on-rent"
            serviceName="Royal Enfield on Rent"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} selectionDesc="Classic 350, Himalayan, Meteor, Hunter — the full Royal Enfield line-up." />
        <FAQSection service="royal-enfield-on-rent" location={cityName} customFaqs={schemaFaqs} />
      </>
    );
  }

  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`royal-enfield-on-rent:${params.location}`),
    getServiceCityContent('royal-enfield-on-rent', params.location),
  ]);

  // No rate is quoted anywhere on this page — the real price depends on the
  // partner and the dates, so a number in the copy would only mislead.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;
  // Where the admin has written the city's own "why choose us", the generic
  // block below would be the same pitch twice.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);

  const pageFaqs = [
    { question: 'Which Royal Enfield models are available on rent?', answer: 'We offer Classic 350, Bullet 350, Meteor 350, and Himalayan — all well-maintained with valid insurance and permits.' },
    { question: 'What documents are required to rent a Royal Enfield?', answer: 'You need a valid two-wheeler driving licence and one government-issued photo ID (Aadhaar, passport, or voter card).' },
    { question: 'Is a security deposit required for Royal Enfield rental?', answer: 'Yes, a refundable security deposit is collected at the time of delivery, returned on safe return of the bike.' },
    { question: 'Can I take the Royal Enfield on a highway or outstation trip?', answer: 'Yes, highway and outstation trips are permitted. Inform us in advance so we can ensure the bike is fully serviced and cleared for long-distance.' },
  ];

  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName={`Royal Enfield on Rent in ${locationName}`}
        serviceSlug="royal-enfield-on-rent"
        description={`Rent Royal Enfield bikes in ${locationName}. Classic 350, Himalayan, Meteor, Hunter available from verified partners.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        rating={4.8}
        reviewCount={612}
      />
      <div className="flex flex-col">
      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={heroDescription}
      />

      {/* Popular Routes */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Popular Royal Enfield Trip Routes from <span className="text-emerald-600">{locationName}</span>
            </h2>
            <p className="text-gray-500">Handpicked touring circuits riders book most often</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { route: 'Ladakh Circuit', icon: Mountain, description: 'Manali - Leh - Khardung La - Pangong', duration: '10-15 days' },
              { route: 'Rajasthan Heritage', icon: Landmark, description: 'Jaipur - Jodhpur - Jaisalmer - Udaipur', duration: '7-10 days' },
              { route: 'Spiti Valley', icon: Compass, description: 'Manali - Kaza - Key Monastery - Chandratal', duration: '8-12 days' },
            ].map((trip) => (
              <div key={trip.route} className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mx-6 mt-6">
                  <trip.icon className="w-7 h-7 text-emerald-600" strokeWidth={1.8} />
                </div>
                <div className="p-6 pt-4">
                  <h3 className="text-[18px] font-bold text-gray-900 mb-1.5">{trip.route}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed mb-4">{trip.description}</p>
                  <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {trip.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available bikes — purely whatever the admin has published for this
          city. Nothing hardcoded, and the section renders nothing at all when
          the city has no published fleet. */}
      <LazyServiceFleetDisplay
        serviceSlug="royal-enfield-on-rent"
        locationSlug={params.location}
        title={`Available Royal Enfield Bikes in ${locationName}`}
        showCategories={true}
        limit={12}
        hidePrices
      />

      {!adminCoversWhyUs && <WhyRentHere locationName={locationName} />}

      <NearbyLocations
        locationSlug={params.location}
        service="royal-enfield-on-rent"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="royal-enfield-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="royal-enfield-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
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
