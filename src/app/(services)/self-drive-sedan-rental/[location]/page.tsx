import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
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
import { Wallet, Car, Truck, LayoutGrid, ArrowRight } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where self-drive-car-rentals is available
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
    resolvePageMeta(`self-drive-sedan-rental:${params.location}`),
    getServiceCityContent('self-drive-sedan-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive Sedan Rental in ${locationName} | Rent Sedan @₹1299/Day | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent sedan without driver in ${locationName}. Honda City, Verna, Ciaz, Dzire available. Self-drive sedan for business & outstation travel.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `self drive sedan rental ${locationName}`,
      `sedan on rent ${locationName}`,
      `rent sedan without driver ${locationName}`,
      `honda city on rent ${locationName}`,
    ],
    openGraph: {
      title: `Self Drive Sedan Rental in ${locationName} @₹1299/Day | TransRentals`,
      description: `Rent sedans without driver in ${locationName}. City, Verna, Ciaz available.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-sedan-rental/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-sedan-rental/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Self Drive Sedan Rental in ${locationName} | TransRentals`,
      description: `Rent sedan without driver in ${locationName} starting @₹999/day. Honda City, Verna, Ciaz available.`,
    },
  };
}


export default async function SedanRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('self-drive-sedan-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-sedan-rental" serviceName="Self Drive Sedan Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-sedan-rental:${params.location}`),
    getServiceCityContent('self-drive-sedan-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which sedan models are available for self-drive rental?', answer: 'We offer Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia — comfortable sedans perfect for business and family travel.' },
    { question: 'What is the daily rate for a self-drive sedan?', answer: 'Self-drive sedan rental starts at ₹999/day for Maruti Dzire and goes up to ₹1899/day for premium sedans like Skoda Slavia.' },
    { question: 'Is fuel included in the self-drive sedan package?', answer: 'Fuel is not included. You receive the car with a full tank and must return it with the same fuel level to avoid surcharges.' },
    { question: 'Can I take the self-drive sedan for an outstation trip?', answer: 'Yes, outstation travel is permitted. Inform us of your plan at booking time to ensure correct permit and insurance coverage.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/self-drive-sedan-rental" className="hover:text-blue-700">Self Drive Sedan Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <SwiftRentalTypeHero
        city={locationName}
        citySlug={params.location}
        vehicleName="Self Drive Sedan"
        selfDrivePrice="₹1,299"
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Self Drive Sedan Rental in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Comfortable, stylish sedans for business and leisure travel.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Starting from</p>
                  <p className="text-lg font-black text-gray-900">₹1,299</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Available</p>
                  <p className="text-lg font-black text-gray-900">6+ Models</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Other Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { href: `/self-drive-suv-rental/${params.location}`, icon: Truck, title: 'SUV Rental', desc: 'From ₹1,999/day' },
              { href: `/self-drive-hatchback-rental/${params.location}`, icon: Car, title: 'Hatchback Rental', desc: 'From ₹899/day' },
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
              serviceSlug="self-drive-sedan-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}

      <BikeServiceSchema
        serviceName="Self Drive Sedan Rental"
        serviceSlug="self-drive-sedan-rental"
        description={`Rent sedan without driver in ${locationName} starting @₹999/day. Honda City, Verna, Ciaz available.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="self-drive-sedan-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="self-drive-sedan-rental"
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
