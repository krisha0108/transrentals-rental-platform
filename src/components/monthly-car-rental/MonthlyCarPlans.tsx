'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

interface Plan {
  id: string;
  name: string;
  sideImage: string | null;
  seatingCapacity: number | null;
  bodyType: string | null;
  isPopular: boolean;
  monthlyDiscount: number | null;
  monthlyPrice: number;
}

interface Props {
  plans: Plan[];
  locationName: string;
}

const SEAT_GROUPS = [
  { label: 'All', min: 0, max: 9999 },
  { label: '4 Seater', min: 4, max: 4 },
  { label: '5 Seater', min: 5, max: 5 },
  { label: '6–7 Seater', min: 6, max: 7 },
  { label: '8+ Seater', min: 8, max: 9999 },
];

const INITIAL_LIMIT = 6;

export function MonthlyCarPlans({ plans, locationName }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [activeBodyType, setActiveBodyType] = useState('All');
  const [activeSeat, setActiveSeat] = useState('All');

  const bodyTypes = useMemo(() => {
    const set = new Set<string>();
    plans.forEach(p => { if (p.bodyType) set.add(p.bodyType); });
    return set.size > 1 ? ['All', ...Array.from(set).sort()] : [];
  }, [plans]);

  const seatGroups = useMemo(() => {
    return SEAT_GROUPS.filter(g => {
      if (g.label === 'All') return true;
      return plans.some(p => (p.seatingCapacity ?? 0) >= g.min && (p.seatingCapacity ?? 0) <= g.max);
    });
  }, [plans]);

  const filtered = useMemo(() => {
    return plans.filter(p => {
      const bodyOk = activeBodyType === 'All' || p.bodyType === activeBodyType;
      const sg = SEAT_GROUPS.find(g => g.label === activeSeat);
      const seatOk = activeSeat === 'All' || !sg
        ? true
        : (p.seatingCapacity ?? 0) >= sg.min && (p.seatingCapacity ?? 0) <= sg.max;
      return bodyOk && seatOk;
    });
  }, [plans, activeBodyType, activeSeat]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = filtered.length > INITIAL_LIMIT;

  const gridClass =
    filtered.length === 1 ? 'max-w-sm mx-auto' :
    filtered.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
    filtered.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' :
    'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-2 text-center">Monthly Plans in {locationName}</h2>
        <p className="text-center text-gray-500 mb-5">Self-drive · All-inclusive · Flexible terms</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          {bodyTypes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Type:</span>
              {bodyTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveBodyType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeBodyType === t
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {seatGroups.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Seats:</span>
              {seatGroups.map(g => (
                <button
                  key={g.label}
                  onClick={() => setActiveSeat(g.label)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeSeat === g.label
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-400 hover:text-cyan-600'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plans found for selected filters.</div>
        ) : (
        <div className={`grid gap-6 ${gridClass}`}>
          {visible.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col ${
                plan.isPopular ? 'ring-2 ring-teal-500 scale-[1.02]' : 'border border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                  <span className="bg-teal-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg">
                    ⭐ POPULAR
                  </span>
                </div>
              )}

              <div className={`relative h-40 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center ${plan.isPopular ? 'mt-6' : ''}`}>
                {plan.sideImage ? (
                  <Image
                    src={plan.sideImage}
                    alt={plan.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  />
                ) : (
                  <span className="text-7xl">🚗</span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {(plan.seatingCapacity || plan.bodyType) && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[plan.seatingCapacity ? `${plan.seatingCapacity} Seater` : null, plan.bodyType]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                  <p className="text-3xl font-bold text-teal-700">
                    ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500">/month</p>
                  {plan.monthlyDiscount && plan.monthlyDiscount > 0 ? (
                    <span className="inline-block mt-1.5 text-xs bg-teal-100 text-teal-700 font-semibold px-2.5 py-0.5 rounded-full">
                      {plan.monthlyDiscount}% monthly discount
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-teal-600 text-teal-600 font-semibold text-sm hover:bg-teal-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${filtered.length} Plans ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          * Monthly price = 30 days self-drive. Fuel, toll &amp; parking extra. Security deposit required. Prices may vary based on vendor availability.
        </p>
      </div>
    </section>
  );
}
