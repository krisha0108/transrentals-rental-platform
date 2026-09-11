'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Car as CarIcon, Users, ArrowRight } from 'lucide-react';

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
    <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-[2.5rem] font-black tracking-tight text-gray-900">
            Monthly Plans in <span className="text-emerald-600">{locationName}</span>
          </h2>
          <p className="text-gray-500 mt-3">Self-drive · All-inclusive · Flexible terms</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
          {bodyTypes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Type:</span>
              {bodyTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveBodyType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeBodyType === t
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
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
          {visible.map((plan, idx) => (
            <div
              key={plan.id}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              style={{ animation: `mcp-rise .6s cubic-bezier(.22,1,.36,1) ${idx * 70}ms forwards`, opacity: 0 }}
            >
              <div className="relative h-40 bg-emerald-50 flex items-center justify-center">
                {plan.sideImage ? (
                  <Image
                    src={plan.sideImage}
                    alt={plan.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                  />
                ) : (
                  <CarIcon className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {(plan.seatingCapacity || plan.bodyType) && (
                    <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                      {plan.seatingCapacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {plan.seatingCapacity} Seater
                        </span>
                      )}
                      {plan.seatingCapacity && plan.bodyType ? ' · ' : ''}
                      {plan.bodyType}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-auto pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 group-hover:translate-x-1" />
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
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${filtered.length} Plans ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          * Monthly price = 30 days self-drive. Fuel, toll &amp; parking extra. Security deposit required. Prices may vary based on vendor availability.
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mcp-rise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="mcp-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
