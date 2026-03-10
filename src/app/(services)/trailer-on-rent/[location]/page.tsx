import { permanentRedirect } from 'next/navigation';
import { LocationHighlights } from '@/components/location/LocationHighlights';
import { cities } from '@/data/cities';
import type { Metadata } from 'next';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

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

  const _seoDb = await resolvePageMeta(`trailer-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Trailer on Rent in ${location.name} - Heavy Duty Trailer Rental | TransRentals`,
    description: _seoDb?.metaDescription || `Rent trailers in ${location.name} for heavy cargo transportation. 20ft to 40ft trailers available. Best rates guaranteed. Book now!`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `trailer on rent in ${location.name}`,
      `${location.name} trailer rental`,
      `heavy trailer ${location.name}`,
      `cargo trailer rent ${location.name}`,
    ],
  };
}

export default async function TrailerLocationPage({ params }: Props) {
  const pageContext = await resolveServicePage('trailer-on-rent', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="trailer-on-rent" serviceName="Trailer on Rent" />;
  const city = pageContext.city;

  const location = cities.find(
    (city) => city.slug === params.location.toLowerCase()
  )!;

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

  const seoData = await resolvePageMeta(`trailer-on-rent:${params.location}`);


  return (
    <>
      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Trailer Rental in ${location.name}`}
        title="Heavy Duty Trailer Rental"
        titleHighlight="20ft-40ft Trailers @₹5999/day"
        description={`Rent heavy duty trailers in ${location.name} for cargo transportation. 20ft to 40ft trailers with professional drivers and 24/7 support.`}
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Heavy Duty', color: 'text-stone-600' },
          { icon: 'zap', text: '24/7 Support', color: 'text-gray-600' },
        ]}
        gradientFrom="stone-50"
        gradientTo="gray-50"
      />

      <LocationHighlights
        location={location.name}
        service="Trailer Rental"
        highlights={highlights}
      />

      <CityContentSection
        citySlug={params.location}
        serviceSlug="trailer-on-rent"
        cityName={location.name}
        stateCode={undefined}
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
