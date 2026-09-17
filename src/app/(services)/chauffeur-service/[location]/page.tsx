import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { ChauffeurPackages } from '@/components/chauffeur-service/ChauffeurPackages';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import {
  CheckCircle2, GraduationCap, Map as MapIcon, UserCog, Briefcase, Heart, PartyPopper, Wrench,
} from 'lucide-react';

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
    resolvePageMeta(`chauffeur-service:${params.location.toLowerCase()}`),
    getServiceCityContent('chauffeur-service', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Chauffeur Service ${locationName} | Driver on Hire | Car Driver`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Hire professional chauffeur in ${locationName}. Driver on hire for daily use, outstation.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `chauffeur service ${locationName.toLowerCase()}`,
      `driver on hire ${locationName.toLowerCase()}`,
      `car driver ${locationName.toLowerCase()}`,
      `professional driver ${locationName.toLowerCase()}`,
      `personal driver ${locationName.toLowerCase()}`,
      `driver booking ${locationName.toLowerCase()}`,
      `chauffeur ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `chauffeur service ${k}`),
    ],
    openGraph: {
      title: `Chauffeur Service in ${locationName} - Driver on Hire`,
      description: `Book professional chauffeur in ${locationName}. Verified drivers for daily & outstation.`,
      url: `https://transrentals.in/chauffeur-service/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/chauffeur-service/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Chauffeur Service in ${locationName} | TransRentals`,
      description: `Hire professional chauffeur in ${locationName}.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What does a chauffeur booking include?', answer: 'A verified professional driver for your car or ours, for daily commutes, full-day duty or outstation trips.' },
  { question: 'When will chauffeur service open in my city?', answer: 'We onboard drivers city by city and a city goes live as soon as verified drivers are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Are the drivers verified?', answer: 'Yes. Every chauffeur is police-verified, licence-checked and rated by previous customers before being listed.' },
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
            <a href="/chauffeur-service" className="hover:text-primary">Chauffeur Service</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="chauffeur services" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="chauffeur-service"
          serviceName="Chauffeur Service"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="car"
        selectionDesc="Verified, background-checked drivers for daily, weekly and outstation use."
      />
      <FAQSection service="chauffeur-service" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function ChauffeurServiceLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('chauffeur-service', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="chauffeur-service" serviceName="Chauffeur Service" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  // Fetch dynamic package data
  const [locationId, carRentalServiceId, scContent] = await Promise.all([
    getLocationId(params.location),
    getCarRentalServiceId(),
    getServiceCityContent('chauffeur-service', params.location),
  ]);

  const [localPackages, outstationPricing] = await Promise.all([
    carRentalServiceId ? prisma.chauffeur_local_packages.findMany({
      where: {
        isActive: true,
        chauffeur_vehicle_categories: { serviceId: carRentalServiceId, isActive: true },
        ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null }),
      },
      select: {
        id: true, hours: true, kms: true, basePrice: true,
        extraKmCharge: true, isPopular: true,
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
        },
        locations: { select: { name: true } },
      },
      orderBy: [{ chauffeur_vehicle_categories: { displayOrder: 'asc' } }, { hours: 'asc' }],
    }) : [],
    locationId ? prisma.chauffeur_city_pricing.findMany({
      where: { isActive: true, locations: { slug: params.location } },
      select: {
        vehicleCategoryId: true, baseKmRate: true, minKmPerDay: true, driverDayAllowance: true,
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
        },
      },
      orderBy: { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
    }) : [],
  ]);

  // Group local packages by hours
  const packagesWithLocation = localPackages.map((pkg) => ({
    ...pkg,
    locationName: (pkg.locations as { name: string } | null)?.name ?? null,
  }));

  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof packagesWithLocation }>();
  for (const pkg of packagesWithLocation) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    else existing.vehicles.push(pkg);
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  const pageFaqs = [
    { question: 'What is a chauffeur service and how is it different from a cab?', answer: 'A chauffeur service provides a professional, uniformed driver with a premium vehicle for personal use. Unlike cabs, you book for a fixed duration — not a fixed route.' },
    { question: 'Can I book a chauffeur for the full day in the city?', answer: 'Yes, full-day packages (8 hours / 80 km) are available. Additional hours and km can be added at a per-unit rate.' },
    { question: 'Is the chauffeur driver police-verified?', answer: 'Yes, all TransRentals chauffeurs are police-verified, background-checked, and trained in professional conduct and safe driving.' },
    { question: 'Can I hire a chauffeur just for airport drop?', answer: 'Yes, airport pick-up and drop packages are available with meet-and-greet service, luggage assistance, and real-time flight tracking.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/chauffeur-service" className="hover:text-primary">Chauffeur Service</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceSlug="car-rental"
        serviceTitle="Chauffeur Service"
      />

      {/* Why Chauffeur Service */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Hire Chauffeur in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: CheckCircle2, title: 'Verified Drivers', desc: `Police verified in ${locationName}` },
              { Icon: GraduationCap, title: 'Experienced', desc: '5+ years experience' },
              { Icon: MapIcon, title: 'Local Knowledge', desc: `Know ${locationName} routes` },
              { Icon: UserCog, title: 'Professional', desc: 'Well-groomed & trained' },
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

      {/* Chauffeur Packages — dynamic */}
      <ChauffeurPackages
        hidePrices
        hourGroups={hourGroups}
        outstationPricing={outstationPricing}
        locationName={locationName}
      />

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for Your Needs in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Briefcase, occasion: 'Daily Commute', desc: `Office in ${locationName}` },
              { Icon: MapIcon, occasion: 'Outstation', desc: `Trips from ${locationName}` },
              { Icon: Heart, occasion: 'Weddings', desc: 'Wedding car driver' },
              { Icon: PartyPopper, occasion: 'Events', desc: 'Special occasions' },
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

      {/* Driver Qualities */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Our Chauffeurs in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Professional Skills</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  '5+ years experience',
                  'Valid driving license',
                  'Know all car types',
                  'Local route knowledge',
                  'Safe driving skills',
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
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Personal Qualities</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Police verified',
                  'Well-groomed',
                  'Punctual & reliable',
                  'Good communication',
                  'Courteous behavior',
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

      {/* How to Book */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            How to Hire Chauffeur in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose Package', desc: 'Daily, outstation, or monthly' },
              { step: '2', title: 'Provide Details', desc: `Car type & location in ${locationName}` },
              { step: '3', title: 'Verify Driver', desc: 'Check driver documents' },
              { step: '4', title: 'Confirm Booking', desc: 'Pay & confirm' },
              { step: '5', title: 'Driver Arrives', desc: 'Professional chauffeur at service' },
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
              serviceSlug="chauffeur-service"
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
            serviceType: 'Chauffeur Service',
            name: `Chauffeur Service in ${locationName}`,
            description: `Hire professional chauffeur in ${locationName}. Verified drivers for daily & outstation use.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 599,
              highPrice: 2500,
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

      <FAQSection service="chauffeur-service" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="chauffeur-service"
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
