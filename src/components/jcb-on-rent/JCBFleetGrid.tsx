'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Tractor } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  sideImage: string | null;
  basePricePerDay: number | null;
  rating: number | null;
  tagline: string | null;
  highlight: string | null;
  brands: { name: string } | null;
}

interface Props {
  items: Equipment[];
  locationName: string;
}

const INITIAL_LIMIT = 8;

export function JCBFleetGrid({ items, locationName }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [activeBrand, setActiveBrand] = useState('All');

  const brands = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.brands?.name) set.add(i.brands.name); });
    return set.size > 1 ? ['All', ...Array.from(set).sort()] : [];
  }, [items]);

  const filtered = useMemo(() => {
    return activeBrand === 'All' ? items : items.filter(i => i.brands?.name === activeBrand);
  }, [items, activeBrand]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = filtered.length > INITIAL_LIMIT;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-2">
          Equipment Available in <span className="text-emerald-600">{locationName}</span>
        </h2>
        <p className="text-center text-gray-500 mb-8">Choose from our verified fleet</p>

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <span className="text-xs text-gray-400 font-semibold self-center mr-1 uppercase tracking-wide">Brand:</span>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeBrand === b
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No equipment found for selected filter.</div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
              style={{ animation: `jfg-rise .6s cubic-bezier(.22,1,.36,1) ${Math.min(idx, 8) * 70}ms forwards`, opacity: 0 }}
            >
              <div className="relative h-44 bg-emerald-50/60 flex items-center justify-center">
                {item.sideImage ? (
                  <Image
                    src={item.sideImage}
                    alt={item.name}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <Tractor className="w-14 h-14 text-emerald-300" strokeWidth={1.3} />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{item.name}</h3>
                  {item.rating && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                      ★ {item.rating}
                    </span>
                  )}
                </div>
                {item.brands?.name && (
                  <p className="text-xs text-gray-400 mb-1">{item.brands.name}</p>
                )}
                {item.tagline && (
                  <p className="text-sm text-gray-500 mb-3 flex-1">{item.tagline}</p>
                )}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-emerald-700">Get Quote</p>
                  {item.highlight && (
                    <p className="text-xs text-emerald-600 mt-1">{item.highlight}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-600 hover:text-white transition-all"
            >
              {showAll ? 'Show Less ↑' : `View All ${filtered.length} Equipment ↓`}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">* Get a custom quote based on your site and requirement</p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes jfg-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="jfg-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}
