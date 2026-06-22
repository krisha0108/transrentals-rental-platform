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
  Shield,
} from 'lucide-react';

interface Staff {
  id: string;
  did: string | null;
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
  DRIVER: 'bg-emerald-100 text-emerald-700',
  HELPER: 'bg-cyan-100 text-cyan-700',
  OFFICE_STAFF: 'bg-emerald-100 text-emerald-700',
  MECHANIC: 'bg-emerald-100 text-emerald-700',
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
  ON_LEAVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'On Leave' },
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

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
        <style jsx global>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
        <div className="space-y-6 max-w-[1600px] mx-auto">
          {/* Hero Skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 sm:p-8">
            <div className="absolute inset-0 opacity-10"><div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" /><div className="absolute left-1/3 -bottom-8 w-32 h-32 rounded-full bg-white" /></div>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-white/20 ${shimmer}`} />
                <div className="space-y-2">
                  <div className={`h-7 w-52 bg-white/25 rounded-lg ${shimmer}`} />
                  <div className={`h-4 w-72 bg-white/15 rounded ${shimmer}`} />
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => <div key={i} className={`h-10 ${i === 4 ? 'w-28 bg-white/30' : 'w-24 bg-white/15'} rounded-xl ${shimmer}`} />)}
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5">
                    <div className={`h-3 w-16 bg-gray-100 rounded ${shimmer}`} />
                    <div className={`h-8 w-12 bg-gray-200 rounded-lg ${shimmer}`} />
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-emerald-100 ${shimmer}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className={`flex-1 h-10 bg-gray-50 border border-gray-200 rounded-xl ${shimmer}`} />
              <div className="flex gap-2">
                <div className={`h-10 w-28 bg-gray-50 border border-gray-200 rounded-xl ${shimmer}`} />
                <div className={`h-10 w-28 bg-gray-50 border border-gray-200 rounded-xl ${shimmer}`} />
              </div>
            </div>
          </div>

          {/* Staff Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gray-100 ${shimmer}`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-32 bg-gray-200 rounded ${shimmer}`} />
                        <div className={`h-5 w-16 bg-gray-100 rounded-full ${shimmer}`} />
                      </div>
                      <div className={`h-3 w-20 bg-gray-100 rounded ${shimmer}`} />
                      <div className="flex gap-3 mt-2">
                        <div className={`h-3 w-24 bg-gray-100 rounded ${shimmer}`} />
                        <div className={`h-3 w-28 bg-gray-100 rounded ${shimmer}`} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className={`h-2.5 w-12 bg-gray-200 rounded mx-auto mb-1.5 ${shimmer}`} />
                        <div className={`h-5 w-6 bg-gray-200 rounded mx-auto ${shimmer}`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                  <div className={`h-8 flex-1 bg-gray-50 rounded-lg ${shimmer}`} />
                  <div className={`h-8 flex-1 bg-gray-50 rounded-lg ${shimmer}`} />
                  <div className={`h-8 w-8 bg-gray-50 rounded-lg ${shimmer}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Staff', value: stats.total, icon: Users, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Active', value: stats.active, icon: UserCheck, gradient: 'from-green-500 to-emerald-600', text: 'text-green-600' },
    { label: 'On Leave', value: stats.onLeave, icon: Clock, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Drivers', value: stats.drivers, icon: Car, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Monthly Payroll', value: `₹${(stats.totalSalary / 1000).toFixed(0)}K`, icon: IndianRupee, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
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
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Staff Management</h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base">Manage your employees, drivers, and team</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchStaff}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>
              <Link
                href="/vendor/staff/attendance"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
              >
                <Clock className="w-4 h-4" />
                Attendance
              </Link>
              <Link
                href="/vendor/staff/payroll"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
              >
                <IndianRupee className="w-4 h-4" />
                Payroll
              </Link>
              <Link
                href="/vendor/staff/add"
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Add Staff
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.text} group-hover:scale-110 origin-left transition-transform`}>{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm font-medium cursor-pointer"
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
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm font-medium cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {staff.map((member, idx) => {
            const status = statusColors[member.status] || statusColors.ACTIVE;
            const roleColor = roleColors[member.role] || 'bg-gray-100 text-gray-700';
            const roleLabel = roleLabels[member.role] || member.role;
            const isLicenseExpired = member.licenseExpiry && new Date(member.licenseExpiry) < new Date();

            return (
              <div
                key={member.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 animate-pop-in"
              >
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Header */}
                <div className="relative p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                        <div className="absolute inset-0 rounded-2xl bg-emerald-400/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative">{member.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{member.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${status.bg} ${status.text} border border-current/10 shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="relative p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                      <Phone className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="truncate font-medium">{member.phone}</span>
                  </div>
                  {member.role === 'DRIVER' && member.did && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="font-semibold text-blue-600 tracking-wide">{member.did}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                        <Mail className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span>Joined {formatDate(member.joiningDate)}</span>
                  </div>
                </div>

                {/* License Warning */}
                {member.role === 'DRIVER' && isLicenseExpired && (
                  <div className="relative px-4 pb-3">
                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                      <span className="text-xs font-semibold text-red-700">License Expired!</span>
                    </div>
                  </div>
                )}

                {/* Attendance Summary */}
                {member.attendanceSummary && (
                  <div className="relative px-4 pb-3">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">This Month</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="text-center p-1.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <p className="text-base font-bold text-green-600">{member.attendanceSummary.present}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Present</p>
                      </div>
                      <div className="text-center p-1.5 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
                        <p className="text-base font-bold text-red-600">{member.attendanceSummary.absent}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Absent</p>
                      </div>
                      <div className="text-center p-1.5 bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-base font-bold text-emerald-600">{member.attendanceSummary.leave}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-semibold">Leave</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Salary */}
                <div className="relative px-4 pb-3">
                  <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-gray-600 uppercase font-semibold">Salary</span>
                    <span className="font-bold text-sm text-emerald-700">₹{member.salary.toLocaleString()}<span className="text-[10px] font-medium text-gray-500">/mo</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative p-3 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-gray-100 flex items-center gap-2">
                  <Link
                    href={`/vendor/staff/${member.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-xs transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <Link
                    href={`/vendor/staff/${member.id}/edit`}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    disabled={deleteLoading === member.id}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                    title="Delete"
                  >
                    {deleteLoading === member.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {staff.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-500 mb-6">
              {filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first staff member to get started'}
            </p>
            <Link
              href="/vendor/staff/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
