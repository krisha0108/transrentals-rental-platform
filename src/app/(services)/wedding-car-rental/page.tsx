import { Metadata } from 'next';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';
import {
  MessageCircleQuestion, Plus, Sparkles, Palette, Camera, Gem, UserCheck, MapPin, Target, Wallet,
  Heart, PartyPopper, Flower2, Music, HeartHandshake,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wedding Car Rental | Shadi Car on Rent from ₹2999',
  description: formatPriceHighlight('Book wedding cars for your special day. Luxury sedans, vintage cars, decorated cars. Baraat car rental, bride/groom car hire. Pan-India service.'),
  keywords: [
    'wedding car rental',
    'shadi car on rent',
    'baraat car hire',
    'wedding car decoration',
    'bride car rental',
    'groom car hire',
    'dulhan car',
    'marriage car booking',
    'vintage wedding car',
    'luxury wedding car',
    'decorated car for wedding',
  ],
  openGraph: {
    title: formatPriceHighlight('Wedding Car Rental India | Shadi Car @₹2999/Day | TransRentals'),
    description: formatPriceHighlight('Premium wedding cars for your special day. Baraat, bride & groom cars available. Book decorated cars across India.'),
  },
};

const WHY_WEDDING = [
  { icon: Sparkles, anim: 'pulse', title: 'Grand Entry', desc: 'Make your baraat unforgettable' },
  { icon: Palette, anim: 'lift', title: 'Custom Decoration', desc: 'Flowers & ribbons included' },
  { icon: Camera, anim: 'tick', title: 'Photo-Ready Cars', desc: 'Perfect for wedding photography' },
  { icon: Gem, anim: 'pulse', title: 'Luxury Options', desc: 'Vintage, sports & premium cars' },
  { icon: UserCheck, anim: 'lift', title: 'Uniformed Chauffeur', desc: 'Professional drivers in uniform' },
  { icon: MapPin, anim: 'drive', title: 'All-India Service', desc: 'Available in 287+ cities' },
  { icon: Target, anim: 'pulse', title: 'On-Time Arrival', desc: 'Punctuality guaranteed' },
  { icon: Wallet, anim: 'lift', title: 'Affordable Packages', desc: 'Starting @₹2999 only' },
];

const WEDDING_OCCASIONS = [
  { icon: Music, anim: 'tick', occasion: 'Baraat (बारात)', desc: 'Groom arrival in style' },
  { icon: Heart, anim: 'pulse', occasion: 'Bride Entry', desc: 'Dulhan car service' },
  { icon: PartyPopper, anim: 'grow', occasion: 'Reception', desc: 'Couple car for reception' },
  { icon: Flower2, anim: 'grow', occasion: 'Haldi/Mehendi', desc: 'Pre-wedding functions' },
  { icon: Gem, anim: 'pulse', occasion: 'Engagement', desc: 'Ring ceremony car' },
  { icon: Music, anim: 'tick', occasion: 'Sangeet', desc: 'Musical night arrival' },
  { icon: HeartHandshake, anim: 'lift', occasion: 'Phera/Vidaai', desc: 'Ceremony & send-off' },
  { icon: Camera, anim: 'tick', occasion: 'Photo Shoot', desc: 'Wedding photography' },
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
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

const WEDDING_FAQS = [
  { question: 'How much does wedding car rental cost in India?', answer: 'Wedding car rental starts from ₹2999 for 4 hours. Premium luxury cars like Mercedes cost ₹6999-9999 per day. Decoration is included in all packages.' },
  { question: 'Is car decoration included in wedding car rental?', answer: 'Yes! Basic flower decoration with ribbons is included FREE. Premium decoration with LED lights and full floral wrapping available at ₹1500 extra.' },
  { question: 'Which cities have wedding car rental service?', answer: 'We provide wedding car rental in 287+ cities across India including all metros, tier 2 cities, and popular wedding destinations.' },
  { question: 'Can I book a vintage car for my wedding?', answer: 'Yes! We have vintage Ambassador and classic cars available for Indian weddings. These are very popular for traditional baraat entries.' },
  { question: 'Do you provide chauffeur service for wedding cars?', answer: 'Yes, all wedding cars come with professional uniformed chauffeur. The driver will be well-groomed and punctual for your special day.' },
  { question: 'How early should I book a wedding car?', answer: 'We recommend booking at least 2-3 weeks in advance, especially during wedding season (November-February). Early booking ensures car availability and better prices.' },
];

export default function WeddingCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a Wedding Car on TransRentals"
        description="Book a decorated wedding car for your special day in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Wedding Details', text: 'Share wedding date, venue location, required timing, and number of cars needed for the event.' },
          { name: 'Choose Car Type', text: 'Select luxury sedan, SUV, vintage car, or convertible. Specify if car decoration is required.' },
          { name: 'Review Package', text: 'Check package hours, included km, decoration charges, and chauffeur dress code.' },
          { name: 'Confirm & Celebrate', text: 'Pay advance to book. Decorated wedding car arrives at your venue on schedule. Complimentary flower decoration available.' },
        ]}
      />
      <SpecialtyCarBookingHero service="wedding" />

      {/* Why Wedding Car Rental */}
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
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Why Choose Our Wedding Car Rental?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_WEDDING.map((item, idx) => (
              <div
                key={item.title}
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
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="wedding-car-rental" title="Wedding Car Rental in Available Cities" />

      {/* Wedding Occasions */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect for All Wedding Functions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WEDDING_OCCASIONS.map((item, idx) => (
              <div
                key={item.occasion}
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
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{item.occasion}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{item.desc}</p>
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
              Wedding Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {WEDDING_FAQS.map((faq, idx) => (
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
    </>
  );
}
