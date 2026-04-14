'use client';

import { useLocation } from '@/contexts/LocationContext';
import { HourlyCarBookingHero } from './HourlyCarBookingHero';

export function HourlyBookingHeroAuto() {
  const { currentCity } = useLocation();
  const cityName = currentCity?.name || 'Your City';
  const citySlug = currentCity?.slug || '';

  return <HourlyCarBookingHero cityName={cityName} citySlug={citySlug} />;
}
