import React from 'react';
import type { Metadata } from 'next';
import { CalendarCheck, Bike as BikeIcon, CreditCard, PartyPopper } from 'lucide-react';
import { BikeSearchHero } from '@/components/bike';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { CityContentSection } from '@/components/location/CityContentSection';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { containsPrice, stripPricesFromText } from '@/lib/content/strip-prices';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { prisma } from '@/lib/db/prisma';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { LazyServiceFleetDisplay } from '@/components/services/LazyServiceFleetDisplay';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DB locations table — every active city gets the
// same page; the fleet section is the only part that depends on the service
// actually being enabled there.
export async function generateStaticParams() {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  try {
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch {
    return [];
  }
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
    resolvePageMeta(`bike-on-rent:${params.location}`),
    getServiceCityContent('bike-on-rent', params.location),
  ]);
  return {
    // Same rule as the page body: no rate is quoted. "@₹299/Day" in a search
    // result is a promise this page can no longer keep.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Bike on Rent in ${locationName} | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent bikes in ${locationName} with TransRentals. Choose from Royal Enfield, KTM, Activa, Honda & more. Verified partners and doorstep delivery available. Book your bike rental in ${locationName} now!`),
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `bike on rent in ${locationName}`,
      `bike rental ${locationName}`,
      `${locationName} bike rental`,
      `rent a bike in ${locationName}`,
      `scooty on rent ${locationName}`,
      `royal enfield rent ${locationName}`,
      `activa on rent ${locationName}`,
      `bike hire ${locationName}`,
      `two wheeler rental ${locationName}`,
    ],
    openGraph: {
      title: `Bike on Rent in ${locationName} | TransRentals`,
      description: `Rent bikes in ${locationName} from verified partners. Royal Enfield, KTM, Activa & more.`,
      type: 'website',
      url: `https://transrentals.in/bike-on-rent/${locationSlug}`,
      images: [
        {
          url: `https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(locationName)}`,
          width: 1200,
          height: 630,
          alt: `Bike Rental in ${locationName} - TransRentals`,
        },
      ],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bike on Rent in ${locationName} - TransRentals`,
      description: `Rent bikes in ${locationName} from verified partners. Royal Enfield, KTM, Activa & more.`,
      images: [`https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(locationName)}`],
    },
    alternates: {
      canonical: `https://transrentals.in/bike-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Location-specific FAQs for schema
const getLocationFaqs = (locationName: string) => [
  { question: `What documents are required for bike rental in ${locationName}?`, answer: `You need a valid driving license (with MCWG endorsement for bikes above 50cc), government ID proof (Aadhaar/Passport), and a security deposit to rent a bike in ${locationName}.` },
  { question: `What is the minimum rental duration in ${locationName}?`, answer: `The minimum rental duration is 24 hours. However, we also offer hourly rentals for select bikes in ${locationName} starting from 4 hours.` },
  { question: `Is doorstep delivery available in ${locationName}?`, answer: `Yes, doorstep delivery is available in ${locationName} for an additional charge. You can also pick up the bike from our partner locations across the city.` },
  { question: `What bikes are available for rent in ${locationName}?`, answer: `In ${locationName}, we have scooters (Activa, Jupiter), cruisers (Royal Enfield Classic 350, Bullet), sports bikes (KTM Duke), and commuter bikes available for rent.` },
  { question: `What if the bike breaks down in ${locationName}?`, answer: `We provide 24/7 roadside assistance in ${locationName}. Contact our support and we'll arrange for help or a replacement bike immediately.` },
];

export default async function BikeLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('bike-on-rent', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="bike-on-rent" serviceName="Bike on Rent" />;

  // No partners onboarded here yet. The booking hero is deliberately left out —
  // there is nothing to search, so a search box would only lead to a dead end.
  // The page still earns its place: it says where we're at, and sends the
  // visitor to the nearest city they can actually book in today.
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    const cityFaqs = getLocationFaqs(cityName);
    return (
      <>
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/bike-on-rent" className="hover:text-primary">Bike on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>

        {/* No search box here on purpose — see ServiceExpandingHero. */}
        <ServiceExpandingHero cityName={cityName} serviceLabel="bike rentals" />

        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="bike-on-rent"
            serviceName="Bike on Rent"
          />
        </div>

        <ServiceLaunchBenefits cityName={cityName} />

        <FAQSection service="bike-on-rent" location={cityName} customFaqs={cityFaqs} />
      </>
    );
  }

  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationFaqs = getLocationFaqs(locationName);
  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`bike-on-rent:${params.location}`),
    getServiceCityContent('bike-on-rent', params.location),
  ]);
  // City FAQs feed the FAQPage JSON-LD. Same no-rate rule as everything else:
  // a question that exists only to quote one goes, and answers keep every
  // sentence except the one carrying a number.
  const cityFAQs = (CITY_SEO[params.location]?.serviceFAQs?.['bike-on-rent'] || [])
    .filter((faq) => !containsPrice(faq.q))
    .map((faq) => ({ q: faq.q, a: stripPricesFromText(faq.a) }))
    .filter((faq) => faq.a.length > 0);
  // No rate is quoted anywhere on this page — the real price depends on the
  // partner and the dates, so a number in the copy would only mislead. The
  // hero blurb is authored in the admin, so it gets scrubbed here.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;
  // Nothing gets said twice on one page. Where the admin has written the
  // city's own version of a pitch, the generic component below is dropped;
  // where they haven't, the component is still the fallback.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);
  const adminCoversOtherServices = hasSectionMatching(scContent?.sectionsConfig, /services?[-\s_]?(offered|available)|other[-\s_]?services/i);

  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Bike on Rent"
        serviceSlug="bike-on-rent"
        description={`Rent bikes in ${locationName} with TransRentals. Choose from Royal Enfield, KTM, Activa & more, all from verified partners.`}
        city={locationName}
        citySlug={params.location}
        faqs={locationFaqs}
        rating={4.5}
        reviewCount={487}
        hidePrices
      />

      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/bike-on-rent" className="hover:text-primary">Bike on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

      {/* Hero with Search */}
      <BikeSearchHero city={locationName} citySlug={params.location} pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined} pageDescription={heroDescription} />

      {/* Available bikes — purely whatever the admin has published for this
          city. Nothing is hardcoded here, and ServiceFleetDisplay renders
          nothing at all when the city has no published fleet. */}
      <div id="bikes-fleet">
        <LazyServiceFleetDisplay
          serviceSlug="bike-on-rent"
          locationSlug={params.location}
          title={`Bikes Available for Rent in ${locationName}`}
          showCategories={true}
          limit={12}
          hidePrices
        />
      </div>

      {/* Why Rent Here — skipped when the admin has already written the
          city's own "why choose us" block further down the page. */}
      {!adminCoversWhyUs && <WhyRentHere locationName={locationName} />}

      {/* How It Works */}
      <section
        className="relative py-16 md:py-20 bg-[#fafcfb] bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/images/sections/how-it-works-bg.png')" }}
      >
        <div className="container-custom">
          <div className="text-center mb-14 md:mb-16">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="w-10 h-px border-t-2 border-dashed border-emerald-300" />
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                How to Rent a Bike in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <span className="hidden sm:flex items-center gap-1">
                <span className="w-10 h-px border-t-2 border-dashed border-emerald-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
            </div>
            <p className="text-gray-600">Simple 4-step process to get you riding</p>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
            {/* Dashed connector line behind the step circles (desktop only) */}
            <div className="hidden md:block absolute top-11 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-emerald-300 -z-0" />

            {[
              { step: '01', title: 'Select Dates', desc: 'Choose your pickup & drop-off date and time', Icon: CalendarCheck },
              { step: '02', title: 'Choose Bike', desc: 'Browse available bikes and select your ride', Icon: BikeIcon },
              { step: '03', title: 'Book Online', desc: 'Complete booking with secure payment', Icon: CreditCard },
              { step: '04', title: 'Ride Away', desc: 'Pick up your bike and enjoy your ride!', Icon: PartyPopper },
            ].map((item) => (
              <div key={item.step} className="relative z-10 text-center">
                <div className="relative inline-block mb-4">
                  <span className="absolute -top-2 -left-1 z-10 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    {item.step}
                  </span>
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
                    <item.Icon className="w-8 h-8 text-emerald-600" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm max-w-[180px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Locations */}
      <NearbyLocations locationSlug={params.location} service="bike-on-rent" />

      <ServiceAreasSection
        serviceSlug="bike-on-rent"
        citySlug={params.location}
        cityName={locationName}
        serviceName="Bike Rental"
        hidePrices
      />

      {/* Same idea: the admin's "Services Offered" block says this already. */}
      {!adminCoversOtherServices && (
        <CrossServiceLinks
          citySlug={params.location}
          cityName={locationName}
          currentServiceSlug="bike-on-rent"
        />
      )}

      {cityFAQs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: cityFAQs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />
      )}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="bike-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
        ]}
      />

      </div>
    </>
  );
}
