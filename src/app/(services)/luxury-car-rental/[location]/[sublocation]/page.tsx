import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import {
  CITY_SUBLOCATIONS,
  getSubLocationStaticParams,
  getSubLocation,
  getCityNameFromSlug,
} from '@/data/city-sublocations';

interface PageProps {
  params: { location: string; sublocation: string };
}

export function generateStaticParams() {
  return getSubLocationStaticParams('luxury-car-rental');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('luxury-car-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Luxury Car Rental | TransRentals' };

  const title = `Luxury Car Rental in ${sl.name}, ${cityName} | BMW, Mercedes, Audi | TransRentals`;
  const description = `Rent luxury cars in ${sl.name}, ${cityName}. BMW, Mercedes, Audi, Range Rover, Rolls-Royce with professional chauffeur. Weddings, events & airport transfers.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/luxury-car-rental/${params.location}/${params.sublocation}` },
    openGraph: {
      title: `Luxury Car Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/luxury-car-rental/${params.location}/${params.sublocation}`,
      images: [{ url: `https://transrentals.in/api/og?service=luxury-car-rental&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Luxury Car Rental in ${sl.name}, ${cityName}`,
      description,
      images: [`https://transrentals.in/api/og?service=luxury-car-rental&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const LUXURY_FAQS = (slName: string, cityName: string) => [
  { q: `Which luxury cars are available in ${slName}, ${cityName}?`, a: `Mercedes E/S-Class, BMW 5/7 Series, Audi A6/A8, Jaguar XF, Range Rover, Rolls-Royce, Bentley, Ferrari, and Lamborghini are available in ${slName}. Our verified vendors in ${slName} maintain the latest models.` },
  { q: `How do I book a luxury car in ${slName}?`, a: `WhatsApp or call us with your trip details — occasion, date, duration, and pickup address in ${slName}. Vendors send customized quotes within 30 minutes. Accept the best quote and get doorstep delivery.` },
  { q: `Is chauffeur service available in ${slName}?`, a: `Yes, professional chauffeur service is standard with all luxury car rentals in ${slName}. Chauffeurs are trained, uniformed, and know ${slName} and ${cityName} routes well. Night driving available.` },
  { q: `What is the luxury car rental rate in ${slName}?`, a: `Mercedes E-Class starts from ₹8,000/day in ${slName}. BMW 7-Series from ₹12,000/day. Range Rover from ₹15,000/day. Rolls-Royce and exotic supercars from ₹25,000/day. Hourly packages from ₹2,500.` },
  { q: `Can I book a luxury car for a wedding in ${slName}?`, a: `Yes, wedding car rentals in ${slName} include decorated vehicles for baraat and reception. Vintage Rolls-Royce, Bentley, and Jaguar most popular for weddings. Book at least 2–3 weeks in advance.` },
];

export default function LuxurySubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('luxury-car-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['luxury-car-rental']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = LUXURY_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/luxury-car-rental" className="hover:text-primary">Luxury Car Rental</a>
            <span className="mx-2">/</span>
            <a href={`/luxury-car-rental/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-purple-900 via-purple-800 to-gray-900 border-b border-gray-700">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 text-sm font-medium px-3 py-1 rounded-full mb-4">
            <Crown className="w-4 h-4" /> Luxury Car Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Luxury Car Rental in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-purple-200 mb-6 max-w-2xl">{sl.description}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/luxury-car-rental/${params.location}`}
              className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              All Luxury Cars in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Luxury Cars Available in {sl.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Mercedes E-Class', type: 'Executive Sedan', price: 'From ₹8,000/day', tag: 'Most Popular' },
              { name: 'BMW 5 Series', type: 'Executive Sedan', price: 'From ₹9,000/day', tag: '' },
              { name: 'Audi A6', type: 'Executive Sedan', price: 'From ₹9,000/day', tag: '' },
              { name: 'Range Rover', type: 'Luxury SUV', price: 'From ₹15,000/day', tag: 'Wedding Favourite' },
              { name: 'Mercedes S-Class', type: 'Flagship Sedan', price: 'From ₹14,000/day', tag: 'Top Luxury' },
              { name: 'Rolls-Royce / Bentley', type: 'Ultra Luxury', price: 'From ₹25,000/day', tag: 'VVIP' },
            ].map((car) => (
              <div key={car.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                {car.tag && <div className="text-xs font-semibold text-purple-700 bg-purple-50 rounded-full px-2 py-0.5 mb-2 inline-block">{car.tag}</div>}
                <p className="font-bold text-gray-900">{car.name}</p>
                <p className="text-xs text-gray-500">{car.type} · With Chauffeur</p>
                <p className="text-purple-600 font-bold mt-2">{car.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-gray-50">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs — Luxury Car Rental in {sl.name}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Siblings */}
      {siblings.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="container-custom max-w-4xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Luxury Cars in Other Areas of {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/luxury-car-rental/${params.location}`} className="inline-flex items-center gap-1 px-4 py-2 bg-purple-700 text-white rounded-full text-sm font-medium hover:bg-purple-800 transition-colors">
                ← All Luxury Cars in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/luxury-car-rental/${params.location}/${s.slug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-purple-600 hover:text-purple-700 transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'AutoRental',
        name: `Luxury Car Rental in ${sl.name}, ${cityName} — TransRentals`,
        description: sl.description,
        url: `https://transrentals.in/luxury-car-rental/${params.location}/${params.sublocation}`,
        priceRange: '₹₹₹',
        areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        vehicleType: 'Luxury Car, Executive Sedan, SUV, Exotic Supercar',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Luxury Car Rental', item: 'https://transrentals.in/luxury-car-rental' },
          { '@type': 'ListItem', position: 3, name: `Luxury Car Rental in ${cityName}`, item: `https://transrentals.in/luxury-car-rental/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `Luxury Car Rental in ${sl.name}`, item: `https://transrentals.in/luxury-car-rental/${params.location}/${params.sublocation}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
