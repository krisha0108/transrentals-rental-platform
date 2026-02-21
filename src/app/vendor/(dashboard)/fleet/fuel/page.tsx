'use client';

import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Car,
  AlertTriangle,
  Loader2,
  Plus,
  IndianRupee,
  TrendingUp,
  Droplets,
  BarChart3,
  CheckCircle,
  History,
  X,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  fuelType: string | null;
}

interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string | null;
  fuelDate: string;
  fuelType: string | null;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  odometerReading: number | null;
  fuelStation: string | null;
  paymentMode: string | null;
  notes: string | null;
}

interface Summary {
  totalSpent: number;
  totalLiters: number;
  avgPerLiter: number;
  recordsCount: number;
}

const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Other'];
const paymentModes = ['Cash', 'UPI', 'Card', 'Fleet Card', 'Credit', 'Other'];

export default function FleetFuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSpent: 0, totalLiters: 0, avgPerLiter: 0, recordsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('records');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendorFleetId: '', fuelDate: new Date().toISOString().split('T')[0], fuelType: '',
    quantity: '', pricePerUnit: '', totalCost: '', odometerReading: '',
    fuelStation: '', paymentMode: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/vendor/fleet/fuel');
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicles(data.vehicles || []);
        setRecords(data.fuelRecords || []);
        setSummary(data.summary || { totalSpent: 0, totalLiters: 0, avgPerLiter: 0, recordsCount: 0 });
      } else {
        setError(data.error || 'Failed to fetch fuel data');
      }
    } catch {
      setError('Failed to fetch fuel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-calculate total cost
  const qty = parseFloat(form.quantity) || 0;
  const ppu = parseFloat(form.pricePerUnit) || 0;
  const calculatedTotal = qty * ppu;

  const handleSubmit = async () => {
    if (!form.vendorFleetId || !form.fuelDate || !form.quantity || !form.pricePerUnit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/fleet/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalCost: form.totalCost || calculatedTotal.toString() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setForm({
          vendorFleetId: '', fuelDate: new Date().toISOString().split('T')[0], fuelType: '',
          quantity: '', pricePerUnit: '', totalCost: '', odometerReading: '',
          fuelStation: '', paymentMode: '', notes: '',
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

  // Auto-fill fuel type from selected vehicle
  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setForm({ ...form, vendorFleetId: vehicleId, fuelType: vehicle?.fuelType || form.fuelType });
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
          <h1 className="text-2xl font-bold text-gray-900">Fuel Tracking</h1>
          <p className="text-gray-600">Track fuel consumption and expenses for your fleet</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Fuel Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1"><IndianRupee className="w-4 h-4" /><span className="text-sm">Total Spent</span></div>
          <p className="text-2xl font-bold text-orange-600">{summary.totalSpent > 0 ? `₹${summary.totalSpent.toLocaleString()}` : '₹0'}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1"><Droplets className="w-4 h-4" /><span className="text-sm">Total Liters</span></div>
          <p className="text-2xl font-bold text-blue-600">{summary.totalLiters} L</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-sm">Avg ₹/Liter</span></div>
          <p className="text-2xl font-bold text-green-600">{summary.avgPerLiter > 0 ? `₹${summary.avgPerLiter.toFixed(1)}` : '₹0'}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-sm">Total Records</span></div>
          <p className="text-2xl font-bold text-gray-900">{summary.recordsCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[{ id: 'records', label: 'Fuel Records', icon: History }, { id: 'vehicles', label: 'Vehicles', icon: Car }].map((tab) => (
          <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${selectedTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === 'records' && records.length > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${selectedTab === tab.id ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>{records.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Records Tab */}
      {selectedTab === 'records' && (
        records.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Fuel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fuel Records</h3>
            <p className="text-gray-500">Click &quot;Add Fuel Entry&quot; to log your first fill-up.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fuel</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Qty (L)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">₹/L</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">KM</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Station</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{new Date(r.fuelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.vehicleName}</p>
                        <p className="text-sm text-gray-500">{r.registrationNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.fuelType || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">₹{r.pricePerUnit}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">₹{r.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{r.odometerReading ? `${r.odometerReading.toLocaleString()} km` : '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.fuelStation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
            <p className="text-gray-500">Add vehicles to track their fuel consumption.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const vehicleRecords = records.filter((r) => r.vehicleId === v.id);
              const vehicleSpent = vehicleRecords.reduce((sum, r) => sum + r.totalCost, 0);
              return (
                <div key={v.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Fuel className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{v.vehicleName}</h3>
                        <p className="text-sm text-gray-500">{v.registrationNumber || 'No Reg.'} &bull; {v.fuelType || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{vehicleSpent > 0 ? `₹${vehicleSpent.toLocaleString()}` : '₹0'}</p>
                      <p className="text-sm text-gray-500">{vehicleRecords.length} record(s)</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Fuel Entry</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select value={form.vendorFleetId} onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.fuelDate} onChange={(e) => setForm({ ...form, fuelDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select type</option>
                    {fuelTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (L) *</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">₹/Liter *</label>
                  <input type="number" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total (₹)</label>
                  <input type="number" step="0.01" value={form.totalCost || (calculatedTotal > 0 ? calculatedTotal.toFixed(2) : '')}
                    onChange={(e) => setForm({ ...form, totalCost: e.target.value })} placeholder="Auto"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (KM)</label>
                  <input type="number" value={form.odometerReading} onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select mode</option>
                    {paymentModes.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Station</label>
                <input type="text" value={form.fuelStation} onChange={(e) => setForm({ ...form, fuelStation: e.target.value })} placeholder="Station name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.vendorFleetId || !form.quantity || !form.pricePerUnit}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
