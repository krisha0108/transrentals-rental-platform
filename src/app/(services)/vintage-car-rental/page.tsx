import { Metadata } from 'next';
import Link from 'next/link';
import {
  Car, Heart, Sparkles, Crown, Camera, Palette, Gem, UserCog, Star,
  Music2, Landmark, Video, Briefcase, Cake, Check,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const HERO_HIGHLIGHTS = [
  { icon: Car, title: 'Heritage Cars', desc: 'Ambassador & classic models' },
  { icon: Heart, title: 'Wedding Perfect', desc: 'Ideal for baraat & photos' },
  { icon: Sparkles, title: 'Decoration Included', desc: 'Vintage-style decoration' },
];

const WHY_VINTAGE = [
  { icon: Crown, anim: 'lift', title: 'Royal Appeal', desc: 'Classic vintage charm' },
  { icon: Camera, anim: 'tick', title: 'Photo Perfect', desc: 'Stunning wedding photos' },
  { icon: Palette, anim: 'pulse', title: 'Unique Style', desc: 'Stand out from crowd' },
  { icon: Gem, anim: 'pulse', title: 'Heritage Value', desc: 'Timeless elegance' },
  { icon: Sparkles, anim: 'grow', title: 'Custom Decoration', desc: 'Vintage-style decor' },
  { icon: UserCog, anim: 'wrench', title: 'Uniformed Driver', desc: 'Traditional chauffeur' },
  { icon: Heart, anim: 'pulse', title: 'Traditional Weddings', desc: 'Perfect for baraat' },
  { icon: Star, anim: 'lift', title: 'Memorable Entry', desc: 'Unforgettable arrival' },
];

const FEATURE_PANELS = [
  {
    icon: Car,
    title: 'Car Features',
    items: [
      'Well-restored classic cars',
      'Pristine original condition',
      'Maintained regularly',
      'Period-appropriate interiors',
      'Photo-ready exteriors',
      'Unique vintage appeal',
    ],
  },
  {
    icon: Palette,
    title: 'Decoration Options',
    items: [
      'Vintage-style flower decoration',
      'Traditional ribbons & bows',
      'Heritage-themed decor',
      'Custom nameplate available',
      'Period-appropriate styling',
      'Professional uniformed driver',
    ],
  },
];

const PERFECT_OCCASIONS = [
  { icon: Music2, anim: 'ring', occasion: 'Baraat Entry', desc: 'Traditional groom arrival' },
  { icon: Camera, anim: 'tick', occasion: 'Wedding Photos', desc: 'Stunning photo backdrops' },
  { icon: Heart, anim: 'pulse', occasion: 'Reception', desc: 'Grand couple entry' },
  { icon: Camera, anim: 'tick', occasion: 'Pre-Wedding Shoot', desc: 'Vintage theme shoots' },
  { icon: Landmark, anim: 'lift', occasion: 'Heritage Events', desc: 'Traditional functions' },
  { icon: Video, anim: 'pulse', occasion: 'Film Shoots', desc: 'Period dramas' },
  { icon: Briefcase, anim: 'drive', occasion: 'Corporate Events', desc: 'Retro theme parties' },
  { icon: Cake, anim: 'grow', occasion: 'Birthday Parties', desc: 'Unique celebrations' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

export const metadata: Metadata = {
  title: 'Vintage Car Rental | Classic Car for Wedding from ₹8999',
  description: formatPriceHighlight('Rent vintage cars for weddings. Classic Ambassador, retro cars available. Vintage car for baraat. Heritage car booking @₹8999. Photo shoot ready.'),
  keywords: [
    'vintage car rental',
    'vintage car for wedding',
    'classic car hire',
    'ambassador car rental',
    'retro car booking',
    'vintage car for baraat',
    'heritage car rental',
    'classic car for wedding',
    'vintage ambassador',
    'old car rental',
    'vintage car hire india',
    'retro car hire',
  ],
  openGraph: {
    title: formatPriceHighlight('Vintage Car Rental India | Classic Cars for Wedding @₹8999'),
    description: formatPriceHighlight('Rent vintage & classic cars for weddings. Ambassador, heritage cars. Perfect for baraat and photo shoots.'),
  },
};

export default function VintageCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Vintage Car on TransRentals"
        description="Book a classic or vintage car for weddings and events in 4 steps."
        totalTime="PT10M"
        steps={[
          { name: 'Share Event Details', text: 'Enter event date, location, duration, and purpose — wedding baraat, photo shoot, or heritage event.' },
          { name: 'Choose Vintage Model', text: 'Select Classic Ambassador, retro Fiat, or other heritage cars. Confirm if decoration is required.' },
          { name: 'Review Vintage Car Package', text: 'Check included hours, chauffeur attire, decoration options, and additional mileage charges.' },
          { name: 'Confirm & Celebrate', text: 'Pay advance to confirm. Vintage car arrives decorated at your venue on event day.' },
        ]}
      />
      <SpecialtyCarBookingHero service="vintage" />


      {/* Vintage Car Highlights */}
      <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-emerald-50/30 via-white to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" /> {formatPriceHighlight('Starting @₹8,999')}
            </div>
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Classic & <span className="text-emerald-600">Heritage Cars</span> for Every Occasion
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {HERO_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon className="w-6 h-6 text-emerald-600 transition-colors duration-300 group-hover:text-white" strokeWidth={1.7} />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-9">
            <Link
              href="#available-cities"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Available Cities
            </Link>
          </div>
        </div>
      </section>

      {/* Why Vintage Car */}
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
              Why Choose <span className="text-emerald-600">Vintage Car</span> for Wedding?
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHY_VINTAGE.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `vtg-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
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
          @keyframes vtg-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="vtg-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <div id="available-cities">
        <StaticServicePopularCitiesGrid serviceSlug="vintage-car-rental" title="Vintage Car Rental in Available Cities" />
      </div>

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
                style={{ animation: `vtg-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
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

      {/* Decoration & Features */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Vintage Car <span className="text-emerald-600">Features & Decoration</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {FEATURE_PANELS.map((panel) => (
              <div
                key={panel.title}
                className="rounded-[18px] border border-gray-100 shadow-sm overflow-hidden bg-white flex max-w-lg mx-auto md:max-w-none"
              >
                <div className="w-[104px] shrink-0 bg-emerald-50 flex items-center justify-center">
                  <panel.icon className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">{panel.title}</h3>
                  <ul className="space-y-2.5">
                    {panel.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
        <div className="container-custom max-w-5xl relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Vintage Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'How much does vintage car rental cost for wedding?',
                a: 'Vintage car rental starts from ₹8999 for 4 hours (baraat). Ambassador costs ₹8999-9999. Rare models like Fiat and Standard Herald cost ₹12999-14999. Full day package available.',
              },
              {
                q: 'Which vintage cars are available in India?',
                a: 'We have Ambassador Classic, Ambassador Mark II, Fiat Vintage, Standard Herald, Premier Padmini, and Vintage Jeep. All are well-maintained heritage cars.',
              },
              {
                q: 'Is decoration included in vintage car rental?',
                a: 'Yes! Basic vintage-style flower decoration with ribbons is included FREE. Premium heritage-themed decoration available at extra cost.',
              },
              {
                q: 'Can I rent vintage car for pre-wedding shoot?',
                a: 'Yes! We offer 2-3 hour packages for photo shoots starting @₹6999. Perfect for pre-wedding, engagement, and themed photography.',
              },
              {
                q: 'Are vintage cars well-maintained?',
                a: 'Yes, all our vintage cars are regularly maintained, well-restored, and in pristine condition. We ensure they are photo-ready and reliable for your event.',
              },
              {
                q: 'How early should I book a vintage car?',
                a: 'We recommend booking 3-4 weeks in advance, especially during wedding season. Vintage cars are limited in number and high in demand.',
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
