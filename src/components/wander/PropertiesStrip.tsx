'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Star, Hotel } from 'lucide-react';

interface Property {
  id: string;
  slug: string;
  name: string;
  propertyType: string;
  city: string | null;
  state: string | null;
  startingPrice: number | null;
  coverImage: string | null;
  rating: number | null;
  totalRatings: number | null;
  agencyId: string | null;
  agencySlug: string | null;
  agencyName: string | null;
  agencyLogo: string | null;
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  RESORT: 'Resort',
  HOMESTAY: 'Homestay',
  VILLA: 'Villa',
  HOTEL: 'Hotel',
  HOSTEL: 'Hostel',
  GUESTHOUSE: 'Guesthouse',
  CAMPING: 'Camping',
  COTTAGE: 'Cottage',
  TREEHOUSE: 'Treehouse',
  HOUSEBOAT: 'Houseboat',
  TENT: 'Tent',
  APARTMENT: 'Apartment',
  OTHER: 'Property',
};

function PropertyCard({ property }: { property: Property }) {
  const cover = property.coverImage;
  const location = [property.city, property.state].filter(Boolean).join(', ');
  // Route follows the existing agency property page: /agent/<agencySlug>/property/<propertyId>
  const agencyHandle = property.agencySlug || property.agencyId;
  const href = agencyHandle
    ? `/agent/${agencyHandle}/property/${property.id}`
    : '#';
  return (
    <Link
      href={href}
      className="flex-shrink-0 group"
      style={{ width: 200 }}
    >
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-black/40 transition-all duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1"
        style={{ aspectRatio: '9/16' }}
      >
        {cover ? (
          <img
            src={cover}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Hotel className="w-12 h-12 text-white/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top row */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="px-2.5 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-lg">
            {PROPERTY_TYPE_LABEL[property.propertyType] || 'Stay'}
          </span>
          {property.rating != null && property.rating > 0 && (
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white/95 text-[10px] font-semibold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {property.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {property.agencyName && (
            <p className="text-white/50 text-[11px] truncate mb-1.5">{property.agencyName}</p>
          )}
          <h3 className="text-white text-sm font-bold leading-snug line-clamp-2 mb-1.5">
            {property.name}
          </h3>
          {location && (
            <p className="text-white/70 text-[11px] flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
          {property.startingPrice != null && property.startingPrice > 0 && (
            <p className="text-white text-xs font-bold mt-2">
              From{' '}
              <span className="text-emerald-300">
                ₹{property.startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-white/50 text-[10px] font-normal"> / night</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 rounded-3xl overflow-hidden bg-gray-200/70 animate-pulse"
      style={{ width: 200, aspectRatio: '9/16' }}
    />
  );
}

export function PropertiesStrip() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    fetch('/api/wander/properties?limit=20', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.properties)) {
          setProperties(d.properties);
        }
      })
      .catch(() => { /* silent — section will hide */ })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Only render once we actually have properties. This avoids the skeleton grid
  // flashing while loading and then disappearing when there are no properties
  // (e.g. local DB has no travel-agent properties) — no flash, no layout jump.
  if (properties.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-indigo-50/40 via-white to-fuchsia-50/40 relative overflow-hidden">
      {/* Soft background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-200/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-200/40 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8 px-1">
          <div>
            <div className="inline-flex items-center gap-2 bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Hotel className="w-3.5 h-3.5" />
              Stays by Travel Agents
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Curated Properties
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
                from trusted agencies
              </span>
            </h2>
          </div>

          {/* Scroll controls — desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm flex items-center justify-center transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm flex items-center justify-center transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroller */}
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,.15) transparent' }}
        >
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </div>
    </section>
  );
}
