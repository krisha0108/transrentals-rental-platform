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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/vendor/p2p"
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Available Vehicles</h1>
              <p className="text-blue-100 mt-1">
                Find empty vehicles posted by other vendors for your transport needs
              </p>
            </div>
          </div>
          <Link
            href="/vendor/p2p/vehicles/post"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
        >
          <Plus className="w-5 h-5" />
          Post Your Vehicle
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Search + City Inputs + Date */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicle name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="From city"
              value={fromCity}
              onChange={(e) => handleFromCityChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="To city"
              value={toCity}
              onChange={(e) => handleToCityChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Service Type Pills */}
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPE_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleServiceTypeChange(filter.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                serviceType === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 text-blue-600" />
          <p className="mt-4 text-gray-500 text-sm">Loading available vehicles...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchVehicles}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && postings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles available</h3>
          <p className="text-gray-500 mb-6">
            No vehicles match your current filters. Try adjusting your search or check back later.
          </p>
          <Link
            href="/vendor/p2p/vehicles/post"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Post Your Empty Vehicle
          </Link>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && postings.length > 0 && pagination && (
        <p className="text-sm text-gray-500">
          Showing {postings.length} of {pagination.total} vehicle{pagination.total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Vehicle Cards Grid */}
      {!loading && !error && postings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {postings.map((posting) => {
            const VehicleIcon = getVehicleIcon(posting.serviceType);
            return (
              <div
                key={posting.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5">
                  {/* Vendor Info Row */}
                  <div className="flex items-center gap-3 mb-4">
                    {posting.vendor.logo ? (
                      <img
                        src={posting.vendor.logo}
                        alt={posting.vendor.businessName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {posting.vendor.businessName?.charAt(0) || 'V'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {posting.vendor.businessName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {posting.vendor.city && (
                          <span className="truncate">{posting.vendor.city}</span>
                        )}
                        {posting.vendor.rating > 0 && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                              {posting.vendor.rating.toFixed(1)}
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
                  </div>

                  {/* Vehicle Name + Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <VehicleIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {posting.vehicleName}
                      </h3>
                      {posting.vehicleNumber && (
                        <p className="text-xs text-gray-400">{posting.vehicleNumber}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                      {posting.serviceType}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{posting.fromCity}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-gray-700 font-medium">{posting.toCity}</span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(posting.departureDate)}
                    </span>
                    {posting.departureTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatTime(posting.departureTime)}
                      </span>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="flex items-baseline gap-3 mb-3">
                    <div>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(posting.priceFullLoad)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        {posting.serviceType?.toLowerCase() === 'car' ? 'trip price' : 'full load'}
                      </span>
                    </div>
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.acceptsPartLoad && posting.pricePartLoad != null && (
                      <div>
                        <span className="text-sm font-semibold text-gray-600">
                          {formatPrice(posting.pricePartLoad)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">part load</span>
                      </div>
                    )}
                  </div>

                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.capacity > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                        {posting.capacity} ton
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'car' && posting.capacity > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                        {posting.capacity} seater
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.bodyType && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                        {posting.bodyType}
                      </span>
                    )}
                    {posting.driverIncluded && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                        <User className="w-3 h-3" />
                        Driver Included
                      </span>
                    )}
                    {posting.serviceType?.toLowerCase() === 'truck' && posting.acceptsPartLoad && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">
                        Part Load OK
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRequestModal(posting)}
                      className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium text-sm"
                    >
                      Request Vehicle
                    </button>
                    {posting.vendor.phone && (
                      <>
                        <a
                          href={`tel:${posting.vendor.phone}`}
                          className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded-lg transition"
                          title="Call Vendor"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/91${posting.vendor.phone.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded-lg transition"
                          title="WhatsApp Vendor"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment & Share Bar */}
                <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => toggleComments(posting.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition"
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
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    {shareDropdown === posting.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
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
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                    {/* Comments List */}
                    {commentLoading[posting.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
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
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      <button
                        onClick={() => handleSendComment(posting.id)}
                        disabled={commentSending[posting.id] || !commentInputs[posting.id]?.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Request Modal */}
      {selectedVehicle && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRequestModal();
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Request Vehicle</h2>
              <button
                onClick={closeRequestModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Success Message */}
            {requestSuccess && (
              <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-green-800">Request Sent Successfully!</p>
                <p className="text-sm text-green-600 mt-1">
                  The vendor will review your request shortly.
                </p>
              </div>
            )}

            {!requestSuccess && (
              <>
                {/* Vehicle Summary */}
                <div className="p-4 bg-gray-50 rounded-xl mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {React.createElement(getVehicleIcon(selectedVehicle.serviceType), {
                        className: 'w-5 h-5 text-blue-600',
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {selectedVehicle.vehicleName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedVehicle.fromCity} &rarr; {selectedVehicle.toCity}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-gray-400">Date</p>
                      <p className="font-medium text-gray-700">
                        {formatDate(selectedVehicle.departureDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Time</p>
                      <p className="font-medium text-gray-700">
                        {formatTime(selectedVehicle.departureTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">
                        {selectedVehicle.serviceType?.toLowerCase() === 'car' ? 'Trip Price' : 'Full Load'}
                      </p>
                      <p className="font-bold text-green-600">
                        {formatPrice(selectedVehicle.priceFullLoad)}
                      </p>
                    </div>
                    {selectedVehicle.serviceType?.toLowerCase() === 'truck' && selectedVehicle.acceptsPartLoad && selectedVehicle.pricePartLoad != null && (
                      <div>
                        <p className="text-gray-400">Part Load</p>
                        <p className="font-semibold text-gray-700">
                          {formatPrice(selectedVehicle.pricePartLoad)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {requestError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeRequestModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Request'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
