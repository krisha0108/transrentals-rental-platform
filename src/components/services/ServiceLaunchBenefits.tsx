import { ShieldCheck, Bike, Truck, Headphones, FileCheck2, Check } from 'lucide-react';

/**
 * The "what you get once we're live here" grid, shown under
 * {@link ServiceExpandingHero} on a city with no partners onboarded yet.
 *
 * The page can't offer a booking, so it offers the next best thing: what the
 * service will actually be worth when it opens. Kept deliberately free of
 * rates — nothing here promises a number the city can't honour.
 */
export function ServiceLaunchBenefits({
  cityName,
  vehicleNoun = 'bike',
  selectionDesc = 'Scooters, cruisers, sports bikes — every type of two-wheeler, in one place.',
}: {
  cityName: string;
  /** Singular noun for the delivery line, e.g. "bike" or "scooter". */
  vehicleNoun?: string;
  /** Overrides the "Wide Selection" blurb for single-brand pages. */
  selectionDesc?: string;
}) {
  const items = [
    { Icon: ShieldCheck, title: 'Verified Partners',  desc: `Every rental partner in ${cityName} is background-checked before they go live.` },
    { Icon: Bike,        title: 'Wide Selection',     desc: selectionDesc },
    { Icon: Truck,       title: 'Doorstep Delivery',  desc: `Get your ${vehicleNoun} delivered right to your address in ${cityName}.` },
    { Icon: Headphones,  title: '24/7 Support',       desc: 'Round-the-clock roadside assistance and customer support.' },
    { Icon: FileCheck2,  title: 'Easy Booking',       desc: 'Book online in minutes — no long paperwork, no advance deposits.' },
    { Icon: Check,       title: 'Transparent Terms',  desc: 'What the partner offers is what you get — confirmed before pickup.' },
  ];

  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
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
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Why TransRentals
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="mt-4 text-2xl md:text-[1.75rem] md:leading-[1.2] font-black tracking-tight text-gray-900">
            What you get when we launch in <span className="text-emerald-600">{cityName}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-600">
                <item.Icon className="h-5 w-5 text-emerald-600 transition-colors group-hover:text-white" strokeWidth={1.75} />
              </span>
              <h3 className="mt-3.5 text-[15px] font-bold leading-snug text-gray-900">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
