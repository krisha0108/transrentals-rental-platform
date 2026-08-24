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
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 space-y-2 border border-gray-100"><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="h-8 bg-gray-100 rounded w-1/3"></div></div>)}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-2/3"></div><div className="h-3 bg-gray-100 rounded w-1/3"></div></div></div><div className="h-3 bg-gray-100 rounded w-full"></div><div className="flex gap-2"><div className="h-8 bg-gray-100 rounded-lg flex-1"></div><div className="h-8 bg-gray-100 rounded-lg w-24"></div></div></div>)}
          </div>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl animate-float-rev"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/vendor/staff" className="p-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl transition">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Payroll Management</h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">Salary calculation based on attendance</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchPayrollData}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-up">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2.5 hover:bg-emerald-50 rounded-xl transition border border-gray-200 hover:border-emerald-300 group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-2.5 hover:bg-emerald-50 rounded-xl transition border border-gray-200 hover:border-emerald-300 group ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-100/40 rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalStaff || 0}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-100/40 rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary?.totalBaseSalary || 0)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Base Salary</p>
            </div>
          </div>
        </div>
        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-100/40 rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Paid</p>
            </div>
          </div>
        </div>
        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-100/40 rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPending)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-up">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">Payment Progress</span>
          </div>
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{paidCount}/{payrollData.length} paid</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700 shimmer-bg"
            style={{ width: payrollData.length > 0 ? `${(paidCount / payrollData.length) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">
            Net Payable: <span className="font-bold text-gray-900">{formatCurrency(summary?.totalNetSalary || 0)}</span>
          </span>
          <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-50 rounded-md">{summary?.daysInMonth || 0} days in month</span>
        </div>
      </div>

      {/* Staff Payroll Cards */}
      {payrollData.length === 0 ? (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center animate-pop-in">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-100/40 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-100/40 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Data</h3>
            <p className="text-gray-500 mb-4">Add staff members with salary to see payroll</p>
            <Link
              href="/vendor/staff/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Add Staff
            </Link>
          </div>
        </div>
      ) : (
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900">Staff Salaries</h2>
            <span className="text-xs font-semibold text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">{payrollData.length}</span>
          </div>
          <div className="space-y-4">
            {payrollData.map((item, idx) => {
              const isPaid = !!paidMap[item.staffId];
              const isOpen = expandedId === item.staffId;
              const s = item.staff;
              const earnedPct = item.baseSalary > 0 ? Math.round((item.netSalary / item.baseSalary) * 100) : 0;
              const deducted = item.baseSalary - item.netSalary;

              return (
                <div
                  key={item.staffId}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={`group relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-up ${isPaid ? 'border-emerald-200' : 'border-gray-100 hover:border-emerald-200'}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${isPaid ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500'}`}></div>
                  {/* Top Row - Staff Info */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : item.staffId)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md ring-2 ring-white ${isPaid ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'}`}>
                      {s.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{s.name || 'Staff'}</span>
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                            <Check className="w-3 h-3" />
                            PAID
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{roleLabels[s.role] || s.role}</span>
                        {s.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />
                            {s.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${isPaid ? 'text-emerald-600' : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'}`}>
                        {formatCurrency(item.netSalary)}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold tracking-wider">NET PAY</p>
                    </div>
                    <div className={`ml-1 p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Salary Breakdown Visual */}
                  <div className="mx-4 mb-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 rounded-2xl p-4 border border-slate-100">
                    {/* Monthly → Earned → Deducted */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Monthly Salary</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{fmt(item.baseSalary)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center border border-emerald-200 shadow-sm">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Earned</p>
                        <p className="text-sm font-black text-emerald-600 mt-1">{fmt(item.netSalary)}</p>
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 text-center border border-red-200 shadow-sm">
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Deducted</p>
                        <p className="text-sm font-black text-red-500 mt-1">{fmt(deducted)}</p>
                      </div>
                    </div>

                    {/* Progress Bar: earned vs total */}
                    <div className="mt-3">
                      <div className="h-2.5 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                          style={{ width: `${earnedPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-emerald-600">{earnedPct}% earned</span>
                        <span className="text-xs text-gray-500 font-semibold px-2 py-0.5 bg-white rounded-md border border-gray-200">{item.effectiveDays}/{item.workingDays} days</span>
                      </div>
                    </div>

                    {/* Attendance Pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-700 font-semibold">{item.presentDays} present</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] text-red-700 font-semibold">{item.absentDays} absent</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-700 font-semibold">{item.leaveDays} leave</span>
                      </div>
                      {item.halfDays > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-emerald-700 font-semibold">{item.halfDays} half</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Section */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gradient-to-br from-slate-50 to-emerald-50/20 px-4 py-4 animate-fade-up">
                      <div className="space-y-2 bg-white rounded-xl p-4 border border-gray-100">
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
                            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 text-lg">{formatCurrency(item.netSalary)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      {(s.bankName || s.accountNumber) && (
                        <div className="flex items-center gap-3 mt-4 bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl p-3 border border-emerald-100">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <CreditCard className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{s.bankName || 'Bank'}</p>
                            <p className="text-xs text-gray-500">A/C: {s.accountNumber ? `****${s.accountNumber.slice(-4)}` : 'N/A'}</p>
                          </div>
                          {s.ifscCode && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-full shadow-sm">
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold text-sm"
                          >
                            <Send className="w-4 h-4" />
                            Mark as Paid - {formatCurrency(item.netSalary)}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); generatePayslip(item); }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition text-sm font-semibold"
                        >
                          <FileText className="w-4 h-4" />
                          Payslip
                        </button>
                      </div>

                      {/* Paid Info */}
                      {isPaid && paidMap[item.staffId] && (
                        <div className="flex items-center gap-2 mt-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs text-emerald-700 font-semibold">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-pop-in">
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 animate-gradient-x p-6">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-float-slow"></div>
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-cyan-300/20 rounded-full blur-2xl animate-float-rev"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Mark Payment</h2>
                    <p className="text-xs text-emerald-100">{paymentItem.staff.name} - {MONTH_SHORT[selectedMonth]} {selectedYear}</p>
                  </div>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-5 border border-emerald-200 text-center">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-200/30 rounded-full blur-2xl"></div>
                <div className="relative">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Net Salary</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mt-1">{formatCurrency(paymentItem.netSalary)}</p>
                  <div className="flex justify-center gap-6 mt-2">
                    <span className="text-xs text-gray-500 font-semibold">Base: {formatCurrency(paymentItem.baseSalary)}</span>
                    <span className="text-xs text-gray-500 font-semibold">Effective: {paymentItem.effectiveDays}d</span>
                  </div>
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
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                          active
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 shadow-sm -translate-y-0.5'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition"
                />
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 font-semibold"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl animate-pop-in">
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x p-6">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-float-slow"></div>
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-pink-300/20 rounded-full blur-2xl animate-float-rev"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Payment Slip</h2>
                </div>
                <button onClick={() => setShowSlipModal(false)} className="p-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div ref={payslipRef} className="p-6">
              <div className="payslip border border-gray-300 rounded-lg p-6">
                <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-emerald-900">TransRentals</h1>
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
                    <tr><td className="p-3">Leave Days</td><td className="text-right p-3 text-emerald-600">{slipItem.leaveDays}</td></tr>
                    <tr><td className="p-3">Absent Days</td><td className="text-right p-3 text-red-600">{slipItem.absentDays}</td></tr>
                    <tr><td className="p-3">Half Days</td><td className="text-right p-3">{slipItem.halfDays}</td></tr>
                    <tr className="font-semibold bg-emerald-50">
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
                  <p>Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN', { hour12: true })}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowSlipModal(false)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold">
                Close
              </button>
              <button
                onClick={downloadPayslip}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold"
              >
                <Printer className="w-4 h-4" />
                Print / Download
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
