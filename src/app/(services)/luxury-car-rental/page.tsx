import { Metadata } from 'next';
import { Crown, Star, Shield, Car, MapPin, Clock } from 'lucide-react';
import { SimpleServiceHero } from '@/components/services/SimpleServiceHero';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema, BreadcrumbSchema } from '@/components/seo/schemas';

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
      {/* Hero Section */}
      <SimpleServiceHero
        badge="Premium Collection"
        title="Luxury & Exotic"
        titleHighlight="Car Rental"
        description="Experience the extraordinary. BMW, Mercedes, Ferrari, Lamborghini, Rolls-Royce. Book your dream car!"
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Fully Insured', color: 'text-green-600' },
          { icon: 'zap', text: '20+ Exotic Cars', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="amber-50"
      />

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
      <ServiceLocationsGrid
        serviceSlug="luxury-car-rental"
        title="Luxury Cars Across India"
        startingPrice="₹5,999"
        priceUnit="/day"
      />

      {/* Occasions Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Perfect for Every Occasion
            </h2>
            <p className="text-gray-600 text-lg">
              Make every moment unforgettable
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Weddings', icon: '💒', desc: 'Arrive in grand style on your special day', color: 'from-pink-50 to-rose-50' },
              { occasion: 'Corporate Events', icon: '💼', desc: 'Impress clients and business partners', color: 'from-blue-50 to-indigo-50' },
              { occasion: 'Parties & Celebrations', icon: '🎉', desc: 'Make a statement at every event', color: 'from-purple-50 to-violet-50' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: 'VIP pick-up and drop service', color: 'from-cyan-50 to-sky-50' },
              { occasion: 'Photoshoots', icon: '📸', desc: 'Perfect backdrop for your shoot', color: 'from-amber-50 to-orange-50' },
              { occasion: 'Date Nights', icon: '❤️', desc: 'Create romantic memories', color: 'from-red-50 to-pink-50' },
              { occasion: 'Business Meetings', icon: '🤝', desc: 'Professional first impression', color: 'from-slate-50 to-gray-100' },
              { occasion: 'City Tours', icon: '🌆', desc: 'Explore in ultimate comfort', color: 'from-green-50 to-emerald-50' },
            ].map((item) => (
              <div key={item.occasion} className={`bg-gradient-to-br ${item.color} p-6 rounded-xl text-center hover:shadow-lg transition-shadow duration-300`}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
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
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
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
