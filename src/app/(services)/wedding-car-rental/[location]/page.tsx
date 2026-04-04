import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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
    return { title: 'Wedding Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`wedding-car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Wedding Car Rental ${locationName} | Shadi Car Hire @₹2999 | Baraat Car`,
    description: _seoDb?.metaDescription || `Book wedding cars in ${locationName}. Baraat car rental, bride/groom car, vintage cars. Professional decoration & chauffeur. Starting @₹2999.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `wedding car rental ${locationName.toLowerCase()}`,
      `shadi car ${locationName.toLowerCase()}`,
      `baraat car hire ${locationName.toLowerCase()}`,
      `wedding car decoration ${locationName.toLowerCase()}`,
      `bride car rental ${locationName.toLowerCase()}`,
      `groom car ${locationName.toLowerCase()}`,
      `dulhan car ${locationName.toLowerCase()}`,
      `marriage car booking ${locationName.toLowerCase()}`,
      `vintage wedding car ${locationName.toLowerCase()}`,
      `luxury wedding car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `wedding car ${k}`),
    ],
    openGraph: {
      title: `Wedding Car Rental in ${locationName} - Shadi Car @₹2999`,
      description: `Premium wedding cars in ${locationName}. Baraat, bride & groom cars with decoration.`,
      url: `https://transrentals.in/wedding-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/wedding-car-rental/${params.location}`,
    },
  };
}

export default async function WeddingCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="wedding-car-rental" serviceName="Wedding Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const [seoData, luxuryFleet] = await Promise.all([
    resolvePageMeta(`wedding-car-rental:${params.location}`),
    prisma.vehicle_models.findMany({
      where: {
        isActive: true,
        services_vehicle_models_serviceIdToservices: { slug: 'luxury-car-rental' },
      },
      select: {
        id: true,
        name: true,
        sideImage: true,
        basePricePerDay: true,
        rating: true,
        tagline: true,
        highlight: true,
        isPopular: true,
        seatingCapacity: true,
        brands: { select: { name: true } },
      },
      orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
    }),
  ]);


  return (
    <>
      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Wedding Car Rental in ${locationName}`}
        title="Wedding Car Services"
        titleHighlight="Shadi Car @₹2999/day"
        description={`Book premium wedding cars in ${locationName}. Baraat cars, bride & groom cars with professional decoration. Make your special day memorable.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Decorated Cars', color: 'text-pink-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-rose-600' },
        ]}
        gradientFrom="pink-50"
        gradientTo="rose-50"
      />

      {/* Why Wedding Cars in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Book Wedding Cars in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💒', title: 'Grand Baraat Entry', desc: `Make memorable entry in ${locationName}` },
              { icon: '🎀', title: 'Free Decoration', desc: 'Flowers & ribbons included' },
              { icon: '👨‍✈️', title: 'Uniformed Chauffeur', desc: 'Professional drivers' },
              { icon: '📸', title: 'Photo-Ready Cars', desc: 'Perfect for wedding shoots' },
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

      {/* Wedding Cars Fleet — dynamic from luxury-car-rental */}
      {luxuryFleet.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-2">Wedding Cars Available in {locationName}</h2>
            <p className="text-gray-500 mb-8">Premium luxury fleet for your special day</p>
            <div className={`grid gap-6 ${
              luxuryFleet.length === 1 ? 'max-w-sm mx-auto' :
              luxuryFleet.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
              luxuryFleet.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' :
              'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {luxuryFleet.map((car) => (
                <div key={car.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-rose-100 overflow-hidden flex flex-col">
                  <div className="relative h-44 bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                    {car.sideImage ? (
                      <Image src={car.sideImage} alt={car.name} fill className="object-contain p-3" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" />
                    ) : (
                      <span className="text-7xl">🚗</span>
                    )}
                    {car.isPopular && (
                      <span className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐ Popular</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight">{car.name}</h3>
                      {car.rating && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                          ★ {car.rating}
                        </span>
                      )}
                    </div>
                    {car.brands?.name && <p className="text-xs text-gray-400 mb-1">{car.brands.name}</p>}
                    {car.tagline && <p className="text-sm text-gray-500 mb-3 flex-1">{car.tagline}</p>}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      {car.basePricePerDay ? (
                        <p className="text-lg font-bold text-rose-700">
                          <span className="text-xs font-normal text-gray-500">Starting From </span>
                          ₹{car.basePricePerDay.toLocaleString('en-IN')}
                          
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-rose-700">Get Quote</p>
                      )}
                      {car.highlight && <p className="text-xs text-green-600 mt-1">{car.highlight}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              * Prices may vary based on vendor quotes. Decoration & chauffeur included.
            </p>
          </div>
        </section>
      )}

      {/* Wedding Functions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for All Wedding Functions in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Baraat (बारात)', icon: '🎺', desc: 'Groom entry car' },
              { occasion: 'Bride Entry', icon: '👰', desc: 'Dulhan car service' },
              { occasion: 'Reception', icon: '🎊', desc: 'Couple car' },
              { occasion: 'Haldi/Mehendi', icon: '🌼', desc: 'Pre-wedding car' },
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

      {/* Decoration Options */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Wedding Car Decoration in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-rose-800">Standard (Free)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Fresh flower garlands</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Ribbon & bows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Side door decorations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Basic floral arrangements</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-amber-900">Premium (+₹1500)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Premium flowers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>LED lights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Custom name board</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Full car wrapping</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Wedding Car in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Wedding Car', desc: 'Select from premium collection' },
              { step: '2', title: 'Select Date & Time', desc: `Pick your wedding date in ${locationName}` },
              { step: '3', title: 'Choose Decoration', desc: 'Standard or premium decoration' },
              { step: '4', title: 'Book Online', desc: 'Complete booking with payment' },
              { step: '5', title: 'Enjoy Your Wedding', desc: 'We deliver decorated car on time' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold">
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
                q: `How much does wedding car rental cost in ${locationName}?`,
                a: `Wedding car rental in ${locationName} starts from ₹2999 for 4 hours (baraat). Luxury cars like Mercedes cost ₹6999-9999. Decoration included.`,
              },
              {
                q: `Which wedding cars are available in ${locationName}?`,
                a: `We offer Fortuner, Mercedes, BMW, Audi, Vintage Ambassador, and Range Rover in ${locationName} for weddings.`,
              },
              {
                q: `Is car decoration free in ${locationName}?`,
                a: `Yes! Basic flower decoration with ribbons is FREE. Premium decoration with LED lights available at ₹1500 extra.`,
              },
              {
                q: `Do you provide chauffeur for wedding cars in ${locationName}?`,
                a: `Yes, all wedding cars in ${locationName} come with professional uniformed chauffeur at no extra cost.`,
              },
              {
                q: `Can I book vintage car for baraat in ${locationName}?`,
                a: `Yes! Vintage Ambassador cars are available in ${locationName} starting @₹3999. Perfect for traditional Indian weddings.`,
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
        serviceSlug="wedding-car-rental"
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
            name: `Wedding Car Rental in ${locationName}`,
            description: `Rent wedding cars in ${locationName}. Baraat cars, bride/groom cars with decoration.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '2999',
              highPrice: '9999',
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
