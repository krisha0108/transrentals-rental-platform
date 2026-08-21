'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Car,
  Loader2,
  Plus,
  Shield,
  CheckCircle,
  Clock,
  IndianRupee,
  X,
  History,
  MapPin,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
}

interface Incident {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string | null;
  incidentDate: string;
  incidentType: string;
  severity: string;
  location: string | null;
  description: string;
  estimatedCost: number | null;
  insuranceClaimed: boolean;
  status: string;
  notes: string | null;
}

interface Summary {
  total: number;
  open: number;
  resolved: number;
  totalCost: number;
}

const incidentTypes = [
  'Accident', 'Breakdown', 'Flat Tyre', 'Engine Failure', 'Electrical Issue',
  'Theft', 'Vandalism', 'Weather Damage', 'Road Damage', 'Other',
];

const severityLevels = ['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'];

export default function FleetIncidentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, open: 0, resolved: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('incidents');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', incidentType: '', severity: 'MINOR', incidentDate: new Date().toISOString().split('T')[0],
    location: '', description: '', estimatedCost: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/vendor/fleet/incidents');
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicles(data.vehicles || []);
        setIncidents(data.incidents || []);
        setSummary(data.summary || { total: 0, open: 0, resolved: 0, totalCost: 0 });
      } else {
        setError(data.error || 'Failed to fetch incidents');
      }
    } catch {
      setError('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.vendorFleetId || !form.incidentType || !form.incidentDate || !form.description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/fleet/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setForm({
          vendorFleetId: '', incidentType: '', severity: 'MINOR', incidentDate: new Date().toISOString().split('T')[0],
          location: '', description: '', estimatedCost: '', notes: '',
        });
        setLoading(true);
        fetchData();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const severityTheme = (s: string) => {
    switch (s) {
      case 'MINOR': return { badge: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200/60', grad: 'from-emerald-500 to-emerald-600' };
      case 'MODERATE': return { badge: 'bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-700 border-emerald-200/60', grad: 'from-emerald-500 to-emerald-600' };
      case 'MAJOR': return { badge: 'bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-700 border-emerald-200/60', grad: 'from-emerald-500 to-emerald-600' };
      case 'CRITICAL': return { badge: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200/60', grad: 'from-red-500 to-rose-600' };
      default: return { badge: 'bg-gray-100 text-gray-700 border-gray-200', grad: 'from-gray-400 to-slate-500' };
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-700 border-emerald-200/60';
      case 'RESOLVED': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200/60';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100"><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="h-8 bg-gray-100 rounded w-1/3"></div></div>)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-2/3"></div><div className="h-3 bg-gray-100 rounded w-1/3"></div></div></div><div className="h-3 bg-gray-100 rounded w-full"></div><div className="flex gap-2"><div className="h-8 bg-gray-100 rounded-lg flex-1"></div><div className="h-8 bg-gray-100 rounded-lg w-24"></div></div></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Incidents', value: summary.total, icon: AlertTriangle, gradient: 'from-slate-500 to-gray-700', text: 'text-gray-800' },
    { label: 'Open', value: summary.open, icon: Clock, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Resolved', value: summary.resolved, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', text: 'text-green-600' },
    { label: 'Total Cost', value: summary.totalCost > 0 ? `₹${summary.totalCost.toLocaleString()}` : '₹0', icon: IndianRupee, gradient: 'from-red-500 to-rose-600', text: 'text-red-600' },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes wiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 1.2s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <span className="absolute inset-0 rounded-2xl bg-white/20 animate-ping"></span>
                <AlertTriangle className="relative w-7 h-7 text-white animate-wiggle" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Incidents</h1>
                <p className="text-red-100 mt-1 text-sm sm:text-base">Track vehicle incidents, accidents & insurance claims</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> Report Incident
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.text} group-hover:scale-110 origin-left transition-transform`}>{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm inline-flex gap-1">
          {[{ id: 'incidents', label: 'All Incidents', icon: AlertTriangle }, { id: 'vehicles', label: 'Vehicles', icon: Car }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all duration-300 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Incidents Tab */}
        {selectedTab === 'incidents' && (
          incidents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Shield className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Reported</h3>
              <p className="text-gray-500">Your fleet has a clean record. Click &quot;Report Incident&quot; to log one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc, idx) => {
                const sev = severityTheme(inc.severity);
                return (
                  <div
                    key={inc.id}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-red-200 transition-all duration-300 overflow-hidden animate-fade-up"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${sev.grad}`}></div>
                    <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative pl-2">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sev.grad} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0`}>
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{inc.incidentType}</h3>
                            <p className="text-xs text-gray-500 truncate">{inc.vehicleName} &bull; {inc.registrationNumber || 'No Reg.'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${sev.badge}`}>{inc.severity}</span>
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusColor(inc.status)}`}>{inc.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 font-medium">
                          <Clock className="w-3 h-3" />
                          {new Date(inc.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {inc.location && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-medium">
                            <MapPin className="w-3 h-3" />{inc.location}
                          </span>
                        )}
                        {inc.estimatedCost != null && inc.estimatedCost > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100 font-bold">
                            <IndianRupee className="w-3 h-3" />{inc.estimatedCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Vehicles Tab */}
        {selectedTab === 'vehicles' && (
          vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
                <Car className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
              <p className="text-gray-500">Add vehicles to track their incidents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v, idx) => {
                const vehicleIncidents = incidents.filter((i) => i.vehicleId === v.id);
                const openCount = vehicleIncidents.filter((i) => i.status === 'OPEN').length;
                const isClear = openCount === 0;
                return (
                  <div
                    key={v.id}
                    style={{ animationDelay: `${idx * 70}ms` }}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-200 transition-all duration-300 overflow-hidden animate-pop-in"
                  >
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${isClear ? 'from-emerald-500 to-emerald-600' : 'from-emerald-500 to-emerald-600'} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                    <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isClear ? 'from-emerald-500 to-emerald-600' : 'from-emerald-500 to-emerald-600'} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0`}>
                            <Car className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{v.vehicleName}</h3>
                            <p className="text-xs text-gray-500 truncate">{v.registrationNumber || 'No Reg.'}</p>
                          </div>
                        </div>
                        {openCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-700 rounded-full text-[11px] font-semibold border border-emerald-200/60 shrink-0">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            {openCount} Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-[11px] font-semibold border border-green-200/60 shrink-0">
                            <CheckCircle className="w-3 h-3" /> Clear
                          </span>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 mt-3 border border-gray-100 flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs text-gray-600 font-medium">{vehicleIncidents.length} incident(s) total</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl animate-pop-in">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50/40 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Report Incident</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Vehicle *</label>
                    <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Incident Type *</label>
                    <select value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select type</option>
                      {incidentTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Severity</label>
                    <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm">
                      {severityLevels.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Date *</label>
                    <input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Estimated Cost (₹)</label>
                    <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Location</label>
                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where did it happen?"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-red-50 to-rose-50/40 flex gap-3 sticky bottom-0">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !form.vendorFleetId || !form.incidentType || !form.description}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? 'Saving...' : 'Report Incident'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
