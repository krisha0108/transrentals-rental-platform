'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Car,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Search,
  Filter,
  Loader2,
  X,
  User,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  MessageCircle,
  Send,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Network,
  Users,
  Package,
  CheckCircle,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

// ----- Types -----

interface VendorInfo {
  id: string;
  businessName: string;
  city: string;
  phone: string;
  rating: number;
  totalRatings: number;
  logo: string | null;
}

interface VehiclePosting {
  id: string;
  postingNumber: string;
  vendorId: string;
  serviceType: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleCategory: string;
  capacity: number;
  bodyType: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  priceFullLoad: number;
  pricePartLoad: number | null;
  acceptsPartLoad: boolean;
  driverIncluded: boolean;
  status: string;
  vendor: VendorInfo;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface P2PComment {
  id: string;
  postingType: string;
  vendorId: string;
  message: string;
  createdAt: string;
  vendor: {
    id: string;
    businessName: string;
    city: string;
    logo: string | null;
  };
}

interface RequestFormData {
  loadType: 'Full' | 'Part';
  goodsType: string;
  estimatedWeight: string;
  passengers: string;
  pickupAddress: string;
  dropAddress: string;
  notes: string;
}

// ----- Constants -----

const SERVICE_TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Truck', value: 'truck' },
  { label: 'Car', value: 'car' },
] as const;

const SERVICE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck: Truck,
  Car: Car,
};

const INITIAL_REQUEST_FORM: RequestFormData = {
  loadType: 'Full',
  goodsType: '',
  estimatedWeight: '',
  passengers: '',
  pickupAddress: '',
  dropAddress: '',
  notes: '',
};

// ----- Component -----

export default function BrowseVehiclesPage() {
  const router = useRouter();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data state
  const [postings, setPostings] = useState<VehiclePosting[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosting | null>(null);
  const [requestForm, setRequestForm] = useState<RequestFormData>(INITIAL_REQUEST_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Comment/Share state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, P2PComment[]>>({});
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});
  const [shareDropdown, setShareDropdown] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        serviceType,
        fromCity,
        toCity,
        search: debouncedSearch,
      });
      if (dateFilter) {
        params.set('departureDate', dateFilter);
      }
      const res = await fetch(`/api/p2p/vehicles?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch vehicles');
      }
      setPostings(data.postings || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setPostings([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, serviceType, fromCity, toCity, debouncedSearch, dateFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Fetch comment counts whenever postings change
  useEffect(() => {
    if (postings.length === 0) return;
    const ids = postings.map((p) => p.id).join(',');
    fetch(`/api/p2p/comments?mode=counts&postingType=VEHICLE&postingIds=${ids}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.counts) {
          setCommentCountMap((prev) => ({ ...prev, ...data.counts }));
        }
      })
      .catch(() => {});
  }, [postings]);

  // Reset page when filters change (except search which is handled separately)
  const handleServiceTypeChange = (value: string) => {
    setServiceType(value);
    setPage(1);
  };

  const handleFromCityChange = (value: string) => {
    setFromCity(value);
    setPage(1);
  };

  const handleToCityChange = (value: string) => {
    setToCity(value);
    setPage(1);
  };

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    setPage(1);
  };

  // Request form handlers
  const openRequestModal = (vehicle: VehiclePosting) => {
    setSelectedVehicle(vehicle);
    setRequestForm(INITIAL_REQUEST_FORM);
    setRequestSuccess(false);
    setRequestError(null);
  };

  const closeRequestModal = () => {
    setSelectedVehicle(null);
    setRequestForm(INITIAL_REQUEST_FORM);
    setRequestSuccess(false);
    setRequestError(null);
  };

  const updateRequestForm = (field: keyof RequestFormData, value: string) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = async () => {
    if (!selectedVehicle) return;

    const isTruck = selectedVehicle.serviceType?.toLowerCase() === 'truck';
    if (isTruck && !requestForm.goodsType.trim()) {
      setRequestError('Please enter the type of goods');
      return;
    }
    if (!requestForm.pickupAddress.trim()) {
      setRequestError('Please enter a pickup address');
      return;
    }
    if (!requestForm.dropAddress.trim()) {
      setRequestError('Please enter a drop address');
      return;
    }

    setSubmitting(true);
    setRequestError(null);

    try {
      const res = await fetch(`/api/p2p/vehicles/${selectedVehicle.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: requestForm.passengers
            ? `Passengers: ${requestForm.passengers}${requestForm.notes ? '. ' + requestForm.notes : ''}`
            : requestForm.notes,
          loadType: requestForm.loadType,
          goodsType: requestForm.goodsType,
          estimatedWeight: requestForm.estimatedWeight,
          pickupAddress: requestForm.pickupAddress,
          dropAddress: requestForm.dropAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send request');
      }

      setRequestSuccess(true);

      // Redirect to My Postings → Requests Sent tab
      setTimeout(() => {
        router.push('/vendor/p2p/my-postings?tab=requests');
      }, 1500);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  // Icon helper
  const getVehicleIcon = (type: string) => {
    return SERVICE_TYPE_ICONS[type] || Truck;
  };

  // ---- Comment/Share Functions ----

  const fetchComments = async (postingId: string) => {
    setCommentLoading((prev) => ({ ...prev, [postingId]: true }));
    try {
      const res = await fetch(`/api/p2p/comments?postingType=VEHICLE&postingId=${postingId}`);
      const data = await res.json();
      if (data.success) {
        setCommentsMap((prev) => ({ ...prev, [postingId]: data.comments }));
        setCommentCountMap((prev) => ({ ...prev, [postingId]: data.total }));
      }
    } catch {
      // silently fail
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postingId]: false }));
    }
  };

  const toggleComments = (postingId: string) => {
    const isExpanded = expandedComments[postingId];
    setExpandedComments((prev) => ({ ...prev, [postingId]: !isExpanded }));
    // Close any open share dropdown
    setShareDropdown(null);
    if (!isExpanded && !commentsMap[postingId]) {
      fetchComments(postingId);
    }
  };

  const handleSendComment = async (postingId: string) => {
    const message = commentInputs[postingId]?.trim();
    if (!message) return;

    setCommentSending((prev) => ({ ...prev, [postingId]: true }));
    try {
      const res = await fetch('/api/p2p/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postingType: 'VEHICLE',
          postingId,
          message,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsMap((prev) => ({
          ...prev,
          [postingId]: [...(prev[postingId] || []), data.comment],
        }));
        setCommentCountMap((prev) => ({
          ...prev,
          [postingId]: (prev[postingId] || 0) + 1,
        }));
        setCommentInputs((prev) => ({ ...prev, [postingId]: '' }));
      }
    } catch {
      // silently fail
    } finally {
      setCommentSending((prev) => ({ ...prev, [postingId]: false }));
    }
  };

  const toggleShareDropdown = (postingId: string) => {
    setShareDropdown((prev) => (prev === postingId ? null : postingId));
    // Close any open comments when opening share
  };

  const handleCopyLink = (posting: VehiclePosting) => {
    const link = `${window.location.origin}/vendor/p2p/vehicles?highlight=${posting.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(posting.id);
      setTimeout(() => setCopiedLink(null), 2000);
    });
    setShareDropdown(null);
  };

  const handleWhatsAppShare = (posting: VehiclePosting) => {
    const text = `🚛 P2P Vehicle Available!\n\n` +
      `${posting.vehicleName}${posting.vehicleNumber ? ` (${posting.vehicleNumber})` : ''}\n` +
      `📍 ${posting.fromCity} → ${posting.toCity}\n` +
      `📅 ${formatDate(posting.departureDate)}\n` +
      `💰 ${formatPrice(posting.priceFullLoad)}\n` +
      `👤 ${posting.vendor.businessName}\n\n` +
      `${window.location.origin}/vendor/p2p/vehicles?highlight=${posting.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareDropdown(null);
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  // Format departure time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    // If already in readable format, return as-is
    if (time.includes('AM') || time.includes('PM')) return time;
    // Convert 24h format HH:MM to readable
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up text-white">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/vendor/p2p"
              className="p-2 hover:bg-white/20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Available Vehicles
                <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
              </h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                Find empty vehicles posted by other vendors for your transport needs
              </p>
            </div>
          </div>
          <Link
            href="/vendor/p2p/vehicles/post"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Post Your Vehicle
          </Link>
        </div>
      </div>

      {/* Mobile Post Button */}
      <div className="sm:hidden">
        <Link
          href="/vendor/p2p/vehicles/post"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition w-full justify-center font-semibold"
        >
          <Plus className="w-5 h-5" />
          Post Your Vehicle
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Filters</h3>
        </div>
        {/* Search + City Inputs + Date */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicle name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="From city"
              value={fromCity}
              onChange={(e) => handleFromCityChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="To city"
              value={toCity}
              onChange={(e) => handleToCityChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
        </div>

        {/* Service Type Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {SERVICE_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleServiceTypeChange(filter.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                serviceType === filter.value
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-white hover:border-emerald-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-emerald-600 animate-spin"></div>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">Loading available vehicles...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <X className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={fetchVehicles}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && postings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Truck className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No vehicles available</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            No vehicles match your current filters. Try adjusting your search or check back later.
          </p>
          <Link
            href="/vendor/p2p/vehicles/post"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-105 transition text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Post Your Empty Vehicle
          </Link>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && postings.length > 0 && pagination && (
        <div className="flex items-center justify-between animate-fade-up">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">{postings.length}</span> of <span className="font-bold text-gray-900">{pagination.total}</span> vehicle{pagination.total !== 1 ? 's' : ''}
          </p>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Package className="h-3.5 w-3.5 text-emerald-500" />
            <span>Live marketplace</span>
          </div>
        </div>
      )}

      {/* Vehicle Cards Grid */}
      {!loading && !error && postings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {postings.map((posting, idx) => {
            const VehicleIcon = getVehicleIcon(posting.serviceType);
            const isCar = posting.serviceType?.toLowerCase() === 'car';
            return (
              <div
                key={posting.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative p-5">
                  {/* Vendor Info Row */}
                  <div className="flex items-center gap-3 mb-4">
                    {posting.vendor.logo ? (
                      <img
                        src={posting.vendor.logo}
                        alt={posting.vendor.businessName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                        {posting.vendor.businessName?.charAt(0) || 'V'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {posting.vendor.businessName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {posting.vendor.city && (
                          <span className="truncate">{posting.vendor.city}</span>
                        )}
                        {posting.vendor.rating > 0 && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                              <span className="font-semibold text-gray-700">{posting.vendor.rating.toFixed(1)}</span>
                              {posting.vendor.totalRatings > 0 && (
                                <span className="text-gray-400">
                                  ({posting.vendor.totalRatings})
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full whitespace-nowrap ring-1 ${
                      isCar ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    }`}>
                      {posting.serviceType?.toUpperCase()}
                    </span>
                  </div>

                  {/* Vehicle Name with gradient icon */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`p-2.5 rounded-xl shadow-md text-white group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 ${
                      isCar ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      <VehicleIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {posting.vehicleName}
                      </h3>
                      {posting.vehicleNumber && (
                        <p className="text-[11px] text-gray-400 font-mono">{posting.vehicleNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm mb-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/60 to-emerald-50/60 border border-emerald-100/60">
                    <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-800 font-semibold truncate">{posting.fromCity}</span>
                    <span className="text-emerald-400">&rarr;</span>
                    <span className="text-gray-800 font-semibold truncate">{posting.toCity}</span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">{formatDate(posting.departureDate)}</span>
                    </span>
                    {posting.departureTime && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{formatTime(posting.departureTime)}</span>
                      </span>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-dashed border-gray-100">
                    <div>
                      <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatPrice(posting.priceFullLoad)}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-1">
                        {isCar ? 'trip' : 'full load'}
                      </span>
                    </div>
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.acceptsPartLoad && posting.pricePartLoad != null && (
                      <div>
                        <span className="text-sm font-semibold text-gray-600">
                          {formatPrice(posting.pricePartLoad)}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-1">part</span>
                      </div>
                    )}
                  </div>

                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.capacity > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-md border border-gray-200">
                        {posting.capacity} ton
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'car' && posting.capacity > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-md border border-gray-200">
                        {posting.capacity} seater
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.bodyType && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-md border border-gray-200">
                        {posting.bodyType}
                      </span>
                    )}
                    {posting.driverIncluded && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200">
                        <User className="w-3 h-3" />
                        Driver
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.acceptsPartLoad && (
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200">
                        Part Load OK
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRequestModal(posting)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl px-4 py-2.5 hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all font-semibold text-sm"
                    >
                      Request Vehicle
                    </button>
                    {posting.vendor.phone && (
                      <>
                        <a
                          href={`tel:${posting.vendor.phone}`}
                          className="flex items-center justify-center w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 hover:scale-110 transition-all"
                          title="Call Vendor"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/91${posting.vendor.phone.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 hover:scale-110 transition-all"
                          title="WhatsApp Vendor"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment & Share Bar */}
                <div className="relative border-t border-gray-100 px-5 py-2.5 flex items-center justify-between bg-gray-50/40">
                  <button
                    onClick={() => toggleComments(posting.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-white transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{commentCountMap[posting.id] || 0}</span>
                    {expandedComments[posting.id] ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => toggleShareDropdown(posting.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-white transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    {shareDropdown === posting.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-pop-in">
                        <button
                          onClick={() => handleCopyLink(posting)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          {copiedLink === posting.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedLink === posting.id ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(posting)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Comment Section */}
                {expandedComments[posting.id] && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gradient-to-b from-emerald-50/30 to-white animate-fade-up">
                    {/* Comments List */}
                    {commentLoading[posting.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                        {(!commentsMap[posting.id] || commentsMap[posting.id].length === 0) && (
                          <p className="text-sm text-gray-400 text-center py-3">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                        {commentsMap[posting.id]?.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5">
                            {comment.vendor.logo ? (
                              <img
                                src={comment.vendor.logo}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                                {comment.vendor.businessName?.charAt(0) || 'V'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-gray-800 truncate">
                                  {comment.vendor.businessName}
                                </span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                  {getRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5 break-words">
                                {comment.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[posting.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [posting.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment(posting.id);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      />
                      <button
                        onClick={() => handleSendComment(posting.id)}
                        disabled={commentSending[posting.id] || !commentInputs[posting.id]?.trim()}
                        className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {commentSending[posting.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 animate-fade-up">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
            Page <span className="font-bold text-emerald-600">{pagination.page}</span> of <span className="font-bold">{pagination.totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Request Modal */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRequestModal();
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl animate-pop-in flex flex-col">
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x px-6 py-5 text-white flex-shrink-0">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-float-slow" />
              <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-emerald-300/20 rounded-full blur-2xl animate-float-rev" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Request Vehicle</h2>
                    <p className="text-xs text-emerald-100">Send booking request to vendor</p>
                  </div>
                </div>
                <button
                  onClick={closeRequestModal}
                  className="p-1.5 hover:bg-white/20 bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
            {/* Success Message */}
            {requestSuccess && (
              <div className="mb-5 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center animate-pop-in">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold text-green-800">Request Sent Successfully!</p>
                <p className="text-sm text-green-600 mt-1">
                  The vendor will review your request shortly.
                </p>
              </div>
            )}

            {!requestSuccess && (
              <>
                {/* Vehicle Summary */}
                <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-emerald-50/40 to-emerald-50/40 border border-emerald-100 rounded-2xl mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                      {React.createElement(getVehicleIcon(selectedVehicle.serviceType), {
                        className: 'w-5 h-5 text-white',
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">
                        {selectedVehicle.vehicleName}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {selectedVehicle.fromCity} &rarr; {selectedVehicle.toCity}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Date</p>
                      <p className="font-semibold text-gray-800 text-xs mt-0.5">
                        {formatDate(selectedVehicle.departureDate)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Time</p>
                      <p className="font-semibold text-gray-800 text-xs mt-0.5">
                        {formatTime(selectedVehicle.departureTime)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                        {selectedVehicle.serviceType?.toLowerCase() === 'car' ? 'Trip Price' : 'Full Load'}
                      </p>
                      <p className="font-bold text-sm mt-0.5 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatPrice(selectedVehicle.priceFullLoad)}
                      </p>
                    </div>
                    {selectedVehicle.serviceType?.toLowerCase() === 'truck' && selectedVehicle.acceptsPartLoad && selectedVehicle.pricePartLoad != null && (
                      <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Part Load</p>
                        <p className="font-semibold text-gray-800 text-xs mt-0.5">
                          {formatPrice(selectedVehicle.pricePartLoad)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {requestError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium animate-pop-in">
                    {requestError}
                  </div>
                )}

                {/* Request Form */}
                <div className="space-y-4">
                  {/* Truck-only: Load Type, Goods, Weight */}
                  {selectedVehicle.serviceType?.toLowerCase() === 'truck' && (
                    <>
                      {/* Load Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Load Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={requestForm.loadType}
                          onChange={(e) =>
                            updateRequestForm('loadType', e.target.value as 'Full' | 'Part')
                          }
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                        >
                          <option value="Full">Full Load</option>
                          {selectedVehicle.acceptsPartLoad && (
                            <option value="Part">Part Load</option>
                          )}
                        </select>
                      </div>

                      {/* Goods Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Type of Goods <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Electronics, Furniture, Raw Materials"
                          value={requestForm.goodsType}
                          onChange={(e) => updateRequestForm('goodsType', e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                        />
                      </div>

                      {/* Estimated Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Estimated Weight (kg)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 500"
                          value={requestForm.estimatedWeight}
                          onChange={(e) => updateRequestForm('estimatedWeight', e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                        />
                      </div>
                    </>
                  )}

                  {/* Car-only: Passengers */}
                  {selectedVehicle.serviceType?.toLowerCase() === 'car' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Number of Passengers
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 4"
                        value={requestForm.passengers}
                        onChange={(e) => updateRequestForm('passengers', e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                      />
                    </div>
                  )}

                  {/* Pickup Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pickup Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full pickup address"
                      value={requestForm.pickupAddress}
                      onChange={(e) => updateRequestForm('pickupAddress', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                    />
                  </div>

                  {/* Drop Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Drop Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full drop address"
                      value={requestForm.dropAddress}
                      onChange={(e) => updateRequestForm('dropAddress', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any special requirements or details..."
                      value={requestForm.notes}
                      onChange={(e) => updateRequestForm('notes', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none transition"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeRequestModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition text-sm font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all text-sm font-semibold disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
