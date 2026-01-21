'use client';

import React, { useEffect } from 'react';
import { City } from '@/data/indian-cities';
import { useLocation } from '@/contexts/LocationContext';

// Import all homepage components
import { HeroSectionDynamic } from '@/components/home/HeroSectionDynamic';
import { ServicesGridDynamic } from '@/components/home/ServicesGridDynamic';
import { PopularDestinationsDynamic } from '@/components/home/PopularDestinationsDynamic';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { BackrTokenSection } from '@/components/home/BackrTokenSection';
import { AppDownloadSection } from '@/components/home/AppDownloadSection';
import { BlogSectionDynamic } from '@/components/home/BlogSectionDynamic';
import { CTASectionDynamic } from '@/components/home/CTASectionDynamic';

interface CityHomePageProps {
  city: City;
}

export function CityHomePage({ city }: CityHomePageProps) {
  const { setCity } = useLocation();

  // Set the city from URL on mount
  useEffect(() => {
    setCity(city, 'url');
  }, [city, setCity]);

  // Render exact same homepage layout
  return (
    <div className="flex flex-col">
      <HeroSectionDynamic />
      <FeaturesSection />
      <ServicesGridDynamic />
      <PopularDestinationsDynamic />
      <HowItWorks />
      <Testimonials />
      <BackrTokenSection />
      <AppDownloadSection />
      <BlogSectionDynamic />
      <CTASectionDynamic />
    </div>
  );
}
