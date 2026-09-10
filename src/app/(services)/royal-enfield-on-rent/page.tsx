import type { Metadata } from 'next';
import { MessageCircleQuestion, Plus, Mountain, Landmark, Compass, Clock } from 'lucide-react';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { BikeSearchHero } from '@/components/bike/BikeSearchHero';
import { BikeServiceSchema, HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Royal Enfield on Rent - Classic 350, Himalayan & More @₹599/Day | TransRentals',
  description:
    'Rent Royal Enfield bikes for your road trips. Classic 350, Himalayan, Meteor, Hunter available across 150+ cities. Perfect for Ladakh & mountain trips. Book now!',
  keywords: [
    'royal enfield on rent',
    'royal enfield rental',
    'bullet on rent',
    're on rent',
    'classic 350 on rent',
    'himalayan on rent',
    'royal enfield hire',
    'enfield rental near me',
    'bullet rental ladakh',
    'royal enfield tour',
  ],
  openGraph: {
    title: 'Royal Enfield on Rent - Classic 350, Himalayan @₹599/Day | TransRentals',
    description: 'Rent Royal Enfield bikes for road trips across India. Classic 350, Himalayan, Meteor, Hunter available.',
    type: 'website',
    url: 'https://transrentals.in/royal-enfield-on-rent',
    images: [
      {
        url: 'https://transrentals.in/images/og/royal-enfield-rental.jpg',
        width: 1200,
        height: 630,
        alt: 'Royal Enfield Rental - TransRentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royal Enfield on Rent - Starting @₹599/Day | TransRentals',
    description: 'Rent Royal Enfield bikes for road trips across 150+ cities in India.',
    images: ['https://transrentals.in/images/og/royal-enfield-rental.jpg'],
  },
  alternates: {
    canonical: 'https://transrentals.in/royal-enfield-on-rent',
  },
};

// Schema data
const schemaFaqs = [
  { question: 'Which Royal Enfield models are available for rent?', answer: 'We have Classic 350, Himalayan, Meteor 350, Hunter 350, Interceptor 650, Continental GT 650, Super Meteor 650, and Scram 411 available for rent.' },
  { question: 'Can I take Royal Enfield to Ladakh?', answer: 'Yes, our Royal Enfield bikes are perfect for Ladakh trips. Himalayan and Classic 350 are most popular for high-altitude riding. We also provide necessary accessories.' },
  { question: 'What is the security deposit for Royal Enfield rental?', answer: 'Security deposit ranges from ₹5,000 to ₹15,000 depending on the model. This is fully refundable upon return of the bike in good condition.' },
  { question: 'Is roadside assistance available on long trips?', answer: 'Yes, we provide 24/7 roadside assistance across India. For remote areas like Ladakh, we have tie-ups with local mechanics.' },
  { question: 'Do you provide helmets and riding gear?', answer: 'Yes, helmets are provided free. Riding jackets, gloves, and knee guards are available at additional charges.' },
];

const schemaVehicles = [
  { name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', price: 599, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Himalayan', brand: 'Royal Enfield', price: 799, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', price: 699, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Hunter 350', brand: 'Royal Enfield', price: 649, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
  { name: 'Royal Enfield Interceptor 650', brand: 'Royal Enfield', price: 999, image: 'https://transrentals.in/images/fleet/default-bike.jpg' },
];

export default function RoyalEnfieldOnRentPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Royal Enfield on TransRentals"
        description="Book a Royal Enfield Classic, Himalayan, or Meteor rental in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter City & Dates', text: 'Select your city, pickup date, and rental duration — daily, weekly, or monthly options available.' },
          { name: 'Choose Your Model', text: 'Pick from Royal Enfield Classic 350, Himalayan, Meteor 350, or Hunter 350 based on your trip type.' },
          { name: 'Review & Compare', text: 'Compare prices from verified vendors. Check security deposit, fuel policy, and helmet inclusions.' },
          { name: 'Book & Ride', text: 'Submit your DL and ID, pay deposit online. Pick up the bike from vendor location and start riding.' },
        ]}
      />
      {/* Schema Markup for SEO */}
      <BikeServiceSchema
        serviceName="Royal Enfield on Rent"
        serviceSlug="royal-enfield-on-rent"
        description="Rent Royal Enfield bikes for road trips across India. Classic 350, Himalayan, Meteor, Hunter available. Best prices starting @₹599/day."
        faqs={schemaFaqs}
        vehicles={schemaVehicles}
        priceRange={{ min: 599, max: 1099 }}
        rating={4.8}
        reviewCount={2340}
      />
      <div className="flex flex-col">
        <BikeSearchHero />

      {/* Popular Routes */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Popular Royal Enfield Trip Routes
            </h2>
            <p className="text-gray-500">Handpicked touring circuits riders book most often</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { route: 'Ladakh Circuit', icon: Mountain, description: 'Manali - Leh - Khardung La - Pangong', duration: '10-15 days' },
              { route: 'Rajasthan Heritage', icon: Landmark, description: 'Jaipur - Jodhpur - Jaisalmer - Udaipur', duration: '7-10 days' },
              { route: 'Spiti Valley', icon: Compass, description: 'Manali - Kaza - Key Monastery - Chandratal', duration: '8-12 days' },
            ].map((trip) => (
              <div key={trip.route} className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mx-6 mt-6">
                  <trip.icon className="w-7 h-7 text-emerald-600" strokeWidth={1.8} />
                </div>
                <div className="p-6 pt-4">
                  <h3 className="text-[18px] font-bold text-gray-900 mb-1.5">{trip.route}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed mb-4">{trip.description}</p>
                  <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {trip.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        <StaticServicePopularCitiesGrid serviceSlug="royal-enfield-on-rent" title="Royal Enfield Rental in Available Cities" />

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
                Royal Enfield Rental <span className="text-emerald-600">FAQs</span>
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
    </>
  );
}
