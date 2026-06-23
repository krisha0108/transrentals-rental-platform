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
  return getSubLocationStaticParams('car-rental');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('car-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Car Rental | TransRentals' };

  const title = `Car Rental in ${sl.name}, ${cityName} | Starting ₹999/Day | TransRentals`;
  const description = `Rent cars in ${sl.name}, ${cityName}. Swift, Innova, Creta & more. Self-drive & chauffeur options. Best prices guaranteed. Book now!`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://transrentals.in/car-rental/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
    },
    openGraph: {
      title: `Car Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/car-rental/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
      images: [{ url: 'https://transrentals.in/images/og/car-rental.jpg', width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Car Rental in ${sl.name}, ${cityName} | TransRentals`,
      description,
      images: ['https://transrentals.in/images/og/car-rental.jpg'],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const CAR_FAQS = (slName: string, cityName: string) => [
  {
    q: `Where can I rent a car in ${slName}, ${cityName}?`,
    a: `TransRentals has verified car rental vendors serving ${slName}. Most offer doorstep delivery to your address in ${slName} within 2–3 hours. You can also choose from self-drive or chauffeur-driven options.`,
  },
  {
    q: `What is the car rental price in ${slName}?`,
    a: `Hatchbacks (Swift, i20) start from ₹999/day. Sedans (Honda City, Dzire) start from ₹1,499/day. SUVs (Creta, Ertiga) start from ₹2,000/day. Outstation chauffeur-driven starts from ₹12/km. Weekly discounts available.`,
  },
  {
    q: `What documents are needed to rent a car in ${slName}?`,
    a: `For self-drive: valid driving licence (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000 based on car type). For chauffeur-driven: any government ID — no driving licence required.`,
  },
  {
    q: `Is self-drive car rental available in ${slName}?`,
    a: `Yes, self-drive cars are available in ${slName}. You can pick up the car from the vendor or get doorstep delivery. Daily packages include 100–200 km; extra km charged at ₹12–15/km.`,
  },
  {
    q: `Can I book a car for outstation trips from ${slName}?`,
    a: `Yes, outstation car rentals from ${slName}, ${cityName} are available with per-km pricing — transparent and no hidden charges. Confirm the destination outstation policy with the vendor at booking. Driver allowance (₹300–₹500/day) applies for outstation trips.`,
  },
];

export default function CarSubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('car-rental', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['car-rental']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = CAR_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/car-rental" className="hover:text-primary">Car Rental</a>
            <span className="mx-2">/</span>
            <a href={`/car-rental/${params.location.toLowerCase()}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Car Rental in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Car Rental in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">
            {sl.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/car-rental/${params.location.toLowerCase()}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-700 transition-colors"
            >
              All Car Rentals in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Car Options */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Cars Available in {sl.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Maruti Swift', type: 'Hatchback', price: '₹999', tag: 'Most Popular', seats: '5 Seater' },
              { name: 'Hyundai Creta', type: 'SUV', price: '₹2,000', tag: 'Top SUV', seats: '5 Seater' },
              { name: 'Toyota Innova', type: 'Premium SUV', price: '₹3,000', tag: 'Group Favourite', seats: '7 Seater' },
              { name: 'Honda City', type: 'Sedan', price: '₹1,499', tag: '', seats: '5 Seater' },
              { name: 'Maruti Ertiga', type: 'MPV', price: '₹2,200', tag: 'Family Pick', seats: '7 Seater' },
              { name: 'Hyundai i20', type: 'Hatchback', price: '₹1,199', tag: '', seats: '5 Seater' },
            ].map((car) => (
              <div key={car.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                {car.tag && (
                  <div className="text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 mb-2 inline-block">
                    {car.tag}
                  </div>
                )}
                <p className="font-bold text-gray-900">{car.name}</p>
                <p className="text-xs text-gray-500">{car.type} · {car.seats}</p>
                <p className="text-blue-600 font-bold mt-2 text-lg">From {car.price}/day</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Rent Here */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Why Rent a Car in {sl.name}?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '🚗', title: 'Self-Drive & Chauffeur', desc: `Both options available in ${sl.name} — drive yourself or hire a verified driver` },
              { icon: '🚪', title: 'Doorstep Delivery', desc: `Car delivered to your address in ${sl.name} within 2–3 hours of booking` },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. Fixed pricing includes insurance and roadside assistance' },
              { icon: '✅', title: 'Verified Vendors', desc: `All car rental vendors in ${sl.name} are background-checked and regularly inspected` },
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            FAQs — Car Rental in {sl.name}, {cityName}
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

      {/* Other Areas */}
      {siblings.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="container-custom max-w-4xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Car Rental in Other Areas of {cityName}
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/car-rental/${params.location.toLowerCase()}`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ← All Car Rentals in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/car-rental/${params.location.toLowerCase()}/${s.slug}`}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-blue-600 hover:text-blue-700 transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AutoRental Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AutoRental',
            name: `Car Rental in ${sl.name}, ${cityName} — TransRentals`,
            description: sl.description,
            url: `https://transrentals.in/car-rental/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}`,
            areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            priceRange: '₹₹',
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
              { '@type': 'ListItem', position: 2, name: 'Car Rental', item: 'https://transrentals.in/car-rental' },
              { '@type': 'ListItem', position: 3, name: `Car Rental in ${cityName}`, item: `https://transrentals.in/car-rental/${params.location.toLowerCase()}` },
              { '@type': 'ListItem', position: 4, name: `Car Rental in ${sl.name}`, item: `https://transrentals.in/car-rental/${params.location.toLowerCase()}/${params.sublocation.toLowerCase()}` },
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
