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
  Upload,
  Plus,
  Trash2,
  Search,
  Filter,
  Settings,
  Fuel,
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
  service: { id: string; name: string };
}

interface ApprovedLocation {
  id: string;
  isActive: boolean;
  location: { id: string; name: string; parent: { name: string } | null };
}

interface VendorFleet {
  id: string;
  isActive: boolean;
  isAvailable: boolean;
  registrationNumber: string | null;
  vehicleName: string;
  brandName: string | null;
  brandLogo: string | null;
  categoryName: string | null;
  serviceName: string | null;
  sideImage: string | null;
  images: Record<string, string> | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  engineCC: number | null;
  color: string | null;
  yearOfManufacture: number | null;
  vehicleCondition: string | null;
  createdAt: string;
  locations: string[];
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
  fleets: VendorFleet[];
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
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'services' | 'locations' | 'fleet'>('overview');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: string; id?: string } | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<VendorDocument | null>(null);
  const [documentPreviewError, setDocumentPreviewError] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(true);

  // Approved locations — search, filter, select
  const [locSearch, setLocSearch] = useState('');
  const [locStateFilter, setLocStateFilter] = useState('');
  const [selectedLocIds, setSelectedLocIds] = useState<Set<string>>(new Set());

  // Approved services — search, select
  const [svcSearch, setSvcSearch] = useState('');
  const [selectedSvcIds, setSelectedSvcIds] = useState<Set<string>>(new Set());

  // Add Service panel
  const [showAddSvc, setShowAddSvc] = useState(false);
  const [allServices, setAllServices] = useState<{ id: string; name: string }[]>([]);
  const [addSvcSearch, setAddSvcSearch] = useState('');
  const [addSvcSelected, setAddSvcSelected] = useState<Set<string>>(new Set());
  const [addSvcLoading, setAddSvcLoading] = useState(false);

  // Add Location panel
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [allLocations, setAllLocations] = useState<{ id: string; name: string; parentName: string }[]>([]);
  const [addLocSearch, setAddLocSearch] = useState('');
  const [addLocStateFilter, setAddLocStateFilter] = useState('');
  const [addLocSelected, setAddLocSelected] = useState<Set<string>>(new Set());
  const [addLocLoading, setAddLocLoading] = useState(false);

  // Fleet tab
  const [fleetLocFilter, setFleetLocFilter] = useState('all');
  const [fleetLocSearch, setFleetLocSearch] = useState('');
  const [fleetLocDropdownOpen, setFleetLocDropdownOpen] = useState(false);
  const [fleetImageIdx, setFleetImageIdx] = useState<Record<string, number>>({});

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploading, setUploading] = useState(false);

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
        router.push('/manager/vendors');
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

  const handleServiceAction = async (requestId: string, action: string, reason?: string) => {
    setActionLoading(`service-${requestId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
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

  const handleDocumentUpload = async () => {
    if (!uploadFile || !uploadDocType) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', uploadDocType);
      if (uploadDocNumber.trim()) {
        formData.append('documentNumber', uploadDocNumber.trim());
      }

      const res = await fetch(`/api/manager/vendors/${id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUploadForm(false);
        setUploadFile(null);
        setUploadDocType('');
        setUploadDocNumber('');
        await fetchVendor();
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteApprovedService = async (approvedServiceId: string) => {
    if (!confirm('Remove this approved service? The vendor will be notified.')) return;
    setActionLoading(`del-svc-${approvedServiceId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services?approvedServiceId=${approvedServiceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchVendor();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove service');
      }
    } catch {
      alert('Failed to remove service');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDeleteServices = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} selected service(s)? The vendor will be notified.`)) return;
    setActionLoading('bulk-del-svc');
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedServiceIds: ids }),
      });
      if (res.ok) {
        setSelectedSvcIds(new Set());
        await fetchVendor();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove services');
      }
    } catch {
      alert('Failed to remove services');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteApprovedLocation = async (approvedLocationId: string) => {
    if (!confirm('Remove this approved location? The vendor will be notified.')) return;
    setActionLoading(`del-loc-${approvedLocationId}`);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations?approvedLocationId=${approvedLocationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchVendor();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove location');
      }
    } catch {
      alert('Failed to remove location');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDeleteLocations = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} selected location(s)? The vendor will be notified.`)) return;
    setActionLoading('bulk-del-loc');
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedLocationIds: ids }),
      });
      if (res.ok) {
        setSelectedLocIds(new Set());
        await fetchVendor();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to remove locations');
      }
    } catch {
      alert('Failed to remove locations');
    } finally {
      setActionLoading(null);
    }
  };

  const openAddSvcPanel = async () => {
    setShowAddSvc(true);
    setAddSvcSearch('');
    setAddSvcSelected(new Set());
    if (allServices.length === 0) {
      const res = await fetch('/api/admin/services/list');
      if (res.ok) {
        const data = await res.json();
        setAllServices(data.services || data);
      }
    }
  };

  const handleAddServices = async () => {
    if (addSvcSelected.size === 0) return;
    setAddSvcLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: [...addSvcSelected] }),
      });
      if (res.ok) {
        setShowAddSvc(false);
        setAddSvcSelected(new Set());
        await fetchVendor();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add services');
      }
    } catch {
      alert('Failed to add services');
    } finally {
      setAddSvcLoading(false);
    }
  };

  const openAddLocPanel = async () => {
    setShowAddLoc(true);
    setAddLocSearch('');
    setAddLocSelected(new Set());
    setAddLocStateFilter('');
    if (allLocations.length === 0) {
      const res = await fetch('/api/admin/locations?flat=true');
      if (res.ok) {
        const data = await res.json();
        const raw: any[] = data.locations || data;
        // Build id→{name,type} map
        const infoMap: Record<string, { name: string; type: string }> = {};
        raw.forEach((l: any) => { infoMap[l.id] = { name: l.name, type: l.type }; });
        // Exclude COUNTRY, STATE, AIRPORT — show CITY, UNION_TERRITORY, AREA, VILLAGE
        const locs = raw
          .filter((l: any) => !['COUNTRY', 'STATE', 'AIRPORT'].includes(l.type))
          .map((l: any) => ({
            id: l.id,
            name: l.name,
            parentName: infoMap[l.parentId]?.name || '',
          }));
        setAllLocations(locs);
      }
    }
  };

  const handleAddLocations = async () => {
    if (addLocSelected.size === 0) return;
    setAddLocLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds: [...addLocSelected] }),
      });
      if (res.ok) {
        setShowAddLoc(false);
        setAddLocSelected(new Set());
        await fetchVendor();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add locations');
      }
    } catch {
      alert('Failed to add locations');
    } finally {
      setAddLocLoading(false);
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
          {vendor.phone && (
            <a
              href={`https://wa.me/91${vendor.phone.replace(/\D/g, '').replace(/^91/, '')}?text=${encodeURIComponent(`Hi ${vendor.ownerName},\n\nCongratulations! 🎉 Your vendor profile on *TransRentals* has been approved.\n\nYou can now start receiving bookings for the services and locations you registered with us.\n\n👉 Login & manage your business here:\nhttps://transrentals.in/vendor/dashboard\n\nWelcome to the TransRentals family! Feel free to reach out if you need any help getting started.\n\n— Team TransRentals`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
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
            { id: 'fleet', label: 'Fleet', icon: Car, count: vendor._count.fleets },
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
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  tab.id === 'fleet' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
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
        <div className="space-y-4">
          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vendor Documents
              </h3>
              <Button
                size="sm"
                onClick={() => setShowUploadForm(!showUploadForm)}
                variant={showUploadForm ? 'outline' : 'default'}
              >
                {showUploadForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </>
                )}
              </Button>
            </div>

            {showUploadForm && (
              <div className="px-4 pb-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type...</option>
                      <option value="GST_CERTIFICATE">GST Certificate</option>
                      <option value="PAN_CARD">PAN Card</option>
                      <option value="BUSINESS_REGISTRATION">Business Registration</option>
                      <option value="ADDRESS_PROOF">Address Proof</option>
                      <option value="BANK_DETAILS">Bank Details</option>
                      <option value="CANCELLED_CHEQUE">Cancelled Cheque</option>
                      <option value="OWNER_AADHAAR">Owner Aadhaar</option>
                      <option value="OWNER_PAN">Owner PAN</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      placeholder="e.g. GSTIN, PAN number"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted: JPG, PNG, WebP, PDF (max 25MB)
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleDocumentUpload}
                    disabled={!uploadFile || !uploadDocType || uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </div>
              </div>
            )}
          </div>

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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {documentTypeLabels[doc.documentType] || doc.documentType.replace(/_/g, ' ')}
                          </p>
                          {doc.uploadedBy && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Uploaded by Manager
                            </span>
                          )}
                        </div>
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
                          onClick={() => handleServiceAction(request.id, 'APPROVE')}
                          disabled={!!actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === `service-${request.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-4 h-4" />
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

          {/* Add Service Panel */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add Services Directly
              </h3>
              <Button size="sm" onClick={showAddSvc ? () => setShowAddSvc(false) : openAddSvcPanel} variant={showAddSvc ? 'outline' : 'default'}>
                {showAddSvc ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add Service</>}
              </Button>
            </div>
            {showAddSvc && (
              <div className="px-4 pb-4 border-t pt-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={addSvcSearch}
                    onChange={(e) => setAddSvcSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {(() => {
                  const alreadyApproved = new Set(vendor.approvedServices.map((s: any) => s.service?.id));
                  const filtered = allServices.filter(
                    (s) => !alreadyApproved.has(s.id) &&
                      (!addSvcSearch || s.name.toLowerCase().includes(addSvcSearch.toLowerCase()))
                  );
                  return (
                    <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                      {filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-400">
                          {allServices.length === 0 ? 'Loading...' : 'No services available to add'}
                        </p>
                      ) : (
                        filtered.map((svc) => (
                          <label key={svc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addSvcSelected.has(svc.id)}
                              onChange={() => setAddSvcSelected((prev) => { const s = new Set(prev); s.has(svc.id) ? s.delete(svc.id) : s.add(svc.id); return s; })}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  );
                })()}
                <div className="flex justify-end">
                  <Button onClick={handleAddServices} disabled={addSvcSelected.size === 0 || addSvcLoading}>
                    {addSvcLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add {addSvcSelected.size > 0 ? `${addSvcSelected.size} ` : ''}Service{addSvcSelected.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Approved Services */}
          {(() => {
            const activeServices = vendor.approvedServices.filter((s: any) => s.isActive !== false);
            const filteredSvcs = activeServices.filter((s: any) =>
              !svcSearch || (s.service?.name || '').toLowerCase().includes(svcSearch.toLowerCase())
            );
            const allSvcIds = filteredSvcs.map((s: any) => s.id);
            const allSvcsSelected = allSvcIds.length > 0 && allSvcIds.every((sid: string) => selectedSvcIds.has(sid));
            const toggleAllSvcs = () => {
              if (allSvcsSelected) {
                setSelectedSvcIds((prev) => { const s = new Set(prev); allSvcIds.forEach((sid: string) => s.delete(sid)); return s; });
              } else {
                setSelectedSvcIds((prev) => { const s = new Set(prev); allSvcIds.forEach((sid: string) => s.add(sid)); return s; });
              }
            };
            return (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-green-50 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Approved Services ({activeServices.length})
                    </h3>
                    {selectedSvcIds.size > 0 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkDeleteServices([...selectedSvcIds])}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'bulk-del-svc' ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Remove Selected ({selectedSvcIds.size})
                      </Button>
                    )}
                  </div>
                  {activeServices.length > 0 && (
                    <div className="relative mt-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={svcSearch}
                        onChange={(e) => setSvcSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                      />
                    </div>
                  )}
                </div>
                {activeServices.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No approved services yet</div>
                ) : filteredSvcs.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No services match your search</div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSvcsSelected}
                        onChange={toggleAllSvcs}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs text-gray-500">
                        {allSvcsSelected ? 'Deselect all' : `Select all ${filteredSvcs.length}`}
                      </span>
                    </div>
                    <div className="divide-y">
                      {filteredSvcs.map((item: any) => (
                        <div key={item.id} className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${selectedSvcIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedSvcIds.has(item.id)}
                              onChange={() => setSelectedSvcIds((prev) => {
                                const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s;
                              })}
                              className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                            />
                            <span className="font-medium text-gray-900">{item.service?.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteApprovedService(item.id)}
                            disabled={!!actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove service"
                          >
                            {actionLoading === `del-svc-${item.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

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

          {/* Add Location Panel */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add Locations Directly
              </h3>
              <Button size="sm" onClick={showAddLoc ? () => setShowAddLoc(false) : openAddLocPanel} variant={showAddLoc ? 'outline' : 'default'}>
                {showAddLoc ? <><X className="w-4 h-4 mr-1" />Cancel</> : <><Plus className="w-4 h-4 mr-1" />Add Location</>}
              </Button>
            </div>
            {showAddLoc && (
              <div className="px-4 pb-4 border-t pt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={addLocSearch}
                      onChange={(e) => setAddLocSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {(() => {
                    const states = [...new Set(allLocations.map((l) => l.parentName).filter(Boolean))].sort();
                    return states.length > 0 ? (
                      <div className="relative">
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          value={addLocStateFilter}
                          onChange={(e) => setAddLocStateFilter(e.target.value)}
                          className="pl-8 pr-6 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none cursor-pointer"
                        >
                          <option value="">All States</option>
                          {states.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ) : null;
                  })()}
                </div>
                {(() => {
                  const alreadyApproved = new Set(vendor.approvedLocations.map((l: any) => l.location?.id));
                  const filtered = allLocations.filter(
                    (l) => !alreadyApproved.has(l.id) &&
                      (!addLocSearch || l.name.toLowerCase().includes(addLocSearch.toLowerCase()) || l.parentName.toLowerCase().includes(addLocSearch.toLowerCase())) &&
                      (!addLocStateFilter || l.parentName === addLocStateFilter)
                  );
                  return (
                    <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                      {filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-400">
                          {allLocations.length === 0 ? 'Loading...' : 'No locations available to add'}
                        </p>
                      ) : (
                        filtered.map((loc) => (
                          <label key={loc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addLocSelected.has(loc.id)}
                              onChange={() => setAddLocSelected((prev) => { const s = new Set(prev); s.has(loc.id) ? s.delete(loc.id) : s.add(loc.id); return s; })}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-900">{loc.name}</span>
                            {loc.parentName && <span className="text-xs text-gray-400">({loc.parentName})</span>}
                          </label>
                        ))
                      )}
                    </div>
                  );
                })()}
                <div className="flex justify-end">
                  <Button onClick={handleAddLocations} disabled={addLocSelected.size === 0 || addLocLoading}>
                    {addLocLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add {addLocSelected.size > 0 ? `${addLocSelected.size} ` : ''}Location{addLocSelected.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Approved Locations */}
          {(() => {
            const activeLocations = vendor.approvedLocations.filter((l: any) => l.isActive !== false);
            const uniqueStates = [...new Set(
              activeLocations.map((l: any) => l.location?.parent?.name || '').filter(Boolean)
            )].sort() as string[];
            const filtered = activeLocations
              .filter((l: any) => !locSearch ||
                (l.location?.name || '').toLowerCase().includes(locSearch.toLowerCase()) ||
                (l.location?.parent?.name || '').toLowerCase().includes(locSearch.toLowerCase())
              )
              .filter((l: any) => !locStateFilter ||
                (l.location?.parent?.name || '') === locStateFilter
              );
            const allFilteredIds = filtered.map((l: any) => l.id);
            const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((lid: string) => selectedLocIds.has(lid));
            const toggleAll = () => {
              if (allSelected) {
                setSelectedLocIds((prev) => { const s = new Set(prev); allFilteredIds.forEach((lid: string) => s.delete(lid)); return s; });
              } else {
                setSelectedLocIds((prev) => { const s = new Set(prev); allFilteredIds.forEach((lid: string) => s.add(lid)); return s; });
              }
            };
            return (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-green-50 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Approved Locations ({activeLocations.length})
                    </h3>
                    {selectedLocIds.size > 0 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkDeleteLocations([...selectedLocIds])}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'bulk-del-loc' ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Remove Selected ({selectedLocIds.size})
                      </Button>
                    )}
                  </div>
                  {activeLocations.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={locSearch}
                          onChange={(e) => setLocSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                        />
                      </div>
                      {uniqueStates.length > 0 && (
                        <div className="relative">
                          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <select
                            value={locStateFilter}
                            onChange={(e) => { setLocStateFilter(e.target.value); setSelectedLocIds(new Set()); }}
                            className="pl-8 pr-6 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white appearance-none cursor-pointer"
                          >
                            <option value="">All States</option>
                            {uniqueStates.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {activeLocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No approved locations yet</div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No locations match your filter</div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs text-gray-500">
                        {allSelected ? 'Deselect all' : `Select all ${filtered.length}`}
                        {locStateFilter && ` in ${locStateFilter}`}
                      </span>
                    </div>
                    <div className="divide-y">
                      {filtered.map((item: any) => (
                        <div key={item.id} className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${selectedLocIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedLocIds.has(item.id)}
                              onChange={() => setSelectedLocIds((prev) => {
                                const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s;
                              })}
                              className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                            />
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900">{item.location?.name}</span>
                            {item.location?.parent && (
                              <span className="text-gray-500 text-sm">({item.location.parent.name})</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteApprovedLocation(item.id)}
                            disabled={!!actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove location"
                          >
                            {actionLoading === `del-loc-${item.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

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

      {/* Fleet Tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {(vendor.fleets || []).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fleet Vehicles</h3>
              <p className="text-gray-500">This vendor has not added any vehicles yet.</p>
            </div>
          ) : (
            (() => {
              // Extract unique locations for filter
              const allFleetLocs = [...new Set((vendor.fleets || []).flatMap((f) => f.locations))].sort();
              const filteredFleets = fleetLocFilter === 'all'
                ? (vendor.fleets || [])
                : (vendor.fleets || []).filter((f) => f.locations.includes(fleetLocFilter));

              return (
              <>
                {/* Header with location filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fleet Vehicles ({filteredFleets.length}{fleetLocFilter !== 'all' ? ` of ${(vendor.fleets || []).length}` : ''})
                  </h3>
                  {allFleetLocs.length > 1 && (
                    <div className="relative min-w-[220px]">
                      <div
                        className="flex items-center gap-2 pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer hover:border-gray-300"
                        onClick={() => setFleetLocDropdownOpen(!fleetLocDropdownOpen)}
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className={fleetLocFilter === 'all' ? 'text-gray-500' : 'text-gray-900'}>
                          {fleetLocFilter === 'all' ? 'All Locations' : fleetLocFilter}
                        </span>
                        {fleetLocFilter !== 'all' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setFleetLocFilter('all'); setFleetLocSearch(''); }}
                            className="ml-auto mr-1"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                      </div>
                      {fleetLocDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="text"
                                value={fleetLocSearch}
                                onChange={(e) => setFleetLocSearch(e.target.value)}
                                placeholder="Search location..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-52 overflow-y-auto">
                            <button
                              onClick={() => { setFleetLocFilter('all'); setFleetLocSearch(''); setFleetLocDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${fleetLocFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              All Locations ({allFleetLocs.length})
                            </button>
                            {allFleetLocs
                              .filter((loc) => !fleetLocSearch || loc.toLowerCase().includes(fleetLocSearch.toLowerCase()))
                              .slice(0, 50)
                              .map((loc) => (
                              <button
                                key={loc}
                                onClick={() => { setFleetLocFilter(loc); setFleetLocSearch(''); setFleetLocDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${fleetLocFilter === loc ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {filteredFleets.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No vehicles found for this location.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredFleets.map((fleet) => {
                    // Build image list: deduplicated by URL
                    const seenUrls = new Set<string>();
                    const imageList: { url: string; label: string }[] = [];
                    const addImg = (url: string | null | undefined, label: string) => {
                      if (url && typeof url === 'string' && url.length > 5 && !seenUrls.has(url)) {
                        seenUrls.add(url);
                        imageList.push({ url, label });
                      }
                    };
                    // sideImage from vehicle_model
                    if (fleet.sideImage) addImg(fleet.sideImage, 'Side');
                    // Vendor uploaded images
                    if (fleet.images) {
                      // Could be object {front: url, back: url} or array or nested
                      const imgObj = typeof fleet.images === 'string' ? (() => { try { return JSON.parse(fleet.images); } catch { return null; } })() : fleet.images;
                      if (imgObj && typeof imgObj === 'object' && !Array.isArray(imgObj)) {
                        const labelMap: Record<string, string> = { front: 'Front', back: 'Back', leftSide: 'Left Side', rightSide: 'Right Side', left: 'Left', right: 'Right', interior: 'Interior', exterior: 'Exterior' };
                        Object.entries(imgObj).forEach(([key, val]) => {
                          if (typeof val === 'string') addImg(val, labelMap[key] || key);
                        });
                      } else if (Array.isArray(imgObj)) {
                        imgObj.forEach((url: string, i: number) => {
                          if (typeof url === 'string') addImg(url, `Photo ${i + 1}`);
                        });
                      }
                    }
                    const activeIdx = fleetImageIdx[fleet.id] || 0;
                    const currentImg = imageList[activeIdx];

                    return (
                    <div key={fleet.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
                      {/* Vehicle Image Slider */}
                      {imageList.length > 0 ? (
                        <div className="h-48 bg-gray-50 relative group">
                          <img
                            src={currentImg.url}
                            alt={`${fleet.vehicleName} - ${currentImg.label}`}
                            className="w-full h-full object-contain p-4"
                          />
                          {/* Brand logo */}
                          {fleet.brandLogo && (
                            <img src={fleet.brandLogo} alt={fleet.brandName || ''} className="absolute top-3 left-3 h-6 w-auto opacity-70" />
                          )}
                          {/* Image label */}
                          <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded">
                            {currentImg.label}
                          </span>
                          {/* Nav arrows */}
                          {imageList.length > 1 && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setFleetImageIdx((p) => ({ ...p, [fleet.id]: (activeIdx - 1 + imageList.length) % imageList.length })); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-700 rotate-180" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setFleetImageIdx((p) => ({ ...p, [fleet.id]: (activeIdx + 1) % imageList.length })); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              </button>
                              {/* Dots */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {imageList.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setFleetImageIdx((p) => ({ ...p, [fleet.id]: i })); }}
                                    className={`w-1.5 h-1.5 rounded-full transition ${i === activeIdx ? 'bg-blue-600 w-3' : 'bg-gray-400/60'}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          {/* Image count badge */}
                          {imageList.length > 1 && (
                            <span className="absolute bottom-2 right-3 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                              {activeIdx + 1}/{imageList.length}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-48 bg-gray-50 flex items-center justify-center relative">
                          <Car className="w-16 h-16 text-gray-200" />
                          {fleet.brandLogo && (
                            <img src={fleet.brandLogo} alt={fleet.brandName || ''} className="absolute top-3 left-3 h-6 w-auto opacity-70" />
                          )}
                        </div>
                      )}

                      <div className="p-4">
                        {/* Service & Category badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {fleet.serviceName && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">{fleet.serviceName}</span>
                          )}
                          {fleet.categoryName && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-medium rounded">{fleet.categoryName}</span>
                          )}
                        </div>

                        {/* Name & Brand */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-base">{fleet.vehicleName}</h4>
                            {fleet.brandName && <p className="text-xs text-gray-500">{fleet.brandName}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {fleet.isActive ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Inactive</span>
                            )}
                          </div>
                        </div>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {fleet.transmission && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <Settings className="w-3 h-3" /> {fleet.transmission}
                            </span>
                          )}
                          {fleet.fuelType && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <Fuel className="w-3 h-3" /> {fleet.fuelType}
                            </span>
                          )}
                          {fleet.seatingCapacity && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <User className="w-3 h-3" /> {fleet.seatingCapacity} seats
                            </span>
                          )}
                          {fleet.engineCC && (
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{fleet.engineCC}cc</span>
                          )}
                          {fleet.color && (
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{fleet.color}</span>
                          )}
                          {fleet.yearOfManufacture && (
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{fleet.yearOfManufacture}</span>
                          )}
                        </div>

                        {/* Registration */}
                        {fleet.registrationNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded mb-3">
                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-mono font-medium">{fleet.registrationNumber}</span>
                          </div>
                        )}

                        {/* Availability */}
                        <div className="flex items-center gap-2 mb-3">
                          {fleet.isAvailable ? (
                            <span className="flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Available
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="w-3.5 h-3.5" /> Not Available
                            </span>
                          )}
                          {fleet.vehicleCondition && (
                            <span className="text-xs text-gray-500">• {fleet.vehicleCondition}</span>
                          )}
                        </div>

                        {/* Locations — compact */}
                        {fleet.locations.length > 0 && (
                          <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            {fleet.locations.slice(0, 3).map((loc, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs whitespace-nowrap">
                                {loc}
                              </span>
                            ))}
                            {fleet.locations.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap">
                                +{fleet.locations.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                )}
              </>
              );
            })()
          )}
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
