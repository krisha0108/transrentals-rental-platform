// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, IndianRupee, Star, Loader2,
  ArrowLeft, CheckCircle, XCircle, Clock, Compass, MessageSquare,
  Percent, AlertCircle,
} from 'lucide-react';

export default function VendorWanderAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/wander/analytics')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
    </div>
  );

  if (!data) return (
    <div className="p-6 text-center py-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-gray-500">Failed to load analytics</p>
    </div>
  );

  const monthlyData = Object.entries(data.revenue?.monthly || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [y, m] = key.split('-');
      return { label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), value: val as number };
    });

  const maxRevenue = Math.max(...monthlyData.map(d => d.value), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tour Analytics</h1>
            <p className="text-xs text-gray-500">Your wander tour performance overview</p>
          </div>
        </div>
        <Link href="/vendor/wander" className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${Number(data.revenue?.total || 0).toLocaleString('en-IN')}`} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Compass} label="Active Listings" value={`${data.listings?.active || 0}/${data.listings?.total || 0}`} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={CheckCircle} label="Completed Tours" value={data.bookings?.completed || 0} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Star} label="Avg Rating" value={data.reviews?.avgRating || '—'} sub={`${data.reviews?.totalReviews || 0} reviews`} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Monthly Revenue
          </h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No revenue data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-medium">
                    ₹{(d.value / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg min-h-[4px] transition-all"
                    style={{ height: `${(d.value / maxRevenue) * 100}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Conversion Funnel
          </h3>
          <div className="space-y-3">
            <FunnelRow label="Quote Requests" value={data.quotes?.totalRequests || 0} pct={100} color="bg-indigo-500" />
            <FunnelRow label="Quotes Submitted" value={data.quotes?.submitted || 0} pct={data.quotes?.totalRequests > 0 ? Math.round((data.quotes.submitted / data.quotes.totalRequests) * 100) : 0} color="bg-blue-500" />
            <FunnelRow label="Bookings" value={data.bookings?.total || 0} pct={data.conversion?.rate || 0} color="bg-emerald-500" />
            <FunnelRow label="Completed" value={data.bookings?.completed || 0} pct={data.bookings?.total > 0 ? Math.round((data.bookings.completed / data.bookings.total) * 100) : 0} color="bg-green-500" />
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Pending Quotes" value={data.quotes?.pending || 0} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Percent} label="Conversion Rate" value={`${data.conversion?.rate || 0}%`} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={XCircle} label="Cancellation Rate" value={`${data.bookings?.cancellationRate || 0}%`} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={Clock} label="Total Bookings" value={data.bookings?.total || 0} color="text-gray-600" bg="bg-gray-50" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-100`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FunnelRow({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs text-gray-500">{value} <span className="text-gray-300">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}
