'use client';

import { Heart, Zap, Clock, Shield, Star, Sparkles, Camera, Briefcase, BarChart2, FileText, Car, Navigation } from 'lucide-react';
import { CarRentalBookingHero } from './CarRentalBookingHero';

// Tailwind JIT safelist — CarRentalBookingHero builds classes like
// `text-${themeColors.accent}` at runtime from each config's `accent` value
// below. The scanner can't see a dynamically-built string, so any accent
// whose literal class doesn't already appear somewhere in the codebase
// silently renders un-colored (found via one-way's "Drop at Any City" not
// showing its cyan accent at all). Keeping every accent used here as a
// plain literal keeps them all working regardless of what other files do.
// text-pink-300 text-orange-400 text-amber-400 text-sky-400 text-violet-400 text-cyan-400 text-purple-400 text-blue-400 text-sky-300 text-amber-300

export type SpecialtyService = 'wedding' | 'sports' | 'vintage' | 'corporate' | 'creta' | 'outstation' | 'one-way' | 'round-trip' | 'outstation-cab' | 'local-taxi' | 'monthly';

interface SpecialtyCarBookingHeroProps {
  service: SpecialtyService;
  city?: string;
  citySlug?: string;
}

const SERVICE_CONFIG: Record<
  SpecialtyService,
  {
    serviceTitle: string;
    headingLine1: string;
    headingLine2: string;
    subheading: string;
    gradient: string;
    accent: string;
    trustBadges: { icon: React.ComponentType<{ className?: string }>; text: string }[];
    heroImage?: string;
    heroOverlayOpacity?: number;
    heroOverlayGradient?: string;
    heroTextLegibilityBoost?: boolean;
    heroPanelClassOverride?: string;
    heroLightText?: boolean;
    heroHeadingShine?: boolean;
    heroImageFit?: 'cover' | 'contain';
    showBrandedShell?: boolean;
    heroChecklist?: string[];
  }
> = {
  wedding: {
    serviceTitle: 'Wedding Car Rental',
    headingLine1: 'Book Decorated Cars for',
    headingLine2: 'Weddings & Baraats',
    subheading:
      'Floral decorations, banners & ribbon included. Professional chauffeur in formal attire. Make your special day unforgettable.',
    gradient: 'from-rose-900 via-rose-800 to-pink-900',
    accent: 'pink-300',
    trustBadges: [
      { icon: Heart, text: 'Decorated Cars' },
      { icon: Shield, text: 'Trusted Chauffeurs' },
      { icon: Star, text: '4.9 Rating' },
    ],
  },
  sports: {
    serviceTitle: 'Sports Car Rental',
    headingLine1: 'Book Premium Sports Cars &',
    headingLine2: 'Supercars',
    subheading:
      'Drive your dream car. Self-drive & chauffeur options. Ferrari, Lamborghini, BMW M-series and more available.',
    gradient: 'from-orange-900 via-red-900 to-orange-900',
    accent: 'orange-400',
    trustBadges: [
      { icon: Zap, text: 'High Performance Cars' },
      { icon: Shield, text: 'Fully Insured' },
      { icon: Clock, text: 'Hourly / Daily' },
    ],
  },
  vintage: {
    serviceTitle: 'Vintage Car Rental',
    headingLine1: 'Book Classic & Vintage Cars for',
    headingLine2: 'Special Occasions',
    subheading:
      'Retro charm for weddings, photoshoots & film shoots. Well-maintained classic cars with experienced chauffeurs.',
    gradient: 'from-amber-900 via-yellow-900 to-stone-900',
    accent: 'amber-400',
    trustBadges: [
      { icon: Sparkles, text: 'Classic Collection' },
      { icon: Camera, text: 'Photoshoots Welcome' },
      { icon: Star, text: '4.8 Rating' },
    ],
    heroImage: '/images/sections/vintage-car-hero-bg.png',
    showBrandedShell: true,
    heroChecklist: [
      'Well-maintained classic & vintage collection',
      'Experienced chauffeurs included',
      'Perfect for weddings, photoshoots & film sets',
    ],
  },
  corporate: {
    serviceTitle: 'Corporate Car Rental',
    headingLine1: 'Book Business Cars for',
    headingLine2: 'Employee & Corporate Travel',
    subheading:
      'Dedicated fleet for employee commute, client meetings & airport transfers. GST invoices, monthly billing & 24/7 support.',
    gradient: 'from-slate-900 via-slate-800 to-gray-900',
    accent: 'sky-400',
    trustBadges: [
      { icon: Briefcase, text: 'GST Invoice Provided' },
      { icon: BarChart2, text: 'Monthly Reports' },
      { icon: FileText, text: 'Dedicated Account Manager' },
    ],
  },
  monthly: {
    serviceTitle: 'Monthly Car Rental',
    headingLine1: 'Monthly Car Rental',
    headingLine2: 'Flexible Monthly Plans',
    subheading:
      'Rent cars on monthly basis for business or personal use. Flexible plans with maintenance included. Self-drive & chauffeur options.',
    gradient: 'from-violet-900 via-purple-900 to-indigo-900',
    accent: 'violet-400',
    heroImage: '/images/sections/monthly-car-rental-hero-bg.png',
    heroOverlayOpacity: 55,
    heroOverlayGradient: 'bg-gradient-to-br from-gray-900 via-gray-900/80 to-gray-900/60',
    heroTextLegibilityBoost: true,
    heroImageFit: 'cover',
    trustBadges: [
      { icon: Star, text: '4.8/5 Rating' },
      { icon: Shield, text: 'All Inclusive' },
      { icon: Zap, text: 'Flexible Plans' },
    ],
  },
  'local-taxi': {
    serviceTitle: 'Local Taxi',
    headingLine1: 'Book Local Taxi',
    headingLine2: 'Hourly City Cab | 4hr, 8hr & 12hr Packages',
    subheading:
      '4hr, 8hr & 12hr packages with professional drivers. Affordable city cab service with AC cars across India.',
    gradient: 'from-blue-900 via-cyan-900 to-teal-900',
    accent: 'cyan-400',
    trustBadges: [
      { icon: Star, text: '4.8/5 Rating' },
      { icon: Shield, text: 'Verified Drivers' },
      { icon: Zap, text: 'Instant Booking' },
    ],
  },
  'round-trip': {
    serviceTitle: 'Round Trip Cab Service',
    headingLine1: 'Book Round Trip Cabs',
    headingLine2: 'Starting @₹10/km',
    subheading:
      'Go and return with same driver. Save 20-30% on outstation travel. All charges included — no hidden fees.',
    gradient: 'from-purple-900 via-indigo-900 to-violet-900',
    accent: 'purple-400',
    trustBadges: [
      { icon: Star, text: 'Professional Drivers' },
      { icon: Shield, text: 'All Charges Included' },
      { icon: Navigation, text: 'Flexible Return Date' },
    ],
  },
  'outstation-cab': {
    serviceTitle: 'Outstation Cab',
    headingLine1: 'Book Outstation Cab',
    headingLine2: 'All Inclusive Fare',
    subheading:
      'Intercity cab for outstation travel. Round trip & one-way options with professional drivers across 250+ cities.',
    gradient: 'from-blue-900 via-indigo-900 to-slate-900',
    accent: 'blue-400',
    trustBadges: [
      { icon: Star, text: '4.8/5 Rating' },
      { icon: Shield, text: 'All India Permit' },
      { icon: Zap, text: 'Instant Booking' },
    ],
  },
  'one-way': {
    serviceTitle: 'One Way Car Rental',
    headingLine1: 'One Way Car Rental',
    headingLine2: 'Drop at Any City',
    subheading:
      'No return charges. Book a car, travel to your destination & drop it there. Professional drivers across 250+ cities.',
    gradient: 'from-blue-900 via-sky-900 to-cyan-900',
    accent: 'amber-300',
    heroImage: '/images/sections/car-rental-hero-bg.png',
    // A flat colored wash over the whole photo kept reading as muddy/washed
    // out — concentrating the darkness on the text side (left) instead
    // keeps the photo itself clear and legible without the tint fighting it.
    // No heroTextLegibilityBoost here — the directional overlay already
    // carries the contrast, and the text-shadow on top of it read as a
    // fuzzy halo rather than crisp text.
    heroOverlayOpacity: 50,
    heroOverlayGradient: 'bg-gradient-to-r from-black/90 via-black/55 to-transparent',
    heroLightText: true,
    heroHeadingShine: true,
    heroImageFit: 'cover',
    trustBadges: [
      { icon: Star, text: '4.8/5 Rating' },
      { icon: Shield, text: 'No Return Charges' },
      { icon: Zap, text: 'Instant Booking' },
    ],
  },
  outstation: {
    serviceTitle: 'Outstation Car Rental',
    headingLine1: 'Book Cars for',
    headingLine2: 'Outstation & Intercity Trips',
    subheading:
      'Round trips, one-way drops & multi-city tours. Professional drivers, all India permits. Starting @₹10/km.',
    gradient: 'from-sky-900 via-blue-900 to-indigo-900',
    accent: 'sky-400',
    trustBadges: [
      { icon: Star, text: '4.8/5 Rating' },
      { icon: Shield, text: 'All India Permits' },
      { icon: Navigation, text: 'One-way & Round Trip' },
    ],
  },
  creta: {
    serviceTitle: 'Creta on Rent',
    headingLine1: 'Rent Hyundai Creta',
    headingLine2: 'Without Driver | Self Drive',
    subheading:
      "India's best-selling SUV for self-drive. Premium features, ADAS safety, BlueLink technology. Perfect for family trips & outstation travel.",
    gradient: 'from-blue-900 via-blue-800 to-cyan-900',
    accent: 'cyan-400',
    heroImage: '/images/sections/car-rental-hero-bg.png',
    heroOverlayOpacity: 50,
    heroOverlayGradient: 'bg-gradient-to-r from-black/90 via-black/55 to-transparent',
    heroLightText: true,
    heroImageFit: 'cover',
    showBrandedShell: true,
    trustBadges: [
      { icon: Star, text: '4.9/5 Rating' },
      { icon: Shield, text: 'Fully Insured' },
      { icon: Car, text: 'Premium SUV' },
    ],
  },
};

export function SpecialtyCarBookingHero({ service, city = '', citySlug = '' }: SpecialtyCarBookingHeroProps) {
  const config = SERVICE_CONFIG[service];

  return (
    <CarRentalBookingHero
      city={city}
      citySlug={citySlug}
      serviceSlug="car-rental"
      serviceTitle={config.serviceTitle}
      headingLine1={config.headingLine1}
      headingLine2={config.headingLine2}
      subheading={config.subheading}
      gradientOverride={config.gradient}
      accentOverride={config.accent}
      trustBadges={config.trustBadges}
      heroImage={config.heroImage}
      heroOverlayOpacity={config.heroOverlayOpacity}
      heroOverlayGradient={config.heroOverlayGradient}
      heroTextLegibilityBoost={config.heroTextLegibilityBoost}
      heroPanelClassOverride={config.heroPanelClassOverride}
      heroLightText={config.heroLightText}
      heroHeadingShine={config.heroHeadingShine}
      heroImageFit={config.heroImageFit}
      showBrandedShell={config.showBrandedShell}
      heroChecklist={config.heroChecklist}
    />
  );
}
