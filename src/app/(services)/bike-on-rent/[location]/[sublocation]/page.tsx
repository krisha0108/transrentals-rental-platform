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
  return getSubLocationStaticParams('bike-on-rent');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('bike-on-rent', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Bike Rental | TransRentals' };

  const title = `Bike Rental in ${sl.name}, ${cityName} | Starting ₹299/Day | TransRentals`;
  const description = `Rent bikes in ${sl.name}, ${cityName}. Honda Activa, Royal Enfield, KTM & more. Doorstep delivery available. Best prices guaranteed.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://transrentals.in/bike-on-rent/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
    },
    openGraph: {
      title: `Bike Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/bike-on-rent/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
      images: [{ url: `https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bike Rental in ${sl.name}, ${cityName}`,
      description,
      images: [`https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const BIKE_FAQS = (slName: string, cityName: string) => [
  {
    q: `Where can I rent a bike in ${slName}, ${cityName}?`,
    a: `TransRentals has verified bike rental vendors serving ${slName}. Most vendors offer doorstep delivery to your address in ${slName} within 1–2 hours of booking. You can also pick up from the nearest vendor location.`,
  },
  {
    q: `What is the cost of bike rental in ${slName}?`,
    a: `Scooters (Honda Activa, TVS Jupiter) start from ₹299/day in ${slName}. Commuter bikes (Bajaj Pulsar, Hero Splendor) start from ₹399/day. Royal Enfield rentals start from ₹799/day. Weekly and monthly packages offer 10–30% discount.`,
  },
  {
    q: `What documents are required to rent a bike in ${slName}?`,
    a: `You need a valid driving licence (with MCWG/LMV endorsement for bikes above 50cc), any government photo ID (Aadhaar/Passport), and a refundable security deposit of ₹1,500–₹3,000 depending on the bike model.`,
  },
  {
    q: `Is doorstep bike delivery available in ${slName}?`,
    a: `Yes, doorstep delivery is available in ${slName} for an additional charge (typically ₹100–₹200). For free pickup, you can collect the bike from the vendor's nearest location. Most vendors deliver within 2 hours of booking confirmation.`,
  },
  {
    q: `Can I rent a bike in ${slName} for a day trip?`,
    a: `Yes, daily rentals are available with a minimum of 24 hours. For day trips and outstation rides from ${slName}, ${cityName}, confirm the vendor's outstation policy at the time of booking. Most vendors allow travel within the state.`,
  },
];

export default function BikeSubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('bike-on-rent', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['bike-on-rent']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = BIKE_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/bike-on-rent" className="hover:text-primary">Bike on Rent</a>
            <span className="mx-2">/</span>
            <a href={`/bike-on-rent/${params.location.toLowerCase()}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Bike Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Rent a Bike in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">
            {sl.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/bike-on-rent/${params.location.toLowerCase()}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-emerald-600 hover:text-emerald-700 transition-colors"
            >
              All Bike Rentals in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Why Rent Here */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Why Rent a Bike in {sl.name}, {cityName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏍️', title: 'Wide Selection', desc: `Honda Activa, TVS Jupiter, Royal Enfield, KTM, Pulsar & more available in ${sl.name}` },
              { icon: '🚪', title: 'Doorstep Delivery', desc: `Get your bike delivered to your address in ${sl.name} — no need to travel to the vendor` },
              { icon: '💰', title: 'Best Prices', desc: `Scooters from ₹299/day. Weekly and monthly discounts available. Transparent pricing.` },
              { icon: '✅', title: 'Verified Vendors', desc: `All bike rental vendors in ${sl.name} are background-checked and regularly audited` },
              { icon: '🪖', title: 'Helmet Included', desc: `Helmet provided with every rental — no extra charge` },
              { icon: '📞', title: '24/7 Support', desc: `Roadside assistance and customer support for any issue during your rental` },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 p-5 rounded-xl">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Bikes */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Bikes Available in {sl.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Honda Activa', type: 'Scooter', price: '₹299', tag: 'Most Popular' },
              { name: 'TVS Jupiter', type: 'Scooter', price: '₹349', tag: '' },
              { name: 'Royal Enfield Classic 350', type: 'Cruiser', price: '₹799', tag: 'Weekend Favourite' },
              { name: 'KTM Duke 200', type: 'Sports', price: '₹999', tag: '' },
              { name: 'Bajaj Pulsar 150', type: 'Commuter', price: '₹399', tag: '' },
              { name: 'Hero Splendor Plus', type: 'Commuter', price: '₹299', tag: 'Budget Pick' },
              { name: 'RE Himalayan', type: 'Adventure', price: '₹899', tag: '' },
              { name: 'TVS Apache RTR', type: 'Sports', price: '₹599', tag: '' },
            ].map((bike) => (
              <div key={bike.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                {bike.tag && (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 mb-2 inline-block">
                    {bike.tag}
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm">{bike.name}</p>
                <p className="text-xs text-gray-500">{bike.type}</p>
                <p className="text-emerald-600 font-bold mt-2">From {bike.price}/day</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions — Bike Rental in {sl.name}
          </h2>
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

      {/* Other Areas in this City */}
      {siblings.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="container-custom max-w-4xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Bike Rental in Other Areas of {cityName}
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/bike-on-rent/${params.location.toLowerCase()}`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                ← All Bike Rentals in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/bike-on-rent/${params.location.toLowerCase()}/${s.slug}`}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Bike Rental in ${sl.name}, ${cityName} — TransRentals`,
            description: sl.description,
            url: `https://transrentals.in/bike-on-rent/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
            areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹',
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bike on Rent', item: 'https://transrentals.in/bike-on-rent' },
              { '@type': 'ListItem', position: 3, name: `Bike Rental in ${cityName}`, item: `https://transrentals.in/bike-on-rent/${params.location.toLowerCase()}` },
              { '@type': 'ListItem', position: 4, name: `Bike Rental in ${sl.name}`, item: `https://transrentals.in/bike-on-rent/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}` },
            ],
          }),
        }}
      />
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />
    </div>
  );
}
