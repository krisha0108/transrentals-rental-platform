'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  CalendarCheck,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Send,
  Inbox,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  Phone,
  Eye,
} from 'lucide-react';

// Mock P2P Activity Data
const mockActivity = [
  {
    id: '1',
    type: 'booking_received',
    direction: 'incoming',
    status: 'completed',
    date: '2024-02-12',
    description: 'Wedding Car - Mumbai to Pune',
    partnerVendor: {
      name: 'Royal Weddings',
      rating: 4.9,
      phone: '+91 9737965551',
    },
    vehicle: 'Mercedes E-Class',
    amount: 15000,
    commission: 1500,
    netAmount: 15000,
    tripDate: '2024-02-10',
    customerRating: 5,
    paymentStatus: 'received',
    paymentDate: '2024-02-12',
  },
  {
    id: '2',
    type: 'vehicle_shared',
    direction: 'outgoing',
    status: 'completed',
    date: '2024-02-10',
    description: 'Tempo Traveller - Pune to Mumbai (Empty Return)',
    partnerVendor: {
      name: 'Metro Tours',
      rating: 4.6,
      phone: '+91 9737965551',
    },
    vehicle: 'Force Traveller 12-Seater',
    amount: 3000,
    commission: 150,
    netAmount: 2850,
    tripDate: '2024-02-10',
    paymentStatus: 'received',
    paymentDate: '2024-02-11',
  },
  {
    id: '3',
    type: 'booking_shared',
    direction: 'outgoing',
    status: 'in_progress',
    date: '2024-02-13',
    description: 'Corporate Trip - Mumbai to Imagica',
    partnerVendor: {
      name: 'City Tours',
      rating: 4.8,
      phone: '+91 98765 43212',
    },
    vehicle: 'Tempo Traveller 17-Seater',
    amount: 9500,
    commission: 950,
    netAmount: 950,
    tripDate: '2024-02-15',
    paymentStatus: 'pending',
    paymentDate: null,
  },
  {
    id: '4',
    type: 'booking_received',
    direction: 'incoming',
    status: 'completed',
    date: '2024-02-08',
    description: 'Outstation Trip - Mumbai to Goa',
    partnerVendor: {
      name: 'Metro Cabs',
      rating: 4.4,
      phone: '+91 98765 43213',
    },
    vehicle: 'Innova Crysta',
    amount: 12000,
    commission: 1200,
    netAmount: 10800,
    tripDate: '2024-02-07',
    customerRating: 4,
    paymentStatus: 'received',
    paymentDate: '2024-02-09',
  },
  {
    id: '5',
    type: 'vehicle_shared',
    direction: 'outgoing',
    status: 'cancelled',
    date: '2024-02-05',
    description: 'Tata 407 - Nashik to Mumbai (Empty Return)',
    partnerVendor: {
      name: 'Sharma Transport',
      rating: 4.5,
      phone: '+91 98765 43214',
    },
    vehicle: 'Tata 407 14ft',
    amount: 4500,
    commission: 225,
    netAmount: 0,
    tripDate: '2024-02-06',
    paymentStatus: 'cancelled',
    paymentDate: null,
    cancellationReason: 'Partner cancelled - vehicle breakdown',
  },
  {
    id: '6',
    type: 'booking_received',
    direction: 'incoming',
    status: 'upcoming',
    date: '2024-02-13',
    description: 'Pilgrimage Tour - Mumbai to Shirdi',
    partnerVendor: {
      name: 'Shree Tours',
      rating: 4.6,
      phone: '+91 98765 43215',
    },
    vehicle: 'Volvo Bus 45-Seater',
    amount: 25000,
    commission: 2500,
    netAmount: 22500,
    tripDate: '2024-02-20',
    paymentStatus: 'pending',
    paymentDate: null,
  },
];

// Stats
const stats = {
  totalTransactions: 15,
  totalEarnings: 125000,
  totalPayouts: 85000,
  netProfit: 40000,
  vehiclesShared: 5,
  bookingsReceived: 8,
  bookingsShared: 2,
  avgRating: 4.7,
};

const statusColors: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  upcoming: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

export default function P2PActivityPage() {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredActivity = mockActivity.filter((activity) => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getActivityIcon = (type: string, direction: string) => {
    if (type === 'vehicle_shared') {
      return <Car className="w-5 h-5 text-blue-600" />;
    } else if (type === 'booking_received') {
      return <Inbox className="w-5 h-5 text-green-600" />;
    } else {
      return <Send className="w-5 h-5 text-purple-600" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'vehicle_shared':
        return 'Vehicle Shared';
      case 'booking_received':
        return 'Booking Received';
      case 'booking_shared':
        return 'Booking Shared';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/p2p"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">P2P Activity</h1>
            <p className="text-gray-600">Track all your P2P transactions</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">Total Earnings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalPayouts)}</p>
              <p className="text-xs text-gray-500">Total Payouts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.netProfit)}</p>
              <p className="text-xs text-gray-500">Net Profit</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-xs text-gray-500">P2P Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Vehicles Shared</p>
              <p className="text-2xl font-bold text-blue-900">{stats.vehiclesShared}</p>
            </div>
            <Car className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-xs text-blue-600 mt-2">Empty returns monetized</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Bookings Received</p>
              <p className="text-2xl font-bold text-green-900">{stats.bookingsReceived}</p>
            </div>
            <Inbox className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-xs text-green-600 mt-2">From other vendors</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Bookings Shared</p>
              <p className="text-2xl font-bold text-purple-900">{stats.bookingsShared}</p>
            </div>
            <Send className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xs text-purple-600 mt-2">Commission earned</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="vehicle_shared">Vehicle Shared</option>
            <option value="booking_received">Booking Received</option>
            <option value="booking_shared">Booking Shared</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="upcoming">Upcoming</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredActivity.map((activity) => {
            const status = statusColors[activity.status];
            const StatusIcon = status.icon;

            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${activity.type === 'vehicle_shared' ? 'bg-blue-100' :
                      activity.type === 'booking_received' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                      {getActivityIcon(activity.type, activity.direction)}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${activity.type === 'vehicle_shared' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'booking_received' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {getActivityLabel(activity.type)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.bg} ${status.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {activity.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-medium text-gray-900 mt-1">{activity.description}</h4>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Trip: {formatDate(activity.tripDate)}</span>
                        <span>•</span>
                        <span>Vehicle: {activity.vehicle}</span>
                      </div>

                      {/* Partner Info */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {activity.partnerVendor.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600">{activity.partnerVendor.name}</span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {activity.partnerVendor.rating}
                        </span>
                      </div>

                      {/* Cancellation reason */}
                      {activity.status === 'cancelled' && activity.cancellationReason && (
                        <p className="text-sm text-red-600 mt-2">
                          Reason: {activity.cancellationReason}
                        </p>
                      )}

                      {/* Customer Rating */}
                      {activity.customerRating && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-sm text-gray-500">Customer rated:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= activity.customerRating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {activity.direction === 'incoming' ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                      )}
                      <span className={`text-lg font-bold ${activity.status === 'cancelled' ? 'text-gray-400 line-through' :
                        activity.direction === 'incoming' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                        {formatCurrency(activity.netAmount)}
                      </span>
                    </div>
                    {activity.type === 'booking_shared' && (
                      <p className="text-xs text-gray-500">Commission earned</p>
                    )}
                    {activity.paymentStatus === 'received' && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Paid on {formatDate(activity.paymentDate!)}
                      </span>
                    )}
                    {activity.paymentStatus === 'pending' && activity.status !== 'cancelled' && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 mt-1">
                        <Clock className="w-3 h-3" />
                        Payment pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredActivity.length === 0 && (
          <div className="p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
