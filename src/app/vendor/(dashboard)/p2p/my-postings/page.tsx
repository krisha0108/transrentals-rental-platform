'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Package,
  Fuel,
  User,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Send,
  Eye,
  Car,
  MessageCircle,
  Share2,
  Copy,
} from 'lucide-react';
import { formatPrice, formatDate, getRelativeTime } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface VendorRef {
  id: string;
  businessName: string;
  logo?: string | null;
  city?: string;
}

interface P2PRequest {
  id: string;
  requestNumber: string;
  status: string;
  requestingVendorId: string;
  requestingVendor: VendorRef;
  createdAt: string;
}

interface P2PTransaction {
  id: string;
  transactionNumber: string;
  tripStatus: string;
  paymentStatus: string;
  agreedAmount: number;
  vendorA: VendorRef;
  vendorB: VendorRef;
  createdAt: string;
}

interface VehicleFleetRef {
  id: string;
  vehicleName: string;
  registrationNumber: string;
  serviceId?: string;
}

interface VehiclePosting {
  id: string;
  postingNumber: string;
  serviceType: string;
  vehicleName: string;
  vehicleNumber: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  priceFullLoad: number;
  pricePartLoad: number | null;
  acceptsPartLoad: boolean;
  status: string;
  notes: string | null;
  capacity: number;
  bodyType: string | null;
  driverIncluded: boolean;
  fuelIncluded: boolean;
  createdAt: string;
  vehicleFleet: VehicleFleetRef | null;
  p2p_requests: P2PRequest[];
  p2p_transactions: P2PTransaction[];
  _count: { requests: number; transactions: number };
  pendingRequests: number;
}

interface BookingPosting {
  id: string;
  postingNumber: string;
  serviceType: string;
  vehicleRequired: string | null;
  vehicleCategory: string | null;
  fromCity: string;
  toCity: string | null;
  tripDate: string;
  tripTime: string | null;
  customerBudget: number;
  partnerEarning: number | null;
  commission: number | null;
  urgency: string;
  reason: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  p2p_requests: P2PRequest[];
  p2p_transactions: P2PTransaction[];
  _count: { requests: number; transactions: number };
  pendingRequests: number;
}

interface PostingsData {
  vehiclePostings: VehiclePosting[];
  bookingPostings: BookingPosting[];
  totals: { vehicles: number; bookings: number };
  pagination: { page: number; limit: number; type: string };
}

interface SentRequest {
  id: string;
  requestNumber: string;
  status: string;
  postingType: string;
  notes?: string;
  loadType?: string;
  goodsType?: string;
  estimatedWeight?: string;
  pickupAddress?: string;
  dropAddress?: string;
  createdAt: string;
  respondedAt?: string | null;
  postingVendor: VendorRef;
  vehiclePosting?: {
    id: string;
    postingNumber: string;
    serviceType: string;
    vehicleName?: string;
    vehicleNumber?: string;
    fromCity: string;
    toCity: string;
    departureDate?: string;
    priceFullLoad?: number;
    status: string;
  } | null;
  bookingPosting?: {
    id: string;
    postingNumber: string;
    serviceType: string;
    vehicleRequired?: string;
    fromCity: string;
    toCity: string;
    tripDate?: string;
    customerBudget?: number;
    partnerEarning?: number;
    status: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ActiveTab = 'vehicles' | 'bookings' | 'requests';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  REQUESTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-orange-100 text-orange-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const REQUEST_STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const URGENCY_BADGE_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

const TRIP_STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-gray-100 text-gray-600',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: string): string {
  return STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-600';
}

function getUrgencyBadge(urgency: string): string {
  return URGENCY_BADGE_STYLES[urgency] || 'bg-gray-100 text-gray-600';
}

function getTripStatusBadge(status: string): string {
  return TRIP_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
}

function formatTime(time: string): string {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

// Can edit/delete only if not yet accepted
function canEditDelete(status: string): boolean {
  return status === 'ACTIVE' || status === 'REQUESTED';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyPostingsPage() {
  const searchParams = useSearchParams();

  // Top-level tab state
  const initialTab = searchParams.get('tab') as ActiveTab;
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab === 'requests' ? 'requests' : initialTab === 'bookings' ? 'bookings' : 'vehicles'
  );

  // Filter state
  const [activeStatus, setActiveStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  // Data state
  const [data, setData] = useState<PostingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Requests tab state
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string>('');
  const [requestsPage, setRequestsPage] = useState(1);

  // Comment/Share state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, P2PComment[]>>({});
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});
  const [shareDropdown, setShareDropdown] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Expanded sections
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  // Request respond state
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [respondAction, setRespondAction] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [agreedAmount, setAgreedAmount] = useState<string>('');
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Fetch postings
  // -------------------------------------------------------------------
  const fetchPostings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('type', 'all');
      params.set('page', String(page));
      params.set('limit', '50');
      if (activeStatus) {
        params.set('status', activeStatus);
      }

      const res = await fetch(`/api/p2p/my-postings?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch postings');
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch postings');
      }

      setData({
        vehiclePostings: json.vehiclePostings || [],
        bookingPostings: json.bookingPostings || [],
        totals: json.totals || { vehicles: 0, bookings: 0 },
        pagination: json.pagination || { page: 1, limit: 50, type: 'all' },
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page]);

  useEffect(() => {
    fetchPostings();
  }, [fetchPostings]);

  // Fetch comment counts for all postings when data loads
  useEffect(() => {
    if (!data) return;
    const vehicleIds = data.vehiclePostings.map((vp) => vp.id);
    const bookingIds = data.bookingPostings.map((bp) => bp.id);

    if (vehicleIds.length > 0) {
      fetch(`/api/p2p/comments?mode=counts&postingType=VEHICLE&postingIds=${vehicleIds.join(',')}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.counts) setCommentCountMap((prev) => ({ ...prev, ...d.counts }));
        })
        .catch(() => {});
    }
    if (bookingIds.length > 0) {
      fetch(`/api/p2p/comments?mode=counts&postingType=BOOKING&postingIds=${bookingIds.join(',')}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.counts) setCommentCountMap((prev) => ({ ...prev, ...d.counts }));
        })
        .catch(() => {});
    }
  }, [data]);

  // -------------------------------------------------------------------
  // Fetch sent requests
  // -------------------------------------------------------------------
  const fetchMyRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams();
      if (requestStatus) params.set('status', requestStatus);
      params.set('page', String(requestsPage));
      params.set('limit', '20');

      const res = await fetch(`/api/p2p/my-requests?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch requests');
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch requests');
      }

      setRequests(json.requests || []);
      setRequestsTotal(json.total ?? json.requests?.length ?? 0);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setRequests([]);
      setRequestsTotal(0);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestStatus, requestsPage]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchMyRequests();
    }
  }, [activeTab, fetchMyRequests]);

  // Fetch requests total on initial load
  useEffect(() => {
    const fetchRequestsTotal = async () => {
      try {
        const res = await fetch('/api/p2p/my-requests?page=1&limit=1');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setRequestsTotal(json.total ?? 0);
          }
        }
      } catch {
        // silently ignore
      }
    };
    fetchRequestsTotal();
  }, []);

  // Reset page when filters change
  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleRequestStatusChange = (status: string) => {
    setRequestStatus(status);
    setRequestsPage(1);
  };

  // -------------------------------------------------------------------
  // Delete handler
  // -------------------------------------------------------------------
  const handleDelete = async (type: 'vehicle' | 'booking', id: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${type === 'vehicle' ? 'vehicle posting' : 'booking posting'}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(id);
    try {
      const endpoint =
        type === 'vehicle'
          ? `/api/p2p/vehicles/${id}`
          : `/api/p2p/bookings/${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete posting');
      }

      await fetchPostings();
    } catch (err: any) {
      alert(err.message || 'Failed to delete posting');
    } finally {
      setDeleting(null);
    }
  };

  // -------------------------------------------------------------------
  // Toggle helpers
  // -------------------------------------------------------------------
  const toggleRequests = (postingId: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      next.has(postingId) ? next.delete(postingId) : next.add(postingId);
      return next;
    });
  };

  const toggleTransactions = (postingId: string) => {
    setExpandedTransactions((prev) => {
      const next = new Set(prev);
      next.has(postingId) ? next.delete(postingId) : next.add(postingId);
      return next;
    });
  };

  // -------------------------------------------------------------------
  // Request respond handlers
  // -------------------------------------------------------------------
  const openAcceptConfirm = (requestId: string, defaultAmount: number) => {
    setAcceptingRequestId(requestId);
    setAgreedAmount(String(defaultAmount || ''));
  };

  const cancelAcceptConfirm = () => {
    setAcceptingRequestId(null);
    setAgreedAmount('');
  };

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'REJECT', amount?: string) => {
    setRespondingRequestId(requestId);
    setRespondAction(action);
    try {
      const body: Record<string, any> = { action };
      if (action === 'ACCEPT' && amount) {
        body.agreedAmount = parseFloat(amount);
      }
      const res = await fetch(`/api/p2p/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action.toLowerCase()} request`);
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Failed to ${action.toLowerCase()} request`);
      }
      cancelAcceptConfirm();
      await fetchPostings();
    } catch (err: any) {
      alert(err.message || `Failed to ${action.toLowerCase()} request`);
    } finally {
      setRespondingRequestId(null);
      setRespondAction(null);
    }
  };

  // -------------------------------------------------------------------
  // Comment/Share functions
  // -------------------------------------------------------------------
  const fetchComments = async (postingId: string, postingType: 'VEHICLE' | 'BOOKING') => {
    setCommentLoading((prev) => ({ ...prev, [postingId]: true }));
    try {
      const res = await fetch(`/api/p2p/comments?postingType=${postingType}&postingId=${postingId}`);
      const d = await res.json();
      if (d.success) {
        setCommentsMap((prev) => ({ ...prev, [postingId]: d.comments }));
        setCommentCountMap((prev) => ({ ...prev, [postingId]: d.total }));
      }
    } catch {
      // silently fail
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postingId]: false }));
    }
  };

  const toggleComments = (postingId: string, postingType: 'VEHICLE' | 'BOOKING') => {
    const isExpanded = expandedComments[postingId];
    setExpandedComments((prev) => ({ ...prev, [postingId]: !isExpanded }));
    setShareDropdown(null);
    if (!isExpanded && !commentsMap[postingId]) {
      fetchComments(postingId, postingType);
    }
  };

  const handleSendComment = async (postingId: string, postingType: 'VEHICLE' | 'BOOKING') => {
    const message = commentInputs[postingId]?.trim();
    if (!message) return;

    setCommentSending((prev) => ({ ...prev, [postingId]: true }));
    try {
      const res = await fetch('/api/p2p/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postingType, postingId, message }),
      });
      const d = await res.json();
      if (d.success && d.comment) {
        setCommentsMap((prev) => ({
          ...prev,
          [postingId]: [...(prev[postingId] || []), d.comment],
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

  const handleCopyLink = (postingId: string, type: 'vehicle' | 'booking') => {
    const path = type === 'vehicle' ? 'vehicles' : 'bookings';
    const link = `${window.location.origin}/vendor/p2p/${path}?highlight=${postingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(postingId);
      setTimeout(() => setCopiedLink(null), 2000);
    });
    setShareDropdown(null);
  };

  const handleWhatsAppShareVehicle = (vp: VehiclePosting) => {
    const text = `🚛 Vehicle Available!\n\n` +
      `${vp.vehicleName}${vp.vehicleNumber ? ` (${vp.vehicleNumber})` : ''}\n` +
      `📍 ${vp.fromCity} → ${vp.toCity}\n` +
      `📅 ${formatDate(vp.departureDate)}\n` +
      `💰 ${formatPrice(vp.priceFullLoad)}\n\n` +
      `${window.location.origin}/vendor/p2p/vehicles?highlight=${vp.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareDropdown(null);
  };

  const handleWhatsAppShareBooking = (bp: BookingPosting) => {
    const text = `📦 Booking Available!\n\n` +
      `${bp.serviceType}${bp.vehicleRequired ? ` - ${bp.vehicleRequired}` : ''}\n` +
      `📍 ${bp.fromCity}${bp.toCity ? ` → ${bp.toCity}` : ''}\n` +
      `📅 ${formatDate(bp.tripDate)}\n` +
      `💰 Earn: ${formatPrice(bp.partnerEarning ?? bp.customerBudget)}\n\n` +
      `${window.location.origin}/vendor/p2p/bookings?highlight=${bp.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareDropdown(null);
  };

  const renderCommentShareBar = (postingId: string, postingType: 'VEHICLE' | 'BOOKING', type: 'vehicle' | 'booking', posting: any) => {
    const isVehicle = type === 'vehicle';
    return (
      <>
        {/* Comment & Share Bar */}
        <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
          <button
            onClick={() => toggleComments(postingId, postingType)}
            className={`inline-flex items-center gap-1.5 text-sm text-gray-500 transition ${isVehicle ? 'hover:text-blue-600' : 'hover:text-purple-600'}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCountMap[postingId] || 0}</span>
            {expandedComments[postingId] ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => toggleShareDropdown(postingId)}
              className={`inline-flex items-center gap-1.5 text-sm text-gray-500 transition ${isVehicle ? 'hover:text-blue-600' : 'hover:text-purple-600'}`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {shareDropdown === postingId && (
              <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => handleCopyLink(postingId, type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  {copiedLink === postingId ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedLink === postingId ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => isVehicle ? handleWhatsAppShareVehicle(posting) : handleWhatsAppShareBooking(posting)}
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
        {expandedComments[postingId] && (
          <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
            {commentLoading[postingId] ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className={`w-5 h-5 animate-spin ${isVehicle ? 'text-blue-500' : 'text-purple-500'}`} />
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                {(!commentsMap[postingId] || commentsMap[postingId].length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-3">
                    No comments yet on this posting.
                  </p>
                )}
                {commentsMap[postingId]?.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    {comment.vendor.logo ? (
                      <img
                        src={comment.vendor.logo}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 ${isVehicle ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
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

            {/* Comment Input - Owner can also reply */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Reply to comments..."
                value={commentInputs[postingId] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({ ...prev, [postingId]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment(postingId, postingType);
                  }
                }}
                className={`flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 ${isVehicle ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
              />
              <button
                onClick={() => handleSendComment(postingId, postingType)}
                disabled={commentSending[postingId] || !commentInputs[postingId]?.trim()}
                className={`p-2 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${isVehicle ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {commentSending[postingId] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // -------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------
  const vehiclePostings = data?.vehiclePostings || [];
  const bookingPostings = data?.bookingPostings || [];
  const totals = data?.totals || { vehicles: 0, bookings: 0 };

  // -------------------------------------------------------------------
  // Render helpers — Requests expandable section (shared for both types)
  // -------------------------------------------------------------------
  const renderRequestsSection = (postingId: string, reqs: P2PRequest[], defaultAmount: number) => {
    if (reqs.length === 0) return null;
    return (
      <div className="mb-3 border border-gray-100 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleRequests(postingId)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
        >
          <span>Requests ({reqs.length})</span>
          {expandedRequests.has(postingId) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expandedRequests.has(postingId) && (
          <div className="divide-y divide-gray-50">
            {reqs.map((req) => (
              <div key={req.id}>
                <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {req.requestingVendor.businessName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{req.requestingVendor.businessName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {req.requestingVendor.city && <span>{req.requestingVendor.city}</span>}
                        <span>{getRelativeTime(req.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 font-mono">{req.requestNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(req.status)}`}>{req.status}</span>
                    {req.status === 'PENDING' && acceptingRequestId !== req.id && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAcceptConfirm(req.id, defaultAmount)}
                          disabled={respondingRequestId === req.id}
                          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {respondingRequestId === req.id && respondAction === 'ACCEPT' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'REJECT')}
                          disabled={respondingRequestId === req.id}
                          className="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {respondingRequestId === req.id && respondAction === 'REJECT' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Accept confirmation inline */}
                {acceptingRequestId === req.id && (
                  <div className="px-3 pb-3 pt-1">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Agreed Amount</label>
                      <input
                        type="number"
                        value={agreedAmount}
                        onChange={(e) => setAgreedAmount(e.target.value)}
                        placeholder="Enter agreed amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none mb-2"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespond(req.id, 'ACCEPT', agreedAmount)}
                          disabled={respondingRequestId === req.id || !agreedAmount}
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 font-medium"
                        >
                          {respondingRequestId === req.id && respondAction === 'ACCEPT' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Confirm Accept
                        </button>
                        <button onClick={cancelAcceptConfirm} className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg transition font-medium">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTransactionsSection = (postingId: string, txs: P2PTransaction[]) => {
    if (txs.length === 0) return null;
    return (
      <div className="mb-3 border border-gray-100 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleTransactions(postingId)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
        >
          <span>Transactions ({txs.length})</span>
          {expandedTransactions.has(postingId) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expandedTransactions.has(postingId) && (
          <div className="divide-y divide-gray-50">
            {txs.map((tx) => (
              <div key={tx.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{tx.transactionNumber}</p>
                  <p className="text-xs text-gray-400">{getRelativeTime(tx.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTripStatusBadge(tx.tripStatus)}`}>{tx.tripStatus.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(tx.agreedAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold">My Postings</h1>
          <p className="text-blue-100 mt-1">Loading your postings...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-500 text-sm">Loading your postings...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ---- Gradient Header ---- */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/vendor/p2p" className="p-2 hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Postings</h1>
              <p className="text-blue-100 mt-1 text-sm">Manage your vehicles, bookings &amp; requests</p>
            </div>
          </div>
          <button
            onClick={() => { fetchPostings(); if (activeTab === 'requests') fetchMyRequests(); }}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition" onClick={() => setActiveTab('vehicles')}>
            <div className="p-2 bg-white/20 rounded-lg"><Truck className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold">{totals.vehicles}</p>
              <p className="text-xs text-blue-100">Vehicles</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition" onClick={() => setActiveTab('bookings')}>
            <div className="p-2 bg-white/20 rounded-lg"><CalendarCheck className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold">{totals.bookings}</p>
              <p className="text-xs text-blue-100">Bookings</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition" onClick={() => setActiveTab('requests')}>
            <div className="p-2 bg-white/20 rounded-lg"><Send className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold">{requestsTotal}</p>
              <p className="text-xs text-blue-100">Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- 3 Tab Switcher ---- */}
      <div className="flex gap-2">
        {[
          { key: 'vehicles' as ActiveTab, label: 'My Vehicles', icon: Truck, count: totals.vehicles },
          { key: 'bookings' as ActiveTab, label: 'My Bookings', icon: CalendarCheck, count: totals.bookings },
          { key: 'requests' as ActiveTab, label: 'Requests Sent', icon: Send, count: requestsTotal },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: VEHICLE POSTINGS */}
      {/* ================================================================ */}
      {activeTab === 'vehicles' && (
        <>
          {/* Status filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleStatusChange(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeStatus === f.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading && data && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-gray-500">Refreshing...</span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={fetchPostings} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">Try Again</button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && vehiclePostings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicle postings yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Post your empty/idle vehicles so other vendors can use them.</p>
              <Link
                href="/vendor/p2p/vehicles/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Post Vehicle
              </Link>
            </div>
          )}

          {/* Vehicle cards */}
          {!loading && !error && vehiclePostings.length > 0 && (
            <div className="space-y-4">
              {vehiclePostings.map((vp) => (
                <div key={vp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">{vp.postingNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(vp.status)}`}>{vp.status.replace(/_/g, ' ')}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">{vp.serviceType}</span>
                      </div>
                      <span className="text-xs text-gray-400" title={formatDate(vp.createdAt)}>{getRelativeTime(vp.createdAt)}</span>
                    </div>

                    {/* Vehicle info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        {vp.serviceType?.toLowerCase() === 'car' ? <Car className="w-5 h-5 text-blue-600" /> : <Truck className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{vp.vehicleName}</h3>
                        {vp.vehicleNumber && <p className="text-xs text-gray-400">{vp.vehicleNumber}</p>}
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{vp.fromCity}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-gray-700 font-medium">{vp.toCity}</span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{formatDate(vp.departureDate)}</span>
                      {vp.departureTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{formatTime(vp.departureTime)}</span>}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-3">
                      <div>
                        <span className="text-lg font-bold text-green-600">{formatPrice(vp.priceFullLoad)}</span>
                        <span className="text-xs text-gray-400 ml-1">full load</span>
                      </div>
                      {vp.acceptsPartLoad && vp.pricePartLoad != null && (
                        <div>
                          <span className="text-sm font-semibold text-gray-600">{formatPrice(vp.pricePartLoad)}</span>
                          <span className="text-xs text-gray-400 ml-1">part load</span>
                        </div>
                      )}
                    </div>

                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {vp.driverIncluded && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100"><User className="w-3 h-3" />Driver</span>
                      )}
                      {vp.fuelIncluded && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-100"><Fuel className="w-3 h-3" />Fuel</span>
                      )}
                      {vp.capacity > 0 && <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">{vp.capacity} ton</span>}
                      {vp.bodyType && <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">{vp.bodyType}</span>}
                      {vp.acceptsPartLoad && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">Part Load OK</span>}
                    </div>

                    {vp.notes && <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 rounded-lg p-2">{vp.notes}</p>}

                    {/* Pending requests badge */}
                    {vp.pendingRequests > 0 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {vp.pendingRequests} pending request{vp.pendingRequests !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {renderRequestsSection(vp.id, vp.p2p_requests, vp.priceFullLoad)}
                    {renderTransactionsSection(vp.id, vp.p2p_transactions)}

                    {/* Edit / Delete — only if not yet accepted */}
                    {canEditDelete(vp.status) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Link
                          href={`/vendor/p2p/vehicles/post?edit=${vp.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete('vehicle', vp.id)}
                          disabled={deleting === vp.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                        >
                          {deleting === vp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {renderCommentShareBar(vp.id, 'VEHICLE', 'vehicle', vp)}
                </div>
              ))}

              {/* Add more button */}
              <div className="flex justify-center pt-2 pb-4">
                <Link
                  href="/vendor/p2p/vehicles/post"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Post Another Vehicle
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* TAB 2: BOOKING POSTINGS */}
      {/* ================================================================ */}
      {activeTab === 'bookings' && (
        <>
          {/* Status filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleStatusChange(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeStatus === f.key ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading && data && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-sm text-gray-500">Refreshing...</span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={fetchPostings} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">Try Again</button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && bookingPostings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings shared yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Share bookings you can&apos;t fulfill so other vendors can help.</p>
              <Link
                href="/vendor/p2p/bookings/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Share Booking
              </Link>
            </div>
          )}

          {/* Booking cards */}
          {!loading && !error && bookingPostings.length > 0 && (
            <div className="space-y-4">
              {bookingPostings.map((bp) => (
                <div key={bp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">{bp.postingNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(bp.status)}`}>{bp.status.replace(/_/g, ' ')}</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">{bp.serviceType}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getUrgencyBadge(bp.urgency)}`}>{bp.urgency}</span>
                      </div>
                      <span className="text-xs text-gray-400" title={formatDate(bp.createdAt)}>{getRelativeTime(bp.createdAt)}</span>
                    </div>

                    {/* Vehicle required */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {bp.vehicleRequired && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">{bp.vehicleRequired}</span>}
                      {bp.vehicleCategory && <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded">{bp.vehicleCategory}</span>}
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{bp.fromCity}</span>
                      {bp.toCity && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-gray-700 font-medium">{bp.toCity}</span>
                        </>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{formatDate(bp.tripDate)}</span>
                      {bp.tripTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{formatTime(bp.tripTime)}</span>}
                    </div>

                    {/* Commission breakdown */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Customer Budget</p>
                          <p className="text-sm font-bold text-gray-900">{formatPrice(bp.customerBudget)}</p>
                        </div>
                        <div className="border-x border-gray-200">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Partner Earning</p>
                          <p className="text-sm font-bold text-green-600">{formatPrice(bp.partnerEarning ?? bp.customerBudget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Your Commission</p>
                          <p className="text-sm font-bold text-purple-600">{formatPrice(bp.commission ?? 0)}</p>
                        </div>
                      </div>
                    </div>

                    {bp.reason && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded mb-3">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />{bp.reason}
                      </div>
                    )}

                    {bp.notes && <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 rounded-lg p-2">{bp.notes}</p>}

                    {bp.pendingRequests > 0 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {bp.pendingRequests} pending request{bp.pendingRequests !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {renderRequestsSection(bp.id, bp.p2p_requests, bp.customerBudget)}
                    {renderTransactionsSection(bp.id, bp.p2p_transactions)}

                    {/* Edit / Delete — only if not yet accepted */}
                    {canEditDelete(bp.status) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Link
                          href={`/vendor/p2p/bookings/post?edit=${bp.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete('booking', bp.id)}
                          disabled={deleting === bp.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                        >
                          {deleting === bp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {renderCommentShareBar(bp.id, 'BOOKING', 'booking', bp)}
                </div>
              ))}

              {/* Add more button */}
              <div className="flex justify-center pt-2 pb-4">
                <Link
                  href="/vendor/p2p/bookings/post"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Share Another Booking
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/* TAB 3: REQUESTS SENT */}
      {/* ================================================================ */}
      {activeTab === 'requests' && (
        <>
          {/* Request Status Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
              {REQUEST_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleRequestStatusChange(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    requestStatus === f.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {requestsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-gray-500">Loading requests...</span>
            </div>
          )}

          {!requestsLoading && requests.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests sent yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Browse available postings and send requests to other vendors!</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/vendor/p2p/vehicles" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                  <Truck className="w-4 h-4" /> Available Vehicles
                </Link>
                <Link href="/vendor/p2p/bookings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm">
                  <CalendarCheck className="w-4 h-4" /> Available Bookings
                </Link>
              </div>
            </div>
          )}

          {!requestsLoading && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map((req) => {
                const isVehicle = req.postingType === 'VEHICLE' || !!req.vehiclePosting;
                const vendor = req.postingVendor;

                return (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400 font-mono">{req.requestNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                            req.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{req.status}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${isVehicle ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                            {isVehicle ? 'Vehicle Request' : 'Booking Request'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400" title={formatDate(req.createdAt)}>{getRelativeTime(req.createdAt)}</span>
                      </div>

                      {/* Vendor info */}
                      <div className="flex items-center gap-3 mb-3">
                        {vendor?.logo ? (
                          <img src={vendor.logo} alt={vendor.businessName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {vendor?.businessName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{vendor?.businessName || 'Unknown Vendor'}</p>
                          {vendor?.city && <p className="text-xs text-gray-400">{vendor.city}</p>}
                        </div>
                      </div>

                      {/* Vehicle posting details */}
                      {isVehicle && req.vehiclePosting && (
                        <div className="bg-blue-50/50 rounded-lg p-3 mb-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">{req.vehiclePosting.vehicleName || 'Vehicle'}</span>
                            {req.vehiclePosting.vehicleNumber && <span className="text-xs text-gray-400">({req.vehiclePosting.vehicleNumber})</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">{req.vehiclePosting.fromCity}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-700">{req.vehiclePosting.toCity}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {req.vehiclePosting.departureDate && (
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(req.vehiclePosting.departureDate)}</span>
                            )}
                            {req.vehiclePosting.priceFullLoad != null && (
                              <span className="flex items-center gap-1 font-semibold text-green-600"><DollarSign className="w-3.5 h-3.5" />{formatPrice(req.vehiclePosting.priceFullLoad)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Booking posting details */}
                      {!isVehicle && req.bookingPosting && (
                        <div className="bg-purple-50/50 rounded-lg p-3 mb-3 space-y-2">
                          {req.bookingPosting.vehicleRequired && (
                            <div className="flex items-center gap-2">
                              <CalendarCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-900">{req.bookingPosting.vehicleRequired}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">{req.bookingPosting.fromCity}</span>
                            {req.bookingPosting.toCity && (
                              <>
                                <ArrowRight className="w-3 h-3 text-gray-300" />
                                <span className="text-gray-700">{req.bookingPosting.toCity}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            {req.bookingPosting.tripDate && (
                              <span className="flex items-center gap-1 text-gray-500"><Calendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(req.bookingPosting.tripDate)}</span>
                            )}
                            {req.bookingPosting.partnerEarning != null && (
                              <span className="text-gray-600">Earning: <span className="font-semibold text-green-600">{formatPrice(req.bookingPosting.partnerEarning)}</span></span>
                            )}
                          </div>
                        </div>
                      )}

                      {req.notes && <p className="text-xs text-gray-500 italic mb-3 bg-gray-50 rounded-lg p-2">{req.notes}</p>}

                      {/* Status messages */}
                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                          </span>
                          <span className="text-xs font-medium text-orange-700">Waiting for response...</span>
                        </div>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Deal confirmed!</span>
                          </div>
                          <Link href="/vendor/p2p/activity" className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 transition">
                            <Eye className="w-3.5 h-3.5" /> View in Activity
                          </Link>
                        </div>
                      )}

                      {req.status === 'REJECTED' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-700">Request was declined</span>
                        </div>
                      )}

                      {req.status === 'CANCELLED' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                          <X className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">Request was cancelled</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                  disabled={requestsPage <= 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-gray-600">Page {requestsPage}</span>
                <button
                  onClick={() => setRequestsPage((p) => p + 1)}
                  disabled={requests.length < 20}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
