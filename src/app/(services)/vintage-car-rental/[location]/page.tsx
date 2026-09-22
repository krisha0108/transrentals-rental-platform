import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { Crown, Camera, Palette, Gem, Music2, Landmark, Car, Check } from 'lucide-react';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getLuxuryServiceId, getLocationId } from '@/lib/db/build-cache';
import { VintageCarsGrid } from '@/components/vintage-car-rental/VintageCarsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  lift: 'group-hover:-translate-y-2',
  tick: 'group-hover:rotate-[360deg]',
  pulse: 'group-hover:scale-125',
  ring: 'group-hover:rotate-12',
};

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
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Vintage Car Rental ${locationName} | Classic Car Wedding | Ambassador`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent vintage cars in ${locationName}. Classic Ambassador, retro cars for weddings. Photo shoot ready.`,
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
      title: `Vintage Car Rental in ${locationName} - Classic Cars`,
      description: `Book vintage & classic cars in ${locationName}. Perfect for weddings and photo shoots.`,
      url: `https://transrentals.in/vintage-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/vintage-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Vintage Car Rental in ${locationName} | TransRentals`,
      description: ``,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'Which vintage cars are available?', answer: 'Classic Ambassadors, Impalas, Fiats and retro convertibles — restored, shoot-ready and driven by a uniformed chauffeur.' },
  { question: 'When will vintage car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Can I book for a photo shoot?', answer: 'Yes. Half-day and full-day shoot bookings are supported, with the car staged at your location.' },
];

/**
 * What a city sees while no operator is live there yet: no booking form and no
 * quoted rate, just the nearest cities that are bookable today.
 */
function ExpandingCityPage({ cityName, citySlug }: { cityName: string; citySlug: string }) {
  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/vintage-car-rental" className="hover:text-primary">Vintage Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="vintage car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="vintage-car-rental"
          serviceName="Vintage Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="vintage car"
        selectionDesc="Classic Ambassadors, Impalas and retro convertibles, shoot-ready."
      />
      <FAQSection service="vintage-car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function VintageCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('vintage-car-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'luxury-car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="vintage-car-rental" serviceName="Vintage Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`vintage-car-rental:${params.location.toLowerCase()}`);

  const pageFaqs = [
    { question: 'Which vintage cars are available for rent?', answer: 'We offer Ambassador Classic, Fiat 1100, Standard Herald, Premier Padmini, and retro Jeeps — all restored and photo-shoot ready.' },
    { question: 'Is the vintage car available with a uniformed chauffeur?', answer: 'Yes, all vintage car rentals include a uniformed professional chauffeur. The driver is trained in ceremonial etiquette for weddings.' },
    { question: 'What occasions are vintage cars best for?', answer: 'Vintage cars are ideal for baraat entry, pre-wedding shoots, anniversary celebrations, heritage-theme events, and movie/ad shoots.' },
    { question: 'What packages are available for a wedding baraat?', answer: 'Baraat packages run about 4 hours, full-day packages cover the whole event, and photo shoot packages run 2–3 hours. Share your date on TransRentals and operators send their quotes.' },
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
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Choose <span className="text-emerald-600">Vintage Car</span> in {locationName}?
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { icon: Crown, anim: 'lift', title: 'Royal Appeal', desc: `Classic charm in ${locationName}` },
              { icon: Camera, anim: 'tick', title: 'Photo Perfect', desc: 'Stunning wedding photos' },
              { icon: Palette, anim: 'pulse', title: 'Unique Style', desc: 'Stand out from crowd' },
              { icon: Gem, anim: 'pulse', title: 'Heritage', desc: 'Timeless elegance' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `vtg-loc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes vtg-loc-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="vtg-loc-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Vintage / Luxury Cars Available — dynamic */}
      {carsWithPrice.length > 0 && (
        <VintageCarsGrid cars={carsWithPrice} locationName={locationName} />
      )}

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Perfect for <span className="text-emerald-600">Events in {locationName}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { occasion: 'Baraat Entry', icon: Music2, anim: 'ring', desc: `Traditional entry in ${locationName}` },
              { occasion: 'Wedding Photos', icon: Camera, anim: 'tick', desc: 'Stunning backdrops' },
              { occasion: 'Pre-Wedding', icon: Camera, anim: 'tick', desc: 'Vintage theme shoots' },
              { occasion: 'Heritage Events', icon: Landmark, anim: 'lift', desc: 'Traditional functions' },
            ].map((item, idx) => (
              <div
                key={item.occasion}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `vtg-loc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.occasion}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Vintage Car <span className="text-emerald-600">Features in {locationName}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Car,
                title: 'Car Features',
                items: ['Well-restored classics', 'Pristine condition', 'Photo-ready exteriors', 'Period interiors', 'Unique vintage appeal'],
              },
              {
                icon: Palette,
                title: 'Decoration',
                items: ['Vintage-style flowers', 'Traditional ribbons', 'Heritage-themed decor', 'Custom nameplate', 'Uniformed driver'],
              },
            ].map((panel) => (
              <div
                key={panel.title}
                className="rounded-[18px] border border-gray-100 shadow-sm overflow-hidden bg-white flex max-w-lg mx-auto md:max-w-none"
              >
                <div className="w-[104px] shrink-0 bg-emerald-50 flex items-center justify-center">
                  <panel.icon className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">{panel.title}</h3>
                  <ul className="space-y-2.5">
                    {panel.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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
            '@type': 'Service',
            serviceType: 'Vintage Car Rental',
            name: `Vintage Car Rental in ${locationName}`,
            description: `Rent vintage & classic cars in ${locationName} for weddings and events.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
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
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="vintage-car-rental" location={locationName} customFaqs={pageFaqs} />

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
