'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Truck,
  Download,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  Wallet,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayout: number;
  completedJobs: number;
  averagePerJob: number;
}

interface Transaction {
  id: string;
  bookingNumber: string;
  customerName: string;
  loadType: string;
  route: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'processing';
  date: string;
}

const SAMPLE_SUMMARY: EarningsSummary = {
  totalEarnings: 1250000,
  thisMonth: 185000,
  lastMonth: 165000,
  pendingPayout: 72500,
  completedJobs: 58,
  averagePerJob: 21551,
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    bookingNumber: 'TR-BK-2024-0002',
    customerName: 'Steel India Ltd',
    loadType: 'Full Load',
    route: 'Jamshedpur → Delhi',
    amount: 85000,
    commission: 8500,
    netAmount: 76500,
    status: 'completed',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '2',
    bookingNumber: 'TR-BK-2024-0001',
    customerName: 'TechImports Pvt Ltd',
    loadType: 'Container',
    route: 'Chennai → Bangalore',
    amount: 45000,
    commission: 4500,
    netAmount: 40500,
    status: 'pending',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
];

export default function VendorTransporterEarningsPage() {
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
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transporter Earnings</h1>
            <p className="text-gray-600">Track your logistics revenue</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
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
        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-5 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-indigo-200" />
            <span className="text-indigo-100 text-sm">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold">₹{summary?.totalEarnings.toLocaleString()}</p>
          <p className="text-sm text-indigo-200 mt-1">{summary?.completedJobs} shipments delivered</p>
        </div>

        <div className="bg-white rounded-xl p-5 border">
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

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-500 text-sm">Pending Payout</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">₹{summary?.pendingPayout.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 text-sm">Avg. per Shipment</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{summary?.averagePerJob.toLocaleString()}</p>
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
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Route</th>
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
                      <p className="text-xs text-gray-500">{tx.loadType}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{tx.customerName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-900">{tx.route}</p>
                  </td>
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
                          ? 'bg-yellow-100 text-yellow-700'
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
          <button className="text-indigo-600 font-medium text-sm hover:underline">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 mb-2">Payout Information</h3>
        <p className="text-sm text-indigo-700">
          Payouts are processed every Monday. Delivered shipments from the previous week will be credited
          to your registered bank account within 2-3 business days. A 10% platform commission is
          deducted from each booking.
        </p>
      </div>
    </div>
  );
}
