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
  return {
    title: `Hydra on Rent in ${locationName} | @₹6000/Day | TransRentals`,
    description: `Hire hydra crane in ${locationName} for loading, unloading, construction. 8T-14T capacity.`,
    alternates: { canonical: `https://transrentals.in/hydra-on-rent/${params.location}` },
  };
}

export default async function HydraLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hydra-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="hydra-on-rent" serviceName="Hydra on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

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
        badge={`Hydra in ${locationName}`}
        title="Hydra Crane on Rent"
        titleHighlight="Starting @₹6000/Day"
        description={`Hire hydra crane in ${locationName} for loading, unloading, construction work. Operator included.`}
        features={[
          { icon: 'star', text: '8T-14T', color: 'text-amber-500' },
          { icon: 'shield', text: 'Operator Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Quick Setup', color: 'text-yellow-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="amber-50"
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

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Hydra Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Hydra 8T', price: 6000 },
              { name: 'Hydra 10T', price: 7000 },
              { name: 'Hydra 12T', price: 8000 },
              { name: 'Hydra 14T', price: 9000 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">{v.name}</h3>
                <p className="text-2xl font-bold text-yellow-600 mb-4">₹{v.price.toLocaleString()}<span className="text-sm text-gray-500">/day</span></p>
                <button className="w-full bg-yellow-600 text-white py-2 rounded-lg">Get Quote</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Equipment in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/crane-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Crane</h3><p className="text-sm text-gray-600 mt-2">From ₹8,000/day</p>
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

      <FAQSection service="equipment-rental" location={locationName} />
    </>
  );
}
