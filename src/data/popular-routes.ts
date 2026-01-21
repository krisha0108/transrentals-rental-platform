// Popular routes and destinations mapped by city
// Each city has nearby destinations and popular tourist spots

export interface Destination {
  name: string;
  slug: string;
  distance?: string; // Approximate distance
  description: string;
  vehicles: string;
  type: 'nearby' | 'tourist' | 'pilgrimage' | 'adventure' | 'beach' | 'hill-station';
}

export const CITY_ROUTES: Record<string, Destination[]> = {
  // Ahmedabad Routes
  'ahmedabad': [
    { name: 'Gandhinagar', slug: 'gandhinagar', distance: '30 km', description: 'Capital city with beautiful architecture', vehicles: '150+ Vehicles', type: 'nearby' },
    { name: 'Udaipur', slug: 'udaipur', distance: '250 km', description: 'City of Lakes and Palaces', vehicles: '200+ Vehicles', type: 'tourist' },
    { name: 'Mount Abu', slug: 'mount-abu', distance: '220 km', description: 'Hill station in Rajasthan', vehicles: '120+ Bikes', type: 'hill-station' },
    { name: 'Dwarka', slug: 'dwarka', distance: '430 km', description: 'Sacred pilgrimage site', vehicles: '100+ Vehicles', type: 'pilgrimage' },
    { name: 'Gir National Park', slug: 'gir', distance: '330 km', description: 'Home of Asiatic Lions', vehicles: '80+ Vehicles', type: 'adventure' },
    { name: 'Diu', slug: 'diu', distance: '380 km', description: 'Beautiful coastal town', vehicles: '90+ Bikes', type: 'beach' },
  ],

  // Mumbai Routes
  'mumbai': [
    { name: 'Lonavala', slug: 'lonavala', distance: '83 km', description: 'Hill station with scenic beauty', vehicles: '200+ Bikes', type: 'hill-station' },
    { name: 'Pune', slug: 'pune', distance: '150 km', description: 'Cultural capital of Maharashtra', vehicles: '300+ Vehicles', type: 'nearby' },
    { name: 'Goa', slug: 'goa', distance: '460 km', description: 'Beach paradise destination', vehicles: '250+ Bikes', type: 'beach' },
    { name: 'Mahabaleshwar', slug: 'mahabaleshwar', distance: '263 km', description: 'Popular hill station', vehicles: '150+ Vehicles', type: 'hill-station' },
    { name: 'Alibaug', slug: 'alibaug', distance: '95 km', description: 'Coastal getaway near Mumbai', vehicles: '120+ Bikes', type: 'beach' },
    { name: 'Nashik', slug: 'nashik', distance: '165 km', description: 'Wine capital and pilgrimage site', vehicles: '100+ Vehicles', type: 'tourist' },
  ],

  // Delhi Routes
  'delhi': [
    { name: 'Agra', slug: 'agra', distance: '230 km', description: 'Home of the Taj Mahal', vehicles: '200+ Vehicles', type: 'tourist' },
    { name: 'Jaipur', slug: 'jaipur', distance: '280 km', description: 'Pink City of Rajasthan', vehicles: '250+ Vehicles', type: 'tourist' },
    { name: 'Manali', slug: 'manali', distance: '540 km', description: 'Mountain adventures', vehicles: '180+ Bikes', type: 'hill-station' },
    { name: 'Rishikesh', slug: 'rishikesh', distance: '240 km', description: 'Yoga and adventure capital', vehicles: '150+ Bikes', type: 'adventure' },
    { name: 'Shimla', slug: 'shimla', distance: '345 km', description: 'Queen of hill stations', vehicles: '120+ Vehicles', type: 'hill-station' },
    { name: 'Haridwar', slug: 'haridwar', distance: '220 km', description: 'Holy city on Ganges', vehicles: '100+ Vehicles', type: 'pilgrimage' },
  ],

  // Bangalore Routes
  'bangalore': [
    { name: 'Mysore', slug: 'mysore', distance: '145 km', description: 'City of Palaces', vehicles: '200+ Vehicles', type: 'tourist' },
    { name: 'Coorg', slug: 'coorg', distance: '265 km', description: 'Scotland of India', vehicles: '150+ Bikes', type: 'hill-station' },
    { name: 'Ooty', slug: 'ooty', distance: '270 km', description: 'Queen of hill stations', vehicles: '180+ Vehicles', type: 'hill-station' },
    { name: 'Goa', slug: 'goa', distance: '560 km', description: 'Beach paradise destination', vehicles: '220+ Bikes', type: 'beach' },
    { name: 'Hampi', slug: 'hampi', distance: '340 km', description: 'Ancient ruins and temples', vehicles: '100+ Bikes', type: 'tourist' },
    { name: 'Chikmagalur', slug: 'chikmagalur', distance: '245 km', description: 'Coffee land of Karnataka', vehicles: '120+ Vehicles', type: 'hill-station' },
  ],

  // Chennai Routes
  'chennai': [
    { name: 'Pondicherry', slug: 'pondicherry', distance: '160 km', description: 'French colonial town', vehicles: '180+ Bikes', type: 'beach' },
    { name: 'Mahabalipuram', slug: 'mahabalipuram', distance: '55 km', description: 'Ancient port city', vehicles: '100+ Bikes', type: 'tourist' },
    { name: 'Ooty', slug: 'ooty', distance: '555 km', description: 'Queen of hill stations', vehicles: '150+ Vehicles', type: 'hill-station' },
    { name: 'Kodaikanal', slug: 'kodaikanal', distance: '520 km', description: 'Princess of hill stations', vehicles: '120+ Vehicles', type: 'hill-station' },
    { name: 'Tirupati', slug: 'tirupati', distance: '135 km', description: 'Sacred pilgrimage', vehicles: '200+ Vehicles', type: 'pilgrimage' },
    { name: 'Rameswaram', slug: 'rameswaram', distance: '575 km', description: 'Island pilgrimage town', vehicles: '90+ Vehicles', type: 'pilgrimage' },
  ],

  // Pune Routes
  'pune': [
    { name: 'Lonavala', slug: 'lonavala', distance: '64 km', description: 'Hill station with scenic beauty', vehicles: '200+ Bikes', type: 'hill-station' },
    { name: 'Mumbai', slug: 'mumbai', distance: '150 km', description: 'Financial capital of India', vehicles: '300+ Vehicles', type: 'nearby' },
    { name: 'Mahabaleshwar', slug: 'mahabaleshwar', distance: '120 km', description: 'Popular hill station', vehicles: '180+ Vehicles', type: 'hill-station' },
    { name: 'Goa', slug: 'goa', distance: '450 km', description: 'Beach paradise destination', vehicles: '250+ Bikes', type: 'beach' },
    { name: 'Alibaug', slug: 'alibaug', distance: '140 km', description: 'Coastal getaway', vehicles: '120+ Bikes', type: 'beach' },
    { name: 'Kolhapur', slug: 'kolhapur', distance: '230 km', description: 'Cultural heritage city', vehicles: '100+ Vehicles', type: 'tourist' },
  ],

  // Kolkata Routes
  'kolkata': [
    { name: 'Darjeeling', slug: 'darjeeling', distance: '640 km', description: 'Queen of the Himalayas', vehicles: '150+ Vehicles', type: 'hill-station' },
    { name: 'Digha', slug: 'digha', distance: '185 km', description: 'Popular beach destination', vehicles: '120+ Bikes', type: 'beach' },
    { name: 'Puri', slug: 'puri', distance: '500 km', description: 'Sacred beach town', vehicles: '180+ Vehicles', type: 'pilgrimage' },
    { name: 'Gangtok', slug: 'gangtok', distance: '720 km', description: 'Capital of Sikkim', vehicles: '100+ Bikes', type: 'hill-station' },
    { name: 'Sundarbans', slug: 'sundarbans', distance: '110 km', description: 'Mangrove forest and tigers', vehicles: '80+ Vehicles', type: 'adventure' },
    { name: 'Shantiniketan', slug: 'shantiniketan', distance: '165 km', description: 'Cultural heritage town', vehicles: '90+ Vehicles', type: 'tourist' },
  ],

  // Hyderabad Routes
  'hyderabad': [
    { name: 'Vijayawada', slug: 'vijayawada', distance: '275 km', description: 'Commercial hub of Andhra', vehicles: '150+ Vehicles', type: 'nearby' },
    { name: 'Tirupati', slug: 'tirupati', distance: '625 km', description: 'Sacred pilgrimage', vehicles: '200+ Vehicles', type: 'pilgrimage' },
    { name: 'Araku Valley', slug: 'araku', distance: '680 km', description: 'Hill station with coffee', vehicles: '120+ Bikes', type: 'hill-station' },
    { name: 'Warangal', slug: 'warangal', distance: '145 km', description: 'Historical city', vehicles: '100+ Vehicles', type: 'tourist' },
    { name: 'Srisailam', slug: 'srisailam', distance: '215 km', description: 'Pilgrimage in forest', vehicles: '90+ Vehicles', type: 'pilgrimage' },
    { name: 'Hampi', slug: 'hampi', distance: '375 km', description: 'Ancient ruins and temples', vehicles: '110+ Bikes', type: 'tourist' },
  ],

  // Jaipur Routes
  'jaipur': [
    { name: 'Udaipur', slug: 'udaipur', distance: '395 km', description: 'City of Lakes', vehicles: '200+ Vehicles', type: 'tourist' },
    { name: 'Jodhpur', slug: 'jodhpur', distance: '335 km', description: 'Blue city of Rajasthan', vehicles: '180+ Vehicles', type: 'tourist' },
    { name: 'Pushkar', slug: 'pushkar', distance: '145 km', description: 'Sacred lake town', vehicles: '120+ Bikes', type: 'pilgrimage' },
    { name: 'Ajmer', slug: 'ajmer', distance: '135 km', description: 'Sufi pilgrimage center', vehicles: '100+ Vehicles', type: 'pilgrimage' },
    { name: 'Mount Abu', slug: 'mount-abu', distance: '485 km', description: 'Hill station in Rajasthan', vehicles: '150+ Bikes', type: 'hill-station' },
    { name: 'Ranthambore', slug: 'ranthambore', distance: '180 km', description: 'Tiger reserve', vehicles: '90+ Vehicles', type: 'adventure' },
  ],
};

// Default popular tourist destinations (fallback for cities not in the map)
export const DEFAULT_DESTINATIONS: Destination[] = [
  { name: 'Goa', slug: 'goa', description: 'Beach paradise destination', vehicles: '250+ Bikes', type: 'beach' },
  { name: 'Manali', slug: 'manali', description: 'Mountain adventures in Himalayas', vehicles: '180+ Bikes', type: 'hill-station' },
  { name: 'Udaipur', slug: 'udaipur', description: 'City of Lakes and Palaces', vehicles: '200+ Vehicles', type: 'tourist' },
  { name: 'Rishikesh', slug: 'rishikesh', distance: '240 km', description: 'Yoga and adventure capital', vehicles: '150+ Bikes', type: 'adventure' },
  { name: 'Ooty', slug: 'ooty', description: 'Queen of hill stations', vehicles: '150+ Vehicles', type: 'hill-station' },
  { name: 'Jaipur', slug: 'jaipur', description: 'Pink City of Rajasthan', vehicles: '250+ Vehicles', type: 'tourist' },
];

// Get popular routes for a specific city
export function getPopularRoutes(citySlug: string): Destination[] {
  return CITY_ROUTES[citySlug.toLowerCase()] || DEFAULT_DESTINATIONS;
}

// Get type-specific icon for destination
export function getDestinationIcon(type: Destination['type']): string {
  const icons: Record<Destination['type'], string> = {
    'nearby': '🏙️',
    'tourist': '🏛️',
    'pilgrimage': '🕉️',
    'adventure': '⛰️',
    'beach': '🏖️',
    'hill-station': '🏔️',
  };
  return icons[type] || '📍';
}
