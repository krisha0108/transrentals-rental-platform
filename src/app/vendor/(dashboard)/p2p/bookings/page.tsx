'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Car,
  Package,
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Search,
  Loader2,
  X,
  User,
  Phone,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Filter,
  Network,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorInfo {
  id: string;
  businessName: string;
  city: string;
  phone: string;
  rating: number | null;
  totalRatings: number | null;
  logo: string | null;
}

interface BookingPosting {
  id: string;
  postingNumber: string;
  vendorId: string;
  serviceType: string;
  bookingType: string | null;
  vehicleRequired: string | null;
  vehicleCategory: string | null;
  fromCity: string;
  toCity: string | null;
  tripDate: string;
  tripTime: string | null;
  returnDate: string | null;
  passengers: number | null;
  goodsType: string | null;
  estimatedWeight: string | null;
  customerBudget: number;
  partnerEarning: number | null;
  commission: number | null;
  urgency: string;
  reason: string | null;
  status: string;
  vendor: VendorInfo;
}

interface Pagination {
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

interface AcceptForm {
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  notes: string;
}

interface FleetVehicle {
  id: string;
  vehicleName?: string | null;
  registrationNumber?: string | null;
  vehicle_models?: {
    name?: string;
    brands?: { name?: string } | null;
  } | null;
  services?: { id?: string; name?: string; slug?: string } | null;
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_TYPES = [
  { label: 'All', value: '', icon: null },
  { label: 'Truck', value: 'truck', icon: Truck },
  { label: 'Car', value: 'car', icon: Car },
];

const URGENCY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'High', value: 'HIGH', color: 'bg-red-500 text-white', pill: 'bg-red-100 text-red-700' },
  { label: 'Medium', value: 'MEDIUM', color: 'bg-emerald-500 text-white', pill: 'bg-emerald-100 text-emerald-700' },
  { label: 'Low', value: 'LOW', color: 'bg-green-500 text-white', pill: 'bg-green-100 text-green-700' },
];

const URGENCY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100/90 backdrop-blur text-red-700 ring-1 ring-red-200',
  MEDIUM: 'bg-emerald-100/90 backdrop-blur text-emerald-700 ring-1 ring-emerald-200',
  LOW: 'bg-green-100/90 backdrop-blur text-green-700 ring-1 ring-green-200',
};

const URGENCY_LABEL: Record<string, string> = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

const SERVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  Car,
};

const ITEMS_PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrowseBookingsPage() {
  const router = useRouter();
  // Data state
  const [postings, setPostings] = useState<BookingPosting[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [urgency, setUrgency] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  // Comment/Share state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, P2PComment[]>>({});
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});
  const [shareDropdown, setShareDropdown] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Accept modal state
  const [selectedPosting, setSelectedPosting] = useState<BookingPosting | null>(null);
  const [acceptForm, setAcceptForm] = useState<AcceptForm>({
    vehicleName: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    notes: '',
  });
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Fleet & Driver selector state for accept modal
  const [modalFleet, setModalFleet] = useState<FleetVehicle[]>([]);
  const [modalFleetLoading, setModalFleetLoading] = useState(true);
  const [modalDrivers, setModalDrivers] = useState<StaffDriver[]>([]);
  const [modalDriversLoading, setModalDriversLoading] = useState(true);
  const [useFleetVehicle, setUseFleetVehicle] = useState(false);
  const [useFleetDriver, setUseFleetDriver] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // ---- Fetch vendor fleet for accept modal ----
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch('/api/vendor/fleet?serviceId=all');
        if (res.ok) {
          const data = await res.json();
          const vehicles = data.fleet || data.vehicles || data.data || [];
          const list = Array.isArray(vehicles) ? vehicles : [];
          setModalFleet(list);
          if (list.length > 0) setUseFleetVehicle(true);
        }
      } catch {
        // silently fail
      } finally {
        setModalFleetLoading(false);
      }
    };
    fetchFleet();
  }, []);

  // ---- Fetch vendor drivers for accept modal ----
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/vendor/staff?role=DRIVER&status=ACTIVE');
        if (res.ok) {
          const data = await res.json();
          const staffList = data.staff || data.data || [];
          const list = Array.isArray(staffList) ? staffList : [];
          setModalDrivers(list);
          if (list.length > 0) setUseFleetDriver(true);
        }
      } catch {
        // silently fail
      } finally {
        setModalDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Debounce search & city inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(fromCity);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [fromCity]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
        serviceType,
        fromCity: debouncedCity,
        urgency,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/p2p/bookings?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      const data = await res.json();
      setPostings(data.postings || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setPostings([]);
    } finally {
      setLoading(false);
    }
  }, [page, serviceType, debouncedCity, urgency, debouncedSearch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch comment counts whenever postings change
  useEffect(() => {
    if (postings.length === 0) return;
    const ids = postings.map((p) => p.id).join(',');
    fetch(`/api/p2p/comments?mode=counts&postingType=BOOKING&postingIds=${ids}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.counts) {
          setCommentCountMap((prev) => ({ ...prev, ...data.counts }));
        }
      })
      .catch(() => {});
  }, [postings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [serviceType, urgency]);

  // Accept booking handler
  const handleAccept = async () => {
    if (!selectedPosting) return;
    if (!acceptForm.vehicleName.trim() || !acceptForm.vehicleNumber.trim() || !acceptForm.driverName.trim() || !acceptForm.driverPhone.trim()) {
      setAcceptError('Please fill in all required fields');
      return;
    }

    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/p2p/bookings/${selectedPosting.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleName: acceptForm.vehicleName.trim(),
          vehicleNumber: acceptForm.vehicleNumber.trim(),
          driverName: acceptForm.driverName.trim(),
          driverPhone: acceptForm.driverPhone.trim(),
          notes: acceptForm.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to accept booking');
      }

      setAcceptSuccess(true);
      // Redirect to My Activity after a brief pause so the user sees the success state
      setTimeout(() => {
        router.push('/vendor/p2p/activity');
      }, 1500);
    } catch (err: any) {
      setAcceptError(err.message || 'Something went wrong');
    } finally {
      setAccepting(false);
    }
  };

  // Fleet/Driver selection helpers for accept modal
  const getFleetDisplayName = (v: FleetVehicle): string => {
    const modelName = v.vehicle_models?.name || '';
    const brandName = v.vehicle_models?.brands?.name || '';
    const vName = v.vehicleName || '';
    const regNum = v.registrationNumber || '';
    const label = vName || (brandName ? `${brandName} ${modelName}` : modelName) || regNum;
    return regNum ? `${label} (${regNum})` : label;
  };

  // Filter fleet by the booking's service type
  const filteredModalFleet = modalFleet.filter((v) => {
    const bookingService = (selectedPosting?.serviceType || '').toLowerCase();
    if (!bookingService) return true;
    const slug = (v.services?.slug || v.services?.name || '').toLowerCase();
    if (bookingService === 'truck') return slug.includes('truck') || slug.includes('transport');
    if (bookingService === 'car') return slug.includes('car') || slug.includes('chauffeur') || slug.includes('sedan') || slug.includes('suv');
    return true;
  });

  const handleModalFleetSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    if (!vehicleId) {
      setAcceptForm((f) => ({ ...f, vehicleName: '', vehicleNumber: '' }));
      return;
    }
    const v = modalFleet.find((f) => f.id === vehicleId);
    if (v) {
      const modelName = v.vehicle_models?.name || '';
      const brandName = v.vehicle_models?.brands?.name || '';
      const displayName = v.vehicleName || (brandName ? `${brandName} ${modelName}` : modelName) || v.registrationNumber || '';
      setAcceptForm((f) => ({
        ...f,
        vehicleName: displayName,
        vehicleNumber: v.registrationNumber || '',
      }));
    }
  };

  const handleModalDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    if (!driverId) {
      setAcceptForm((f) => ({ ...f, driverName: '', driverPhone: '' }));
      return;
    }
    const driver = modalDrivers.find((d) => d.id === driverId);
    if (driver) {
      setAcceptForm((f) => ({
        ...f,
        driverName: driver.name || '',
        driverPhone: driver.phone || '',
      }));
    }
  };

  const openModal = (posting: BookingPosting) => {
    setSelectedPosting(posting);
    setAcceptForm({ vehicleName: '', vehicleNumber: '', driverName: '', driverPhone: '', notes: '' });
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAcceptSuccess(false);
    setAcceptError(null);
  };

  const closeModal = () => {
    setSelectedPosting(null);
    setAcceptForm({ vehicleName: '', vehicleNumber: '', driverName: '', driverPhone: '', notes: '' });
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAcceptSuccess(false);
    setAcceptError(null);
  };

  // Helper to render stars
  const renderStars = (rating: number | null) => {
    const r = rating ?? 0;
    return (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'text-emerald-500 fill-emerald-500' : 'text-gray-300'}`}
          />
        ))}
        {rating !== null && <span className="ml-1 text-xs text-gray-500">{Number(rating).toFixed(1)}</span>}
      </span>
    );
  };

  // Get icon for service type
  const getServiceIcon = (type: string) => {
    const Icon = SERVICE_ICON[type] || Truck;
    return <Icon className="w-4 h-4" />;
  };

  // ---- Comment/Share Functions ----

  const fetchComments = async (postingId: string) => {
    setCommentLoading((prev) => ({ ...prev, [postingId]: true }));
    try {
      const res = await fetch(`/api/p2p/comments?postingType=BOOKING&postingId=${postingId}`);
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
          postingType: 'BOOKING',
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
  };

  const handleCopyLink = (posting: BookingPosting) => {
    const link = `${window.location.origin}/vendor/p2p/bookings?highlight=${posting.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(posting.id);
      setTimeout(() => setCopiedLink(null), 2000);
    });
    setShareDropdown(null);
  };

  const handleWhatsAppShare = (posting: BookingPosting) => {
    const text = `📦 P2P Booking Available!\n\n` +
      `${posting.bookingType || posting.serviceType}${posting.vehicleRequired ? ` - ${posting.vehicleRequired}` : ''}\n` +
      `📍 ${posting.fromCity}${posting.toCity ? ` → ${posting.toCity}` : ''}\n` +
      `📅 ${formatDate(posting.tripDate)}\n` +
      `💰 Earn: ${formatPrice(posting.partnerEarning ?? posting.customerBudget)}\n` +
      `👤 ${posting.vendor.businessName}\n\n` +
      `${window.location.origin}/vendor/p2p/bookings?highlight=${posting.id}`;
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

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
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
      {/* ---------------------------------------------------------------- */}
      {/* Header Banner */}
      {/* ---------------------------------------------------------------- */}
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
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Available Bookings
                <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
              </h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                {pagination ? `${pagination.total} booking${pagination.total !== 1 ? 's' : ''} available from partner vendors` : 'Browse bookings from other vendors'}
              </p>
            </div>
          </div>
          {pagination && (
            <div className="hidden sm:flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2.5 transition-all">
              <CalendarCheck className="w-5 h-5" />
              <span className="text-lg font-bold">{pagination.total}</span>
              <span className="text-xs text-emerald-100 font-medium">live</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filter Bar */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Filters</h3>
        </div>
        {/* Search + City */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
          <div className="relative sm:w-56">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by city..."
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
            />
          </div>
        </div>

        {/* Service Type Pills */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Service Type</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((st) => {
              const active = serviceType === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => setServiceType(st.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md scale-105'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-white hover:border-emerald-200'
                  }`}
                >
                  {st.icon && <st.icon className="w-3.5 h-3.5" />}
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency Pills */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Urgency</p>
          <div className="flex flex-wrap gap-2">
            {URGENCY_OPTIONS.map((u) => {
              const active = urgency === u.value;
              return (
                <button
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? (u.color ? `${u.color} shadow-md scale-105` : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md scale-105')
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-white hover:border-emerald-200'
                  }`}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Loading State */}
      {/* ---------------------------------------------------------------- */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-emerald-600 animate-spin"></div>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">Loading available bookings...</p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Error State */}
      {/* ---------------------------------------------------------------- */}
      {!loading && error && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Empty State */}
      {/* ---------------------------------------------------------------- */}
      {!loading && !error && postings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CalendarCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No bookings available</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Booking Cards Grid */}
      {/* ---------------------------------------------------------------- */}
      {!loading && !error && postings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {postings.map((posting, idx) => {
            const urgencyClass = URGENCY_BADGE[posting.urgency] || 'bg-gray-100/90 backdrop-blur text-gray-700 ring-1 ring-gray-200';
            const urgencyLbl = URGENCY_LABEL[posting.urgency] || posting.urgency;

            return (
              <div
                key={posting.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                {/* Urgency Badge */}
                <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold ${urgencyClass}`}>
                  {urgencyLbl}
                </div>

                <div className="relative p-5">
                  {/* Posting Number */}
                  <p className="text-[10px] text-gray-400 font-mono mb-2 tracking-wider">{posting.postingNumber}</p>

                  {/* Vendor Info */}
                  <div className="flex items-center gap-3 mb-3">
                    {posting.vendor.logo ? (
                      <img src={posting.vendor.logo} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md ring-2 ring-white">
                        {posting.vendor.businessName?.charAt(0) || 'V'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{posting.vendor.businessName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{posting.vendor.city}</span>
                        <span className="text-gray-300">|</span>
                        {renderStars(posting.vendor.rating)}
                        {posting.vendor.totalRatings != null && (
                          <span className="text-xs text-gray-400">({posting.vendor.totalRatings})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Type + Vehicle */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {posting.bookingType && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-100">
                        {getServiceIcon(posting.serviceType)}
                        {posting.bookingType}
                      </span>
                    )}
                    {posting.vehicleRequired && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-md border border-gray-200">
                        {posting.vehicleRequired}
                      </span>
                    )}
                    {posting.vehicleCategory && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-500 text-[11px] font-medium rounded-md border border-gray-100">
                        {posting.vehicleCategory}
                      </span>
                    )}
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm mb-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/60 to-emerald-50/60 border border-emerald-100/60">
                    <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-800 font-semibold truncate">{posting.fromCity}</span>
                    {posting.toCity && (
                      <>
                        <span className="text-emerald-400">&rarr;</span>
                        <span className="text-gray-800 font-semibold truncate">{posting.toCity}</span>
                      </>
                    )}
                    {posting.returnDate && (
                      <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded font-bold flex-shrink-0">Round Trip</span>
                    )}
                  </div>

                  {/* Trip Date/Time */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">{formatDate(posting.tripDate)}</span>
                    </span>
                    {posting.tripTime && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{posting.tripTime}</span>
                      </span>
                    )}
                    {posting.returnDate && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">Return: {formatDate(posting.returnDate)}</span>
                      </span>
                    )}
                  </div>

                  {/* Passengers or Goods */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {posting.passengers != null && posting.passengers > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 px-2 py-1 rounded-md font-semibold border border-gray-200">
                        <User className="w-3 h-3" />
                        {posting.passengers} passenger{posting.passengers !== 1 ? 's' : ''}
                      </span>
                    )}
                    {posting.goodsType && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-50 px-2 py-1 rounded-md font-semibold border border-gray-200">
                        <Package className="w-3 h-3" />
                        {posting.goodsType}
                      </span>
                    )}
                    {posting.estimatedWeight && (
                      <span className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded-md font-semibold border border-gray-200">
                        ~{posting.estimatedWeight}
                      </span>
                    )}
                  </div>

                  {/* Reason */}
                  {posting.reason && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] rounded-md mb-3 border border-emerald-100 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {posting.reason}
                    </div>
                  )}

                  {/* Commission Breakdown */}
                  <div className="bg-gradient-to-br from-emerald-50/60 via-emerald-50/40 to-emerald-50/40 border border-emerald-100 rounded-xl p-3 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Customer Budget</p>
                        <p className="text-sm font-bold text-gray-900">{formatPrice(posting.customerBudget)}</p>
                      </div>
                      <div className="border-x border-emerald-100">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Your Earning</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(posting.partnerEarning ?? posting.customerBudget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Commission</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(posting.commission ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(posting)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl px-4 py-2.5 hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Accept Booking
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

      {/* ---------------------------------------------------------------- */}
      {/* Pagination */}
      {/* ---------------------------------------------------------------- */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 animate-fade-up">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                if (p === 1 || p === pagination.totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (typeof prev === 'number' && p - prev > 1) {
                    acc.push('...');
                  }
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                      page === item
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md scale-105'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
          </div>
          <button
            disabled={page >= (pagination?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Accept Modal */}
      {/* ---------------------------------------------------------------- */}
      {selectedPosting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl max-w-md w-full mx-4 max-h-[92dvh] overflow-hidden shadow-2xl animate-pop-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x px-6 py-5 text-white flex-shrink-0">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-float-slow" />
              <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-emerald-300/20 rounded-full blur-2xl animate-float-rev" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                    <CalendarCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Accept Booking</h2>
                    <p className="text-xs text-emerald-100">Confirm vehicle & driver details</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-white/20 bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
            {/* Success State */}
            {acceptSuccess ? (
              <div className="text-center py-8 animate-pop-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CalendarCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Booking Accepted!</h3>
                <p className="text-sm text-gray-500">The posting vendor has been notified.</p>
              </div>
            ) : (
              <>
                {/* Booking Summary */}
                <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-emerald-50/40 to-emerald-50/40 border border-emerald-100 rounded-2xl mb-4">
                  <p className="text-[10px] text-emerald-500 font-mono tracking-wider">{selectedPosting.postingNumber}</p>
                  <p className="font-bold text-gray-900 mt-1 text-base">
                    {selectedPosting.bookingType || selectedPosting.serviceType}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">{selectedPosting.fromCity}</span>
                    {selectedPosting.toCity && (
                      <>
                        <span className="text-emerald-400">&rarr;</span>
                        <span className="font-semibold">{selectedPosting.toCity}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-white/70 px-2 py-0.5 rounded-md border border-white">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(selectedPosting.tripDate)}
                    </span>
                    {selectedPosting.tripTime && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-white/70 px-2 py-0.5 rounded-md border border-white">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {selectedPosting.tripTime}
                      </span>
                    )}
                    {selectedPosting.vehicleRequired && (
                      <span className="text-[11px] font-medium text-gray-700 bg-white/70 px-2 py-0.5 rounded-md border border-white">{selectedPosting.vehicleRequired}</span>
                    )}
                  </div>
                </div>

                {/* Commission Breakdown Preview */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Customer Budget</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(selectedPosting.customerBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Commission to Poster</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">-{formatPrice(selectedPosting.commission ?? 0)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Your Earning</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formatPrice(selectedPosting.partnerEarning ?? selectedPosting.customerBudget)}
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 mb-4">
                  {/* ---- Vehicle Section ---- */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Vehicle Details</label>

                    {/* Vehicle toggle — only show if filtered fleet has vehicles */}
                    {filteredModalFleet.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => { setUseFleetVehicle(true); setSelectedVehicleId(''); setAcceptForm((f) => ({ ...f, vehicleName: '', vehicleNumber: '' })); }}
                          className={useFleetVehicle ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition hover:bg-white hover:border-emerald-200'}
                        >
                          Select from Fleet
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUseFleetVehicle(false); setSelectedVehicleId(''); setAcceptForm((f) => ({ ...f, vehicleName: '', vehicleNumber: '' })); }}
                          className={!useFleetVehicle ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition hover:bg-white hover:border-emerald-200'}
                        >
                          Enter Manually
                        </button>
                      </div>
                    )}

                    {useFleetVehicle && filteredModalFleet.length > 0 ? (
                      <div>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => handleModalFleetSelect(e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                          disabled={modalFleetLoading}
                        >
                          <option value="">
                            {modalFleetLoading ? 'Loading fleet...' : '-- Select a vehicle --'}
                          </option>
                          {filteredModalFleet.map((v) => (
                            <option key={v.id} value={v.id}>
                              {getFleetDisplayName(v)}
                            </option>
                          ))}
                        </select>
                        {selectedVehicleId && (acceptForm.vehicleName || acceptForm.vehicleNumber) && (
                          <div className="mt-2 bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm text-emerald-800">
                            <span className="font-medium">{acceptForm.vehicleName}</span>
                            {acceptForm.vehicleNumber && <span className="ml-2 text-emerald-600">({acceptForm.vehicleNumber})</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tata Ace, Innova Crysta"
                            value={acceptForm.vehicleName}
                            onChange={(e) => setAcceptForm((f) => ({ ...f, vehicleName: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vehicle Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. MH04AB1234"
                            value={acceptForm.vehicleNumber}
                            onChange={(e) => setAcceptForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ---- Driver Section ---- */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Driver Details</label>

                    {/* Driver toggle — only show if drivers exist */}
                    {modalDrivers.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => { setUseFleetDriver(true); setSelectedDriverId(''); setAcceptForm((f) => ({ ...f, driverName: '', driverPhone: '' })); }}
                          className={useFleetDriver ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition hover:bg-white hover:border-emerald-200'}
                        >
                          Select from Staff
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUseFleetDriver(false); setSelectedDriverId(''); setAcceptForm((f) => ({ ...f, driverName: '', driverPhone: '' })); }}
                          className={!useFleetDriver ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition hover:bg-white hover:border-emerald-200'}
                        >
                          Enter Manually
                        </button>
                      </div>
                    )}

                    {useFleetDriver && modalDrivers.length > 0 ? (
                      <div>
                        <select
                          value={selectedDriverId}
                          onChange={(e) => handleModalDriverSelect(e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                          disabled={modalDriversLoading}
                        >
                          <option value="">
                            {modalDriversLoading ? 'Loading drivers...' : '-- Select a driver --'}
                          </option>
                          {modalDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} - {d.phone}
                            </option>
                          ))}
                        </select>
                        {selectedDriverId && acceptForm.driverName && (
                          <div className="mt-2 bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm text-emerald-800">
                            <User className="w-3.5 h-3.5 inline mr-1" />
                            <span className="font-medium">{acceptForm.driverName}</span>
                            {acceptForm.driverPhone && <span className="ml-2 text-emerald-600">({acceptForm.driverPhone})</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Full name of driver"
                              value={acceptForm.driverName}
                              onChange={(e) => setAcceptForm((f) => ({ ...f, driverName: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="tel"
                              placeholder="10-digit phone number"
                              value={acceptForm.driverPhone}
                              onChange={(e) => setAcceptForm((f) => ({ ...f, driverPhone: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Any additional information..."
                      value={acceptForm.notes}
                      onChange={(e) => setAcceptForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition resize-none"
                    />
                  </div>
                </div>

                {/* Error message */}
                {acceptError && (
                  <div className="flex items-center gap-2 text-red-700 text-sm mb-3 bg-red-50 border border-red-200 px-3 py-2 rounded-xl font-medium animate-pop-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {acceptError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={accepting}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      'Accept Booking'
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
