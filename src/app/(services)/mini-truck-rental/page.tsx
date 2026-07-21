import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

const MINI_TRUCK_FAQS = [
  {
    q: 'What is the load capacity of a Tata Ace mini truck?',
    a: 'The Tata Ace (Chhota Hathi) has a payload capacity of 750 kg to 1 tonne. The Tata Ace Gold carries up to 1 tonne and the Tata Ace EV (electric) up to 750 kg. The Mahindra Jeeto carries up to 750 kg. For loads up to 1.5–2 tonnes, a Tata 407 or Bolero Pickup is a better choice.',
  },
  {
    q: 'What can fit inside a mini truck (Tata Ace)?',
    a: 'A standard Tata Ace cargo bed measures approximately 7.5 ft × 5.5 ft. It can carry: 1-room furniture (bed, wardrobe, fridge, washing machine), 20–25 cartons of goods, or 750 kg of loose materials. It is ideal for studio/1-room house shifting, shop restocking, and last-mile delivery.',
  },
  {
    q: 'What is the difference between Tata Ace and Bolero Pickup?',
    a: 'The Tata Ace (750 kg–1 tonne) is a smaller 3-wheeler-style mini truck ideal for narrow lanes and congested markets. The Bolero Pickup (1.5–2 tonne) is a larger 4-wheeler with higher payload, better for semi-urban routes and heavier loads. For city deliveries, Tata Ace is preferred; for intercity goods movement, Bolero Pickup is more suitable.',
  },
  {
    q: 'Is mini truck rental available by the hour?',
    a: 'Yes, hourly and half-day mini truck rentals are available on TransRentals. Hourly rentals are ideal for shop deliveries, market pickups, and small loads. Full-day bookings (8 hrs) are recommended for house shifting or multiple delivery stops. Check availability in your city when booking.',
  },
  {
    q: 'Can a Tata Ace go on highways for intercity trips?',
    a: 'Tata Ace is primarily designed for intra-city and short-distance trips. It can travel on highways but has a lower speed and payload limit compared to medium trucks. For intercity goods transport beyond 50–100 km, a Tata 407 or Eicher truck is recommended. Confirm intercity coverage with the vendor before booking.',
  },
  {
    q: 'Is a driver included in mini truck rental?',
    a: 'Yes, all mini truck rentals on TransRentals include the driver. Loading and unloading assistance (extra helpers) is available as an add-on service at additional cost. Confirm whether helpers are needed when requesting a quote.',
  },
  {
    q: 'How do I book a mini truck for house shifting?',
    a: 'On TransRentals, select the mini-truck-rental service, enter your city and date, and describe your shift (studio/1-room/2-room). For small apartment shifts, Tata Ace is ideal. For 2BHK+ shifts, consider a Tata 407 or larger truck. Book at least 24 hours in advance, or 3–5 days ahead for month-end or weekend shifts.',
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
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
];

export const metadata: Metadata = {
  title: 'Mini Truck Rental | Tata Ace on Rent | ₹1,499/Day',
  description:
    'Rent Tata Ace, Bolero Pickup and mini trucks across India for house shifting, last-mile delivery, and goods transport. Driver included. Book by the hour or full day across 250+ cities.',
  keywords: [
    'mini truck rental',
    'tata ace on rent',
    'tata ace rental',
    'mini truck hire',
    'small truck rental',
    'goods carrier rental',
    'pickup truck rental',
    'chhota hathi on rent',
    'tata ace per day',
    'bolero pickup rental',
    'mini truck for house shifting',
    'last mile delivery truck',
  ],
  openGraph: {
    title: 'Mini Truck Rental | Tata Ace on Rent | Starting ₹1,499/Day | TransRentals',
    description: 'Rent Tata Ace and mini trucks across 250+ Indian cities. Driver included. House shifting, delivery, goods transport.',
    type: 'website',
    url: 'https://transrentals.in/mini-truck-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=mini-truck-rental', width: 1200, height: 630, alt: 'Mini Truck Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mini Truck Rental | Tata Ace on Rent | Starting ₹1,499/Day | TransRentals',
    description: 'Rent Tata Ace and mini trucks across 250+ Indian cities. Driver included. House shifting, delivery, goods transport.',
    images: ['https://transrentals.in/api/og?service=mini-truck-rental'],
  },
  alternates: { canonical: 'https://transrentals.in/mini-truck-rental' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function MiniTruckRentalPage() {
  return (
    <div className="flex flex-col">
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: MINI_TRUCK_FAQS.map((faq) => ({
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
            name: 'Mini Truck Rental in India',
            description: 'Tata Ace and mini truck rental services across 250+ Indian cities. Driver included. Ideal for house shifting and goods delivery.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Mini Truck Rental', item: 'https://transrentals.in/mini-truck-rental' },
            ],
          }),
        }}
      />
      <HowToSchema
        name="How to Book a Mini Truck Rental on TransRentals"
        description="Rent Tata Ace and mini trucks across 250+ Indian cities with driver included."
        totalTime="PT10M"
        steps={[
          { name: 'Select Your City', text: 'Choose your city from 250+ locations. Enter pickup and drop address for your delivery or shifting job.' },
          { name: 'Choose Vehicle Size', text: 'Pick Tata Ace (750 kg) for small shifts and deliveries, or Bolero Pickup (1.5 tonne) for heavier loads.' },
          { name: 'Book by Hour or Day', text: 'Select a 4-hour, full-day, or multi-day package. Driver is included in all packages.' },
          { name: 'Get Your Load Moved', text: 'The driver arrives at your location at the scheduled time. Loading assistance available as add-on.' },
        ]}
      />

      <ServiceHeroWithChat
        badge="Mini Truck Rental in 250+ Cities"
        title="Mini Truck on Rent | Tata Ace"
        titleHighlight="Driver Included | All India"
        description="Rent Tata Ace, Bolero Pickup and mini trucks for house shifting, shop delivery, and goods transport. Driver included. Book by the hour or full day!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
          { icon: 'zap', text: 'Hourly Booking', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📦', title: 'Local Deliveries', desc: 'Last-mile & city-wide delivery' },
              { icon: '🏠', title: 'Home Shifting', desc: 'Studio & 1-room household moves' },
              { icon: '🏪', title: 'Business Transport', desc: 'Inventory & stock movement' },
              { icon: '🛒', title: 'E-commerce', desc: 'Online order fulfillment' },
              { icon: '🏗️', title: 'Construction Sites', desc: 'Material transport to sites' },
              { icon: '🍕', title: 'Food & Catering', desc: 'Bulk food delivery' },
              { icon: '📚', title: 'Furniture Moving', desc: 'Small furniture items' },
              { icon: '♻️', title: 'Waste Disposal', desc: 'Junk & waste removal' },
            ].map((use) => (
              <div key={use.title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center border-2 border-blue-200">
                <div className="text-4xl mb-3">{use.icon}</div>
                <h3 className="font-bold mb-2">{use.title}</h3>
                <p className="text-sm text-gray-600">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Mini Trucks?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Cost Effective</h3>
              <p className="text-gray-600">Lower rental and operating costs compared to large trucks</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Easy Access</h3>
              <p className="text-gray-600">Navigate narrow lanes and crowded city areas easily</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Quick Loading</h3>
              <p className="text-gray-600">Low deck height for easy loading and unloading</p>
            </div>
          </div>
        </div>
      </section>

      <LocationsGrid service="mini-truck-rental" />

      {/* FAQ Section */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mini Truck Rental FAQs</h2>
            <p className="text-gray-600">Common questions about Tata Ace and mini truck hire in India</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {MINI_TRUCK_FAQS.map((faq, idx) => (
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Mini Truck Rental by City</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/mini-truck-rental/${city.slug}`}
                className="text-center py-2.5 px-2 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition text-sm font-medium text-gray-700 hover:text-orange-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/transporter" className="text-orange-700 hover:underline">Truck & Transport</Link>
              <span className="text-gray-300">|</span>
              <Link href="/packers-and-movers" className="text-orange-700 hover:underline">Packers and Movers</Link>
              <span className="text-gray-300">|</span>
              <Link href="/jcb-on-rent" className="text-orange-700 hover:underline">JCB on Rent</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
