import { Metadata } from 'next';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { FAQSection } from '@/components/services/FAQSection';
import { ALL_CITIES } from '@/data/indian-cities';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: '17 Seater Tempo Traveller on Rent | Hire @₹20/km | TransRentals',
  description: 'Book 17 seater tempo traveller on rent for large group travel, weddings, corporate events. AC/Non-AC options. Driver included. Starting ₹20/km. Book now!',
  keywords: ['17 seater tempo traveller', '17 seater tempo traveller on rent', '17 seater bus rental', 'tempo traveller 17 seater price'],
  openGraph: {
    title: '17 Seater Tempo Traveller on Rent @₹20/km | TransRentals',
    description: 'Hire 17 seater tempo traveller with driver for large group travel.',
    url: 'https://transrentals.in/17-seater-tempo-traveller',
  },
  alternates: { canonical: 'https://transrentals.in/17-seater-tempo-traveller' },
};

const topCities = ALL_CITIES.slice(0, 12);

export default function SeventeenSeaterTempoTravellerPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a 17-Seater Tempo Traveller on TransRentals"
        description="Book a 17-seater tempo traveller for large group travel in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Trip & Group Details', text: 'Enter pickup city, destination, date, and confirm 15–17 passengers requiring the larger 17-seater vehicle.' },
          { name: 'Select Vehicle Type', text: 'Choose AC or non-AC 17-seater Force Traveller. Confirm luggage boot size for outstation trips.' },
          { name: 'Get & Compare Quotes', text: 'Review per-km or package quotes from verified bus operators. Check driver allowance and state permit.' },
          { name: 'Book & Confirm', text: 'Pay booking advance. Receive driver contact details. Meet driver at pickup on travel date.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Perfect for 15-17 People"
        title="17 Seater Tempo Traveller"
        titleHighlight="Starting @₹20/km"
        description="Spacious 17 seater tempo traveller for large group travel, weddings, corporate events & pilgrimages. AC & Non-AC options with professional driver."
        features={[
          { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Driver Included', color: 'text-emerald-600' },
          { icon: 'zap', text: '17 Seats', color: 'text-purple-600' },
        ]}
        gradientFrom="purple-50"
        gradientTo="indigo-50"
      />

      <section className="relative bg-gradient-to-br from-purple-700 to-indigo-800 text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">17 Seater Tempo Traveller on Rent</h1>
            <p className="text-xl opacity-90 mb-8">Non-AC • AC • Deluxe • Maharaja Variants</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#variants" className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">View Variants & Prices</a>
              <a href="#cities" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition">Find Near You</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose 17 Seater Tempo Traveller?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', title: 'Large Capacity', desc: 'Fits 15-17 people comfortably' },
              { icon: '💺', title: '2x1 Option', desc: 'Extra spacious Maharaja layout' },
              { icon: '🧳', title: 'More Luggage', desc: 'Bigger carrier & boot space' },
              { icon: '🎬', title: 'Entertainment', desc: 'LED TV & music system' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💒', title: 'Weddings', desc: 'Baraat & guest pickup' },
              { icon: '🏢', title: 'Corporate Events', desc: 'Team outings & conferences' },
              { icon: '🛕', title: 'Religious Tours', desc: 'Char Dham, temple visits' },
              { icon: '🎓', title: 'School/College', desc: 'Educational trips' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-lg text-center shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">17 Seater Tempo Traveller in 200+ Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topCities.map((city) => (
              <Link key={city.slug} href={`/17-seater-tempo-traveller/${city.slug}`} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-purple-50 border border-gray-200 transition">
                <span className="font-medium text-gray-800">{city.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6"><p className="text-gray-600">+ 190 more cities available</p></div>
        </div>
      </section>

      <FAQSection service="bus-rental" />
    </>
  );
}
