import { CITY_SEO, STATE_SEO } from '@/data/city-seo-content';
import { MapPin, Clock, Lightbulb, BarChart3 } from 'lucide-react';

const SERVICE_FALLBACK_INTROS: Record<string, (city: string) => string> = {
  'packers-and-movers': (city) => `Looking for reliable packers and movers in ${city}? TransRentals connects you with verified, GST-registered moving companies across ${city}. Whether you're shifting locally within ${city} or relocating to another city, our listed movers offer professional packing, safe transport, and door-to-door delivery. All vendors are pre-verified with valid licenses and customer reviews. Get free quotes from multiple vendors and compare before booking.`,
  'transporter': (city) => `Need truck rental or goods transport in ${city}? TransRentals lists verified transporters in ${city} offering Tata Ace (1-tonne) to 40-ft container trucks for local and intercity freight movement. GPS-tracked vehicles, professional drivers, and full-load or part-load options available. Get instant quotes for your cargo requirements in ${city}.`,
  'tempo-traveller': (city) => `Rent a Tempo Traveller in ${city} for group travel, pilgrimages, weddings, and corporate outings. TransRentals offers 12-seater, 17-seater, and 20-seater AC Tempo Travellers with experienced drivers across ${city}. All vehicles are verified and regularly serviced. Book by the day or for multi-day outstation trips from ${city}.`,
  'bus-rental': (city) => `Hire a bus or mini bus in ${city} for weddings, corporate events, school trips, and pilgrimages. TransRentals offers 20-seater to 50-seater AC and non-AC buses with verified operators across ${city}. Compare quotes from multiple vendors and book the right vehicle for your group size and route.`,
  'equipment-rental': (city) => `Rent construction and event equipment in ${city} from TransRentals-verified vendors. Available equipment includes JCB backhoe loaders, excavators, cranes, generators, road rollers, and DJ systems — all with certified operators. Get free quotes for your project requirements in ${city}.`,
  'jcb-on-rent': (city) => `Hire a JCB backhoe loader or excavator in ${city} for construction, excavation, road repair, and pipeline work. TransRentals connects you with verified vendors in ${city} offering well-maintained machines with certified operators. Standard 8-hour shifts and extended bookings available — get a free quote today.`,
  'mini-truck-rental': (city) => `Rent a Tata Ace or mini truck in ${city} for local deliveries, house shifting, and goods transport. TransRentals-listed vendors in ${city} offer driver-included mini trucks by the hour or full day. Suitable for narrow lanes, market deliveries, shop restocking, and 1-room house shifting.`,
  'crane-on-rent': (city) => `Hire a crane in ${city} for construction, industrial lifting, and infrastructure projects. TransRentals connects you with verified crane rental vendors in ${city} offering hydraulic cranes, tower cranes, and pick-and-carry cranes with certified operators. Get quotes for your specific project in ${city}.`,
  'car-rental': (city) => `Book a rental car in ${city} with TransRentals — chauffeur-driven and self-drive options available. Choose from hatchbacks, sedans, and SUVs for local city travel, outstation trips, and airport transfers in ${city}. All vehicles are verified and drivers are background-checked.`,
  'bike-on-rent': (city) => `Rent a bike or scooter in ${city} for daily commuting, weekend rides, and city exploration. TransRentals offers Honda Activa, Royal Enfield, Pulsar, and more from verified vendors in ${city}. Hourly, daily, weekly, and monthly rental plans available — helmet included.`,
  'self-drive-car-rentals': (city) => `Rent a self-drive car in ${city} and explore on your own terms — no driver, full freedom. TransRentals lists verified self-drive vendors in ${city} offering hatchbacks, sedans, and SUVs with daily, weekly, and monthly plans. A valid driving licence (minimum 1 year old), ID proof, and refundable security deposit are required. Fuel is typically on a self-fill basis. Outstation travel is permitted on most bookings — confirm with the vendor before departure.`,
};

const SERVICE_FALLBACK_TIPS: Record<string, string[]> = {
  'packers-and-movers': [
    'Book at least 5–7 days in advance for month-end dates — demand peaks between the 28th and 2nd.',
    'Always get quotes from at least 3 vendors and compare inclusions, not just price.',
    'Opt for transit insurance for electronics, appliances, and high-value items — it costs only 0.5–1% of goods value.',
    'Prepare an inventory list before the movers arrive — it protects you if any item is missing post-move.',
    'Confirm whether furniture dismantling and reassembly is included in the quoted price.',
  ],
  'transporter': [
    'For intercity freight, always confirm whether the quote is for full-truck-load (FTL) or part-load (LTL).',
    'GPS tracking is available with most TransRentals-listed transporters — ask for live tracking link.',
    'For fragile or high-value goods, request a dedicated vehicle to avoid multiple handling.',
    'Book at least 24–48 hours in advance for large trucks; same-day availability exists for mini trucks.',
  ],
  'tempo-traveller': [
    'For outstation trips, confirm whether the rate includes driver allowance and night charges.',
    'Book AC Tempo Travellers for summer trips — hill stations like Manali and Ooty see high demand.',
    'For pilgrimages, book 1–2 weeks in advance during peak season (Oct–March).',
    'Confirm the exact seating capacity — a 17-seater can comfortably carry 15 passengers with luggage.',
  ],
  'bus-rental': [
    'For weddings, book the bus at least 3–4 weeks in advance — premium dates fill quickly.',
    'Always confirm AC status, seating arrangement, and luggage space before finalising.',
    'For school trips and corporate outings, request a vehicle fitness certificate from the operator.',
  ],
  'equipment-rental': [
    'Always confirm whether fuel is included or to be arranged separately at the site.',
    'For construction projects, book equipment 48–72 hours in advance; during peak season book 5–7 days ahead.',
    'Confirm the number of working hours per day included in the quoted rate — standard is 8 hours.',
  ],
  'jcb-on-rent': [
    'Provide clear site access and all necessary permissions before the machine arrives.',
    'Standard rental is 8 working hours — confirm overtime rates at booking time.',
    'Fuel is typically not included — arrange diesel supply at the site.',
  ],
  'mini-truck-rental': [
    'For house shifting, book the mini truck early in the morning to avoid traffic delays in narrow lanes.',
    'Confirm load capacity — Tata Ace handles up to 750 kg; for heavier loads request a Tata 407.',
    'Hourly rentals are cost-effective for short deliveries — full-day booking is better for multiple stops.',
  ],
  'self-drive-car-rentals': [
    'Carry original DL (not photocopy) — most vendors require physical verification at pickup.',
    'Read the rental agreement for km limits — daily packages typically include 100–250 km; beyond that, per-km charges apply.',
    'Photograph the car thoroughly before leaving the lot — document any existing scratches or dents to avoid disputes at return.',
    'Keep the fuel level the same as at pickup — most vendors operate on a full-to-full fuel policy.',
    'Confirm outstation permissions before booking — some vendors restrict travel to within the city or specific states.',
  ],
};

const SERVICE_LABELS: Record<string, string> = {
  'car-rental': 'Car Rental',
  'bike-on-rent': 'Bike Rental',
  'bus-rental': 'Bus Rental',
  'packers-and-movers': 'Packers and Movers',
  'self-drive-car-rentals': 'Self-Drive Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
  'local-taxi': 'Local Taxi',
  'outstation-cab': 'Outstation Cab',
  'chauffeur-service': 'Chauffeur Service',
  'equipment-rental': 'Equipment Rental',
  'tempo-traveller': 'Tempo Traveller',
  'transporter': 'Truck Rental',
  'activa-on-rent': 'Activa Rental',
  'royal-enfield-on-rent': 'Royal Enfield Rental',
  'innova-on-rent': 'Innova Rental',
  'fortuner-on-rent': 'Fortuner Rental',
  'corporate-car-rental': 'Corporate Car Rental',
  'corporate-bus-rental': 'Corporate Bus Rental',
  'wedding-car-rental': 'Wedding Car Rental',
  'wedding-bus-rental': 'Wedding Bus Rental',
  'monthly-car-rental': 'Monthly Car Rental',
  'monthly-bike-rental': 'Monthly Bike Rental',
  'hourly-car-rental': 'Hourly Car Rental',
};

interface Props {
  citySlug: string;
  serviceSlug: string;
  cityName: string;
  stateCode?: string;
}

export function CityContentSection({ citySlug, serviceSlug, cityName, stateCode }: Props) {
  const cityData = CITY_SEO[citySlug];
  const stateData = stateCode ? STATE_SEO[stateCode] : null;

  if (!cityData && !stateData) return null;

  const serviceLabel = SERVICE_LABELS[serviceSlug] || 'Vehicle Rental';

  const intro =
    cityData?.serviceIntros?.[serviceSlug] ||
    cityData?.intro ||
    stateData?.intro ||
    SERVICE_FALLBACK_INTROS[serviceSlug]?.(cityName);

  if (!intro) return null;

  const faqs = cityData?.serviceFAQs?.[serviceSlug] || null;
  const routes = cityData?.routes || null;
  const tips = cityData?.tips || stateData?.tips || SERVICE_FALLBACK_TIPS[serviceSlug] || null;
  const stats = cityData?.stats || null;

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container-custom max-w-4xl">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {serviceLabel} in {cityName} — Complete Guide
          </h2>
          <p className="text-gray-600 leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-10">

          {routes && routes.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Popular {serviceLabel} Routes from {cityName}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {routes.map((route) => (
                  <div
                    key={route.to}
                    className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cityName} → {route.to}
                      </p>
                      {route.via && (
                        <p className="text-xs text-gray-500 mt-0.5">via {route.via}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-medium text-primary">{route.distance}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3" />
                        {route.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs && faqs.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {serviceLabel} in {cityName} — Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details key={i} className="bg-gray-50 rounded-lg border border-gray-100">
                    <summary className="px-4 py-3 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                      {faq.q}
                    </summary>
                    <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {tips && tips.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Tips for {serviceLabel} in {cityName}
              </h3>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <span className="mt-1 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                {cityName} at a Glance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Population</p>
                  <p className="text-gray-900 font-semibold">{stats.population}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Known For</p>
                  <p className="text-gray-900 font-semibold text-sm">{stats.knownFor}</p>
                </div>
                <div className="bg-amber-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Nearest Airport</p>
                  <p className="text-gray-900 font-semibold text-sm">{stats.airport}</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
