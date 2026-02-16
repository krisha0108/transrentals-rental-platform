'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Send,
  Users,
  Building2,
  Car,
  IndianRupee,
  RefreshCw,
  FileSignature,
  Printer,
  MoreVertical,
} from 'lucide-react';

// Mock contracts data
const contractsData = [
  {
    id: 'CON-2024-001',
    customerName: 'Tech Solutions Pvt Ltd',
    customerType: 'Corporate',
    customerContact: 'Mr. Sharma',
    customerPhone: '+91 9737965551',
    customerEmail: 'transport@techsol.com',
    type: 'Monthly Rental',
    service: 'Corporate Cars',
    vehicles: ['3x Sedan (Swift Dzire)', '2x SUV (Innova)'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    monthlyValue: 150000,
    totalValue: 1800000,
    paymentTerms: 'Monthly, Net 15',
    status: 'active',
    autoRenewal: true,
    documents: ['Agreement', 'Vehicle List', 'Insurance'],
    lastPayment: '2024-01-15',
    notes: 'Priority support, dedicated account manager',
  },
  {
    id: 'CON-2024-002',
    customerName: 'ABC Events',
    customerType: 'Events',
    customerContact: 'Ms. Priya',
    customerPhone: '+91 87654 32109',
    customerEmail: 'bookings@abcevents.com',
    type: 'Annual Contract',
    service: 'Bus & Tempo',
    vehicles: ['On-demand basis'],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    monthlyValue: 0,
    totalValue: 500000,
    paymentTerms: 'Per booking, advance',
    status: 'active',
    autoRenewal: false,
    documents: ['Agreement', 'Rate Card'],
    notes: '20% discount on regular rates, priority booking',
  },
  {
    id: 'CON-2024-003',
    customerName: 'Global Logistics',
    customerType: 'Corporate',
    customerContact: 'Mr. Patel',
    customerPhone: '+91 76543 21098',
    customerEmail: 'ops@globallogistics.in',
    type: 'Monthly Rental',
    service: 'Truck & Logistics',
    vehicles: ['5x 20ft Container Trucks'],
    startDate: '2023-07-01',
    endDate: '2024-06-30',
    monthlyValue: 225000,
    totalValue: 2700000,
    paymentTerms: 'Monthly, Net 30',
    status: 'expiring_soon',
    autoRenewal: false,
    documents: ['Agreement', 'Vehicle List', 'Route Schedule'],
    lastPayment: '2024-01-10',
    notes: 'Mumbai-Delhi-Mumbai route, 10 trips/month guaranteed',
  },
  {
    id: 'CON-2023-004',
    customerName: 'Wedding Planners Inc',
    customerType: 'Events',
    customerContact: 'Mrs. Desai',
    customerPhone: '+91 65432 10987',
    customerEmail: 'info@weddingplanners.in',
    type: 'Annual Contract',
    service: 'Luxury Cars',
    vehicles: ['On-demand luxury fleet'],
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    monthlyValue: 0,
    totalValue: 300000,
    paymentTerms: 'Per booking, 50% advance',
    status: 'expiring_soon',
    autoRenewal: true,
    documents: ['Agreement', 'Rate Card'],
    notes: 'Wedding season priority, decoration included',
  },
  {
    id: 'CON-2023-005',
    customerName: 'Metro Construction',
    customerType: 'Corporate',
    customerContact: 'Mr. Joshi',
    customerPhone: '+91 54321 09876',
    customerEmail: 'admin@metroconstruction.com',
    type: 'Project Contract',
    service: 'Equipment Rental',
    vehicles: ['2x JCB', '1x Crane'],
    startDate: '2023-09-01',
    endDate: '2024-02-28',
    monthlyValue: 350000,
    totalValue: 2100000,
    paymentTerms: 'Monthly, Net 15',
    status: 'active',
    autoRenewal: false,
    documents: ['Agreement', 'Equipment List', 'Site Details'],
    lastPayment: '2024-01-05',
    notes: 'Highway project, Thane site',
  },
  {
    id: 'CON-2023-006',
    customerName: 'Sunrise Hospital',
    customerType: 'Corporate',
    customerContact: 'Dr. Mehta',
    customerPhone: '+91 43210 98765',
    customerEmail: 'admin@sunrisehospital.in',
    type: 'Annual Contract',
    service: 'Chauffeur Service',
    vehicles: ['2x Sedan for doctors'],
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    monthlyValue: 60000,
    totalValue: 720000,
    paymentTerms: 'Monthly, Net 7',
    status: 'expired',
    autoRenewal: false,
    documents: ['Agreement', 'Vehicle List'],
    notes: '24/7 availability for emergency',
  },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState(contractsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<typeof contractsData[0] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pending_signature': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'expiring_soon': return <AlertTriangle className="w-3 h-3" />;
      case 'expired': return <XCircle className="w-3 h-3" />;
      case 'pending_signature': return <FileSignature className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expiring_soon': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'draft': return 'Draft';
      case 'pending_signature': return 'Pending Signature';
      default: return status;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiringSoon: contracts.filter(c => c.status === 'expiring_soon').length,
    totalValue: contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.totalValue, 0),
    monthlyRevenue: contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.monthlyValue, 0),
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts & Agreements</h1>
          <p className="text-gray-600">Manage customer contracts and renewals</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total Contracts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Contract Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Monthly Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Contracts Expiring Soon</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {contracts.filter(c => c.status === 'expiring_soon').map(contract => (
              <button
                key={contract.id}
                onClick={() => { setSelectedContract(contract); setShowDetail(true); }}
                className="px-3 py-1.5 bg-white border border-yellow-300 rounded-lg text-sm hover:bg-yellow-100 transition flex items-center gap-2"
              >
                <span className="font-medium">{contract.customerName}</span>
                <span className="text-yellow-600">•</span>
                <span className="text-yellow-700">{getDaysRemaining(contract.endDate)} days left</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="Monthly Rental">Monthly Rental</option>
          <option value="Annual Contract">Annual Contract</option>
          <option value="Project Contract">Project Contract</option>
        </select>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Contract</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((contract) => {
                const daysRemaining = getDaysRemaining(contract.endDate);
                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-blue-600">{contract.id}</p>
                        <p className="text-xs text-gray-500">{contract.type}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{contract.customerName}</p>
                        <p className="text-sm text-gray-500">{contract.customerContact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{contract.service}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-700">{contract.startDate} → {contract.endDate}</p>
                        {contract.status === 'active' && (
                          <p className={`text-xs ${daysRemaining <= 30 ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Ended'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-gray-900">₹{(contract.totalValue / 100000).toFixed(1)}L</p>
                        {contract.monthlyValue > 0 && (
                          <p className="text-xs text-gray-500">₹{(contract.monthlyValue / 1000).toFixed(0)}K/month</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {getStatusLabel(contract.status)}
                      </span>
                      {contract.autoRenewal && (
                        <span className="ml-2 text-xs text-blue-600 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedContract(contract); setShowDetail(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Download">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        {contract.status === 'expiring_soon' && (
                          <button className="p-2 hover:bg-green-100 rounded-lg transition" title="Renew">
                            <RefreshCw className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {showDetail && selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedContract.id}</h2>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedContract.status)}`}>
                      {getStatusIcon(selectedContract.status)}
                      {getStatusLabel(selectedContract.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{selectedContract.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Print">
                    <Printer className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Download">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Customer Details
                  </h3>
                  <p className="font-medium text-gray-900">{selectedContract.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedContract.customerContact}</p>
                  <p className="text-sm text-gray-600">{selectedContract.customerPhone}</p>
                  <p className="text-sm text-gray-600">{selectedContract.customerEmail}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {selectedContract.customerType}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Contract Period
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date</span>
                      <span className="font-medium">{selectedContract.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date</span>
                      <span className="font-medium">{selectedContract.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Remaining</span>
                      <span className={`font-medium ${getDaysRemaining(selectedContract.endDate) <= 30 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {getDaysRemaining(selectedContract.endDate)} days
                      </span>
                    </div>
                    {selectedContract.autoRenewal && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                        <RefreshCw className="w-4 h-4" />
                        Auto-renewal enabled
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service & Vehicles */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Service Details
                </h3>
                <p className="font-medium text-gray-900 mb-2">{selectedContract.service}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedContract.vehicles.map((vehicle, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border">
                      {vehicle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600">Total Contract Value</p>
                  <p className="text-2xl font-bold text-green-700">₹{(selectedContract.totalValue / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600">Monthly Value</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedContract.monthlyValue > 0
                      ? `₹${(selectedContract.monthlyValue / 1000).toFixed(0)}K`
                      : 'Variable'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-purple-600">Payment Terms</p>
                  <p className="text-lg font-bold text-purple-700">{selectedContract.paymentTerms}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContract.documents.map((doc, idx) => (
                    <button
                      key={idx}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      {doc}
                      <Download className="w-3 h-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedContract.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Special Notes</h3>
                  <p className="text-yellow-700">{selectedContract.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedContract.status === 'expiring_soon' && (
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Renew Contract
                  </button>
                )}
                {selectedContract.status === 'expired' && (
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Contract
                  </button>
                )}
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Contract
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
