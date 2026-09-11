import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Pickaxe, Construction, Route, Sprout, Home, Droplet, Hammer, Mountain, Truck,
  Tractor, UserCheck, Fuel, Wrench, ShieldCheck, Clock, PhoneCall,
  MessageCircleQuestion, Plus, MapPin, ArrowRight,
} from 'lucide-react';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { EquipmentBookingHero } from '@/components/equipment-rental/EquipmentBookingHero';
import { HowToSchema } from '@/components/seo/schemas';

const JCB_APPLICATIONS = [
  { icon: Pickaxe, anim: 'dig', title: 'Excavation', desc: 'Digging foundations, basements & trenches' },
  { icon: Construction, anim: 'pulse', title: 'Construction Sites', desc: 'Material handling & site preparation' },
  { icon: Route, anim: 'drive', title: 'Road Construction', desc: 'Road laying, repair & maintenance work' },
  { icon: Sprout, anim: 'grow', title: 'Land Clearing', desc: 'Clearing vegetation & leveling land' },
  { icon: Home, anim: 'pulse', title: 'Building Foundations', desc: 'Digging & preparing building bases' },
  { icon: Droplet, anim: 'fill', title: 'Pipeline Laying', desc: 'Trenching for water & drainage pipes' },
  { icon: Hammer, anim: 'wrench', title: 'Demolition', desc: 'Breaking & removing concrete structures' },
  { icon: Mountain, anim: 'lift', title: 'Landscaping', desc: 'Earth moving & terrain modification' },
  { icon: Truck, anim: 'drive', title: 'Material Loading', desc: 'Loading trucks with earth & materials' },
];

const JCB_INCLUDED = [
  { icon: Tractor, anim: 'drive', title: 'Well-Maintained Machine', desc: 'Serviced & ready to work' },
  { icon: UserCheck, anim: 'pulse', title: 'Expert Operator', desc: 'Certified & experienced' },
  { icon: Fuel, anim: 'fill', title: 'Fuel Options', desc: 'With/without fuel available' },
  { icon: Wrench, anim: 'wrench', title: 'Basic Attachments', desc: 'Standard buckets included' },
  { icon: Truck, anim: 'drive', title: 'Transportation', desc: 'Delivery to site available' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Insurance', desc: 'Machine covered during rental' },
  { icon: Clock, anim: 'tick', title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
  { icon: PhoneCall, anim: 'ring', title: 'Support', desc: 'On-call assistance' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes
   (custom CSS keyframe hover animations didn't render reliably in the browser). */
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

const JCB_FAQS = [
  {
    q: 'What is the cost of JCB on rent per day in India?',
    a: 'JCB rental rates in India depend on the machine type, attachment, and work duration. A standard JCB 3DX backhoe loader starts from ₹2,999/day. Mini excavators and tipper-mounted JCBs are priced differently. Get a free quote on TransRentals based on your specific site requirements.',
  },
  {
    q: 'What is the difference between a JCB and an excavator?',
    a: 'A JCB (backhoe loader) has a loader bucket at the front and a digging arm at the rear — it can dig, load, and transport material. A hydraulic excavator only digs and scoops. JCB is ideal for mixed construction work; dedicated excavators are used for deep trenching and heavy earthmoving.',
  },
  {
    q: 'Does JCB rental include an operator?',
    a: 'Yes, all JCB rentals on TransRentals include a certified, experienced operator. The operator is responsible for safe machine operation at your site. You are only required to provide clear site access and necessary permissions.',
  },
  {
    q: 'What attachments are available with JCB rental?',
    a: 'Standard JCB rentals include a front loader bucket and rear digging arm. Additional attachments available on request: rock breaker (hydraulic hammer), auger (for boring), pallet forks, and compactor plate. Confirm attachment availability when booking on TransRentals.',
  },
  {
    q: 'How many hours does a JCB work per day?',
    a: 'Standard JCB rental is for 8 working hours per day. Extended 12-hour and 24-hour shifts are available at additional cost. Fuel is typically not included — the client provides diesel at site. Clarify the fuel arrangement with your vendor at the time of booking.',
  },
  {
    q: 'What are the most common uses of JCB on rent?',
    a: 'JCB is used for: foundation excavation for buildings, road repair and pothole patching, pipeline and drainage trench digging, demolition of small structures, land clearing and leveling, loading loose material into trucks, and agricultural canal work.',
  },
  {
    q: 'How far in advance should I book a JCB for a construction project?',
    a: 'For planned projects, book at least 48–72 hours in advance. During peak construction season (October–February, post-monsoon) and in Tier-1 cities, demand can be high — book 5–7 days ahead. Emergency same-day bookings are possible in select cities on TransRentals.',
  },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Bhopal', slug: 'bhopal' },
  { name: 'Chandigarh', slug: 'chandigarh' },
];

export const metadata: Metadata = {
  title: 'JCB on Rent | Backhoe Loader Hire | Starting ₹2,999/Day | TransRentals',
  description:
    'Hire JCB backhoe loaders and excavators across 250+ Indian cities. Certified operators included. Foundation digging, road work, pipeline laying, demolition. Get quotes from verified vendors.',
  keywords: [
    'jcb on rent',
    'jcb rental',
    'backhoe loader rental',
    'jcb hire',
    'excavator on rent',
    'jcb machine rental',
    'construction equipment rental',
    'jcb 3dx rental',
    'mini excavator rental',
    'jcb per day rate',
    'jcb with operator',
    'earth moving equipment',
  ],
  openGraph: {
    title: 'JCB on Rent | Backhoe Loader Hire | Starting ₹2,999/Day | TransRentals',
    description: 'Hire JCB backhoe loaders and excavators with certified operators across 250+ Indian cities.',
    type: 'website',
    url: 'https://transrentals.in/jcb-on-rent',
    images: [{ url: 'https://transrentals.in/images/og/jcb-rental.jpg', width: 1200, height: 630, alt: 'JCB on Rent - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JCB on Rent | Excavator Hire | TransRentals',
    description: 'Hire JCB backhoe loaders with certified operators. 250+ cities covered.',
    images: ['https://transrentals.in/images/og/jcb-rental.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/jcb-on-rent' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function JCBOnRentPage() {
  return (
    <div className="flex flex-col">
      <HowToSchema
        name="How to Rent a JCB or Excavator on TransRentals"
        description="Book a JCB backhoe loader or excavator with certified operator in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Describe Your Project', text: 'Enter project location, type of work (excavation, trenching, demolition), required machine type, and duration.' },
          { name: 'Select Machine & Attachments', text: 'Choose JCB 3DX backhoe loader, mini excavator, or tipper-mounted JCB. Select attachments if needed — rock breaker, auger, or compactor.' },
          { name: 'Get Vendor Quotes', text: 'Receive quotes from verified equipment vendors with certified operators. Compare daily rates and shift options.' },
          { name: 'Confirm & Deploy', text: 'Pay advance to confirm booking. Machine and operator arrive at your site on scheduled date.' },
        ]}
      />
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: JCB_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'JCB on Rent in India',
            description: 'JCB backhoe loader and excavator rental with certified operators across 250+ Indian cities.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
          }),
        }}
      />

      <EquipmentBookingHero
        city="India"
        citySlug=""
        serviceType="equipment-jcb"
        badgeLabel="JCB Rental"
        bookingTitle="Book Your JCB"
        pageHeading="JCB on Rent | Certified Operators Included"
        pageDescription="Rent JCB backhoe loaders for construction, digging, and earthmoving projects. Certified operators included. Get quotes from verified vendors."
      />

      {/* Applications */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
              JCB <span className="text-emerald-600">Applications</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {JCB_APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `jcb-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 90}ms forwards`, opacity: 0 }}
              >
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <app.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[app.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-snug">{app.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes jcb-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="jcb-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* What's Included */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              What&apos;s <span className="text-emerald-600">Included</span> in JCB Rental?
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {JCB_INCLUDED.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `jcb-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="jcb-on-rent" title="JCB Rental in Available Cities" />

      {/* FAQ Section */}
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
              JCB Rental <span className="text-emerald-600">FAQs</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">Common questions about hiring a JCB or excavator in India.</p>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {JCB_FAQS.map((faq, idx) => (
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
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
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
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">JCB on Rent by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/jcb-on-rent/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/equipment-rental', label: 'All Equipment Rental', icon: Construction },
              { href: '/crane-on-rent', label: 'Crane on Rent', icon: Construction },
              { href: '/excavator-on-rent', label: 'Excavator on Rent', icon: Truck },
              { href: '/mini-truck-rental', label: 'Mini Truck Rental', icon: Truck },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
