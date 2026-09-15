'use client';

// Generic checkbox multi-select over {id, label, sublabel?} options — same
// visual pattern as ServiceMultiSelect (search, select-all, chips below),
// but not tied to the service shape, so it also works for e.g. locations.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { SelectOption } from './SearchableSelect';

export function MultiSelect({
  options, value, onChange, placeholder = 'Select...', searchPlaceholder = 'Search...', icon: Icon, noneLabel = 'No options found',
}: {
  options: SelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: any;
  noneLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => !q || o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  const allSelected = options.length > 0 && value.length === options.length;

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  const toggleAll = () => onChange(allSelected ? [] : options.map((o) => o.id));

  const selectedLabels = options.filter((o) => value.includes(o.id)).map((o) => o.label);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen((v) => !v)}
        className={`relative w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-9 py-2.5 border border-gray-200 rounded-lg text-sm cursor-pointer flex items-center bg-white hover:border-emerald-300 transition`}
      >
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <span className={value.length ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {value.length === 0
            ? placeholder
            : `${value.length} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 transition ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {value.length > 0 && !isOpen && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedLabels.map((n) => (
            <span key={n} className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-medium">{n}</span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="w-full text-left text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-1"
            >
              {allSelected ? 'Clear all' : `Select all (${options.length})`}
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">{noneLabel}</div>
            ) : (
              filtered.map((o) => (
                <label key={o.id} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.includes(o.id)}
                    onChange={() => toggle(o.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">
                    {o.label}
                    {o.sublabel ? <span className="text-gray-400">, {o.sublabel}</span> : null}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
