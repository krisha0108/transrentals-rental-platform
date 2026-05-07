'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  Bed,
  IndianRupee,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Plane,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Property {
  id: string;
  slug: string | null;
  name: string;
  propertyType: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  totalRooms: number;
  startingPrice: number | null;
  amenities: string[];
  coverImage: string | null;
  galleryImages: string[];
  rating: number | null;
  totalRatings: number;
}

interface Agency {
  id: string;
  slug: string;
  agencyName: string;
  ownerName: string;
  logo: string | null;
  phone: string;
  email: string;
  isVerified: boolean;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESORT: 'Resort',
  HOTEL: 'Hotel',
  HOMESTAY: 'Homestay',
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  GUEST_HOUSE: 'Guest House',
  HOSTEL: 'Hostel',
  ROOMS: 'Rooms',
  OTHER: 'Other',
};

export default function PropertyDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const { slug, id } = params;
  const [property, setProperty] = useState<Property | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/agent/${slug}`);
        if (!res.ok) {
          const j = await res.json();
          setError(j.error || 'Could not load property');
          return;
        }
        const json = await res.json();
        setAgency(json.agency);
        const found = (json.properties as Property[]).find(
          (p) => p.id === id || p.slug === id,
        );
        if (!found) {
          setError('Property not found');
          return;
        }
        setProperty(found);
      } catch {
        setError('Could not load property');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Bed className="w-7 h-7 text-white animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 absolute -inset-2 animate-spin text-emerald-500/40" />
        </div>
        <p className="mt-6 text-sm font-semibold text-emerald-800">Preparing your stay...</p>
      </div>
    );
  }

  if (error || !property || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 text-sm">{error || 'This stay is not available.'}</p>
          <Link
            href={`/agent/${slug}`}
            className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline"
          >
            ← Back to agency
          </Link>
        </div>
      </div>
    );
  }

  const images = [
    ...(property.coverImage ? [property.coverImage] : []),
    ...(property.galleryImages || []),
  ];
  const hasImages = images.length > 0;
  const whatsappUrl = `https://wa.me/91${String(agency.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    `Hi ${agency.agencyName}, I'm interested in "${property.name}" listed on your TransRentals page.`,
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white pb-24 sm:pb-8">
      {/* Top bar with back link */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/agent/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {agency.agencyName}
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Curated Stay
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Gallery */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 via-rose-100 to-emerald-100 aspect-[16/10]">
            {hasImages ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImage]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">🏨</div>
            )}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="bg-white/95 backdrop-blur text-gray-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow uppercase tracking-wide">
                {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
              </span>
              {property.rating && (
                <span className="bg-white/95 backdrop-blur text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 shadow">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {property.rating.toFixed(1)}
                  {property.totalRatings > 0 && (
                    <span className="text-gray-500 font-semibold">({property.totalRatings})</span>
                  )}
                </span>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-800" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 text-gray-800" />
                </button>
              </>
            )}
          </div>
          {/* thumbnail rail */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
              {images.slice(0, 6).map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i
                      ? 'border-emerald-500 ring-2 ring-emerald-200'
                      : 'border-transparent hover:border-emerald-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${property.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Title block */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-50 rounded-full opacity-60 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 capitalize">
                {property.name}
              </h1>
              {(property.city || property.address) && (
                <p className="mt-1 text-sm text-gray-600 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    {property.address && `${property.address}, `}
                    {property.city}
                    {property.state && `, ${property.state}`}
                  </span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Bed className="w-3 h-3" /> {property.totalRooms} room
                  {property.totalRooms !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {property.startingPrice && (
              <div className="text-right">
                <p className="text-[11px] uppercase font-bold tracking-widest text-gray-500">
                  Starting from
                </p>
                <p className="text-3xl font-extrabold text-emerald-700 inline-flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {property.startingPrice.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500">per night</p>
              </div>
            )}
          </div>
        </section>

        {/* Description */}
        {property.description && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> About this stay
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>
          </section>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a, i) => (
                <span
                  key={`${a}-${i}`}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100"
                >
                  <CheckCircle2 className="w-3 h-3" /> {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Hosted by */}
        <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 90% 10%, #fbbf24 0%, transparent 40%)',
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {agency.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.logo}
                  alt={agency.agencyName}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 shadow"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/15 border-2 border-white/30 flex items-center justify-center">
                  <Plane className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-xs text-emerald-100 inline-flex items-center gap-1">
                  Hosted by{' '}
                  {agency.isVerified && (
                    <span className="inline-flex items-center gap-0.5 bg-amber-400 text-amber-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-2 h-2" /> VERIFIED
                    </span>
                  )}
                </p>
                <p className="text-base font-extrabold capitalize">{agency.agencyName}</p>
                <p className="text-xs text-emerald-100 capitalize">by {agency.ownerName}</p>
              </div>
            </div>
            <Link
              href={`/agent/${slug}`}
              className="text-xs font-bold bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 px-3 py-2 rounded-xl"
            >
              View profile →
            </Link>
          </div>
        </section>

        {/* Inline contact (desktop) */}
        <section className="hidden sm:grid grid-cols-3 gap-3">
          <a
            href={`tel:${agency.phone}`}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-3 rounded-xl shadow"
          >
            <Phone className="w-4 h-4" /> Call {agency.phone}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-3 rounded-xl shadow"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`mailto:${agency.email}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 font-bold text-sm px-4 py-3 rounded-xl"
          >
            <Mail className="w-4 h-4" /> Email Enquiry
          </a>
        </section>

        <p className="text-center text-xs text-gray-400 pt-2">
          <Link href="/" className="font-bold text-emerald-600 hover:underline">
            TransRentals
          </Link>
          {' • '}Listed by {agency.agencyName}
        </p>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3 z-20">
        <div className="flex items-center gap-2">
          <a
            href={`tel:${agency.phone}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-bold text-sm px-3 py-3 rounded-xl"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600 text-white font-bold text-sm px-3 py-3 rounded-xl"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
