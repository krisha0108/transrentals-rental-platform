import { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, Armchair, Backpack, Tv, Heart, Briefcase, Landmark, GraduationCap,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: '17 Seater Tempo Traveller on Rent | Hire @₹20/km | TransRentals',
  description: 'Book 17 seater tempo traveller on rent for large group travel, weddings, corporate events. AC/Non-AC options. Driver included. Starting ₹20/km. Book now!',
  keywords: ['17 seater tempo traveller', '17 seater tempo traveller on rent', '17 seater bus rental', 'tempo traveller 17 seater price'],
  openGraph: {
    title: '17 Seater Tempo Traveller on Rent @₹20/km | TransRentals',
    description: 'Hire 17 seater tempo traveller with driver for large group travel.',
    url: 'https://transrentals.in/17-seater-tempo-traveller',
  },
  alternates: { canonical: 'https://transrentals.in/17-seater-tempo-traveller' },
};

const topCities = ALL_CITIES.slice(0, 12);

const FAQS = [
  { question: 'What is the rental price of a 17 seater tempo traveller?', answer: '17 seater (Force Traveller) rental starts at ₹20/km. Non-AC, AC, Deluxe, and Maharaja variants are available depending on your comfort and budget needs.' },
  { question: 'Is the 17 seater tempo traveller good for corporate outings?', answer: 'Yes, the 17-seater is a popular choice for corporate team outings and conferences — it comfortably fits 15-17 colleagues with room for luggage and equipment.' },
  { question: 'What is the Maharaja 2x1 layout available on the 17 seater?', answer: 'The Maharaja variant offers a 2x1 seating layout with wider, push-back recliner seats and extra legroom, ideal for longer journeys like Char Dham yatras.' },
  { question: 'Does the 17 seater tempo traveller come with entertainment features?', answer: 'Yes, many 17-seater variants include an LED TV and music system, useful for longer corporate or religious group trips.' },
  { question: 'How much luggage space does the 17 seater have?', answer: 'The 17-seater has a bigger rooftop carrier and boot space than the 12-seater, suitable for 15-17 passengers travelling with check-in style luggage.' },
];

export default function SeventeenSeaterTempoTravellerPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a 17-Seater Tempo Traveller on TransRentals"
        description="Book a 17-seater tempo traveller for large group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Trip & Group Details', text: 'Enter pickup city, destination, date, and confirm 15–17 passengers requiring the larger 17-seater vehicle.' },
          { name: 'Select Vehicle Type', text: 'Choose AC or non-AC 17-seater Force Traveller. Confirm luggage boot size for outstation trips.' },
          { name: 'Get & Compare Quotes', text: 'Review per-km or package quotes from verified bus operators. Check driver allowance and state permit.' },
          { name: 'Book & Confirm', text: 'Pay booking advance. Receive driver contact details. Meet driver at pickup on travel date.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Perfect for 15-17 People"
        title="17 Seater Tempo Traveller"
        titleHighlight="Starting @₹20/km"
        description="Spacious 17 seater tempo traveller for large group travel, weddings, corporate events & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '17 Seats', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
        serviceType="tempo-17seater"
        backgroundImage="/images/sections/tempo-traveller-hero-bg.webp"
        bookingVariant="tempo"
        heroStats={[
          { icon: 'tag', value: '₹20/km', label: 'Starting rate' },
          { icon: 'shield', value: '500+', label: 'Verified operators' },
          { icon: 'map', value: '500+', label: 'Cities served' },
          { icon: 'headphones', value: '24/7', label: 'Customer support' },
        ]}
      />

      <section className="relative bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">17 Seater Tempo Traveller on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Deluxe • Maharaja Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition">Find Near You</a>
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Choose 17 Seater Tempo Traveller?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: Users, title: 'Large Capacity', desc: 'Fits 15-17 people comfortably' },
              { Icon: Armchair, title: '2x1 Option', desc: 'Extra spacious Maharaja layout' },
              { Icon: Backpack, title: 'More Luggage', desc: 'Bigger carrier & boot space' },
              { Icon: Tv, title: 'Entertainment', desc: 'LED TV & music system' },
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
              { Icon: Heart, title: 'Weddings', desc: 'Baraat & guest pickup' },
              { Icon: Briefcase, title: 'Corporate Events', desc: 'Team outings & conferences' },
              { Icon: Landmark, title: 'Religious Tours', desc: 'Char Dham, temple visits' },
              { Icon: GraduationCap, title: 'School/College', desc: 'Educational trips' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">17 Seater Tempo Traveller in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/17-seater-tempo-traveller/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-purple-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6"><p className="text-gray-600">+ 190 more cities available</p></div>
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
              17 Seater Tempo Traveller <span className="text-emerald-600">FAQs</span>
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
