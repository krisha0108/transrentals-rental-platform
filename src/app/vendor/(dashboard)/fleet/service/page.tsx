'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Car,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  IndianRupee,
  History,
  X,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  service: string;
  lastServiceDate: string | null;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string | null;
  serviceType: string;
  description: string | null;
  serviceDate: string;
  odometerReading: number | null;
  cost: number;
  serviceProvider: string | null;
  notes: string | null;
}

const serviceTypes = [
  'Oil Change', 'Air Filter', 'Brake Pads', 'Tyre Rotation', 'Tyre Replacement',
  'Coolant Change', 'Transmission Fluid', 'Battery Replacement', 'AC Service',
  'Full Service', 'Wheel Alignment', 'Clutch Repair', 'Engine Repair', 'Body Work', 'Other',
];

export default function FleetServicePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [summary, setSummary] = useState({ totalVehicles: 0, totalRecords: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('vehicles');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', serviceType: '', description: '', serviceDate: new Date().toISOString().split('T')[0],
    odometerReading: '', cost: '', serviceProvider: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/vendor/fleet/service');
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicles(data.vehicles || []);
        setRecords(data.maintenanceRecords || []);
        setSummary(data.summary || { totalVehicles: 0, totalRecords: 0, totalSpent: 0 });
      } else {
        setError(data.error || 'Failed to fetch');
      }
    } catch {
      setError('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.vendorFleetId || !form.serviceType || !form.serviceDate || !form.cost) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/fleet/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setForm({
          vendorFleetId: '', serviceType: '', description: '', serviceDate: new Date().toISOString().split('T')[0],
          odometerReading: '', cost: '', serviceProvider: '', notes: '',
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
    { label: 'Total Vehicles', value: summary.totalVehicles, icon: Car, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Service Records', value: summary.totalRecords, icon: Wrench, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Total Spent', value: summary.totalSpent > 0 ? `₹${summary.totalSpent.toLocaleString()}` : '₹0', icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <Wrench className="w-7 h-7 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Service & Maintenance</h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base">Track vehicle services and maintenance schedules</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> Record Service
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => {
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
          {[{ id: 'vehicles', label: 'Vehicles', icon: Car }, { id: 'history', label: 'History', icon: History }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all duration-300 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.id === 'history' && records.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedTab === tab.id ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{records.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Vehicles Tab */}
        {selectedTab === 'vehicles' && (
          vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
                <Car className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
              <p className="text-gray-500">Add vehicles to track their maintenance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v, idx) => (
                <div
                  key={v.id}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-pop-in"
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500"></div>
                  <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">{v.vehicleName}</h3>
                          <p className="text-xs text-gray-500">{v.registrationNumber || 'No Reg.'} &bull; {v.service}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-[11px] font-semibold border border-green-200/60">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        OK
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 mt-3 border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Last Service</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          records.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
                <History className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records</h3>
              <p className="text-gray-500">Click &quot;Record Service&quot; to add your first entry.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Vehicle</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Service Type</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">KM</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Cost</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Provider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((r, idx) => (
                      <tr
                        key={r.id}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="hover:bg-emerald-50/30 transition-colors animate-fade-up"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{new Date(r.serviceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm text-gray-900">{r.vehicleName}</p>
                          <p className="text-xs text-gray-500">{r.registrationNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
                            <Wrench className="w-3 h-3" /> {r.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.odometerReading ? `${r.odometerReading.toLocaleString()} km` : '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">₹{r.cost.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{r.serviceProvider || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl animate-pop-in">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Record Service</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Vehicle *</label>
                    <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Service Type *</label>
                    <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select type</option>
                      {serviceTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Date *</label>
                    <input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Cost (₹) *</label>
                    <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Odometer (KM)</label>
                    <input type="number" value={form.odometerReading} onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Service Provider</label>
                    <input type="text" value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} placeholder="Workshop / Mechanic name"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional details..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex gap-3 sticky bottom-0">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !form.vendorFleetId || !form.serviceType || !form.cost}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
