import { Metadata } from 'next';
import { stripPriceFromTitle, stripPricesFromText } from '@/lib/content/strip-prices';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { NearbyActiveCities } from '@/components/location/NearbyActiveCities';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceExpandingHero } from '@/components/services/ServiceExpandingHero';
import { ServiceLaunchBenefits } from '@/components/services/ServiceLaunchBenefits';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { prisma } from '@/lib/db/prisma';
import { getSelfDriveServiceId, getLocationId } from '@/lib/db/build-cache';
import Image from 'next/image';
import { MonthlyCarPlans } from '@/components/monthly-car-rental/MonthlyCarPlans';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import {
  Wallet, Wrench, ShieldCheck, RefreshCw, CheckCircle2, Receipt, Check,
  Briefcase, Palmtree, HardHat, GraduationCap, MessageCircleQuestion, Plus,
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
  // Fall back to a humanized slug for cities not in the curated list — otherwise
  // metadata is left without a description and inherits the generic site-wide
  // one from the root layout, producing mass duplicate meta descriptions.
  const locationName = city?.name ?? params.location.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`monthly-car-rental:${params.location.toLowerCase()}`),
    getServiceCityContent('monthly-car-rental', params.location),
  ]);
  return {
    title: stripPriceFromTitle(scContent?.metaTitle) || stripPriceFromTitle(_seoDb?.metaTitle) || `Monthly Car Rental in ${locationName} | Subscriptionk`,
    description: stripPricesFromText(scContent?.metaDescription) || stripPricesFromText(_seoDb?.metaDescription) || `Rent car monthly in ${locationName}. Car subscription service. Self-drive & chauffeur options.`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `monthly car rental ${locationName.toLowerCase()}`,
      `car subscription ${locationName.toLowerCase()}`,
      `car on monthly rent ${locationName.toLowerCase()}`,
      `long term car rental ${locationName.toLowerCase()}`,
      `monthly car lease ${locationName.toLowerCase()}`,
      `monthly self drive ${locationName.toLowerCase()}`,
      ...(city?.keywords || []).map(k => `monthly car ${k}`),
    ],
    openGraph: {
      title: `Monthly Car Rental in ${locationName} - Car Subscriptionk`,
      description: `Subscribe to cars monthly in ${locationName}. All-inclusive packages available.`,
      url: `https://transrentals.in/monthly-car-rental/${params.location.toLowerCase()}`,
    },
    alternates: {
      canonical: `https://transrentals.in/monthly-car-rental/${params.location.toLowerCase()}`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `Monthly Car Rental in ${locationName} | TransRentals`,
      description: `Rent car monthly in ${locationName}.`,
    },
  };
}

const EXPANDING_FAQS = [
  { question: 'How does a monthly car subscription work?', answer: 'You keep the car for a month or longer on a fixed plan that bundles insurance and servicing, with a set kilometre allowance. Self-drive and chauffeur options are both available.' },
  { question: 'When will monthly car rental open in my city?', answer: 'We onboard operators city by city and a city goes live as soon as verified operators are ready there. Until then you can book in the nearby cities listed above.' },
  { question: 'Can I extend or switch the car?', answer: 'Yes. Plans can be extended, and most operators allow a vehicle swap between cycles.' },
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
            <a href="/monthly-car-rental" className="hover:text-primary">Monthly Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>
        </div>
      </div>
      <ServiceExpandingHero cityName={cityName} serviceLabel="monthly car rentals" />
      <div id="nearby-cities" className="scroll-mt-4">
        <NearbyActiveCities
          currentCitySlug={citySlug}
          serviceSlug="monthly-car-rental"
          serviceName="Monthly Car Rental"
        />
      </div>
      <ServiceLaunchBenefits
        cityName={cityName}
        vehicleNoun="car"
        selectionDesc="Hatchbacks, sedans and SUVs on long-term self-drive or chauffeur plans."
      />
      <FAQSection service="monthly-car-rental" location={cityName} customFaqs={EXPANDING_FAQS} />
    </>
  );
}

export default async function MonthlyCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('monthly-car-rental', params.location, {
    comingSoonIfUnavailable: true,
    availabilityServiceSlug: 'car-rental',
  });
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="monthly-car-rental" serviceName="Monthly Car Rental" />;
  if (pageContext.type === 'coming-soon') {
    return <ExpandingCityPage cityName={pageContext.city.name} citySlug={params.location.toLowerCase()} />;
  }
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`monthly-car-rental:${params.location.toLowerCase()}`);

  const pageFaqs = [
    { question: 'What is included in the monthly car rental plan?', answer: 'Monthly car rental includes the car, driver (if applicable), insurance, maintenance, and a fixed km allowance per month. Fuel is extra.' },
    { question: 'Is a driver included in the monthly car rental?', answer: 'Both are available — self-drive plans, and chauffeur-included plans where a verified driver is assigned for the whole term. The operator quotes each separately by vehicle category.' },
    { question: 'Can I customize the km limit for monthly car rental?', answer: 'Yes, standard plans include 2500 km/month. Higher km packages (3500 km, 5000 km) are available at a marginal extra cost.' },
    { question: 'What happens if I exceed the monthly km limit?', answer: 'Kilometres beyond the plan allowance are billed per extra km at a rate the operator confirms in your quote, and it varies by vehicle category.' },
  ];

  // Fetch self-drive vehicle models for monthly plans
  const [selfDriveServiceId, locationId, scContent] = await Promise.all([
    getSelfDriveServiceId(),
    getLocationId(params.location),
    getServiceCityContent('monthly-car-rental', params.location),
  ]);

  const vehicleModels = selfDriveServiceId ? await prisma.vehicle_models.findMany({
    where: { serviceId: selfDriveServiceId, isActive: true },
    select: {
      id: true, name: true, sideImage: true, seatingCapacity: true,
      basePricePerDay: true, monthlyDiscount: true, isPopular: true, bodyType: true,
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

  const monthlyPlans = vehicleModels
    .map((m) => {
      const locationPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
      const basePrice = locationPrice ?? m.basePricePerDay ?? 0;
      const monthlyPrice = basePrice > 0
        ? Math.round(basePrice * 30 * (1 - (m.monthlyDiscount ?? 0) / 100))
        : 0;
      return { ...m, monthlyPrice };
    })
    .filter((m) => m.monthlyPrice > 0);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/monthly-car-rental" className="hover:text-primary">Monthly Car Rental</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      <SpecialtyCarBookingHero
        service="monthly"
        city={locationName}
        citySlug={params.location.toLowerCase()}
      />

      {/* Why Monthly Car */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Choose <span className="text-emerald-600">Monthly Car Rental</span> in {locationName}?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { icon: Wallet, title: 'Cost Effective', desc: `Affordable in ${locationName}` },
              { icon: Wrench, title: 'Zero Maintenance', desc: 'We handle servicing' },
              { icon: ShieldCheck, title: 'Fully Insured', desc: 'Complete coverage' },
              { icon: RefreshCw, title: 'Flexible', desc: '1-12+ months' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300"
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                    <feature.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Plans */}
      {monthlyPlans.length > 0 && (
        <MonthlyCarPlans plans={monthlyPlans} locationName={locationName} />
      )}

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            What&apos;s Included in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: CheckCircle2,
                title: 'Included',
                items: ['Vehicle for 30 days', 'Full maintenance', 'Insurance coverage', '24/7 assistance', 'Replacement if breakdown'],
              },
              {
                icon: Receipt,
                title: 'Extra Charges',
                items: ['Fuel (you pay)', 'Extra km beyond the allowance', 'Chauffeur (optional add-on)', 'Security deposit', 'Toll & parking'],
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

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect for Needs in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { occasion: 'Job Transfer', icon: Briefcase, desc: `Relocated to ${locationName}` },
              { occasion: 'Long Vacation', icon: Palmtree, desc: 'Extended stay' },
              { occasion: 'Project Work', icon: HardHat, desc: 'Temporary work' },
              { occasion: 'Students', icon: GraduationCap, desc: 'College semester' },
            ].map((item) => (
              <div
                key={item.occasion}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors duration-300">
                  <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.occasion}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Monthly Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {pageFaqs.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.question}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location.toLowerCase()}
              serviceSlug="monthly-car-rental"
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
            serviceType: 'Monthly Car Rental',
            name: `Monthly Car Rental in ${locationName}`,
            description: `Subscribe to cars monthly in ${locationName}. All-inclusive car subscription packages.`,
            areaServed: { '@type': 'City', name: locationName, addressCountry: 'IN' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 12000,
              highPrice: 60000,
              offerCount: 20,
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

      <RelatedServices
        locationSlug={params.location.toLowerCase()}
        parentSlug="car-rental"
        parentName="Car Rental with Driver"
        currentSlug="monthly-car-rental"
        siblings={[
          { slug: 'chauffeur-service', name: 'Chauffeur Service' },
          { slug: 'local-taxi', name: 'Local Taxi' },
          { slug: 'outstation-cab', name: 'Outstation Cab' },
          { slug: 'one-way-car-rental', name: 'One Way Car Rental' },
          { slug: 'outstation-car-rental', name: 'Outstation Car Rental' },
          { slug: 'monthly-car-rental', name: 'Monthly Car Rental' },
          { slug: 'corporate-car-rental', name: 'Corporate Car Rental' },
        ]}
      />

    </>
  );
}
