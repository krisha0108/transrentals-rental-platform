'use client';

import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Car,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock earnings data
const EARNINGS_STATS = {
  totalEarnings: 254256,
  thisMonth: 48750,
  lastMonth: 42300,
  pendingPayout: 15200,
  monthlyGrowth: 15.2,
};

// Mock transactions
const TRANSACTIONS = [
  {
    id: '1',
    type: 'earning',
    bookingNumber: 'CB-2024-001',
    customerName: 'Amit Kumar',
    vehicleName: 'Hyundai Creta',
    amount: 6720,
    platformFee: 1185,
    netAmount: 5535,
    date: '2024-12-12',
    status: 'completed',
  },
  {
    id: '2',
    type: 'earning',
    bookingNumber: 'CB-2024-002',
    customerName: 'Priya Sharma',
    vehicleName: 'Honda City',
    amount: 2998,
    platformFee: 529,
    netAmount: 2469,
    date: '2024-12-11',
    status: 'completed',
  },
  {
    id: '3',
    type: 'payout',
    description: 'Weekly Payout',
    amount: 15200,
    date: '2024-12-10',
    status: 'completed',
    payoutMethod: 'Bank Transfer',
  },
  {
    id: '4',
    type: 'earning',
    bookingNumber: 'CB-2024-003',
    customerName: 'Rahul Verma',
    vehicleName: 'Maruti Swift',
    amount: 2697,
    platformFee: 476,
    netAmount: 2221,
    date: '2024-12-09',
    status: 'completed',
  },
  {
    id: '5',
    type: 'earning',
    bookingNumber: 'CB-2024-004',
    customerName: 'Vikram Singh',
    vehicleName: 'Toyota Fortuner',
    amount: 19996,
    platformFee: 3529,
    netAmount: 16467,
    date: '2024-12-08',
    status: 'pending',
  },
];

// Earnings by car
const EARNINGS_BY_CAR = [
  { name: 'Hyundai Creta', bookings: 24, earnings: 52776 },
  { name: 'Honda City', bookings: 38, earnings: 56962 },
  { name: 'Maruti Swift', bookings: 56, earnings: 50344 },
  { name: 'Toyota Innova', bookings: 18, earnings: 53982 },
  { name: 'Toyota Fortuner', bookings: 8, earnings: 39992 },
];

export default function VendorSelfDriveEarningsPage() {
  const [dateFilter, setDateFilter] = useState('this_month');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTransactions = TRANSACTIONS.filter((t) => {
    if (typeFilter === 'all') return true;
    return t.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Self-Drive Earnings</h1>
          <p className="text-gray-600">Track your self-drive car rental earnings</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{EARNINGS_STATS.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{EARNINGS_STATS.thisMonth.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {EARNINGS_STATS.monthlyGrowth >= 0 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">
                      +{EARNINGS_STATS.monthlyGrowth}% from last month
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">
                      {EARNINGS_STATS.monthlyGrowth}% from last month
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{EARNINGS_STATS.lastMonth.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">November 2024</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Payout</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                ₹{EARNINGS_STATS.pendingPayout.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Processing...</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings by Car */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Earnings by Car</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {EARNINGS_BY_CAR.map((car, index) => {
              const maxEarnings = Math.max(...EARNINGS_BY_CAR.map((c) => c.earnings));
              const percentage = (car.earnings / maxEarnings) * 100;
              return (
                <div key={car.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{car.name}</span>
                      <span className="text-gray-500">({car.bookings} bookings)</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      ₹{car.earnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Transactions</option>
                <option value="earning">Earnings</option>
                <option value="payout">Payouts</option>
              </select>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  transaction.type === 'earning' ? 'bg-green-100' : 'bg-blue-100'
                )}
              >
                {transaction.type === 'earning' ? (
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                {transaction.type === 'earning' ? (
                  <>
                    <p className="font-medium text-gray-900">
                      Booking #{transaction.bookingNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.customerName} • {transaction.vehicleName}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.payoutMethod}</p>
                  </>
                )}
              </div>


              {/* Date */}
              <div className="text-sm text-gray-500">{transaction.date}</div>

              {/* Status & Amount */}
              <div className="text-right">
                <p
                  className={cn(
                    'text-lg font-bold',
                    transaction.type === 'earning' ? 'text-green-600' : 'text-blue-600'
                  )}
                >
                  {transaction.type === 'earning' ? '+' : '-'}₹
                  {(transaction.type === 'earning'
                    ? transaction.netAmount
                    : transaction.amount
                  )?.toLocaleString()}
                </p>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Settings</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">HDFC Bank ****4532</p>
              <p className="text-sm text-gray-500">Weekly payouts every Monday</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600">Verified</span>
          </div>
          <Button variant="outline" size="sm">
            Update Details
          </Button>
        </div>
      </div>
    </div>
  );
}
