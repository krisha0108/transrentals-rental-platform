import { Metadata } from 'next';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';
import { MessageCircleQuestion, Plus, Users, Luggage, Mountain, Gauge, Palmtree, Briefcase, PartyPopper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Self Drive SUV Rental India | Starting from ₹1999/Day',
  description: formatPriceHighlight('Rent SUV without driver across India. Creta, Seltos, Scorpio, XUV700, Fortuner available. Self-drive SUV rental for road trips, family travel. Book online!'),
  keywords: [
    'self drive suv rental',
    'suv on rent without driver',
    'rent suv india',
    'self drive creta',
    'suv rental for road trip',
    'family suv rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive SUV Rental India @₹1999/Day | TransRentals'),
    description: formatPriceHighlight('Rent SUVs without driver. Creta, Seltos, Scorpio, Fortuner available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-suv-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-suv-rental',
  },
};

const WHY_SUV = [
  { icon: Users, anim: 'pulse', title: 'Family Friendly', desc: '5-7 seater options for families' },
  { icon: Luggage, anim: 'lift', title: 'Boot Space', desc: 'Large luggage capacity' },
  { icon: Mountain, anim: 'lift', title: 'Road Trips', desc: 'Perfect for highways & hills' },
  { icon: Gauge, anim: 'pulse', title: 'Powerful', desc: 'Handle any terrain with ease' },
];

const PERFECT_FOR = [
  { icon: Palmtree, anim: 'grow', title: 'Family Vacations', desc: 'Goa, Kerala, Rajasthan trips' },
  { icon: Mountain, anim: 'lift', title: 'Hill Station Trips', desc: 'Manali, Ooty, Munnar drives' },
  { icon: Briefcase, anim: 'drive', title: 'Business Travel', desc: 'Airport transfers, client visits' },
  { icon: PartyPopper, anim: 'grow', title: 'Weekend Getaways', desc: 'Nearby destinations, quick trips' },
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
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

function AppCard({ item, idx }: { item: typeof WHY_SUV[number]; idx: number }) {
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
  { question: 'What is the rental price of a self-drive SUV?', answer: 'Self-drive SUV rental starts from ₹1,999/day. Popular models available include Hyundai Creta, Kia Seltos, Mahindra Scorpio, XUV700, and Toyota Fortuner, with pricing varying by model and city.' },
  { question: 'Which SUV should I choose for a hill station road trip?', answer: 'For hill stations like Manali, Ooty, or Munnar, SUVs like the Scorpio, XUV700, or Fortuner are recommended due to their higher ground clearance and power, though Creta and Seltos also handle hilly terrain well.' },
  { question: 'What documents are required to rent an SUV without a driver?', answer: 'A valid driving licence along with Aadhaar or PAN is required for KYC. Documents are verified online and the booking is confirmed instantly once the security deposit is paid.' },
  { question: 'How many people can travel in a self-drive SUV rental?', answer: 'Most SUVs on TransRentals offer 5-seater configurations (Creta, Seltos), while models like the XUV700 also offer a 7-seater option — ideal for larger families or group road trips.' },
  { question: 'Are weekly or monthly SUV rentals cheaper than daily bookings?', answer: 'Yes, weekly and monthly self-drive SUV rentals come at discounted per-day rates compared to the standard ₹1,999/day rate, making them more economical for extended trips.' },
];

export default function SelfDriveSUVRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive SUV on TransRentals"
        description="Book an SUV without driver for road trips or family travel in 4 steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Duration', text: 'Select your city, pickup date, and rental duration. Weekly and monthly SUV rentals available at discounts.' },
          { name: 'Choose SUV Model', text: 'Pick from Hyundai Creta, Kia Seltos, Mahindra Scorpio, XUV700, or Toyota Fortuner based on budget and terrain.' },
          { name: 'Complete Document Verification', text: 'Upload DL, Aadhaar/PAN. Pay security deposit. Booking confirmed instantly after verification.' },
          { name: 'Pick Up & Drive', text: 'Collect SUV at vendor or doorstep (select cities). Inspect the vehicle thoroughly before your road trip.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Self Drive SUV"
        selfDrivePrice="₹1,999"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive SUV Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Creta • Seltos • Scorpio • XUV700 • Fortuner • Harrier
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#locations" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why SUV */}
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
            Why Rent an SUV?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_SUV.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <StaticServicePopularCitiesGrid serviceSlug="self-drive-suv-rental" title="Self Drive SUV Rental in Available Cities" />

      {/* Use Cases */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900 text-center mb-12">
            Perfect For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {PERFECT_FOR.map((item, idx) => (
              <AppCard key={item.title} item={item} idx={idx} />
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
              Self Drive SUV <span className="text-emerald-600">FAQs</span>
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
