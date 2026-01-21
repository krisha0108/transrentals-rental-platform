import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { capitalize } from '@/lib/utils';
import { ALL_CITIES, STATIC_CITIES } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
export async function generateStaticParams() {
  return STATIC_CITIES.map((city) => ({
    location: city.slug,
  }));
}

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  return {
    title: `Corporate Bus Rental in ${locationName} | Employee Transport @₹4999 | TransRentals`,
    description: `Corporate bus rental in ${locationName} for employee transportation, office events & team outings. Daily, monthly & annual contracts available. Book now!`,
    keywords: [
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
  };
}

export default async function CorporateBusLocationPage({ params }: PageProps) {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Corporate Bus Rental',
      slug: 'corporate-bus-rental',
    },
    vehicles: [
      {
        id: 1,
        name: '20 Seater Mini Bus',
        image: '/images/buses/mini-bus.jpg',
        price: 4999,
        rating: 4.8,
      },
      {
        id: 2,
        name: '35 Seater AC Bus',
        image: '/images/buses/35-seater.jpg',
        price: 6999,
        rating: 4.9,
      },
      {
        id: 3,
        name: '45 Seater Luxury Coach',
        image: '/images/buses/luxury-coach.jpg',
        price: 9999,
        rating: 4.9,
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
            <a href="/corporate-bus-rental" className="hover:text-primary">Corporate Bus Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Corporate Bus in ${locationName}`}
        title="Corporate Bus Rental"
        titleHighlight="Starting @₹4999/day"
        description={`Reliable corporate bus rental in ${locationName} for employee transport, office events, conferences & team outings. Professional service guaranteed.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Professional Service', color: 'text-blue-600' },
          { icon: 'zap', text: 'On-Time Pickup', color: 'text-cyan-600' },
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

      {/* Rental Plans */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Flexible Rental Plans
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Daily',
                price: '₹4,999',
                period: 'per day',
                features: ['Single day rental', 'Professional driver', 'Fuel (250km)', 'AC bus'],
              },
              {
                name: 'Monthly',
                price: '₹99,999',
                period: 'per month',
                features: ['30-day rental', 'Dedicated driver', 'Unlimited km', 'Maintenance included'],
                popular: true,
              },
              {
                name: 'Annual',
                price: '₹9,99,999',
                period: 'per year',
                features: ['365-day rental', 'Dedicated fleet', 'Full maintenance', 'Replacement vehicle'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl p-6 shadow-lg ${
                  plan.popular ? 'border-4 border-primary' : 'border-2 border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">{plan.price}</span>
                  <span className="text-gray-600 text-sm">/{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Corporate Buses Available in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <FAQSection service="bus-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="corporate-bus-rental"
      />
    </div>
  );
}
