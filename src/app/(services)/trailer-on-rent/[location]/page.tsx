import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { LocationHighlights } from '@/components/location/LocationHighlights';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { cities } from '@/data/cities';
import type { Metadata } from 'next';
import { TrailerBookingHero } from '@/components/services/trailer/TrailerBookingHero';
import { TrailerTypes } from '@/components/services/trailer/TrailerTypes';
import { TrailerBookingProcess } from '@/components/services/trailer/TrailerBookingProcess';
import { TrailerFAQ } from '@/components/services/trailer/TrailerFAQ';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections, hasSectionMatching } from '@/components/seo/ServiceCitySections';
import { FAQSection } from '@/components/services/FAQSection';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';

interface Props {
  params: { location: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = cities.find(
    (city) => city.slug === params.location.toLowerCase()
  );

  if (!location) {
    return {
      title: 'Trailer on Rent | TransRentals',
    };
  }

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`trailer-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('trailer-on-rent', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Trailer on Rent in ${location.name} - Heavy Duty Trailer Rental | TransRentals`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent trailers in ${location.name} for heavy cargo transportation. 20ft to 40ft trailers available. Best rates guaranteed. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `trailer on rent in ${location.name}`,
      `${location.name} trailer rental`,
      `heavy trailer ${location.name}`,
      `cargo trailer rent ${location.name}`,
    ],
    alternates: { canonical: `https://transrentals.in/trailer-on-rent/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Trailer on Rent in ${location.name} | TransRentals`,
      description: `Rent heavy duty trailers in ${location.name} for cargo transportation — 20ft to 40ft.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'What trailer sizes are available?', answer: 'Flatbed and container trailers from 20ft to 40ft, for heavy machinery, industrial cargo and bulk consignments.' },
  { question: 'When will trailer rental open in my city?', answer: 'We onboard transporters city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Is a driver included?', answer: 'Yes, every trailer on TransRentals comes with an experienced driver licensed for heavy vehicles.' },
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
            <a href="/trailer-on-rent" className="hover:text-primary">Trailer on Rent</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="trailer rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="trailer-on-rent"
          serviceName="Trailer on Rent"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="trailer"
        selectionDesc="20ft to 40ft flatbed and container trailers for heavy cargo."
      />
      <FAQSection service="trailer-on-rent" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function TrailerLocationPage({ params }: Props) {
  const pageContext = await resolveServicePage('trailer-on-rent', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'transporter',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="trailer-on-rent" serviceName="Trailer on Rent" />;
  const city = pageContext.city;

  const location = cities.find(
    (city) => city.slug === params.location.toLowerCase()
  );

  if (!location) return null;

  const highlights = [
    {
      title: '20ft to 40ft Trailers',
      description: 'Wide range of trailer sizes for all cargo needs',
    },
    {
      title: 'Heavy Duty Capacity',
      description: 'Transport heavy machinery and cargo safely',
    },
    {
      title: 'Professional Drivers',
      description: 'Experienced drivers for safe transportation',
    },
    {
      title: '24/7 Support',
      description: 'Round the clock customer support',
    },
  ];

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`trailer-on-rent:${params.location.toLowerCase()}`),
    getServiceCityContent('trailer-on-rent', params.location),
  ]);

  // The admin block editor renders its own Why Us / Other Services / FAQ
  // blocks. Where the city has one, the hardcoded section below is skipped
  // so the page doesn't say the same thing twice.
  const adminCoversWhyUs = hasSectionMatching(scContent?.sectionsConfig, /why[-\s_]?(choose|rent|us)/i);
  const adminCoversOtherServices = hasSectionMatching(scContent?.sectionsConfig, /services?[-\s_]?(offered|available)|other[-\s_]?services/i);
  const adminCoversFaqs = hasSectionMatching(scContent?.sectionsConfig, /faq/i);

  return (
    <>
      <TrailerBookingHero
        city={location.name}
        citySlug={params.location}
        pageHeading={stripPricesFromText(scContent?.pageHeading || seoData?.pageHeading) || undefined}
        pageDescription={stripPricesFromText(scContent?.pageDescription || seoData?.pageDescription) || undefined}
      />

      <LocationHighlights
        location={location.name}
        service="Trailer Rental"
        highlights={highlights}
      />

      <TrailerTypes />
      <TrailerBookingProcess />
      <TrailerFAQ />

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="trailer-on-rent"
              cityName={location.name}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        hidePrices
        serviceName="Trailer on Rent"
        serviceSlug="trailer-on-rent"
        description={`Rent heavy duty trailers in ${location.name} for cargo transportation — 20ft to 40ft.`}
        city={location.name}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={location.name} hidePrices />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="transporter"
        parentName="Truck & Tempo Rental"
        currentSlug="trailer-on-rent"
        siblings={[
          { slug: 'mini-truck-rental', name: 'Mini Truck Rental' },
          { slug: 'trailer-on-rent', name: 'Trailer on Rent' },
        ]}
      />
    </>
  );
}

// Generate static paths for all cities
export async function generateStaticParams() {
  return cities.map((city) => ({
    location: city.slug,
  }));
}
