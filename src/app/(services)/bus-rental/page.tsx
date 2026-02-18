import { Metadata } from 'next';
import {
  Shield,
  Star,
  CheckCircle,
  Phone,
  MessageSquare,
  IndianRupee,
} from 'lucide-react';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';

export const metadata: Metadata = {
  title: 'Bus & Tempo Traveller Rental | Get Quotes from Verified Operators',
  description:
    'Hire buses and tempo travellers for pilgrimages, weddings, corporate events, tours. Get multiple quotes from verified operators. 12-50 seater vehicles available.',
  keywords: [
    'bus rental',
    'tempo traveller',
    'bus hire',
    'pilgrimage bus',
    'wedding bus',
    'corporate bus',
    'mini bus rental',
    'volvo bus hire',
  ],
};

const TRIP_TYPES = [
  { name: 'Pilgrimage Tours', icon: '🛕', desc: 'Temple Visits, Char Dham, Vaishno Devi' },
  { name: 'Wedding Transport', icon: '💒', desc: 'Baraat, Guest Transport' },
  { name: 'Corporate Events', icon: '🏢', desc: 'Team Outings, Conferences, Retreats' },
  { name: 'Schools & Colleges', icon: '🎓', desc: 'Picnics, Educational Tours, Sports' },
  { name: 'Tour Packages', icon: '🗺️', desc: 'Multi-City Tours, Sightseeing' },
  { name: 'Outstation', icon: '🛣️', desc: 'One-Way and Round Trips' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select Location',
    description: 'Choose your city to find available buses and operators',
    icon: MessageSquare,
  },
  {
    step: 2,
    title: 'Browse Options',
    description: 'View available buses with prices and features',
    icon: IndianRupee,
  },
  {
    step: 3,
    title: 'Compare & Choose',
    description: 'Compare prices, inclusions, and vendor ratings to select the best option',
    icon: Star,
  },
  {
    step: 4,
    title: 'Book & Travel',
    description: 'Pay securely and enjoy your trip with professional service',
    icon: CheckCircle,
  },
];

const STATS = [
  { value: '5000+', label: 'Trips Completed' },
  { value: '500+', label: 'Verified Operators' },
  { value: '4.7', label: 'Average Rating' },
  { value: '50+', label: 'Cities Served' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    trip: 'Char Dham Yatra',
    rating: 5,
    text: 'Excellent service! The tempo traveller was in great condition and driver knew all the routes perfectly. Highly recommended for pilgrimages.',
  },
  {
    name: 'Priya Kapoor',
    trip: 'Wedding Transport',
    rating: 5,
    text: 'Booked 3 buses for wedding guests. All arrived on time with decorated vehicles. The coordination was perfect.',
  },
  {
    name: 'TechCorp HR Team',
    trip: 'Team Outing',
    rating: 5,
    text: 'Used their service for our annual team outing. Got multiple quotes and chose the best one. Very professional service.',
  },
];

export default function BusRentalPage() {
  return (
    <div className="min-h-screen">
      {/* Hero with Chat Booking System */}
      <ServiceHeroWithChat
        badge="Bus & Tempo Traveller Rental"
        title="Bus Rental"
        titleHighlight="For Every Occasion"
        description="Hire buses and tempo travellers for pilgrimages, weddings, corporate events. Get quotes from verified operators!"
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="bus-rental"
        title="Choose Your Vehicle"
        showCategories={true}
        limit={12}
      />

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="bus-rental"
        title="Bus Rental in Popular Cities"
        startingPrice="₹18"
        priceUnit="/km"
      />

      {/* Trip Types */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Every Occasion
            </h2>
            <p className="text-gray-600">
              Whatever your travel need, we have experienced operators ready to serve
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRIP_TYPES.map((type) => (
              <div
                key={type.name}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md transition flex flex-col items-center justify-center min-h-[150px]"
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base leading-tight">
                  {type.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600">
              Book your bus in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.step} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-orange-200" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-orange-600 mb-2">Step {step.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Book With Us?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-sm text-gray-600">
                Compare quotes from multiple operators to get the best deal
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verified Operators</h3>
              <p className="text-sm text-gray-600">
                All our operators are verified with valid permits and insurance
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Rated & Reviewed</h3>
              <p className="text-sm text-gray-600">
                Check ratings and reviews from real customers before booking
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">
                Our support team is available round the clock during your trip
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-orange-600">{testimonial.trip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'How do I book a bus?',
                a: 'Simply select your city from the locations section, browse available buses, and book directly. Our team will confirm your booking.',
              },
              {
                q: 'What\'s included in the price?',
                a: 'Prices typically include vehicle, driver, and basic inclusions. Fuel, tolls, and driver allowance may be extra depending on the package.',
              },
              {
                q: 'How do I make payment?',
                a: 'You can pay online through our secure payment gateway. Advance payment is required to confirm the booking.',
              },
              {
                q: 'What if I need to cancel?',
                a: 'Cancellation policies vary by operator. Many offer free cancellation up to 48-72 hours before the trip.',
              },
              {
                q: 'Are the buses insured?',
                a: 'Yes, all vehicles from our verified operators have valid insurance and permits.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
