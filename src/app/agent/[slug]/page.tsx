'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Calendar,
  CheckCircle2,
  Compass,
  Bed,
  Car,
  Users,
  Fuel,
  IndianRupee,
  MessageSquare,
  Share2,
  ShieldCheck,
  Plane,
  Sparkles,
  Heart,
  Award,
  Headphones,
  ArrowRight,
} from 'lucide-react';

interface Agency {
  id: string;
  slug: string;
  agencyName: string;
  agencyType: string | null;
  ownerName: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  phone: string;
  email: string;
  city: string | null;
  state: string | null;
  address: string | null;
  status: string;
  isVerified: boolean;
  rating: number | null;
  totalRatings: number;
  memberSince: string;
  memberSinceMonths: number;
}

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
  highlights: string[];
  rating: number | null;
}

interface Property {
  id: string;
  slug: string | null;
  name: string;
  propertyType: string;
  city: string | null;
  totalRooms: number;
  startingPrice: number | null;
  coverImage: string | null;
  rating: number | null;
}

interface Fleet {
  id: string;
  vehicleType: string;
  vehicleName: string;
  brand: string | null;
  yearOfManufacture: number | null;
  seatingCapacity: number | null;
  fuelType: string | null;
  chauffeurIncluded: boolean;
  ratePerDay: number | null;
  ratePerKm: number | null;
  coverImage: string | null;
  baseLocation: string | null;
  isAvailable: boolean;
}

interface Stats {
  toursCount: number;
  propertiesCount: number;
  fleetCount: number;
  bookingsCount: number;
  leadsCount: number;
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

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  MUV: 'MUV',
  HATCHBACK: 'Hatchback',
  TEMPO_TRAVELLER: 'Tempo Traveller',
  MINI_BUS: 'Mini Bus',
  BUS: 'Bus',
  LUXURY_CAR: 'Luxury Car',
  BIKE: 'Bike',
  SCOOTER: 'Scooter',
  CAMPER_VAN: 'Camper Van',
  OTHER: 'Other',
};

const toTitleCase = (s: string): string =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  SEDAN: '🚗',
  SUV: '🚙',
  MUV: '🚐',
  HATCHBACK: '🚗',
  TEMPO_TRAVELLER: '🚐',
  MINI_BUS: '🚌',
  BUS: '🚌',
  LUXURY_CAR: '🏎️',
  BIKE: '🏍️',
  SCOOTER: '🛵',
  CAMPER_VAN: '🚐',
  OTHER: '🚗',
};

export default function PublicAgentProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [agency, setAgency] = useState<Agency | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [fleet, setFleet] = useState<Fleet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tours' | 'properties' | 'fleet'>('tours');
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/agent/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setAgency(json.agency);
          setTours(json.tours || []);
          setProperties(json.properties || []);
          setFleet(json.fleet || []);
          setStats(json.stats);
          // Pick the first non-empty tab as default
          if (json.tours?.length === 0) {
            if (json.properties?.length > 0) setActiveTab('properties');
            else if (json.fleet?.length > 0) setActiveTab('fleet');
          }
        } else {
          const j = await res.json();
          setError(j.error || 'Agency not found');
        }
      } catch {
        setError('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: agency?.agencyName || 'Travel Agency',
          text: agency?.description || `Check out ${agency?.agencyName}`,
          url,
        });
      } catch {
        // user cancelled or share failed silently
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Plane className="w-7 h-7 text-white animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 absolute -inset-2 animate-spin text-emerald-500/40" />
        </div>
        <p className="mt-6 text-sm font-semibold text-emerald-800">Packing your journey...</p>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Agency Not Found</h2>
          <p className="text-gray-600 text-sm">{error || 'This profile is not available.'}</p>
          <Link
            href="/wander"
            className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline"
          >
            ← Browse all tours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-sky-600 via-emerald-700 to-teal-900 text-white overflow-hidden">
        {/* soft glow blobs */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #fbbf24 0%, transparent 35%), radial-gradient(circle at 85% 10%, #38bdf8 0%, transparent 40%), radial-gradient(circle at 70% 80%, #10b981 0%, transparent 45%)',
          }}
        />
        {/* dotted travel pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* floating clouds */}
        <div className="absolute top-8 left-[5%] w-32 h-10 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-20 right-[8%] w-40 h-12 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-32 left-[40%] w-24 h-8 bg-white/10 rounded-full blur-xl pointer-events-none" />

        {/* animated plane with dotted trail */}
        <div className="absolute top-10 right-6 sm:right-16 pointer-events-none animate-bounce" style={{ animationDuration: '3.5s' }}>
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline-flex items-center text-white/40 text-[10px] tracking-[0.4em]">
              ✈ TRAVEL · WANDER · EXPLORE
            </span>
            <div className="bg-white/20 backdrop-blur p-2 rounded-full">
              <Plane className="w-4 h-4 text-white -rotate-12" />
            </div>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {agency.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agency.logo}
                    alt={agency.agencyName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white/40 shadow-2xl shadow-black/30"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 border-4 border-white/40 shadow-2xl shadow-black/30 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                )}
                {agency.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1.5 shadow-lg ring-2 ring-white">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {agency.isVerified && (
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                      <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED PARTNER
                    </span>
                  )}
                  {agency.agencyType && (
                    <span className="inline-flex bg-white/20 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 mr-1" />
                      {agency.agencyType}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-sm capitalize">
                  {agency.agencyName}
                </h1>
                <p className="text-emerald-50 text-sm sm:text-base mt-2 flex items-center gap-1.5 flex-wrap">
                  <span>Curated journeys by</span>
                  <span className="font-bold text-white capitalize">{agency.ownerName}</span>
                  {agency.city && (
                    <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full text-xs">
                      <MapPin className="w-3 h-3" />
                      {agency.city}
                      {agency.state && `, ${agency.state}`}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-emerald-50">
                  {agency.rating && agency.totalRatings > 0 && (
                    <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <strong className="text-white">{agency.rating.toFixed(1)}</strong>
                      <span className="text-emerald-100">({agency.totalRatings})</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    Travelling with us for {agency.memberSinceMonths} month
                    {agency.memberSinceMonths !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-amber-50 text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-black/20 transition-all hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
              {shareCopied ? 'Link Copied!' : 'Share Profile'}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-10">
            <HeroStat label="Tours" value={stats?.toursCount ?? 0} icon={Compass} />
            <HeroStat label="Stays" value={stats?.propertiesCount ?? 0} icon={Bed} />
            <HeroStat label="Vehicles" value={stats?.fleetCount ?? 0} icon={Car} />
          </div>
        </div>

        {/* mountain silhouette at bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full h-16 sm:h-24 text-white"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,120 L0,80 L120,40 L240,75 L360,30 L480,70 L600,20 L720,65 L840,35 L960,75 L1080,25 L1200,60 L1320,40 L1440,80 L1440,120 Z"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M0,120 L0,95 L100,70 L220,90 L340,55 L460,85 L580,50 L700,90 L820,60 L940,95 L1060,55 L1180,85 L1300,65 L1440,95 L1440,120 Z"
          />
        </svg>
      </div>

      {/* ── Quick Trust Strip ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-2 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-emerald-900/5 border border-emerald-100 px-4 py-4 sm:py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
            <TrustItem
              icon={ShieldCheck}
              tint="emerald"
              title={agency.isVerified ? 'Verified' : 'Listed'}
              subtitle={agency.isVerified ? 'TransRentals partner' : 'Travel partner'}
            />
            <TrustItem
              icon={Award}
              tint="amber"
              title="Curated Trips"
              subtitle="Hand-picked experiences"
            />
            <TrustItem
              icon={Headphones}
              tint="sky"
              title="Direct Contact"
              subtitle="Talk to the agency"
            />
            <TrustItem
              icon={Heart}
              tint="rose"
              title="Trusted"
              subtitle={`${agency.memberSinceMonths}+ months`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── About + Contact ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full opacity-60 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-50 rounded-full opacity-60 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">About the Journey</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {agency.description ||
                  `Welcome aboard! ${toTitleCase(agency.agencyName)} crafts memorable travel experiences — from curated tours and cosy stays to comfortable rides. Whether it's a quick getaway or a planned pilgrimage, the team is ready to help you wander right.`}
              </p>
              {agency.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mt-4 pt-4 border-t border-dashed border-gray-200">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="mt-0.5">
                    {agency.address}
                    {agency.city && `, ${agency.city}`}
                    {agency.state && `, ${agency.state}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 relative overflow-hidden text-white shadow-lg shadow-emerald-900/20">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 90% 10%, #fbbf24 0%, transparent 40%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Plane className="w-5 h-5 text-amber-300" />
                <h2 className="text-lg font-bold">Plan Your Trip</h2>
              </div>
              <p className="text-xs text-emerald-100 mb-4">
                Reach out — we&apos;ll tailor the perfect getaway.
              </p>
              <div className="space-y-2">
                <a
                  href={`tel:${agency.phone}`}
                  className="flex items-center justify-center gap-2 w-full bg-white text-emerald-700 hover:bg-amber-50 font-bold text-sm px-3 py-3 rounded-xl shadow transition-all hover:scale-[1.02]"
                >
                  <Phone className="w-4 h-4" /> Call {agency.phone}
                </a>
                <a
                  href={`https://wa.me/91${String(agency.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                    `Hi ${agency.agencyName}, I saw your profile on TransRentals and wanted to enquire`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white font-bold text-sm px-3 py-3 rounded-xl shadow transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Chat
                </a>
                <a
                  href={`mailto:${agency.email}`}
                  className="flex items-center justify-center gap-2 w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-semibold text-sm px-3 py-2.5 rounded-xl"
                >
                  <Mail className="w-4 h-4" /> Email Enquiry
                </a>
                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-semibold text-sm px-3 py-2.5 rounded-xl"
                  >
                    <Globe className="w-4 h-4" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Tabs ── */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                What we offer
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse our tours, stays and rides — pick what suits your trip
              </p>
            </div>
          </div>
          {(stats?.toursCount ?? 0) + (stats?.propertiesCount ?? 0) + (stats?.fleetCount ?? 0) > 0 && (
            <div className="flex gap-2 mb-6 p-1.5 bg-gradient-to-r from-emerald-50 via-sky-50 to-amber-50 rounded-2xl overflow-x-auto border border-emerald-100">
              {(stats?.toursCount ?? 0) > 0 && (
                <TabButton
                  active={activeTab === 'tours'}
                  onClick={() => setActiveTab('tours')}
                  icon={Compass}
                  label="Tours"
                  count={stats?.toursCount ?? 0}
                />
              )}
              {(stats?.propertiesCount ?? 0) > 0 && (
                <TabButton
                  active={activeTab === 'properties'}
                  onClick={() => setActiveTab('properties')}
                  icon={Bed}
                  label="Stays"
                  count={stats?.propertiesCount ?? 0}
                />
              )}
              {(stats?.fleetCount ?? 0) > 0 && (
                <TabButton
                  active={activeTab === 'fleet'}
                  onClick={() => setActiveTab('fleet')}
                  icon={Car}
                  label="Vehicles"
                  count={stats?.fleetCount ?? 0}
                />
              )}
            </div>
          )}

          {/* Tours tab */}
          {activeTab === 'tours' &&
            (tours.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No tours published yet"
                desc="Get in touch directly for custom trip planning."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tours.map((t) => (
                  <Link
                    key={t.id}
                    href={`/wander/${t.slug || t.id}`}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all overflow-hidden group"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-emerald-100 via-sky-100 to-amber-100 relative overflow-hidden">
                      {t.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.coverImage}
                          alt={t.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🗺️
                        </div>
                      )}
                      {/* gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-80 pointer-events-none" />
                      {t.category && (
                        <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow uppercase tracking-wide">
                          {t.category}
                        </span>
                      )}
                      {t.rating && (
                        <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-gray-900 text-[11px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {t.rating.toFixed(1)}
                        </span>
                      )}
                      {/* destination ribbon at bottom-left */}
                      <div className="absolute bottom-3 left-3 text-white text-xs font-bold inline-flex items-center gap-1 drop-shadow">
                        <MapPin className="w-3.5 h-3.5" /> {t.destination}
                      </div>
                      {t.startingPrice && (
                        <div className="absolute bottom-3 right-3 bg-white text-emerald-700 text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-0.5 shadow-lg">
                          <IndianRupee className="w-3 h-3" />
                          {t.startingPrice.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                          <Calendar className="w-3 h-3" />
                          {t.durationDays}D{t.durationNights > 0 ? `/${t.durationNights}N` : ''}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2">{t.description}</p>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
                        Explore tour <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

          {/* Properties tab */}
          {activeTab === 'properties' &&
            (properties.length === 0 ? (
              <EmptyState
                icon={Bed}
                title="No properties listed yet"
                desc="Reach out to enquire about accommodations."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map((p) => (
                  <Link
                    key={p.id}
                    href={`/agent/${slug}/property/${p.slug || p.id}`}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all overflow-hidden group block"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-amber-100 via-rose-100 to-emerald-100 relative overflow-hidden">
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.coverImage}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🏨
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-80 pointer-events-none" />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-gray-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow uppercase tracking-wide">
                        {PROPERTY_TYPE_LABELS[p.propertyType]}
                      </span>
                      {p.rating && (
                        <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-gray-900 text-[11px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                      {p.city && (
                        <div className="absolute bottom-3 left-3 text-white text-xs font-bold inline-flex items-center gap-1 drop-shadow">
                          <MapPin className="w-3.5 h-3.5" /> {p.city}
                        </div>
                      )}
                      {p.startingPrice && (
                        <div className="absolute bottom-3 right-3 bg-white text-emerald-700 text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-0.5 shadow-lg">
                          <IndianRupee className="w-3 h-3" />
                          {p.startingPrice.toLocaleString('en-IN')}
                          <span className="text-[10px] text-gray-500 font-semibold ml-0.5">/night</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                        <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                          <Bed className="w-3 h-3" /> {p.totalRooms} room{p.totalRooms !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
                        View stay <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

          {/* Fleet tab */}
          {activeTab === 'fleet' &&
            (fleet.length === 0 ? (
              <EmptyState
                icon={Car}
                title="No vehicles in fleet yet"
                desc="Reach out for transport options."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {fleet.map((f) => (
                  <Link
                    key={f.id}
                    href={`/agent/${slug}/vehicle/${f.id}`}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all overflow-hidden group block"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-sky-100 via-emerald-100 to-amber-100 relative overflow-hidden">
                      {f.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.coverImage}
                          alt={f.vehicleName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          {VEHICLE_TYPE_ICONS[f.vehicleType] || '🚗'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-80 pointer-events-none" />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-gray-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow uppercase tracking-wide">
                        {VEHICLE_TYPE_LABELS[f.vehicleType]}
                      </span>
                      {!f.isAvailable ? (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow uppercase">
                          Busy
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow uppercase inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Available
                        </span>
                      )}
                      {f.ratePerDay && (
                        <div className="absolute bottom-3 right-3 bg-white text-emerald-700 text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-0.5 shadow-lg">
                          <IndianRupee className="w-3 h-3" />
                          {f.ratePerDay.toLocaleString('en-IN')}
                          <span className="text-[10px] text-gray-500 font-semibold ml-0.5">/day</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {f.vehicleName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {f.brand && `${f.brand} • `}
                        {f.yearOfManufacture}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600 mt-2">
                        {f.seatingCapacity && (
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                            <Users className="w-3 h-3" /> {f.seatingCapacity}
                          </span>
                        )}
                        {f.fuelType && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            <Fuel className="w-3 h-3" /> {f.fuelType}
                          </span>
                        )}
                        {f.baseLocation && (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-0.5 rounded-full font-semibold truncate max-w-[140px]">
                            <MapPin className="w-3 h-3" /> {f.baseLocation}
                          </span>
                        )}
                      </div>
                      {f.chauffeurIncluded && (
                        <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Chauffeur Included
                        </span>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
                        View vehicle <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
        </section>

        {/* ── Plan-your-trip CTA banner ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 sm:p-8 text-white shadow-xl shadow-orange-900/20">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 35%), radial-gradient(circle at 90% 10%, #ffffff 0%, transparent 30%)',
            }}
          />
          <div className="absolute -right-6 -top-6 text-white/10">
            <Plane className="w-40 h-40 -rotate-12" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2">
                <Sparkles className="w-3 h-3" /> Ready to wander?
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                Let {agency.agencyName} plan your next trip
              </h3>
              <p className="text-sm text-white/90 mt-1">
                Personalised itineraries · Trusted partners · Real humans, no bots
              </p>
            </div>
            <a
              href={`tel:${agency.phone}`}
              className="shrink-0 inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-amber-50 font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              <Phone className="w-4 h-4" /> Call now
            </a>
          </div>
        </section>

        {/* ── Footer / Powered by ── */}
        <section className="text-center pt-6 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
            <Plane className="w-3 h-3" />
            Powered by{' '}
            <Link href="/" className="font-bold text-emerald-600 hover:underline">
              TransRentals
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="bg-white/15 hover:bg-white/25 transition-colors backdrop-blur border border-white/30 rounded-2xl px-4 py-4 text-center group">
      <div className="flex items-center justify-center gap-1.5 text-amber-200 text-[11px] font-bold uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-3xl sm:text-4xl font-extrabold mt-1 group-hover:scale-110 transition-transform">
        {value}
      </p>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  tint,
  title,
  subtitle,
}: {
  icon: any;
  tint: 'emerald' | 'amber' | 'sky' | 'rose';
  title: string;
  subtitle: string;
}) {
  const tints: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tints[tint]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
        <p className="text-[11px] text-gray-500 leading-tight truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
        active
          ? 'bg-white text-emerald-700 shadow-md shadow-emerald-900/10 ring-1 ring-emerald-200'
          : 'text-gray-600 hover:text-emerald-700 hover:bg-white/60'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span
        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
          active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-700 font-medium">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}
