'use client';

// Single-value searchable dropdown — same visual pattern as ServiceMultiSelect
// but picks one option and closes. Used for City (and reused as filter
// dropdowns) since those lists can get long enough that a plain <select>
// is hard to scan.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

export function SearchableSelect({
  options, value, onChange, placeholder = 'Select...', icon: Icon, dense = false,
}: {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  icon?: any;
  dense?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find((o) => o.id === value);

  const select = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen((v) => !v)}
        className={`relative w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-9 ${dense ? 'py-2' : 'py-2.5'} border border-gray-200 rounded-lg text-sm cursor-pointer flex items-center bg-white hover:border-emerald-300 transition`}
      >
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <span className={`truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); select(''); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 absolute right-3 top-1/2 -translate-y-1/2 transition ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No options found</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => select(o.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${o.id === value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}`}
                >
                  {o.label}
                  {o.sublabel ? <span className="text-gray-400 font-normal">, {o.sublabel}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
