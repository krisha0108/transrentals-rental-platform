// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Compass, MapPin, Clock, ArrowLeft, Loader2, Users,
  TrendingUp, ArrowRight, CheckCircle, Star, MessageSquare,
} from 'lucide-react';

function getPriceInfo(listing: any) {
  if (listing.priceType === 'GROUP_BASED' && listing.priceTiers) {
    try {
      const tiers = JSON.parse(listing.priceTiers);
      if (Array.isArray(tiers) && tiers.length > 0) {
        const min = Math.min(...tiers.map((t: any) => t.price));
        return { label: `₹${min.toLocaleString('en-IN')}`, suffix: '/group', prefix: 'From' };
      }
    } catch {}
  }
  if (listing.basePrice) {
    return {
      label: `₹${Number(listing.basePrice).toLocaleString('en-IN')}`,
      suffix: listing.priceType === 'PER_PERSON' ? '/person' : '/group',
      prefix: '',
    };
  }
  return { label: 'Custom Quote', suffix: '', prefix: '' };
}

function VendorCard({ listing }: { listing: any }) {
  const images: string[] = (() => { try { return JSON.parse(listing.images || '[]'); } catch { return []; } })();
  const coverImg = images[0] || null;
  const price = getPriceInfo(listing);
  const inclusions: string[] = (() => { try { return JSON.parse(listing.inclusions || '[]'); } catch { return []; } })();
  const popular = (listing._count?.quoteRequests ?? 0) >= 3;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex-shrink-0 overflow-hidden">
        {coverImg ? (
          <img src={coverImg} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="w-10 h-10 text-indigo-200" />
          </div>
        )}
        {popular && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Popular
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Vendor info */}
        <div className="flex items-center gap-2 mb-3">
          {listing.vendor?.logo ? (
            <img src={listing.vendor.logo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
              {listing.vendor?.businessName?.[0] || '?'}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-800 truncate">{listing.vendor?.businessName}</span>
        </div>

        {/* Title */}
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{listing.title}</p>

        {/* Duration */}
        {listing.duration && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3" /> {listing.duration}
          </p>
        )}

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div className="mb-3 flex-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Includes</p>
            <div className="space-y-1">
              {inclusions.slice(0, 4).map((inc: string) => (
                <div key={inc} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {inc}
                </div>
              ))}
              {inclusions.length > 4 && (
                <p className="text-xs text-indigo-500 font-medium">+{inclusions.length - 4} more</p>
              )}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="border-t border-gray-100 pt-3 mt-auto flex items-center justify-between">
          <div>
            {price.prefix && <span className="text-[10px] text-gray-400 block leading-tight">{price.prefix}</span>}
            <span className={`font-black ${price.label === 'Custom Quote' ? 'text-indigo-600 text-sm' : 'text-gray-900 text-base'}`}>
              {price.label}
            </span>
            {price.suffix && <span className="text-xs text-gray-400 ml-1">{price.suffix}</span>}
          </div>
          <Link
            href={`/wander/${listing.slug || listing.id}`}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [experience, setExperience] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Experience not found'}</p>
        <Link href="/wander" className="text-indigo-600 hover:underline text-sm">← Back to Wander</Link>
      </div>
    );
  }

  const listings = experience.listings || [];

  // Sort: has price first, then by quote count
  const sorted = [...listings].sort((a: any, b: any) => {
    const aHasPrice = a.basePrice || a.priceTiers;
    const bHasPrice = b.basePrice || b.priceTiers;
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;
    return (b._count?.quoteRequests ?? 0) - (a._count?.quoteRequests ?? 0);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#07091a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <Link href="/wander" className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-100 text-sm mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Wander
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              {experience.category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full mb-4">
                  {experience.category.icon} {experience.category.name}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{experience.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {experience.location?.name && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> {experience.location.name}</span>
                )}
                {experience.duration && (
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {experience.duration}</span>
                )}
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" /> {listings.length} vendor{listings.length !== 1 ? 's' : ''} offering this</span>
              </div>
              {experience.description && (
                <p className="mt-4 text-gray-400 max-w-2xl leading-relaxed">{experience.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor listings */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">Compare Vendors</p>
            <h2 className="text-xl font-black text-gray-900">
              {listings.length > 0
                ? `${listings.length} operator${listings.length !== 1 ? 's' : ''} offering this experience`
                : 'No vendors yet for this experience'}
            </h2>
          </div>
          <Link
            href="/wander"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-3 h-3" /> All tours
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
            <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active vendor listings yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — vendors are adding tours regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sorted.map((listing: any) => (
              <VendorCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
