import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  return getSubLocationStaticParams('mini-truck-rental');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('mini-truck-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Mini Truck Rental | TransRentals' };

  const title = `Mini Truck Rental in ${sl.name}, ${cityName} | Tata Ace Hire | TransRentals`;
  const description = `Rent Tata Ace and mini trucks in ${sl.name}, ${cityName}. Local deliveries, house shifting & goods transport. Driver included. Starting ₹1,499/day.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/mini-truck-rental/${params.location}/${params.sublocation}` },
    openGraph: {
      title: `Mini Truck Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/mini-truck-rental/${params.location}/${params.sublocation}`,
      images: [{ url: `https://transrentals.in/api/og?service=mini-truck-rental&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Mini Truck Rental in ${sl.name}, ${cityName}`,
      description,
      images: [`https://transrentals.in/api/og?service=mini-truck-rental&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const TRUCK_FAQS = (slName: string, cityName: string) => [
  { q: `What is the mini truck rental rate in ${slName}, ${cityName}?`, a: `Tata Ace (mini truck) rental starts from ₹1,499/day with driver and fuel included for up to 100 km in ${slName}. Half-day (4-hour) packages from ₹799. Additional km charged at ₹15/km.` },
  { q: `What load can a mini truck carry in ${slName}?`, a: `Tata Ace handles 750 kg load capacity. Mahindra Pickup handles up to 1,000 kg. For heavier loads in ${slName}, we also have Bolero Pickup (1,200 kg) and Tata 407 (2,500 kg) available.` },
  { q: `Is the mini truck available for house shifting in ${slName}?`, a: `Yes, mini trucks are ideal for small household moves, apartment shifting, and single-room relocations within ${slName}. For full 2BHK moves, we recommend a combined truck + packers service.` },
  { q: `Do I get a driver with the mini truck in ${slName}?`, a: `Yes, all mini truck rentals in ${slName} include a verified driver. The driver is licensed, knows the local ${slName} routes, and handles loading/unloading coordination.` },
  { q: `Can I book a mini truck for just a few hours in ${slName}?`, a: `Yes, 4-hour packages available from ₹799 including driver and 40 km. Ideal for market runs, shop deliveries, and small house moves within ${slName}. Book at least 2 hours in advance.` },
];

export default function MiniTruckSubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('mini-truck-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['mini-truck-rental']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = TRUCK_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/mini-truck-rental" className="hover:text-primary">Mini Truck Rental</a>
            <span className="mx-2">/</span>
            <a href={`/mini-truck-rental/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-orange-50 to-red-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Mini Truck Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mini Truck Rental in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">{sl.description}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`https://wa.me/919737965551?text=Hi, I want to rent a mini truck in ${sl.name}, ${cityName}`}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              target="_blank" rel="noopener noreferrer"
            >
              Book on WhatsApp
            </a>
            <Link
              href={`/mini-truck-rental/${params.location}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-orange-600 hover:text-orange-700 transition-colors"
            >
              All Trucks in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mini Trucks Available in {sl.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Tata Ace', capacity: '750 kg', price: 'From ₹1,499/day', tag: 'Most Popular' },
              { name: 'Mahindra Jeeto', capacity: '750 kg', price: 'From ₹1,499/day', tag: '' },
              { name: 'Mahindra Pickup', capacity: '1,000 kg', price: 'From ₹1,799/day', tag: '' },
              { name: 'Tata 407', capacity: '2,500 kg', price: 'From ₹2,499/day', tag: 'Heavy Load' },
            ].map((truck) => (
              <div key={truck.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                {truck.tag && <div className="text-xs font-semibold text-orange-700 bg-orange-50 rounded-full px-2 py-0.5 mb-2 inline-block">{truck.tag}</div>}
                <p className="font-semibold text-gray-900 text-sm">{truck.name}</p>
                <p className="text-xs text-gray-500">{truck.capacity}</p>
                <p className="text-orange-600 font-bold mt-2 text-sm">{truck.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mini Truck Uses in {sl.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['📦 Local Deliveries', '🏠 House Shifting', '🏪 Shop Supplies', '🛒 E-commerce', '🏗️ Construction', '🍕 Food & Catering', '📚 Furniture', '♻️ Waste Disposal'].map((use) => {
              const [icon, label] = use.split(' ');
              return (
                <div key={label} className="bg-white p-4 rounded-xl border border-orange-100 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs — Mini Truck Rental in {sl.name}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 group">
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Mini Truck Rental in Other Areas of {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/mini-truck-rental/${params.location}`} className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-full text-sm font-medium hover:bg-orange-700 transition-colors">
                ← All Trucks in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/mini-truck-rental/${params.location}/${s.slug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-orange-600 hover:text-orange-700 transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name: `Mini Truck Rental in ${sl.name}, ${cityName} — TransRentals`,
        description: sl.description,
        url: `https://transrentals.in/mini-truck-rental/${params.location}/${params.sublocation}`,
        areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        priceRange: '₹₹',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Mini Truck Rental', item: 'https://transrentals.in/mini-truck-rental' },
          { '@type': 'ListItem', position: 3, name: `Mini Truck Rental in ${cityName}`, item: `https://transrentals.in/mini-truck-rental/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `Mini Truck Rental in ${sl.name}`, item: `https://transrentals.in/mini-truck-rental/${params.location}/${params.sublocation}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
