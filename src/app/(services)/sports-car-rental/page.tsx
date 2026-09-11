import { Metadata } from 'next';
import Link from 'next/link';
import {
  Car, Zap, UserCog, Trophy, Gem, Camera, PartyPopper, Star, Target, Briefcase,
  Cake, Heart, Video, Flag, Sparkles,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const HERO_HIGHLIGHTS = [
  { icon: Car, title: 'Exotic Supercars', desc: 'Ferrari, Lamborghini, McLaren' },
  { icon: Zap, title: 'High Performance', desc: 'Ultimate driving experience' },
  { icon: UserCog, title: 'Flexible Options', desc: 'Self-drive or chauffeur' },
];

const WHY_SPORTS_CAR = [
  { icon: Trophy, anim: 'lift', title: 'Ultimate Experience', desc: 'Dream car driving' },
  { icon: Gem, anim: 'pulse', title: 'Luxury & Style', desc: 'Arrive in elegance' },
  { icon: Camera, anim: 'tick', title: 'Memorable Photos', desc: 'Instagram-worthy' },
  { icon: PartyPopper, anim: 'grow', title: 'Special Occasions', desc: 'Weddings, parties, events' },
  { icon: Zap, anim: 'drive', title: 'High Performance', desc: 'Thrilling power' },
  { icon: Star, anim: 'pulse', title: 'VIP Treatment', desc: 'Feel like celebrity' },
  { icon: Target, anim: 'wrench', title: 'Bucket List', desc: 'Fulfill your dreams' },
  { icon: Briefcase, anim: 'drive', title: 'Corporate Events', desc: 'Impress clients' },
];

const PERFECT_OCCASIONS = [
  { icon: Heart, anim: 'pulse', occasion: 'Weddings', desc: 'Grand entry & exit' },
  { icon: Cake, anim: 'lift', occasion: 'Birthdays', desc: 'Memorable celebration' },
  { icon: Sparkles, anim: 'grow', occasion: 'Proposals', desc: 'Romantic surprise' },
  { icon: Camera, anim: 'tick', occasion: 'Photo Shoots', desc: 'Luxury backdrops' },
  { icon: Briefcase, anim: 'drive', occasion: 'Corporate Events', desc: 'VIP transport' },
  { icon: Video, anim: 'pulse', occasion: 'Music Videos', desc: 'Film production' },
  { icon: Flag, anim: 'drive', occasion: 'Joy Rides', desc: 'Weekend thrill' },
  { icon: Sparkles, anim: 'wrench', occasion: 'Bucket List', desc: 'Fulfill dreams' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

export const metadata: Metadata = {
  title: 'Sports Car Rental | Supercar Hire from ₹25000 | Ferrari',
  description: formatPriceHighlight('Rent sports cars & supercars. Ferrari, Lamborghini, Porsche available. Luxury sports car hire @₹25000/day. Self-drive & chauffeur options.'),
  keywords: [
    'sports car rental',
    'supercar rental india',
    'sports car hire',
    'Ferrari rental',
    'Lamborghini booking',
    'luxury sports car',
    'supercar hire india',
    'sports car for wedding',
    'exotic car rental',
    'Porsche rental',
    'McLaren hire',
    'premium sports car',
  ],
  openGraph: {
    title: formatPriceHighlight('Sports Car Rental India | Ferrari, Lamborghini @₹25000/Day'),
    description: formatPriceHighlight('Rent exotic supercars - Ferrari, Lamborghini, Porsche. Ultimate luxury sports car experience.'),
  },
};

export default function SportsCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Sports Car on TransRentals"
        description="Book a sports car or supercar rental in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Choose City & Date', text: 'Select your city and rental date. Sports cars available for day, weekend, or special event packages.' },
          { name: 'Pick Your Dream Car', text: 'Choose from Ferrari, Lamborghini, Porsche, or other luxury sports cars. Self-drive and chauffeur options available.' },
          { name: 'Complete Premium KYC', text: 'Submit DL, Aadhaar, and PAN. Pay higher security deposit for supercar category. Personal interview may be required.' },
          { name: 'Drive in Style', text: 'Collect car at designated location. Enjoy professional handover with complete walkthrough of features.' },
        ]}
      />
      <SpecialtyCarBookingHero service="sports" />


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-700 to-red-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sports Car Rental | Supercar Hire India
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Ferrari, Lamborghini, Porsche & More | Starting @₹25,000/Day
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              {HERO_HIGHLIGHTS.map((item) => (
                <div key={item.title} className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <item.icon className="w-7 h-7 mb-2 text-white" strokeWidth={1.7} />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm opacity-90">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-red-800 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#cars"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-800 transition"
              >
                View Supercars
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sports Car */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
              Why Rent a <span className="text-emerald-600">Sports Car?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHY_SPORTS_CAR.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `spc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spc-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="spc-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="sports-car-rental" title="Sports Car Rental in Available Cities" />

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Perfect for <span className="text-emerald-600">Special Occasions</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PERFECT_OCCASIONS.map((item, idx) => (
              <div
                key={item.occasion}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `spc-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.occasion}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Options */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sports Car Rental Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-red-900">Car Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Latest supercar models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Pristine condition vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>High-performance engines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Exotic interiors & features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Advanced safety systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Regularly serviced & maintained</span>
                </li>
              </ul>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-orange-900">Rental Options</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Self-drive (with deposit)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Professional chauffeur included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Hourly, daily, weekly rentals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Comprehensive insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>24/7 support & assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Doorstep delivery available</span>
                </li>
              </ul>
            </div>
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
        <div className="container-custom max-w-5xl relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Sports Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'How much does sports car rental cost in India?',
                a: 'Sports car rental starts from ₹25,000/day for Nissan GT-R. Premium supercars like Ferrari cost ₹80,000/day, Lamborghini ₹75,000/day. Hourly packages also available.',
              },
              {
                q: 'Can I self-drive a sports car?',
                a: 'Yes, self-drive is available with valid license (minimum 3 years experience) and high security deposit. Professional chauffeur service also available for all supercars.',
              },
              {
                q: 'Which sports cars are available in India?',
                a: 'We have Lamborghini Huracan, Ferrari 488, Porsche 911, McLaren 570S, Audi R8, and Nissan GT-R. Availability varies by city.',
              },
              {
                q: 'What documents are required for sports car rental?',
                a: 'You need valid driving license (3+ years), Aadhar card, PAN card, address proof, and high-value security deposit (₹2-5 lakhs depending on car).',
              },
              {
                q: 'Is insurance included in sports car rental?',
                a: 'Yes, comprehensive insurance is included. However, high deductible applies. Any damage during rental period may require payment as per insurance terms.',
              },
              {
                q: 'Can I rent sports car for wedding?',
                a: 'Yes! Sports cars are very popular for weddings - groom entry, couple exit, photo shoots. We provide professional chauffeur and maintain pristine condition.',
              },
            ].map((faq, idx) => (
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
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
