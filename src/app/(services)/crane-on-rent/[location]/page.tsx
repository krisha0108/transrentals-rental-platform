import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where equipment-rental is available
export async function generateStaticParams() {
  return getServiceLocations('equipment-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const _seoDb = await resolvePageMeta(`crane-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Crane on Rent in ${locationName} | @₹8000/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Hire crane in ${locationName} for construction & industrial projects. Mobile, tower, hydra cranes available.`,
    alternates: { canonical: `https://transrentals.in/crane-on-rent/${params.location}` },
  };
}

export default async function CraneLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('crane-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="crane-on-rent" serviceName="Crane on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

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
        badge={`Crane in ${locationName}`}
        title="Crane on Rent"
        titleHighlight="Starting @₹8000/Day"
        description={`Hire crane in ${locationName} for construction, industrial projects. All capacities with trained operators.`}
        features={[
          { icon: 'star', text: 'All Capacities', color: 'text-amber-500' },
          { icon: 'shield', text: 'Operator Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Pan India', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="yellow-50"
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

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Crane Options in {locationName}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Hydra Crane (12T)', price: 8000 },
              { name: 'Mobile Crane (20T)', price: 12000 },
              { name: 'Mobile Crane (50T)', price: 25000 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">{v.name}</h3>
                <p className="text-2xl font-bold text-orange-600 mb-4">₹{v.price.toLocaleString()}<span className="text-sm text-gray-500">/day</span></p>
                <button className="w-full bg-orange-600 text-white py-2 rounded-lg">Get Quote</button>
              </div>
            ))}
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

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="crane-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="equipment-rental" location={locationName} />
    </>
  );
}
