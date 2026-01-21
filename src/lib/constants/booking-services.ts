// 8 Main Services with Sub-Services (from database seed)
// This is the single source of truth for all services in the system

export type FlowType = 'BROWSE_FIRST' | 'TRIP_FIRST' | 'QUOTE_BASED';

// Database Service IDs - Use these for all backend queries
export const SERVICE_IDS = {
  BIKE_RENTAL: 'SVC_1',
  SELF_DRIVE: 'SVC_2',
  BUS_RENTAL: 'SVC_3',
  TRUCK_RENTAL: 'SVC_4',
  CAR_RENTAL: 'SVC_5',
  PACKERS_MOVERS: 'SVC_6',
  EQUIPMENT_RENTAL: 'SVC_7',
  LUXURY_CAR: 'SVC_8',
} as const;

// Get service ID by slug (for APIs that receive slug from URL)
export const getServiceIdBySlug = (slug: string): string | null => {
  const slugToIdMap: Record<string, string> = {
    'bike-rental': SERVICE_IDS.BIKE_RENTAL,
    'bike-on-rent': SERVICE_IDS.BIKE_RENTAL,
    'self-drive-car-rental': SERVICE_IDS.SELF_DRIVE,
    'bus-rental': SERVICE_IDS.BUS_RENTAL,
    'truck-rental': SERVICE_IDS.TRUCK_RENTAL,
    'car-rental': SERVICE_IDS.CAR_RENTAL,
    'packers-and-movers': SERVICE_IDS.PACKERS_MOVERS,
    'packers-movers': SERVICE_IDS.PACKERS_MOVERS,
    'equipment-rental': SERVICE_IDS.EQUIPMENT_RENTAL,
    'luxury-car-rental': SERVICE_IDS.LUXURY_CAR,
  };
  return slugToIdMap[slug] || null;
};

export interface SubService {
  name: string;
  slug: string;
  description?: string;
}

export interface BookingService {
  id: number;
  name: string;
  slug: string;
  icon: string;
  flowType: FlowType;
  description: string;
  baseUrl: string;
  subServices: SubService[];
  specFields: SpecField[];
}

export interface SpecField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[];
}

// Service-specific specification fields for fleet
export const SERVICE_SPEC_FIELDS: Record<string, SpecField[]> = {
  'self-drive-car-rental': [
    { name: 'engine', label: 'Engine CC', type: 'text', required: true },
    { name: 'mileage', label: 'Mileage (km/l)', type: 'text' },
    { name: 'seating', label: 'Seating Capacity', type: 'number', required: true },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic', 'Manual/Automatic'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] },
    { name: 'bootSpace', label: 'Boot Space (L)', type: 'number' },
  ],
  'bike-rental': [
    { name: 'engine', label: 'Engine CC', type: 'text', required: true },
    { name: 'mileage', label: 'Mileage (km/l)', type: 'text' },
    { name: 'seating', label: 'Seating', type: 'number', required: true },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Electric'] },
  ],
  'car-rental-with-driver': [
    { name: 'engine', label: 'Engine CC', type: 'text', required: true },
    { name: 'mileage', label: 'Mileage (km/l)', type: 'text' },
    { name: 'seating', label: 'Seating Capacity', type: 'number', required: true },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'CNG'] },
    { name: 'ac', label: 'AC Type', type: 'select', options: ['AC', 'Non-AC'] },
  ],
  'luxury-car-rental': [
    { name: 'engine', label: 'Engine CC', type: 'text', required: true },
    { name: 'horsepower', label: 'Horsepower (HP)', type: 'number' },
    { name: 'seating', label: 'Seating Capacity', type: 'number', required: true },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid'] },
    { name: 'features', label: 'Premium Features', type: 'text' },
  ],
  'bus-rental': [
    { name: 'seating', label: 'Seating Capacity', type: 'number', required: true },
    { name: 'ac', label: 'AC Type', type: 'select', options: ['AC', 'Non-AC', 'Both'], required: true },
    { name: 'busType', label: 'Bus Type', type: 'select', options: ['Mini Bus', 'Tempo Traveller', 'Standard Bus', 'Volvo', 'Luxury Coach'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'CNG'] },
    { name: 'amenities', label: 'Amenities', type: 'text' },
  ],
  'truck-tempo-rental': [
    { name: 'tonnage', label: 'Tonnage (Tons)', type: 'number', required: true },
    { name: 'capacity', label: 'Load Capacity', type: 'text', required: true },
    { name: 'length', label: 'Length (ft)', type: 'number' },
    { name: 'width', label: 'Width (ft)', type: 'number' },
    { name: 'height', label: 'Height (ft)', type: 'number' },
    { name: 'truckType', label: 'Truck Type', type: 'select', options: ['Mini Truck', 'Tempo', 'Open Truck', 'Closed Container', 'Trailer'] },
  ],
  'packers-movers': [
    { name: 'serviceType', label: 'Service Type', type: 'select', options: ['Local', 'Domestic', 'Office', 'Vehicle Transport', 'Storage'], required: true },
    { name: 'vehicleSize', label: 'Vehicle Size', type: 'select', options: ['Mini', 'Small', 'Medium', 'Large', 'Extra Large'] },
    { name: 'capacity', label: 'Capacity (BHK)', type: 'text' },
  ],
  'equipment-rental': [
    { name: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Construction', 'Industrial', 'Event', 'AV', 'Agricultural', 'Medical'], required: true },
    { name: 'capacity', label: 'Capacity/Power', type: 'text' },
    { name: 'weight', label: 'Weight (kg)', type: 'number' },
    { name: 'brand', label: 'Brand', type: 'text' },
    { name: 'model', label: 'Model', type: 'text' },
  ],
};

export const BOOKING_SERVICES: BookingService[] = [
  {
    id: 1,
    name: 'Self-Drive Car Rental',
    slug: 'self-drive-car-rental',
    icon: 'Car',
    flowType: 'BROWSE_FIRST',
    description: 'Rent a car and drive yourself',
    baseUrl: '/self-drive-car-rental',
    subServices: [
      { name: 'Hatchback', slug: 'self-drive-hatchback', description: 'Compact cars for city driving' },
      { name: 'Sedan', slug: 'self-drive-sedan', description: 'Comfortable sedans for long drives' },
      { name: 'SUV', slug: 'self-drive-suv', description: 'Spacious SUVs for family trips' },
      { name: 'MUV/MPV', slug: 'self-drive-muv', description: 'Multi-utility vehicles for groups' },
    ],
    specFields: SERVICE_SPEC_FIELDS['self-drive-car-rental'],
  },
  {
    id: 2,
    name: 'Bike Rental',
    slug: 'bike-rental',
    icon: 'Bike',
    flowType: 'BROWSE_FIRST',
    description: 'Rent bikes and scooters',
    baseUrl: '/bike-rental',
    subServices: [
      { name: 'Scooter', slug: 'scooter-rental', description: 'Easy to ride scooters' },
      { name: 'Bike (100-150cc)', slug: 'bike-100-150cc', description: 'Entry-level bikes' },
      { name: 'Bike (150-200cc)', slug: 'bike-150-200cc', description: 'Mid-range bikes' },
      { name: 'Sports Bike', slug: 'sports-bike-rental', description: 'High-performance sports bikes' },
      { name: 'Cruiser', slug: 'cruiser-bike-rental', description: 'Classic cruiser bikes' },
    ],
    specFields: SERVICE_SPEC_FIELDS['bike-rental'],
  },
  {
    id: 3,
    name: 'Car Rental',
    slug: 'car-rental',
    icon: 'CarTaxiFront',
    flowType: 'TRIP_FIRST',
    description: 'Hire a car with professional driver',
    baseUrl: '/car-rental',
    subServices: [
      { name: 'Hatchback', slug: 'car-rental-hatchback', description: 'Budget-friendly with driver' },
      { name: 'Sedan', slug: 'car-rental-sedan', description: 'Comfortable sedan with driver' },
      { name: 'SUV', slug: 'car-rental-suv', description: 'Premium SUV with driver' },
      { name: 'MUV/MPV', slug: 'car-rental-muv', description: 'Group travel with driver' },
    ],
    specFields: SERVICE_SPEC_FIELDS['car-rental-with-driver'],
  },
  {
    id: 4,
    name: 'Luxury Car Rental',
    slug: 'luxury-car-rental',
    icon: 'Crown',
    flowType: 'BROWSE_FIRST',
    description: 'Premium luxury car experiences',
    baseUrl: '/luxury-car-rental',
    subServices: [
      { name: 'Luxury Sedan', slug: 'luxury-sedan', description: 'Mercedes, BMW, Audi sedans' },
      { name: 'Luxury SUV', slug: 'luxury-suv', description: 'Premium SUVs like Range Rover' },
      { name: 'Limousine', slug: 'limousine-rental', description: 'Stretch limos for events' },
      { name: 'Convertible', slug: 'convertible-rental', description: 'Open-top sports cars' },
      { name: 'Vintage/Classic', slug: 'vintage-car-rental', description: 'Classic cars for weddings' },
    ],
    specFields: SERVICE_SPEC_FIELDS['luxury-car-rental'],
  },
  {
    id: 5,
    name: 'Bus Rental',
    slug: 'bus-rental',
    icon: 'Bus',
    flowType: 'TRIP_FIRST',
    description: 'Rent buses for group travel',
    baseUrl: '/bus-rental',
    subServices: [
      { name: 'Mini Bus (12-15 Seater)', slug: 'mini-bus-rental', description: 'Small groups' },
      { name: 'Tempo Traveller (17-26 Seater)', slug: 'tempo-traveller-rental', description: 'Medium groups' },
      { name: 'Bus (30-45 Seater)', slug: 'bus-30-45-seater', description: 'Large groups' },
      { name: 'Volvo Coach (45-52 Seater)', slug: 'volvo-coach-rental', description: 'Premium buses' },
    ],
    specFields: SERVICE_SPEC_FIELDS['bus-rental'],
  },
  {
    id: 6,
    name: 'Truck/Tempo Rental',
    slug: 'truck-tempo-rental',
    icon: 'Truck',
    flowType: 'QUOTE_BASED',
    description: 'Hire trucks for goods transport',
    baseUrl: '/truck-tempo-rental',
    subServices: [
      { name: 'Mini Truck (Tata Ace/Pickup)', slug: 'mini-truck-rental', description: 'Light goods' },
      { name: 'Tempo (407/709)', slug: 'tempo-rental', description: 'Medium goods' },
      { name: 'Truck (14ft/17ft/19ft/22ft)', slug: 'truck-rental', description: 'Heavy goods' },
      { name: 'Container', slug: 'container-rental', description: 'Container transport' },
      { name: 'Trailer', slug: 'trailer-rental', description: 'Heavy machinery' },
    ],
    specFields: SERVICE_SPEC_FIELDS['truck-tempo-rental'],
  },
  {
    id: 7,
    name: 'Packers & Movers',
    slug: 'packers-movers',
    icon: 'Package',
    flowType: 'QUOTE_BASED',
    description: 'Complete relocation services',
    baseUrl: '/packers-movers',
    subServices: [
      { name: 'Local Shifting (Within City)', slug: 'local-shifting', description: 'Same city relocation' },
      { name: 'Domestic Relocation', slug: 'domestic-relocation', description: 'Inter-city moving' },
      { name: 'Office/Commercial Shifting', slug: 'office-shifting', description: 'Office relocation' },
      { name: 'Vehicle Transportation', slug: 'vehicle-transport', description: 'Car/Bike transport' },
      { name: 'Storage/Warehouse', slug: 'storage-warehouse', description: 'Temporary storage' },
    ],
    specFields: SERVICE_SPEC_FIELDS['packers-movers'],
  },
  {
    id: 8,
    name: 'Equipment Rental',
    slug: 'equipment-rental',
    icon: 'Wrench',
    flowType: 'QUOTE_BASED',
    description: 'Rent construction & event equipment',
    baseUrl: '/equipment-rental',
    subServices: [
      { name: 'Construction Equipment', slug: 'construction-equipment', description: 'JCB, Cranes, etc.' },
      { name: 'Industrial Equipment', slug: 'industrial-equipment', description: 'Factory machinery' },
      { name: 'Event Equipment', slug: 'event-equipment', description: 'Stages, tents, etc.' },
      { name: 'Audio/Visual Equipment', slug: 'av-equipment', description: 'Sound, lighting, screens' },
      { name: 'Agricultural Equipment', slug: 'agricultural-equipment', description: 'Tractors, harvesters' },
      { name: 'Medical Equipment', slug: 'medical-equipment', description: 'Hospital equipment' },
    ],
    specFields: SERVICE_SPEC_FIELDS['equipment-rental'],
  },
];

// Helper functions
export const getServiceBySlug = (slug: string): BookingService | undefined => {
  return BOOKING_SERVICES.find((s) => s.slug === slug);
};

export const getServiceById = (id: number): BookingService | undefined => {
  return BOOKING_SERVICES.find((s) => s.id === id);
};

export const getSubServiceBySlug = (serviceSlug: string, subSlug: string): SubService | undefined => {
  const service = getServiceBySlug(serviceSlug);
  return service?.subServices.find((s) => s.slug === subSlug);
};

export const getServicesByFlowType = (flowType: FlowType): BookingService[] => {
  return BOOKING_SERVICES.filter((s) => s.flowType === flowType);
};

// Flow type display configuration
export const FLOW_TYPE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  BROWSE_FIRST: {
    label: 'Browse First',
    color: 'bg-blue-100 text-blue-700',
    description: 'Customer browses vehicles first, then selects dates',
  },
  TRIP_FIRST: {
    label: 'Trip First',
    color: 'bg-green-100 text-green-700',
    description: 'Customer enters trip details first, then sees available options',
  },
  QUOTE_BASED: {
    label: 'Quote Based',
    color: 'bg-amber-100 text-amber-700',
    description: 'Customer submits requirements, receives quotes from vendors',
  },
};

// Trip types for services
export const TRIP_TYPES = [
  { id: 1, name: 'One Way', slug: 'one-way', description: 'Point A to Point B' },
  { id: 2, name: 'Round Trip', slug: 'round-trip', description: 'Return to starting point' },
  { id: 3, name: 'Airport Transfer', slug: 'airport-transfer', description: 'To/from airport' },
  { id: 4, name: 'Local (Hourly)', slug: 'local-hourly', description: 'Hourly rental within city' },
  { id: 5, name: 'Outstation', slug: 'outstation', description: 'Inter-city travel' },
  { id: 6, name: 'Multi-City', slug: 'multi-city', description: 'Multiple destinations' },
];

// Duration options
export const DURATION_OPTIONS = [
  { id: 1, name: 'Hourly', slug: 'hourly', label: 'Per Hour' },
  { id: 2, name: 'Daily', slug: 'daily', label: 'Per Day' },
  { id: 3, name: 'Weekly', slug: 'weekly', label: 'Per Week' },
  { id: 4, name: 'Monthly', slug: 'monthly', label: 'Per Month' },
];

// Export legacy SERVICES constant for backward compatibility
export const SERVICES = BOOKING_SERVICES.map((s) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  description: s.description,
  icon: s.icon,
  base_url: s.baseUrl,
}));
