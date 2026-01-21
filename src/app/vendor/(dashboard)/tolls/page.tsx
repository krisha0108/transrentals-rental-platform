'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Car,
  MapPin,
  Calendar,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCcw,
  Eye,
  Route,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

interface TollTransaction {
  id: string;
  vehicle: {
    name: string;
    number: string;
    fastagId: string;
  };
  tollPlaza: string;
  location: string;
  lane: string;
  amount: number;
  transactionDate: string;
  transactionTime: string;
  transactionType: 'debit' | 'recharge';
  status: 'success' | 'failed' | 'pending';
  balanceAfter: number;
  tripId?: string;
}

interface FastagCard {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  fastagId: string;
  bankName: string;
  balance: number;
  status: 'active' | 'inactive' | 'blacklisted' | 'low_balance';
  lastUsed: string;
  lastRecharge: string;
  monthlyUsage: number;
}

// Mock FASTag cards
const mockFastagCards: FastagCard[] = [
  {
    id: 'FT001',
    vehicleNumber: 'KA-01-AB-1234',
    vehicleName: 'Toyota Innova',
    fastagId: 'FASTAG-9876543210',
    bankName: 'ICICI Bank',
    balance: 2450,
    status: 'active',
    lastUsed: '2024-01-20',
    lastRecharge: '2024-01-15',
    monthlyUsage: 4520
  },
  {
    id: 'FT002',
    vehicleNumber: 'KA-01-CD-5678',
    vehicleName: 'Maruti Swift',
    fastagId: 'FASTAG-1234567890',
    bankName: 'HDFC Bank',
    balance: 180,
    status: 'low_balance',
    lastUsed: '2024-01-19',
    lastRecharge: '2024-01-10',
    monthlyUsage: 2340
  },
  {
    id: 'FT003',
    vehicleNumber: 'KA-01-EF-9012',
    vehicleName: 'Honda City',
    fastagId: 'FASTAG-5678901234',
    bankName: 'SBI',
    balance: 3200,
    status: 'active',
    lastUsed: '2024-01-20',
    lastRecharge: '2024-01-18',
    monthlyUsage: 3890
  },
  {
    id: 'FT004',
    vehicleNumber: 'KA-01-GH-3456',
    vehicleName: 'Mahindra XUV500',
    fastagId: 'FASTAG-3456789012',
    bankName: 'Axis Bank',
    balance: 0,
    status: 'inactive',
    lastUsed: '2024-01-05',
    lastRecharge: '2023-12-20',
    monthlyUsage: 1560
  }
];

// Mock transactions
const mockTransactions: TollTransaction[] = [
  {
    id: 'TT001',
    vehicle: { name: 'Toyota Innova', number: 'KA-01-AB-1234', fastagId: 'FASTAG-9876543210' },
    tollPlaza: 'Attibele Toll Plaza',
    location: 'Bangalore-Hosur Highway',
    lane: 'ETC Lane 3',
    amount: 65,
    transactionDate: '2024-01-20',
    transactionTime: '08:45:23',
    transactionType: 'debit',
    status: 'success',
    balanceAfter: 2450,
    tripId: 'BK-2024-0156'
  },
  {
    id: 'TT002',
    vehicle: { name: 'Toyota Innova', number: 'KA-01-AB-1234', fastagId: 'FASTAG-9876543210' },
    tollPlaza: 'Online Recharge',
    location: '-',
    lane: '-',
    amount: 1000,
    transactionDate: '2024-01-15',
    transactionTime: '10:30:00',
    transactionType: 'recharge',
    status: 'success',
    balanceAfter: 2515
  },
  {
    id: 'TT003',
    vehicle: { name: 'Maruti Swift', number: 'KA-01-CD-5678', fastagId: 'FASTAG-1234567890' },
    tollPlaza: 'Electronic City Toll',
    location: 'NICE Road',
    lane: 'ETC Lane 1',
    amount: 42,
    transactionDate: '2024-01-19',
    transactionTime: '17:22:45',
    transactionType: 'debit',
    status: 'success',
    balanceAfter: 180
  },
  {
    id: 'TT004',
    vehicle: { name: 'Honda City', number: 'KA-01-EF-9012', fastagId: 'FASTAG-5678901234' },
    tollPlaza: 'Nelamangala Toll',
    location: 'NH-48',
    lane: 'ETC Lane 2',
    amount: 85,
    transactionDate: '2024-01-20',
    transactionTime: '06:15:10',
    transactionType: 'debit',
    status: 'success',
    balanceAfter: 3200,
    tripId: 'BK-2024-0162'
  },
  {
    id: 'TT005',
    vehicle: { name: 'Mahindra XUV500', number: 'KA-01-GH-3456', fastagId: 'FASTAG-3456789012' },
    tollPlaza: 'Kengeri Toll',
    location: 'NICE Road',
    lane: 'ETC Lane 4',
    amount: 55,
    transactionDate: '2024-01-05',
    transactionTime: '14:08:32',
    transactionType: 'debit',
    status: 'failed',
    balanceAfter: 0
  }
];

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  blacklisted: 'bg-red-100 text-red-700',
  low_balance: 'bg-yellow-100 text-yellow-700'
};

export default function TollManagementPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'transactions' | 'analytics'>('cards');
  const [fastagCards] = useState<FastagCard[]>(mockFastagCards);
  const [transactions] = useState<TollTransaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRechargeModal, setShowRechargeModal] = useState<FastagCard | null>(null);

  // Stats
  const stats = {
    totalCards: fastagCards.length,
    activeCards: fastagCards.filter(c => c.status === 'active').length,
    lowBalance: fastagCards.filter(c => c.status === 'low_balance').length,
    totalBalance: fastagCards.reduce((sum, c) => sum + c.balance, 0),
    monthlyUsage: fastagCards.reduce((sum, c) => sum + c.monthlyUsage, 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toll Management</h1>
          <p className="text-gray-600 mt-1">Manage FASTag cards and toll transactions</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" />
            Sync Balance
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Wallet className="w-4 h-4" />
            Bulk Recharge
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              <p className="text-sm text-gray-500">Total Tags</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCards}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lowBalance}</p>
              <p className="text-sm text-gray-500">Low Balance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Balance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{stats.monthlyUsage.toLocaleString()}</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {[
              { id: 'cards', label: 'FASTag Cards', icon: CreditCard },
              { id: 'transactions', label: 'Transactions', icon: Route },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FASTag Cards Tab */}
        {activeTab === 'cards' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fastagCards.map(card => (
                <div key={card.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${card.status === 'low_balance' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                        <CreditCard className={`w-6 h-6 ${card.status === 'low_balance' ? 'text-yellow-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{card.vehicleName}</h3>
                        <p className="text-sm text-gray-500">{card.vehicleNumber}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[card.status]}`}>
                      {card.status === 'low_balance' ? 'Low Balance' : card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Current Balance</p>
                      <p className={`text-xl font-bold ${card.balance < 200 ? 'text-red-600' : 'text-gray-900'}`}>
                        ₹{card.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">This Month</p>
                      <p className="text-xl font-bold text-gray-900">₹{card.monthlyUsage.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <p>FASTag ID: <span className="font-medium text-gray-700">{card.fastagId}</span></p>
                    <p>Bank: <span className="font-medium text-gray-700">{card.bankName}</span></p>
                    <p>Last Used: <span className="font-medium text-gray-700">{new Date(card.lastUsed).toLocaleDateString('en-IN')}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRechargeModal(card)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Recharge
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="divide-y divide-gray-100">
            {transactions.map(txn => (
              <div key={txn.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${txn.transactionType === 'recharge' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {txn.transactionType === 'recharge' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{txn.tollPlaza}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Car className="w-4 h-4" />
                        <span>{txn.vehicle.number}</span>
                        {txn.location !== '-' && (
                          <>
                            <span>•</span>
                            <MapPin className="w-4 h-4" />
                            <span>{txn.location}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(txn.transactionDate).toLocaleDateString('en-IN')} at {txn.transactionTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${txn.transactionType === 'recharge' ? 'text-green-600' : 'text-gray-900'}`}>
                      {txn.transactionType === 'recharge' ? '+' : '-'}₹{txn.amount}
                    </p>
                    <p className="text-sm text-gray-500">Bal: ₹{txn.balanceAfter}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      txn.status === 'success' ? 'bg-green-100 text-green-700' :
                      txn.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {txn.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Toll Plazas */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Top Toll Plazas</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Attibele Toll Plaza', amount: 1250, trips: 18 },
                    { name: 'Nelamangala Toll', amount: 980, trips: 12 },
                    { name: 'Electronic City Toll', amount: 756, trips: 15 },
                    { name: 'Kengeri Toll', amount: 540, trips: 10 }
                  ].map((plaza, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{plaza.name}</p>
                        <p className="text-sm text-gray-500">{plaza.trips} trips</p>
                      </div>
                      <p className="font-bold text-gray-900">₹{plaza.amount}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle-wise Usage */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Vehicle-wise Toll Expense</h3>
                <div className="space-y-3">
                  {fastagCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{card.vehicleName}</p>
                        <p className="text-sm text-gray-500">{card.vehicleNumber}</p>
                      </div>
                      <p className="font-bold text-gray-900">₹{card.monthlyUsage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recharge FASTag</h2>
              <p className="text-gray-500">{showRechargeModal.vehicleName} - {showRechargeModal.vehicleNumber}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">₹{showRechargeModal.balance}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recharge Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[500, 1000, 2000, 5000].map(amount => (
                    <button key={amount} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                      ₹{amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRechargeModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Proceed to Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
