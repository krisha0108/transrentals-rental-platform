'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight,
  Compass, Car, Route, Mountain, Waves, Utensils, Bike, Camera, Plane, Tent,
  Newspaper, MapPin, BookOpen, Globe, Tags, Sparkles, Sun, Tractor, Truck, Ship,
} from 'lucide-react';

interface Cat { id: string; name: string; slug: string; color?: string; icon?: string }

// Distinct icon pool — circles never reuse an icon while the pool lasts.
const ICON_POOL = [
  Route, Mountain, Waves, Utensils, Bike, Car, Camera, Plane, Tent, Newspaper,
  MapPin, BookOpen, Compass, Globe, Tags, Sparkles, Sun, Tractor, Truck, Ship,
];

function preferredIcon(cat: Cat) {
  const s = `${cat.name || ''} ${cat.slug || ''}`.toLowerCase();
  if (/road|trip|route|itinerary/.test(s)) return Route;
  if (/mountain|hill|trek|himalaya|ladakh|spiti/.test(s)) return Mountain;
  if (/beach|coast|sea|island|goa/.test(s)) return Waves;
  if (/food|cuisine|eat|restaurant|taste/.test(s)) return Utensils;
  if (/bike|motorcycle|scooter/.test(s)) return Bike;
  if (/car|drive|rental|vehicle|self/.test(s)) return Car;
  if (/photo|camera|gear/.test(s)) return Camera;
  if (/flight|air|airport/.test(s)) return Plane;
  if (/camp|adventure|wild|safari|forest|nature/.test(s)) return Tent;
  if (/news|update|story|stories/.test(s)) return Newspaper;
  if (/destination|place|city|location/.test(s)) return MapPin;
  if (/guide|tip|how|review|reflection/.test(s)) return BookOpen;
  return null;
}

export function CategoriesCarousel({ categories }: { categories: Cat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  if (!categories || categories.length === 0) return null;

  // Assign a unique icon to each category; once the pool is exhausted, the
  // circle shows the category's first letter (monogram) so it stays distinct.
  const used = new Set<any>();
  const assigned = categories.map((cat) => {
    let Icon = preferredIcon(cat);
    if (Icon && used.has(Icon)) Icon = null;
    if (!Icon) Icon = ICON_POOL.find((ic) => !used.has(ic)) || null;
    if (Icon) used.add(Icon);
    return Icon;
  });

  const showArrows = categories.length > 7;

  return (
    <div>
      {/* Heading + arrows (arrows aligned to the end / right) */}
      <div className="flex justify-between items-end gap-4 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#047857]">Categories</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mt-2">Explore Popular Categories</h2>
          <p className="text-sm text-[#5a6172] mt-1">Discover travel stories and tips grouped by the experiences you love.</p>
        </div>
        {showArrows && (
          <div className="hidden sm:flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous"
              className="w-11 h-11 rounded-full bg-white border border-[#d1fae5] shadow-sm flex items-center justify-center text-[#047857] hover:bg-emerald-50 hover:border-[#047857] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next"
              className="w-11 h-11 rounded-full bg-white border border-[#d1fae5] shadow-sm flex items-center justify-center text-[#047857] hover:bg-emerald-50 hover:border-[#047857] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={ref}
        className={`flex gap-6 md:gap-10 overflow-x-auto pt-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${showArrows ? '' : 'flex-wrap'}`}
      >
        {categories.map((cat, i) => {
          const Icon = assigned[i];
          return (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className="flex flex-col items-center group shrink-0 w-20 md:w-24"
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 ring-1 ring-[#d1fae5] shadow-[0_8px_20px_-6px_rgba(4,120,87,0.35)] group-hover:scale-110 group-hover:shadow-[0_12px_28px_-6px_rgba(4,120,87,0.5)] transition-all flex items-center justify-center bg-gradient-to-br from-[#047857] to-[#065f46] overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                {Icon ? (
                  <Icon className="relative w-6 h-6 md:w-7 md:h-7 text-white" strokeWidth={1.75} />
                ) : (
                  <span className="relative font-serif text-2xl md:text-3xl font-bold text-white">
                    {(cat.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a6172] group-hover:text-[#047857] transition-colors text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
