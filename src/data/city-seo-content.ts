// City-specific SEO content for location pages
// Tier 1: Full content (top 25 cities)
// Fallback: State-level content for remaining cities

export type CityRoute = {
  to: string;
  distance: string;
  duration: string;
  via?: string;
};

export type CityFAQ = {
  q: string;
  a: string;
};

export type CitySEO = {
  intro: string;
  routes: CityRoute[];
  tips: string[];
  stats: { population: string; knownFor: string; airport: string };
  serviceIntros?: Partial<Record<string, string>>;
  serviceFAQs?: Partial<Record<string, CityFAQ[]>>;
};

export type StateSEO = {
  intro: string;
  tips: string[];
};

// ─── CITY DATA ───────────────────────────────────────────────────────────────

export const CITY_SEO: Record<string, CitySEO> = {
  mumbai: {
    intro:
      "Mumbai, Maharashtra's financial capital with a population of over 2 crore, generates some of India's highest demand for rental vehicles. Corporate travel between BKC, Nariman Point, and Andheri dominates weekday bookings, while weekend trips to Lonavala, Alibaug, and Pune drive leisure demand. The Mumbai-Pune Expressway (NH48) is India's busiest intercity corridor. TransRentals covers all major hubs — from Juhu to Thane and Navi Mumbai — ensuring quick pickup across the city.",
    routes: [
      { to: 'Pune', distance: '150 km', duration: '3 hrs', via: 'Expressway NH48' },
      { to: 'Lonavala', distance: '80 km', duration: '1.5 hrs', via: 'Mumbai-Pune Expressway' },
      { to: 'Nashik', distance: '170 km', duration: '3.5 hrs', via: 'NH160' },
      { to: 'Goa', distance: '600 km', duration: '10 hrs', via: 'NH66 Coastal' },
      { to: 'Shirdi', distance: '240 km', duration: '5 hrs', via: 'NH160' },
      { to: 'Mahabaleshwar', distance: '260 km', duration: '5 hrs', via: 'NH48 then NH166' },
    ],
    tips: [
      'Avoid peak traffic hours — Mon to Fri 8–10 AM and 6–9 PM on Western Express Highway',
      'Book airport transfers in advance during Ganesh Chaturthi and IPL season — demand spikes 3x',
      'For Lonavala and Pune trips, depart before 7 AM on weekends to beat expressway traffic',
      'Prefer AC vehicles year-round — Mumbai has a humid coastal climate with high temperatures',
    ],
    stats: { population: '2.07 Crore', knownFor: 'Financial Hub, Bollywood, Gateway of India', airport: 'CSIA BOM — 30 km from city center' },
    serviceIntros: {
      'car-rental':
        "Mumbai's corporate corridors and tourist hotspots make it one of India's top car rental markets. Sedans and SUVs dominate for airport transfers and outstation trips, while hatchbacks are preferred for within-city travel. Verified vendors on TransRentals offer instant booking with both self-drive and chauffeur-driven options across all Mumbai zones.",
      'bike-on-rent':
        "Mumbai's dense traffic and narrow lanes make bikes and scooters a top choice for daily commuters and weekend riders. Demand peaks during monsoon months (Jun–Sep) for coastal road rides. Activa and TVS Jupiter are most booked for daily use, while Royal Enfield models are preferred for Lonavala and Alibaug weekend rides.",
      'bus-rental':
        "Mumbai requires buses primarily for corporate events at BKC, wedding transport in suburbs, and school excursions. Ganesh Chaturthi and cricket events create seasonal demand spikes. Tempo travellers (12–17 seater) are popular for Shirdi pilgrimages and Goa corporate trips. TransRentals offers AC and non-AC buses across Greater Mumbai including Thane and Navi Mumbai.",
      'packers-and-movers':
        "Mumbai's dense population and frequent apartment relocations make it one of India's busiest cities for packers and movers. Intra-city moves between Andheri, Bandra, Thane, and Navi Mumbai are most common. Intercity moves to Pune and Nashik peak in March–April (end of financial year). TransRentals connects you with insured, verified moving teams across all Mumbai zones.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What are the best pick-up areas for car rental in Mumbai?', a: 'Major pickup zones include Andheri (near airport), BKC, Bandra, Thane, Navi Mumbai, and Churchgate. Most vendors offer doorstep delivery within 2 hours in these areas.' },
        { q: 'Can I take a rental car from Mumbai to Goa?', a: 'Yes, outstation trips to Goa (600 km via NH66) are allowed with most vendors. Ensure your rental includes intercity travel in the agreement and factor in tolls and driver allowance.' },
        { q: 'What is the best route from Mumbai to Pune by car?', a: 'The Mumbai-Pune Expressway (NH48) is the fastest route — 150 km in about 3 hours. Avoid Sundays evenings as return traffic can extend the journey to 5+ hours.' },
        { q: 'Is self-drive car rental available in Mumbai?', a: 'Yes, self-drive rentals are available in Mumbai starting from ₹999/day. You need a valid DL (minimum 1 year old), Aadhaar, and a refundable security deposit.' },
        { q: 'Which areas have highest traffic congestion in Mumbai?', a: "Western Express Highway, Eastern Freeway, and LBS Marg are the busiest stretches. Bandra-Worli Sea Link saves time between South and North Mumbai. Plan routes via Google Maps real-time during peak hours." },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for Mumbai city commute?', a: 'Honda Activa and TVS Jupiter are ideal for Mumbai city commuting — easy parking, good mileage, and suitable for all road types including narrow lanes.' },
        { q: 'Can I rent a Royal Enfield in Mumbai for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 and Himalayan are available for weekend rentals. Weekly rates are lower than daily rates — ideal for Lonavala or Alibaug trips.' },
        { q: 'Is bike rental available near Mumbai airport?', a: 'Yes, several vendors near Andheri and Vile Parle offer bike rentals close to Chhatrapati Shivaji International Airport. Advance booking ensures immediate availability.' },
        { q: 'What is the fuel policy for bike rentals in Mumbai?', a: 'Most vendors provide bikes with a full tank. Return with full tank to avoid fuel charges. Petrol pumps are easily accessible throughout Mumbai.' },
        { q: 'Can I ride a rented bike on the Mumbai-Pune Expressway?', a: 'Bikes under 100cc are not permitted on expressways. Bikes above 100cc (like Royal Enfield, KTM) can use the expressway. Always confirm with the vendor before booking.' },
      ],
    },
  },

  delhi: {
    intro:
      "Delhi NCR, India's capital region with over 3.2 crore residents, has one of the highest per-capita vehicle rental demands in the country. Corporate bookings dominate Connaught Place, Aerocity, and the Gurugram IT corridor. Tourist demand peaks October–March for monument tours including Red Fort, Qutub Minar, and Humayun's Tomb. TransRentals covers all major Delhi zones — North, South, East, West, and NCR cities Noida, Gurugram, and Faridabad.",
    routes: [
      { to: 'Agra', distance: '230 km', duration: '4 hrs', via: 'Yamuna Expressway' },
      { to: 'Jaipur', distance: '280 km', duration: '5 hrs', via: 'NH48' },
      { to: 'Haridwar', distance: '220 km', duration: '4 hrs', via: 'NH58' },
      { to: 'Chandigarh', distance: '260 km', duration: '4.5 hrs', via: 'NH44' },
      { to: 'Amritsar', distance: '450 km', duration: '8 hrs', via: 'NH44' },
      { to: 'Shimla', distance: '360 km', duration: '8 hrs', via: 'NH5' },
    ],
    tips: [
      'Odd-even scheme may apply on some days — check EPCA notifications before booking a self-drive car',
      'NH48 (Delhi-Jaipur) and Yamuna Expressway (Delhi-Agra) are smooth — ideal for outstation trips',
      'Book airport pickups from IGI Terminal 1 and 3 well in advance during peak season (Oct–Feb)',
      'Delhi Metro connectivity means short city trips are often faster by metro — save your rental for outstation',
    ],
    stats: { population: '3.2 Crore', knownFor: 'Capital City, Historical Monuments, NCR Hub', airport: 'IGI DEL — 20 km from city center' },
    serviceIntros: {
      'car-rental':
        "Delhi NCR's sprawling geography — spanning Delhi, Noida, Gurugram, Ghaziabad, and Faridabad — makes car rentals essential for both corporate and leisure travel. Innova Crysta and Ertiga are most booked for group travel, while hatchbacks and sedans dominate solo and couple bookings. TransRentals has 200+ verified vendors serving same-day requests across the entire NCR region.",
      'bike-on-rent':
        "Delhi's wide roads, dedicated cycling tracks, and growing biking culture make it a vibrant two-wheeler rental market. Old Delhi's monument zone is best explored on scooters, while South Delhi's upscale areas see demand for Royal Enfield and KTM bikes. Weekend rides to Shimla, Rishikesh, and Agra are extremely popular. Electric scooters are increasingly in demand due to Delhi's pollution norms.",
      'bus-rental':
        "Delhi NCR requires buses for corporate team outings, school excursions, wedding baraat, and pilgrimages to Vaishno Devi and Haridwar. Demand peaks during Navratri, Dussehra, and wedding season (Nov–Feb). Volvo and Scania buses are available for premium Shimla and Manali trips. TransRentals covers Delhi, Noida, Gurugram, and Faridabad for all group travel needs.",
      'packers-and-movers':
        "Delhi NCR has one of India's highest relocation rates due to frequent job transfers and a transient corporate workforce. Moves between Delhi, Noida, Gurugram, and Ghaziabad dominate. March–April (financial year end) and May–June (transfer season) are peak months. TransRentals connects you with DTDC and IBA-approved moving companies across all NCR zones.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Is self-drive car rental allowed in Delhi?', a: 'Yes, self-drive is available in Delhi. You need a DL (min 1 year old), valid ID, and a security deposit. Note that odd-even rules may apply on certain days.' },
        { q: 'Which is the best route from Delhi to Agra?', a: 'Yamuna Expressway (NH19) is fastest — 230 km in about 4 hours. Start before 6 AM on weekends to reach Taj Mahal at opening time (6 AM) and avoid crowds.' },
        { q: 'Are airport transfers available from IGI Airport, Delhi?', a: 'Yes, TransRentals offers pre-booked airport pickups from all IGI terminals (T1, T2, T3). Book at least 2 hours before your flight for guaranteed service.' },
        { q: 'What is the cost of a cab from Delhi to Jaipur?', a: 'One-way cab from Delhi to Jaipur (280 km, ~5 hrs via NH48) typically ranges from ₹2,500–₹3,500 for a sedan. Book through TransRentals for verified vendors and fixed pricing.' },
        { q: 'Can I rent a car in Delhi and return it in another city?', a: 'Yes, one-way outstation rentals are available. Delhi to Jaipur, Delhi to Agra, and Delhi to Chandigarh one-ways are most popular. Additional one-way charges apply.' },
      ],
    },
  },

  bangalore: {
    intro:
      "Bangalore, India's Silicon Valley with a population of 1.2 crore, has a highly evolved vehicle rental market driven by IT professionals and domestic tourists. The Outer Ring Road, NICE Road, and Hosur Road corridors see the highest rental activity. Weekend demand spikes for Mysore (150 km), Coorg (250 km), Ooty (270 km), and Hampi (350 km). TransRentals covers all major areas including Koramangala, Whitefield, Electronic City, HSR Layout, and the Kempegowda International Airport corridor.",
    routes: [
      { to: 'Mysore', distance: '150 km', duration: '3 hrs', via: 'Mysore Road NH275' },
      { to: 'Ooty', distance: '270 km', duration: '5 hrs', via: 'Mysore-Ooty Road' },
      { to: 'Coorg', distance: '250 km', duration: '5 hrs', via: 'Mysore Road then SH17' },
      { to: 'Chennai', distance: '350 km', duration: '6 hrs', via: 'NH44' },
      { to: 'Hyderabad', distance: '570 km', duration: '9 hrs', via: 'NH44' },
      { to: 'Pondicherry', distance: '310 km', duration: '5.5 hrs', via: 'ECR or NH66' },
    ],
    tips: [
      'IT office hours (9–10 AM and 6–8 PM) create extreme congestion on Outer Ring Road and Hosur Road — avoid these windows',
      'NICE Road (toll) offers a bypass around the city and is ideal for airport or Mysore-bound trips',
      'Airport pickup: Allow 60–90 min from city center to KIA due to recent metro work on NH44',
      'Weekend trips to Coorg and Ooty are best started Friday night to beat highway traffic',
    ],
    stats: { population: '1.2 Crore', knownFor: 'IT Hub, Silicon Valley of India, Garden City', airport: 'Kempegowda Intl BLR — 40 km from city' },
    serviceIntros: {
      'car-rental':
        "Bangalore's IT workforce and extensive tourist catchment area make it Karnataka's largest car rental market. Innova Crysta, Swift Dzire, and Ertiga are most popular for outstation trips. Corporate-to-airport transfers are highest-demand weekday bookings. With 150+ verified vendors on TransRentals, cars are available for same-day booking across all Bangalore zones including Whitefield and Electronic City.",
      'bike-on-rent':
        "Bangalore's traffic congestion has made bikes the go-to choice for daily office commuters. Hosur Road, Whitefield, and Koramangala are the top bike rental zones. Royal Enfield Himalayan and Classic 350 are in high demand for Coorg and Ooty weekend rides. Electric scooters are growing fast in Bangalore, and TransRentals has the largest EV two-wheeler fleet in the city.",
      'bus-rental':
        "Bangalore's large IT workforce requires buses for team outings, annual company trips, and airport shuttles. Weekend pilgrimages to Tirupati (250 km) and Shirdi (700 km) see high demand. Corporate packages from Electronic City, Whitefield, and Outer Ring Road companies are a specialty. TransRentals offers 12-seater to 50-seater buses across all of Bangalore.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to travel from Bangalore to Mysore?', a: 'The Bangalore-Mysore Expressway (NH275) is the fastest route — 150 km in about 3 hours with minimal traffic. Mysore is ideal for a day trip departing by 6–7 AM.' },
        { q: 'Is self-drive car rental available from Bangalore airport?', a: 'Yes, TransRentals partners have pickup desks near KIA Bangalore. Book at least 24 hours in advance for airport pickups. Airport charges of ₹300–500 may apply.' },
        { q: 'Which car type is best for Coorg trip from Bangalore?', a: 'SUVs like Innova, Ertiga, or XL6 are ideal for Coorg — the roads include ghats and coffee plantation trails that require decent ground clearance.' },
        { q: 'What are the peak traffic hours in Bangalore?', a: 'Worst congestion is 9–10:30 AM and 6–8:30 PM on Outer Ring Road, Hosur Road, and Old Airport Road. NICE Road is always relatively free as a paid alternative.' },
        { q: 'Can I rent a car for Bangalore to Goa trip?', a: 'Yes, Bangalore to Goa is about 560 km (9–10 hrs via NH4 and NH748). One-way or round trip rentals are available. Fuel, driver allowance, and tolls are extra.' },
      ],
    },
  },

  hyderabad: {
    intro:
      "Hyderabad, Telangana's capital with a population of 1 crore, blends a thriving IT sector with rich historical heritage. The HITECH City, Gachibowli, and Financial District corridors dominate corporate rental demand. Tourist circuits including Charminar, Golconda Fort, and Ramoji Film City see year-round activity. TransRentals covers all major zones — from Secunderabad and Banjara Hills to Kukatpally and the Outer Ring Road tech corridors.",
    routes: [
      { to: 'Vijayawada', distance: '275 km', duration: '5 hrs', via: 'NH65' },
      { to: 'Warangal', distance: '148 km', duration: '2.5 hrs', via: 'NH163' },
      { to: 'Tirupati', distance: '560 km', duration: '9 hrs', via: 'NH44' },
      { to: 'Bangalore', distance: '570 km', duration: '9 hrs', via: 'NH44' },
      { to: 'Mumbai', distance: '720 km', duration: '12 hrs', via: 'NH65' },
      { to: 'Srisailam', distance: '215 km', duration: '4 hrs', via: 'NH765' },
    ],
    tips: [
      'ORR (Outer Ring Road) connects all major IT clusters and is the fastest intra-city highway — use it for airport trips',
      'HITECH City and Gachibowli see severe congestion 8:30–10 AM and 6–8:30 PM on weekdays',
      'Pilgrimages to Tirupati are extremely popular — book buses and cabs 48 hrs in advance',
      'Monsoon (July–Sept) improves weather; it is the best time for outstation road trips from Hyderabad',
    ],
    stats: { population: '1 Crore', knownFor: 'IT Hub, Charminar, Biryani, Pearl City', airport: 'Rajiv Gandhi Intl HYD — 35 km from city' },
    serviceIntros: {
      'car-rental':
        "Hyderabad's IT boom and heritage tourism create dual demand for car rentals. Swift Dzire and Innova Crysta are most booked. Airport transfers from RGIA to HITECH City are among the most frequent routes. TransRentals has 100+ verified Hyderabad vendors offering same-day bookings in Secunderabad, Banjara Hills, Madhapur, and all ORR zones.",
      'bike-on-rent':
        "Hyderabad's wide roads and IT colony culture make bikes popular for daily commuters. Gachibowli, Kondapur, and Madhapur have the highest bike rental activity. Royal Enfield Classic 350 is the top choice for weekend rides to Nagarjunasagar, Srisailam, and Warangal. Activa and TVS Jupiter dominate daily city use bookings.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Hyderabad to Tirupati?', a: 'NH44 to NH140A is the standard route — 560 km in about 9 hours. Alternatively, take a night train and book a local cab from Tirupati station for the final stretch.' },
        { q: 'Is car rental available near HITECH City Hyderabad?', a: 'Yes, TransRentals has multiple pickup points near HITECH City, Gachibowli, and Madhapur. Office hour deliveries (9 AM–6 PM) are most common in these zones.' },
        { q: 'Which areas in Hyderabad have the most car rental options?', a: "Secunderabad, Banjara Hills, Madhapur, and Kukatpally have the highest vendor density. Old City (Charminar area) also has vendors for heritage tour circuits." },
        { q: 'Can I hire a car for a day trip to Nagarjunasagar from Hyderabad?', a: 'Yes, Nagarjunasagar dam is 165 km from Hyderabad (3 hrs via NH565). A day trip is very feasible — leave by 6 AM and return by 6–7 PM.' },
        { q: 'Are wedding car rentals available in Hyderabad?', a: 'Yes, decorated cars and luxury vehicles for wedding baraat and guest transport are available. Book 7–10 days in advance during wedding season (Nov–Feb, May).' },
      ],
    },
  },

  chennai: {
    intro:
      "Chennai, Tamil Nadu's capital and India's auto manufacturing hub with 1.1 crore people, has a mature and competitive vehicle rental market. The city's coastal location, major IT parks in OMR and Ambattur, and cultural heritage make it a diverse rental demand center. Marina Beach drives tourist footfall, while IT corridors along OMR (Old Mahabalipuram Road) generate consistent corporate bookings. TransRentals covers all zones — from Adyar and Velachery to Porur and the northern suburbs.",
    routes: [
      { to: 'Pondicherry', distance: '160 km', duration: '3 hrs', via: 'ECR (East Coast Road)' },
      { to: 'Mahabalipuram', distance: '60 km', duration: '1.5 hrs', via: 'ECR' },
      { to: 'Vellore', distance: '145 km', duration: '3 hrs', via: 'NH48' },
      { to: 'Tirupati', distance: '155 km', duration: '3 hrs', via: 'NH16' },
      { to: 'Coimbatore', distance: '510 km', duration: '8 hrs', via: 'NH544' },
      { to: 'Bangalore', distance: '350 km', duration: '6 hrs', via: 'NH44' },
    ],
    tips: [
      'ECR (East Coast Road) is one of India\'s most scenic coastal highways — ideal for Pondicherry and Mahabalipuram road trips',
      'Anna Salai and OMR see peak congestion 8:30–10 AM and 5:30–8 PM — avoid these for city pickups',
      'Chennai summer (Apr–Jun) is very hot — always book AC vehicles for outstation trips',
      'For Tirupati day trips, start by 4 AM to beat the morning darshan rush and highway traffic',
    ],
    stats: { population: '1.1 Crore', knownFor: 'Auto Hub, Marina Beach, Temple City, Carnatic Music', airport: 'Chennai Intl MAA — 16 km from city' },
    serviceIntros: {
      'car-rental':
        "Chennai's diverse economy — from auto manufacturing to IT and healthcare tourism — generates steady car rental demand. Innova and Ertiga are popular for group outstation trips, while hatchbacks dominate city-use bookings. Medical tourism to Apollo and Fortis hospitals also drives significant cab and rental demand. TransRentals has 80+ verified Chennai vendors offering doorstep delivery across OMR, Anna Nagar, Velachery, and Porur.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Is ECR (East Coast Road) good for road trips from Chennai?', a: 'ECR is one of India\'s best coastal drives. Chennai to Pondicherry (160 km via ECR) is a classic road trip with scenic beaches, fishing villages, and the Auroville ashram en route.' },
        { q: 'What is the best car for Chennai to Coimbatore trip?', a: 'A sedan or SUV works well — NH544 is in good condition. For groups of 6+, an Innova or Ertiga is ideal. The 510 km journey takes 8–9 hrs.' },
        { q: 'Is car rental available near Chennai airport?', a: 'Yes, TransRentals has vendors near Chennai International Airport (MAA) in Tirusulam. Pre-booked pickups are available from both domestic and international terminals.' },
        { q: 'What documents do I need to rent a car in Chennai?', a: 'You need a valid DL, Aadhaar Card or Passport for ID, and a security deposit. For self-drive, DL must be at least 1 year old.' },
        { q: 'Can I rent a car in Chennai for a Tirupati pilgrimage?', a: 'Yes, Chennai to Tirupati is 155 km via NH16 (about 3 hrs). Pilgrimage packages with comfortable AC cabs are available. Book 24–48 hrs in advance for peak season.' },
      ],
    },
  },

  pune: {
    intro:
      "Pune, Maharashtra's cultural and IT capital with 72 lakh residents, is one of India's fastest-growing car rental markets. The city's young IT workforce, prestigious educational institutions, and proximity to the Western Ghats create diverse demand for vehicles. Hinjewadi Tech Park, Baner, and Kharadi are the top corporate pickup zones. TransRentals serves all Pune zones including Shivajinagar, Koregaon Park, Viman Nagar, Pimpri-Chinchwad, and the Pune Airport corridor.",
    routes: [
      { to: 'Mumbai', distance: '150 km', duration: '3 hrs', via: 'Expressway NH48' },
      { to: 'Mahabaleshwar', distance: '120 km', duration: '3 hrs', via: 'NH48 then SH58' },
      { to: 'Shirdi', distance: '185 km', duration: '4 hrs', via: 'NH60' },
      { to: 'Nashik', distance: '210 km', duration: '4 hrs', via: 'NH60' },
      { to: 'Goa', distance: '460 km', duration: '8 hrs', via: 'NH48 then NH748' },
      { to: 'Lonavala', distance: '65 km', duration: '1.5 hrs', via: 'NH48' },
    ],
    tips: [
      'Mumbai-Pune Expressway (NH48) is India\'s first and busiest expressway — leave Pune before 7 AM on weekends to reach Mumbai smoothly',
      'Hinjewadi and Baner face heavy IT traffic 9–10 AM and 6:30–8:30 PM on weekdays',
      'Monsoon (Jun–Aug) is the best season for Mahabaleshwar and Lonavala day trips — scenic waterfalls and cool weather',
      'Book one-way cabs to Mumbai and round trips to Shirdi well in advance during long weekends',
    ],
    stats: { population: '72 Lakh', knownFor: 'IT Hub, Education, Peshwa Heritage, Oxford of the East', airport: 'Pune Airport PNQ — 12 km from city' },
    serviceIntros: {
      'car-rental':
        "Pune's booming IT sector and tourism to nearby hill stations make it Maharashtra's second-largest car rental hub after Mumbai. Swift Dzire and Innova Crysta lead bookings. Hinjewadi and Kharadi are high-density corporate pickup zones. TransRentals provides both self-drive and chauffeur-driven options with 100+ Pune vendors covering all zones.",
      'bike-on-rent':
        "Pune's young IT population has made it India's fastest-growing bike rental city. FC Road, Koregaon Park, and Viman Nagar are top pickup zones. Royal Enfield Himalayan and Thunderbird are most booked for Lonavala and Mahabaleshwar weekend rides. Scooters dominate daily city commute rentals in Hinjewadi and Hadapsar tech corridors.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Pune to Mahabaleshwar?', a: 'Take NH48 towards Mumbai then turn at Paud Road or via Wai. The scenic Panchgani ghat route via Wai (120 km, 3 hrs) is recommended for its viewpoints.' },
        { q: 'Is self-drive available in Pune from early morning?', a: 'Yes, most TransRentals vendors in Pune offer pickups from 6 AM. For Mahabaleshwar or Mumbai day trips, early morning departures are highly recommended.' },
        { q: 'What is the cost of a one-way cab from Pune to Mumbai airport?', a: 'A sedan for the 150 km Pune to Mumbai airport trip typically costs ₹2,000–₹2,800 depending on traffic and time of day. Book at least 2 hours before your departure.' },
        { q: 'Can I take a rental car from Pune to Goa?', a: 'Yes, Pune to Goa (460 km via NH748) is a popular weekend trip. Most vendors allow intercity travel with advance notice. The journey takes about 8 hours.' },
        { q: 'Are weekly car rentals cheaper in Pune?', a: 'Yes, weekly and monthly rentals offer 20–35% discount over daily rates. For long-term stays or extended project assignments in Pune, weekly rental is more economical.' },
      ],
    },
  },

  ahmedabad: {
    intro:
      "Ahmedabad, Gujarat's largest city and India's first UNESCO World Heritage City with 88 lakh residents, has seen rapid growth in its vehicle rental market. The Sarkhej-Gandhinagar Highway (SG Road) and GIFT City corridor dominate corporate demand. Culturally, the Sabarmati Ashram, Adalaj Stepwell, and Kutch region drive strong tourist footfall. TransRentals covers all major zones — from Navrangpura and Satellite to Bopal, Chandkheda, and the Ahmedabad Airport corridor.",
    routes: [
      { to: 'Surat', distance: '270 km', duration: '4.5 hrs', via: 'NH48' },
      { to: 'Vadodara', distance: '110 km', duration: '2 hrs', via: 'NH48' },
      { to: 'Rajkot', distance: '220 km', duration: '4 hrs', via: 'NH947' },
      { to: 'Mount Abu', distance: '225 km', duration: '4 hrs', via: 'NH48 then SH5' },
      { to: 'Dwarka', distance: '450 km', duration: '7.5 hrs', via: 'NH947' },
      { to: 'Rann of Kutch', distance: '400 km', duration: '7 hrs', via: 'NH41' },
    ],
    tips: [
      'SG Road and CG Road face peak congestion 9–10:30 AM and 5:30–8 PM — plan city pickups accordingly',
      'Rann Utsav season (Nov–Feb) creates extremely high demand for vehicles to Kutch — book weeks in advance',
      'Ahmedabad-Vadodara Expressway (NH48) is excellent — 110 km in under 2 hours',
      'For Dwarka and Somnath pilgrimages, night drives (10 PM departure) are preferred to reach by early morning',
    ],
    stats: { population: '88 Lakh', knownFor: 'Textile City, UNESCO Heritage City, Garba, Sabarmati Ashram', airport: 'Sardar Vallabhbhai Patel AMD — 12 km from city' },
  },

  kolkata: {
    intro:
      "Kolkata, West Bengal's capital and India's cultural capital with 1.5 crore residents, has a distinctive vehicle rental market shaped by the city's unique geography and cultural identity. The city's narrow lanes and iconic bridges (Howrah, Vidyasagar Setu) make mid-size sedans and hatchbacks the most practical rentals. TransRentals covers all major zones including Park Street, Salt Lake, Rajarhat, Howrah, and the Netaji Subhash Chandra Bose Airport corridor.",
    routes: [
      { to: 'Digha', distance: '185 km', duration: '4 hrs', via: 'NH16' },
      { to: 'Mandarmani', distance: '170 km', duration: '3.5 hrs', via: 'NH116' },
      { to: 'Santiniketan', distance: '160 km', duration: '3 hrs', via: 'NH2' },
      { to: 'Siliguri', distance: '600 km', duration: '10 hrs', via: 'NH12' },
      { to: 'Puri', distance: '500 km', duration: '9 hrs', via: 'NH16' },
      { to: 'Darjeeling', distance: '660 km', duration: '12 hrs', via: 'NH12' },
    ],
    tips: [
      'Avoid Howrah Bridge and Vivekananda Setu during morning and evening rush hours — use Vidyasagar Setu as alternative',
      'Durga Puja (October) sees massive traffic — book well in advance for this period',
      'Overnight drives to Puri and Digha are popular — book diesel vehicles for fuel efficiency on long highway trips',
      'Rajarhat New Town is the fastest-growing rental hub with IT companies and easy airport access',
    ],
    stats: { population: '1.5 Crore', knownFor: 'Cultural Capital, Howrah Bridge, Durga Puja, Rosogolla', airport: 'Netaji Subhash Chandra Bose CCU — 17 km from city' },
  },

  jaipur: {
    intro:
      "Jaipur, Rajasthan's Pink City and India's top tourist destination with 35 lakh residents, has one of the country's most tourism-driven vehicle rental markets. Amber Fort, Hawa Mahal, City Palace, and Jantar Mantar make Jaipur a must-visit on the Golden Triangle circuit. Corporate demand is growing with the development of Mahindra SEZ and IT parks. TransRentals covers all of Jaipur — from Vaishali Nagar and Mansarovar to C-Scheme, Malviya Nagar, and the Jaipur Airport zone.",
    routes: [
      { to: 'Agra', distance: '240 km', duration: '4 hrs', via: 'NH21' },
      { to: 'Delhi', distance: '280 km', duration: '5 hrs', via: 'NH48' },
      { to: 'Udaipur', distance: '395 km', duration: '6.5 hrs', via: 'NH48 then NH27' },
      { to: 'Jodhpur', distance: '340 km', duration: '6 hrs', via: 'NH62' },
      { to: 'Pushkar', distance: '145 km', duration: '2.5 hrs', via: 'NH58' },
      { to: 'Ranthambore', distance: '180 km', duration: '3 hrs', via: 'NH52' },
    ],
    tips: [
      'Hire a car for the full Golden Triangle circuit (Jaipur–Agra–Delhi) — most vendors offer multi-city packages',
      'Jaipur-Delhi NH48 is in excellent condition — 280 km in 5 hours is achievable',
      'Winter months (Oct–Feb) are peak tourist season — book vehicles well in advance',
      'For Ranthambore safari, early morning departures (5 AM) are best to reach in time for the morning slot',
    ],
    stats: { population: '35 Lakh', knownFor: 'Pink City, Forts, Palaces, Golden Triangle Tourism', airport: 'Jaipur Intl JAI — 13 km from city' },
  },

  lucknow: {
    intro:
      "Lucknow, Uttar Pradesh's capital and the 'City of Nawabs' with 37 lakh residents, is the commercial and administrative hub of North India's heartland. The city's historic Hazratganj, Chowk bazaar, and modern Gomti Nagar IT zone create a unique blend of traditional and corporate rental demand. Government offices and healthcare tourism add significant cab and rental activity. TransRentals covers all Lucknow zones — Gomti Nagar, Hazratganj, Alambagh, Aliganj, and the Chaudhary Charan Singh Airport zone.",
    routes: [
      { to: 'Agra', distance: '330 km', duration: '5.5 hrs', via: 'Agra-Lucknow Expressway' },
      { to: 'Varanasi', distance: '320 km', duration: '5.5 hrs', via: 'NH31' },
      { to: 'Kanpur', distance: '90 km', duration: '1.5 hrs', via: 'NH27' },
      { to: 'Ayodhya', distance: '130 km', duration: '2.5 hrs', via: 'NH27' },
      { to: 'Prayagraj', distance: '210 km', duration: '3.5 hrs', via: 'NH31' },
      { to: 'Delhi', distance: '500 km', duration: '7 hrs', via: 'Lucknow-Agra Expressway' },
    ],
    tips: [
      'Agra-Lucknow Expressway is world-class — 300 km in under 4.5 hours with smooth road',
      'Ayodhya demand has spiked massively after Ram Mandir inauguration — book Ayodhya trips weeks in advance',
      'Gomti Nagar and Vibhuti Khand are cleanest pickup zones with minimal traffic at most hours',
      'Hazratganj area congestion peaks during markets and evening strolls — plan pickups post 9 PM or before 8 AM',
    ],
    stats: { population: '37 Lakh', knownFor: 'City of Nawabs, Tehzeeb, Chikankari, Biryani', airport: 'Chaudhary Charan Singh LKO — 15 km from city' },
  },

  nagpur: {
    intro:
      "Nagpur, Maharashtra's second largest city and the 'Orange City' with 28 lakh residents, is India's geographic center — equidistant from Mumbai, Delhi, Kolkata, and Chennai. This zero-mile city has a growing MIHAN SEZ (aerospace and IT), a major railway junction, and serves as the gateway to Central India's tiger reserves. TransRentals covers all Nagpur zones — from Civil Lines and Dharampeth to Hingna Road, Wardha Road, and the Dr. Babasaheb Ambedkar International Airport area.",
    routes: [
      { to: 'Pench Tiger Reserve', distance: '90 km', duration: '1.5 hrs', via: 'NH44' },
      { to: 'Tadoba Tiger Reserve', distance: '150 km', duration: '3 hrs', via: 'NH930' },
      { to: 'Wardha (Sevagram)', distance: '75 km', duration: '1.5 hrs', via: 'NH361' },
      { to: 'Amravati', distance: '160 km', duration: '3 hrs', via: 'NH53' },
      { to: 'Yavatmal', distance: '170 km', duration: '3 hrs', via: 'NH361' },
      { to: 'Chandrapur', distance: '150 km', duration: '3 hrs', via: 'NH930' },
    ],
    tips: [
      'Nagpur is the zero-mile center of India — all national highways intersect here, making it a strategic outstation hub',
      'Wildlife safari bookings to Pench and Tadoba require early morning departures (4–5 AM)',
      'MIHAN (Multi-modal International Hub Airport) area is fastest growing commercial zone for vehicle rentals',
      'Orange harvesting season (Nov–Jan) sees increased transport demand — book trucks and tempos in advance',
    ],
    stats: { population: '28 Lakh', knownFor: 'Orange City, Zero Mile, Tiger Reserves, MIHAN SEZ', airport: 'Dr. Babasaheb Ambedkar NAG — 8 km from city' },
  },

  indore: {
    intro:
      "Indore, Madhya Pradesh's commercial capital with 35 lakh residents, has earned back-to-back rankings as India's cleanest city. A booming IT sector around Super Corridor, excellent food culture, and proximity to Ujjain (the city of Mahakaleshwar) make Indore a dynamic vehicle rental market. TransRentals covers all Indore zones — from Vijay Nagar and Palasia to South Tukoganj, AB Road, and the Devi Ahilya Bai Holkar Airport corridor.",
    routes: [
      { to: 'Ujjain', distance: '55 km', duration: '1 hr', via: 'SH-27' },
      { to: 'Omkareshwar', distance: '80 km', duration: '2 hrs', via: 'NH52' },
      { to: 'Mandu', distance: '100 km', duration: '2 hrs', via: 'SH-28' },
      { to: 'Bhopal', distance: '195 km', duration: '3.5 hrs', via: 'NH46' },
      { to: 'Maheshwar', distance: '95 km', duration: '2 hrs', via: 'NH52' },
      { to: 'Patalpani', distance: '35 km', duration: '45 min', via: 'Mhow Road' },
    ],
    tips: [
      'Ujjain Mahakaleshwar visits peak during Shravan (July–Aug) and Maha Shivaratri — book 2–3 weeks in advance',
      'Super Corridor area has new roads and minimal traffic — best for airport pickups and tech park commutes',
      'Indore-Bhopal NH46 is one of MP\'s best national highways — 195 km in 3.5 hours consistently',
      'Weekend trips to Maheshwar and Mandu are easily doable as day trips — leave by 7 AM',
    ],
    stats: { population: '35 Lakh', knownFor: "India's Cleanest City, Street Food Hub, Super Corridor IT", airport: 'Devi Ahilya Bai Holkar IDR — 8 km from city' },
  },

  bhopal: {
    intro:
      "Bhopal, Madhya Pradesh's capital and the 'City of Lakes' with 24 lakh residents, offers a mix of government administrative demand and growing IT activity around Hoshangabad Road. The twin lakes (Upper and Lower Lake), heritage sites, and proximity to Sanchi Stupa and Bhimbetka rock shelters make it a significant tourist hub. TransRentals covers all Bhopal zones — MP Nagar, Arera Colony, Kolar Road, and Habibganj Railway Station and Airport areas.",
    routes: [
      { to: 'Sanchi', distance: '46 km', duration: '1 hr', via: 'NH12' },
      { to: 'Indore', distance: '195 km', duration: '3.5 hrs', via: 'NH46' },
      { to: 'Panchmarhi', distance: '195 km', duration: '4 hrs', via: 'NH69' },
      { to: 'Bhimbetka', distance: '45 km', duration: '1 hr', via: 'NH46' },
      { to: 'Pachmarhi', distance: '195 km', duration: '4 hrs', via: 'NH69' },
      { to: 'Jabalpur', distance: '325 km', duration: '5.5 hrs', via: 'NH30' },
    ],
    tips: [
      'Sanchi Stupa is a UNESCO site just 46 km from Bhopal — easily doable as a half-day trip',
      'Panchmarhi (Satpura Hill Station) weekend trips are extremely popular — book SUVs for the ghats',
      'MP Nagar and DB City Mall areas have the highest density of TransRentals pickup points',
      'Monsoon (Jul–Sep) transforms Bhopal\'s surroundings — best time for a Pachmarhi or Bhimbetka road trip',
    ],
    stats: { population: '24 Lakh', knownFor: 'City of Lakes, State Capital, Bhimbetka, Sanchi', airport: 'Raja Bhoj BHO — 13 km from city' },
  },

  chandigarh: {
    intro:
      "Chandigarh, the joint capital of Punjab and Haryana with 12 lakh residents, is India's first planned city and consistently ranks among the country's cleanest and most livable cities. Le Corbusier's grid layout, wide boulevards, and Sector markets make it a pleasant city for rentals. Proximity to Shimla (90 km), Manali (310 km), and Amritsar (230 km) makes Chandigarh a major hub for Himachal Pradesh hill station road trips. TransRentals covers all sectors, Panchkula, Mohali, and the Chandigarh Airport area.",
    routes: [
      { to: 'Shimla', distance: '90 km', duration: '2.5 hrs', via: 'NH5' },
      { to: 'Manali', distance: '310 km', duration: '7 hrs', via: 'NH21' },
      { to: 'Amritsar', distance: '230 km', duration: '4 hrs', via: 'NH44' },
      { to: 'Delhi', distance: '260 km', duration: '4.5 hrs', via: 'NH44' },
      { to: 'Kasauli', distance: '65 km', duration: '1.5 hrs', via: 'NH5' },
      { to: 'Pinjore Gardens', distance: '20 km', duration: '30 min', via: 'SH-21' },
    ],
    tips: [
      'Chandigarh-Shimla route (NH5) is extremely scenic but has sharp curves after Dharampur — drive carefully in monsoon',
      'Manali trip: departure by 4 AM from Chandigarh ensures you reach before dark',
      'Chandigarh grid roads are wide and smooth — very easy city navigation, even for outstation visitors',
      'Winter (Dec–Feb) brings snowfall to Shimla and Kasauli — chains or SUVs recommended for hill trips',
    ],
    stats: { population: '12 Lakh', knownFor: "India's First Planned City, Rock Garden, Sukhna Lake, Proximity to Hills", airport: 'Chandigarh Intl IXC — 12 km from city' },
  },

  coimbatore: {
    intro:
      "Coimbatore, Tamil Nadu's industrial powerhouse and the 'Manchester of South India' with 22 lakh residents, is a major textile and engineering hub with rapidly growing IT and healthcare sectors. Its location at the foot of the Nilgiris makes it the prime gateway to Ooty and Munnar. TransRentals covers all Coimbatore zones — from RS Puram and Gandhipuram to Saibaba Colony, Peelamedu, and the Coimbatore Airport area.",
    routes: [
      { to: 'Ooty', distance: '85 km', duration: '2.5 hrs', via: 'Mettupalayam Ghat Road' },
      { to: 'Munnar', distance: '155 km', duration: '4 hrs', via: 'NH544' },
      { to: 'Kodaikanal', distance: '175 km', duration: '4 hrs', via: 'NH44' },
      { to: 'Palani', distance: '100 km', duration: '2 hrs', via: 'NH544' },
      { to: 'Chennai', distance: '510 km', duration: '8 hrs', via: 'NH544' },
      { to: 'Bangalore', distance: '360 km', duration: '6 hrs', via: 'NH948' },
    ],
    tips: [
      'Ooty via Mettupalayam ghat road is scenic but has 36 hairpin bends — avoid during heavy rains',
      'Munnar is technically in Kerala but easily accessible from Coimbatore via Chalakudy Road',
      'Coimbatore-Ooty is most crowded on weekends and during Tamil Nadu/Kerala school vacations — plan mid-week trips',
      'Industrial zones in Peelamedu and SIPCOT see high corporate pickup demand on weekdays',
    ],
    stats: { population: '22 Lakh', knownFor: "Manchester of South India, Textile Hub, Gateway to Nilgiris", airport: 'Coimbatore Intl CJB — 10 km from city' },
  },

  kochi: {
    intro:
      "Kochi, Kerala's commercial capital and a vibrant port city with 22 lakh residents, blends history, IT, and thriving marine activity. Fort Kochi's colonial heritage, the Cochin International Airport (India's first solar-powered airport), and the booming Infopark and Kakkanad IT corridor drive diverse rental demand. Backwater tours from Alleppey and the Munnar hill station are classic road trip routes. TransRentals serves all Kochi zones — Ernakulam, Fort Kochi, Kakkanad, Edappally, and the airport area.",
    routes: [
      { to: 'Munnar', distance: '130 km', duration: '3.5 hrs', via: 'NH85' },
      { to: 'Alleppey (Alappuzha)', distance: '55 km', duration: '1.5 hrs', via: 'NH66' },
      { to: 'Thekkady (Periyar)', distance: '190 km', duration: '4.5 hrs', via: 'NH183' },
      { to: 'Thrissur', distance: '80 km', duration: '2 hrs', via: 'NH544' },
      { to: 'Coimbatore', distance: '190 km', duration: '4 hrs', via: 'NH544' },
      { to: 'Varkala', distance: '155 km', duration: '3 hrs', via: 'NH66' },
    ],
    tips: [
      'Kochi traffic is manageable except Edappally and MG Road junctions during office hours — avoid 8:30–10 AM',
      'Monsoon (Jun–Aug) is Kerala\'s best season — plan Munnar and Wayanad trips for stunning waterfalls and mist',
      'Cochin Airport is Kerala\'s busiest — book airport pickups minimum 2 hours before flight for reliable service',
      'For Alleppey backwater houseboats, book a cab for the 55 km drive and arrange the boat separately',
    ],
    stats: { population: '22 Lakh', knownFor: "Queen of the Arabian Sea, IT Hub, Fort Kochi Heritage, Cochin Port", airport: "Cochin Intl COK — 30 km from city center" },
  },

  mysore: {
    intro:
      "Mysore, Karnataka's cultural capital and the 'City of Palaces' with 10 lakh residents, is one of India's top tourist destinations. The magnificent Mysore Palace, Chamundi Hills, Brindavan Gardens, and the world-famous Mysore Dasara festival draw lakhs of visitors annually. Proximity to Bangalore (150 km) makes Mysore a popular weekend destination. TransRentals covers all Mysore zones — Vijayanagar, Saraswathipuram, Nazarbad, and the Mysore Airport area.",
    routes: [
      { to: 'Bangalore', distance: '150 km', duration: '3 hrs', via: 'Mysore Road NH275' },
      { to: 'Ooty', distance: '125 km', duration: '3.5 hrs', via: 'Bandipur-Gudalore Road' },
      { to: 'Coorg (Madikeri)', distance: '115 km', duration: '3 hrs', via: 'Hunsur Road' },
      { to: 'Wayanad', distance: '120 km', duration: '3.5 hrs', via: 'Gundlupet Road' },
      { to: 'Hassan', distance: '118 km', duration: '2.5 hrs', via: 'NH275' },
      { to: 'Belur-Halebidu', distance: '165 km', duration: '3.5 hrs', via: 'Hassan Road' },
    ],
    tips: [
      'Dasara season (September–October) sees massive tourist influx — book vehicles weeks in advance',
      'Ooty road via Bandipur goes through the wildlife sanctuary — keep windows up and maintain 40 km/h',
      'Mysore-Bangalore road is the best highway in Karnataka — smooth and well-lit throughout',
      'Early morning rides to Chamundi Hills (before 7 AM) offer the best sunrise views with minimal crowd',
    ],
    stats: { population: '10 Lakh', knownFor: 'City of Palaces, Mysore Dasara, Sandalwood, Mysore Pak', airport: 'Mysore Airport MYQ — 10 km from city' },
  },

  guwahati: {
    intro:
      "Guwahati, Assam's capital and the gateway to Northeast India with 12 lakh residents, is the commercial and transport hub for all seven sister states. The Brahmaputra River, Kamakhya Temple, and the rapidly growing Lokhra-Beltola IT corridor drive diverse rental demand. As the entry point for Meghalaya, Arunachal Pradesh, and Sikkim tourism, Guwahati generates significant outstation and tourist rental activity. TransRentals covers Guwahati and neighboring districts with a growing fleet.",
    routes: [
      { to: 'Shillong', distance: '100 km', duration: '2.5 hrs', via: 'NH6' },
      { to: 'Kaziranga', distance: '195 km', duration: '4 hrs', via: 'NH15' },
      { to: 'Tezpur', distance: '183 km', duration: '4 hrs', via: 'NH15' },
      { to: 'Cherrapunji', distance: '190 km', duration: '5 hrs', via: 'NH6 then Shillong' },
      { to: 'Hajo', distance: '35 km', duration: '1 hr', via: 'NH27' },
      { to: 'Siliguri', distance: '420 km', duration: '8 hrs', via: 'NH27' },
    ],
    tips: [
      'Guwahati-Shillong NH6 is scenic but has sharp curves and narrow sections — SUVs are safer than sedans',
      'Kaziranga rhino safari best season is Nov–April; monsoon roads to wildlife areas can be challenging',
      'Kamakhya Temple sees huge rush during Ambubachi Mela (June) — plan arrivals early morning',
      'Northeast India roads can be rough outside NH stretches — prefer SUVs or 4WDs for rural areas',
    ],
    stats: { population: '12 Lakh', knownFor: 'Gateway to Northeast India, Brahmaputra, Kamakhya Temple, Kaziranga', airport: 'Lokpriya Gopinath Bordoloi GAU — 23 km from city' },
  },

  amritsar: {
    intro:
      "Amritsar, Punjab's spiritual heart and a city of immense historical significance with 14 lakh residents, is one of India's most visited pilgrimage destinations. The Golden Temple (Harmandir Sahib) draws 1 lakh+ devotees daily, making it busier than the Taj Mahal. Wagah Border ceremony, Jallianwala Bagh, and a rich culinary heritage add to the city's appeal. TransRentals covers all Amritsar zones — from Hall Bazaar and Ranjit Avenue to GT Road and the Sri Guru Ram Dass Jee Airport area.",
    routes: [
      { to: 'Chandigarh', distance: '230 km', duration: '4 hrs', via: 'NH44' },
      { to: 'Delhi', distance: '450 km', duration: '8 hrs', via: 'NH44' },
      { to: 'Pathankot', distance: '110 km', duration: '2 hrs', via: 'NH354' },
      { to: 'Wagah Border', distance: '30 km', duration: '45 min', via: 'GT Road' },
      { to: 'Dalhousie', distance: '190 km', duration: '4 hrs', via: 'Pathankot Road' },
      { to: 'Dharamshala', distance: '225 km', duration: '4.5 hrs', via: 'NH154' },
    ],
    tips: [
      'Golden Temple visit: Early morning (4–6 AM) has the most spiritual atmosphere and least crowds',
      'Wagah Border ceremony is at sunset (around 5–5:30 PM in winter, 6–6:30 PM in summer) — plan accordingly',
      'Amritsar-Chandigarh NH44 is a wide 4-lane highway — comfortable 4-hour drive',
      'High demand during Baisakhi (April 13–14) and Diwali — book weeks in advance',
    ],
    stats: { population: '14 Lakh', knownFor: 'Golden Temple, Wagah Border, Jallianwala Bagh, Punjabi Cuisine', airport: 'Sri Guru Ram Dass Jee ATQ — 11 km from city' },
  },

  varanasi: {
    intro:
      "Varanasi, Uttar Pradesh's spiritual capital and one of the world's oldest living cities with 15 lakh residents, is the ultimate pilgrimage destination in India. The ghats along the Ganges, Kashi Vishwanath Temple, and the sacred Ganga Aarti draw millions of devotees and tourists annually. As the spiritual epicenter of Hinduism, Varanasi sees consistent year-round rental demand for pilgrimage circuits including Sarnath, Ayodhya, and Prayagraj. TransRentals covers Varanasi city, Sarnath, and the Lal Bahadur Shastri Airport area.",
    routes: [
      { to: 'Prayagraj', distance: '125 km', duration: '2.5 hrs', via: 'NH19' },
      { to: 'Ayodhya', distance: '200 km', duration: '4 hrs', via: 'NH19 then NH27' },
      { to: 'Sarnath', distance: '12 km', duration: '30 min', via: 'Local road' },
      { to: 'Lucknow', distance: '320 km', duration: '5.5 hrs', via: 'NH31' },
      { to: 'Bodhgaya', distance: '280 km', duration: '5 hrs', via: 'NH19' },
      { to: 'Chitrakoot', distance: '280 km', duration: '5 hrs', via: 'NH35' },
    ],
    tips: [
      'Old city lanes near ghats are extremely narrow — only small hatchbacks and e-rickshaws navigate easily',
      'Pre-dawn Ganga Aarti (4:30–5 AM) and evening Aarti (6–7 PM) are peak tourist times — plan pickups outside these windows',
      'Maha Kumbh Prayagraj (Jan–Feb) creates massive regional demand — book months in advance',
      'Kashi Vishwanath corridor is now walkable — drop vehicles at designated parking near Godowlia Chowk',
    ],
    stats: { population: '15 Lakh', knownFor: "City of Light, Ganga Ghats, Kashi Vishwanath, World's Oldest City", airport: 'Lal Bahadur Shastri VNS — 26 km from city' },
  },

  agra: {
    intro:
      "Agra, Uttar Pradesh's crown jewel with 18 lakh residents, is home to three UNESCO World Heritage Sites — Taj Mahal, Agra Fort, and Fatehpur Sikri. As the centrepiece of India's Golden Triangle tourist circuit (Delhi–Agra–Jaipur), Agra sees over 65 lakh domestic and foreign visitors annually. Vehicle rentals serve the monument circuit, inter-city travel, and the Braj region pilgrimage circuit. TransRentals covers Agra city, Fatehpur Sikri road, and the Agra Airport zone.",
    routes: [
      { to: 'Delhi', distance: '230 km', duration: '4 hrs', via: 'Yamuna Expressway NH19' },
      { to: 'Jaipur', distance: '240 km', duration: '4 hrs', via: 'NH21' },
      { to: 'Fatehpur Sikri', distance: '40 km', duration: '1 hr', via: 'NH21' },
      { to: 'Mathura', distance: '60 km', duration: '1 hr', via: 'NH2' },
      { to: 'Lucknow', distance: '330 km', duration: '5.5 hrs', via: 'Agra-Lucknow Expressway' },
      { to: 'Gwalior', distance: '120 km', duration: '2.5 hrs', via: 'NH44' },
    ],
    tips: [
      'Taj Mahal gates open at sunrise (6 AM) — arrive 30 min before for the best light and smallest crowds',
      'Yamuna Expressway (Delhi–Agra) is one of India\'s best highways — 230 km in under 4 hours',
      'Taj Mahal, Agra Fort, and Fatehpur Sikri can all be covered in a 10-hour day trip from Delhi or Jaipur',
      'Avoid Agra-Jaipur NH21 during fog season (Dec–Jan) — visibility drops to near zero in early mornings',
    ],
    stats: { population: '18 Lakh', knownFor: 'Taj Mahal, Agra Fort, Golden Triangle, Petha Sweet', airport: 'Agra Airport AGR — 8 km from city' },
  },

  nashik: {
    intro:
      "Nashik, Maharashtra's 'Wine Capital' and one of India's fastest-growing cities with 20 lakh residents, uniquely blends wine tourism, Hindu pilgrimage, and an emerging manufacturing hub. The Shirdi temple proximity, Trimbakeshwar Jyotirlinga, and Sula Vineyards make it a diverse tourist and pilgrimage destination. Kumbh Mela (held every 12 years) brings millions of pilgrims. TransRentals covers all Nashik zones — Gangapur Road, Nashik Road, College Road, and the Nashik Airport area.",
    routes: [
      { to: 'Mumbai', distance: '170 km', duration: '3.5 hrs', via: 'NH160' },
      { to: 'Shirdi', distance: '90 km', duration: '2 hrs', via: 'NH60' },
      { to: 'Pune', distance: '210 km', duration: '4 hrs', via: 'NH60' },
      { to: 'Trimbakeshwar', distance: '30 km', duration: '45 min', via: 'SH-10' },
      { to: 'Aurangabad', distance: '250 km', duration: '4.5 hrs', via: 'NH752' },
      { to: 'Igatpuri', distance: '45 km', duration: '1 hr', via: 'NH160' },
    ],
    tips: [
      'Shirdi darshan peak hours are 6–9 AM and 6–8 PM — arrive during off-peak times for shorter queues',
      'Sula Vineyards wine trail is best during harvest festival (Feb) — book vehicles for the 15 km vineyard circuit',
      'Nashik-Mumbai highway (NH160) involves the scenic Kasara Ghat — drive carefully during monsoon',
      'Kumbh Mela years see impossible traffic in central Nashik — book outskirts pickup points',
    ],
    stats: { population: '20 Lakh', knownFor: "Wine Capital of India, Shirdi Gateway, Trimbakeshwar, Kumbh Mela", airport: 'Ozar Airport ISK — 25 km from city' },
  },

  visakhapatnam: {
    intro:
      "Visakhapatnam (Vizag), Andhra Pradesh's largest city and India's eastern naval hub with 23 lakh residents, combines a scenic coastline with rapidly growing industrial and IT sectors. The 'Jewel of the East Coast' features pristine beaches (RK Beach, Rushikonda), the Eastern Ghats, Araku Valley, and a major port. TransRentals covers all Vizag zones — Dwaraka Nagar, MVP Colony, Gajuwaka, and the Vizag Airport area.",
    routes: [
      { to: 'Araku Valley', distance: '120 km', duration: '3.5 hrs', via: 'NH516' },
      { to: 'Borra Caves', distance: '90 km', duration: '2.5 hrs', via: 'NH516' },
      { to: 'Bheemunipatnam', distance: '25 km', duration: '45 min', via: 'Beach Road' },
      { to: 'Vijayawada', distance: '355 km', duration: '6 hrs', via: 'NH16' },
      { to: 'Hyderabad', distance: '620 km', duration: '10 hrs', via: 'NH65' },
      { to: 'Lambasingi', distance: '100 km', duration: '3 hrs', via: 'NH516' },
    ],
    tips: [
      'Araku Valley ghat road is one of Andhra\'s most scenic drives — avoid peak monsoon for safety',
      'Vizag-Vijayawada NH16 is an excellent coastal expressway — 355 km in under 6 hours',
      'RK Beach Road is the best morning drive in Vizag — cool breeze and minimal traffic before 8 AM',
      'Lambasingi (Andhra\'s Kashmir) is best visited October–January when temperature drops to 0–5°C',
    ],
    stats: { population: '23 Lakh', knownFor: 'Jewel of the East Coast, Naval Base, Araku Valley, Steel City', airport: 'Vizag Airport VTZ — 16 km from city' },
  },

  rajkot: {
    intro:
      "Rajkot, Gujarat's fourth-largest city and one of India's cleanest cities with 17 lakh residents, is the commercial heart of Saurashtra with a booming SME and engineering sector. As the birthplace of Mahatma Gandhi's early life (Rajkot was his hometown during schooling), it holds historical significance. Proximity to Somnath, Dwarka, and Gir Forest makes it a key pilgrim and wildlife tourism hub. TransRentals covers all Rajkot zones — Kalawad Road, Gondal Road, 150 Feet Ring Road, and the Rajkot Airport area.",
    routes: [
      { to: 'Dwarka', distance: '240 km', duration: '4.5 hrs', via: 'NH947' },
      { to: 'Somnath', distance: '210 km', duration: '4 hrs', via: 'NH27' },
      { to: 'Gir Forest', distance: '165 km', duration: '3 hrs', via: 'NH27' },
      { to: 'Ahmedabad', distance: '220 km', duration: '4 hrs', via: 'NH947' },
      { to: 'Jamnagar', distance: '90 km', duration: '1.5 hrs', via: 'NH947' },
      { to: 'Porbandar', distance: '120 km', duration: '2.5 hrs', via: 'NH27' },
    ],
    tips: [
      'Gir Lion safari slots are limited — book safari tickets online weeks in advance, arrive by 5 AM',
      'Dwarka-Somnath circuit is best covered in 2 days with overnight stay at either city',
      'Rajkot-Ahmedabad NH947 is in excellent condition — wide 4-lane highway with good rest stops',
      'Gujarat dry state: Alcohol not available — inform out-of-state guests booking multi-day trips',
    ],
    stats: { population: '17 Lakh', knownFor: "Gandhi's Hometown, Saurashtra Hub, Engineering SMEs, Gir Gateway", airport: 'Rajkot Airport RAJ — 8 km from city' },
  },
};

// ─── STATE FALLBACK DATA ──────────────────────────────────────────────────────

export const STATE_SEO: Record<string, StateSEO> = {
  MH: {
    intro:
      "Maharashtra, India's most industrialized state, offers exceptional road connectivity across its 36 districts. From the Konkan coast to the Vidarbha plateau, the state's highway network supports seamless travel between Mumbai, Pune, Nashik, Nagpur, and Aurangabad. Major pilgrimage routes to Shirdi, Trimbakeshwar, and Pandharpur, scenic drives through the Western Ghats, and the Ajanta-Ellora UNESCO heritage corridor make Maharashtra one of India's top road trip destinations.",
    tips: [
      'Maharashtra roads (NH and SH) are generally well-maintained — most major routes have 4-lane sections',
      'Monsoon (Jun–Sep) is most scenic but ghats can be slippery — exercise extra caution on coastal and ghat roads',
      'Shirdi, Trimbakeshwar, and Pandharpur are top pilgrimage destinations — book well in advance for festival dates',
    ],
  },
  RJ: {
    intro:
      "Rajasthan, the Land of Kings, stretches across India's largest state with 33 districts and an unmatched heritage tourism circuit. The Golden Triangle extension to Jaipur, the Thar Desert, and the walled cities of Jodhpur, Udaipur, Jaisalmer, and Bikaner make it India's top tourism state by foreign visitors. Rajasthan's NH network connects major cities efficiently, and camel-country roads make SUVs the preferred rental vehicle for desert and rural areas.",
    tips: [
      'Rajasthan summers (Apr–Jun) are extremely hot — always carry extra water and book AC vehicles',
      'Desert roads to Jaisalmer and Sam Sand Dunes require SUVs for sand track sections',
      'Heritage circuit (Jaipur–Jodhpur–Jaisalmer–Udaipur) is best covered in 7–10 days by road',
    ],
  },
  KA: {
    intro:
      "Karnataka offers one of South India's most diverse travel landscapes — from the IT metropolis of Bangalore to the historic ruins of Hampi, the coffee-scented Coorg highlands, coastal Karnataka's beaches, and the tiger reserves of Nagarhole and Bandipur. The state has invested heavily in highway infrastructure, and most major cities are connected by smooth 4-lane NHs. Karnataka's Malnad region and the Western Ghats are best explored by self-drive vehicles or chauffeur-driven SUVs.",
    tips: [
      "Karnataka's NH44 (Bangalore–Chennai and Bangalore–Hyderabad) is one of India's best intercity highways",
      'Wildlife sanctuaries (Nagarhole, Bandipur, Bhadra) require forest department entry permits — book in advance',
      'Monsoon transforms the Western Ghats — Coorg and Chikkamagaluru are breathtaking June to September',
    ],
  },
  TN: {
    intro:
      "Tamil Nadu, with a 1,076 km coastline and deep Dravidian heritage, is a state of magnificent temples, hill stations, and industrial dynamism. The state's four metro cities (Chennai, Coimbatore, Madurai, Tiruchirappalli) are well-connected by NHs, while the Nilgiri hills offer India's most scenic ghat roads. The temple circuit of Madurai, Rameswaram, Thanjavur, and Kanchipuram is a prime road trip itinerary for devotees and heritage tourists alike.",
    tips: [
      'East Coast Road (ECR) from Chennai to Kanyakumari is one of India\'s most scenic coastal drives',
      'Nilgiris ghat roads are steep and curvy — drive carefully, especially in fog and monsoon',
      'Tamil Nadu pilgrimage circuits are very popular — book vehicles 48 hours in advance for festival seasons',
    ],
  },
  UP: {
    intro:
      "Uttar Pradesh, India's most populous state, encompasses the sacred geography of the Ganges-Yamuna doab, the pilgrimage trinity of Varanasi–Prayagraj–Ayodhya, and the tourism crown of the Taj Mahal at Agra. The Agra-Lucknow Expressway and Yamuna Expressway are among India's best highways, connecting major cities at highway speeds. The state sees enormous pilgrimage traffic for Kumbh Mela, Diwali at Ayodhya, and year-round Varanasi Ganga Aarti visits.",
    tips: [
      'Agra-Lucknow Expressway (302 km) is UP\'s showcase highway — 6-lane and well-lit throughout',
      'Kumbh Mela years (Prayagraj): book vehicles months in advance — traffic is overwhelming',
      'Winters (Dec–Jan) bring dense fog to UP highways — avoid overnight highway driving in these months',
    ],
  },
  GJ: {
    intro:
      "Gujarat, India's western gateway state, combines thriving industrial output (Surat textiles, Rajkot engineering, Ahmedabad pharma) with exceptional religious and wildlife tourism. The Somnath and Dwarka pilgrimage circuit, Gir Forest (home to Asiatic lions), the Rann of Kutch (world's largest salt flat), and the Sabarmati Ashram draw millions annually. Gujarat's road infrastructure is among India's best — smooth, wide, and well-maintained across all 33 districts.",
    tips: [
      'Gujarat is a dry state — no alcohol available; inform guests booking multi-day trips',
      'Gir Lion Safari slots are limited — book online 2–3 months in advance for peak season (Oct–May)',
      'Rann Utsav (Nov–Feb) near Bhuj has severely limited accommodation — book vehicles and hotels together months in advance',
    ],
  },
  KL: {
    intro:
      "Kerala, God's Own Country, offers India's most photogenic road trip experiences — backwater-lined highways, spice-scented Wayanad hills, Munnar tea gardens, and pristine Kovalam beaches. The state's NH66 coastal highway (formerly NH47) runs the length of Kerala, connecting Kasaragod to Thiruvananthapuram through 550 km of scenic landscapes. Monsoon (June–August) transforms Kerala's countryside and is increasingly popular for eco-tourism road trips.",
    tips: [
      'NH66 (coastal highway) connects all of Kerala — one of India\'s most scenic national highways',
      'Kerala roads in hill areas (Wayanad, Munnar) are narrow and winding — SUVs are strongly recommended',
      'Monsoon roads through forests can have landslide risk — check NHAI alerts before hill trips',
    ],
  },
  PB: {
    intro:
      "Punjab, the Land of Five Rivers and India's granary, is a land of vibrant culture, Sikh heritage, and agricultural prosperity. The Golden Temple at Amritsar, Wagah Border ceremony, and the historic battlefields of Panipat attract tourists from across India and abroad. Punjab's roads are among North India's best — wide, smooth, and unencumbered. The NH44 Delhi-Amritsar corridor is fully 6-lane, making Punjab highly accessible by road from the capital.",
    tips: [
      'NH44 Delhi to Amritsar is a smooth 450 km drive — doable in 7–8 hours including stops',
      'Amritsar Golden Temple: Early morning (4–6 AM) langar and prayer is the most spiritual experience',
      'Punjab summers (May–Jun) are very hot — book AC vehicles and carry water for long highway drives',
    ],
  },
  MP: {
    intro:
      "Madhya Pradesh, the 'Heart of India', is a state of remarkable natural and cultural diversity — from the medieval temples of Khajuraho and Sanchi's Buddhist stupas to Kanha-Bandhavgarh tiger reserves and the Marble Rocks of Jabalpur. The state's highways have improved dramatically in recent years. Bhopal-Indore NH46, Bhopal-Jabalpur NH30, and the Agra-Mumbai highway (NH3) are key arteries for tourism and logistics.",
    tips: [
      'Tiger reserves (Kanha, Bandhavgarh, Pench, Satpura) require early departures — safaris open at 6 AM',
      'Madhya Pradesh roads in forest areas can be rough — SUVs preferred for wildlife destination trips',
      'Khajuraho is 8 hours from Bhopal — consider fly-in, rent-car-out approach for this heritage site',
    ],
  },
  WB: {
    intro:
      "West Bengal stretches from the Sundarbans mangroves to the Himalayan foothills of Darjeeling and the industrial Durgapur-Asansol belt. Kolkata, the cultural capital, generates most of the state's rental demand, while North Bengal (Siliguri, Darjeeling, Kalimpong) sees heavy tourist rental activity. Mountain roads in the Darjeeling-Sikkim circuit require 4WD vehicles during monsoon. West Bengal's NH network is expanding rapidly with highway upgrades.",
    tips: [
      'Darjeeling-Gangtok circuit: 4WD vehicles are mandatory in monsoon (Jun–Sep) due to landslide risk',
      'Kolkata roads are challenging — narrow, potholed in many areas, and congested — plan extra travel time',
      'Sundarbans access requires boats — book a cab only until Godkhali jetty (80 km from Kolkata)',
    ],
  },
  TS: {
    intro:
      "Telangana, India's newest state, has established itself as a major IT and pharmaceutical hub centered around Hyderabad's HITECH City. The state's second-tier cities — Warangal, Nizamabad, and Karimnagar — are growing rapidly. Temple circuits to Yadagirigutta, Srisailam (shared with AP), and Vemulawada attract pilgrims, while wildlife sanctuaries at Nagarjunasagar offer nature tourism. Telangana's ORR (Outer Ring Road) is one of India's finest urban highways.",
    tips: [
      "Hyderabad's ORR connects all major zones — use it for faster inter-zone and airport travel",
      'Srisailam dam road (via Nallamala forest) has a night vehicle ban — plan accordingly',
      'Summer in Telangana (Apr–Jun) is extremely hot — always book AC vehicles for any trip above 2 hours',
    ],
  },
  HR: {
    intro:
      "Haryana, surrounding Delhi on three sides, is the industrial and agricultural backbone of the NCR. The Gurugram-Manesar-Faridabad industrial corridor hosts India's largest auto manufacturing cluster, driving high demand for commercial transport. Proximity to Delhi means Haryana cities offer competitive vehicle rental rates. The state's NH network, including the Delhi-Chandigarh NH44, is excellent and well-maintained throughout.",
    tips: [
      'Gurugram and Faridabad are effectively part of Delhi NCR — same-day cross-city rentals are common',
      'Kurukshetra (site of Mahabharata) is 160 km from Delhi — popular pilgrimage day trip destination',
      'NH44 (Delhi to Chandigarh) through Haryana is 6-lane — one of India\'s finest highway stretches',
    ],
  },
  BR: {
    intro:
      "Bihar, India's spiritual heartland, encompasses the Buddhist triangle of Bodh Gaya–Rajgir–Nalanda, the Hindu pilgrimages of Vaishali and Sitamarhi, and the Ganges river plain. Patna, the state capital, is Bihar's commercial and transport hub. Bodh Gaya attracts Buddhist pilgrims and tourists from Japan, Sri Lanka, Thailand, and Myanmar in large numbers. Bihar's road infrastructure is improving rapidly with PMGSY and highway projects.",
    tips: [
      'Bodh Gaya is 115 km from Patna — an easy 2.5-hour drive via NH139',
      'Bihar winters (Nov–Feb) are prime tourist season for Buddhist circuit visits',
      'Roads in rural Bihar can be rough — SUVs are recommended for district-level travel',
    ],
  },
  OR: {
    intro:
      "Odisha (formerly Orissa) is a state of magnificent temples, pristine beaches, and tribal cultural heritage. The Puri-Konark-Bhubaneswar Golden Triangle is one of India's most famous tourism circuits. Chilika Lake (Asia's largest brackish lake), Simlipal Tiger Reserve, and the Jagannath Rath Yatra festival draw massive visitor numbers. Odisha's coastal highway (NH16) and inland routes have seen significant upgrades in recent years.",
    tips: [
      'Puri-Konark road via Marine Drive is scenic and well-maintained — perfect for a morning drive',
      'Jagannath Rath Yatra in Puri (June–July) sees millions of devotees — book weeks in advance',
      'Odisha roads in interior tribal areas (Koraput, Bastar border) can be challenging — prefer 4WD',
    ],
  },
  AS: {
    intro:
      "Assam, the gateway to India's Northeast, is a state of extraordinary biodiversity, tea gardens, and Brahmaputra river culture. Guwahati serves as the logistics hub for all seven sister states. Kaziranga (one-horned rhino), Manas Tiger Reserve, and Majuli (world's largest river island) are Assam's top wildlife and cultural destinations. Assam's NH network connects Guwahati to all major Northeast cities, though roads in hill areas can be challenging.",
    tips: [
      'Kaziranga and Manas Wildlife Sanctuaries: Best season is Nov–April when water levels are low',
      'Assam roads in hill districts (Karbi Anglong, Dima Hasao) are challenging — SUVs essential',
      'Brahmaputra ferries still operate on some routes — confirm vehicle crossing availability before planning',
    ],
  },
};
