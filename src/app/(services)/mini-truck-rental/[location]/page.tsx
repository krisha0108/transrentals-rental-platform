import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getTransporterServiceId, getLocationId } from '@/lib/db/build-cache';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where transporter is available
export async function generateStaticParams() {
  return getServiceLocations('transporter');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const _seoDb = await resolvePageMeta(`mini-truck-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Mini Truck Rental in ${locationName} | Starting ₹1,499/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent mini trucks in ${locationName}. Tata Ace, Mahindra Pickup available. Perfect for local deliveries, house shifting & goods transport. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `mini truck rental in ${locationName}`,
      `tata ace on rent ${locationName}`,
      `${locationName} mini truck hire`,
      `chhota hathi rental ${locationName}`,
      `goods carrier ${locationName}`,
    ],
    openGraph: {
      title: `Mini Truck Rental in ${locationName} - TransRentals`,
      description: `Rent Tata Ace and mini trucks in ${locationName} for deliveries, house shifting & goods transport.`,
    },
    alternates: { canonical: `https://transrentals.in/mini-truck-rental/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Mini Truck Rental in ${locationName} | TransRentals`,
      description: `Rent Tata Ace and mini trucks in ${locationName}. Driver included. Book for deliveries, house shifting & goods transport.`,
    },
  };
}

export default async function MiniTruckLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('mini-truck-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="mini-truck-rental" serviceName="Mini Truck Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageFaqs = [
    { question: 'What is the load capacity of a mini truck (Tata Ace)?', answer: 'Tata Ace has a load capacity of 750 kg. Mahindra Pickup and Bolero Pickup handle up to 1000 kg for slightly larger goods.' },
    { question: 'Is the mini truck available for house shifting?', answer: 'Yes, mini trucks are ideal for small household moves, apartment shifting, and single-room relocations within the city.' },
    { question: 'What is the mini truck rental rate per day?', answer: 'Tata Ace rental starts from ₹1499/day with driver and fuel included for up to 100 km. Additional km at ₹15/km.' },
    { question: 'Can I book a mini truck for just 2–3 hours?', answer: 'Yes, half-day (4-hour) packages are available starting from ₹799 including driver and 40 km. Ideal for market runs and shop deliveries.' },
  ];

  const [seoData, transporterServiceId, locationId] = await Promise.all([
    resolvePageMeta(`mini-truck-rental:${params.location}`),
    getTransporterServiceId(),
    getLocationId(params.location),
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

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Mini Truck Rental in ${locationName}`}
        title="Mini Truck Rental"
        titleHighlight="Driver Included | All India"
        description={`Fast, affordable goods transport in ${locationName}. Tata Ace, Mahindra Pickup available — house shifting, shop deliveries, market runs. Driver included.`}
        features={[
          { icon: 'zap', text: '750kg Load Capacity', color: 'text-red-600' },
          { icon: 'shield', text: 'GPS Tracked', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      {/* Use Cases */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Mini Truck Services in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '📦', title: 'Local Deliveries', desc: 'Last-mile delivery' },
              { icon: '🏠', title: 'House Shifting', desc: 'Small households' },
              { icon: '🏪', title: 'Business Transport', desc: 'Inventory movement' },
              { icon: '🛒', title: 'E-commerce', desc: 'Order fulfillment' },
              { icon: '🏗️', title: 'Construction', desc: 'Material transport' },
              { icon: '🍕', title: 'Food & Catering', desc: 'Bulk food delivery' },
              { icon: '📚', title: 'Furniture', desc: 'Small furniture' },
              { icon: '♻️', title: 'Waste Disposal', desc: 'Junk removal' },
            ].map((use) => (
              <div key={use.title} className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-lg border-2 border-orange-200 text-center">
                <div className="text-3xl mb-2">{use.icon}</div>
                <h3 className="font-bold mb-1">{use.title}</h3>
                <p className="text-sm text-gray-600">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {truckFleet.length > 0 && (
        <VehicleGrid
          vehicles={truckFleet}
          title={`Mini Trucks Available in ${locationName}`}
        />
      )}

      <WhyRentHere locationName={locationName} />

      <FAQSection service="transporter" location={locationName} customFaqs={pageFaqs} />

      <NearbyLocations
        locationSlug={params.location}
        service="mini-truck-rental"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="mini-truck-rental"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      <BikeServiceSchema
        serviceName="Mini Truck Rental"
        serviceSlug="mini-truck-rental"
        description={`Rent Tata Ace and mini trucks in ${locationName} for deliveries, house shifting & goods transport. Driver included.`}
        city={locationName}
        citySlug={params.location}
        faqs={pageFaqs}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="transporter"
        parentName="Truck & Tempo Rental"
        currentSlug="mini-truck-rental"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'trailer-on-rent', name: 'Trailer on Rent' },
        ]}
      />
    </div>
  );
}
