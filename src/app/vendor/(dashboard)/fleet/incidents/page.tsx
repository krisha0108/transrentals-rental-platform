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

  const severityColor = (s: string) => {
    switch (s) {
      case 'MINOR': return 'bg-green-100 text-green-700';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700';
      case 'MAJOR': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">Track vehicle incidents, accidents & insurance claims</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" /> Report Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1"><AlertTriangle className="w-4 h-4" /><span className="text-sm">Total Incidents</span></div>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1"><Clock className="w-4 h-4" /><span className="text-sm">Open</span></div>
          <p className="text-2xl font-bold text-yellow-600">{summary.open}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-sm">Resolved</span></div>
          <p className="text-2xl font-bold text-green-600">{summary.resolved}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1"><IndianRupee className="w-4 h-4" /><span className="text-sm">Total Cost</span></div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalCost > 0 ? `₹${summary.totalCost.toLocaleString()}` : '₹0'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[{ id: 'incidents', label: 'All Incidents', icon: AlertTriangle }, { id: 'vehicles', label: 'Vehicles', icon: Car }].map((tab) => (
          <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${selectedTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Incidents Tab */}
      {selectedTab === 'incidents' && (
        incidents.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Reported</h3>
            <p className="text-gray-500">Your fleet has a clean record. Click &quot;Report Incident&quot; to log one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{inc.incidentType}</h3>
                    <p className="text-sm text-gray-500">{inc.vehicleName} &bull; {inc.registrationNumber || 'No Reg.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${severityColor(inc.severity)}`}>{inc.severity}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColor(inc.status)}`}>{inc.status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{inc.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{new Date(inc.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {inc.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.location}</span>}
                  {inc.estimatedCost != null && inc.estimatedCost > 0 && <span>₹{inc.estimatedCost.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
            <p className="text-gray-500">Add vehicles to track their incidents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const vehicleIncidents = incidents.filter((i) => i.vehicleId === v.id);
              const openCount = vehicleIncidents.filter((i) => i.status === 'OPEN').length;
              return (
                <div key={v.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{v.vehicleName}</h3>
                      <p className="text-sm text-gray-500">{v.registrationNumber || 'No Reg.'}</p>
                    </div>
                    {openCount > 0 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">{openCount} Open</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Clear</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{vehicleIncidents.length} incident(s) total</p>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Report Incident</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
                  <select value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="">Select type</option>
                    {incidentTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    {severityLevels.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
                  <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where did it happen?"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.vendorFleetId || !form.incidentType || !form.description}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Report Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
