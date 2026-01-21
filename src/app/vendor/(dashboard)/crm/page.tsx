'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Tag,
  Eye,
  Edit,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Crown,
  Building2,
  User,
  Clock,
  IndianRupee,
  Gift,
  MoreVertical,
} from 'lucide-react';

// Mock customers data
const mockCustomers = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@email.com',
    type: 'individual',
    tags: ['VIP', 'Frequent'],
    totalBookings: 24,
    totalSpent: 185000,
    lastBooking: '2024-02-10',
    joinedDate: '2022-06-15',
    address: 'Andheri West, Mumbai',
    rating: 4.8,
    notes: 'Prefers sedan cars. Always tips well.',
    upcomingBookings: 1,
    birthday: '1985-03-15',
  },
  {
    id: '2',
    name: 'TechCorp Solutions Pvt Ltd',
    phone: '+91 98765 43211',
    email: 'travel@techcorp.com',
    type: 'corporate',
    tags: ['Corporate', 'Monthly Contract'],
    totalBookings: 156,
    totalSpent: 1250000,
    lastBooking: '2024-02-12',
    joinedDate: '2021-01-10',
    address: 'BKC, Mumbai',
    rating: 4.9,
    notes: 'Monthly billing. Contact: Priya (HR)',
    upcomingBookings: 5,
    contactPerson: 'Priya Mehta',
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '+91 98765 43212',
    email: 'amit.patel@email.com',
    type: 'individual',
    tags: ['Regular'],
    totalBookings: 8,
    totalSpent: 42000,
    lastBooking: '2024-01-25',
    joinedDate: '2023-03-20',
    address: 'Powai, Mumbai',
    rating: 4.5,
    notes: '',
    upcomingBookings: 0,
    birthday: '1990-08-22',
  },
  {
    id: '4',
    name: 'Wedding Planners Inc',
    phone: '+91 98765 43213',
    email: 'bookings@weddingplanners.com',
    type: 'corporate',
    tags: ['Wedding Partner', 'Premium'],
    totalBookings: 45,
    totalSpent: 890000,
    lastBooking: '2024-02-08',
    joinedDate: '2022-11-05',
    address: 'Bandra, Mumbai',
    rating: 4.7,
    notes: 'Wedding season bulk bookings. Negotiated 15% discount.',
    upcomingBookings: 3,
    contactPerson: 'Sneha Kapoor',
  },
  {
    id: '5',
    name: 'Priya Desai',
    phone: '+91 98765 43214',
    email: 'priya.desai@email.com',
    type: 'individual',
    tags: ['New'],
    totalBookings: 2,
    totalSpent: 8500,
    lastBooking: '2024-02-05',
    joinedDate: '2024-01-15',
    address: 'Thane, Mumbai',
    rating: 5.0,
    notes: 'Referred by Rahul Sharma',
    upcomingBookings: 0,
    birthday: '1992-12-10',
  },
];

// Stats
const stats = {
  totalCustomers: 245,
  newThisMonth: 18,
  corporateCustomers: 32,
  vipCustomers: 15,
  totalRevenue: 4850000,
  avgBookingsPerCustomer: 8.5,
};

const tagColors: Record<string, string> = {
  VIP: 'bg-yellow-100 text-yellow-800',
  Frequent: 'bg-blue-100 text-blue-800',
  Corporate: 'bg-purple-100 text-purple-800',
  'Monthly Contract': 'bg-green-100 text-green-800',
  Regular: 'bg-gray-100 text-gray-800',
  'Wedding Partner': 'bg-pink-100 text-pink-800',
  Premium: 'bg-indigo-100 text-indigo-800',
  New: 'bg-teal-100 text-teal-800',
};

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || customer.type === filterType;
    const matchesTag = filterTag === 'all' || customer.tags.includes(filterTag);
    return matchesSearch && matchesType && matchesTag;
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysTillBirthday = (birthday: string) => {
    const today = new Date();
    const bday = new Date(birthday);
    bday.setFullYear(today.getFullYear());
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer CRM</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendor/crm/import"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <UserPlus className="w-5 h-5" />
            Import
          </Link>
          <Link
            href="/vendor/crm/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
              <p className="text-xs text-gray-500">New This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.corporateCustomers}</p>
              <p className="text-xs text-gray-500">Corporate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.vipCustomers}</p>
              <p className="text-xs text-gray-500">VIP Customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgBookingsPerCustomer}</p>
              <p className="text-xs text-gray-500">Avg Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays */}
      {mockCustomers.filter(c => c.birthday && getDaysTillBirthday(c.birthday) <= 7).length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-pink-900">Upcoming Birthdays</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto">
            {mockCustomers
              .filter(c => c.birthday && getDaysTillBirthday(c.birthday) <= 7)
              .map(customer => (
                <div key={customer.id} className="flex items-center gap-3 bg-white rounded-lg p-3 min-w-[200px]">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-pink-600">
                      {getDaysTillBirthday(customer.birthday!) === 0 ? 'Today!' :
                       `In ${getDaysTillBirthday(customer.birthday!)} days`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
          </select>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tags</option>
            <option value="VIP">VIP</option>
            <option value="Corporate">Corporate</option>
            <option value="Frequent">Frequent</option>
            <option value="New">New</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Booking</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        customer.type === 'corporate' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {customer.type === 'corporate' ? <Building2 className="w-5 h-5" /> : customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {customer.rating}
                          {customer.upcomingBookings > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              {customer.upcomingBookings} upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{customer.phone}</p>
                      <p className="text-gray-500">{customer.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    {customer.totalBookings}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-green-600">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDate(customer.lastBooking)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <a
                        href={`tel:${customer.phone}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Call"
                      >
                        <Phone className="w-4 h-4 text-gray-600" />
                      </a>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    selectedCustomer.type === 'corporate' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {selectedCustomer.type === 'corporate' ? <Building2 className="w-7 h-7" /> : selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedCustomer.tags.map((tag) => (
                        <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[tag]}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedCustomer.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Customer Since</p>
                    <p className="font-medium">{formatDate(selectedCustomer.joinedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalBookings}</p>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <p className="text-2xl font-bold text-gray-900">{selectedCustomer.rating}</p>
                  </div>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedCustomer.upcomingBookings}</p>
                  <p className="text-sm text-gray-600">Upcoming</p>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-900">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp
                </button>
                <Link
                  href={`/vendor/crm/${selectedCustomer.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
