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
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Electric Scooter Rental in ${locationName} | @₹399/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available. Zero fuel cost, eco-friendly. Daily & monthly EV rental from ₹399/day.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `electric scooter rental ${locationName}`,
      `ev scooter on rent ${locationName}`,
      `ola scooter on rent ${locationName}`,
      `ather on rent ${locationName}`,
      `electric bike rental ${locationName}`,
      `tvs iqube on rent ${locationName}`,
    ],
    openGraph: {
      title: `Electric Scooter Rental in ${locationName} @₹399/Day | TransRentals`,
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
      description: `Rent EVs in ${locationName}. Starting @₹399/day.`,
      images: ['https://transrentals.in/images/og/electric-scooter-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/electric-scooter-rental/${locationSlug}`,
    },
  };
}

export default async function ElectricScooterLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('electric-scooter-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="electric-scooter-rental" serviceName="Electric Scooter Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const schemaFaqs = [
    { question: `Where can I rent electric scooter in ${locationName}?`, answer: `TransRentals offers electric scooter rental across ${locationName}. We have Ola S1, Ather 450X, TVS iQube available with doorstep delivery.` },
    { question: `How much does EV rental cost in ${locationName}?`, answer: `Electric scooter rental in ${locationName} starts from ₹399/day. Monthly rentals start from ₹4,999/month.` },
    { question: `Is charging available in ${locationName}?`, answer: `Yes, you can charge at home or use public charging stations across ${locationName}. We provide charging cable with the scooter.` },
  ];

  const schemaVehicles = [
    { name: 'Ola S1 Pro', brand: 'Ola Electric', price: 499, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: `Rent Ola S1 Pro electric scooter in ${locationName} — India's bestselling EV with 135 km range per charge, 8.5 kW motor, 0-40 kmph in 3 seconds, and MoveOS smart connectivity. Zero fuel cost, app-based controls, reverse mode, and 4-hour home charging included. Starting from ₹499/day with doorstep delivery in ${locationName}.` },
    { name: 'Ather 450X', brand: 'Ather Energy', price: 599, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: `Rent Ather 450X electric scooter in ${locationName} — premium EV with 105 km range, built-in Google Maps navigation, Bluetooth dashboard, and 3.5-hour fast charging. Features auto-hold braking, OTA updates, and 95 kmph top speed. Tech-forward EV rental from ₹599/day with helmet and charger included in ${locationName}.` },
    { name: 'TVS iQube', brand: 'TVS', price: 449, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: `Rent TVS iQube electric scooter in ${locationName} — best-value EV with 100 km range, SmartXonnect Bluetooth technology, USB charging port, and navigation-ready instrument cluster. Eco-friendly city commuter costing just ₹15-20 per charge. Daily rental from ₹449/day with all accessories and doorstep delivery in ${locationName}.` },
  ];

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`electric-scooter-rental:${params.location}`),
    getServiceCityContent('electric-scooter-rental', params.location),
  ]);

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
        description={`Rent electric scooters in ${locationName}. Ola S1, Ather 450X, TVS iQube available. Starting @₹399/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 399, max: 599 }}
        rating={4.6}
        reviewCount={234}
      />

      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
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
                  <p className="text-lg font-black text-gray-900">₹0</p>
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
      <section id="evs" className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Electric Scooters Available in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { name: 'Ola S1 Pro', price: '499', range: '135 km', highlight: 'Best Range' },
              { name: 'Ather 450X', price: '599', range: '105 km', highlight: 'Premium' },
              { name: 'TVS iQube', price: '449', range: '100 km', highlight: 'Best Value' },
              { name: 'Bajaj Chetak', price: '549', range: '90 km', highlight: 'Classic' },
            ].map((ev) => (
              <div key={ev.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{ev.name}</h3>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full">{ev.highlight}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 mb-1">₹{ev.price}/day</p>
                <p className="text-sm text-gray-500 mb-4">Range: {ev.range}</p>
                <button className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition">
                  Rent Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              { Icon: Zap, title: 'Save ₹3000+/Month', desc: 'Only ₹15-20 per charge vs ₹150+ petrol' },
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
              { href: `/bike-on-rent/${params.location}`, Icon: BikeIcon, title: 'Bike Rental', desc: 'Petrol bikes from ₹299/day' },
              { href: `/activa-on-rent/${params.location}`, Icon: Gauge, title: 'Activa Rental', desc: 'Scooters from ₹299/day' },
              { href: `/monthly-bike-rental/${params.location}`, Icon: CalendarClock, title: 'Monthly Rental', desc: 'Long term from ₹2999/month' },
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
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

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
          { slug: 'electric-scooter-rental', name: 'Electric Scooter' },
        ]}
      />
    </>
  );
}
