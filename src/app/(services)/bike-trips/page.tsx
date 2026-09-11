import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTripsHero } from '@/components/bike-trips/BikeTripsHero';
import { HowToSchema } from '@/components/seo/schemas';
import { Bike, Repeat, ShieldCheck, Shirt, Wrench, Phone, FileCheck2, Wallet, Mountain, Landmark, Palmtree, Calendar, Gauge, Clock, ArrowRight, Lock } from 'lucide-react';

const WHY_US = [
  { icon: Bike, anim: 'drive', title: 'Adventure-Ready Bikes', desc: 'Royal Enfield Himalayan, Classic 350 - proven for tough terrains' },
  { icon: Repeat, anim: 'tick', title: 'One-Way Drops', desc: 'Pick up in Delhi, drop in Leh (or any combination)' },
  { icon: ShieldCheck, anim: 'pulse', title: 'Full Insurance', desc: 'Comprehensive coverage for peace of mind' },
  { icon: Shirt, anim: 'wrench', title: 'Riding Gear', desc: 'Jackets, gloves, knee guards available' },
  { icon: Wrench, anim: 'wrench', title: 'Maintained Bikes', desc: 'Serviced before every trip, tool kit included' },
  { icon: Phone, anim: 'pulse', title: '24/7 Support', desc: 'Emergency support network across routes' },
  { icon: FileCheck2, anim: 'lift', title: 'Permit Help', desc: 'Assistance with Inner Line Permits' },
  { icon: Wallet, anim: 'lift', title: 'Best Rates', desc: 'Long-term discounts, no hidden charges' },
];

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  lift: 'group-hover:-translate-y-2',
  wrench: 'group-hover:rotate-45',
};

/* Trip cards ka fade-in-on-load — wahi language jo Excavator/Truck Types me hai. */
const TRIP_CSS = `
.trip-card {
  opacity: 0;
  animation: trip-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes trip-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .trip-card { opacity: 1; animation: none; }
}
`;

export const metadata: Metadata = {
  title: 'Bike Trip Rentals India | Ladakh, Spiti, Rajasthan Tours',
  description: 'Rent bikes for road trips across India. Ladakh, Spiti Valley, Rajasthan, Goa bike tours. Royal Enfield, Himalayan available. One-way drops, gear included.',
  keywords: [
    'bike trip rental india',
    'motorcycle tour rental',
    'ladakh bike trip',
    'spiti valley bike rental',
    'rajasthan bike tour',
    'road trip bike rental',
    'touring bike rental',
  ],
  openGraph: {
    title: 'Bike Trip Rentals India | Adventure Motorcycle Tours | TransRentals',
    description: 'Rent bikes for road trips. Ladakh, Spiti, Rajasthan tours. Royal Enfield available.',
    type: 'website',
    url: 'https://transrentals.in/bike-trips',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-trips',
  },
};

export default function BikeTripsPage() {
  const trips = [
    {
      name: 'Ladakh Bike Trip',
      slug: 'ladakh',
      icon: Mountain,
      anim: 'lift',
      description: 'Conquer Khardung La, explore Pangong Lake, ride through Nubra Valley',
      duration: '7-15 days',
      bestTime: 'May - September',
      difficulty: 'Challenging',
      highlights: ['Khardung La', 'Pangong Lake', 'Nubra Valley', 'Magnetic Hill'],
    },
    {
      name: 'Spiti Valley Tour',
      slug: 'spiti-valley',
      icon: Mountain,
      anim: 'lift',
      description: 'Explore the cold desert, ancient monasteries, and stunning landscapes',
      duration: '8-12 days',
      bestTime: 'June - October',
      difficulty: 'Challenging',
      highlights: ['Kunzum Pass', 'Key Monastery', 'Chandratal Lake', 'Kaza'],
      comingSoon: true,
    },
    {
      name: 'Rajasthan Heritage Ride',
      slug: 'rajasthan',
      icon: Landmark,
      anim: 'pulse',
      description: 'Ride through royal palaces, desert dunes, and vibrant cities',
      duration: '7-10 days',
      bestTime: 'October - March',
      difficulty: 'Moderate',
      highlights: ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Udaipur'],
      comingSoon: true,
    },
    {
      name: 'Goa Coastal Ride',
      slug: 'goa',
      icon: Palmtree,
      anim: 'drive',
      description: 'Beach hopping, coastal roads, and vibrant nightlife',
      duration: '3-5 days',
      bestTime: 'November - March',
      difficulty: 'Easy',
      highlights: ['Beach Roads', 'Old Goa', 'Dudhsagar Falls', 'Coastal Views'],
      comingSoon: true,
    },
  ];

  return (
    <>
      <HowToSchema
        name="How to Book a Bike Trip on TransRentals"
        description="Plan and book a self-guided bike road trip in 4 simple steps."
        totalTime="PT12M"
        steps={[
          { name: 'Choose Your Destination', text: 'Select from Ladakh, Spiti Valley, Rajasthan, or Goa bike trip routes. Check road conditions and best travel season.' },
          { name: 'Select Bike & Duration', text: 'Choose Royal Enfield Classic 350 or Himalayan based on the terrain. Select trip duration from 3 to 15 days.' },
          { name: 'Book Bike & Add-ons', text: 'Submit DL and Aadhaar. Pay advance to book bike. Add panniers, crash guard, USB charger if needed.' },
          { name: 'Pick Up & Ride Free', text: 'Collect bike at pickup city. Get route guidance and emergency contacts. Ride at your own pace.' },
        ]}
      />
      <BikeTripsHero />

      {/* Trips Grid */}
      <section id="trips" className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: TRIP_CSS }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
              Popular Bike Trip Destinations
            </h2>
            <p className="text-gray-500">Guided and self-ride routes across India&apos;s best motorcycling terrain</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {trips.map((trip, idx) => (
              <div
                key={trip.slug}
                className="trip-card group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                {trip.comingSoon && (
                  <span className="absolute top-5 right-5 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border border-amber-200">
                    Coming Soon
                  </span>
                )}

                <div className="p-6 pb-0">
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                    <trip.icon
                      className={`w-7 h-7 text-emerald-600 group-hover:text-white transition-all duration-500 ${ICON_HOVER_ANIM[trip.anim]}`}
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="text-[19px] font-bold text-gray-900 mb-1.5">{trip.name}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed mb-4">{trip.description}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 pb-4 border-b border-gray-100">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {trip.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {trip.bestTime}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                      {trip.difficulty}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {trip.highlights.map((h) => (
                      <span key={h} className="text-[11.5px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto p-6 pt-0">
                  {trip.comingSoon ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
                      <Lock className="w-3.5 h-3.5" />
                      Opening Soon
                    </span>
                  ) : (
                    <Link
                      href={`/bike-trips/${trip.slug}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
                    >
                      Explore &amp; Book
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
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
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-12">
            Why Rent with <span className="text-emerald-600">TransRentals</span> for Bike Trips?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {WHY_US.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-6 text-center overflow-hidden"
              >
                <div className="relative w-14 h-14 mx-auto mb-3">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 rotate-[18deg] group-hover:rotate-[198deg] transition-transform duration-700" />
                  <span className="absolute inset-[5px] rounded-full bg-emerald-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-600">
                    <f.icon
                      className={`w-5 h-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER_ANIM[f.anim]}`}
                    />
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 py-20 text-white">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes cta-shine {
            0%, 25%  { transform: translateX(-150%); }
            65%, 100% { transform: translateX(150%); }
          }
          .cta-btn { position: relative; overflow: hidden; z-index: 0; }
          .cta-shine {
            position: absolute;
            top: -20%;
            left: 0;
            width: 45%;
            height: 140%;
            background: linear-gradient(105deg, transparent 0%, rgba(5,150,105,.55) 50%, transparent 100%);
            transform: translateX(-150%);
            animation: cta-shine 2.2s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
          }
          @media (prefers-reduced-motion: reduce) {
            .cta-shine { animation: none; display: none; }
          }
        ` }} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="container-custom relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase mb-5">
            Ready When You Are
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-lg text-emerald-50/90 mb-9 max-w-2xl mx-auto">Start with Ladakh — the ultimate bike trip destination</p>
          <Link
            href="/bike-trips/ladakh"
            className="cta-btn group inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-colors"
          >
            <span aria-hidden className="cta-shine" />
            Plan Ladakh Trip
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
