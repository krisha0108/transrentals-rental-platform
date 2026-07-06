import { Metadata } from 'next';
import {
  Shield,
  Star,
  CheckCircle,
  Phone,
  MessageSquare,
  IndianRupee,
  Users,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { ServiceLocationsGrid } from '@/components/services/ServiceLocationsGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Bus Rental in India | Tempo Traveller Hire | Starting ₹18/km | TransRentals',
  description:
    'Hire buses and tempo travellers across 50+ Indian cities. 12-seater to 50-seater AC/Non-AC buses for pilgrimages, weddings, corporate events, and tours. Compare quotes from 500+ verified operators.',
  keywords: [
    'bus rental',
    'bus rental in India',
    'tempo traveller hire',
    'bus on rent',
    'bus hire near me',
    'mini bus rental',
    'tempo traveller for rent',
    'bus rental per km',
    'pilgrimage bus rental',
    'wedding bus hire',
    'corporate bus rental',
    '12 seater tempo traveller',
    '17 seater tempo traveller',
    '20 seater bus rental',
    '40 seater bus hire',
    'volvo bus hire',
  ],
  alternates: {
    canonical: 'https://transrentals.in/bus-rental',
  },
  openGraph: {
    title: 'Bus Rental in India | Tempo Traveller Hire | Starting ₹18/km | TransRentals',
    description: 'Hire buses and tempo travellers across 50+ Indian cities. 12-seater to 50-seater AC/Non-AC buses for pilgrimages, weddings, and corporate events. 500+ verified operators.',
    type: 'website',
    url: 'https://transrentals.in/bus-rental',
    images: [{ url: 'https://transrentals.in/api/og?service=bus-rental', width: 1200, height: 630, alt: 'Bus Rental in India - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bus Rental in India | Tempo Traveller Hire | Starting ₹18/km | TransRentals',
    description: 'Hire buses and tempo travellers across 50+ Indian cities. IBA-approved, verified operators.',
    images: ['https://transrentals.in/api/og?service=bus-rental'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

const VEHICLE_TYPES = [
  {
    name: 'Tempo Traveller 12-Seater',
    capacity: '12 Passengers',
    price: 'Starting ₹18/km',
    features: ['AC', 'Push-back Seats', 'Music System'],
    bestFor: 'Family Tours, Small Groups',
    icon: '🚐',
  },
  {
    name: 'Tempo Traveller 17-Seater',
    capacity: '17 Passengers',
    price: 'Starting ₹20/km',
    features: ['AC', 'Push-back Seats', 'Luggage Boot'],
    bestFor: 'Corporate Outings, Pilgrimages',
    icon: '🚐',
  },
  {
    name: 'Mini Bus 20–25 Seater',
    capacity: '20–25 Passengers',
    price: 'Starting ₹22/km',
    features: ['AC/Non-AC', 'Reclining Seats', 'Music System'],
    bestFor: 'Corporate Events, School Trips',
    icon: '🚌',
  },
  {
    name: 'Standard Bus 35–40 Seater',
    capacity: '35–40 Passengers',
    price: 'Starting ₹25/km',
    features: ['AC/Non-AC', 'Overhead Luggage', 'PA System'],
    bestFor: 'Large Groups, Wedding Baraat',
    icon: '🚌',
  },
  {
    name: 'Large Bus 45–50 Seater',
    capacity: '45–50 Passengers',
    price: 'Starting ₹28/km',
    features: ['AC', 'Sleeper Option', 'Entertainment System'],
    bestFor: 'Pilgrimages, Tour Groups',
    icon: '🚌',
  },
  {
    name: 'Volvo / Luxury Coach',
    capacity: '40–45 Passengers',
    price: 'Starting ₹40/km',
    features: ['AC', 'Reclining Seats', 'Wi-Fi, USB Charging'],
    bestFor: 'Premium Corporate, Long-Distance',
    icon: '🚍',
  },
];

const TRIP_TYPES = [
  { name: 'Pilgrimage Tours', icon: '🛕', desc: 'Char Dham, Vaishno Devi, Tirupati, Shirdi' },
  { name: 'Wedding Transport', icon: '💒', desc: 'Baraat Bus, Guest Shuttles, Decorated Buses' },
  { name: 'Corporate Events', icon: '🏢', desc: 'Team Outings, Off-Sites, Conferences' },
  { name: 'Schools & Colleges', icon: '🎓', desc: 'Picnics, Educational Tours, Sports Meets' },
  { name: 'Tour Packages', icon: '🗺️', desc: 'Multi-City Circuits, Sightseeing Tours' },
  { name: 'Airport Shuttle', icon: '✈️', desc: 'Group Airport Transfers, Bulk Hotel Pickups' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select Your City',
    description: 'Choose your departure city to see available buses and operators near you',
    icon: MapPin,
  },
  {
    step: 2,
    title: 'Choose Vehicle & Date',
    description: 'Select bus size, AC/non-AC preference, and travel dates',
    icon: IndianRupee,
  },
  {
    step: 3,
    title: 'Compare Quotes',
    description: 'Compare prices, inclusions, and vendor ratings to select the best option',
    icon: Star,
  },
  {
    step: 4,
    title: 'Book & Travel',
    description: 'Confirm with advance payment and travel with a verified professional driver',
    icon: CheckCircle,
  },
];

const STATS = [
  { value: '5,000+', label: 'Trips Completed' },
  { value: '500+', label: 'Verified Operators' },
  { value: '4.7★', label: 'Average Rating' },
  { value: '50+', label: 'Cities Served' },
];

const POPULAR_ROUTES = [
  { from: 'Delhi', to: 'Haridwar', distance: '220 km', tripType: 'Pilgrimage' },
  { from: 'Mumbai', to: 'Shirdi', distance: '240 km', tripType: 'Pilgrimage' },
  { from: 'Bangalore', to: 'Tirupati', distance: '250 km', tripType: 'Pilgrimage' },
  { from: 'Chandigarh', to: 'Manali', distance: '310 km', tripType: 'Tour' },
  { from: 'Lucknow', to: 'Ayodhya', distance: '130 km', tripType: 'Pilgrimage' },
  { from: 'Chennai', to: 'Pondicherry', distance: '160 km', tripType: 'Corporate Outing' },
];

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Nagpur', slug: 'nagpur' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    trip: 'Char Dham Yatra — Delhi',
    rating: 5,
    text: 'Excellent service! The tempo traveller was in great condition and the driver knew all the routes perfectly. Highly recommended for pilgrimages.',
  },
  {
    name: 'Priya Kapoor',
    trip: 'Wedding Transport — Mumbai',
    rating: 5,
    text: 'Booked 3 buses for wedding guests. All arrived on time with decorated vehicles. The coordination was perfect from booking to drop-off.',
  },
  {
    name: 'TechCorp HR Team',
    trip: 'Annual Team Outing — Pune',
    rating: 5,
    text: 'Used TransRentals for our annual team outing to Mahabaleshwar. Got multiple quotes, chose the best one. Very professional service throughout.',
  },
];

const FAQS = [
  {
    q: 'What is the cost of bus rental per km in India?',
    a: 'Bus rental rates in India depend on vehicle type and trip duration. Tempo Travellers start from ₹18/km and larger luxury coaches are priced higher. Day packages (8–10 hrs/100 km) are often more economical for local trips. Get a free quote on TransRentals to compare rates from verified operators.',
  },
  {
    q: 'How many people can travel in a Tempo Traveller?',
    a: 'A standard Tempo Traveller seats 9, 12, 14, or 17 passengers depending on the model. The 12-seater and 17-seater are the most popular for pilgrimages and corporate outings. All configurations include luggage space and push-back seats.',
  },
  {
    q: 'Is AC available in bus rentals?',
    a: 'Yes, AC buses and Tempo Travellers are available across all categories. AC vehicles are strongly recommended for outstation trips in summer months (March–June) in India. Non-AC options are available at 15–20% lower rates for shorter or cooler-season trips.',
  },
  {
    q: 'What documents are required to hire a bus in India?',
    a: 'All TransRentals operators have valid contract carriage permits, vehicle fitness certificates, and comprehensive insurance. As a customer, you just need your ID proof for booking. No additional documentation is required from your side.',
  },
  {
    q: 'Can I book a bus for a one-way trip?',
    a: 'Yes, one-way bus rentals are available. One-way rates are typically 10–15% higher than round-trip per-km rates as the driver has to return empty. Popular one-ways: Delhi to Jaipur, Mumbai to Pune, Bangalore to Mysore, Lucknow to Ayodhya.',
  },
  {
    q: 'How far in advance should I book a bus rental?',
    a: 'For regular trips, 48–72 hours notice is sufficient. During peak seasons — Navratri, Dussehra, Diwali, Eid, wedding season (Nov–Feb), and long weekends — book at least 1–2 weeks in advance. For Char Dham and Vaishno Devi pilgrimages, book 3–4 weeks ahead.',
  },
  {
    q: 'Are bus rentals available for outstation pilgrimage trips like Char Dham?',
    a: 'Yes, TransRentals specializes in pilgrimage bus rentals. Char Dham (Uttarakhand), Vaishno Devi (Jammu), Tirupati (Andhra Pradesh), Shirdi (Maharashtra), and Rishikesh-Haridwar are the most popular routes. Multi-day packages with hotel coordination are available.',
  },
  {
    q: 'What is the difference between a tempo traveller and a mini bus?',
    a: 'A Tempo Traveller (Force Traveller or similar) seats 9–17 passengers, has push-back seats and an AC option, and is ideal for short to medium trips (50–400 km). A Mini Bus (20–25 seater) is a larger vehicle suitable for bigger groups. For 6–16 passengers, a Tempo Traveller is the most popular and cost-effective choice.',
  },
];

export default function BusRentalPage() {
  return (
    <div className="min-h-screen">
      <HowToSchema
        name="How to Book a Bus Rental on TransRentals"
        description="Book a bus or tempo traveller in 4 simple steps across 50+ Indian cities."
        totalTime="PT15M"
        steps={[
          { name: 'Select Route & Date', text: 'Enter your starting city, destination, and travel date. Choose from routes across 50+ Indian cities.' },
          { name: 'Choose Bus Type & Capacity', text: 'Select the right bus — 12-seater Tempo Traveller, 17-seater, 20-seater, 32-seater, or 50-seater Volvo. AC and non-AC options available.' },
          { name: 'Compare Operator Quotes', text: 'Review quotes from 500+ verified bus operators. Check inclusions — driver, fuel, toll, and GST charges.' },
          { name: 'Confirm Booking & Travel', text: 'Pay advance to confirm booking. Driver arrives at your pickup point on the travel date.' },
        ]}
      />
      {/* Enhanced FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />

      {/* BusService Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Bus Rental in India',
            description: 'Hire buses and tempo travellers across 50+ Indian cities. 12-seater to 50-seater AC/Non-AC buses for pilgrimages, weddings, and corporate events.',
            provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Bus Rental',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Bus Rental Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tempo Traveller Hire' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mini Bus Rental' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Luxury Coach Hire' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding Bus Rental' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Pilgrimage Bus Rental' } },
              ],
            },
          }),
        }}
      />
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Bus Rental', item: 'https://transrentals.in/bus-rental' },
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <ServiceHeroWithChat
        badge="Bus & Tempo Traveller Rental"
        title="Bus Rental Across"
        titleHighlight="50+ Indian Cities"
        description="Hire 12-seater Tempo Travellers to 50-seater buses for pilgrimages, weddings, corporate events and tours. Get quotes from 500+ verified operators."
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Operators', color: 'text-blue-600' },
          { icon: 'zap', text: 'Instant Quotes', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      {/* Stats Bar */}
      <section className="bg-orange-600 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-orange-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="bus-rental"
        title="Choose Your Bus or Tempo Traveller"
        showCategories={true}
        limit={12}
      />

      {/* Vehicle Type & Pricing Guide */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Bus Rental Rates — Which Vehicle to Choose?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From 12-seater Tempo Travellers to 50-seater luxury coaches — choose the right vehicle based on your group size and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VEHICLE_TYPES.map((vehicle) => (
              <div
                key={vehicle.name}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-orange-300 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{vehicle.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{vehicle.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{vehicle.capacity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-orange-600 mb-2">{vehicle.price}</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {vehicle.features.map((f) => (
                    <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Best for:</span> {vehicle.bestFor}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            * Rates vary by city, season, and operator. Actual quotes may differ. Includes driver — excludes fuel, toll, and driver allowance on outstation trips.
          </p>
        </div>
      </section>

      {/* Locations from Database */}
      <ServiceLocationsGrid
        serviceSlug="bus-rental"
        title="Bus Rental in Popular Cities"
      />

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Most Popular Bus Rental Routes
            </h2>
            <p className="text-gray-600">Top intercity group travel routes booked on TransRentals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_ROUTES.map((route) => (
              <div
                key={`${route.from}-${route.to}`}
                className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition"
              >
                <div className="text-2xl">🛣️</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {route.from} → {route.to}
                  </div>
                  <div className="text-sm text-gray-500">{route.distance} · {route.tripType}</div>
                </div>
                <Link
                  href={`/bus-rental/${route.from.toLowerCase()}`}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trip Types */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Bus Rental for Every Occasion
            </h2>
            <p className="text-gray-600">
              Whatever your group travel need, we have experienced operators ready to serve
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRIP_TYPES.map((type) => (
              <div
                key={type.name}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md transition flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
                  {type.name}
                </h3>
                <p className="text-xs text-gray-500 leading-snug">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How to Rent a Bus in India
            </h2>
            <p className="text-gray-600">Book your bus or tempo traveller in 4 simple steps</p>
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
                  <div className="text-sm font-bold text-orange-600 mb-1">Step {step.step}</div>
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
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Book Bus Rental with TransRentals?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl text-center p-6 shadow-sm">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparent Pricing</h3>
              <p className="text-sm text-gray-600">
                Fixed per-km rates with no hidden charges. Fuel, toll, and driver allowance clearly stated upfront.
              </p>
            </div>

            <div className="bg-white rounded-xl text-center p-6 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verified & Insured</h3>
              <p className="text-sm text-gray-600">
                All operators have valid contract carriage permits, vehicle fitness certificates, and comprehensive insurance.
              </p>
            </div>

            <div className="bg-white rounded-xl text-center p-6 shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">4.7★ Rated Service</h3>
              <p className="text-sm text-gray-600">
                Check ratings and verified reviews from real customers before booking your bus.
              </p>
            </div>

            <div className="bg-white rounded-xl text-center p-6 shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">24/7 Trip Support</h3>
              <p className="text-sm text-gray-600">
                Our support team is available round the clock during your trip for any assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
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
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Bus Rental FAQs
            </h2>
            <p className="text-gray-600">Everything you need to know before booking a bus or tempo traveller</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links — Top Cities */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Bus Rental by City
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/bus-rental/${city.slug}`}
                className="text-center py-3 px-2 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition text-sm font-medium text-gray-700 hover:text-orange-700"
              >
                {city.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Also available:</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/wedding-bus-rental" className="text-orange-600 hover:underline">Wedding Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/corporate-bus-rental" className="text-orange-600 hover:underline">Corporate Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/tempo-traveller" className="text-orange-600 hover:underline">Tempo Traveller Hire</Link>
              <span className="text-gray-300">|</span>
              <Link href="/local-bus-rental" className="text-orange-600 hover:underline">Local Bus Rental</Link>
              <span className="text-gray-300">|</span>
              <Link href="/transporter" className="text-orange-600 hover:underline">Truck Rental</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
