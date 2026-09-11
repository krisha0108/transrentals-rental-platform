import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Fuel, Car, LayoutGrid, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: {
    location: string;
  };
}

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
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`fortuner-on-rent:${params.location}`),
    getServiceCityContent('fortuner-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Fortuner on Rent in ${locationName} | Rent Fortuner @₹4999/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Toyota Fortuner without driver in ${locationName}. Self-drive Fortuner rental for VIP travel, weddings. 4x2, 4x4, Legender variants available.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `fortuner on rent ${locationName}`,
      `toyota fortuner rental ${locationName}`,
      `rent fortuner without driver ${locationName}`,
      `luxury suv rental ${locationName}`,
    ],
    openGraph: {
      title: `Fortuner on Rent in ${locationName} @₹4999/Day | TransRentals`,
      description: `Self-drive Toyota Fortuner rental in ${locationName}. Premium luxury SUV.`,
      type: 'website',
      url: `https://transrentals.in/fortuner-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/fortuner-on-rent/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Fortuner on Rent in ${locationName} | TransRentals`,
      description: `Rent Toyota Fortuner without driver in ${locationName} starting @₹3499/day.`,
    },
  };
}


export default async function FortunerOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('fortuner-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="fortuner-on-rent" serviceName="Fortuner on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`fortuner-on-rent:${params.location}`),
    getServiceCityContent('fortuner-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is Toyota Fortuner available for self-drive without a driver?', answer: 'Yes, Toyota Fortuner (4x2 and 4x4) is available for self-drive. A valid LMV licence with minimum 2 years of driving experience is required.' },
    { question: 'What is the daily rent for a Fortuner self-drive?', answer: 'Toyota Fortuner self-drive rental starts from ₹3499/day for 2WD manual and ₹4299/day for 4WD automatic, including insurance.' },
    { question: 'Can I drive the Fortuner to hill stations or off-road?', answer: 'Yes, Fortuner 4x4 is cleared for hill stations and moderate off-road trails. Notify us at booking for route-specific insurance clearance.' },
    { question: 'What is the security deposit for renting a Fortuner?', answer: 'A refundable security deposit of ₹10,000–₹15,000 is collected at pickup and returned within 48 hours of damage-free return.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-yellow-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/fortuner-on-rent" className="hover:text-yellow-700">Fortuner on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Toyota Fortuner"
        selfDrivePrice="₹4,999"
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Fortuner on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Self-drive Toyota Fortuner. Premium luxury SUV for VIP travel &amp; special occasions.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Starting</p>
                  <p className="text-lg font-black text-gray-900">₹4,999</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Seating</p>
                  <p className="text-lg font-black text-gray-900">7 Seats</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Fuel className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Engine</p>
                  <p className="text-lg font-black text-gray-900">2.8L Diesel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other Premium Cars in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/innova-on-rent/${params.location}`, icon: Car, title: 'Innova on Rent', desc: 'Spacious 7-seater MUV' },
              { href: `/creta-on-rent/${params.location}`, icon: Car, title: 'Creta on Rent', desc: 'Premium mid-size SUV' },
              { href: `/self-drive-suv-rental/${params.location}`, icon: LayoutGrid, title: 'All SUVs', desc: 'Seltos, Scorpio, XUV700' },
              { href: `/self-drive-car-rentals/${params.location}`, icon: LayoutGrid, title: 'All Self Drive Cars', desc: 'View all options' },
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
              citySlug={params.location}
              serviceSlug="fortuner-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}

      <BikeServiceSchema
        serviceName="Fortuner on Rent"
        serviceSlug="fortuner-on-rent"
        description={`Rent Toyota Fortuner without driver in ${locationName} starting @₹3499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="fortuner-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="fortuner-on-rent"
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
