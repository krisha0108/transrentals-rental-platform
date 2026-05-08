import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getSelfDriveServiceId, getLocationId } from '@/lib/db/build-cache';
import Image from 'next/image';
import { MonthlyCarPlans } from '@/components/monthly-car-rental/MonthlyCarPlans';
import { RelatedServices } from '@/components/services/RelatedServices';

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
    return { title: 'Monthly Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`monthly-car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Monthly Car Rental ${locationName} | Car Subscription @₹12k | Long Term Lease`,
    description: _seoDb?.metaDescription || `Rent car monthly in ${locationName}. Car subscription service. Long term rental @₹12000/month. Self-drive & chauffeur options.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `monthly car rental ${locationName.toLowerCase()}`,
      `car subscription ${locationName.toLowerCase()}`,
      `car on monthly rent ${locationName.toLowerCase()}`,
      `long term car rental ${locationName.toLowerCase()}`,
      `monthly car lease ${locationName.toLowerCase()}`,
      `monthly self drive ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `monthly car ${k}`),
    ],
    openGraph: {
      title: `Monthly Car Rental in ${locationName} - Car Subscription @₹12k`,
      description: `Subscribe to cars monthly in ${locationName}. All-inclusive packages available.`,
      url: `https://transrentals.in/monthly-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/monthly-car-rental/${params.location}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Monthly Car Rental in ${locationName} | TransRentals`,
      description: `Rent car monthly in ${locationName}. Car subscription service @₹12000/month.`,
    },
  };
}

export default async function MonthlyCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('monthly-car-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="monthly-car-rental" serviceName="Monthly Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`monthly-car-rental:${params.location}`);

  const pageFaqs = [
    { question: 'What is included in the monthly car rental plan?', answer: 'Monthly car rental includes the car, driver (if applicable), insurance, maintenance, and a fixed km allowance per month. Fuel is extra.' },
    { question: 'Is a driver included in the monthly car rental?', answer: 'Driver-included monthly plans start from ₹25,000/month. Self-drive monthly plans start from ₹12,000/month depending on vehicle category.' },
    { question: 'Can I customize the km limit for monthly car rental?', answer: 'Yes, standard plans include 2500 km/month. Higher km packages (3500 km, 5000 km) are available at a marginal extra cost.' },
    { question: 'What happens if I exceed the monthly km limit?', answer: 'Additional km beyond the plan limit are charged at ₹10–₹15/km depending on the vehicle category.' },
  ];

  // Fetch self-drive vehicle models for monthly plans
  const [selfDriveServiceId, locationId] = await Promise.all([
    getSelfDriveServiceId(),
    getLocationId(params.location),
  ]);

  const vehicleModels = selfDriveServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: selfDriveServiceId, isActive: true },
    select: {
      id: true, name: true, sideImage: true, seatingCapacity: true,
      basePricePerDay: true, monthlyDiscount: true, isPopular: true, bodyType: true,
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

  const monthlyPlans = vehicleModels
    .map((m) => {
      const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
      const basePrice = locationPrice ?? m.basePricePerDay ?? 0;
      const monthlyPrice = basePrice > 0
        ? Math.round(basePrice * 30 * (1 - (m.monthlyDiscount ?? 0) / 100))
        : 0;
      return { ...m, monthlyPrice };
    })
    .filter((m) => m.monthlyPrice > 0);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/monthly-car-rental" className="hover:text-primary">Monthly Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location}
        serviceSlug="car-rental"
        serviceTitle="Monthly Car Rental"
      />

      {/* Why Monthly Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Monthly Car Rental in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Cost Effective', desc: `Affordable in ${locationName}` },
              { icon: '🔧', title: 'Zero Maintenance', desc: 'We handle servicing' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Complete coverage' },
              { icon: '🔄', title: 'Flexible', desc: '1-12+ months' },
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

      {/* Monthly Plans */}
      {monthlyPlans.length > 0 && (
        <MonthlyCarPlans plans={monthlyPlans} locationName={locationName} />
      )}

      {/* What's Included */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What&apos;s Included in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-teal-700">Included</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">✓</span>
                  <span>Vehicle for 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">✓</span>
                  <span>Full maintenance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">✓</span>
                  <span>Insurance coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">✓</span>
                  <span>24/7 assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-700 mt-1">✓</span>
                  <span>Replacement if breakdown</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-cyan-900">Extra Charges</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">•</span>
                  <span>Fuel (you pay)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">•</span>
                  <span>Extra km: ₹6-12/km</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">•</span>
                  <span>Chauffeur: ₹15k-20k</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">•</span>
                  <span>Security deposit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">•</span>
                  <span>Toll & parking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Needs in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Job Transfer', icon: '💼', desc: `Relocated to ${locationName}` },
              { occasion: 'Long Vacation', icon: '🏖️', desc: 'Extended stay' },
              { occasion: 'Project Work', icon: '🏗️', desc: 'Temporary work' },
              { occasion: 'Students', icon: '🎓', desc: 'College semester' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does monthly car rental cost in ${locationName}?`,
                a: `Monthly car rental in ${locationName} starts from ₹12,000 for hatchback. Sedan costs ₹18,000-22,000, SUV ₹25,000-30,000.`,
              },
              {
                q: `What is included in monthly rental in ${locationName}?`,
                a: `Includes vehicle for 30 days, maintenance, insurance, roadside assistance in ${locationName}. Fuel NOT included.`,
              },
              {
                q: `Can I extend my rental in ${locationName}?`,
                a: `Yes! You can extend month by month in ${locationName}. Long term (3+ months) gets better rates.`,
              },
              {
                q: `What documents needed in ${locationName}?`,
                a: `You need driving license, Aadhar, address proof, PAN, and security deposit in ${locationName}.`,
              },
              {
                q: `How to book monthly car in ${locationName}?`,
                a: `Book online. Select ${locationName}, choose car, submit documents, pay deposit. Car delivered to you.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="monthly-car-rental"
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
            name: `Monthly Car Rental in ${locationName}`,
            description: `Subscribe to cars monthly in ${locationName}. All-inclusive car subscription packages.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '12000',
              highPrice: '60000',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="monthly-car-rental"
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
