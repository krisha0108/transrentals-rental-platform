'use client';

import { LuxuryVehicleGrid, LuxuryVehicle } from '@/components/luxury';

interface LuxuryVehicleGridWrapperProps {
  vehicles: LuxuryVehicle[];
  location?: string;
  locationSlug?: string;
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'featured';
}

export function LuxuryVehicleGridWrapper(props: LuxuryVehicleGridWrapperProps) {
  return <LuxuryVehicleGrid {...props} />;
}
