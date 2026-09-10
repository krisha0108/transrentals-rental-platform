import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { MiniTruckBookingHero } from '@/components/mini-truck-rental/MiniTruckBookingHero';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';
import {
  MessageCircleQuestion, Plus, Package, Home, Store, ShoppingCart, Construction, UtensilsCrossed, Armchair,
  Recycle, Wallet, Target, Zap, MapPin, ArrowRight, Truck, PackageOpen,
} from 'lucide-react';

const MINI_TRUCK_FAQS = [
  {
    q: 'What is the load capacity of a Tata Ace mini truck?',
    a: 'The Tata Ace (Chhota Hathi) has a payload capacity of 750 kg to 1 tonne. The Tata Ace Gold carries up to 1 tonne and the Tata Ace EV (electric) up to 750 kg. The Mahindra Jeeto carries up to 750 kg. For loads up to 1.5–2 tonnes, a Tata 407 or Bolero Pickup is a better choice.',
  },
  {
    q: 'What can fit inside a mini truck (Tata Ace)?',
    a: 'A standard Tata Ace cargo bed measures approximately 7.5 ft × 5.5 ft. It can carry: 1-room furniture (bed, wardrobe, fridge, washing machine), 20–25 cartons of goods, or 750 kg of loose materials. It is ideal for studio/1-room house shifting, shop restocking, and last-mile delivery.',
  },
  {
    q: 'What is the difference between Tata Ace and Bolero Pickup?',
    a: 'The Tata Ace (750 kg–1 tonne) is a smaller 3-wheeler-style mini truck ideal for narrow lanes and congested markets. The Bolero Pickup (1.5–2 tonne) is a larger 4-wheeler with higher payload, better for semi-urban routes and heavier loads. For city deliveries, Tata Ace is preferred; for intercity goods movement, Bolero Pickup is more suitable.',
  },
  {
    q: 'Is mini truck rental available by the hour?',
    a: 'Yes, hourly and half-day mini truck rentals are available on TransRentals. Hourly rentals are ideal for shop deliveries, market pickups, and small loads. Full-day bookings (8 hrs) are recommended for house shifting or multiple delivery stops. Check availability in your city when booking.',
  },
  {
    q: 'Can a Tata Ace go on highways for intercity trips?',
    a: 'Tata Ace is primarily designed for intra-city and short-distance trips. It can travel on highways but has a lower speed and payload limit compared to medium trucks. For intercity goods transport beyond 50–100 km, a Tata 407 or Eicher truck is recommended. Confirm intercity coverage with the vendor before booking.',
  },
  {
    q: 'Is a driver included in mini truck rental?',
    a: 'Yes, all mini truck rentals on TransRentals include the driver. Loading and unloading assistance (extra helpers) is available as an add-on service at additional cost. Confirm whether helpers are needed when requesting a quote.',
  },
  {
    q: 'How do I book a mini truck for house shifting?',
    a: 'On TransRentals, select the mini-truck-rental service, enter your city and date, and describe your shift (studio/1-room/2-room). For small apartment shifts, Tata Ace is ideal. For 2BHK+ shifts, consider a Tata 407 or larger truck. Book at least 24 hours in advance, or 3–5 days ahead for month-end or weekend shifts.',
  },
];

const PERFECT_FOR = [
  { icon: Package, anim: 'drive', title: 'Local Deliveries', desc: 'Last-mile & city-wide delivery' },
  { icon: Home, anim: 'lift', title: 'Home Shifting', desc: 'Studio & 1-room household moves' },
  { icon: Store, anim: 'pulse', title: 'Business Transport', desc: 'Inventory & stock movement' },
  { icon: ShoppingCart, anim: 'drive', title: 'E-commerce', desc: 'Online order fulfillment' },
  { icon: Construction, anim: 'pulse', title: 'Construction Sites', desc: 'Material transport to sites' },
  { icon: UtensilsCrossed, anim: 'tick', title: 'Food & Catering', desc: 'Bulk food delivery' },
  { icon: Armchair, anim: 'pulse', title: 'Furniture Moving', desc: 'Small furniture items' },
  { icon: Recycle, anim: 'tick', title: 'Waste Disposal', desc: 'Junk & waste removal' },
];

const WHY_MINI_TRUCK = [
  { icon: Wallet, anim: 'pulse', title: 'Cost Effective', desc: 'Lower rental and operating costs compared to large trucks' },
  { icon: Target, anim: 'pulse', title: 'Easy Access', desc: 'Navigate narrow lanes and crowded city areas easily' },
  { icon: Zap, anim: 'tick', title: 'Quick Loading', desc: 'Low deck height for easy loading and unloading' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent ke Applications section me hai. */
const APP_CSS = `
.app-card {
  opacity: 0;
  animation: app-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes app-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.app-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.app-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.app-card:hover .app-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .app-card { opacity: 1; animation: none; }
  .app-card:hover { transform: none; }
  .app-sheen { display: none; }
}
`;

const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
};

function AppCard({ item, idx }: { item: { icon: typeof Package; anim: string; title: string; desc: string }; idx: number }) {
  return (
    <div
      className="app-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
      style={{ animationDelay: `${idx * 90}ms` }}
    >
      <span aria-hidden className="app-sheen" />
      <div className="relative">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
          <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
            <item.icon
              className={`w-6 h-6 text-emerald-600 transition-all duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
            />
          </span>
        </div>
        <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
        <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
      </div>
    </div>
  );
}

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
];

export const metadata: Metadata = {
  title: 'Mini Truck Rental | Tata Ace on Rent | ₹1,499/Day',
  description:
    'Rent Tata Ace, Bolero Pickup and mini trucks across India for house shifting, last-mile delivery, and goods transport. Driver included. Book by the hour or full day across 250+ cities.',
  keywords: [
    'mini truck rental',
    'tata ace on rent',
    'tata ace rental',
    'mini truck hire',
    'small truck rental',
    'goods carrier rental',
    'pickup truck rental',
    'chhota hathi on rent',
    'tata ace per day',
    'bolero pickup rental',
    'mini truck for house shifting',
    'last mile delivery truck',
  ],
  openGraph: {
    title: 'Mini Truck Rental | Tata Ace on Rent | Starting ₹1,499/Day | TransRentals',
    description: 'Rent Tata Ace and mini trucks across 250+ Indian cities. Driver included. House shifting, delivery, goods transport.',
    type: 'website',
    url: 'https://transrentals.in/mini-truck-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=mini-truck-rental', width: 1200, height: 630, alt: 'Mini Truck Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mini Truck Rental | Tata Ace on Rent | Starting ₹1,499/Day | TransRentals',
    description: 'Rent Tata Ace and mini trucks across 250+ Indian cities. Driver included. House shifting, delivery, goods transport.',
    images: ['https://transrentals.in/api/og?service=mini-truck-rental'],
  },
  alternates: { canonical: 'https://transrentals.in/mini-truck-rental' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function MiniTruckRentalPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: MINI_TRUCK_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Mini Truck Rental in India',
            description: 'Tata Ace and mini truck rental services across 250+ Indian cities. Driver included. Ideal for house shifting and goods delivery.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
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
              { '@type': 'ListItem', position: 2, name: 'Mini Truck Rental', item: 'https://transrentals.in/mini-truck-rental' },
            ],
          }),
        }}
      />
      <HowToSchema
        name="How to Book a Mini Truck Rental on TransRentals"
        description="Rent Tata Ace and mini trucks across 250+ Indian cities with driver included."
        totalTime="PT10M"
        steps={[
          { name: 'Select Your City', text: 'Choose your city from 250+ locations. Enter pickup and drop address for your delivery or shifting job.' },
          { name: 'Choose Vehicle Size', text: 'Pick Tata Ace (750 kg) for small shifts and deliveries, or Bolero Pickup (1.5 tonne) for heavier loads.' },
          { name: 'Book by Hour or Day', text: 'Select a 4-hour, full-day, or multi-day package. Driver is included in all packages.' },
          { name: 'Get Your Load Moved', text: 'The driver arrives at your location at the scheduled time. Loading assistance available as add-on.' },
        ]}
      />

      <MiniTruckBookingHero city="India" citySlug="" />

      {/* Use Cases */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: APP_CSS }} />
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
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">Perfect For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {PERFECT_FOR.map((use, idx) => (
              <AppCard key={use.title} item={use} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">Why Choose Mini Trucks?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
            {WHY_MINI_TRUCK.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="mini-truck-rental" title="Mini Truck Rental in Available Cities" />

      {/* FAQ Section */}
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
              Mini Truck Rental <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Common questions about Tata Ace and mini truck hire in India.
            </p>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {MINI_TRUCK_FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.q}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Mini Truck Rental by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/mini-truck-rental/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/transporter', label: 'Truck & Transport', icon: Truck },
              { href: '/packers-and-movers', label: 'Packers and Movers', icon: PackageOpen },
              { href: '/jcb-on-rent', label: 'JCB on Rent', icon: Construction },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
