import { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, Armchair, Backpack, Snowflake, Heart, Landmark, Briefcase, Bus,
  MessageCircleQuestion, Plus, ArrowRight,
} from 'lucide-react';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: '12 Seater Tempo Traveller on Rent | Hire @₹18/km | TransRentals',
  description: 'Book 12 seater tempo traveller on rent for family trips, weddings, pilgrimages. AC/Non-AC options. Professional driver included. Starting ₹18/km. Book now!',
  keywords: [
    '12 seater tempo traveller',
    '12 seater tempo traveller on rent',
    '12 seater tempo traveller hire',
    'tempo traveller 12 seater price',
    '12 seater van rental',
  ],
  openGraph: {
    title: '12 Seater Tempo Traveller on Rent @₹18/km | TransRentals',
    description: 'Hire 12 seater tempo traveller with driver for group travel. AC/Non-AC available.',
    type: 'website',
    url: 'https://transrentals.in/12-seater-tempo-traveller',
  },
  alternates: {
    canonical: 'https://transrentals.in/12-seater-tempo-traveller',
  },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a 12 seater tempo traveller?', answer: '12 seater tempo traveller rental starts at ₹18/km. Non-AC, AC, Deluxe, and Maharaja variants are available, with pricing varying by variant and trip duration.' },
  { question: 'Is the 12 seater tempo traveller suitable for a small family trip or pilgrimage?', answer: 'Yes, the 12-seater is ideal for groups of 10-12 — perfect for family vacations, pilgrimages like Char Dham or Vaishno Devi, and small wedding guest groups.' },
  { question: "What's the difference between AC and Non-AC 12 seater options?", answer: "AC is recommended for outstation and summer travel, while Non-AC works well for short local trips and hill routes where AC isn't essential. Non-AC pricing is typically lower." },
  { question: 'How much luggage can a 12 seater tempo traveller carry?', answer: 'A 12-seater has a rooftop carrier plus rear boot space, comfortably fitting luggage for 10-12 passengers on a multi-day trip.' },
  { question: 'Can I compare the 12 seater with 17 or 20 seater options before booking?', answer: 'Yes — if your group is closer to 15 or 18-20 people, check our 17-seater and 20-seater tempo traveller pages, which offer better per-person value for larger groups.' },
];

export default function TwelveSeaterTempoTravellerPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a 12-Seater Tempo Traveller on TransRentals"
        description="Book a 12-seater tempo traveller for group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Group Details', text: 'Select pickup city, travel date, and confirm group size of 10–12 passengers.' },
          { name: 'Choose AC or Non-AC', text: 'Select AC Tempo Traveller for summer or long-distance trips, non-AC for short hill station routes.' },
          { name: 'Compare Vendor Quotes', text: 'Get per-km quotes from verified operators. Review toll, state permit, and driver allowance inclusions.' },
          { name: 'Confirm & Travel', text: 'Pay advance to lock in the booking. Driver arrives at your pickup point with a clean, well-maintained vehicle.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Perfect for 10-12 People"
        title="12 Seater Tempo Traveller"
        titleHighlight="Starting @₹18/km"
        description="Comfortable 12 seater tempo traveller for family trips, weddings, corporate outings & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '12 Seats', color: 'text-blue-600' },
        ]}
        gradientFrom="blue-50"
        gradientTo="indigo-50"
        serviceType="tempo-12seater"
        backgroundImage="/images/sections/tempo-traveller-hero-bg.webp"
        bookingVariant="tempo"
        heroStats={[
          { icon: 'tag', value: '₹18/km', label: 'Starting rate' },
          { icon: 'shield', value: '500+', label: 'Verified operators' },
          { icon: 'map', value: '500+', label: 'Cities served' },
          { icon: 'headphones', value: '24/7', label: 'Customer support' },
        ]}
      />

      <section className="relative bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              12 Seater Tempo Traveller on Rent
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Non-AC • AC • Deluxe • Maharaja Variants
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Variants & Prices
              </a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Why Choose 12 Seater Tempo Traveller?
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: Users, title: 'Ideal Group Size', desc: 'Perfect for 10-12 people' },
              { Icon: Armchair, title: 'Comfortable Seats', desc: 'Push-back & reclining options' },
              { Icon: Backpack, title: 'Luggage Space', desc: 'Carrier + boot space' },
              { Icon: Snowflake, title: 'AC Available', desc: 'Beat the heat in comfort' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center">
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Perfect For
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: Users, title: 'Family Trips', desc: 'Outstation vacations' },
              { Icon: Heart, title: 'Weddings', desc: 'Guest transportation' },
              { Icon: Landmark, title: 'Pilgrimages', desc: 'Temple & religious tours' },
              { Icon: Briefcase, title: 'Corporate', desc: 'Team outings & events' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center">
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            12 Seater Tempo Traveller in 200+ Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/12-seater-tempo-traveller/${city.slug}`}
                className="p-3 bg-gray-50 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition"
              >
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600">+ 190 more cities available</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Other Tempo Traveller Options
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              { href: '/tempo-traveller', label: 'All Tempo Travellers', icon: Bus },
              { href: '/17-seater-tempo-traveller', label: '17 Seater', icon: Bus },
              { href: '/20-seater-tempo-traveller', label: '20 Seater', icon: Bus },
              { href: '/bus-rental', label: 'Bus Rental', icon: Bus },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
              12 Seater Tempo Traveller <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.question}
                  </h3>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
    </>
  );
}
