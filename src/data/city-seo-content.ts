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

export type CityAttraction = {
  name: string;
  category: string; // e.g. Heritage, Nature, Food & Shopping, Family
  description: string;
  distance?: string; // approx distance/time from city center
};

export type CitySEO = {
  intro: string;
  routes: CityRoute[];
  tips: string[];
  stats: { population: string; knownFor: string; airport: string };
  serviceIntros?: Partial<Record<string, string>>;
  serviceFAQs?: Partial<Record<string, CityFAQ[]>>;
  thingsToDo?: CityAttraction[];
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
        "Mumbai — India's financial capital — sees constant relocation pressure driven by job changes in banking, media, and IT, making it one of the country's busiest cities for packers and movers. The most common intra-city move corridors are Andheri to Thane, Bandra to Navi Mumbai, and the Western suburbs (Borivali, Kandivali, Malad, Goregaon) to the Harbour line belt (Chembur, Kurla, Ghatkopar, Vikhroli). Peak shifting season falls in March–April (financial year-end) and just before Ganesh Chaturthi, while intercity routes to Pune, Nashik, and Goa stay busy year-round; monsoon (June–September) brings added challenge with narrow flooded lanes and high-rise access delays. TransRentals-verified movers operate across Andheri, Bandra, Borivali, Thane, Navi Mumbai, Powai, Worli, Juhu, Malad, Goregaon, Kandivali, Chembur, Kurla, Dadar, Mulund, Vikhroli, Ghatkopar, Vashi, Kharghar, and Panvel. Get a free quote today and book a fully insured moving team in under 2 minutes.",
      'transporter':
        "Mumbai's massive APMC market in Navi Mumbai, JNPT port logistics, and Bhiwandi warehouse cluster generate India's highest commercial truck demand. Industries in Thane, Kalyan, and Boisar industrial estates rely on daily goods transport. TransRentals offers 1-tonne Tata Ace to 32-feet container trucks for intra-city and intercity freight movement across the Mumbai Metropolitan Region.",
      'jcb-on-rent':
        "Mumbai's constant infrastructure development — coastal road, metro lines 2A/7, and Navi Mumbai airport construction — drives year-round demand for JCB and excavator rentals. Redevelopment projects in Dharavi, BKC, and Western suburbs are major users. TransRentals provides JCB 3DX backhoe loaders, mini excavators, and tipper trucks for construction and demolition across Greater Mumbai.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are Mumbai's go-to vehicles for household shifting between high-rise apartments and shop relocations in markets like Dadar, Kurla, and Crawford Market. These mini trucks handle Mumbai's narrow building lanes and congested market roads efficiently. TransRentals has hourly and full-day bookings with same-day availability across Mumbai, Thane, and Navi Mumbai.",
      'tempo-traveller':
        "Mumbai's Ganesh Chaturthi, wedding season, and corporate team outings are the peak demand periods for tempo travellers. Pilgrimages to Shirdi (240 km) and Trimbakeshwar (170 km) are top routes. Bollywood location shoots in Lonavala and Mahabaleshwar also use tempo travellers regularly. TransRentals offers AC 12–17 seater Tempo Travellers with experienced drivers across all Mumbai zones.",
      'outstation-car-rental':
        "Outstation trips from Mumbai with a TransRentals chauffeur-driven cab cover Pune, Lonavala, Nashik, Alibaug, Mahabaleshwar, and Goa. Transparent per-km pricing with no hidden charges. The Mumbai-Pune Expressway corridor accounts for over 40% of all outstation bookings. Book online with instant driver confirmation.",
      'one-way-car-rental':
        "One-way cab from Mumbai to Pune (150 km, ~3 hrs) is Mumbai's most booked one-way route — pay only for one direction with no return charges. Other popular one-ways: Mumbai to Nashik, Mumbai to Shirdi, Mumbai to Goa. TransRentals one-way pricing includes toll, fuel, and driver allowance. No surge pricing on pre-booked cabs.",
      'airport-transfer':
        "CSIA Mumbai (BOM) handles 5+ crore passengers annually. TransRentals airport transfers serve all terminals (T1, T2) with fixed-price pre-booked cabs from Andheri, Bandra, Thane, Navi Mumbai, and all city zones. No surge pricing during late night or early morning flights. Starting from ₹699. Flight-tracking included for arrivals.",
      'self-drive-car-rentals':
        "Self-drive car rental in Mumbai is ideal for exploring the city at your own pace without worrying about surge pricing or driver availability. TransRentals offers hatchbacks (Wagon R, Swift), sedans (City, Dzire), and SUVs (Creta, Breezza) from verified vendors in Andheri, Bandra, Thane, and Navi Mumbai. Daily packages include 100–200 km; for Lonavala or Pune Expressway trips, opt for the unlimited-km plan. A valid DL (1+ year old), Aadhaar, and refundable security deposit are required.",
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
      'bus-rental': [
        { q: 'What is the cost of a tempo traveller from Mumbai to Shirdi?', a: 'A 12-seater AC Tempo Traveller from Mumbai to Shirdi (240 km, ~5 hrs) starts from ₹9,000 for a one-way trip including driver. Round-trip packages for Shirdi darshan are available.' },
        { q: 'Can I hire a bus for a wedding in Mumbai?', a: 'Yes, 20–50 seater AC buses are available for wedding baraat and guest transport in Mumbai. Decorated bus packages start from ₹15,000/day. Book 2–3 weeks in advance during wedding season (Nov–Feb).' },
        { q: 'Which bus is best for a corporate team outing from Mumbai?', a: 'For 15–20 people, an AC Tempo Traveller (17-seater) works best. For larger groups (25–50), opt for a full-size AC bus. Lonavala and Alibaug are the most popular Mumbai corporate outing destinations.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Mumbai do TransRentals movers cover?', a: 'TransRentals-verified movers cover all of Greater Mumbai and the MMR — including Andheri, Bandra, Borivali, Thane, Navi Mumbai, Powai, Worli, Juhu, Malad, Goregaon, Kandivali, Chembur, Kurla, Dadar, Mulund, Vikhroli, Ghatkopar, Vashi, Kharghar, and Panvel. Same-day and next-day bookings are available across all these zones.' },
        { q: 'How does an Andheri to Thane shift work and how long does it take?', a: 'The Andheri–Thane corridor (roughly 18–22 km via the Eastern Express Highway or via Ghodbunder Road) is one of Mumbai\'s busiest move routes. With a professional team of 3–4 movers, a 2BHK shift including packing, loading, transit, and unloading typically takes 7–10 hours. Traffic on the EEH during peak hours can add 1–2 hours, so weekday early-morning starts (before 8 AM) are recommended.' },
        { q: 'What is the best time to shift house in Mumbai?', a: 'Avoid month-end dates (28th–2nd), as demand peaks and rates are higher. The best windows are between the 5th and 20th of the month. March–April (financial year-end) is the overall peak season city-wide. Monsoon months (June–September) add logistical difficulty due to narrow flooded lanes and lift outages in high-rise societies.' },
        { q: 'How do movers handle shifting during Mumbai\'s monsoon (June–September)?', a: 'Professional movers use waterproof wrapping and shrink film for furniture and electronics, and heavy-duty plastic crates for fragile items. Access to some Andheri and Kurla lanes can be blocked by waterlogging — movers will often park at the nearest accessible point and hand-carry goods the last stretch. Always schedule a monsoon move for morning (7–10 AM) before afternoon rains intensify.' },
        { q: 'Do Mumbai movers handle high-rise buildings and floors above 20?', a: 'Yes, TransRentals-listed Mumbai movers are experienced with high-rise buildings across Worli, Powai, Kandivali, and Navi Mumbai, which commonly have 25–40 floor towers. They coordinate with building management for service lift bookings (usually required 48 hours in advance) and use hoisting equipment when lifts are unavailable. Always inform movers of your floor number and lift dimensions when booking.' },
        { q: 'How long does a 2BHK shift take within Mumbai city?', a: 'A standard 2BHK intra-Mumbai shift (packing + loading + transit + unloading) takes 8–12 hours with a team of 3–4 professionals. Western suburb moves (Borivali to Malad) tend to be faster at 6–8 hours, while cross-city moves (Andheri to Chembur, or Thane to Bandra) can run 10–14 hours due to traffic on the Eastern Express Highway and Western Express Highway during peak periods.' },
        { q: 'Can I move intercity from Mumbai to Pune or Nashik with TransRentals?', a: 'Yes, Mumbai to Pune (150 km via NH48) and Mumbai to Nashik (170 km via NH160) are the most booked intercity routes. Mumbai to Goa (600 km via NH66) is also available for full household relocations. Intercity moves include professional packing, dedicated truck, and door-to-door delivery — get a free quote on TransRentals for exact pricing.' },
        { q: 'Are movers available on weekends and at month-end in Mumbai?', a: 'Yes, but weekends and month-end dates (especially 28th–2nd) are the highest demand periods in Mumbai. Book at least 4–5 days in advance for month-end slots and 2–3 days in advance for weekend shifts. TransRentals allows you to lock in your preferred date and time with upfront booking confirmation.' },
      ],
      'transporter': [
        { q: 'What is the cost of truck rental in Mumbai per day?', a: 'Tata Ace (1T) starts from ₹3,000/day in Mumbai. Tata 407 (5T) starts from ₹7,000/day. Container trucks for JNPT port logistics are quoted per trip based on load.' },
        { q: 'Can I book a goods truck from Mumbai to Delhi?', a: 'Yes, Mumbai to Delhi (1,450 km via NH48) truck booking is available. Full-truck-load (FTL) and part-load (LTL) options exist. Transit time is 3–4 days. TransRentals connects with verified transporters.' },
        { q: 'Is Bhiwandi the best hub for Mumbai truck transport?', a: "Yes, Bhiwandi in Thane district is Mumbai's largest goods transport hub. Most e-commerce and industrial warehouses use Bhiwandi as base. TransRentals has strong vendor presence in Bhiwandi and APMC Vashi." },
      ],
      'airport-transfer': [
        { q: 'How long does it take to reach Mumbai airport from Andheri?', a: 'Andheri (East/West) to CSIA Terminal T2 is 8–12 km and takes 20–40 minutes depending on traffic. For morning flights, plan 60 minutes. Book TransRentals for fixed-price pre-booked airport cab.' },
        { q: 'What is the cab fare from Mumbai airport to South Mumbai?', a: 'CSIA T2 to Nariman Point or Churchgate (30–35 km via Western Express Highway) starts from ₹600 for a pre-booked sedan. Book on TransRentals to avoid metered surge pricing.' },
        { q: 'Is pickup available from Mumbai airport at midnight?', a: "Yes, TransRentals airport pickups are available 24/7 including midnight and early morning arrivals. Pre-booked drivers track your flight. No extra charge for late-night pickups." },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Tempo Traveller in Mumbai for a day?', a: 'AC 12-seater Tempo Traveller in Mumbai starts from ₹5,000/day for local city trips. For outstation (e.g., Lonavala, Alibaug), get a free quote on TransRentals.' },
        { q: 'Can I book a Tempo Traveller for Mumbai to Goa trip?', a: 'Yes, Mumbai to Goa (600 km via NH66, ~10 hrs) Tempo Traveller booking is popular for group holidays. 12–17 seater AC vehicle starts from ₹18,000 for a one-way trip.' },
        { q: 'What is the best tempo traveller route for a Shirdi pilgrimage from Mumbai?', a: 'Mumbai to Shirdi is 240 km via NH160 (~5 hrs). A 12-seater AC Tempo Traveller for the round trip (same day) starts from ₹12,000 including waiting charges at Shirdi.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Mumbai per day?', a: 'Self-drive hatchback (Swift, Wagon R) in Mumbai starts from ₹999/day. Sedans (Honda City, Swift Dzire) start from ₹1,299/day. SUVs (Creta, Brezza) start from ₹1,799/day. Rates include 100–200 km/day — extra km charged at ₹12–15/km.' },
        { q: 'Can I take a self-drive car from Mumbai to Pune or Lonavala?', a: 'Yes, most TransRentals self-drive vendors in Mumbai allow travel on the Mumbai-Pune Expressway (NH48). Confirm the outstation policy before booking. Pune (150 km) and Lonavala (80 km) are the most popular self-drive destinations from Mumbai.' },
        { q: 'What documents are required for self-drive car rental in Mumbai?', a: 'You need: (1) Original DL valid for at least 1 year, (2) Aadhaar Card or Passport as address proof, (3) refundable security deposit (₹2,000–₹5,000 depending on car category). Some vendors also accept PAN card as secondary ID.' },
        { q: 'Is self-drive car rental available near Mumbai airport?', a: 'Yes, vendors near Andheri (East and West) and Vile Parle offer self-drive pickups close to CSIA. Book at least 24 hours in advance for airport-area pickups and ensure you carry original documents.' },
        { q: 'Are there any restrictions on self-drive cars in Mumbai?', a: 'No odd-even restrictions apply in Mumbai. However, some vendors restrict travel outside Maharashtra without prior approval. Avoid parking in no-parking zones — towing fines in Mumbai are steep. Always check if your rental permits use on the Bandra-Worli Sea Link (toll-paid).' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Mumbai?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Mumbai\'s Metro Line 2/3/7 construction, Dharavi redevelopment, MMRDA infrastructure projects, and Navi Mumbai airport construction keep equipment in constant demand year-round.' },
        { q: 'What drives the highest equipment rental demand in Mumbai?', a: 'Film and TV production — including Bollywood set construction — is a major demand driver for generator sets and mobile cranes in Mumbai. MMRDA\'s ongoing metro and coastal road projects, and the large-scale Dharavi redevelopment, also keep tower cranes, concrete pumps, and excavators in constant demand. Most shoot-related rentals require 12-hour shift capability; confirm with the vendor at booking.' },
        { q: 'How do I book construction equipment for my project in Mumbai?', a: 'Mumbai\'s MMRDA projects, coastal road work, and Dharavi redevelopment are major equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes and large excavators deployed near metro corridors, book 5–7 days ahead to ensure permit compliance and site coordination.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Mumbai?', a: 'JCB 3DX backhoe loader rental in Mumbai starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Mumbai?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Mumbai. Key active zones include Metro Line 2A/7 infrastructure, Dharavi redevelopment earthworks, Navi Mumbai airport land preparation, and Western suburbs residential redevelopment projects.' },
        { q: 'What permits are required for JCB work in Mumbai?', a: 'BMC (Brihanmumbai Municipal Corporation) permission is mandatory for any road or footpath excavation in Mumbai. Sites near the coastline — especially in Bandra, Andheri, and Versova — fall under Coastal Regulation Zone (CRZ) rules, requiring additional MCZMA clearance before ground-breaking work. Always secure permits before scheduling JCB arrival to avoid on-site stoppage.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Mumbai?', a: 'APMC Vashi wholesale market is the single largest source of mini truck trips in Mumbai — perishable vegetables, fruits, and fish move nightly to retail markets across the city. Dharavi\'s 5,000+ small manufacturing units (leather goods, pottery, garments) rely on Tata Ace pickups for raw material and finished goods. Bollywood set equipment — props, lighting rigs, costumes — is another high-frequency use case, especially in Film City Goregaon and location shoots in Bandra.' },
        { q: 'Can I rent a mini truck for house shifting in Mumbai?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Mumbai. Common routes: Andheri to Thane, Bandra to Navi Mumbai, and intra-suburb moves in the Western line belt. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Mumbai?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Mumbai\'s APMC Vashi wholesale market deliveries, Dharavi SME workshop dispatches, and last-mile e-commerce fulfillment from Bhiwandi warehouses are among the most common mini truck use cases in the city.' },
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
        "Delhi NCR has one of India's highest relocation rates, powered by a massive government transfer cycle, a growing IT belt in Noida and Gurugram, and a transient corporate workforce that moves every 2–3 years. The busiest intra-city corridors are Delhi to Noida Sector 62, South Delhi (Vasant Kunj, Saket, Malviya Nagar, Greater Kailash) to West Delhi (Dwarka, Janakpuri, Rajouri Garden), and central Delhi to Faridabad or Indirapuram. Peak months are May–June (government transfer season) and March–April (financial year-end); GRAP-4 restrictions in winter (November–January) can restrict large truck movement on certain days. TransRentals-verified movers cover Dwarka, Rohini, Janakpuri, Vasant Kunj, Saket, Malviya Nagar, Lajpat Nagar, Greater Kailash, Noida Sector 62, Gurugram Cyber City, Faridabad, Ghaziabad, Punjabi Bagh, Karol Bagh, Rajouri Garden, Pitampura, Mayur Vihar, and Indirapuram. Get a free quote and book IBA-approved movers in minutes.",
      'transporter':
        "Delhi NCR's industrial corridors in Manesar, Bahadurgarh, and Noida Expressway are among India's largest goods transport hubs. Automotive parts, pharma, and FMCG logistics require daily truck movement. TransRentals offers Tata Ace to 40-tonne trailer trucks for intra-city and pan-India goods movement from Delhi NCR, with both full-load and part-load options.",
      'jcb-on-rent':
        "Delhi's ongoing metro expansion (Phase 4), expressway projects (Delhi-Mumbai, Delhi-Amritsar), and massive redevelopment in Dwarka and Rohini generate continuous JCB and excavator demand. Construction in Gurugram's DLF zones and Noida Expressway IT parks are key users. TransRentals provides JCB 3DX, mini excavators, and graders across Delhi NCR for civil and construction projects.",
      'mini-truck-rental':
        "Delhi's dense residential zones in Uttam Nagar, Lajpat Nagar, and East Delhi markets have the highest mini-truck demand for household shifting. Tata Ace and Bolero Pickup are most used for furniture delivery and apartment moves. These vehicles navigate Delhi's narrow galis and market lanes efficiently. TransRentals offers hourly and full-day mini-truck bookings with verified drivers across NCR.",
      'tempo-traveller':
        "Delhi NCR's corporate belt and pilgrimage circuits drive massive tempo traveller demand. Pilgrimages to Vaishno Devi (720 km), Rishikesh (230 km), and Mathura-Vrindavan (165 km) are top routes. Company team outings to Agra and Jaipur from Gurugram and Noida IT parks are popular. TransRentals offers 12–17 seater AC Tempo Travellers with drivers for all Delhi NCR zones.",
      'outstation-car-rental':
        "Outstation cabs from Delhi cover India's most iconic tourist routes — Agra (Yamuna Expressway), Jaipur, Rishikesh, Shimla, and Amritsar. TransRentals chauffeur-driven cabs offer transparent per-km pricing with no hidden charges. Pre-book online for instant confirmation — pick up from any Delhi, Noida, or Gurugram location.",
      'one-way-car-rental':
        "Delhi's most popular one-way routes: Delhi to Agra (230 km), Delhi to Jaipur (280 km), Delhi to Chandigarh (260 km). Pay only for the one-way trip — no return charges on TransRentals one-way cabs. Price includes driver, fuel, and basic tolls.",
      'airport-transfer':
        "IGI Airport (DEL) serves Delhi NCR with T1 (domestic) and T3 (international/domestic). TransRentals airport transfers cover all NCR zones — Gurugram, Noida, Faridabad, and central Delhi — with fixed pre-booked pricing. T3 to Connaught Place starting from ₹700 for a sedan. No surge pricing, 24/7 availability, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Delhi NCR offers some of India's best self-drive car rental options, with wide Expressways to Agra, Jaipur, and Chandigarh making outstation drives very popular. Yamuna Expressway (Delhi-Agra) and NH48 (Delhi-Jaipur) are the top self-drive routes. TransRentals lists verified self-drive vendors across Connaught Place, Aerocity, Gurugram, and Noida. Note: Delhi's odd-even traffic scheme may apply on certain dates — check EPCA advisories before driving a private vehicle on restricted days.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Is self-drive car rental allowed in Delhi?', a: 'Yes, self-drive is available in Delhi. You need a DL (min 1 year old), valid ID, and a security deposit. Note that odd-even rules may apply on certain days.' },
        { q: 'Which is the best route from Delhi to Agra?', a: 'Yamuna Expressway (NH19) is fastest — 230 km in about 4 hours. Start before 6 AM on weekends to reach Taj Mahal at opening time (6 AM) and avoid crowds.' },
        { q: 'Are airport transfers available from IGI Airport, Delhi?', a: 'Yes, TransRentals offers pre-booked airport pickups from all IGI terminals (T1, T2, T3). Book at least 2 hours before your flight for guaranteed service.' },
        { q: 'What is the cost of a cab from Delhi to Jaipur?', a: 'One-way cab from Delhi to Jaipur (280 km, ~5 hrs via NH48) starts from ₹2,500 for a sedan. Book through TransRentals for verified vendors and fixed pricing.' },
        { q: 'Can I rent a car in Delhi and return it in another city?', a: 'Yes, one-way outstation rentals are available. Delhi to Jaipur, Delhi to Agra, and Delhi to Chandigarh one-ways are most popular. Additional one-way charges apply.' },
      ],
      'bike-on-rent': [
        { q: 'Can I rent a bike in Delhi for Old Delhi sightseeing?', a: 'Yes, renting a scooter (Activa/Jupiter) for Old Delhi sightseeing is very popular. Parking in narrow lanes near Chandni Chowk and Jama Masjid is much easier on a two-wheeler than a car.' },
        { q: 'Are electric scooters available on rent in Delhi?', a: "Yes, e-scooters are increasingly available in Delhi under the Delhi EV policy. Great for pollution-conscious commuters in areas like Dwarka, Rohini, and East Delhi." },
        { q: 'What is the cost of Royal Enfield rental in Delhi for a Shimla trip?', a: 'Royal Enfield Classic 350 or Himalayan rental in Delhi for a Shimla road trip (360 km via NH5) starts from ₹1,200/day. Weekly packages offer 20–25% discount.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Delhi for a pilgrimage trip?', a: 'A 12-seater AC Tempo Traveller from Delhi to Haridwar (220 km, ~4 hrs via NH58) starts from ₹8,000/day. A 20-seater mini bus for Rishikesh (230 km) starts from ₹10,000+/day. For Shimla trips (360 km), a full-size AC bus for 40+ passengers is available from ₹20,000+/day.' },
        { q: 'Which bus routes are most popular from Delhi?', a: 'Delhi to Rishikesh (230 km, ~5 hrs) is the most popular pilgrimage-cum-leisure route, followed by Delhi to Haridwar (220 km, ~4 hrs). Delhi to Agra (230 km, ~4 hrs via Yamuna Expressway) is the top Golden Triangle group bus route, and Delhi to Shimla (360 km, ~8 hrs) is popular for corporate team outings.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Delhi?', a: 'Yes, 20–50 seater AC buses are available for Delhi weddings and corporate events. Decorated baraat buses start from ₹15,000/day. For Noida and Gurugram IT park outings, 17-seater Tempo Travellers are most popular. Book 2–3 weeks in advance during peak wedding season (Nov–Feb).' },
      ],
      'transporter': [
        { q: 'What is the truck rental cost in Delhi NCR per day?', a: 'Tata Ace (1T) starts from ₹2,800/day in Delhi. Tata 407 (5T) starts from ₹6,000/day. Container trucks for long-haul are quoted per trip based on route and load.' },
        { q: 'Which is the best area in Delhi for truck rentals?', a: 'Bahadurgarh, Ghaziabad, and Okhla Industrial Area are major truck rental hubs in the NCR. TransRentals has verified transporters across all NCR industrial zones.' },
        { q: 'Can I book a truck from Delhi to Mumbai for factory goods?', a: 'Yes, Delhi to Mumbai (1,450 km via NH48) is one of India\'s top truck routes. Full-load containers take 3–4 days. Part-load options are available for smaller shipments.' },
      ],
      'tempo-traveller': [
        { q: 'What is the Tempo Traveller cost from Delhi to Rishikesh?', a: 'AC 12-seater Tempo Traveller from Delhi to Rishikesh (230 km, ~5 hrs) starts from ₹8,000 one-way. Round-trip Haridwar-Rishikesh packages from Delhi are popular for 1-night trips.' },
        { q: 'Can I book a Tempo Traveller from Delhi to Shimla?', a: 'Yes, Delhi to Shimla (360 km, ~8 hrs) Tempo Traveller booking is available. Book a 9–12 seater for hill trips. The last section to Shimla requires careful driving — experienced hill drivers provided.' },
        { q: 'How do I book a 17-seater Tempo Traveller in Delhi?', a: 'Book on TransRentals — select tempo-traveller service, enter your date and pickup location in Delhi, and choose the 17-seater option. Confirm 48 hours in advance for outstation trips.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from IGI Airport T3 to Connaught Place?', a: 'Fixed pre-booked cab from IGI T3 to Connaught Place (22 km via NH48) starts from ₹650 for a sedan. No surge pricing on pre-booked TransRentals airport cabs.' },
        { q: 'How long does it take from IGI Airport to Gurugram?', a: 'IGI T3 to DLF Cyber City Gurugram is about 14 km (NH48) — 25–40 minutes without traffic. During peak hours (8–10 AM, 5–8 PM), allow 60–75 minutes.' },
        { q: 'Is airport pickup available from Terminal 1 in Delhi?', a: 'Yes, TransRentals covers both T1 and T3 at IGI Airport Delhi. T1 (SpiceJet/IndiGo domestic) is a separate terminal — specify which terminal when booking.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Delhi do TransRentals movers cover?', a: 'TransRentals-verified movers serve all of Delhi NCR — including Dwarka, Rohini, Janakpuri, Vasant Kunj, Saket, Malviya Nagar, Lajpat Nagar, Greater Kailash, Punjabi Bagh, Karol Bagh, Rajouri Garden, Pitampura, Mayur Vihar, Noida Sector 62, Gurugram Cyber City, Faridabad, Ghaziabad, and Indirapuram. Moves within Delhi and cross-NCR moves are both available.' },
        { q: 'What is the most common move corridor in Delhi NCR?', a: 'The Delhi-to-Noida and Delhi-to-Gurugram corridors are by far the most common — driven by IT and consulting professionals switching companies. South Delhi to West Delhi moves (Saket or Malviya Nagar to Dwarka or Janakpuri) are the second most frequent intra-city pattern, typically involving larger 2BHK and 3BHK apartments.' },
        { q: 'When is the best time to shift house in Delhi?', a: 'The ideal window is between the 5th and 20th of the month, avoiding month-end peak demand. September to October and February to March are the calmest months overall for Delhi relocations. Avoid May–June (government transfer rush) and December–January (GRAP fog and truck restrictions) for stress-free shifting.' },
        { q: 'How do GRAP restrictions affect household shifting in Delhi in winter?', a: 'Under GRAP Stage 3 or 4 (typically November–January), heavy diesel trucks (BS4 and below) may be banned from entering Delhi. TransRentals-listed movers use BS6-compliant vehicles that are typically exempt. Always confirm with your vendor 48 hours before a winter move to ensure truck permits are in order and there are no active GRAP-4 restrictions on your moving date.' },
        { q: 'Do Delhi movers handle high-rise buildings in areas like Dwarka or Noida?', a: 'Yes, our verified movers are experienced with high-rise societies across Dwarka Sector 10/13, Rohini, Vasant Kunj, and Noida Sector 62/137. They coordinate service lift bookings with the RWA (usually 24–48 hours in advance) and bring their own packing materials for staircase carrying when lifts are under maintenance.' },
        { q: 'How long does a 2BHK shift take within Delhi or Delhi to Noida?', a: 'An intra-Delhi 2BHK shift (packing + loading + transit + unloading) typically takes 7–10 hours with a team of 3–4 movers. A Delhi-to-Noida cross-city move adds 1–2 hours for the Yamuna Expressway or DND section, bringing total time to 9–12 hours. Moving on weekdays before 9 AM significantly cuts transit time.' },
        { q: 'Can I move intercity from Delhi to Jaipur, Chandigarh, or Mumbai?', a: 'Yes, Delhi to Jaipur (280 km via NH48), Delhi to Chandigarh (260 km via NH44), Delhi to Lucknow (500 km), and Delhi to Mumbai (1,450 km) are all available as intercity household moves. Full-truck-load (FTL) moves include door-to-door packing, dedicated truck, and delivery at destination. Get a free quote on TransRentals for intercity pricing.' },
        { q: 'Are movers available on weekends and month-end in Delhi?', a: 'Yes, but Delhi NCR sees a sharp spike in demand on weekends and between the 28th and 3rd of each month. During government transfer season (May–June), the entire month is under peak demand. Book at least 5–7 days in advance for month-end slots and 3–4 days ahead for weekends during peak season.' },
      ],
      'one-way-car-rental': [
        { q: 'What are the most popular one-way cab routes from Delhi?', a: 'Delhi to Agra (230 km), Delhi to Jaipur (280 km), Delhi to Chandigarh (260 km), and Delhi to Haridwar (220 km) are the top 4 one-way routes. Get a free quote on TransRentals for transparent pricing.' },
        { q: 'Does a one-way cab from Delhi to Agra include toll charges?', a: 'Tolls on the Yamuna Expressway (Delhi-Agra) are extra unless specifically included. TransRentals clearly lists what is included — check the booking summary before confirming.' },
      ],
      'self-drive-car-rentals': [
        { q: 'Does the odd-even scheme apply to self-drive rental cars in Delhi?', a: 'Odd-even scheme applies to private vehicles registered in Delhi on notified days. Most rental cars are registered as commercial vehicles and may be exempt — confirm with your vendor. For self-drive, check EPCA notifications for your travel date to avoid penalties.' },
        { q: 'What is the cost of self-drive car rental in Delhi per day?', a: 'Self-drive hatchback in Delhi starts from ₹899/day. Sedans (Honda City, Dzire) start from ₹1,199/day. SUVs (Creta, Scorpio) start from ₹1,699/day. Packages include 200–300 km — extra km charged at ₹12–15/km. Airport pickup and drop available at select vendors.' },
        { q: 'Can I take a self-drive car from Delhi to Agra or Jaipur?', a: 'Yes, most self-drive vendors in Delhi allow Yamuna Expressway (Delhi-Agra, 230 km) and NH48 (Delhi-Jaipur, 280 km) drives. Confirm the outstation permit before booking. Agra day trips and Jaipur overnight trips are the most popular self-drive outstation routes from Delhi.' },
        { q: 'What are the best areas to pick up a self-drive car in Delhi?', a: 'Aerocity (near IGI Airport), Connaught Place, Gurugram (DLF Cyber City), and Noida Sector 18 have the highest self-drive vendor density. Doorstep delivery is available in most NCR zones with 24 hours\' notice.' },
        { q: 'What documents are needed for self-drive in Delhi NCR?', a: 'Original DL (at least 1 year old), Aadhaar Card or valid ID, and a security deposit (₹2,000–₹5,000 depending on car type). Some vendors accept international driving permits for foreign nationals. PAN card may be requested as secondary ID for SUV rentals.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Delhi?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Delhi Metro Phase 4 expansion, Dwarka Expressway widening, PM Awas Yojana housing projects, and Central Vista redevelopment keep construction equipment in continuous demand across the NCR.' },
        { q: 'What types of construction equipment are most in demand in Delhi?', a: 'Tower cranes dominate Delhi\'s equipment rental demand, driven by high-rise residential construction in Dwarka and Rohini sub-cities. Central Vista Avenue redevelopment and CPWD government building projects are major users of concrete batching plants, transit mixers, and boom placers. DMRC Phase 4 metro expansion adds consistent demand for tunnel excavation and piling equipment across the city.' },
        { q: 'How do I book construction equipment for my project in Delhi?', a: 'Delhi NCR\'s Metro Phase 4 corridors, Dwarka Expressway infrastructure, and large-scale housing projects in Rohini and Dwarka are major equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes and large machinery near metro construction zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Delhi?', a: 'JCB 3DX backhoe loader rental in Delhi starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Delhi?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Delhi NCR. Active construction zones include Delhi Metro Phase 4 underground sections, Dwarka Expressway infrastructure, PM Awas Yojana housing in Rohini and Narela, and Gurugram DLF commercial zone development.' },
        { q: 'What permissions are needed for JCB excavation in Delhi?', a: 'NDMC and MCD permit requirements vary by zone — South Delhi (NDMC area) and North/East Delhi (MCD zones) have separate application processes for road-cutting and utility work. Critically, no excavation is permitted within the influence zone of DMRC metro pillars without a DMRC NOC; sites near metro lines require structural assessment before JCB deployment. Apply for permits 7–10 working days in advance to avoid delays.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Delhi?', a: 'Chandni Chowk wholesale distribution — electronics, fabrics, stationery, and dry goods — is the most frequent mini truck use case in Delhi, with hundreds of Tata Ace trips running nightly between the market and retail outlets across the NCR. Okhla garment market generates regular pickups of finished apparel. E-commerce last-mile movement from large fulfilment hubs in Ghaziabad and Bhiwandi to Delhi\'s residential areas also drives high Bolero Pickup demand.' },
        { q: 'Can I rent a mini truck for house shifting in Delhi?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Delhi. Common routes: South Delhi (Saket, GK) to Dwarka, Rohini to Noida Sector 62, and intra-East Delhi moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Delhi?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Delhi\'s Okhla and Wazirpur garment market dispatches, Chandni Chowk wholesale deliveries, and e-commerce last-mile fulfillment from Ghaziabad hubs are the most common mini truck use cases in the NCR.' },
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
      'packers-and-movers':
        "Bangalore's relentless IT expansion has made it India's most active city for intra-city relocations, with thousands of moves happening every month as professionals chase new jobs across tech parks. The busiest move corridors are Whitefield to Koramangala, Electronic City to Hebbal, and the entire Outer Ring Road belt (Marathahalli, Sarjapur Road, Bellandur, Bommanahalli) to North Bangalore (Yelahanka, Hebbal, Devanahalli). Peak shifting season runs from March to June, coinciding with IT company transfer cycles, with a secondary spike in October–November; metro construction on the ORR and Hosur Road can cause transit delays of 1–2 hours during peak hours. TransRentals-verified movers cover Whitefield, Koramangala, HSR Layout, Electronic City, BTM Layout, Marathahalli, Sarjapur Road, Hebbal, Yelahanka, Bannerghatta Road, Indiranagar, Jayanagar, JP Nagar, Bellandur, Outer Ring Road, Bommanahalli, and Devanahalli. Book insured movers online and get a free instant quote.",
      'transporter':
        "Bangalore's industrial zones in Peenya, Bommasandra, and Bidadi generate steady demand for commercial truck rentals. E-commerce warehouses near Hosur Road and manufacturing units in Tumkur Road corridor are top users. TransRentals provides 1-tonne mini trucks to 32-feet container trucks for intra-city and intercity goods movement across Bangalore and Karnataka.",
      'jcb-on-rent':
        "Bangalore's rapid infrastructure expansion — metro phase 3, Peripheral Ring Road, and satellite town development — drives constant demand for JCB and excavator rentals. Construction in Devanahalli, Sarjapur, and Yelahanka are top zones. TransRentals offers JCB 3DX backhoe loaders, mini excavators, and tipper trucks for construction, demolition, and earthwork projects across Bangalore.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are Bangalore's top choices for household shifting and small shop relocations. The city's dense apartment clusters in Whitefield, Marathahalli, and BTM Layout see the highest daily demand. These 1–2 ton mini trucks navigate narrow apartment lanes and loading bays with ease. Book by the hour or full day with TransRentals' verified mini-truck vendors across Bangalore.",
      'tempo-traveller':
        "Bangalore's large IT workforce and active social culture make tempo travellers highly popular for team outings to Coorg, Ooty, and Hampi. Pilgrimages to Tirupati (250 km) and Dharmasthala (280 km) are top group travel routes. TransRentals offers AC 12-seater to 17-seater Tempo Travellers with experienced drivers for corporate, tourist, and family groups departing from Bangalore.",
      'outstation-car-rental':
        "Outstation trips from Bangalore with a driver cover the most scenic destinations in South India — Mysore, Coorg, Ooty, Hampi, Gokarna, and Pondicherry. TransRentals offers transparent per-km pricing with no hidden charges. Book your Bangalore outstation cab online with verified drivers and instant confirmation.",
      'one-way-car-rental':
        "One-way cab from Bangalore to Mysore (150 km), Chennai (350 km), or Hyderabad (570 km) — pay only for the distance you travel, no return charges. TransRentals one-way cabs include toll charges and driver allowance in the quoted fare. Most popular routes: Bangalore to Mysore, Bangalore to Coorg, Bangalore to Chennai. Book online for fixed pricing.",
      'airport-transfer':
        "Kempegowda International Airport (KIA) is 40 km from central Bangalore — TransRentals airport transfers cover the full corridor from Whitefield, Electronic City, Jayanagar, and all major zones. Fixed-price pre-booked cabs, no surge pricing, flight-tracking for delays, and professional drivers. Airport pickup from ₹899 for a sedan. Book at least 2 hours before departure.",
      'self-drive-car-rentals':
        "Bangalore's well-maintained NICE Road, Mysore Expressway (NH275), and Hosur Road make self-drive car rental a popular choice for tech-savvy IT professionals exploring the city and surroundings. Weekend drives to Mysore (150 km), Coorg (250 km), and Nandi Hills (70 km) are the most popular self-drive routes. TransRentals lists verified self-drive vendors in Koramangala, HSR Layout, Whitefield, and Electronic City with same-day availability. Hatchbacks, sedans, and compact SUVs are available on daily and weekly plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to travel from Bangalore to Mysore?', a: 'The Bangalore-Mysore Expressway (NH275) is the fastest route — 150 km in about 3 hours with minimal traffic. Mysore is ideal for a day trip departing by 6–7 AM.' },
        { q: 'Is self-drive car rental available from Bangalore airport?', a: 'Yes, TransRentals partners have pickup desks near KIA Bangalore. Book at least 24 hours in advance for airport pickups. Airport surcharge may apply.' },
        { q: 'Which car type is best for Coorg trip from Bangalore?', a: 'SUVs like Innova, Ertiga, or XL6 are ideal for Coorg — the roads include ghats and coffee plantation trails that require decent ground clearance.' },
        { q: 'What are the peak traffic hours in Bangalore?', a: 'Worst congestion is 9–10:30 AM and 6–8:30 PM on Outer Ring Road, Hosur Road, and Old Airport Road. NICE Road is always relatively free as a paid alternative.' },
        { q: 'Can I rent a car for Bangalore to Goa trip?', a: 'Yes, Bangalore to Goa is about 560 km (9–10 hrs via NH4 and NH748). One-way or round trip rentals are available. Fuel, driver allowance, and tolls are extra.' },
      ],
      'bike-on-rent': [
        { q: 'Which is the best bike for daily commute in Bangalore?', a: 'Honda Activa and TVS Jupiter are top picks for Bangalore daily commute — fuel-efficient, easy to park, and reliable in stop-go traffic on ORR and Hosur Road.' },
        { q: 'Can I rent a Royal Enfield in Bangalore for a Coorg weekend trip?', a: 'Yes, Royal Enfield Classic 350 and Himalayan are available in Bangalore for weekend rides. Coorg roads (250 km, ~5 hrs) are ideal for these bikes with good ground clearance.' },
        { q: 'Are electric scooters available on rent in Bangalore?', a: 'Yes, Bangalore has a growing fleet of electric scooters on rent — Ather 450, Ola S1, and TVS iQube are available. Ideal for short-distance IT corridor commuting in Koramangala and HSR Layout.' },
        { q: 'What is the minimum rental period for bikes in Bangalore?', a: 'Most vendors offer minimum 24-hour rentals. Some Koramangala and Indiranagar vendors also offer 4–8 hour packages for day use. Monthly rentals offer the best per-day rates.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Bangalore for a team outing?', a: 'A 20-seater non-AC bus in Bangalore for a day outing starts from ₹8,000 per day. AC tempo travellers (12–17 seats) start from ₹5,000 per day depending on distance.' },
        { q: 'Can I book a bus from Bangalore to Tirupati?', a: 'Yes, Bangalore to Tirupati (250 km via NH44) is a popular pilgrimage bus route. AC sleeper buses are available for overnight travel. Book 48–72 hrs in advance for weekends.' },
        { q: 'Are Volvo buses available for rent in Bangalore?', a: 'Yes, premium Volvo and Scania buses are available for corporate team outings and weddings in Bangalore. Seating capacity ranges from 40 to 55 seats. Best for Goa and Ooty trips.' },
        { q: 'How do I book a bus for a Bangalore to Coorg corporate trip?', a: 'Contact TransRentals with your group size, date, and Coorg destination. A 20-seater bus for Bangalore to Coorg (250 km, ~5 hrs) is recommended. Book 1 week in advance.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Bangalore do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Bangalore localities — Whitefield, Koramangala, HSR Layout, Electronic City, BTM Layout, Marathahalli, Sarjapur Road, Hebbal, Yelahanka, Bannerghatta Road, Indiranagar, Jayanagar, JP Nagar, Bellandur, Outer Ring Road, Bommanahalli, and Devanahalli. Both intra-city and cross-city moves to Mysore, Hyderabad, and Chennai are available.' },
        { q: 'What is the most common move route in Bangalore — Whitefield to Koramangala?', a: 'Yes, Whitefield to Koramangala (roughly 22–28 km via the Outer Ring Road) is Bangalore\'s single busiest move corridor, driven by IT professionals switching between east and south Bangalore campuses. The ORR transit can take 45–90 minutes depending on traffic, making a weekday early-morning start (before 8 AM) or a Saturday move the most efficient choice.' },
        { q: 'When is the best time to shift house in Bangalore?', a: 'The quietest shifting windows are mid-month (8th–20th) and the months of August, September, and February. March–June is peak IT transfer season and sees 40–50% higher rates and tighter slot availability. October–November is a secondary peak. Book at least 5–7 days in advance during peak season.' },
        { q: 'How do Bangalore movers handle metro construction traffic on ORR and Hosur Road?', a: 'Metro construction barricades on the Outer Ring Road and Hosur Road regularly reduce two lanes to one, causing 60–90 minute delays during peak hours. Experienced Bangalore movers plan alternative routes via Silk Board–BTM–Bannerghatta or use the NICE Road bypass for moves involving Electronic City or JP Nagar. Always schedule cross-ORR moves to start by 7 AM.' },
        { q: 'Do Bangalore movers handle gated communities and high-rise apartments?', a: 'Yes, most Whitefield, Marathahalli, and Sarjapur Road moves involve large gated communities with strict vehicle entry rules. TransRentals-listed movers pre-coordinate with the apartment security team for truck entry permission and service lift booking (usually 24–48 hours in advance). Always provide your society name and RWA contact when booking.' },
        { q: 'How long does a 2BHK shift take within Bangalore?', a: 'A standard 2BHK intra-Bangalore shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short-distance moves within the same zone (e.g., HSR Layout to Koramangala) can be done in 5–7 hours. Cross-city moves like Electronic City to Hebbal take 10–13 hours due to traffic on the ORR and Bellary Road corridors.' },
        { q: 'Can I move intercity from Bangalore to Mysore, Chennai, or Hyderabad?', a: 'Yes — Bangalore to Mysore (150 km via NH275), Bangalore to Chennai (350 km via NH44), and Bangalore to Hyderabad (570 km via NH44) are all available as household relocation services. Full-truck-load intercity moves include professional packing, dedicated vehicle, and door-to-door delivery. Get a free quote on TransRentals for exact pricing based on your goods volume.' },
        { q: 'Are movers available on weekends and month-end in Bangalore?', a: 'Yes, but Bangalore sees heavy demand on Saturdays and between the 28th and 2nd of each month. During the March–June peak season, even mid-week slots fill up fast. Book at least 5–7 days in advance for month-end and 3–4 days ahead for weekend shifts. TransRentals lets you lock your preferred slot with upfront confirmation.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Bangalore?', a: 'TransRentals offers Tata Ace (1T), Bolero Pickup (1.5T), Eicher 14 ft (3T), Tata 407 (5T), and 20–32 ft container trucks in Bangalore for goods transport needs.' },
        { q: 'What is the cost of truck rental in Bangalore per day?', a: 'Mini truck (Tata Ace) starts from ₹2,500/day in Bangalore. Medium trucks (Tata 407) start from ₹5,000/day. Long-distance intercity truck rates are quoted per km.' },
        { q: 'Can I book a truck for Bangalore to Mumbai goods transport?', a: 'Yes, Bangalore to Mumbai (980 km via NH48) intercity truck bookings are available. Full-load and part-load options exist. Prices depend on goods type, volume, and delivery timelines.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Bangalore?', a: 'AC 12-seater Tempo Traveller in Bangalore starts from ₹4,500 per day for local trips. Outstation rates (e.g., Coorg, Ooty) vary — get a free quote on TransRentals.' },
        { q: 'Can I book a Tempo Traveller from Bangalore to Tirupati?', a: 'Yes, Bangalore to Tirupati (250 km, ~5 hrs) is a top Tempo Traveller route. 12-seater AC vehicle for the one-way trip starts from ₹8,000 including driver.' },
        { q: 'How many people can travel in a Tempo Traveller?', a: 'Standard Tempo Travellers seat 9, 12, 14, or 17 passengers. For groups of 10–16, a 14-seater or 17-seater AC Tempo Traveller is most comfortable for long outstation trips.' },
      ],
      'airport-transfer': [
        { q: 'How much does an airport cab from Bangalore city to KIA cost?', a: 'Airport cab from central Bangalore (Koramangala, MG Road) to KIA starts from ₹900 for a sedan, depending on pickup location. Pre-booked TransRentals cabs have fixed prices with no surge.' },
        { q: 'How long does it take to reach KIA from Electronic City?', a: 'Electronic City to KIA is about 55 km via NH44 and ORR — roughly 60–90 minutes in normal traffic. Allow 120 minutes during morning peak (7–10 AM) and evening rush (5–8 PM).' },
        { q: 'Is there a flight-tracking service for airport pickups in Bangalore?', a: 'Yes, TransRentals airport pickup drivers track flight status. If your flight is delayed, the driver adjusts the pickup time — no extra charge for delays up to 2 hours.' },
      ],
      'one-way-car-rental': [
        { q: 'What is the cost of a one-way cab from Bangalore to Mysore?', a: 'Bangalore to Mysore one-way cab (150 km via NH275) starts from ₹1,500 for a sedan. Price includes driver, fuel, and basic tolls. Book on TransRentals for transparent fixed pricing.' },
        { q: 'Can I book a one-way cab from Bangalore to Chennai?', a: 'Yes, Bangalore to Chennai (350 km via NH44) one-way cab starts from ₹3,500 for a sedan. Journey time is approximately 6 hours.' },
        { q: 'Are one-way outstation cabs cheaper than round trips in Bangalore?', a: 'Yes, one-way cabs are 30–40% cheaper than round trips if you do not need the vehicle to return. Ideal for permanent relocations or one-direction travel to another city.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Bangalore per day?', a: 'Self-drive hatchback (Swift, i20) in Bangalore starts from ₹899/day. Sedans (City, Dzire) start from ₹1,199/day. SUVs (Creta, XUV300) start from ₹1,699/day. Standard packages include 150–200 km/day; extra km at ₹12–15/km.' },
        { q: 'Can I take a self-drive car from Bangalore to Mysore or Coorg?', a: 'Yes, most vendors permit outstation travel on the Mysore Expressway (NH275) and Kodagu roads. Mysore (150 km, ~3 hrs) and Coorg (250 km, ~5 hrs) are the most booked self-drive destinations. Confirm outstation permissions and any additional per-km charges when booking.' },
        { q: 'Which is the best area to pick up a self-drive car in Bangalore?', a: 'Koramangala, Indiranagar, HSR Layout, and Whitefield have the most self-drive vendors. Doorstep delivery is available across all Bangalore zones with 24 hours\' notice. KIA Airport pickup is also available with prior booking.' },
        { q: 'Are there any road restrictions for self-drive cars in Bangalore?', a: 'No odd-even scheme in Bangalore. However, KIA Airport Road (NH44) has frequent lane-reduction zones due to metro construction — factor extra time for airport drives. NICE Road requires a separate toll payment. Commercial vehicles (including rental cars) are allowed on NICE Road.' },
        { q: 'Is a security deposit required for self-drive in Bangalore?', a: 'Yes, a refundable security deposit of ₹2,000–₹5,000 is standard. This is returned after vehicle inspection on return. Carry original DL (minimum 1 year old) and Aadhaar — photocopies are not accepted at pickup.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Bangalore?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Namma Metro Phase 2 and Phase 3 construction, the Peripheral Ring Road, Whitefield IT park expansion, and the Mysuru Expressway project generate constant year-round equipment demand.' },
        { q: 'Why do Bangalore construction sites often need hydraulic breakers with excavators?', a: 'Bangalore\'s terrain in Whitefield, Electronic City, and Sarjapur is underlaid by hard laterite rock, which standard buckets cannot penetrate. Excavators deployed at these IT corridor sites almost always require a hydraulic rock breaker attachment. Confirm at the time of booking whether the vendor\'s machine carries a breaker; without it, daily productivity on hard laterite sites can drop by 60–70%.' },
        { q: 'How do I book construction equipment for my project in Bangalore?', a: 'Bangalore\'s Namma Metro Phase 3, Peripheral Ring Road, and rapid real estate growth in Devanahalli, Sarjapur, and Yelahanka are the biggest equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near metro corridors or Whitefield IT zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Bangalore?', a: 'JCB 3DX backhoe loader rental in Bangalore starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Bangalore?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Bangalore. Key active zones include Namma Metro Phase 2/3 infrastructure, Peripheral Ring Road earthworks, Devanahalli and Yelahanka residential township development, and Sarjapur Road IT campus construction.' },
        { q: 'Does Bangalore\'s rocky soil affect JCB hiring?', a: 'Yes — Bangalore\'s hard laterite rock is the primary booking consideration for JCB hire. A standard JCB 3DX backhoe cannot break laterite; you need a machine fitted with a rock breaker attachment, which not all vendors carry. Always confirm rock breaker availability before booking for sites in Whitefield, Sarjapur, HSR Layout, or Electronic City. TransRentals vendors who have breaker-equipped machines are clearly listed during search.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Bangalore?', a: 'IT equipment moves between tech campuses — monitors, server racks, and office furniture shifting between Koramangala, HSR Layout, Indiranagar, and Whitefield — are Bangalore\'s most frequent mini truck use case. APMC Yeshwanthpur wholesale market generates daily Tata Ace trips carrying vegetables and fruits to retail outlets across the city. Startup office relocations within the Outer Ring Road belt also drive year-round mini truck demand.' },
        { q: 'Can I rent a mini truck for house shifting in Bangalore?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Bangalore. Common routes: Whitefield to Koramangala, Electronic City to HSR Layout, and intra-ORR belt moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Bangalore?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Bangalore\'s Electronics City component supplies, Koramangala startup office equipment moves, and APMC Yeshwanthpur wholesale market deliveries are the most common mini truck use cases in the city.' },
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
      'bus-rental':
        "Hyderabad's IT sector and pilgrimage circuits drive heavy bus rental demand. HITECH City companies hire buses for employee shuttles and team outings to Srisailam (215 km) and Yadagirigutta (65 km). Hyderabad to Tirupati overnight bus trips are extremely popular. TransRentals offers 12-seater tempo travellers to 50-seater AC buses across all of Hyderabad and Secunderabad.",
      'packers-and-movers':
        "Hyderabad's booming IT and pharma sectors, combined with the Telangana government's annual transfer season, make it one of South India's busiest cities for packers and movers. The most active intra-city move corridors are Hitech City to LB Nagar, Gachibowli to Secunderabad, and Kukatpally to Uppal — journeys that can span 25–50 km within the city due to Hyderabad's sprawling geography. April–June is the peak shifting season driven by Telangana government postings and IT appraisal cycles, while intercity moves to Bangalore, Chennai, and Pune peak in the same window; TSRTC road widening on key arterials occasionally disrupts truck access in inner city zones. TransRentals-verified movers cover Hitech City, Gachibowli, Kondapur, Madhapur, Banjara Hills, Jubilee Hills, Kukatpally, LB Nagar, Uppal, Secunderabad, Miyapur, Manikonda, Nallagandla, Attapur, Mehdipatnam, Tolichowki, and Kompally. Get a free quote and book insured movers instantly.",
      'transporter':
        "Hyderabad's pharma cluster in Genome Valley (Shamirpet) and industrial zones in Patancheru and Jeedimetla are major commercial transport users. E-commerce warehouses in Pocharam and Uppal need daily goods movement. TransRentals offers Tata Ace to 40-ft container trucks for intra-city and intercity goods transport across Hyderabad and Telangana.",
      'jcb-on-rent':
        "Hyderabad's ORR expansion, Pharma City development in Mucherla, and IT park construction in Kokapet and Nanakramguda drive continuous JCB demand. Real estate boom in financial district and Tellapur residential zones adds to construction equipment needs. TransRentals provides JCB 3DX backhoe loaders and mini excavators for projects across Greater Hyderabad.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are widely used in Hyderabad for household shifting in apartment complexes and furniture delivery in markets like Begum Bazaar and Charminar. These mini trucks serve Hyderabad's narrow inner-city lanes efficiently. TransRentals has hourly and daily bookings for mini trucks across all Hyderabad zones including Secunderabad and Cyberabad.",
      'tempo-traveller':
        "Hyderabad's corporate and pilgrimage culture makes it one of South India's top tempo traveller markets. Pilgrimages to Tirupati (560 km), Srisailam (215 km), and Yadagirigutta are top routes. HITECH City company outings to Araku Valley (620 km) and Goa are popular. TransRentals offers AC 12–17 seater Tempo Travellers with experienced drivers from Hyderabad.",
      'outstation-car-rental':
        "Outstation cabs from Hyderabad cover Tirupati, Vijayawada, Warangal, Srisailam, Nagarjunasagar, and Bangalore. TransRentals chauffeur-driven outstation cabs offer transparent per-km pricing with no hidden charges. Book online for instant confirmation — available from Secunderabad, Gachibowli, HITECH City, and all Hyderabad zones.",
      'one-way-car-rental':
        "Hyderabad's top one-way routes: Hyderabad to Vijayawada (275 km), Hyderabad to Warangal (148 km), Hyderabad to Bangalore (570 km). No return charges — pay only for the one-way distance. TransRentals one-way pricing is transparent and all-inclusive.",
      'airport-transfer':
        "Rajiv Gandhi International Airport (HYD) is 35 km from HITECH City and 30 km from Banjara Hills. TransRentals airport transfers offer fixed pre-booked pricing with no surge charges. Airport to HITECH City starting from ₹750 for a sedan. Available 24/7 with flight-tracking for arrivals. Book at least 2 hours before departure.",
      'self-drive-car-rentals':
        "Hyderabad's well-designed Outer Ring Road (ORR), wide HITECH City roads, and smooth NH765 to Srisailam make it an ideal city for self-drive car rental. IT professionals in Gachibowli, Kondapur, and Madhapur increasingly prefer self-drive for weekend trips to Nagarjunasagar (165 km) and Srisailam (215 km). TransRentals lists verified self-drive vendors in HITECH City, Secunderabad, Banjara Hills, and Kukatpally with doorstep delivery options. Hatchbacks to SUVs available on daily and weekly plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Hyderabad to Tirupati?', a: 'NH44 to NH140A is the standard route — 560 km in about 9 hours. Alternatively, take a night train and book a local cab from Tirupati station for the final stretch.' },
        { q: 'Is car rental available near HITECH City Hyderabad?', a: 'Yes, TransRentals has multiple pickup points near HITECH City, Gachibowli, and Madhapur. Office hour deliveries (9 AM–6 PM) are most common in these zones.' },
        { q: 'Which areas in Hyderabad have the most car rental options?', a: "Secunderabad, Banjara Hills, Madhapur, and Kukatpally have the highest vendor density. Old City (Charminar area) also has vendors for heritage tour circuits." },
        { q: 'Can I hire a car for a day trip to Nagarjunasagar from Hyderabad?', a: 'Yes, Nagarjunasagar dam is 165 km from Hyderabad (3 hrs via NH565). A day trip is very feasible — leave by 6 AM and return by 6–7 PM.' },
        { q: 'Are wedding car rentals available in Hyderabad?', a: 'Yes, decorated cars and luxury vehicles for wedding baraat and guest transport are available. Book 7–10 days in advance during wedding season (Nov–Feb, May).' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Hyderabad?', a: 'Honda Activa and TVS Jupiter are ideal for Hyderabad daily commuting — easy handling in HITECH City and Kondapur traffic, good mileage, and reliable in all weather.' },
        { q: 'Can I rent a Royal Enfield in Hyderabad for a weekend trip to Warangal?', a: 'Yes, Royal Enfield Classic 350 is available for weekend rentals in Hyderabad. Warangal (148 km, ~2.5 hrs via NH163) is a great day trip on a bike.' },
        { q: 'What is the bike rental cost per day in Hyderabad?', a: 'Activa/Jupiter scooter rentals in Hyderabad start from ₹300/day. Royal Enfield rentals start from ₹800/day. Weekly rates offer 20–30% discount over daily pricing.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller from Hyderabad to Tirupati?', a: 'AC 12-seater Tempo Traveller from Hyderabad to Tirupati (560 km, ~9 hrs) starts from ₹15,000 for a one-way trip. Round-trip pilgrim packages with overnight stay options are available.' },
        { q: 'Can I book a Tempo Traveller for Hyderabad to Srisailam day trip?', a: 'Yes, Hyderabad to Srisailam (215 km, ~4 hrs) is a popular 1-day Tempo Traveller trip. 12-seater AC vehicle for the round trip starts from ₹10,000.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Hyderabad airport to HITECH City?', a: 'Pre-booked cab from RGIA HYD to HITECH City (35 km via ORR) starts from ₹700 for a sedan. Fixed pricing — no surge, even for late-night arrivals.' },
        { q: 'How long does RGIA to Banjara Hills take?', a: 'RGIA to Banjara Hills is approximately 32 km and takes 35–55 minutes via NH765 and ORR. During peak hours (7–9 AM, 5–8 PM), allow 75 minutes.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Hyderabad do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Hyderabad localities — Hitech City, Gachibowli, Kondapur, Madhapur, Banjara Hills, Jubilee Hills, Kukatpally, LB Nagar, Uppal, Secunderabad, Miyapur, Manikonda, Nallagandla, Attapur, Mehdipatnam, Tolichowki, and Kompally. Both intra-city and intercity moves to Bangalore, Chennai, and Pune are available.' },
        { q: 'What is the most common move corridor in Hyderabad — Hitech City to LB Nagar?', a: 'Yes, the Hitech City–LB Nagar corridor (roughly 28–35 km) is Hyderabad\'s busiest move route, driven by IT professionals relocating between west and east zones. The journey can take 45–90 minutes in peak traffic on Outer Ring Road. Moving on weekday mornings before 8 AM or on Sundays significantly reduces transit time.' },
        { q: 'When is the best time to shift house in Hyderabad?', a: 'The ideal shifting window in Hyderabad is mid-month (8th–22nd) and the months of August–September and January–February. April–June is the peak season due to the Telangana government transfer cycle and IT appraisal moves — expect higher rates and tighter availability during this period. Book 5–7 days in advance during peak season.' },
        { q: 'How do movers handle Hyderabad\'s long intra-city distances (e.g., Shamshabad to Kompally)?', a: 'Moves within Hyderabad can cover 45–55 km due to the city\'s sprawling geography — for example, Shamshabad (near the airport) to Kompally in North Hyderabad is over 50 km via ORR. Experienced movers factor this in with dedicated trucks and multi-person teams. Expect 10–14 hours for such long intra-city moves, and book early-morning slots to avoid ORR rush-hour delays.' },
        { q: 'Do Hyderabad movers handle gated communities in Gachibowli and Kondapur?', a: 'Yes, most moves in Gachibowli, Kondapur, Nallagandla, and Manikonda involve large gated apartment complexes with strict vehicle entry protocols. TransRentals-listed movers pre-coordinate with security and building management for truck entry and service lift scheduling (typically 24–48 hours in advance). Inform us of your society name and any vehicle height/weight restrictions at the time of booking.' },
        { q: 'How long does a 2BHK shift take within Hyderabad?', a: 'A standard 2BHK intra-Hyderabad shift (packing + loading + transit + unloading) takes 8–12 hours with a 3–4 person team. Short moves within the same zone (e.g., Gachibowli to Kondapur) take 6–8 hours, while cross-city moves (Kukatpally to Uppal or Hitech City to Secunderabad) take 10–14 hours including ORR transit.' },
        { q: 'Can I move intercity from Hyderabad to Bangalore, Chennai, or Pune?', a: 'Yes — Hyderabad to Bangalore (570 km via NH44), Hyderabad to Chennai (630 km via NH44/NH716), and Hyderabad to Pune (560 km via NH65) are all serviced as full household relocation moves. Full-truck-load packages include professional packing at origin and door-to-door delivery at destination. Get a free quote on TransRentals for intercity pricing.' },
        { q: 'Are movers available on weekends and month-end in Hyderabad?', a: 'Yes, but demand spikes sharply on weekends and between the 28th and 3rd of each month. During April–June government transfer season, the entire month is under peak demand city-wide. Book at least 5–7 days in advance for month-end dates and 3–4 days ahead for weekend shifts. TransRentals confirms your slot with a guaranteed booking.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Hyderabad?', a: 'A 12-seater AC Tempo Traveller in Hyderabad starts from ₹5,000+/day for city trips. A 20-seater mini bus for Srisailam (210 km, ~4 hrs) starts from ₹8,000+/day. For Tirupati pilgrimages (570 km), overnight AC sleeper buses are available from ₹25,000+/day for the round trip.' },
        { q: 'Which bus routes are most popular from Hyderabad?', a: 'Hyderabad to Tirupati (570 km, ~9 hrs via NH44) is the most popular pilgrimage bus route — weekend departures are booked weeks in advance. Hyderabad to Srisailam (210 km, ~4 hrs via NH765) is the top day-trip pilgrimage. Hyderabad to Shirdi (520 km, ~9 hrs) is another highly demanded overnight bus route for group darshan.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Hyderabad?', a: 'Yes, 20–50 seater AC buses are available for Hyderabad weddings and corporate events. HITECH City and Gachibowli IT companies book employee shuttle buses and team outing coaches regularly. Decorated baraat buses start from ₹18,000/day. Book 2–3 weeks in advance during wedding season (Nov–Feb) and IT appraisal outing season (Apr–May).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Hyderabad?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for pharma and auto component logistics are quoted per route. Hyderabad\'s Patancheru industrial zone is the largest truck rental hub in Telangana.' },
        { q: 'What is the top goods transport route from Hyderabad?', a: 'Hyderabad to Bangalore (570 km via NH44, ~10 hrs) is the top industrial FTL corridor — carrying pharma APIs from Genome Valley/Shamirpet and auto components from Patancheru. Part-load (LTL) options are available for smaller consignments. Hyderabad to Mumbai (720 km via NH65) is the second most booked intercity truck route.' },
        { q: 'Which industrial areas in Hyderabad use truck rentals most?', a: 'Patancheru industrial area (chemicals, pharma, auto components), Jeedimetla industrial estate (engineering, plastics), and Genome Valley in Shamirpet (life sciences/biotech) are Hyderabad\'s top truck rental zones. TransRentals has verified vendors serving all three industrial clusters.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Hyderabad per day?', a: 'Self-drive hatchback in Hyderabad starts from ₹899/day. Sedans (Honda City, Dzire) start from ₹1,199/day. SUVs (Creta, Brezza) start from ₹1,599/day. Standard packages include 150–200 km/day — extra km at ₹12–15/km.' },
        { q: 'Can I self-drive from Hyderabad to Nagarjunasagar or Srisailam?', a: 'Yes, Nagarjunasagar (165 km via NH565) and Srisailam (215 km via NH765) are popular self-drive day trips. Confirm outstation permissions with your vendor. Both routes have good highway conditions. Start early — Srisailam forest section closes at sunset for private vehicles.' },
        { q: 'Which areas in Hyderabad have self-drive car rental pickup points?', a: 'HITECH City, Gachibowli, Madhapur, Banjara Hills, and Secunderabad have the highest self-drive vendor availability. Rajiv Gandhi International Airport (RGIA) pickups are available with advance booking.' },
        { q: 'What documents are required for self-drive car rental in Hyderabad?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). Out-of-state DL holders are accepted. International nationals need an IDP (International Driving Permit) along with their home country DL.' },
        { q: 'Are ORR tolls included in Hyderabad self-drive packages?', a: 'No, ORR tolls are paid separately by the driver. Keep change or FASTag ready for ORR toll plazas. The RGIA-to-city ORR toll is approximately ₹70 per car one-way. Most self-drive packages do not include toll charges.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Hyderabad?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Hyderabad Metro expansion, ORR widening projects, HMDA township development, and Pharma City construction in Mucherla generate continuous equipment demand across Greater Hyderabad.' },
        { q: 'Which industries drive the most equipment rental demand in Hyderabad?', a: 'Hyderabad\'s pharmaceutical and biotech corridor — Genome Valley (Turkapally) and Patancheru MIDC — generates consistent demand for concrete equipment, industrial cranes, and generator sets for factory construction and expansion. HMDA-approved large township projects in Kokapet, Narsingi, and Financial District are the other major drivers, requiring tower cranes and transit mixers for high-rise residential and commercial builds.' },
        { q: 'How do I book construction equipment for my project in Hyderabad?', a: 'Hyderabad\'s Pharma City Mucherla, IT park construction in Kokapet and Nanakramguda, and HMDA residential township projects are the biggest equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near ORR expressway zones or Pharma City, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Hyderabad?', a: 'JCB 3DX backhoe loader rental in Hyderabad starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Hyderabad?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Greater Hyderabad. Active zones include Pharma City Mucherla, IT park development in Kokapet and Financial District, Tellapur residential constructions, and ORR widening earthworks at various interchanges.' },
        { q: 'How does black cotton soil affect JCB work in Hyderabad?', a: 'Black cotton (BC) soil is prevalent across much of Hyderabad\'s outskirts and construction zones. BC soil swells significantly during monsoon (July–September), making excavation slippery and unstable, and shrinks hard in summer, increasing resistance for standard buckets. For BC soil sites, request a JCB with a wide bucket to improve material handling; also confirm the vendor can supply a water tanker for dust suppression in summer conditions.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Hyderabad?', a: 'Begum Bazaar — Hyderabad\'s largest wholesale hub for fabrics, plastics, and general goods — generates the city\'s highest volume of Tata Ace and Mahindra Pickup trips for intra-city distribution. HITEC City and Gachibowli IT corridor see frequent mini truck bookings for hardware and furniture moves between offices. Secunderabad market wholesale distribution and cold storage runs for pharmaceutical samples from Patancheru to city hospitals are other common use cases.' },
        { q: 'Can I rent a mini truck for house shifting in Hyderabad?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Hyderabad. Common routes: HITECH City to LB Nagar, Gachibowli to Secunderabad, and intra-Kukatpally moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Hyderabad?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Begum Bazaar wholesale deliveries, Secunderabad market supply runs, and HITEC City IT equipment movement are among the most common mini truck use cases in Hyderabad.' },
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
      'bike-on-rent':
        "Chennai's IT corridor along OMR (Old Mahabalipuram Road) and the wide Marina Beach Road are ideal for two-wheelers. Daily commuters in Velachery, Sholinganallur, and Perungudi prefer Activa and Jupiter for office travel. Royal Enfield Himalayan is popular for ECR (East Coast Road) weekend rides toward Pondicherry. Electric scooters are gaining traction in Chennai's EV-forward climate.",
      'bus-rental':
        "Chennai's Tirupati pilgrimage route (155 km) and ECR resort circuit drive significant bus and tempo traveller demand. IT parks in Sholinganallur, Perungudi, and Ambattur hire employee shuttles and team outing buses regularly. TransRentals offers 12-seater tempo travellers to 50-seater AC luxury buses for pilgrimages, corporate outings, and school trips across Chennai.",
      'packers-and-movers':
        "Chennai's dual engine of IT (OMR corridor) and auto manufacturing (Sriperumbudur, Oragadam) drives steady relocation demand, making it one of South India's most active cities for packers and movers. The busiest intra-city corridors are the OMR IT belt (Sholinganallur, Perungudi, Siruseri) to Anna Nagar, and Tambaram to Perambur, while Velachery to Ambattur and Avadi moves reflect the manufacturing workforce shifts. Peak shifting season is April–June (Tamil Nadu transfer orders + IT appraisal cycle) with a secondary peak in September–October; Chennai's northeast monsoon (October–December) demands special waterproof packing for coastal humidity and potential flooding in low-lying areas like Velachery. TransRentals-verified movers cover Anna Nagar, Adyar, Velachery, OMR (Old Mahabalipuram Road), Tambaram, Porur, Chromepet, Perambur, Nungambakkam, T. Nagar, Mylapore, Sholinganallur, Perungudi, Siruseri, Ambattur, Avadi, and Pallavaram. Get a free quote and book insured movers instantly.",
      'transporter':
        "Chennai's auto manufacturing hub (Sriperumbudur, Oragadam) and major sea port generate massive commercial transport demand. SIPCOT and TIDCO industrial estates in Singaperumalkoil and Maraimalai Nagar are top users. TransRentals offers Tata Ace to 40-ft containers for intra-city delivery and intercity goods transport from Chennai to all major South Indian cities.",
      'jcb-on-rent':
        "Chennai's metro rail Phase 2, Anna Nagar flyover projects, and large-scale residential development in Guduvanchery and Tambaram drive JCB demand. Port-side construction near Ennore and industrial development in Sriperumbudur are major users. TransRentals provides JCB 3DX backhoe loaders and mini excavators for construction, trenching, and demolition across Chennai.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are popular for household shifting in Chennai's apartment complexes and goods delivery in T. Nagar and Sowcarpet markets. These mini trucks handle Chennai's moderately narrow roads and housing society lanes efficiently. TransRentals has hourly and full-day mini-truck bookings with verified drivers across all Chennai zones.",
      'tempo-traveller':
        "Chennai's Tirupati pilgrimage (155 km) and ECR resort route make it a high-demand tempo traveller market. IT company team outings to Pondicherry (160 km) and Yelagiri (220 km) are popular. TransRentals offers AC 12–17 seater Tempo Travellers from Chennai for pilgrimages, corporate outings, and family tours at fixed all-inclusive rates.",
      'outstation-car-rental':
        "Outstation cabs from Chennai with a TransRentals driver cover Pondicherry (ECR), Mahabalipuram, Tirupati, Vellore, Ooty, and Bangalore. Transparent per-km pricing with no hidden charges. ECR coastal route to Pondicherry is the most scenic outstation booking from Chennai — book online for instant confirmation.",
      'one-way-car-rental':
        "Chennai to Pondicherry (160 km via ECR) and Chennai to Bangalore (350 km) are the top one-way cab routes. Pay only for the one direction — no return charges. TransRentals one-way fares include driver, fuel, and standard tolls. Transparent pricing with no surge.",
      'airport-transfer':
        "Chennai International Airport (MAA) is just 16 km from the city center — one of India's most central airports. TransRentals airport transfers cover all Chennai zones with fixed pre-booked pricing. Airport to T. Nagar starting from ₹550 for a sedan. No surge pricing, 24/7 service, flight-tracking for arrivals. Book at least 2 hours before departure.",
      'self-drive-car-rentals':
        "Chennai's ECR (East Coast Road) is one of India's finest coastal drives, making self-drive car rental extremely popular for Pondicherry (160 km) and Mahabalipuram (60 km) trips. IT professionals in OMR and Velachery increasingly choose self-drive over app cabs for weekend escapes. TransRentals lists verified self-drive vendors in Anna Nagar, Velachery, Adyar, OMR, and near Chennai Airport with doorstep delivery. Hatchbacks, sedans, and SUVs available on daily, weekly, and weekend packages.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Is ECR (East Coast Road) good for road trips from Chennai?', a: 'ECR is one of India\'s best coastal drives. Chennai to Pondicherry (160 km via ECR) is a classic road trip with scenic beaches, fishing villages, and the Auroville ashram en route.' },
        { q: 'What is the best car for Chennai to Coimbatore trip?', a: 'A sedan or SUV works well — NH544 is in good condition. For groups of 6+, an Innova or Ertiga is ideal. The 510 km journey takes 8–9 hrs.' },
        { q: 'Is car rental available near Chennai airport?', a: 'Yes, TransRentals has vendors near Chennai International Airport (MAA) in Tirusulam. Pre-booked pickups are available from both domestic and international terminals.' },
        { q: 'What documents do I need to rent a car in Chennai?', a: 'You need a valid DL, Aadhaar Card or Passport for ID, and a security deposit. For self-drive, DL must be at least 1 year old.' },
        { q: 'Can I rent a car in Chennai for a Tirupati pilgrimage?', a: 'Yes, Chennai to Tirupati is 155 km via NH16 (about 3 hrs). Pilgrimage packages with comfortable AC cabs are available. Book 24–48 hrs in advance for peak season.' },
      ],
      'bike-on-rent': [
        { q: 'Which areas in Chennai have the best bike rental options?', a: 'Sholinganallur, Velachery, and Anna Nagar have the highest bike rental density in Chennai due to IT corridors and residential clusters. Book 24 hrs in advance on TransRentals.' },
        { q: 'Can I rent a bike in Chennai for an ECR road trip to Pondicherry?', a: 'Yes, ECR (East Coast Road) from Chennai to Pondicherry (160 km) is one of India\'s best coastal bike rides. Royal Enfield Classic 350 or Himalayan is recommended.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Tempo Traveller from Chennai to Tirupati?', a: 'AC 12-seater Tempo Traveller from Chennai to Tirupati (155 km, ~3.5 hrs) starts from ₹6,000 one-way. Round-trip pilgrim packages with waiting time are available — get a free quote on TransRentals.' },
        { q: 'Can I book a Tempo Traveller from Chennai to Pondicherry?', a: 'Yes, Chennai to Pondicherry via ECR (160 km, ~3 hrs) is a popular corporate and family Tempo Traveller trip. 12-seater AC vehicle starts from ₹6,500 one-way.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Chennai airport to T. Nagar?', a: 'Pre-booked cab from Chennai Airport (MAA) to T. Nagar (18 km) starts from ₹550 for a sedan on TransRentals. No surge pricing — fixed rate for pre-booked rides.' },
        { q: 'How long does it take from Chennai airport to OMR?', a: 'Chennai Airport to Sholinganallur (OMR) is about 22 km and takes 35–50 minutes via NH32. During evening rush (5–8 PM), allow 75 minutes.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Chennai do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Chennai localities — Anna Nagar, Adyar, Velachery, OMR (Old Mahabalipuram Road), Tambaram, Porur, Chromepet, Perambur, Nungambakkam, T. Nagar, Mylapore, Sholinganallur, Perungudi, Siruseri, Ambattur, Avadi, and Pallavaram. Both intra-city and intercity moves to Bangalore, Hyderabad, and Coimbatore are available.' },
        { q: 'What is the most common move route in Chennai — OMR to Anna Nagar?', a: 'Yes, the OMR IT corridor (Sholinganallur, Perungudi, Siruseri) to Anna Nagar is Chennai\'s single busiest move route, covering 25–35 km. IT professionals frequently move between these zones due to company changes. The transit via Inner Ring Road or OMR–Mount Road can take 60–90 minutes in peak traffic, so early-morning weekday starts are recommended.' },
        { q: 'When is the best time to shift house in Chennai?', a: 'The quietest months for shifting in Chennai are August and January–February. April–June is the peak season due to Tamil Nadu government transfers and IT appraisal moves. September–October sees a secondary spike. Avoid the northeast monsoon period (October–December) for moves involving ground-floor or low-lying areas in Velachery, Tambaram, and Perambur due to flooding risk.' },
        { q: 'How do Chennai movers handle coastal humidity during packing?', a: 'Chennai\'s coastal humidity (75–90% RH year-round, peaking during monsoon) requires special packing care for electronics, wooden furniture, and books. TransRentals-listed movers use silica gel packs inside electronic boxes, bubble wrap with moisture-resistant tape for wooden items, and waterproof shrink film for mattresses and sofas. Always mention any high-value electronics or antiques when booking so the team brings appropriate materials.' },
        { q: 'Do Chennai movers handle high-rise apartments and gated communities in OMR?', a: 'Yes, most moves on OMR and in Velachery, Sholinganallur, and Perungudi involve large gated communities. TransRentals-listed movers coordinate with building security for truck entry slots and service lift booking (typically 24–48 hours in advance). Many OMR societies have strict no-vehicle rules during peak hours (8–10 AM) — movers plan around these schedules.' },
        { q: 'How long does a 2BHK shift take within Chennai?', a: 'A standard 2BHK intra-Chennai shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short-haul moves within the same zone (Anna Nagar to Nungambakkam, or Velachery to Adyar) take 5–7 hours. Cross-city moves like OMR to Ambattur or Tambaram to Perambur can take 10–13 hours due to traffic on Anna Salai and the Inner Ring Road.' },
        { q: 'Can I move intercity from Chennai to Bangalore, Hyderabad, or Coimbatore?', a: 'Yes — Chennai to Bangalore (350 km via NH44), Chennai to Hyderabad (630 km via NH716), and Chennai to Coimbatore (510 km via NH544) are all available as full household relocation services. Full-truck-load packages include professional packing, dedicated vehicle, and door-to-door delivery. Get a free quote on TransRentals for exact pricing.' },
        { q: 'Are movers available on weekends and month-end in Chennai?', a: 'Yes, but Chennai sees peak demand on Saturdays and between the 27th and 3rd of each month. During April–June transfer season, slots fill up fast across the entire month. Book at least 5–7 days in advance for month-end moves and 3–4 days ahead for weekend shifts. TransRentals lets you lock your slot with upfront booking confirmation.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Chennai?', a: 'A 12-seater AC Tempo Traveller in Chennai starts from ₹5,000+/day. A 20-seater mini bus for Tirupati (155 km, ~3 hrs) starts from ₹8,000+/day. For Kanyakumari group tours (700 km), full-size AC buses seating 40+ passengers start from ₹30,000+/day for the round trip.' },
        { q: 'Which bus routes are most popular from Chennai?', a: 'Chennai to Tirupati (155 km, ~3 hrs via NH16) is the most popular pilgrimage bus route — darshan packages for groups of 15–40 are booked regularly. Chennai to Pondicherry (160 km via ECR, ~3 hrs) is the top leisure group route. Chennai to Tiruchendur (650 km, ~12 hrs) is a popular overnight bus pilgrimage for Murugan temple devotees.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Chennai?', a: 'Yes, 20–50 seater AC buses are available for Chennai weddings and IT corporate outings. Sriperumbudur auto hub companies and OMR IT parks book team outing coaches to Mahabalipuram and Pondicherry regularly. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance during Karthigai and Margazhi wedding seasons.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Chennai?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for auto manufacturing and port logistics are quoted per route. Chennai\'s Sriperumbudur auto hub is the largest industrial truck demand zone.' },
        { q: 'What is the top goods transport route from Chennai?', a: 'Chennai to Bangalore (350 km via NH44, ~6 hrs) is the primary auto manufacturing corridor — carrying Hyundai, Ford, and Renault components from Sriperumbudur and Oragadam. FTL and LTL options are both available. Chennai port to Pune (1,700 km) is the top long-haul container route.' },
        { q: 'Which industrial areas in Chennai use truck rentals most?', a: 'Sriperumbudur auto manufacturing SEZ, Oragadam industrial corridor (Renault-Nissan, Daimler), and SIPCOT Gummidipoondi (chemicals, plastics) are Chennai\'s top truck rental zones. TransRentals has verified vendors in all three clusters serving daily logistics needs.' },
      ],
      'self-drive-car-rentals': [
        { q: 'Is ECR (East Coast Road) a good drive for a self-drive rental car from Chennai?', a: 'ECR is one of India\'s best coastal highway drives — smooth roads, scenic views, and manageable traffic except on Sunday afternoons. Chennai to Pondicherry (160 km, ~3 hrs) is the most popular ECR self-drive trip. A sedan or compact SUV is ideal for the drive.' },
        { q: 'What is the cost of self-drive car rental in Chennai per day?', a: 'Hatchback self-drive in Chennai starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekly rentals offer 20–25% savings.' },
        { q: 'Can I self-drive from Chennai to Tirupati or Vellore?', a: 'Yes, Chennai to Tirupati (155 km via NH16) and Chennai to Vellore (145 km via NH48) are popular self-drive routes. Confirm outstation permissions with your vendor. For Tirupati, note that the ghat road can be steep — a sedan or SUV with good ground clearance is recommended.' },
        { q: 'Where can I pick up a self-drive car near Chennai airport?', a: 'Vendors near Tirusulam, Pallavaram, and Chromepet serve Chennai Airport pickups. Book at least 24 hours in advance. Some vendors offer free airport drop-off on return if you\'ve booked online via TransRentals.' },
        { q: 'What is the fuel policy for self-drive cars in Chennai?', a: 'Most vendors operate on a full-to-full policy — car is delivered with a full tank and must be returned full. Petrol stations are plentiful across Chennai and on all major highways. Confirm whether the car is petrol or diesel before booking.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Chennai?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Chennai Metro Phase 2, ECR highway widening, Tidel Park expansion in OMR, and Sriperumbudur industrial estate construction drive sustained demand for construction equipment.' },
        { q: 'What are the biggest equipment rental demand drivers in Chennai?', a: 'Sriperumbudur\'s auto manufacturing corridor — supplying components to Hyundai, Ford, and BMW plants — drives year-round demand for industrial cranes, forklifts, and concrete batching equipment for vendor factory construction. Chennai Port\'s Kattupalli expansion and container terminal upgrades also require heavy-lift cranes and harbour construction equipment. Chennai Metro Phase 2 tunnelling is another sustained source of excavation equipment demand.' },
        { q: 'How do I book construction equipment for my project in Chennai?', a: 'Chennai\'s Metro Phase 2 tunneling, Anna Nagar flyover projects, and large-scale residential development in Guduvanchery and Sriperumbudur are the biggest equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near metro work zones or port-side Ennore projects, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Chennai?', a: 'JCB 3DX backhoe loader rental in Chennai starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Chennai?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Chennai. Key active zones include Chennai Metro Phase 2 underground corridors, Sriperumbudur auto manufacturing estate expansion, ECR coastal highway improvement works, and large residential projects in Guduvanchery and Tambaram.' },
        { q: 'What soil conditions should I know before booking a JCB in Chennai?', a: 'Chennai\'s coastal and alluvial soil is relatively soft, making excavation faster than in many other cities. However, sites in T Nagar, Adyar, and Velachery are prone to waterlogging — especially during the northeast monsoon (October–December) — and typically require a dewatering pump running alongside the JCB for any excavation below 1.5 m depth. Confirm pump availability with the vendor before booking monsoon-season work.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Chennai?', a: 'Koyambedu wholesale complex — the largest perishable market in South India — generates hundreds of nightly mini truck runs delivering vegetables, fruits, and flowers to retail markets across Chennai. T Nagar\'s dense textile and garment shops rely on Tata Ace pickups for shop-to-warehouse restocking. Sriperumbudur and Oragadam auto component factories also use mini trucks daily to ferry parts between vendor units and assembly plants.' },
        { q: 'Can I rent a mini truck for house shifting in Chennai?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Chennai. Common routes: OMR (Sholinganallur) to Anna Nagar, Velachery to Adyar, and intra-Tambaram moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Chennai?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Koyambedu market wholesale deliveries, T Nagar textile shop dispatches, and Sriperumbudur auto parts supply runs are among the most common mini truck use cases in Chennai.' },
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
      'bus-rental':
        "Pune's IT and engineering workforce creates strong demand for team outing buses and corporate shuttles. Shirdi (185 km) and Mahabaleshwar (120 km) are the top pilgrimage and leisure bus routes from Pune. Wedding transport in Koregaon Park and Baner areas requires decorated buses during Nov–Feb season. TransRentals offers 12-seater to 50-seater buses across all Pune zones.",
      'packers-and-movers':
        "Pune's fast-expanding IT, manufacturing, and education sectors drive one of Maharashtra's highest per-capita relocation rates, with professionals constantly moving between its rapidly growing residential zones. The busiest intra-city move corridors are Hinjewadi to Kharadi (the twin IT hubs on opposite ends of the city), Baner to Hadapsar, and Pimpri-Chinchwad to Pune city — moves that can span 20–35 km. March–May is peak shifting season driven by lease renewals and IT transfer cycles, while old Pune areas (Deccan, Shivajinagar) present challenges with narrow lanes restricting large truck access. Intercity moves to Mumbai (via Expressway), Nashik, and Bangalore are consistently active year-round. TransRentals-verified movers cover Hinjewadi, Baner, Aundh, Kothrud, Wakad, Pimple Saudagar, Viman Nagar, Kharadi, Hadapsar, Swargate, Deccan, Shivajinagar, Kondhwa, Undri, Wagholi, Magarpatta, Chakan, and Talegaon. Get a free quote and book insured movers in minutes.",
      'transporter':
        "Pune's Chakan industrial belt (auto manufacturing, defense) and Bhosari MIDC are Maharashtra's second-largest industrial cluster. Logistics between Pune, Mumbai, and Nashik require daily truck movement. TransRentals offers Tata Ace to 32-ft container trucks for intra-city goods delivery and intercity freight from Pune across Maharashtra and beyond.",
      'jcb-on-rent':
        "Pune's explosive real estate development in Wakad, Wagholi, Undri, and Manjri drives significant JCB and excavator demand. Metro Phase 1 completion and ongoing Phase 2 construction add to equipment needs. TransRentals provides JCB 3DX backhoe loaders, mini excavators, and compactors for residential, commercial, and infrastructure projects across Pune and PCMC.",
      'mini-truck-rental':
        "Pune's dense apartment clusters in Baner, Kothrud, and Magarpatta City rely on mini trucks for intra-city household shifting. Tata Ace and Bolero Pickup handle Pune's mixed road conditions and apartment loading bays efficiently. TransRentals has daily and hourly mini-truck bookings with verified drivers across Pune including Pimpri-Chinchwad and Kharadi zones.",
      'tempo-traveller':
        "Pune's IT professionals and students drive high demand for tempo travellers to Mahabaleshwar, Shirdi, Lonavala, and Goa. Corporate team outings from Hinjewadi and Baner tech parks are a major segment. TransRentals offers AC 12–17 seater Tempo Travellers from Pune with experienced drivers for corporate, pilgrimage, and leisure group travel.",
      'outstation-car-rental':
        "Outstation cabs from Pune cover Mumbai (Expressway), Mahabaleshwar, Shirdi, Lonavala, Nashik, and Goa. TransRentals chauffeur-driven cabs offer transparent per-km pricing. The Mumbai-Pune Expressway outstation bookings are Pune's most popular — over 200 trips daily. Book online for instant confirmation.",
      'one-way-car-rental':
        "Pune to Mumbai (150 km) via Expressway is Pune's most booked one-way cab. Other popular routes: Pune to Nashik (210 km), Pune to Shirdi (185 km), Pune to Bangalore (840 km). No return charges — all-inclusive transparent pricing on TransRentals.",
      'airport-transfer':
        "Pune Airport (PNQ) is just 12 km from Koregaon Park and 15 km from Hinjewadi IT Park. TransRentals airport transfers offer fixed pre-booked pricing. Airport to Hinjewadi starting from ₹700 for a sedan. 24/7 service, flight-tracking for arrivals, no surge pricing. Book at least 2 hours before departure for guaranteed availability.",
      'self-drive-car-rentals':
        "Pune's young IT workforce and proximity to iconic weekend destinations — Lonavala (65 km), Mahabaleshwar (120 km), and Mumbai Expressway (150 km) — make self-drive car rental highly popular. TransRentals lists verified self-drive vendors in Hinjewadi, Baner, Koregaon Park, Kharadi, and Viman Nagar with quick pickup options. Hatchbacks and compact SUVs dominate bookings. Weekly plans are popular among long-term project consultants who need a car throughout their Pune assignment.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Pune to Mahabaleshwar?', a: 'Take NH48 towards Mumbai then turn at Paud Road or via Wai. The scenic Panchgani ghat route via Wai (120 km, 3 hrs) is recommended for its viewpoints.' },
        { q: 'Is self-drive available in Pune from early morning?', a: 'Yes, most TransRentals vendors in Pune offer pickups from 6 AM. For Mahabaleshwar or Mumbai day trips, early morning departures are highly recommended.' },
        { q: 'What is the cost of a one-way cab from Pune to Mumbai airport?', a: 'A sedan for the 150 km Pune to Mumbai airport trip starts from ₹2,000 depending on the time of day. Book at least 2 hours before your departure.' },
        { q: 'Can I take a rental car from Pune to Goa?', a: 'Yes, Pune to Goa (460 km via NH748) is a popular weekend trip. Most vendors allow intercity travel with advance notice. The journey takes about 8 hours.' },
        { q: 'Are weekly car rentals cheaper in Pune?', a: 'Yes, weekly and monthly rentals offer 20–35% discount over daily rates. For long-term stays or extended project assignments in Pune, weekly rental is more economical.' },
      ],
      'bike-on-rent': [
        { q: 'Which is the most popular bike rental area in Pune?', a: 'FC Road, Koregaon Park, Viman Nagar, and Hinjewadi are top bike rental zones. Hinjewadi vendors cater to IT daily commuters; FC Road and Koregaon Park cater to leisure riders.' },
        { q: 'Can I rent a Royal Enfield in Pune for a Mahabaleshwar trip?', a: 'Yes, Royal Enfield Classic 350 and Himalayan are available for Pune weekend rides. Mahabaleshwar (120 km via NH48) is ideal on a bike — book 24 hrs in advance.' },
        { q: 'What is the daily cost of bike rental in Pune?', a: 'Activa/Jupiter scooters in Pune start from ₹250/day. Royal Enfield rentals start from ₹800/day. Weekly packages starting from ₹1,500 for scooters are available.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller from Pune to Shirdi?', a: 'AC 12-seater Tempo Traveller from Pune to Shirdi (185 km, ~4 hrs) starts from ₹7,000 one-way. Round-trip packages with waiting at Shirdi are available — get a free quote on TransRentals.' },
        { q: 'Can I book a Tempo Traveller from Pune to Goa?', a: 'Yes, Pune to Goa (460 km via NH748, ~8 hrs) Tempo Traveller is popular for group holidays. 12-seater AC vehicle starts from ₹16,000 one-way.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Pune airport to Hinjewadi?', a: 'Pre-booked cab from Pune Airport (PNQ) to Hinjewadi IT Park (18 km) starts from ₹650 on TransRentals. Fixed price, no surge — reliable even for early morning arrivals.' },
        { q: 'How long does it take from Pune airport to Baner?', a: 'Pune Airport to Baner is about 12 km and takes 20–35 minutes in normal traffic. Allow 50 minutes during peak evening traffic (5–8 PM).' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Pune do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Pune localities — Hinjewadi, Baner, Aundh, Kothrud, Wakad, Pimple Saudagar, Viman Nagar, Kharadi, Hadapsar, Swargate, Deccan, Shivajinagar, Kondhwa, Undri, Wagholi, Magarpatta, Chakan, and Talegaon. Pimpri-Chinchwad and PCMC are also covered for cross-twin-city moves.' },
        { q: 'What is the most common move corridor in Pune — Hinjewadi to Kharadi?', a: 'Yes, Hinjewadi to Kharadi (roughly 28–35 km, cutting through the city centre) is Pune\'s busiest move corridor, driven by IT professionals switching between the two major tech hubs. The transit via Baner Road and Kalyani Nagar or via University Road can take 60–90 minutes during peak hours. Early-morning starts (before 8 AM) or Sunday moves are strongly recommended for this route.' },
        { q: 'When is the best time to shift house in Pune?', a: 'The best shifting windows in Pune are mid-month (8th–22nd) and the months of July–September and November–December. March–May is peak season driven by IT transfer cycles, lease renewals, and financial year-end. June also sees elevated demand as monsoon rain makes off-season moves challenging in low-lying areas of Wagholi and Hadapsar.' },
        { q: 'How do movers handle narrow lanes in old Pune areas like Deccan and Shivajinagar?', a: 'Old Pune localities — Deccan Gymkhana, Shivajinagar, Swargate, and Kothrud\'s older pockets — have lanes too narrow for large 20-ft trucks. TransRentals-listed movers use mini trucks (Tata Ace or similar) for these areas, sometimes requiring 2 trips for a full 2BHK. Inform us of your exact lane width at the time of booking so the team brings the right vehicle size.' },
        { q: 'Do Pune movers handle gated societies in Hinjewadi and Baner?', a: 'Yes, most Hinjewadi and Baner moves involve large gated societies with security check-ins and service lift requirements. TransRentals-listed movers pre-coordinate with the society management office for truck entry permission (usually 24–48 hours in advance) and book the service lift slot. Provide your society name, tower, and RWA contact at the time of booking.' },
        { q: 'How long does a 2BHK shift take within Pune?', a: 'A standard 2BHK intra-Pune shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short-haul moves within the same zone (Baner to Aundh, or Kharadi to Viman Nagar) take 5–7 hours. Cross-city moves like Hinjewadi to Hadapsar or Kothrud to Wagholi can take 10–13 hours including peak-hour traffic delays.' },
        { q: 'Can I move intercity from Pune to Mumbai, Nashik, or Bangalore?', a: 'Yes — Pune to Mumbai (150 km via NH48 Expressway), Pune to Nashik (210 km via NH60), and Pune to Bangalore (840 km via NH48/NH67) are all available as full household relocation services. Mumbai is Pune\'s most booked intercity move destination. Full-truck-load packages include professional packing, dedicated truck, and door-to-door delivery. Get a free quote on TransRentals.' },
        { q: 'Are movers available on weekends and month-end in Pune?', a: 'Yes, but Pune sees sharp demand spikes on Saturdays and between the 27th and 3rd of the month. During March–May IT transfer season, even mid-week dates get fully booked early. Book at least 5–7 days in advance for month-end slots and 3–4 days ahead for weekend shifts. TransRentals lets you confirm your preferred date and time upfront.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Pune?', a: 'A 12-seater AC Tempo Traveller in Pune starts from ₹5,000+/day. A 20-seater mini bus for Shirdi (185 km, ~4 hrs) starts from ₹9,000+/day. For Mahabaleshwar day trips (120 km), a 17-seater AC Tempo Traveller is most popular and starts from ₹6,000+/day. Corporate outings to Goa (460 km) are available from ₹20,000+/day.' },
        { q: 'Which bus routes are most popular from Pune?', a: 'Pune to Shirdi (185 km, ~4 hrs via NH60) is the most popular pilgrimage group route — AC buses for 20–45 passengers are booked year-round. Pune to Mahabaleshwar (120 km, ~3 hrs) is the top leisure group route during monsoon. Pune to Nashik (210 km, ~4 hrs via NH60) is popular for Trimbakeshwar pilgrimage groups.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Pune?', a: 'Yes, 20–50 seater AC buses are available for Pune weddings and corporate events. Hinjewadi and Baner IT park companies book outing buses to Mahabaleshwar and Lonavala regularly. Decorated baraat buses start from ₹15,000/day. The Chakan MIDC auto sector also books employee shuttles. Book 2–3 weeks in advance during peak season (Oct–Feb).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Pune?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for the Chakan MIDC auto manufacturing corridor are quoted per route. Bhosari MIDC is Maharashtra\'s second-largest industrial estate and a major truck rental hub.' },
        { q: 'What is the top goods transport route from Pune?', a: 'Pune to Mumbai (150 km via NH48 Expressway, ~3 hrs) is Pune\'s busiest truck corridor — carrying auto parts from Chakan MIDC and engineering goods from Bhosari. FTL and LTL options are both available. Pune to Bangalore (840 km via NH48/NH67) is the major south-bound auto component route.' },
        { q: 'Which industrial areas in Pune use truck rentals most?', a: 'Chakan MIDC (auto manufacturing — Volkswagen, General Motors, Mahindra), Bhosari MIDC (engineering, defense), and Ranjangaon MIDC (chemicals, FMCG) are Pune\'s top truck rental zones. TransRentals has verified vendors in all three industrial corridors.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Pune per day?', a: 'Hatchback self-drive in Pune starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Creta, XUV300) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekend packages (Fri evening to Mon morning) offer flat rates.' },
        { q: 'Can I drive a self-drive rental car from Pune to Lonavala or Mahabaleshwar?', a: 'Yes, most Pune vendors allow Expressway travel. Lonavala (65 km via NH48, ~1.5 hrs) and Mahabaleshwar (120 km via NH48 then SH58, ~3 hrs) are the most popular self-drive destinations. Note: Mahabaleshwar ghat section requires careful driving — confirm your driving comfort before booking.' },
        { q: 'Can I use a Pune self-drive rental on the Mumbai-Pune Expressway?', a: 'Yes, most vendors permit Expressway usage. The Mumbai-Pune Expressway (NH48) is one of India\'s safest and smoothest highways. Speed limit is 100 km/h. Keep FASTag activated for toll-free passage through Khopoli and Urse toll plazas.' },
        { q: 'Which areas in Pune have the most self-drive rental options?', a: 'Hinjewadi, Baner, Koregaon Park, Kharadi, Viman Nagar, and Kothrud are the top self-drive pickup zones. Pune Airport (PNQ) pickup is available with prior booking. Doorstep delivery in all Pimpri-Chinchwad and PCMC zones is also available.' },
        { q: 'Are monthly self-drive plans available in Pune?', a: 'Yes, monthly self-drive plans in Pune start from ₹18,000/month for a hatchback (2,000–3,000 km included). These are popular with IT consultants on 3–6 month project assignments in Pune. Monthly plans offer significant savings over daily rates.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Pune?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Pune Metro expansion, Ring Road development, Purandar Airport land work, and Hinjewadi Phase 3 IT park construction create sustained equipment demand across Pune and PCMC.' },
        { q: 'What construction projects drive the most equipment rental demand in Pune?', a: 'Chakan MIDC\'s auto manufacturing cluster — with supplier factories for Tata Motors, Mercedes-Benz, and Volkswagen — is the largest source of industrial crane and concrete equipment demand in the Pune region. Pune Metro Phase 2 underground tunnel work in the PMC area requires tunnel boring equipment and piling rigs. Large residential townships in Wakad, Hinjewadi, and Balewadi also sustain year-round tower crane and batching plant demand.' },
        { q: 'How do I book construction equipment for my project in Pune?', a: 'Pune\'s Metro Phase 2 construction, Ring Road earthworks, and rapid real estate development in Wakad, Wagholi, and Undri are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near Hinjewadi or Chakan industrial zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Pune?', a: 'JCB 3DX backhoe loader rental in Pune starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Pune?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Pune and PCMC. Active construction zones include Pune Metro Phase 2 underground sections, Ring Road earthworks, Hinjewadi Phase 3 IT park development, and residential projects in Wakad, Undri, and Manjri.' },
        { q: 'Does Pune\'s rocky terrain affect JCB availability?', a: 'Pune sits on the Deccan Trap basalt formation — hard volcanic rock that a standard JCB bucket cannot excavate. Rock breaker attachments are routinely needed for foundation work in Kothrud, Wakad, Baner, and most of the western suburbs. Always confirm with your TransRentals vendor that the machine comes with a hydraulic rock breaker before booking; some contractors also rent a separate breaker attachment if the base machine doesn\'t carry one.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Pune?', a: 'Hinjewadi IT Park furniture and equipment moves — office refits, workstation installs, and inter-campus transfers — are among Pune\'s most frequent mini truck use cases. Bhavani Peth wholesale market (hardware, textiles, general goods) relies on daily Tata Ace pickups for distribution to retail stores across Pune. Pimpri-Chinchwad\'s auto component factories also use mini trucks constantly for inter-plant parts movement between Chakan, Bhosari, and Chinchwad MIDC.' },
        { q: 'Can I rent a mini truck for house shifting in Pune?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Pune. Common routes: Hinjewadi to Baner, Kothrud to Kharadi, and intra-Hadapsar moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Pune?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Bhavani Peth wholesale deliveries, Hinjewadi IT park equipment moves, and Pimpri-Chinchwad auto parts supply runs to Chakan MIDC are among the most common mini truck use cases in Pune.' },
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
    serviceIntros: {
      'car-rental':
        "Ahmedabad, Gujarat's business capital, has a thriving car rental market driven by pharma and textile industry professionals, heritage tourists, and pilgrims. Innova Crysta and Swift Dzire lead bookings. SG Road, CG Road, and Navrangpura are top pickup zones. TransRentals has 80+ verified Ahmedabad vendors with same-day bookings covering all city zones including GIFT City and Bopal.",
      'bike-on-rent':
        "Ahmedabad's wide roads and flat terrain make it ideal for two-wheeler rentals. Heritage trail biking — from Sabarmati Ashram to Adalaj Stepwell — is increasingly popular with tourists. Daily commuters in Satellite and Bodakdev prefer Activa and Jupiter. TransRentals has bike rentals available across Ahmedabad including Maninagar, Navrangpura, and Chandkheda.",
      'bus-rental':
        "Ahmedabad's pilgrimage and festival culture drives strong bus demand. Dwarka (450 km), Somnath (400 km), and Palitana (215 km) pilgrimages are top group travel routes. Navratri season (October) creates massive bus demand for dandiya events and temple visits. TransRentals offers 12-seater tempo travellers to 50-seater AC buses across all Ahmedabad zones.",
      'packers-and-movers':
        "Ahmedabad's rapid residential expansion along the SG Highway corridor and emergence of new townships in Bopal, Shela, and South Bopal have made it one of Gujarat's busiest cities for packers and movers. The most active move corridors are SG Highway to Maninagar, Bopal to Chandkheda, and Satellite to Naroda — reflecting the city's growth from its traditional east-side core toward new western and northern townships. Peak shifting season is April–June (Gujarat's summer + government transfer orders + financial year-end), and March also sees heavy activity; the extreme summer heat (April–June, regularly 42–45°C) demands AC trucks to protect electronics and wooden furniture during transit. Intercity moves to Surat, Rajkot, Mumbai, and Vadodara remain active year-round. TransRentals-verified movers cover Prahlad Nagar, Bodakdev, Vastrapur, Satellite, Thaltej, SG Highway, Navrangpura, Maninagar, Chandkheda, Bopal, South Bopal, Gota, Naroda, Vastral, Science City Road, Shela, Ambli, and Jodhpur. Get a free quote and book insured movers instantly.",
      'transporter':
        "Ahmedabad is Gujarat's pharma, textile, and chemical export hub — GIDC Naroda, Vatva, and Changodar industrial estates generate massive commercial truck demand. APMC Ahmedabad is India's largest perishable goods market, requiring daily refrigerated and standard truck movement. TransRentals offers verified transporters with Tata Ace to 40-ft container trucks across Ahmedabad.",
      'jcb-on-rent':
        "Ahmedabad's BRTS extension, metro Phase 2, and massive residential township development in Shela, Sanand, and Bavla drive continuous JCB and excavator demand. GIFT City financial district ongoing construction is a major user. TransRentals provides JCB 3DX backhoe loaders and mini excavators for civil construction and infrastructure projects across Ahmedabad and Gandhinagar.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are widely used in Ahmedabad for household shifting in new townships and goods delivery in Manek Chowk and Law Garden markets. These mini trucks handle Ahmedabad's mixed road types efficiently. TransRentals has same-day mini-truck bookings with verified drivers across all Ahmedabad zones including Bopal and Gota.",
      'tempo-traveller':
        "Ahmedabad's pilgrim culture and Gujarat's famous temple circuit make it one of Gujarat's top tempo traveller markets. Dwarka-Somnath-Gir circuit (850 km round trip) and Palitana Jain temples are top group routes. Rann of Kutch seasonal tourism (Nov–Feb) creates massive 12–17 seater demand. TransRentals offers AC Tempo Travellers from Ahmedabad with experienced Gujarat highway drivers.",
      'outstation-car-rental':
        "Outstation cabs from Ahmedabad cover Gujarat's top destinations: Dwarka (450 km), Gir Forest (350 km), Somnath (400 km), Rann of Kutch (400 km), and Vadodara (110 km). TransRentals offers transparent per-km pricing. Pre-book online for instant confirmation — available from all Ahmedabad zones.",
      'one-way-car-rental':
        "Ahmedabad's top one-way cab routes: Ahmedabad to Surat (270 km), Ahmedabad to Vadodara (110 km), Ahmedabad to Rajkot (220 km), Ahmedabad to Mumbai (530 km). No return charges on TransRentals one-way bookings.",
      'airport-transfer':
        "Sardar Vallabhbhai Patel Airport (AMD) is 12 km from Navrangpura and 15 km from SG Road. TransRentals airport transfers offer fixed pre-booked pricing across all Ahmedabad zones. Airport to CG Road starting from ₹500 for a sedan. No surge pricing, 24/7 service, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Ahmedabad's wide roads on SG Road and CG Road, combined with excellent expressway access to Vadodara (110 km via NH48) and Mount Abu (225 km), make self-drive car rental very convenient. Popular weekend routes include the Rann of Kutch (400 km via NH41) for seasonal travelers and Saurashtra circuit drives. TransRentals lists verified self-drive vendors in Navrangpura, Satellite, Bodakdev, and near Sardar Patel Airport. Note: Gujarat is a dry state — alcohol is not permitted in vehicles. Hatchbacks to SUVs available on daily and weekly plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for Ahmedabad to Dwarka pilgrimage?', a: 'An Innova Crysta or Ertiga is ideal for the Ahmedabad-Dwarka pilgrimage (450 km, ~7.5 hrs via NH947). For 4–6 passengers, book an SUV for comfort on the long highway stretch.' },
        { q: 'Is self-drive car rental available in Ahmedabad?', a: 'Yes, self-drive cars are available in Ahmedabad. You need a valid DL (min 1 year), Aadhaar, and security deposit. Most vendors are in Navrangpura, Satellite, and Chandkheda areas.' },
        { q: 'What is the cost of a cab from Ahmedabad to Surat?', a: 'One-way cab from Ahmedabad to Surat (270 km via NH48) starts from ₹2,500 for a sedan. The journey takes about 4.5 hours on the excellent NH48 highway.' },
        { q: 'Are car rentals available in Ahmedabad during Navratri?', a: 'Yes, but demand spikes 3x during Navratri (October). Book your rental vehicle at least 1 week in advance. Prices may be higher during peak Navratri weekends.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Ahmedabad?', a: 'A 12-seater AC Tempo Traveller in Ahmedabad starts from ₹5,000+/day. A 20-seater mini bus for Dwarka (450 km, ~7.5 hrs) starts from ₹12,000+/day. For Somnath pilgrimages (410 km), 40-seater AC buses are available from ₹18,000+/day. Rann of Kutch seasonal tours (400 km) require advance booking, especially during Rann Utsav (Nov–Feb).' },
        { q: 'Which bus routes are most popular from Ahmedabad?', a: 'Ahmedabad to Dwarka (450 km, ~7.5 hrs via NH947) is the most popular pilgrimage bus route — Saurashtra circuits for groups of 20–50 are booked throughout the year. Ahmedabad to Somnath (410 km, ~7 hrs) is the second most booked pilgrimage. Ahmedabad to Rann of Kutch (400 km, ~7 hrs via NH41) is hugely popular during the Rann Utsav festival season.' },
        { q: 'Can I hire a bus for a wedding or Navratri event in Ahmedabad?', a: 'Yes, 20–50 seater AC buses are available for Ahmedabad weddings and Navratri events. Gujarat\'s large wedding functions and garba events in October see massive demand — book 3–4 weeks in advance. GIDC Naroda and Vatva industrial companies also book employee shuttle and outing buses. Decorated baraat buses start from ₹15,000/day.' },
      ],
      'transporter': [
        { q: 'Which industrial areas in Ahmedabad need most truck rentals?', a: 'GIDC Naroda, Vatva Chemical Zone, Changodar Industrial Estate, and APMC Yard are Ahmedabad\'s top truck rental hubs. TransRentals has verified vendors in all these zones.' },
        { q: 'What is truck rental cost in Ahmedabad per day?', a: 'Tata Ace (1T) starts from ₹2,500/day. Tata 407 (5T) starts from ₹5,500/day. Container trucks for long-haul to Mumbai or Delhi are quoted per trip.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Tempo Traveller for Ahmedabad to Dwarka?', a: 'AC 12-seater Tempo Traveller from Ahmedabad to Dwarka (450 km, ~7.5 hrs) starts from ₹12,000 one-way. 2-day Dwarka-Somnath-Gir pilgrimage packages are very popular.' },
        { q: 'Can I book a Tempo Traveller for Rann of Kutch from Ahmedabad?', a: 'Yes, Ahmedabad to Rann of Kutch (400 km, ~7 hrs) is very popular during Rann Utsav (Nov–Feb). 12-seater AC Tempo Traveller starts from ₹11,000 one-way. Book weeks in advance during festival season.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Ahmedabad airport to Navrangpura?', a: 'Pre-booked cab from AMD Airport to Navrangpura (12 km) starts from ₹480 on TransRentals. Fixed pricing — no surge even during late-night arrivals.' },
        { q: 'How long does it take from Ahmedabad airport to SG Road?', a: 'AMD Airport to SG Road (Satellite) is 14–18 km and takes 25–40 minutes. Allow 60 minutes during peak morning traffic (8–10 AM).' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Ahmedabad do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Ahmedabad localities — Prahlad Nagar, Bodakdev, Vastrapur, Satellite, Thaltej, SG Highway, Navrangpura, Maninagar, Chandkheda, Bopal, South Bopal, Gota, Naroda, Vastral, Science City Road, Shela, Ambli, and Jodhpur. Intercity moves to Surat, Rajkot, Vadodara, and Mumbai are also available.' },
        { q: 'What is the most common move corridor in Ahmedabad — SG Highway to Maninagar?', a: 'Yes, the SG Highway corridor (Prahlad Nagar, Satellite, Bodakdev) to Maninagar is one of Ahmedabad\'s busiest move routes, reflecting families moving from traditional east-Ahmedabad to newer western townships. The distance is 20–30 km and transit takes 40–70 minutes depending on traffic. Early-morning weekday or Sunday starts are recommended to avoid SG Road rush hour.' },
        { q: 'When is the best time to shift house in Ahmedabad?', a: 'The ideal shifting months in Ahmedabad are October–November (post-monsoon, pre-winter festive) and January–February. April–June is peak season due to Gujarat government transfer orders and the financial year-end cycle — combined with extreme heat (40–45°C), making this the most challenging period logistically. If you must move in summer, book early-morning slots (6–9 AM) before temperatures peak.' },
        { q: 'How does summer heat (April–June) affect household shifting in Ahmedabad?', a: 'Ahmedabad summers regularly hit 42–45°C, which can damage electronics, wooden furniture, and certain household items during transit in non-AC trucks. TransRentals-listed movers use insulated wrapping and thermal blankets for sensitive electronics, and ideally schedule loading and unloading during early morning (6–9 AM) or evening (6–8 PM). For high-value items, specifically request an AC truck or a thermally insulated vehicle when booking.' },
        { q: 'Do Ahmedabad movers handle high-rise buildings in new townships like Bopal and Chandkheda?', a: 'Yes, new township areas like Bopal, South Bopal, Chandkheda, and Gota have multi-story apartment complexes. TransRentals-listed movers coordinate with the building\'s security and management for truck entry and service lift scheduling (typically 24–48 hours in advance). Always provide the society name, block number, and any vehicle size restrictions at the time of booking.' },
        { q: 'How long does a 2BHK shift take within Ahmedabad?', a: 'A standard 2BHK intra-Ahmedabad shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short moves within the same zone (Satellite to Bodakdev, or Maninagar to Vastral) take 5–7 hours. Cross-city moves along the SG Highway corridor (Bopal to Naroda or Chandkheda to Maninagar) can take 10–13 hours due to the longer distances within this spread-out city.' },
        { q: 'Can I move intercity from Ahmedabad to Surat, Rajkot, Mumbai, or Vadodara?', a: 'Yes — Ahmedabad to Surat (270 km via NH48), Ahmedabad to Rajkot (220 km via NH947), Ahmedabad to Vadodara (110 km via NH48), and Ahmedabad to Mumbai (530 km via NH48) are all available as full household relocation services. The Ahmedabad–Vadodara Expressway makes the Vadodara move particularly fast. Get a free quote on TransRentals for intercity pricing.' },
        { q: 'Are movers available on weekends and month-end in Ahmedabad?', a: 'Yes, but Ahmedabad sees heightened demand on Saturdays and between the 28th and 3rd of each month. During April–June peak season, slots across all dates fill up quickly. Book at least 5–7 days in advance for month-end dates and 3–4 days ahead for weekend shifts. TransRentals allows you to lock your preferred time slot with upfront booking confirmation.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Ahmedabad per day?', a: 'Hatchback self-drive in Ahmedabad starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekly packages offer significant savings.' },
        { q: 'What are the best outstation self-drive routes from Ahmedabad?', a: 'Ahmedabad to Vadodara (110 km via NH48, ~2 hrs) is the easiest expressway drive. Ahmedabad to Mount Abu (225 km via NH48 then SH5, ~4 hrs) is ideal for a weekend trip. Rann of Kutch (400 km via NH41) during Rann Utsav (Nov–Feb) is the most scenic long self-drive from Ahmedabad.' },
        { q: 'Which areas in Ahmedabad have self-drive car rental pickup points?', a: 'Navrangpura, Satellite, Bodakdev, SG Road, and near Sardar Vallabhbhai Patel Airport (AMD) have the highest self-drive vendor density. Doorstep delivery is available across all Ahmedabad zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive car rental in Ahmedabad?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). Gujarat is a dry state — no alcohol should be carried in rental vehicles. PAN card may be requested as secondary ID for SUV rentals.' },
        { q: 'Are there any Gujarat-specific rules for self-drive car rentals?', a: 'Gujarat is a prohibition state — carrying or consuming alcohol in vehicles is illegal. Keep vehicle registration and insurance documents in the car at all times. NH48 (Ahmedabad-Vadodara Expressway) requires FASTag — ensure activation before departure. Some vendors require outstation permission for trips beyond 150 km.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Ahmedabad?', a: 'Honda Activa and TVS Jupiter are ideal for Ahmedabad daily commuting — excellent on the wide BRTS corridors, Navrangpura roads, and SG Highway feeder lanes. Fuel-efficient and easy to park near office zones in Satellite and Bodakdev.' },
        { q: 'Can I rent a Royal Enfield in Ahmedabad for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available for weekend trips from Ahmedabad. A popular ride is Ahmedabad to Gandhinagar (30 km, ~45 min) or further to Patan or Modhera Sun Temple (100 km). Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Ahmedabad?', a: '24-hour minimum is standard across Ahmedabad vendors. Some Navrangpura and Satellite vendors offer 4–8 hour packages for city use. Monthly rentals offer the best per-day rate and are popular with IT professionals on SG Highway.' },
        { q: 'Are electric scooters available on rent in Ahmedabad?', a: 'Yes, electric scooters are growing in availability in Ahmedabad under Gujarat\'s EV push. Ideal for short-distance city commuting in Navrangpura, Bopal, and Satellite zones. Charge points are increasingly available at malls and IT parks on SG Road.' },
        { q: 'What documents are needed to rent a bike in Ahmedabad?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport as ID, and a refundable security deposit of ₹1,500–₹3,000. Some vendors take photo ID only for short city rides. Note: Gujarat is a dry state — no alcohol should be carried while riding a rental bike.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Ahmedabad?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. GIFT City ongoing construction, Bullet Train station earthworks, Metro Phase 2 expansion, and GIDC industrial estate development across Ahmedabad and Gandhinagar drive steady equipment demand.' },
        { q: 'Which major projects are driving equipment rental demand in Ahmedabad?', a: 'GIFT City\'s ongoing high-rise commercial construction is one of the largest single sources of tower crane and concrete pump demand in Ahmedabad. The Mumbai-Ahmedabad High Speed Rail (Bullet Train) station and viaduct work around Sabarmati adds significant piling and beam-launching equipment requirement. GIDC Naroda and Vatva industrial estates also see sustained demand for generator sets and construction equipment from new plant developments.' },
        { q: 'How do I book construction equipment for my project in Ahmedabad?', a: 'Ahmedabad\'s GIFT City financial district, Bullet Train station site near Sabarmati, and large residential township projects in Shela, Sanand, and Bavla are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near GIFT City or metro work zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Ahmedabad?', a: 'JCB 3DX backhoe loader rental in Ahmedabad starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Ahmedabad?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Ahmedabad. Active zones include GIFT City Phase 2 infrastructure, Bullet Train viaduct construction, Metro Phase 2 underground sections, and township development in Sanand, Shela, and Bavla on Ahmedabad\'s outskirts.' },
        { q: 'What permissions are required for JCB work in Ahmedabad?', a: 'Ahmedabad has a dual-authority structure: sites within AMC (Ahmedabad Municipal Corporation) limits require an AMC road-cutting NOC, while sites in the extended AUDA (Ahmedabad Urban Development Authority) area need an AUDA permission. GIFT City has its own regulatory authority (GIFTGIFTA) with a separate NOC process. Always confirm which authority covers your site before booking, as operating without a permit risks machine seizure and work stoppage.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Ahmedabad?', a: 'APMC Ahmedabad\'s wholesale perishable market is the biggest driver of early-morning Tata Ace trips, distributing vegetables and fruits to retail shops across the city before sunrise. Manek Chowk and Lal Darwaja wholesale markets generate daily mini truck runs for general goods and packaging material. Saraspur and Rakhial textile industrial areas use mini trucks constantly to move bales of fabric between mills, dyeing units, and export packaging houses.' },
        { q: 'Can I rent a mini truck for house shifting in Ahmedabad?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Ahmedabad. Common routes: Satellite to Bopal, Navrangpura to Chandkheda, and intra-Maninagar moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Ahmedabad?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Manek Chowk market deliveries, APMC Ahmedabad wholesale dispatches, and textile deliveries between Saraspur and Saijpur weaving units are the most common mini truck use cases in Ahmedabad.' },
      ],
    },
    thingsToDo: [
      {
        name: 'Sabarmati Ashram',
        category: 'Heritage',
        description: "Mahatma Gandhi's riverside residence from 1917–1930, and the starting point of the historic Dandi March. The museum, prayer ground, and Gandhi's living quarters draw history buffs and pilgrims year-round.",
        distance: '6 km from city center',
      },
      {
        name: 'Adalaj Stepwell',
        category: 'Heritage',
        description: 'A stunning 5-storey stepwell from 1499 with intricate Indo-Islamic carvings. One of Gujarat\'s finest examples of stepwell architecture, and a popular half-day heritage trail stop with Sabarmati Ashram.',
        distance: '19 km, en route to Gandhinagar',
      },
      {
        name: 'Sidi Saiyyed Mosque',
        category: 'Heritage',
        description: "Famous worldwide for its ten intricately carved stone jali (lattice) windows, especially the iconic 'Tree of Life'. A quick but unmissable stop in the old walled city.",
        distance: 'In the old city, near Lal Darwaja',
      },
      {
        name: 'Kankaria Lake',
        category: 'Family & Leisure',
        description: 'A lively lakefront with a zoo, toy train, balloon safari, water rides, and an evening food street. Best visited at sunset — the walking promenade around the lake is a favorite with families and joggers.',
        distance: '7 km from city center',
      },
      {
        name: 'Law Garden & Manek Chowk',
        category: 'Food & Shopping',
        description: 'Law Garden\'s night market is famous for Gujarati handicrafts, mirror-work and bandhani textiles, while Manek Chowk transforms into a legendary street-food hub after 9 PM — try the loaded pav bhaji and cheese sandwiches.',
        distance: 'Navrangpura / Old city',
      },
      {
        name: 'Sarkhej Roza',
        category: 'Heritage',
        description: 'A serene 15th-century mosque, tomb, and palace complex around a stepped lake, often called the "Ahmedabad Acropolis" for its blend of Hindu and Islamic architecture. Far quieter than the city\'s other monuments.',
        distance: '8 km from city center',
      },
    ],
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
    serviceIntros: {
      'car-rental':
        "Kolkata's diverse demand — from corporate travel in Salt Lake Sector V and Rajarhat to cultural tourism around Howrah Bridge and Dakshineswar — makes it one of East India's largest car rental markets. Innova and Swift Dzire lead bookings. TransRentals has 100+ verified Kolkata vendors with doorstep delivery across Park Street, Salt Lake, Rajarhat, Howrah, and airport zone.",
      'bike-on-rent':
        "Kolkata's flat terrain and moderate traffic compared to metros make bikes and scooters popular for daily city travel. College Street, South Kolkata, and Salt Lake IT hubs see steady bike rental demand. Royal Enfield Classic 350 is popular for weekend rides to Digha and Mandarmani beaches. TransRentals has bike rentals across Kolkata including Park Circus and New Town Rajarhat.",
      'bus-rental':
        "Kolkata's Durga Puja pandal-hopping, corporate team outings, and pilgrimages to Puri (500 km) and Tarapith (210 km) drive high bus demand. IT companies in Salt Lake and Rajarhat book buses for Digha and Mandarmani weekend outings. TransRentals offers 12-seater tempo travellers to 50-seater AC buses across Kolkata, Howrah, and North/South 24 Parganas.",
      'packers-and-movers':
        "Kolkata's growing IT sector in Salt Lake Sector V and New Town Rajarhat, combined with large government and PSU establishments, creates consistent demand for packers and movers across the city. The most active move corridors are Salt Lake to Howrah, New Town Rajarhat to South Kolkata (Tollygunge, Garia, Jadavpur), and Dum Dum to South Kolkata — routes that cross the city's iconic bridges and can take 60–90 minutes during peak traffic. Peak shifting seasons are March–May (before monsoon and financial year-end) and October–November (post-Durga Puja); monsoon flooding (June–September) affects North Kolkata lanes and some Howrah areas, requiring ferry-assisted moves for certain riverside localities. TransRentals-verified movers cover Salt Lake, New Town (Rajarhat), Howrah, Behala, Tollygunge, Park Street, Alipore, Dum Dum, Barasat, Garia, Jadavpur, Ballygunge, Lake Town, Shyambazar, Belgharia, Sodepur, Barrackpore, and Narendrapur. Get a free quote and book insured movers instantly.",
      'transporter':
        "Kolkata's Kidderpore Dock, Budge Budge industrial belt, and Dankuni Logistics Hub are major commercial transport centers. Haldia port logistics require continuous truck movement. TransRentals provides verified transporters with mini trucks to 40-ft containers for intra-city goods movement and intercity freight across Kolkata and West Bengal.",
      'jcb-on-rent':
        "Kolkata's ongoing metro extensions (Green, Orange, Purple lines), Rajarhat New Town development, and massive residential projects in Madhyamgram and Narendrapur drive JCB demand. Port Trust construction in Haldia is a major user. TransRentals offers JCB 3DX backhoe loaders and excavators for construction and earthwork projects across Greater Kolkata.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are widely used in Kolkata for household shifting across narrow Kolkata lanes and market delivery in Burrabazar and Gariahat. These mini trucks navigate Kolkata's complex road network efficiently. TransRentals has same-day mini-truck bookings with verified drivers across all Kolkata zones including Howrah and Barrackpore.",
      'tempo-traveller':
        "Kolkata's Durga Puja season and pilgrimage routes to Puri and Tarapith make it a high-demand tempo traveller market. Corporate team outings to Digha (185 km) and Mandarmani (170 km) are extremely popular. TransRentals offers AC 12–17 seater Tempo Travellers from Kolkata for pilgrimages, corporate outings, and leisure group travel.",
      'outstation-car-rental':
        "Outstation cabs from Kolkata cover Digha, Puri, Siliguri (for Darjeeling), Santiniketan, and the Sundarbans corridor. TransRentals offers transparent per-km pricing with all-inclusive fares. Pre-book online for instant confirmation from any Kolkata zone.",
      'one-way-car-rental':
        "Kolkata's top one-way routes: Kolkata to Siliguri (600 km), Kolkata to Digha (185 km), Kolkata to Bhubaneswar (460 km). No return charges — pay only for the one-way distance. All-inclusive transparent pricing on TransRentals.",
      'airport-transfer':
        "Netaji Subhash Chandra Bose Airport (CCU) is 17 km from Salt Lake and 22 km from Park Street. TransRentals airport transfers offer fixed pre-booked pricing. Airport to Salt Lake Sector V starting from ₹600 for a sedan. 24/7 service, no surge pricing, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Kolkata's Eastern Metro corridor and improving highway network make self-drive car rental increasingly popular for weekend escapes. Popular self-drive routes include Digha (180 km via NH16), Shantiniketan (160 km via NH19), and Mandarmani (190 km). Self-drive vendors are concentrated in Salt Lake, Rajarhat New Town, and Behala. Note: West Bengal roads can be narrow and bumpy outside city and NH stretches — night drives on rural routes are not recommended. Hatchbacks and sedans are the most popular categories.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Kolkata to Digha beach?', a: 'NH16 from Kolkata to Digha (185 km, ~4 hrs) is the standard route. Leave by 6 AM on weekends to avoid heavy traffic. The road has improved significantly in recent years.' },
        { q: 'Is self-drive car rental available in Kolkata?', a: 'Yes, self-drive cars are available in Kolkata — primarily in Salt Lake, Rajarhat, and Behala zones. You need a valid DL, Aadhaar, and security deposit.' },
        { q: 'What is the cost of a cab from Kolkata to Siliguri?', a: 'One-way cab from Kolkata to Siliguri (600 km via NH12, ~10 hrs) starts from ₹5,500 for a sedan. For Darjeeling connections, Siliguri is the road-head.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Tempo Traveller from Kolkata to Puri?', a: 'AC 12-seater Tempo Traveller from Kolkata to Puri (500 km via NH16, ~9 hrs) starts from ₹14,000 one-way. 2-night Puri packages with return are very popular.' },
        { q: 'Can I book a Tempo Traveller for Durga Puja pandal-hopping in Kolkata?', a: 'Yes, 9–12 seater tempo travellers are ideal for Kolkata Durga Puja pandal-hopping. Full-day city tours start from ₹4,500. Book 2–3 weeks before Puja — demand is very high.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Kolkata airport to Salt Lake?', a: 'Pre-booked cab from CCU Airport to Salt Lake Sector V (13 km) starts from ₹550 on TransRentals. Fixed pricing — no surge even for late-night arrivals.' },
        { q: 'How long from Kolkata airport to Park Street?', a: 'CCU Airport to Park Street is about 22 km and takes 40–60 minutes via VIP Road and EM Bypass. Allow 90 minutes during Durga Puja and peak evening traffic.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Kolkata do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Kolkata localities — Salt Lake, New Town (Rajarhat), Howrah, Behala, Tollygunge, Park Street, Alipore, Dum Dum, Barasat, Garia, Jadavpur, Ballygunge, Lake Town, Shyambazar, Belgharia, Sodepur, Barrackpore, and Narendrapur. Intercity moves to Siliguri, Patna, and Bhubaneswar are also available.' },
        { q: 'What is the most common move corridor in Kolkata — Salt Lake to Howrah?', a: 'Salt Lake to Howrah (roughly 18–25 km crossing Vidyasagar Setu or using the Vivekananda Connector) is one of Kolkata\'s busiest move routes, driven by corporate employees and PSU transfers between the two banks. Bridge crossings can take 45–75 minutes during morning rush (8–10 AM) or evening peak (5–8 PM). Schedule these moves for Sundays or early weekday mornings for the smoothest transit.' },
        { q: 'When is the best time to shift house in Kolkata?', a: 'The best shifting windows in Kolkata are mid-month (8th–20th) and the months of November–December and February. March–May is the pre-monsoon peak season, and October–November is a secondary surge driven by post-Durga Puja apartment relocations. Avoid the June–September monsoon for moves in North Kolkata, parts of Howrah, and low-lying areas like Behala and Garia due to flooding risk.' },
        { q: 'How do Kolkata movers handle monsoon flooding in June–September?', a: 'Monsoon flooding in North Kolkata lanes, Howrah, and some Behala pockets can block truck access for days. Experienced Kolkata movers monitor waterlogging forecasts and reschedule proactively. For river-adjacent Howrah localities, ferry-assisted hand-carrying of goods to a dry road-head may be needed for the final stretch. Always discuss flood contingency plans with your mover when booking a June–September move.' },
        { q: 'Do Kolkata movers handle North Kolkata\'s narrow lanes in areas like Shyambazar?', a: 'North Kolkata areas — Shyambazar, Belgharia, Sodepur, Barrackpore — have very narrow lanes typical of colonial-era construction that cannot accommodate large trucks. TransRentals-listed movers use mini trucks (Tata Ace, Bolero Pickup) for these areas, sometimes requiring multiple trips. Always mention your lane width or any access restrictions when booking to ensure the right vehicle is dispatched.' },
        { q: 'How long does a 2BHK shift take within Kolkata?', a: 'A standard 2BHK intra-Kolkata shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short moves within the same zone (Salt Lake to Rajarhat, or Garia to Tollygunge) take 5–7 hours. Cross-river moves (Salt Lake to Howrah) add 1–2 hours for bridge crossing and can run 10–13 hours total.' },
        { q: 'Can I move intercity from Kolkata to Siliguri, Patna, or Bhubaneswar?', a: 'Yes — Kolkata to Siliguri (600 km via NH12), Kolkata to Patna (590 km via NH19), and Kolkata to Bhubaneswar (460 km via NH16) are all available as full household relocation moves. Full-truck-load packages include professional packing at origin and door-to-door delivery. Get a free quote on TransRentals for exact intercity pricing.' },
        { q: 'Are movers available on weekends and month-end in Kolkata?', a: 'Yes, but Kolkata sees elevated demand on Saturdays and between the 27th and 3rd of each month. The post-Durga Puja period (October–November) also sees a city-wide surge as many residents move after the festive season. Book at least 4–5 days in advance for month-end dates and 3 days ahead for weekend shifts.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Kolkata?', a: 'A 12-seater AC Tempo Traveller in Kolkata starts from ₹5,000+/day. A 20-seater mini bus for Puri (500 km, ~9 hrs via NH16) starts from ₹14,000+/day. For Darjeeling group tours (700 km, ~12 hrs), full-size AC buses start from ₹25,000+/day. Digha beach trips (185 km) in a 17-seater Tempo Traveller are available from ₹7,000/day.' },
        { q: 'Which bus routes are most popular from Kolkata?', a: 'Kolkata to Puri (500 km, ~9 hrs via NH16) is the most popular pilgrimage bus route — Jagannath Temple group tours for 20–50 pilgrims are year-round. Kolkata to Digha (185 km, ~4 hrs) is the top leisure group route for weekend beach trips. Kolkata to Darjeeling (700 km, ~12 hrs) is popular for school excursions and corporate team outings.' },
        { q: 'Can I hire a bus for Durga Puja pandal-hopping or a wedding in Kolkata?', a: 'Yes, 9–17 seater Tempo Travellers are ideal for Durga Puja pandal-hopping — full-day city tours start from ₹4,500. For weddings, 20–50 seater AC buses are available from ₹12,000/day. Book 2–3 weeks in advance for Puja season (October) as demand triples. Decorated baraat buses start from ₹15,000/day.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Kolkata?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for Haldia port logistics are quoted per route. Kidderpore Dock area is Kolkata\'s primary commercial transport hub.' },
        { q: 'What is the top goods transport route from Kolkata?', a: 'Kolkata to Patna (590 km via NH19, ~10 hrs) and Kolkata to Bhubaneswar (460 km via NH16, ~8 hrs) are the top FTL freight corridors. Haldia port to Kolkata city (60 km) is the busiest short-haul industrial route carrying steel, chemicals, and jute products. LTL options are widely available.' },
        { q: 'Which industrial areas in Kolkata use truck rentals most?', a: 'Haldia port and petrochemical complex, Budge Budge industrial belt (chemicals, engineering), and Dankuni Logistics Hub on NH2 are Kolkata\'s top truck rental zones. TransRentals has verified vendors serving all three major industrial clusters including Salt Lake Sector V for IT-related logistics.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Kolkata per day?', a: 'Hatchback self-drive in Kolkata starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekend packages (Fri–Mon) are popular for Digha and Mandarmani beach trips.' },
        { q: 'What are the best outstation self-drive routes from Kolkata?', a: 'Digha (180 km via NH16, ~4 hrs), Mandarmani (190 km via NH116, ~3.5 hrs), and Shantiniketan (160 km via NH19, ~3 hrs) are the top self-drive weekend routes from Kolkata. NH16 to Digha has improved greatly in recent years. Avoid driving on state highways and rural roads at night.' },
        { q: 'Which areas in Kolkata have self-drive car rental options?', a: 'Salt Lake Sector V, Rajarhat New Town, and Behala have the most self-drive vendors. Park Street and Gariahat zones also have options. Doorstep delivery is available across all Kolkata zones with 24 hours\' notice. CCU Airport area pickups are available with advance booking.' },
        { q: 'What documents are required for self-drive car rental in Kolkata?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). West Bengal state DL and out-of-state DLs are both accepted. Carry vehicle documents (RC, insurance) at all times as checkposts are common on NH16.' },
        { q: 'Are there any road conditions to be aware of for self-drive trips from Kolkata?', a: 'NH16 (to Digha) and NH19 (to Shantiniketan) are well-maintained. However, state highways and district roads in rural West Bengal can be narrow with poor lighting. Night driving outside NH stretches is not recommended. Monsoon (June–September) causes flooding on low-lying sections near Kolkata — factor extra time or avoid rural detours.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Kolkata?', a: 'Honda Activa and TVS Jupiter are ideal for Kolkata daily commuting — manageable in stop-go traffic near Howrah Bridge, Kalighat, and Salt Lake IT corridors. Easy to park in market areas and narrow lanes of North Kolkata.' },
        { q: 'Can I rent a Royal Enfield in Kolkata for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Kolkata for weekend rides. The Sundarbans delta route (100 km via Basirhat) is a unique trail for adventurous bikers. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Kolkata?', a: '24-hour minimum is standard across Kolkata vendors. Some Salt Lake Sector V and Rajarhat vendors offer 4–8 hour packages for IT corridor commutes. Monthly rentals offer the best per-day rate — popular with software professionals in New Town.' },
        { q: 'Are electric scooters available on rent in Kolkata?', a: 'Yes, electric scooters are gaining availability in Kolkata, particularly in Salt Lake Sector V and Rajarhat New Town — ideal for the flat, wide IT corridor roads. Good option for eco-conscious commuters in these zones.' },
        { q: 'What documents are needed to rent a bike in Kolkata?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport as ID, and a refundable security deposit of ₹1,500–₃,000. Some vendors take photo ID only for short city rides. West Bengal state DL and out-of-state DLs are both accepted.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Kolkata?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Kolkata Metro East-West corridor extensions, New Town Rajarhat commercial development, and HIDCO township projects in Madhyamgram and Narendrapur generate consistent construction equipment demand.' },
        { q: 'What are the biggest equipment rental projects in Kolkata?', a: 'Haldia Port expansion and Kidderpore Dock dredging require specialised marine construction cranes and floating excavators, making port infrastructure the largest equipment demand driver in the Kolkata region. New Town Rajarhat\'s commercial and residential high-rises sustain tower crane and concrete pump demand within the city. The East-West Metro extension and Joka-BBD Bag elevated corridor also require piling rigs and viaduct-launching equipment.' },
        { q: 'How do I book construction equipment for my project in Kolkata?', a: 'Kolkata\'s Metro Green and Orange line extensions, Rajarhat New Town expansion, and Haldia port-side construction are the biggest equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near metro tunneling zones or New Town commercial projects, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Kolkata?', a: 'JCB 3DX backhoe loader rental in Kolkata starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Kolkata?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Greater Kolkata. Active zones include Kolkata Metro East-West underground work, Rajarhat New Town commercial development, HIDCO residential township construction, and Port Trust infrastructure at Haldia and Kidderpore.' },
        { q: 'What soil conditions affect JCB work in Kolkata?', a: 'Kolkata sits on soft alluvial and deltaic soil deposited by the Hooghly River — this makes excavation fast, but deep foundation work (beyond 2 m) requires shoring to prevent trench collapse. Salt Lake and Rajarhat sites are particularly prone to high water tables, and dewatering pumps must run continuously alongside the JCB during monsoon. For diaphragm wall or sheet-pile work near these zones, confirm the vendor\'s experience with soft ground support before booking.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Kolkata?', a: 'Burrabazar — one of India\'s largest wholesale markets for clothing, hardware, and dry goods — generates the highest volume of mini truck movement in Kolkata, with Tata Ace pickups running continuously between the market and city retailers. Bentinck Street electronics and stationery market uses mini trucks for daily restocking. Howrah industrial belt spare parts and machinery components are also regularly moved by Mahindra Bolero Pickup between workshops and Kolkata-side factories.' },
        { q: 'Can I rent a mini truck for house shifting in Kolkata?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Kolkata. Common routes: Salt Lake to Howrah, Rajarhat to South Kolkata (Tollygunge), and intra-North Kolkata moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Kolkata?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Burrabazar wholesale dispatches, Bentinck Street market supply runs, and Howrah industrial goods movement to Salt Lake IT parks are the most common mini truck use cases in Kolkata.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Jaipur's Golden Triangle tourism, palace circuits, and growing IT sector make it Rajasthan's largest car rental market. Innova Crysta and Swift Dzire are most booked. Heritage tour circuits (Amber Fort, Hawa Mahal, City Palace) require full-day driver-hired cabs. TransRentals has 70+ verified Jaipur vendors with doorstep delivery across Vaishali Nagar, C-Scheme, Malviya Nagar, and the airport zone.",
      'bike-on-rent':
        "Jaipur's heritage lanes and tourist bazaars are best explored on scooters and bikes. Daily commuters in Mansarovar and Vaishali Nagar prefer Activa and Jupiter. Royal Enfield rentals are popular for road trips to Ranthambore (180 km) and Pushkar (145 km). TransRentals has bike rentals across all Jaipur zones.",
      'bus-rental':
        "Jaipur's wedding industry and pilgrimage circuits drive strong bus demand. Baraat buses for royal-style Rajasthani weddings and group tours to Pushkar, Ajmer, and Ranthambore are popular. Corporate team outings to Sariska and Alwar (160 km) require 20–35 seater buses. TransRentals offers AC and non-AC buses across all of Jaipur.",
      'packers-and-movers':
        "Jaipur's rapid real estate expansion has made it Rajasthan's most active relocation market. New residential townships in Jagatpura, Pratap Nagar, and Sirsi Road attract IT and government professionals relocating within the city. The most common intra-city corridors are Vaishali Nagar to Malviya Nagar, Mansarovar to C-Scheme, Bani Park to Jawahar Nagar, and Shyam Nagar to Tonk Road. Government employee transfers — IAS, IPS, RAS, and Rajasthan Police officers — peak every March–June when annual posting orders are issued. Key intercity routes: Jaipur to Delhi (280 km via NH48), Jaipur to Jodhpur (340 km), Jaipur to Kota (250 km), and Jaipur to Udaipur (395 km). The walled Pink City areas — Chandpole, Ramganj Bazaar, Kishanpole, and Tripolia Bazaar — have narrow lanes requiring compact vehicles for household shifting. Jaipur Schemes 1 through 14, Rajendra Nagar, Ajmer Road, and Sanganer are covered under TransRentals' verified network. Peak relocation season is October–February; monsoon July–September sees slowdown. All listed movers include packing materials, manpower, and transit insurance.",
      'transporter':
        "Jaipur's textile and handicraft export industry in Sanganer, Bagru, and RIICO Industrial Area generates strong commercial transport demand. Rajasthan Stone and Marble trade from Kishangarh corridor also requires heavy goods vehicles. TransRentals provides verified transporters with mini trucks to container vehicles for intra-city and intercity freight from Jaipur.",
      'jcb-on-rent':
        "Jaipur's JDA master plan developments — ring road expansion, metro Phase 2, and Durgapura township — drive continuous JCB demand. New residential projects in Jagatpura, Ajmer Road, and Sirsi Road are major construction zones. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Jaipur and Jaipur district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Jaipur's dense market areas in Johri Bazaar, Badi Chaupar, and Pink City markets for goods delivery and household shifting in new township areas. TransRentals has same-day mini-truck bookings across all Jaipur zones including Vaishali Nagar and Malviya Nagar.",
      'tempo-traveller':
        "Jaipur's Golden Triangle tourism makes it a natural hub for tempo travellers. Delhi-Jaipur-Agra circuit tours (580 km loop) are the most popular 2-day group itinerary in North India. Pushkar mela (November) creates massive 12–17 seater demand. TransRentals offers AC Tempo Travellers from Jaipur for tourist groups, pilgrimages, and corporate outings.",
      'outstation-car-rental':
        "Outstation cabs from Jaipur cover Agra (240 km), Delhi (280 km), Udaipur (395 km), Jodhpur (340 km), Pushkar (145 km), and Ranthambore (180 km). TransRentals per-km pricing with no hidden charges. Multi-city Rajasthan heritage packages are available.",
      'one-way-car-rental':
        "Jaipur's top one-way routes: Jaipur to Delhi (280 km), Jaipur to Agra (240 km), Jaipur to Jodhpur (340 km), Jaipur to Udaipur (395 km). Transparent all-inclusive pricing on TransRentals.",
      'airport-transfer':
        "Jaipur International Airport (JAI) is 13 km from C-Scheme and 10 km from Vaishali Nagar. TransRentals offers fixed pre-booked airport transfers. Airport to C-Scheme starting from ₹450 for a sedan. 24/7 service, no surge, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Jaipur's wide roads and excellent NH48 (Delhi-Jaipur) and NH21 (Jaipur-Agra) make it one of North India's best self-drive cities. The Golden Triangle routes — Jaipur to Agra (240 km via NH21) and Jaipur to Delhi (280 km via NH48) — are the most popular self-drive drives. Trips to Pushkar (150 km via NH58) and Ranthambore (180 km via NH52) are also popular. TransRentals lists verified self-drive vendors in Vaishali Nagar, Malviya Nagar, and near Jaipur Airport. Rajasthan summer (April–June) is very hot — always book AC vehicles and carry extra water.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for the Jaipur-Agra-Delhi Golden Triangle?', a: 'An Innova Crysta or Ertiga is best for the 580 km Golden Triangle loop. SUVs offer comfort for the Agra-Jaipur highway and Yamuna Expressway sections.' },
        { q: 'Is self-drive available in Jaipur?', a: 'Yes, self-drive cars are available in Jaipur. Most vendors are around Vaishali Nagar and Malviya Nagar. A valid DL (1 year+), Aadhaar, and security deposit are required.' },
        { q: 'What is the best route from Jaipur to Udaipur?', a: 'NH48 to NH27 via Ajmer and Chittorgarh (395 km, ~6.5 hrs) is the standard route. Alternatively, take the NH58 via Phulad — more scenic through Aravalli hills.' },
        { q: 'Are cabs available from Jaipur at 4 AM for Ranthambore safari?', a: 'Yes, early morning departures for Ranthambore safari are common from Jaipur. TransRentals vendors offer pickups from 3:30 AM to reach Ranthambore by 6 AM for morning safari.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Tempo Traveller from Jaipur to Delhi?', a: 'AC 12-seater Tempo Traveller from Jaipur to Delhi (280 km via NH48, ~5 hrs) starts from ₹9,000 one-way. Return trips and multi-day Golden Triangle packages are available.' },
        { q: 'Can I book a Tempo Traveller for a Pushkar trip from Jaipur?', a: 'Yes, Jaipur to Pushkar (145 km, ~2.5 hrs) is a popular group trip. 12-seater AC Tempo Traveller starts from ₹5,000 for a day round trip including waiting at Pushkar.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Jaipur do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Jaipur localities — Vaishali Nagar, Malviya Nagar, Mansarovar, C-Scheme, Bani Park, Shyam Nagar, Jagatpura, Pratap Nagar, Tonk Road, Ajmer Road, Sirsi Road, Sanganer, Raja Park, Adarsh Nagar, Civil Lines, and Jhotwara. Intercity moves to Delhi, Jodhpur, Udaipur, Kota, and Agra are also covered.' },
        { q: 'What is the most common move corridor in Jaipur?', a: 'The Vaishali Nagar–Malviya Nagar corridor (roughly 12–15 km via Tonk Road) and the Mansarovar–C-Scheme route are Jaipur\'s most active move corridors. Both cross JLN Marg and Tonk Road — peak traffic from 9 AM to 7 PM can extend transit by 30–45 minutes. Schedule loading before 7 AM or after 8 PM for fastest same-day moves.' },
        { q: 'How do movers handle the narrow lanes in Jaipur\'s walled Pink City?', a: 'Old Pink City areas — Chandpole, Ramganj Bazaar, Kishanpole, Tripolia Bazaar, and Johri Bazaar — have lanes of 8–12 feet that only Tata Ace mini trucks can access. TransRentals movers stage larger vehicles at Badi Chaupar or Chhoti Chaupar and use mini trucks for the final stretch. Always inform your mover about an old-city location at booking to ensure the right vehicle is dispatched.' },
        { q: 'Why does Jaipur see a peak in relocation demand every March–June?', a: 'Jaipur is a major posting center for IAS, IPS, RAS, and Rajasthan Police officers. Annual posting orders from the state secretariat are issued every March–May, triggering thousands of employee relocations across Rajasthan with Jaipur as origin or destination. Mid-March to mid-June is the busiest window — book at least 7–10 days in advance during this period.' },
        { q: 'When is the best time to shift house in Jaipur?', a: 'October–February (cool weather, low demand) is ideal. Avoid March–June — peak government transfer season, high demand, and extreme heat (40–45°C). Monsoon (July–September) slows activity but is manageable. Mid-month dates (8th–20th) are consistently 15–20% cheaper than month-end.' },
        { q: 'How long does a 2BHK shift take within Jaipur city?', a: 'A standard 2BHK intra-Jaipur shift (packing + loading + transit + unloading) takes 7–10 hours with a 3–4 person team. Short same-zone moves (Vaishali Nagar to Shyam Nagar) take 5–7 hours. Long cross-city moves (Jhotwara to Jagatpura or Sanganer to Ajmer Road) can take 10–13 hours with Tonk Road and Ajmer Road traffic factored in.' },
        { q: 'Can I move intercity from Jaipur to Delhi, Jodhpur, or Udaipur?', a: 'Yes — Jaipur to Delhi (280 km via NH48, ~5 hrs), Jaipur to Jodhpur (340 km via NH58, ~6 hrs), Jaipur to Udaipur (395 km via NH48/NH27, ~6.5 hrs), and Jaipur to Kota (250 km via NH52, ~4.5 hrs) are all available as full household relocation moves. Get a free quote on TransRentals for exact intercity pricing.' },
        { q: 'Are movers available on weekends and month-end in Jaipur?', a: 'Yes, but weekends and month-end dates (27th–3rd) are peak demand periods. During the March–June government transfer season, even mid-week slots fill up fast. Book 5–7 days in advance for month-end dates and 3–4 days ahead for weekend shifts. TransRentals allows upfront booking confirmation to lock your preferred slot.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Jaipur?', a: 'A 12-seater AC Tempo Traveller in Jaipur starts from ₹5,000+/day. A 20-seater mini bus for Pushkar (145 km, ~2.5 hrs) or Ajmer (135 km, ~2.5 hrs) starts from ₹8,000+/day. For Udaipur group tours (400 km, ~6.5 hrs), full-size AC buses with 40+ seats are available from ₹20,000+/day.' },
        { q: 'Which bus routes are most popular from Jaipur?', a: 'Jaipur to Pushkar (145 km, ~2.5 hrs via NH58) is the most popular pilgrimage group route — especially during Pushkar Mela (November). Jaipur to Ajmer (135 km, ~2.5 hrs) for Ajmer Sharif Dargah is a major group pilgrimage route. Jaipur to Udaipur (400 km, ~6.5 hrs) is the top leisure and heritage tour group route from Jaipur.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Jaipur?', a: 'Yes, 20–50 seater AC buses are available for Jaipur weddings and corporate events. Rajasthan\'s grand destination weddings in heritage hotels (Rambagh Palace, Samode) book fleet buses for guest transport. RIICO industrial companies also book employee shuttle buses. Decorated baraat buses start from ₹18,000/day. Book 4–6 weeks in advance during peak wedding season (Oct–Feb).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Jaipur?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for textiles and marble are quoted per route. RIICO Sitapura and Vishwakarma Industrial Area are Jaipur\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Jaipur?', a: 'Jaipur to Delhi (280 km via NH48, ~5 hrs) is the busiest FTL corridor — carrying textiles, handicrafts, and gemstones to the capital. Jaipur to Mumbai (1,150 km via NH48) is the top long-haul route for marble from the Kishangarh-Rajsamand corridor. LTL options are widely available for smaller garment shipments.' },
        { q: 'Which industrial areas in Jaipur use truck rentals most?', a: 'RIICO Sitapura industrial estate (textiles, IT), Vishwakarma Industrial Area (engineering, auto components), and Mansarovar industrial zone (handicrafts, gems) are Jaipur\'s top truck rental clusters. TransRentals has verified vendors in all three zones serving daily logistics needs.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Jaipur per day?', a: 'Hatchback self-drive in Jaipur starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 200–250 km; extra km at ₹12–15/km. AC is essential — Rajasthan summers regularly hit 42–45°C.' },
        { q: 'Can I self-drive from Jaipur on the Golden Triangle routes to Agra and Delhi?', a: 'Yes, Jaipur to Agra (240 km via NH21, ~4 hrs) and Jaipur to Delhi (280 km via NH48, ~5 hrs) are the most popular self-drive routes. Both highways are in excellent condition. Confirm outstation permissions with your vendor. Avoid NH21 early mornings in December–January due to dense fog.' },
        { q: 'Which areas in Jaipur have self-drive car rental options?', a: 'Vaishali Nagar, Malviya Nagar, C-Scheme, and near Jaipur International Airport (JAI) have the most self-drive vendors. Doorstep delivery is available across all Jaipur zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Jaipur?', a: 'Original DL (minimum 1 year old), Aadhaar Card or valid ID, and a refundable security deposit (₹2,000–₹5,000). Carry vehicle documents at all times — Rajasthan highway checkposts are common. Tourists with international DL can rent with prior vendor approval.' },
        { q: 'Can I self-drive from Jaipur to Ranthambore for a safari?', a: 'Yes, Jaipur to Ranthambore (180 km via NH52, ~3 hrs) is a popular self-drive safari day trip. The safari itself uses forest department jeeps inside the reserve. Confirm outstation permissions with your rental vendor and leave by 4 AM to reach in time for morning safari entry.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Jaipur?', a: 'Honda Activa and TVS Jupiter are ideal for Jaipur city commuting — perfect for navigating the narrow streets of the Pink City walled area, Johari Bazaar, and Amber Fort road. Easy to park near monument zones where cars face restrictions.' },
        { q: 'Can I rent a Royal Enfield in Jaipur for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available for weekend rides from Jaipur. Pushkar (145 km via NH58, ~2.5 hrs) through the Aravalli foothills is a classic biker route. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Jaipur?', a: '24-hour minimum is standard in Jaipur. Some vendors near Vaishali Nagar and Malviya Nagar offer 4–8 hour packages for city sightseeing. Monthly plans offer the best per-day rate — popular with professionals on Tonk Road IT corridor.' },
        { q: 'Are electric scooters available on rent in Jaipur?', a: 'Yes, electric scooters are increasingly available in Jaipur, supported by Rajasthan\'s EV policy. Good option for exploring the walled Pink City where four-wheelers face congestion. Charging points are available at malls on Ajmer Road and Tonk Road.' },
        { q: 'What documents are needed to rent a bike in Jaipur?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors accept photo ID only for city sightseeing rides. Out-of-state and international DL holders accepted at most TransRentals vendors.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Jaipur?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. JDA Ring Road expansion, RIICO industrial estate development, Jaipur Metro Phase 2 construction, and walled city restoration projects generate consistent equipment demand across Jaipur.' },
        { q: 'What equipment considerations apply near Jaipur\'s heritage areas?', a: 'Jaipur\'s UNESCO-listed Walled City imposes strict size restrictions on construction equipment — full-size JCB machines and large cranes cannot navigate the narrow lanes of the old city and are not permitted near heritage structures. Compact mini excavators (1.5–3 tonne) are the only viable option for work within the walled city zone. For projects outside the heritage zone, RIICO industrial estate construction in Sitapura and Vishwakarma drives normal full-size excavator and crane demand.' },
        { q: 'How do I book construction equipment for my project in Jaipur?', a: 'Jaipur\'s Ring Road expansion earthworks, RIICO industrial estate construction in Sitapura and Bagru, and new residential township development in Jagatpura and Pratap Nagar are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near heritage zones or metro work, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Jaipur?', a: 'JCB 3DX backhoe loader rental in Jaipur starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Jaipur?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Jaipur. Active construction zones include JDA Ring Road earthworks, RIICO Sitapura and Bagru industrial estate expansion, Jaipur Metro Phase 2 infrastructure, and large residential projects in Jagatpura, Ajmer Road, and Sirsi Road.' },
        { q: 'Are there permit or soil challenges for JCB hire in Jaipur?', a: 'Within the Walled City and ASI-protected pink sandstone zones, JDA (Jaipur Development Authority) heritage zone permission is mandatory before any excavation — violations can result in immediate work stoppage and penalties. Outside the city, Jaipur\'s terrain transitions to hard pink sandstone and quartzite rock; for sites in Amber, Sanganer, or Muhana, confirm whether the JCB carries a rock breaker, as sandstone layers are common below 1.5 m depth.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Jaipur?', a: 'Johari Bazaar and MI Road jewellery and silver wholesale market generates regular mini truck demand for moving gem parcels, silver articles, and display materials between workshops and showrooms. Sanganer\'s block-print and hand-screen textile units use Tata Ace pickups daily for fabric bale deliveries to export packaging houses. Muhana Mandi — one of Rajasthan\'s largest wholesale produce markets — drives early-morning perishable transport runs across the city.' },
        { q: 'Can I rent a mini truck for house shifting in Jaipur?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Jaipur. Common routes: Vaishali Nagar to Malviya Nagar, Mansarovar to C-Scheme, and intra-Jagatpura moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Jaipur?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Johari Bazaar gems and silver jewelry deliveries, textile dispatches from Sanganer print factories, and Muhana wholesale market supply runs are the most common mini truck use cases in Jaipur.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Lucknow's administrative and commercial activity across Gomti Nagar, Hazratganj, and the Charbagh railway hub creates diverse car rental demand. Innova Crysta dominates government and VIP hire. After the Ram Mandir inauguration, Ayodhya (130 km) outstation trips have become Lucknow's top rental route. TransRentals has 60+ verified vendors covering all Lucknow zones.",
      'bike-on-rent':
        "Lucknow's wide boulevards and cultural heritage zones are well-suited to two-wheelers. Historical tours through Aminabad, Hazratganj, and Chowk markets are popular on scooters. Daily commuters in Gomti Nagar prefer Activa and TVS Jupiter. TransRentals has bike rentals across Lucknow including Aliganj, Alambagh, and Indira Nagar.",
      'bus-rental':
        "Lucknow's pilgrimage and government employee culture drives bus demand. Ayodhya (130 km) has seen a massive surge since the Ram Mandir opening. Corporate team outings from Lucknow's growing IT parks on Vibhuti Khand also book buses. TransRentals offers AC 12-seater to 50-seater buses for pilgrimages, weddings, and corporate trips from Lucknow.",
      'packers-and-movers':
        "Lucknow's large government and administrative workforce makes it one of UP's most active relocation cities. UP secretariat, Allahabad High Court bench, and dozens of government departments generate thousands of employee transfers annually, peaking March–June. The most frequent intra-city corridors: Gomti Nagar to Hazratganj, Aliganj to Indira Nagar, Alambagh to Vibhuti Khand, and Rajajipura to Chinhat. New residential developments along Sultanpur Road, Raibareli Road, and Shaheed Path expressway zone attract private sector professionals relocating from older areas like Aliganj and Alambagh. Key intercity moves: Lucknow to Delhi (500 km via Agra-Lucknow Expressway), Lucknow to Kanpur (90 km), Lucknow to Varanasi (320 km), and Lucknow to Ayodhya (130 km). Ayodhya's rapid post-Ram Mandir development is now a growing relocation destination from Lucknow. Dense traffic in Chowk, Aminabad, and Hazratganj markets requires early morning scheduling for loading. Heritage mohalla areas — Nakhas, Yahiyaganj, and Sadar — need compact vehicles for narrow-lane access. TransRentals connects verified, insured movers across all 110+ Lucknow localities.",
      'transporter':
        "Lucknow's wholesale markets in Chowk, Aminabad, and the upcoming Industrial corridor in Hardoi Road drive commercial truck demand. Agricultural produce transport from surrounding UP districts uses Lucknow as a hub. TransRentals offers Tata Ace to 32-ft container trucks for intra-city goods delivery and intercity freight from Lucknow across North India.",
      'jcb-on-rent':
        "Lucknow's Smart City mission, metro Phase 2 extension to Munshipulia, and massive residential development in Sultanpur Road and Raibareli Road zones drive JCB demand. Lucknow Development Authority (LDA) housing projects are major construction users. TransRentals provides JCB 3DX and mini excavators for projects across Lucknow.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup are used for household shifting in Lucknow's new township areas and market delivery in Aminabad and Hazratganj. TransRentals offers same-day mini-truck bookings with verified drivers across Lucknow including Gomti Nagar and Aliganj.",
      'tempo-traveller':
        "Lucknow's Ayodhya pilgrimage route has become the most popular tempo traveller booking since the Ram Mandir consecration (Jan 2024). Varanasi (320 km) and Prayagraj (210 km) are also top group travel routes. TransRentals offers AC 12–17 seater Tempo Travellers from Lucknow with drivers experienced on UP pilgrimage routes.",
      'outstation-car-rental':
        "Outstation cabs from Lucknow cover Ayodhya (130 km), Varanasi (320 km), Prayagraj (210 km), Agra (330 km via Expressway), Nainital (310 km), and Delhi (500 km). TransRentals per-km pricing with no hidden charges. Book online for instant confirmation from all Lucknow zones.",
      'one-way-car-rental':
        "Lucknow's top one-way routes: Lucknow to Ayodhya (130 km), Lucknow to Varanasi (320 km), Lucknow to Delhi (500 km). Agra-Lucknow Expressway makes the Delhi route fast and comfortable. Transparent all-inclusive pricing.",
      'airport-transfer':
        "Chaudhary Charan Singh Airport (LKO) is 15 km from Gomti Nagar and 18 km from Hazratganj. TransRentals airport transfers offer fixed pre-booked pricing. Airport to Gomti Nagar starting from ₹500 for a sedan. 24/7 service, no surge pricing, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Lucknow's well-maintained roads including the Agra-Lucknow Expressway (302 km to Agra) and NH27 (to Ayodhya) make self-drive car rental convenient for outstation trips. Popular routes include Ayodhya (130 km via NH27), Varanasi (320 km via NH19), and Agra (330 km via Expressway). Gomti Nagar and Vibhuti Khand have the best self-drive vendor availability in Lucknow. UP highway network has improved greatly — expressway self-drives offer a smooth experience. Hatchbacks and sedans are most popular for city and outstation use.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to travel from Lucknow to Ayodhya?', a: 'Lucknow to Ayodhya via NH27 (130 km, ~2.5 hrs) is smooth and well-maintained. A pre-booked cab with TransRentals is the most convenient option, especially during peak pilgrimage season.' },
        { q: 'Is the Agra-Lucknow Expressway safe for night driving?', a: 'Yes, the Agra-Lucknow Expressway is well-lit and patrolled. However, winter fog (Dec–Jan) reduces visibility significantly — plan daytime drives or avoid early morning fog hours.' },
        { q: 'Can I rent a cab from Lucknow to Nainital for a hill trip?', a: 'Yes, Lucknow to Nainital (310 km via NH9, ~6 hrs) outstation cab is popular for hill trips. An SUV is recommended for the final 30 km hill section to Nainital.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller from Lucknow to Ayodhya?', a: 'AC 12-seater Tempo Traveller from Lucknow to Ayodhya (130 km, ~2.5 hrs) starts from ₹5,000 for a day trip including 3–4 hrs waiting at Ayodhya for Ram Mandir darshan.' },
        { q: 'Can I book a group cab from Lucknow to Varanasi?', a: 'Yes, Lucknow to Varanasi (320 km, ~5.5 hrs) Tempo Traveller starts from ₹10,000 one-way for a 12-seater. Popular for pilgrim groups and Ganga Aarti visits.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Lucknow do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Lucknow localities — Gomti Nagar, Hazratganj, Alambagh, Aliganj, Indira Nagar, Vibhuti Khand, Rajajipura, Chinhat, Mahanagar, Jankipuram, Sultanpur Road, Raibareli Road, Shaheed Path, Vrindavan Yojana, Telibagh, and Nishatganj. Intercity moves to Delhi, Kanpur, Varanasi, Prayagraj, and Ayodhya are also available.' },
        { q: 'What is the most common intra-city move corridor in Lucknow?', a: 'The Gomti Nagar–Hazratganj corridor and the Aliganj–Indira Nagar corridor are Lucknow\'s busiest move routes. Newer Sultanpur Road and Raibareli Road township zones are top destinations for professionals relocating from older areas like Aliganj and Alambagh. Transit from Gomti Nagar to Sultanpur Road (15–18 km) takes 40–70 minutes in normal traffic.' },
        { q: 'Why does Lucknow see a massive moving surge every March–June?', a: 'Lucknow is UP\'s administrative capital hosting the UP secretariat, Allahabad High Court Lucknow bench, and dozens of state government departments. Annual transfer orders for IAS/IPS officers, district magistrates, SSPs, and thousands of other government employees are issued every March–May. This creates one of the highest government-employee relocation densities of any tier 2 Indian city — book 10–14 days in advance during this period.' },
        { q: 'How do movers navigate the busy market areas in Chowk, Aminabad, and Hazratganj?', a: 'Dense traffic in Chowk, Aminabad, and the Hazratganj market strip makes vehicle access difficult during 9 AM–9 PM. TransRentals movers schedule loading from these areas before 8 AM or after 9 PM. Heritage mohalla areas — Nakhas, Yahiyaganj, and Sadar — have narrow lanes requiring Tata Ace mini trucks. Always mention your specific area at booking.' },
        { q: 'When is the best time to shift house in Lucknow?', a: 'November–February (cool, low demand) and July–September (post-monsoon, demand eases after June rush) are the best windows. Avoid March–June — peak government transfers with summer heat. Mid-month dates (8th–20th) are 15–20% cheaper than month-end and have better slot availability.' },
        { q: 'How long does a 2BHK shift take within Lucknow city?', a: 'A standard 2BHK intra-Lucknow shift takes 7–10 hours with a team of 3–4 movers. Short moves within Gomti Nagar take 5–7 hours due to its well-planned roads. Cross-city moves — Alambagh to Jankipuram or Aliganj to Sultanpur Road — can take 10–13 hours with Hazratganj and Aminabad traffic factored in.' },
        { q: 'Can I move intercity from Lucknow to Delhi, Kanpur, or Varanasi?', a: 'Yes — Lucknow to Delhi (500 km via Agra-Lucknow Expressway, ~7 hrs), Lucknow to Kanpur (90 km, ~2 hrs), Lucknow to Varanasi (320 km, ~5.5 hrs), and Lucknow to Ayodhya (130 km, ~2.5 hrs) are all popular intercity moves. The Agra-Lucknow Expressway makes Delhi moves very efficient — full household loads reach Delhi in a single day\'s truck journey.' },
        { q: 'Are movers available during pilgrimage seasons like Ram Navami and Eid in Lucknow?', a: 'Yes, movers are available year-round including festival days. However, during major festivals (Ram Navami, Bakra Eid, Dussehra) central Lucknow traffic — especially around Hazratganj, Aminabad, and Nakhas — can cause 2–3 hour delays. Schedule festival-day moves from outer zones like Gomti Nagar, Jankipuram, or Sultanpur Road where traffic remains manageable.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Lucknow?', a: 'A 12-seater AC Tempo Traveller in Lucknow starts from ₹5,000+/day. A 20-seater mini bus for Ayodhya (135 km, ~2.5 hrs) starts from ₹7,000+/day. For Varanasi group pilgrimages (300 km, ~5.5 hrs), 40-seater AC buses start from ₹18,000+/day. Naimisharanya (90 km) day trips in a Tempo Traveller start from ₹4,500/day.' },
        { q: 'Which bus routes are most popular from Lucknow?', a: 'Lucknow to Ayodhya (135 km, ~2.5 hrs via NH27) has become the most popular pilgrimage bus route since the Ram Mandir inauguration in 2024 — group darshan bookings are in heavy demand. Lucknow to Varanasi (300 km, ~5.5 hrs via NH31) is the top pilgrimage group route. Lucknow to Naimisharanya (90 km, ~2 hrs) is a popular same-day group pilgrimage.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Lucknow?', a: 'Yes, 20–50 seater AC buses are available for Lucknow weddings and corporate events. Chikankari and textile industry companies, as well as IT park offices in Vibhuti Khand, book outings regularly. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance during peak wedding season (Nov–Feb) as demand is very high in this traditional nawabi city.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Lucknow?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for FMCG and food processing are quoted per route. Lucknow\'s Hardoi Road industrial corridor and Amausi area are the primary commercial transport zones.' },
        { q: 'What is the top goods transport route from Lucknow?', a: 'Lucknow to Delhi (500 km via Agra-Lucknow Expressway, ~7 hrs) is the busiest FTL corridor — carrying garments, food products, and pharma from Lucknow\'s industrial zones. Lucknow to Kanpur (90 km, ~1.5 hrs) is the most active short-haul route for leather goods. LTL options are available for smaller consignments.' },
        { q: 'Which industrial areas in Lucknow use truck rentals most?', a: 'Hardoi Road industrial belt (FMCG, food processing), Amausi industrial area (garments, packaging), and Talkatora industrial zone (pharma, engineering) are Lucknow\'s top truck rental clusters. TransRentals has verified vendors in all three zones serving the growing UP commercial logistics network.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Lucknow per day?', a: 'Hatchback self-drive in Lucknow starts from ₹799/day. Sedans start from ₹999/day. SUVs start from ₹1,499/day. Packages include 150–200 km; extra km at ₹10–14/km. Monthly plans available for long-stay consultants.' },
        { q: 'Can I self-drive on the Agra-Lucknow Expressway?', a: 'Yes, the Agra-Lucknow Expressway (302 km, ~4.5 hrs to Agra) is one of India\'s best expressways — smooth, well-lit, and well-patrolled. Most vendors permit expressway travel. Confirm outstation permissions when booking. Note: winter fog (December–January) reduces visibility on the expressway — drive carefully or avoid early morning drives.' },
        { q: 'What are the top self-drive destinations from Lucknow?', a: 'Ayodhya (130 km via NH27, ~2.5 hrs) is the top self-drive pilgrimage route after Ram Mandir inauguration. Prayagraj (210 km via NH31, ~3.5 hrs) and Agra (330 km via Expressway) are popular day trips. Varanasi (320 km via NH19) makes a great 2-day self-drive from Lucknow.' },
        { q: 'Which areas in Lucknow have self-drive car rental options?', a: 'Gomti Nagar, Vibhuti Khand, and Hazratganj are the main self-drive pickup zones. Chaudhary Charan Singh Airport (LKO) area pickups are also available with advance booking. Doorstep delivery across all Lucknow zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Lucknow?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹4,000). UP highway checkposts are common — keep vehicle documents readily accessible. Out-of-state DL holders are accepted by most vendors.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Lucknow?', a: 'Honda Activa and TVS Jupiter are ideal for Lucknow daily commuting — perfect for Hazratganj\'s congested market stretch, Gomti Nagar IT corridors, and the Aminabad bazaar area where car parking is very limited.' },
        { q: 'Can I rent a Royal Enfield in Lucknow for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Lucknow for weekend rides. Chitrakoot (220 km via NH35, ~4 hrs) through UP\'s scenic countryside is a popular pilgrimage biker route. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Lucknow?', a: '24-hour minimum is standard in Lucknow. Some Gomti Nagar and Hazratganj vendors offer 4–8 hour packages for sightseeing. Monthly rentals are popular with IT professionals at Vibhuti Khand and offer the best per-day rate.' },
        { q: 'Are electric scooters available on rent in Lucknow?', a: 'Yes, electric scooters are gaining traction in Lucknow, particularly in Gomti Nagar and Viraj Khand. The wide, smooth Shaheed Path and Vibhuti Khand roads are ideal for e-scooter commuting. Deva Sharif (28 km) is an easy e-scooter day trip.' },
        { q: 'What documents are needed to rent a bike in Lucknow?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors accept photo ID only for short city rides. UP checkposts are active — always carry your DL while riding.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Lucknow?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Lucknow Metro expansion to Munshipulia, Akbar Nagar housing redevelopment, Ring Road widening, and PGI hospital expansion keep construction equipment in consistent demand across the city.' },
        { q: 'What projects are driving equipment rental demand in Lucknow?', a: 'Lucknow Metro Phase 2 expansion and the widening of NH28 (Ring Road) are the city\'s two largest active infrastructure projects, sustaining demand for piling rigs, transit mixers, and cranes. The Akbar Nagar housing relocation project and new residential townships near Gomti Nagar extension also use tower cranes and concrete pumps at scale. LDA (Lucknow Development Authority) commercial complexes in Hazratganj and Vipin Khand are additional steady users of construction equipment.' },
        { q: 'How do I book construction equipment for my project in Lucknow?', a: 'Lucknow\'s Metro Phase 2 corridors, LDA housing projects in Sultanpur Road and Raibareli Road, and Ring Road infrastructure work are the biggest equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near metro work zones or PGI hospital expansion sites, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Lucknow?', a: 'JCB 3DX backhoe loader rental in Lucknow starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Lucknow?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Lucknow. Active construction zones include Lucknow Metro Phase 2 underground work, Akbar Nagar housing redevelopment earthworks, Ring Road expansion, and new residential township construction in Sultanpur Road and Raibareli Road zones.' },
        { q: 'What permissions are needed for JCB work in Lucknow?', a: 'For excavation within LDA (Lucknow Development Authority) designated zones, a formal LDA no-objection certificate is required before JCB deployment. Work along national highways (NH28, NH27) falls under NHAI jurisdiction and needs an NHAI NOC, which typically takes 10–14 working days to process. For LMC (Lucknow Municipal Corporation) road-cutting work, a separate LMC permission is required; all three authorities have different application portals and timelines.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Lucknow?', a: 'Aminabad market\'s chikan embroidery fabric wholesale is Lucknow\'s most distinctive mini truck use case — fine kurta fabric and finished chikan garments are moved daily between workshops in the old city and export packaging units. Chowk market handicrafts, silverware, and perfume (attar) wholesale generates regular Tata Ace pickups. Alambagh industrial area\'s food processing and packaging goods also rely on mini trucks for intra-city distribution to retailers and hotels.' },
        { q: 'Can I rent a mini truck for house shifting in Lucknow?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Lucknow. Common routes: Gomti Nagar to Hazratganj, Aliganj to Indira Nagar, and intra-Sultanpur Road moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Lucknow?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Aminabad wholesale market deliveries, Chowk chikan fabric shop dispatches, and food processing goods movement from Hardoi Road industrial belt are the most common mini truck use cases in Lucknow.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Nagpur, at India's geographic center, is a strategic hub for both business and wildlife tourism. Car rentals are essential for wildlife safaris to Pench (90 km) and Tadoba (150 km) — SUVs are the preferred category. MIHAN SEZ and Hingna MIDC corporate zones drive weekday corporate cab demand. TransRentals has 50+ verified Nagpur vendors covering Civil Lines, Dharampeth, and the airport zone.",
      'bike-on-rent':
        "Nagpur's wide roads and university culture make bikes popular for daily travel. NIT, VNIT, and Rashtrasant Tukadoji Maharaj Nagpur University students are top bike rental users. Activa and Jupiter dominate city commuting. Weekly rentals for long-distance wildlife safari approaches via NH44 are available on TransRentals.",
      'bus-rental':
        "Nagpur's tiger reserve tourism and pilgrimage to Shegaon (165 km) and Pandharpur (370 km) drive group bus demand. MIHAN SEZ companies hire shuttle buses for employee transport. Corporate team outings to Ramtek and Chikhaldara hill station use 20–35 seater buses. TransRentals offers buses across Nagpur and surrounding districts.",
      'packers-and-movers':
        "Nagpur's position as India's geographic center and its expanding MIHAN SEZ make it one of Maharashtra's fastest-growing relocation markets. MIHAN aerospace and IT companies bring corporate relocations from Hyderabad, Pune, and Bangalore. Government employee transfers — Railways HQ, NMC staff, and Maharashtra Police — peak every March–June. The most common intra-city corridors: Civil Lines to Dharampeth, Sitabuldi to Wardha Road, Hingna Road to Manish Nagar, and Sadar to Ramdaspeth. New residential zones on Wardha Road, Besa, Nari Road, and Katol Road attract young professionals from older city zones. Key intercity moves: Nagpur to Mumbai (840 km), Nagpur to Hyderabad (500 km), Nagpur to Pune (700 km), and Nagpur to Raipur (295 km). MIHAN's airport proximity means many professionals need 2-day turnaround packing and moving services. Dense traffic in Itwari market and Gandhibagh requires early morning loading schedules. TransRentals covers all Nagpur zones — including Nandanvan, Trimurti Nagar, Pratap Nagar, Mankapur, and Lakadganj — with verified, insured movers providing packing, transport, and transit insurance.",
      'transporter':
        "Nagpur is India's road transport hub — NH44 (North-South), NH53 (East-West), and NH6 all intersect here. Hingna and Butibori MIDC industrial estates generate massive truck demand. Orange harvest transport (Nov–Jan) peaks annually. TransRentals offers verified transporters with mini trucks to container vehicles from Nagpur to all Indian destinations.",
      'jcb-on-rent':
        "Nagpur's MIHAN airport expansion, Smart City road projects, and Hingna-Butibori industrial infrastructure development drive JCB and excavator demand. Real estate development in Wardha Road and Katol Road corridors add to construction needs. TransRentals provides JCB 3DX and mini excavators for construction across Nagpur district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Nagpur's Dharampeth and Itwari market deliveries and household shifting in new townships along Wardha Road. TransRentals has same-day mini-truck bookings with verified drivers across Nagpur city.",
      'tempo-traveller':
        "Nagpur's tiger reserve circuit makes it a unique tempo traveller market — corporate and tourist groups book 12-seater vehicles for Pench and Tadoba safaris. Shegaon pilgrimage (165 km) is another top route. TransRentals offers AC 9–17 seater Tempo Travellers from Nagpur with drivers experienced on Maharashtra wildlife routes.",
      'outstation-car-rental':
        "Outstation cabs from Nagpur cover Pench (90 km), Tadoba (150 km), Wardha/Sevagram (75 km), Amravati (160 km), and Jabalpur (325 km). Safari-ready SUVs are the top outstation booking. TransRentals per-km pricing with no hidden charges.",
      'one-way-car-rental':
        "Nagpur's top one-way routes: Nagpur to Mumbai (840 km), Nagpur to Hyderabad (500 km), Nagpur to Jabalpur (325 km). Transparent pricing on TransRentals — pay only for one-way distance.",
      'airport-transfer':
        "Dr. Babasaheb Ambedkar Airport (NAG) is just 8 km from the city — the closest major airport to any Indian city center. TransRentals airport transfers cover Civil Lines, Dharampeth, and Wardha Road zones. Airport to city center starting from ₹350 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Nagpur, India's Zero Mile City, is a self-drive hub due to its central location with all national highways (NH44, NH53, NH6) intersecting here. Popular self-drive routes include Pench Tiger Reserve (85 km via NH44), Tadoba (150 km via NH930), and Kanha National Park (275 km). SUVs are the preferred self-drive category for wildlife approach roads. TransRentals lists verified self-drive vendors in Civil Lines, Dharampeth, and near the airport. Nagpur's extreme summer heat (April–June, up to 48°C) makes AC vehicles essential.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Which car is best for a tiger safari trip from Nagpur?', a: 'SUVs like Innova Crysta, Tata Harrier, or XUV700 are best for tiger reserve approaches (Pench, Tadoba). Good ground clearance helps on forest approach roads.' },
        { q: 'What is the cost of a cab from Nagpur to Pench Tiger Reserve?', a: 'Nagpur to Pench (90 km via NH44) one-way cab starts from ₹1,000 for a sedan. Round trip for a day safari starts from ₹2,000. Get a free quote on TransRentals.' },
        { q: 'Are early morning cabs available from Nagpur for wildlife safaris?', a: 'Yes, TransRentals vendors in Nagpur offer pickups from 3:30–4:00 AM for morning wildlife safaris at Pench and Tadoba. Book in advance — early morning slots fill up fast.' },
      ],
      'tempo-traveller': [
        { q: 'Can I book a Tempo Traveller from Nagpur for Tadoba safari?', a: 'Yes, AC 9–12 seater Tempo Travellers are available from Nagpur to Tadoba (150 km, ~3 hrs). One-way starts from ₹6,000. Groups of 6–12 save significantly vs. multiple cabs.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Nagpur do TransRentals movers cover?', a: 'TransRentals-verified movers cover all major Nagpur localities — Civil Lines, Dharampeth, Ramdaspeth, Sitabuldi, Sadar, Manish Nagar, Hingna Road, Wardha Road, Pratap Nagar, Nandanvan, Trimurti Nagar, Katol Road, Besa, Nari Road, Lakadganj, Mankapur, and the MIHAN SEZ zone. Intercity moves to Mumbai, Hyderabad, Pune, Raipur, and Jabalpur are also available.' },
        { q: 'What is the most common move corridor in Nagpur?', a: 'The Civil Lines–Dharampeth corridor and the Sitabuldi–Wardha Road route are Nagpur\'s most active intra-city move paths. With MIHAN SEZ expansion, the flow from older central zones (Civil Lines, Sadar) toward Wardha Road and Besa is growing rapidly as professionals move to newer townships. This cross-city transit takes 30–50 minutes in normal traffic.' },
        { q: 'How does Nagpur\'s extreme summer heat (April–June) affect household shifting?', a: 'Nagpur summers regularly hit 44–48°C — among India\'s highest. Electronics, wooden furniture, and heat-sensitive items can be damaged in non-AC trucks during long transit. TransRentals movers schedule loading during early morning (6–9 AM) and unloading in the evening (after 5 PM). For high-value electronics, request thermally insulated vehicles or early morning scheduling at booking.' },
        { q: 'What makes Nagpur unique for intercity moving — the zero-mile city advantage?', a: 'Nagpur\'s geographic center location means intercity truck routes to all major Indian cities (Mumbai 840 km, Delhi 1,075 km, Hyderabad 500 km, Kolkata 1,200 km) are roughly equidistant. This creates high availability of return-trip trucking at lower rates — Nagpur often has among the most competitive intercity moving rates in Central India due to high truck density at this crossroads city.' },
        { q: 'When is the best time to shift house in Nagpur?', a: 'October–February (post-monsoon, before summer heat) is ideal. Avoid March–June — peak government transfer season combined with extreme heat. Monsoon (July–September) is moderate and manageable. Mid-month weekday slots are consistently more affordable than month-end and weekends.' },
        { q: 'How long does a 2BHK shift take within Nagpur city?', a: 'A standard 2BHK intra-Nagpur shift takes 6–9 hours with a 3-person team. Nagpur\'s relatively uncongested roads (compared to Mumbai or Kolkata) make transit efficient. Short moves within the same zone (Civil Lines to Dharampeth or Sitabuldi to Sadar) take 4–6 hours. Long moves to MIHAN SEZ or Wardha Road corridor take 8–11 hours.' },
        { q: 'Can I move intercity from Nagpur to Mumbai, Hyderabad, or Pune?', a: 'Yes — Nagpur to Mumbai (840 km via NH44, ~13 hrs truck), Nagpur to Hyderabad (500 km via NH44, ~8 hrs), and Nagpur to Pune (700 km via NH65, ~11 hrs) are all available. Nagpur to Raipur (295 km, ~5 hrs) is also a growing route driven by Chhattisgarh government postings. Full household packing and transit insurance included — get a free quote on TransRentals.' },
        { q: 'Are movers available on weekends and month-end in Nagpur?', a: 'Yes, but month-end dates (27th–3rd) and Sundays are peak demand periods. March–June government transfer season tightens availability across all dates. Book at least 5–7 days in advance for month-end moves. Note: orange harvest season (November–January) increases commercial vehicle demand, which can reduce truck availability for household moves.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Nagpur?', a: 'A 12-seater AC Tempo Traveller in Nagpur starts from ₹5,000+/day. A 20-seater mini bus for Shirdi (350 km, ~6 hrs via NH44) starts from ₹12,000+/day. For Amaravati temple (150 km, ~3 hrs) day trips, a 17-seater Tempo Traveller starts from ₹6,000/day. The Nagpur-Mumbai corridor (840 km) requires overnight buses starting from ₹30,000+/day.' },
        { q: 'Which bus routes are most popular from Nagpur?', a: 'Nagpur to Shirdi (350 km, ~6 hrs via NH44) is the most popular pilgrimage group route from Central India. Nagpur to Amaravati (150 km, ~3 hrs) for the Ambadevi temple is a popular same-day pilgrimage. Nagpur to Mumbai (840 km, ~13 hrs via NH44) is the key overnight intercity corridor for group corporate and conference travel.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Nagpur?', a: 'Yes, 20–50 seater AC buses are available for Nagpur weddings and corporate events. MIHAN SEZ aerospace and IT companies book employee outing buses regularly. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance during peak season (Nov–Feb and May). Orange harvest season events (Nov–Jan) also create seasonal bus demand.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Nagpur?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for coal and steel are quoted per route. Nagpur is India\'s geographic center — NH44, NH53, and NH6 all intersect here, making it the country\'s most strategic truck rental hub.' },
        { q: 'What is the top goods transport route from Nagpur?', a: 'Nagpur to Mumbai (840 km via NH44, ~13 hrs) and Nagpur to Hyderabad (500 km via NH44, ~8 hrs) are the two busiest FTL corridors — carrying coal, steel, and orange agri-produce. The Nagpur-Pune corridor (700 km via NH65) is the key route for auto components from Butibori MIDC. LTL options are widely available from Nagpur\'s central hub position.' },
        { q: 'Which industrial areas in Nagpur use truck rentals most?', a: 'Hingna MIDC (auto components, food processing), Butibori MIDC (engineering, chemicals), and MIHAN SEZ (aerospace, IT) are Nagpur\'s top truck rental zones. Orange mandi in Katol Road area also drives heavy seasonal truck demand from November to January. TransRentals has verified vendors in all these zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Nagpur per day?', a: 'Hatchback self-drive in Nagpur starts from ₹799/day. Sedans start from ₹999/day. SUVs (Creta, Scorpio) start from ₹1,499/day. Packages include 100–150 km; extra km at ₹10–14/km. Safari-day packages with higher km limits are available for Pench and Tadoba trips.' },
        { q: 'Which are the best self-drive wildlife routes from Nagpur?', a: 'Pench Tiger Reserve (85 km via NH44, ~1.5 hrs) is the easiest self-drive safari day trip from Nagpur. Tadoba Andhari Tiger Reserve (150 km via NH930, ~3 hrs) is the most popular 1-night self-drive. Kanha National Park (275 km) makes a great 2-day self-drive weekend trip.' },
        { q: 'Which areas in Nagpur have self-drive car rental options?', a: 'Civil Lines, Dharampeth, and near Dr. Babasaheb Ambedkar Airport (NAG) have self-drive vendors. Airport pickups with 24 hours\' advance booking are available. Wardha Road and MIHAN zone vendors also offer doorstep delivery.' },
        { q: 'Is a self-drive SUV required for wildlife reserve trips from Nagpur?', a: 'A self-drive SUV (Creta, Scorpio, XUV300) is strongly recommended for Pench and Tadoba approach roads — some stretches have rough surfaces. The safari itself uses forest department vehicles. Park approach roads improve October–April; monsoon months can be challenging.' },
        { q: 'What documents are required for self-drive in Nagpur?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and refundable security deposit (₹2,000–₹4,000). Maharashtra highway checkposts require vehicle documents — keep RC and insurance handy. Out-of-state DLs accepted. Some vendors charge extra for outstation trips beyond 100 km.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Nagpur?', a: 'Honda Activa and TVS Jupiter are ideal for Nagpur daily commuting — manageable in Sitabuldi and Dharampeth traffic, with good fuel efficiency for longer Wardha Road and MIHAN corridor stretches. Easy to park near auto-heavy central market areas.' },
        { q: 'Can I rent a Royal Enfield in Nagpur for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Nagpur for weekend rides. Pench Tiger Reserve (75 km via NH44, ~1.5 hrs) is a great biker day trip — ride early morning for the best wildlife experience on the forest approach roads. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Nagpur?', a: '24-hour minimum is standard in Nagpur. Some Civil Lines and Dharampeth vendors offer 4–8 hour packages for half-day city use. Monthly rentals are popular with MIHAN SEZ professionals and offer the best per-day rate.' },
        { q: 'Are electric scooters available on rent in Nagpur?', a: 'Yes, electric scooters are growing in Nagpur as the city builds EV infrastructure. Good option for short-distance IT corridor commuting in MIHAN SEZ and Wardha Road zones. Nagpur\'s planned city layout with wide roads is well-suited for e-scooters.' },
        { q: 'What documents are needed to rent a bike in Nagpur?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Maharashtra checkposts require DL — carry it at all times. Some vendors accept photo ID only for short intra-city rides.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Nagpur?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Nagpur Metro Phase 2 extension, MIHAN SEZ aerospace and IT campus development, Butibori industrial estate expansion, and National Highway widening projects keep equipment in high demand.' },
        { q: 'Which projects and industries drive the most equipment rental demand in Nagpur?', a: 'MIHAN SEZ (Multi-modal International Hub Airport at Nagpur) and adjacent Butibori MIDC industrial estate together form the region\'s largest equipment rental market, with factory construction and airport infrastructure work running simultaneously. Nagpur Metro Phase 2 expansion adds piling and viaduct work to the equipment demand pool. Coal handling equipment for Hingna area\'s coal-linked industries is another recurring use case unique to Nagpur\'s central-India logistics position.' },
        { q: 'How do I book construction equipment for my project in Nagpur?', a: 'Nagpur\'s MIHAN SEZ construction, Metro Phase 2 infrastructure, and Butibori MIDC industrial expansion are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes at MIHAN aerospace zone or metro work sites, book 5–7 days ahead to ensure site-access clearance.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Nagpur?', a: 'JCB 3DX backhoe loader rental in Nagpur starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Nagpur?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Nagpur. Active construction zones include MIHAN SEZ aerospace facility groundwork, Nagpur Metro Phase 2 tunneling, Butibori MIDC industrial unit construction, and National Highway (NH44/NH53) widening earthworks at Nagpur interchange.' },
        { q: 'What soil and terrain challenges affect JCB hiring in Nagpur?', a: 'Nagpur\'s construction sites frequently encounter hard basalt rock — particularly in Butibori, Hingna, and the MIHAN zone — which makes standard JCB buckets ineffective. A JCB 4DX or full hydraulic excavator equipped with a rock breaker attachment is often the minimum requirement for foundation work in these areas. Always confirm the attachment type and machine tonnage with your vendor before booking; sites without a breaker-fitted machine can lose entire working days on basalt layers.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Nagpur?', a: 'Itwari wholesale market — a major hub for textiles, utensils, and dry goods in Central India — generates daily mini truck runs to retailers across Nagpur. Nagpur\'s orange belt season (November to January) creates a surge in Tata Ace demand for cold storage transport of oranges from mandis in Katol, Kalmeshwar, and Narkhed to city warehouses and regional dispatch points. Hingna MIDC industrial area also relies on mini trucks for daily spare parts and raw material movement between small-scale units.' },
        { q: 'Can I rent a mini truck for house shifting in Nagpur?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Nagpur. Common routes: Civil Lines to Wardha Road, Dharampeth to MIHAN zone, and intra-Hingna Road moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Nagpur?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Itwari wholesale market deliveries, orange cold storage dispatches during the November harvest season, and Hingna MIDC industrial supply runs are the most common mini truck use cases in Nagpur.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Indore, India's cleanest city and Madhya Pradesh's commercial capital, has a dynamic car rental market. Pilgrims to Ujjain (55 km), heritage seekers visiting Mandu, and IT professionals on Super Corridor drive diverse demand. Innova and Swift Dzire lead bookings. TransRentals has 60+ verified Indore vendors covering Vijay Nagar, Palasia, AB Road, and the airport zone.",
      'bike-on-rent':
        "Indore's flat terrain, clean roads, and student population make it an active bike rental market. Daily commuters in Vijay Nagar and Scheme 54 prefer Activa and TVS Jupiter. Royal Enfield is popular for Omkareshwar and Mandu weekend rides. TransRentals has bike rentals available across Indore city.",
      'bus-rental':
        "Indore's pilgrimage to Ujjain Mahakaleshwar (55 km) and corporate Super Corridor outings generate steady bus demand. Wedding transport in Vijay Nagar and Palasia uses decorated buses heavily. Maheshwar and Mandu tourist group trips use 12–20 seater vehicles. TransRentals offers AC and non-AC buses across Indore.",
      'packers-and-movers':
        "Indore's status as MP's commercial capital and India's cleanest city makes it a dynamic relocation market. The Super Corridor IT zone, IIM Indore campus, and pharmaceutical and textile industries attract professionals from across India. Common intra-city corridors: Vijay Nagar to Scheme 54, AB Road to Bicholi Mardana, Lasudia Mori to Kanadiya Road, and Rau to South Tukoganj. Government transfers — MP Police, civil services, and PSU banks — peak March–June. Key intercity moves: Indore to Bhopal (195 km), Indore to Pune (575 km), Indore to Mumbai (590 km), and Indore to Ahmedabad (470 km). Super Corridor employees relocating from Bangalore and Hyderabad make Indore one of MP's top intercity move destinations. Palasia and Rajwada old-city bazaar areas require compact vehicles for narrow market lanes. Rainy season (July–September) slows activity; October–February is peak season. TransRentals covers all 80+ Indore localities — including Rajendra Nagar, MR 10, Janjeerwala Square, Bhawarkua, Tilak Nagar, and the airport corridor — with verified, insured movers providing full packing, transport, and transit insurance.",
      'transporter':
        "Indore's pharmaceutical manufacturing, textile industry, and MPAKVN industrial estates generate significant goods transport demand. The city's central location makes it a key distribution hub for Central India. TransRentals offers verified transporters with Tata Ace to 40-ft container trucks from Indore to all major Indian cities.",
      'jcb-on-rent':
        "Indore's Super Corridor development, new township projects in Rau and Kanadiya Road, and ongoing ring road expansion drive JCB and excavator demand. BRTS Phase 2 construction adds to equipment needs. TransRentals provides JCB 3DX and mini excavators for construction across Indore and surrounding districts.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Indore's Rajwada market deliveries and apartment shifting in Vijay Nagar and Bicholi Mardana. TransRentals has same-day mini-truck bookings across all Indore zones.",
      'tempo-traveller':
        "Indore's Ujjain pilgrimage circuit, Omkareshwar temple (80 km), and Maheshwar ghats make it a regular tempo traveller market. Shravan month (July–August) sees peak demand for Ujjain trips. TransRentals offers AC 12–17 seater Tempo Travellers from Indore for pilgrimages and tourist group travel.",
      'outstation-car-rental':
        "Outstation cabs from Indore cover Ujjain (55 km), Omkareshwar (80 km), Mandu (100 km), Maheshwar (95 km), Bhopal (195 km), and Kanha Tiger Reserve (420 km). TransRentals per-km pricing with no hidden charges — book online for instant confirmation.",
      'one-way-car-rental':
        "Indore's top one-way routes: Indore to Bhopal (195 km), Indore to Mumbai (590 km), Indore to Pune (575 km). Transparent all-inclusive pricing on TransRentals.",
      'airport-transfer':
        "Devi Ahilya Bai Holkar Airport (IDR) is just 8 km from Vijay Nagar — very centrally located. TransRentals airport transfers cover Vijay Nagar, Palasia, Scheme 54, and Super Corridor zones. Airport to Vijay Nagar starting from ₹350 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Indore's clean wide roads and well-maintained highway access make it an excellent self-drive city. The NH52 to Omkareshwar (80 km) and SH-27 to Ujjain (55 km) are short, easy day trips. Mandu (100 km via SH-28) is one of Madhya Pradesh's most scenic self-drive destinations. TransRentals lists verified self-drive vendors in Vijay Nagar, AB Road, and Scheme 54. The Madhya Pradesh temple and heritage circuit — Ujjain, Omkareshwar, Maheshwar, Mandu — is perfectly suited to a self-drive trip from Indore.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best time for Ujjain Mahakaleshwar darshan from Indore?', a: 'Bhasma Aarti at 4 AM is the most sought-after. Leave Indore by 2:30 AM for the early morning experience. Alternatively, regular darshan slots can be booked online — leave Indore by 7 AM.' },
        { q: 'What is the cost of cab from Indore to Bhopal?', a: 'One-way cab from Indore to Bhopal (195 km via NH46, ~3.5 hrs) starts from ₹1,800 for a sedan. NH46 is one of MP\'s best highways.' },
        { q: 'Is self-drive available in Indore?', a: 'Yes, self-drive cars are available in Indore mainly around Vijay Nagar and AB Road. Valid DL (1 year+), Aadhaar, and security deposit required.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Indore do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Indore localities — Vijay Nagar, Scheme 54, AB Road, Bhawarkua, Palasia, South Tukoganj, Rajendra Nagar, MR 10, Bicholi Mardana, Lasudia Mori, Kanadiya Road, Rau, Nipania, Super Corridor, Tilak Nagar, Janjeerwala Square, Khandwa Road, and Rajwada area. Intercity moves to Bhopal, Pune, Mumbai, Ahmedabad, and Ujjain are also available.' },
        { q: 'What is the most common move corridor in Indore — Vijay Nagar to Scheme 54?', a: 'The Vijay Nagar–Scheme 54 and AB Road–Bicholi Mardana corridors are Indore\'s busiest intra-city move routes, driven by IT and pharma professionals upgrading from central to newer township zones. The Lasudia Mori–Nipania stretch toward Super Corridor is gaining rapidly with new apartment launches. AB Road peak hours (9–11 AM, 6–8 PM) can add 45 minutes to a cross-city move.' },
        { q: 'How do movers handle Indore\'s narrow market lanes near Rajwada and old city?', a: 'The Rajwada, Chhatri Chowk, and Siyaganj market areas have lanes of 8–12 feet that cannot accommodate large trucks. TransRentals movers use Tata Ace or Bolero Pickup mini trucks for these areas, with the main vehicle parked at the nearest arterial road. If your home is in the old-city bazaar belt, mention it at booking — movers allocate the right vehicle and extra time.' },
        { q: 'Why does Indore attract IT sector relocation demand?', a: 'Indore\'s Super Corridor IT zone — with Infosys, TCS, Wipro, and 100+ smaller IT firms — attracts large-scale corporate relocations from Bangalore, Hyderabad, and Pune. Employees moving to IIM Indore campus area and pharmaceutical companies in Pithampur MIDC also drive demand. Indore is now one of MP\'s top destinations for intercity corporate movers.' },
        { q: 'When is the best time to shift house in Indore?', a: 'October–February is ideal — cool, post-monsoon weather with lower demand. Avoid March–June (peak government transfer season, 40–43°C heat). Mid-month dates (8th–20th) are consistently 10–20% cheaper than month-end. Avoid Diwali week when short-notice auspicious-date booking requests surge.' },
        { q: 'How long does a 2BHK shift take within Indore?', a: 'A standard 2BHK intra-Indore shift takes 6–9 hours with a 3-person team. Short same-zone moves (Vijay Nagar to Palasia or Scheme 54 to MR 10) take 5–7 hours. Long cross-city moves (Rau to Khandwa Road or Kanadiya Road to AB Road) can take 9–12 hours with AB Road peak traffic factored in.' },
        { q: 'Can I move intercity from Indore to Bhopal, Pune, or Mumbai?', a: 'Yes — Indore to Bhopal (195 km via NH46, ~3.5 hrs) and Indore to Ujjain (55 km, ~1 hr) are short intercity moves. Longer routes: Indore to Pune (575 km via NH52, ~10 hrs truck), Indore to Mumbai (590 km, ~10 hrs), and Indore to Ahmedabad (470 km via NH48, ~8 hrs). Get a free quote on TransRentals for full household intercity pricing.' },
        { q: 'Are movers available on weekends in Indore?', a: 'Yes, but Sundays and month-end dates (27th–3rd) have highest demand. Ujjain proximity means Indore also sees spikes around Shravan month (July–August) as families move before or after Mahakaleshwar pilgrimages. Book 3–5 days in advance for weekends and 6–8 days for month-end dates during busy season.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Indore?', a: 'A 12-seater AC Tempo Traveller in Indore starts from ₹5,000+/day. A 20-seater mini bus for Ujjain (55 km, ~1 hr) starts from ₹4,500+/day — popular for Shravan month group pilgrimages. For Maheshwar (90 km, ~2 hrs) and Omkareshwar (80 km, ~2 hrs) full-day group tours, a Tempo Traveller starts from ₹5,000/day.' },
        { q: 'Which bus routes are most popular from Indore?', a: 'Indore to Ujjain (55 km, ~1 hr via SH-27) is the most popular pilgrimage group route — Mahakaleshwar darshan groups of 15–40 are booked year-round, peaking during Shravan (Jul–Aug). Indore to Maheshwar (90 km, ~2 hrs) and Omkareshwar (80 km, ~2 hrs via NH52) are the top heritage and spiritual group routes. Indore to Bhopal (195 km, ~3.5 hrs) is the top corporate intercity group route.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Indore?', a: 'Yes, 20–50 seater AC buses are available for Indore weddings and corporate events. Super Corridor IT companies (Infosys, TCS campus) book outing buses to Mandu and Maheshwar regularly. Indore hosts large Jain community weddings that require fleet buses. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance for the Oct–Feb wedding season.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Indore?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for pharma and textile goods are quoted per route. Pithampur industrial area (55 km from Indore) is MP\'s largest manufacturing cluster and the primary commercial transport zone.' },
        { q: 'What is the top goods transport route from Indore?', a: 'Indore to Mumbai (590 km via NH48, ~10 hrs) is the busiest FTL corridor — carrying pharma APIs from Pithampur, textiles from Indore\'s wholesale markets, and food products. Indore to Ahmedabad (470 km via NH48, ~8 hrs) is the key Gujarat-bound route for cotton and garments. LTL options are available for smaller consignments.' },
        { q: 'Which industrial areas in Indore use truck rentals most?', a: 'Pithampur MIDC (Dhar district, 55 km — pharma, auto, engineering), Sanwer Road industrial area (food processing, chemicals), and Dewas Road corridor (textiles, packaging) are Indore\'s top truck rental zones. TransRentals has verified vendors in all three industrial clusters serving Central India logistics needs.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Indore per day?', a: 'Hatchback self-drive in Indore starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. Daily and weekly plans available.' },
        { q: 'What are the best self-drive destinations from Indore?', a: 'Ujjain (55 km via SH-27, ~1 hr) is the easiest pilgrimage day trip. Omkareshwar (80 km via NH52, ~2 hrs) and Maheshwar (95 km via NH52, ~2 hrs) are excellent half-day trips. Mandu (100 km via SH-28, ~2 hrs) is MP\'s most scenic fort complex — perfect for a self-drive day trip.' },
        { q: 'Which areas in Indore have self-drive car rental options?', a: 'Vijay Nagar, AB Road, Scheme 54, and near Devi Ahilya Bai Holkar Airport (IDR) have self-drive vendor availability. Super Corridor IT zone vendors offer doorstep delivery. Book 24 hours in advance for most pickup locations.' },
        { q: 'Can I self-drive from Indore to Bhopal on NH46?', a: 'Yes, Indore to Bhopal (195 km via NH46, ~3.5 hrs) is one of MP\'s best highways. Most vendors permit this route. The NH46 is wide and well-maintained — a comfortable self-drive. Confirm outstation policy and km limits when booking.' },
        { q: 'What documents are required for self-drive in Indore?', a: 'Original DL (minimum 1 year old), Aadhaar Card or valid ID, and a refundable security deposit (₹1,500–₹3,500). MP highway checkposts are common — carry vehicle documents. Out-of-state DL holders accepted by most vendors.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Indore?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local city use. For outstation, Ujjain (55 km one-way, ₹3,500 12-seater) and Omkareshwar (80 km) are top Shravan month pilgrimage routes. Pachmarhi (200 km) full-day trip starts from ₹10,000.' },
        { q: 'Can I book a Tempo Traveller from Indore to Ujjain for Mahakaleshwar darshan?', a: 'Yes, Indore to Ujjain (55 km via SH-27, ~1 hr) is the most booked Tempo Traveller route in Indore. A 12-seater one-way starts from ₹3,500. For Bhasma Aarti groups, the vehicle departs at 2:30–3:00 AM — TransRentals vendors provide pre-dawn service during Shravan month.' },
        { q: 'How many people can a Tempo Traveller carry in Indore?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Ujjain and Omkareshwar pilgrimages. 17-seater is preferred for corporate Super Corridor team outings to Mandu and Maheshwar. Non-AC options also available for short local routes at lower cost.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Indore?', a: 'Honda Activa and TVS Jupiter are ideal for Indore daily commuting — perfect for Vijay Nagar and Palasia\'s busy roads, and the Super Corridor IT zone feeder roads. Indore\'s flat terrain and clean roads are among the best for scooter riding in MP.' },
        { q: 'Can I rent a Royal Enfield in Indore for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Indore. Omkareshwar (80 km via NH52, ~2 hrs) through MP\'s ghats is a favourite biker pilgrimage route. Starting from ₹1,000–₹1,200/day. Electric scooters are also gaining popularity for city commuters.' },
        { q: 'What is the minimum rental period for bikes in Indore?', a: '24-hour minimum is standard in Indore. Some Vijay Nagar and AB Road vendors offer 4–8 hour packages for half-day city use. Monthly rentals offer the best per-day rate — popular with Super Corridor IT professionals.' },
        { q: 'Are electric scooters available on rent in Indore?', a: 'Yes, Indore is one of MP\'s leaders in EV adoption. Electric scooters are available for city commuting in Vijay Nagar, Scheme 54, and Super Corridor zones. Charging points at major malls on AB Road and Super Corridor are growing rapidly.' },
        { q: 'What documents are needed to rent a bike in Indore?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors accept photo ID only for short city rides. MP checkposts require DL — always carry it while riding.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Indore?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Smart City Indore road projects, Ring Road expansion, Pithampur industrial zone construction, and BRTS Phase 2 expansion drive consistent equipment demand across the city.' },
        { q: 'What infrastructure projects are driving equipment rental demand in Indore?', a: 'Pithampur industrial estate\'s pharmaceutical plant construction and expansion is the largest equipment demand driver in the Indore region, with ongoing factory builds requiring tower cranes, concrete pumps, and industrial lifting equipment. Indore Smart City\'s ring road widening and BRTS corridor expansion sustain paving and earthmoving equipment demand within the city. Indore Metro Phase 1 civil work also requires piling rigs and precast girder-launching equipment.' },
        { q: 'How do I book construction equipment for my project in Indore?', a: 'Indore\'s Smart City road network upgrades, Pithampur industrial estate expansion, and new township development in Rau and Kanadiya Road are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near Super Corridor IT zone or Ring Road work, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Indore?', a: 'JCB 3DX backhoe loader rental in Indore starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Indore?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Indore. Active construction zones include Smart City Indore utility corridor work, Ring Road earthworks, Pithampur AKVN industrial estate construction, and residential township development in Rau, Kanadiya, and Super Corridor zones.' },
        { q: 'What soil conditions affect JCB work around Indore and Pithampur?', a: 'The Pithampur industrial zone has mixed basalt-alluvial terrain — the upper 1–2 m is often soft alluvial, but deeper excavation regularly hits hard Deccan Trap basalt. This means a rock breaker attachment may be needed mid-project even if the first day\'s work goes smoothly. Confirm whether the vendor\'s machine carries a breaker as standard, and book 5–7 days in advance for Pithampur industrial site work as demand from ongoing pharma factory construction keeps machines in short supply.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Indore?', a: 'Sarafa Bazaar — Indore\'s famous silver and gold jewellery wholesale market — uses mini trucks for moving display units, safes, and packaging materials between workshops and showrooms in the old city. Rajwada market wholesale goods (garments, utensils, dry foods) are distributed daily by Tata Ace to retailers across the city. Pithampur pharma and engineering factories also rely on mini trucks for intra-estate component and raw material dispatches between vendor units.' },
        { q: 'Can I rent a mini truck for house shifting in Indore?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Indore. Common routes: Vijay Nagar to Scheme 54, AB Road to Super Corridor, and intra-Bicholi Mardana moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Indore?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Sarafa Bazaar market deliveries, Rajwada old city dispatch runs, and Pithampur factory goods movement to Super Corridor warehouses are the most common mini truck use cases in Indore.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Bhopal's administrative capital status and tourism to Sanchi, Bhimbetka, and Panchmarhi create a steady car rental market. Government officials and heritage tourists are the primary segments. Innova and Swift Dzire lead bookings. TransRentals has 40+ verified Bhopal vendors covering MP Nagar, Arera Colony, and the Habibganj railway and airport zones.",
      'bike-on-rent':
        "Bhopal's twin lakes and historical lanes around Old Bhopal are ideal for two-wheeler exploration. Students of Barkatullah University and NIT Bhopal are active bike rental users. TransRentals offers Activa, Jupiter, and Royal Enfield rentals across Bhopal for daily commuting and weekend Panchmarhi rides.",
      'bus-rental':
        "Bhopal's pilgrimage circuits to Sanchi (46 km), Ujjain (185 km), and Panchmarhi (195 km) drive group bus demand. Government department team outings and educational institute excursions are common segments. TransRentals offers AC 12-seater to 45-seater buses across Bhopal for pilgrimages, corporate events, and educational trips.",
      'packers-and-movers':
        "Bhopal's status as MP's capital makes it the state's largest government employee relocation hub. Annual postings of IAS, IPS, MP secretariat staff, teachers, and PSU bank employees peak every March–June. Common intra-city corridors: MP Nagar to Arera Colony, Hoshangabad Road to Kolar Road, Shahpura to Ayodhya Nagar, New Market to Piplani, and 6-Number Stop to Govindpura. New residential zones in Misrod, Ratibad, and Bawadiya Kalan are expanding the city's relocation geography. Key intercity moves: Bhopal to Indore (195 km via NH46), Bhopal to Jabalpur (325 km), Bhopal to Delhi (780 km), and Bhopal to Nagpur (350 km). Hoshangabad Road IT companies are generating increasing private sector relocations from Pune and Hyderabad. Old Bhopal areas — Peer Gate, Iqbal Maidan, and Hamidia Road — have narrow lanes requiring Tata Ace vehicles. Summer (April–June) is peak for government moves; October–November sees festival-related short-distance household moves. TransRentals covers all Bhopal zones — including Berasia Road, Chunabhatti, Bairagarh, Karond, and Danish Kunj — with verified, insured movers.",
      'transporter':
        "Bhopal's Govindpura and Mandideep industrial estates generate commercial truck demand for pharma, textiles, and engineering goods. Being MP's capital city, it serves as a distribution center for Central India. TransRentals offers mini trucks to 32-ft containers for goods movement from Bhopal across Madhya Pradesh and beyond.",
      'jcb-on-rent':
        "Bhopal's Smart City infrastructure projects, Lake Promenade expansion, and residential development in Ayodhya Bypass and New Bhopal zones require JCB and excavator services. TransRentals provides JCB 3DX and mini excavators for construction, trenching, and earthwork across Bhopal district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Bhopal's Chowk Bazaar deliveries and apartment shifting in New Market and MP Nagar. TransRentals has same-day mini-truck bookings with verified drivers across Bhopal city.",
      'tempo-traveller':
        "Bhopal's pilgrimage circuit to Sanchi, Ujjain, and Panchmarhi makes tempo travellers popular for group travel. Government employee group outings and school/college excursions are key segments. TransRentals offers AC 12–17 seater Tempo Travellers from Bhopal for pilgrimages and tourist groups.",
      'outstation-car-rental':
        "Outstation cabs from Bhopal cover Sanchi (46 km), Bhimbetka (45 km), Panchmarhi (195 km), Indore (195 km), and Jabalpur (325 km). TransRentals per-km pricing with no hidden charges — SUVs recommended for Panchmarhi ghats.",
      'one-way-car-rental':
        "Bhopal's top one-way routes: Bhopal to Indore (195 km), Bhopal to Jabalpur (325 km), Bhopal to Nagpur (350 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Raja Bhoj Airport (BHO) is 13 km from MP Nagar and 10 km from Arera Colony. TransRentals airport transfers cover MP Nagar, Arera Colony, and Kolar Road zones. Airport to MP Nagar starting from ₹450 for a sedan. 24/7 service, no surge.",
      'self-drive-car-rentals':
        "Bhopal's scenic twin lakes, easy access to Bhimbetka rock shelters (45 km via NH46) and Sanchi Stupa (46 km via NH12), and proximity to Pachmarhi hill station (195 km via NH69) make it an excellent self-drive city. Roads in Bhopal are well-maintained and traffic is manageable outside peak hours. TransRentals lists verified self-drive vendors in MP Nagar, Arera Colony, and near Raja Bhoj Airport. Madhya Pradesh's UNESCO heritage circuit — Bhimbetka and Sanchi — can be covered in a single self-drive day from Bhopal.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to visit Sanchi from Bhopal?', a: 'Sanchi is 46 km from Bhopal via NH12 — about 1 hour. A half-day trip by car (leave by 8 AM, return by 1 PM) allows comfortable exploration of the UNESCO Buddhist monuments.' },
        { q: 'Which car is best for Panchmarhi trip from Bhopal?', a: 'An SUV (Innova, Ertiga, or XL6) is strongly recommended for Panchmarhi — the final 40 km involves ghats and steep sections. Book with TransRentals for experienced ghat drivers.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Bhopal do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Bhopal localities — MP Nagar, Arera Colony, Kolar Road, Hoshangabad Road, Shahpura, Ayodhya Nagar, Piplani, Govindpura, New Market, Berasia Road, Chunabhatti, Bairagarh, Karond, Misrod, Ratibad, Bawadiya Kalan, Danish Kunj, Jahangirabad, and Shymala Hills. Intercity moves to Indore, Jabalpur, Nagpur, Delhi, and Ujjain are also available.' },
        { q: 'What is the most common move corridor in Bhopal — MP Nagar to Arera Colony?', a: 'The MP Nagar–Arera Colony corridor and the Hoshangabad Road–Kolar Road corridor are Bhopal\'s most active intra-city move routes. With IT growth on Hoshangabad Road, the flow from older Arera Colony and New Market zones toward Misrod and Bawadiya Kalan is growing. A cross-city move between MP Nagar and Kolar Road (12–18 km) takes 35–60 minutes in normal traffic.' },
        { q: 'Why is Bhopal one of MP\'s busiest cities for packers and movers during March–June?', a: 'Bhopal is MP\'s capital and hosts the state secretariat, Mantralaya, and dozens of central government offices. Annual postings of IAS, IPS, MP Police officers, teachers, and PSU bank staff peak in this window. Additionally, Hoshangabad Road IT companies are generating private sector relocation demand from Pune and Hyderabad, making Bhopal a dual-driver relocation market.' },
        { q: 'How do movers handle Old Bhopal\'s narrow lanes near Peer Gate and Hamidia Road?', a: 'Old Bhopal areas — Peer Gate, Iqbal Maidan, Hamidia Road, and Ibtara Road — have lanes of 8–12 feet that only Tata Ace mini trucks can access. TransRentals movers park the main truck on Hamidia Road main artery and use mini trucks for the last-mile stretch into old city. Mention your exact street and a nearby landmark at booking to ensure correct vehicle allocation.' },
        { q: 'When is the best time to shift house in Bhopal?', a: 'October–February (cool, low demand) is ideal. Avoid March–June — peak government transfers combined with summer heat reaching 42–45°C. Monsoon (July–September) is manageable in Bhopal which doesn\'t have major waterlogging issues in most zones. Mid-month dates (8th–20th) are consistently better than month-end for availability and pricing.' },
        { q: 'How long does a 2BHK shift take in Bhopal?', a: 'A standard 2BHK intra-Bhopal shift takes 6–9 hours with a 3-person team. Short moves within MP Nagar or Arera Colony take 4–6 hours. Cross-city moves (Bairagarh to Kolar Road or Berasia Road to Misrod) can take 9–12 hours depending on BHEL and New Market area traffic.' },
        { q: 'Can I move intercity from Bhopal to Indore, Jabalpur, or Delhi?', a: 'Yes — Bhopal to Indore (195 km via NH46, ~3.5 hrs) is the most common intercity route — smooth NH46 allows next-day delivery. Bhopal to Jabalpur (325 km via NH30, ~6 hrs), Bhopal to Nagpur (350 km via NH46/NH65, ~6.5 hrs), and Bhopal to Delhi (780 km via NH44, ~12–13 hrs truck) are all available. Full household packing + transport + insurance included.' },
        { q: 'Are movers available on weekends and during winter fog season in Bhopal?', a: 'Yes, movers are available year-round. Weekends and month-end dates (27th–3rd) are peak demand periods. A Bhopal-specific note: dense fog (December–January) can occasionally delay intercity truck arrivals by 3–6 hours on NH44 — factor this in for Delhi and Nagpur deliveries booked in winter months.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Bhopal?', a: 'A 12-seater AC Tempo Traveller in Bhopal starts from ₹5,000+/day. A 20-seater mini bus for Sanchi (46 km, ~1 hr) or Bhimbetka (45 km, ~1 hr) starts from ₹3,500+/day for half-day trips. For Pachmarhi hill station (210 km, ~4 hrs), a 17-seater Tempo Traveller starts from ₹8,000/day. Ujjain pilgrimages (185 km, ~3 hrs) start from ₹7,000/day.' },
        { q: 'Which bus routes are most popular from Bhopal?', a: 'Bhopal to Sanchi (46 km, ~1 hr via NH12) is the most popular heritage group route — UNESCO Buddhist monument tours for school and corporate groups are year-round. Bhopal to Pachmarhi (210 km, ~4 hrs via NH69) is the top leisure group route for hill outings. Bhopal to Ujjain (185 km, ~3 hrs) is a popular Mahakaleshwar pilgrimage group route.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Bhopal?', a: 'Yes, 20–50 seater AC buses are available for Bhopal weddings and corporate events. Hoshangabad Road IT companies and BHEL township organize employee outings regularly. Government department annual functions and picnics are a major segment — MP secretariat staff and PSU employees book buses for Panchmarhi trips. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance for peak season (Oct–Feb).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Bhopal?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for engineering and pharma goods are quoted per route. Mandideep industrial area (28 km from Bhopal) is MP\'s fastest-growing manufacturing cluster and the primary commercial transport zone.' },
        { q: 'What is the top goods transport route from Bhopal?', a: 'Bhopal to Indore (195 km via NH46, ~3.5 hrs) is the most active short-haul FTL corridor — NH46 is excellent and next-day delivery is standard. Bhopal to Delhi (780 km via NH44, ~12 hrs) is the key north-bound route for BHEL equipment and Mandideep auto components. LTL options are available from Bhopal\'s central MP hub position.' },
        { q: 'Which industrial areas in Bhopal use truck rentals most?', a: 'Mandideep MIDC (auto components, BHEL vendors, engineering), Govindpura industrial estate (textiles, plastics), and Bangrasia industrial zone (food processing) are Bhopal\'s top truck rental zones. TransRentals has verified vendors serving all three clusters, with particular strength in the Mandideep–Bhopal industrial corridor.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Bhopal per day?', a: 'Hatchback self-drive in Bhopal starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. SUVs are recommended for Pachmarhi ghat roads.' },
        { q: 'Can I self-drive from Bhopal to Bhimbetka and Sanchi in a single day?', a: 'Yes! Bhimbetka (45 km via NH46, ~1 hr) and Sanchi (46 km via NH12, ~1 hr) can be combined into a full day trip. Leave Bhopal by 7 AM, visit Bhimbetka by 8 AM, drive to Sanchi via NH12 (45 km from Bhimbetka), and return by afternoon — a perfect UNESCO heritage self-drive day.' },
        { q: 'Is an SUV required for self-drive to Pachmarhi from Bhopal?', a: 'Yes, an SUV is strongly recommended for Pachmarhi (195 km via NH69, ~4 hrs). The final 40 km involves ghats and steep sections. Monsoon (July–September) makes the ghat slippery — check road conditions before departure. Most vendors can provide SUVs with outstation permissions for Pachmarhi.' },
        { q: 'Which areas in Bhopal have self-drive car rental options?', a: 'MP Nagar, Arera Colony, and near Raja Bhoj Airport (BHO) have the most self-drive vendor availability. Hoshangabad Road IT zone vendors also offer doorstep delivery. Book 24 hours in advance for most locations.' },
        { q: 'What documents are required for self-drive in Bhopal?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). MP highway checkposts are active — keep vehicle documents handy. Out-of-state DL holders accepted by most vendors.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Bhopal?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Sanchi (46 km, ₹3,000 one-way 12-seater) and Bhimbetka (45 km) are popular half-day heritage routes. Pachmarhi hill station (210 km, ~4 hrs) full-day tour starts from ₹10,000.' },
        { q: 'Can I book a Tempo Traveller from Bhopal to Pachmarhi for a group outing?', a: 'Yes, Bhopal to Pachmarhi (210 km via NH69, ~4 hrs) is the most popular Tempo Traveller outstation route. A 12-seater one-way starts from ₹8,000. Groups of 8–12 from Hoshangabad Road IT companies book this regularly for team outings. An experienced ghat driver is provided.' },
        { q: 'How many people can a Tempo Traveller carry in Bhopal?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Sanchi heritage tours and Pachmarhi outings. The 17-seater suits larger government or PSU department groups for Ujjain pilgrimages (185 km). Non-AC options are also available for short routes at lower cost.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Bhopal?', a: 'Honda Activa and TVS Jupiter are ideal for Bhopal daily commuting — easy on the MP Nagar market roads, Ayodhya Bypass, and Hoshangabad Road IT corridor. The hilly terrain around Upper and Lower Lakes requires a scooter with good hill-climb capability.' },
        { q: 'Can I rent a Royal Enfield in Bhopal for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Bhopal for weekend rides. Pachmarhi (200 km via NH69, ~4 hrs) through Satpura\'s forested hills is a classic biker route. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Bhopal?', a: '24-hour minimum is standard in Bhopal. Some MP Nagar and Arera Colony vendors offer 4–8 hour packages for heritage sightseeing. Monthly rentals offer the best per-day rate — popular with government and BHEL township employees.' },
        { q: 'Are electric scooters available on rent in Bhopal?', a: 'Yes, electric scooters are growing in Bhopal under MP\'s EV push. Ideal for the Hoshangabad Road IT corridor and DB City Mall area where charging infrastructure is improving. Good option for short-distance commuting on Bhopal\'s well-maintained main roads.' },
        { q: 'What documents are needed to rent a bike in Bhopal?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors accept photo ID only for short intra-city rides. MP checkposts are active on highways — always carry your DL.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Bhopal?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. AIIMS Bhopal hospital construction, Smart City Bhopal infrastructure projects, Mandideep industrial estate expansion, and Ring Road development generate sustained equipment demand across the capital.' },
        { q: 'Which projects and industries generate the most equipment rental demand in Bhopal?', a: 'BHEL\'s (Bharat Heavy Electricals) manufacturing plant in Govindpura is one of India\'s largest heavy engineering facilities, and its ongoing maintenance, refurbishment, and capacity expansion work is a year-round source of industrial crane and specialised lifting equipment demand. AIIMS Bhopal hospital construction and Mandideep MIDC\'s auto and pharmaceutical factories are the other major demand centres for concrete equipment and tower cranes in the Bhopal region.' },
        { q: 'How do I book construction equipment for my project in Bhopal?', a: 'Bhopal\'s AIIMS hospital campus, Smart City road and utility projects, and Mandideep MIDC industrial expansion are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near AIIMS or Ring Road construction zones, book 5–7 days ahead to ensure proper site access.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Bhopal?', a: 'JCB 3DX backhoe loader rental in Bhopal starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Bhopal?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Bhopal. Active construction zones include AIIMS Bhopal Phase 2 campus, Smart City Bhopal lake promenade and road utility works, Mandideep MIDC expansion, and residential township development in Misrod, Ratibad, and Bawadiya Kalan.' },
        { q: 'What permissions are needed before starting JCB work in Bhopal?', a: 'For any road-cutting or utility excavation within Bhopal city limits, a BMC (Bhopal Municipal Corporation Development Committee) permission is mandatory before the machine arrives on site. Work inside or adjacent to the BHEL plant campus requires a separate BHEL Health, Safety, and Environment (HSE) clearance — this applies even if the work is being done by an outside contractor. BMDA (Bhopal Metropolitan Development Authority) permission is additionally needed for sites in master-plan development zones outside the BMC boundary.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Bhopal?', a: 'New Market Bhopal\'s wholesale and retail cluster is the city\'s primary mini truck generator — garments, household goods, and electronics move daily between the market and city-area shops. Mandideep industrial area uses mini trucks for intra-estate movement of auto parts, packaging materials, and pharmaceutical consignments between factories. BHEL Govindpura plant workshop supplies and spare components are also regularly moved by mini trucks on daily intra-city routes.' },
        { q: 'Can I rent a mini truck for house shifting in Bhopal?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Bhopal. Common routes: MP Nagar to Arera Colony, Hoshangabad Road to Kolar Road, and intra-Shahpura moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Bhopal?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. New Market wholesale deliveries, Mandideep industrial goods movement to Bhopal distribution points, and BHEL township equipment part deliveries are the most common mini truck use cases in Bhopal.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Chandigarh, India's first planned city, is the most popular base for Himachal Pradesh hill station road trips. Shimla (90 km), Manali (310 km), and Kasauli (65 km) are top outstation routes. Innova Crysta and Scorpio are most booked for hill trips. TransRentals has 50+ verified Chandigarh vendors covering all sectors, Panchkula, Mohali, and the Chandigarh Airport zone.",
      'bike-on-rent':
        "Chandigarh's wide boulevards, dedicated cycling paths, and proximity to Himachal hills make it ideal for biking. Royal Enfield Himalayan and Classic 350 are top rentals for Kasauli, Shimla, and Manali road trips. Daily commuters across sectors prefer Activa. TransRentals has bike rentals available from multiple Chandigarh sector pickup points.",
      'bus-rental':
        "Chandigarh's corporate belt and proximity to Himachal Pradesh make it a key bus rental hub. Shimla team outings, Manali holiday groups, and Golden Temple pilgrimages (230 km to Amritsar) are top routes. TransRentals offers AC 12-seater to 50-seater buses across Chandigarh, Panchkula, and Mohali for all group travel needs.",
      'packers-and-movers':
        "Chandigarh's status as joint capital of Punjab and Haryana — with government institutions, central universities, and a growing Mohali IT corridor — makes it a vibrant relocation hub. Government employee transfers — Punjab Police, Haryana Secretariat, Chandigarh Administration, High Court staff — peak every March–June. Common intra-city corridors: Sector 17 to Sector 35, Sector 44 to Manimajra, Sector 22 to Mohali Phase 7, and Panchkula Sector 12 to Zirakpur. New developments in Sectors 68–80 Mohali, Mullanpur New Chandigarh, and Zirakpur are pulling IT professionals from central Chandigarh sectors. Key intercity moves: Chandigarh to Delhi (260 km via NH44), Chandigarh to Ludhiana (100 km), Chandigarh to Amritsar (230 km), and Chandigarh to Shimla (90 km). Mohali IT parks — ITES Hub, Elante corridor, Aerocity — generate private sector relocations from Pune and Hyderabad. Chandigarh's planned grid with wide roads makes loading and unloading more straightforward than most Indian cities. TransRentals covers all Chandigarh sectors, Panchkula Sectors 1–31, and Mohali Phases 1–11 with verified, insured movers.",
      'transporter':
        "Chandigarh's Focal Point industrial estate and Mohali Phase industrial zones generate commercial transport demand for auto parts, textiles, and food processing goods. Punjab agricultural produce transport also routes through Chandigarh. TransRentals offers mini trucks to container trucks for goods movement from Chandigarh across North India.",
      'jcb-on-rent':
        "Chandigarh's master plan Phase 2 development, Mohali peripheral areas, and new expressway projects (Chandigarh-Baddi, Chandigarh-Pinjore) drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction across Chandigarh, Panchkula, and Mohali.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Chandigarh's inter-sector household shifting and market deliveries in Sector 17 and 22 shopping complexes. TransRentals has same-day mini-truck bookings across Chandigarh, Panchkula, and Mohali.",
      'tempo-traveller':
        "Chandigarh is the top departure point for Himachal Pradesh group tours. Manali (310 km), Shimla (90 km), and Dharamshala (230 km) are the most booked tempo traveller routes. Corporate team outings from Mohali IT park and educational institute trips are key segments. TransRentals offers AC 12–17 seater Tempo Travellers from Chandigarh.",
      'outstation-car-rental':
        "Outstation cabs from Chandigarh cover Shimla, Manali, Dharamshala, Kasauli, Amritsar (230 km), and Delhi (260 km). Hill-experienced drivers are essential for Manali and Dharamshala routes. TransRentals per-km pricing with SUV upgrades recommended for Manali and Spiti trips.",
      'one-way-car-rental':
        "Chandigarh's top one-way routes: Chandigarh to Delhi (260 km), Chandigarh to Shimla (90 km), Chandigarh to Amritsar (230 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Chandigarh International Airport (IXC) serves both Chandigarh and Mohali sectors. Airport is 12 km from Sector 17. TransRentals airport transfers cover all sectors, Panchkula, and Mohali zones. Airport to Sector 17 starting from ₹400 for a sedan. 24/7 service, no surge.",
      'self-drive-car-rentals':
        "Chandigarh is India's best self-drive city — Le Corbusier's grid layout means wide sector roads, clear signage, and easy navigation. The NH5 to Shimla (120 km) and NH44 to Amritsar (230 km) are the top self-drive routes. Kasauli (65 km) is an easy 90-minute self-drive. Manali (310 km via NH21) is a popular 2-day self-drive weekend trip. TransRentals lists verified self-drive vendors across Chandigarh sectors, Mohali, and Panchkula. SUVs are recommended for hill routes; sedans are ideal for Chandigarh-Amritsar and Chandigarh-Delhi drives.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Which is the best car for Chandigarh to Manali road trip?', a: 'An Innova Crysta, Scorpio, or Thar is ideal for Manali (310 km, ~7 hrs). The Rohtang Pass section (if going beyond Manali to Spiti) requires high ground clearance. Book with an experienced hill driver.' },
        { q: 'How far is Shimla from Chandigarh by road?', a: 'Chandigarh to Shimla is 90 km via NH5 — about 2.5 hours. The road is scenic but has narrow curves after Solan. An early morning departure (6 AM) ensures you reach Shimla before peak tourist traffic.' },
        { q: 'What is the cab cost from Chandigarh to Amritsar?', a: 'One-way cab from Chandigarh to Amritsar (230 km via NH44) starts from ₹2,100 for a sedan. Journey time is about 4 hours on the 6-lane NH44 highway.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller from Chandigarh to Manali?', a: 'AC 12-seater Tempo Traveller from Chandigarh to Manali (310 km, ~7 hrs) starts from ₹10,000 one-way. 2–3 night Manali packages with return are very popular from Chandigarh.' },
        { q: 'Can I book a Tempo Traveller for Chandigarh to Golden Temple Amritsar?', a: 'Yes, Chandigarh to Amritsar Golden Temple (230 km, ~4 hrs) Tempo Traveller day trip starts from ₹8,000 for a 12-seater including waiting at Amritsar.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas do TransRentals movers cover in Chandigarh?', a: 'TransRentals-verified movers cover all Chandigarh sectors (1–56), Panchkula Sectors 1–31, and Mohali Phases 1–11 including Zirakpur, Aerocity, and Mullanpur New Chandigarh. Intercity moves to Delhi, Ludhiana, Amritsar, Shimla, and Dehradun are also available.' },
        { q: 'What is the most common move corridor in Chandigarh — central sectors to Mohali?', a: 'The central Chandigarh Sectors (17–35) to Mohali Phase 7–11 corridor and the Sector 44–Zirakpur route are Chandigarh\'s busiest move paths, driven by IT professionals relocating to Mohali\'s newer residential developments. Panchkula Sector 12 to Zirakpur is another growing corridor. Cross-city transit (Sector 22 to Mohali Phase 10) takes 25–40 minutes via the IT Park Road.' },
        { q: 'Does Chandigarh\'s planned Le Corbusier grid layout make moving easier than other Indian cities?', a: 'Yes — Chandigarh is the easiest Indian city for household moves. Wide sector roads (60–100 ft) accommodate large trucks with ease, clear sector numbering makes navigation simple, and service lanes allow truck access to most apartment blocks. There are virtually no narrow-lane access issues unlike Old Delhi, Lucknow\'s Chowk, or Nagpur\'s Itwari. This typically reduces move time by 1–2 hours vs. comparable Indian cities.' },
        { q: 'When is the peak relocation season in Chandigarh?', a: 'March–June is peak season due to Punjab and Haryana government transfer orders for IAS/IPS officers, Punjab Police, Haryana Secretariat staff, and Chandigarh Administration employees. Mohali IT companies also have appraisal cycles in April–May, triggering private sector relocations. Pre-September (August) sees a second smaller wave as families want to settle before school terms start.' },
        { q: 'How long does a 2BHK shift take within Chandigarh?', a: 'A standard 2BHK intra-Chandigarh shift takes 5–8 hours — notably faster than most Indian cities due to wide planned roads and organized building access. Short same-sector moves take 4–5 hours. Long moves from Chandigarh sectors to Mohali Phase 10 or Zirakpur can take 7–9 hours with IT Park Road rush-hour traffic factored in.' },
        { q: 'Do movers cover Panchkula and Mohali as part of Chandigarh moves?', a: 'Yes — Chandigarh, Panchkula, and Mohali are treated as a single tri-city area by TransRentals movers. Inter-city moves within the tricity (e.g., Sector 22 Chandigarh to Panchkula Sector 15, or Mohali Phase 7 to Zirakpur) are charged at local/intra-city rates — not intercity rates. Confirm this at booking to avoid overcharging.' },
        { q: 'Can I move intercity from Chandigarh to Delhi, Ludhiana, or Amritsar?', a: 'Yes — Chandigarh to Delhi (260 km via NH44, ~4.5 hrs) is the most popular intercity route. Chandigarh to Ludhiana (100 km, ~2 hrs) and Chandigarh to Amritsar (230 km, ~4 hrs) are also available. NH44 is one of India\'s best highways — intercity truck deliveries are reliable and punctual. Shimla (90 km, ~2.5 hrs) moves are available with specialized hill-area unloading teams.' },
        { q: 'When is the best time to shift house in Chandigarh?', a: 'October–February is ideal — cool weather, low demand, good road conditions. Avoid March–June (peak government transfers, high demand). Monsoon (July–September) is light in Chandigarh and doesn\'t significantly affect moving. Shimla-destination moves should avoid July–August due to NH5 landslide risk. Mid-month weekdays are consistently more available than month-end weekend bookings.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Chandigarh?', a: 'A 12-seater AC Tempo Traveller in Chandigarh starts from ₹5,000+/day. A 20-seater mini bus for Shimla (115 km, ~2.5 hrs) starts from ₹7,000+/day. For Manali group tours (310 km, ~7 hrs), full-size AC buses start from ₹15,000+/day. Amritsar Golden Temple pilgrimages (230 km, ~4 hrs) in a 17-seater Tempo Traveller start from ₹8,000/day.' },
        { q: 'Which bus routes are most popular from Chandigarh?', a: 'Chandigarh to Shimla (115 km, ~2.5 hrs via NH5) is the most popular group route — NH5 is scenic and weekend demand is very high. Chandigarh to Manali (310 km, ~7 hrs) is the top hill tourism group route, especially in summer (Apr–Jun). Chandigarh to Amritsar (230 km, ~4 hrs) for Golden Temple darshan is a popular one-day group pilgrimage.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Chandigarh?', a: 'Yes, 20–50 seater AC buses are available for Chandigarh weddings and corporate events. Mohali IT companies and PGI Chandigarh organize employee outings to Shimla and Kasauli regularly. Chandigarh\'s large Punjabi wedding culture means decorated baraat buses are in high demand — start from ₹18,000/day. Book 3–4 weeks in advance during the Nov–Feb wedding season.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Chandigarh?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for pharma and auto goods are quoted per route. Baddi industrial area (Himachal Pradesh, 45 km from Chandigarh) is one of India\'s largest pharma clusters and drives significant Chandigarh-based truck demand.' },
        { q: 'What is the top goods transport route from Chandigarh?', a: 'Chandigarh to Delhi (260 km via NH44, ~4.5 hrs) is the busiest FTL corridor — carrying pharma APIs from Baddi, auto components from Derabassi, and food products from Mohali. The Baddi-Chandigarh-Delhi pharma corridor is one of North India\'s most active truck routes. LTL and FTL options are both available.' },
        { q: 'Which industrial areas in Chandigarh use truck rentals most?', a: 'Baddi HIMUDA industrial area (Himachal Pradesh, 45 km — India\'s largest pharma cluster), Derabassi industrial estate (auto ancillaries, food processing), and Mohali Focal Point Phase 7 (engineering, IT hardware) are the primary truck rental zones. TransRentals has verified vendors serving all three clusters.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Chandigarh per day?', a: 'Hatchback self-drive in Chandigarh starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Scorpio, Creta) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekly packages available for extended Himachal Pradesh trips.' },
        { q: 'Can I self-drive from Chandigarh to Shimla or Kasauli?', a: 'Yes, Shimla (120 km via NH5, ~2.5 hrs) and Kasauli (65 km via NH5, ~1.5 hrs) are easy self-drive hill trips. NH5 has sharp curves after Dharampur — drive carefully, especially in monsoon and winter. Confirm the vendor allows hill travel before booking.' },
        { q: 'Is self-drive to Manali from Chandigarh safe for beginners?', a: 'Chandigarh to Manali (310 km via NH21, ~7 hrs) involves mountain roads — it is not recommended for first-time hill drivers. The Atal Tunnel and Rohtang Pass section require experience. If you\'re an experienced driver, a sedan is adequate up to Manali town; SUV recommended for Spiti Valley and higher elevations.' },
        { q: 'Which areas in Chandigarh have self-drive car rental options?', a: 'Central sectors (Sector 17, 22, 35), Mohali Phases 5–7, and Panchkula sectors have self-drive vendor availability. Chandigarh International Airport (IXC) area pickups available with 24 hours\' advance booking. Doorstep delivery across all tri-city sectors.' },
        { q: 'What documents are required for self-drive in Chandigarh?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹5,000). Himachal Pradesh hill routes require vehicle RC — keep it in the car. Punjab-Haryana border checkposts are common — carry all documents. Out-of-state DL holders fully accepted.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Chandigarh?', a: 'Honda Activa and TVS Jupiter are ideal for Chandigarh daily commuting — Chandigarh\'s wide Le Corbusier grid roads (60–100 ft sector roads) and smooth surfaces make scooters extremely comfortable. Sector 17 and 22 commercial zones are easy to navigate on two-wheelers.' },
        { q: 'Can I rent a Royal Enfield in Chandigarh for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 and Himalayan are both popular in Chandigarh for weekend rides. Shimla (115 km via NH5, ~2.5 hrs) is the most popular biker destination. Starting from ₹1,000–₹1,200/day for Classic 350.' },
        { q: 'What is the minimum rental period for bikes in Chandigarh?', a: '24-hour minimum is standard. Some Sector 17 and Mohali vendors offer 4–8 hour packages for city sightseeing. Monthly rentals offer the best per-day rate — popular with Mohali IT park and PGI Chandigarh professionals.' },
        { q: 'Are electric scooters available on rent in Chandigarh?', a: 'Yes, electric scooters are well-suited to Chandigarh\'s flat, wide, planned roads. Available in Sector 22, 35, and Mohali. The tri-city\'s well-maintained road network and growing EV charging infrastructure make Chandigarh one of India\'s best cities for e-scooter commuting.' },
        { q: 'What documents are needed to rent a bike in Chandigarh?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors accept photo ID only for short city rides. Chandigarh police are strict — always carry a valid DL. Out-of-state DLs fully accepted.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Chandigarh?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. IT Park Mohali expansion, Chandigarh Smart City infrastructure works, Zirakpur rapid residential development, and Baddi pharma manufacturing zone construction drive consistent equipment demand across the tri-city.' },
        { q: 'What drives the most equipment rental demand in the Chandigarh region?', a: 'Baddi pharmaceutical cluster in Himachal Pradesh — just 45 km from Chandigarh — is the region\'s single largest equipment demand source, with continuous pharma plant construction, generator rental, and industrial crane demand from dozens of factories. IT Park Mohali\'s new phase development adds high-rise construction equipment demand. Chandigarh\'s own Smart City projects and the Chandigarh-Ludhiana highway widening also keep earthmoving equipment consistently engaged.' },
        { q: 'How do I book construction equipment for my project in Chandigarh?', a: 'Chandigarh tri-city\'s IT Park Mohali, Smart City infrastructure, and rapid residential construction in Zirakpur and Panchkula are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near Baddi pharma zone or Smart City work, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Chandigarh?', a: 'JCB 3DX backhoe loader rental in Chandigarh starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Chandigarh?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Chandigarh, Mohali, and Panchkula. Active construction zones include IT Park Mohali campus expansion, Smart City road and utility upgrades, Zirakpur residential township earthworks, and Baddi industrial zone factory construction.' },
        { q: 'What permits are required for JCB work in Chandigarh and Mohali?', a: 'Chandigarh is a Union Territory with strict building regulations — any road excavation or utility work requires a UT Engineering Department NOC before a JCB can operate on public land. In Mohali, sites in GMADA (Greater Mohali Area Development Authority) industrial zones need a GMADA permission, separate from PUDA requirements. For Baddi and Nalagarh (HP side), HP PWD clearance applies. Allow 7–10 days for UT NOC processing, which is typically slower than state-level approvals.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Chandigarh?', a: 'Sector 17 and Sector 22\'s commercial markets generate steady Tata Ace demand for restocking retail shops with garments, electronics, and packaged goods. IT Park Chandigarh and Mohali\'s Rajiv Gandhi Chandigarh Technology Park see frequent furniture and IT equipment moves as companies expand or relocate within the campus. Baddi pharma cluster packaging material — cartons, bottles, foil — is transported by mini trucks from Chandigarh\'s wholesale distributors to factory gates on a daily basis.' },
        { q: 'Can I rent a mini truck for house shifting in Chandigarh?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Chandigarh. Common routes: Sector 22 to Mohali, Panchkula to Chandigarh sectors, and intra-Zirakpur moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Chandigarh?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Sector 22 market deliveries, IT park furniture and equipment moves in Mohali, and Baddi pharma supplies transported to Chandigarh distribution points are the most common mini truck use cases in the tri-city.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Coimbatore, the gateway to the Nilgiris, is South India's top base for Ooty and Munnar road trips. Innova and Ertiga dominate outstation bookings; sedans lead corporate travel. Industrial zones in Peelamedu and SIPCOT generate weekday corporate cab demand. TransRentals has 50+ verified Coimbatore vendors covering RS Puram, Gandhipuram, and the airport zone.",
      'bike-on-rent':
        "Coimbatore's engineering and textile industry workforce drives daily bike rental demand. RS Puram and Saibaba Colony are top pickup zones. Royal Enfield Himalayan and Classic 350 are popular for Ooty ghat rides (85 km, 36 hairpin bends). Activa and Dio lead daily city commuting. TransRentals has bike rentals across Coimbatore.",
      'bus-rental':
        "Coimbatore's Ooty and Munnar group tour market makes it a top bus rental city in Tamil Nadu. IT company team outings from SIPCOT and Tidel Park to Ooty and Kodaikanal are regular bookings. Pilgrimage buses to Palani (100 km) and Kodungallur (160 km) are also popular. TransRentals offers AC Tempo Travellers and buses across Coimbatore.",
      'packers-and-movers':
        "Coimbatore's booming textile, engineering, and IT sectors have created one of Tamil Nadu's most active relocation markets outside Chennai. The SIPCOT Perundurai industrial estate, Tidel Park IT zone, and Saravanampatti technology corridor attract professionals from across South India. Common intra-city corridors: RS Puram to Saravanampatti, Peelamedu to Ganapathy, Gandhipuram to Kuniyamuthur, and Singanallur to Vadavalli. Government employee transfers — Tamil Nadu civil services, income tax, and PSU banks — peak March–June. Key intercity moves: Coimbatore to Chennai (510 km via NH544), Coimbatore to Bangalore (360 km), Coimbatore to Kochi (190 km), and Coimbatore to Hyderabad (800 km). Tirupur knitwear industry professionals relocating to Coimbatore headquarters are a steady monthly segment. The Gandhipuram and Suppukarapuram bazaar areas require compact vehicles for narrow-lane moves. Tamil New Year (April) and Deepavali season see short-distance household moves peak. TransRentals covers all Coimbatore zones — including Ondipudur, Podanur, Thudiyalur, Vilankurichi, Hopes College, Saibaba Colony, and Rathinapuri — with verified, insured movers providing complete packing, transport, and transit insurance.",
      'transporter':
        "Coimbatore's textile spinning mills, engineering goods manufacturers, and pump industry in Sidco Industrial Estate generate strong commercial transport demand. Tirupur knitwear export transport is a major segment. TransRentals offers verified transporters with mini trucks to container vehicles from Coimbatore.",
      'jcb-on-rent':
        "Coimbatore's SIPCOT Phase 2 expansion, ring road development, and new township projects in Saravanampatti and Vilankurichi drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Coimbatore and Tirupur districts.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Coimbatore's Textile Market and Flower Bazaar deliveries and apartment shifting in RS Puram and Saibaba Colony. TransRentals has same-day mini-truck bookings across all Coimbatore zones.",
      'tempo-traveller':
        "Coimbatore is the most popular base for Ooty group tours. AC 12-seater Tempo Travellers are the top booking for Ooty via Mettupalayam ghat road. Munnar (155 km), Kodaikanal (175 km), and Palani temple (100 km) are other top routes. TransRentals offers hill-experienced drivers for all Coimbatore outstation group trips.",
      'outstation-car-rental':
        "Outstation cabs from Coimbatore cover Ooty (85 km), Munnar (155 km), Kodaikanal (175 km), Palani (100 km), Coorg (250 km), and Bangalore (360 km). Hill-experienced drivers provided for ghat sections. TransRentals transparent per-km pricing.",
      'one-way-car-rental':
        "Coimbatore's top one-way routes: Coimbatore to Chennai (510 km), Coimbatore to Bangalore (360 km), Coimbatore to Kochi (190 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Coimbatore International Airport (CJB) is 10 km from RS Puram and Gandhipuram. TransRentals airport transfers cover all Coimbatore zones. Airport to RS Puram starting from ₹380 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Coimbatore is the gateway to the Nilgiris and Palakkad, making it one of South India's most popular self-drive base cities. Ooty (85 km via Mettupalayam ghat, 36 hairpin bends), Kodaikanal (170 km via NH44), and Palakkad (55 km via NH544) are popular self-drive routes. Note: self-drive on ghat roads to Ooty requires experience and caution — the Mettupalayam ghat is steep. TransRentals lists verified self-drive vendors in RS Puram, Gandhipuram, and near Coimbatore Airport. Sedans and compact SUVs available; SUVs strongly recommended for ghat routes.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Which car is best for Coimbatore to Ooty trip?', a: 'An SUV (Innova, Ertiga, or XL6) is recommended for Ooty via Mettupalayam — the 36 hairpin bends require confident driving and good ground clearance. Experienced ghat drivers available on TransRentals.' },
        { q: 'What is the cab cost from Coimbatore to Munnar?', a: 'One-way cab from Coimbatore to Munnar (155 km, ~4 hrs) starts from ₹1,500 for a sedan. The Chalakudy route via NH544 is recommended.' },
        { q: 'Is self-drive available in Coimbatore?', a: 'Yes, self-drive cars are available in Coimbatore. Note: self-drive on Ooty/Munnar ghat roads is risky — chauffeur-driven is strongly recommended for hill routes.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Coimbatore do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Coimbatore localities — RS Puram, Gandhipuram, Saibaba Colony, Peelamedu, Saravanampatti, Singanallur, Ganapathy, Kuniyamuthur, Vadavalli, Ondipudur, Podanur, Thudiyalur, Vilankurichi, Hopes College, Rathinapuri, and SIPCOT. Intercity moves to Chennai, Bangalore, Kochi, Hyderabad, and Tirupur are also available.' },
        { q: 'What is the most common move corridor in Coimbatore — RS Puram to Saravanampatti?', a: 'The RS Puram–Saravanampatti corridor and the Peelamedu–Ganapathy route are Coimbatore\'s most active intra-city move paths, driven by IT and manufacturing professionals upgrading to newer IT-corridor townships. The Gandhipuram–Kuniyamuthur corridor reflects traditional commercial-zone families relocating to quieter residential areas. Avinashi Road peak hours (9–11 AM, 6–8 PM) can add 45–60 minutes to cross-city transit.' },
        { q: 'How do movers handle Gandhipuram and Suppukarapuram\'s narrow bazaar lanes?', a: 'Gandhipuram bus stand area, Suppukarapuram, and Ukkadam market zones have lanes of 10–15 feet restricting large truck access. TransRentals movers deploy Tata Ace mini trucks for these areas, staging the main vehicle at the nearest accessible junction. Always mention proximity to market areas when booking — movers allocate appropriate vehicles and extra time.' },
        { q: 'Do TransRentals movers handle relocations between Tirupur and Coimbatore?', a: 'Yes — Tirupur to Coimbatore (50 km via Avinashi Road, ~1 hr) is a frequently requested short intercity move, with knitwear industry professionals relocating families to Coimbatore for better education and quality of life. This move is treated as a premium local route. TransRentals has movers experienced specifically on the Tirupur–Coimbatore corridor.' },
        { q: 'When is the best time to shift house in Coimbatore?', a: 'October–January is ideal — post-monsoon weather, cool Nilgiris breeze, and lower demand. April–June is peak season (Tamil Nadu government transfer orders + financial year end). Tamil New Year (April 14) and Pongal (January) are auspicious moving dates — book 10–14 days in advance for these specific dates.' },
        { q: 'How long does a 2BHK shift take within Coimbatore?', a: 'A standard 2BHK intra-Coimbatore shift takes 6–9 hours with a 3-person team. Short same-zone moves (RS Puram to Saibaba Colony or Peelamedu to Singanallur) take 5–7 hours. Long cross-city moves (Podanur to Saravanampatti or SIPCOT to Gandhipuram) can take 9–12 hours with Avinashi Road and Trichy Road traffic factored in.' },
        { q: 'Can I move intercity from Coimbatore to Chennai, Bangalore, or Kochi?', a: 'Yes — Coimbatore to Chennai (510 km via NH544, ~8 hrs), Coimbatore to Bangalore (360 km via NH948, ~6 hrs), and Coimbatore to Kochi (190 km via NH544, ~4 hrs) are the top three intercity routes. Tiruvananthapuram (290 km), Madurai (175 km), and Hyderabad (800 km) are also available. Get a free quote on TransRentals for full household intercity pricing.' },
        { q: 'Are movers available during Tamil New Year and Pongal in Coimbatore?', a: 'Yes, movers are available on all days including Tamil New Year (April 14) and Pongal (January) — both are highly auspicious griha pravesh dates in Tamil Nadu. Expect 40–60% higher demand on these specific dates and around Deepavali (October–November). Book 10–14 days in advance for auspicious dates and 3–5 days ahead for regular weekends.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Coimbatore?', a: 'A 12-seater AC Tempo Traveller in Coimbatore starts from ₹5,000+/day. A 20-seater mini bus for Ooty (90 km, ~2.5 hrs via Mettupalayam ghat) starts from ₹8,000+/day. For Palani temple pilgrimages (130 km, ~2.5 hrs), a 17-seater Tempo Traveller starts from ₹6,500/day. Kodaikanal group tours (170 km, ~4 hrs) start from ₹8,000+/day.' },
        { q: 'Which bus routes are most popular from Coimbatore?', a: 'Coimbatore to Ooty (90 km, ~2.5 hrs via Mettupalayam) is the most popular group route in Tamil Nadu — hill tourism buses are in high demand throughout the year. Coimbatore to Palani (130 km, ~2.5 hrs) is the top pilgrimage group route for Murugan temple darshan. Coimbatore to Kodaikanal (170 km, ~4 hrs) is popular for school excursions and corporate team outings.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Coimbatore?', a: 'Yes, 20–50 seater AC buses are available for Coimbatore weddings and corporate events. SIPCOT and Tidel Park IT companies regularly book outing coaches to Ooty and Kodaikanal. Tamil wedding season peaks in the Tamil month of Panguni (Mar–Apr) and Aippasi (Oct–Nov) — book decorated baraat buses 3–4 weeks in advance. Starting from ₹15,000/day for decorated event buses.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Coimbatore?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for textile and engineering goods are quoted per route. Singanallur and Peelamedu industrial estates are Coimbatore\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Coimbatore?', a: 'Coimbatore to Chennai (510 km via NH544, ~8 hrs) is the busiest FTL corridor — carrying textiles from Tirupur, engineering goods from Coimbatore\'s pump industry, and auto components from SIPCOT. The Coimbatore-Bangalore route (360 km via NH948, ~6 hrs) is the primary south-bound corridor for knitwear and engineering exports. LTL options are widely available.' },
        { q: 'Which industrial areas in Coimbatore use truck rentals most?', a: 'Singanallur industrial estate (textiles, wet processing), Peelamedu SIPCOT (IT, engineering, pharma), and Ganapathy-Saravanampatti corridor (manufacturing, auto) are Coimbatore\'s top truck rental zones. Tirupur knitwear export hub (50 km) also drives significant commercial transport through Coimbatore. TransRentals has verified vendors across all these zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Coimbatore per day?', a: 'Hatchback self-drive in Coimbatore starts from ₹799/day. Sedans start from ₹999/day. SUVs (Creta, XL6) start from ₹1,499/day. Packages include 100–150 km; extra km at ₹10–14/km. SUVs are strongly recommended for Ooty ghat routes.' },
        { q: 'Is self-drive safe on the Ooty ghat road from Coimbatore?', a: 'The Mettupalayam ghat road to Ooty has 36 hairpin bends and is steep — self-drive requires experience on mountain roads. First-time ghat drivers should opt for a chauffeur-driven car instead. For experienced drivers, an SUV is mandatory. Avoid ghat driving during heavy rain or fog. Timing: leave by 7 AM to reach Ooty before noon traffic.' },
        { q: 'What are the easy self-drive routes from Coimbatore?', a: 'Palakkad (55 km via NH544, ~1.5 hrs) is the easiest flat drive. Tiruppur (50 km, ~1 hr) and Pollachi (40 km, ~1 hr) are quick day trips. Kodaikanal (170 km via NH44 and SH, ~4 hrs) involves moderate ghats — manageable for careful drivers in an SUV.' },
        { q: 'Which areas in Coimbatore have self-drive car rental options?', a: 'RS Puram, Gandhipuram, Peelamedu, and near Coimbatore International Airport (CJB) have self-drive vendors. Saravanampatti IT corridor vendors offer doorstep delivery. Book 24 hours in advance.' },
        { q: 'What documents are required for self-drive in Coimbatore?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹4,000). Tamil Nadu–Kerala border checkpost on NH544 requires vehicle documents — keep RC and insurance handy. Out-of-state DL holders accepted.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Coimbatore?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Ooty (90 km, ₹4,500 one-way 12-seater via Mettupalayam ghat) and Palani temple (130 km) are top group pilgrimage routes. Kodaikanal (175 km) full-day tour starts from ₹8,000.' },
        { q: 'Can I book a Tempo Traveller from Coimbatore to Ooty?', a: 'Yes, Coimbatore to Ooty (90 km via Mettupalayam ghat, ~2.5 hrs) is Coimbatore\'s most popular Tempo Traveller route. A 12-seater one-way starts from ₹4,500. An experienced ghat driver is always provided — the 36 hairpin bends require skilled navigation. Avoid monsoon weekends when ghat traffic is heaviest.' },
        { q: 'How many people can a Tempo Traveller carry in Coimbatore?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Ooty and Palani pilgrimages. The 17-seater suits SIPCOT and Tidel Park IT company team outings to Kodaikanal (175 km) and Guruvayur (195 km). Non-AC options available for local corporate events.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Coimbatore?', a: 'Honda Activa and TVS Jupiter are ideal for Coimbatore daily commuting — perfect for Gandhipuram bus stand area, RS Puram market roads, and Peelamedu SIPCOT IT corridor. TVS Jupiter was designed with Coimbatore\'s road usage patterns in mind as TVS is based here.' },
        { q: 'Can I rent a Royal Enfield in Coimbatore for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is widely available in Coimbatore for weekend rides. Ooty (90 km via Mettupalayam ghat, ~2–3 hrs on two wheels) is the classic biker mountain road. Starting from ₹1,000–₹1,200/day. Experienced ghat riders only — 36 hairpin bends.' },
        { q: 'What is the minimum rental period for bikes in Coimbatore?', a: '24-hour minimum is standard in Coimbatore. Some RS Puram and Gandhipuram vendors offer 4–8 hour packages for city use. Monthly rentals are popular with textile industry and IT professionals and offer the best per-day rate.' },
        { q: 'Are electric scooters available on rent in Coimbatore?', a: 'Yes, Coimbatore is a hub for EV manufacturing (TVS Motor Company) and electric scooters are growing in availability. Good option for Saravanampatti IT corridor and Peelamedu SIPCOT zone commuting. Charging infrastructure is expanding rapidly in the city.' },
        { q: 'What documents are needed to rent a bike in Coimbatore?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Tamil Nadu checkposts require DL at all times. Some vendors accept photo ID only for short intra-city rides. Out-of-state DLs accepted.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Coimbatore?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Coimbatore SIPCOT industrial park expansion, NH improvements, TIDEL Park IT infrastructure, and textile factory construction in Peelamedu and Saravanampatti generate consistent equipment demand.' },
        { q: 'Which industries drive equipment rental demand in Coimbatore?', a: 'Textile mill expansion in Peelamedu and Saravanampatti — where weaving and spinning units are continuously upgrading capacity — is a primary source of industrial crane and generator set demand. Coimbatore\'s pump and motor manufacturing belt in Singanallur and Ganapathy requires concrete equipment and cranes for factory construction and plant upgrades. TIDEL Park Coimbatore Phase 2 IT campus build-out is adding commercial tower crane demand to an otherwise industrial-dominated market.' },
        { q: 'How do I book construction equipment for my project in Coimbatore?', a: 'Coimbatore\'s SIPCOT industrial estate, TIDEL Park IT campus, and NH widening projects are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near industrial zones or NH work sites, book 5–7 days ahead. Coimbatore\'s engineering sector also uses compactors and rollers for factory floor construction.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Coimbatore?', a: 'JCB 3DX backhoe loader rental in Coimbatore starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Coimbatore?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Coimbatore. Active construction zones include SIPCOT Coimbatore industrial expansion, NH improvements near Mettupalayam Road, TIDEL Park Phase 2 work, and textile factory and pump manufacturing unit construction in Peelamedu and Saravanampatti.' },
        { q: 'What soil and permit considerations apply to JCB work in Coimbatore?', a: 'NH Mettupalayam Road widening (the approach to Ooty ghat) is an active NHAI corridor, and JCB work in that zone requires an NHAI NOC plus lane-closure coordination. Coimbatore\'s soil is a mixed laterite-alluvial profile — sites near the Noyyal River (Ganapathy, Kavundampalayam) tend to be softer, while higher ground in Peelamedu and Saravanampatti has laterite layers. Confirm with the vendor which drill-bit or bucket type suits your specific site before booking.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Coimbatore?', a: 'Textile mill yarn deliveries — moving yarn cones, thread spools, and greige fabric between spinning mills in Saravanampatti and weaving units in Gandhipuram — are Coimbatore\'s most frequent mini truck use case. Pump and motor industry components from Singanallur factories are regularly ferried to SIPCOT Perundurai and Oragadam by Tata Ace. TIDEL Park IT equipment moves and Coimbatore SITRA textile testing institute sample dispatches also generate regular mini truck demand.' },
        { q: 'Can I rent a mini truck for house shifting in Coimbatore?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Coimbatore. Common routes: RS Puram to Saravanampatti, Gandhipuram to Peelamedu, and intra-Singanallur moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Coimbatore?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Textile mill yarn and fabric deliveries to Gandhipuram market, pump industry component dispatches from Singanallur to SIPCOT, and Tidel Park IT equipment moves are the most common mini truck use cases in Coimbatore.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Kochi's Infopark-Kakkanad IT corridor, port logistics, and booming tourism to Fort Kochi and Alleppey backwaters generate strong car rental demand. Innova and Ertiga lead group travel bookings. TransRentals has 60+ verified Kochi vendors covering Ernakulam, Fort Kochi, Kakkanad, Edappally, and the Cochin Airport zone.",
      'bike-on-rent':
        "Kochi's unique geography — mainland Ernakulam, Fort Kochi island, and Vypin — makes bikes practical for short ferry-and-ride travel. Daily commuters in Kakkanad and Edappally prefer Activa. Fort Kochi's heritage lanes are best explored on scooters. TransRentals has bike rentals across Kochi including Mattancherry and Kalamassery.",
      'bus-rental':
        "Kochi's corporate sector and Kerala tourism drive bus demand. IT company team outings to Munnar (130 km) and Thekkady (190 km) are popular. Wedding transport and church events in Fort Kochi and Thrissur are regular bookings. TransRentals offers AC Tempo Travellers and buses for pilgrimages, corporate events, and tourist groups from Kochi.",
      'packers-and-movers':
        "Kochi's thriving Infopark-Kakkanad IT corridor, Cochin Port logistics hub, and rapidly expanding SmartCity campus have made it Kerala's most active relocation market. IT professionals relocating from Bangalore and Hyderabad to Kochi's tech parks require comprehensive packing and moving services. Common intra-city corridors: Kakkanad to Edappally, Aluva to Marine Drive, Thrikkakara to Fort Kochi, and Kalamassery to Vyttila. Government employee transfers — Kerala PSC, Cochin Port Trust, BSNL, and Indian Navy — peak March–June. Key intercity moves: Kochi to Bangalore (560 km via NH544), Kochi to Hyderabad (1,100 km), Kochi to Chennai (690 km), and Kochi to Thiruvananthapuram (215 km). Kochi's island geography — Mattancherry and Fort Kochi on separate islands — requires coordination for inter-island moves via Goshree Bridge and High Court bridge routes. Monsoon (June–August) is challenging for movers: schedule indoor packing well before the loading day and ensure waterproof materials. TransRentals covers all Kochi zones — including Palluruthy, Nettoor, Irumpanam, Panampilly Nagar, GCDA Colony, Palarivattom, and Vytilla — with verified, insured movers.",
      'transporter':
        "Kochi's Vallarpadam Container Terminal and Cochin Port are South India's largest logistics hubs. Industrial estates in Eloor (chemicals) and Kalamassery (engineering) generate daily truck movement. TransRentals offers verified transporters with mini trucks to 40-ft containers for port-city logistics and intercity freight from Kochi.",
      'jcb-on-rent':
        "Kochi's metro Phase 2 extensions, Smart City Kochi development, and massive residential construction in Kakkanad and Aluva drive JCB demand. Port expansion works in Vallarpadam are a major user. TransRentals provides JCB 3DX and mini excavators for construction and infrastructure projects across Greater Kochi.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Kochi's Ernakulam market deliveries and apartment shifting across the city's multiple zones. Ferry connections can complicate logistics — TransRentals mini trucks optimize routes for Kochi's island-mainland geography.",
      'tempo-traveller':
        "Kochi's IT workforce and tourist base make it Kerala's top tempo traveller market. Munnar (130 km), Alleppey (55 km), and Thekkady (190 km) are the most booked group routes. TransRentals offers AC 12–17 seater Tempo Travellers from Kochi with drivers experienced on Kerala's scenic hill and coastal routes.",
      'outstation-car-rental':
        "Outstation cabs from Kochi cover Munnar, Alleppey, Thekkady, Thrissur, Coimbatore, and Bangalore. Kerala's scenic NH66 coastal highway is a popular outstation route. TransRentals transparent per-km pricing with experienced drivers for hill routes to Munnar.",
      'one-way-car-rental':
        "Kochi's top one-way routes: Kochi to Trivandrum (220 km), Kochi to Munnar (130 km), Kochi to Bangalore (560 km). Transparent all-inclusive pricing on TransRentals.",
      'airport-transfer':
        "Cochin International Airport (COK) is 30 km from Ernakulam — India's first solar-powered airport. TransRentals airport transfers cover all Kochi zones including Fort Kochi and Kakkanad. Airport to MG Road starting from ₹750 for a sedan. 24/7 service, no surge, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Kerala's coastal drives and backwater roads make Kochi an exciting self-drive city. Alleppey (55 km via NH66, ~1.5 hrs) is one of the easiest and most scenic coastal self-drives in India. Munnar (130 km via NH85, ~3.5 hrs) involves steep ghats — self-drive is possible but requires hill road experience. Thekkady (185 km via NH183) is another popular self-drive destination. TransRentals lists verified self-drive vendors in Ernakulam, Kakkanad, and near Cochin Airport. Kerala roads are generally good but hill sections near Munnar and Wayanad are narrow.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for a Kochi to Munnar trip?', a: 'An SUV (Innova, Ertiga, or Scorpio) is strongly recommended for Munnar — the last 50 km has steep ghats and narrow roads. Experienced drivers available on TransRentals.' },
        { q: 'How far is Alleppey (Alappuzha) from Kochi?', a: 'Kochi to Alleppey is 55 km via NH66 (about 1.5 hours). Most backwater houseboat trips start from Alleppey. A pre-booked TransRentals cab is the most convenient way to reach Alleppey jetty.' },
        { q: 'Is car rental available near Cochin Airport?', a: 'Yes, TransRentals has pickup options near COK Airport (Nedumbassery). Pre-booked cabs are recommended as taxi queues can be long. Airport to Ernakulam starts from ₹700.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller from Kochi to Munnar?', a: 'AC 12-seater Tempo Traveller from Kochi to Munnar (130 km, ~3.5 hrs) starts from ₹6,000 one-way. 2-day Munnar packages with return are very popular from Kochi.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Kochi do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Kochi localities — Ernakulam, Fort Kochi, Kakkanad, Edappally, Aluva, Thrikkakara, Kalamassery, Vyttila, Palarivattom, Panampilly Nagar, GCDA Colony, Palluruthy, Nettoor, Irumpanam, Mattancherry, and Marine Drive. Intercity moves to Bangalore, Hyderabad, Chennai, Thiruvananthapuram, and Thrissur are also available.' },
        { q: 'How do Kochi\'s island zones (Fort Kochi, Mattancherry) affect household moves?', a: 'Fort Kochi and Mattancherry are on a separate peninsula accessed via the Goshree Bridge or the High Court Bridge. Large trucks can cross via Goshree Road, but narrow heritage lanes near Fort Kochi beach and Jew Town Mattancherry restrict final access to Tata Ace mini trucks. TransRentals movers coordinate route-specific logistics for island moves — always inform about a Fort Kochi or Mattancherry location when booking.' },
        { q: 'What is the most common move corridor in Kochi — Kakkanad to Edappally?', a: 'The Kakkanad–Edappally corridor and the Aluva–Marine Drive route are Kochi\'s busiest move paths, driven by Infopark and SmartCity IT professionals relocating between the tech corridor and central Ernakulam. Kochi\'s dense traffic on NH66 and Seaport-Airport Road can extend transit times by 30–60 minutes during peak hours (8:30–10 AM and 5:30–8 PM).' },
        { q: 'How do movers handle Kochi\'s monsoon (June–August) season?', a: 'Kerala\'s intense southwest monsoon brings waterlogging to low-lying areas in Ernakulam, Edappally, and Kalamassery. TransRentals movers use waterproof wrapping and shrink film for all electronics, furniture, and mattresses. Schedule packing and loading before noon to beat afternoon downpours. For Fort Kochi and Mattancherry moves, avoid days with orange or red weather alerts — coastal winds add extra risk.' },
        { q: 'When is the best time to shift house in Kochi?', a: 'November–February (Kerala\'s winter) is ideal — dry, comfortable, and lower demand. October is Onam season — shorter but manageable. Avoid June–August (peak monsoon, flooding risk). March–May is peak government and IT transfer season. Mid-month weekday slots are consistently 15–20% cheaper than month-end.' },
        { q: 'How long does a 2BHK shift take within Kochi?', a: 'A standard 2BHK intra-Kochi shift takes 7–10 hours with a 3-person team. Short moves within mainland Ernakulam (Palarivattom to Panampilly Nagar) take 5–7 hours. Cross-zone moves (Kakkanad to Fort Kochi or Aluva to Vyttila) take 9–12 hours. Fort Kochi and Mattancherry island moves add an extra 45–60 minutes for vehicle routing via Goshree Bridge.' },
        { q: 'Can I move intercity from Kochi to Bangalore, Hyderabad, or Thiruvananthapuram?', a: 'Yes — Kochi to Bangalore (560 km via NH544, ~10 hrs truck), Kochi to Thiruvananthapuram (215 km via NH66, ~4 hrs), and Kochi to Chennai (690 km via NH544, ~12 hrs) are all available. Kochi to Hyderabad (1,100 km via NH544/NH44) is also covered. Get a free quote on TransRentals for full household intercity pricing with packing and transit insurance.' },
        { q: 'Do TransRentals movers serve Aluva, Thrikkakara, and Kalamassery areas?', a: 'Yes — Aluva, Thrikkakara, and Kalamassery are fully covered as part of Greater Kochi. These areas have good road access and fewer narrow-lane issues than Fort Kochi and Mattancherry. SmartCity Kochi (Kakkanad), Infopark (Kakkanad), and FACT industrial estate (Eloor) employees regularly book TransRentals movers for intra-city and intercity relocations.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Kochi?', a: 'A 12-seater AC Tempo Traveller in Kochi starts from ₹5,000+/day. A 20-seater mini bus for Munnar (130 km, ~3.5 hrs) starts from ₹9,000+/day. For Thekkady group tours (190 km, ~4.5 hrs), a Tempo Traveller starts from ₹10,000/day. Guruvayur pilgrimages (80 km, ~2 hrs) are available from ₹5,000/day.' },
        { q: 'Which bus routes are most popular from Kochi?', a: 'Kochi to Munnar (130 km, ~3.5 hrs via NH85) is the most popular group route — hill tourism buses for IT company outings and tourist groups are booked year-round. Kochi to Guruvayur (80 km, ~2 hrs) for the famous Krishna temple is the top pilgrimage group route. Kochi to Thekkady (190 km, ~4.5 hrs) for Periyar wildlife reserve is a popular 2-day group tour.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Kochi?', a: 'Yes, 20–50 seater AC buses are available for Kochi church weddings and IT corporate events. Infopark and SmartCity Kakkanad companies regularly book outing coaches to Munnar and Thekkady. Kerala\'s Christian community has big church weddings requiring fleet buses — book 3–4 weeks in advance for December–January wedding season. Decorated buses start from ₹18,000/day.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Kochi?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for port and chemical logistics are quoted per route. Vallarpadam Container Terminal and Kalamassery industrial estate are Kochi\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Kochi?', a: 'Kochi to Bangalore (560 km via NH544, ~10 hrs) is the busiest FTL corridor — carrying chemical products from Eloor industrial area, IT hardware from Kakkanad, and Kerala\'s agricultural exports. Kochi port (Vallarpadam) to Coimbatore (190 km, ~4 hrs) is the busiest short-haul port logistics route. LTL options are available for smaller consignments.' },
        { q: 'Which industrial areas in Kochi use truck rentals most?', a: 'Vallarpadam Container Terminal (port logistics, container freight), Kalamassery industrial area (chemicals, engineering, FACT fertilizers), and Eloor Udyogamandal (chemicals, pharma) are Kochi\'s top truck rental zones. TransRentals has verified vendors in all three industrial clusters serving Kerala\'s largest port-city logistics network.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Kochi per day?', a: 'Hatchback self-drive in Kochi starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 100–150 km; extra km at ₹12–15/km. Weekly packages and weekend coastal drive packages are popular.' },
        { q: 'Can I self-drive from Kochi to Alleppey for backwater tourism?', a: 'Yes, Kochi to Alleppey (55 km via NH66, ~1.5 hrs) is one of Kerala\'s easiest and most scenic drives — flat coastal road with excellent condition. Perfect for a self-drive day trip. Combine with a 2-hour houseboat ride on the Vembanad backwaters and return to Kochi by evening.' },
        { q: 'Is self-drive to Munnar safe from Kochi?', a: 'Kochi to Munnar (130 km via NH85, ~3.5 hrs) involves steep ghats for the last 50 km. Self-drive is possible for experienced drivers in an SUV. Avoid monsoon ghat drives (June–August) when roads are slippery. Start early — Munnar town sees heavy tourist traffic from 10 AM onwards on weekends.' },
        { q: 'Which areas in Kochi have self-drive car rental options?', a: 'Ernakulam, Kakkanad (Infopark area), Edappally, and near Cochin International Airport (COK) have self-drive vendors. Fort Kochi pickups are also available. Doorstep delivery across mainland Ernakulam zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Kochi?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). Kerala checkposts require vehicle documents — keep RC and insurance accessible. International tourists with valid IDP are accepted by most vendors.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Kochi?', a: 'Honda Activa and TVS Jupiter are ideal for Kochi daily commuting — manageable in MG Road and Kakkanad IT corridor traffic. Scooters are the easiest way to navigate Ernakulam\'s busy junctions and reach Fort Kochi\'s colonial lanes where cars face parking challenges.' },
        { q: 'Can I rent a Royal Enfield in Kochi for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Kochi for weekend rides. Munnar (130 km via NH85, ~3.5 hrs) is the most popular biker destination — winding tea estate roads through the Western Ghats. Starting from ₹1,000–₹1,200/day. Experienced ghat riders recommended.' },
        { q: 'What is the minimum rental period for bikes in Kochi?', a: '24-hour minimum is standard in Kochi. Some Ernakulam and Kakkanad vendors offer 4–8 hour packages for Infopark and SmartCity corridor commutes. Monthly rentals offer the best per-day rate — popular with IT professionals at Kakkanad.' },
        { q: 'Are electric scooters available on rent in Kochi?', a: 'Yes, electric scooters are available in Kochi and growing fast in Kerala\'s EV-friendly environment. Ideal for the flat Kakkanad-Edappally IT corridor. Kochi Metro feeder connectivity combined with an e-scooter makes for an eco-friendly daily commute.' },
        { q: 'What documents are needed to rent a bike in Kochi?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Kerala police checkposts are active on NH66 — always carry DL and vehicle documents. International tourists with IDP accepted at most vendors.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Kochi?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Kochi Metro Phase 2 construction, Vallarpadam International Container Terminal expansion, INFOPARK Phases 3 and 4, and Smart City Kochi projects generate consistent equipment demand.' },
        { q: 'What are the biggest equipment rental demand drivers in Kochi?', a: 'Vallarpadam International Container Transshipment Terminal\'s ongoing port expansion is the region\'s largest source of heavy crane and marine construction equipment demand. INFOPARK Kochi\'s IT campus Phase 3 construction adds high-rise concrete equipment demand. Kochi Metro Phase 2 viaduct and station construction sustains piling rig and launching gantry requirements, making Kochi one of South India\'s most active equipment rental markets per square kilometre.' },
        { q: 'How do I book construction equipment for my project in Kochi?', a: 'Kochi\'s Metro Phase 2 underground sections, Vallarpadam port expansion, and INFOPARK IT campus development in Kakkanad are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near metro work or port-side Vallarpadam projects, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Kochi?', a: 'JCB 3DX backhoe loader rental in Kochi starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Kochi?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Greater Kochi. Active construction zones include Kochi Metro Phase 2 tunneling, Vallarpadam container port berth expansion, INFOPARK Phase 3 and SmartCity Kochi campus, and land reclamation for coastal residential projects near Edappally.' },
        { q: 'Does Kochi\'s high water table affect JCB hiring?', a: 'Yes — Kochi\'s proximity to the Ernakulam backwaters and Vyttila canal means the water table is very high across most of the city, often just 1.0–1.5 m below surface. Any excavation deeper than 2–3 m almost certainly requires continuous dewatering, and JCBs deployed near marine or canal-adjacent sites will need a pump running alongside throughout the shift. Always confirm dewatering pump availability with the vendor before booking for Ernakulam, Marine Drive, Vyttila, or Kakkanad waterfront sites.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Kochi?', a: 'Ernakulam wholesale market (Broadway and Jew Town area) generates steady Tata Ace demand for distributing consumer goods, household items, and imported products to retailers across the city. LULU Hypermarket\'s supplier network uses mini trucks for daily restocking runs from warehouse zones in Edapally and Kalamasserry. Mattancherry and Fort Kochi\'s spice, coconut oil, and dry fish trade relies on mini trucks for movement between godowns, the Cochin Port, and wholesale buyers.' },
        { q: 'Can I rent a mini truck for house shifting in Kochi?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Kochi. Common routes: Ernakulam to Kakkanad, Fort Kochi to Edappally, and intra-Aluva moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Kochi?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Ernakulam wholesale market deliveries, LULU Mall supplier runs, and Kerala spice and coconut trade dispatches from Ernakulam to processing units are the most common mini truck use cases in Kochi.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Mysore, the City of Palaces, is one of India's most visited tourist destinations — Mysore Palace draws 6+ million visitors annually. Car rentals for the palace-Chamundi Hills-Brindavan Gardens circuit and outstation trips to Coorg, Ooty, and Bangalore are in constant demand. TransRentals has verified vendors covering all Mysore zones including Vijayanagar, Saraswathipuram, and the airport area.",
      'bike-on-rent':
        "Mysore's heritage lanes, university culture, and proximity to Coorg make it a vibrant bike rental market. Activa and Jupiter are popular for the Mysore Palace-Devaraja Market circuit. Royal Enfield Classic 350 and Himalayan are top picks for Coorg coffee estate rides. TransRentals has bike rentals across Mysore city.",
      'bus-rental':
        "Mysore's heritage tourism, corporate events at MUDA areas, and pilgrimages to Melkote, Srirangapatna, and Dharmasthala drive bus demand. Dasara season (September–October) creates massive group tour bus demand. TransRentals offers AC Tempo Travellers and buses for pilgrimages, tourist groups, and corporate outings from Mysore.",
      'packers-and-movers':
        "Mysore's growing IT sector — anchored by the massive Infosys campus on Mysore Road and KSIDC Hebbal industrial area — has transformed it from a pure heritage city into a dynamic relocation market. Infosys Mysore employee relocations from Bangalore and Chennai are the largest private sector driver. Common intra-city corridors: Vijayanagar to Saraswathipuram, Kuvempunagar to Hebbal, Jayanagar to Nazarbad, and Srirampura to Bannimantap. Government transfers — Karnataka civil services, Mysore District administration, and University of Mysore faculty — peak March–June. Key intercity moves: Mysore to Bangalore (150 km via NH275), Mysore to Coorg (115 km), Mysore to Chennai (490 km), and Mysore to Hyderabad (640 km). Dasara season (September–October) sees peak short-distance household moves as families settle before the festival. Devaraja Market and old-city bazaar areas near Nazarbad and Mandi Mohalla require Tata Ace for narrow-lane packing. New residential growth in Hootagalli, Nanjangud Road, and N R Mohalla is expanding Mysore's relocation geography. TransRentals covers all Mysore zones — including JP Nagar, Yadavagiri, Chamundi Vihar, Lakshmipuram, and Metagalli — with verified, insured movers.",
      'transporter':
        "Mysore's silk industry (Chamrajnagar), incense manufacturing, and agri-produce from surrounding districts generate commercial transport demand. Infosys campus supply chain and SIDCO industrial estate logistics are key users. TransRentals offers mini trucks to container vehicles from Mysore for local and intercity goods movement.",
      'jcb-on-rent':
        "Mysore's peripheral ring road development, Hebbal industrial area expansion, and new residential projects in Vijayanagar 4th Stage and Nanjangud Road zones require JCB and excavator services. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Mysore district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Mysore's Devaraja Market deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Mysore city.",
      'tempo-traveller':
        "Mysore is a key departure point for group tours to Coorg, Ooty, Wayanad, and Hassan-Belur. Dasara season sees massive tempo traveller demand for palace and temple visits. TransRentals offers AC 12–17 seater Tempo Travellers from Mysore for tourist groups, pilgrimages, and corporate outings.",
      'outstation-car-rental':
        "Outstation cabs from Mysore cover Coorg (115 km), Ooty (125 km), Wayanad (120 km), Bangalore (150 km), and Hassan-Belur (120 km). Hill-experienced drivers for Coorg, Ooty, and Wayanad ghat routes. TransRentals per-km pricing — book online for instant confirmation.",
      'one-way-car-rental':
        "Mysore's top one-way routes: Mysore to Bangalore (150 km), Mysore to Coorg (115 km), Mysore to Ooty (125 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Mysore Airport (MYQ) is 10 km from Vijayanagar. TransRentals airport transfers cover Mysore city and nearby areas. Airport to city center starting from ₹350 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Mysore is one of South India's best self-drive base cities with the iconic Mysore-Bangalore Expressway (NH275), scenic Coorg road (SH17), and the Ooty-Bandipur wildlife corridor. Mysore to Coorg (120 km via SH17) and Mysore to Wayanad (115 km via Gundlupet Road) are the most popular self-drive weekend routes. The Mysore-Bangalore Expressway is Karnataka's finest highway — easy 150 km self-drive. TransRentals lists verified self-drive vendors in Vijayanagar, Saraswathipuram, and near Mysore Airport. Compact SUVs are ideal for Coorg plantation roads.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for a Mysore to Coorg trip?', a: 'An SUV (Innova, XL6, or Ertiga) is recommended for Coorg — some plantation and homestay roads require decent ground clearance. The route via Hunsur is smooth but the final stretch can be narrow.' },
        { q: 'How do I book a cab for Mysore Palace heritage tour?', a: 'Book a full-day cab (8 hrs/80 km) with TransRentals for the Mysore heritage circuit — Mysore Palace, Chamundi Hills, Brindavan Gardens, and Srirangapatna. Sedans are adequate for city sightseeing.' },
        { q: 'What is the best time to visit Mysore and how to get around?', a: 'Dasara season (October) is peak time — book vehicles 2–3 weeks in advance. Year-round, a half-day car rental is ideal for covering the main attractions.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Mysore do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Mysore localities — Vijayanagar, Saraswathipuram, Kuvempunagar, Hebbal, Jayanagar, Nazarbad, Srirampura, Bannimantap, JP Nagar, Yadavagiri, Chamundi Vihar, Lakshmipuram, Metagalli, Hootagalli, N R Mohalla, and Nanjangud Road. Intercity moves to Bangalore, Chennai, Hyderabad, Coorg, and Ooty are also available.' },
        { q: 'Why does Mysore see strong relocation demand driven by Infosys?', a: 'Infosys Mysore campus on the Mysore-Bangalore NH275 is one of the largest corporate training campuses in the world — new employees from Bangalore, Hyderabad, and Chennai often relocate for extended training assignments of 6 months to 2 years. This creates consistent demand for fully-furnished moves with storage options. KSIDC Hebbal and other IT companies add to the private sector relocation base.' },
        { q: 'What is the most common move corridor in Mysore — Vijayanagar to Saraswathipuram?', a: 'The Vijayanagar–Saraswathipuram and Kuvempunagar–Hebbal corridors are Mysore\'s most active intra-city move routes. Infosys employees often move from central areas (Jayanagar, Kuvempunagar) to Hebbal or Nanjangud Road to be closer to the campus. Mysore\'s compact size means cross-city transit rarely exceeds 30–45 minutes.' },
        { q: 'How do movers handle narrow lanes near Devaraja Market and old-city Mysore?', a: 'The Devaraja Market area, Mandi Mohalla, and Nazarbad old-bazaar zones have lanes of 10–15 feet restricting large truck access. TransRentals movers use Tata Ace mini trucks for the final stretch in these areas, parking the main vehicle on the nearest main road (Chamaraja Double Road or Irwin Road). Always mention old-city location at booking.' },
        { q: 'Does the Dasara season affect moving schedules in Mysore?', a: 'Yes — Dasara (September–October) is Mysore\'s biggest festival with lakhs of tourists descending on the city. On Vijayadashami procession day, Mysore Palace Road, JLN Road, and KR Circle are closed or severely congested. Moving on this day is extremely difficult in central areas. TransRentals movers typically complete all loading before 8 AM on procession day.' },
        { q: 'When is the best time to shift house in Mysore?', a: 'January–March and October–November (post-Dasara) are ideal windows. Avoid September–October (Dasara peak tourist season, high vehicle demand). April–June is Karnataka government transfer season — book in advance. Monsoon (June–August) is manageable — Mysore has better drainage than many Karnataka cities.' },
        { q: 'How long does a 2BHK shift take within Mysore?', a: 'A standard 2BHK intra-Mysore shift takes 5–8 hours with a 3-person team. Mysore\'s compact size (15–20 km diameter) means transit is fast — typically under 40 minutes even for cross-city moves. Same-zone moves (Vijayanagar 4th Stage to 1st Stage) take 4–5 hours. The longest moves (Hootagalli to Yadavagiri) rarely exceed 7–8 hours.' },
        { q: 'Can I move intercity from Mysore to Bangalore, Chennai, or Hyderabad?', a: 'Yes — Mysore to Bangalore (150 km via NH275, ~3 hrs) is the most common and shortest intercity move — one of Karnataka\'s finest highways. Mysore to Chennai (490 km via NH948/NH44, ~9 hrs) and Mysore to Hyderabad (640 km via NH44, ~11 hrs) are also available. Coorg (115 km) and Ooty (125 km) moves need specialist drivers for hill ghat access.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Mysore?', a: 'A 12-seater AC Tempo Traveller in Mysore starts from ₹5,000+/day. A 20-seater mini bus for Coorg (120 km, ~3 hrs via Hunsur) starts from ₹8,000+/day. For Ooty group tours (130 km, ~3.5 hrs via Bandipur), a Tempo Traveller starts from ₹7,000/day. Belur-Halebidu heritage circuit (155 km, ~3.5 hrs via Hassan) starts from ₹8,000/day.' },
        { q: 'Which bus routes are most popular from Mysore?', a: 'Mysore to Coorg (120 km, ~3 hrs via Hunsur Road) is the most popular group route — coffee plantation tours and homestay trips for IT groups and tourist parties are booked year-round. Mysore to Ooty (130 km, ~3.5 hrs via Bandipur) is a popular hill group tour route. Mysore to Belur-Halebidu (155 km, ~3.5 hrs via Hassan Road) is the top heritage group circuit from Mysore.' },
        { q: 'Can I hire a bus for Mysore Dasara celebrations or a wedding?', a: 'Yes, 20–50 seater AC buses are available for Dasara group tours and Mysore weddings. Infosys Mysore campus organizes massive employee outings during Dasara season (September–October) — book 4–6 weeks in advance. Heritage hotel weddings in Mysore\'s palace circuit require fleet buses. Decorated baraat buses start from ₹15,000/day. Demand is highest during the Dasara festival period.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Mysore?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for silk and agri-produce are quoted per route. Nanjangud industrial area (27 km from Mysore) is Karnataka\'s second-largest industrial estate and drives significant commercial transport demand.' },
        { q: 'What is the top goods transport route from Mysore?', a: 'Mysore to Bangalore (150 km via NH275, ~3 hrs) is the busiest and fastest FTL corridor — NH275 is Karnataka\'s finest highway and allows same-day delivery. The route carries Mysore silk, sandalwood products, and Chamrajnagar garments to Bangalore for export. Mysore to Chennai (490 km via NH948/NH44) is the second most active long-haul route.' },
        { q: 'Which industrial areas in Mysore use truck rentals most?', a: 'Nanjangud industrial estate (pharma — Cipla, bio-tech units), Hebbal industrial area (engineering, auto components), and KSIDC industrial zone near Bannimantap are Mysore\'s top truck rental clusters. Chamrajnagar silk industry (45 km) and Mandya sugar belt also generate seasonal truck demand through Mysore. TransRentals has verified vendors across all zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Mysore per day?', a: 'Hatchback self-drive in Mysore starts from ₹699/day. Sedans start from ₹899/day. SUVs (Creta, XUV300) start from ₹1,299/day. Packages include 100–150 km; extra km at ₹10–14/km. Day packages for Coorg and Ooty with higher km limits are available.' },
        { q: 'Is the Mysore to Coorg self-drive route recommended?', a: 'Yes, Mysore to Coorg (120 km via Hunsur road or SH17, ~3 hrs) is one of South India\'s most scenic drives — coffee estates, misty hills, and winding roads. An SUV is recommended for homestay and plantation approach roads. Monsoon (June–September) makes the route especially beautiful but requires careful driving on slippery curves.' },
        { q: 'Can I self-drive from Mysore to Ooty through Bandipur?', a: 'Yes, Mysore to Ooty (125 km via Bandipur-Gudalore Road, ~3.5 hrs) passes through Bandipur Tiger Reserve. Keep car windows closed and drive at 40 km/h through the reserve. The reserve road closes between sunset and sunrise for private vehicles. Plan your departure to cross Bandipur before 6 PM.' },
        { q: 'Which areas in Mysore have self-drive car rental options?', a: 'Vijayanagar, Saraswathipuram, Kuvempunagar, and near Mysore Airport (MYQ) have self-drive vendors. Doorstep delivery across Mysore city with 24 hours\' advance booking. Infosys campus zone pickups available.' },
        { q: 'What documents are required for self-drive in Mysore?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). Karnataka checkposts require vehicle documents. Some vendors have restrictions on travel through wildlife sanctuary areas — confirm Bandipur permission when booking.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Mysore?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local city trips. Coorg/Madikeri (120 km, ₹5,000 one-way 12-seater) and Ooty (130 km via Bandipur) are top outstation routes. Belur-Halebidu heritage circuit (155 km) group tour starts from ₹7,000.' },
        { q: 'Can I book a Tempo Traveller from Mysore to Coorg for a group trip?', a: 'Yes, Mysore to Coorg/Madikeri (120 km via Hunsur Road, ~3 hrs) is Mysore\'s most popular Tempo Traveller group route. A 12-seater one-way starts from ₹5,000. Infosys Mysore campus teams and tourist groups book this year-round for coffee estate and homestay trips.' },
        { q: 'How many people can a Tempo Traveller carry in Mysore?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Coorg and Ooty trips. The 14 and 17-seater are preferred for Mysore Palace area heritage tours and large pilgrim groups heading to Belur-Halebidu (155 km). AC is standard for all outstation bookings.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Mysore?', a: 'Honda Activa and TVS Jupiter are ideal for Mysore daily commuting — great for Palace area sightseeing lanes, JP Nagar market roads, and the Infosys campus Hebbal corridor. Mysore\'s compact size (15–20 km diameter) and well-maintained roads make it one of Karnataka\'s best cities for two-wheelers.' },
        { q: 'Can I rent a Royal Enfield in Mysore for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Mysore for weekend rides. Coorg (120 km via Hunsur Road, ~3 hrs) is the classic Mysore biker destination through Karnataka\'s coffee hills. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Mysore?', a: '24-hour minimum is standard in Mysore. Some Vijayanagar and Kuvempunagar vendors offer 4–8 hour packages for Palace heritage sightseeing. Monthly rentals offer the best per-day rate — popular with Infosys Mysore campus trainees.' },
        { q: 'Are electric scooters available on rent in Mysore?', a: 'Yes, electric scooters are growing in Mysore under Karnataka\'s EV policy. Mysore\'s flat terrain and clean roads make it ideal for e-scooter use. Good option for the Vijayanagar–Hebbal corridor and Infosys campus access roads where traffic is moderate.' },
        { q: 'What documents are needed to rent a bike in Mysore?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Karnataka checkposts are active on highways — always carry DL. Note: Bandipur wildlife sanctuary road requires vehicle RC if you plan to ride through the reserve.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Mysore?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Mysuru Ring Road development, KIADB industrial area expansion, Mysore Film City construction, and city road widening projects generate steady equipment demand.' },
        { q: 'What types of construction work drive equipment rental demand in Mysuru?', a: 'Mysuru Ring Road construction and KIADB industrial estate expansion in Nanjangud (home to Jubilant, TVS, and other large plants) are the primary equipment demand sources. Heritage restoration work ahead of Dasara season occasionally requires specialised compact cranes and cherry pickers for façade and roof work on old palaces and heritage buildings — full-size equipment is prohibited near these structures. NIMHANS extension and JSS Hospital expansion also generate regular concrete equipment demand.' },
        { q: 'How do I book construction equipment for my project in Mysore?', a: 'Mysore\'s Ring Road expansion, KIADB industrial zone development, and city road widening across Vijayanagar and Hebbal are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near Film City or industrial estate work, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Mysore?', a: 'JCB 3DX backhoe loader rental in Mysore starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Mysore?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Mysore. Active construction zones include Mysuru Ring Road earthworks, KIADB Hebbal industrial area expansion, Mysore Film City infrastructure, and city road widening between Vijayanagar and Nazarbad quarters.' },
        { q: 'Are there JCB restrictions near Mysuru heritage zones?', a: 'ASI-protected heritage zones in Mysuru — including the Palace area, Chamundi Hill base, and St Philomena\'s Church surroundings — require an ASI archaeological NOC before any ground-breaking work is permitted. In these zones, compact mini excavators (1.5–2 tonne) are strongly preferred over full-size JCBs to minimise vibration risk to heritage structures. Always verify your site\'s distance from ASI-protected boundaries and obtain the NOC at least 14 days before work is scheduled.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Mysuru?', a: 'Devaraja Market wholesale — Mysuru\'s main hub for flowers, vegetables, silk garments, and sandalwood products — generates the highest volume of mini truck trips within the city. Silk weaving units on the Chamundipuram and T Narasipur Road belt use Tata Ace pickups to deliver silk sarees and fabric to showrooms in the city centre and Bangalore-bound consignments. Agarbatti (incense stick) manufacturing factories in the T Narasipur Road industrial belt also use mini trucks daily for raw material and finished goods movement.' },
        { q: 'Can I rent a mini truck for house shifting in Mysore?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Mysore. Common routes: Vijayanagar to Saraswathipuram, Hebbal to Nazarbad, and intra-JP Nagar Mysore moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Mysore?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Devaraja Market wholesale deliveries, Mysore silk saree weaving unit dispatches to retail stores, and agarbatti factory supply runs in the city\'s industrial pockets are the most common mini truck use cases in Mysore.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Guwahati, the gateway to Northeast India, is the logistics and tourism hub for all seven sister states. Car rentals serve Kaziranga safaris (195 km), Shillong day trips (100 km), and Meghalaya-Assam-Arunachal Pradesh multi-day circuits. SUVs dominate due to Northeast road conditions. TransRentals has verified Guwahati vendors covering Pan Bazaar, Fancy Bazaar, Beltola, and the Lokpriya Bordoloi Airport zone.",
      'bike-on-rent':
        "Guwahati's flat city core and expanding university zones drive daily bike rental demand. Activa and Jupiter are most popular for city commuting. Royal Enfield Himalayan is the top choice for Northeast adventure riders heading toward Cherrapunji, Tawang, or Dzukou Valley. TransRentals has bike rentals available across Guwahati.",
      'bus-rental':
        "Guwahati's Kamakhya temple circuit, Ambubachi Mela pilgrimages, and corporate team outings to Shillong and Cherrapunji drive bus demand. FMCG company regional conferences and tourism board group tours use 20–35 seater buses regularly. TransRentals offers AC Tempo Travellers and buses for group travel across Guwahati and Northeast routes.",
      'packers-and-movers':
        "Guwahati's FMCG, telecom, and government sector generate regular relocation demand. Moves between Beltola, Lokhra, and Ganeshguri are most common. Intercity transfers to Shillong and Siliguri also occur frequently. TransRentals connects with insured movers across Guwahati and surrounding districts.",
      'transporter':
        "Guwahati is the sole road entry point for the Northeast — virtually all goods for the 7 sister states transit through Guwahati via NH27 and NH17. Commercial transport demand is extremely high. TransRentals offers verified transporters with mini trucks to heavy vehicles for intra-city delivery and Northeast intercity freight from Guwahati.",
      'jcb-on-rent':
        "Guwahati's Smart City mission, Lokhra-Beltola IT park development, and rapid residential expansion in Kahilipara and Beltola drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction and infrastructure projects across Guwahati district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Guwahati's Fancy Bazaar market deliveries and household shifting across city zones. TransRentals has mini-truck bookings with verified drivers across Guwahati city.",
      'tempo-traveller':
        "Guwahati is the top Northeast tempo traveller hub. Shillong (100 km), Kaziranga (195 km), and Cherrapunji (190 km) are the most booked group routes. Ambubachi Mela (June) creates massive pilgrimage group demand. TransRentals offers AC 12–17 seater Tempo Travellers from Guwahati with drivers experienced on Northeast mountain roads.",
      'outstation-car-rental':
        "Outstation cabs from Guwahati cover Shillong (100 km), Kaziranga (195 km), Cherrapunji (190 km), Tezpur (183 km), and Hajo (35 km). SUVs strongly recommended for all Northeast routes. TransRentals per-km pricing with drivers experienced on NH27 and Meghalaya mountain roads.",
      'one-way-car-rental':
        "Guwahati's top one-way routes: Guwahati to Shillong (100 km), Guwahati to Kaziranga (195 km), Guwahati to Siliguri (420 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Lokpriya Gopinath Bordoloi Airport (GAU) is 23 km from Pan Bazaar. TransRentals airport transfers cover Pan Bazaar, Beltola, and Lokhra zones. Airport to city center starting from ₹600 for a sedan. 24/7 service, no surge.",
      'self-drive-car-rentals':
        "Guwahati is the gateway to Northeast India, making it a unique self-drive base for exploring Meghalaya, Assam, and beyond. Shillong (100 km via NH6, ~2.5 hrs) is the most popular self-drive destination — NH6 has sharp curves requiring experienced driving. Kaziranga (195 km via NH37, ~4 hrs) is a must-do self-drive safari day trip. TransRentals lists verified self-drive vendors in Pan Bazaar, Beltola, and Ganeshguri. SUVs are strongly recommended for all Northeast routes — roads outside NH stretches can be narrow and rough. Night drives on rural Northeast roads are not recommended.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Which car is best for Guwahati to Shillong road trip?', a: 'An SUV (Innova, Ertiga, or Scorpio) is strongly recommended for Shillong. NH6 has some sharp curves and the final approach to Shillong involves steep ghat sections.' },
        { q: 'Can I take a rental car from Guwahati to Kaziranga?', a: 'Yes, Guwahati to Kaziranga (195 km via NH15, ~4 hrs) is the most popular outstation route. Book an SUV for the safari approach roads. Kaziranga safari season: Nov–April.' },
        { q: 'Is 4WD required for trips from Guwahati to Arunachal Pradesh?', a: 'For destinations like Tawang and remote Arunachal areas, 4WD SUVs are required. For Bhalukpong (135 km), a regular SUV suffices. Always check seasonal road conditions.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Guwahati do TransRentals movers cover?', a: 'TransRentals-verified movers cover Guwahati\'s main zones — Pan Bazaar, Fancy Bazaar, Beltola, Lokhra, Ganeshguri, Panbazar, Six Mile, Narengi, Dispur, Kahilipara, RG Baruah Road, Bhangagarh, Noonmati, Maligaon, Panikhaiti, and the Lokpriya Bordoloi Airport area. Intercity moves to Shillong, Siliguri, Dibrugarh, and Agartala are also available.' },
        { q: 'What is the most common move corridor in Guwahati — Beltola to Ganeshguri?', a: 'The Beltola–Ganeshguri corridor and the Lokhra–Dispur route are Guwahati\'s most active move paths, driven by government employees and FMCG/telecom professionals. Newer residential expansion in Narengi and Panikhaiti is pulling middle-class families from older Pan Bazaar and Fancy Bazaar zones. NH27 and the Narengi highway extension are the main transit arteries — peak-hour traffic adds 30–45 minutes to cross-city moves.' },
        { q: 'How does Guwahati\'s monsoon flood season affect household shifting?', a: 'Guwahati\'s intense monsoon (June–September, India\'s highest rainfall zone) causes regular flash flooding in low-lying areas — Chandmari, Ulubari, and parts of Pan Bazaar can be inaccessible by truck for 24–48 hours after heavy rains. TransRentals movers monitor weather forecasts and reschedule proactively. If a monsoon move is unavoidable, schedule for June or September — peak July–August has the worst waterlogging.' },
        { q: 'Can I move intercity from Guwahati to Shillong, Siliguri, or other Northeast cities?', a: 'Yes — Guwahati to Shillong (100 km via NH6, ~2.5 hrs) and Guwahati to Siliguri (420 km via NH27, ~8 hrs) are the most common intercity routes. Guwahati to Dibrugarh (440 km via NH27/NH715, ~8 hrs) is also available. Moves to hill state capitals like Shillong (Meghalaya) require additional vehicle permits — TransRentals movers handle the Northeast interstate permit process.' },
        { q: 'Do movers in Guwahati handle moves to Meghalaya and other Northeast states?', a: 'Yes, though interstate Northeast moves need additional logistics. Moves to Shillong, Tura, and other Meghalaya towns require restricted area permits for transporters. TransRentals connected movers are experienced with Northeast interstate paperwork. Meghalaya road conditions after heavy Cherrapunji-area rainfall can delay truck transit by 1–2 days during monsoon — factor this in when planning.' },
        { q: 'When is the best time to shift house in Guwahati?', a: 'November–April is ideal — dry and cool. Avoid June–September (intense monsoon, flooding, road closures). The Ambubachi Mela at Kamakhya (June) brings massive pilgrimage traffic affecting city roads for 4–5 days. Bihu season (April, October) sees short-notice intra-city moves as families want to settle before the festival.' },
        { q: 'How long does a 2BHK shift take within Guwahati?', a: 'A standard 2BHK intra-Guwahati shift takes 7–10 hours with a 3-person team. Traffic on GS Road (NH27 urban stretch) and the Uzanbazar area is the main delay factor during 9–11 AM and 5–8 PM. Short moves within Beltola or Ganeshguri take 5–7 hours. Cross-city moves (Pan Bazaar to Narengi or Lokhra to Six Mile) can take 10–12 hours in peak traffic.' },
        { q: 'How far in advance should I book movers in Guwahati?', a: 'Book at least 5–7 days in advance for standard moves, and 10–14 days for intercity Northeast moves. Guwahati has fewer verified movers per capita than tier 1 cities — peak-season availability (April–May government transfers, October Durga Puja) can be tight. TransRentals pre-screens all Guwahati movers for license, insurance, and past performance records.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Guwahati?', a: 'A 12-seater AC Tempo Traveller in Guwahati starts from ₹5,000+/day. A 20-seater mini bus for Shillong (100 km, ~2.5 hrs) starts from ₹7,500+/day. For Kaziranga safari trips (215 km, ~4 hrs), a 12-seater Tempo Traveller starts from ₹9,000/day. Tawang group tours (460 km, ~10+ hrs) require overnight buses from ₹30,000+/day.' },
        { q: 'Which bus routes are most popular from Guwahati?', a: 'Guwahati to Shillong (100 km, ~2.5 hrs via NH6) is the most popular group route — Meghalaya day tours and weekend trips for corporate groups and tourists are booked year-round. Guwahati to Kaziranga (215 km, ~4 hrs via NH15) for rhino safaris is the top wildlife group route. Guwahati to Tawang (460 km, ~10 hrs) is increasingly popular for Northeast Buddhist circuit tours.' },
        { q: 'Can I hire a bus for Kamakhya Mela or a wedding in Guwahati?', a: 'Yes, 20–50 seater AC buses are available for Kamakhya Ambubachi Mela pilgrimages and Assamese weddings. Ambubachi Mela (June) sees massive demand for group darshan transport — book 4–6 weeks in advance. FMCG and telecom company regional conferences book buses regularly. Bihu celebration event buses are in demand during April and October. Decorated baraat buses start from ₹15,000/day.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Guwahati?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for Northeast distribution are quoted per route. Guwahati is the sole road entry point for all seven Northeast states — commercial transport demand is among the highest in India per city size.' },
        { q: 'What is the top goods transport route from Guwahati?', a: 'Guwahati to Dibrugarh (440 km via NH27/NH715, ~8 hrs) is the main FTL corridor within Assam — carrying tea, oil, and FMCG products. Guwahati to Shillong (100 km, ~2.5 hrs) is the busiest short-haul Northeast interstate route. Guwahati to Siliguri (420 km via NH27, ~8 hrs) connects the Northeast supply chain to the rest of India.' },
        { q: 'Which industrial areas in Guwahati use truck rentals most?', a: 'Amingaon industrial estate (FMCG, plastics, chemicals), Basistha industrial area (food processing, paper), and INA Colony/Chandrapur area (distribution, wholesale) are Guwahati\'s top truck rental zones. Numaligarh Refinery supply chain and Assam Tea Board logistics also drive significant Guwahati-based commercial transport. TransRentals has verified vendors across all zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Guwahati per day?', a: 'Hatchback self-drive in Guwahati starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Scorpio, Creta) start from ₹1,599/day. Packages include 100–150 km; extra km at ₹12–15/km. SUVs are the recommended category for all Northeast routes.' },
        { q: 'Can I self-drive from Guwahati to Shillong?', a: 'Yes, Guwahati to Shillong (100 km via NH6, ~2.5 hrs) is possible for experienced drivers. NH6 has sharp curves and the final ghat section requires careful driving. Avoid the route in heavy rain or fog. Confirm that your rental vendor has permissions for travel into Meghalaya (interstate permit may be needed).' },
        { q: 'Is self-drive to Kaziranga from Guwahati safe?', a: 'Yes, Guwahati to Kaziranga (195 km via NH37, ~4 hrs) is a straightforward highway drive. NH37 is well-maintained. The safari inside the park uses forest department jeeps — your rental car parks at Kohora. Safari season is November–April; roads during monsoon can flood near Kaziranga.' },
        { q: 'Which areas in Guwahati have self-drive car rental options?', a: 'Pan Bazaar, Beltola, Ganeshguri, and near Lokpriya Bordoloi Airport (GAU) have self-drive vendor availability. Book at least 48 hours in advance for Guwahati pickups as vendor density is lower than larger metros.' },
        { q: 'What documents are required for self-drive in Guwahati?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹5,000). For travel into Meghalaya, Nagaland, or Arunachal Pradesh — interstate permits and Inner Line Permits (ILP) may be required. Confirm requirements with your vendor before booking.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Guwahati?', a: '12-seater AC Tempo Traveller starting from ₹5,000/day for local trips. Shillong (100 km, ₹5,500 one-way 12-seater via NH6) is the most popular outstation route. Kaziranga (215 km, ~4 hrs) safari group tour starts from ₹10,000. Manas National Park (175 km) wildlife trip starts from ₹9,000.' },
        { q: 'Can I book a Tempo Traveller from Guwahati to Shillong?', a: 'Yes, Guwahati to Shillong (100 km via NH6, ~2.5 hrs) is Guwahati\'s most popular Tempo Traveller route. A 12-seater one-way starts from ₹5,500. An experienced hill driver is always provided for the sharp curves and ghat section approaching Shillong. Group bookings are available for corporate Meghalaya day tours.' },
        { q: 'How many people can a Tempo Traveller carry in Guwahati?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Shillong day trips and Kaziranga safari tours. The 17-seater suits corporate conference groups from FMCG and telecom companies doing team outings. SUV-based tempo travellers are preferred for Northeast mountain routes.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Guwahati?', a: 'Honda Activa and TVS Jupiter are ideal for Guwahati daily commuting — perfect for Paltan Bazaar and Fancy Bazaar\'s busy lanes, and the GS Road (NH27 urban stretch) feeder roads. Scooters handle Guwahati\'s hilly terrain and varied road conditions better than most other two-wheelers.' },
        { q: 'Can I rent a Royal Enfield in Guwahati for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 and Himalayan are both popular in Guwahati for weekend rides. Shillong (100 km via NH6, ~2.5 hrs) is the most popular biker destination with scenic Meghalaya mountain roads. Starting from ₹1,000–₹1,200/day. Northeast roads vary — an Himalayan is better for rough sections.' },
        { q: 'What is the minimum rental period for bikes in Guwahati?', a: '24-hour minimum is standard in Guwahati. Some Pan Bazaar and Beltola vendors offer 4–8 hour packages for city use. Monthly rentals offer the best per-day rate — popular with FMCG and telecom professionals on GS Road.' },
        { q: 'Are electric scooters available on rent in Guwahati?', a: 'Electric scooters are slowly becoming available in Guwahati, primarily in newer areas like Narengi and Panikhaiti. The city\'s hilly terrain means e-scooters are best suited for flat GS Road stretches rather than steep residential areas. Availability is growing but still limited compared to metros.' },
        { q: 'What documents are needed to rent a bike in Guwahati?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. For rides into Meghalaya (Shillong), confirm interstate permit requirements with the vendor. Assam police checkposts are active — always carry your DL while riding.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Guwahati?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. The Bhoopanatham Brahmaputra bridge project, NH27 widening through Guwahati, GMDA city development projects, and Smart City Guwahati infrastructure generate consistent equipment demand as the Northeast\'s gateway hub.' },
        { q: 'What are the major equipment rental demand drivers in Guwahati?', a: 'Brahmaputra river embankment reinforcement work — a recurring annual project that peaks during monsoon season — is the city\'s most distinctive equipment use case, requiring long-reach excavators and stone pitching equipment. NH27 (East-West Corridor) widening and GMDA Smart City projects are the largest active road infrastructure users of graders, pavers, and compactors. Amingaon MIDC industrial estate expansion on the north bank is growing as a factory construction equipment demand centre.' },
        { q: 'How do I book construction equipment for my project in Guwahati?', a: 'Guwahati\'s Brahmaputra bridge corridor, NH27 expansion, and Smart City GMDA infrastructure projects are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near bridge construction or NH27 work zones, book 5–7 days ahead as Northeast logistics require extra lead time.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Guwahati?', a: 'JCB 3DX backhoe loader rental in Guwahati starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Guwahati?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Guwahati. Active construction zones include Bhoopanatham Brahmaputra bridge approach roads, NH27 widening earthworks through Lokhra-Beltola, GMDA Smart City road and drainage projects, and commercial real estate development in Guwahati\'s newer growth corridors.' },
        { q: 'What booking challenges are unique to JCB hire in Guwahati?', a: 'Monsoon season (June–September) is peak JCB demand in Guwahati due to Brahmaputra flood-repair and embankment work — machines can be booked out 2–3 weeks in advance during this period, so plan and book 7–10 days ahead. Sandy, loose riverbed soil near the Brahmaputra (Uzanbazar, Fancy Bazar waterfront) requires a wide-bucket attachment for efficient excavation; standard narrow buckets lose material in the loose sand. Confirm both bucket type and monsoon availability window when booking.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Guwahati?', a: 'Pan Bazar wholesale market — the largest general trade hub in Northeast India — is the primary driver of Tata Ace demand in Guwahati, with daily distribution runs to retailers across the city and to transshipment agents for the Northeast gateway corridor. Guwahati\'s role as the distribution hub for all seven sister states means mini trucks carry everything from FMCG goods to packaged food onward to Meghalaya, Nagaland, and Arunachal Pradesh border traders. Tea estate machinery, fertilisers, and garden supplies from the Assam tea belt (Jorhat, Dibrugarh) are also cleared and dispatched by mini trucks through Guwahati.' },
        { q: 'Can I rent a mini truck for house shifting in Guwahati?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Guwahati. Common routes: Pan Bazar to Beltola, Narengi to GS Road, and intra-Chandmari moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Guwahati?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Pan Bazar wholesale market deliveries, tea estate sample supply runs from Assam\'s tea gardens, and Northeast gateway goods redistribution across Guwahati\'s warehousing belt are the most common mini truck use cases in the city.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Amritsar's Golden Temple draws 1 lakh+ daily visitors — car rentals for the Golden Temple-Jallianwala Bagh-Wagah Border circuit are the most popular bookings. Innova and Ertiga dominate group travel. TransRentals has 40+ verified vendors covering Hall Bazaar, Ranjit Avenue, GT Road, and the Amritsar Airport zone.",
      'bike-on-rent':
        "Amritsar's pilgrimage lanes near the Golden Temple are ideal for scooters and motorbikes. Activa is the top city bike. Royal Enfield Classic 350 is popular for rides to Wagah Border, Pathankot, and Dharamshala. TransRentals has bike rentals across Amritsar city.",
      'bus-rental':
        "Amritsar's pilgrimage culture and Punjabi wedding season drive massive bus demand. Baraat buses, Golden Temple group darshan, and Wagah Border ceremony group visits are top bookings. Corporate team outings from Amritsar to Kasauli and Chandigarh are popular. TransRentals offers AC buses and Tempo Travellers across Amritsar.",
      'packers-and-movers':
        "Amritsar's growing commercial sector and NRI community drive relocation demand. Moves between Ranjit Avenue, Lawrence Road, and GT Road residential areas are most common. TransRentals connects with insured, verified movers across all Amritsar zones.",
      'transporter':
        "Amritsar's Focal Point industrial estate, border trade goods (via Wagah), and agricultural produce from Punjab's wheat belt generate commercial transport demand. TransRentals offers mini trucks to heavy vehicles for intra-city delivery and intercity freight from Amritsar.",
      'jcb-on-rent':
        "Amritsar's smart city infrastructure projects, Ranjit Avenue expansion, and new residential development along Bypass Road drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Amritsar.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Amritsar's Hall Bazaar market deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Amritsar city.",
      'tempo-traveller':
        "Amritsar's Golden Temple pilgrimages attract massive group travel. Delhi-Amritsar group tours (450 km) and Chandigarh-Amritsar day trips (230 km) are top Tempo Traveller routes. Wagah Border ceremony group visits in the evening are very popular. TransRentals offers AC 12–17 seater Tempo Travellers from Amritsar.",
      'outstation-car-rental':
        "Outstation cabs from Amritsar cover Wagah Border (30 km), Chandigarh (230 km), Pathankot (110 km), Dalhousie (190 km), and Dharamshala (225 km). TransRentals per-km pricing with no hidden charges — book online for instant confirmation.",
      'one-way-car-rental':
        "Amritsar's top one-way routes: Amritsar to Delhi (450 km), Amritsar to Chandigarh (230 km), Amritsar to Dharamshala (225 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Sri Guru Ram Dass Jee Airport (ATQ) is 11 km from the city center. TransRentals airport transfers cover all Amritsar zones. Airport to Golden Temple starting from ₹400 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Punjab's wide and excellent highways make Amritsar one of North India's best self-drive cities. Wagah Border (30 km via GT Road, ~45 min) is an easy self-drive day trip. Dalhousie (190 km via Pathankot) and Pathankot (110 km via NH354) are popular hill getaways. NH44 to Chandigarh (230 km, ~4 hrs) and NH44 to Jammu (210 km) are excellent highway self-drives. TransRentals lists verified self-drive vendors across Ranjit Avenue, Lawrence Road, and near Amritsar Airport. Punjab's roads are among North India's best — ideal for outstation self-drive.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to visit Golden Temple, Wagah Border, and Jallianwala Bagh in one day?', a: 'Book a full-day cab (8 hrs/80 km) with TransRentals from Amritsar. Start with Golden Temple at 5 AM, Jallianwala Bagh by 9 AM, and reach Wagah Border by 4 PM for the flag ceremony.' },
        { q: 'What is the cab cost from Amritsar to Dharamshala?', a: 'One-way cab from Amritsar to Dharamshala/McLeod Ganj (225 km via NH154, ~4.5 hrs) starts from ₹2,000 for a sedan. A popular 2-day trip combining both destinations.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Amritsar do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Amritsar localities — Hall Bazaar, Ranjit Avenue, Lawrence Road, GT Road, Majitha Road, Batala Road, Sultanwind Road, Green Avenue, Chheharta, Jandiala Guru Road, Bypass Road, and the Sri Guru Ram Dass Jee Airport area. Intercity moves to Chandigarh, Delhi, Ludhiana, Jalandhar, and Pathankot are also available.' },
        { q: 'What is the most common move corridor in Amritsar?', a: 'The Ranjit Avenue–Lawrence Road corridor and the Hall Bazaar–Bypass Road route are Amritsar\'s most active move paths. Ranjit Avenue\'s modern residential colonies attract government officers and business families relocating from older Hall Bazaar and Ram Bagh areas. New developments on Bypass Road and Majitha Road are the fastest-growing destination zones for intra-city moves.' },
        { q: 'How do movers handle the narrow gali lanes near the Golden Temple and old city?', a: 'The Golden Temple vicinity — Hall Bazaar, Katra Jaimal Singh, Guru Bazar, and Hathi Gate lanes — has galis of 6–12 feet width. TransRentals movers deploy Tata Ace mini trucks for these areas, with the main vehicle parked at Bhandari Bridge or Kachehri Chowk. Gali-area moves take 1–2 hours longer than comparable township moves — always disclose your gali location at booking.' },
        { q: 'Do NRI families (UK/Canada) use Amritsar movers for returning home relocations?', a: 'Yes — Amritsar has one of India\'s largest NRI communities. Families returning permanently from the UK and Canada often bring international-standard furniture and imported appliances requiring specialized handling. TransRentals movers trained for NRI-return relocations provide white-glove handling, full unpacking, and furniture assembly. Book 2–3 weeks in advance for large NRI return moves.' },
        { q: 'When is the best time to shift house in Amritsar?', a: 'October–February is ideal — cool weather, lower tourist footfall, good road conditions. Avoid peak pilgrimage seasons (Baisakhi April 13–14, Guru Nanak Jayanti, major Gurpurabs) when city traffic is maximum and driver availability is low. March–May is Punjab government transfer season — book 10–14 days in advance.' },
        { q: 'How long does a 2BHK shift take within Amritsar?', a: 'A standard 2BHK intra-Amritsar shift takes 6–9 hours with a 3-person team. Township zone moves (Ranjit Avenue to Green Avenue or Lawrence Road to Bypass Road) are efficient at 5–7 hours. Old-city gali moves (Hall Bazaar or Golden Temple vicinity) add 2–3 hours for last-mile logistics. Cross-city moves spanning from Chheharta to Majitha Road can take 9–11 hours during peak traffic.' },
        { q: 'Can I move intercity from Amritsar to Delhi, Chandigarh, or Ludhiana?', a: 'Yes — Amritsar to Delhi (450 km via NH44, ~7 hrs) is the most common intercity route — NH44 is 6-lane and excellent. Amritsar to Chandigarh (230 km, ~4 hrs) and Amritsar to Ludhiana (80 km, ~1.5 hrs) are short intercity moves often completed same day. Amritsar to Jalandhar (80 km) and Pathankot (110 km) are also available.' },
        { q: 'Are movers available during Baisakhi and Gurpurab festivals in Amritsar?', a: 'Yes, movers are available on festival days. However, Baisakhi (April 13–14) and major Gurpurabs attract 2–5 lakh pilgrims to Amritsar, causing severe congestion on GT Road, Hall Bazar, and Golden Temple approach roads for 2–3 days. Schedule festival-period moves from Ranjit Avenue, Lawrence Road, or Bypass Road — avoid old-city pickups during peak Gurdwara procession timings.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Amritsar?', a: 'A 12-seater AC Tempo Traveller in Amritsar starts from ₹5,000+/day. A 20-seater mini bus for Anandpur Sahib (80 km, ~1.5 hrs) starts from ₹6,000+/day. For Chandigarh group trips (230 km, ~4 hrs), a Tempo Traveller starts from ₹8,000/day. Wagah Border ceremony group visits (30 km) are available in a Tempo Traveller from ₹3,500/day.' },
        { q: 'Which bus routes are most popular from Amritsar?', a: 'Amritsar to Wagah Border (30 km, ~45 min) for the evening flag lowering ceremony is the most popular same-day group trip — tourism groups of 12–40 are booked daily. Amritsar to Anandpur Sahib (80 km, ~1.5 hrs) for the Sikh heritage site is a key group pilgrimage route. Amritsar to Chandigarh (230 km, ~4 hrs via NH44) is the busiest intercity group route.' },
        { q: 'Can I hire a bus for a Baisakhi celebration or Punjabi wedding in Amritsar?', a: 'Yes, 20–50 seater AC buses are available for Baisakhi events and Punjabi weddings. Baisakhi (April 13–14) is Amritsar\'s biggest festival — group transport for Golden Temple celebrations is in massive demand. Punjabi weddings are known for grand baraat processions; decorated buses start from ₹20,000/day. Book 4–6 weeks in advance for Baisakhi and Gurpurab seasons.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Amritsar?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for agri-produce and handicrafts are quoted per route. Amritsar\'s Focal Point industrial estate and Attari border trade zone are the primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Amritsar?', a: 'Amritsar to Delhi (450 km via NH44, ~7 hrs) is the busiest FTL corridor — carrying agricultural produce (wheat, rice), Phulkari textiles, and border trade goods. Amritsar to Ludhiana (80 km, ~1.5 hrs) is the most active short-haul industrial route for hosiery and cycle parts. LTL options are widely available.' },
        { q: 'Which industrial areas in Amritsar use truck rentals most?', a: 'Focal Point industrial estate (textiles, food processing, pharma), Attari border zone (international trade, transit goods from Pakistan via Wagah), and Majitha Road industrial cluster (agri-processing, engineering) are Amritsar\'s top truck rental zones. TransRentals has verified vendors in all three clusters serving Punjab\'s agricultural and trade economy.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Amritsar per day?', a: 'Hatchback self-drive in Amritsar starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,499/day. Packages include 150–200 km; extra km at ₹12–15/km. Punjab\'s wide roads make self-drive very comfortable.' },
        { q: 'Can I self-drive from Amritsar to Wagah Border and Dalhousie?', a: 'Wagah Border (30 km via GT Road, ~45 min) is an easy self-drive trip — plan to arrive by 4 PM for the evening flag ceremony. Dalhousie (190 km via Pathankot road, ~4 hrs) is a popular hill weekend self-drive. Confirm outstation permissions with your vendor for Himachal Pradesh travel.' },
        { q: 'What are the top self-drive routes from Amritsar?', a: 'Wagah Border (30 km), Pathankot (110 km via NH354), Chandigarh (230 km via NH44), and Dalhousie (190 km via Pathankot) are the top self-drive routes. Jammu (210 km via NH44) and Dharamshala (225 km via NH154) are popular 2-day self-drive destinations.' },
        { q: 'Which areas in Amritsar have self-drive car rental options?', a: 'Ranjit Avenue, Lawrence Road, GT Road, and near Sri Guru Ram Dass Jee Airport (ATQ) have self-drive vendor availability. Book 24 hours in advance. Doorstep delivery across all Amritsar zones.' },
        { q: 'What documents are required for self-drive in Amritsar?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹4,000). Punjab highway checkposts are common — keep RC and insurance handy. For Wagah Border proximity, avoid carrying prohibited items. International tourists with IDP accepted.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Amritsar?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Wagah Border day trip (28 km) starts from ₹3,000. Anandpur Sahib (80 km, ₹4,500 one-way 12-seater) is a popular Sikh heritage route. Chandigarh (230 km) group trip starts from ₹8,000 one-way.' },
        { q: 'Can I book a Tempo Traveller from Amritsar to Wagah Border for the flag ceremony?', a: 'Yes, Amritsar to Wagah Border (28 km via GT Road, ~45 min) is Amritsar\'s most popular Tempo Traveller day trip. A 12-seater starts from ₹3,000 for the round trip with waiting time. Groups from Golden Temple touring parties regularly book this route — depart by 4:00 PM to arrive for the evening ceremony.' },
        { q: 'How many people can a Tempo Traveller carry in Amritsar?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Wagah Border group visits and Anandpur Sahib pilgrimages. The 17-seater is preferred for large NRI family groups doing the full Golden Triangle (Golden Temple, Wagah Border, Jallianwala Bagh) in a single day. AC is standard.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Amritsar?', a: 'Honda Activa and TVS Jupiter are ideal for Amritsar daily commuting — easy to navigate the dense Golden Temple area lanes, Hall Bazaar market roads, and Ranjit Avenue residential corridors. Scooters are the preferred two-wheelers for the old city gali network near the Darbar Sahib.' },
        { q: 'Can I rent a Royal Enfield in Amritsar for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Amritsar for weekend rides. Dharamsala/McLeod Ganj (225 km via NH154, ~4.5 hrs) through Punjab and Himachal is a classic biker route. Starting from ₹1,000–₹1,200/day. A great combination: visit Wagah Border (30 km) en route to Pathankot then Dharamsala.' },
        { q: 'What is the minimum rental period for bikes in Amritsar?', a: '24-hour minimum is standard in Amritsar. Some Ranjit Avenue and Lawrence Road vendors offer 4–8 hour packages for Golden Temple area sightseeing. Monthly rentals offer the best per-day rate — popular with NRI visitors on extended stays.' },
        { q: 'Are electric scooters available on rent in Amritsar?', a: 'Yes, electric scooters are growing in availability in Amritsar under Punjab\'s EV policy. Good option for commuting in the city\'s outer areas like Ranjit Avenue, Lawrence Road, and Bypass Road where distances are manageable. Ideal for eco-conscious pilgrims visiting Gurudwara premises where e-vehicles are welcomed.' },
        { q: 'What documents are needed to rent a bike in Amritsar?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Punjab police checkposts are active — always carry DL while riding. For rides to Wagah Border area, carry all ID documents as security checkpoints are strict near the border.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Amritsar?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. The Amritsar-Delhi Expressway construction corridor, heritage zone restoration near the Golden Temple, AIIMS Amritsar campus, and real estate boom in GT Road and Ranjit Avenue zones drive consistent equipment demand.' },
        { q: 'What projects are driving the most equipment rental demand in Amritsar?', a: 'Amritsar-Delhi Expressway (Delhi-Katra Expressway) construction corridor passing through the Amritsar region is the largest active infrastructure project, generating sustained grader, paver, and compactor demand. AIIMS Amritsar hospital expansion requires concrete and lifting equipment for multi-block construction. Heritage restoration near the Golden Temple — including the Corridor Project\'s second phase — uses compact cranes and specialised lifting equipment under strict ASI supervision.' },
        { q: 'How do I book construction equipment for my project in Amritsar?', a: 'Amritsar\'s AIIMS hospital construction, Expressway land acquisition zone earthworks, and large residential projects in Ranjit Avenue and GT Road corridors are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near heritage zones or expressway sites, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Amritsar?', a: 'JCB 3DX backhoe loader rental in Amritsar starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Amritsar?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Amritsar. Active construction zones include Amritsar-Delhi Expressway service road development, AIIMS hospital campus groundwork, heritage zone utility relocation near the Golden Temple, and residential construction in the fast-growing Ranjit Avenue and GT Road areas.' },
        { q: 'What permits and zone restrictions apply to JCB work in Amritsar?', a: 'JCB work along the Amritsar-Delhi Expressway (Delhi-Katra corridor) requires an NHAI NOC and lane-closure coordination — this approval can take up to two weeks so factor it into project timelines. Within 300 metres of the Golden Temple, Jallianwala Bagh, and other ASI-protected heritage structures, ground excavation is strictly regulated and requires an ASI permission with site assessment; vibration limits also restrict machine size. ADCP (Amritsar Development Authority) NOC covers road-cutting within the municipal boundary.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Amritsar?', a: 'Hall Bazaar and Katra Jaimal Singh wholesale market — covering everything from textiles and hardware to plastics and stationery — is the primary source of daily Tata Ace activity in Amritsar. Golden Temple\'s daily langar (community kitchen) requires consistent supply deliveries of flour, lentils, vegetables, and fuel, most of which arrive by mini truck from the city\'s wholesale mandis. Ranjit Avenue commercial area\'s showrooms and new residential developments also use mini trucks for construction material and furniture delivery.' },
        { q: 'Can I rent a mini truck for house shifting in Amritsar?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Amritsar. Common routes: Hall Bazaar to Ranjit Avenue, Lawrence Road to GT Road, and intra-Majitha Road moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Amritsar?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Hall Bazaar wholesale deliveries, Golden Temple langar supplies movement from mandi to Darbar Sahib, and Ranjit Avenue market goods dispatch are the most common mini truck use cases in Amritsar.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Varanasi, the City of Light and one of the world's oldest living cities, attracts millions of pilgrims and tourists annually. Car rentals serve the Kashi Vishwanath-Sarnath-ghat circuit and outstation trips to Prayagraj, Ayodhya, and Bodhgaya. TransRentals has verified vendors across Varanasi including Godowlia, Lanka, Sarnath Road, and the Lal Bahadur Shastri Airport zone.",
      'bike-on-rent':
        "Varanasi's narrow ghats and ancient city lanes are best explored on two-wheelers. Activa and Jupiter are ideal for navigating old city roads and reaching Sarnath (12 km). Royal Enfield rentals are popular for Ayodhya and Allahabad rides. TransRentals has bike rentals across Varanasi city.",
      'bus-rental':
        "Varanasi's Kumbh Mela connections to Prayagraj and pilgrimage circuits draw massive group bus demand. Corporate conference groups visiting the spiritual city and educational institution excursions also book buses. TransRentals offers AC Tempo Travellers and buses from Varanasi for pilgrimage groups and tourist circuits.",
      'packers-and-movers':
        "Varanasi's growing commercial sector, BHU academic community, and government employees generate relocation demand. Moves between Lanka, Sarnath, and Cantt Road areas are most common. TransRentals connects with insured, verified movers across all Varanasi zones.",
      'transporter':
        "Varanasi's silk weaving industry in Lohta and Bhadohi carpet cluster (40 km) generate export-oriented commercial transport. Agricultural goods from eastern UP also route through Varanasi. TransRentals offers mini trucks to heavy vehicles for goods movement from Varanasi across North and Central India.",
      'jcb-on-rent':
        "Varanasi's Kashi Vishwanath Corridor Phase 2, ring road expansion, and smart city projects drive JCB and excavator demand. New residential development on Ramnagar Road and Mirzapur bypass zones add to construction needs. TransRentals provides JCB 3DX and excavators for projects across Varanasi district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Varanasi's Vishwanath Gali market deliveries and household shifting across zones. These mini trucks navigate Varanasi's famous narrow streets better than larger vehicles. TransRentals has same-day bookings across Varanasi city.",
      'tempo-traveller':
        "Varanasi's pilgrimage circuits to Prayagraj, Ayodhya, and Bodhgaya make it a key tempo traveller hub in North India. Ganga Aarti group attendance (evening) and Sarnath Buddhist tours are top bookings. TransRentals offers AC 12–17 seater Tempo Travellers from Varanasi for pilgrimages and tourist groups.",
      'outstation-car-rental':
        "Outstation cabs from Varanasi cover Prayagraj (125 km), Ayodhya (200 km), Sarnath (12 km), Lucknow (320 km), and Bodhgaya (280 km). TransRentals per-km pricing with experienced drivers on UP and Bihar pilgrimage routes.",
      'one-way-car-rental':
        "Varanasi's top one-way routes: Varanasi to Prayagraj (125 km), Varanasi to Lucknow (320 km), Varanasi to Bodhgaya (280 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Lal Bahadur Shastri Airport (VNS) is 26 km from Varanasi city center. TransRentals airport transfers cover all Varanasi zones. Airport to Godowlia (city center) starting from ₹600 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Varanasi's spiritual circuit and UP highway network make self-drive car rental a convenient option for pilgrimage routes. Sarnath (10 km) is a quick self-drive. Prayagraj (120 km via NH19, ~2.5 hrs) and Ayodhya (200 km via NH19 then NH27, ~4 hrs) are popular self-drive pilgrimages. Bodhgaya (250 km via NH2, ~5 hrs) is a key Buddhist circuit self-drive. TransRentals lists verified self-drive vendors in the Lanka and Sigra areas. Note: UP roads vary in quality — stick to national highways for outstation trips. Old city lanes near ghats are too narrow for cars.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Can a car enter the narrow ghat area of Varanasi?', a: 'No, cars cannot enter within 200–300 meters of most ghats. Drop-off at Godowlia Chowk or Kashi Vishwanath Corridor parking is the standard approach. The walk to the ghats is scenic.' },
        { q: 'What is the cab cost from Varanasi to Prayagraj?', a: 'One-way cab from Varanasi to Prayagraj (125 km via NH19, ~2.5 hrs) starts from ₹1,200 for a sedan. Popular during Kumbh Mela — book weeks in advance during that period.' },
        { q: 'Is it possible to do a Varanasi to Ayodhya day trip by cab?', a: 'Yes, Varanasi to Ayodhya (200 km via NH19 and NH27, ~4 hrs) is feasible as a day trip. Leave by 6 AM, visit Ram Mandir and Saryu Aarti, return by 8–9 PM.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Varanasi do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Varanasi zones — Lanka, Godowlia, Cantonment Road, Sarnath Road, Sigra, Mahmoorganj, BHU Campus area, Ramnagar, Pandeypur, Orderly Bazaar, Beniyabagh, Adampura, Assi, and Kamachha. Intercity moves to Lucknow, Prayagraj, Patna, and Delhi are also available.' },
        { q: 'How do movers access old city areas and ghat-side properties in Varanasi?', a: 'Varanasi\'s old city — within 500 meters of the Ganges ghats — has lanes of 4–10 feet (some just 3 feet near Vishwanath Gali). No vehicles can reach ghat-side buildings in many areas. Movers hand-carry goods on bamboo stretchers or trolleys from the nearest road-accessible point (Godowlia Chowk or Dasashwamedh) — typically 200–500 meters. This adds 2–3 hours to old-city moves. Specify your ghat-side address when booking.' },
        { q: 'What is the most common move corridor in Varanasi?', a: 'The Lanka–Sigra and the Cantonment–Mahmoorganj corridors are Varanasi\'s most common move routes. BHU area (Lanka, Assi) to Cantonment is popular for academic staff relocations. The newer Ramnagar and Mirzapur Bypass zones are attracting young professionals from congested old-city areas. Cross-city moves span 8–15 km but take 45–90 minutes due to Varanasi\'s dense and narrow road network.' },
        { q: 'Do Varanasi movers handle relocations for BHU faculty, staff, and academic professionals?', a: 'Yes — Banaras Hindu University (BHU) is one of India\'s largest universities and generates significant internal campus relocations (BHU quarter to quarter) and external moves (Lanka area to city) for new faculty appointments and transfers. TransRentals movers are experienced with BHU campus road network and building numbering. Campus moves can often be completed as half-day jobs.' },
        { q: 'Should I avoid moving during Dev Deepawali, Ganga Mahotsav, or Kumbh Mela period in Varanasi?', a: 'Moving during major pilgrimages is very challenging. Dev Deepawali (November full moon) draws 10–15 lakh visitors — Dashashwamedh and all ghat roads are impassable for days. Ganga Mahotsav (5-day event, November) causes similar congestion. Maha Kumbh at Prayagraj (125 km) also affects vehicle availability as drivers redirect to Prayagraj. Plan moves at least 2 weeks before or after these events.' },
        { q: 'When is the best time to shift house in Varanasi?', a: 'February–March (post-winter, pre-summer) and October (post-monsoon, before Dev Deepawali season) are ideal. Avoid November (Dev Deepawali, Ganga Mahotsav), December–January (winter fog delays intercity trucks on NH19), and June–September (monsoon flooding in low-lying areas near the Ganges).' },
        { q: 'How long does a 2BHK shift take within Varanasi?', a: 'A standard 2BHK intra-Varanasi shift takes 8–12 hours with a 3-person team — longer than comparable cities due to Varanasi\'s narrow road network. Outer-zone moves (Sigra to Cantonment) take 6–8 hours. Old-city or ghat-area moves can run 12–15 hours including hand-carrying logistics. Book an early-morning start (6 AM) to beat peak pilgrim traffic.' },
        { q: 'Can I move intercity from Varanasi to Lucknow, Prayagraj, or Patna?', a: 'Yes — Varanasi to Prayagraj (125 km via NH19, ~2.5 hrs) and Varanasi to Lucknow (320 km via NH31, ~5.5 hrs) are the most common intercity moves. Varanasi to Patna (290 km via NH19, ~5 hrs) is popular for Bihar government employee transfers. December–January winter fog can delay intercity truck arrivals by 4–6 hours on UP and Bihar highway stretches — plan buffer time for winter deliveries.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Varanasi?', a: 'A 12-seater AC Tempo Traveller in Varanasi starts from ₹5,000+/day. A 20-seater mini bus for Prayagraj (125 km, ~2.5 hrs via NH19) starts from ₹7,000+/day. For Ayodhya pilgrimages (200 km, ~4 hrs), a Tempo Traveller starts from ₹8,500/day. Sarnath Buddhist circuit (10 km) can be covered in a Tempo Traveller for ₹2,500/half-day.' },
        { q: 'Which bus routes are most popular from Varanasi?', a: 'Varanasi to Prayagraj (125 km, ~2.5 hrs via NH19) is the most popular pilgrimage group route — Triveni Sangam darshan for groups of 15–40 is booked throughout the year and surges during Kumbh Mela. Varanasi to Ayodhya (200 km, ~4 hrs) for Ram Mandir darshan is increasingly popular since 2024. Varanasi to Sarnath (10 km, ~30 min) is the top Buddhist heritage group tour.' },
        { q: 'Can I hire a bus for Dev Deepawali celebrations or a wedding in Varanasi?', a: 'Yes, 20–50 seater AC buses are available for Dev Deepawali group viewing and Varanasi weddings. Dev Deepawali (November full moon) draws 10–15 lakh visitors — ghat-viewing transport for groups is in massive demand. Varanasi\'s BHU academic community also books educational tour buses. Decorated baraat buses start from ₹15,000/day. Book 6–8 weeks in advance for Dev Deepawali season.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Varanasi?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for silk and handicrafts are quoted per route. Varanasi\'s Lohta silk weaving cluster and BHU industrial area are the primary commercial transport zones.' },
        { q: 'What is the top goods transport route from Varanasi?', a: 'Varanasi to Delhi (820 km via NH19, ~13 hrs) is the primary FTL corridor for Banarasi silk sarees, hand-woven textiles, and Bhadohi carpets (40 km away). Varanasi to Lucknow (300 km via NH31, ~5.5 hrs) is the busiest short-haul route. Varanasi to Kolkata (670 km via NH19, ~11 hrs) is the key east-bound route for textile exports.' },
        { q: 'Which industrial areas in Varanasi use truck rentals most?', a: 'Lohta silk weaving cluster (handloom silk sarees), BHU-Orderly Bazaar commercial area, and Bhadohi carpet industry zone (40 km, world\'s largest carpet cluster) are Varanasi\'s top truck rental zones. The Mughal Sarai rail yard (near Pt. Deen Dayal Upadhyay Junction) area also generates significant goods movement. TransRentals has verified vendors across all zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Varanasi per day?', a: 'Hatchback self-drive in Varanasi starts from ₹749/day. Sedans start from ₹949/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. Pilgrimage-circuit packages with higher km limits are available.' },
        { q: 'What are the best spiritual circuit self-drive routes from Varanasi?', a: 'Sarnath (10 km, ~30 min) is a quick self-drive to Buddha\'s first sermon site. Prayagraj (120 km via NH19, ~2.5 hrs) for the Triveni Sangam is a popular pilgrimage self-drive. Ayodhya (200 km, ~4 hrs) for Ram Mandir and Bodhgaya (250 km via NH2, ~5 hrs) for the Mahabodhi Temple are excellent 2-day self-drives.' },
        { q: 'Which areas in Varanasi have self-drive car rental options?', a: 'Lanka, Sigra, Cantonment Road, and near Lal Bahadur Shastri Airport (VNS) have self-drive vendors. Avoid old city areas near ghats for pickup — use Lanka or Mahmoorganj pickup points instead. Book 24 hours in advance.' },
        { q: 'Are UP highway roads suitable for self-drive outstation trips from Varanasi?', a: 'NH19 (to Prayagraj and Patna) and NH31 (to Lucknow) are well-maintained national highways suitable for self-drive. Avoid state highways and district roads — they can be narrow with poor lighting at night. Winter fog (December–January) on UP highways can reduce visibility severely; avoid predawn starts.' },
        { q: 'What documents are required for self-drive in Varanasi?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). UP highway checkposts are frequent — carry all vehicle documents. Out-of-state DL holders accepted. Some vendors require outstation permit for trips beyond 150 km.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Varanasi?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local city use. Sarnath (12 km) heritage circuit starts from ₹2,500 for a half-day. Prayagraj (125 km, ₹5,500 one-way 12-seater) for Triveni Sangam is the top pilgrimage group route. Vindhyachal (70 km) temple trip starts from ₹4,000.' },
        { q: 'Can I book a Tempo Traveller from Varanasi to Prayagraj for group pilgrimage?', a: 'Yes, Varanasi to Prayagraj (125 km via NH19, ~2.5 hrs) is Varanasi\'s most popular Tempo Traveller route. A 12-seater one-way starts from ₹5,500. During Maha Kumbh and Ardh Kumbh, group bookings to Prayagraj are extremely high demand — book 2–3 weeks in advance during these periods.' },
        { q: 'How many people can a Tempo Traveller carry in Varanasi?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Prayagraj and Ayodhya pilgrimages. The 9-seater is preferred for Sarnath and Vindhyachal day trips within smaller family groups. Non-AC options are available for the short Sarnath circuit at lower cost.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Varanasi?', a: 'Honda Activa and TVS Jupiter are ideal for Varanasi — perfect for navigating the dense Godowlia Chowk, Assi Ghat road, and Sigra market lanes where cars are too wide. Scooters are the most practical vehicle for old city sightseeing near the ghats where roads narrow to 4–6 feet.' },
        { q: 'Can I rent a Royal Enfield in Varanasi for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Varanasi for weekend rides. Bodhgaya (240 km via NH19, ~4.5 hrs) — the Buddhist pilgrimage circuit — is a rewarding biker destination. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Varanasi?', a: '24-hour minimum is standard in Varanasi. Some Lanka and Sigra vendors offer 4–8 hour packages for ghat area sightseeing. Monthly rentals offer the best per-day rate — popular with BHU students and academic researchers on extended stays.' },
        { q: 'Are electric scooters available on rent in Varanasi?', a: 'Yes, electric scooters are being promoted in Varanasi as part of UP\'s clean city initiative — particularly given the importance of controlling pollution near the ghats and Kashi Vishwanath Corridor. Good option for eco-conscious temple circuit rides in the outer zones of the city.' },
        { q: 'What documents are needed to rent a bike in Varanasi?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. UP checkposts are active on highways — always carry DL. For old city ghat area rides, stick to designated motorcycle lanes and avoid pedestrian-only Vishwanath Corridor.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Varanasi?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Kashi Vishwanath Dham Phase 2 expansion, Varanasi Smart City road and sewage upgrades, Ring Road development, and Ganga ghat restoration projects keep construction equipment in continuous demand.' },
        { q: 'What major projects are driving equipment rental demand in Varanasi?', a: 'Kashi Vishwanath Dham Corridor Phase 2 expansion and associated infrastructure work is the city\'s most prominent equipment demand driver, requiring specialised compact cranes and careful material-handling equipment near the temple precinct. Varanasi Smart City\'s Ganga ghat restoration and riverside beautification projects use compact excavators and concrete equipment. Varanasi Ring Road (NH19 bypass widening) is the largest open-terrain project, sustaining grader and paving equipment demand on the city outskirts.' },
        { q: 'How do I book construction equipment for my project in Varanasi?', a: 'Varanasi\'s Kashi Vishwanath Dham expansion, Smart City road and drain projects, and Ring Road earthworks are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near heritage zones or ghat corridors, book 5–7 days ahead as permits near heritage areas require advance coordination.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Varanasi?', a: 'JCB 3DX backhoe loader rental in Varanasi starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Varanasi?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Varanasi. Active construction zones include Kashi Vishwanath Dham Phase 2 annex, Smart City Varanasi sewage and road corridor works, Ring Road earthworks in outer zones, and ghat steps and ghati renovation projects along the Ganges.' },
        { q: 'What restrictions apply to JCB and excavation work near Varanasi\'s heritage zones?', a: 'ASI enforces a strict no-excavation buffer within 300 metres of the Kashi Vishwanath corridor and Ganga ghats — any ground-breaking work in this zone requires ASI written permission and an archaeologist on-site. The narrow lanes (galis) of the old city physically restrict machine width; only compact mini excavators of 1.2–1.5 m width can access many internal streets. For BHU campus work, university campus authority permission is separately required. Always confirm machine width and site accessibility before booking.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Varanasi?', a: 'Vishwanath Gali and Thatheri Bazaar\'s Banarasi silk wholesale — sarees, brocade fabric, and zari thread — are moved daily by Tata Ace pickups between weaving workshops in Madanpura and Lallapura and showrooms in the city. Godowlia and Dashashwamedh market area sees constant mini truck deliveries of puja material, flower garlands, and brass articles to ghat-side shops. BHU campus office and laboratory equipment moves, and hospital medical supply deliveries to Sir Sunderlal Hospital, are also significant recurring use cases.' },
        { q: 'Can I rent a mini truck for house shifting in Varanasi?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Varanasi. Common routes: Lanka BHU area to Sigra, Godowlia to Sunderpur, and intra-Assi Ghat residential moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Varanasi?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Vishwanath Gali silk and Banarasi saree shop dispatches, Godowlia market wholesale deliveries, and BHU area academic supply runs are the most common mini truck use cases in Varanasi.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Agra's status as India's most-visited tourist city — home to Taj Mahal, Agra Fort, and Fatehpur Sikri — makes it one of North India's most active car rental markets. Full-day heritage circuit tours and intercity Golden Triangle transfers dominate bookings. TransRentals has verified vendors serving tourists, pilgrims, and business travelers across Agra city and the airport zone.",
      'bike-on-rent':
        "Agra's heritage lanes and the flat Yamuna river plains make bikes practical for city sightseeing. Activa and Jupiter are popular for the Taj Mahal-Agra Fort-Mehtab Bagh circuit. Royal Enfield rentals cater to adventure riders doing the Delhi-Agra-Jaipur circuit by bike. TransRentals has rentals across Agra city.",
      'bus-rental':
        "Agra's group tourism makes bus rentals essential. Delhi-Agra-Jaipur school excursions, foreign tourist group transfers, and pilgrimages to Mathura (60 km) and Vrindavan (70 km) are top routes. TransRentals offers AC 12-seater to 50-seater buses for tourist groups and pilgrimages from Agra.",
      'packers-and-movers':
        "Agra's marble industry, footwear sector, and growing IT presence generate relocation demand. TransRentals connects with insured, verified movers across all Agra zones including Fatehabad Road, Sikandra, and Trans-Yamuna areas.",
      'transporter':
        "Agra's marble export industry (Makrana marble via Rajasthan), leather goods manufacturing, and footwear cluster in Nunhai SIDCO generate significant commercial transport demand. TransRentals offers mini trucks to container vehicles from Agra for goods transport across North India.",
      'jcb-on-rent':
        "Agra's Yamuna Expressway Industrial Development Authority (YEIDA) zones, metro rail project, and smart city road works drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Agra district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Agra's Sadar Bazaar deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Agra city.",
      'tempo-traveller':
        "Agra's Golden Triangle tourism — Delhi-Agra-Jaipur — is India's most popular group travel circuit. 12–17 seater Tempo Travellers are ideal for families and friend groups doing the 2-day circuit. Mathura-Vrindavan pilgrimages from Agra are also popular. TransRentals offers AC Tempo Travellers from Agra.",
      'outstation-car-rental':
        "Outstation cabs from Agra cover Delhi (230 km via Yamuna Expressway), Jaipur (240 km), Mathura (60 km), Fatehpur Sikri (40 km), Lucknow (330 km), and Gwalior (120 km). TransRentals per-km pricing — available from all Agra zones.",
      'one-way-car-rental':
        "Agra's top one-way routes: Agra to Delhi (230 km), Agra to Jaipur (240 km), Agra to Lucknow (330 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Agra Airport (AGR) is just 8 km from Tajganj. TransRentals airport transfers cover Agra city zones. Airport to Tajganj/Taj Mahal starting from ₹350 for a sedan. 24/7 service, no surge.",
      'self-drive-car-rentals':
        "Agra is the ideal self-drive hub for India's Golden Triangle circuit. The Yamuna Expressway (NH19) to Delhi (230 km, ~4 hrs) and NH21 to Jaipur (240 km, ~4 hrs) are world-class highways perfect for self-drive. Fatehpur Sikri (40 km via NH21) is a quick and easy self-drive day trip. TransRentals lists verified self-drive vendors near Tajganj and Fatehabad Road. Sedans and compact SUVs are ideal for the flat Golden Triangle roads. Note: Avoid driving near Taj Mahal gates — designated parking zones apply.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'How early should I leave Delhi to reach Taj Mahal at sunrise?', a: 'Taj Mahal gates open at 6 AM (sunrise). To reach from Delhi, depart by 3–3:30 AM via Yamuna Expressway. You\'ll arrive in ~3.5 hours with minimal traffic for the best golden hour photos.' },
        { q: 'Can I do a same-day Delhi-Agra-Jaipur Golden Triangle trip?', a: 'A same-day Delhi-Agra-Jaipur trip is not recommended — it\'s 470 km and 3 heritage sites. The standard is 2 nights: Delhi → Agra (Day 1) → Jaipur (Day 2) → Delhi (Day 3).' },
        { q: 'What is the cost of car rental in Agra for Taj Mahal tour?', a: 'A 4-hour sightseeing cab in Agra (Taj Mahal, Agra Fort, Mehtab Bagh) starts from ₹800 for a sedan. Full-day 8-hour packages including Fatehpur Sikri start from ₹1,500.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Agra?', a: 'A 12-seater AC Tempo Traveller in Agra starts from ₹5,000+/day for local monument circuits. A 20-seater mini bus for Mathura (60 km, ~1 hr) and Vrindavan (70 km, ~1.5 hrs) round trips starts from ₹4,500+/day. For Fatehpur Sikri (40 km) group tours, a Tempo Traveller starts from ₹3,500/day. Delhi group transfers (230 km) in a bus start from ₹10,000+.' },
        { q: 'Which bus routes are most popular from Agra?', a: 'Agra to Mathura (60 km, ~1 hr via NH2) and Vrindavan (70 km, ~1.5 hrs) for the Braj pilgrimage circuit is the most popular group route — Krishna devotee groups of 15–40 are booked year-round. Agra to Fatehpur Sikri (40 km, ~1 hr via NH21) is the top heritage group circuit. Agra to Jaipur (240 km, ~4 hrs via NH21) is the key Golden Triangle group bus route.' },
        { q: 'Can I hire a bus for a wedding or tour group in Agra?', a: 'Yes, 20–50 seater AC buses are available for Agra weddings and tourist groups. Foreign tourist circuit operators regularly book fleet buses for the Golden Triangle circuit. Marble and leather industry corporate events also book buses. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance for tourist peak season (Oct–Mar) when demand is highest.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Agra?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for marble and leather goods are quoted per route. Nunhai SIDCO industrial estate and Sikandra industrial zone are Agra\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Agra?', a: 'Agra to Delhi (230 km via Yamuna Expressway, ~4 hrs) is the busiest FTL corridor — carrying Agra marble products, leather footwear, and handicrafts to the national capital. Agra to Jaipur (240 km via NH21, ~4 hrs) is the primary route for Makrana marble movement from Rajasthan through Agra wholesale markets. LTL options are available for handicraft consignments.' },
        { q: 'Which industrial areas in Agra use truck rentals most?', a: 'Nunhai SIDCO industrial estate (leather, footwear — India\'s largest footwear cluster), Sikandra industrial zone (marble processing, handicrafts), and Runkata industrial area (chemicals, engineering) are Agra\'s top truck rental zones. TransRentals has verified vendors in all three zones serving India\'s top export clusters for leather and marble goods.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Agra per day?', a: 'Hatchback self-drive in Agra starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 150–200 km; extra km at ₹10–14/km. Multi-day Golden Triangle packages with higher km allowances are available.' },
        { q: 'Can I self-drive from Agra on the Golden Triangle routes?', a: 'Yes! Yamuna Expressway (NH19) to Delhi (230 km, ~4 hrs) is one of India\'s finest toll roads — smooth, well-lit, and safe. NH21 to Jaipur (240 km, ~4 hrs) is also an excellent highway. Both are ideal for self-drive. Confirm outstation permissions and km limits when booking.' },
        { q: 'What are the easy self-drive day trips from Agra?', a: 'Fatehpur Sikri (40 km via NH21, ~1 hr) is the easiest self-drive — Mughal ghost city, UNESCO site. Mathura and Vrindavan (60 km via NH2, ~1 hr) are popular pilgrimage self-drives. Gwalior (120 km via NH44, ~2.5 hrs) is excellent for a day trip with a magnificent fort.' },
        { q: 'Which areas in Agra have self-drive car rental options?', a: 'Tajganj, Fatehabad Road, Sikandra, and near Agra Airport (AGR) have self-drive vendor availability. Book 24 hours in advance. Doorstep delivery available across Agra zones.' },
        { q: 'Any special rules for driving near Taj Mahal in Agra?', a: 'Vehicles cannot park within 500 meters of the Taj Mahal East Gate and South Gate. Use the designated Shilpgram parking (east gate) or Taj Mahal parking (south gate). The area around Tajganj is a Low Emission Zone — diesel vehicles face restrictions during peak hours. Carry your parking receipt to avoid fines.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Agra?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local monument circuits. Mathura-Vrindavan Braj circuit (60 km, ₹4,000 one-way 12-seater) and Fatehpur Sikri (40 km) are the top short group routes. Delhi (230 km) one-way starts from ₹10,000.' },
        { q: 'Can I book a Tempo Traveller from Agra to Mathura-Vrindavan for a pilgrimage?', a: 'Yes, Agra to Mathura-Vrindavan (60 km via NH2, ~1 hr) is Agra\'s most popular Tempo Traveller route for Krishna pilgrimage circuits. A 12-seater one-way starts from ₹4,000. Round-trip Braj Chaurasi Kos Parikrama packages with waiting time at multiple temples are available on TransRentals.' },
        { q: 'How many people can a Tempo Traveller carry in Agra?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Mathura-Vrindavan pilgrimages and Golden Triangle circuits. The 17-seater is preferred for large foreign tourist groups on the full Delhi–Agra–Jaipur circuit. AC is essential during Agra\'s hot summers (Apr–Jun, 40–45°C).' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Agra?', a: 'Honda Activa and TVS Jupiter are ideal for Agra city commuting — easy to navigate Tajganj\'s narrow lanes, Sadar Bazaar market roads, and the monument zone where larger vehicles face parking restrictions. Scooters are the most practical choice for the Low Emission Zone near the Taj Mahal.' },
        { q: 'Can I rent a Royal Enfield in Agra for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Agra for weekend rides. Mathura and Vrindavan (60 km via NH2, ~1 hr) is a popular pilgrimage bike route. Starting from ₹1,000–₹1,200/day. Fatehpur Sikri (40 km) is an easy self-ride for heritage enthusiasts.' },
        { q: 'What is the minimum rental period for bikes in Agra?', a: '24-hour minimum is standard in Agra. Some Tajganj and Fatehabad Road vendors offer 4–8 hour packages for monument sightseeing tours. Monthly rentals are popular with long-stay foreign tourists and offer the best per-day rate.' },
        { q: 'Are electric scooters available on rent in Agra?', a: 'Yes, electric scooters are growing in Agra under UP\'s EV push and are especially relevant near the Taj Mahal\'s Low Emission Zone where diesel vehicles face restrictions. A good option for eco-conscious tourists doing the city monument circuit on Fatehabad Road and Tajganj.' },
        { q: 'What documents are needed to rent a bike in Agra?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Some vendors take photo ID only for short monument circuit rides. UP checkposts are active on highways — carry DL at all times.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Agra do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Agra zones — Tajganj, Fatehabad Road, Sikandra, Kamla Nagar, Shahganj, Sanjay Place, Trans-Yamuna, Civil Lines, and Airport Zone (AGR). Intra-city and intercity moves to Delhi, Jaipur, Mathura, and Lucknow are available.' },
        { q: 'What is the cost of house shifting in Agra?', a: 'A 1BHK shift within Agra starts from ₹4,000–₹6,000 including packing, loading, and unloading. 2BHK starts from ₹7,000–₹12,000. Rates vary with floor, lift availability, and move distance within city.' },
        { q: 'Can I shift from Agra to Delhi using TransRentals movers?', a: 'Yes, Agra to Delhi (230 km via Yamuna Expressway NH19) is the top intercity move route. A 2BHK relocation including professional packing and dedicated truck starts from ₹18,000–₹25,000. Transit time is 4–5 hours on the Yamuna Expressway.' },
        { q: 'How early should I book movers in Agra for a month-end shift?', a: 'Month-end dates (28th–2nd) see high demand in Agra — book at least 4–5 days in advance. Tourist season (Oct–Mar) and financial year-end (Mar–Apr) are additional peak periods. Mid-month (8th–20th) offers the most availability.' },
        { q: 'Do Agra movers handle marble furniture and heavy stone items?', a: 'Yes, Agra\'s marble industry means movers are experienced with heavy stone tables, marble temple pieces, and fragile stone carvings. Specialized packing (foam wrapping, wooden crating) is available. Always declare heavy/fragile marble items while booking.' },
        { q: 'How long does a 2BHK shift take within Agra city?', a: 'A 2BHK intra-city shift in Agra (packing + loading + transit + unloading) takes 6–9 hours with a team of 3–4 professionals. Narrow lanes near Tajganj and Kinari Bazaar can add 30–45 minutes — early morning starts (before 8 AM) help avoid tourist traffic.' },
        { q: 'Can I move intercity from Agra to Jaipur or Lucknow?', a: 'Yes — Agra to Jaipur (240 km via NH21, ~4 hrs) and Agra to Lucknow (330 km via Agra-Lucknow Expressway, ~5 hrs) are available. Full household relocation with professional packing and dedicated truck. Get a free quote on TransRentals.' },
        { q: 'Are movers available in Agra during tourist peak season (Oct–Mar)?', a: 'Yes, but October–March is Agra\'s busiest tourist season, which also drives corporate relocation demand. Book at least 5–7 days in advance during this period. Narrow roads near monument zones may have traffic restrictions on weekends and national holidays.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Agra?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Agra Metro first phase construction, Yamuna Expressway Industrial Development Authority (YEIDA) zone projects, Smart City Agra infrastructure, and Taj Heritage Corridor improvements drive sustained equipment demand.' },
        { q: 'What are the main equipment rental demand drivers in Agra?', a: 'Agra Metro Phase 1 underground tunnelling is the city\'s most technically demanding active project, requiring tunnel boring machines and specialised underground excavation equipment. Yamuna Expressway Industrial Development Authority (YEIDA) commercial and logistics zone construction near Agra generates tower crane and concrete pump demand. Taj Mahal Smart City corridor beautification and road infrastructure work also runs through the city, though strict AQI restrictions limit diesel equipment operating hours near the Taj precinct.' },
        { q: 'How do I book construction equipment for my project in Agra?', a: 'Agra\'s Metro first phase underground corridor, YEIDA industrial zone development, and Smart City road and drain works are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near heritage buffer zones or metro work, book 5–7 days ahead to ensure ASI clearance compliance.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Agra?', a: 'JCB 3DX backhoe loader rental in Agra starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Agra?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Agra. Active construction zones include Agra Metro Phase 1 underground sections, Yamuna Expressway Industrial corridor land development, Smart City Agra sewage and road corridor upgrades, and Taj Heritage Corridor peripheral infrastructure.' },
        { q: 'What restrictions apply to JCB work near Agra\'s protected monuments?', a: 'ASI strictly prohibits any excavation or heavy construction within 300 metres of the Taj Mahal, Agra Fort, Itmad-ud-Daulah, and Fatehpur Sikri — violations carry immediate stoppage and legal penalties. Additionally, the Supreme Court-mandated Taj Trapezium Zone (TTZ) restricts diesel machinery operating hours and emissions near the Taj precinct. Always verify your site coordinates against ASI-protected boundaries before booking; Yamuna riverbed soil near the Taj is soft alluvial and excavates easily on compliant sites.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Agra?', a: 'Sadar Bazaar leather goods wholesale — shoes, bags, belts, and accessories — is Agra\'s most characteristic mini truck use case, with Tata Ace pickups running between tanneries in Nunhai, stitching units in Agra\'s leather belt, and export-packing houses near Bypass Road. Kinari Bazaar handicraft market (marble inlay, brassware, carpets) uses mini trucks for consignment deliveries to tourist hotels and export agents. Makrana white marble pieces from Rajasthan, destined for Agra\'s workshop belt, also arrive and are redistributed by mini trucks.' },
        { q: 'Can I rent a mini truck for house shifting in Agra?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Agra. Common routes: Sadar Bazar to Tajganj, Kamla Nagar to Sikandra, and intra-Dayalbagh residential moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Agra?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Sadar Bazaar leather goods and shoe wholesale deliveries, Kinari Bazaar market supply runs, and marble workshop dispatches to showrooms near Taj Ganj are the most common mini truck use cases in Agra.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Nashik's unique position — pilgrimage gateway to Shirdi, wine tourism hub (Sula Vineyards), and major industrial city — creates diverse car rental demand. Shirdi (90 km) outstation trips dominate; winery circuits and Trimbakeshwar (30 km) visits drive leisure bookings. TransRentals has verified vendors across Nashik covering Gangapur Road, College Road, Nashik Road, and the airport zone.",
      'bike-on-rent':
        "Nashik's hilly terrain and vineyard lanes are well-suited to two-wheelers. Students of KBCNMU and professionals prefer Activa and Jupiter for city commuting. Royal Enfield rentals are popular for Igatpuri (45 km) and Trimbakeshwar rides. TransRentals has bike rentals available across Nashik city.",
      'bus-rental':
        "Nashik's Shirdi pilgrimage connection and Kumbh Mela heritage drive massive bus demand. Shirdi group darshan buses are booked year-round; Kumbh years see unprecedented demand. Corporate team outings to Igatpuri and Lonavala also book buses. TransRentals offers AC Tempo Travellers and buses for pilgrimages and group travel from Nashik.",
      'packers-and-movers':
        "Nashik's growing IT (Ambad industrial estate) and manufacturing sectors drive relocation demand. Moves between Gangapur Road, Nashik Road, and College Road zones are most common. Intercity transfers to Mumbai and Pune are frequent. TransRentals connects with insured, verified movers across all Nashik zones.",
      'transporter':
        "Nashik's Ambad industrial estate (engineering, food processing), MIDC Satpur, and grape-based agri-export industry generate strong commercial transport demand. TransRentals offers verified transporters with mini trucks to 32-ft containers from Nashik for goods movement across Maharashtra and beyond.",
      'jcb-on-rent':
        "Nashik's smart city phase 2 projects, Nashik-Pune Expressway land acquisition works, and new township development in Gangapur Road and Deolali Camp drive JCB demand. TransRentals provides JCB 3DX and mini excavators for construction and earthwork across Nashik district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Nashik's Mahatma Gandhi Road market deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Nashik city.",
      'tempo-traveller':
        "Nashik's Shirdi connection (90 km) and pilgrimage to Trimbakeshwar (30 km) make it a strong tempo traveller market. Mumbai group tours to Nashik wineries are increasing. TransRentals offers AC 12–17 seater Tempo Travellers from Nashik for pilgrimages, wine tours, and corporate outings.",
      'outstation-car-rental':
        "Outstation cabs from Nashik cover Shirdi (90 km), Mumbai (170 km), Trimbakeshwar (30 km), Pune (210 km), and Aurangabad (250 km). TransRentals per-km pricing with no hidden charges — available from all Nashik zones.",
      'one-way-car-rental':
        "Nashik's top one-way routes: Nashik to Mumbai (170 km), Nashik to Shirdi (90 km), Nashik to Pune (210 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Ozar Airport (ISK) is 25 km from Nashik city center. TransRentals airport transfers cover Gangapur Road, College Road, and Nashik Road zones. Airport to city starting from ₹600 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Nashik's wine country and pilgrimage circuit make it a unique self-drive destination in Maharashtra. Shirdi (85 km via NH60, ~2 hrs) and Trimbakeshwar (28 km, ~45 min) are quick pilgrimage self-drives. Sula Vineyards (15 km from city) are perfect for a self-drive wine tour. Bhandardara lake and dam (80 km, ~2 hrs) is a scenic weekend self-drive. Mumbai (170 km via NH160) is reachable via the scenic Kasara Ghat — best in clear weather. TransRentals lists verified self-drive vendors on Gangapur Road and College Road. Hatchbacks and sedans are most popular.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the cab cost from Nashik to Shirdi?', a: 'One-way cab from Nashik to Shirdi (90 km via NH60, ~2 hrs) starts from ₹900 for a sedan. Round-trip with 3–4 hours at Shirdi for darshan — get a free quote on TransRentals.' },
        { q: 'Can I book a Nashik winery tour cab?', a: 'Yes, Sula Vineyards and neighbouring wineries are 15 km from Nashik city. A 4-hour sightseeing cab for the Nashik wine trail starts from ₹600 for a sedan.' },
        { q: 'Which road is best for Nashik to Mumbai trip?', a: 'NH160 via Kasara Ghat (170 km, ~3.5 hrs) is the standard route. The Kasara Ghat section is scenic but has curves — drive carefully in monsoon. NH752 via Ghoti is an alternative.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Nashik do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Nashik localities — Gangapur Road, College Road, Nashik Road, Ambad MIDC, Satpur MIDC, Dwarka, Indira Nagar, Panchavati, Pathardi Phata, Cidco, Trimbak Road, Deolali Camp, Mhasrul, Nashik East, and Canada Corner. Intercity moves to Mumbai, Pune, Aurangabad, and Shirdi are also available.' },
        { q: 'What is the most common move corridor in Nashik?', a: 'The Gangapur Road–College Road corridor and the Nashik Road–Dwarka route are Nashik\'s most active move paths. Nashik\'s growth as an IT and manufacturing hub drives the flow from older Panchavati and Nashik Road areas toward newer Trimbak Road and Mhasrul township developments. Cidco and Satpur MIDC zones attract industrial professionals from Mumbai and Pune who account for a significant share of intercity arrivals.' },
        { q: 'How does Nashik\'s Kumbh Mela year affect household moving?', a: 'Nashik hosts Kumbh Mela every 12 years (next around 2027). During Kumbh year, central Nashik (Panchavati, Ramkund, Godavari banks) becomes a restricted zone with massive pilgrimage footfall. Intra-city moves in these areas are nearly impossible during peak Kumbh dates. For families planning ahead: schedule moves in January–February (before the Simhastha start) or November–December (after it ends).' },
        { q: 'What is the Kasara Ghat impact on intercity moves from Nashik to Mumbai?', a: 'Nashik to Mumbai (170 km via NH160) involves the Kasara Ghat — a mountain pass with sharp curves and single-lane sections between Kasara and Igatpuri. Large moving trucks travel at 30–40 km/h on the ghat, adding 45–60 minutes to the route. Monsoon (June–September) makes the ghat slippery — TransRentals movers avoid ghat driving between midnight and 6 AM and during heavy rainfall advisories.' },
        { q: 'When is the best time to shift house in Nashik?', a: 'October–February is ideal — post-monsoon, cool climate, and lower demand. Avoid June–September (monsoon, ghat road restrictions). March–May is peak for Maharashtra government transfer orders. Sula Vineyards Grapes Fest (February) and Nashik Marathon (January) cause city-wide congestion — avoid those specific weekends for city-center moves.' },
        { q: 'How long does a 2BHK shift take within Nashik?', a: 'A standard 2BHK intra-Nashik shift takes 6–9 hours with a 3-person team. Short same-zone moves (College Road to Gangapur Road) take 5–7 hours. Cross-city moves (Deolali Camp to Ambad MIDC or Nashik Road to Trimbak Road) take 8–11 hours due to Nashik\'s urban sprawl and traffic at Old Agra Road intersections.' },
        { q: 'Can I move intercity from Nashik to Mumbai, Pune, or Aurangabad?', a: 'Yes — Nashik to Mumbai (170 km via NH160 over Kasara Ghat, ~3.5–4 hrs including ghat time) and Nashik to Pune (210 km via NH60, ~4 hrs) are the two most popular intercity routes. Nashik to Shirdi (90 km, ~2 hrs) is a short intercity move. Nashik to Aurangabad (250 km via NH752, ~4.5 hrs) is also available. Get a free quote on TransRentals.' },
        { q: 'Are movers available on weekends and during pilgrimage season in Nashik?', a: 'Yes, movers are available all year. However, Nashik sees Shirdi pilgrimage group transport demand every weekend — this affects vehicle availability for commercial and moving trips on Fridays and Sundays. Book moving trucks at least 4–5 days in advance for weekends and 7–10 days for month-end dates. Trimbakeshwar Shravan month (July–August) creates additional weekend vehicle demand.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Nashik?', a: 'A 12-seater AC Tempo Traveller in Nashik starts from ₹5,000+/day. A 20-seater mini bus for Shirdi (90 km, ~2 hrs) starts from ₹7,000+/day. For Trimbakeshwar group visits (30 km, ~45 min), a Tempo Traveller for a half-day starts from ₹3,000. Mumbai group tours (180 km, ~3.5 hrs) in a 40-seater AC bus start from ₹12,000+/day.' },
        { q: 'Which bus routes are most popular from Nashik?', a: 'Nashik to Shirdi (90 km, ~2 hrs via NH60) is the most popular pilgrimage group route — Sai Baba darshan buses for groups of 15–40 are booked year-round. Nashik to Trimbakeshwar (30 km, ~45 min) for the Jyotirlinga is a popular same-day pilgrimage. Nashik to Mumbai (180 km, ~3.5 hrs via NH160) is the top group intercity route, especially for Nashik Kumbh Mela visitors.' },
        { q: 'Can I hire a bus for a wedding or corporate event in Nashik?', a: 'Yes, 20–50 seater AC buses are available for Nashik weddings and corporate events. Nashik\'s growing wine tourism has created a unique demand for vineyard tour buses to Sula, York, and Grover Zampa. Ambad MIDC manufacturing companies book employee outing buses. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance for peak season (Oct–Feb).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Nashik?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for grapes, onions, and pharma goods are quoted per route. Ambad MIDC and Satpur MIDC are Nashik\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Nashik?', a: 'Nashik to Mumbai (170 km via NH160, ~3.5 hrs) is the busiest FTL corridor — carrying fresh grapes and onions from Nashik\'s agricultural belt, and pharma APIs from Ambad MIDC. Nashik to Pune (210 km via NH60, ~4 hrs) is the second most active route for engineering and food processing goods. LTL options are widely available.' },
        { q: 'Which industrial areas in Nashik use truck rentals most?', a: 'Ambad MIDC (engineering, pharma, food processing — includes India\'s second-largest pharma cluster), Satpur MIDC (auto components, electrical), and Sinnar industrial zone (chemicals, plastics) are Nashik\'s top truck rental zones. Nashik\'s grape and onion wholesale market near Gangapur Road also generates heavy seasonal agricultural truck demand. TransRentals has verified vendors in all zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Nashik per day?', a: 'Hatchback self-drive in Nashik starts from ₹799/day. Sedans (Swift Dzire, Honda City) start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,499/day. Standard packages include 150–200 km; extra km at ₹12–15/km.' },
        { q: 'Can I drive a self-drive rental from Nashik to Shirdi or Trimbakeshwar?', a: 'Yes, Shirdi (85 km via NH60, ~2 hrs) and Trimbakeshwar (28 km, ~45 min) are quick pilgrimage self-drives from Nashik. Both routes are in good condition. Shirdi has ample parking near Sai Temple. For Trimbakeshwar ghat section, a compact car is easier to maneuver.' },
        { q: 'Is the Kasara Ghat route to Mumbai safe for a self-drive car?', a: 'The Kasara Ghat (NH160, Nashik to Mumbai) is manageable in a standard car during clear weather. However, in monsoon (June–September), steep curves and poor visibility on the ghat require extra caution. An SUV with good ground clearance is recommended. Avoid night driving on this ghat section.' },
        { q: 'Which areas in Nashik have self-drive car rental pickup points?', a: 'Gangapur Road, College Road, Nashik Road, and Trimbak Road have the most self-drive vendors. Ozar Airport (ISK) pickup is available with advance booking. Doorstep delivery is available across all Nashik zones.' },
        { q: 'Can I do a wine tour of Sula Vineyards and nearby wineries in a self-drive car?', a: 'Yes, Sula Vineyards is just 15 km from Nashik city on Gangapur Road — a 20–25 minute self-drive. A sedan or hatchback is perfectly adequate. Note: Gujarat border wine routes (Igatpuri) are also accessible in ~45 minutes. Book a half-day package if you want to visit multiple wineries without rush.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Nashik?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Shirdi (90 km, ₹4,500 one-way 12-seater via NH60) is the most popular group pilgrimage route. Trimbakeshwar (28 km) half-day circuit starts from ₹3,000. Aurangabad (115 km) heritage tour starts from ₹6,000.' },
        { q: 'Can I book a Tempo Traveller from Nashik to Shirdi for a group pilgrimage?', a: 'Yes, Nashik to Shirdi (90 km via NH60, ~2 hrs) is Nashik\'s most popular Tempo Traveller route. A 12-seater one-way starts from ₹4,500. Groups combining Trimbakeshwar (28 km from Nashik) with Shirdi on the same day book early-morning departures. Year-round availability — Shirdi darshan group bookings are TransRentals\' highest demand from Nashik.' },
        { q: 'How many people can a Tempo Traveller carry in Nashik?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Shirdi and Trimbakeshwar pilgrimages. The 17-seater suits Nashik\'s wine trail corporate group tours and Sula Vineyards events. Non-AC options are available for short local routes during cooler months.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Nashik?', a: 'Honda Activa and TVS Jupiter are ideal for Nashik daily commuting — perfect for the CBS bus stand area, Ambad MIDC industrial zone, and College Road market stretch. Nashik\'s relatively uncongested roads (compared to Mumbai or Pune) make scooters a comfortable commuting choice.' },
        { q: 'Can I rent a Royal Enfield in Nashik for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Nashik for weekend rides. Igatpuri (50 km via NH160, ~1 hr) through the scenic Western Ghat foothills is a popular short biker trip. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Nashik?', a: '24-hour minimum is standard in Nashik. Some Gangapur Road and College Road vendors offer 4–8 hour packages for winery tours and pilgrimage circuits. Monthly rentals offer the best per-day rate — popular with Ambad MIDC manufacturing professionals.' },
        { q: 'Are electric scooters available on rent in Nashik?', a: 'Yes, electric scooters are growing in Nashik under Maharashtra\'s EV policy. Good option for city commuting in College Road, Dwarka, and Cidco zones. Nashik\'s relatively flat terrain (outside the Ghat approaches) makes e-scooters practical for daily use.' },
        { q: 'What documents are needed to rent a bike in Nashik?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Maharashtra checkposts are active on highways — carry DL at all times. Some vendors accept photo ID only for short intra-city pilgrimage rides.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Nashik?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Nashik Ring Road expansion, Smart City Nashik infrastructure projects, MIDC Satpur and Ambad industrial estate development, and residential construction boom in Gangapur Road and College Road zones drive consistent demand.' },
        { q: 'What projects and industries drive equipment rental demand in Nashik?', a: 'Nashik Ring Road and Smart City infrastructure work are the city\'s most active equipment demand sources for graders, pavers, and earthmoving machines. MIDC Satpur and Ambad\'s expansion — Nashik hosts manufacturing units for Mahindra, ABB, and L&T — requires industrial cranes and concrete equipment for factory construction. Grape cold storage facility construction, which peaks during the pre-harvest season (November–January), is a uniquely Nashik use case for concrete and structural equipment.' },
        { q: 'How do I book construction equipment for my project in Nashik?', a: 'Nashik\'s Ring Road earthworks, MIDC Satpur industrial expansion, and large residential projects in Gangapur Road and Cidco zones are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near Smart City projects or MIDC zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Nashik?', a: 'JCB 3DX backhoe loader rental in Nashik starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Nashik?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Nashik. Active construction zones include Ring Road earthworks, MIDC Satpur and Ambad industrial unit construction, Smart City Nashik utility corridor upgrades, and residential township development in Trimbak Road and Dindori Road expansion zones.' },
        { q: 'Does Nashik\'s rocky terrain require special JCB attachments?', a: 'Nashik sits on Deccan Trap hard basalt, and foundation excavation at industrial sites in Ambad, Satpur, and Sinnar MIDC commonly hits solid basalt below 1.0–1.5 m. A rock breaker attachment is routinely required for foundation work in these zones — confirm attachment availability before booking. Trimbakeshwar and vineyard region sites outside the city are similar; never assume a standard bucket will suffice without first checking the subsurface with the vendor.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Nashik?', a: 'APMC Nashik is one of India\'s largest onion and grape wholesale markets — mini trucks run all night during harvest season (October–February for onions, February–April for grapes) carrying produce from mandi to cold storage and packing houses. Ambad MIDC industrial goods, engineering parts, and packaging materials move by mini truck daily between factories. Trimbakeshwar pilgrimage supply deliveries — puja materials, flower garlands, and daily provisions for the temple town — see a major surge during Kumbh Mela (Nashik Simhastha) periods.' },
        { q: 'Can I rent a mini truck for house shifting in Nashik?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Nashik. Common routes: College Road to Gangapur Road, Nashik Road to Cidco, and intra-Satpur moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Nashik?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Mahamarg wholesale market deliveries, Ambad industrial estate component supply runs, and grape and onion wholesale dispatches from Nashik APMC to processing units are the most common mini truck use cases in Nashik.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Visakhapatnam (Vizag) blends naval heritage, scenic beaches, and industrial might with a growing IT sector. Araku Valley (120 km via Eastern Ghats) and Borra Caves are top outstation routes. Corporate zones in Madhurawada and GITAM University belt drive weekday demand. TransRentals has verified Vizag vendors covering Dwaraka Nagar, MVP Colony, Steel Plant area, and the airport zone.",
      'bike-on-rent':
        "Vizag's Beach Road, Rushikonda beach stretch, and hilly terrain toward Araku make it ideal for two-wheelers. Daily commuters in MVP Colony and Madhurawada prefer Activa. Royal Enfield Himalayan is top choice for Araku Valley ghat rides. TransRentals has bike rentals across Visakhapatnam city.",
      'bus-rental':
        "Vizag's Araku Valley eco-tourism and pilgrimages to Simhachalam (15 km), Annavaram (120 km), and Srisailam (360 km) drive group bus demand. HPCL and other PSU employee outings book corporate buses regularly. TransRentals offers AC Tempo Travellers and buses for pilgrimages and group travel from Vizag.",
      'packers-and-movers':
        "Visakhapatnam (Vizag) has emerged as Andhra Pradesh's most dynamic relocation market, driven by the RINL Steel Plant, HPCL, Hindustan Zinc, and the rapidly growing IT corridor in Madhurawada and Rushikonda. PSU sector employees — RINL, HPCL, Indian Navy, Vizag Port Trust — generate the largest share of government relocations, peaking March–June with annual transfers. Common intra-city corridors: Dwaraka Nagar to Madhurawada, MVP Colony to Steel Plant Township, Gajuwaka to NAD Junction, and Seethammadhara to Rushikonda. New residential developments in Bheemunipatnam Beach Road, Kommadi, and Atchutapuram SEZ corridor attract young IT professionals from Hyderabad. Key intercity moves: Vizag to Hyderabad (620 km via NH65), Vizag to Vijayawada (355 km via NH16), Vizag to Bhubaneswar (450 km), and Vizag to Chennai (790 km). RINL Steel Plant township's 6,000+ quarters generate significant intra-township shifting requests throughout the year. Gajuwaka industrial area moves require early morning scheduling. TransRentals covers all Vizag zones — including Pendurthi, Gopalapatnam, Gajuwaka, Muralinagar, and Simhachalam — with verified, insured movers.",
      'transporter':
        "Vizag's major port, Visakhapatnam Steel Plant (RINL), and GITAM-Petrochemical industrial zone generate massive commercial transport demand. Port-side logistics and steel plant raw materials require heavy vehicle movement daily. TransRentals offers mini trucks to 40-ft containers for port logistics and intercity freight from Vizag.",
      'jcb-on-rent':
        "Vizag's metro rail project, Bheemunipatnam Beach Road expansion, and IT Park development in Madhurawada drive JCB and excavator demand. TransRentals provides JCB 3DX and mini excavators for construction and infrastructure projects across Visakhapatnam district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Vizag's Jagadamba Junction market deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Visakhapatnam city.",
      'tempo-traveller':
        "Vizag's Araku Valley eco-tourism circuit (120 km) is one of Andhra Pradesh's most scenic group travel routes. Pilgrimages to Simhachalam and Annavaram are popular tempo traveller bookings. Corporate IT company outings from Madhurawada to beach resorts are growing. TransRentals offers AC Tempo Travellers from Vizag.",
      'outstation-car-rental':
        "Outstation cabs from Vizag cover Araku Valley (120 km), Borra Caves (90 km), Lambasingi (100 km), Vijayawada (355 km), and Hyderabad (620 km). SUVs recommended for Eastern Ghats routes. TransRentals per-km pricing — available from all Vizag zones.",
      'one-way-car-rental':
        "Vizag's top one-way routes: Vizag to Vijayawada (355 km), Vizag to Hyderabad (620 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Vizag Airport (VTZ) is 16 km from Dwaraka Nagar and 20 km from MVP Colony. TransRentals airport transfers cover all Vizag zones. Airport to Dwaraka Nagar starting from ₹500 for a sedan. 24/7 service, no surge.",
      'self-drive-car-rentals':
        "Visakhapatnam (Vizag) offers some of Andhra Pradesh's most scenic self-drive routes — from the Eastern Ghats ghat road to Araku Valley (120 km) to the breezy Beach Road coastal drive. IT professionals in Madhurawada increasingly choose self-drive for weekend getaways to Bheemunipatnam (25 km) and Lambasingi (100 km). TransRentals lists verified self-drive vendors in Dwaraka Nagar, MVP Colony, Madhurawada, and near Vizag Airport with quick pickup. Note: The Araku Valley ghat road (NH516) is beautiful but requires careful driving — SUVs recommended for this route.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for Vizag to Araku Valley trip?', a: 'An SUV (Innova, Ertiga, or Scorpio) is strongly recommended for Araku — the NH516 through Eastern Ghats has scenic but winding ghat sections. Innova Crysta is the most popular booking.' },
        { q: 'Can I do a day trip to Lambasingi from Vizag?', a: "Vizag to Lambasingi (Andhra's Kashmir) is 100 km, ~3 hrs. A day trip is feasible — leave by 5 AM to enjoy the misty morning views (Oct–Jan best season). Book an SUV with TransRentals." },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Visakhapatnam (Vizag) do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Vizag localities — Dwaraka Nagar, MVP Colony, Seethammadhara, Steel Plant Township, Gajuwaka, Madhurawada, NAD Junction, Rushikonda, Kommadi, Bheemunipatnam, Pendurthi, Gopalapatnam, Muralinagar, Simhachalam, Arilova, and Atchutapuram SEZ. Intercity moves to Hyderabad, Vijayawada, Bhubaneswar, and Chennai are also available.' },
        { q: 'What is the most common move corridor in Vizag — MVP Colony to Madhurawada?', a: 'The MVP Colony–Madhurawada IT corridor and the Dwaraka Nagar–Rushikonda beachside route are Vizag\'s most active move paths. Young IT professionals moving from established residential zones (MVP Colony, Seethammadhara) to the newer Madhurawada-Kommadi IT township belt account for the highest volume. The Steel Plant Township to NAD Junction corridor reflects RINL employee housing transfers. Beach Road transit is fast — 20–35 minutes across most corridors.' },
        { q: 'Why do RINL, HPCL, and Indian Navy employees drive the highest share of Vizag relocation demand?', a: 'Vizag hosts RINL (Visakhapatnam Steel Plant) with 17,000+ employees, HPCL Visakha Refinery, Indian Navy\'s Eastern Naval Command, and Vizag Port Trust — all PSU/central government organizations issuing annual transfer orders every March–June. RINL Steel Plant alone has 6,000+ residential quarters in its township, generating constant intra-township and city-wide relocation demand year-round.' },
        { q: 'Does the RINL Steel Plant township have special requirements for movers?', a: 'Yes — RINL township has its own internal security, vehicle permit requirements, and designated service routes. Movers must obtain a vehicle gate pass from RINL Security Office (CISF) — TransRentals connected movers are familiar with this process and typically obtain passes 24–48 hours in advance. Always book RINL township moves at least 5–7 days ahead to allow pass processing time.' },
        { q: 'When is the best time to shift house in Visakhapatnam?', a: 'October–February (Vizag winter, pleasant coastal weather) is ideal. Avoid June–October (Bay of Bengal cyclone season — Vizag is India\'s most cyclone-exposed major city, with alerts requiring last-minute cancellations). March–June is peak PSU/Navy transfer season. Mid-month weekdays are consistently 15–20% cheaper than month-end.' },
        { q: 'How long does a 2BHK shift take within Visakhapatnam?', a: 'A standard 2BHK intra-Vizag shift takes 6–9 hours with a 3-person team. Vizag\'s linear coastal layout (40 km from Gajuwaka to Bheemunipatnam) means cross-city moves can be long in distance but manageable outside rush hours. Short same-zone moves (MVP Colony to Seethammadhara) take 5–7 hours. Long moves (Gajuwaka to Kommadi) take 9–12 hours via the Inner Ring Road.' },
        { q: 'Can I move intercity from Vizag to Hyderabad, Vijayawada, or Bhubaneswar?', a: 'Yes — Vizag to Hyderabad (620 km via NH65, ~10–11 hrs truck), Vizag to Vijayawada (355 km via NH16, ~6 hrs), and Vizag to Bhubaneswar (450 km via NH16, ~7.5 hrs) are all popular intercity routes. NH16 (the coastal expressway) is excellent — Vijayawada deliveries can be completed same day for early-morning departures. Get a free quote on TransRentals.' },
        { q: 'How does Vizag\'s cyclone-prone coast affect household moving schedules?', a: 'Vizag faces Bay of Bengal cyclones mainly in October–December. When cyclone warnings are issued (typically 48–72 hours in advance), all outdoor operations including moving are suspended until the all-clear. TransRentals movers proactively reschedule confirmed bookings in case of cyclone alerts at no extra charge. If moving October–December, confirm the rescheduling policy at booking.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Visakhapatnam?', a: 'A 12-seater AC Tempo Traveller in Vizag starts from ₹5,000+/day. A 20-seater mini bus for Araku Valley (115 km, ~3.5 hrs) starts from ₹8,500+/day. For Srisailam pilgrimages (600 km, ~10 hrs), overnight AC buses start from ₹25,000+/day. Tirupati group buses (370 km, ~7 hrs) start from ₹18,000+/day.' },
        { q: 'Which bus routes are most popular from Visakhapatnam?', a: 'Vizag to Araku Valley (115 km, ~3.5 hrs via NH516 through Eastern Ghats) is the most popular scenic group route — coffee plantation tours and tribal handicraft circuits for tourist and corporate groups. Vizag to Tirupati (370 km, ~7 hrs) is the most popular pilgrimage group bus route. Vizag to Srisailam (600 km, ~10 hrs) is a popular overnight pilgrimage.' },
        { q: 'Can I hire a bus for a corporate event or wedding in Visakhapatnam?', a: 'Yes, 20–50 seater AC buses are available for Vizag corporate events and Telugu weddings. RINL Steel Plant, HPCL Visakha Refinery, and Navy township organize employee fleet outings regularly. IT companies in Madhurawada book Araku Valley outing coaches. Decorated baraat buses start from ₹15,000/day. Book 2–3 weeks in advance during peak wedding season (Nov–Feb).' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Visakhapatnam?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for steel and port logistics are quoted per route. Visakhapatnam Port and RINL Steel Plant are India\'s largest eastern industrial complex driving massive truck demand.' },
        { q: 'What is the top goods transport route from Visakhapatnam?', a: 'Vizag to Hyderabad (620 km via NH65, ~10 hrs) is the busiest FTL corridor — carrying RINL steel products, HPCL refinery chemicals, and pharma goods from VSEZ/APIIC zones. Vizag port to Vijayawada (355 km via NH16, ~6 hrs) is the key short-haul distribution route for imported goods. LTL and FTL options are both available.' },
        { q: 'Which industrial areas in Visakhapatnam use truck rentals most?', a: 'RINL Visakhapatnam Steel Plant township area (steel and raw material logistics), VSEZ (Visakhapatnam Special Economic Zone — IT, pharma), and APIIC Atchutapuram industrial estate (chemicals, auto) are Vizag\'s top truck rental zones. Gajuwaka industrial area (engineering, defense) also drives significant daily truck movement. TransRentals has verified vendors across all zones.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Visakhapatnam per day?', a: 'Hatchback self-drive in Vizag starts from ₹799/day. Sedans start from ₹1,099/day. SUVs (recommended for Araku ghat) start from ₹1,599/day. Standard packages include 150–200 km; extra km at ₹12–15/km.' },
        { q: 'Can I self-drive from Vizag to Araku Valley safely?', a: 'Yes, but an SUV is strongly recommended — NH516 through the Eastern Ghats has scenic but steep curves. The drive (120 km, ~3.5 hrs) is best done in daylight. Leave by 6 AM to enjoy the misty ghat views and reach Araku by 9:30 AM. Avoid the ghat in heavy monsoon rain.' },
        { q: 'What are the best self-drive destinations from Visakhapatnam?', a: 'Top self-drive routes from Vizag: Bheemunipatnam (25 km, Beach Road, ~45 min), Borra Caves (90 km, ~2.5 hrs), Lambasingi (100 km, ~3 hrs — best Oct–Jan), Araku Valley (120 km, ~3.5 hrs). All routes start on NH516 — an excellent highway through Eastern Ghats.' },
        { q: 'Which areas in Vizag have self-drive car rental pickup points?', a: 'Dwaraka Nagar, MVP Colony, Madhurawada IT corridor, and Vizag Airport (VTZ, 16 km from city) are the main pickup zones. Doorstep delivery is available across all Vizag localities including Steel Plant Township and Gajuwaka.' },
        { q: 'What documents are needed for self-drive car rental in Vizag?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport for ID, and a refundable security deposit (₹2,000–₹4,000). Telangana and AP DL holders are accepted without any extra documentation. Fuel policy is typically full-to-full — petrol stations are abundant on all major highways.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Visakhapatnam?', a: '12-seater AC Tempo Traveller starting from ₹5,000/day for local trips. Araku Valley (115 km, ₹5,000 one-way 12-seater) through the Eastern Ghats is the most popular scenic group route. Borra Caves (90 km) half-day group tour starts from ₹4,000. Tirupati (350 km) pilgrimage one-way starts from ₹13,000.' },
        { q: 'Can I book a Tempo Traveller from Visakhapatnam to Araku Valley?', a: 'Yes, Vizag to Araku Valley (115 km via NH516, ~3.5 hrs) through the Eastern Ghats is Visakhapatnam\'s most popular Tempo Traveller route. A 12-seater one-way starts from ₹5,000. The scenic tribal coffee and bamboo country makes this the top IT company team outing from Vizag. Book 3–5 days in advance for weekends.' },
        { q: 'How many people can a Tempo Traveller carry in Visakhapatnam?', a: '9, 12, 14, or 17-seater AC options are available. The 12-seater is most popular for Araku Valley corporate outings and Borra Caves heritage tours. The 17-seater suits large RINL and HPCL employee groups. All Araku Valley bookings include an experienced ghat driver for the Eastern Ghats section.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Visakhapatnam?', a: 'Honda Activa and TVS Jupiter are ideal for Vizag daily commuting — perfect for RK Beach Road, Maddilapalem market roads, and MVP Colony residential streets. Vizag\'s coastal layout with long stretches of Beach Road makes scooters a comfortable and practical commuting choice.' },
        { q: 'Can I rent a Royal Enfield in Visakhapatnam for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Vizag for weekend rides. Araku Valley (115 km via NH516, ~3.5 hrs) through the Eastern Ghats is the ultimate Vizag biker route — breathtaking ghat views and tribal villages. Starting from ₹1,000–₹1,200/day. Experienced ghat riding recommended.' },
        { q: 'What is the minimum rental period for bikes in Visakhapatnam?', a: '24-hour minimum is standard in Vizag. Some RK Beach and Dwaraka Nagar vendors offer 4–8 hour packages for coastal road and city sightseeing. Monthly rentals offer the best per-day rate — popular with RINL, HPCL, and IT professionals at Madhurawada.' },
        { q: 'Are electric scooters available on rent in Visakhapatnam?', a: 'Yes, electric scooters are growing in availability in Vizag under Andhra Pradesh\'s EV initiatives. Good option for IT corridor commuting in Madhurawada-Kommadi zone and Beach Road area. The flat coastal terrain and sea breeze make Vizag an ideal city for e-scooter riding.' },
        { q: 'What documents are needed to rent a bike in Visakhapatnam?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. AP and Telangana DL holders accepted without extra documentation. For Araku Valley ghat rides, confirm ghat-capable bike category with the vendor.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Visakhapatnam?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Visakhapatnam Metro approved project, RINL steel plant expansion, Vizag Special Economic Zone (VSEZ) industrial development, and pharma cluster construction in Parawada generate consistent equipment demand.' },
        { q: 'What industries generate the most equipment rental demand in Visakhapatnam?', a: 'RINL (Rashtriya Ispat Nigam) Vizag Steel Plant maintenance and expansion is the city\'s single largest equipment rental account — the plant continuously needs industrial cranes, forklifts, and specialised lifting equipment for blast furnace and rolling mill work. VSEZ (Visakhapatnam Special Economic Zone) IT and pharmaceutical zone new construction drives concrete and structural equipment demand. The approved Visakhapatnam Metro rail project is adding piling and viaduct equipment requirements as civil work progresses.' },
        { q: 'How do I book construction equipment for my project in Visakhapatnam?', a: 'Vizag\'s RINL steel plant expansion, VSEZ industrial development, and pharma cluster in Parawada are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near the steel plant or VSEZ port-side zones, book 5–7 days ahead to ensure proper industrial site access.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Visakhapatnam?', a: 'JCB 3DX backhoe loader rental in Visakhapatnam starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Visakhapatnam?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Visakhapatnam. Active construction zones include RINL Vizag Steel plant expansion earthworks, VSEZ port berth and industrial plot development, pharma manufacturing unit construction in Parawada, and coastal highway improvement projects near RK Beach and Bheemunipatnam.' },
        { q: 'How does soil and terrain vary for JCB work across Visakhapatnam?', a: 'Visakhapatnam has sharply different soil conditions by zone: coastal areas near RK Beach, MVP Colony, and Rushikonda have soft sandy soil that excavates very quickly, while inland areas near NAD Junction, Gajuwaka, and Bheemunipatnam have hard rocky laterite terrain requiring a rock breaker attachment. CRZ (Coastal Regulation Zone) restrictions near RK Beach and the port area also require VMRDA permission before any ground-breaking work — coastal site permits take 2–3 weeks longer than inland applications.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Visakhapatnam?', a: 'RK Beach market and Jagadamba Centre\'s fresh fish and seafood wholesale is Vizag\'s most distinctive mini truck use case — early-morning runs from the Fishing Harbour to city fish markets and hotel suppliers happen daily, year-round. RINL steel plant ancillary factories in Gajuwaka use mini trucks for inter-plant component and raw material movement within the industrial belt. Dwaraka Nagar wholesale market distribution — covering garments, plastics, and general goods — rounds out the city\'s regular mini truck demand.' },
        { q: 'Can I rent a mini truck for house shifting in Visakhapatnam?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Visakhapatnam. Common routes: RK Beach area to MVP Colony, Gajuwaka to Maddilapalem, and intra-Steel Plant Township moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Visakhapatnam?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. RK Beach wholesale market deliveries, RINL steel plant employee colony supply runs, and Dwaraka Nagar wholesale market dispatches are the most common mini truck use cases in Visakhapatnam.' },
      ],
    },
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
    serviceIntros: {
      'car-rental':
        "Rajkot, Gujarat's engineering and commercial hub, is the ideal base for Saurashtra pilgrimage circuits. Dwarka (240 km), Somnath (210 km), and Gir Forest (165 km) are the top outstation routes. Innova and Ertiga lead group travel bookings. TransRentals has verified Rajkot vendors covering Kalawad Road, Gondal Road, 150 Feet Ring Road, and the airport zone.",
      'bike-on-rent':
        "Rajkot's flat terrain and engineering institute culture make bikes popular for daily travel. Activa and Jupiter dominate city commuting. Royal Enfield Classic 350 is popular for Dwarka and Somnath pilgrimage rides. TransRentals has bike rentals available across Rajkot city.",
      'bus-rental':
        "Rajkot's Saurashtra pilgrimage circuits — Dwarka, Somnath, Gir, Porbandar — are India's premier temple group tour routes. Navratri season (October) creates peak demand. Corporate team outings from Rajkot's engineering SME cluster and wedding baraat buses are also popular. TransRentals offers AC Tempo Travellers and buses from Rajkot.",
      'packers-and-movers':
        "Rajkot's thriving SME engineering sector, growing diamond polishing industry, and strong NRI community have created Gujarat's third-largest relocation market after Ahmedabad and Surat. Engineers and business owners moving between Metoda GIDC, Shapar-Veraval industrial estate, and residential zones are the primary movers. Common intra-city corridors: University Road to Kalawad Road, 150 Feet Ring Road to Gondal Road, Mavdi to Pedak Road, and Raiya Road to Aji GIDC. Government employee transfers — Gujarat Police, civil services, and PSU banks — peak March–June. Key intercity moves: Rajkot to Ahmedabad (220 km via NH947), Rajkot to Surat (250 km), Rajkot to Mumbai (670 km), and Rajkot to Junagadh (100 km). Gujarat's strong NRI community drives relocation demand for expatriates returning from UAE and UK to Rajkot. Rajkot's compact city layout makes intra-city moves faster than larger metros. Navratri season (October) creates temporary storage demand. TransRentals covers all Rajkot zones — including Race Course Road, Bhaktinagar, Kothariya, Airport Zone, Yagnik Road, and Nirmala Convent Road — with verified, insured movers.",
      'transporter':
        "Rajkot's engineering goods manufacturing (auto components, machine tools), plastic pipe industry, and GIDC Metoda industrial estate generate strong commercial transport demand. TransRentals offers verified transporters with mini trucks to container vehicles from Rajkot across Gujarat and beyond.",
      'jcb-on-rent':
        "Rajkot's ring road development, new residential projects in Mavdi and Kalavad Road areas, and industrial estate expansion in Metoda and Shapar-Veraval drive JCB demand. TransRentals provides JCB 3DX and mini excavators for construction projects across Rajkot district.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Rajkot's Soni Bazaar deliveries and household shifting across city zones. TransRentals has same-day mini-truck bookings with verified drivers across Rajkot city.",
      'tempo-traveller':
        "Rajkot's Saurashtra circuit — Dwarka, Somnath, Gir Lion Safari, and Porbandar (Gandhi birthplace) — is one of Gujarat's most popular Tempo Traveller routes. 2–3 night pilgrimage tours from Rajkot are extremely popular. TransRentals offers AC 12–17 seater Tempo Travellers with Gujarat-experienced drivers.",
      'outstation-car-rental':
        "Outstation cabs from Rajkot cover Dwarka (240 km), Somnath (210 km), Gir Forest (165 km), Porbandar (120 km), Jamnagar (90 km), and Ahmedabad (220 km). TransRentals per-km pricing — available from all Rajkot zones.",
      'one-way-car-rental':
        "Rajkot's top one-way routes: Rajkot to Ahmedabad (220 km), Rajkot to Dwarka (240 km), Rajkot to Somnath (210 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Rajkot Airport (RAJ) is just 8 km from the city center. TransRentals airport transfers cover all Rajkot zones. Airport to Kalawad Road starting from ₹300 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Rajkot is the ideal self-drive base for Gujarat's Saurashtra pilgrimage and wildlife circuit. NH947 to Dwarka (240 km) and NH27 to Gir Forest (165 km) and Somnath (210 km) are in excellent condition — wide 4-lane highways with good rest stops. TransRentals lists verified self-drive vendors in Kalawad Road, Gondal Road, and near Rajkot Airport with same-day availability. An SUV or Innova is recommended for the complete Saurashtra circuit (Dwarka-Somnath-Gir over 2-3 days) given the distances involved.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for the Rajkot to Gir Lion Safari trip?', a: 'An SUV (Innova, Ertiga, or Thar) is ideal for the Gir Forest approach (165 km via NH27). The safari itself uses jeeps provided by the forest department — your rental car parks at Sasan Gir.' },
        { q: 'Can I cover Dwarka and Somnath in 2 days from Rajkot?', a: 'Yes, the classic 2-day circuit: Day 1 — Rajkot to Dwarka (240 km, Dwarka temple, Bet Dwarka), overnight. Day 2 — Dwarka to Somnath (230 km, Somnath temple) then back to Rajkot (210 km). Book an SUV.' },
        { q: 'What is cab cost from Rajkot to Ahmedabad?', a: 'One-way cab from Rajkot to Ahmedabad (220 km via NH947, ~4 hrs) starts from ₹2,000 for a sedan. The NH947 is in excellent condition — wide 4-lane highway.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of a Saurashtra pilgrimage Tempo Traveller from Rajkot?', a: 'A 3-day Dwarka-Somnath-Gir pilgrimage circuit from Rajkot in an AC 12-seater Tempo Traveller starts from ₹18,000. Highly recommended for groups of 8–12 pilgrims.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Rajkot do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Rajkot localities — University Road, Kalawad Road, Gondal Road, 150 Feet Ring Road, Mavdi, Race Course Road, Raiya Road, Bhaktinagar, Kothariya, Airport Zone, Yagnik Road, Aji GIDC, Metoda GIDC, Nirmala Convent Road, Pedak Road, and Shapar-Veraval industrial corridor. Intercity moves to Ahmedabad, Surat, Mumbai, Junagadh, and Jamnagar are also available.' },
        { q: 'What is the most common move corridor in Rajkot?', a: 'The University Road–Kalawad Road corridor and the 150 Feet Ring Road–Gondal Road route are Rajkot\'s most active move paths. Engineering SME owners and diamond polishing professionals relocating from older central areas (Race Course Road, Bhaktinagar) to newer Mavdi and Kothariya developments represent the highest volume. Rajkot\'s compact geography (15–18 km diameter) means most intra-city moves are completed in under 1 hour transit.' },
        { q: 'How does Rajkot\'s compact city size affect moving time and cost?', a: 'Rajkot is one of India\'s most compact major cities — virtually all points are within 12–15 km of each other and transit rarely exceeds 30–40 minutes. This makes intra-city moves faster and cheaper than comparable Gujarat cities (Ahmedabad, Surat). TransRentals movers can often complete a full Rajkot intra-city move in a single team shift where larger cities require extended schedules.' },
        { q: 'Do NRI families (UAE, UK, USA) use Rajkot movers for returning home relocations?', a: 'Yes — Rajkot has one of Gujarat\'s largest NRI communities, with thousands of families in the UAE (Sharjah, Dubai, Abu Dhabi), UK, and USA. Returning NRI families often bring international-standard furniture and imported appliances requiring specialized handling. TransRentals NRI-return move specialists provide careful white-glove handling, full unpacking, and furniture assembly at the new Rajkot home. Book 2–3 weeks in advance for large NRI return moves.' },
        { q: 'What is the Navratri season impact on moving in Rajkot?', a: 'Navratri (October, 9 nights) is Rajkot\'s biggest festival — the city hosts some of India\'s largest garba venues at Race Course ground. During Navratri, commercial vehicles face restrictions near garba venues after 7 PM. TransRentals movers can complete moves before 4 PM during Navratri — avoid booking moves that require late-evening unloading during this period.' },
        { q: 'When is the best time to shift house in Rajkot?', a: 'October–February is ideal — post-monsoon, cooler weather (Gujarat summers hit 42°C). Avoid March–June (Gujarat government transfer season + extreme heat). Navratri specific weekends in October require early-completion scheduling. Mid-month weekdays are consistently the most affordable and available booking slots.' },
        { q: 'How long does a 2BHK shift take within Rajkot?', a: 'A standard 2BHK intra-Rajkot shift takes 5–8 hours with a 3-person team — among the fastest of any tier 2 city due to compact layout and good roads. Short same-zone moves (University Road to Kalawad Road) take 4–5 hours. The longest cross-city moves (Metoda GIDC to Kothariya) rarely exceed 7–8 hours. Rajkot has minimal narrow-lane issues except for old bazaar areas near Soni Bazaar.' },
        { q: 'Can I move intercity from Rajkot to Ahmedabad, Surat, or Mumbai?', a: 'Yes — Rajkot to Ahmedabad (220 km via NH947, ~4 hrs) is the most common intercity move — NH947 is in excellent condition and next-day delivery is standard. Rajkot to Surat (250 km via NH27, ~4.5 hrs), Rajkot to Junagadh (100 km, ~2 hrs), and Rajkot to Mumbai (670 km via NH48, ~11–12 hrs truck) are all available. Get a free quote on TransRentals for full household intercity pricing.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Rajkot?', a: 'A 12-seater AC Tempo Traveller in Rajkot starts from ₹5,000+/day. A 20-seater mini bus for Dwarka (250 km, ~4.5 hrs) starts from ₹10,000+/day. For the Saurashtra 3-day pilgrimage circuit (Dwarka-Somnath-Gir), a 40-seater AC bus is available from ₹25,000+. Somnath (200 km, ~4 hrs) day pilgrimages in a Tempo Traveller start from ₹9,000/day.' },
        { q: 'Which bus routes are most popular from Rajkot?', a: 'Rajkot to Dwarka (250 km, ~4.5 hrs via NH947) is the most popular pilgrimage group route — the Dwarkadhish temple draws large tour groups year-round. Rajkot to Somnath (200 km, ~4 hrs via NH27) is the second most booked pilgrimage. Rajkot to Gir Forest (165 km, ~3 hrs) for Asiatic lion safari is popular for corporate and school group outings.' },
        { q: 'Can I hire a bus for Navratri events or a Gujarati wedding in Rajkot?', a: 'Yes, 20–50 seater AC buses are available for Navratri garba events and Gujarati weddings. Rajkot hosts some of Gujarat\'s largest Navratri venues — group transport is in huge demand during the 9-night festival (October). Gujarati wedding processions feature grand baraat buses starting from ₹18,000/day. GIDC Metoda engineering companies also book outing buses. Book 3–4 weeks in advance for Navratri season.' },
      ],
      'transporter': [
        { q: 'What types of trucks are available for rent in Rajkot?', a: 'Tata Ace (1T) starts from ₹2,500-3,000/day, Tata 407 (5T) starts from ₹5,000-7,000/day, and container trucks for engineering and auto components are quoted per route. GIDC Metoda and Shapar-Veraval industrial estate are Rajkot\'s primary commercial transport hubs.' },
        { q: 'What is the top goods transport route from Rajkot?', a: 'Rajkot to Ahmedabad (220 km via NH947, ~4 hrs) is the busiest FTL corridor — NH947 is excellent and same-day delivery to Ahmedabad is standard. The route carries engineering goods from GIDC Metoda (machine tools, auto components), plastic pipes, and pump sets. Rajkot to Mundra Port (220 km, ~4 hrs) is the key export freight route for Saurashtra engineering goods.' },
        { q: 'Which industrial areas in Rajkot use truck rentals most?', a: 'GIDC Metoda (auto components, engineering goods, machine tools — one of Gujarat\'s largest SME clusters), Shapar-Veraval industrial estate (plastics, pipes, engineering), and Aji GIDC (casting, forging) are Rajkot\'s top truck rental zones. TransRentals has verified vendors in all three clusters, serving Rajkot\'s thriving engineering economy with daily commercial transport needs.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Rajkot per day?', a: 'Hatchback self-drive in Rajkot starts from ₹799/day. Sedans start from ₹1,099/day. SUVs (ideal for the Saurashtra circuit) start from ₹1,599/day. Standard packages include 200–300 km; extra km at ₹12–15/km. Weekly packages for the full Saurashtra circuit are available.' },
        { q: 'Can I cover Dwarka, Somnath, and Gir in a self-drive car from Rajkot?', a: 'Yes, the Saurashtra circuit is excellent for self-drive: Rajkot → Dwarka (240 km, Day 1), Dwarka → Somnath (230 km, Day 2), Somnath → Gir (75 km, Day 3), Gir → Rajkot (165 km, Day 4). Book an SUV or Innova for comfort on this 700+ km circuit. NH947 and NH27 are smooth 4-lane highways throughout.' },
        { q: 'What are the road conditions on Rajkot to Dwarka or Gir routes?', a: 'NH947 (Rajkot to Jamnagar, then onward to Dwarka) and NH27 (Rajkot to Gir and Somnath) are excellent — wide, smooth, well-marked national highways. Rest stops with fuel stations are available every 40–50 km. No mountain ghats on any Saurashtra route — all flat terrain, suitable for any car type.' },
        { q: 'Which areas in Rajkot have self-drive pickup points?', a: 'Kalawad Road, Gondal Road, 150 Feet Ring Road, and near Rajkot Airport (RAJ, 8 km from city) are the main pickup zones. Given Rajkot\'s compact size, doorstep delivery covers all city localities within 30 minutes.' },
        { q: 'Does Gujarat dry state rule affect self-drive trips from Rajkot?', a: 'Gujarat is a dry state — alcohol is not available without a permit. This does not affect self-drive car usage in any way. However, if you are hosting out-of-state guests, note they cannot purchase alcohol anywhere in Gujarat during the Saurashtra circuit. For self-drive itself, roads and fuel availability are unaffected.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Rajkot?', a: 'Honda Activa and TVS Jupiter are ideal for Rajkot daily commuting — excellent on Kalawad Road, Race Course Road, and Gondal Road\'s wide Gujarat-standard highways. Rajkot\'s flat terrain and clean roads make scooters one of the most practical commuting choices in Saurashtra.' },
        { q: 'Can I rent a Royal Enfield in Rajkot for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Rajkot for weekend rides. Gir Forest (165 km via NH27, ~3 hrs) is the most popular Rajkot biker destination — ride through Gujarat\'s flat savannah landscape to the home of the Asiatic lion. Starting from ₹1,000–₹1,200/day.' },
        { q: 'What is the minimum rental period for bikes in Rajkot?', a: '24-hour minimum is standard in Rajkot. Some Kalawad Road and University Road vendors offer 4–8 hour packages for city use. Monthly rentals offer the best per-day rate — popular with GIDC Metoda and Shapar engineering professionals.' },
        { q: 'Are electric scooters available on rent in Rajkot?', a: 'Yes, electric scooters are growing in Rajkot under Gujarat\'s strong EV policy. Rajkot\'s flat terrain, wide roads, and clean city air make it ideal for e-scooter commuting. Good option for University Road and 150 Feet Ring Road zone professionals. Gujarat\'s prohibition also means no nighttime inconveniences typically associated with late city commutes.' },
        { q: 'What documents are needed to rent a bike in Rajkot?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₃,000. Gujarat police checkposts are active on highways — carry DL and vehicle documents. Note: Gujarat is a dry state — do not carry alcohol on any rental vehicle.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Rajkot?', a: 'JCB backhoe loaders from ₹2,999/day, hydraulic excavators from ₹3,500/day, cranes, road rollers, generators (15kVA–500kVA), and concrete mixers. Rajkot Ring Road development, Smart City Rajkot infrastructure projects, GIDC Metoda industrial estate expansion, and NH widening near Rajkot junction drive consistent equipment demand across Saurashtra\'s commercial capital.' },
        { q: 'Which projects and industries are driving equipment rental demand in Rajkot?', a: 'Rajkot Ring Road expansion is the city\'s most active ongoing infrastructure project, sustaining demand for graders, rollers, and paving equipment. GIDC Metoda\'s engineering and auto component manufacturing cluster — supplying parts to national auto OEMs — requires industrial cranes and concrete equipment for factory construction and expansion. Smart City Rajkot\'s road and drainage upgrade projects also run year-round within the city, adding steady earthmoving equipment demand.' },
        { q: 'How do I book construction equipment for my project in Rajkot?', a: 'Rajkot\'s Ring Road expansion, GIDC Metoda and Shapar-Veraval industrial estate expansion, and Smart City infrastructure projects are the primary equipment users. Book at least 48–72 hours in advance on TransRentals. For cranes near GIDC or NH widening work zones, book 5–7 days ahead.' },
      ],
      'jcb-on-rent': [
        { q: 'What is the JCB rental rate in Rajkot?', a: 'JCB 3DX backhoe loader rental in Rajkot starts from ₹3,999/day with certified operator. JCB 4DX and specialized excavators start from ₹5,000/day. Minimum 8-hour shift. Fuel arrangements to be made at site by client.' },
        { q: 'For what type of construction work is JCB available in Rajkot?', a: 'Foundation digging, road trenching, utility pipeline work, demolition, and earthmoving across Rajkot. Active construction zones include Ring Road expansion earthworks, GIDC Metoda industrial plot development, Smart City Rajkot road and utility corridor upgrades, and residential township construction in Mavdi, Kothariya, and Kalavad Road zones.' },
        { q: 'What soil challenges affect JCB work in the Rajkot region?', a: 'Black cotton (BC) soil is widespread across Rajkot and the Saurashtra region — it swells significantly during monsoon (June–September), making trenches unstable and increasing machine resistance, then becomes iron-hard in summer, slowing excavation considerably. For BC soil foundation work, always request a JCB with a wide bucket to improve material handling efficiency. RUDA (Rajkot Urban Development Authority) permission is additionally required for any excavation adjacent to the Ring Road or in RUDA-designated development zones.' },
      ],
      'mini-truck-rental': [
        { q: 'What goods are commonly transported by mini trucks in Rajkot?', a: 'Soni Bazaar and Sadar Bazar engineering parts wholesale — Rajkot is nicknamed the "Sheffield of India" for its engineering hardware — generates constant Tata Ace demand for inter-workshop and wholesale-to-retail component movement. GIDC Metoda factory component dispatches, carrying auto parts, castings, and forged components to OEM assembly plants, are a high-frequency use case. Gondal Road agricultural produce market (groundnut, cotton, cumin) also uses mini trucks for intra-city distribution from the mandi to oil mills and processing units.' },
        { q: 'Can I rent a mini truck for house shifting in Rajkot?', a: 'Yes, mini trucks are ideal for 1-room or small 1BHK shifts within Rajkot. Common routes: University Road to Kalawad Road, Race Course Road to Gondal Road, and intra-Mavdi moves. Driver included. Most vendors also provide 1–2 helpers on request for ₹300–400 extra per helper.' },
        { q: 'What types of goods can a mini truck carry in Rajkot?', a: 'Tata Ace handles 750 kg — furniture, electronics, groceries, construction material, shop inventory. Soni Bazaar engineering parts deliveries, GIDC Metoda component supplies to assembly units, and wholesale goods dispatches along Gondal Road market corridor are the most common mini truck use cases in Rajkot.' },
      ],
    },
  },

  surat: {
    intro:
      "Surat, Gujarat's second-largest city and the world's diamond polishing capital with 70 lakh residents, has one of India's fastest-growing vehicle rental markets. The textile and diamond industries anchor corporate demand, while pilgrimage routes to Udvada, Dumas Beach, and Dandi drive leisure travel. The Surat-Mumbai NH48 corridor is one of the busiest commercial highways in western India. TransRentals covers all major Surat zones — Adajan, Vesu, Athwa Lines, Ring Road, and the Surat Airport area.",
    routes: [
      { to: 'Mumbai', distance: '290 km', duration: '5 hrs', via: 'NH48' },
      { to: 'Ahmedabad', distance: '270 km', duration: '4.5 hrs', via: 'NH48' },
      { to: 'Vadodara', distance: '160 km', duration: '3 hrs', via: 'NH48' },
      { to: 'Daman', distance: '130 km', duration: '2.5 hrs', via: 'NH48' },
      { to: 'Navsari', distance: '40 km', duration: '45 min', via: 'NH48' },
      { to: 'Saputara', distance: '155 km', duration: '3.5 hrs', via: 'NH48 then SH177' },
    ],
    tips: [
      'Ring Road and Majura Gate face peak congestion 9–10 AM and 6–8 PM on weekdays — plan pickups accordingly',
      'NH48 (Surat-Mumbai) is a 6-lane expressway — excellent for outstation trips but toll-heavy; carry adequate cash or FASTag',
      'Saputara hill station (155 km) is best visited October–February; monsoon roads can be challenging',
      'Gujarat dry state: Alcohol not available; Daman (130 km) is the nearest non-prohibition zone for guests',
    ],
    stats: { population: '70 Lakh', knownFor: 'Diamond Polishing Capital, Textile Hub, Ghari & Locho, Fastest Growing City', airport: 'Surat Airport STV — 12 km from city center' },
    serviceIntros: {
      'car-rental':
        "Surat's diamond and textile industries generate high weekday corporate demand for airport transfers and inter-city trips to Ahmedabad and Mumbai. Innova Crysta and Swift Dzire lead bookings. Adajan, Vesu, and Athwa Lines are the busiest pickup zones. TransRentals has 80+ verified Surat vendors offering same-day bookings across all city zones.",
      'bike-on-rent':
        "Surat's flat terrain and dense residential zones make two-wheelers highly popular. Diamond traders and textile workers in Ring Road and Udhna areas rely on scooters for daily commuting. Honda Activa dominates city rentals. Royal Enfield is popular for Saputara and Daman weekend rides. TransRentals has bike rentals across Adajan, Vesu, Katargam, and Ring Road areas.",
      'bus-rental':
        "Surat's large diamond and textile worker community drives massive bus demand for group outings and pilgrimages. Udvada Atash Behram (Parsi fire temple, 50 km), Ambaji (250 km), and Somnath (350 km) pilgrimages are popular. Corporate team outings from SEZ and GIDC companies are a major segment. TransRentals offers 12-seater to 50-seater AC buses from Surat.",
      'packers-and-movers':
        "Surat's explosive growth — from 45 lakh in 2011 to over 70 lakh today — has created one of Gujarat's highest relocation volumes, driven by constant in-migration of diamond workers from Saurashtra and textile professionals from Rajasthan and UP. The most active move corridors are Katargam to Adajan, Udhna to Vesu, and Ring Road to Piplod, reflecting population shifts from industrial zones to newer residential townships. Peak shifting months are April–June (financial year-end, Gujarat government transfers) and September–October (post-monsoon new starts). Summer heat (43–45°C) demands early-morning loading (before 9 AM) to protect electronics and wooden furniture. Intercity moves to Ahmedabad (270 km), Vadodara (160 km), Mumbai (290 km), and Rajkot (250 km) are consistently active. TransRentals-verified movers cover Adajan, Vesu, Piplod, Althan, Pal, Dumas Road, Athwa Lines, Ghod Dod Road, Ring Road, Katargam, Udhna, Pandesara GIDC, Sachin GIDC, Kim, and Hazira. Get a free quote and book insured movers instantly.",
      'transporter':
        "Surat's massive Sachin GIDC, Hazira petrochemical belt, and the world's largest diamond processing industry generate constant commercial transport demand. Textile bales, diamond rough, petrochemical goods, and e-commerce last-mile from Surat's large fulfillment centers all require daily truck movement. TransRentals provides verified transporters from Tata Ace to 40-ft container trucks across Surat.",
      'jcb-on-rent':
        "Surat's rapid infrastructure expansion — metro rail project, Surat Diamond Bourse complex, and massive new residential developments in Vesu and Piplod — drives consistent JCB and excavator demand. Hazira port and industrial area construction are major users. TransRentals provides JCB 3DX backhoe loaders and excavators for construction projects across Surat.",
      'mini-truck-rental':
        "Surat's Ring Road textile market and Mahidharpura diamond market require constant Tata Ace and Bolero Pickup movement for goods delivery. Household shifting in high-density residential areas like Katargam and Adajan is another high-demand segment. TransRentals has same-day mini-truck bookings with verified drivers across all Surat zones.",
      'tempo-traveller':
        "Surat's diamond and textile worker community organizes frequent group pilgrimages to Ambaji (250 km), Somnath (350 km), and Dwarka (500 km). Corporate team outings from Hazira ONGC and SEZ companies to Saputara and Daman are popular. TransRentals offers AC 12–17 seater Tempo Travellers with Gujarat-experienced drivers from Surat.",
      'outstation-car-rental':
        "Outstation cabs from Surat cover Mumbai (290 km), Ahmedabad (270 km), Vadodara (160 km), Daman (130 km), Navsari (40 km), and Saputara (155 km). TransRentals per-km pricing with no hidden charges — available from all Surat zones with instant online booking.",
      'one-way-car-rental':
        "Surat's most popular one-way cab routes: Surat to Mumbai (290 km), Surat to Ahmedabad (270 km), Surat to Vadodara (160 km). No return charges on TransRentals one-way bookings — transparent pricing with toll and driver allowance included.",
      'airport-transfer':
        "Surat Airport (STV) is 12 km from Athwa Lines and 15 km from Adajan. TransRentals airport transfers offer fixed pre-booked pricing across all Surat zones. Airport to Ring Road starting from ₹500 for a sedan. 24/7 service, no surge pricing, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Surat's excellent NH48 connectivity to Vadodara (160 km), Ahmedabad (270 km), and Mumbai (290 km) makes it a strong self-drive hub. Weekend self-drives to Saputara (155 km via SH177) and Daman (130 km via NH48) are popular. TransRentals lists verified self-drive vendors in Adajan, Vesu, Athwa Lines, and near Surat Airport. Note: Gujarat is a dry state — no alcohol available; Daman is the nearest union territory where alcohol is permitted. Hatchbacks to SUVs available on daily and weekly plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best car for a Surat to Mumbai trip?', a: 'NH48 (Surat-Mumbai, 290 km, ~5 hrs) is a 6-lane expressway — a sedan (Honda City, Swift Dzire) is comfortable and fuel-efficient. For families of 5–6, book an Ertiga or Innova Crysta.' },
        { q: 'Is self-drive car rental available in Surat?', a: 'Yes, self-drive cars are available in Surat. You need a valid DL (min 1 year old), Aadhaar, and security deposit. Main vendors are in Adajan, Vesu, and Athwa Lines. NH48 outstation trips to Vadodara and Ahmedabad are commonly allowed.' },
        { q: 'What is the cab fare from Surat to Ahmedabad?', a: 'One-way cab from Surat to Ahmedabad (270 km via NH48, ~4.5 hrs) starts from ₹2,500 for a sedan. NH48 is smooth and toll-maintained — a comfortable half-day drive.' },
        { q: 'Are car rentals available in Surat during Navratri and Diwali?', a: 'Yes, but demand spikes significantly. Book at least 5–7 days in advance during Navratri (October) and Diwali. Diamond and textile businesses close, creating a surge in outstation travel to Ahmedabad and Mumbai.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Surat?', a: 'A 12-seater AC Tempo Traveller in Surat starts from ₹5,000+/day. A 20-seater mini bus for Ambaji (250 km, ~4.5 hrs) starts from ₹11,000+/day. For Somnath pilgrimages (350 km, ~6 hrs), 40-seater AC buses are available from ₹18,000+/day. Corporate group outings to Saputara (155 km) in a Tempo Traveller start from ₹7,500/day.' },
        { q: 'Which bus routes are most popular from Surat?', a: "Surat to Ambaji (250 km, ~4.5 hrs) is the most popular pilgrimage group route for Surat's large Gujarati community. Surat to Saputara (155 km, ~3.5 hrs) is the top leisure group route — Gujarat's only hill station. Surat to Somnath (350 km, ~6 hrs) is a high-demand pilgrimage route. Surat to Daman (130 km, ~2.5 hrs) is popular for corporate recreational trips." },
        { q: 'Can I hire a bus for a corporate outing or wedding in Surat?', a: "Yes, 20–50 seater AC buses are available for Surat corporate events and Gujarati weddings. Hazira ONGC, L&T, and Reliance petrochemical companies regularly book corporate outing buses. Gujarati wedding processions feature grand baraat buses starting from ₹15,000/day. Book 2–3 weeks in advance during Diwali wedding season (Oct–Nov)." },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Surat do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Surat localities — Adajan, Vesu, Piplod, Althan, Pal, Dumas Road, Athwa Lines, Ghod Dod Road, Ring Road, Katargam, Udhna, Pandesara GIDC, Sachin GIDC, Kim, Hazira, Amroli, Limbayat, Varachha, and Kamrej. Intercity moves to Ahmedabad, Vadodara, Mumbai, and Rajkot are available.' },
        { q: 'What is the most active move corridor in Surat?', a: "Katargam to Adajan is Surat's busiest move corridor, reflecting diamond workers upgrading from industrial-area housing to Adajan's modern residential zones. The Udhna–Vesu route is second — textile workers moving to newer Piplod and Vesu townships. Surat's rapidly expanding periphery means cross-city distances of 20–30 km are common, but Ring Road connectivity keeps transit times manageable at 35–60 minutes." },
        { q: 'When is the best time to shift house in Surat?', a: 'October–February is ideal — post-monsoon, cooler temperatures, stable business activity. Avoid April–June (extreme heat, government transfers). Diwali week in October–November sees city-wide activity pause — avoid scheduling moves on Diwali main day. Mid-month weekdays are consistently the most affordable and available slots.' },
        { q: 'How does Surat\'s migration-driven population growth affect moving demand?', a: 'Surat absorbs approximately 2–3 lakh new in-migrants annually, primarily from Saurashtra, Rajasthan, UP, and Bihar — diamond cutters, weavers, traders. This constant inflow creates sustained demand for furnished room-to-room micro-moves and small 1BHK shifts in Katargam, Udhna, and Varachha that is unlike any other Gujarat city. TransRentals movers handle these budget moves as efficiently as full household relocations.' },
        { q: 'How long does a 2BHK shift take within Surat?', a: "A standard 2BHK intra-Surat shift (packing + loading + transit + unloading) takes 6–9 hours with a 3-person team. Short same-zone moves (Adajan to Pal, or Vesu to Althan) take 5–7 hours. Cross-city moves (Katargam to Piplod, or Varachha to Dumas Road) can take 9–12 hours depending on Ring Road congestion." },
        { q: 'Can I move intercity from Surat to Ahmedabad, Mumbai, or Vadodara?', a: 'Yes — Surat to Ahmedabad (270 km via NH48, ~5 hrs truck), Surat to Vadodara (160 km via NH48, ~3 hrs), and Surat to Mumbai (290 km via NH48, ~5.5 hrs) are all popular intercity moves. NH48 is excellent — same-day Vadodara delivery is standard. Get a free quote on TransRentals for full household intercity pricing.' },
      ],
      'transporter': [
        { q: 'What goods are commonly transported by trucks in Surat?', a: "Surat's Sachin GIDC textile goods (synthetic fabrics, sarees), rough and polished diamonds from Mahidharpura and Varachha, and Hazira belt petrochemicals are the city's three largest truck cargo categories. E-commerce fulfillment from Surat's large logistics parks also drives significant Tata Ace and medium truck demand." },
        { q: 'What is the truck rental cost in Surat per day?', a: 'Tata Ace (1T) starts from ₹2,500/day. Tata 407 (5T) starts from ₹5,500/day. Container trucks for long-haul to Mumbai or Ahmedabad are quoted per trip based on route and load.' },
        { q: 'Is Sachin GIDC the main truck hub in Surat?', a: "Yes, Sachin GIDC and Pandesara GIDC are Surat's primary commercial truck hubs — hundreds of textile and chemical trucks depart daily. Hazira's port and LNG terminal add port-logistics demand. TransRentals has strong vendor coverage in both GIDC zones." },
      ],
      'tempo-traveller': [
        { q: 'What is the Tempo Traveller cost from Surat to Saputara?', a: 'AC 12-seater Tempo Traveller from Surat to Saputara (155 km, ~3.5 hrs via SH177) starts from ₹7,000 one-way. Popular for corporate team outings and family weekend trips. Best October–February.' },
        { q: 'Can I book a Tempo Traveller from Surat to Somnath?', a: 'Yes, Surat to Somnath (350 km, ~6 hrs) Tempo Traveller is popular for pilgrimage groups. A 12-seater AC vehicle for the one-way trip starts from ₹11,000. Round-trip Somnath-Dwaraka packages from Surat are available for 2-day circuits.' },
        { q: 'How many people can a Tempo Traveller carry in Surat?', a: '9, 12, 14, or 17-seater AC options are available in Surat. The 12-seater is most popular for Saputara corporate outings and pilgrimage circuits. The 17-seater suits large Hazira or SEZ corporate team groups. All intercity bookings include Gujarat-highway-experienced drivers.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Surat Airport to Adajan?', a: 'Pre-booked cab from Surat Airport (STV) to Adajan (14 km) starts from ₹450 on TransRentals. Fixed pricing — no surge even during late-night arrivals.' },
        { q: 'How long does it take from Surat Airport to Vesu?', a: 'Surat Airport to Vesu is 16–20 km and takes 30–45 minutes in normal traffic. Allow 60 minutes during peak evening hours (5–8 PM). Ring Road connects airport to Vesu efficiently.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Surat per day?', a: 'Hatchback self-drive in Surat starts from ₹849/day. Sedans (Honda City, Dzire) start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km.' },
        { q: 'Can I take a self-drive car from Surat to Mumbai or Vadodara?', a: 'Yes, NH48 allows outstation travel with most vendors. Vadodara (160 km, ~3 hrs) and Mumbai (290 km, ~5 hrs) are the most popular self-drive routes from Surat. Always confirm outstation permission at booking.' },
        { q: 'What documents are required for self-drive car rental in Surat?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). FASTag is strongly recommended for NH48 travel. Note: Gujarat is a dry state — no alcohol in rental vehicles.' },
      ],
    },
  },

  goa: {
    intro:
      "Goa, India's smallest state and top tourist destination with 15 lakh residents, has one of India's highest per-capita vehicle rental rates. The coastal highway network — NH66 and NH748 — connects all beaches from Querim in the north to Palolem in the south. December–February is peak season with tourist arrivals exceeding 7 lakh per month. TransRentals covers all Goa zones — North Goa (Panaji, Calangute, Baga, Anjuna), South Goa (Margao, Colva, Palolem), and the Goa International Airport area at Dabolim.",
    routes: [
      { to: 'Mumbai', distance: '600 km', duration: '10 hrs', via: 'NH66 Coastal' },
      { to: 'Pune', distance: '450 km', duration: '8 hrs', via: 'NH748 via Kolhapur' },
      { to: 'Bangalore', distance: '560 km', duration: '9 hrs', via: 'NH748' },
      { to: 'Hampi', distance: '340 km', duration: '6 hrs', via: 'NH67' },
      { to: 'Mangalore', distance: '350 km', duration: '6 hrs', via: 'NH66' },
      { to: 'Dudhsagar Falls', distance: '60 km', duration: '2 hrs', via: 'NH748' },
    ],
    tips: [
      'December–February peak season: Book rental vehicles at least 2–3 weeks in advance — availability tightens rapidly',
      'Avoid renting scooters without proper DL — traffic police conduct regular checks, especially on NH66',
      'Beach roads in North Goa (Calangute, Baga) are congested after 10 AM — plan morning drives for best experience',
      'For Dudhsagar Falls, book an SUV — the road beyond Kulem is unpaved and requires ground clearance',
    ],
    stats: { population: '15 Lakh', knownFor: 'Beaches, Portuguese Heritage, Carnival, Seafood, Nightlife', airport: 'Goa Intl GOI (Dabolim) — 30 km from Panaji' },
    serviceIntros: {
      'car-rental':
        "Goa's booming tourism economy makes it one of India's most active car rental markets year-round. Airport transfers from Dabolim and the Mopa airport (North Goa) are the highest-demand bookings. Innova Crysta and Ertiga dominate group travel; hatchbacks and compact SUVs serve couples and solo travelers. TransRentals covers all of North and South Goa with 60+ verified vendors for same-day bookings.",
      'bike-on-rent':
        "Goa is India's undisputed capital of scooter tourism — over 1 lakh two-wheelers are rented annually to domestic and foreign tourists. Scooters (Activa, Dio, Maestro) are the classic Goa beach-hopping vehicle. Royal Enfield and KTM are popular for rides to Dudhsagar, Hampi, and the coastal highway. TransRentals connects you to verified bike rental shops across Calangute, Baga, Anjuna, Panjim, and Margao.",
      'bus-rental':
        "Goa's high-volume tourism creates massive group bus demand for MICE events, incentive tours, and corporate off-sites. Wedding groups from Mumbai, Pune, and Delhi frequently hire luxury buses for destination weddings at Goa's beach resorts. School and college trips from Karnataka and Maharashtra are a major segment. TransRentals offers AC mini buses to 50-seater luxury coaches across all Goa zones.",
      'packers-and-movers':
        "Goa's relocation market is unique — driven by IT professionals from Bangalore and Mumbai relocating for remote work lifestyle, returning NRIs settling in Goa for retirement, and inter-state moves of hospitality workers. North Goa's Porvorim, Mapusa, and Candolim see the highest in-migration from tech hubs. Intra-Goa moves between North and South Goa (Panaji to Margao corridor) are common for government employees. TransRentals connects you with insured, verified movers across Panaji, Mapusa, Margao, Vasco, Porvorim, Candolim, Calangute, and all Goa localities.",
      'transporter':
        "Goa's Vasco da Gama port, Mormugao harbour, and the restaurant and hospitality supply chain generate commercial transport demand. Construction materials for Goa's booming luxury villa market and food/beverage distribution to beach shacks also drive daily truck movement. TransRentals provides verified transporters across Goa.",
      'tempo-traveller':
        "Goa's destination wedding industry and MICE tourism make tempo travellers essential for guest transfers between airports, hotels, and beach venues. North Goa sightseeing circuits — Old Goa churches, Aguada Fort, Calangute Beach, Anjuna Flea Market — are popular one-day group routes. TransRentals offers AC 9–17 seater Tempo Travellers with local Goa drivers.",
      'outstation-car-rental':
        "Outstation cabs from Goa cover Dudhsagar Falls (60 km), Hampi (340 km), Mangalore (350 km), Pune (450 km), and Mumbai (600 km via NH66). TransRentals per-km pricing with transparent billing — available from all Goa pickup points including both airports.",
      'one-way-car-rental':
        "Goa's most popular one-way routes: Goa to Bangalore (560 km via NH748), Goa to Mumbai (600 km via NH66), Goa to Pune (450 km). Pay only for the one-way trip — ideal for tourists flying in and returning by a different transport. Transparent pricing on TransRentals.",
      'airport-transfer':
        "Goa International Airport (GOI, Dabolim) is 30 km from Panaji and 4 km from Vasco. The new Mopa International Airport (GOX) serves North Goa, 35 km from Calangute. TransRentals airport transfers cover both airports with fixed pre-booked pricing to all Goa hotels and areas. Starting from ₹799 for a sedan. No surge pricing, 24/7 service, flight-tracking.",
      'self-drive-car-rentals':
        "Goa's compact geography and scenic coastal roads make self-drive one of the most liberating travel experiences in India. NH66 runs along the coast connecting all beaches — a single day's drive can cover Querim, Arambol, Vagator, Anjuna, Calangute, Baga, and Candolim. TransRentals lists verified self-drive vendors in Panaji, Calangute, Margao, and near Dabolim Airport. Scooters and bikes can also be self-driven with a valid DL. December–February: book at least 5–7 days in advance due to peak tourist demand.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Which is the best pickup zone for car rental in Goa?', a: 'Dabolim Airport, Panaji (Panjim), Calangute, and Margao are the main rental pickup hubs. For North Goa beach tourism, Calangute is most convenient. For South Goa, Margao is the base. Airport delivery is available from both Dabolim and Mopa airports.' },
        { q: 'What is the best way to explore both North and South Goa in 3 days?', a: 'Day 1: North Goa — Calangute, Baga, Anjuna, Vagator, Chapora Fort. Day 2: Old Goa Churches, Panjim Latin Quarter, Fort Aguada. Day 3: South Goa — Colva, Benaulim, Palolem. An Innova Crysta or Ertiga covers all zones comfortably.' },
        { q: 'Can I rent a car in Goa and drive to Bangalore or Mumbai?', a: 'Yes, intercity rentals to Bangalore (560 km via NH748) and Mumbai (600 km via NH66) are available. Both are scenic coastal and ghat highways but require 9–10 hours of driving. Confirm intercity permission with the vendor before booking.' },
        { q: 'Is it safe to drive in Goa at night?', a: 'Main roads (NH66, NH748, and state highways) are well-lit and safe at night. Be cautious on narrow village roads after dark. Do not drink and drive — Goa traffic police are strict, especially during Christmas and New Year period.' },
      ],
      'bike-on-rent': [
        { q: 'Which scooter is best for Goa tourism?', a: 'Honda Activa (110cc) and Honda Dio are the most popular and reliable scooters for Goa beach hopping. Durable, fuel-efficient, and easy to park on narrow beach access roads. Royal Enfield Classic 350 is ideal for longer coastal highway rides to Arambol or Palolem.' },
        { q: 'Is a DL required to rent a bike in Goa?', a: 'Yes, a valid Indian DL (minimum 1 year old) is mandatory to legally ride a rental bike in Goa. Traffic police conduct frequent checks on NH66 and beach roads. Foreign tourists need an IDP (International Driving Permit) valid for India.' },
        { q: 'What is the cost of scooter rental in Goa per day?', a: 'Scooters (Activa/Dio) in Goa start from ₹400–600/day during off-season (April–September) and ₹600–900/day during peak season (October–March). Royal Enfield rentals start from ₹1,200/day. Book in advance for December–January.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus for a Goa destination wedding?', a: 'A 12-seater AC Tempo Traveller for wedding guest transfers in Goa starts from ₹5,000+/day. A 20-seater luxury mini bus starts from ₹10,000+/day. 40–50 seater AC coaches for wedding group airport pickup start from ₹18,000/day. Book 3–4 weeks in advance for peak Dec–Feb season.' },
        { q: 'Can I hire a bus for a corporate incentive trip in Goa?', a: 'Yes, Goa is India\'s #1 MICE destination. AC coaches (20–50 seater) for incentive group transfers from Dabolim airport to North Goa beach resorts start from ₹8,000+ per trip. TransRentals handles entire fleet requirements for large corporate events.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Goa do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Goa localities — Panaji, Mapusa, Calangute, Candolim, Porvorim, Anjuna, Vagator, Vasco da Gama, Margao, Colva, Benaulim, Palolem, Quepem, Ponda, Bicholim, and Pernem. Intercity moves to Mumbai, Pune, Bangalore, and Hyderabad are also available.' },
        { q: 'What makes Goa\'s relocation market unique compared to other cities?', a: "Goa attracts a very specific relocation profile — remote-working IT professionals from Bangalore and Mumbai seeking lifestyle upgrades, NRIs returning from the Gulf and Europe for retirement, and hospitality industry workers from other states. The city's small size means many relocations are apartment-to-villa upgrades rather than the typical job-transfer moves common elsewhere." },
        { q: 'When is the best time to shift house in Goa?', a: 'April–September (off-season) is ideal — roads are quiet, rental rates are lower, and movers have better availability. The December–February peak season is the worst time to move — tourist traffic on all main roads causes massive delays and mover availability is minimal. Monsoon (June–September) brings heavy rain but road access is generally fine except for some interior village roads.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Goa per day?', a: 'Hatchback self-drive in Goa starts from ₹999/day in off-season and ₹1,499/day in peak season. SUVs (Creta, Brezza) from ₹1,799/day. Weekly packages available for longer stays. Most vendors are in Panaji, Calangute, and near Dabolim Airport.' },
        { q: 'Can I explore all Goa beaches in a self-drive car in 2–3 days?', a: 'Yes, Goa is compact — under 100 km from north to south. A self-drive hatchback can cover the full coastal stretch from Arambol (north) to Palolem (south) in 3 leisurely days. Rent from Panaji for the most central starting point.' },
        { q: 'What documents are needed for self-drive in Goa?', a: 'Original DL (minimum 1 year old), valid photo ID (Aadhaar/Passport), and refundable security deposit (₹2,000–₹5,000). For foreign nationals, an IDP (International Driving Permit) endorsed for India is required. Peak season (Dec–Feb) vendors are strict on documentation — carry originals, not photocopies.' },
      ],
      'tempo-traveller': [
        { q: 'What is the Tempo Traveller cost in Goa for a full-day sightseeing trip?', a: 'AC 12-seater Tempo Traveller in Goa for a full-day (8 hrs/80 km) North Goa sightseeing starts from ₹5,500/day. South Goa circuits start from ₹4,500/day. Full Goa coverage (both north + south) in a day starts from ₹7,500.' },
        { q: 'Can I book a Tempo Traveller from Goa Airport for a wedding group?', a: 'Yes, wedding group airport pickups from Dabolim and Mopa airports are the most common Tempo Traveller bookings in Goa. Pre-book at least 2 weeks in advance for December–February peak wedding season. AC 12–17 seater with a professional driver available.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Goa Airport (Dabolim) to Calangute?', a: 'Pre-booked cab from Dabolim Airport to Calangute (42 km, ~1 hr) starts from ₹900 for a sedan on TransRentals. Fixed pricing — no surge even during midnight arrivals.' },
        { q: 'How long does it take from Dabolim Airport to North Goa beaches?', a: 'Dabolim to Calangute/Baga is 42–48 km and takes 55–75 minutes via NH66. To Anjuna or Vagator, add another 10–15 minutes. Traffic near Panaji bridge can add 20 minutes during peak hours.' },
      ],
    },
  },

  patna: {
    intro:
      "Patna, Bihar's capital and one of the world's oldest continuously inhabited cities with 25 lakh residents, is the commercial and administrative hub for India's third most populous state. As the gateway to the Buddhist circuit — Bodh Gaya, Rajgir, Nalanda, and Vaishali — Patna sees substantial domestic and international tourist traffic. The NH19 (Patna-Kolkata) and NH30 (Patna-Ranchi) are key arteries. TransRentals covers all Patna zones — Boring Road, Bailey Road, Kankarbagh, Rajendra Nagar, Patna Sahib, and the Jay Prakash Narayan Airport area.",
    routes: [
      { to: 'Bodh Gaya', distance: '115 km', duration: '2.5 hrs', via: 'NH139' },
      { to: 'Rajgir', distance: '100 km', duration: '2.5 hrs', via: 'NH82' },
      { to: 'Nalanda', distance: '90 km', duration: '2 hrs', via: 'NH82' },
      { to: 'Varanasi', distance: '250 km', duration: '5 hrs', via: 'NH19' },
      { to: 'Kolkata', distance: '590 km', duration: '10 hrs', via: 'NH19' },
      { to: 'Vaishali', distance: '55 km', duration: '1.5 hrs', via: 'NH22' },
    ],
    tips: [
      'Bodh Gaya is 115 km from Patna via NH139 — an easy 2.5-hour drive, perfect for a day trip',
      'Patna Sahib Gurudwara and Mahavir temple are major pilgrimage sites within the city — morning traffic is heavy',
      'November–February is Bihar\'s best travel season for the Buddhist circuit — book vehicles in advance',
      'Ganges-river fog (December–January) can reduce highway visibility significantly — plan for extra journey time',
    ],
    stats: { population: '25 Lakh', knownFor: 'Ancient Pataliputra, Buddhist Circuit Gateway, Ganga Ghats, Patna Sahib', airport: 'Jay Prakash Narayan PAT — 6 km from city center' },
    serviceIntros: {
      'car-rental':
        "Patna is Bihar's administrative and commercial nerve center, with strong demand for airport transfers, inter-city government travel, and Buddhist circuit tours. Innova Crysta and Swift Dzire lead bookings. Boring Road and Bailey Road are the primary pickup zones. TransRentals has verified Patna vendors covering all city zones including Patna Sahib and the airport area.",
      'bike-on-rent':
        "Patna's dense urban lanes and growing youth culture make two-wheelers popular for daily commuting. Scooters (Activa, Jupiter) are the mainstay for city riding. Royal Enfield is available for intercity rides to Bodh Gaya and Rajgir. TransRentals has bike rentals across Boring Road, Kankarbagh, and Rajendra Nagar areas.",
      'bus-rental':
        "Patna serves as the launch point for Bihar's Buddhist and Hindu pilgrimage circuits. Group buses to Bodh Gaya (115 km), Rajgir–Nalanda (100 km), and Vaishali (55 km) are the most popular bookings. Government department annual outings and school excursions are also a major segment. TransRentals offers AC Tempo Travellers and buses from Patna.",
      'packers-and-movers':
        "Patna's relocation market is driven by Bihar government transfers (the largest employer), bank and PSU postings, and a growing private sector. Government residential colonies in Kankarbagh, Rajendra Nagar, and Bailey Road generate the highest move volume during the April–June transfer cycle. Corporate and IT professionals in Patna's emerging tech zones on Boring Road and Moin ul Haq Stadium area are also an active segment. Key intercity moves: Patna to Delhi (1,000 km via NH19), Patna to Kolkata (590 km via NH19), Patna to Ranchi (330 km via NH139), and Patna to Varanasi (250 km via NH19). Bihar's road quality has improved significantly in recent years but some district routes can be challenging. TransRentals-verified movers cover Boring Road, Bailey Road, Kankarbagh, Rajendra Nagar, Patna Sahib, Digha, Anisabad, Phulwari Sharif, Danapur, Bankipur, Ashok Rajpath, and Fraser Road. Book insured movers and get a free quote online.",
      'transporter':
        "Patna's APMC grain market, Patliputra Industrial Area, and distribution role for all of Bihar generate substantial commercial transport demand. Agricultural goods, FMCG products, and construction materials move daily from Patna to Bihar's 38 districts. TransRentals offers mini trucks to large commercial vehicles for intra-city and inter-district freight from Patna.",
      'jcb-on-rent':
        "Patna's rapid infrastructure expansion — Patna Metro construction, Ganga bridge projects, and Bihar government smart city initiatives — drives JCB and excavator demand. New township development in Danapur and Phulwari Sharif are active zones. TransRentals provides JCB 3DX and excavators for construction projects across Patna.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Patna's Patna City market deliveries and household shifting across all city zones. Intra-city moves between Kankarbagh and Bailey Road are the most common bookings. TransRentals has same-day mini-truck bookings with verified drivers across Patna.",
      'tempo-traveller':
        "Patna is the natural base for Bihar's Buddhist circuit — group tours to Bodh Gaya (115 km), Rajgir (100 km), Nalanda (90 km), and Vaishali (55 km) are extremely popular among domestic and international pilgrims. TransRentals offers AC 9–17 seater Tempo Travellers with Bihar-experienced drivers from Patna.",
      'outstation-car-rental':
        "Outstation cabs from Patna cover the full Buddhist circuit: Bodh Gaya (115 km), Nalanda (90 km), Rajgir (100 km), Vaishali (55 km), and farther destinations like Varanasi (250 km) and Ranchi (330 km). TransRentals offers transparent per-km pricing with verified drivers and instant online booking.",
      'one-way-car-rental':
        "Patna's popular one-way routes: Patna to Bodh Gaya (115 km), Patna to Varanasi (250 km), Patna to Ranchi (330 km), Patna to Kolkata (590 km). Transparent pricing on TransRentals — toll and driver allowance included.",
      'airport-transfer':
        "Jay Prakash Narayan Airport (PAT) is just 6 km from the city center — one of India's closest major airports to city center. TransRentals airport transfers cover all Patna zones at fixed pre-booked prices. Airport to Boring Road starting from ₹350 for a sedan. 24/7 service, no surge pricing.",
      'self-drive-car-rentals':
        "Patna's improving road network and the excellent NH139 to Bodh Gaya (115 km) make self-drive a viable and popular option for independent travelers exploring the Buddhist circuit. NH19 to Varanasi (250 km) is also popular. TransRentals lists verified self-drive vendors in Boring Road, Bailey Road, and near Patna Airport. Hatchbacks to SUVs available on daily plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best way to cover the Buddhist circuit from Patna?', a: 'Book a 2-day taxi package: Day 1 — Patna to Bodh Gaya (115 km, ~2.5 hrs) via Nalanda (90 km). Day 2 — Rajgir (100 km from Patna), Vaishali (55 km). An Innova Crysta or Ertiga is ideal for a group of 4–6. TransRentals offers guided Buddhist circuit packages.' },
        { q: 'What is the cab cost from Patna to Bodh Gaya?', a: 'One-way cab from Patna to Bodh Gaya (115 km via NH139, ~2.5 hrs) starts from ₹1,200 for a sedan. Bodh Gaya is an ideal day trip from Patna — return journey adds ₹1,000–₹1,200 more.' },
        { q: 'Is airport transfer available from Patna Airport?', a: 'Yes, Patna Airport (PAT) is just 6 km from the city center. Pre-booked TransRentals airport cabs offer fixed pricing. Airport to Boring Road/Bailey Road starts from ₹350 for a sedan. No surge on pre-booked rides.' },
        { q: 'What road conditions should I expect on the Buddhist circuit?', a: 'NH139 (Patna to Bodh Gaya) and NH82 (Patna to Rajgir-Nalanda) are in good condition — well-maintained national highways. Some stretches through Gaya district have ongoing widening work that may cause 30–45 minute delays. Allow extra time during Bihar bandh days.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Patna?', a: 'A 12-seater AC Tempo Traveller in Patna starts from ₹4,500+/day. A 20-seater bus for Bodh Gaya (115 km) starts from ₹8,000+/day for a group trip. For a full Buddhist circuit (Bodh Gaya + Rajgir + Nalanda, 2-day), a 20-seater AC bus is available from ₹15,000+. Vaishali day trip (55 km) in a Tempo Traveller starts from ₹4,000.' },
        { q: 'Which group travel routes are most popular from Patna?', a: 'Patna to Bodh Gaya (115 km, ~2.5 hrs) is the most popular group travel route — international Buddhist pilgrims from Japan, Sri Lanka, Thailand, and Myanmar travel in groups. Rajgir–Nalanda circuit (100 km, ~2.5 hrs) is second most popular. Vaishali (55 km, ~1.5 hrs) — birthplace of Buddhism and Jainism — is a popular half-day group excursion.' },
        { q: 'Can I hire a bus for a government department outing or school trip in Patna?', a: 'Yes, Bihar government departments and Patna schools regularly book AC buses for annual outings. 20–45 seater AC buses are available for Rajgir Nature safari, Bodh Gaya, and Vaishali circuits. Book 5–7 days in advance for large groups.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Patna do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Patna localities — Boring Road, Bailey Road, Kankarbagh, Rajendra Nagar, Patna Sahib, Digha, Anisabad, Phulwari Sharif, Danapur, Bankipur, Ashok Rajpath, Fraser Road, Gardanibagh, Mithapur, Khajpura, and the entire Patna Urban Agglomeration. Intercity moves to Delhi, Kolkata, Ranchi, and Varanasi are available.' },
        { q: 'When is the Bihar government transfer season and how does it affect moving demand?', a: 'Bihar government transfers peak in April–June — IAS, IPS, district administration, and state government services issue annual posting orders simultaneously. This creates the highest moving demand in Patna, with all slots for trucks and movers booking out fast. Book at least 2 weeks in advance if your move falls in April or May. The second demand spike is August–September (judicial and educational transfers).' },
        { q: 'What is the most common move corridor in Patna?', a: "Kankarbagh to Bailey Road and Rajendra Nagar to Boring Road are Patna's busiest intra-city corridors, reflecting government employees moving from older colony zones to newer residential areas. The Phulwari Sharif and Danapur suburban zones are the fastest-growing destinations as Patna expands westward along the Patna-Ara bypass." },
        { q: 'How long does a 2BHK shift take within Patna?', a: "A standard 2BHK intra-Patna shift takes 6–9 hours with a 3-person team. Short same-zone moves (Boring Road to Bailey Road) take 5–7 hours. Patna's dense colony areas can have narrow gali access — always specify your colony name and lane width when booking so the right vehicle size is deployed." },
        { q: 'Can I move intercity from Patna to Delhi, Kolkata, or Ranchi?', a: 'Yes — Patna to Delhi (1,000 km via NH19, ~18 hrs truck), Patna to Kolkata (590 km via NH19, ~10 hrs), and Patna to Ranchi (330 km via NH139, ~6 hrs) are all available. Bihar-to-Delhi moves are among the most common inter-state relocations in eastern India. Get a free quote on TransRentals.' },
      ],
      'tempo-traveller': [
        { q: 'What is the Tempo Traveller cost for the Buddhist circuit from Patna?', a: 'AC 12-seater Tempo Traveller for Bodh Gaya + Nalanda + Rajgir (2-day circuit) from Patna starts from ₹12,000 for the full trip. Single-day Bodh Gaya visit starts from ₹5,000.' },
        { q: 'Can I book a Tempo Traveller for a Vaishali day trip from Patna?', a: 'Yes, Vaishali (55 km, ~1.5 hrs via NH22) is an easy Tempo Traveller half-day trip from Patna. The 12-seater round trip including waiting time starts from ₹4,000.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Patna per day?', a: 'Hatchback self-drive in Patna starts from ₹799/day. Sedans start from ₹999/day. Packages include 150–200 km. NH139 (Patna to Bodh Gaya) is in good condition and ideal for self-drive day trips.' },
        { q: 'What documents are needed for self-drive in Patna?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a security deposit of ₹2,000–₹3,000. Bihar police checkposts are common on intercity routes — always carry RC and insurance documents along with your DL.' },
      ],
    },
  },

  bhubaneswar: {
    intro:
      "Bhubaneswar, Odisha's capital and the 'Temple City of India' with 10 lakh residents, is a rapidly growing smart city that balances ancient heritage with modern infrastructure. Home to over 700 ancient temples, the Puri-Konark-Bhubaneswar Golden Triangle is one of India's most iconic tourism circuits. IT parks at Infocity and Chandrasekharpur, new townships in Patia and Nayapalli, and the Biju Patnaik International Airport anchor the economy. TransRentals covers all Bhubaneswar zones — Saheed Nagar, Nayapalli, Chandrasekharpur, Infocity, Patia, and the Airport area.",
    routes: [
      { to: 'Puri', distance: '60 km', duration: '1.5 hrs', via: 'NH316' },
      { to: 'Konark', distance: '65 km', duration: '1.5 hrs', via: 'NH316 then Marine Drive' },
      { to: 'Cuttack', distance: '30 km', duration: '45 min', via: 'NH16' },
      { to: 'Chilika Lake', distance: '100 km', duration: '2.5 hrs', via: 'NH316' },
      { to: 'Kolkata', distance: '440 km', duration: '7.5 hrs', via: 'NH16' },
      { to: 'Visakhapatnam', distance: '450 km', duration: '7.5 hrs', via: 'NH16' },
    ],
    tips: [
      'Puri, Konark, and Bhubaneswar Golden Triangle can be covered in a single day — start by 6 AM',
      'Chilika Lake boat rides (Satpada and Rambha entry points) are best October–February for Irrawaddy dolphins',
      'Rath Yatra in Puri (June–July) draws 10–15 lakh pilgrims — book vehicles weeks in advance',
      'NH16 to Kolkata and Visakhapatnam is a well-maintained expressway — smooth highway driving',
    ],
    stats: { population: '10 Lakh', knownFor: 'Temple City of India, Golden Triangle, Smart City, IT Hub', airport: 'Biju Patnaik BBI — 5 km from city center' },
    serviceIntros: {
      'car-rental':
        "Bhubaneswar's position at the center of Odisha's Golden Triangle (Puri, 60 km; Konark, 65 km) makes it one of eastern India's busiest tourist car rental hubs. IT professionals at Infocity and government workers are the largest weekday rental segments. TransRentals has verified Bhubaneswar vendors covering Saheed Nagar, Nayapalli, Chandrasekharpur, and the Airport zone.",
      'bike-on-rent':
        "Bhubaneswar's wide, clean roads and grid-pattern smart city layout make it one of eastern India's most bike-friendly cities. IT professionals in Infocity and Chandrasekharpur are the biggest daily rental users. Royal Enfield is popular for rides to Puri and Konark. TransRentals has bike rentals across all Bhubaneswar localities.",
      'bus-rental':
        "Bhubaneswar serves as the hub for Odisha's extensive temple and wildlife tourism. Group buses for the Puri-Konark circuit, Chilika Lake, and Simlipal Tiger Reserve (300 km) are in high demand. Government department outings and IT company team trips are active segments. TransRentals offers AC Tempo Travellers and buses from Bhubaneswar.",
      'packers-and-movers':
        "Bhubaneswar's rapid transformation from state capital to a full-fledged IT and smart city hub has significantly accelerated relocation demand. Odisha government transfers peak in April–June, moving civil servants between the major residential colonies — IRC Village, Nayapalli, Saheed Nagar, and Acharya Vihar. IT professionals at Infocity (Tata Consultancy, Infosys, Tech Mahindra) moving to new Patia and Chandrasekharpur townships account for the fastest-growing relocation segment. Common move corridors: Cuttack to Bhubaneswar (30 km, most common cross-city move in Odisha), Saheed Nagar to Patia, and Nayapalli to Chandrasekharpur. Intercity moves: Bhubaneswar to Kolkata (440 km), Bhubaneswar to Visakhapatnam (450 km), and Bhubaneswar to Raipur (380 km). TransRentals-verified movers cover Saheed Nagar, Nayapalli, IRC Village, Acharya Vihar, Patia, Chandrasekharpur, Infocity, Khandagiri, Mancheswar, Rasulgarh, Damana, Old Town, and Cuttack. Book insured movers and get a free quote online.",
      'transporter':
        "Bhubaneswar's Mancheswar and Rasulgarh industrial areas, IDCO (Odisha Industrial Infrastructure Development Corporation) zones, and active construction boom generate commercial transport demand. E-commerce last-mile distribution for all of coastal Odisha runs out of Bhubaneswar logistics hubs. TransRentals offers mini trucks to container vehicles for freight movement across Odisha.",
      'jcb-on-rent':
        "Bhubaneswar's Smart City Mission projects, metro rail construction, and massive new township development in Patia and Damana drive consistent JCB demand. Nava Bharat Nagar residential projects and AIIMS Bhubaneswar campus expansion are major construction users. TransRentals provides JCB 3DX and excavators for all Bhubaneswar construction zones.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Bhubaneswar's Unit 1 and Master Canteen market deliveries and household shifting across all zones. Cuttack-to-Bhubaneswar moves are the single most frequent mini-truck route in Odisha. TransRentals has same-day mini-truck bookings with verified drivers across Bhubaneswar.",
      'tempo-traveller':
        "Bhubaneswar is the launch base for Odisha's most popular group travel circuits — Puri-Konark Golden Triangle, Chilika Lake, and Simlipal Tiger Reserve. Jagannath Rath Yatra pilgrimage group buses from Bhubaneswar to Puri are extremely popular. TransRentals offers AC 9–17 seater Tempo Travellers with Odisha-experienced drivers.",
      'outstation-car-rental':
        "Outstation cabs from Bhubaneswar cover Puri (60 km), Konark (65 km), Cuttack (30 km), Chilika Lake (100 km), Kolkata (440 km), and Visakhapatnam (450 km). TransRentals per-km pricing with no hidden charges — available from all Bhubaneswar zones with instant online booking.",
      'one-way-car-rental':
        "Bhubaneswar's most popular one-way cab routes: Bhubaneswar to Puri (60 km), Bhubaneswar to Kolkata (440 km), Bhubaneswar to Visakhapatnam (450 km). Transparent pricing on TransRentals.",
      'airport-transfer':
        "Biju Patnaik International Airport (BBI) is just 5 km from the city center — among India's most centrally located airports. TransRentals airport transfers cover all Bhubaneswar zones at fixed prices. Airport to Saheed Nagar starting from ₹350 for a sedan. 24/7 service, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Bhubaneswar's well-planned grid road network, smart city infrastructure, and excellent NH16 and NH316 highways make it ideal for self-drive. The Puri-Konark Marine Drive — one of India's most scenic coastal roads — is a top self-drive experience. TransRentals lists verified self-drive vendors in Nayapalli, Saheed Nagar, Chandrasekharpur, and near Biju Patnaik Airport. Hatchbacks to SUVs available on daily plans.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'Can I cover Puri, Konark, and Bhubaneswar temples in a single day?', a: 'Yes, the Golden Triangle circuit is ideal for a day trip: Start at Bhubaneswar temples (Lingaraj, Mukteshwar, Rajarani) by 7 AM, drive to Konark (65 km) by 9 AM, then Puri Beach and Jagannath Temple by noon. Return to Bhubaneswar by 6 PM. Book a sedan or SUV with TransRentals.' },
        { q: 'What is the cab cost from Bhubaneswar to Puri?', a: 'One-way cab from Bhubaneswar to Puri (60 km via NH316, ~1.5 hrs) starts from ₹800 for a sedan. Round-trip Puri day trip starts from ₹1,500. Booking in advance ensures driver availability.' },
        { q: 'Is airport transfer available from Biju Patnaik Airport, Bhubaneswar?', a: 'Yes, TransRentals offers pre-booked airport pickups from BBI (just 5 km from city). Airport to Nayapalli/Saheed Nagar starts from ₹350 for a sedan. Fixed pricing, 24/7 service.' },
        { q: 'What is the best car for a trip to Chilika Lake from Bhubaneswar?', a: 'A sedan or SUV works well for the Bhubaneswar to Chilika Lake trip (100 km via NH316, ~2.5 hrs). For Satpada entry point (boat ride for Irrawaddy dolphins), a standard sedan is perfectly adequate.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Bhubaneswar?', a: 'A 12-seater AC Tempo Traveller in Bhubaneswar starts from ₹4,500+/day. A 20-seater mini bus for Puri–Konark day circuit starts from ₹8,000+/day. For Simlipal Tiger Reserve (300 km, ~6 hrs), 20-seater AC buses start from ₹14,000+/day. Chilika Lake group trip (100 km) in a Tempo Traveller starts from ₹5,000/day.' },
        { q: 'Can I book a bus for Jagannath Rath Yatra pilgrimage from Bhubaneswar to Puri?', a: 'Yes, Rath Yatra (June–July) sees massive group movement from Bhubaneswar to Puri (60 km). 20–50 seater AC and non-AC buses are available. Book 3–4 weeks in advance — slots fill very quickly. The Bhubaneswar-Puri NH316 is widened and managed for Rath Yatra traffic.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Bhubaneswar do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Bhubaneswar and greater Cuttack localities — Saheed Nagar, Nayapalli, IRC Village, Acharya Vihar, Patia, Chandrasekharpur, Infocity, Khandagiri, Mancheswar, Rasulgarh, Damana, Old Town, Unit 1–9, Jayadev Vihar, Bomikhal, CDA Colony, and all sectors of Bhubaneswar Development Authority (BDA) zones. Intercity moves to Cuttack, Kolkata, Visakhapatnam, and Raipur are available.' },
        { q: 'What is the most common move corridor in Bhubaneswar?', a: 'Cuttack to Bhubaneswar is the single most active move corridor in Odisha — as Bhubaneswar has grown from a planned capital to a full commercial city, thousands of Cuttack residents and government officers have relocated annually. Within Bhubaneswar, the Saheed Nagar/Nayapalli to Patia and Chandrasekharpur IT corridor is the busiest intra-city move route, driven by IT professionals relocating to be closer to Infocity.' },
        { q: 'When is the Odisha government transfer season?', a: 'Odisha government annual transfers are issued March–May, with the actual movement happening April–June. IAS, IPS, Odisha Civil Service, and state secretariat postings all move during this window. This is the peak shifting season for Bhubaneswar movers — book at least 10–14 days in advance for April and May slots.' },
        { q: 'How long does a 2BHK shift take within Bhubaneswar?', a: "A standard 2BHK intra-Bhubaneswar shift takes 6–8 hours with a 3-person team. Bhubaneswar's planned grid layout and wide roads (BDA-designed sectors) make transit faster than older unplanned cities. The longest cross-city moves (Old Town to Patia, or Mancheswar to Chandrasekharpur) still rarely exceed 8–9 hours." },
        { q: 'Can I move intercity from Bhubaneswar to Kolkata or Visakhapatnam?', a: 'Yes — Bhubaneswar to Kolkata (440 km via NH16, ~7.5 hrs truck), Bhubaneswar to Visakhapatnam (450 km via NH16, ~7.5 hrs), and Bhubaneswar to Raipur (380 km via NH353, ~7 hrs) are popular intercity routes. NH16 coastal expressway is in excellent condition. Get a free quote on TransRentals.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Bhubaneswar?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Puri–Konark Golden Triangle full-day circuit starts from ₹6,000. Chilika Lake day trip (100 km) starts from ₹5,000. Simlipal Tiger Reserve (300 km) overnight starts from ₹12,000.' },
        { q: 'Can I book a Tempo Traveller for a Konark Sun Temple visit from Bhubaneswar?', a: 'Yes, Bhubaneswar to Konark (65 km via NH316 then Marine Drive, ~1.5 hrs) is a popular Tempo Traveller route — often combined with Puri for a full-day Golden Triangle circuit. A 12-seater round trip for Konark alone starts from ₹4,500.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Bhubaneswar per day?', a: 'Hatchback self-drive in Bhubaneswar starts from ₹799/day. Sedans start from ₹1,099/day. Packages include 150–200 km; extra km at ₹12–15/km. NH316 (Bhubaneswar to Puri and Konark) is smooth — ideal for self-drive day trips.' },
        { q: 'What are the best self-drive routes from Bhubaneswar?', a: 'Puri via NH316 (60 km, ~1.5 hrs), Konark via Marine Drive (65 km, ~1.5 hrs — one of India\'s most scenic coastal drives), and Chilika Lake via Satpada (100 km, ~2.5 hrs) are the top self-drive routes. All roads are in excellent condition.' },
        { q: 'What documents are needed for self-drive in Bhubaneswar?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a security deposit of ₹2,000–₹4,000. Fuel policy is full-to-full. Petrol stations are abundant on NH16 and NH316.' },
      ],
    },
  },

  vadodara: {
    intro:
      "Vadodara (Baroda), Gujarat's cultural capital with 21 lakh residents, is a city of royal heritage, thriving education, and rapidly growing industrial output. The Maharaja Sayajirao University, Laxmi Vilas Palace, and the Vadodara Museum anchor the city's cultural identity. GIDC Makarpura, GIDC Gorwa, and the Padra industrial belt are major commercial drivers. The Ahmedabad-Vadodara Expressway (NH48) makes Vadodara the most accessible tier-2 city in Gujarat. TransRentals covers all Vadodara zones — Alkapuri, Akota, Gotri Road, Race Course, Manjalpur, and the Vadodara Airport area.",
    routes: [
      { to: 'Ahmedabad', distance: '110 km', duration: '1.5 hrs', via: 'NH48 Expressway' },
      { to: 'Surat', distance: '160 km', duration: '3 hrs', via: 'NH48' },
      { to: 'Anand', distance: '40 km', duration: '45 min', via: 'NH48' },
      { to: 'Champaner-Pavagadh', distance: '50 km', duration: '1 hr', via: 'NH64' },
      { to: 'Mumbai', distance: '430 km', duration: '7 hrs', via: 'NH48' },
      { to: 'Rajkot', distance: '230 km', duration: '4 hrs', via: 'NH27' },
    ],
    tips: [
      'NH48 Ahmedabad-Vadodara Expressway is one of India\'s finest — 110 km in under 90 minutes with FASTag',
      'Champaner-Pavagadh UNESCO World Heritage Site (50 km) is ideal for a half-day day trip from Vadodara',
      'Vadodara gets heavy rains in monsoon (June–September) — Harni area and low-lying roads flood easily',
      'Gujarat dry state: Alcohol not available in Vadodara or on any highway route within Gujarat',
    ],
    stats: { population: '21 Lakh', knownFor: "Cultural Capital of Gujarat, Laxmi Vilas Palace, MSU, Baroda's Royal Heritage", airport: 'Vadodara Airport BDQ — 5 km from city center' },
    serviceIntros: {
      'car-rental':
        "Vadodara's large university population, industrial base at GIDC Makarpura, and position between Ahmedabad and Surat on NH48 create diverse rental demand. Laxmi Vilas Palace, Champaner-Pavagadh, and VADODARA circuits are popular with tourists. TransRentals has verified Vadodara vendors covering Alkapuri, Akota, Gotri Road, and the Airport zone for same-day bookings.",
      'bike-on-rent':
        "Vadodara's student community from MSU and Parul University, combined with a compact city layout, make two-wheelers very popular. Honda Activa and TVS Jupiter dominate daily commuter rentals. Royal Enfield is available for Champaner-Pavagadh and Pavagadh fort rides. TransRentals has bike rentals across Alkapuri, Manjalpur, and Race Course areas.",
      'bus-rental':
        "Vadodara's large academic community and industrial workforce drive strong group travel demand. Pilgrimages to Champaner-Pavagadh (50 km) and Ambaji (200 km), and MSU convocation group transport are popular bookings. GIDC Makarpura and Gorwa industrial company outings are a major segment. TransRentals offers AC Tempo Travellers and buses from Vadodara.",
      'packers-and-movers':
        "Vadodara's relocation market is driven by three distinct segments: GIDC industrial transfers (executives and managers moving between Vadodara, Ahmedabad, and Surat), MSU and educational institution staff relocations, and government service postings. The strongest move corridors are Manjalpur to Gotri Road, Waghodia Road to Akota, and the old Baroda City area to new Sama-Savli township. Annual government transfer season peaks April–June. Key intercity routes: Vadodara to Ahmedabad (110 km via NH48 Expressway, ~1.5 hrs — Gujarat's most frequent intercity move), Vadodara to Surat (160 km via NH48), and Vadodara to Mumbai (430 km via NH48). The expressway makes same-day Ahmedabad moves routine. Gujarat summer heat (April–June, 42–45°C) demands early-morning loading. TransRentals-verified movers cover Alkapuri, Akota, Gotri Road, Race Course, Manjalpur, Waghodia Road, Sama, Sama-Savli Road, Subhanpura, Nizampura, Makarpura GIDC, Gorwa GIDC, Padra, Karelibaug, Fatehgunj, Pratapnagar, and Sayajigunj. Book insured movers and get a free quote online.",
      'transporter':
        "Vadodara's GIDC Makarpura (chemicals, engineering), GIDC Gorwa (plastics, pharma), and Padra industrial belt (pharmaceuticals) generate Gujarat's third-largest commercial transport demand after Ahmedabad and Surat. The Ahmedabad-Vadodara-Surat-Mumbai corridor is one of India's busiest industrial freight routes. TransRentals provides verified transporters for intra-city and intercity freight from Vadodara.",
      'jcb-on-rent':
        "Vadodara's rapid residential expansion along Gotri Road, Waghodia Road, and the new Sama-Savli township zone drives consistent JCB demand. Smart City Vadodara infrastructure projects and GIDC industrial estate expansion are major construction users. TransRentals provides JCB 3DX backhoe loaders and excavators for construction projects across Vadodara.",
      'mini-truck-rental':
        "Tata Ace and Bolero Pickup serve Vadodara's Lehripura market deliveries and household shifting between residential zones. Intra-city moves between Manjalpur and Gotri Road are the most frequent bookings. TransRentals has same-day mini-truck bookings with verified drivers across all Vadodara zones.",
      'tempo-traveller':
        "Vadodara is the ideal base for the Champaner-Pavagadh UNESCO Heritage Site (50 km), a top day-trip circuit for groups. Pilgrimages to Ambaji (200 km) and corporate team outings to Anand (40 km) and Amul Dairy are popular Tempo Traveller routes. TransRentals offers AC 9–17 seater Tempo Travellers with Gujarat-experienced drivers from Vadodara.",
      'outstation-car-rental':
        "Outstation cabs from Vadodara cover Ahmedabad (110 km), Surat (160 km), Champaner-Pavagadh (50 km), Anand (40 km), Rajkot (230 km), and Mumbai (430 km). TransRentals per-km pricing with transparent billing — available from all Vadodara zones with instant online booking.",
      'one-way-car-rental':
        "Vadodara's most popular one-way routes: Vadodara to Ahmedabad (110 km), Vadodara to Surat (160 km), Vadodara to Mumbai (430 km). The NH48 Expressway makes Ahmedabad one-ways the most convenient intercity one-way trip in Gujarat. Transparent pricing on TransRentals.",
      'airport-transfer':
        "Vadodara Airport (BDQ) is just 5 km from Alkapuri — among Gujarat's most centrally located airports. TransRentals airport transfers cover all Vadodara zones at fixed pre-booked prices. Airport to Alkapuri starting from ₹300 for a sedan. 24/7 service, no surge pricing, flight-tracking for arrivals.",
      'self-drive-car-rentals':
        "Vadodara's excellent NH48 Expressway to Ahmedabad (110 km, under 90 min) and Surat (160 km, ~3 hrs) makes it one of Gujarat's best self-drive cities. The NH64 to Champaner-Pavagadh UNESCO site (50 km) is a scenic and easy self-drive route. TransRentals lists verified self-drive vendors in Alkapuri, Akota, Gotri Road, and near Vadodara Airport. Note: Gujarat is a dry state — no alcohol in rental vehicles. FASTag required for NH48 expressway travel.",
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the best route from Vadodara to Ahmedabad?', a: 'NH48 Ahmedabad-Vadodara Expressway is ideal — 110 km in under 90 minutes with FASTag. One of India\'s smoothest expressway drives. Avoid Sundays (especially evenings) when return traffic from Ahmedabad can slow down the Vadodara toll approach.' },
        { q: 'What is the cab cost from Vadodara to Surat?', a: 'One-way cab from Vadodara to Surat (160 km via NH48, ~3 hrs) starts from ₹1,500 for a sedan. NH48 is an excellent 6-lane highway — smooth and fast.' },
        { q: 'Is self-drive car rental available in Vadodara?', a: 'Yes, self-drive cars are available. You need a valid DL (min 1 year old), Aadhaar, and security deposit. NH48 expressway to Ahmedabad and Surat is commonly allowed. Main vendors are in Alkapuri and near Vadodara Airport.' },
        { q: 'Can I visit Champaner-Pavagadh as a day trip from Vadodara?', a: 'Yes, Champaner-Pavagadh UNESCO World Heritage Site (50 km via NH64, ~1 hr) is Vadodara\'s best day trip. Book a sedan or SUV — the site involves some walking and ropeway. Ideal departure time: 7 AM for a leisurely half-day visit.' },
      ],
      'bus-rental': [
        { q: 'What is the cost of hiring a bus in Vadodara?', a: 'A 12-seater AC Tempo Traveller in Vadodara starts from ₹4,500+/day. A 20-seater mini bus for Ambaji (200 km, ~4 hrs) starts from ₹9,000+/day. For Champaner-Pavagadh group day trips (50 km), a Tempo Traveller starts from ₹4,000/day. MSU convocation and college outing buses are available at competitive rates.' },
        { q: 'Which bus routes are most popular from Vadodara?', a: 'Vadodara to Champaner-Pavagadh (50 km, ~1 hr) is the most popular heritage circuit group route. Vadodara to Ambaji (200 km, ~4 hrs) is the top pilgrimage group route for Vadodara\'s large Gujarati community. Vadodara to Anand (40 km, ~45 min) including Amul Dairy visit is a popular corporate outing and educational group route.' },
        { q: 'Can I hire a bus for an MSU function or corporate event in Vadodara?', a: 'Yes, Maharaja Sayajirao University (MSU) events, corporate GIDC industry outings, and Gujarati weddings are common bus booking segments. AC buses (20–50 seater) available from ₹8,000+/day. Gujarati wedding baraat buses start from ₹15,000/day. Book 2–3 weeks in advance for Navratri and Diwali season.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Vadodara do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Vadodara localities — Alkapuri, Akota, Gotri Road, Race Course, Manjalpur, Waghodia Road, Sama, Sama-Savli Road, Subhanpura, Nizampura, Makarpura GIDC, Gorwa GIDC, Padra, Karelibaug, Fatehgunj, Pratapnagar, and Sayajigunj. Intercity moves to Ahmedabad, Surat, Anand, Rajkot, and Mumbai are available.' },
        { q: 'Why is Vadodara to Ahmedabad the most common intercity move in Gujarat?', a: 'Vadodara and Ahmedabad are just 110 km apart on NH48 Expressway, connected in under 90 minutes. Executives at GIDC Makarpura and Gorwa frequently transfer to Ahmedabad\'s GIFT City or Naroda industrial zones, or vice versa. Students completing degrees at MSU Vadodara often relocate to Ahmedabad for employment. Same-day delivery is standard for Vadodara-Ahmedabad intercity moves, making it the most logistically efficient intercity move in Gujarat.' },
        { q: 'When is the best time to shift house in Vadodara?', a: 'October–February is ideal — post-monsoon, cooler weather (Vadodara summer hits 44°C). Avoid April–June (extreme heat, GIDC and government transfers creating peak demand). August–September sees moderate activity as government academic transfers for universities finalize. Mid-month weekdays are consistently the most affordable and available.' },
        { q: 'How does Vadodara\'s industrial character affect moving needs?', a: 'GIDC Makarpura (chemicals, fertilizers, pharmaceuticals) and GIDC Gorwa (plastics, engineering) involve specialized industrial relocations — executive families moving with imported furniture and high-value electronics. These moves require white-glove handling, air-conditioned loading periods during summer, and secure transit. TransRentals movers experienced with GIDC-area executive relocations are specifically listed for this requirement.' },
        { q: 'How long does a 2BHK shift take within Vadodara?', a: "A standard 2BHK intra-Vadodara shift takes 6–8 hours with a 3-person team. Vadodara's well-planned road network (particularly the Akota Bridge area and Race Course Road) keeps transit times short. The longest cross-city moves (Manjalpur to Sama-Savli) rarely exceed 9 hours. Colonial-era bungalow areas near Sayajigunj may require narrower vehicles for lane access." },
        { q: 'Can I move intercity from Vadodara to Ahmedabad, Surat, or Mumbai?', a: 'Yes — Vadodara to Ahmedabad (110 km via NH48, ~2 hrs truck, same-day), Vadodara to Surat (160 km via NH48, ~3 hrs, same-day delivery standard), and Vadodara to Mumbai (430 km via NH48, ~8 hrs truck) are all popular. The entire Gujarat-Mumbai corridor on NH48 is in outstanding condition. Get a free quote on TransRentals.' },
      ],
      'transporter': [
        { q: 'What goods are commonly transported by trucks in Vadodara?', a: "Vadodara's GIDC Makarpura chemical and fertilizer units (fertilizers, dyes, specialty chemicals), Gorwa plastics and engineering goods, and Padra pharmaceutical cluster are the three largest freight categories. Indian Oil Corporation's Koyali refinery (15 km from Vadodara) drives significant bulk liquid tanker movement." },
        { q: 'What is the truck rental cost in Vadodara per day?', a: 'Tata Ace (1T) starts from ₹2,500/day. Tata 407 (5T) starts from ₹5,500/day. For Ahmedabad (110 km) and Surat (160 km) same-day deliveries, per-trip pricing is standard.' },
      ],
      'tempo-traveller': [
        { q: 'What is the cost of Tempo Traveller rental in Vadodara?', a: '12-seater AC Tempo Traveller starting from ₹4,500/day for local trips. Champaner-Pavagadh UNESCO heritage circuit (50 km, half-day) starts from ₹4,000. Ambaji pilgrimage (200 km, ~4 hrs) one-way starts from ₹8,000.' },
        { q: 'Can I book a Tempo Traveller for a Champaner-Pavagadh trip?', a: 'Yes, Vadodara to Champaner-Pavagadh (50 km via NH64, ~1 hr) is Vadodara\'s most popular heritage group trip. A 12-seater round trip with 3 hours waiting starts from ₹5,000. Ideal for college groups, cultural society trips, and corporate heritage outings.' },
      ],
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Vadodara per day?', a: 'Hatchback self-drive in Vadodara starts from ₹799/day. Sedans start from ₹1,099/day. SUVs start from ₹1,499/day. Packages include 150–200 km. NH48 expressway travel is allowed with most vendors.' },
        { q: 'Can I self-drive from Vadodara to Ahmedabad on the expressway?', a: 'Yes, NH48 Ahmedabad-Vadodara Expressway is the most popular self-drive route from Vadodara — 110 km in under 90 minutes. FASTag is required. Confirm expressway outstation permission with your vendor before booking.' },
        { q: 'What documents are required for self-drive in Vadodara?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹4,000). FASTag strongly recommended for NH48 expressway. Gujarat is a dry state — no alcohol in rental vehicles.' },
      ],
      'airport-transfer': [
        { q: 'How much is a cab from Vadodara Airport to Alkapuri?', a: 'Pre-booked cab from Vadodara Airport (BDQ) to Alkapuri (5 km) starts from ₹280 on TransRentals. Fixed pricing — no surge. Vadodara Airport is among Gujarat\'s most centrally located, making transfers quick and affordable.' },
        { q: 'How long does it take from Vadodara Airport to Gotri Road or Manjalpur?', a: 'Vadodara Airport to Gotri Road is 10–12 km and takes 20–30 minutes. To Manjalpur (18 km) takes 30–40 minutes in normal traffic. The airport\'s central location keeps all zone transfers under 45 minutes.' },
      ],
      'bike-on-rent': [
        { q: 'Which bike is best for daily commute in Vadodara?', a: 'Honda Activa and TVS Jupiter are ideal for Vadodara daily commuting — excellent on the wide Race Course Road, Alkapuri Ring Road, and Gotri Road corridors. The city\'s broad colonial-era boulevards make scooters and bikes very comfortable.' },
        { q: 'Can I rent a Royal Enfield in Vadodara for a weekend trip?', a: 'Yes, Royal Enfield Classic 350 is available from Vadodara for weekend rides. Pavagadh Hill (50 km via NH64) and the Narmada river valley road are popular local rides. Daman (200 km via NH53) is a weekend destination for coastal riders.' },
        { q: 'What documents are needed to rent a bike in Vadodara?', a: 'Valid DL (minimum 1 year old), Aadhaar or Passport, and a refundable security deposit of ₹1,500–₹3,000. Gujarat police checkposts are active on NH48 — carry DL and documents. Note: Gujarat is a dry state — no alcohol on rental vehicles.' },
      ],
    },
  },

  noida: {
    intro: 'Noida is one of NCR\'s fastest-growing IT and corporate hubs, with massive demand for cab services, airport transfers, and outstation car rentals. The city\'s Expressway connectivity — Yamuna Expressway, Noida-Greater Noida Expressway, and NH58 — makes road travel highly efficient. Corporate campuses in Sectors 62, 63, and 132 generate large-scale daily cab requirements. Weekend road trips to Agra, Jaipur, Mathura, and the Himalayan foothills are extremely popular among Noida residents.',
    routes: [
      { to: 'Agra', distance: '210 km', duration: '3.5 hrs', via: 'Yamuna Expressway' },
      { to: 'Jaipur', distance: '270 km', duration: '4.5 hrs', via: 'NH48' },
      { to: 'Mathura', distance: '155 km', duration: '2.5 hrs', via: 'Yamuna Expressway' },
      { to: 'Haridwar', distance: '230 km', duration: '4 hrs', via: 'NH58' },
      { to: 'Dehradun', distance: '290 km', duration: '5 hrs', via: 'NH58' },
      { to: 'Nainital', distance: '310 km', duration: '6 hrs', via: 'NH9' },
    ],
    tips: [
      'Book early morning slots (5–7 AM) for Yamuna Expressway trips — minimal toll congestion',
      'FASTag mandatory on Yamuna Expressway and NH48 — ensure vendor vehicle is equipped',
      'Noida Sectors 62 and 63 have designated cab pickup zones outside office campuses',
      'Avoid Noida-Delhi border at Mayur Vihar and Ashram Chowk during peak hours (8–10 AM, 6–9 PM)',
    ],
    stats: { population: '6.4 Lakh', knownFor: 'IT parks, Film City, corporate hubs', airport: 'Indira Gandhi International Airport, Delhi (45 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Noida with a professional driver is the preferred choice for corporate employees, airport transfers, and outstation trips via Yamuna Expressway. TransRentals provides Swift, Innova, Ertiga, and Crysta with experienced chauffeurs familiar with Noida\'s expressway grid and NCR traffic patterns.',
      'self-drive-car-rentals': 'Self-drive car rentals in Noida are ideal for weekend escapes on the Yamuna Expressway to Agra and Mathura. Hatchbacks start from ₹899/day, SUVs from ₹1,899/day. Vendors in Sectors 62, 18, and Greater Noida offer doorstep delivery with FASTag-equipped vehicles.',
      'bike-on-rent': 'Bike rentals in Noida are popular among IT professionals for daily commuting within sectors. Honda Activa from ₹299/day. Royal Enfield available for Yamuna Expressway weekend rides to Agra.',
      'airport-transfer': 'Noida to IGI Airport (45–55 km via DND Flyway or NH24) takes 60–90 minutes. Pre-booked fixed-rate airport cabs from ₹1,299. Night flight transfers available 24/7 with TransRentals.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Noida per day?', a: 'Hatchback (Swift/WagonR) with driver starts from ₹999/day for local use in Noida. Sedan (Dzire/Amaze) starts from ₹1,299/day. Innova Crysta starts from ₹2,499/day. For outstation Agra via Yamuna Expressway, packages start from ₹3,499 for a full day (350 km limit).' },
        { q: 'Is there a cab service from Noida to IGI Airport?', a: 'Yes, pre-booked cabs from Noida to IGI Airport start from ₹1,299 for a hatchback. The fastest route is via DND Flyway → NH24 → Ring Road (~45 km, 60–90 min). Night transfers available at no extra charge. Fixed rates — no surge pricing.' },
        { q: 'Can I book a cab from Noida to Agra for a day trip?', a: 'Noida to Agra (210 km via Yamuna Expressway) is the most popular day trip from Noida. A round trip with driver (Sedan) starts from ₹3,499. Yamuna Expressway is a 6-lane premium highway — the 210 km journey takes ~3.5 hours. FASTag required.' },
        { q: 'Which car is best for a Noida to Jaipur road trip?', a: 'Innova Crysta or Ertiga are recommended for Noida to Jaipur (270 km via NH48, ~4.5 hrs) — comfortable on long highway stretches. Package starts from ₹4,999 with driver. Gurugram-Jaipur stretch on NH48 has excellent road quality and regular fuel stops.' },
        { q: 'Are outstation cabs available from Noida to Haridwar and Rishikesh?', a: 'Yes, Noida to Haridwar (230 km via NH58, ~4 hrs) and Rishikesh (260 km, ~4.5 hrs) are very popular weekend routes. Packages start from ₹4,499 round trip with driver. Best booked Thursday night for Friday morning departures to avoid NH58 weekend traffic.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Noida do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Noida sectors — Sector 62, 63, 137, 150, Greater Noida, Indirapuram, Vaishali, Kaushambi, and Noida Extension (Greater Noida West). Cross-NCR moves to Delhi, Gurugram, Faridabad, and Ghaziabad are all available.' },
        { q: 'What is the most common move corridor in Noida?', a: 'Noida Sector 62 to Greater Noida West and Delhi (South/West) to Noida are the busiest corridors, driven by IT professionals switching jobs between NCR tech hubs. End-of-financial-year (March–April) is peak season — book at least 7–10 days in advance.' },
        { q: 'Can I move intercity from Noida to other cities?', a: 'Yes — Noida to Jaipur (270 km via NH48), Noida to Lucknow (500 km via NH19), and Noida to Mumbai (1,500 km) intercity moves are available. Full-truck-load door-to-door packages with packing and transit insurance. Get a free quote on TransRentals.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Noida?', a: 'JCB backhoe loaders from ₹3,499/day, hydraulic excavators from ₹4,500/day, cranes, generators (15–500kVA), road rollers, and concrete mixers. Noida Expressway infrastructure, YEIDA plots, and massive residential towers in Sectors 137 and 150 keep equipment in constant demand.' },
        { q: 'What is the most in-demand construction equipment in Noida?', a: 'Tower cranes and hydraulic excavators dominate Noida\'s equipment demand, driven by high-rise residential construction in Sectors 137, 150, and Greater Noida West. Yamuna Expressway Industrial Development Authority (YEIDA) projects and data centre construction in Sector 62 also require large earthmoving equipment year-round.' },
        { q: 'How far in advance should I book construction equipment in Noida?', a: 'For standard JCB and excavators, 48–72 hours is sufficient. For cranes and large machinery near Noida Expressway or metro corridor, book 5–7 days ahead. NMRC metro line construction zones require NMRC NOC before excavation work — arrange permits before scheduling deployment.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Noida per day?', a: 'Tata Ace (750 kg) starts from ₹1,599/day in Noida. Bolero Pickup (1.5 ton) from ₹2,099/day. Driver included. Helper on request at ₹350 extra. Same-day bookings available across Sectors 18, 62, and Greater Noida.' },
        { q: 'Can I rent a mini truck for house shifting in Noida?', a: 'Yes, mini trucks are ideal for 1BHK and studio apartment shifts in Noida. Common routes: Sector 62 to Greater Noida West, Indirapuram to Noida Sector 137, and Noida to Delhi cross-NCR moves. Driver included; helpers available on request.' },
        { q: 'What goods are commonly transported by mini trucks in Noida?', a: 'IT equipment and office furniture from Sector 62/63 tech parks, e-commerce last-mile deliveries from Noida\'s large Flipkart and Amazon fulfilment centres, and shop stock from Noida Sector 18 mall corridor are the most frequent mini truck use cases.' },
      ],
    },
  },

  gurugram: {
    intro: 'Gurugram (Gurgaon) is the corporate capital of the NCR, home to Fortune 500 companies, multinational offices, and India\'s largest business parks along Golf Course Road and Cyber City. Demand for premium cab services, airport transfers, and chauffeur-driven corporate cars is among the highest in India. NH48 provides seamless connectivity to Jaipur, while IGI Airport is just 15–20 minutes away. Weekend drives to Sariska, Neemrana, and Rajasthan hill forts are extremely popular among Gurugram professionals.',
    routes: [
      { to: 'Jaipur', distance: '270 km', duration: '4.5 hrs', via: 'NH48' },
      { to: 'Neemrana', distance: '120 km', duration: '2 hrs', via: 'NH48' },
      { to: 'Sariska', distance: '200 km', duration: '3 hrs', via: 'NH48 → SH25' },
      { to: 'Agra', distance: '230 km', duration: '3.5 hrs', via: 'Yamuna Expressway' },
      { to: 'Alwar', distance: '160 km', duration: '2.5 hrs', via: 'NH48 → NH248' },
      { to: 'Chandigarh', distance: '270 km', duration: '4 hrs', via: 'NH44' },
    ],
    tips: [
      'NH48 Gurugram-Jaipur stretch has good quality roads but heavy trucks at night — depart early morning',
      'IGI Airport is just 15–20 km from Cyber City — easiest airport access in NCR',
      'Cyber City and Golf Course Road have surge pricing during morning/evening rush — book cabs 30 min early',
      'Rajasthan highway toll booths accept FASTag — ensure rental vehicles are FASTag equipped',
    ],
    stats: { population: '15 Lakh', knownFor: 'Cyber City, corporate hubs, DLF malls', airport: 'Indira Gandhi International Airport, Delhi (15 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Gurugram with a professional driver is the standard for corporate commutes, client pickups, and executive transfers between Cyber City, Udyog Vihar, and IGI Airport. TransRentals provides Innova Crysta, Toyota Camry, and Mercedes E-Class for corporate accounts, and Swift/Ertiga for regular office cabs.',
      'self-drive-car-rentals': 'Self-drive car rentals in Gurugram are popular for weekend escapes on NH48 to Neemrana, Jaipur, and Sariska. Sedans from ₹999/day, SUVs from ₹1,799/day. Delivery available to DLF Phase 1–5, Sohna Road, and Golf Course Extension Road.',
      'airport-transfer': 'Gurugram to IGI Airport transfers (15–20 km via NH48) start from ₹699. Fixed pricing for all terminals (T1, T2, T3). Night transfers available 24/7. Corporate account billing available for businesses.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Gurugram per day?', a: 'Hatchback (Swift/WagonR) with driver starts from ₹999/day. Sedan (Dzire) starts from ₹1,299/day. Innova Crysta starts from ₹2,499/day. Executive sedans (Toyota Camry, BMW 3-Series) available from ₹4,999/day for corporate requirements.' },
        { q: 'What is the cab fare from Gurugram to IGI Airport?', a: 'Pre-booked cab from Gurugram (Cyber City/DLF areas) to IGI Airport starts from ₹699 for a hatchback. Distance is 15–20 km via NH48, taking 20–35 minutes in normal traffic. Night trips (midnight–5 AM) have same fixed rates — no surge.' },
        { q: 'Can I book a corporate car rental subscription in Gurugram?', a: 'Yes, TransRentals offers monthly corporate car rental packages for Gurugram businesses. Dedicated driver + vehicle packages start from ₹30,000/month (8 hrs/80 km per day). Employee shuttle services for IT parks in Sector 44, Udyog Vihar, and Manesar also available.' },
        { q: 'Which is the best cab for a Gurugram to Jaipur trip?', a: 'Innova Crysta or Ertiga are best for Gurugram to Jaipur (270 km via NH48, ~4.5 hrs). Package starts from ₹4,999 round trip. NH48 is a 6-lane expressway with good fuel availability. Neemrana Fort (120 km) is a popular midpoint stop.' },
        { q: 'Is a chauffeur-driven car available in Gurugram for weddings and events?', a: 'Yes, luxury chauffeur-driven cars including Mercedes E-Class, BMW 5-Series, and Toyota Vellfire are available in Gurugram. Wedding packages start from ₹8,999. Decorated cars and convoy bookings available with advance notice of 72 hours.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Gurugram do TransRentals movers cover?', a: 'TransRentals-verified movers cover all Gurugram zones — Cyber City, DLF Phase 1–5, Sohna Road, Golf Course Extension, Sector 56, Palam Vihar, Manesar, and New Gurugram sectors. Cross-NCR moves to Delhi, Noida, Faridabad, and Ghaziabad available.' },
        { q: 'When is the busiest moving season in Gurugram?', a: 'May–June (MNC annual transfer cycle) and March–April (financial year-end) are peak months in Gurugram. High-rise society moves require service lift booking 48–72 hours in advance with the RWA. Book movers at least 7 days ahead during peak season.' },
        { q: 'Can I move intercity from Gurugram to Jaipur or other cities?', a: 'Yes — Gurugram to Jaipur (270 km via NH48), Gurugram to Chandigarh (270 km via NH44), and Gurugram to Mumbai (1,400 km) intercity moves are all available. Full-truck-load packages with packing, dedicated truck, and transit insurance. Free quote on TransRentals.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Gurugram?', a: 'JCB backhoe loaders from ₹3,499/day, hydraulic excavators, cranes, generator sets (15–500kVA), and road rollers. DLF high-rise construction, SPR and NH48 infrastructure, and Manesar industrial zone projects generate constant year-round equipment demand.' },
        { q: 'Are cranes available for high-rise construction in Gurugram?', a: 'Yes, tower cranes for DLF residential towers and mobile cranes for Cyber City commercial construction are available. Book 5–7 days in advance for crane deployments. Sites near Rapid Metro corridor or Golf Course Road require prior NOC — confirm with the site engineer before scheduling.' },
        { q: 'How do I book a generator for an outdoor event in Gurugram?', a: 'Generator sets (15kVA–500kVA) available for corporate events, DLF mall activations, and outdoor exhibitions. Silent DG sets preferred for Cyber Hub and residential society events. Book 24–48 hours in advance on TransRentals. All gensets come with certified operator.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Gurugram per day?', a: 'Tata Ace (750 kg) starts from ₹1,699/day in Gurugram. Bolero Pickup (1.5 ton) from ₹2,199/day. Driver included. Pickup zones: Sector 29, Cyber City, DLF Phase 1–4, and Sohna Road. Same-day bookings available.' },
        { q: 'Can I rent a mini truck for office shifting in Gurugram?', a: 'Yes, mini trucks are the most common vehicle for IT office furniture and equipment shifting within Gurugram\'s DLF and Cyber City tech parks. For larger office moves, book 2–3 mini trucks for same-day completion. Helper on request at ₹350/person extra.' },
        { q: 'What goods are commonly transported by mini trucks in Gurugram?', a: 'Corporate office relocations from Cyber City and Udyog Vihar, retail stock movement in Gurugram\'s malls (MGF Metropolitan, DLF Mega Mall), and courier last-mile from DTDC and Delhivery hubs in Udyog Vihar are the most frequent mini truck use cases in Gurugram.' },
      ],
    },
  },

  dehradun: {
    intro: 'Dehradun is the gateway city to Uttarakhand\'s famous hill stations and pilgrimage circuits, making it one of North India\'s busiest car rental hubs. The city serves as the starting point for Mussoorie, Rishikesh, Haridwar, Auli, and the Char Dham yatra. With the Delhi-Dehradun Expressway reducing travel time significantly, weekend trip demand has surged. Corporate demand from ONGC, FRI, and ISRO Dehradun further drives the cab and outstation rental market.',
    routes: [
      { to: 'Mussoorie', distance: '35 km', duration: '1 hr', via: 'Mussoorie Road' },
      { to: 'Haridwar', distance: '55 km', duration: '1.5 hrs', via: 'NH58' },
      { to: 'Rishikesh', distance: '45 km', duration: '1 hr', via: 'NH58' },
      { to: 'Auli', distance: '270 km', duration: '7 hrs', via: 'NH58 → NH7' },
      { to: 'Delhi', distance: '300 km', duration: '5 hrs', via: 'NH58 / Expressway' },
      { to: 'Nainital', distance: '290 km', duration: '6 hrs', via: 'NH109' },
    ],
    tips: [
      'Mussoorie road from Dehradun has traffic congestion on weekends — depart before 7 AM',
      'NH58 to Haridwar is a 4-lane highway — fast and smooth, ideal for airport transfers',
      'Char Dham yatra (May–June) spikes car rental demand — book at least 2 weeks in advance',
      'Jolly Grant Airport is 30 km from city centre — book pre-paid airport cabs to avoid auto overcharging',
    ],
    stats: { population: '7.1 Lakh', knownFor: 'Gateway to hill stations, ONGC HQ, FRI campus', airport: 'Jolly Grant Airport (30 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Dehradun with a driver is essential for navigating the hilly terrain to Mussoorie, Landour, and Chakrata. TransRentals provides experienced mountain-road drivers familiar with the steep Mussoorie ghats. Swift, Bolero, and Innova available for local and outstation Dehradun trips.',
      'self-drive-car-rentals': 'Self-drive car rentals in Dehradun are available for the Haridwar-Rishikesh valley road and Mussoorie day trips. Hatchbacks from ₹799/day. Note: Mussoorie hill roads require prior driving experience — consider a driver for first-timers.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Dehradun per day?', a: 'Hatchback with driver starts from ₹1,099/day in Dehradun. Innova Crysta (best for hilly roads) starts from ₹2,799/day. For a Dehradun–Mussoorie–Dehradun full day trip with driver, packages start from ₹1,800 (including toll and driver allowance).' },
        { q: 'Is a cab available from Dehradun to Mussoorie?', a: 'Yes, Dehradun to Mussoorie (35 km, ~1 hr via Mussoorie Road) is the most booked route in Dehradun. One-way starts from ₹700, round trip with 4 hours waiting from ₹1,400. Library Chowk drop available. Cab drivers are experienced on the mountain ghat road.' },
        { q: 'Can I book a car from Dehradun for the Char Dham yatra?', a: 'Yes, TransRentals offers dedicated Char Dham yatra packages from Dehradun — 10–12 day itineraries covering Yamunotri, Gangotri, Kedarnath (road), and Badrinath. Innova Crysta or Bolero recommended. Packages start from ₹28,000 per vehicle for a complete circuit. Book at least 3 weeks before the yatra season (May–June).' },
        { q: 'How long does it take from Dehradun to Haridwar by cab?', a: 'Dehradun to Haridwar is 55 km via NH58 and takes approximately 1.5 hours in normal traffic. NH58 is a 4-lane national highway — excellent road condition. One-way fare starts from ₹899. Early morning departures for Ganga Aarti (6 AM at Har Ki Pauri) should depart Dehradun by 4:30 AM.' },
        { q: 'What is the cab fare from Jolly Grant Airport to Dehradun city?', a: 'Pre-booked cab from Jolly Grant Airport to Dehradun city centre (30 km, ~40 min via Rishikesh Bypass) starts from ₹699. Fixed airport rates — no negotiation. Mussoorie drop from airport starts from ₹1,499. Night transfer available 24/7.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas do TransRentals movers cover in Dehradun?', a: 'TransRentals movers cover all Dehradun zones — Rajpur Road, Saharanpur Road, Haridwar Road, Prem Nagar, Clement Town, Ballupur, Dalanwala, and Mussoorie Road. Intercity moves to Delhi (300 km), Haridwar (55 km), and Chandigarh (230 km) available.' },
        { q: 'What is the best time to shift house in Dehradun?', a: 'October–February is ideal — clear weather, comfortable temperatures. Avoid monsoon (July–September) when road access to Mussoorie Road and Rajpur Road can be compromised by landslides. March–April (ONGC/government transfers) and May–June (hill schools semester change) are peak booking periods — book 10 days ahead.' },
        { q: 'Can I move intercity from Dehradun to Delhi?', a: 'Yes, Dehradun to Delhi (300 km via NH58, ~5.5 hrs truck) is the most booked intercity route. Full-truck-load door-to-door service with packing and transit insurance starts from ₹9,000 for a 1BHK. Get a free quote on TransRentals.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Dehradun?', a: 'JCB backhoe loaders from ₹3,499/day, excavators, generators, cranes, and road rollers. Dehradun\'s rapid residential development in Saharanpur Road and Ballupur corridors, ONGC Dehradun campus projects, and smart city work keep equipment in consistent demand.' },
        { q: 'Are mini excavators available in Dehradun for narrow lane utility work?', a: 'Yes, mini excavators (1–5 ton) are ideal for Dehradun\'s narrow Mussoorie Road and Old Rajpur Road utility trenching. Starting from ₹3,500/day with operator. Book 48–72 hours in advance for standard excavators; 5 days ahead for larger machines near the Haridwar Road bypass.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Dehradun per day?', a: 'Tata Ace starts from ₹1,499/day in Dehradun. Bolero Pickup from ₹1,999/day. Driver included. Helpful for small household shifts between Rajpur Road and Prem Nagar or Saharanpur Road zones.' },
        { q: 'Can I rent a mini truck for shifting goods to Mussoorie from Dehradun?', a: 'Yes, but note Mussoorie road is a ghat — the final 12 km (from Rajpur to Mussoorie Library Chowk) is steep with sharp bends. Mini trucks can navigate this but take 30–45 min for the last stretch. Verify with the driver before booking for Mussoorie delivery.' },
      ],
    },
  },

  jodhpur: {
    intro: 'Jodhpur, the Blue City of Rajasthan, is a major tourism and heritage hub that generates significant car rental demand for fort visits, desert safaris, and Rajasthan circuit road trips. The city is the gateway to Jaisalmer, Bikaner, and the Thar Desert. Wedding season (October–February) drives substantial demand for luxury and vintage car rentals. NH62 and NH25 provide excellent connectivity to Jaipur, Jaisalmer, and Udaipur.',
    routes: [
      { to: 'Jaisalmer', distance: '290 km', duration: '4.5 hrs', via: 'NH62' },
      { to: 'Udaipur', distance: '250 km', duration: '4 hrs', via: 'NH62' },
      { to: 'Jaipur', distance: '340 km', duration: '5.5 hrs', via: 'NH62' },
      { to: 'Bikaner', distance: '250 km', duration: '4 hrs', via: 'NH62' },
      { to: 'Mount Abu', distance: '265 km', duration: '4.5 hrs', via: 'NH325' },
      { to: 'Pushkar', distance: '215 km', duration: '3.5 hrs', via: 'NH62' },
    ],
    tips: [
      'Jaisalmer road (NH62) has limited fuel stations after Sam Sand Dunes — refuel at Pokaran',
      'Mehrangarh Fort area has restricted vehicle entry — hire a local auto or walk from Sardar Market',
      'Monsoon (July–September) brings flash floods on desert roads — check NH62 status before Jaisalmer trip',
      'Wedding car bookings require 2–4 weeks advance notice during peak season (Nov–Feb)',
    ],
    stats: { population: '11.3 Lakh', knownFor: 'Mehrangarh Fort, Blue City, Rajasthani cuisine, royal heritage', airport: 'Jodhpur Airport (5 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Jodhpur with a driver is the recommended way to explore Mehrangarh Fort, Umaid Bhawan Palace, Jaswant Thada, and the Mandore Gardens. TransRentals provides experienced drivers who know the narrow lanes of the old Blue City and the desert highway to Jaisalmer and Bikaner.',
      'self-drive-car-rentals': 'Self-drive car rentals in Jodhpur are popular for the Jodhpur-Jaisalmer-Jodhpur desert circuit. SUVs (Bolero, Thar) recommended for desert roads. Available from ₹1,099/day. Verify vendor\'s outstation policy for crossing into deep desert areas.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Jodhpur per day?', a: 'Hatchback with driver starts from ₹1,099/day in Jodhpur. Innova Crysta starts from ₹2,799/day. For Jaisalmer (290 km, one way), package starts from ₹4,499. Rajasthan circuit packages (Jodhpur–Jaisalmer–Bikaner–Jodhpur) start from ₹12,000 for 3 days.' },
        { q: 'Can I book a cab from Jodhpur to Jaisalmer?', a: 'Jodhpur to Jaisalmer (290 km via NH62, ~4.5 hrs) is the most popular outstation route. One-way cab starts from ₹4,499 (Sedan). NH62 is a good 4-lane highway until Pokaran — the last 100 km is 2-lane. Bolero or Innova recommended for desert terrain.' },
        { q: 'Are vintage and luxury cars available for weddings in Jodhpur?', a: 'Yes, Jodhpur is Rajasthan\'s premier wedding destination. Vintage cars (Ambassador, Jeep) and luxury cars (Mercedes, Audi) are available for baraat processions and airport pickups. Wedding packages start from ₹5,000 for vintage Ambassador to ₹15,000 for Mercedes E-Class. Book 3–4 weeks in advance during peak wedding season.' },
        { q: 'Is a cab available from Jodhpur Airport to the city?', a: 'Pre-booked cab from Jodhpur Airport (5 km from city centre) starts from ₹350. Journey is about 15 minutes. Fixed rates — no overcharging. Hotels near Mehrangarh Fort (old city) take 20–25 minutes due to narrow lanes.' },
        { q: 'Can I book a cab for a Jodhpur to Udaipur day trip?', a: 'Jodhpur to Udaipur (250 km via NH62, ~4 hrs) is a popular one-day or overnight trip covering two of Rajasthan\'s most beautiful cities. Full-day package with driver starts from ₹4,299. The route passes through Ranakpur (Jain temples, 160 km) — an excellent midpoint stop.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Jodhpur do TransRentals movers cover?', a: 'TransRentals movers cover all Jodhpur zones — Sardarpura, Ratanada, Shastri Nagar, Chopasni Housing Board, Paota, Pal Road, and Mandore. Intercity moves to Jaipur (340 km), Udaipur (250 km), and Jaisalmer (290 km) available.' },
        { q: 'What is the best time to shift house in Jodhpur?', a: 'October–February is ideal — cooler desert climate. Avoid April–June (extreme heat up to 45°C). Jodhpur\'s wedding season (Nov–Feb) means moving crew availability is reduced on peak wedding dates — check calendar. Mid-month weekdays are most affordable.' },
        { q: 'Can I move intercity from Jodhpur to Jaipur or other Rajasthan cities?', a: 'Yes — Jodhpur to Jaipur (340 km via NH62, ~5.5 hrs), Jodhpur to Udaipur (250 km, ~4 hrs), and Jodhpur to Jaisalmer (290 km, ~4.5 hrs) are all covered. TransRentals intercity packages include packing, dedicated truck, and transit insurance.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Jodhpur?', a: 'JCB backhoe loaders from ₹3,499/day, excavators, generators (15–500kVA), cranes, and road rollers available in Jodhpur. The city\'s RIICO industrial zone expansion, defense establishment construction, and the New Jodhpur residential development drive steady equipment demand.' },
        { q: 'Are generators available for events and weddings in Jodhpur?', a: 'Yes, Jodhpur\'s wedding industry generates high generator rental demand. Silent DG sets (15kVA–500kVA) for palace wedding venues and tent houses available year-round. Book 48–72 hours ahead for standard events; 7 days ahead for large royal wedding setups.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Jodhpur per day?', a: 'Tata Ace starts from ₹1,499/day in Jodhpur. Bolero Pickup from ₹1,899/day. Driver included. Ideal for household shifts in Sardarpura, Ratanada, and Chopasni Housing Board zones.' },
        { q: 'What goods are commonly transported by mini trucks in Jodhpur?', a: 'Jodhpur\'s handicraft and furniture exports (blue pottery, wrought iron furniture, wooden items for Delhi/Mumbai markets), RIICO industrial zone goods, and household shifting between the old city and newer Pal Road/Chopasni zones are the primary mini truck use cases.' },
      ],
    },
  },

  udaipur: {
    intro: 'Udaipur, the City of Lakes, is Rajasthan\'s most romantic and widely visited destination, generating year-round car rental demand from domestic and international tourists. The city serves as a base for Rajasthan circuit tours to Jodhpur, Jaipur, and Chittorgarh. Lake Pichola, City Palace, and the Aravalli drives create consistent demand for local cabs. Maharana Pratap Airport handles direct flights from major metros, and the city\'s prominence as a wedding destination keeps luxury car demand high.',
    routes: [
      { to: 'Jodhpur', distance: '250 km', duration: '4 hrs', via: 'NH62' },
      { to: 'Jaipur', distance: '405 km', duration: '6 hrs', via: 'NH48' },
      { to: 'Chittorgarh', distance: '115 km', duration: '2 hrs', via: 'NH76' },
      { to: 'Mount Abu', distance: '185 km', duration: '3.5 hrs', via: 'NH27' },
      { to: 'Ajmer', distance: '280 km', duration: '4.5 hrs', via: 'NH48' },
      { to: 'Ranakpur', distance: '90 km', duration: '2 hrs', via: 'NH162' },
    ],
    tips: [
      'City Palace and Fateh Sagar Lake roads have heavy tourist traffic in evenings — use morning hours for local sightseeing',
      'Monsoon (Jul–Sep) makes Udaipur most scenic but check road conditions for Rajsamand and Kumbhalgarh trips',
      'Ranakpur Jain Temple (90 km) is the best half-day trip from Udaipur — depart by 8 AM',
      'Pre-book airport cabs — surge pricing from Maharana Pratap Airport during peak tourist season',
    ],
    stats: { population: '4.7 Lakh', knownFor: 'City of Lakes, City Palace, Lake Pichola, Venice of the East', airport: 'Maharana Pratap Airport (22 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Udaipur with a driver is the best way to see the lakes, palaces, and Aravalli countryside without navigating unfamiliar roads. TransRentals drivers know the restricted zones around City Palace and Bagore Ki Haveli. Hatchbacks to Innova available for all trip types.',
      'self-drive-car-rentals': 'Self-drive car rentals in Udaipur are ideal for the Kumbhalgarh-Ranakpur circuit (180 km loop). Sedans from ₹1,099/day. Note: city centre driving near Lake Pichola has one-way restrictions — study the route before self-driving in the old city.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Udaipur per day?', a: 'Hatchback (Swift) with driver starts from ₹1,099/day. Innova Crysta starts from ₹2,799/day. Full-day sightseeing (City Palace, Saheliyon Ki Bari, Fateh Sagar, Bagore Ki Haveli) starts from ₹1,599 (Sedan with driver, 8 hrs/80 km).' },
        { q: 'Is a cab available from Udaipur to Jodhpur or Jaipur?', a: 'Yes, Udaipur to Jodhpur (250 km via NH62, ~4 hrs) starts from ₹4,299. Udaipur to Jaipur (405 km via NH48, ~6 hrs) starts from ₹6,499. Both routes have excellent NH road quality. Ranakpur and Kumbhalgarh are popular intermediate stops.' },
        { q: 'Are luxury cars available for weddings in Udaipur?', a: 'Udaipur is India\'s top luxury wedding destination. Mercedes E-Class, BMW 5-Series, and decorated vintage cars (Ambassador, Jeep) are available. Luxury wedding car packages start from ₹8,000. Book 4–6 weeks in advance for peak wedding season (Nov–Feb). Palace hotel drops and baraat processions arranged.' },
        { q: 'What is the cab fare from Maharana Pratap Airport to Udaipur city?', a: 'Pre-booked cab from Maharana Pratap Airport (22 km, ~30 min) to the city starts from ₹699. Fixed rates — no surge. Lakeside hotels (Taj Lake Palace area, Fateh Garh) take 35–40 minutes. Book in advance during tourist season (Oct–Mar) to ensure availability.' },
        { q: 'Can I hire a cab for local Udaipur sightseeing?', a: 'Yes, full-day Udaipur sightseeing packages start from ₹1,599 (Sedan, 8 hrs/80 km). Itinerary covers City Palace, Saheliyon Ki Bari, Fateh Sagar Lake, Bagore Ki Haveli, and Shilpgram. Half-day packages (4 hrs) start from ₹899 for the main lakeside circuit.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Udaipur do TransRentals movers cover?', a: 'TransRentals movers serve all Udaipur zones — Surajpole, Hiran Magri, Bhuwana, Pratap Nagar, Ambamata, Ayad, and the old city areas near Fatehsagar. Intercity moves to Jaipur (405 km via NH48) and Jodhpur (250 km via NH62) available.' },
        { q: 'What is the best time to shift house in Udaipur?', a: 'June–September (monsoon off-peak for tourism) is the best time for hassle-free shifting. Avoid October–March when tourist traffic makes parking and access difficult near the old city and lakeside areas. Mid-month weekdays are most affordable.' },
        { q: 'Do movers handle the old city and lakeside areas in Udaipur?', a: 'Yes, but access near Lake Pichola and Jagdish Temple has restrictions. Movers park at the nearest accessible point and carry goods manually for the last stretch. Factor in an extra 2–3 hours for old city shifts and always inform movers of narrow lane access in advance.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Udaipur?', a: 'JCB backhoe loaders, excavators, generators (for hotel and resort events), cranes for marble and mining work, and road rollers. Udaipur\'s marble quarrying belt (Rajsamand road), new residential development in Bhuwana, and the luxury hospitality sector drive equipment demand.' },
        { q: 'Are generators available for wedding and event venues in Udaipur?', a: 'Yes, Udaipur\'s luxury wedding economy is a major generator rental market. Silent DG sets (25kVA–500kVA) for palace venues, lake-view resorts, and garden weddings are available. Book 1–2 weeks in advance during peak wedding season (Nov–Feb).' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Udaipur per day?', a: 'Tata Ace starts from ₹1,499/day in Udaipur. Bolero Pickup from ₹1,899/day. Driver included. Good for household shifts in Hiran Magri, Bhuwana, and Pratap Nagar sectors.' },
        { q: 'What goods are transported by mini trucks in Udaipur?', a: 'Marble slabs from stone factories to truck hubs, handicraft exports, hotel and resort supplies for the luxury hospitality belt, and household shifting between Hiran Magri residential sectors are the primary mini truck use cases in Udaipur.' },
      ],
    },
  },

  rishikesh: {
    intro: 'Rishikesh is the adventure and spiritual capital of India, attracting over 3 million visitors annually. Car rental demand is driven by Char Dham yatra pilgrims, adventure tourists, and yoga retreat visitors from across India and abroad. The city serves as the final large motorable hub before the Badrinath and Kedarnath routes. NH58 provides direct connectivity to Delhi and Dehradun, while local transport within Rishikesh and Haridwar is a major cab market.',
    routes: [
      { to: 'Haridwar', distance: '25 km', duration: '45 min', via: 'NH58' },
      { to: 'Dehradun', distance: '45 km', duration: '1 hr', via: 'NH58' },
      { to: 'Badrinath', distance: '300 km', duration: '8 hrs', via: 'NH58 → NH7' },
      { to: 'Kedarnath (Gaurikund)', distance: '225 km', duration: '7 hrs', via: 'NH58 → NH107' },
      { to: 'Delhi', distance: '240 km', duration: '5 hrs', via: 'NH58 → NH44' },
      { to: 'Auli', distance: '250 km', duration: '6 hrs', via: 'NH58 → NH7' },
    ],
    tips: [
      'Char Dham season (May–June, Sep–Oct) — book cabs at least 3 weeks in advance',
      'Lakshman Jhula and Ram Jhula areas are pedestrian-only — park near ISBT and take autos to the river',
      'NH58 mountain roads to Badrinath require experienced hill drivers — always hire locally familiar drivers',
      'Monsoon (Jul–Aug) brings landslides on mountain routes — check NHAI road updates before departure',
    ],
    stats: { population: '1.1 Lakh', knownFor: 'Yoga capital, Char Dham gateway, adventure tourism, Ganga Aarti', airport: 'Jolly Grant Airport, Dehradun (30 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Rishikesh with a driver is essential for Char Dham yatris and adventure tourists. TransRentals provides Innova, Bolero, and Tata Sumo with mountain-road experienced drivers for the Kedarnath, Badrinath, and Auli routes. Local Rishikesh-Haridwar transfers also available.',
      'self-drive-car-rentals': 'Self-drive rentals in Rishikesh are available for the Haridwar valley road and Tehri Dam circuit. Mountain roads to Kedarnath/Badrinath are NOT recommended for self-drive — experienced drivers are essential. Valley road self-drive from ₹999/day.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the cab fare from Rishikesh to Kedarnath?', a: 'Rishikesh to Gaurikund (225 km, ~7 hrs via NH58 → NH107) starts from ₹5,999 for a Bolero or Tata Sumo. Road is mountainous with multiple hairpin bends — only experienced hill drivers. Book at least 2 weeks in advance during Char Dham season (May–June). Innova not recommended for last 50 km.' },
        { q: 'What is the cab fare from Rishikesh to Badrinath?', a: 'Rishikesh to Badrinath (300 km, ~8 hrs via NH58) starts from ₹6,999. Route passes through Devprayag, Rudraprayag, and Joshimath. Bolero or Tata Sumo recommended. Helicopter alternatives available from Guptkashi and Sersi during peak season.' },
        { q: 'Is a cab available from Jolly Grant Airport to Rishikesh?', a: 'Pre-booked cab from Jolly Grant Airport (30 km, ~45 min) to Rishikesh starts from ₹799. Route via NH58 is straightforward. Night transfers available 24/7. Haridwar airport transfer (20 km from airport) starts from ₹599.' },
        { q: 'Can I hire a car for local sightseeing in Rishikesh?', a: 'Yes, local Rishikesh sightseeing (Lakshman Jhula, Ram Jhula, Triveni Ghat, Neelkanth Mahadev Temple, Beatles Ashram) takes 4–5 hrs with a local cab. Half-day packages start from ₹999. Neelkanth Mahadev (32 km, forest road) requires a 4x4 or Bolero — ask for a suitable vehicle.' },
        { q: 'How much does it cost to hire a cab for the entire Char Dham circuit from Rishikesh?', a: 'Complete Char Dham circuit (Rishikesh → Yamunotri → Gangotri → Kedarnath → Badrinath → Rishikesh, 12 days) starts from ₹35,000 per vehicle (Tata Sumo/Bolero). Innova Crysta packages start from ₹48,000. Prices include driver, fuel, and tolls. Accommodation not included.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Rishikesh do TransRentals packers cover?', a: 'TransRentals movers cover all major Rishikesh localities — Tapovan, Laxman Jhula area, Muni Ki Reti, Jonk, Swargashram, and Haridwar Road. Intercity moves to Dehradun, Haridwar, and Delhi are available. Note: access for large vehicles is restricted in the old town pedestrian zone — goods may be hand-carried for the last stretch.' },
        { q: 'What is the cost to shift house in Rishikesh?', a: '1BHK local shifting within Rishikesh starts from ₹3,500–₹5,500. Move to Dehradun (55 km) starts from ₹6,000. Move to Delhi (240 km) starts from ₹12,000–₹18,000. Hill-terrain handling and narrow mountain lane delivery are included in quoted rates.' },
        { q: 'Can I book a Rishikesh-to-Dehradun or Rishikesh-to-Delhi move?', a: 'Yes, intercity moves from Rishikesh to Dehradun (1.5 hrs) or Delhi (5 hrs) are fully covered. TransRentals provides sturdy packaging for mountain road vibration, and vehicles are selected based on load size. Fixed-price quotes provided before booking — no hidden fuel surcharges for the mountain section.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Rishikesh?', a: 'In Rishikesh, JCB backhoe loaders (₹4,500/day), mini excavators (₹3,500/day), and concrete mixers are commonly rented for hill construction projects. Equipment is sourced from Haridwar and Dehradun vendor bases with same-day or next-day delivery for most requests.' },
        { q: 'Can I rent a mini excavator for foundation work in hilly areas of Rishikesh?', a: 'Yes, mini excavators (1–3T class) are ideal for tight-access hill plots in Rishikesh where full-size machines cannot reach. Rates start from ₹3,500/day. Operators familiar with rocky Himalayan soil conditions are provided. Confirm road access width before booking — narrow tracks may limit machine deployment.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Rishikesh per day?', a: 'Mini truck (Tata Ace/Mahindra Supro, ~1T capacity) starts from ₹1,499/day in Rishikesh. Half-day (4 hrs) available from ₹899. For deliveries to ashrams, hotels, or yoga centres in the old Rishikesh area, goods are transferred to smaller vehicles or handcarts if road access is restricted.' },
        { q: 'Can I hire a tempo for hotel or ashram goods delivery in Rishikesh?', a: 'Yes, TransRentals provides tempo services for grocery runs, linen deliveries, LPG cylinder transport, and construction material delivery to hotels, ashrams, and yoga retreats in Rishikesh. Same-day booking available. Vehicles are GPS-tracked and drivers familiar with local access restrictions.' },
      ],
    },
  },

  haridwar: {
    intro: 'Haridwar is one of the seven holiest cities in Hinduism and the busiest pilgrim gateway in Uttarakhand. The city generates massive cab demand for Char Dham pilgrims, Kumbh Mela visitors, and religious tourists from across India. NH58 provides direct connectivity to Delhi (225 km), Dehradun (55 km), and Rishikesh (25 km). Kumbh Mela years see exponential demand surge — advance booking is essential. Local temple circuit, Har Ki Pauri, and Chandi Devi ropeway are primary local demand generators.',
    routes: [
      { to: 'Rishikesh', distance: '25 km', duration: '45 min', via: 'NH58' },
      { to: 'Dehradun', distance: '55 km', duration: '1.5 hrs', via: 'NH58' },
      { to: 'Delhi', distance: '225 km', duration: '4.5 hrs', via: 'NH58 → NH44' },
      { to: 'Mussoorie', distance: '90 km', duration: '2.5 hrs', via: 'NH58 → Mussoorie Road' },
      { to: 'Kedarnath (Gaurikund)', distance: '250 km', duration: '8 hrs', via: 'NH58 → NH107' },
      { to: 'Nainital', distance: '275 km', duration: '5.5 hrs', via: 'NH109' },
    ],
    tips: [
      'Har Ki Pauri area (1 km radius) is pedestrian-only during Ganga Aarti timings — park at Rani Ghat and walk',
      'Delhi-Haridwar NH58 has heavy religious pilgrim traffic on weekends and festivals — add 60–90 min buffer',
      'Char Dham and Kumbh dates cause extreme demand — book cabs 4–6 weeks in advance',
      'Jolly Grant Airport (Dehradun, 40 km) is nearest — pre-book airport transfers',
    ],
    stats: { population: '2.3 Lakh', knownFor: 'Har Ki Pauri, Ganga Aarti, Char Dham gateway, Kumbh Mela', airport: 'Jolly Grant Airport, Dehradun (40 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Haridwar with a driver is the most comfortable way for pilgrims and tourists to cover the temple circuit, Mansa Devi ropeway, Chandi Devi ropeway, and outstation Char Dham routes. TransRentals provides 24/7 cabs including early morning Ganga Aarti transfers.',
      'self-drive-car-rentals': 'Self-drive options in Haridwar are best for the Haridwar-Rishikesh valley road or Rajaji National Park (20 km). Mountain routes to Kedarnath/Badrinath require experienced drivers and are not suitable for self-drive.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the cab fare from Haridwar to Delhi?', a: 'Haridwar to Delhi (225 km via NH58, ~4.5 hrs) starts from ₹3,999 for a Sedan with driver. NH58 is a 4-lane highway. Night travel is faster (3.5 hrs) but avoid post-midnight if the purpose is Ganga Aarti — depart Haridwar by 6 AM for Delhi arrival by 11 AM.' },
        { q: 'What is the car rental rate in Haridwar per day?', a: 'Hatchback with driver starts from ₹999/day. Bolero or Tata Sumo for Char Dham routes starts from ₹2,499/day. Full-day local Haridwar sightseeing (Har Ki Pauri, Mansa Devi, Chandi Devi, Daksha Mahadev) starts from ₹1,299 (Sedan, 8 hrs).' },
        { q: 'Is a cab available from Haridwar to Kedarnath?', a: 'Haridwar to Gaurikund (250 km, ~8 hrs via NH58 → NH107) starts from ₹6,499. The road beyond Rudraprayag is mountainous. Bolero or Tata Sumo recommended. From Gaurikund, trekking or helicopter to Kedarnath. Book 2–3 weeks in advance during Char Dham season.' },
        { q: 'How do I get from Jolly Grant Airport to Haridwar?', a: 'Pre-booked cab from Jolly Grant Airport (40 km, ~60 min) to Haridwar starts from ₹899. Fixed rates. Route via Rishikesh bypass is most common. Haridwar ISBT drop and Har Ki Pauri area drop available. Night arrivals served 24/7.' },
        { q: 'Can I book a cab for the Haridwar-Rishikesh-Mussoorie circuit?', a: 'Yes, Haridwar-Rishikesh-Mussoorie circuit (90 km total loop) is a popular 1-day trip. Packages start from ₹2,499 (Sedan, full day). Mussoorie Mall Road and Kempty Falls are 2.5 hrs from Haridwar via Dehradun Road. Ideal for family trips combining pilgrimage and leisure.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Haridwar do TransRentals movers cover?', a: 'TransRentals movers cover all Haridwar localities — Jwalapur, Ranipur, BHEL Colony, Sidcul Industrial Area, Shivalik Nagar, and Har Ki Pauri area. Intercity moves to Rishikesh, Dehradun, and Delhi NCR are available. Industrial moves from Sidcul manufacturing zone are handled with factory-grade packaging.' },
        { q: 'What is the house shifting cost in Haridwar?', a: '1BHK local shifting within Haridwar starts from ₹3,000–₹5,000. Move to Dehradun (55 km) starts from ₹5,500. Move to Delhi (220 km) starts from ₹11,000–₹16,000. Kumbh Mela season (April–June) — book movers at least 2 weeks in advance as all vehicle capacity gets booked by pilgrimage operators.' },
        { q: 'Can I shift goods from Haridwar during Kumbh Mela months?', a: 'Yes, but plan well in advance. During Kumbh Mela and Ardh Kumbh periods, vehicle availability tightens significantly in Haridwar. TransRentals pre-allocates mover capacity for scheduled clients. Book at least 3 weeks ahead for any move during April, May, or the Shahi Snan dates.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Haridwar?', a: 'Haridwar and the adjacent Sidcul industrial zone have good equipment availability. JCB backhoe loaders (₹4,500/day), compactors, concrete mixers, and cranes (5T–15T, from ₹8,000/day) are available for construction, road work, and industrial installation projects.' },
        { q: 'Can I hire a JCB or excavator for construction near Haridwar Sidcul?', a: 'Yes, excavators and JCBs are frequently rented for the Sidcul industrial estates and upcoming Haridwar ring road projects. TransRentals connects you with BHEL, SIDCUL-registered equipment vendors. Rates: JCB ₹4,500/day, excavator (8T) ₹5,500/day. Operator included. Advance booking of 48 hrs recommended.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Haridwar per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T capacity) start from ₹1,299/day in Haridwar. Half-day (4 hrs) from ₹799. For BHEL Colony and Sidcul deliveries, multi-stop routes are available at ₹150–₹250 per extra stop.' },
        { q: 'Can I hire a tempo for goods transport from Haridwar to Rishikesh or Dehradun?', a: 'Yes, Haridwar to Rishikesh (25 km, ~₹1,800 one way) and Haridwar to Dehradun (55 km, ~₹2,500 one way) tempo services are available on same-day booking for small loads under 1.5 tonnes. For larger loads, dedicated mini trucks or LCV (light commercial vehicles) are arranged.' },
      ],
    },
  },

  thane: {
    intro: 'Thane is Mumbai Metropolitan Region\'s second-largest city, serving as a major residential and corporate hub. With Mumbai\'s traffic congestion driving residents to prefer pre-booked cabs, Thane\'s car rental market is substantial. Eastern Express Highway, Mumbai-Nashik Expressway (NH3), and the upcoming Mumbai-Nagpur Expressway (Samruddhi) all originate near Thane, making it a key outstation starting point. Corporate parks in Majiwada, Wagle Estate, and Kolshet generate daily cab demand.',
    routes: [
      { to: 'Nashik', distance: '175 km', duration: '2.5 hrs', via: 'NH3 Mumbai-Nashik Expressway' },
      { to: 'Pune', distance: '145 km', duration: '2.5 hrs', via: 'NH48' },
      { to: 'Lonavala', distance: '95 km', duration: '2 hrs', via: 'NH48' },
      { to: 'Mumbai Airport (T2)', distance: '25 km', duration: '40 min', via: 'Eastern Express Hwy' },
      { to: 'Shirdi', distance: '230 km', duration: '4 hrs', via: 'NH3' },
      { to: 'Mahabaleshwar', distance: '225 km', duration: '4 hrs', via: 'NH48' },
    ],
    tips: [
      'Eastern Express Highway (Thane to Mulund) has peak hour congestion (8–10 AM, 6–9 PM) — add 30 min buffer',
      'Mumbai Airport from Thane via Eastern Express Hwy is fastest — add extra time during rains',
      'Nashik via NH3 Expressway is smooth and fast — no tolls after Bhiwandi for the first 30 km',
      'Book cabs from Thane for Shirdi a day in advance — weekend slots fill quickly',
    ],
    stats: { population: '18.4 Lakh', knownFor: 'Upahi Hills, Talao Pali, Yeoor Hills, MMR\'s green suburb', airport: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai (25 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Thane with a driver is widely used for daily commutes to Mumbai BKC, Andheri, and Powai, as well as airport transfers to T1 and T2. TransRentals provides cabs from Thane for local MMR travel and outstation routes to Nashik, Pune, and Shirdi.',
      'self-drive-car-rentals': 'Self-drive car rentals in Thane are popular for Nashik expressway trips and Lonavala weekend drives. Hatchbacks from ₹799/day with pickup from Thane West or Ghodbunder Road. Maharashtra state travel permitted — outstation policy includes Pune and Nashik.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Thane per day?', a: 'Hatchback with driver starts from ₹999/day in Thane. Sedan (Dzire/Amaze) starts from ₹1,299/day. Innova Crysta starts from ₹2,499/day. For Nashik outstation (175 km one way via NH3), packages start from ₹3,299 for a full day.' },
        { q: 'What is the cab fare from Thane to Mumbai Airport?', a: 'Pre-booked cab from Thane to Mumbai T2 Airport (25 km via Eastern Express Hwy) starts from ₹699. Journey time is 40–60 minutes in normal traffic. Add 30–45 minutes during peak hours (7–10 AM, 5–8 PM). Night transfer (after 11 PM) typically takes only 30 minutes.' },
        { q: 'Can I book a cab from Thane to Shirdi?', a: 'Yes, Thane to Shirdi (230 km via NH3 Mumbai-Nashik Expressway → Kopargaon, ~4 hrs) starts from ₹4,499 (Sedan). Nashik Phata interchange on NH3 is the Shirdi exit point. NH3 is a 6-lane expressway until Igatpuri — smooth fast drive. Book the night before for early Darshan timings.' },
        { q: 'Is there a daily cab service from Thane to Powai or BKC?', a: 'Yes, TransRentals offers monthly cab subscriptions for Thane-to-Mumbai corporate commutes. Daily cab from Thane to Powai (15 km, ~30 min via Eastern Express Hwy) starts from ₹500/trip. Monthly packages (22 days, one way) start from ₹9,999. BKC drop starts from ₹650/trip.' },
        { q: 'Which is the best route from Thane to Pune?', a: 'Thane to Pune (145 km via NH48 Mumbai-Pune Expressway, ~2.5 hrs) is the standard route. Khopoli exit leads to the expressway. NH48 has 6 lanes with full amenities — rest stops at Khopoli, Khandala, and Lonavala. Avoid Friday evenings (office crowd heading to Pune for weekend).' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Thane do TransRentals movers cover?', a: 'TransRentals movers cover all Thane localities — Wagle Estate, Majiwada, Kapurbawdi, Ghodbunder Road, Hiranandani Estate, Kasarvadavali, Thane West, Thane East, Kalwa, Mumbra, and Diva. Intercity moves to Pune, Nashik, and Navi Mumbai are fully handled. Corporate office relocation for Wagle Estate companies is a specialty.' },
        { q: 'What is the cost of house shifting in Thane to Mumbai?', a: 'Local Thane 1BHK shifting (within Thane city) starts from ₹3,500–₹5,000. Thane to Mumbai (25–40 km depending on destination) starts from ₹5,500–₹8,000. Thane to Pune (145 km) starts from ₹9,000–₹14,000. Ghodbunder Road high-rise relocations require elevator booking coordination — factor in 2–3 hrs buffer.' },
        { q: 'Are office relocation services available in Thane Wagle Estate?', a: 'Yes, TransRentals handles office moves for Wagle Estate, Majiwada, and Kolshet corporate zones. Services include IT equipment packing, server rack transport, and furniture dismantling/reassembly. Weekend-only office moves are available to avoid business disruption. Quotes start from ₹15,000 for full office relocation.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Thane?', a: 'Thane has strong equipment availability for MMR construction projects. JCB loaders (₹4,500/day), concrete pumps (₹8,000/day), tower cranes (₹25,000/day), and mobile cranes (₹15,000–₹20,000/day) serve the many high-rise projects in Ghodbunder Road and Kolshet. Compactors and pavers available for road work near Eastern Express Highway.' },
        { q: 'Can I hire a crane for high-rise construction in Ghodbunder Road, Thane?', a: 'Yes, tower cranes and mobile cranes are available for Thane\'s residential and commercial high-rise construction belt on Ghodbunder Road. Mobile crane (15T) from ₹18,000/day. Tower crane monthly contracts start from ₹3,00,000. All cranes come with certified operators and PESO-compliant inspection certificates.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Thane per day?', a: 'Mini truck (Tata Ace/Mahindra Supro, ~1T) starts from ₹1,299/day in Thane. For intra-Thane furniture moves or appliance delivery, half-day (4 hrs) packages from ₹799 are available. Ghodbunder Road, Eastern Express Highway, and Thane-Belapur Road deliveries are all covered.' },
        { q: 'Can I hire a mini truck for furniture or appliance delivery in Thane?', a: 'Yes, TransRentals mini trucks are widely used for furniture delivery from Thane IKEA/furniture hubs, appliance transport, and e-commerce last-mile delivery within Thane and to Navi Mumbai or Kalyan. Same-day booking available. Vehicles fit standard apartment building cargo lifts.' },
      ],
    },
  },

  'navi-mumbai': {
    intro: 'Navi Mumbai is a planned township that has become one of MMR\'s most important corporate and residential zones. Vashi, Kharghar, Belapur, and Panvel generate significant cab demand for Mumbai commutes, airport transfers, and Pune highway trips. Navi Mumbai is the gateway to the Mumbai-Pune Expressway and NH66 Coastal Highway. The upcoming Navi Mumbai International Airport (Ulwe) is expected to make it a major new aviation hub. MIDC industrial zones drive corporate cab requirements.',
    routes: [
      { to: 'Mumbai (Bandra)', distance: '35 km', duration: '50 min', via: 'Sion-Panvel Hwy → Eastern Freeway' },
      { to: 'Pune', distance: '120 km', duration: '2 hrs', via: 'NH48 Mumbai-Pune Expressway' },
      { to: 'Lonavala', distance: '75 km', duration: '1.5 hrs', via: 'NH48' },
      { to: 'Alibaug', distance: '55 km', duration: '1.5 hrs', via: 'NH66' },
      { to: 'Mahabaleshwar', distance: '200 km', duration: '3.5 hrs', via: 'NH48' },
      { to: 'Nashik', distance: '200 km', duration: '3.5 hrs', via: 'NH3' },
    ],
    tips: [
      'Panvel junction is the busiest bottleneck for Navi Mumbai exit — avoid 8–10 AM and 6–9 PM',
      'Mumbai-Pune Expressway from Khopoli exit is just 30 min from Panvel — fastest Pune route from Navi Mumbai',
      'Alibaug (coastal town, 55 km via NH66) is Navi Mumbai\'s top weekend escape — book Sunday cabs early',
      'MIDC Mahape and Turbhe corporate zones have cab pickup zones outside premises',
    ],
    stats: { population: '15.4 Lakh', knownFor: 'Planned city, Vashi CBD, NMMC, Kharghar hills', airport: 'CSIA Mumbai (40 km) / Upcoming Navi Mumbai Airport at Ulwe' },
    serviceIntros: {
      'car-rental': 'Car rental in Navi Mumbai with a driver covers daily corporate commutes to Mumbai BKC, Lower Parel, and Andheri, plus airport transfers to CSIA. TransRentals serves Vashi, Belapur, Kharghar, and Panvel with 24/7 availability.',
      'self-drive-car-rentals': 'Self-drive car rentals in Navi Mumbai are popular for the Mumbai-Pune Expressway weekend trips. Pickup available in Vashi, Kharghar, and Panvel. Hatchbacks from ₹799/day. Maharashtra outstation permitted.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Navi Mumbai per day?', a: 'Hatchback with driver starts from ₹999/day. Sedan starts from ₹1,299/day. Innova Crysta from ₹2,499/day. For Pune outstation (120 km via NH48), packages start from ₹2,799 for a full day (250 km limit).' },
        { q: 'What is the cab fare from Navi Mumbai to Mumbai Airport?', a: 'Pre-booked cab from Navi Mumbai (Vashi/Belapur) to CSIA T2 Airport (40–45 km via Eastern Freeway or Harbour Line route) starts from ₹999. Traffic via Sion can add 30 min during peak hours — book 90 minutes before flight time from Vashi.' },
        { q: 'Can I book a cab from Navi Mumbai to Pune?', a: 'Navi Mumbai to Pune (120 km via NH48 Mumbai-Pune Expressway, ~2 hrs) starts from ₹2,799 (Sedan). Panvel to Expressway is 10 min. NH48 Expressway is 6-lane and well-maintained. Khopoli service plaza is the main rest stop midway.' },
        { q: 'Is a cab available from Navi Mumbai to Alibaug beach?', a: 'Yes, Navi Mumbai to Alibaug (55 km via NH66, ~1.5 hrs) starts from ₹1,499. Alternative ferry from Mandwa Jetty (Belapur to Mandwa by ferry, 20 min) + cab on Alibaug side also available. NH66 is a good 4-lane road through Pen and Alibaug.' },
        { q: 'Are corporate cab services available in Navi Mumbai?', a: 'Yes, TransRentals provides dedicated corporate cab services for MIDC Mahape, Turbhe, TCS Yantra Park, L&T, and other Navi Mumbai corporate campuses. Monthly subscriptions with dedicated cabs and drivers start from ₹28,000. Employee shuttle services for MIDC zones also available.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Navi Mumbai do TransRentals movers cover?', a: 'TransRentals movers cover all Navi Mumbai nodes — Vashi, Nerul, Belapur, Kharghar, Panvel, Airoli, Ghansoli, Koparkhairane, Turbhe, and Ulwe. Moves to Mumbai, Thane, and Pune are fully handled. Kharghar and Ulwe society-based relocations are our strongest markets as new residents move into CIDCO-built townships.' },
        { q: 'What is the house shifting cost in Navi Mumbai?', a: '1BHK local shifting within Navi Mumbai (node to node) starts from ₹3,000–₹4,500. Move to Mumbai (40–50 km) starts from ₹5,500–₹8,000. Move to Pune (120 km) starts from ₹8,000–₹13,000. Panvel to Pune via NH48 is quick — moves complete in a single day. CIDCO high-rise moves require cargo lift pre-booking via society office.' },
        { q: 'Are office shifting services available in Navi Mumbai MIDC?', a: 'Yes, office and factory relocation within MIDC Mahape, Turbhe, and TTC Industrial Area is available. Moves include machinery shifting, IT rack transport, and clean-room equipment packing. TransRentals coordinates with MIDC security for outside-hours movement approvals. Quotes start from ₹20,000 for full office moves.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Navi Mumbai?', a: 'Navi Mumbai has strong equipment availability driven by ongoing CIDCO projects and Navi Mumbai Airport construction. Tower cranes, piling rigs, concrete pumps, JCB loaders, and excavators (8T–30T) are available. JCB starts from ₹4,500/day. Mobile cranes (15T–30T) from ₹18,000/day.' },
        { q: 'Can I rent a JCB or excavator for Ulwe or Dronagiri construction in Navi Mumbai?', a: 'Yes, JCB and excavator rental is available for Ulwe, Dronagiri, and the Navi Mumbai Airport site periphery. Given the volume of ongoing CIDCO development, book at least 5–7 days in advance for larger equipment. Mini excavators for tight residential plots start from ₹3,500/day.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Navi Mumbai per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,299/day in Navi Mumbai. For inter-node deliveries (e.g., Vashi to Kharghar), half-day (4 hrs) packages from ₹799 are available. APMC Vashi wholesale market pickups and delivery to housing societies are a common use case.' },
        { q: 'Can I hire a tempo for APMC Vashi market goods transport?', a: 'Yes, TransRentals tempos are frequently used for APMC Vashi wholesale vegetable, fruit, and dry goods pickups and delivery to restaurants and grocery stores across Navi Mumbai. Early morning (4–6 AM) pickup slots available. Vehicles up to 1.5T capacity for bulk loads.' },
      ],
    },
  },

  madurai: {
    intro: 'Madurai is Tamil Nadu\'s cultural capital and one of the oldest continuously inhabited cities in the world. The city generates consistent car rental demand from pilgrims visiting Meenakshi Amman Temple, conference visitors, and tourists on the Tamil Nadu heritage circuit. Madurai serves as the gateway to Kodaikanal, Rameshwaram, and Munnar. The city\'s strategic location in southern Tamil Nadu makes it a hub for cab services serving the entire Madurai-Tirunelveli-Tenkasi corridor.',
    routes: [
      { to: 'Rameshwaram', distance: '175 km', duration: '3.5 hrs', via: 'NH87' },
      { to: 'Kodaikanal', distance: '120 km', duration: '3 hrs', via: 'NH44 → Kodaikanal Road' },
      { to: 'Munnar', distance: '225 km', duration: '5 hrs', via: 'NH85' },
      { to: 'Rameswaram–Dhanushkodi', distance: '200 km', duration: '4 hrs', via: 'NH87' },
      { to: 'Tirunelveli', distance: '160 km', duration: '2.5 hrs', via: 'NH44' },
      { to: 'Chennai', distance: '460 km', duration: '7 hrs', via: 'NH38 / NH44' },
    ],
    tips: [
      'Meenakshi Temple morning darshan (5:30–6 AM) requires 4 AM departure from outer city hotels',
      'Kodaikanal road (Palani Ghat) has narrow sections — prefer driver-driven over self-drive',
      'Rameshwaram trip is best done as a 2-day trip with overnight stay — 175 km one way is tiring same-day',
      'Madurai airport pre-booking is strongly recommended — auto drivers quote inflated rates from arrival terminal',
    ],
    stats: { population: '14.6 Lakh', knownFor: 'Meenakshi Amman Temple, Jallikattu, silk sarees, filter coffee', airport: 'Madurai Airport (12 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Madurai with a driver is preferred by pilgrims doing the Meenakshi-Rameshwaram-Kanyakumari circuit and tourists exploring Kodaikanal from the plains. TransRentals provides Tamil-speaking drivers familiar with temple protocols and the narrow lanes of the temple city.',
      'self-drive-car-rentals': 'Self-drive car rentals in Madurai are available for the Madurai-Tirunelveli highway and flatter outstation routes. Hatchbacks from ₹799/day. Kodaikanal ghat road is NOT recommended for first-time self-drivers.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Madurai per day?', a: 'Hatchback with driver starts from ₹999/day in Madurai. Innova Crysta starts from ₹2,499/day. Full-day local sightseeing (Meenakshi Temple, Thirumalai Nayak Palace, Gandhi Memorial Museum, Vaigai Dam) starts from ₹1,299 (Sedan, 8 hrs/80 km).' },
        { q: 'What is the cab fare from Madurai to Rameshwaram?', a: 'Madurai to Rameshwaram (175 km via NH87, ~3.5 hrs) starts from ₹3,299 (Sedan, one way). Pamban Bridge crossing and Agnitheertham are key stops. Round trip with 3 hours waiting starts from ₹5,499. Dhanushkodi beach extension adds 25 km — confirm with driver.' },
        { q: 'Is a cab available from Madurai to Kodaikanal?', a: 'Yes, Madurai to Kodaikanal (120 km via Palani Ghat road, ~3 hrs) starts from ₹2,699 (Sedan). The Palani Ghat section has 40 hairpin bends — experienced mountain drivers recommended. Innova or SUV preferred for the steep ascent with luggage.' },
        { q: 'What is the cab fare from Madurai Airport to city hotels?', a: 'Pre-booked cab from Madurai Airport (12 km, ~20 min) to the city starts from ₹399. Temple area hotels (near Meenakshi Temple) take 25–30 minutes due to temple traffic. Fixed rates — no auto overcharging.' },
        { q: 'Can I book a car for a Madurai–Rameshwaram–Kanyakumari circuit trip?', a: 'Yes, the classic Tamil Nadu pilgrimage circuit (Madurai → Rameshwaram → Kanyakumari → Madurai, ~600 km, 2 days) starts from ₹9,999 (Innova Crysta, 2 days). Overnight stay in Rameshwaram or Kanyakumari. All major temple drops and coastal viewpoints covered.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Madurai do TransRentals movers cover?', a: 'TransRentals movers cover all Madurai localities — Arapalayam, Anna Nagar, KK Nagar, Thiruparankundram, Tallakulam, Alagarkoil Road, and Old Town. Intercity moves to Chennai (460 km), Coimbatore (210 km), and Trichy (130 km) are available. Full packing with traditional Tamil textile protection is available for households with silk sarees and antique brass items.' },
        { q: 'What is the house shifting cost in Madurai?', a: '1BHK local shifting within Madurai starts from ₹3,000–₹4,500. Move to Trichy (130 km) starts from ₹6,000. Move to Chennai (460 km) starts from ₹14,000–₹20,000. For moves during the Chithirai Festival months (April–May), book movers 3–4 weeks in advance as vehicle availability tightens.' },
        { q: 'Can I book packers and movers for a Madurai to Chennai shift?', a: 'Yes, Madurai to Chennai moves (460 km via NH38 or NH48) are fully covered by TransRentals. Transit time is 8–10 hrs. Full household including furniture, appliances, and kitchenware handled with professional packing materials. Fixed-price quote issued before departure — no mid-route surprises.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Madurai?', a: 'JCB backhoe loaders (₹4,500/day), mini excavators (₹3,500/day), concrete mixers, and transit mixers are available in Madurai. Equipment is deployed for residential construction, road work near the Madurai bypass, and Melur-Sivaganga highway projects.' },
        { q: 'Can I rent a JCB for foundation work in Madurai?', a: 'Yes, JCB and excavator rental for independent house foundation work is a common service in Madurai. Black soil (clay) in the Madurai basin requires specific excavation timing — dry season (Feb–May) is preferred. Rates start from ₹4,000/day for JCB with operator. Same-day booking available for most Madurai city locations.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Madurai per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T capacity) start from ₹1,199/day in Madurai. Half-day (4 hrs) from ₹749. Goods delivery from Madurai wholesale markets (Mattuthavani, Vilachery) to retail stores and residences is a common use case.' },
        { q: 'Can I hire a tempo for silk or textile goods transport from Madurai?', a: 'Yes, TransRentals mini trucks transport silk sarees, garments, and handloom goods from Madurai wholesale textile clusters to retailers across Tamil Nadu. Climate-controlled packing materials available on request. Same-day Madurai–Rajapalayam and Madurai–Dindigul deliveries available.' },
      ],
    },
  },

  thiruvananthapuram: {
    intro: 'Thiruvananthapuram (Trivandrum) is Kerala\'s capital city and administrative hub, generating steady demand for cab services, airport transfers, and outstation routes to Kovalam, Varkala, and Kanyakumari. As Kerala\'s gateway to the southern tip of India, the city serves interstate tourists heading to Tamil Nadu. The Trivandrum International Airport handles major international traffic including Gulf routes, driving high demand for airport cabs. IT parks in Technopark generate substantial corporate cab requirements.',
    routes: [
      { to: 'Kovalam Beach', distance: '16 km', duration: '30 min', via: 'NH66' },
      { to: 'Varkala', distance: '55 km', duration: '1.5 hrs', via: 'NH66' },
      { to: 'Kanyakumari', distance: '90 km', duration: '2 hrs', via: 'NH44' },
      { to: 'Kollam', distance: '70 km', duration: '1.5 hrs', via: 'NH66' },
      { to: 'Munnar', distance: '270 km', duration: '6 hrs', via: 'NH183 → NH85' },
      { to: 'Alleppey (Alappuzha)', distance: '155 km', duration: '3 hrs', via: 'NH66' },
    ],
    tips: [
      'Technopark Phase 3 (Kazhakootam) corporate zones require cabs with advance booking — app-based cabs are often unavailable',
      'Trivandrum Airport international arrivals see Gulf-return NRIs — book airport pickup well in advance on Friday nights',
      'Kovalam beach road (Lighthouse Beach to Hawah Beach) is narrow — park at Kovalam junction and walk or take auto',
      'Kanyakumari sunrise trip requires 4 AM departure from Thiruvananthapuram — book overnight cab',
    ],
    stats: { population: '9.6 Lakh', knownFor: 'Padmanabhaswamy Temple, Kovalam beach, Technopark, Kerala capital', airport: 'Trivandrum International Airport (8 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Thiruvananthapuram with a driver covers Technopark corporate commutes, Padmanabhaswamy Temple visits, and outstation trips to Kovalam, Varkala, and Kanyakumari. TransRentals provides Malayalam-speaking drivers familiar with Thiruvananthapuram\'s one-way roads and airport terminal layout.',
      'self-drive-car-rentals': 'Self-drive car rentals in Thiruvananthapuram are available for coastal highway NH66 trips to Varkala and Kollam. Hatchbacks from ₹799/day. Kerala permit required for Tamil Nadu crossings — confirm with vendor before Kanyakumari self-drive.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Thiruvananthapuram per day?', a: 'Hatchback with driver starts from ₹999/day. Sedan starts from ₹1,299/day. Innova Crysta from ₹2,499/day. Full-day Kerala sightseeing (Kovalam-Varkala-Padmanabhaswamy Temple circuit) starts from ₹1,599 (Innova, 8 hrs/80 km).' },
        { q: 'What is the cab fare from Trivandrum Airport to Kovalam Beach?', a: 'Pre-booked cab from Trivandrum Airport (8 km from city, 16 km from Kovalam) to Kovalam Beach starts from ₹599. Fixed airport rate. Journey 20–30 minutes depending on traffic. Night arrival drop (after midnight) available 24/7.' },
        { q: 'Can I book a cab from Thiruvananthapuram to Kanyakumari?', a: 'Thiruvananthapuram to Kanyakumari (90 km via NH44, ~2 hrs) starts from ₹1,999 (Sedan, one way). Round trip with 3 hrs waiting starts from ₹3,299. The NH44 coastal route passes through Nagercoil — Tamil Nadu road quality is excellent. Best visited at sunrise — book early morning departure.' },
        { q: 'Is there a cab from Thiruvananthapuram to Alleppey (Alappuzha)?', a: 'Thiruvananthapuram to Alleppey (155 km via NH66, ~3 hrs) starts from ₹3,299 (Sedan). NH66 (old NH47) coastal highway has excellent road quality with views of backwaters and beaches. Kollam (70 km, 1.5 hrs) is a popular intermediate stop for backwater boat rides.' },
        { q: 'Are corporate cab services available near Technopark in Thiruvananthapuram?', a: 'Yes, TransRentals provides daily cab subscriptions for Technopark Phase 1, 2, and 3 employees. Pickup from major residential areas (Pattom, Kawdiar, Kesavadasapuram, Kazhakoottam). Monthly packages start from ₹9,999. Dedicated driver option available for senior professionals.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Thiruvananthapuram do TransRentals movers cover?', a: 'TransRentals movers cover all Trivandrum areas — Pattom, Kawdiar, Kowdiar, Kazhakkoottam, Technopark campus area, Vattiyoorkavu, Nalanchira, Medical College area, Sreekaryam, and Kovalam. Intercity moves to Kochi (200 km), Kollam (70 km), and Nagercoil (75 km into Tamil Nadu) are fully covered.' },
        { q: 'What is the house shifting cost in Thiruvananthapuram?', a: '1BHK local shifting within Trivandrum starts from ₹3,000–₹4,500. Move to Kollam (70 km) starts from ₹5,500. Move to Kochi (200 km) starts from ₹9,000–₹14,000. Technopark campus to nearby housing colony moves (Kazhakkoottam, Sreekaryam) are completed in under 4 hrs with a trained crew.' },
        { q: 'Are packers and movers available for Trivandrum to Kochi relocation?', a: 'Yes, Thiruvananthapuram to Kochi moves (200 km via NH66, ~4 hrs) are a common route. Full household, electronics, and vehicle transport (bike towing) available. TransRentals provides fixed-price quotes with no surprise charges on NH66 tolls. Moving on Tuesday–Thursday avoids weekend and Monday congestion.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Thiruvananthapuram?', a: 'JCB backhoe loaders (₹4,500/day), mini excavators (₹3,800/day), concrete mixers, and crane trucks are available in Thiruvananthapuram. Laterite stone (charnockite) common in Kerala construction requires specific excavation equipment — operators experienced with Kerala soil are provided.' },
        { q: 'Can I hire a JCB for plot development or house construction in Trivandrum?', a: 'Yes, JCB and mini excavator rental for independent house construction is widely available in Thiruvananthapuram. Laterite block cutting and site clearing are common tasks. JCB with operator starts from ₹4,000/day. Mini excavator for tight residential plots starts from ₹3,500/day. Book 24–48 hrs in advance.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Thiruvananthapuram per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Thiruvananthapuram. Half-day (4 hrs) from ₹749. Kovalam–Varkala tourist hotel goods deliveries and Kazhakkoottam–Technopark supply runs are common use cases.' },
        { q: 'Can I hire a tempo for goods transport from Trivandrum to Kochi or Kollam?', a: 'Yes, Trivandrum to Kollam (70 km, ~₹2,200 one way) and Trivandrum to Kochi (200 km, ~₹4,500 one way) tempo services are available for loads up to 1.5T. NH66 is a smooth coastal highway — transit is generally hassle-free. Booking 24 hrs in advance ensures dedicated vehicle allocation.' },
      ],
    },
  },

  vijayawada: {
    intro: 'Vijayawada is Andhra Pradesh\'s commercial capital and one of the fastest-growing cities in South India. The city sits at the junction of NH16 (Chennai-Kolkata) and NH65, making it the state\'s most important road hub. Car rental demand is driven by pilgrims visiting Kanaka Durga Temple, corporate travelers, and tourists exploring the Krishna River delta. Amaravati (AP capital, 30 km) and Guntur (30 km) add to the daily commute cab market. The city is also a gateway to the Araku Valley and Tirupati pilgrimage routes.',
    routes: [
      { to: 'Hyderabad', distance: '275 km', duration: '4 hrs', via: 'NH65' },
      { to: 'Amaravati', distance: '30 km', duration: '45 min', via: 'NH16' },
      { to: 'Guntur', distance: '35 km', duration: '45 min', via: 'NH16' },
      { to: 'Tirupati', distance: '415 km', duration: '6 hrs', via: 'NH16' },
      { to: 'Vizag (Visakhapatnam)', distance: '340 km', duration: '5 hrs', via: 'NH16' },
      { to: 'Chennai', distance: '430 km', duration: '6 hrs', via: 'NH16' },
    ],
    tips: [
      'Kanaka Durga Temple (Indrakeeladri Hill) — parking is extremely limited; take TransRentals cab to the base and walk/rope way',
      'Vijayawada-Hyderabad NH65 is mostly 4-lane and very fast — depart by 6 AM to avoid Hyderabad entry traffic',
      'Amaravati Government complex requires vehicle registration at checkpoint — carry cab booking confirmation',
      'Prakasam Barrage area (Krishna River) has evening traffic — avoid 5–7 PM for Besant Road crossings',
    ],
    stats: { population: '10.5 Lakh', knownFor: 'Kanaka Durga Temple, Krishna River, Amaravati capital proximity', airport: 'Vijayawada International Airport (20 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Vijayawada with a driver is the standard for Kanaka Durga Temple visits, Amaravati government office trips, and the Vijayawada-Hyderabad corridor. TransRentals provides Telugu-speaking drivers experienced on NH16 and the Amaravati expressway.',
      'self-drive-car-rentals': 'Self-drive car rentals in Vijayawada are available for highway trips to Guntur and Amaravati. Hatchbacks from ₹799/day. NH16 Vijayawada-Hyderabad stretch is a quality 4-lane road — suitable for confident highway drivers.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Vijayawada per day?', a: 'Hatchback with driver starts from ₹999/day. Sedan starts from ₹1,299/day. Innova Crysta from ₹2,499/day. For Hyderabad outstation (275 km via NH65), one-way package starts from ₹4,499.' },
        { q: 'What is the cab fare from Vijayawada Airport to the city?', a: 'Pre-booked cab from Vijayawada International Airport (20 km, ~30 min) to city centre starts from ₹599. Fixed airport rate. Kanaka Durga Temple area drop ~35 minutes. Night arrivals served 24/7.' },
        { q: 'Can I book a cab from Vijayawada to Hyderabad?', a: 'Vijayawada to Hyderabad (275 km via NH65, ~4 hrs) starts from ₹4,499 (Sedan, one way). NH65 is mostly 4-lane with good road quality. Recommended departure: 6 AM to reach Hyderabad before midday traffic. Monthly shuttle options available for regular travellers.' },
        { q: 'Is there a cab from Vijayawada to Amaravati?', a: 'Yes, Vijayawada to Amaravati (30 km via NH16, ~45 min) starts from ₹599 one way. Regular shuttles available for government employees. Amaravati Secretariat and Assembly complex drops available. Return cabs bookable from Amaravati.' },
        { q: 'Can I rent a car for local Vijayawada sightseeing?', a: 'Yes, full-day Vijayawada sightseeing (Kanaka Durga Temple, Undavalli Caves, Bhavani Island, Prakasam Barrage) starts from ₹1,299 (Sedan, 8 hrs). Half-day (Kanaka Durga + Bhavani Island) starts from ₹799. Telugu-speaking drivers available.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Vijayawada do TransRentals movers cover?', a: 'TransRentals movers cover all Vijayawada localities — Governorpet, Moghalrajpuram, Benz Circle, Vijayawada East, Vijayawada West, Gunadala, Patamata, and Amaravati road. Intercity moves to Hyderabad (275 km), Guntur (30 km), and Visakhapatnam (360 km) are fully covered.' },
        { q: 'What is the house shifting cost in Vijayawada?', a: '1BHK local shifting within Vijayawada starts from ₹2,800–₹4,500. Move to Guntur (30 km) starts from ₹4,000. Move to Hyderabad (275 km) starts from ₹10,000–₹16,000. Move to Visakhapatnam (360 km) starts from ₹13,000–₹18,000. Fixed quotes with no hidden charges on NH65.' },
        { q: 'Can I book packers and movers from Vijayawada to Amaravati for government office moves?', a: 'Yes, Vijayawada to Amaravati (30 km) office and residential moves are handled with government-grade packing. TransRentals has experience moving official files, computer equipment, and office furniture for AP government offices. Moves on weekends or after office hours available to avoid disruption.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Vijayawada?', a: 'JCB backhoe loaders (₹4,500/day), excavators (8T–20T, from ₹5,500/day), transit mixers, and cranes are available for Vijayawada city construction and the Amaravati capital region development projects. High demand means 48-hr advance booking is recommended for peak season (Jan–May).' },
        { q: 'Can I rent excavators or cranes for Krishna River embankment projects near Vijayawada?', a: 'Yes, heavy equipment including long-reach excavators (₹9,000/day) and mobile cranes (20T–40T, from ₹22,000/day) are available for flood control, irrigation, and riverbank infrastructure projects near Vijayawada. APGENCO and APCRDA contractor-grade equipment available with operator and fuel-not-included options.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Vijayawada per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Vijayawada. Half-day from ₹749. Amaravati construction material deliveries and Vijayawada wholesale market-to-retail transport are high-demand routes.' },
        { q: 'Can I hire a tempo from Vijayawada to Guntur for goods transport?', a: 'Yes, Vijayawada to Guntur (30 km, ~₹1,500 one way) is a high-frequency route. TransRentals tempos cover this corridor multiple times daily. For loads between 500 kg and 1.5T, dedicated Tata Ace or Bolero Camper is arranged. Same-day booking available.' },
      ],
    },
  },

  tirupati: {
    intro: 'Tirupati is the world\'s most visited pilgrimage city, with over 50,000–80,000 devotees visiting the Venkateswara Temple (Tirumala) every day. This makes Tirupati one of India\'s highest-demand car rental cities, with round-the-clock airport transfers, Tirumala ghat road drops, and circumambulation routes in constant demand. The city is well-connected via NH40, NH516, and a major airport. Cab services operate 24/7 to cater to devotees arriving on overnight trains and flights.',
    routes: [
      { to: 'Tirumala (TTD)', distance: '20 km', duration: '45 min', via: 'Ghat Road (one way)' },
      { to: 'Chennai', distance: '145 km', duration: '2.5 hrs', via: 'NH40' },
      { to: 'Bangalore', distance: '245 km', duration: '4 hrs', via: 'NH40 → NH44' },
      { to: 'Vijayawada', distance: '415 km', duration: '6 hrs', via: 'NH65' },
      { to: 'Kadapa', distance: '135 km', duration: '2.5 hrs', via: 'NH516' },
      { to: 'Hyderabad', distance: '560 km', duration: '8 hrs', via: 'NH40 → NH65' },
    ],
    tips: [
      'Tirumala ghat road: Alipiri route (uphill) and Srivari Mettu route (both have separate up/down timings) — confirm with driver',
      'Parking at Tirumala is extremely limited — drop by cab and return to Tirupati; do not wait in Tirumala for hours',
      'Book airport/railway station cabs 24 hrs in advance during Brahmotsavam and Vaikunta Ekadashi festivals',
      'Tirupati-Chennai NH40 is a fast 2-lane highway — night travel is common for devotees returning after darshan',
    ],
    stats: { population: '4.7 Lakh', knownFor: 'Tirumala Venkateswara Temple, world\'s most visited pilgrimage site', airport: 'Tirupati Airport (15 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Tirupati with a driver is essential for navigating the Tirumala ghat road, circumambulation circuit, and return trips to the railway station or airport. TransRentals provides 24/7 cab service for devotees on all arrival and departure slots.',
      'self-drive-car-rentals': 'Self-drive car rentals in Tirupati are available for Chennai and Bangalore highway routes. Tirumala ghat road is restricted for personal vehicles at certain times — always hire a driver for Tirumala drops.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the cab fare from Tirupati to Tirumala?', a: 'Cab from Tirupati to Tirumala (20 km via Alipiri Ghat Road, ~45 min) starts from ₹600 one way. Shared cab (6-seater) from APSRTC stand starts from ₹120/person. Private cab (Innova/Sumo) for group of 4–6 starts from ₹900 round trip with 2 hrs waiting.' },
        { q: 'What is the car rental rate in Tirupati per day?', a: 'Hatchback with driver starts from ₹999/day. Innova Crysta (best for group pilgrim trips) from ₹2,499/day. For Chennai outstation (145 km via NH40), packages start from ₹2,999 (Sedan, one way with driver).' },
        { q: 'What is the cab fare from Tirupati Airport to the city?', a: 'Pre-booked cab from Tirupati Airport (15 km, ~20 min) to city starts from ₹449. Tirumala direct drop from airport (35 km) starts from ₹1,099. Fixed rates — no overcharging. 24/7 availability for midnight pilgrim arrivals.' },
        { q: 'Can I book a cab from Tirupati to Bangalore?', a: 'Tirupati to Bangalore (245 km via NH40 → NH44, ~4 hrs) starts from ₹4,299 (Sedan, one way). Route passes through Palamaneer and Hindupur — good 2-lane road. Night travel is smooth. Weekly shuttle options available for regular travellers.' },
        { q: 'Is there a car rental for Tirupati local sightseeing (apart from Tirumala)?', a: 'Yes, Tirupati local sightseeing (Sri Govindarajaswamy Temple, Kapila Theertham, Padmavathi Temple Tiruchanur, ISKCON Tirupati) takes 4–5 hrs. Half-day package starts from ₹899. Tiruchanur Padmavathi Temple is 5 km from Tirupati city — a quick add-on to most itineraries.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Tirupati do TransRentals movers cover?', a: 'TransRentals movers cover all Tirupati localities — Alipiri, Korlagunta, Karakambadi Road, Tiruchanur, Renigunta, and the Tirupati Urban Development Authority zones. Intercity moves to Chennai (145 km), Bangalore (245 km), and Nellore (170 km) are fully covered. Tirumala-specific moves (hilltop) require TTD-authorized vehicles — we coordinate this.' },
        { q: 'What is the house shifting cost in Tirupati?', a: '1BHK local shifting within Tirupati starts from ₹2,800–₹4,500. Move to Chennai (145 km) starts from ₹7,000–₹11,000. Move to Bangalore (245 km) starts from ₹10,000–₹15,000. For pilgrim-season months (October–November, festival times), book at least 2 weeks in advance as all vehicle capacity is in high demand.' },
        { q: 'Can I hire packers and movers to shift from Tirupati to Bangalore or Chennai?', a: 'Yes, Tirupati to Bangalore (245 km via NH40 → NH44) and Tirupati to Chennai (145 km via NH40) are regularly served routes. Full household, vehicle transport, and fragile item packing available. Fixed-rate quotes are issued with itemized breakdown — no surprise highway charges.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Tirupati?', a: 'JCB backhoe loaders (₹4,000/day), mini excavators (₹3,500/day), concrete mixers, and compactors are available in Tirupati for the city\'s ongoing urban expansion projects. TTD-area construction has specific zone restrictions — confirm equipment access permits before booking for Tirumala-adjacent sites.' },
        { q: 'Can I rent a JCB or excavator for construction work in Tirupati?', a: 'Yes, JCBs and excavators are available for independent house construction and site development in Tirupati. Red soil (laterite-type) in the area responds well to standard backhoe attachments. Rates: JCB with operator from ₹4,000/day, mini excavator from ₹3,500/day. Advance booking of 24 hrs recommended.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Tirupati per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Tirupati. Half-day (4 hrs) from ₹749. Common uses: grocery and supply runs for dharamshala operators, hotel linen transport, and pilgrim souvenir shop restocking near Alipiri area.' },
        { q: 'Can I hire a tempo for goods transport from Tirupati to Renigunta or Nellore?', a: 'Yes, Tirupati to Renigunta (10 km, ~₹800 one way) and Tirupati to Nellore (170 km, ~₹3,500 one way) tempo services are available on same-day booking for loads under 1.5T. Renigunta is also where Tirupati Railway Junction is located — goods can be loaded/unloaded at freight terminals.' },
      ],
    },
  },

  raipur: {
    intro: 'Raipur is the capital of Chhattisgarh and the state\'s primary commercial and administrative hub. Car rental demand is driven by state government officials, Bhilai steel industry workers, and tourists visiting the Chitrakote Waterfalls, Bastar tribal circuit, and Sirpur heritage sites. NH30 connects Raipur to Nagpur (280 km), while NH53 links it to Visakhapatnam. The city\'s airport handles multiple daily flights from Delhi, Mumbai, and Bangalore, driving airport cab demand.',
    routes: [
      { to: 'Nagpur', distance: '280 km', duration: '4.5 hrs', via: 'NH30' },
      { to: 'Bilaspur', distance: '120 km', duration: '2 hrs', via: 'NH130' },
      { to: 'Jagdalpur (Bastar)', distance: '300 km', duration: '6 hrs', via: 'NH30 → NH63' },
      { to: 'Chitrakote Falls', distance: '340 km', duration: '6.5 hrs', via: 'NH63' },
      { to: 'Bhilai', distance: '30 km', duration: '45 min', via: 'NH53' },
      { to: 'Bhopal', distance: '475 km', duration: '7 hrs', via: 'NH30 → NH46' },
    ],
    tips: [
      'Raipur-Nagpur NH30 has excellent road quality — one of Central India\'s fastest highways',
      'Bastar circuit (Chitrakote, Kanger Valley, Jagdalpur) requires 2–3 days — plan overnight stays',
      'Raipur Airport cabs should be pre-booked — limited auto availability at night terminal',
      'Bhilai Steel Plant area visits require advance booking for Industrial area drops',
    ],
    stats: { population: '12.3 Lakh', knownFor: 'Chhattisgarh capital, steel industry, Bastar tribal heritage', airport: 'Swami Vivekananda Airport, Raipur (15 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Raipur with a driver is the standard for government officials, corporate visitors, and tourists exploring the Bastar region. TransRentals provides cabs for Raipur-Nagpur corridor, Jagdalpur trips, and Sirpur heritage circuit.',
      'self-drive-car-rentals': 'Self-drive car rentals in Raipur are available for the Raipur-Bilaspur highway and Bhilai day trips. SUVs recommended for Bastar forest roads. Hatchbacks from ₹799/day.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Raipur per day?', a: 'Hatchback with driver starts from ₹999/day in Raipur. Sedan starts from ₹1,299/day. SUV (Innova/Bolero) from ₹2,499/day. For Nagpur outstation (280 km via NH30), one-way package starts from ₹4,999.' },
        { q: 'What is the cab fare from Raipur Airport to the city?', a: 'Pre-booked cab from Swami Vivekananda Airport (15 km, ~25 min) to Raipur city centre starts from ₹449. Fixed airport rate. Night transfers (after 11 PM) available 24/7. Bhilai drop from airport starts from ₹849.' },
        { q: 'Can I book a cab from Raipur to Jagdalpur (Bastar)?', a: 'Raipur to Jagdalpur (300 km via NH30 → NH63, ~6 hrs) starts from ₹5,999 (Innova or Bolero). Road conditions improve significantly after the Kondagaon section — SUV recommended. Jagdalpur is the base for Chitrakote Waterfalls, Kanger Valley, and Bastar tribal villages.' },
        { q: 'Is a cab available from Raipur to Nagpur?', a: 'Yes, Raipur to Nagpur (280 km via NH30, ~4.5 hrs) starts from ₹4,999 (Sedan). NH30 is a quality 4-lane highway through Gondia. Shared shuttle packages also available for regular travellers on this corridor.' },
        { q: 'Can I hire a car for Raipur local sightseeing?', a: 'Yes, Raipur local sightseeing (Purkhouti Muktangan, Mahant Ghasi Das Museum, Dudhadhari Math, Nandan Van Zoo) takes 4–5 hrs. Half-day package starts from ₹999. Full-day packages including Sirpur (80 km) start from ₹1,999.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Raipur do TransRentals movers cover?', a: 'TransRentals movers cover all Raipur localities — Shankar Nagar, Telibandha, Civil Lines, Pandri, GE Road, Ring Road 1 & 2, Mandir Hasaud, and Devendra Nagar. Intercity moves to Nagpur (280 km), Bilaspur (130 km), and Bhubaneswar (500 km) are fully covered. Bhilai steel plant employee housing moves are handled regularly.' },
        { q: 'What is the house shifting cost in Raipur?', a: '1BHK local shifting within Raipur starts from ₹2,800–₹4,500. Move to Bilaspur (130 km) starts from ₹5,500. Move to Nagpur (280 km) starts from ₹9,500–₹14,000. For government employees transferring within Chhattisgarh, TransRentals can provide TA/DA-compatible billing documents.' },
        { q: 'Can I book packers and movers for a Raipur to Nagpur or Bhubaneswar shift?', a: 'Yes, Raipur to Nagpur (280 km via NH30, ~4.5 hrs) and Raipur to Bhubaneswar (500 km via NH53, ~9 hrs) are fully covered routes. Full household packing, loading, transit, and unloading handled. Fixed-price quote before departure — no surprise highway charges on NH30 or NH53.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Raipur?', a: 'JCB backhoe loaders (₹4,500/day), excavators (8T–20T from ₹5,500/day), mobile cranes (15T–30T from ₹15,000/day), and concrete pumps are available in Raipur. Equipment deployed for NMDC and SAIL contractor projects, Bhilai township expansion, and Raipur Smart City infrastructure.' },
        { q: 'Can I rent a JCB or crane for Bhilai or Raipur industrial construction?', a: 'Yes, Raipur and Bhilai have good heavy equipment availability for industrial and civil projects. JCB with operator from ₹4,500/day. Mobile crane (15T) from ₹15,000/day. Hydra crane (12T, for steel structure erection) from ₹12,000/day. Operator, diesel, and transport to site quoted separately.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Raipur per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Raipur. Half-day (4 hrs) from ₹749. Common uses include shop delivery in Pandri market, raw material runs for MSME units, and household appliance delivery across Raipur city.' },
        { q: 'Can I hire a tempo for goods transport from Raipur to Bilaspur or Durg?', a: 'Yes, Raipur to Bilaspur (130 km, ~₹2,800 one way) and Raipur to Durg-Bhilai (35 km, ~₹1,200 one way) tempo services are available same-day for loads under 1.5T. Regular routes mean frequent departures — loads can often be combined for cost sharing.' },
      ],
    },
  },

  aurangabad: {
    intro: 'Aurangabad is Maharashtra\'s historical capital and the gateway to the UNESCO World Heritage Sites of Ajanta and Ellora Caves. The city generates exceptional car rental demand from domestic and international tourists, as well as from the Marathwada administrative and industrial belt. Aurangabad Airport connects to Mumbai and Delhi, and the city is a key outstation hub for Shirdi (115 km), Nashik (190 km), and Pune (240 km). Delhi-Mumbai Industrial Corridor (DMIC) projects have also increased corporate car demand.',
    routes: [
      { to: 'Ellora Caves', distance: '30 km', duration: '45 min', via: 'Ellora Road' },
      { to: 'Ajanta Caves', distance: '100 km', duration: '2 hrs', via: 'NH52' },
      { to: 'Shirdi', distance: '115 km', duration: '2 hrs', via: 'NH160' },
      { to: 'Nashik', distance: '190 km', duration: '3 hrs', via: 'NH160' },
      { to: 'Pune', distance: '240 km', duration: '4 hrs', via: 'NH65' },
      { to: 'Mumbai', distance: '335 km', duration: '5 hrs', via: 'NH160 → NH3' },
    ],
    tips: [
      'Ajanta-Ellora combined 2-cave-site day trip (130 km total loop) — depart by 7 AM from Aurangabad',
      'Aurangabad to Ajanta: take the Fardapur road (NH52) — faster than old Jalgaon road',
      'Daulatabad Fort is 13 km from Aurangabad — combine with Ellora for a full-day history tour',
      'Kailash Temple at Ellora (Cave 16) requires walking — park at the main Ellora complex entrance',
    ],
    stats: { population: '11.7 Lakh', knownFor: 'Ajanta-Ellora UNESCO caves, Bibi Ka Maqbara, Aurangzeb\'s capital', airport: 'Aurangabad Airport (10 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Aurangabad with a driver is the most popular way to do the Ajanta-Ellora UNESCO circuit. TransRentals provides English and Marathi-speaking drivers expert in the cave routes and local historical sights. Dedicated Ajanta + Ellora full-day packages available.',
      'self-drive-car-rentals': 'Self-drive car rentals in Aurangabad are available for the Ellora day trip and Nashik highway drives. Hatchbacks from ₹799/day. Ajanta cave parking is managed — drop and collect cab recommended over waiting at Ajanta.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Aurangabad per day?', a: 'Hatchback with driver starts from ₹999/day. Innova Crysta from ₹2,499/day. Full-day Ajanta + Ellora UNESCO cave circuit (130 km round trip, 10–12 hrs) starts from ₹2,499 (Innova with driver). Ellora-only half day starts from ₹999.' },
        { q: 'Can I book a cab from Aurangabad to cover both Ajanta and Ellora in one day?', a: 'It is technically possible but exhausting — Ajanta (100 km away) + Ellora (30 km away) covers 260 km round trip. Recommended: Day 1 Ellora (Kailash Temple) + Daulatabad; Day 2 Ajanta full day. If doing both in one day, depart by 6 AM. Package starts from ₹2,799.' },
        { q: 'Is a cab available from Aurangabad to Shirdi?', a: 'Aurangabad to Shirdi (115 km via NH160, ~2 hrs) starts from ₹2,299 (Sedan, one way). Shirdi Sai Baba Temple round trip with 4 hrs waiting starts from ₹3,799. Shani Shingnapur (30 km from Shirdi) can be combined — package starts from ₹4,499.' },
        { q: 'What is the cab fare from Aurangabad Airport to city?', a: 'Pre-booked cab from Aurangabad Airport (10 km, ~20 min) to city centre starts from ₹399. Fixed airport rate. Cave hotel drops (near Ellora/Ajanta) are arranged as separate outstation packages. Night arrivals served 24/7.' },
        { q: 'Can I book a car from Aurangabad to Mumbai?', a: 'Aurangabad to Mumbai (335 km via NH160 → NH3, ~5 hrs) starts from ₹5,499 (Sedan, one way). Route via Nashik-Kasara Ghats is scenic. For weekend return to Mumbai, book Friday afternoon — slots fill up fast.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Aurangabad do TransRentals movers cover?', a: 'TransRentals movers cover all Aurangabad localities — Cidco, Garkheda, Hudco, Osmanpura, TV Centre, Waluj MIDC, and N-1 to N-12 sectors. Intercity moves to Pune (240 km), Mumbai (335 km), Nashik (190 km), and Hyderabad (550 km) are fully covered. MIDC Waluj industrial zone office and factory moves are a specialty.' },
        { q: 'What is the house shifting cost in Aurangabad?', a: '1BHK local shifting within Aurangabad starts from ₹2,800–₹4,500. Move to Nashik (190 km) starts from ₹7,000. Move to Pune (240 km) starts from ₹9,000–₹13,000. Move to Mumbai (335 km) starts from ₹12,000–₹18,000. Tourist season moves (October–February, Ajanta/Ellora peak) — book movers 2 weeks ahead.' },
        { q: 'Can I hire packers and movers for Aurangabad to Pune or Mumbai relocation?', a: 'Yes, Aurangabad to Pune and Mumbai are the most-requested intercity routes from Aurangabad. Full household, vehicle transport (bike towing), and fragile item packing available. Fixed price quotes with itemized costs. NH160 and NH3 are both well-maintained — transit is completed in single day.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Aurangabad?', a: 'JCB backhoe loaders (₹4,500/day), excavators (₹5,500/day), mobile cranes (15T–25T from ₹16,000/day), and concrete pumps are available for Aurangabad\'s MIDC Waluj expansion and DMIC corridor projects. Hydra cranes for prefab panel installation in warehouses start from ₹12,000/day.' },
        { q: 'Can I rent a crane or JCB for MIDC Waluj industrial construction in Aurangabad?', a: 'Yes, MIDC Waluj is one of Maharashtra\'s major auto-component manufacturing zones, and equipment rental demand is high. Mobile cranes for plant equipment installation start from ₹16,000/day. JCBs for site preparation from ₹4,500/day. Advance booking of 72 hrs recommended during peak construction season (Oct–March).' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Aurangabad per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Aurangabad. Half-day (4 hrs) from ₹749. Common uses: Waluj MIDC auto parts delivery, tourist souvenir supply to Ellora/Ajanta gate shops, and fabric/garment delivery in the textile cluster.' },
        { q: 'Can I hire a tempo for goods transport from Aurangabad to Nashik or Pune?', a: 'Yes, Aurangabad to Nashik (190 km, ~₹3,800 one way) and Aurangabad to Pune (240 km, ~₹4,800 one way) tempo services are available for loads up to 1.5T. NH160 is a smooth highway with good rest stops. Same-day booking available for early morning departures.' },
      ],
    },
  },

  ranchi: {
    intro: 'Ranchi is the capital of Jharkhand and a rapidly developing city with strong industrial ties to the Tata-Jamshedpur corridor and Bokaro Steel City. Car rental demand in Ranchi is driven by government officials, SAIL/RINL employees, and tourists visiting the Dassam Falls, Hundru Falls, and Betla National Park. NH33 connects Ranchi to Jamshedpur (130 km) and Kolkata (390 km), while NH75 links to Varanasi. The city is also the starting point for Puri, Bhubaneswar, and Vizag road trips.',
    routes: [
      { to: 'Jamshedpur', distance: '130 km', duration: '2.5 hrs', via: 'NH33' },
      { to: 'Bokaro', distance: '90 km', duration: '1.5 hrs', via: 'NH23' },
      { to: 'Dhanbad', distance: '155 km', duration: '3 hrs', via: 'NH23' },
      { to: 'Patna', distance: '330 km', duration: '6 hrs', via: 'NH939 → NH30' },
      { to: 'Bhubaneswar', distance: '440 km', duration: '7 hrs', via: 'NH23 → NH16' },
      { to: 'Betla National Park', distance: '155 km', duration: '3 hrs', via: 'NH75' },
    ],
    tips: [
      'Ranchi-Jamshedpur NH33 is a good 4-lane highway — the fastest industrial corridor route in Jharkhand',
      'Dassam Falls and Hundru Falls are 40–55 km from Ranchi — best visited early morning to avoid weekend crowds',
      'Betla National Park requires a forest jeep inside — book cab to park gate and arrange safari separately',
      'Ranchi Airport has limited pre-paid auto availability — pre-booking cabs is strongly recommended',
    ],
    stats: { population: '11.7 Lakh', knownFor: 'Jharkhand capital, waterfalls, tribal culture, steel industry gateway', airport: 'Birsa Munda Airport, Ranchi (7 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Ranchi with a driver is used by government officials for state secretariat commutes and by tourists visiting Jharkhand\'s famous waterfalls and tribal areas. TransRentals provides cabs for Ranchi-Jamshedpur-Bokaro corridor and nature circuit tours.',
      'self-drive-car-rentals': 'Self-drive car rentals in Ranchi are available for highway trips to Jamshedpur and Bokaro. Forest road trips to Betla require experienced local knowledge — driver-driven recommended.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Ranchi per day?', a: 'Hatchback with driver starts from ₹999/day in Ranchi. Sedan from ₹1,299/day. Bolero/Innova from ₹2,499/day. For Jamshedpur outstation (130 km via NH33), package starts from ₹2,799 (one way, Sedan).' },
        { q: 'What is the cab fare from Birsa Munda Airport to Ranchi city?', a: 'Pre-booked cab from Birsa Munda Airport (7 km, ~15 min) to Ranchi city starts from ₹349. Fixed airport rate — no negotiation. Harmu, Lalpur, and Kanke area drops within 20 minutes. Night transfer available 24/7.' },
        { q: 'Can I book a cab from Ranchi to Dassam Falls and Hundru Falls?', a: 'Yes, combined Dassam Falls (40 km) + Hundru Falls (55 km) day trip starts from ₹1,799 (Sedan, half day, 100 km). Both waterfalls are best visited October–January when water levels are high after monsoon. Depart by 8 AM to beat crowds.' },
        { q: 'Is there a cab from Ranchi to Jamshedpur?', a: 'Ranchi to Jamshedpur (130 km via NH33, ~2.5 hrs) starts from ₹2,799 (Sedan, one way). NH33 is a 4-lane highway through the Chota Nagpur Plateau — smooth and fast. One-way Bolero starts from ₹3,299.' },
        { q: 'Can I hire a car for a Ranchi to Betla National Park trip?', a: 'Ranchi to Betla National Park (155 km via NH75, ~3 hrs) starts from ₹3,499 (Bolero/SUV recommended for forest roads). Inside the park, forest department jeep safari is required — arrange separately at the park gate. Package including overnight with driver available from ₹6,999 (2 days).' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Ranchi do TransRentals movers cover?', a: 'TransRentals movers cover all Ranchi localities — Harmu, Lalpur, Kanke, Bariatu, Morabadi, Argora, Doranda, Hinoo, and Jharkhand IT Services cluster near Namkum. Intercity moves to Jamshedpur (130 km), Bokaro (100 km), Patna (330 km), and Kolkata (390 km) are fully covered. RINL and SAIL employee housing moves handled regularly.' },
        { q: 'What is the house shifting cost in Ranchi?', a: '1BHK local shifting within Ranchi starts from ₹2,800–₹4,500. Move to Jamshedpur (130 km) starts from ₹5,500. Move to Patna (330 km) starts from ₹10,000–₹15,000. Move to Kolkata (390 km) starts from ₹13,000–₹18,000. Government employee transfer moves with TA/DA billing documentation available.' },
        { q: 'Can I book packers and movers for a Ranchi to Kolkata or Patna shift?', a: 'Yes, Ranchi to Kolkata (390 km via NH33, ~7 hrs) and Ranchi to Patna (330 km via NH22, ~6 hrs) are fully covered. Full household packing, transit, and unloading at destination. Fixed-price quotes with no highway toll surprises. Truck size allocated based on household inventory provided at booking.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Ranchi?', a: 'JCB backhoe loaders (₹4,500/day), excavators (8T–20T from ₹5,500/day), mobile cranes, and compactors are available for Ranchi\'s Smart City projects and Jharkhand government infrastructure. Equipment vendors are based in the industrial areas near Tatisilwai and Namkum.' },
        { q: 'Can I rent a JCB or excavator for foundation work in Ranchi?', a: 'Yes, JCB and excavator rental for independent house construction is widely available in Ranchi. Rocky laterite terrain in the Ranchi plateau area requires powerful excavators — standard 8T class is recommended for foundation digging. JCB with operator from ₹4,500/day. Book 48 hrs in advance for Kanke and Bariatu areas.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Ranchi per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Ranchi. Half-day (4 hrs) from ₹749. Common uses include Main Road market goods delivery, Harmu housing colony furniture shifts, and construction material supply for residential projects.' },
        { q: 'Can I hire a tempo for goods transport from Ranchi to Jamshedpur or Bokaro?', a: 'Yes, Ranchi to Jamshedpur (130 km, ~₹2,800 one way) and Ranchi to Bokaro (100 km, ~₹2,200 one way) tempo services are available for loads under 1.5T. NH33 (Ranchi–Jamshedpur) is a major industrial highway with consistent traffic — dedicated vehicles dispatched in 2–4 hrs on same-day booking.' },
      ],
    },
  },

  kozhikode: {
    intro: 'Kozhikode (Calicut) is Kerala\'s northern commercial hub and a city of immense historical significance as Vasco da Gama\'s first Indian port of call. The city drives car rental demand across Malabar\'s tourism and business belt, serving the Wayanad hill circuit, Kannur beaches, and Ooty-Mysore route. Calicut International Airport is a major Gulf-return NRI hub — airport cab demand is exceptionally high. The city is also the gateway to the iconic Wayanad plateau for trekkers and coffee estate visitors.',
    routes: [
      { to: 'Wayanad (Kalpetta)', distance: '75 km', duration: '2 hrs', via: 'NH212' },
      { to: 'Kannur', distance: '90 km', duration: '2 hrs', via: 'NH66' },
      { to: 'Ooty', distance: '155 km', duration: '4 hrs', via: 'NH212 → Ooty Road' },
      { to: 'Mysore', distance: '250 km', duration: '5 hrs', via: 'NH212 → NH275' },
      { to: 'Kochi', distance: '185 km', duration: '3.5 hrs', via: 'NH66' },
      { to: 'Malappuram', distance: '55 km', duration: '1 hr', via: 'NH66' },
    ],
    tips: [
      'Wayanad road (Thamarassery Churam ghat — 9 hairpin bends) is breathtaking but requires slow careful driving — hire a local driver',
      'Calicut Airport NRI arrivals peak on Friday nights (Gulf flights) — pre-book airport cabs 48 hrs in advance',
      'Kozhikode Beach and Beypore Port area have evening traffic — avoid 5–8 PM on the coastal road',
      'Ooty via Wayanad route has Bandipur Tiger Reserve section (6 PM–6 AM no vehicle movement) — time the trip carefully',
    ],
    stats: { population: '6.1 Lakh', knownFor: 'Calicut Beach, Zamorin history, Malabar cuisine, NRI Gulf hub', airport: 'Calicut International Airport (23 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Kozhikode with a driver is the preferred way to navigate the Wayanad ghat road, Malabar coastal route, and Gulf NRI family outings. TransRentals provides Malayalam-speaking drivers experienced on NH66 coastal highway and the hilly Wayanad circuit.',
      'self-drive-car-rentals': 'Self-drive car rentals in Kozhikode are available for the NH66 coastal highway. Wayanad and Ooty ghat roads are NOT recommended for self-drive — experienced local drivers essential. Hatchbacks from ₹799/day for flat terrain.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Kozhikode per day?', a: 'Hatchback with driver starts from ₹999/day in Kozhikode. Innova Crysta from ₹2,499/day. Wayanad day trip (75 km one way, full day with driver) starts from ₹2,299 (Innova recommended for ghat roads).' },
        { q: 'What is the cab fare from Calicut Airport to Kozhikode city?', a: 'Pre-booked cab from Calicut International Airport (23 km, ~30 min via NH66) to Kozhikode city starts from ₹699. Fixed airport rate. Wayanad Kalpetta drop from airport (75 km) starts from ₹1,999. Night transfer (Gulf flight arrivals post-midnight) available 24/7.' },
        { q: 'Is a cab available from Kozhikode to Wayanad?', a: 'Yes, Kozhikode to Wayanad (Kalpetta, 75 km via NH212, ~2 hrs including ghat) starts from ₹1,999 (Innova, one way). Thamarassery Ghat has 9 hairpin bends — experienced ghat drivers provided. Chembra Peak, Soochipara Falls, and Edakkal Caves are the main Wayanad stops.' },
        { q: 'Can I hire a car from Kozhikode to Ooty?', a: 'Kozhikode to Ooty (155 km via Wayanad → Gudalur, ~4 hrs) starts from ₹3,499 (Innova, one way). Route passes through Wayanad and enters Tamil Nadu via Gudalur. Note: Bandipur forest stretch (Kerala-Karnataka border) has a no-movement window 6 PM–6 AM — plan accordingly.' },
        { q: 'Are airport transfer cabs available for Gulf NRI families in Kozhikode?', a: 'Yes, TransRentals provides pre-booked airport transfer packages specifically for NRI Gulf family arrivals at Calicut Airport. Innova and Tempo Traveller (for large groups) available. Book 48–72 hours in advance for Friday night slots. Fixed rates — no surge for late-night Gulf flight arrivals.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Kozhikode do TransRentals movers cover?', a: 'TransRentals movers cover all Kozhikode localities — Calicut Beach, Mavoor Road, Palayam, Nadakkavu, Chevayur, West Hill, Kunnamangalam, Feroke, and Beypore. Intercity moves to Kochi (190 km), Bangalore (380 km), and Kannur (90 km) are fully covered. NRI household goods import unpacking and placement is a specialty service for Gulf returnees.' },
        { q: 'What is the house shifting cost in Kozhikode?', a: '1BHK local shifting within Kozhikode starts from ₹2,800–₹4,500. Move to Kannur (90 km) starts from ₹4,500. Move to Kochi (190 km) starts from ₹7,500–₹12,000. Move to Bangalore (380 km) starts from ₹14,000–₹20,000. NRI returned goods from customs (Kozhikode Customs Office) — unpacking and delivery to residence available.' },
        { q: 'Are packers available for Kozhikode to Bangalore relocation?', a: 'Yes, Kozhikode to Bangalore (380 km via NH766 Wayanad Ghat, ~7 hrs) is a fully covered route. Full household packing, electronics protection, and furniture dismantling/reassembly available. Wayanad Ghat section has 40+ hairpin bends — our drivers and vehicles are specifically selected for this route.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Kozhikode?', a: 'JCB backhoe loaders (₹4,500/day), mini excavators (₹3,800/day), concrete mixers, and mobile cranes are available in Kozhikode for residential and commercial construction. Laterite stone excavation is common in Malabar — operators experienced with Kerala rock types provided.' },
        { q: 'Can I rent a JCB or excavator for plot development in Kozhikode?', a: 'Yes, mini excavators and JCBs for independent house construction and plot development are widely available in Kozhikode. NRI-funded home construction projects are a major driver of equipment demand in the Calicut district. JCB with operator from ₹4,000/day. Mini excavator from ₹3,500/day. Beypore port area and Ramanattukara sites have quick dispatch.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Kozhikode per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,199/day in Kozhikode. Half-day (4 hrs) from ₹749. Common uses include Kozhikode wholesale spice market (Kuttichira) deliveries, Belapur fish market transport, and NRI household goods last-mile delivery from Kozhikode Customs.' },
        { q: 'Can I hire a tempo for goods transport from Kozhikode to Kochi or Kannur?', a: 'Yes, Kozhikode to Kannur (90 km, ~₹2,200 one way) and Kozhikode to Kochi (190 km, ~₹4,000 one way) tempo services are available. NH66 is a smooth coastal highway. For NRI cargo (electronics, furniture from Dubai or Kuwait) cleared through Kozhikode Customs, dedicated delivery vehicles with labour are available.' },
      ],
    },
  },

  shimla: {
    intro: 'Shimla is Himachal Pradesh\'s capital and India\'s most iconic hill station, generating massive car rental demand from Delhi, Chandigarh, and Punjab travelers. The city is accessible via NH5 (Shimla-Chandigarh) and NH22, and serves as the gateway to Kinnaur, Spiti, and the Hindustan-Tibet Highway. Car rentals are essential in Shimla because the old town is a no-vehicle zone and tourists rely on cabs for all mobility. Winter snowfall and summer tourist season create year-round demand spikes.',
    routes: [
      { to: 'Chandigarh', distance: '115 km', duration: '2.5 hrs', via: 'NH5' },
      { to: 'Manali', distance: '265 km', duration: '7 hrs', via: 'NH3' },
      { to: 'Kufri', distance: '16 km', duration: '30 min', via: 'NH5' },
      { to: 'Chail', distance: '45 km', duration: '1.5 hrs', via: 'Chail Road' },
      { to: 'Delhi', distance: '360 km', duration: '7 hrs', via: 'NH5 → NH44' },
      { to: 'Kinnaur (Reckong Peo)', distance: '235 km', duration: '7 hrs', via: 'NH5 → NH22' },
    ],
    tips: [
      'Old Shimla Mall Road and Cart Road are pedestrian-only — drop at Scandal Point or Victory Tunnel and walk',
      'Snow period (Dec–Feb): only chains/snow tyres allowed on Shimla-Kufri road — use vendor vehicles with proper equipment',
      'Chandigarh-Shimla NH5 has sharp hairpin bends from Dharampur onwards — local drivers strongly preferred',
      'Kinnaur/Spiti route requires Inner Line Permit — arrange before departure and carry all documents',
    ],
    stats: { population: '1.7 Lakh', knownFor: 'Queen of Hills, Mall Road, Viceregal Lodge, Christ Church, winter sports', airport: 'Shimla Airport (23 km, seasonal/limited)' },
    serviceIntros: {
      'car-rental': 'Car rental in Shimla with a driver is the standard for all tourists — the old town is pedestrian-only and mountain roads require experienced Himachali hill drivers. TransRentals provides Swift, Innova, and Thar with drivers who know the Shimla-Kufri-Chail circuit and Kinnaur highway.',
      'self-drive-car-rentals': 'Self-drive car rentals in Shimla are available for experienced mountain drivers only. Chandigarh-Shimla stretch is recommended; Kinnaur and Spiti roads are NOT suitable for self-drive without mountain driving experience. Cars from ₹1,099/day with driver option strongly recommended.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Shimla per day?', a: 'Hatchback with driver starts from ₹1,099/day. Innova Crysta from ₹2,799/day. Tata Sumo/Bolero from ₹2,499/day. Full-day Shimla sightseeing (Kufri, Chail, Jakhu Temple, Mall Road circuit) starts from ₹1,799 (Innova, 8 hrs).' },
        { q: 'Is a cab available from Chandigarh to Shimla?', a: 'Chandigarh to Shimla (115 km via NH5, ~2.5 hrs) starts from ₹2,299 (Sedan, one way). NH5 is a good road until Dharampur — mountain hairpin section from Dharampur to Shimla adds 45 min. Innova or Bolero recommended for families. Snow season (Dec–Feb) — add 60 min.' },
        { q: 'Can I hire a car in Shimla for a Kinnaur trip?', a: 'Yes, Shimla to Kinnaur (Reckong Peo, 235 km via NH22, ~7 hrs) starts from ₹6,999 (Bolero/Sumo, one way). The Hindustan-Tibet Highway (NH22) is one of India\'s most scenic and treacherous mountain roads. Inner Line Permit required for foreign nationals. Experienced Himachali drivers mandatory.' },
        { q: 'Is there a cab from Shimla to Manali?', a: 'Shimla to Manali (265 km via NH3, ~7 hrs) starts from ₹6,499 (Innova, one way). Route passes through Rampur and Kullu — excellent mountain highway. Suitable for June–October; winter road conditions can be challenging. Manali to Shimla Volvo bus also available if you prefer one-way cab.' },
        { q: 'What is the cab fare from Shimla Airport to city?', a: 'Shimla Airport (Jubbarhatti, 23 km) cabs to city start from ₹799. Note: Shimla Airport has limited flights and is seasonal — many visitors arrive via Chandigarh (115 km). Pre-booked cabs strongly recommended from Chandigarh Airport for Shimla transfer.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Shimla do TransRentals movers cover?', a: 'TransRentals movers cover all Shimla areas — Mall Road, Sanjauli, Chhota Shimla, Vikas Nagar, Kasumpti, Tara Devi, Rampur Road, and Shoghi. Intercity moves to Chandigarh (115 km) and Delhi (370 km) are fully covered. Note: old Shimla town (The Mall, Cart Road area) is vehicle-restricted — goods are hand-carried or trolleyed for the last portion.' },
        { q: 'What is the house shifting cost in Shimla?', a: '1BHK local shifting within Shimla starts from ₹4,000–₹6,500 (higher than plains due to mountain access and labour costs). Move to Chandigarh (115 km) starts from ₹7,000. Move to Delhi (370 km) starts from ₹15,000–₹22,000. HP government employee transfers with TA billing documentation available.' },
        { q: 'Can I shift household goods from Shimla to Chandigarh or Delhi?', a: 'Yes, Shimla to Chandigarh (115 km via NH5, ~3 hrs) and Shimla to Delhi (370 km, ~7 hrs) moves are fully covered. The Dharampur-Shimla mountain stretch requires slow driving — plan for 45 minutes extra compared to plains. Fragile item packing with mountain-grade cushioning provided. Fixed-price quotes.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Shimla?', a: 'Mini excavators (₹4,000/day), small backhoe loaders, concrete mixers, and compactors are available in Shimla for hill construction. Full-size equipment is often impractical on narrow mountain lanes — mini versions (1T–3T excavators) are the norm. Equipment sourced from Solan and Parwanoo for Shimla delivery.' },
        { q: 'Can I rent a mini excavator for hill plot development in Shimla?', a: 'Yes, mini excavators (1–3T class) are the standard equipment for slope excavation and terrace cutting in Shimla\'s hill terrain. Rates from ₹4,000/day with operator. Road access confirmation is essential before dispatch — many Shimla residential plots are accessible only via steps or narrow footpaths. TransRentals pre-inspects access routes.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Shimla per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,499/day in Shimla — slightly higher than plains due to mountain road conditions. Half-day (4 hrs) from ₹899. Common uses: hotel and resort supply runs, apple orchard produce transport, and construction material delivery to residential projects.' },
        { q: 'Can I hire a tempo for goods transport from Shimla to Chandigarh or Solan?', a: 'Yes, Shimla to Solan (50 km, ~₹1,800 one way) and Shimla to Chandigarh (115 km, ~₹2,800 one way) tempo services are available. Drivers are experienced with the NH5 mountain bends. Loads over 1T require a dedicated vehicle — shared loads not available on mountain routes due to safety constraints.' },
      ],
    },
  },

  manali: {
    intro: 'Manali is Himachal Pradesh\'s premier adventure and leisure destination, attracting millions of tourists for snow, trekking, Rohtang Pass, Spiti Valley, and Ladakh road trips. Car rental demand peaks May–October (summer-monsoon tourist season) and December–January (snow season). The Delhi-Manali route via Chandigarh and Kullu is one of India\'s most popular road trip routes. Local cab services in Manali are essential as the Rohtang Pass, Solang Valley, and Sissu are all 20–55 km away via mountain roads.',
    routes: [
      { to: 'Rohtang Pass', distance: '52 km', duration: '2.5 hrs', via: 'Old Manali Road' },
      { to: 'Solang Valley', distance: '15 km', duration: '30 min', via: 'NH3' },
      { to: 'Shimla', distance: '265 km', duration: '7 hrs', via: 'NH3' },
      { to: 'Leh (Ladakh)', distance: '480 km', duration: '2 days', via: 'Manali-Leh Highway (NH3)' },
      { to: 'Spiti (Kaza)', distance: '200 km', duration: '7 hrs', via: 'Rohtang → Kunzum → Spiti' },
      { to: 'Chandigarh', distance: '310 km', duration: '7 hrs', via: 'NH3 → NH44' },
    ],
    tips: [
      'Rohtang Pass permit (online NGT permit) required for all vehicles — book at least 2 days in advance',
      'Solang Valley and Rohtang cable car bookings fill up fast in peak season (May–Jun) — pre-arrange with cab driver',
      'Manali-Leh Highway opens typically mid-June — Rohtang (Atal Tunnel shortcut) keeps Lahaul accessible year-round',
      'Manali old town lanes are narrow — use Manu Market parking and take a cab/auto to outer lodges',
    ],
    stats: { population: '8,096 (town); Kullu district: 4.5 Lakh', knownFor: 'Rohtang Pass, Manali-Leh Highway, adventure sports, Hadimba Temple', airport: 'Bhuntar Airport, Kullu (55 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Manali with a driver is essential for Rohtang Pass, Solang Valley, and Spiti Valley trips — mountain roads require experienced local Himachali drivers. TransRentals provides Innova, Bolero, and Thar for the demanding high-altitude routes.',
      'self-drive-car-rentals': 'Self-drive car rentals in Manali are available for confident mountain drivers for the Kullu Valley and Solang Valley. Rohtang Pass and Spiti/Ladakh routes are NOT recommended for self-drive without prior Himalayan driving experience. Cars from ₹1,299/day.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Manali per day?', a: 'Hatchback with driver starts from ₹1,299/day in Manali. Innova Crysta from ₹2,999/day. Bolero/Sumo from ₹2,799/day. Rohtang Pass day trip (52 km each way, full day) with driver starts from ₹2,999 (Innova). Solang Valley half-day starts from ₹999.' },
        { q: 'Can I hire a cab for Rohtang Pass from Manali?', a: 'Yes, Rohtang Pass (3,979 m, 52 km from Manali) cab starts from ₹2,999 (Innova, full day). NGT Rohtang permit must be obtained 2 days in advance at the Forest Department or online — your cab driver usually assists. Atal Tunnel (Rohtang alternate) keeps Lahaul accessible without permit.' },
        { q: 'Is there a cab from Manali to Leh (Ladakh)?', a: 'Manali to Leh (480 km, 2-day drive via NH3) starts from ₹14,999 (Innova/Bolero, one way). Route is open June–October only. Passes: Rohtang, Baralacha, Lachulung, Tanglang La (5,328 m). Overnight stay at Jispa or Pang. Experienced Himalayan drivers mandatory.' },
        { q: 'What is the cab fare from Bhuntar Airport (Kullu) to Manali?', a: 'Pre-booked cab from Bhuntar Airport (55 km, ~1.5 hrs via NH3 Kullu-Manali Highway) to Manali starts from ₹1,499. NH3 is a good mountain road along Beas River — scenic drive. Pre-booking strongly recommended as airport auto taxis overcharge tourists.' },
        { q: 'Can I hire a car in Manali for the Spiti Valley circuit?', a: 'Yes, Manali-Spiti circuit (Manali → Rohtang → Kunzum → Kaza → Pin Valley → Kaza → Shimla, 500 km, 5–7 days) starts from ₹28,000 (Bolero/Sumo with driver). Spiti roads are extremely demanding — only experienced Spiti-route drivers. Inner Line Permit required near Kaza for foreign nationals.' },
      ],
      'packers-and-movers': [
        { q: 'Are packers and movers available in Manali for local household shifting?', a: 'Yes, TransRentals provides local movers for Manali town, Old Manali, Vashisht, Aleo, and Naggar areas. For intercity moves to Kullu (40 km) or Chandigarh (310 km), dedicated vehicles are dispatched from the Kullu-Manali valley. Mountain terrain means packing must account for vibration and sudden braking on hairpin bends.' },
        { q: 'What is the cost to shift a household from Manali to Chandigarh or Delhi?', a: 'Manali to Kullu (40 km) shifting starts from ₹4,500. Manali to Chandigarh (310 km via NH3) starts from ₹12,000–₹18,000. Manali to Delhi (560 km) starts from ₹20,000–₹28,000. Season matters: June–October has good road conditions. Winter moves (Nov–Feb) require chains and add ₹2,000–₹5,000 to cost.' },
        { q: 'Can I move household goods from Manali in winter (after October)?', a: 'Yes, but with important caveats. Rohtang Pass closes by October–November (Atal Tunnel now keeps Lahaul accessible year-round via tunnel). For Manali valley local moves, winter operations continue. For intercity moves after November, vehicles use Atal Tunnel route — book at least 7 days in advance as truck availability is limited.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Manali?', a: 'Mini excavators (₹4,500/day), small concrete mixers, and compactors are available in Manali for hotel/resort construction and residential development. Full-size heavy equipment is rare in the valley — sourced from Kullu or Mandi. Construction season is May–October (pre-winter). Book early in the season.' },
        { q: 'Can I rent a mini excavator for hotel or resort construction in Manali?', a: 'Yes, mini excavators (1–3T) are the standard for hotel and cottage construction on the Manali hillsides. Compact machines navigate narrow mountain access roads. Rates from ₹4,500/day with operator. Site access inspection recommended before dispatch — many resort plots require machine offloading at road and manual site prep beyond.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Manali per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~750 kg to 1T) start from ₹1,599/day in Manali — higher than plains due to limited availability and mountain conditions. Half-day (4 hrs) from ₹999. Common uses: hotel linen/food supply runs, LPG cylinder delivery, and construction material transport for valley-facing properties.' },
        { q: 'Can I hire a tempo for goods delivery to resorts in Manali or Solang Valley?', a: 'Yes, TransRentals tempos serve resort and hotel supply chains across Manali, Solang Valley, and Naggar. Morning delivery slots (7–9 AM) are recommended before tourist traffic peaks on NH3. For loads exceeding 1T (e.g., furniture for new hotel setup), a larger Bolero Camper or small truck is arranged.' },
      ],
    },
  },

  srinagar: {
    intro: 'Srinagar is the summer capital of Jammu & Kashmir and one of India\'s most iconic tourist destinations. The city generates massive car rental demand from tourists visiting Dal Lake, Gulmarg, Pahalgam, and Sonmarg. NH44 connects Srinagar to Jammu (300 km) and the Zoji-La pass opens the Ladakh route. Post-370 abrogation, tourist arrivals have surged significantly, driving unprecedented cab and self-drive demand. Dal Lake Shikara rides, Mughal Gardens, and apple orchard valley drives are key local demand generators.',
    routes: [
      { to: 'Gulmarg', distance: '55 km', duration: '1.5 hrs', via: 'Tangmarg Road' },
      { to: 'Pahalgam', distance: '95 km', duration: '2.5 hrs', via: 'NH44 → Anantnag' },
      { to: 'Sonmarg', distance: '80 km', duration: '2 hrs', via: 'NH1' },
      { to: 'Jammu', distance: '300 km', duration: '6 hrs', via: 'NH44' },
      { to: 'Leh (via Zoji-La)', distance: '430 km', duration: '2 days', via: 'NH1 (seasonal)' },
      { to: 'Yusmarg', distance: '45 km', duration: '1.5 hrs', via: 'Charar-e-Sharif Road' },
    ],
    tips: [
      'Gulmarg and Pahalgam cabs: confirm tourist zone parking permits — outer parking to gondola/pony point is standard',
      'Srinagar inner city (Lal Chowk, Dal Gate area) has heavy traffic 10 AM–6 PM — use early morning for city sightseeing',
      'Jammu-Srinagar NH44 (300 km) has frequent one-way traffic controls due to landslides — check NHAI Kashmir updates',
      'Airport cab from Sheikh ul-Alam International: only pre-booked vehicles allowed in arrival zone — must book in advance',
    ],
    stats: { population: '12.7 Lakh', knownFor: 'Dal Lake, houseboats, Mughal Gardens, Gulmarg ski resort, Shankaracharya Temple', airport: 'Sheikh ul-Alam International Airport (14 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Srinagar with a driver is the preferred choice for tourists visiting Gulmarg, Pahalgam, and Sonmarg. TransRentals provides Sumo, Innova, and Swift with Kashmiri drivers who know the valley roads, seasonal conditions, and tourist zone protocols.',
      'self-drive-car-rentals': 'Self-drive car rentals in Srinagar are available for the Dal Lake boulevard and Mughal Gardens circuit. Pahalgam and Gulmarg routes are best with an experienced local driver due to winding mountain roads and tourist zone restrictions.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the car rental rate in Srinagar per day?', a: 'Hatchback with driver starts from ₹1,299/day in Srinagar. Innova Crysta from ₹2,999/day. Sumo/Bolero from ₹2,799/day. Gulmarg day trip (55 km each way, full day with driver) starts from ₹2,799. Pahalgam full day starts from ₹3,499.' },
        { q: 'Can I book a cab from Srinagar to Gulmarg?', a: 'Srinagar to Gulmarg (55 km via Tangmarg, ~1.5 hrs) starts from ₹2,499 (Sumo/Innova round trip, full day with waiting). Parking is at Gulmarg base — take gondola or pony to higher altitudes. Snow period (Dec–Mar) — carry chains; driver handles all snow-road protocols.' },
        { q: 'Is there a cab from Srinagar to Pahalgam?', a: 'Srinagar to Pahalgam (95 km via NH44 → Anantnag, ~2.5 hrs) starts from ₹3,299 (round trip with full day waiting). Pahalgam is the base for Amarnath Yatra — July–August bookings should be made 3–4 weeks in advance. Betaab Valley and Chandanwari are must-see stops.' },
        { q: 'What is the cab fare from Srinagar Airport to Dal Lake hotels?', a: 'Pre-booked cab from Sheikh ul-Alam Airport (14 km, ~25 min) to Dal Lake area hotels starts from ₹799. Only pre-booked vehicles allowed in arrival pickup zone — on-spot autos/cabs are not available inside the terminal. Book before landing.' },
        { q: 'Can I hire a car for the full Kashmir valley circuit?', a: 'Yes, full Kashmir valley circuit (Srinagar → Gulmarg → Pahalgam → Sonmarg → Doodhpathri → Srinagar, 5 days) starts from ₹18,000 (Innova/Sumo with driver). Includes all local drops and pickups. Amarnath base camp taxi from Pahalgam is arranged separately by JKTDC.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Srinagar do TransRentals movers cover?', a: 'TransRentals movers cover all major Srinagar localities — Lal Chowk, Rajbagh, Hyderpora, Bemina, Nowgam, Pampore, Sopore Road, and Hazratbal. Intercity moves to Jammu (300 km) are fully handled. Seasonal relocation (summer capital → winter stay in Jammu) is a recurring service for J&K government employees and families.' },
        { q: 'What is the house shifting cost in Srinagar?', a: '1BHK local shifting within Srinagar starts from ₹3,500–₹5,500. Srinagar to Jammu (300 km via NH44, ~6 hrs) starts from ₹12,000–₹18,000. Given NH44\'s mountain sections and one-way traffic controls, moves are planned to depart at 6 AM. Government employee seasonal moves (April for Srinagar, November for Jammu) available.' },
        { q: 'Can I book movers for a Srinagar to Jammu seasonal household shift?', a: 'Yes, TransRentals handles the J&K government seasonal move pattern — Srinagar to Jammu in winter (October–November) and Jammu to Srinagar in summer (April–May). Full household including seasonal clothes, kitchen goods, and electronics. Book at least 2 weeks before your transfer date for the seasonal peak weeks.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Srinagar?', a: 'JCB backhoe loaders (₹5,000/day), mini excavators (₹4,500/day), concrete mixers, and compactors are available in Srinagar. Post-Article 370, major infrastructure investment has increased equipment demand significantly. Advance booking of 5–7 days recommended during peak construction season (April–October).' },
        { q: 'Can I rent a JCB or excavator for construction in Srinagar?', a: 'Yes, JCBs and excavators are available for residential, commercial, and government infrastructure construction across Srinagar. Clay and alluvial soil in the Kashmir valley requires standard attachments. JCB with operator from ₹5,000/day. Mini excavator from ₹4,500/day. Equipment from Udhampur and Anantnag vendors can be dispatched to Srinagar sites.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Srinagar per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,499/day in Srinagar. Half-day (4 hrs) from ₹899. Common uses: apple box transport from Srinagar cold storage to Dal Lake area markets, hotel supply runs, and tourist houseboat provisioning.' },
        { q: 'Can I hire a tempo for goods transport within Srinagar or to nearby areas?', a: 'Yes, TransRentals tempos cover Srinagar city and nearby areas including Budgam, Pulwama, Anantnag, and Baramulla. Tourist season (June–September) sees peak demand — book 48 hrs in advance. For apple harvest season loads (September–October), dedicated refrigerated or covered vehicles are available.' },
      ],
    },
  },

  jammu: {
    intro: 'Jammu is the winter capital of Jammu & Kashmir and the primary gateway city for Vaishno Devi pilgrims — the most visited pilgrimage site in North India with over 8 million visitors annually. Car rental demand in Jammu is dominated by pilgrims traveling to Katra (the Vaishno Devi base camp, 50 km), airport transfers, and Srinagar highway trips. NH44 (Jammu-Srinagar National Highway) sees the highest cab traffic in the region. The city is also the starting point for Patnitop, Udhampur, and Bhaderwah hill station trips.',
    routes: [
      { to: 'Katra (Vaishno Devi)', distance: '50 km', duration: '1.5 hrs', via: 'NH144A' },
      { to: 'Patnitop', distance: '115 km', duration: '2.5 hrs', via: 'NH44' },
      { to: 'Srinagar', distance: '300 km', duration: '6 hrs', via: 'NH44' },
      { to: 'Udhampur', distance: '70 km', duration: '1.5 hrs', via: 'NH44' },
      { to: 'Amritsar', distance: '215 km', duration: '4 hrs', via: 'NH44 → NH3' },
      { to: 'Chandigarh', distance: '325 km', duration: '5.5 hrs', via: 'NH44' },
    ],
    tips: [
      'Katra cab booking: JKTDC-registered taxis mandatory for Katra drop — confirm with TransRentals that vehicle is registered',
      'Jammu-Srinagar NH44: one-way traffic controls are frequent — check NHW Kashmir updates before departure',
      'Vaishno Devi peak pilgrimage (Navratri Oct, Jan) — book Katra cabs 10 days in advance',
      'Jammu Airport (Satwari) has limited auto availability at night — pre-book all airport transfers',
    ],
    stats: { population: '5.7 Lakh', knownFor: 'Vaishno Devi gateway, Raghunath Temple, Dogra heritage, winter capital J&K', airport: 'Jammu Airport / Satwari (8 km)' },
    serviceIntros: {
      'car-rental': 'Car rental in Jammu with a driver is the standard for Vaishno Devi pilgrim groups, Srinagar highway travelers, and tourists visiting Patnitop and Bhaderwah. TransRentals provides Sumo, Innova, and Swift with drivers familiar with the NH44 mountain highway protocols.',
      'self-drive-car-rentals': 'Self-drive car rentals in Jammu are limited due to NH44 mountain conditions and J&K permit requirements. Available for Jammu plains local use. Katra and Srinagar routes are NOT recommended for self-drive without prior mountain experience.',
    },
    serviceFAQs: {
      'car-rental': [
        { q: 'What is the cab fare from Jammu to Katra (Vaishno Devi)?', a: 'Jammu to Katra (50 km via NH144A, ~1.5 hrs) starts from ₹1,099 (Sedan, one way). NH144A is a 4-lane road through scenic Trikuta Hills. JKTDC-registered cabs drop at Katra bus stand — onward travel to Bhawan by foot/pony/palki. Round trip with 8–12 hrs waiting starts from ₹1,899.' },
        { q: 'What is the car rental rate in Jammu per day?', a: 'Hatchback with driver starts from ₹999/day. Innova Crysta from ₹2,499/day. Sumo/Bolero from ₹2,299/day. Patnitop day trip (115 km via NH44, full day with driver) starts from ₹2,299.' },
        { q: 'Can I book a cab from Jammu to Srinagar?', a: 'Jammu to Srinagar (300 km via NH44, ~6 hrs) starts from ₹5,499 (Sedan, one way). NH44 passes through Banihal Tunnel (2.5 km) and multiple mountain sections. One-way traffic controls are frequent — departures by 6 AM recommended. Sharing cabs available from Jammu bus stand at lower cost.' },
        { q: 'What is the cab fare from Jammu Airport to city?', a: 'Pre-booked cab from Jammu Airport/Satwari (8 km, ~20 min) to city centre starts from ₹399. Katra drop from airport (60 km) starts from ₹1,499. Night arrivals served 24/7 — pre-booking essential as airport auto availability is limited.' },
        { q: 'Can I book a cab for a Vaishno Devi pilgrimage group from Jammu?', a: 'Yes, group pilgrimage packages from Jammu for Vaishno Devi are available. Tempo Traveller (12–14 seater) from Jammu to Katra starts from ₹3,499 (one way). Round trip with overnight waiting at Katra starts from ₹5,999. Navratri (Oct) — book 2–3 weeks in advance. Helicopter booking at Katra is separate.' },
      ],
      'packers-and-movers': [
        { q: 'Which areas in Jammu do TransRentals movers cover?', a: 'TransRentals movers cover all Jammu localities — Gandhi Nagar, Trikuta Nagar, Bakshi Nagar, Talab Tillo, Nawabad, Rehari, Channi Himmat, and Sunjwan. Intercity moves to Katra (50 km), Srinagar (300 km), and Chandigarh (380 km) are fully covered. J&K government employee seasonal moves (winter capital base) are a high-volume service in October–November.' },
        { q: 'What is the house shifting cost in Jammu?', a: '1BHK local shifting within Jammu starts from ₹2,800–₹4,500. Move to Katra (50 km) starts from ₹4,000. Move to Chandigarh (380 km) starts from ₹13,000–₹18,000. Move to Delhi (600 km) starts from ₹20,000–₹28,000. Navratri (October) and Baisakhi seasons — book at least 2 weeks ahead as vehicle capacity is strained by pilgrim traffic.' },
        { q: 'Can I book packers and movers from Jammu to Chandigarh or Delhi?', a: 'Yes, Jammu to Chandigarh (380 km via NH44 → NH1, ~6 hrs) and Jammu to Delhi (600 km, ~9–10 hrs) are regularly served routes. Full household packing, fragile item protection, and furniture dismantling available. Fixed-price quotes — no highway toll surprises. Vehicles depart early morning to arrive before evening.' },
      ],
      'equipment-rental': [
        { q: 'What construction equipment is available for rent in Jammu?', a: 'JCB backhoe loaders (₹4,500/day), excavators (8T–20T from ₹5,500/day), mobile cranes (15T–25T from ₹16,000/day), and compactors are available for Jammu\'s ongoing Smart City and Jammu Ring Road projects. Trikuta Nagar and Sunjwan industrial area have quick dispatch for standard equipment.' },
        { q: 'Can I rent a crane or excavator for construction near Katra or Udhampur?', a: 'Yes, equipment can be dispatched to Katra (50 km), Udhampur (65 km), and Ramban sites. Mountain road logistics add ₹2,000–₹5,000 transport cost over the Jammu rate. Mobile cranes up to 25T available. TTD (Vaishno Devi Shrine Board) construction contracts often require equipment certification — confirm with vendor.' },
      ],
      'mini-truck-rental': [
        { q: 'What is the mini truck rental rate in Jammu per day?', a: 'Mini trucks (Tata Ace/Mahindra Supro, ~1T) start from ₹1,299/day in Jammu. Half-day (4 hrs) from ₹799. Common uses: Narwal market goods delivery, pilgrimage supply runs to Katra (prasad shops, dhaba provisions), and construction material delivery in Trikuta Nagar residential areas.' },
        { q: 'Can I hire a tempo for goods transport from Jammu to Katra or Udhampur?', a: 'Yes, Jammu to Katra (50 km, ~₹1,800 one way) and Jammu to Udhampur (65 km, ~₹2,200 one way) tempo services are available same-day for loads under 1.5T. NH144A (Jammu–Katra) is a 4-lane expressway — fast transit. Loads for Katra dhaba and hotel operators during Navratri require advance booking by 5–7 days.' },
      ],
    },
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
