'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Car,
  IndianRupee,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Wallet,
  ShieldCheck,
  Sparkles,
  Shield,
} from 'lucide-react';

interface Staff {
  id: string;
  did: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  dateOfBirth: string | null;
  joiningDate: string;
  profilePhoto: string | null;
  role: string;
  status: string;
  aadharNumber: string | null;
  panNumber: string | null;
  licenseNumber: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
  salary: number;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: string;
  attendance: Array<{
    id: string;
    date: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
  }>;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  totalDays: number;
  workingDays: number;
}

const roleLabels: Record<string, string> = {
  DRIVER: 'Driver',
  HELPER: 'Helper',
  OFFICE_STAFF: 'Office Staff',
  MECHANIC: 'Mechanic',
  SUPERVISOR: 'Supervisor',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  ON_LEAVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'On Leave' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terminated' },
};

const attendanceStatusColors: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: 'bg-green-100', text: 'text-green-700' },
  ABSENT: { bg: 'bg-red-100', text: 'text-red-700' },
  LEAVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  HALF_DAY: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/vendor/staff/${staffId}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
        setAttendanceSummary(data.attendanceSummary);
      } else {
        alert(data.error || 'Failed to fetch staff details');
        router.push('/vendor/staff');
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      router.push('/vendor/staff');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [staffId]);

  const handleDelete = async () => {
    if (!staff) return;
    if (!confirm(`Are you sure you want to delete ${staff.name}? This will also delete all attendance records.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/vendor/staff/${staffId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        router.push('/vendor/staff');
      } else {
        alert(data.error || 'Failed to delete staff');
      }
    } catch (error) {
      alert('Failed to delete staff');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-100"></div>
          <div className="w-14 h-14 animate-spin border-4 border-emerald-600 border-t-transparent rounded-full absolute inset-0"></div>
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading staff details...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Staff not found</h2>
          <Link href="/vendor/staff" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to staff list
          </Link>
        </div>
      </div>
    );
  }

  const status = statusColors[staff.status] || statusColors.ACTIVE;
  const isLicenseExpired = staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date();

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Gradient Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/vendor/staff"
                className="p-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl text-white transition-all hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30 shrink-0">
                <span className="text-white font-bold text-xl">{staff.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">{staff.name}</h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {roleLabels[staff.role] || staff.role}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/vendor/staff/${staffId}/edit`}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
              >
                <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                )}
                Delete
              </button>
            </div>
          </div>

          {/* Status Row */}
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {status.label}
            </span>
            {staff.role === 'DRIVER' && isLicenseExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/90 text-white border border-red-300/50 backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                License Expired
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    {staff.phone}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{staff.email || '-'}</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Date of Birth</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    {formatDate(staff.dateOfBirth)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Joining Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    {formatDate(staff.joiningDate)}
                  </p>
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Address</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    {[staff.address, staff.city, staff.state, staff.pincode].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Identity Documents</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Aadhar Number</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.aadharNumber || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">PAN Number</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.panNumber || '-'}</p>
                </div>
              </div>
            </div>

            {/* License Details (for drivers) */}
            {staff.role === 'DRIVER' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '180ms' }}>
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                      <Car className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Driving License</h2>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {staff.did && (
                    <div className="sm:col-span-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Driver ID</p>
                      <p className="text-sm font-bold text-blue-600 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {staff.did}
                      </p>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">License Number</p>
                    <p className="text-sm font-semibold text-gray-900">{staff.licenseNumber || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">License Type</p>
                    <p className="text-sm font-semibold text-gray-900">{staff.licenseType || '-'}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isLicenseExpired ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gray-50/70 border-gray-100'}`}>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Expiry Date</p>
                    <p className={`text-sm font-semibold ${isLicenseExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(staff.licenseExpiry)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Bank Details</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Bank Name</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.bankName || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Account Holder</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.accountHolderName || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Account Number</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.accountNumber || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">IFSC Code</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.ifscCode || '-'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Emergency Contact</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Contact Name</p>
                  <p className="text-sm font-semibold text-gray-900">{staff.emergencyContact || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-500" />
                    {staff.emergencyPhone || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Card */}
            <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500"></div>
              <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Salary</h3>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  ₹{staff.salary.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">per month</p>
              </div>
            </div>

            {/* Attendance Summary */}
            {attendanceSummary && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '140ms' }}>
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">This Month&apos;s Attendance</h3>
                  </div>
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                    <span className="text-xs text-gray-700 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Present
                    </span>
                    <span className="font-bold text-green-600">{attendanceSummary.present}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-100">
                    <span className="text-xs text-gray-700 font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Absent
                    </span>
                    <span className="font-bold text-red-600">{attendanceSummary.absent}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-100">
                    <span className="text-xs text-gray-700 font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Leave
                    </span>
                    <span className="font-bold text-emerald-600">{attendanceSummary.leave}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-100">
                    <span className="text-xs text-gray-700 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Half Day
                    </span>
                    <span className="font-bold text-emerald-600">{attendanceSummary.halfDay}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Attendance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Recent Attendance</h3>
                </div>
              </div>
              <div className="p-5 space-y-1.5">
                {staff.attendance.slice(0, 7).map((record) => {
                  const attStatus = attendanceStatusColors[record.status] || attendanceStatusColors.PRESENT;
                  return (
                    <div key={record.id} className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                      <span className="text-xs text-gray-700 font-medium">
                        {formatDate(record.date)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${attStatus.bg} ${attStatus.text}`}>
                        {record.status}
                      </span>
                    </div>
                  );
                })}
                {staff.attendance.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">No attendance records</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
