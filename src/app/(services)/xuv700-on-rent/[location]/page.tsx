import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ShieldCheck, Car, LayoutGrid, ArrowRight } from 'lucide-react';
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
import { formatPriceHighlight } from '@/lib/utils';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

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
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`xuv700-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('xuv700-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || formatPriceHighlight(`XUV700 on Rent in ${locationName} | TransRentals`),
    description: scContent?.metaDescription || _seoDb?.metaDescription || formatPriceHighlight(`Rent Mahindra XUV700 without driver in ${locationName}. India's safest SUV with ADAS.`),
    alternates: { canonical: `https://transrentals.in/xuv700-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `XUV700 on Rent in ${locationName} | TransRentals`,
      description: `Rent Mahindra XUV700 without driver in ${locationName} from verified partners.`,
    },
  };
}

const launchFaqs = [
  { question: 'What documents do I need to rent?', answer: 'A valid driving licence and one government photo ID (Aadhaar, passport or voter card).' },
  { question: 'Is a security deposit required?', answer: 'Yes, a refundable deposit is collected at pickup and returned when you bring the car back.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, our partners provide 24/7 roadside assistance for the length of your rental.' },
];

export default async function XUV700LocationPage({ params }: PageProps) {
  // Availability follows self-drive-car-rentals: there is no services row under
  // "xuv700-on-rent", and an unknown slug used to read as "available
  // everywhere", so this page could never be switched off for a city.
  // One admin screen now governs the whole self drive group.
  const pageContext = await resolveServicePage('xuv700-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'self-drive-car-rentals',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="xuv700-on-rent" serviceName="XUV700 on Rent" />;

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
              <a href="/xuv700-on-rent" className="hover:text-primary">XUV700 on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="XUV700 rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="xuv700-on-rent"
            serviceName="XUV700 on Rent"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} vehicleNoun="car" selectionDesc="Mahindra XUV700, in the trims our partners keep on the road." />
        <FAQSection service="xuv700-on-rent" location={cityName} customFaqs={launchFaqs} />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`xuv700-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('xuv700-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is Mahindra XUV700 available for self-drive without a chauffeur?', answer: 'Yes, Mahindra XUV700 AX5 and AX7 are available for self-drive with ADAS features and panoramic sunroof.' },
    { question: 'Does the XUV700 rental include ADAS features?', answer: 'Yes, the rental XUV700 includes ADAS (auto emergency braking, lane keep assist) — all systems are active and tested before delivery.' },
    { question: 'Can I rent XUV700 for a 7-seater family trip?', answer: 'Absolutely — XUV700 is a true 7-seater SUV with 3 rows. Ideal for family vacations and long-distance road trips.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/xuv700-on-rent" className="hover:text-red-700">XUV700 on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        vehicleName="Mahindra XUV700"
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                XUV700 on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Self-drive Mahindra XUV700. India&apos;s safest SUV with ADAS.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Safety</p>
                  <p className="text-lg font-black text-gray-900">5-Star GNCAP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other SUVs in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/scorpio-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'Scorpio', desc: 'Rugged 4x4 SUV' },
              { href: `/fortuner-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'Fortuner', desc: 'Premium luxury SUV' },
              { href: `/creta-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'Creta', desc: 'Premium mid-size SUV' },
              { href: `/self-drive-suv-rental/${params.location.toLowerCase()}`, icon: LayoutGrid, title: 'All SUVs', desc: 'View all options' },
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
              citySlug={params.location.toLowerCase()}
              serviceSlug="xuv700-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="XUV700 on Rent"
        serviceSlug="xuv700-on-rent"
        description={`Rent Mahindra XUV700 without driver in ${locationName}, all from verified partners.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
        hidePrices
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      {/* Available cars — purely whatever the admin has published for
          this city. Nothing hardcoded, and the section renders nothing
          at all when the city has no published fleet. */}
      <LazyServiceFleetDisplay
        serviceSlug="xuv700-on-rent"
        locationSlug={params.location}
        title={`XUV700 Cars Available in ${locationName}`}
        showCategories={true}
        limit={12}
        hidePrices
      />

      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="xuv700-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="xuv700-on-rent"
        siblings={[
          { slug: 'hourly-car-rental', name: 'Hourly Car Rental' },
          { slug: 'self-drive-suv-rental', name: 'Self Drive SUV' },
          { slug: 'self-drive-sedan-rental', name: 'Self Drive Sedan' },
          { slug: 'self-drive-hatchback-rental', name: 'Self Drive Hatchback' },
          { slug: 'swift-on-rent', name: 'Swift on Rent' },
          { slug: 'creta-on-rent', name: 'Creta on Rent' },
          { slug: 'innova-on-rent', name: 'Innova on Rent' },
          { slug: 'fortuner-on-rent', name: 'Fortuner on Rent' },
          { slug: 'seltos-on-rent', name: 'Seltos on Rent' },
          { slug: 'scorpio-on-rent', name: 'Scorpio on Rent' },
        ]}
      />
    </>
  );
}
