import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { prisma } from '@/lib/db/prisma';
import { CarSearchHero } from '@/components/car';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { AutoRentalSchema } from '@/components/seo/schemas';
import { getServiceLocationRating } from '@/lib/services/cached-service-lookups';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

const COMING_SOON_SLUGS = new Set([
  'varanasi',
  'himachal-pradesh',
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || params.location.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-car-rentals:${params.location}`),
    getServiceCityContent('self-drive-car-rentals', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive Car Rental in ${locationName} | Drive Yourself @₹899/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent self-drive cars in ${locationName} — no driver, complete freedom. Hatchbacks ₹899/day, Sedans ₹1299/day, SUVs ₹1899/day. Flexible pickup hours, doorstep delivery. Book self-drive car in ${locationName} now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `self drive car rental ${locationName.toLowerCase()}`,
      `self drive car ${locationName.toLowerCase()}`,
      `self drive cars ${locationName.toLowerCase()}`,
      `self drive car hire ${locationName.toLowerCase()}`,
      `drive yourself car ${locationName.toLowerCase()}`,
      `car without driver ${locationName.toLowerCase()}`,
      `self driven car ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `self drive car ${k}`),
    ],
    openGraph: {
      title: `Self Drive Car Rental in ${locationName} - Starting @₹899/Day`,
      description: `Book self-drive cars in ${locationName}. No driver needed. Complete freedom to drive yourself.`,
      url: `https://transrentals.in/self-drive-car-rentals/${params.location}`,
      images: [{ url: 'https://transrentals.in/images/og/self-drive.jpg', width: 1200, height: 630, alt: `Self Drive Car Rental in ${locationName}` }],
      type: 'website',
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Self Drive Car Rental in ${locationName} - TransRentals`,
      description: `Rent self-drive cars in ${locationName} starting @₹899/day. No driver needed.`,
      images: ['https://transrentals.in/images/og/self-drive.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-car-rentals/${params.location}`,
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export default async function SelfDriveCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-car-rentals', params.location, { comingSoonIfUnavailable: true });
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
                <a href="/self-drive-car-rentals" className="hover:text-primary">Self Drive Car Rentals</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="self-drive-car-rentals"
            serviceName="Self Drive Car Rentals"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-car-rentals" serviceName="Self Drive Car Rentals" />;

  // Coming soon — city exists but service not yet enabled
  if (pageContext.type === 'coming-soon') {
    const comingSoonCity = pageContext.city;
    const cityName = comingSoonCity.name;
    return (
      <>
        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: `Self Drive Car Rental in ${cityName}`,
              description: `Self drive car rental service coming soon to ${cityName}. Rent cars without driver starting @₹899/day.`,
              provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
              areaServed: { '@type': 'City', name: cityName },
              serviceType: 'Self Drive Car Rental',
            }),
          }}
        />

        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/self-drive-car-rentals" className="hover:text-primary">Self Drive Car Rentals</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>

        <ComingSoonHero
          city={cityName}
          citySlug={params.location}
          serviceSlug="self-drive-car-rentals"
          serviceName="Self Drive Car Rental"
          themeColor="blue"
        />

        <NearbyActiveCities
          currentCitySlug={params.location}
          serviceSlug="self-drive-car-rentals"
          serviceName="Self Drive Car Rental"
        />

        {/* Popular Cars */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Popular Self Drive Cars in {cityName}
            </h2>
            <p className="text-gray-600 text-center mb-10">
              When we launch in {cityName}, these top cars will be available for self drive
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Maruti Swift', type: 'Hatchback', price: 899 },
                { name: 'Honda City', type: 'Sedan', price: 1299 },
                { name: 'Hyundai Creta', type: 'SUV', price: 1899 },
                { name: 'Toyota Innova', type: 'MUV', price: 2499 },
              ].map((car) => (
                <div key={car.name} className="bg-gray-50 rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🚗</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{car.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{car.type}</p>
                  <p className="text-blue-600 font-bold">₹{car.price}/day</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why TransRentals */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Why Choose TransRentals for Self Drive Car Rental in {cityName}?
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              We&apos;re bringing the best self drive experience to {cityName} soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: '🔐', title: 'Complete Privacy', desc: `Drive alone without a driver — complete freedom to explore ${cityName} at your pace` },
                { icon: '💰', title: 'No Driver Cost', desc: `Save on driver charges. Self drive cars in ${cityName} start at just ₹899/day` },
                { icon: '⏰', title: 'Your Schedule', desc: `No time restrictions. Pick up and drop at your convenience in ${cityName}` },
                { icon: '✅', title: 'Verified Cars', desc: 'All cars are well-maintained, insured and regularly serviced' },
                { icon: '📄', title: 'Easy Documents', desc: 'Just a valid driving license and ID proof — booking done in minutes' },
                { icon: '📞', title: '24/7 Support', desc: `Round the clock roadside assistance anywhere in ${cityName}` },
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
              Frequently Asked Questions — Self Drive Car Rental in {cityName}
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: `When will self drive car rental be available in ${cityName}?`,
                  a: `We are actively onboarding vendors in ${cityName}. You will be notified once the service goes live. Meanwhile, check nearby cities listed above where you can book instantly.`,
                },
                {
                  q: `What documents are required for self drive car rental in ${cityName}?`,
                  a: `You will need a valid driving license (minimum 1 year old), an Aadhaar card or PAN card for identity proof, and a refundable security deposit.`,
                },
                {
                  q: `How much does self drive car rental cost in ${cityName}?`,
                  a: `Self drive car rental in ${cityName} will start from ₹899/day for hatchbacks, ₹1299/day for sedans, and ₹1899/day for SUVs once the service launches.`,
                },
                {
                  q: `Can I take a self drive car for outstation trips from ${cityName}?`,
                  a: `Yes, outstation self drive trips will be allowed from ${cityName}. Additional charges may apply for inter-state travel.`,
                },
                {
                  q: `Is fuel included in the self drive car rental price in ${cityName}?`,
                  a: `No, fuel charges are separate. The car will have some fuel at the time of pickup and you should return it with the same fuel level.`,
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Text */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Self Drive Car Rental in {cityName}
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                TransRentals is expanding its self drive car rental services to {cityName}. We are
                onboarding verified car rental vendors in {cityName} so you can rent cars without a driver
                at the best prices. Our platform offers hatchbacks, sedans, SUVs, and luxury cars for
                hourly, daily, weekly, and monthly self drive rentals.
              </p>
              <p>
                Once we launch in {cityName}, you can book self drive cars online in minutes with instant
                confirmation, doorstep delivery, and 24/7 roadside assistance. Till then, explore self
                drive rentals in nearby cities listed above.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">
                Types of Self Drive Cars Available in {cityName}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Hatchbacks — Maruti Swift, Hyundai i20, Tata Tiago (₹899–₹1199/day)</li>
                <li>Sedans — Honda City, Maruti Ciaz, Hyundai Verna (₹1299–₹1799/day)</li>
                <li>SUVs — Hyundai Creta, Kia Seltos, MG Hector (₹1899–₹2499/day)</li>
                <li>Premium SUVs — Toyota Fortuner, Jeep Compass, XUV700 (₹2999–₹4999/day)</li>
              </ul>
            </div>
          </div>
        </section>
      </>
    );
  }

  const city = pageContext.city;
  const locationName = city.name;
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['self-drive-car-rentals'] || [];

  const [seoData, liveRating, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-car-rentals:${params.location}`),
    getServiceLocationRating('self-drive-car-rentals', params.location),
    getServiceCityContent('self-drive-car-rentals', params.location),
  ]);

  return (
    <>
      <CarSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
      />

      {/* Why Self Drive in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Self Drive Cars in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🔐', title: 'Complete Privacy', desc: 'Drive alone without a driver' },
              { icon: '⏰', title: 'Your Schedule', desc: 'No time restrictions' },
              { icon: '💰', title: 'No Driver Cost', desc: 'Save on driver charges' },
              { icon: '🗺️', title: 'Explore Freely', desc: `Discover ${locationName} at your pace` },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Cars - Dynamic from Database */}
      <ServiceFleetDisplay
        serviceSlug="self-drive-car-rentals"
        locationSlug={params.location}
        title={`Self Drive Cars Available in ${locationName}`}
        showCategories={true}
        limit={12}
        priceUnit="/day"
        showViewAll={false}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="car-rental"
        parentName="Car Rental"
        currentSlug="self-drive-car-rentals"
        siblings={[
          { slug: 'car-rental', name: 'Chauffeur Driven' },
          { slug: 'luxury-car-rental', name: 'Luxury Cars' },
          { slug: 'hourly-car-rental', name: 'Hourly Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Rental' },
        ]}
      />

      {/* AutoRental Schema — schema.org/AutoRental subtype */}
      <AutoRentalSchema
        name={`Self Drive Car Rental in ${locationName} — TransRentals`}
        description={`Rent self-drive cars in ${locationName} without a driver. Hatchbacks, sedans, SUVs starting @₹899/day.`}
        city={locationName}
        citySlug={params.location}
        serviceSlug="self-drive-car-rentals"
        vehicleTypes={['Car', 'SUV', 'Hatchback', 'Sedan']}
        rating={liveRating?.ratingValue}
        reviewCount={liveRating?.reviewCount}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: (cityFAQs.length > 0 ? cityFAQs : [
              { q: `How much does self-drive car rental cost in ${locationName}?`, a: `Self-drive car rental in ${locationName} starts from ₹899/day for hatchbacks. Sedans cost around ₹1299/day and SUVs from ₹2199/day.` },
              { q: `What documents are required for self-drive car rental in ${locationName}?`, a: `You need a valid driving license (minimum 1 year old), Aadhaar card/PAN card for ID proof, and a refundable security deposit.` },
              { q: `Is fuel included in self-drive car rental?`, a: `No, fuel charges are separate. The car will have some fuel when you pick it up, and you should return it with the same fuel level.` },
              { q: `Can I take a self-drive car for outstation trips from ${locationName}?`, a: `Yes, you can take self-drive cars for outstation trips from ${locationName}. Additional charges may apply for inter-state travel.` },
            ]).map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

    </>
  );
}
