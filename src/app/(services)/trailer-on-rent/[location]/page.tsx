import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { LocationHighlights } from '@/components/location/LocationHighlights';
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
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';

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
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Trailer on Rent in ${location.name} - Heavy Duty Trailer Rental | TransRentals`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent trailers in ${location.name} for heavy cargo transportation. 20ft to 40ft trailers available. Best rates guaranteed. Book now!`,
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
      description: `Rent heavy duty trailers in ${location.name} starting @₹5999/day for cargo transportation.`,
    },
  };
}

export default async function TrailerLocationPage({ params }: Props) {
  const pageContext = await resolveServicePage('trailer-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
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

  return (
    <>
      <TrailerBookingHero
        city={location.name}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
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
        serviceName="Trailer on Rent"
        serviceSlug="trailer-on-rent"
        description={`Rent heavy duty trailers in ${location.name} starting @₹5999/day for cargo transportation.`}
        city={location.name}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={location.name} />

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
