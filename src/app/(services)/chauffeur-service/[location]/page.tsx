import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId, getLocationId } from '@/lib/db/build-cache';
import { ChauffeurPackages } from '@/components/chauffeur-service/ChauffeurPackages';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Chauffeur Service | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`chauffeur-service:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Chauffeur Service ${locationName} | Driver on Hire @₹599 | Car Driver`,
    description: _seoDb?.metaDescription || `Hire professional chauffeur in ${locationName}. Driver on hire for daily use, outstation. Verified car drivers @₹599/day.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `chauffeur service ${locationName.toLowerCase()}`,
      `driver on hire ${locationName.toLowerCase()}`,
      `car driver ${locationName.toLowerCase()}`,
      `professional driver ${locationName.toLowerCase()}`,
      `personal driver ${locationName.toLowerCase()}`,
      `driver booking ${locationName.toLowerCase()}`,
      `chauffeur ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `chauffeur service ${k}`),
    ],
    openGraph: {
      title: `Chauffeur Service in ${locationName} - Driver on Hire @₹599`,
      description: `Book professional chauffeur in ${locationName}. Verified drivers for daily & outstation.`,
      url: `https://transrentals.in/chauffeur-service/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/chauffeur-service/${params.location}`,
    },
  };
}

export default async function ChauffeurServiceLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('chauffeur-service', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="chauffeur-service" serviceName="Chauffeur Service" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  // Fetch dynamic package data
  const [locationId, carRentalServiceId] = await Promise.all([
    getLocationId(params.location),
    getCarRentalServiceId(),
  ]);

  const [localPackages, outstationPricing] = await Promise.all([
    carRentalServiceId ? prisma.chauffeur_local_packages.findMany({
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
      orderBy: [{ chauffeur_vehicle_categories: { displayOrder: 'asc' } }, { hours: 'asc' }],
    }) : [],
    locationId ? prisma.chauffeur_city_pricing.findMany({
      where: { isActive: true, locations: { slug: params.location } },
      select: {
        vehicleCategoryId: true, baseKmRate: true, minKmPerDay: true, driverDayAllowance: true,
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
        },
      },
      orderBy: { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
    }) : [],
  ]);

  // Group local packages by hours
  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof localPackages }>();
  for (const pkg of localPackages) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    else existing.vehicles.push(pkg);
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/chauffeur-service" className="hover:text-primary">Chauffeur Service</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location}
        serviceSlug="car-rental"
        serviceTitle="Chauffeur Service"
      />

      {/* Why Chauffeur Service */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Hire Chauffeur in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '✅', title: 'Verified Drivers', desc: `Police verified in ${locationName}` },
              { icon: '🎓', title: 'Experienced', desc: '5+ years experience' },
              { icon: '🗺️', title: 'Local Knowledge', desc: `Know ${locationName} routes` },
              { icon: '🤵', title: 'Professional', desc: 'Well-groomed & trained' },
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

      {/* Chauffeur Packages — dynamic */}
      <ChauffeurPackages
        hourGroups={hourGroups}
        outstationPricing={outstationPricing}
        locationName={locationName}
      />

      {/* Perfect For */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Your Needs in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Daily Commute', icon: '💼', desc: `Office in ${locationName}` },
              { occasion: 'Outstation', icon: '🗺️', desc: `Trips from ${locationName}` },
              { occasion: 'Weddings', icon: '💒', desc: 'Wedding car driver' },
              { occasion: 'Events', icon: '🎉', desc: 'Special occasions' },
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

      {/* Driver Qualities */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Our Chauffeurs in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-indigo-700">Professional Skills</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>5+ years experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Valid driving license</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Know all car types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Local route knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Safe driving skills</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-purple-900">Personal Qualities</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Police verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Well-groomed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Punctual & reliable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Good communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Courteous behavior</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Hire Chauffeur in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Daily, outstation, or monthly' },
              { step: '2', title: 'Provide Details', desc: `Car type & location in ${locationName}` },
              { step: '3', title: 'Verify Driver', desc: 'Check driver documents' },
              { step: '4', title: 'Confirm Booking', desc: 'Pay & confirm' },
              { step: '5', title: 'Driver Arrives', desc: 'Professional chauffeur at service' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-gray-50 p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does chauffeur cost in ${locationName}?`,
                a: `Chauffeur service in ${locationName} starts from ₹599/day for 8-10 hours. Outstation drivers cost ₹800-1200/day.`,
              },
              {
                q: `Are chauffeurs in ${locationName} verified?`,
                a: `Yes! All chauffeurs in ${locationName} are police verified with valid driving licenses and background checks.`,
              },
              {
                q: `Can I hire driver for outstation from ${locationName}?`,
                a: `Yes, we provide drivers for outstation trips from ${locationName}. Charges are ₹800-1200/day plus driver allowance.`,
              },
              {
                q: `What is monthly chauffeur package in ${locationName}?`,
                a: `Monthly package in ${locationName} costs ₹15,000-25,000 for 26 days, 8-10 hours per day.`,
              },
              {
                q: `How to book chauffeur in ${locationName}?`,
                a: `Book online on our website. Select ${locationName}, choose package, provide car details and complete booking.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="chauffeur-service"
        cityName={locationName}
        stateCode={city?.stateCode}
      />

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Chauffeur Service in ${locationName}`,
            description: `Hire professional chauffeur in ${locationName}. Verified drivers for daily & outstation use.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '599',
              highPrice: '2500',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

    </>
  );
}
