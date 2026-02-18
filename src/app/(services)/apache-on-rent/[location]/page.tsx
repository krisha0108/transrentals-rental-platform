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

  return {
    title: `Apache on Rent in ${locationName} | TVS Apache Rental @₹499/Day | TransRentals`,
    description: `Rent TVS Apache bikes in ${locationName}. Apache RTR 160, RTR 180, RTR 200 4V, RR 310 available. Racing DNA bikes. Book now!`,
    keywords: [
      `apache on rent in ${locationName}`,
      `tvs apache rental ${locationName}`,
      `${locationName} apache rental`,
      `rent apache in ${locationName}`,
      `apache rtr on rent ${locationName}`,
    ],
    openGraph: {
      title: `Apache on Rent in ${locationName} @₹499/Day | TransRentals`,
      description: `Rent TVS Apache bikes in ${locationName} starting @₹499/day. Racing DNA.`,
      type: 'website',
      url: `https://transrentals.in/apache-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/apache-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Apache Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Apache on Rent in ${locationName} | TransRentals`,
      description: `Rent Apache bikes in ${locationName} starting @₹499/day.`,
      images: ['https://transrentals.in/images/og/apache-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/apache-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which Apache models are available for rent?', answer: 'We have Apache RTR 160, RTR 180, RTR 200 4V, and Apache RR 310 available for rent.' },
  { question: 'What is the security deposit for Apache rental?', answer: 'Security deposit ranges from ₹3,000 to ₹15,000 depending on the model. This is fully refundable upon return.' },
  { question: 'Is Apache good for long rides?', answer: 'Apache RTR 200 4V and RR 310 are excellent for long rides with their comfortable riding position and performance.' },
  { question: 'What is the mileage of Apache bikes?', answer: 'Apache bikes give approximately 40-50 km/litre depending on the model and riding conditions.' },
];

const schemaVehicles = [
  { name: 'TVS Apache RTR 160', brand: 'TVS', price: 499 },
  { name: 'TVS Apache RTR 180', brand: 'TVS', price: 549 },
  { name: 'TVS Apache RTR 200 4V', brand: 'TVS', price: 699 },
  { name: 'TVS Apache RR 310', brand: 'TVS', price: 1299 },
];

export default async function ApacheLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('apache-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="apache-on-rent" serviceName="Apache on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'TVS Apache RTR 160',
        image: '/images/bikes/apache-rtr-160.jpg',
        price: 499,
        rating: 4.7,
      },
      {
        id: 2,
        name: 'TVS Apache RTR 180',
        image: '/images/bikes/apache-rtr-180.jpg',
        price: 549,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'TVS Apache RTR 200 4V',
        image: '/images/bikes/apache-rtr-200.jpg',
        price: 699,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'TVS Apache RR 310',
        image: '/images/bikes/apache-rr-310.jpg',
        price: 1299,
        rating: 4.9,
      },
    ],
  };

  return (
    <>
      <BikeServiceSchema
        serviceName={`Apache on Rent in ${locationName}`}
        serviceSlug="apache-on-rent"
        description={`Rent TVS Apache bikes in ${locationName}. RTR 160, RTR 180, RTR 200 4V, RR 310 available. Starting @₹499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 499, max: 1299 }}
        rating={4.8}
        reviewCount={384}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/apache-on-rent" className="hover:text-primary">Apache on Rent</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{locationName}</span>
            </nav>
          </div>
        </div>

        <ServiceHeroWithChat
          badge={`Apache Rental in ${locationName}`}
          title="TVS Apache on Rent"
          titleHighlight="Starting @₹499/day"
          description={`Rent TVS Apache bikes in ${locationName}. Racing DNA with sharp handling. RTR 160, RTR 180, RTR 200 4V, RR 310 available.`}
          features={[
            { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
            { icon: 'shield', text: 'Well Maintained', color: 'text-emerald-600' },
            { icon: 'zap', text: 'Racing DNA', color: 'text-red-600' },
          ]}
          gradientFrom="red-50"
          gradientTo="rose-50"
        />

        {/* Available Models */}
        <section className="py-12 bg-white">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Apache Models in {locationName}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'RTR 160', cc: '160cc', price: '₹499/day', power: '16 HP' },
                { name: 'RTR 180', cc: '177cc', price: '₹549/day', power: '17 HP' },
                { name: 'RTR 200 4V', cc: '197cc', price: '₹699/day', power: '20 HP' },
                { name: 'RR 310', cc: '312cc', price: '₹1,299/day', power: '34 HP' },
              ].map((model) => (
                <div key={model.name} className="bg-gradient-to-br from-red-50 to-white p-5 rounded-lg border-2 border-red-200">
                  <div className="text-3xl mb-2">🏍️</div>
                  <h3 className="font-bold mb-1">Apache {model.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{model.cc} • {model.power}</p>
                  <p className="text-red-600 font-bold">{model.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available Apache Bikes in ${locationName}`}
        />

        <WhyRentHere locationName={locationName} />

        <PopularRoutes
          location={locationName}
          locationSlug={params.location}
          serviceSlug="apache-on-rent"
        />

        <FAQSection service="bike-on-rent" location={locationName} />

        <NearbyLocations
          locationSlug={params.location}
          service="apache-on-rent"
        />
      </div>
    </>
  );
}
