import React from 'react';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { JCBFleetGrid } from '@/components/jcb-on-rent/JCBFleetGrid';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import {
  Pickaxe, Construction, Route as RouteIcon, Sprout, Home as HomeIcon, Droplet, Hammer, Mountain, Truck,
  Tractor, UserCheck, Fuel, Wrench, ShieldCheck, Clock, PhoneCall,
} from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations
// Generate static params from DATABASE - Only locations where equipment-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`jcb-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('jcb-on-rent', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `JCB on Rent in ${locationName}`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent JCB backhoe loaders in ${locationName} for construction, excavation & road work. Expert operators included. Book JCB rental now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `jcb on rent in ${locationName}`,
      `jcb rental ${locationName}`,
      `${locationName} backhoe loader rental`,
      `excavator rental ${locationName}`,
      `construction equipment ${locationName}`,
    ],
    openGraph: {
      title: `JCB on Rent in ${locationName} - TransRentals`,
      description: `Hire JCB backhoe loaders in ${locationName} for construction, excavation & road work. Certified operators included.`,
    },
    alternates: { canonical: `https://transrentals.in/jcb-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `JCB on Rent in ${locationName} | TransRentals`,
      description: `Hire JCB backhoe loaders in ${locationName} for construction, excavation & road work. Expert operators included.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What work is a JCB suited to?', answer: 'Excavation, trenching, loading, backfilling and site clearing — the 3DX and 4DX backhoe loaders handle most construction groundwork.' },
  { question: 'When will JCB rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is an operator included?', answer: 'Yes. Every JCB comes with a trained, certified operator.' },
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
            <a href="/jcb-on-rent" className="hover:text-primary">JCB on Rent</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="JCB rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="jcb-on-rent"
          serviceName="JCB on Rent"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="JCB"
        selectionDesc="JCB 3DX and 4DX backhoe loaders with certified operators."
      />
      <FAQSection service="jcb-on-rent" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function JCBLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('jcb-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'equipment-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="jcb-on-rent" serviceName="JCB on Rent" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageFaqs = [
    { question: 'How is JCB rental charged?', answer: 'JCBs are quoted per day or per shift with an operator included, and the rate depends on the machine, the site and how long you need it. Verified operators send their quotes once you share the job.' },
    { question: 'Is an operator included with JCB rental?', answer: 'Yes, a certified JCB operator with valid HMV licence is always included. Independent operation without our operator is not permitted.' },
    { question: 'For what type of work is JCB rental suitable?', answer: 'JCB is used for foundation digging, road work, utility trenching, demolition, and general excavation on construction sites.' },
    { question: 'What is the minimum rental period for JCB?', answer: 'Minimum rental is 8 hours (1 shift). Multi-day and weekly contracts are available with 10–15% volume discount.' },
  ];

  const [seoData, equipmentFleet, scContent] = await Promise.all([
    resolvePageMeta(`jcb-on-rent:${params.location.toLowerCase()}`),
    prisma.vehicle_models.findMany({
      where: {
        isActive: true,
        services_vehicle_models_serviceIdToservices: { slug: 'equipment-rental' },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sideImage: true,
        basePricePerDay: true,
        rating: true,
        tagline: true,
        highlight: true,
        brands: { select: { name: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),
    getServiceCityContent('jcb-on-rent', params.location),
  ]);


  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/jcb-on-rent" className="hover:text-primary">JCB on Rent</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <EquipmentBookingHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceType="equipment-jcb"
        badgeLabel="JCB Rental"
        bookingTitle="Book Your JCB"
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || `Rent JCB backhoe loaders in ${locationName} for excavation, construction, and earthmoving. Well-maintained machines with expert operators.`}
      />

      {/* Applications */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            JCB Applications in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Pickaxe, title: 'Excavation', desc: 'Foundations, basements & trenches' },
              { Icon: Construction, title: 'Construction', desc: 'Material handling & site prep' },
              { Icon: RouteIcon, title: 'Road Work', desc: 'Road laying & repair' },
              { Icon: Sprout, title: 'Land Clearing', desc: 'Vegetation & leveling' },
              { Icon: HomeIcon, title: 'Foundations', desc: 'Building base preparation' },
              { Icon: Droplet, title: 'Pipeline', desc: 'Trenching for pipes' },
              { Icon: Hammer, title: 'Demolition', desc: 'Breaking structures' },
              { Icon: Mountain, title: 'Landscaping', desc: 'Earth moving' },
              { Icon: Truck, title: 'Loading', desc: 'Loading trucks & materials' },
            ].map((app, idx) => (
              <div
                key={app.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100"
                style={{ animation: `jcbl-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <app.Icon className="w-5 h-5 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{app.title}</h3>
                <p className="text-xs text-gray-500">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes jcbl-rise { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="jcbl-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Equipment Fleet */}
      {equipmentFleet.length > 0 && (
        <JCBFleetGrid items={equipmentFleet} locationName={locationName} />
      )}

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            What&apos;s <span className="text-emerald-600">Included</span> in JCB Rental?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { Icon: Tractor, title: 'Machine', desc: 'Well-maintained JCB' },
              { Icon: UserCheck, title: 'Operator', desc: 'Expert certified operator' },
              { Icon: Fuel, title: 'Fuel Options', desc: 'With/without fuel' },
              { Icon: Wrench, title: 'Tools', desc: 'Basic attachments' },
              { Icon: Truck, title: 'Transport', desc: 'Delivery to site' },
              { Icon: ShieldCheck, title: 'Insurance', desc: 'Comprehensive coverage' },
              { Icon: Clock, title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
              { Icon: PhoneCall, title: 'Support', desc: 'On-call assistance' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `jcbl-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.Icon className="w-6 h-6 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="jcb-on-rent"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="jcb-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}
      <BikeServiceSchema
        serviceName="JCB on Rent"
        serviceSlug="jcb-on-rent"
        description={`Hire JCB backhoe loaders in ${locationName} for excavation, construction & road work. Certified operators included.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={pageFaqs}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="jcb-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="equipment-rental"
        parentName="Equipment Rental"
        currentSlug="jcb-on-rent"
        siblings={[
          { slug: 'jcb-on-rent', name: 'JCB on Rent' },
          { slug: 'crane-on-rent', name: 'Crane on Rent' },
          { slug: 'hydra-on-rent', name: 'Hydra on Rent' },
          { slug: 'excavator-on-rent', name: 'Excavator on Rent' },
          { slug: 'generator-on-rent', name: 'Generator on Rent' },
        ]}
      />
    </div>
  );
}
