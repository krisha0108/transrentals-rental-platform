import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Sports Car Rental | Supercar Hire @₹25000/Day | Ferrari Lamborghini India'),
  description: formatPriceHighlight('Rent sports cars & supercars. Ferrari, Lamborghini, Porsche available. Luxury sports car hire @₹25000/day. Self-drive & chauffeur options.'),
  keywords: [
    'sports car rental',
    'supercar rental india',
    'sports car hire',
    'Ferrari rental',
    'Lamborghini booking',
    'luxury sports car',
    'supercar hire india',
    'sports car for wedding',
    'exotic car rental',
    'Porsche rental',
    'McLaren hire',
    'premium sports car',
  ],
  openGraph: {
    title: formatPriceHighlight('Sports Car Rental India | Ferrari, Lamborghini @₹25000/Day'),
    description: formatPriceHighlight('Rent exotic supercars - Ferrari, Lamborghini, Porsche. Ultimate luxury sports car experience.'),
  },
};

export default function SportsCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      <ServiceHeroWithChat
        badge="Sports Car Rental in Major Cities"
        title="Sports Car Rental | Luxury Performance Cars"
        titleHighlight="Starting @₹12,999/Day"
        description="Rent sports cars for special occasions, photoshoots, or thrilling experiences. Ferrari, Lamborghini, Porsche available."
        gradientFrom="red-50"
        gradientTo="rose-50"
      />


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-700 to-red-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sports Car Rental | Supercar Hire India
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Ferrari, Lamborghini, Porsche & More | Starting @₹25,000/Day
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🏎️</div>
                <h3 className="font-semibold mb-1">Exotic Supercars</h3>
                <p className="text-sm opacity-90">Ferrari, Lamborghini, McLaren</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-semibold mb-1">High Performance</h3>
                <p className="text-sm opacity-90">Ultimate driving experience</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">👨‍✈️</div>
                <h3 className="font-semibold mb-1">Flexible Options</h3>
                <p className="text-sm opacity-90">Self-drive or chauffeur</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-red-800 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#cars"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-800 transition"
              >
                View Supercars
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sports Car */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Rent a Sports Car?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🏆', title: 'Ultimate Experience', desc: 'Dream car driving' },
              { icon: '💎', title: 'Luxury & Style', desc: 'Arrive in elegance' },
              { icon: '📸', title: 'Memorable Photos', desc: 'Instagram-worthy' },
              { icon: '🎉', title: 'Special Occasions', desc: 'Weddings, parties, events' },
              { icon: '⚡', title: 'High Performance', desc: 'Thrilling power' },
              { icon: '🌟', title: 'VIP Treatment', desc: 'Feel like celebrity' },
              { icon: '🎯', title: 'Bucket List', desc: 'Fulfill your dreams' },
              { icon: '💼', title: 'Corporate Events', desc: 'Impress clients' },
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
            Sports Car Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/sports-car-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-red-800 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Occasions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for Special Occasions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Weddings', icon: '💒', desc: 'Grand entry & exit' },
              { occasion: 'Birthdays', icon: '🎂', desc: 'Memorable celebration' },
              { occasion: 'Proposals', icon: '💍', desc: 'Romantic surprise' },
              { occasion: 'Photo Shoots', icon: '📸', desc: 'Luxury backdrops' },
              { occasion: 'Corporate Events', icon: '💼', desc: 'VIP transport' },
              { occasion: 'Music Videos', icon: '🎬', desc: 'Film production' },
              { occasion: 'Joy Rides', icon: '🏁', desc: 'Weekend thrill' },
              { occasion: 'Bucket List', icon: '✨', desc: 'Fulfill dreams' },
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

      {/* Features & Options */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sports Car Rental Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-red-900">Car Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Latest supercar models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Pristine condition vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>High-performance engines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Exotic interiors & features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Advanced safety systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Regularly serviced & maintained</span>
                </li>
              </ul>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-orange-900">Rental Options</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Self-drive (with deposit)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Professional chauffeur included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Hourly, daily, weekly rentals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Comprehensive insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>24/7 support & assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Doorstep delivery available</span>
                </li>
              </ul>
            </div>
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
                q: 'How much does sports car rental cost in India?',
                a: 'Sports car rental starts from ₹25,000/day for Nissan GT-R. Premium supercars like Ferrari cost ₹80,000/day, Lamborghini ₹75,000/day. Hourly packages also available.',
              },
              {
                q: 'Can I self-drive a sports car?',
                a: 'Yes, self-drive is available with valid license (minimum 3 years experience) and high security deposit. Professional chauffeur service also available for all supercars.',
              },
              {
                q: 'Which sports cars are available in India?',
                a: 'We have Lamborghini Huracan, Ferrari 488, Porsche 911, McLaren 570S, Audi R8, and Nissan GT-R. Availability varies by city.',
              },
              {
                q: 'What documents are required for sports car rental?',
                a: 'You need valid driving license (3+ years), Aadhar card, PAN card, address proof, and high-value security deposit (₹2-5 lakhs depending on car).',
              },
              {
                q: 'Is insurance included in sports car rental?',
                a: 'Yes, comprehensive insurance is included. However, high deductible applies. Any damage during rental period may require payment as per insurance terms.',
              },
              {
                q: 'Can I rent sports car for wedding?',
                a: 'Yes! Sports cars are very popular for weddings - groom entry, couple exit, photo shoots. We provide professional chauffeur and maintain pristine condition.',
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
