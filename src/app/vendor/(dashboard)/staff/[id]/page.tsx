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
} from 'lucide-react';

interface Staff {
  id: string;
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
  ON_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Leave' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terminated' },
};

const attendanceStatusColors: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: 'bg-green-100', text: 'text-green-700' },
  ABSENT: { bg: 'bg-red-100', text: 'text-red-700' },
  LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  HALF_DAY: { bg: 'bg-orange-100', text: 'text-orange-700' },
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Staff not found</h2>
        <Link href="/vendor/staff" className="text-blue-600 hover:underline">
          Back to staff list
        </Link>
      </div>
    );
  }

  const status = statusColors[staff.status] || statusColors.ACTIVE;
  const isLicenseExpired = staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/staff"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
            <p className="text-gray-600">{roleLabels[staff.role] || staff.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/vendor/staff/${staffId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Edit className="w-5 h-5" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {staff.role === 'DRIVER' && isLicenseExpired && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            License Expired
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Personal Information</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {staff.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {staff.email || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                <p className="font-medium">{formatDate(staff.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Joining Date</p>
                <p className="font-medium">{formatDate(staff.joiningDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  {[staff.address, staff.city, staff.state, staff.pincode].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Identity Documents</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Aadhar Number</p>
                <p className="font-medium">{staff.aadharNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                <p className="font-medium">{staff.panNumber || '-'}</p>
              </div>
            </div>
          </div>

          {/* License Details (for drivers) */}
          {staff.role === 'DRIVER' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Driving License</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">License Number</p>
                  <p className="font-medium">{staff.licenseNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">License Type</p>
                  <p className="font-medium">{staff.licenseType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                  <p className={`font-medium ${isLicenseExpired ? 'text-red-600' : ''}`}>
                    {formatDate(staff.licenseExpiry)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Bank Details</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                <p className="font-medium">{staff.bankName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                <p className="font-medium">{staff.accountHolderName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Number</p>
                <p className="font-medium">{staff.accountNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                <p className="font-medium">{staff.ifscCode || '-'}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Emergency Contact</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Contact Name</p>
                <p className="font-medium">{staff.emergencyContact || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                <p className="font-medium">{staff.emergencyPhone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Salary Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Salary</h3>
            <p className="text-3xl font-bold text-gray-900">
              ₹{staff.salary.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">per month</p>
          </div>

          {/* Attendance Summary */}
          {attendanceSummary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">This Month&apos;s Attendance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Present
                  </span>
                  <span className="font-semibold text-green-600">{attendanceSummary.present}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Absent
                  </span>
                  <span className="font-semibold text-red-600">{attendanceSummary.absent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-yellow-500" />
                    Leave
                  </span>
                  <span className="font-semibold text-yellow-600">{attendanceSummary.leave}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Half Day
                  </span>
                  <span className="font-semibold text-orange-600">{attendanceSummary.halfDay}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Attendance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Attendance</h3>
            <div className="space-y-2">
              {staff.attendance.slice(0, 7).map((record) => {
                const attStatus = attendanceStatusColors[record.status] || attendanceStatusColors.PRESENT;
                return (
                  <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">
                      {formatDate(record.date)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${attStatus.bg} ${attStatus.text}`}>
                      {record.status}
                    </span>
                  </div>
                );
              })}
              {staff.attendance.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No attendance records</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
