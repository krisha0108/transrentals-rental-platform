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

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where equipment-rental is available
export async function generateStaticParams() {
  return getServiceLocations('equipment-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locationName = capitalize(params.location.replace(/-/g, ' '));

  return {
    title: `JCB on Rent in ${locationName} | Backhoe Loader Rental @₹2999/Day | TransRentals`,
    description: `Rent JCB backhoe loaders in ${locationName} for construction, excavation & road work. Expert operators included. Book JCB rental now!`,
    keywords: [
      `jcb on rent in ${locationName}`,
      `jcb rental ${locationName}`,
      `${locationName} backhoe loader rental`,
      `excavator rental ${locationName}`,
      `construction equipment ${locationName}`,
    ],
    openGraph: {
      title: `JCB on Rent in ${locationName} - TransRentals`,
      description: `Rent JCB backhoe loaders in ${locationName} starting @₹2999/day with operators.`,
    },
  };
}

export default async function JCBLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('jcb-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="jcb-on-rent" serviceName="JCB on Rent" />;
  const city = pageContext.city;

  const locationName = capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'JCB on Rent',
      slug: 'jcb-on-rent',
    },
    vehicles: [
      {
        id: 1,
        name: 'JCB 3DX',
        image: '/images/locations/default.jpg', // Placeholder - replace with actual image
        price: 2999,
        rating: 4.8,
      },
      {
        id: 2,
        name: 'JCB 3DX Super',
        image: '/images/locations/default.jpg', // Placeholder - replace with actual image
        price: 3499,
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
            <a href="/jcb-on-rent" className="hover:text-primary">JCB on Rent</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <ServiceHeroWithChat
        badge={`JCB Rental in ${locationName}`}
        title="JCB on Rent"
        titleHighlight="Starting @₹2999/day"
        description={`Rent JCB backhoe loaders in ${locationName} for excavation, construction, and earthmoving. Well-maintained machines with expert operators.`}
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Expert Operators', color: 'text-yellow-600' },
          { icon: 'zap', text: 'Well Maintained', color: 'text-orange-600' },
        ]}
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      {/* Applications */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            JCB Applications in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⛏️', title: 'Excavation', desc: 'Foundations, basements & trenches' },
              { icon: '🏗️', title: 'Construction', desc: 'Material handling & site prep' },
              { icon: '🛣️', title: 'Road Work', desc: 'Road laying & repair' },
              { icon: '🌳', title: 'Land Clearing', desc: 'Vegetation & leveling' },
              { icon: '🏠', title: 'Foundations', desc: 'Building base preparation' },
              { icon: '💧', title: 'Pipeline', desc: 'Trenching for pipes' },
              { icon: '🚧', title: 'Demolition', desc: 'Breaking structures' },
              { icon: '🏞️', title: 'Landscaping', desc: 'Earth moving' },
              { icon: '⚙️', title: 'Loading', desc: 'Loading trucks & materials' },
            ].map((app) => (
              <div key={app.title} className="bg-gradient-to-br from-yellow-50 to-white p-5 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl mb-2">{app.icon}</div>
                <h3 className="font-bold mb-1">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JCB Models */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            JCB Models Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: 'JCB 3DX',
                desc: 'Most popular & versatile',
                features: ['Front loader bucket', 'Rear excavator arm', 'All-terrain', '4WD available'],
                price: '₹2,999/day',
              },
              {
                name: 'JCB 3DX Super',
                desc: 'Enhanced performance',
                features: ['Higher dig depth', 'Powerful engine', 'Better hydraulics', 'Extended reach'],
                price: '₹3,499/day',
              },
            ].map((model) => (
              <div key={model.name} className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-300">
                <div className="text-5xl mb-3">🚜</div>
                <h3 className="text-xl font-bold mb-1">{model.name}</h3>
                <p className="text-gray-600 mb-3">{model.desc}</p>
                <ul className="space-y-2 mb-4">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-2xl font-bold text-primary">{model.price}</p>
                <p className="text-sm text-gray-600">+ Operator charges</p>
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
              { icon: '🚜', title: 'Machine', desc: 'Well-maintained JCB' },
              { icon: '👷', title: 'Operator', desc: 'Expert certified operator' },
              { icon: '⛽', title: 'Fuel Options', desc: 'With/without fuel' },
              { icon: '🛠️', title: 'Tools', desc: 'Basic attachments' },
              { icon: '🚚', title: 'Transport', desc: 'Delivery to site' },
              { icon: '🛡️', title: 'Insurance', desc: 'Comprehensive coverage' },
              { icon: '⏰', title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
              { icon: '📞', title: 'Support', desc: 'On-call assistance' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-yellow-50 to-white p-5 rounded-lg border border-yellow-200 text-center">
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
        title={`JCB Equipment Available in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />

      <FAQSection service="equipment-rental" location={locationName} />

      <NearbyLocations
        locationSlug={params.location}
        service="jcb-on-rent"
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="jcb-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
    </div>
  );
}
