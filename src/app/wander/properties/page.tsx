// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Star, Users, BedDouble, Moon, SlidersHorizontal, X,
  ArrowRight, BadgeCheck, Hotel, Home, TreePalm, Tent, Building2, ArrowUpDown,
  Sparkles, ChevronDown, Compass,
} from 'lucide-react';

/* ─── constants ────────────────────────────────────── */
const TYPE_META: Record<string, { label: string; icon: any }> = {
  RESORT: { label: 'Resort', icon: TreePalm },
  HOMESTAY: { label: 'Homestay', icon: Home },
  VILLA: { label: 'Villa', icon: Home },
  HOTEL: { label: 'Hotel', icon: Hotel },
  HOSTEL: { label: 'Hostel', icon: BedDouble },
  GUESTHOUSE: { label: 'Guesthouse', icon: Home },
  CAMPING: { label: 'Camping', icon: Tent },
  COTTAGE: { label: 'Cottage', icon: Home },
  TREEHOUSE: { label: 'Treehouse', icon: TreePalm },
  HOUSEBOAT: { label: 'Houseboat', icon: Compass },
  TENT: { label: 'Tent', icon: Tent },
  APARTMENT: { label: 'Apartment', icon: Building2 },
  OTHER: { label: 'Property', icon: Building2 },
};
const typeLabel = (t: string) => TYPE_META[t]?.label || 'Stay';
const typeIcon = (t: string) => TYPE_META[t]?.icon || Building2;

const PRICE_PRESETS = [
  { label: 'Any price', min: null, max: null },
  { label: 'Under ₹5K', min: null, max: 5000 },
  { label: '₹5K – ₹10K', min: 5000, max: 10000 },
  { label: '₹10K – ₹20K', min: 10000, max: 20000 },
  { label: '₹20K+', min: 20000, max: null },
];
const GUEST_PRESETS = [
  { label: 'Any', min: 0 },
  { label: '2+ guests', min: 2 },
  { label: '4+ guests', min: 4 },
  { label: '6+ guests', min: 6 },
  { label: '8+ guests', min: 8 },
];
const NIGHT_PRESETS = [
  { label: 'Any', min: 0 },
  { label: '2+ nights', min: 2 },
  { label: '5+ nights', min: 5 },
  { label: '7+ nights', min: 7 },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'priceAsc', label: 'Price: Low → High' },
  { value: 'priceDesc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

/* ─── premium tokens + animations (scoped) ─────────── */
const STYLES = `
.stays-premium{
  --w-teal:#0F766E; --w-teal-bright:#14B8A6; --w-gold:#F59E0B; --w-sand:#F1EEE8;
  --w-shadow-soft:0 1px 2px rgba(15,23,42,.05), 0 12px 30px -16px rgba(15,23,42,.18);
  --w-shadow-lift:0 6px 14px -8px rgba(15,23,42,.14), 0 30px 60px -28px rgba(15,23,42,.30);
  --w-shadow-glow:0 10px 46px -10px rgba(15,118,110,.45);
  background:#FAFAF8; color:#111827; -webkit-font-smoothing:antialiased;
}
.stays-premium .font-display{ font-family:var(--font-display),"Fraunces",Georgia,serif; letter-spacing:-.02em; font-weight:600; }
.stays-premium .wg-glass{ background:rgba(255,255,255,.72); backdrop-filter:blur(22px) saturate(165%); -webkit-backdrop-filter:blur(22px) saturate(165%); border:1px solid rgba(255,255,255,.6); box-shadow:var(--w-shadow-soft); }
.stays-premium .wg-grad-teal{ background-image:linear-gradient(135deg,#0F766E,#14B8A6); }
.stays-premium .wg-text-teal{ background-image:linear-gradient(120deg,#0F766E,#14B8A6 60%,#5EEAD4); -webkit-background-clip:text; background-clip:text; color:transparent; }
.stays-premium .wg-shadow-soft{ box-shadow:var(--w-shadow-soft); }
.stays-premium .wg-shadow-lift{ box-shadow:var(--w-shadow-lift); }
.stays-premium .wg-shadow-glow{ box-shadow:var(--w-shadow-glow); }
.stays-premium .wg-lift{ transition:transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s cubic-bezier(.2,.8,.2,1); }
.stays-premium .wg-lift:hover{ transform:translateY(-6px); box-shadow:var(--w-shadow-lift); }
.stays-premium .wg-zoom{ overflow:hidden; }
.stays-premium .wg-zoom img{ transition:transform 1s cubic-bezier(.2,.8,.2,1); }
.stays-premium .wg-zoom:hover img{ transform:scale(1.08); }
.stays-premium .wg-reveal{ opacity:0; }
.stays-premium .wg-reveal.wg-in{ animation:sp-fade-up .8s cubic-bezier(.2,.8,.2,1) both; }
@keyframes sp-fade-up{ from{opacity:0; transform:translateY(24px);} to{opacity:1; transform:translateY(0);} }
@keyframes sp-kenburns{ 0%{transform:scale(1.05);} 100%{transform:scale(1.15);} }
.stays-premium .wg-kenburns{ animation:sp-kenburns 18s ease-in-out infinite alternate; }
@media (prefers-reduced-motion:reduce){ .stays-premium .wg-reveal,.stays-premium .wg-reveal.wg-in{ opacity:1 !important; animation:none !important; } .stays-premium .wg-kenburns{ animation:none !important; } }
`;

/* ─── Reveal on scroll (replays each time) ─────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.remove('wg-in');
          void (e.target as HTMLElement).offsetWidth;
          e.target.classList.add('wg-in');
        } else {
          e.target.classList.remove('wg-in');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '', delay = 0 }: any) {
  const ref = useReveal();
  return <div ref={ref} className={`wg-reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

/* ─── PropertyCard ─────────────────────────────────── */
function PropertyCard({ p }: { p: any }) {
  const [imgErr, setImgErr] = useState(false);
  const Icon = typeIcon(p.propertyType);
  const location = [p.city, p.state].filter(Boolean).join(', ');
  const handle = p.agencySlug || p.agencyId;
  const href = handle ? `/agent/${handle}/property/${p.id}` : '#';
  const showImg = p.coverImage && !imgErr;

  return (
    <Link href={href} className="group wg-lift h-full flex flex-col bg-white rounded-3xl overflow-hidden wg-shadow-soft border border-slate-100 hover:border-teal-200/70">
      {/* Image */}
      <div className="wg-zoom relative h-44 bg-gradient-to-br from-slate-800 to-teal-900 overflow-hidden flex-shrink-0">
        {showImg ? (
          <img src={p.coverImage} alt={p.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950">
            <Icon className="w-16 h-16 text-white/20" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-slate-700 px-3 py-1.5 rounded-full shadow-sm">
            <Icon className="w-3.5 h-3.5 text-teal-700" /> {typeLabel(p.propertyType)}
          </span>
          {p.rating > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
              <Star className="w-3 h-3 fill-slate-900" /> {Number(p.rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-slate-900 text-base leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-teal-700 transition-colors">
          {p.name}
        </h3>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {location}
          </p>
        )}

        {/* Feature chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.maxGuests > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <Users className="w-3 h-3 text-teal-600" /> {p.maxGuests} guests
            </span>
          )}
          {p.bedroomsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <BedDouble className="w-3 h-3 text-teal-600" /> {p.bedroomsCount} {p.bedroomsCount === 1 ? 'bed' : 'beds'}
            </span>
          )}
          {p.minNights > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <Moon className="w-3 h-3 text-teal-600" /> {p.minNights}+ nights
            </span>
          )}
        </div>

        {/* Bottom group */}
        <div className="mt-auto pt-4">
          {p.agencyName && (
            <div className="mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full wg-grad-teal flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white">
                {p.agencyName[0]?.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 truncate">{p.agencyName}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex-shrink-0">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            </div>
          )}
          <div className="pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
            {p.startingPrice > 0 ? (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">From</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 tracking-tight">₹{Number(p.startingPrice).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ night</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">Price on request</span>
                <span className="text-base font-bold text-teal-700">Enquire now</span>
              </div>
            )}
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 border border-teal-300 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 px-4 py-2 rounded-full transition-colors">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── FilterPanel (used in sidebar + mobile drawer) ─── */
function FilterPanel({ filters, set, allTypes, cities, reset, hasActive }: any) {
  const Pill = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
        active ? 'wg-grad-teal text-white wg-shadow-soft' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
  const Group = ({ title, children }: any) => (
    <div className="pb-5 mb-5 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="font-display text-lg font-semibold text-slate-900">Filters</p>
        {hasActive && (
          <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Property type */}
      {allTypes.length > 0 && (
        <Group title="Property type">
          <div className="flex flex-wrap gap-2">
            {allTypes.map((t: string) => {
              const Icon = typeIcon(t);
              const active = filters.types.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => set('types', active ? filters.types.filter((x: string) => x !== t) : [...filters.types, t])}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active ? 'wg-grad-teal text-white wg-shadow-soft' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {typeLabel(t)}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {/* Price */}
      <Group title="Price per night">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p, i) => <Pill key={p.label} active={filters.priceIdx === i} onClick={() => set('priceIdx', i)}>{p.label}</Pill>)}
        </div>
      </Group>

      {/* Guests */}
      <Group title="Guests">
        <div className="flex flex-wrap gap-2">
          {GUEST_PRESETS.map((g, i) => <Pill key={g.label} active={filters.guestsIdx === i} onClick={() => set('guestsIdx', i)}>{g.label}</Pill>)}
        </div>
      </Group>

      {/* Nights */}
      <Group title="Length of stay">
        <div className="flex flex-wrap gap-2">
          {NIGHT_PRESETS.map((n, i) => <Pill key={n.label} active={filters.nightsIdx === i} onClick={() => set('nightsIdx', i)}>{n.label}</Pill>)}
        </div>
      </Group>

      {/* City */}
      {cities.length > 0 && (
        <Group title="Destination">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filters.city}
              onChange={(e) => set('city', e.target.value)}
              className="appearance-none w-full h-10 pl-8 pr-8 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
            >
              <option value="">All destinations</option>
              {cities.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </Group>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function WanderPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    types: [] as string[],
    priceIdx: 0,
    guestsIdx: 0,
    nightsIdx: 0,
    city: '',
  });
  const set = (k: string, v: any) => setFilters((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch('/api/wander/properties?limit=100')
      .then((r) => r.json())
      .then((d) => setProperties(d?.success && Array.isArray(d.properties) ? d.properties : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const allTypes = useMemo(
    () => Array.from(new Set(properties.map((p) => p.propertyType).filter(Boolean))),
    [properties],
  );
  // Dedupe destinations case-insensitively (avoids "Goa" / "goa" showing twice); display title-cased.
  const cities = useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((p) => {
      if (!p.city) return;
      const norm = String(p.city).trim().toLowerCase();
      if (norm && !map.has(norm)) {
        map.set(norm, norm.replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [properties]);

  const filtered = useMemo(() => {
    const price = PRICE_PRESETS[filters.priceIdx];
    const guests = GUEST_PRESETS[filters.guestsIdx];
    const nights = NIGHT_PRESETS[filters.nightsIdx];
    let list = properties.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!(`${p.name} ${p.city} ${p.state} ${p.agencyName}`.toLowerCase().includes(q))) return false;
      }
      if (filters.types.length && !filters.types.includes(p.propertyType)) return false;
      if (filters.city && String(p.city || '').trim().toLowerCase() !== filters.city) return false;
      if (price.min != null && !(p.startingPrice >= price.min)) return false;
      if (price.max != null && !(p.startingPrice > 0 && p.startingPrice <= price.max)) return false;
      if (guests.min && !(p.maxGuests && p.maxGuests >= guests.min)) return false;
      if (nights.min && p.maxNights && p.maxNights < nights.min) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'priceAsc') return (a.startingPrice || 1e12) - (b.startingPrice || 1e12);
      if (sortBy === 'priceDesc') return (b.startingPrice || 0) - (a.startingPrice || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return list;
  }, [properties, search, sortBy, filters]);

  const hasActive = filters.types.length > 0 || filters.priceIdx !== 0 || filters.guestsIdx !== 0 || filters.nightsIdx !== 0 || !!filters.city;
  const reset = () => setFilters({ types: [], priceIdx: 0, guestsIdx: 0, nightsIdx: 0, city: '' });

  return (
    <div className="stays-premium min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img src="/wander/luxury.jpg" alt="" className="w-full h-full object-cover wg-kenburns opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-16">
          <div className="inline-flex items-center gap-2 wg-glass text-slate-700 text-[11px] font-semibold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Stays by verified travel agents
          </div>
          <h1 className="font-display text-white leading-[1.05] tracking-tight mb-4" style={{ fontSize: 'clamp(2.5rem,5.5vw,4.5rem)' }}>
            Handpicked <span className="wg-text-teal">stays</span> for every journey
          </h1>
          <p className="text-white/75 text-base sm:text-lg max-w-xl mb-8">
            Resorts, homestays, villas &amp; more — curated by trusted local agencies across India.
          </p>
          {/* Search */}
          <div className="relative max-w-xl flex bg-white rounded-2xl p-1.5 wg-shadow-lift ring-1 ring-black/5">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stays, city or agency..."
                className="w-full h-11 pl-12 pr-4 bg-transparent text-slate-900 placeholder-slate-500 rounded-xl focus:outline-none text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-3xl border border-slate-100 wg-shadow-soft p-6">
              <FilterPanel filters={filters} set={set} allTypes={allTypes} cities={cities} reset={reset} hasActive={hasActive} />
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-8">
              <div>
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-[0.2em] mb-1">All Stays</p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
                  {loading ? 'Loading stays...' : `${filtered.length} ${filtered.length === 1 ? 'stay' : 'stays'}`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-medium border bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                </button>
                {/* Sort */}
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none h-10 pl-8 pr-8 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[340px] rounded-3xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-3xl">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hotel className="w-10 h-10 text-teal-300" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No stays match your filters</h3>
                <p className="text-sm text-slate-400 mb-6">Try widening your search or clearing filters.</p>
                <button onClick={() => { reset(); setSearch(''); }} className="px-6 py-2.5 wg-grad-teal text-white rounded-xl text-sm font-semibold hover:wg-shadow-glow transition">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 2) * 90} className="h-full">
                    <PropertyCard p={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm bg-white shadow-2xl overflow-y-auto p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg font-semibold text-slate-900">Filters</p>
              <button onClick={() => setShowFilters(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FilterPanel filters={filters} set={set} allTypes={allTypes} cities={cities} reset={reset} hasActive={hasActive} />
            <button
              onClick={() => setShowFilters(false)}
              className="mt-6 w-full py-3 wg-grad-teal text-white font-semibold rounded-2xl text-sm"
            >
              Show {filtered.length} {filtered.length === 1 ? 'stay' : 'stays'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
