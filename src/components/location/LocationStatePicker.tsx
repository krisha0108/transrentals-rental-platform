'use client';

// Always-visible (not a popover) state → city location picker: a left rail
// of states with a per-state selected-count badge, a right pane of city
// checkboxes for whichever state is expanded, chips for everything selected
// so far, and a search box that filters both panes at once.

import { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';

export interface LocationOption {
  id: string;
  name: string;
  slug: string;
  state?: string;
}

export function LocationStatePicker({
  options, value, onChange,
}: { options: LocationOption[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState('');

  const byState = useMemo(() => {
    const map = new Map<string, LocationOption[]>();
    options.forEach((o) => {
      const key = o.state || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [options]);

  const q = query.trim().toLowerCase();
  const visibleStates = useMemo(() => {
    if (!q) return byState;
    return byState
      .map(([state, cities]) => [state, cities.filter((c) => c.name.toLowerCase().includes(q))] as [string, LocationOption[]])
      .filter(([state, cities]) => state.toLowerCase().includes(q) || cities.length > 0);
  }, [byState, q]);

  const [expandedState, setExpandedState] = useState<string | null>(null);
  const activeState = expandedState && visibleStates.some(([s]) => s === expandedState)
    ? expandedState
    : visibleStates[0]?.[0] || null;
  const activeCities = visibleStates.find(([s]) => s === activeState)?.[1] || [];

  const selectedByState = (cities: LocationOption[]) => cities.filter((c) => value.includes(c.id)).length;

  const toggleCity = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  // Lets a manager assign an entire state in one click — every city under
  // it — instead of ticking each city one by one.
  const toggleState = (cities: LocationOption[]) => {
    const cityIds = cities.map((c) => c.id);
    const allSelected = cityIds.length > 0 && cityIds.every((id) => value.includes(id));
    onChange(
      allSelected
        ? value.filter((id) => !cityIds.includes(id))
        : [...new Set([...value, ...cityIds])],
    );
  };

  const optionById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selectedOptions = value.map((id) => optionById.get(id)).filter(Boolean) as LocationOption[];
  const selectedStateCount = new Set(selectedOptions.map((o) => o.state || 'Other')).size;

  const clearAll = () => onChange([]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-white">
          {selectedOptions.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 pl-2.5 pr-1.5 py-1 text-xs font-medium">
              {o.name}{o.state ? `, ${o.state}` : ''}
              <button type="button" onClick={() => toggleCity(o.id)} className="hover:text-sky-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="p-2.5 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search state or city..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
      </div>

      {/* State / city two-pane — stacked (vertical) on small/medium screens, side-by-side only once there's real room */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:h-72">
        <div className="max-h-56 lg:max-h-none overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">
          {visibleStates.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No states found</div>
          ) : (
            visibleStates.map(([state, cities]) => {
              const count = selectedByState(cities);
              const isActive = state === activeState;
              const allInStateSelected = cities.length > 0 && count === cities.length;
              return (
                <div
                  key={state}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                    isActive ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={allInStateSelected}
                    ref={(el) => { if (el) el.indeterminate = count > 0 && !allInStateSelected; }}
                    onChange={() => toggleState(cities)}
                    onClick={(e) => e.stopPropagation()}
                    title={`Assign all of ${state}`}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => setExpandedState(state)}
                    className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition ${isActive ? 'rotate-90 text-emerald-500' : 'text-gray-300'}`} />
                      <span className="truncate">{state}</span>
                    </span>
                    <span className={`flex-shrink-0 min-w-[1.25rem] text-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="max-h-56 lg:max-h-none overflow-y-auto">
          {activeCities.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No cities</div>
          ) : (
            <>
              <div className="sticky top-0 flex items-center justify-between bg-gray-50 border-b border-gray-100 px-3 py-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{activeState}</span>
                <button
                  type="button"
                  onClick={() => toggleState(activeCities)}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {selectedByState(activeCities) === activeCities.length ? 'Clear state' : 'Assign whole state'}
                </button>
              </div>
              {activeCities.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.includes(c.id)}
                    onChange={() => toggleCity(c.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700 truncate">{c.name}</span>
                </label>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs">
        <span className="text-gray-500 font-medium">
          {selectedStateCount} state{selectedStateCount === 1 ? '' : 's'} selected &middot; {selectedOptions.length} cit{selectedOptions.length === 1 ? 'y' : 'ies'} selected
        </span>
        <button type="button" onClick={clearAll} className="font-semibold text-gray-500 hover:text-rose-600 transition">
          Clear All
        </button>
      </div>
    </div>
  );
}
