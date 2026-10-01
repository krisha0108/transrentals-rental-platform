'use client';

// The service row on /admin/payments.
//
// It used to be a plain `overflow-x-auto` strip with the scrollbar hidden, so
// on a normal laptop the last service ("Wander Tours") sat past the right edge
// with nothing on screen to say it was there or any obvious way to reach it.
//
// Now the strip still scrolls, but it says so: a slim scrollbar, arrow buttons
// that appear only on the side there is more to see, and a fade over the edge
// that is cut off. The arrows move one screenful at a time and the strip also
// answers the keyboard, a wheel and a drag, so every way of reaching the last
// tab works.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clock, Bike, Car, CarFront, Bus, Truck, Package, Crown, Compass,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceTab {
  key: string;
  label: string;
  icon: React.ElementType;
  active: string;
}

export const SERVICE_TABS: ServiceTab[] = [
  { key: 'all', label: 'All', icon: Clock, active: 'bg-amber-100 text-amber-700' },
  { key: 'bike', label: 'Bike Rentals', icon: Bike, active: 'bg-purple-100 text-purple-700' },
  { key: 'chauffeur', label: 'Car Rental', icon: Car, active: 'bg-blue-100 text-blue-700' },
  { key: 'car', label: 'Self-Drive', icon: CarFront, active: 'bg-orange-100 text-orange-700' },
  { key: 'bus', label: 'Bus Rentals', icon: Bus, active: 'bg-emerald-100 text-emerald-700' },
  { key: 'truck', label: 'Truck Rentals', icon: Truck, active: 'bg-amber-100 text-amber-700' },
  { key: 'equipment', label: 'Equipment', icon: Package, active: 'bg-teal-100 text-teal-700' },
  { key: 'packers', label: 'Packers & Movers', icon: Package, active: 'bg-pink-100 text-pink-700' },
  { key: 'luxury', label: 'Luxury Car', icon: Crown, active: 'bg-yellow-100 text-yellow-800' },
  { key: 'wander', label: 'Wander Tours', icon: Compass, active: 'bg-indigo-100 text-indigo-700' },
];

export default function ServiceTabs({
  value,
  onChange,
  allCount,
}: {
  value: string;
  onChange: (key: string) => void;
  allCount: number;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    // A pixel of slack: sub-pixel widths otherwise leave the arrow showing
    // when the strip is already at the end.
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [measure]);

  // Keep the selected tab in view when it is chosen from elsewhere.
  useEffect(() => {
    strip.current
      ?.querySelector(`[data-tab="${value}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [value]);

  const nudge = (direction: -1 | 1) => {
    const el = strip.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(200, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <div className="relative flex-1 min-w-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pay-services { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .pay-services::-webkit-scrollbar { height: 6px; }
        .pay-services::-webkit-scrollbar-track { background: transparent; }
        .pay-services::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .pay-services::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
        }}
      />

      {/* Fades sit above the strip but must not swallow clicks on the tabs. */}
      {edges.left && (
        <span className="pointer-events-none absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-white to-transparent z-10" aria-hidden />
      )}
      {edges.right && (
        <span className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white to-transparent z-10" aria-hidden />
      )}

      {edges.left && (
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Scroll services left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -mt-1 z-20 grid place-items-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Scroll services right"
          className="absolute right-0 top-1/2 -translate-y-1/2 -mt-1 z-20 grid place-items-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div
        ref={strip}
        className="pay-services flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Filter by service"
      >
        {SERVICE_TABS.map(({ key, label, icon: Icon, active }) => (
          <button
            key={key}
            data-tab={key}
            role="tab"
            aria-selected={value === key}
            onClick={() => onChange(key)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
              value === key ? active : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            <Icon className="w-4 h-4" />
            {key === 'all' ? `All (${allCount})` : label}
          </button>
        ))}
      </div>
    </div>
  );
}
