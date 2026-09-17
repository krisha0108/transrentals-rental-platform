import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getLuxuryServiceId, getLocationId } from '@/lib/db/build-cache';
import { SupercarsGrid } from '@/components/sports-car-rental/SupercarsGrid';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import { Trophy, Gem, Camera, PartyPopper, Heart, Cake, Sparkles, ShieldCheck, UserCog } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Sports Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`sports-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('sports-car-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Sports Car Rental ${locationName} | Supercar Hirek | Ferrari Lamborghini`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent sports cars in ${locationName}. Ferrari, Lamborghini, Porsche available. Self-drive & chauffeur.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `sports car rental ${locationName.toLowerCase()}`,
      `supercar rental ${locationName.toLowerCase()}`,
      `Ferrari rental ${locationName.toLowerCase()}`,
      `Lamborghini ${locationName.toLowerCase()}`,
      `sports car hire ${locationName.toLowerCase()}`,
      `luxury car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `sports car ${k}`),
    ],
    openGraph: {
      title: `Sports Car Rental in ${locationName} - Ferrari, Lamborghinik`,
      description: `Rent exotic supercars in ${locationName}. Ultimate luxury sports car experience.`,
      url: `https://transrentals.in/sports-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/sports-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Sports Car Rental in ${locationName} | TransRentals`,
      description: `Rent sports cars in ${locationName}.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'Which sports cars can I book?', answer: 'Ferrari, Lamborghini, Porsche, Audi R8 and similar supercars, for track days, drives and photo shoots.' },
  { question: 'When will sports car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is a security deposit required?', answer: 'Yes. Supercar bookings carry a refundable security deposit and a damage waiver, both confirmed by the operator before pickup.' },
];

/**
 * What a city sees while no operator is live there yet: no booking form and no
 * quoted rate, just the nearest cities that are bookable today.
 */
function ExpandingCityPage({ cityName, citySlug }: { cityName: string; citySlug: string }) {
  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/sports-car-rental" className="hover:text-primary">Sports Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="sports car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="sports-car-rental"
          serviceName="Sports Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="sports car"
        selectionDesc="Ferrari, Lamborghini, Porsche and other supercars for drives and shoots."
      />
      <FAQSection service="sports-car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function SportsCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('sports-car-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'luxury-car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="sports-car-rental" serviceName="Sports Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`sports-car-rental:${params.location.toLowerCase()}`);

  const pageFaqs = [
    { question: 'Which sports cars are available for rent?', answer: 'We offer Porsche 911, Lamborghini Huracán, Ferrari California, BMW M3, and Mustang GT — all insured and ready for city and track experiences.' },
    { question: 'Do I need a special licence to rent a sports car?', answer: 'You need a valid LMV licence with at least 3 years of driving experience. For supercars above 500hp, prior experience verification is required.' },
    { question: 'Is insurance included in the sports car rental?', answer: 'Yes, comprehensive insurance is included, and an additional damage waiver is strongly recommended. A refundable security deposit applies, and the operator confirms the amount before pickup.' },
    { question: 'Can I rent a sports car just for a photo shoot?', answer: 'Yes, 2-hour photo shoot packages are available with a designated location. Contact us for custom packages with multiple car combinations.' },
  ];

  const [luxuryServiceId, locationId, scContent] = await Promise.all([
    getLuxuryServiceId(),
    getLocationId(params.location),
    getServiceCityContent('sports-car-rental', params.location),
  ]);

  const luxuryCars = luxuryServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: luxuryServiceId, isActive: true },
    select: {
      id: true, name: true, sideImage: true, seatingCapacity: true,
      basePricePerDay: true, isPopular: true, tagline: true, highlight: true,
      brands: { select: { name: true } },
      ...(locationId ? {
        vehicle_model_locations: {
          where: { locationId, isActive: true },
          select: { basePricePerDay: true },
          take: 1,
        },
      } : {}),
    },
    orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
  }) : [];

  const carsWithPrice = (luxuryCars ?? []).map((m) => {
    const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
    const price = locationPrice ?? m.basePricePerDay ?? null;
    return { ...m, price };
  });

  return (
    <>
      <SpecialtyCarBookingHero service="sports" city={locationName} citySlug={params.location.toLowerCase()} />

      {/* Why Sports Car */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Rent Sports Car in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Trophy, title: 'Ultimate Experience', desc: `Dream driving in ${locationName}` },
              { Icon: Gem, title: 'Luxury & Style', desc: 'Arrive in elegance' },
              { Icon: Camera, title: 'Photo Perfect', desc: 'Instagram-worthy' },
              { Icon: PartyPopper, title: 'Special Events', desc: 'Weddings, parties' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supercars Available — dynamic */}
      {carsWithPrice.length > 0 && (
        <SupercarsGrid cars={carsWithPrice} locationName={locationName} />
      )}

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for Events in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Heart, occasion: 'Weddings', desc: `Grand entry in ${locationName}` },
              { Icon: Cake, occasion: 'Birthdays', desc: 'Celebration' },
              { Icon: Sparkles, occasion: 'Proposals', desc: 'Romantic surprise' },
              { Icon: Camera, occasion: 'Photo Shoots', desc: 'Luxury backdrops' },
            ].map(({ Icon, occasion, desc }) => (
              <div key={occasion} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{occasion}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Sports Car Features in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Car Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Latest supercar models',
                  'Pristine condition',
                  'High-performance engines',
                  'Exotic interiors',
                  'Advanced safety',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <UserCog className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Rental Options</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Self-drive available',
                  'Chauffeur service',
                  'Hourly/daily rentals',
                  'Full insurance',
                  '24/7 support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="sports-car-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Sports Car Rental',
            name: `Sports Car Rental in ${locationName}`,
            description: `Rent exotic supercars in ${locationName}. Ferrari, Lamborghini, Porsche available.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 25000,
              highPrice: 80000,
              offerCount: 8,
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="sports-car-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="luxury-car-rental"
        parentName="Luxury Car Rental"
        currentSlug="sports-car-rental"
        siblings={[
          { slug: 'wedding-car-rental', name: 'Wedding Car Rental' },
          { slug: 'sports-car-rental', name: 'Sports Car Rental' },
          { slug: 'vintage-car-rental', name: 'Vintage Car Rental' },
        ]}
      />

    </>
  );
}
