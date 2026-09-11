import { Metadata } from 'next';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';
import { MessageCircleQuestion, Plus, Briefcase, Fuel, Armchair, Route } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Self Drive Sedan Rental India | Starting from ₹1299/Day',
  description: formatPriceHighlight('Rent sedan without driver across India. Honda City, Hyundai Verna, Maruti Ciaz, Skoda Slavia available. Self-drive sedan rental for business & leisure.'),
  keywords: [
    'self drive sedan rental',
    'sedan on rent without driver',
    'rent sedan india',
    'honda city on rent',
    'verna self drive',
    'sedan rental for outstation',
  ],
  openGraph: {
    title: formatPriceHighlight('Self Drive Sedan Rental India @₹1299/Day | TransRentals'),
    description: formatPriceHighlight('Rent sedans without driver. City, Verna, Ciaz available.'),
    type: 'website',
    url: 'https://transrentals.in/self-drive-sedan-rental',
  },
  alternates: {
    canonical: 'https://transrentals.in/self-drive-sedan-rental',
  },
};

const WHY_SEDAN = [
  { icon: Briefcase, anim: 'drive', title: 'Business Ready', desc: 'Professional appearance' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Efficient', desc: '15-20+ km/l mileage' },
  { icon: Armchair, anim: 'pulse', title: 'Comfortable', desc: 'Plush seating, smooth ride' },
  { icon: Route, anim: 'drive', title: 'Highway Ready', desc: 'Perfect for long drives' },
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
  fill: 'group-hover:-translate-y-1.5',
  pulse: 'group-hover:scale-125',
};

const FAQS = [
  { question: 'Which sedan models are available for self-drive rental?', answer: 'You can choose from Honda City, Hyundai Verna, Maruti Ciaz, Maruti Dzire, Skoda Slavia, and Honda Amaze, with self-drive rentals starting from ₹1,299/day.' },
  { question: 'What documents are needed to rent a sedan without a driver?', answer: 'A valid driving licence and Aadhaar or PAN card are required for online KYC verification before the sedan booking is confirmed.' },
  { question: 'Is automatic transmission available in self-drive sedans?', answer: 'Yes, automatic variants of models like the Honda City, Hyundai Verna, and Skoda Slavia are available on rent in select cities, alongside manual options.' },
  { question: 'What is the fuel efficiency of the rental sedans?', answer: 'Most sedans in our fleet deliver 15-20+ km/l mileage, making them an economical choice for both city commutes and long highway drives.' },
  { question: 'Are self-drive sedans suitable for outstation highway trips?', answer: 'Yes, sedans offer a comfortable, highway-ready ride with a smooth suspension and good cabin space, making them ideal for business travel and outstation trips.' },
];

export default function SelfDriveSedanRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Self-Drive Sedan on TransRentals"
        description="Rent a sedan without driver for business or leisure travel in 4 steps."
        totalTime="PT8M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select pickup city, rental start and end dates. Compare daily vs weekly sedan rates.' },
          { name: 'Select Sedan Model', text: 'Choose from Honda City, Hyundai Verna, Maruti Ciaz, or Skoda Slavia. Automatic or manual available.' },
          { name: 'Verify & Pay Deposit', text: 'Upload driving licence and Aadhaar. Pay security deposit online to confirm reservation.' },
          { name: 'Collect & Drive', text: 'Pick up sedan from vendor showroom or opt for doorstep delivery. Do walk-around inspection before driving.' },
        ]}
      />
      <SwiftRentalTypeHero
        vehicleName="Self Drive Sedan"
        selfDrivePrice="₹1,299"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-800 to-blue-900 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Self Drive Sedan Rental Across India
            </h1>
            <p className="text-xl opacity-90 mb-8">
              City • Verna • Ciaz • Dzire • Slavia • Amaze
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#locations" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition">
                Find Near You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sedan */}
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
            Why Rent a Sedan?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_SEDAN.map((item, idx) => (
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
      <StaticServicePopularCitiesGrid serviceSlug="self-drive-sedan-rental" title="Self Drive Sedan Rental in Available Cities" />

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
              Self Drive Sedan <span className="text-emerald-600">FAQs</span>
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
