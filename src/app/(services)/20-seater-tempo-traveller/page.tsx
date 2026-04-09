import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';

export const metadata: Metadata = {
  title: '20 Seater Tempo Traveller on Rent | Hire @₹22/km | TransRentals',
  description: 'Book 20 seater tempo traveller on rent for large groups, weddings, pilgrimages. AC/Non-AC with driver. Starting ₹22/km. Book now!',
  keywords: ['20 seater tempo traveller', '20 seater bus on rent', '20 seater tempo traveller price'],
  openGraph: {
    title: '20 Seater Tempo Traveller on Rent @₹22/km | TransRentals',
    url: 'https://transrentals.in/20-seater-tempo-traveller',
  },
  alternates: { canonical: 'https://transrentals.in/20-seater-tempo-traveller' },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function TwentySeaterTempoTravellerPage() {
  return (
    <>
      <ServiceHeroWithChat
        badge="Perfect for 18-20 People"
        title="20 Seater Tempo Traveller"
        titleHighlight="Starting @₹22/km"
        description="Large 20 seater tempo traveller for big groups, weddings, corporate events & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '20 Seats', color: 'text-orange-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      <section className="relative bg-gradient-to-br from-orange-600 to-red-700 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">20 Seater Tempo Traveller on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Deluxe Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-orange-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose 20 Seater?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Big Capacity', desc: 'Fits 18-20 people' },
              { icon: '🧳', title: 'Extra Luggage', desc: 'Large carrier space' },
              { icon: '💰', title: 'Cost Effective', desc: 'Lower per-person cost' },
              { icon: '🛣️', title: 'Long Distance', desc: 'Comfortable for tours' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">20 Seater Tempo Traveller in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/20-seater-tempo-traveller/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-orange-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
