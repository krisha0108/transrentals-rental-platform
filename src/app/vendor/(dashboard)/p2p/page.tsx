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
      ACCEPTED: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-gray-100 text-gray-600',
      CANCELLED: 'bg-red-100 text-red-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-amber-100 text-amber-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const allPostings = [
    ...myVehiclePostings.map((p: any) => ({ ...p, _type: 'vehicle' })),
    ...myBookingPostings.map((p: any) => ({ ...p, _type: 'booking' })),
  ];

  const recentTx = stats?.recentActivity || [];

  return (
    <div className="space-y-5">
      {/* ============================================================ */}
      {/* HERO HEADER with embedded stats                              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl p-6 pb-5 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold">P2P Marketplace</h1>
              </div>
              <p className="text-blue-200 text-sm ml-11">
                Collaborate with vendors — share vehicles & forward bookings
              </p>
            </div>
            <Link
              href="/vendor/p2p/activity"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg text-sm font-medium transition"
            >
              <Activity className="h-4 w-4" />
              My Activity
            </Link>
          </div>

          {/* Stats Grid inside header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-400/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-300" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{formatPrice(stats?.totalEarnings || 0)}</p>
                  <p className="text-[11px] text-blue-200">Total Earnings</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-400/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{stats?.completedTransactions || 0}</p>
                  <p className="text-[11px] text-blue-200">Deals Done</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/20 rounded-lg">
                  <Zap className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{stats?.activePostings || 0}</p>
                  <p className="text-[11px] text-blue-200">Active Now</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-yellow-400/20 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-300" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">
                    {stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
                    {stats?.totalRatings ? (
                      <span className="text-xs font-normal text-blue-200"> ({stats.totalRatings})</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-blue-200">P2P Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS — 2 primary CTAs + 2 browse cards              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Post Vehicle */}
        <Link href="/vendor/p2p/vehicles/post" className="group">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-xl p-4 text-white hover:shadow-lg hover:shadow-emerald-200 transition-all h-full">
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold mb-0.5">Post Vehicle</p>
              <p className="text-[11px] text-emerald-100 leading-snug">Share your empty truck or car</p>
            </div>
          </div>
        </Link>

        {/* Share Booking */}
        <Link href="/vendor/p2p/bookings/post" className="group">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-xl p-4 text-white hover:shadow-lg hover:shadow-purple-200 transition-all h-full">
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Send className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-bold mb-0.5">Share Booking</p>
              <p className="text-[11px] text-purple-100 leading-snug">Forward booking to partners</p>
            </div>
          </div>
        </Link>

        {/* Find Vehicles */}
        <Link href="/vendor/p2p/vehicles" className="group">
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all h-full">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
              <Search className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-0.5">Find Vehicles</p>
            <p className="text-[11px] text-gray-400 leading-snug">Browse available vehicles</p>
          </div>
        </Link>

        {/* Find Bookings */}
        <Link href="/vendor/p2p/bookings" className="group">
          <div className="relative bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all h-full">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
              <Eye className="h-4.5 w-4.5 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-0.5">Find Bookings</p>
            <p className="text-[11px] text-gray-400 leading-snug">Accept & earn commission</p>
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* RECENT ACTIVITY — Full width, richer cards                   */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Activity className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <Link href="/vendor/p2p/activity" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No transactions yet</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Post a vehicle or share a booking to start your P2P journey
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.slice(0, 5).map((tx: any) => {
              const isVehicle = tx.postingType === 'VEHICLE';
              return (
                <div key={tx.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isVehicle ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                      {isVehicle ? (
                        <Truck className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CalendarCheck className="h-4 w-4 text-purple-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{tx.transactionNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isVehicle ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
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
                      <p className="text-sm font-bold text-gray-900">{formatPrice(tx.agreedAmount)}</p>
                      <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusBadge(tx.tripStatus)}`}>
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-md">
              <Package className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">My Active Postings</h2>
            {allPostings.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                {allPostings.length}
              </span>
            )}
          </div>
          <Link href="/vendor/p2p/my-postings" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {allPostings.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No active postings</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
              Post an empty vehicle or share a booking to get started
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/vendor/p2p/vehicles/post"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Post Vehicle
              </Link>
              <Link
                href="/vendor/p2p/bookings/post"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                <Send className="h-3.5 w-3.5" />
                Share Booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allPostings.map((post: any) => {
              const isVehicle = post._type === 'vehicle';
              const isCar = post.serviceType?.toLowerCase() === 'car';
              return (
                <div key={post.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isVehicle ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                      {isVehicle ? (
                        isCar ? <Car className="h-4 w-4 text-blue-600" /> : <Truck className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CalendarCheck className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {isVehicle ? post.vehicleName : (post.vehicleRequired || 'Booking')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isVehicle ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {isVehicle ? 'Vehicle' : 'Booking'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{post.fromCity}</span>
                        <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
                        <span>{isVehicle ? post.toCity : (post.toCity || '—')}</span>
                        <span className="text-gray-300 mx-0.5">·</span>
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{formatDate(isVehicle ? post.departureDate : post.tripDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-green-600">
                        {formatPrice(isVehicle ? post.priceFullLoad : post.customerBudget)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusBadge(post.status)}`}>
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
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">How P2P Works</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Plus, title: 'Post', desc: 'Share vehicle or booking', color: 'text-emerald-600 bg-emerald-100' },
            { icon: Users, title: 'Connect', desc: 'Get requests from vendors', color: 'text-blue-600 bg-blue-100' },
            { icon: Truck, title: 'Execute', desc: 'Complete the trip', color: 'text-purple-600 bg-purple-100' },
            { icon: DollarSign, title: 'Earn', desc: 'Get paid & rate partner', color: 'text-amber-600 bg-amber-100' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg flex-shrink-0 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{item.title}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
