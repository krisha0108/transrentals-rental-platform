'use client';

import React, { useState } from 'react';
import {
  Tag,
  Percent,
  Gift,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Copy,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  IndianRupee,
  Target,
  BarChart3,
  Share2,
  MoreVertical
} from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'flat' | 'free_km' | 'free_hours';
  value: number;
  minBookingValue?: number;
  maxDiscount?: number;
  applicableServices: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  status: 'active' | 'scheduled' | 'expired' | 'paused';
  targetAudience: 'all' | 'new_users' | 'returning' | 'corporate';
  createdAt: string;
}

// Mock promotions
const mockPromotions: Promotion[] = [
  {
    id: 'P001',
    code: 'FIRST50',
    name: 'First Ride Discount',
    description: '50% off on first booking for new users',
    type: 'percentage',
    value: 50,
    maxDiscount: 500,
    applicableServices: ['Self-Drive', 'Chauffeur', 'Bike Rental'],
    validFrom: '2024-01-01',
    validTo: '2024-03-31',
    usageLimit: 1000,
    usedCount: 456,
    perUserLimit: 1,
    status: 'active',
    targetAudience: 'new_users',
    createdAt: '2024-01-01'
  },
  {
    id: 'P002',
    code: 'WEEKEND20',
    name: 'Weekend Special',
    description: '20% off on weekend bookings',
    type: 'percentage',
    value: 20,
    minBookingValue: 1000,
    maxDiscount: 300,
    applicableServices: ['Self-Drive'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 5000,
    usedCount: 1234,
    perUserLimit: 5,
    status: 'active',
    targetAudience: 'all',
    createdAt: '2024-01-01'
  },
  {
    id: 'P003',
    code: 'FLAT200',
    name: 'Flat ₹200 Off',
    description: 'Flat ₹200 off on bookings above ₹1500',
    type: 'flat',
    value: 200,
    minBookingValue: 1500,
    applicableServices: ['Self-Drive', 'Chauffeur', 'Luxury'],
    validFrom: '2024-01-15',
    validTo: '2024-02-15',
    usageLimit: 500,
    usedCount: 89,
    perUserLimit: 2,
    status: 'active',
    targetAudience: 'returning',
    createdAt: '2024-01-15'
  },
  {
    id: 'P004',
    code: 'SUMMER2024',
    name: 'Summer Sale',
    description: '30% off on all outstation trips',
    type: 'percentage',
    value: 30,
    maxDiscount: 1000,
    applicableServices: ['Chauffeur', 'Luxury'],
    validFrom: '2024-04-01',
    validTo: '2024-06-30',
    usageLimit: 2000,
    usedCount: 0,
    perUserLimit: 3,
    status: 'scheduled',
    targetAudience: 'all',
    createdAt: '2024-01-20'
  },
  {
    id: 'P005',
    code: 'CORP25',
    name: 'Corporate Discount',
    description: '25% off for corporate bookings',
    type: 'percentage',
    value: 25,
    applicableServices: ['Chauffeur', 'Luxury', 'Bus & Tempo'],
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 10000,
    usedCount: 567,
    perUserLimit: 100,
    status: 'active',
    targetAudience: 'corporate',
    createdAt: '2024-01-01'
  }
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
};

const typeConfig = {
  percentage: { label: 'Percentage Off', icon: Percent },
  flat: { label: 'Flat Discount', icon: IndianRupee },
  free_km: { label: 'Free KM', icon: Target },
  free_hours: { label: 'Free Hours', icon: Clock }
};

export default function PromotionsPage() {
  const [promotions] = useState<Promotion[]>(mockPromotions);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    totalUsage: promotions.reduce((sum, p) => sum + p.usedCount, 0),
    avgConversion: 24.5 // Mock conversion rate
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Offers</h1>
          <p className="text-gray-600 mt-1">Create and manage discount codes and special offers</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Promos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsage.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Usage</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgConversion}%</p>
              <p className="text-sm text-gray-500">Conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by code or name..."
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
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.map(promo => {
          const StatusIcon = statusConfig[promo.status].icon;
          const TypeIcon = typeConfig[promo.type].icon;
          const usagePercent = (promo.usedCount / promo.usageLimit) * 100;

          return (
            <div
              key={promo.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedPromotion(promo)}
            >
              {/* Header */}
              <div className={`p-4 ${promo.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-lg ${promo.status === 'active' ? 'bg-white/20 text-white' : 'bg-white'} font-mono font-bold text-lg`}>
                    {promo.code}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(promo.code);
                    }}
                    className={`p-2 rounded-lg ${promo.status === 'active' ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <h3 className={`font-semibold mt-2 ${promo.status === 'active' ? 'text-white' : 'text-gray-900'}`}>
                  {promo.name}
                </h3>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TypeIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {promo.type === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}
                    </p>
                    <p className="text-xs text-gray-500">{typeConfig[promo.type].label}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{promo.description}</p>

                {/* Usage Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Usage</span>
                    <span className="font-medium text-gray-900">{promo.usedCount}/{promo.usageLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Validity */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(promo.validFrom).toLocaleDateString('en-IN')} - {new Date(promo.validTo).toLocaleDateString('en-IN')}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig[promo.status].color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[promo.status].label}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {promo.targetAudience === 'all' ? 'All Users' : promo.targetAudience === 'new_users' ? 'New Users' : promo.targetAudience === 'returning' ? 'Returning' : 'Corporate'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Promotion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Promotion</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g., SUMMER25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="percentage">Percentage Off</option>
                    <option value="flat">Flat Discount</option>
                    <option value="free_km">Free KM</option>
                    <option value="free_hours">Free Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input
                  type="text"
                  placeholder="e.g., Summer Sale 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the offer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    placeholder="e.g., 25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="e.g., 1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
                  <input
                    type="number"
                    placeholder="e.g., 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Users</option>
                  <option value="new_users">New Users Only</option>
                  <option value="returning">Returning Users</option>
                  <option value="corporate">Corporate Users</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Promotion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
