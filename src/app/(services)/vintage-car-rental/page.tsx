import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
export const metadata: Metadata = {
  title: 'Vintage Car Rental | Classic Car for Wedding @₹8999 | Ambassador Car Hire',
  description: 'Rent vintage cars for weddings. Classic Ambassador, retro cars available. Vintage car for baraat. Heritage car booking @₹8999. Photo shoot ready.',
  keywords: [
    'vintage car rental',
    'vintage car for wedding',
    'classic car hire',
    'ambassador car rental',
    'retro car booking',
    'vintage car for baraat',
    'heritage car rental',
    'classic car for wedding',
    'vintage ambassador',
    'old car rental',
    'vintage car hire india',
    'retro car hire',
  ],
  openGraph: {
    title: 'Vintage Car Rental India | Classic Cars for Wedding @₹8999',
    description: 'Rent vintage & classic cars for weddings. Ambassador, heritage cars. Perfect for baraat and photo shoots.',
  },
};

export default function VintageCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      <ServiceHeroWithChat
        badge="Vintage Car Rental in Major Cities"
        title="Vintage Car Rental | Classic Cars for Wedding"
        titleHighlight="Starting @₹8999/Day"
        description="Rent vintage and classic cars for weddings, photoshoots, and special events. Ambassador, Impala, Rolls Royce available."
        gradientFrom="amber-50"
        gradientTo="orange-50"
      />


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-700 to-yellow-800 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Vintage Car Rental | Classic Heritage Cars
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Ambassador & Classic Cars for Weddings | Starting @₹8,999
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🚗</div>
                <h3 className="font-semibold mb-1">Heritage Cars</h3>
                <p className="text-sm opacity-90">Ambassador & classic models</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">💒</div>
                <h3 className="font-semibold mb-1">Wedding Perfect</h3>
                <p className="text-sm opacity-90">Ideal for baraat & photos</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🎀</div>
                <h3 className="font-semibold mb-1">Decoration Included</h3>
                <p className="text-sm opacity-90">Vintage-style decoration</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-amber-800 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#cars"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-800 transition"
              >
                View Vintage Cars
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Vintage Car */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Vintage Car for Wedding?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👑', title: 'Royal Appeal', desc: 'Classic vintage charm' },
              { icon: '📸', title: 'Photo Perfect', desc: 'Stunning wedding photos' },
              { icon: '🎨', title: 'Unique Style', desc: 'Stand out from crowd' },
              { icon: '💎', title: 'Heritage Value', desc: 'Timeless elegance' },
              { icon: '🎀', title: 'Custom Decoration', desc: 'Vintage-style decor' },
              { icon: '🤵', title: 'Uniformed Driver', desc: 'Traditional chauffeur' },
              { icon: '💒', title: 'Traditional Weddings', desc: 'Perfect for baraat' },
              { icon: '✨', title: 'Memorable Entry', desc: 'Unforgettable arrival' },
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
            Vintage Car Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/vintage-car-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-amber-800 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
                <p className="text-sm text-amber-800 mt-2">From @₹8999 →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vintage Cars Available */}
      <section id="cars" className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Vintage Car Collection
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Ambassador Classic (White)', price: '8999', features: 'Iconic Indian car, Traditional appeal, Wedding ready, Pristine condition', era: '1950s-1980s', best: 'Traditional weddings' },
              { name: 'Ambassador Mark II', price: '9999', features: 'Premium vintage, Elegant design, Photo perfect, Well-maintained', era: '1960s-1970s', best: 'Heritage weddings' },
              { name: 'Fiat Vintage', price: '12999', features: 'Italian classic, Unique charm, Rare model, Collector piece', era: '1960s', best: 'Unique weddings' },
              { name: 'Standard Herald', price: '14999', features: 'British classic, Convertible option, Premium vintage, Elegant', era: '1960s-1970s', best: 'Luxury vintage feel' },
              { name: 'Premier Padmini', price: '10999', features: 'Classic Indian sedan, Nostalgic appeal, Well-preserved, Iconic', era: '1970s-1980s', best: 'Retro theme' },
              { name: 'Vintage Jeep/Willy', price: '11999', features: 'Rugged classic, Open-top option, Adventure appeal, Unique', era: '1950s-1960s', best: 'Destination weddings' },
            ].map((car) => (
              <div key={car.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-t-4 border-amber-700">
                <p className="text-sm text-amber-800 font-semibold mb-2">{car.era}</p>
                <h3 className="text-xl font-bold mb-2">{car.name}</h3>
                <p className="text-3xl font-bold text-amber-800 mb-3">₹{car.price}/event</p>
                <p className="text-sm text-gray-600 mb-3">{car.features}</p>
                <p className="text-xs text-gray-500 mb-4">Best for: {car.best}</p>
                <button className="w-full bg-amber-700 text-white py-2 rounded hover:bg-amber-800 transition">
                  Book Vintage Car
                </button>
              </div>
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
              { occasion: 'Baraat Entry', icon: '🎺', desc: 'Traditional groom arrival' },
              { occasion: 'Wedding Photos', icon: '📸', desc: 'Stunning photo backdrops' },
              { occasion: 'Reception', icon: '💍', desc: 'Grand couple entry' },
              { occasion: 'Pre-Wedding Shoot', icon: '📷', desc: 'Vintage theme shoots' },
              { occasion: 'Heritage Events', icon: '🏛️', desc: 'Traditional functions' },
              { occasion: 'Film Shoots', icon: '🎬', desc: 'Period dramas' },
              { occasion: 'Corporate Events', icon: '🎯', desc: 'Retro theme parties' },
              { occasion: 'Birthday Parties', icon: '🎉', desc: 'Unique celebrations' },
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

      {/* Decoration & Features */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Vintage Car Features & Decoration
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-amber-900">Car Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Well-restored classic cars</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Pristine original condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Maintained regularly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Period-appropriate interiors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Photo-ready exteriors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Unique vintage appeal</span>
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-yellow-900">Decoration Options</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Vintage-style flower decoration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Traditional ribbons & bows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Heritage-themed decor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Custom nameplate available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Period-appropriate styling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Professional uniformed driver</span>
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
            Vintage Car Rental Packages
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Baraat Only', price: '8999-11999', desc: '4 hours package', best: 'Groom entry' },
              { duration: 'Full Day', price: '15999-24999', desc: '12 hours coverage', best: 'Multiple events' },
              { duration: 'Photo Shoot', price: '6999-9999', desc: '2-3 hours rental', best: 'Pre-wedding shoots' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-amber-800 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600 mb-2">{plan.desc}</p>
                <p className="text-xs text-amber-800 font-semibold">Best for: {plan.best}</p>
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
                q: 'How much does vintage car rental cost for wedding?',
                a: 'Vintage car rental starts from ₹8999 for 4 hours (baraat). Ambassador costs ₹8999-9999. Rare models like Fiat and Standard Herald cost ₹12999-14999. Full day package available.',
              },
              {
                q: 'Which vintage cars are available in India?',
                a: 'We have Ambassador Classic, Ambassador Mark II, Fiat Vintage, Standard Herald, Premier Padmini, and Vintage Jeep. All are well-maintained heritage cars.',
              },
              {
                q: 'Is decoration included in vintage car rental?',
                a: 'Yes! Basic vintage-style flower decoration with ribbons is included FREE. Premium heritage-themed decoration available at extra cost.',
              },
              {
                q: 'Can I rent vintage car for pre-wedding shoot?',
                a: 'Yes! We offer 2-3 hour packages for photo shoots starting @₹6999. Perfect for pre-wedding, engagement, and themed photography.',
              },
              {
                q: 'Are vintage cars well-maintained?',
                a: 'Yes, all our vintage cars are regularly maintained, well-restored, and in pristine condition. We ensure they are photo-ready and reliable for your event.',
              },
              {
                q: 'How early should I book a vintage car?',
                a: 'We recommend booking 3-4 weeks in advance, especially during wedding season. Vintage cars are limited in number and high in demand.',
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
