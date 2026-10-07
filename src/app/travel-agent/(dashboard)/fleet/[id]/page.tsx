'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Car,
  Users,
  Briefcase,
  Fuel,
  Settings2,
  IndianRupee,
  Phone,
  Shield,
  CalendarDays,
  Star,
  MapPin,
} from 'lucide-react';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface FleetVehicle {
  id: string;
  vehicleType: string;
  vehicleName: string;
  brand: string | null;
  model: string | null;
  registrationNumber: string | null;
  yearOfManufacture: number | null;
  color: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  luggageCapacity: number | null;
  chauffeurIncluded: boolean;
  chauffeurName: string | null;
  chauffeurPhone: string | null;
  chauffeurLanguages: string | null;
  amenities: string | null;
  baseLocation: string | null;
  ratePerDay: number | null;
  ratePerKm: number | null;
  minimumBookingHours: number | null;
  description: string | null;
  coverImage: string | null;
  galleryImages: string | null;
  insuranceProvider: string | null;
  insuranceValidity: string | null;
  fitnessValidity: string | null;
  permitType: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isBooked?: boolean;
  currentBooking?: { customerName: string | null; endDate: string } | null;
  totalTrips: number;
  rating: number | null;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  SEDAN: 'Sedan', SUV: 'SUV', MUV: 'MUV', HATCHBACK: 'Hatchback',
  TEMPO_TRAVELLER: 'Tempo Traveller', MINI_BUS: 'Mini Bus', BUS: 'Bus',
  LUXURY_CAR: 'Luxury Car', BIKE: 'Bike', SCOOTER: 'Scooter',
  CAMPER_VAN: 'Camper Van', OTHER: 'Other',
};

const INR = (n: number | null) => (n == null ? null : `₹${n.toLocaleString('en-IN')}`);
const titleCase = (s: string | null) =>
  !s ? '' : s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
function parseArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

export default function FleetVehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/travel-agent/fleet/${id}`);
        if (res.ok) {
          setVehicle(await res.json());
        } else {
          const j = await res.json();
          setError(j.error || 'Failed to load vehicle');
        }
      } catch {
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useTravelAgentPageHeader(
    vehicle ? vehicle.vehicleName : 'Vehicle Details',
    vehicle ? TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType : undefined,
    vehicle ? (
      <Link
        key="edit"
        href={`/travel-agent/fleet/${id}/edit`}
        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edit
      </Link>
    ) : undefined,
    <Link key="back" href="/travel-agent/fleet" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600">
      <ArrowLeft className="w-4 h-4" /> All Vehicles
    </Link>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          {error || 'Vehicle not found'}
        </div>
      </div>
    );
  }

  const isActive = vehicle.isActive !== false;
  const bookedNow = vehicle.isBooked === true;
  const isAvail = !bookedNow && vehicle.isAvailable !== false;
  const gallery = parseArray(vehicle.galleryImages);
  const amenities = parseArray(vehicle.amenities);
  const languages = parseArray(vehicle.chauffeurLanguages);
  const rate = INR(vehicle.ratePerDay) || INR(vehicle.ratePerKm);
  const rateUnit = vehicle.ratePerDay ? 'per day' : vehicle.ratePerKm ? 'per km' : null;

  const facts = [
    { key: 'seats', icon: Users, label: 'Seats', value: vehicle.seatingCapacity },
    { key: 'luggage', icon: Briefcase, label: 'Bags', value: vehicle.luggageCapacity },
    { key: 'fuel', icon: Fuel, label: 'Fuel', value: titleCase(vehicle.fuelType) },
    { key: 'trans', icon: Settings2, label: 'Gearbox', value: titleCase(vehicle.transmission) },
  ].filter((f) => f.value != null && f.value !== '' && f.value !== 0);

  const docs = [
    { key: 'ins', label: 'Insurance', date: vehicle.insuranceValidity, extra: vehicle.insuranceProvider },
    { key: 'fit', label: 'Fitness', date: vehicle.fitnessValidity, extra: null },
    { key: 'perm', label: 'Permit', date: null, extra: vehicle.permitType },
  ].filter((d) => d.date || d.extra);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 bg-white/15 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2">
          <Car className="w-3 h-3" /> {TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
        </div>
        <h1 className="text-2xl font-bold">{vehicle.vehicleName}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-emerald-100">
          {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') && (
            <span>{[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}</span>
          )}
          {vehicle.registrationNumber && <span className="font-mono">{vehicle.registrationNumber}</span>}
          {vehicle.baseLocation && (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {vehicle.baseLocation}</span>
          )}
        </div>
      </div>

      {/* Cover + gallery */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
          {vehicle.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehicle.coverImage} alt={vehicle.vehicleName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-12 h-12 text-emerald-300" />
            </div>
          )}
        </div>
        {gallery.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {gallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${url}-${i}`} src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
            ))}
          </div>
        )}
      </div>

      {/* Rate + status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4">
        {rate ? (
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{rate}</p>
            <p className="text-xs text-gray-500">{rateUnit}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No rate set</p>
        )}
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {isActive ? 'ACTIVE' : 'PAUSED'}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isAvail ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isAvail ? 'FREE' : 'BOOKED'}
          </span>
        </div>
      </div>

      {bookedNow && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Held by a calendar booking
          {vehicle.currentBooking?.customerName ? ` — ${vehicle.currentBooking.customerName}` : ''}
          {vehicle.currentBooking?.endDate ? ` until ${formatDate(vehicle.currentBooking.endDate)}` : ''}
        </div>
      )}

      {/* Fact strip */}
      {facts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {facts.map((f) => (
            <div key={f.key} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{f.value}</p>
                <p className="text-[11px] text-gray-500">{f.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {(vehicle.ratePerDay || vehicle.ratePerKm || vehicle.minimumBookingHours) && (
        <SectionCard icon={IndianRupee} title="Pricing">
          {!!vehicle.ratePerDay && <InfoRow label="Per day" value={INR(vehicle.ratePerDay)!} />}
          {!!vehicle.ratePerKm && <InfoRow label="Per km" value={INR(vehicle.ratePerKm)!} />}
          {!!vehicle.minimumBookingHours && <InfoRow label="Minimum booking" value={`${vehicle.minimumBookingHours} hrs`} last />}
        </SectionCard>
      )}

      {/* Chauffeur */}
      {(vehicle.chauffeurIncluded || vehicle.chauffeurName || vehicle.chauffeurPhone) && (
        <SectionCard icon={Users} title="Chauffeur">
          <InfoRow label="Included" value={vehicle.chauffeurIncluded ? 'Yes' : 'No'} />
          {!!vehicle.chauffeurName && <InfoRow label="Name" value={vehicle.chauffeurName} />}
          {!!vehicle.chauffeurPhone && (
            <InfoRow
              label="Phone"
              value={
                <a href={`tel:${vehicle.chauffeurPhone}`} className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {vehicle.chauffeurPhone}
                </a>
              }
              last={languages.length === 0}
            />
          )}
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {languages.map((l) => (
                <span key={l} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{l}</span>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Specifications */}
      {(vehicle.yearOfManufacture || vehicle.color || vehicle.registrationNumber || vehicle.baseLocation) && (
        <SectionCard icon={Settings2} title="Specifications">
          {!!vehicle.registrationNumber && <InfoRow label="Registration" value={vehicle.registrationNumber} />}
          {!!vehicle.yearOfManufacture && <InfoRow label="Year" value={String(vehicle.yearOfManufacture)} />}
          {!!vehicle.color && <InfoRow label="Colour" value={titleCase(vehicle.color)} />}
          {!!vehicle.baseLocation && <InfoRow label="Base location" value={vehicle.baseLocation} last />}
        </SectionCard>
      )}

      {/* Documents & validity */}
      {docs.length > 0 && (
        <SectionCard icon={Shield} title="Documents & validity">
          {docs.map((d, i) => {
            const days = daysUntil(d.date);
            const expired = days != null && days < 0;
            const expiring = days != null && days >= 0 && days <= 30;
            return (
              <InfoRow
                key={d.key}
                label={d.label}
                value={
                  <span className="flex items-center gap-2">
                    {d.extra && <span>{d.extra}</span>}
                    {d.date && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        expired ? 'bg-red-100 text-red-700' : expiring ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {expired ? `Expired ${formatDate(d.date)}` : `Valid till ${formatDate(d.date)}`}
                      </span>
                    )}
                  </span>
                }
                last={i === docs.length - 1}
              />
            );
          })}
        </SectionCard>
      )}

      {/* About */}
      {!!vehicle.description && (
        <SectionCard icon={Car} title="About this vehicle">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
        </SectionCard>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <SectionCard icon={Star} title="Amenities">
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <span key={a} className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">{titleCase(a)}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Meta */}
      <SectionCard icon={CalendarDays} title="Details">
        <InfoRow label="Total trips" value={String(vehicle.totalTrips ?? 0)} />
        {(vehicle.totalRatings || 0) > 0 && (
          <InfoRow label="Rating" value={`${vehicle.rating} ★  (${vehicle.totalRatings})`} />
        )}
        <InfoRow label="Added" value={formatDate(vehicle.createdAt)} />
        <InfoRow label="Updated" value={formatDate(vehicle.updatedAt)} last />
      </SectionCard>

      <div className="flex gap-2">
        <Link
          href={`/travel-agent/fleet/${id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl"
        >
          <Edit2 className="w-4 h-4" /> Edit vehicle
        </Link>
        <Link
          href="/travel-agent/fleet/calendar"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 text-gray-700 font-semibold text-sm py-3 rounded-xl"
        >
          <CalendarDays className="w-4 h-4" /> Open fleet calendar
        </Link>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-600" /> {title}
      </h2>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 text-sm ${last ? '' : ''}`}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  );
}
