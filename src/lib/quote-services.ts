// Quote-based services configuration
// Services: Packers & Movers, Transporter, Mini Truck, Trailer, JCB, Equipment,
// Wedding Car/Bus, Corporate Car/Bus, Vintage Car, Tempo Traveller

export type QuoteServiceType =
  | 'packers-movers'
  | 'transporter'
  | 'mini-truck'
  | 'trailer'
  | 'jcb'
  | 'equipment'
  | 'wedding-car'
  | 'wedding-bus'
  | 'corporate-car'
  | 'corporate-bus'
  | 'vintage-car'
  | 'tempo-traveller';

export interface QuoteServiceConfig {
  id: QuoteServiceType;
  name: string;
  shortName: string;
  slug: string;
  description: string;
  icon: string;
  color: string; // tailwind color name
  categories: ServiceCategory[];
  defaultInclusions: string[];
  defaultExclusions: string[];
  defaultTerms: string[];
  formFields: FormFieldConfig[];
  pricingType: 'fixed' | 'per-km' | 'per-day' | 'per-hour' | 'custom';
  requiresInspection?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  capacity?: string;
  priceHint?: string;
  features: string[];
  popular?: boolean;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'time' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// ============ PACKERS & MOVERS ============
export const PACKERS_MOVERS_CONFIG: QuoteServiceConfig = {
  id: 'packers-movers',
  name: 'Packers & Movers',
  shortName: 'Packers',
  slug: 'packers-and-movers',
  description: 'Professional packing and moving services for home and office relocation',
  icon: 'Package',
  color: 'blue',
  categories: [
    {
      id: '1bhk',
      name: '1 BHK Shifting',
      shortName: '1 BHK',
      description: 'Small apartment or studio',
      capacity: '1-2 rooms',
      priceHint: 'From ₹4,000',
      features: ['Packing Material', 'Loading/Unloading', 'Transport'],
    },
    {
      id: '2bhk',
      name: '2 BHK Shifting',
      shortName: '2 BHK',
      description: 'Standard apartment',
      capacity: '2-3 rooms',
      priceHint: 'From ₹7,000',
      features: ['Packing Material', 'Loading/Unloading', 'Transport', 'Insurance'],
      popular: true,
    },
    {
      id: '3bhk',
      name: '3 BHK Shifting',
      shortName: '3 BHK',
      description: 'Large apartment',
      capacity: '3-4 rooms',
      priceHint: 'From ₹12,000',
      features: ['Premium Packing', 'Loading/Unloading', 'Transport', 'Insurance'],
    },
    {
      id: '4bhk-villa',
      name: '4 BHK / Villa',
      shortName: '4 BHK+',
      description: 'Villa or large house',
      capacity: '4+ rooms',
      priceHint: 'From ₹18,000',
      features: ['Premium Packing', 'Dedicated Team', 'Transport', 'Full Insurance'],
    },
    {
      id: 'office-small',
      name: 'Small Office',
      shortName: 'Small Office',
      description: 'Upto 10 workstations',
      capacity: '10 seats',
      priceHint: 'From ₹8,000',
      features: ['IT Equipment Handling', 'Furniture Disassembly', 'Transport'],
    },
    {
      id: 'office-large',
      name: 'Large Office',
      shortName: 'Large Office',
      description: '10+ workstations',
      capacity: '10+ seats',
      priceHint: 'Custom Quote',
      features: ['IT Equipment', 'Server Handling', 'Furniture', 'Full Insurance'],
    },
  ],
  defaultInclusions: [
    'Quality packing material (cartons, bubble wrap, tape)',
    'Careful packing by trained staff',
    'Loading at source',
    'Transportation in covered vehicle',
    'Unloading at destination',
    'Unpacking and arranging',
    'Basic transit insurance',
  ],
  defaultExclusions: [
    'Storage charges (if required)',
    'Dismantling of heavy furniture (AC, modular kitchen)',
    'Staircase/lift unavailability charges',
    'Parking/entry permit charges',
    'Delay due to customer unavailability',
  ],
  defaultTerms: [
    '50% advance to confirm booking',
    'Balance before unloading',
    'Inventory list to be signed before loading',
    'Claims within 24 hours of delivery',
    'Fragile items at owner\'s risk unless declared',
  ],
  formFields: [
    { id: 'shiftingType', label: 'Shifting Type', type: 'select', required: true, options: [
      { value: 'home', label: 'Home Shifting' },
      { value: 'office', label: 'Office Shifting' },
      { value: 'vehicle', label: 'Vehicle Transport' },
    ]},
    { id: 'fromAddress', label: 'Pickup Address', type: 'textarea', required: true, placeholder: 'Full address with landmark' },
    { id: 'toAddress', label: 'Drop Address', type: 'textarea', required: true, placeholder: 'Full address with landmark' },
    { id: 'floorFrom', label: 'Floor at Pickup', type: 'select', required: true, options: [
      { value: 'ground', label: 'Ground Floor' },
      { value: '1', label: '1st Floor' },
      { value: '2', label: '2nd Floor' },
      { value: '3', label: '3rd Floor' },
      { value: '4+', label: '4th Floor or Higher' },
    ]},
    { id: 'liftAvailableFrom', label: 'Lift at Pickup', type: 'checkbox', required: false },
    { id: 'floorTo', label: 'Floor at Drop', type: 'select', required: true, options: [
      { value: 'ground', label: 'Ground Floor' },
      { value: '1', label: '1st Floor' },
      { value: '2', label: '2nd Floor' },
      { value: '3', label: '3rd Floor' },
      { value: '4+', label: '4th Floor or Higher' },
    ]},
    { id: 'liftAvailableTo', label: 'Lift at Drop', type: 'checkbox', required: false },
    { id: 'shiftingDate', label: 'Preferred Date', type: 'date', required: true },
  ],
  pricingType: 'custom',
  requiresInspection: true,
};

// ============ TRANSPORTER / LOGISTICS ============
export const TRANSPORTER_CONFIG: QuoteServiceConfig = {
  id: 'transporter',
  name: 'Transporter / Logistics',
  shortName: 'Transporter',
  slug: 'transporter',
  description: 'Goods transport and logistics services for businesses',
  icon: 'Truck',
  color: 'indigo',
  categories: [
    {
      id: 'part-load',
      name: 'Part Load (PTL)',
      shortName: 'Part Load',
      description: 'Share truck space with others',
      capacity: '100-2000 kg',
      priceHint: 'From ₹500/100kg',
      features: ['Cost Effective', 'Regular Routes', 'Tracking'],
    },
    {
      id: 'full-load',
      name: 'Full Truck Load (FTL)',
      shortName: 'Full Load',
      description: 'Dedicated truck for your goods',
      capacity: '1-40 tons',
      priceHint: 'From ₹5,000',
      features: ['Dedicated Vehicle', 'Direct Delivery', 'Faster'],
      popular: true,
    },
    {
      id: 'container',
      name: 'Container Transport',
      shortName: 'Container',
      description: '20ft or 40ft container',
      capacity: '20-40 ft',
      priceHint: 'Custom Quote',
      features: ['Port Handling', 'Secure', 'Long Distance'],
    },
    {
      id: 'odc',
      name: 'ODC (Over Dimensional)',
      shortName: 'ODC',
      description: 'Heavy machinery and oversized cargo',
      capacity: 'Custom',
      priceHint: 'Custom Quote',
      features: ['Special Permits', 'Escort Vehicle', 'Expert Handling'],
    },
  ],
  defaultInclusions: [
    'Goods pickup from source',
    'Secure loading and strapping',
    'Transportation to destination',
    'Unloading at destination',
    'Basic transit insurance',
    'GPS tracking',
  ],
  defaultExclusions: [
    'Packaging and crating',
    'Warehousing charges',
    'Customs clearance (if applicable)',
    'Detention charges beyond free time',
    'Special handling equipment',
  ],
  defaultTerms: [
    'Lorry receipt to be signed',
    'Claims within 48 hours of delivery',
    'Consignee to arrange unloading labour',
    'Freight prepaid or to-pay as agreed',
    'Subject to carrier\'s terms and conditions',
  ],
  formFields: [
    { id: 'goodsType', label: 'Type of Goods', type: 'text', required: true, placeholder: 'e.g., Machinery, FMCG, Textiles' },
    { id: 'weight', label: 'Approximate Weight (kg)', type: 'number', required: true, placeholder: '1000' },
    { id: 'dimensions', label: 'Dimensions (LxWxH in ft)', type: 'text', required: false, placeholder: '10x5x5' },
    { id: 'pickupDate', label: 'Pickup Date', type: 'date', required: true },
    { id: 'deliveryType', label: 'Delivery Type', type: 'select', required: true, options: [
      { value: 'standard', label: 'Standard (3-7 days)' },
      { value: 'express', label: 'Express (1-3 days)' },
      { value: 'same-day', label: 'Same Day' },
    ]},
  ],
  pricingType: 'per-km',
};

// ============ MINI TRUCK RENTAL ============
export const MINI_TRUCK_CONFIG: QuoteServiceConfig = {
  id: 'mini-truck',
  name: 'Mini Truck Rental',
  shortName: 'Mini Truck',
  slug: 'mini-truck-rental',
  description: 'Small commercial vehicles for local and short-distance transport',
  icon: 'Truck',
  color: 'orange',
  categories: [
    {
      id: 'tata-ace',
      name: 'Tata Ace / Chhota Hathi',
      shortName: 'Tata Ace',
      description: 'Mini truck for small loads',
      capacity: '750 kg',
      priceHint: 'From ₹500/trip',
      features: ['Compact', 'City Friendly', 'Economical'],
      popular: true,
    },
    {
      id: 'pickup-8ft',
      name: '8 Feet Pickup',
      shortName: '8ft Pickup',
      description: 'Open body pickup',
      capacity: '1-1.5 tons',
      priceHint: 'From ₹800/trip',
      features: ['Open Body', 'Easy Loading', 'Versatile'],
    },
    {
      id: 'pickup-14ft',
      name: '14 Feet Pickup',
      shortName: '14ft Pickup',
      description: 'Larger pickup truck',
      capacity: '2-3 tons',
      priceHint: 'From ₹1,500/trip',
      features: ['Large Capacity', 'Covered Option', 'Long Distance'],
    },
    {
      id: 'eicher-14ft',
      name: 'Eicher 14 Feet',
      shortName: 'Eicher 14ft',
      description: 'Closed container truck',
      capacity: '3-4 tons',
      priceHint: 'From ₹2,000/trip',
      features: ['Closed Body', 'Secure', 'Weather Protected'],
    },
  ],
  defaultInclusions: [
    'Vehicle with driver',
    'Fuel for agreed distance',
    'Loading point to unloading point',
    'One-time loading and unloading assistance',
  ],
  defaultExclusions: [
    'Multiple stops (extra charges)',
    'Waiting beyond 30 minutes',
    'Packaging material',
    'Extra labour for heavy items',
    'Toll and parking (actuals)',
  ],
  defaultTerms: [
    'Payment on delivery or advance as agreed',
    'Customer to ensure legal goods only',
    'Driver will not assist in 4th floor+ without lift',
    'Vehicle booking for 4 hours minimum',
  ],
  formFields: [
    { id: 'goodsType', label: 'Type of Goods', type: 'text', required: true, placeholder: 'e.g., Furniture, Cartons' },
    { id: 'weight', label: 'Approximate Weight (kg)', type: 'number', required: true },
    { id: 'pickupDate', label: 'Pickup Date', type: 'date', required: true },
    { id: 'pickupTime', label: 'Pickup Time', type: 'time', required: true },
    { id: 'needHelper', label: 'Need Loading Helper', type: 'checkbox', required: false },
  ],
  pricingType: 'fixed',
};

// ============ TRAILER RENTAL ============
export const TRAILER_CONFIG: QuoteServiceConfig = {
  id: 'trailer',
  name: 'Trailer on Rent',
  shortName: 'Trailer',
  slug: 'trailer-on-rent',
  description: 'Trailers and low-bed trucks for heavy machinery transport',
  icon: 'Container',
  color: 'slate',
  categories: [
    {
      id: 'flatbed-20ft',
      name: '20 Feet Flatbed',
      shortName: '20ft Flatbed',
      description: 'Standard flatbed trailer',
      capacity: '15-20 tons',
      priceHint: 'From ₹15,000/trip',
      features: ['Open Platform', 'Easy Loading', 'Versatile'],
    },
    {
      id: 'flatbed-40ft',
      name: '40 Feet Flatbed',
      shortName: '40ft Flatbed',
      description: 'Large flatbed trailer',
      capacity: '25-30 tons',
      priceHint: 'From ₹25,000/trip',
      features: ['Large Capacity', 'Multi-axle', 'Heavy Duty'],
      popular: true,
    },
    {
      id: 'lowbed',
      name: 'Low Bed Trailer',
      shortName: 'Low Bed',
      description: 'For heavy machinery and tall equipment',
      capacity: '30-50 tons',
      priceHint: 'From ₹35,000/trip',
      features: ['Low Height', 'Ramps', 'Heavy Machinery'],
    },
    {
      id: 'semi-lowbed',
      name: 'Semi Low Bed',
      shortName: 'Semi Low Bed',
      description: 'Medium height for moderate loads',
      capacity: '25-40 tons',
      priceHint: 'From ₹30,000/trip',
      features: ['Medium Height', 'Flexible', 'Industrial'],
    },
  ],
  defaultInclusions: [
    'Trailer with prime mover and driver',
    'Loading and unloading supervision',
    'Basic strapping and securing',
    'Transit insurance',
    'Route permits',
  ],
  defaultExclusions: [
    'Crane for loading/unloading',
    'Special permits (ODC)',
    'Escort vehicle',
    'Overnight halts',
    'Detention charges',
  ],
  defaultTerms: [
    '50% advance booking',
    'Full payment before unloading',
    'Cargo weight to be declared accurately',
    'Route to be finalized before trip',
    'Cancellation charges apply',
  ],
  formFields: [
    { id: 'cargoType', label: 'Cargo Type', type: 'text', required: true, placeholder: 'e.g., Excavator, Steel Coils' },
    { id: 'weight', label: 'Cargo Weight (tons)', type: 'number', required: true },
    { id: 'dimensions', label: 'Dimensions (LxWxH ft)', type: 'text', required: true },
    { id: 'loadingDate', label: 'Loading Date', type: 'date', required: true },
    { id: 'needCrane', label: 'Need Crane for Loading', type: 'checkbox', required: false },
  ],
  pricingType: 'per-km',
};

// ============ JCB / CONSTRUCTION EQUIPMENT ============
export const JCB_CONFIG: QuoteServiceConfig = {
  id: 'jcb',
  name: 'JCB on Rent',
  shortName: 'JCB',
  slug: 'jcb-on-rent',
  description: 'JCB backhoe loaders and excavators for construction and earthwork',
  icon: 'Cog',
  color: 'yellow',
  categories: [
    {
      id: 'jcb-3dx',
      name: 'JCB 3DX Backhoe',
      shortName: 'JCB 3DX',
      description: 'Standard backhoe loader',
      capacity: '76 HP',
      priceHint: 'From ₹1,500/hr',
      features: ['Digging', 'Loading', 'Leveling'],
      popular: true,
    },
    {
      id: 'jcb-4dx',
      name: 'JCB 4DX Backhoe',
      shortName: 'JCB 4DX',
      description: 'Heavy duty backhoe',
      capacity: '92 HP',
      priceHint: 'From ₹1,800/hr',
      features: ['Heavy Duty', 'Faster', 'More Power'],
    },
    {
      id: 'excavator-pc200',
      name: 'Excavator PC200',
      shortName: 'PC200',
      description: '20-ton excavator',
      capacity: '20 tons',
      priceHint: 'From ₹2,500/hr',
      features: ['Deep Digging', 'Large Bucket', 'High Output'],
    },
    {
      id: 'excavator-pc300',
      name: 'Excavator PC300',
      shortName: 'PC300',
      description: '30-ton excavator',
      capacity: '30 tons',
      priceHint: 'From ₹3,500/hr',
      features: ['Mining', 'Heavy Excavation', 'Maximum Power'],
    },
    {
      id: 'wheel-loader',
      name: 'Wheel Loader',
      shortName: 'Loader',
      description: 'Front-end loader',
      capacity: '2-4 cubic m',
      priceHint: 'From ₹1,800/hr',
      features: ['Material Handling', 'Fast', 'Versatile'],
    },
  ],
  defaultInclusions: [
    'Equipment with trained operator',
    'Fuel for agreed hours',
    'Basic maintenance during rental',
    'Operator allowance',
  ],
  defaultExclusions: [
    'Transportation to/from site',
    'Attachments (breaker, ripper)',
    'Overtime charges',
    'Damage due to misuse',
    'Fuel beyond agreed hours',
  ],
  defaultTerms: [
    'Minimum 8 hours booking per day',
    'Site to be accessible for equipment',
    'Payment weekly or as agreed',
    'Breakdown time not charged',
    'Security deposit required',
  ],
  formFields: [
    { id: 'workType', label: 'Type of Work', type: 'select', required: true, options: [
      { value: 'excavation', label: 'Excavation' },
      { value: 'loading', label: 'Material Loading' },
      { value: 'leveling', label: 'Land Leveling' },
      { value: 'demolition', label: 'Demolition' },
      { value: 'trenching', label: 'Trenching' },
    ]},
    { id: 'duration', label: 'Rental Duration', type: 'select', required: true, options: [
      { value: '1-day', label: '1 Day' },
      { value: '1-week', label: '1 Week' },
      { value: '1-month', label: '1 Month' },
      { value: 'long-term', label: 'Long Term (3+ months)' },
    ]},
    { id: 'startDate', label: 'Start Date', type: 'date', required: true },
    { id: 'siteLocation', label: 'Site Location', type: 'text', required: true },
  ],
  pricingType: 'per-hour',
};

// ============ EQUIPMENT RENTAL ============
export const EQUIPMENT_CONFIG: QuoteServiceConfig = {
  id: 'equipment',
  name: 'Equipment Rental',
  shortName: 'Equipment',
  slug: 'equipment-rental',
  description: 'Construction and industrial equipment on rent',
  icon: 'Wrench',
  color: 'amber',
  categories: [
    {
      id: 'crane',
      name: 'Cranes',
      shortName: 'Crane',
      description: 'Mobile and tower cranes',
      capacity: '10-500 tons',
      priceHint: 'From ₹3,000/hr',
      features: ['Heavy Lifting', 'Various Capacities'],
    },
    {
      id: 'forklift',
      name: 'Forklifts',
      shortName: 'Forklift',
      description: 'Material handling forklifts',
      capacity: '2-10 tons',
      priceHint: 'From ₹800/hr',
      features: ['Warehouse', 'Loading', 'Compact'],
    },
    {
      id: 'compactor',
      name: 'Road Roller / Compactor',
      shortName: 'Compactor',
      description: 'For road and site compaction',
      capacity: '8-12 tons',
      priceHint: 'From ₹2,000/hr',
      features: ['Compaction', 'Road Work', 'Heavy Duty'],
    },
    {
      id: 'generator',
      name: 'DG Set / Generator',
      shortName: 'Generator',
      description: 'Power generators',
      capacity: '25-500 KVA',
      priceHint: 'From ₹1,500/day',
      features: ['Silent', 'Reliable', 'Various Capacities'],
      popular: true,
    },
    {
      id: 'concrete-mixer',
      name: 'Concrete Mixer',
      shortName: 'Mixer',
      description: 'Transit mixer and batching',
      capacity: '6-10 cubic m',
      priceHint: 'From ₹5,000/trip',
      features: ['Ready Mix', 'On-site Delivery'],
    },
  ],
  defaultInclusions: [
    'Equipment in working condition',
    'Trained operator (if applicable)',
    'Basic maintenance',
    'Safety gear',
  ],
  defaultExclusions: [
    'Fuel/electricity consumption',
    'Transportation to site',
    'Damage repairs',
    'Overtime charges',
  ],
  defaultTerms: [
    'Security deposit required',
    'Daily/weekly/monthly rates available',
    'Minimum booking period applies',
    'Equipment to be used as intended',
  ],
  formFields: [
    { id: 'equipmentType', label: 'Equipment Type', type: 'text', required: true },
    { id: 'duration', label: 'Rental Duration', type: 'select', required: true, options: [
      { value: 'hourly', label: 'Hourly' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ]},
    { id: 'startDate', label: 'Start Date', type: 'date', required: true },
    { id: 'siteLocation', label: 'Site Address', type: 'textarea', required: true },
  ],
  pricingType: 'custom',
};

// ============ WEDDING CAR RENTAL ============
export const WEDDING_CAR_CONFIG: QuoteServiceConfig = {
  id: 'wedding-car',
  name: 'Wedding Car Rental',
  shortName: 'Wedding Car',
  slug: 'wedding-car-rental',
  description: 'Decorated luxury cars for weddings and special occasions',
  icon: 'Car',
  color: 'pink',
  categories: [
    {
      id: 'sedan-decorated',
      name: 'Decorated Sedan',
      shortName: 'Sedan',
      description: 'Honda City, Ciaz decorated',
      capacity: '4 passengers',
      priceHint: 'From ₹5,000',
      features: ['Flowers', 'Ribbons', 'AC'],
    },
    {
      id: 'suv-decorated',
      name: 'Decorated SUV',
      shortName: 'SUV',
      description: 'Innova, XUV decorated',
      capacity: '6-7 passengers',
      priceHint: 'From ₹8,000',
      features: ['Spacious', 'Premium Decor', 'AC'],
      popular: true,
    },
    {
      id: 'luxury-decorated',
      name: 'Luxury Car Decorated',
      shortName: 'Luxury',
      description: 'BMW, Mercedes, Audi',
      capacity: '4 passengers',
      priceHint: 'From ₹15,000',
      features: ['Premium Brand', 'VIP Treatment', 'Chauffeur'],
    },
    {
      id: 'vintage-wedding',
      name: 'Vintage Wedding Car',
      shortName: 'Vintage',
      description: 'Classic cars for grand entry',
      capacity: '2-4 passengers',
      priceHint: 'From ₹25,000',
      features: ['Classic Look', 'Photo-worthy', 'Unique'],
    },
    {
      id: 'convertible',
      name: 'Convertible / Open Top',
      shortName: 'Convertible',
      description: 'Open-top for grand entry',
      capacity: '2-4 passengers',
      priceHint: 'From ₹20,000',
      features: ['Open Top', 'Royal Entry', 'Stunning'],
    },
  ],
  defaultInclusions: [
    'Decorated car as selected',
    'Professional chauffeur in formal attire',
    'Flower decoration',
    'Ribbon and drapes',
    'Red carpet entry (if requested)',
    'Photography support time',
  ],
  defaultExclusions: [
    'Extra decoration (custom themes)',
    'Doli/Palki',
    'Band/Music',
    'Extra hours beyond package',
    'Outstation travel',
  ],
  defaultTerms: [
    '50% advance to confirm',
    'Balance before event',
    'Car available for photography',
    'Route to be confirmed in advance',
    'Cancellation charges apply within 7 days',
  ],
  formFields: [
    { id: 'eventType', label: 'Event Type', type: 'select', required: true, options: [
      { value: 'wedding', label: 'Wedding' },
      { value: 'engagement', label: 'Engagement' },
      { value: 'reception', label: 'Reception' },
      { value: 'sangeet', label: 'Sangeet/Mehendi' },
    ]},
    { id: 'eventDate', label: 'Event Date', type: 'date', required: true },
    { id: 'pickupTime', label: 'Pickup Time', type: 'time', required: true },
    { id: 'duration', label: 'Duration Needed', type: 'select', required: true, options: [
      { value: '4hr', label: '4 Hours' },
      { value: '8hr', label: '8 Hours' },
      { value: 'full-day', label: 'Full Day' },
    ]},
    { id: 'decorationType', label: 'Decoration Style', type: 'select', required: false, options: [
      { value: 'standard', label: 'Standard Flowers' },
      { value: 'premium', label: 'Premium Floral' },
      { value: 'royal', label: 'Royal Theme' },
    ]},
  ],
  pricingType: 'fixed',
};

// ============ WEDDING BUS RENTAL ============
export const WEDDING_BUS_CONFIG: QuoteServiceConfig = {
  id: 'wedding-bus',
  name: 'Wedding Bus Rental',
  shortName: 'Wedding Bus',
  slug: 'wedding-bus-rental',
  description: 'Decorated buses for wedding guest transport',
  icon: 'Bus',
  color: 'rose',
  categories: [
    {
      id: 'tempo-decorated',
      name: 'Decorated Tempo Traveller',
      shortName: 'Tempo',
      description: '12-17 seater with decoration',
      capacity: '12-17 guests',
      priceHint: 'From ₹8,000',
      features: ['AC', 'Decorated', 'Music'],
    },
    {
      id: 'luxury-tempo-wedding',
      name: 'Luxury Tempo (Wedding)',
      shortName: 'Luxury Tempo',
      description: '20-26 seater luxury',
      capacity: '20-26 guests',
      priceHint: 'From ₹15,000',
      features: ['Premium AC', 'Decorated', 'Entertainment'],
      popular: true,
    },
    {
      id: 'mini-bus-wedding',
      name: 'Decorated Mini Bus',
      shortName: 'Mini Bus',
      description: '25-32 seater',
      capacity: '25-32 guests',
      priceHint: 'From ₹12,000',
      features: ['Spacious', 'Decorated', 'AC'],
    },
    {
      id: 'ac-bus-wedding',
      name: 'Decorated AC Bus',
      shortName: 'AC Bus',
      description: '35-45 seater',
      capacity: '35-45 guests',
      priceHint: 'From ₹18,000',
      features: ['Large Capacity', 'AC', 'Decorated'],
    },
  ],
  defaultInclusions: [
    'Decorated bus/tempo',
    'Driver in formal attire',
    'Fuel charges',
    'Flower decoration',
    'Water bottles for guests',
    'Music system',
  ],
  defaultExclusions: [
    'Outstation permits',
    'Overnight charges',
    'Extra decoration',
    'Waiting beyond schedule',
  ],
  defaultTerms: [
    '50% advance to confirm',
    'Balance before event',
    'Vehicle reports 1 hour early',
    'Route to be finalized',
  ],
  formFields: [
    { id: 'eventType', label: 'Event', type: 'select', required: true, options: [
      { value: 'baraat', label: 'Baraat' },
      { value: 'guest-pickup', label: 'Guest Pickup/Drop' },
      { value: 'venue-transfer', label: 'Venue Transfer' },
    ]},
    { id: 'guestCount', label: 'Number of Guests', type: 'number', required: true },
    { id: 'eventDate', label: 'Event Date', type: 'date', required: true },
    { id: 'pickupTime', label: 'Pickup Time', type: 'time', required: true },
  ],
  pricingType: 'fixed',
};

// ============ CORPORATE CAR RENTAL ============
export const CORPORATE_CAR_CONFIG: QuoteServiceConfig = {
  id: 'corporate-car',
  name: 'Corporate Car Rental',
  shortName: 'Corporate Car',
  slug: 'corporate-car-rental',
  description: 'Cars for corporate travel, employee transport, and business needs',
  icon: 'Briefcase',
  color: 'gray',
  categories: [
    {
      id: 'sedan-corporate',
      name: 'Executive Sedan',
      shortName: 'Sedan',
      description: 'Honda City, Ciaz, Verna',
      capacity: '4 passengers',
      priceHint: 'From ₹2,500/day',
      features: ['Professional Driver', 'AC', 'Clean'],
      popular: true,
    },
    {
      id: 'suv-corporate',
      name: 'Executive SUV',
      shortName: 'SUV',
      description: 'Innova, XUV, Ertiga',
      capacity: '6-7 passengers',
      priceHint: 'From ₹3,500/day',
      features: ['Spacious', 'Professional Driver', 'AC'],
    },
    {
      id: 'premium-corporate',
      name: 'Premium Sedan',
      shortName: 'Premium',
      description: 'Camry, Accord, Superb',
      capacity: '4 passengers',
      priceHint: 'From ₹5,500/day',
      features: ['Executive Class', 'Premium Comfort', 'Chauffeur'],
    },
    {
      id: 'luxury-corporate',
      name: 'Luxury (BMW/Mercedes)',
      shortName: 'Luxury',
      description: 'BMW 5 Series, E-Class',
      capacity: '4 passengers',
      priceHint: 'From ₹12,000/day',
      features: ['VIP Transport', 'Premium Brand', 'Chauffeur'],
    },
  ],
  defaultInclusions: [
    'Car with professional driver',
    'Fuel for agreed km',
    'Parking at office/airports',
    'Toll charges (local)',
    'Driver allowance',
  ],
  defaultExclusions: [
    'Extra km charges',
    'Night charges (after 10 PM)',
    'Outstation permits',
    'Inter-city tolls',
  ],
  defaultTerms: [
    'Monthly billing available',
    'Advance booking recommended',
    'GST invoice provided',
    'Dedicated relationship manager',
  ],
  formFields: [
    { id: 'requirementType', label: 'Requirement', type: 'select', required: true, options: [
      { value: 'daily', label: 'Daily Rental' },
      { value: 'monthly', label: 'Monthly Contract' },
      { value: 'event', label: 'Corporate Event' },
      { value: 'airport', label: 'Airport Transfers' },
    ]},
    { id: 'numberOfCars', label: 'Number of Cars', type: 'number', required: true },
    { id: 'startDate', label: 'Start Date', type: 'date', required: true },
    { id: 'companyName', label: 'Company Name', type: 'text', required: true },
    { id: 'gstNumber', label: 'GST Number', type: 'text', required: false },
  ],
  pricingType: 'per-day',
};

// ============ CORPORATE BUS RENTAL ============
export const CORPORATE_BUS_CONFIG: QuoteServiceConfig = {
  id: 'corporate-bus',
  name: 'Corporate Bus Rental',
  shortName: 'Corporate Bus',
  slug: 'corporate-bus-rental',
  description: 'Buses for employee transport, corporate outings, and events',
  icon: 'Bus',
  color: 'slate',
  categories: [
    {
      id: 'tempo-corporate',
      name: 'Tempo Traveller',
      shortName: 'Tempo',
      description: '12-17 seater',
      capacity: '12-17 employees',
      priceHint: 'From ₹2,500/day',
      features: ['AC', 'Professional Driver', 'Clean'],
    },
    {
      id: 'mini-bus-corporate',
      name: 'Mini Bus',
      shortName: 'Mini Bus',
      description: '20-32 seater',
      capacity: '20-32 employees',
      priceHint: 'From ₹4,000/day',
      features: ['Spacious', 'AC', 'Luggage Space'],
      popular: true,
    },
    {
      id: 'ac-bus-corporate',
      name: 'AC Bus',
      shortName: 'AC Bus',
      description: '35-50 seater',
      capacity: '35-50 employees',
      priceHint: 'From ₹6,000/day',
      features: ['Large Capacity', 'AC', 'Professional'],
    },
    {
      id: 'luxury-bus-corporate',
      name: 'Luxury Coach',
      shortName: 'Luxury Coach',
      description: 'Volvo/Mercedes coach',
      capacity: '35-45 employees',
      priceHint: 'From ₹15,000/day',
      features: ['Premium Comfort', 'Entertainment', 'Recliner'],
    },
  ],
  defaultInclusions: [
    'Bus with professional driver',
    'Fuel for agreed distance',
    'Daily cleaning',
    'Toll charges (local)',
    'Parking at pickup/drop points',
  ],
  defaultExclusions: [
    'Extra km charges',
    'Night halt charges',
    'Inter-city permits',
    'Overtime charges',
  ],
  defaultTerms: [
    'Monthly contracts available',
    'Fixed routes to be agreed',
    'GPS tracking provided',
    'Backup vehicle support',
    'GST invoice provided',
  ],
  formFields: [
    { id: 'requirementType', label: 'Requirement', type: 'select', required: true, options: [
      { value: 'employee-transport', label: 'Employee Transport (Daily)' },
      { value: 'outing', label: 'Corporate Outing' },
      { value: 'event', label: 'Corporate Event' },
      { value: 'shift', label: 'Shift Transport' },
    ]},
    { id: 'employeeCount', label: 'Number of Employees', type: 'number', required: true },
    { id: 'startDate', label: 'Start Date', type: 'date', required: true },
    { id: 'companyName', label: 'Company Name', type: 'text', required: true },
  ],
  pricingType: 'per-day',
};

// ============ VINTAGE CAR RENTAL ============
export const VINTAGE_CAR_CONFIG: QuoteServiceConfig = {
  id: 'vintage-car',
  name: 'Vintage Car Rental',
  shortName: 'Vintage Car',
  slug: 'vintage-car-rental',
  description: 'Classic and vintage cars for weddings, shoots, and events',
  icon: 'Car',
  color: 'amber',
  categories: [
    {
      id: 'ambassador',
      name: 'Ambassador Classic',
      shortName: 'Ambassador',
      description: 'Iconic Indian classic',
      capacity: '4 passengers',
      priceHint: 'From ₹8,000',
      features: ['Iconic', 'Vintage Look', 'Photo-worthy'],
    },
    {
      id: 'beetle',
      name: 'VW Beetle',
      shortName: 'Beetle',
      description: 'Classic Volkswagen',
      capacity: '4 passengers',
      priceHint: 'From ₹12,000',
      features: ['Cute', 'Classic', 'Unique'],
    },
    {
      id: 'rolls-vintage',
      name: 'Vintage Rolls Royce',
      shortName: 'Rolls Royce',
      description: 'Royal classic car',
      capacity: '4 passengers',
      priceHint: 'From ₹35,000',
      features: ['Royal', 'Luxurious', 'Rare'],
      popular: true,
    },
    {
      id: 'convertible-vintage',
      name: 'Vintage Convertible',
      shortName: 'Convertible',
      description: 'Open-top classic',
      capacity: '2-4 passengers',
      priceHint: 'From ₹20,000',
      features: ['Open Top', 'Grand Entry', 'Stunning'],
    },
  ],
  defaultInclusions: [
    'Vintage car in maintained condition',
    'Trained driver in period attire',
    'Basic decoration',
    'Photography time',
  ],
  defaultExclusions: [
    'Custom decoration',
    'Outstation travel',
    'Extended hours',
    'Music/DJ setup',
  ],
  defaultTerms: [
    'Advance booking essential (limited availability)',
    '50% non-refundable deposit',
    'Car for display and short drives only',
    'Weather conditions may affect availability',
  ],
  formFields: [
    { id: 'eventType', label: 'Event Type', type: 'select', required: true, options: [
      { value: 'wedding', label: 'Wedding' },
      { value: 'photoshoot', label: 'Photo/Video Shoot' },
      { value: 'exhibition', label: 'Exhibition/Display' },
      { value: 'corporate', label: 'Corporate Event' },
    ]},
    { id: 'eventDate', label: 'Event Date', type: 'date', required: true },
    { id: 'duration', label: 'Duration', type: 'select', required: true, options: [
      { value: '2hr', label: '2 Hours' },
      { value: '4hr', label: '4 Hours' },
      { value: 'half-day', label: 'Half Day' },
      { value: 'full-day', label: 'Full Day' },
    ]},
  ],
  pricingType: 'fixed',
};

// ============ TEMPO TRAVELLER (uses Bus system) ============
export const TEMPO_TRAVELLER_CONFIG: QuoteServiceConfig = {
  id: 'tempo-traveller',
  name: 'Tempo Traveller Rental',
  shortName: 'Tempo Traveller',
  slug: 'tempo-traveller',
  description: 'Tempo travellers for group travel, tours, and events',
  icon: 'Bus',
  color: 'orange',
  categories: [
    {
      id: 'tempo-9',
      name: '9 Seater Tempo',
      shortName: '9 Seater',
      description: 'Compact tempo for small groups',
      capacity: '8-9 passengers',
      priceHint: 'From ₹2,500/day',
      features: ['Compact', 'AC', 'City Friendly'],
    },
    {
      id: 'tempo-12',
      name: '12 Seater Tempo',
      shortName: '12 Seater',
      description: 'Standard tempo traveller',
      capacity: '10-12 passengers',
      priceHint: 'From ₹3,500/day',
      features: ['Standard', 'AC/Non-AC', 'Pushback'],
      popular: true,
    },
    {
      id: 'tempo-17',
      name: '17 Seater Tempo',
      shortName: '17 Seater',
      description: 'Large tempo traveller',
      capacity: '14-17 passengers',
      priceHint: 'From ₹4,500/day',
      features: ['Spacious', 'AC', 'Pushback Seats'],
    },
    {
      id: 'tempo-20',
      name: '20 Seater Luxury',
      shortName: '20 Seater',
      description: 'Luxury tempo traveller',
      capacity: '18-20 passengers',
      priceHint: 'From ₹6,000/day',
      features: ['Luxury', '2x1 Seating', 'Entertainment'],
    },
    {
      id: 'tempo-26',
      name: '26 Seater Maharaja',
      shortName: '26 Seater',
      description: 'Premium large tempo',
      capacity: '22-26 passengers',
      priceHint: 'From ₹8,000/day',
      features: ['Premium', 'Maharaja Seats', 'WiFi'],
    },
  ],
  defaultInclusions: [
    'AC Tempo Traveller as selected',
    'Experienced driver',
    'All fuel charges',
    'Driver allowance',
    'Toll taxes',
    'State permits',
  ],
  defaultExclusions: [
    'Parking charges',
    'Entry fees',
    'Personal expenses',
    'Extra km/hr charges',
    'Night halt charges',
  ],
  defaultTerms: [
    '50% advance to confirm',
    'Balance before trip',
    '300 km per day included',
    'Extra km: ₹14-18/km',
    'Night halt: ₹400-600',
  ],
  formFields: [
    { id: 'tripType', label: 'Trip Type', type: 'select', required: true, options: [
      { value: 'local', label: 'Local (Within City)' },
      { value: 'outstation', label: 'Outstation' },
      { value: 'pilgrimage', label: 'Pilgrimage' },
      { value: 'tour', label: 'Tour Package' },
    ]},
    { id: 'passengers', label: 'Number of Passengers', type: 'number', required: true },
    { id: 'pickupDate', label: 'Pickup Date', type: 'date', required: true },
    { id: 'returnDate', label: 'Return Date', type: 'date', required: false },
    { id: 'pickupTime', label: 'Pickup Time', type: 'time', required: true },
  ],
  pricingType: 'per-day',
};

// ============ ALL CONFIGS ============
export const QUOTE_SERVICE_CONFIGS: Record<QuoteServiceType, QuoteServiceConfig> = {
  'packers-movers': PACKERS_MOVERS_CONFIG,
  'transporter': TRANSPORTER_CONFIG,
  'mini-truck': MINI_TRUCK_CONFIG,
  'trailer': TRAILER_CONFIG,
  'jcb': JCB_CONFIG,
  'equipment': EQUIPMENT_CONFIG,
  'wedding-car': WEDDING_CAR_CONFIG,
  'wedding-bus': WEDDING_BUS_CONFIG,
  'corporate-car': CORPORATE_CAR_CONFIG,
  'corporate-bus': CORPORATE_BUS_CONFIG,
  'vintage-car': VINTAGE_CAR_CONFIG,
  'tempo-traveller': TEMPO_TRAVELLER_CONFIG,
};

export const getQuoteServiceConfig = (serviceType: QuoteServiceType): QuoteServiceConfig | undefined => {
  return QUOTE_SERVICE_CONFIGS[serviceType];
};

export const getServiceBySlug = (slug: string): QuoteServiceConfig | undefined => {
  return Object.values(QUOTE_SERVICE_CONFIGS).find(config => config.slug === slug);
};

// Map URL slugs to service types
export const SLUG_TO_SERVICE_TYPE: Record<string, QuoteServiceType> = {
  'packers-and-movers': 'packers-movers',
  'transporter': 'transporter',
  'mini-truck-rental': 'mini-truck',
  'trailer-on-rent': 'trailer',
  'jcb-on-rent': 'jcb',
  'equipment-rental': 'equipment',
  'wedding-car-rental': 'wedding-car',
  'wedding-bus-rental': 'wedding-bus',
  'corporate-car-rental': 'corporate-car',
  'corporate-bus-rental': 'corporate-bus',
  'vintage-car-rental': 'vintage-car',
  'tempo-traveller': 'tempo-traveller',
};
