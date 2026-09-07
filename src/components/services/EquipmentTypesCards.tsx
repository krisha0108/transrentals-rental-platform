import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, Lightbulb, Sparkles,
  Tractor, Construction, Pickaxe, Mountain, Blocks, Forklift,
  Zap, Boxes, Drill, Wind, Shovel,
} from 'lucide-react';

const EQUIPMENT_SUB_SERVICES = [
  {
    id: 'jcb-rental',
    name: 'JCB on Rent',
    icon: Tractor,
    description: 'Backhoe loaders for construction work',
    features: ['Excavation', 'Construction', 'Expert operators'],
    price: 'Starting from ₹2499',
    url: '/jcb-on-rent',
    gradient: 'from-yellow-600 to-orange-500',
    popular: true,
  },
];

const EQUIPMENT_TYPES = [
  {
    id: 'crane',
    name: 'Mobile Crane',
    icon: Construction,
    description: 'Heavy lifting equipment',
    features: ['10-100 TON', 'Construction sites', 'Material handling'],
    price: 'Starting from ₹3999',
    gradient: 'from-orange-500 to-red-500',
    popular: true,
  },
  {
    id: 'excavator',
    name: 'Excavator',
    icon: Pickaxe,
    description: 'Digging & earthmoving',
    features: ['Trenching', 'Foundation work', 'Demolition'],
    price: 'Starting from ₹2999',
    gradient: 'from-yellow-600 to-orange-600',
    popular: true,
  },
  {
    id: 'jcb',
    name: 'JCB Backhoe Loader',
    icon: Tractor,
    description: 'Versatile digging & loading',
    features: ['Construction', 'Excavation', 'Road work'],
    price: 'Starting from ₹2499',
    gradient: 'from-amber-500 to-yellow-500',
    popular: true,
  },
  {
    id: 'bulldozer',
    name: 'Bulldozer',
    icon: Mountain,
    description: 'Heavy earthmoving',
    features: ['Land clearing', 'Grading', 'Road construction'],
    price: 'Starting from ₹3499',
    gradient: 'from-green-600 to-teal-600',
  },
  {
    id: 'roller',
    name: 'Road Roller',
    icon: Blocks,
    description: 'Road compaction equipment',
    features: ['Road laying', 'Compaction', 'Paving work'],
    price: 'Starting from ₹1999',
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'loader',
    name: 'Wheel Loader',
    icon: Shovel,
    description: 'Material loading equipment',
    features: ['Bulk loading', 'Material handling', 'Site cleanup'],
    price: 'Starting from ₹2299',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'generator',
    name: 'Generator',
    icon: Zap,
    description: 'Power backup equipment',
    features: ['25-500 KVA', 'Silent models', 'Events & construction'],
    price: 'Starting from ₹999',
    gradient: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'forklift',
    name: 'Forklift',
    icon: Forklift,
    description: 'Warehouse material handling',
    features: ['1-5 TON', 'Indoor/outdoor', 'Warehouse ops'],
    price: 'Starting from ₹1499',
    gradient: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'concrete-mixer',
    name: 'Concrete Mixer',
    icon: Boxes,
    description: 'Concrete mixing equipment',
    features: ['Transit mixer', 'Construction', 'Site batching'],
    price: 'Starting from ₹1799',
    gradient: 'from-gray-600 to-slate-600',
  },
  {
    id: 'drilling-rig',
    name: 'Drilling Rig',
    icon: Drill,
    description: 'Borewell & foundation drilling',
    features: ['Borewell', 'Foundation', 'Deep drilling'],
    price: 'Starting from ₹4999',
    gradient: 'from-red-700 to-orange-700',
  },
  {
    id: 'compressor',
    name: 'Air Compressor',
    icon: Wind,
    description: 'Pneumatic power equipment',
    features: ['Portable', 'Construction', 'Industrial use'],
    price: 'Starting from ₹799',
    gradient: 'from-teal-600 to-green-600',
  },
];

export function EquipmentTypesCards() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
      {/* Halka dotted pattern kono me */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage:
            'radial-gradient(400px 320px at 4% 10%, #000 0%, transparent 72%), radial-gradient(400px 320px at 96% 90%, #000 0%, transparent 72%)',
          maskImage:
            'radial-gradient(400px 320px at 4% 10%, #000 0%, transparent 72%), radial-gradient(400px 320px at 96% 90%, #000 0%, transparent 72%)',
        }}
      />

      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            WHAT YOU CAN RENT
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          </span>
          <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
            Construction &amp; <span className="text-primary">Industrial Equipment</span>
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Rent heavy equipment and machinery for construction, excavation, and industrial projects
          </p>
        </div>

        {/* Featured Sub-Service */}
        <div className="mb-10">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-gray-500 uppercase mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            Most Popular
          </h3>
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {EQUIPMENT_SUB_SERVICES.map((service) => (
              <Link
                key={service.id}
                href={service.url}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 transition-all duration-200 p-5 sm:p-6"
              >
                {service.popular && (
                  <span className="absolute top-4 right-4 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                    Most Popular
                  </span>
                )}

                <div className="w-16 h-16 rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <service.icon className="w-7 h-7 text-primary-600" strokeWidth={1.9} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-black tracking-tight text-gray-900">{service.name}</h4>
                  <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-600"
                      >
                        <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                        {feature}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[15px] font-black text-primary tracking-tight">{service.price}</p>
                </div>

                <span className="shrink-0 w-10 h-10 rounded-full bg-primary-50 grid place-items-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* All Equipment Types */}
        <div>
          <h3 className="text-sm font-bold tracking-wide text-gray-500 uppercase mb-4">All Equipment Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {EQUIPMENT_TYPES.map((equipment) => (
              <div
                key={equipment.id}
                className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 transition-all duration-200 p-4 sm:p-5"
              >
                {equipment.popular && (
                  <span className="absolute top-3 right-3 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                    Popular
                  </span>
                )}

                <div className="w-14 h-14 rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <equipment.icon className="w-6 h-6 text-primary-600" strokeWidth={1.9} />
                </div>

                <h4 className="font-bold text-[15px] leading-snug text-gray-900">{equipment.name}</h4>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{equipment.description}</p>

                <ul className="mt-3 space-y-1.5 flex-1">
                  {equipment.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-[12px] leading-snug text-gray-600">
                      <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full bg-primary-50 grid place-items-center">
                        <Check className="w-2 h-2 text-primary" strokeWidth={4} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 pt-3 border-t border-gray-100 text-[13px] font-black tracking-tight text-primary">
                  {equipment.price}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="group mt-12 max-w-4xl mx-auto rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 transition-all duration-200 overflow-hidden">
          <div className="flex items-start gap-4 p-5 sm:p-6 border-l-4 border-primary transition-colors group-hover:bg-primary-50/30">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-primary-50 grid place-items-center transition-all duration-200 group-hover:bg-primary group-hover:scale-105">
              <Lightbulb className="w-5 h-5 text-primary transition-colors group-hover:text-white" />
            </span>
            <div className="min-w-0">
              <h4 className="font-black text-[17px] tracking-tight text-gray-900 mb-1.5">All equipment types available!</h4>
              <p className="text-[14.5px] leading-relaxed text-gray-600 mb-2">
                Use the booking form above to specify your equipment type, job duration, and location. We&apos;ll connect you with verified equipment rental vendors with the best rates.
              </p>
              <p className="text-[13px] leading-relaxed text-gray-500">
                <strong className="font-bold text-gray-700">Note:</strong> Operators and fuel can be arranged separately. Transit charges may apply based on distance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
