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

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const _seoDb = await resolvePageMeta(`hourly-car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Hourly Car Rental in ${locationName} | @₹149/hr | TransRentals`,
    description: _seoDb?.metaDescription || `Rent a car by the hour in ${locationName}. Self-drive hourly packages from ₹149/hr. Perfect for meetings, shopping, errands.`,
    alternates: { canonical: `https://transrentals.in/hourly-car-rental/${params.location}` },
  };
}

const packages = [
  { hours: 2, km: 20, price: 299 },
  { hours: 4, km: 40, price: 499 },
  { hours: 8, km: 80, price: 899 },
];

export default async function HourlyCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hourly-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="hourly-car-rental" serviceName="Hourly Car Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-cyan-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hourly-car-rental" className="hover:text-cyan-700">Hourly Car Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        badge={`Hourly Rental in ${locationName}`}
        title="Hourly Car Rental"
        titleHighlight="From ₹149/hour"
        description={`Rent a car by the hour in ${locationName}. Self-drive flexibility for meetings, shopping & short trips.`}
        features={[
          { icon: 'star', text: 'Pay Per Hour', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fuel Included', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-blue-600' },
        ]}
        gradientFrom="cyan-50"
        gradientTo="blue-50"
      />

      <section className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hourly Car Rental in {locationName}</h1>
          <p className="text-lg opacity-90 mb-6">Pay only for the hours you need. Self-drive flexibility.</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹149/hour</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Minimum</p>
              <p className="text-xl font-bold">2 Hours</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Fuel</p>
              <p className="text-xl font-bold">Included</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Hourly Packages in {locationName}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {packages.map((pkg) => (
              <div key={pkg.hours} className="bg-white rounded-xl shadow-md p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">{pkg.hours} Hours</h3>
                <p className="text-gray-500 mb-4">{pkg.km} km included</p>
                <p className="text-3xl font-bold text-cyan-600 mb-4">₹{pkg.price}</p>
                <button className="w-full bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 transition">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Daily Self-Drive</h3><p className="text-sm text-gray-600 mt-2">From ₹799/day</p>
            </Link>
            <Link href={`/local-taxi/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">With Driver</h3><p className="text-sm text-gray-600 mt-2">From ₹1,499/day</p>
            </Link>
            <Link href={`/airport-transfer/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Airport Transfer</h3><p className="text-sm text-gray-600 mt-2">From ₹499</p>
            </Link>
            <Link href={`/outstation-car-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Outstation</h3><p className="text-sm text-gray-600 mt-2">From ₹12/km</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="hourly-car-rental"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} />
    </>
  );
}
