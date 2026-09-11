import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ALL_CITIES, getCityBySlug } from '@/data/indian-cities';
import { Crown, Star, Shield, Clock, Phone } from 'lucide-react';
import { LuxuryBookingHero } from '@/components/luxury';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { ComingSoonHero } from '@/components/services/ComingSoonHero';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { prisma } from '@/lib/db/prisma';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionsContent } from '@/components/seo/ServiceCitySections';
import { ServiceAreasSection } from '@/components/location/ServiceAreasSection';
import { CrossServiceLinks } from '@/components/location/CrossServiceLinks';
import { FAQSection } from '@/components/services/FAQSection';
import { Heart, Briefcase, Plane, Camera } from 'lucide-react';

const COMING_SOON_SLUGS = new Set([
  'vadodara',
  'Gandhinagar',
  'gandhinagar',
  'sasaram',
]);

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);

  if (!city) {
    return { title: 'Luxury Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`luxury-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('luxury-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Luxury Car Rental in ${locationName} | BMW, Mercedes, Audi, Ferrari | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent luxury & exotic cars in ${locationName}. BMW, Mercedes, Audi, Jaguar, Range Rover, Ferrari, Lamborghini. Premium car hire with professional chauffeur. Wedding, corporate events.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `luxury car rental ${locationName.toLowerCase()}`,
      `exotic car hire ${locationName.toLowerCase()}`,
      `BMW rental ${locationName.toLowerCase()}`,
      `Mercedes rental ${locationName.toLowerCase()}`,
      `Ferrari rental ${locationName.toLowerCase()}`,
      `wedding car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `luxury car ${k}`),
    ],
    alternates: {
      canonical: `https://transrentals.in/luxury-car-rental/${params.location.toLowerCase()}`,
    },
    openGraph: {
      title: `Luxury Car Rental in ${locationName} | BMW, Mercedes, Audi | TransRentals`,
      description: `Book luxury & exotic cars in ${locationName}. Premium vehicles with chauffeur service for weddings, corporate events, and special occasions.`,
      type: 'website',
      url: `https://transrentals.in/luxury-car-rental/${params.location.toLowerCase()}`,
      images: [{ url: `https://transrentals.in/api/og?service=luxury-car-rental&location=${encodeURIComponent(locationName)}`, width: 1200, height: 630, alt: `Luxury Car Rental in ${locationName}` }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Luxury Car Rental in ${locationName} | TransRentals`,
      description: `BMW, Mercedes, Audi, Ferrari, Lamborghini available in ${locationName}. Chauffeur-driven luxury cars for weddings and events.`,
      images: [`https://transrentals.in/api/og?service=luxury-car-rental&location=${encodeURIComponent(locationName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}


export default async function LuxuryCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('luxury-car-rental', params.location, { comingSoonIfUnavailable: true });
  if (pageContext.type === 'redirect') {
    if (COMING_SOON_SLUGS.has(params.location)) {
      const cityName = getCityBySlug(params.location)?.name ??
        params.location.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return (
        <>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container-custom py-3">
              <nav className="text-sm text-gray-600">
                <a href="/" className="hover:text-primary">Home</a>
                <span className="mx-2">/</span>
                <a href="/luxury-car-rental" className="hover:text-primary">Luxury Car Rental</a>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{cityName}</span>
              </nav>
            </div>
          </div>
          <ComingSoonHero
            city={cityName}
            citySlug={params.location.toLowerCase()}
            serviceSlug="luxury-car-rental"
            serviceName="Luxury Car Rental"
            themeColor="amber"
          />
        </>
      );
    }
    permanentRedirect(pageContext.to);
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="luxury-car-rental" serviceName="Luxury Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/luxury-car-rental" className="hover:text-primary">Luxury Car Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ComingSoonHero
          city={cityName}
          citySlug={params.location.toLowerCase()}
          serviceSlug="luxury-car-rental"
          serviceName="Luxury Car Rental"
          themeColor="amber"
        />
        <NearbyActiveCities
          currentCitySlug={params.location.toLowerCase()}
          serviceSlug="luxury-car-rental"
          serviceName="Luxury Car Rental"
        />
      </>
    );
  }
  const city = pageContext.city;
  const locationName = city.name;
  const scContent = await getServiceCityContent('luxury-car-rental', params.location);

  // Get nearby cities for internal linking
  const nearbyCities = ALL_CITIES
    .filter(c => c.state === city.state && c.slug !== city.slug)
    .slice(0, 6);

  const luxuryFaqs = [
    { q: `How does luxury car booking work in ${locationName}?`, a: `Simply fill in your trip details (date, time, type of trip), and our verified vendors will send you customized quotes. Compare quotes and choose the best one for your needs.` },
    { q: `Which luxury cars are available in ${locationName}?`, a: `We offer Mercedes E-Class, S-Class, BMW 5/7 Series, Audi A6/A8, Jaguar XF, Range Rover, Porsche 911/Cayenne, Bentley, Rolls-Royce, Ferrari, and Lamborghini in ${locationName}.` },
    { q: `Is chauffeur service included in ${locationName}?`, a: `Yes, professional chauffeur service is included with all luxury car rentals in ${locationName}. Our chauffeurs are trained, well-groomed, and know the city well.` },
    { q: `Do you deliver luxury cars to my location in ${locationName}?`, a: `Yes, we provide doorstep delivery anywhere in ${locationName} — home, office, hotel, airport, or event venue. Delivery arrangements are included in vendor quotes.` },
    { q: `Can I rent exotic cars like Ferrari or Lamborghini in ${locationName}?`, a: `Yes, exotic supercars including Ferrari 488, Lamborghini Huracan, Porsche 911 are available in ${locationName} for special occasions, photoshoots, and events.` },
  ];

  return (
    <>
      {/* Luxury Booking Hero */}
      <LuxuryBookingHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
      />

      {/* Why Choose Luxury Cars in This City */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Why Rent Luxury Cars in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Crown, title: 'Premium Fleet', desc: `Latest luxury models available in ${locationName}` },
              { Icon: Star, title: 'Expert Chauffeurs', desc: 'Trained, professional drivers who know the city' },
              { Icon: Clock, title: 'Flexible Timing', desc: 'Book by hour, day, or week as per your need' },
              { Icon: Shield, title: 'Fully Insured', desc: 'Complete peace of mind with comprehensive coverage' },
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

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Perfect for Events in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { Icon: Heart, occasion: 'Weddings', desc: `Grand arrivals at ${locationName} weddings` },
              { Icon: Briefcase, occasion: 'Corporate Events', desc: 'Impress clients and partners' },
              { Icon: Plane, occasion: 'Airport Transfers', desc: `VIP service to ${locationName} airport` },
              { Icon: Camera, occasion: 'Photoshoots', desc: 'Perfect backdrop for your shoot' },
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

      {/* Premium Services Included */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What&apos;s Included in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
              <h3 className="font-bold text-xl mb-4 text-purple-900 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Standard Features
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  'Professional chauffeur service',
                  'Fuel charges included',
                  `Doorstep delivery in ${locationName}`,
                  'Complimentary water & tissues',
                  'Full insurance coverage',
                  '24/7 customer support',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-100">
              <h3 className="font-bold text-xl mb-4 text-amber-900 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Premium Amenities
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  'Latest model luxury vehicles',
                  'Premium leather interiors',
                  'Advanced infotainment system',
                  'Climate control AC',
                  'Premium sound system',
                  'Wi-Fi connectivity (select cars)',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">✓</span>
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
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Fill Details', desc: 'Tell us your trip type, date & time', icon: Clock },
              { step: '2', title: 'Get Quotes', desc: 'Receive quotes from verified vendors', icon: Star },
              { step: '3', title: 'Accept Quote', desc: 'Choose the best quote for you', icon: Shield },
              { step: '4', title: 'Enjoy Luxury', desc: 'We deliver to your doorstep', icon: Crown },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-purple-900 text-white rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Luxury Cars in Nearby Cities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity.slug}
                  href={`/luxury-car-rental/${nearbyCity.slug}`}
                  className="bg-white p-4 rounded-xl text-center hover:shadow-lg transition-all duration-300 hover:border-purple-200 border border-transparent"
                >
                  <h3 className="font-semibold text-gray-900 hover:text-purple-900 transition-colors">
                    {nearbyCity.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Premium Luxury Cars</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQSection
        service="luxury-car-rental"
        location={locationName}
        customFaqs={luxuryFaqs.map((faq) => ({ question: faq.q, answer: faq.a }))}
      />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-900 via-purple-800 to-gray-900 text-white">
        <div className="container-custom text-center">
          <Crown className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Luxury in {locationName}?
          </h2>
          <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
            Fill in your requirements and get personalized quotes from verified vendors. Doorstep delivery guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`/luxury-car-rental/${params.location.toLowerCase()}/book`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300"
            >
              <Crown className="w-5 h-5" />
              Get Quotes Now
            </a>
          </div>
        </div>
      </section>

      <ServiceAreasSection
        serviceSlug="luxury-car-rental"
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        serviceName="Luxury Car Rental"
      />

      <CrossServiceLinks
        citySlug={params.location.toLowerCase()}
        cityName={locationName}
        currentServiceSlug="luxury-car-rental"
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="luxury-car-rental"
        parentName="Luxury Car Rental"
        currentSlug="luxury-car-rental"
        siblings={[
          { slug: 'car-rental', name: 'Car Rental' },
          { slug: 'self-drive-car-rentals', name: 'Self Drive Cars' },
        ]}
      />

      {/* AutoRental Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'AutoRental',
        name: `Luxury Car Rental in ${locationName} — TransRentals`,
        description: `Rent luxury and exotic cars in ${locationName}. BMW, Mercedes, Audi, Ferrari, Lamborghini, Rolls-Royce with professional chauffeur.`,
        url: `https://transrentals.in/luxury-car-rental/${params.location.toLowerCase()}`,
        priceRange: '₹₹₹',
        areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        vehicleType: 'Luxury Car, SUV, Limousine, Exotic Supercar',
      })}} />
      {/* BreadcrumbList Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Luxury Car Rental', item: 'https://transrentals.in/luxury-car-rental' },
          { '@type': 'ListItem', position: 3, name: `Luxury Car Rental in ${locationName}`, item: `https://transrentals.in/luxury-car-rental/${params.location.toLowerCase()}` },
        ],
      })}} />
      {/* FAQPage Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: luxuryFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      })}} />
    </>
  );
}
