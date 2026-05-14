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
  return getSubLocationStaticParams('bus-rental');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('bus-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Bus Rental | TransRentals' };

  const title = `Bus Rental in ${sl.name}, ${cityName} | Tempo Traveller & Coach Hire | TransRentals`;
  const description = `Hire buses in ${sl.name}, ${cityName}. Tempo Traveller, mini bus, luxury coach for weddings, pilgrimages & corporate events. Verified operators.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/bus-rental/${params.location}/${params.sublocation}` },
    openGraph: {
      title: `Bus Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/bus-rental/${params.location}/${params.sublocation}`,
      images: [{ url: `https://transrentals.in/api/og?service=bus-rental&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bus Rental in ${sl.name}, ${cityName}`,
      description,
      images: [`https://transrentals.in/api/og?service=bus-rental&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const BUS_FAQS = (slName: string, cityName: string) => [
  { q: `How do I book a bus in ${slName}, ${cityName}?`, a: `Contact TransRentals via WhatsApp or call us with your trip details — date, group size, pickup address in ${slName}, and destination. We share quotes from verified operators within 30 minutes.` },
  { q: `What bus sizes are available in ${slName}?`, a: `Tempo Travellers (9–17 seater), mini buses (20–35 seater), and luxury coaches (45–55 seater) are available in ${slName}. Both AC and non-AC options available for all group sizes.` },
  { q: `What is the bus rental rate in ${slName}, ${cityName}?`, a: `Tempo Traveller starts from ₹18/km in ${slName}. Mini bus (20-seater) from ₹25/km. Luxury coach (45-seater) from ₹40/km. Local 8-hour packages also available from ₹3,500.` },
  { q: `Is driver included in bus hire in ${slName}?`, a: `Yes, all bus rentals include a professional, verified driver. For outstation trips from ${slName}, driver allowance (₹300–₹500/day) is charged separately. Drivers are licensed and route-experienced.` },
  { q: `Can I hire a bus in ${slName} for a wedding?`, a: `Yes, wedding baraat and guest transport buses are available in ${slName}. Decorated buses for baraat from ₹5,000. Book at least 3–4 weeks in advance for peak wedding season (Nov–Feb).` },
];

export default function BusSubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('bus-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['bus-rental']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = BUS_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/bus-rental" className="hover:text-primary">Bus Rental</a>
            <span className="mx-2">/</span>
            <a href={`/bus-rental/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-indigo-50 to-blue-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Bus Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bus Rental in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">{sl.description}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`https://wa.me/919737965551?text=Hi, I want to hire a bus in ${sl.name}, ${cityName}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              target="_blank" rel="noopener noreferrer"
            >
              Book on WhatsApp
            </a>
            <Link
              href={`/bus-rental/${params.location}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-700 transition-colors"
            >
              All Bus Rentals in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buses Available in {sl.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Tempo Traveller 12-Seater', type: 'AC', price: 'From ₹18/km', tag: 'Most Popular' },
              { name: 'Tempo Traveller 17-Seater', type: 'AC', price: 'From ₹22/km', tag: '' },
              { name: 'Mini Bus 20-Seater', type: 'AC / Non-AC', price: 'From ₹25/km', tag: 'Group Favourite' },
              { name: 'Mini Bus 32-Seater', type: 'AC / Non-AC', price: 'From ₹32/km', tag: '' },
              { name: 'Standard Bus 45-Seater', type: 'Non-AC', price: 'From ₹35/km', tag: 'Budget Pick' },
              { name: 'Luxury Coach 45-Seater', type: 'AC', price: 'From ₹40/km', tag: 'Premium' },
            ].map((bus) => (
              <div key={bus.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                {bus.tag && (
                  <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5 mb-2 inline-block">{bus.tag}</div>
                )}
                <p className="font-bold text-gray-900">{bus.name}</p>
                <p className="text-xs text-gray-500">{bus.type}</p>
                <p className="text-indigo-600 font-bold mt-2">{bus.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Rent Here */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Hire a Bus in {sl.name}?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '🚌', title: 'All Bus Sizes', desc: `9-seater Tempo to 55-seater Luxury Coach available in ${sl.name}` },
              { icon: '👨‍✈️', title: 'Driver Included', desc: 'Verified, licensed driver with route knowledge. Night driving allowed.' },
              { icon: '❄️', title: 'AC & Non-AC', desc: 'Full AC fleet for summer travel. Budget non-AC for short local trips.' },
              { icon: '✅', title: 'Verified Operators', desc: `All bus operators in ${sl.name} are background-checked and RTO-compliant` },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white p-5 rounded-xl border border-gray-100">
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs — Bus Rental in {sl.name}</h2>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Bus Rental in Other Areas of {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/bus-rental/${params.location}`} className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors">
                ← All Bus Rentals in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/bus-rental/${params.location}/${s.slug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-indigo-600 hover:text-indigo-700 transition-colors">
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
        name: `Bus Rental in ${sl.name}, ${cityName} — TransRentals`,
        description: sl.description,
        url: `https://transrentals.in/bus-rental/${params.location}/${params.sublocation}`,
        areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        priceRange: '₹₹',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
          { '@type': 'ListItem', position: 3, name: `Bus Rental in ${cityName}`, item: `https://transrentals.in/bus-rental/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `Bus Rental in ${sl.name}`, item: `https://transrentals.in/bus-rental/${params.location}/${params.sublocation}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
