'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Building2,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Globe,
  Lock,
  Power,
  PowerOff,
  Bed,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';

interface Property {
  id: string;
  name: string;
  slug: string | null;
  propertyType: string;
  city: string | null;
  state: string | null;
  totalRooms: number;
  startingPrice: number | null;
  coverImage: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
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

export default function PropertiesListPage() {
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'ALL') params.append('propertyType', typeFilter);
      const res = await fetch(`/api/travel-agent/properties?${params}`);
      if (res.ok) {
        const json = await res.json();
        setProperties(json.properties || []);
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

  const togglePublic = async (p: Property) => {
    if (!p.isPublic && !isApproved) {
      openVerificationModal();
      return;
    }
    const res = await fetch(`/api/travel-agent/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !p.isPublic }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: p.isPublic ? 'Property unpublished' : 'Property published' });
      await load();
    } else {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Failed' });
    }
  };

  const toggleActive = async (p: Property) => {
    const res = await fetch(`/api/travel-agent/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      showToast({ type: 'success', title: p.isActive ? 'Deactivated' : 'Activated' });
      await load();
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Permanently delete this property?')) return;
    const res = await fetch(`/api/travel-agent/properties/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Property deleted' });
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <p className="text-sm text-gray-500">
              {stats.total} total • {stats.active} active • {stats.published} published
            </p>
          </div>
        </div>
        <Link
          href="/travel-agent/properties/add"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Property
        </Link>
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
              placeholder="Search by name or city..."
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
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No properties added yet</p>
          <p className="text-sm text-gray-400 mb-4">
            List your resort, hotel, rooms or villa to start accepting bookings
          </p>
          <Link
            href="/travel-agent/properties/add"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                p.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="aspect-[16/9] bg-gradient-to-br from-emerald-100 to-teal-100 relative">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-emerald-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {p.isPublic ? (
                    <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Globe className="w-2.5 h-2.5" /> PUBLIC
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> DRAFT
                    </span>
                  )}
                  <span className="inline-flex bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[p.propertyType]}
                  </span>
                </div>
                {p.startingPrice && (
                  <div className="absolute bottom-2 right-2 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    ₹{p.startingPrice.toLocaleString('en-IN')}/night
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" /> {p.totalRooms} room{p.totalRooms !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePublic(p)}
                      title={p.isPublic ? 'Unpublish' : 'Publish'}
                      className={`p-1.5 rounded-lg border ${
                        p.isPublic
                          ? 'border-green-200 text-green-700 hover:bg-green-50'
                          : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {p.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                    >
                      {p.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteProperty(p.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Link
                    href={`/travel-agent/properties/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
