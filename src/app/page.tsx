import React from 'react';
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

export default function HomePage() {
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
