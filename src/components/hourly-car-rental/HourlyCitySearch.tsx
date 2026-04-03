'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown } from 'lucide-react';
import { ALL_CITIES } from '@/data/indian-cities';

export function HourlyCitySearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = query.trim().length > 0
    ? ALL_CITIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : ALL_CITIES.slice(0, 8);

  const handleSelect = (slug: string) => {
    router.push(`/hourly-car-rental/${slug}`);
  };

  return (
    <div className="relative max-w-md w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Enter your city..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full pl-11 pr-4 py-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
          />
        </div>
        <button
          onClick={() => {
            const match = ALL_CITIES.find((c) =>
              c.name.toLowerCase() === query.toLowerCase()
            );
            if (match) handleSelect(match.slug);
            else if (filtered.length > 0) handleSelect(filtered[0].slug);
          }}
          className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-4 rounded-xl transition flex items-center gap-2 shadow-lg whitespace-nowrap"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-16 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {filtered.map((city) => (
            <button
              key={city.slug}
              onMouseDown={() => handleSelect(city.slug)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition"
            >
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-gray-800 font-medium">{city.name}</span>
              <span className="text-gray-400 text-sm ml-auto">{city.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
