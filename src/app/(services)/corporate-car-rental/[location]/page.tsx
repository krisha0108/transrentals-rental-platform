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
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Corporate Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`corporate-car-rental:${params.location}`),
    getServiceCityContent('corporate-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Corporate Car Rental ${locationName} | Employee Transport @₹15k | Business Taxi`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Corporate car rental in ${locationName}. Employee transport, business meetings, fleet management. Professional service @₹15000/month.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `corporate car rental ${locationName.toLowerCase()}`,
      `corporate taxi ${locationName.toLowerCase()}`,
      `employee transport ${locationName.toLowerCase()}`,
      `business car rental ${locationName.toLowerCase()}`,
      `company car lease ${locationName.toLowerCase()}`,
      `office cab ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `corporate car ${k}`),
    ],
    openGraph: {
      title: `Corporate Car Rental in ${locationName} - Employee Transport @₹15k`,
      description: `Professional corporate car rental in ${locationName}. Business fleet management.`,
      url: `https://transrentals.in/corporate-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/corporate-car-rental/${params.location}`,
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
    resolvePageMeta(`corporate-car-rental:${params.location}`),
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

      <SpecialtyCarBookingHero service="corporate" city={locationName} citySlug={params.location} />

      {/* Why Corporate Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Corporate Car Rental in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💼', title: 'Professional', desc: `Enhance image in ${locationName}` },
              { icon: '⏰', title: 'Punctual', desc: 'Always on-time' },
              { icon: '💰', title: 'Cost Effective', desc: 'Save money' },
              { icon: '📊', title: 'Reports', desc: 'Monthly statements' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
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
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Businesses in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Employee Commute', icon: '🚗', desc: `Office transport in ${locationName}` },
              { occasion: 'Client Meetings', icon: '🤝', desc: 'Professional service' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: 'Business travelers' },
              { occasion: 'Events', icon: '🎯', desc: 'Corporate events' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Corporate Benefits in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-slate-700">Service Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Professional chauffeurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Well-maintained vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>GPS tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>24/7 support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-gray-800">Business Benefits</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Monthly billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Detailed reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>GST invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>No maintenance cost</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Scalable fleet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
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
            '@type': 'Product',
            name: `Corporate Car Rental in ${locationName}`,
            description: `Professional corporate car rental in ${locationName}. Employee transport and business fleet management.`,
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

      <RelatedServices
        locationSlug={params.location}
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
