/**
 * Sub-location pages: hyper-local pages targeting long-tail keywords like
 * "bike rental in Connaught Place Delhi" or "car rental in Whitefield Bangalore".
 *
 * URL pattern: /{serviceSlug}/{citySlug}/{subLocationSlug}
 * Example: /bike-on-rent/delhi/connaught-place
 *
 * Competitors (GoWheelo, Rentrip) have 1,000+ such pages — this is our catch-up.
 */

export type SubLocation = {
  slug: string;
  name: string;
  type: 'area' | 'neighborhood' | 'beach' | 'market' | 'zone';
  description: string;
  pickupAddress?: string;
};

// serviceSlug → citySlug → SubLocation[]
export const CITY_SUBLOCATIONS: Record<string, Record<string, SubLocation[]>> = {

  'bike-on-rent': {
    delhi: [
      {
        slug: 'connaught-place',
        name: 'Connaught Place',
        type: 'area',
        description: "Delhi's commercial heart with wide tree-lined streets. Bikes are ideal for reaching Janpath, Barakhamba Road, and Rajiv Chowk metro. Most vendors deliver within 2 hours to CP offices.",
        pickupAddress: 'Near Connaught Place, New Delhi',
      },
      {
        slug: 'karol-bagh',
        name: 'Karol Bagh',
        type: 'market',
        description: "Delhi's largest electronics and clothing market. Narrow gali traffic makes bikes and scooters the preferred vehicle for daily shopping and commuting. Budget rentals available.",
        pickupAddress: 'Near Karol Bagh Metro Station, New Delhi',
      },
      {
        slug: 'lajpat-nagar',
        name: 'Lajpat Nagar',
        type: 'market',
        description: "South Delhi's biggest market area. Bikes are ideal for threading through Central Market lanes and accessing Lajpat Nagar 1–4 easily. Many hostel-staying tourists rent from here.",
        pickupAddress: 'Near Lajpat Nagar Metro Station, New Delhi',
      },
      {
        slug: 'dwarka',
        name: 'Dwarka',
        type: 'neighborhood',
        description: "South-West Delhi's planned colony with Sectors 1–23. Long distances between sectors make daily-commuter bikes popular. NH48 access from here for Gurugram outstation.",
        pickupAddress: 'Near Dwarka Sector 10 Metro Station, New Delhi',
      },
      {
        slug: 'paharganj',
        name: 'Paharganj',
        type: 'area',
        description: "Delhi's backpacker district near New Delhi Railway Station. Budget bike rentals perfect for monument hopping — Humayun's Tomb, Jama Masjid, and Qutub Minar all reachable by bike.",
        pickupAddress: 'Near New Delhi Railway Station, Paharganj',
      },
    ],

    goa: [
      {
        slug: 'calangute',
        name: 'Calangute',
        type: 'beach',
        description: "Goa's most popular beach and the de facto tourist hub. Over 50 bike rental shops on the Calangute-Baga stretch. Most competitive rates in Goa — starting ₹250/day in off-season.",
        pickupAddress: 'Near Calangute Beach, North Goa',
      },
      {
        slug: 'anjuna',
        name: 'Anjuna',
        type: 'beach',
        description: "Famous for the Wednesday Flea Market and electronic music scene. Bikes are essential for accessing the rocky beach, Ozran (Little Vagator), and the winding cliff-top roads to Vagator.",
        pickupAddress: 'Near Anjuna Beach, North Goa',
      },
      {
        slug: 'baga',
        name: 'Baga',
        type: 'beach',
        description: "Party beach famous for Tito's Lane and Britto's. Bikes let you circuit the Calangute-Baga-Anjuna stretch, or head north to Arambol for a quieter beach experience.",
        pickupAddress: 'Near Baga Beach, North Goa',
      },
      {
        slug: 'panjim',
        name: 'Panjim',
        type: 'area',
        description: "Goa's charming capital with Fontainhas Latin Quarter, Panaji Church, and the Mandovi ferry. Bikes are perfect for the flat city roads and exploring Old Goa churches 10 km away.",
        pickupAddress: 'Near Panaji Bus Stand, Panjim, Goa',
      },
      {
        slug: 'vagator',
        name: 'Vagator',
        type: 'beach',
        description: "Dramatic red-cliff beach and home to Chapora Fort (Dil Chahta Hai fame). Cliff-top roads between Vagator and Ozran require bikes — no car access to many viewpoints.",
        pickupAddress: 'Near Vagator Beach, North Goa',
      },
      {
        slug: 'colva',
        name: 'Colva',
        type: 'beach',
        description: "South Goa's most popular beach — quieter than North Goa. Bikes ideal for exploring Benaulim, Betalbatim, and the Margao–Colva stretch. Rates cheaper than North Goa.",
        pickupAddress: 'Near Colva Beach, South Goa',
      },
    ],

    mumbai: [
      {
        slug: 'bandra',
        name: 'Bandra',
        type: 'area',
        description: "Queen of the suburbs. Bikes are perfect for the Bandstand promenade, Carter Road seawall, and navigating the narrow lanes of Pali Hill. Easy ferry to Dharavi for Dharavi bike tours.",
        pickupAddress: 'Near Bandra Station (West), Mumbai',
      },
      {
        slug: 'andheri',
        name: 'Andheri',
        type: 'area',
        description: "Mumbai's busiest suburb and corporate hub. Andheri East (JB Nagar, MIDC) is the go-to pickup zone near CSIA Airport. Vendors cover both East and West sides of the station.",
        pickupAddress: 'Near Andheri Station, Mumbai',
      },
      {
        slug: 'juhu',
        name: 'Juhu',
        type: 'beach',
        description: "Mumbai's most famous beach. Bikes and scooters are perfect for the Juhu-Versova-Madh Island coastal loop — a classic Mumbai weekend ride with beachside chaat stops.",
        pickupAddress: 'Near Juhu Beach, Mumbai',
      },
    ],

    bangalore: [
      {
        slug: 'indiranagar',
        name: 'Indiranagar',
        type: 'area',
        description: "Bangalore's trendiest neighborhood on 100 Feet Road. Bikes ideal for Ulsoor Lake rides, Cubbon Park circuit, and CMH Road café-hopping. Best for city exploration rentals.",
        pickupAddress: 'Near Indiranagar Metro Station, Bangalore',
      },
      {
        slug: 'koramangala',
        name: 'Koramangala',
        type: 'area',
        description: "India's startup capital. Bikes and scooters are most popular for navigating the BDA Complex, Intermediate Ring Road, and the 80 Feet Road startup corridor.",
        pickupAddress: 'Near Koramangala 7th Block, Bangalore',
      },
      {
        slug: 'whitefield',
        name: 'Whitefield',
        type: 'zone',
        description: "Bangalore's IT hub spanning ITPL, Prestige Shantiniketan, and Varthur. Bikes reduce 45-min car commutes to 20-min for intra-Whitefield travel. Corporate daily rentals popular.",
        pickupAddress: 'Near Whitefield Main Road / ITPL Gate, Bangalore',
      },
    ],
    hyderabad: [
      { slug: 'banjara-hills', name: 'Banjara Hills', type: 'area', description: "Hyderabad's premium residential and nightlife zone. Royal Enfield and KTM bikes for Road No. 36 café culture explorations and Hussain Sagar Lake rides. Monthly commuter packages available.", pickupAddress: 'Near Banjara Hills Road No. 1, Hyderabad' },
      { slug: 'hitech-city', name: 'HiTEC City', type: 'zone', description: "Hyderabad's IT hub with 2-lakh daily workers. Daily commuter bikes (Honda Activa, TVS Jupiter) for Cyber Towers–Kondapur–Madhapur last-mile. Budget monthly rental plans from ₹3,000.", pickupAddress: 'Near HiTEC City Metro Station, Hyderabad' },
      { slug: 'secunderabad', name: 'Secunderabad', type: 'zone', description: "Classic twin city rides. Bikes for Hussain Sagar Lake rides, Trimulgherry army cantonment exploration, and weekend Ameenpur Lake nature rides. Royal Enfield and Bajaj available.", pickupAddress: 'Near Secunderabad Station Road, Hyderabad' },
    ],
    manali: [
      { slug: 'mall-road', name: 'Mall Road', type: 'area', description: "Manali's tourist epicentre with the highest bike rental concentration. Royal Enfield Himalayan (350cc/450cc) and Bullet 500 for Rohtang Pass, Spiti Valley, and Ladakh. Helmets and gear included.", pickupAddress: 'Near Mall Road, Manali, Himachal Pradesh' },
      { slug: 'old-manali', name: 'Old Manali', type: 'neighborhood', description: "Backpacker paradise with budget Royal Enfield rentals. Ideal for Kasol–Kheerganga treks by bike, Parvati Valley rides, and early morning Rohtang sunrise runs. Café deposit accepted.", pickupAddress: 'Near Old Manali Bridge, Manali, Himachal Pradesh' },
      { slug: 'solang-valley', name: 'Solang Valley', type: 'area', description: "Adventure sport zone 14 km from Manali. Bikes for Beas Kund trek access, Atal Tunnel entry to Lahaul, and adventure camp commuting. RE Bullet 500 and Himalayan preferred.", pickupAddress: 'Near Solang Valley Ropeway, Manali, Himachal Pradesh' },
    ],
    pune: [
      { slug: 'koregaon-park', name: 'Koregaon Park', type: 'neighborhood', description: "Pune's café and nightlife district. Bikes for Osho Ashram visits, AGA Khan Palace rides, and daily commuting in Kalyani Nagar–Viman Nagar corridor. Honda CB300R and Duke 200 popular.", pickupAddress: 'Near Koregaon Park Lane 7, Pune' },
      { slug: 'shivajinagar', name: 'Shivajinagar', type: 'area', description: "Pune's central point for outstation bike trips. Royal Enfield for Mahabaleshwar, Lonavala, and Bhimashankar rides. Student-friendly daily rates from ₹400. Helmet and jacket included.", pickupAddress: 'Near FC Road, Shivajinagar, Pune' },
      { slug: 'hinjewadi', name: 'Hinjewadi', type: 'zone', description: "IT park daily commuter zone. Budget bikes (Activa, Jupiter, Dio) for Hinjewadi Phase 1–3 campus-to-campus rides. Monthly rental plans saving 30% vs daily rates. Doorstep delivery to IT campus.", pickupAddress: 'Near Hinjewadi IT Park Gate 1, Pune' },
    ],
    surat: [
      { slug: 'ring-road', name: 'Ring Road', type: 'area', description: "Surat's commercial backbone. Bikes for Diamond Bourse visits, Textile Market runs, and Surat Municipal Corporation office commutes. Honda Activa and TVS Jupiter most popular. Daily rates from ₹250.", pickupAddress: 'Near Surat Ring Road / Adajan Char Rasta, Surat' },
      { slug: 'adajan', name: 'Adajan', type: 'neighborhood', description: "Surat's upscale western suburb with excellent road infrastructure. Bikes for Dumas Beach rides (12 km), DREAM City construction zone commute, and Ghod Dod Road café culture. Budget daily rates from ₹300.", pickupAddress: 'Near Adajan Patiya, Surat' },
      { slug: 'vesu', name: 'Vesu', type: 'neighborhood', description: "Surat's IT and residential growth corridor. Daily commuter bikes for VR Mall visits and Palanpur Patia IT offices. Student-friendly monthly plans from ₹2,500. Honda Dio and TVS Ntorq.", pickupAddress: 'Near Vesu VR Mall, Surat' },
    ],
    lucknow: [
      { slug: 'hazratganj', name: 'Hazratganj', type: 'area', description: "Lucknow's historic commercial heart. Bikes for Bara Imambara, British Residency, and Rumi Darwaza monument trail. Daily heritage rides and Aminabad bazaar commutes. Honda CB Shine and Splendor.", pickupAddress: 'Near Hazratganj Market, Lucknow' },
      { slug: 'gomti-nagar', name: 'Gomti Nagar', type: 'neighborhood', description: "Lucknow's modern IT and residential township. Daily commuter bikes for Vibhuti Khand tech offices and UP IT City. Riverside Gomti promenade evening rides. Daily ₹300, weekly ₹1,500.", pickupAddress: 'Near Vibhuti Khand, Gomti Nagar, Lucknow' },
      { slug: 'alambagh', name: 'Alambagh', type: 'area', description: "Lucknow's south hub near Charbagh Railway Station. Bikes for airport transfers (12 km to Amausi), Alambagh bus station access, and Sushant Golf City commute. Budget scooters from ₹280/day.", pickupAddress: 'Near Alambagh Bus Stand, Lucknow' },
    ],
    nagpur: [
      { slug: 'sitabuldi', name: 'Sitabuldi', type: 'area', description: "Nagpur's commercial nerve center at the geographic heart of India. Bikes for Zero Mile monument rides, Central Avenue market runs, and Futala Lake evening rides. All bikes including RE Bullet.", pickupAddress: 'Near Sitabuldi Main Market, Nagpur' },
      { slug: 'wardha-road', name: 'Wardha Road', type: 'zone', description: "Nagpur's IT and airport corridor. Bikes for MIHAN aerocity commute, Nagpur Airport transfers (15 km), and AIIMS Nagpur area. Corporate daily rentals for Wardha Road IT park employees.", pickupAddress: 'Near Wardha Road IT Park, Nagpur' },
      { slug: 'dharampeth', name: 'Dharampeth', type: 'neighborhood', description: "Nagpur's upscale residential and educational hub. Bikes for Ambazari Lake rides, Nagpur University campus commute, and Seminary Hills nature trail access. Duke 200 and Pulsar popular.", pickupAddress: 'Near Dharampeth Main Road, Nagpur' },
    ],
    visakhapatnam: [
      { slug: 'rk-beach', name: 'RK Beach', type: 'beach', description: "Vizag's iconic 3-km beach promenade on the Bay of Bengal. Bikes for Rushikonda Beach rides (12 km), Kailasagiri Hill Park, and Borra Caves day trip start. RE Himalayan and Bullet 350 available.", pickupAddress: 'Near RK Beach Road, Visakhapatnam' },
      { slug: 'mvp-colony', name: 'MVP Colony', type: 'neighborhood', description: "Vizag's most sought-after residential area near the beach. Daily commuter bikes for AU campus, GITAM University, and Steel Plant Zone. Weekend Araku Valley and Borra Caves rides from here.", pickupAddress: 'Near MVP Colony Main Road, Visakhapatnam' },
      { slug: 'gajuwaka', name: 'Gajuwaka', type: 'zone', description: "Vizag's industrial south zone with RINL Steel Plant and HPCL. Bikes for shift-change commutes and BHPV industrial area access. Budget Activa and Splendor on daily hire from ₹250.", pickupAddress: 'Near Gajuwaka Junction, Visakhapatnam' },
    ],
  },

  'car-rental': {
    delhi: [
      {
        slug: 'connaught-place',
        name: 'Connaught Place',
        type: 'area',
        description: "Delhi's geographic center. Car rental from CP gives the shortest average distance to any Delhi landmark. Best for day-hire covering all major monuments on a single itinerary.",
        pickupAddress: 'Near Connaught Place, New Delhi',
      },
      {
        slug: 'aerocity',
        name: 'Aerocity',
        type: 'zone',
        description: "IGI Airport's hospitality district. The closest car rental zone to all airport terminals. Self-drive cars available with airport pickup; chauffeur-driven 24/7 available.",
        pickupAddress: 'Near IGI Aerocity Metro Station, New Delhi',
      },
      {
        slug: 'gurugram',
        name: 'Gurugram',
        type: 'zone',
        description: "Delhi NCR's IT and financial corridor. Cyber City, DLF Phase 1–5, and Golf Course Road are key pickup zones. NH48 access makes this ideal for Jaipur and Manesar outstation.",
        pickupAddress: 'Near DLF Cyber City, Gurugram',
      },
      {
        slug: 'noida',
        name: 'Noida',
        type: 'zone',
        description: "UP's IT satellite city. Sector 18, 62, and 63 are the main rental hubs. Yamuna Expressway access for Agra day trips starts here — 230 km, 2.5 hrs.",
        pickupAddress: 'Near Noida Sector 18 Metro Station, Noida',
      },
    ],

    mumbai: [
      {
        slug: 'andheri',
        name: 'Andheri',
        type: 'area',
        description: "Mumbai's rental hub closest to CSIA Airport. Both self-drive and chauffeur options. Best for Pune Expressway trips, Lonavala day visits, and airport transfer packages.",
        pickupAddress: 'Near Andheri Station (East/West), Mumbai',
      },
      {
        slug: 'bandra',
        name: 'Bandra',
        type: 'area',
        description: "Bandra West and BKC are premium rental zones. Doorstep delivery to BKC corporate offices. Bandra-Worli Sea Link access for quick South Mumbai trips.",
        pickupAddress: 'Near Bandra West / BKC, Mumbai',
      },
      {
        slug: 'thane',
        name: 'Thane',
        type: 'area',
        description: "Eastern gateway to Mumbai. Car rentals from Thane are positioned perfectly for NH48 Pune Expressway, NH160 Nashik, and Eastern Freeway to South Mumbai.",
        pickupAddress: 'Near Thane Station, Thane',
      },
      {
        slug: 'navi-mumbai',
        name: 'Navi Mumbai',
        type: 'zone',
        description: "Planned satellite city with Vashi, Belapur, and Kharghar zones. Good vendor coverage. Starting point for Alibaug (45 km via Nhava) and Pune via Sion-Panvel Highway.",
        pickupAddress: 'Near Vashi / Belapur, Navi Mumbai',
      },
    ],

    bangalore: [
      {
        slug: 'whitefield',
        name: 'Whitefield',
        type: 'zone',
        description: "Bangalore's largest IT hub. Cars essential for airport transfers (25 km to KIAL), Nandi Hills sunrise trips (60 km), and Mysore weekend getaways (145 km).",
        pickupAddress: 'Near Whitefield / ITPL Gate, Bangalore',
      },
      {
        slug: 'koramangala',
        name: 'Koramangala',
        type: 'area',
        description: "Startup capital of India. Self-drive cars popular for Coorg, Ooty, and Pondicherry weekend trips. Dense vendor network with both budget and premium options.",
        pickupAddress: 'Near Koramangala 6th Block, Bangalore',
      },
      {
        slug: 'electronic-city',
        name: 'Electronic City',
        type: 'zone',
        description: "Home to Infosys, Wipro, and Siemens campuses. Budget car rentals popular for NH44 Chennai outstation (350 km). Close to Hosur, Tamil Nadu for cross-border trips.",
        pickupAddress: 'Near Electronic City Phase 1, Bangalore',
      },
      {
        slug: 'indiranagar',
        name: 'Indiranagar',
        type: 'area',
        description: "Premium Bangalore neighborhood. Self-drive cars and chauffeur services for Mysore day trips, Kabini Wildlife Sanctuary, and Chikkamagaluru coffee estate weekends.",
        pickupAddress: 'Near Indiranagar 100 Feet Road, Bangalore',
      },
    ],

    goa: [
      {
        slug: 'calangute',
        name: 'Calangute',
        type: 'beach',
        description: "Car rentals from Calangute are ideal for exploring all of North Goa — Old Goa churches, Anjuna market, Fort Aguada, and Mapusa market. Self-drive hatchbacks most popular.",
        pickupAddress: 'Near Calangute Market, North Goa',
      },
      {
        slug: 'panjim',
        name: 'Panjim',
        type: 'area',
        description: "Best base for exploring the whole state. From Panaji you can reach both North Goa beaches (30 min) and South Goa (45 min). 7-day self-drive packages start from ₹5,999.",
        pickupAddress: 'Near Panaji, Panjim, Goa',
      },
      {
        slug: 'margao',
        name: 'Margao',
        type: 'area',
        description: "South Goa's largest city. Car rental from Margao lets you cover Colva, Benaulim, Cavelossim, and Palolem without doubling back. Also close to Dudhsagar Falls entry.",
        pickupAddress: 'Near Margao Station, South Goa',
      },
    ],
    hyderabad: [
      { slug: 'hitech-city', name: 'HiTEC City', type: 'zone', description: "Hyderabad's Silicon Valley with Fortune 500 HQs. Self-drive cars for IKEA, Jubilee Hills, and RGIA airport runs. Monthly subscriptions popular for IT professionals. Swift Dzire and Innova Crysta.", pickupAddress: 'Near HiTEC City Cyber Towers, Hyderabad' },
      { slug: 'secunderabad', name: 'Secunderabad', type: 'zone', description: "Hyderabad's railway and cantonment hub. Self-drive for Bhongir Fort, Warangal day trips, and Nagarjuna Sagar weekend drives. Well-maintained fleet for cantonment area access.", pickupAddress: 'Near Secunderabad Railway Station, Secunderabad' },
      { slug: 'banjara-hills', name: 'Banjara Hills', type: 'area', description: "Hyderabad's upscale suburb for premium car rentals. BMW, Audi, and Innova Crysta for Ramoji Film City visits, Osman Sagar Lake drives, and wedding chauffeur services.", pickupAddress: 'Near Banjara Hills Road No. 12, Hyderabad' },
    ],
    chennai: [
      { slug: 'anna-nagar', name: 'Anna Nagar', type: 'area', description: "North Chennai's car rental hub for family trips to Mahabalipuram, Pondicherry, and Tirupati. Innova Crysta, Tempo Traveller, and budget hatchbacks. Monthly self-drive plans from ₹12,000.", pickupAddress: 'Near Anna Nagar East Metro Station, Chennai' },
      { slug: 'omr', name: 'OMR / Sholinganallur', type: 'zone', description: "IT corridor daily commuter car rental zone. Self-drive for Velachery, Perungudi, and Thoraipakkam IT parks. Monthly subscriptions for software professionals. Fuel-efficient vehicles.", pickupAddress: 'Near Sholinganallur Signal, OMR, Chennai' },
      { slug: 'nungambakkam', name: 'Nungambakkam', type: 'area', description: "Chennai's premium car rental neighborhood. Business-class vehicles for consulate visits, IIT Madras conferences, and Egmore–Central station transfers. Outstation to Bangalore and Tirupati.", pickupAddress: 'Near Nungambakkam High Road, Chennai' },
    ],
    pune: [
      { slug: 'koregaon-park', name: 'Koregaon Park', type: 'neighborhood', description: "Pune's most upscale neighborhood. Self-drive for Lonavala, Mahabaleshwar, and Nashik weekend trips. Premium sedans for Osho International guests and MG Road executive commute.", pickupAddress: 'Near Koregaon Park Main Road, Pune' },
      { slug: 'hinjewadi', name: 'Hinjewadi', type: 'zone', description: "IT park corridor's busiest car rental zone. Daily and weekly self-drive for Baner–Balewadi commute. Airport transfers to Pune airport (20 km). Monthly plans for long-term residents.", pickupAddress: 'Near Hinjewadi Rajiv Gandhi IT Park, Pune' },
      { slug: 'baner', name: 'Baner', type: 'neighborhood', description: "Pune's Western ring road residential belt. Weekend Konkan, Goa, and Mumbai highway trips. Sedan and SUV hire for Baner–Shivane shopping strip. One-way to Chennai and Mumbai available.", pickupAddress: 'Near Baner Road, Sus Phata, Pune' },
    ],
    surat: [
      { slug: 'ring-road', name: 'Ring Road', type: 'area', description: "Surat's commercial artery. Self-drive cars for Diamond Bourse visits, Surat Textile Market runs, and weekend Daman (90 km) or Mumbai (280 km) highway trips. Innova Crysta and Swift DZire.", pickupAddress: 'Near Surat Ring Road / Adajan Char Rasta, Surat' },
      { slug: 'hazira', name: 'Hazira', type: 'zone', description: "Surat's industrial port suburb with ONGC, Shell, and L&T Hydrocarbon campuses. Car rentals for executive transfers, Hazira Ferry to Ghogha, and outstation to Vadodara (100 km). 24/7 availability.", pickupAddress: 'Near Hazira Ferry Terminal / Industrial Zone, Surat' },
      { slug: 'adajan', name: 'Adajan', type: 'neighborhood', description: "Surat's upscale western suburb. Self-drive cars for DREAM City and VR Surat mall commute. Outstation to Ahmedabad (260 km, 4.5 hrs). Monthly subscriptions popular for corporate residents.", pickupAddress: 'Near Adajan Patiya, Surat' },
    ],
    lucknow: [
      { slug: 'hazratganj', name: 'Hazratganj', type: 'area', description: "Lucknow's cultural hub. Self-drive cars for Agra day trips (330 km, 4.5 hrs via Yamuna Expressway), Ayodhya pilgrimage (135 km), and daily city sightseeing. Innova Crysta and Swift DZire.", pickupAddress: 'Near Hazratganj Market, Lucknow' },
      { slug: 'gomti-nagar', name: 'Gomti Nagar', type: 'neighborhood', description: "Lucknow's modern IT township. Car rentals for Amausi Airport transfers (12 km), Varanasi weekend drives (320 km), and UP IT City office commutes. Corporate monthly plans available.", pickupAddress: 'Near Vibhuti Khand, Gomti Nagar, Lucknow' },
      { slug: 'amausi', name: 'Amausi Airport', type: 'zone', description: "Chaudhary Charan Singh International Airport zone. 24/7 car rental for airport pickups and drops. Agra, Varanasi, Kanpur, and Ayodhya outstation packages. AC fleet with GPS tracking.", pickupAddress: 'Near Lucknow Airport, Amausi, Lucknow' },
    ],
    nagpur: [
      { slug: 'wardha-road', name: 'Wardha Road', type: 'zone', description: "Nagpur's airport and IT corridor. Self-drive cars for MIHAN aerocity, Dr. Babasaheb Ambedkar Airport transfers, and Mumbai–Nagpur Samruddhi Expressway highway trips. 24/7 availability.", pickupAddress: 'Near Wardha Road / MIHAN, Nagpur' },
      { slug: 'sitabuldi', name: 'Sitabuldi', type: 'area', description: "Nagpur's central pickup zone at Zero Mile — India's geographic center. Cars for Tadoba Tiger Reserve (140 km), Pench National Park (80 km), and Kanha National Park (180 km) wildlife trips.", pickupAddress: 'Near Sitabuldi Fort / Zero Mile, Nagpur' },
      { slug: 'dharampeth', name: 'Dharampeth', type: 'neighborhood', description: "Nagpur's most upscale neighborhood. Premium car rentals for medical tourism (AIIMS, Orange City Hospital), corporate guests at Le Meridien, and Gondia–Chandrapur regional trips.", pickupAddress: 'Near Dharampeth Extension, Nagpur' },
    ],
    visakhapatnam: [
      { slug: 'rk-beach', name: 'RK Beach', type: 'beach', description: "Vizag's seaside center. Self-drive cars for Araku Valley (120 km via Ghat Road), Borra Caves (90 km), and Lambasingi hill station (130 km). Innova Crysta for ghats and SUVs for Araku recommended.", pickupAddress: 'Near RK Beach Road, Visakhapatnam' },
      { slug: 'gajuwaka', name: 'Gajuwaka', type: 'zone', description: "Vizag's southern industrial hub near RINL and HPCL. Cars for Vizag Airport transfers (12 km), Bheemili Beach day trips (25 km), and executive transfers within SEZ and export promotion zone.", pickupAddress: 'Near Gajuwaka Industrial Area, Visakhapatnam' },
      { slug: 'mvp-colony', name: 'MVP Colony', type: 'neighborhood', description: "Vizag's most popular residential area. Premium sedans for Visakhapatnam–Vijayawada corporate routes (350 km), Vizag Airport transfers, and wedding chauffeur services within the city.", pickupAddress: 'Near MVP Colony Main Road, Visakhapatnam' },
    ],
  },

  'bus-rental': {
    delhi: [
      { slug: 'connaught-place', name: 'Connaught Place', type: 'area', description: "Delhi's geographic center, ideal for corporate group pickups. Buses available for airport transfers (40 min to IGI), Agra day trips, and wedding baraat across NCR. 24-hour advance booking recommended.", pickupAddress: 'Near Connaught Place, New Delhi' },
      { slug: 'dwarka', name: 'Dwarka', type: 'neighborhood', description: "Southwest Delhi's largest residential township. Buses popular for Dwarka–Jaipur pilgrimages, school picnics to Sultanpur Bird Sanctuary, and corporate shuttles to Cyber City Gurugram (20 km).", pickupAddress: 'Near Dwarka Sector 10 Metro, New Delhi' },
      { slug: 'noida', name: 'Noida', type: 'zone', description: "UP's IT corridor. Mini buses for Noida–Agra Expressway trips, corporate team outings, and wedding guest transport across NCR. Yamuna Expressway access cuts Agra travel to 2.5 hrs.", pickupAddress: 'Near Noida Sector 18 Metro, Noida' },
      { slug: 'rohini', name: 'Rohini', type: 'neighborhood', description: "North-West Delhi's largest township. Tempo Travellers for Mathura–Vrindavan pilgrimages, Haridwar group tours, and Rohini–Gurugram corporate shuttles. Budget AC options available.", pickupAddress: 'Near Rohini West Metro Station, New Delhi' },
      { slug: 'lajpat-nagar', name: 'Lajpat Nagar', type: 'market', description: "South Delhi hub for school excursions, corporate events, and market tours. Mini buses for 20–35 people ideal for Lajpat Nagar to NCR office routes. Weekend pilgrimage packages to Mathura.", pickupAddress: 'Near Lajpat Nagar Metro Station, New Delhi' },
    ],
    bangalore: [
      { slug: 'whitefield', name: 'Whitefield', type: 'zone', description: "Bangalore's largest IT corridor. Corporate shuttle buses between Whitefield and Electronic City (18 km) reduce 90-min commutes. Nandi Hills sunrise group trips (60 km) depart from ITPL Gate.", pickupAddress: 'Near Whitefield / ITPL Gate, Bangalore' },
      { slug: 'koramangala', name: 'Koramangala', type: 'area', description: "Startup hub with highest bus rental demand for team outings. Mysore day trips (145 km, 3 hrs), Coorg weekend getaways (260 km), and Kabini wildlife safaris booked from Koramangala.", pickupAddress: 'Near Koramangala 7th Block, Bangalore' },
      { slug: 'electronic-city', name: 'Electronic City', type: 'zone', description: "Infosys and Wipro campus corridor. Daily AC shuttle buses to Koramangala and MG Road. Weekend group tours to Ooty (280 km) and Pondicherry (310 km) depart from here.", pickupAddress: 'Near Electronic City Phase 1, Bangalore' },
      { slug: 'indiranagar', name: 'Indiranagar', type: 'area', description: "Premium Bangalore neighborhood with high demand for party buses and event transport. 100 Feet Road pickup point for pub crawls, corporate dinners, and airport group transfers.", pickupAddress: 'Near Indiranagar 100 Feet Road, Bangalore' },
    ],
    mumbai: [
      { slug: 'andheri', name: 'Andheri', type: 'area', description: "Mumbai's rental hub near CSIA Airport. Buses for airport group transfers, Pune Expressway corporate outings (150 km), and Lonavala picnics. East and West pickup points available.", pickupAddress: 'Near Andheri Station (East/West), Mumbai' },
      { slug: 'bandra', name: 'Bandra', type: 'area', description: "Premium bus rentals from BKC and Bandra West. Corporate event transport, wedding guest buses, and Mumbai–Goa overnight coaches departing from Bandra station.", pickupAddress: 'Near Bandra Station / BKC, Mumbai' },
      { slug: 'thane', name: 'Thane', type: 'area', description: "Eastern gateway to Mumbai. Buses for Thane–Nashik pilgrimages (160 km), Igatpuri group tours, and NH48 Pune corporate trips. Budget options 20% cheaper than South Mumbai.", pickupAddress: 'Near Thane Station, Thane' },
    ],
    hyderabad: [
      { slug: 'hitech-city', name: 'HiTech City', type: 'zone', description: "Hyderabad's IT hub spanning Madhapur, Kondapur, and Gachibowli. Corporate shuttle buses for TCS, Infosys, and IKEA employees. Srisailam pilgrimage trips (215 km) booked from here.", pickupAddress: 'Near HiTech City Metro, Hyderabad' },
      { slug: 'secunderabad', name: 'Secunderabad', type: 'area', description: "Hyderabad's twin city with 4 railway stations. Bus rentals for Tirupati group pilgrimages (550 km), Shirdi tours (585 km), and Warangal day trips (145 km).", pickupAddress: 'Near Secunderabad Railway Station, Hyderabad' },
      { slug: 'kukatpally', name: 'Kukatpally', type: 'neighborhood', description: "North-West Hyderabad's largest residential area. Buses for school picnics, wedding baraat (baraat buses from ₹8,000), and KPHB–Shamshabad airport group transfers.", pickupAddress: 'Near Kukatpally Metro Station, Hyderabad' },
    ],
    chennai: [
      { slug: 'omr', name: 'OMR / Sholinganallur', type: 'zone', description: "Chennai's IT corridor with the highest corporate bus demand. Employee shuttle buses for Tidel Park, Elcot SEZ, and Cognizant tech park. Daily and monthly charter contracts. AC Volvo buses.", pickupAddress: 'Near Sholinganallur Junction, OMR, Chennai' },
      { slug: 'anna-nagar', name: 'Anna Nagar', type: 'area', description: "North-west Chennai's dense residential hub. School bus rentals, wedding procession buses, and family outstation trips to Tirupati and Mahabalipuram. AC Volvo and mini-bus available.", pickupAddress: 'Near Anna Nagar Tower, Chennai' },
      { slug: 't-nagar', name: 'T. Nagar', type: 'market', description: "Chennai's busiest commercial district. Retail worker commute buses, pilgrimage charters to Tirupati and Shirdi, and corporate team outings. 32 and 49-seater AC buses available.", pickupAddress: 'Near Pondy Bazaar, T. Nagar, Chennai' },
    ],
    pune: [
      { slug: 'hinjewadi', name: 'Hinjewadi', type: 'zone', description: "Pune's largest IT park with 4 lakh daily commuters. Corporate shuttle buses for Infosys BPO, Wipro, and TCS. Daily and monthly charter contracts. AC Volvo and semi-sleeper options.", pickupAddress: 'Near Hinjewadi IT Park Phase 1, Pune' },
      { slug: 'kothrud', name: 'Kothrud', type: 'neighborhood', description: "Pune's most populated suburb. School buses, college trip charters to Mahabaleshwar and Lonavala, and Ganpati festival transport. Budget and AC options. 12, 26, and 49-seater.", pickupAddress: 'Near Kothrud Bus Depot, Pune' },
      { slug: 'shivajinagar', name: 'Shivajinagar', type: 'area', description: "Pune's central transport hub. Intercity buses to Nashik, Shirdi, and Mumbai. Corporate event transport for FICCI and CII Pune events. 32–49 seater Volvo and non-AC buses.", pickupAddress: 'Near Shivajinagar Bus Stand, Pune' },
    ],
    kolkata: [
      { slug: 'salt-lake-city', name: 'Salt Lake City', type: 'zone', description: "Kolkata's planned IT and administrative township. Corporate shuttles for IT firms in Sector V. Government employee transport and Durga Puja pandal-hopping special buses.", pickupAddress: 'Near Salt Lake Sector V IT Hub, Kolkata' },
      { slug: 'park-street', name: 'Park Street', type: 'area', description: "Kolkata's entertainment zone. New Year's Eve and Christmas event buses, corporate team outings to Sundarbans, and heritage city tour coaches. 12–26 seater mini-bus available.", pickupAddress: 'Near Park Street Metro Station, Kolkata' },
      { slug: 'howrah', name: 'Howrah', type: 'zone', description: "Gateway to Kolkata. Railway station transfer buses for large groups, industrial zone employee transport to Liluah and Shalimar, and intercity buses to Durgapur and Asansol.", pickupAddress: 'Near Howrah Railway Station, Howrah' },
    ],
    lucknow: [
      { slug: 'hazratganj', name: 'Hazratganj', type: 'area', description: "Lucknow's central pickup zone for group tours. Bus rentals for Ayodhya pilgrimage trips (135 km), Nainital mountain getaways (350 km), and corporate team outings. 20–49 seater AC buses.", pickupAddress: 'Near Hazratganj Market, Lucknow' },
      { slug: 'gomti-nagar', name: 'Gomti Nagar', type: 'neighborhood', description: "Corporate shuttle bus hub. Employee transport for UP IT City and Vibhuti Khand tech offices. Varanasi pilgrimage group buses (320 km). Navratri and Eid festival group transport.", pickupAddress: 'Near Vibhuti Khand, Gomti Nagar, Lucknow' },
      { slug: 'alambagh', name: 'Alambagh', type: 'area', description: "Lucknow's transport hub near Charbagh Station. Intercity buses to Agra, Varanasi, and Gorakhpur. School picnic buses to Dudhwa National Park and Lucknow Zoo. Budget and AC options.", pickupAddress: 'Near Alambagh Bus Terminus, Lucknow' },
    ],
    visakhapatnam: [
      { slug: 'rk-beach', name: 'RK Beach', type: 'beach', description: "Vizag's coastal travel hub. Bus rentals for Borra Caves group trips (90 km), Araku Valley tours (120 km), and Tirupati pilgrimages (660 km). Tempo Travellers and 49-seater coaches.", pickupAddress: 'Near RK Beach Road, Visakhapatnam' },
      { slug: 'gajuwaka', name: 'Gajuwaka', type: 'zone', description: "Industrial zone employee transport. RINL Steel Plant, HPCL, and NTPC employee shuttle buses. Bus charters for Hyderabad corporate trips (620 km) and seasonal coastal excursions.", pickupAddress: 'Near Gajuwaka Junction, Visakhapatnam' },
      { slug: 'rushikonda', name: 'Rushikonda', type: 'beach', description: "Vizag's water sports and IT corridor. Buses for GITAM University, Andhra University, and AU College campus group trips. Rushikonda–Bheemunipatnam coastal route excursions.", pickupAddress: 'Near Rushikonda Beach, Visakhapatnam' },
    ],
  },

  'packers-and-movers': {
    delhi: [
      { slug: 'gurgaon', name: 'Gurgaon', type: 'zone', description: "Delhi NCR's corporate hub. Office relocations in DLF Cyber City, Sohna Road, and Golf Course Road are the most common moves. Average 2BHK local shift ₹6,000–₹10,000. IBA-approved movers available.", pickupAddress: 'Near DLF Cyber City, Gurgaon' },
      { slug: 'noida', name: 'Noida', type: 'zone', description: "UP's IT satellite city. Intercity moves from Noida to Bangalore, Pune, and Hyderabad for IT professionals. Sectors 62, 63, and 137 are highest-demand zones. Transit time to South India: 2–4 days.", pickupAddress: 'Near Noida Sector 62, Noida' },
      { slug: 'dwarka', name: 'Dwarka', type: 'neighborhood', description: "Delhi's largest planned township. Within-Dwarka sector-to-sector moves (₹4,000–₹7,000) are common. DDA flat relocation and society gate NOC coordination handled by our movers.", pickupAddress: 'Near Dwarka Sector 10, New Delhi' },
      { slug: 'rohini', name: 'Rohini', type: 'neighborhood', description: "North Delhi's biggest township with frequent inter-sector moves. 1BHK local shifts start from ₹3,500. Cross-city to Noida and Gurgaon starts from ₹6,000. Weekend bookings available.", pickupAddress: 'Near Rohini West Metro Station, New Delhi' },
    ],
    bangalore: [
      { slug: 'whitefield', name: 'Whitefield', type: 'zone', description: "Bangalore's most active relocation zone with 2–3 moves per day. IT professional moves from Whitefield to Koramangala, Indiranagar, and HSR Layout. Local shift ₹5,000–₹9,000.", pickupAddress: 'Near Whitefield / ITPL Gate, Bangalore' },
      { slug: 'koramangala', name: 'Koramangala', type: 'area', description: "High-density startup housing zone. Furnished flat moves, sofa disassembly, and AC relocation popular. Koramangala to Electronic City ₹5,500–₹8,000. Intercity to Hyderabad from ₹12,000.", pickupAddress: 'Near Koramangala 6th Block, Bangalore' },
      { slug: 'hsr-layout', name: 'HSR Layout', type: 'neighborhood', description: "South Bangalore's fastest-growing residential area. High demand for villa and 3BHK moves. All HSR sectors covered. HSR Layout to Whitefield ₹5,000–₹7,000. Modular kitchen packing specialized.", pickupAddress: 'Near HSR Layout Sector 1, Bangalore' },
      { slug: 'electronic-city', name: 'Electronic City', type: 'zone', description: "Corporate campus area with frequent move-in/out cycles. Budget movers and premium movers both available. Electronic City to Mysore Road ₹4,500–₹7,500. Express same-day shifting available.", pickupAddress: 'Near Electronic City Phase 1, Bangalore' },
    ],
    hyderabad: [
      { slug: 'gachibowli', name: 'Gachibowli', type: 'zone', description: "Hyderabad's financial district with highest relocation volume in the city. Moves from Gachibowli to Kondapur, HITEC City, and Madhapur. Local 2BHK shift ₹6,000–₹10,000. Same-day service available.", pickupAddress: 'Near Gachibowli Stadium, Hyderabad' },
      { slug: 'kukatpally', name: 'Kukatpally', type: 'neighborhood', description: "North-West Hyderabad's busiest housing area. KPHB colony and Kukatpally Housing Board flats are frequent move origins. Budget local shift ₹3,500–₹6,000. Vehicle transport to Bangalore from ₹8,000.", pickupAddress: 'Near Kukatpally Metro Station, Hyderabad' },
      { slug: 'kondapur', name: 'Kondapur', type: 'area', description: "IT corridor with 24/7 packers available for move-out by lease end. Kondapur to Gachibowli (₹4,500), Banjara Hills (₹5,000), and intercity to Chennai (₹14,000–₹20,000).", pickupAddress: 'Near Kondapur Main Road, Hyderabad' },
      { slug: 'banjara-hills', name: 'Banjara Hills', type: 'area', description: "Premium Hyderabad residential zone. Villa and 4BHK moves with antique furniture packing. Banjara Hills to Jubilee Hills ₹5,000. Intercity luxury move to Mumbai from ₹25,000.", pickupAddress: 'Near Road No. 12, Banjara Hills, Hyderabad' },
    ],
    mumbai: [
      { slug: 'andheri', name: 'Andheri', type: 'area', description: "Mumbai's most active relocation zone. 1BHK Andheri East to West ₹4,000–₹6,000. High-rise society moves with lift booking and building NOC support. Airport nearby for intercity freight.", pickupAddress: 'Near Andheri Station, Mumbai' },
      { slug: 'thane', name: 'Thane', type: 'area', description: "Eastern Mumbai's growing residential hub. Thane to Navi Mumbai shift ₹5,000–₹8,000. Pune intercity move ₹12,000–₹18,000. Weekend shifts available with 48-hour advance booking.", pickupAddress: 'Near Thane Station, Thane' },
      { slug: 'navi-mumbai', name: 'Navi Mumbai', type: 'zone', description: "Planned satellite city with Vashi, Belapur, and Kharghar. Navi Mumbai to Andheri ₹6,000–₹10,000. Growing demand for Navi Mumbai to Pune (₹11,000–₹16,000) moves.", pickupAddress: 'Near Vashi Station, Navi Mumbai' },
    ],
    chennai: [
      { slug: 'velachery', name: 'Velachery', type: 'area', description: "South Chennai's densest residential belt. Apartment shifting in Phoenix Marketcity towers, OMR and ECR relocation support. IBA-approved packing materials and transit insurance.", pickupAddress: 'Near Velachery Bypass Road, Chennai' },
      { slug: 'anna-nagar', name: 'Anna Nagar', type: 'area', description: "Premium Chennai residential zone. Full-service home shifting for 2BHK/3BHK apartments. Intercity moves to Bangalore and Hyderabad. Wooden crating for furniture and ACs.", pickupAddress: 'Near Anna Nagar East, Chennai' },
      { slug: 'omr', name: 'OMR / Sholinganallur', type: 'zone', description: "IT professional relocation hub. Regular Bangalore–Chennai corridor moves. Office relocation for tech companies in Tidel Park area. Car carrier service for employee vehicles.", pickupAddress: 'Near Sholinganallur Signal, OMR, Chennai' },
    ],
    pune: [
      { slug: 'baner', name: 'Baner', type: 'neighborhood', description: "Pune's fast-growing IT suburb. Home shifting for Balewadi and Aundh apartments. Daily intercity moves to Mumbai and Nashik. Pet-friendly packing and transit insurance available.", pickupAddress: 'Near Baner Road / Sus Road Junction, Pune' },
      { slug: 'hinjewadi', name: 'Hinjewadi', type: 'zone', description: "IT worker relocation corridor. Furnished apartment moves with itemized insurance. Regular Pune–Bangalore moves for software engineers. Bike transport in hydraulic carriers.", pickupAddress: 'Near Hinjewadi Chowk, Pune' },
      { slug: 'kharadi', name: 'Kharadi', type: 'neighborhood', description: "EON IT Park residential zone. Office moves for tech companies, apartment shifting in Kohinoor City Complex, and car transport to Mumbai and Hyderabad. Same-day booking available.", pickupAddress: 'Near Kharadi EON IT Park, Pune' },
    ],
    kolkata: [
      { slug: 'salt-lake-city', name: 'Salt Lake City', type: 'zone', description: "Kolkata's planned township for IT and government employees. Sector V office relocations, residential moves to New Town Action Area, and intercity shifting to Delhi and Mumbai.", pickupAddress: 'Near Salt Lake City Centre, Kolkata' },
      { slug: 'new-town', name: 'New Town', type: 'neighborhood', description: "Kolkata's fastest-growing suburb. Eco-Park proximity apartment moves and Rajarhat New Town IT office relocation. New Town–Howrah car carrier service and temporary storage.", pickupAddress: 'Near New Town Biswa Bangla Gate, Kolkata' },
      { slug: 'behala', name: 'Behala', type: 'area', description: "South-west Kolkata's residential hub. Budget home shifting for Joka, Thakurpukur, and Maheshtala. Durga Puja seasonal relocations and secure storage solutions available.", pickupAddress: 'Near Behala Chowrasta, Kolkata' },
    ],
    surat: [
      { slug: 'adajan', name: 'Adajan', type: 'neighborhood', description: "Surat's most active shifting zone. Home shifting for Adajan Patiya and Pal area apartments. Intercity moves to Ahmedabad (260 km, ₹8,000–₹12,000) and Mumbai (280 km). Transit insurance included.", pickupAddress: 'Near Adajan Patiya, Surat' },
      { slug: 'vesu', name: 'Vesu', type: 'neighborhood', description: "Surat's growth residential corridor. VR Surat apartment shifting, IT office relocation, and Vesu–Althan residential moves. Budget local shift ₹3,500–₹6,000. Modular kitchen packing available.", pickupAddress: 'Near Vesu VR Mall Road, Surat' },
      { slug: 'ring-road', name: 'Ring Road', type: 'area', description: "Commercial establishment moves along Surat's busiest corridor. Textile showroom relocation, diamond trading office moves, and residential shifts. Same-day service for Ring Road to Citylight.", pickupAddress: 'Near Surat Ring Road / Stadium Circle, Surat' },
    ],
    lucknow: [
      { slug: 'gomti-nagar', name: 'Gomti Nagar', type: 'neighborhood', description: "Lucknow's IT professional relocation hub. Intercity moves to Noida, Gurgaon, and Bengaluru for UP government and IT employees. Local 2BHK shift ₹5,000–₹8,000. IBA-approved movers.", pickupAddress: 'Near Vibhuti Khand, Gomti Nagar, Lucknow' },
      { slug: 'indira-nagar', name: 'Indira Nagar', type: 'neighborhood', description: "Lucknow's densest residential area. Frequent intra-city moves between Indira Nagar sectors. Intercity to Delhi (550 km, ₹10,000–₹16,000). Vehicle transport to Noida and Gurugram available.", pickupAddress: 'Near Indira Nagar Sector 25, Lucknow' },
      { slug: 'aliganj', name: 'Aliganj', type: 'area', description: "North Lucknow's growing residential belt. Budget movers for 1BHK and 2BHK shifts from ₹3,500. IBA-approved teams for government employee transfers. SGPGI hospital staff relocation specialists.", pickupAddress: 'Near Aliganj Metro Station, Lucknow' },
    ],
  },

  'mini-truck-rental': {
    delhi: [
      { slug: 'karol-bagh', name: 'Karol Bagh', type: 'market', description: "Delhi's electronics and wholesale market. Mini trucks for shop inventory movement, market runs to Lajpat Nagar (8 km), and e-commerce last-mile deliveries. Intra-market 4-hour package from ₹799.", pickupAddress: 'Near Karol Bagh Metro Station, New Delhi' },
      { slug: 'lajpat-nagar', name: 'Lajpat Nagar', type: 'market', description: "South Delhi's biggest wholesale and retail hub. Mini trucks essential for fabric, furniture, and household goods transport. Central Market to Sadar Bazaar route most popular.", pickupAddress: 'Near Lajpat Nagar Metro Station, New Delhi' },
      { slug: 'noida', name: 'Noida', type: 'zone', description: "NCR's fastest-growing delivery corridor. E-commerce fulfillment, factory-to-warehouse moves, and apartment shifting in Sectors 18, 62, and 137. Cross-border Noida–Delhi deliveries daily.", pickupAddress: 'Near Noida Sector 18, Noida' },
      { slug: 'dwarka', name: 'Dwarka', type: 'neighborhood', description: "Southwest Delhi's residential zone. Apartment-to-apartment shifting, furniture delivery, and small household moves between Dwarka sectors. Gurugram cross-border deliveries via NH48.", pickupAddress: 'Near Dwarka Sector 10 Metro, New Delhi' },
    ],
    bangalore: [
      { slug: 'koramangala', name: 'Koramangala', type: 'area', description: "Startup delivery hub. Restaurant supply runs, office shifting, and e-commerce returns management from Koramangala warehouses. Ring Road access for Bangalore-wide delivery coverage.", pickupAddress: 'Near Koramangala 7th Block, Bangalore' },
      { slug: 'whitefield', name: 'Whitefield', type: 'zone', description: "IT zone with high furniture delivery and corporate office shifting demand. ITPL–Marathahalli corridor mini truck route. Bangalore International Airport parcel delivery pickup available.", pickupAddress: 'Near Whitefield / ITPL Gate, Bangalore' },
      { slug: 'electronic-city', name: 'Electronic City', type: 'zone', description: "Corporate campus deliveries and small warehouse-to-warehouse transfers. Hosur road access for Tamil Nadu cross-border freight. Budget mini trucks with 750kg capacity from ₹1,299/day.", pickupAddress: 'Near Electronic City Phase 1, Bangalore' },
    ],
    mumbai: [
      { slug: 'andheri', name: 'Andheri', type: 'area', description: "Mumbai's delivery nerve center. E-commerce last-mile, restaurant supply, and pharma cold-chain deliveries. JNPT freight connection via Eastern Express Highway. Airport cargo pickup.", pickupAddress: 'Near Andheri Station (East), Mumbai' },
      { slug: 'dharavi', name: 'Dharavi', type: 'area', description: "Mumbai's manufacturing hub with leather, textile, and recycling industry deliveries. Mini trucks for raw material supply and finished goods dispatch. B2B contracts available.", pickupAddress: 'Near Dharavi Cross Road, Mumbai' },
      { slug: 'thane', name: 'Thane', type: 'area', description: "Eastern Mumbai corridor with industrial estate deliveries. Thane–Bhiwandi MIDC freight runs, warehouse-to-retail deliveries, and construction material transport.", pickupAddress: 'Near Thane Station, Thane' },
    ],
    hyderabad: [
      { slug: 'secunderabad', name: 'Secunderabad', type: 'zone', description: "Hyderabad's twin city with major railway terminus. Mini trucks for ECIL and Trimulgherry industrial deliveries, Secunderabad Cantonment supply chain, and NH44 outstation loads.", pickupAddress: 'Near Secunderabad Railway Station, Secunderabad' },
      { slug: 'lb-nagar', name: 'LB Nagar', type: 'area', description: "South-east Hyderabad's wholesale and retail hub. Vegetable market deliveries, Nagole industrial estate supply runs, and last-mile e-commerce deliveries to Saroor Nagar.", pickupAddress: 'Near LB Nagar Metro Station, Hyderabad' },
      { slug: 'uppal', name: 'Uppal', type: 'zone', description: "Hyderabad's eastern industrial corridor near BHEL and Patancheru. Factory-to-warehouse mini truck runs, Uppal MIDC daily delivery contracts, and HiTec City retail supply.", pickupAddress: 'Near Uppal Metro Station, Hyderabad' },
    ],
    chennai: [
      { slug: 't-nagar', name: 'T. Nagar', type: 'market', description: "Chennai's busiest retail market. Mini trucks for textile wholesale deliveries, Ranganathan Street goods movement, and e-commerce last-mile in Pondy Bazaar. Daily and monthly contracts.", pickupAddress: 'Near T. Nagar Bus Terminus, Chennai' },
      { slug: 'anna-nagar', name: 'Anna Nagar', type: 'area', description: "North Chennai's planned township. Apartment shifting, FMCG distributor deliveries to supermarkets, and Anna Nagar Tower area retail supply. On-demand hourly booking.", pickupAddress: 'Near Anna Nagar Metro Station, Chennai' },
      { slug: 'tambaram', name: 'Tambaram', type: 'zone', description: "South Chennai's growing industrial and residential belt. SIPCOT industrial estate deliveries, Tambaram–Sriperumbudur factory runs, and housing colony furniture transport.", pickupAddress: 'Near Tambaram Railway Station, Chennai' },
    ],
    pune: [
      { slug: 'hadapsar', name: 'Hadapsar', type: 'zone', description: "Pune's south-east IT and industrial hub. EOIF IT Park supply runs, Hadapsar industrial estate deliveries, and Fursungi warehousing zone last-mile transport.", pickupAddress: 'Near Hadapsar, Fursungi Road, Pune' },
      { slug: 'pimpri', name: 'Pimpri-Chinchwad', type: 'zone', description: "Maharashtra's largest industrial township. Auto component deliveries to Bajaj Auto, Tata Motors, and Force Industries plants. MIDC-to-dealer logistics runs available.", pickupAddress: 'Near Pimpri MIDC / Kasarwadi, Pune' },
      { slug: 'wakad', name: 'Wakad', type: 'neighborhood', description: "Pune's NH48 corridor mini truck hub. Hinjewadi IT Park supply deliveries, Wakad–Baner retail distribution, and residential area household goods shifting.", pickupAddress: 'Near Wakad Bridge, Pune-Mumbai Highway' },
    ],
    surat: [
      { slug: 'ring-road', name: 'Ring Road', type: 'area', description: "Surat's textile and diamond trade artery. Mini trucks for saree manufacturer bulk deliveries, diamond rough material transport, and Ring Road wholesale market daily stock runs.", pickupAddress: 'Near Ring Road Stadium Circle, Surat' },
      { slug: 'surat-textile-market', name: 'Surat Textile Market', type: 'market', description: "Asia's largest textile hub in Katargam. Mini trucks for roll fabric transport, Sahara Darwaja to Katargam mill deliveries, and e-commerce textile fulfillment. 24-hour availability during season.", pickupAddress: 'Near Surat Textile Market, Katargam, Surat' },
      { slug: 'hazira', name: 'Hazira', type: 'zone', description: "Surat's petrochemical and port zone. Industrial goods delivery to ONGC, Shell, and L&T Hydrocarbon plants. Cross-Gujarat NH48 freight runs. Covered mini trucks for chemical transport.", pickupAddress: 'Near Hazira Industrial Area / ONGC Gate, Surat' },
    ],
    nagpur: [
      { slug: 'sitabuldi', name: 'Sitabuldi', type: 'market', description: "Nagpur's central market and Zero Mile commercial zone. Mini trucks for Itwari wholesale market runs, Central Avenue grocery deliveries, and furniture transport. Budget daily hire ₹1,299.", pickupAddress: 'Near Sitabuldi Market, Nagpur' },
      { slug: 'butibori-midc', name: 'Butibori MIDC', type: 'zone', description: "Nagpur's industrial satellite township. Factory-to-warehouse mini truck runs for textile, auto component, and food processing units. NH44 highway freight access to Hyderabad (504 km).", pickupAddress: 'Near Butibori MIDC Industrial Area, Nagpur' },
      { slug: 'wardha-road', name: 'Wardha Road', type: 'zone', description: "MIHAN aerocity logistics corridor. Aviation cargo last-mile delivery, e-commerce fulfillment for Nagpur's growing online market, and AIIMS Nagpur supply deliveries.", pickupAddress: 'Near MIHAN, Wardha Road, Nagpur' },
    ],
  },

  'equipment-rental': {
    delhi: [
      { slug: 'noida', name: 'Noida', type: 'zone', description: "UP's industrial and IT construction corridor. JCB excavators for Noida Authority projects, hydraulic cranes for high-rise construction in Sectors 62–137, and generators for Noida Expressway sites.", pickupAddress: 'Near Noida Industrial Area Sector 63, Noida' },
      { slug: 'gurgaon', name: 'Gurugram', type: 'zone', description: "Delhi NCR's fastest-growing construction zone. Cranes for DLF, Unitech, and Hines tower construction. Road rollers and motor graders for Golf Course Road extension works.", pickupAddress: 'Near IMT Manesar / Gurgaon Industrial Area, Haryana' },
      { slug: 'faridabad', name: 'Faridabad', type: 'zone', description: "Haryana's industrial city. Equipment rental for auto parts factories, NTPC Faridabad plant support, and NH48 infrastructure projects. Tipper trucks and compactors most in demand.", pickupAddress: 'Near Faridabad Industrial Area, Haryana' },
    ],
    bangalore: [
      { slug: 'whitefield', name: 'Whitefield', type: 'zone', description: "Bangalore's east construction boom. Excavators for ITPL Phase 4 expansion, cranes for Prestige tech park towers, and road equipment for NH44 widening. 24/7 equipment availability.", pickupAddress: 'Near Whitefield, Bangalore' },
      { slug: 'electronic-city', name: 'Electronic City', type: 'zone', description: "Infosys and Wipro expansion zone. Concrete mixers, backhoe loaders, and tower cranes for campus construction. Tamil Nadu cross-border equipment movement allowed.", pickupAddress: 'Near Electronic City Phase 1, Bangalore' },
      { slug: 'bommasandra', name: 'Bommasandra', type: 'zone', description: "Bangalore's south industrial zone. Heavy equipment for Toyota Kirloskar, Volvo India, and ABB plant construction. Generators (250–500 kVA) for uninterrupted industrial operations.", pickupAddress: 'Near Bommasandra Industrial Area, Bangalore' },
      { slug: 'koramangala', name: 'Koramangala', type: 'area', description: "Event equipment hub. DJ systems, stage lighting, LED screens, and backup generators for corporate events, product launches, and outdoor exhibitions in Bangalore's startup district.", pickupAddress: 'Near Koramangala, Bangalore' },
    ],
    mumbai: [
      { slug: 'bhiwandi', name: 'Bhiwandi', type: 'zone', description: "India's largest warehousing hub. Forklifts, reach stackers, and material handling equipment for Amazon, Flipkart, and Delhivery warehouse operations. Round-the-clock availability.", pickupAddress: 'Near Bhiwandi MIDC Industrial Area, Thane' },
      { slug: 'andheri', name: 'Andheri', type: 'area', description: "Mumbai's event equipment center. Bollywood set construction cranes, outdoor event generators (15–500 kVA), stage rigging equipment, and lighting towers for film shoots.", pickupAddress: 'Near Andheri East MIDC, Mumbai' },
      { slug: 'navi-mumbai', name: 'Navi Mumbai', type: 'zone', description: "Massive infrastructure boom zone — NAINA area, NMIA airport construction, and JNPT expansion. Tower cranes, piling rigs, and heavy excavators. International safety standards.", pickupAddress: 'Near Navi Mumbai Industrial Area / MIDC, Navi Mumbai' },
    ],
    hyderabad: [
      { slug: 'patancheru', name: 'Patancheru MIDC', type: 'zone', description: "Hyderabad's major industrial area. Heavy equipment for pharma and chemical plant construction at IDA Patancheru. JCB backhoe loaders, transit mixers, and tower cranes with safety-compliant operators.", pickupAddress: 'Near IDA Patancheru, Hyderabad' },
      { slug: 'shamshabad', name: 'Shamshabad', type: 'zone', description: "Rajiv Gandhi International Airport zone. Equipment for RGIA cargo terminal expansion, Shamshabad IT SEZ construction, and NH44 road widening projects. 24/7 on-site availability.", pickupAddress: 'Near RGIA / Shamshabad, Hyderabad' },
      { slug: 'medchal', name: 'Medchal-Malkajgiri', type: 'zone', description: "Hyderabad's north industrial corridor. Equipment for Genome Valley biopharma construction, ISRO URSC projects, and Bowenpally logistics park building works. Certified operators.", pickupAddress: 'Near Medchal Industrial Area, Hyderabad' },
    ],
    chennai: [
      { slug: 'oragadam', name: 'Oragadam', type: 'zone', description: "India's auto manufacturing hub. Equipment for Renault-Nissan, Ford, and Daimler plant expansion. JCB excavators, cranes, and motor graders for Chennai-Bengaluru Industrial Corridor projects.", pickupAddress: 'Near Oragadam SIPCOT Industrial Area, Chennai' },
      { slug: 'ambattur', name: 'Ambattur', type: 'zone', description: "North Chennai's industrial estate with 3,000+ factories. Equipment for SIDCO industrial expansion, Ambattur MEPZ construction, and textile factory building projects.", pickupAddress: 'Near Ambattur Industrial Estate, Chennai' },
      { slug: 'porur', name: 'Porur', type: 'zone', description: "West Chennai's infrastructure development zone. Equipment for DLF and Casagrand residential project construction, IT corridor building works, and Bangalore Highway road projects.", pickupAddress: 'Near Porur, Bangalore Highway, Chennai' },
    ],
    pune: [
      { slug: 'chakan', name: 'Chakan MIDC', type: 'zone', description: "Pune's auto manufacturing corridor. Equipment for Volkswagen, Mercedes-Benz India, and Cummins plant expansion. Tower cranes, piling rigs, and compactors. ISO-certified operators.", pickupAddress: 'Near Chakan MIDC Phase 3, Pune' },
      { slug: 'talegaon', name: 'Talegaon', type: 'zone', description: "Mumbai–Pune corridor's industrial growth zone. Equipment for General Motors, Kinetic Engineering, and Talegaon MIDC infra projects. Cranes for railway siding and highway construction.", pickupAddress: 'Near Talegaon Dabhade MIDC, Pune' },
      { slug: 'pcmc', name: 'PCMC', type: 'zone', description: "Pimpri-Chinchwad Municipal Corporation area. Equipment for Bajaj Auto Chakan complex, DMIC corridor projects, and smart city infrastructure. Generator sets (100–2000 kVA) for industrial use.", pickupAddress: 'Near PCMC Bhavan, Pimpri-Chinchwad, Pune' },
    ],
    nagpur: [
      { slug: 'butibori-midc', name: 'Butibori MIDC', type: 'zone', description: "Maharashtra's second-largest MIDC after Pune. Heavy equipment for pharma, auto components, and textile factories. JCB backhoe loaders, transit mixers, and 200–500 kVA generators for industrial operations.", pickupAddress: 'Near Butibori MIDC Phase 2, Nagpur' },
      { slug: 'mihan', name: 'MIHAN SEZ', type: 'zone', description: "Multi-modal International Hub and Airport Nagpur. Construction equipment for aerospace, IT, and logistics park development. Tower cranes for SEZ high-rise and Nagpur Metro Phase 2 extension works.", pickupAddress: 'Near MIHAN SEZ / Dr. Babasaheb Ambedkar Airport, Nagpur' },
      { slug: 'wardha-road', name: 'Wardha Road Corridor', type: 'zone', description: "Nagpur's infrastructure boom corridor. Equipment for Nagpur–Mumbai Samruddhi Expressway interchange works, AIIMS campus expansion, and VNIT infrastructure projects. Certified operators.", pickupAddress: 'Near Wardha Road IT Park / Khapri, Nagpur' },
    ],
  },

  'luxury-car-rental': {
    delhi: [
      { slug: 'connaught-place', name: 'Connaught Place', type: 'area', description: "Delhi's prestige corporate and diplomatic zone. Luxury cars for five-star hotel (Imperial, Leela) pickups, embassy visits, and Lutyens Bungalow Zone events. BMW 7-series and Mercedes S-Class most requested.", pickupAddress: 'Near Connaught Place / Imperial Hotel, New Delhi' },
      { slug: 'aerocity', name: 'Aerocity', type: 'zone', description: "IGI Airport's premium hospitality district. 24/7 luxury car transfers between all terminals and city hotels. Rolls-Royce, Bentley, and Limousines for VVIP airport arrivals.", pickupAddress: 'Near IGI Airport Terminal 3 / Aerocity Metro, New Delhi' },
      { slug: 'south-delhi', name: 'South Delhi', type: 'area', description: "Greater Kailash, Defence Colony, and Vasant Kunj — Delhi's wedding capital. Luxury wedding cars (vintage rolls, Jaguar, Range Rover) for baraat and reception. Book 2 weeks in advance.", pickupAddress: 'Near Greater Kailash / Defence Colony, South Delhi' },
    ],
    bangalore: [
      { slug: 'ulsoor', name: 'Ulsoor', type: 'area', description: "Premium Bangalore address for luxury car rentals. Close to Taj Vivanta, Sheraton, and ITC Windsor. Corporate chauffeur services for Prestige Shantiniketan and UB City business meetings.", pickupAddress: 'Near Ulsoor Lake / MG Road, Bangalore' },
      { slug: 'koramangala', name: 'Koramangala', type: 'area', description: "Startup unicorn district with frequent luxury rental demand for investor meetings, product launches, and corporate events. Mercedes E-Class and BMW 5-Series most popular.", pickupAddress: 'Near Koramangala 5th Block, Bangalore' },
      { slug: 'whitefield', name: 'Whitefield', type: 'zone', description: "IT executive zone with airport transfer demand to KIAL (25 km, 45 min). Luxury cars for TCS, Infosys, and SAP campus corporate visitors. Hourly packages from ₹2,500.", pickupAddress: 'Near Whitefield / ITPL, Bangalore' },
    ],
    mumbai: [
      { slug: 'bandra-bkc', name: 'Bandra-BKC', type: 'area', description: "Mumbai's financial and Bollywood hub. Luxury sedans and SUVs for BKC corporate events, film industry VIP transport, and Lilavati Hospital executive transfers. Rolls-Royce and Bentley available.", pickupAddress: 'Near BKC / Bandra Kurla Complex, Mumbai' },
      { slug: 'juhu', name: 'Juhu', type: 'beach', description: "Film star neighborhood with highest luxury car demand in Mumbai. Chauffeur-driven Mercedes, Audi, and Range Rover for Bollywood shoots, celebrity events, and JVPD Scheme social occasions.", pickupAddress: 'Near Juhu Beach / JVPD Scheme, Mumbai' },
      { slug: 'worli', name: 'Worli', type: 'area', description: "South Mumbai's luxury residential and corporate zone. Bandra-Worli Sea Link transfers in premium vehicles. ITC Grand Central and Palladium mall event transport.", pickupAddress: 'Near Worli Sea Face / ITC Grand Central, Mumbai' },
    ],
    hyderabad: [
      { slug: 'banjara-hills', name: 'Banjara Hills', type: 'area', description: "Hyderabad's most affluent neighborhood. Luxury cars for Jubilee Hills Club events, ITC Kakatiya hotel pickups, and pharmaceutical executive transfers. Rolls-Royce and Bentley available.", pickupAddress: 'Near Banjara Hills Road No. 12, Hyderabad' },
      { slug: 'jubilee-hills', name: 'Jubilee Hills', type: 'area', description: "Tollywood celebrity district. Luxury SUVs for film shoots, Filmnagar event transport, and HITEC City executive commutes. Audi Q8, BMW X7, and Range Rover most requested.", pickupAddress: 'Near Jubilee Hills Check Post, Hyderabad' },
      { slug: 'gachibowli', name: 'Gachibowli', type: 'zone', description: "Hyderabad's financial district with ICICI, Deloitte, and Amazon HQs. Premium sedans for DLF Cyber City corporate meetings, RGIA airport transfers, and Westin hotel chauffeur service.", pickupAddress: 'Near Gachibowli DLF Cyber City, Hyderabad' },
    ],
    chennai: [
      { slug: 'nungambakkam', name: 'Nungambakkam', type: 'area', description: "Chennai's diplomatic and luxury residential enclave. Cars for US Consulate and British High Commission events, The Park Chennai hotel pickups, and Khader Nawaz Khan Road shopping.", pickupAddress: 'Near Nungambakkam Metro Station, Chennai' },
      { slug: 'adyar', name: 'Adyar', type: 'area', description: "South Chennai's upscale residential belt. Luxury airport transfers from Chennai International, IIT Madras visitor transport, and ECR weekend drives in premium convertibles.", pickupAddress: 'Near Adyar Signal / Theosophical Society, Chennai' },
      { slug: 'anna-salai', name: 'Anna Salai', type: 'area', description: "Chennai's main boulevard with five-star hotels. Luxury cars for Taj Coromandel, ITC Grand Chola, and Leela Palace pickups. Business meetings in premium sedans along Mount Road.", pickupAddress: 'Near Anna Salai / Mount Road, Chennai' },
    ],
    goa: [
      { slug: 'panjim', name: 'Panjim', type: 'area', description: "Goa's capital and prime luxury rental hub. Self-drive Jaguars and Range Rovers for North Goa beach drives. Casino-to-casino luxury transfers. Goa Liberation Day parade vehicles.", pickupAddress: 'Near Panjim Church, Panjim, Goa' },
      { slug: 'calangute', name: 'Calangute', type: 'beach', description: "Queen of Goan beaches with highest tourism. Luxury convertibles for Baga–Calangute–Candolim beach strip. Celebrity holiday rentals and wedding transfers to Sinquerim and Aguada.", pickupAddress: 'Near Calangute Beach Road, North Goa' },
      { slug: 'margao', name: 'Margao', type: 'area', description: "South Goa's commercial capital. Luxury rides to Colva, Benaulim, and Palolem beaches. Madgaon station airport transfer in premium vehicles. IIFM film festival shuttle service.", pickupAddress: 'Near Margao Railway Station, South Goa' },
    ],
    visakhapatnam: [
      { slug: 'rk-beach', name: 'RK Beach', type: 'beach', description: "Vizag's iconic seafront. Luxury cars for INS Kalinga Navy base VIP transfers, Visakhapatnam Port Trust guest pickups, and Rushikonda resort arrivals. BMW 5-Series and Mercedes E-Class.", pickupAddress: 'Near RK Beach / Park Hotel, Visakhapatnam' },
      { slug: 'mvp-colony', name: 'MVP Colony', type: 'neighborhood', description: "Vizag's most prestigious residential address. Luxury sedans and SUVs for GITAM University convocations, NALCO executive transfers, and BHPV corporate events. Range Rover and Audi A6.", pickupAddress: 'Near MVP Colony Road, Visakhapatnam' },
      { slug: 'rushikonda', name: 'Rushikonda', type: 'beach', description: "Vizag's luxury resort and IT corridor. Premium car pickups from Novotel, The Park, and Marriott Vizag. Beach resort transfers and AP Tourism vehicle demand during peak season.", pickupAddress: 'Near Rushikonda Beach Novotel, Visakhapatnam' },
    ],
  },
};


// Utility: get all generateStaticParams entries for a service
export function getSubLocationStaticParams(serviceSlug: string) {
  const cities = CITY_SUBLOCATIONS[serviceSlug];
  if (!cities) return [];
  return Object.entries(cities).flatMap(([citySlug, subs]) =>
    subs.map((sl) => ({ location: citySlug, sublocation: sl.slug }))
  );
}

// Utility: look up a specific sub-location
export function getSubLocation(serviceSlug: string, citySlug: string, subSlug: string): SubLocation | null {
  return CITY_SUBLOCATIONS[serviceSlug]?.[citySlug]?.find((sl) => sl.slug === subSlug) ?? null;
}

// Utility: get the city name from slug
export function getCityNameFromSlug(slug: string): string {
  const map: Record<string, string> = {
    delhi: 'Delhi', mumbai: 'Mumbai', bangalore: 'Bangalore',
    goa: 'Goa', hyderabad: 'Hyderabad', chennai: 'Chennai',
    pune: 'Pune', ahmedabad: 'Ahmedabad', kolkata: 'Kolkata', jaipur: 'Jaipur',
    surat: 'Surat', lucknow: 'Lucknow', nagpur: 'Nagpur', visakhapatnam: 'Visakhapatnam',
  };
  return map[slug] ?? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
