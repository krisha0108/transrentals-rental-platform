import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { LazyServiceFleetDisplay } from '@/components/services/LazyServiceFleetDisplay';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { stripPricesFromText } from '@/lib/content/strip-prices';
import { StateServicePage } from '@/components/location/StateServicePage';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Wallet, Car, Truck, Users, LayoutGrid, ArrowRight, Mountain, Luggage } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where self-drive-car-rentals is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-suv-rental:${params.location}`),
    getServiceCityContent('self-drive-suv-rental', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive SUV Rental in ${locationName} | Rent SUV | TransRentals | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent SUV without driver in ${locationName}. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV for road trips & family travel.`),
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `self drive suv rental ${locationName}`,
      `suv on rent ${locationName}`,
      `rent suv without driver ${locationName}`,
      `creta on rent ${locationName}`,
      `suv rental ${locationName}`,
    ],
    openGraph: {
      title: `Self Drive SUV Rental in ${locationName} | TransRentals`,
      description: `Rent SUVs without driver in ${locationName}. Creta, Seltos, Fortuner available.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-suv-rental/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-suv-rental/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Self Drive SUV Rental in ${locationName} | TransRentals`,
      description: `Rent SUV without driver in ${locationName} from verified partners.`,
    },
  };
}


const launchFaqs = [
  { question: 'What documents do I need to rent?', answer: 'A valid driving licence and one government photo ID (Aadhaar, passport or voter card).' },
  { question: 'Is a security deposit required?', answer: 'Yes, a refundable deposit is collected at pickup and returned when you bring the car back.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, our partners provide 24/7 roadside assistance for the length of your rental.' },
];

export default async function SUVRentalLocationPage({ params }: PageProps) {
  // Availability follows self-drive-car-rentals: there is no services row under
  // "self-drive-suv-rental", and an unknown slug used to read as "available
  // everywhere", so this page could never be switched off for a city.
  // One admin screen now governs the whole self drive group.
  const pageContext = await resolveServicePage('self-drive-suv-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'self-drive-car-rentals',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-suv-rental" serviceName="Self Drive SUV Rental" />;

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
              <a href="/self-drive-suv-rental" className="hover:text-primary">Self Drive SUV Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="self drive SUV rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="self-drive-suv-rental"
            serviceName="Self Drive SUV Rental"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} vehicleNoun="car" selectionDesc="Creta, Seltos, XUV700, Scorpio and more — the full SUV range." />
        <FAQSection service="self-drive-suv-rental" location={cityName} customFaqs={launchFaqs} />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-suv-rental:${params.location}`),
    getServiceCityContent('self-drive-suv-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which SUVs are available for self-drive rental?', answer: 'We offer Hyundai Creta, Kia Seltos, MG Hector, XUV700, and Fortuner — top SUVs with automatic and manual transmission options.' },
    { question: 'Do I need a special licence to drive a self-drive SUV?', answer: 'A standard LMV car licence is sufficient for all SUVs except commercial-category vehicles. Minimum 1 year of licence validity required.' },
    { question: 'Is unlimited km allowed in self-drive SUV rental?', answer: 'We offer both limited and unlimited km packages.' },
    { question: 'What happens if the SUV meets with an accident?', answer: 'All SUVs are insured. Comprehensive damage waiver is available as an add-on. A damage liability applies without the waiver.' },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/self-drive-suv-rental" className="hover:text-blue-700">Self Drive SUV Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Self Drive SUV"
      />

      {/* Hero */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Self Drive SUV Rental in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Drive yourself in a powerful SUV. Perfect for {locationName} roads and beyond.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Available</p>
                  <p className="text-lg font-black text-gray-900">6+ Models</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Seating</p>
                  <p className="text-lg font-black text-gray-900">5-7 Seater</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Rent SUV in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Mountain, title: 'Road Trips', desc: `Explore around ${locationName}` },
              { Icon: Users, title: 'Family Travel', desc: 'Spacious & comfortable' },
              { Icon: Luggage, title: 'Luggage Space', desc: 'Large boot capacity' },
              { Icon: Truck, title: 'Any Terrain', desc: 'Highways, hills, off-road' },
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

      {/* Other Options */}
      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other Self Drive Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[

              { href: `/self-drive-car-rentals/${params.location}`, icon: LayoutGrid, title: 'All Self Drive Cars', desc: 'View all options' },
            ].map((opt) => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group flex flex-col items-center text-center bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-8 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <opt.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{opt.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {opt.desc}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="self-drive-suv-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}

      <BikeServiceSchema
        serviceName="Self Drive SUV Rental"
        serviceSlug="self-drive-suv-rental"
        description={`Creta, Seltos, Fortuner available.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
        hidePrices
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      {/* Available cars — purely whatever the admin has published for
          this city. Nothing hardcoded, and the section renders nothing
          at all when the city has no published fleet. */}
      <LazyServiceFleetDisplay
        serviceSlug="self-drive-suv-rental"
        locationSlug={params.location}
        title={`Self Drive SUVs Available in ${locationName}`}
        showCategories={true}
        limit={12}
        hidePrices
      />

      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="self-drive-suv-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="self-drive-suv-rental"
        siblings={[
          { slug: 'hourly-car-rental', name: 'Hourly Car Rental' },
          { slug: 'self-drive-sedan-rental', name: 'Self Drive Sedan' },
          { slug: 'self-drive-hatchback-rental', name: 'Self Drive Hatchback' },
          { slug: 'swift-on-rent', name: 'Swift on Rent' },
          { slug: 'creta-on-rent', name: 'Creta on Rent' },
          { slug: 'innova-on-rent', name: 'Innova on Rent' },
          { slug: 'fortuner-on-rent', name: 'Fortuner on Rent' },
          { slug: 'seltos-on-rent', name: 'Seltos on Rent' },
          { slug: 'xuv700-on-rent', name: 'XUV700 on Rent' },
          { slug: 'scorpio-on-rent', name: 'Scorpio on Rent' },
        ]}
      />
    </>
  );
}
