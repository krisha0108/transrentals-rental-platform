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
import { Gauge, Target, Zap, ShieldCheck } from 'lucide-react';

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
    resolvePageMeta(`ktm-on-rent:${params.location}`),
    getServiceCityContent('ktm-on-rent', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `KTM on Rent in ${locationName} | @₹999/Day`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent KTM bikes in ${locationName}. Duke 200, Duke 390, RC 200, RC 390 available. High performance sports bikes. Book your KTM rental now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `ktm on rent in ${locationName}`,
      `ktm duke rental ${locationName}`,
      `${locationName} ktm rental`,
      `rent ktm in ${locationName}`,
      `duke 390 on rent ${locationName}`,
    ],
    openGraph: {
      title: `KTM on Rent in ${locationName} @₹999/Day | TransRentals`,
      description: `Rent KTM Duke & RC bikes in ${locationName} starting @₹999/day. High performance.`,
      type: 'website',
      url: `https://transrentals.in/ktm-on-rent/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/ktm-rental.jpg',
          width: 1200,
          height: 630,
          alt: `KTM Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `KTM on Rent in ${locationName} | TransRentals`,
      description: `Rent KTM bikes in ${locationName} starting @₹999/day.`,
      images: ['https://transrentals.in/images/og/ktm-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/ktm-on-rent/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const schemaFaqs = [
  { question: 'Which KTM models are available for rent?', answer: 'We have KTM Duke 200, Duke 390, RC 200, and RC 390 available for rent.' },
  { question: 'What is the security deposit for KTM rental?', answer: 'Security deposit ranges from ₹10,000 to ₹20,000 depending on the model. This is fully refundable upon return.' },
  { question: 'Do I need a specific license for KTM bikes?', answer: 'You need a valid motorcycle license. For Duke 390/RC 390, we recommend experienced riders due to high performance.' },
  { question: 'Is fuel included in KTM rental?', answer: 'Fuel is not included. KTM bikes give approximately 25-35 km/litre depending on riding style.' },
];

const schemaVehicles = [
  { name: 'KTM Duke 200', brand: 'KTM', price: 999, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent KTM Duke 200 — entry-level naked sports bike with 199.5cc liquid-cooled single-cylinder engine producing 25 PS power and 19.3 Nm torque. 0-100 kmph in 8.7 seconds, slipper clutch, and race-tuned WP suspension. Sharp city handling with 30+ kmpl mileage. Rental includes helmet and insurance from ₹999/day.' },
  { name: 'KTM Duke 390', brand: 'KTM', price: 1499, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent KTM Duke 390 — flagship naked sports bike with 373cc liquid-cooled engine, 43 PS power, TFT color display, cornering ABS, traction control, and ride modes. 0-100 kmph in 5.8 seconds with 174 kmph top speed. The most feature-rich sporty city bike available for rental. Book at ₹1499/day with helmet.' },
  { name: 'KTM RC 200', brand: 'KTM', price: 1099, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent KTM RC 200 — full-fairing supersport with 199.5cc liquid-cooled engine, 25 PS power, clip-on handlebars, and track-focused aerodynamics. Aggressive riding position with sharp braking and suspension tuned for performance riding. Ideal for sporty commutes and track day enthusiasts. Available from ₹1099/day.' },
  { name: 'KTM RC 390', brand: 'KTM', price: 1599, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: 'Rent KTM RC 390 — track-ready supersport with 373cc engine, 43 PS power, lean-angle sensitive ABS, up/down quickshifter, cornering lights, and TFT display. Capable of 179 kmph top speed with race-bred chassis. The ultimate performance bike rental experience. Book at ₹1599/day with helmet and insurance.' },
];

export default async function KTMLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('ktm-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="ktm-on-rent" serviceName="KTM on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const pageData = {
    vehicles: [
      {
        id: 1,
        name: 'KTM Duke 200',
        image: '/images/bikes/ktm-duke-200.jpg',
        price: 999,
        rating: 4.9,
      },
      {
        id: 2,
        name: 'KTM Duke 390',
        image: '/images/bikes/ktm-duke-390.jpg',
        price: 1499,
        rating: 4.9,
      },
      {
        id: 3,
        name: 'KTM RC 200',
        image: '/images/bikes/ktm-rc-200.jpg',
        price: 1099,
        rating: 4.8,
      },
      {
        id: 4,
        name: 'KTM RC 390',
        image: '/images/bikes/ktm-rc-390.jpg',
        price: 1599,
        rating: 4.9,
      },
    ],
  };

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`ktm-on-rent:${params.location}`),
    getServiceCityContent('ktm-on-rent', params.location),
  ]);

  const pageFaqs = [
    { question: 'Which KTM bikes are available on rent?', answer: 'We offer KTM Duke 200, Duke 390, RC 200, and RC 390 — all premium performance bikes with regular servicing.' },
    { question: 'What is the minimum age to rent a KTM bike?', answer: 'You must be at least 21 years old with a valid motorcycle licence to rent a KTM Duke or RC series.' },
    { question: 'Is riding gear included with KTM rental?', answer: 'A certified helmet is provided. We recommend bringing your own gloves and jacket for best safety on performance bikes.' },
    { question: 'Can I rent a KTM for a track day or hill station trip?', answer: 'Yes, KTM bikes are available for both track days and adventure road trips. Inform us in advance for route-specific preparation.' },
  ];

  return (
    <>
      <BikeServiceSchema
        serviceName={`KTM on Rent in ${locationName}`}
        serviceSlug="ktm-on-rent"
        description={`Rent KTM bikes in ${locationName}. Duke 200, Duke 390, RC 200, RC 390 available. Starting @₹999/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 999, max: 1599 }}
        rating={4.9}
        reviewCount={347}
      />
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/ktm-on-rent" className="hover:text-primary">KTM on Rent</a>
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
          title={`Available KTM Bikes in ${locationName}`}
        />

        {/* Why KTM */}
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
                Why Rent KTM in <span className="text-emerald-600">{locationName}?</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
              {[
                { Icon: Gauge, title: 'High Performance', desc: 'Up to 43 HP power output' },
                { Icon: Target, title: 'Aggressive Styling', desc: 'Head-turning street presence' },
                { Icon: Zap, title: 'Quick Acceleration', desc: '0-100 in under 6 seconds' },
                { Icon: ShieldCheck, title: 'Premium Build', desc: 'European engineering quality' },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                  style={{ animation: `ktm-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
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
            @keyframes ktm-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { [style*="ktm-rise"] { animation: none !important; opacity: 1 !important; } }
          ` }} />
        </section>

        <WhyRentHere locationName={locationName} />

        <NearbyLocations
          locationSlug={params.location}
          service="ktm-on-rent"
        />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="ktm-on-rent"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="ktm-on-rent" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="ktm-on-rent"
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
