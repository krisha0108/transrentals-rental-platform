import { Metadata } from 'next';
import { Smartphone, Sun, Music, ShieldCheck, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_SELTOS = [
  { icon: Smartphone, anim: 'pulse', title: 'Connected Car', desc: 'UVO connected features' },
  { icon: Sun, anim: 'tick', title: 'Sunroof', desc: 'Panoramic sunroof option' },
  { icon: Music, anim: 'grow', title: 'Bose Audio', desc: '8-speaker premium sound' },
  { icon: ShieldCheck, anim: 'lift', title: '6 Airbags', desc: 'Top safety rating' },
];

/* Wahi "Why Choose Us" card language jo excavator-on-rent page me hai — dashed
   icon-ring, sheen on hover. Plain Tailwind group-hover, no custom keyframes. */
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
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

function WhyChooseGrid({ items }: { items: typeof WHY_SELTOS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
      {items.map((item, idx) => (
        <div
          key={item.title}
          className="wcs-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
          style={{ animationDelay: `${idx * 90}ms` }}
        >
          <span aria-hidden className="wcs-sheen" />
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
  );
}

export const metadata: Metadata = {
  title: 'Seltos on Rent Without Driver | Self Drive @₹1899/Day',
  description: formatPriceHighlight('Rent Kia Seltos without driver across India. Self-drive Seltos rental for family trips & outstation. HTK, HTX, GTX variants. Book now!'),
  keywords: ['seltos on rent', 'kia seltos on rent', 'seltos self drive', 'rent seltos without driver'],
  openGraph: {
    title: formatPriceHighlight('Seltos on Rent Without Driver @₹1899/Day | TransRentals'),
    url: 'https://transrentals.in/seltos-on-rent',
  },
  alternates: { canonical: 'https://transrentals.in/seltos-on-rent' },
};

const FAQS = [
  { question: 'What is the rental price of a self-drive Kia Seltos?', answer: 'Self-drive Kia Seltos rental starts from ₹1899/day across HTK, HTX, HTX+, GTX and GTX+ variants. Petrol, diesel, and automatic transmission variants may be priced slightly higher depending on city and availability.' },
  { question: 'What documents are required to rent a Seltos without a driver?', answer: 'You need a valid driving licence (held for at least 1 year) and a government ID proof such as Aadhaar. Both are uploaded online during KYC, and your booking is confirmed instantly after verification.' },
  { question: 'Is a security deposit required for the Seltos self-drive rental?', answer: 'Yes, a refundable security deposit is collected online at the time of booking. The amount depends on the variant chosen — GTX and GTX+ (top variants) attract a slightly higher deposit than HTK/HTX due to their higher value.' },
  { question: 'Are fuel and kilometers included in the Seltos rental?', answer: 'Daily Seltos bookings include a fixed free-km allowance, with extra distance billed per km. Fuel is not included — the car should be returned with the same fuel level as at pickup to avoid refueling charges.' },
  { question: 'Can the Seltos be delivered to my home instead of pickup from a vendor?', answer: 'Yes, home delivery of the Kia Seltos is available in select cities for an additional fee. In other cities, you can collect the car directly from the nearest TransRentals vendor location.' },
];

export default function SeltosOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Kia Seltos on TransRentals"
        description="Book Seltos self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter City & Rental Period', text: 'Select your city and rental dates. Kia Seltos available for day trips, weekends, and weekly rentals.' },
          { name: 'Choose Seltos Variant', text: 'Pick from HTK, HTX, or GTX variants. Check petrol vs diesel fuel type and automatic transmission.' },
          { name: 'Submit KYC & Deposit', text: 'Upload driving licence and Aadhaar. Pay security deposit online. Instant booking confirmation.' },
          { name: 'Collect & Drive', text: 'Pick up Seltos at vendor location or home delivery available. Enjoy the premium SUV experience.' },
        ]}
      />
      <SwiftRentalTypeHero vehicleName="Kia Seltos" selfDrivePrice="₹1899" />

      <section className="relative bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Kia Seltos on Rent Across India</h1>
            <p className="text-xl opacity-90 mb-8">HTK • HTX • HTX+ • GTX • GTX+ Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Rent a Kia Seltos?</h2>
          <WhyChooseGrid items={WHY_SELTOS} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="seltos-on-rent" title="Seltos on Rent in Available Cities" />

      {/* FAQ */}
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
              Seltos Rental <span className="text-emerald-600">FAQs</span>
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
