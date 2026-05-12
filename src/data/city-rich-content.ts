/**
 * Hyper-local city content for Tier 3 SEO depth.
 * Each city gets: neighborhoods (pickup zones), attractions (why people rent),
 * and driving regulations (local knowledge competitors don't have).
 * Renders via CityContentSection.
 */

export type CityNeighborhood = {
  name: string;
  type: string;
  pickupNote: string;
};

export type CityAttraction = {
  name: string;
  distance: string;
  type: 'heritage' | 'nature' | 'beach' | 'religious' | 'market' | 'park' | 'other';
  bestVehicle: string;
};

export type CityDrivingInfo = {
  restrictions: string;
  parking: string;
  highwayNote: string;
};

export type CityRichContent = {
  neighborhoods: CityNeighborhood[];
  attractions: CityAttraction[];
  drivingInfo: CityDrivingInfo;
};

export const CITY_RICH: Record<string, CityRichContent> = {

  mumbai: {
    neighborhoods: [
      { name: 'Andheri (East & West)', type: 'Airport Hub', pickupNote: 'Closest zone to CSIA Airport; highest vendor density — same-day pickup in 30 min' },
      { name: 'BKC — Bandra Kurla Complex', type: 'Corporate Hub', pickupNote: 'Doorstep delivery to C-20 and G-Block offices; best for corporate day hire' },
      { name: 'Thane', type: 'Residential Hub', pickupNote: 'Eastern Express Highway access; ideal start for Nashik and Pune outstation' },
      { name: 'Navi Mumbai (Vashi / Kharghar)', type: 'Planned City', pickupNote: 'CBD Belapur and APMC zone; 30 min from CSIA via Sion–Panvel Highway' },
      { name: 'Dadar / Central Mumbai', type: 'Transit Hub', pickupNote: 'Equidistant between South and North Mumbai; convenient cross-city pickup' },
      { name: 'Borivali / Kandivali', type: 'Western Suburbs', pickupNote: 'Best starting point for NH48 Mumbai–Pune Expressway outstation trips' },
    ],
    attractions: [
      { name: 'Gateway of India & Elephanta Caves', distance: '22 km from Andheri', type: 'heritage', bestVehicle: 'Sedan — park on Regal Cinema side' },
      { name: 'Juhu & Versova Beach', distance: '5 km from Andheri', type: 'beach', bestVehicle: 'Bike or city car — easy beach loop' },
      { name: 'Lonavala & Khandala', distance: '80 km via NH48 Expressway', type: 'nature', bestVehicle: 'SUV or Sedan — expressway is smooth' },
      { name: 'Alibaug Beach', distance: '95 km via NH66', type: 'beach', bestVehicle: 'SUV — last stretch to Revdanda is rough' },
      { name: 'Sanjay Gandhi National Park', distance: '8 km from Borivali', type: 'park', bestVehicle: 'Any car — large parking lot inside' },
      { name: 'Shirdi Sai Baba Temple', distance: '240 km via NH160', type: 'religious', bestVehicle: 'Tempo Traveller for groups; Sedan for 4–5 people' },
    ],
    drivingInfo: {
      restrictions: 'No odd-even scheme in Mumbai. Commercial vehicles banned on Western Express Highway 8–10 AM and 6–9 PM. Bandra-Worli Sea Link: toll ₹85 for cars each way.',
      parking: 'BMC paid parking in South Mumbai ₹40/hr. Smart-card parking at Fort and Nariman Point. Towing is active — avoid no-parking zones near Juhu and Bandra.',
      highwayNote: 'NH48 (Mumbai–Pune Expressway): FASTag mandatory, max 100 km/h, speed cameras throughout. NH66 coastal highway to Goa: scenic but slow — budget 10 hours.',
    },
  },

  delhi: {
    neighborhoods: [
      { name: 'Connaught Place (CP)', type: 'Commercial Hub', pickupNote: 'Central location; best for day-hire across Delhi NCR; 24-hr vendor coverage' },
      { name: 'Aerocity (IGI Hospitality District)', type: 'Airport Zone', pickupNote: 'Closest hub to IGI Airport T1/T2/T3; 30-min delivery; self-drive cars available' },
      { name: 'Noida Sector 18 / 62', type: 'NCR IT Hub', pickupNote: 'Noida Expressway corridor; serves Greater Noida and Yamuna Expressway access' },
      { name: 'Gurugram — Cyber City / DLF Phase 5', type: 'NCR Corporate', pickupNote: 'Best pickup for NH48 Jaipur and Manesar outstation; premium vendor density' },
      { name: 'Karol Bagh', type: 'Market Hub', pickupNote: 'Dense vendor network; popular for tourist and budget rentals; budget bike rentals' },
      { name: 'Saket / South Delhi', type: 'Premium Residential', pickupNote: 'Best for premium Agra and Jaipur outstation; Qutub Minar day trips' },
    ],
    attractions: [
      { name: 'Red Fort & Chandni Chowk', distance: '12 km from CP', type: 'heritage', bestVehicle: 'Bike — park on Yamuna Bank Road and walk in' },
      { name: 'Qutub Minar & Mehrauli', distance: '16 km from CP', type: 'heritage', bestVehicle: 'Any car — Mehrauli complex has large parking' },
      { name: 'Taj Mahal, Agra', distance: '230 km via Yamuna Expressway', type: 'heritage', bestVehicle: 'SUV or Sedan — Yamuna Expressway is 6-lane' },
      { name: 'Jaipur (Pink City)', distance: '280 km via NH48', type: 'heritage', bestVehicle: 'SUV — 5-hr drive; start before 6 AM' },
      { name: 'Haridwar & Rishikesh', distance: '220 km via NH58', type: 'religious', bestVehicle: 'SUV — ghats near Rishikesh are narrow' },
      { name: 'Shimla Hill Station', distance: '360 km via NH44 then NH5', type: 'nature', bestVehicle: 'SUV mandatory — mountain roads from Kalka' },
    ],
    drivingInfo: {
      restrictions: 'Odd-Even may apply during high-pollution emergencies (Nov–Jan). Heavy trucks banned 9 AM–11 PM inside Delhi. No entry for some vehicles during Bharat Bandh/Republic Day.',
      parking: 'NDMC paid parking in CP and Connaught Lane ₹40/hr. NDMC Smart Parking app for real-time availability. Heavy towing action in South Delhi and CP.',
      highwayNote: 'Yamuna Expressway to Agra: 165 km, 2.5 hrs, speed limit 100 km/h. NH44 to Chandigarh: 260 km, 4 hrs. Dec–Jan: dense fog on all highways — avoid overnight driving.',
    },
  },

  bangalore: {
    neighborhoods: [
      { name: 'Whitefield (ITPL / Prestige Shantiniketan)', type: 'IT Hub', pickupNote: 'Highest corporate rental demand; 500+ IT firms; 24-hr booking recommended' },
      { name: 'Koramangala (BDA Complex area)', type: 'Startup Hub', pickupNote: 'Intermediate Ring Road; dense vendor network for startups and weekend trips' },
      { name: 'Indiranagar (100 Feet Road)', type: 'Premium Residential', pickupNote: 'CMH Road pickups popular for Coorg and Ooty weekend rentals' },
      { name: 'Electronic City (Hosur Road NH44)', type: 'Tech Corridor', pickupNote: 'Infosys and Wipro zone; optimal for Chennai outstation; budget rates' },
      { name: 'Marathahalli / Bellandur', type: 'Outer Ring Road', pickupNote: 'ORR corridor; serves HAL Airport and Whitefield; good self-drive options' },
      { name: 'Hebbal / Kempapura', type: 'North Bangalore', pickupNote: 'KIAL Airport zone and Bellary Road NH44; best for Hyderabad outstation' },
    ],
    attractions: [
      { name: 'Nandi Hills', distance: '60 km via Bellary Road NH44', type: 'nature', bestVehicle: 'Bike — predawn ride for sunrise is iconic' },
      { name: 'Mysore Palace City', distance: '145 km via NH275', type: 'heritage', bestVehicle: 'Sedan or SUV — smooth 3-hr drive on NH275' },
      { name: 'Coorg (Kodagu) Coffee Country', distance: '270 km via Mysore Road', type: 'nature', bestVehicle: 'SUV — winding ghat road from Madikeri to Virajpet' },
      { name: 'Hampi (UNESCO Heritage)', distance: '350 km via NH150A', type: 'heritage', bestVehicle: 'SUV — some rough sections on NH150A near Hospet' },
      { name: 'Pondicherry', distance: '310 km via ECR / NH66', type: 'beach', bestVehicle: 'Sedan — 5-hr scenic coastal drive on ECR' },
      { name: 'Chikkamagaluru (Coffee & Hills)', distance: '245 km via Tumkur Road', type: 'nature', bestVehicle: 'SUV — sharp ghat bends near Kemmanagundi' },
    ],
    drivingInfo: {
      restrictions: 'BBMP has designated bus lanes on Outer Ring Road. MG Road sections restrict private vehicles on certain weekends during events. No odd-even in Bangalore.',
      parking: 'Smart City parking at UB City ₹60/hr, Garuda Mall, and Forum Mall. Koramangala and Indiranagar street parking is severely limited — use Nexpark app.',
      highwayNote: 'NH275 to Mysore: 145 km, 3 hrs — 4-lane highway. NH44 south to Chennai: 350 km, 6 hrs excellent road. NH44 north to Hyderabad: 570 km, 8 hrs via Anantapur.',
    },
  },

  hyderabad: {
    neighborhoods: [
      { name: 'HITECH City / Madhapur', type: 'IT Hub', pickupNote: 'Cyberabad zone; 500+ IT companies; highest rental demand — book 24 hrs ahead' },
      { name: 'Banjara Hills (Road No. 1–12)', type: 'Premium Residential', pickupNote: 'High-end villa zones; premium self-drive and chauffeur driver bookings' },
      { name: 'Secunderabad (Cantonment)', type: 'Commercial Hub', pickupNote: 'Secunderabad Railway Station area; well-connected to all ORR exits' },
      { name: 'Gachibowli / Financial District', type: 'IT & Sports Hub', pickupNote: 'DY Patil Stadium area; serves Rajiv Gandhi IT Park corridor' },
      { name: 'Kukatpally (KPHB)', type: 'Residential Corridor', pickupNote: 'Large middle-class rental hub; best value daily-rate bookings' },
      { name: 'Jubilee Hills', type: 'Upscale / Media', pickupNote: 'Tollywood film city hub; premium vehicles in demand for shoots' },
    ],
    attractions: [
      { name: 'Charminar & Old City Bazaars', distance: '14 km from HITECH City', type: 'heritage', bestVehicle: 'Auto or bike — old city lanes are very narrow for cars' },
      { name: 'Ramoji Film City', distance: '25 km via ORR', type: 'other', bestVehicle: 'Any car — large dedicated parking at entrance' },
      { name: 'Golconda Fort', distance: '11 km from Banjara Hills', type: 'heritage', bestVehicle: 'Any car — parking at base; evening Sound and Light show' },
      { name: 'Nagarjuna Sagar Dam', distance: '165 km via NH65', type: 'nature', bestVehicle: 'SUV — some rural road sections near Macherla' },
      { name: 'Warangal Fort & Thousand Pillar Temple', distance: '150 km via NH163', type: 'heritage', bestVehicle: 'Sedan or SUV — 2.5 hrs on good 4-lane highway' },
      { name: 'Srisailam Dam & Mallikarjuna Temple', distance: '200 km via Narayanpet road', type: 'religious', bestVehicle: 'SUV — forest road through Nallamala; night vehicle ban applies' },
    ],
    drivingInfo: {
      restrictions: 'GHMC ORR speed limit 100 km/h. Heavy vehicle ban in HITECH City 9 AM–8 PM. Charminar area is vehicle-free on Sunday mornings.',
      parking: 'GHMC Smart Parking at Banjara Hills and Jubilee Hills ₹30/hr. Parking is free at most suburban malls. Hitech City mall complexes have paid basement parking.',
      highwayNote: "Hyderabad's ORR: FASTag mandatory, connects all zones in 20–40 min. NH163 to Warangal: 150 km, 2.5 hrs, smooth 4-lane. Night vehicle ban on Srisailam road through Nallamala forest.",
    },
  },

  chennai: {
    neighborhoods: [
      { name: 'T. Nagar (Pondy Bazaar)', type: 'Shopping & Residential', pickupNote: 'Central location; highest vendor count in Chennai; easy metro connectivity' },
      { name: 'OMR (IT Corridor)', type: 'IT Hub', pickupNote: 'Old Mahabalipuram Road — serves all IT parks from Perungudi to Sholinganallur' },
      { name: 'Anna Nagar', type: 'Premium Residential', pickupNote: 'Wide avenues; popular for daily rental and airport transfer bookings' },
      { name: 'Adyar / Besant Nagar', type: 'Coastal Residential', pickupNote: 'ECR-bound trips and Elliot\'s Beach area pickups; proximity to Pondicherry route' },
      { name: 'Guindy / St. Thomas Mount', type: 'Airport Zone', pickupNote: 'Closest zone to Chennai Airport MAA — 10-min delivery available' },
      { name: 'Tambaram', type: 'South Chennai', pickupNote: 'NH45 access; serves Chengalpattu and Mahabalipuram day trip route' },
    ],
    attractions: [
      { name: 'Mahabalipuram (UNESCO Heritage)', distance: '58 km via ECR', type: 'heritage', bestVehicle: 'Any car — ECR coastal road is one of India\'s best drives' },
      { name: 'Pondicherry (French Quarter)', distance: '160 km via ECR', type: 'heritage', bestVehicle: 'Sedan or bike — ECR drive takes 2.5 hrs of pure scenic joy' },
      { name: 'Tirupati (Tirumala Temple)', distance: '145 km via NH16', type: 'religious', bestVehicle: 'SUV — steep ghat road to Tirumala from Tirupati' },
      { name: 'Ooty (Nilgiri Hills)', distance: '540 km via Coimbatore', type: 'nature', bestVehicle: 'SUV — Ooty ghat road from Mettupalayam is steep' },
      { name: 'Kanchipuram (Temple City)', distance: '75 km via NH48', type: 'religious', bestVehicle: 'Any car — 1.5 hr drive on 4-lane NH48' },
      { name: 'Marina Beach', distance: '8 km from T. Nagar', type: 'beach', bestVehicle: 'Bike — easy 20-min ride; free parking on beach road' },
    ],
    drivingInfo: {
      restrictions: 'No odd-even in Chennai. Lorries banned from city roads 7 AM–11 PM. Chennai Port traffic on NSC Bose Road (Rajaji Salai) can be severe 6–9 AM.',
      parking: 'Chennai Corporation paid parking in T. Nagar and Anna Nagar ₹20–30/hr. ECR has paid beach parking near Elliot\'s Beach. Avoid parking near Marina on Sundays.',
      highwayNote: 'ECR (East Coast Road) to Pondicherry: 160 km, 2.5 hrs — India\'s finest coastal drive. NH48 to Bangalore: 350 km, 6 hrs. NH16 to Vijayawada: 430 km, 7 hrs.',
    },
  },

  pune: {
    neighborhoods: [
      { name: 'Koregaon Park', type: 'Premium / Tourism', pickupNote: 'Osho Ashram area; premium villa rentals; party organizer vehicles on demand' },
      { name: 'Hinjewadi IT Park (Phase 1/2/3)', type: 'IT Hub', pickupNote: 'Highest IT corporate rental demand in Pune; book 24 hrs ahead' },
      { name: 'Kothrud', type: 'Residential', pickupNote: 'West Pune; serves Chandni Chowk flyover and Paud Road corridor' },
      { name: 'Viman Nagar', type: 'Airport Zone', pickupNote: 'Pune Airport PNQ — 5 km; outstation and airport transfer combined bookings' },
      { name: 'Baner / Balewadi', type: 'New Development', pickupNote: 'Balewadi Sports Complex area; serves Hinjewadi IT corridor' },
      { name: 'Hadapsar / Magarpatta', type: 'East Pune IT', pickupNote: 'Cybercity Magarpatta; NH65 Solapur Road; Sholapur outstation trips' },
    ],
    attractions: [
      { name: 'Lonavala & Bhushi Dam', distance: '65 km via NH48 Expressway', type: 'nature', bestVehicle: 'Any car — Expressway takes 45 min' },
      { name: 'Mahabaleshwar Hill Station', distance: '120 km via NH48 then SH84', type: 'nature', bestVehicle: 'SUV recommended — SH84 ghat sections' },
      { name: 'Sinhagad Fort', distance: '30 km via Sinhagad Road', type: 'heritage', bestVehicle: 'Bike or SUV — dirt path to fort base' },
      { name: 'Lavasa Township', distance: '55 km via Tamhini Ghat', type: 'other', bestVehicle: 'SUV — Tamhini Ghat is challenging in monsoon' },
      { name: 'Shaniwar Wada & Aga Khan Palace', distance: '10 km from Koregaon Park', type: 'heritage', bestVehicle: 'Any car or bike' },
      { name: 'Shirdi', distance: '200 km via NH60', type: 'religious', bestVehicle: 'Sedan or Tempo Traveller for groups' },
    ],
    drivingInfo: {
      restrictions: 'PMC has banned 2-wheelers on Fergusson College Road on weekends. JM Road and FC Road have severe congestion 8–10 AM and 5–8 PM. No odd-even policy.',
      parking: 'PMC Smart Parking in Shivajinagar and Camp ₹30/hr. Hinjewadi corporate parking is employer-managed. Most suburban areas have free parking.',
      highwayNote: 'NH48 to Mumbai Expressway: 150 km, 3 hrs. FASTag mandatory. NH60 to Shirdi: 200 km, 3.5 hrs. NH65 to Solapur: 250 km, 4 hrs on good 4-lane.',
    },
  },

  ahmedabad: {
    neighborhoods: [
      { name: 'SG Highway (Sardar Patel Highway)', type: 'IT & Corporate', pickupNote: 'GIFT City approach corridor; fastest-growing premium rental zone in Ahmedabad' },
      { name: 'CG Road (Chimanlal Girdharlal Road)', type: 'Commercial Hub', pickupNote: 'Ellis Bridge area; city center with dense vendor network; budget and premium options' },
      { name: 'Navrangpura', type: 'Educational & Commercial', pickupNote: 'Gujarat University area; serves Gujarat HC and Ahmedabad University' },
      { name: 'Vastrapur / Prahlad Nagar', type: 'New Commercial', pickupNote: 'Iscon Ambli Road; serves ISCON and SG Highway corridors; mall proximity' },
      { name: 'Bopal / South Bopal', type: 'Residential', pickupNote: 'Satellite area; serves SG Highway and Gandhinagar Capital zone' },
      { name: 'Maninagar', type: 'East Ahmedabad', pickupNote: 'AMTS hub; closest zone to NH48 Expressway to Vadodara' },
    ],
    attractions: [
      { name: 'Sabarmati Ashram', distance: '5 km from CG Road', type: 'heritage', bestVehicle: 'Any car — parking on Ashram Road' },
      { name: 'Adalaj Stepwell', distance: '18 km via SH20', type: 'heritage', bestVehicle: 'Any car — 30-min drive; free entry' },
      { name: 'Akshardham Temple', distance: '12 km from CG Road', type: 'religious', bestVehicle: 'Any car — large parking complex; 3-hr visit minimum' },
      { name: 'Modhera Sun Temple', distance: '100 km via NH47', type: 'heritage', bestVehicle: 'Sedan or SUV — 2-hr drive on good NH47' },
      { name: 'Lothal Archaeological Site', distance: '80 km via SH6', type: 'heritage', bestVehicle: 'SUV — rural roads near Lothal village' },
      { name: 'Gir National Park (Asiatic Lions)', distance: '360 km via NH27', type: 'nature', bestVehicle: 'SUV — 6-hr drive via Rajkot; forest jeep safari inside' },
    ],
    drivingInfo: {
      restrictions: 'No odd-even in Ahmedabad. AMTS BRTS lanes on Ashram Road and CG Road — private vehicles strictly prohibited in bus lanes. Gujarat is a dry state.',
      parking: 'AMC paid parking in CG Road and Navrangpura ₹20/hr. Vast free parking at Adalaj, Akshardham, and all highway destinations. GIFT City has paid parking.',
      highwayNote: 'NH48 to Vadodara: 110 km, 90 min — India\'s smoothest expressway. NH48 to Mumbai: 530 km, 9 hrs. NH947 to Gandhinagar: 30 km, 45 min. FASTag mandatory.',
    },
  },

  kolkata: {
    neighborhoods: [
      { name: 'Park Street', type: 'Entertainment Hub', pickupNote: 'Central Kolkata; highest vendor density; daily hire and airport transfer bookings' },
      { name: 'Salt Lake (Bidhannagar) Sector V', type: 'IT Hub', pickupNote: 'Infosys, Wipro, TCS campus zone; IT corporate rental hub of Kolkata' },
      { name: 'New Town (Action Area 1/2/3)', type: 'New Development', pickupNote: 'Eco Park, Biswa Bangla Gate area; serves Rajarhat and New Town grid' },
      { name: 'Howrah', type: 'Transit Hub', pickupNote: 'Howrah Station area; serves Durgapur and NH16 for south-bound routes' },
      { name: 'Dumdum / Airport Zone', type: 'Airport Area', pickupNote: 'CCU Netaji Subhash Chandra Bose Airport — immediate vicinity vendors' },
      { name: 'Rajarhat', type: 'New Residential', pickupNote: 'HIDCO township; serves New Town and airport corridor' },
    ],
    attractions: [
      { name: 'Victoria Memorial & Maidan', distance: '7 km from Park Street', type: 'heritage', bestVehicle: 'Any car or bike — ample Maidan parking' },
      { name: 'Howrah Bridge & Dakshineswar', distance: '6 km from Park Street', type: 'heritage', bestVehicle: 'Bike or compact car — Strand Road is narrow near ghats' },
      { name: 'Sundarbans', distance: '110 km via Basirhat / Godkhali', type: 'nature', bestVehicle: 'SUV to Godkhali jetty — then boat safari; no vehicles inside' },
      { name: 'Digha Beach', distance: '185 km via NH16', type: 'beach', bestVehicle: 'SUV or Sedan — 3-hr drive; good highway' },
      { name: 'Shantiniketan (Tagore\'s University)', distance: '165 km via NH19', type: 'heritage', bestVehicle: 'Sedan — 3-hr drive via Durgapur Expressway' },
      { name: 'Darjeeling', distance: '620 km via NH34 then NH10', type: 'nature', bestVehicle: 'SUV mandatory — steep mountain road from Siliguri' },
    ],
    drivingInfo: {
      restrictions: 'Yellow-top taxis have priority lanes at Park Street and Esplanade. Tram tracks on central Kolkata roads — drive carefully over crossings. Howrah Bridge restricted for heavy vehicles.',
      parking: 'KMC paid parking in Park Street and Esplanade ₹30/hr. Multilevel parking at City Centre 2 (Salt Lake). Street parking is scarce in central Kolkata.',
      highwayNote: 'Durgapur Expressway to Shantiniketan: 165 km, 3 hrs — good 4-lane. NH16 to Digha: 185 km, 3.5 hrs. NH34 to Siliguri (Darjeeling gate): 600 km, 10 hrs.',
    },
  },

  jaipur: {
    neighborhoods: [
      { name: 'Sindhi Camp (Bus Stand Area)', type: 'Transit Hub', pickupNote: 'Rajasthan Roadways hub; most accessible zone for Delhi/Agra outstation start' },
      { name: 'Vaishali Nagar', type: 'Western Residential', pickupNote: 'Fastest-growing Jaipur zone; serves NH48 Delhi corridor' },
      { name: 'Malviya Nagar', type: 'South Jaipur', pickupNote: 'RIICO Industrial Area access; near NH12 Ajmer Road' },
      { name: 'Civil Lines', type: 'Government Hub', pickupNote: 'Near Secretariat and GPO; popular for corporate daily rentals' },
      { name: 'Raja Park / Bais Godam', type: 'Market Area', pickupNote: 'Budget rental zone; serves Pink City monuments circuit perfectly' },
      { name: 'Tonk Road', type: 'South Corridor', pickupNote: 'NH52 access to Ranthambore (180 km) and Sawai Madhopur' },
    ],
    attractions: [
      { name: 'Amber (Amer) Fort', distance: '11 km via NH11C', type: 'heritage', bestVehicle: 'Any car — elephant ride or jeep up to fort; parking at base' },
      { name: 'Hawa Mahal & City Palace', distance: '6 km from Sindhi Camp', type: 'heritage', bestVehicle: 'Any car — park on Johari Bazaar end near Iswari Minar' },
      { name: 'Nahargarh & Jaigarh Forts', distance: '15 km via Aravalli Hills', type: 'heritage', bestVehicle: 'SUV recommended — steep unpaved sections near Jaigarh' },
      { name: 'Pushkar', distance: '145 km via Ajmer NH58', type: 'religious', bestVehicle: 'Sedan or SUV — 2.5 hr drive via Kishangarh bypass' },
      { name: 'Ranthambore Tiger Reserve', distance: '180 km via NH52', type: 'nature', bestVehicle: 'SUV — dirt tracks inside buffer zone; canter safaris from gate' },
      { name: 'Agra (Taj Mahal)', distance: '240 km via NH21', type: 'heritage', bestVehicle: 'SUV — 4-hr drive on NH21; book predawn for sunrise Taj view' },
    ],
    drivingInfo: {
      restrictions: 'JMC tourist vehicle zones near heritage sites. Horse-drawn Ghoda-Tanga (tongas) have priority on Johari Bazaar. Heavy vehicles banned inside Walled City (Pink City) at all times.',
      parking: 'JMC paid parking at Hawa Mahal ₹20/hr. Free parking at Amber Fort (large lot available). Central Jaipur parking is very limited — arrive early for monument visits.',
      highwayNote: 'NH48 to Delhi: 280 km, 5 hrs — 6-lane highway. NH21 to Agra: 240 km, 4 hrs. NH52 to Udaipur: 395 km, 6 hrs. Rajasthan summer (Apr–Jun): 42°C — FASTag + AC mandatory.',
    },
  },

  goa: {
    neighborhoods: [
      { name: 'Calangute & Baga Beach Belt', type: 'Tourist Beach', pickupNote: "Goa's most-visited tourist belt; 50+ bike rental shops; most competitive rates in season" },
      { name: 'Panaji (Panjim) — Capital', type: 'Capital City', pickupNote: 'Heritage quarter and government zone; self-drive cars for exploring the full state' },
      { name: 'Margao', type: 'South Goa Hub', pickupNote: 'Colva and Benaulim beach access; serves South Goa villages; budget bikes available' },
      { name: 'Anjuna & Vagator', type: 'Nightlife & Flea Market', pickupNote: 'Wednesday flea market draws 1,000s; highest bike demand in season (Nov–Mar)' },
      { name: 'Candolim / Sinquerim', type: 'North Goa Premium', pickupNote: 'Taj Fort Aguada corridor; premium vehicle demand from 5-star hotels' },
      { name: 'Vasco da Gama (Airport Zone)', type: 'Transport Hub', pickupNote: 'GOI Dabolim Airport area; 7-day and 14-day self-drive packages start here' },
    ],
    attractions: [
      { name: 'Old Goa Churches (UNESCO)', distance: '10 km from Panaji', type: 'heritage', bestVehicle: 'Bike or car — 15-min easy ride; free parking at Basilica' },
      { name: 'Dudhsagar Falls', distance: '60 km via Molem Forest', type: 'nature', bestVehicle: 'SUV to Molem checkpoint only — jeep safari mandatory inside forest' },
      { name: 'Arambol Beach', distance: '50 km from Panaji', type: 'beach', bestVehicle: 'Bike — narrow road to Arambol village; parking is very limited' },
      { name: 'Palolem Beach', distance: '65 km from Margao', type: 'beach', bestVehicle: 'Bike or compact car — scenic South Goa road along NH66' },
      { name: 'Chapora Fort (Dil Chahta Hai)', distance: '25 km from Panaji', type: 'heritage', bestVehicle: 'Bike — path to fort is narrow; park at Vagator village base' },
      { name: 'Tambdi Surla Shiva Temple (12th century)', distance: '75 km from Panaji', type: 'religious', bestVehicle: 'SUV — forest track to temple is unpaved for last 5 km' },
    ],
    drivingInfo: {
      restrictions: 'Tourist taxis (yellow-top) operate on fixed fares — app-based cabs are restricted in Goa. Riding without helmet = ₹500 on-the-spot fine. Beach parking restricted near high-tide lines.',
      parking: 'Free parking at most beaches and tourist sites. Paid parking in Panaji city center ₹20/hr. No overnight parking on Baga and Calangute beach road (vehicles towed post midnight).',
      highwayNote: 'NH66 runs the coastal length of Goa connecting Calangute to Margao via Panaji. NH4A connects Panaji to Belagavi. Goa roads: narrow, winding, and scenic — max 40 km/h through villages.',
    },
  },

  chandigarh: {
    neighborhoods: [
      { name: 'Sector 17 (City Centre)', type: 'Commercial Hub', pickupNote: 'Central plaza; most vendors; best for day-hire within Chandigarh Tricity' },
      { name: 'Industrial Area Phase 1 & 2', type: 'Industrial', pickupNote: 'Serves Panchkula and NH-21 Himachal Pradesh corridor' },
      { name: 'Sector 34 / 35', type: 'Educational', pickupNote: 'Panjab University Campus area; budget bikes and compact car rentals' },
      { name: 'Panchkula', type: 'Haryana Suburb', pickupNote: 'Serves NH22 to Shimla; ideal starting point for Himachal outstation trips' },
      { name: 'Mohali (SAS Nagar)', type: 'Punjab Suburb / IT', pickupNote: 'Mohali Airport area; ISBT and IT Park; serves NH54 Punjab corridor' },
    ],
    attractions: [
      { name: 'Sukhna Lake & Rock Garden', distance: '8 km from Sector 17', type: 'park', bestVehicle: 'Bike or any car — peaceful drive along Sukhna Choe road' },
      { name: 'Shimla Hill Station', distance: '120 km via NH5', type: 'nature', bestVehicle: 'SUV — mountain road from Kalka; Kalka-Shimla toy train alternate' },
      { name: 'Kasauli Hill Station', distance: '65 km via NH5', type: 'nature', bestVehicle: 'SUV — narrow hill roads; quaint British-era cantonment' },
      { name: 'Morni Hills', distance: '45 km via Panchkula NH73', type: 'nature', bestVehicle: 'SUV — dirt tracks near Tikkar Taal reservoir' },
      { name: 'Amritsar Golden Temple', distance: '230 km via NH44', type: 'religious', bestVehicle: 'Sedan or SUV — 4-hr drive on excellent NH44' },
    ],
    drivingInfo: {
      restrictions: 'Chandigarh is a UT with well-planned grid roads. Heavy vehicles banned in Sectors 1–24 between 8 AM and 8 PM. No odd-even scheme.',
      parking: 'UT Parking Authority manages multilevel parking at Sector 17 ₹30/hr. Parking is free and ample in Sectors 30–50 and all outer areas.',
      highwayNote: 'NH44 to Delhi: 260 km, 4.5 hrs — well-lit 6-lane. NH5 to Shimla: 120 km, 3.5 hrs via Kalka mountain road. NH21 to Manali: 310 km, 7 hrs — plan 2-day trip.',
    },
  },

  kochi: {
    neighborhoods: [
      { name: 'Ernakulam (MG Road / Durbar Hall Road)', type: 'Commercial Hub', pickupNote: 'City center; junction of all districts; best for same-day self-drive pickup' },
      { name: 'Fort Kochi & Mattancherry', type: 'Heritage / Tourism', pickupNote: 'Heritage quarter; bikes most useful here — narrow Fort Kochi lanes' },
      { name: 'Kakkanad (Infopark / SmartCity)', type: 'IT Hub', pickupNote: 'Kerala\'s main IT corridor; corporate daily and monthly rentals' },
      { name: 'Thrikkakkara (Edapally)', type: 'North Kochi', pickupNote: 'Lulu Mall area; NH544 access to Thrissur and Palakkad' },
      { name: 'Aluva', type: 'Airport Zone', pickupNote: 'COK Cochin International Airport — 15-km from Ernakulam; immediate availability' },
    ],
    attractions: [
      { name: 'Fort Kochi & Cheena Vala (Chinese Fishing Nets)', distance: '12 km from Ernakulam', type: 'heritage', bestVehicle: 'Bike — car parking in Fort Kochi is nearly impossible' },
      { name: 'Athirapally Waterfalls', distance: '75 km via Chalakudy', type: 'nature', bestVehicle: 'SUV — steep sections near Vazhachal forest checkpoint' },
      { name: 'Munnar Tea Gardens', distance: '130 km via NH544 then SH17', type: 'nature', bestVehicle: 'SUV — SH17 ghat road from Adimali to Munnar' },
      { name: 'Alleppey (Alappuzha) Backwaters', distance: '55 km via NH66', type: 'nature', bestVehicle: 'Sedan — good road; houseboat from Alappuzha boat jetty' },
      { name: 'Periyar Wildlife Sanctuary, Thekkady', distance: '180 km via Kothamangalam', type: 'nature', bestVehicle: 'SUV — ghat road from Moolamattom to Thekkady' },
    ],
    drivingInfo: {
      restrictions: 'Kerala has strict drunk-driving enforcement. No odd-even in Kochi. Narrow roads in Fort Kochi are one-way on weekends. Marine Drive promenade is closed to vehicles after 8 PM.',
      parking: 'GCDA paid parking in Ernakulam ₹20–30/hr. Fort Kochi parking is extremely scarce on weekends — use ferry or bike. Infopark has dedicated corporate parking.',
      highwayNote: 'NH544 to Coimbatore: 185 km, 3.5 hrs. NH66 to Trivandrum: 220 km, 4 hrs. NH544 then SH17 to Munnar: 130 km, 3 hrs through scenic ghats.',
    },
  },

  mysore: {
    neighborhoods: [
      { name: 'Mysore Palace Surroundings', type: 'Heritage / Tourism', pickupNote: 'Sayyaji Rao Road area; bikes most useful for heritage circuit; peak Dasara demand' },
      { name: 'Vijayanagar', type: 'Residential Hub', pickupNote: 'Fastest-growing Mysore zone; budget bike and car rentals for commuters' },
      { name: 'Jayalakshmipuram', type: 'Premium Residential', pickupNote: 'Serves NH275 Bangalore highway; best for Bangalore outstation pickups' },
      { name: 'Bannimantap', type: 'Commercial & Transport', pickupNote: 'KSRTC bus stand area; most accessible for intercity trip starts' },
      { name: 'Hebbal Ring Road', type: 'Outer Zone', pickupNote: 'Serves NH766 to Ooty and Wayanad; SUVs in high demand for hill trips' },
    ],
    attractions: [
      { name: 'Mysore Palace (Amba Vilas)', distance: '2 km from city center', type: 'heritage', bestVehicle: 'Bike or any car — palace parking lot available' },
      { name: 'Coorg (Madikeri)', distance: '120 km via NH275 then NH167', type: 'nature', bestVehicle: 'SUV — ghat road from Kushalnagar to Madikeri' },
      { name: 'Ooty (Tamil Nadu)', distance: '90 km via Gudalur NH766', type: 'nature', bestVehicle: 'SUV mandatory — steep Gudalur ghat' },
      { name: 'Wayanad Wildlife Sanctuary', distance: '100 km via NH766', type: 'nature', bestVehicle: 'SUV — Vythiri and Sulthan Bathery roads are winding' },
      { name: 'Srirangapatna (Tipu Sultan\'s Fort)', distance: '15 km via NH275', type: 'heritage', bestVehicle: 'Any car or bike — island fort, 30-min from Mysore' },
    ],
    drivingInfo: {
      restrictions: 'Mysore traffic mostly easygoing. Dasara festival (Oct): heavy crowds near palace — park at Devaraja Market and walk. Ooty road vehicle timing restrictions during school season.',
      parking: 'Free parking at most Mysore sites including palace. Devaraja Market area has paid parking ₹10–20/hr. NH275 to Bangalore has no major restrictions.',
      highwayNote: 'NH275 to Bangalore: 145 km, 3 hrs — smooth 4-lane. NH766 to Ooty: 90 km, 2.5 hrs via Gudalur. NH167 to Madikeri (Coorg): 50 km from Kushalnagar, 1.5 hrs ghat road.',
    },
  },

  indore: {
    neighborhoods: [
      { name: 'Vijay Nagar', type: 'Commercial Hub', pickupNote: 'AB Road area; highest commercial activity; central for all Indore zones' },
      { name: 'Rau / Super Corridor', type: 'IT Hub', pickupNote: 'Smart City zone with TCS and Infosys campus; growing rental demand' },
      { name: 'Palasia', type: 'Market / Residential', pickupNote: 'Old Indore; budget rentals; MG Road and LIG colony access' },
      { name: 'Rajwada Area', type: 'Heritage / Commercial', pickupNote: 'Old City and Sarafa Bazaar; bikes best for navigating old lanes' },
      { name: 'Bypass Road / IIM-I Zone', type: 'Premium Residential', pickupNote: 'IIM Indore campus zone; corporate self-drive demand' },
    ],
    attractions: [
      { name: 'Maheshwar Ghats & Fort', distance: '95 km via NH52', type: 'religious', bestVehicle: 'Sedan — 1.5-hr drive on NH52 to Narmada riverside' },
      { name: 'Omkareshwar Jyotirlinga', distance: '80 km via NH52', type: 'religious', bestVehicle: 'Any car — 1.5-hr easy drive via Sanawad' },
      { name: 'Mandu (Mandav) Fort', distance: '100 km via NH52 then SH7', type: 'heritage', bestVehicle: 'SUV — plateau roads at Mandu are uneven' },
      { name: 'Ujjain (Mahakaleshwar Temple)', distance: '55 km via NH52', type: 'religious', bestVehicle: 'Any car — 1 hr on good NH52; plan for Simhastha Kumbh crowds' },
      { name: 'Patalpani Waterfall', distance: '35 km via Kalakund road', type: 'nature', bestVehicle: 'Any car — railway station next to falls; parking available' },
    ],
    drivingInfo: {
      restrictions: 'No odd-even in Indore. BRTS corridor on AB Road — private vehicles allowed in BRTS lane only during designated hours. Rajwada square has pedestrian priority during evenings.',
      parking: 'IMC paid parking near Rajwada ₹10/hr. Most commercial areas have free roadside parking. Vijay Nagar malls have paid basement parking.',
      highwayNote: 'NH52 to Ujjain: 55 km, 1 hr. NH52 to Bhopal: 190 km, 3.5 hrs. NH46 (Indore-Bhopal Highway) is well-maintained 4-lane. NH48 to Mumbai: 590 km, 10 hrs via Dhule.',
    },
  },

};
