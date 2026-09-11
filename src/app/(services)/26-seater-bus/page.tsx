import { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, PiggyBank, Backpack, Bath, Heart, Building2, GraduationCap, Landmark,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { TwentySixSeaterBusBookingHero } from '@/components/bus-rental/TwentySixSeaterBusBookingHero';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: '26 Seater Bus on Rent | Mini Bus Hire @₹28/km | TransRentals',
  description: 'Book 26 seater mini bus on rent for weddings, corporate events, school trips. AC/Non-AC with driver. Starting ₹28/km. Book now!',
  keywords: ['26 seater bus', '26 seater bus on rent', 'mini bus rental', '26 seater bus price'],
  openGraph: {
    title: '26 Seater Bus on Rent @₹28/km | TransRentals',
    url: 'https://transrentals.in/26-seater-bus',
  },
  alternates: { canonical: 'https://transrentals.in/26-seater-bus' },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a 26 seater bus?', answer: '26 seater mini bus rental starts from ₹28/km, or day packages (8 hrs/80 km) starting around ₹5,999. Rates vary by city, AC/Non-AC choice, and trip duration. Get a free quote on TransRentals for your exact route.' },
  { question: 'Is a 26 seater bus AC or Non-AC?', answer: 'Both AC and Non-AC 26-seater buses are available. AC is recommended for outstation trips, especially in summer (March–June). Non-AC options are priced 15–20% lower.' },
  { question: 'How much luggage space does a 26 seater bus have?', answer: 'A 26-seater bus has a dedicated luggage boot that comfortably fits 26 medium-sized bags. For events with heavy luggage, mention this while booking so the operator can confirm boot capacity.' },
  { question: 'Is a 26 seater or a 32/40 seater bus better for my group?', answer: 'A 26-seater is the most cost-effective choice for groups of 20–26 — anything larger and a 32 or 40-seater brings the per-person cost down further. TransRentals shows a size comparison when you request a quote.' },
  { question: 'How far in advance should I book a 26 seater bus?', answer: 'For regular trips, 2–3 days notice is enough. During wedding season (Nov–Feb), Navratri, Diwali, and long weekends, book at least 1–2 weeks ahead as 26-seaters are the most requested size and sell out first.' },
];

export default function TwentySixSeaterBusPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a 26-Seater Mini Bus on TransRentals"
        description="Hire a 26-seater mini bus for events and group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Share Event Details', text: 'Enter pickup city, event date, route, and group size (up to 26 passengers). Mention event type — wedding, corporate, or school trip.' },
          { name: 'Select Bus Configuration', text: 'Choose AC or non-AC 26-seater. Confirm if push-back seats or standard seats are required.' },
          { name: 'Compare Operator Quotes', text: 'Review quotes from verified bus operators. Check rates, driver allowance, and state permit charges.' },
          { name: 'Confirm & Schedule', text: 'Pay advance deposit to confirm. Share final pickup schedule and itinerary with the operator.' },
        ]}
      />
      <TwentySixSeaterBusBookingHero city="India" citySlug="" />

      <section className="relative bg-gradient-to-br from-green-700 to-teal-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">26 Seater Bus on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Luxury Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition">Find Near You</a>
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Choose 26 Seater Bus?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: Users, title: 'Large Capacity', desc: 'Fits 24-26 people' },
              { Icon: PiggyBank, title: 'Best Value', desc: 'Lowest per-person cost' },
              { Icon: Backpack, title: 'Huge Luggage', desc: 'Separate luggage compartment' },
              { Icon: Bath, title: 'Washroom Option', desc: 'Available in luxury variant' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Perfect For</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: Heart, title: 'Weddings', desc: 'Baraat & guest transport' },
              { Icon: Building2, title: 'Corporate', desc: 'Office outings & events' },
              { Icon: GraduationCap, title: 'School Trips', desc: 'Educational excursions' },
              { Icon: Landmark, title: 'Pilgrimages', desc: 'Religious group tours' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">26 Seater Bus in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/26-seater-bus/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-green-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
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
              26 Seater Bus <span className="text-emerald-600">FAQs</span>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: '26 Seater Bus', item: 'https://transrentals.in/26-seater-bus' },
            ],
          }),
        }}
      />
    </>
  );
}
