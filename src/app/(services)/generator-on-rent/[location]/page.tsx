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
  const _seoDb = await resolvePageMeta(`generator-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Generator on Rent in ${locationName} | DG Set @₹1500/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Hire generator in ${locationName} for events, construction, industrial backup. 5KVA to 500KVA.`,
    alternates: { canonical: `https://transrentals.in/generator-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Generator on Rent in ${locationName} | TransRentals`,
      description: `Hire generator in ${locationName} starting @₹999/day. Silent DG sets for events & construction.`,
    },
  };
}

export default async function GeneratorLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('generator-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="generator-on-rent" serviceName="Generator on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`generator-on-rent:${params.location}`);

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

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Generator Rental in ${locationName}`}
        title="Generator on Rent"
        titleHighlight="Power Backup @₹999/day"
        description={`Never face power cuts in ${locationName}. Silent DG sets for events, construction sites, and offices. 5kVA to 250kVA generators with instant delivery and setup.`}
        features={[
          { icon: 'zap', text: '5kVA to 250kVA', color: 'text-yellow-600' },
          { icon: 'shield', text: 'Silent DG Sets', color: 'text-emerald-600' },
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="lime-50"
      />

      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Generator on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,500/day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Equipment in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/jcb-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">JCB</h3><p className="text-sm text-gray-600 mt-2">From ₹4,000/day</p>
            </Link>
            <Link href={`/crane-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Crane</h3><p className="text-sm text-gray-600 mt-2">From ₹8,000/day</p>
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

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="generator-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="equipment-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Generator on Rent"
        serviceSlug="generator-on-rent"
        description={`Hire generator in ${locationName} starting @₹999/day. Silent DG sets for events & construction.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
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
