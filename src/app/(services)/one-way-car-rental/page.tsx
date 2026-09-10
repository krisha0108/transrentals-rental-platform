import { Metadata } from 'next';
import {
  Target, IndianRupee, Clock, Route, Car, Smartphone, Wrench, LifeBuoy,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { formatPriceHighlight } from '@/lib/utils';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: formatPriceHighlight('One Way Car Rental - Drop at Different City @₹1299 | TransRentals'),
  description: formatPriceHighlight('One-way car rental service across India. Rent a car and drop it at a different city. No return trip needed. Convenient one-way travel. Book online instantly.'),
  keywords: ['one way car rental', 'one way car hire', 'drop car different city', 'one way cab', 'intercity car rental', 'city to city car rental'],
  openGraph: {
    title: formatPriceHighlight('One Way Car Rental India - Starting @₹1299 | TransRentals'),
    description: formatPriceHighlight('Rent a car and drop it at a different city. No return trip required. One-way car rental across 250+ Indian cities.'),
  },
};

const WHY_CHOOSE = [
  { icon: Target, anim: 'pulse', title: 'Convenient', desc: 'Drop car at destination city' },
  { icon: IndianRupee, anim: 'lift', title: 'Cost Effective', desc: 'No empty return charges' },
  { icon: Clock, anim: 'tick', title: 'Time Saving', desc: 'No need to return to pickup city' },
  { icon: Route, anim: 'drive', title: 'Flexible Routes', desc: 'Travel your way, drop anywhere' },
  { icon: Car, anim: 'drive', title: 'All Car Types', desc: 'Hatchbacks to SUVs available' },
  { icon: Smartphone, anim: 'pulse', title: 'Easy Booking', desc: 'Book online in minutes' },
  { icon: Wrench, anim: 'wrench', title: 'Well Maintained', desc: 'Regular serviced vehicles' },
  { icon: LifeBuoy, anim: 'ring', title: '24/7 Support', desc: 'Round the clock assistance' },
];

const ONE_WAY_CAR_FAQS = [
  { q: 'What is one way car rental?', a: 'One way car rental allows you to pick up a car in one city and drop it off in another city. You don\'t need to return the car to the pickup location, making it perfect for one-way trips.' },
  { q: 'How much does one way car rental cost?', a: 'One way car rental starts from ₹1299 depending on the route, distance, and car type. Prices vary based on pickup and drop cities.' },
  { q: 'Do I have to pay return charges?', a: 'No, there are no return charges. You only pay for the one-way journey from your pickup city to drop city.' },
  { q: 'Is fuel included in the one way rental price?', a: 'Fuel charges are typically extra and based on actual consumption. Some packages may include a certain fuel limit.' },
  { q: 'Can I book one way car rental between any two cities?', a: 'Yes, we offer one way car rental service between most major cities in India. Some remote routes may have limited availability.' },
  { q: 'How do I book a one way car rental?', a: 'You can book online through our website or app. Select your pickup city, drop city, date, and choose your preferred car.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai. */
const OWCR_CSS = `
.owcr-card {
  opacity: 0;
  animation: owcr-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes owcr-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.owcr-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.owcr-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.owcr-card:hover .owcr-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .owcr-card { opacity: 1; animation: none; }
  .owcr-card:hover { transform: none; }
  .owcr-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
};

export default function OneWayCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book One-Way Car Rental on TransRentals"
        description="Rent a car for one-way intercity travel in 4 simple steps."
        totalTime="PT8M"
        steps={[
          { name: 'Enter Route Details', text: 'Enter pickup city, drop city, and travel date. One-way rentals available across 250+ city pairs.' },
          { name: 'Choose Car Category', text: 'Select from hatchback, sedan, SUV, or luxury car. All with experienced intercity drivers.' },
          { name: 'Review One-Way Fare', text: 'Pay only for the one-way journey. No return charge. Pricing includes driver allowance and fuel.' },
          { name: 'Confirm & Travel', text: 'Pay advance to confirm. Driver picks up from your location and drops at the destination city.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="one-way" />

      {/* Why One Way Car Rental */}
      <section className="owcr relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: OWCR_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Choose <span className="text-emerald-600">One Way Car Rental</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="owcr-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="owcr-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Grid */}
      <StaticServicePopularCitiesGrid serviceSlug="one-way-car-rental" title="One Way Car Rental in Available Cities" />

      {/* One Way Car Options */}
      {/* How It Works */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How One Way Car Rental Works
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Select Route', desc: 'Choose your pickup city and drop city for your one-way trip' },
              { step: '2', title: 'Choose Car', desc: 'Select from our wide range of cars based on your needs' },
              { step: '3', title: 'Book Online', desc: 'Book instantly on our website or app with basic details' },
              { step: '4', title: 'Pick Up Car', desc: 'Pick up the car from your starting city at scheduled time' },
              { step: '5', title: 'Drop at Destination', desc: 'Drive to your destination and drop the car there - no return needed' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-white p-6 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Details */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            One Way Car Rental Pricing
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="font-bold text-xl mb-6">What&apos;s Included</h3>
            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Base fare for one-way journey</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Driver charges included (if with driver)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>All tolls and permits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>No return trip charges</span>
              </li>
            </ul>
            <h3 className="font-bold text-xl mb-6">Additional Charges</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Fuel charges extra (actual consumption)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>State tax if applicable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>Driver night charges (if overnight stay)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              One Way Car Rental <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {ONE_WAY_CAR_FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.q}</h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
