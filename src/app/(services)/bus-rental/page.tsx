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
  Sparkles,
  Bus,
  ArrowRight,
  Calendar,
  ShieldCheck,
  Quote,
  Plus,
  HelpCircle,
  Heart,
  Building2,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { BusRentalHubHero } from '@/components/bus-rental/BusRentalHubHero';
import { BusRentalFleetDisplay } from '@/components/bus-rental/BusRentalFleetDisplay';
import { BusRentalPopularCitiesGrid } from '@/components/bus-rental/BusRentalPopularCitiesGrid';
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
    gradient: 'from-purple-500 to-blue-500',
  },
  {
    name: 'Tempo Traveller 17-Seater',
    capacity: '17 Passengers',
    price: 'Starting ₹20/km',
    features: ['AC', 'Push-back Seats', 'Luggage Boot'],
    bestFor: 'Corporate Outings, Pilgrimages',
    icon: '🚐',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Mini Bus 20–25 Seater',
    capacity: '20–25 Passengers',
    price: 'Starting ₹22/km',
    features: ['AC/Non-AC', 'Reclining Seats', 'Music System'],
    bestFor: 'Corporate Events, School Trips',
    icon: '🚌',
    gradient: 'from-teal-500 to-emerald-500',
    popular: true,
  },
  {
    name: 'Standard Bus 35–40 Seater',
    capacity: '35–40 Passengers',
    price: 'Starting ₹25/km',
    features: ['AC/Non-AC', 'Overhead Luggage', 'PA System'],
    bestFor: 'Large Groups, Wedding Baraat',
    icon: '🚌',
    gradient: 'from-emerald-600 to-green-600',
  },
  {
    name: 'Large Bus 45–50 Seater',
    capacity: '45–50 Passengers',
    price: 'Starting ₹28/km',
    features: ['AC', 'Sleeper Option', 'Entertainment System'],
    bestFor: 'Pilgrimages, Tour Groups',
    icon: '🚌',
    gradient: 'from-amber-600 to-orange-600',
  },
  {
    name: 'Volvo / Luxury Coach',
    capacity: '40–45 Passengers',
    price: 'Starting ₹40/km',
    features: ['AC', 'Reclining Seats', 'Wi-Fi, USB Charging'],
    bestFor: 'Premium Corporate, Long-Distance',
    icon: '🚍',
    gradient: 'from-indigo-600 to-purple-600',
  },
];

const TRIP_TYPES = [
  { name: 'Pilgrimage Tours', icon: '🛕', desc: 'Char Dham, Vaishno Devi, Tirupati, Shirdi', gradient: 'from-amber-500 to-yellow-500' },
  { name: 'Wedding Transport', icon: '💒', desc: 'Baraat Bus, Guest Shuttles, Decorated Buses', gradient: 'from-pink-500 to-rose-500' },
  { name: 'Corporate Events', icon: '🏢', desc: 'Team Outings, Off-Sites, Conferences', gradient: 'from-slate-600 to-gray-700' },
  { name: 'Schools & Colleges', icon: '🎓', desc: 'Picnics, Educational Tours, Sports Meets', gradient: 'from-blue-500 to-indigo-500' },
  { name: 'Tour Packages', icon: '🗺️', desc: 'Multi-City Circuits, Sightseeing Tours', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Airport Shuttle', icon: '✈️', desc: 'Group Airport Transfers, Bulk Hotel Pickups', gradient: 'from-cyan-500 to-sky-500' },
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

const WHY_CHOOSE_US = [
  {
    title: 'Transparent Pricing',
    description: 'Fixed per-km rates with no hidden charges. Fuel, toll, and driver allowance clearly stated upfront.',
    icon: IndianRupee,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Verified & Insured',
    description: 'All operators have valid contract carriage permits, vehicle fitness certificates, and comprehensive insurance.',
    icon: Shield,
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    title: '4.7★ Rated Service',
    description: 'Check ratings and verified reviews from real customers before booking your bus.',
    icon: Star,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    title: '24/7 Trip Support',
    description: 'Our support team is available round the clock during your trip for any assistance.',
    icon: Phone,
    gradient: 'from-purple-500 to-violet-500',
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

const ROUTE_TYPE_STYLES: Record<string, string> = {
  Pilgrimage: 'from-rose-500 to-red-500',
  Tour: 'from-violet-500 to-fuchsia-500',
  'Corporate Outing': 'from-sky-500 to-cyan-600',
};

const ROUTE_TYPE_HEX: Record<string, string> = {
  Pilgrimage: '#f43f5e',
  Tour: '#a855f7',
  'Corporate Outing': '#0ea5e9',
};

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
      <BusRentalHubHero />

      {/* Stats Bar */}
      <section className="bg-emerald-700 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-emerald-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Display from Database */}
      <BusRentalFleetDisplay
        serviceSlug="bus-rental"
        title="Choose Your Bus or Tempo Traveller"
        showCategories={true}
        limit={12}
      />

      {/* Vehicle Type & Pricing Guide */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              Pricing Guide
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Bus Rental Rates — Which Vehicle to Choose?
            </h2>
            <p className="text-gray-500">
              From 12-seater Tempo Travellers to 50-seater luxury coaches — choose the right vehicle based on your group size and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VEHICLE_TYPES.map((vehicle) => (
              <div
                key={vehicle.name}
                className="group relative rounded-2xl p-6 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${vehicle.gradient} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity`} />

                {vehicle.popular && (
                  <div className="absolute top-5 right-5 flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-full">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Popular
                  </div>
                )}

                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${vehicle.gradient} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                    {vehicle.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{vehicle.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <Users className="w-3.5 h-3.5" />
                    <span>{vehicle.capacity}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {vehicle.features.map((f) => (
                      <span key={f} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full border border-gray-100">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">{vehicle.price}</span>
                    <span className="text-xs text-gray-400 text-right">
                      <span className="font-semibold text-gray-500">Best for:</span> {vehicle.bestFor}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            * Rates vary by city, season, and operator. Actual quotes may differ. Includes driver — excludes fuel, toll, and driver allowance on outstation trips.
          </p>
        </div>
      </section>

      {/* Locations from Database */}
      <BusRentalPopularCitiesGrid
        serviceSlug="bus-rental"
        title="Bus Rental in Popular Cities"
      />

      {/* Popular Routes */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Popular Routes
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Most Popular Bus Rental Routes
            </h2>
            <p className="text-gray-500">Top intercity group travel routes booked on TransRentals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map((route) => {
              const gradient = ROUTE_TYPE_STYLES[route.tripType] || 'from-emerald-500 to-teal-500';
              const hex = ROUTE_TYPE_HEX[route.tripType] || '#10b981';
              return (
                <div
                  key={`${route.from}-${route.to}`}
                  className="group relative rounded-xl p-4 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.07] group-hover:opacity-[0.13] transition-opacity`} />

                  <div className="relative">
                    <span className={`inline-block text-[10px] font-bold text-white bg-gradient-to-r ${gradient} px-2.5 py-0.5 rounded-full mb-3 shadow-sm`}>
                      {route.tripType}
                    </span>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-gray-900 truncate">{route.from}</span>
                      <span className="text-sm font-extrabold text-gray-900 truncate text-right">{route.to}</span>
                    </div>

                    {/* Travel route illustration */}
                    <div className="relative h-8 mb-3">
                      <svg viewBox="0 0 280 32" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" fill="none">
                        <path
                          d="M8 25 Q 80 4, 140 16 T 272 9"
                          stroke={hex}
                          strokeOpacity="0.45"
                          strokeWidth="2"
                          strokeDasharray="1 7"
                          strokeLinecap="round"
                        />
                        <circle cx="8" cy="25" r="3.5" fill={hex} />
                        <circle cx="272" cy="9" r="3.5" fill={hex} />
                      </svg>
                      <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ring-4 ring-white group-hover:scale-110 transition-transform`}>
                        <Bus className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs font-semibold text-gray-500">{route.distance}</span>
                      <Link
                        href={`/bus-rental/${route.from.toLowerCase()}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-emerald-600 group-hover:gap-1.5 transition-all"
                      >
                        View Route
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trip Types */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <Calendar className="w-4 h-4" />
              Every Occasion
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Bus Rental for Every Occasion
            </h2>
            <p className="text-gray-500">
              Whatever your group travel need, we have experienced operators ready to serve
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRIP_TYPES.map((type) => (
              <div
                key={type.name}
                className="group relative rounded-2xl p-4 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-[0.07] group-hover:opacity-[0.13] transition-opacity`} />
                <div className="relative flex flex-col items-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.gradient} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                    {type.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">
                    {type.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-snug">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" />
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              How to Rent a Bus in India
            </h2>
            <p className="text-gray-500">Book your bus or tempo traveller in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.step} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-7 left-1/2 w-full border-t-2 border-dashed border-emerald-200"
                  />
                )}
                <div className="group relative z-10 text-center">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <span
                      className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"
                      style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                    />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="w-6 h-6 text-white" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center">
                        {step.step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <ShieldCheck className="w-4 h-4" />
              Why TransRentals
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Why Book Bus Rental with TransRentals?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE_US.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl p-6 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-[0.07] group-hover:opacity-[0.13] transition-opacity`} />
                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 fill-emerald-700" />
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Quote className="w-8 h-8 text-emerald-100 mb-2" fill="currentColor" />
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">{testimonial.trip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full mb-4">
              <HelpCircle className="w-4 h-4" />
              FAQs
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Bus Rental FAQs
            </h2>
            <p className="text-gray-500">Everything you need to know before booking a bus or tempo traveller</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm open:shadow-md open:border-emerald-200 transition-shadow"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900">{faq.q}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-open:bg-emerald-600 transition-colors">
                    <Plus className="w-4 h-4 text-emerald-600 group-open:text-white group-open:rotate-45 transition-transform" />
                  </span>
                </summary>
                <p className="text-gray-600 text-sm leading-relaxed px-5 pb-5 -mt-1">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        {/* Subtle grid-line pattern background */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Bus Rental by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/bus-rental/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/wedding-bus-rental', label: 'Wedding Bus Rental', icon: Heart },
              { href: '/corporate-bus-rental', label: 'Corporate Bus Rental', icon: Building2 },
              { href: '/tempo-traveller', label: 'Tempo Traveller Hire', icon: Bus },
              { href: '/local-bus-rental', label: 'Local Bus Rental', icon: MapPin },
              { href: '/transporter', label: 'Truck Rental', icon: Truck },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
