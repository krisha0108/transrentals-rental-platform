'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  Eye,
  Edit,
  MoreVertical,
  Car,
  IndianRupee,
  UserCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  joiningDate: string;
  profilePhoto: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  salary: number;
  attendanceSummary?: {
    present: number;
    absent: number;
    leave: number;
    halfDay: number;
  };
}

interface Stats {
  total: number;
  active: number;
  onLeave: number;
  drivers: number;
  helpers: number;
  totalSalary: number;
}

const roleColors: Record<string, string> = {
  DRIVER: 'bg-blue-100 text-blue-700',
  HELPER: 'bg-cyan-100 text-cyan-700',
  OFFICE_STAFF: 'bg-purple-100 text-purple-700',
  MECHANIC: 'bg-orange-100 text-orange-700',
  SUPERVISOR: 'bg-green-100 text-green-700',
};

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

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    onLeave: 0,
    drivers: 0,
    helpers: 0,
    totalSalary: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.set('role', filterRole);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/vendor/staff?${params}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [filterRole, filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to delete ${staffName}? This will also delete all attendance records.`)) {
      return;
    }

    setDeleteLoading(staffId);
    try {
      const response = await fetch(`/api/vendor/staff/${staffId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchStaff();
      } else {
        alert(data.error || 'Failed to delete staff');
      }
    } catch (error) {
      alert('Failed to delete staff');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your employees, drivers, and team</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStaff}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <Link
            href="/vendor/staff/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Clock className="w-5 h-5" />
            Attendance
          </Link>
          <Link
            href="/vendor/staff/payroll"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <IndianRupee className="w-5 h-5" />
            Payroll
          </Link>
          <Link
            href="/vendor/staff/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.onLeave}</p>
              <p className="text-xs text-gray-500">On Leave</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Car className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.drivers}</p>
              <p className="text-xs text-gray-500">Drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{(stats.totalSalary / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Monthly Payroll</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="DRIVER">Drivers</option>
              <option value="HELPER">Helpers</option>
              <option value="MECHANIC">Mechanics</option>
              <option value="SUPERVISOR">Supervisors</option>
              <option value="OFFICE_STAFF">Office Staff</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => {
          const status = statusColors[member.status] || statusColors.ACTIVE;
          const roleColor = roleColors[member.role] || 'bg-gray-100 text-gray-700';
          const roleLabel = roleLabels[member.role] || member.role;
          const isLicenseExpired = member.licenseExpiry && new Date(member.licenseExpiry) < new Date();

          return (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {member.phone}
                </div>
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {member.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Joined: {formatDate(member.joiningDate)}
                </div>
              </div>

              {/* License Warning (for drivers) */}
              {member.role === 'DRIVER' && isLicenseExpired && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">License Expired!</span>
                  </div>
                </div>
              )}

              {/* Attendance Summary */}
              {member.attendanceSummary && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-500 mb-2">This Month's Attendance</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{member.attendanceSummary.present}</p>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="flex-1 text-center p-2 bg-red-50 rounded">
                      <p className="text-lg font-bold text-red-600">{member.attendanceSummary.absent}</p>
                      <p className="text-xs text-gray-500">Absent</p>
                    </div>
                    <div className="flex-1 text-center p-2 bg-yellow-50 rounded">
                      <p className="text-lg font-bold text-yellow-600">{member.attendanceSummary.leave}</p>
                      <p className="text-xs text-gray-500">Leave</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Salary:</span>
                  <span className="font-semibold text-gray-900">₹{member.salary.toLocaleString()}/month</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 flex justify-between">
                <Link
                  href={`/vendor/staff/${member.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/vendor/staff/${member.id}/edit`}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    disabled={deleteLoading === member.id}
                    className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                  >
                    {deleteLoading === member.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {staff.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-500 mb-4">
            {filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first staff member to get started'}
          </p>
          <Link
            href="/vendor/staff/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </Link>
        </div>
      )}
    </div>
  );
}
