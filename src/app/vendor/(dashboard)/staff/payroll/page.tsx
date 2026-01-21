'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  IndianRupee,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Users,
  Wallet,
  Eye,
  RefreshCw,
  Loader2,
  FileText,
  CreditCard,
  X,
  Check,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  salary: number;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
}

interface PaymentRecord {
  id: string;
  staffId: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  transactionId: string | null;
  remarks: string | null;
}

interface PayrollItem {
  staff: Staff;
  attendance: AttendanceSummary;
  workingDays: number;
  effectiveDays: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  payment?: PaymentRecord;
}

const roleLabels: Record<string, string> = {
  DRIVER: 'Driver',
  HELPER: 'Helper',
  OFFICE_STAFF: 'Office Staff',
  MECHANIC: 'Mechanic',
  SUPERVISOR: 'Supervisor',
};

const paymentMethods = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export default function PayrollPage() {
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState<PayrollItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipItem, setSlipItem] = useState<PayrollItem | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years dynamically (current year + 2 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      // Fetch staff, attendance, and payment data
      const [staffRes, attendanceRes, paymentsRes] = await Promise.all([
        fetch('/api/vendor/staff'),
        fetch(`/api/vendor/staff/attendance?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/vendor/staff/payments?month=${selectedMonth}&year=${selectedYear}`)
      ]);

      const staffData = await staffRes.json();
      const attendanceData = await attendanceRes.json();
      const paymentsData = await paymentsRes.json();

      if (!staffData.success || !attendanceData.success) {
        console.error('Failed to fetch data');
        return;
      }

      const paymentMap = paymentsData.success ? paymentsData.paymentMap : {};
      const daysInMonth = attendanceData.daysInMonth || new Date(selectedYear, selectedMonth + 1, 0).getDate();

      // Calculate Sundays in month (non-working days)
      let sundays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(selectedYear, selectedMonth, d);
        if (date.getDay() === 0) sundays++;
      }
      const workingDays = daysInMonth - sundays;

      // Calculate payroll for each staff
      const payroll: PayrollItem[] = staffData.staff.map((staff: Staff) => {
        const staffAttendance = attendanceData.attendanceMap[staff.id] || {};

        let present = 0;
        let absent = 0;
        let leave = 0;
        let halfDay = 0;

        Object.values(staffAttendance).forEach((record: any) => {
          switch (record.status) {
            case 'PRESENT': present++; break;
            case 'ABSENT': absent++; break;
            case 'LEAVE': leave++; break;
            case 'HALF_DAY': halfDay++; break;
          }
        });

        // Calculate effective working days (present + leave + half-day*0.5)
        const effectiveDays = present + leave + (halfDay * 0.5);

        // Calculate salary based on effective days
        const dailyRate = staff.salary / workingDays;
        const grossSalary = Math.round(dailyRate * effectiveDays);

        // Simple deductions (can be customized)
        const pfDeduction = Math.round(grossSalary * 0.12); // 12% PF (if applicable)
        const deductions = staff.salary > 15000 ? pfDeduction : 0; // PF only if salary > 15000

        const netSalary = grossSalary - deductions;

        return {
          staff,
          attendance: { present, absent, leave, halfDay },
          workingDays,
          effectiveDays,
          grossSalary,
          deductions,
          netSalary,
          payment: paymentMap[staff.id],
        };
      });

      setPayrollData(payroll);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMarkPaid = (item: PayrollItem) => {
    setPaymentItem(item);
    setPaymentMethod('BANK_TRANSFER');
    setTransactionId('');
    setRemarks('');
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!paymentItem) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/vendor/staff/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: paymentItem.staff.id,
          month: selectedMonth,
          year: selectedYear,
          workingDays: paymentItem.workingDays,
          presentDays: paymentItem.attendance.present,
          absentDays: paymentItem.attendance.absent,
          leaveDays: paymentItem.attendance.leave,
          halfDays: paymentItem.attendance.halfDay,
          effectiveDays: paymentItem.effectiveDays,
          baseSalary: paymentItem.staff.salary,
          grossSalary: paymentItem.grossSalary,
          deductions: paymentItem.deductions,
          netSalary: paymentItem.netSalary,
          paymentMethod,
          transactionId: transactionId || null,
          remarks: remarks || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Payment of ${formatCurrency(paymentItem.netSalary)} marked as paid for ${paymentItem.staff.name}`);
        setShowPaymentModal(false);
        fetchPayrollData();
      } else {
        alert(data.error || 'Failed to mark payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Phone', 'Role', 'Present', 'Absent', 'Leave', 'Half Day', 'Base Salary', 'Gross Salary', 'Deductions', 'Net Salary', 'Status'];

    const rows = payrollData.map(item => [
      item.staff.name,
      item.staff.phone,
      roleLabels[item.staff.role] || item.staff.role,
      item.attendance.present,
      item.attendance.absent,
      item.attendance.leave,
      item.attendance.halfDay,
      item.staff.salary,
      item.grossSalary,
      item.deductions,
      item.netSalary,
      item.payment?.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'
    ]);

    const csvContent = [
      `Payroll Report - ${months[selectedMonth]} ${selectedYear}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${months[selectedMonth]}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generatePayslip = (item: PayrollItem) => {
    setSlipItem(item);
    setShowSlipModal(true);
  };

  const downloadPayslip = () => {
    if (!payslipRef.current || !slipItem) return;

    // Create a printable version
    const printContent = payslipRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${slipItem.staff.name} - ${months[selectedMonth]} ${selectedYear}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .payslip { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .header h1 { margin: 0; color: #1a365d; }
              .header p { margin: 5px 0; color: #666; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; }
              .info-box h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
              .info-box p { margin: 5px 0; font-size: 13px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .table th { background: #f0f0f0; }
              .table .right { text-align: right; }
              .total-row { font-weight: bold; background: #e8f5e9 !important; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
              @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Calculate totals
  const totalGross = payrollData.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalDeductions = payrollData.reduce((sum, p) => sum + p.deductions, 0);
  const totalNet = payrollData.reduce((sum, p) => sum + p.netSalary, 0);
  const paidCount = payrollData.filter(p => p.payment?.paymentStatus === 'PAID').length;
  const pendingCount = payrollData.length - paidCount;

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
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">View calculated salaries based on attendance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPayrollData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Month Selector & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Payroll Month</p>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Payroll</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalNet)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Staff</p>
              <p className="text-xl font-bold text-blue-600">{payrollData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-xl font-bold text-emerald-600">{paidCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leave</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollData.map((item) => (
                <tr key={item.staff.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {item.staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.staff.name}</p>
                        <p className="text-xs text-gray-500">{item.staff.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {roleLabels[item.staff.role] || item.staff.role}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-medium text-green-600">{item.attendance.present}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-medium text-red-600">{item.attendance.absent}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-medium text-yellow-600">{item.attendance.leave}</span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500">
                    {formatCurrency(item.staff.salary)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-green-600">
                    {formatCurrency(item.netSalary)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {item.payment?.paymentStatus === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedPayroll(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => generatePayslip(item)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition"
                        title="Download Payslip"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                      </button>
                      {item.payment?.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(item)}
                          className="p-2 hover:bg-green-100 rounded-lg transition"
                          title="Mark as Paid"
                        >
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-900">
                  Total ({payrollData.length} employees)
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {formatCurrency(payrollData.reduce((sum, p) => sum + p.staff.salary, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  {formatCurrency(totalNet)}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {payrollData.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-500 mb-4">Add staff members to view payroll</p>
          <Link
            href="/vendor/staff/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Staff
          </Link>
        </div>
      )}

      {/* View Details Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Salary Details</h2>
                <button
                  onClick={() => setSelectedPayroll(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedPayroll.staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPayroll.staff.name}</h3>
                    <p className="text-gray-500">{roleLabels[selectedPayroll.staff.role] || selectedPayroll.staff.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Payroll Period</p>
                  <p className="font-semibold text-gray-900">{months[selectedMonth]} {selectedYear}</p>
                </div>
              </div>

              {/* Payment Status */}
              <div className={`p-4 rounded-lg ${selectedPayroll.payment?.paymentStatus === 'PAID' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPayroll.payment?.paymentStatus === 'PAID' ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700">Payment Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-700">Payment Pending</span>
                      </>
                    )}
                  </div>
                  {selectedPayroll.payment?.paymentDate && (
                    <span className="text-sm text-gray-500">
                      Paid on {new Date(selectedPayroll.payment.paymentDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
                {selectedPayroll.payment?.paymentMethod && (
                  <p className="text-sm text-gray-600 mt-1">
                    Method: {selectedPayroll.payment.paymentMethod.replace('_', ' ')}
                    {selectedPayroll.payment.transactionId && ` | Txn: ${selectedPayroll.payment.transactionId}`}
                  </p>
                )}
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPayroll.workingDays}</p>
                  <p className="text-xs text-gray-500">Working Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPayroll.attendance.present}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{selectedPayroll.attendance.leave}</p>
                  <p className="text-xs text-gray-500">Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedPayroll.attendance.absent}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
              </div>

              {/* Salary Calculation */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Salary Calculation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Monthly Salary</span>
                    <span className="font-medium">{formatCurrency(selectedPayroll.staff.salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Rate</span>
                    <span className="font-medium">{formatCurrency(Math.round(selectedPayroll.staff.salary / selectedPayroll.workingDays))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Working Days</span>
                    <span className="font-medium">{selectedPayroll.effectiveDays} days</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Gross Salary</span>
                    <span className="text-green-600">{formatCurrency(selectedPayroll.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              {selectedPayroll.deductions > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PF (12%)</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedPayroll.deductions)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total Deductions</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayroll.deductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Salary */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Net Salary</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayroll.netSalary)}</span>
                </div>
              </div>

              {/* Bank Details */}
              {(selectedPayroll.staff.bankName || selectedPayroll.staff.accountNumber) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Bank Name</p>
                      <p className="font-medium">{selectedPayroll.staff.bankName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Account Number</p>
                      <p className="font-medium">{selectedPayroll.staff.accountNumber ? `****${selectedPayroll.staff.accountNumber.slice(-4)}` : '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedPayroll(null);
                  generatePayslip(selectedPayroll);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <FileText className="w-4 h-4" />
                Download Slip
              </button>
              <div className="flex gap-3">
                {selectedPayroll.payment?.paymentStatus !== 'PAID' && (
                  <button
                    onClick={() => {
                      setSelectedPayroll(null);
                      handleMarkPaid(selectedPayroll);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setSelectedPayroll(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Mark Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Employee & Amount Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {paymentItem.staff.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{paymentItem.staff.name}</p>
                    <p className="text-sm text-gray-500">{roleLabels[paymentItem.staff.role]}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-gray-600">Net Salary</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(paymentItem.netSalary)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showSlipModal && slipItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Payment Slip</h2>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Content */}
            <div ref={payslipRef} className="p-6">
              <div className="payslip border border-gray-300 rounded-lg p-6">
                {/* Header */}
                <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-blue-900">TransRentals</h1>
                  <p className="text-gray-600">Staff Salary Slip</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Pay Period: {months[selectedMonth]} {selectedYear}
                  </p>
                </div>

                {/* Employee Info */}
                <div className="info-grid grid grid-cols-2 gap-6 mb-6">
                  <div className="info-box bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Employee Details</h3>
                    <p className="text-sm"><span className="text-gray-500">Name:</span> {slipItem.staff.name}</p>
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {slipItem.staff.phone}</p>
                    <p className="text-sm"><span className="text-gray-500">Role:</span> {roleLabels[slipItem.staff.role]}</p>
                  </div>
                  <div className="info-box bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Bank Details</h3>
                    <p className="text-sm"><span className="text-gray-500">Bank:</span> {slipItem.staff.bankName || 'N/A'}</p>
                    <p className="text-sm"><span className="text-gray-500">Account:</span> {slipItem.staff.accountNumber ? `****${slipItem.staff.accountNumber.slice(-4)}` : 'N/A'}</p>
                    <p className="text-sm"><span className="text-gray-500">IFSC:</span> {slipItem.staff.ifscCode || 'N/A'}</p>
                  </div>
                </div>

                {/* Attendance */}
                <table className="table w-full mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3">Attendance Summary</th>
                      <th className="text-right p-3">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3">Working Days</td>
                      <td className="text-right p-3">{slipItem.workingDays}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Present Days</td>
                      <td className="text-right p-3 text-green-600">{slipItem.attendance.present}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Leave Days</td>
                      <td className="text-right p-3 text-yellow-600">{slipItem.attendance.leave}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Absent Days</td>
                      <td className="text-right p-3 text-red-600">{slipItem.attendance.absent}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Half Days</td>
                      <td className="text-right p-3">{slipItem.attendance.halfDay}</td>
                    </tr>
                    <tr className="font-semibold bg-blue-50">
                      <td className="p-3">Effective Days</td>
                      <td className="text-right p-3">{slipItem.effectiveDays}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Earnings & Deductions */}
                <table className="table w-full mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3">Earnings</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3">Base Salary</td>
                      <td className="text-right p-3">{formatCurrency(slipItem.staff.salary)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Daily Rate</td>
                      <td className="text-right p-3">{formatCurrency(Math.round(slipItem.staff.salary / slipItem.workingDays))}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="p-3">Gross Salary</td>
                      <td className="text-right p-3">{formatCurrency(slipItem.grossSalary)}</td>
                    </tr>
                  </tbody>
                </table>

                {slipItem.deductions > 0 && (
                  <table className="table w-full mb-6">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3">Deductions</th>
                        <th className="text-right p-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3">PF (12%)</td>
                        <td className="text-right p-3 text-red-600">-{formatCurrency(slipItem.deductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Net Salary */}
                <div className="total-row bg-green-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Net Payable</span>
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(slipItem.netSalary)}</span>
                  </div>
                </div>

                {/* Payment Status */}
                {slipItem.payment?.paymentStatus === 'PAID' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-700 font-medium">
                      Paid on {new Date(slipItem.payment.paymentDate!).toLocaleDateString('en-IN')} via {slipItem.payment.paymentMethod?.replace('_', ' ')}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="footer mt-8 pt-4 border-t text-center text-gray-500 text-sm">
                  <p>This is a computer generated slip and does not require signature.</p>
                  <p>Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={downloadPayslip}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Printer className="w-4 h-4" />
                Print / Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
