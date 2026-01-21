// Luxury Car Rental Pricing Configuration
// Premium chauffeur-driven luxury vehicles

export type TripType = 'local' | 'outstation' | 'airport';
export type OutstationMode = 'one-way' | 'round-trip';
export type AirportMode = 'pickup' | 'drop';

// Local hourly packages
export const LUXURY_LOCAL_PACKAGES = [
  { id: '4hr-40km', hours: 4, km: 40, label: '4 Hrs / 40 Km' },
  { id: '8hr-80km', hours: 8, km: 80, label: '8 Hrs / 80 Km' },
  { id: '12hr-120km', hours: 12, km: 120, label: '12 Hrs / 120 Km' },
] as const;

// Luxury car category pricing
export interface LuxuryCarPricing {
  local: {
    base: number;
    perKm: number;
    perHr: number;
  };
  outstation: {
    base: number;
    perKm: number;
    driverBatta: number;
    nightCharge: number;
  };
  airport: {
    base: number;
    perKm: number;
    waitingCharge: number;
  };
}

export interface LuxuryCarCategory {
  id: string;
  name: string;
  examples: string;
  seats: number;
  bags: number;
  features: string[];
  amenities: string[];
  pricing: LuxuryCarPricing;
}

export const LUXURY_CAR_CATEGORIES: LuxuryCarCategory[] = [
  {
    id: 'luxury-sedan',
    name: 'Luxury Sedan',
    examples: 'Mercedes E-Class, BMW 5 Series, Audi A6',
    seats: 4,
    bags: 3,
    features: ['Premium Leather', 'Climate Control', 'WiFi', 'Ambient Lighting'],
    amenities: ['Water Bottles', 'Tissues', 'Mobile Charger'],
    pricing: {
      local: { base: 4999, perKm: 35, perHr: 350 },
      outstation: { base: 9999, perKm: 35, driverBatta: 800, nightCharge: 800 },
      airport: { base: 3499, perKm: 40, waitingCharge: 350 },
    },
  },
  {
    id: 'luxury-sedan-premium',
    name: 'Premium Sedan',
    examples: 'Mercedes S-Class, BMW 7 Series, Audi A8',
    seats: 4,
    bags: 3,
    features: ['Massage Seats', 'Privacy Glass', 'Executive Rear Seats', 'Premium Audio'],
    amenities: ['Champagne Service', 'Refreshments', 'Newspapers', 'WiFi Hotspot'],
    pricing: {
      local: { base: 8999, perKm: 50, perHr: 500 },
      outstation: { base: 17999, perKm: 50, driverBatta: 1200, nightCharge: 1200 },
      airport: { base: 5999, perKm: 55, waitingCharge: 500 },
    },
  },
  {
    id: 'luxury-suv',
    name: 'Luxury SUV',
    examples: 'Mercedes GLE, BMW X5, Audi Q7, Volvo XC90',
    seats: 5,
    bags: 4,
    features: ['Panoramic Roof', 'Premium Sound', 'Air Suspension', '360° Camera'],
    amenities: ['Water Bottles', 'Tissues', 'Mobile Charger', 'Umbrella'],
    pricing: {
      local: { base: 6999, perKm: 45, perHr: 450 },
      outstation: { base: 13999, perKm: 45, driverBatta: 1000, nightCharge: 1000 },
      airport: { base: 4999, perKm: 50, waitingCharge: 450 },
    },
  },
  {
    id: 'luxury-suv-premium',
    name: 'Premium SUV',
    examples: 'Range Rover, Mercedes GLS, BMW X7, Lexus LX',
    seats: 7,
    bags: 5,
    features: ['Executive Seating', 'Rear Entertainment', 'Refrigerator', 'Massage Seats'],
    amenities: ['Premium Refreshments', 'Champagne Cooler', 'Snacks', 'Reading Material'],
    pricing: {
      local: { base: 12999, perKm: 65, perHr: 650 },
      outstation: { base: 25999, perKm: 65, driverBatta: 1500, nightCharge: 1500 },
      airport: { base: 8999, perKm: 70, waitingCharge: 650 },
    },
  },
  {
    id: 'super-luxury',
    name: 'Super Luxury',
    examples: 'Rolls Royce Ghost, Bentley Flying Spur, Mercedes Maybach',
    seats: 4,
    bags: 3,
    features: ['Starlight Headliner', 'Bespoke Interior', 'Rear Lounge Seats', 'Partition Glass'],
    amenities: ['Champagne & Crystal Glasses', 'Gourmet Snacks', 'Concierge Service', 'Red Carpet'],
    pricing: {
      local: { base: 29999, perKm: 100, perHr: 1500 },
      outstation: { base: 59999, perKm: 100, driverBatta: 3000, nightCharge: 3000 },
      airport: { base: 19999, perKm: 120, waitingCharge: 1500 },
    },
  },
  {
    id: 'convertible',
    name: 'Convertible',
    examples: 'Mercedes AMG GT, BMW Z4, Porsche 911 Cabriolet',
    seats: 2,
    bags: 1,
    features: ['Retractable Roof', 'Sports Mode', 'Premium Audio', 'Wind Deflector'],
    amenities: ['Scarves', 'Sunglasses', 'Refreshments'],
    pricing: {
      local: { base: 14999, perKm: 75, perHr: 800 },
      outstation: { base: 29999, perKm: 80, driverBatta: 2000, nightCharge: 2000 },
      airport: { base: 9999, perKm: 85, waitingCharge: 800 },
    },
  },
  {
    id: 'limousine',
    name: 'Limousine',
    examples: 'Lincoln Town Car, Mercedes Pullman, Cadillac Escalade Limo',
    seats: 8,
    bags: 4,
    features: ['Extended Wheelbase', 'Party Lighting', 'Privacy Partition', 'Bar Counter'],
    amenities: ['Full Bar', 'Entertainment System', 'Karaoke', 'Red Carpet'],
    pricing: {
      local: { base: 19999, perKm: 90, perHr: 1200 },
      outstation: { base: 39999, perKm: 90, driverBatta: 2500, nightCharge: 2500 },
      airport: { base: 14999, perKm: 100, waitingCharge: 1200 },
    },
  },
  {
    id: 'vintage',
    name: 'Vintage/Classic',
    examples: 'Rolls Royce Silver Cloud, Mercedes 300SL, Jaguar E-Type',
    seats: 4,
    bags: 2,
    features: ['Classic Design', 'Restored Interior', 'White Glove Service', 'Photo Opportunity'],
    amenities: ['Champagne', 'Flowers', 'Red Carpet', 'Photography Assistance'],
    pricing: {
      local: { base: 24999, perKm: 120, perHr: 1500 },
      outstation: { base: 49999, perKm: 120, driverBatta: 3000, nightCharge: 3000 },
      airport: { base: 17999, perKm: 130, waitingCharge: 1500 },
    },
  },
];

// Pricing calculation interfaces
export interface LuxuryLocalFareResult {
  tripType: 'local';
  packageId: string;
  packageHours: number;
  packageKm: number;
  baseFare: number;
  extraKmRate: number;
  extraHrRate: number;
  total: number;
  inclusions: string[];
  exclusions: string[];
}

export interface LuxuryOutstationFareResult {
  tripType: 'outstation';
  mode: OutstationMode;
  distance: number;
  totalKm: number;
  chargeableKm: number;
  days: number;
  perKmRate: number;
  kmCharge: number;
  driverBatta: number;
  driverBattaTotal: number;
  nightCharges: number;
  total: number;
  inclusions: string[];
  exclusions: string[];
}

export interface LuxuryAirportFareResult {
  tripType: 'airport';
  mode: AirportMode;
  distance: number;
  baseFare: number;
  waitingIncluded: number;
  extraWaitingRate: number;
  total: number;
  inclusions: string[];
  exclusions: string[];
}

export type LuxuryFareResult = LuxuryLocalFareResult | LuxuryOutstationFareResult | LuxuryAirportFareResult;

// Pricing calculation functions
export function calculateLuxuryLocalFare(
  carId: string,
  packageId: string
): LuxuryLocalFareResult | null {
  const car = LUXURY_CAR_CATEGORIES.find((c) => c.id === carId);
  const pkg = LUXURY_LOCAL_PACKAGES.find((p) => p.id === packageId);

  if (!car || !pkg) return null;

  const baseFare = car.pricing.local.base;

  return {
    tripType: 'local',
    packageId: pkg.id,
    packageHours: pkg.hours,
    packageKm: pkg.km,
    baseFare,
    extraKmRate: car.pricing.local.perKm,
    extraHrRate: car.pricing.local.perHr,
    total: baseFare,
    inclusions: [
      `${pkg.hours} hours`,
      `${pkg.km} km`,
      'Fuel charges',
      'Professional chauffeur in uniform',
      'Premium refreshments',
      'Meet & greet service',
      ...car.amenities.slice(0, 2),
    ],
    exclusions: [
      `Extra km @ ₹${car.pricing.local.perKm}/km`,
      `Extra hour @ ₹${car.pricing.local.perHr}/hr`,
      'Toll charges',
      'Parking charges',
    ],
  };
}

export function calculateLuxuryOutstationFare(
  carId: string,
  mode: OutstationMode,
  distance: number,
  pickupDate: Date,
  returnDate?: Date
): LuxuryOutstationFareResult | null {
  const car = LUXURY_CAR_CATEGORIES.find((c) => c.id === carId);
  if (!car) return null;

  const days = returnDate
    ? Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalKm = mode === 'round-trip' ? distance * 2 : distance;
  const minKmPerDay = 300; // Higher minimum for luxury
  const chargeableKm = Math.max(totalKm, minKmPerDay * days);

  const kmCharge = chargeableKm * car.pricing.outstation.perKm;
  const driverBattaTotal = car.pricing.outstation.driverBatta * days;
  const nightCharges = days > 1 ? car.pricing.outstation.nightCharge * (days - 1) : 0;

  const total = kmCharge + driverBattaTotal + nightCharges;

  return {
    tripType: 'outstation',
    mode,
    distance,
    totalKm,
    chargeableKm,
    days,
    perKmRate: car.pricing.outstation.perKm,
    kmCharge,
    driverBatta: car.pricing.outstation.driverBatta,
    driverBattaTotal,
    nightCharges,
    total,
    inclusions: [
      'Fuel charges',
      'Professional chauffeur in uniform',
      'Premium refreshments',
      'Night halt charges (if applicable)',
      ...car.amenities.slice(0, 2),
    ],
    exclusions: [
      `Extra km @ ₹${car.pricing.outstation.perKm}/km (after ${minKmPerDay}km/day)`,
      'Toll charges',
      'State permit charges',
      'Parking charges',
      'Entry fees',
    ],
  };
}

export function calculateLuxuryAirportFare(
  carId: string,
  mode: AirportMode,
  distance: number = 40
): LuxuryAirportFareResult | null {
  const car = LUXURY_CAR_CATEGORIES.find((c) => c.id === carId);
  if (!car) return null;

  const baseFare = car.pricing.airport.base;

  return {
    tripType: 'airport',
    mode,
    distance,
    baseFare,
    waitingIncluded: 60, // 60 minutes waiting for luxury
    extraWaitingRate: car.pricing.airport.waitingCharge,
    total: baseFare,
    inclusions: [
      'Fuel charges',
      'Professional chauffeur in uniform',
      '60 mins waiting at airport',
      'Meet & greet with name board',
      'Flight tracking',
      'Assistance with luggage',
      'Refreshments',
    ],
    exclusions: [
      `Extra waiting @ ₹${car.pricing.airport.waitingCharge}/hr`,
      'Toll charges',
      'Parking charges',
    ],
  };
}

// Helper functions
export function getLuxuryCarCategory(carId: string): LuxuryCarCategory | undefined {
  return LUXURY_CAR_CATEGORIES.find((c) => c.id === carId);
}

export function getLuxuryLocalPackage(packageId: string) {
  return LUXURY_LOCAL_PACKAGES.find((p) => p.id === packageId);
}

// Premium add-ons for luxury bookings
export const LUXURY_ADDONS = [
  { id: 'champagne', name: 'Champagne Service', price: 2999, description: 'Premium champagne with crystal glasses' },
  { id: 'flowers', name: 'Flower Bouquet', price: 999, description: 'Fresh flower arrangement in the car' },
  { id: 'red-carpet', name: 'Red Carpet Welcome', price: 1499, description: 'Red carpet treatment at pickup' },
  { id: 'photographer', name: 'Photographer', price: 4999, description: '1-hour professional photography' },
  { id: 'decoration', name: 'Car Decoration', price: 2499, description: 'Premium car decoration for events' },
  { id: 'security', name: 'Security Escort', price: 9999, description: 'Professional security personnel' },
];

// Occasions/Use cases for luxury
export const LUXURY_OCCASIONS = [
  { id: 'wedding', name: 'Wedding', icon: '💒' },
  { id: 'corporate', name: 'Corporate', icon: '💼' },
  { id: 'airport', name: 'Airport Transfer', icon: '✈️' },
  { id: 'party', name: 'Party/Event', icon: '🎉' },
  { id: 'romantic', name: 'Romantic Date', icon: '💝' },
  { id: 'photoshoot', name: 'Photoshoot', icon: '📸' },
  { id: 'sightseeing', name: 'City Tour', icon: '🏛️' },
  { id: 'vip', name: 'VIP Travel', icon: '👑' },
];
