'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Download,
  Filter,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  completedTrips: number;
  avgPerTrip: number;
}

interface EarningTransaction {
  id: string;
  bookingNumber: string;
  customerName: string;
  tripType: string;
  amount: number;
  status: string;
  completedAt: string;
}

export default function VendorCarRentalEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
    completedTrips: 0,
    avgPerTrip: 0,
  });
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      // Fetch completed bookings for earnings
      const response = await fetch(`/api/vendor/car-rental/bookings?status=COMPLETED`);
      const data = await response.json();

      if (data.success) {
        const completedBookings = data.bookings || [];

        // Calculate summary
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        const thisMonthEarnings = completedBookings
          .filter((b: any) => new Date(b.tripEndedAt || b.updatedAt) >= thisMonthStart)
          .reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        const lastMonthEarnings = completedBookings
          .filter((b: any) => {
            const date = new Date(b.tripEndedAt || b.updatedAt);
            return date >= lastMonthStart && date <= lastMonthEnd;
          })
          .reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0);

        setSummary({
          totalEarnings,
          thisMonth: thisMonthEarnings,
          lastMonth: lastMonthEarnings,
          pendingPayouts: 0, // TODO: Implement payout tracking
          completedTrips: completedBookings.length,
          avgPerTrip: completedBookings.length > 0 ? Math.round(totalEarnings / completedBookings.length) : 0,
        });

        // Set transactions
        setTransactions(completedBookings.map((b: any) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          tripType: b.tripType,
          amount: b.grandTotal,
          status: 'PAID',
          completedAt: b.tripEndedAt || b.updatedAt,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Car Rental Earnings</h1>
          <p className="text-gray-600">Track your earnings from car rental bookings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{summary.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{summary.thisMonth.toLocaleString()}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{summary.lastMonth.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Last Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{summary.pendingPayouts.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{summary.completedTrips}</p>
              <p className="text-xs text-gray-500">Completed Trips</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{summary.avgPerTrip.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Avg Per Trip</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No earnings yet</h3>
            <p className="text-sm text-gray-500">
              Complete trips to start earning
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm">{tx.bookingNumber}</span>
                    </td>
                    <td className="px-4 py-4 text-sm">{tx.customerName}</td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{tx.tripType.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-emerald-600">₹{tx.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(tx.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
