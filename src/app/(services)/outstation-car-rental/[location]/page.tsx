import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  return {
    title: `Outstation Car Rental in ${locationName} | Intercity Hire @₹10/Km | TransRentals`,
    description: `Rent cars for outstation trips from ${locationName}. Round trips, one-way drops, multi-city tours. Professional drivers, all India permits. Book now!`,
    keywords: [
      `outstation car rental in ${locationName}`,
      `intercity car hire ${locationName}`,
      `${locationName} outstation cab`,
      `car for long trip ${locationName}`,
      `outstation taxi ${locationName}`,
    ],
    openGraph: {
      title: `Outstation Car Rental from ${locationName} - TransRentals`,
      description: `Rent cars for outstation trips from ${locationName} starting @₹10/km.`,
    },
  };
}

export default async function OutstationCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('outstation-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="outstation-car-rental" serviceName="Outstation Car Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Outstation Car Rental',
      slug: 'outstation-car-rental',
    },
    vehicles: [
      {
        id: 1,
        name: 'Maruti Dzire',
        image: '/images/cars/dzire.jpg',
        price: 11,
        rating: 4.7,
      },
      {
        id: 2,
        name: 'Honda City',
        image: '/images/cars/city.jpg',
        price: 13,
        rating: 4.8,
      },
      {
        id: 3,
        name: 'Toyota Innova Crysta',
        image: '/images/cars/innova.jpg',
        price: 16,
        rating: 4.9,
      },
      {
        id: 4,
        name: 'Kia Carens',
        image: '/images/cars/carens.jpg',
        price: 14,
        rating: 4.8,
      },
    ],
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/outstation-car-rental" className="hover:text-primary">Outstation Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Outstation Car from ${locationName}`}
        title="Outstation Car Rental"
        titleHighlight="Starting @₹10/km"
        description={`Rent cars for outstation trips from ${locationName}. Round trips, one-way drops, multi-city tours available. Professional drivers with all India permits.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'All India Permit', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Professional Drivers', color: 'text-purple-600' },
        ]}
        gradientFrom="sky-50"
        gradientTo="blue-50"
      />

      {/* Trip Types */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Outstation Trip Packages from {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Round Trip',
                icon: '🔄',
                desc: 'Go and return to same city',
                rate: '₹10-12/km',
                features: ['Min 250 km/day', 'Driver allowance', 'Night charges extra'],
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                name: 'One-Way Drop',
                icon: '➡️',
                desc: 'Travel to different city',
                rate: '₹12-14/km',
                features: ['No return km charged', 'Drop anywhere', 'Ideal for relocation'],
                gradient: 'from-purple-500 to-pink-500',
                popular: true,
              },
              {
                name: 'Multi-City Tour',
                icon: '🗺️',
                desc: 'Visit multiple destinations',
                rate: '₹11-13/km',
                features: ['Custom itinerary', 'Unlimited stops', 'Driver stay included'],
                gradient: 'from-orange-500 to-red-500',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-gradient-to-br ${pkg.gradient} text-white rounded-xl p-6 shadow-lg`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-4xl mb-3">{pkg.icon}</div>
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <p className="text-white/90 mb-2">{pkg.desc}</p>
                <p className="text-2xl font-bold mb-4">{pkg.rate}</p>
                <ul className="space-y-1">
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

      {/* Vehicle Options */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Cars Available for Outstation from {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { type: 'Hatchback', models: 'Swift, i20', rate: '₹10/km', seats: '4 seater' },
              { type: 'Sedan', models: 'Dzire, City', rate: '₹11/km', seats: '4 seater' },
              { type: 'SUV', models: 'Creta, Seltos', rate: '₹14/km', seats: '6-7 seater' },
              { type: 'Innova', models: 'Crysta, Hycross', rate: '₹16/km', seats: '7 seater' },
            ].map((vehicle) => (
              <div key={vehicle.type} className="bg-white p-5 rounded-lg shadow-md border-2 border-purple-200">
                <div className="text-3xl mb-2">🚗</div>
                <h3 className="font-bold mb-1">{vehicle.type}</h3>
                <p className="text-sm text-gray-600 mb-2">{vehicle.models}</p>
                <p className="text-primary font-bold text-lg mb-1">{vehicle.rate}</p>
                <p className="text-xs text-gray-500">{vehicle.seats}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What&apos;s Included?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍✈️', title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: '⛽', title: 'Fuel Charges', desc: 'All fuel included' },
              { icon: '🛣️', title: 'Toll & Parking', desc: 'All charges included' },
              { icon: '💼', title: 'Driver Allowance', desc: 'Daily allowance covered' },
              { icon: '🛡️', title: 'Insurance', desc: 'Fully insured vehicles' },
              { icon: '🗺️', title: 'State Permits', desc: 'All India permits' },
              { icon: '📞', title: '24/7 Support', desc: 'Always available' },
              { icon: '🧼', title: 'Clean Vehicles', desc: 'Sanitized cars' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-lg border border-purple-200 text-center">
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
        title={`Outstation Cars Available in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="outstation-car-rental"
      />

      <FAQSection service="car-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="outstation-car-rental"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="outstation-car-rental"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
    </div>
  );
}
