/**
 * Centralized SEO meta templates for all service location pages.
 * Used by: admin pages view, and generateMetadata() utilities.
 *
 * pageId format: "serviceSlug:locationSlug"  e.g. "car-rental:mumbai"
 * Route pageId:  "one-way-cab:delhi-to-agra"
 * Airport pageId: "airport-transfer:mumbai-airport-to-andheri"
 * Static pageId:  "static:homepage"
 */

export interface ServiceMetaTemplate {
  title: (city: string) => string;
  description: (city: string) => string;
  keywords: (city: string) => string[];
}

/** Meta templates for all service location pages */
export const SERVICE_META_TEMPLATES: Record<string, ServiceMetaTemplate> = {
  'car-rental': {
    title: (city) => `Car Rental in ${city} | Self Drive Cars @₹999/Day | TransRentals`,
    description: (city) => `Rent cars in ${city} with TransRentals. Self-drive & chauffeur options. Economy to luxury cars. Best prices guaranteed. Book your car rental in ${city} now!`,
    keywords: (city) => [`car rental in ${city}`, `car on rent ${city}`, `self drive car ${city}`, `rent a car ${city}`, `car hire ${city}`],
  },
  'bus-rental': {
    title: (city) => `Bus Rental in ${city} | Starting @₹2499/Day | TransRentals`,
    description: (city) => `Rent buses in ${city} with TransRentals. Choose from mini buses, tempo travellers, luxury coaches. Best prices guaranteed. Book your bus rental in ${city} now!`,
    keywords: (city) => [`bus rental in ${city}`, `bus on rent ${city}`, `${city} bus rental`, `tempo traveller ${city}`, `mini bus rental ${city}`],
  },
  'bike-on-rent': {
    title: (city) => `Bike on Rent in ${city} | Starting @₹299/Day | TransRentals`,
    description: (city) => `Rent bikes in ${city} with TransRentals. Choose from Royal Enfield, KTM, Activa, Honda & more. Best prices guaranteed. Doorstep delivery available. Book your bike rental in ${city} now!`,
    keywords: (city) => [`bike on rent in ${city}`, `bike rental ${city}`, `two wheeler rental ${city}`, `motorcycle on rent ${city}`, `scooty on rent ${city}`],
  },
  'self-drive-car-rentals': {
    title: (city) => `Self Drive Car Rental in ${city} | @₹999/Day | TransRentals`,
    description: (city) => `Book self drive cars in ${city}. No driver needed. Economy, sedan, SUV options. 24/7 roadside assistance. Book online now!`,
    keywords: (city) => [`self drive car rental ${city}`, `self drive cars in ${city}`, `car without driver ${city}`, `self drive ${city}`, `rent car without driver ${city}`],
  },
  'tempo-traveller': {
    title: (city) => `Tempo Traveller ${city} | 12-17 Seater @₹18/Km | Force Traveller`,
    description: (city) => `Rent tempo traveller in ${city} for group travel, pilgrimage & tours. 12, 14, 17 seater options. AC & non-AC. Best prices guaranteed. Book now!`,
    keywords: (city) => [`tempo traveller ${city}`, `tempo traveller on rent ${city}`, `12 seater tempo traveller ${city}`, `17 seater tempo traveller ${city}`, `minibus rental ${city}`],
  },
  'transporter': {
    title: (city) => `Truck Rental in ${city} | Starting @₹3999/Day | TransRentals`,
    description: (city) => `Professional truck rental and transport services in ${city}. 7-ton to 32-ton trucks with GPS tracking. Best prices guaranteed. Book now!`,
    keywords: (city) => [`truck rental in ${city}`, `transporter in ${city}`, `${city} goods transport`, `truck on rent ${city}`, `cargo transport ${city}`],
  },
  'packers-and-movers': {
    title: (city) => `Packers and Movers in ${city} | Starting @₹4999 | TransRentals`,
    description: (city) => `Professional packers and movers in ${city}. Local & intercity relocation, office shifting. Insured and reliable service. Book now!`,
    keywords: (city) => [`packers and movers in ${city}`, `movers and packers ${city}`, `${city} relocation services`, `home shifting ${city}`, `office relocation ${city}`],
  },
  'equipment-rental': {
    title: (city) => `Equipment Rental in ${city} | Starting @₹1499/Day | TransRentals`,
    description: (city) => `Rent construction and event equipment in ${city}. Excavators, cranes, generators, DJ systems. Professional operators available. Book now!`,
    keywords: (city) => [`equipment rental in ${city}`, `machinery rental ${city}`, `construction equipment ${city}`, `JCB on rent ${city}`, `crane on rent ${city}`],
  },
  'trailer-on-rent': {
    title: (city) => `Trailer on Rent in ${city} | Flatbed & Lowbed Trailers | TransRentals`,
    description: (city) => `Rent trailers in ${city} for heavy equipment transport. Flatbed, lowbed, container trailers. GPS tracking. Book now!`,
    keywords: (city) => [`trailer on rent ${city}`, `trailer rental ${city}`, `flatbed trailer ${city}`, `lowbed trailer ${city}`, `heavy transport ${city}`],
  },
  'luxury-car-rental': {
    title: (city) => `Luxury Car Rental in ${city} | BMW, Mercedes, Audi, Ferrari | TransRentals`,
    description: (city) => `Rent luxury cars in ${city}. BMW, Mercedes, Audi, Jaguar, Ferrari available. With or without driver. For weddings, events & business travel. Book now!`,
    keywords: (city) => [`luxury car rental in ${city}`, `BMW on rent ${city}`, `Mercedes rental ${city}`, `Audi rental ${city}`, `luxury car hire ${city}`],
  },
  'chauffeur-service': {
    title: (city) => `Chauffeur Service ${city} | Driver on Hire @₹599 | Car Driver`,
    description: (city) => `Hire professional chauffeur in ${city}. Driver on hire for daily use, outstation. Verified car drivers @₹599/day.`,
    keywords: (city) => [`chauffeur service ${city}`, `driver on hire ${city}`, `car driver ${city}`, `personal driver ${city}`, `driver for rent ${city}`],
  },
  'outstation-cab': {
    title: (city) => `Outstation Cab ${city} | Intercity Taxi @₹12/Km | Round Trip`,
    description: (city) => `Book outstation cab from ${city}. Intercity taxi, round trip & one-way cabs. Sedan, SUV available. Station taxi @₹12/km.`,
    keywords: (city) => [`outstation cab ${city}`, `outstation taxi ${city}`, `intercity cab ${city}`, `outstation car rental ${city}`, `station taxi ${city}`],
  },
  'local-taxi': {
    title: (city) => `Local Taxi ${city} | Hourly Cab @₹399 | 4 Hour 8 Hour Package`,
    description: (city) => `Book local taxi in ${city}. Hourly packages, point to point drops. AC cabs, professional drivers. 4hr/40km & 8hr/80km packages available.`,
    keywords: (city) => [`local taxi ${city}`, `cab service ${city}`, `taxi booking ${city}`, `hourly cab ${city}`, `local cab ${city}`],
  },
  'corporate-car-rental': {
    title: (city) => `Corporate Car Rental ${city} | Employee Transport @₹15k | Business Taxi`,
    description: (city) => `Corporate car rental in ${city} for employee transport, airport transfers. Monthly contracts, dedicated vehicles. GST invoice. Book now!`,
    keywords: (city) => [`corporate car rental ${city}`, `employee transport ${city}`, `business car rental ${city}`, `office cab ${city}`, `corporate taxi ${city}`],
  },
  'corporate-bus-rental': {
    title: (city) => `Corporate Bus Rental in ${city} | Employee Transport @₹4999 | TransRentals`,
    description: (city) => `Corporate bus rental in ${city} for employee transportation, office events & team outings. Daily, monthly & annual contracts available. Book now!`,
    keywords: (city) => [`corporate bus rental ${city}`, `employee bus ${city}`, `office bus rental ${city}`, `staff transport ${city}`, `company bus ${city}`],
  },
  'wedding-car-rental': {
    title: (city) => `Wedding Car Rental ${city} | Shadi Car Hire @₹2999 | Baraat Car`,
    description: (city) => `Rent wedding cars in ${city}. Decorated cars for baraat, bride & groom entry. Luxury & vintage cars available. Book now!`,
    keywords: (city) => [`wedding car rental ${city}`, `shadi car ${city}`, `baraat car ${city}`, `wedding vehicle ${city}`, `bridal car rental ${city}`],
  },
  'wedding-bus-rental': {
    title: (city) => `Wedding Bus Rental in ${city} | Starting @₹3999 | TransRentals`,
    description: (city) => `Rent buses for wedding in ${city}. Guest transport, baraat buses. Mini bus to luxury coaches. Book now!`,
    keywords: (city) => [`wedding bus rental ${city}`, `baraat bus ${city}`, `wedding transport ${city}`, `guest bus rental ${city}`, `shadi bus ${city}`],
  },
  'monthly-car-rental': {
    title: (city) => `Monthly Car Rental ${city} | Car Subscription @₹12k | Long Term Lease`,
    description: (city) => `Monthly car rental in ${city}. Long-term lease, subscription. Zero maintenance, insurance included. From ₹12,000/month. Book now!`,
    keywords: (city) => [`monthly car rental ${city}`, `car on monthly rent ${city}`, `long term car rental ${city}`, `car subscription ${city}`, `car lease ${city}`],
  },
  'monthly-bike-rental': {
    title: (city) => `Monthly Bike Rental in ${city} | Scooty on Rent Monthly @₹2999 | TransRentals`,
    description: (city) => `Rent bike or scooty on monthly basis in ${city}. Activa, Splendor, Pulsar, Royal Enfield available from ₹2999/month. Zero maintenance, doorstep delivery. Book now!`,
    keywords: (city) => [`monthly bike rental ${city}`, `bike on monthly rent ${city}`, `scooty on rent monthly ${city}`, `long term bike rental ${city}`, `monthly two wheeler ${city}`],
  },
  'hourly-car-rental': {
    title: (city) => `Hourly Car Rental in ${city} | @₹149/hr | TransRentals`,
    description: (city) => `Rent a car by the hour in ${city}. Self-drive hourly packages from ₹149/hr. Perfect for meetings, shopping, errands.`,
    keywords: (city) => [`hourly car rental ${city}`, `car on hourly rent ${city}`, `pay per hour car ${city}`, `short term car rental ${city}`, `hourly cab ${city}`],
  },
  'sports-car-rental': {
    title: (city) => `Sports Car Rental in ${city} | Ferrari, Lamborghini | TransRentals`,
    description: (city) => `Rent sports cars in ${city}. Ferrari, Lamborghini, Porsche, BMW M-series. For shoots, events & experiences. Book now!`,
    keywords: (city) => [`sports car rental ${city}`, `Ferrari rental ${city}`, `Lamborghini rental ${city}`, `exotic car rental ${city}`, `supercar rental ${city}`],
  },
  'vintage-car-rental': {
    title: (city) => `Vintage Car Rental in ${city} | Classic Cars for Wedding | TransRentals`,
    description: (city) => `Rent vintage and classic cars in ${city} for weddings, shoots & events. Royal Enfield Bullet, Ambassador, Jeep & more. Book now!`,
    keywords: (city) => [`vintage car rental ${city}`, `classic car rental ${city}`, `old car rental ${city}`, `antique car hire ${city}`, `vintage car wedding ${city}`],
  },
  'outstation-car-rental': {
    title: (city) => `Outstation Car Rental in ${city} | @₹12/Km | TransRentals`,
    description: (city) => `Outstation car rental from ${city}. Self-drive & chauffeur options for intercity trips. Starting @₹12/km. Book now!`,
    keywords: (city) => [`outstation car rental ${city}`, `intercity car rental ${city}`, `long distance car ${city}`, `outstation self drive ${city}`],
  },
  'one-way-car-rental': {
    title: (city) => `One Way Car Rental in ${city} | No Return Charges | TransRentals`,
    description: (city) => `Book one way car rental from ${city}. No return fare. Drop at destination. Sedan, SUV options. Book now!`,
    keywords: (city) => [`one way car rental ${city}`, `one way cab ${city}`, `one side car rental ${city}`, `drop taxi ${city}`],
  },
  'self-drive-hatchback-rental': {
    title: (city) => `Self Drive Hatchback Rental in ${city} | @₹799/Day | TransRentals`,
    description: (city) => `Rent hatchback cars in ${city} without driver. Swift, i20, WagonR, Alto available. Best rates. Book now!`,
    keywords: (city) => [`hatchback rental ${city}`, `self drive hatchback ${city}`, `Swift on rent ${city}`, `i20 rental ${city}`],
  },
  'self-drive-sedan-rental': {
    title: (city) => `Self Drive Sedan Rental in ${city} | @₹999/Day | TransRentals`,
    description: (city) => `Rent sedan cars in ${city} without driver. Honda City, Hyundai Verna, Maruti Ciaz available. Book now!`,
    keywords: (city) => [`sedan rental ${city}`, `self drive sedan ${city}`, `Honda City rental ${city}`, `sedan on rent ${city}`],
  },
  'self-drive-suv-rental': {
    title: (city) => `Self Drive SUV Rental in ${city} | @₹1499/Day | TransRentals`,
    description: (city) => `Rent SUV cars in ${city} without driver. Creta, Seltos, Fortuner, Innova available. Perfect for family trips. Book now!`,
    keywords: (city) => [`SUV rental ${city}`, `self drive SUV ${city}`, `Creta rental ${city}`, `Fortuner rental ${city}`],
  },
  'mini-truck-rental': {
    title: (city) => `Mini Truck Rental in ${city} | Tata Ace, Bolero Pickup | TransRentals`,
    description: (city) => `Rent mini trucks in ${city}. Tata Ace, Bolero Pickup, Mahindra Jeeto. For goods transport, local delivery. Book now!`,
    keywords: (city) => [`mini truck rental ${city}`, `Tata Ace rental ${city}`, `pickup truck ${city}`, `small truck rental ${city}`],
  },
  'electric-scooter-rental': {
    title: (city) => `Electric Scooter Rental in ${city} | @₹199/Day | TransRentals`,
    description: (city) => `Rent electric scooters in ${city}. Eco-friendly, cost-effective. Ather, Ola Electric, TVS iQube available. Book now!`,
    keywords: (city) => [`electric scooter rental ${city}`, `EV scooter on rent ${city}`, `Ola electric rental ${city}`, `e-scooter ${city}`],
  },
  'crane-on-rent': {
    title: (city) => `Crane on Rent in ${city} | Mobile Crane Hire | TransRentals`,
    description: (city) => `Rent cranes in ${city}. Mobile cranes, tower cranes, pick & carry cranes. All capacities. With operator. Book now!`,
    keywords: (city) => [`crane on rent ${city}`, `crane rental ${city}`, `mobile crane ${city}`, `crane hire ${city}`],
  },
  'excavator-on-rent': {
    title: (city) => `Excavator on Rent in ${city} | JCB & Excavator Hire | TransRentals`,
    description: (city) => `Rent excavators and JCBs in ${city}. PC200, PC300, mini excavators. With operator. Book now!`,
    keywords: (city) => [`excavator on rent ${city}`, `excavator rental ${city}`, `digger hire ${city}`, `earth mover ${city}`],
  },
  'jcb-on-rent': {
    title: (city) => `JCB on Rent in ${city} | Backhoe Loader Hire | TransRentals`,
    description: (city) => `Rent JCB in ${city}. JCB 3DX, 3CX, mini JCB available. With experienced operators. Book now!`,
    keywords: (city) => [`JCB on rent ${city}`, `JCB rental ${city}`, `backhoe loader ${city}`, `JCB hire ${city}`],
  },
  'hydra-on-rent': {
    title: (city) => `Hydra Crane on Rent in ${city} | Pick & Carry Crane | TransRentals`,
    description: (city) => `Rent hydra cranes in ${city}. 12T, 14T pick & carry cranes. With operator. Book now!`,
    keywords: (city) => [`hydra crane on rent ${city}`, `pick and carry crane ${city}`, `hydra rental ${city}`],
  },
  'generator-on-rent': {
    title: (city) => `Generator on Rent in ${city} | 5KVA to 500KVA | TransRentals`,
    description: (city) => `Rent generators in ${city}. Silent DG sets from 5KVA to 500KVA. For events, construction, power backup. Book now!`,
    keywords: (city) => [`generator on rent ${city}`, `generator rental ${city}`, `DG set rental ${city}`, `power generator ${city}`],
  },
  'innova-on-rent': {
    title: (city) => `Innova on Rent in ${city} | Rent Innova @₹2499/Day | TransRentals`,
    description: (city) => `Rent Toyota Innova Crysta in ${city}. Self-drive Innova for family trips, weddings. 7+1 seater. GX, VX, ZX variants. Book now!`,
    keywords: (city) => [`Innova on rent ${city}`, `Innova Crysta rental ${city}`, `Innova hire ${city}`, `Toyota Innova ${city}`],
  },
  'creta-on-rent': {
    title: (city) => `Creta on Rent in ${city} | Hyundai Creta Rental @₹1499/Day | TransRentals`,
    description: (city) => `Rent Hyundai Creta in ${city}. Self-drive SUV rental. Best prices. Book now!`,
    keywords: (city) => [`Creta on rent ${city}`, `Hyundai Creta rental ${city}`, `Creta hire ${city}`],
  },
  'fortuner-on-rent': {
    title: (city) => `Fortuner on Rent in ${city} | Toyota Fortuner Rental | TransRentals`,
    description: (city) => `Rent Toyota Fortuner in ${city}. Luxury SUV rental for trips, events. With or without driver. Book now!`,
    keywords: (city) => [`Fortuner on rent ${city}`, `Toyota Fortuner rental ${city}`, `Fortuner hire ${city}`],
  },
  'scorpio-on-rent': {
    title: (city) => `Scorpio on Rent in ${city} | Mahindra Scorpio Rental | TransRentals`,
    description: (city) => `Rent Mahindra Scorpio in ${city}. Self-drive & chauffeur options. Great for off-road & family trips. Book now!`,
    keywords: (city) => [`Scorpio on rent ${city}`, `Mahindra Scorpio rental ${city}`, `Scorpio hire ${city}`],
  },
  'seltos-on-rent': {
    title: (city) => `Seltos on Rent in ${city} | Kia Seltos Rental | TransRentals`,
    description: (city) => `Rent Kia Seltos in ${city}. Self-drive SUV rental. Premium features, great mileage. Book now!`,
    keywords: (city) => [`Seltos on rent ${city}`, `Kia Seltos rental ${city}`, `Seltos hire ${city}`],
  },
  'swift-on-rent': {
    title: (city) => `Swift on Rent in ${city} | Maruti Swift Rental @₹799/Day | TransRentals`,
    description: (city) => `Rent Maruti Swift in ${city}. Self-drive hatchback rental. Best fuel efficiency. Book now!`,
    keywords: (city) => [`Swift on rent ${city}`, `Maruti Swift rental ${city}`, `Swift hire ${city}`],
  },
  'activa-on-rent': {
    title: (city) => `Activa on Rent in ${city} | Honda Activa Rental @₹299/Day | TransRentals`,
    description: (city) => `Rent Honda Activa in ${city}. Scooty rental for daily commute & city rides. Best prices. Book now!`,
    keywords: (city) => [`Activa on rent ${city}`, `Honda Activa rental ${city}`, `scooty on rent ${city}`, `Activa hire ${city}`],
  },
  'royal-enfield-on-rent': {
    title: (city) => `Royal Enfield on Rent in ${city} | Bullet Rental @₹799/Day | TransRentals`,
    description: (city) => `Rent Royal Enfield Bullet in ${city}. Classic 350, Meteor, Himalayan available. Self-drive. Best prices. Book now!`,
    keywords: (city) => [`Royal Enfield on rent ${city}`, `Bullet rental ${city}`, `Royal Enfield hire ${city}`, `RE rental ${city}`],
  },
  'pulsar-on-rent': {
    title: (city) => `Pulsar on Rent in ${city} | Bajaj Pulsar Rental @₹499/Day | TransRentals`,
    description: (city) => `Rent Bajaj Pulsar in ${city}. 150cc, 180cc, 220cc, NS200 available. Best prices. Book now!`,
    keywords: (city) => [`Pulsar on rent ${city}`, `Bajaj Pulsar rental ${city}`, `Pulsar hire ${city}`],
  },
  'ktm-on-rent': {
    title: (city) => `KTM on Rent in ${city} | KTM Duke Rental @₹999/Day | TransRentals`,
    description: (city) => `Rent KTM bikes in ${city}. Duke 200, Duke 390, Adventure available. Book now!`,
    keywords: (city) => [`KTM on rent ${city}`, `KTM Duke rental ${city}`, `KTM hire ${city}`],
  },
  'himalayan-on-rent': {
    title: (city) => `Royal Enfield Himalayan on Rent in ${city} | @₹999/Day | TransRentals`,
    description: (city) => `Rent Royal Enfield Himalayan in ${city}. Perfect for Leh, Spiti, adventure trips. Book now!`,
    keywords: (city) => [`Himalayan on rent ${city}`, `RE Himalayan rental ${city}`, `adventure bike rental ${city}`],
  },
  'splendor-on-rent': {
    title: (city) => `Splendor on Rent in ${city} | Hero Splendor Rental @₹299/Day | TransRentals`,
    description: (city) => `Rent Hero Splendor in ${city}. Best mileage bike for daily commute. Book now!`,
    keywords: (city) => [`Splendor on rent ${city}`, `Hero Splendor rental ${city}`, `Splendor hire ${city}`],
  },
  'apache-on-rent': {
    title: (city) => `Apache on Rent in ${city} | TVS Apache Rental @₹599/Day | TransRentals`,
    description: (city) => `Rent TVS Apache in ${city}. RTR 160, RTR 200, RR310 available. Book now!`,
    keywords: (city) => [`Apache on rent ${city}`, `TVS Apache rental ${city}`, `Apache hire ${city}`],
  },
  'xuv700-on-rent': {
    title: (city) => `XUV700 on Rent in ${city} | Mahindra XUV700 Rental | TransRentals`,
    description: (city) => `Rent Mahindra XUV700 in ${city}. Premium SUV with ADAS features. Book now!`,
    keywords: (city) => [`XUV700 on rent ${city}`, `Mahindra XUV700 rental ${city}`, `XUV hire ${city}`],
  },
  '12-seater-tempo-traveller': {
    title: (city) => `12 Seater Tempo Traveller in ${city} | @₹18/Km | TransRentals`,
    description: (city) => `Rent 12 seater tempo traveller in ${city}. AC & non-AC available. Ideal for family trips & tours. Book now!`,
    keywords: (city) => [`12 seater tempo traveller ${city}`, `12 seater minibus ${city}`, `12 seater van rental ${city}`],
  },
  '17-seater-tempo-traveller': {
    title: (city) => `17 Seater Tempo Traveller in ${city} | @₹18/Km | TransRentals`,
    description: (city) => `Rent 17 seater tempo traveller in ${city}. AC luxury traveller for group tours. Book now!`,
    keywords: (city) => [`17 seater tempo traveller ${city}`, `17 seater bus ${city}`, `17 seater van rental ${city}`],
  },
  '20-seater-tempo-traveller': {
    title: (city) => `20 Seater Tempo Traveller in ${city} | @₹20/Km | TransRentals`,
    description: (city) => `Rent 20 seater tempo traveller in ${city}. Push back seats, AC, music system. Book now!`,
    keywords: (city) => [`20 seater tempo traveller ${city}`, `20 seater bus rental ${city}`, `20 seater minibus ${city}`],
  },
  '26-seater-bus': {
    title: (city) => `26 Seater Bus Rental in ${city} | Mini Bus Hire | TransRentals`,
    description: (city) => `Rent 26 seater bus in ${city}. For school trips, corporate events, pilgrimages. AC & non-AC. Book now!`,
    keywords: (city) => [`26 seater bus ${city}`, `mini bus rental ${city}`, `26 seater minibus ${city}`],
  },
};

/** Static pages list — used for the Website section in admin */
export const STATIC_PAGES = [
  { pageId: 'static:homepage', url: '/', label: 'Homepage' },
  { pageId: 'static:about', url: '/about', label: 'About Us' },
  { pageId: 'static:contact', url: '/contact', label: 'Contact' },
  { pageId: 'static:services', url: '/services', label: 'All Services' },
  { pageId: 'static:blog', url: '/blog', label: 'Blog' },
  // Service main pages
  { pageId: 'static:car-rental', url: '/car-rental', label: 'Car Rental (Main)' },
  { pageId: 'static:bus-rental', url: '/bus-rental', label: 'Bus Rental (Main)' },
  { pageId: 'static:bike-on-rent', url: '/bike-on-rent', label: 'Bike Rental (Main)' },
  { pageId: 'static:self-drive-car-rentals', url: '/self-drive-car-rentals', label: 'Self Drive (Main)' },
  { pageId: 'static:tempo-traveller', url: '/tempo-traveller', label: 'Tempo Traveller (Main)' },
  { pageId: 'static:transporter', url: '/transporter', label: 'Transporter (Main)' },
  { pageId: 'static:packers-and-movers', url: '/packers-and-movers', label: 'Packers & Movers (Main)' },
  { pageId: 'static:equipment-rental', url: '/equipment-rental', label: 'Equipment Rental (Main)' },
  { pageId: 'static:trailer-on-rent', url: '/trailer-on-rent', label: 'Trailer (Main)' },
  { pageId: 'static:luxury-car-rental', url: '/luxury-car-rental', label: 'Luxury Car (Main)' },
  { pageId: 'static:chauffeur-service', url: '/chauffeur-service', label: 'Chauffeur Service (Main)' },
  { pageId: 'static:outstation-cab', url: '/outstation-cab', label: 'Outstation Cab (Main)' },
  { pageId: 'static:local-taxi', url: '/local-taxi', label: 'Local Taxi (Main)' },
  { pageId: 'static:one-way-cab', url: '/one-way-cab', label: 'One Way Cab (Main)' },
  { pageId: 'static:round-trip', url: '/round-trip', label: 'Round Trip (Main)' },
  { pageId: 'static:airport-transfer', url: '/airport-transfer', label: 'Airport Transfer (Main)' },
  { pageId: 'static:corporate-car-rental', url: '/corporate-car-rental', label: 'Corporate Car (Main)' },
  { pageId: 'static:corporate-bus-rental', url: '/corporate-bus-rental', label: 'Corporate Bus (Main)' },
  { pageId: 'static:wedding-car-rental', url: '/wedding-car-rental', label: 'Wedding Car (Main)' },
  { pageId: 'static:wedding-bus-rental', url: '/wedding-bus-rental', label: 'Wedding Bus (Main)' },
  { pageId: 'static:monthly-car-rental', url: '/monthly-car-rental', label: 'Monthly Car (Main)' },
  { pageId: 'static:monthly-bike-rental', url: '/monthly-bike-rental', label: 'Monthly Bike (Main)' },
  { pageId: 'static:hourly-car-rental', url: '/hourly-car-rental', label: 'Hourly Car (Main)' },
  // Bike tours
  { pageId: 'static:bike-tours', url: '/bike-tours', label: 'Bike Tours (Main)' },
  { pageId: 'static:bike-tours-goa', url: '/bike-tours/goa', label: 'Bike Tours — Goa' },
  { pageId: 'static:bike-tours-leh-ladakh', url: '/bike-tours/leh-ladakh', label: 'Bike Tours — Leh Ladakh' },
  { pageId: 'static:bike-tours-rajasthan', url: '/bike-tours/rajasthan', label: 'Bike Tours — Rajasthan' },
  { pageId: 'static:bike-tours-spiti-valley', url: '/bike-tours/spiti-valley', label: 'Bike Tours — Spiti Valley' },
  { pageId: 'static:bike-trips', url: '/bike-trips', label: 'Bike Trips (Main)' },
  { pageId: 'static:bike-trips-ladakh', url: '/bike-trips/ladakh', label: 'Bike Trips — Ladakh' },
];

/** Get template meta for a service+city */
export function getTemplateMeta(serviceSlug: string, cityName: string) {
  const tpl = SERVICE_META_TEMPLATES[serviceSlug];
  if (!tpl) return null;
  return {
    title: tpl.title(cityName),
    description: tpl.description(cityName),
    keywords: tpl.keywords(cityName).join(', '),
  };
}
