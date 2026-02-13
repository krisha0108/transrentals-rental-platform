// Chauffeur/Car Rental with Driver Pricing Configuration
// Savaari-style pricing model

import { calculateTotalDays } from './utils';

export type TripType = 'local' | 'outstation' | 'airport';
export type OutstationMode = 'one-way' | 'round-trip';
export type AirportMode = 'pickup' | 'drop';

// Local hourly packages
export const LOCAL_PACKAGES = [
  { id: '4hr-40km', hours: 4, km: 40, label: '4 Hrs / 40 Km' },
  { id: '8hr-80km', hours: 8, km: 80, label: '8 Hrs / 80 Km' },
  { id: '10hr-100km', hours: 10, km: 100, label: '10 Hrs / 100 Km' },
  { id: '12hr-120km', hours: 12, km: 120, label: '12 Hrs / 120 Km' },
] as const;

// Car category pricing
export interface CarCategoryPricing {
  local: {
    base: number; // Base fare for package
    perKm: number; // Extra km rate
    perHr: number; // Extra hour rate
  };
  outstation: {
    base: number; // Base fare
    perKm: number; // Per km rate
    driverBatta: number; // Driver daily allowance
    nightCharge: number; // Night halt charge (10PM-6AM)
  };
  airport: {
    base: number; // Base fare
    perKm: number; // Per km rate (if beyond included)
    waitingCharge: number; // Per hour waiting
  };
}

export interface CarCategory {
  id: string;
  name: string;
  examples: string;
  seats: number;
  bags: number;
  ac: boolean;
  pricing: CarCategoryPricing;
}

export const CAR_CATEGORIES: CarCategory[] = [
  {
    id: 'hatchback',
    name: 'Hatchback',
    examples: 'Swift, i10, WagonR, Celerio',
    seats: 4,
    bags: 2,
    ac: true,
    pricing: {
      local: { base: 1199, perKm: 12, perHr: 100 },
      outstation: { base: 2499, perKm: 10, driverBatta: 300, nightCharge: 300 },
      airport: { base: 799, perKm: 15, waitingCharge: 100 },
    },
  },
  {
    id: 'sedan',
    name: 'Sedan',
    examples: 'Dzire, Xcent, Amaze, Aura',
    seats: 4,
    bags: 3,
    ac: true,
    pricing: {
      local: { base: 1499, perKm: 14, perHr: 120 },
      outstation: { base: 2999, perKm: 12, driverBatta: 350, nightCharge: 350 },
      airport: { base: 999, perKm: 18, waitingCharge: 120 },
    },
  },
  {
    id: 'sedan-executive',
    name: 'Sedan Executive',
    examples: 'Ciaz, City, Verna, Slavia',
    seats: 4,
    bags: 3,
    ac: true,
    pricing: {
      local: { base: 1799, perKm: 16, perHr: 140 },
      outstation: { base: 3499, perKm: 14, driverBatta: 400, nightCharge: 400 },
      airport: { base: 1199, perKm: 20, waitingCharge: 150 },
    },
  },
  {
    id: 'suv',
    name: 'SUV',
    examples: 'Ertiga, Marazzo, Carens',
    seats: 6,
    bags: 4,
    ac: true,
    pricing: {
      local: { base: 2199, perKm: 18, perHr: 160 },
      outstation: { base: 4499, perKm: 16, driverBatta: 500, nightCharge: 500 },
      airport: { base: 1499, perKm: 22, waitingCharge: 180 },
    },
  },
  {
    id: 'suv-premium',
    name: 'SUV Premium',
    examples: 'Innova Crysta, XUV700, Hector',
    seats: 7,
    bags: 5,
    ac: true,
    pricing: {
      local: { base: 2999, perKm: 22, perHr: 200 },
      outstation: { base: 5999, perKm: 20, driverBatta: 600, nightCharge: 600 },
      airport: { base: 1999, perKm: 28, waitingCharge: 220 },
    },
  },
  {
    id: 'luxury',
    name: 'Luxury',
    examples: 'Mercedes E-Class, BMW 5 Series, Audi A6',
    seats: 4,
    bags: 3,
    ac: true,
    pricing: {
      local: { base: 5999, perKm: 35, perHr: 350 },
      outstation: { base: 12999, perKm: 40, driverBatta: 1000, nightCharge: 1000 },
      airport: { base: 3999, perKm: 45, waitingCharge: 400 },
    },
  },
];

// Pricing calculation interfaces
export interface LocalFareResult {
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

export interface OutstationFareResult {
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

export interface AirportFareResult {
  tripType: 'airport';
  mode: AirportMode;
  distance: number;
  baseFare: number;
  waitingIncluded: number; // minutes
  extraWaitingRate: number;
  total: number;
  inclusions: string[];
  exclusions: string[];
}

export type FareResult = LocalFareResult | OutstationFareResult | AirportFareResult;

// Pricing calculation functions
export function calculateLocalFare(
  carId: string,
  packageId: string
): LocalFareResult | null {
  const car = CAR_CATEGORIES.find((c) => c.id === carId);
  const pkg = LOCAL_PACKAGES.find((p) => p.id === packageId);

  if (!car || !pkg) return null;

  const baseFare = car.pricing.local.base;
  const kmCharge = pkg.km * car.pricing.local.perKm;
  const total = Math.max(baseFare, kmCharge);

  return {
    tripType: 'local',
    packageId: pkg.id,
    packageHours: pkg.hours,
    packageKm: pkg.km,
    baseFare,
    extraKmRate: car.pricing.local.perKm,
    extraHrRate: car.pricing.local.perHr,
    total,
    inclusions: [
      `${pkg.hours} hours`,
      `${pkg.km} km`,
      'Fuel charges',
      'Driver allowance',
      'AC',
      'Toll taxes (city limits)',
    ],
    exclusions: [
      `Extra km @ ₹${car.pricing.local.perKm}/km`,
      `Extra hour @ ₹${car.pricing.local.perHr}/hr`,
      'Parking charges',
      'State permit (if applicable)',
    ],
  };
}

export function calculateOutstationFare(
  carId: string,
  mode: OutstationMode,
  distance: number,
  pickupDate: Date,
  returnDate?: Date,
  pickupTime?: string,
  returnTime?: string
): OutstationFareResult | null {
  const car = CAR_CATEGORIES.find((c) => c.id === carId);
  if (!car) return null;

  // Calculate days with proper time precision
  const days = returnDate && pickupTime
    ? calculateTotalDays(pickupDate, pickupTime, returnDate, returnTime || pickupTime)
    : 1;

  // Calculate total km
  const totalKm = mode === 'round-trip' ? distance * 2 : distance;

  // Minimum 250 km per day for outstation
  const minKmPerDay = 250;
  const chargeableKm = Math.max(totalKm, minKmPerDay * days);

  // Calculate charges
  const kmCharge = chargeableKm * car.pricing.outstation.perKm;
  const driverBattaTotal = car.pricing.outstation.driverBatta * days;

  // Night charges (if multi-day, assume night halt)
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
      'Driver allowance',
      'AC',
      days > 1 ? 'Night halt charges' : 'Same day return',
    ],
    exclusions: [
      `Extra km @ ₹${car.pricing.outstation.perKm}/km (after ${minKmPerDay}km/day)`,
      'Toll charges',
      'State permit charges',
      'Parking charges',
      'Entry fees (monuments, parks)',
    ],
  };
}

export function calculateAirportFare(
  carId: string,
  mode: AirportMode,
  distance: number = 35 // Default airport distance
): AirportFareResult | null {
  const car = CAR_CATEGORIES.find((c) => c.id === carId);
  if (!car) return null;

  const baseFare = car.pricing.airport.base;
  const total = baseFare;

  return {
    tripType: 'airport',
    mode,
    distance,
    baseFare,
    waitingIncluded: 45, // 45 minutes waiting included
    extraWaitingRate: car.pricing.airport.waitingCharge,
    total,
    inclusions: [
      'Fuel charges',
      'Driver allowance',
      '45 mins waiting at airport',
      'Meet & greet',
      'Flight tracking',
    ],
    exclusions: [
      `Extra waiting @ ₹${car.pricing.airport.waitingCharge}/hr`,
      'Toll charges',
      'Parking charges (if any)',
    ],
  };
}

// Helper to get car category by ID
export function getCarCategory(carId: string): CarCategory | undefined {
  return CAR_CATEGORIES.find((c) => c.id === carId);
}

// Helper to get package by ID
export function getLocalPackage(packageId: string) {
  return LOCAL_PACKAGES.find((p) => p.id === packageId);
}

// Popular outstation routes with distances
export const POPULAR_ROUTES: Record<string, { to: string; distance: number; state: string }[]> = {
  delhi: [
    { to: 'Agra', distance: 230, state: 'UP' },
    { to: 'Jaipur', distance: 280, state: 'Rajasthan' },
    { to: 'Chandigarh', distance: 250, state: 'Punjab' },
    { to: 'Manali', distance: 530, state: 'HP' },
    { to: 'Rishikesh', distance: 240, state: 'Uttarakhand' },
    { to: 'Haridwar', distance: 210, state: 'Uttarakhand' },
    { to: 'Mathura', distance: 180, state: 'UP' },
    { to: 'Shimla', distance: 350, state: 'HP' },
  ],
  mumbai: [
    { to: 'Pune', distance: 150, state: 'Maharashtra' },
    { to: 'Lonavala', distance: 85, state: 'Maharashtra' },
    { to: 'Nashik', distance: 170, state: 'Maharashtra' },
    { to: 'Shirdi', distance: 240, state: 'Maharashtra' },
    { to: 'Mahabaleshwar', distance: 270, state: 'Maharashtra' },
    { to: 'Alibaug', distance: 95, state: 'Maharashtra' },
    { to: 'Goa', distance: 590, state: 'Goa' },
  ],
  bangalore: [
    { to: 'Mysore', distance: 150, state: 'Karnataka' },
    { to: 'Coorg', distance: 260, state: 'Karnataka' },
    { to: 'Ooty', distance: 280, state: 'TN' },
    { to: 'Tirupati', distance: 260, state: 'AP' },
    { to: 'Pondicherry', distance: 310, state: 'Puducherry' },
    { to: 'Hampi', distance: 340, state: 'Karnataka' },
    { to: 'Goa', distance: 560, state: 'Goa' },
  ],
  hyderabad: [
    { to: 'Warangal', distance: 150, state: 'Telangana' },
    { to: 'Vijayawada', distance: 270, state: 'AP' },
    { to: 'Tirupati', distance: 550, state: 'AP' },
    { to: 'Srisailam', distance: 210, state: 'AP' },
    { to: 'Bidar', distance: 140, state: 'Karnataka' },
    { to: 'Nagarjuna Sagar', distance: 160, state: 'Telangana' },
  ],
  chennai: [
    { to: 'Pondicherry', distance: 150, state: 'Puducherry' },
    { to: 'Mahabalipuram', distance: 60, state: 'TN' },
    { to: 'Tirupati', distance: 135, state: 'AP' },
    { to: 'Vellore', distance: 140, state: 'TN' },
    { to: 'Kanchipuram', distance: 75, state: 'TN' },
    { to: 'Madurai', distance: 460, state: 'TN' },
  ],
  kolkata: [
    { to: 'Digha', distance: 185, state: 'WB' },
    { to: 'Shantiniketan', distance: 165, state: 'WB' },
    { to: 'Darjeeling', distance: 615, state: 'WB' },
    { to: 'Puri', distance: 500, state: 'Odisha' },
    { to: 'Mandarmani', distance: 170, state: 'WB' },
  ],
  pune: [
    { to: 'Mumbai', distance: 150, state: 'Maharashtra' },
    { to: 'Lonavala', distance: 65, state: 'Maharashtra' },
    { to: 'Mahabaleshwar', distance: 120, state: 'Maharashtra' },
    { to: 'Shirdi', distance: 185, state: 'Maharashtra' },
    { to: 'Goa', distance: 450, state: 'Goa' },
  ],
};

// Airport codes for common airports
export const AIRPORTS: Record<string, { name: string; code: string; city: string }[]> = {
  delhi: [{ name: 'Indira Gandhi International Airport', code: 'DEL', city: 'Delhi' }],
  mumbai: [
    { name: 'Chhatrapati Shivaji Maharaj International Airport', code: 'BOM', city: 'Mumbai' },
  ],
  bangalore: [{ name: 'Kempegowda International Airport', code: 'BLR', city: 'Bangalore' }],
  hyderabad: [
    { name: 'Rajiv Gandhi International Airport', code: 'HYD', city: 'Hyderabad' },
  ],
  chennai: [{ name: 'Chennai International Airport', code: 'MAA', city: 'Chennai' }],
  kolkata: [
    { name: 'Netaji Subhas Chandra Bose International Airport', code: 'CCU', city: 'Kolkata' },
  ],
  pune: [{ name: 'Pune Airport', code: 'PNQ', city: 'Pune' }],
  ahmedabad: [
    { name: 'Sardar Vallabhbhai Patel International Airport', code: 'AMD', city: 'Ahmedabad' },
  ],
  jaipur: [{ name: 'Jaipur International Airport', code: 'JAI', city: 'Jaipur' }],
  goa: [{ name: 'Goa International Airport', code: 'GOI', city: 'Goa' }],
};
