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
  return getSubLocationStaticParams('packers-and-movers');
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sl = getSubLocation('packers-and-movers', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) return { title: 'Packers and Movers | TransRentals' };

  const title = `Packers and Movers in ${sl.name}, ${cityName} | Verified Movers | TransRentals`;
  const description = `Trusted packers and movers in ${sl.name}, ${cityName}. Home shifting, office relocation, intercity moves. IBA-approved and insured. Get free quotes.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/packers-and-movers/${params.location}/${params.sublocation}` },
    openGraph: {
      title: `Packers and Movers in ${sl.name}, ${cityName} | TransRentals`,
      description,
      type: 'website',
      url: `https://transrentals.in/packers-and-movers/${params.location}/${params.sublocation}`,
      images: [{ url: `https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Packers and Movers in ${sl.name}, ${cityName}`,
      description,
      images: [`https://transrentals.in/api/og?service=packers-and-movers&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

const PACKERS_FAQS = (slName: string, cityName: string) => [
  { q: `How much do packers and movers cost in ${slName}, ${cityName}?`, a: `Local 1BHK shift in ${slName} starts from ₹3,500–₹6,000. 2BHK local move ₹6,000–₹10,000. Intercity moves from ${slName} to other cities start from ₹8,000 depending on distance and goods volume.` },
  { q: `Which is the best packers and movers in ${slName}?`, a: `TransRentals connects you with verified, IBA-approved movers in ${slName}. All movers are background-checked with transit insurance available. Compare multiple quotes and choose the best-rated mover for your move.` },
  { q: `How long does a house shift take in ${slName}?`, a: `A 2BHK intra-city move in ${slName} typically takes 6–10 hours with a team of 3–4 packers. Intercity moves add 1–5 days of transit. Same-day local shifts available for 1BHK with advance booking.` },
  { q: `Is transit insurance available for moves from ${slName}?`, a: `Yes, all TransRentals-listed movers offer optional transit insurance at 0.5–1% of declared goods value. Strongly recommended for electronics, appliances, and fragile items. Confirm before booking.` },
  { q: `Do movers in ${slName} disassemble furniture?`, a: `Yes, professional movers in ${slName} include dismantling and reassembly of beds, wardrobes, and modular furniture. Always confirm furniture services are included in your quote before confirming the booking.` },
];

export default function PackersSubLocationPage({ params }: PageProps) {
  const sl = getSubLocation('packers-and-movers', params.location, params.sublocation);
  const cityName = getCityNameFromSlug(params.location);
  if (!sl) notFound();

  const citySubLocations = CITY_SUBLOCATIONS['packers-and-movers']?.[params.location] ?? [];
  const siblings = citySubLocations.filter((s) => s.slug !== params.sublocation).slice(0, 4);
  const faqs = PACKERS_FAQS(sl.name, cityName);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/packers-and-movers" className="hover:text-primary">Packers & Movers</a>
            <span className="mx-2">/</span>
            <a href={`/packers-and-movers/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{sl.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-teal-50 to-cyan-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Packers & Movers in {sl.name}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Packers and Movers in {sl.name}, {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">{sl.description}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/packers-and-movers/${params.location}`}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-teal-600 hover:text-teal-700 transition-colors"
            >
              All Movers in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Moving Services in {sl.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Home Shifting', desc: '1BHK to 4BHK residential moves', tag: 'Most Popular', icon: '🏠' },
              { name: 'Office Relocation', desc: 'Workstation and server room moves', tag: '', icon: '🏢' },
              { name: 'Intercity Moving', desc: `${sl.name} to any city in India`, tag: 'All-India', icon: '🚛' },
              { name: 'Furniture Shifting', desc: 'Sofa, wardrobe, bed dismantling', tag: '', icon: '🛋️' },
              { name: 'Vehicle Transport', desc: 'Car and bike transport on carrier', tag: '', icon: '🚗' },
              { name: 'Warehouse Storage', desc: 'Short-term storage at transit', tag: '', icon: '📦' },
            ].map((svc) => (
              <div key={svc.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="text-3xl mb-2">{svc.icon}</div>
                {svc.tag && <div className="text-xs font-semibold text-teal-700 bg-teal-50 rounded-full px-2 py-0.5 mb-2 inline-block">{svc.tag}</div>}
                <p className="font-bold text-gray-900">{svc.name}</p>
                <p className="text-xs text-gray-500 mt-1">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose TransRentals in {sl.name}?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: 'IBA-Approved Movers', desc: 'All movers listed are IBA (Indian Banks Association) approved — required for bank employee transfers' },
              { icon: '🛡️', title: 'Transit Insurance', desc: `Goods insured in transit from ${sl.name}. Claim process handled by TransRentals team` },
              { icon: '📍', title: 'GPS Tracked Trucks', desc: 'Real-time truck tracking during intercity moves. Know exactly where your goods are' },
              { icon: '💬', title: 'Dedicated Move Manager', desc: 'One point of contact for quotes, scheduling, and delivery confirmation' },
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">FAQs — Packers and Movers in {sl.name}</h2>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Packers and Movers in Other Areas of {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/packers-and-movers/${params.location}`} className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-full text-sm font-medium hover:bg-teal-700 transition-colors">
                ← All Movers in {cityName}
              </Link>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/packers-and-movers/${params.location}/${s.slug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-teal-600 hover:text-teal-700 transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'MovingCompany',
        name: `Packers and Movers in ${sl.name}, ${cityName} — TransRentals`,
        description: sl.description,
        url: `https://transrentals.in/packers-and-movers/${params.location}/${params.sublocation}`,
        areaServed: { '@type': 'Place', name: `${sl.name}, ${cityName}`, addressCountry: 'IN' },
        provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        priceRange: '₹₹',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Packers and Movers', item: 'https://transrentals.in/packers-and-movers' },
          { '@type': 'ListItem', position: 3, name: `Packers and Movers in ${cityName}`, item: `https://transrentals.in/packers-and-movers/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `Packers and Movers in ${sl.name}`, item: `https://transrentals.in/packers-and-movers/${params.location}/${params.sublocation}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
