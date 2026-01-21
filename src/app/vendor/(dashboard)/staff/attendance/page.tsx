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
  { value: 'PRESENT', label: 'Present', color: 'bg-green-500', bgLight: 'bg-green-100', text: 'text-green-700' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500', bgLight: 'bg-red-100', text: 'text-red-700' },
  { value: 'LEAVE', label: 'Leave', color: 'bg-yellow-500', bgLight: 'bg-yellow-100', text: 'text-yellow-700' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-orange-500', bgLight: 'bg-orange-100', text: 'text-orange-700' },
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
            <p className="text-gray-600">Track and manage staff attendance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAttendance}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={() => openMarkModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Calendar className="w-5 h-5" />
            Mark Today
          </button>
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
              <p className="text-2xl font-bold text-gray-900">{summary?.totalStaff || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{summary?.totalPresent || 0}</p>
              <p className="text-xs text-gray-500">Total Present</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalAbsent || 0}</p>
              <p className="text-xs text-gray-500">Total Absent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coffee className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalLeave || 0}</p>
              <p className="text-xs text-gray-500">Total Leave</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.workingDays || 0}</p>
              <p className="text-xs text-gray-500">Working Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      {todaySummary && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Attendance</h3>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Present:</span>{' '}
              <span className="font-bold text-green-600">{todaySummary.present}</span>
            </div>
            <div>
              <span className="text-gray-500">Absent:</span>{' '}
              <span className="font-bold text-red-600">{todaySummary.absent}</span>
            </div>
            <div>
              <span className="text-gray-500">Leave:</span>{' '}
              <span className="font-bold text-yellow-600">{todaySummary.leave}</span>
            </div>
            <div>
              <span className="text-gray-500">Not Marked:</span>{' '}
              <span className="font-bold text-gray-600">{todaySummary.notMarked}</span>
            </div>
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Staff
                </th>
                {days.map((day) => (
                  <th
                    key={day.day}
                    className={`px-2 py-3 text-center text-xs font-medium uppercase min-w-[40px] cursor-pointer hover:bg-gray-100 ${
                      day.isWeekend ? 'text-gray-400 bg-gray-100' : 'text-gray-500'
                    } ${day.isToday ? 'bg-blue-50' : ''}`}
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
                  <td colSpan={days.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No staff found. Add staff members first.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{roleLabels[member.role] || member.role}</p>
                        </div>
                      </div>
                    </td>
                    {days.map((day) => {
                      const record = attendanceMap[member.id]?.[day.dateStr];
                      return (
                        <td
                          key={day.day}
                          className={`px-1 py-2 text-center cursor-pointer hover:bg-gray-100 ${
                            day.isWeekend ? 'bg-gray-50' : ''
                          } ${day.isToday ? 'bg-blue-50' : ''}`}
                          onClick={() => openMarkModal(day.dateStr)}
                        >
                          {record ? (
                            <div
                              className={`w-6 h-6 rounded-full mx-auto ${getStatusColor(record.status)}`}
                              title={getStatusLabel(record.status)}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full mx-auto bg-gray-200" title="Not marked" />
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
      <div className="flex flex-wrap gap-4 justify-center">
        {ATTENDANCE_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${option.color}`} />
            <span className="text-sm text-gray-600">{option.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200" />
          <span className="text-sm text-gray-600">Not Marked</span>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
              <p className="text-sm text-gray-600">
                {new Date(markingDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{roleLabels[member.role] || member.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {ATTENDANCE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setMarkingRecords(prev => ({ ...prev, [member.id]: option.value }))}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            markingRecords[member.id] === option.value
                              ? `${option.color} text-white`
                              : `${option.bgLight} ${option.text} hover:opacity-80`
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

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowMarkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
