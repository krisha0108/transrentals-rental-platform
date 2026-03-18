// Central configuration for all services with flow types
// Flow Types:
// - BROWSE_FIRST: User browses vehicles first → Selects → Enter trip details (Bike, Self-Drive)
// - TRIP_FIRST: User enters trip details first → See options (Car with Driver, Luxury)
// - QUOTE_BASED: User enters requirements → Gets quotes from vendors (Bus, Truck, Packers, Equipment)

export type FlowType = 'BROWSE_FIRST' | 'TRIP_FIRST' | 'QUOTE_BASED';

export interface ServiceConfig {
  serviceName: string;
  serviceType: string;
  flowType: FlowType;
  vehicleModelName?: string; // Specific model name for model-specific pages (e.g. "Seltos", "KTM")
  subServices?: { label: string; value: string }[];
}

export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  // ============= BROWSE_FIRST SERVICES =============
  // User browses vehicles first, then enters trip details

  // BIKE SERVICES - BROWSE_FIRST
  'bike-on-rent': {
    serviceName: 'Bike Rental',
    serviceType: 'bike-on-rent',
    flowType: 'BROWSE_FIRST',
    subServices: [
      { label: '🏍️ Regular Bike', value: 'regular' },
      { label: '🛵 Activa / Scooter', value: 'activa' },
      { label: '👑 Royal Enfield', value: 'royal-enfield' },
      { label: '🏁 Sports Bike', value: 'sports' },
      { label: '⚡ KTM / Premium', value: 'ktm' },
    ],
  },
  'activa-on-rent': {
    serviceName: 'Activa / Scooter Rental',
    serviceType: 'activa-on-rent',
    vehicleModelName: 'Activa',
    flowType: 'BROWSE_FIRST',
  },
  'royal-enfield-on-rent': {
    serviceName: 'Royal Enfield Rental',
    serviceType: 'royal-enfield-on-rent',
    vehicleModelName: 'Royal Enfield',
    flowType: 'BROWSE_FIRST',
  },
  'ktm-on-rent': {
    serviceName: 'KTM Rental',
    serviceType: 'bike-ktm',
    vehicleModelName: 'KTM',
    flowType: 'BROWSE_FIRST',
  },
  'electric-scooter-rental': {
    serviceName: 'Electric Scooter Rental',
    serviceType: 'bike-electric-scooter',
    vehicleModelName: 'Electric Scooter',
    flowType: 'BROWSE_FIRST',
  },
  'monthly-bike-rental': {
    serviceName: 'Monthly Bike Rental',
    serviceType: 'monthly-bike-rental',
    flowType: 'BROWSE_FIRST',
  },
  // BIKE MODEL-SPECIFIC PAGES - BROWSE_FIRST
  'apache-on-rent': {
    serviceName: 'Apache on Rent',
    serviceType: 'bike-apache',
    vehicleModelName: 'Apache',
    flowType: 'BROWSE_FIRST',
  },
  'himalayan-on-rent': {
    serviceName: 'Royal Enfield Himalayan Rental',
    serviceType: 'bike-himalayan',
    vehicleModelName: 'Royal Enfield Himalayan',
    flowType: 'BROWSE_FIRST',
  },
  'pulsar-on-rent': {
    serviceName: 'Pulsar on Rent',
    serviceType: 'bike-pulsar',
    vehicleModelName: 'Pulsar',
    flowType: 'BROWSE_FIRST',
  },
  'splendor-on-rent': {
    serviceName: 'Splendor on Rent',
    serviceType: 'bike-splendor',
    vehicleModelName: 'Splendor',
    flowType: 'BROWSE_FIRST',
  },
  'bike-tours': {
    serviceName: 'Bike Tours',
    serviceType: 'bike-tours',
    flowType: 'BROWSE_FIRST',
  },
  'bike-trips': {
    serviceName: 'Bike Trips',
    serviceType: 'bike-trips',
    flowType: 'BROWSE_FIRST',
  },

  // SELF-DRIVE CAR - BROWSE_FIRST
  'self-drive-car-rentals': {
    serviceName: 'Self Drive Car Rentals',
    serviceType: 'self-drive-car-rentals',
    flowType: 'BROWSE_FIRST',
    subServices: [
      { label: '🚗 Hatchback (Swift/i20)', value: 'hatchback' },
      { label: '🚗 Sedan (City/Verna)', value: 'sedan' },
      { label: '🚙 SUV (Creta/Seltos)', value: 'suv' },
      { label: '🏎️ Luxury Car', value: 'luxury' },
    ],
  },
  'self-drive-hatchback-rental': {
    serviceName: 'Self Drive Hatchback Rental',
    serviceType: 'self-drive-hatchback',
    flowType: 'BROWSE_FIRST',
  },
  'self-drive-sedan-rental': {
    serviceName: 'Self Drive Sedan Rental',
    serviceType: 'self-drive-sedan',
    flowType: 'BROWSE_FIRST',
  },
  'self-drive-suv-rental': {
    serviceName: 'Self Drive SUV Rental',
    serviceType: 'self-drive-suv',
    flowType: 'BROWSE_FIRST',
  },

  // VEHICLE-SPECIFIC SELF-DRIVE PAGES - BROWSE_FIRST
  // These are fleet/model-specific pages that should create self-drive quote requests
  'seltos-on-rent': {
    serviceName: 'Seltos on Rent',
    serviceType: 'self-drive-seltos',
    vehicleModelName: 'Seltos',
    flowType: 'BROWSE_FIRST',
  },
  'creta-on-rent': {
    serviceName: 'Creta on Rent',
    serviceType: 'self-drive-creta',
    vehicleModelName: 'Creta',
    flowType: 'BROWSE_FIRST',
  },
  'xuv700-on-rent': {
    serviceName: 'XUV700 on Rent',
    serviceType: 'self-drive-xuv700',
    vehicleModelName: 'XUV700',
    flowType: 'BROWSE_FIRST',
  },
  'scorpio-on-rent': {
    serviceName: 'Scorpio on Rent',
    serviceType: 'self-drive-scorpio',
    vehicleModelName: 'Scorpio',
    flowType: 'BROWSE_FIRST',
  },
  'innova-on-rent': {
    serviceName: 'Innova on Rent',
    serviceType: 'self-drive-innova',
    vehicleModelName: 'Innova Crysta',
    flowType: 'BROWSE_FIRST',
  },
  'fortuner-on-rent': {
    serviceName: 'Fortuner on Rent',
    serviceType: 'self-drive-fortuner',
    vehicleModelName: 'Fortuner',
    flowType: 'BROWSE_FIRST',
  },
  'swift-on-rent': {
    serviceName: 'Swift on Rent',
    serviceType: 'self-drive-swift',
    vehicleModelName: 'Swift',
    flowType: 'BROWSE_FIRST',
  },

  // ============= TRIP_FIRST SERVICES =============
  // User enters trip details first, then sees available options

  // CAR WITH DRIVER - TRIP_FIRST
  'car-rental': {
    serviceName: 'Car Rental',
    serviceType: 'car-rental',
    flowType: 'TRIP_FIRST',
    // Trip type options shown first
  },
  'one-way-car-rental': {
    serviceName: 'One Way Car Rental',
    serviceType: 'one-way-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (Dzire/Etios)', value: 'sedan' },
      { label: '🚙 SUV (Innova/Ertiga)', value: 'suv' },
      { label: '🏎️ Luxury Car', value: 'luxury' },
    ],
  },
  'outstation-cab': {
    serviceName: 'Outstation Cab',
    serviceType: 'outstation-cab',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
      { label: '🚐 Tempo Traveller', value: 'tempo' },
    ],
  },
  'outstation-car-rental': {
    serviceName: 'Outstation Car Rental',
    serviceType: 'outstation-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
      { label: '🏎️ Luxury Car', value: 'luxury' },
    ],
  },
  'airport-transfer': {
    serviceName: 'Airport Transfer',
    serviceType: 'airport-transfer',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
    ],
  },
  'local-taxi': {
    serviceName: 'Local Taxi',
    serviceType: 'local-taxi',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
    ],
  },
  'monthly-car-rental': {
    serviceName: 'Monthly Car Rental',
    serviceType: 'monthly-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (Monthly)', value: 'sedan' },
      { label: '🚙 SUV (Monthly)', value: 'suv' },
      { label: '🏎️ Luxury Car (Monthly)', value: 'luxury' },
    ],
  },
  'corporate-car-rental': {
    serviceName: 'Corporate Car Rental',
    serviceType: 'corporate-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Executive Sedan', value: 'sedan' },
      { label: '🚙 Executive SUV', value: 'suv' },
      { label: '🏎️ Luxury Car', value: 'luxury' },
    ],
  },
  'chauffeur-service': {
    serviceName: 'Chauffeur Service',
    serviceType: 'chauffeur-service',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan with Chauffeur', value: 'sedan' },
      { label: '🚙 SUV with Chauffeur', value: 'suv' },
      { label: '🏎️ Luxury Car with Chauffeur', value: 'luxury' },
    ],
  },
  'hourly-car-rental': {
    serviceName: 'Hourly Car Rental',
    serviceType: 'hourly-car-rental',
    flowType: 'TRIP_FIRST',
  },
  'round-trip': {
    serviceName: 'Round Trip Cab',
    serviceType: 'outstation-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
      { label: '🚐 Tempo Traveller', value: 'tempo' },
    ],
  },
  'one-way-cab': {
    serviceName: 'One Way Cab',
    serviceType: 'one-way-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🚗 Sedan (4 seater)', value: 'sedan' },
      { label: '🚙 SUV (6-7 seater)', value: 'suv' },
      { label: '🏎️ Luxury Car', value: 'luxury' },
    ],
  },

  // LUXURY CAR - TRIP_FIRST (with broadcast to vendors)
  'luxury-car-rental': {
    serviceName: 'Luxury Car Rental',
    serviceType: 'luxury-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🏎️ Luxury Sedan (Mercedes/BMW)', value: 'luxury-sedan' },
      { label: '🚙 Luxury SUV (Audi/Range Rover)', value: 'luxury-suv' },
      { label: '🎩 Premium Sedan (Camry/Accord)', value: 'premium-sedan' },
      { label: '🏁 Sports Car', value: 'sports-car' },
    ],
  },
  'wedding-car-rental': {
    serviceName: 'Wedding Car Rental',
    serviceType: 'wedding-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🏎️ Luxury Sedan (Mercedes/BMW)', value: 'luxury-sedan' },
      { label: '🚙 Luxury SUV (Audi Q7/Range Rover)', value: 'luxury-suv' },
      { label: '🎩 Vintage Car (Ambassador/Fiat)', value: 'vintage' },
      { label: '🚐 Guest Transport (Bus/Tempo)', value: 'guest-transport' },
    ],
  },
  'sports-car-rental': {
    serviceName: 'Sports Car Rental',
    serviceType: 'sports-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🏁 Sports Car (Ferrari/Lamborghini)', value: 'supercar' },
      { label: '🏎️ Performance Car (Porsche/BMW M)', value: 'performance' },
      { label: '🎯 Luxury Sports (Audi RS/Mercedes AMG)', value: 'luxury-sports' },
    ],
  },
  'vintage-car-rental': {
    serviceName: 'Vintage Car Rental',
    serviceType: 'vintage-car-rental',
    flowType: 'TRIP_FIRST',
    subServices: [
      { label: '🎩 Classic Ambassador', value: 'ambassador' },
      { label: '🚗 Vintage Fiat', value: 'fiat' },
      { label: '👑 Royal Vintage Cars', value: 'royal' },
    ],
  },

  // ============= QUOTE_BASED SERVICES =============
  // User enters requirements → Gets quotes from multiple vendors

  // BUS SERVICES - QUOTE_BASED
  'bus-rental': {
    serviceName: 'Bus Rental',
    serviceType: 'bus-rental',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚐 Tempo Traveller (12-20 seats)', value: 'tempo-traveller' },
      { label: '🚌 Mini Bus (20-26 seats)', value: 'mini-bus' },
      { label: '🚌 Standard Bus (27-35 seats)', value: 'standard-bus' },
      { label: '🚌 Luxury Coach (40-50 seats)', value: 'luxury-coach' },
    ],
  },
  'tempo-traveller': {
    serviceName: 'Tempo Traveller',
    serviceType: 'tempo-traveller',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚐 12 Seater Tempo', value: '12-seater' },
      { label: '🚐 14 Seater Tempo', value: '14-seater' },
      { label: '🚐 17 Seater Tempo', value: '17-seater' },
      { label: '🚐 20 Seater Tempo', value: '20-seater' },
    ],
  },
  '12-seater-tempo-traveller': {
    serviceName: '12 Seater Tempo Traveller',
    serviceType: 'tempo-12seater',
    flowType: 'QUOTE_BASED',
  },
  '17-seater-tempo-traveller': {
    serviceName: '17 Seater Tempo Traveller',
    serviceType: 'tempo-17seater',
    flowType: 'QUOTE_BASED',
  },
  '20-seater-tempo-traveller': {
    serviceName: '20 Seater Tempo Traveller',
    serviceType: 'tempo-20seater',
    flowType: 'QUOTE_BASED',
  },
  '26-seater-bus': {
    serviceName: '26 Seater Bus',
    serviceType: 'bus-26seater',
    flowType: 'QUOTE_BASED',
  },
  'corporate-bus-rental': {
    serviceName: 'Corporate Bus Rental',
    serviceType: 'corporate-bus-rental',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚌 Mini Bus (12-20 seats)', value: 'mini-bus' },
      { label: '🚌 Standard Bus (25-35 seats)', value: 'standard-bus' },
      { label: '🚐 Tempo Traveller', value: 'tempo-traveller' },
      { label: '🎉 Luxury Coach (40+ seats)', value: 'luxury-coach' },
    ],
  },
  'wedding-bus-rental': {
    serviceName: 'Wedding Bus Rental',
    serviceType: 'wedding-bus-rental',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚌 Standard Bus (25-35 seats)', value: 'standard-bus' },
      { label: '🎉 Luxury Coach (40+ seats)', value: 'luxury-coach' },
      { label: '🚐 Tempo Traveller (12-17 seats)', value: 'tempo-traveller' },
    ],
  },

  // TRUCK/TRANSPORTER - QUOTE_BASED
  'transporter': {
    serviceName: 'Transporter',
    serviceType: 'transporter',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚚 Mini Truck (Tata Ace/Pickup)', value: 'mini-truck' },
      { label: '🚚 Medium Truck (14-20 ton)', value: 'medium-truck' },
      { label: '🚛 Heavy Truck (20-32 ton)', value: 'heavy-truck' },
      { label: '🚛 Trailer (32+ ton)', value: 'trailer' },
    ],
  },
  'mini-truck-rental': {
    serviceName: 'Mini Truck Rental',
    serviceType: 'mini-truck-rental',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚚 Tata Ace', value: 'tata-ace' },
      { label: '🚚 Mahindra Pickup', value: 'mahindra-pickup' },
      { label: '🚚 Ashok Leyland Dost', value: 'ashok-leyland' },
    ],
  },
  'trailer-on-rent': {
    serviceName: 'Trailer Rental',
    serviceType: 'trailer-on-rent',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚛 20 Feet Trailer', value: '20ft' },
      { label: '🚛 28 Feet Trailer', value: '28ft' },
      { label: '🚛 32 Feet Trailer', value: '32ft' },
      { label: '🚛 40 Feet Trailer', value: '40ft' },
    ],
  },

  // PACKERS & MOVERS - QUOTE_BASED
  'packers-and-movers': {
    serviceName: 'Packers & Movers',
    serviceType: 'packers-and-movers',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🏠 Home Shifting', value: 'home' },
      { label: '🏢 Office Shifting', value: 'office' },
      { label: '🚗 Vehicle Transport', value: 'vehicle' },
    ],
  },

  // EQUIPMENT RENTAL - QUOTE_BASED
  'equipment-rental': {
    serviceName: 'Equipment Rental',
    serviceType: 'equipment-rental',
    flowType: 'QUOTE_BASED',
    subServices: [
      { label: '🚜 JCB / Backhoe', value: 'jcb' },
      { label: '🏗️ Crane', value: 'crane' },
      { label: '🚧 Excavator', value: 'excavator' },
      { label: '⚡ Generator', value: 'generator' },
      { label: '🏗️ Hydra', value: 'hydra' },
    ],
  },
  'jcb-on-rent': {
    serviceName: 'JCB Rental',
    serviceType: 'jcb-on-rent',
    flowType: 'QUOTE_BASED',
  },
  'crane-on-rent': {
    serviceName: 'Crane Rental',
    serviceType: 'equipment-crane',
    flowType: 'QUOTE_BASED',
  },
  'excavator-on-rent': {
    serviceName: 'Excavator Rental',
    serviceType: 'equipment-excavator',
    flowType: 'QUOTE_BASED',
  },
  'generator-on-rent': {
    serviceName: 'Generator Rental',
    serviceType: 'equipment-generator',
    flowType: 'QUOTE_BASED',
  },
  'hydra-on-rent': {
    serviceName: 'Hydra Rental',
    serviceType: 'equipment-hydra',
    flowType: 'QUOTE_BASED',
  },
};

// Car-with-driver service slugs that don't contain 'car' in their serviceType
const CAR_DRIVER_EXTRA_TYPES = new Set(['airport-transfer', 'local-taxi', 'outstation-cab']);

/**
 * Returns true if this service type is a "car with driver" service.
 * Covers services whose serviceType doesn't literally contain 'car'
 * (e.g. chauffeur-service, local-taxi, outstation-cab).
 */
export function isCarWithDriverServiceType(serviceType: string): boolean {
  const st = serviceType.toLowerCase();
  if (CAR_DRIVER_EXTRA_TYPES.has(st)) return true;
  if (st.includes('chauffeur')) return true;
  // Standard car-with-driver (excludes self-drive and luxury)
  if (
    st.includes('car') &&
    !st.includes('selfdrive') &&
    !st.includes('self-drive') &&
    !st.includes('luxury') &&
    !st.includes('wedding-car') &&
    !st.includes('vintage') &&
    !st.includes('sports-car')
  ) return true;
  return false;
}

// Helper to get flow type from service type
export function getFlowType(serviceType: string): FlowType {
  // Check exact match first
  if (SERVICE_CONFIGS[serviceType]) {
    return SERVICE_CONFIGS[serviceType].flowType;
  }

  // Check by pattern matching
  const st = serviceType.toLowerCase();

  // BROWSE_FIRST patterns
  if (st.includes('bike') || st.includes('activa') || st.includes('scooter') ||
      st.includes('royal-enfield') || st.includes('ktm') || st.includes('pulsar') ||
      st.includes('apache') || st.includes('splendor') || st.includes('himalayan') ||
      st.includes('selfdrive') || st.includes('self-drive')) {
    return 'BROWSE_FIRST';
  }

  // QUOTE_BASED patterns
  if (st.includes('bus') || st.includes('tempo') ||
      st.includes('truck') || st.includes('transporter') || st.includes('trailer') ||
      st.includes('packers') || st.includes('movers') ||
      st.includes('equipment') || st.includes('jcb') || st.includes('crane') ||
      st.includes('excavator') || st.includes('generator') || st.includes('hydra')) {
    return 'QUOTE_BASED';
  }

  // Default to TRIP_FIRST (car with driver, luxury, etc.)
  return 'TRIP_FIRST';
}

// Helper function to get service config from pathname
export function getServiceFromPath(pathname: string): ServiceConfig | null {
  // Remove leading slash and trailing slash
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');

  // For location-based routes like /service-name/city-name
  const pathParts = cleanPath.split('/');
  const servicePath = pathParts[0];

  // Check if we have this service
  if (SERVICE_CONFIGS[servicePath]) {
    return SERVICE_CONFIGS[servicePath];
  }

  return null;
}

// Helper to extract location from pathname
export function getLocationFromPath(pathname: string): string | undefined {
  const pathParts = pathname.split('/').filter(Boolean);

  // Handle fleet pages: /fleet/[vehicle]/[location]
  if (pathParts[0] === 'fleet') {
    if (pathParts.length >= 3) {
      const locationSlug = pathParts[2];
      return locationSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return undefined;
  }

  // For other service pages: /service-name/city-name
  if (pathParts.length >= 2) {
    const locationSlug = pathParts[1];
    return locationSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return undefined;
}

// Helper to extract vehicle name from pathname (for fleet pages)
export function getVehicleNameFromPath(pathname: string): string | undefined {
  const pathParts = pathname.split('/').filter(Boolean);

  // Only for fleet pages: /fleet/[vehicle-name] or /fleet/[vehicle-name]/[location]
  if (pathParts[0] === 'fleet' && pathParts.length >= 2) {
    const vehicleSlug = pathParts[1];
    return vehicleSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return undefined;
}
