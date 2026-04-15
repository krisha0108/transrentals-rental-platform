'use client';

import { useLocation } from '@/contexts/LocationContext';
import { BikeSearchHero } from './BikeSearchHero';

export function BikeHeroWithLocation() {
  const { currentCity } = useLocation();
  const city = currentCity?.name || 'India';
  const citySlug = currentCity?.slug || '';
  return <BikeSearchHero city={city} citySlug={citySlug} />;
}
