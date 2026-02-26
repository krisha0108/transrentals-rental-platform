'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Mail,
  IndianRupee,
  Calendar,
  User,
  Phone,
  ArrowRight,
  MoreVertical,
  Printer,
  Share2,
} from 'lucide-react';

// Mock quotations data
const quotationsData = [
  {
    id: 'Q2024-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 9737965551',
    customerEmail: 'rajesh@email.com',
    service: 'Bus Rental',
    items: [
      { description: '45 Seater AC Bus - Mumbai to Pune', qty: 1, rate: 18000, amount: 18000 },
      { description: 'Pune to Mumbai Return', qty: 1, rate: 18000, amount: 18000 },
      { description: 'Extra Day Charges', qty: 1, rate: 8000, amount: 8000 },
    ],
    subtotal: 44000,
    gst: 7920,
    total: 51920,
    status: 'sent',
    validUntil: '2024-01-25',
    createdAt: '2024-01-18',
    sentAt: '2024-01-18',
    viewedAt: '2024-01-19',
    notes: 'Wedding party transport, need decorated bus',
  },
  {
    id: 'Q2024-002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 97379 65551',
    customerEmail: 'priya.sharma@company.com',
    service: 'Corporate Cars',
    items: [
      { description: 'Sedan Monthly Rental - Executive 1', qty: 1, rate: 45000, amount: 45000 },
      { description: 'Sedan Monthly Rental - Executive 2', qty: 1, rate: 45000, amount: 45000 },
      { description: 'SUV Monthly Rental - Director', qty: 1, rate: 65000, amount: 65000 },
    ],
    subtotal: 155000,
    gst: 27900,
    total: 182900,
    status: 'accepted',
    validUntil: '2024-01-30',
    createdAt: '2024-01-15',
    sentAt: '2024-01-15',
    viewedAt: '2024-01-16',
    acceptedAt: '2024-01-17',
    notes: 'Monthly corporate car rental contract',
  },
  {
    id: 'Q2024-003',
    customerName: 'Mohammed Ali',
    customerPhone: '+91 97379 65551',
    customerEmail: 'mali@gmail.com',
    service: 'Packers & Movers',
    items: [
      { description: '3BHK Household Shifting - Mumbai to Bangalore', qty: 1, rate: 35000, amount: 35000 },
      { description: 'Packing Material', qty: 1, rate: 5000, amount: 5000 },
      { description: 'Insurance (2% of goods value)', qty: 1, rate: 4000, amount: 4000 },
    ],
    subtotal: 44000,
    gst: 7920,
    total: 51920,
    status: 'draft',
    validUntil: '2024-01-28',
    createdAt: '2024-01-18',
    notes: 'Fragile items: TV, fridge, washing machine',
  },
  {
    id: 'Q2024-004',
    customerName: 'Tech Solutions Pvt Ltd',
    customerPhone: '+91 97379 65551',
    customerEmail: 'transport@techsol.com',
    service: 'Truck & Logistics',
    items: [
      { description: '20ft Container Truck - Mumbai to Delhi', qty: 10, rate: 45000, amount: 450000 },
      { description: 'Loading/Unloading', qty: 10, rate: 3000, amount: 30000 },
    ],
    subtotal: 480000,
    gst: 86400,
    total: 566400,
    status: 'sent',
    validUntil: '2024-01-22',
    createdAt: '2024-01-16',
    sentAt: '2024-01-16',
    notes: 'Monthly contract - 10 trips per month',
  },
  {
    id: 'Q2024-005',
    customerName: 'Kavita Joshi',
    customerPhone: '+91 97379 65551',
    customerEmail: 'kavita.j@email.com',
    service: 'Luxury Cars',
    items: [
      { description: 'Mercedes E-Class Wedding Car with Decoration', qty: 1, rate: 15000, amount: 15000 },
      { description: 'Extra Hour Charges (4 hours)', qty: 4, rate: 2000, amount: 8000 },
    ],
    subtotal: 23000,
    gst: 4140,
    total: 27140,
    status: 'rejected',
    validUntil: '2024-01-12',
    createdAt: '2024-01-05',
    sentAt: '2024-01-05',
    viewedAt: '2024-01-06',
    rejectedAt: '2024-01-08',
    rejectionReason: 'Found cheaper option',
    notes: 'Wedding car with ribbon decoration',
  },
  {
    id: 'Q2024-006',
    customerName: 'Arun Deshmukh',
    customerPhone: '+91 97379 65551',
    customerEmail: 'arun.d@company.in',
    service: 'Equipment Rental',
    items: [
      { description: 'JCB Backhoe Loader - Monthly Rental', qty: 1, rate: 90000, amount: 90000 },
      { description: 'Operator Charges (26 days)', qty: 26, rate: 800, amount: 20800 },
      { description: 'Fuel Deposit', qty: 1, rate: 10000, amount: 10000 },
    ],
    subtotal: 120800,
    gst: 21744,
    total: 142544,
    status: 'converted',
    validUntil: '2024-01-20',
    createdAt: '2024-01-08',
    sentAt: '2024-01-08',
    viewedAt: '2024-01-09',
    acceptedAt: '2024-01-10',
    convertedAt: '2024-01-12',
    bookingId: 'B2024-045',
    notes: 'Construction site at Thane',
  },
];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState(quotationsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<typeof quotationsData[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'converted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'expired': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-3 h-3" />;
      case 'sent': return <Send className="w-3 h-3" />;
      case 'viewed': return <Eye className="w-3 h-3" />;
      case 'accepted': return <CheckCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      case 'converted': return <ArrowRight className="w-3 h-3" />;
      case 'expired': return <Clock className="w-3 h-3" />;
      default: return null;
    }
  };

  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = quote.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    converted: quotations.filter(q => q.status === 'converted').length,
    totalValue: quotations.filter(q => ['sent', 'accepted'].includes(q.status)).reduce((sum, q) => sum + q.total, 0),
    conversionRate: Math.round((quotations.filter(q => q.status === 'converted').length / quotations.filter(q => q.status !== 'draft').length) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Create and manage quotations</p>
        </div>
        <Link
          href="/vendor/quotations/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Quotation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Edit className="w-4 h-4" />
            <span className="text-sm">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Send className="w-4 h-4" />
            <span className="text-sm">Sent</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Accepted</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">Conversion</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotations..."
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
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Quote #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valid Until</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600">{quote.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{quote.customerName}</p>
                      <p className="text-sm text-gray-500">{quote.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{quote.service}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">₹{quote.total.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{quote.validUntil}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedQuote(quote); setShowPreview(true); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {quote.status === 'draft' && (
                        <Link
                          href={`/vendor/quotations/edit/${quote.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      )}
                      {quote.status === 'draft' && (
                        <button className="p-2 hover:bg-blue-100 rounded-lg transition" title="Send">
                          <Send className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${quote.customerPhone.replace(/\D/g, '')}?text=Hi ${quote.customerName}, here is your quotation ${quote.id} for ₹${quote.total.toLocaleString()}`}
                        target="_blank"
                        className="p-2 hover:bg-green-100 rounded-lg transition"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </a>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Download PDF">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      {quote.status === 'accepted' && (
                        <button className="p-2 hover:bg-purple-100 rounded-lg transition" title="Convert to Booking">
                          <ArrowRight className="w-4 h-4 text-purple-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Preview Modal */}
      {showPreview && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Quote Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">QUOTATION</h2>
                  <p className="text-blue-600 font-medium">{selectedQuote.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Print">
                    <Printer className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Download">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Share">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedQuote.status)}`}>
                  {getStatusIcon(selectedQuote.status)}
                  {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
                </span>
                <div className="text-sm text-gray-500">
                  Valid until: <span className="font-medium text-gray-700">{selectedQuote.validUntil}</span>
                </div>
              </div>

              {/* Customer & Service Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">BILL TO</h3>
                  <p className="font-medium text-gray-900">{selectedQuote.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedQuote.customerPhone}</p>
                  <p className="text-sm text-gray-600">{selectedQuote.customerEmail}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">SERVICE</h3>
                  <p className="font-medium text-gray-900">{selectedQuote.service}</p>
                  <p className="text-sm text-gray-600">Created: {selectedQuote.createdAt}</p>
                  {selectedQuote.sentAt && <p className="text-sm text-gray-600">Sent: {selectedQuote.sentAt}</p>}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Rate</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedQuote.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-700">{item.description}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                          <td className="px-4 py-3 text-right text-gray-600">₹{item.rate.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{selectedQuote.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18%)</span>
                    <span>₹{selectedQuote.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>₹{selectedQuote.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedQuote.notes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Notes</h3>
                  <p className="text-blue-700">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created on {selectedQuote.createdAt}</span>
                  </div>
                  {selectedQuote.sentAt && (
                    <div className="flex items-center gap-3 text-blue-600">
                      <Send className="w-4 h-4" />
                      <span>Sent on {selectedQuote.sentAt}</span>
                    </div>
                  )}
                  {selectedQuote.viewedAt && (
                    <div className="flex items-center gap-3 text-yellow-600">
                      <Eye className="w-4 h-4" />
                      <span>Viewed on {selectedQuote.viewedAt}</span>
                    </div>
                  )}
                  {selectedQuote.acceptedAt && (
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Accepted on {selectedQuote.acceptedAt}</span>
                    </div>
                  )}
                  {selectedQuote.rejectedAt && (
                    <div className="flex items-center gap-3 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>Rejected on {selectedQuote.rejectedAt} - {selectedQuote.rejectionReason}</span>
                    </div>
                  )}
                  {selectedQuote.convertedAt && (
                    <div className="flex items-center gap-3 text-purple-600">
                      <ArrowRight className="w-4 h-4" />
                      <span>Converted to Booking {selectedQuote.bookingId} on {selectedQuote.convertedAt}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedQuote.status === 'draft' && (
                  <>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Quote
                    </button>
                    <Link
                      href={`/vendor/quotations/edit/${selectedQuote.id}`}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  </>
                )}
                {selectedQuote.status === 'accepted' && (
                  <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Convert to Booking
                  </button>
                )}
                <a
                  href={`https://wa.me/${selectedQuote.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
