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
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getServiceLocations('bike-on-rent');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  const _seoDb = await resolvePageMeta(`pulsar-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Pulsar on Rent in ${locationName} | Bajaj Pulsar Rental @₹499/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Bajaj Pulsar bikes in ${locationName}. Pulsar 150, 180, NS200, RS200 available. Reliable sports bikes. Book your Pulsar rental now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `pulsar on rent in ${locationName}`,
      `bajaj pulsar rental ${locationName}`,
      `${locationName} pulsar rental`,
      `rent pulsar in ${locationName}`,
      `pulsar 150 on rent ${locationName}`,
    ],
    openGraph: {
      title: `Pulsar on Rent in ${locationName} @₹499/Day | TransRentals`,
      description: `Rent Bajaj Pulsar bikes in ${locationName} starting @₹499/day. Reliable & fuel efficient.`,
      type: 'website',
      url: `https://transrentals.in/pulsar-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/pulsar-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Pulsar Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Pulsar on Rent in ${locationName} | TransRentals`,
      description: `Rent Pulsar bikes in ${locationName} starting @₹499/day.`,
      images: ['https://transrentals.in/images/og/pulsar-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/pulsar-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which Pulsar models are available for rent?', answer: 'We have Pulsar 150, Pulsar 180, Pulsar NS200, and Pulsar RS200 available for rent.' },
  { question: 'What is the security deposit for Pulsar rental?', answer: 'Security deposit ranges from ₹3,000 to ₹8,000 depending on the model. This is fully refundable upon return.' },
  { question: 'What is the mileage of Pulsar bikes?', answer: 'Pulsar bikes give approximately 45-55 km/litre depending on the model and riding conditions.' },
  { question: 'Can I rent Pulsar for monthly basis?', answer: 'Yes, we offer monthly Pulsar rental plans starting from ₹5,999/month with free maintenance.' },
];

const schemaVehicles = [
  { name: 'Bajaj Pulsar 150', brand: 'Bajaj', price: 499 },
  { name: 'Bajaj Pulsar 180', brand: 'Bajaj', price: 599 },
  { name: 'Bajaj Pulsar NS200', brand: 'Bajaj', price: 699 },
  { name: 'Bajaj Pulsar RS200', brand: 'Bajaj', price: 799 },
];

export default async function PulsarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('pulsar-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="pulsar-on-rent" serviceName="Pulsar on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'Bajaj Pulsar 150',
        image: '/images/bikes/pulsar-150.jpg',
        price: 499,
        rating: 4.8,
      },
      {
        id: 2,
        name: 'Bajaj Pulsar 180',
        image: '/images/bikes/pulsar-180.jpg',
        price: 599,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'Bajaj Pulsar NS200',
        image: '/images/bikes/pulsar-ns200.jpg',
        price: 699,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'Bajaj Pulsar RS200',
        image: '/images/bikes/pulsar-rs200.jpg',
        price: 799,
        rating: 4.8,
      },
    ],
  };

  return (
    <>
      <BikeServiceSchema
        serviceName={`Pulsar on Rent in ${locationName}`}
        serviceSlug="pulsar-on-rent"
        description={`Rent Bajaj Pulsar bikes in ${locationName}. Pulsar 150, 180, NS200, RS200 available. Starting @₹499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 499, max: 799 }}
        rating={4.8}
        reviewCount={756}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/pulsar-on-rent" className="hover:text-primary">Pulsar on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

        <ServiceHeroWithChat
          badge={`Pulsar Rental in ${locationName}`}
          title="Bajaj Pulsar on Rent"
          titleHighlight="Starting @₹499/day"
          description={`Rent Bajaj Pulsar bikes in ${locationName}. India's most popular sports bike. Reliable, powerful, fuel-efficient. Perfect for daily rides.`}
          features={[
            { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
            { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
            { icon: 'zap', text: 'Fuel Efficient', color: 'text-blue-600' },
          ]}
          gradientFrom="blue-50"
          gradientTo="indigo-50"
        />

        {/* Available Models */}
        <section className="py-12 bg-white">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Pulsar Models in {locationName}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Pulsar 150', cc: '149cc', price: '₹499/day', mileage: '55 km/l' },
                { name: 'Pulsar 180', cc: '178cc', price: '₹599/day', mileage: '50 km/l' },
                { name: 'Pulsar NS200', cc: '199cc', price: '₹699/day', mileage: '40 km/l' },
                { name: 'Pulsar RS200', cc: '199cc', price: '₹799/day', mileage: '38 km/l' },
              ].map((model) => (
                <div key={model.name} className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-lg border-2 border-blue-200">
                  <div className="text-3xl mb-2">🏍️</div>
                  <h3 className="font-bold mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.mileage}</p>
                  <p className="text-blue-600 font-bold">{model.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available Pulsar Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />

        <PopularRoutes
          location={locationName}
          locationSlug={params.location}
          serviceSlug="pulsar-on-rent"
        />

        <FAQSection service="bike-on-rent" location={locationName} />

        <NearbyLocations
          locationSlug={params.location}
          service="pulsar-on-rent"
        />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="pulsar-on-rent"
        cityName={locationName}
        stateCode={city?.stateCode}
      />
      </div>
    </>
  );
}
