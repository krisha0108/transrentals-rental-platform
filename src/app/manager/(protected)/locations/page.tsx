'use client';

import React, { useEffect, useState } from 'react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import {
  Loader2,
  MapPin,
  AlertCircle,
  Building2,
  Users,
  Bike,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
  type: string;
  state?: string;
  isActive: boolean;
}

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  status: string;
  isActive: boolean;
  location?: {
    id: string;
    name: string;
  };
}

interface ManagerData {
  assignedLocations: Location[];
  assignedServices: { id: string; name: string }[];
}

export default function ManagerLocationsPage() {
  const [managerData, setManagerData] = useState<ManagerData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/manager/dashboard');
      const data = await response.json();

      if (data.success) {
        setManagerData({
          assignedLocations: data.manager?.assignedLocations || [],
          assignedServices: data.manager?.assignedServices || [],
        });
        setVendors(data.vendors || []);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  useManagerPageHeader(
    'My Locations',
    'View your assigned locations and vendors',
    <button
      key="refresh"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh"
      className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );

  const getVendorsByLocation = (locationId: string) => {
    return vendors.filter((v: any) =>
      v.vendor_approved_locations?.some((al: any) => al.locationId === locationId)
    );
  };

  const getLocationStats = (locationId: string) => {
    const locationVendors = getVendorsByLocation(locationId);
    return {
      totalVendors: locationVendors.length,
      activeVendors: locationVendors.filter((v) => v.isActive && v.status === 'APPROVED').length,
      pendingVendors: locationVendors.filter((v) => v.status === 'PENDING').length,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your locations...</p>
        </div>
      </div>
    );
  }

  const locations = managerData?.assignedLocations || [];
  const services = managerData?.assignedServices || [];

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              <p className="text-sm text-gray-500">Assigned Locations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-sm text-gray-500">Assigned Services</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
              <p className="text-sm text-gray-500">Total Vendors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Services */}
      {services.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Assigned Services</h2>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service.id}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
              >
                {service.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Assigned Locations</h2>
        </div>

        {locations.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations assigned</h3>
            <p className="text-gray-500">Contact admin to get locations assigned to your account</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {locations.map((location) => {
              const stats = getLocationStats(location.id);
              const isExpanded = selectedLocation === location.id;
              const locationVendors = getVendorsByLocation(location.id);

              return (
                <div key={location.id}>
                  <button
                    onClick={() => setSelectedLocation(isExpanded ? null : location.id)}
                    className="w-full p-5 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500 capitalize">{location.type}</span>
                            {location.state && (
                              <span className="text-sm text-gray-400">| {location.state}</span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                location.isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {location.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-900">{stats.totalVendors}</span> vendors
                          </p>
                          <p className="text-xs text-gray-400">
                            {stats.activeVendors} active, {stats.pendingVendors} pending
                          </p>
                        </div>
                        <ExternalLink
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded vendor list */}
                  {isExpanded && locationVendors.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100 p-5">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">
                        Vendors in {location.name}
                      </h4>
                      <div className="space-y-3">
                        {locationVendors.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="bg-white rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Bike className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{vendor.businessName}</p>
                                  <p className="text-sm text-gray-500">{vendor.ownerName}</p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  vendor.status === 'APPROVED' && vendor.isActive
                                    ? 'bg-green-50 text-green-700'
                                    : vendor.status === 'PENDING'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {vendor.status === 'APPROVED' && vendor.isActive
                                  ? 'Active'
                                  : vendor.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {vendor.phone}
                              </span>
                              {vendor.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  {vendor.email}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && locationVendors.length === 0 && (
                    <div className="bg-gray-50 border-t border-gray-100 p-8 text-center">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No vendors registered in this location</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
