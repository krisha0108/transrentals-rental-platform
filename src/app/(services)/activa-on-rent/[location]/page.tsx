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
import { BikeSearchHero } from '@/components/bike';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Wallet, Zap, Target, Building } from 'lucide-react';

const COMING_SOON_SLUGS = new Set([
  'margao',
  'kanyakumari',
  'mussoorie',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for ALL locations - GOD LEVEL SEO
// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`activa-on-rent:${params.location}`),
    getServiceCityContent('activa-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Activa on Rent in ${locationName} | @₹299/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent Activa & scooters in ${locationName}. Honda Activa, TVS Jupiter, Suzuki Access available. Fuel efficient, easy to ride. Book your scooty rental now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `activa on rent in ${locationName}`,
      `scooty rental ${locationName}`,
      `${locationName} activa rental`,
      `rent scooty in ${locationName}`,
      `scooter on rent ${locationName}`,
    ],
    openGraph: {
      title: `Activa on Rent in ${locationName} @₹299/Day | TransRentals`,
      description: `Rent scooters in ${locationName} starting @₹299/day. Fuel efficient & easy to ride.`,
      type: 'website',
      url: `https://transrentals.in/activa-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/activa-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Activa Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Activa on Rent in ${locationName} | TransRentals`,
      description: `Rent scooters in ${locationName} starting @₹299/day.`,
      images: ['https://transrentals.in/images/og/activa-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/activa-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Schema data
const schemaFaqs = [
  { question: 'What documents are needed for Activa rental?', answer: 'You need a valid driving license, Aadhar card, and a refundable security deposit of ₹2000-3000.' },
  { question: 'Is helmet provided with Activa rental?', answer: 'Yes, helmets are provided free with every scooter rental.' },
  { question: 'What is the mileage of Honda Activa?', answer: 'Honda Activa gives approximately 50-60 km per litre, making it very fuel efficient for city rides.' },
  { question: 'Can I rent Activa for monthly basis?', answer: 'Yes, we offer monthly rental plans starting from ₹2999/month with zero maintenance.' },
];

const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/scooters/activa-6g.jpg', description: "Rent Honda Activa 6G scooter — India's most popular scooter with 109cc OBD2-compliant engine, 50 kmpl mileage, LED headlight, silent start, and 21-litre underseat storage. Automatic transmission and reliable performance for daily city commutes. Rental includes helmet and insurance. Book at TransRentals from ₹299/day." },
  { name: 'TVS Jupiter', brand: 'TVS', price: 299, image: 'https://transrentals.in/images/scooters/jupiter.jpg', description: "Rent TVS Jupiter scooter — family-favourite 110cc scooter with 50+ kmpl mileage, extra-large 22-litre underseat storage, external fuel cap, and wide dual-person seat. Ideal for grocery runs, school trips, and daily commuting. Available at TransRentals from ₹299/day with doorstep delivery." },
  { name: 'Suzuki Access 125', brand: 'Suzuki', price: 349, image: 'https://transrentals.in/images/scooters/access-125.jpg', description: "Rent Suzuki Access 125 scooter — premium 124cc scooter with 55 kmpl mileage, USB charging port, combined braking system (CBS), and 95 kmph top speed. Smooth and powerful for both city and short highway riding. Comfortable touring scooter rental from ₹349/day with helmet and insurance included." },
  { name: 'Honda Dio', brand: 'Honda', price: 299, image: 'https://transrentals.in/images/scooters/dio.jpg', description: "Rent Honda Dio scooter — sporty 109cc scooter with stylish design, full-LED lighting, digital instrument console, and USB charger. Lightweight at 102 kg and nimble for weaving through city traffic. Perfect for students and young commuters. Book Honda Dio rental at TransRentals from ₹299/day." },
];

export default async function ActivaLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('activa-on-rent', params.location);
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/activa-on-rent" className="hover:text-primary">Activa on Rent</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location}
            serviceSlug="activa-on-rent"
            serviceName="Activa on Rent"
            themeColor="emerald"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="activa-on-rent" serviceName="Activa on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    location: {
      name: locationName,
      slug: params.location,
      state: 'State Name',
    },
    service: {
      name: 'Activa on Rent',
      slug: 'activa-on-rent',
    },
    vehicles: [
      {
        id: 1,
        name: 'Honda Activa 6G',
        brand: 'Honda',
        image: '/images/scooters/activa-6g.jpg',
        price: 299,
        rating: 4.8,
      },
      {
        id: 2,
        name: 'TVS Jupiter',
        brand: 'TVS',
        image: '/images/scooters/jupiter.jpg',
        price: 299,
        rating: 4.7,
      },
      {
        id: 3,
        name: 'Suzuki Access 125',
        brand: 'Suzuki',
        image: '/images/scooters/access-125.jpg',
        price: 349,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'Honda Dio',
        brand: 'Honda',
        image: '/images/scooters/dio.jpg',
        price: 299,
        rating: 4.6,
      },
    ],
    nearbyLocations: [
      { name: 'Nearby City 1', slug: 'nearby-city-1' },
      { name: 'Nearby City 2', slug: 'nearby-city-2' },
    ],
  };

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`activa-on-rent:${params.location}`),
    getServiceCityContent('activa-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'What scooters are available for rent?', answer: 'We offer Honda Activa 6G, TVS Jupiter, Suzuki Access 125, and Honda Dio — all automatic, fuel-efficient scooters.' },
    { question: 'Do I need a gear bike license for Activa rental?', answer: 'No, a non-transport two-wheeler license (LMV) is sufficient to rent any gearless scooter including Activa.' },
    { question: 'What is the fuel policy for scooter rental?', answer: 'You receive the scooter with a full tank and must return it full. Fuel charges apply if returned empty.' },
    { question: 'Can I rent Activa for just 4–5 hours?', answer: 'Yes, we offer half-day (4-hour) packages starting from ₹199 for short city errands.' },
  ];

  return (
    <>
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName={`Activa on Rent in ${locationName}`}
        serviceSlug="activa-on-rent"
        description={`Rent Activa & scooters in ${locationName}. Honda Activa, TVS Jupiter, Suzuki Access available. Starting @₹299/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 299, max: 399 }}
        rating={4.7}
        reviewCount={423}
      />
      <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/activa-on-rent" className="hover:text-primary">Activa on Rent</a>
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

      {/* Why Choose Activa */}
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
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Rent Activa in <span className="text-emerald-600">{locationName}?</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {[
              { Icon: Wallet, title: 'Affordable', desc: 'Starting @₹299/day' },
              { Icon: Zap, title: 'Fuel Efficient', desc: '50-60 km/litre mileage' },
              { Icon: Target, title: 'Easy to Ride', desc: 'No gear, automatic' },
              { Icon: Building, title: 'City Friendly', desc: 'Perfect for traffic' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `act-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
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
          @keyframes act-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="act-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <VehicleGrid
        vehicles={pageData.vehicles}
        title={`Available Scooters in ${locationName}`}
      />

      <WhyRentHere locationName={locationName} />


      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="activa-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      <NearbyLocations
        locationSlug={params.location}
        service="activa-on-rent"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="activa-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="activa-on-rent"
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
