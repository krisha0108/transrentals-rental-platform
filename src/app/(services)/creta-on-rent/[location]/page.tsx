import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { BikeServiceSchema } from '@/components/seo/schemas';
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
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  const _seoDb = await resolvePageMeta(`creta-on-rent:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Creta on Rent in ${locationName} | Rent Creta @₹1999/Day | TransRentals`,
    description: _seoDb?.metaDescription || `Rent Hyundai Creta without driver in ${locationName}. Self-drive Creta rental for family trips & outstation. Creta E, S, SX, SX(O) AT available.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `creta on rent ${locationName}`,
      `hyundai creta rental ${locationName}`,
      `rent creta without driver ${locationName}`,
      `creta self drive ${locationName}`,
    ],
    openGraph: {
      title: `Creta on Rent in ${locationName} @₹1999/Day | TransRentals`,
      description: `Self-drive Hyundai Creta rental in ${locationName}. Best rates guaranteed.`,
      type: 'website',
      url: `https://transrentals.in/creta-on-rent/${locationSlug}`,
    },
    alternates: {
      canonical: `https://transrentals.in/creta-on-rent/${locationSlug}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Creta on Rent in ${locationName} | TransRentals`,
      description: `Rent Hyundai Creta without driver in ${locationName} starting @₹1499/day.`,
    },
  };
}


export default async function CretaOnRentLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('creta-on-rent', params.location);
  if (pageContext.type === 'redirect') notFound();
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="creta-on-rent" serviceName="Creta on Rent" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const seoData = await resolvePageMeta(`creta-on-rent:${params.location}`);

  const pageFaqs = [
    { question: 'Is Hyundai Creta available in automatic transmission for self-drive?', answer: 'Yes, Creta is available in both 6-speed manual and DCT automatic. Automatic is recommended for city driving.' },
    { question: 'What is the daily rental price for Hyundai Creta?', answer: 'Hyundai Creta self-drive rental starts from ₹1499/day for manual and ₹1799/day for automatic, including insurance.' },
    { question: 'What is the km limit per day for Creta rental?', answer: 'Standard packages include 250 km/day. Unlimited km packages are available for ₹400 extra per day.' },
    { question: 'Is the Creta suitable for a family road trip of 5 people?', answer: 'Yes, Creta comfortably seats 5 adults with ample boot space. Ideal for weekend getaways and 3–5 day road trips.' },
  ];

  return (
    <>
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/creta-on-rent" className="hover:text-blue-700">Creta on Rent</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Creta Rental in ${locationName}`}
        title="Hyundai Creta on Rent"
        titleHighlight="#1 SUV in India @₹1499/day"
        description={`India's best-selling SUV, self-drive in ${locationName}. Creta's panoramic sunroof, ADAS safety tech, and premium cabin make every kilometre worth it.`}
        features={[
          { icon: 'zap', text: 'Panoramic Sunroof', color: 'text-blue-600' },
          { icon: 'shield', text: 'ADAS Safety', color: 'text-emerald-600' },
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
        ]}
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      />

      <section className="bg-gradient-to-br from-blue-700 to-cyan-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Creta on Rent in {locationName}
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Self-drive Hyundai Creta rental. Premium SUV for family trips & outstation.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Starting from</p>
              <p className="text-xl font-bold">₹1,999</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Seating</p>
              <p className="text-xl font-bold">5 Seats</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <p className="text-xs opacity-75">Variants</p>
              <p className="text-xl font-bold">5 Options</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">
            Other SUVs in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={`/self-drive-suv-rental/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All SUVs</h3>
              <p className="text-sm text-gray-600 mt-2">Seltos, Scorpio, XUV700</p>
            </Link>
            <Link href={`/fortuner-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Fortuner on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹4,999/day</p>
            </Link>
            <Link href={`/innova-on-rent/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Innova on Rent</h3>
              <p className="text-sm text-gray-600 mt-2">From ₹2,499/day</p>
            </Link>
            <Link href={`/self-drive-car-rentals/${params.location}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">All Self Drive Cars</h3>
              <p className="text-sm text-gray-600 mt-2">View all options</p>
            </Link>
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="creta-on-rent"
        cityName={locationName}
        stateCode={undefined}
      />
      <FAQSection service="self-drive-car-rental" location={locationName} customFaqs={pageFaqs} />
      <BikeServiceSchema
        serviceName="Creta on Rent"
        serviceSlug="creta-on-rent"
        description={`Rent Hyundai Creta without driver in ${locationName} starting @₹1499/day.`}
        city={locationName}
        citySlug={params.location}
        faqs={[]}
      />
      <RelatedServices
        locationSlug={params.location}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="creta-on-rent"
        siblings={[
          { slug: 'hourly-car-rental', name: 'Hourly Car Rental' },
          { slug: 'self-drive-suv-rental', name: 'Self Drive SUV' },
          { slug: 'self-drive-sedan-rental', name: 'Self Drive Sedan' },
          { slug: 'self-drive-hatchback-rental', name: 'Self Drive Hatchback' },
          { slug: 'swift-on-rent', name: 'Swift on Rent' },
          { slug: 'creta-on-rent', name: 'Creta on Rent' },
          { slug: 'innova-on-rent', name: 'Innova on Rent' },
          { slug: 'fortuner-on-rent', name: 'Fortuner on Rent' },
          { slug: 'seltos-on-rent', name: 'Seltos on Rent' },
          { slug: 'xuv700-on-rent', name: 'XUV700 on Rent' },
          { slug: 'scorpio-on-rent', name: 'Scorpio on Rent' },
        ]}
      />
    </>
  );
}
