'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Car,
  Bike,
  Bus,
  MoreVertical,
  Filter,
  RefreshCw,
  MapPin,
  IndianRupee,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Fleet {
  id: string;
  name: string;
  slug: string;
  brand: string;
  vehicleType: string;
  basePrice: number;
  primaryImage: string | null;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  availabilityType: 'ALL_INDIA' | 'SPECIFIC_LOCATIONS';
  category: {
    id: string;
    name: string;
    slug: string;
  };
  locationRates: Array<{
    id: string;
    dailyRate: number;
    location: { name: string };
  }>;
  availability: Array<{
    id: string;
    isAvailable: boolean;
    location: { name: string };
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { vehicles: number };
}

export default function FleetManagementPage() {
  const [vehicles, setVehicles] = useState<Fleet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/fleet?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/fleet/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/fleet/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'bike':
        return <Bike className="w-4 h-4" />;
      case 'bus':
        return <Bus className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600">Manage your vehicles, rates, and availability</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/fleet/locations">
            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              Manage Locations
            </Button>
          </Link>
          <Link href="/admin/fleet/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total Vehicles</p>
            </div>
          </div>
        </div>
        {categories.slice(0, 3).map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getCategoryIcon(cat.slug)}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cat._count.vehicles}</p>
                <p className="text-sm text-gray-500">{cat.name}s</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button variant="outline" onClick={fetchVehicles}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first vehicle</p>
          <Link href="/admin/fleet/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {vehicle.primaryImage ? (
                  <img
                    src={vehicle.primaryImage}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center justify-center h-full w-full';
                      fallback.innerHTML = '<span class="text-gray-400 text-4xl">🚗</span>';
                      target.parentElement?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getCategoryIcon(vehicle.category.slug)}
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {vehicle.isFeatured && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  {!vehicle.isActive && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <div className="flex gap-1">
                    <Link href={`/admin/fleet/${vehicle.id}/edit`}>
                      <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id, vehicle.name)}
                      className="p-2 bg-white rounded-lg shadow hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  {getCategoryIcon(vehicle.category.slug)}
                  <span>{vehicle.category.name}</span>
                  <span>•</span>
                  <span>{vehicle.vehicleType}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{vehicle.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{vehicle.brand}</p>

                {/* Pricing */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <IndianRupee className="w-4 h-4" />
                    {vehicle.basePrice.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/day</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {vehicle.availabilityType === 'ALL_INDIA'
                      ? 'All India'
                      : `${vehicle.availability.length} locations`}
                  </div>
                </div>

                {/* Location Rates Preview */}
                {vehicle.locationRates.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Location Rates:</p>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.locationRates.slice(0, 3).map((rate) => (
                        <span
                          key={rate.id}
                          className="px-2 py-0.5 bg-gray-100 text-xs rounded"
                        >
                          {rate.location?.name || 'Unknown'}: ₹{rate.dailyRate}
                        </span>
                      ))}
                      {vehicle.locationRates.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-xs rounded">
                          +{vehicle.locationRates.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, total)} of {total} vehicles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
