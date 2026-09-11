import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { BusRentalBookingHero } from '@/components/bus-rental/BusRentalBookingHero';
import { Bus, BusFront, Sparkles, UserCheck, Flower2, Snowflake, Music, Armchair, ShieldCheck, PhoneCall, Check } from 'lucide-react';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getBusRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where bus-rental is available
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
    resolvePageMeta(`wedding-bus-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('wedding-bus-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Wedding Bus Rental in ${locationName} | Luxury Buses for Marriage @₹5999 | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book luxury AC buses for weddings in ${locationName}. Guest transportation, baraat buses, decorated buses available. 20-50 seater options. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `wedding bus rental in ${locationName}`,
      `marriage bus ${locationName}`,
      `${locationName} wedding bus`,
      `shaadi bus rental ${locationName}`,
      `baraat bus ${locationName}`,
    ],
    openGraph: {
      title: `Wedding Bus Rental in ${locationName} - TransRentals`,
      description: `Luxury AC buses for weddings in ${locationName} starting @₹5999/day.`,
    },
    alternates: { canonical: `https://transrentals.in/wedding-bus-rental/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Wedding Bus Rental in ${locationName} | TransRentals`,
      description: `Book luxury AC buses for weddings in ${locationName} starting @₹4999/day.`,
    },
  };
}

export default async function WeddingBusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-bus-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="wedding-bus-rental" serviceName="Wedding Bus Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const [busServiceId, locationId, scContent] = await Promise.all([
    getBusRentalServiceId(),
    getLocationId(params.location),
    getServiceCityContent('wedding-bus-rental', params.location),
  ]);

  const busModels = busServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: busServiceId, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sideImage: true,
      basePricePerDay: true,
      rating: true,
      seatingCapacity: true,
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

  const busFleet = busModels.map((m) => {
    const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
    const price = locationPrice ?? m.basePricePerDay ?? 0;
    return {
      id: m.id,
      name: m.name,
      slug: m.slug ?? undefined,
      brand: m.brands?.name ?? undefined,
      image: m.sideImage ?? '/images/fleet/bus-default.jpg',
      price: Number(price),
      rating: m.rating ?? undefined,
      specs: m.seatingCapacity ? { seating: `${m.seatingCapacity} Seater` } : undefined,
    };
  });

  const pageFaqs = [
    { question: 'What types of buses are available for wedding rental?', answer: 'We offer AC luxury coaches (26–49 seater), decorated mini buses (17–20 seater), and Tempo Travellers (9–17 seater) for wedding functions.' },
    { question: 'Is wedding decoration included in the bus rental?', answer: 'Yes, basic floral decoration is included for wedding packages. Premium decoration with lights and custom themes is available at extra cost.' },
    { question: 'How early should I book a wedding bus rental?', answer: 'We recommend booking at least 2–4 weeks in advance, especially for peak wedding season (Nov–Feb). Last-minute bookings are possible but subject to availability.' },
    { question: 'Can the wedding bus be used for baraat procession and multiple wedding events?', answer: 'Yes, our wedding bus packages cover multiple functions — baraat, reception, and return drop. Full-day packages are available for all wedding needs.' },
  ];

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/wedding-bus-rental" className="hover:text-primary">Wedding Bus Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <BusRentalBookingHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceType="wedding-bus-rental"
        badgeText={`Wedding Bus in ${locationName}`}
        headingLine1="Bus Rental for"
        headingLine2Plain=""
        headingLine2Accent="Weddings & Baraats"
        subheading={`Make your ${locationName} baraat unforgettable. Decorated AC buses for wedding processions, guest transport, and multi-day functions — driver and decoration included.`}
        bookingTitle="Book Your Wedding Bus"
        bookingSubtitle="Free quote • No advance payment"
      />

      {/* Wedding Packages */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Wedding Bus Packages in <span className="text-rose-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                Icon: Bus,
                name: 'Mini Bus',
                seats: '20-25 Seater',
                features: ['AC Bus', 'Basic Decoration', 'Professional Driver'],
              },
              {
                Icon: BusFront,
                name: 'Standard Bus',
                seats: '30-35 Seater',
                features: ['Premium AC', 'Full Decoration', 'Music System', 'Water Bottles'],
              },
              {
                Icon: Sparkles,
                name: 'Luxury Coach',
                seats: '40-50 Seater',
                features: ['Luxury AC Coach', 'Premium Decoration', 'Entertainment', 'Push-back Seats'],
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className="group bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:border-rose-300 hover:shadow-md transition-all"
              >
                <span className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 group-hover:bg-rose-600 transition-colors">
                  <pkg.Icon className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{pkg.seats}</p>
                <ul className="space-y-2 mb-5">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-rose-50 grid place-items-center">
                        <Check className="w-2.5 h-2.5 text-rose-600" strokeWidth={3.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-rose-600">Get Quote</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Included */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            What&apos;s <span className="text-emerald-600">Included?</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {[
              { Icon: Bus, title: 'Clean Buses', desc: 'Well-maintained vehicles' },
              { Icon: UserCheck, title: 'Professional Driver', desc: 'Experienced & courteous' },
              { Icon: Flower2, title: 'Decoration', desc: 'Flowers & ribbons' },
              { Icon: Snowflake, title: 'AC Comfort', desc: 'Climate controlled' },
              { Icon: Music, title: 'Music System', desc: 'Your favorite songs' },
              { Icon: Armchair, title: 'Comfortable Seats', desc: 'Push-back & reclining' },
              { Icon: ShieldCheck, title: 'Insured', desc: 'Complete coverage' },
              { Icon: PhoneCall, title: '24/7 Support', desc: 'Always available' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center">
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {busFleet.length > 0 && (
        <VehicleGrid
          vehicles={busFleet}
          title={`Wedding Buses Available in ${locationName}`}
        />
      )}

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location.toLowerCase()}
        service="wedding-bus-rental"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="wedding-bus-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}
      <BikeServiceSchema
        serviceName="Wedding Bus Rental"
        serviceSlug="wedding-bus-rental"
        description={`Book luxury AC buses for weddings in ${locationName} starting @₹4999/day.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="wedding-bus-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="wedding-bus-rental"
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
    </div>
  );
}
