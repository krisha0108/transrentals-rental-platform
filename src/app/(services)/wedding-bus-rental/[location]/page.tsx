import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where bus-rental is available
export async function generateStaticParams() {
  return getServiceLocations('bus-rental');
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
  };
}

export default async function WeddingBusLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-bus-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
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
        titleHighlight="Starting @₹5999/day"
        description={`Book luxury AC buses for your wedding in ${locationName}. Guest transportation, baraat, family travel. Decorated buses with professional drivers.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Decorated Buses', color: 'text-rose-600' },
          { icon: 'zap', text: 'AC Comfort', color: 'text-pink-600' },
        ]}
        gradientFrom="rose-50"
        gradientTo="pink-50"
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
                price: '₹3,999/day',
                features: ['AC Bus', 'Basic Decoration', 'Professional Driver'],
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                name: 'Standard Bus',
                seats: '30-35 Seater',
                price: '₹5,999/day',
                features: ['Premium AC', 'Full Decoration', 'Music System', 'Water Bottles'],
                gradient: 'from-rose-500 to-red-500',
                popular: true,
              },
              {
                name: 'Luxury Coach',
                seats: '40-50 Seater',
                price: '₹8,999/day',
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

      <FAQSection service="bus-rental" location={locationName} />

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
    </div>
  );
}
