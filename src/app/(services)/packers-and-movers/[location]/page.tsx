import React from 'react';
import type { Metadata } from 'next';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { CityContentSection } from '@/components/location/CityContentSection';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { PackersMoversServiceHero } from '@/components/services/PackersMoversServiceHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';
import {
  CheckCircle, Star, MapPin, Package,
  Home, Building2, Route, Car, Warehouse, Factory,
  Wrench, Truck, PackageOpen, ShieldCheck, ClipboardList,
  Award, Search, PhoneCall,
} from 'lucide-react';

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes.
   Same set as the hub page (src/app/(services)/packers-and-movers/page.tsx) — kept
   in sync so hub and city read as the same product. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

const SERVICE_TYPES = [
  { icon: Home, anim: 'pulse', title: 'Home Shifting', desc: 'Complete door-to-door household moving — packing, loading, transit, and unloading. Available for 1BHK, 2BHK, 3BHK, and villas.' },
  { icon: Building2, anim: 'lift', title: 'Office Relocation', desc: 'Professional office shifting with proper labelling, IT equipment packing, and after-hours scheduling to minimise business downtime.' },
  { icon: Route, anim: 'drive', title: 'Intercity Moving', desc: 'Pan-India household and commercial goods transport. Full-truck-load and shared (part-load) options for all routes.' },
  { icon: Car, anim: 'drive', title: 'Vehicle Transport', desc: 'Car and two-wheeler transport on enclosed trailers or open carriers. Available alongside household shifting or as a standalone service.' },
  { icon: Warehouse, anim: 'tick', title: 'Storage Solutions', desc: 'Temporary warehouse storage for goods during gap between move-out and move-in dates. Available in select cities.' },
  { icon: Factory, anim: 'wrench', title: 'Industrial & Commercial', desc: 'Factory machinery relocation, shop shifting, and bulk commercial goods transport with heavy-duty packing and rigging support.' },
];

const WHAT_IS_INCLUDED = [
  { icon: Package, anim: 'pulse', title: 'Packing Materials', desc: 'Boxes, bubble wrap, stretch film, and edge protectors for all goods' },
  { icon: Wrench, anim: 'wrench', title: 'Furniture Dismantling', desc: 'Beds, wardrobes, and modular furniture disassembled and reassembled' },
  { icon: Truck, anim: 'drive', title: 'Loading & Transport', desc: 'Professional loading team and insured transport vehicle' },
  { icon: PackageOpen, anim: 'lift', title: 'Unloading & Unpacking', desc: 'Unloading, placement in rooms, and unpacking on request' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Transit Insurance', desc: 'Optional declared-value insurance for electronics and high-value items' },
  { icon: ClipboardList, anim: 'tick', title: 'Inventory List', desc: 'Detailed inventory of goods packed for accountability during transit' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Request a Quote', desc: 'Share your shift details — home size, pickup city, delivery city, and preferred date', icon: MapPin },
  { step: 2, title: 'Compare Vendors', desc: 'Get quotes from multiple TransRentals-verified packers. Compare price, rating, and inclusions', icon: Star },
  { step: 3, title: 'Confirm Booking', desc: 'Confirm your preferred vendor with a small advance. Receive a booking confirmation and vendor contact', icon: CheckCircle },
  { step: 4, title: 'Shift & Settle', desc: 'The team arrives, packs professionally, transports safely, and unloads at your new home', icon: Package },
];

const TRUST_POINTS = [
  { icon: CheckCircle, anim: 'pulse', title: 'GST-Verified Vendors', desc: 'All listed movers have valid GST registration and moving licenses' },
  { icon: Star, anim: 'tick', title: '4.7/5 Average Rating', desc: 'Ratings from real customers post-shift — no fake reviews' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Transit Insurance', desc: 'Optional coverage for your goods during transport' },
  { icon: Award, anim: 'lift', title: 'IBA-Approved Movers', desc: 'Government-transfer-eligible movers listed for CPWD and PSU employees' },
  { icon: Search, anim: 'wrench', title: 'Background-Checked Teams', desc: 'Moving teams are verified by vendor before deployment' },
  { icon: PhoneCall, anim: 'ring', title: 'Post-Move Support', desc: 'TransRentals support available if any issue arises after the shift' },
];

const COMING_SOON_SLUGS = new Set([
  'okhla',
  'panihati',
  'yapral',
]);

const PACKERS_FALLBACK_FAQS = [
  {
    question: 'What is the cost of packers and movers in India?',
    answer: 'Packers and movers costs depend on home size, distance, and goods volume. Local shifts (1BHK) start from ₹3,999 and 2BHK intercity moves from ₹8,000–₹15,000. Get free quotes from verified movers on TransRentals to compare prices for your specific shift.',
  },
  {
    question: 'How long does it take to shift a 2BHK house?',
    answer: 'A professional team of 3–4 people takes 6–10 hours for a 2BHK intra-city shift including packing, loading, transit, and unloading. Intercity moves add 1–7 days transit time depending on distance.',
  },
  {
    question: 'Is transit insurance available for household shifting?',
    answer: 'Yes, all TransRentals-listed movers offer optional transit insurance at 0.5–1% of declared goods value. Strongly recommended for electronics, appliances, and high-value items. Confirm insurance coverage before booking.',
  },
  {
    question: 'Do movers disassemble and reassemble furniture?',
    answer: 'Yes, professional movers include dismantling and reassembly of beds, wardrobes, and modular furniture as a standard service. Always confirm this is included in your quote before booking.',
  },
  {
    question: 'How far in advance should I book packers and movers?',
    answer: 'Book at least 5–7 days in advance for month-end dates (28th–2nd), which are the busiest. Mid-month weekdays are easier to schedule and often priced lower. During peak transfer season (March–June) book 2–3 weeks ahead.',
  },
];

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL cities - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where packers-and-movers is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`packers-and-movers:${params.location.toLowerCase()}`),
    getServiceCityContent('packers-and-movers', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Packers and Movers in ${locationName} | Starting from ₹3,999 | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Verified packers and movers in ${locationName}. Local & intercity home shifting, office relocation. IBA-approved, insured moving teams. Get free quotes and book online.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `packers and movers in ${locationName}`,
      `movers and packers ${locationName}`,
      `home shifting ${locationName}`,
      `office relocation ${locationName}`,
      `${locationName} relocation services`,
      `household shifting ${locationName}`,
      `intercity movers ${locationName}`,
    ],
    alternates: {
      canonical: `https://transrentals.in/packers-and-movers/${params.location.toLowerCase()}`,
    },
    openGraph: {
      title: `Packers and Movers in ${locationName} | TransRentals`,
      description: `Verified packers and movers in ${locationName}. Home shifting, office relocation, intercity moves. IBA-approved and insured. Get free quotes.`,
      type: 'website',
      url: `https://transrentals.in/packers-and-movers/${params.location.toLowerCase()}`,
      images: [{ url: `https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(locationName)}`, width: 1200, height: 630, alt: `Packers and Movers in ${locationName}` }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Packers and Movers in ${locationName} | TransRentals`,
      description: `Verified packers and movers in ${locationName}. IBA-approved and insured. Home shifting, office relocation, intercity moves.`,
      images: [`https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

export default async function PackersMoversLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('packers-and-movers', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location.toLowerCase()}
            serviceSlug="packers-and-movers"
            serviceName="Packers & Movers"
            themeColor="blue"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="packers-and-movers" serviceName="Packers and Movers" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location.toLowerCase()}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
          themeColor="pink"
        />
        <NearbyActiveCities
          currentCitySlug={params.location.toLowerCase()}
          serviceSlug="packers-and-movers"
          serviceName="Packers & Movers"
        />
      </>
    );
  }
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));
  const cityData = getCityBySlug(params.location);

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`packers-and-movers:${params.location.toLowerCase()}`),
    getServiceCityContent('packers-and-movers', params.location),
  ]);
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['packers-and-movers'] || [];

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/packers-and-movers" className="hover:text-primary">
              Packers and Movers
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <PackersMoversServiceHero cityName={locationName} />

      {/* Service Types */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Moving Services in <span className="text-emerald-600">{locationName}</span>
            </h2>
            <p className="text-gray-500">
              From single-room shifts to full office relocations — TransRentals has verified vendors in {locationName} for every type of move.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {SERVICE_TYPES.map((service, idx) => (
              <div
                key={service.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `pnml-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <service.icon
                      className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[service.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{service.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pnml-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="pnml-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" />
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Book your move in {locationName} in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, idx) => (
              <div key={step} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-1/2 w-full border-t-2 border-dashed border-emerald-200" />
                )}
                <div className="group relative z-10 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span
                      className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"
                      style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                    />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center">
                        {step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900 mb-3">
              What&apos;s <span className="text-emerald-600">Included</span> in Your Move
            </h2>
            <p className="text-gray-500">
              A standard packers and movers booking in {locationName} covers the full shifting experience — from packing to placement.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {WHAT_IS_INCLUDED.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `pnml-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TransRentals */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900 mb-3">
              Why Book Movers on <span className="text-emerald-600">TransRentals?</span>
            </h2>
            <p className="text-gray-500">
              We verify every mover in {locationName} before listing. You compare, choose, and book — with full transparency.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TRUST_POINTS.map((point, idx) => (
              <div
                key={point.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `pnml-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <point.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[point.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{point.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="packers-and-movers"
      />

      <ServiceAreasSection
        serviceSlug="packers-and-movers"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Packers and Movers"
      />

      <CrossServiceLinks
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        currentServiceSlug="packers-and-movers"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection
        service="packers-and-movers"
        location={locationName}
        customFaqs={
          cityFAQs.length > 0
            ? cityFAQs.map((faq) => ({ question: faq.q, answer: faq.a }))
            : PACKERS_FALLBACK_FAQS
        }
      />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="packers-and-movers"
        parentName="Packers & Movers"
        currentSlug="packers-and-movers"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'bus-rental', name: 'Bus Rental' },
        ]}
      />

      {/* MovingCompany Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MovingCompany',
            name: `Packers and Movers in ${locationName} — TransRentals`,
            description: `Verified packers and movers in ${locationName}. Local and intercity home shifting, office relocation, and vehicle transport. IBA-approved, insured moving teams.`,
            url: `https://transrentals.in/packers-and-movers/${params.location.toLowerCase()}`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Packers and Movers Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Home Shifting' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Office Relocation' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Intercity Moving' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vehicle Transport' } },
              ],
            },
          }),
        }}
      />
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: cityFAQs.length > 0
              ? cityFAQs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                }))
              : PACKERS_FALLBACK_FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Packers and Movers', item: 'https://transrentals.in/packers-and-movers' },
              { '@type': 'ListItem', position: 3, name: `Packers and Movers in ${locationName}`, item: `https://transrentals.in/packers-and-movers/${params.location.toLowerCase()}` },
            ],
          }),
        }}
      />
    </div>
  );
}
