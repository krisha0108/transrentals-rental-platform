import { Metadata } from 'next';
import {
  CheckCircle2, GraduationCap, Star, Map as MapIcon, MessageSquare, ShieldCheck, Smartphone, Shirt,
  Briefcase, Heart, PartyPopper, Plane, Stethoscope, Users, Clock,
  MessageCircleQuestion, Plus,
} from 'lucide-react';
import { HowToSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo/schemas';
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId } from '@/lib/db/build-cache';
import { ChauffeurPackages } from '@/components/chauffeur-service/ChauffeurPackages';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';

const WHY_CHAUFFEUR = [
  { icon: CheckCircle2, anim: 'pulse', title: 'Verified Drivers', desc: 'Police verification done' },
  { icon: GraduationCap, anim: 'lift', title: 'Trained & Licensed', desc: 'Professional training' },
  { icon: Star, anim: 'tick', title: 'Experienced', desc: '5+ years experience' },
  { icon: MapIcon, anim: 'drive', title: 'Know All Routes', desc: 'Local & highway expert' },
  { icon: Shirt, anim: 'pulse', title: 'Professional Attire', desc: 'Well-groomed drivers' },
  { icon: MessageSquare, anim: 'wrench', title: 'Good Communication', desc: 'Hindi, English speaking' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Fully Insured', desc: 'Covered for safety' },
  { icon: Smartphone, anim: 'ring', title: 'Available on Demand', desc: '24/7 booking' },
];

const PERFECT_OCCASIONS = [
  { icon: Briefcase, anim: 'drive', occasion: 'Daily Commute', desc: 'Office, business trips' },
  { icon: MapIcon, anim: 'drive', occasion: 'Outstation Tours', desc: 'Hill stations, pilgrimages' },
  { icon: Heart, anim: 'pulse', occasion: 'Weddings', desc: 'Wedding car driver' },
  { icon: PartyPopper, anim: 'grow', occasion: 'Events', desc: 'Parties, celebrations' },
  { icon: Plane, anim: 'drive', occasion: 'Airport Transfers', desc: 'Pickup & drop service' },
  { icon: Stethoscope, anim: 'lift', occasion: 'Medical Needs', desc: 'Hospital visits, care' },
  { icon: Users, anim: 'pulse', occasion: 'Elderly Care', desc: 'Senior citizen assistance' },
  { icon: Clock, anim: 'tick', occasion: 'Temporary Need', desc: 'Short-term requirement' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
  ring: 'group-hover:rotate-12',
  lift: 'group-hover:-translate-y-2',
  grow: 'group-hover:-translate-y-1.5 group-hover:scale-110',
};

export const metadata: Metadata = {
  title: 'Chauffeur Service | Driver on Hire @₹599/Day | Professional Car Driver',
  description: 'Hire professional chauffeur for your car. Driver on hire for outstation, daily use. Experienced car drivers. Personal driver service @₹599/day.',
  keywords: [
    'chauffeur service',
    'driver on hire',
    'chauffeur booking',
    'professional driver',
    'car driver service',
    'personal driver',
    'driver for outstation',
    'car driver hire',
    'chauffeur for car',
    'driver booking',
    'temporary driver',
    'driver on rent',
  ],
  openGraph: {
    title: 'Chauffeur Service India | Driver on Hire @₹599/Day | TransRentals',
    description: 'Book professional chauffeur for your car. Experienced drivers for daily use, outstation trips, events.',
  },
};

export default async function ChauffeurServicePage() {
  const carRentalServiceId = await getCarRentalServiceId();
  const localPackages = carRentalServiceId ? await prisma.chauffeur_local_packages.findMany({
    where: {
      isActive: true,
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
    if (!existing) packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    else existing.vehicles.push(pkg);
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'Chauffeur Service', url: 'https://transrentals.in/chauffeur-service' },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Chauffeur Service India',
          description: 'Hire professional chauffeur for your car. Experienced, verified drivers for outstation, daily use, events.',
          url: 'https://transrentals.in/chauffeur-service',
          serviceType: 'Chauffeur Service',
          provider: { '@type': 'Organization', name: 'TransRentals', url: 'https://transrentals.in' },
          areaServed: { '@type': 'Country', name: 'India' },
          offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: 599, highPrice: 2500, offerCount: 30 },
        }) }}
      />
      <HowToSchema
        name="How to Hire a Chauffeur on TransRentals"
        description="Book a professional driver for your car in simple steps."
        totalTime="PT5M"
        steps={[
          { name: 'Select Service Type', text: 'Choose from local packages (4hr/8hr), outstation, or monthly driver hire.' },
          { name: 'Pick Your City & Date', text: 'Enter your pickup city and start date. Chauffeur available 24/7 across 150+ cities.' },
          { name: 'Choose Vehicle Category', text: 'Hatchback, Sedan, or SUV driver — pick based on your car type.' },
          { name: 'Confirm & Driver Arrives', text: 'Pay online and receive driver details. Professional chauffeur arrives at your doorstep.' },
        ]}
      />
      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city=""
        citySlug=""
        serviceSlug="car-rental"
        serviceTitle="Chauffeur Service"
      />

      {/* Why Chauffeur Service */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
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
              Why Choose Our <span className="text-emerald-600">Chauffeur Service?</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHY_CHAUFFEUR.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-7 text-center overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
                style={{ animation: `chf-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <item.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes chf-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { [style*="chf-rise"] { animation: none !important; opacity: 1 !important; } }
        ` }} />
      </section>

      <StaticServicePopularCitiesGrid serviceSlug="chauffeur-service" title="Chauffeur Service in Available Cities" />

      {hourGroups.length > 0 && (
        <ChauffeurPackages
          hourGroups={hourGroups}
          outstationPricing={[]}
          locationName="India"
        />
      )}

      {/* Perfect Occasions */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Perfect for <span className="text-emerald-600">Every Need</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PERFECT_OCCASIONS.map((item, idx) => (
              <div
                key={item.occasion}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animation: `chf-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 80}ms forwards`, opacity: 0 }}
              >
                <span className="inline-flex w-12 h-12 rounded-xl bg-emerald-50 items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-emerald-600">
                  <item.icon
                    className={`w-6 h-6 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[item.anim]}`}
                  />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1.5">{item.occasion}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Qualities */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Chauffeur Qualities
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-indigo-900">Professional Skills</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>5+ years driving experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Valid driving license (LMV/HMV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Expert in all car types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Know local & highway routes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Safe & defensive driving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Traffic rules knowledge</span>
                </li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-purple-900">Personal Qualities</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Police verification done</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Well-groomed & professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Punctual & reliable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Good communication skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Courteous & respectful</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Trustworthy & honest</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Hire a Chauffeur
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Daily, outstation, or monthly' },
              { step: '2', title: 'Provide Details', desc: 'Car type, location, duration' },
              { step: '3', title: 'Verify Driver', desc: 'Check driver profile & documents' },
              { step: '4', title: 'Confirm Booking', desc: 'Pay advance & confirm' },
              { step: '5', title: 'Driver Arrives', desc: 'Professional chauffeur at your service' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
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
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Chauffeur Service <span className="text-emerald-600">FAQs</span>
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-3">
            {[
              {
                q: 'How much does a chauffeur service cost?',
                a: 'Chauffeur service starts from ₹599 per day for 8-10 hours local driving. Outstation drivers cost ₹800-1200/day. Monthly contract starts from ₹15,000.',
              },
              {
                q: 'Are your chauffeurs verified?',
                a: 'Yes! All our chauffeurs are police verified, have valid driving licenses, and go through thorough background checks. We ensure safety and reliability.',
              },
              {
                q: 'Can I hire a chauffeur for outstation trips?',
                a: 'Yes, we provide chauffeurs for outstation trips. Charges are ₹800-1200/day plus driver allowance (bata) and accommodation if overnight stay required.',
              },
              {
                q: 'What is included in monthly chauffeur package?',
                a: 'Monthly package includes driver for 26 days, 8-10 hours per day. Suitable for families or businesses with regular driving needs. Cost: ₹15,000-25,000/month.',
              },
              {
                q: 'Can I get a driver for my luxury car?',
                a: 'Yes! We provide specially trained chauffeurs for luxury cars like BMW, Mercedes, Audi. They are experienced in handling premium vehicles. Cost: ₹1200-2000/day.',
              },
              {
                q: 'How quickly can I get a chauffeur?',
                a: 'For local bookings, we can provide a chauffeur within 2-4 hours. For outstation or special requirements, we recommend booking 24 hours in advance.',
              },
            ].map((faq, idx) => (
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
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
