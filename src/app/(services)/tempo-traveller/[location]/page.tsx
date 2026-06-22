import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { prisma } from '@/lib/db/prisma';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';

const TEMPO_FALLBACK_FAQS = [
  { q: 'What is the cost of Tempo Traveller rental per km?', a: 'Tempo Traveller rental starts from ₹18/km for a 12-seater non-AC vehicle. AC 12-seater starts from ₹22/km. 17-seater AC starts from ₹28/km. Local city packages (8 hrs/80 km) start from ₹2,500. Rates vary by city — get a free quote on TransRentals for exact pricing.' },
  { q: 'What is the seating capacity of a Tempo Traveller?', a: 'Tempo Travellers are available in 9-seater, 12-seater, 14-seater, 17-seater, and 20-seater configurations. For comfortable travel with luggage, plan for 1–2 fewer passengers than the stated capacity — a 17-seater comfortably carries 14–15 passengers on long trips.' },
  { q: 'What is included in the Tempo Traveller booking price?', a: 'Standard inclusions: vehicle + driver + driver\'s basic allowance. Extra charges typically apply for: toll charges, state permits for interstate travel, night halt charges (₹250–₹500/night), and fuel if crossing the included km limit. Confirm all inclusions with the vendor before booking.' },
  { q: 'Is driver included in Tempo Traveller rental?', a: 'Yes, all Tempo Traveller rentals on TransRentals include a professional driver. For outstation trips, driver allowance (₹300–₹500/day) may be charged separately. Drivers are verified and experienced on the relevant routes.' },
  { q: 'How far in advance should I book a Tempo Traveller?', a: 'For regular trips, 48–72 hours notice is sufficient. During peak seasons — Navratri, Diwali, long weekends, and Char Dham season (May–June) — book at least 1–2 weeks in advance. For pilgrimages, book 3–4 weeks ahead for best availability.' },
];
import { TempoFleetSection } from '@/components/tempo-traveller/TempoFleetSection';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

const COMING_SOON_SLUGS = new Set([
  'rohtak',
]);

interface PageProps {
  params: {
    location: string;
  };
}

export async function generateStaticParams() {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  try {
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch {
    return getServiceLocations('tempo-traveller');
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);

  if (!city) {
    return { title: 'Tempo Traveller on Rent | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`tempo-traveller:${params.location}`),
    getServiceCityContent('tempo-traveller', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Tempo Traveller in ${locationName} | Starting ₹18/km | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Tempo Traveller in ${locationName}. 12, 17, 20 seater AC/Non-AC available for pilgrimages, family trips, and corporate events. Verified drivers.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `tempo traveller ${locationName.toLowerCase()}`,
      `12 seater tempo ${locationName.toLowerCase()}`,
      `17 seater tempo ${locationName.toLowerCase()}`,
      `force traveller ${locationName.toLowerCase()}`,
      `tempo on rent ${locationName.toLowerCase()}`,
      `tempo booking ${locationName.toLowerCase()}`,
      `group travel ${locationName.toLowerCase()}`,
      `traveller hire ${locationName.toLowerCase()}`,
      `tempo for outstation ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `tempo traveller ${k}`),
    ],
    openGraph: {
      title: `Tempo Traveller in ${locationName} | 12-17 Seater | TransRentals`,
      description: `Book Tempo Traveller in ${locationName}. AC/Non-AC vehicles for pilgrimages, family trips, and corporate events.`,
      type: 'website',
      url: `https://transrentals.in/tempo-traveller/${params.location}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/tempo-traveller.jpg',
          width: 1200,
          height: 630,
          alt: `Tempo Traveller Rental in ${locationName} - TransRentals`,
        },
      ],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    alternates: {
      canonical: `https://transrentals.in/tempo-traveller/${params.location}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Tempo Traveller in ${locationName} | TransRentals`,
      description: `Rent Tempo Traveller in ${locationName}. 12, 17, 20 seater AC tempo travellers for group travel, tours & pilgrimages.`,
      images: ['https://transrentals.in/images/og/tempo-traveller.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function TempoTravellerLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('tempo-traveller', params.location);
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
                <a href="/tempo-traveller" className="hover:text-primary">Tempo Traveller</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="tempo-traveller"
            serviceName="Tempo Traveller"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="tempo-traveller" serviceName="Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city.name;

  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['tempo-traveller'] || [];
  const displayFAQs = cityFAQs.length > 0 ? cityFAQs : TEMPO_FALLBACK_FAQS;

  const [seoData, tempoFleet, scContent] = await Promise.all([
    resolvePageMeta(`tempo-traveller:${params.location}`),
    prisma.vehicle_models.findMany({
      where: {
        isActive: true,
        OR: [
          { services_vehicle_models_serviceIdToservices: { slug: 'bus-rental' } },
          { services_vehicle_models_serviceIdToservices: { slug: 'tempo-traveller' } },
        ],
      },
      select: {
        id: true,
        name: true,
        sideImage: true,
        basePricePerDay: true,
        rating: true,
        tagline: true,
        highlight: true,
        isPopular: true,
        seatingCapacity: true,
        brands: { select: { name: true } },
      },
      orderBy: [{ isPopular: 'desc' }, { seatingCapacity: 'asc' }, { displayOrder: 'asc' }],
    }),
    getServiceCityContent('tempo-traveller', params.location),
  ]);


  return (
    <>
      <ServiceHeroWithChat
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Tempo Traveller in ${locationName}`}
        title="Tempo Traveller Rental"
        titleHighlight="12-20 Seater | AC & Non-AC"
        description={`Book comfortable AC Tempo Traveller in ${locationName}. Perfect for group travel, family trips, corporate events, and pilgrimages.`}
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vehicles', color: 'text-orange-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      {/* Why Tempo Traveller in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Tempo Traveller in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👥', title: 'Group Travel', desc: `Perfect for ${locationName} tours` },
              { icon: '❄️', title: 'AC Comfort', desc: 'Fully air-conditioned' },
              { icon: '💺', title: 'Comfortable Seats', desc: 'Push-back seating' },
              { icon: '🗺️', title: 'Outstation Ready', desc: 'Multi-city trips allowed' },
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

      {/* Available Tempo Travellers — dynamic from vehicle_models */}
      <TempoFleetSection vehicles={tempoFleet} locationName={locationName} />

      {/* Perfect Occasions in City */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Family Trips', icon: '👨‍👩‍👧‍👦', desc: `${locationName} outstation tours` },
              { occasion: 'Corporate Events', icon: '💼', desc: 'Team outings & meetings' },
              { occasion: 'Pilgrimages', icon: '🛕', desc: 'Temple tours from city' },
              { occasion: 'Weddings', icon: '💒', desc: 'Guest transport service' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Tempo Traveller Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-orange-700">Included Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Fully air-conditioned</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Push-back/reclining seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Music system included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Ample luggage space</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Experienced driver in {locationName}</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-amber-900">Service Amenities</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>24/7 pickup available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Flexible rental packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Outstation trips allowed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Full vehicle insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Customer support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Packages */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Tempo Traveller Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Local (8 hrs)', price: '2500-4000', desc: '80 km' },
              { duration: 'Outstation', price: '18-35/km', desc: 'Per km rate' },
              { duration: 'Multi-Day', price: '3000-5500/day', desc: '250-300 km/day' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-orange-700 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Tempo Traveller in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Select Vehicle', desc: 'Choose seating capacity (12-20 seater)' },
              { step: '2', title: 'Choose Package', desc: `Local or outstation from ${locationName}` },
              { step: '3', title: 'Book Online', desc: 'Enter trip details and confirm' },
              { step: '4', title: 'Get Confirmation', desc: 'Driver details shared via SMS' },
              { step: '5', title: 'Enjoy Your Trip', desc: 'Comfortable group travel' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="tempo-traveller"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* SEO Content Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Tempo Traveller Rental in {locationName}
            </h2>
            {CITY_SEO[params.location]?.serviceIntros?.['tempo-traveller'] ? (
              <p className="text-gray-600">{CITY_SEO[params.location].serviceIntros['tempo-traveller']}</p>
            ) : (
              <p className="text-gray-600">
                TransRentals offers the best Tempo Traveller rental services in {locationName}. Whether you need
                a 12-seater for a family outing, a 17-seater for a corporate event, or a 20-seater for a
                pilgrimage group, our verified vendors in {locationName} provide comfortable AC Tempo Travellers
                with professional drivers at the best prices.
              </p>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Why Book Tempo Traveller from TransRentals in {locationName}?
            </h3>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Multiple Seating Options:</strong> 9, 12, 14, 17, and 20-seater available</li>
              <li><strong>AC & Non-AC:</strong> Both air-conditioned and non-AC variants for every budget</li>
              <li><strong>Best Rates:</strong> Local packages from ₹2,500 and outstation from ₹18/km</li>
              <li><strong>Expert Drivers:</strong> Verified drivers experienced on {locationName} routes</li>
              <li><strong>Outstation Trips:</strong> Multi-day and multi-city packages available</li>
              <li><strong>24/7 Support:</strong> Round-the-clock assistance throughout your trip</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Tempo Traveller in ${locationName} — TransRentals`,
            description: `Rent 12 to 17 seater AC Tempo Travellers in ${locationName} for group travel, pilgrimages, corporate outings, and weddings. Verified drivers included.`,
            url: `https://transrentals.in/tempo-traveller/${params.location}`,
            areaServed: { '@type': 'City', name: locationName },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: displayFAQs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="tempo-traveller"
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
