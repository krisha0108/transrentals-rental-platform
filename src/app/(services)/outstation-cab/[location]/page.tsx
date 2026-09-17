import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { OutstationCabSection } from '@/components/outstation-cab/OutstationCabSection';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import { Wallet, Car as CarIcon, RefreshCw, UserCog, CheckCircle2, Sparkles, Route as RouteIcon, MapPinned, ArrowRight } from 'lucide-react';

const COMING_SOON_SLUGS = new Set([
  'ludhiana-noida-roundtrip',
  'kolkata-aligarh-roundtrip',
  'hyderabad-anand-roundtrip',
  'mumbai-vadodara-roundtrip',
  'udaipur-rajasthan-ahmedabad-roundtrip',
  'ahmedabad-ajmer-roundtrip',
  'bhilai-raipur-roundtrip',
  'chennai-puducherry-roundtrip',
  'durgapur-kolkata-roundtrip',
  'hyderabad-adilabad-roundtrip',
  'jamshedpur-kolkata-roundtrip',
  'mumbai-surat-roundtrip',
  'vadodara-ahmedabad-roundtrip',
  'vadodara-surat-roundtrip',
  'ahmedabad-aizawl-roundtrip',
  'ahmedabad-ambala-roundtrip',
  'ahmedabad-mumbai-roundtrip',
  'ambarnath-mumbai-roundtrip',
  'ankleshwar-surat-roundtrip',
  'aurangabad-mumbai-roundtrip',
  'bangalore-adilabad-roundtrip',
  'bangalore-hyderabad-roundtrip',
  'bharuch-ahmedabad-roundtrip',
  'delhi-panipat-roundtrip',
  'hyderabad-aligarh-roundtrip',
  'jalgaon-nashik-roundtrip',
  'jamnagar-amreli-roundtrip',
  'korba-raipur-roundtrip',
  'mumbai-ambala-roundtrip',
  'nagpur-nashik-roundtrip',
  'nashik-nagpur-roundtrip',
  'nashik-navi-mumbai-roundtrip',
  'pune-aizawl-roundtrip',
  'rajkot-nadiad-roundtrip',
  'ranchi-patna-roundtrip',
  'sikar-jaipur-roundtrip',
  'surat-mumbai-roundtrip',
  'ujjain-mumbai-roundtrip',
  'vadodara-anand-roundtrip',
  'ahmedabad-airport-amd-ahmedabad-roundtrip',
  'ahmedabad-alipurduar-roundtrip',
  'ahmedabad-anand-roundtrip',
  'bangalore-aligarh-roundtrip',
  'bangalore-amravati-roundtrip',
  'bharuch-vadodara-roundtrip',
  'chennai-bangalore-roundtrip',
  'indore-nashik-roundtrip',
  'jammu-and-kashmir-pathankot-roundtrip',
  'jamnagar-rajkot-roundtrip',
  'kolkata-ambala-roundtrip',
  'mumbai-aizawl-roundtrip',
  'mumbai-alwar-roundtrip',
  'nagpur-raipur-roundtrip',
  'raipur-nagpur-roundtrip',
  'rajkot-vadodara-roundtrip',
  'shimla-noida-roundtrip',
  'tiruppur-coimbatore-roundtrip',
  'vapi-ahmedabad-roundtrip',
  'ahmedabad-ahmedabad-airport-amd-roundtrip',
  'bangalore-ajmer-roundtrip',
  'bangalore-almora-roundtrip',
  'hyderabad-alipurduar-roundtrip',
  'pune-alipurduar-roundtrip',
  'bilaspur-chhattisgarh-raipur-roundtrip',
  'kolkata-akola-roundtrip',
  'purnia-patna-roundtrip',
  'surat-ahmedabad-roundtrip',
  'surat-vadodara-roundtrip',
  'thoothukudi-madurai-roundtrip',
  'bangalore-agartala-roundtrip',
  'bangalore-aizawl-roundtrip',
  'bangalore-amritsar-roundtrip',
  'bangalore-chennai-roundtrip',
  'dehradun-noida-roundtrip',
  'kochi-ahmednagar-roundtrip',
  'latur-mumbai-roundtrip',
  'mahabaleshwar-mumbai-roundtrip',
  'mumbai-ajmer-roundtrip',
  'nagpur-mumbai-roundtrip',
  'pune-ambala-roundtrip',
  'pune-amravati-roundtrip',
  'shirdi-aurangabad-roundtrip',
  'udaipur-rajasthan-anand-roundtrip',
  // Added from GSC Coverage report 2026-07-03
  'adilabad-bangalore-roundtrip',
  'adilabad-kochi-roundtrip',
  'adilabad-kolkata-roundtrip',
  'adoni-kolkata-roundtrip',
  'agra-lucknow-roundtrip',
  'ahmedabad-bharuch-roundtrip',
  'ahmedabad-gandhinagar-roundtrip',
  'ahmedabad-rajkot-roundtrip',
  'ahmedabad-surat-roundtrip',
  'ahmedabad-vapi-roundtrip',
  'ajmer-ahmedabad-roundtrip',
  'ajmer-chennai-roundtrip',
  'ajmer-hyderabad-roundtrip',
  'ajmer-jaipur-roundtrip',
  'aligarh-kolkata-roundtrip',
  'ambala-mumbai-roundtrip',
  'ambala-pune-roundtrip',
  'amreli-jamnagar-roundtrip',
  'amreli-vadodara-roundtrip',
  'amritsar-bangalore-roundtrip',
  'amritsar-dalhousie-roundtrip',
  'anand-surat-roundtrip',
  'anand-vadodara-roundtrip',
  'aurangabad-pune-roundtrip',
  'bangalore-alipurduar-roundtrip',
  'bangalore-anantapur-roundtrip',
  'bhagalpur-patna-roundtrip',
  'bhopal-indore-roundtrip',
  'bikaner-jaipur-roundtrip',
  'chandigarh-patiala-roundtrip',
  'chennai-adilabad-roundtrip',
  'chennai-ajmer-roundtrip',
  'chennai-ambarnath-roundtrip',
  'chennai-amravati-roundtrip',
  'chennai-tirupati-roundtrip',
  'coimbatore-bangalore-roundtrip',
  'coimbatore-chennai-roundtrip',
  'coimbatore-kochi-roundtrip',
  'coimbatore-mysore-roundtrip',
  'coorg-bangalore-roundtrip',
  'coorg-mysore-roundtrip',
  'darbhanga-patna-roundtrip',
  'delhi-amritsar-roundtrip',
  'delhi-haridwar-roundtrip',
  'dharamshala-amritsar-roundtrip',
  'dhule-nashik-roundtrip',
  'dwarka-rajkot-roundtrip',
  'gandhinagar-ahmedabad-roundtrip',
  'guntur-hyderabad-roundtrip',
  'gwalior-noida-roundtrip',
  'jaipur-agra-roundtrip',
  'jaipur-jodhpur-roundtrip',
  'kochi-adilabad-roundtrip',
  'kochi-akola-roundtrip',
  'kolkata-alipurduar-roundtrip',
  'lucknow-noida-roundtrip',
  'mahabaleshwar-pune-roundtrip',
  'mumbai-ahmednagar-roundtrip',
  'mumbai-nagpur-roundtrip',
  'mysore-chennai-roundtrip',
  'nagpur-pune-roundtrip',
  'nashik-aurangabad-roundtrip',
  'nashik-pune-roundtrip',
  'noida-dehradun-roundtrip',
  'noida-panipat-roundtrip',
  'ooty-coimbatore-roundtrip',
  'ooty-mysore-roundtrip',
  'panipat-noida-roundtrip',
  'patna-muzaffarpur-roundtrip',
  'patna-ranchi-roundtrip',
  'pune-ajmer-roundtrip',
  'pune-aurangabad-roundtrip',
  'pune-kolhapur-roundtrip',
  'pune-nagpur-roundtrip',
  'rajkot-dwarka-roundtrip',
  'salem-chennai-roundtrip',
  'salem-coimbatore-roundtrip',
  'surat-anand-roundtrip',
  'surat-nadiad-roundtrip',
  'surat-navsari-roundtrip',
  'udupi-bangalore-roundtrip',
  'vadodara-amreli-roundtrip',
  'vadodara-bhopal-roundtrip',
  'vadodara-mumbai-roundtrip',
  'vadodara-nadiad-roundtrip',
]);

function slugToRouteLabel(slug: string): string {
  return slug
    .replace(/-roundtrip$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

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
  // Fall back to a humanized slug for cities not in the curated list — otherwise
  // metadata is left without a description and inherits the generic site-wide
  // one from the root layout, producing mass duplicate meta descriptions.
  const locationName = city?.name ?? params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`outstation-cab:${params.location.toLowerCase()}`),
    getServiceCityContent('outstation-cab', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Outstation Cab from ${locationName} Round Trip`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Book outstation cab from ${locationName}. Intercity taxi, round trip & one-way cabs. Sedan, SUV available.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `outstation cab ${locationName.toLowerCase()}`,
      `outstation taxi ${locationName.toLowerCase()}`,
      `intercity cab ${locationName.toLowerCase()}`,
      `round trip cab ${locationName.toLowerCase()}`,
      `station taxi ${locationName.toLowerCase()}`,
      `outstation car rental ${locationName.toLowerCase()}`,
      `intercity travel ${locationName.toLowerCase()}`,
      `one way cab ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `outstation cab ${k}`),
    ],
    openGraph: {
      title: `Outstation Cab from ${locationName} - Intercity Taxi`,
      description: `Book outstation cabs from ${locationName}. Round trip & one-way options available.`,
      url: `https://transrentals.in/outstation-cab/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/outstation-cab/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Outstation Cab in ${locationName} | TransRentals`,
      description: `Book outstation cab from ${locationName}.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What outstation trips can I book?', answer: 'One-way drops and round trips to any city, in sedans, SUVs and MUVs with an experienced highway driver.' },
  { question: 'When will outstation cabs open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is toll and driver allowance included?', answer: 'Tolls, state permits and driver allowance are confirmed in the quote before you book, so there is no surprise at the end of the trip.' },
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
            <a href="/outstation-cab" className="hover:text-primary">Outstation Cab</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="outstation cabs" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="outstation-cab"
          serviceName="Outstation Cab"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="cab"
        selectionDesc="Sedans, SUVs and MUVs for one-way and round-trip intercity travel."
      />
      <FAQSection service="outstation-cab" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function OutstationCabLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('outstation-cab', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'car-rental',
  });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      return (
        <ServiceComingSoon
          serviceName="Outstation Cab"
          serviceSlug="outstation-cab"
          locationName={slugToRouteLabel(params.location)}
          locationSlug={params.location.toLowerCase()}
        />
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="outstation-cab" serviceName="Outstation Cab" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const [vehicleCategories, cityPricing, scContent] = await Promise.all([
    prisma.chauffeur_vehicle_categories.findMany({
      where: { isActive: true, services: { slug: 'car-rental' } },
      select: {
        id: true, name: true, slug: true, image: true,
        seatingCapacity: true, acType: true, exampleVehicles: true,
        isPopular: true, dailyRate: true,
      },
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    }),
    prisma.chauffeur_city_pricing.findMany({
      where: { isActive: true, locations: { slug: params.location } },
      select: { vehicleCategoryId: true, baseKmRate: true, minKmPerDay: true, driverDayAllowance: true },
    }),
    getServiceCityContent('outstation-cab', params.location),
  ]);

  const pricingMap = new Map(cityPricing.map((p) => [p.vehicleCategoryId, p]));
  const catsToShow = cityPricing.length > 0
    ? vehicleCategories.filter((cat) => pricingMap.has(cat.id))
    : vehicleCategories;

  const pageFaqs = [
    { question: 'What is an outstation cab and how to book it?', answer: 'An outstation cab is a car-with-driver service for intercity travel. Book online, select your route, vehicle, and date — driver picks you up at the scheduled time.' },
    { question: 'Is the outstation cab rate per km or fixed?', answer: 'Both are offered — one-way trips are charged per kilometre, and round trips come as an all-inclusive fixed package. The operator confirms which applies in your quote.' },
    { question: 'Are toll, parking, and state taxes included in the outstation cab fare?', answer: 'Toll and state taxes are extra and paid by the customer. Parking is also extra. Driver bata is included in the quoted price.' },
    { question: 'Can I book an outstation cab for multiple days?', answer: 'Yes, multi-day outstation trips are available with a fixed daily rate. Driver accommodation is arranged separately by the driver.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/outstation-cab" className="hover:text-primary">Outstation Cab</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero */}
      <SpecialtyCarBookingHero
        service="outstation-cab"
        city={locationName}
        citySlug={params.location.toLowerCase()}
      />

      {/* Why Outstation Cab */}
      <section className="relative overflow-hidden py-16 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Book Outstation Cab from <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Wallet, title: 'All-Inclusive Fare', desc: 'No hidden charges' },
              { icon: CarIcon, title: 'Clean AC Cars', desc: 'Well-maintained fleet' },
              { icon: RefreshCw, title: 'Round Trip Option', desc: 'Economical travel' },
              { icon: UserCog, title: 'Expert Drivers', desc: `Local ${locationName} drivers` },
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all"
                style={{ animation: `oc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes oc-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="oc-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Dynamic vehicle categories with filters */}
      {catsToShow.length > 0 && (
        <OutstationCabSection
          categories={catsToShow}
          pricingMap={Object.fromEntries(pricingMap)}
        />
      )}

      {/* Popular Routes from City */}

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Outstation Cab Features in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Included in Fare</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Experienced driver',
                  'Fuel charges (both ways)',
                  'Driver allowance',
                  'Toll & state taxes',
                  'Full insurance',
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
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Service Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  `Doorstep pickup in ${locationName}`,
                  'Clean & sanitized cars',
                  'Flexible stop-overs',
                  'No hidden charges',
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

      {/* Packages */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Outstation Cab Packages from <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: RefreshCw, type: 'Round Trip', desc: 'Most economical — same driver, return included' },
              { icon: RouteIcon, type: 'One-Way', desc: 'Drop only, no return charges' },
              { icon: MapPinned, type: 'Multi-City', desc: 'Custom tour packages, multiple stops' },
            ].map((plan) => (
              <div key={plan.type} className="group bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center hover:border-emerald-300 hover:shadow-md transition-all">
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-600 transition-colors">
                  <plan.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="font-bold text-lg text-gray-900 mb-1.5">{plan.type}</h3>
                <p className="text-sm text-gray-500 mb-3">{plan.desc}</p>
                <p className="text-sm font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  Get Quote <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            How to Book Outstation Cab in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Select Route', desc: `Choose destination from ${locationName}` },
              { step: '2', title: 'Choose Car Type', desc: 'Sedan, SUV or Tempo Traveller' },
              { step: '3', title: 'Select Package', desc: 'Round trip or one-way' },
              { step: '4', title: 'Book Online', desc: 'Complete booking & payment' },
              { step: '5', title: 'Travel Comfortably', desc: 'Driver arrives at your doorstep' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-shrink-0 w-10 h-10">
                  <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                  <div className="relative w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="outstation-cab"
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
            serviceType: 'Outstation Cab',
            name: `Outstation Cab from ${locationName}`,
            description: `Book outstation cabs from ${locationName}. Intercity taxi service with round trip & one-way options.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 12,
              highPrice: 25,
              offerCount: 50,
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

      <FAQSection service="outstation-cab" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="outstation-cab"
        siblings={[
          { slug: 'chauffeur-service', name: 'Chauffeur Service' },
          { slug: 'local-taxi', name: 'Local Taxi' },
          { slug: 'outstation-cab', name: 'Outstation Cab' },
          { slug: 'one-way-car-rental', name: 'One Way Car Rental' },
          { slug: 'outstation-car-rental', name: 'Outstation Car Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Car Rental' },
          { slug: 'corporate-car-rental', name: 'Corporate Car Rental' },
        ]}
      />

    </>
  );
}
