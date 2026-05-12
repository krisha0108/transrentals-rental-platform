import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JCBRentalServiceHero } from '@/components/services/JCBRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { HowToSchema } from '@/components/seo/schemas';

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

      <ServiceHeroWithChat
        badge="JCB Rental in 250+ Cities"
        title="JCB on Rent | Excavator Hire"
        titleHighlight="Certified Operators Included"
        description="Rent JCB backhoe loaders and excavators for construction, digging, and earthmoving projects. Certified operators included. Get quotes from verified vendors!"
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      <JCBRentalServiceHero />

      {/* Applications */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">JCB Applications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⛏️', title: 'Excavation', desc: 'Digging foundations, basements & trenches' },
              { icon: '🏗️', title: 'Construction Sites', desc: 'Material handling & site preparation' },
              { icon: '🛣️', title: 'Road Construction', desc: 'Road laying, repair & maintenance work' },
              { icon: '🌳', title: 'Land Clearing', desc: 'Clearing vegetation & leveling land' },
              { icon: '🏠', title: 'Building Foundations', desc: 'Digging & preparing building bases' },
              { icon: '💧', title: 'Pipeline Laying', desc: 'Trenching for water & drainage pipes' },
              { icon: '🚧', title: 'Demolition', desc: 'Breaking & removing concrete structures' },
              { icon: '🏞️', title: 'Landscaping', desc: 'Earth moving & terrain modification' },
              { icon: '⚙️', title: 'Material Loading', desc: 'Loading trucks with earth & materials' },
            ].map((app) => (
              <div key={app.title} className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-2 border-yellow-200">
                <div className="text-4xl mb-3">{app.icon}</div>
                <h3 className="text-lg font-bold mb-2">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What&apos;s Included in JCB Rental?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚜', title: 'Well-Maintained Machine', desc: 'Serviced & ready to work' },
              { icon: '👷', title: 'Expert Operator', desc: 'Certified & experienced' },
              { icon: '⛽', title: 'Fuel Options', desc: 'With/without fuel available' },
              { icon: '🛠️', title: 'Basic Attachments', desc: 'Standard buckets included' },
              { icon: '🚚', title: 'Transportation', desc: 'Delivery to site available' },
              { icon: '🛡️', title: 'Insurance', desc: 'Machine covered during rental' },
              { icon: '⏰', title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
              { icon: '📞', title: 'Support', desc: 'On-call assistance' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg shadow-md text-center border border-yellow-200">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LocationsGrid service="jcb-on-rent" />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">JCB Rental FAQs</h2>
            <p className="text-gray-600">Common questions about hiring a JCB or excavator in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {JCB_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">JCB on Rent by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/jcb-on-rent/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition text-sm font-medium text-gray-700 hover:text-yellow-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/equipment-rental" className="text-yellow-700 hover:underline">All Equipment Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/crane-on-rent" className="text-yellow-700 hover:underline">Crane on Rent</Link>
              <span className="text-gray-300">|</span>
              <Link href="/mini-truck-rental" className="text-yellow-700 hover:underline">Mini Truck Rental</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
