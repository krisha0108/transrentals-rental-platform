import { Metadata } from 'next';
import {
  Wallet, Clock, Car, UserCheck, Snowflake, Smartphone, ShieldCheck, LifeBuoy,
  ShoppingBag, Camera, Briefcase, Cross, Users, Plane, ClipboardList, PartyPopper,
  MessageCircleQuestion, Plus, CheckCircle2, Sparkles,
} from 'lucide-react';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId } from '@/lib/db/build-cache';
import { LocalTaxiPackages } from '@/components/local-taxi/LocalTaxiPackages';
import { HowToSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Local Taxi | Hourly Cab @₹399 | 4 Hour 8 Hour Taxi Package India',
  description: 'Book local taxi for hourly rental. 4 hour, 8 hour, 12 hour packages. City cab service, local car rental. AC sedan, SUV. Affordable hourly taxi @₹399.',
  keywords: [
    'local taxi',
    'hourly taxi',
    'local cab service',
    'taxi for 4 hours',
    '8 hour taxi package',
    'city taxi',
    'local car rental',
    'hourly cab',
    'local taxi service',
    'city cab booking',
    'hourly car rental',
    'half day taxi',
  ],
  openGraph: {
    title: 'Local Taxi India | Hourly Cab @₹399 | 4-8 Hour Package',
    description: 'Book local taxi for city travel. Hourly packages starting @₹399. AC cars available.',
  },
};

const WHY_CHOOSE = [
  { icon: Wallet, anim: 'lift', title: 'Affordable', desc: 'Starting @₹399 for 4 hours' },
  { icon: Clock, anim: 'tick', title: 'Time-Based', desc: 'Pay only for hours used' },
  { icon: Car, anim: 'drive', title: 'Multiple Stops', desc: 'Visit multiple locations' },
  { icon: UserCheck, anim: 'lift', title: 'Local Drivers', desc: 'Know city routes well' },
  { icon: Snowflake, anim: 'pulse', title: 'AC Comfort', desc: 'Air-conditioned vehicles' },
  { icon: Smartphone, anim: 'pulse', title: 'Easy Booking', desc: 'Book in 2 minutes' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Safe & Secure', desc: 'Fully insured vehicles' },
  { icon: LifeBuoy, anim: 'ring', title: '24/7 Available', desc: 'Round the clock service' },
];

const OCCASIONS = [
  { icon: ShoppingBag, anim: 'pulse', occasion: 'Shopping', desc: 'Mall hopping, markets' },
  { icon: Camera, anim: 'tick', occasion: 'Sightseeing', desc: 'City tours, monuments' },
  { icon: Briefcase, anim: 'drive', occasion: 'Business Meetings', desc: 'Multiple office visits' },
  { icon: Cross, anim: 'pulse', occasion: 'Hospital Visits', desc: 'Medical appointments' },
  { icon: Users, anim: 'lift', occasion: 'Family Outings', desc: 'Restaurants, parks' },
  { icon: Plane, anim: 'drive', occasion: 'Airport Drop/Pick', desc: 'Airport transfers' },
  { icon: ClipboardList, anim: 'wrench', occasion: 'Running Errands', desc: 'Bank, post office, etc' },
  { icon: PartyPopper, anim: 'grow', occasion: 'Party/Events', desc: 'Attend functions' },
];

const LOCAL_TAXI_FAQS = [
  { q: 'How much does local taxi cost?', a: 'Local taxi starts from ₹399 for 4 hours/40km in sedan. 8 hour package costs ₹799. SUV costs around ₹599 for 4 hours. Extra charges: ₹10/km and ₹100/hour.' },
  { q: 'What is included in local taxi package?', a: 'Package includes driver, fuel, AC car, GST, and insurance. You can make multiple stops within city limits during the booked hours and kilometers.' },
  { q: 'How many stops can I make in local taxi?', a: 'You can make unlimited stops within your booked hours and kilometers. Perfect for shopping, errands, or sightseeing with multiple destinations.' },
  { q: 'What if I exceed time or kilometer limit?', a: 'Extra charges apply: ₹10 per additional kilometer and ₹100 per additional hour. You can extend your booking if needed.' },
  { q: 'Can I book local taxi for half day?', a: 'Yes! Our 4-hour and 8-hour packages are perfect for half day usage. 4 hours is ideal for quick trips, 8 hours for extended city travel.' },
  { q: 'Is local taxi available at night?', a: 'Yes, local taxi is available 24/7. Night charges (11 PM - 6 AM) may apply. Book anytime for your convenience.' },
];

/* Wahi "Why Choose Us" dashed-ring card language jo excavator-on-rent
   "Excavator Applications" section me hai — dono grids (Why Choose +
   Occasions) isi pattern se banti hain, alag class-prefix ke saath. */
const LTX_CSS = `
.ltx-card {
  opacity: 0;
  animation: ltx-rise .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
}
@keyframes ltx-rise {
  from { opacity: 0; transform: translateY(22px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.ltx-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px -12px rgba(16,185,129,.28);
  border-color: rgb(167 243 208);
}
.ltx-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(16,185,129,.10) 50%, transparent 65%);
  transform: translateX(-100%);
  transition: transform .8s ease;
  pointer-events: none;
}
.ltx-card:hover .ltx-sheen { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .ltx-card { opacity: 1; animation: none; }
  .ltx-card:hover { transform: none; }
  .ltx-sheen { display: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  ring: 'group-hover:rotate-12',
  wrench: 'group-hover:rotate-45',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

export default async function LocalTaxiPage() {
  const carRentalServiceId = await getCarRentalServiceId();
  const localPackages = carRentalServiceId ? await prisma.chauffeur_local_packages.findMany({
    where: {
      isActive: true,
      isPopular: true,
      chauffeur_vehicle_categories: { serviceId: carRentalServiceId, isActive: true },
    },
    select: {
      id: true, hours: true, kms: true, basePrice: true,
      extraKmCharge: true, isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
      },
      locations: { select: { name: true } },
    },
    orderBy: [{ chauffeur_vehicle_categories: { displayOrder: 'asc' } }, { hours: 'asc' }],
  }) : [];

  const packagesWithLocation = localPackages.map((pkg) => ({
    ...pkg,
    locationName: (pkg.locations as { name: string } | null)?.name ?? null,
  }));

  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof packagesWithLocation }>();
  for (const pkg of packagesWithLocation) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) {
      packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    } else {
      existing.vehicles.push(pkg);
    }
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  return (
    <>
      <HowToSchema
        name="How to Book a Local Taxi on TransRentals"
        description="Book a local cab or hourly taxi in 4 simple steps."
        totalTime="PT5M"
        steps={[
          { name: 'Choose City & Package', text: 'Select your city and choose a package: 4 hours/40 km, 8 hours/80 km, or 12 hours/120 km.' },
          { name: 'Pick Car Type', text: 'Choose a hatchback, sedan, or SUV for your local travel needs. All AC cabs with experienced drivers.' },
          { name: 'Review Inclusions', text: 'Package includes driver, fuel for included kms. Extra km and extra hour charges apply beyond package limits.' },
          { name: 'Confirm & Use for Day', text: 'Pay advance to confirm. Driver reports at your location at the scheduled time for the full package duration.' },
        ]}
      />
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="local-taxi" />

      {/* Why Local Taxi */}
      <section className="ltx relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <style dangerouslySetInnerHTML={{ __html: LTX_CSS }} />
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
              Why Choose <span className="text-emerald-600">Local Taxi</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, idx) => (
              <div
                key={item.title}
                className="ltx-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="ltx-sheen" />
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
      <StaticServicePopularCitiesGrid serviceSlug="local-taxi" title="Local Taxi in Available Cities" />

      {hourGroups.length > 0 && (
        <LocalTaxiPackages hourGroups={hourGroups} locationName="India" />
      )}

      {/* Perfect Occasions */}
      <section className="ltx relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
              Perfect for <span className="text-emerald-600">Every Occasion</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
            {OCCASIONS.map((item, idx) => (
              <div
                key={item.occasion}
                className="ltx-card group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span aria-hidden className="ltx-sheen" />
                <div className="relative">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                    <span className="absolute inset-[6px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                      <item.icon
                        className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                      />
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 leading-snug">{item.occasion}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Amenities */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            Local Taxi <span className="text-emerald-600">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Package Includes</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Professional driver',
                  'Fuel charges included',
                  'AC car (Sedan/SUV)',
                  'Multiple pickup/drops',
                  'GST included',
                  'Full insurance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <h3 className="font-bold text-lg text-gray-900">Service Features</h3>
              </div>
              <ul className="space-y-2.5 text-gray-600 text-sm">
                {[
                  'Doorstep pickup',
                  'Clean & sanitized cars',
                  'Flexible timings',
                  'No waiting charges (within limit)',
                  '24/7 customer support',
                  'Easy online booking',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
            How Local Taxi <span className="text-emerald-600">Works</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose Package', desc: 'Select 4hr, 8hr, or 12hr package' },
              { step: '2', title: 'Select Car Type', desc: 'Choose Sedan or SUV' },
              { step: '3', title: 'Book Online', desc: 'Enter pickup location and time' },
              { step: '4', title: 'Driver Arrives', desc: 'Driver reaches your doorstep' },
              { step: '5', title: 'Multiple Stops', desc: 'Visit as many places within city' },
              { step: '6', title: 'Pay at End', desc: 'Pay package + extra charges if any' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-shrink-0 w-10 h-10">
                  <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                  <div className="relative w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
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
              Local Taxi <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {LOCAL_TAXI_FAQS.map((faq, idx) => (
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
