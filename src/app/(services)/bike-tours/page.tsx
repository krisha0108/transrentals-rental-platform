import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
import { HowToSchema } from '@/components/seo/schemas';
import {
  Bike, UserCheck, Truck, Hotel, UtensilsCrossed, ShieldCheck, Shirt, FileCheck2,
  MessageCircleQuestion, Plus, Users, Quote, Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guided Bike Tours India | Leh Ladakh, Spiti, Rajasthan Tours',
  description: 'Book guided motorcycle tours across India. Leh Ladakh, Spiti Valley, Rajasthan, Goa tours with ride captain, backup vehicle, accommodation & meals included. Starting ₹24,999.',
  keywords: [
    'guided bike tours india',
    'motorcycle tours india',
    'leh ladakh bike tour',
    'spiti valley motorcycle tour',
    'rajasthan bike tour package',
    'goa motorcycle tour',
    'adventure bike tours',
  ],
  openGraph: {
    title: 'Guided Motorcycle Tours India | All-Inclusive Packages | TransRentals',
    description: 'Book guided bike tours with ride captain, backup vehicle, accommodation & meals. Ladakh, Spiti, Rajasthan, Goa.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours',
    images: [
      {
        url: 'https://transrentals.in/images/og/bike-tours.jpg',
        width: 1200,
        height: 630,
        alt: 'Guided Motorcycle Tours India - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guided Bike Tours India | TransRentals',
    description: 'All-inclusive motorcycle tours starting ₹24,999.',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours',
  },
};

const FAQS = [
  { question: 'What is included in a TransRentals guided bike tour?', answer: 'Every guided tour includes the Royal Enfield (Himalayan or Classic 350) with full tank, an experienced ride captain, a backup support vehicle with mechanic, accommodation (hotels, camps or homestays), breakfast & dinner daily, riding gear, insurance, and all permits — you just show up and ride.' },
  { question: 'How much do guided bike tours cost?', answer: 'Packages start from ₹24,999 for the 4-day Goa coastal tour, ₹26,999 for the 8-day Spiti Valley tour, and go up to ₹32,999 for the flagship 10-day Leh Ladakh tour. Pricing is all-inclusive — bike, fuel, stays, meals, and ride captain.' },
  { question: 'What is the group size on a guided tour, and can I book privately?', answer: 'Groups are kept small at 6–12 riders so the ride captain can manage the pack safely on mountain and desert roads. Private/custom group bookings are also available on request — mention this while enquiring.' },
  { question: 'Do I need prior riding experience to join a guided tour?', answer: 'A valid two-wheeler license and basic riding comfort with a 350cc motorcycle is required. Ladakh and Spiti involve high-altitude mountain passes and some rough patches, so prior long-distance riding experience is recommended; Goa is beginner-friendly.' },
  { question: 'What is the booking and payment process?', answer: 'Pay 25% advance to reserve your slot on your chosen destination and batch, with the balance due 30 days before departure. Since group sizes are limited to 6–12 riders, popular Ladakh and Spiti batches fill up fast, especially in peak season (May–September).' },
];

const inclusions = [
  { icon: Bike, anim: 'drive', title: 'Royal Enfield Bike', desc: 'Himalayan/Classic 350 with full tank' },
  { icon: UserCheck, anim: 'pulse', title: 'Ride Captain', desc: 'Experienced guide leading the group' },
  { icon: Truck, anim: 'drive', title: 'Backup Vehicle', desc: 'Support vehicle with mechanic' },
  { icon: Hotel, anim: 'lift', title: 'Accommodation', desc: 'Hotels, camps & homestays' },
  { icon: UtensilsCrossed, anim: 'pulse', title: 'Meals', desc: 'Breakfast & dinner included' },
  { icon: ShieldCheck, anim: 'tick', title: 'Insurance', desc: 'Comprehensive coverage' },
  { icon: Shirt, anim: 'wrench', title: 'Riding Gear', desc: 'Jacket, gloves, knee guards' },
  { icon: FileCheck2, anim: 'lift', title: 'Permits', desc: 'All required permits arranged' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes
   (custom CSS keyframe hover animations didn't render reliably in the browser). */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
};

export default function BikeToursPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a Guided Bike Tour on TransRentals"
        description="Join a guided motorcycle tour across India in 4 simple steps."
        totalTime="PT15M"
        steps={[
          { name: 'Choose Tour Destination', text: 'Select from Leh Ladakh, Spiti Valley, Rajasthan, or Goa guided bike tours. Check best season for each route.' },
          { name: 'Pick Tour Package', text: 'Choose group or private tour. Select bike type — Royal Enfield Himalayan or Classic 350. Check if gear is included.' },
          { name: 'Register & Pay Advance', text: 'Fill rider registration form with DL details. Pay advance to secure your spot. Group size limited.' },
          { name: 'Gear Up & Ride', text: 'Report at start city on tour date. Receive riding gear and bike. Ride captain leads the group throughout the tour.' },
        ]}
      />
      <BikeTourHero
        badge="Guided Motorcycle Tours"
        title="Bike Tours India"
        price="All-Inclusive Packages"
        description="Join our guided motorcycle tours with ride captain, backup vehicle, accommodation, and meals. Just ride and enjoy — we handle everything else."
        gradient="from-purple-900 via-indigo-900 to-blue-900"
        accentColor="purple-400"
        stats={[
          { icon: 'star', label: 'Customer Rating', value: '4.9/5' },
          { icon: 'users', label: 'Group Size', value: '6–12' },
          { icon: 'mappin', label: 'Destinations', value: '4+' },
          { icon: 'clock', label: 'Tour Length', value: '4–12 Days' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Backup Vehicle' },
          { text: 'Accommodation' },
          { text: 'Meals Included' },
          { text: 'Riding Gear' },
          { text: 'All Permits' },
        ]}
      />

      {/* Quick facts */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                Ride Captain <span className="text-emerald-600">Led</span> Adventures
              </h2>
              <p className="text-gray-500 mt-1.5">Backup vehicle · Accommodation · Meals — all handled for you.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">Group Size</p>
                  <p className="text-lg font-black text-gray-900">6–12 Riders</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <a href="#tours" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
              View All Tours
            </a>
            <Link href="/bike-trips/ladakh" className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition">
              Most Popular: Ladakh
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included */}
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            What&apos;s Included in Every Tour
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {inclusions.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-6 text-center overflow-hidden"
              >
                <div className="relative w-14 h-14 mx-auto mb-3">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Ride Option */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 text-white rounded-2xl p-8 md:p-12">
            <div className="md:flex md:items-center md:justify-between relative">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Prefer Self-Ride?</h2>
                <p className="text-emerald-50/90">Rent a bike and plan your own adventure. One-way drops available.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/bike-trips/ladakh" className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition">
                  Self-Ride Options
                </Link>
                <Link href="/royal-enfield-on-rent" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition">
                  Rent Royal Enfield
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-12">
            How Guided Tours <span className="text-emerald-600">Work</span>
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Choose Tour', desc: 'Select your preferred destination and dates' },
              { step: '2', title: 'Book & Pay', desc: 'Pay 25% to confirm, rest 30 days before' },
              { step: '3', title: 'Join Group', desc: 'Meet fellow riders at the starting point' },
              { step: '4', title: 'Ride & Enjoy', desc: 'Follow the ride captain, we handle everything' },
            ].map((item, idx) => (
              <div key={item.step} className="flex gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-shrink-0 w-10 h-10">
                  <span
                    className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"
                    style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                  />
                  <div className="relative w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-12">
            What Riders <span className="text-emerald-600">Say</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Rahul S.', tour: 'Ladakh Tour', text: 'Best decision ever! The ride captain knew every corner. Backup vehicle saved us twice. Unforgettable experience.' },
              { name: 'Priya M.', tour: 'Spiti Valley', text: 'As a solo female rider, I felt completely safe. The group was amazing and the accommodations were top-notch.' },
              { name: 'Amit K.', tour: 'Rajasthan', text: 'The desert camping and palace stays were incredible. Worth every rupee. Already planning the Ladakh tour!' },
            ].map((review) => (
              <div
                key={review.name}
                className="group relative rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Quote className="w-8 h-8 text-emerald-100 mb-2" fill="currentColor" />
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">{review.tour}</p>
                  </div>
                </div>
              </div>
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
              Bike Tours <span className="text-emerald-600">FAQs</span>
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
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.question}</h3>
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
