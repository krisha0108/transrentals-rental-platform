import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { WeddingFleetSection } from '@/components/wedding-car-rental/WeddingFleetSection';
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
    twitter: {
      card: 'summary_large_image' as const,
      title: `Wedding Car Rental in ${locationName} | TransRentals`,
      description: `Book wedding cars in ${locationName}. Baraat cars, bride/groom cars with decoration @₹2999.`,
    },
  };
}

export default async function WeddingCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-car-rental', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="wedding-car-rental" serviceName="Wedding Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const pageFaqs = [
    { question: 'Which luxury cars are available for wedding rental?', answer: 'We offer Mercedes E-Class, BMW 5-Series, Audi A6, Toyota Fortuner, and Jaguar XF — all with professional chauffeurs and wedding decoration.' },
    { question: 'Is wedding decoration included in car rental?', answer: 'Yes, basic floral decoration is included. Premium decoration packages (LED lights, custom themes, petal showers) are available at extra cost.' },
    { question: 'Can I rent multiple luxury cars for a wedding procession?', answer: 'Yes, fleet bookings for wedding processions are available with 10–15% group discount. Book 4+ cars for assured convoy pricing.' },
    { question: 'How far in advance should I book a wedding car rental?', answer: 'We recommend booking 2–4 weeks before the wedding date. For peak wedding season (Oct–Feb), book at least 6 weeks in advance.' },
  ];

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
      <SpecialtyCarBookingHero service="wedding" city={locationName} citySlug={params.location} />

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
        <WeddingFleetSection cars={luxuryFleet} locationName={locationName} />
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

      <RelatedServices
        locationSlug={params.location}
        parentSlug="luxury-car-rental"
        parentName="Luxury Car Rental"
        currentSlug="wedding-car-rental"
        siblings={[
          { slug: 'wedding-car-rental', name: 'Wedding Car Rental' },
          { slug: 'sports-car-rental', name: 'Sports Car Rental' },
          { slug: 'vintage-car-rental', name: 'Vintage Car Rental' },
        ]}
      />

    </>
  );
}
