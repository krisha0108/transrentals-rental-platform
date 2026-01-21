import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
export const metadata: Metadata = {
  title: 'Wedding Car Rental | Shadi Car on Rent @₹2999/Day | Baraat Car Hire',
  description: 'Book wedding cars for your special day. Luxury sedans, vintage cars, decorated cars. Baraat car rental, bride/groom car hire. Pan-India service.',
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
    title: 'Wedding Car Rental India | Shadi Car @₹2999/Day | TransRentals',
    description: 'Premium wedding cars for your special day. Baraat, bride & groom cars available. Book decorated cars across India.',
  },
};

export default function WeddingCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      <ServiceHeroWithChat
        badge="Wedding Car Services in 250+ Cities"
        title="Wedding Car Rental | शादी की गाड़ी"
        titleHighlight="Luxury Cars Starting @₹2999/Day"
        description="Make your special day memorable with our premium wedding cars. Luxury sedans, vintage cars, decorated baraat cars for groom & bride."
        gradientFrom="pink-50"
        gradientTo="rose-50"
      />

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
                <p className="text-sm text-rose-700 mt-2">From @₹2999 →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Cars Available */}
      <section id="cars" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Wedding Car Collection
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Fortuner (Premium SUV)', price: '4999', features: 'Perfect for groom baraat, spacious, commanding presence', category: 'Premium Baraat Car' },
              { name: 'Mercedes E-Class', price: '6999', features: 'Ultimate luxury, elegant design, premium interiors', category: 'Luxury Wedding Car' },
              { name: 'BMW 5 Series', price: '7499', features: 'Sporty luxury, sophisticated look, wedding perfect', category: 'Premium Luxury' },
              { name: 'Vintage Ambassador', price: '3999', features: 'Classic Indian wedding car, retro charm, decorated', category: 'Vintage Wedding Car' },
              { name: 'Audi A6 (White)', price: '7999', features: 'Pure elegance, pristine white, stunning photos', category: 'Luxury Sedan' },
              { name: 'Range Rover', price: '9999', features: 'Royal arrival, luxury SUV, VIP experience', category: 'Royal Wedding Car' },
            ].map((car) => (
              <div key={car.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-rose-600">
                <p className="text-sm text-rose-700 font-semibold mb-2">{car.category}</p>
                <h3 className="text-xl font-bold mb-2">{car.name}</h3>
                <p className="text-3xl font-bold text-rose-700 mb-2">₹{car.price}/event</p>
                <p className="text-sm text-gray-600 mb-4">{car.features}</p>
                <button className="w-full bg-rose-600 text-white py-2 rounded hover:bg-rose-700 transition">
                  Book for Wedding
                </button>
              </div>
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

      {/* Decoration Options */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Wedding Car Decoration Options
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-rose-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-rose-800">Standard Decoration (Free)</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Fresh flower garlands</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Ribbon & bows on bonnet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Side door decorations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-700 mt-1">✓</span>
                  <span>Basic floral arrangements</span>
                </li>
              </ul>
            </div>
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-amber-900">Premium Decoration (+₹1500)</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Premium flower arrangements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>LED lights & decorative lights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Custom name board</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Full car floral wrapping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Interior decoration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Wedding Car Rental Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Baraat Only', price: '2999-4999', desc: '4 hours package', best: 'Groom entry only' },
              { duration: 'Full Day', price: '5999-9999', desc: '12 hours coverage', best: 'Multiple functions' },
              { duration: 'Weekend Package', price: '15000-25000', desc: '2-3 days rental', best: 'Destination weddings' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-rose-700 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600 mb-2">{plan.desc}</p>
                <p className="text-xs text-rose-700 font-semibold">Best for: {plan.best}</p>
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
