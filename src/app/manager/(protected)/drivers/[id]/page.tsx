'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Phone, Mail, MapPin, CalendarDays,
  IdCard, Car, ShieldCheck, ShieldX, ShieldAlert, Clock,
  Building2, IndianRupee, FileText, AlertCircle, ExternalLink,
  CheckCircle, Ban, RotateCcw, Store, User, Tag, Plus, X, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

type DriverStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type DriverSource = 'standalone' | 'vendor';

// Manager-managed CRM tags — mirrors the vendor tag system. Server validates
// against the same enum (see /api/manager/drivers/[id]/tags).
const DRIVER_TAGS = [
  { key: 'FOLLOW_UP_REQUIRED',      label: 'Follow-Up Required',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'CONNECTED',               label: 'Connected',               color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'RESPONDED',               label: 'Responded',               color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'DOCUMENTS_PENDING',       label: 'Documents Pending',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'DOCUMENTS_VERIFIED',      label: 'Documents Verified',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'WRONG_DRIVER_DETAILS',    label: 'Wrong Driver Details',    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'NOT_INTERESTED',          label: 'Not Interested',          color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { key: 'NO_RESPONSE',             label: 'No Response',             color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { key: 'VEHICLE_DETAILS_PENDING', label: 'Vehicle Details Pending', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'ACTIVE_DRIVER',           label: 'Active Driver',           color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'SUSPENDED',               label: 'Suspended',               color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const;
const TAG_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  DRIVER_TAGS.map((t) => [t.key, { label: t.label, color: t.color }])
);

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  role: string;
  status: string; // raw status — may be drivers' or vendor_staff's enum
  joiningDate: string;
  salary: number;
  aadharNumber: string | null;
  aadharDocument: string | null;
  panNumber: string | null;
  panDocument: string | null;
  licenseNumber: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  licenseDocument: string | null;
  bankName: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  did: string | null;
  vendor?: { id: string; businessName: string } | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  registrationNo: string | null;
  color: string | null;
  category: string | null;
  seatingCapacity: number | null;
  fuelType: string | null;
  isActive: boolean;
  insuranceNumber: string | null;
  insuranceExpiry: string | null;
  rcNumber: string | null;
  rcExpiry: string | null;
  fitnessExpiry: string | null;
  permitExpiry: string | null;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  pickupCity: string;
  dropCity: string | null;
  pickupDate: string;
  status: string;
  grandTotal: number;
  createdAt: string;
}

// Status pills are keyed by raw status from EITHER table, so both
// drivers' (PENDING/ACTIVE/INACTIVE/SUSPENDED) and vendor_staff's
// (ACTIVE/ON_LEAVE/INACTIVE/TERMINATED) values render cleanly.
const STATUS_CONFIG: Record<string, { label: string; pill: string; banner: string; dot: string }> = {
  PENDING:    { label: 'Pending Approval', pill: 'bg-yellow-100 text-yellow-800', banner: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  ACTIVE:     { label: 'Active',           pill: 'bg-green-100 text-green-800',   banner: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  INACTIVE:   { label: 'Inactive',         pill: 'bg-gray-100 text-gray-700',     banner: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-400' },
  SUSPENDED:  { label: 'Suspended',        pill: 'bg-red-100 text-red-800',       banner: 'bg-red-50 border-red-200',       dot: 'bg-red-500' },
  ON_LEAVE:   { label: 'On Leave',         pill: 'bg-blue-100 text-blue-800',     banner: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  TERMINATED: { label: 'Terminated',       pill: 'bg-red-100 text-red-800',       banner: 'bg-red-50 border-red-200',       dot: 'bg-red-500' },
};
const FALLBACK_STATUS = { label: 'Unknown', pill: 'bg-gray-100 text-gray-700', banner: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' };

const maskAccount = (n: string | null) => n ? n.replace(/.(?=.{4})/g, '•') : '';

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const source = (searchParams.get('source') as DriverSource | null) || null;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [resolvedSource, setResolvedSource] = useState<DriverSource>('standalone');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRM tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  const fetchDriver = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = source ? `?source=${source}` : '';
      const res = await fetch(`/api/manager/drivers/${id}${qs}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Driver not found' : 'Failed to load driver');
        return;
      }
      const data = await res.json();
      setDriver(data.driver);
      setResolvedSource(data.source || 'standalone');
      setVehicles(data.vehicles || []);
      setRecentBookings(data.recentBookings || []);
      setTotalBookings(data.totalBookings || 0);
      setTags(Array.isArray(data.tags) ? data.tags : []);
    } catch {
      setError('Failed to load driver');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDriver(); }, [id, source]);

  const isVendorDriver = resolvedSource === 'vendor';

  // Optimistic CRM tag toggle — adds/removes locally, then syncs server.
  // Rolls back on failure. Mirrors the vendor detail page behaviour. Tags are
  // keyed by (driverId, source) so we always pass the resolved source.
  const handleToggleTag = async (tag: string, present: boolean) => {
    setTagSaving(tag);
    const prev = tags;
    setTags(present ? prev.filter((t) => t !== tag) : [...prev, tag]);
    try {
      const res = present
        ? await fetch(`/api/manager/drivers/${id}/tags?tag=${tag}&source=${resolvedSource}`, { method: 'DELETE' })
        : await fetch(`/api/manager/drivers/${id}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag, source: resolvedSource }),
          });
      if (!res.ok) throw new Error('Server rejected tag change');
      const data = await res.json();
      if (Array.isArray(data?.tags)) setTags(data.tags);
    } catch {
      setTags(prev);
      alert('Could not update tag. Please try again.');
    } finally {
      setTagSaving(null);
    }
  };

  // Pick the right "next status" verb per source. PENDING isn't supported on
  // vendor_staff, so we hide that button for vendor-managed drivers.
  const changeStatus = async (newStatus: string) => {
    if (!driver) return;
    if (driver.status === newStatus) return;
    const verb = {
      ACTIVE: 'activate',
      SUSPENDED: isVendorDriver ? 'terminate' : 'suspend',
      INACTIVE: 'mark inactive',
      PENDING: 'reset to pending',
      ON_LEAVE: 'mark on leave',
      TERMINATED: 'terminate',
    }[newStatus] || 'change status of';
    if (!confirm(`Are you sure you want to ${verb} ${driver.name}?`)) return;

    setUpdatingStatus(true);
    try {
      const qs = `?source=${resolvedSource}`;
      const res = await fetch(`/api/manager/drivers/${id}${qs}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setDriver((d) => d ? { ...d, status: data.driver.status } : d);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // Identity, status and the status actions go into the shared sticky bar, which
  // was otherwise rendering empty while this page drew its own header below it.
  const hdrCfg = driver ? (STATUS_CONFIG[driver.status] || FALLBACK_STATUS) : FALLBACK_STATUS;
  const hdrSuspendStatus = isVendorDriver ? 'TERMINATED' : 'SUSPENDED';
  const hdrSuspendLabel = isVendorDriver ? 'Terminate' : 'Suspend';
  useManagerPageHeader(
    driver?.name || 'Driver',
    undefined,
    driver ? (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {isVendorDriver ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wider">
            <Store className="w-3 h-3" /> Vendor
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase tracking-wider">
            <User className="w-3 h-3" /> Direct
          </span>
        )}
        {driver.did && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full font-mono">
            <Shield className="w-3.5 h-3.5" /> {driver.did}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${hdrCfg.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hdrCfg.dot}`} />
          {hdrCfg.label}
        </span>
        {driver.status !== 'ACTIVE' && (
          <Button size="sm" onClick={() => changeStatus('ACTIVE')} disabled={updatingStatus} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="w-4 h-4 mr-1" />
            {driver.status === 'PENDING' ? 'Approve' : 'Activate'}
          </Button>
        )}
        {driver.status !== hdrSuspendStatus && (
          <Button size="sm" variant="outline" onClick={() => changeStatus(hdrSuspendStatus)} disabled={updatingStatus} className="text-red-700 border-red-200 hover:bg-red-50">
            <Ban className="w-4 h-4 mr-1" /> {hdrSuspendLabel}
          </Button>
        )}
        {driver.status !== 'INACTIVE' && (
          <Button size="sm" variant="outline" onClick={() => changeStatus('INACTIVE')} disabled={updatingStatus}>
            <ShieldAlert className="w-4 h-4 mr-1" /> Mark Inactive
          </Button>
        )}
        {isVendorDriver && driver.status !== 'ON_LEAVE' && (
          <Button size="sm" variant="outline" onClick={() => changeStatus('ON_LEAVE')} disabled={updatingStatus}>
            <Clock className="w-4 h-4 mr-1" /> On Leave
          </Button>
        )}
      </div>
    ) : undefined,
    <Link
      href="/manager/drivers"
      title="Back to drivers"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <Link href="/manager/drivers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Drivers
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Driver not found'}</h3>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[driver.status] || FALLBACK_STATUS;

  return (
    <div className="space-y-6">
      {/* Vendor-managed banner */}
      {isVendorDriver && driver.vendor && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-amber-600" />
            <span className="text-amber-900">
              <span className="font-semibold">Vendor-managed driver</span> · added by{' '}
              <Link href={`/manager/vendors/${driver.vendor.id}`} className="font-semibold underline hover:text-amber-700">
                {driver.vendor.businessName}
              </Link>
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
            vendor_staff
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`rounded-2xl border p-6 ${statusCfg.banner}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {driver.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={driver.profilePhoto} alt={driver.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow ${
                isVendorDriver
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                {driver.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {/* Name, type/DID badges and status pill now live in the sticky bar. */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 capitalize">{driver.role?.toLowerCase()}</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">Joined {formatDate(driver.joiningDate)}</span>
              </div>

              {/* CRM tags — add/remove manager follow-up tags (same as vendors) */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                {tags.map((t) => {
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
                  onClick={() => setTagEditorOpen((o) => !o)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                >
                  <Plus className="w-3 h-3" />
                  {tags.length === 0 ? 'Add tag' : 'Edit tags'}
                </button>
              </div>

              {tagEditorOpen && (
                <div className="mt-2 p-3 bg-white/70 border border-gray-200 rounded-lg max-w-2xl">
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
                    {DRIVER_TAGS.map((t) => {
                      const present = tags.includes(t.key);
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

          {/* Status actions moved into the sticky bar. */}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile + License + Identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{driver.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium truncate">{driver.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="font-medium">{formatDate(driver.dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Salary</p>
                  <p className="font-medium">{driver.salary > 0 ? formatCurrency(driver.salary) : '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium">
                    {driver.address || '—'}
                    {(driver.city || driver.state || driver.pincode) && (
                      <span className="block text-gray-600 mt-0.5">
                        {[driver.city, driver.state, driver.pincode].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {(driver.emergencyContact || driver.emergencyPhone) && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <Phone className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{driver.emergencyContact || '—'} {driver.emergencyPhone && <span className="text-gray-500">· {driver.emergencyPhone}</span>}</p>
                  </div>
                </div>
              )}
              {driver.lastLoginAt && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="font-medium">{formatDate(driver.lastLoginAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* License */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IdCard className="w-5 h-5 text-blue-500" /> Driving License
            </h2>
            {driver.licenseNumber ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="font-mono font-medium">{driver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{driver.licenseType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expiry</p>
                  <p className="font-medium">{formatDate(driver.licenseExpiry)}</p>
                </div>
                {driver.licenseDocument && (
                  <div>
                    <p className="text-xs text-gray-500">Document</p>
                    <a href={driver.licenseDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-sm font-medium">
                      <FileText className="w-3.5 h-3.5" /> View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No license information provided</p>
            )}
          </div>

          {/* Identity Documents */}
          {(driver.aadharNumber || driver.panNumber) && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Identity Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {driver.aadharNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Aadhar Number</p>
                    <p className="font-mono font-medium">{driver.aadharNumber}</p>
                    {driver.aadharDocument && (
                      <a href={driver.aadharDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-xs font-medium mt-1">
                        <FileText className="w-3 h-3" /> View document
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
                {driver.panNumber && (
                  <div>
                    <p className="text-xs text-gray-500">PAN Number</p>
                    <p className="font-mono font-medium">{driver.panNumber}</p>
                    {driver.panDocument && (
                      <a href={driver.panDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-xs font-medium mt-1">
                        <FileText className="w-3 h-3" /> View document
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-purple-500" /> Recent Bookings
              </h2>
              <span className="text-sm text-gray-500">{totalBookings} total</span>
            </div>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No bookings assigned to this driver yet</p>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((b) => (
                  <div key={b.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-gray-900">{b.bookingNumber}</p>
                      <p className="text-sm text-gray-700 truncate">{b.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {b.pickupCity}{b.dropCity ? ` → ${b.dropCity}` : ''} · {formatDate(b.pickupDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(b.grandTotal || 0)}</p>
                      <p className="text-xs text-gray-500">{b.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: vehicles + bank */}
        <div className="space-y-6">
          {/* Vehicles */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" /> Vehicles
              <span className="text-xs text-gray-400 font-normal">({vehicles.length})</span>
            </h2>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No vehicles linked</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className={`border rounded-lg p-3 ${v.isActive ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-gray-50/40'}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{v.make} {v.model}{v.year ? ` (${v.year})` : ''}</p>
                      {!v.isActive && <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">Inactive</span>}
                    </div>
                    {v.registrationNo && <p className="text-xs font-mono text-gray-600 mt-0.5">{v.registrationNo}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.category && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{v.category}</span>}
                      {v.seatingCapacity && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{v.seatingCapacity} seats</span>}
                      {v.fuelType && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{v.fuelType}</span>}
                      {v.color && <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{v.color}</span>}
                    </div>
                    {(v.insuranceExpiry || v.rcExpiry || v.fitnessExpiry || v.permitExpiry) && (
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
                        {v.insuranceExpiry && <span>Insurance: {formatDate(v.insuranceExpiry)}</span>}
                        {v.rcExpiry && <span>RC: {formatDate(v.rcExpiry)}</span>}
                        {v.fitnessExpiry && <span>Fitness: {formatDate(v.fitnessExpiry)}</span>}
                        {v.permitExpiry && <span>Permit: {formatDate(v.permitExpiry)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank */}
          {(driver.bankName || driver.accountNumber) && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" /> Bank Details
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="font-medium">{driver.bankName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Holder</p>
                  <p className="font-medium">{driver.accountHolderName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="font-mono font-medium">{maskAccount(driver.accountNumber) || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">IFSC Code</p>
                  <p className="font-mono font-medium">{driver.ifscCode || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
