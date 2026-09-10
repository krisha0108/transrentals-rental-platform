import { Metadata } from 'next';
import { Wallet, RefreshCw, Clock, Target, ShieldCheck, Phone, MessageCircleQuestion, Plus } from 'lucide-react';
import { RoundTripRoutesGrid } from '@/components/services/RoundTripRoutesGrid';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Round Trip Cab Service | Outstation Taxi @ Best Rates',
  description: 'Book round trip cabs for outstation travel. AC sedans, SUVs with professional drivers. Round trip packages starting @₹10/km. Go and return with same driver.',
  keywords: [
    'round trip cab',
    'round trip taxi',
    'outstation round trip',
    'return trip cab',
    'round trip car rental',
    'outstation cab round trip',
    'round trip taxi booking',
    'cab for round trip',
    'round trip package',
    'return cab booking',
  ],
  openGraph: {
    title: 'Round Trip Cab Service - Book Return Trip Cabs @ Best Rates',
    description: 'Book round trip cabs for outstation travel starting @₹10/km. Professional drivers, all charges included.',
    url: 'https://transrentals.in/round-trip',
    type: 'website',
  },
  alternates: {
    canonical: 'https://transrentals.in/round-trip',
  },
};

const WHY_CHOOSE = [
  { icon: Wallet, anim: 'lift', title: 'Save 20-30%', desc: 'Round trip is significantly cheaper than booking two separate one-way trips' },
  { icon: RefreshCw, anim: 'tick', title: 'Same Driver', desc: 'Travel with the same trusted driver both ways - no coordination hassle' },
  { icon: Clock, anim: 'tick', title: 'Flexible Schedule', desc: 'Return anytime within package duration, driver waits for you' },
  { icon: Target, anim: 'pulse', title: 'No Last-Minute Booking', desc: 'No need to search for return cab at destination, peace of mind' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Better Service', desc: 'Driver ensures excellent experience as they depend on return trip' },
  { icon: Phone, anim: 'ring', title: 'Easy Coordination', desc: 'Direct communication with driver, flexible pickup times' },
];

const ROUND_TRIP_FAQS = [
  { q: 'What is included in round trip cab fare?', a: 'Round trip cab fare includes driver charges, fuel for both ways, toll charges, parking fees, state permits, driver allowance, and vehicle insurance.' },
  { q: 'How much cheaper is round trip compared to one-way?', a: 'Round trip is typically 20-30% cheaper than booking two separate one-way trips because you avoid return empty km charges.' },
  { q: 'Can I return on a different day?', a: 'Yes! Round trip packages are flexible. You can return anytime within the package duration (2-3 days typically).' },
  { q: 'Where does the driver stay during the trip?', a: 'Driver accommodation is your responsibility. Most budget hotels provide complimentary driver rooms, or driver can arrange their own stay.' },
  { q: 'Is there a minimum km per day?', a: 'Yes, most round trip packages have a 250km/day minimum. Extra km beyond package limits are charged at per km rate.' },
  { q: 'Can I make stops during the journey?', a: 'Absolutely! You can make flexible stops for meals, sightseeing, or rest. All reasonable stops are included in the package.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai. */
const RTP_CSS = `
.rtp-card {
  opacity: 0;
  animation: rtp-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes rtp-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.rtp-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.rtp-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.rtp-card:hover .rtp-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .rtp-card { opacity: 1; animation: none; }
  .rtp-card:hover { transform: none; }
  .rtp-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  ring: 'group-hover:rotate-12',
};

export default function RoundTripPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a Round-Trip Cab on TransRentals"
        description="Book a round-trip outstation cab in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter Pickup & Return Details', text: 'Enter origin city, destination, travel date, and return date. Same driver for both directions.' },
          { name: 'Select Vehicle', text: 'Choose sedan, SUV, or luxury car. Round-trip bookings get priority vehicle allocation.' },
          { name: 'Review Round-Trip Pricing', text: 'Check per-km rate for total distance. Driver allowance and night halt charges included in quote.' },
          { name: 'Book & Travel Stress-Free', text: 'Pay advance to confirm. Driver handles both legs of the journey with the same vehicle.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="round-trip" />

      {/* Why Choose Round Trip */}
      <section className="rtp relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: RTP_CSS }} />
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
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Choose Round Trip <span className="text-emerald-600">Over One-Way</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="rtp-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="rtp-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Round Trip Routes */}
      <RoundTripRoutesGrid />

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            How Round Trip Cab Booking Works
          </h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Select Your Route',
                desc: 'Choose starting city and destination from our route list',
              },
              {
                step: '2',
                title: 'Choose Vehicle Type',
                desc: 'Select from Sedan, SUV, Innova based on your group size',
              },
              {
                step: '3',
                title: 'Book & Pay',
                desc: 'Confirm your booking with advance payment',
              },
              {
                step: '4',
                title: 'Driver Arrives',
                desc: 'Professional driver picks you up at scheduled time',
              },
              {
                step: '5',
                title: 'Travel Comfortably',
                desc: 'Enjoy your journey with AC car and experienced driver',
              },
              {
                step: '6',
                title: 'Flexible Return',
                desc: 'Return anytime within package, driver waits for you',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Types */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Round Trip Package Options
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: '2 Days / 1 Night',
                distance: '500km',
                ideal: 'Weekend trips, short visits',
                features: ['250km/day minimum', 'Driver allowance included', 'Flexible stops'],
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                name: '3 Days / 2 Nights',
                distance: '750km',
                ideal: 'Leisure trips, family outings',
                features: ['250km/day minimum', 'Hotel recommendations', 'Sightseeing stops'],
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                name: 'Custom Duration',
                distance: 'Any',
                ideal: 'Extended tours, business trips',
                features: ['Flexible itinerary', 'Multiple destinations', 'Custom packages'],
                gradient: 'from-orange-500 to-red-500',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-gradient-to-br ${pkg.gradient} text-white rounded-xl p-6 shadow-lg`}
              >
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-white/90 mb-1">Up to {pkg.distance}</p>
                <p className="text-sm text-white/80 mb-4">{pkg.ideal}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
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
              Round Trip <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {ROUND_TRIP_FAQS.map((faq, idx) => (
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

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Round Trip Cab Service',
            description:
              'Book round trip cabs for outstation travel. Professional drivers, AC vehicles, all charges included.',
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
            areaServed: {
              '@type': 'Country',
              name: 'India',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: 10,
              highPrice: 25,
              offerCount: 50,
            },
          }),
        }}
      />
    </>
  );
}
