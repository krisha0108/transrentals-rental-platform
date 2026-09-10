import { Metadata } from 'next';
import Link from 'next/link';
import { Mountain, ShieldCheck, Briefcase, Fuel, MessageCircleQuestion, Plus, Route, Clock, ArrowRight, Compass, Bike } from 'lucide-react';
import { BikeHeroWithLocation } from '@/components/bike/BikeHeroWithLocation';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_HIMALAYAN = [
  { icon: Mountain, anim: 'lift', title: 'Built for Mountains', desc: 'High altitude proven' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Tough & Reliable', desc: 'Handles rough roads' },
  { icon: Briefcase, anim: 'drive', title: 'Luggage Ready', desc: 'Panniers & top box' },
  { icon: Fuel, anim: 'fill', title: 'Great Mileage', desc: '30+ km/l economy' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent ke
   "Excavator Applications" section me hai — top icon-ring, sheen on hover. */
const WCS_CSS = `
.wcs-card {
  opacity: 0;
  animation: wcs-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes wcs-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.wcs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.wcs-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.wcs-card:hover .wcs-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .wcs-card { opacity: 1; animation: none; }
  .wcs-card:hover { transform: none; }
  .wcs-sheen { display: none; }
}
`;

const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  lift: 'group-hover:-translate-y-2',
  fill: 'group-hover:-translate-y-1.5',
};

export const metadata: Metadata = {
  title: 'Himalayan on Rent | Royal Enfield Himalayan @₹1499/Day | TransRentals',
  description: 'Rent Royal Enfield Himalayan for Ladakh, Spiti, Himalayan tours. Adventure touring bike with 411cc engine. Starting ₹1499/day. Book now!',
  keywords: ['himalayan on rent', 'royal enfield himalayan rent', 'himalayan bike rental', 'adventure bike rental'],
  openGraph: { title: 'Himalayan on Rent @₹1499/Day | TransRentals', url: 'https://transrentals.in/himalayan-on-rent' },
  alternates: { canonical: 'https://transrentals.in/himalayan-on-rent' },
};

const FAQS = [
  { question: 'What is the rental price of Royal Enfield Himalayan?', answer: 'Himalayan rental starts at ₹1499/day. Discounts apply for multi-day bookings — get an exact quote based on your route and trip duration.' },
  { question: 'Which Himalayan variants are available?', answer: 'Both the proven Himalayan 411cc and the newer Himalayan 450 are available for rent, subject to city and stock availability.' },
  { question: 'Is the Himalayan suitable for Ladakh and Spiti trips?', answer: 'Yes, the Himalayan is purpose-built for high-altitude touring and is the top choice for the Manali-Leh, Srinagar-Leh, and Spiti Valley circuits listed on this page.' },
  { question: 'What documents and deposit are required to rent a Himalayan?', answer: 'A valid motorcycle driving license and Aadhaar/PAN are required, along with a refundable security deposit — set higher for multi-day outstation adventure rentals.' },
  { question: 'Are panniers and crash guards included with the rental?', answer: 'Panniers, crash guards, and USB charger fitment can be requested at booking; availability depends on the vendor and city.' },
];

export default function HimalayanOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent Royal Enfield Himalayan on TransRentals"
        description="Book Royal Enfield Himalayan for adventure tours in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Choose Pickup City & Dates', text: 'Select your city and rental period. Himalayan available in Manali, Leh, Delhi, Shimla, and more.' },
          { name: 'Check Model & Add-ons', text: 'Confirm Himalayan 411cc availability. Ask about panniers, crash guards, and USB charger fitment.' },
          { name: 'Submit Documents', text: 'Upload DL (with motorcycle class), Aadhaar/PAN. Pay deposit and advance for multi-day adventure tours.' },
          { name: 'Receive Bike & Ride', text: 'Collect Himalayan at vendor. Do inspection with checklist. Begin your mountain adventure safely.' },
        ]}
      />
      <BikeHeroWithLocation />

      <section className="wcs relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: WCS_CSS }} />
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
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Rent <span className="text-emerald-600">Himalayan?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-5xl mx-auto">
            {WHY_HIMALAYAN.map((item, idx) => (
              <div
                key={item.title}
                className="wcs-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="wcs-sheen" />
                <div className="relative">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Popular Routes for Himalayan
            </h2>
            <p className="text-gray-500">Mountain circuits riders take the Himalayan on most often</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { route: 'Manali to Leh', days: '5-7 days', km: '490 km', anim: 'lift' },
              { route: 'Srinagar to Leh', days: '2-3 days', km: '420 km', anim: 'drive' },
              { route: 'Spiti Circuit', days: '7-8 days', km: '600 km', anim: 'pulse' },
              { route: 'Kinnaur Valley', days: '4-5 days', km: '350 km', anim: 'fill' },
            ].map((item) => (
              <div key={item.route} className="group relative flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Route className={`w-6 h-6 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[item.anim]}`} strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1.5">{item.route}</h3>
                <p className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {item.days} &bull; {item.km}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="himalayan-on-rent" title="Himalayan Rental in Available Cities" />

      <section className="relative py-16 md:py-24 bg-white overflow-hidden">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Other Bikes
            </h2>
            <p className="text-gray-500">Looking for something else? These are also available</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { href: '/royal-enfield-on-rent', icon: Bike, title: 'Royal Enfield', desc: 'Classic, Bullet, Meteor' },
              { href: '/ktm-on-rent', icon: Bike, title: 'KTM on Rent', desc: 'Duke, RC series' },
              { href: '/bike-tours/leh-ladakh', icon: Compass, title: 'Ladakh Bike Tour', desc: 'Guided tours' },
              { href: '/bike-on-rent', icon: ArrowRight, title: 'All Bikes', desc: 'View all options' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                <p className="text-[12.5px] text-gray-500 mb-3">{item.desc}</p>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700 mt-auto">
                  Explore
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
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
              Himalayan Rental <span className="text-emerald-600">FAQs</span>
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
