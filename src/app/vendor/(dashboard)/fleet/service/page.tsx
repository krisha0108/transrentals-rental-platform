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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service & Maintenance</h1>
          <p className="text-gray-600">Track vehicle services and maintenance schedules</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" /> Record Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1"><Car className="w-4 h-4" /><span className="text-sm">Total Vehicles</span></div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalVehicles}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1"><Wrench className="w-4 h-4" /><span className="text-sm">Service Records</span></div>
          <p className="text-2xl font-bold text-blue-600">{summary.totalRecords}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><IndianRupee className="w-4 h-4" /><span className="text-sm">Total Spent</span></div>
          <p className="text-2xl font-bold text-green-600">{summary.totalSpent > 0 ? `₹${summary.totalSpent.toLocaleString()}` : '₹0'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[{ id: 'vehicles', label: 'Vehicles', icon: Car }, { id: 'history', label: 'History', icon: History }].map((tab) => (
          <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${selectedTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === 'history' && records.length > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${selectedTab === tab.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>{records.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
            <p className="text-gray-500">Add vehicles to track their maintenance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{v.vehicleName}</h3>
                    <p className="text-sm text-gray-500">{v.registrationNumber || 'No Reg.'} &bull; {v.service}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">OK</span>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500">Last Service</p>
                  <p className="font-medium text-gray-900">
                    {v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* History Tab */}
      {selectedTab === 'history' && (
        records.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records</h3>
            <p className="text-gray-500">Click &quot;Record Service&quot; to add your first entry.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">KM</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{new Date(r.serviceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.vehicleName}</p>
                        <p className="text-sm text-gray-500">{r.registrationNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.serviceType}</td>
                      <td className="px-4 py-3 text-gray-700">{r.odometerReading ? `${r.odometerReading.toLocaleString()} km` : '-'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">₹{r.cost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{r.serviceProvider || '-'}</td>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Record Service</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                  <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select type</option>
                    {serviceTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹) *</label>
                  <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (KM)</label>
                  <input type="number" value={form.odometerReading} onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
                <input type="text" value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} placeholder="Workshop / Mechanic name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional details..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.vendorFleetId || !form.serviceType || !form.cost}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
