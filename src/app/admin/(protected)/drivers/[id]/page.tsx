'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Phone, Mail, MapPin, CalendarDays,
  IdCard, Car, ShieldCheck, ShieldX, ShieldAlert, Clock,
  Building2, IndianRupee, FileText, AlertCircle, ExternalLink,
  CheckCircle, Ban, RotateCcw, Store, User, Edit2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type DriverStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type DriverSource = 'standalone' | 'vendor';

interface Driver {
  id: string;
  did?: string | null;
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

  // Contact edit modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSaving, setContactSaving] = useState(false);

  const fetchDriver = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = source ? `?source=${source}` : '';
      const res = await fetch(`/api/admin/drivers/${id}${qs}`);
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
    } catch {
      setError('Failed to load driver');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDriver(); }, [id, source]);

  const isVendorDriver = resolvedSource === 'vendor';

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
      const res = await fetch(`/api/admin/drivers/${id}${qs}`, {
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

  const handleContactChange = async () => {
    if (!contactEmail && !contactPhone) return;
    setContactSaving(true);
    try {
      const res = await fetch(`/api/admin/drivers/${id}?source=${resolvedSource}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CHANGE_CONTACT', newEmail: contactEmail || undefined, newPhone: contactPhone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to update contact'); return; }
      setDriver((d) => d ? { ...d, ...(contactEmail && { email: contactEmail }), ...(contactPhone && { phone: contactPhone }) } : d);
      setShowContactModal(false);
      setContactEmail('');
      setContactPhone('');
    } catch { alert('Failed to update contact'); }
    finally { setContactSaving(false); }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
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
  const suspendStatus = isVendorDriver ? 'TERMINATED' : 'SUSPENDED';
  const suspendLabel = isVendorDriver ? 'Terminate' : 'Suspend';

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </Link>

      {/* Vendor-managed banner */}
      {isVendorDriver && driver.vendor && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-amber-600" />
            <span className="text-amber-900">
              <span className="font-semibold">Vendor-managed driver</span> · added by{' '}
              <Link href={`/admin/vendors/${driver.vendor.id}`} className="font-semibold underline hover:text-amber-700">
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{driver.name}</h1>
                {isVendorDriver ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wider">
                    <Store className="w-3 h-3" /> Vendor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase tracking-wider">
                    <User className="w-3 h-3" /> Direct
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
                <span className="text-xs text-gray-500 capitalize">{driver.role?.toLowerCase()}</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">Joined {formatDate(driver.joiningDate)}</span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-1">ID: {driver.id}</p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2">
            {driver.status !== 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => changeStatus('ACTIVE')}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {driver.status === 'PENDING' ? 'Approve' : 'Activate'}
              </Button>
            )}
            {driver.status !== suspendStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus(suspendStatus)}
                disabled={updatingStatus}
                className="text-red-700 border-red-200 hover:bg-red-50"
              >
                <Ban className="w-4 h-4 mr-1" /> {suspendLabel}
              </Button>
            )}
            {driver.status !== 'INACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus('INACTIVE')}
                disabled={updatingStatus}
              >
                <ShieldAlert className="w-4 h-4 mr-1" /> Mark Inactive
              </Button>
            )}
            {isVendorDriver && driver.status !== 'ON_LEAVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus('ON_LEAVE')}
                disabled={updatingStatus}
              >
                <Clock className="w-4 h-4 mr-1" /> On Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile + License + Identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <button
                onClick={() => { setContactEmail(driver.email); setContactPhone(driver.phone); setShowContactModal(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Contact
              </button>
            </div>
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
              {isVendorDriver && driver.did && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Driver ID</p>
                    <p className="font-mono font-medium">{driver.did}</p>
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

      {/* Contact Edit Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Change Contact Info</h2>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Leave blank to keep current value.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder={driver.email}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder={driver.phone}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowContactModal(false)} disabled={contactSaving}>Cancel</Button>
              <Button
                onClick={handleContactChange}
                disabled={contactSaving || (!contactEmail && !contactPhone)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {contactSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
