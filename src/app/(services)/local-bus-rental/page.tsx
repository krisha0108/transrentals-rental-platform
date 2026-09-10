import { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock, Sun, CalendarClock, Building2, GraduationCap, Heart, Briefcase, Landmark, PartyPopper,
  MessageCircleQuestion, Plus, MapPin, ArrowRight, Check,
} from 'lucide-react';
import { LocalBusRentalHero } from '@/components/local-bus-rental/LocalBusRentalHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Local Bus Rental | Hourly & Half-Day Bus Hire in Your City | TransRentals',
  description:
    'Hire a bus or tempo traveller by the hour for local sightseeing, school trips, local weddings, and same-city events. 4-hour, 8-hour, and 12-hour packages. Driver included, no outstation charges.',
  keywords: [
    'local bus rental',
    'local bus hire',
    'bus on rent for local use',
    'hourly bus rental',
    'half day bus rental',
    'local bus rental near me',
    'local sightseeing bus',
    'city bus hire',
    'local tempo traveller rental',
  ],
  alternates: {
    canonical: 'https://transrentals.in/local-bus-rental',
  },
  openGraph: {
    title: 'Local Bus Rental | Hourly & Half-Day Bus Hire | TransRentals',
    description: 'Hire a bus by the hour for local sightseeing, school trips, weddings, and same-city events. 4/8/12-hour packages with driver included.',
    type: 'website',
    url: 'https://transrentals.in/local-bus-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=local-bus-rental', width: 1200, height: 630, alt: 'Local Bus Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Bus Rental | Hourly & Half-Day Bus Hire | TransRentals',
    description: 'Hire a bus by the hour for local sightseeing, school trips, and same-city events.',
    images: ['https://transrentals.in/api/og?service=local-bus-rental'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const PACKAGES = [
  { name: '4-Hour Package', icon: Clock, anim: 'tick', range: '40 km', bestFor: 'Local sightseeing, half-day school trips, city functions', features: ['Driver included', 'No night-halt charge', 'AC/Non-AC'] },
  { name: '8-Hour Package', icon: Sun, anim: 'pulse', range: '80 km', bestFor: 'Full-day local weddings, corporate shuttles, local tours', features: ['Driver included', 'Full-day cover', 'AC/Non-AC'] },
  { name: '12-Hour Package', icon: CalendarClock, anim: 'tick', range: '120 km', bestFor: 'Full-day events, multi-stop local pickups, large functions', features: ['Driver included', 'Multi-stop pickups', 'AC/Non-AC'] },
];

/* Wahi wide-brochure card language jo Excavator Types section me hai. */
const PKG_CSS = `
.pkg-card {
  opacity: 0;
  animation: pkg-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes pkg-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.pkg-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .pkg-card { opacity: 1; animation: none; }
  .pkg-card:hover { transform: none; }
}
`;

const USE_CASES = [
  { icon: Building2, anim: 'pulse', title: 'Local Sightseeing', desc: 'City tours, day picnics' },
  { icon: GraduationCap, anim: 'lift', title: 'School Day Trips', desc: 'Same-day educational visits' },
  { icon: Heart, anim: 'pulse', title: 'Local Wedding Functions', desc: 'Guest shuttle within city' },
  { icon: Briefcase, anim: 'drive', title: 'Corporate Shuttles', desc: 'Office pickup & drop' },
  { icon: Landmark, anim: 'lift', title: 'Local Religious Events', desc: 'Processions, local temple visits' },
  { icon: PartyPopper, anim: 'grow', title: 'Local Parties & Functions', desc: 'Guest transport within city' },
];

/* Wahi "Why Choose Us" card language jo Excavator Applications section me hai. */
const USE_CSS = `
.use-card {
  opacity: 0;
  animation: use-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes use-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.use-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.use-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.use-card:hover .use-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .use-card { opacity: 1; animation: none; }
  .use-card:hover { transform: none; }
  .use-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  dig: 'group-hover:-rotate-[28deg] group-hover:-translate-y-0.5',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  fill: 'group-hover:-translate-y-1.5',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

const FAQS = [
  { question: 'What is the difference between local bus rental and outstation bus rental?', answer: 'Local bus rental is billed as an hourly/km package (e.g., 4 hrs/40 km) for travel within a single city, with no driver night-halt or outstation allowance charges. Outstation bus rental is billed per km for intercity travel and includes driver allowance for multi-day trips.' },
  { question: 'What is the minimum booking duration for a local bus rental?', answer: 'Most operators have a 4-hour minimum package. Shorter point-to-point local transfers may be available in select cities — ask for a custom quote if you need less than 4 hours.' },
  { question: 'What happens if I exceed the package hours or kilometers?', answer: 'Extra hours and extra kilometers beyond your package are billed at a fixed per-hour and per-km rate, disclosed upfront before booking. There are no hidden charges.' },
  { question: 'Is AC available for local bus rental packages?', answer: 'Yes, both AC and Non-AC buses and tempo travellers are available for local packages. AC is recommended for daytime bookings, especially March–June.' },
  { question: 'Can I book a local bus rental for the same day?', answer: 'Same-day booking is often possible subject to availability, but booking at least 24 hours in advance ensures you get your preferred bus size and AC/Non-AC option.' },
];

export default function LocalBusRentalPage() {
  return (
    <div className="min-h-screen">
      <HowToSchema
        name="How to Book a Local Bus Rental on TransRentals"
        description="Hire a bus or tempo traveller for local, same-city use in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Select Your City & Package', text: 'Choose your city and an hourly package — 4 hrs/40 km, 8 hrs/80 km, or 12 hrs/120 km.' },
          { name: 'Choose Bus Size', text: 'Pick a Tempo Traveller (9-17 seater) or mini bus (20-32 seater) based on group size.' },
          { name: 'Compare Local Operator Quotes', text: 'Review quotes from verified local bus operators. Check inclusions — driver, fuel, and extra km/hour rates.' },
          { name: 'Confirm Booking & Travel', text: 'Pay advance to confirm. Driver arrives at your pickup point for the scheduled local trip.' },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Local Bus Rental',
            description: 'Hire buses and tempo travellers by the hour for local sightseeing, school trips, weddings, and same-city events across India.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Local Bus Rental',
          }),
        }}
      />
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
              { '@type': 'ListItem', position: 3, name: 'Local Bus Rental', item: 'https://transrentals.in/local-bus-rental' },
            ],
          }),
        }}
      />

      <LocalBusRentalHero />

      {/* Packages — wide-brochure icon-panel cards, no price */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: PKG_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Local Bus Rental Packages
            </h2>
            <p className="text-gray-500">
              Fixed hourly/km packages for travel within your city — no driver night-halt or outstation allowance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {PACKAGES.map((pkg, idx) => (
              <div
                key={pkg.name}
                className="pkg-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                  <span className="inline-flex">
                    <pkg.icon
                      className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[pkg.anim]}`}
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-[11px] font-bold text-center leading-tight text-emerald-700">
                    {pkg.range}
                  </span>
                </div>

                <div className="flex-1 min-w-0 p-5">
                  <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{pkg.name}</h3>
                  <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                  <p className="mt-0.5 text-[13px] text-gray-600">{pkg.bestFor}</p>

                  <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                        <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                          <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            * Rates vary by city, bus size, and AC/Non-AC choice — get an exact quote via the booking form above. Extra hours/km charged at a fixed rate disclosed upfront.
          </p>
        </div>
      </section>

      {/* Use cases — dashed-ring icon cards, same language as Excavator Applications */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: USE_CSS }} />
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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              What Local Bus Rental Is <span className="text-emerald-600">Used For</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {USE_CASES.map((use, idx) => (
              <div
                key={use.title}
                className="use-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="use-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <use.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[use.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{use.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{use.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="bus-rental" title="Local Bus Rental in Available Cities" />

      {/* Related services — Browse by City language, no per-city grid needed here (cities section above covers it) */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container mx-auto px-4 relative text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <MapPin className="w-4 h-4" />
            Need Something Else?
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">Outstation or a Specific Event Type?</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              { href: '/bus-rental', label: 'Outstation Bus Rental' },
              { href: '/wedding-bus-rental', label: 'Wedding Bus Rental' },
              { href: '/corporate-bus-rental', label: 'Corporate Bus Rental' },
              { href: '/26-seater-bus', label: '26 Seater Bus' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs — same accordion language as Excavator Rental FAQs */}
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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Local Bus Rental <span className="text-emerald-600">FAQs</span>
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
    </div>
  );
}
