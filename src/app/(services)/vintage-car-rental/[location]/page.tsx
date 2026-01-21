import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_CITIES, STATIC_CITIES } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

interface PageProps {
  params: {
    location: string;
  };
}

export async function generateStaticParams() {
  return ALL_CITIES
    .filter(city => city.priority >= 7)
    .map((city) => ({
      location: city.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = ALL_CITIES.find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Vintage Car Rental | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: `Vintage Car Rental ${locationName} | Classic Car Wedding @₹8999 | Ambassador`,
    description: `Rent vintage cars in ${locationName}, ${city.state}. Classic Ambassador, retro cars for weddings. Heritage car booking @₹8999. Photo shoot ready.`,
    keywords: [
      `vintage car rental ${locationName.toLowerCase()}`,
      `vintage car wedding ${locationName.toLowerCase()}`,
      `classic car ${locationName.toLowerCase()}`,
      `ambassador car ${locationName.toLowerCase()}`,
      `vintage car hire ${locationName.toLowerCase()}`,
      `retro car ${locationName.toLowerCase()}`,
      ...city.keywords.map(k => `vintage car ${k}`),
    ],
    openGraph: {
      title: `Vintage Car Rental in ${locationName} - Classic Cars @₹8999`,
      description: `Book vintage & classic cars in ${locationName}. Perfect for weddings and photo shoots.`,
      url: `https://transrentals.in/vintage-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/vintage-car-rental/${params.location}`,
    },
  };
}

export default function VintageCarRentalLocationPage({ params }: PageProps) {
  const city = ALL_CITIES.find(c => c.slug === params.location);

  if (!city) {
    notFound();
  }

  const locationName = city.name;

  return (
    <>
      <ServiceHeroWithChat
        badge={`Vintage Car Rental in ${locationName}`}
        title="Vintage & Classic Cars"
        titleHighlight="Heritage Cars @₹8999/day"
        description={`Rent vintage and classic cars in ${locationName}. Ambassador, retro cars for weddings and photo shoots. Make your event truly memorable.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Well Maintained', color: 'text-amber-600' },
          { icon: 'zap', text: 'Photo Ready', color: 'text-yellow-600' },
        ]}
        gradientFrom="amber-50"
        gradientTo="yellow-50"
      />

      {/* Why Vintage Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Vintage Car in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👑', title: 'Royal Appeal', desc: `Classic charm in ${locationName}` },
              { icon: '📸', title: 'Photo Perfect', desc: 'Stunning wedding photos' },
              { icon: '🎨', title: 'Unique Style', desc: 'Stand out' },
              { icon: '💎', title: 'Heritage', desc: 'Timeless elegance' },
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

      {/* Vintage Cars Available */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Vintage Cars Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { car: 'Ambassador Classic', price: '8999', era: '1950s-1980s' },
              { car: 'Ambassador Mark II', price: '9999', era: '1960s-1970s' },
              { car: 'Fiat Vintage', price: '12999', era: '1960s' },
              { car: 'Standard Herald', price: '14999', era: '1960s-1970s' },
              { car: 'Premier Padmini', price: '10999', era: '1970s-1980s' },
              { car: 'Vintage Jeep', price: '11999', era: '1950s-1960s' },
            ].map((item) => (
              <div key={item.car} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-amber-700">
                <p className="text-sm text-amber-800 font-semibold mb-2">{item.era}</p>
                <h3 className="text-xl font-bold mb-2">{item.car}</h3>
                <p className="text-2xl font-bold text-amber-800 mb-4">₹{item.price}/event</p>
                <button className="w-full bg-amber-700 text-white py-2 rounded hover:bg-amber-800 transition">
                  Book Vintage Car
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Occasions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Baraat Entry', icon: '🎺', desc: `Traditional entry in ${locationName}` },
              { occasion: 'Wedding Photos', icon: '📸', desc: 'Stunning backdrops' },
              { occasion: 'Pre-Wedding', icon: '📷', desc: 'Vintage theme shoots' },
              { occasion: 'Heritage Events', icon: '🏛️', desc: 'Traditional functions' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Vintage Car Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-amber-800">Car Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Well-restored classics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Pristine condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Photo-ready exteriors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Period interiors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Unique vintage appeal</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-yellow-900">Decoration</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Vintage-style flowers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Traditional ribbons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Heritage-themed decor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Custom nameplate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-800 mt-1">✓</span>
                  <span>Uniformed driver</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Vintage Car Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Baraat Only', price: '8999-11999', desc: '4 hours' },
              { duration: 'Full Day', price: '15999-24999', desc: '12 hours' },
              { duration: 'Photo Shoot', price: '6999-9999', desc: '2-3 hours' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-amber-800 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does vintage car cost in ${locationName}?`,
                a: `Vintage car rental in ${locationName} starts from ₹8999 for 4 hours. Ambassador costs ₹8999-9999. Rare models cost ₹12999-14999.`,
              },
              {
                q: `Which vintage cars available in ${locationName}?`,
                a: `We have Ambassador Classic, Fiat Vintage, Standard Herald, Premier Padmini in ${locationName}.`,
              },
              {
                q: `Is decoration included in ${locationName}?`,
                a: `Yes! Basic vintage-style decoration is FREE in ${locationName}. Premium decor available extra.`,
              },
              {
                q: `Can I rent for photo shoot in ${locationName}?`,
                a: `Yes! 2-3 hour packages for shoots in ${locationName} starting @₹6999.`,
              },
              {
                q: `How to book vintage car in ${locationName}?`,
                a: `Book online. Select ${locationName}, choose vintage car, date and complete booking.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg">
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
            '@type': 'Product',
            name: `Vintage Car Rental in ${locationName}`,
            description: `Rent vintage & classic cars in ${locationName} for weddings and events.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '8999',
              highPrice: '14999',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

    </>
  );
}
