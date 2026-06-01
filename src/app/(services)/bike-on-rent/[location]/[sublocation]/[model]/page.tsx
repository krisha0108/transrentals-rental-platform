import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCityNameFromSlug } from '@/data/city-sublocations';

interface PageProps {
  params: { location: string; sublocation: string; model: string };
}

// ─── Bike catalogue ──────────────────────────────────────────────────────────
// sublocation param = make slug (e.g. "royal-enfield", "honda")
// model param = model slug (e.g. "classic-350", "activa-6g")

const BIKE_MAKES: Record<string, {
  name: string;
  models: Record<string, {
    name: string;
    category: string;
    pricePerDay: number;
    engine: string;
    power: string;
    mileage: string;
    type: string;
    bestFor: string[];
    highlights: string[];
    faqs: { q: string; a: string }[];
  }>;
}> = {
  'royal-enfield': {
    name: 'Royal Enfield',
    models: {
      'classic-350': {
        name: 'Classic 350',
        category: 'Cruiser',
        pricePerDay: 699,
        engine: '349cc',
        power: '20.2 bhp',
        mileage: '35–40 km/l',
        type: 'Cruiser / Retro',
        bestFor: ['Weekend rides', 'Scenic routes', 'Road trips', 'City touring'],
        highlights: ['Iconic retro styling', 'Smooth 350cc engine', 'Comfortable upright seating', 'Great highway cruiser'],
        faqs: [
          { q: 'What is the Royal Enfield Classic 350 rental price?', a: 'Royal Enfield Classic 350 rental starts from ₹699/day. Weekly packages (7 days) start from ₹3,999 — saving ~18% over daily rates. Fuel is on you; helmet is included.' },
          { q: 'Is the Classic 350 suitable for long road trips?', a: 'Yes — the Classic 350 is one of the most popular road-trip bikes in India. Comfortable for 200–400 km daily. Its low vibration engine and upright posture make multi-day touring enjoyable.' },
          { q: 'What documents do I need to rent a Royal Enfield Classic 350?', a: 'Valid driving licence with MCWG endorsement, government photo ID (Aadhaar/Passport), and a refundable security deposit of ₹2,000–₹3,000.' },
          { q: 'Can I take the Classic 350 to Leh Ladakh?', a: 'Yes, with prior outstation approval from the vendor. Most TransRentals vendors allow Manali–Leh routes. Confirm coverage area, insurance validity, and breakdown support before booking for high-altitude trips.' },
          { q: 'Is the Royal Enfield Classic 350 available in all cities?', a: 'Classic 350 is widely available in tourist cities (Goa, Manali, Leh, Rishikesh, Ooty) and metro cities. Availability may vary by city — check TransRentals for your specific location.' },
        ],
      },
      'bullet-350': {
        name: 'Bullet 350',
        category: 'Cruiser',
        pricePerDay: 649,
        engine: '349cc',
        power: '19.1 bhp',
        mileage: '38–42 km/l',
        type: 'Cruiser / Heritage',
        bestFor: ['Heritage riding', 'City tours', 'Highway cruising', 'Leisure rides'],
        highlights: ['Legendary thump sound', 'Classic iron-body design', 'Lighter than Classic 350', 'Budget-friendly Royal Enfield'],
        faqs: [
          { q: 'What is the Royal Enfield Bullet 350 rent per day?', a: 'Bullet 350 rental starts from ₹649/day with helmet. Weekly packages available from ₹3,499. Security deposit ₹2,000 refundable.' },
          { q: 'What is the difference between Bullet 350 and Classic 350 on rent?', a: 'The Bullet 350 has the iconic "thump" of the original cast-iron engine series with a lighter body. The Classic 350 is the modern version with better refinement and fuel injection. For purists, Bullet feels more authentic; for longer trips, Classic is more comfortable.' },
          { q: 'Is the Bullet 350 good for city riding?', a: 'Yes. The Bullet 350 is nimble enough for city riding. Its narrow body handles traffic well and the 349cc single-cylinder engine gives good low-end torque for stop-go traffic.' },
          { q: 'What documents are needed?', a: 'Valid MCWG driving licence, government photo ID, and ₹2,000 refundable deposit.' },
          { q: 'Can I ride the Bullet 350 on highways?', a: 'Yes — comfortable up to 100–110 km/h cruise speed on highways. Use helmets and ride within state permit zones unless outstation approval is obtained.' },
        ],
      },
      himalayan: {
        name: 'Himalayan 411',
        category: 'Adventure',
        pricePerDay: 899,
        engine: '411cc',
        power: '24.3 bhp',
        mileage: '30–35 km/l',
        type: 'Adventure Tourer',
        bestFor: ['Leh Ladakh', 'Manali–Spiti', 'Off-road tracks', 'Mountain roads'],
        highlights: ['Purpose-built for mountain roads', '411cc long-stroke engine', 'Long-travel suspension', 'Semi-off-road capable', 'High ground clearance'],
        faqs: [
          { q: 'What is the Royal Enfield Himalayan 411 rental price?', a: 'Himalayan 411 rental starts from ₹899/day. For Leh-Ladakh packages (7–15 days), weekly rates from ₹4,999 — includes helmet, insurance coverage, and basic toolkit.' },
          { q: 'Is the Himalayan 411 suitable for Leh Ladakh?', a: 'The Himalayan 411 is the most popular choice for Leh Ladakh. Its long-travel suspension handles mountain passes, 411cc engine delivers adequate power at altitude, and the bike is designed for exactly these conditions.' },
          { q: 'Can a beginner ride the Himalayan 411?', a: 'Yes — the Himalayan is beginner-friendly with its predictable handling and low-revving engine. Its wide handlebar and upright posture give confident control. Still, for Leh Ladakh, 3–6 months of riding experience is strongly recommended.' },
          { q: 'What gear is provided with Himalayan rental?', a: 'Full-face helmet is always included. Some vendors provide knuckle guards, gloves, and bungee cords. Saddlebags and tank bags are available as paid add-ons. Confirm at booking.' },
          { q: 'Is breakdown support available on Manali–Leh highway?', a: 'Leading vendors on TransRentals provide roadside support arrangements on Manali–Leh. However, for remote stretches, self-help and group riding are advisable. Always carry a basic toolkit.' },
        ],
      },
      'meteor-350': {
        name: 'Meteor 350',
        category: 'Cruiser',
        pricePerDay: 749,
        engine: '349cc',
        power: '20.2 bhp',
        mileage: '36–40 km/l',
        type: 'Modern Cruiser',
        bestFor: ['Comfortable touring', 'Weekend getaways', 'City + highway mix', 'Couples rides'],
        highlights: ['Most refined RE 350', 'Triple-spark ignition', 'Tripper navigation pod', 'Low seat height (765 mm)', 'Smooth highway cruiser'],
        faqs: [
          { q: 'What is the Royal Enfield Meteor 350 rental price?', a: 'Meteor 350 rental starts from ₹749/day. The Meteor is the most comfortable Royal Enfield rental for touring — smooth engine, relaxed posture, and great highway composure.' },
          { q: 'How is the Meteor 350 different from Classic 350?', a: 'Meteor 350 is more refined — smoother engine, better ergonomics for taller riders, and a modern feature set (Tripper GPS pod, USB charging). Classic 350 has the retro appeal. For pure touring comfort, the Meteor is the better rental choice.' },
          { q: 'Is the Meteor 350 comfortable for long rides?', a: 'Yes — the Meteor has the most comfortable ergonomics in the 350cc Royal Enfield range. Its low seat, wide handlebar, and relaxed foot peg position make it ideal for 200–500 km touring days.' },
          { q: 'What documents do I need?', a: 'Valid MCWG driving licence, government ID (Aadhaar/Passport), and ₹2,000–₹3,000 refundable deposit.' },
          { q: 'Is the Meteor 350 available in Goa?', a: 'Yes, Meteor 350 is available in Goa from multiple TransRentals vendors. Book 24–48 hours in advance, especially during tourist season (October–March).' },
        ],
      },
      'hunter-350': {
        name: 'Hunter 350',
        category: 'Roadster',
        pricePerDay: 699,
        engine: '349cc',
        power: '20.2 bhp',
        mileage: '35–38 km/l',
        type: 'Urban Roadster',
        bestFor: ['City riding', 'Short trips', 'Weekend rides', 'College commute style'],
        highlights: ['Lightest RE 350 (181 kg)', 'City-friendly ergonomics', 'Modern streetfighter styling', 'Easy to handle in traffic'],
        faqs: [
          { q: 'What is the Hunter 350 rent per day?', a: 'Hunter 350 rental starts from ₹699/day with helmet. The Hunter is Royal Enfield\'s lightest 350cc — ideal for city riding and short-distance touring.' },
          { q: 'How is Hunter 350 different from Classic 350 for rental?', a: 'Hunter 350 is lighter (181 kg vs 195 kg), more city-friendly, and easier to maneuver. Classic 350 has the traditional cruiser character better suited for long highway runs. For city use, Hunter is the better pick.' },
          { q: 'Is Hunter 350 available across India?', a: 'Hunter 350 availability is growing rapidly. Currently available in major metro and tourist cities. Check TransRentals for availability in your specific city.' },
          { q: 'What documents are required?', a: 'Valid MCWG driving licence, government photo ID, and ₹2,000 refundable deposit.' },
          { q: 'Can I do a road trip on the Hunter 350?', a: 'Yes — the Hunter 350 handles day tours and weekend trips well. For multi-day, multi-state tours, the Himalayan or Meteor 350 offer more touring-optimized ergonomics.' },
        ],
      },
    },
  },
  honda: {
    name: 'Honda',
    models: {
      'activa-6g': {
        name: 'Activa 6G',
        category: 'Scooter',
        pricePerDay: 299,
        engine: '109.51cc',
        power: '7.68 bhp',
        mileage: '50–55 km/l',
        type: 'Automatic Scooter',
        bestFor: ['Daily commuting', 'City errands', 'Short trips', 'Sightseeing'],
        highlights: ['India\'s best-selling scooter', 'Silent start', 'External fuel lid', 'Low maintenance', 'Easy to ride'],
        faqs: [
          { q: 'What is the Honda Activa 6G rent per day?', a: 'Honda Activa 6G rental starts from ₹299/day with helmet. It is the most affordable and widely available two-wheeler rental in India — ideal for city use and sightseeing.' },
          { q: 'Can beginners rent the Honda Activa 6G?', a: 'Yes — the Activa 6G is the ideal first rental for beginners. It is fully automatic (no gears), lightweight (107 kg), and easy to handle in city traffic. Even riders with just 1–2 months of experience can comfortably use it.' },
          { q: 'What documents are needed to rent an Activa?', a: 'A valid driving licence (LMV/MCWG for bikes above 50cc), government ID (Aadhaar/Passport), and ₹1,000–₹1,500 refundable deposit.' },
          { q: 'Is the Activa available for doorstep delivery?', a: 'Yes — most TransRentals vendors offer doorstep delivery of the Activa for ₹100–₹200 extra. Delivery within 2 hours of booking in most cities.' },
          { q: 'What is the fuel efficiency of Activa 6G?', a: 'Real-world mileage: 50–55 km/l in city conditions. For a full-day sightseeing trip (100 km), you\'ll spend around ₹220–₹250 on petrol — very economical.' },
        ],
      },
      'activa-125': {
        name: 'Activa 125',
        category: 'Scooter',
        pricePerDay: 349,
        engine: '124cc',
        power: '8.29 bhp',
        mileage: '48–52 km/l',
        type: 'Premium Scooter',
        bestFor: ['Daily commuting', 'City sightseeing', 'Short trips', 'Comfortable city rides'],
        highlights: ['Premium over Activa 6G', 'LED headlamp', 'Digital-analog console', 'Larger 12" wheels for stability', 'Comfortable for two-up'],
        faqs: [
          { q: 'What is the Honda Activa 125 rent per day?', a: 'Activa 125 rental starts from ₹349/day — slightly more than Activa 6G for a larger, more premium scooter with better stability and slightly more power.' },
          { q: 'What is the difference between Activa 6G and Activa 125?', a: 'Activa 125 has a bigger engine (124cc vs 109cc), larger wheels (12"), and a more premium feel with LED lighting. It is more stable at higher speeds and more comfortable for two-up riding.' },
          { q: 'Is doorstep delivery available for Activa 125?', a: 'Yes — most vendors offer doorstep delivery of Activa 125 for ₹100–₹200 extra.' },
          { q: 'What documents are needed?', a: 'Valid driving licence (LMV/MCWG), government ID, and ₹1,000–₹1,500 refundable deposit.' },
          { q: 'Is Activa 125 suitable for beginners?', a: 'Yes — fully automatic and easy to ride. Its 12" wheels give better stability than smaller scooters. Excellent choice for first-time or occasional riders.' },
        ],
      },
      'cb-350': {
        name: 'CB350 H\'ness',
        category: 'Neo-Retro',
        pricePerDay: 799,
        engine: '348.36cc',
        power: '21 bhp',
        mileage: '38–42 km/l',
        type: 'Neo-Retro Roadster',
        bestFor: ['City touring', 'Weekend rides', 'Highway cruising', 'Style-conscious riders'],
        highlights: ['Honda reliability + retro design', 'Smooth 350cc single-cylinder', 'Better refinement than RE Classic 350', 'Bluetooth connectivity'],
        faqs: [
          { q: 'What is the Honda CB350 H\'ness rental price?', a: 'Honda CB350 H\'ness rental starts from ₹799/day. It competes directly with Royal Enfield Classic 350 but with Honda\'s legendary reliability and better refinement.' },
          { q: 'How does CB350 compare to Royal Enfield Classic 350 on rent?', a: 'Both are 350cc retro-style bikes at similar price points. CB350 has better build quality, smoother engine, and Bluetooth. RE Classic 350 has more character and is more widely available for rent.' },
          { q: 'Is Honda CB350 available for rent in India?', a: 'CB350 is available in select cities — mainly metros and tourist destinations like Goa and Bangalore. Availability is more limited than Royal Enfield models.' },
          { q: 'Is it suitable for long highway rides?', a: 'Yes — CB350 is an excellent highway cruiser. Comfortable seating, refined engine, and excellent fuel efficiency (38–42 km/l) make it a great touring companion.' },
          { q: 'What documents are needed?', a: 'Valid MCWG driving licence, government ID, and ₹2,500–₹3,000 refundable security deposit.' },
        ],
      },
      'hornet-2-0': {
        name: 'Hornet 2.0',
        category: 'Sports',
        pricePerDay: 699,
        engine: '184.4cc',
        power: '17.03 bhp',
        mileage: '40–45 km/l',
        type: 'Sports Commuter',
        bestFor: ['City performance', 'Short highway runs', 'Weekend sports riding', 'Young riders'],
        highlights: ['Dual-channel ABS', 'Sporty design', 'Liquid-cooled 184cc', 'LED lighting all round', 'Responsive throttle'],
        faqs: [
          { q: 'What is the Honda Hornet 2.0 rent per day?', a: 'Honda Hornet 2.0 rental starts from ₹699/day. It offers a sporty ride with liquid-cooled 184cc engine and dual-channel ABS.' },
          { q: 'Is Hornet 2.0 good for city riding?', a: 'Excellent for city riding. Liquid-cooled engine stays calm in traffic, dual-channel ABS gives confidence in wet conditions.' },
          { q: 'Can I take the Hornet 2.0 on highways?', a: 'Comfortable for short highway runs up to 120–130 km/h. For long-distance touring (200+ km/day), a bigger bike is preferred.' },
          { q: 'What is the fuel efficiency?', a: 'Around 40–45 km/l in city conditions. The liquid-cooled engine is efficient despite its performance-oriented tuning.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹1,500–₹2,000 refundable deposit.' },
        ],
      },
    },
  },
  ktm: {
    name: 'KTM',
    models: {
      'duke-200': {
        name: 'Duke 200',
        category: 'Sports',
        pricePerDay: 899,
        engine: '199.5cc',
        power: '25 bhp',
        mileage: '35–40 km/l',
        type: 'Naked Sports',
        bestFor: ['Sporty city riding', 'Track-inspired experience', 'Weekend fun', 'Experienced riders'],
        highlights: ['25 bhp power-to-weight champion', 'Trellis frame', 'WP suspension', 'Slipper clutch', 'Aggressive naked styling'],
        faqs: [
          { q: 'What is the KTM Duke 200 rent per day?', a: 'KTM Duke 200 rental starts from ₹899/day. It is the most affordable KTM rental offering genuine sports performance — 25 bhp from a 200cc engine with WP suspension.' },
          { q: 'Is the Duke 200 suitable for city riding?', a: 'Yes — the Duke 200 is a city sportbike at heart. Its light weight (~160 kg) and responsive 200cc engine make it agile in traffic.' },
          { q: 'What experience level is needed to ride a KTM Duke 200?', a: 'The Duke 200 is best suited for riders with at least 6–12 months of riding experience. Its light weight and powerful engine demand respect. Not recommended for absolute beginners.' },
          { q: 'Can I take the Duke 200 on a highway trip?', a: 'Comfortable for day trips up to 150–200 km. The aggressive seating position becomes tiring on long rides.' },
          { q: 'What documents are required for KTM Duke rental?', a: 'Valid MCWG driving licence, government ID, and ₹2,500–₹3,500 refundable security deposit.' },
        ],
      },
      'duke-390': {
        name: 'Duke 390',
        category: 'Sports',
        pricePerDay: 1199,
        engine: '373cc',
        power: '43 bhp',
        mileage: '25–30 km/l',
        type: 'Naked Sports / Supermoto',
        bestFor: ['Experienced sports riders', 'Track days', 'High-speed touring', 'Thrill seekers'],
        highlights: ['43 bhp supermoto performance', 'Slipper + quickshifter', 'Cornering ABS + traction control', 'TFT display', 'Lean-angle sensing'],
        faqs: [
          { q: 'What is the KTM Duke 390 rent per day?', a: 'KTM Duke 390 rental starts from ₹1,199/day. It is one of the most performance-oriented bikes available for rent in India — 43 bhp with cornering ABS, quickshifter, and traction control.' },
          { q: 'Is the Duke 390 suitable for beginners?', a: 'No — the Duke 390 is strictly for experienced riders with at least 2+ years of riding experience. Its 43 bhp is a lot for Indian roads and demands mature throttle control.' },
          { q: 'Can the Duke 390 be taken on a road trip?', a: 'Yes for day trips and 200–300 km routes. For multi-day touring, the ergonomics are aggressive for long-distance comfort.' },
          { q: 'What security deposit is required for Duke 390?', a: '₹3,000–₹5,000 refundable security deposit required for the Duke 390, given its high value.' },
          { q: 'Is Duke 390 available across India?', a: 'Duke 390 is available in metro cities and select tourist destinations. Book 2–3 days in advance.' },
        ],
      },
      'adventure-390': {
        name: 'Adventure 390',
        category: 'Adventure',
        pricePerDay: 1299,
        engine: '373cc',
        power: '43 bhp',
        mileage: '24–28 km/l',
        type: 'Adventure Tourer',
        bestFor: ['Long-distance touring', 'Mountain roads', 'Mixed on-off road', 'Experienced tourers'],
        highlights: ['Best-in-class 43 bhp ADV', 'Cornering ABS + traction control', 'Long-travel WP suspension', 'Large 14.5L tank', 'TFT + navigation'],
        faqs: [
          { q: 'What is the KTM Adventure 390 rent per day?', a: 'KTM Adventure 390 rental starts from ₹1,299/day. It is the most advanced adventure bike available for rent in India — 43 bhp, cornering electronics, and a bigger fuel tank.' },
          { q: 'How does KTM Adventure 390 compare to RE Himalayan for Leh Ladakh?', a: 'Adventure 390 wins on performance (43 bhp vs 24 bhp) and electronics. RE Himalayan wins on availability, local service network, and simpler mechanics for remote areas.' },
          { q: 'Is the Adventure 390 suitable for off-road riding?', a: 'It handles gravel roads, light trails, and mountain passes excellently. Full off-road is limited by its weight and road-biased tyres.' },
          { q: 'What documents are required?', a: 'Valid MCWG driving licence with minimum 2 years of riding experience, government ID, and ₹4,000–₹5,000 refundable deposit.' },
          { q: 'Is the Adventure 390 available for rent?', a: 'Available in select cities — Bangalore, Delhi, Pune, and some adventure-route hubs. Book 3–5 days in advance for peak season.' },
        ],
      },
    },
  },
  yamaha: {
    name: 'Yamaha',
    models: {
      'r15-v4': {
        name: 'R15 V4',
        category: 'Sports',
        pricePerDay: 999,
        engine: '155cc',
        power: '18.4 bhp',
        mileage: '40–45 km/l',
        type: 'Full-Fairing Sports',
        bestFor: ['Sports riding experience', 'Weekend thrills', 'City performance', 'Track-inspired riding'],
        highlights: ['Full-fairing sportbike look', 'VVA technology', 'Quickshifter (up only)', 'Slipper clutch', 'Traction control'],
        faqs: [
          { q: 'What is the Yamaha R15 V4 rent per day?', a: 'Yamaha R15 V4 rental starts from ₹999/day. It is the best fully-faired sportbike rental available in India with VVA technology, quickshifter, and traction control.' },
          { q: 'Is R15 V4 suitable for daily city riding?', a: 'Manageable for city use but the full-fairing aggressive posture can be tiring in heavy traffic. Ideal as a weekend sports ride rather than daily city commuter.' },
          { q: 'Can beginners ride the Yamaha R15?', a: 'The R15 V4 is not recommended for beginners. Its race-derived posture and quick throttle response demand prior riding experience.' },
          { q: 'What makes R15 V4 different from Duke 200?', a: 'R15 V4 is fully faired with Yamaha\'s smoother power delivery. Duke 200 is a naked supermoto with more aggressive power and trellis-frame handling.' },
          { q: 'What security deposit is required?', a: '₹2,500–₹3,500 refundable deposit.' },
        ],
      },
      'mt-15': {
        name: 'MT-15 V2',
        category: 'Sports',
        pricePerDay: 899,
        engine: '155cc',
        power: '18.4 bhp',
        mileage: '40–44 km/l',
        type: 'Naked Streetfighter',
        bestFor: ['City performance', 'Sporty street riding', 'Aggressive styling', 'Experienced commuters'],
        highlights: ['R15 engine in naked form', 'More upright than R15', 'Inverted front fork', 'Slipper clutch', 'Y-shaped LED lights'],
        faqs: [
          { q: 'What is the Yamaha MT-15 rental price?', a: 'Yamaha MT-15 V2 rental starts from ₹899/day — same engine as R15 V4 in a naked form with more city-friendly ergonomics.' },
          { q: 'How is MT-15 different from R15 for rental?', a: 'MT-15 has the same 155cc engine but without the full fairing. This gives better visibility in city traffic and a more upright riding position.' },
          { q: 'Is MT-15 good for beginners?', a: 'Better than R15 for city use but still requires prior riding experience due to its sporty power delivery. 6+ months of riding experience recommended.' },
          { q: 'Can I take MT-15 on highways?', a: 'Comfortable for day trips (100–200 km). Its naked design means more wind fatigue at highway speeds.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹2,000–₹2,500 refundable deposit.' },
        ],
      },
      'fz-s-v3': {
        name: 'FZ-S V3',
        category: 'Sports Commuter',
        pricePerDay: 599,
        engine: '149cc',
        power: '12.4 bhp',
        mileage: '42–46 km/l',
        type: 'Street Naked',
        bestFor: ['Daily commuting', 'Weekend rides', 'Young riders', 'Balanced performance'],
        highlights: ['Balanced performance + efficiency', 'FI (fuel-injected)', 'Smooth power delivery', 'ABS available', 'Muscular street styling'],
        faqs: [
          { q: 'What is the Yamaha FZ-S V3 rent per day?', a: 'Yamaha FZ-S V3 rental starts from ₹599/day. It is the best balanced sports commuter rental — enough performance for weekend fun, efficient enough for daily use.' },
          { q: 'Is FZ-S suitable for beginners?', a: 'Yes — the FZ-S V3 is among the most beginner-friendly sports bikes for rent. Smooth 149cc FI engine, light weight (~133 kg), and predictable handling.' },
          { q: 'Can I do highway trips on the FZ-S V3?', a: 'Comfortable for day trips up to 150 km. For long highway tours, a bigger displacement bike is recommended.' },
          { q: 'What is the fuel efficiency of FZ-S?', a: '42–46 km/l real-world. A full day of riding (100 km) costs around ₹220–₹250 on fuel.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹1,500–₹2,000 refundable deposit.' },
        ],
      },
      'fascino-125': {
        name: 'Fascino 125',
        category: 'Scooter',
        pricePerDay: 349,
        engine: '125cc',
        power: '8.2 bhp',
        mileage: '50–55 km/l',
        type: 'Premium Scooter',
        bestFor: ['City sightseeing', 'Daily commuting', 'Female-friendly rides', 'Short trips'],
        highlights: ['Stylish Italian-inspired design', 'Lightweight (99 kg)', 'Silent start', 'Under-seat storage', 'LED headlamp'],
        faqs: [
          { q: 'What is the Yamaha Fascino 125 rent per day?', a: 'Yamaha Fascino 125 rental starts from ₹349/day — a stylish, lightweight scooter for city sightseeing and daily use. Very easy to ride.' },
          { q: 'Is the Fascino 125 suitable for beginners?', a: 'Excellent for beginners — fully automatic, very lightweight (99 kg), and easy to maneuver. One of the most beginner-friendly two-wheelers available for rent.' },
          { q: 'What is the difference between Fascino 125 and Honda Activa 6G?', a: 'Both are 125cc premium scooters. Fascino is lighter, has better styling. Activa 6G has Honda\'s service network advantage. Both are equally good rental choices.' },
          { q: 'Is doorstep delivery available?', a: 'Yes — doorstep delivery for ₹100–₹200 extra in most cities.' },
          { q: 'What documents are needed?', a: 'Valid driving licence, government ID, and ₹1,000–₹1,500 refundable deposit.' },
        ],
      },
    },
  },
  bajaj: {
    name: 'Bajaj',
    models: {
      'pulsar-150': {
        name: 'Pulsar 150',
        category: 'Sports Commuter',
        pricePerDay: 449,
        engine: '149.01cc',
        power: '14 bhp',
        mileage: '45–50 km/l',
        type: 'Sports Commuter',
        bestFor: ['Daily commuting', 'Budget sports riding', 'City + highway mix', 'Value rentals'],
        highlights: ['India\'s iconic budget sports bike', 'Proven reliable engine', 'Comfortable for two', 'Wide service network', 'Good highway performer'],
        faqs: [
          { q: 'What is the Bajaj Pulsar 150 rent per day?', a: 'Bajaj Pulsar 150 rental starts from ₹449/day — the most affordable sports-style bike rental in India.' },
          { q: 'Is the Pulsar 150 good for beginners?', a: 'Yes — the Pulsar 150 is one of the most beginner-friendly sporty bikes for rental. Manageable power, wide handlebars, and comfortable seating. Riders with 2+ months of experience can handle it comfortably.' },
          { q: 'How far can I go on a Pulsar 150 in one day?', a: 'Comfortably 200–300 km/day. Cruises comfortably at 90–100 km/h. Fuel efficiency (45–50 km/l) keeps running costs low.' },
          { q: 'Is Pulsar 150 available across India?', a: 'Yes — Pulsar 150 is one of the most widely available rental bikes in India.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹1,000–₹1,500 refundable deposit.' },
        ],
      },
      'pulsar-ns200': {
        name: 'Pulsar NS200',
        category: 'Sports',
        pricePerDay: 799,
        engine: '199.5cc',
        power: '24.5 bhp',
        mileage: '35–40 km/l',
        type: 'Naked Street Sports',
        bestFor: ['Performance street riding', 'Weekend thrills', 'City performance', 'Experienced riders'],
        highlights: ['24.5 bhp liquid-cooled 200cc', 'Perimeter frame', 'Dual-channel ABS', 'Aggressive naked styling', 'Great value sports bike'],
        faqs: [
          { q: 'What is the Bajaj Pulsar NS200 rental price?', a: 'Pulsar NS200 rental starts from ₹799/day. At 24.5 bhp from a liquid-cooled 200cc engine with dual-channel ABS, it offers excellent performance per rupee.' },
          { q: 'How does NS200 compare to KTM Duke 200 on rent?', a: 'Both share the same 199.5cc engine. Duke 200 has better suspension (WP) and more premium components. NS200 is more affordable and offers similar performance.' },
          { q: 'Is NS200 suitable for beginners?', a: 'Not for absolute beginners. Its 24.5 bhp liquid-cooled engine is lively — 6+ months of riding experience recommended.' },
          { q: 'Can I use the NS200 for highway trips?', a: 'Good for day trips and 200–250 km highway runs. Its naked design means wind fatigue at higher speeds.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹2,000–₹2,500 refundable deposit.' },
        ],
      },
      'dominar-400': {
        name: 'Dominar 400',
        category: 'Sports Tourer',
        pricePerDay: 999,
        engine: '373.3cc',
        power: '39.4 bhp',
        mileage: '25–30 km/l',
        type: 'Power Cruiser / Sports Tourer',
        bestFor: ['Long-distance touring', 'Highway cruising', 'Sports touring mix', 'Experienced riders'],
        highlights: ['39.4 bhp torque monster', 'Full LED lighting', 'Dual-channel ABS', 'Comfortable touring posture', 'Great value 400cc'],
        faqs: [
          { q: 'What is the Bajaj Dominar 400 rent per day?', a: 'Bajaj Dominar 400 rental starts from ₹999/day. With 39.4 bhp from a 373cc engine and comfortable touring posture, it is one of the best value long-distance rental bikes.' },
          { q: 'Is the Dominar 400 good for long road trips?', a: 'Excellent — the Dominar 400 is designed for touring. Its torquey engine, comfortable upright posture, and long-range fuel tank make it great for 300–500 km daily touring.' },
          { q: 'How does Dominar 400 compare to Royal Enfield Himalayan?', a: 'Dominar 400 wins on highway performance (39 bhp vs 24 bhp). RE Himalayan wins on off-road capability and mountain road comfort.' },
          { q: 'Is Dominar 400 suitable for experienced riders only?', a: 'Recommended for riders with 1+ year of riding experience.' },
          { q: 'What documents are required?', a: 'MCWG driving licence with 1+ years experience, government ID, and ₹3,000–₹4,000 refundable deposit.' },
        ],
      },
      'avenger-220': {
        name: 'Avenger Street 220',
        category: 'Cruiser',
        pricePerDay: 699,
        engine: '220cc',
        power: '19.03 bhp',
        mileage: '35–40 km/l',
        type: 'Budget Cruiser',
        bestFor: ['Relaxed city touring', 'Highway cruising', 'Laid-back riding style', 'Scenic road trips'],
        highlights: ['Low seat height (690mm)', 'Laid-back cruiser ergonomics', 'Comfortable for tall riders', 'Wide handlebar', 'Budget alternative to RE'],
        faqs: [
          { q: 'What is the Bajaj Avenger 220 rent per day?', a: 'Bajaj Avenger Street 220 rental starts from ₹699/day — a budget-friendly cruiser rental alternative to Royal Enfield.' },
          { q: 'Is the Avenger 220 comfortable for touring?', a: 'Yes — the Avenger\'s cruiser ergonomics (low seat, wide handlebar, forward foot pegs) are very comfortable for long-distance touring.' },
          { q: 'How does Avenger 220 compare to Royal Enfield Classic 350?', a: 'Avenger 220 is lighter and more fuel-efficient. Classic 350 has more power and better highway performance.' },
          { q: 'Is it suitable for beginners?', a: 'Yes — the low seat height (690 mm) makes it accessible even for shorter riders. Manageable power and smooth throttle.' },
          { q: 'What documents are needed?', a: 'MCWG driving licence, government ID, and ₹1,500–₹2,000 refundable deposit.' },
        ],
      },
    },
  },
  tvs: {
    name: 'TVS',
    models: {
      'apache-rtr-200-4v': {
        name: 'Apache RTR 200 4V',
        category: 'Sports',
        pricePerDay: 799,
        engine: '197.75cc',
        power: '20.5 bhp',
        mileage: '35–40 km/l',
        type: 'Naked Sports',
        bestFor: ['City performance', 'Weekend sports riding', 'Experienced riders', 'Track-inspired riding'],
        highlights: ['Oil-cooled 200cc engine', 'Glide-through technology', 'Race-derived ergonomics', 'Dual-channel ABS', 'Slipper clutch'],
        faqs: [
          { q: 'What is the TVS Apache RTR 200 4V rent per day?', a: 'TVS Apache RTR 200 4V rental starts from ₹799/day. It is TVS\'s flagship 200cc sports offering with oil-cooled engine, slipper clutch, and dual-channel ABS.' },
          { q: 'How does Apache RTR 200 compare to KTM Duke 200?', a: 'Both are 200cc naked sports bikes at similar price points. Duke 200 has the better suspension (WP). Apache RTR 200 is often more affordable to rent and has the traffic-friendly Glide-Through feature.' },
          { q: 'Is Apache RTR 200 suitable for beginners?', a: 'Suitable for riders with 6+ months of experience. Not for absolute beginners.' },
          { q: 'Can I take the Apache 200 on highway trips?', a: 'Good for day trips up to 200 km. For multi-day tours, RE or Dominar models offer better long-distance comfort.' },
          { q: 'What documents are required?', a: 'MCWG driving licence, government ID, and ₹2,000–₹2,500 refundable deposit.' },
        ],
      },
      'apache-rtr-160-4v': {
        name: 'Apache RTR 160 4V',
        category: 'Sports Commuter',
        pricePerDay: 599,
        engine: '159.7cc',
        power: '17.55 bhp',
        mileage: '40–45 km/l',
        type: 'Sports Commuter',
        bestFor: ['Daily performance commuting', 'Budget sports riding', 'Young riders', 'City + highway balance'],
        highlights: ['Powerful 160cc 4-valve engine', 'Race-inspired fairing option', 'Slipper clutch', 'Aggressive design', 'ABS variant available'],
        faqs: [
          { q: 'What is the TVS Apache RTR 160 4V rent per day?', a: 'TVS Apache RTR 160 4V rental starts from ₹599/day — excellent performance per rupee with a 160cc 4-valve engine and slipper clutch.' },
          { q: 'Is Apache RTR 160 good for city riding?', a: 'Very good for city riding — its 160cc engine gives quick acceleration in traffic, and the slipper clutch reduces effort in stop-go conditions.' },
          { q: 'How does Apache 160 4V compare to Yamaha FZ-S?', a: 'Apache 160 4V is sportier with more aggressive styling and better top-end performance. FZ-S V3 has smoother power delivery and is more beginner-friendly.' },
          { q: 'Can I take Apache 160 on highway trips?', a: 'Comfortable for day trips up to 150–200 km. Cruises at 100–110 km/h smoothly.' },
          { q: 'What documents are needed?', a: 'MCWG driving licence, government ID, and ₹1,500–₹2,000 refundable deposit.' },
        ],
      },
      'jupiter-125': {
        name: 'Jupiter 125',
        category: 'Scooter',
        pricePerDay: 349,
        engine: '124.8cc',
        power: '8.15 bhp',
        mileage: '50–55 km/l',
        type: 'Premium Scooter',
        bestFor: ['City sightseeing', 'Daily errands', 'Comfortable scooter', 'First-time riders'],
        highlights: ['Best seat comfort in scooter segment', 'External fuel lid', 'Eco mode', 'Smooth suspension', 'Practical storage'],
        faqs: [
          { q: 'What is the TVS Jupiter 125 rent per day?', a: 'TVS Jupiter 125 rental starts from ₹349/day. Known for the best seat comfort in the scooter segment.' },
          { q: 'How does Jupiter 125 compare to Honda Activa 125?', a: 'Jupiter 125 has marginally better seat comfort. Activa 125 has Honda\'s wider service network. Both are equally good premium scooter rentals.' },
          { q: 'Is doorstep delivery available?', a: 'Yes — doorstep delivery available for ₹100–₹200 extra in most cities.' },
          { q: 'Is it suitable for beginners?', a: 'Excellent for beginners — fully automatic and very easy to ride.' },
          { q: 'What documents are needed?', a: 'Valid driving licence, government ID, and ₹1,000–₹1,500 deposit.' },
        ],
      },
      'ntorq-125': {
        name: 'NTorq 125',
        category: 'Sports Scooter',
        pricePerDay: 399,
        engine: '124.8cc',
        power: '9.25 bhp',
        mileage: '47–52 km/l',
        type: 'Sports Scooter',
        bestFor: ['Sporty city riding', 'Young riders', 'Goa & beach towns', 'Style-first riders'],
        highlights: ['Most powerful 125cc scooter', 'Street-moto inspired design', 'Bluetooth SmartXonnect', 'Sport + Street modes', 'Top speed 95+ km/h'],
        faqs: [
          { q: 'What is the TVS NTorq 125 rent per day?', a: 'TVS NTorq 125 rental starts from ₹399/day — India\'s sportiest scooter. Its aggressive design and 9.25 bhp make it the scooter of choice for young riders in Goa and beach destinations.' },
          { q: 'Is NTorq 125 suitable for beginners?', a: 'Yes — fully automatic and easy to ride, though its sporty tuning gives quicker acceleration than standard scooters.' },
          { q: 'Is NTorq 125 popular in Goa?', a: 'The NTorq 125 is extremely popular for Goa rentals due to its sporty styling and Instagram appeal.' },
          { q: 'What is the difference between NTorq and standard scooters?', a: 'NTorq is quicker (0–60 km/h in ~8 seconds), has Bluetooth connectivity, and sports-specific Street/Sport modes.' },
          { q: 'What documents are needed?', a: 'Valid driving licence, government ID, and ₹1,000–₹1,500 refundable deposit.' },
        ],
      },
    },
  },
};

const MAKE_SLUGS = Object.keys(BIKE_MAKES);

const TOP_CITIES = [
  { name: 'Goa', slug: 'goa' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Manali', slug: 'manali' },
  { name: 'Leh', slug: 'leh' },
  { name: 'Rishikesh', slug: 'rishikesh' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Ooty', slug: 'ooty' },
  { name: 'Coorg', slug: 'coorg' },
];

export function generateStaticParams() {
  const params: { location: string; sublocation: string; model: string }[] = [];
  for (const [makeSlug, makeData] of Object.entries(BIKE_MAKES)) {
    for (const modelSlug of Object.keys(makeData.models)) {
      for (const city of TOP_CITIES) {
        params.push({ location: city.slug, sublocation: makeSlug, model: modelSlug });
      }
    }
  }
  return params;
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const makeData = BIKE_MAKES[params.sublocation];
  const modelData = makeData?.models[params.model];
  if (!makeData || !modelData) return { title: 'Bike Rental | TransRentals' };

  const cityName = getCityNameFromSlug(params.location);
  const title = `${makeData.name} ${modelData.name} on Rent in ${cityName} | ₹${modelData.pricePerDay}/Day | TransRentals`;
  const description = `Rent ${makeData.name} ${modelData.name} in ${cityName}. ${modelData.category} bike rental starting ₹${modelData.pricePerDay}/day. Helmet included. Book on TransRentals.`;

  return {
    title,
    description,
    alternates: { canonical: `https://transrentals.in/bike-on-rent/${params.location}/${params.sublocation}/${params.model}` },
    keywords: [
      `${makeData.name} ${modelData.name} on rent in ${cityName}`,
      `rent ${makeData.name.toLowerCase()} ${modelData.name.toLowerCase()} ${cityName.toLowerCase()}`,
      `${makeData.name.toLowerCase()} ${modelData.name.toLowerCase()} rental`,
      `bike on rent ${cityName.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://transrentals.in/bike-on-rent/${params.location}/${params.sublocation}/${params.model}`,
      images: [{ url: `https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(cityName)}`, width: 1200, height: 630 }],
      locale: 'en_IN',
      siteName: 'TransRentals',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://transrentals.in/api/og?service=bike-on-rent&location=${encodeURIComponent(cityName)}`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  };
}

export default function BikeModelPage({ params }: PageProps) {
  const makeData = BIKE_MAKES[params.sublocation];
  const modelData = makeData?.models[params.model];
  if (!makeData || !modelData) notFound();

  const cityName = getCityNameFromSlug(params.location);
  const otherModels = Object.entries(makeData.models).filter(([slug]) => slug !== params.model);
  const otherMakes = MAKE_SLUGS.filter((m) => m !== params.sublocation);
  const otherCities = TOP_CITIES.filter((c) => c.slug !== params.location).slice(0, 10);

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600 flex flex-wrap items-center gap-1" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span>/</span>
            <a href="/bike-on-rent" className="hover:text-primary">Bike on Rent</a>
            <span>/</span>
            <a href={`/bike-on-rent/${params.location}`} className="hover:text-primary">{cityName}</a>
            <span>/</span>
            <a href={`/bike-on-rent/${params.location}/${params.sublocation}`} className="hover:text-primary">{makeData.name}</a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{modelData.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="container-custom max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            🏍️ {makeData.name} {modelData.name} · {cityName}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Rent {makeData.name} {modelData.name} in {cityName}
          </h1>
          <p className="text-lg text-gray-600 mb-4">{modelData.category} · {modelData.engine} · {modelData.power}</p>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-blue-600">₹{modelData.pricePerDay}</span>
            <span className="text-gray-500">/day (helmet included)</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {modelData.bestFor.map((use) => (
              <span key={use} className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium px-3 py-1 rounded-full">{use}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href={`/bike-on-rent/${params.location}`} className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-700 transition-colors">
              All Bikes in {cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* Specs + Highlights */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bike Specifications</h2>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                {[
                  { label: 'Make & Model', value: `${makeData.name} ${modelData.name}` },
                  { label: 'Category', value: modelData.type },
                  { label: 'Engine', value: modelData.engine },
                  { label: 'Power', value: modelData.power },
                  { label: 'Mileage', value: modelData.mileage },
                  { label: 'Rental Price', value: `₹${modelData.pricePerDay}/day` },
                ].map((spec, i) => (
                  <div key={i} className={`flex justify-between items-center px-5 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <span className="text-sm text-gray-500 font-medium">{spec.label}</span>
                    <span className="text-sm font-bold text-gray-900 text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Features</h2>
              <div className="space-y-3">
                {modelData.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-3 bg-blue-50 rounded-lg px-4 py-3">
                    <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm font-medium text-gray-800">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-5">What&apos;s Included</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🪖', label: 'Helmet', note: 'Full-face / half-face' },
              { icon: '🔑', label: 'Keys & Docs', note: 'Registration & insurance' },
              { icon: '🔧', label: 'Basic Toolkit', note: 'Minor roadside issues' },
              { icon: '📞', label: '24/7 Support', note: 'Customer helpline' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            FAQs — {makeData.name} {modelData.name} Rental in {cityName}
          </h2>
          <div className="space-y-3">
            {modelData.faqs.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 group">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other models from same make in this city */}
      {otherModels.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-100">
          <div className="container-custom max-w-4xl">
            <h2 className="text-base font-bold text-gray-800 mb-4">Other {makeData.name} Bikes on Rent in {cityName}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/bike-on-rent/${params.location}/${params.sublocation}`} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                ← All {makeData.name} in {cityName}
              </Link>
              {otherModels.map(([modelSlug, model]) => (
                <Link key={modelSlug} href={`/bike-on-rent/${params.location}/${params.sublocation}/${modelSlug}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-700 transition-colors">
                  {makeData.name} {model.name} — ₹{model.pricePerDay}/day
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other makes in same city */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-base font-bold text-gray-800 mb-4">Other Bike Brands on Rent in {cityName}</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/bike-on-rent/${params.location}`} className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              ← All Bikes in {cityName}
            </Link>
            {otherMakes.map((makeSlug) => (
              <Link key={makeSlug} href={`/bike-on-rent/${params.location}/${makeSlug}`} className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-700 transition-colors">
                {BIKE_MAKES[makeSlug].name} Bikes
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Same model in other cities */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container-custom max-w-4xl">
          <h2 className="text-base font-bold text-gray-800 mb-4">{makeData.name} {modelData.name} on Rent in Other Cities</h2>
          <div className="flex flex-wrap gap-3">
            {otherCities.map((city) => (
              <Link key={city.slug} href={`/bike-on-rent/${city.slug}/${params.sublocation}/${params.model}`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-700 transition-colors">
                {modelData.name} in {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${makeData.name} ${modelData.name} Rental in ${cityName}`,
        description: `Rent ${makeData.name} ${modelData.name} in ${cityName}. ${modelData.category} bike starting ₹${modelData.pricePerDay}/day with helmet included.`,
        brand: { '@type': 'Brand', name: makeData.name },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: modelData.pricePerDay,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
        },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
          { '@type': 'ListItem', position: 2, name: 'Bike on Rent', item: 'https://transrentals.in/bike-on-rent' },
          { '@type': 'ListItem', position: 3, name: `Bike Rental in ${cityName}`, item: `https://transrentals.in/bike-on-rent/${params.location}` },
          { '@type': 'ListItem', position: 4, name: `${makeData.name} in ${cityName}`, item: `https://transrentals.in/bike-on-rent/${params.location}/${params.sublocation}` },
          { '@type': 'ListItem', position: 5, name: `${makeData.name} ${modelData.name} in ${cityName}`, item: `https://transrentals.in/bike-on-rent/${params.location}/${params.sublocation}/${params.model}` },
        ],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: modelData.faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      })}} />
    </div>
  );
}
