'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Searchable multi-select used by every manager list filter, so
 * /manager/vendors, /manager/inquiries and /manager/bookings all read the same.
 *
 * Selected values are owned by the caller (the list pages keep them in the URL
 * as a comma-separated list, which is what makes filters survive the browser
 * Back button).
 *
 * Two looks:
 *  - `variant="labeled"` — small label above a full-width button (vendors grid)
 *  - `variant="inline"`  — icon inside a compact button (inquiries/bookings row)
 */
export default function FilterMultiSelect({
  label,
  options,
  allLabel,
  values,
  onChange,
  icon: Icon,
  variant = 'inline',
}: {
  label: string;
  options: FilterOption[];
  allLabel: string;
  values: string[];
  onChange: (v: string[]) => void;
  icon?: React.ElementType;
  variant?: 'inline' | 'labeled';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * De-duplicate by value. The location list arrives with repeats (two
   * "Udaipur" rows, three "Una"), and duplicate React keys let the list keep
   * stale rows when it re-renders — which read as the search not filtering.
   */
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  }, [options]);

  /**
   * Rank matches rather than just filtering them: an exact hit first, then
   * names starting with what was typed, then anything merely containing it.
   * Typing "ahmedabad" should land on Ahmedabad, not leave it below the fold.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Nothing typed: keep what's already ticked at the top, so a selection
      // made 400 rows down doesn't disappear from view.
      const picked = uniqueOptions.filter((o) => values.includes(o.value));
      const rest = uniqueOptions.filter((o) => !values.includes(o.value));
      return [...picked, ...rest];
    }
    const rank = (label: string) => {
      const l = label.toLowerCase();
      if (l === q) return 0;
      if (l.startsWith(q)) return 1;
      return 2;
    };
    return uniqueOptions
      .filter((o) => o.label.toLowerCase().includes(q))
      .sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label));
  }, [uniqueOptions, query, values]);

  // A filtered list has to start at the top. Without this the container keeps
  // the scroll offset from before the search, so the first match sits above
  // the visible area and the search looks broken.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query, open]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const summary =
    values.length === 0
      ? allLabel
      : values.length === 1
        ? uniqueOptions.find((o) => o.value === values[0])?.label ?? values[0]
        : `${values.length} selected`;

  const labeled = variant === 'labeled';

  return (
    <div ref={ref} className="relative">
      {labeled && <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          labeled
            ? 'w-full flex items-center justify-between gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white text-left'
            : 'flex items-center gap-1.5 pl-2.5 pr-2 py-2 border border-gray-200 rounded-lg text-sm bg-white text-left focus:ring-2 focus:ring-green-500 focus:border-transparent'
        }
      >
        {!labeled && Icon && <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
        <span
          className={`truncate ${labeled ? '' : 'max-w-[140px]'} ${
            values.length === 0 ? 'text-gray-500' : 'text-gray-900 font-medium'
          }`}
        >
          {summary}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ${
            labeled ? 'w-full min-w-[220px]' : 'min-w-[240px]'
          }`}
        >
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {query.trim() && (
              <p className="mt-1.5 px-0.5 text-[11px] text-gray-400">
                {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
              </p>
            )}
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setQuery('');
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-green-50 ${
                values.length === 0 ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
              }`}
            >
              {allLabel}
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">
                No matches for &ldquo;{query.trim()}&rdquo;
              </p>
            ) : (
              filtered.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm transition-colors hover:bg-green-50 ${
                      checked ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {values.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs text-gray-500 hover:text-gray-800 py-1"
              >
                Clear {values.length} selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
