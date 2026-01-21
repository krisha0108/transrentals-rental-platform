'use client';

import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Bike,
  CreditCard,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock earnings data
const MOCK_EARNINGS = {
  totalEarnings: 145800,
  thisMonth: 32500,
  lastMonth: 28700,
  monthGrowth: 13.2,
  pendingPayout: 8500,
  completedPayouts: 137300,
  avgPerBooking: 1580,
  totalBookings: 92,
};

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'earning',
    bookingNumber: 'BK-2024-089',
    vehicleName: 'Royal Enfield Classic 350',
    customerName: 'Rahul Sharma',
    amount: 2548,
    platformFee: 450,
    netAmount: 2098,
    date: '2024-12-11',
    status: 'completed',
  },
  {
    id: '2',
    type: 'payout',
    description: 'Weekly Payout - Dec Week 1',
    amount: 8500,
    bankAccount: '****1234',
    date: '2024-12-09',
    status: 'processing',
  },
  {
    id: '3',
    type: 'earning',
    bookingNumber: 'BK-2024-088',
    vehicleName: 'Honda Activa 6G',
    customerName: 'Priya Patel',
    amount: 897,
    platformFee: 158,
    netAmount: 739,
    date: '2024-12-08',
    status: 'completed',
  },
  {
    id: '4',
    type: 'earning',
    bookingNumber: 'BK-2024-087',
    vehicleName: 'TVS Jupiter',
    customerName: 'Amit Kumar',
    amount: 1047,
    platformFee: 185,
    netAmount: 862,
    date: '2024-12-07',
    status: 'completed',
  },
  {
    id: '5',
    type: 'payout',
    description: 'Weekly Payout - Nov Week 4',
    amount: 12500,
    bankAccount: '****1234',
    date: '2024-12-02',
    status: 'completed',
  },
  {
    id: '6',
    type: 'earning',
    bookingNumber: 'BK-2024-086',
    vehicleName: 'Royal Enfield Classic 350',
    customerName: 'Neha Singh',
    amount: 3196,
    platformFee: 564,
    netAmount: 2632,
    date: '2024-12-01',
    status: 'completed',
  },
];

const MOCK_BIKE_EARNINGS = [
  { id: '1', name: 'Royal Enfield Classic 350', bookings: 32, earnings: 58400, avgPerBooking: 1825 },
  { id: '2', name: 'Honda Activa 6G', bookings: 45, earnings: 28500, avgPerBooking: 633 },
  { id: '3', name: 'TVS Jupiter', bookings: 38, earnings: 24700, avgPerBooking: 650 },
  { id: '4', name: 'Honda Shine', bookings: 22, earnings: 15400, avgPerBooking: 700 },
  { id: '5', name: 'Bajaj Pulsar 150', bookings: 28, earnings: 18900, avgPerBooking: 675 },
];

type TimeFilter = 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function VendorBikeEarningsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'earning' | 'payout'>('all');

  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    (t) => transactionFilter === 'all' || t.type === transactionFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600">Track your bike rental income</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">All Time</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold">₹{MOCK_EARNINGS.totalEarnings.toLocaleString()}</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span
              className={cn(
                'flex items-center text-sm font-medium',
                MOCK_EARNINGS.monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {MOCK_EARNINGS.monthGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(MOCK_EARNINGS.monthGrowth)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900">₹{MOCK_EARNINGS.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            Last month: ₹{MOCK_EARNINGS.lastMonth.toLocaleString()}
          </p>
        </div>

        {/* Pending Payout */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Payout</p>
          <p className="text-2xl font-bold text-orange-600">₹{MOCK_EARNINGS.pendingPayout.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Next payout: Monday</p>
        </div>

        {/* Avg Per Booking */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Per Booking</p>
          <p className="text-2xl font-bold text-gray-900">₹{MOCK_EARNINGS.avgPerBooking}</p>
          <p className="text-xs text-gray-500 mt-1">{MOCK_EARNINGS.totalBookings} total bookings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            <div className="flex items-center gap-2">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value as 'all' | 'earning' | 'payout')}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="earning">Earnings</option>
                <option value="payout">Payouts</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                {transaction.type === 'earning' ? (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.vehicleName}</p>
                        <p className="text-sm text-gray-500">
                          #{transaction.bookingNumber} • {transaction.customerName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+₹{transaction.netAmount}</p>
                      <p className="text-xs text-gray-500">
                        Total: ₹{transaction.amount} • Fee: ₹{transaction.platformFee}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">Bank: {transaction.bankAccount}</p>
                        <p className="text-xs text-gray-400 mt-1">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₹{transaction.amount.toLocaleString()}</p>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {transaction.status === 'completed' ? 'Completed' : 'Processing'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 text-center">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        </div>

        {/* Earnings by Bike */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Earnings by Bike</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {MOCK_BIKE_EARNINGS.map((bike, index) => (
              <div key={bike.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{bike.name}</span>
                  </div>
                  <span className="font-semibold text-green-600">₹{bike.earnings.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{bike.bookings} bookings</span>
                  <span>Avg: ₹{bike.avgPerBooking}/booking</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    style={{
                      width: `${(bike.earnings / MOCK_BIKE_EARNINGS[0].earnings) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Payout Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Bank Account</p>
            <p className="font-medium text-gray-900">HDFC Bank ****1234</p>
            <Button variant="outline" size="sm" className="mt-2">
              Change
            </Button>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Payout Schedule</p>
            <p className="font-medium text-gray-900">Weekly (Every Monday)</p>
            <Button variant="outline" size="sm" className="mt-2">
              Change
            </Button>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Minimum Payout</p>
            <p className="font-medium text-gray-900">₹500</p>
            <Button variant="outline" size="sm" className="mt-2">
              Change
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
