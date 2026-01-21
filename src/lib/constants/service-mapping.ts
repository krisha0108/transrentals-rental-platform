/**
 * Service Parent-Child Mapping
 *
 * Maps 27 sub-service page slugs to their 8 parent admin service slugs.
 * Used for content inheritance - sub-services inherit content from parent if not overridden.
 *
 * 8 Parent Services (managed in Admin):
 * 1. bike-rental
 * 2. self-drive-car-rental
 * 3. car-rental-with-driver
 * 4. luxury-car-rental
 * 5. bus-rental
 * 6. truck-tempo-rental
 * 7. packers-movers
 * 8. equipment-rental
 */

export const SERVICE_PARENT_MAP: Record<string, string> = {
  // Bike Rental (parent: bike-rental)
  'bike-on-rent': 'bike-rental',
  'activa-on-rent': 'bike-rental',
  'royal-enfield-on-rent': 'bike-rental',
  'ktm-on-rent': 'bike-rental',
  'pulsar-on-rent': 'bike-rental',
  'apache-on-rent': 'bike-rental',
  'splendor-on-rent': 'bike-rental',
  'monthly-bike-rental': 'bike-rental',
  'electric-scooter-rental': 'bike-rental',
  'bike-trips/ladakh': 'bike-rental',
  'bike-tours': 'bike-rental',
  'bike-tours/leh-ladakh': 'bike-rental',
  'bike-tours/spiti-valley': 'bike-rental',
  'bike-tours/rajasthan': 'bike-rental',
  'bike-tours/goa': 'bike-rental',
  'himalayan-on-rent': 'bike-rental',

  // Self-Drive Car Rental (parent: self-drive-car-rental)
  'hourly-car-rental': 'self-drive-car-rental',
  'self-drive-car-rentals': 'self-drive-car-rental',
  'self-drive-suv-rental': 'self-drive-car-rental',
  'self-drive-sedan-rental': 'self-drive-car-rental',
  'self-drive-hatchback-rental': 'self-drive-car-rental',
  'swift-on-rent': 'self-drive-car-rental',
  'creta-on-rent': 'self-drive-car-rental',
  'innova-on-rent': 'self-drive-car-rental',
  'fortuner-on-rent': 'self-drive-car-rental',
  'seltos-on-rent': 'self-drive-car-rental',
  'xuv700-on-rent': 'self-drive-car-rental',
  'scorpio-on-rent': 'self-drive-car-rental',

  // Car Rental with Driver (parent: car-rental-with-driver)
  'car-rental': 'car-rental-with-driver',
  'chauffeur-service': 'car-rental-with-driver',
  'airport-transfer': 'car-rental-with-driver',
  'local-taxi': 'car-rental-with-driver',
  'outstation-cab': 'car-rental-with-driver',
  'one-way-car-rental': 'car-rental-with-driver',
  'outstation-car-rental': 'car-rental-with-driver',
  'monthly-car-rental': 'car-rental-with-driver',
  'corporate-car-rental': 'car-rental-with-driver',

  // Luxury Car Rental (parent: luxury-car-rental)
  'luxury-car-rental': 'luxury-car-rental',
  'wedding-car-rental': 'luxury-car-rental',
  'sports-car-rental': 'luxury-car-rental',
  'vintage-car-rental': 'luxury-car-rental',

  // Bus Rental (parent: bus-rental)
  'bus-rental': 'bus-rental',
  'tempo-traveller': 'bus-rental',
  'wedding-bus-rental': 'bus-rental',
  'corporate-bus-rental': 'bus-rental',
  '12-seater-tempo-traveller': 'bus-rental',
  '17-seater-tempo-traveller': 'bus-rental',
  '20-seater-tempo-traveller': 'bus-rental',
  '26-seater-bus': 'bus-rental',

  // Truck/Tempo Rental (parent: truck-tempo-rental)
  'mini-truck-rental': 'truck-tempo-rental',
  'transporter': 'truck-tempo-rental',
  'trailer-on-rent': 'truck-tempo-rental',

  // Packers & Movers (parent: packers-movers)
  'packers-and-movers': 'packers-movers',

  // Equipment Rental (parent: equipment-rental)
  'equipment-rental': 'equipment-rental',
  'jcb-on-rent': 'equipment-rental',
  'crane-on-rent': 'equipment-rental',
  'hydra-on-rent': 'equipment-rental',
  'excavator-on-rent': 'equipment-rental',
  'generator-on-rent': 'equipment-rental',
};

// List of all 8 parent service slugs
export const PARENT_SERVICE_SLUGS = [
  'bike-rental',
  'self-drive-car-rental',
  'car-rental-with-driver',
  'luxury-car-rental',
  'bus-rental',
  'truck-tempo-rental',
  'packers-movers',
  'equipment-rental',
] as const;

export type ParentServiceSlug = typeof PARENT_SERVICE_SLUGS[number];

/**
 * Get the parent service slug for content inheritance
 * @param slug - The sub-service or service slug
 * @returns The parent service slug, or the original slug if no mapping exists
 */
export function getParentServiceSlug(slug: string): string {
  return SERVICE_PARENT_MAP[slug] || slug;
}

/**
 * Check if a slug is a sub-service (has a different parent)
 */
export function isSubService(slug: string): boolean {
  const parent = SERVICE_PARENT_MAP[slug];
  return !!parent && parent !== slug;
}

/**
 * Get all sub-service slugs for a parent service
 */
export function getSubServices(parentSlug: string): string[] {
  return Object.entries(SERVICE_PARENT_MAP)
    .filter(([_, parent]) => parent === parentSlug)
    .map(([subSlug]) => subSlug);
}
