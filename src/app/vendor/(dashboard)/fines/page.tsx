'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Car,
  User,
  Calendar,
  IndianRupee,
  MapPin,
  Camera,
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  CreditCard,
  AlertCircle,
  TrendingUp,
  MoreVertical
} from 'lucide-react';

interface Fine {
  id: string;
  challanNumber: string;
  vehicle: {
    name: string;
    number: string;
  };
  driver: string;
  violationType: 'speeding' | 'signal_jump' | 'wrong_parking' | 'no_helmet' | 'drunk_driving' | 'document_missing' | 'overloading' | 'lane_violation' | 'other';
  violationDate: string;
  violationTime: string;
  location: string;
  fineAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'disputed' | 'waived' | 'overdue';
  paidAmount?: number;
  paidDate?: string;
  paymentMode?: string;
  evidenceImage?: string;
  issuedBy: string;
  remarks?: string;
  recoveredFromDriver: boolean;
}

// Mock fines data
const mockFines: Fine[] = [
  {
    id: 'F001',
    challanNumber: 'KA-BTP-2024-001234',
    vehicle: { name: 'Toyota Innova', number: 'KA-01-AB-1234' },
    driver: 'Ramesh Kumar',
    violationType: 'speeding',
    violationDate: '2024-01-18',
    violationTime: '14:30',
    location: 'Outer Ring Road, near Marathahalli',
    fineAmount: 1000,
    dueDate: '2024-02-18',
    status: 'pending',
    issuedBy: 'Traffic Police',
    remarks: 'Driving at 85 km/h in 60 km/h zone',
    recoveredFromDriver: false
  },
  {
    id: 'F002',
    challanNumber: 'KA-BTP-2024-001156',
    vehicle: { name: 'Maruti Swift', number: 'KA-01-CD-5678' },
    driver: 'Suresh Babu',
    violationType: 'wrong_parking',
    violationDate: '2024-01-15',
    violationTime: '11:45',
    location: 'MG Road, Near Trinity Circle',
    fineAmount: 500,
    dueDate: '2024-02-15',
    status: 'paid',
    paidAmount: 500,
    paidDate: '2024-01-16',
    paymentMode: 'Online',
    issuedBy: 'Traffic Police',
    recoveredFromDriver: true
  },
  {
    id: 'F003',
    challanNumber: 'KA-BTP-2024-001089',
    vehicle: { name: 'Honda City', number: 'KA-01-EF-9012' },
    driver: 'Prakash Raj',
    violationType: 'signal_jump',
    violationDate: '2024-01-12',
    violationTime: '09:15',
    location: 'Silk Board Junction',
    fineAmount: 2000,
    dueDate: '2024-01-27',
    status: 'overdue',
    issuedBy: 'Traffic Police',
    remarks: 'Red light violation captured on camera',
    recoveredFromDriver: false
  },
  {
    id: 'F004',
    challanNumber: 'KA-BTP-2024-000945',
    vehicle: { name: 'Mahindra XUV500', number: 'KA-01-GH-3456' },
    driver: 'Arun Nair',
    violationType: 'document_missing',
    violationDate: '2024-01-10',
    violationTime: '16:20',
    location: 'Electronic City Flyover',
    fineAmount: 5000,
    dueDate: '2024-02-10',
    status: 'disputed',
    issuedBy: 'Traffic Police',
    remarks: 'Documents were present but not shown. Disputing with proof.',
    recoveredFromDriver: false
  },
  {
    id: 'F005',
    challanNumber: 'KA-BTP-2024-000812',
    vehicle: { name: 'Toyota Fortuner', number: 'KA-01-IJ-7890' },
    driver: 'Vijay Shetty',
    violationType: 'lane_violation',
    violationDate: '2024-01-08',
    violationTime: '08:00',
    location: 'NICE Road Toll',
    fineAmount: 500,
    dueDate: '2024-02-08',
    status: 'waived',
    issuedBy: 'Traffic Police',
    remarks: 'Waived due to emergency situation (medical)',
    recoveredFromDriver: false
  }
];

const violationTypes = {
  speeding: { label: 'Speeding', color: 'bg-red-100 text-red-700' },
  signal_jump: { label: 'Signal Jumping', color: 'bg-orange-100 text-orange-700' },
  wrong_parking: { label: 'Wrong Parking', color: 'bg-yellow-100 text-yellow-700' },
  no_helmet: { label: 'No Helmet', color: 'bg-purple-100 text-purple-700' },
  drunk_driving: { label: 'Drunk Driving', color: 'bg-red-100 text-red-700' },
  document_missing: { label: 'Missing Documents', color: 'bg-blue-100 text-blue-700' },
  overloading: { label: 'Overloading', color: 'bg-cyan-100 text-cyan-700' },
  lane_violation: { label: 'Lane Violation', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' }
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  waived: { label: 'Waived', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

export default function FinesPage() {
  const [fines] = useState<Fine[]>(mockFines);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredFines = fines.filter(fine => {
    const matchesSearch = fine.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.vehicle.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.driver.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fine.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: fines.length,
    pending: fines.filter(f => f.status === 'pending').length,
    overdue: fines.filter(f => f.status === 'overdue').length,
    totalAmount: fines.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.fineAmount, 0),
    paidAmount: fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    recoveredFromDrivers: fines.filter(f => f.recoveredFromDriver).reduce((sum, f) => sum + (f.paidAmount || 0), 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fines & Penalties</h1>
          <p className="text-gray-600 mt-1">Track and manage traffic violations and challans</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Fine
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Fines</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-sm text-gray-500">Overdue</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Outstanding</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">₹{stats.paidAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Paid</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">₹{stats.recoveredFromDrivers.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Recovered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by challan, vehicle, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="disputed">Disputed</option>
            <option value="waived">Waived</option>
          </select>
        </div>
      </div>

      {/* Fines List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredFines.map(fine => {
            const StatusIcon = statusConfig[fine.status].icon;
            return (
              <div
                key={fine.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${fine.status === 'overdue' ? 'bg-red-50' : ''}`}
                onClick={() => setSelectedFine(fine)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${fine.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <AlertTriangle className={`w-6 h-6 ${fine.status === 'overdue' ? 'text-red-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{fine.challanNumber}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${violationTypes[fine.violationType].color}`}>
                          {violationTypes[fine.violationType].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {fine.vehicle.number}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {fine.driver}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(fine.violationDate).toLocaleDateString('en-IN')} at {fine.violationTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {fine.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{fine.fineAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(fine.dueDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusConfig[fine.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig[fine.status].label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fine Detail Modal */}
      {selectedFine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFine.challanNumber}</h2>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-sm font-medium rounded ${statusConfig[selectedFine.status].color}`}>
                    {statusConfig[selectedFine.status].label}
                  </span>
                </div>
                <button onClick={() => setSelectedFine(null)} className="p-2 hover:bg-gray-100 rounded-lg">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{selectedFine.vehicle.name}</p>
                  <p className="text-sm text-gray-600">{selectedFine.vehicle.number}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900">{selectedFine.driver}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Violation</p>
                <p className="font-medium text-gray-900">{violationTypes[selectedFine.violationType].label}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedFine.remarks}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">{new Date(selectedFine.violationDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-sm text-gray-600">{selectedFine.violationTime}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{selectedFine.location}</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-sm text-red-600">Fine Amount</p>
                <p className="text-3xl font-bold text-red-700">₹{selectedFine.fineAmount.toLocaleString()}</p>
                <p className="text-sm text-red-600 mt-1">Due: {new Date(selectedFine.dueDate).toLocaleDateString('en-IN')}</p>
              </div>

              {selectedFine.status === 'paid' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">Payment Details</p>
                  <p className="font-medium text-gray-900">Paid ₹{selectedFine.paidAmount?.toLocaleString()} on {new Date(selectedFine.paidDate!).toLocaleDateString('en-IN')}</p>
                  <p className="text-sm text-gray-600">Mode: {selectedFine.paymentMode}</p>
                  {selectedFine.recoveredFromDriver && (
                    <p className="text-sm text-green-600 mt-1">✓ Recovered from driver</p>
                  )}
                </div>
              )}

              {(selectedFine.status === 'pending' || selectedFine.status === 'overdue') && (
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <AlertCircle className="w-4 h-4" />
                    Dispute
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
