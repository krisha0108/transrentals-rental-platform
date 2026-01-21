/**
 * Service Configuration
 * Defines which services are hub-based (self-drive/bike) vs city-wide (all others)
 */

export type ServiceType = 'hub-based' | 'city-wide';

export interface ServiceConfig {
  slug: string;
  name: string;
  type: ServiceType;
  category: 'car' | 'bike' | 'bus' | 'cab' | 'commercial' | 'moving';
  startingPrice?: string;
  priceUnit?: string;
}

// Hub-based services - Require specific pickup/drop points
export const HUB_BASED_SERVICES: ServiceConfig[] = [
  { slug: 'self-drive-car-rentals', name: 'Self Drive Car Rental', type: 'hub-based', category: 'car', startingPrice: '999', priceUnit: '/day' },
  { slug: 'car-rental', name: 'Car Rental', type: 'hub-based', category: 'car', startingPrice: '999', priceUnit: '/day' },
  { slug: 'bike-on-rent', name: 'Bike on Rent', type: 'hub-based', category: 'bike', startingPrice: '399', priceUnit: '/day' },
  { slug: 'royal-enfield-on-rent', name: 'Royal Enfield on Rent', type: 'hub-based', category: 'bike', startingPrice: '799', priceUnit: '/day' },
  { slug: 'activa-on-rent', name: 'Activa on Rent', type: 'hub-based', category: 'bike', startingPrice: '299', priceUnit: '/day' },
  { slug: 'sports-car-rental', name: 'Sports Car Rental', type: 'hub-based', category: 'car', startingPrice: '9999', priceUnit: '/day' },
];

// City-wide services - Available across all cities with driver
export const CITY_WIDE_SERVICES: ServiceConfig[] = [
  // Car Services (with driver)
  { slug: 'luxury-car-rental', name: 'Luxury Car Rental', type: 'city-wide', category: 'car', startingPrice: '4999', priceUnit: '/day' },
  { slug: 'corporate-car-rental', name: 'Corporate Car Rental', type: 'city-wide', category: 'car', startingPrice: '2499', priceUnit: '/day' },
  { slug: 'wedding-car-rental', name: 'Wedding Car Rental', type: 'city-wide', category: 'car', startingPrice: '4999', priceUnit: '/day' },
  { slug: 'outstation-car-rental', name: 'Outstation Car Rental', type: 'city-wide', category: 'car', startingPrice: '12', priceUnit: '/km' },
  { slug: 'one-way-car-rental', name: 'One Way Car Rental', type: 'city-wide', category: 'car', startingPrice: '9', priceUnit: '/km' },
  { slug: 'monthly-car-rental', name: 'Monthly Car Rental', type: 'city-wide', category: 'car', startingPrice: '25000', priceUnit: '/month' },
  { slug: 'vintage-car-rental', name: 'Vintage Car Rental', type: 'city-wide', category: 'car', startingPrice: '9999', priceUnit: '/day' },

  // Cab Services
  { slug: 'airport-transfer', name: 'Airport Transfer', type: 'city-wide', category: 'cab', startingPrice: '999', priceUnit: '' },
  { slug: 'local-taxi', name: 'Local Taxi', type: 'city-wide', category: 'cab', startingPrice: '1499', priceUnit: '/8hrs' },
  { slug: 'outstation-cab', name: 'Outstation Cab', type: 'city-wide', category: 'cab', startingPrice: '10', priceUnit: '/km' },
  { slug: 'chauffeur-service', name: 'Chauffeur Service', type: 'city-wide', category: 'cab', startingPrice: '2999', priceUnit: '/day' },

  // Bus Services
  { slug: 'bus-rental', name: 'Bus Rental', type: 'city-wide', category: 'bus', startingPrice: '2499', priceUnit: '/day' },
  { slug: 'tempo-traveller', name: 'Tempo Traveller', type: 'city-wide', category: 'bus', startingPrice: '18', priceUnit: '/km' },
  { slug: 'corporate-bus-rental', name: 'Corporate Bus Rental', type: 'city-wide', category: 'bus', startingPrice: '3999', priceUnit: '/day' },
  { slug: 'wedding-bus-rental', name: 'Wedding Bus Rental', type: 'city-wide', category: 'bus', startingPrice: '4999', priceUnit: '/day' },

  // Commercial Services
  { slug: 'mini-truck-rental', name: 'Mini Truck Rental', type: 'city-wide', category: 'commercial', startingPrice: '1499', priceUnit: '/trip' },
  { slug: 'transporter', name: 'Transporter', type: 'city-wide', category: 'commercial', startingPrice: '15', priceUnit: '/km' },
  { slug: 'trailer-on-rent', name: 'Trailer on Rent', type: 'city-wide', category: 'commercial', startingPrice: '4999', priceUnit: '/day' },
  { slug: 'jcb-on-rent', name: 'JCB on Rent', type: 'city-wide', category: 'commercial', startingPrice: '2999', priceUnit: '/day' },
  { slug: 'equipment-rental', name: 'Equipment Rental', type: 'city-wide', category: 'commercial', startingPrice: '999', priceUnit: '/day' },

  // Moving Services
  { slug: 'packers-and-movers', name: 'Packers & Movers', type: 'city-wide', category: 'moving', startingPrice: '4999', priceUnit: '' },
];

// All services combined
export const ALL_SERVICES: ServiceConfig[] = [...HUB_BASED_SERVICES, ...CITY_WIDE_SERVICES];

// Helper functions
export function getServiceConfig(slug: string): ServiceConfig | undefined {
  return ALL_SERVICES.find(s => s.slug === slug);
}

export function isHubBasedService(slug: string): boolean {
  return HUB_BASED_SERVICES.some(s => s.slug === slug);
}

export function isCityWideService(slug: string): boolean {
  return CITY_WIDE_SERVICES.some(s => s.slug === slug);
}

export function getServicesByCategory(category: ServiceConfig['category']): ServiceConfig[] {
  return ALL_SERVICES.filter(s => s.category === category);
}

export function getServiceType(slug: string): ServiceType {
  const service = getServiceConfig(slug);
  return service?.type || 'city-wide';
}
