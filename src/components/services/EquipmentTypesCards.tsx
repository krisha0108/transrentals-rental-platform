import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const EQUIPMENT_SUB_SERVICES = [
  {
    id: 'jcb-rental',
    name: 'JCB on Rent',
    icon: '🚜',
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
    icon: '🏗️',
    description: 'Heavy lifting equipment',
    features: ['10-100 TON', 'Construction sites', 'Material handling'],
    price: 'Starting from ₹3999',
    gradient: 'from-orange-500 to-red-500',
    popular: true,
  },
  {
    id: 'excavator',
    name: 'Excavator',
    icon: '⛏️',
    description: 'Digging & earthmoving',
    features: ['Trenching', 'Foundation work', 'Demolition'],
    price: 'Starting from ₹2999',
    gradient: 'from-yellow-600 to-orange-600',
    popular: true,
  },
  {
    id: 'jcb',
    name: 'JCB Backhoe Loader',
    icon: '🚜',
    description: 'Versatile digging & loading',
    features: ['Construction', 'Excavation', 'Road work'],
    price: 'Starting from ₹2499',
    gradient: 'from-amber-500 to-yellow-500',
    popular: true,
  },
  {
    id: 'bulldozer',
    name: 'Bulldozer',
    icon: '🚜',
    description: 'Heavy earthmoving',
    features: ['Land clearing', 'Grading', 'Road construction'],
    price: 'Starting from ₹3499',
    gradient: 'from-green-600 to-teal-600',
  },
  {
    id: 'roller',
    name: 'Road Roller',
    icon: '🚧',
    description: 'Road compaction equipment',
    features: ['Road laying', 'Compaction', 'Paving work'],
    price: 'Starting from ₹1999',
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'loader',
    name: 'Wheel Loader',
    icon: '🚜',
    description: 'Material loading equipment',
    features: ['Bulk loading', 'Material handling', 'Site cleanup'],
    price: 'Starting from ₹2299',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'generator',
    name: 'Generator',
    icon: '⚡',
    description: 'Power backup equipment',
    features: ['25-500 KVA', 'Silent models', 'Events & construction'],
    price: 'Starting from ₹999',
    gradient: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'forklift',
    name: 'Forklift',
    icon: '🏭',
    description: 'Warehouse material handling',
    features: ['1-5 TON', 'Indoor/outdoor', 'Warehouse ops'],
    price: 'Starting from ₹1499',
    gradient: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'concrete-mixer',
    name: 'Concrete Mixer',
    icon: '🔨',
    description: 'Concrete mixing equipment',
    features: ['Transit mixer', 'Construction', 'Site batching'],
    price: 'Starting from ₹1799',
    gradient: 'from-gray-600 to-slate-600',
  },
  {
    id: 'drilling-rig',
    name: 'Drilling Rig',
    icon: '⚙️',
    description: 'Borewell & foundation drilling',
    features: ['Borewell', 'Foundation', 'Deep drilling'],
    price: 'Starting from ₹4999',
    gradient: 'from-red-700 to-orange-700',
  },
  {
    id: 'compressor',
    name: 'Air Compressor',
    icon: '💨',
    description: 'Pneumatic power equipment',
    features: ['Portable', 'Construction', 'Industrial use'],
    price: 'Starting from ₹799',
    gradient: 'from-teal-600 to-green-600',
  },
];

export function EquipmentTypesCards() {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Construction & Industrial Equipment
          </h2>
          <p className="text-lg text-gray-600">
            Rent heavy equipment and machinery for construction, excavation, and industrial projects
          </p>
        </div>

        {/* Featured Sub-Service */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Most Popular</h3>
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {EQUIPMENT_SUB_SERVICES.map((service) => (
              <Link
                key={service.id}
                href={service.url}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex items-center gap-6"
              >
                {service.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-20 h-20 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center text-5xl group-hover:scale-110 transition-transform flex-shrink-0`}>
                  {service.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {service.features.map((feature) => (
                      <span key={feature} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <p className="text-primary font-bold">
                    {service.price}
                  </p>
                </div>

                <div className="flex items-center text-primary font-medium">
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Equipment Types */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">All Equipment Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {EQUIPMENT_TYPES.map((equipment) => (
              <div
                key={equipment.id}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {equipment.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-br ${equipment.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {equipment.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {equipment.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {equipment.description}
                </p>

                <ul className="space-y-1 mb-4">
                  {equipment.features.map((feature) => (
                    <li key={feature} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="text-primary font-bold text-sm">
                  {equipment.price}
                </p>

                <div className={`absolute inset-0 bg-gradient-to-br ${equipment.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">All equipment types available!</h4>
              <p className="text-gray-700 mb-3">
                Use the booking form above to specify your equipment type, job duration, and location. We'll connect you with verified equipment rental vendors with the best rates.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Operators and fuel can be arranged separately. Transit charges may apply based on distance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
