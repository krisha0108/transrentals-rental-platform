import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    resolvePageMeta(`crane-on-rent:${params.location}`),
    getServiceCityContent('crane-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Crane on Rent in ${locationName} | @₹8000/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Hire crane in ${locationName} for construction & industrial projects. Mobile, tower, hydra cranes available.`,
    alternates: { canonical: `https://transrentals.in/crane-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Crane on Rent in ${locationName} | TransRentals`,
      description: `Hire crane in ${locationName} starting @₹4999/day. Mobile, tower, hydra cranes with operators.`,
    },
  };
}

export default async function CraneLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('crane-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="crane-on-rent" serviceName="Crane on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`crane-on-rent:${params.location}`),
    getServiceCityContent('crane-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What types of cranes are available on rent?', answer: 'We offer Hydra (12T), Mobile Crane (20T–50T), Pick-and-Carry Crane, and Tower Crane for construction and industrial projects.' },
    { question: 'Is an operator included with crane rental?', answer: 'Yes, a certified crane operator with HMV licence and safety training is mandatory and included in all crane rental packages.' },
    { question: 'What is the daily rental rate for a mobile crane?', answer: 'Mobile crane (20T) starts from ₹12,000/day; 50-ton crane from ₹25,000/day. Hydra crane (12T) starts from ₹8,000/day.' },
    { question: 'Can I rent a crane for a single day?', answer: 'Yes, minimum 1-day (8 hours) rental is available. For weekend or holiday work, advance booking of at least 48 hours is required.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/crane-on-rent" className="hover:text-orange-700">Crane on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Crane Rental in ${locationName}`}
        title="Crane on Rent"
        titleHighlight="Heavy Lifting @₹4999/day"
        description={`Industrial-grade crane rental in ${locationName} for construction sites, factory installations, and heavy lifting projects. Mobile and tower cranes with certified operators.`}
        features={[
          { icon: 'zap', text: 'Up to 50-Ton Lift', color: 'text-yellow-600' },
          { icon: 'shield', text: 'Certified Operator', color: 'text-emerald-600' },
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      <section className="bg-gradient-to-br from-orange-600 to-yellow-600 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Crane on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹8,000/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Capacity</p>
              <p className="text-xl font-bold">10T-100T+</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Equipment in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/hydra-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Hydra</h3><p className="text-sm text-gray-600 mt-2">From ₹6,000/day</p>
            </Link>
            <Link href={`/jcb-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">JCB</h3><p className="text-sm text-gray-600 mt-2">From ₹4,000/day</p>
            </Link>
            <Link href={`/excavator-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Excavator</h3><p className="text-sm text-gray-600 mt-2">From ₹5,000/day</p>
            </Link>
            <Link href={`/equipment-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Equipment</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="crane-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Crane on Rent"
        serviceSlug="crane-on-rent"
        description={`Hire crane in ${locationName} starting @₹4999/day. Mobile, tower, hydra cranes with operators.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="equipment-rental"
        parentName="Equipment Rental"
        currentSlug="crane-on-rent"
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
