import { Metadata } from 'next';
import {
  Crown, Star, Shield, Car, MapPin, Clock,
  Heart, Briefcase, PartyPopper, Plane, Camera, Handshake, Compass,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { LuxuryBookingHero } from '@/components/luxury';
import { CarRentalPopularCitiesGrid } from '@/components/car-rental/CarRentalPopularCitiesGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

const OCCASIONS = [
  { icon: Heart, anim: 'pulse', occasion: 'Weddings', desc: 'Arrive in grand style on your special day' },
  { icon: Briefcase, anim: 'drive', occasion: 'Corporate Events', desc: 'Impress clients and business partners' },
  { icon: PartyPopper, anim: 'grow', occasion: 'Parties & Celebrations', desc: 'Make a statement at every event' },
  { icon: Plane, anim: 'drive', occasion: 'Airport Transfers', desc: 'VIP pick-up and drop service' },
  { icon: Camera, anim: 'tick', occasion: 'Photoshoots', desc: 'Perfect backdrop for your shoot' },
  { icon: Heart, anim: 'pulse', occasion: 'Date Nights', desc: 'Create romantic memories' },
  { icon: Handshake, anim: 'wrench', occasion: 'Business Meetings', desc: 'Professional first impression' },
  { icon: Compass, anim: 'lift', occasion: 'City Tours', desc: 'Explore in ultimate comfort' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

export const metadata: Metadata = {
  title: 'Luxury Car Rental - BMW, Mercedes, Audi, Ferrari, Lamborghini | TransRentals',
  description: 'Rent luxury & exotic cars - Rolls-Royce, Bentley, Ferrari, Lamborghini, Porsche, BMW, Mercedes, Audi. Premium car rental for weddings, corporate events, photoshoots.',
  keywords: ['luxury car rental', 'exotic car hire', 'BMW rental', 'Mercedes rental', 'Ferrari rental', 'Lamborghini rental', 'wedding car hire', 'premium car rental india'],
  openGraph: {
    title: 'Luxury & Exotic Car Rental India | TransRentals',
    description: 'Rent luxury cars across India. Rolls-Royce, Bentley, Ferrari, Lamborghini, Porsche. Premium experience with chauffeur service.',
    type: 'website',
    url: 'https://transrentals.in/luxury-car-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=luxury-car-rental', width: 1200, height: 630, alt: 'Luxury Car Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury & Exotic Car Rental India | TransRentals',
    description: 'Rent luxury cars across India. BMW, Mercedes, Ferrari, Lamborghini, Rolls-Royce.',
    images: ['https://transrentals.in/api/og?service=luxury-car-rental'],
  },
  alternates: { canonical: 'https://transrentals.in/luxury-car-rental' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default function LuxuryCarRentalPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'Luxury Car Rental', url: 'https://transrentals.in/luxury-car-rental' },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Luxury & Exotic Car Rental India',
          description: 'Rent luxury cars — Rolls-Royce, Bentley, Ferrari, Lamborghini, Porsche, BMW, Mercedes, Audi across India.',
          url: 'https://transrentals.in/luxury-car-rental',
          serviceType: 'Luxury Car Rental',
          provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
          areaServed: { '@type': 'Country', name: 'India' },
          offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: 8000, highPrice: 200000, offerCount: 20 },
        }) }}
      />
      <HowToSchema
        name="How to Book a Luxury Car Rental on TransRentals"
        description="Rent exotic and luxury cars in India — BMW, Mercedes, Ferrari, Rolls-Royce."
        totalTime="PT10M"
        steps={[
          { name: 'Browse the Fleet', text: 'Explore 20+ luxury & exotic cars — Rolls-Royce, Ferrari, Lamborghini, Porsche, BMW, and Mercedes.' },
          { name: 'Select City & Dates', text: 'Pick your city, rental start date and end date. Chauffeur-driven and self-drive options available.' },
          { name: 'Confirm Booking', text: 'Choose your preferred car, confirm pricing, and pay securely online.' },
          { name: 'Enjoy the Experience', text: 'Your luxury car arrives ready for you — fully fuelled, sanitised, and with a professional driver if opted.' },
        ]}
      />
      {/* Hero Section — same booking hero the city pages use. With no
          citySlug the pick-up field decides which city to book in. */}
      <LuxuryBookingHero />

      {/* Fleet Display from Database */}
      <div id="fleet">
        <ServiceFleetDisplay
          serviceSlug="luxury-car-rental"
          title="Our Luxury Fleet"
          showCategories={true}
          limit={12}
          priceUnit="/day"
        />
      </div>

      {/* Locations from Database */}
      <CarRentalPopularCitiesGrid
        serviceSlug="luxury-car-rental"
        title="Luxury Car Rental in Available Cities"
      />

      {/* Occasions Section */}
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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Perfect for <span className="text-emerald-600">Every Occasion</span>
            </h2>
            <p className="text-gray-500 text-lg">Make every moment unforgettable</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {OCCASIONS.map((item, idx) => (
              <div
                key={item.occasion}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `lux-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.occasion}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes lux-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="lux-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              The TransRentals Difference
            </h2>
            <p className="text-gray-600 text-lg">
              Why discerning customers choose us
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Crown, title: 'Curated Collection', desc: 'Hand-picked luxury and exotic vehicles maintained to perfection', color: 'text-amber-500' },
              { icon: Shield, title: 'Fully Insured', desc: 'Comprehensive insurance coverage for complete peace of mind', color: 'text-green-500' },
              { icon: Star, title: 'Expert Chauffeurs', desc: 'Professional, trained drivers who understand luxury service', color: 'text-purple-500' },
              { icon: Clock, title: 'Flexible Rentals', desc: 'Hourly, daily, weekly - whatever suits your schedule', color: 'text-blue-500' },
              { icon: MapPin, title: 'Doorstep Delivery', desc: 'We deliver the car to your preferred location', color: 'text-red-500' },
              { icon: Car, title: '24/7 Support', desc: 'Round-the-clock assistance for any requirements', color: 'text-cyan-500' },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 w-12 h-12 ${feature.color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
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
        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Luxury Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'What luxury cars are available for rent?',
                a: 'We offer a wide range including Mercedes E-Class, BMW 5/7 Series, Audi A6/A8, Jaguar XF, Range Rover, Porsche 911/Cayenne, Bentley Continental/Bentayga, Rolls-Royce Ghost, Ferrari 488, Lamborghini Huracan, and more.',
              },
              {
                q: 'How much does luxury car rental cost?',
                a: 'Prices start from ₹5,999/day for premium sedans like Mercedes E-Class. Ultra-luxury cars like Rolls-Royce start at ₹45,000/day. Exotic supercars like Ferrari and Lamborghini range from ₹75,000-85,000/day.',
              },
              {
                q: 'Is chauffeur service included?',
                a: 'Yes, professional chauffeur service is included with all luxury car rentals. Self-drive options are available for select models after verification.',
              },
              {
                q: 'Can I rent luxury cars for weddings?',
                a: 'Absolutely! Our luxury cars are perfect for weddings. We offer special wedding packages with decorations, red carpet service, and professional chauffeurs.',
              },
              {
                q: 'What documents are required?',
                a: 'You need valid ID proof (Aadhaar/Passport), address proof, and a refundable security deposit. For self-drive, a valid driving license is required.',
              },
              {
                q: 'Is insurance included?',
                a: 'Yes, all our luxury cars come with comprehensive insurance coverage. Additional coverage options are available for exotic supercars.',
              },
              {
                q: 'How far in advance should I book a luxury car?',
                a: 'For weddings and major events, book at least 2–3 weeks in advance — premium vehicles like Rolls-Royce and Bentley have very limited availability. For corporate and airport transfers, 48–72 hours notice is usually sufficient.',
              },
              {
                q: 'Are luxury cars available for hourly hire?',
                a: 'Yes, hourly packages (minimum 4 hours) are available for airport transfers, corporate meetings, and short-duration events. Full-day rates offer better value for weddings and all-day photoshoots.',
              },
            ].map((faq, idx) => (
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

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-900 to-gray-900 rounded-2xl p-8 md:p-12 text-center text-white">
            <Crown className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for the Luxury Experience?
            </h2>
            <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
              Browse our collection above and book your dream car in minutes. Make every journey extraordinary.
            </p>
            <a
              href="#fleet"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Car className="w-5 h-5" />
              Browse Fleet
            </a>
          </div>
        </div>
      </section>

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'What luxury cars are available for rent?', acceptedAnswer: { '@type': 'Answer', text: 'We offer Mercedes E-Class, BMW 5/7 Series, Audi A6/A8, Jaguar XF, Range Rover, Porsche 911/Cayenne, Bentley Continental/Bentayga, Rolls-Royce Ghost, Ferrari 488, Lamborghini Huracan, and more.' } },
              { '@type': 'Question', name: 'How much does luxury car rental cost?', acceptedAnswer: { '@type': 'Answer', text: 'Prices start from ₹5,999/day for premium sedans like Mercedes E-Class. Ultra-luxury cars like Rolls-Royce start at ₹45,000/day. Exotic supercars like Ferrari and Lamborghini range from ₹75,000–₹85,000/day.' } },
              { '@type': 'Question', name: 'Is chauffeur service included?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, professional chauffeur service is included with all luxury car rentals. Self-drive options are available for select models after verification.' } },
              { '@type': 'Question', name: 'Can I rent luxury cars for weddings?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely! Our luxury cars are perfect for weddings. We offer special wedding packages with decorations, red carpet service, and professional chauffeurs.' } },
              { '@type': 'Question', name: 'What documents are required?', acceptedAnswer: { '@type': 'Answer', text: 'You need valid ID proof (Aadhaar/Passport), address proof, and a refundable security deposit. For self-drive, a valid driving license is required.' } },
              { '@type': 'Question', name: 'Is insurance included?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, all our luxury cars come with comprehensive insurance coverage. Additional coverage options are available for exotic supercars.' } },
              { '@type': 'Question', name: 'How far in advance should I book a luxury car?', acceptedAnswer: { '@type': 'Answer', text: 'For weddings and major events, book at least 2–3 weeks in advance — premium vehicles like Rolls-Royce and Bentley have very limited availability. For corporate and airport transfers, 48–72 hours notice is usually sufficient.' } },
              { '@type': 'Question', name: 'Are luxury cars available for hourly hire?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, hourly packages (minimum 4 hours) are available for airport transfers, corporate meetings, and short-duration events. Full-day rates offer better value for weddings and all-day photoshoots.' } },
            ],
          }),
        }}
      />
    </>
  );
}
