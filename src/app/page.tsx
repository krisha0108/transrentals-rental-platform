'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Key, Car, Gem, Bus, Truck, Package, Wrench, Compass, Home, Building2,
  Star, ShieldCheck, Users, MapPin, TrendingUp, ArrowRight, ArrowLeft, Check, X,
  Search, Handshake, ScaleIcon, BadgeCheck, Sparkles, Zap, Plus,
  Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, ChevronDown,
  FileText, Tag, ArrowLeftRight, CheckCircle2, Plane, BusFront,
  Bed, Utensils, Sofa, Armchair, Refrigerator, Tv2, DoorClosed, WashingMachine, Weight, Warehouse,
  IndianRupee, Headphones, Phone, Loader2,
} from 'lucide-react';
import { Testimonials } from '@/components/home/Testimonials';
import { StoriesStrip } from '@/components/home/StoriesStrip';
import { BackrTokenSection } from '@/components/home/BackrTokenSection';
import { AppDownloadSection } from '@/components/home/AppDownloadSection';
import { useLocations, type Location } from '@/components/booking/useLocations';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { Fraunces } from 'next/font/google';

// Same premium serif used on /wander — loaded here and scoped to the
// homepage only (via the --font-heading override on the page's outer div
// below), so every existing `font-heading` class on this page picks it up
// without touching each of their classNames individually.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display-home',
  display: 'swap',
});

// Shape returned by the real /api/airports endpoint (src/app/api/airports/route.ts)
// — same data the real CarRentalBookingHero's Airport tab searches.
type AirportOption = {
  id: number | string;
  name: string;
  code: string;
  slug?: string;
  displayName: string;
  city: string | null;
  citySlug: string | null;
};
import { CarRentalBookingHero, type VehicleCategory as CarVehicleCategory, type PricingResult as CarPricingResult, type BookingDraft as CarBookingDraft } from '@/components/car-rental/CarRentalBookingHero';
import { PackersMoversServiceHero } from '@/components/services/PackersMoversServiceHero';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';

// ─────────────────────────────────────────────────────────────────────────
// Real service categories + real, working routes (src/lib/constants/services.ts
// and the top-level (services) route folders) — every "Get Quotes" link below
// goes to the actual live booking/quote flow for that category, not a stub.
// ─────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'bike', name: 'Bike Rental', href: '/bike-on-rent', icon: Bike,
    tagline: 'Two-wheelers for every trip',
    description: 'From daily commutes to Himalayan road trips — scooters and motorcycles from vendors near you.',
    color: '#F97316', bg: 'bg-orange-50', ring: 'ring-orange-200',
    image: '/images/og/bike-rental.jpg', locationAware: true, fleetSegment: 'bikes', formType: 'datetime',
    heroTitle: null, heroDescription: null,
  },
  {
    key: 'self-drive', name: 'Self-Drive Cars', href: '/self-drive-car-rentals', icon: Key,
    tagline: 'Drive yourself, no driver needed',
    description: 'Hatchbacks, sedans and SUVs you drive yourself — pick up and go on your own schedule.',
    color: '#3B82F6', bg: 'bg-blue-50', ring: 'ring-blue-200',
    image: '/images/fleet/maruti-swift.jpg', locationAware: true, fleetSegment: 'cars', formType: 'datetime',
    heroTitle: null, heroDescription: null,
  },
  {
    key: 'chauffeur', name: 'Car with Driver', href: '/chauffeur-service', icon: Car,
    tagline: 'Professional drivers on hire',
    description: 'Sit back and relax with a verified, professional chauffeur for local or outstation trips.',
    color: '#8B5CF6', bg: 'bg-violet-50', ring: 'ring-violet-200',
    image: '/images/fleet/toyota-innova-crysta.jpg', locationAware: true, fleetSegment: null, formType: 'full-chauffeur',
    heroTitle: 'Book Outstation, Local & Airport Cabs',
    heroDescription: 'All-inclusive fares with fuel & driver. Transparent pricing, no hidden charges.',
  },
  {
    key: 'luxury', name: 'Luxury Cars', href: '/luxury-car-rental', icon: Gem,
    tagline: 'Experience luxury on wheels',
    description: 'Premium and luxury cars for weddings, events and the moments that deserve an entrance.',
    color: '#F59E0B', bg: 'bg-amber-50', ring: 'ring-amber-200',
    image: '/images/fleet/mercedes-e-class.jpg', locationAware: true, fleetSegment: null, formType: 'luxury',
    heroTitle: null, heroDescription: null,
  },
  {
    key: 'bus', name: 'Bus Rental', href: '/bus-rental', icon: Bus,
    tagline: 'Group travel, sorted',
    description: 'Mini-buses to full coaches for group trips, corporate outings and weddings.',
    color: '#0EA5E9', bg: 'bg-sky-50', ring: 'ring-sky-200',
    image: '/images/fleet/luxury-bus-45-seater.jpg', locationAware: true, fleetSegment: null, formType: 'full-bus',
    heroTitle: 'Bus Rental Across 50+ Indian Cities',
    heroDescription: 'Hire 12-seater Tempo Travellers to 50-seater buses for pilgrimages, weddings, corporate events and tours. Get quotes from 500+ verified operators.',
  },
  {
    key: 'truck', name: 'Truck & Transport', href: '/transporter', icon: Truck,
    tagline: 'Heavy-duty cargo transport',
    description: 'Mini-trucks to heavy transporters for goods, cargo and commercial logistics.',
    color: '#EF4444', bg: 'bg-red-50', ring: 'ring-red-200',
    image: null, locationAware: true, fleetSegment: null, formType: 'full-truck',
    heroTitle: 'Transporter Services — GPS Tracked & Verified Drivers',
    heroDescription: 'Professional truck rental and transport services. 7-ton to 32-ton trucks available. GPS tracking, verified drivers. Get quotes now!',
  },
  {
    key: 'packers', name: 'Packers & Movers', href: '/packers-and-movers', icon: Package,
    tagline: 'Relocation, handled end to end',
    description: 'Home and office shifting with packing, loading and safe, insured transport.',
    color: '#14B8A6', bg: 'bg-teal-50', ring: 'ring-teal-200',
    image: null, locationAware: true, fleetSegment: null, formType: 'full-packers',
    heroTitle: 'Professional Packers & Movers You Can Trust',
    heroDescription: 'Verified, insured relocation teams for home shifting, office moves & vehicle transport. Get free quotes from top-rated movers near you.',
  },
  {
    key: 'equipment', name: 'Equipment Rental', href: '/equipment-rental', icon: Wrench,
    tagline: 'Construction equipment on rent',
    description: 'JCBs, cranes and heavy machinery for construction and industrial projects.',
    color: '#A855F7', bg: 'bg-purple-50', ring: 'ring-purple-200',
    image: null, locationAware: true, fleetSegment: null, formType: 'full-equipment',
    heroTitle: 'Construction & Heavy Equipment — Hire Across India',
    heroDescription: 'Rent JCB, cranes, excavators, tipper trucks, road rollers, and generators. Certified operators included. Get quotes from 500+ verified vendors now!',
  },
  {
    key: 'wander', name: 'Wander Tours', href: '/wander', icon: Compass,
    tagline: 'Curated trips, not just rentals',
    description: 'Road trips and getaways designed by local experts — book an experience, not just a vehicle.',
    color: '#F43F5E', bg: 'bg-rose-50', ring: 'ring-rose-200',
    image: '/wander/roadtrip.jpg', locationAware: false, fleetSegment: null, formType: 'simple',
    heroTitle: null, heroDescription: null,
  },
] as const;

// "Explore Our Top Categories" grid — real routes + real /images/og cover
// photos already used for each service's own metadata image, reused here.
const TOP_CATEGORIES = [
  { label: 'Self Drive Car Rental', sub: 'Rent & drive it yourself', href: '/self-drive-car-rentals', image: '/images/categories/car.png', icon: Car, color: '#3B82F6' },
  { label: 'Car Rental', sub: 'With a professional driver', href: '/car-rental', image: '/images/categories/car-with-driver.png', icon: Car, color: '#3B82F6' },
  { label: 'Bikes', sub: 'For city rides & getaways', href: '/bike-on-rent', image: '/images/categories/bike.png', icon: Bike, color: '#F97316' },
  { label: 'Buses', sub: 'Group travel made easy', href: '/bus-rental', image: '/images/categories/bus.png', icon: Bus, color: '#0EA5E9' },
  { label: 'Trucks', sub: 'For all your cargo needs', href: '/transporter', image: '/images/categories/truck.png', icon: Truck, color: '#F97316' },
  { label: 'Tempo', sub: 'Travellers & Mini Buses', href: '/tempo-traveller', image: '/images/categories/tempo.png', icon: BusFront, color: '#0EA5E9' },
  { label: 'Equipment', sub: 'For every project', href: '/equipment-rental', image: '/images/categories/equipment.png', icon: Wrench, color: '#A855F7' },
  { label: 'Tours & Trips', sub: 'Amazing places, unique experiences', href: '/wander', image: '/images/categories/tours.png', icon: Compass, color: '#F43F5E' },
] as const;

// "A Marketplace Built for Everyone" — real onboarding routes for each
// audience segment (/vendor, /travel-agents, /driver landing pages).
const AUDIENCE_SEGMENTS = [
  {
    label: 'For Customers',
    title: 'Find. Compare. Book.',
    body: 'Choose from thousands of vehicles, tours and trips from trusted providers.',
    cta: 'Start Booking',
    href: '/services',
    icon: Users,
    color: '#064E3B',
    image: '/images/audiences/customer.png',
  },
  {
    label: 'For Rental Businesses',
    title: 'Run your entire fleet.',
    body: 'Manage vehicles, drivers, staff, insurance, bookings, leads and customers in one place.',
    cta: 'Manage Business',
    href: '/vendor',
    icon: Building2,
    color: '#064E3B',
    image: '/images/audiences/vendor.png',
  },
  {
    label: 'For Travel Agents',
    title: 'Build your travel business.',
    body: 'List vehicles, properties, tours and trips while managing leads & bookings.',
    cta: 'Join as Agent',
    href: '/travel-agents',
    icon: Plane,
    color: '#064E3B',
    image: '/images/audiences/travel-agent.png',
  },
  {
    label: 'For Vehicle Owners / Drivers',
    title: 'Your vehicle. Your business.',
    body: 'List your vehicle, receive leads and manage your bookings easily.',
    cta: 'Start Listing',
    href: '/driver',
    icon: Key,
    color: '#064E3B',
    image: '/images/audiences/driver.png',
  },
] as const;

// "Why Choose TransRentals?" — same real benefits/copy already published on
// the home page (src/components/home/FeaturesSection.tsx), restyled here.
const WHY_CHOOSE_US = [
  {
    title: '500+ Verified Vendors',
    description: 'Trusted providers across India',
    icon: ShieldCheck,
    color: '#09B368',
    image: '/images/why-choose/verified-vendors.png',
  },
  {
    title: 'Best Price Guarantee',
    description: 'Competitive pricing',
    icon: IndianRupee,
    color: '#3B82F6',
    image: '/images/why-choose/best-price.png',
  },
  {
    title: 'Instant Booking',
    description: 'Quick & simple booking',
    icon: Clock,
    color: '#F97316',
    image: '/images/why-choose/instant-booking.png',
  },
  {
    title: '50K+ Happy Customers',
    description: 'Thousands already trust us',
    icon: Star,
    color: '#F59E0B',
    image: '/images/why-choose/happy-customers.png',
  },
  {
    title: '24/7 Support',
    description: "We're always available",
    icon: Headphones,
    color: '#8B5CF6',
    image: '/images/why-choose/support.png',
  },
  {
    title: '150+ Cities',
    description: 'Growing across India',
    icon: MapPin,
    color: '#EF4444',
    image: '/images/why-choose/cities-map.png',
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: '01', icon: Search, title: 'Tell us what you need',
    body: 'Pick a category, your city and dates. Takes under a minute — no sign-up required to browse.',
  },
  {
    step: '02', icon: Handshake, title: 'Verified vendors send quotes',
    body: 'Instead of one price from one place, multiple ID-verified vendors compete to serve you.',
  },
  {
    step: '03', icon: ScaleIcon, title: 'Compare & choose freely',
    body: 'See real prices, ratings and fleet photos side by side. You decide who gets your business.',
  },
  {
    step: '04', icon: BadgeCheck, title: 'Book & pay securely',
    body: 'Confirm with a small advance through the platform — your booking, payment and support, protected.',
  },
];

const COMPARISON = [
  { direct: 'One vendor, one price — take it or leave it', market: 'Multiple vendors compete for your booking' },
  { direct: 'No way to verify who you’re dealing with', market: 'Every vendor is ID and document verified' },
  { direct: 'Price and availability, unclear until you call', market: 'Transparent quotes, compared side by side' },
  { direct: 'If something goes wrong, you’re on your own', market: 'Platform support before, during and after' },
];

const FAQS = [
  {
    q: 'Is TransRentals a rental company or a marketplace?',
    a: 'We’re a marketplace. TransRentals doesn’t own the bikes, cars, buses or equipment listed here — we connect you with 10,000+ independently verified vendors across 150+ cities, so you can compare and choose, the same way you’d compare flights or restaurants.',
  },
  {
    q: 'How are vendors verified?',
    a: 'Every vendor goes through document and identity verification before they’re allowed to list on the platform, and their rating is built from real customer reviews after every trip.',
  },
  {
    q: 'Do I have to pay to just get quotes?',
    a: 'No. Browsing categories and receiving quotes is free. You only pay when you confirm and book with the vendor you choose.',
  },
  {
    q: 'What if I’m not happy with my booking?',
    a: 'Because your booking goes through TransRentals, our support team can step in — unlike booking directly with a stranger off a classifieds listing.',
  },
  {
    q: 'I run a rental business — can I list on TransRentals?',
    a: 'Yes — vendors join for free with 0% commission on their first bookings and get access to genuine, ready-to-book customer demand.',
  },
];

function useRotatingWord(words: readonly string[], intervalMs = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % words.length), intervalMs);
    return () => clearInterval(t);
  }, [words, intervalMs]);
  return words[i];
}

// Real tour listings pulled live from the same /api/wander/listings endpoint
// the /wander page itself uses — no invented tour names/prices.
type TourListing = {
  id: string;
  slug: string | null;
  title: string;
  images: string[];
  basePrice: number | null;
  priceType: string;
  duration: string | null;
  rating: number;
  mainLocation: { name: string } | null;
};

function TourTeaserCard({ tour }: { tour: TourListing }) {
  const cover = tour.images?.[0] || null;
  const hasPrice = tour.priceType !== 'ON_REQUEST' && tour.basePrice;
  return (
    <Link href={`/wander/${tour.slug || tour.id}`} className="group w-[190px] flex-shrink-0 sm:w-[240px]">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <Compass className="h-10 w-10 text-primary-300" />
          </div>
        )}
        {tour.mainLocation?.name && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-primary-600" /> {tour.mainLocation.name}
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-[14.5px] font-bold text-slate-900">{tour.title}</h3>
      <div className="mt-1 flex items-center justify-between">
        {hasPrice ? (
          <p className="text-[13px] text-slate-500">
            From <span className="font-bold text-slate-900">₹{Number(tour.basePrice).toLocaleString('en-IN')}</span>
          </p>
        ) : (
          <p className="text-[13px] font-semibold text-primary-600">Get Quotes</p>
        )}
        {tour.rating > 0 && (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {tour.rating}
          </span>
        )}
      </div>
    </Link>
  );
}

function ToursStrip() {
  const [tours, setTours] = useState<TourListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch('/api/wander/listings?limit=8&sortBy=newest', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setTours(d.listings?.slice(0, 8) || []))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (!loading && tours.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Handpicked getaways"
            title="Explore Tours & Trips"
            subtitle="Real, bookable tours from vendors already listed on the platform"
          />
          <Link
            href="/wander"
            className="mb-1 hidden shrink-0 items-center gap-2 rounded-lg border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 flex gap-3 overflow-x-auto pb-3 scrollbar-hide sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[190px] flex-shrink-0 animate-pulse sm:w-[240px]">
                  <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                </div>
              ))
            : tours.map((t) => <TourTeaserCard key={t.id} tour={t} />)}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/wander"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
          >
            View all tours <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function MarketplacePage() {
  const rotatingWord = useRotatingWord(['Bike', 'Car', 'Bus', 'Truck', 'Tour', 'Move'] as const);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
  const [dialCategory, setDialCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeWhyIndex, setActiveWhyIndex] = useState(0);
  const topCategoriesRef = useRef<HTMLDivElement>(null);
  const scrollTopCategories = (dir: 'left' | 'right') => {
    const el = topCategoriesRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
  };

  // "Why Choose" timeline pins in place while its tall wrapper scrolls past —
  // scroll progress through that wrapper drives which point is active, so
  // the section stays sticky until the 6th (last) point, then unpins.
  const whyScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      const el = whyScrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const idx = Math.min(WHY_CHOOSE_US.length - 1, Math.floor(progress * WHY_CHOOSE_US.length));
      setActiveWhyIndex(idx);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real locations DB, shared by both category switchers (hero + icon dial) —
  // each switcher's own CategoryFormPanel instance keeps its own city-search
  // state, but the fetched list itself is loaded once here.
  const { locations } = useLocations();

  return (
    <div
      className={`bg-white ${fraunces.variable}`}
      style={{ '--font-heading': 'var(--font-display-home)' } as React.CSSProperties}
    >
      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      {/* Temporarily hidden while the 3rd section (TransportSearchHero) is being reviewed. */}
      {false && (
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,.12) 0%, transparent 45%), radial-gradient(circle at 85% 70%, rgba(255,255,255,.1) 0%, transparent 45%)' }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '38px 38px' }} />

        <div className="relative container mx-auto px-4 py-14 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-12">
            {/* LEFT: headline + category tabs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Full-form categories (Chauffeur/Bus/Packers/Truck/Equipment)
                  show their OWN specific headline here instead of the generic
                  rotating one — otherwise their embedded form on the right
                  repeats the same "Need a X?" idea in different words right
                  next to it. */}
              <AnimatePresence mode="wait">
                {activeCategory.heroTitle ? (
                  <motion.div
                    key={`hero-${activeCategory.key}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
                      <activeCategory.icon className="h-3.5 w-3.5 text-primary-300" />
                      {activeCategory.name.toUpperCase()}
                    </span>
                    <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                      {activeCategory.heroTitle}
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 lg:mx-0">
                      {activeCategory.heroDescription}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hero-generic"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
                      <Sparkles className="w-3.5 h-3.5 text-primary-300" />
                      INDIA&rsquo;S VEHICLE RENTAL MARKETPLACE
                    </span>

                    <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                      Need a{' '}
                      <span className="relative inline-flex h-[1.15em] min-w-[5.75ch] items-baseline justify-center overflow-hidden align-bottom lg:justify-start">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={rotatingWord}
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: '0%', opacity: 1 }}
                            exit={{ y: '-100%', opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="absolute inset-0 flex items-baseline justify-center whitespace-nowrap text-primary-300 lg:justify-start"
                          >
                            {rotatingWord}?
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <br />
                      Don&rsquo;t settle for one quote.
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 lg:mx-0">
                      Post your requirement once. <strong className="text-white">10,000+ verified vendors</strong> across
                      150+ cities compete for your business — you compare real prices and pick who wins.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300 lg:justify-start">
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.8/5 rated</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary-300" /> 10,000+ verified vendors</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary-300" /> 150+ cities</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary-300" /> 2,00,000+ bookings</span>
              </div>

              {/* Category tabs — under the headline, so a big form (Chauffeur /
                  Packers / etc) on the right never has to share a row with them. */}
              <div className="mt-8 flex flex-wrap justify-center gap-2.5 lg:justify-start">
                {CATEGORIES.map((c, i) => {
                  const Icon = c.icon;
                  const active = activeCategory.key === c.key;
                  return (
                    <motion.button
                      key={c.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.4 + i * 0.04 }}
                      onClick={() => setActiveCategory(c)}
                      className={`group flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
                        active
                          ? 'scale-[1.03] border-primary bg-primary text-white shadow-lg shadow-primary-900/40'
                          : 'border-white/10 bg-white/[0.06] text-slate-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          active ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/15'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {c.name}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* RIGHT: active category's form only */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <CategoryFormPanel activeCategory={activeCategory} locations={locations} />
            </motion.div>
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════ QUICK SERVICE SWITCHER (icon dial) ═══════════════════ */}
      {/* Temporarily hidden while the 3rd section (TransportSearchHero) is being reviewed. */}
      {false && (
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-primary-900 to-primary-800 py-16 text-white sm:py-20">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '38px 38px' }} />
        <div className="container relative mx-auto px-4">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-widest text-primary-300">One dial, every service</span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">Spin to your service, get a quote</h2>
            <p className="mt-3 text-slate-300">Pick a vehicle below and the form updates instantly — no page reloads, no digging through menus.</p>
          </FadeIn>

          <div className="mt-10">
            <ServiceIconDial active={dialCategory} onSelect={setDialCategory} />
          </div>

          <div className="mt-10">
            <CategoryFormPanel activeCategory={dialCategory} locations={locations} />
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════════ TRANSPORT SEARCH HERO (ixigo-style, no banner) ══════════════════════ */}
      <TransportSearchHero locations={locations} variant="compact" />

      {/* ══════════════════════ TRANSPORT SEARCH HERO (duplicate) ══════════════════════ */}
      {/* Temporarily hidden — keeping the code, not deleting it. */}
      {false && <TransportSearchHero locations={locations} variant="hero" />}

      {/* ═══════════════════ EXPLORE TOP CATEGORIES ═══════════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Whatever you&rsquo;re looking for, it&rsquo;s here"
            title="Explore Our Top Categories"
            subtitle=""
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => scrollTopCategories('left')}
              aria-label="Scroll categories left"
              className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-lg transition-colors hover:border-primary-300 hover:text-primary-600 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTopCategories('right')}
              aria-label="Scroll categories right"
              className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-lg transition-colors hover:border-primary-300 hover:text-primary-600 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={topCategoriesRef}
              className="mt-10 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 scrollbar-hide sm:mx-0 sm:px-0"
            >
              {TOP_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="group w-32 flex-shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg sm:w-36 lg:w-[calc((100%-96px)/7)]"
                  >
                    <div className="p-3">
                      <h3 className="text-[15px] font-bold leading-snug text-slate-900">{cat.label}</h3>
                      <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{cat.sub}</p>
                    </div>
                    {cat.image ? (
                      <div className="aspect-[4/3] w-full overflow-hidden px-3 pb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex aspect-[4/3] w-full items-center justify-center rounded-lg px-3 pb-3 transition-transform duration-300 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}0d)` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: cat.color }} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-600 px-6 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Explore Everything <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MARKETPLACE BUILT FOR EVERYONE ═══════════════════ */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="More than a rental platform"
            title="A Marketplace Built for Everyone"
            subtitle=""
          />

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              return (
                <Link
                  key={seg.label}
                  href={seg.href}
                  className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: seg.color }}
                >
                  {seg.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seg.image}
                      alt={seg.label}
                      className="absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${seg.color}d9 0%, ${seg.color}b3 18%, ${seg.color}66 38%, ${seg.color}26 58%, ${seg.color}00 78%)`,
                    }}
                  />

                  <div className="relative z-10 flex flex-1 flex-col p-5 text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-[13px] font-semibold text-white/90">{seg.label}</p>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-white">{seg.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">{seg.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white transition-transform group-hover:translate-x-0.5">
                      {seg.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY CHOOSE TRANSRENTALS ═══════════════════ */}
      <section className="relative bg-white py-12 sm:py-14">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 8% 12%, rgba(9,179,104,.08) 0%, transparent 40%), radial-gradient(circle at 92% 85%, rgba(9,179,104,.08) 0%, transparent 40%)',
          }}
        />
        <div className="container relative mx-auto px-4">
          <div ref={whyScrollRef} className="relative lg:h-[200vh]">
          <div className="lg:sticky lg:top-[134px]">
          <SectionHeading
            eyebrow="The trusted choice for thousands"
            title="Why Choose TransRentals?"
            subtitle="Experience the best vehicle rental service in India with unmatched benefits"
          />

          <div className="grid grid-cols-1 items-start gap-10 mt-12 lg:grid-cols-2 lg:gap-16">
            {/* LEFT: numbered timeline */}
            <div className="relative">
              {WHY_CHOOSE_US.map((item, i) => {
                const active = activeWhyIndex === i;
                const isLast = i === WHY_CHOOSE_US.length - 1;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveWhyIndex(i)}
                    onMouseEnter={() => setActiveWhyIndex(i)}
                    className="group relative flex w-full items-stretch gap-5 text-left"
                  >
                    <div className="relative flex flex-col items-center">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300"
                        style={
                          active
                            ? { background: item.color, color: '#fff', boxShadow: `0 0 0 4px ${item.color}22` }
                            : { background: '#F1F5F9', color: '#94A3B8' }
                        }
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {!isLast && (
                        <span
                          className="mt-1 w-px flex-1 transition-colors duration-300"
                          style={{ background: active ? item.color : '#E2E8F0', minHeight: '2.75rem' }}
                        />
                      )}
                    </div>

                    <div className={`pb-9 transition-all duration-300 ${active ? '' : 'opacity-60 group-hover:opacity-90'}`}>
                      <h3
                        className="text-lg font-bold transition-colors duration-300"
                        style={{ color: active ? '#0F172A' : '#334155' }}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT: large visual that swaps with the active point */}
            <div>
              <div className="relative aspect-[4/2.8] w-full overflow-hidden rounded-3xl shadow-2xl">
                {(() => {
                  const item = WHY_CHOOSE_US[activeWhyIndex];
                  const Icon = item.icon;
                  return (
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center sm:p-10"
                        style={
                          item.image
                            ? { background: '#F8FAFC' }
                            : { background: `linear-gradient(150deg, ${item.color} 0%, ${item.color}cc 55%, #0F172A 130%)` }
                        }
                      >
                        {item.image ? (
                          <>
                            <span
                              className="absolute left-6 top-6 text-[13px] font-bold tracking-[0.2em]"
                              style={{ color: item.color }}
                            >
                              {String(activeWhyIndex + 1).padStart(2, '0')} / {String(WHY_CHOOSE_US.length).padStart(2, '0')}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full max-w-full object-contain p-6"
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage:
                                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,.5) 0%, transparent 35%), radial-gradient(circle at 85% 80%, rgba(255,255,255,.3) 0%, transparent 40%)',
                              }}
                            />
                            <span className="relative text-[15px] font-bold tracking-[0.2em] text-white/60">
                              {String(activeWhyIndex + 1).padStart(2, '0')} / {String(WHY_CHOOSE_US.length).padStart(2, '0')}
                            </span>
                            <div className="relative mt-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                              <Icon className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="relative mt-7 max-w-sm text-3xl font-extrabold leading-tight text-white">
                              {item.title}
                            </h3>
                            <p className="relative mt-3 max-w-xs text-[15px] leading-relaxed text-white/85">
                              {item.description}
                            </p>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  );
                })()}
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ EXPLORE TOURS & TRIPS ═══════════════════ */}
      <ToursStrip />

      {/* ═══════════════════ WEB STORIES ═══════════════════ */}
      <StoriesStrip />

      {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="How the marketplace works"
            title="One request. Many vendors. Your choice."
            subtitle="This is what makes TransRentals a marketplace and not just another rental listing — vendors compete, you win."
          />

          <div className="relative mt-14 grid gap-8 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block" />
            {HOW_IT_WORKS.map((s, i) => (
              <FadeIn key={s.step} delay={i * 100}>
                <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 ring-8 ring-white">
                    <s.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <span className="mt-3 text-xs font-black tracking-widest text-primary-300">STEP {s.step}</span>
                  <h3 className="mt-1 font-heading text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CATEGORY MARKETPLACE ═══════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Explore the marketplace"
            title="Everything on wheels, in one place"
            subtitle="Nine categories, thousands of listed vendors — browse any of them the way you&rsquo;d browse restaurants on Zomato or stays on MakeMyTrip."
          />

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <FadeIn key={c.key} delay={(i % 3) * 80}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
                >
                  <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-40">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${c.color}30, ${c.color}0d)` }}
                      >
                        <c.icon className="h-14 w-14" style={{ color: c.color, opacity: 0.5 }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute left-2.5 top-2.5 hidden items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-700 backdrop-blur sm:inline-flex">
                      <ShieldCheck className="h-3 w-3 text-primary-600" /> Verified
                    </span>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/95">
                        <c.icon className="h-3.5 w-3.5" style={{ color: c.color }} />
                      </div>
                      <h3 className="truncate font-heading text-sm font-bold text-white drop-shadow-sm sm:text-base">{c.name}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <p className="hidden flex-1 text-sm leading-relaxed text-slate-500 sm:block">{c.description}</p>
                    <p className="flex-1 text-xs leading-relaxed text-slate-500 sm:hidden">{c.tagline}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-600 transition-all group-hover:gap-2 sm:mt-3 sm:text-sm">
                      Get quotes <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MARKETPLACE VS DIRECT ═══════════════════════ */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Why it matters"
            title="A marketplace beats a single vendor"
            subtitle="The same reason you compare before booking a flight or a hotel applies here too."
          />

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            <FadeIn>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Booking direct</p>
                <ul className="mt-4 space-y-4">
                  {COMPARISON.map((row) => (
                    <li key={row.direct} className="flex items-start gap-3 text-sm text-slate-500">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {row.direct}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="h-full rounded-2xl border-2 border-primary bg-primary-50/40 p-6 shadow-lg shadow-primary-100">
                <p className="text-xs font-black uppercase tracking-widest text-primary-600">The TransRentals marketplace</p>
                <ul className="mt-4 space-y-4">
                  {COMPARISON.map((row) => (
                    <li key={row.market} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                      {row.market}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════ BUSINESS DASHBOARD ═══════════════════ */}
      <section className="relative overflow-hidden bg-slate-50 py-12 sm:py-16">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 88% 15%, rgba(9,179,104,.10) 0%, transparent 42%), radial-gradient(circle at 5% 90%, rgba(9,179,104,.08) 0%, transparent 42%)',
          }}
        />
        <div className="container relative mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-700">
                <Sparkles className="h-4 w-4" /> Everything your business needs
              </span>
              <h2 className="mt-5 font-heading text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Powerful Management System for Rentals
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  'Manage fleet, drivers, staff & documents',
                  'Get more leads from the marketplace',
                  'Handle bookings, payments & customers',
                  'Add your own tours & trips',
                  'Detailed reports & business insights',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
                      <CheckCircle2 className="h-[18px] w-[18px] text-primary-600" />
                    </span>
                    <span className="text-sm font-medium leading-snug text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/vendor"
                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
              >
                Explore Business Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="relative lg:scale-125 lg:origin-left">
                <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-200/40 via-primary-100/20 to-transparent blur-2xl" />

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary-300" />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/marketplace/vendor-dashboard.png"
                    alt="TransRentals vendor business dashboard"
                    className="w-full h-auto"
                  />
                </div>

                <div className="absolute -left-5 -bottom-5 hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex">
                  <ShieldCheck className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="font-heading text-base font-extrabold leading-none text-slate-900">10,000+</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">Verified Vendors</p>
                  </div>
                </div>

                <div className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xl sm:flex">
                  <TrendingUp className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-bold text-slate-900">2,00,000+ Bookings</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TESTIMONIALS ══════════════════════════ */}
      <Testimonials />

      {/* ══════════════════════════ BACKR TOKEN ══════════════════════════ */}
      <BackrTokenSection />

      {/* ══════════════════════════ APP DOWNLOAD ══════════════════════════ */}
      <AppDownloadSection />

      {/* ══════════════════════════════ FAQ ══════════════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
            {/* LEFT: heading + contact card */}
            <FadeIn>
              <span className="text-xs font-black uppercase tracking-widest text-primary-600">Good to know</span>
              <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-3 text-slate-500">Straight answers about how the marketplace actually works.</p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                  <Headphones className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-slate-900">Still have questions?</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  Can&rsquo;t find the answer you&rsquo;re looking for? Our team is happy to help.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 transition-colors hover:text-primary-700"
                >
                  Contact us <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            {/* RIGHT: accordion */}
            <div className="space-y-3">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={f.q}
                    className={`overflow-hidden rounded-2xl border bg-white transition-colors duration-300 ${
                      open ? 'border-primary-300 shadow-sm shadow-primary-100' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors duration-300 ${
                          open ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-heading text-sm font-bold text-slate-900 sm:text-base">{f.q}</span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          open ? 'rotate-45 bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 pl-[60px] pr-6 text-sm leading-relaxed text-slate-600 sm:pl-[68px]">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FINAL CTA ═══════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 py-16 text-white sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="container relative mx-auto px-4 text-center">
          <Zap className="mx-auto h-8 w-8 text-primary-200" />
          <h2 className="mt-4 font-heading text-3xl font-extrabold sm:text-4xl">Ready to compare quotes, not just take one?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-100">
            Pick a category and see how many verified vendors are ready to quote you — it&rsquo;s free to ask.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/bike-on-rent"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 transition-transform hover:scale-105"
            >
              Get Free Quotes Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vendor"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              List your business as a vendor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Renders whichever form fits the given category — shared by the hero's
// pill switcher AND the icon dial below it, so both stay in sync with any
// future change instead of drifting out of two copy-pasted blocks. Owns its
// OWN city-search state (not shared from the parent) since two instances of
// this panel exist on the page at once and can't fight over one <input> ref.
function CategoryFormPanel({
  activeCategory, locations,
}: {
  activeCategory: (typeof CATEGORIES)[number];
  locations: Location[];
}) {
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const cityBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    const pool = q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;
    return pool.slice(0, 8);
  }, [cityQuery, locations]);

  const handleSelectCity = (loc: Location) => {
    setSelectedCity(loc);
    setCityQuery(loc.name);
    setCityOpen(false);
  };

  const targetHref = useMemo(() => {
    if (!activeCategory.locationAware || !selectedCity) return activeCategory.href;
    const slug = selectedCity.slug || selectedCity.name.toLowerCase().replace(/\s+/g, '-');
    return `${activeCategory.href}/${slug}`;
  }, [activeCategory, selectedCity]);

  return (
    <>
      {!activeCategory.formType.startsWith('full-') && (
        <div className="rounded-2xl bg-white p-2 shadow-2xl sm:p-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${activeCategory.color}1a` }}
                  >
                    <activeCategory.icon className="h-5 w-5" style={{ color: activeCategory.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-slate-900 sm:text-base">{activeCategory.tagline}</p>
                    <p className="truncate text-xs text-slate-500 sm:text-sm">{activeCategory.description}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1" ref={cityBoxRef}>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-100">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      value={cityQuery}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setSelectedCity(null);
                        setCityOpen(true);
                      }}
                      onFocus={() => setCityOpen(true)}
                      placeholder={activeCategory.formType === 'simple' ? 'Your city (optional)' : 'Your city'}
                      className="w-full min-w-0 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  {cityOpen && cityMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl">
                      {cityMatches.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSelectCity(loc)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                          <span className="truncate">{loc.name}{loc.state ? `, ${loc.state}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activeCategory.formType === 'simple' && (
                  <Link
                    href={targetHref}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] hover:bg-primary-600"
                  >
                    Search Vendors <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Bike / Self-Drive: the SAME date+time search form as the real
                /bike-on-rent/[city] and /self-drive-car-rentals/[city] pages —
                same fields, same 12hr-advance rule, same fleet-page destination. */}
            {activeCategory.formType === 'datetime' && activeCategory.fleetSegment && (
              <DateTimeSearchPanel
                key={activeCategory.key}
                basePath={activeCategory.href}
                fleetSegment={activeCategory.fleetSegment}
                buttonLabel={activeCategory.fleetSegment === 'bikes' ? 'Search Available Bikes' : 'Search Available Cars'}
                citySlug={selectedCity ? selectedCity.slug || selectedCity.name.toLowerCase().replace(/\s+/g, '-') : null}
                accentColor={activeCategory.color}
              />
            )}

            {/* Luxury: same trip-type flow + same /luxury-car-rental/[city]/book
                destination as the real LuxuryBookingHero component. */}
            {activeCategory.formType === 'luxury' && (
              <LuxurySearchPanel
                key={activeCategory.key}
                citySlug={selectedCity ? selectedCity.slug || selectedCity.name.toLowerCase().replace(/\s+/g, '-') : null}
                cityName={selectedCity?.name ?? null}
                cityId={selectedCity?.id ?? null}
                locations={locations}
                accentColor={activeCategory.color}
              />
            )}
          </div>
        </div>
      )}

      {/* Chauffeur / Packers & Movers / Bus / Truck / Equipment: no compact
          form exists on the real site for these — all are full multi-step /
          live-pricing / chat flows with no simple redirect target, so we embed
          the REAL page components rather than build a risky reimplementation.
          Their own duplicate marketing column/headline is hidden (fragile-but-
          scoped CSS targeting their known class names) and their own section
          background is stripped (`bg-none`) so it blends into whatever this
          panel is sitting on instead of showing as a separate colour block. */}
      {activeCategory.formType === 'full-chauffeur' && (
        <div className="mx-auto overflow-hidden rounded-2xl shadow-2xl [&>section]:!bg-none [&_.grid.lg\:grid-cols-2>div:first-child]:hidden [&_.grid.lg\:grid-cols-2]:lg:!grid-cols-1">
          <CarRentalBookingHero city="" citySlug="" serviceSlug="car-rental" serviceTitle="Chauffeur Service" />
        </div>
      )}
      {activeCategory.formType === 'full-packers' && (
        <div className="mx-auto overflow-hidden rounded-2xl shadow-2xl [&>section]:!bg-none [&_.order-2.lg\:order-1]:hidden [&_.order-1.lg\:order-2]:lg:!w-full">
          <PackersMoversServiceHero cityName="" />
        </div>
      )}
      {activeCategory.formType === 'full-bus' && (
        <div className="mx-auto overflow-hidden rounded-2xl shadow-2xl [&>section]:!bg-none [&_.order-2.lg\:order-1]:hidden [&_.order-1.lg\:order-2]:lg:!w-full">
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
            showQuickForm
            priceAnchor="18/km"
            heroHighlights={[
              'Driver included on all trips',
              'AC & Non-AC buses — 9 to 55 seater options',
              '500+ verified operators, instant quote',
            ]}
          />
        </div>
      )}
      {activeCategory.formType === 'full-truck' && (
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl shadow-2xl [&>section]:!bg-none [&_.text-center.mb-8]:hidden [&_.gap-6.mt-8]:hidden">
          <ServiceHeroWithChat
            badge="Truck Rental & Transport"
            title="Transporter Services"
            titleHighlight="GPS Tracked & Verified Drivers"
            description="Professional truck rental and transport services. 7-ton to 32-ton trucks available. GPS tracking, verified drivers. Get quotes now!"
            features={[
              { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
              { icon: 'shield', text: 'Verified Transporters', color: 'text-blue-600' },
              { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
            ]}
            gradientFrom="slate-50"
            gradientTo="gray-50"
          />
        </div>
      )}
      {/* Equipment Rental: same premium quick-quote widget (4-step
          equipment-specific form + AI-chat toggle) as the real
          /equipment-rental/[city] page's showQuickForm hero — same
          bookingVariant="equipment", same POST /api/equipment-quote-requests
          flow as the real EquipmentBookingWidget. */}
      {activeCategory.formType === 'full-equipment' && (
        <div className="mx-auto overflow-hidden rounded-2xl shadow-2xl [&>section]:!bg-none [&_.order-2.lg\:order-1]:hidden [&_.order-1.lg\:order-2]:lg:!w-full">
          <ServiceHeroWithChat
            badge="Equipment Rental"
            title="Construction & Heavy Equipment"
            titleHighlight="Hire Across India"
            description="Rent JCB, cranes, excavators, tipper trucks, road rollers, and generators. Certified operators included. Get quotes from 500+ verified vendors now!"
            features={[
              { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
              { icon: 'shield', text: 'Certified Operators', color: 'text-blue-600' },
              { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
            ]}
            gradientFrom="yellow-50"
            gradientTo="orange-50"
            showQuickForm
            bookingVariant="equipment"
            priceAnchor="JCB Backhoe from ₹2,999/day"
            heroHighlights={[
              'Certified operator included on all equipment',
              'JCB, Crane, Excavator, Generator, Hydra & more',
              '500+ verified operators, instant quote',
            ]}
          />
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Outline-only, background-free icon strip standing in for the pill tabs —
// horizontally scrollable AND drag-able (pointer events) so it feels like a
// dial you spin through rather than a static row of buttons. Arrow buttons
// nudge it by a fixed distance for anyone who'd rather click than drag.
function ServiceIconDial({
  active, onSelect,
}: {
  active: (typeof CATEGORIES)[number];
  onSelect: (c: (typeof CATEGORIES)[number]) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Mouse-only drag-to-scroll via classic window-level mousemove/mouseup
  // listeners — NOT pointer-capture (an earlier version used setPointerCapture,
  // which silently swallowed the icon buttons' click events, and pointer-based
  // dragging turned out to not track real touch gestures reliably either).
  // Touch/pen pointers are left completely untouched here so the browser's
  // own native swipe-scrolling on this overflow-x-auto strip handles them —
  // that's the only thing that reliably works for a real finger swipe.
  const suppressClickRef = useRef(false);

  const nudge = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollerRef.current) return;
    const startX = e.clientX;
    const startScroll = scrollerRef.current.scrollLeft;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (!scrollerRef.current) return;
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      scrollerRef.current.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (moved) suppressClickRef.current = true;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleSelect = (c: (typeof CATEGORIES)[number]) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    onSelect(c);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        className="flex cursor-grab select-none gap-8 overflow-x-auto px-10 py-2 [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
      >
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = active.key === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => handleSelect(c)}
              className="flex shrink-0 flex-col items-center gap-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            >
              <Icon
                className="h-9 w-9 transition-transform duration-300"
                strokeWidth={1.5}
                style={{ color: isActive ? c.color : 'rgba(255,255,255,0.45)', transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
              />
              <span className={`whitespace-nowrap text-[11px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                {c.name}
              </span>
              <span
                className="h-1 w-1 rounded-full transition-opacity"
                style={{ backgroundColor: c.color, opacity: isActive ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => nudge(1)}
        className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Great-circle distance in km — same formula CarRentalBookingHero uses to
// rank "nearby cities" for its Via/Drop suggestions.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Lets the Mini*Input field components below pick up styling for the
// compact (ixigo-style) hero without threading a prop through every one of
// their ~30 call sites — TransportSearchHero provides its own `variant`.
const HeroVariantContext = createContext<'hero' | 'compact'>('hero');

// ─────────────────────────────────────────────────────────────────────────
// Compact city autocomplete shared by the From/To fields below — same
// dropdown-on-focus, filter-as-you-type behaviour as CategoryFormPanel's
// city box, just trimmed down to fit a single grid cell. When `fromLocation`
// is passed (outstation Drop/Via fields), untyped suggestions are ranked by
// distance from it, same as CarRentalBookingHero's ComboLocationInput.
function MiniCityInput({
  label, placeholder, caption, locations, value, onSelect, fromLocation,
}: {
  label: string;
  placeholder: string;
  caption?: string;
  locations: Location[];
  value: string;
  onSelect: (loc: Location) => void;
  fromLocation?: Location | null;
}) {
  const variant = useContext(HeroVariantContext);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;

    if (!q && fromLocation?.latitude != null && fromLocation?.longitude != null) {
      return [...pool]
        .filter((l) => l.id !== fromLocation.id)
        .sort((a, b) => {
          const da =
            a.latitude != null && a.longitude != null
              ? haversineKm(fromLocation.latitude!, fromLocation.longitude!, a.latitude, a.longitude)
              : Infinity;
          const db =
            b.latitude != null && b.longitude != null
              ? haversineKm(fromLocation.latitude!, fromLocation.longitude!, b.latitude, b.longitude)
              : Infinity;
          return da - db;
        })
        .slice(0, 8);
    }

    return pool.slice(0, 8);
  }, [query, locations, fromLocation]);

  const nearbyCount =
    !query.trim() && fromLocation?.latitude != null && fromLocation?.longitude != null
      ? Math.min(5, matches.length)
      : 0;

  return (
    <div
      className="relative min-w-[120px] sm:min-w-[182px] flex-1 cursor-text rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]"
      ref={boxRef}
      onClick={() => inputRef.current?.focus()}
    >
      <label className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-bold sm:text-[13px] ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>
        <MapPin className="h-3 w-3 text-primary-700" /> {label}
      </label>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full min-w-0 border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0 ${variant === 'compact' ? 'placeholder:font-normal placeholder:text-slate-600' : 'placeholder:font-medium placeholder:text-slate-400'}`}
      />
      {caption && variant !== 'compact' && <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">{caption}</span>}
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {nearbyCount > 0 && (
            <div className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary-600">
              Nearby cities shown first
            </div>
          )}
          {matches.map((loc, i) => {
            const isNearby = i < nearbyCount;
            const km =
              isNearby && fromLocation?.latitude != null && fromLocation?.longitude != null && loc.latitude != null && loc.longitude != null
                ? Math.round(haversineKm(fromLocation.latitude, fromLocation.longitude, loc.latitude, loc.longitude))
                : null;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => { onSelect(loc); setQuery(loc.name); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <MapPin className={`h-3.5 w-3.5 shrink-0 ${isNearby ? 'text-primary-500' : 'text-slate-300'}`} />
                <span className="flex-1 truncate">{loc.name}{loc.state ? `, ${loc.state}` : ''}</span>
                {km != null && (
                  <span className="shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                    ~{km} km
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Same dropdown-on-focus pattern as MiniCityInput above, searching the real
// /api/airports list (name + IATA code) instead of city locations — used
// only by the Car tab's Airport mode.
function MiniAirportInput({
  label, placeholder, caption, airports, value, onSelect, loading,
}: {
  label: string;
  placeholder: string;
  caption?: string;
  airports: AirportOption[];
  value: string;
  onSelect: (a: AirportOption) => void;
  loading?: boolean;
}) {
  const variant = useContext(HeroVariantContext);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? airports.filter((a) => a.displayName.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || (a.city ?? '').toLowerCase().includes(q))
      : airports;
    return pool.slice(0, 8);
  }, [query, airports]);

  return (
    <div
      className="relative min-w-[117px] sm:min-w-[180px] flex-1 cursor-text rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]"
      ref={boxRef}
      onClick={() => inputRef.current?.focus()}
    >
      <label className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-bold sm:text-[13px] ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>
        <Plane className="h-3 w-3 text-primary-700" /> {label}
      </label>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? 'Loading airports…' : placeholder}
        className={`w-full min-w-0 border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0 ${variant === 'compact' ? 'placeholder:font-normal placeholder:text-slate-600' : 'placeholder:font-medium placeholder:text-slate-400'}`}
      />
      {caption && variant !== 'compact' && <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">{caption}</span>}
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {matches.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onSelect(a); setQuery(a.displayName); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Plane className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="truncate">{a.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom-styled dropdown (button + floating option list) standing in for a
// native <select> — matches the rest of the widget's card styling instead of
// each browser/OS's own native picker UI.
function MiniSelectInput({
  label, icon: Icon, options, value, onChange, placeholder = 'Select an option', caption,
  boxClassName = 'w-full sm:w-auto sm:min-w-[182px] sm:flex-1',
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  caption?: string;
  boxClassName?: string;
}) {
  const variant = useContext(HeroVariantContext);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div
      className={`relative ${boxClassName} cursor-pointer rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)] sm:px-4 sm:py-3.5`}
      ref={boxRef}
      onClick={() => setOpen(true)}
    >
      <label className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-bold sm:text-[13px] ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>
        <Icon className="h-3 w-3 text-primary-700" /> {label}
      </label>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-none bg-transparent p-0 text-left text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0"
      >
        <span className={`truncate ${value ? '' : variant === 'compact' ? 'font-normal text-slate-600' : 'font-medium text-slate-400'}`}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                value === opt ? 'font-semibold text-primary-700' : 'text-slate-700'
              }`}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
      {caption && variant !== 'compact' && <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">{caption}</span>}
    </div>
  );
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Custom-styled date picker (button + floating month calendar) standing in
// for a native <input type="date"> — matches the rest of the widget's card
// styling instead of each browser/OS's own native date picker UI.
function MiniDateInput({
  label, value, onChange, min, caption,
  boxClassName = 'min-w-[125px] sm:min-w-[190px] flex-1',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  caption?: string;
  boxClassName?: string;
}) {
  const variant = useContext(HeroVariantContext);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? ymdToDate(value) : min ? ymdToDate(min) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Jump the visible month back to the selected/min date whenever the
  // picker is reopened, so it doesn't stay stuck wherever it was last browsed.
  useEffect(() => {
    if (!open) return;
    const base = value ? ymdToDate(value) : min ? ymdToDate(min) : new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const minDate = min ? ymdToDate(min) : null;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const canGoPrevMonth = !minDate || new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const displayText = value
    ? ymdToDate(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'dd/mm/yyyy';

  return (
    <div
      className={`relative ${boxClassName} cursor-pointer rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)] sm:px-4 sm:py-3.5`}
      ref={boxRef}
      onClick={() => setOpen(true)}
    >
      <label className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-bold sm:text-[13px] ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>
        <Calendar className="h-3 w-3 text-primary-700" /> {label}
      </label>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-1 border-none bg-transparent p-0 text-left text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0"
      >
        <span className={`truncate ${value ? '' : variant === 'compact' ? 'font-normal text-slate-600' : 'font-medium text-slate-400'}`}>{displayText}</span>
      </button>
      {caption && variant !== 'compact' && <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">{caption}</span>}
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-bold text-slate-900">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold text-slate-400">
            {WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const thisYmd = dateToYmd(thisDate);
              const isDisabled = !!minDate && thisDate < minDate;
              const isSelected = thisYmd === value;
              return (
                <div key={day} className="flex items-center justify-center">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { onChange(thisYmd); setOpen(false); }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : isDisabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-700 hover:bg-primary-50'
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeSlot(t: string) {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

/** Shortest rental we accept when pickup and drop-off fall on the same day. */
const MIN_SAME_DAY_HOURS = 4;

/**
 * Add whole hours to an "HH:MM" slot.
 *
 * Returns null when the result runs past midnight: a same-day drop-off is no
 * longer possible then, so the caller should stop constraining the time and
 * push the customer to a later date instead.
 */
function addHoursToSlot(slot: string, hours: number): string | null {
  const [h, m] = slot.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const total = h * 60 + m + hours * 60;
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
})();

// Custom-styled time picker (button + floating 30-min-slot list) standing in
// for a native <input type="time"> — matches the rest of the widget's card
// styling instead of each browser/OS's own native time picker UI.
function MiniTimeInput({
  label, value, onChange, caption, minTime, minNote,
  boxClassName = 'min-w-[112px] sm:min-w-[172px] flex-1',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  caption?: string;
  /** Earliest selectable slot, "HH:MM". Anything before it is disabled. */
  minTime?: string;
  /** Shown above the list, so a greyed-out slot does not look broken. */
  minNote?: string;
  boxClassName?: string;
}) {
  const variant = useContext(HeroVariantContext);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Scroll the selected (or nearest) slot into view whenever the panel opens,
  // instead of always starting the list at 12:00 AM.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div
      className={`relative ${boxClassName} cursor-pointer rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)] sm:px-4 sm:py-3.5`}
      ref={boxRef}
      onClick={() => setOpen(true)}
    >
      <label className={`mb-1 flex items-center gap-1.5 text-[11.5px] font-bold sm:text-[13px] ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>
        <Clock className="h-3 w-3 text-primary-700" /> {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-1 border-none bg-transparent p-0 text-left text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0"
      >
        <span className={`truncate ${value ? '' : variant === 'compact' ? 'font-normal text-slate-600' : 'font-medium text-slate-400'}`}>{value ? formatTimeSlot(value) : '--:-- --'}</span>
      </button>
      {caption && variant !== 'compact' && <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">{caption}</span>}
      {open && (
        <div ref={listRef} className="absolute left-0 top-full z-[60] mt-1.5 max-h-64 w-44 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {minNote && (
            <p className="sticky top-0 z-10 mb-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-amber-700">
              {minNote}
            </p>
          )}
          {TIME_SLOTS.map((t) => {
            const isSelected = t === value;
            // String compare is safe here: every slot is zero-padded "HH:MM".
            const disabled = !!minTime && t < minTime;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                data-active={isSelected || (!!minTime && t === minTime) ? 'true' : undefined}
                onClick={() => { if (disabled) return; onChange(t); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  disabled
                    ? 'cursor-not-allowed text-slate-300 line-through'
                    : `hover:bg-slate-50 ${isSelected ? 'font-semibold text-primary-700' : 'text-slate-700'}`
                }`}
              >
                {formatTimeSlot(t)}
                {isSelected && !disabled && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Real truck-type/goods-type option labels — copied from TruckRentalBookingForm's
// backend-matching lists (src/components/booking/TruckRentalBookingForm.tsx),
// trimmed to the most common ones so this quick bar doesn't invent its own
// vocabulary the rest of the app doesn't use.
const QUICK_LOAD_TYPES = [
  'Household goods', 'Building materials', 'Industrial Equipments',
  'Electronics/Consumer durables', 'Furniture & Wood products', 'Others',
];
const QUICK_TRUCK_TYPES = [
  'Tata Ace', 'Tata 407 2.5MT/4 Wheels', 'Canters 17ft/4 wheel',
  'Truck 9MT/6 Wheel', 'Truck 16MT/10 Wheel', 'Semi Low Bed Trailer',
];

// Real equipment-type labels — copied from EquipmentBookingWidget's
// EQUIPMENT_TYPES list (src/components/services/ServiceHeroWithChat.tsx),
// same vocabulary the real equipment booking flow uses.
const QUICK_EQUIPMENT_TYPES = [
  'Grove Crane', 'Truck Mounted Crane', 'Tower Crane', 'Telescopic Crane',
  'Rough Terrain Crane', 'Overhead Crane', 'Bulldozer', 'Dumper', 'Loader',
  'Excavator', 'Backhoe Loader',
];

// Same passenger-count → vehicle lookup as BusBookingWidget's getVehicleReco
// (src/components/services/ServiceHeroWithChat.tsx).
function getBusVehicleReco(pax: number) {
  if (pax <= 12) return '12 Seater Tempo Traveller recommended';
  if (pax <= 20) return 'Mini Bus recommended';
  if (pax <= 35) return 'Standard Bus recommended';
  return 'Luxury Coach recommended';
}

// Same inventory item list as PackersMoversServiceHero's Goods step.
const INVENTORY_ITEMS = [
  { key: 'bedroom', label: 'Bedroom set', icon: Bed },
  { key: 'kitchen', label: 'Kitchen items', icon: Utensils },
  { key: 'sofa', label: 'Sofa', icon: Sofa },
  { key: 'dining', label: 'Dining set', icon: Armchair },
  { key: 'fridge', label: 'Fridge', icon: Refrigerator },
  { key: 'tv', label: 'TV', icon: Tv2 },
  { key: 'almirah', label: 'Almirah', icon: DoorClosed },
  { key: 'washing', label: 'Washing machine', icon: WashingMachine },
] as const;

const ESTIMATED_WEIGHT_OPTIONS = [
  { v: '250', label: 'Light (< 500 kg)' },
  { v: '1000', label: 'Medium (500–1500 kg)' },
  { v: '2250', label: 'Heavy (1500–3000 kg)' },
  { v: '4000', label: 'Very Heavy (> 3000 kg)' },
] as const;

// Compact Yes/No pill pair — same choice as PackersMoversServiceHero's YesNo.
function YesNoPill({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-1.5">
      {([{ v: true, label: 'Yes' }, { v: false, label: 'No' }] as const).map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onChange(opt.v)}
          className={`flex-1 rounded-md border px-2 py-1.5 text-center text-[11.5px] font-semibold transition-colors ${
            value === opt.v ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Real, existing location routes — same pattern the rest of the page already
// uses (e.g. DateTimeSearchPanel's `${basePath}/${citySlug}`), nothing invented.
const POPULAR_TRANSPORT_SEARCHES = [
  { label: 'Delhi to Mumbai Truck', href: '/transporter/delhi' },
  { label: 'Tempo Traveller in Delhi', href: '/bus-rental/delhi' },
  { label: 'Packers and Movers Bangalore', href: '/packers-and-movers/bangalore' },
  { label: '14 Wheeler Truck Kolkata', href: '/transporter/kolkata' },
  { label: 'Light Commercial Vehicles', href: '/transporter' },
];

const TRANSPORT_TABS = [
  { key: 'bike', label: 'Bike', icon: Bike, basePath: '/bike-on-rent', fleetSegment: 'bikes' as string | null, needsTo: false, hasTruckFields: false, hasDateTimeFields: true, hasEquipmentFields: false, image: '/images/tabs/bike-tab.png' },
  { key: 'self-drive', label: 'Self Drive Car', icon: Key, basePath: '/self-drive-car-rentals', fleetSegment: 'cars' as string | null, needsTo: false, hasTruckFields: false, hasDateTimeFields: true, hasEquipmentFields: false, image: '/images/tabs/self-drive-tab.png' },
  { key: 'car', label: 'Car', icon: Car, basePath: '/car-rental', fleetSegment: null as string | null, needsTo: false, hasTruckFields: false, hasDateTimeFields: false, hasEquipmentFields: false, image: '/images/tabs/car-rental-tab.png', imageScale: 1.2 },
  { key: 'bus', label: 'Bus', icon: Bus, basePath: '/bus-rental', fleetSegment: null as string | null, needsTo: true, hasTruckFields: false, hasDateTimeFields: false, hasEquipmentFields: false, image: '/images/tabs/bus-tab.png' },
  { key: 'truck', label: 'Truck', icon: Truck, basePath: '/transporter', fleetSegment: null as string | null, needsTo: true, hasTruckFields: true, hasDateTimeFields: false, hasEquipmentFields: false, image: '/images/tabs/truck-tab.png' },
  { key: 'packers', label: 'Packers & Movers', icon: Package, basePath: '/packers-and-movers', fleetSegment: null as string | null, needsTo: true, hasTruckFields: false, hasDateTimeFields: false, hasEquipmentFields: false, image: '/images/tabs/packers-tab.png' },
  { key: 'equipment', label: 'Equipment', icon: Wrench, basePath: '/equipment-rental', fleetSegment: null as string | null, needsTo: false, hasTruckFields: false, hasDateTimeFields: false, hasEquipmentFields: true, image: '/images/tabs/equipment-tab.png' },
];

// ─────────────────────────────────────────────────────────────────────────
// Section 3 — full-bleed "One Request. Multiple Quotes. Best Price
// Guaranteed." hero, matching the reference design 1:1: badge, headline,
// trust row, floating reviews card, a 6-way vehicle-type tab switcher and a
// single-row quick-search bar per tab. Each tab routes to the REAL existing
// location page for that category (same href convention as CATEGORIES
// elsewhere on this page) with the picked options passed as query params —
// there's no single shared "instant quote" API across all 6 categories, so
// this hands off to the real per-category flow instead of faking one.
// Today as YYYY-MM-DD using the *local* calendar date — toISOString() would
// convert to UTC first, silently shifting the date back a day for timezones
// ahead of UTC (e.g. IST) during early-morning hours.
function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function TransportSearchHero({ locations, variant = 'hero' }: { locations: Location[]; variant?: 'hero' | 'compact' }) {
  const todayDateStr = getTodayLocalDateString();
  const router = useRouter();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState(TRANSPORT_TABS[0]);
  const [hoveredTabKey, setHoveredTabKey] = useState<string | null>(null);
  const [fromCity, setFromCity] = useState<Location | null>(null);
  const [toCity, setToCity] = useState<Location | null>(null);
  const [loadType, setLoadType] = useState('');
  const [truckType, setTruckType] = useState('');
  const [date, setDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');

  // A same-day booking has to run at least MIN_SAME_DAY_HOURS: pick up at
  // 10:00 and the earliest drop-off is 14:00. On a later date there is no
  // constraint, and if pickup is late enough that the minimum spills past
  // midnight the same-day option is simply not offered.
  const sameDayReturn = !!date && !!dropoffDate && date === dropoffDate;
  const minDropoffTime = sameDayReturn && pickupTime
    ? addHoursToSlot(pickupTime, MIN_SAME_DAY_HOURS)
    : null;

  // Changing the pickup time can leave an already-chosen drop-off too early.
  // Clear it rather than silently submitting a window we would reject.
  useEffect(() => {
    if (minDropoffTime && dropoffTime && dropoffTime < minDropoffTime) {
      setDropoffTime('');
    }
  }, [minDropoffTime, dropoffTime]);
  const [equipmentType, setEquipmentType] = useState('');
  // Car tab mirrors the real /car-rental/[city] hero's own 3-way Local /
  // Outstation / Airport switch — each mode has its own field set.
  const [carSubTab, setCarSubTab] = useState<'local' | 'outstation' | 'airport'>('local');
  const [carPackage, setCarPackage] = useState<'4' | '8' | '12'>('8');
  const [carTripMode, setCarTripMode] = useState<'oneway' | 'roundtrip'>('oneway');
  const [viaCities, setViaCities] = useState<Array<Location | null>>([null]);
  const [airportMode, setAirportMode] = useState<'from' | 'to'>('from');
  const [selectedAirport, setSelectedAirport] = useState<AirportOption | null>(null);
  const [airports, setAirports] = useState<AirportOption[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(false);
  // Bus tab mirrors the real /bus-rental "Book Your Bus" widget's Trip +
  // Journey steps (pickup/drop address, return date, passenger count).
  const [busTripType, setBusTripType] = useState<'outstation' | 'local'>('outstation');
  const [busStep, setBusStep] = useState<1 | 2>(1);
  const [busSubmitting, setBusSubmitting] = useState(false);
  const [truckSubmitting, setTruckSubmitting] = useState(false);
  const [packersSubmitting, setPackersSubmitting] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [busPassengers, setBusPassengers] = useState(10);
  // Packers & Movers tab mirrors the real /packers-and-movers "Get Free
  // Quotes" wizard — Move / Pickup / Drop / Schedule / Goods / Services steps
  // (same fields as PackersMoversServiceHero.tsx); Contact stays out of scope
  // since it's lead-capture, not search criteria.
  const [packersStep, setPackersStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [packersScope, setPackersScope] = useState<'LOCAL' | 'DOMESTIC' | 'INTERCITY'>('LOCAL');
  const [packersType, setPackersType] = useState<'Home' | 'Office' | 'Vehicle'>('Home');
  const [packersHomeSize, setPackersHomeSize] = useState<'BHK_1' | 'BHK_2' | 'BHK_3' | 'BHK_4' | 'VILLA' | 'STUDIO'>('BHK_2');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupFloor, setPickupFloor] = useState('');
  const [pickupLift, setPickupLift] = useState<boolean | null>(null);
  const [dropPincode, setDropPincode] = useState('');
  const [dropFloor, setDropFloor] = useState('');
  const [dropLift, setDropLift] = useState<boolean | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [inventoryExtra, setInventoryExtra] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [hasHeavyItems, setHasHeavyItems] = useState<boolean | null>(null);
  const [heavyItemsDesc, setHeavyItemsDesc] = useState('');
  const [hasFragileItems, setHasFragileItems] = useState<boolean | null>(null);
  const [fragileItemsDesc, setFragileItemsDesc] = useState('');
  const [needPacking, setNeedPacking] = useState<boolean | null>(null);
  const [needLoading, setNeedLoading] = useState<boolean | null>(null);
  const [needUnloading, setNeedUnloading] = useState<boolean | null>(null);
  const [labourCount, setLabourCount] = useState('');
  const [vehicleTypeReq, setVehicleTypeReq] = useState<'SHARED' | 'DEDICATED'>('DEDICATED');
  const [partLoad, setPartLoad] = useState<boolean | null>(null);
  const [needInsurance, setNeedInsurance] = useState<boolean | null>(null);
  const [insuranceValue, setInsuranceValue] = useState('');
  const [requiresPod, setRequiresPod] = useState<boolean | null>(null);
  const [multipleStops, setMultipleStops] = useState<boolean | null>(null);
  const [multipleStopsDesc, setMultipleStopsDesc] = useState('');
  // Equipment tab mirrors the real /equipment-rental "Book Your Equipment"
  // wizard's Equipment + Schedule steps (Contact stays out of scope).
  const [equipmentStep, setEquipmentStep] = useState<1 | 2>(1);
  const [rentalDuration, setRentalDuration] = useState('1');
  const [equipmentQty, setEquipmentQty] = useState(1);
  // Vendors price operator/delivery/installation separately and only show the
  // matching charge field on their quote form when the request asks for it —
  // same three flags the real EquipmentBookingWidget collects.
  const [needOperator, setNeedOperator] = useState(false);
  const [needDelivery, setNeedDelivery] = useState(true);
  const [needInstallation, setNeedInstallation] = useState(false);
  const [equipmentSubmitting, setEquipmentSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  // Car "Get Quotes Now" opens package/vehicle pricing in a modal (same
  // results screen as /car-rental/[city]) instead of navigating away.
  const [carQuoteModal, setCarQuoteModal] = useState<{ city: string; citySlug: string; params: Record<string, string> } | null>(null);

  useEffect(() => {
    setToCity(null); setLoadType(''); setTruckType('');
    setPickupTime(''); setDropoffDate(''); setDropoffTime(''); setEquipmentType('');
    setCarSubTab('local'); setCarPackage('8'); setCarTripMode('oneway');
    setViaCities([null]); setAirportMode('from'); setSelectedAirport(null);
    setBusTripType('outstation'); setBusStep(1); setPickupAddress(''); setDropAddress(''); setBusPassengers(10);
    setPackersStep(1); setPackersScope('LOCAL'); setPackersType('Home'); setPackersHomeSize('BHK_2');
    setPickupPincode(''); setPickupFloor(''); setPickupLift(null);
    setDropPincode(''); setDropFloor(''); setDropLift(null);
    setExpectedDeliveryDate(''); setItemCounts({}); setInventoryExtra(''); setEstimatedWeight('');
    setHasHeavyItems(null); setHeavyItemsDesc(''); setHasFragileItems(null); setFragileItemsDesc('');
    setNeedPacking(null); setNeedLoading(null); setNeedUnloading(null); setLabourCount('');
    setVehicleTypeReq('DEDICATED'); setPartLoad(null); setNeedInsurance(null); setInsuranceValue('');
    setRequiresPod(null); setMultipleStops(null); setMultipleStopsDesc('');
    setEquipmentStep(1); setRentalDuration('1'); setEquipmentQty(1);
    setFormError('');
  }, [activeTab.key]);

  useEffect(() => {
    setToCity(null); setViaCities([null]); setSelectedAirport(null); setFormError('');
  }, [carSubTab]);

  // Real airport list — same /api/airports the real CarRentalBookingHero's
  // airport tab uses — fetched lazily only when that mode is opened.
  useEffect(() => {
    if (activeTab.key !== 'car' || carSubTab !== 'airport' || airports.length > 0 || airportsLoading) return;
    setAirportsLoading(true);
    fetch('/api/airports')
      .then((res) => res.json())
      .then((data) => { if (data.success) setAirports(data.airports); })
      .catch(() => {})
      .finally(() => setAirportsLoading(false));
  }, [activeTab.key, carSubTab, airports.length, airportsLoading]);

  const handleSearch = () => {
    if (activeTab.key === 'car') {
      if (carSubTab === 'airport') {
        if (!selectedAirport) { setFormError('Please select an airport'); return; }
        if (!fromCity) { setFormError(airportMode === 'from' ? 'Please select a drop location' : 'Please select a pickup location'); return; }
      } else {
        if (!fromCity) { setFormError('Please select a pickup city'); return; }
        if (carSubTab === 'outstation' && !toCity) { setFormError('Please select a destination city'); return; }
      }
      if (!date) { setFormError('Please select a pickup date'); return; }
      setFormError('');

      const citySlug = carSubTab === 'airport'
        ? (selectedAirport!.citySlug || fromCity!.slug || fromCity!.name.toLowerCase().replace(/\s+/g, '-'))
        : (fromCity!.slug || fromCity!.name.toLowerCase().replace(/\s+/g, '-'));
      const cityName = carSubTab === 'airport' ? (selectedAirport!.city || fromCity!.name) : fromCity!.name;

      const params: Record<string, string> = { tripType: carSubTab };
      if (carSubTab === 'local') params.package = carPackage === '4' ? '4hrs-40km' : carPackage === '12' ? '12hrs-120km' : '8hrs-80km';
      if (carSubTab === 'outstation') {
        params.mode = carTripMode;
        if (toCity) params.to = toCity.name;
        const viaNames = viaCities.filter((c): c is Location => !!c).map((c) => c.name);
        if (viaNames.length) params.via = viaNames.join('|');
        if (carTripMode === 'roundtrip' && dropoffDate) params.returnDate = dropoffDate;
      }
      if (carSubTab === 'airport') {
        params.airportMode = airportMode;
        if (selectedAirport) params.airport = selectedAirport.code;
        if (fromCity) params[airportMode === 'from' ? 'dropLocation' : 'pickupLocation'] = fromCity.name;
      }
      params.date = date;
      if (pickupTime) params.pickupTime = pickupTime;

      setCarQuoteModal({ city: cityName, citySlug, params });
      return;
    }

    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (activeTab.needsTo && !toCity) { setFormError('Please select a destination city'); return; }
    if (activeTab.hasEquipmentFields && !equipmentType) { setFormError('Please select equipment type'); return; }
    setFormError('');

    const slug = fromCity.slug || fromCity.name.toLowerCase().replace(/\s+/g, '-');
    const path = activeTab.fleetSegment
      ? `${activeTab.basePath}/${slug}/${activeTab.fleetSegment}`
      : `${activeTab.basePath}/${slug}`;

    const params = new URLSearchParams();
    if (toCity) params.set('to', toCity.name);
    if (activeTab.key === 'bus') {
      params.set('tripType', busTripType);
      if (pickupAddress) params.set('pickupAddress', pickupAddress);
      if (dropAddress) params.set('dropAddress', dropAddress);
      if (dropoffDate) params.set('returnDate', dropoffDate);
      params.set('passengers', String(busPassengers));
    }
    if (activeTab.key === 'packers') {
      params.set('scope', packersScope);
      params.set('shiftingType', packersType);
      if (packersType === 'Home') params.set('homeSize', packersHomeSize);
      if (pickupAddress) params.set('pickupAddress', pickupAddress);
      if (pickupPincode) params.set('pickupPincode', pickupPincode);
      if (pickupFloor) params.set('pickupFloor', pickupFloor);
      if (pickupLift !== null) params.set('pickupLift', String(pickupLift));
      if (dropAddress) params.set('dropAddress', dropAddress);
      if (dropPincode) params.set('dropPincode', dropPincode);
      if (dropFloor) params.set('dropFloor', dropFloor);
      if (dropLift !== null) params.set('dropLift', String(dropLift));
      if (pickupTime) params.set('pickupTime', pickupTime);
      if (expectedDeliveryDate) params.set('expectedDeliveryDate', expectedDeliveryDate);
      const inventoryList = INVENTORY_ITEMS.filter((i) => (itemCounts[i.key] || 0) > 0)
        .map((i) => `${itemCounts[i.key]} ${i.label}`).join(', ');
      if (inventoryList) params.set('inventory', inventoryList);
      if (inventoryExtra) params.set('inventoryExtra', inventoryExtra);
      if (estimatedWeight) params.set('estimatedWeight', estimatedWeight);
      if (hasHeavyItems !== null) params.set('hasHeavyItems', String(hasHeavyItems));
      if (heavyItemsDesc) params.set('heavyItemsDesc', heavyItemsDesc);
      if (hasFragileItems !== null) params.set('hasFragileItems', String(hasFragileItems));
      if (fragileItemsDesc) params.set('fragileItemsDesc', fragileItemsDesc);
      if (needPacking !== null) params.set('needPacking', String(needPacking));
      if (needLoading !== null) params.set('needLoading', String(needLoading));
      if (needUnloading !== null) params.set('needUnloading', String(needUnloading));
      if (labourCount) params.set('labourCount', labourCount);
      params.set('vehicleTypeReq', vehicleTypeReq);
      if (partLoad !== null) params.set('partLoad', String(partLoad));
      if (needInsurance !== null) params.set('needInsurance', String(needInsurance));
      if (insuranceValue) params.set('insuranceValue', insuranceValue);
      if (requiresPod !== null) params.set('requiresPod', String(requiresPod));
      if (multipleStops !== null) params.set('multipleStops', String(multipleStops));
      if (multipleStopsDesc) params.set('multipleStopsDesc', multipleStopsDesc);
    }
    if (activeTab.hasTruckFields) {
      if (loadType) params.set('loadType', loadType);
      if (truckType) params.set('truckType', truckType);
    }
    if (activeTab.hasEquipmentFields && equipmentType) params.set('equipmentType', equipmentType);
    if (activeTab.hasEquipmentFields) {
      if (pickupAddress) params.set('pickupAddress', pickupAddress);
      params.set('rentalDuration', rentalDuration);
      params.set('quantity', String(equipmentQty));
    }
    // The real /bike-on-rent/[city]/bikes and /self-drive-car-rentals/[city]/cars
    // pages (CarSearchHero/BikeSearchHero) read exactly these 4 param names —
    // pickupDate/pickupTime/dropDate/dropTime — and redirect back to the hero
    // if any are missing, so the names here must match theirs exactly.
    if (activeTab.hasDateTimeFields) {
      if (date) params.set('pickupDate', date);
      if (pickupTime) params.set('pickupTime', pickupTime);
      if (dropoffDate) params.set('dropDate', dropoffDate);
      if (dropoffTime) params.set('dropTime', dropoffTime);
    } else if (date) {
      params.set('date', date);
    }

    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path);
  };

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const handleBusContinue = () => {
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!toCity) { setFormError('Please select a destination city'); return; }
    setFormError('');
    setBusStep(2);
  };

  // Unlike the other tabs' shared handleSearch (which just navigates to the
  // service landing page), Bus actually submits a quote request — same
  // POST /api/bus-quote-requests the real /bus-rental widget uses — and
  // sends the customer to their dashboard to track it, since that's where
  // vendor quotes show up. Logged-out users are sent to log in first: the
  // dashboard (and this request) is tied to a customer account, and this
  // compact widget has no room for its own name/email/phone step.
  const handleBusSubmit = async () => {
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!toCity) { setFormError('Please select a destination city'); return; }
    if (!date) { setFormError('Please select a travel date'); return; }
    setFormError('');

    if (!isAuthenticated || !customer) {
      // Stash the trip so the bus-quotes list page can submit it for real
      // right after login instead of the customer landing on an empty list
      // wondering where their request went.
      sessionStorage.setItem('pendingBusQuote', JSON.stringify({
        tripType: busTripType,
        pickupCity: fromCity.name,
        pickupAddress: pickupAddress || undefined,
        dropCity: toCity.name,
        dropAddress: dropAddress || undefined,
        pickupDate: date,
        pickupTime: pickupTime || undefined,
        returnDate: dropoffDate || undefined,
        passengers: busPassengers,
      }));
      router.push(`/customer/login?redirect=${encodeURIComponent('/customer/bus-quotes')}`);
      return;
    }

    setBusSubmitting(true);
    try {
      const res = await fetch('/api/bus-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          tripType: busTripType,
          pickupCity: fromCity.name,
          pickupAddress: pickupAddress || undefined,
          dropCity: toCity.name,
          dropAddress: dropAddress || undefined,
          pickupDate: date,
          pickupTime: pickupTime || undefined,
          returnDate: dropoffDate || undefined,
          passengers: busPassengers,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/customer/bus-quotes/${data.quoteRequest.id}`);
      } else {
        setFormError(data.error || 'Could not submit your request. Please try again.');
        setBusSubmitting(false);
      }
    } catch {
      setFormError('Network error. Please try again.');
      setBusSubmitting(false);
    }
  };

  // Same pattern as handleBusSubmit above, ported to Truck: submits a real
  // quote request (POST /api/truck-quote-requests) instead of navigating to
  // /transporter/{city}, and sends the customer to their truck-quotes
  // dashboard. vehicle_category and goodsType are hard-required by that
  // API, so truckType/loadType (already collected below) double as those.
  const handleTruckSubmit = async () => {
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!toCity) { setFormError('Please select a destination city'); return; }
    if (!date) { setFormError('Please select a pickup date'); return; }
    if (!truckType) { setFormError('Please select a truck type'); return; }
    if (!loadType) { setFormError('Please select the load type'); return; }
    setFormError('');

    if (!isAuthenticated || !customer) {
      sessionStorage.setItem('pendingTruckQuote', JSON.stringify({
        pickupCity: fromCity.name,
        pickupAddress: pickupAddress || undefined,
        dropCity: toCity.name,
        dropAddress: dropAddress || undefined,
        pickupDate: date,
        vehicle_category: truckType,
        vehicleCategoryName: truckType,
        goodsType: loadType,
      }));
      router.push(`/customer/login?redirect=${encodeURIComponent('/customer/truck-quotes')}`);
      return;
    }

    setTruckSubmitting(true);
    try {
      const res = await fetch('/api/truck-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          pickupCity: fromCity.name,
          pickupAddress: pickupAddress || undefined,
          dropCity: toCity.name,
          dropAddress: dropAddress || undefined,
          pickupDate: date,
          vehicle_category: truckType,
          vehicleCategoryName: truckType,
          goodsType: loadType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/customer/truck-quotes/${data.quoteRequest.id}`);
      } else {
        setFormError(data.error || 'Could not submit your request. Please try again.');
        setTruckSubmitting(false);
      }
    } catch {
      setFormError('Network error. Please try again.');
      setTruckSubmitting(false);
    }
  };

  const handlePackersStep3Continue = () => {
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    setFormError('');
    setPackersStep(4);
  };

  const handlePackersStep4Continue = () => {
    if (!toCity) { setFormError('Please select a destination city'); return; }
    setFormError('');
    setPackersStep(5);
  };

  // Packers has no dedicated quote-request API like bus/truck — the real
  // PackersMoversServiceHero submits through the generic POST /api/bookings
  // envelope ({bookingType, customerInfo, bookingData}), which is what
  // actually persists the rich packers_quote_requests row. The dedicated
  // /api/packers-quote-requests route exists but silently drops most of the
  // Step 6/7 fields collected below, so we mirror the real form instead.
  const handlePackersSubmit = async () => {
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!pickupAddress) { setFormError('Please enter the pickup address'); return; }
    if (!toCity) { setFormError('Please select a destination city'); return; }
    if (!dropAddress) { setFormError('Please enter the drop address'); return; }
    if (!date) { setFormError('Please select a shift date'); return; }
    setFormError('');

    const inventoryList = INVENTORY_ITEMS.filter((i) => (itemCounts[i.key] || 0) > 0)
      .map((i) => `${itemCounts[i.key]} ${i.label}`).join(', ');
    const bookingType = packersType === 'Office' ? 'packers-office' : packersType === 'Vehicle' ? 'packers-vehicle' : 'packers-home';
    const bookingData = {
      shifting_type: packersType,
      shifting_scope: packersScope,
      home_shifting: packersType === 'Home' ? packersHomeSize : undefined,
      location_name: fromCity.name,
      pickup_full_address: pickupAddress,
      pickup_pincode: pickupPincode || undefined,
      pickup_floor: pickupFloor || undefined,
      has_pickup_lift: pickupLift,
      destination: toCity.name,
      destination_full_address: dropAddress,
      drop_pincode: dropPincode || undefined,
      drop_floor: dropFloor || undefined,
      has_drop_lift: dropLift,
      journey_datetime: `${date} ${pickupTime || '09:00'}:00`,
      expected_delivery_date: expectedDeliveryDate || undefined,
      inventory_list: inventoryList || undefined,
      estimated_weight: estimatedWeight || undefined,
      has_heavy_items: hasHeavyItems,
      heavy_items_desc: heavyItemsDesc || undefined,
      has_fragile_items: hasFragileItems,
      fragile_items_desc: fragileItemsDesc || undefined,
      need_packing: needPacking,
      need_loading: needLoading,
      need_unloading: needUnloading,
      labour_count: labourCount || undefined,
      vehicle_type_req: vehicleTypeReq,
      part_load_accepted: partLoad,
      need_insurance: needInsurance,
      insurance_value: insuranceValue || undefined,
      requires_pod: requiresPod,
      has_multiple_stops: multipleStops,
      multiple_stops_details: multipleStopsDesc || undefined,
      other_info: inventoryExtra || undefined,
    };

    if (!isAuthenticated || !customer) {
      sessionStorage.setItem('pendingPackersQuote', JSON.stringify({ bookingType, bookingData }));
      router.push(`/customer/login?redirect=${encodeURIComponent('/customer/packers-quotes')}`);
      return;
    }

    setPackersSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType,
          customerInfo: { name: customer.name, phone: customer.phone, email: customer.email },
          bookingData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/customer/packers-quotes/${data.request_id || data.booking_id}`);
      } else {
        setFormError(data.error || data.message || 'Could not submit your request. Please try again.');
        setPackersSubmitting(false);
      }
    } catch {
      setFormError('Network error. Please try again.');
      setPackersSubmitting(false);
    }
  };

  const handleEquipmentStep1Continue = () => {
    if (!equipmentType) { setFormError('Please select equipment type'); return; }
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!pickupAddress) { setFormError('Please enter the pickup address'); return; }
    setFormError('');
    setEquipmentStep(2);
  };

  // Duration presets → {rentalDuration, days} — identical to EQUIPMENT_DURATIONS
  // in ServiceHeroWithChat.tsx's EquipmentBookingWidget, so quote requests from
  // this tab price out the same way as the real equipment-rental page.
  const EQUIPMENT_DURATION_DAYS: Record<string, { rentalDuration: string; days: number }> = {
    '1': { rentalDuration: 'daily', days: 3 },
    '2': { rentalDuration: 'weekly', days: 10 },
    '3': { rentalDuration: 'monthly', days: 20 },
    '4': { rentalDuration: 'custom', days: 45 },
  };

  // Same pattern as handleBusSubmit/handleTruckSubmit/handlePackersSubmit:
  // submits a real quote request (POST /api/equipment-quote-requests, the
  // same API EquipmentBookingWidget uses) instead of navigating to
  // /equipment-rental/{city}, and sends the customer to their dashboard.
  const handleEquipmentSubmit = async () => {
    if (!equipmentType) { setFormError('Please select equipment type'); return; }
    if (!fromCity) { setFormError('Please select a pickup city'); return; }
    if (!pickupAddress) { setFormError('Please enter the pickup address'); return; }
    if (!date) { setFormError('Please select a start date'); return; }
    setFormError('');

    const duration = EQUIPMENT_DURATION_DAYS[rentalDuration] || EQUIPMENT_DURATION_DAYS['1'];
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + duration.days - 1);

    const tripFields = {
      equipmentCategory: equipmentType,
      equipmentType,
      quantity: equipmentQty,
      rentalDuration: duration.rentalDuration,
      rentalDays: duration.days,
      deliveryCity: fromCity.name,
      deliveryAddress: pickupAddress,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      needOperator,
      needDelivery,
      needInstallation,
    };

    if (!isAuthenticated || !customer) {
      sessionStorage.setItem('pendingEquipmentQuote', JSON.stringify(tripFields));
      router.push(`/customer/login?redirect=${encodeURIComponent('/customer/equipment-quotes')}`);
      return;
    }

    setEquipmentSubmitting(true);
    try {
      const res = await fetch('/api/equipment-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripFields,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/customer/equipment-quotes/${data.quoteRequest.id}`);
      } else {
        setFormError(data.error || 'Could not submit your request. Please try again.');
        setEquipmentSubmitting(false);
      }
    } catch {
      setFormError('Network error. Please try again.');
      setEquipmentSubmitting(false);
    }
  };

  const HERO_AVATARS = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/45.jpg',
    'https://randomuser.me/api/portraits/men/76.jpg',
  ];
  const FOOTER_AVATARS = [
    'https://randomuser.me/api/portraits/men/12.jpg',
    'https://randomuser.me/api/portraits/women/24.jpg',
    'https://randomuser.me/api/portraits/men/56.jpg',
  ];

  return (
    <HeroVariantContext.Provider value={variant}>
    <section className={variant === 'compact' ? 'relative bg-slate-200/70 pb-8 pt-14 sm:pb-10 sm:pt-16' : 'relative bg-[#0b1420] pb-14 pt-16 text-white sm:pt-20'}>
      {variant === 'hero' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/categories/hero-fleet.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            style={{ objectPosition: 'center 30%' }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #0a1220 0%, rgba(10,18,32,.92) 22%, rgba(10,18,32,.55) 45%, rgba(10,18,32,.25) 62%, rgba(10,18,32,.65) 100%), linear-gradient(180deg, rgba(6,11,20,.35) 0%, rgba(6,11,20,.15) 35%, rgba(7,12,22,.65) 78%, #0a0f18 100%)',
            }}
          />
        </div>
      )}

      <div className={variant === 'compact' ? 'container mx-auto px-4' : 'container relative z-10 mx-auto px-4'}>
        {variant === 'hero' && (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/90">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
              THE MOBILITY TRAVEL MARKETPLACE
            </span>

            <div className="mb-14 mt-7 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-start">
              <div>
                <h2 className="max-w-2xl font-heading text-2xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Everything You Need to<br />
                  <span className="text-primary-400">Ride, Move &amp; Travel.</span>
                </h2>

                <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-300">
                  Rent vehicles. Book tours &amp; trips. Find trusted rental providers. Or grow your mobility business — all from one place.
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2.5 rounded-2xl border border-white/[0.18] bg-slate-900/70 px-4 py-3 backdrop-blur-sm sm:w-fit sm:shrink-0 sm:flex-nowrap sm:gap-3.5 sm:px-5 sm:py-4">
                <div className="flex shrink-0">
                  {HERO_AVATARS.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className={`h-9 w-9 rounded-full border-2 border-[#16202f] object-cover ${i > 0 ? '-ml-2.5' : ''}`} />
                  ))}
                </div>
                <div className="shrink-0 border-r border-white/[0.18] pr-4">
                  <div className="flex items-center gap-1.5 text-[15px] font-bold text-white">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.8/5
                  </div>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400">From 20,000+ reviews</p>
                </div>
                <p className="w-full text-[13px] font-medium text-slate-200 sm:w-auto sm:whitespace-nowrap">Trusted by Thousands of Customers</p>
              </div>
            </div>
          </>
        )}

        {/* Search panel */}
        <div className="flex flex-col items-stretch">
          {variant === 'compact' ? (
            <div className="rounded-2xl bg-white px-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)] sm:px-6">
              <div className="flex items-end gap-10 overflow-x-auto overflow-y-visible px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TRANSPORT_TABS.map((tab) => {
                  const active = activeTab.key === tab.key;
                  const hovered = hoveredTabKey === tab.key;
                  // Every tab reserves the SAME fixed 192px of layout height (enough for
                  // the largest image at its biggest active scale) — identical for every
                  // tab, in both states, all the time. That's what actually keeps the
                  // button height and label position 100% still: nothing here ever
                  // depends on `active`. The circle badge is a separate, always-64px
                  // decorative layer. Only the image's transform (pure paint, no layout
                  // effect) animates its visual size within that fixed space — hover
                  // adds a bit of extra height on top of the resting scale, nothing else.
                  const baseScale = (active ? 1.5 : 1.15) * (tab.imageScale ?? 1);
                  const scale = hovered ? baseScale * 1.15 : baseScale;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      onMouseEnter={() => setHoveredTabKey(tab.key)}
                      onMouseLeave={() => setHoveredTabKey((k) => (k === tab.key ? null : k))}
                      className={`flex shrink-0 flex-col items-center border-b-2 px-1 py-2 text-[15px] font-semibold transition-colors ${
                        active ? 'border-primary text-primary-700' : 'border-transparent text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="relative flex h-32 w-16 shrink-0 items-center justify-center">
                        <div className="absolute h-16 w-16 rounded-full bg-primary-50" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tab.image}
                          alt={tab.label}
                          className="relative h-16 w-auto origin-center transform-gpu object-contain transition-transform duration-300 ease-out"
                          style={{ transform: `scale(${scale})` }}
                        />
                      </div>
                      <span className="mt-1 whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="ml-1 w-fit max-w-full overflow-x-auto rounded-xl bg-white px-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:ml-5 sm:rounded-t-lg sm:rounded-b-none sm:px-6 [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-1">
                {TRANSPORT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab.key === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`mt-2 flex shrink-0 items-center gap-1.5 rounded-lg border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                        active ? 'border-primary bg-primary-50 text-primary-700' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={variant === 'compact' ? 'mt-4 rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] sm:mt-5' : 'rounded-2xl bg-white shadow-[0_16px_34px_rgba(0,0,0,0.28)]'}>
            {activeTab.key === 'car' && (
              <div className="flex flex-wrap gap-2 px-3.5 pt-3.5 sm:px-5 sm:pt-5">
                {(['local', 'outstation', 'airport'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCarSubTab(mode)}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      carSubTab === mode
                        ? 'border-primary bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'airport' && <Plane className="h-3 w-3" />}
                    {mode === 'local' ? 'Local' : mode === 'outstation' ? 'Outstation' : 'Airport'}
                  </button>
                ))}
              </div>
            )}

            {activeTab.key === 'bus' && (
              <div className="flex flex-wrap gap-2 px-3.5 pt-3.5 sm:px-5 sm:pt-5">
                {(['outstation', 'local'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusTripType(t)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      busTripType === t
                        ? 'border-primary bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {t === 'outstation' ? 'Outstation' : 'Local City'}
                  </button>
                ))}
              </div>
            )}

            <div className={`flex flex-wrap items-stretch gap-2.5 p-3 sm:gap-4 sm:p-8 ${activeTab.key === 'car' || activeTab.key === 'bus' || activeTab.key === 'truck' || activeTab.key === 'packers' || activeTab.key === 'equipment' || activeTab.hasDateTimeFields ? '' : 'md:flex-nowrap'}`}>
              {activeTab.key === 'car' ? (
                <>
                  {carSubTab === 'local' && (
                    <>
                      <MiniCityInput
                        label="City"
                        placeholder="Enter city"
                        caption="Pickup & drop city"
                        locations={locations}
                        value={fromCity?.name ?? ''}
                        onSelect={setFromCity}
                      />
                      <div className="min-w-[170px] sm:min-w-[260px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className={`mb-1.5 block text-[11.5px] sm:text-[13px] font-bold ${variant === 'compact' ? 'text-slate-900' : 'text-slate-500'}`}>Select Package</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['4', '8', '12'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCarPackage(p)}
                              className={`rounded-md border px-1.5 py-1.5 text-center leading-tight transition-colors ${
                                carPackage === p ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                              }`}
                            >
                              <div className="text-[12px] font-bold">{p}h</div>
                              <div className="text-[10px]">{Number(p) * 10}km</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {carSubTab === 'outstation' && (
                    <>
                      <div className="flex basis-full gap-2">
                        {(['oneway', 'roundtrip'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCarTripMode(m)}
                            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                              carTripMode === m
                                ? 'border-primary bg-primary-50 text-primary-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            {m === 'oneway' ? <ArrowRight className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}
                            {m === 'oneway' ? 'One Way' : 'Round Trip'}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-1 flex-wrap basis-[420px] items-stretch gap-2.5">
                        <MiniCityInput
                          label="From"
                          placeholder="Enter pickup location"
                          caption="Pickup city"
                          locations={locations}
                          value={fromCity?.name ?? ''}
                          onSelect={setFromCity}
                        />
                        <button
                          type="button"
                          onClick={swapCities}
                          aria-label="Swap pickup and destination"
                          className="relative z-10 my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                        </button>
                        <div className="relative min-w-[120px] sm:min-w-[182px] flex-1">
                          <MiniCityInput
                            label="To"
                            placeholder="Enter delivery location"
                            caption="Delivery city"
                            locations={locations}
                            value={toCity?.name ?? ''}
                            onSelect={setToCity}
                            fromLocation={fromCity}
                          />
                          {fromCity && (
                            <button
                              type="button"
                              onClick={() => setToCity(fromCity)}
                              className="absolute right-3 top-3.5 z-10 text-[10.5px] font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
                            >
                              Same as pickup
                            </button>
                          )}
                        </div>
                      </div>

                      {viaCities.map((via, idx) => (
                        <div key={idx} className="relative min-w-[120px] sm:min-w-[182px] flex-1">
                          <MiniCityInput
                            label={`Via ${viaCities.length > 1 ? idx + 1 : ''}`.trim()}
                            placeholder="Stop city"
                            caption="Add a stop"
                            locations={locations}
                            value={via?.name ?? ''}
                            onSelect={(loc) =>
                              setViaCities((prev) => prev.map((c, i) => (i === idx ? loc : c)))
                            }
                            fromLocation={idx === 0 ? fromCity : viaCities[idx - 1]}
                          />
                          {viaCities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setViaCities((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label="Remove stop"
                              className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setViaCities((prev) => [...prev, null])}
                        aria-label="Add another stop"
                        title="Add another stop"
                        className="my-auto flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full border border-dashed border-primary-300 bg-white text-primary-600 transition-colors hover:border-primary hover:bg-primary-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {carSubTab === 'airport' && (
                    <>
                      <div className="flex basis-full gap-2">
                        {(['from', 'to'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setAirportMode(m)}
                            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                              airportMode === m
                                ? 'border-primary bg-primary-50 text-primary-700'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <Plane className={`h-3 w-3 ${m === 'to' ? 'rotate-45' : ''}`} />
                            {m === 'from' ? 'From Airport' : 'To Airport'}
                          </button>
                        ))}
                      </div>

                      <MiniAirportInput
                        label={airportMode === 'from' ? 'Pickup Airport' : 'Drop Airport'}
                        placeholder="Search airport by name or code..."
                        caption={selectedAirport?.city ?? undefined}
                        airports={airports}
                        value={selectedAirport?.displayName ?? ''}
                        onSelect={setSelectedAirport}
                        loading={airportsLoading}
                      />
                      <MiniCityInput
                        label={airportMode === 'from' ? 'Drop Location' : 'Pickup Location'}
                        placeholder="Enter city"
                        caption={airportMode === 'from' ? 'Drop city' : 'Pickup city'}
                        locations={locations}
                        value={fromCity?.name ?? ''}
                        onSelect={setFromCity}
                      />
                    </>
                  )}

                  <MiniDateInput
                    label={carSubTab === 'airport' ? (airportMode === 'from' ? 'Flight Arrival' : 'Pickup Date') : 'Pickup Date'}
                    value={date}
                    onChange={setDate}
                    min={todayDateStr}
                    caption="Journey date"
                    boxClassName="min-w-[125px] sm:min-w-[190px] flex-1"
                  />

                  {carSubTab === 'outstation' && carTripMode === 'roundtrip' && (
                    <MiniDateInput
                      label="Return Date"
                      value={dropoffDate}
                      onChange={setDropoffDate}
                      min={date || todayDateStr}
                      caption="Return date"
                      boxClassName="min-w-[125px] sm:min-w-[190px] flex-1"
                    />
                  )}

                  <MiniTimeInput
                    label={carSubTab === 'airport' ? (airportMode === 'from' ? 'Arrival Time' : 'Pickup Time') : 'Pickup Time'}
                    value={pickupTime}
                    onChange={setPickupTime}
                    caption="Pickup time"
                    boxClassName="min-w-[112px] sm:min-w-[172px] flex-1"
                  />
                </>
              ) : activeTab.key === 'bus' ? (
                busStep === 1 ? (
                  <>
                    <div className="flex min-w-0 flex-1 flex-wrap basis-[260px] items-stretch gap-2.5">
                      <MiniCityInput
                        label="From"
                        placeholder="Enter pickup location"
                        caption="Pickup city"
                        locations={locations}
                        value={fromCity?.name ?? ''}
                        onSelect={setFromCity}
                      />
                      <button
                        type="button"
                        onClick={swapCities}
                        aria-label="Swap pickup and destination"
                        className="relative z-10 my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary hover:text-primary"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                      </button>
                      <MiniCityInput
                        label="To"
                        placeholder="Enter delivery location"
                        caption="Delivery city"
                        locations={locations}
                        value={toCity?.name ?? ''}
                        onSelect={setToCity}
                      />
                    </div>
                    <div className="min-w-[153px] sm:min-w-[235px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-primary-700" /> Pickup Address
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Landmark or address (optional)"
                        className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                    </div>
                    <div className="min-w-[153px] sm:min-w-[235px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-primary-700" /> Drop Address
                      </label>
                      <input
                        type="text"
                        value={dropAddress}
                        onChange={(e) => setDropAddress(e.target.value)}
                        placeholder="Landmark or address (optional)"
                        className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 sm:ml-1">
                      <button
                        type="button"
                        onClick={handleBusContinue}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                      <span className="whitespace-nowrap text-[12.5px] text-slate-400">Step 1 of 2 — trip details</span>
                    </div>
                  </>
                ) : (
                  <>
                    <MiniDateInput
                      label="Journey Date"
                      value={date}
                      onChange={setDate}
                      min={todayDateStr}
                      caption="Travel date"
                      boxClassName="min-w-[127px] sm:min-w-[195px] flex-1"
                    />
                    <MiniDateInput
                      label="Return Date"
                      value={dropoffDate}
                      onChange={setDropoffDate}
                      min={date || todayDateStr}
                      caption="Optional"
                      boxClassName="min-w-[127px] sm:min-w-[195px] flex-1"
                    />
                    <MiniTimeInput
                      label="Pickup Time"
                      value={pickupTime}
                      onChange={setPickupTime}
                      caption="Pickup time"
                      boxClassName="min-w-[120px] sm:min-w-[182px] flex-1"
                    />
                    <div className="min-w-[153px] sm:min-w-[235px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <Users className="h-3 w-3 text-primary-700" /> Passengers
                      </label>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setBusPassengers((p) => Math.max(10, p - 1))}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={10}
                          max={60}
                          value={busPassengers}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n) && n >= 0) setBusPassengers(n);
                          }}
                          onBlur={() => setBusPassengers((p) => Math.min(60, Math.max(10, p || 10)))}
                          aria-label="Number of passengers"
                          className="w-12 shrink-0 border-none bg-transparent p-0 text-center text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setBusPassengers((p) => Math.min(60, p + 1))}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          +
                        </button>
                      </div>
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">{getBusVehicleReco(busPassengers)}</span>
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 sm:ml-1">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBusStep(1)}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleBusSubmit}
                          disabled={busSubmitting}
                          className="flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busSubmitting ? 'Submitting…' : 'Get Quotes Now'} <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                        {isAuthenticated ? "It’s free & hassle-free" : 'Log in to submit & track your request'}
                      </span>
                    </div>
                  </>
                )
              ) : activeTab.key === 'packers' ? (
                packersStep === 1 ? (
                  <div className="flex w-full flex-col gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Scope of Move</label>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { v: 'LOCAL', icon: MapPin, label: 'Local' },
                          { v: 'DOMESTIC', icon: ArrowLeftRight, label: 'Domestic' },
                          { v: 'INTERCITY', icon: Truck, label: 'Intercity' },
                        ] as const).map((opt) => {
                          const Icon = opt.icon;
                          const active = packersScope === opt.v;
                          return (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => setPackersScope(opt.v)}
                              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                active ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Icon className="h-3 w-3" /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Type of Shifting</label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {([
                            { v: 'Home', icon: Home, sub: 'Household' },
                            { v: 'Office', icon: Building2, sub: 'Office move' },
                            { v: 'Vehicle', icon: Car, sub: 'Car / Bike' },
                          ] as const).map((opt) => {
                            const Icon = opt.icon;
                            const active = packersType === opt.v;
                            return (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setPackersType(opt.v)}
                                className={`relative flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                                  active ? 'border-primary bg-primary-50 shadow-[0_4px_14px_rgba(9,179,104,0.16)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {active && (
                                  <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-white">
                                    <Check className="h-2 w-2" strokeWidth={3} />
                                  </span>
                                )}
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span>
                                  <span className={`block text-[12.5px] font-bold leading-tight ${active ? 'text-primary-700' : 'text-slate-700'}`}>{opt.v}</span>
                                  <span className="block text-[10px] leading-tight text-slate-400">{opt.sub}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPackersStep(packersType === 'Home' ? 2 : 3)}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : packersStep === 2 ? (
                  <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Home Size</label>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                        {([
                          { v: 'BHK_1', label: '1 BHK' },
                          { v: 'BHK_2', label: '2 BHK' },
                          { v: 'BHK_3', label: '3 BHK' },
                          { v: 'BHK_4', label: '4 BHK' },
                          { v: 'VILLA', label: 'Villa' },
                          { v: 'STUDIO', label: 'Studio' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setPackersHomeSize(opt.v)}
                            className={`rounded-lg border-2 px-1.5 py-2 text-center text-[11px] font-bold transition-all ${
                              packersHomeSize === opt.v
                                ? 'border-primary bg-primary-50 text-primary-700 shadow-[0_4px_14px_rgba(9,179,104,0.16)]'
                                : 'border-slate-100 bg-[#f0f1f3] text-slate-600 hover:border-slate-200 hover:bg-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-end gap-1.5">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(1)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setPackersStep(3)}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : packersStep === 3 ? (
                  <>
                    <MiniCityInput
                      label="Pickup City"
                      placeholder="Enter pickup location"
                      caption="Pickup city"
                      locations={locations}
                      value={fromCity?.name ?? ''}
                      onSelect={setFromCity}
                    />
                    <div className="w-full sm:w-auto sm:min-w-[235px] sm:flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-primary-700" /> Pickup Address
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Full pickup address"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                    </div>
                    <div className="min-w-[90px] sm:min-w-[100px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Pincode</label>
                      <input
                        type="tel"
                        maxLength={6}
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Optional</span>
                    </div>
                    <div className="min-w-[105px] sm:min-w-[90px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Floor No.</label>
                      <input
                        type="number"
                        min={0}
                        value={pickupFloor}
                        onChange={(e) => setPickupFloor(e.target.value)}
                        placeholder="0 = ground"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Optional</span>
                    </div>
                    <div className="min-w-[125px] sm:min-w-[190px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Lift at Pickup?</label>
                      <YesNoPill value={pickupLift} onChange={setPickupLift} />
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-end gap-1.5 sm:ml-1">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(packersType === 'Home' ? 2 : 1)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handlePackersStep3Continue}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : packersStep === 4 ? (
                  <>
                    <MiniCityInput
                      label="Destination City"
                      placeholder="Enter delivery location"
                      caption="Delivery city"
                      locations={locations}
                      value={toCity?.name ?? ''}
                      onSelect={setToCity}
                    />
                    <div className="w-full sm:w-auto sm:min-w-[235px] sm:flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-primary-700" /> Drop Address
                      </label>
                      <input
                        type="text"
                        value={dropAddress}
                        onChange={(e) => setDropAddress(e.target.value)}
                        placeholder="Full drop address"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                    </div>
                    <div className="min-w-[90px] sm:min-w-[100px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Pincode</label>
                      <input
                        type="tel"
                        maxLength={6}
                        value={dropPincode}
                        onChange={(e) => setDropPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Optional</span>
                    </div>
                    <div className="min-w-[105px] sm:min-w-[90px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Floor No.</label>
                      <input
                        type="number"
                        min={0}
                        value={dropFloor}
                        onChange={(e) => setDropFloor(e.target.value)}
                        placeholder="0 = ground"
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Optional</span>
                    </div>
                    <div className="min-w-[125px] sm:min-w-[190px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Lift at Drop?</label>
                      <YesNoPill value={dropLift} onChange={setDropLift} />
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-end gap-1.5 sm:ml-1">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(3)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handlePackersStep4Continue}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : packersStep === 5 ? (
                  <>
                    <MiniDateInput
                      label="Shift Date"
                      value={date}
                      onChange={setDate}
                      min={todayDateStr}
                      caption="Moving date"
                      boxClassName="min-w-[127px] sm:min-w-[195px] flex-1"
                    />
                    <MiniTimeInput
                      label="Pickup Time"
                      value={pickupTime}
                      onChange={setPickupTime}
                      caption="Pickup time"
                      boxClassName="min-w-[120px] sm:min-w-[182px] flex-1"
                    />
                    <MiniDateInput
                      label="Expected Delivery"
                      value={expectedDeliveryDate}
                      onChange={setExpectedDeliveryDate}
                      min={date || todayDateStr}
                      caption="Optional"
                      boxClassName="min-w-[127px] sm:min-w-[195px] flex-1"
                    />

                    <div className="flex shrink-0 flex-col items-center justify-end gap-1.5 sm:ml-1">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(4)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setPackersStep(6)}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : packersStep === 6 ? (
                  <div className="flex w-full flex-col gap-3">
                    <div className="w-full rounded-[10px] border border-slate-300 bg-[#eceef2] p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-2 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">What are you moving?</label>
                      <div className="flex flex-wrap gap-2">
                        {INVENTORY_ITEMS.map((item) => {
                          const Icon = item.icon;
                          const count = itemCounts[item.key] || 0;
                          return (
                            <div
                              key={item.key}
                              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${count > 0 ? 'border-primary bg-primary-50' : 'border-slate-200 bg-white'}`}
                            >
                              <Icon className={`h-3.5 w-3.5 ${count > 0 ? 'text-primary-700' : 'text-slate-400'}`} />
                              <span className={`text-[12px] font-semibold ${count > 0 ? 'text-primary-700' : 'text-slate-600'}`}>{item.label}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setItemCounts((prev) => ({ ...prev, [item.key]: Math.max(0, (prev[item.key] || 0) - 1) }))}
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500 hover:border-primary hover:text-primary"
                                >
                                  −
                                </button>
                                <span className="min-w-[14px] text-center text-[12px] font-semibold text-slate-900">{count}</span>
                                <button
                                  type="button"
                                  onClick={() => setItemCounts((prev) => ({ ...prev, [item.key]: (prev[item.key] || 0) + 1 }))}
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500 hover:border-primary hover:text-primary"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-3">
                      <div className="min-w-[130px] sm:min-w-[200px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Other Items</label>
                        <input
                          type="text"
                          value={inventoryExtra}
                          onChange={(e) => setInventoryExtra(e.target.value)}
                          placeholder="e.g. 3 ACs, treadmill, piano…"
                          className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                      </div>
                      <div className="min-w-[143px] sm:min-w-[220px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Estimated Weight</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ESTIMATED_WEIGHT_OPTIONS.map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => setEstimatedWeight(opt.v)}
                              className={`rounded-md border px-2 py-1.5 text-center text-[10.5px] font-semibold transition-colors ${
                                estimatedWeight === opt.v ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="min-w-[140px] sm:min-w-[215px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Heavy Items?</label>
                        <YesNoPill value={hasHeavyItems} onChange={setHasHeavyItems} />
                        {hasHeavyItems && (
                          <input
                            type="text"
                            value={heavyItemsDesc}
                            onChange={(e) => setHeavyItemsDesc(e.target.value)}
                            placeholder="Describe…"
                            className="mt-1.5 w-full border-none border-t border-slate-100 bg-transparent p-0 pt-1.5 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        )}
                      </div>
                      <div className="min-w-[140px] sm:min-w-[215px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Fragile Items?</label>
                        <YesNoPill value={hasFragileItems} onChange={setHasFragileItems} />
                        {hasFragileItems && (
                          <input
                            type="text"
                            value={fragileItemsDesc}
                            onChange={(e) => setFragileItemsDesc(e.target.value)}
                            placeholder="Describe…"
                            className="mt-1.5 w-full border-none border-t border-slate-100 bg-transparent p-0 pt-1.5 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col items-center justify-end gap-1.5">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(5)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setPackersStep(7)}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                        >
                          Continue <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-3">
                    <div className="flex flex-wrap items-stretch gap-3">
                      <div className="min-w-[125px] sm:min-w-[190px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Packing Help?</label>
                        <YesNoPill value={needPacking} onChange={setNeedPacking} />
                      </div>
                      <div className="min-w-[125px] sm:min-w-[190px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Loading Help?</label>
                        <YesNoPill value={needLoading} onChange={setNeedLoading} />
                      </div>
                      <div className="min-w-[125px] sm:min-w-[190px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Unloading Help?</label>
                        <YesNoPill value={needUnloading} onChange={setNeedUnloading} />
                      </div>
                      <div className="min-w-[100px] sm:min-w-[155px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Labour Workers</label>
                        <input
                          type="number"
                          min={1}
                          value={labourCount}
                          onChange={(e) => setLabourCount(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Optional</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-3">
                      <div className="min-w-[153px] sm:min-w-[235px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Truck Type</label>
                        <div className="flex gap-1.5">
                          {([
                            { v: 'SHARED', icon: Warehouse, label: 'Shared' },
                            { v: 'DEDICATED', icon: Truck, label: 'Dedicated' },
                          ] as const).map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setVehicleTypeReq(opt.v)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11.5px] font-semibold transition-colors ${
                                  vehicleTypeReq === opt.v ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" /> {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="min-w-[120px] sm:min-w-[182px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Part Load OK?</label>
                        <YesNoPill value={partLoad} onChange={setPartLoad} />
                      </div>
                      <div className="min-w-[127px] sm:min-w-[195px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Transit Insurance?</label>
                        <YesNoPill value={needInsurance} onChange={setNeedInsurance} />
                        {needInsurance && (
                          <input
                            type="number"
                            value={insuranceValue}
                            onChange={(e) => setInsuranceValue(e.target.value)}
                            placeholder="Goods value (₹)"
                            className="mt-1.5 w-full border-none border-t border-slate-100 bg-transparent p-0 pt-1.5 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        )}
                      </div>
                      <div className="min-w-[120px] sm:min-w-[182px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Proof of Delivery?</label>
                        <YesNoPill value={requiresPod} onChange={setRequiresPod} />
                      </div>
                      <div className="min-w-[140px] sm:min-w-[215px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Multiple Stops?</label>
                        <YesNoPill value={multipleStops} onChange={setMultipleStops} />
                        {multipleStops && (
                          <input
                            type="text"
                            value={multipleStopsDesc}
                            onChange={(e) => setMultipleStopsDesc(e.target.value)}
                            placeholder="Describe the stops…"
                            className="mt-1.5 w-full border-none border-t border-slate-100 bg-transparent p-0 pt-1.5 text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col items-center justify-end gap-1.5">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackersStep(6)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handlePackersSubmit}
                          disabled={packersSubmitting}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {packersSubmitting ? 'Submitting…' : 'Get Quotes Now'} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                        {isAuthenticated ? "It’s free & hassle-free" : 'Log in to submit & track your request'}
                      </span>
                    </div>
                  </div>
                )
              ) : activeTab.key === 'equipment' ? (
                equipmentStep === 1 ? (
                  <>
                    <div className="w-full sm:w-auto sm:min-w-[235px] sm:flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <Wrench className="h-3 w-3 text-primary-700" /> Equipment Type
                      </label>
                      <select
                        value={equipmentType}
                        onChange={(e) => setEquipmentType(e.target.value)}
                        className="w-full truncate border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0"
                      >
                        <option value="">Select equipment</option>
                        {QUICK_EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="mt-0.5 hidden text-[12.5px] text-slate-400 sm:block">Type of equipment</span>
                    </div>
                    <MiniCityInput
                      label="Pickup City"
                      placeholder="Enter pickup location"
                      caption="Pickup city"
                      locations={locations}
                      value={fromCity?.name ?? ''}
                      onSelect={setFromCity}
                    />
                    <div className="min-w-[153px] sm:min-w-[235px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-primary-700" /> Pickup Address
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter pickup address or landmark"
                        className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                      />
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Delivery address</span>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleEquipmentStep1Continue}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                      >
                        Continue <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-[143px] sm:min-w-[220px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">Rental Duration</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { v: '1', label: '1–5 Days' },
                          { v: '2', label: '6–15 Days' },
                          { v: '3', label: '16–30 Days' },
                          { v: '4', label: '30+ Days' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setRentalDuration(opt.v)}
                            className={`rounded-md border px-2 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                              rentalDuration === opt.v ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <MiniDateInput
                      label="Start Date"
                      value={date}
                      onChange={setDate}
                      min={todayDateStr}
                      caption="Rental start"
                      boxClassName="min-w-[127px] sm:min-w-[195px] flex-1"
                    />
                    <div className="min-w-[140px] sm:min-w-[215px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                        <Wrench className="h-3 w-3 text-primary-700" /> Number of Equipment
                      </label>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEquipmentQty((q) => Math.max(1, q - 1))}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={20}
                          value={equipmentQty}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n) && n >= 0) setEquipmentQty(n);
                          }}
                          onBlur={() => setEquipmentQty((q) => Math.min(20, Math.max(1, q || 1)))}
                          aria-label="Number of equipment units"
                          className="w-16 shrink-0 border-none bg-transparent p-0 text-center text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-[13px] font-semibold text-slate-500">{equipmentQty === 1 ? 'Unit' : 'Units'}</span>
                        <button
                          type="button"
                          onClick={() => setEquipmentQty((q) => Math.min(20, q + 1))}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="min-w-[170px] sm:min-w-[260px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                      <label className="mb-1.5 block text-[11.5px] sm:text-[13px] font-bold text-slate-500">What do you need?</label>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { v: 'operator', label: 'Operator', on: needOperator, set: setNeedOperator },
                          { v: 'delivery', label: 'Delivery', on: needDelivery, set: setNeedDelivery },
                          { v: 'installation', label: 'Installation', on: needInstallation, set: setNeedInstallation },
                        ] as const).map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => opt.set((v) => !v)}
                            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                              opt.on ? 'border-primary bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col items-end justify-end gap-1.5">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEquipmentStep(1)}
                          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleEquipmentSubmit}
                          disabled={equipmentSubmitting}
                          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {equipmentSubmitting ? 'Submitting…' : 'Get Quotes Now'} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                        {isAuthenticated ? "It’s free & hassle-free" : 'Log in to submit & track your request'}
                      </span>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className={`flex min-w-0 flex-wrap items-stretch gap-2.5 ${activeTab.needsTo ? 'flex-[2] basis-[320px]' : ''}`}>
                    <MiniCityInput
                      label="From"
                      placeholder="Enter pickup location"
                      caption="Pickup city"
                      locations={locations}
                      value={fromCity?.name ?? ''}
                      onSelect={setFromCity}
                    />

                    {activeTab.needsTo && (
                      <>
                        <button
                          type="button"
                          onClick={swapCities}
                          aria-label="Swap pickup and destination"
                          className="relative z-10 my-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary hover:text-primary"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                        </button>
                        <MiniCityInput
                          label="To"
                          placeholder="Enter delivery location"
                          caption="Delivery city"
                          locations={locations}
                          value={toCity?.name ?? ''}
                          onSelect={setToCity}
                        />
                      </>
                    )}
                  </div>

                  {activeTab.hasTruckFields && (
                    <>
                      <MiniSelectInput
                        label="Load Type"
                        icon={Package}
                        options={QUICK_LOAD_TYPES}
                        value={loadType}
                        onChange={setLoadType}
                        placeholder="Select load type"
                        caption="Type of goods"
                      />
                      <MiniSelectInput
                        label="Truck Type"
                        icon={Truck}
                        options={QUICK_TRUCK_TYPES}
                        value={truckType}
                        onChange={setTruckType}
                        placeholder="Select truck type"
                        caption="Vehicle type"
                      />
                      <div className="min-w-[127px] sm:min-w-[195px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                          <MapPin className="h-3 w-3 text-primary-700" /> Pickup Address
                        </label>
                        <input
                          type="text"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Landmark or address (optional)"
                          className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                      </div>
                      <div className="min-w-[127px] sm:min-w-[195px] flex-1 rounded-[10px] border border-slate-300 bg-[#eceef2] px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.10)]">
                        <label className="mb-1 flex items-center gap-1.5 text-[11.5px] sm:text-[13px] font-bold text-slate-500">
                          <MapPin className="h-3 w-3 text-primary-700" /> Drop Address
                        </label>
                        <input
                          type="text"
                          value={dropAddress}
                          onChange={(e) => setDropAddress(e.target.value)}
                          placeholder="Landmark or address (optional)"
                          className="w-full border-none bg-transparent p-0 text-[14px] font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">Optional</span>
                      </div>
                    </>
                  )}

                  {activeTab.hasDateTimeFields ? (
                <>
                  <MiniDateInput
                    label="Pickup Date"
                    value={date}
                    onChange={setDate}
                    min={todayDateStr}
                    caption="Journey date"
                    boxClassName="min-w-[125px] sm:min-w-[190px] flex-1"
                  />
                  <MiniTimeInput
                    label="Pickup Time"
                    value={pickupTime}
                    onChange={setPickupTime}
                    caption="Pickup time"
                    boxClassName="min-w-[112px] sm:min-w-[172px] flex-1"
                  />
                  <MiniDateInput
                    label="Drop-off Date"
                    value={dropoffDate}
                    onChange={setDropoffDate}
                    min={date || todayDateStr}
                    caption="Return date"
                    boxClassName="min-w-[125px] sm:min-w-[190px] flex-1"
                  />
                  <MiniTimeInput
                    label="Drop-off Time"
                    value={dropoffTime}
                    onChange={setDropoffTime}
                    caption={
                      minDropoffTime
                        ? `From ${formatTimeSlot(minDropoffTime)}`
                        : sameDayReturn && pickupTime
                          ? 'Pick a later date'
                          : 'Return time'
                    }
                    minTime={minDropoffTime ?? undefined}
                    minNote={
                      minDropoffTime
                        ? `Minimum ${MIN_SAME_DAY_HOURS} hours — earliest ${formatTimeSlot(minDropoffTime)}`
                        : sameDayReturn && pickupTime
                          ? `A ${MIN_SAME_DAY_HOURS}-hour booking from ${formatTimeSlot(pickupTime)} runs past midnight. Choose a later drop-off date.`
                          : undefined
                    }
                    boxClassName="min-w-[112px] sm:min-w-[172px] flex-1"
                  />
                </>
              ) : (
                <MiniDateInput
                  label="Pickup Date"
                  value={date}
                  onChange={setDate}
                  min={todayDateStr}
                  caption="Journey date"
                  boxClassName="min-w-[120px] sm:min-w-[182px] flex-1"
                />
              )}
                </>
              )}

              {activeTab.key === 'truck' && (
                <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 sm:ml-1">
                  <button
                    type="button"
                    onClick={handleTruckSubmit}
                    disabled={truckSubmitting}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {truckSubmitting ? 'Submitting…' : 'Get Quotes Now'} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                    {isAuthenticated ? "It’s free & hassle-free" : 'Log in to submit & track your request'}
                  </span>
                </div>
              )}

              {activeTab.key !== 'bus' && activeTab.key !== 'packers' && activeTab.key !== 'equipment' && activeTab.key !== 'truck' && (
                <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 sm:ml-1">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-primary-600"
                  >
                    {activeTab.key === 'car' ? 'Book Now' : 'Get Quotes Now'} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {activeTab.key !== 'car' && (
                    <span className="hidden whitespace-nowrap text-[12.5px] text-slate-400 sm:inline">It&rsquo;s free &amp; takes less than 2 minutes</span>
                  )}
                </div>
              )}
            </div>
            {formError && <p className="px-5 pb-3 text-xs font-semibold text-red-500">{formError}</p>}

            {/* Secondary trust bar */}
            <div
              className={
                variant === 'compact'
                  ? 'mx-3 mb-3 mt-2 grid grid-cols-2 items-center gap-x-4 gap-y-3 rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50 via-white to-primary-50 px-5 py-3.5 text-xs text-slate-600 sm:mx-5 sm:mb-5 sm:flex sm:flex-wrap sm:gap-x-0 sm:text-sm'
                  : 'mt-3 grid grid-cols-2 items-center gap-x-4 gap-y-3 rounded-b-2xl border-t border-slate-100 bg-[#f7f8fa] px-5 py-3 text-xs text-slate-600 sm:mt-0 sm:flex sm:flex-wrap sm:gap-x-0 sm:text-sm'
              }
            >
              <span className="flex flex-1 items-center gap-2.5 border-slate-200 px-0 sm:border-r sm:px-4">
                <FileText className="h-[15px] w-[15px] shrink-0 text-primary-700" />
                <span><b className="block font-semibold text-slate-900">Add GST Invoice</b><span className="mt-px block text-[12.5px] text-slate-400">For business bookings</span></span>
              </span>
              <span className="flex flex-1 items-center gap-2.5 border-slate-200 px-0 sm:border-r sm:px-4">
                <ShieldCheck className="h-[15px] w-[15px] shrink-0 text-primary-700" />
                <span><b className="block font-semibold text-slate-900">Price Drop Protection</b><span className="mt-px block text-[12.5px] text-slate-400">Get refund if price drops</span></span>
              </span>
              <span className="grid grid-cols-1 gap-1.5 border-slate-200 px-0 sm:flex sm:flex-1 sm:items-center sm:gap-2.5 sm:border-r sm:px-4">
                <div className="flex">
                  {FOOTER_AVATARS.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className={`h-6 w-6 rounded-full border-2 object-cover ${variant === 'compact' ? 'border-white' : 'border-[#f7f8fa]'} ${i > 0 ? '-ml-2' : ''}`} />
                  ))}
                </div>
                <span><b className="block font-semibold text-slate-900">10,482 vendors online</b><span className="mt-px block text-[12.5px] text-slate-400">128 quotes in last hour</span></span>
              </span>
              <span className="flex flex-1 items-center gap-2.5 px-0 sm:px-4">
                <Tag className="h-[15px] w-[15px] shrink-0 text-primary-700" />
                <span><b className="block font-semibold text-slate-900">Save up to 20%</b><span className="mt-px block text-[12.5px] text-slate-400">By comparing multiple quotes</span></span>
              </span>
            </div>
          </div>
        </div>

        {/* Popular searches */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className={`font-medium ${variant === 'compact' ? 'text-slate-500' : 'text-slate-400'}`}>Popular Searches:</span>
          {POPULAR_TRANSPORT_SEARCHES.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className={
                variant === 'compact'
                  ? 'rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50'
                  : 'rounded-full border border-white/[0.18] px-4 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/40 hover:bg-white/[0.06]'
              }
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {carQuoteModal && (
          <CarQuoteModal
            city={carQuoteModal.city}
            citySlug={carQuoteModal.citySlug}
            params={carQuoteModal.params}
            onClose={() => setCarQuoteModal(null)}
          />
        )}
      </AnimatePresence>
    </section>
    </HeroVariantContext.Provider>
  );
}

// Package/vehicle pricing for the car form above, in a modal — same results
// screen /car-rental/[city] shows after its own form is submitted, reusing
// that exact component instead of re-implementing pricing/availability here.
function CarQuoteModal({
  city, citySlug, params, onClose,
}: {
  city: string;
  citySlug: string;
  params: Record<string, string>;
  onClose: () => void;
}) {
  // Step 2 — picking a vehicle on the left doesn't navigate anywhere; this
  // same modal just grows a second column with trip details, matching the
  // reference design. "Confirm & Continue" submits the booking directly
  // (POST /api/car-rental/bookings, same call the real confirm modal makes
  // once it has a customer) using the name/email/phone collected right here
  // — no extra login/register modal on top of this one.
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<{ vehicle: CarVehicleCategory; priceData: CarPricingResult } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const getBookingDetailsRef = useRef<((vehicleId: string) => CarBookingDraft | null) | null>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  // On mobile the modal's content grid stacks to a single column (grid-cols-1
  // below md), so "Step 2" renders BELOW the vehicle list instead of beside
  // it — without this, picking a vehicle looked like nothing happened since
  // the new content appeared off-screen with no scroll cue.
  useEffect(() => {
    if (selectedVehicle) step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedVehicle]);

  // Pre-fill + skip asking again if the customer is already logged in
  useEffect(() => {
    const storedCustomer = localStorage.getItem('customer');
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (storedCustomer && token) {
      try {
        const customer = JSON.parse(storedCustomer);
        setName(customer.name || '');
        setEmail(customer.email || '');
        setPhone(customer.phone || '');
        setIsLoggedIn(true);
      } catch { /* ignore */ }
    }
  }, []);

  const phoneDigits = phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length === 10 && /^[6-9]/.test(phoneDigits);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canConfirm = isPhoneValid && isEmailValid && name.trim().length > 1;

  const handleConfirmBooking = async () => {
    if (!selectedVehicle || !canConfirm || isBooking) return;
    const details = getBookingDetailsRef.current?.(selectedVehicle.vehicle.id);
    if (!details) { setBookingError('Something went wrong. Please reselect your ride.'); return; }

    setIsBooking(true);
    setBookingError('');

    const { pricing } = details;
    const payload: Record<string, unknown> = {
      tripType: details.tripType,
      carCategory: details.vehicle.id,
      carCategoryName: details.vehicle.name,
      pickupCity: details.pickupCity,
      pickupLocationId: details.pickupLocationId,
      pickupDate: details.pickupDate,
      pickupTime: details.pickupTime,
      pickupAddress: details.pickupCity,
      dropAddress: details.dropAddress || details.dropCity || '',
      baseFare: pricing.totalBeforeGst,
      perKmRate: pricing.perKmRate || 0,
      chargeableKm: pricing.totalKm || null,
      kmCharges: pricing.baseKmCharge || 0,
      driverBatta: pricing.driverAllowance || 0,
      nightCharges: pricing.nightCharge || 0,
      gstAmount: pricing.gst,
      platformFee: 99,
      grandTotal: pricing.grandTotal,
      ...(details.tripType === 'local' && details.packageId && {
        localPackageId: details.packageId,
        localPackageHours: details.packageHours,
        localPackageKm: details.packageKms,
      }),
      ...(details.tripType === 'outstation' && {
        dropCity: details.dropCity,
        dropLocationId: details.dropLocationId,
        mode: details.outstationMode,
        returnDate: details.outstationMode === 'round-trip' ? details.returnDate : undefined,
        intermediateStops: details.intermediateStops,
      }),
      ...(details.tripType === 'airport' && {
        airportMode: details.airportMode,
        airport: details.airportName,
      }),
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phoneDigits,
    };

    try {
      const res = await fetch('/api/car-rental/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        if (result.customer) {
          localStorage.setItem('customer', JSON.stringify(result.customer));
          if (result.token) {
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('token', result.token);
          }
        }
        if (result.booking?.id) localStorage.setItem('last_booking_id', String(result.booking.id));
        if (result.booking?.bookingNumber) localStorage.setItem('last_booking_number', result.booking.bookingNumber);
        router.push(result.redirect_to || '/customer/car-bookings');
        onClose();
      } else {
        setBookingError(result.error || result.message || 'Failed to create booking. Please try again.');
        setIsBooking(false);
      }
    } catch {
      setBookingError('Failed to create booking. Please try again.');
      setIsBooking(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Backdrop — dark scrim + a soft primary-tinted glow behind the card */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <div
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-primary-500/25 blur-[110px]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className={[
          'relative max-h-[90vh] w-full overflow-hidden rounded-[28px] transition-[max-width] duration-300',
          selectedVehicle ? 'max-w-4xl' : 'max-w-xl',
          'bg-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/5 font-heading',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent header band */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-600 to-primary-800 px-6 py-4">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 15% 30%, #ffffff 0%, transparent 40%), radial-gradient(circle at 85% 70%, #ffffff 0%, transparent 45%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <Car className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[15px] font-bold leading-tight">Choose Your Ride</p>
                <p className="text-xs font-medium text-white/75">Verified drivers · All-inclusive pricing</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:rotate-90 hover:bg-white/25"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className={`max-h-[calc(90vh-76px)] overflow-y-auto ${selectedVehicle ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
          <div
            className={[
              // Strip the section's own bg/padding and hide its left marketing column —
              '[&>section]:!bg-none [&_.container-custom]:!mx-0 [&_.container-custom]:!max-w-none [&_.container-custom]:!p-0',
              '[&_.grid.lg\\:grid-cols-2>div:first-child]:hidden [&_.grid.lg\\:grid-cols-2]:lg:!grid-cols-1',
              // Its own card goes fully transparent — this shell already provides the surface —
              '[&_.bg-white.rounded-2xl.shadow-2xl.overflow-hidden]:!bg-transparent [&_.bg-white.rounded-2xl.shadow-2xl.overflow-hidden]:!shadow-none',
              // Swap the component's default blue accents for the brand's primary color —
              '[&_.bg-blue-50]:!bg-primary-50 [&_.bg-blue-600]:!bg-primary-600',
              '[&_.text-blue-400]:!text-primary-400 [&_.text-blue-500]:!text-primary-500 [&_.text-blue-600]:!text-primary-600 [&_.text-blue-700]:!text-primary-700 [&_.text-blue-800]:!text-primary-800',
              '[&_.border-blue-100]:!border-primary-100 [&_.border-blue-200]:!border-primary-200 [&_.border-blue-500]:!border-primary-500 [&_.border-blue-600]:!border-primary-600',
              '[&_.focus\\:ring-blue-500:focus]:!ring-primary-500 [&_.focus\\:border-blue-500:focus]:!border-primary-500',
              '[&_.hover\\:bg-blue-50:hover]:!bg-primary-50 [&_.hover\\:bg-blue-700:hover]:!bg-primary-700 [&_.hover\\:text-blue-700:hover]:!text-primary-700 [&_.hover\\:border-blue-200:hover]:!border-primary-200 [&_.hover\\:border-blue-300:hover]:!border-primary-300',
              '[&_.divide-blue-100>*]:!border-primary-100 [&_.fill-blue-700]:!fill-primary-700',
            ].join(' ')}
          >
            <CarRentalBookingHero
              city={city}
              citySlug={citySlug}
              serviceSlug="car-rental"
              serviceTitle="Car Rental"
              initialSearchParams={params}
              onModifySearch={onClose}
              vehicleListLayout="horizontal"
              hideTabs
              onVehicleSelected={(vehicle, priceData) => {
                setSelectedVehicle({ vehicle, priceData });
              }}
              onBookingDetailsReady={(fn) => { getBookingDetailsRef.current = fn; }}
            />
          </div>

          {/* Step 2 — same modal, second column, no navigation. One card:
              vehicle + fare breakdown up top, customer details right below —
              the trip's location/date/time already shows on the left, so it
              isn't repeated here. */}
          {selectedVehicle && (() => {
            const p = selectedVehicle.priceData.pricing;
            const tripType = params.tripType;
            return (
              <div ref={step2Ref} className="border-t border-gray-100 p-6 md:border-l md:border-t-0">
                <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                  Step 2 of 2
                </span>
                <h3 className="mt-2 text-lg font-bold text-gray-900">Your Trip Details</h3>

                {tripType === 'outstation' && (() => {
                  const stops = [city, ...(params.via ? params.via.split('|') : []), params.to].filter(Boolean);
                  return (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary-700">
                        {params.mode === 'roundtrip' ? <ArrowLeftRight className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                        {params.mode === 'roundtrip' ? 'Round Trip' : 'One Way'}
                        {stops.length > 2 && <span className="normal-case">· {stops.length - 2} stop{stops.length - 2 > 1 ? 's' : ''}</span>}
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        {stops.map((stop, i) => (
                          <React.Fragment key={i}>
                            <span
                              className={`text-sm font-bold ${i === 0 || i === stops.length - 1 ? 'text-gray-900' : 'text-gray-500 font-semibold'}`}
                            >
                              {stop}
                            </span>
                            {i < stops.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      {selectedVehicle.vehicle.image ? (
                        <Image src={selectedVehicle.vehicle.image} alt={selectedVehicle.vehicle.name} width={56} height={40} className="object-contain" />
                      ) : (
                        <Car className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold capitalize text-gray-900">{selectedVehicle.vehicle.name}</div>
                      <div className="text-xs text-gray-500">
                        {selectedVehicle.vehicle.seatingCapacity} Seats · {selectedVehicle.vehicle.acType || 'AC'} · {selectedVehicle.vehicle.luggageCapacity || '2 Bags'}
                      </div>
                    </div>
                    <div className="shrink-0 font-bold text-gray-900">
                      ₹{p.grandTotal.toLocaleString()}
                    </div>
                  </div>

                  {/* Fare breakdown — same numbers as the left card's fare details */}
                  <div className="space-y-1.5 border-t border-gray-100 bg-gray-50 px-3 py-3 text-xs">
                    {tripType === 'local' && (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>Base fare{p.hours ? ` (${p.hours}hr/${p.kms}km)` : ''}</span>
                          <span>₹{(p.totalBeforeGst ?? p.grandTotal).toLocaleString()}</span>
                        </div>
                        {!!p.extraKmCharge && (
                          <div className="flex justify-between text-gray-400">
                            <span>Extra km charge</span><span>₹{p.extraKmCharge}/km</span>
                          </div>
                        )}
                        {!!p.extraHourCharge && (
                          <div className="flex justify-between text-gray-400">
                            <span>Extra hour charge</span><span>₹{p.extraHourCharge}/hr</span>
                          </div>
                        )}
                      </>
                    )}
                    {tripType === 'outstation' && (
                      <>
                        {!!p.perKmRate && !!selectedVehicle.priceData.calculation?.chargeableKm && (
                          <div className="flex justify-between text-gray-600">
                            <span>Distance ({selectedVehicle.priceData.calculation.chargeableKm} km × ₹{p.perKmRate})</span>
                            <span>₹{(p.baseKmCharge ?? 0).toLocaleString()}</span>
                          </div>
                        )}
                        {!!p.driverAllowance && (
                          <div className="flex justify-between text-gray-600">
                            <span>Driver allowance</span><span>₹{p.driverAllowance.toLocaleString()}</span>
                          </div>
                        )}
                        {!!p.tollEstimate && (
                          <div className="flex justify-between text-gray-400">
                            <span>Toll estimate</span><span>₹{p.tollEstimate.toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    )}
                    {tripType === 'airport' && (
                      <div className="flex justify-between text-gray-600">
                        <span>Fixed fare · Incl. 45 min waiting</span>
                        <span>₹{(p.totalBeforeGst ?? p.grandTotal).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                      <span>Total (incl. GST)</span><span>₹{p.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 bg-green-50 px-3 py-2.5">
                    <p className="mb-1.5 text-xs font-semibold text-green-800">Included:</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-green-700">
                      <span className="rounded bg-green-100 px-2 py-1">Professional Driver</span>
                      <span className="rounded bg-green-100 px-2 py-1">AC Vehicle</span>
                      <span className="rounded bg-green-100 px-2 py-1">Fuel</span>
                    </div>
                  </div>

                  {/* Customer details — same card, right below the fare */}
                  {isLoggedIn ? (
                    <div className="flex items-center gap-3 border-t border-gray-100 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-black text-primary-700">
                        {(name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{name}</p>
                        <p className="truncate text-xs text-gray-500">{phone} · {email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 border-t border-gray-100 p-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500">Phone Number</label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-9 text-sm font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          {isPhoneValid && (
                            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {bookingError && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {bookingError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!canConfirm || isBooking}
                  onClick={handleConfirmBooking}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                    </>
                  ) : (
                    <>
                      Confirm &amp; Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-600" /> Safe rides. Trusted by thousands.
                </p>
              </div>
            );
          })()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Same fields, same 12-hour-advance validation and same fleet-page
// destination as src/components/bike/BikeSearchHero.tsx and
// src/components/car/CarSearchHero.tsx — just laid out to fit inside this
// page's compact category switcher instead of a full-page hero section.
const MIN_ADVANCE_HOURS = 12;

function getMinBookingDate() {
  const minDateTime = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  return minDateTime.toISOString().split('T')[0];
}

function isPickupTooSoon(date: string, time: string) {
  const pickupDateTime = new Date(`${date}T${time || '00:00'}:00`);
  const diffHours = (pickupDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return diffHours < MIN_ADVANCE_HOURS;
}

const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      opts.push({ value: `${hour}:${minute}`, label: `${hour12}:${minute} ${ampm}` });
    }
  }
  return opts;
})();

function DateTimeSearchPanel({
  basePath, fleetSegment, buttonLabel, citySlug, accentColor,
}: {
  basePath: string;
  fleetSegment: string;
  buttonLabel: string;
  citySlug: string | null;
  accentColor: string;
}) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const minBookingDate = getMinBookingDate();

  const handleSearch = () => {
    if (!citySlug) {
      setFormError('Please select your city above first.');
      setTimeout(() => setFormError(''), 4000);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!pickupDate) newErrors.pickupDate = 'Select pickup date';
    if (!pickupTime) newErrors.pickupTime = 'Select pickup time';
    if (!dropDate) newErrors.dropDate = 'Select drop date';
    if (!dropTime) newErrors.dropTime = 'Select drop time';
    if (pickupDate && dropDate && pickupDate > dropDate) {
      newErrors.dropDate = 'Drop date must be after pickup date';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isPickupTooSoon(pickupDate, pickupTime)) {
      const earliest = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
      const formattedDate = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedTime = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      setFormError(`Booking requires at least ${MIN_ADVANCE_HOURS} hours advance notice. Earliest pickup: ${formattedDate}, ${formattedTime}.`);
      setTimeout(() => setFormError(''), 5000);
      return;
    }

    setFormError('');
    setErrors({});
    const params = new URLSearchParams({ city: citySlug, pickupDate, pickupTime, dropDate, dropTime });
    router.push(`${basePath}/${citySlug}/${fleetSegment}?${params.toString()}`);
  };

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
      hasError ? 'border-red-400' : 'border-slate-200 focus:border-primary'
    }`;

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5" /> Pickup Date
          </label>
          <input
            type="date"
            min={minBookingDate}
            value={pickupDate}
            onChange={(e) => {
              const val = e.target.value;
              setPickupDate(val);
              setErrors((p) => ({ ...p, pickupDate: '' }));
              setFormError('');
              // Only auto-copy once it's a complete, well-formed YYYY-MM-DD —
              // typing digit-by-digit can fire onChange with a malformed
              // intermediate value (e.g. a 5-digit year) mid-entry.
              const isCompleteDate = /^\d{4}-\d{2}-\d{2}$/.test(val);
              if (isCompleteDate && (!dropDate || val > dropDate)) setDropDate(val);
            }}
            className={fieldClass(!!errors.pickupDate)}
          />
          {errors.pickupDate && <p className="mt-1 text-[11px] text-red-500">{errors.pickupDate}</p>}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Clock className="h-3.5 w-3.5" /> Pickup Time
          </label>
          <select
            aria-label="Pickup time"
            value={pickupTime}
            onChange={(e) => {
              setPickupTime(e.target.value);
              setErrors((p) => ({ ...p, pickupTime: '' }));
              setFormError('');
            }}
            className={fieldClass(!!errors.pickupTime)}
          >
            <option value="">Select</option>
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.pickupTime && <p className="mt-1 text-[11px] text-red-500">{errors.pickupTime}</p>}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5" /> Drop-off Date
          </label>
          <input
            type="date"
            min={pickupDate || minBookingDate}
            value={dropDate}
            onChange={(e) => {
              setDropDate(e.target.value);
              setErrors((p) => ({ ...p, dropDate: '' }));
            }}
            className={fieldClass(!!errors.dropDate)}
          />
          {errors.dropDate && <p className="mt-1 text-[11px] text-red-500">{errors.dropDate}</p>}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Clock className="h-3.5 w-3.5" /> Drop-off Time
          </label>
          <select
            aria-label="Drop-off time"
            value={dropTime}
            onChange={(e) => {
              setDropTime(e.target.value);
              setErrors((p) => ({ ...p, dropTime: '' }));
            }}
            className={fieldClass(!!errors.dropTime)}
          >
            <option value="">Select</option>
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.dropTime && <p className="mt-1 text-[11px] text-red-500">{errors.dropTime}</p>}
        </div>
      </div>

      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {formError}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleSearch}
        style={{ backgroundColor: accentColor }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01]"
      >
        <Search className="h-4 w-4" /> {buttonLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Same trip-type flow (local / outstation / airport), same param names and
// same /luxury-car-rental/[city]/book destination as the real
// src/components/luxury/LuxuryBookingHero.tsx's handleContinueBooking().
const LUXURY_LOCAL_PACKAGES = [
  { id: '8hr-80km', label: '8 Hrs / 80 Km' },
  { id: '12hr-120km', label: '12 Hrs / 120 Km' },
];

interface LuxuryAirport {
  id: string;
  displayName: string;
  code: string;
}

function LuxurySearchPanel({
  citySlug, cityName, cityId, locations, accentColor,
}: {
  citySlug: string | null;
  cityName: string | null;
  cityId: string | number | null;
  locations: Location[];
  accentColor: string;
}) {
  const [tripType, setTripType] = useState<'local' | 'outstation' | 'airport'>('local');
  const [outstationMode, setOutstationMode] = useState<'one-way' | 'round-trip'>('round-trip');
  const [airportMode, setAirportMode] = useState<'pickup' | 'drop'>('pickup');

  const [dropCityQuery, setDropCityQuery] = useState('');
  const [selectedDropCity, setSelectedDropCity] = useState<Location | null>(null);
  const [dropCityOpen, setDropCityOpen] = useState(false);
  const dropCityBoxRef = useRef<HTMLDivElement>(null);

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [localPackage, setLocalPackage] = useState(LUXURY_LOCAL_PACKAGES[0].id);

  const [airports, setAirports] = useState<LuxuryAirport[]>([]);
  const [selectedAirportId, setSelectedAirportId] = useState('');
  const [terminalAddress, setTerminalAddress] = useState('');

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (tripType !== 'airport' || airports.length > 0) return;
    let cancelled = false;
    fetch('/api/airports')
      .then((r) => (r.ok ? r.json() : { airports: [] }))
      .then((data) => { if (!cancelled) setAirports(data.airports || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tripType, airports.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropCityBoxRef.current && !dropCityBoxRef.current.contains(e.target as Node)) setDropCityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropCityMatches = useMemo(() => {
    const q = dropCityQuery.trim().toLowerCase();
    const pool = q ? locations.filter((l) => l.name.toLowerCase().includes(q)) : locations;
    return pool.slice(0, 8);
  }, [dropCityQuery, locations]);

  const handleSearch = () => {
    if (!citySlug || !cityName) {
      setFormError('Please select your pickup city above first.');
      setTimeout(() => setFormError(''), 4000);
      return;
    }
    if (!pickupDate) {
      setFormError('Please select a pickup date.');
      setTimeout(() => setFormError(''), 4000);
      return;
    }
    if (tripType === 'outstation' && !selectedDropCity) {
      setFormError('Please select a drop city for outstation trips.');
      setTimeout(() => setFormError(''), 4000);
      return;
    }

    const params = new URLSearchParams({ tripType, pickupCity: cityName, pickupDate, pickupTime });
    if (cityId != null) params.set('pickupCityId', String(cityId));

    if (tripType === 'local') {
      params.set('package', localPackage);
    }
    if (tripType === 'outstation' && selectedDropCity) {
      params.set('dropCity', selectedDropCity.name);
      params.set('dropCityId', String(selectedDropCity.id));
      params.set('mode', outstationMode);
      if (returnDate) params.set('returnDate', returnDate);
    }
    if (tripType === 'airport') {
      params.set('airportMode', airportMode);
      if (selectedAirportId) {
        params.set('airportId', selectedAirportId);
        const airport = airports.find((a) => a.id === selectedAirportId);
        if (airport) {
          params.set('airport', airport.displayName);
          params.set('airportCode', airport.code);
        }
      }
      params.set('terminalAddress', terminalAddress);
    }

    setFormError('');
    window.location.href = `/luxury-car-rental/${citySlug}/book?${params.toString()}`;
  };

  const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100';
  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:text-sm ${active ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-200/70 p-1">
        {(['local', 'outstation', 'airport'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTripType(t)} className={tabClass(tripType === t)}>
            {t === 'local' ? 'Local' : t === 'outstation' ? 'Outstation' : 'Airport'}
          </button>
        ))}
      </div>

      {tripType === 'local' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Package</label>
            <select aria-label="Package" value={localPackage} onChange={(e) => setLocalPackage(e.target.value)} className={fieldClass}>
              {LUXURY_LOCAL_PACKAGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Calendar className="h-3.5 w-3.5" /> Pickup Date</label>
            <input type="date" value={pickupDate} onChange={(e) => { setPickupDate(e.target.value); setFormError(''); }} className={fieldClass} />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Pickup Time</label>
            <select aria-label="Pickup time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={fieldClass}>
              {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {tripType === 'outstation' && (
        <div className="space-y-3">
          <div className="inline-flex rounded-lg bg-white p-1 text-xs font-bold">
            {(['round-trip', 'one-way'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setOutstationMode(m)}
                className={`rounded-md px-3 py-1.5 ${outstationMode === m ? 'bg-primary text-white' : 'text-slate-500'}`}>
                {m === 'round-trip' ? 'Round Trip' : 'One Way'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="relative" ref={dropCityBoxRef}>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> Drop City</label>
              <input
                value={dropCityQuery}
                onChange={(e) => { setDropCityQuery(e.target.value); setSelectedDropCity(null); setDropCityOpen(true); }}
                onFocus={() => setDropCityOpen(true)}
                placeholder="Where to?"
                className={fieldClass}
              />
              {dropCityOpen && dropCityMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                  {dropCityMatches.map((loc) => (
                    <button key={loc.id} type="button" onClick={() => { setSelectedDropCity(loc); setDropCityQuery(loc.name); setDropCityOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      <span className="truncate">{loc.name}{loc.state ? `, ${loc.state}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Calendar className="h-3.5 w-3.5" /> Pickup Date</label>
              <input type="date" value={pickupDate} onChange={(e) => { setPickupDate(e.target.value); setFormError(''); }} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Pickup Time</label>
              <select aria-label="Pickup time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={fieldClass}>
                {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {outstationMode === 'round-trip' && (
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Calendar className="h-3.5 w-3.5" /> Return Date</label>
                <input type="date" min={pickupDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={fieldClass} />
              </div>
            )}
          </div>
        </div>
      )}

      {tripType === 'airport' && (
        <div className="space-y-3">
          <div className="inline-flex rounded-lg bg-white p-1 text-xs font-bold">
            {(['pickup', 'drop'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setAirportMode(m)}
                className={`rounded-md px-3 py-1.5 ${airportMode === m ? 'bg-primary text-white' : 'text-slate-500'}`}>
                {m === 'pickup' ? 'Airport Pickup' : 'Airport Drop'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> Airport</label>
              <select aria-label="Airport" value={selectedAirportId} onChange={(e) => setSelectedAirportId(e.target.value)} className={fieldClass}>
                <option value="">{airports.length ? 'Select airport' : 'Loading airports…'}</option>
                {airports.map((a) => <option key={a.id} value={a.id}>{a.displayName} ({a.code})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Calendar className="h-3.5 w-3.5" /> {airportMode === 'pickup' ? 'Arrival Date' : 'Pickup Date'}</label>
              <input type="date" value={pickupDate} onChange={(e) => { setPickupDate(e.target.value); setFormError(''); }} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> Time</label>
              <select aria-label="Pickup time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={fieldClass}>
                {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">{airportMode === 'pickup' ? 'Drop Address' : 'Pickup Address'}</label>
              <input
                value={terminalAddress}
                onChange={(e) => setTerminalAddress(e.target.value)}
                placeholder={airportMode === 'pickup' ? 'Enter drop address' : 'Enter pickup address'}
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {formError}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleSearch}
        style={{ backgroundColor: accentColor }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01]"
      >
        <Gem className="h-4 w-4" /> Continue Your Booking
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <FadeIn className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-black uppercase tracking-widest text-primary-600">{eyebrow}</span>
      <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-slate-500">{subtitle}</p>
    </FadeIn>
  );
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
