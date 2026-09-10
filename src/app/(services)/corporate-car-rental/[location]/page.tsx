import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import {
  Briefcase, Clock, Wallet, BarChart3, Handshake, Plane, Target, CheckCircle2, Building2,
} from 'lucide-react';

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
    resolvePageMeta(`corporate-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('corporate-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Corporate Car Rental in ${locationName} | @₹15k/Month`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Corporate car rental in ${locationName}. Employee transport, business meetings, fleet management. Professional service @₹15000/month.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `corporate car rental ${locationName.toLowerCase()}`,
      `corporate taxi ${locationName.toLowerCase()}`,
      `employee transport ${locationName.toLowerCase()}`,
      `business car rental ${locationName.toLowerCase()}`,
      `company car lease ${locationName.toLowerCase()}`,
      `office cab ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `corporate car ${k}`),
    ],
    openGraph: {
      title: `Corporate Car Rental in ${locationName} - Employee Transport @₹15k`,
      description: `Professional corporate car rental in ${locationName}. Business fleet management.`,
      url: `https://transrentals.in/corporate-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/corporate-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Corporate Car Rental in ${locationName} | TransRentals`,
      description: `Corporate car rental in ${locationName}. Employee transport & business meetings @₹15000/month.`,
    },
  };
}

export default async function CorporateCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('corporate-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="corporate-car-rental" serviceName="Corporate Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const pageFaqs = [
    { question: 'What types of corporate car rental plans are available?', answer: 'We offer monthly corporate fleet plans, daily employee cab services, airport transfer contracts, and event-based car hire for businesses.' },
    { question: 'Is GST invoice provided for corporate car rental?', answer: 'Yes, GST invoices with HSN codes are provided for all corporate bookings. Advance invoices available for monthly billing cycles.' },
    { question: 'Can companies book a fleet of cars for multiple employees?', answer: 'Yes, fleet bookings from 3 to 50+ cars are available with a dedicated account manager and 24/7 priority support.' },
    { question: 'What is the minimum contract duration for corporate car rental?', answer: 'Minimum 1-month contracts for regular fleet. For event or project-based requirements, even 1-week arrangements are possible.' },
  ];

  const [seoData, carServiceId, locationId, scContent] = await Promise.all([
    resolvePageMeta(`corporate-car-rental:${params.location.toLowerCase()}`),
    getCarRentalServiceId(),
    getLocationId(params.location),
    getServiceCityContent('corporate-car-rental', params.location),
  ]);

  const carModels = carServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: carServiceId, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sideImage: true,
      basePricePerDay: true,
      rating: true,
      seatingCapacity: true,
      brands: { select: { name: true } },
      ...(locationId ? {
        vehicle_model_locations: {
          where: { locationId, isActive: true },
          select: { basePricePerDay: true },
          take: 1,
        },
      } : {}),
    },
    orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
  }) : [];

  const carFleet = carModels.map((m) => {
    const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
    const price = locationPrice ?? m.basePricePerDay ?? 0;
    return {
      id: m.id,
      name: m.name,
      slug: m.slug ?? undefined,
      brand: m.brands?.name ?? undefined,
      image: m.sideImage ?? '/images/fleet/default-car.jpg',
      price: Number(price),
      rating: m.rating ?? undefined,
      specs: m.seatingCapacity ? { seating: `${m.seatingCapacity} Seater` } : undefined,
    };
  });


  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/corporate-car-rental" className="hover:text-primary">Corporate Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <SpecialtyCarBookingHero service="corporate" city={locationName} citySlug={params.location.toLowerCase()} />

      {/* Why Corporate Car */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Choose Corporate Car Rental in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Briefcase, title: 'Professional', desc: `Enhance image in ${locationName}` },
              { Icon: Clock, title: 'Punctual', desc: 'Always on-time' },
              { Icon: Wallet, title: 'Cost Effective', desc: 'Save money' },
              { Icon: BarChart3, title: 'Reports', desc: 'Monthly statements' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {carFleet.length > 0 && (
        <VehicleGrid
          vehicles={carFleet}
          title={`Corporate Cars Available in ${locationName}`}
        />
      )}

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for Businesses in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Building2, occasion: 'Employee Commute', desc: `Office transport in ${locationName}` },
              { Icon: Handshake, occasion: 'Client Meetings', desc: 'Professional service' },
              { Icon: Plane, occasion: 'Airport Transfers', desc: 'Business travelers' },
              { Icon: Target, occasion: 'Events', desc: 'Corporate events' },
            ].map(({ Icon, occasion, desc }) => (
              <div key={occasion} className="text-center bg-white border border-dashed border-emerald-200 rounded-2xl px-5 py-8 hover:border-emerald-400 hover:shadow-md transition-all">
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{occasion}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Corporate Benefits in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Service Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Professional chauffeurs',
                  'Well-maintained vehicles',
                  'GPS tracking',
                  '24/7 support',
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
                  <BarChart3 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Business Benefits</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Monthly billing',
                  'Detailed reports',
                  'GST invoices',
                  'No maintenance cost',
                  'Scalable fleet',
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

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="corporate-car-rental"
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
            serviceType: 'Corporate Car Rental',
            name: `Corporate Car Rental in ${locationName}`,
            description: `Professional corporate car rental in ${locationName}. Employee transport and business fleet management.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 15000,
              highPrice: 40000,
              offerCount: 20,
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

      <FAQSection service="corporate-car-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="corporate-car-rental"
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
