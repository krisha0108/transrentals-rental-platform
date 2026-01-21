'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  IndianRupee,
  Calendar,
  Printer,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Filter,
  MoreVertical,
  Receipt,
  Building2,
} from 'lucide-react';

// Mock invoices data
const invoicesData = [
  {
    id: 'INV-2024-001',
    customerName: 'Priya Sharma',
    customerPhone: '+91 87654 32109',
    customerEmail: 'priya.sharma@company.com',
    customerGstin: '27AABCU9603R1ZM',
    customerAddress: 'Tech Park, Hinjewadi, Pune - 411057',
    service: 'Corporate Cars',
    items: [
      { description: 'Sedan Monthly Rental - Executive 1', hsn: '996601', qty: 1, rate: 45000, gst: 18, amount: 53100 },
      { description: 'Sedan Monthly Rental - Executive 2', hsn: '996601', qty: 1, rate: 45000, gst: 18, amount: 53100 },
      { description: 'SUV Monthly Rental - Director', hsn: '996601', qty: 1, rate: 65000, gst: 18, amount: 76700 },
    ],
    subtotal: 155000,
    cgst: 13950,
    sgst: 13950,
    igst: 0,
    total: 182900,
    amountPaid: 182900,
    balance: 0,
    status: 'paid',
    paymentMode: 'Bank Transfer',
    paymentDate: '2024-01-20',
    invoiceDate: '2024-01-18',
    dueDate: '2024-01-25',
    bookingId: 'B2024-023',
    notes: 'Monthly corporate car rental - January 2024',
  },
  {
    id: 'INV-2024-002',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    customerEmail: 'rajesh@email.com',
    customerGstin: '',
    customerAddress: 'Andheri West, Mumbai - 400053',
    service: 'Bus Rental',
    items: [
      { description: '45 Seater AC Bus - Mumbai to Pune', hsn: '996601', qty: 1, rate: 18000, gst: 18, amount: 21240 },
      { description: 'Pune to Mumbai Return', hsn: '996601', qty: 1, rate: 18000, gst: 18, amount: 21240 },
      { description: 'Extra Day Charges', hsn: '996601', qty: 1, rate: 8000, gst: 18, amount: 9440 },
    ],
    subtotal: 44000,
    cgst: 3960,
    sgst: 3960,
    igst: 0,
    total: 51920,
    amountPaid: 25000,
    balance: 26920,
    status: 'partial',
    paymentMode: 'Cash',
    paymentDate: '2024-01-18',
    invoiceDate: '2024-01-18',
    dueDate: '2024-01-22',
    bookingId: 'B2024-025',
    notes: 'Wedding party transport',
  },
  {
    id: 'INV-2024-003',
    customerName: 'Tech Solutions Pvt Ltd',
    customerPhone: '+91 54321 09876',
    customerEmail: 'transport@techsol.com',
    customerGstin: '27AADCT1234R1ZP',
    customerAddress: 'BKC, Mumbai - 400051',
    service: 'Truck & Logistics',
    items: [
      { description: '20ft Container Truck - Mumbai to Delhi', hsn: '996519', qty: 10, rate: 45000, gst: 18, amount: 531000 },
      { description: 'Loading/Unloading', hsn: '996519', qty: 10, rate: 3000, gst: 18, amount: 35400 },
    ],
    subtotal: 480000,
    cgst: 0,
    sgst: 0,
    igst: 86400,
    total: 566400,
    amountPaid: 0,
    balance: 566400,
    status: 'unpaid',
    invoiceDate: '2024-01-16',
    dueDate: '2024-01-30',
    bookingId: 'B2024-022',
    notes: 'Monthly contract - 10 trips',
  },
  {
    id: 'INV-2024-004',
    customerName: 'Arun Deshmukh',
    customerPhone: '+91 43210 98765',
    customerEmail: 'arun.d@company.in',
    customerGstin: '',
    customerAddress: 'Thane West - 400601',
    service: 'Equipment Rental',
    items: [
      { description: 'JCB Backhoe Loader - Monthly Rental', hsn: '997319', qty: 1, rate: 90000, gst: 18, amount: 106200 },
      { description: 'Operator Charges (26 days)', hsn: '998599', qty: 26, rate: 800, gst: 18, amount: 24544 },
      { description: 'Fuel Deposit (Refundable)', hsn: '', qty: 1, rate: 10000, gst: 0, amount: 10000 },
    ],
    subtotal: 120800,
    cgst: 10872,
    sgst: 10872,
    igst: 0,
    total: 142544,
    amountPaid: 142544,
    balance: 0,
    status: 'paid',
    paymentMode: 'UPI',
    paymentDate: '2024-01-15',
    invoiceDate: '2024-01-12',
    dueDate: '2024-01-19',
    bookingId: 'B2024-045',
    notes: 'Construction site equipment',
  },
  {
    id: 'INV-2024-005',
    customerName: 'Mohammed Ali',
    customerPhone: '+91 76543 21098',
    customerEmail: 'mali@gmail.com',
    customerGstin: '',
    customerAddress: 'Powai, Mumbai - 400076',
    service: 'Packers & Movers',
    items: [
      { description: '3BHK Household Shifting - Mumbai to Bangalore', hsn: '996519', qty: 1, rate: 35000, gst: 18, amount: 41300 },
      { description: 'Packing Material', hsn: '392310', qty: 1, rate: 5000, gst: 18, amount: 5900 },
      { description: 'Insurance', hsn: '997159', qty: 1, rate: 4000, gst: 18, amount: 4720 },
    ],
    subtotal: 44000,
    cgst: 0,
    sgst: 0,
    igst: 7920,
    total: 51920,
    amountPaid: 0,
    balance: 51920,
    status: 'overdue',
    invoiceDate: '2024-01-10',
    dueDate: '2024-01-17',
    bookingId: 'B2024-018',
    notes: 'Inter-state relocation',
  },
];

// Company details for invoice
const companyDetails = {
  name: 'TransRentals India Pvt Ltd',
  gstin: '27AABCT1234R1ZM',
  pan: 'AABCT1234R',
  address: 'Office 401, Trade Center, Andheri East, Mumbai - 400069',
  phone: '+91 22 4567 8900',
  email: 'billing@transrentals.in',
  bankName: 'HDFC Bank',
  accountNo: '50100123456789',
  ifsc: 'HDFC0001234',
  upiId: 'transrentals@hdfcbank',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(invoicesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoicesData[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'unpaid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3" />;
      case 'partial': return <Clock className="w-3 h-3" />;
      case 'unpaid': return <FileText className="w-3 h-3" />;
      case 'overdue': return <AlertTriangle className="w-3 h-3" />;
      default: return null;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    collected: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
    pending: invoices.reduce((sum, inv) => sum + inv.balance, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.balance, 0),
  };

  const handleRecordPayment = () => {
    if (selectedInvoice && paymentAmount && paymentMode) {
      const amount = Number(paymentAmount);
      const newAmountPaid = selectedInvoice.amountPaid + amount;
      const newBalance = selectedInvoice.total - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      setInvoices(invoices.map(inv =>
        inv.id === selectedInvoice.id
          ? { ...inv, amountPaid: newAmountPaid, balance: newBalance, status: newStatus, paymentMode, paymentDate: new Date().toISOString().split('T')[0] }
          : inv
      ));
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMode('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices & Billing</h1>
          <p className="text-gray-600">Manage GST invoices and payments</p>
        </div>
        <Link
          href="/vendor/invoices/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total Invoices</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Total Billed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Collected</span>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{(stats.collected / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">₹{(stats.pending / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{(stats.overdue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600">{invoice.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.customerName}</p>
                      <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{invoice.service}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">₹{invoice.total.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{invoice.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {invoice.dueDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setShowPreview(true); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {invoice.balance > 0 && (
                        <button
                          onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                          className="p-2 hover:bg-green-100 rounded-lg transition"
                          title="Record Payment"
                        >
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${invoice.customerPhone.replace(/\D/g, '')}?text=Invoice ${invoice.id} - ₹${invoice.total.toLocaleString()}. Balance: ₹${invoice.balance.toLocaleString()}`}
                        target="_blank"
                        className="p-2 hover:bg-green-100 rounded-lg transition"
                        title="Send via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </a>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Download PDF">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Invoice Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">TAX INVOICE</h2>
                  <p className="text-blue-600 font-medium">{selectedInvoice.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition" title="Print">
                    <Printer className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition" title="Download">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Company & Customer Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">FROM</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="font-bold text-gray-900">{companyDetails.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{companyDetails.address}</p>
                    <p className="text-sm text-gray-600">GSTIN: {companyDetails.gstin}</p>
                    <p className="text-sm text-gray-600">PAN: {companyDetails.pan}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">BILL TO</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-bold text-gray-900">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedInvoice.customerAddress}</p>
                    {selectedInvoice.customerGstin && (
                      <p className="text-sm text-gray-600">GSTIN: {selectedInvoice.customerGstin}</p>
                    )}
                    <p className="text-sm text-gray-600">{selectedInvoice.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Date</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.invoiceDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Booking ID</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.bookingId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedInvoice.status)}`}>
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">HSN/SAC</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Qty</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Rate</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">GST%</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-700">{item.description}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.hsn || '-'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{item.rate.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.gst}%</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.cgst > 0 && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>CGST (9%)</span>
                        <span>₹{selectedInvoice.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>SGST (9%)</span>
                        <span>₹{selectedInvoice.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {selectedInvoice.igst > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>IGST (18%)</span>
                      <span>₹{selectedInvoice.igst.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>₹{selectedInvoice.total.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.amountPaid > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Paid</span>
                      <span>- ₹{selectedInvoice.amountPaid.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.balance > 0 && (
                    <div className="flex justify-between text-lg font-bold text-red-600 pt-2 border-t">
                      <span>Balance Due</span>
                      <span>₹{selectedInvoice.balance.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Bank Details for Payment</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Bank Name</p>
                    <p className="font-medium">{companyDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account No</p>
                    <p className="font-medium">{companyDetails.accountNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">IFSC Code</p>
                    <p className="font-medium">{companyDetails.ifsc}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">UPI ID</p>
                    <p className="font-medium">{companyDetails.upiId}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> {selectedInvoice.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedInvoice.balance > 0 && (
                  <button
                    onClick={() => { setShowPreview(false); setShowPaymentModal(true); }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Record Payment
                  </button>
                )}
                <a
                  href={`https://wa.me/${selectedInvoice.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Reminder
                </a>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="font-medium text-gray-900">{selectedInvoice.id}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold">₹{selectedInvoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="text-green-600">₹{selectedInvoice.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="font-medium text-gray-900">Balance Due:</span>
                  <span className="font-bold text-red-600">₹{selectedInvoice.balance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={String(selectedInvoice.balance)}
                    max={selectedInvoice.balance}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || !paymentMode}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
