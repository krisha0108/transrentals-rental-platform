'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Car,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Fuel,
  Power,
  PowerOff,
  CalendarCheck,
  CalendarOff,
  CalendarDays,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Fleet {
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
  baseLocation: string | null;
  ratePerDay: number | null;
  ratePerKm: number | null;
  coverImage: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isBooked?: boolean;
  currentBooking?: { startDate: string; endDate: string } | null;
  totalTrips: number;
  rating: number | null;
  totalRatings: number;
}

const TYPE_LABELS: Record<string, string> = {
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

const TYPE_ICONS: Record<string, string> = {
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

export default function FleetListPage() {
  const { showToast } = useToast();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'ALL') params.append('vehicleType', typeFilter);
      const res = await fetch(`/api/travel-agent/fleet?${params}`);
      if (res.ok) {
        const json = await res.json();
        setFleets(json.fleets || []);
        setStats(json.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter]);

  const toggleActive = async (f: Fleet) => {
    const res = await fetch(`/api/travel-agent/fleet/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !f.isActive }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: f.isActive ? 'Vehicle deactivated' : 'Vehicle activated' });
      await load();
    }
  };

  const toggleAvailable = async (f: Fleet) => {
    const res = await fetch(`/api/travel-agent/fleet/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !f.isAvailable }),
    });
    if (res.ok) {
      showToast({
        type: 'success',
        title: f.isAvailable ? 'Marked as unavailable' : 'Marked as available',
      });
      await load();
    }
  };

  const deleteFleet = async (id: string) => {
    if (!confirm('Permanently delete this vehicle?')) return;
    const res = await fetch(`/api/travel-agent/fleet/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Vehicle deleted' });
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-sm text-gray-500">
              {stats.total} total • {stats.active} active • {stats.available} available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/travel-agent/fleet/calendar"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <CalendarDays className="w-4 h-4 text-emerald-600" /> Calendar
          </Link>
          <Link
            href="/travel-agent/fleet/insurance"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Insurance
          </Link>
          <Link
            href="/travel-agent/fleet/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex-1 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, brand, registration or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : fleets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No vehicles in your fleet yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add the cars, buses, or bikes you use for tour transport
          </p>
          <Link
            href="/travel-agent/fleet/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleets.map((f) => {
            // A vehicle is unavailable either because the agent flipped the
            // manual flag, or because the Fleet Calendar holds a booking that
            // hasn't ended yet (`isBooked`, derived server-side) — mirrors the
            // app's VehicleCard logic, which the web list used to ignore.
            const bookedNow = f.isBooked === true;
            const isAvail = !bookedNow && f.isAvailable;
            return (
            <div
              key={f.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                f.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <Link href={`/travel-agent/fleet/${f.id}`}>
              <div className="aspect-[16/9] bg-gradient-to-br from-emerald-100 to-teal-100 relative">
                {f.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.coverImage} alt={f.vehicleName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {TYPE_ICONS[f.vehicleType] || '🚗'}
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                  <span className="inline-flex bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[f.vehicleType]}
                  </span>
                  {isAvail ? (
                    <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CalendarCheck className="w-2.5 h-2.5" /> AVAILABLE
                    </span>
                  ) : bookedNow ? (
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CalendarOff className="w-2.5 h-2.5" /> BOOKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CalendarOff className="w-2.5 h-2.5" /> BUSY
                    </span>
                  )}
                  {!f.isActive && (
                    <span className="inline-flex bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      INACTIVE
                    </span>
                  )}
                </div>
                {f.ratePerDay && (
                  <div className="absolute bottom-2 right-2 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {f.ratePerDay.toLocaleString('en-IN')}/day
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="font-bold text-gray-900 line-clamp-1">{f.vehicleName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {f.brand && <span>{f.brand}</span>}
                  {f.model && <span> • {f.model}</span>}
                  {f.yearOfManufacture && <span> • {f.yearOfManufacture}</span>}
                </p>
                {f.registrationNumber && (
                  <p className="font-mono text-[10px] text-gray-700 bg-gray-100 inline-block mt-1.5 px-2 py-0.5 rounded">
                    {f.registrationNumber}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                  {f.seatingCapacity && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" /> {f.seatingCapacity} seats
                    </span>
                  )}
                  {f.fuelType && (
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-gray-400" /> {f.fuelType}
                    </span>
                  )}
                  {f.baseLocation && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-gray-400" /> {f.baseLocation}
                    </span>
                  )}
                </div>
              </div>
              </Link>

              <div className="flex items-center justify-between gap-2 mx-4 pb-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAvailable(f)}
                      title={f.isAvailable ? 'Mark unavailable' : 'Mark available'}
                      className={`p-1.5 rounded-lg border ${
                        f.isAvailable
                          ? 'border-green-200 text-green-700 hover:bg-green-50'
                          : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {f.isAvailable ? (
                        <CalendarCheck className="w-3.5 h-3.5" />
                      ) : (
                        <CalendarOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleActive(f)}
                      title={f.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                    >
                      {f.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteFleet(f.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Link
                    href={`/travel-agent/fleet/${f.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
