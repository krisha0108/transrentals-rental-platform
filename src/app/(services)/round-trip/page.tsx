import { Metadata } from 'next';
import { RoundTripRoutesGrid } from '@/components/services/RoundTripRoutesGrid';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';

export const metadata: Metadata = {
  title: 'Round Trip Cab Service | Outstation Round Trip Taxi @ Best Rates | TransRentals',
  description: 'Book round trip cabs for outstation travel. AC sedans, SUVs with professional drivers. Round trip packages starting @₹10/km. Go and return with same driver.',
  keywords: [
    'round trip cab',
    'round trip taxi',
    'outstation round trip',
    'return trip cab',
    'round trip car rental',
    'outstation cab round trip',
    'round trip taxi booking',
    'cab for round trip',
    'round trip package',
    'return cab booking',
  ],
  openGraph: {
    title: 'Round Trip Cab Service - Book Return Trip Cabs @ Best Rates',
    description: 'Book round trip cabs for outstation travel starting @₹10/km. Professional drivers, all charges included.',
    url: 'https://transrentals.in/round-trip',
    type: 'website',
  },
  alternates: {
    canonical: 'https://transrentals.in/round-trip',
  },
};

export default function RoundTripPage() {
  return (
    <>
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="round-trip" />

      {/* Why Choose Round Trip */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Why Choose Round Trip Over One-Way?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💰',
                title: 'Save 20-30%',
                desc: 'Round trip is significantly cheaper than booking two separate one-way trips',
              },
              {
                icon: '🔄',
                title: 'Same Driver',
                desc: 'Travel with the same trusted driver both ways - no coordination hassle',
              },
              {
                icon: '⏰',
                title: 'Flexible Schedule',
                desc: 'Return anytime within package duration, driver waits for you',
              },
              {
                icon: '🎯',
                title: 'No Last-Minute Booking',
                desc: 'No need to search for return cab at destination, peace of mind',
              },
              {
                icon: '🛡️',
                title: 'Better Service',
                desc: 'Driver ensures excellent experience as they depend on return trip',
              },
              {
                icon: '📞',
                title: 'Easy Coordination',
                desc: 'Direct communication with driver, flexible pickup times',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Round Trip Routes */}
      <RoundTripRoutesGrid />

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            How Round Trip Cab Booking Works
          </h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Select Your Route',
                desc: 'Choose starting city and destination from our route list',
              },
              {
                step: '2',
                title: 'Choose Vehicle Type',
                desc: 'Select from Sedan, SUV, Innova based on your group size',
              },
              {
                step: '3',
                title: 'Book & Pay',
                desc: 'Confirm your booking with advance payment',
              },
              {
                step: '4',
                title: 'Driver Arrives',
                desc: 'Professional driver picks you up at scheduled time',
              },
              {
                step: '5',
                title: 'Travel Comfortably',
                desc: 'Enjoy your journey with AC car and experienced driver',
              },
              {
                step: '6',
                title: 'Flexible Return',
                desc: 'Return anytime within package, driver waits for you',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Types */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Round Trip Package Options
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: '2 Days / 1 Night',
                distance: '500km',
                ideal: 'Weekend trips, short visits',
                features: ['250km/day minimum', 'Driver allowance included', 'Flexible stops'],
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                name: '3 Days / 2 Nights',
                distance: '750km',
                ideal: 'Leisure trips, family outings',
                features: ['250km/day minimum', 'Hotel recommendations', 'Sightseeing stops'],
                gradient: 'from-purple-500 to-pink-500',
                popular: true,
              },
              {
                name: 'Custom Duration',
                distance: 'Any',
                ideal: 'Extended tours, business trips',
                features: ['Flexible itinerary', 'Multiple destinations', 'Custom packages'],
                gradient: 'from-orange-500 to-red-500',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-gradient-to-br ${pkg.gradient} text-white rounded-xl p-6 shadow-lg`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-white/90 mb-1">Up to {pkg.distance}</p>
                <p className="text-sm text-white/80 mb-4">{pkg.ideal}</p>
                <ul className="space-y-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is included in round trip cab fare?',
                a: 'Round trip cab fare includes driver charges, fuel for both ways, toll charges, parking fees, state permits, driver allowance, and vehicle insurance.',
              },
              {
                q: 'How much cheaper is round trip compared to one-way?',
                a: 'Round trip is typically 20-30% cheaper than booking two separate one-way trips because you avoid return empty km charges.',
              },
              {
                q: 'Can I return on a different day?',
                a: 'Yes! Round trip packages are flexible. You can return anytime within the package duration (2-3 days typically).',
              },
              {
                q: 'Where does the driver stay during the trip?',
                a: 'Driver accommodation is your responsibility. Most budget hotels provide complimentary driver rooms, or driver can arrange their own stay.',
              },
              {
                q: 'Is there a minimum km per day?',
                a: 'Yes, most round trip packages have a 250km/day minimum. Extra km beyond package limits are charged at per km rate.',
              },
              {
                q: 'Can I make stops during the journey?',
                a: 'Absolutely! You can make flexible stops for meals, sightseeing, or rest. All reasonable stops are included in the package.',
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

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Round Trip Cab Service',
            description:
              'Book round trip cabs for outstation travel. Professional drivers, AC vehicles, all charges included.',
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
            areaServed: {
              '@type': 'Country',
              name: 'India',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '10',
              highPrice: '25',
              priceSuffix: '/km',
            },
          }),
        }}
      />
    </>
  );
}
