import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { Mountain, ShieldCheck, Briefcase, Fuel, Route as RouteIcon, Clock, ArrowRight, Compass, Bike } from 'lucide-react';
import { resolveServicePage } from '@/lib/services/service-availability';
import { LazyServiceFleetDisplay } from '@/components/services/LazyServiceFleetDisplay';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { stripPricesFromText } from '@/lib/content/strip-prices';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps { params: { location: string }; }

// Generate static params from DATABASE - Only locations where bike-on-rent is available
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
    resolvePageMeta(`himalayan-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('himalayan-on-rent', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Himalayan on Rent in ${locationName} | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent Royal Enfield Himalayan in ${locationName}. Adventure touring bike for mountain trips.`),
    alternates: { canonical: `https://transrentals.in/himalayan-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Royal Enfield Himalayan on Rent in ${locationName} | TransRentals`,
      description: `Rent Royal Enfield Himalayan in ${locationName} from verified partners.`,
    },
  };
}

const launchFaqs = [
  { question: 'What documents do I need to rent?', answer: 'A valid two-wheeler driving licence and one government photo ID (Aadhaar, passport or voter card).' },
  { question: 'Is a helmet included?', answer: 'Yes, a helmet is included with every rental.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, our partners provide 24/7 roadside assistance for the length of your rental.' },
];

export default async function HimalayanLocationPage({ params }: PageProps) {
  // Availability follows Bike Rental: there is no services row under
  // "himalayan-on-rent" (an unknown slug used to read as "available everywhere"),
  // so this page could never be switched off for a city. One admin screen
  // now controls every bike page, this one included.
  const pageContext = await resolveServicePage('himalayan-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'bike-on-rent',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="himalayan-on-rent" serviceName="Himalayan on Rent" />;

  // No partners onboarded here yet — no booking hero, because there is
  // nothing to search. The page says where we're at and points at the
  // nearest city that is bookable today.
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/himalayan-on-rent" className="hover:text-primary">Himalayan on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="Himalayan rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="himalayan-on-rent"
            serviceName="Himalayan on Rent"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} selectionDesc="Royal Enfield Himalayan 411 and Himalayan 450 — built for the long road." />
        <FAQSection service="himalayan-on-rent" location={cityName} customFaqs={launchFaqs} />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`himalayan-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('himalayan-on-rent', params.location),
  ]);

  // No rate is quoted anywhere on this page — the real price depends on the
  // partner and the dates, so a number in the copy would only mislead.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;

  const pageFaqs = [
    { question: 'Is the Royal Enfield Himalayan good for mountain trips?', answer: 'Yes — the Himalayan 411 is built for adventure touring with long-travel suspension, 21-inch front wheel, and fuel range of 400+ km.' },
    { question: 'What documents do I need to rent a Himalayan?', answer: 'A valid gear motorcycle licence (MCWG), one government ID (Aadhaar/passport), and a refundable security deposit are required.' },
    { question: 'Can I ride the Himalayan on unpaved or off-road trails?', answer: 'Light off-road use on gravel and forest tracks is permitted. Extreme off-roading voids the damage waiver — contact us for specific route approval.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/himalayan-on-rent" className="hover:text-slate-700">Himalayan on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <BikeSearchHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={heroDescription}
      />

      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Himalayan on Rent in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Adventure touring bike, built for mountain roads.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Mountain className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Engine</p>
                  <p className="text-lg font-black text-gray-900">411cc / 450cc</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Coverage</p>
                  <p className="text-lg font-black text-gray-900">Insured</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Rent Himalayan */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900 text-center mb-10">
            Why Rent <span className="text-emerald-600">Himalayan</span> in {locationName}?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Mountain, title: 'Built for Mountains', desc: 'High altitude proven' },
              { icon: ShieldCheck, title: 'Tough & Reliable', desc: 'Handles rough roads' },
              { icon: Briefcase, title: 'Luggage Ready', desc: 'Panniers & top box' },
              { icon: Fuel, title: 'Great Mileage', desc: '30+ km/l economy' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `hml-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon className="w-5 h-5 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes hml-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="hml-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Available bikes — purely whatever the admin has published for this
          city. Nothing hardcoded, and the section renders nothing at all when
          the city has no published fleet. */}
      <LazyServiceFleetDisplay
        serviceSlug="himalayan-on-rent"
        locationSlug={params.location}
        title={`Himalayan Options in ${locationName}`}
        showCategories={true}
        limit={12}
        hidePrices
      />

      {/* Popular Routes */}
      <section className="relative py-16 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Popular Routes for Himalayan
            </h2>
            <p className="text-gray-500">Mountain circuits riders take the Himalayan on most often</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { route: 'Manali to Leh', days: '5-7 days', km: '490 km' },
              { route: 'Srinagar to Leh', days: '2-3 days', km: '420 km' },
              { route: 'Spiti Circuit', days: '7-8 days', km: '600 km' },
              { route: 'Kinnaur Valley', days: '4-5 days', km: '350 km' },
            ].map((item) => (
              <div key={item.route} className="group relative flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <RouteIcon className="w-6 h-6 text-emerald-600" strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1.5">{item.route}</h3>
                <p className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {item.days} &bull; {item.km}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Other Bikes in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/royal-enfield-on-rent/${params.location.toLowerCase()}`, icon: Bike, title: 'Royal Enfield', desc: 'Classic, Bullet' },
              { href: `/ktm-on-rent/${params.location.toLowerCase()}`, icon: Bike, title: 'KTM', desc: 'Duke, RC' },
              { href: `/bike-on-rent/${params.location.toLowerCase()}`, icon: Bike, title: 'All Bikes', desc: 'View all' },
              { href: '/bike-tours/leh-ladakh', icon: Compass, title: 'Ladakh Tour', desc: 'Guided tours' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                <p className="text-[12.5px] text-gray-500 mb-3">{item.desc}</p>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700 mt-auto">
                  Explore
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="himalayan-on-rent"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Royal Enfield Himalayan on Rent"
        serviceSlug="himalayan-on-rent"
        description={`Rent Royal Enfield Himalayan in ${locationName}. Adventure touring bike for mountain trips.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
        hidePrices
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="himalayan-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="himalayan-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
          { slug: 'pulsar-on-rent', name: 'Pulsar on Rent' },
          { slug: 'apache-on-rent', name: 'Apache on Rent' },
          { slug: 'splendor-on-rent', name: 'Splendor on Rent' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
          { slug: 'electric-scooter-rental', name: 'Electric Scooter' },
        ]}
      />
    </>
  );
}
