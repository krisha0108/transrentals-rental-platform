import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { prisma } from '@/lib/db/prisma';
import { CarSearchHero } from '@/components/car';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { resolveServicePage } from '@/lib/services/service-availability';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { containsPrice, stripPricesFromText } from '@/lib/content/strip-prices';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { CITY_SEO } from '@/data/city-seo-content';
import { RelatedServices } from '@/components/services/RelatedServices';
import { AutoRentalSchema } from '@/components/seo/schemas';
import { getServiceLocationRating } from '@/lib/services/cached-service-lookups';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import { ShieldCheck, Clock, Wallet, MapPin as MapPinIcon } from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DB locations table
// Pages for DB-enabled cities → booking form hero
// Pages for non-enabled cities → coming soon hero
export async function generateStaticParams() {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  try {
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch {
    return [];
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || params.location.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-car-rentals:${params.location.toLowerCase()}`),
    getServiceCityContent('self-drive-car-rentals', params.location),
  ]);
  return {
    // No rate is quoted for this page — see the note in the page body.
    title: stripPricesFromText(scContent?.metaTitle || _seoDb?.metaTitle || `Self Drive Car Rental in ${locationName} | Drive Yourself | TransRentals | TransRentals`),
    description: stripPricesFromText(scContent?.metaDescription || _seoDb?.metaDescription || `Rent self-drive cars in ${locationName} — no driver, complete freedom. Flexible pickup hours, doorstep delivery. Book self-drive car in ${locationName} now!`),
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `self drive car rental ${locationName.toLowerCase()}`,
      `self drive car ${locationName.toLowerCase()}`,
      `self drive cars ${locationName.toLowerCase()}`,
      `self drive car hire ${locationName.toLowerCase()}`,
      `drive yourself car ${locationName.toLowerCase()}`,
      `car without driver ${locationName.toLowerCase()}`,
      `self driven car ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `self drive car ${k}`),
    ],
    openGraph: {
      title: `Self Drive Car Rental in ${locationName} - Starting`,
      description: `Book self-drive cars in ${locationName}. No driver needed. Complete freedom to drive yourself.`,
      url: `https://transrentals.in/self-drive-car-rentals/${params.location.toLowerCase()}`,
      images: [{ url: 'https://transrentals.in/images/og/self-drive.jpg', width: 1200, height: 630, alt: `Self Drive Car Rental in ${locationName}` }],
      type: 'website',
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Self Drive Car Rental in ${locationName} - TransRentals`,
      description: `Rent self-drive cars in ${locationName} from verified partners.`,
      images: ['https://transrentals.in/images/og/self-drive.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-car-rentals/${params.location.toLowerCase()}`,
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  };
}

const launchFaqs = [
  { question: 'What documents do I need to rent?', answer: 'A valid driving licence and one government photo ID (Aadhaar, passport or voter card).' },
  { question: 'Is a security deposit required?', answer: 'Yes, a refundable deposit is collected at pickup and returned when you bring the car back.' },
  { question: 'Is roadside assistance available?', answer: 'Yes, our partners provide 24/7 roadside assistance for the length of your rental.' },
];

export default async function SelfDriveCarRentalLocationPage({ params }: PageProps) {
  // comingSoonIfUnavailable keeps a known city out of the redirect
  // branch — it gets the "we're expanding" page below instead.
  const pageContext = await resolveServicePage('self-drive-car-rentals', params.location, {
    comingSoonIfUnavailable: true,
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="self-drive-car-rentals" serviceName="Self Drive Car Rentals" />;

  // No partners onboarded here yet — no booking hero, because there is
  // nothing to search. The page says where we're at and points at the
  // nearest city that is bookable today.
  if (pageContext.type === 'coming-soon') {
    const cityName = pageContext.city.name;
    return (
      <>
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/self-drive-car-rentals" className="hover:text-primary">Self Drive Car Rental</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{cityName}</span>
            </nav>
          </div>
        </div>
        <ServiceExpandingHero cityName={cityName} serviceLabel="self drive car rentals" />
        <div id="nearby-cities" className="scroll-mt-4">
          <NearbyActiveCities
            currentCitySlug={params.location}
            serviceSlug="self-drive-car-rentals"
            serviceName="Self Drive Car Rental"
          />
        </div>
        <ServiceLaunchBenefits cityName={cityName} vehicleNoun="car" selectionDesc="Hatchbacks, sedans and SUVs — the full self drive range." />
        <FAQSection service="self-drive-car-rentals" location={cityName} customFaqs={launchFaqs} />
      </>
    );
  }

  const city = pageContext.city;
  const locationName = city.name;
  // Same no-rate rule: a question that exists only to quote one goes, and
  // answers keep every sentence except the one carrying a number.
  const cityFAQs = (CITY_SEO[params.location]?.serviceFAQs?.['self-drive-car-rentals'] || [])
    .filter((faq) => !containsPrice(faq.q))
    .map((faq) => ({ q: faq.q, a: stripPricesFromText(faq.a) }))
    .filter((faq) => faq.a.length > 0);
  const pageFaqs = cityFAQs.length > 0
    ? cityFAQs
        .map((faq) => ({ question: faq.q, answer: stripPricesFromText(faq.a) }))
        .filter((faq) => faq.answer)
    : [
        { question: `What documents are required for self-drive car rental in ${locationName}?`, answer: `You need a valid driving license (minimum 1 year old), Aadhaar card/PAN card for ID proof, and a refundable security deposit.` },
        { question: `Is fuel included in self-drive car rental?`, answer: `No, fuel charges are separate. The car will have some fuel when you pick it up, and you should return it with the same fuel level.` },
        { question: `Can I take a self-drive car for outstation trips from ${locationName}?`, answer: `Yes, you can take self-drive cars for outstation trips from ${locationName}. Additional charges may apply for inter-state travel.` },
      ];

  const [seoData, liveRating, scContent] = await Promise.all([
    resolvePageMeta(`self-drive-car-rentals:${params.location.toLowerCase()}`),
    getServiceLocationRating('self-drive-car-rentals', params.location),
    getServiceCityContent('self-drive-car-rentals', params.location),
  ]);

  // No rate is quoted anywhere on this page — the real price depends on
  // the partner and the dates, so a number in the copy would mislead.
  const heroDescription = stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined;

  return (
    <>
      <CarSearchHero
        city={locationName}
        citySlug={params.location.toLowerCase()}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={heroDescription ?? 'Drive yourself without a driver. Hatchbacks, sedans and SUVs from verified partners.'}
      />

      {/* Why Self Drive in This City */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
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
              Why Choose Self Drive Cars in <span className="text-primary">{locationName}</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {[
              { Icon: ShieldCheck, title: 'Complete Privacy', desc: 'Drive alone without a driver' },
              { Icon: Clock, title: 'Your Schedule', desc: 'No time restrictions' },
              { Icon: Wallet, title: 'No Driver Cost', desc: 'Save on driver charges' },
              { Icon: MapPinIcon, title: 'Explore Freely', desc: `Discover ${locationName} at your pace` },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center"
              >
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Cars - Dynamic from Database */}
      <ServiceFleetDisplay
        serviceSlug="self-drive-car-rentals"
        locationSlug={params.location.toLowerCase()}
        title={`Self Drive Cars Available in ${locationName}`}
        showCategories={true}
        limit={12}
        showViewAll={false}
        hidePrices
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} hidePrices />

      <FAQSection service="self-drive-car-rentals" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental"
        currentSlug="self-drive-car-rentals"
        siblings={[
          { slug: 'car-rental', name: 'Chauffeur Driven' },
          { slug: 'luxury-car-rental', name: 'Luxury Cars' },
          { slug: 'hourly-car-rental', name: 'Hourly Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Rental' },
        ]}
      />

      {/* AutoRental Schema — schema.org/AutoRental subtype */}
      <AutoRentalSchema
        name={`Self Drive Car Rental in ${locationName} — TransRentals`}
        description={`Rent self-drive cars in ${locationName} without a driver. Hatchbacks, sedans, SUVs, all from verified partners.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        serviceSlug="self-drive-car-rentals"
        vehicleTypes={['Car', 'SUV', 'Hatchback', 'Sedan']}
        rating={liveRating?.ratingValue}
        reviewCount={liveRating?.reviewCount}
        hidePrices
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: pageFaqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />

    </>
  );
}
