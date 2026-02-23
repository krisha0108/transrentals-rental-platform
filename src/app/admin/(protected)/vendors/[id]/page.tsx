'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  Eye,
  Download,
  Car,
  Calendar,
  User,
  Loader2,
  Shield,
  ThumbsUp,
  ThumbsDown,
  X,
  ExternalLink,
  CheckSquare,
  XSquare,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Percent,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
  verifiedBy: { id: string; name: string; email: string } | null;
  rejectionReason: string | null;
}

interface ServiceRequest {
  id: string;
  status: string;
  message: string | null;
  experience: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  rejectionReason: string | null;
  service: { id: string; name: string; slug: string };
}

interface LocationRequest {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  rejectionReason: string | null;
  location: { id: string; name: string; slug: string; parentId: string | null; parent: { name: string } | null };
}

interface ApprovedService {
  id: string;
  isActive: boolean;
  commissionPercent: number;
  service: { id: string; name: string };
}

interface ApprovedLocation {
  id: string;
  isActive: boolean;
  location: { id: string; name: string; parent: { name: string } | null };
}

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: { id: string; name: string; email: string } | null;
  documents: VendorDocument[];
  serviceRequests: ServiceRequest[];
  locationRequests: LocationRequest[];
  approvedServices: ApprovedService[];
  approvedLocations: ApprovedLocation[];
  _count: { fleets: number };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  DOCUMENTS_PENDING: { label: 'Documents Pending', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100' },
  SUSPENDED: { label: 'Suspended', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  BLOCKED: { label: 'Blocked', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const documentTypeLabels: Record<string, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  BUSINESS_REGISTRATION: 'Business Registration',
  ADDRESS_PROOF: 'Address Proof',
  BANK_DETAILS: 'Bank Details',
  CANCELLED_CHEQUE: 'Cancelled Cheque',
  OWNER_AADHAAR: 'Owner Aadhaar',
  OWNER_PAN: 'Owner PAN',
  AADHAAR_CARD: 'Aadhaar Card',
  BUSINESS_LICENSE: 'Business License',
  RC_BOOK: 'RC Book',
  INSURANCE: 'Insurance',
  OTHER: 'Other Document',
};

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'services' | 'locations'>('overview');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: string; id?: string } | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<VendorDocument | null>(null);
  const [documentPreviewError, setDocumentPreviewError] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(true);

  // Commission modal state
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionTarget, setCommissionTarget] = useState<{ requestId: string; serviceName: string } | null>(null);
  const [commissionInput, setCommissionInput] = useState('0');
  // Inline edit commission state for approved services
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [editingCommissionValue, setEditingCommissionValue] = useState('');

  // Check if document URL is accessible
  useEffect(() => {
    if (selectedDocument) {
      setDocumentLoading(true);
      setDocumentPreviewError(false);

      // Check if URL exists by making a HEAD request
      fetch(selectedDocument.documentUrl, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) {
            setDocumentPreviewError(true);
          }
          setDocumentLoading(false);
        })
        .catch(() => {
          setDocumentPreviewError(true);
          setDocumentLoading(false);
        });
    }
  }, [selectedDocument]);

  const fetchVendor = async () => {
    try {
      const res = await fetch(`/api/admin/vendors/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVendor(data);
      } else {
        router.push('/admin/vendors');
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const handleVendorAction = async (action: string, reason?: string) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleServiceAction = async (requestId: string, action: string, reason?: string, commissionPercent?: number) => {
    setActionLoading(`service-${requestId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, rejectionReason: reason, commissionPercent }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
        setShowCommissionModal(false);
        setCommissionTarget(null);
        setCommissionInput('0');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCommission = async (approvedServiceId: string) => {
    setActionLoading(`commission-${approvedServiceId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedServiceId, commissionPercent: parseFloat(editingCommissionValue) || 0 }),
      });
      if (res.ok) {
        await fetchVendor();
        setEditingCommissionId(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update commission');
      }
    } catch (error) {
      console.error('Update commission failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLocationAction = async (requestId: string, action: string, reason?: string) => {
    setActionLoading(`location-${requestId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, rejectionReason: reason }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocumentAction = async (documentId: string, action: string, reason?: string) => {
    setActionLoading(`document-${documentId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action, rejectionReason: reason }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk action handlers
  const handleBulkDocumentAction = async (action: string, reason?: string) => {
    const pendingDocs = vendor?.documents.filter((d) => d.status === 'PENDING') || [];
    if (pendingDocs.length === 0) return;

    setActionLoading('bulk-document');
    try {
      const res = await fetch(`/api/admin/vendors/${id}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          documentIds: pendingDocs.map((d) => d.id),
          action,
          rejectionReason: reason,
        }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkServiceAction = async (action: string, reason?: string) => {
    const pendingServices = vendor?.serviceRequests.filter((s) => s.status === 'PENDING') || [];
    if (pendingServices.length === 0) return;

    setActionLoading('bulk-service');
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          requestIds: pendingServices.map((s) => s.id),
          action,
          rejectionReason: reason,
        }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkLocationAction = async (action: string, reason?: string) => {
    const pendingLocations = vendor?.locationRequests.filter((l) => l.status === 'PENDING') || [];
    if (pendingLocations.length === 0) return;

    setActionLoading('bulk-location');
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          requestIds: pendingLocations.map((l) => l.id),
          action,
          rejectionReason: reason,
        }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cascading location approval/rejection (parent with children)
  const handleLocationActionWithCascade = async (requestId: string, action: string, reason?: string, cascade: boolean = false) => {
    setActionLoading(`location-${requestId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, rejectionReason: reason, cascadeChildren: cascade }),
      });

      if (res.ok) {
        await fetchVendor();
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (type: string, id?: string) => {
    setRejectTarget({ type, id });
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectionReason.trim()) return;

    if (rejectTarget.type === 'vendor') {
      handleVendorAction('REJECT', rejectionReason);
    } else if (rejectTarget.type === 'service' && rejectTarget.id) {
      handleServiceAction(rejectTarget.id, 'REJECT', rejectionReason);
    } else if (rejectTarget.type === 'location' && rejectTarget.id) {
      handleLocationAction(rejectTarget.id, 'REJECT', rejectionReason);
    } else if (rejectTarget.type === 'document' && rejectTarget.id) {
      handleDocumentAction(rejectTarget.id, 'REJECT', rejectionReason);
    } else if (rejectTarget.type === 'bulk-document') {
      handleBulkDocumentAction('REJECT_ALL', rejectionReason);
    } else if (rejectTarget.type === 'bulk-service') {
      handleBulkServiceAction('REJECT_ALL', rejectionReason);
    } else if (rejectTarget.type === 'bulk-location') {
      handleBulkLocationAction('REJECT_ALL', rejectionReason);
    } else if (rejectTarget.type === 'location-cascade' && rejectTarget.id) {
      handleLocationActionWithCascade(rejectTarget.id, 'REJECT', rejectionReason, true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    );
  }

  const statusInfo = statusConfig[vendor.status] || statusConfig.PENDING;
  const pendingServiceRequests = vendor.serviceRequests.filter((r) => r.status === 'PENDING');
  const pendingLocationRequests = vendor.locationRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-gray-600">Vendor ID: {vendor.id}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {vendor.status === 'UNDER_REVIEW' && (
            <>
              <Button
                onClick={() => handleVendorAction('APPROVE')}
                disabled={!!actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'APPROVE' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve Vendor
              </Button>
              <Button
                variant="destructive"
                onClick={() => openRejectModal('vendor')}
                disabled={!!actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {vendor.status === 'APPROVED' && (
            <Button
              variant="outline"
              onClick={() => handleVendorAction('SUSPEND')}
              disabled={!!actionLoading}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}
          {vendor.status === 'SUSPENDED' && (
            <Button
              onClick={() => handleVendorAction('UNSUSPEND')}
              disabled={!!actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Unsuspend
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Store },
            { id: 'documents', label: 'Documents', icon: FileText, count: vendor.documents.length },
            { id: 'services', label: 'Services', icon: Layers, count: pendingServiceRequests.length },
            { id: 'locations', label: 'Locations', icon: MapPin, count: pendingLocationRequests.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Business Name</label>
                  <p className="font-medium text-gray-900">{vendor.businessName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Owner Name</label>
                  <p className="font-medium text-gray-900">{vendor.ownerName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {vendor.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {vendor.phone}
                  </p>
                </div>
                {vendor.address && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}
                    </p>
                  </div>
                )}
                {vendor.gstNumber && (
                  <div>
                    <label className="text-sm text-gray-500">GST Number</label>
                    <p className="font-medium text-gray-900">{vendor.gstNumber}</p>
                  </div>
                )}
                {vendor.panNumber && (
                  <div>
                    <label className="text-sm text-gray-500">PAN Number</label>
                    <p className="font-medium text-gray-900">{vendor.panNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Registered</p>
                    <p className="text-sm text-gray-500">{formatDate(vendor.createdAt)}</p>
                  </div>
                </div>
                {vendor.approvedAt && vendor.approvedBy && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Approved</p>
                      <p className="text-sm text-gray-500">
                        by {vendor.approvedBy.name} on {formatDate(vendor.approvedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {vendor.status === 'REJECTED' && vendor.rejectionReason && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Rejected</p>
                      <p className="text-sm text-gray-500">Reason: {vendor.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </span>
                  <span className="font-semibold">{vendor.documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Approved Services
                  </span>
                  <span className="font-semibold">{vendor.approvedServices.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Approved Locations
                  </span>
                  <span className="font-semibold">{vendor.approvedLocations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Fleet Vehicles
                  </span>
                  <span className="font-semibold">{vendor._count.fleets}</span>
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            {(pendingServiceRequests.length > 0 || pendingLocationRequests.length > 0) && (
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Requests
                </h3>
                {pendingServiceRequests.length > 0 && (
                  <p className="text-yellow-700 text-sm mb-2">
                    {pendingServiceRequests.length} service request(s) awaiting approval
                  </p>
                )}
                {pendingLocationRequests.length > 0 && (
                  <p className="text-yellow-700 text-sm">
                    {pendingLocationRequests.length} location request(s) awaiting approval
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Bulk Action Buttons */}
          {vendor.documents.filter((d) => d.status === 'PENDING').length > 0 && (
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {vendor.documents.filter((d) => d.status === 'PENDING').length} pending document(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkDocumentAction('APPROVE_ALL')}
                  disabled={!!actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'bulk-document' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  )}
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openRejectModal('bulk-document')}
                  disabled={!!actionLoading}
                >
                  <XSquare className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
              </div>
            </div>
          )}
          {vendor.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <FileText className="w-12 h-12 mb-4" />
              <p>No documents uploaded</p>
            </div>
          ) : (
            <div className="divide-y">
              {vendor.documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {documentTypeLabels[doc.documentType] || doc.documentType.replace(/_/g, ' ')}
                        </p>
                        {doc.documentNumber && (
                          <p className="text-xs text-gray-500">Number: {doc.documentNumber}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        title="View Document"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {doc.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleDocumentAction(doc.id, 'APPROVE')}
                            disabled={!!actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === `document-${doc.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectModal('document', doc.id)}
                            disabled={!!actionLoading}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {doc.status === 'REJECTED' && doc.rejectionReason && (
                    <div className="mt-3 ml-16 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </p>
                    </div>
                  )}
                  {doc.status === 'APPROVED' && doc.verifiedBy && doc.verifiedAt && (
                    <div className="mt-2 ml-16 text-xs text-gray-500">
                      Verified by {doc.verifiedBy.name} on {formatDate(doc.verifiedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Pending Service Requests */}
          {pendingServiceRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-yellow-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Service Requests ({pendingServiceRequests.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkServiceAction('APPROVE_ALL')}
                    disabled={!!actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === 'bulk-service' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    )}
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openRejectModal('bulk-service')}
                    disabled={!!actionLoading}
                  >
                    <XSquare className="w-4 h-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {pendingServiceRequests.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.service.name}</p>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Why:</strong> {request.message}
                          </p>
                        )}
                        {request.experience && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Experience:</strong> {request.experience}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Requested {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setCommissionTarget({ requestId: request.id, serviceName: request.service.name });
                            setCommissionInput('0');
                            setShowCommissionModal(true);
                          }}
                          disabled={!!actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === `service-${request.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectModal('service', request.id)}
                          disabled={!!actionLoading}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Services */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 bg-green-50 border-b">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approved Services ({vendor.approvedServices.length})
              </h3>
            </div>
            {vendor.approvedServices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No approved services yet
              </div>
            ) : (
              <div className="divide-y">
                {vendor.approvedServices.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{item.service.name}</span>
                      {!item.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {editingCommissionId === item.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editingCommissionValue}
                              onChange={(e) => setEditingCommissionValue(e.target.value)}
                              className="w-20 px-2 py-1 pr-6 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCommission(item.id)}
                            disabled={!!actionLoading}
                            className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs"
                          >
                            {actionLoading === `commission-${item.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : 'Save'}
                          </Button>
                          <button
                            onClick={() => setEditingCommissionId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.commissionPercent > 0
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Percent className="w-3 h-3" />
                            {item.commissionPercent > 0 ? `${item.commissionPercent}% commission` : 'No commission set'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCommissionId(item.id);
                              setEditingCommissionValue(String(item.commissionPercent));
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit commission %"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Service Requests History */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Request History</h3>
            </div>
            <div className="divide-y">
              {vendor.serviceRequests
                .filter((r) => r.status !== 'PENDING')
                .map((request) => (
                  <div key={request.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{request.service.name}</p>
                      {request.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                      {request.reviewedBy && request.reviewedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Reviewed by {request.reviewedBy.name} on {formatDate(request.reviewedAt)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="space-y-6">
          {/* Pending Location Requests - Hierarchical View */}
          {pendingLocationRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-yellow-50 border-b flex items-center justify-between">
                <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Location Requests ({pendingLocationRequests.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkLocationAction('APPROVE_ALL')}
                    disabled={!!actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === 'bulk-location' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    )}
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openRejectModal('bulk-location')}
                    disabled={!!actionLoading}
                  >
                    <XSquare className="w-4 h-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {/* Group locations by parent for hierarchical display */}
                {(() => {
                  // Separate parent (no parentId) and child locations
                  const parentLocations = pendingLocationRequests.filter((r) => !r.location.parentId);
                  const childLocations = pendingLocationRequests.filter((r) => r.location.parentId);

                  // Group children by parent name for display
                  const childrenByParent: Record<string, typeof pendingLocationRequests> = {};
                  childLocations.forEach((child) => {
                    const parentName = child.location.parent?.name || 'Other';
                    if (!childrenByParent[parentName]) {
                      childrenByParent[parentName] = [];
                    }
                    childrenByParent[parentName].push(child);
                  });

                  // Check if a parent location has pending children
                  const getChildCount = (parentName: string) => {
                    return childrenByParent[parentName]?.length || 0;
                  };

                  return (
                    <>
                      {/* Parent locations (states/regions) */}
                      {parentLocations.map((request) => {
                        const childCount = getChildCount(request.location.name);
                        return (
                          <div key={request.id} className="p-4 bg-blue-50/50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <FolderTree className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                                    {request.location.name}
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      Parent Location
                                    </span>
                                  </p>
                                  {request.message && (
                                    <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">
                                    Requested {formatDate(request.createdAt)}
                                  </p>
                                  {childCount > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      + {childCount} child location(s) pending
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleLocationAction(request.id, 'APPROVE')}
                                    disabled={!!actionLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="Approve this location only"
                                  >
                                    {actionLoading === `location-${request.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ThumbsUp className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectModal('location', request.id)}
                                    disabled={!!actionLoading}
                                    title="Reject this location only"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </Button>
                                </div>
                                {childCount > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLocationActionWithCascade(request.id, 'APPROVE', undefined, true)}
                                      disabled={!!actionLoading}
                                      className="text-green-600 border-green-600 hover:bg-green-50 text-xs"
                                      title="Approve this + all children"
                                    >
                                      <ChevronDown className="w-3 h-3 mr-1" />
                                      + Children
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openRejectModal('location-cascade', request.id)}
                                      disabled={!!actionLoading}
                                      className="text-red-600 border-red-600 hover:bg-red-50 text-xs"
                                      title="Reject this + all children"
                                    >
                                      <ChevronDown className="w-3 h-3 mr-1" />
                                      + Children
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Child locations grouped by parent */}
                      {Object.entries(childrenByParent).map(([parentName, children]) => (
                        <div key={parentName}>
                          <div className="px-4 py-2 bg-gray-100 border-y text-sm font-medium text-gray-600 flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            {parentName}
                            <span className="text-xs text-gray-500">({children.length} location(s))</span>
                          </div>
                          {children.map((request) => (
                            <div key={request.id} className="p-4 pl-10">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {request.location.name}
                                    </p>
                                    {request.message && (
                                      <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                      Requested {formatDate(request.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleLocationAction(request.id, 'APPROVE')}
                                    disabled={!!actionLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {actionLoading === `location-${request.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ThumbsUp className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectModal('location', request.id)}
                                    disabled={!!actionLoading}
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Approved Locations */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 bg-green-50 border-b">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approved Locations ({vendor.approvedLocations.length})
              </h3>
            </div>
            {vendor.approvedLocations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No approved locations yet
              </div>
            ) : (
              <div className="p-4 flex flex-wrap gap-2">
                {vendor.approvedLocations.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {item.location.name}
                    {item.location.parent && (
                      <span className="text-green-600 ml-1">({item.location.parent.name})</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* All Location Requests History */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Request History</h3>
            </div>
            <div className="divide-y">
              {vendor.locationRequests
                .filter((r) => r.status !== 'PENDING')
                .map((request) => (
                  <div key={request.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.location.name}
                        {request.location.parent && (
                          <span className="text-gray-500 ml-1">
                            ({request.location.parent.name})
                          </span>
                        )}
                      </p>
                      {request.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                      {request.reviewedBy && request.reviewedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Reviewed by {request.reviewedBy.name} on {formatDate(request.reviewedAt)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Commission Approval Modal */}
      {showCommissionModal && commissionTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Approve Service</h2>
                <p className="text-sm text-gray-500">{commissionTarget.serviceName}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-lg font-semibold"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
              </div>
              {parseFloat(commissionInput) > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Example: ₹5000 booking → Admin keeps ₹{(5000 * parseFloat(commissionInput) / 100).toFixed(0)} commission
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Set 0 for no commission on this service</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommissionModal(false);
                  setCommissionTarget(null);
                  setCommissionInput('0');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleServiceAction(commissionTarget.requestId, 'APPROVE', undefined, parseFloat(commissionInput) || 0)}
                disabled={!!actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === `service-${commissionTarget.requestId}` ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve with {parseFloat(commissionInput) || 0}% Commission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rejection Reason</h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setRejectTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {documentTypeLabels[selectedDocument.documentType] || selectedDocument.documentType.replace(/_/g, ' ')}
                </h2>
                {selectedDocument.documentNumber && (
                  <p className="text-sm text-gray-500">Document No: {selectedDocument.documentNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDocument.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Open in new tab"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Document Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
              {documentLoading ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading document...</p>
                </div>
              ) : documentPreviewError ? (
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium mb-2">Document Not Available</p>
                  <p className="text-gray-600 mb-4 text-sm">
                    The document file could not be loaded. It may not have been uploaded to storage yet.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={selectedDocument.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Try Opening Directly
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    URL: {selectedDocument.documentUrl}
                  </p>
                </div>
              ) : selectedDocument.documentUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                <img
                  src={selectedDocument.documentUrl}
                  alt={selectedDocument.documentName || 'Document'}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={() => setDocumentPreviewError(true)}
                />
              ) : selectedDocument.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedDocument.documentUrl}
                  className="w-full h-[70vh] rounded-lg bg-white"
                  title={selectedDocument.documentName || 'Document'}
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={selectedDocument.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer - Document Info */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Uploaded: {formatDate(selectedDocument.createdAt)}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedDocument.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : selectedDocument.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedDocument.status}
                  </span>
                </div>
                {selectedDocument.verifiedBy && selectedDocument.verifiedAt && (
                  <span className="text-sm text-gray-500">
                    Verified by {selectedDocument.verifiedBy.name} on {formatDate(selectedDocument.verifiedAt)}
                  </span>
                )}
              </div>
              {selectedDocument.rejectionReason && (
                <p className="mt-2 text-sm text-red-600">
                  Rejection Reason: {selectedDocument.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
