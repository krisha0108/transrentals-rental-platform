import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Wrench, Construction, Mountain, LayoutGrid, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
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
    resolvePageMeta(`generator-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('generator-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Generator on Rent in ${locationName} | DG Set @₹1500/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Hire generator in ${locationName} for events, construction, industrial backup. 5KVA to 500KVA.`,
    alternates: { canonical: `https://transrentals.in/generator-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Generator on Rent in ${locationName} | TransRentals`,
      description: `Hire generator in ${locationName} starting @₹999/day. Silent DG sets for events & construction.`,
    },
  };
}

export default async function GeneratorLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('generator-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="generator-on-rent" serviceName="Generator on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`generator-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('generator-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What KVA generator sizes are available on rent?', answer: 'We offer 15 KVA, 25 KVA, 62.5 KVA, 125 KVA, and 250 KVA silent diesel generators for events, construction, and office backup.' },
    { question: 'Is the generator rental inclusive of fuel?', answer: 'Fuel is charged separately at actuals. We deliver with a full tank and bill fuel consumption on return or daily based on contract type.' },
    { question: 'Can I rent a generator for a wedding or outdoor event?', answer: 'Yes, silent DG sets are perfect for weddings and outdoor events. We provide delivery, installation, and a technician on-site for the event duration.' },
    { question: 'What is the daily rental rate for a generator?', answer: '15 KVA generator starts from ₹3,000/day; 62.5 KVA from ₹7,000/day; 125 KVA from ₹12,000/day. Monthly rates available with 20% discount.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/generator-on-rent" className="hover:text-blue-700">Generator on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <EquipmentBookingHero
        city={locationName}
        citySlug={params.location}
        serviceType="equipment-generator"
        badgeLabel="Generator Rental"
        bookingTitle="Book Your Generator"
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || `Never face power cuts in ${locationName}. Silent DG sets for events, construction sites, and offices. 5kVA to 250kVA generators with instant delivery and setup.`}
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Generator on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Silent DG sets for events, construction sites, and offices — instant delivery &amp; setup.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Technician</p>
                  <p className="text-lg font-black text-gray-900">On-Site</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Sets</p>
                  <p className="text-lg font-black text-gray-900">Silent DG</p>
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
              { href: `/jcb-on-rent/${params.location.toLowerCase()}`, icon: Wrench, title: 'JCB', desc: 'Backhoe loaders' },
              { href: `/crane-on-rent/${params.location.toLowerCase()}`, icon: Construction, title: 'Crane', desc: 'Mobile & tower cranes' },
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
              serviceSlug="generator-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Generator on Rent"
        serviceSlug="generator-on-rent"
        description={`Hire generator in ${locationName} starting @₹999/day. Silent DG sets for events & construction.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="generator-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="equipment-rental"
        parentName="Equipment Rental"
        currentSlug="generator-on-rent"
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
