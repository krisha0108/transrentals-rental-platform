import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { PopularRoutes } from '@/components/location/PopularRoutes';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';

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
    return { title: 'Outstation Cab | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`outstation-cab:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Outstation Cab ${locationName} | Intercity Taxi @₹12/Km | Round Trip`,
    description: _seoDb?.metaDescription || `Book outstation cab from ${locationName}. Intercity taxi, round trip & one-way cabs. Sedan, SUV available. Station taxi @₹12/km.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `outstation cab ${locationName.toLowerCase()}`,
      `outstation taxi ${locationName.toLowerCase()}`,
      `intercity cab ${locationName.toLowerCase()}`,
      `round trip cab ${locationName.toLowerCase()}`,
      `station taxi ${locationName.toLowerCase()}`,
      `outstation car rental ${locationName.toLowerCase()}`,
      `intercity travel ${locationName.toLowerCase()}`,
      `one way cab ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `outstation cab ${k}`),
    ],
    openGraph: {
      title: `Outstation Cab from ${locationName} - Intercity Taxi @₹12/Km`,
      description: `Book outstation cabs from ${locationName}. Round trip & one-way options available.`,
      url: `https://transrentals.in/outstation-cab/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/outstation-cab/${params.location}`,
    },
  };
}

export default async function OutstationCabLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('outstation-cab', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="outstation-cab" serviceName="Outstation Cab" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const [vehicleCategories, cityPricing] = await Promise.all([
    prisma.chauffeur_vehicle_categories.findMany({
      where: { isActive: true, services: { slug: 'car-rental' } },
      select: {
        id: true, name: true, slug: true, image: true,
        seatingCapacity: true, acType: true, exampleVehicles: true,
        isPopular: true, dailyRate: true,
      },
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    }),
    prisma.chauffeur_city_pricing.findMany({
      where: { isActive: true, locations: { slug: params.location } },
      select: { vehicleCategoryId: true, baseKmRate: true, minKmPerDay: true, driverDayAllowance: true },
    }),
  ]);

  const pricingMap = new Map(cityPricing.map((p) => [p.vehicleCategoryId, p]));
  const catsToShow = cityPricing.length > 0
    ? vehicleCategories.filter((cat) => pricingMap.has(cat.id))
    : vehicleCategories;

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/outstation-cab" className="hover:text-primary">Outstation Cab</a>
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
        serviceTitle="Outstation Cab"
      />

      {/* Why Outstation Cab */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Book Outstation Cab from {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Affordable Rates', desc: 'Starting @₹12/km' },
              { icon: '🚗', title: 'Clean AC Cars', desc: 'Well-maintained fleet' },
              { icon: '🔄', title: 'Round Trip Option', desc: 'Economical travel' },
              { icon: '👨‍✈️', title: 'Expert Drivers', desc: `Local ${locationName} drivers` },
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

      {/* Dynamic vehicle categories */}
      {catsToShow.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              Outstation Cab Options
            </h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Select from our range of well-maintained vehicles</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {catsToShow.map((cat) => {
                let examples: string[] = [];
                try { examples = cat.exampleVehicles ? JSON.parse(cat.exampleVehicles) : []; } catch {}
                const pricing = pricingMap.get(cat.id);
                const rate = pricing?.baseKmRate ?? cat.dailyRate;
                const minKm = pricing?.minKmPerDay;
                const driverAllowance = pricing?.driverDayAllowance;
                return (
                  <div
                    key={cat.id}
                    className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden flex flex-col ${
                      cat.isPopular ? 'ring-2 ring-purple-500 scale-[1.02]' : 'border border-purple-100'
                    }`}
                  >
                    {cat.isPopular && (
                      <div className="absolute top-0 left-0 right-0 flex justify-center">
                        <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                          ⭐ POPULAR
                        </span>
                      </div>
                    )}
                    <div className={`relative h-44 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center ${cat.isPopular ? 'mt-6' : ''}`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                      ) : (
                        <span className="text-7xl">🚗</span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="text-center mb-3">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.seatingCapacity} Seater{cat.acType ? ` · ${cat.acType}` : ''}</p>
                      </div>
                      {examples.length > 0 && (
                        <p className="text-sm text-gray-500 text-center mb-3">{examples.slice(0, 2).join(', ')}</p>
                      )}
                      <div className="text-center mb-4">
                        {rate ? (
                          <>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl font-bold text-purple-600">₹{rate.toLocaleString('en-IN')}</span>
                              <span className="text-sm text-gray-500">/km</span>
                            </div>
                            {minKm && <p className="text-xs text-gray-400 mt-0.5">Min {minKm} km/day</p>}
                          </>
                        ) : (
                          <p className="text-xl font-bold text-purple-600">Get Quote</p>
                        )}
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {[
                          `${cat.seatingCapacity} passengers`,
                          'AC & comfortable',
                          'Professional driver',
                          ...(driverAllowance ? [`Driver allowance ₹${driverAllowance}/day`] : []),
                        ].map((f) => (
                          <p key={f} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-purple-500">✓</span>{f}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              * Rates shown are per km. Final price includes driver allowance + GST (5%). Toll &amp; parking extra.
            </p>
          </div>
        </section>
      )}

      {/* Popular Routes from City */}
      <PopularRoutes
        location={locationName}
        locationSlug={params.location}
        serviceSlug="outstation-cab"
      />

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Outstation Cab Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-blue-700">Included in Fare</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Experienced driver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Fuel charges (both ways)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Driver allowance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Toll & state taxes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-cyan-900">Service Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Doorstep pickup in {locationName}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Clean & sanitized cars</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>Flexible stop-overs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>No hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-700 mt-1">✓</span>
                  <span>24/7 support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Outstation Cab Packages from {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: 'Round Trip', price: '₹12-22/km', desc: 'Most economical' },
              { type: 'One-Way', price: '₹14-25/km', desc: 'Drop only' },
              { type: 'Multi-City', price: 'Custom', desc: 'Tour packages' },
            ].map((plan) => (
              <div key={plan.type} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.type}</h3>
                <p className="text-2xl font-bold text-blue-700 mb-2">{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Outstation Cab in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Select Route', desc: `Choose destination from ${locationName}` },
              { step: '2', title: 'Choose Car Type', desc: 'Sedan, SUV or Tempo Traveller' },
              { step: '3', title: 'Select Package', desc: 'Round trip or one-way' },
              { step: '4', title: 'Book Online', desc: 'Complete booking & payment' },
              { step: '5', title: 'Travel Comfortably', desc: 'Driver arrives at your doorstep' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
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
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does outstation cab cost from ${locationName}?`,
                a: `Outstation cab from ${locationName} starts from ₹12/km for sedan. SUVs cost ₹16-22/km. Round trip is more economical.`,
              },
              {
                q: `Can I book one-way cab from ${locationName}?`,
                a: `Yes! One-way drop from ${locationName} is available at ₹14-25/km depending on car type.`,
              },
              {
                q: `Are tolls included in outstation cab fare from ${locationName}?`,
                a: `Yes, all toll charges, parking, state taxes are included in the fare from ${locationName}. No extra charges.`,
              },
              {
                q: `Which cars are available for outstation from ${locationName}?`,
                a: `We have Sedan (Dzire, City), SUV (Ertiga, Innova, Crysta) and Tempo Traveller in ${locationName}.`,
              },
              {
                q: `How to book outstation cab from ${locationName}?`,
                a: `You can book online on our website. Select ${locationName} as pickup, choose destination, car type and complete booking.`,
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
        serviceSlug="outstation-cab"
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
            name: `Outstation Cab from ${locationName}`,
            description: `Book outstation cabs from ${locationName}. Intercity taxi service with round trip & one-way options.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '12',
              highPrice: '25',
              priceSuffix: '/km',
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
