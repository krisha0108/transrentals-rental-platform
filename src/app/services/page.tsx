'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search, ArrowRight, ChevronDown, MapPin, Map, Headphones,
  Bike, Car, CarTaxiFront, Bus, Truck, Construction, BadgeCheck, Tag, ShieldCheck, LayoutGrid,
  BadgeIndianRupee, Zap, CheckCircle2, Sparkles, SlidersHorizontal, FileCheck2,
} from 'lucide-react';
import { SERVICES } from '@/lib/constants/services';
import { FAQSchema } from '@/components/seo/schemas';

const HERO_STATS = [
  { icon: MapPin, value: '500+', label: 'Cities' },
  { icon: Map, value: '36', label: 'States' },
  { icon: Car, value: '1000+', label: 'Vehicles' },
  { icon: Headphones, value: '24/7', label: 'Support' },
];

const CATEGORY_ICONS: Record<string, typeof Car> = {
  'Car Rentals': Car,
  'Bike & Scooter Rentals': Bike,
  'Taxi & Cab Services': CarTaxiFront,
  'Bus & Group Travel': Bus,
  'Truck & Logistics': Truck,
  'Equipment Rental': Construction,
};

const CATEGORY_DEFAULT_IMAGE: Record<string, string> = {
  'Car Rentals': '/images/services/car-rental.png',
  'Bike & Scooter Rentals': '/images/services/bike-on-rent.png',
  'Taxi & Cab Services': '/images/services/local-taxi.png',
  'Bus & Group Travel': '/images/services/bus-rental.png',
  'Truck & Logistics': '/images/services/mini-truck-rental.png',
  'Equipment Rental': '/images/services/equipment-rental.png',
};

function ServiceCardImage({ slug, categoryName }: { slug: string; categoryName: string }) {
  const fallback = CATEGORY_DEFAULT_IMAGE[categoryName] ?? '/images/services/car-rental.png';
  const [src, setSrc] = useState(`/images/services/${slug}.png`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setSrc(fallback)}
      className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
}

const TRUST_STRIP = [
  { icon: BadgeCheck, label: 'Verified Partners' },
  { icon: Tag, label: 'Transparent Pricing' },
  { icon: Headphones, label: '24/7 Support' },
  { icon: ShieldCheck, label: 'Secure Booking' },
];

const SEARCH_CARD_BADGES = [
  { icon: BadgeIndianRupee, label: 'Best Prices', desc: 'Guaranteed' },
  { icon: Car, label: 'Wide Range', desc: 'Of Vehicles' },
  { icon: Zap, label: 'Easy Booking', desc: 'Quick & Simple' },
  { icon: ShieldCheck, label: 'Trusted', desc: 'Verified Partners' },
];

const SERVICES_FAQS = [
  {
    q: 'What types of vehicles can I rent on TransRentals?',
    a: 'TransRentals lists bikes and scooters, self-drive and chauffeur-driven cars, luxury cars, tempo travellers and buses for group travel, mini trucks and trucks for logistics, and construction equipment like JCBs and cranes — all from verified local vendors across India.',
  },
  {
    q: 'How do I book a vehicle on TransRentals?',
    a: 'Pick a service category, choose your city and dates, and either book instantly or request a quote from verified vendors. You will get pricing and vehicle options to compare before confirming your booking.',
  },
  {
    q: 'Is TransRentals available in my city?',
    a: 'TransRentals connects renters with vendors across 500+ cities and all 36 states/UTs in India. Use the search bar above or check the Locations page to see availability in your city.',
  },
  {
    q: 'Are the vendors on TransRentals verified?',
    a: 'Yes. Every vendor goes through a document and background verification process before their listings go live, so you can book with confidence.',
  },
  {
    q: 'Can I rent a vehicle for both local use and outstation trips?',
    a: 'Yes — most categories support both local (hourly/daily) rentals and outstation one-way or round trips. Availability depends on the specific vendor and vehicle you choose.',
  },
  {
    q: 'What if I need a service that is not listed?',
    a: 'Use the "Contact Us" option at the bottom of this page — our team can help source custom vehicle rental or equipment solutions that aren\'t part of the standard categories.',
  },
  {
    q: 'What is the difference between self-drive and chauffeur-driven rentals?',
    a: 'Self-drive means you drive the vehicle yourself — usually cheaper and flexible for road trips. Chauffeur-driven means a professional driver comes with the vehicle — better for airport transfers, business travel, and trips where you would rather not drive. Both options are available for cars across most cities.',
  },
  {
    q: 'Can businesses book vehicles for corporate travel or events?',
    a: 'Yes. Corporate travel desks, event planners, and wedding planners regularly book cars, tempo travellers, and buses through TransRentals for employee transport, guest pickups, and group events. Request a custom quote for bulk or recurring bookings.',
  },
  {
    q: 'How far in advance should I book a vehicle?',
    a: 'For local city rentals, same-day or next-day booking usually works. For outstation trips, buses, tempo travellers, and construction equipment, booking a few days in advance gives you more vendor and pricing options, especially during peak season.',
  },
  {
    q: 'Is a security deposit required when renting a vehicle?',
    a: 'It depends on the vendor and vehicle type. Self-drive bikes and cars commonly require a refundable security deposit; chauffeur-driven and outstation bookings often do not. The exact terms are shown by the vendor before you confirm.',
  },
];

const WHY_TRANSRENTALS = [
  { icon: BadgeCheck, text: 'Every vendor is document-verified before going live' },
  { icon: Tag, text: 'Transparent, upfront pricing — no surprises at pickup' },
  { icon: Headphones, text: 'Support on hand if anything goes wrong during your rental' },
  { icon: LayoutGrid, text: 'One platform for every vehicle type, from bikes to bulldozers' },
];

const HOW_IT_WORKS = [
  { icon: Search, title: 'Search', desc: 'Pick a category, enter your city and dates, and browse verified vendor listings.' },
  { icon: SlidersHorizontal, title: 'Compare & Quote', desc: 'Book instantly or request a custom quote and compare pricing across vendors.' },
  { icon: FileCheck2, title: 'Confirm & Go', desc: 'Confirm your booking online and get vehicle and vendor details before pickup.' },
];

const CATEGORY_HIGHLIGHTS = [
  {
    icon: Bike, name: 'Bike & Scooter Rentals', href: '/bike-on-rent',
    desc: 'Ideal for daily commuting, weekend rides, and short local trips. Hourly and daily rental options are available in most cities, with no need to own a vehicle.',
  },
  {
    icon: Car, name: 'Car Rentals', href: '/car-rental',
    desc: 'Self-drive hatchbacks, sedans, and SUVs for road trips, plus chauffeur-driven and luxury cars for business travel, airport pickups, and special occasions.',
  },
  {
    icon: CarTaxiFront, name: 'Taxi & Cab Services', href: '/local-taxi',
    desc: 'Local point-to-point rides, outstation one-way and round trips, airport transfers, and hourly cab packages with a professional driver.',
  },
  {
    icon: Bus, name: 'Bus & Group Travel', href: '/bus-rental',
    desc: 'Tempo travellers and buses for corporate outings, weddings, pilgrimages, and school or college trips — seating from 12 up to full-size coaches.',
  },
  {
    icon: Truck, name: 'Truck & Logistics', href: '/transporter',
    desc: 'Mini trucks and trucks for house shifting, goods transport, and packers & movers — suited for both local moves and inter-city logistics.',
  },
  {
    icon: Construction, name: 'Equipment Rental', href: '/equipment-rental',
    desc: 'JCBs, cranes, generators, and other construction equipment for project sites, available on daily, weekly, or monthly rental terms.',
  },
];

const USE_CASES = [
  'Corporate travel desks booking employee transport',
  'Wedding & event planners arranging a fleet of cars or buses',
  'Families planning outstation road trips',
  'Contractors renting construction equipment for project sites',
  'Businesses and households booking packers & movers for relocation',
  'Tourists exploring India on a self-drive car or bike',
];


//'wedding-car-rental', 'corporate-car-rental', 'monthly-car-rental',
       //'vintage-car-rental', 'sports-car-rental', 'outstation-car-rental'
//bike rental ka array, 'activa-on-rent', 'royal-enfield-on-rent' 
//'wedding-bus-rental', 'corporate-bus-rental'

// Group services by category
const serviceCategories = [
  {
    name: 'Car Rentals',
    description: 'Find the perfect car for every journey',
    services: SERVICES.filter(s =>
      ['car-rental', 'self-drive-car-rentals', 'one-way-car-rental', 'luxury-car-rental',
       ].includes(s.slug)
    ),
  },
  {
    name: 'Bike & Scooter Rentals',
    description: 'Two-wheelers for easy city travel',
    services: SERVICES.filter(s =>
      ['bike-on-rent'].includes(s.slug)
    ),
  },
  {
    name: 'Taxi & Cab Services',
    description: 'Reliable cab services across India',
    services: SERVICES.filter(s =>
      ['one-way-cab', 'round-trip', 'airport-transfer', 'outstation-cab', 'local-taxi', 'chauffeur-service'].includes(s.slug)
    ),
  },
  {
    name: 'Bus & Group Travel',
    description: 'Travel together with group transport',
    services: SERVICES.filter(s =>
      ['tempo-traveller', 'bus-rental', ].includes(s.slug)
    ),
  },
  {
    name: 'Truck & Logistics',
    description: 'Transport goods and cargo',
    services: SERVICES.filter(s =>
      ['truck-rental', 'mini-truck-rental', 'packers-and-movers'].includes(s.slug)
    ),
  },
  {
    name: 'Equipment Rental',
    description: 'Construction & industrial equipment',
    services: SERVICES.filter(s =>
      ['equipment-rental'].includes(s.slug)
    ),
  },
];

function getCategoryForService(slug: string): string {
  return serviceCategories.find((c) => c.services.some((s) => s.slug === slug))?.name ?? 'Car Rentals';
}

const BASE_URL = 'https://transrentals.in';

const servicesItemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Vehicle Rental Services — TransRentals',
  description: 'Complete range of vehicle rental and transportation services across India',
  url: `${BASE_URL}/services`,
  itemListElement: serviceCategories.flatMap((cat, catIndex) =>
    cat.services.map((s, i) => ({
      '@type': 'ListItem',
      position: catIndex * 10 + i + 1,
      name: s.name,
      url: `${BASE_URL}${s.base_url}`,
      description: s.description,
    }))
  ),
};

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredServices = searchQuery
    ? SERVICES.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const visibleCategories = selectedCategory === 'All'
    ? serviceCategories
    : serviceCategories.filter((c) => c.name === selectedCategory);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesItemListSchema) }}
      />
      <FAQSchema faqs={SERVICES_FAQS.map((f) => ({ question: f.q, answer: f.a }))} />
      <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] pb-16 md:pb-20">
        {/* bg illustration */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover"
            style={{ backgroundImage: "url('/images/sections/services-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent md:via-slate-950/40" />
        </div>

        <div className="relative container mx-auto px-4 max-w-6xl pt-14 md:pt-16 pb-8">
          <span className="inline-block text-[11px] font-bold tracking-wide text-emerald-300 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full mb-4">
            500+ CITIES &bull; 36 STATES
          </span>

          <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight max-w-2xl">
            One Platform.
            <br />
            Every Vehicle.
            <br />
            <span className="text-emerald-400">Every Journey.</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mb-8 max-w-md">
            From everyday rides to heavy equipment — rent anything, anywhere in India.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {HERO_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-emerald-400" strokeWidth={2} />
                </div>
                <div className="leading-tight">
                  <span className="block text-lg font-black text-white">{value}</span>
                  <span className="block text-[11px] text-white/50">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating search card */}
        <div className="relative container mx-auto px-4 max-w-6xl">
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-black/30 p-5 md:p-6 max-w-2xl">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-3">
              <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              What are you looking for?
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search services... e.g. Bike Rental, Packers & Movers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
              </div>
              <button
                onClick={() => document.getElementById('services-results')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-colors shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
                Explore Now
              </button>
            </div>

            {/* Mini trust badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 mt-4 pt-4 border-t border-gray-100">
              {SEARCH_CARD_BADGES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="leading-tight">
                    <span className="block text-xs font-bold text-gray-800">{label}</span>
                    <span className="block text-[10px] text-gray-400">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="services-results" />

      {/* Search Results */}
      {searchQuery && (
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {filteredServices.length} {filteredServices.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </h2>
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredServices.map((service) => (
                  <Link
                    key={service.id}
                    href={service.base_url}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                  >
                    <div className="relative h-28 bg-gray-100 overflow-hidden">
                      <ServiceCardImage slug={service.slug} categoryName={getCategoryForService(service.slug)} />
                      <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        {React.createElement(CATEGORY_ICONS[getCategoryForService(service.slug)] ?? Car, { className: 'w-3.5 h-3.5 text-emerald-600' })}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{service.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No services found matching your search.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!searchQuery && (
        <>
          {/* Category tabs */}
          <div className="relative z-20 container mx-auto px-4 max-w-6xl mt-8 md:mt-10 mb-10">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-2">
              <div className="flex flex-nowrap gap-1 sm:gap-2">
                {[{ name: 'All', description: '', services: SERVICES }, ...serviceCategories].map((category) => {
                  const Icon = category.name === 'All' ? LayoutGrid : (CATEGORY_ICONS[category.name] ?? Car);
                  const isActive = selectedCategory === category.name;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-200 border ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                      <span className="truncate">{category.name === 'All' ? 'All Services' : category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Categories */}
            <div className="space-y-12">
              {visibleCategories.map((category) => {
                const CategoryIcon = CATEGORY_ICONS[category.name] ?? Car;
                return (
                <div
                  key={category.name}
                  id={category.name.toLowerCase().replace(/\s+/g, '-')}
                  className="scroll-mt-24"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CategoryIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{category.name}</h2>
                        <p className="text-gray-400 text-sm">{category.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                      className="md:hidden flex items-center gap-1 text-emerald-600 font-semibold text-sm shrink-0"
                    >
                      {expandedCategory === category.name ? 'Show Less' : 'View all'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
                    expandedCategory !== category.name && 'max-md:[&>*:nth-child(n+5)]:hidden'
                  }`}>
                    {category.services.map((service) => (
                      <Link
                        key={service.id}
                        href={service.base_url}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                      >
                        <div className="relative h-28 bg-gray-100 overflow-hidden">
                          <ServiceCardImage slug={service.slug} categoryName={category.name} />
                          <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <CategoryIcon className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {service.description}
                          </p>
                          <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                            Book Now
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          </section>
        </>
      )}

      {/* SEO Content */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-emerald-50/60 to-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              WHY TRANSRENTALS
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Vehicle Rental in India, All in One Place</h2>
            <p className="text-gray-500">
              TransRentals connects you with verified local vendors across 500+ cities — compare, book, and go.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-14">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7 space-y-4 text-gray-600 leading-relaxed text-sm">
              <p>
                TransRentals is a vehicle rental marketplace connecting you with verified local vendors across 500+ cities
                in India. Whether you need a <Link href="/bike-on-rent" className="text-emerald-700 font-semibold hover:underline">bike on rent</Link> for
                daily commuting, a <Link href="/car-rental" className="text-emerald-700 font-semibold hover:underline">self-drive or chauffeur-driven car</Link> for
                a family trip, a <Link href="/bus-rental" className="text-emerald-700 font-semibold hover:underline">tempo traveller or bus</Link> for
                group travel, a <Link href="/transporter" className="text-emerald-700 font-semibold hover:underline">truck</Link> for
                moving goods, or <Link href="/equipment-rental" className="text-emerald-700 font-semibold hover:underline">construction equipment</Link> for
                a project site, you can compare options and book directly from one platform.
              </p>
              <p>
                Instead of calling around to individual operators, TransRentals lets you search by city, browse verified
                vendor listings, and either book instantly or request a custom quote — all with transparent pricing and
                no hidden surprises at pickup.
              </p>
            </div>

            <div className="bg-emerald-950 rounded-2xl p-6 md:p-7 text-white">
              <h3 className="font-bold text-lg mb-4">Why Rent Through TransRentals</h3>
              <ul className="space-y-3.5">
                {WHY_TRANSRENTALS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-white/80 leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Category highlights */}
          <h3 className="text-center font-bold text-gray-900 text-lg mb-6">Vehicle Rental Categories in India</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {CATEGORY_HIGHLIGHTS.map(({ icon: Icon, name, href, desc }) => (
              <Link
                key={name}
                href={href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-600 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 mb-1.5 group-hover:text-emerald-700 transition-colors">{name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>

          {/* How it works */}
          <h3 className="text-center font-bold text-gray-900 text-lg mb-10">How Booking Works</h3>
          <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-5">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-9 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />

            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-[72px] h-[72px] rounded-2xl rotate-45 bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-600/25" />
                    <Icon className="absolute inset-0 m-auto w-7 h-7 text-white" strokeWidth={2} />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 text-emerald-700 text-xs font-black flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1.5">{step.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Use cases */}
          <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7">
            <h3 className="font-bold text-gray-900 text-lg mb-4 text-center">Who Uses TransRentals</h3>
            <div className="flex flex-wrap justify-center gap-2.5">
              {USE_CASES.map((useCase) => (
                <span
                  key={useCase}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-full"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {useCase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-500">Common questions about renting vehicles on TransRentals</p>
          </div>
          <div className="space-y-3">
            {SERVICES_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`bg-gray-50 rounded-xl border transition-colors ${isOpen ? 'border-emerald-200' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                  >
                    <h3 className={`font-semibold text-sm md:text-base ${isOpen ? 'text-emerald-700' : 'text-gray-900'}`}>{faq.q}</h3>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-emerald-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-gray-600 text-sm leading-relaxed px-5 pb-4">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-14 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black mb-2">We&apos;ve Got Custom Solutions for You!</h2>
              <p className="text-white/60">Contact us for custom vehicle rental &amp; equipment solutions</p>
            </div>
            <Link
              href="/contact"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-colors shrink-0"
            >
              Contact Us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10">
            {TRUST_STRIP.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 justify-center md:justify-start">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
