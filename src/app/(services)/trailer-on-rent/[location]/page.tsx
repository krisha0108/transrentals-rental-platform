import { notFound } from 'next/navigation';
import { LocationHighlights } from '@/components/location/LocationHighlights';
import { cities } from '@/data/cities';
import type { Metadata } from 'next';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';

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
    alternates: { canonical: `https://transrentals.in/trailer-on-rent/${params.location}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Trailer on Rent in ${location.name} | TransRentals`,
      description: `Rent heavy duty trailers in ${location.name} starting @₹5999/day for cargo transportation.`,
    },
  };
}

export default async function TrailerLocationPage({ params }: Props) {
  const pageContext = await resolveServicePage('trailer-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
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

  const seoData = await resolvePageMeta(`trailer-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'What sizes of trailers are available on rent?', answer: 'We offer 20ft, 32ft, and 40ft flatbed and lowbed trailers for heavy cargo, machinery, and construction equipment transport.' },
    { question: 'What is the load capacity of the rental trailer?', answer: 'Flatbed trailers handle up to 25 tons; lowbed trailers up to 40 tons. All trailers come with all-India permits and valid insurance.' },
    { question: 'Is an experienced driver included in the trailer rental?', answer: 'Yes, all trailers come with experienced heavy-vehicle drivers licensed for transport of oversized and overweight cargo.' },
    { question: 'Can I rent a trailer for interstate transport of machinery?', answer: 'Yes, our trailers have all-India permits for interstate movement. Route survey and escort vehicles can be arranged for oversized loads.' },
  ];

  return (
    <>
      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Trailer Rental in ${location.name}`}
        title="Trailer on Rent"
        titleHighlight="Heavy Cargo @₹5999/day"
        description={`Move the heaviest loads from ${location.name}. Flatbed, lowbed, and container trailers for industrial equipment, construction machinery, and oversized cargo transport.`}
        features={[
          { icon: 'zap', text: 'Up to 40-Ton Capacity', color: 'text-red-700' },
          { icon: 'shield', text: 'All-India Permits', color: 'text-emerald-600' },
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="red-50"
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
      <BikeServiceSchema
        serviceName="Trailer on Rent"
        serviceSlug="trailer-on-rent"
        description={`Rent heavy duty trailers in ${location.name} starting @₹5999/day for cargo transportation.`}
        city={location.name}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
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
