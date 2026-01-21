'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  MapPin,
  Layers,
  Car,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Star,
  Loader2,
} from 'lucide-react';

interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  status: string;
  rejectionReason: string | null;
  rating: number | null;
  approvedServicesCount: number;
  approvedLocationsCount: number;
  fleetsCount: number;
}

export default function VendorDashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/vendor/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const vendorStatus = profile?.status || (session?.user as any)?.status;

  const getStatusSteps = () => {
    const steps = [
      { id: 1, name: 'Registration', status: 'completed' },
      { id: 2, name: 'Upload Documents', status: vendorStatus === 'DOCUMENTS_PENDING' ? 'current' : (vendorStatus === 'PENDING' ? 'pending' : 'completed') },
      { id: 3, name: 'Under Review', status: vendorStatus === 'UNDER_REVIEW' ? 'current' : (['APPROVED', 'REJECTED'].includes(vendorStatus) ? 'completed' : 'pending') },
      { id: 4, name: 'Approval', status: vendorStatus === 'APPROVED' ? 'completed' : (vendorStatus === 'REJECTED' ? 'rejected' : 'pending') },
    ];
    return steps;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DOCUMENTS_PENDING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const quickActions = [
    {
      name: 'Complete Profile',
      description: 'Add business details and logo',
      href: '/vendor/profile',
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Upload Documents',
      description: 'GST, PAN, and other documents',
      href: '/vendor/documents',
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      name: 'Request Services',
      description: 'Select services you offer',
      href: '/vendor/services/request',
      icon: Layers,
      color: 'bg-green-500',
    },
    {
      name: 'Request Locations',
      description: 'Select cities you operate in',
      href: '/vendor/locations/request',
      icon: MapPin,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {profile?.businessName || session?.user?.name || 'Vendor'}!
        </h1>
        <p className="text-blue-100">
          Manage your fleet, services, and grow your business with TransRentals.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendorStatus)} border`}>
            {vendorStatus?.replace(/_/g, ' ') || 'PENDING'}
          </span>
        </div>
      </div>

      {/* Status Progress (for non-approved vendors) */}
      {vendorStatus !== 'APPROVED' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Progress</h2>
          <div className="flex items-center justify-between">
            {getStatusSteps().map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-blue-500 text-white' :
                    step.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === 'current' ? (
                      <Clock className="w-5 h-5" />
                    ) : step.status === 'rejected' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center">{step.name}</span>
                </div>
                {index < getStatusSteps().length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Status Message */}
          <div className="mt-6">
            {vendorStatus === 'DOCUMENTS_PENDING' && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Documents Required</p>
                  <p className="text-sm text-orange-600">Please upload your business documents to proceed with verification.</p>
                  <Link href="/vendor/documents" className="text-sm text-orange-700 font-medium hover:underline mt-2 inline-flex items-center gap-1">
                    Upload Documents <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
            {vendorStatus === 'UNDER_REVIEW' && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Under Review</p>
                  <p className="text-sm text-blue-600">Your documents are being reviewed. This usually takes 1-2 business days.</p>
                </div>
              </div>
            )}
            {vendorStatus === 'REJECTED' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Application Rejected</p>
                  <p className="text-sm text-red-600">
                    {profile?.rejectionReason || 'Your application was rejected. Please contact support for more information.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
              {action.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats (for approved vendors) */}
      {vendorStatus === 'APPROVED' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.fleetsCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.approvedServicesCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Locations</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.approvedLocationsCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.rating?.toFixed(1) || '--'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started Guide</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <h4 className="font-medium text-gray-900">Complete Your Profile</h4>
              <p className="text-sm text-gray-600">Add your business details, logo, and contact information.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <h4 className="font-medium text-gray-900">Upload Documents</h4>
              <p className="text-sm text-gray-600">Upload GST certificate, PAN card, and business registration documents.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <h4 className="font-medium text-gray-900">Request Services & Locations</h4>
              <p className="text-sm text-gray-600">Select the services you offer and cities where you operate.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
            <div>
              <h4 className="font-medium text-gray-900">Add Your Fleet</h4>
              <p className="text-sm text-gray-600">Once approved, add your vehicles with photos and pricing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
