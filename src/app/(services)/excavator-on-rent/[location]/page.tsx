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
  const _seoDb = await resolvePageMeta(`excavator-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Excavator on Rent in ${locationName} | @₹5000/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Hire excavator in ${locationName} for digging, trenching, construction. Mini to large excavators.`,
    alternates: { canonical: `https://transrentals.in/excavator-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Excavator on Rent in ${locationName} | TransRentals`,
      description: `Hire excavator in ${locationName} starting @₹3499/day. Mini to large excavators with operators.`,
    },
  };
}

export default async function ExcavatorLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('excavator-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="excavator-on-rent" serviceName="Excavator on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`excavator-on-rent:${params.location}`),
    getServiceCityContent('excavator-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What excavator sizes are available on rent?', answer: 'We offer Mini Excavator (3T), standard excavator (11T JCB 110), and large excavator (20T JCB 200) for all excavation needs.' },
    { question: 'What is the daily rate for renting an excavator?', answer: 'Mini excavator from ₹5,000/day; standard 11T excavator from ₹9,000/day; 20T excavator from ₹12,000/day — operator included.' },
    { question: 'Is the excavator operator trained and certified?', answer: 'Yes, all our excavator operators hold valid HMV licences and have minimum 3 years of experience on construction and mining sites.' },
    { question: 'Can the excavator be transported to a remote project site?', answer: 'Yes, we arrange trailer transport of excavators to your site. Transportation cost depends on site distance and road conditions.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/excavator-on-rent" className="hover:text-amber-700">Excavator on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Excavator Rental in ${locationName}`}
        title="Excavator on Rent"
        titleHighlight="Earthmoving Power @₹3499/day"
        description={`Rent excavators in ${locationName} for foundation digging, road construction, mining, and demolition. Mini to large excavators available with skilled operators.`}
        features={[
          { icon: 'zap', text: 'Mini to Large Excavators', color: 'text-orange-600' },
          { icon: 'shield', text: 'Skilled Operators', color: 'text-emerald-600' },
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      <section className="bg-gradient-to-br from-amber-600 to-yellow-600 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Excavator on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹5,000/day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Equipment in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/jcb-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">JCB</h3><p className="text-sm text-gray-600 mt-2">Starting ₹4,000</p>
            </Link>
            <Link href={`/crane-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Crane</h3><p className="text-sm text-gray-600 mt-2">Starting ₹8,000</p>
            </Link>
            <Link href={`/hydra-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Hydra</h3><p className="text-sm text-gray-600 mt-2">Starting ₹6,000</p>
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
              serviceSlug="excavator-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <FAQSection service="equipment-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Excavator on Rent"
        serviceSlug="excavator-on-rent"
        description={`Hire excavator in ${locationName} starting @₹3499/day. Mini to large excavators with operators.`}
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
        currentSlug="excavator-on-rent"
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
