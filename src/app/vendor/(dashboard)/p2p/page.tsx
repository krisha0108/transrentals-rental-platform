'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightLeft,
  Truck,
  Car,
  CalendarCheck,
  Star,
  Plus,
  Send,
  Activity,
  ChevronRight,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  MapPin,
  Eye,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  Users,
  Package,
  Network,
  Handshake,
  Sparkles,
  Repeat,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

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

export default function P2PDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myVehiclePostings, setMyVehiclePostings] = useState<any[]>([]);
  const [myBookingPostings, setMyBookingPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchMyPostings();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/p2p/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch P2P stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPostings = async () => {
    try {
      const res = await fetch('/api/p2p/my-postings?type=all');
      if (res.ok) {
        const data = await res.json();
        setMyVehiclePostings((data.vehiclePostings || []).slice(0, 4));
        setMyBookingPostings((data.bookingPostings || []).slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch my postings:', err);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      ACCEPTED: 'bg-emerald-100 text-emerald-700',
      COMPLETED: 'bg-gray-100 text-gray-600',
      CANCELLED: 'bg-red-100 text-red-700',
      IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
      CONFIRMED: 'bg-emerald-100 text-emerald-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-6 py-4">
          {/* Header */}
          <div className="h-8 bg-gray-200 rounded-xl w-1/3"></div>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-7 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          {/* Section cards */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-20 bg-gray-100 rounded-xl"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                <div className="h-8 bg-gray-100 rounded-lg w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allPostings = [
    ...myVehiclePostings.map((p: any) => ({ ...p, _type: 'vehicle' })),
    ...myBookingPostings.map((p: any) => ({ ...p, _type: 'booking' })),
  ];

  const recentTx = stats?.recentActivity || [];

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
      {/* ============================================================ */}
      {/* HERO HEADER with embedded stats                              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up text-white">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <Network className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  P2P Marketplace
                  <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
                </h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                  Collaborate with vendors — share vehicles & forward bookings
                </p>
              </div>
            </div>
            <Link
              href="/vendor/p2p/activity"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
            >
              <Activity className="h-4 w-4" />
              My Activity
            </Link>
          </div>

          {/* Stats Grid inside header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: DollarSign, label: 'Total Earnings', value: formatPrice(stats?.totalEarnings || 0), tint: 'from-green-400/30 to-emerald-400/20', iconColor: 'text-green-200' },
              { icon: CheckCircle, label: 'Deals Done', value: stats?.completedTransactions || 0, tint: 'from-emerald-400/30 to-teal-400/20', iconColor: 'text-emerald-200' },
              { icon: Zap, label: 'Active Now', value: stats?.activePostings || 0, tint: 'from-emerald-400/30 to-emerald-400/20', iconColor: 'text-emerald-200' },
              { icon: Star, label: 'P2P Rating', value: stats?.averageRating ? stats.averageRating.toFixed(1) : '—', suffix: stats?.totalRatings ? ` (${stats.totalRatings})` : '', tint: 'from-emerald-400/30 to-emerald-400/20', iconColor: 'text-emerald-200' },
            ].map((s, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 80}ms` }}
                className="group relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all animate-fade-up"
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.tint} blur-xl opacity-70 group-hover:scale-150 transition-transform duration-500`} />
                <div className="relative flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg bg-white/15 ring-1 ring-white/20 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight">
                      {s.value}
                      {s.suffix ? <span className="text-xs font-normal text-emerald-100">{s.suffix}</span> : null}
                    </p>
                    <p className="text-[11px] text-emerald-100">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS — 2 primary CTAs + 2 browse cards              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Post Vehicle */}
        <Link href="/vendor/p2p/vehicles/post" className="group animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-5 text-white hover:shadow-2xl hover:shadow-emerald-200 hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm ring-1 ring-white/30 rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-base font-bold mb-0.5">Post Vehicle</p>
              <p className="text-[11px] text-emerald-100 leading-snug">Share your empty truck or car</p>
            </div>
          </div>
        </Link>

        {/* Share Booking */}
        <Link href="/vendor/p2p/bookings/post" className="group animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-5 text-white hover:shadow-2xl hover:shadow-emerald-200 hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm ring-1 ring-white/30 rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <Send className="h-5 w-5" />
              </div>
              <p className="text-base font-bold mb-0.5">Share Booking</p>
              <p className="text-[11px] text-emerald-100 leading-snug">Forward booking to partners</p>
            </div>
          </div>
        </Link>

        {/* Find Vehicles */}
        <Link href="/vendor/p2p/vehicles" className="group animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500" />
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-0.5">Find Vehicles</p>
              <p className="text-[11px] text-gray-500 leading-snug">Browse available vehicles</p>
            </div>
          </div>
        </Link>

        {/* Find Bookings */}
        <Link href="/vendor/p2p/bookings" className="group animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500" />
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <Eye className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-0.5">Find Bookings</p>
              <p className="text-[11px] text-gray-500 leading-snug">Accept & earn commission</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* RECENT ACTIVITY — Full width, richer cards                   */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-emerald-50 to-emerald-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <Link href="/vendor/p2p/activity" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-white/70 transition">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <BarChart3 className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No transactions yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Post a vehicle or share a booking to start your P2P journey
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.slice(0, 5).map((tx: any, idx: number) => {
              const isVehicle = tx.postingType === 'VEHICLE';
              return (
                <div key={tx.id} style={{ animationDelay: `${idx * 60}ms` }} className="px-5 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-transparent transition-all animate-fade-up">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${
                      isVehicle ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      {isVehicle ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{tx.transactionNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ${
                          isVehicle ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        }`}>
                          {isVehicle ? 'Vehicle' : 'Booking'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-gray-700">{tx.fromCity}</span>
                        <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
                        <span className="font-medium text-gray-700">{tx.toCity || '—'}</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="truncate">
                          {tx.vendorA?.businessName || 'Vendor'} ↔ {tx.vendorB?.businessName || 'Vendor'}
                        </span>
                      </div>
                    </div>

                    {/* Amount + Status */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatPrice(tx.agreedAmount)}</p>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-black/5 ${statusBadge(tx.tripStatus)}`}>
                        {tx.tripStatus === 'COMPLETED' && <CheckCircle className="h-2.5 w-2.5" />}
                        {tx.tripStatus === 'IN_PROGRESS' && <Clock className="h-2.5 w-2.5" />}
                        {tx.tripStatus === 'CONFIRMED' && <Clock className="h-2.5 w-2.5" />}
                        {tx.tripStatus?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MY POSTINGS — Full width, compact list                       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Package className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">My Active Postings</h2>
            {allPostings.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-white text-emerald-700 rounded-full font-semibold ring-1 ring-emerald-200">
                {allPostings.length}
              </span>
            )}
          </div>
          <Link href="/vendor/p2p/my-postings" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-white/70 transition">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {allPostings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Truck className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No active postings</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-5">
              Post an empty vehicle or share a booking to get started
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/vendor/p2p/vehicles/post"
                className="group inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-105 transition-all"
              >
                <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
                Post Vehicle
              </Link>
              <Link
                href="/vendor/p2p/bookings/post"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-105 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                Share Booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allPostings.map((post: any, idx: number) => {
              const isVehicle = post._type === 'vehicle';
              const isCar = post.serviceType?.toLowerCase() === 'car';
              return (
                <div key={post.id} style={{ animationDelay: `${idx * 60}ms` }} className="px-5 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-transparent transition-all animate-fade-up">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${
                      isVehicle ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      {isVehicle ? (
                        isCar ? <Car className="h-4 w-4" /> : <Truck className="h-4 w-4" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {isVehicle ? post.vehicleName : (post.vehicleRequired || 'Booking')}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ${
                          isVehicle ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        }`}>
                          {isVehicle ? 'Vehicle' : 'Booking'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-gray-700">{post.fromCity}</span>
                        <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
                        <span className="font-medium text-gray-700">{isVehicle ? post.toCity : (post.toCity || '—')}</span>
                        <span className="text-gray-300 mx-0.5">·</span>
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{formatDate(isVehicle ? post.departureDate : post.tripDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatPrice(isVehicle ? post.priceFullLoad : post.customerBudget)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-black/5 ${statusBadge(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* HOW IT WORKS — compact strip                                 */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-up">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
              <Handshake className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">How P2P Works</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Plus, title: 'Post', desc: 'Share vehicle or booking', gradient: 'from-emerald-500 to-teal-600' },
              { icon: Users, title: 'Connect', desc: 'Get requests from vendors', gradient: 'from-emerald-500 to-emerald-600' },
              { icon: Truck, title: 'Execute', desc: 'Complete the trip', gradient: 'from-emerald-500 to-emerald-600' },
              { icon: DollarSign, title: 'Earn', desc: 'Get paid & rate partner', gradient: 'from-emerald-500 to-emerald-600' },
            ].map((item, i) => (
              <div key={i} style={{ animationDelay: `${i * 80}ms` }} className="group relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all animate-fade-up">
                <div className={`p-2.5 rounded-xl flex-shrink-0 bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
