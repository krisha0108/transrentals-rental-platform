'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  KeyRound,
  Copy,
  RefreshCw,
  Tag,
  Activity,
  Globe,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

// Presence + activity — same mechanism as the manager vendors list and the
// admin vendor detail page (see /api/vendor/heartbeat,
// /api/admin/vendors/[id]/activity — no admin-only role gate, so managers
// can call it too).
type PresenceStatus = 'active' | 'idle' | 'offline';

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active now', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700' },
  offline: { label: 'Offline', dot: 'bg-gray-300', text: 'text-gray-500' },
};

// Which client sent the vendor's last heartbeat — shown next to the presence
// dot so a manager can tell a web-dashboard login from an app login at a
// glance, not just that the vendor is online somewhere.
const PLATFORM_META: Record<'web' | 'app', { label: string; icon: typeof Globe }> = {
  web: { label: 'Web', icon: Globe },
  app: { label: 'App', icon: Smartphone },
};

function presenceTimeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatActivityDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs === 0 && mins === 0) return '0m';
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

interface ActivityDay {
  date: string;
  activeSeconds: number;
  idleSeconds: number;
}

interface VendorActivity {
  activeSeconds: number;
  idleSeconds: number;
  byDay: ActivityDay[];
  presence: {
    status: PresenceStatus;
    lastSeenAt: string | null;
    // Every platform (web/app) currently active or idle — populated for
    // both at once when the vendor is logged into both simultaneously.
    platforms: { platform: 'web' | 'app'; status: PresenceStatus; lastSeenAt: string }[];
  };
}

const ACTIVITY_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'all', label: 'All Time' },
] as const;

// Manager-managed CRM tags — mirrors the vendor list page. Server validates
// against the same enum (see /api/manager/vendors/[id]/tags).
const VENDOR_TAGS = [
  { key: 'FOLLOW_UP_REQUIRED',     label: 'Follow-Up Required',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'CONNECTED',              label: 'Connected',              color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'RESPONDED',              label: 'Responded',              color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DOCUMENTS_PENDING',      label: 'Documents Pending',      color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'DOCUMENTS_VERIFIED',     label: 'Documents Verified',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'WRONG_VENDOR_DETAILS',   label: 'Wrong Vendor Details',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'NOT_INTERESTED',         label: 'Not Interested',         color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { key: 'NO_RESPONSE',            label: 'No Response',            color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { key: 'VEHICLE_DETAILS_PENDING', label: 'Vehicle Details Pending', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'ACTIVE_VENDOR',          label: 'Active Vendor',          color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'SUSPENDED',              label: 'Suspended',              color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const;
const TAG_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  VENDOR_TAGS.map((t) => [t.key, { label: t.label, color: t.color }])
);

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

interface ContactChangeRequest {
  id: string;
  newEmail: string | null;
  newPhone: string | null;
  requestedAt: string;
}

interface Vendor {
  id: string;
  vid: string | null;
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
  tags: string[];
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
  contactChangeRequest?: ContactChangeRequest | null;
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

const VALID_TABS = ['overview', 'documents', 'services', 'locations', 'fleet'] as const;

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [contactReqLoading, setContactReqLoading] = useState<string | null>(null);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'services' | 'locations' | 'fleet'>(
    (VALID_TABS as readonly string[]).includes(tabParam || '') ? (tabParam as typeof VALID_TABS[number]) : 'overview'
  );

  // Re-sync when navigating between two notification links for the same
  // vendor (only the query string changes, so the component doesn't remount
  // and the useState initializer above won't re-run on its own).
  useEffect(() => {
    if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam as typeof VALID_TABS[number]);
    }
  }, [tabParam]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: string; id?: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  // CRM tags
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagSaving, setTagSaving] = useState<string | null>(null);
  // Set-password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordPlain, setShowPasswordPlain] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
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

  // Resubmit modal state
  const [resubmitDoc, setResubmitDoc] = useState<VendorDocument | null>(null);
  const [resubmitMode, setResubmitMode] = useState<'choose' | 'request' | 'upload' | null>(null);
  const [resubmitReason, setResubmitReason] = useState('');
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  // Online presence + day-by-day active/idle time (see /api/vendor/heartbeat)
  const [activity, setActivity] = useState<VendorActivity | null>(null);
  const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]['key']>('thisWeek');

  const fetchActivity = async (filter: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${params.id}/activity?filter=${filter}`);
      const json = await res.json();
      if (!json.error) setActivity(json);
    } catch (error) {
      console.error('Failed to fetch vendor activity:', error);
    }
  };

  useEffect(() => {
    fetchActivity(activityFilter);
    const interval = setInterval(() => fetchActivity(activityFilter), 30000);

    // Browsers throttle setInterval in a backgrounded tab, so a manager who
    // tabs away and back was seeing a stale presence badge until the
    // throttled timer next fired. Refetch immediately on refocus.
    const onVisible = () => { if (document.visibilityState === 'visible') fetchActivity(activityFilter); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const [partnershipAgreement, setPartnershipAgreement] = useState<{
    signed: boolean;
    latest: {
      signedByName: string; signedByTitle: string | null; queryNote: string | null;
      acceptedAt: string; agreementVersion: string; termMonths: number;
      reviewStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
      reviewedAt: string | null; reviewNote: string | null; reviewedByName: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/vendors/${id}/partnership-agreement`)
      .then((res) => res.json())
      .then(setPartnershipAgreement)
      .catch(() => {});
  }, [id]);

  // Optimistic CRM tag toggle — adds/removes locally, then syncs server.
  // Rolls back on failure. Mirrors the vendor list page behaviour.
  const handleToggleTag = async (tag: string, present: boolean) => {
    if (!vendor) return;
    setTagSaving(tag);
    const prev = vendor.tags || [];
    setVendor(v => v ? {
      ...v,
      tags: present ? prev.filter(t => t !== tag) : [...prev, tag],
    } : v);
    try {
      const res = present
        ? await fetch(`/api/manager/vendors/${id}/tags?tag=${tag}`, { method: 'DELETE' })
        : await fetch(`/api/manager/vendors/${id}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag }),
          });
      if (!res.ok) throw new Error('Server rejected tag change');
      const data = await res.json();
      if (Array.isArray(data?.tags)) {
        setVendor(v => v ? { ...v, tags: data.tags } : v);
      }
    } catch (e) {
      setVendor(v => v ? { ...v, tags: prev } : v);
      alert('Could not update tag. Please try again.');
    } finally {
      setTagSaving(null);
    }
  };

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
        setShowSuspendModal(false);
        setSuspendReason('');
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

  const handleContactChangeRequest = async (reqId: string, action: 'APPROVE' | 'REJECT') => {
    setContactReqLoading(action);
    try {
      const res = await fetch(`/api/manager/contact-requests/${reqId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Action failed'); return; }
      await fetchVendor();
    } catch { alert('Network error'); }
    finally { setContactReqLoading(null); }
  };

  const openPasswordModal = () => {
    setNewPassword(''); setConfirmPassword(''); setPasswordError('');
    setPasswordSuccess(false); setShowPasswordPlain(false); setShowPasswordModal(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(out); setConfirmPassword(out);
    setShowPasswordPlain(true); setPasswordError(''); setPasswordSuccess(false);
  };

  const handleSetPassword = async () => {
    setPasswordError(''); setPasswordSuccess(false);
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || 'Failed to set password'); return; }
      setPasswordSuccess(true);
    } catch (e: any) {
      setPasswordError(e?.message || 'Network error');
    } finally {
      setSavingPassword(false);
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

  const openResubmitModal = (doc: VendorDocument) => {
    setResubmitDoc(doc);
    setResubmitMode('choose');
    setResubmitReason('');
    setResubmitFile(null);
  };

  const closeResubmitModal = () => {
    setResubmitDoc(null);
    setResubmitMode(null);
    setResubmitReason('');
    setResubmitFile(null);
  };

  const handleRequestResubmit = async () => {
    if (!resubmitDoc) return;
    setResubmitLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: resubmitDoc.id,
          action: 'RESUBMIT_REQUIRED',
          rejectionReason: resubmitReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        closeResubmitModal();
        await fetchVendor();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to request resubmission');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleResubmitUpload = async () => {
    if (!resubmitDoc || !resubmitFile) return;
    setResubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', resubmitFile);
      formData.append('documentType', resubmitDoc.documentType);
      if (resubmitReason.trim()) formData.append('documentNumber', resubmitReason.trim());

      const res = await fetch(`/api/manager/vendors/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        closeResubmitModal();
        await fetchVendor();
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleDeleteApprovedService = async (approvedServiceId: string) => {
    if (!confirm('Permanently remove this approved service? This cannot be undone — the vendor would need to submit a fresh request to get it back. They will be notified.')) return;
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
    if (!confirm(`Permanently remove ${ids.length} selected service(s)? This cannot be undone — the vendor would need to submit fresh requests to get them back. They will be notified.`)) return;
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

  // Only the vendor's identity goes into the shared sticky bar — name, approval
  // status and presence, plus Back. The action buttons and tags stay in the page,
  // so the bar does not turn into a toolbar.
  const headerStatus = vendor ? (statusConfig[vendor.status] || statusConfig.PENDING) : null;
  const headerNoActivity = vendor
    ? vendor.status === 'UNDER_REVIEW' &&
      vendor.locationRequests.length === 0 && vendor.approvedLocations.length === 0 &&
      vendor.serviceRequests.length === 0 && vendor.approvedServices.length === 0
    : false;

  useManagerPageHeader(
    vendor?.businessName || 'Vendor',
    vendor?.vid || undefined,
    vendor ? (
      <div key="badges" className="flex flex-wrap items-center gap-2">
        {headerStatus && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${headerStatus.bgColor} ${headerStatus.color}`}>
            {headerNoActivity ? 'Documents Reviewed' : headerStatus.label}
          </span>
        )}
        {activity && (() => {
          const meta = PRESENCE_META[activity.presence.status];
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 ${meta.text}`}>
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
              {activity.presence.status !== 'active' && ` · ${presenceTimeAgo(activity.presence.lastSeenAt)}`}
            </span>
          );
        })()}
      <div className="flex items-center gap-2">
        <Link href={`/manager/vendor-performance/${vendor.id}`}>
          <Button variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </Button>
        </Link>
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
        {/* Set password — available at any vendor status. Manager often
            needs to reset credentials when a vendor lost the password
            and contacted support directly. */}
        <Button
          variant="outline"
          onClick={openPasswordModal}
          disabled={!!actionLoading}
        >
          <KeyRound className="w-4 h-4 mr-2" />
          Set Password
        </Button>
        {/* Change Status Dropdown */}
        {(() => {
          const unverifiedDocs = vendor.documents.filter((d) => d.status !== 'APPROVED').length;
          const docsIncomplete = unverifiedDocs > 0 || vendor.documents.length === 0;

          type MenuItem = { label: string; icon: React.ReactNode; itemClass: string; onClick: () => void };
          const menuItems: MenuItem[] = [];

          if (['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'REJECTED'].includes(vendor.status)) {
            menuItems.push({
              label: vendor.status === 'REJECTED'
                ? 'Re-Approve'
                : docsIncomplete ? 'Approve (Override)' : 'Approve',
              icon: docsIncomplete && vendor.status !== 'REJECTED'
                ? <AlertTriangle className="w-4 h-4" />
                : <CheckCircle className="w-4 h-4" />,
              itemClass: docsIncomplete && vendor.status !== 'REJECTED'
                ? 'text-amber-700 hover:bg-amber-50'
                : 'text-green-700 hover:bg-green-50',
              onClick: () => {
                setStatusDropdownOpen(false);
                if (docsIncomplete && vendor.status !== 'REJECTED') {
                  const msg = vendor.documents.length === 0
                    ? 'This vendor has not uploaded any documents. Approve anyway?'
                    : `${unverifiedDocs} document(s) are not yet approved. Approve this vendor anyway?`;
                  if (!confirm(msg)) return;
                }
                handleVendorAction('APPROVE');
              },
            });
          }

          if (['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(vendor.status)) {
            menuItems.push({
              label: 'Reject',
              icon: <XCircle className="w-4 h-4" />,
              itemClass: 'text-red-700 hover:bg-red-50',
              onClick: () => { setStatusDropdownOpen(false); openRejectModal('vendor'); },
            });
          }

          if (vendor.status === 'APPROVED') {
            menuItems.push({
              label: 'Suspend',
              icon: <AlertTriangle className="w-4 h-4" />,
              itemClass: 'text-purple-700 hover:bg-purple-50',
              onClick: () => { setStatusDropdownOpen(false); setShowSuspendModal(true); },
            });
          }

          if (['APPROVED', 'SUSPENDED'].includes(vendor.status)) {
            menuItems.push({
              label: 'Block',
              icon: <Ban className="w-4 h-4" />,
              itemClass: 'text-gray-700 hover:bg-gray-100',
              onClick: () => { setStatusDropdownOpen(false); handleVendorAction('BLOCK'); },
            });
          }

          if (vendor.status === 'SUSPENDED') {
            menuItems.push({
              label: 'Reinstate',
              icon: <CheckCircle className="w-4 h-4" />,
              itemClass: 'text-green-700 hover:bg-green-50',
              onClick: () => { setStatusDropdownOpen(false); handleVendorAction('UNSUSPEND'); },
            });
          }

          if (vendor.status === 'BLOCKED') {
            menuItems.push({
              label: 'Unblock',
              icon: <CheckCircle className="w-4 h-4" />,
              itemClass: 'text-green-700 hover:bg-green-50',
              onClick: () => { setStatusDropdownOpen(false); handleVendorAction('UNSUSPEND'); },
            });
          }

          if (menuItems.length === 0) return null;

          return (
            <div ref={statusDropdownRef} className="relative">
              <Button
                variant="outline"
                onClick={() => setStatusDropdownOpen((o) => !o)}
                disabled={!!actionLoading}
                className="gap-1.5"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                Change Status
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              {statusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${item.itemClass}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      </div>
    ) : undefined,
    <button
      key="back"
      onClick={() => router.back()}
      title="Go back"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
    >
      <ArrowLeft className="w-5 h-5 text-gray-600" />
    </button>,
  );

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
  // "Under Review" is set purely by the document-upload step (Address Proof) —
  // it doesn't mean the vendor has requested any location/service yet. Make
  // that distinction visible instead of leaving it looking like a full review.
  const hasNoLocationOrServiceActivity =
    vendor.status === 'UNDER_REVIEW' &&
    vendor.locationRequests.length === 0 && vendor.approvedLocations.length === 0 &&
    vendor.serviceRequests.length === 0 && vendor.approvedServices.length === 0;

  return (
    <div className="space-y-6">
      {/* Identity (name, status, presence, Back) now lives in the sticky top bar. */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          {hasNoLocationOrServiceActivity && (
            <p className="text-xs text-amber-600 mt-0.5">Locations/Services not requested yet</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {vendor.vid && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                <Shield className="w-3.5 h-3.5" />
                {vendor.vid}
              </span>
            )}
            <span className="text-xs text-gray-400 font-mono">ID: {vendor.id}</span>
          </div>

          {/* CRM tags — add/remove manager follow-up tags (same as vendor list) */}
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            {(vendor.tags || []).map((t) => {
              const meta = TAG_BY_KEY[t];
              if (!meta) return null;
              const saving = tagSaving === t;
              return (
                <span
                  key={t}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color} ${saving ? 'opacity-50' : ''}`}
                >
                  <Tag className="w-3 h-3" />
                  {meta.label}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleTag(t, true)}
                    className="ml-0.5 hover:opacity-70"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => setTagEditorOpen(o => !o)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
            >
              <Plus className="w-3 h-3" />
              {(vendor.tags || []).length === 0 ? 'Add tag' : 'Edit tags'}
            </button>
          </div>

          {tagEditorOpen && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Toggle tags</span>
                <button
                  type="button"
                  onClick={() => setTagEditorOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VENDOR_TAGS.map((t) => {
                  const present = (vendor.tags || []).includes(t.key);
                  const saving = tagSaving === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      disabled={saving}
                      onClick={() => handleToggleTag(t.key, present)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border transition ${
                        present
                          ? `${t.color} ring-1 ring-offset-1 ring-current`
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                      } ${saving ? 'opacity-50' : ''}`}
                    >
                      {present ? '✓ ' : '+ '}{t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Online time — active/idle time tracked silently while the vendor's
          dashboard tab is open (see /api/vendor/heartbeat) */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Vendor Timing
          </p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {ACTIVITY_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActivityFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activityFilter === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!activity ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-6 mb-4 pb-4 border-b">
              <div>
                <p className="text-xs text-gray-500">Active time</p>
                <p className="text-lg font-bold text-emerald-600">{formatActivityDuration(activity.activeSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Idle time</p>
                <p className="text-lg font-bold text-amber-600">{formatActivityDuration(activity.idleSeconds)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total online</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatActivityDuration(activity.activeSeconds + activity.idleSeconds)}
                </p>
              </div>
            </div>

            {activity.byDay.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No activity tracked in this period yet.</p>
            ) : (
              <div className="space-y-1.5">
                {activity.byDay.map((d) => {
                  const total = d.activeSeconds + d.idleSeconds;
                  const activePct = total > 0 ? (d.activeSeconds / total) * 100 : 0;
                  return (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-gray-600">
                        {new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${activePct}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-emerald-700 font-medium">
                        {formatActivityDuration(d.activeSeconds)}
                      </span>
                      <span className="w-20 shrink-0 text-right text-amber-600">
                        {formatActivityDuration(d.idleSeconds)} idle
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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
            {/* Pending contact change request banner */}
            {vendor.contactChangeRequest && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Pending Contact Change Request
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Vendor requested on {new Date(vendor.contactChangeRequest.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {vendor.contactChangeRequest.newEmail && (
                        <span className="flex items-center gap-1 text-amber-900">
                          <Mail className="w-3.5 h-3.5" />
                          New Email: <strong>{vendor.contactChangeRequest.newEmail}</strong>
                        </span>
                      )}
                      {vendor.contactChangeRequest.newPhone && (
                        <span className="flex items-center gap-1 text-amber-900">
                          <Phone className="w-3.5 h-3.5" />
                          New Phone: <strong>{vendor.contactChangeRequest.newPhone}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleContactChangeRequest(vendor.contactChangeRequest!.id, 'APPROVE')}
                      disabled={!!contactReqLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {contactReqLoading === 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleContactChangeRequest(vendor.contactChangeRequest!.id, 'REJECT')}
                      disabled={!!contactReqLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {contactReqLoading === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {vendor.vid && (
                  <div>
                    <label className="text-sm text-gray-500">Vendor ID (VID)</label>
                    <p className="font-semibold text-blue-600 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      {vendor.vid}
                    </p>
                  </div>
                )}
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
                      {vendor.address}
                    </p>
                  </div>
                )}
                {vendor.city && (
                  <div>
                    <label className="text-sm text-gray-500">City</label>
                    <p className="font-medium text-gray-900">{vendor.city}</p>
                  </div>
                )}
                {vendor.state && (
                  <div>
                    <label className="text-sm text-gray-500">State</label>
                    <p className="font-medium text-gray-900">{vendor.state}</p>
                  </div>
                )}
                {vendor.pincode && (
                  <div>
                    <label className="text-sm text-gray-500">Pincode</label>
                    <p className="font-medium text-gray-900">{vendor.pincode}</p>
                  </div>
                )}
                {!vendor.address && !vendor.city && !vendor.state && !vendor.pincode && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="text-sm text-gray-400 italic">Not provided</p>
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
                {vendor.status === 'SUSPENDED' && vendor.rejectionReason && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Suspended</p>
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

            {/* Partnership Agreement */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Partnership Agreement
                </h3>
                {partnershipAgreement?.signed && partnershipAgreement.latest && (
                  <Link
                    href="/manager/vendor-agreements"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Review queue →
                  </Link>
                )}
              </div>

              {!partnershipAgreement ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : partnershipAgreement.signed && partnershipAgreement.latest ? (
                (() => {
                  const a = partnershipAgreement.latest!;
                  // The vendor's signature and the manager's decision are two
                  // separate steps — show both, not just "signed".
                  const tone =
                    a.reviewStatus === 'ACCEPTED'
                      ? { wrap: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Approved by TransRentals', Icon: CheckCircle }
                      : a.reviewStatus === 'REJECTED'
                        ? { wrap: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', text: 'text-rose-800', label: 'Rejected by TransRentals', Icon: XCircle }
                        : { wrap: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800', label: 'Awaiting manager review', Icon: Clock };
                  const ToneIcon = tone.Icon;
                  return (
                    <div>
                      {/* Where this agreement stands right now */}
                      <div className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 ${tone.wrap}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tone.dot}`}>
                          <ToneIcon className="w-4 h-4 text-white" />
                        </span>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm ${tone.text}`}>{tone.label}</p>
                          <p className={`text-xs mt-0.5 ${tone.text} opacity-80`}>
                            {a.reviewStatus === 'PENDING'
                              ? 'The vendor has signed. A manager still has to accept it.'
                              : `${a.reviewedByName ? `${a.reviewedByName} · ` : ''}${
                                  a.reviewedAt
                                    ? new Date(a.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                    : ''
                                }`}
                          </p>
                          {a.reviewNote && (
                            <p className={`text-xs mt-1.5 ${tone.text}`}>{a.reviewNote}</p>
                          )}
                        </div>
                      </div>

                      {/* What the vendor signed */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 rounded-lg border border-gray-200 bg-gray-50 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 overflow-hidden">
                        <div className="px-3.5 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Signed on</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900 tabular-nums">
                            {new Date(a.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="px-3.5 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Term</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">
                            <span className="tabular-nums">{a.termMonths}</span> months
                          </p>
                        </div>
                        <div className="px-3.5 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Agreement</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900 font-mono">{a.agreementVersion}</p>
                        </div>
                      </div>

                      <p className="mt-2.5 text-sm text-gray-600">
                        Signed by <span className="font-semibold text-gray-900">{a.signedByName}</span>
                        {a.signedByTitle ? <span className="text-gray-400"> · {a.signedByTitle}</span> : null}
                      </p>

                      {a.queryNote && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Vendor query</p>
                          <p className="mt-0.5 text-sm text-amber-800">{a.queryNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Not yet signed by this vendor.</p>
                </div>
              )}
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
                            : doc.status === 'RESUBMIT_REQUIRED'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status === 'RESUBMIT_REQUIRED' ? 'RESUBMIT' : doc.status}
                      </span>
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        title="View Document"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <Button
                        size="sm"
                        onClick={() => openResubmitModal(doc)}
                        disabled={!!actionLoading}
                        title="Request resubmission or upload on behalf"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Resubmit
                      </Button>
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
                  {(doc.status === 'REJECTED' || doc.status === 'RESUBMIT_REQUIRED') && doc.rejectionReason && (
                    <div className={`mt-3 ml-16 p-3 rounded-lg ${doc.status === 'RESUBMIT_REQUIRED' ? 'bg-orange-50' : 'bg-red-50'}`}>
                      <p className={`text-sm ${doc.status === 'RESUBMIT_REQUIRED' ? 'text-orange-700' : 'text-red-700'}`}>
                        <strong>{doc.status === 'RESUBMIT_REQUIRED' ? 'Resubmit Reason:' : 'Rejection Reason:'}</strong> {doc.rejectionReason}
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
                <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
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
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
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
                  const filteredIds = filtered.map((s) => s.id);
                  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((sid) => addSvcSelected.has(sid));
                  const toggleAllFiltered = () => {
                    setAddSvcSelected((prev) => {
                      const s = new Set(prev);
                      if (allFilteredSelected) {
                        filteredIds.forEach((sid) => s.delete(sid));
                      } else {
                        filteredIds.forEach((sid) => s.add(sid));
                      }
                      return s;
                    });
                  };
                  return (
                    <div className="border rounded-lg overflow-hidden">
                      {filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-400">
                          {allServices.length === 0 ? 'Loading...' : 'No services available to add'}
                        </p>
                      ) : (
                        <>
                          <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={toggleAllFiltered}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs font-medium text-gray-500">
                              {allFilteredSelected ? 'Deselect all' : `Select all ${filtered.length}`}
                            </span>
                          </label>
                          <div className="max-h-56 overflow-y-auto divide-y">
                            {filtered.map((svc) => (
                              <label key={svc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={addSvcSelected.has(svc.id)}
                                  onChange={() => setAddSvcSelected((prev) => { const s = new Set(prev); s.has(svc.id) ? s.delete(svc.id) : s.add(svc.id); return s; })}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                              </label>
                            ))}
                          </div>
                        </>
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

          {/* Approved Services — shows BOTH active and vendor-deactivated
              services (with an "Inactive" badge), so managers can see when
              a vendor has switched a service off on their own dashboard. */}
          {(() => {
            const allApprovedSvcs = vendor.approvedServices;
            const inactiveCount = allApprovedSvcs.filter((s: any) => s.isActive === false).length;
            const filteredSvcs = allApprovedSvcs.filter((s: any) =>
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
                    <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Approved Services ({allApprovedSvcs.length})
                      {inactiveCount > 0 && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          {inactiveCount} deactivated by vendor
                        </span>
                      )}
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
                  {allApprovedSvcs.length > 0 && (
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
                {allApprovedSvcs.length === 0 ? (
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
                        <div key={item.id} className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${selectedSvcIds.has(item.id) ? 'bg-blue-50' : ''} ${item.isActive === false ? 'opacity-70' : ''}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedSvcIds.has(item.id)}
                              onChange={() => setSelectedSvcIds((prev) => {
                                const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s;
                              })}
                              className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                            />
                            <span className={`font-medium ${item.isActive === false ? 'text-gray-500' : 'text-gray-900'}`}>{item.service?.name}</span>
                            {item.isActive === false ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Inactive — vendor turned this off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            )}
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
              <h3 className="text-sm font-semibold text-gray-900">Request History</h3>
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
                <h3 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
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
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
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
                  const filteredIds = filtered.map((l) => l.id);
                  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((lid) => addLocSelected.has(lid));
                  const toggleAllFiltered = () => {
                    setAddLocSelected((prev) => {
                      const s = new Set(prev);
                      if (allFilteredSelected) {
                        filteredIds.forEach((lid) => s.delete(lid));
                      } else {
                        filteredIds.forEach((lid) => s.add(lid));
                      }
                      return s;
                    });
                  };
                  return (
                    <div className="border rounded-lg overflow-hidden">
                      {filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-400">
                          {allLocations.length === 0 ? 'Loading...' : 'No locations available to add'}
                        </p>
                      ) : (
                        <>
                          <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={toggleAllFiltered}
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs font-medium text-gray-500">
                              {allFilteredSelected ? 'Deselect all' : `Select all ${filtered.length}`}
                            </span>
                          </label>
                          <div className="max-h-56 overflow-y-auto divide-y">
                            {filtered.map((loc) => (
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
                            ))}
                          </div>
                        </>
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
                    <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
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
              <h3 className="text-sm font-semibold text-gray-900">Request History</h3>
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

      {/* Set Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Set Vendor Password</h2>
                  <p className="text-xs text-gray-500">{vendor.businessName} · {vendor.email}</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="mt-4">
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm flex items-start gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Password updated</div>
                    <div className="text-xs text-green-700 mt-0.5">Share the new password with the vendor securely. We won't show it again after you close this dialog.</div>
                  </div>
                </div>
                <label className="text-xs font-medium text-gray-500">New password</label>
                <div className="flex gap-2 mt-1">
                  <input
                    readOnly
                    type={showPasswordPlain ? 'text' : 'password'}
                    value={newPassword}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono bg-gray-50"
                  />
                  <button
                    onClick={() => setShowPasswordPlain((v) => !v)}
                    className="px-3 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {showPasswordPlain ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(newPassword).catch(() => {})}
                    className="px-3 py-2 border rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="flex justify-end mt-5">
                  <Button onClick={() => setShowPasswordModal(false)}>Done</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700">New password</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Generate
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showPasswordPlain ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordPlain((v) => !v)}
                      className="px-3 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      {showPasswordPlain ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Confirm password</label>
                  <input
                    type={showPasswordPlain ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> {passwordError}
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-xs">
                  The vendor will be able to log in immediately with this password. Share it with them through a secure channel.
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <Button variant="outline" onClick={() => setShowPasswordModal(false)} disabled={savingPassword}>Cancel</Button>
                  <Button onClick={handleSetPassword} disabled={savingPassword || !newPassword} className="bg-blue-600 hover:bg-blue-700">
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    Set Password
                  </Button>
                </div>
              </div>
            )}
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

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Suspension Reason</h2>
            <p className="text-sm text-gray-500 mb-4">
              This is recorded on the vendor's account for your team's reference. The vendor will only see a generic "contact support" message — not this reason.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Why is this vendor being suspended?"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleVendorAction('SUSPEND', suspendReason)}
                disabled={!suspendReason.trim() || !!actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Suspend
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

      {/* ── Resubmit Modal ───────────────────────────────────────────── */}
      {resubmitDoc && resubmitMode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !resubmitLoading && closeResubmitModal()}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-base">
                  Resubmit Document
                </h3>
              </div>
              <button
                onClick={closeResubmitModal}
                disabled={resubmitLoading}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Doc name */}
              <p className="text-sm text-gray-600">
                Document:{' '}
                <span className="font-semibold text-gray-900">
                  {documentTypeLabels[resubmitDoc.documentType] || resubmitDoc.documentType.replace(/_/g, ' ')}
                </span>
              </p>

              {/* Choose mode */}
              {resubmitMode === 'choose' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setResubmitMode('request')}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-xl text-center transition"
                  >
                    <RefreshCw className="w-7 h-7 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-800">Request from Vendor</span>
                    <span className="text-xs text-gray-500">Notify vendor to re-upload this document</span>
                  </button>
                  <button
                    onClick={() => setResubmitMode('upload')}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-center transition"
                  >
                    <Upload className="w-7 h-7 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-800">Upload on Behalf</span>
                    <span className="text-xs text-gray-500">Upload the new document yourself</span>
                  </button>
                </div>
              )}

              {/* Request vendor resubmit */}
              {resubmitMode === 'request' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason / Message to vendor <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={resubmitReason}
                      onChange={(e) => setResubmitReason(e.target.value)}
                      placeholder="e.g. Document is blurry, please upload a clearer version"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setResubmitMode('choose')}
                      disabled={resubmitLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRequestResubmit}
                      disabled={resubmitLoading}
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resubmitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Request Resubmit
                    </button>
                  </div>
                </div>
              )}

              {/* Manager uploads on behalf */}
              {resubmitMode === 'upload' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Document File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, PDF · max 25 MB</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setResubmitMode('choose')}
                      disabled={resubmitLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleResubmitUpload}
                      disabled={!resubmitFile || resubmitLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resubmitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Document
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
