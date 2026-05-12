import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';

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

  const _seoDb = await resolvePageMeta(`wedding-bus-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Wedding Bus Rental in ${locationName} | Luxury Buses for Marriage @₹5999 | TransRentals`,
    description: _seoDb?.metaDescription || `Book luxury AC buses for weddings in ${locationName}. Guest transportation, baraat buses, decorated buses available. 20-50 seater options. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
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
    alternates: { canonical: `https://transrentals.in/wedding-bus-rental/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Wedding Bus Rental in ${locationName} | TransRentals`,
      description: `Book luxury AC buses for weddings in ${locationName} starting @₹4999/day.`,
    },
  };
}

export default async function WeddingBusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-bus-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="wedding-bus-rental" serviceName="Wedding Bus Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Wedding Bus Rental',
      slug: 'wedding-bus-rental',
    },
    vehicles: [
      {
        id: 1,
        name: '20 Seater Mini Bus',
        brand: 'Mini Bus',
        image: '/images/buses/mini-bus.jpg',
        price: 3999,
        rating: 4.8,
      },
      {
        id: 2,
        name: '35 Seater AC Bus',
        brand: 'Standard Bus',
        image: '/images/buses/35-seater.jpg',
        price: 5999,
        rating: 4.9,
      },
      {
        id: 3,
        name: '45 Seater Luxury Coach',
        brand: 'Luxury Coach',
        image: '/images/buses/luxury-coach.jpg',
        price: 8999,
        rating: 4.9,
      },
    ],
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  const seoData = await resolvePageMeta(`wedding-bus-rental:${params.location}`);

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

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Wedding Bus in ${locationName}`}
        title="Wedding Bus Rental"
        titleHighlight="Baraat Ready @₹4999/day"
        description={`Make your ${locationName} baraat unforgettable. Decorated AC buses for wedding processions, guest transport, and multi-day functions — driver and decoration included.`}
        features={[
          { icon: 'star', text: 'Baraat Decoration', color: 'text-pink-500' },
          { icon: 'shield', text: 'AC & Non-AC Options', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Professional Driver', color: 'text-rose-500' },
        ]}
        gradientFrom="pink-50"
        gradientTo="fuchsia-50"
      />

      {/* Wedding Packages */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Wedding Bus Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mini Bus',
                seats: '20-25 Seater',
                price: 'Starting ₹3,999',
                features: ['AC Bus', 'Basic Decoration', 'Professional Driver'],
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                name: 'Standard Bus',
                seats: '30-35 Seater',
                price: 'Starting ₹5,999',
                features: ['Premium AC', 'Full Decoration', 'Music System', 'Water Bottles'],
                gradient: 'from-rose-500 to-red-500',
                popular: true,
              },
              {
                name: 'Luxury Coach',
                seats: '40-50 Seater',
                price: 'Starting ₹8,999',
                features: ['Luxury AC Coach', 'Premium Decoration', 'Entertainment', 'Push-back Seats'],
                gradient: 'from-red-500 to-orange-500',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-gradient-to-br ${pkg.gradient} text-white rounded-xl p-6 shadow-lg`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <p className="text-white/90 mb-2">{pkg.seats}</p>
                <p className="text-2xl font-bold mb-4">{pkg.price}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span>✓</span>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Included */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What&apos;s Included?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🚌', title: 'Clean Buses', desc: 'Well-maintained vehicles' },
              { icon: '👨‍✈️', title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: '🎀', title: 'Decoration', desc: 'Flowers & ribbons' },
              { icon: '❄️', title: 'AC Comfort', desc: 'Climate controlled' },
              { icon: '🎵', title: 'Music System', desc: 'Your favorite songs' },
              { icon: '💺', title: 'Comfortable Seats', desc: 'Push-back & reclining' },
              { icon: '🛡️', title: 'Insured', desc: 'Complete coverage' },
              { icon: '📞', title: '24/7 Support', desc: 'Always available' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 rounded-lg shadow-md text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Wedding Buses Available in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <FAQSection service="bus-rental" location={locationName} customFaqs={pageFaqs} />

      <NearbyLocations
        locationSlug={params.location}
        service="wedding-bus-rental"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="wedding-bus-rental"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      <BikeServiceSchema
        serviceName="Wedding Bus Rental"
        serviceSlug="wedding-bus-rental"
        description={`Book luxury AC buses for weddings in ${locationName} starting @₹4999/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
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
