'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Car,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Shield,
  Fuel,
  BarChart3,
  Activity,
  Award,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  service: string;
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  totalTrips: number;
  avgRating: number;
  totalRatings: number;
  fuelType: string | null;
  insuranceExpired: boolean;
  fitnessExpired: boolean;
}

interface Summary {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  verifiedVehicles: number;
  totalTrips: number;
  avgRating: number;
  expiredInsurance: number;
  expiredFitness: number;
}

export default function FleetAnalyticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalVehicles: 0, activeVehicles: 0, availableVehicles: 0,
    verifiedVehicles: 0, totalTrips: 0, avgRating: 0,
    expiredInsurance: 0, expiredFitness: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/vendor/fleet/analytics');
        const data = await res.json();
        if (res.ok && data.success) {
          setVehicles(data.vehicles || []);
          setSummary(data.summary || {});
          setServiceBreakdown(data.serviceBreakdown || {});
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch {
        setError('Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-100"></div>
          <Loader2 className="w-14 h-14 animate-spin text-emerald-600 absolute inset-0" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const utilizationRate = summary.totalVehicles > 0
    ? Math.round((summary.availableVehicles / summary.totalVehicles) * 100)
    : 0;

  const metricCards = [
    { label: 'Total Fleet', value: summary.totalVehicles, sub: `${summary.activeVehicles} active`, icon: Car, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Available', value: summary.availableVehicles, sub: `${utilizationRate}% utilization`, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', text: 'text-green-600' },
    { label: 'Total Trips', value: summary.totalTrips, sub: 'completed', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Avg Rating', value: summary.avgRating, sub: 'out of 5.0', icon: Star, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
  ];

  const healthRows = [
    { label: 'Verified Vehicles', icon: CheckCircle, value: summary.verifiedVehicles, total: summary.totalVehicles, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Valid Insurance', icon: Shield, value: summary.totalVehicles - summary.expiredInsurance, total: summary.totalVehicles, gradient: 'from-emerald-500 to-cyan-600' },
    { label: 'Valid Fitness', icon: CheckCircle, value: summary.totalVehicles - summary.expiredFitness, total: summary.totalVehicles, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Active Fleet', icon: Car, value: summary.activeVehicles, total: summary.totalVehicles, gradient: 'from-emerald-500 to-emerald-600' },
  ];

  const serviceColors = ['from-emerald-500 to-emerald-600', 'from-emerald-500 to-emerald-600', 'from-emerald-500 to-teal-600', 'from-emerald-500 to-emerald-600', 'from-emerald-500 to-emerald-600', 'from-emerald-500 to-emerald-600'];
  const chartColors = ['#10b981', '#a855f7', '#10b981', '#059669', '#ec4899', '#10b981'];

  // Chart data
  const servicePieData = Object.entries(serviceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const topVehiclesByTrips = [...vehicles]
    .sort((a, b) => b.totalTrips - a.totalTrips)
    .slice(0, 6)
    .map((v) => ({
      name: (v.vehicleName || 'Unknown').length > 14 ? (v.vehicleName || '').slice(0, 14) + '…' : (v.vehicleName || 'Unknown'),
      trips: v.totalTrips,
      rating: v.avgRating,
    }));

  const utilizationData = [{ name: 'Utilization', value: utilizationRate, fill: '#10b981' }];
  const healthScore = summary.totalVehicles > 0
    ? Math.round((((summary.totalVehicles - summary.expiredInsurance) + (summary.totalVehicles - summary.expiredFitness) + summary.verifiedVehicles + summary.activeVehicles) / (summary.totalVehicles * 4)) * 100)
    : 0;
  const healthData = [{ name: 'Health', value: healthScore, fill: '#10b981' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes wiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes grow-x { 0% { width: 0%; } }
        @keyframes pulse-slow { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 1.2s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .animate-grow-x { animation: grow-x 1s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Fleet Analytics</h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">Overview of your fleet performance and health</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {metricCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.text} group-hover:scale-110 origin-left transition-transform`}>{stat.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{stat.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerts */}
        {(summary.expiredInsurance > 0 || summary.expiredFitness > 0) && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50 via-rose-50 to-red-50 animate-gradient-x border border-red-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-fade-up">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-200/40 rounded-full blur-2xl animate-float-slow"></div>
            <div className="relative w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-xl bg-red-300/40 animate-ping"></span>
              <AlertTriangle className="relative w-6 h-6 text-red-600 animate-wiggle" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-red-800">Attention Required</h3>
              <p className="text-red-600 text-sm">
                {summary.expiredInsurance > 0 && `${summary.expiredInsurance} vehicle(s) with expired insurance. `}
                {summary.expiredFitness > 0 && `${summary.expiredFitness} vehicle(s) with expired fitness certificate.`}
              </p>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Service Distribution Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Service Distribution</h2>
                <p className="text-[11px] text-gray-500">Fleet split by service type</p>
              </div>
            </div>
            <div className="p-4">
              {servicePieData.length > 0 ? (
                <div className="relative h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={900}
                      >
                        {servicePieData.map((_, idx) => (
                          <Cell key={idx} fill={chartColors[idx % chartColors.length]} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-bold text-gray-900">{summary.totalVehicles}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Total</p>
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {servicePieData.map((s, idx) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chartColors[idx % chartColors.length] }}></span>
                    <span className="text-gray-700 truncate font-medium">{s.name}</span>
                    <span className="text-gray-400 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Utilization Radial */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Fleet Utilization</h2>
                <p className="text-[11px] text-gray-500">Available vs total fleet</p>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={utilizationData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: '#eef2ff' }} dataKey="value" cornerRadius={20} fill="url(#utilGrad)" animationDuration={900} />
                    <defs>
                      <linearGradient id="utilGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-600 bg-clip-text text-transparent">{utilizationRate}%</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Utilization</p>
                </div>
              </div>
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={healthData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: '#ecfdf5' }} dataKey="value" cornerRadius={20} fill="url(#healthGrad)" animationDuration={900} />
                    <defs>
                      <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-cyan-600 bg-clip-text text-transparent">{healthScore}%</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Health Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Vehicles by Trips */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '160ms' }}>
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">Top Vehicles</h2>
                <p className="text-[11px] text-gray-500">By total trips completed</p>
              </div>
            </div>
            <div className="p-4">
              {topVehiclesByTrips.length > 0 && topVehiclesByTrips.some((v) => v.trips > 0) ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topVehiclesByTrips} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip
                        cursor={{ fill: 'rgba(168,85,247,0.05)' }}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontSize: 12 }}
                      />
                      <Bar dataKey="trips" fill="url(#barGrad)" radius={[0, 8, 8, 0]} animationDuration={900} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                  <Car className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No trip data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-lg text-gray-900">Vehicles by Service</h2>
            </div>
            <div className="p-5">
              {Object.keys(serviceBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(serviceBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([service, count], idx) => {
                      const pct = summary.totalVehicles > 0 ? Math.round((count / summary.totalVehicles) * 100) : 0;
                      const grad = serviceColors[idx % serviceColors.length];
                      return (
                        <div key={service} style={{ animationDelay: `${idx * 100}ms` }} className="animate-fade-up">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-gray-700">{service}</span>
                            <span className="text-sm font-bold text-gray-900">{count} <span className="text-gray-400 font-medium">({pct}%)</span></span>
                          </div>
                          <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${grad} rounded-full animate-grow-x shadow-sm`}
                              style={{ width: `${pct}%` }}
                            >
                              <div className="absolute inset-0 shimmer-bg"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No service data available</p>
              )}
            </div>
          </div>

          {/* Fleet Health */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-lg text-gray-900">Fleet Health</h2>
            </div>
            <div className="p-5 space-y-3">
              {healthRows.map((row, idx) => {
                const Icon = row.icon;
                const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
                return (
                  <div
                    key={row.label}
                    style={{ animationDelay: `${idx * 80}ms` }}
                    className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-200 rounded-xl p-3 transition-all duration-300 hover:shadow-md animate-pop-in overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${row.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{row.label}</span>
                      </div>
                      <span className="font-bold text-sm text-gray-900">{row.value}<span className="text-gray-400 font-medium">/{row.total}</span></span>
                    </div>
                    <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${row.gradient} rounded-full animate-grow-x`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vehicle Performance Table */}
        {vehicles.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Vehicle Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Vehicle</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Service</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Trips</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Rating</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((vehicle, idx) => (
                    <tr
                      key={vehicle.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="hover:bg-emerald-50/30 transition-colors animate-fade-up"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                            <Car className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{vehicle.vehicleName}</p>
                            <p className="text-xs text-gray-500 truncate">{vehicle.registrationNumber || 'No Reg.'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
                          {vehicle.service}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {vehicle.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-[11px] font-semibold border border-green-200/60">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-semibold border border-gray-200">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-600">{vehicle.totalTrips}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                          <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                          <span className="font-bold text-sm text-gray-900">{vehicle.avgRating}</span>
                          <span className="text-[10px] text-gray-500">({vehicle.totalRatings})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {!vehicle.insuranceExpired && !vehicle.fitnessExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-[11px] font-semibold border border-green-200/60">
                            <CheckCircle className="w-3 h-3" /> Good
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-full text-[11px] font-semibold border border-red-200/60">
                            <AlertTriangle className="w-3 h-3 animate-pulse" /> Issues
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
