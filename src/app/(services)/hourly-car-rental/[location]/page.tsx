import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';
import { FAQSection } from '@/components/services/FAQSection';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { HourlyCarBookingHero } from '@/components/hourly-car-rental/HourlyCarBookingHero';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import { Car, Plane, Route as RouteIcon, ArrowRight } from 'lucide-react';

interface PageProps { params: { location: string }; }

export async function generateStaticParams() {
  return getAllCityLocations();
}

export const revalidate = 43200; // 12 hours
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const [seoDb, scContent] = await Promise.all([
    resolvePageMeta(`hourly-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('hourly-car-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || seoDb?.metaTitle || `Hourly Car Rental in ${locationName} | Book with Driver | TransRentals`,
    description: scContent?.metaDescription || seoDb?.metaDescription || `Book hourly cab in ${locationName} with driver. Packages starting from 2 hrs. Driver + fuel included.`,
    alternates: { canonical: `https://transrentals.in/hourly-car-rental/${params.location.toLowerCase()}` },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Hourly Car Rental in ${locationName} | TransRentals`,
      description: `Book hourly cab in ${locationName} with driver. Packages starting from ₹149/hr.`,
    },
  };
}

export default async function HourlyCarLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('hourly-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return (
    <StateServicePage
      state={pageContext.state}
      activeCities={pageContext.activeCities}
      serviceSlug="hourly-car-rental"
      serviceName="Hourly Car Rental"
    />
  );
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`hourly-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('hourly-car-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'What is the minimum hourly booking for a car with driver?', answer: 'The minimum booking is 2 hours, covering up to 20 km. Additional km are charged at ₹12–₹18/km depending on the car category.' },
    { question: 'Is the driver included in the hourly car rental rate?', answer: 'Yes, a professional driver is always included. The rate covers driver charges, fuel, and tolls within city limits.' },
    { question: 'Can I extend my hourly car rental booking mid-trip?', answer: 'Yes, you can extend by calling our support. Extension charges apply per hour at the same rate as the original booking.' },
    { question: 'Which cars are available for hourly rental?', answer: 'We offer Dzire, Etios (Sedan), Swift (Hatchback), Ertiga (MUV), and Innova (SUV) for hourly city packages.' },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-gray-100 py-3">
        <div className="container-custom">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hourly-car-rental" className="hover:text-blue-700">Hourly Car Rental</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{locationName}</span>
          </nav>
        </div>
      </section>

      {/* Hero with live packages from admin */}
      <HourlyCarBookingHero cityName={locationName} citySlug={params.location.toLowerCase()} />

      {/* Other options */}
      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 text-center mb-10">
            More Options in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: `/self-drive-car-rentals/${params.location.toLowerCase()}`, icon: Car, title: 'Daily Self-Drive', desc: 'From ₹799/day' },
              { href: '/airport-transfer', icon: Plane, title: 'Airport Transfer', desc: 'From ₹499' },
              { href: `/outstation-car-rental/${params.location.toLowerCase()}`, icon: RouteIcon, title: 'Outstation', desc: 'From ₹12/km' },
              { href: '/one-way-cab', icon: RouteIcon, title: 'One Way Cab', desc: 'Fixed fare' },
            ].map((opt) => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group flex flex-col items-center text-center bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-8 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <opt.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{opt.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {opt.desc}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="hourly-car-rental"
              cityName={locationName}
              stateCode={undefined}
            />
      */}
      <BikeServiceSchema
        serviceName="Hourly Car Rental"
        serviceSlug="hourly-car-rental"
        description={`Book hourly cab in ${locationName} with driver. Packages starting from ₹149/hr.`}
        city={locationName}
        citySlug={params.location.toLowerCase()}
        faqs={[]}
        rating={4.6}
        reviewCount={1124}
      />

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <FAQSection service="hourly-car-rental" location={locationName} customFaqs={pageFaqs} />

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="self-drive-car-rentals"
        parentName="Self Drive Car Rental"
        currentSlug="hourly-car-rental"
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
