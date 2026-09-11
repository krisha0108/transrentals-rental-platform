import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, Lightbulb,
  KeyRound, Gem, Map, MoveRight, Heart, Briefcase, CalendarDays, Crown, Gauge,
} from 'lucide-react';

const CAR_SUB_SERVICES = [
  {
    id: 'self-drive',
    name: 'Self-Drive Car Rentals',
    icon: KeyRound,
    description: 'Drive yourself, no driver needed',
    price: 'Starting from ₹899',
    url: '/self-drive-car-rentals',
  },
  {
    id: 'luxury',
    name: 'Luxury Car Rental',
    icon: Gem,
    description: 'BMW, Mercedes, Audi & more',
    price: 'Starting from ₹4999',
    url: '/luxury-car-rental',
  },
  {
    id: 'outstation',
    name: 'Outstation Car Rental',
    icon: Map,
    description: 'Intercity trips & long distance travel',
    price: 'Starting from ₹10/km',
    url: '/outstation-car-rental',
  },
  {
    id: 'one-way',
    name: 'One-Way Car Rental',
    icon: MoveRight,
    description: 'Rent in one city, drop in another',
    price: 'Starting from ₹1299',
    url: '/one-way-car-rental',
  },
  {
    id: 'wedding',
    name: 'Wedding Car Rental',
    icon: Heart,
    description: 'Premium cars for your special day',
    price: 'Starting from ₹5999',
    url: '/wedding-car-rental',
  },
  {
    id: 'corporate',
    name: 'Corporate Car Rental',
    icon: Briefcase,
    description: 'Fleet solutions for businesses',
    price: 'Starting from ₹1499',
    url: '/corporate-car-rental',
  },
  {
    id: 'monthly',
    name: 'Monthly Car Rental',
    icon: CalendarDays,
    description: 'Long-term car subscription',
    price: 'Starting from ₹25,000/month',
    url: '/monthly-car-rental',
  },
  {
    id: 'vintage',
    name: 'Vintage Car Rental',
    icon: Crown,
    description: 'Classic cars for weddings & shoots',
    price: 'Starting from ₹7999',
    url: '/vintage-car-rental',
  },
  {
    id: 'sports',
    name: 'Sports Car Rental',
    icon: Gauge,
    description: 'Supercars & performance vehicles',
    price: 'Starting from ₹9999',
    url: '/sports-car-rental',
  },
];

/* Wahi animation jo bus-rental ke "Bus Rental Rates" section me hai:
   neeche se scale-in, aur hover par upar ka bar beech se failta hai. */
const CAR_SERVICES_CSS = `
.crs-card {
  opacity: 0;
  animation: crs-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes crs-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.crs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}

.crs-icon { transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.crs-card:hover .crs-icon { transform: scale(1.08); }

.crs-arrow { transition: background-color .3s ease, color .3s ease, border-color .3s ease, transform .3s ease; }
.crs-card:hover .crs-arrow { transform: translateX(3px); }

/* info box */
.crs-info { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
.crs-info:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px -16px rgba(16,185,129,.32);
  border-color: rgb(167 243 208);
}
.crs-info-icon { transition: background-color .3s ease, transform .3s ease; }
.crs-info:hover .crs-info-icon { transform: scale(1.06); }

@media (prefers-reduced-motion: reduce) {
  .crs-card, .crs-info { opacity: 1; animation: none; }
  .crs-card:hover, .crs-info:hover { transform: none; }
  .crs-icon, .crs-arrow, .crs-info-icon,
  .crs-card:hover .crs-icon,
  .crs-card:hover .crs-arrow,
  .crs-info:hover .crs-info-icon { transition: none; transform: none; }
}
`;

export function CarSubServicesGrid() {
  return (
    <section className="crs relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: CAR_SERVICES_CSS }} />

      {/* Upar se halka green glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)',
        }}
      />

      <div className="container-custom relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Specialized Services
          </span>
          <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
            Specialized Car Rental Services
          </h2>
          <p className="text-gray-500">
            Looking for something specific? Browse our specialized car rental services tailored to your needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {CAR_SUB_SERVICES.map((service, idx) => (
            <Link
              key={service.id}
              href={service.url}
              className="crs-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Icon panel */}
              <div className="w-[124px] shrink-0 flex items-center justify-center px-3 py-6 bg-emerald-50">
                <span className="crs-icon">
                  <service.icon className="w-9 h-9 text-emerald-600" strokeWidth={1.7} />
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 p-5">
                <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{service.name}</h3>
                <p className="mt-1.5 text-[13px] leading-snug text-gray-500">{service.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-emerald-700">Explore</span>
                  <span className="crs-arrow w-8 h-8 rounded-full bg-emerald-50 grid place-items-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="crs-info group mt-12 max-w-6xl mx-auto bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 border-l-4 border-emerald-500 transition-colors group-hover:bg-emerald-50/30">
            <div className="crs-info-icon w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[17px] tracking-tight text-gray-900 mb-1.5">Not sure which service to choose?</h4>
              <p className="text-[14.5px] text-gray-600 leading-relaxed mb-1.5">
                Use our general car rental booking form above to describe your requirements, and we&apos;ll match you with the best car rental service and vendors for your needs.
              </p>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                <strong className="font-bold text-gray-700">Tip:</strong> Standard local/outstation trips use the main booking form; specialized needs like self-drive, luxury, or wedding cars have their own pages above.
              </p>
            </div>
            <a
              href="#booking"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              Use Booking Form
              <ArrowRight className="w-4 h-4 -rotate-90" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
