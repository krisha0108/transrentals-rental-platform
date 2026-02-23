'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  IndianRupee,
  Calendar,
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Briefcase,
  Phone,
  Send,
  Smartphone,
  DollarSign,
  Banknote,
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
  profilePhoto: string | null;
}

interface PayrollItem {
  staffId: string;
  staff: Staff;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  effectiveDays: number;
  baseSalary: number;
  perDaySalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
}

interface PayrollSummary {
  totalStaff: number;
  totalBaseSalary: number;
  totalNetSalary: number;
  month: number;
  year: number;
  daysInMonth: number;
}

const roleLabels: Record<string, string> = {
  DRIVER: 'Driver',
  HELPER: 'Helper',
  OFFICE_STAFF: 'Office Staff',
  MECHANIC: 'Mechanic',
  SUPERVISOR: 'Supervisor',
  driver: 'Driver',
  helper: 'Helper',
  manager: 'Manager',
  accountant: 'Accountant',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CHEQUE', label: 'Cheque', icon: FileText },
];

export default function PayrollPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Paid tracking (local since backend payment is placeholder)
  const [paidMap, setPaidMap] = useState<Record<string, { method: string; txnId: string; date: Date }>>({});

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState<PayrollItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Payslip modal
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipItem, setSlipItem] = useState<PayrollItem | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vendor/staff/payments?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();

      if (data.success) {
        setPayrollData(data.payroll || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPaidMap({});
    setExpandedId(null);
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fmt = (n: number) => {
    if (n === undefined || n === null) return '0';
    return Number(n).toLocaleString('en-IN');
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
          staffId: paymentItem.staffId,
          month: selectedMonth,
          year: selectedYear,
          netSalary: paymentItem.netSalary,
          paymentMethod,
          transactionId: transactionId || null,
          remarks: remarks || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPaidMap(prev => ({
          ...prev,
          [paymentItem.staffId]: { method: paymentMethod, txnId: transactionId, date: new Date() },
        }));
        setShowPaymentModal(false);
      } else {
        alert(data.error || 'Failed to mark payment');
      }
    } catch (error) {
      alert('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Phone', 'Role', 'Present', 'Absent', 'Leave', 'Half Day', 'Effective Days', 'Base Salary', 'Per Day', 'Net Salary', 'Status'];
    const rows = payrollData.map(item => [
      item.staff.name,
      item.staff.phone,
      roleLabels[item.staff.role] || item.staff.role,
      item.presentDays,
      item.absentDays,
      item.leaveDays,
      item.halfDays,
      item.effectiveDays,
      item.baseSalary,
      item.perDaySalary,
      item.netSalary,
      paidMap[item.staffId] ? 'PAID' : 'PENDING',
    ]);

    const csvContent = [
      `Payroll Report - ${MONTHS[selectedMonth]} ${selectedYear}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${MONTHS[selectedMonth]}_${selectedYear}.csv`;
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
    const printContent = payslipRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${slipItem.staff.name} - ${MONTHS[selectedMonth]} ${selectedYear}</title>
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
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Computed
  const totalPaid = payrollData.filter(p => paidMap[p.staffId]).reduce((sum, p) => sum + p.netSalary, 0);
  const totalPending = (summary?.totalNetSalary || 0) - totalPaid;
  const paidCount = payrollData.filter(p => paidMap[p.staffId]).length;

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
          <Link href="/vendor/staff" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Salary calculation based on attendance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPayrollData}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-gray-900">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 hover:bg-gray-100 rounded-lg transition border border-gray-200 ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalStaff || 0}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.totalBaseSalary || 0)}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Base Salary</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900">Payment Progress</span>
          <span className="text-sm font-bold text-green-600">{paidCount}/{payrollData.length} paid</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: payrollData.length > 0 ? `${(paidCount / payrollData.length) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-500">
            Net Payable: <span className="font-bold text-gray-900">{formatCurrency(summary?.totalNetSalary || 0)}</span>
          </span>
          <span className="text-sm text-gray-500">{summary?.daysInMonth || 0} days in month</span>
        </div>
      </div>

      {/* Staff Payroll Cards */}
      {payrollData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Data</h3>
          <p className="text-gray-500 mb-4">Add staff members with salary to see payroll</p>
          <Link
            href="/vendor/staff/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Staff
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Staff Salaries</h2>
          <div className="space-y-4">
            {payrollData.map((item) => {
              const isPaid = !!paidMap[item.staffId];
              const isOpen = expandedId === item.staffId;
              const s = item.staff;
              const earnedPct = item.baseSalary > 0 ? Math.round((item.netSalary / item.baseSalary) * 100) : 0;
              const deducted = item.baseSalary - item.netSalary;

              return (
                <div
                  key={item.staffId}
                  className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${isPaid ? 'border-green-200' : 'border-gray-200'}`}
                >
                  {/* Top Row - Staff Info */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isOpen ? null : item.staffId)}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${isPaid ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {s.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{s.name || 'Staff'}</span>
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                            <Check className="w-3 h-3" />
                            PAID
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600 capitalize">{roleLabels[s.role] || s.role}</span>
                        {s.phone && <span className="text-xs text-gray-400">{s.phone}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatCurrency(item.netSalary)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">NET PAY</p>
                    </div>
                    <div className="ml-1">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Salary Breakdown Visual */}
                  <div className="mx-4 mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {/* Monthly → Earned → Deducted */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-lg p-3 text-center border border-gray-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Monthly Salary</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{fmt(item.baseSalary)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 bg-green-50 rounded-lg p-3 text-center border border-green-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Earned</p>
                        <p className="text-sm font-black text-green-600 mt-1">{fmt(item.netSalary)}</p>
                      </div>
                      <div className="flex-1 bg-red-50 rounded-lg p-3 text-center border border-red-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Deducted</p>
                        <p className="text-sm font-black text-red-500 mt-1">{fmt(deducted)}</p>
                      </div>
                    </div>

                    {/* Progress Bar: earned vs total */}
                    <div className="mt-3">
                      <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${earnedPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-green-600">{earnedPct}% earned</span>
                        <span className="text-xs text-gray-400 font-semibold">{item.effectiveDays}/{item.workingDays} days</span>
                      </div>
                    </div>

                    {/* Attendance Dots */}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-500 font-medium">{item.presentDays} present</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-500 font-medium">{item.absentDays} absent</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-xs text-gray-500 font-medium">{item.leaveDays} leave</span>
                      </div>
                      {item.halfDays > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-xs text-gray-500 font-medium">{item.halfDays} half</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Section */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-slate-50 px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Monthly Salary</span>
                          <span className="font-semibold">{formatCurrency(item.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Days in Month</span>
                          <span className="font-semibold">{item.workingDays}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Per Day Rate</span>
                          <span className="font-semibold">{formatCurrency(item.perDaySalary)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Present (Effective)</span>
                          <span className="font-semibold text-green-600">{item.effectiveDays} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Gross Salary</span>
                          <span className="font-semibold">{formatCurrency(item.grossSalary)}</span>
                        </div>
                        {item.deductions > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Deductions</span>
                            <span className="font-semibold text-red-500">-{formatCurrency(item.deductions)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">Net Salary</span>
                            <span className="font-bold text-green-600 text-lg">{formatCurrency(item.netSalary)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      {(s.bankName || s.accountNumber) && (
                        <div className="flex items-center gap-3 mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{s.bankName || 'Bank'}</p>
                            <p className="text-xs text-gray-500">A/C: {s.accountNumber ? `****${s.accountNumber.slice(-4)}` : 'N/A'}</p>
                          </div>
                          {s.ifscCode && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {s.ifscCode}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {!isPaid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(item); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                          >
                            <Send className="w-4 h-4" />
                            Mark as Paid - {formatCurrency(item.netSalary)}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); generatePayslip(item); }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Payslip
                        </button>
                      </div>

                      {/* Paid Info */}
                      {isPaid && paidMap[item.staffId] && (
                        <div className="flex items-center gap-2 mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-700 font-semibold">
                            Paid via {PAYMENT_METHODS.find(m => m.value === paidMap[item.staffId].method)?.label || paidMap[item.staffId].method}
                            {paidMap[item.staffId].txnId ? ` (${paidMap[item.staffId].txnId})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mark Payment</h2>
                  <p className="text-sm text-gray-500">{paymentItem.staff.name} - {MONTH_SHORT[selectedMonth]} {selectedYear}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount Card */}
              <div className="bg-green-50 rounded-xl p-5 border border-green-200 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Salary</p>
                <p className="text-3xl font-black text-green-600 mt-1">{formatCurrency(paymentItem.netSalary)}</p>
                <div className="flex justify-center gap-6 mt-2">
                  <span className="text-xs text-gray-400 font-semibold">Base: {formatCurrency(paymentItem.baseSalary)}</span>
                  <span className="text-xs text-gray-400 font-semibold">Effective: {paymentItem.effectiveDays}d</span>
                </div>
              </div>

              {/* Payment Method Grid */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const active = paymentMethod === m.value;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition text-xs font-medium ${
                          active
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction/reference ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Payment - {formatCurrency(paymentItem.netSalary)}
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
                <button onClick={() => setShowSlipModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={payslipRef} className="p-6">
              <div className="payslip border border-gray-300 rounded-lg p-6">
                <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-blue-900">TransRentals</h1>
                  <p className="text-gray-600">Staff Salary Slip</p>
                  <p className="text-sm text-gray-500 mt-2">Pay Period: {MONTHS[selectedMonth]} {selectedYear}</p>
                </div>

                <div className="info-grid grid grid-cols-2 gap-6 mb-6">
                  <div className="info-box bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Employee Details</h3>
                    <p className="text-sm"><span className="text-gray-500">Name:</span> {slipItem.staff.name}</p>
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {slipItem.staff.phone}</p>
                    <p className="text-sm"><span className="text-gray-500">Role:</span> {roleLabels[slipItem.staff.role] || slipItem.staff.role}</p>
                  </div>
                  <div className="info-box bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Bank Details</h3>
                    <p className="text-sm"><span className="text-gray-500">Bank:</span> {slipItem.staff.bankName || 'N/A'}</p>
                    <p className="text-sm"><span className="text-gray-500">Account:</span> {slipItem.staff.accountNumber ? `****${slipItem.staff.accountNumber.slice(-4)}` : 'N/A'}</p>
                    <p className="text-sm"><span className="text-gray-500">IFSC:</span> {slipItem.staff.ifscCode || 'N/A'}</p>
                  </div>
                </div>

                <table className="table w-full mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3">Attendance Summary</th>
                      <th className="text-right p-3">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-3">Days in Month</td><td className="text-right p-3">{slipItem.workingDays}</td></tr>
                    <tr><td className="p-3">Present Days</td><td className="text-right p-3 text-green-600">{slipItem.presentDays}</td></tr>
                    <tr><td className="p-3">Leave Days</td><td className="text-right p-3 text-yellow-600">{slipItem.leaveDays}</td></tr>
                    <tr><td className="p-3">Absent Days</td><td className="text-right p-3 text-red-600">{slipItem.absentDays}</td></tr>
                    <tr><td className="p-3">Half Days</td><td className="text-right p-3">{slipItem.halfDays}</td></tr>
                    <tr className="font-semibold bg-blue-50">
                      <td className="p-3">Effective Days</td>
                      <td className="text-right p-3">{slipItem.effectiveDays}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="table w-full mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3">Earnings</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-3">Base Salary</td><td className="text-right p-3">{formatCurrency(slipItem.baseSalary)}</td></tr>
                    <tr><td className="p-3">Per Day Rate</td><td className="text-right p-3">{formatCurrency(slipItem.perDaySalary)}</td></tr>
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
                        <td className="p-3">Deductions</td>
                        <td className="text-right p-3 text-red-600">-{formatCurrency(slipItem.deductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <div className="total-row bg-green-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Net Payable</span>
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(slipItem.netSalary)}</span>
                  </div>
                </div>

                {paidMap[slipItem.staffId] && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-700 font-medium">
                      Paid via {PAYMENT_METHODS.find(m => m.value === paidMap[slipItem.staffId].method)?.label || paidMap[slipItem.staffId].method}
                    </p>
                  </div>
                )}

                <div className="footer mt-8 pt-4 border-t text-center text-gray-500 text-sm">
                  <p>This is a computer generated slip and does not require signature.</p>
                  <p>Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowSlipModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
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
