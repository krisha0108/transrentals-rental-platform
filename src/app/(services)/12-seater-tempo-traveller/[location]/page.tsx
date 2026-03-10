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

interface PageProps {
  params: { location: string };
}

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

  const _seoDb = await resolvePageMeta(`12-seater-tempo-traveller:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `12 Seater Tempo Traveller in ${locationName} | Hire @₹18/km | TransRentals`,
    description: _seoDb?.metaDescription || `Book 12 seater tempo traveller on rent in ${locationName}. AC/Non-AC options with driver. Perfect for family trips, weddings, pilgrimages.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [`12 seater tempo traveller ${locationName}`, `tempo traveller hire ${locationName}`, `12 seater van rental ${locationName}`],
    openGraph: {
      title: `12 Seater Tempo Traveller in ${locationName} @₹18/km`,
      description: `Hire 12 seater tempo traveller with driver in ${locationName}.`,
      url: `https://transrentals.in/12-seater-tempo-traveller/${params.location}`,
    },
    alternates: { canonical: `https://transrentals.in/12-seater-tempo-traveller/${params.location}` },
  };
}

const variants = [
  { name: '12 Seater Non-AC', price: 18 },
  { name: '12 Seater AC', price: 22 },
  { name: '12 Seater Deluxe', price: 26 },
  { name: '12 Seater Maharaja', price: 32 },
];

export default async function TwelveSeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('12-seater-tempo-traveller', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="12-seater-tempo-traveller" serviceName="12 Seater Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`12-seater-tempo-traveller:${params.location}`);


  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/12-seater-tempo-traveller" className="hover:text-blue-700">12 Seater Tempo Traveller</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`12 Seater in ${locationName}`}
        title="12 Seater Tempo Traveller"
        titleHighlight="Starting @₹18/km"
        description={`Hire 12 seater tempo traveller in ${locationName} for family trips, weddings & group travel. AC/Non-AC with professional driver.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '12 Seats', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      />

      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            12 Seater Tempo Traveller in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Comfortable group travel with professional driver. AC & Non-AC available.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹18/km</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">12 Seats</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Variants</p>
              <p className="text-xl font-bold">4 Options</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            12 Seater Options in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map((variant) => (
              <div key={variant.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                <h3 className="text-lg font-bold mb-2">{variant.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600">₹{variant.price}</span>
                  <span className="text-gray-500">/km</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Professional driver</li>
                  <li>✓ Fuel included</li>
                  <li>✓ All permits</li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/17-seater-tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">17 Seater</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹20/km</p>
            </Link>
            <Link href={`/tempo-traveller/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Tempo Travellers</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
            <Link href={`/bus-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Bus Rental</h3>
              <p className="text-sm text-gray-600 mt-2">26+ seater</p>
            </Link>
            <Link href={`/wedding-bus-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Wedding Bus</h3>
              <p className="text-sm text-gray-600 mt-2">For weddings</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="12-seater-tempo-traveller"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="bus-rental" location={locationName} />
    </>
  );
}
