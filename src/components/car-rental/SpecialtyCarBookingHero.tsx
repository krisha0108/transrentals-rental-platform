'use client';

import { Heart, Zap, Clock, Shield, Star, Sparkles, Camera, Briefcase, BarChart2, FileText } from 'lucide-react';
import { CarRentalBookingHero } from './CarRentalBookingHero';

export type SpecialtyService = 'wedding' | 'sports' | 'vintage' | 'corporate';

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
    />
  );
}
