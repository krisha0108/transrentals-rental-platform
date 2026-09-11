import { Metadata } from 'next';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';
import {
  MessageCircleQuestion, Plus, Wallet, Wrench, ShieldCheck, RefreshCw, Car, Smartphone, Fuel, Target,
  Briefcase, Palmtree, Construction, GraduationCap, Search, Ban,
} from 'lucide-react';

export const metadata: Metadata = {
  title: formatPriceHighlight('Monthly Car Rental | Car Subscription @₹12000/Month | Long Term Car Lease'),
  description: formatPriceHighlight('Rent car on monthly basis. Car subscription service. Long term car rental @₹12000/month. Self-drive & chauffeur options. All-inclusive package.'),
  keywords: [
    'monthly car rental',
    'car subscription',
    'monthly car lease',
    'long term car rental',
    'car on monthly rent',
    'car subscription india',
    'monthly car hire',
    'long term car lease',
    'car for month',
    'subscription car service',
    'monthly self drive',
    'car rental per month',
  ],
  openGraph: {
    title: formatPriceHighlight('Monthly Car Rental India | Car Subscription @₹12000/Month'),
    description: formatPriceHighlight('Subscribe to cars monthly. All-inclusive packages. Self-drive & chauffeur options available.'),
  },
};

const WHY_MONTHLY = [
  { icon: Wallet, anim: 'pulse', title: 'Cost Effective', desc: 'Cheaper than daily rental' },
  { icon: Wrench, anim: 'wrench', title: 'Zero Maintenance', desc: 'We handle everything' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Fully Insured', desc: 'Complete insurance coverage' },
  { icon: RefreshCw, anim: 'tick', title: 'Flexible Terms', desc: '1 month to 12+ months' },
  { icon: Car, anim: 'drive', title: 'Latest Models', desc: 'Well-maintained vehicles' },
  { icon: Smartphone, anim: 'lift', title: 'Easy Process', desc: 'Quick documentation' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Included', desc: 'Optional fuel packages' },
  { icon: Target, anim: 'pulse', title: 'No Commitment', desc: 'Cancel anytime' },
];

const PERFECT_FOR = [
  { icon: Briefcase, anim: 'drive', title: 'Job Transfer', desc: 'Relocated for work' },
  { icon: Palmtree, anim: 'grow', title: 'Long Vacation', desc: 'Extended stay, tourism' },
  { icon: Construction, anim: 'pulse', title: 'Project Work', desc: 'Temporary assignment' },
  { icon: GraduationCap, anim: 'lift', title: 'Students', desc: 'College semester' },
  { icon: Search, anim: 'pulse', title: 'Try Before Buy', desc: 'Test drive for months' },
  { icon: Wrench, anim: 'wrench', title: 'Own Car Repair', desc: 'Temporary replacement' },
  { icon: Ban, anim: 'lift', title: 'Avoid Ownership', desc: 'No maintenance hassle' },
  { icon: Briefcase, anim: 'drive', title: 'Business Use', desc: 'Flexible business needs' },
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
  wrench: 'group-hover:rotate-45',
  lift: 'group-hover:-translate-y-2',
  fill: 'group-hover:-translate-y-1.5',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

function AppCard({ item, idx }: { item: typeof WHY_MONTHLY[number]; idx: number }) {
  return (
    <div
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
  );
}

const FAQS = [
  { question: 'How much does monthly car rental cost?', answer: 'Monthly car rental starts from ₹12,000/month for hatchback with 2000 km. Sedan costs ₹18,000-22,000, SUV ₹25,000-30,000. Chauffeur extra ₹15,000-20,000.' },
  { question: 'What is included in monthly rental?', answer: 'Includes vehicle for 30 days, maintenance, insurance, roadside assistance, replacement car. Fuel NOT included - you pay for fuel.' },
  { question: 'What happens if I exceed km limit?', answer: 'Extra km charges apply: ₹6-12 per km depending on car type. You can also upgrade to higher km package.' },
  { question: 'Can I extend my monthly rental?', answer: 'Yes! You can extend month by month. Just renew before end date. Long term rentals (3+ months) get better rates.' },
  { question: 'What documents are needed?', answer: 'You need valid driving license (minimum 1 year old), Aadhar card, address proof, PAN card, and refundable security deposit.' },
  { question: 'Is insurance included in monthly rental?', answer: 'Yes, comprehensive insurance is included. In case of accident, standard deductible applies as per policy terms.' },
];

export default function MonthlyCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book Monthly Car Rental on TransRentals"
        description="Subscribe to a monthly car rental in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Choose Subscription Period', text: 'Select 1 month, 3 months, or 6 months. Longer subscriptions get better monthly rates.' },
          { name: 'Pick Car Category', text: 'Choose hatchback, sedan, or SUV. Select self-drive or chauffeur-driven based on your needs.' },
          { name: 'Complete KYC & Sign Agreement', text: 'Submit documents for KYC. Pay first month rent and security deposit. Sign monthly rental agreement.' },
          { name: 'Receive Car & Use', text: 'Car delivered to your location. Enjoy monthly subscription with zero maintenance hassle.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="monthly" />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="monthly-car-rental"
        title="Monthly Car Subscription Plans"
        showCategories={true}
        limit={12}
        priceUnit="/month"
      />

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="monthly-car-rental" title="Monthly Car Rental in Available Cities" />

      {/* Why Monthly Car Rental */}
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
            Why Choose Monthly Car Rental?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_MONTHLY.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect for Every Need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            How Monthly Car Rental Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { step: '1', title: 'Choose Car & Plan', desc: 'Select vehicle type and duration' },
              { step: '2', title: 'Submit Documents', desc: 'License, Aadhar, Address proof' },
              { step: '3', title: 'Pay Security Deposit', desc: 'Refundable deposit (varies by car)' },
              { step: '4', title: 'Vehicle Delivered', desc: 'Car delivered to your doorstep' },
              { step: '5', title: 'Use Monthly', desc: 'Drive within km limit for 30 days' },
              { step: '6', title: 'Renew or Return', desc: 'Extend subscription or return' },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                  <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-black text-lg shadow-lg shadow-emerald-200">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
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
              Monthly Car Rental <span className="text-emerald-600">FAQs</span>
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
    </>
  );
}
