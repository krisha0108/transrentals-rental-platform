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
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

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
    title: _seoDb?.metaTitle || `Mini Truck Rental in ${locationName} | Tata Ace on Rent @₹1499/Day | TransRentals`,
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
      description: `Rent mini trucks in ${locationName} starting @₹1499/day. Perfect for deliveries.`,
    },
  };
}

export default async function MiniTruckLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('mini-truck-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="mini-truck-rental" serviceName="Mini Truck Rental" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Mini Truck Rental',
      slug: 'mini-truck-rental',
    },
    vehicles: [
      {
        id: 1,
        name: 'Tata Ace',
        image: '/images/fleet/tempo-traveller-17-seater.jpg',
        price: 1499,
        rating: 4.7,
      },
      {
        id: 2,
        name: 'Tata Ace Mega',
        image: '/images/fleet/force-traveller-12-seater.jpg',
        price: 1799,
        rating: 4.8,
      },
      {
        id: 3,
        name: 'Mahindra Jeeto',
        image: '/images/fleet/default-car.jpg',
        price: 1999,
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
            <a href="/mini-truck-rental" className="hover:text-primary">Mini Truck Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`Mini Truck Rental in ${locationName}`}
        title="Mini Truck on Rent"
        titleHighlight="Starting @₹1499/day"
        description={`Rent mini trucks in ${locationName} for local goods transport, house shifting, and city deliveries. Tata Ace, Mahindra Pickup available with driver.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Goods Insured', color: 'text-emerald-600' },
          { icon: 'zap', text: 'Quick Delivery', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
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

      {/* Available Models */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Mini Trucks Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Tata Ace',
                capacity: '750 KG',
                dimensions: "7'L x 4.5'W",
                price: '₹1,499/day',
                features: ['Most popular', 'Easy to drive', 'Compact'],
              },
              {
                name: 'Tata Ace Mega',
                capacity: '1 TON',
                dimensions: "8'L x 5'W",
                price: '₹1,799/day',
                features: ['Extended deck', 'More capacity', 'Reliable'],
              },
              {
                name: 'Mahindra Jeeto',
                capacity: '1.5 TON',
                dimensions: "8.5'L x 5.5'W",
                price: '₹1,999/day',
                features: ['Heavy load', 'Strong build', 'Fuel efficient'],
              },
            ].map((model) => (
              <div key={model.name} className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="text-xl font-bold mb-2">{model.name}</h3>
                <p className="text-gray-600 text-sm mb-1">Capacity: {model.capacity}</p>
                <p className="text-gray-600 text-sm mb-3">Size: {model.dimensions}</p>
                <p className="text-2xl font-bold text-primary mb-3">{model.price}</p>
                <ul className="space-y-1">
                  {model.features.map((feature) => (
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

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Mini Trucks Available in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <FAQSection service="transporter" location={locationName} />

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
    </div>
  );
}
