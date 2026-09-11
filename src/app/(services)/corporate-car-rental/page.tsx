import { Metadata } from 'next';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';
import {
  MessageCircleQuestion, Plus, Briefcase, Clock, Wallet, Smartphone, Car, UserCheck, BarChart3, ShieldCheck,
  Handshake, Plane, Target, Construction, Users, Moon,
} from 'lucide-react';
export const metadata: Metadata = {
  title: 'Corporate Car Rental | Employee Transport @₹15000/Month | Business Taxi',
  description: 'Corporate car rental for employee transport, business meetings. Monthly car lease for companies. Professional chauffeur. Fleet management @₹15000/month.',
  keywords: [
    'corporate car rental',
    'corporate taxi',
    'employee transport',
    'business car rental',
    'company car lease',
    'office cab service',
    'corporate fleet',
    'business taxi service',
    'employee cab',
    'corporate chauffeur',
    'business car hire',
    'office transport',
  ],
  openGraph: {
    title: 'Corporate Car Rental India | Employee Transport @₹15000/Month',
    description: 'Professional corporate car rental for businesses. Employee transport, meetings, airport transfers.',
  },
};

const WHY_CORPORATE = [
  { icon: Briefcase, anim: 'drive', title: 'Professional Image', desc: 'Enhance company reputation' },
  { icon: Clock, anim: 'tick', title: 'Punctuality', desc: 'Always on-time service' },
  { icon: Wallet, anim: 'pulse', title: 'Cost Effective', desc: 'Save on vehicle costs' },
  { icon: Smartphone, anim: 'lift', title: 'Easy Management', desc: 'Online booking & tracking' },
  { icon: Car, anim: 'drive', title: 'Well-Maintained', desc: 'Premium vehicles' },
  { icon: UserCheck, anim: 'lift', title: 'Professional Drivers', desc: 'Courteous chauffeurs' },
  { icon: BarChart3, anim: 'lift', title: 'Detailed Reports', desc: 'Monthly billing statements' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Fully Insured', desc: 'Complete coverage' },
];

const PERFECT_FOR = [
  { icon: Car, anim: 'drive', occasion: 'Employee Commute', desc: 'Daily office transport' },
  { icon: Handshake, anim: 'pulse', occasion: 'Client Meetings', desc: 'Professional image' },
  { icon: Plane, anim: 'drive', occasion: 'Airport Transfers', desc: 'Business travelers' },
  { icon: Target, anim: 'pulse', occasion: 'Events & Conferences', desc: 'Group coordination' },
  { icon: Construction, anim: 'pulse', occasion: 'Site Visits', desc: 'Field operations' },
  { icon: Users, anim: 'lift', occasion: 'Guest Transport', desc: 'VIP guests' },
  { icon: BarChart3, anim: 'lift', occasion: 'Sales Team', desc: 'Multiple client visits' },
  { icon: Moon, anim: 'tick', occasion: 'Night Shifts', desc: '24/7 operations' },
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
};

const CORPORATE_FAQS = [
  { question: 'How much does corporate car rental cost?', answer: 'Corporate car rental starts from ₹15,000/month for employee transport. Executive cars cost ₹25,000-40,000/month. Pricing depends on usage, vehicle type, and service hours.' },
  { question: 'What is included in corporate car rental?', answer: 'Package includes vehicle, professional driver, fuel, maintenance, insurance, GPS tracking, and dedicated support. Monthly billing with detailed reports provided.' },
  { question: 'Can we rent cars for multiple employees?', answer: 'Yes! We provide fleet management for companies. You can rent multiple vehicles for different employees or teams with centralized billing and management.' },
  { question: 'Do you provide cars for corporate events?', answer: 'Yes, we provide dedicated transport for corporate events, conferences, seminars. Options from sedans to tempo travellers for group transport.' },
  { question: 'Is GST invoice provided for corporate bookings?', answer: 'Yes! We provide proper GST invoices for all corporate bookings. This helps companies claim tax benefits and maintain proper accounts.' },
  { question: 'What is the minimum contract period?', answer: 'Minimum contract is 1 month for monthly packages. For daily bookings, no minimum commitment required. Flexible terms for long-term contracts.' },
];

export default function CorporateCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book Corporate Car Rental on TransRentals"
        description="Set up corporate car rental or employee cab service in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Share Corporate Requirements', text: 'Submit number of employees, shift timings, pickup/drop locations, and required vehicle category.' },
          { name: 'Choose Fleet Type', text: 'Select sedan for executives, SUV for senior management, or hatchback for bulk employee transport.' },
          { name: 'Get Corporate Rate Card', text: 'Receive monthly rate quotes from verified vendors. Compare per-trip and monthly contract options.' },
          { name: 'Sign Contract & Deploy', text: 'Sign the fleet agreement, share employee data, and the service goes live on agreed start date.' },
        ]}
      />
      <SpecialtyCarBookingHero service="corporate" />

      {/* Why Corporate Car Rental */}
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
            Why Choose Corporate Car Rental?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CORPORATE.map((item, idx) => (
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
      <StaticServicePopularCitiesGrid serviceSlug="corporate-car-rental" title="Corporate Car Rental in Available Cities" />

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect for All Business Needs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
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

      {/* Features & Benefits */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Corporate Car Rental Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-slate-800">Service Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Professional chauffeurs in uniform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Well-maintained AC vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>GPS tracking & monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Punctuality guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Full vehicle insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-gray-800">Business Benefits</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Monthly consolidated billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Detailed trip reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>GST invoices for tax benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>No maintenance headaches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Scalable fleet size</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Dedicated account manager</span>
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
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Corporate Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {CORPORATE_FAQS.map((faq, idx) => (
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
