'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Building2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  isB2B: boolean;
  isActive: boolean;
  bookingsCount: number;
  quotesCount: number;
  totalSpent: number;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total: number;
  active: number;
  b2b: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, b2b: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCustomers = async (page: number, currentFilter: string, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (currentFilter !== 'all') params.append('filter', currentFilter);
      if (currentSearch) params.append('search', currentSearch);

      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(pagination.page, filter, search);
  }, [pagination.page, filter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 text-sm mt-0.5">All registered customers on TransRentals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.b2b.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500">B2B Customers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Customers</option>
              <option value="active">Active</option>
              <option value="b2b">B2B Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                            {customer.isB2B && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">B2B</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-0.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3" /> {customer.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      {customer.city || customer.state ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {[customer.city, customer.state].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Activity */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                          <span>{customer.bookingsCount} bookings</span>
                        </div>
                        {customer.quotesCount > 0 && (
                          <p className="text-xs text-blue-600">{customer.quotesCount} quote requests</p>
                        )}
                        {customer.totalSpent > 0 && (
                          <p className="text-xs text-emerald-600 font-medium">
                            {formatCurrency(customer.totalSpent)} spent
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(customer.createdAt)}
                      </div>
                      {customer.lastLoginAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last login: {formatDate(customer.lastLoginAt)}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
