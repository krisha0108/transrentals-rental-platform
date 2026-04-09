import { Metadata } from 'next';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Tempo Traveller on Rent | 12, 17 Seater @₹18/Km | Force Traveller Booking'),
  description: formatPriceHighlight('Rent Tempo Traveller for group travel. 12 seater, 17 seater, 20 seater available. Family trips, pilgrimages, corporate events. Book force traveller online.'),
  keywords: [
    'tempo traveller on rent',
    '12 seater tempo traveller',
    '17 seater tempo traveller',
    'force traveller',
    'tempo booking',
    'group travel vehicle',
    'family trip vehicle',
    'tempo on rent',
    'traveller on hire',
    'mini bus rental',
    '20 seater tempo',
    'tempo for outstation',
  ],
  openGraph: {
    title: formatPriceHighlight('Tempo Traveller on Rent India | 12-17 Seater @₹18/Km | TransRentals'),
    description: formatPriceHighlight('Book Tempo Traveller for group travel across India. Comfortable AC vehicles for family trips and corporate events.'),
  },
};

export default function TempoTravellerPage() {
  const occasionsSection = (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Perfect for Every Occasion
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { occasion: 'Family Trips', icon: '👨‍👩‍👧‍👦', desc: 'Hill stations, vacations' },
            { occasion: 'Pilgrimages', icon: '🛕', desc: 'Temple tours, Char Dham' },
            { occasion: 'Corporate Events', icon: '💼', desc: 'Team outings, meetings' },
            { occasion: 'School Trips', icon: '🎒', desc: 'Educational tours, picnics' },
            { occasion: 'Weddings', icon: '💒', desc: 'Guest transport, baraat' },
            { occasion: 'Airport Transfers', icon: '✈️', desc: 'Group pickups & drops' },
            { occasion: 'Sightseeing', icon: '📸', desc: 'City tours, monuments' },
            { occasion: 'Outstation Tours', icon: '🗺️', desc: 'Multi-city trips' },
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
  );

  return (
    <>
      {/* Hero with Chat Booking System */}
      <ServiceHeroWithChat
        badge="Tempo Traveller Rental"
        title="Tempo Traveller"
        titleHighlight="Starting @₹18/Km"
        description="12, 17, 20 Seater AC Tempo Travellers for family trips, pilgrimages, corporate events. Professional drivers included!"
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
          { icon: 'star', text: 'Group Travel', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="tempo-traveller"
        title="Our Tempo Traveller Fleet"
        showCategories={true}
        limit={12}
        priceUnit="/km"
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="tempo-traveller"
        title="Tempo Traveller in Popular Cities"
        startingPrice="₹18"
        priceUnit="/km"
      />

      {occasionsSection}
    </>
  );
}
