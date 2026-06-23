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
import { getLuxuryServiceId, getLocationId } from '@/lib/db/build-cache';
import { VintageCarsGrid } from '@/components/vintage-car-rental/VintageCarsGrid';
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
    return { title: 'Vintage Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`vintage-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('vintage-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Vintage Car Rental ${locationName} | Classic Car Wedding @₹8999 | Ambassador`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent vintage cars in ${locationName}. Classic Ambassador, retro cars for weddings. Heritage car booking @₹8999. Photo shoot ready.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `vintage car rental ${locationName.toLowerCase()}`,
      `vintage car wedding ${locationName.toLowerCase()}`,
      `classic car ${locationName.toLowerCase()}`,
      `ambassador car ${locationName.toLowerCase()}`,
      `vintage car hire ${locationName.toLowerCase()}`,
      `retro car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `vintage car ${k}`),
    ],
    openGraph: {
      title: `Vintage Car Rental in ${locationName} - Classic Cars @₹8999`,
      description: `Book vintage & classic cars in ${locationName}. Perfect for weddings and photo shoots.`,
      url: `https://transrentals.in/vintage-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/vintage-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Vintage Car Rental in ${locationName} | TransRentals`,
      description: `Rent vintage classic cars in ${locationName} for weddings & photo shoots @₹8999.`,
    },
  };
}

export default async function VintageCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('vintage-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="vintage-car-rental" serviceName="Vintage Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`vintage-car-rental:${params.location.toLowerCase()}`);

  const pageFaqs = [
    { question: 'Which vintage cars are available for rent?', answer: 'We offer Ambassador Classic, Fiat 1100, Standard Herald, Premier Padmini, and retro Jeeps — all restored and photo-shoot ready.' },
    { question: 'Is the vintage car available with a uniformed chauffeur?', answer: 'Yes, all vintage car rentals include a uniformed professional chauffeur. The driver is trained in ceremonial etiquette for weddings.' },
    { question: 'What occasions are vintage cars best for?', answer: 'Vintage cars are ideal for baraat entry, pre-wedding shoots, anniversary celebrations, heritage-theme events, and movie/ad shoots.' },
    { question: 'What is the rental cost for a vintage car for a wedding baraat?', answer: 'Baraat packages (4 hours) start from ₹8999. Full-day packages from ₹15999. Photo shoot packages from ₹6999 for 2–3 hours.' },
  ];

  // Fetch luxury car models for this location (service id cached across pages)
  const [luxuryServiceId, locationId, scContent] = await Promise.all([
    getLuxuryServiceId(),
    getLocationId(params.location),
    getServiceCityContent('vintage-car-rental', params.location),
  ]);

  const luxuryCars = luxuryServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: luxuryServiceId, isActive: true },
    select: {
      id: true, name: true, sideImage: true, seatingCapacity: true,
      basePricePerDay: true, isPopular: true, tagline: true, highlight: true,
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

  const carsWithPrice = (luxuryCars ?? []).map((m) => {
    const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
    const price = locationPrice ?? m.basePricePerDay ?? null;
    return { ...m, price };
  });

  return (
    <>
      <SpecialtyCarBookingHero service="vintage" city={locationName} citySlug={params.location.toLowerCase()} />

      {/* Why Vintage Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Vintage Car in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👑', title: 'Royal Appeal', desc: `Classic charm in ${locationName}` },
              { icon: '📸', title: 'Photo Perfect', desc: 'Stunning wedding photos' },
              { icon: '🎨', title: 'Unique Style', desc: 'Stand out' },
              { icon: '💎', title: 'Heritage', desc: 'Timeless elegance' },
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

      {/* Vintage / Luxury Cars Available — dynamic */}
      {carsWithPrice.length > 0 && (
        <VintageCarsGrid cars={carsWithPrice} locationName={locationName} />
      )}

      {/* Perfect Occasions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Baraat Entry', icon: '🎺', desc: `Traditional entry in ${locationName}` },
              { occasion: 'Wedding Photos', icon: '📸', desc: 'Stunning backdrops' },
              { occasion: 'Pre-Wedding', icon: '📷', desc: 'Vintage theme shoots' },
              { occasion: 'Heritage Events', icon: '🏛️', desc: 'Traditional functions' },
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

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Vintage Car Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-amber-800">Car Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Well-restored classics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Pristine condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Photo-ready exteriors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Period interiors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Unique vintage appeal</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-yellow-900">Decoration</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Vintage-style flowers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Traditional ribbons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Heritage-themed decor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Custom nameplate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Uniformed driver</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="vintage-car-rental"
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
            name: `Vintage Car Rental in ${locationName}`,
            description: `Rent vintage & classic cars in ${locationName} for weddings and events.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 8999,
              highPrice: 14999,
              offerCount: 10,
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
        locationSlug={params.location.toLowerCase()}
        parentSlug="luxury-car-rental"
        parentName="Luxury Car Rental"
        currentSlug="vintage-car-rental"
        siblings={[
          { slug: 'wedding-car-rental', name: 'Wedding Car Rental' },
          { slug: 'sports-car-rental', name: 'Sports Car Rental' },
          { slug: 'vintage-car-rental', name: 'Vintage Car Rental' },
        ]}
      />

    </>
  );
}
