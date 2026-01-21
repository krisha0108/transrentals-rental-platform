/**
 * Comprehensive vehicle fleet database for SEO landing pages
 * Each vehicle gets its own page across all applicable cities
 */

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: 'bike' | 'car' | 'bus' | 'truck' | 'equipment';
  type: string; // Hatchback, Sedan, SUV, Cruiser, Scooter, etc.
  basePrice: number;
  features: string[];
  specs: {
    engine?: string;
    mileage?: string;
    seating?: number;
    transmission?: string;
    fuelType?: string;
    capacity?: string;
  };
  images: string[];
  imageUrl?: string; // Primary image URL for display
  popularIn: string[]; // State codes where this is popular
  seoKeywords: string[];
  priority: number; // 1-10 for SEO priority
}

// Vehicle images - Use local images from /public/images/fleet/
// To add real images: Save vehicle images to public/images/fleet/ with matching filenames
// e.g., royal-enfield-classic-350.jpg, hyundai-creta.jpg, etc.
export const VEHICLE_IMAGES: Record<string, string> = {
  // Royal Enfield Bikes
  'royal-enfield-classic-350': '/images/fleet/royal-enfield-classic-350.jpg',
  'royal-enfield-himalayan': '/images/fleet/royal-enfield-himalayan.jpg',
  'royal-enfield-bullet-350': '/images/fleet/royal-enfield-bullet-350.jpg',
  'royal-enfield-interceptor-650': '/images/fleet/royal-enfield-interceptor-650.jpg',

  // KTM Bikes
  'ktm-duke-390': '/images/fleet/ktm-duke-390.jpg',
  'ktm-adventure-390': '/images/fleet/ktm-adventure-390.jpg',

  // Scooters
  'honda-activa-6g': '/images/fleet/honda-activa-6g.jpg',
  'tvs-jupiter': '/images/fleet/tvs-jupiter.jpg',
  'suzuki-access-125': '/images/fleet/suzuki-access-125.jpg',

  // Commuter Bikes
  'bajaj-pulsar-150': '/images/fleet/bajaj-pulsar-150.jpg',
  'hero-splendor-plus': '/images/fleet/hero-splendor-plus.jpg',

  // Cars - Hatchbacks
  'maruti-swift': '/images/fleet/maruti-swift.jpg',
  'hyundai-i20': '/images/fleet/hyundai-i20.jpg',
  'tata-altroz': '/images/fleet/tata-altroz.jpg',

  // Cars - Sedans
  'honda-city': '/images/fleet/honda-city.jpg',
  'hyundai-verna': '/images/fleet/hyundai-verna.jpg',
  'maruti-ciaz': '/images/fleet/maruti-ciaz.jpg',

  // Cars - SUVs
  'hyundai-creta': '/images/fleet/hyundai-creta.jpg',
  'kia-seltos': '/images/fleet/kia-seltos.jpg',
  'mahindra-xuv500': '/images/fleet/mahindra-xuv500.jpg',
  'toyota-fortuner': '/images/fleet/toyota-fortuner.jpg',

  // Cars - MUVs
  'maruti-ertiga': '/images/fleet/maruti-ertiga.jpg',
  'toyota-innova-crysta': '/images/fleet/toyota-innova-crysta.jpg',

  // Luxury Cars
  'mercedes-e-class': '/images/fleet/mercedes-e-class.jpg',
  'bmw-5-series': '/images/fleet/bmw-5-series.jpg',
  'audi-a6': '/images/fleet/audi-a6.jpg',
  'jaguar-xf': '/images/fleet/jaguar-xf.jpg',
  'range-rover': '/images/fleet/range-rover.jpg',

  // Buses & Tempo Travellers
  'force-traveller-12-seater': '/images/fleet/force-traveller-12-seater.jpg',
  'tempo-traveller-17-seater': '/images/fleet/tempo-traveller-17-seater.jpg',
  'luxury-bus-45-seater': '/images/fleet/luxury-bus-45-seater.jpg',
};

// Default fallback images by category
export const DEFAULT_VEHICLE_IMAGES = {
  bike: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  car: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
  bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
  truck: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  equipment: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
};

// Helper function to get vehicle image
export function getVehicleImage(vehicle: Vehicle): string {
  return VEHICLE_IMAGES[vehicle.id as keyof typeof VEHICLE_IMAGES] ||
         vehicle.imageUrl ||
         DEFAULT_VEHICLE_IMAGES[vehicle.category] ||
         DEFAULT_VEHICLE_IMAGES.car;
}

// BIKES - Two Wheelers
export const BIKES: Vehicle[] = [
  // Royal Enfield - High Search Volume
  {
    id: 'royal-enfield-classic-350',
    name: 'Royal Enfield Classic 350',
    slug: 'royal-enfield-classic-350',
    brand: 'Royal Enfield',
    category: 'bike',
    type: 'Cruiser',
    basePrice: 599,
    features: ['Cruiser Bike', 'Long Distance', 'Highway Ready', 'Comfortable Seating'],
    specs: {
      engine: '349cc',
      mileage: '35-40 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/re-classic-350.jpg'],
    popularIn: ['GA', 'HP', 'UK', 'RJ', 'KA', 'TN'],
    seoKeywords: ['royal enfield on rent', 'classic 350 rental', 're classic hire'],
    priority: 10,
  },
  {
    id: 'royal-enfield-himalayan',
    name: 'Royal Enfield Himalayan',
    slug: 'royal-enfield-himalayan',
    brand: 'Royal Enfield',
    category: 'bike',
    type: 'Adventure',
    basePrice: 699,
    features: ['Adventure Bike', 'Off-road', 'Leh-Ladakh Ready', 'High Ground Clearance'],
    specs: {
      engine: '411cc',
      mileage: '30-35 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/re-himalayan.jpg'],
    popularIn: ['HP', 'UK', 'LA', 'JK'],
    seoKeywords: ['himalayan rental', 'adventure bike rent', 'leh bike rental'],
    priority: 10,
  },
  {
    id: 'royal-enfield-bullet-350',
    name: 'Royal Enfield Bullet 350',
    slug: 'royal-enfield-bullet-350',
    brand: 'Royal Enfield',
    category: 'bike',
    type: 'Cruiser',
    basePrice: 549,
    features: ['Classic Bullet', 'Vintage Style', 'Reliable', 'Iconic Design'],
    specs: {
      engine: '346cc',
      mileage: '35-40 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/re-bullet-350.jpg'],
    popularIn: ['GA', 'RJ', 'UP', 'MH'],
    seoKeywords: ['bullet on rent', 'bullet 350 hire', 'classic bullet rental'],
    priority: 9,
  },
  {
    id: 'royal-enfield-interceptor-650',
    name: 'Royal Enfield Interceptor 650',
    slug: 'royal-enfield-interceptor-650',
    brand: 'Royal Enfield',
    category: 'bike',
    type: 'Cruiser',
    basePrice: 899,
    features: ['Twin Cylinder', 'Highway Cruiser', 'Premium', 'Comfortable'],
    specs: {
      engine: '648cc',
      mileage: '25-30 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/re-interceptor-650.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['interceptor 650 rental', '650 twin rental', 're 650 hire'],
    priority: 9,
  },

  // KTM - Performance Bikes
  {
    id: 'ktm-duke-390',
    name: 'KTM Duke 390',
    slug: 'ktm-duke-390',
    brand: 'KTM',
    category: 'bike',
    type: 'Naked Sport',
    basePrice: 799,
    features: ['Sport Bike', 'Performance', 'ABS', 'Digital Display'],
    specs: {
      engine: '373cc',
      mileage: '25-30 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/ktm-duke-390.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'GJ'],
    seoKeywords: ['ktm rental', 'duke 390 rent', 'ktm bike hire'],
    priority: 9,
  },
  {
    id: 'ktm-adventure-390',
    name: 'KTM Adventure 390',
    slug: 'ktm-adventure-390',
    brand: 'KTM',
    category: 'bike',
    type: 'Adventure',
    basePrice: 899,
    features: ['Adventure Tourer', 'Off-road Ready', 'Long Range', 'TFT Display'],
    specs: {
      engine: '373cc',
      mileage: '25-28 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/ktm-adventure-390.jpg'],
    popularIn: ['HP', 'UK', 'LA', 'RJ'],
    seoKeywords: ['ktm adventure rental', 'adventure 390 hire'],
    priority: 8,
  },

  // Scooters - High Volume
  {
    id: 'honda-activa-6g',
    name: 'Honda Activa 6G',
    slug: 'honda-activa-6g',
    brand: 'Honda',
    category: 'bike',
    type: 'Scooter',
    basePrice: 399,
    features: ['Most Popular Scooter', 'Economical', 'Comfortable', 'Easy to Ride'],
    specs: {
      engine: '109.51cc',
      mileage: '45-50 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/honda-activa-6g.jpg'],
    popularIn: ['MH', 'KA', 'TN', 'AP', 'DL', 'GJ'],
    seoKeywords: ['activa on rent', 'scooty rental', 'honda scooter hire'],
    priority: 10,
  },
  {
    id: 'tvs-jupiter',
    name: 'TVS Jupiter',
    slug: 'tvs-jupiter',
    brand: 'TVS',
    category: 'bike',
    type: 'Scooter',
    basePrice: 399,
    features: ['Comfortable', 'Spacious', 'Good Mileage', 'Storage'],
    specs: {
      engine: '109.7cc',
      mileage: '50-55 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/tvs-jupiter.jpg'],
    popularIn: ['TN', 'KA', 'AP', 'TS'],
    seoKeywords: ['jupiter rental', 'tvs scooter rent'],
    priority: 9,
  },
  {
    id: 'suzuki-access-125',
    name: 'Suzuki Access 125',
    slug: 'suzuki-access-125',
    brand: 'Suzuki',
    category: 'bike',
    type: 'Scooter',
    basePrice: 399,
    features: ['Premium Scooter', 'Bluetooth', 'LED Lights', 'Comfortable'],
    specs: {
      engine: '124cc',
      mileage: '45-50 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/suzuki-access-125.jpg'],
    popularIn: ['GJ', 'MH', 'MP', 'RJ'],
    seoKeywords: ['access 125 rental', 'suzuki scooter hire'],
    priority: 9,
  },

  // Commuter Bikes
  {
    id: 'bajaj-pulsar-150',
    name: 'Bajaj Pulsar 150',
    slug: 'bajaj-pulsar-150',
    brand: 'Bajaj',
    category: 'bike',
    type: 'Commuter',
    basePrice: 449,
    features: ['Sporty Look', 'Economical', 'Reliable', 'Good Mileage'],
    specs: {
      engine: '149.5cc',
      mileage: '45-50 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/pulsar-150.jpg'],
    popularIn: ['UP', 'BR', 'MP', 'RJ', 'HR'],
    seoKeywords: ['pulsar rental', 'pulsar 150 hire', 'bajaj bike rent'],
    priority: 8,
  },
  {
    id: 'hero-splendor-plus',
    name: 'Hero Splendor Plus',
    slug: 'hero-splendor-plus',
    brand: 'Hero',
    category: 'bike',
    type: 'Commuter',
    basePrice: 349,
    features: ['Budget Friendly', 'High Mileage', 'Reliable', 'Low Maintenance'],
    specs: {
      engine: '97.2cc',
      mileage: '60-70 kmpl',
      seating: 2,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/hero-splendor.jpg'],
    popularIn: ['UP', 'BR', 'MP', 'RJ'],
    seoKeywords: ['splendor rental', 'budget bike rent', 'hero bike hire'],
    priority: 7,
  },
];

// CARS - Four Wheelers
export const CARS: Vehicle[] = [
  // Hatchbacks
  {
    id: 'maruti-swift',
    name: 'Maruti Swift',
    slug: 'maruti-swift',
    brand: 'Maruti Suzuki',
    category: 'car',
    type: 'Hatchback',
    basePrice: 999,
    features: ['Compact', 'Fuel Efficient', 'Easy Parking', 'Popular'],
    specs: {
      engine: '1197cc',
      mileage: '22-25 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/maruti-swift.jpg'],
    popularIn: ['MH', 'DL', 'KA', 'TN', 'GJ'],
    seoKeywords: ['swift on rent', 'swift rental', 'hatchback hire'],
    priority: 10,
  },
  {
    id: 'hyundai-i20',
    name: 'Hyundai i20',
    slug: 'hyundai-i20',
    brand: 'Hyundai',
    category: 'car',
    type: 'Hatchback',
    basePrice: 1099,
    features: ['Premium Hatchback', 'Comfortable', 'Feature Rich', 'Stylish'],
    specs: {
      engine: '1197cc',
      mileage: '20-22 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/hyundai-i20.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['i20 rental', 'hyundai car rent', 'premium hatchback hire'],
    priority: 9,
  },
  {
    id: 'tata-altroz',
    name: 'Tata Altroz',
    slug: 'tata-altroz',
    brand: 'Tata',
    category: 'car',
    type: 'Hatchback',
    basePrice: 1049,
    features: ['5-Star Safety', 'Spacious', 'Premium', 'Latest Tech'],
    specs: {
      engine: '1199cc',
      mileage: '19-23 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/tata-altroz.jpg'],
    popularIn: ['MH', 'GJ', 'MP', 'RJ'],
    seoKeywords: ['altroz rental', 'tata car hire', 'safe hatchback rent'],
    priority: 8,
  },

  // Sedans
  {
    id: 'honda-city',
    name: 'Honda City',
    slug: 'honda-city',
    brand: 'Honda',
    category: 'car',
    type: 'Sedan',
    basePrice: 1499,
    features: ['Premium Sedan', 'Comfortable', 'Spacious', 'Highway Ready'],
    specs: {
      engine: '1498cc',
      mileage: '17-20 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/honda-city.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'UP'],
    seoKeywords: ['city rental', 'sedan on rent', 'honda city hire'],
    priority: 10,
  },
  {
    id: 'hyundai-verna',
    name: 'Hyundai Verna',
    slug: 'hyundai-verna',
    brand: 'Hyundai',
    category: 'car',
    type: 'Sedan',
    basePrice: 1549,
    features: ['Luxury Sedan', 'Feature Loaded', 'Comfortable', 'Stylish'],
    specs: {
      engine: '1493cc',
      mileage: '17-20 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/hyundai-verna.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['verna rental', 'hyundai sedan rent', 'luxury car hire'],
    priority: 9,
  },
  {
    id: 'maruti-ciaz',
    name: 'Maruti Ciaz',
    slug: 'maruti-ciaz',
    brand: 'Maruti Suzuki',
    category: 'car',
    type: 'Sedan',
    basePrice: 1399,
    features: ['Spacious', 'Economical', 'Comfortable', 'Good Mileage'],
    specs: {
      engine: '1462cc',
      mileage: '20-22 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/maruti-ciaz.jpg'],
    popularIn: ['DL', 'MH', 'GJ', 'RJ'],
    seoKeywords: ['ciaz rental', 'maruti sedan rent', 'economical sedan hire'],
    priority: 8,
  },

  // SUVs - High Demand
  {
    id: 'hyundai-creta',
    name: 'Hyundai Creta',
    slug: 'hyundai-creta',
    brand: 'Hyundai',
    category: 'car',
    type: 'SUV',
    basePrice: 2499,
    features: ['Most Popular SUV', 'Spacious', 'Feature Rich', 'Comfortable'],
    specs: {
      engine: '1497cc',
      mileage: '16-18 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/hyundai-creta.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'GJ', 'RJ'],
    seoKeywords: ['creta rental', 'suv on rent', 'hyundai creta hire'],
    priority: 10,
  },
  {
    id: 'kia-seltos',
    name: 'Kia Seltos',
    slug: 'kia-seltos',
    brand: 'Kia',
    category: 'car',
    type: 'SUV',
    basePrice: 2599,
    features: ['Premium SUV', 'Loaded with Features', 'Powerful', 'Stylish'],
    specs: {
      engine: '1497cc',
      mileage: '16-18 kmpl',
      seating: 5,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/kia-seltos.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['seltos rental', 'kia suv rent', 'premium suv hire'],
    priority: 10,
  },
  {
    id: 'mahindra-xuv500',
    name: 'Mahindra XUV500',
    slug: 'mahindra-xuv500',
    brand: 'Mahindra',
    category: 'car',
    type: 'SUV',
    basePrice: 2799,
    features: ['7-Seater', 'Spacious', 'Powerful', 'Family SUV'],
    specs: {
      engine: '2179cc',
      mileage: '13-15 kmpl',
      seating: 7,
      transmission: 'Manual/Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/mahindra-xuv500.jpg'],
    popularIn: ['MH', 'MP', 'RJ', 'UP'],
    seoKeywords: ['xuv500 rental', '7 seater suv rent', 'mahindra hire'],
    priority: 9,
  },
  {
    id: 'toyota-fortuner',
    name: 'Toyota Fortuner',
    slug: 'toyota-fortuner',
    brand: 'Toyota',
    category: 'car',
    type: 'Premium SUV',
    basePrice: 5999,
    features: ['Luxury SUV', '7-Seater', 'Powerful', 'Premium'],
    specs: {
      engine: '2755cc',
      mileage: '10-12 kmpl',
      seating: 7,
      transmission: 'Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/toyota-fortuner.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'GJ'],
    seoKeywords: ['fortuner rental', 'luxury suv rent', 'fortuner hire'],
    priority: 9,
  },

  // MUVs - Family Vehicles
  {
    id: 'maruti-ertiga',
    name: 'Maruti Ertiga',
    slug: 'maruti-ertiga',
    brand: 'Maruti Suzuki',
    category: 'car',
    type: 'MUV',
    basePrice: 1999,
    features: ['7-Seater', 'Economical', 'Spacious', 'Family Car'],
    specs: {
      engine: '1462cc',
      mileage: '19-20 kmpl',
      seating: 7,
      transmission: 'Manual/Automatic',
      fuelType: 'Petrol/CNG',
    },
    images: ['/images/fleet/maruti-ertiga.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'GJ', 'RJ'],
    seoKeywords: ['ertiga rental', '7 seater car rent', 'family car hire'],
    priority: 10,
  },
  {
    id: 'toyota-innova-crysta',
    name: 'Toyota Innova Crysta',
    slug: 'toyota-innova-crysta',
    brand: 'Toyota',
    category: 'car',
    type: 'MUV',
    basePrice: 3499,
    features: ['Premium MUV', '7/8-Seater', 'Most Reliable', 'Comfortable'],
    specs: {
      engine: '2393cc',
      mileage: '11-15 kmpl',
      seating: 8,
      transmission: 'Manual/Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/toyota-innova-crysta.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'UP'],
    seoKeywords: ['innova rental', 'innova crysta hire', 'premium muv rent'],
    priority: 10,
  },

  // Luxury Cars - High Priority SEO
  {
    id: 'mercedes-e-class',
    name: 'Mercedes E-Class',
    slug: 'mercedes-e-class',
    brand: 'Mercedes-Benz',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 5999,
    features: ['Luxury', 'Premium Interior', 'Advanced Safety', 'Chauffeur Available'],
    specs: {
      engine: '1991cc',
      mileage: '12-14 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel/Petrol',
    },
    images: ['/images/fleet/mercedes-e-class.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'GJ'],
    seoKeywords: ['mercedes rental', 'e class hire', 'luxury car rental', 'mercedes benz rent'],
    priority: 10,
  },
  {
    id: 'bmw-5-series',
    name: 'BMW 5 Series',
    slug: 'bmw-5-series',
    brand: 'BMW',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 6499,
    features: ['Luxury', 'Sport Mode', 'Premium Features', 'Executive Class'],
    specs: {
      engine: '1998cc',
      mileage: '12-15 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel/Petrol',
    },
    images: ['/images/fleet/bmw-5-series.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['bmw rental', '5 series hire', 'luxury bmw rent', 'premium car rental'],
    priority: 10,
  },
  {
    id: 'audi-a6',
    name: 'Audi A6',
    slug: 'audi-a6',
    brand: 'Audi',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 6999,
    features: ['Luxury', 'Quattro AWD', 'Premium Sound', 'Advanced Tech'],
    specs: {
      engine: '1984cc',
      mileage: '12-14 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel/Petrol',
    },
    images: ['/images/fleet/audi-a6.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'GJ'],
    seoKeywords: ['audi rental', 'a6 hire', 'luxury audi rent', 'premium sedan rental'],
    priority: 9,
  },
  {
    id: 'jaguar-xf',
    name: 'Jaguar XF',
    slug: 'jaguar-xf',
    brand: 'Jaguar',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 7499,
    features: ['British Luxury', 'Premium Comfort', 'Executive Class', 'Advanced Features'],
    specs: {
      engine: '1999cc',
      mileage: '11-13 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/jaguar-xf.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['jaguar rental', 'xf hire', 'luxury jaguar rent', 'british luxury car'],
    priority: 9,
  },
  {
    id: 'range-rover',
    name: 'Range Rover',
    slug: 'range-rover',
    brand: 'Land Rover',
    category: 'car',
    type: 'Luxury SUV',
    basePrice: 9999,
    features: ['Ultra Luxury', 'Off-road Capable', 'Premium Interior', 'Ultimate Comfort'],
    specs: {
      engine: '2996cc',
      mileage: '8-10 kmpl',
      seating: 7,
      transmission: 'Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/range-rover.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['range rover rental', 'land rover hire', 'luxury suv rent', 'premium suv rental'],
    priority: 9,
  },

  // Ultra Luxury & Exotic Cars - Premium Tier
  {
    id: 'rolls-royce-ghost',
    name: 'Rolls-Royce Ghost',
    slug: 'rolls-royce-ghost',
    brand: 'Rolls-Royce',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 45000,
    features: ['Ultimate Luxury', 'Starlight Headliner', 'Bespoke Interior', 'Whisper Quiet'],
    specs: {
      engine: '6749cc V12',
      mileage: '6-8 kmpl',
      seating: 4,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/rolls-royce-ghost.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['rolls royce rental', 'rolls royce ghost hire', 'ultra luxury car rental', 'wedding rolls royce'],
    priority: 10,
  },
  {
    id: 'bentley-continental',
    name: 'Bentley Continental GT',
    slug: 'bentley-continental',
    brand: 'Bentley',
    category: 'car',
    type: 'Luxury Coupe',
    basePrice: 35000,
    features: ['Grand Tourer', 'Handcrafted Interior', 'Twin-Turbo W12', 'Supreme Comfort'],
    specs: {
      engine: '5998cc W12',
      mileage: '7-9 kmpl',
      seating: 4,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/bentley-continental.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['bentley rental', 'bentley continental hire', 'luxury coupe rental', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'porsche-911',
    name: 'Porsche 911 Carrera',
    slug: 'porsche-911',
    brand: 'Porsche',
    category: 'car',
    type: 'Sports Car',
    basePrice: 25000,
    features: ['Iconic Sports Car', 'Rear Engine', 'Track Ready', 'Timeless Design'],
    specs: {
      engine: '2981cc Flat-6',
      mileage: '8-10 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/porsche-911.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['porsche rental', 'porsche 911 hire', 'sports car rental', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'lamborghini-huracan',
    name: 'Lamborghini Huracan',
    slug: 'lamborghini-huracan',
    brand: 'Lamborghini',
    category: 'car',
    type: 'Sports Car',
    basePrice: 75000,
    features: ['Supercar', 'V10 Engine', 'Scissor Doors', 'Head Turner'],
    specs: {
      engine: '5204cc V10',
      mileage: '5-7 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/lamborghini-huracan.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['lamborghini rental', 'lamborghini huracan hire', 'supercar rental', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'ferrari-488',
    name: 'Ferrari 488 GTB',
    slug: 'ferrari-488',
    brand: 'Ferrari',
    category: 'car',
    type: 'Sports Car',
    basePrice: 85000,
    features: ['Italian Supercar', 'Twin-Turbo V8', 'Racing Heritage', 'Iconic Brand'],
    specs: {
      engine: '3902cc V8',
      mileage: '5-7 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/ferrari-488.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['ferrari rental', 'ferrari 488 hire', 'supercar rental india', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'mercedes-s-class',
    name: 'Mercedes S-Class',
    slug: 'mercedes-s-class',
    brand: 'Mercedes-Benz',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 12999,
    features: ['Flagship Luxury', 'MBUX', 'Executive Rear Seats', 'Magic Body Control'],
    specs: {
      engine: '2999cc',
      mileage: '10-12 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/mercedes-s-class.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'GJ'],
    seoKeywords: ['mercedes s class rental', 's class hire', 'flagship luxury rental', 'executive car rent'],
    priority: 10,
  },
  {
    id: 'mercedes-maybach',
    name: 'Mercedes-Maybach S-Class',
    slug: 'mercedes-maybach',
    brand: 'Mercedes-Maybach',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 25000,
    features: ['Ultra Luxury', 'Extended Wheelbase', 'Executive Seats', 'Champagne Cooler'],
    specs: {
      engine: '3982cc V8',
      mileage: '8-10 kmpl',
      seating: 4,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/mercedes-maybach.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['maybach rental', 'mercedes maybach hire', 'ultra luxury rental', 'vip car rent'],
    priority: 10,
  },
  {
    id: 'bmw-7-series',
    name: 'BMW 7 Series',
    slug: 'bmw-7-series',
    brand: 'BMW',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 11999,
    features: ['Flagship BMW', 'iDrive 8', 'Executive Lounge', 'Gesture Control'],
    specs: {
      engine: '2998cc',
      mileage: '10-12 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/bmw-7-series.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['bmw 7 series rental', '7 series hire', 'flagship bmw rental', 'executive sedan rent'],
    priority: 10,
  },
  {
    id: 'audi-a8',
    name: 'Audi A8 L',
    slug: 'audi-a8',
    brand: 'Audi',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 11499,
    features: ['Flagship Audi', 'Quattro AWD', 'Virtual Cockpit', 'Predictive Suspension'],
    specs: {
      engine: '2995cc',
      mileage: '10-12 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol/Diesel',
    },
    images: ['/images/fleet/audi-a8.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'GJ'],
    seoKeywords: ['audi a8 rental', 'a8 l hire', 'flagship audi rental', 'executive car rent'],
    priority: 10,
  },
  {
    id: 'range-rover-velar',
    name: 'Range Rover Velar',
    slug: 'range-rover-velar',
    brand: 'Land Rover',
    category: 'car',
    type: 'Luxury SUV',
    basePrice: 8499,
    features: ['Avant-garde Design', 'Touch Pro Duo', 'Elegant Interior', 'All-Terrain'],
    specs: {
      engine: '1997cc',
      mileage: '10-12 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel',
    },
    images: ['/images/fleet/range-rover-velar.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN'],
    seoKeywords: ['velar rental', 'range rover velar hire', 'luxury suv rental', 'premium suv rent'],
    priority: 9,
  },
  {
    id: 'porsche-cayenne',
    name: 'Porsche Cayenne',
    slug: 'porsche-cayenne',
    brand: 'Porsche',
    category: 'car',
    type: 'Luxury SUV',
    basePrice: 15999,
    features: ['Sports SUV', 'Track Capable', 'Premium Interior', 'Dynamic Chassis'],
    specs: {
      engine: '2995cc',
      mileage: '8-10 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/porsche-cayenne.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['cayenne rental', 'porsche cayenne hire', 'sports suv rental', 'luxury suv rent'],
    priority: 10,
  },
  {
    id: 'bentley-bentayga',
    name: 'Bentley Bentayga',
    slug: 'bentley-bentayga',
    brand: 'Bentley',
    category: 'car',
    type: 'Luxury SUV',
    basePrice: 40000,
    features: ['Ultra Luxury SUV', 'Handcrafted', 'All-Terrain', 'Exquisite Interior'],
    specs: {
      engine: '3996cc V8',
      mileage: '7-9 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/bentley-bentayga.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['bentayga rental', 'bentley bentayga hire', 'ultra luxury suv rental', 'premium suv rent'],
    priority: 10,
  },
  {
    id: 'maserati-ghibli',
    name: 'Maserati Ghibli',
    slug: 'maserati-ghibli',
    brand: 'Maserati',
    category: 'car',
    type: 'Luxury Sedan',
    basePrice: 18000,
    features: ['Italian Elegance', 'Ferrari Engine', 'Distinctive Sound', 'Sporty Luxury'],
    specs: {
      engine: '2979cc V6',
      mileage: '8-10 kmpl',
      seating: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/maserati-ghibli.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['maserati rental', 'maserati ghibli hire', 'italian luxury rental', 'exotic sedan rent'],
    priority: 9,
  },
  {
    id: 'aston-martin-db11',
    name: 'Aston Martin DB11',
    slug: 'aston-martin-db11',
    brand: 'Aston Martin',
    category: 'car',
    type: 'Sports Car',
    basePrice: 55000,
    features: ['British GT', 'Twin-Turbo V8', 'Elegant Design', 'Bond Car'],
    specs: {
      engine: '3982cc V8',
      mileage: '7-9 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/aston-martin-db11.jpg'],
    popularIn: ['DL', 'MH'],
    seoKeywords: ['aston martin rental', 'db11 hire', 'british sports car rental', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'mercedes-amg-gt',
    name: 'Mercedes-AMG GT',
    slug: 'mercedes-amg-gt',
    brand: 'Mercedes-AMG',
    category: 'car',
    type: 'Sports Car',
    basePrice: 30000,
    features: ['Handcrafted AMG', 'Bi-Turbo V8', 'Track Ready', 'Pure Sports'],
    specs: {
      engine: '3982cc V8',
      mileage: '7-9 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/mercedes-amg-gt.jpg'],
    popularIn: ['DL', 'MH', 'KA'],
    seoKeywords: ['amg gt rental', 'mercedes amg hire', 'sports car rental', 'exotic car rent'],
    priority: 10,
  },
  {
    id: 'convertible-bmw-z4',
    name: 'BMW Z4 Convertible',
    slug: 'bmw-z4-convertible',
    brand: 'BMW',
    category: 'car',
    type: 'Convertible',
    basePrice: 12999,
    features: ['Open Top', 'Sports Roadster', 'Wind in Hair', 'Photoshoot Perfect'],
    specs: {
      engine: '1998cc',
      mileage: '10-12 kmpl',
      seating: 2,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/bmw-z4.jpg'],
    popularIn: ['GA', 'MH', 'KA'],
    seoKeywords: ['convertible rental', 'bmw z4 hire', 'open top car rental', 'roadster rent'],
    priority: 9,
  },
  {
    id: 'vintage-ambassador',
    name: 'Vintage Ambassador',
    slug: 'vintage-ambassador',
    brand: 'Hindustan Motors',
    category: 'car',
    type: 'Vintage',
    basePrice: 7999,
    features: ['Classic Indian', 'Wedding Special', 'Vintage Charm', 'Photo Perfect'],
    specs: {
      engine: '1817cc',
      mileage: '12-14 kmpl',
      seating: 5,
      transmission: 'Manual',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/vintage-ambassador.jpg'],
    popularIn: ['WB', 'DL', 'MH', 'RJ'],
    seoKeywords: ['vintage car rental', 'ambassador hire', 'wedding vintage car', 'classic car rent'],
    priority: 8,
  },
  {
    id: 'vintage-rolls-royce',
    name: 'Vintage Rolls-Royce',
    slug: 'vintage-rolls-royce',
    brand: 'Rolls-Royce',
    category: 'car',
    type: 'Vintage',
    basePrice: 35000,
    features: ['Classic Elegance', 'Wedding Favorite', 'Timeless Luxury', 'Statement Car'],
    specs: {
      engine: '6750cc',
      mileage: '6-8 kmpl',
      seating: 4,
      transmission: 'Automatic',
      fuelType: 'Petrol',
    },
    images: ['/images/fleet/vintage-rolls-royce.jpg'],
    popularIn: ['DL', 'MH', 'RJ'],
    seoKeywords: ['vintage rolls royce rental', 'classic rolls hire', 'wedding luxury car', 'vintage car rent'],
    priority: 9,
  },
];

// BUSES
export const BUSES: Vehicle[] = [
  {
    id: 'force-traveller-12-seater',
    name: 'Force Traveller 12 Seater',
    slug: 'force-traveller-12-seater',
    brand: 'Force',
    category: 'bus',
    type: 'Mini Bus',
    basePrice: 2499,
    features: ['12-Seater', 'AC', 'Group Travel', 'Comfortable'],
    specs: {
      seating: 12,
      transmission: 'Manual',
      fuelType: 'Diesel',
      capacity: '12 passengers + luggage',
    },
    images: ['/images/fleet/force-traveller-12.jpg'],
    popularIn: ['DL', 'MH', 'RJ', 'UP', 'HR'],
    seoKeywords: ['12 seater on rent', 'tempo traveller rental', 'mini bus hire'],
    priority: 9,
  },
  {
    id: 'tempo-traveller-17-seater',
    name: 'Tempo Traveller 17 Seater',
    slug: 'tempo-traveller-17-seater',
    brand: 'Force',
    category: 'bus',
    type: 'Mini Bus',
    basePrice: 3499,
    features: ['17-Seater', 'AC', 'Pushback Seats', 'LED Screen'],
    specs: {
      seating: 17,
      transmission: 'Manual',
      fuelType: 'Diesel',
      capacity: '17 passengers + luggage',
    },
    images: ['/images/fleet/tempo-traveller-17.jpg'],
    popularIn: ['DL', 'MH', 'RJ', 'UP', 'HR'],
    seoKeywords: ['17 seater rental', 'tempo traveller hire', 'ac bus rent'],
    priority: 10,
  },
  {
    id: 'luxury-bus-45-seater',
    name: 'Luxury Bus 45 Seater',
    slug: 'luxury-bus-45-seater',
    brand: 'Tata/Ashok Leyland',
    category: 'bus',
    type: 'Luxury Coach',
    basePrice: 8999,
    features: ['45-Seater', 'AC', 'Pushback Seats', 'Entertainment System'],
    specs: {
      seating: 45,
      transmission: 'Manual',
      fuelType: 'Diesel',
      capacity: '45 passengers + luggage',
    },
    images: ['/images/fleet/luxury-bus-45.jpg'],
    popularIn: ['DL', 'MH', 'KA', 'TN', 'GJ'],
    seoKeywords: ['45 seater bus rental', 'luxury coach hire', 'ac bus booking'],
    priority: 8,
  },
];

// All vehicles combined
export const ALL_VEHICLES = [...BIKES, ...CARS, ...BUSES];

// Helper functions
export function getVehiclesByCategory(category: 'bike' | 'car' | 'bus' | 'truck' | 'equipment'): Vehicle[] {
  return ALL_VEHICLES.filter(v => v.category === category);
}

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return ALL_VEHICLES.find(v => v.slug === slug);
}

export function getVehicleByName(name: string): Vehicle | undefined {
  const normalizedName = name.toLowerCase().trim();
  return ALL_VEHICLES.find(v =>
    v.name.toLowerCase() === normalizedName ||
    v.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(v.name.toLowerCase())
  );
}

export function getPopularVehicles(limit: number = 10): Vehicle[] {
  return ALL_VEHICLES
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

// Luxury vehicle types
const LUXURY_TYPES = ['Luxury Sedan', 'Luxury SUV', 'Luxury Coupe', 'Sports Car', 'Convertible', 'Vintage', 'Premium SUV'];

// Get luxury cars only
export function getLuxuryVehicles(): Vehicle[] {
  return CARS.filter(v =>
    LUXURY_TYPES.includes(v.type) ||
    v.basePrice >= 5000
  ).sort((a, b) => b.priority - a.priority);
}

// Get luxury cars by type
export function getLuxuryVehiclesByType(type: string): Vehicle[] {
  if (type === 'All') return getLuxuryVehicles();
  return getLuxuryVehicles().filter(v => v.type === type);
}

// Get luxury car brands
export function getLuxuryBrands(): string[] {
  const brands = new Set(getLuxuryVehicles().map(v => v.brand));
  return ['All', ...Array.from(brands).sort()];
}

// Get luxury car types
export function getLuxuryTypes(): string[] {
  const types = new Set(getLuxuryVehicles().map(v => v.type));
  return ['All', ...Array.from(types).sort()];
}

// Fleet statistics
export const FLEET_STATS = {
  bikes: BIKES.length,
  cars: CARS.length,
  buses: BUSES.length,
  total: ALL_VEHICLES.length,
};

console.log(`
🚗 TransRentals Fleet Database Loaded:
- Bikes: ${FLEET_STATS.bikes} models
- Cars: ${FLEET_STATS.cars} models
- Buses: ${FLEET_STATS.buses} models
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ${FLEET_STATS.total} vehicle models ready!
Each vehicle × 287 cities = ${FLEET_STATS.total * 287} potential SEO pages!
`);
