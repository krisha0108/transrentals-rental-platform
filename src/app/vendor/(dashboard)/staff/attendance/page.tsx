'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCw,
  UserCheck,
  UserX,
  Coffee,
  Save,
  Loader2,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  profilePhoto: string | null;
}

interface Summary {
  totalStaff: number;
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalHalfDay: number;
  workingDays: number;
  month: number;
  year: number;
}

interface TodaySummary {
  date: string;
  present: number;
  absent: number;
  leave: number;
  notMarked: number;
}

const roleLabels: Record<string, string> = {
  DRIVER: 'Driver',
  HELPER: 'Helper',
  OFFICE_STAFF: 'Office Staff',
  MECHANIC: 'Mechanic',
  SUPERVISOR: 'Supervisor',
};

const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-500', bgLight: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-500 to-emerald-600' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500', bgLight: 'bg-red-100', text: 'text-red-700', gradient: 'from-red-500 to-rose-600' },
  { value: 'LEAVE', label: 'Leave', color: 'bg-emerald-500', bgLight: 'bg-emerald-100', text: 'text-emerald-700', gradient: 'from-emerald-500 to-emerald-600' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-emerald-500', bgLight: 'bg-emerald-100', text: 'text-emerald-700', gradient: 'from-emerald-500 to-emerald-600' },
];

export default function AttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, any>>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mark attendance modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markingDate, setMarkingDate] = useState<string>('');
  const [markingRecords, setMarkingRecords] = useState<Record<string, string>>({});

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();

      const response = await fetch(`/api/vendor/staff/attendance?month=${month}&year=${year}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
        setAttendanceMap(data.attendanceMap);
        setSummary(data.summary);
        setTodaySummary(data.todaySummary);
        setDaysInMonth(data.daysInMonth);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const openMarkModal = (date?: string) => {
    const dateToMark = date || new Date().toISOString().split('T')[0];
    setMarkingDate(dateToMark);

    // Pre-fill with existing attendance
    const records: Record<string, string> = {};
    staff.forEach(s => {
      const existing = attendanceMap[s.id]?.[dateToMark];
      records[s.id] = existing?.status || '';
    });
    setMarkingRecords(records);
    setShowMarkModal(true);
  };

  const handleMarkAttendance = async () => {
    setIsSaving(true);
    try {
      const records = Object.entries(markingRecords)
        .filter(([_, status]) => status)
        .map(([staffId, status]) => ({
          staffId,
          date: markingDate,
          status,
        }));

      if (records.length === 0) {
        alert('Please mark attendance for at least one staff member');
        return;
      }

      const response = await fetch('/api/vendor/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const data = await response.json();
      if (data.success) {
        setShowMarkModal(false);
        fetchAttendance();
      } else {
        alert(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      alert('Failed to mark attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = ATTENDANCE_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const option = ATTENDANCE_OPTIONS.find(o => o.value === status);
    return option?.label || '-';
  };

  // Generate days array for the current month
  const getDaysArray = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      days.push({
        day: i,
        dateStr: date.toISOString().split('T')[0],
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    return days;
  };

  const days = getDaysArray();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100"><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="h-8 bg-gray-100 rounded w-1/3"></div></div>)}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-2/3"></div><div className="h-3 bg-gray-100 rounded w-1/3"></div></div></div><div className="h-3 bg-gray-100 rounded w-full"></div><div className="flex gap-2"><div className="h-8 bg-gray-100 rounded-lg flex-1"></div><div className="h-8 bg-gray-100 rounded-lg w-24"></div></div></div>)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Staff', value: summary?.totalStaff || 0, icon: Users, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Total Present', value: summary?.totalPresent || 0, icon: UserCheck, gradient: 'from-green-500 to-emerald-600', text: 'text-green-600' },
    { label: 'Total Absent', value: summary?.totalAbsent || 0, icon: UserX, gradient: 'from-red-500 to-rose-600', text: 'text-red-600' },
    { label: 'Total Leave', value: summary?.totalLeave || 0, icon: Coffee, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
    { label: 'Working Days', value: summary?.workingDays || 0, icon: CalendarDays, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' },
  ];

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

      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="absolute right-1/3 top-1/2 w-24 h-24 bg-emerald-300/20 rounded-full blur-2xl animate-float-slow"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/vendor/staff"
                className="p-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Staff Attendance</h1>
                <p className="text-cyan-100 mt-1 text-sm sm:text-base">Track and manage staff attendance</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchAttendance}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>
              <button
                onClick={() => openMarkModal()}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 transition-all"
              >
                <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                Mark Today
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Today's Summary */}
        {todaySummary && (
          <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500"></div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Today's Attendance</h3>
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Present</p>
                  <p className="text-2xl font-bold text-green-600 mt-0.5">{todaySummary.present}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Absent</p>
                  <p className="text-2xl font-bold text-red-600 mt-0.5">{todaySummary.absent}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50 border border-emerald-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Leave</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">{todaySummary.leave}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Not Marked</p>
                  <p className="text-2xl font-bold text-gray-600 mt-0.5">{todaySummary.notMarked}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500"></div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-2.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <button
                onClick={nextMonth}
                className="p-2.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 via-emerald-50/50 to-slate-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide sticky left-0 bg-gradient-to-r from-slate-50 to-emerald-50/50 z-10">
                    Staff
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.day}
                      className={`px-2 py-3 text-center text-[11px] font-semibold uppercase min-w-[40px] cursor-pointer hover:bg-emerald-100/50 transition-colors ${
                        day.isWeekend ? 'text-gray-400 bg-gray-100/70' : 'text-gray-600'
                      } ${day.isToday ? 'bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-700' : ''}`}
                      onClick={() => openMarkModal(day.dateStr)}
                    >
                      <div>{day.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No staff found. Add staff members first.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staff.map((member, idx) => (
                    <tr key={member.id} style={{ animationDelay: `${idx * 40}ms` }} className="hover:bg-emerald-50/30 transition-colors animate-fade-up">
                      <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-9 h-9 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                            <div className="absolute inset-0 rounded-xl bg-emerald-400/40 blur-md opacity-0 hover:opacity-100 transition-opacity"></div>
                            <span className="relative">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">{roleLabels[member.role] || member.role}</p>
                          </div>
                        </div>
                      </td>
                      {days.map((day) => {
                        const record = attendanceMap[member.id]?.[day.dateStr];
                        const isPresent = record?.status === 'PRESENT';
                        return (
                          <td
                            key={day.day}
                            className={`px-1 py-2 text-center cursor-pointer hover:bg-emerald-100/40 transition-colors ${
                              day.isWeekend ? 'bg-gray-50/70' : ''
                            } ${day.isToday ? 'bg-emerald-50' : ''}`}
                            onClick={() => openMarkModal(day.dateStr)}
                          >
                            {record ? (
                              <div className="relative mx-auto w-6 h-6">
                                <div
                                  className={`w-6 h-6 rounded-full ${getStatusColor(record.status)} shadow-sm ring-2 ring-white`}
                                  title={getStatusLabel(record.status)}
                                />
                                {isPresent && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full mx-auto bg-gray-200 ring-2 ring-white" title="Not marked" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-up">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {ATTENDANCE_OPTIONS.map((option) => (
              <div key={option.value} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${option.bgLight} ${option.text} border border-current/10`}>
                <div className={`w-3 h-3 rounded-full ${option.color} shadow-sm`} />
                <span className="text-xs font-semibold">{option.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-xs font-semibold">Not Marked</span>
            </div>
          </div>
        </div>

        {/* Mark Attendance Modal */}
        {showMarkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85dvh] overflow-hidden shadow-2xl animate-pop-in">
              {/* Gradient Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x p-5">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow"></div>
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl animate-float-rev"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Mark Attendance</h3>
                    <p className="text-xs text-cyan-100 mt-0.5">
                      {new Date(markingDate).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 max-h-[50dvh] overflow-y-auto bg-gradient-to-br from-slate-50/50 to-emerald-50/30">
                <div className="space-y-2.5">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0">
                          <span className="relative">{member.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">{roleLabels[member.role] || member.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setMarkingRecords(prev => ({ ...prev, [member.id]: option.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                              markingRecords[member.id] === option.value
                                ? `bg-gradient-to-r ${option.gradient} text-white shadow-md scale-105`
                                : `${option.bgLight} ${option.text} hover:scale-105`
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAttendance}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
