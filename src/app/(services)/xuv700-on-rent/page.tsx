import { Metadata } from 'next';
import { ShieldCheck, Sun, Volume2, Star, MessageCircleQuestion, Plus } from 'lucide-react';
import { SwiftRentalTypeHero } from '@/components/swift/SwiftRentalTypeHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

const WHY_XUV700 = [
  { icon: ShieldCheck, anim: 'pulse', title: 'ADAS Safety', desc: 'Level 2 autonomous features' },
  { icon: Sun, anim: 'tick', title: 'Panoramic Sunroof', desc: 'Largest in segment' },
  { icon: Volume2, anim: 'grow', title: 'Sony 3D Sound', desc: '12-speaker system' },
  { icon: Star, anim: 'lift', title: '5-Star GNCAP', desc: 'Safest Indian SUV' },
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
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
  lift: 'group-hover:-translate-y-2',
};

function WhyChooseGrid({ items }: { items: typeof WHY_XUV700 }) {
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
  title: formatPriceHighlight('XUV700 on Rent Without Driver | Self Drive @₹2999/Day | TransRentals'),
  description: 'Rent Mahindra XUV700 without driver across India. Self-drive XUV700 with ADAS, panoramic sunroof. 5 & 7 seater options. Book now!',
  keywords: ['xuv700 on rent', 'mahindra xuv700 on rent', 'xuv700 self drive', 'rent xuv700 without driver'],
  openGraph: { title: formatPriceHighlight('XUV700 on Rent Without Driver @₹2999/Day | TransRentals'), url: 'https://transrentals.in/xuv700-on-rent' },
  alternates: { canonical: 'https://transrentals.in/xuv700-on-rent' },
};

const FAQS = [
  { question: 'What is the rental price of a self-drive Mahindra XUV700?', answer: 'Self-drive Mahindra XUV700 rental starts from ₹2999/day across MX, AX5, AX7, and AX7 L variants. Being a premium SUV, pricing is higher than compact SUVs like the Creta or Seltos.' },
  { question: 'Can I choose between a 5-seater and 7-seater XUV700?', answer: 'Yes, the XUV700 is available in both 5-seater and 7-seater configurations. Select your preferred layout while booking based on your group size and luggage needs.' },
  { question: 'Is the security deposit higher for the XUV700 compared to other SUVs?', answer: 'Yes, being a premium SUV category vehicle, the XUV700 requires a higher refundable security deposit than compact SUVs, reflecting its higher value and ADAS-equipped features.' },
  { question: 'What safety and comfort features come with the XUV700 rental?', answer: 'The self-drive XUV700 includes Level 2 ADAS safety features, a panoramic sunroof, a Sony 3D sound system with 12 speakers, and a 5-star GNCAP safety rating, making it one of the safest SUVs to self-drive.' },
  { question: 'What documents do I need to rent an XUV700 without a driver?', answer: 'You need to upload a valid driving licence, Aadhaar, and PAN for KYC verification. Given the premium security deposit involved, document verification for the XUV700 is thorough before booking confirmation.' },
];

export default function XUV700OnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Mahindra XUV700 on TransRentals"
        description="Book XUV700 self-drive rental in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Select City & Duration', text: 'Choose pickup city and rental dates. XUV700 available for day, weekend, and extended trips.' },
          { name: 'Choose XUV700 Configuration', text: 'Select 5-seater or 7-seater XUV700. Check ADAS features and panoramic sunroof availability.' },
          { name: 'Complete KYC', text: 'Upload DL, Aadhaar, and PAN. Pay premium security deposit for luxury SUV category. Instant confirmation.' },
          { name: 'Collect & Drive', text: 'Pick up XUV700 at vendor location. Enjoy the ADAS-equipped premium SUV experience.' },
        ]}
      />
      <SwiftRentalTypeHero vehicleName="Mahindra XUV700" selfDrivePrice="₹2999" />

      <section className="relative bg-gradient-to-br from-red-700 to-rose-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mahindra XUV700 on Rent</h1>
            <p className="text-xl opacity-90 mb-8">MX • AX5 • AX7 • AX7 L Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-700 transition">Find Near You</a>
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Rent XUV700?</h2>
          <WhyChooseGrid items={WHY_XUV700} />
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="xuv700-on-rent" title="XUV700 on Rent in Available Cities" />

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
              XUV700 Rental <span className="text-emerald-600">FAQs</span>
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
