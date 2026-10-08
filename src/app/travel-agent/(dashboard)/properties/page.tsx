'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Plus, Building2, Search, Edit2, Trash2, MapPin,
  Globe, Lock, Power, PowerOff, Bed, Star, Users, Bath,
  ChevronDown, TrendingUp, CheckSquare, MessageCircle, Eye,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTravelAgentVerification } from '@/contexts/TravelAgentVerificationContext';
import { AMENITY_LABEL_MAP, parseAmenities, CANCELLATION_POLICIES } from '@/lib/property-amenities';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface Property {
  id: string;
  name: string;
  slug: string | null;
  propertyType: string;
  city: string | null;
  state: string | null;
  totalRooms: number;
  bedroomsCount: number | null;
  bathroomsCount: number | null;
  maxGuests: number | null;
  startingPrice: number | null;
  coverImage: string | null;
  amenities: string | null;
  description: string | null;
  inclusions: string | null;
  highlights: string | null;
  cancellationPolicy: string | null;
  minNights: number | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
  totalRatings: number;
  createdAt: string;
  enquiryCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  RESORT: 'Resort', HOTEL: 'Hotel', HOMESTAY: 'Homestay',
  APARTMENT: 'Apartment', VILLA: 'Villa', GUEST_HOUSE: 'Guest House',
  HOSTEL: 'Hostel', ROOMS: 'Rooms', OTHER: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
  RESORT: 'bg-cyan-100 text-cyan-800', HOTEL: 'bg-blue-100 text-blue-800',
  HOMESTAY: 'bg-green-100 text-green-800', APARTMENT: 'bg-purple-100 text-purple-800',
  VILLA: 'bg-pink-100 text-pink-800', GUEST_HOUSE: 'bg-orange-100 text-orange-800',
  HOSTEL: 'bg-yellow-100 text-yellow-800', ROOMS: 'bg-gray-100 text-gray-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

function completeness(p: Property): number {
  const checks = [
    !!p.name,
    !!p.description,
    !!p.city,
    !!p.coverImage,
    !!p.startingPrice,
    !!p.amenities,
    !!p.inclusions,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function PropertiesListPage() {
  const { showToast } = useToast();
  const { isApproved, openVerificationModal } = useTravelAgentVerification();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [agentSlug, setAgentSlug] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
    fetch('/api/travel-agent/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const s = j?.slug || j?.id; if (s) setAgentSlug(s); })
      .catch(() => {});
  }, []);

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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, typeFilter]); // eslint-disable-line

  const sorted = useMemo(() => {
    const arr = [...properties];
    if (sortBy === 'price_asc') return arr.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
    if (sortBy === 'price_desc') return arr.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
    if (sortBy === 'rating') return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'name') return arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr; // newest first (default from API)
  }, [properties, sortBy]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter((p) => p.isActive).length,
    published: properties.filter((p) => p.isPublic).length,
    avgRating: properties.filter((p) => (p.totalRatings || 0) > 0).length > 0
      ? (properties.reduce((s, p) => s + (p.rating || 0), 0) / properties.filter((p) => (p.totalRatings || 0) > 0).length).toFixed(1)
      : null,
    totalEnquiries: properties.reduce((s, p) => s + (p.enquiryCount || 0), 0),
  }), [properties]);

  const togglePublic = async (p: Property) => {
    if (!p.isPublic && !isApproved) { openVerificationModal(); return; }
    const res = await fetch(`/api/travel-agent/properties/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !p.isPublic }),
    });
    if (res.ok) { showToast({ type: 'success', title: p.isPublic ? 'Property unpublished' : 'Property published' }); load(); }
    else { const j = await res.json(); showToast({ type: 'error', title: j.error || 'Failed' }); }
  };

  const toggleActive = async (p: Property) => {
    const res = await fetch(`/api/travel-agent/properties/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) { showToast({ type: 'success', title: p.isActive ? 'Deactivated' : 'Activated' }); load(); }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Permanently delete this property?')) return;
    const res = await fetch(`/api/travel-agent/properties/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast({ type: 'success', title: 'Property deleted' }); load(); }
  };

  useTravelAgentPageHeader(
    'My Properties',
    'Manage your hotels, resorts, villas & stays',
    <Link
      key="add"
      href="/travel-agent/properties/add"
      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg"
    >
      <Plus className="w-3.5 h-3.5" /> Add Property
    </Link>,
  );

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: Power, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Published', value: stats.published, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Enquiries', value: stats.totalEnquiries, icon: MessageCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Avg Rating', value: stats.avgRating ?? '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
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
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="rating">Top Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((p) => (
            <PropertyCard
              key={p.id}
              p={p}
              publicUrl={agentSlug ? `${origin}/agent/${agentSlug}/property/${p.slug || p.id}` : null}
              onTogglePublic={() => togglePublic(p)}
              onToggleActive={() => toggleActive(p)}
              onDelete={() => deleteProperty(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({
  p,
  publicUrl,
  onTogglePublic,
  onToggleActive,
  onDelete,
}: {
  p: Property;
  publicUrl: string | null;
  onTogglePublic: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const canView = p.isPublic && p.isActive && !!publicUrl;
  const pct = completeness(p);
  const amenityIds = parseAmenities(p.amenities);
  const topAmenities = amenityIds.slice(0, 4).map((id) => AMENITY_LABEL_MAP[id]).filter(Boolean);
  const cancelPolicy = CANCELLATION_POLICIES.find((c) => c.value === p.cancellationPolicy);

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${p.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
      {/* Photo */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100">
        {p.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.coverImage}
              alt={p.name}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
            {/* Bottom gradient for badge/price legibility */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </>
        ) : (
          <Link
            href={`/travel-agent/properties/${p.id}/edit`}
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-emerald-300 hover:text-emerald-400 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">Add photos</span>
          </Link>
        )}
        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {p.isPublic ? (
            <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Globe className="w-2.5 h-2.5" /> PUBLIC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Lock className="w-2.5 h-2.5" /> DRAFT
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${TYPE_COLORS[p.propertyType] || 'bg-gray-100 text-gray-700'}`}>
            {TYPE_LABELS[p.propertyType]}
          </span>
        </div>
        {/* Price badge */}
        {p.startingPrice && (
          <div className="absolute bottom-2.5 right-2.5 bg-white text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
            ₹{p.startingPrice.toLocaleString('en-IN')}/night
          </div>
        )}
        {/* Min nights */}
        {p.minNights && p.minNights > 1 && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            {p.minNights} night min
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name + rating */}
        <div>
          <p className="font-bold text-gray-900 line-clamp-1 text-base">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {(p.totalRatings || 0) > 0 ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {(p.rating || 0).toFixed(1)}
                <span className="text-gray-400 font-normal ml-0.5">({p.totalRatings})</span>
              </span>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
            {p.totalBookings > 0 && (
              <span className="text-xs text-gray-400">· {p.totalBookings} booking{p.totalBookings !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Enquiry count — how many customers asked about this listing */}
        <div className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 self-start ${
          p.enquiryCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-50 text-gray-400'
        }`}>
          <MessageCircle className="w-3.5 h-3.5" />
          {p.enquiryCount > 0
            ? `${p.enquiryCount} enquir${p.enquiryCount !== 1 ? 'ies' : 'y'} received`
            : 'No enquiries yet'}
        </div>

        {/* Location */}
        {(p.city || p.state) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{[p.city, p.state].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {/* Capacity row */}
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-gray-400" />
            {p.totalRooms} room{p.totalRooms !== 1 ? 's' : ''}
          </span>
          {p.bedroomsCount && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-gray-400" />
              {p.bedroomsCount} bed{p.bedroomsCount !== 1 ? 's' : ''}
            </span>
          )}
          {p.bathroomsCount && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-gray-400" />
              {p.bathroomsCount} bath{p.bathroomsCount !== 1 ? 's' : ''}
            </span>
          )}
          {p.maxGuests && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {p.maxGuests} guests
            </span>
          )}
        </div>

        {/* Amenity chips */}
        {topAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topAmenities.map((label) => (
              <span key={label} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {label}
              </span>
            ))}
            {amenityIds.length > 4 && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                +{amenityIds.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Cancellation policy */}
        {cancelPolicy && (
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full self-start">
            {cancelPolicy.label} cancellation
          </span>
        )}

        {/* Completeness bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
              <CheckSquare className="w-3 h-3" /> Listing completeness
            </span>
            <span className={`text-[10px] font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <ActionBtn
              onClick={onTogglePublic}
              title={p.isPublic ? 'Unpublish' : 'Publish'}
              active={p.isPublic}
              activeClass="border-green-200 text-green-700 bg-green-50"
              icon={p.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            />
            <ActionBtn
              onClick={onToggleActive}
              title={p.isActive ? 'Deactivate' : 'Activate'}
              active={false}
              activeClass=""
              icon={p.isActive ? <PowerOff className="w-3.5 h-3.5 text-amber-600" /> : <Power className="w-3.5 h-3.5 text-gray-500" />}
            />
            <ActionBtn
              onClick={onDelete}
              title="Delete"
              active={false}
              activeClass=""
              className="border-red-200 text-red-600 hover:bg-red-50"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {canView && (
              <a
                href={publicUrl!}
                target="_blank"
                rel="noopener noreferrer"
                title="View live on your website"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </a>
            )}
            <Link
              href={`/travel-agent/properties/${p.id}/edit`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, title, active, activeClass, className = '', icon }: {
  onClick: () => void; title: string; active: boolean; activeClass: string; className?: string; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg border transition ${active ? activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300'} ${className}`}
    >
      {icon}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-emerald-400" />
      </div>
      <p className="text-gray-700 font-semibold text-lg mb-1">No properties yet</p>
      <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
        List your resort, hotel, villa or homestay to start receiving booking requests.
      </p>
      <Link
        href="/travel-agent/properties/add"
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
      >
        <Plus className="w-4 h-4" /> Add Your First Property
      </Link>
    </div>
  );
}
