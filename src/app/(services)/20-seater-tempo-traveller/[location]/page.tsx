import React from 'react';
import type { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import Link from 'next/link';
import { Armchair, Bus, ArrowRight } from 'lucide-react';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where tempo-traveller is available
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
    resolvePageMeta(`20-seater-tempo-traveller:${params.location.toLowerCase()}`),
    getServiceCityContent('20-seater-tempo-traveller', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `20 Seater Tempo Traveller in ${locationName} | AC & Non-AC Hire | TransRentals`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Book 20 seater tempo traveller in ${locationName}. AC/Non-AC with driver for large groups.`,
    alternates: { canonical: `https://transrentals.in/20-seater-tempo-traveller/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `20 Seater Tempo Traveller in ${locationName} | TransRentals`,
      description: `Book a 20 seater tempo traveller in ${locationName} with a professional driver.`,
    },
  };
}

const PAGE_FAQS = [
  { question: 'Is 20-seater tempo traveller suitable for large family trips?', answer: 'Yes — a 20-seater is perfect for 18–20 family members with overhead luggage racks and individual reclining seats.' },
  { question: 'What is the AC option for 20-seater tempo traveller?', answer: 'Non-AC, AC and Deluxe AC variants are available — Deluxe has premium seats and better legroom. Each variant is quoted separately by the operator.' },
  { question: 'Is the 20-seater available for school or college trip rental?', answer: 'Yes, 20-seater tempo travellers are popular for school picnics and college trips. Student group discounts available on advance booking.' },
  { question: 'What is the minimum booking duration for a 20-seater tempo traveller?', answer: 'For local city use, minimum 4 hours. For outstation, minimum 1 day. Multi-day bookings get 10–15% discount.' },
];

/**
 * What a city sees while no operator is live there yet. No booking form and no
 * quoted rate: there is nothing to book and no partner to honour a number, so
 * the page points at the nearest cities that are bookable today instead.
 */
function ExpandingCityPage({ cityName, citySlug }: { cityName: string; citySlug: string }) {
  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-emerald-700">Home</a>
            <span className="mx-2">/</span>
            <a href="/20-seater-tempo-traveller" className="hover:text-emerald-700">20 Seater Tempo Traveller</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{cityName}</span>
          </nav>
        </div>
      </section>
      <ServiceExpandingHero cityName={cityName} serviceLabel="20-seater Tempo Traveller rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="20-seater-tempo-traveller"
          serviceName="20 Seater Tempo Traveller"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="Tempo Traveller"
        selectionDesc="Non-AC, AC and Deluxe AC 20-seaters for large groups."
      />
      <FAQSection service="20-seater-tempo-traveller" location={cityName} customFaqs={PAGE_FAQS} />
    </>
  );
}

export default async function TwentySeaterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('20-seater-tempo-traveller', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'bus-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="20-seater-tempo-traveller" serviceName="20 Seater Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`20-seater-tempo-traveller:${params.location.toLowerCase()}`),
    getServiceCityContent('20-seater-tempo-traveller', params.location),
  ]);


  // The admin block editor renders its own Why Us / Other Services / FAQ
  // blocks. Where the city has one, the hardcoded section below is skipped
  // so the page doesn't say the same thing twice.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);
  const adminCoversOtherServices = hasSectionMatching(scContent?.sectionsConfig, /services?[-\s_]?(offered|available)|other[-\s_]?services/i);
  const adminCoversFaqs = hasSectionMatching(scContent?.sectionsConfig, /faq/i);

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/20-seater-tempo-traveller" className="hover:text-orange-700">20 Seater</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={stripPricesFromText(scContent?.pageHeading || seoData?.pageHeading) || undefined}
        pageDescription={stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined}
        badge={`20 Seater Tempo in ${locationName}`}
        title="20 Seater Tempo Traveller"
        titleHighlight="AC & Non-AC for Large Groups"
        description={`Big group? No problem. 20-seater AC Tempo Traveller for ${locationName} outings — school trips, large family gatherings, corporate team outings with comfort for all.`}
        features={[
          { icon: 'zap', text: '20 Comfortable Seats', color: 'text-red-600' },
          { icon: 'shield', text: 'Overhead Storage', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="red-50"
        gradientTo="rose-50"
        cityName={locationName}
        serviceType="tempo-20seater"
        backgroundImage="/images/sections/tempo-traveller-hero-bg.webp"
        bookingVariant="tempo"
        heroStats={[
          { icon: 'tag', value: '17-18', label: 'Seats with luggage' },
          { icon: 'shield', value: '500+', label: 'Verified operators' },
          { icon: 'map', value: '150+', label: 'Cities served' },
          { icon: 'headphones', value: '24/7', label: 'Customer support' },
        ]}
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                20 Seater Tempo Traveller in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Big group travel with professional driver. AC &amp; Non-AC available.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Armchair className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Seating</p>
                  <p className="text-lg font-black text-gray-900">20 Seats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            20 Seater Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: '20 Seater Non-AC', note: 'Fan-cooled, budget pick' },
              { name: '20 Seater AC', note: 'Air-conditioned cabin' },
              { name: '20 Seater Deluxe', note: 'Premium seats, extra legroom' },
            ].map((v, idx) => (
              <div
                key={v.name}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 p-6"
                style={{ animation: `tt20-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <Bus className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.name}</h3>
                <p className="mb-4 text-sm font-semibold text-emerald-700">{v.note}</p>
                <button className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">Book Now</button>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes tt20-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="tt20-rise"] { animation: none !important; opacity: 1 !important; } }
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
              { href: `/26-seater-bus/${params.location.toLowerCase()}`, label: '26 Seater Bus' },
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

      {!adminCoversFaqs && (
        <FAQSection service="20-seater-tempo-traveller" location={locationName} customFaqs={PAGE_FAQS} />
      )}


      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="20-seater-tempo-traveller"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        hidePrices
        serviceName="20 Seater Tempo Traveller"
        serviceSlug="20-seater-tempo-traveller"
        description={`Book a 20 seater tempo traveller in ${locationName} with a professional driver.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="20-seater-tempo-traveller"
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
