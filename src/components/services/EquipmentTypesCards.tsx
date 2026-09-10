import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, Lightbulb, Sparkles,
  Tractor, Construction, Pickaxe, Mountain, Blocks, Forklift,
  Zap, Boxes, Drill, Wind, Shovel,
} from 'lucide-react';

const FEATURED_EQUIPMENT = {
  id: 'jcb-rental',
  name: 'JCB on Rent',
  icon: Tractor,
  bestFor: 'Backhoe loaders for construction work',
  features: ['Excavation', 'Construction', 'Expert operators'],
  url: '/jcb-on-rent',
};

const EQUIPMENT_TYPES = [
  {
    id: 'crane',
    name: 'Mobile Crane',
    icon: Construction,
    bestFor: 'Heavy lifting equipment',
    features: ['10-100 TON', 'Construction sites', 'Material handling'],
  },
  {
    id: 'excavator',
    name: 'Excavator',
    icon: Pickaxe,
    bestFor: 'Digging & earthmoving',
    features: ['Trenching', 'Foundation work', 'Demolition'],
  },
  {
    id: 'jcb',
    name: 'JCB Backhoe Loader',
    icon: Tractor,
    bestFor: 'Versatile digging & loading',
    features: ['Construction', 'Excavation', 'Road work'],
  },
  {
    id: 'bulldozer',
    name: 'Bulldozer',
    icon: Mountain,
    bestFor: 'Heavy earthmoving',
    features: ['Land clearing', 'Grading', 'Road construction'],
  },
  {
    id: 'roller',
    name: 'Road Roller',
    icon: Blocks,
    bestFor: 'Road compaction equipment',
    features: ['Road laying', 'Compaction', 'Paving work'],
  },
  {
    id: 'loader',
    name: 'Wheel Loader',
    icon: Shovel,
    bestFor: 'Material loading equipment',
    features: ['Bulk loading', 'Material handling', 'Site cleanup'],
  },
  {
    id: 'generator',
    name: 'Generator',
    icon: Zap,
    bestFor: 'Power backup equipment',
    features: ['25-500 KVA', 'Silent models', 'Events & construction'],
  },
  {
    id: 'forklift',
    name: 'Forklift',
    icon: Forklift,
    bestFor: 'Warehouse material handling',
    features: ['1-5 TON', 'Indoor/outdoor', 'Warehouse ops'],
  },
  {
    id: 'concrete-mixer',
    name: 'Concrete Mixer',
    icon: Boxes,
    bestFor: 'Concrete mixing equipment',
    features: ['Transit mixer', 'Construction', 'Site batching'],
  },
  {
    id: 'drilling-rig',
    name: 'Drilling Rig',
    icon: Drill,
    bestFor: 'Borewell & foundation drilling',
    features: ['Borewell', 'Foundation', 'Deep drilling'],
  },
  {
    id: 'compressor',
    name: 'Air Compressor',
    icon: Wind,
    bestFor: 'Pneumatic power equipment',
    features: ['Portable', 'Construction', 'Industrial use'],
  },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Truck Types by Size & Capacity me use hui hai. */
const ETC_CSS = `
.etc-card {
  opacity: 0;
  animation: etc-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes etc-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.etc-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}

.etc-icon { transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.etc-card:hover .etc-icon { transform: scale(1.08); }

.etc-arrow { transition: background-color .3s ease, color .3s ease, transform .3s ease; }
.etc-card:hover .etc-arrow { transform: translateX(3px); }

.etc-info { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
.etc-info:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px -16px rgba(16,185,129,.32);
  border-color: rgb(167 243 208);
}
.etc-info-icon { transition: background-color .3s ease, transform .3s ease; }
.etc-info:hover .etc-info-icon { transform: scale(1.06); }

@media (prefers-reduced-motion: reduce) {
  .etc-card, .etc-info { opacity: 1; animation: none; }
  .etc-card:hover, .etc-info:hover { transform: none; }
  .etc-icon, .etc-arrow, .etc-info-icon,
  .etc-card:hover .etc-icon,
  .etc-card:hover .etc-arrow,
  .etc-info:hover .etc-info-icon { transition: none; transform: none; }
}
`;

function EquipmentCard({ equipment, idx }: { equipment: typeof EQUIPMENT_TYPES[number]; idx: number }) {
  return (
    <div
      className="etc-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="w-[104px] shrink-0 flex items-center justify-center px-3 py-6 bg-emerald-50">
        <span className="etc-icon">
          <equipment.icon className="w-9 h-9 text-emerald-600" strokeWidth={1.7} />
        </span>
      </div>

      <div className="flex-1 min-w-0 p-5">
        <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{equipment.name}</h3>

        <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
        <p className="mt-0.5 text-[13px] text-gray-600">{equipment.bestFor}</p>

        <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
          {equipment.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
              <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EquipmentTypesCards() {
  return (
    <section className="etc relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: ETC_CSS }} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)',
        }}
      />

      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            What You Can Rent
          </span>
          <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
            Construction &amp; Industrial Equipment
          </h2>
          <p className="text-gray-500">
            Rent heavy equipment and machinery for construction, excavation, and industrial projects
          </p>
        </div>

        {/* Has Its Own Dedicated Page — the only clickable card, links to jcb-on-rent */}
        <div className="mb-12 max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Has Its Own Dedicated Page</h3>
          <Link
            href={FEATURED_EQUIPMENT.url}
            className="etc-card group relative flex w-full max-w-2xl mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="w-[124px] shrink-0 flex items-center justify-center px-3 py-6 bg-emerald-50">
              <span className="etc-icon">
                <FEATURED_EQUIPMENT.icon className="w-10 h-10 text-emerald-600" strokeWidth={1.7} />
              </span>
            </div>

            <div className="flex-1 min-w-0 p-5">
              <h3 className="text-[17px] font-bold text-gray-900 leading-snug">{FEATURED_EQUIPMENT.name}</h3>
              <p className="mt-1.5 text-[13px] leading-snug text-gray-500">{FEATURED_EQUIPMENT.bestFor}</p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {FEATURED_EQUIPMENT.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                        <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="etc-arrow w-8 h-8 rounded-full bg-emerald-50 grid place-items-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* All Equipment Types */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 max-w-6xl mx-auto">All Equipment Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {EQUIPMENT_TYPES.map((equipment, idx) => (
              <EquipmentCard key={equipment.id} equipment={equipment} idx={idx} />
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="etc-info group mt-12 max-w-6xl mx-auto bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6 border-l-4 border-emerald-500 transition-colors group-hover:bg-emerald-50/30">
            <div className="etc-info-icon w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[17px] tracking-tight text-gray-900 mb-1.5">All equipment types available!</h4>
              <p className="text-[14.5px] text-gray-600 leading-relaxed mb-1.5">
                Use the booking form above to specify your equipment type, job duration, and location. We&apos;ll connect you with verified equipment rental vendors with the best rates.
              </p>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                <strong className="font-bold text-gray-700">Note:</strong> Operators and fuel can be arranged separately. Transit charges may apply based on distance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
