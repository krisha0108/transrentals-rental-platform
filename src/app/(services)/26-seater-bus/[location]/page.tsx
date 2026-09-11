import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Armchair, Bus, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { TwentySixSeaterBusBookingHero } from '@/components/bus-rental/TwentySixSeaterBusBookingHero';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where bus-rental is available
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
    resolvePageMeta(`26-seater-bus:${params.location.toLowerCase()}`),
    getServiceCityContent('26-seater-bus', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `26 Seater Bus in ${locationName} | Mini Bus @₹28/km | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book 26 seater bus in ${locationName}. AC/Non-AC with driver for weddings, corporate events.`,
    alternates: { canonical: `https://transrentals.in/26-seater-bus/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `26 Seater Bus in ${locationName} | TransRentals`,
      description: `Book 26 seater bus in ${locationName} starting @₹25/km with driver.`,
    },
  };
}

export default async function TwentySixSeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('26-seater-bus', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="26-seater-bus" serviceName="26 Seater Bus" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`26-seater-bus:${params.location.toLowerCase()}`),
    getServiceCityContent('26-seater-bus', params.location),
  ]);

  const pageFaqs = [
    { question: 'Is a 26-seater classified as a mini bus or full-size bus?', answer: 'A 26-seater is a mini bus — larger than a tempo traveller but compact enough for city roads. Ideal for 24–26 passengers with hand luggage.' },
    { question: 'What is the rental rate for a 26-seater bus per km?', answer: '26-seater Non-AC starts from ₹28/km, AC from ₹35/km, and Luxury from ₹45/km. Minimum 150 km per day for outstation trips.' },
    { question: 'Is a 26-seater bus available for school picnic or college trip?', answer: 'Yes — 26-seater AC buses are popular for school picnics, college tours, and religious group travel. Advance booking recommended.' },
    { question: 'Does the 26-seater bus have luggage space?', answer: 'Yes, 26-seater mini buses have overhead racks and optional roof carrier for large luggage on outstation trips.' },
  ];

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

      <TwentySixSeaterBusBookingHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                26 Seater Bus in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Mini bus travel with professional driver. AC &amp; Non-AC available.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Armchair className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Seating</p>
                  <p className="text-lg font-black text-gray-900">26 Seats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            26 Seater Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: '26 Seater Non-AC', price: 28 },
              { name: '26 Seater AC', price: 35 },
              { name: '26 Seater Luxury', price: 45 },
            ].map((v, idx) => (
              <div
                key={v.name}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 p-6"
                style={{ animation: `tt26-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <Bus className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.name}</h3>
                <p className="text-2xl font-black text-emerald-700 mb-4">₹{v.price}<span className="text-sm font-normal text-gray-500">/km</span></p>
                <button className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">Book Now</button>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes tt26-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="tt26-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-8">
            Other Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              { href: `/12-seater-tempo-traveller/${params.location.toLowerCase()}`, label: '12 Seater' },
              { href: `/17-seater-tempo-traveller/${params.location.toLowerCase()}`, label: '17 Seater' },
              { href: `/20-seater-tempo-traveller/${params.location.toLowerCase()}`, label: '20 Seater' },
              { href: `/bus-rental/${params.location.toLowerCase()}`, label: 'All Buses' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <Bus className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="26-seater-bus" location={locationName} customFaqs={pageFaqs} />


      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="26-seater-bus"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="26 Seater Bus"
        serviceSlug="26-seater-bus"
        description={`Book 26 seater bus in ${locationName} starting @₹25/km with driver.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="26-seater-bus"
        siblings={[
          { slug: 'tempo-traveller', name: 'Tempo Traveller' },
          { slug: 'wedding-bus-rental', name: 'Wedding Bus' },
          { slug: 'corporate-bus-rental', name: 'Corporate Bus' },
          { slug: '12-seater-tempo-traveller', name: '12 Seater Tempo' },
          { slug: '17-seater-tempo-traveller', name: '17 Seater Tempo' },
          { slug: '20-seater-tempo-traveller', name: '20 Seater Tempo' },
          { slug: '26-seater-bus', name: '26 Seater Bus' },
        ]}
      />
    </>
  );
}
