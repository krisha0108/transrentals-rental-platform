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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Hyderabad per day?', a: 'Self-drive hatchback in Hyderabad starts from ₹899/day. Sedans (Honda City, Dzire) start from ₹1,199/day. SUVs (Creta, Brezza) start from ₹1,599/day. Standard packages include 150–200 km/day — extra km at ₹12–15/km.' },
        { q: 'Can I self-drive from Hyderabad to Nagarjunasagar or Srisailam?', a: 'Yes, Nagarjunasagar (165 km via NH565) and Srisailam (215 km via NH765) are popular self-drive day trips. Confirm outstation permissions with your vendor. Both routes have good highway conditions. Start early — Srisailam forest section closes at sunset for private vehicles.' },
        { q: 'Which areas in Hyderabad have self-drive car rental pickup points?', a: 'HITECH City, Gachibowli, Madhapur, Banjara Hills, and Secunderabad have the highest self-drive vendor availability. Rajiv Gandhi International Airport (RGIA) pickups are available with advance booking.' },
        { q: 'What documents are required for self-drive car rental in Hyderabad?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). Out-of-state DL holders are accepted. International nationals need an IDP (International Driving Permit) along with their home country DL.' },
        { q: 'Are ORR tolls included in Hyderabad self-drive packages?', a: 'No, ORR tolls are paid separately by the driver. Keep change or FASTag ready for ORR toll plazas. The RGIA-to-city ORR toll is approximately ₹70 per car one-way. Most self-drive packages do not include toll charges.' },
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
      'self-drive-car-rentals': [
        { q: 'Is ECR (East Coast Road) a good drive for a self-drive rental car from Chennai?', a: 'ECR is one of India\'s best coastal highway drives — smooth roads, scenic views, and manageable traffic except on Sunday afternoons. Chennai to Pondicherry (160 km, ~3 hrs) is the most popular ECR self-drive trip. A sedan or compact SUV is ideal for the drive.' },
        { q: 'What is the cost of self-drive car rental in Chennai per day?', a: 'Hatchback self-drive in Chennai starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekly rentals offer 20–25% savings.' },
        { q: 'Can I self-drive from Chennai to Tirupati or Vellore?', a: 'Yes, Chennai to Tirupati (155 km via NH16) and Chennai to Vellore (145 km via NH48) are popular self-drive routes. Confirm outstation permissions with your vendor. For Tirupati, note that the ghat road can be steep — a sedan or SUV with good ground clearance is recommended.' },
        { q: 'Where can I pick up a self-drive car near Chennai airport?', a: 'Vendors near Tirusulam, Pallavaram, and Chromepet serve Chennai Airport pickups. Book at least 24 hours in advance. Some vendors offer free airport drop-off on return if you\'ve booked online via TransRentals.' },
        { q: 'What is the fuel policy for self-drive cars in Chennai?', a: 'Most vendors operate on a full-to-full policy — car is delivered with a full tank and must be returned full. Petrol stations are plentiful across Chennai and on all major highways. Confirm whether the car is petrol or diesel before booking.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Pune per day?', a: 'Hatchback self-drive in Pune starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Creta, XUV300) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekend packages (Fri evening to Mon morning) offer flat rates.' },
        { q: 'Can I drive a self-drive rental car from Pune to Lonavala or Mahabaleshwar?', a: 'Yes, most Pune vendors allow Expressway travel. Lonavala (65 km via NH48, ~1.5 hrs) and Mahabaleshwar (120 km via NH48 then SH58, ~3 hrs) are the most popular self-drive destinations. Note: Mahabaleshwar ghat section requires careful driving — confirm your driving comfort before booking.' },
        { q: 'Can I use a Pune self-drive rental on the Mumbai-Pune Expressway?', a: 'Yes, most vendors permit Expressway usage. The Mumbai-Pune Expressway (NH48) is one of India\'s safest and smoothest highways. Speed limit is 100 km/h. Keep FASTag activated for toll-free passage through Khopoli and Urse toll plazas.' },
        { q: 'Which areas in Pune have the most self-drive rental options?', a: 'Hinjewadi, Baner, Koregaon Park, Kharadi, Viman Nagar, and Kothrud are the top self-drive pickup zones. Pune Airport (PNQ) pickup is available with prior booking. Doorstep delivery in all Pimpri-Chinchwad and PCMC zones is also available.' },
        { q: 'Are monthly self-drive plans available in Pune?', a: 'Yes, monthly self-drive plans in Pune start from ₹18,000/month for a hatchback (2,000–3,000 km included). These are popular with IT consultants on 3–6 month project assignments in Pune. Monthly plans offer significant savings over daily rates.' },
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
    },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Kolkata per day?', a: 'Hatchback self-drive in Kolkata starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekend packages (Fri–Mon) are popular for Digha and Mandarmani beach trips.' },
        { q: 'What are the best outstation self-drive routes from Kolkata?', a: 'Digha (180 km via NH16, ~4 hrs), Mandarmani (190 km via NH116, ~3.5 hrs), and Shantiniketan (160 km via NH19, ~3 hrs) are the top self-drive weekend routes from Kolkata. NH16 to Digha has improved greatly in recent years. Avoid driving on state highways and rural roads at night.' },
        { q: 'Which areas in Kolkata have self-drive car rental options?', a: 'Salt Lake Sector V, Rajarhat New Town, and Behala have the most self-drive vendors. Park Street and Gariahat zones also have options. Doorstep delivery is available across all Kolkata zones with 24 hours\' notice. CCU Airport area pickups are available with advance booking.' },
        { q: 'What documents are required for self-drive car rental in Kolkata?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). West Bengal state DL and out-of-state DLs are both accepted. Carry vehicle documents (RC, insurance) at all times as checkposts are common on NH16.' },
        { q: 'Are there any road conditions to be aware of for self-drive trips from Kolkata?', a: 'NH16 (to Digha) and NH19 (to Shantiniketan) are well-maintained. However, state highways and district roads in rural West Bengal can be narrow with poor lighting. Night driving outside NH stretches is not recommended. Monsoon (June–September) causes flooding on low-lying sections near Kolkata — factor extra time or avoid rural detours.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Jaipur per day?', a: 'Hatchback self-drive in Jaipur starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 200–250 km; extra km at ₹12–15/km. AC is essential — Rajasthan summers regularly hit 42–45°C.' },
        { q: 'Can I self-drive from Jaipur on the Golden Triangle routes to Agra and Delhi?', a: 'Yes, Jaipur to Agra (240 km via NH21, ~4 hrs) and Jaipur to Delhi (280 km via NH48, ~5 hrs) are the most popular self-drive routes. Both highways are in excellent condition. Confirm outstation permissions with your vendor. Avoid NH21 early mornings in December–January due to dense fog.' },
        { q: 'Which areas in Jaipur have self-drive car rental options?', a: 'Vaishali Nagar, Malviya Nagar, C-Scheme, and near Jaipur International Airport (JAI) have the most self-drive vendors. Doorstep delivery is available across all Jaipur zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Jaipur?', a: 'Original DL (minimum 1 year old), Aadhaar Card or valid ID, and a refundable security deposit (₹2,000–₹5,000). Carry vehicle documents at all times — Rajasthan highway checkposts are common. Tourists with international DL can rent with prior vendor approval.' },
        { q: 'Can I self-drive from Jaipur to Ranthambore for a safari?', a: 'Yes, Jaipur to Ranthambore (180 km via NH52, ~3 hrs) is a popular self-drive safari day trip. The safari itself uses forest department jeeps inside the reserve. Confirm outstation permissions with your rental vendor and leave by 4 AM to reach in time for morning safari entry.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Lucknow per day?', a: 'Hatchback self-drive in Lucknow starts from ₹799/day. Sedans start from ₹999/day. SUVs start from ₹1,499/day. Packages include 150–200 km; extra km at ₹10–14/km. Monthly plans available for long-stay consultants.' },
        { q: 'Can I self-drive on the Agra-Lucknow Expressway?', a: 'Yes, the Agra-Lucknow Expressway (302 km, ~4.5 hrs to Agra) is one of India\'s best expressways — smooth, well-lit, and well-patrolled. Most vendors permit expressway travel. Confirm outstation permissions when booking. Note: winter fog (December–January) reduces visibility on the expressway — drive carefully or avoid early morning drives.' },
        { q: 'What are the top self-drive destinations from Lucknow?', a: 'Ayodhya (130 km via NH27, ~2.5 hrs) is the top self-drive pilgrimage route after Ram Mandir inauguration. Prayagraj (210 km via NH31, ~3.5 hrs) and Agra (330 km via Expressway) are popular day trips. Varanasi (320 km via NH19) makes a great 2-day self-drive from Lucknow.' },
        { q: 'Which areas in Lucknow have self-drive car rental options?', a: 'Gomti Nagar, Vibhuti Khand, and Hazratganj are the main self-drive pickup zones. Chaudhary Charan Singh Airport (LKO) area pickups are also available with advance booking. Doorstep delivery across all Lucknow zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Lucknow?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹4,000). UP highway checkposts are common — keep vehicle documents readily accessible. Out-of-state DL holders are accepted by most vendors.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Nagpur per day?', a: 'Hatchback self-drive in Nagpur starts from ₹799/day. Sedans start from ₹999/day. SUVs (Creta, Scorpio) start from ₹1,499/day. Packages include 100–150 km; extra km at ₹10–14/km. Safari-day packages with higher km limits are available for Pench and Tadoba trips.' },
        { q: 'Which are the best self-drive wildlife routes from Nagpur?', a: 'Pench Tiger Reserve (85 km via NH44, ~1.5 hrs) is the easiest self-drive safari day trip from Nagpur. Tadoba Andhari Tiger Reserve (150 km via NH930, ~3 hrs) is the most popular 1-night self-drive. Kanha National Park (275 km) makes a great 2-day self-drive weekend trip.' },
        { q: 'Which areas in Nagpur have self-drive car rental options?', a: 'Civil Lines, Dharampeth, and near Dr. Babasaheb Ambedkar Airport (NAG) have self-drive vendors. Airport pickups with 24 hours\' advance booking are available. Wardha Road and MIHAN zone vendors also offer doorstep delivery.' },
        { q: 'Is a self-drive SUV required for wildlife reserve trips from Nagpur?', a: 'A self-drive SUV (Creta, Scorpio, XUV300) is strongly recommended for Pench and Tadoba approach roads — some stretches have rough surfaces. The safari itself uses forest department vehicles. Park approach roads improve October–April; monsoon months can be challenging.' },
        { q: 'What documents are required for self-drive in Nagpur?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and refundable security deposit (₹2,000–₹4,000). Maharashtra highway checkposts require vehicle documents — keep RC and insurance handy. Out-of-state DLs accepted. Some vendors charge extra for outstation trips beyond 100 km.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Indore per day?', a: 'Hatchback self-drive in Indore starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. Daily and weekly plans available.' },
        { q: 'What are the best self-drive destinations from Indore?', a: 'Ujjain (55 km via SH-27, ~1 hr) is the easiest pilgrimage day trip. Omkareshwar (80 km via NH52, ~2 hrs) and Maheshwar (95 km via NH52, ~2 hrs) are excellent half-day trips. Mandu (100 km via SH-28, ~2 hrs) is MP\'s most scenic fort complex — perfect for a self-drive day trip.' },
        { q: 'Which areas in Indore have self-drive car rental options?', a: 'Vijay Nagar, AB Road, Scheme 54, and near Devi Ahilya Bai Holkar Airport (IDR) have self-drive vendor availability. Super Corridor IT zone vendors offer doorstep delivery. Book 24 hours in advance for most pickup locations.' },
        { q: 'Can I self-drive from Indore to Bhopal on NH46?', a: 'Yes, Indore to Bhopal (195 km via NH46, ~3.5 hrs) is one of MP\'s best highways. Most vendors permit this route. The NH46 is wide and well-maintained — a comfortable self-drive. Confirm outstation policy and km limits when booking.' },
        { q: 'What documents are required for self-drive in Indore?', a: 'Original DL (minimum 1 year old), Aadhaar Card or valid ID, and a refundable security deposit (₹1,500–₹3,500). MP highway checkposts are common — carry vehicle documents. Out-of-state DL holders accepted by most vendors.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Bhopal per day?', a: 'Hatchback self-drive in Bhopal starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. SUVs are recommended for Pachmarhi ghat roads.' },
        { q: 'Can I self-drive from Bhopal to Bhimbetka and Sanchi in a single day?', a: 'Yes! Bhimbetka (45 km via NH46, ~1 hr) and Sanchi (46 km via NH12, ~1 hr) can be combined into a full day trip. Leave Bhopal by 7 AM, visit Bhimbetka by 8 AM, drive to Sanchi via NH12 (45 km from Bhimbetka), and return by afternoon — a perfect UNESCO heritage self-drive day.' },
        { q: 'Is an SUV required for self-drive to Pachmarhi from Bhopal?', a: 'Yes, an SUV is strongly recommended for Pachmarhi (195 km via NH69, ~4 hrs). The final 40 km involves ghats and steep sections. Monsoon (July–September) makes the ghat slippery — check road conditions before departure. Most vendors can provide SUVs with outstation permissions for Pachmarhi.' },
        { q: 'Which areas in Bhopal have self-drive car rental options?', a: 'MP Nagar, Arera Colony, and near Raja Bhoj Airport (BHO) have the most self-drive vendor availability. Hoshangabad Road IT zone vendors also offer doorstep delivery. Book 24 hours in advance for most locations.' },
        { q: 'What documents are required for self-drive in Bhopal?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). MP highway checkposts are active — keep vehicle documents handy. Out-of-state DL holders accepted by most vendors.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Chandigarh per day?', a: 'Hatchback self-drive in Chandigarh starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Scorpio, Creta) start from ₹1,599/day. Packages include 150–200 km; extra km at ₹12–15/km. Weekly packages available for extended Himachal Pradesh trips.' },
        { q: 'Can I self-drive from Chandigarh to Shimla or Kasauli?', a: 'Yes, Shimla (120 km via NH5, ~2.5 hrs) and Kasauli (65 km via NH5, ~1.5 hrs) are easy self-drive hill trips. NH5 has sharp curves after Dharampur — drive carefully, especially in monsoon and winter. Confirm the vendor allows hill travel before booking.' },
        { q: 'Is self-drive to Manali from Chandigarh safe for beginners?', a: 'Chandigarh to Manali (310 km via NH21, ~7 hrs) involves mountain roads — it is not recommended for first-time hill drivers. The Atal Tunnel and Rohtang Pass section require experience. If you\'re an experienced driver, a sedan is adequate up to Manali town; SUV recommended for Spiti Valley and higher elevations.' },
        { q: 'Which areas in Chandigarh have self-drive car rental options?', a: 'Central sectors (Sector 17, 22, 35), Mohali Phases 5–7, and Panchkula sectors have self-drive vendor availability. Chandigarh International Airport (IXC) area pickups available with 24 hours\' advance booking. Doorstep delivery across all tri-city sectors.' },
        { q: 'What documents are required for self-drive in Chandigarh?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹5,000). Himachal Pradesh hill routes require vehicle RC — keep it in the car. Punjab-Haryana border checkposts are common — carry all documents. Out-of-state DL holders fully accepted.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Coimbatore per day?', a: 'Hatchback self-drive in Coimbatore starts from ₹799/day. Sedans start from ₹999/day. SUVs (Creta, XL6) start from ₹1,499/day. Packages include 100–150 km; extra km at ₹10–14/km. SUVs are strongly recommended for Ooty ghat routes.' },
        { q: 'Is self-drive safe on the Ooty ghat road from Coimbatore?', a: 'The Mettupalayam ghat road to Ooty has 36 hairpin bends and is steep — self-drive requires experience on mountain roads. First-time ghat drivers should opt for a chauffeur-driven car instead. For experienced drivers, an SUV is mandatory. Avoid ghat driving during heavy rain or fog. Timing: leave by 7 AM to reach Ooty before noon traffic.' },
        { q: 'What are the easy self-drive routes from Coimbatore?', a: 'Palakkad (55 km via NH544, ~1.5 hrs) is the easiest flat drive. Tiruppur (50 km, ~1 hr) and Pollachi (40 km, ~1 hr) are quick day trips. Kodaikanal (170 km via NH44 and SH, ~4 hrs) involves moderate ghats — manageable for careful drivers in an SUV.' },
        { q: 'Which areas in Coimbatore have self-drive car rental options?', a: 'RS Puram, Gandhipuram, Peelamedu, and near Coimbatore International Airport (CJB) have self-drive vendors. Saravanampatti IT corridor vendors offer doorstep delivery. Book 24 hours in advance.' },
        { q: 'What documents are required for self-drive in Coimbatore?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹4,000). Tamil Nadu–Kerala border checkpost on NH544 requires vehicle documents — keep RC and insurance handy. Out-of-state DL holders accepted.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Kochi per day?', a: 'Hatchback self-drive in Kochi starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,599/day. Packages include 100–150 km; extra km at ₹12–15/km. Weekly packages and weekend coastal drive packages are popular.' },
        { q: 'Can I self-drive from Kochi to Alleppey for backwater tourism?', a: 'Yes, Kochi to Alleppey (55 km via NH66, ~1.5 hrs) is one of Kerala\'s easiest and most scenic drives — flat coastal road with excellent condition. Perfect for a self-drive day trip. Combine with a 2-hour houseboat ride on the Vembanad backwaters and return to Kochi by evening.' },
        { q: 'Is self-drive to Munnar safe from Kochi?', a: 'Kochi to Munnar (130 km via NH85, ~3.5 hrs) involves steep ghats for the last 50 km. Self-drive is possible for experienced drivers in an SUV. Avoid monsoon ghat drives (June–August) when roads are slippery. Start early — Munnar town sees heavy tourist traffic from 10 AM onwards on weekends.' },
        { q: 'Which areas in Kochi have self-drive car rental options?', a: 'Ernakulam, Kakkanad (Infopark area), Edappally, and near Cochin International Airport (COK) have self-drive vendors. Fort Kochi pickups are also available. Doorstep delivery across mainland Ernakulam zones with 24 hours\' notice.' },
        { q: 'What documents are required for self-drive in Kochi?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport, and a refundable security deposit (₹2,000–₹5,000). Kerala checkposts require vehicle documents — keep RC and insurance accessible. International tourists with valid IDP are accepted by most vendors.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Mysore per day?', a: 'Hatchback self-drive in Mysore starts from ₹699/day. Sedans start from ₹899/day. SUVs (Creta, XUV300) start from ₹1,299/day. Packages include 100–150 km; extra km at ₹10–14/km. Day packages for Coorg and Ooty with higher km limits are available.' },
        { q: 'Is the Mysore to Coorg self-drive route recommended?', a: 'Yes, Mysore to Coorg (120 km via Hunsur road or SH17, ~3 hrs) is one of South India\'s most scenic drives — coffee estates, misty hills, and winding roads. An SUV is recommended for homestay and plantation approach roads. Monsoon (June–September) makes the route especially beautiful but requires careful driving on slippery curves.' },
        { q: 'Can I self-drive from Mysore to Ooty through Bandipur?', a: 'Yes, Mysore to Ooty (125 km via Bandipur-Gudalore Road, ~3.5 hrs) passes through Bandipur Tiger Reserve. Keep car windows closed and drive at 40 km/h through the reserve. The reserve road closes between sunset and sunrise for private vehicles. Plan your departure to cross Bandipur before 6 PM.' },
        { q: 'Which areas in Mysore have self-drive car rental options?', a: 'Vijayanagar, Saraswathipuram, Kuvempunagar, and near Mysore Airport (MYQ) have self-drive vendors. Doorstep delivery across Mysore city with 24 hours\' advance booking. Infosys campus zone pickups available.' },
        { q: 'What documents are required for self-drive in Mysore?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). Karnataka checkposts require vehicle documents. Some vendors have restrictions on travel through wildlife sanctuary areas — confirm Bandipur permission when booking.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Guwahati per day?', a: 'Hatchback self-drive in Guwahati starts from ₹849/day. Sedans start from ₹1,099/day. SUVs (Scorpio, Creta) start from ₹1,599/day. Packages include 100–150 km; extra km at ₹12–15/km. SUVs are the recommended category for all Northeast routes.' },
        { q: 'Can I self-drive from Guwahati to Shillong?', a: 'Yes, Guwahati to Shillong (100 km via NH6, ~2.5 hrs) is possible for experienced drivers. NH6 has sharp curves and the final ghat section requires careful driving. Avoid the route in heavy rain or fog. Confirm that your rental vendor has permissions for travel into Meghalaya (interstate permit may be needed).' },
        { q: 'Is self-drive to Kaziranga from Guwahati safe?', a: 'Yes, Guwahati to Kaziranga (195 km via NH37, ~4 hrs) is a straightforward highway drive. NH37 is well-maintained. The safari inside the park uses forest department jeeps — your rental car parks at Kohora. Safari season is November–April; roads during monsoon can flood near Kaziranga.' },
        { q: 'Which areas in Guwahati have self-drive car rental options?', a: 'Pan Bazaar, Beltola, Ganeshguri, and near Lokpriya Bordoloi Airport (GAU) have self-drive vendor availability. Book at least 48 hours in advance for Guwahati pickups as vendor density is lower than larger metros.' },
        { q: 'What documents are required for self-drive in Guwahati?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹5,000). For travel into Meghalaya, Nagaland, or Arunachal Pradesh — interstate permits and Inner Line Permits (ILP) may be required. Confirm requirements with your vendor before booking.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Amritsar per day?', a: 'Hatchback self-drive in Amritsar starts from ₹849/day. Sedans start from ₹1,099/day. SUVs start from ₹1,499/day. Packages include 150–200 km; extra km at ₹12–15/km. Punjab\'s wide roads make self-drive very comfortable.' },
        { q: 'Can I self-drive from Amritsar to Wagah Border and Dalhousie?', a: 'Wagah Border (30 km via GT Road, ~45 min) is an easy self-drive trip — plan to arrive by 4 PM for the evening flag ceremony. Dalhousie (190 km via Pathankot road, ~4 hrs) is a popular hill weekend self-drive. Confirm outstation permissions with your vendor for Himachal Pradesh travel.' },
        { q: 'What are the top self-drive routes from Amritsar?', a: 'Wagah Border (30 km), Pathankot (110 km via NH354), Chandigarh (230 km via NH44), and Dalhousie (190 km via Pathankot) are the top self-drive routes. Jammu (210 km via NH44) and Dharamshala (225 km via NH154) are popular 2-day self-drive destinations.' },
        { q: 'Which areas in Amritsar have self-drive car rental options?', a: 'Ranjit Avenue, Lawrence Road, GT Road, and near Sri Guru Ram Dass Jee Airport (ATQ) have self-drive vendor availability. Book 24 hours in advance. Doorstep delivery across all Amritsar zones.' },
        { q: 'What documents are required for self-drive in Amritsar?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹2,000–₹4,000). Punjab highway checkposts are common — keep RC and insurance handy. For Wagah Border proximity, avoid carrying prohibited items. International tourists with IDP accepted.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Varanasi per day?', a: 'Hatchback self-drive in Varanasi starts from ₹749/day. Sedans start from ₹949/day. SUVs start from ₹1,399/day. Packages include 100–150 km; extra km at ₹10–14/km. Pilgrimage-circuit packages with higher km limits are available.' },
        { q: 'What are the best spiritual circuit self-drive routes from Varanasi?', a: 'Sarnath (10 km, ~30 min) is a quick self-drive to Buddha\'s first sermon site. Prayagraj (120 km via NH19, ~2.5 hrs) for the Triveni Sangam is a popular pilgrimage self-drive. Ayodhya (200 km, ~4 hrs) for Ram Mandir and Bodhgaya (250 km via NH2, ~5 hrs) for the Mahabodhi Temple are excellent 2-day self-drives.' },
        { q: 'Which areas in Varanasi have self-drive car rental options?', a: 'Lanka, Sigra, Cantonment Road, and near Lal Bahadur Shastri Airport (VNS) have self-drive vendors. Avoid old city areas near ghats for pickup — use Lanka or Mahmoorganj pickup points instead. Book 24 hours in advance.' },
        { q: 'Are UP highway roads suitable for self-drive outstation trips from Varanasi?', a: 'NH19 (to Prayagraj and Patna) and NH31 (to Lucknow) are well-maintained national highways suitable for self-drive. Avoid state highways and district roads — they can be narrow with poor lighting at night. Winter fog (December–January) on UP highways can reduce visibility severely; avoid predawn starts.' },
        { q: 'What documents are required for self-drive in Varanasi?', a: 'Original DL (minimum 1 year old), Aadhaar Card, and a refundable security deposit (₹1,500–₹3,500). UP highway checkposts are frequent — carry all vehicle documents. Out-of-state DL holders accepted. Some vendors require outstation permit for trips beyond 150 km.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Agra per day?', a: 'Hatchback self-drive in Agra starts from ₹749/day. Sedans start from ₹999/day. SUVs start from ₹1,399/day. Packages include 150–200 km; extra km at ₹10–14/km. Multi-day Golden Triangle packages with higher km allowances are available.' },
        { q: 'Can I self-drive from Agra on the Golden Triangle routes?', a: 'Yes! Yamuna Expressway (NH19) to Delhi (230 km, ~4 hrs) is one of India\'s finest toll roads — smooth, well-lit, and safe. NH21 to Jaipur (240 km, ~4 hrs) is also an excellent highway. Both are ideal for self-drive. Confirm outstation permissions and km limits when booking.' },
        { q: 'What are the easy self-drive day trips from Agra?', a: 'Fatehpur Sikri (40 km via NH21, ~1 hr) is the easiest self-drive — Mughal ghost city, UNESCO site. Mathura and Vrindavan (60 km via NH2, ~1 hr) are popular pilgrimage self-drives. Gwalior (120 km via NH44, ~2.5 hrs) is excellent for a day trip with a magnificent fort.' },
        { q: 'Which areas in Agra have self-drive car rental options?', a: 'Tajganj, Fatehabad Road, Sikandra, and near Agra Airport (AGR) have self-drive vendor availability. Book 24 hours in advance. Doorstep delivery available across Agra zones.' },
        { q: 'Any special rules for driving near Taj Mahal in Agra?', a: 'Vehicles cannot park within 500 meters of the Taj Mahal East Gate and South Gate. Use the designated Shilpgram parking (east gate) or Taj Mahal parking (south gate). The area around Tajganj is a Low Emission Zone — diesel vehicles face restrictions during peak hours. Carry your parking receipt to avoid fines.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Nashik per day?', a: 'Hatchback self-drive in Nashik starts from ₹799/day. Sedans (Swift Dzire, Honda City) start from ₹1,099/day. SUVs (Creta, Brezza) start from ₹1,499/day. Standard packages include 150–200 km; extra km at ₹12–15/km.' },
        { q: 'Can I drive a self-drive rental from Nashik to Shirdi or Trimbakeshwar?', a: 'Yes, Shirdi (85 km via NH60, ~2 hrs) and Trimbakeshwar (28 km, ~45 min) are quick pilgrimage self-drives from Nashik. Both routes are in good condition. Shirdi has ample parking near Sai Temple. For Trimbakeshwar ghat section, a compact car is easier to maneuver.' },
        { q: 'Is the Kasara Ghat route to Mumbai safe for a self-drive car?', a: 'The Kasara Ghat (NH160, Nashik to Mumbai) is manageable in a standard car during clear weather. However, in monsoon (June–September), steep curves and poor visibility on the ghat require extra caution. An SUV with good ground clearance is recommended. Avoid night driving on this ghat section.' },
        { q: 'Which areas in Nashik have self-drive car rental pickup points?', a: 'Gangapur Road, College Road, Nashik Road, and Trimbak Road have the most self-drive vendors. Ozar Airport (ISK) pickup is available with advance booking. Doorstep delivery is available across all Nashik zones.' },
        { q: 'Can I do a wine tour of Sula Vineyards and nearby wineries in a self-drive car?', a: 'Yes, Sula Vineyards is just 15 km from Nashik city on Gangapur Road — a 20–25 minute self-drive. A sedan or hatchback is perfectly adequate. Note: Gujarat border wine routes (Igatpuri) are also accessible in ~45 minutes. Book a half-day package if you want to visit multiple wineries without rush.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Visakhapatnam per day?', a: 'Hatchback self-drive in Vizag starts from ₹799/day. Sedans start from ₹1,099/day. SUVs (recommended for Araku ghat) start from ₹1,599/day. Standard packages include 150–200 km; extra km at ₹12–15/km.' },
        { q: 'Can I self-drive from Vizag to Araku Valley safely?', a: 'Yes, but an SUV is strongly recommended — NH516 through the Eastern Ghats has scenic but steep curves. The drive (120 km, ~3.5 hrs) is best done in daylight. Leave by 6 AM to enjoy the misty ghat views and reach Araku by 9:30 AM. Avoid the ghat in heavy monsoon rain.' },
        { q: 'What are the best self-drive destinations from Visakhapatnam?', a: 'Top self-drive routes from Vizag: Bheemunipatnam (25 km, Beach Road, ~45 min), Borra Caves (90 km, ~2.5 hrs), Lambasingi (100 km, ~3 hrs — best Oct–Jan), Araku Valley (120 km, ~3.5 hrs). All routes start on NH516 — an excellent highway through Eastern Ghats.' },
        { q: 'Which areas in Vizag have self-drive car rental pickup points?', a: 'Dwaraka Nagar, MVP Colony, Madhurawada IT corridor, and Vizag Airport (VTZ, 16 km from city) are the main pickup zones. Doorstep delivery is available across all Vizag localities including Steel Plant Township and Gajuwaka.' },
        { q: 'What documents are needed for self-drive car rental in Vizag?', a: 'Original DL (minimum 1 year old), Aadhaar Card or Passport for ID, and a refundable security deposit (₹2,000–₹4,000). Telangana and AP DL holders are accepted without any extra documentation. Fuel policy is typically full-to-full — petrol stations are abundant on all major highways.' },
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
      'self-drive-car-rentals': [
        { q: 'What is the cost of self-drive car rental in Rajkot per day?', a: 'Hatchback self-drive in Rajkot starts from ₹799/day. Sedans start from ₹1,099/day. SUVs (ideal for the Saurashtra circuit) start from ₹1,599/day. Standard packages include 200–300 km; extra km at ₹12–15/km. Weekly packages for the full Saurashtra circuit are available.' },
        { q: 'Can I cover Dwarka, Somnath, and Gir in a self-drive car from Rajkot?', a: 'Yes, the Saurashtra circuit is excellent for self-drive: Rajkot → Dwarka (240 km, Day 1), Dwarka → Somnath (230 km, Day 2), Somnath → Gir (75 km, Day 3), Gir → Rajkot (165 km, Day 4). Book an SUV or Innova for comfort on this 700+ km circuit. NH947 and NH27 are smooth 4-lane highways throughout.' },
        { q: 'What are the road conditions on Rajkot to Dwarka or Gir routes?', a: 'NH947 (Rajkot to Jamnagar, then onward to Dwarka) and NH27 (Rajkot to Gir and Somnath) are excellent — wide, smooth, well-marked national highways. Rest stops with fuel stations are available every 40–50 km. No mountain ghats on any Saurashtra route — all flat terrain, suitable for any car type.' },
        { q: 'Which areas in Rajkot have self-drive pickup points?', a: 'Kalawad Road, Gondal Road, 150 Feet Ring Road, and near Rajkot Airport (RAJ, 8 km from city) are the main pickup zones. Given Rajkot\'s compact size, doorstep delivery covers all city localities within 30 minutes.' },
        { q: 'Does Gujarat dry state rule affect self-drive trips from Rajkot?', a: 'Gujarat is a dry state — alcohol is not available without a permit. This does not affect self-drive car usage in any way. However, if you are hosting out-of-state guests, note they cannot purchase alcohol anywhere in Gujarat during the Saurashtra circuit. For self-drive itself, roads and fuel availability are unaffected.' },
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
