import { Metadata } from 'next';
import { CustomBookingForm } from '@/components/booking/CustomBookingForm';

export const metadata: Metadata = {
  title: 'Custom Bulk Booking | Multi-Day Event Transport | TransRentals',
  description: 'Book multiple vehicles for multi-day events like weddings, corporate events, parties, and tours. Manage bikes, cars, buses, and trucks for your entire event.',
  keywords: [
    'bulk booking',
    'multi-day booking',
    'wedding car rental',
    'corporate event transport',
    'party vehicle booking',
    'event transportation',
    'group travel booking',
    'fleet booking',
  ],
  openGraph: {
    title: 'Custom Bulk Booking - Multi-Day Event Transport',
    description: 'Book multiple vehicles for weddings, corporate events, parties, and tours. One booking for all your transport needs.',
    url: 'https://transrentals.in/custom-booking',
  },
};

export default function CustomBookingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Bulk & Multi-Day Booking
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Custom Event
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Transportation
            </span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Plan your entire event transport in one booking. Perfect for weddings, corporate events,
            birthday parties, tours, and any multi-day occasion.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: '📅', text: 'Multi-Day Support' },
              { icon: '🚗', text: 'Multiple Vehicles' },
              { icon: '👥', text: 'Group Management' },
              { icon: '💰', text: 'Best Prices' },
            ].map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-gray-50 min-h-screen">
        <div className="container-custom">
          <CustomBookingForm />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose TransRentals for Events?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Single Point Contact',
                desc: 'One dedicated manager for your entire event',
              },
              {
                icon: '💎',
                title: 'Premium Fleet',
                desc: 'Well-maintained vehicles from bikes to luxury buses',
              },
              {
                icon: '🕐',
                title: 'On-Time Guarantee',
                desc: '99.5% punctuality record across 10,000+ events',
              },
              {
                icon: '📋',
                title: 'Detailed Planning',
                desc: 'Day-wise itinerary with backup vehicles',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">
            Perfect for Every Occasion
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From intimate gatherings to grand celebrations, we've got your transport covered
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Weddings',
                icon: '💒',
                desc: 'Baraat cars, guest shuttles, decoration vehicles, and more',
                features: ['Vintage cars', 'Decorated vehicles', 'VIP transport'],
              },
              {
                title: 'Corporate Events',
                icon: '🏢',
                desc: 'Conferences, team outings, client visits, and office parties',
                features: ['Executive sedans', 'Team buses', 'Airport transfers'],
              },
              {
                title: 'Tours & Trips',
                icon: '🗺️',
                desc: 'Family trips, friend groups, pilgrimage tours',
                features: ['Multi-day packages', 'Flexible itinerary', 'Local guides'],
              },
              {
                title: 'Birthday Parties',
                icon: '🎂',
                desc: 'Guest pickups, venue transfers, surprise arrivals',
                features: ['Luxury cars', 'Party buses', 'Vintage options'],
              },
              {
                title: 'Religious Events',
                icon: '🛕',
                desc: 'Temple visits, processions, community gatherings',
                features: ['Large buses', 'Tempo travellers', 'AC/Non-AC options'],
              },
              {
                title: 'Sports Events',
                icon: '⚽',
                desc: 'Team transport, stadium shuttles, tournament logistics',
                features: ['Team buses', 'Equipment trucks', 'Fast vehicles'],
              },
            ].map((event) => (
              <div
                key={event.title}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition"
              >
                <div className="text-4xl mb-4">{event.icon}</div>
                <h3 className="font-bold text-xl mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4">{event.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {event.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Need Help Planning Your Event Transport?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Our event specialists are available 24/7 to help you plan the perfect transport solution
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+919737965551"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition"
            >
              📞 Call Us Now
            </a>
            <a
              href="https://wa.me/919737965551"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
