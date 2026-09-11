import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { LocalTaxiPackages } from '@/components/local-taxi/LocalTaxiPackages';
import { RelatedServices } from '@/components/services/RelatedServices';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import {
  Wallet, Clock, Car, UserCheck, CheckCircle2, Sparkles,
  ShoppingBag, Camera, Briefcase, ClipboardList,
} from 'lucide-react';

const COMING_SOON_SLUGS = new Set([
  'bhavnagar',
  'goa',
  'Goa',
  'pune',
  'thrissur',
  'vrindavan',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  // Fall back to a humanized slug for cities not in the curated list — otherwise
  // metadata is left without a description and inherits the generic site-wide
  // one from the root layout, producing mass duplicate meta descriptions.
  const locationName = city?.name ?? params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`local-taxi:${params.location.toLowerCase()}`),
    getServiceCityContent('local-taxi', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Local Taxi in ${locationName} | Hourly Cab @₹399`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Book local taxi in ${locationName}. Hourly cab rental - 4hr, 8hr, 12hr packages. City taxi service. AC sedan, SUV @₹399.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `local taxi ${locationName.toLowerCase()}`,
      `hourly taxi ${locationName.toLowerCase()}`,
      `local cab ${locationName.toLowerCase()}`,
      `taxi for 4 hours ${locationName.toLowerCase()}`,
      `8 hour taxi ${locationName.toLowerCase()}`,
      `city taxi ${locationName.toLowerCase()}`,
      `hourly cab ${locationName.toLowerCase()}`,
      `local car rental ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `local taxi ${k}`),
    ],
    openGraph: {
      title: `Local Taxi in ${locationName} - Hourly Cab @₹399`,
      description: `Book hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
      url: `https://transrentals.in/local-taxi/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/local-taxi/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Local Taxi in ${locationName} | TransRentals`,
      description: `Book local taxi in ${locationName}. Hourly cab rental - 4hr, 8hr, 12hr packages @₹399.`,
    },
  };
}

export default async function LocalTaxiLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('local-taxi', params.location);
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <ServiceComingSoon
          serviceName="Local Taxi"
          serviceSlug="local-taxi"
          locationName={cityName}
          locationSlug={params.location.toLowerCase()}
        />
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="local-taxi" serviceName="Local Taxi" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  // Fetch local packages from DB (city-specific + global fallback)
  const [locationId, carRentalServiceId, scContent] = await Promise.all([
    getLocationId(params.location),
    getCarRentalServiceId(),
    getServiceCityContent('local-taxi', params.location),
  ]);

  const localPackages = carRentalServiceId ? await prisma.chauffeur_local_packages.findMany({
    where: {
      isActive: true,
      chauffeur_vehicle_categories: { serviceId: carRentalServiceId, isActive: true },
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null }),
    },
    select: {
      id: true, hours: true, kms: true, basePrice: true,
      extraKmCharge: true, isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
      },
    },
    orderBy: [
      { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
      { hours: 'asc' },
    ],
  }) : [];

  // Group by hours → { hours: number, kms: number, vehicles: [...] }[]
  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof localPackages }>();
  for (const pkg of localPackages) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) {
      packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    } else {
      existing.vehicles.push(pkg);
    }
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  const pageFaqs = [
    { question: 'What is the difference between a local taxi and an outstation cab?', answer: 'Local taxi is for city travel — short rides, hourly packages, and same-day use. Outstation cabs are for travel between cities with multi-day options.' },
    { question: 'Is there a fixed rate for local taxi booking?', answer: 'Yes, we offer fixed-rate local taxi packages starting from ₹149/hr for 2 hours. No surge pricing — you pay the package rate.' },
    { question: 'Can I book a local taxi for airport transfer at odd hours?', answer: 'Yes, 24/7 airport transfers are available. Pre-book at least 2 hours in advance for guaranteed availability at any hour.' },
    { question: 'What cars are available for local taxi service?', answer: 'We offer Dzire (Sedan), Swift/WagonR (Hatchback), Ertiga (MUV), and Innova (SUV) for local city taxi packages.' },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/local-taxi" className="hover:text-primary">Local Taxi</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero */}
      <SpecialtyCarBookingHero
        service="local-taxi"
        city={locationName}
        citySlug={params.location.toLowerCase()}
      />

      {/* Why Local Taxi */}
      <section className="relative overflow-hidden py-16 bg-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Choose Local Taxi in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { Icon: Wallet, title: 'Affordable', desc: 'All-inclusive hourly rates' },
              { Icon: Clock, title: 'Flexible Packages', desc: '4hr, 8hr, 12hr' },
              { Icon: Car, title: 'Multiple Stops', desc: `Around ${locationName}` },
              { Icon: UserCheck, title: 'Local Drivers', desc: `Know ${locationName} well` },
            ].map((feature) => (
              <div key={feature.title} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <feature.Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Packages — dynamic from DB */}
      {hourGroups.length > 0 && (
        <LocalTaxiPackages hourGroups={hourGroups} locationName={locationName} />
      )}

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for Activities in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { Icon: ShoppingBag, occasion: 'Shopping', desc: `${locationName} malls & markets` },
              { Icon: Camera, occasion: 'Sightseeing', desc: 'City tours' },
              { Icon: Briefcase, occasion: 'Business Meetings', desc: 'Office visits' },
              { Icon: ClipboardList, occasion: 'Running Errands', desc: 'Multiple stops' },
            ].map((item) => (
              <div key={item.occasion} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <item.Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.occasion}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Local Taxi Features in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Package Includes</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Professional driver',
                  'Fuel charges included',
                  'AC car (Sedan/SUV)',
                  `Multiple pickup/drops in ${locationName}`,
                  'Full insurance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Service Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Doorstep pickup',
                  'Clean & sanitized',
                  'Flexible timings',
                  '24/7 availability',
                  'Easy online booking',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            How to Book Local Taxi in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose Package', desc: 'Select 4hr, 8hr or 12hr' },
              { step: '2', title: 'Select Car', desc: 'Sedan or SUV' },
              { step: '3', title: 'Book Online', desc: `Enter pickup location in ${locationName}` },
              { step: '4', title: 'Driver Arrives', desc: 'At your doorstep' },
              { step: '5', title: 'Travel Around', desc: `Visit multiple places in ${locationName}` },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-shrink-0 w-10 h-10">
                  <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                  <div className="relative w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="local-taxi"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Local Taxi',
            name: `Local Taxi in ${locationName}`,
            description: `Book local hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 399,
              highPrice: 1799,
              offerCount: 30,
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="local-taxi" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="local-taxi"
        siblings={[
          { slug: 'chauffeur-service', name: 'Chauffeur Service' },
          { slug: 'local-taxi', name: 'Local Taxi' },
          { slug: 'outstation-cab', name: 'Outstation Cab' },
          { slug: 'one-way-car-rental', name: 'One Way Car Rental' },
          { slug: 'outstation-car-rental', name: 'Outstation Car Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Car Rental' },
          { slug: 'corporate-car-rental', name: 'Corporate Car Rental' },
        ]}
      />

    </>
  );
}
