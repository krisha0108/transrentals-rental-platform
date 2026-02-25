import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where tempo-traveller is available
export async function generateStaticParams() {
  return getServiceLocations('tempo-traveller');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  return {
    title: `20 Seater Tempo Traveller in ${locationName} | @₹22/km | TransRentals`,
    description: `Book 20 seater tempo traveller in ${locationName}. AC/Non-AC with driver for large groups.`,
    alternates: { canonical: `https://transrentals.in/20-seater-tempo-traveller/${params.location}` },
  };
}

export default async function TwentySeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('20-seater-tempo-traveller', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="20-seater-tempo-traveller" serviceName="20 Seater Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/20-seater-tempo-traveller" className="hover:text-orange-700">20 Seater</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`20 Seater in ${locationName}`}
        title="20 Seater Tempo Traveller"
        titleHighlight="Starting @₹22/km"
        description={`Hire 20 seater tempo traveller in ${locationName} for large groups. AC/Non-AC with driver.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '20 Seats', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      <section className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">20 Seater Tempo Traveller in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹22/km</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">20 Seats</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">20 Seater Options in {locationName}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: '20 Seater Non-AC', price: 22 },
              { name: '20 Seater AC', price: 28 },
              { name: '20 Seater Deluxe', price: 34 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">{v.name}</h3>
                <p className="text-3xl font-bold text-orange-600 mb-4">₹{v.price}<span className="text-sm text-gray-500">/km</span></p>
                <button className="w-full bg-orange-600 text-white py-2 rounded-lg">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/12-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">12 Seater</h3><p className="text-sm text-gray-600 mt-2">From ₹18/km</p>
            </Link>
            <Link href={`/17-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">17 Seater</h3><p className="text-sm text-gray-600 mt-2">From ₹20/km</p>
            </Link>
            <Link href={`/26-seater-bus/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">26 Seater Bus</h3><p className="text-sm text-gray-600 mt-2">From ₹28/km</p>
            </Link>
            <Link href={`/bus-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Buses</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" location={locationName} />
    </>
  );
}
