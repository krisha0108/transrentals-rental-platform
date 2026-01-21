'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Clock,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  _count: {
    documents: number;
    serviceRequests: number;
    locationRequests: number;
  };
}

export default function PendingVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingVendors = async () => {
    try {
      const statuses = ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'];
      const allVendors: Vendor[] = [];

      for (const status of statuses) {
        const res = await fetch(`/api/admin/vendors?status=${status}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          allVendors.push(...data.vendors);
        }
      }

      // Sort by createdAt
      allVendors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVendors(allVendors);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DOCUMENTS_PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'DOCUMENTS_PENDING':
        return 'Docs Pending';
      case 'UNDER_REVIEW':
        return 'Under Review';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Vendor Approvals</h1>
        <p className="text-gray-600">Review and approve vendor registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { status: 'PENDING', label: 'New Registrations', color: 'bg-yellow-500' },
          { status: 'DOCUMENTS_PENDING', label: 'Awaiting Documents', color: 'bg-orange-500' },
          { status: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-500' },
        ].map((item) => {
          const count = vendors.filter((v) => v.status === item.status).length;
          return (
            <div key={item.status} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendors List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm">All vendor registrations have been processed</p>
          </div>
        ) : (
          <div className="divide-y">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {vendor.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{vendor.businessName}</p>
                      <p className="text-sm text-gray-500">{vendor.ownerName} &bull; {vendor.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>Registered {formatDate(vendor.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {vendor._count.documents} docs
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                      {getStatusLabel(vendor.status)}
                    </span>
                    <Link href={`/admin/vendors/${vendor.id}`}>
                      <Button size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
