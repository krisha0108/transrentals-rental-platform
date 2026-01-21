// Bus & Tempo Traveller Categories and Configuration

export interface BusCategory {
  id: string;
  name: string;
  shortName: string;
  seatingCapacity: {
    min: number;
    max: number;
  };
  description: string;
  features: string[];
  amenities: string[];
  bestFor: string[];
  image?: string;
  popular?: boolean;
}

export const BUS_CATEGORIES: BusCategory[] = [
  {
    id: 'tempo-traveller-12',
    name: 'Tempo Traveller (12 Seater)',
    shortName: '12 Seater TT',
    seatingCapacity: { min: 10, max: 12 },
    description: 'Compact tempo for small group travel',
    features: ['Push Back Seats', 'Luggage Space', 'AC'],
    amenities: ['Music System', 'Reading Lights', 'First Aid'],
    bestFor: ['Family Trips', 'Small Groups', 'Airport Transfer'],
    popular: true,
  },
  {
    id: 'tempo-traveller-17',
    name: 'Tempo Traveller (17 Seater)',
    shortName: '17 Seater TT',
    seatingCapacity: { min: 15, max: 17 },
    description: 'Mid-size tempo for medium groups',
    features: ['Push Back Seats', 'Ample Luggage Space', 'AC'],
    amenities: ['Music System', 'USB Charging', 'Reading Lights'],
    bestFor: ['Office Outings', 'Wedding Guests', 'Pilgrimages'],
    popular: true,
  },
  {
    id: 'tempo-traveller-20',
    name: 'Tempo Traveller (20 Seater)',
    shortName: '20 Seater TT',
    seatingCapacity: { min: 18, max: 20 },
    description: 'Large tempo for bigger groups',
    features: ['Push Back Seats', 'Large Luggage Bay', 'AC'],
    amenities: ['Music System', 'USB Charging', 'Curtains'],
    bestFor: ['Group Tours', 'Corporate Events', 'Pilgrimages'],
  },
  {
    id: 'tempo-traveller-26',
    name: 'Tempo Traveller (26 Seater)',
    shortName: '26 Seater TT',
    seatingCapacity: { min: 24, max: 26 },
    description: 'Largest tempo traveller variant',
    features: ['2x2 Seating', 'Large Luggage Bay', 'AC'],
    amenities: ['Music System', 'USB Charging', 'Curtains', 'First Aid'],
    bestFor: ['Large Groups', 'School Trips', 'Tours'],
  },
  {
    id: 'luxury-tempo-traveller',
    name: 'Luxury Tempo Traveller',
    shortName: 'Luxury TT',
    seatingCapacity: { min: 9, max: 14 },
    description: 'Premium tempo with luxury amenities',
    features: ['Recliner Seats', 'Extra Legroom', 'AC', 'Premium Interiors'],
    amenities: ['LCD TV', 'Music System', 'USB Charging', 'Mini Fridge', 'Reading Lights'],
    bestFor: ['VIP Travel', 'Corporate Tours', 'Luxury Pilgrimages'],
    popular: true,
  },
  {
    id: 'maharaja-tempo-traveller',
    name: 'Maharaja Tempo Traveller',
    shortName: 'Maharaja TT',
    seatingCapacity: { min: 9, max: 12 },
    description: 'Ultra-luxury tempo with sofa seating',
    features: ['Sofa Seating', 'Wood Flooring', 'AC', 'Premium Interiors'],
    amenities: ['LED TV', 'Premium Sound', 'Mini Fridge', 'Microwave', 'Charging Points'],
    bestFor: ['VIP Travel', 'Celebrity Tours', 'Weddings'],
  },
  {
    id: 'mini-bus-20',
    name: 'Mini Bus (20 Seater)',
    shortName: '20 Seater Mini Bus',
    seatingCapacity: { min: 18, max: 22 },
    description: 'Compact bus for city and short trips',
    features: ['2x2 Seating', 'AC', 'Luggage Bay'],
    amenities: ['Music System', 'Curtains', 'First Aid'],
    bestFor: ['City Tours', 'School Trips', 'Local Events'],
  },
  {
    id: 'mini-bus-28',
    name: 'Mini Bus (28 Seater)',
    shortName: '28 Seater Mini Bus',
    seatingCapacity: { min: 26, max: 30 },
    description: 'Mid-size bus for medium distance',
    features: ['2x2 Seating', 'AC', 'Large Luggage Bay'],
    amenities: ['Music System', 'Curtains', 'Mic System'],
    bestFor: ['Company Outings', 'Wedding Transport', 'Tours'],
  },
  {
    id: 'bus-35',
    name: 'AC Bus (35 Seater)',
    shortName: '35 Seater Bus',
    seatingCapacity: { min: 33, max: 37 },
    description: 'Standard AC bus for large groups',
    features: ['2x2 Seating', 'AC', 'Large Luggage Bay', 'High Roof'],
    amenities: ['Music System', 'Curtains', 'Mic System', 'First Aid'],
    bestFor: ['Tours', 'Pilgrimages', 'Corporate Events'],
  },
  {
    id: 'bus-45',
    name: 'AC Bus (45 Seater)',
    shortName: '45 Seater Bus',
    seatingCapacity: { min: 43, max: 49 },
    description: 'Large AC bus for big groups',
    features: ['2x2 Seating', 'AC', 'Extra Large Luggage Bay'],
    amenities: ['Music System', 'Curtains', 'Mic System', 'First Aid'],
    bestFor: ['Large Groups', 'Pilgrimages', 'Corporate Travel'],
    popular: true,
  },
  {
    id: 'volvo-bus',
    name: 'Volvo Multi-Axle Bus',
    shortName: 'Volvo Bus',
    seatingCapacity: { min: 40, max: 50 },
    description: 'Premium Volvo bus for long distance',
    features: ['2x2 Recliner Seats', 'AC', 'Multi-Axle', 'Suspension'],
    amenities: ['LED TV', 'Music System', 'USB Charging', 'Reading Lights', 'Blankets'],
    bestFor: ['Long Distance', 'Corporate Tours', 'Premium Travel'],
    popular: true,
  },
  {
    id: 'sleeper-bus',
    name: 'Sleeper Bus',
    shortName: 'Sleeper',
    seatingCapacity: { min: 30, max: 40 },
    description: 'Overnight travel with sleeping berths',
    features: ['Sleeper Berths', 'AC', 'Individual Curtains'],
    amenities: ['Blankets', 'Pillows', 'Reading Lights', 'Charging Points'],
    bestFor: ['Overnight Journeys', 'Long Distance', 'Tours'],
  },
  {
    id: 'luxury-coach',
    name: 'Luxury Coach',
    shortName: 'Luxury Coach',
    seatingCapacity: { min: 35, max: 45 },
    description: 'Premium coach with luxury amenities',
    features: ['Recliner Seats', 'AC', 'Washroom', 'Extra Legroom'],
    amenities: ['LED TVs', 'WiFi', 'Mini Pantry', 'USB Charging', 'GPS Tracking'],
    bestFor: ['VIP Travel', 'Corporate Events', 'Premium Tours'],
  },
];

// Trip types for bus rentals
export const BUS_TRIP_TYPES = [
  { id: 'local', name: 'Local / Within City', icon: 'MapPin', description: 'City tours, events, airport transfers' },
  { id: 'outstation', name: 'Outstation', icon: 'Navigation', description: 'Inter-city travel, one-way or round trip' },
  { id: 'pilgrimage', name: 'Pilgrimage / Religious', icon: 'Building', description: 'Temple tours, religious trips' },
  { id: 'tour-package', name: 'Tour Package', icon: 'Map', description: 'Multi-day tours with itinerary' },
  { id: 'corporate', name: 'Corporate / Office', icon: 'Briefcase', description: 'Team outings, conferences' },
  { id: 'wedding', name: 'Wedding / Events', icon: 'Heart', description: 'Guest transportation, baraat' },
  { id: 'school', name: 'School / College', icon: 'GraduationCap', description: 'Picnics, excursions, daily transport' },
];

// Default inclusions for templates
export const DEFAULT_INCLUSIONS = [
  'AC Vehicle as per booking',
  'Experienced driver with route knowledge',
  'All fuel charges',
  'Driver batta/allowance',
  'Toll taxes (as per route)',
  'State permits (if applicable)',
  'Parking charges',
  'GST as applicable',
];

// Default exclusions for templates
export const DEFAULT_EXCLUSIONS = [
  'Personal expenses',
  'Entry fees to monuments/attractions',
  'Guide charges',
  'Early morning/late night charges (before 6 AM / after 10 PM)',
  'Extra kilometers beyond package',
  'Extra hours beyond package',
  'Waiting charges beyond included time',
  'Driver tips (optional)',
];

// Default terms for templates
export const DEFAULT_TERMS = [
  'Full payment required before trip starts',
  'Cancellation charges apply as per policy',
  '50% advance to confirm booking',
  'Vehicle and driver will report 30 mins before departure',
  'Route changes may incur additional charges',
  'Night halt charges applicable for overnight trips',
  'Air conditioning may not work in hilly areas/ghats',
  'Seating capacity as per RTO permit only',
  'ID proof mandatory for all passengers',
  'No illegal activities or contraband allowed',
];

// Pre-built template suggestions
export const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Standard Outstation Trip',
    category: 'outstation',
    inclusions: [
      'AC Vehicle as per booking',
      'Experienced driver',
      'All fuel charges',
      'Driver allowance',
      'Toll taxes',
      'State permits',
      'Parking charges',
    ],
    exclusions: [
      'Personal expenses',
      'Entry fees',
      'Guide charges',
      'Early morning/late night pickup charges',
      'Extra km/hr charges',
    ],
    terms: [
      '50% advance required',
      'Balance before trip starts',
      'Free cancellation 48hrs before',
      '300 km per day limit',
      'Night halt charges extra',
    ],
  },
  {
    name: 'Local City Tour',
    category: 'local',
    inclusions: [
      'AC Vehicle',
      'Experienced driver',
      'Fuel charges',
      'Driver allowance',
      'Parking (standard locations)',
    ],
    exclusions: [
      'Toll charges',
      'Entry fees',
      'Special parking fees',
      'Overtime charges',
    ],
    terms: [
      '100% advance required',
      '8 hours / 80 km package',
      'Extra: ₹50/km, ₹200/hr',
      'Night charges after 10 PM',
    ],
  },
  {
    name: 'Wedding Guest Transport',
    category: 'wedding',
    inclusions: [
      'Decorated AC Vehicle',
      'Uniformed driver',
      'Fuel charges',
      'Driver allowance',
      'Toll & parking',
      'Backup support',
    ],
    exclusions: [
      'Decoration charges (quoted separately)',
      'Entry fees',
      'Waiting beyond 30 mins',
    ],
    terms: [
      '50% advance to confirm',
      'Balance 1 day before event',
      'Vehicle will report 1 hour early',
      'Driver will be in formal attire',
    ],
  },
  {
    name: 'Pilgrimage Tour',
    category: 'pilgrimage',
    inclusions: [
      'AC Vehicle',
      'Experienced pilgrim route driver',
      'All fuel charges',
      'Driver allowance & food',
      'Toll & permits',
      'Parking at all temples',
    ],
    exclusions: [
      'Darshan tickets/VIP entry',
      'Pooja items',
      'Prasad expenses',
      'Guide/Pandit charges',
      'Accommodation',
      'Meals for passengers',
    ],
    terms: [
      '50% advance required',
      'Balance before departure',
      'Itinerary fixed at booking',
      '300 km per day included',
      'Night halt charges: ₹500/night',
    ],
  },
  {
    name: 'Corporate Outing',
    category: 'corporate',
    inclusions: [
      'AC Vehicle with good interiors',
      'Professional driver',
      'Fuel charges',
      'Driver allowance',
      'Toll & parking',
      'GST compliant billing',
    ],
    exclusions: [
      'Entry fees to venues',
      'Meal arrangements',
      'Activity charges',
      'Extra hours beyond 10 hrs',
    ],
    terms: [
      'Corporate GST invoice provided',
      '30% advance to confirm',
      'Balance on trip day',
      '10 hours per day included',
      'Overtime: ₹300/hr',
    ],
  },
];

// Get category by ID
export const getBusCategory = (id: string): BusCategory | undefined => {
  return BUS_CATEGORIES.find((c) => c.id === id);
};

// Get popular categories
export const getPopularBusCategories = (): BusCategory[] => {
  return BUS_CATEGORIES.filter((c) => c.popular);
};

// Filter categories by capacity
export const getCategoriesByCapacity = (passengers: number): BusCategory[] => {
  return BUS_CATEGORIES.filter(
    (c) => passengers >= c.seatingCapacity.min && passengers <= c.seatingCapacity.max
  );
};
