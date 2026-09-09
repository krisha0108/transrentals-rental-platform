import React from 'react';
import type { Metadata } from 'next';
import { CalendarCheck, Bike as BikeIcon, CreditCard, PartyPopper } from 'lucide-react';
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
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/fleet/honda-activa-6g.jpg', description: "Rent Honda Activa 6G scooter — India's most popular two-wheeler with 109cc OBD2-compliant engine, 50 kmpl mileage, LED headlight, silent start, and 21-litre underseat storage. Ideal for hassle-free city commuting with automatic transmission. Rental includes helmet and insurance. Book at TransRentals from ₹299/day." },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 799, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: "Rent Royal Enfield Classic 350 — iconic heritage cruiser with 349cc twin-spark J-series engine, 20.2 PS power, dual-channel ABS, and timeless design. Smooth highway cruiser with 35+ kmpl mileage and relaxed touring ergonomics. Perfect for road trips and weekend getaways. Rental from ₹799/day with helmet." },
  { name: 'TVS Jupiter', brand: 'TVS', price: 349, image: 'https://transrentals.in/images/scooters/jupiter.jpg', description: "Rent TVS Jupiter scooter — family-favourite 110cc automatic scooter with 50+ kmpl mileage, extra-large 22-litre underseat storage, external fuel cap, and wide two-person seat. Best for family outings, grocery runs, and comfortable daily commuting. Available from ₹349/day with doorstep delivery." },
  { name: 'KTM Duke 200', brand: 'KTM', price: 999, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent KTM Duke 200 — aggressive naked sports bike with 199.5cc liquid-cooled engine, 25 PS power, slipper clutch, and WP suspension. 0-100 kmph in 8.7 seconds with sharp handling and 136 kmph top speed. Perfect for sporty city riding and spirited weekend rides. Rental from ₹999/day with helmet.' },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 899, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent Royal Enfield Himalayan — purpose-built adventure tourer with 411cc single-cylinder engine, 24.3 PS power, long-travel suspension, and Tripper navigation. Handles mountain roads, highway touring, and off-road terrain with ease. Ideal for Ladakh and adventure road trips. Available from ₹899/day.' },
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
      <div id="bikes-fleet">
        <LazyServiceFleetDisplay
          serviceSlug="bike-on-rent"
          locationSlug={params.location}
          title={`Bikes Available for Rent in ${locationName}`}
          showCategories={true}
          limit={12}
          priceUnit="/day"
        />
      </div>

      {/* Why Rent Here */}
      <WhyRentHere locationName={locationName} />

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
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
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

      </div>
    </>
  );
}
