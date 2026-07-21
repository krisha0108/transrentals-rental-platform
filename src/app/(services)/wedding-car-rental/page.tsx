import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Wedding Car Rental | Shadi Car on Rent from ₹2999',
  description: formatPriceHighlight('Book wedding cars for your special day. Luxury sedans, vintage cars, decorated cars. Baraat car rental, bride/groom car hire. Pan-India service.'),
  keywords: [
    'wedding car rental',
    'shadi car on rent',
    'baraat car hire',
    'wedding car decoration',
    'bride car rental',
    'groom car hire',
    'dulhan car',
    'marriage car booking',
    'vintage wedding car',
    'luxury wedding car',
    'decorated car for wedding',
  ],
  openGraph: {
    title: formatPriceHighlight('Wedding Car Rental India | Shadi Car @₹2999/Day | TransRentals'),
    description: formatPriceHighlight('Premium wedding cars for your special day. Baraat, bride & groom cars available. Book decorated cars across India.'),
  },
};

export default function WeddingCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      <HowToSchema
        name="How to Book a Wedding Car on TransRentals"
        description="Book a decorated wedding car for your special day in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Wedding Details', text: 'Share wedding date, venue location, required timing, and number of cars needed for the event.' },
          { name: 'Choose Car Type', text: 'Select luxury sedan, SUV, vintage car, or convertible. Specify if car decoration is required.' },
          { name: 'Review Package', text: 'Check package hours, included km, decoration charges, and chauffeur dress code.' },
          { name: 'Confirm & Celebrate', text: 'Pay advance to book. Decorated wedding car arrives at your venue on schedule. Complimentary flower decoration available.' },
        ]}
      />
      <SpecialtyCarBookingHero service="wedding" />

      {/* Why Wedding Car Rental */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Our Wedding Car Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '✨', title: 'Grand Entry', desc: 'Make your baraat unforgettable' },
              { icon: '🎨', title: 'Custom Decoration', desc: 'Flowers & ribbons included' },
              { icon: '📸', title: 'Photo-Ready Cars', desc: 'Perfect for wedding photography' },
              { icon: '💎', title: 'Luxury Options', desc: 'Vintage, sports & premium cars' },
              { icon: '🤵', title: 'Uniformed Chauffeur', desc: 'Professional drivers in uniform' },
              { icon: '🌹', title: 'All-India Service', desc: 'Available in 287+ cities' },
              { icon: '🎯', title: 'On-Time Arrival', desc: 'Punctuality guaranteed' },
              { icon: '💰', title: 'Affordable Packages', desc: 'Starting @₹2999 only' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Grid */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Wedding Car Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/wedding-car-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-rose-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Occasions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for All Wedding Functions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Baraat (बारात)', icon: '🎺', desc: 'Groom arrival in style' },
              { occasion: 'Bride Entry', icon: '👰', desc: 'Dulhan car service' },
              { occasion: 'Reception', icon: '🎊', desc: 'Couple car for reception' },
              { occasion: 'Haldi/Mehendi', icon: '🌼', desc: 'Pre-wedding functions' },
              { occasion: 'Engagement', icon: '💍', desc: 'Ring ceremony car' },
              { occasion: 'Sangeet', icon: '🎵', desc: 'Musical night arrival' },
              { occasion: 'Phera/Vidaai', icon: '🙏', desc: 'Ceremony & send-off' },
              { occasion: 'Photo Shoot', icon: '📷', desc: 'Wedding photography' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does wedding car rental cost in India?',
                a: 'Wedding car rental starts from ₹2999 for 4 hours. Premium luxury cars like Mercedes cost ₹6999-9999 per day. Decoration is included in all packages.',
              },
              {
                q: 'Is car decoration included in wedding car rental?',
                a: 'Yes! Basic flower decoration with ribbons is included FREE. Premium decoration with LED lights and full floral wrapping available at ₹1500 extra.',
              },
              {
                q: 'Which cities have wedding car rental service?',
                a: 'We provide wedding car rental in 287+ cities across India including all metros, tier 2 cities, and popular wedding destinations.',
              },
              {
                q: 'Can I book a vintage car for my wedding?',
                a: 'Yes! We have vintage Ambassador and classic cars available for Indian weddings. These are very popular for traditional baraat entries.',
              },
              {
                q: 'Do you provide chauffeur service for wedding cars?',
                a: 'Yes, all wedding cars come with professional uniformed chauffeur. The driver will be well-groomed and punctual for your special day.',
              },
              {
                q: 'How early should I book a wedding car?',
                a: 'We recommend booking at least 2-3 weeks in advance, especially during wedding season (November-February). Early booking ensures car availability and better prices.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
