import React from 'react';
import type { Metadata } from 'next';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { WhyRentHere } from '@/components/location/WhyRentHere';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyLocations } from '@/components/location/NearbyLocations';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Flag, Target, Zap, Wrench } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`apache-on-rent:${params.location}`),
    getServiceCityContent('apache-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Apache on Rent in ${locationName} | @₹499/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent TVS Apache bikes in ${locationName}. Apache RTR 160, RTR 180, RTR 200 4V, RR 310 available. Racing DNA bikes. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
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
  { name: 'TVS Apache RTR 160', brand: 'TVS', price: 499, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent TVS Apache RTR 160 — race-inspired sporty commuter with 159.7cc engine, 15.8 PS power, dual disc brakes, and race-tuned suspension. Aerodynamic design with LED pilot lamps, digital console, and 110 kmph top speed. Sporty performance at an affordable price. Rental from ₹499/day with helmet and insurance.' },
  { name: 'TVS Apache RTR 180', brand: 'TVS', price: 549, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent TVS Apache RTR 180 — performance naked bike with 177.4cc oil-cooled engine, 17.3 PS power, petal disc brakes, and ride modes (Urban/Sport/Rain). 0-60 kmph in 4.5 seconds with 114 kmph top speed. Advanced chassis with gas-filled rear shock absorbers for sporty urban riding. From ₹549/day.' },
  { name: 'TVS Apache RTR 200 4V', brand: 'TVS', price: 699, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent TVS Apache RTR 200 4V — mid-size performance bike with 197.75cc 4-valve oil-cooled engine, 20.8 PS power, slipper clutch, Bluetooth instrument cluster, and 3 riding modes. 127 kmph top speed with race-tuned TVS SmartXonnect technology. Best mid-range performance bike rental from ₹699/day.' },
  { name: 'TVS Apache RR 310', brand: 'TVS', price: 1299, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: "Rent TVS Apache RR 310 — India's most track-capable production bike with 312.2cc reverse-inclined liquid-cooled engine, 34 PS power, 5 riding modes, cornering ABS, quickshifter, and aerodynamic full fairing. 160 kmph top speed with BMW Motorrad partnership pedigree. Premium performance rental from ₹1299/day." },
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

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`apache-on-rent:${params.location}`),
    getServiceCityContent('apache-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which Apache models are available for rent?', answer: 'We offer TVS Apache RTR 160, RTR 160 4V, RTR 200 4V — sporty commuters and performance bikes.' },
    { question: 'What is the Apache rental rate per day?', answer: 'Apache RTR 160 starts at ₹499/day; Apache RTR 200 4V starts at ₹699/day, inclusive of helmet and standard permit.' },
    { question: 'Is a security deposit mandatory for Apache rental?', answer: 'Yes, a refundable security deposit of ₹1500–₹3000 is held at the time of pickup and fully returned upon safe return.' },
    { question: 'Can I use the Apache bike for daily office commute?', answer: 'Absolutely — Apache bikes are ideal for city commuting. Unlimited km packages are available for monthly rentals.' },
  ];

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

        <BikeSearchHero
          city={locationName}
          citySlug={params.location}
          pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
          pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
        />

        <VehicleGrid
          vehicles={pageData.vehicles}
          title={`Available Apache Bikes in ${locationName}`}
        />

        {/* Why Apache */}
        <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage:
                'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
              maskImage:
                'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            }}
          />
          <div className="container-custom relative">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
              <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
                Why Rent Apache in <span className="text-emerald-600">{locationName}?</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
              {[
                { Icon: Flag, title: 'Racing DNA', desc: 'Track-inspired engineering' },
                { Icon: Target, title: 'Sharp Handling', desc: 'Precise cornering ability' },
                { Icon: Zap, title: 'Quick Response', desc: 'Instant throttle response' },
                { Icon: Wrench, title: 'Reliable', desc: 'TVS build quality' },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                  style={{ animation: `apc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
                >
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.Icon className="w-5 h-5 text-emerald-600 transition-colors duration-500 group-hover:text-white" />
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes apc-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { [style*="apc-rise"] { animation: none !important; opacity: 1 !important; } }
          ` }} />
        </section>

        <WhyRentHere locationName={locationName} />

        <NearbyLocations
          locationSlug={params.location}
          service="apache-on-rent"
        />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="apache-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="apache-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="apache-on-rent"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
          { slug: 'pulsar-on-rent', name: 'Pulsar on Rent' },
          { slug: 'apache-on-rent', name: 'Apache on Rent' },
          { slug: 'splendor-on-rent', name: 'Splendor on Rent' },
          { slug: 'himalayan-on-rent', name: 'Himalayan on Rent' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
          { slug: 'electric-scooter-rental', name: 'Electric Scooter' },
        ]}
      />
      </div>
    </>
  );
}
