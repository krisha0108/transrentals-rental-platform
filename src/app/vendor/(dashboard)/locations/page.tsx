'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  slug: string;
  type?: string;
  locations?: { name: string } | null; // parent location
}

interface LocationRequest {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  locations: Location; // API returns 'locations' not 'location'
}

interface ApprovedLocation {
  id: string;
  isActive: boolean;
  locationId: string;
  locations: Location; // API returns 'locations' not 'location'
}

export default function VendorLocationsPage() {
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [approvedLocations, setApprovedLocations] = useState<ApprovedLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/vendor/locations');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setApprovedLocations(data.approvedLocations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const pendingRequests = (requests || []).filter((r) => r?.status === 'PENDING');
  const rejectedRequests = (requests || []).filter((r) => r?.status === 'REJECTED');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Locations</h1>
          <p className="text-gray-600">Manage your operational locations</p>
        </div>
        <Link href="/vendor/locations/request">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Location
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(approvedLocations || []).length}</p>
              <p className="text-sm text-gray-600">Approved Locations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejectedRequests.length}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Locations */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-green-50 border-b">
          <h2 className="font-semibold text-green-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Approved Locations ({(approvedLocations || []).length})
          </h2>
        </div>
        {(approvedLocations || []).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No approved locations yet</p>
            <Link href="/vendor/locations/request">
              <Button variant="outline" className="mt-4">
                Request Your First Location
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {(approvedLocations || []).map((item) => {
              const loc = item.locations;
              const parentLoc = loc?.locations;
              return (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg"
                >
                  <MapPin className="w-4 h-4" />
                  {loc?.name || 'Unknown'}
                  {parentLoc?.name && (
                    <span className="text-green-600">({parentLoc.name})</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-yellow-50 border-b">
            <h2 className="font-semibold text-yellow-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="divide-y">
            {pendingRequests.map((request) => {
              const loc = request.locations;
              const parentLoc = loc?.locations;
              return (
                <div key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {loc?.name || 'Unknown'}
                        {parentLoc?.name && (
                          <span className="text-gray-500 ml-1">
                            ({parentLoc.name})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Pending Review
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-red-50 border-b">
            <h2 className="font-semibold text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Rejected Requests ({rejectedRequests.length})
            </h2>
          </div>
          <div className="divide-y">
            {rejectedRequests.map((request) => {
              const loc = request.locations;
              const parentLoc = loc?.locations;
              return (
                <div key={request.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {loc?.name || 'Unknown'}
                        {parentLoc?.name && (
                          <span className="text-gray-500 ml-1">
                            ({parentLoc.name})
                          </span>
                        )}
                      </p>
                      {request.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Rejected on {request.reviewedAt ? formatDate(request.reviewedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
