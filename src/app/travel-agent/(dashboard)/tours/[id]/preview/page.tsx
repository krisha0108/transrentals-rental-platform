'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Eye,
  MapPin,
  Calendar,
  IndianRupee,
  Compass,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles,
  Car,
  Users,
  Fuel,
  Globe,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface Tour {
  id: string;
  slug: string | null;
  title: string;
  destination: string;
  description: string | null;
  durationDays: number;
  durationNights: number;
  startingPrice: number | null;
  category: string | null;
  coverImage: string | null;
  galleryImages: string | null;
  inclusions: string | null;
  exclusions: string | null;
  itinerary: string | null;
  termsConditions: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
  totalRatings: number;
  attachedVehicles: any[];
}

function safeParse(val: any, fallback: any) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export default function TourPreviewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch(`/api/travel-agent/tours/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTour(data))
      .finally(() => setLoading(false));
  }, [id]);

  useTravelAgentPageHeader(
    tour ? tour.title : 'Tour Preview',
    tour ? (tour.isPublic ? 'This is what customers see on /wander' : 'Customer-facing view of your draft') : undefined,
    tour ? (
      <Link
        key="edit"
        href={`/travel-agent/tours/${id}/edit`}
        className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
      >
        <Edit2 className="w-3 h-3" /> Edit
      </Link>
    ) : undefined,
    <Link
      key="back"
      href="/travel-agent/tours"
      className="text-xs font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </Link>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Tour not found</p>
        <Link
          href="/travel-agent/tours"
          className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline"
        >
          ← Back to tours
        </Link>
      </div>
    );
  }

  // Parse JSON-stringified fields
  const gallery: string[] = safeParse(tour.galleryImages, []);
  const inclusionsRaw = safeParse(tour.inclusions, null);
  let inclusionsList: string[] = [];
  let highlights: string[] = [];
  if (Array.isArray(inclusionsRaw)) {
    inclusionsList = inclusionsRaw;
  } else if (inclusionsRaw && typeof inclusionsRaw === 'object') {
    inclusionsList = Array.isArray(inclusionsRaw.items) ? inclusionsRaw.items : [];
    highlights = Array.isArray(inclusionsRaw.highlights) ? inclusionsRaw.highlights : [];
  }
  const exclusionsList: string[] = safeParse(tour.exclusions, []);
  const allImages = [tour.coverImage, ...gallery].filter(Boolean) as string[];
  const heroImage = allImages[activeImage] || allImages[0];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Preview banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 mb-5 flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-blue-900">Preview Mode</p>
            <p className="text-xs text-blue-700 mt-0.5">
              {tour.isPublic
                ? 'This is what customers see on /wander'
                : 'Customer-facing view of your draft. Publish to make it visible to everyone.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tour.isPublic ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full">
              <Globe className="w-2.5 h-2.5" /> PUBLISHED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
              <Lock className="w-2.5 h-2.5" /> DRAFT
            </span>
          )}
          {tour.isPublic && tour.slug && (
            <a
              href={`/wander/${tour.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
            >
              <Globe className="w-3 h-3" /> Open Public URL
            </a>
          )}
        </div>
      </div>

      {/* Hero image */}
      {allImages.length > 0 ? (
        <div className="space-y-2 mb-6">
          <div className="aspect-[16/9] bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt={tour.title} className="w-full h-full object-cover" />
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImage
                      ? 'border-emerald-500 ring-1 ring-emerald-300'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${tour.title} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl mb-6 flex items-center justify-center text-7xl">
          🗺️
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500 mb-2">
          {tour.category && (
            <span className="inline-flex bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              {tour.category}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {tour.destination}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {tour.durationDays}D{tour.durationNights > 0 ? `/${tour.durationNights}N` : ''}
          </span>
          {tour.rating && tour.totalRatings > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <strong className="text-gray-900">{tour.rating.toFixed(1)}</strong>
              <span className="text-gray-400">({tour.totalRatings})</span>
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{tour.title}</h1>
        {tour.description && (
          <div
            className="text-gray-700 mt-3 leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-strong:text-gray-900 prose-a:text-emerald-700"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(tour.description) }}
          />
        )}
      </div>

      {/* Price + booking CTA strip */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wide">Starting from</p>
          <p className="text-2xl sm:text-3xl font-extrabold">
            {tour.startingPrice ? (
              <>
                <IndianRupee className="inline w-5 h-5 mb-1" />
                {tour.startingPrice.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-emerald-100"> / person</span>
              </>
            ) : (
              'On Request'
            )}
          </p>
        </div>
        <button
          disabled
          title="Preview only — booking flow disabled"
          className="bg-white/20 backdrop-blur text-white text-sm font-bold px-5 py-2.5 rounded-xl border border-white/30 cursor-not-allowed"
        >
          Request Quote (preview)
        </button>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Section title="Highlights" icon={Sparkles}>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✨</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Vehicles */}
      {tour.attachedVehicles && tour.attachedVehicles.length > 0 && (
        <Section title="Vehicles for this tour" icon={Car}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tour.attachedVehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {v.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.coverImage} alt={v.vehicleName} className="w-full h-full object-cover" />
                  ) : (
                    <Car className="w-7 h-7 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{v.vehicleName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {v.brand && `${v.brand} • `}
                    {v.vehicleType.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    {v.seatingCapacity && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {v.seatingCapacity}
                      </span>
                    )}
                    {v.fuelType && (
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" /> {v.fuelType}
                      </span>
                    )}
                    {v.chauffeurIncluded && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Chauffeur
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Itinerary */}
      {tour.itinerary && (
        <Section title="Day-by-Day Itinerary" icon={Calendar}>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {tour.itinerary}
          </pre>
        </Section>
      )}

      {/* Inclusions / Exclusions */}
      {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {inclusionsList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What&apos;s included
              </h3>
              <ul className="space-y-1.5">
                {inclusionsList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exclusionsList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-500" /> Not included
              </h3>
              <ul className="space-y-1.5">
                {exclusionsList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {tour.termsConditions && (
        <Section title="Terms & Cancellation Policy" icon={Compass}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {tour.termsConditions}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-4">
      <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
        <Icon className="w-4 h-4 text-emerald-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}
