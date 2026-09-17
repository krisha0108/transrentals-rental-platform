import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
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
import { WeddingFleetSection } from '@/components/wedding-car-rental/WeddingFleetSection';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import {
  Sparkles, Palette, UserCheck, Camera, Music, Heart, PartyPopper, Flower2,
  CheckCircle2, Gem,
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
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Wedding Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`wedding-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('wedding-car-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Wedding Car Rental ${locationName} | Shadi Car Hire | Baraat Car`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Book wedding cars in ${locationName}. Baraat car rental, bride/groom car, vintage cars. Professional decoration & chauffeur.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
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
      title: `Wedding Car Rental in ${locationName} - Shadi Car`,
      description: `Premium wedding cars in ${locationName}. Baraat, bride & groom cars with decoration.`,
      url: `https://transrentals.in/wedding-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/wedding-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Wedding Car Rental in ${locationName} | TransRentals`,
      description: `Book wedding cars in ${locationName}.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What wedding cars are available?', answer: 'Decorated baraat cars, bride and groom cars, vintage classics and luxury sedans, each with a uniformed chauffeur.' },
  { question: 'When will wedding car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is decoration included?', answer: 'Floral decoration packages are offered by most operators and are confirmed in the quote before booking.' },
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
            <a href="/wedding-car-rental" className="hover:text-primary">Wedding Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="wedding car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="wedding-car-rental"
          serviceName="Wedding Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="wedding car"
        selectionDesc="Decorated baraat cars, bride and groom cars, vintage and luxury options."
      />
      <FAQSection service="wedding-car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function WeddingCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('wedding-car-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'luxury-car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="wedding-car-rental" serviceName="Wedding Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const pageFaqs = [
    { question: 'Which luxury cars are available for wedding rental?', answer: 'We offer Mercedes E-Class, BMW 5-Series, Audi A6, Toyota Fortuner, and Jaguar XF — all with professional chauffeurs and wedding decoration.' },
    { question: 'Is wedding decoration included in car rental?', answer: 'Yes, basic floral decoration is included. Premium decoration packages (LED lights, custom themes, petal showers) are available at extra cost.' },
    { question: 'Can I rent multiple luxury cars for a wedding procession?', answer: 'Yes, fleet bookings for wedding processions are available with 10–15% group discount. Book 4+ cars for assured convoy pricing.' },
    { question: 'How far in advance should I book a wedding car rental?', answer: 'We recommend booking 2–4 weeks before the wedding date. For peak wedding season (Oct–Feb), book at least 6 weeks in advance.' },
  ];

  const [seoData, luxuryFleet, scContent] = await Promise.all([
    resolvePageMeta(`wedding-car-rental:${params.location.toLowerCase()}`),
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
    getServiceCityContent('wedding-car-rental', params.location),
  ]);


  return (
    <>
      <SpecialtyCarBookingHero service="wedding" city={locationName} citySlug={params.location.toLowerCase()} />

      {/* Why Wedding Cars in This City */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Book Wedding Cars in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Sparkles, title: 'Grand Baraat Entry', desc: `Make memorable entry in ${locationName}` },
              { Icon: Palette, title: 'Free Decoration', desc: 'Flowers & ribbons included' },
              { Icon: UserCheck, title: 'Uniformed Chauffeur', desc: 'Professional drivers' },
              { Icon: Camera, title: 'Photo-Ready Cars', desc: 'Perfect for wedding shoots' },
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

      {/* Wedding Cars Fleet — dynamic from luxury-car-rental */}
      {luxuryFleet.length > 0 && (
        <WeddingFleetSection cars={luxuryFleet} locationName={locationName} />
      )}

      {/* Wedding Functions */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for All Wedding Functions in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Music, occasion: 'Baraat (बारात)', desc: 'Groom entry car' },
              { Icon: Heart, occasion: 'Bride Entry', desc: 'Dulhan car service' },
              { Icon: PartyPopper, occasion: 'Reception', desc: 'Couple car' },
              { Icon: Flower2, occasion: 'Haldi/Mehendi', desc: 'Pre-wedding car' },
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

      {/* Decoration Options */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Wedding Car Decoration in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Standard (Free)</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Fresh flower garlands',
                  'Ribbon & bows',
                  'Side door decorations',
                  'Basic floral arrangements',
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
                  <Gem className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Premium</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Premium flowers',
                  'LED lights',
                  'Custom name board',
                  'Full car wrapping',
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
            How to Book Wedding Car in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose Wedding Car', desc: 'Select from premium collection' },
              { step: '2', title: 'Select Date & Time', desc: `Pick your wedding date in ${locationName}` },
              { step: '3', title: 'Choose Decoration', desc: 'Standard or premium decoration' },
              { step: '4', title: 'Book Online', desc: 'Complete booking with payment' },
              { step: '5', title: 'Enjoy Your Wedding', desc: 'We deliver decorated car on time' },
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
              serviceSlug="wedding-car-rental"
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
            serviceType: 'Wedding Car Rental',
            name: `Wedding Car Rental in ${locationName}`,
            description: `Rent wedding cars in ${locationName}. Baraat cars, bride/groom cars with decoration.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 2999,
              highPrice: 9999,
              offerCount: 15,
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

      <FAQSection service="wedding-car-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
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
