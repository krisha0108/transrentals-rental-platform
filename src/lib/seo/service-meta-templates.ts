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
  // Specific seater pages
  { pageId: 'static:12-seater-tempo-traveller', url: '/12-seater-tempo-traveller', label: '12 Seater Tempo Traveller' },
  { pageId: 'static:17-seater-tempo-traveller', url: '/17-seater-tempo-traveller', label: '17 Seater Tempo Traveller' },
  { pageId: 'static:20-seater-tempo-traveller', url: '/20-seater-tempo-traveller', label: '20 Seater Tempo Traveller' },
  { pageId: 'static:26-seater-bus', url: '/26-seater-bus', label: '26 Seater Bus' },
  // Bike model pages
  { pageId: 'static:activa-on-rent', url: '/activa-on-rent', label: 'Activa on Rent' },
  { pageId: 'static:apache-on-rent', url: '/apache-on-rent', label: 'Apache on Rent' },
  { pageId: 'static:himalayan-on-rent', url: '/himalayan-on-rent', label: 'Royal Enfield Himalayan on Rent' },
  { pageId: 'static:ktm-on-rent', url: '/ktm-on-rent', label: 'KTM on Rent' },
  { pageId: 'static:pulsar-on-rent', url: '/pulsar-on-rent', label: 'Pulsar on Rent' },
  { pageId: 'static:royal-enfield-on-rent', url: '/royal-enfield-on-rent', label: 'Royal Enfield on Rent' },
  { pageId: 'static:splendor-on-rent', url: '/splendor-on-rent', label: 'Splendor on Rent' },
  { pageId: 'static:electric-scooter-rental', url: '/electric-scooter-rental', label: 'Electric Scooter Rental' },
  // Car model pages
  { pageId: 'static:creta-on-rent', url: '/creta-on-rent', label: 'Creta on Rent' },
  { pageId: 'static:fortuner-on-rent', url: '/fortuner-on-rent', label: 'Fortuner on Rent' },
  { pageId: 'static:innova-on-rent', url: '/innova-on-rent', label: 'Innova on Rent' },
  { pageId: 'static:scorpio-on-rent', url: '/scorpio-on-rent', label: 'Scorpio on Rent' },
  { pageId: 'static:seltos-on-rent', url: '/seltos-on-rent', label: 'Seltos on Rent' },
  { pageId: 'static:swift-on-rent', url: '/swift-on-rent', label: 'Swift on Rent' },
  { pageId: 'static:xuv700-on-rent', url: '/xuv700-on-rent', label: 'XUV700 on Rent' },
  { pageId: 'static:sports-car-rental', url: '/sports-car-rental', label: 'Sports Car Rental' },
  { pageId: 'static:vintage-car-rental', url: '/vintage-car-rental', label: 'Vintage Car Rental' },
  // Self drive category pages
  { pageId: 'static:self-drive-hatchback-rental', url: '/self-drive-hatchback-rental', label: 'Self Drive Hatchback' },
  { pageId: 'static:self-drive-sedan-rental', url: '/self-drive-sedan-rental', label: 'Self Drive Sedan' },
  { pageId: 'static:self-drive-suv-rental', url: '/self-drive-suv-rental', label: 'Self Drive SUV' },
  { pageId: 'static:one-way-car-rental', url: '/one-way-car-rental', label: 'One Way Car Rental' },
  { pageId: 'static:outstation-car-rental', url: '/outstation-car-rental', label: 'Outstation Car Rental' },
  // Equipment & heavy vehicle pages
  { pageId: 'static:crane-on-rent', url: '/crane-on-rent', label: 'Crane on Rent' },
  { pageId: 'static:excavator-on-rent', url: '/excavator-on-rent', label: 'Excavator on Rent' },
  { pageId: 'static:generator-on-rent', url: '/generator-on-rent', label: 'Generator on Rent' },
  { pageId: 'static:hydra-on-rent', url: '/hydra-on-rent', label: 'Hydra Crane on Rent' },
  { pageId: 'static:jcb-on-rent', url: '/jcb-on-rent', label: 'JCB on Rent' },
  { pageId: 'static:mini-truck-rental', url: '/mini-truck-rental', label: 'Mini Truck Rental' },
];

/** Template meta for static (non-dynamic) pages */
export const STATIC_PAGE_META: Record<string, { templateTitle: string; templateDescription: string; templateKeywords: string }> = {
  'static:homepage': {
    templateTitle: 'TransRentals | Rent Cars, Bikes, Buses & More Across India',
    templateDescription: 'TransRentals offers self-drive cars, bikes, buses, trucks, luxury cars, packers & movers across India. Best prices, doorstep delivery. Book online now!',
    templateKeywords: 'car rental india, bike rental, bus rental, transrentals, vehicle rental india',
  },
  'static:about': {
    templateTitle: 'About TransRentals | India\'s Trusted Vehicle Rental Platform',
    templateDescription: 'Learn about TransRentals — India\'s fastest growing vehicle rental platform. Self-drive, chauffeur, bus, truck & equipment rentals across 100+ cities.',
    templateKeywords: 'about transrentals, vehicle rental company india, car rental platform',
  },
  'static:contact': {
    templateTitle: 'Contact TransRentals | 24/7 Support | Get in Touch',
    templateDescription: 'Contact TransRentals for bookings, support & queries. Available 24/7. Call, WhatsApp or email us for the best vehicle rental deals across India.',
    templateKeywords: 'contact transrentals, transrentals support, vehicle rental helpline',
  },
  'static:services': {
    templateTitle: 'All Rental Services | Cars, Bikes, Buses, Trucks | TransRentals',
    templateDescription: 'Explore all vehicle rental services on TransRentals — self-drive cars, bikes, buses, trucks, luxury cars, equipment & more. Book online across India.',
    templateKeywords: 'vehicle rental services, all rentals india, transrentals services',
  },
  'static:blog': {
    templateTitle: 'Blog | Vehicle Rental Tips, Guides & Travel Stories | TransRentals',
    templateDescription: 'Read TransRentals blog for travel guides, rental tips, road trip ideas, and vehicle rental advice across India.',
    templateKeywords: 'transrentals blog, vehicle rental tips, travel guide india',
  },
  'static:car-rental': {
    templateTitle: 'Car Rental India | Self Drive & Chauffeur | TransRentals',
    templateDescription: 'Rent cars across India with TransRentals. Self-drive and chauffeur options. Economy to luxury cars. Best prices, flexible plans. Book online now!',
    templateKeywords: 'car rental india, self drive car rental, chauffeur car rental, rent a car india',
  },
  'static:bus-rental': {
    templateTitle: 'Bus Rental India | Tempo Traveller, Mini Bus & Coach | TransRentals',
    templateDescription: 'Rent buses across India. Mini bus, tempo traveller, luxury coach for school trips, corporate events, pilgrimages. Book online now!',
    templateKeywords: 'bus rental india, tempo traveller rental, mini bus hire, coach rental',
  },
  'static:bike-on-rent': {
    templateTitle: 'Bike on Rent India | Royal Enfield, KTM, Activa | TransRentals',
    templateDescription: 'Rent bikes across India. Royal Enfield, KTM, Activa, Pulsar & more. Doorstep delivery, starting @₹299/day. Book online now!',
    templateKeywords: 'bike on rent india, bike rental, motorcycle rental, scooty on rent india',
  },
  'static:self-drive-car-rentals': {
    templateTitle: 'Self Drive Car Rental India | No Driver | TransRentals',
    templateDescription: 'Book self drive cars across India. No driver needed. Economy, sedan, SUV options. 24/7 support. Starting @₹999/day. Book now!',
    templateKeywords: 'self drive car rental india, car without driver, self drive india',
  },
  'static:tempo-traveller': {
    templateTitle: 'Tempo Traveller Rental India | 12-17 Seater | TransRentals',
    templateDescription: 'Rent tempo travellers across India for group travel. 12, 14, 17 seater. AC & non-AC. Starting @₹18/km. Book now!',
    templateKeywords: 'tempo traveller rental india, 12 seater tempo traveller, group vehicle rental',
  },
  'static:transporter': {
    templateTitle: 'Truck & Transporter Rental India | Goods Transport | TransRentals',
    templateDescription: 'Rent trucks and transporters across India. 7-ton to 32-ton trucks for goods transport. GPS tracking. Best prices. Book now!',
    templateKeywords: 'truck rental india, transporter india, goods transport, truck on rent',
  },
  'static:packers-and-movers': {
    templateTitle: 'Packers and Movers India | Relocation Services | TransRentals',
    templateDescription: 'Professional packers and movers across India. Home & office relocation. Insured, reliable service. Starting @₹4999. Book now!',
    templateKeywords: 'packers and movers india, movers packers, relocation services india',
  },
  'static:equipment-rental': {
    templateTitle: 'Equipment Rental India | Construction & Event Equipment | TransRentals',
    templateDescription: 'Rent construction and event equipment across India. Excavators, cranes, generators, JCBs. With operator. Book now!',
    templateKeywords: 'equipment rental india, construction equipment hire, machinery rental india',
  },
  'static:trailer-on-rent': {
    templateTitle: 'Trailer on Rent India | Flatbed & Lowbed Trailers | TransRentals',
    templateDescription: 'Rent trailers across India for heavy equipment transport. Flatbed, lowbed, container trailers. GPS tracking. Book now!',
    templateKeywords: 'trailer rental india, flatbed trailer, lowbed trailer, heavy transport india',
  },
  'static:luxury-car-rental': {
    templateTitle: 'Luxury Car Rental India | BMW, Mercedes, Audi | TransRentals',
    templateDescription: 'Rent luxury cars across India. BMW, Mercedes, Audi, Jaguar, Ferrari. With or without driver. For weddings, events & business. Book now!',
    templateKeywords: 'luxury car rental india, BMW rental, Mercedes rental, luxury car hire india',
  },
  'static:chauffeur-service': {
    templateTitle: 'Chauffeur Service India | Driver on Hire | TransRentals',
    templateDescription: 'Hire professional chauffeurs across India. Verified drivers for daily use, outstation trips. Starting @₹599/day. Book now!',
    templateKeywords: 'chauffeur service india, driver on hire, personal driver india',
  },
  'static:outstation-cab': {
    templateTitle: 'Outstation Cab India | Intercity Taxi | TransRentals',
    templateDescription: 'Book outstation cabs across India. Round trip, one-way options. Sedan & SUV. Starting @₹12/km. Book now!',
    templateKeywords: 'outstation cab india, intercity taxi, outstation taxi india',
  },
  'static:local-taxi': {
    templateTitle: 'Local Taxi India | Hourly Cab Booking | TransRentals',
    templateDescription: 'Book local taxis across India. Hourly packages, point-to-point drops. AC cabs, professional drivers. Book now!',
    templateKeywords: 'local taxi india, cab booking, hourly cab india',
  },
  'static:one-way-cab': {
    templateTitle: 'One Way Cab India | No Return Charges | TransRentals',
    templateDescription: 'Book one way cabs across India. No return charges. Drop at destination city. Sedan, SUV options. Book now!',
    templateKeywords: 'one way cab india, one way taxi, one side cab india',
  },
  'static:round-trip': {
    templateTitle: 'Round Trip Cab India | Best Rates | TransRentals',
    templateDescription: 'Book round trip cabs across India. Best rates, comfortable journey. Sedan, SUV options. 24/7 support. Book now!',
    templateKeywords: 'round trip cab india, round trip taxi, return cab india',
  },
  'static:airport-transfer': {
    templateTitle: 'Airport Transfer India | Airport Cab Booking | TransRentals',
    templateDescription: 'Book airport transfers across India. 45 min free wait, flight tracking. Sedan, SUV options. Book now!',
    templateKeywords: 'airport transfer india, airport cab, airport taxi india',
  },
  'static:corporate-car-rental': {
    templateTitle: 'Corporate Car Rental India | Employee Transport | TransRentals',
    templateDescription: 'Corporate car rental across India for employee transport, airport transfers. Monthly contracts, GST invoice. Book now!',
    templateKeywords: 'corporate car rental india, employee transport, business cab india',
  },
  'static:corporate-bus-rental': {
    templateTitle: 'Corporate Bus Rental India | Staff Transport | TransRentals',
    templateDescription: 'Corporate bus rental across India for employee transportation. Daily, monthly & annual contracts. Book now!',
    templateKeywords: 'corporate bus rental india, staff transport bus, employee bus india',
  },
  'static:wedding-car-rental': {
    templateTitle: 'Wedding Car Rental India | Baraat & Bridal Cars | TransRentals',
    templateDescription: 'Rent wedding cars across India. Decorated cars for baraat, bride entry. Luxury & vintage cars. Book now!',
    templateKeywords: 'wedding car rental india, baraat car, bridal car rental india',
  },
  'static:wedding-bus-rental': {
    templateTitle: 'Wedding Bus Rental India | Guest Transport | TransRentals',
    templateDescription: 'Rent buses for weddings across India. Guest transport, baraat buses. Mini bus to luxury coaches. Book now!',
    templateKeywords: 'wedding bus rental india, baraat bus, wedding transport india',
  },
  'static:monthly-car-rental': {
    templateTitle: 'Monthly Car Rental India | Long Term Lease | TransRentals',
    templateDescription: 'Monthly car rental across India. Zero maintenance, insurance included. Starting @₹12,000/month. Book now!',
    templateKeywords: 'monthly car rental india, long term car rental, car subscription india',
  },
  'static:monthly-bike-rental': {
    templateTitle: 'Monthly Bike Rental India | Scooty on Monthly Rent | TransRentals',
    templateDescription: 'Rent bikes on monthly basis across India. Activa, Splendor, Pulsar, Royal Enfield. Starting @₹2999/month. Book now!',
    templateKeywords: 'monthly bike rental india, bike on monthly rent, long term bike rental',
  },
  'static:hourly-car-rental': {
    templateTitle: 'Hourly Car Rental India | Pay Per Hour | TransRentals',
    templateDescription: 'Rent cars by the hour across India. Self-drive hourly packages from ₹149/hr. Perfect for meetings & errands. Book now!',
    templateKeywords: 'hourly car rental india, car by hour, pay per hour car india',
  },
  'static:bike-tours': {
    templateTitle: 'Bike Tours India | Guided Motorcycle Tours | TransRentals',
    templateDescription: 'Explore India on guided bike tours. Goa, Leh Ladakh, Rajasthan, Spiti Valley & more. Royal Enfield, KTM available. Book now!',
    templateKeywords: 'bike tours india, motorcycle tours india, guided bike tour',
  },
  'static:bike-tours-goa': {
    templateTitle: 'Bike Tours Goa | Rent Royal Enfield in Goa | TransRentals',
    templateDescription: 'Explore Goa on a guided bike tour. Royal Enfield, KTM, Activa available. Best coastal routes. Book your Goa bike tour now!',
    templateKeywords: 'bike tours goa, motorcycle tour goa, Royal Enfield goa, bike rental goa',
  },
  'static:bike-tours-leh-ladakh': {
    templateTitle: 'Leh Ladakh Bike Tour | Royal Enfield Himalayan | TransRentals',
    templateDescription: 'Ride to Leh Ladakh on a guided bike tour. Royal Enfield Himalayan, KTM Adventure. Best Manali-Leh & Srinagar-Leh routes. Book now!',
    templateKeywords: 'leh ladakh bike tour, ladakh motorcycle tour, Himalayan bike trip',
  },
  'static:bike-tours-rajasthan': {
    templateTitle: 'Rajasthan Bike Tour | Royal Enfield Desert Ride | TransRentals',
    templateDescription: 'Explore Rajasthan on a guided motorcycle tour. Jaipur, Jodhpur, Jaisalmer, Udaipur. Royal Enfield available. Book now!',
    templateKeywords: 'rajasthan bike tour, rajasthan motorcycle tour, desert bike ride',
  },
  'static:bike-tours-spiti-valley': {
    templateTitle: 'Spiti Valley Bike Tour | High Altitude Adventure | TransRentals',
    templateDescription: 'Ride through Spiti Valley on a guided bike tour. Kaza, Key Monastery, Chandratal. Adventure biking at 14,000 ft. Book now!',
    templateKeywords: 'spiti valley bike tour, spiti motorcycle tour, high altitude biking',
  },
  'static:bike-trips': {
    templateTitle: 'Bike Trips India | Self Guided Motorcycle Trips | TransRentals',
    templateDescription: 'Plan your own bike trip across India with TransRentals. Rent bikes for self-guided adventures. Best rates. Book now!',
    templateKeywords: 'bike trips india, motorcycle trips, self guided bike trip',
  },
  'static:bike-trips-ladakh': {
    templateTitle: 'Ladakh Bike Trip | Self Drive Motorcycle Adventure | TransRentals',
    templateDescription: 'Plan your Ladakh bike trip with TransRentals. Rent Royal Enfield or KTM. Manali-Leh & Srinagar-Leh routes. Book now!',
    templateKeywords: 'ladakh bike trip, leh ladakh self drive, motorcycle trip ladakh',
  },
  // Specific seater pages
  'static:12-seater-tempo-traveller': {
    templateTitle: '12 Seater Tempo Traveller Rental India | @₹18/Km | TransRentals',
    templateDescription: 'Rent 12 seater tempo traveller across India. AC & non-AC available. Ideal for family trips, group tours & pilgrimages. Best rates. Book now!',
    templateKeywords: '12 seater tempo traveller, 12 seater minibus rental, 12 seater van rental india',
  },
  'static:17-seater-tempo-traveller': {
    templateTitle: '17 Seater Tempo Traveller Rental India | @₹18/Km | TransRentals',
    templateDescription: 'Rent 17 seater tempo traveller across India. AC luxury traveller for group tours & corporate travel. Best rates. Book now!',
    templateKeywords: '17 seater tempo traveller, 17 seater bus rental india, group travel india',
  },
  'static:20-seater-tempo-traveller': {
    templateTitle: '20 Seater Tempo Traveller Rental India | @₹20/Km | TransRentals',
    templateDescription: 'Rent 20 seater tempo traveller across India. Push back seats, AC, music system. Perfect for weddings & tours. Book now!',
    templateKeywords: '20 seater tempo traveller, 20 seater bus rental india, 20 seater minibus',
  },
  'static:26-seater-bus': {
    templateTitle: '26 Seater Bus Rental India | Mini Bus Hire | TransRentals',
    templateDescription: 'Rent 26 seater bus across India. School trips, corporate events, pilgrimages. AC & non-AC options. Book now!',
    templateKeywords: '26 seater bus rental india, mini bus hire india, 26 seater minibus',
  },
  // Bike model pages
  'static:activa-on-rent': {
    templateTitle: 'Activa on Rent India | Honda Activa Rental @₹299/Day | TransRentals',
    templateDescription: 'Rent Honda Activa across India. Scooty rental for daily commute & city rides. Doorstep delivery. Best prices. Book now!',
    templateKeywords: 'activa on rent india, honda activa rental, scooty on rent india, activa hire',
  },
  'static:apache-on-rent': {
    templateTitle: 'Apache on Rent India | TVS Apache Rental @₹599/Day | TransRentals',
    templateDescription: 'Rent TVS Apache across India. RTR 160, RTR 200, RR310 available. Doorstep delivery. Best prices. Book now!',
    templateKeywords: 'apache on rent india, TVS apache rental, apache hire india',
  },
  'static:himalayan-on-rent': {
    templateTitle: 'Royal Enfield Himalayan on Rent India | @₹999/Day | TransRentals',
    templateDescription: 'Rent Royal Enfield Himalayan across India. Perfect for Leh, Spiti, Ladakh adventure trips. Doorstep delivery. Book now!',
    templateKeywords: 'himalayan on rent india, RE himalayan rental, adventure bike rental india',
  },
  'static:ktm-on-rent': {
    templateTitle: 'KTM on Rent India | KTM Duke Rental @₹999/Day | TransRentals',
    templateDescription: 'Rent KTM bikes across India. Duke 200, Duke 390, Adventure available. For thrill riders & adventurers. Book now!',
    templateKeywords: 'KTM on rent india, KTM duke rental, KTM hire india, KTM adventure rental',
  },
  'static:pulsar-on-rent': {
    templateTitle: 'Pulsar on Rent India | Bajaj Pulsar Rental @₹499/Day | TransRentals',
    templateDescription: 'Rent Bajaj Pulsar across India. 150cc, 180cc, 220cc, NS200 available. Doorstep delivery. Best prices. Book now!',
    templateKeywords: 'pulsar on rent india, bajaj pulsar rental, pulsar hire india',
  },
  'static:royal-enfield-on-rent': {
    templateTitle: 'Royal Enfield on Rent India | Bullet Rental @₹799/Day | TransRentals',
    templateDescription: 'Rent Royal Enfield Bullet across India. Classic 350, Meteor, Himalayan available. Doorstep delivery. Best prices. Book now!',
    templateKeywords: 'royal enfield on rent india, bullet rental india, royal enfield hire, RE rental',
  },
  'static:splendor-on-rent': {
    templateTitle: 'Splendor on Rent India | Hero Splendor Rental @₹299/Day | TransRentals',
    templateDescription: 'Rent Hero Splendor across India. Best mileage bike for daily commute. Doorstep delivery. Book now!',
    templateKeywords: 'splendor on rent india, hero splendor rental, splendor hire india',
  },
  'static:electric-scooter-rental': {
    templateTitle: 'Electric Scooter Rental India | @₹199/Day | TransRentals',
    templateDescription: 'Rent electric scooters across India. Eco-friendly, cost-effective. Ather, Ola Electric, TVS iQube available. Book now!',
    templateKeywords: 'electric scooter rental india, EV scooter on rent, e-scooter rental india',
  },
  // Car model pages
  'static:creta-on-rent': {
    templateTitle: 'Creta on Rent India | Hyundai Creta Rental @₹1499/Day | TransRentals',
    templateDescription: 'Rent Hyundai Creta across India. Self-drive SUV rental. Premium comfort, great mileage. Best prices. Book now!',
    templateKeywords: 'creta on rent india, hyundai creta rental, creta hire india, self drive creta',
  },
  'static:fortuner-on-rent': {
    templateTitle: 'Fortuner on Rent India | Toyota Fortuner Rental | TransRentals',
    templateDescription: 'Rent Toyota Fortuner across India. Luxury SUV rental for trips & events. With or without driver. Book now!',
    templateKeywords: 'fortuner on rent india, toyota fortuner rental, fortuner hire india',
  },
  'static:innova-on-rent': {
    templateTitle: 'Innova on Rent India | Toyota Innova Crysta Rental | TransRentals',
    templateDescription: 'Rent Toyota Innova Crysta across India. Self-drive & chauffeur options. 7+1 seater. For family trips & weddings. Book now!',
    templateKeywords: 'innova on rent india, innova crysta rental, innova hire india, toyota innova',
  },
  'static:scorpio-on-rent': {
    templateTitle: 'Scorpio on Rent India | Mahindra Scorpio Rental | TransRentals',
    templateDescription: 'Rent Mahindra Scorpio across India. Self-drive & chauffeur options. Great for off-road & family trips. Book now!',
    templateKeywords: 'scorpio on rent india, mahindra scorpio rental, scorpio hire india',
  },
  'static:seltos-on-rent': {
    templateTitle: 'Seltos on Rent India | Kia Seltos Rental | TransRentals',
    templateDescription: 'Rent Kia Seltos across India. Self-drive SUV rental. Premium features, great mileage. Best prices. Book now!',
    templateKeywords: 'seltos on rent india, kia seltos rental, seltos hire india',
  },
  'static:swift-on-rent': {
    templateTitle: 'Swift on Rent India | Maruti Swift Rental @₹799/Day | TransRentals',
    templateDescription: 'Rent Maruti Swift across India. Self-drive hatchback rental. Best fuel efficiency, best prices. Book now!',
    templateKeywords: 'swift on rent india, maruti swift rental, swift hire india, swift self drive',
  },
  'static:xuv700-on-rent': {
    templateTitle: 'XUV700 on Rent India | Mahindra XUV700 Rental | TransRentals',
    templateDescription: 'Rent Mahindra XUV700 across India. Premium SUV with ADAS features. Self-drive & chauffeur options. Book now!',
    templateKeywords: 'XUV700 on rent india, mahindra XUV700 rental, XUV700 hire india',
  },
  'static:sports-car-rental': {
    templateTitle: 'Sports Car Rental India | Ferrari, Lamborghini | TransRentals',
    templateDescription: 'Rent sports cars across India. Ferrari, Lamborghini, Porsche, BMW M-series. For shoots, events & experiences. Book now!',
    templateKeywords: 'sports car rental india, ferrari rental india, lamborghini rental, supercar rental india',
  },
  'static:vintage-car-rental': {
    templateTitle: 'Vintage Car Rental India | Classic Cars for Weddings | TransRentals',
    templateDescription: 'Rent vintage and classic cars across India for weddings, shoots & events. Ambassador, Jeep & more. Book now!',
    templateKeywords: 'vintage car rental india, classic car rental india, antique car hire, old car rental',
  },
  // Self drive category pages
  'static:self-drive-hatchback-rental': {
    templateTitle: 'Self Drive Hatchback Rental India | @₹799/Day | TransRentals',
    templateDescription: 'Rent hatchback cars across India without driver. Swift, i20, WagonR, Alto available. Best rates. Book now!',
    templateKeywords: 'hatchback rental india, self drive hatchback india, swift on rent india, i20 rental',
  },
  'static:self-drive-sedan-rental': {
    templateTitle: 'Self Drive Sedan Rental India | @₹999/Day | TransRentals',
    templateDescription: 'Rent sedan cars across India without driver. Honda City, Hyundai Verna, Maruti Ciaz available. Book now!',
    templateKeywords: 'sedan rental india, self drive sedan india, honda city rental, sedan on rent india',
  },
  'static:self-drive-suv-rental': {
    templateTitle: 'Self Drive SUV Rental India | @₹1499/Day | TransRentals',
    templateDescription: 'Rent SUV cars across India without driver. Creta, Seltos, Fortuner, Innova available. Perfect for family trips. Book now!',
    templateKeywords: 'SUV rental india, self drive SUV india, creta rental india, fortuner rental india',
  },
  'static:one-way-car-rental': {
    templateTitle: 'One Way Car Rental India | No Return Charges | TransRentals',
    templateDescription: 'Book one way car rental across India. No return fare. Self-drive & chauffeur. Sedan, SUV options. Book now!',
    templateKeywords: 'one way car rental india, one way self drive, drop car rental india',
  },
  'static:outstation-car-rental': {
    templateTitle: 'Outstation Car Rental India | @₹12/Km | TransRentals',
    templateDescription: 'Outstation car rental across India. Self-drive & chauffeur options for intercity trips. Starting @₹12/km. Book now!',
    templateKeywords: 'outstation car rental india, intercity self drive, long distance car rental india',
  },
  // Equipment & heavy vehicle pages
  'static:crane-on-rent': {
    templateTitle: 'Crane on Rent India | Mobile Crane Hire | TransRentals',
    templateDescription: 'Rent cranes across India. Mobile cranes, tower cranes, pick & carry cranes. All capacities. With experienced operator. Book now!',
    templateKeywords: 'crane on rent india, crane rental india, mobile crane hire, crane operator india',
  },
  'static:excavator-on-rent': {
    templateTitle: 'Excavator on Rent India | JCB & Excavator Hire | TransRentals',
    templateDescription: 'Rent excavators and JCBs across India. PC200, PC300, mini excavators. With experienced operator. Book now!',
    templateKeywords: 'excavator on rent india, excavator rental india, JCB hire, earth mover india',
  },
  'static:generator-on-rent': {
    templateTitle: 'Generator on Rent India | 5KVA to 500KVA | TransRentals',
    templateDescription: 'Rent generators across India. Silent DG sets from 5KVA to 500KVA. For events, construction, power backup. Book now!',
    templateKeywords: 'generator on rent india, generator rental india, DG set rental, power backup india',
  },
  'static:hydra-on-rent': {
    templateTitle: 'Hydra Crane on Rent India | Pick & Carry Crane | TransRentals',
    templateDescription: 'Rent hydra cranes across India. 12T, 14T pick & carry cranes. With experienced operator. Book now!',
    templateKeywords: 'hydra crane on rent india, pick and carry crane, hydra rental india',
  },
  'static:jcb-on-rent': {
    templateTitle: 'JCB on Rent India | Backhoe Loader Hire | TransRentals',
    templateDescription: 'Rent JCB across India. JCB 3DX, 3CX, mini JCB available. With experienced operators. Book now!',
    templateKeywords: 'JCB on rent india, JCB rental india, backhoe loader hire, JCB hire india',
  },
  'static:mini-truck-rental': {
    templateTitle: 'Mini Truck Rental India | Tata Ace, Bolero Pickup | TransRentals',
    templateDescription: 'Rent mini trucks across India. Tata Ace, Bolero Pickup, Mahindra Jeeto. For goods transport, local delivery. Book now!',
    templateKeywords: 'mini truck rental india, tata ace rental, pickup truck india, small truck rental',
  },
};

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
