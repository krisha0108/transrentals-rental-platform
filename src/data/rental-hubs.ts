/**
 * Hub-based locations for Self-Drive Cars and Bikes
 * Similar to Zoomcar and Royal Brothers model
 * These services require specific pickup/drop points (hubs)
 */

export interface RentalHub {
  id: string;
  name: string;
  slug: string;
  address: string;
  landmark?: string;
  city: string;
  citySlug: string;
  state: string;
  stateCode: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  type: 'airport' | 'railway' | 'metro' | 'mall' | 'hub' | 'office';
  isActive: boolean;
  operatingHours: {
    open: string;
    close: string;
    is24x7?: boolean;
  };
  services: ('self-drive' | 'bike')[];
  amenities?: string[];
}

// ============================================
// BANGALORE HUBS
// ============================================
const BANGALORE_HUBS: RentalHub[] = [
  {
    id: 'blr-airport',
    name: 'Kempegowda International Airport',
    slug: 'bangalore-airport',
    address: 'Kempegowda International Airport, Devanahalli',
    landmark: 'Terminal 1 Parking',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560300',
    latitude: 13.1986,
    longitude: 77.7066,
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
    amenities: ['24/7 Support', 'Free Parking', 'Waiting Lounge'],
  },
  {
    id: 'blr-koramangala',
    name: 'Koramangala Hub',
    slug: 'bangalore-koramangala',
    address: '80 Feet Road, Koramangala 4th Block',
    landmark: 'Near Forum Mall',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
    amenities: ['Parking', 'Helmet Provided', 'Vehicle Inspection'],
  },
  {
    id: 'blr-indiranagar',
    name: 'Indiranagar Hub',
    slug: 'bangalore-indiranagar',
    address: '100 Feet Road, Indiranagar',
    landmark: 'Near Indiranagar Metro',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'blr-whitefield',
    name: 'Whitefield Hub',
    slug: 'bangalore-whitefield',
    address: 'ITPL Main Road, Whitefield',
    landmark: 'Near Phoenix Marketcity',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'blr-electronic-city',
    name: 'Electronic City Hub',
    slug: 'bangalore-electronic-city',
    address: 'Electronic City Phase 1',
    landmark: 'Near Infosys Campus',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560100',
    latitude: 12.8399,
    longitude: 77.6770,
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'blr-mg-road',
    name: 'MG Road Hub',
    slug: 'bangalore-mg-road',
    address: 'MG Road, Near Trinity Circle',
    landmark: 'Near MG Road Metro Station',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560001',
    latitude: 12.9756,
    longitude: 77.6066,
    type: 'metro',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'blr-hsr-layout',
    name: 'HSR Layout Hub',
    slug: 'bangalore-hsr-layout',
    address: 'HSR Layout Sector 1',
    landmark: 'Near BDA Complex',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560102',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'blr-marathahalli',
    name: 'Marathahalli Hub',
    slug: 'bangalore-marathahalli',
    address: 'Outer Ring Road, Marathahalli',
    landmark: 'Near Marathahalli Bridge',
    city: 'Bangalore',
    citySlug: 'bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '560037',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// MUMBAI HUBS
// ============================================
const MUMBAI_HUBS: RentalHub[] = [
  {
    id: 'bom-airport-t1',
    name: 'Mumbai Airport Terminal 1',
    slug: 'mumbai-airport-t1',
    address: 'Chhatrapati Shivaji International Airport, Terminal 1',
    landmark: 'Domestic Terminal',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400099',
    latitude: 19.0896,
    longitude: 72.8656,
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Free Parking'],
  },
  {
    id: 'bom-airport-t2',
    name: 'Mumbai Airport Terminal 2',
    slug: 'mumbai-airport-t2',
    address: 'Chhatrapati Shivaji International Airport, Terminal 2',
    landmark: 'International Terminal',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400099',
    latitude: 19.0931,
    longitude: 72.8744,
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Free Parking'],
  },
  {
    id: 'bom-andheri',
    name: 'Andheri Hub',
    slug: 'mumbai-andheri',
    address: 'Andheri West, Near DN Nagar Metro',
    landmark: 'Near Lokhandwala',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400053',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'bom-bandra',
    name: 'Bandra Hub',
    slug: 'mumbai-bandra',
    address: 'Bandra West, Linking Road',
    landmark: 'Near Bandra Station',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400050',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'bom-powai',
    name: 'Powai Hub',
    slug: 'mumbai-powai',
    address: 'Hiranandani Gardens, Powai',
    landmark: 'Near IIT Bombay',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400076',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'bom-lower-parel',
    name: 'Lower Parel Hub',
    slug: 'mumbai-lower-parel',
    address: 'Phoenix Mills, Lower Parel',
    landmark: 'Near High Street Phoenix',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400013',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '22:00' },
    services: ['self-drive'],
  },
  {
    id: 'bom-thane',
    name: 'Thane Hub',
    slug: 'mumbai-thane',
    address: 'Thane West, Near Viviana Mall',
    landmark: 'Near Thane Station',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400601',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'bom-navi-mumbai',
    name: 'Navi Mumbai Hub',
    slug: 'mumbai-navi-mumbai',
    address: 'Vashi, Sector 17',
    landmark: 'Near Inorbit Mall',
    city: 'Mumbai',
    citySlug: 'mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '400703',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// DELHI NCR HUBS
// ============================================
const DELHI_HUBS: RentalHub[] = [
  {
    id: 'del-airport-t1',
    name: 'IGI Airport Terminal 1',
    slug: 'delhi-airport-t1',
    address: 'Indira Gandhi International Airport, Terminal 1',
    landmark: 'Domestic Terminal',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110037',
    latitude: 28.5562,
    longitude: 77.0999,
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Free Parking'],
  },
  {
    id: 'del-airport-t3',
    name: 'IGI Airport Terminal 3',
    slug: 'delhi-airport-t3',
    address: 'Indira Gandhi International Airport, Terminal 3',
    landmark: 'International Terminal',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110037',
    latitude: 28.5562,
    longitude: 77.1000,
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Free Parking'],
  },
  {
    id: 'del-connaught-place',
    name: 'Connaught Place Hub',
    slug: 'delhi-connaught-place',
    address: 'Block A, Connaught Place',
    landmark: 'Near Rajiv Chowk Metro',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110001',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'del-nehru-place',
    name: 'Nehru Place Hub',
    slug: 'delhi-nehru-place',
    address: 'Nehru Place, Near Nehru Place Metro',
    landmark: 'IT Market',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110019',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'del-dwarka',
    name: 'Dwarka Hub',
    slug: 'delhi-dwarka',
    address: 'Sector 21, Dwarka',
    landmark: 'Near Dwarka Sector 21 Metro',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110077',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'del-rohini',
    name: 'Rohini Hub',
    slug: 'delhi-rohini',
    address: 'Sector 3, Rohini',
    landmark: 'Near Rithala Metro',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110085',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'del-saket',
    name: 'Saket Hub',
    slug: 'delhi-saket',
    address: 'Select Citywalk, Saket',
    landmark: 'Near Saket Metro',
    city: 'Delhi',
    citySlug: 'delhi',
    state: 'Delhi',
    stateCode: 'DL',
    pincode: '110017',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive'],
  },
];

// ============================================
// GURGAON HUBS
// ============================================
const GURGAON_HUBS: RentalHub[] = [
  {
    id: 'ggn-cyber-city',
    name: 'Cyber City Hub',
    slug: 'gurgaon-cyber-city',
    address: 'DLF Cyber City, Sector 24',
    landmark: 'Near Cyber Hub',
    city: 'Gurgaon',
    citySlug: 'gurgaon',
    state: 'Haryana',
    stateCode: 'HR',
    pincode: '122002',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ggn-mg-road',
    name: 'MG Road Gurgaon Hub',
    slug: 'gurgaon-mg-road',
    address: 'MG Road, Near IFFCO Chowk',
    landmark: 'Near MG Road Metro',
    city: 'Gurgaon',
    citySlug: 'gurgaon',
    state: 'Haryana',
    stateCode: 'HR',
    pincode: '122002',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ggn-sector-29',
    name: 'Sector 29 Hub',
    slug: 'gurgaon-sector-29',
    address: 'Sector 29, Near Leisure Valley',
    landmark: 'Restaurant Hub',
    city: 'Gurgaon',
    citySlug: 'gurgaon',
    state: 'Haryana',
    stateCode: 'HR',
    pincode: '122001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '08:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ggn-golf-course',
    name: 'Golf Course Road Hub',
    slug: 'gurgaon-golf-course',
    address: 'Golf Course Road, Sector 54',
    landmark: 'Near Central Plaza',
    city: 'Gurgaon',
    citySlug: 'gurgaon',
    state: 'Haryana',
    stateCode: 'HR',
    pincode: '122002',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive'],
  },
  {
    id: 'ggn-sohna-road',
    name: 'Sohna Road Hub',
    slug: 'gurgaon-sohna-road',
    address: 'Sohna Road, Sector 49',
    landmark: 'Near Omaxe City',
    city: 'Gurgaon',
    citySlug: 'gurgaon',
    state: 'Haryana',
    stateCode: 'HR',
    pincode: '122018',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// NOIDA HUBS
// ============================================
const NOIDA_HUBS: RentalHub[] = [
  {
    id: 'nda-sector-18',
    name: 'Sector 18 Hub',
    slug: 'noida-sector-18',
    address: 'Atta Market, Sector 18',
    landmark: 'Near Noida Sector 18 Metro',
    city: 'Noida',
    citySlug: 'noida',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '201301',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'nda-sector-62',
    name: 'Sector 62 Hub',
    slug: 'noida-sector-62',
    address: 'Sector 62, Near Electronic City Metro',
    landmark: 'IT Hub',
    city: 'Noida',
    citySlug: 'noida',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '201309',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'nda-greater-noida',
    name: 'Greater Noida Hub',
    slug: 'noida-greater-noida',
    address: 'Knowledge Park 3, Greater Noida',
    landmark: 'Near Pari Chowk',
    city: 'Noida',
    citySlug: 'noida',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '201310',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// HYDERABAD HUBS
// ============================================
const HYDERABAD_HUBS: RentalHub[] = [
  {
    id: 'hyd-airport',
    name: 'Rajiv Gandhi International Airport',
    slug: 'hyderabad-airport',
    address: 'Shamshabad Airport',
    landmark: 'RGIA Terminal',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500409',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet'],
  },
  {
    id: 'hyd-hitec-city',
    name: 'HITEC City Hub',
    slug: 'hyderabad-hitec-city',
    address: 'Cyber Towers, HITEC City',
    landmark: 'Near Cyber Towers',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500081',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'hyd-gachibowli',
    name: 'Gachibowli Hub',
    slug: 'hyderabad-gachibowli',
    address: 'Financial District, Gachibowli',
    landmark: 'Near DLF Cyber City',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500032',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'hyd-banjara-hills',
    name: 'Banjara Hills Hub',
    slug: 'hyderabad-banjara-hills',
    address: 'Road No 10, Banjara Hills',
    landmark: 'Near GVK One Mall',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500034',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'hyd-secunderabad',
    name: 'Secunderabad Hub',
    slug: 'hyderabad-secunderabad',
    address: 'Secunderabad Railway Station Road',
    landmark: 'Near Secunderabad Station',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500003',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'hyd-madhapur',
    name: 'Madhapur Hub',
    slug: 'hyderabad-madhapur',
    address: 'Madhapur Main Road',
    landmark: 'Near Inorbit Mall',
    city: 'Hyderabad',
    citySlug: 'hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    pincode: '500081',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// CHENNAI HUBS
// ============================================
const CHENNAI_HUBS: RentalHub[] = [
  {
    id: 'maa-airport',
    name: 'Chennai International Airport',
    slug: 'chennai-airport',
    address: 'Chennai Airport, Tirusulam',
    landmark: 'Near Airport Metro',
    city: 'Chennai',
    citySlug: 'chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '600027',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet'],
  },
  {
    id: 'maa-t-nagar',
    name: 'T Nagar Hub',
    slug: 'chennai-t-nagar',
    address: 'Pondy Bazaar, T Nagar',
    landmark: 'Near T Nagar Bus Stand',
    city: 'Chennai',
    citySlug: 'chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '600017',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'maa-adyar',
    name: 'Adyar Hub',
    slug: 'chennai-adyar',
    address: 'LB Road, Adyar',
    landmark: 'Near Adyar Signal',
    city: 'Chennai',
    citySlug: 'chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '600020',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'maa-omr',
    name: 'OMR Hub',
    slug: 'chennai-omr',
    address: 'Old Mahabalipuram Road, Sholinganallur',
    landmark: 'Near IT Corridor',
    city: 'Chennai',
    citySlug: 'chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '600119',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'maa-velachery',
    name: 'Velachery Hub',
    slug: 'chennai-velachery',
    address: 'Velachery Main Road',
    landmark: 'Near Phoenix Marketcity',
    city: 'Chennai',
    citySlug: 'chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '600042',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// PUNE HUBS
// ============================================
const PUNE_HUBS: RentalHub[] = [
  {
    id: 'pnq-airport',
    name: 'Pune Airport',
    slug: 'pune-airport',
    address: 'Pune International Airport, Lohegaon',
    landmark: 'Airport Road',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411032',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
    amenities: ['24/7 Support', 'Meet & Greet'],
  },
  {
    id: 'pnq-hinjewadi',
    name: 'Hinjewadi Hub',
    slug: 'pune-hinjewadi',
    address: 'Phase 1, Hinjewadi IT Park',
    landmark: 'Near Infosys',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411057',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'pnq-kharadi',
    name: 'Kharadi Hub',
    slug: 'pune-kharadi',
    address: 'EON IT Park, Kharadi',
    landmark: 'Near World Trade Center',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411014',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'pnq-koregaon-park',
    name: 'Koregaon Park Hub',
    slug: 'pune-koregaon-park',
    address: 'Lane 6, Koregaon Park',
    landmark: 'Near Osho Ashram',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'pnq-viman-nagar',
    name: 'Viman Nagar Hub',
    slug: 'pune-viman-nagar',
    address: 'Viman Nagar Main Road',
    landmark: 'Near Phoenix Marketcity',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411014',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'pnq-baner',
    name: 'Baner Hub',
    slug: 'pune-baner',
    address: 'Baner Road',
    landmark: 'Near Westend Mall',
    city: 'Pune',
    citySlug: 'pune',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '411045',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// GOA HUBS
// ============================================
const GOA_HUBS: RentalHub[] = [
  {
    id: 'goi-airport',
    name: 'Goa International Airport',
    slug: 'goa-airport',
    address: 'Dabolim Airport',
    landmark: 'Airport Road',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403801',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Helmet Provided'],
  },
  {
    id: 'goi-mopa-airport',
    name: 'Mopa International Airport',
    slug: 'goa-mopa-airport',
    address: 'Mopa Airport, North Goa',
    landmark: 'New Goa Airport',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403512',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
    amenities: ['24/7 Support', 'Meet & Greet', 'Helmet Provided'],
  },
  {
    id: 'goi-calangute',
    name: 'Calangute Hub',
    slug: 'goa-calangute',
    address: 'Calangute Beach Road',
    landmark: 'Near Calangute Beach',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403516',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'goi-panjim',
    name: 'Panjim Hub',
    slug: 'goa-panjim',
    address: '18th June Road, Panjim',
    landmark: 'Near Panjim Church',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'goi-baga',
    name: 'Baga Hub',
    slug: 'goa-baga',
    address: 'Baga Beach Road',
    landmark: 'Near Tito\'s Lane',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403516',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'goi-anjuna',
    name: 'Anjuna Hub',
    slug: 'goa-anjuna',
    address: 'Anjuna Beach Road',
    landmark: 'Near Anjuna Flea Market',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403509',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
  {
    id: 'goi-madgaon',
    name: 'Madgaon Hub',
    slug: 'goa-madgaon',
    address: 'Madgaon Railway Station Road',
    landmark: 'Near Madgaon Station',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403601',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'goi-candolim',
    name: 'Candolim Hub',
    slug: 'goa-candolim',
    address: 'Fort Aguada Road, Candolim',
    landmark: 'Near Candolim Beach',
    city: 'Goa',
    citySlug: 'goa',
    state: 'Goa',
    stateCode: 'GA',
    pincode: '403515',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// JAIPUR HUBS
// ============================================
const JAIPUR_HUBS: RentalHub[] = [
  {
    id: 'jai-airport',
    name: 'Jaipur International Airport',
    slug: 'jaipur-airport',
    address: 'Sanganer Airport',
    landmark: 'Airport Terminal',
    city: 'Jaipur',
    citySlug: 'jaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '302029',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'jai-malviya-nagar',
    name: 'Malviya Nagar Hub',
    slug: 'jaipur-malviya-nagar',
    address: 'Malviya Nagar Main Road',
    landmark: 'Near WTP',
    city: 'Jaipur',
    citySlug: 'jaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '302017',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'jai-vaishali-nagar',
    name: 'Vaishali Nagar Hub',
    slug: 'jaipur-vaishali-nagar',
    address: 'Vaishali Nagar Main Road',
    landmark: 'Near Vaishali Circle',
    city: 'Jaipur',
    citySlug: 'jaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '302021',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'jai-c-scheme',
    name: 'C-Scheme Hub',
    slug: 'jaipur-c-scheme',
    address: 'Ashok Marg, C-Scheme',
    landmark: 'Near Raj Mandir',
    city: 'Jaipur',
    citySlug: 'jaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '302001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// KOLKATA HUBS
// ============================================
const KOLKATA_HUBS: RentalHub[] = [
  {
    id: 'ccu-airport',
    name: 'Netaji Subhas Chandra Bose Airport',
    slug: 'kolkata-airport',
    address: 'Dum Dum Airport',
    landmark: 'Airport Terminal',
    city: 'Kolkata',
    citySlug: 'kolkata',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '700052',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
  },
  {
    id: 'ccu-salt-lake',
    name: 'Salt Lake Hub',
    slug: 'kolkata-salt-lake',
    address: 'Sector V, Salt Lake',
    landmark: 'Near City Centre 2',
    city: 'Kolkata',
    citySlug: 'kolkata',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '700091',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ccu-park-street',
    name: 'Park Street Hub',
    slug: 'kolkata-park-street',
    address: 'Park Street',
    landmark: 'Near Park Street Metro',
    city: 'Kolkata',
    citySlug: 'kolkata',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '700016',
    type: 'metro',
    isActive: true,
    operatingHours: { open: '08:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ccu-new-town',
    name: 'New Town Hub',
    slug: 'kolkata-new-town',
    address: 'Action Area 1, New Town',
    landmark: 'Near Eco Park',
    city: 'Kolkata',
    citySlug: 'kolkata',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '700156',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// AHMEDABAD HUBS
// ============================================
const AHMEDABAD_HUBS: RentalHub[] = [
  {
    id: 'amd-airport',
    name: 'Sardar Vallabhbhai Patel Airport',
    slug: 'ahmedabad-airport',
    address: 'Hansol Airport',
    landmark: 'Airport Terminal',
    city: 'Ahmedabad',
    citySlug: 'ahmedabad',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '382475',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
  },
  {
    id: 'amd-sg-highway',
    name: 'SG Highway Hub',
    slug: 'ahmedabad-sg-highway',
    address: 'S G Highway, Near Iscon',
    landmark: 'Near Iscon Mall',
    city: 'Ahmedabad',
    citySlug: 'ahmedabad',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '380015',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'amd-navrangpura',
    name: 'Navrangpura Hub',
    slug: 'ahmedabad-navrangpura',
    address: 'CG Road, Navrangpura',
    landmark: 'Near Stadium',
    city: 'Ahmedabad',
    citySlug: 'ahmedabad',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '380009',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'amd-prahlad-nagar',
    name: 'Prahlad Nagar Hub',
    slug: 'ahmedabad-prahlad-nagar',
    address: 'Prahlad Nagar Road',
    landmark: 'Near Sindhubhavan',
    city: 'Ahmedabad',
    citySlug: 'ahmedabad',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '380015',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// CHANDIGARH HUBS (Zoomcar + Royal Brothers)
// ============================================
const CHANDIGARH_HUBS: RentalHub[] = [
  {
    id: 'chd-airport',
    name: 'Chandigarh Airport',
    slug: 'chandigarh-airport',
    address: 'Chandigarh International Airport',
    landmark: 'Airport Terminal',
    city: 'Chandigarh',
    citySlug: 'chandigarh',
    state: 'Chandigarh',
    stateCode: 'CH',
    pincode: '160003',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'chd-sector-17',
    name: 'Sector 17 Hub',
    slug: 'chandigarh-sector-17',
    address: 'Sector 17 Plaza',
    landmark: 'Near Neelam Cinema',
    city: 'Chandigarh',
    citySlug: 'chandigarh',
    state: 'Chandigarh',
    stateCode: 'CH',
    pincode: '160017',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'chd-sector-35',
    name: 'Sector 35 Hub',
    slug: 'chandigarh-sector-35',
    address: 'Sector 35, Near Bus Stand',
    landmark: 'Near ISBT',
    city: 'Chandigarh',
    citySlug: 'chandigarh',
    state: 'Chandigarh',
    stateCode: 'CH',
    pincode: '160035',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// LUCKNOW HUBS (Zoomcar + Royal Brothers)
// ============================================
const LUCKNOW_HUBS: RentalHub[] = [
  {
    id: 'lko-airport',
    name: 'Chaudhary Charan Singh Airport',
    slug: 'lucknow-airport',
    address: 'Amausi Airport',
    landmark: 'Airport Terminal',
    city: 'Lucknow',
    citySlug: 'lucknow',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226009',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'lko-hazratganj',
    name: 'Hazratganj Hub',
    slug: 'lucknow-hazratganj',
    address: 'Hazratganj Main Road',
    landmark: 'Near GPO',
    city: 'Lucknow',
    citySlug: 'lucknow',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'lko-gomti-nagar',
    name: 'Gomti Nagar Hub',
    slug: 'lucknow-gomti-nagar',
    address: 'Gomti Nagar',
    landmark: 'Near Lulu Mall',
    city: 'Lucknow',
    citySlug: 'lucknow',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226010',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '08:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// KOCHI HUBS (Zoomcar + Royal Brothers)
// ============================================
const KOCHI_HUBS: RentalHub[] = [
  {
    id: 'cok-airport',
    name: 'Cochin International Airport',
    slug: 'kochi-airport',
    address: 'Nedumbassery Airport',
    landmark: 'Airport Terminal',
    city: 'Kochi',
    citySlug: 'kochi',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '683111',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'cok-mg-road',
    name: 'MG Road Kochi Hub',
    slug: 'kochi-mg-road',
    address: 'MG Road, Ernakulam',
    landmark: 'Near Lulu Mall',
    city: 'Kochi',
    citySlug: 'kochi',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '682035',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'cok-fort-kochi',
    name: 'Fort Kochi Hub',
    slug: 'kochi-fort-kochi',
    address: 'Fort Kochi Beach Road',
    landmark: 'Near Chinese Fishing Nets',
    city: 'Kochi',
    citySlug: 'kochi',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '682001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// INDORE HUBS (Zoomcar)
// ============================================
const INDORE_HUBS: RentalHub[] = [
  {
    id: 'idr-airport',
    name: 'Devi Ahilyabai Holkar Airport',
    slug: 'indore-airport',
    address: 'Indore Airport',
    landmark: 'Airport Terminal',
    city: 'Indore',
    citySlug: 'indore',
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    pincode: '452005',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
  },
  {
    id: 'idr-vijay-nagar',
    name: 'Vijay Nagar Hub',
    slug: 'indore-vijay-nagar',
    address: 'Vijay Nagar Square',
    landmark: 'Near C21 Mall',
    city: 'Indore',
    citySlug: 'indore',
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    pincode: '452010',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive'],
  },
];

// ============================================
// BHUBANESWAR HUBS (Zoomcar + Royal Brothers)
// ============================================
const BHUBANESWAR_HUBS: RentalHub[] = [
  {
    id: 'bbi-airport',
    name: 'Biju Patnaik Airport',
    slug: 'bhubaneswar-airport',
    address: 'Bhubaneswar Airport',
    landmark: 'Airport Terminal',
    city: 'Bhubaneswar',
    citySlug: 'bhubaneswar',
    state: 'Odisha',
    stateCode: 'OR',
    pincode: '751020',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'bbi-patia',
    name: 'Patia Hub',
    slug: 'bhubaneswar-patia',
    address: 'Patia Square',
    landmark: 'Near KIIT University',
    city: 'Bhubaneswar',
    citySlug: 'bhubaneswar',
    state: 'Odisha',
    stateCode: 'OR',
    pincode: '751024',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// GUWAHATI HUBS (Zoomcar + Royal Brothers)
// ============================================
const GUWAHATI_HUBS: RentalHub[] = [
  {
    id: 'gau-airport',
    name: 'Lokpriya Gopinath Bordoloi Airport',
    slug: 'guwahati-airport',
    address: 'Guwahati Airport, Borjhar',
    landmark: 'Airport Terminal',
    city: 'Guwahati',
    citySlug: 'guwahati',
    state: 'Assam',
    stateCode: 'AS',
    pincode: '781015',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'gau-gn-bordoloi',
    name: 'GS Road Hub',
    slug: 'guwahati-gs-road',
    address: 'GS Road, Guwahati',
    landmark: 'Near Downtown Mall',
    city: 'Guwahati',
    citySlug: 'guwahati',
    state: 'Assam',
    stateCode: 'AS',
    pincode: '781005',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// VIZAG (VISAKHAPATNAM) HUBS (Zoomcar + Royal Brothers)
// ============================================
const VIZAG_HUBS: RentalHub[] = [
  {
    id: 'vtz-airport',
    name: 'Visakhapatnam Airport',
    slug: 'vizag-airport',
    address: 'Visakhapatnam Airport',
    landmark: 'Airport Terminal',
    city: 'Visakhapatnam',
    citySlug: 'vizag',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '530009',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'vtz-rk-beach',
    name: 'RK Beach Hub',
    slug: 'vizag-rk-beach',
    address: 'Beach Road, RK Beach',
    landmark: 'Near Kailasagiri',
    city: 'Visakhapatnam',
    citySlug: 'vizag',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '530002',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// VIJAYAWADA HUBS (Zoomcar + Royal Brothers)
// ============================================
const VIJAYAWADA_HUBS: RentalHub[] = [
  {
    id: 'vjw-airport',
    name: 'Vijayawada Airport',
    slug: 'vijayawada-airport',
    address: 'Gannavaram Airport',
    landmark: 'Airport Terminal',
    city: 'Vijayawada',
    citySlug: 'vijayawada',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '521102',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'vjw-mg-road',
    name: 'MG Road Vijayawada Hub',
    slug: 'vijayawada-mg-road',
    address: 'MG Road, Vijayawada',
    landmark: 'Near PVP Square',
    city: 'Vijayawada',
    citySlug: 'vijayawada',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '520010',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// MANGALORE HUBS (Zoomcar + Royal Brothers)
// ============================================
const MANGALORE_HUBS: RentalHub[] = [
  {
    id: 'ixe-airport',
    name: 'Mangalore International Airport',
    slug: 'mangalore-airport',
    address: 'Bajpe Airport',
    landmark: 'Airport Terminal',
    city: 'Mangalore',
    citySlug: 'mangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '574142',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ixe-hampankatta',
    name: 'Hampankatta Hub',
    slug: 'mangalore-hampankatta',
    address: 'Hampankatta Main Road',
    landmark: 'Near City Centre Mall',
    city: 'Mangalore',
    citySlug: 'mangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '575001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// MYSORE HUBS (Royal Brothers)
// ============================================
const MYSORE_HUBS: RentalHub[] = [
  {
    id: 'mys-railway',
    name: 'Mysore Railway Station Hub',
    slug: 'mysore-railway-station',
    address: 'Near Mysore Railway Station',
    landmark: 'Station Road',
    city: 'Mysore',
    citySlug: 'mysore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '570001',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['bike'],
  },
  {
    id: 'mys-gokulam',
    name: 'Gokulam Hub',
    slug: 'mysore-gokulam',
    address: 'Gokulam 3rd Stage',
    landmark: 'Near Yoga Shala',
    city: 'Mysore',
    citySlug: 'mysore',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '570002',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// COORG HUBS (Royal Brothers)
// ============================================
const COORG_HUBS: RentalHub[] = [
  {
    id: 'crg-madikeri',
    name: 'Madikeri Hub',
    slug: 'coorg-madikeri',
    address: 'Main Road, Madikeri',
    landmark: 'Near Bus Stand',
    city: 'Coorg',
    citySlug: 'coorg',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '571201',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// CHIKMAGALUR HUBS (Royal Brothers)
// ============================================
const CHIKMAGALUR_HUBS: RentalHub[] = [
  {
    id: 'ckm-town',
    name: 'Chikmagalur Town Hub',
    slug: 'chikmagalur-town',
    address: 'MG Road, Chikmagalur',
    landmark: 'Near Bus Stand',
    city: 'Chikmagalur',
    citySlug: 'chikmagalur',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '577101',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// HAMPI HUBS (Royal Brothers)
// ============================================
const HAMPI_HUBS: RentalHub[] = [
  {
    id: 'hmp-hospet',
    name: 'Hospet Hub',
    slug: 'hampi-hospet',
    address: 'Station Road, Hospet',
    landmark: 'Near Railway Station',
    city: 'Hampi',
    citySlug: 'hampi',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '583201',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '06:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// HUBLI HUBS (Royal Brothers)
// ============================================
const HUBLI_HUBS: RentalHub[] = [
  {
    id: 'hbl-airport',
    name: 'Hubli Airport Hub',
    slug: 'hubli-airport',
    address: 'Hubli Airport',
    landmark: 'Airport Terminal',
    city: 'Hubli',
    citySlug: 'hubli',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '580030',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// BELAGAVI HUBS (Royal Brothers)
// ============================================
const BELAGAVI_HUBS: RentalHub[] = [
  {
    id: 'ixg-airport',
    name: 'Belagavi Airport Hub',
    slug: 'belagavi-airport',
    address: 'Belagavi Airport, Sambra',
    landmark: 'Airport Terminal',
    city: 'Belagavi',
    citySlug: 'belagavi',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '590014',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// PONDICHERRY HUBS (Royal Brothers)
// ============================================
const PONDICHERRY_HUBS: RentalHub[] = [
  {
    id: 'pdy-white-town',
    name: 'White Town Hub',
    slug: 'pondicherry-white-town',
    address: 'White Town, Pondicherry',
    landmark: 'Near Promenade Beach',
    city: 'Pondicherry',
    citySlug: 'pondicherry',
    state: 'Puducherry',
    stateCode: 'PY',
    pincode: '605001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
  {
    id: 'pdy-auroville',
    name: 'Auroville Hub',
    slug: 'pondicherry-auroville',
    address: 'Auroville Main Road',
    landmark: 'Near Visitor Center',
    city: 'Pondicherry',
    citySlug: 'pondicherry',
    state: 'Puducherry',
    stateCode: 'PY',
    pincode: '605101',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '08:00', close: '19:00' },
    services: ['bike'],
  },
];

// ============================================
// MADURAI HUBS (Zoomcar)
// ============================================
const MADURAI_HUBS: RentalHub[] = [
  {
    id: 'ixm-airport',
    name: 'Madurai Airport',
    slug: 'madurai-airport',
    address: 'Madurai Airport',
    landmark: 'Airport Terminal',
    city: 'Madurai',
    citySlug: 'madurai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '625022',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
  },
  {
    id: 'ixm-meenakshi',
    name: 'Meenakshi Temple Hub',
    slug: 'madurai-meenakshi',
    address: 'East Masi Street',
    landmark: 'Near Meenakshi Temple',
    city: 'Madurai',
    citySlug: 'madurai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '625001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive'],
  },
];

// ============================================
// TRICHY HUBS (Zoomcar)
// ============================================
const TRICHY_HUBS: RentalHub[] = [
  {
    id: 'trz-airport',
    name: 'Trichy International Airport',
    slug: 'trichy-airport',
    address: 'Tiruchirappalli Airport',
    landmark: 'Airport Terminal',
    city: 'Tiruchirappalli',
    citySlug: 'trichy',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    pincode: '620007',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive'],
  },
];

// ============================================
// TRIVANDRUM HUBS (Royal Brothers)
// ============================================
const TRIVANDRUM_HUBS: RentalHub[] = [
  {
    id: 'trv-airport',
    name: 'Trivandrum International Airport',
    slug: 'trivandrum-airport',
    address: 'Trivandrum Airport',
    landmark: 'Airport Terminal',
    city: 'Trivandrum',
    citySlug: 'trivandrum',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '695008',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['bike'],
  },
  {
    id: 'trv-technopark',
    name: 'Technopark Hub',
    slug: 'trivandrum-technopark',
    address: 'Technopark Campus',
    landmark: 'Near Phase 1 Gate',
    city: 'Trivandrum',
    citySlug: 'trivandrum',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '695581',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// CALICUT (KOZHIKODE) HUBS (Royal Brothers)
// ============================================
const CALICUT_HUBS: RentalHub[] = [
  {
    id: 'ccj-airport',
    name: 'Calicut International Airport',
    slug: 'calicut-airport',
    address: 'Karipur Airport',
    landmark: 'Airport Terminal',
    city: 'Kozhikode',
    citySlug: 'calicut',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '673647',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['bike'],
  },
  {
    id: 'ccj-beach',
    name: 'Calicut Beach Hub',
    slug: 'calicut-beach',
    address: 'Beach Road',
    landmark: 'Near Calicut Beach',
    city: 'Kozhikode',
    citySlug: 'calicut',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '673032',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// WAYANAD HUBS (Royal Brothers)
// ============================================
const WAYANAD_HUBS: RentalHub[] = [
  {
    id: 'wyd-kalpetta',
    name: 'Kalpetta Hub',
    slug: 'wayanad-kalpetta',
    address: 'Main Road, Kalpetta',
    landmark: 'Near Bus Stand',
    city: 'Wayanad',
    citySlug: 'wayanad',
    state: 'Kerala',
    stateCode: 'KL',
    pincode: '673121',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// SURAT HUBS (Royal Brothers)
// ============================================
const SURAT_HUBS: RentalHub[] = [
  {
    id: 'stv-airport',
    name: 'Surat Airport',
    slug: 'surat-airport',
    address: 'Surat Airport, Magdalla',
    landmark: 'Airport Terminal',
    city: 'Surat',
    citySlug: 'surat',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '395007',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['bike'],
  },
  {
    id: 'stv-vesu',
    name: 'Vesu Hub',
    slug: 'surat-vesu',
    address: 'VIP Road, Vesu',
    landmark: 'Near VR Mall',
    city: 'Surat',
    citySlug: 'surat',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '395007',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// VADODARA HUBS (Royal Brothers)
// ============================================
const VADODARA_HUBS: RentalHub[] = [
  {
    id: 'brd-airport',
    name: 'Vadodara Airport',
    slug: 'vadodara-airport',
    address: 'Vadodara Airport, Harni',
    landmark: 'Airport Terminal',
    city: 'Vadodara',
    citySlug: 'vadodara',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '390022',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['bike'],
  },
  {
    id: 'brd-alkapuri',
    name: 'Alkapuri Hub',
    slug: 'vadodara-alkapuri',
    address: 'Alkapuri, RC Dutt Road',
    landmark: 'Near Inox Mall',
    city: 'Vadodara',
    citySlug: 'vadodara',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '390007',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// NASHIK HUBS (Zoomcar)
// ============================================
const NASHIK_HUBS: RentalHub[] = [
  {
    id: 'isk-airport',
    name: 'Nashik Airport',
    slug: 'nashik-airport',
    address: 'Ozar Airport',
    landmark: 'Airport Terminal',
    city: 'Nashik',
    citySlug: 'nashik',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '422207',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['self-drive'],
  },
  {
    id: 'isk-college-road',
    name: 'College Road Hub',
    slug: 'nashik-college-road',
    address: 'College Road, Nashik',
    landmark: 'Near Big Bazaar',
    city: 'Nashik',
    citySlug: 'nashik',
    state: 'Maharashtra',
    stateCode: 'MH',
    pincode: '422005',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive'],
  },
];

// ============================================
// JODHPUR HUBS (Royal Brothers)
// ============================================
const JODHPUR_HUBS: RentalHub[] = [
  {
    id: 'jdh-airport',
    name: 'Jodhpur Airport',
    slug: 'jodhpur-airport',
    address: 'Jodhpur Airport',
    landmark: 'Airport Terminal',
    city: 'Jodhpur',
    citySlug: 'jodhpur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '342011',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['bike'],
  },
  {
    id: 'jdh-clock-tower',
    name: 'Clock Tower Hub',
    slug: 'jodhpur-clock-tower',
    address: 'Near Ghanta Ghar',
    landmark: 'Near Sardar Market',
    city: 'Jodhpur',
    citySlug: 'jodhpur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '342001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// JAISALMER HUBS (Royal Brothers)
// ============================================
const JAISALMER_HUBS: RentalHub[] = [
  {
    id: 'jsl-fort',
    name: 'Jaisalmer Fort Hub',
    slug: 'jaisalmer-fort',
    address: 'Near Jaisalmer Fort',
    landmark: 'Fort Gate',
    city: 'Jaisalmer',
    citySlug: 'jaisalmer',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '345001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// LEH LADAKH HUBS (Royal Brothers)
// ============================================
const LEH_HUBS: RentalHub[] = [
  {
    id: 'ixl-airport',
    name: 'Leh Kushok Bakula Airport',
    slug: 'leh-airport',
    address: 'Leh Airport',
    landmark: 'Airport Terminal',
    city: 'Leh',
    citySlug: 'leh',
    state: 'Ladakh',
    stateCode: 'LA',
    pincode: '194101',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '05:00', close: '18:00' },
    services: ['bike'],
  },
  {
    id: 'ixl-main-market',
    name: 'Main Bazaar Hub',
    slug: 'leh-main-bazaar',
    address: 'Main Bazaar Road, Leh',
    landmark: 'Near Leh Palace',
    city: 'Leh',
    citySlug: 'leh',
    state: 'Ladakh',
    stateCode: 'LA',
    pincode: '194101',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '06:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// AGRA HUBS (Royal Brothers)
// ============================================
const AGRA_HUBS: RentalHub[] = [
  {
    id: 'agr-airport',
    name: 'Agra Airport Hub',
    slug: 'agra-airport',
    address: 'Kheria Airport',
    landmark: 'Airport Terminal',
    city: 'Agra',
    citySlug: 'agra',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '282008',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['bike'],
  },
  {
    id: 'agr-taj-mahal',
    name: 'Taj East Gate Hub',
    slug: 'agra-taj-gate',
    address: 'Fatehabad Road',
    landmark: 'Near Taj East Gate',
    city: 'Agra',
    citySlug: 'agra',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '282001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '06:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// KANPUR HUBS (Zoomcar)
// ============================================
const KANPUR_HUBS: RentalHub[] = [
  {
    id: 'knp-airport',
    name: 'Kanpur Airport',
    slug: 'kanpur-airport',
    address: 'Chakeri Airport',
    landmark: 'Airport Terminal',
    city: 'Kanpur',
    citySlug: 'kanpur',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '208007',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['self-drive'],
  },
  {
    id: 'knp-mall-road',
    name: 'Mall Road Hub',
    slug: 'kanpur-mall-road',
    address: 'Mall Road, Kanpur',
    landmark: 'Near Z Square Mall',
    city: 'Kanpur',
    citySlug: 'kanpur',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '208001',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive'],
  },
];

// ============================================
// TIRUPATI HUBS (Royal Brothers)
// ============================================
const TIRUPATI_HUBS: RentalHub[] = [
  {
    id: 'tir-airport',
    name: 'Tirupati Airport',
    slug: 'tirupati-airport',
    address: 'Renigunta Airport',
    landmark: 'Airport Terminal',
    city: 'Tirupati',
    citySlug: 'tirupati',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '517520',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['bike'],
  },
  {
    id: 'tir-railway',
    name: 'Tirupati Railway Hub',
    slug: 'tirupati-railway',
    address: 'Near Railway Station',
    landmark: 'Station Road',
    city: 'Tirupati',
    citySlug: 'tirupati',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '517501',
    type: 'railway',
    isActive: true,
    operatingHours: { open: '05:00', close: '23:00' },
    services: ['bike'],
  },
];

// ============================================
// GUNTUR HUBS (Royal Brothers)
// ============================================
const GUNTUR_HUBS: RentalHub[] = [
  {
    id: 'gnt-bus-stand',
    name: 'Guntur Bus Stand Hub',
    slug: 'guntur-bus-stand',
    address: 'Near RTC Bus Stand',
    landmark: 'Guntur Bus Station',
    city: 'Guntur',
    citySlug: 'guntur',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    pincode: '522001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '06:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// RANCHI HUBS (Royal Brothers)
// ============================================
const RANCHI_HUBS: RentalHub[] = [
  {
    id: 'ixr-airport',
    name: 'Birsa Munda Airport',
    slug: 'ranchi-airport',
    address: 'Ranchi Airport',
    landmark: 'Airport Terminal',
    city: 'Ranchi',
    citySlug: 'ranchi',
    state: 'Jharkhand',
    stateCode: 'JH',
    pincode: '834002',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['bike'],
  },
  {
    id: 'ixr-main-road',
    name: 'Main Road Hub',
    slug: 'ranchi-main-road',
    address: 'Main Road, Ranchi',
    landmark: 'Near Nucleus Mall',
    city: 'Ranchi',
    citySlug: 'ranchi',
    state: 'Jharkhand',
    stateCode: 'JH',
    pincode: '834001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// JAMSHEDPUR HUBS (Royal Brothers)
// ============================================
const JAMSHEDPUR_HUBS: RentalHub[] = [
  {
    id: 'jsr-sakchi',
    name: 'Sakchi Hub',
    slug: 'jamshedpur-sakchi',
    address: 'Sakchi Main Road',
    landmark: 'Near Sakchi Market',
    city: 'Jamshedpur',
    citySlug: 'jamshedpur',
    state: 'Jharkhand',
    stateCode: 'JH',
    pincode: '831001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// PURI HUBS (Royal Brothers)
// ============================================
const PURI_HUBS: RentalHub[] = [
  {
    id: 'puri-beach',
    name: 'Puri Beach Hub',
    slug: 'puri-beach',
    address: 'CT Road, Puri Beach',
    landmark: 'Near Puri Beach',
    city: 'Puri',
    citySlug: 'puri',
    state: 'Odisha',
    stateCode: 'OR',
    pincode: '752001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '06:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// SILIGURI HUBS (Zoomcar)
// ============================================
const SILIGURI_HUBS: RentalHub[] = [
  {
    id: 'ixb-airport',
    name: 'Bagdogra Airport Hub',
    slug: 'siliguri-airport',
    address: 'Bagdogra Airport',
    landmark: 'Airport Terminal',
    city: 'Siliguri',
    citySlug: 'siliguri',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '734421',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ixb-city-center',
    name: 'City Centre Hub',
    slug: 'siliguri-city-centre',
    address: 'Sevoke Road',
    landmark: 'Near City Centre Mall',
    city: 'Siliguri',
    citySlug: 'siliguri',
    state: 'West Bengal',
    stateCode: 'WB',
    pincode: '734001',
    type: 'mall',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// UDUPI-MANIPAL HUBS (Royal Brothers)
// ============================================
const UDUPI_HUBS: RentalHub[] = [
  {
    id: 'udp-manipal',
    name: 'Manipal Hub',
    slug: 'udupi-manipal',
    address: 'Manipal, Tiger Circle',
    landmark: 'Near MIT',
    city: 'Udupi',
    citySlug: 'udupi',
    state: 'Karnataka',
    stateCode: 'KA',
    pincode: '576104',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

// ============================================
// GANDHINAGAR HUBS (Royal Brothers)
// ============================================
const GANDHINAGAR_HUBS: RentalHub[] = [
  {
    id: 'ghn-sector-21',
    name: 'Sector 21 Hub',
    slug: 'gandhinagar-sector-21',
    address: 'Sector 21, Gandhinagar',
    landmark: 'Near Infocity',
    city: 'Gandhinagar',
    citySlug: 'gandhinagar',
    state: 'Gujarat',
    stateCode: 'GJ',
    pincode: '382021',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['bike'],
  },
];

// ============================================
// SHIMLA HUBS (Bike tourism)
// ============================================
const SHIMLA_HUBS: RentalHub[] = [
  {
    id: 'sml-mall-road',
    name: 'Mall Road Hub',
    slug: 'shimla-mall-road',
    address: 'Mall Road, Shimla',
    landmark: 'Near Scandal Point',
    city: 'Shimla',
    citySlug: 'shimla',
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    pincode: '171001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// DHARAMSHALA HUBS (Bike tourism)
// ============================================
const DHARAMSHALA_HUBS: RentalHub[] = [
  {
    id: 'dhr-mcleodganj',
    name: 'McLeodganj Hub',
    slug: 'dharamshala-mcleodganj',
    address: 'Temple Road, McLeodganj',
    landmark: 'Near Main Square',
    city: 'Dharamshala',
    citySlug: 'dharamshala',
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    pincode: '176219',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '20:00' },
    services: ['bike'],
  },
];

// ============================================
// DEHRADUN HUBS (Self-drive & Bike)
// ============================================
const DEHRADUN_HUBS: RentalHub[] = [
  {
    id: 'ded-airport',
    name: 'Dehradun Airport',
    slug: 'dehradun-airport',
    address: 'Jolly Grant Airport',
    landmark: 'Airport Terminal',
    city: 'Dehradun',
    citySlug: 'dehradun',
    state: 'Uttarakhand',
    stateCode: 'UK',
    pincode: '248140',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '00:00', close: '23:59', is24x7: true },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'ded-rajpur-road',
    name: 'Rajpur Road Hub',
    slug: 'dehradun-rajpur-road',
    address: 'Rajpur Road',
    landmark: 'Near Clock Tower',
    city: 'Dehradun',
    citySlug: 'dehradun',
    state: 'Uttarakhand',
    stateCode: 'UK',
    pincode: '248001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '22:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// OTHER TOURIST DESTINATION HUBS
// ============================================
const MANALI_HUBS: RentalHub[] = [
  {
    id: 'manali-mall-road',
    name: 'Manali Mall Road Hub',
    slug: 'manali-mall-road',
    address: 'Mall Road, Manali',
    landmark: 'Near Bus Stand',
    city: 'Manali',
    citySlug: 'manali',
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    pincode: '175131',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

const RISHIKESH_HUBS: RentalHub[] = [
  {
    id: 'rishikesh-tapovan',
    name: 'Tapovan Hub',
    slug: 'rishikesh-tapovan',
    address: 'Tapovan Main Road',
    landmark: 'Near Laxman Jhula',
    city: 'Rishikesh',
    citySlug: 'rishikesh',
    state: 'Uttarakhand',
    stateCode: 'UK',
    pincode: '249192',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['bike'],
  },
];

const UDAIPUR_HUBS: RentalHub[] = [
  {
    id: 'udp-airport',
    name: 'Udaipur Airport Hub',
    slug: 'udaipur-airport',
    address: 'Dabok Airport',
    landmark: 'Airport Terminal',
    city: 'Udaipur',
    citySlug: 'udaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '313022',
    type: 'airport',
    isActive: true,
    operatingHours: { open: '06:00', close: '23:00' },
    services: ['self-drive', 'bike'],
  },
  {
    id: 'udp-fateh-sagar',
    name: 'Fateh Sagar Hub',
    slug: 'udaipur-fateh-sagar',
    address: 'Fateh Sagar Road',
    landmark: 'Near Fateh Sagar Lake',
    city: 'Udaipur',
    citySlug: 'udaipur',
    state: 'Rajasthan',
    stateCode: 'RJ',
    pincode: '313001',
    type: 'hub',
    isActive: true,
    operatingHours: { open: '07:00', close: '21:00' },
    services: ['self-drive', 'bike'],
  },
];

// ============================================
// COMBINED ALL HUBS
// ============================================
export const ALL_RENTAL_HUBS: RentalHub[] = [
  // Tier 1 Metro Cities
  ...BANGALORE_HUBS,
  ...MUMBAI_HUBS,
  ...DELHI_HUBS,
  ...HYDERABAD_HUBS,
  ...CHENNAI_HUBS,
  ...KOLKATA_HUBS,
  ...AHMEDABAD_HUBS,
  ...PUNE_HUBS,

  // NCR Region
  ...GURGAON_HUBS,
  ...NOIDA_HUBS,

  // Zoomcar Cities (Self-Drive)
  ...CHANDIGARH_HUBS,
  ...LUCKNOW_HUBS,
  ...KOCHI_HUBS,
  ...INDORE_HUBS,
  ...BHUBANESWAR_HUBS,
  ...GUWAHATI_HUBS,
  ...VIZAG_HUBS,
  ...VIJAYAWADA_HUBS,
  ...MANGALORE_HUBS,
  ...MADURAI_HUBS,
  ...TRICHY_HUBS,
  ...NASHIK_HUBS,
  ...KANPUR_HUBS,
  ...SILIGURI_HUBS,
  ...DEHRADUN_HUBS,

  // Royal Brothers Cities (Bikes)
  ...MYSORE_HUBS,
  ...COORG_HUBS,
  ...CHIKMAGALUR_HUBS,
  ...HAMPI_HUBS,
  ...HUBLI_HUBS,
  ...BELAGAVI_HUBS,
  ...UDUPI_HUBS,
  ...PONDICHERRY_HUBS,
  ...TRIVANDRUM_HUBS,
  ...CALICUT_HUBS,
  ...WAYANAD_HUBS,
  ...SURAT_HUBS,
  ...VADODARA_HUBS,
  ...GANDHINAGAR_HUBS,
  ...JODHPUR_HUBS,
  ...JAISALMER_HUBS,
  ...LEH_HUBS,
  ...AGRA_HUBS,
  ...TIRUPATI_HUBS,
  ...GUNTUR_HUBS,
  ...RANCHI_HUBS,
  ...JAMSHEDPUR_HUBS,
  ...PURI_HUBS,

  // Tourist Destinations
  ...GOA_HUBS,
  ...JAIPUR_HUBS,
  ...UDAIPUR_HUBS,
  ...MANALI_HUBS,
  ...RISHIKESH_HUBS,
  ...SHIMLA_HUBS,
  ...DHARAMSHALA_HUBS,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all hubs for a city
export function getHubsByCity(citySlug: string): RentalHub[] {
  return ALL_RENTAL_HUBS.filter(hub => hub.citySlug === citySlug && hub.isActive);
}

// Get hubs by service type
export function getHubsByService(service: 'self-drive' | 'bike'): RentalHub[] {
  return ALL_RENTAL_HUBS.filter(hub => hub.services.includes(service) && hub.isActive);
}

// Get hubs for a city and service
export function getHubsByCityAndService(citySlug: string, service: 'self-drive' | 'bike'): RentalHub[] {
  return ALL_RENTAL_HUBS.filter(
    hub => hub.citySlug === citySlug && hub.services.includes(service) && hub.isActive
  );
}

// Get hub by slug
export function getHubBySlug(slug: string): RentalHub | undefined {
  return ALL_RENTAL_HUBS.find(hub => hub.slug === slug);
}

// Get all cities that have hubs
export function getCitiesWithHubs(): string[] {
  const cities = new Set(ALL_RENTAL_HUBS.map(hub => hub.citySlug));
  return Array.from(cities);
}

// Get all cities with self-drive hubs
export function getCitiesWithSelfDrive(): string[] {
  const cities = new Set(
    ALL_RENTAL_HUBS.filter(hub => hub.services.includes('self-drive')).map(hub => hub.citySlug)
  );
  return Array.from(cities);
}

// Get all cities with bike hubs
export function getCitiesWithBikeRental(): string[] {
  const cities = new Set(
    ALL_RENTAL_HUBS.filter(hub => hub.services.includes('bike')).map(hub => hub.citySlug)
  );
  return Array.from(cities);
}

// Statistics
export const HUB_STATS = {
  totalHubs: ALL_RENTAL_HUBS.length,
  citiesWithHubs: getCitiesWithHubs().length,
  selfDriveHubs: getHubsByService('self-drive').length,
  bikeHubs: getHubsByService('bike').length,
  airportHubs: ALL_RENTAL_HUBS.filter(h => h.type === 'airport').length,
  is24x7Hubs: ALL_RENTAL_HUBS.filter(h => h.operatingHours.is24x7).length,
};
