import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { capitalize } from '@/lib/utils';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { LazyServiceFleetDisplay } from '@/components/services/LazyServiceFleetDisplay';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { stripPricesFromText } from '@/lib/content/strip-prices';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Zap, Leaf, VolumeX, Gauge, Bike as BikeIcon, CalendarClock } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

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
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`electric-scooter-rental:${params.location}`),
    getServiceCityContent('electric-scooter-rental', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Electric Scooter Rental in ${locationName} | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available. Zero fuel cost, eco-friendly. Daily & monthly EV rental from ₹399/day.`),
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `electric scooter rental ${locationName}`,
      `ev scooter on rent ${locationName}`,
      `ola scooter on rent ${locationName}`,
      `ather on rent ${locationName}`,
      `electric bike rental ${locationName}`,
      `tvs iqube on rent ${locationName}`,
    ],
    openGraph: {
      title: `Electric Scooter Rental in ${locationName} | TransRentals`,
      description: `Rent Ola S1, Ather 450X, TVS iQube in ${locationName}. Zero fuel cost!`,
      type: 'website',
      url: `https://transrentals.in/electric-scooter-rental/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/electric-scooter-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Electric Scooter Rental in ${locationName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Electric Scooter Rental in ${locationName} | TransRentals`,
      description: `Rent EVs in ${locationName} from verified partners.`,
      images: ['https://transrentals.in/images/og/electric-scooter-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/electric-scooter-rental/${locationSlug}`,
    },
  };
}

const launchFaqs = [
  { question: 'What documents do I need to rent?', answer: 'A valid two-wheeler driving licence and one government photo ID (Aadhaar, passport or voter card).' },
  { question: 'Is a helmet included?', answer: 'Yes, a helmet is included with every rental.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, our partners provide 24/7 roadside assistance for the length of your rental.' },
];

export default async function ElectricScooterLocationPage({ params }: PageProps) {
  // Availability follows Bike Rental: there is no services row under
  // "electric-scooter-rental" (an unknown slug used to read as "available everywhere"),
  // so this page could never be switched off for a city. One admin screen
  // now controls every bike page, this one included.
  const pageContext = await resolveServicePage('electric-scooter-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'bike-on-rent',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="electric-scooter-rental" serviceName="Electric Scooter Rental" />;

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
              <a href="/electric-scooter-rental" className="hover:text-primary">Electric Scooter Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="electric scooter rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="electric-scooter-rental"
            serviceName="Electric Scooter Rental"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} selectionDesc="Ola, Ather, TVS iQube, Bajaj Chetak — the EVs riders ask for." />
        <FAQSection service="electric-scooter-rental" location={cityName} customFaqs={launchFaqs} />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const schemaFaqs = [
    { question: `Where can I rent electric scooter in ${locationName}?`, answer: `TransRentals offers electric scooter rental across ${locationName}. We have Ola S1, Ather 450X, TVS iQube available with doorstep delivery.` },
    { question: `Is charging available in ${locationName}?`, answer: `Yes, you can charge at home or use public charging stations across ${locationName}. We provide charging cable with the scooter.` },
  ];


  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`electric-scooter-rental:${params.location}`),
    getServiceCityContent('electric-scooter-rental', params.location),
  ]);

  // No rate is quoted anywhere on this page — the real price depends on the
  // partner and the dates, so a number in the copy would only mislead.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;

  const pageFaqs = [
    { question: 'Which electric scooters are available on rent?', answer: 'We offer Ola S1 Pro, Ather 450X, and TVS iQube — all with full charge, app connectivity, and fast charger included.' },
    { question: 'How far can I travel on a single charge?', answer: 'Ola S1 Pro offers 130+ km, Ather 450X offers 85+ km, and TVS iQube offers 100+ km per charge under normal city riding conditions.' },
    { question: 'Where do I charge the electric scooter during the rental?', answer: 'You can charge at home using a regular 15A socket. We also provide a list of public charging stations near your location.' },
    { question: 'Is there an extra charge if the battery runs out mid-trip?', answer: 'No penalty — just charge at any available point. We recommend planning routes with charging stops for longer trips outside city limits.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`Electric Scooter Rental in ${locationName}`}
        serviceSlug="electric-scooter-rental"
        description={`Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available, all from verified partners.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        rating={4.6}
        reviewCount={234}
        hidePrices
      />

      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={heroDescription}
      />

      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-green-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/electric-scooter-rental" className="hover:text-green-700">Electric Scooter Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      {/* Quick facts */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Electric Scooter Rental in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Zero fuel cost · Silent ride · Eco-friendly commute</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Fuel Cost</p>
                  <p className="text-lg font-black text-gray-900">Zero</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Range</p>
                  <p className="text-lg font-black text-gray-900">100km+</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href="#evs"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View EV Models
            </Link>
            <Link
              href={`/bike-on-rent/${params.location}`}
              className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
            >
              Petrol Bikes
            </Link>
          </div>
        </div>
      </section>

      {/* EV Models */}
      {/* Available scooters — purely whatever the admin has published for
          this city. Nothing hardcoded, and the section renders nothing at all
          when the city has no published fleet. */}
      <LazyServiceFleetDisplay
        serviceSlug="electric-scooter-rental"
        locationSlug={params.location}
        title={`Electric Scooters Available in ${locationName}`}
        showCategories={true}
        limit={12}
        hidePrices
      />

      {/* Why EV */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Rent EV in <span className="text-emerald-600">{locationName}?</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
            {[
              { Icon: Zap, title: 'Cheaper to Run', desc: 'A full charge costs a fraction of a tank of petrol' },
              { Icon: Leaf, title: 'Go Green', desc: 'Zero emissions, contribute to cleaner air' },
              { Icon: VolumeX, title: 'Silent Ride', desc: 'No noise pollution, peaceful commute' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `evl-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.Icon className="w-6 h-6 text-emerald-600 transition-colors duration-500 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes evl-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="evl-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Related Services */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Other Services in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { href: `/bike-on-rent/${params.location}`, Icon: BikeIcon, title: 'Bike Rental', desc: 'Petrol bikes, booked by the day' },
              { href: `/activa-on-rent/${params.location}`, Icon: Gauge, title: 'Activa Rental', desc: 'Automatic scooters for city runs' },
              { href: `/monthly-bike-rental/${params.location}`, Icon: CalendarClock, title: 'Monthly Rental', desc: 'Long term from long-term plans' },
            ].map((opt) => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group flex flex-col items-center text-center bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-8 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <opt.Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{opt.title}</h3>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="electric-scooter-rental" location={locationName} customFaqs={pageFaqs} />

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="electric-scooter-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="electric-scooter-rental"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
          { slug: 'pulsar-on-rent', name: 'Pulsar on Rent' },
          { slug: 'apache-on-rent', name: 'Apache on Rent' },
          { slug: 'splendor-on-rent', name: 'Splendor on Rent' },
          { slug: 'himalayan-on-rent', name: 'Himalayan on Rent' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
        ]}
      />
    </>
  );
}
