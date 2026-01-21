'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import both hero variants
const ServiceHeroWithChat = dynamic(
  () => import('./ServiceHeroWithChat').then(m => ({ default: m.ServiceHeroWithChat })),
  { ssr: false }
);
const ServiceHeroWithForm = dynamic(
  () => import('./ServiceHeroWithForm').then(m => ({ default: m.ServiceHeroWithForm })),
  { ssr: false }
);

export type HeroVariant = 'chat' | 'form';

// Common icon types supported by both hero variants
type SupportedIcon = 'star' | 'shield' | 'zap';

interface ServiceHeroVariantProps {
  serviceType: string;
  variant?: HeroVariant;
  // Props for both variants
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  features?: { icon: SupportedIcon; text: string; color: string }[];
  gradientFrom?: string;
  gradientTo?: string;
}

/**
 * ServiceHeroVariant - A/B Testing Wrapper for Service Heroes
 *
 * This component allows easy switching between two hero variants:
 * - 'chat': Uses Shivi conversational booking assistant
 * - 'form': Uses traditional multi-step booking forms
 *
 * Usage:
 * <ServiceHeroVariant serviceType="bike-on-rent" variant="chat" />
 * <ServiceHeroVariant serviceType="bike-on-rent" variant="form" />
 *
 * For A/B testing, you can control the variant via:
 * 1. Environment variable: NEXT_PUBLIC_HERO_VARIANT='chat' or 'form'
 * 2. URL parameter: ?hero=chat or ?hero=form
 * 3. Prop override: variant="chat" or variant="form"
 */
export function ServiceHeroVariant({
  serviceType,
  variant: propVariant,
  badge,
  title,
  titleHighlight,
  description,
  features,
  gradientFrom,
  gradientTo,
}: ServiceHeroVariantProps) {
  // Determine which variant to use
  // Priority: prop > URL param > env var > default ('form')
  const [activeVariant, setActiveVariant] = React.useState<HeroVariant>('form');

  React.useEffect(() => {
    // Check URL parameter first (for testing)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVariant = urlParams.get('hero') as HeroVariant | null;

      if (urlVariant && (urlVariant === 'chat' || urlVariant === 'form')) {
        setActiveVariant(urlVariant);
        return;
      }
    }

    // Then check prop
    if (propVariant) {
      setActiveVariant(propVariant);
      return;
    }

    // Then check environment variable
    const envVariant = process.env.NEXT_PUBLIC_HERO_VARIANT as HeroVariant | undefined;
    if (envVariant && (envVariant === 'chat' || envVariant === 'form')) {
      setActiveVariant(envVariant);
      return;
    }

    // Default to form (traditional forms, Shivi is floating chat only)
    setActiveVariant('form');
  }, [propVariant]);

  if (activeVariant === 'form') {
    return (
      <ServiceHeroWithForm
        serviceType={serviceType}
        badge={badge}
        title={title}
        titleHighlight={titleHighlight}
        description={description}
        features={features}
      />
    );
  }

  // Default: Chat variant (Shivi)
  return (
    <ServiceHeroWithChat
      badge={badge || ''}
      title={title || ''}
      titleHighlight={titleHighlight || ''}
      description={description || ''}
      serviceType={serviceType}
      features={features}
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
    />
  );
}

export default ServiceHeroVariant;
