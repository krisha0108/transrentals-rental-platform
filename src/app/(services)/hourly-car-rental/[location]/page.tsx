import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { HourlyCarBookingHero } from '@/components/hourly-car-rental/HourlyCarBookingHero';

interface PageProps { params: { location: string }; }

export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

export const revalidate = 43200; // 12 hours
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const seoDb = await resolvePageMeta(`hourly-car-rental:${params.location}`);
  return {
    title: seoDb?.metaTitle || `Hourly Car Rental in ${locationName} | Book with Driver | TransRentals`,
    description: seoDb?.metaDescription || `Book hourly cab in ${locationName} with driver. Packages starting from 2 hrs. Driver + fuel included.`,
    alternates: { canonical: `https://transrentals.in/hourly-car-rental/${params.location}` },
  };
}

export default async function HourlyCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hourly-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return (
    <StateServicePage
      state={pageContext.state}
      activeCities={pageContext.activeCities}
      serviceSlug="hourly-car-rental"
      serviceName="Hourly Car Rental"
    />
  );
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hourly-car-rental" className="hover:text-blue-700">Hourly Car Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      {/* Hero with live packages from admin */}
      <HourlyCarBookingHero cityName={locationName} citySlug={params.location} />

      {/* Other options */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">More Options in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Daily Self-Drive</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹799/day</p>
            </Link>
            <Link href={`/airport-transfer/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Airport Transfer</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹499</p>
            </Link>
            <Link href={`/outstation-car-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Outstation</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹12/km</p>
            </Link>
            <Link href={`/one-way-cab/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">One Way Cab</h3>
              <p className="text-sm text-gray-600 mt-2">Fixed fare</p>
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
