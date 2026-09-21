import React from 'react';
import type { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { MiniTruckBookingHero } from '@/components/mini-truck-rental/MiniTruckBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getTransporterServiceId, getLocationId } from '@/lib/db/build-cache';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CITY_SEO } from '@/data/city-seo-content';
import { Package, Home as HomeIcon, Store, ShoppingCart, Construction, UtensilsCrossed, Armchair, Recycle } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations
// Generate static params from DATABASE - Only locations where transporter is available
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
    resolvePageMeta(`mini-truck-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('mini-truck-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Mini Truck Rental in ${locationName} | Tata Ace & Pickup Hire | TransRentals`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent mini trucks in ${locationName}. Tata Ace, Mahindra Pickup available. Perfect for local deliveries, house shifting & goods transport. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `mini truck rental in ${locationName}`,
      `tata ace on rent ${locationName}`,
      `${locationName} mini truck hire`,
      `chhota hathi rental ${locationName}`,
      `goods carrier ${locationName}`,
    ],
    alternates: { canonical: `https://transrentals.in/mini-truck-rental/${params.location.toLowerCase()}` },
    openGraph: {
      title: `Mini Truck Rental in ${locationName} | TransRentals`,
      description: `Rent Tata Ace and mini trucks in ${locationName} for deliveries, house shifting & goods transport.`,
      type: 'website',
      url: `https://transrentals.in/mini-truck-rental/${params.location.toLowerCase()}`,
      images: [{ url: `https://transrentals.in/api/og?service=mini-truck-rental&location=${encodeURIComponent(locationName)}`, width: 1200, height: 630, alt: `Mini Truck Rental in ${locationName}` }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Mini Truck Rental in ${locationName} | TransRentals`,
      description: `Rent Tata Ace and mini trucks in ${locationName}. Driver included. Book for deliveries, house shifting & goods transport.`,
      images: [`https://transrentals.in/api/og?service=mini-truck-rental&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

const EXPANDING_FAQS = [
  { question: 'What can a mini truck carry?', answer: 'Tata Ace carries up to 750 kg; Mahindra and Bolero pickups handle up to 1000 kg. They suit small household moves, shop deliveries and market runs.' },
  { question: 'When will mini truck rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is a driver included?', answer: 'Yes, every mini truck on TransRentals comes with a verified professional driver.' },
];

/**
 * What a city sees while no operator is live there yet: no booking form and no
 * quoted rate, just the nearest cities that are bookable today.
 */
function ExpandingCityPage({ cityName, citySlug }: { cityName: string; citySlug: string }) {
  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/mini-truck-rental" className="hover:text-primary">Mini Truck Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="mini truck rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="mini-truck-rental"
          serviceName="Mini Truck Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="mini truck"
        selectionDesc="Tata Ace, Mahindra and Bolero pickups — 750 kg to 1 tonne."
      />
      <FAQSection service="mini-truck-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function MiniTruckLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('mini-truck-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'transporter',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="mini-truck-rental" serviceName="Mini Truck Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const MINI_TRUCK_FALLBACK_FAQS = [
    { question: 'What is the load capacity of a mini truck (Tata Ace)?', answer: 'Tata Ace has a load capacity of 750 kg. Mahindra Pickup and Bolero Pickup handle up to 1000 kg for slightly larger goods.' },
    { question: 'Is the mini truck available for house shifting?', answer: 'Yes, mini trucks are ideal for small household moves, apartment shifting, and single-room relocations within the city.' },
    { question: 'How is mini truck rental charged?', answer: 'Mini trucks are quoted per day with driver and fuel included up to a set kilometre limit, and anything beyond that is charged per extra km. The operator confirms both in the quote.' },
    { question: 'Can I book a mini truck for just 2–3 hours?', answer: 'Yes, half-day (4-hour) packages are available including driver and a fixed kilometre allowance. Ideal for market runs and shop deliveries.' },
  ];
  const cityFAQs = CITY_SEO[params.location]?.serviceFAQs?.['mini-truck-rental'] || [];
  const displayFAQs = cityFAQs.length > 0
    ? cityFAQs
        .map((faq) => ({ question: faq.q, answer: stripPricesFromText(faq.a) }))
        .filter((faq) => faq.answer)
    : MINI_TRUCK_FALLBACK_FAQS;

  const [seoData, transporterServiceId, locationId, scContent] = await Promise.all([
    resolvePageMeta(`mini-truck-rental:${params.location.toLowerCase()}`),
    getTransporterServiceId(),
    getLocationId(params.location),
    getServiceCityContent('mini-truck-rental', params.location),
  ]);

  const truckModels = transporterServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: transporterServiceId, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sideImage: true,
      basePricePerDay: true,
      rating: true,
      brands: { select: { name: true } },
      ...(locationId ? {
        vehicle_model_locations: {
          where: { locationId, isActive: true },
          select: { basePricePerDay: true },
          take: 1,
        },
      } : {}),
    },
    orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
  }) : [];

  const truckFleet = truckModels.map((m) => {
    const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
    const price = locationPrice ?? m.basePricePerDay ?? 0;
    return {
      id: m.id,
      name: m.name,
      slug: m.slug ?? undefined,
      brand: m.brands?.name ?? undefined,
      image: m.sideImage ?? '/images/fleet/default-car.jpg',
      price: Number(price),
      rating: m.rating ?? undefined,
    };
  });


  // The admin block editor renders its own Why Us / Other Services / FAQ
  // blocks. Where the city has one, the hardcoded section below is skipped
  // so the page doesn't say the same thing twice.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);
  const adminCoversOtherServices = hasSectionMatching(scContent?.sectionsConfig, /services?[-\s_]?(offered|available)|other[-\s_]?services/i);
  const adminCoversFaqs = hasSectionMatching(scContent?.sectionsConfig, /faq/i);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/mini-truck-rental" className="hover:text-primary">Mini Truck Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <MiniTruckBookingHero
        city={locationName}
        citySlug={params.location}
        pageHeading={stripPricesFromText(scContent?.pageHeading || seoData?.pageHeading) || undefined}
        pageDescription={stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined}
      />

      {/* Use Cases */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-10">
            Mini Truck Services in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { Icon: Package, title: 'Local Deliveries', desc: 'Last-mile delivery' },
              { Icon: HomeIcon, title: 'House Shifting', desc: 'Small households' },
              { Icon: Store, title: 'Business Transport', desc: 'Inventory movement' },
              { Icon: ShoppingCart, title: 'E-commerce', desc: 'Order fulfillment' },
              { Icon: Construction, title: 'Construction', desc: 'Material transport' },
              { Icon: UtensilsCrossed, title: 'Food & Catering', desc: 'Bulk food delivery' },
              { Icon: Armchair, title: 'Furniture', desc: 'Small furniture' },
              { Icon: Recycle, title: 'Waste Disposal', desc: 'Junk removal' },
            ].map((use, idx) => (
              <div
                key={use.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `mtc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <use.Icon className="w-5 h-5 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{use.title}</h3>
                <p className="text-xs text-gray-500">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes mtc-rise { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="mtc-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>


      {truckFleet.length > 0 && (
        <VehicleGrid
          vehicles={truckFleet}
          title={`Mini Trucks Available in ${locationName}`}
        />
      )}

      {!adminCoversWhyUs && (
        <WhyRentHere locationName={locationName} />
      )}

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="mini-truck-rental"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="mini-truck-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      <ServiceAreasSection
        hidePrices
        serviceSlug="mini-truck-rental"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Mini Truck Rental"
      />

      {!adminCoversOtherServices && (
        <CrossServiceLinks
          citySlug={params.location.toLowerCase()}
          cityName={locationName}
          currentServiceSlug="mini-truck-rental"
        />
      )}

      {/* LocalBusiness Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `Mini Truck Rental in ${locationName} — TransRentals`,
        description: `Rent Tata Ace and mini trucks in ${locationName} for local deliveries, house shifting & goods transport. Driver included.`,
        url: `https://transrentals.in/mini-truck-rental/${params.location.toLowerCase()}`,
        areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        priceRange: '₹₹',
      })}} />
      {/* BreadcrumbList Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Mini Truck Rental', item: 'https://transrentals.in/mini-truck-rental' },
          { '@type': 'ListItem', position: 3, name: `Mini Truck Rental in ${locationName}`, item: `https://transrentals.in/mini-truck-rental/${params.location.toLowerCase()}` },
        ],
      })}} />
      {/* FAQPage Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: displayFAQs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      })}} />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      {!adminCoversFaqs && (
        <FAQSection service="mini-truck-rental" location={locationName} customFaqs={displayFAQs} />
      )}

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="mini-truck-rental"
        parentName="Mini Truck Rental"
        currentSlug="mini-truck-rental"
        siblings={[
          { slug: 'bus-rental', name: 'Bus Rental' },
          { slug: 'trailer-on-rent', name: 'Trailer on Rent' },
          { slug: 'packers-and-movers', name: 'Packers & Movers' },
        ]}
      />
    </div>
  );
}
