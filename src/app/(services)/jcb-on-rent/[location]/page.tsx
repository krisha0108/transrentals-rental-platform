import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { JCBFleetGrid } from '@/components/jcb-on-rent/JCBFleetGrid';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
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

  const _seoDb = await resolvePageMeta(`jcb-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `JCB on Rent in ${locationName} | Starting from ₹2,999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent JCB backhoe loaders in ${locationName} for construction, excavation & road work. Expert operators included. Book JCB rental now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
    alternates: { canonical: `https://transrentals.in/jcb-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `JCB on Rent in ${locationName} | TransRentals`,
      description: `Hire JCB backhoe loaders in ${locationName} for construction, excavation & road work. Expert operators included.`,
    },
  };
}

export default async function JCBLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('jcb-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="jcb-on-rent" serviceName="JCB on Rent" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageFaqs = [
    { question: 'What is the daily rental rate for JCB backhoe loader?', answer: 'JCB backhoe loader (JCB 3DX) rental starts from ₹3999/day with operator. JCB 4DX and specialized models start from ₹5000/day.' },
    { question: 'Is an operator included with JCB rental?', answer: 'Yes, a certified JCB operator with valid HMV licence is always included. Independent operation without our operator is not permitted.' },
    { question: 'For what type of work is JCB rental suitable?', answer: 'JCB is used for foundation digging, road work, utility trenching, demolition, and general excavation on construction sites.' },
    { question: 'What is the minimum rental period for JCB?', answer: 'Minimum rental is 8 hours (1 shift). Multi-day and weekly contracts are available with 10–15% volume discount.' },
  ];

  const [seoData, equipmentFleet, scContent] = await Promise.all([
    resolvePageMeta(`jcb-on-rent:${params.location}`),
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

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`JCB Rental in ${locationName}`}
        title="JCB on Rent"
        titleHighlight="Certified Operators Included"
        description={`Rent JCB backhoe loaders in ${locationName} for excavation, construction, and earthmoving. Well-maintained machines with expert operators.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Expert Operators', color: 'text-yellow-600' },
          { icon: 'zap', text: 'Well Maintained', color: 'text-orange-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      {/* Applications */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            JCB Applications in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⛏️', title: 'Excavation', desc: 'Foundations, basements & trenches' },
              { icon: '🏗️', title: 'Construction', desc: 'Material handling & site prep' },
              { icon: '🛣️', title: 'Road Work', desc: 'Road laying & repair' },
              { icon: '🌳', title: 'Land Clearing', desc: 'Vegetation & leveling' },
              { icon: '🏠', title: 'Foundations', desc: 'Building base preparation' },
              { icon: '💧', title: 'Pipeline', desc: 'Trenching for pipes' },
              { icon: '🚧', title: 'Demolition', desc: 'Breaking structures' },
              { icon: '🏞️', title: 'Landscaping', desc: 'Earth moving' },
              { icon: '⚙️', title: 'Loading', desc: 'Loading trucks & materials' },
            ].map((app) => (
              <div key={app.title} className="bg-gradient-to-br from-yellow-50 to-white p-5 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl mb-2">{app.icon}</div>
                <h3 className="font-bold mb-1">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Fleet */}
      {equipmentFleet.length > 0 && (
        <JCBFleetGrid items={equipmentFleet} locationName={locationName} />
      )}

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What&apos;s Included?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🚜', title: 'Machine', desc: 'Well-maintained JCB' },
              { icon: '👷', title: 'Operator', desc: 'Expert certified operator' },
              { icon: '⛽', title: 'Fuel Options', desc: 'With/without fuel' },
              { icon: '🛠️', title: 'Tools', desc: 'Basic attachments' },
              { icon: '🚚', title: 'Transport', desc: 'Delivery to site' },
              { icon: '🛡️', title: 'Insurance', desc: 'Comprehensive coverage' },
              { icon: '⏰', title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
              { icon: '📞', title: 'Support', desc: 'On-call assistance' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-yellow-50 to-white p-5 rounded-lg border border-yellow-200 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyRentHere locationName={locationName} />

      <FAQSection service="equipment-rental" location={locationName} customFaqs={pageFaqs} />

      <NearbyLocations
        locationSlug={params.location}
        service="jcb-on-rent"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
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
        citySlug={params.location}
        faqs={pageFaqs}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
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
