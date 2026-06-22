import React from 'react';
import type { Metadata } from 'next';
import { BikeSearchHero } from '@/components/bike';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { CityContentSection } from '@/components/location/CityContentSection';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
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
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';

const COMING_SOON_SLUGS = new Set([
  'chidambaram',
  'hosur',
  'loni',
  'havelock-island',
  'ramoji-film-city',
  'baratang-island',
  'hubli-dharwad',
  'rohtang-pass',
  'sultanpur-majra',
  'wayanad',
  'yanam',
  'yamaha-fz',
  'yercaud',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DB locations table
// Pages for DB-enabled cities → booking form hero
// Pages for non-enabled cities → coming soon hero
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
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Bike on Rent in ${locationName} | Starting @₹299/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent bikes in ${locationName} with TransRentals. Choose from Royal Enfield, KTM, Activa, Honda & more. Best prices guaranteed. Doorstep delivery available. Book your bike rental in ${locationName} now!`,
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
      title: `Bike on Rent in ${locationName} - Starting @₹299/Day | TransRentals`,
      description: `Rent bikes in ${locationName} starting @₹299/day. Royal Enfield, KTM, Activa & more. Best prices guaranteed.`,
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
      description: `Rent bikes in ${locationName} starting @₹299/day. Best prices guaranteed.`,
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

// Popular bikes data (for display below hero)
const POPULAR_BIKES = [
  { name: 'Honda Activa 6G', type: 'Scooter', price: 299, image: '/images/fleet/activa-6g.jpg' },
  { name: 'Royal Enfield Classic 350', type: 'Cruiser', price: 799, image: '/images/fleet/royal-enfield-classic-350.jpg' },
  { name: 'TVS Jupiter', type: 'Scooter', price: 349, image: '/images/fleet/tvs-jupiter.jpg' },
  { name: 'KTM Duke 200', type: 'Sports', price: 999, image: '/images/fleet/ktm-duke-200.jpg' },
];

// Location-specific FAQs for schema
const getLocationFaqs = (locationName: string) => [
  { question: `What documents are required for bike rental in ${locationName}?`, answer: `You need a valid driving license (with MCWG endorsement for bikes above 50cc), government ID proof (Aadhaar/Passport), and a security deposit to rent a bike in ${locationName}.` },
  { question: `What is the minimum rental duration in ${locationName}?`, answer: `The minimum rental duration is 24 hours. However, we also offer hourly rentals for select bikes in ${locationName} starting from 4 hours.` },
  { question: `Is doorstep delivery available in ${locationName}?`, answer: `Yes, doorstep delivery is available in ${locationName} for an additional charge. You can also pick up the bike from our partner locations across the city.` },
  { question: `What bikes are available for rent in ${locationName}?`, answer: `In ${locationName}, we have scooters (Activa, Jupiter), cruisers (Royal Enfield Classic 350, Bullet), sports bikes (KTM Duke), and commuter bikes available for rent.` },
  { question: `What if the bike breaks down in ${locationName}?`, answer: `We provide 24/7 roadside assistance in ${locationName}. Contact our support and we'll arrange for help or a replacement bike immediately.` },
];

// Schema vehicles data
const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/fleet/honda-activa-6g.jpg' },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 799, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'TVS Jupiter', brand: 'TVS', price: 349, image: 'https://transrentals.in/images/scooters/jupiter.jpg' },
  { name: 'KTM Duke 200', brand: 'KTM', price: 999, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 899, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default async function BikeLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('bike-on-rent', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/bike-on-rent" className="hover:text-primary">Bike Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="bike-on-rent"
            serviceName="Bike Rental"
            themeColor="emerald"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="bike-on-rent" serviceName="Bike on Rent" />;

  // Coming soon — city exists but service not yet enabled
  if (pageContext.type === 'coming-soon') {
    const comingSoonCity = pageContext.city;
    const cityName = comingSoonCity.name;
    const cityFaqs = getLocationFaqs(cityName);
    return (
      <>
        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: `Bike on Rent in ${cityName}`,
              description: `Bike rental service coming soon to ${cityName}. Rent Royal Enfield, KTM, Activa & more starting @₹299/day.`,
              provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
              areaServed: { '@type': 'City', name: cityName },
              serviceType: 'Bike Rental',
            }),
          }}
        />

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

        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="bike-on-rent"
          serviceName="Bike on Rent"
          themeColor="emerald"
        />

        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="bike-on-rent"
          serviceName="Bike on Rent"
        />

        {/* Why TransRentals */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Why Choose TransRentals for Bike Rental in {cityName}?
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              We&apos;re bringing the best bike rental experience to {cityName} soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: '✅', title: 'Verified Vendors', desc: `All bike rental vendors in ${cityName} are background-checked and verified for quality` },
                { icon: '💰', title: 'Best Prices', desc: `Starting from just ₹299/day — cheapest bike rentals in ${cityName} guaranteed` },
                { icon: '🛵', title: 'Wide Selection', desc: `Scooters, cruisers, sports bikes — every type of two-wheeler available in ${cityName}` },
                { icon: '🚪', title: 'Doorstep Delivery', desc: `Get your bike delivered right to your address in ${cityName} for free` },
                { icon: '📞', title: '24/7 Support', desc: `Round the clock roadside assistance and customer support in ${cityName}` },
                { icon: '📄', title: 'Easy Booking', desc: 'Book online in minutes — no long paperwork or advance deposits' },
              ].map((item) => (
                <div key={item.title} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
              Frequently Asked Questions — Bike Rental in {cityName}
            </h2>
            <div className="space-y-6">
              {cityFaqs.map((faq) => (
                <div key={faq.question} className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Text */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Bike Rental Services in {cityName}
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                TransRentals is expanding its bike rental services to {cityName}. We are working to onboard
                verified bike rental vendors in {cityName} so you can rent two-wheelers at the best prices.
                Our platform offers Royal Enfield, KTM, Honda Activa, TVS Jupiter, Bajaj Pulsar, and many
                more bikes for daily, weekly, and monthly rentals.
              </p>
              <p>
                Once we launch in {cityName}, you will be able to book bikes online with doorstep delivery,
                flexible rental durations, and 24/7 roadside assistance. Till then, explore bike rentals
                in nearby cities listed above where you can book instantly.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">
                Types of Bikes Available for Rent in {cityName}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Scooters — Honda Activa, TVS Jupiter, Suzuki Access (₹299–₹499/day)</li>
                <li>Commuter Bikes — Bajaj Pulsar, Hero Splendor, TVS Apache (₹399–₹599/day)</li>
                <li>Cruisers — Royal Enfield Classic 350, Bullet 350, Thunderbird (₹799–₹999/day)</li>
                <li>Adventure Bikes — Royal Enfield Himalayan, KTM Duke 390 (₹899–₹1299/day)</li>
              </ul>
            </div>
          </div>
        </section>
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
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['bike-on-rent'] || [];

  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Bike on Rent"
        serviceSlug="bike-on-rent"
        description={`Rent bikes in ${locationName} with TransRentals. Choose from Royal Enfield, KTM, Activa & more. Best prices starting @₹299/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={locationFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 1499 }}
        rating={4.5}
        reviewCount={487}
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
      <BikeSearchHero city={locationName} citySlug={params.location} pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined} pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined} />

      {/* Available Bikes - Dynamic from Database */}
      <LazyServiceFleetDisplay
        serviceSlug="bike-on-rent"
        locationSlug={params.location}
        title={`Bikes Available for Rent in ${locationName}`}
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Why Rent Here */}
      <WhyRentHere locationName={locationName} />

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How to Rent a Bike in {locationName}
            </h2>
            <p className="text-gray-600">Simple 4-step process to get you riding</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Select Dates', desc: 'Choose your pickup & drop-off date and time', icon: '📅' },
              { step: 2, title: 'Choose Bike', desc: 'Browse available bikes and select your ride', icon: '🏍️' },
              { step: 3, title: 'Book Online', desc: 'Complete booking with secure payment', icon: '💳' },
              { step: 4, title: 'Ride Away', desc: 'Pick up your bike and enjoy your ride!', icon: '🚀' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
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
      />

      <CrossServiceLinks
        citySlug={params.location}
        cityName={locationName}
        currentServiceSlug="bike-on-rent"
      />

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
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

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

      {/* Browse by Brand */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Browse Bikes by Brand in {locationName}</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { slug: 'royal-enfield', label: 'Royal Enfield', from: '₹649/day' },
              { slug: 'honda', label: 'Honda', from: '₹299/day' },
              { slug: 'ktm', label: 'KTM', from: '₹899/day' },
              { slug: 'yamaha', label: 'Yamaha', from: '₹349/day' },
              { slug: 'bajaj', label: 'Bajaj', from: '₹449/day' },
              { slug: 'tvs', label: 'TVS', from: '₹349/day' },
            ].map((brand) => (
              <a
                key={brand.slug}
                href={`/bike-on-rent/${params.location}/${brand.slug}`}
                className="inline-flex flex-col items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
              >
                <span className="font-bold">{brand.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{brand.from}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      </div>
    </>
  );
}
