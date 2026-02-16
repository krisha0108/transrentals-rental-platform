'use client';

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Car,
  TrendingUp,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  BarChart3,
  RefreshCcw,
  ChevronRight
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  type: 'headquarters' | 'branch' | 'franchise' | 'partner';
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  manager: string;
  managerPhone: string;
  status: 'active' | 'inactive' | 'setup';
  openingHours: string;
  vehicles: number;
  staff: number;
  activeBookings: number;
  monthlyRevenue: number;
  targetRevenue: number;
  rating: number;
  reviews: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

// Mock branch data
const mockBranches: Branch[] = [
  {
    id: 'BR001',
    name: 'Main Office - Koramangala',
    code: 'KOR-HQ',
    type: 'headquarters',
    address: '123, 5th Block, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    phone: '+91 80 4123 4567',
    email: 'koramangala@transrentals.com',
    manager: 'Rajesh Kumar',
    managerPhone: '+91 9737965551',
    status: 'active',
    openingHours: '8:00 AM - 10:00 PM',
    vehicles: 45,
    staff: 12,
    activeBookings: 28,
    monthlyRevenue: 1850000,
    targetRevenue: 2000000,
    rating: 4.8,
    reviews: 324,
    coordinates: { lat: 12.9352, lng: 77.6245 },
    createdAt: '2022-01-15'
  },
  {
    id: 'BR002',
    name: 'HSR Layout Branch',
    code: 'HSR-01',
    type: 'branch',
    address: '45, Sector 2, HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560102',
    phone: '+91 80 4123 8901',
    email: 'hsr@transrentals.com',
    manager: 'Priya Sharma',
    managerPhone: '+91 98765 43211',
    status: 'active',
    openingHours: '8:00 AM - 9:00 PM',
    vehicles: 28,
    staff: 8,
    activeBookings: 15,
    monthlyRevenue: 980000,
    targetRevenue: 1200000,
    rating: 4.6,
    reviews: 186,
    coordinates: { lat: 12.9116, lng: 77.6389 },
    createdAt: '2022-06-20'
  },
  {
    id: 'BR003',
    name: 'Whitefield Hub',
    code: 'WHT-01',
    type: 'branch',
    address: '78, EPIP Zone, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    phone: '+91 80 4123 5678',
    email: 'whitefield@transrentals.com',
    manager: 'Arun Menon',
    managerPhone: '+91 98765 43212',
    status: 'active',
    openingHours: '7:00 AM - 11:00 PM',
    vehicles: 35,
    staff: 10,
    activeBookings: 22,
    monthlyRevenue: 1420000,
    targetRevenue: 1500000,
    rating: 4.7,
    reviews: 245,
    coordinates: { lat: 12.9698, lng: 77.7500 },
    createdAt: '2022-09-10'
  },
  {
    id: 'BR004',
    name: 'Chennai Partner',
    code: 'CHN-P1',
    type: 'partner',
    address: '12, Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    phone: '+91 44 4567 8901',
    email: 'chennai@transrentals.com',
    manager: 'Senthil Raja',
    managerPhone: '+91 98765 43213',
    status: 'active',
    openingHours: '8:00 AM - 8:00 PM',
    vehicles: 20,
    staff: 6,
    activeBookings: 12,
    monthlyRevenue: 720000,
    targetRevenue: 900000,
    rating: 4.5,
    reviews: 128,
    coordinates: { lat: 13.0827, lng: 80.2707 },
    createdAt: '2023-02-15'
  },
  {
    id: 'BR005',
    name: 'Electronic City',
    code: 'ELC-01',
    type: 'branch',
    address: '34, Phase 1, Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560100',
    phone: '+91 80 4123 9012',
    email: 'ecity@transrentals.com',
    manager: 'Deepak Nair',
    managerPhone: '+91 98765 43214',
    status: 'setup',
    openingHours: 'Opening Soon',
    vehicles: 15,
    staff: 4,
    activeBookings: 0,
    monthlyRevenue: 0,
    targetRevenue: 800000,
    rating: 0,
    reviews: 0,
    coordinates: { lat: 12.8399, lng: 77.6770 },
    createdAt: '2024-01-05'
  }
];

const branchTypes = {
  headquarters: { label: 'Headquarters', color: 'bg-purple-100 text-purple-700' },
  branch: { label: 'Branch', color: 'bg-blue-100 text-blue-700' },
  franchise: { label: 'Franchise', color: 'bg-green-100 text-green-700' },
  partner: { label: 'Partner', color: 'bg-orange-100 text-orange-700' }
};

const branchStatuses = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700', icon: XCircle },
  setup: { label: 'Setting Up', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
};

export default function BranchesPage() {
  const [branches] = useState<Branch[]>(mockBranches);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || branch.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totals = {
    branches: branches.filter(b => b.status === 'active').length,
    vehicles: branches.reduce((sum, b) => sum + b.vehicles, 0),
    staff: branches.reduce((sum, b) => sum + b.staff, 0),
    revenue: branches.reduce((sum, b) => sum + b.monthlyRevenue, 0),
    bookings: branches.reduce((sum, b) => sum + b.activeBookings, 0)
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Branch Management</h1>
          <p className="text-gray-600 mt-1">Manage all your locations from one place</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totals.branches}</p>
              <p className="text-sm text-gray-500">Active Branches</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totals.vehicles}</p>
              <p className="text-sm text-gray-500">Total Vehicles</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totals.staff}</p>
              <p className="text-sm text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.revenue)}</p>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totals.bookings}</p>
              <p className="text-sm text-gray-500">Active Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, city, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="headquarters">Headquarters</option>
              <option value="branch">Branch</option>
              <option value="franchise">Franchise</option>
              <option value="partner">Partner</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map(branch => {
            const StatusIcon = branchStatuses[branch.status].icon;
            const revenueProgress = (branch.monthlyRevenue / branch.targetRevenue) * 100;

            return (
              <div
                key={branch.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Branch Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${branch.type === 'headquarters' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                        <Building2 className={`w-5 h-5 ${branch.type === 'headquarters' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-500">{branch.code}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${branchTypes[branch.type].color}`}>
                      {branchTypes[branch.type].label}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${branchStatuses[branch.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {branchStatuses[branch.status].label}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{branch.address}, {branch.city} - {branch.pincode}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{branch.vehicles}</p>
                    <p className="text-xs text-gray-500">Vehicles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{branch.staff}</p>
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{branch.activeBookings}</p>
                    <p className="text-xs text-gray-500">Bookings</p>
                  </div>
                </div>

                {/* Revenue Progress */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-medium text-gray-900">{formatCurrency(branch.monthlyRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${revenueProgress >= 100 ? 'bg-green-500' :
                          revenueProgress >= 75 ? 'bg-blue-500' :
                            revenueProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: {formatCurrency(branch.targetRevenue)} ({revenueProgress.toFixed(0)}%)
                  </p>
                </div>

                {/* Manager & Actions */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{branch.manager}</p>
                      <p className="text-xs text-gray-500">Branch Manager</p>
                    </div>
                    <button
                      onClick={() => setSelectedBranch(branch)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Manager</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Vehicles</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Staff</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Revenue</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBranches.map(branch => {
                const StatusIcon = branchStatuses[branch.status].icon;
                return (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${branch.type === 'headquarters' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                          <Building2 className={`w-4 h-4 ${branch.type === 'headquarters' ? 'text-purple-600' : 'text-blue-600'
                            }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{branch.name}</p>
                          <p className="text-xs text-gray-500">{branch.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {branch.city}, {branch.state}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{branch.manager}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{branch.vehicles}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">{branch.staff}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(branch.monthlyRevenue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${branchStatuses[branch.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {branchStatuses[branch.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedBranch(branch)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Branch Detail Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedBranch.name}</h2>
                  <p className="text-gray-500">{selectedBranch.code}</p>
                </div>
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedBranch.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedBranch.email}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {selectedBranch.address}, {selectedBranch.city}, {selectedBranch.state} - {selectedBranch.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manager Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Branch Manager</p>
                    <p className="font-medium text-gray-900">{selectedBranch.manager}</p>
                    <p className="text-sm text-gray-500">{selectedBranch.managerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedBranch.vehicles}</p>
                  <p className="text-sm text-gray-500">Vehicles</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedBranch.staff}</p>
                  <p className="text-sm text-gray-500">Staff</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedBranch.activeBookings}</p>
                  <p className="text-sm text-gray-500">Bookings</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedBranch.rating || '-'}</p>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Monthly Revenue Progress</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedBranch.monthlyRevenue)} / {formatCurrency(selectedBranch.targetRevenue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-blue-600"
                    style={{ width: `${Math.min((selectedBranch.monthlyRevenue / selectedBranch.targetRevenue) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RefreshCcw className="w-4 h-4" />
                  Sync Data
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4" />
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g., Indiranagar Branch"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g., IND-01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="branch">Branch</option>
                    <option value="franchise">Franchise</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  placeholder="Full address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="Pincode"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 "
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="branch@transrentals.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Manager</label>
                <input
                  type="text"
                  placeholder="Manager name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
