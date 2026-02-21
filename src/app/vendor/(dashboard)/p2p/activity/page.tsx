'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Car,
  CalendarCheck,
  ArrowRight,
  DollarSign,
  Star,
  Activity,
  Clock,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Filter,
  Play,
  XCircle,
  User,
  Phone,
} from 'lucide-react';
import { formatPrice, formatDate, getRelativeTime } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorRef {
  id: string;
  businessName: string;
  city?: string;
  logo?: string | null;
}

interface Transaction {
  id: string;
  transactionNumber: string;
  postingType: 'VEHICLE' | 'BOOKING';
  serviceType: string;
  fromCity: string;
  toCity: string;
  tripDate: string;
  vehicleName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  agreedAmount: number;
  platformFee: number;
  vendorAEarning: number;
  vendorBEarning: number;
  paymentStatus: string;
  tripStatus: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  vendorA: VendorRef;
  vendorB: VendorRef;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalVehiclePostings: number;
  totalBookingPostings: number;
  activePostings: number;
  totalTransactions: number;
  completedTransactions: number;
  totalEarnings: number;
  pendingSettlements: number;
  averageRating: number;
  totalRatings: number;
  recentActivity: any[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAIN_TABS = [
  { key: 'vehicles', label: 'Vehicle Deals', icon: Truck },
  { key: 'bookings', label: 'Booking Deals', icon: CalendarCheck },
] as const;

type MainTab = typeof MAIN_TABS[number]['key'];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
] as const;

const PAGE_LIMIT = 20;

// Card config based on transaction category
type TxCategory = 'VEHICLE_SHARED' | 'VEHICLE_RECEIVED' | 'BOOKING_SHARED' | 'BOOKING_RECEIVED';

const CATEGORY_CONFIG: Record<TxCategory, { label: string; badge: string; border: string; iconBg: string; iconColor: string }> = {
  VEHICLE_SHARED: {
    label: 'Vehicle Shared',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  VEHICLE_RECEIVED: {
    label: 'Vehicle Received',
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-l-sky-500',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  BOOKING_SHARED: {
    label: 'Booking Shared',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  BOOKING_RECEIVED: {
    label: 'Booking Received',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
};

const TRIP_STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Play },
  CONFIRMED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function P2PActivityPage() {
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('vehicles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Trip action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [startOtpResult, setStartOtpResult] = useState<{ txId: string; otp: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchVendorId = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/profile');
      if (res.ok) {
        const data = await res.json();
        setCurrentVendorId(data.id);
      }
    } catch (err) {
      console.error('Failed to fetch vendor profile:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/p2p/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch P2P stats:', err);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (pageNum: number) => {
      setTxLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', String(PAGE_LIMIT));
        if (statusFilter !== 'all') params.set('status', statusFilter);
        params.set('type', mainTab === 'vehicles' ? 'VEHICLE' : 'BOOKING');

        const res = await fetch(`/api/p2p/transactions?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
          setPagination(data.pagination || null);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setTxLoading(false);
      }
    },
    [statusFilter, mainTab]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchVendorId(), fetchStats()]);
      setLoading(false);
    };
    init();
  }, [fetchVendorId, fetchStats]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [mainTab, statusFilter]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const isVendorA = (tx: Transaction): boolean =>
    currentVendorId !== null && tx.vendorA.id === currentVendorId;

  const getPartner = (tx: Transaction): VendorRef =>
    isVendorA(tx) ? tx.vendorB : tx.vendorA;

  const getMyEarning = (tx: Transaction): number =>
    isVendorA(tx) ? tx.vendorAEarning : tx.vendorBEarning;

  const getCategory = (tx: Transaction): TxCategory => {
    if (tx.postingType === 'VEHICLE') {
      return isVendorA(tx) ? 'VEHICLE_SHARED' : 'VEHICLE_RECEIVED';
    }
    return isVendorA(tx) ? 'BOOKING_SHARED' : 'BOOKING_RECEIVED';
  };

  const getMyRole = (tx: Transaction): string => {
    const cat = getCategory(tx);
    switch (cat) {
      case 'VEHICLE_SHARED': return 'You shared your vehicle';
      case 'VEHICLE_RECEIVED': return 'You requested this vehicle';
      case 'BOOKING_SHARED': return 'You shared this booking';
      case 'BOOKING_RECEIVED': return 'You accepted this booking';
      default: return '';
    }
  };

  const isCar = (tx: Transaction) => tx.serviceType?.toLowerCase() === 'car';

  // ---------------------------------------------------------------------------
  // Trip Actions
  // ---------------------------------------------------------------------------

  const handleStartTrip = async (e: React.MouseEvent, txId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoading(txId);
    setActionType('start');
    setActionError(null);
    setStartOtpResult(null);
    try {
      const res = await fetch(`/api/p2p/transactions/${txId}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start trip');
      setStartOtpResult({ txId, otp: data.startOtp });
      fetchTransactions(page);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  const handleCompleteTrip = async (e: React.MouseEvent, txId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Mark this trip as completed?')) return;
    setActionLoading(txId);
    setActionType('complete');
    setActionError(null);
    try {
      const res = await fetch(`/api/p2p/transactions/${txId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete trip');
      fetchTransactions(page);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, txId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this transaction?')) return;
    setActionLoading(txId);
    setActionType('cancel');
    setActionError(null);
    try {
      const res = await fetch(`/api/p2p/transactions/${txId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      fetchTransactions(page);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="h-7 w-7" />
            <h1 className="text-2xl md:text-3xl font-bold">My P2P Activity</h1>
          </div>
          <p className="text-blue-100 text-sm md:text-base">
            Track all your peer-to-peer transactions, earnings and activity.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatPrice(stats?.totalEarnings || 0)}</p>
              <p className="text-xs text-green-100">Total Earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
              <p className="text-xs text-gray-500">Total Deals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats?.completedTransactions || 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                {stats?.totalRatings ? (
                  <span className="text-sm font-normal text-gray-400"> ({stats.totalRatings})</span>
                ) : null}
              </p>
              <p className="text-xs text-gray-500">P2P Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs: Vehicle Deals | Booking Deals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {MAIN_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = mainTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors relative ${
                  isActive
                    ? 'text-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TabIcon className="h-4.5 w-4.5" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Status filter inside tab area */}
        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {txLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          {mainTab === 'vehicles' ? (
            <>
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicle deals yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Share your empty vehicles or request vehicles from other vendors to see deals here.
              </p>
              <Link
                href="/vendor/p2p/vehicles"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Browse Vehicles
              </Link>
            </>
          ) : (
            <>
              <CalendarCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No booking deals yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Share bookings you can&apos;t fulfill or accept bookings from other vendors to see deals here.
              </p>
              <Link
                href="/vendor/p2p/bookings"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Browse Bookings
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const partner = getPartner(tx);
            const myEarning = getMyEarning(tx);
            const category = getCategory(tx);
            const config = CATEGORY_CONFIG[category];
            const tripConfig = TRIP_STATUS_CONFIG[tx.tripStatus] || TRIP_STATUS_CONFIG.PENDING;
            const TripIcon = tripConfig.icon;

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${config.border} overflow-hidden hover:shadow-md transition-all`}
              >
                {/* Top bar: Category badge + Status + Time */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${config.badge}`}>
                      {config.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tripConfig.bg} ${tripConfig.text}`}>
                      <TripIcon className="h-3 w-3" />
                      {tx.tripStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{getRelativeTime(tx.createdAt)}</span>
                </div>

                {/* Main content */}
                <div className="px-4 pb-4 pt-2">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2.5 rounded-xl ${config.iconBg}`}>
                      {isCar(tx) ? (
                        <Car className={`h-5 w-5 ${config.iconColor}`} />
                      ) : (
                        <Truck className={`h-5 w-5 ${config.iconColor}`} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Transaction # + Role */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-gray-900">{tx.transactionNumber}</span>
                        <span className="text-[11px] text-gray-400 italic">{getMyRole(tx)}</span>
                      </div>

                      {/* Partner */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">Partner:</span>
                        {partner.logo ? (
                          <img src={partner.logo} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {partner.businessName?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">{partner.businessName}</span>
                        {partner.city && (
                          <span className="text-[11px] text-gray-400">({partner.city})</span>
                        )}
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          <span className="font-medium text-gray-700">{tx.fromCity}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">{tx.toCity || '—'}</span>
                        </div>
                      </div>

                      {/* Info row: Date + Vehicle + Driver */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="h-3 w-3 text-gray-400" />
                          {formatDate(tx.tripDate)}
                        </span>
                        {tx.vehicleName && (
                          <span className="flex items-center gap-1">
                            {isCar(tx) ? <Car className="h-3 w-3 text-gray-400" /> : <Truck className="h-3 w-3 text-gray-400" />}
                            {tx.vehicleName}
                            {tx.vehicleNumber ? ` (${tx.vehicleNumber})` : ''}
                          </span>
                        )}
                        {tx.driverName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            {tx.driverName}
                          </span>
                        )}
                        {tx.driverPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {tx.driverPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="text-base font-bold text-gray-900">{formatPrice(tx.agreedAmount)}</p>
                      <p className="text-sm font-bold text-green-600">+{formatPrice(myEarning)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Your earning</p>
                      <div className="mt-1">
                        <span className={`text-[10px] font-medium ${
                          tx.paymentStatus === 'PAID' ? 'text-green-600' :
                          tx.paymentStatus === 'SETTLED' ? 'text-blue-600' : 'text-orange-500'
                        }`}>
                          {tx.paymentStatus === 'PAID' && <CheckCircle className="h-2.5 w-2.5 inline mr-0.5" />}
                          {tx.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(tx.tripStatus === 'CONFIRMED' || tx.tripStatus === 'IN_PROGRESS' || tx.tripStatus === 'PENDING') && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {startOtpResult && startOtpResult.txId === tx.id && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800">Trip Started!</p>
                          <p className="text-xs text-green-600 mt-1">Click &quot;Complete Trip&quot; when done.</p>
                        </div>
                      )}

                      {actionError && actionLoading === null && (
                        <p className="text-xs text-red-600 mb-2">{actionError}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Start Trip — vendorA only, CONFIRMED */}
                        {tx.tripStatus === 'CONFIRMED' && isVendorA(tx) && (
                          <button
                            onClick={(e) => handleStartTrip(e, tx.id)}
                            disabled={actionLoading === tx.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            {actionLoading === tx.id && actionType === 'start' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            Start Trip
                          </button>
                        )}

                        {/* Complete Trip — vendorA only, IN_PROGRESS */}
                        {tx.tripStatus === 'IN_PROGRESS' && isVendorA(tx) && (
                          <button
                            onClick={(e) => handleCompleteTrip(e, tx.id)}
                            disabled={actionLoading === tx.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            {actionLoading === tx.id && actionType === 'complete' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Complete Trip
                          </button>
                        )}

                        {/* Cancel — either vendor, PENDING or CONFIRMED */}
                        {(tx.tripStatus === 'PENDING' || tx.tripStatus === 'CONFIRMED') && (
                          <button
                            onClick={(e) => handleCancel(e, tx.id)}
                            disabled={actionLoading === tx.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            {actionLoading === tx.id && actionType === 'cancel' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            Cancel
                          </button>
                        )}

                        {/* IN_PROGRESS message for vendorB */}
                        {tx.tripStatus === 'IN_PROGRESS' && !isVendorA(tx) && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            <Clock className="h-3.5 w-3.5" />
                            Trip in progress...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>
            {' - '}
            <span className="font-medium text-gray-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {' of '}
            <span className="font-medium text-gray-700">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-sm text-gray-600 font-medium px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
