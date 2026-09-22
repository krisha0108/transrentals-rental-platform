import React from 'react';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Construction, Wrench, Mountain, LayoutGrid, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where equipment-rental is available
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
    resolvePageMeta(`hydra-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('hydra-on-rent', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Hydra on Rent in ${locationName}`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Hire hydra crane in ${locationName} for loading, unloading, construction. 8T-14T capacity.`,
    alternates: { canonical: `https://transrentals.in/hydra-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Hydra Crane on Rent in ${locationName} | TransRentals`,
      description: ``,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What is a hydra crane used for?', answer: 'Pick-and-carry lifting on construction sites, factory loading and material shifting, in 8T, 10T and 12T capacities.' },
  { question: 'When will hydra rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is an operator included?', answer: 'Yes. Every hydra comes with a trained, certified operator.' },
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
            <a href="/hydra-on-rent" className="hover:text-primary">Hydra on Rent</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="hydra crane rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="hydra-on-rent"
          serviceName="Hydra on Rent"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="hydra crane"
        selectionDesc="8T, 10T and 12T hydra cranes for loading and site work."
      />
      <FAQSection service="hydra-on-rent" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function HydraLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hydra-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'equipment-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="hydra-on-rent" serviceName="Hydra on Rent" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`hydra-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('hydra-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What is a hydra crane and when is it used?', answer: 'A hydra crane is a pick-and-carry crane (8T–14T) mounted on a vehicle — ideal for factory floors, construction sites, and loading operations in tight spaces.' },
    { question: 'How is hydra crane rental charged?', answer: 'Hydras are quoted per day or per shift by capacity — 8T, 10T or 12T — with an operator included. Verified operators quote once you share the site and duration.' },
    { question: 'Can a hydra crane be used indoors or in tight spaces?', answer: 'Yes — hydra cranes are specifically designed for tight spaces like warehouse floors, factory bays, and areas inaccessible to mobile cranes.' },
    { question: 'Is the hydra crane available for weekly or monthly rental?', answer: 'Yes, weekly and monthly contracts are available with up to 20% discount. Priority deployment and dedicated operator for long-term hire.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-yellow-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hydra-on-rent" className="hover:text-yellow-700">Hydra on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <EquipmentBookingHero
        city={locationName}
        citySlug={params.location}
        serviceType="equipment-hydra"
        badgeLabel="Hydra Crane"
        bookingTitle="Book Your Hydra"
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || `Hydra crane rental in ${locationName} for construction loading, unloading, and material handling. Versatile, compact, and manoeuvrable in tight construction sites.`}
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Hydra on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Compact pick-and-carry cranes for tight sites, with certified operators.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Operators</p>
                  <p className="text-lg font-black text-gray-900">Certified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Coverage</p>
                  <p className="text-lg font-black text-gray-900">Insured</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 bg-gray-50">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other Equipment in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/crane-on-rent/${params.location.toLowerCase()}`, icon: Construction, title: 'Crane', desc: 'Mobile & tower cranes' },
              { href: `/jcb-on-rent/${params.location.toLowerCase()}`, icon: Wrench, title: 'JCB', desc: 'Backhoe loaders' },
              { href: `/excavator-on-rent/${params.location.toLowerCase()}`, icon: Mountain, title: 'Excavator', desc: 'Digging & trenching' },
              { href: `/equipment-rental/${params.location.toLowerCase()}`, icon: LayoutGrid, title: 'All Equipment', desc: 'View all options' },
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
              serviceSlug="hydra-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Hydra Crane on Rent"
        serviceSlug="hydra-on-rent"
        description={`Hire hydra crane in ${locationName} for loading & construction.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="hydra-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="equipment-rental"
        parentName="Equipment Rental"
        currentSlug="hydra-on-rent"
        siblings={[
          { slug: 'jcb-on-rent', name: 'JCB on Rent' },
          { slug: 'crane-on-rent', name: 'Crane on Rent' },
          { slug: 'hydra-on-rent', name: 'Hydra on Rent' },
          { slug: 'excavator-on-rent', name: 'Excavator on Rent' },
          { slug: 'generator-on-rent', name: 'Generator on Rent' },
        ]}
      />
    </>
  );
}
