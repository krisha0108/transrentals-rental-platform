import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Mountain, Car, LayoutGrid, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`scorpio-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('scorpio-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Scorpio on Rent in ${locationName} | @₹2499/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Mahindra Scorpio without driver in ${locationName}. Rugged SUV for adventure & outstation.`,
    alternates: { canonical: `https://transrentals.in/scorpio-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Scorpio on Rent in ${locationName} | TransRentals`,
      description: `Rent Mahindra Scorpio without driver in ${locationName} starting @₹1499/day.`,
    },
  };
}

export default async function ScorpioLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('scorpio-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="scorpio-on-rent" serviceName="Scorpio on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`scorpio-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('scorpio-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which Scorpio model is available for self-drive rental?', answer: 'We offer Mahindra Scorpio N (2022+) and Scorpio Classic — both available in diesel manual variants with 4WD options.' },
    { question: 'What is the rental price for Mahindra Scorpio per day?', answer: 'Scorpio Classic starts from ₹1499/day; Scorpio N starts from ₹1799/day. 250 km included per day in all packages.' },
    { question: 'Is Scorpio 4WD available for self-drive on hill roads?', answer: 'Yes, Scorpio N Z8 4WD variant is available and cleared for hill stations and rough terrain with prior route intimation.' },
    { question: 'How many people can travel in the rental Scorpio?', answer: 'Scorpio N and Classic seat up to 7 passengers. All three rows are functional for full-family group travel.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/scorpio-on-rent" className="hover:text-amber-700">Scorpio on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        vehicleName="Mahindra Scorpio"
        selfDrivePrice="₹2,499"
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Scorpio on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Self-drive Mahindra Scorpio. Rugged SUV for adventure &amp; outstation travel.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Starting</p>
                  <p className="text-lg font-black text-gray-900">₹2,499</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Mountain className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Type</p>
                  <p className="text-lg font-black text-gray-900">Rugged SUV</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other SUVs in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/xuv700-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'XUV700', desc: 'Feature-packed SUV' },
              { href: `/fortuner-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'Fortuner', desc: 'Premium luxury SUV' },
              { href: `/creta-on-rent/${params.location.toLowerCase()}`, icon: Car, title: 'Creta', desc: 'Premium mid-size SUV' },
              { href: `/self-drive-suv-rental/${params.location.toLowerCase()}`, icon: LayoutGrid, title: 'All SUVs', desc: 'View all options' },
            ].map((opt) => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group flex flex-col items-center text-center bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-8 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <opt.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{opt.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {opt.desc}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="scorpio-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Scorpio on Rent"
        serviceSlug="scorpio-on-rent"
        description={`Rent Mahindra Scorpio without driver in ${locationName} starting @₹1499/day.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="scorpio-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="scorpio-on-rent"
        siblings={[
          { slug: 'hourly-car-rental', name: 'Hourly Car Rental' },
          { slug: 'self-drive-suv-rental', name: 'Self Drive SUV' },
          { slug: 'self-drive-sedan-rental', name: 'Self Drive Sedan' },
          { slug: 'self-drive-hatchback-rental', name: 'Self Drive Hatchback' },
          { slug: 'swift-on-rent', name: 'Swift on Rent' },
          { slug: 'creta-on-rent', name: 'Creta on Rent' },
          { slug: 'innova-on-rent', name: 'Innova on Rent' },
          { slug: 'fortuner-on-rent', name: 'Fortuner on Rent' },
          { slug: 'seltos-on-rent', name: 'Seltos on Rent' },
          { slug: 'xuv700-on-rent', name: 'XUV700 on Rent' },
          { slug: 'scorpio-on-rent', name: 'Scorpio on Rent' },
        ]}
      />
    </>
  );
}
