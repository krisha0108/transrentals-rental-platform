import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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
    resolvePageMeta(`hydra-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('hydra-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Hydra on Rent in ${locationName} | @₹6000/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Hire hydra crane in ${locationName} for loading, unloading, construction. 8T-14T capacity.`,
    alternates: { canonical: `https://transrentals.in/hydra-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Hydra Crane on Rent in ${locationName} | TransRentals`,
      description: `Hire hydra crane in ${locationName} starting @₹3999/day for loading & construction.`,
    },
  };
}

export default async function HydraLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hydra-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="hydra-on-rent" serviceName="Hydra on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`hydra-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('hydra-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What is a hydra crane and when is it used?', answer: 'A hydra crane is a pick-and-carry crane (8T–14T) mounted on a vehicle — ideal for factory floors, construction sites, and loading operations in tight spaces.' },
    { question: 'What is the rental rate for a hydra crane per day?', answer: 'Hydra 8T starts from ₹6,000/day; Hydra 10T from ₹7,000/day; Hydra 12T from ₹8,000/day — all with certified operator included.' },
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

      <ServiceHeroWithChat
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Hydra Crane in ${locationName}`}
        title="Hydra Crane on Rent"
        titleHighlight="Loading Made Easy @₹3999/day"
        description={`Hydra crane rental in ${locationName} for construction loading, unloading, and material handling. Versatile, compact, and manoeuvrable in tight construction sites.`}
        features={[
          { icon: 'zap', text: '12-Ton Lifting Capacity', color: 'text-cyan-600' },
          { icon: 'shield', text: 'Experienced Operator', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="cyan-50"
        gradientTo="blue-50"
      />

      <section className="bg-gradient-to-br from-yellow-600 to-amber-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hydra on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹6,000/day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Equipment in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/crane-on-rent/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Crane</h3><p className="text-sm text-gray-600 mt-2">Starting ₹8,000</p>
            </Link>
            <Link href={`/jcb-on-rent/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">JCB</h3><p className="text-sm text-gray-600 mt-2">Starting ₹4,000</p>
            </Link>
            <Link href={`/excavator-on-rent/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Excavator</h3><p className="text-sm text-gray-600 mt-2">Starting ₹5,000</p>
            </Link>
            <Link href={`/equipment-rental/${params.location.toLowerCase()}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Equipment</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
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
        description={`Hire hydra crane in ${locationName} starting @₹3999/day for loading & construction.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

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
