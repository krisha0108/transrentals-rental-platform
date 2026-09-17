import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import {
  Target, Wallet, Clock, Route, Car as CarIcon, ArrowRight,
  CheckCircle2, Receipt, Check, MessageCircleQuestion, Plus,
} from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
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

  if (!city) {
    return { title: 'One Way Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`one-way-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('one-way-car-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `One Way Car Rental from ${locationName} | Drop at Different City | TransRentals`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `One-way car rental from ${locationName}. Drop car at different city. No return trip needed. Convenient intercity travel. Book online instantly.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `one way car rental ${locationName.toLowerCase()}`,
      `one way car hire ${locationName.toLowerCase()}`,
      `${locationName.toLowerCase()} to other cities cab`,
      `drop car different city ${locationName.toLowerCase()}`,
      `intercity car rental ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `one way car ${k}`),
    ],
    openGraph: {
      title: `One Way Car Rental from ${locationName} - Starting`,
      description: `Rent a car in ${locationName} and drop it at a different city. No return trip required.`,
      url: `https://transrentals.in/one-way-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/one-way-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `One Way Car Rental from ${locationName} | TransRentals`,
      description: `One-way car rental from ${locationName}. Drop at different city.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What is a one-way car rental?', answer: 'You pay for the distance to your destination only — no return fare — and the car is dropped at the destination city.' },
  { question: 'When will one-way car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is a driver included?', answer: 'Yes. Every one-way booking comes with a verified professional driver.' },
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
            <a href="/one-way-car-rental" className="hover:text-primary">One Way Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="one-way car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="one-way-car-rental"
          serviceName="One Way Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="car"
        selectionDesc="Sedans, SUVs and hatchbacks for drop-only intercity trips."
      />
      <FAQSection service="one-way-car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function OneWayCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('one-way-car-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="one-way-car-rental" serviceName="One Way Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;

  const scContent = await getServiceCityContent('one-way-car-rental', params.location);
  const locationName = city.name;

  // Fetch one-way route packages FROM this location
  const routePackages = await prisma.chauffeur_route_packages.findMany({
    where: {
      isActive: true,
      isAirportTransfer: false,
      locations_chauffeur_route_packages_fromLocationIdTolocations: { slug: params.location },
      locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } },
    },
    select: {
      id: true,
      basePrice: true,
      estimatedKm: true,
      estimatedDuration: true,
      isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, slug: true, seatingCapacity: true, acType: true, image: true, exampleVehicles: true, isPopular: true },
      },
      locations_chauffeur_route_packages_toLocationIdTolocations: { select: { name: true, slug: true } },
    },
    orderBy: [{ isPopular: 'desc' }, { basePrice: 'asc' }],
  });

  // Group by vehicle category — min price per category
  const catMap = new Map<string, {
    cat: typeof routePackages[0]['chauffeur_vehicle_categories'];
    minPrice: number;
    routeCount: number;
  }>();
  for (const rp of routePackages) {
    const existing = catMap.get(rp.chauffeur_vehicle_categories.id);
    if (!existing) {
      catMap.set(rp.chauffeur_vehicle_categories.id, { cat: rp.chauffeur_vehicle_categories, minPrice: rp.basePrice, routeCount: 1 });
    } else {
      if (rp.basePrice < existing.minPrice) existing.minPrice = rp.basePrice;
      existing.routeCount++;
    }
  }
  const vehicleCats = Array.from(catMap.values());

  // Group popular routes by destination
  const destMap = new Map<string, { toName: string; toSlug: string; minPrice: number; estimatedKm: number; isPopular: boolean }>();
  for (const rp of routePackages) {
    const dest = rp.locations_chauffeur_route_packages_toLocationIdTolocations;
    const existing = destMap.get(dest.slug);
    if (!existing) {
      destMap.set(dest.slug, { toName: dest.name, toSlug: dest.slug, minPrice: rp.basePrice, estimatedKm: rp.estimatedKm, isPopular: rp.isPopular });
    } else {
      if (rp.basePrice < existing.minPrice) existing.minPrice = rp.basePrice;
      if (rp.isPopular) existing.isPopular = true;
    }
  }
  const popularRoutes = Array.from(destMap.values()).sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)).slice(0, 8);

  const pageFaqs = [
    { question: 'What is a one-way car rental and how does it work?', answer: 'A one-way rental lets you travel from one city to another and drop the car there — no need to return to the starting city. Pay only for the distance travelled.' },
    { question: 'Is one-way car rental cheaper than a round trip?', answer: 'For single-direction travel, one-way is cheaper as you pay per km for only one leg. Round-trip pricing includes return journey even if unused.' },
    { question: 'Is there a dead-km charge for one-way car rental?', answer: 'No dead-km charges. You pay only for the actual distance from pickup to drop. Toll and state taxes are charged extra on actuals.' },
    { question: 'Which cities can I travel to with a one-way car rental?', answer: 'We offer one-way car rental to 100+ cities across India. Popular routes include metro-to-metro and metro-to-hill-station routes.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/one-way-car-rental" className="hover:text-primary">One Way Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero */}
      <SpecialtyCarBookingHero
        service="one-way"
        city={locationName}
        citySlug={params.location.toLowerCase()}
      />

      {/* Why One Way from This City */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Choose One Way Car Rental from <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { icon: Target, title: 'No Return Needed', desc: 'Drop car at destination' },
              { icon: Wallet, title: 'Cost Effective', desc: 'Pay only one-way fare' },
              { icon: Clock, title: 'Time Saving', desc: 'Direct travel to destination' },
              { icon: Route, title: 'Flexible Routes', desc: `Travel from ${locationName} anywhere` },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300"
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                    <feature.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Cars — dynamic from chauffeur_route_packages */}
      {vehicleCats.length > 0 && (
        <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900">
                One Way Cars Available from <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-3">Choose your vehicle type for a one-way trip</p>
            </div>
            <div className={`grid gap-6 ${vehicleCats.length === 1 ? 'max-w-sm mx-auto' : vehicleCats.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {vehicleCats.map(({ cat, routeCount }, idx) => {
                let examples: string[] = [];
                try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                return (
                  <div
                    key={cat.id}
                    className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                    style={{ animation: `owc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 70}ms forwards`, opacity: 0 }}
                  >
                    <div className="relative h-40 bg-emerald-50 flex items-center justify-center">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:768px) 100vw,33vw" />
                      ) : (
                        <CarIcon className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="text-center mb-3">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                      </div>
                      {examples.length > 0 && (
                        <p className="text-sm text-gray-400 text-center mb-3">{examples.slice(0, 2).join(', ')}</p>
                      )}
                      <div className="text-center mt-auto pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">{routeCount} route{routeCount > 1 ? 's' : ''} available</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes owc-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { [style*="owc-rise"] { animation: none !important; opacity: 1 !important; } }
          ` }} />
        </section>
      )}

      {/* Popular One Way Routes — dynamic from DB */}
      {popularRoutes.length > 0 && (
        <section className="relative overflow-hidden py-16 md:py-20 bg-white">
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900">
                Popular One Way Routes from <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-3">All-inclusive · No return charges</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularRoutes.map((route) => (
                <a
                  key={route.toSlug}
                  href={`/one-way-cab/${params.location.toLowerCase()}-to-${route.toSlug}`}
                  className="group flex items-center gap-3 bg-white border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md p-4 rounded-2xl transition-all"
                >
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors duration-300">
                    <Route className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{locationName}</p>
                    <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                      {route.toName}
                    </p>
                    {route.estimatedKm > 0 && <p className="text-xs text-gray-400 mt-0.5">{route.estimatedKm} km</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Structure */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            One Way Car Rental Pricing from <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: CheckCircle2,
                title: 'Included in Price',
                items: ['Base fare for journey', 'Driver charges (if applicable)', 'Tolls and permits', 'No return charges'],
              },
              {
                icon: Receipt,
                title: 'Extra Charges',
                items: ['Fuel (actual consumption)', 'State tax if applicable', 'Driver accommodation (overnight)', 'Parking charges'],
              },
            ].map((panel) => (
              <div
                key={panel.title}
                className="rounded-[18px] border border-gray-100 shadow-sm overflow-hidden bg-white flex max-w-lg mx-auto md:max-w-none"
              >
                <div className="w-[104px] shrink-0 bg-emerald-50 flex items-center justify-center">
                  <panel.icon className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">{panel.title}</h3>
                  <ul className="space-y-2.5">
                    {panel.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            How to Book One Way Car from <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { step: '1', title: 'Select Route', desc: `Choose ${locationName} as pickup and your destination city` },
              { step: '2', title: 'Choose Car Type', desc: 'Select from hatchback, sedan, SUV based on your needs' },
              { step: '3', title: 'Book Online', desc: 'Complete booking with your details and travel date' },
              { step: '4', title: 'Pick Up', desc: `Collect your car in ${locationName} at scheduled time` },
              { step: '5', title: 'Drop Off', desc: 'Drop the car at your destination city - done!' },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                  <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-black text-lg shadow-lg shadow-emerald-200">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              One Way Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {pageFaqs.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.question}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="one-way-car-rental"
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
            serviceType: 'One Way Car Rental',
            name: `One Way Car Rental from ${locationName}`,
            description: `One-way car rental service from ${locationName}. Drop at different city.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 1299,
              highPrice: 9999,
              offerCount: 30,
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

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="one-way-car-rental"
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
