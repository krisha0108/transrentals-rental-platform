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
  const _seoDb = await resolvePageMeta(`seltos-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Seltos on Rent in ${locationName} | @₹1899/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Kia Seltos without driver in ${locationName}. Self-drive Seltos with connected car features.`,
    alternates: { canonical: `https://transrentals.in/seltos-on-rent/${params.location}` },
  };
}

export default async function SeltosLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('seltos-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="seltos-on-rent" serviceName="Seltos on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`seltos-on-rent:${params.location}`);


  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/seltos-on-rent" className="hover:text-red-700">Seltos on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Seltos in ${locationName}`}
        title="Kia Seltos on Rent"
        titleHighlight="Starting @₹1899/Day"
        description={`Rent Kia Seltos without driver in ${locationName}. Connected car SUV with premium features.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Connected Car', color: 'text-red-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      <section className="bg-gradient-to-br from-red-600 to-orange-600 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Seltos on Rent in {locationName}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,899/day</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Type</p>
              <p className="text-xl font-bold">Compact SUV</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Seltos Variants in {locationName}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Kia Seltos HTK', price: 1899 },
              { name: 'Kia Seltos HTX', price: 2199 },
              { name: 'Kia Seltos GTX+ AT', price: 2999 },
            ].map((v) => (
              <div key={v.name} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-2">{v.name}</h3>
                <p className="text-3xl font-bold text-red-600 mb-4">₹{v.price}<span className="text-sm text-gray-500">/day</span></p>
                <p className="text-sm text-emerald-600 font-medium text-center mt-2">Use the chat below to book</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Other SUVs in {locationName}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/creta-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Creta</h3><p className="text-sm text-gray-600 mt-2">From ₹1,999/day</p>
            </Link>
            <Link href={`/xuv700-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">XUV700</h3><p className="text-sm text-gray-600 mt-2">From ₹2,999/day</p>
            </Link>
            <Link href={`/scorpio-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">Scorpio</h3><p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
            </Link>
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold">All SUVs</h3><p className="text-sm text-gray-600 mt-2">View all</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="seltos-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} />
    </>
  );
}
