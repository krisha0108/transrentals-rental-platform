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
  Car,
  Users,
  Fuel,
  IndianRupee,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Plane,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Calendar,
  Briefcase,
  Palette,
} from 'lucide-react';

interface Fleet {
  id: string;
  vehicleType: string;
  vehicleName: string;
  brand: string | null;
  model: string | null;
  yearOfManufacture: number | null;
  color: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  luggageCapacity: number | null;
  chauffeurIncluded: boolean;
  amenities: string[];
  ratePerDay: number | null;
  ratePerKm: number | null;
  coverImage: string | null;
  galleryImages: string[];
  isAvailable: boolean;
  baseLocation: string | null;
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

export default function VehicleDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const { slug, id } = params;
  const [vehicle, setVehicle] = useState<Fleet | null>(null);
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
          setError(j.error || 'Could not load vehicle');
          return;
        }
        const json = await res.json();
        setAgency(json.agency);
        const found = (json.fleet as Fleet[]).find((f) => f.id === id);
        if (!found) {
          setError('Vehicle not found');
          return;
        }
        setVehicle(found);
      } catch {
        setError('Could not load vehicle');
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
            <Car className="w-7 h-7 text-white animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 absolute -inset-2 animate-spin text-emerald-500/40" />
        </div>
        <p className="mt-6 text-sm font-semibold text-emerald-800">Starting the engine...</p>
      </div>
    );
  }

  if (error || !vehicle || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
          <p className="text-gray-600 text-sm">{error || 'This vehicle is not available.'}</p>
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
    ...(vehicle.coverImage ? [vehicle.coverImage] : []),
    ...(vehicle.galleryImages || []),
  ];
  const hasImages = images.length > 0;
  const whatsappUrl = `https://wa.me/91${String(agency.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    `Hi ${agency.agencyName}, I'm interested in renting "${vehicle.vehicleName}" listed on your TransRentals page.`,
  )}`;

  const specs = [
    vehicle.seatingCapacity != null && {
      icon: Users,
      label: 'Seats',
      value: `${vehicle.seatingCapacity} seater`,
    },
    vehicle.fuelType && { icon: Fuel, label: 'Fuel', value: vehicle.fuelType },
    vehicle.transmission && {
      icon: Settings2,
      label: 'Transmission',
      value: vehicle.transmission,
    },
    vehicle.yearOfManufacture && {
      icon: Calendar,
      label: 'Year',
      value: String(vehicle.yearOfManufacture),
    },
    vehicle.luggageCapacity != null && {
      icon: Briefcase,
      label: 'Luggage',
      value: `${vehicle.luggageCapacity} bags`,
    },
    vehicle.color && { icon: Palette, label: 'Color', value: vehicle.color },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white pb-24 sm:pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/agent/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {agency.agencyName}
          </Link>
          {vehicle.isAvailable ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> AVAILABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
              BUSY
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Gallery */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-100 to-amber-100 aspect-[16/10]">
            {hasImages ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImage]}
                alt={vehicle.vehicleName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">
                {VEHICLE_TYPE_ICONS[vehicle.vehicleType] || '🚗'}
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="bg-white/95 backdrop-blur text-gray-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow uppercase tracking-wide">
                {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
              </span>
              {vehicle.chauffeurIncluded && (
                <span className="bg-emerald-500 text-white text-xs font-extrabold px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> With Chauffeur
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
                  <img src={img} alt={`${vehicle.vehicleName} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Title block */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-50 rounded-full opacity-60 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {vehicle.vehicleName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {[vehicle.brand, vehicle.model, vehicle.yearOfManufacture]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              {vehicle.baseLocation && (
                <p className="mt-2 text-sm text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  Based in {vehicle.baseLocation}
                </p>
              )}
            </div>
            <div className="text-right">
              {vehicle.ratePerDay && (
                <>
                  <p className="text-[11px] uppercase font-bold tracking-widest text-gray-500">
                    Day rate
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700 inline-flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    {vehicle.ratePerDay.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500">per day</p>
                </>
              )}
              {vehicle.ratePerKm && (
                <p className="text-xs text-gray-600 mt-1">
                  + ₹{vehicle.ratePerKm}/km extra
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Specs grid */}
        {specs.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" /> Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-sky-50 border border-emerald-100 rounded-xl p-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      {s.label}
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {vehicle.amenities && vehicle.amenities.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">On-board features</h2>
            <div className="flex flex-wrap gap-2">
              {vehicle.amenities.map((a, i) => (
                <span
                  key={`${a}-${i}`}
                  className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100"
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
                  Operated by{' '}
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
