import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where equipment-rental is available
export async function generateStaticParams() {
  return getServiceLocations('equipment-rental');
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
    title: _seoDb?.metaTitle || `JCB on Rent in ${locationName} | Backhoe Loader Rental @₹2999/Day | TransRentals`,
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
      description: `Rent JCB backhoe loaders in ${locationName} starting @₹2999/day with operators.`,
    },
  };
}

export default async function JCBLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('jcb-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="jcb-on-rent" serviceName="JCB on Rent" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [seoData, equipmentFleet] = await Promise.all([
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
        titleHighlight="Starting @₹2999/day"
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
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              Equipment Available in {locationName}
            </h2>
            <p className="text-center text-gray-500 mb-8">Choose from our verified fleet</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {equipmentFleet.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition border border-yellow-200 overflow-hidden flex flex-col">
                  <div className="relative h-44 bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                    {item.sideImage ? (
                      <Image
                        src={item.sideImage}
                        alt={item.name}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <span className="text-7xl">🚜</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                      {item.rating && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                          ★ {item.rating}
                        </span>
                      )}
                    </div>
                    {item.brands?.name && (
                      <p className="text-xs text-gray-400 mb-1">{item.brands.name}</p>
                    )}
                    {item.tagline && (
                      <p className="text-sm text-gray-500 mb-3 flex-1">{item.tagline}</p>
                    )}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      {item.basePricePerDay ? (
                        <p className="text-lg font-bold text-primary">
                          <span className="text-xs font-normal text-gray-500">Starting from </span>
                          ₹{item.basePricePerDay.toLocaleString('en-IN')}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-primary">Get Quote</p>
                      )}
                      {item.highlight && (
                        <p className="text-xs text-green-600 mt-1">{item.highlight}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">* Price may vary based on vendor quotes</p>
          </div>
        </section>
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

      <FAQSection service="equipment-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="jcb-on-rent"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="jcb-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
    </div>
  );
}
