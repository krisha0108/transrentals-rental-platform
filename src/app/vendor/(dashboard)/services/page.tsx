'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Car,
  Truck,
  Bike,
  Package,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface ServiceRequest {
  id: string;
  serviceId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string | null;
  rejectionReason: string | null;
  createdAt: string;
  services: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function VendorServicesPage() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/vendor/services');
      if (res.ok) {
        const data = await res.json();
        setAllServices(data.allServices || []);
        setApprovedServiceIds(data.approvedServiceIds || []);
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get approved services with details
  const approvedServices = allServices.filter(s => approvedServiceIds.includes(s.id));

  // Get service icon based on slug
  const getServiceIcon = (slug: string) => {
    if (slug?.includes('car') || slug?.includes('chauffeur')) return <Car className="w-5 h-5" />;
    if (slug?.includes('truck') || slug?.includes('packers')) return <Truck className="w-5 h-5" />;
    if (slug?.includes('bike')) return <Bike className="w-5 h-5" />;
    if (slug?.includes('luxury')) return <Crown className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600">Services you are approved to offer</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/vendor/services/request">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Request Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedServiceIds.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Services */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Approved Services</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : approvedServices.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approved services yet</h3>
            <p className="text-gray-500 mb-4">Request services to start offering them</p>
            <Link href="/vendor/services/request">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Service
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {approvedServices.map((service) => (
              <div key={service.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {getServiceIcon(service.slug)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending/Rejected Requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Service Requests</h3>
          </div>

          <div className="divide-y">
            {requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {getServiceIcon(request.services?.slug)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{request.services?.name || 'Unknown Service'}</h4>
                      <p className="text-sm text-gray-500">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {request.status === 'REJECTED' && request.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {request.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
