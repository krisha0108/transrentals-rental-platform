import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getBusRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { RelatedServices } from '@/components/services/RelatedServices';
import { BikeServiceSchema } from '@/components/seo/schemas';
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
    resolvePageMeta(`corporate-bus-rental:${params.location}`),
    getServiceCityContent('corporate-bus-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Corporate Bus Rental in ${locationName} | Employee Transport @₹4999 | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Corporate bus rental in ${locationName} for employee transportation, office events & team outings. Daily, monthly & annual contracts available. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `corporate bus rental in ${locationName}`,
      `employee transport bus ${locationName}`,
      `${locationName} office bus rental`,
      `company bus hire ${locationName}`,
      `staff transport ${locationName}`,
    ],
    openGraph: {
      title: `Corporate Bus Rental in ${locationName} - TransRentals`,
      description: `Professional corporate bus rental in ${locationName} starting @₹4999/day.`,
    },
    alternates: { canonical: `https://transrentals.in/corporate-bus-rental/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Corporate Bus Rental in ${locationName} | TransRentals`,
      description: `Corporate bus rental in ${locationName} starting @₹4999/day for employee transport & events.`,
    },
  };
}

export default async function CorporateBusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('corporate-bus-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="corporate-bus-rental" serviceName="Corporate Bus Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageFaqs = [
    { question: 'What is corporate bus rental and what does it cover?', answer: 'Corporate bus rental covers daily employee pick-up/drop, office event transportation, team outings, and airport transfers for groups.' },
    { question: 'Can I get a fixed monthly contract for corporate bus rental?', answer: 'Yes, monthly fixed contracts with dedicated routes, fixed timings, and dedicated driver are available for corporate clients.' },
    { question: 'Is GST invoice provided for corporate bus rental?', answer: 'Yes, GST-compliant invoices with SAC code are provided for all corporate bookings. Monthly consolidated billing is available.' },
    { question: 'What bus sizes are available for corporate hire?', answer: 'We offer 17, 20, 26, 32, and 49-seater buses for corporate use — AC and non-AC — based on employee count and route requirements.' },
  ];

  const [seoData, busServiceId, locationId, scContent] = await Promise.all([
    resolvePageMeta(`corporate-bus-rental:${params.location}`),
    getBusRentalServiceId(),
    getLocationId(params.location),
    getServiceCityContent('corporate-bus-rental', params.location),
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


  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/corporate-bus-rental" className="hover:text-primary">Corporate Bus Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        badge={`Corporate Bus in ${locationName}`}
        title="Corporate Bus Rental"
        titleHighlight="Employee Transport @₹4999/day"
        description={`Reliable daily employee transport in ${locationName}. Fixed routes, GPS tracking, on-time service — daily, monthly, and annual corporate contracts available.`}
        features={[
          { icon: 'zap', text: 'GPS Tracked Routes', color: 'text-blue-600' },
          { icon: 'shield', text: 'Professional Driver', color: 'text-emerald-600' },
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      />

      {/* Use Cases */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Corporate Bus Services in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🏢',
                title: 'Employee Transport',
                desc: 'Daily pickup & drop for your staff',
                features: ['Fixed routes', 'Multiple shifts', 'GPS tracking'],
              },
              {
                icon: '🎯',
                title: 'Corporate Events',
                desc: 'Conferences & seminars',
                features: ['Venue transfers', 'Multi-city events', 'Large groups'],
              },
              {
                icon: '🌄',
                title: 'Team Outings',
                desc: 'Team building trips',
                features: ['Weekend trips', 'Hill stations', 'Adventure tours'],
              },
            ].map((service) => (
              <div key={service.title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border-2 border-blue-200">
                <div className="text-4xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-3">{service.desc}</p>
                <ul className="space-y-1">
                  {service.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {busFleet.length > 0 && (
        <VehicleGrid
          vehicles={busFleet}
          title={`Corporate Buses Available in ${locationName}`}
        />
      )}

      <WhyRentHere locationName={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="corporate-bus-rental"
      />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="corporate-bus-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}
      <BikeServiceSchema
        serviceName="Corporate Bus Rental"
        serviceSlug="corporate-bus-rental"
        description={`Corporate bus rental in ${locationName} starting @₹4999/day for employee transport & events.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bus-rental"
        parentName="Bus Rental"
        currentSlug="corporate-bus-rental"
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
