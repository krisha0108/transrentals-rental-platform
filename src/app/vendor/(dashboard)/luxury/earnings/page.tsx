'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Car,
  Download,
  Crown,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedTrips: number;
  averagePerTrip: number;
}

interface Transaction {
  id: string;
  bookingNumber: string;
  carName: string;
  customerName: string;
  tripType: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'processing';
  date: string;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 425000,
  thisMonth: 78500,
  lastMonth: 65200,
  pendingPayout: 32500,
  completedTrips: 42,
  averagePerTrip: 10119,
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    bookingNumber: 'LUX-2024-0001',
    carName: 'Mercedes E-Class',
    customerName: 'Vikram Malhotra',
    tripType: 'Local (8hr/80km)',
    amount: 9549,
    commission: 955,
    netAmount: 8594,
    status: 'completed',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '2',
    bookingNumber: 'LUX-2024-0002',
    carName: 'Range Rover Vogue',
    customerName: 'Anjali Kapoor',
    tripType: 'Outstation (Delhi-Jaipur)',
    amount: 45999,
    commission: 4600,
    netAmount: 41399,
    status: 'completed',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '3',
    bookingNumber: 'LUX-2024-0003',
    carName: 'Rolls Royce Ghost',
    customerName: 'Ratan Mehta',
    tripType: 'Airport Pickup',
    amount: 25199,
    commission: 2520,
    netAmount: 22679,
    status: 'pending',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '4',
    bookingNumber: 'LUX-2024-0004',
    carName: 'BMW 7 Series',
    customerName: 'Priya Shah',
    tripType: 'Wedding Event',
    amount: 35000,
    commission: 3500,
    netAmount: 31500,
    status: 'processing',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export default function VendorLuxuryEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    setTimeout(() => {
      setSummary(SAMPLE_SUMMARY);
      setTransactions(SAMPLE_TRANSACTIONS);
      setIsLoading(false);
    }, 500);
  }, []);

  const growthPercent = summary
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
    : '0';
  const isPositiveGrowth = summary ? summary.thisMonth >= summary.lastMonth : true;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Luxury Earnings</h1>
            <p className="text-gray-600">Track your premium service revenue</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="all-time">All Time</option>
          </select>

          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 rounded-xl p-5 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-amber-300" />
            <span className="text-amber-200 text-sm">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold">₹{summary?.totalEarnings.toLocaleString()}</p>
          <p className="text-sm text-amber-200 mt-1">{summary?.completedTrips} luxury trips</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">This Month</span>
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                isPositiveGrowth ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositiveGrowth ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {growthPercent}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{summary?.thisMonth.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-gray-500 text-sm">Pending Payout</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">₹{summary?.pendingPayout.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 text-sm">Avg. per Trip</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{summary?.averagePerTrip.toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Booking</th>
                <th className="px-4 py-3 text-left">Car</th>
                <th className="px-4 py-3 text-left">Trip Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Commission (10%)</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-mono text-sm text-gray-900">#{tx.bookingNumber}</p>
                      <p className="text-xs text-gray-500">{tx.customerName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-900">{tx.carName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{tx.tripType}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-red-600">
                    -₹{tx.commission.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-green-600">
                    ₹{tx.netAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tx.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 text-center">
          <button className="text-amber-600 font-medium text-sm hover:underline">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-2">Payout Information</h3>
        <p className="text-sm text-amber-700">
          Payouts are processed every Monday. Completed trips from the previous week will be credited
          to your registered bank account within 2-3 business days. A 10% platform commission is
          deducted from each booking.
        </p>
      </div>
    </div>
  );
}
