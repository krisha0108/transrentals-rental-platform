// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, IndianRupee, Star, Loader2,
  CheckCircle, XCircle, Clock, Compass, MessageSquare,
  Percent, AlertCircle, ArrowUpRight, Zap,
} from 'lucide-react';

export default function VendorWanderAnalyticsPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/wander/analytics')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <p className="text-sm text-gray-400 font-medium">Loading analytics...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-500 font-medium">Failed to load analytics</p>
    </div>
  );

  const monthlyData = Object.entries(data.revenue?.monthly || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [y, m] = key.split('-');
      return {
        label: new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        value: val as number,
      };
    });

  const maxRevenue = Math.max(...monthlyData.map(d => d.value), 1);

  return (
    <div className="-mx-6 -mt-6 bg-slate-50 min-h-dvh">

      {/* ── Dark Header ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 overflow-hidden px-8 pt-8 pb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                <BarChart3 className="w-3 h-3" /> Wander Tours
              </span>
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2">Tour Analytics</h1>
            <p className="text-emerald-100/70 text-sm">Performance overview for all your wander listings</p>
          </div>
          <Link
            href="/vendor/wander/listings"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition text-sm font-medium flex-shrink-0 mt-1"
          >
            <Compass className="w-4 h-4" /> View Listings
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue',  value: `₹${Number(data.revenue?.total || 0).toLocaleString('en-IN')}`, icon: IndianRupee, iconBg: 'bg-white/15',  iconColor: 'text-emerald-200',  valColor: 'text-emerald-200' },
            { label: 'Total Bookings', value: data.bookings?.total || 0,                                       icon: CheckCircle, iconBg: 'bg-white/10',      iconColor: 'text-emerald-200',  valColor: 'text-white' },
            { label: 'Conversion',     value: `${data.conversion?.rate || 0}%`,                                icon: Percent,     iconBg: 'bg-teal-500/20',   iconColor: 'text-teal-400',   valColor: 'text-teal-300' },
            { label: 'Avg Rating',     value: data.reviews?.avgRating || '—',                                 icon: Star,        iconBg: 'bg-emerald-500/20',  iconColor: 'text-emerald-400',  valColor: 'text-emerald-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-4 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{m.label}</p>
                <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${m.valColor} leading-none`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-7 space-y-6">

        {/* ── Detailed Stats Grid ── */}
        <div>
          <h2 className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4">Detailed Metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: IndianRupee,
                label: 'Total Revenue',
                value: `₹${Number(data.revenue?.total || 0).toLocaleString('en-IN')}`,
                sub: 'From completed tours',
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valColor: 'text-emerald-700',
                border: 'border-emerald-100', bg: 'bg-white',
              },
              {
                icon: Compass,
                label: 'Active Listings',
                value: data.listings?.active || 0,
                sub: `of ${data.listings?.total || 0} total`,
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valColor: 'text-emerald-700',
                border: 'border-emerald-100', bg: 'bg-white',
              },
              {
                icon: CheckCircle,
                label: 'Completed Tours',
                value: data.bookings?.completed || 0,
                sub: `of ${data.bookings?.total || 0} bookings`,
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', valColor: 'text-emerald-700',
                border: 'border-emerald-100', bg: 'bg-white',
              },
              {
                icon: Star,
                label: 'Average Rating',
                value: data.reviews?.avgRating || '—',
                sub: `${data.reviews?.totalReviews || 0} reviews`,
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valColor: 'text-emerald-700',
                border: 'border-emerald-100', bg: 'bg-white',
              },
              {
                icon: MessageSquare,
                label: 'Pending Quotes',
                value: data.quotes?.pending || 0,
                sub: `${data.quotes?.submitted || 0} submitted`,
                iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valColor: 'text-emerald-700',
                border: 'border-emerald-100', bg: 'bg-white',
              },
              {
                icon: Percent,
                label: 'Conversion Rate',
                value: `${data.conversion?.rate || 0}%`,
                sub: 'Requests → Bookings',
                iconBg: 'bg-teal-100', iconColor: 'text-teal-600', valColor: 'text-teal-700',
                border: 'border-teal-100', bg: 'bg-white',
              },
              {
                icon: XCircle,
                label: 'Cancellation Rate',
                value: `${data.bookings?.cancellationRate || 0}%`,
                sub: 'Of total bookings',
                iconBg: 'bg-red-100', iconColor: 'text-red-500', valColor: 'text-red-600',
                border: 'border-red-100', bg: 'bg-white',
              },
              {
                icon: Clock,
                label: 'Total Bookings',
                value: data.bookings?.total || 0,
                sub: 'All time',
                iconBg: 'bg-slate-100', iconColor: 'text-slate-500', valColor: 'text-slate-700',
                border: 'border-slate-100', bg: 'bg-white',
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${s.valColor} leading-none mb-1`}>{s.value}</p>
                  <p className="text-xs font-bold text-gray-700 leading-tight">{s.label}</p>
                  {s.sub && <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Monthly Revenue
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Revenue from completed bookings</p>
              </div>
              {monthlyData.length > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Latest</p>
                  <p className="font-black text-emerald-700 text-base">₹{monthlyData.at(-1)?.value?.toLocaleString('en-IN') || '0'}</p>
                </div>
              )}
            </div>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-200">
                <BarChart3 className="w-12 h-12 mb-3" />
                <p className="text-sm text-gray-400">No revenue data yet</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-56">
                {monthlyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                    <span className="text-[10px] text-gray-500 font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      ₹{(d.value / 1000).toFixed(1)}k
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg min-h-[4px] transition-all group-hover:from-emerald-500 group-hover:to-teal-400 shadow-sm"
                      style={{ height: `${Math.max((d.value / maxRevenue) * 190, 4)}px` }}
                    />
                    <span className="text-[9px] text-gray-400 leading-none whitespace-nowrap">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-black text-gray-900 text-base flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-emerald-600" /> Conversion Funnel
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Quote Requests', value: data.quotes?.totalRequests || 0, pct: 100,                                                                                                       color: 'from-emerald-500 to-emerald-400',   bg: 'bg-emerald-50' },
                { label: 'Quotes Sent',    value: data.quotes?.submitted || 0,     pct: data.quotes?.totalRequests > 0 ? Math.round((data.quotes.submitted / data.quotes.totalRequests) * 100) : 0, color: 'from-teal-500 to-teal-400',       bg: 'bg-emerald-50' },
                { label: 'Bookings',       value: data.bookings?.total || 0,       pct: data.conversion?.rate || 0,                                                                                color: 'from-emerald-500 to-emerald-400', bg: 'bg-emerald-50' },
                { label: 'Completed',      value: data.bookings?.completed || 0,   pct: data.bookings?.total > 0 ? Math.round((data.bookings.completed / data.bookings.total) * 100) : 0,          color: 'from-teal-500 to-teal-400',       bg: 'bg-teal-50' },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 font-semibold">{row.label}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black text-gray-900">{row.value}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.bg} text-gray-600 min-w-[38px] text-center`}>{row.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(row.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Overall conversion</span>
              <span className="text-xl font-black text-emerald-700">{data.conversion?.rate || 0}%</span>
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'View Listings',  href: '/vendor/wander/listings', icon: Compass,        cls: 'bg-emerald-600 hover:bg-emerald-600' },
            { label: 'Quote Requests', href: '/vendor/wander/quotes',   icon: MessageSquare,  cls: 'bg-emerald-700 hover:bg-emerald-600' },
            { label: 'Bookings',       href: '/vendor/wander/bookings', icon: CheckCircle,    cls: 'bg-teal-700 hover:bg-teal-600' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-5 py-4 rounded-2xl text-white font-semibold text-sm transition shadow-sm ${link.cls}`}
            >
              <div className="flex items-center gap-2.5">
                <link.icon className="w-4 h-4" />
                {link.label}
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-70" />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
