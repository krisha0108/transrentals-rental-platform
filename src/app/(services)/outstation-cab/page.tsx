import { Metadata } from 'next';
import {
  Wallet, Car, UserCheck, Route, RefreshCw, Clock, ShieldCheck, Smartphone,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('Outstation Cab | Intercity Taxi @₹12/Km | Round Trip Car Rental India'),
  description: formatPriceHighlight('Book outstation taxi for intercity travel. Round trip & one-way cabs. Sedan, SUV, tempo available. Station taxi service across India. AC cars @₹12/km.'),
  keywords: [
    'outstation cab',
    'outstation taxi',
    'intercity cab',
    'round trip cab',
    'outstation car rental',
    'station taxi',
    'intercity travel',
    'outstation taxi service',
    'one way outstation cab',
    'round trip taxi',
    'intercity car rental',
    'station cab service',
  ],
  openGraph: {
    title: formatPriceHighlight('Outstation Cab India | Intercity Taxi @₹12/Km | Round Trip'),
    description: formatPriceHighlight('Book outstation cabs for intercity travel across India. Sedan, SUV available. Round trip & one-way options.'),
  },
};

const WHY_CHOOSE = [
  { icon: Wallet, anim: 'lift', title: 'Affordable Rates', desc: 'Starting @₹12/km only' },
  { icon: Car, anim: 'drive', title: 'Clean AC Cars', desc: 'Well-maintained vehicles' },
  { icon: UserCheck, anim: 'lift', title: 'Experienced Drivers', desc: 'Professional chauffeurs' },
  { icon: Route, anim: 'drive', title: 'All Routes Covered', desc: 'Pan-India connectivity' },
  { icon: RefreshCw, anim: 'tick', title: 'Round Trip Option', desc: 'Save on return journey' },
  { icon: Clock, anim: 'tick', title: 'Flexible Timing', desc: 'Travel at your convenience' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Fully Insured', desc: 'Safe & secure travel' },
  { icon: Smartphone, anim: 'pulse', title: 'Easy Booking', desc: 'Book online in minutes' },
];

const OUTSTATION_CAB_FAQS = [
  { q: 'How much does outstation cab cost?', a: 'Outstation cab starts from ₹12/km for sedan. SUVs cost ₹16-22/km. Price includes driver, fuel, tolls, and taxes. Round trip is more economical.' },
  { q: 'What is included in outstation cab fare?', a: 'Fare includes driver charges, fuel (both ways), driver allowance (bata), toll taxes, state taxes, parking, and GST. No hidden charges.' },
  { q: 'Can I book one-way outstation cab?', a: 'Yes! One-way drop is available at slightly higher per km rate (₹14-25/km). Round trip is more economical as return charges are included.' },
  { q: 'How is outstation cab fare calculated?', a: 'Fare = Distance (km) × Per km rate. For round trip, total distance (both ways) is calculated. Minimum 250km per day applies for multi-day trips.' },
  { q: 'Are toll charges included in outstation cab?', a: 'Yes, all toll charges, parking fees, state entry taxes are included in the fare. No extra charges.' },
  { q: 'Can I extend my outstation cab booking?', a: 'Yes, you can extend your booking. Additional charges will apply as per the per km rate and extra days. Inform driver or customer support.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai. */
const OSC_CSS = `
.osc-card {
  opacity: 0;
  animation: osc-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes osc-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.osc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.osc-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.osc-card:hover .osc-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .osc-card { opacity: 1; animation: none; }
  .osc-card:hover { transform: none; }
  .osc-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
};

export default async function OutstationCabPage() {
  return (
    <>
      <HowToSchema
        name="How to Book an Outstation Cab on TransRentals"
        description="Book an intercity taxi in 4 simple steps. AC cabs with professional drivers."
        totalTime="PT8M"
        steps={[
          { name: 'Select Trip Type & Route', text: 'Choose one-way or round-trip. Enter departure city, destination, and travel date.' },
          { name: 'Pick Car Category', text: 'Select economy sedan, premium sedan, or SUV. All come with experienced intercity drivers.' },
          { name: 'Compare & Confirm Rate', text: 'Review per-km pricing with inclusions — driver allowance, toll (in select plans), and GST.' },
          { name: 'Pay & Track', text: 'Confirm booking with advance payment. Receive driver contact. Track cab on travel day.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="outstation-cab" />

      {/* Why Outstation Cab */}
      <section className="osc relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: OSC_CSS }} />
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
              Why Choose <span className="text-emerald-600">Outstation Cab</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="osc-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="osc-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Grid */}
      <StaticServicePopularCitiesGrid serviceSlug="outstation-cab" title="Outstation Cab in Available Cities" />

      {/* Features & Amenities */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Outstation Cab <span className="text-emerald-600">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Included in Fare</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Experienced driver',
                  'Fuel charges (both ways)',
                  'Driver allowance',
                  'State taxes & tolls',
                  'GST included',
                  'Full vehicle insurance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Service Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Clean & sanitized cars',
                  'Doorstep pickup & drop',
                  'Flexible stop-overs allowed',
                  'No hidden charges',
                  '24/7 customer support',
                  'Easy cancellation policy',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
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
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Outstation Cab <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {OUTSTATION_CAB_FAQS.map((faq, idx) => (
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

    </>
  );
}
