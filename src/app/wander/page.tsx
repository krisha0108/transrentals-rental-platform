// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass, Search, MapPin, Clock, Users, ChevronDown, Calendar, Star,
  Loader2, ArrowRight, Sparkles, Globe, Heart, Shield,
  SlidersHorizontal, X, TrendingUp, ArrowUpDown, ChevronRight, Layers, CalendarDays,
  ArrowUpRight, ShieldCheck, BadgeCheck,
  // vector icons replacing emojis (each used once — no repeats)
  Sunrise, Tent, Waves, Palette, Bird, Landmark, Camera, Bike,
  Umbrella, MountainSnow, Trees, Mountain, Map as MapIcon, MessageSquare, Rocket,
  Building2, PawPrint, Castle, Flower2, Package, MapPinned, Award, Telescope,
  LayoutGrid, UserCheck, HeartHandshake, Gem, Sailboat, Fish, Church, Snowflake,
  Footprints, Flame, Aperture, Route, Tag, Hotel,
} from 'lucide-react';

/* ─── constants ────────────────────────────────────── */
const FALLBACK_CATEGORIES = [
  { id: 'f1', name: 'Adventure', icon: '🏔️' },
  { id: 'f2', name: 'Beach & Coastal', icon: '🏖️' },
  { id: 'f3', name: 'Pilgrimage', icon: '🛕' },
  { id: 'f4', name: 'Heritage & Culture', icon: '🏯' },
  { id: 'f5', name: 'Wildlife', icon: '🦁' },
  { id: 'f6', name: 'Hill Stations', icon: '⛰️' },
];

const VIBES = [
  { icon: Sunrise, label: 'Sunrise Treks' },
  { icon: Tent, label: 'Camping' },
  { icon: Waves, label: 'Scuba & Water' },
  { icon: Palette, label: 'Cultural' },
  { icon: Bird, label: 'Paragliding' },
  { icon: Landmark, label: 'Spiritual' },
  { icon: Camera, label: 'Photography' },
  { icon: Bike, label: 'Cycling' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'priceAsc', label: 'Price: Low → High' },
  { value: 'priceDesc', label: 'Price: High → Low' },
];

const PRICE_PRESETS = [
  { label: 'Any Price', min: null, max: null },
  { label: 'Under ₹2K', min: null, max: 2000 },
  { label: '₹2K – ₹5K', min: 2000, max: 5000 },
  { label: '₹5K – ₹10K', min: 5000, max: 10000 },
  { label: '₹10K+', min: 10000, max: null },
];

const DESTINATIONS = [
  { name: 'Goa', icon: Umbrella, img: '/wander/goa.jpg' },
  { name: 'Leh-Ladakh', icon: MountainSnow, img: '/wander/leh.jpg' },
  { name: 'Rajasthan', icon: Castle, img: '/wander/rajasthan.jpg' },
  { name: 'Kerala', icon: Trees, img: '/wander/kerala.jpg' },
  { name: 'Himachal', icon: Mountain, img: '/wander/spiti.jpg' },
  { name: 'Uttarakhand', icon: Flower2, img: '/wander/roadtrip.jpg' },
];

const WHY_WANDER = [
  { icon: UserCheck, title: 'Verified Vendors', desc: 'All tour operators are vetted and background-checked.' },
  { icon: MapIcon, title: '150+ Destinations', desc: 'From Leh to Kerala, we cover India end to end.' },
  { icon: HeartHandshake, title: 'Personalised Quotes', desc: 'Get custom quotes tailored to your group and dates.' },
  { icon: Gem, title: 'Curated Experiences', desc: 'Handpicked tours across every category and budget.' },
];

const GALLERY = [
  { img: '/wander/leh.jpg', label: 'Leh · Ladakh', place: 'Ladakh' },
  { img: '/wander/kerala.jpg', label: 'Backwaters · Kerala', place: 'Kerala' },
  { img: '/wander/rajasthan.jpg', label: 'Jaisalmer · Rajasthan', place: 'Rajasthan' },
  { img: '/wander/spiti.jpg', label: 'Spiti Valley', place: 'Spiti' },
  { img: '/wander/goa.jpg', label: 'Beaches · Goa', place: 'Goa' },
  { img: '/wander/wildlife.jpg', label: 'Wildlife Safari', place: 'Wildlife' },
];

/* ─── Category → vector icon (maps DB/fallback category names to SVG) ── */
function catIconFor(name = '') {
  const n = String(name).toLowerCase();
  if (/beach|coast|goa/.test(n)) return Sailboat;
  if (/water|scuba|river|lake|dive/.test(n)) return Fish;
  if (/pilgrim|spiritual|temple|religio|dham|yatra/.test(n)) return Church;
  if (/heritage|culture|histor|fort|palace/.test(n)) return Building2;
  if (/wildlife|safari|jungle|nature|forest/.test(n)) return PawPrint;
  if (/hill|snow|ladakh|leh|spiti/.test(n)) return Snowflake;
  if (/adventure|trek|mountain|hike/.test(n)) return Footprints;
  if (/camp/.test(n)) return Flame;
  if (/photo/.test(n)) return Aperture;
  if (/cycl|bike/.test(n)) return Route;
  return Tag; // sensible default
}

function CatIcon({ name, className = 'w-4 h-4' }: { name?: string; className?: string }) {
  const Icon = catIconFor(name);
  return <Icon className={className} />;
}

/* ─── Premium design tokens + animations (scoped to .wander-premium) ── */
const WANDER_STYLES = `
.wander-premium{
  --w-bg:#FAFAF8; --w-ink:#111827; --w-ink-soft:#475569;
  --w-teal:#0F766E; --w-teal-bright:#14B8A6; --w-gold:#F59E0B; --w-sand:#F1EEE8;
  --w-shadow-soft:0 1px 2px rgba(15,23,42,.05), 0 12px 30px -16px rgba(15,23,42,.18);
  --w-shadow-lift:0 6px 14px -8px rgba(15,23,42,.14), 0 30px 60px -28px rgba(15,23,42,.30);
  --w-shadow-glow:0 10px 46px -10px rgba(15,118,110,.45);
  background:var(--w-bg); color:var(--w-ink);
  font-feature-settings:"ss01","cv11"; -webkit-font-smoothing:antialiased;
}
.wander-premium .font-display{
  font-family:var(--font-display),"Fraunces",Georgia,"Times New Roman",serif;
  letter-spacing:-.02em; font-weight:600;
}
.wander-premium .wg-glass{
  background:rgba(255,255,255,.72); backdrop-filter:blur(22px) saturate(165%);
  -webkit-backdrop-filter:blur(22px) saturate(165%);
  border:1px solid rgba(255,255,255,.6); box-shadow:var(--w-shadow-soft);
}
.wander-premium .wg-glass-dark{
  background:rgba(9,14,24,.36); backdrop-filter:blur(18px) saturate(150%);
  -webkit-backdrop-filter:blur(18px) saturate(150%);
  border:1px solid rgba(255,255,255,.16);
}
.wander-premium .wg-grad-teal{ background-image:linear-gradient(135deg,#0F766E,#14B8A6); }
.wander-premium .wg-grad-warm{ background-image:linear-gradient(135deg,#F59E0B,#EA580C); }
.wander-premium .wg-text-teal{
  background-image:linear-gradient(120deg,#0F766E,#14B8A6 60%,#5EEAD4);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.wander-premium .wg-text-gold{
  background-image:linear-gradient(120deg,#F59E0B,#FBBF24);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.wander-premium .wg-shadow-soft{ box-shadow:var(--w-shadow-soft); }
.wander-premium .wg-shadow-lift{ box-shadow:var(--w-shadow-lift); }
.wander-premium .wg-shadow-glow{ box-shadow:var(--w-shadow-glow); }
.wander-premium .wg-lift{ transition:transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s cubic-bezier(.2,.8,.2,1); }
.wander-premium .wg-lift:hover{ transform:translateY(-6px); box-shadow:var(--w-shadow-lift); }
.wander-premium .wg-zoom{ overflow:hidden; }
.wander-premium .wg-zoom img{ transition:transform 1s cubic-bezier(.2,.8,.2,1); }
.wander-premium .wg-zoom:hover img{ transform:scale(1.08); }
/* hover helpers for custom (non-Tailwind) classes */
.wander-premium .wg-hover-teal{ transition:background .3s, color .3s, box-shadow .3s; }
.wander-premium .group:hover .wg-hover-teal{ background:linear-gradient(135deg,#0F766E,#14B8A6); color:#fff; box-shadow:var(--w-shadow-glow); }
.wander-premium .wg-glow-hover{ transition:box-shadow .3s, transform .3s; }
.wander-premium .wg-glow-hover:hover{ box-shadow:var(--w-shadow-glow); }
.wander-premium input[type="date"]::-webkit-calendar-picker-indicator{ opacity:.5; cursor:pointer; transition:opacity .2s; }
.wander-premium input[type="date"]:hover::-webkit-calendar-picker-indicator{ opacity:.85; }
.wander-premium .wg-reveal{ opacity:0; }
.wander-premium .wg-reveal.wg-in{ animation:wg-fade-up .8s cubic-bezier(.2,.8,.2,1) both; }
@keyframes wg-fade-up{ from{opacity:0; transform:translateY(26px);} to{opacity:1; transform:translateY(0);} }
@keyframes wg-kenburns{ 0%{transform:scale(1.08) translate(0,0);} 100%{transform:scale(1.19) translate(-1.8%,-1.2%);} }
.wander-premium .wg-kenburns{ animation:wg-kenburns 16s ease-in-out infinite alternate; }
@keyframes wg-float{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
.wander-premium .wg-float{ animation:wg-float 6s ease-in-out infinite; }
@keyframes wg-shine{ 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
@media (prefers-reduced-motion:reduce){
  .wander-premium .wg-reveal, .wander-premium .wg-reveal.wg-in{ opacity:1 !important; animation:none !important; }
  .wander-premium .wg-kenburns, .wander-premium .wg-float{ animation:none !important; }
}
`;

/* ─── Reveal on scroll ─────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // replay the fade-up every time it enters the viewport
            e.target.classList.remove('wg-in');
            void (e.target as HTMLElement).offsetWidth; // force reflow → restart animation
            e.target.classList.add('wg-in');
          } else {
            // reset when it leaves so it animates again next scroll
            e.target.classList.remove('wg-in');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`wg-reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── CountUp ──────────────────────────────────────── */
function CountUp({ to, duration = 1600 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setV(Math.round(to * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{v.toLocaleString('en-IN')}</span>;
}

/* ─── Section eyebrow ──────────────────────────────── */
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] ${light ? 'text-teal-300' : 'text-teal-700'}`}>
      <span className={`h-px w-8 ${light ? 'bg-teal-300/60' : 'bg-teal-600/50'}`} /> {children}
    </div>
  );
}

/* ─── ExperienceCard ───────────────────────────────── */
function ExperienceCard({ exp }: { exp: any }) {
  const [imgError, setImgError] = useState(false);
  const popular = (exp.vendorCount ?? 0) >= 3;
  const hasPrice = exp.minPrice !== null && exp.minPrice !== undefined;
  const showImg = exp.coverImage && !imgError;

  return (
    <Link
      href={`/wander/experiences/${exp.slug}`}
      className="group wg-lift h-full bg-white rounded-3xl overflow-hidden wg-shadow-soft border border-slate-100 flex flex-col"
    >
      {/* Image */}
      <div className="wg-zoom relative h-52 bg-gradient-to-br from-teal-50 to-amber-50 overflow-hidden flex-shrink-0">
        {showImg ? (
          <img src={exp.coverImage} alt={exp.title} onError={() => setImgError(true)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon name={exp.category?.name} className="w-16 h-16 text-teal-300/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        {exp.category && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-full shadow-sm">
              <CatIcon name={exp.category.name} className="w-3.5 h-3.5 text-teal-700" /> {exp.category.name}
            </span>
          </div>
        )}
        {popular && (
          <div className="absolute top-3 right-3 wg-grad-warm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <TrendingUp className="w-2.5 h-2.5" /> Popular
          </div>
        )}
        {exp.location?.name && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 text-white text-xs font-medium drop-shadow">
              <MapPin className="w-3 h-3" /> {exp.location.name}
            </span>
          </div>
        )}
        {/* "X vendors" badge */}
        {exp.vendorCount > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 bg-teal-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Users className="w-2.5 h-2.5" /> {exp.vendorCount} vendor{exp.vendorCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-slate-900 text-[15px] leading-snug mb-1 line-clamp-2 group-hover:text-teal-700 transition-colors">
          {exp.title}
        </h3>
        {exp.description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2 flex-1">{exp.description}</p>
        )}
        {exp.duration && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3 text-teal-500" /> {exp.duration}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div>
            {hasPrice ? (
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Starting from</span>
                <span className="text-base font-black text-slate-900">₹{Number(exp.minPrice).toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Get Quotes</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 wg-hover-teal px-2.5 py-1 rounded-full">
            Compare <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── TourCard ─────────────────────────────────────── */
function TourCard({ listing, isWishlisted, onToggleWishlist }: { listing: any; isWishlisted?: boolean; onToggleWishlist?: (id: string) => void }) {
  const [vendorLogoError, setVendorLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const images: string[] = Array.isArray(listing.images) ? listing.images : (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const coverImg = images[0] || null;
  const showCover = coverImg && !coverError;

  // Parse priceTiers for GROUP_BASED pricing
  const priceTiers: any[] = (() => {
    try { return JSON.parse(listing.priceTiers || '[]'); } catch { return []; }
  })();
  const minTierPrice = priceTiers.length > 0 ? Math.min(...priceTiers.map((t: any) => Number(t.price))) : null;

  const isGroupBased = listing.priceType === 'PER_GROUP';
  const isOnRequest = listing.priceType === 'ON_REQUEST';

  let priceLabel: string;
  let priceSuffix: string;
  let isStartingFrom = false;

  if (isGroupBased && minTierPrice !== null) {
    priceLabel = `₹${minTierPrice.toLocaleString('en-IN')}`;
    priceSuffix = '/group';
    isStartingFrom = true;
  } else if (!isOnRequest && listing.basePrice) {
    priceLabel = `₹${Number(listing.basePrice).toLocaleString('en-IN')}`;
    priceSuffix = listing.priceType === 'PER_PERSON' ? '/person' : isGroupBased ? '/group' : '';
  } else {
    priceLabel = '';
    priceSuffix = '';
  }

  const showCustomQuote = !priceLabel;
  const popular = (listing._count?.quoteRequests ?? 0) >= 3;

  // Presentational detail rows built from existing fields (no logic change)
  const details: [string, string][] = [];
  if (listing.duration) details.push(['Duration', String(listing.duration)]);
  if (listing.mainLocation?.name) details.push(['Location', String(listing.mainLocation.name)]);
  if (listing.tourStartDate) {
    const s = new Date(listing.tourStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const e = listing.tourEndDate && listing.tourEndDate !== listing.tourStartDate
      ? ` – ${new Date(listing.tourEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : '';
    details.push(['Dates', s + e]);
  } else if (listing.rating > 0) {
    details.push(['Rating', `${listing.rating} ★`]);
  }
  const detailRows = details.slice(0, 3);
  const desc = String(listing.shortDescription || listing.description || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <Link
      href={`/wander/${listing.slug || listing.id}`}
      className="group wg-lift h-full flex flex-col bg-white rounded-3xl overflow-hidden wg-shadow-soft border border-slate-100 hover:border-teal-200/70"
    >
      {/* Image */}
      <div className="wg-zoom relative h-52 bg-gradient-to-br from-slate-800 to-teal-900 overflow-hidden flex-shrink-0">
        {showCover ? (
          <img
            src={coverImg}
            alt={listing.title}
            onError={() => setCoverError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950">
            <CatIcon name={listing.category?.name} className="w-20 h-20 text-white/20" />
          </div>
        )}

        {/* Subtle top gradient for badge legibility */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />

        {/* Top bar: Category (left) + Hot + Wishlist (right) */}
        <div className="absolute top-0 left-0 right-0 p-3.5 flex items-start justify-between">
          {listing.category && (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-slate-700 px-3 py-1.5 rounded-full shadow-sm">
              <CatIcon name={listing.category.name} className="w-3.5 h-3.5 text-teal-700" /> {listing.category.name}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {popular && (
              <div className="wg-grad-warm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                <TrendingUp className="w-2.5 h-2.5" /> Hot
              </div>
            )}
            {onToggleWishlist && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(listing.id); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm backdrop-blur-md border ${
                  isWishlisted
                    ? 'bg-rose-500 text-white border-rose-400 scale-105'
                    : 'bg-white/85 text-slate-600 border-white/60 hover:text-rose-500 hover:bg-white hover:scale-105'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content below image */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title — up to 2 lines, fixed height so every card aligns */}
        <h3 className="font-display font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.1rem] group-hover:text-teal-700 transition-colors">
          {listing.title}
        </h3>

        {/* Detail rows */}
        {detailRows.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 flex-shrink-0">{label}</span>
                <span className="text-xs font-medium text-slate-700 truncate text-right">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom group — operator + price pinned together at the bottom */}
        <div className="mt-auto pt-4">
          {/* Operator + Verified badge */}
          {listing.vendor?.businessName && (
            <div className="mb-4 flex items-center gap-2">
              {listing.vendor.logo && !vendorLogoError ? (
                <img src={listing.vendor.logo} alt="" onError={() => setVendorLogoError(true)} className="w-5 h-5 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-200" />
              ) : (
                <span className="w-5 h-5 rounded-full wg-grad-teal flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white">
                  {listing.vendor.businessName[0]?.toUpperCase()}
                </span>
              )}
              <span className="text-xs text-slate-500 truncate">{listing.vendor.businessName}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex-shrink-0">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            </div>
          )}

          {/* FROM + price (left) + View Tour pill (right) */}
          <div className="pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
            {showCustomQuote ? (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">Price on request</span>
                <span className="text-base font-bold text-teal-700">Get Free Quote</span>
              </div>
            ) : (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">{isStartingFrom ? 'Starting from' : 'From'}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 tracking-tight">{priceLabel}</span>
                  {priceSuffix && <span className="text-xs text-slate-400">{priceSuffix}</span>}
                </div>
              </div>
            )}
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 border border-teal-300 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 px-4 py-2 rounded-full transition-colors">
              View Tour <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── ReviewCard (click quote to expand full text) ──── */
function ReviewCard({ t }: { t: any }) {
  const [expanded, setExpanded] = useState(false);
  const [truncatable, setTruncatable] = useState(false);
  const quoteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = quoteRef.current;
    if (el) setTruncatable(el.scrollHeight > el.clientHeight + 2);
  }, []);

  return (
    <article className="flex h-full flex-col justify-between bg-white rounded-3xl p-6 border border-slate-100 wg-shadow-soft wg-lift">
      <div>
        {/* Stars */}
        <div className="mb-3 flex items-center gap-1 text-amber-400">
          {[...Array(t.rating)].map((_, si) => (
            <Star key={si} className="w-4 h-4 fill-current" />
          ))}
        </div>
        {/* Quote — serif, click to expand full text */}
        <p
          ref={quoteRef}
          onClick={() => truncatable && setExpanded(v => !v)}
          className={`font-display text-base leading-snug tracking-tight text-slate-900 ${expanded ? '' : 'line-clamp-4'} ${truncatable ? 'cursor-pointer' : ''}`}
          title={truncatable ? (expanded ? 'Click to collapse' : 'Click to read full review') : undefined}
        >
          &ldquo;{t.text}&rdquo;
        </p>
        {truncatable && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="mt-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      <div className="mt-5">
        {/* 3-photo strip */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {t.gallery.map((g: string, k: number) => (
            <div key={k} className="wg-zoom aspect-square overflow-hidden rounded-xl">
              <img src={g} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {/* Reviewer */}
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
            {t.avatar}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              {t.name} <BadgeCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            </div>
            <div className="text-xs text-slate-400 truncate">{t.tour} · {t.location}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function WanderHomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [galleryProps, setGalleryProps] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [locationId, setLocationId] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [pricePreset, setPricePreset] = useState(0); // index into PRICE_PRESETS
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const listingsRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load customer ID + wishlist from localStorage
  useEffect(() => {
    try {
      const customerStr = localStorage.getItem('customer');
      if (!customerStr) return;
      const parsed = JSON.parse(customerStr);
      const id = parsed?.id || parsed?.customer_id || parsed?.customerId;
      if (!id) return;
      setCustomerId(id);
      fetch(`/api/wander/wishlist?customerId=${id}`)
        .then(r => r.json())
        .then(w => {
          const ids = new Set((w.wishlists || []).map((x: any) => x.listingId));
          setWishlistedIds(ids);
        })
        .catch(() => {});
    } catch {}
  }, []);

  const toggleWishlist = async (listingId: string) => {
    if (!customerId) {
      window.location.href = '/customer/login';
      return;
    }
    // Optimistic toggle
    setWishlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    try {
      await fetch('/api/wander/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, listingId }),
      });
    } catch {
      // Revert on error
      setWishlistedIds(prev => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
    }
  };

  // load categories + locations once
  useEffect(() => {
    fetch('/api/wander/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : FALLBACK_CATEGORIES))
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setLoading(false));
    fetch('/api/wander/locations')
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d) ? d : []))
      .catch(() => setLocations([]));
    fetch('/api/wander/experiences')
      .then(r => r.json())
      .then(d => setExperiences(Array.isArray(d) ? d : []))
      .catch(() => setExperiences([]));
    // Travel-agent properties → shown inside the Wander Gallery section
    fetch('/api/wander/properties?limit=20')
      .then(r => r.json())
      .then(d => setGalleryProps(d?.success && Array.isArray(d.properties) ? d.properties : []))
      .catch(() => setGalleryProps([]));
  }, []);

  const activeCatsKey = activeCats.join(',');

  // build query params
  const buildParams = useCallback((p = 1) => {
    const params = new URLSearchParams({ limit: '12', page: String(p), sortBy });
    if (activeCats.length) {
      // Separate parent IDs from sub IDs so API can AND them
      const parentIds = categories.map((c: any) => c.id);
      const selParents = activeCats.filter(id => parentIds.includes(id));
      const selSubs = activeCats.filter(id => !parentIds.includes(id));
      if (selParents.length) params.set('categoryIds', selParents.join(','));
      if (selSubs.length) params.set('subCategoryIds', selSubs.join(','));
    }
    if (locationId) params.set('locationId', locationId);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const preset = PRICE_PRESETS[pricePreset];
    if (preset.min !== null) params.set('priceMin', String(preset.min));
    if (preset.max !== null) params.set('priceMax', String(preset.max));
    return params;
  }, [activeCatsKey, locationId, search, sortBy, pricePreset, categories, dateFrom, dateTo]);

  // fetch listings whenever filters change (reset to page 1)
  useEffect(() => {
    setListingsLoading(true);
    setPage(1);
    fetch(`/api/wander/listings?${buildParams(1).toString()}`)
      .then(r => r.json())
      .then(d => {
        setListings(d.listings || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [buildParams]);

  // load more
  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/wander/listings?${buildParams(nextPage).toString()}`);
      const d = await res.json();
      setListings(prev => [...prev, ...(d.listings || [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  // flat list of all cats + subcats for label lookup
  const allCatsFlat = [...categories, ...categories.flatMap(c => c.subCategories || [])];

  const toggleCat = (id: string, isParent = false) => {
    setActiveCats(prev => {
      if (prev.includes(id)) {
        if (isParent) {
          // deselecting parent → also remove its subs
          const subIds = (categories.find(c => c.id === id)?.subCategories || []).map((s: any) => s.id);
          return prev.filter(x => x !== id && !subIds.includes(x));
        }
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // sub-categories to show: union of subs from selected parents
  const visibleSubCats = categories
    .filter(c => activeCats.includes(c.id) && c.subCategories?.length > 0)
    .flatMap(c => c.subCategories);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setActiveCats([]);
    setLocationId('');
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setVibe = (label: string) => {
    setSearchInput(label);
    setSearch(label);
    setActiveCats([]);
    setLocationId('');
    listingsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearch('');
    setSearchInput('');
    setActiveCats([]);
    setLocationId('');
    setSortBy('newest');
    setPricePreset(0);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || activeCats.length > 0 || locationId || sortBy !== 'newest' || pricePreset !== 0 || dateFrom || dateTo;
  const activeLabel = activeCats.length === 0
    ? (search ? `"${search}"` : 'All Tours')
    : activeCats.length === 1
      ? `${allCatsFlat.find(c => c.id === activeCats[0])?.name || ''}`.trim()
      : `${activeCats.length} categories selected`;

  return (
    <div className="wander-premium min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: WANDER_STYLES }} />

      {/* ══════════════════════════════════════════════════
          HERO — full-bleed editorial
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[94vh] flex items-center overflow-hidden bg-slate-950">
        {/* Background image with Ken Burns */}
        <div className="absolute inset-0">
          <img src="/wander/hero.jpg" alt="Himalayan range at golden hour" className="w-full h-full object-cover wg-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/35 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-28 pt-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 wg-glass-dark text-white/90 text-[11px] font-semibold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8 wg-reveal wg-in">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Curated by locals · Loved by 10,000+ travellers
              </div>
              <h1 className="font-display text-white leading-[1.0] tracking-tight mb-6" style={{ fontSize: 'clamp(2.75rem,6vw,5rem)' }}>
                Explore India <em className="not-italic wg-text-teal">beyond</em>
                <br /> the ordinary.
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
                Unforgettable road trips, curated tours &amp; hidden destinations —
                get custom quotes from <span className="text-white font-medium">verified local operators</span>.
              </p>

              {/* Search bar */}
              <form onSubmit={applySearch} className="relative max-w-xl mb-8">
                <div className="relative flex bg-white rounded-2xl p-1.5 wg-shadow-lift ring-1 ring-black/5">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="Where do you want to go?"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent text-slate-900 placeholder-slate-500 rounded-xl focus:outline-none text-sm"
                    />
                    {searchInput && (
                      <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button type="submit" className="ml-1 px-7 py-3.5 wg-grad-teal wg-glow-hover text-white font-semibold rounded-xl transition text-sm whitespace-nowrap">
                    Search
                  </button>
                </div>
              </form>

              {/* Vibe pills */}
              <div className="flex flex-wrap gap-2">
                {VIBES.map(v => (
                  <button
                    key={v.label}
                    onClick={() => setVibe(v.label)}
                    className="flex items-center gap-1.5 wg-glass-dark text-white/80 hover:text-white text-xs px-3.5 py-2 rounded-full transition-all"
                  >
                    <v.icon className="w-3.5 h-3.5 text-teal-300" /> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { n: 500, s: '+', label: 'Tour Packages', icon: Package },
                { n: 150, s: '+', label: 'Destinations', icon: MapPinned },
                { n: 200, s: '+', label: 'Verified Vendors', icon: ShieldCheck },
                { n: null, s: '4.8★', label: 'Average Rating', icon: Award },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="wg-glass-dark rounded-2xl p-6 wg-lift wg-reveal wg-in"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="mb-3 flex"><s.icon className="w-6 h-6 text-teal-300" /></span>
                  <p className="font-display text-3xl font-semibold text-white mb-1">
                    {s.n !== null ? <><CountUp to={s.n} />{s.s}</> : s.s}
                  </p>
                  <p className="text-xs text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile stats strip */}
          <div className="lg:hidden flex flex-wrap gap-6 mt-14 pt-8 border-t border-white/10">
            {[
              { n: '500+', label: 'Packages' },
              { n: '150+', label: 'Destinations' },
              { n: '200+', label: 'Vendors' },
              { n: '4.8★', label: 'Rating' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-xl font-semibold text-white">{s.n}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MY GROUP TRIPS BANNER (logged-in customers only)
      ══════════════════════════════════════════════════ */}
      {customerId && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <Link
              href="/customer/wander-groups"
              className="flex items-center gap-3 px-5 py-3 wg-grad-teal rounded-2xl text-white transition-all duration-200 wg-shadow-soft wg-glow-hover hover:scale-[1.01] group"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">My Group Trips</p>
                <p className="text-xs text-white/80 leading-tight">Plan trips with your friends &amp; family</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STICKY FILTER BAR
      ══════════════════════════════════════════════════ */}
      <div ref={filterBarRef} className="sticky top-3 z-30 px-3 sm:px-6 -mt-10">
        <div className="font-display max-w-6xl mx-auto wg-glass rounded-[1.75rem] wg-shadow-lift ring-1 ring-black/5 px-4 sm:px-6">

          {/* Row 1: Categories + Search + Filters toggle */}
          <div className="flex items-center gap-3 py-3">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
              <button
                onClick={() => { setActiveCats([]); setSearch(''); setSearchInput(''); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeCats.length === 0 && !search
                    ? 'wg-grad-teal text-white wg-shadow-soft'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> All
              </button>
              {(loading ? FALLBACK_CATEGORIES : categories).map(cat => {
                const isActive = activeCats.includes(cat.id);
                const hasSubs = (cat.subCategories?.length ?? 0) > 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { toggleCat(cat.id, true); setSearch(''); setSearchInput(''); }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'wg-grad-teal text-white wg-shadow-soft'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    <CatIcon name={cat.name} className="w-3.5 h-3.5" /> {cat.name}
                    {hasSubs && <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isActive ? 'rotate-180 text-white/80' : 'text-slate-400'}`} />}
                  </button>
                );
              })}
            </div>

            {/* Filter toggle + View toggle + Reset */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                  showFilters || hasActiveFilters
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </button>
              <button
                onClick={() => setViewMode(v => v === 'grid' ? 'calendar' : 'grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                  viewMode === 'calendar'
                    ? 'wg-grad-teal text-white border-transparent wg-shadow-soft'
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{viewMode === 'calendar' ? 'Grid View' : 'Calendar'}</span>
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 border border-rose-100 transition-all"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Sub-categories (shown when parent with subs is selected) */}
          {visibleSubCats.length > 0 && (
            <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto scrollbar-hide">
              <span className="flex-shrink-0 text-[10px] font-bold text-teal-500 uppercase tracking-widest mr-1">Sub:</span>
              {visibleSubCats.map((sub: any) => {
                const isActive = activeCats.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleCat(sub.id)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-teal-100 text-teal-700 border-teal-300 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600'
                    }`}
                  >
                    <CatIcon name={sub.name} className="w-3 h-3" /> {sub.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced filters panel (collapsible) */}
          {showFilters && (
            <div className="pb-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">

                {/* Search */}
                <form onSubmit={applySearch} className="relative min-w-[160px] max-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search tours..."
                    className="w-full h-10 pl-8 pr-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-slate-50/50 transition-all"
                  />
                </form>

                {/* Location */}
                <div ref={locationDropdownRef} className="relative flex-shrink-0">
                  <button
                    onClick={() => { setLocationOpen(o => !o); setLocationSearch(''); }}
                    className={`flex items-center gap-1.5 h-10 px-3.5 text-xs border rounded-xl transition-all ${
                      locationId
                        ? 'border-teal-300 bg-teal-50 text-teal-700 font-semibold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="max-w-[110px] truncate">
                      {locationId ? locations.find((l: any) => l.id === locationId)?.name || 'Location' : 'All Locations'}
                    </span>
                    {locationId
                      ? <X className="w-3 h-3 ml-1 text-teal-400 hover:text-teal-700" onClick={e => { e.stopPropagation(); setLocationId(''); setLocationOpen(false); }} />
                      : <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`} />
                    }
                  </button>
                  {locationOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden">
                      <div className="p-2.5 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            value={locationSearch}
                            onChange={e => setLocationSearch(e.target.value)}
                            placeholder="Search location..."
                            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-slate-50"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1">
                        <button
                          onClick={() => { setLocationId(''); setLocationOpen(false); }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2 transition-colors rounded-lg mx-1 ${
                            !locationId ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          style={{ width: 'calc(100% - 8px)' }}
                        >
                          <Globe className="w-3.5 h-3.5" /> All Locations
                        </button>
                        {locations.length === 0 && (
                          <p className="px-3 py-4 text-xs text-slate-400 text-center">No locations</p>
                        )}
                        {locations
                          .filter((loc: any) => loc.name.toLowerCase().includes(locationSearch.toLowerCase()))
                          .map((loc: any) => (
                            <button
                              key={loc.id}
                              onClick={() => { setLocationId(loc.id); setLocationOpen(false); }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2 transition-colors rounded-lg mx-1 ${
                                locationId === loc.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                              style={{ width: 'calc(100% - 8px)' }}
                            >
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {loc.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="relative flex-shrink-0">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none h-10 pl-8 pr-8 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 cursor-pointer transition-all"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className={`h-10 px-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-[158px] transition-all ${
                        dateFrom ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 bg-slate-50/50 text-slate-600'
                      }`}
                      title="From date"
                    />
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className={`h-10 px-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-[158px] transition-all ${
                        dateTo ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 bg-slate-50/50 text-slate-600'
                      }`}
                      title="To date"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Price presets — own row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-0.5">Budget</span>
                {PRICE_PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setPricePreset(i)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      pricePreset === i
                        ? 'wg-grad-teal text-white wg-shadow-soft'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          LISTINGS
      ══════════════════════════════════════════════════ */}
      <section ref={listingsRef} className="py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <Eyebrow>{activeLabel}</Eyebrow>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
                {listingsLoading
                  ? 'Loading tours...'
                  : total > 0
                    ? `${total} tour${total !== 1 ? 's' : ''} found`
                    : 'No tours found'}
              </h2>
            </div>
          </div>

          {/* Grid */}
          {listingsLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-3xl">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-teal-300" />
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No tours found</h3>
              <p className="text-sm text-slate-400 mb-6">
                {search ? `No results for "${search}". Try a different keyword.` : 'No active tours in this category yet.'}
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 wg-grad-teal wg-glow-hover text-white rounded-xl text-sm font-semibold transition"
              >
                Browse All Tours
              </button>
            </div>
          ) : viewMode === 'calendar' ? (
            /* ── Calendar View ── */
            <div>
              {(() => {
                // Group listings by month
                const toursWithDates = listings.filter(l => l.tourStartDate);
                const toursWithoutDates = listings.filter(l => !l.tourStartDate);
                const monthGroups: Record<string, any[]> = {};

                toursWithDates.forEach(l => {
                  const d = new Date(l.tourStartDate);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  if (!monthGroups[key]) monthGroups[key] = [];
                  monthGroups[key].push(l);
                });

                const sortedMonths = Object.keys(monthGroups).sort();

                return (
                  <div className="space-y-12">
                    {sortedMonths.map(monthKey => {
                      const [y, m] = monthKey.split('-').map(Number);
                      const monthName = new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                      const monthListings = monthGroups[monthKey].sort(
                        (a: any, b: any) => new Date(a.tourStartDate).getTime() - new Date(b.tourStartDate).getTime()
                      );

                      return (
                        <div key={monthKey}>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-baseline gap-2.5 flex-shrink-0">
                              <CalendarDays className="w-5 h-5 text-teal-600 self-center" />
                              <h3 className="font-display font-semibold text-slate-900 text-2xl">{monthName}</h3>
                              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">{monthListings.length} tour{monthListings.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                          </div>
                          <div className="space-y-3">
                            {monthListings.map((listing: any) => {
                              const images: string[] = Array.isArray(listing.images) ? listing.images : (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
                              const startD = new Date(listing.tourStartDate);
                              const endD = listing.tourEndDate ? new Date(listing.tourEndDate) : null;
                              return (
                                <Link
                                  key={listing.id}
                                  href={`/wander/${listing.slug || listing.id}`}
                                  className="flex items-stretch bg-white rounded-3xl border border-slate-100 wg-shadow-soft wg-lift overflow-hidden group"
                                >
                                  {/* Date badge */}
                                  <div className="w-24 flex-shrink-0 wg-grad-teal flex flex-col items-center justify-center text-white p-2">
                                    <span className="text-2xl font-black leading-none">{startD.getDate()}</span>
                                    <span className="text-[10px] uppercase tracking-wider mt-0.5">
                                      {startD.toLocaleDateString('en-IN', { month: 'short' })}
                                    </span>
                                    {endD && endD.getTime() !== startD.getTime() && (
                                      <>
                                        <span className="text-[10px] text-white/50 my-0.5">to</span>
                                        <span className="text-sm font-bold leading-none">{endD.getDate()}</span>
                                        <span className="text-[10px] uppercase tracking-wider">
                                          {endD.toLocaleDateString('en-IN', { month: 'short' })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {/* Image */}
                                  <div className="w-32 flex-shrink-0 bg-teal-50 overflow-hidden">
                                    {images[0] ? (
                                      <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Compass className="w-8 h-8 text-teal-200" />
                                      </div>
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
                                    {listing.category && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 mb-0.5"><CatIcon name={listing.category.name} className="w-3 h-3" /> {listing.category.name}</span>
                                    )}
                                    <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-teal-700 transition-colors">{listing.title}</h4>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                      {listing.mainLocation?.name && (
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.mainLocation.name}</span>
                                      )}
                                      {listing.duration && (
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{listing.duration}</span>
                                      )}
                                      {listing.vendor?.businessName && (
                                        <span className="text-slate-300">by {listing.vendor.businessName}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center pr-4">
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Tours without dates */}
                    {toursWithoutDates.length > 0 && (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex items-baseline gap-2.5 flex-shrink-0">
                            <Compass className="w-5 h-5 text-slate-400 self-center" />
                            <h3 className="font-display font-semibold text-slate-900 text-2xl">Anytime Tours</h3>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{toursWithoutDates.length} · no fixed dates</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {toursWithoutDates.map((listing, i) => (
                            <Reveal key={listing.id} delay={(i % 3) * 90} className="h-full">
                              <TourCard listing={listing} isWishlisted={wishlistedIds.has(listing.id)} onToggleWishlist={toggleWishlist} />
                            </Reveal>
                          ))}
                        </div>
                      </div>
                    )}

                    {listings.length > 0 && (
                      <p className="text-center text-xs text-slate-400 mt-4">Showing {listings.length} of {total} tours</p>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, i) => (
                  <Reveal key={listing.id} delay={(i % 3) * 90} className="h-full">
                    <TourCard listing={listing} isWishlisted={wishlistedIds.has(listing.id)} onToggleWishlist={toggleWishlist} />
                  </Reveal>
                ))}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="flex flex-col items-center gap-3 mt-10">
                  {/* Progress bar */}
                  <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full wg-grad-teal rounded-full transition-all duration-500"
                      style={{ width: `${(listings.length / total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-700">{listings.length}</span> of <span className="font-semibold text-slate-700">{total}</span> tours</p>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-all text-sm disabled:opacity-50 wg-shadow-soft"
                  >
                    {loadingMore ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                    ) : (
                      <>Load More Tours <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
              {page >= totalPages && listings.length > 0 && (
                <p className="text-center text-xs text-slate-400 mt-8">
                  ✓ All {total} tour{total !== 1 ? 's' : ''} shown
                </p>
              )}
            </>
          )}

          {/* Curated Experiences — moved below the tours grid */}
          {(() => {
            const catIds = categories.map((c: any) => c.id);
            const selParents = activeCats.filter(id => catIds.includes(id));
            const selSubs = activeCats.filter(id => !catIds.includes(id));
            const visibleExps = experiences.filter((exp: any) => {
              if (locationId && exp.location?.id !== locationId) return false;
              if (selParents.length && !selParents.includes(exp.categoryId)) return false;
              if (selSubs.length) {
                // sub-cat filter: don't filter experiences since they're parent-level
                // show experiences only when no sub is selected or when parent is selected
              }
              if (search && !exp.title.toLowerCase().includes(search.toLowerCase())) return false;
              return true;
            });
            if (visibleExps.length === 0) return null;
            return (
              <div className="mt-16 pt-12 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-[0.2em]">Curated Experiences</p>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Compare vendors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleExps.map((exp: any, i: number) => (
                    <Reveal key={exp.id} delay={(i % 3) * 90} className="h-full">
                      <ExperienceCard exp={exp} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <Reveal>
            <div className="text-center mb-20">
              <div className="flex justify-center"><Eyebrow light>How It Works</Eyebrow></div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-4 leading-tight">
                3 steps to your <span className="wg-text-teal">perfect trip</span>
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                No hidden fees. No confusion. Just browse, request, and travel.
              </p>
            </div>
          </Reveal>

          {/* Steps grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative">
            {[
              {
                num: '01', icon: Telescope, title: 'Browse & Discover',
                desc: 'Explore 500+ curated tours across adventure, heritage, beaches, and wildlife. Filter by destination, dates, and budget.',
                tag: 'Start here',
              },
              {
                num: '02', icon: MessageSquare, title: 'Request a Quote',
                desc: 'Tell vendors your group size, dates, and preferences. Get multiple personalised offers from verified local operators.',
                tag: 'Compare offers',
              },
              {
                num: '03', icon: Rocket, title: 'Book & Travel',
                desc: 'Pick the best offer, pay securely, and start your adventure. Our support team is with you every step of the way.',
                tag: 'Best price',
              },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div className="relative h-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-teal-400/25 rounded-3xl p-8 transition-all duration-300 group overflow-hidden">
                  {/* Large watermark number */}
                  <span className="absolute -top-4 -right-2 font-display text-[120px] font-semibold text-white/[0.04] leading-none select-none pointer-events-none">
                    {s.num}
                  </span>

                  {/* Top row: icon + tag */}
                  <div className="flex items-start justify-between mb-7">
                    <div className="w-16 h-16 rounded-2xl wg-grad-teal flex items-center justify-center wg-shadow-glow group-hover:scale-110 transition-transform duration-300">
                      <s.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border bg-teal-500/10 text-teal-300 border-teal-500/20">
                      {s.tag}
                    </span>
                  </div>

                  {/* Step number pill */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black wg-text-teal">STEP {s.num}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14">
            <button
              onClick={() => listingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-4 wg-grad-teal wg-glow-hover text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Explore Tours <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-500">Free to browse · No account needed</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          POPULAR DESTINATIONS — premium photo tiles
      ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <Eyebrow>Top Destinations</Eyebrow>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">Where do you want to go?</h2>
              <p className="text-slate-400 text-sm mt-3">Tap a destination to explore its tours</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {DESTINATIONS.map((dest, i) => (
              <Reveal key={dest.name} delay={i * 60}>
                <button
                  onClick={() => { setSearchInput(dest.name); setSearch(dest.name); setActiveCats([]); listingsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="group wg-zoom wg-lift relative w-full aspect-[3/4] rounded-2xl overflow-hidden wg-shadow-soft"
                >
                  <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <dest.icon className="w-5 h-5 text-white drop-shadow mb-1" />
                    <p className="text-sm font-bold text-white drop-shadow">{dest.name}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY WANDER
      ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--w-sand)] relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <div className="flex justify-center"><Eyebrow>Why Choose Wander</Eyebrow></div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-slate-900">Travel smarter,<br className="sm:hidden" /> not harder</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_WANDER.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="group h-full bg-white border border-slate-100 rounded-3xl p-7 wg-lift">
                  <div className="w-12 h-12 wg-grad-teal rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform wg-shadow-glow">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          GALLERY — editorial photo strip (NEW section)
      ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Curated Stays</Eyebrow>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">Handpicked places to stay</h2>
              </div>
              <Link
                href="/wander/properties"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 group"
              >
                Browse all stays <ArrowUpRight className="w-4 h-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              // Real published properties first — bookable "Stay" tiles
              ...galleryProps.map((p: any) => ({
                type: 'stay',
                key: p.id,
                img: p.coverImage || '/wander/luxury.jpg',
                title: p.name,
                sub: [p.city, p.state].filter(Boolean).join(', '),
                href: (p.agencySlug || p.agencyId) ? `/agent/${p.agencySlug || p.agencyId}/property/${p.id}` : null,
              })),
              // Pad remaining slots with clickable "Explore destination" tiles (not fake stays)
              ...GALLERY.map((g, gi) => ({ type: 'explore', key: 'scene-' + gi, img: g.img, title: g.place })),
            ].slice(0, Math.max(6, galleryProps.length)).map((item: any, i: number) => {
              const tall = i === 0 || i === 3;
              const inner = (
                <div className={`wg-zoom wg-lift relative rounded-3xl overflow-hidden wg-shadow-soft ${tall ? 'h-full min-h-[220px] md:min-h-[420px]' : 'h-[220px]'}`}>
                  <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  {/* Type badge — makes 'Stay' (bookable) vs 'Explore' (destination) obvious */}
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${item.type === 'stay' ? 'bg-teal-600/90 text-white' : 'bg-white/85 text-slate-700'}`}>
                    {item.type === 'stay' ? <><Hotel className="w-3 h-3" /> Stay</> : <><Compass className="w-3 h-3" /> Explore</>}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {item.type === 'stay' ? (
                      <>
                        <span className="block text-white text-sm font-semibold drop-shadow truncate">{item.title}</span>
                        {item.sub && (
                          <span className="mt-0.5 flex items-center gap-1 text-white/75 text-xs drop-shadow">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{item.sub}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold drop-shadow">
                        Explore {item.title} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
              return (
                <Reveal key={item.key} delay={i * 60} className={tall ? 'md:row-span-2' : ''}>
                  {item.type === 'stay'
                    ? (item.href ? <Link href={item.href} className="block h-full">{inner}</Link> : inner)
                    : (
                      <button
                        type="button"
                        onClick={() => { setSearchInput(item.title); setSearch(item.title); setActiveCats([]); setLocationId(''); listingsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="block h-full w-full text-left"
                      >
                        {inner}
                      </button>
                    )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRAVELER TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--w-sand)] relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-12">
              <Eyebrow>Traveler Stories</Eyebrow>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">Real trips. Real smiles.</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma', location: 'Mumbai', tour: '7 Days Goa Beach Tour', rating: 5, avatar: 'P',
                color: 'from-pink-500 to-rose-500',
                gallery: ['/wander/review-1.jpg', '/wander/review-2.jpg', '/wander/review-3.jpg'],
                text: 'Absolutely loved the experience! The vendor was super responsive, the hotel was exactly as described, and the itinerary was perfectly planned. Will definitely book again through Wander.',
              },
              {
                name: 'Rahul Mehta', location: 'Delhi', tour: 'Leh-Ladakh Adventure', rating: 5, avatar: 'R',
                color: 'from-teal-500 to-emerald-500',
                gallery: ['/wander/review-4.jpg', '/wander/review-5.jpg', '/wander/review-6.jpg'],
                text: 'Getting multiple quotes from different operators saved us ₹8,000! The comparison feature is amazing. Our Ladakh trip was the best holiday we\'ve ever taken as a family.',
              },
              {
                name: 'Ananya Rao', location: 'Bangalore', tour: 'Kerala Backwaters 5D', rating: 5, avatar: 'A',
                color: 'from-amber-500 to-orange-500',
                gallery: ['/wander/review-7.jpg', '/wander/review-8.jpg', '/wander/review-9.jpg'],
                text: 'From booking to checkout, everything was seamless. The houseboat experience was surreal. Huge thanks to the Wander team for recommending the right vendor for our group.',
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <ReviewCard t={t} />
              </Reveal>
            ))}
          </div>

          {/* Rating summary bar */}
          <Reveal>
            <div className="mt-12 bg-white border border-slate-100 rounded-3xl p-8 wg-shadow-soft flex flex-col sm:flex-row items-center gap-8 max-w-2xl mx-auto">
              <div className="text-center flex-shrink-0">
                <p className="font-display text-6xl font-semibold text-slate-900">4.8</p>
                <div className="flex items-center justify-center gap-0.5 my-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-400">Average rating</p>
              </div>
              <div className="flex-1 w-full space-y-2">
                {[
                  { label: '5 stars', width: '82%', count: '2,140' },
                  { label: '4 stars', width: '13%', count: '339' },
                  { label: '3 stars', width: '3%', count: '78' },
                  { label: '2 stars', width: '1%', count: '26' },
                  { label: '1 star', width: '1%', count: '13' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 w-12 flex-shrink-0">{r.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: r.width }} />
                    </div>
                    <span className="text-[11px] text-slate-400 w-10 text-right flex-shrink-0">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VENDOR CTA — photo background
      ══════════════════════════════════════════════════ */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/wander/cta.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/90 via-teal-900/85 to-slate-950/90" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 wg-glass-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-white mb-5">Are you a Tour Operator?</h2>
          <p className="text-teal-50/90 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
            List your tours on Wander and reach thousands of travelers across India. No listing fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/vendor" className="px-10 py-4 bg-white text-teal-800 font-bold rounded-2xl hover:bg-teal-50 transition text-sm wg-shadow-lift hover:scale-[1.02] active:scale-[0.98]">
              Become a Vendor
            </Link>
            <Link href="/contact" className="px-10 py-4 wg-glass-dark text-white font-semibold rounded-2xl hover:bg-white/20 transition text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
