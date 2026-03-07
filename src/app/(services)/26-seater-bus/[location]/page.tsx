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
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where bus-rental is available
export async function generateStaticParams() {
  return getServiceLocations('bus-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const _seoDb = await resolvePageMeta(`26-seater-bus:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `26 Seater Bus in ${locationName} | Mini Bus @₹28/km | TransRentals`,
    description: _seoDb?.metaDescription || `Book 26 seater bus in ${locationName}. AC/Non-AC with driver for weddings, corporate events.`,
    alternates: { canonical: `https://transrentals.in/26-seater-bus/${params.location}` },
  };
}

export default async function TwentySixSeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('26-seater-bus', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="26-seater-bus" serviceName="26 Seater Bus" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/26-seater-bus" className="hover:text-green-700">26 Seater Bus</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`26 Seater in ${locationName}`}
        title="26 Seater Bus on Rent"
        titleHighlight="Starting @₹28/km"
        description={`Hire 26 seater mini bus in ${locationName} for weddings, corporate events & group travel. AC/Non-AC with driver.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '26 Seats', color: 'text-green-600' },
        ]}
        gradientFrom="green-50"
        gradientTo="teal-50"
      />

      <section className="bg-gradient-to-br from-green-700 to-teal-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">26 Seater Bus in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹28/km</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">26 Seats</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">26 Seater Options in {locationName}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: '26 Seater Non-AC', price: 28 },
              { name: '26 Seater AC', price: 35 },
              { name: '26 Seater Luxury', price: 45 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">{v.name}</h3>
                <p className="text-3xl font-bold text-green-600 mb-4">₹{v.price}<span className="text-sm text-gray-500">/km</span></p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg">Book Now</button>
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
            <Link href={`/20-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">20 Seater</h3><p className="text-sm text-gray-600 mt-2">From ₹22/km</p>
            </Link>
            <Link href={`/bus-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All Buses</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="26-seater-bus"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="bus-rental" location={locationName} />
    </>
  );
}
