// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Calendar, Clock, MapPin, Phone, User, CheckCircle, XCircle, AlertCircle,
  Navigation, TrendingUp, Filter, Crown, Star, Sparkles, RefreshCw, Send, Eye,
  Gift, IndianRupee, FileText, Zap, Heart, Search, X, List, Grid,
  SlidersHorizontal, ArrowUpRight, ArrowRight, BarChart3,
  MoreVertical, Plus, Download
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface LuxuryItem {
  id: string;
  bookingNumber: string;
  type: 'quote_request' | 'quoted' | 'booking';
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  specificModel: string | null;
  customerName: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress: string | null;
  dropCity: string | null;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  tripDays: number | null;
  tripHours: number | null;
  needDecoration: boolean;
  decorationType: string | null;
  occasion: string | null;
  requirements: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  totalAmount: number | null;
  status: string;
  paymentStatus: string | null;
  driverName: string | null;
  driverPhone: string | null;
  quotesOpenTill: string | null;
  totalQuotesReceived: number | null;
  myQuote: { id: string; quoteNumber: string; totalAmount: number; status: string } | null;
  requestStatus?: string;
  createdAt: string;
}

interface Stats {
  openRequests: number;
  myQuotes: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

interface RevenueChart {
  dailyData: { date: string; revenue: number }[];
  totalRevenue: number;
  percentChange: number;
  avgBooking: number;
  conversionRate: number;
  totalBookings: number;
  periodLabel?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; borderColor: string; icon: any }> = {
  OPEN_REQUEST: { label: 'New Request', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: AlertCircle },
  QUOTE_SENT: { label: 'Quote Sent', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: Send },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', borderColor: 'border-l-yellow-500', icon: Clock },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: User },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderColor: 'border-l-emerald-500', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-50 text-gray-600 border-gray-200', borderColor: 'border-l-gray-400', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', borderColor: 'border-l-red-500', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-50 text-red-600 border-red-200', borderColor: 'border-l-red-500', icon: XCircle },
};

const TRIP_TYPES: Record<string, string> = {
  local: 'Local',
  outstation: 'Outstation',
  airport: 'Airport',
};

const VEHICLE_CATEGORIES: Record<string, string> = {
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
  vintage: 'Vintage',
  sports: 'Sports Car',
  limousine: 'Limousine',
};

const OCCASION_STYLES: Record<string, string> = {
  wedding: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  romantic: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  birthday: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  anniversary: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  corporate: 'bg-slate-50 text-slate-600 border border-slate-200',
  vip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

function getOccasionStyle(occasion: string) {
  const key = occasion.toLowerCase();
  for (const [k, v] of Object.entries(OCCASION_STYLES)) {
    if (key.includes(k)) return v;
  }
  return 'bg-gray-50 text-gray-600 border border-gray-200';
}

// Kanban helpers
const KANBAN_COLUMNS = [
  { id: 'requests', title: 'Requests', accent: '#4F7DF3' },
  { id: 'quotes', title: 'Pending Quotes', accent: '#9B7CF6' },
  { id: 'confirmed', title: 'Confirmed', accent: '#22A06B' },
  { id: 'active', title: 'Active', accent: '#059669' },
  { id: 'completed', title: 'Completed', accent: '#6B7280' },
];

const getVehicleStyle = (category: string | null) => {
  if (!category) return 'bg-[#FAFAFA] border-[#EEEEEE] text-[#6B7280]';
  const cat = category.toLowerCase();
  if (cat.includes('sedan')) return 'bg-emerald-50/50 border-emerald-100 text-emerald-600';
  if (cat.includes('suv')) return 'bg-[#EEF4FF]/60 border-[#E0EAFF] text-[#4F7DF3]';
  if (cat.includes('vintage') || cat.includes('limousine')) return 'bg-emerald-50 border-emerald-200/50 text-emerald-600';
  return 'bg-[#FAFAFA] border-[#EEEEEE] text-[#6B7280]';
};

const getKanbanOccasionStyle = (occasion: string | null) => {
  if (!occasion) return 'bg-[#F8F9FB] text-[#6B7280]';
  const occ = occasion.toLowerCase();
  if (occ.includes('wedding')) return 'bg-[#FFF0F0] text-[#E8A1A1]';
  if (occ.includes('romantic') || occ.includes('anniversary')) return 'bg-[#F4F0FF] text-[#9B7CF6]';
  if (occ.includes('corporate') || occ.includes('business')) return 'bg-[#EEF4FF] text-[#4F7DF3]';
  if (occ.includes('vip')) return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600';
  return 'bg-[#F8F9FB] text-[#6B7280]';
};

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (end === prev.current) return;
    prev.current = end;
    let start: number | null = null;
    function tick(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round(end * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [end, duration]);
  return count;
}

export default function VendorLuxuryBookingsPage() {
  const [items, setItems] = useState<LuxuryItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    openRequests: 0, myQuotes: 0, pending: 0, confirmed: 0, active: 0, completed: 0, totalEarnings: 0,
  });
  const [revenueChart, setRevenueChart] = useState<RevenueChart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  const animatedRevenue = useCountUp(revenueChart?.totalRevenue || 0, 1500);
  const animatedAvgBooking = useCountUp(revenueChart?.avgBooking || 0, 1200);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', filter);
      params.set('page', currentPage.toString());
      params.set('limit', viewMode === 'kanban' ? '50' : '20');
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (searchQuery) params.set('search', searchQuery);

      const [bookingsRes, statsRes, revenueRes] = await Promise.all([
        fetch(`/api/vendor/luxury-bookings?${params}`),
        fetch('/api/vendor/luxury-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stats' }),
        }),
        fetch('/api/vendor/luxury-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'revenue_chart' }),
        }),
      ]);

      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();
      const revenueData = await revenueRes.json();

      if (bookingsData.success) {
        setItems(bookingsData.bookings);
        if (bookingsData.pagination) {
          setTotalPages(bookingsData.pagination.totalPages);
          setTotalItems(bookingsData.pagination.total);
        }
      } else {
        setError(bookingsData.error || 'Failed to fetch data');
      }

      if (statsData.success) setStats(statsData.stats);
      if (revenueData.success) setRevenueChart(revenueData.revenueChart);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter, currentPage, dateFilter, viewMode, searchQuery]);

  const getTimeRemaining = (quotesOpenTill: string) => {
    const now = new Date();
    const deadline = new Date(quotesOpenTill);
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    return `${hours}h left`;
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.bookingNumber?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.customerPhone?.includes(q) ||
        item.pickupCity?.toLowerCase().includes(q) ||
        item.vehicleName?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const getKanbanData = () =>
    KANBAN_COLUMNS.map((col) => ({
      ...col,
      items: filteredItems.filter((i) => {
        if (col.id === 'requests') return i.type === 'quote_request';
        if (col.id === 'quotes') return i.type === 'quoted' && !['CONFIRMED', 'COMPLETED'].includes(i.status);
        if (col.id === 'confirmed') return ['CONFIRMED', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID'].includes(i.status);
        if (col.id === 'active') return ['IN_PROGRESS', 'DRIVER_ASSIGNED'].includes(i.status);
        if (col.id === 'completed') return i.status === 'COMPLETED';
        return false;
      }),
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200/20 px-4 py-3.5 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-200/50 rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-5 w-36 bg-emerald-200/40 rounded" />
                <div className="h-3 w-48 bg-emerald-200/30 rounded" />
              </div>
            </div>
            <div className="w-8 h-8 bg-emerald-200/30 rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Revenue + KPI Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Revenue Card Skeleton */}
            <div className="lg:col-span-7 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-100/50">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-emerald-200/40 rounded" />
                  <div className="h-8 w-40 bg-emerald-200/50 rounded" />
                </div>
                <div className="flex gap-6">
                  <div className="space-y-1.5 text-right">
                    <div className="h-3 w-16 bg-emerald-200/30 rounded ml-auto" />
                    <div className="h-5 w-14 bg-emerald-200/40 rounded ml-auto" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-3 w-16 bg-emerald-200/30 rounded ml-auto" />
                    <div className="h-5 w-10 bg-emerald-200/40 rounded ml-auto" />
                  </div>
                </div>
              </div>
              {/* Chart area skeleton */}
              <div className="h-[90px] flex items-end gap-1 pt-4">
                {[35, 50, 30, 65, 45, 70, 55].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-200/20 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="lg:col-span-5 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
              {[
                { bg: 'bg-emerald-50', border: 'border-t-emerald-200', accent: 'bg-emerald-100' },
                { bg: 'bg-emerald-50', border: 'border-t-emerald-200', accent: 'bg-emerald-100' },
                { bg: 'bg-emerald-50', border: 'border-t-emerald-200', accent: 'bg-emerald-100' },
                { bg: 'bg-white', border: 'border-t-gray-200', accent: 'bg-gray-100' },
                { bg: 'bg-white', border: 'border-t-gray-200', accent: 'bg-gray-100' },
                { bg: 'bg-white', border: 'border-t-gray-200', accent: 'bg-gray-100' },
                { bg: 'bg-emerald-50', border: 'border-t-emerald-200', accent: 'bg-emerald-100' },
              ].map((card, i) => (
                <div key={i} className={`p-2.5 rounded-lg ${card.bg} border-t-[3px] ${card.border} border border-gray-100`}>
                  <div className={`w-6 h-6 ${card.accent} rounded mb-1.5`} />
                  <div className="h-6 w-8 bg-gray-200/50 rounded mb-1" />
                  <div className="h-3 w-14 bg-gray-200/40 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar Skeleton */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 py-2.5 rounded-xl bg-white border border-[#EEEEEE] px-3">
            <div className="flex items-center p-1 bg-[#FAFAFA] rounded-lg border border-[#F0F0F0]">
              <div className="h-8 w-16 bg-gray-100 rounded-md mx-1" />
              <div className="h-8 w-20 bg-gray-50 rounded-md mx-1" />
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="h-9 flex-1 lg:max-w-[200px] bg-gray-50 rounded-lg" />
              <div className="h-9 w-24 bg-gray-50 rounded-lg" />
              <div className="h-9 w-9 bg-gray-50 rounded-lg" />
            </div>
          </div>

          {/* Booking Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="bg-white rounded-xl border border-gray-100 border-l-[3px] border-l-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-100 rounded" />
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                    <div className="h-5 w-20 bg-emerald-50 rounded-full" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>

                <div className="p-5">
                  {/* Vehicle & Price row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg" />
                      <div className="space-y-1.5">
                        <div className="h-5 w-32 bg-gray-100 rounded" />
                        <div className="h-3.5 w-24 bg-gray-50 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-emerald-50 rounded" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {[1, 2, 3, 4].map((col) => (
                      <div key={col} className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-md" />
                        <div className="space-y-1">
                          <div className="h-3 w-10 bg-gray-100 rounded" />
                          <div className="h-4 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-gray-50 rounded-full" />
                      <div className="h-5 w-16 bg-gray-50 rounded-full" />
                    </div>
                    <div className="h-9 w-28 bg-emerald-100 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ═══════ Premium Header ═══════ */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200/20 px-4 py-3.5 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50">
              <Crown className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Luxury Bookings</h1>
              <p className="text-xs text-gray-500">Quote requests & confirmed bookings</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white/60 rounded-lg transition-all duration-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* ═══════ Revenue + KPI Grid ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* Revenue Card */}
        {revenueChart && (
          <div className="lg:col-span-7 relative p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-100/50 overflow-hidden shadow-sm shadow-emerald-600/5">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <h2 className="text-[10px] font-bold text-[#059669] uppercase tracking-[0.15em]">
                    {revenueChart.periodLabel === 'all' ? 'Total Revenue' : 'Rolling 30-Day Revenue'}
                  </h2>
                  {revenueChart.percentChange !== 0 && (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                      revenueChart.percentChange >= 0
                        ? "bg-[#EAFBF3] text-[#22A06B] border border-[#22A06B]/20"
                        : "bg-[#FFF0F0] text-[#E8A1A1] border border-[#E8A1A1]/20"
                    )}>
                      <ArrowUpRight className={cn("w-2.5 h-2.5", revenueChart.percentChange < 0 && "rotate-90")} />
                      {revenueChart.percentChange >= 0 ? '+' : ''}{revenueChart.percentChange}% vs Prev
                    </span>
                  )}
                </div>
                <span className="text-3xl font-black text-[#1F2A37] tracking-tighter">
                  ₹{animatedRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[9px] text-[#059669] uppercase font-bold tracking-[0.15em] mb-1">Avg Booking</p>
                  <p className="text-base font-bold text-[#1F2A37]">₹{animatedAvgBooking.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#059669] uppercase font-bold tracking-[0.15em] mb-1">Conversion</p>
                  <p className="text-base font-black text-[#059669]">{revenueChart.conversionRate}%</p>
                </div>
              </div>
            </div>
            <div className="h-[90px] w-full relative z-10 -ml-2 mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart.dailyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #EEE', borderRadius: '10px', boxShadow: '0 8px 20px -5px rgba(0,0,0,0.05)', fontSize: '12px' }}
                    itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B7280', fontSize: '11px', paddingBottom: '2px' }}
                    cursor={{ stroke: 'rgba(5,150,105,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    fillOpacity={1}
                    fill="url(#revenueGold)"
                    strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: '#059669', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start">
          <button
            onClick={() => { setFilter('open'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-[#F1F6FF] border-t-[3px] border-t-emerald-400 border border-emerald-100 ${filter === 'open' ? 'ring-2 ring-emerald-400 shadow-md' : ''}`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-emerald-500" />
              </div>
              {stats.openRequests > 0 && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.openRequests}</p>
            <p className="text-[10px] text-gray-500 font-medium">Requests</p>
          </button>

          <button
            onClick={() => { setFilter('quoted'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-[#F5F0FF] border-t-[3px] border-t-emerald-400 border border-emerald-100 ${filter === 'quoted' ? 'ring-2 ring-emerald-400 shadow-md' : ''}`}
          >
            <div className="mb-1.5">
              <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                <FileText className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.myQuotes}</p>
            <p className="text-[10px] text-gray-500 font-medium">Quotes</p>
          </button>

          <button
            onClick={() => { setFilter('confirmed'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-[#ECFDF5] border-t-[3px] border-t-emerald-400 border border-emerald-100 ${filter === 'confirmed' ? 'ring-2 ring-emerald-400 shadow-md' : ''}`}
          >
            <div className="mb-1.5">
              <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.pending + stats.confirmed}</p>
            <p className="text-[10px] text-gray-500 font-medium">Confirmed</p>
          </button>

          <button
            onClick={() => { setFilter('active'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-white border border-gray-100 ${filter === 'active' ? 'ring-2 ring-emerald-400 border-emerald-200' : ''}`}
          >
            <div className="mb-1.5">
              <div className="w-6 h-6 bg-emerald-50 rounded flex items-center justify-center">
                <Navigation className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-[10px] text-gray-500 font-medium">Active</p>
          </button>

          <button
            onClick={() => { setFilter('completed'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-white border border-gray-100 ${filter === 'completed' ? 'ring-2 ring-gray-400 border-gray-300' : ''}`}
          >
            <div className="mb-1.5">
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-[10px] text-gray-500 font-medium">Completed</p>
          </button>

          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`relative p-2.5 rounded-lg text-left transition-all duration-200 hover:shadow-md bg-white border border-gray-100 ${filter === 'all' ? 'ring-2 ring-gray-900 border-gray-900' : ''}`}
          >
            <div className="mb-1.5">
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                <Filter className="w-3 h-3 text-gray-500" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {stats.openRequests + stats.myQuotes + stats.pending + stats.confirmed + stats.active}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">All</p>
          </button>

          <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                  <IndianRupee className="w-3 h-3 text-emerald-600" />
                </div>
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">₹{(stats.totalEarnings / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-emerald-700 font-medium">Earned</p>
            </div>
          </div>
        </div>
        </div>

        {/* ═══════ Toolbar ═══════ */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 py-2.5 rounded-xl bg-white border border-[#EEEEEE] shadow-sm px-3">
          <div className="flex items-center p-1 bg-[#FAFAFA] rounded-lg w-full lg:w-auto shrink-0 border border-[#F0F0F0]">
            {[
              { id: 'list', icon: List, label: 'List' },
              { id: 'kanban', icon: Grid, label: 'Pipeline' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id as any)}
                className={cn(
                  "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                  viewMode === view.id ? "bg-white text-[#1F2A37] shadow-sm" : "text-[#6B7280] hover:text-[#1F2A37]"
                )}
              >
                <view.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full justify-end">
            <div className="relative flex-1 lg:max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients or ID..."
                className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1F2A37] text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all placeholder:text-[#6B7280]"
              />
            </div>
            <DateFilterDropdown
              onFilterChange={(start, end) => {
                setDateFilter({ start, end });
                setCurrentPage(1);
              }}
              initialStartDate={dateFilter.start || undefined}
              initialEndDate={dateFilter.end || undefined}
            />
            <button className="p-2 bg-[#FAFAFA] border border-[#EEEEEE] rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#1F2A37]">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══════ VIEWS ═══════ */}
        <AnimatePresence mode="popLayout">

          {/* ═══════ Pipeline / Kanban View (New - from shared design) ═══════ */}
          {viewMode === 'kanban' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory items-start custom-scrollbar"
            >
              {getKanbanData().map((column) => (
                <div key={column.id} className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col gap-3 snap-center bg-[#FAFAFA] rounded-xl border border-[#EEEEEE] p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: column.accent }} />

                  <div className="flex items-center justify-between pb-2 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: column.accent }} />
                      <span className="text-[10px] font-black text-[#1F2A37] uppercase tracking-widest">{column.title}</span>
                    </div>
                    <span className="bg-white border border-[#EEEEEE] px-2 py-0.5 rounded text-[9px] text-[#6B7280] font-black">
                      {column.items.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-2" style={{ maxHeight: 'calc(100vh - 420px)' }}>
                    {column.items.map((item) => {
                      const isQuoted = item.type === 'quoted';
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white border border-[#EEEEEE] border-l-[3px] shadow-sm hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] rounded-lg p-3 transition-all cursor-pointer hover:-translate-y-0.5"
                          style={{ borderLeftColor: column.accent }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] text-[#6B7280] font-black uppercase tracking-widest bg-[#FAFAFA] border border-[#EEEEEE] px-1.5 py-px rounded">
                              #{item.bookingNumber || item.id.slice(0, 6)}
                            </span>
                            {item.totalAmount ? (
                              <span className="text-xs font-black text-[#1F2A37]">₹{item.totalAmount.toLocaleString()}</span>
                            ) : item.myQuote ? (
                              <span className="text-xs font-black text-[#059669]">₹{item.myQuote.totalAmount.toLocaleString()}</span>
                            ) : (
                              <span className="text-[9px] font-bold text-[#059669] uppercase flex items-center gap-1">
                                <span className="w-1 h-1 bg-[#059669] rounded-full animate-pulse" /> Awaiting
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 border", getVehicleStyle(item.chauffeur_vehicle_categories))}>
                              <Car className="w-3 h-3 opacity-70" />
                            </div>
                            <h4 className="font-bold text-[#1F2A37] text-xs truncate">
                              {item.specificModel || item.vehicleName || VEHICLE_CATEGORIES[item.chauffeur_vehicle_categories] || 'Luxury Fleet'}
                            </h4>
                          </div>

                          <p className="text-[11px] text-[#6B7280] mb-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-[#CCCCCC]" />{item.customerName}
                          </p>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-[#CCCCCC]" />
                              {new Date(item.pickupDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            {item.occasion && (
                              <span className={cn("px-1.5 py-px rounded text-[9px] font-bold uppercase truncate max-w-[80px] border", getKanbanOccasionStyle(item.occasion))}>
                                {item.occasion}
                              </span>
                            )}
                          </div>

                          <Link
                            href={
                              item.type === 'quote_request'
                                ? `/vendor/luxury/send-quote/${item.id}`
                                : isQuoted && item.myQuote
                                ? `/vendor/luxury/quotes/${item.myQuote.id}`
                                : `/vendor/luxury/bookings/${item.id}`
                            }
                            className="flex w-full items-center justify-center gap-1.5 py-1.5 bg-[#FAFAFA] hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-bold text-[#1F2A37] transition-all border border-[#EEEEEE] hover:border-emerald-600"
                          >
                            {item.type === 'quote_request' ? 'Draft Quote' : isQuoted ? 'View Deal' : 'View Details'}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </motion.div>
                      );
                    })}
                    {column.items.length === 0 && (
                      <div className="text-center py-8 text-[#CCCCCC] text-[11px] font-bold border border-dashed border-[#EEEEEE] rounded-lg">
                        No Records
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ═══════ List View (Original Design) ═══════ */}
          {viewMode === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">No items found</h3>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? 'No bookings match your search.' : filter === 'open' ? 'No new quote requests in your area.' : 'No bookings matching this filter.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN_REQUEST;
                  const StatusIcon = statusConfig.icon;
                  const isOpenRequest = item.type === 'quote_request';
                  const isQuoted = item.type === 'quoted';

                  const leftBorderClass = isOpenRequest
                    ? 'border-l-emerald-500'
                    : isQuoted
                    ? 'border-l-emerald-500'
                    : statusConfig.borderColor;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 border-l-[3px] ${leftBorderClass} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                    >
                      {/* Card Header */}
                      <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-2.5">
                          <Crown className={`w-4.5 h-4.5 ${isOpenRequest ? 'text-emerald-500' : isQuoted ? 'text-emerald-500' : 'text-emerald-400'}`} />
                          <span className="font-mono text-base text-gray-600">#{item.bookingNumber}</span>
                          {isOpenRequest && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full font-semibold border border-emerald-200">
                              NEW REQUEST
                            </span>
                          )}
                          {isQuoted && item.myQuote && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full font-medium border border-emerald-200">
                              Quote: ₹{item.myQuote.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.quotesOpenTill && (
                            <span className="text-sm px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {getTimeRemaining(item.quotesOpenTill)}
                            </span>
                          )}
                          {!isOpenRequest && !isQuoted && (
                            <span className={`px-2.5 py-1 rounded-full text-sm font-medium flex items-center gap-1 border ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5">
                        {/* Vehicle & Price */}
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center">
                              <Car className="w-5.5 h-5.5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {item.vehicleName || item.vehicleCategoryName || VEHICLE_CATEGORIES[item.chauffeur_vehicle_categories] || item.chauffeur_vehicle_categories}
                              </h3>
                              <p className="text-base text-gray-400">
                                {TRIP_TYPES[item.tripType] || item.tripType}
                                {item.specificModel && ` • ${item.specificModel}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.totalAmount ? (
                              <p className="text-2xl font-bold text-emerald-600">₹{item.totalAmount.toLocaleString()}</p>
                            ) : item.budgetMax ? (
                              <div>
                                <p className="text-sm text-gray-400">Budget</p>
                                <p className="font-bold text-gray-700 text-lg">₹{item.budgetMin?.toLocaleString() || 0} - ₹{item.budgetMax.toLocaleString()}</p>
                              </div>
                            ) : (
                              <span className="text-base text-gray-400 italic">Quote Required</span>
                            )}
                            {item.occasion && (
                              <span className={`inline-flex items-center gap-1 text-sm px-2.5 py-0.5 rounded-full mt-1 ${getOccasionStyle(item.occasion)}`}>
                                <Heart className="w-3.5 h-3.5" />
                                {item.occasion}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Route</p>
                              <p className="text-base font-medium text-gray-700">{item.pickupCity}{item.dropCity && ` → ${item.dropCity}`}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Calendar className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Pickup</p>
                              <p className="text-base font-medium text-gray-700">
                                {new Date(item.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {item.pickupTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Customer</p>
                              <p className="text-base font-medium text-gray-700">{item.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Clock className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Duration</p>
                              <p className="text-base font-medium text-gray-700">
                                {item.tripHours ? `${item.tripHours} hours` : `${item.tripDays || 1} day(s)`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Tags + Requirements (left) | Action Button (right) */}
                        <div className="flex items-end justify-between gap-4 pt-3 border-t border-gray-100">
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Tags */}
                            {(item.needDecoration || (item.totalQuotesReceived !== null && item.totalQuotesReceived > 0)) && (
                              <div className="flex flex-wrap gap-2">
                                {item.needDecoration && (
                                  <span className="text-sm bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Decoration
                                  </span>
                                )}
                                {item.totalQuotesReceived !== null && item.totalQuotesReceived > 0 && (
                                  <span className="text-sm bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded-full border border-gray-200">
                                    {item.totalQuotesReceived} quote(s)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Requirements */}
                            {item.requirements && (
                              <div className="bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-100">
                                <p className="text-sm text-emerald-600 font-semibold mb-0.5">Requirements</p>
                                <p className="text-base text-gray-700 line-clamp-2">{item.requirements}</p>
                              </div>
                            )}

                            {/* Driver Info */}
                            {item.driverName && (
                              <div className="flex flex-wrap gap-3 text-base text-gray-600">
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">Driver:</span>
                                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-emerald-500" />{item.driverName}</span>
                                {item.driverPhone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-emerald-500" />{item.driverPhone}</span>}
                                {item.vehicleNumber && <span className="flex items-center gap-1.5"><Car className="w-4 h-4 text-emerald-500" />{item.vehicleNumber}</span>}
                              </div>
                            )}

                            {/* Dropped Notice */}
                            {item.status === 'DROPPED' && (
                              <div className="flex items-center gap-1.5 text-base text-red-600">
                                <XCircle className="w-4.5 h-4.5 flex-shrink-0" />
                                <span className="font-semibold">Dropped</span>
                                {(item as any).dropReason && <span className="text-red-400">— {(item as any).dropReason}</span>}
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {isOpenRequest && (
                              <Link
                                href={`/vendor/luxury/send-quote/${item.id}`}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-base font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md hover:shadow-emerald-200/50 flex items-center gap-2 transition-all duration-200"
                              >
                                <Send className="w-4.5 h-4.5" />
                                Send Quote
                              </Link>
                            )}
                            {isQuoted && item.myQuote && (
                              <Link
                                href={`/vendor/luxury/quotes/${item.myQuote.id}`}
                                className="px-5 py-2.5 bg-white text-emerald-600 text-base font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-2 transition-all duration-200"
                              >
                                <Eye className="w-4.5 h-4.5" />
                                View Quote
                              </Link>
                            )}
                            {item.type === 'booking' && ['ADVANCE_PAID', 'CONFIRMED'].includes(item.status) && !item.driverName && (
                              <Link
                                href={`/vendor/luxury/bookings/${item.id}`}
                                className="px-5 py-2.5 bg-white text-emerald-600 text-base font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                              >
                                Assign Driver
                              </Link>
                            )}
                            {item.type === 'booking' && ['DRIVER_ASSIGNED', 'IN_PROGRESS'].includes(item.status) && (
                              <Link
                                href={`/vendor/luxury/bookings/${item.id}`}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white text-base font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-600 hover:shadow-md transition-all duration-200"
                              >
                                Manage Trip
                              </Link>
                            )}
                            {item.type === 'booking' && ['COMPLETED', 'PAYMENT_SUBMITTED', 'PENDING_PAYMENT', 'CANCELLED', 'EXPIRED', 'DROPPED'].includes(item.status) && (
                              <Link
                                href={`/vendor/luxury/bookings/${item.id}`}
                                className="px-5 py-2.5 bg-white text-gray-600 text-base font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all duration-200"
                              >
                                <Eye className="w-4.5 h-4.5" />
                                View Details
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {filteredItems.length > 0 && viewMode === 'list' && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={20}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          background: #FAFAFA;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}} />
    </div>
  );
}
