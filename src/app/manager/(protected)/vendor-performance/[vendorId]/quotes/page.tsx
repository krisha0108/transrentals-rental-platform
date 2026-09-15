'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, RefreshCw, Search, Filter, Layers,
  ChevronDown, ChevronUp, User, Phone, IndianRupee, Calendar, MapPin,
  FileText, CheckCircle, XCircle, Clock, Eye, AlertCircle, Loader2, Car,
  Bike, Bus, Truck, Package,
  X,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';
import Pagination from '@/components/manager/Pagination';

interface Quote {
  id: string;
  quoteNumber: string;
  serviceType: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  totalAmount: number;
  advanceAmount: number;
  inclusions: string | null;
  exclusions: string | null;
  termsConditions: string | null;
  validTill: string;
  sentAt: string | null;
  createdAt: string;
  viewCount: number;
  location: string;
}

interface Stats {
  total: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  draft: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  ACCEPTED:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Accepted',  icon: CheckCircle },
  REJECTED:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected',  icon: XCircle },
  SENT:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Sent',      icon: FileText },
  VIEWED:    { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Viewed',    icon: Eye },
  DRAFT:     { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Draft',     icon: FileText },
  EXPIRED:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Expired',   icon: AlertCircle },
  WITHDRAWN: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Withdrawn', icon: XCircle },
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  BIKE: Bike, CAR: Car, CHAUFFEUR: Car, LUXURY: Car,
  BUS: Bus, TRUCK: Truck, PACKERS: Package, EQUIPMENT: Package,
};

const SERVICE_COLORS: Record<string, string> = {
  BIKE: 'bg-green-100 text-green-700', CAR: 'bg-blue-100 text-blue-700',
  BUS: 'bg-red-100 text-red-700', TRUCK: 'bg-indigo-100 text-indigo-700',
  LUXURY: 'bg-amber-100 text-amber-700', PACKERS: 'bg-pink-100 text-pink-700',
  EQUIPMENT: 'bg-teal-100 text-teal-700',
};

export default function VendorQuotesPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.vendorId as string;

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendorName, setVendorName] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Drives the Clear all button — every filter this page applies.
  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchQuotes = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const res = await fetch(`/api/manager/vendor-performance/${vendorId}/quotes`);
      const data = await res.json();
      if (data.quotes) {
        setQuotes(data.quotes);
        setVendorName(data.vendorName || '');
        if (data.stats) setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch quotes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quotes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { if (vendorId) fetchQuotes(); }, [vendorId]);

  const filtered = useMemo(() => {
    let list = quotes;
    if (serviceFilter !== 'all') list = list.filter((q) => q.serviceType === serviceFilter);
    if (statusFilter !== 'all') list = list.filter((q) => q.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(term) ||
          q.customerName.toLowerCase().includes(term) ||
          q.customerPhone.includes(term) ||
          q.vehicleName.toLowerCase().includes(term)
      );
    }
    return list;
  }, [quotes, statusFilter, serviceFilter, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, serviceFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // Title, Back and Refresh go into the shared sticky bar, which was otherwise
  // rendering empty above this page's own header row.
  useManagerPageHeader(
    `${vendorName || 'Vendor'} — Quotation History`,
    'All quotes submitted by this vendor to customers',
    <button
      onClick={() => { setIsRefreshing(true); fetchQuotes(); }}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-semibold"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh
    </button>,
    <button
      type="button"
      onClick={() => router.back()}
      title="Back"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quotation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Quotes', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'Sent / Viewed', value: stats.sent, color: 'bg-blue-100 text-blue-700' },
            { label: 'Accepted', value: stats.accepted, color: 'bg-green-100 text-green-700' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-700' },
            { label: 'Expired', value: stats.expired, color: 'bg-amber-100 text-amber-700' },
            { label: 'Draft', value: stats.draft, color: 'bg-gray-100 text-gray-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by quote #, customer name, vehicle..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Services</option>
              {['BIKE', 'CAR', 'BUS', 'TRUCK', 'LUXURY', 'PACKERS', 'EQUIPMENT'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Clear all — only shown once something is actually filtered. */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2.5 text-sm text-gray-500 hover:text-red-500 transition shrink-0"
            >
              <X className="w-4 h-4" />
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
        {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} quotes
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {pageItems.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pageItems.map((quote) => {
              const statusCfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
              const StatusIcon = statusCfg.icon;
              const ServiceIcon = SERVICE_ICONS[quote.serviceType] || FileText;
              const isExpanded = expandedId === quote.id;

              return (
                <div key={quote.id} className="transition hover:bg-gray-50">
                  {/* Main row */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ServiceIcon className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Top row: quote # + status + service badge */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm">#{quote.quoteNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SERVICE_COLORS[quote.serviceType] || 'bg-gray-100 text-gray-600'}`}>
                            {quote.serviceType}
                          </span>
                          {quote.viewCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Eye className="w-3 h-3" /> {quote.viewCount}
                            </span>
                          )}
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate font-medium">{quote.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{quote.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{quote.vehicleName}</span>
                          </div>
                          {quote.location && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{quote.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>Sent: {quote.sentAt ? formatDate(quote.sentAt) : formatDate(quote.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>Valid till: {formatDate(quote.validTill)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + expand */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-0.5 text-green-600 font-bold text-sm">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {formatCurrency(quote.totalAmount).replace('₹', '')}
                          </div>
                          <p className="text-xs text-gray-400">
                            Advance: {formatCurrency(quote.advanceAmount).replace('₹', '')}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded section: inclusions, exclusions, T&C */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
                      <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Inclusions */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Inclusions
                          </h4>
                          {quote.inclusions ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.inclusions}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Not specified</p>
                          )}
                        </div>

                        {/* Exclusions */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-400" /> Exclusions
                          </h4>
                          {quote.exclusions ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.exclusions}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Not specified</p>
                          )}
                        </div>

                        {/* Terms & Conditions */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-500" /> Terms & Conditions
                          </h4>
                          {quote.termsConditions ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.termsConditions}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No terms specified</p>
                          )}
                        </div>
                      </div>

                      {/* Customer email */}
                      {quote.customerEmail && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
                          Customer Email: <span className="text-gray-700 font-medium">{quote.customerEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        className="pb-8"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
