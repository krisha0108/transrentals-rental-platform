import { Metadata } from 'next';
import Link from 'next/link';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { BikeServiceSchema, HowToSchema } from '@/components/seo/schemas';
import {
  MessageCircleQuestion, Plus, Wallet, Wrench, ShieldCheck, CalendarClock, Rocket, Smartphone, RefreshCw, Unlock,
  GraduationCap, Briefcase, Building2, Package, Palmtree, Search, Building,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Monthly Bike Rental | Scooty on Rent Monthly @₹2999/Month | TransRentals',
  description: 'Rent bike or scooty on monthly basis. Monthly bike subscription from ₹2999/month. Activa, Splendor, Pulsar available. Zero maintenance, flexible plans. Book now!',
  keywords: [
    'monthly bike rental',
    'bike on rent monthly',
    'monthly scooty rental',
    'scooty on rent monthly',
    'bike subscription',
    'long term bike rental',
    'monthly activa rental',
    'bike for month',
    'monthly two wheeler rental',
    'bike rental per month',
    'monthly bike hire',
    'long term scooty rental',
  ],
  openGraph: {
    title: 'Monthly Bike Rental India | Bike Subscription @₹2999/Month',
    description: 'Subscribe to bikes & scooters monthly. All-inclusive packages with zero maintenance. Activa, Splendor, Pulsar available.',
    type: 'website',
    url: 'https://transrentals.in/monthly-bike-rental',
    images: [
      {
        url: 'https://transrentals.in/images/og/monthly-bike-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Monthly Bike Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monthly Bike Rental | Starting @₹2999/Month | TransRentals',
    description: 'Rent bikes & scooters on monthly basis. Zero maintenance, flexible plans.',
    images: ['https://transrentals.in/images/og/monthly-bike-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/monthly-bike-rental',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'How much does monthly bike rental cost?', answer: 'Monthly bike rental starts from ₹2,999/month for scooters like Activa. Commuter bikes cost ₹3,999-4,999/month, and premium bikes like Royal Enfield cost ₹7,999-12,999/month.' },
  { question: 'What is included in monthly bike rental?', answer: 'Monthly rental includes the bike for 30 days, comprehensive insurance, free maintenance & servicing, and 24/7 roadside assistance. Fuel and helmet are not included.' },
  { question: 'What documents are needed for monthly bike rental?', answer: 'You need a valid driving license (minimum 6 months old), Aadhar card, and a refundable security deposit (₹2,000-10,000 depending on bike type).' },
  { question: 'Can I extend my monthly rental?', answer: 'Yes, you can extend month by month. Long-term rentals (3+ months) get discounted rates up to 15% off.' },
  { question: 'Is there a km limit for monthly rentals?', answer: 'Most monthly plans include 1500-2000 km/month. Extra km charges apply at ₹2-5/km depending on the bike.' },
];

const WHY_MONTHLY = [
  { icon: Wallet, anim: 'pulse', title: 'Save 40% vs Daily', desc: 'Cheaper than daily rental rates' },
  { icon: Wrench, anim: 'wrench', title: 'Free Maintenance', desc: 'Servicing & repairs included' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Fully Insured', desc: 'Comprehensive coverage' },
  { icon: CalendarClock, anim: 'tick', title: 'Flexible Duration', desc: '1 month to 12+ months' },
  { icon: Rocket, anim: 'drive', title: 'Quick Delivery', desc: 'Same day in metro cities' },
  { icon: Smartphone, anim: 'lift', title: 'Easy Process', desc: 'Minimal documentation' },
  { icon: RefreshCw, anim: 'tick', title: 'Free Replacement', desc: 'If bike breaks down' },
  { icon: Unlock, anim: 'lift', title: 'No Long Commitment', desc: 'Cancel after 1 month' },
];

const PERFECT_FOR = [
  { icon: GraduationCap, anim: 'lift', title: 'College Students', desc: 'Semester-long rentals' },
  { icon: Briefcase, anim: 'drive', title: 'Working Professionals', desc: 'Daily office commute' },
  { icon: Building2, anim: 'lift', title: 'Job Transfers', desc: 'Temporary relocation' },
  { icon: Package, anim: 'drive', title: 'Delivery Partners', desc: 'Swiggy, Zomato, Amazon' },
  { icon: Palmtree, anim: 'grow', title: 'Long Vacation', desc: 'Extended city stays' },
  { icon: Wrench, anim: 'wrench', title: 'Own Bike Repair', desc: 'Temporary replacement' },
  { icon: Search, anim: 'pulse', title: 'Try Before Buy', desc: 'Test drive for months' },
  { icon: Building, anim: 'lift', title: 'New to City', desc: 'Just moved, need transport' },
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

const schemaVehicles = [
  { name: 'Honda Activa 6G', brand: 'Honda', price: 2999, image: 'https://transrentals.in/images/scooters/activa-6g.jpg' },
  { name: 'TVS Jupiter', brand: 'TVS', price: 3499, image: 'https://transrentals.in/images/scooters/jupiter.jpg' },
  { name: 'Hero Splendor Plus', brand: 'Hero', price: 3999, image: 'https://transrentals.in/images/fleet/hero-splendor-plus.jpg' },
  { name: 'Bajaj Pulsar 150', brand: 'Bajaj', price: 4999, image: 'https://transrentals.in/images/fleet/bajaj-pulsar-150.jpg' },
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 9999, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default function MonthlyBikeRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Bike on Monthly Subscription on TransRentals"
        description="Book a monthly bike or scooty subscription in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Choose City & Duration', text: 'Select your city and subscription period — 1 month, 3 months, or 6 months. Longer plans get bigger discounts.' },
          { name: 'Pick a Bike', text: 'Choose from Activa, Splendor, Pulsar, or other available models. Check the monthly rate including maintenance.' },
          { name: 'Submit KYC Documents', text: 'Upload your driving licence, Aadhaar/PAN, and selfie. Pay security deposit and first month rent.' },
          { name: 'Get Bike Delivered', text: 'Bike delivered to your doorstep (in select cities) or pick up from vendor. Enjoy zero maintenance hassle.' },
        ]}
      />
      {/* Schema Markup */}
      <BikeServiceSchema
        serviceName="Monthly Bike Rental"
        serviceSlug="monthly-bike-rental"
        description="Rent bikes and scooters on monthly basis across India. Activa, Splendor, Pulsar, Royal Enfield available. Starting @₹2999/month."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 2999, max: 12999 }}
        rating={4.7}
        reviewCount={3450}
      />

      <BikeSearchHero />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Monthly Bike & Scooty Rental
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Long Term Two Wheeler Subscription | Starting @₹2,999/Month
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-semibold mb-1">Monthly Subscription</h3>
                <p className="text-sm opacity-90">Flexible 1-12 month plans</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="font-semibold mb-1">Zero Maintenance</h3>
                <p className="text-sm opacity-90">Free servicing & repairs</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🏠</div>
                <h3 className="font-semibold mb-1">Doorstep Delivery</h3>
                <p className="text-sm opacity-90">Delivered to your address</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#plans"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Monthly Bike Rental */}
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
            Why Choose Monthly Bike Rental?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_MONTHLY.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="monthly-bike-rental" title="Monthly Bike Rental in Available Cities" />

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
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Monthly Bike Rental Works
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Bike & Plan', desc: 'Select scooter or bike, choose duration' },
              { step: '2', title: 'Submit Documents', desc: 'Driving license + Aadhar card' },
              { step: '3', title: 'Pay Security Deposit', desc: 'Refundable ₹3,000-10,000' },
              { step: '4', title: 'Get Bike Delivered', desc: 'Doorstep delivery in 24 hours' },
              { step: '5', title: 'Ride for 30 Days', desc: 'Use within km limit freely' },
              { step: '6', title: 'Renew or Return', desc: 'Extend or return, deposit refunded' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
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
              Monthly Bike Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {schemaFaqs.map((faq, idx) => (
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
