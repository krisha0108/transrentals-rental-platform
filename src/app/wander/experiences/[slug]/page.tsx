// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Compass, MapPin, Clock, ArrowLeft, Loader2, Users,
  TrendingUp, ArrowRight, CheckCircle, Star, ChevronRight,
  Shield, Sparkles, ArrowUpDown, SlidersHorizontal,
} from 'lucide-react';

function getPriceInfo(listing: any) {
  if (listing.priceType === 'GROUP_BASED' && listing.priceTiers) {
    try {
      const tiers = JSON.parse(listing.priceTiers);
      if (Array.isArray(tiers) && tiers.length > 0) {
        const min = Math.min(...tiers.map((t: any) => Number(t.price)));
        return { label: `₹${min.toLocaleString('en-IN')}`, suffix: '/group', prefix: 'From', value: min };
      }
    } catch {}
  }
  if (listing.basePrice) {
    return {
      label: `₹${Number(listing.basePrice).toLocaleString('en-IN')}`,
      suffix: listing.priceType === 'PER_PERSON' ? '/person' : '/group',
      prefix: '',
      value: Number(listing.basePrice),
    };
  }
  return { label: 'Get Quote', suffix: '', prefix: '', value: Infinity };
}

function VendorCard({ listing, isBestValue }: { listing: any; isBestValue?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const images: string[] = (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const coverImg = images[0] || null;
  const price = getPriceInfo(listing);
  const inclusions: string[] = (() => { try { return JSON.parse(listing.inclusions || '[]'); } catch { return []; } })();
  const popular = (listing._count?.quoteRequests ?? 0) >= 3;

  return (
    <Link
      href={`/wander/${listing.slug || listing.id}`}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(79,70,229,0.12),0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-500 border border-gray-100 hover:border-indigo-100 hover:-translate-y-2 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex-shrink-0 overflow-hidden">
        {coverImg && !imgError ? (
          <img
            src={coverImg}
            alt={listing.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="w-12 h-12 text-indigo-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {isBestValue ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm">
              ✦ Best Value
            </span>
          ) : <div />}
          {popular && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm">
              <TrendingUp className="w-2.5 h-2.5" /> Hot
            </span>
          )}
        </div>

        {/* Rating on image */}
        {listing.rating > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-gray-900 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm">
              <Star className="w-3 h-3 fill-gray-900" />
              {Number(listing.rating).toFixed(1)}
              <span className="text-gray-700 font-normal text-[10px]">({listing.totalRatings})</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Vendor */}
        <div className="flex items-center gap-2 mb-3">
          {listing.vendor?.logo && !logoError ? (
            <img
              src={listing.vendor.logo}
              alt=""
              onError={() => setLogoError(true)}
              className="w-7 h-7 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-200"
            />
          ) : (
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
              {listing.vendor?.businessName?.[0]?.toUpperCase() || '?'}
            </span>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-gray-800 truncate">{listing.vendor?.businessName}</span>
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              <Shield className="w-2 h-2" /> Verified
            </span>
          </div>
        </div>

        {/* Tour title */}
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {listing.title}
        </h3>

        {/* Duration */}
        {listing.duration && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> {listing.duration}
          </p>
        )}

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div className="mb-4 flex-1">
            <div className="space-y-1.5">
              {inclusions.slice(0, 3).map((inc: string) => (
                <div key={inc} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{inc}</span>
                </div>
              ))}
              {inclusions.length > 3 && (
                <p className="text-xs text-indigo-500 font-medium pl-5">+{inclusions.length - 3} more included</p>
              )}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="border-t border-gray-100 pt-4 mt-auto flex items-center justify-between">
          <div>
            {price.prefix && <span className="text-[10px] text-gray-400 block leading-tight">{price.prefix}</span>}
            <div className="flex items-baseline gap-1">
              <span className={`font-black ${price.label === 'Get Quote' ? 'text-indigo-600 text-sm' : 'text-gray-900 text-xl'}`}>
                {price.label}
              </span>
              {price.suffix && <span className="text-xs text-gray-400">{price.suffix}</span>}
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 group-hover:bg-violet-600 text-white text-xs font-bold rounded-2xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-105">
            View Tour <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Recommended' },
  { value: 'priceAsc', label: 'Price: Low → High' },
  { value: 'priceDesc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ExperienceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [experience, setExperience] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    fetch(`/api/wander/experiences/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setExperience(d);
      })
      .catch(() => setError('Failed to load experience'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-400">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Compass className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 font-medium">{error || 'Experience not found'}</p>
        <Link href="/wander" className="text-indigo-600 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Wander
        </Link>
      </div>
    );
  }

  const listings = experience.listings || [];

  // Sorting
  const sorted = [...listings].sort((a: any, b: any) => {
    if (sortBy === 'priceAsc') return getPriceInfo(a).value - getPriceInfo(b).value;
    if (sortBy === 'priceDesc') return getPriceInfo(b).value - getPriceInfo(a).value;
    if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === 'popular') return (b._count?.quoteRequests ?? 0) - (a._count?.quoteRequests ?? 0);
    // default: has price first, then by quote count
    const aHasPrice = a.basePrice || a.priceTiers;
    const bHasPrice = b.basePrice || b.priceTiers;
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;
    return (b._count?.quoteRequests ?? 0) - (a._count?.quoteRequests ?? 0);
  });

  // Best value = sorted by price, first one with a real price
  const bestValueId = [...listings]
    .filter(l => getPriceInfo(l).value !== Infinity)
    .sort((a, b) => getPriceInfo(a).value - getPriceInfo(b).value)[0]?.id;

  const minPrice = listings
    .map((l: any) => getPriceInfo(l).value)
    .filter((v: number) => v !== Infinity);
  const lowestPrice = minPrice.length ? Math.min(...minPrice) : null;
  const avgRating = listings.length
    ? listings.filter((l: any) => l.rating > 0).reduce((s: number, l: any) => s + l.rating, 0) /
      (listings.filter((l: any) => l.rating > 0).length || 1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <div className="relative bg-[#050816] overflow-hidden">
        {/* Background blur blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
          {experience.coverImage && (
            <img
              src={experience.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-10 absolute inset-0"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050816]/60 to-[#050816]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
            <Link href="/wander" className="hover:text-indigo-400 flex items-center gap-1 transition-colors">
              <Compass className="w-3.5 h-3.5" /> Wander Tours
            </Link>
            <ChevronRight className="w-3 h-3" />
            {experience.category && (
              <>
                <span className="text-gray-400">{experience.category.icon} {experience.category.name}</span>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-gray-300 truncate max-w-[200px]">{experience.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div>
              {experience.category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/25 px-3 py-1.5 rounded-full mb-5">
                  {experience.category.icon} {experience.category.name}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                {experience.title}
              </h1>

              {experience.description && (
                <p className="text-gray-400 leading-relaxed mb-6 max-w-lg">{experience.description}</p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                {experience.location?.name && (
                  <span className="inline-flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/80 text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {experience.location.name}
                  </span>
                )}
                {experience.duration && (
                  <span className="inline-flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/80 text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> {experience.duration}
                  </span>
                )}
                {listings.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-white/80 text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> {listings.length} vendor{listings.length !== 1 ? 's' : ''} available
                  </span>
                )}
              </div>
            </div>

            {/* Right — Stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: '💰', label: 'Starting from', value: lowestPrice ? `₹${lowestPrice.toLocaleString('en-IN')}` : 'Custom', sub: 'Best price available' },
                { icon: '🏪', label: 'Vendors', value: `${listings.length}`, sub: 'Offering this experience' },
                { icon: '⭐', label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : 'New', sub: 'Across all vendors' },
                { icon: '✅', label: 'Verified', value: '100%', sub: 'All operators vetted' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.08]">
                  <span className="text-2xl mb-3 block">{s.icon}</span>
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile stats strip */}
          <div className="lg:hidden flex gap-6 mt-6 pt-6 border-t border-white/10 overflow-x-auto">
            {[
              { label: 'From', value: lowestPrice ? `₹${lowestPrice.toLocaleString('en-IN')}` : '—' },
              { label: 'Vendors', value: listings.length },
              { label: 'Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)}★` : 'New' },
            ].map(s => (
              <div key={s.label} className="flex-shrink-0">
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LISTINGS ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Section header + sort */}
        <div className="flex items-center justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Compare Operators</p>
            <h2 className="text-xl font-black text-gray-900">
              {listings.length > 0
                ? `${listings.length} operator${listings.length !== 1 ? 's' : ''} offering this tour`
                : 'No vendors yet'}
            </h2>
          </div>
          {listings.length > 1 && (
            <div className="relative flex-shrink-0">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2.5 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-3xl">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="font-bold text-gray-700 mb-2">No vendors yet for this experience</h3>
            <p className="text-sm text-gray-400 mb-6">Check back soon — vendors are adding tours regularly.</p>
            <Link href="/wander" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
              <ArrowLeft className="w-4 h-4" /> Browse All Tours
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((listing: any) => (
                <VendorCard
                  key={listing.id}
                  listing={listing}
                  isBestValue={listing.id === bestValueId}
                />
              ))}
            </div>

            {/* Why trust section */}
            <div className="mt-14 bg-white border border-gray-100 rounded-3xl p-8">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center mb-6">Why Book Through Wander</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: Shield, title: 'Verified Operators', desc: 'Every vendor is background-checked and approved by our team.' },
                  { icon: Star, title: 'Real Reviews', desc: 'Only verified travelers who completed the tour can leave a review.' },
                  { icon: Sparkles, title: 'Free Quotes', desc: 'Request a quote from any operator — no payment, no commitment.' },
                ].map(item => (
                  <div key={item.title} className="text-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
