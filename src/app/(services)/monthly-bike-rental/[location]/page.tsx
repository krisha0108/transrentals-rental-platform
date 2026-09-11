import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations, getAllCityLocations } from '@/lib/services/service-locations';;
import { capitalize } from '@/lib/utils';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { FAQSection } from '@/components/services/FAQSection';
import { BikeServiceSchema } from '@/components/seo/schemas';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';
import { RelatedServices } from '@/components/services/RelatedServices';
import { getServiceCityContent } from '@/lib/seo/service-city-content';
import { ServiceCitySections } from '@/components/seo/ServiceCitySections';
import {
  Wallet, Wrench, ShieldCheck, CalendarClock, RefreshCw, Home as HomeIcon,
  GraduationCap, Briefcase, Package, Building2, Bike as BikeIcon, Zap,
} from 'lucide-react';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params for all cities
// Generate static params from DATABASE - Only locations where bike-on-rent is available
export async function generateStaticParams() {
  return getAllCityLocations();
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

// Generate metadata for each location
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location.toLowerCase();

  const [_seoDb, scContent] = await Promise.all([
    resolvePageMeta(`monthly-bike-rental:${params.location}`),
    getServiceCityContent('monthly-bike-rental', params.location),
  ]);
  return {
    title: scContent?.metaTitle || _seoDb?.metaTitle || `Monthly Bike Rental in ${locationName} | @₹2999/Month`,
    description: scContent?.metaDescription || _seoDb?.metaDescription || `Rent bike or scooty on monthly basis in ${locationName}. Activa, Splendor, Pulsar, Royal Enfield available from ₹2999/month. Zero maintenance, doorstep delivery. Book now!`,
    keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
      `monthly bike rental ${locationName}`,
      `monthly bike rental in ${locationName}`,
      `scooty on rent monthly ${locationName}`,
      `bike on rent monthly ${locationName}`,
      `monthly activa rental ${locationName}`,
      `long term bike rental ${locationName}`,
      `bike subscription ${locationName}`,
      `monthly two wheeler ${locationName}`,
    ],
    openGraph: {
      title: `Monthly Bike Rental in ${locationName} @₹2999/Month | TransRentals`,
      description: `Rent bikes & scooters monthly in ${locationName}. Activa, Splendor, Pulsar available. Zero maintenance, flexible plans.`,
      type: 'website',
      url: `https://transrentals.in/monthly-bike-rental/${locationSlug}`,
      images: [
        {
          url: 'https://transrentals.in/images/og/monthly-bike-rental.jpg',
          width: 1200,
          height: 630,
          alt: `Monthly Bike Rental in ${locationName} - TransRentals`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Monthly Bike Rental in ${locationName} | TransRentals`,
      description: `Rent bikes & scooters monthly in ${locationName}. Starting @₹2999/month.`,
      images: ['https://transrentals.in/images/og/monthly-bike-rental.jpg'],
    },
    alternates: {
      canonical: `https://transrentals.in/monthly-bike-rental/${locationSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function MonthlyBikeRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('monthly-bike-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="monthly-bike-rental" serviceName="Monthly Bike Rental" />;
  const city = pageContext.city;
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  // Schema data
  const schemaFaqs = [
    { question: `How much does monthly bike rental cost in ${locationName}?`, answer: `Monthly bike rental in ${locationName} starts from ₹2,999/month for scooters like Activa. Commuter bikes cost ₹3,999-4,999/month, and Royal Enfield costs ₹9,999-14,999/month.` },
    { question: `What bikes are available for monthly rent in ${locationName}?`, answer: `We have Honda Activa, TVS Jupiter, Hero Splendor, Bajaj Pulsar, Yamaha FZ, and Royal Enfield available for monthly rental in ${locationName}.` },
    { question: `Is there home delivery for monthly bike rental in ${locationName}?`, answer: `Yes, we provide doorstep delivery across ${locationName}. Bikes are delivered within 24 hours of booking confirmation.` },
    { question: `What documents are needed for monthly bike rental in ${locationName}?`, answer: 'You need a valid driving license (minimum 6 months old), Aadhar card, and a refundable security deposit (₹3,000-10,000 depending on bike type).' },
    { question: `Can I extend my monthly bike rental in ${locationName}?`, answer: 'Yes, you can extend month by month. Long-term rentals (3+ months) get discounted rates up to 15% off.' },
  ];

  const schemaVehicles = [
    { name: 'Honda Activa 6G', brand: 'Honda', price: 2999, image: 'https://transrentals.in/images/fleet/honda-activa-6g.jpg', description: `Rent Honda Activa 6G on monthly basis in ${locationName} — India's most popular scooter with 109cc engine, 50 kmpl mileage, LED headlight, and 21-litre storage. Monthly plan includes zero maintenance, free servicing, insurance, and doorstep delivery. Best scooter for daily commuting in ${locationName}. From ₹2999/month.` },
    { name: 'TVS Jupiter', brand: 'TVS', price: 3499, image: 'https://transrentals.in/images/scooters/jupiter.jpg', description: `Rent TVS Jupiter on monthly basis in ${locationName} — spacious family scooter with 110cc engine, 50+ kmpl mileage, 22-litre underseat storage, and extra-wide seat. Monthly rental with zero maintenance and free helmet. Ideal for families and working professionals in ${locationName}. Starting from ₹3499/month.` },
    { name: 'Hero Splendor Plus', brand: 'Hero', price: 3999, image: 'https://transrentals.in/images/fleet/hero-splendor-plus.jpg', description: `Rent Hero Splendor Plus on monthly basis in ${locationName} — India's highest-selling commuter bike with 97.2cc engine and 65+ kmpl mileage. Monthly subscription includes free maintenance, servicing, and doorstep delivery in ${locationName}. Most fuel-efficient commuter bike. Plans from ₹3999/month.` },
    { name: 'Bajaj Pulsar 150', brand: 'Bajaj', price: 4999, image: 'https://transrentals.in/images/fleet/bajaj-pulsar-150.jpg', description: `Rent Bajaj Pulsar 150 on monthly basis in ${locationName} — sporty commuter with 149.5cc twin-spark engine, 14 PS power, disc brake, and 50+ kmpl mileage. Monthly plan with zero maintenance cost, insurance, and helmet included. Perfect for sporty daily commuting in ${locationName}. From ₹4999/month.` },
    { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 9999, image: 'https://transrentals.in/images/fleet/default-bike.jpg', description: `Rent Royal Enfield Classic 350 on monthly basis in ${locationName} — iconic 349cc heritage cruiser with 35+ kmpl mileage, dual-channel ABS, and timeless styling. Premium monthly rental with full insurance, maintenance, and doorstep delivery in ${locationName}. For long-term biking enthusiasts. From ₹9999/month.` },
  ];

  const [seoData, scContent] = await Promise.all([
    resolvePageMeta(`monthly-bike-rental:${params.location}`),
    getServiceCityContent('monthly-bike-rental', params.location),
  ]);

  const pageFaqs = [
    { question: 'What is included in the monthly bike rental plan?', answer: 'Monthly plans include the bike, helmet, insurance, and free maintenance. You only pay for fuel — no hidden charges.' },
    { question: 'Can I switch bikes during my monthly rental period?', answer: 'Yes, bike switching is allowed once per month at no extra cost. Subject to availability of the requested model.' },
    { question: 'Is there a minimum rental period for monthly plans?', answer: 'The minimum period is 30 days. You can subscribe for 1, 3, or 6 months with increasing discounts for longer commitments.' },
    { question: 'What happens if the bike breaks down during my monthly rental?', answer: 'We provide free doorstep maintenance and repair. If the bike is off-road for more than 24 hours, we provide a replacement bike at no cost.' },
  ];

  return (
    <>
      
      {/* DEPRECATED — admin block editor now manages this content
      <CityContentSection
              citySlug={params.location}
              serviceSlug="monthly-bike-rental"
              cityName={locationName}
              stateCode={city?.stateCode}
            />
      */}

      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName={`Monthly Bike Rental in ${locationName}`}
        serviceSlug="monthly-bike-rental"
        description={`Rent bikes and scooters on monthly basis in ${locationName}. Activa, Splendor, Pulsar, Royal Enfield available. Starting @₹2999/month.`}
        city={locationName}
        citySlug={params.location}
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 2999, max: 14999 }}
        rating={4.7}
        reviewCount={412}
      />

      <BikeSearchHero
        city={locationName}
        citySlug={params.location}
        pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}
        pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}
      />

      {/* Quick facts */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Monthly Bike Rental in <span className="text-emerald-600">{locationName}</span>
              </h2>
              <p className="text-gray-500 mt-1.5">Long term bike &amp; scooty subscription, starting @₹2,999/month.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <BikeIcon className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Fleet</p>
                  <p className="text-lg font-black text-gray-900">50+ Bikes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Delivery</p>
                  <p className="text-lg font-black text-gray-900">Within 24hr</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href="#plans"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View Monthly Plans
            </Link>
            <Link
              href={`/bike-on-rent/${params.location}`}
              className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
            >
              Daily Rental Options
            </Link>
          </div>
        </div>
      </section>

      {/* Monthly Plans */}
      <section id="plans" className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-3">
            Monthly Bike Rental Plans in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Choose from scooters, commuter bikes, sports bikes, or premium bikes
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Scooter',
                bikes: 'Activa, Jupiter, Access, Dio',
                price: '2,999',
                km: '1500 km/month',
                deposit: '₹3,000',
                features: ['Automatic transmission', 'Easy to ride', 'Fuel efficient', 'Storage space'],
                popular: true,
              },
              {
                category: 'Commuter Bike',
                bikes: 'Splendor, Shine, Pulsar 125',
                price: '3,999',
                km: '2000 km/month',
                deposit: '₹4,000',
                features: ['Manual transmission', 'High mileage', 'Reliable', 'Low maintenance'],
                popular: false,
              },
              {
                category: 'Sports Bike',
                bikes: 'FZ, Duke 200, Apache, Pulsar',
                price: '5,999',
                km: '1500 km/month',
                deposit: '₹7,000',
                features: ['Powerful engine', 'Sporty design', 'Good performance', 'Thrilling ride'],
                popular: false,
              },
              {
                category: 'Royal Enfield',
                bikes: 'Classic 350, Meteor, Hunter',
                price: '9,999',
                km: '2000 km/month',
                deposit: '₹10,000',
                features: ['Iconic brand', 'Touring ready', 'Premium feel', 'Road presence'],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.category}
                className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-lg transition-all relative ${plan.popular ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-100'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.category}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.bikes}</p>
                <p className="text-3xl font-bold text-emerald-700">₹{plan.price}</p>
                <p className="text-sm text-gray-500 mb-4">/month</p>
                <ul className="space-y-2 mb-4 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
                  <p>KM Limit: {plan.km}</p>
                  <p>Deposit: {plan.deposit} (refundable)</p>
                </div>
                <button className="w-full mt-4 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Monthly Rental */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Monthly Bike Rental in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {[
              { Icon: Wallet, title: 'Save 40% vs Daily', desc: `Monthly rental in ${locationName} costs significantly less than daily rates. Perfect for long stays.` },
              { Icon: Wrench, title: 'Zero Maintenance', desc: 'Free servicing, repairs, and breakdown assistance included. We handle everything.' },
              { Icon: HomeIcon, title: 'Doorstep Delivery', desc: `Bike delivered to your address in ${locationName} within 24 hours. Pickup also available.` },
              { Icon: ShieldCheck, title: 'Fully Insured', desc: 'Comprehensive insurance coverage included. Ride worry-free.' },
              { Icon: CalendarClock, title: 'Flexible Duration', desc: 'Rent for 1 month to 12+ months. Extend or cancel anytime.' },
              { Icon: RefreshCw, title: 'Free Replacement', desc: 'If your bike breaks down, we provide a replacement within hours.' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `mbr-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.Icon className="w-6 h-6 text-emerald-600 transition-colors duration-500 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes mbr-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="mbr-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Perfect For Section */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Who Rents Monthly in <span className="text-emerald-600">{locationName}</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {[
              { Icon: GraduationCap, title: 'Students', desc: 'College semester rentals' },
              { Icon: Briefcase, title: 'Professionals', desc: 'Daily office commute' },
              { Icon: Package, title: 'Delivery Partners', desc: 'Zomato, Swiggy, Amazon' },
              { Icon: Building2, title: 'Job Transfers', desc: 'Temporary relocations' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `mbr-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.Icon className="w-6 h-6 text-emerald-600 transition-colors duration-500 group-hover:text-white" />
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            How to Rent Bike Monthly in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { step: '1', title: 'Choose Your Bike', desc: 'Select scooter or bike type and monthly plan' },
              { step: '2', title: 'Submit Documents', desc: 'Upload driving license and Aadhar card' },
              { step: '3', title: 'Pay & Confirm', desc: 'Pay first month rent + refundable deposit' },
              { step: '4', title: 'Get Delivered', desc: `Bike delivered to your ${locationName} address in 24hrs` },
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

      <FAQSection service="monthly-bike-rental" location={locationName} customFaqs={pageFaqs} />

      {/* Related Services */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Other Bike Services in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { href: `/bike-on-rent/${params.location}`, Icon: BikeIcon, title: 'Daily Bike Rental', desc: 'Rent by day or week. From ₹299/day' },
              { href: `/activa-on-rent/${params.location}`, Icon: Zap, title: 'Activa on Rent', desc: 'Scooters for easy city rides. From ₹299/day' },
              { href: `/royal-enfield-on-rent/${params.location}`, Icon: BikeIcon, title: 'Royal Enfield Rental', desc: 'Bullet, Classic 350, Himalayan. From ₹599/day' },
            ].map((opt) => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group flex flex-col items-center text-center bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-8 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <opt.Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{opt.title}</h3>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All editable SEO content — block-based sectionsConfig from admin */}
      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />

      <RelatedServices
        locationSlug={params.location}
        parentSlug="bike-on-rent"
        parentName="Bike Rental"
        currentSlug="monthly-bike-rental"
        siblings={[
          { slug: 'activa-on-rent', name: 'Activa on Rent' },
          { slug: 'royal-enfield-on-rent', name: 'Royal Enfield' },
          { slug: 'ktm-on-rent', name: 'KTM on Rent' },
          { slug: 'pulsar-on-rent', name: 'Pulsar on Rent' },
          { slug: 'apache-on-rent', name: 'Apache on Rent' },
          { slug: 'splendor-on-rent', name: 'Splendor on Rent' },
          { slug: 'himalayan-on-rent', name: 'Himalayan on Rent' },
          { slug: 'monthly-bike-rental', name: 'Monthly Bike Rental' },
          { slug: 'electric-scooter-rental', name: 'Electric Scooter' },
        ]}
      />
    </>
  );
}
