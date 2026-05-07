// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass, Search, MapPin, Clock, Users, ChevronDown, Calendar, Star,
  Loader2, ArrowRight, Sparkles, Globe, Heart, Shield,
  SlidersHorizontal, X, TrendingUp, ArrowUpDown, ChevronRight, Layers, CalendarDays,
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
  { icon: '🌄', label: 'Sunrise Treks' },
  { icon: '🏕️', label: 'Camping' },
  { icon: '🤿', label: 'Scuba & Water' },
  { icon: '🎭', label: 'Cultural' },
  { icon: '🦅', label: 'Paragliding' },
  { icon: '🛕', label: 'Spiritual' },
  { icon: '📸', label: 'Photography' },
  { icon: '🚵', label: 'Cycling' },
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
  { name: 'Goa', emoji: '🏖️' },
  { name: 'Leh-Ladakh', emoji: '🏔️' },
  { name: 'Rajasthan', emoji: '🏯' },
  { name: 'Kerala', emoji: '🌴' },
  { name: 'Himachal', emoji: '⛰️' },
  { name: 'Uttarakhand', emoji: '🕉️' },
];

const WHY_WANDER = [
  { icon: Shield, title: 'Verified Vendors', desc: 'All tour operators are vetted and background-checked.' },
  { icon: Globe, title: '150+ Destinations', desc: 'From Leh to Kerala, we cover India end to end.' },
  { icon: Heart, title: 'Personalised Quotes', desc: 'Get custom quotes tailored to your group and dates.' },
  { icon: Sparkles, title: 'Curated Experiences', desc: 'Handpicked tours across every category and budget.' },
];

/* ─── ExperienceCard ───────────────────────────────── */
function ExperienceCard({ exp }: { exp: any }) {
  const popular = (exp.vendorCount ?? 0) >= 3;
  const hasPrice = exp.minPrice !== null && exp.minPrice !== undefined;

  return (
    <Link
      href={`/wander/experiences/${exp.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-indigo-100 hover:-translate-y-1 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden flex-shrink-0">
        {exp.coverImage ? (
          <img src={exp.coverImage} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-30">{exp.category?.icon || '🗺️'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {exp.category && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
              {exp.category.icon} {exp.category.name}
            </span>
          </div>
        )}
        {popular && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
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
            <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Users className="w-2.5 h-2.5" /> {exp.vendorCount} vendor{exp.vendorCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {exp.title}
        </h3>
        {exp.description && (
          <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{exp.description}</p>
        )}
        {exp.duration && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3 text-indigo-400" /> {exp.duration}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div>
            {hasPrice ? (
              <div>
                <span className="text-[10px] text-gray-400 block leading-tight">Starting from</span>
                <span className="text-base font-black text-gray-900">₹{Number(exp.minPrice).toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Get Quotes</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1 rounded-full transition-colors">
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
  const images: string[] = Array.isArray(listing.images) ? listing.images : (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const coverImg = images[0] || null;

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

  return (
    <Link
      href={`/wander/${listing.slug || listing.id}`}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(79,70,229,0.15),0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100/80 hover:border-indigo-200/60 hover:-translate-y-2 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-56 bg-gradient-to-br from-slate-800 to-indigo-900 overflow-hidden flex-shrink-0">
        {coverImg ? (
          <img
            src={coverImg}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
            <span className="text-8xl opacity-20">{listing.category?.icon || '🗺️'}</span>
          </div>
        )}

        {/* Strong multi-stop gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        {/* Side vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Top bar: Category + Wishlist + Hot badge */}
        <div className="absolute top-0 left-0 right-0 p-3.5 flex items-start justify-between">
          {listing.category && (
            <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-[11px] font-bold text-white px-3 py-1.5 rounded-xl border border-white/10">
              {listing.category.icon} {listing.category.name}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {popular && (
              <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-lg">
                <TrendingUp className="w-2.5 h-2.5" /> Hot
              </div>
            )}
            {onToggleWishlist && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(listing.id); }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm backdrop-blur-md border ${
                  isWishlisted
                    ? 'bg-red-500 text-white border-red-400 scale-105'
                    : 'bg-black/30 text-white/80 border-white/10 hover:text-red-400 hover:bg-black/50 hover:scale-105'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom text on image: Title + Location + Duration + Rating */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10">
          {/* Title on image */}
          <h3 className="font-black text-white text-base leading-snug mb-2 line-clamp-2 drop-shadow-lg group-hover:text-indigo-200 transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {listing.mainLocation?.name && (
                <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                  <MapPin className="w-3 h-3 text-indigo-300" /> {listing.mainLocation.name}
                </span>
              )}
              {listing.duration && (
                <span className="flex items-center gap-1 text-white/70 text-[11px]">
                  <Clock className="w-3 h-3" /> {listing.duration}
                </span>
              )}
            </div>
            {listing.rating > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
                <Star className="w-3 h-3 fill-gray-900" />
                {listing.rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content below image */}
      <div className="p-4 flex flex-col flex-1">
        {/* Vendor */}
        {listing.vendor?.businessName && (
          <div className="flex items-center gap-2 mb-3">
            {listing.vendor.logo && !vendorLogoError ? (
              <img src={listing.vendor.logo} alt="" onError={() => setVendorLogoError(true)} className="w-5 h-5 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white">
                {listing.vendor.businessName[0]?.toUpperCase()}
              </span>
            )}
            <span className="text-xs text-gray-400 truncate">{listing.vendor.businessName}</span>
            <span className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">✓ Verified</span>
          </div>
        )}

        {/* Tour dates if available */}
        {listing.tourStartDate && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-medium border border-indigo-100/60">
              <Calendar className="w-3 h-3" />
              {new Date(listing.tourStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {listing.tourEndDate && listing.tourEndDate !== listing.tourStartDate && (
                <> – {new Date(listing.tourEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
              )}
            </span>
          </div>
        )}

        {/* Price bar */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          {showCustomQuote ? (
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Price on request</span>
              <span className="text-sm font-bold text-indigo-600">Get Free Quote</span>
            </div>
          ) : (
            <div>
              {isStartingFrom && <span className="text-[10px] text-gray-400 block leading-tight">Starting from</span>}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 tracking-tight">{priceLabel}</span>
                {priceSuffix && <span className="text-xs text-gray-400">{priceSuffix}</span>}
              </div>
            </div>
          )}
          <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white px-3 py-2 rounded-xl transition-all duration-300 group-hover:shadow-md group-hover:shadow-indigo-500/25">
            View Tour <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function WanderHomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
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
      ? `${allCatsFlat.find(c => c.id === activeCats[0])?.icon || ''} ${allCatsFlat.find(c => c.id === activeCats[0])?.name || ''}`.trim()
      : `${activeCats.length} categories selected`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#050816]">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-indigo-600/30 to-violet-600/20 blur-[150px]" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-l from-fuchsia-600/20 to-cyan-500/15 blur-[130px]" style={{ animation: 'pulse 10s ease-in-out infinite', animationDelay: '3s' }} />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[100px]" style={{ animation: 'pulse 6s ease-in-out infinite', animationDelay: '1.5s' }} />
        </div>
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/25 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Wander Tours by TransRentals
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] font-black text-white leading-[1.05] tracking-tight mb-6">
                Discover<br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                    Incredible India
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full opacity-60" />
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
                Curated tours across adventure, heritage, beaches &amp; wildlife.
                Get custom quotes from <span className="text-white font-medium">verified local operators</span>.
              </p>

              {/* Search bar */}
              <form onSubmit={applySearch} className="relative max-w-xl mb-8">
                <div className="relative flex">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="Where do you want to go?"
                      className="w-full pl-13 pr-4 py-4 bg-white/[0.07] backdrop-blur-xl border border-white/15 text-white placeholder-gray-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm transition-all"
                    />
                    {searchInput && (
                      <button type="button" onClick={() => setSearchInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button type="submit" className="ml-2 px-7 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl transition text-sm whitespace-nowrap shadow-lg shadow-indigo-500/25">
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
                    className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs px-3.5 py-2 rounded-full transition-all backdrop-blur-sm"
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { n: '500+', label: 'Tour Packages', icon: '🗺️', gradient: 'from-indigo-500/20 to-indigo-600/10' },
                { n: '150+', label: 'Destinations', icon: '📍', gradient: 'from-violet-500/20 to-purple-600/10' },
                { n: '200+', label: 'Verified Vendors', icon: '✅', gradient: 'from-emerald-500/20 to-teal-600/10' },
                { n: '4.8★', label: 'Average Rating', icon: '⭐', gradient: 'from-amber-500/20 to-orange-600/10' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`bg-gradient-to-br ${s.gradient} backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all hover:scale-[1.02]`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="text-2xl mb-3 block">{s.icon}</span>
                  <p className="text-3xl font-black text-white mb-1">{s.n}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
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
                <p className="text-xl font-black text-white">{s.n}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MY GROUP TRIPS BANNER (logged-in customers only)
      ══════════════════════════════════════════════════ */}
      {customerId && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <Link
              href="/customer/wander-groups"
              className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] group"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">My Group Trips</p>
                <p className="text-xs text-emerald-100 leading-tight">Plan trips with your friends &amp; family</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STICKY FILTER BAR
      ══════════════════════════════════════════════════ */}
      <div ref={filterBarRef} className="sticky top-0 z-30 bg-white/[0.97] backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Row 1: Categories + Search + Filters toggle */}
          <div className="flex items-center gap-3 py-3">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
              <button
                onClick={() => { setActiveCats([]); setSearch(''); setSearchInput(''); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeCats.length === 0 && !search
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                🗺️ All
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
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    {cat.icon} {cat.name}
                    {hasSubs && <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isActive ? 'rotate-180 text-indigo-200' : 'text-gray-400'}`} />}
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
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setViewMode(v => v === 'grid' ? 'calendar' : 'grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-500/20'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{viewMode === 'calendar' ? 'Calendar' : 'Calendar'}</span>
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 transition-all"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Sub-categories (shown when parent with subs is selected) */}
          {visibleSubCats.length > 0 && (
            <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto scrollbar-hide">
              <span className="flex-shrink-0 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mr-1">Sub:</span>
              {visibleSubCats.map((sub: any) => {
                const isActive = activeCats.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleCat(sub.id)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {sub.icon && <span>{sub.icon}</span>} {sub.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced filters panel (collapsible) */}
          {showFilters && (
            <div className="pb-3 border-t border-gray-100 pt-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 flex-wrap">

                {/* Search */}
                <form onSubmit={applySearch} className="relative min-w-[160px] max-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search tours..."
                    className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-gray-50/50 transition-all"
                  />
                </form>

                {/* Location */}
                <div ref={locationDropdownRef} className="relative flex-shrink-0">
                  <button
                    onClick={() => { setLocationOpen(o => !o); setLocationSearch(''); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs border rounded-xl transition-all ${
                      locationId
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="max-w-[110px] truncate">
                      {locationId ? locations.find((l: any) => l.id === locationId)?.name || 'Location' : 'All Locations'}
                    </span>
                    {locationId
                      ? <X className="w-3 h-3 ml-1 text-indigo-400 hover:text-indigo-700" onClick={e => { e.stopPropagation(); setLocationId(''); setLocationOpen(false); }} />
                      : <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`} />
                    }
                  </button>
                  {locationOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden">
                      <div className="p-2.5 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            value={locationSearch}
                            onChange={e => setLocationSearch(e.target.value)}
                            placeholder="Search location..."
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1">
                        <button
                          onClick={() => { setLocationId(''); setLocationOpen(false); }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2 transition-colors rounded-lg mx-1 ${
                            !locationId ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{ width: 'calc(100% - 8px)' }}
                        >
                          <Globe className="w-3.5 h-3.5" /> All Locations
                        </button>
                        {locations.length === 0 && (
                          <p className="px-3 py-4 text-xs text-gray-400 text-center">No locations</p>
                        )}
                        {locations
                          .filter((loc: any) => loc.name.toLowerCase().includes(locationSearch.toLowerCase()))
                          .map((loc: any) => (
                            <button
                              key={loc.id}
                              onClick={() => { setLocationId(loc.id); setLocationOpen(false); }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2 transition-colors rounded-lg mx-1 ${
                                locationId === loc.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              style={{ width: 'calc(100% - 8px)' }}
                            >
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" /> {loc.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="relative flex-shrink-0">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer transition-all"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-7 bg-gray-200" />

                {/* Date range */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className={`pl-8 pr-2.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-[135px] transition-all ${
                        dateFrom ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 bg-gray-50/50 text-gray-600'
                      }`}
                      title="From date"
                    />
                  </div>
                  <span className="text-gray-300">→</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className={`pl-8 pr-2.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-[135px] transition-all ${
                        dateTo ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 bg-gray-50/50 text-gray-600'
                      }`}
                      title="To date"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-7 bg-gray-200" />

                {/* Price presets */}
                <div className="flex items-center gap-1">
                  {PRICE_PRESETS.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => setPricePreset(i)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        pricePreset === i
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          LISTINGS
      ══════════════════════════════════════════════════ */}
      <section ref={listingsRef} className="py-12 px-4 sm:px-6 bg-gradient-to-b from-gray-50/50 to-gray-50">
        <div className="max-w-6xl mx-auto">

          {/* Experiences section — shown when experiences match current filter */}
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
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Curated Experiences</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Compare vendors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleExps.map((exp: any) => (
                    <ExperienceCard key={exp.id} exp={exp} />
                  ))}
                </div>
                <div className="border-b border-gray-200 mt-10 mb-6" />
              </div>
            );
          })()}

          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">
                {activeLabel}
              </p>
              <h2 className="text-xl font-black text-gray-900">
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
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">No tours found</h3>
              <p className="text-sm text-gray-400 mb-6">
                {search ? `No results for "${search}". Try a different keyword.` : 'No active tours in this category yet.'}
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
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
                  <div className="space-y-8">
                    {sortedMonths.map(monthKey => {
                      const [y, m] = monthKey.split('-').map(Number);
                      const monthName = new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                      const monthListings = monthGroups[monthKey].sort(
                        (a: any, b: any) => new Date(a.tourStartDate).getTime() - new Date(b.tourStartDate).getTime()
                      );

                      return (
                        <div key={monthKey}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <CalendarDays className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{monthName}</h3>
                              <p className="text-xs text-gray-400">{monthListings.length} tour{monthListings.length !== 1 ? 's' : ''}</p>
                            </div>
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
                                  className="flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group"
                                >
                                  {/* Date badge */}
                                  <div className="w-20 flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 flex flex-col items-center justify-center text-white p-2">
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
                                  <div className="w-28 flex-shrink-0 bg-indigo-50 overflow-hidden">
                                    {images[0] ? (
                                      <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Compass className="w-8 h-8 text-indigo-200" />
                                      </div>
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
                                    {listing.category && (
                                      <span className="text-[10px] font-semibold text-indigo-500 mb-0.5">{listing.category.icon} {listing.category.name}</span>
                                    )}
                                    <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{listing.title}</h4>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                      {listing.mainLocation?.name && (
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.mainLocation.name}</span>
                                      )}
                                      {listing.duration && (
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{listing.duration}</span>
                                      )}
                                      {listing.vendor?.businessName && (
                                        <span className="text-gray-300">by {listing.vendor.businessName}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center pr-4">
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
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
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Compass className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Anytime Tours</h3>
                            <p className="text-xs text-gray-400">{toursWithoutDates.length} tour{toursWithoutDates.length !== 1 ? 's' : ''} · no fixed dates</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {toursWithoutDates.map(listing => (
                            <TourCard key={listing.id} listing={listing} isWishlisted={wishlistedIds.has(listing.id)} onToggleWishlist={toggleWishlist} />
                          ))}
                        </div>
                      </div>
                    )}

                    {listings.length > 0 && (
                      <p className="text-center text-xs text-gray-400 mt-4">Showing {listings.length} of {total} tours</p>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <TourCard key={listing.id} listing={listing} isWishlisted={wishlistedIds.has(listing.id)} onToggleWishlist={toggleWishlist} />
                ))}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="flex flex-col items-center gap-3 mt-10">
                  {/* Progress bar */}
                  <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${(listings.length / total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-700">{listings.length}</span> of <span className="font-semibold text-gray-700">{total}</span> tours</p>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all text-sm disabled:opacity-50 shadow-sm"
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
                <p className="text-center text-xs text-gray-400 mt-8">
                  ✓ All {total} tour{total !== 1 ? 's' : ''} shown
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 bg-[#050816] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              How It Works
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              3 steps to your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                perfect trip
              </span>
            </h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              No hidden fees. No confusion. Just browse, request, and travel.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative">
            {/* Connecting dashes (desktop only) */}
            <div className="hidden lg:flex absolute top-10 left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] items-center justify-between pointer-events-none" style={{ zIndex: 0 }}>
              <div className="flex-1 border-t-2 border-dashed border-white/10" />
            </div>

            {[
              {
                num: '01',
                emoji: '🔍',
                title: 'Browse & Discover',
                desc: 'Explore 500+ curated tours across adventure, heritage, beaches, and wildlife. Filter by destination, dates, and budget.',
                gradient: 'from-indigo-500 to-blue-500',
                glow: 'shadow-indigo-500/30',
                tag: 'Start here',
                tagColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
              },
              {
                num: '02',
                emoji: '💬',
                title: 'Request a Quote',
                desc: 'Tell vendors your group size, dates, and preferences. Get multiple personalised offers from verified local operators.',
                gradient: 'from-violet-500 to-purple-500',
                glow: 'shadow-violet-500/30',
                tag: 'Compare offers',
                tagColor: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
              },
              {
                num: '03',
                emoji: '🚀',
                title: 'Book & Travel',
                desc: 'Pick the best offer, pay securely, and start your adventure. Our support team is with you every step of the way.',
                gradient: 'from-fuchsia-500 to-pink-500',
                glow: 'shadow-fuchsia-500/30',
                tag: 'Best price',
                tagColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20',
              },
            ].map((s, i) => (
              <div
                key={s.num}
                className="relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-8 transition-all duration-300 group overflow-hidden"
                style={{ zIndex: 1 }}
              >
                {/* Large watermark number */}
                <span className="absolute -top-4 -right-2 text-[120px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
                  {s.num}
                </span>

                {/* Top row: icon + tag */}
                <div className="flex items-start justify-between mb-7">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-3xl shadow-xl ${s.glow} group-hover:scale-110 transition-transform duration-300`}>
                    {s.emoji}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${s.tagColor}`}>
                    {s.tag}
                  </span>
                </div>

                {/* Step number pill */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-black text-transparent bg-clip-text bg-gradient-to-r ${s.gradient}`}>
                    STEP {s.num}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>

                {/* Bottom arrow */}
                {i < 2 && (
                  <div className="lg:hidden flex justify-center mt-8 mb-2">
                    <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14">
            <button
              onClick={() => listingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Explore Tours <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-500">Free to browse · No account needed</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          POPULAR DESTINATIONS
      ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-2">Top Destinations</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Where do you want to go?</h2>
            <p className="text-gray-400 text-sm mt-2">Click a destination to explore tours</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {DESTINATIONS.map(dest => (
              <button
                key={dest.name}
                onClick={() => { setSearchInput(dest.name); setSearch(dest.name); setActiveCats([]); listingsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                className="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white border border-gray-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-4xl group-hover:scale-125 transition-transform duration-300 drop-shadow-sm">{dest.emoji}</span>
                <p className="relative text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{dest.name}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY WANDER
      ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-[#050816] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-3">Why Choose Wander</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white">Travel smarter,<br className="sm:hidden" /> not harder</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_WANDER.map((item, i) => (
              <div
                key={item.title}
                className="group bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-7 hover:border-indigo-500/30 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRAVELER TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-3">Traveler Stories</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Real trips. Real smiles.</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">Thousands of travelers have explored India through Wander. Here's what they say.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                tour: '7 Days Goa Beach Tour',
                rating: 5,
                avatar: 'P',
                color: 'from-pink-500 to-rose-500',
                text: 'Absolutely loved the experience! The vendor was super responsive, the hotel was exactly as described, and the itinerary was perfectly planned. Will definitely book again through Wander.',
              },
              {
                name: 'Rahul Mehta',
                location: 'Delhi',
                tour: 'Leh-Ladakh Adventure',
                rating: 5,
                avatar: 'R',
                color: 'from-indigo-500 to-violet-500',
                text: 'Getting multiple quotes from different operators saved us ₹8,000! The comparison feature is amazing. Our Ladakh trip was the best holiday we\'ve ever taken as a family.',
                featured: true,
              },
              {
                name: 'Ananya Rao',
                location: 'Bangalore',
                tour: 'Kerala Backwaters 5D',
                rating: 5,
                avatar: 'A',
                color: 'from-emerald-500 to-teal-500',
                text: 'From booking to checkout, everything was seamless. The houseboat experience was surreal. Huge thanks to the Wander team for recommending the right vendor for our group.',
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative bg-white rounded-3xl p-7 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${
                  t.featured ? 'border-indigo-200 shadow-indigo-100/80 ring-2 ring-indigo-200/50' : 'border-gray-100'
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                      <Sparkles className="w-2.5 h-2.5" /> Featured Review
                    </span>
                  </div>
                )}
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">"{t.text}"</p>
                {/* Tour badge */}
                <div className="flex items-center gap-1.5 mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                    <Compass className="w-3 h-3" /> {t.tour}
                  </span>
                </div>
                {/* Reviewer */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">✓ Verified Trip</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rating summary bar */}
          <div className="mt-12 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8 max-w-2xl mx-auto">
            <div className="text-center flex-shrink-0">
              <p className="text-6xl font-black text-gray-900">4.8</p>
              <div className="flex items-center justify-center gap-0.5 my-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs text-gray-400">Average rating</p>
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
                  <span className="text-[11px] text-gray-400 w-12 flex-shrink-0">{r.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: r.width }} />
                  </div>
                  <span className="text-[11px] text-gray-400 w-10 text-right flex-shrink-0">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VENDOR CTA
      ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-[250px] h-[250px] rounded-full bg-fuchsia-500/15 blur-[60px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">Are you a Tour Operator?</h2>
          <p className="text-indigo-100 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
            List your tours on Wander and reach thousands of travelers across India. No listing fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/vendor" className="px-10 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition text-sm shadow-xl shadow-indigo-900/30 hover:scale-[1.02] active:scale-[0.98]">
              Become a Vendor
            </Link>
            <Link href="/contact" className="px-10 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 transition text-sm backdrop-blur-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
