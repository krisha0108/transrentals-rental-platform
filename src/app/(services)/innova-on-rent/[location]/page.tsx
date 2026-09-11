import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Layers, Fuel, Armchair, Bus, Car, LayoutGrid, ArrowRight } from 'lucide-react';
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
    resolvePageMeta(`innova-on-rent:${params.location}`),
    getServiceCityContent('innova-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Innova on Rent in ${locationName} | Rent Innova @₹2499/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Toyota Innova Crysta without driver in ${locationName}. Self-drive Innova rental for family trips, weddings. 7+1 seater. GX, VX, ZX variants available.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `innova on rent ${locationName}`,
      `toyota innova rental ${locationName}`,
      `rent innova without driver ${locationName}`,
      `7 seater car rental ${locationName}`,
    ],
    openGraph: {
      title: `Innova on Rent in ${locationName} @₹2499/Day | TransRentals`,
      description: `Self-drive Toyota Innova Crysta rental in ${locationName}. Best rates guaranteed.`,
      type: 'website',
      url: `https://transrentals.in/innova-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/innova-on-rent/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Innova on Rent in ${locationName} | TransRentals`,
      description: `Rent Toyota Innova without driver in ${locationName} starting @₹1999/day.`,
    },
  };
}

const innovaVariants = [
  { name: 'Toyota Innova Crysta GX', price: 2499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta GX AT', price: 2799, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta VX', price: 2999, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova Crysta ZX AT', price: 3499, fuel: 'Diesel', seats: 7 },
  { name: 'Toyota Innova HyCross', price: 3999, fuel: 'Hybrid', seats: 7 },
];

export default async function InnovaOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('innova-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="innova-on-rent" serviceName="Innova on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`innova-on-rent:${params.location}`),
    getServiceCityContent('innova-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is Toyota Innova available for self-drive rental?', answer: 'Yes, Toyota Innova Crysta (7-seater) and Innova HyCross (hybrid) are available for self-drive — perfect for large family trips.' },
    { question: 'What is the daily rental cost for Innova Crysta?', answer: 'Innova Crysta self-drive rental starts from ₹1999/day for manual. HyCross starts from ₹2499/day including comprehensive insurance.' },
    { question: 'How many people can the rental Innova accommodate?', answer: 'Toyota Innova seats 7 adults comfortably with good luggage space, ideal for groups going on weekend getaways or hill station trips.' },
    { question: 'Is the Innova available with an automatic gearbox for self-drive?', answer: 'Yes, both Innova Crysta (automatic) and HyCross (eCVT) are available for self-drive based on stock at your location.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/innova-on-rent" className="hover:text-purple-700">Innova on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Toyota Innova"
        selfDrivePrice="₹2,499"
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Innova on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Self-drive Toyota Innova Crysta. Best MPV for family trips &amp; group travel.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Starting</p>
                  <p className="text-lg font-black text-gray-900">₹2,499/day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Seating</p>
                  <p className="text-lg font-black text-gray-900">7+1 Seats</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Variants</p>
                  <p className="text-lg font-black text-gray-900">5 Options</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Innova Variants in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {innovaVariants.map((variant, idx) => (
              <div
                key={variant.name}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 p-6"
                style={{ animation: `iov-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Bus className="w-5 h-5 text-emerald-600" />
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{variant.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-emerald-500" /> {variant.fuel}</span>
                  <span className="flex items-center gap-1.5"><Armchair className="w-3.5 h-3.5 text-emerald-500" /> {variant.seats} Seats</span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xl font-bold text-emerald-700">₹{variant.price}<span className="text-xs font-normal text-gray-400">/day</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes iov-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="iov-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <section className="relative overflow-hidden py-14 md:py-16 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other Cars in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/fortuner-on-rent/${params.location}`, icon: Car, title: 'Fortuner on Rent', desc: 'Premium luxury SUV' },
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
              serviceSlug="innova-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}

      <BikeServiceSchema
        serviceName="Innova on Rent"
        serviceSlug="innova-on-rent"
        description={`Rent Toyota Innova without driver in ${locationName} starting @₹1999/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="innova-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="innova-on-rent"
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
