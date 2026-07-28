'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, MapPin, User, Phone, Mail, FileText, Clock, Building,
  PhoneCall, StickyNote, ThumbsUp, ThumbsDown, Bell, Loader2 as Spinner, History,
  Tag, Plus, X, Check, AlertTriangle, IndianRupee, Copy,
  Ban, PhoneOff, UserX, XOctagon, CalendarX, MapPinOff, ExternalLink, FileX,
  Hourglass, CreditCard, Flag, XCircle, HelpCircle,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { key: 'CALLED',                       label: 'Mark as Called',              icon: Phone,        classes: 'border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100' },
  { key: 'CUSTOMER_CONNECTED',           label: 'Customer Connected',          icon: Check,        classes: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' },
  { key: 'NO_VENDOR_AVAILABLE',          label: 'No Vendor Available',         icon: Ban,          classes: 'border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100' },
  { key: 'VENDOR_DECLINED',              label: 'Vendor Declined',             icon: XOctagon,     classes: 'border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100' },
  { key: 'VENDOR_CANT_FULFILL',          label: "Vendor Available – Can't Fulfill", icon: CalendarX, classes: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100' },
  { key: 'FOLLOW_UP',                    label: 'Follow-Up Required',          icon: PhoneCall,    classes: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { key: 'CONVERTED',                    label: 'Converted',                   icon: ThumbsUp,     classes: 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' },
  { key: 'NOT_INTERESTED',               label: 'Not Interested',              icon: ThumbsDown,   classes: 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100' },
  { key: 'VENDOR_NOT_RESPONDING',        label: 'Vendor Not Responding',       icon: PhoneOff,     classes: 'border-stone-200 text-stone-700 bg-stone-50 hover:bg-stone-100' },
  { key: 'WRONG_NUMBER',                 label: 'Wrong Number',                icon: AlertTriangle, classes: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' },
  { key: 'PRICE_TOO_HIGH',               label: 'Price Too High',              icon: IndianRupee,  classes: 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100' },
  { key: 'NOT_SERVICEABLE',              label: 'Not Serviceable',             icon: MapPinOff,    classes: 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100' },
  { key: 'AWAITING_VENDOR_QUOTE',        label: 'Awaiting Vendor Quote',       icon: Clock,        classes: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' },
  { key: 'QUOTE_NOT_SUBMITTED',          label: 'Quote Not Submitted',         icon: FileX,        classes: 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' },
  { key: 'CUSTOMER_NOT_RESPONDING',      label: 'Customer Not Responding',     icon: UserX,        classes: 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100' },
  { key: 'CUSTOMER_BOOKED_ELSEWHERE',    label: 'Customer Booked Elsewhere',   icon: ExternalLink, classes: 'border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100' },
  { key: 'WAITING_CUSTOMER_CONFIRMATION', label: 'Waiting for Customer Confirmation', icon: Hourglass, classes: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
  { key: 'ADVANCE_PAYMENT_PENDING',      label: 'Advance Payment Pending',     icon: CreditCard,   classes: 'border-lime-200 text-lime-700 bg-lime-50 hover:bg-lime-100' },
  { key: 'INVALID_LEAD',                 label: 'Invalid/Fake Lead',           icon: Flag,         classes: 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100' },
  { key: 'CANCELLED',                    label: 'Cancelled',                   icon: XCircle,      classes: 'border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100' },
  { key: 'DUPLICATE_INQUIRY',            label: 'Duplicate Inquiry',           icon: Copy,         classes: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100' },
  { key: 'OTHER_REASON',                 label: 'Other Reason',                icon: HelpCircle,   classes: 'border-neutral-200 text-neutral-700 bg-neutral-50 hover:bg-neutral-100' },
] as const;

const INQUIRY_TAGS = [
  { key: 'FOLLOW_UP_REQUIRED',            label: 'Follow-Up Required',              color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'CUSTOMER_CONNECTED',            label: 'Customer Connected',              color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'NO_VENDOR_AVAILABLE',           label: 'No Vendor Available',             color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'VENDOR_DECLINED',               label: 'Vendor Declined',                 color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { key: 'VENDOR_CANT_FULFILL',           label: "Vendor Available – Can't Fulfill", color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { key: 'NOT_INTERESTED',                label: 'Not Interested',                  color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { key: 'VENDOR_NOT_RESPONDING',         label: 'Vendor Not Responding',           color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { key: 'WRONG_NUMBER',                  label: 'Wrong Number',                    color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'PRICE_TOO_HIGH',                label: 'Price Too High',                  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'NOT_SERVICEABLE',               label: 'Not Serviceable',                 color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'AWAITING_VENDOR_QUOTE',         label: 'Awaiting Vendor Quote',           color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'QUOTE_NOT_SUBMITTED',           label: 'Quote Not Submitted',             color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'CUSTOMER_NOT_RESPONDING',       label: 'Customer Not Responding',         color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'CUSTOMER_BOOKED_ELSEWHERE',     label: 'Customer Booked Elsewhere',       color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  { key: 'WAITING_CUSTOMER_CONFIRMATION', label: 'Waiting for Customer Confirmation', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'ADVANCE_PAYMENT_PENDING',       label: 'Advance Payment Pending',         color: 'bg-lime-100 text-lime-700 border-lime-200' },
  { key: 'INVALID_LEAD',                  label: 'Invalid/Fake Lead',               color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'CANCELLED',                     label: 'Cancelled',                       color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  { key: 'CONVERTED',                     label: 'Converted',                       color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'DUPLICATE_INQUIRY',             label: 'Duplicate Inquiry',               color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'OTHER_REASON',                  label: 'Other Reason',                    color: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
] as const;
const TAG_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  INQUIRY_TAGS.map((t) => [t.key, { label: t.label, color: t.color }])
);

interface QuoteRequest {
  id: string;
  requestNumber: string;
  status: string;
  serviceName: string;
  serviceSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationName: string;
  requestedVehicleName?: string;
  requestedCategory?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate?: string;
  dropTime?: string;
  totalDays?: number;
  pickupCity?: string;
  dropCity?: string;
  pickupAddress?: string;
  dropAddress?: string;
  fromCity?: string;
  toCity?: string;
  houseSize?: string;
  distance?: string;
  goodsType?: string;
  weight?: string;
  tripType?: string;
  customerNotes?: string;
  createdAt: string;
}

interface ActionLog {
  id: string;
  actionType: string;
  note: string | null;
  createdAt: string;
  manager: { id: string; name: string; email: string } | null;
}

interface VendorQuote {
  id: string;
  quoteNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  vendorEmail: string;
  status: string;
  quotedAmount: number;
  dailyRate?: number;
  totalDays?: number;
  gstAmount?: number;
  securityDeposit?: number;
  grandTotal: number;
  vehicleName?: string;
  vehicleCategory?: string;
  vehicleNumber?: string;
  validUntil?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [quotesCount, setQuotesCount] = useState(0);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiryDetails();
  }, [inquiryId]);

  useEffect(() => {
    if (!inquiryId) return;
    fetch(`/api/vendor/call-log?bookingId=${inquiryId}`)
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setCallLogs(d.logs || []))
      .catch(() => {});
  }, [inquiryId]);

  const fetchInquiryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manager/inquiries/${inquiryId}`);
      const data = await response.json();
      if (data.success) {
        setRequest(data.request);
        setQuotes(data.quotes || []);
        setQuotesCount(data.quotesCount || 0);
        setActionLogs(data.actionLogs || []);
        setTags(data.tags || []);
      } else {
        if (data.redirectUrl) { router.push(data.redirectUrl); return; }
        console.error('Failed to fetch inquiry:', data.error);
      }
    } catch (error) {
      console.error('Error fetching inquiry details:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (actionType: string, note?: string) => {
    setActionLoading(actionType);
    try {
      const res = await fetch(`/api/manager/inquiries/${inquiryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to log action');
        return;
      }
      if (actionType === 'NOTE_ADDED') setNoteText('');
      await fetchInquiryDetails();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCallClick = () => {
    // Best-effort: log the call action without blocking the tel: navigation.
    logAction('CALLED');
  };

  const handleToggleTag = async (tag: string, present: boolean) => {
    setTagSaving(tag);
    const prev = tags;
    setTags(present ? prev.filter((t) => t !== tag) : [...prev, tag]);
    try {
      const res = present
        ? await fetch(`/api/manager/inquiries/${inquiryId}/tags?tag=${tag}`, { method: 'DELETE' })
        : await fetch(`/api/manager/inquiries/${inquiryId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag }),
          });
      if (!res.ok) throw new Error('Server rejected tag change');
      const data = await res.json();
      if (Array.isArray(data?.tags)) setTags(data.tags);
    } catch {
      setTags(prev);
      alert('Could not update tag. Please try again.');
    } finally {
      setTagSaving(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    PENDING:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200', label: 'Pending'  },
    QUOTED:   { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   label: 'Quoted'   },
    ACCEPTED: { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  label: 'Accepted' },
    REJECTED: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    label: 'Rejected' },
    SENT:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   label: 'Sent'     },
    APPROVED: { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  label: 'Approved' },
    DECLINED: { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',   label: 'Declined' },
    EXPIRED:  { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',   label: 'Expired'  },
  };
  const getStatusConfig = (s: string) => STATUS_CONFIG[s] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: s };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FileText className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Quote request not found</p>
        <button onClick={() => router.back()} className="text-orange-600 hover:text-orange-700 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const statusCfg = getStatusConfig(request.status);
  const lowestQuote  = quotes.length > 0 ? Math.min(...quotes.map(q => q.grandTotal)) : null;
  const highestQuote = quotes.length > 0 ? Math.max(...quotes.map(q => q.grandTotal)) : null;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inquiry Detail</h1>
            <p className="text-sm text-gray-500 font-mono">{request.requestNumber}</p>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* ── CRM Tags ── */}
      <div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((t) => {
            const meta = TAG_BY_KEY[t];
            if (!meta) return null;
            const saving = tagSaving === t;
            return (
              <span
                key={t}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color} ${saving ? 'opacity-50' : ''}`}
              >
                <Tag className="w-3 h-3" />
                {meta.label}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleToggleTag(t, true)}
                  className="ml-0.5 hover:opacity-70"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setTagEditorOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
          >
            <Plus className="w-3 h-3" />
            {tags.length === 0 ? 'Add tag' : 'Edit tags'}
          </button>
        </div>

        {tagEditorOpen && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Toggle tags</span>
              <button type="button" onClick={() => setTagEditorOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INQUIRY_TAGS.map((t) => {
                const present = tags.includes(t.key);
                const saving = tagSaving === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleTag(t.key, present)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border transition ${
                      present
                        ? `${t.color} ring-1 ring-offset-1 ring-current`
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                    } ${saving ? 'opacity-50' : ''}`}
                  >
                    {present ? '✓ ' : '+ '}{t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Service</p>
          <p className="font-semibold text-gray-900 text-sm">{request.serviceName}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Location</p>
          <p className="font-semibold text-gray-900 text-sm">{request.locationName || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Submitted</p>
          <p className="font-semibold text-gray-900 text-sm">{formatDate(request.createdAt)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Quotes Received</p>
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-orange-600 text-lg">{quotesCount}</p>
            {lowestQuote !== null && (
              <p className="text-xs text-gray-500">from {formatCurrency(lowestQuote)}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer Info + Trip Details side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Customer Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Customer Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900 text-sm">{request.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <a href={`tel:${request.customerPhone}`} onClick={handleCallClick} className="font-medium text-blue-600 text-sm hover:underline">
                  {request.customerPhone}
                </a>
              </div>
            </div>
            {request.customerEmail && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 text-sm">{request.customerEmail}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium text-gray-900 text-sm">{request.locationName || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Trip Details
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {request.requestedVehicleName && (
              <div>
                <p className="text-xs text-gray-500">Requested Vehicle</p>
                <p className="font-medium text-gray-900 text-sm">{request.requestedVehicleName}</p>
              </div>
            )}
            {request.requestedCategory && (
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium text-gray-900 text-sm">{request.requestedCategory}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Pickup Date</p>
              <p className="font-medium text-gray-900 text-sm">
                {formatDate(request.pickupDate)}{request.pickupTime && ` · ${request.pickupTime}`}
              </p>
            </div>
            {request.dropDate && (
              <div>
                <p className="text-xs text-gray-500">Drop Date</p>
                <p className="font-medium text-gray-900 text-sm">
                  {formatDate(request.dropDate)}{request.dropTime && ` · ${request.dropTime}`}
                </p>
              </div>
            )}
            {request.totalDays && request.totalDays > 0 && (
              <div>
                <p className="text-xs text-gray-500">Total Days</p>
                <p className="font-medium text-gray-900 text-sm">{request.totalDays} days</p>
              </div>
            )}
            {request.tripType && (
              <div>
                <p className="text-xs text-gray-500">Trip Type</p>
                <p className="font-medium text-gray-900 text-sm">{request.tripType}</p>
              </div>
            )}
            {(request.pickupCity || request.fromCity) && (
              <div>
                <p className="text-xs text-gray-500">From</p>
                <p className="font-medium text-gray-900 text-sm">{request.pickupCity || request.fromCity}</p>
              </div>
            )}
            {(request.dropCity || request.toCity) && (
              <div>
                <p className="text-xs text-gray-500">To</p>
                <p className="font-medium text-gray-900 text-sm">{request.dropCity || request.toCity}</p>
              </div>
            )}
            {request.houseSize && (
              <div>
                <p className="text-xs text-gray-500">House Size</p>
                <p className="font-medium text-gray-900 text-sm">{request.houseSize}</p>
              </div>
            )}
            {request.distance && (
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-medium text-gray-900 text-sm">{request.distance}</p>
              </div>
            )}
            {request.goodsType && (
              <div>
                <p className="text-xs text-gray-500">Goods Type</p>
                <p className="font-medium text-gray-900 text-sm">{request.goodsType}</p>
              </div>
            )}
            {request.weight && (
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium text-gray-900 text-sm">{request.weight}</p>
              </div>
            )}
          </div>
          {request.customerNotes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Customer Notes</p>
              <p className="text-sm text-gray-700">{request.customerNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Manager Actions ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          Manager Actions
          {actionLogs.length > 0 && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Actioned · {actionLogs.length}
            </span>
          )}
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => logAction(a.key)}
                disabled={!!actionLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-50 transition ${a.classes}`}
              >
                {actionLoading === a.key ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                {a.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this inquiry..."
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          />
          <button
            onClick={() => logAction('NOTE_ADDED', noteText)}
            disabled={!noteText.trim() || !!actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 transition shrink-0"
          >
            {actionLoading === 'NOTE_ADDED' ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <StickyNote className="w-3.5 h-3.5" />}
            Add Note
          </button>
        </div>

        {actionLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Action History
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {actionLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600">
                    {log.actionType.replace(/_/g, ' ')}
                  </span>
                  <div className="min-w-0 flex-1">
                    {log.note && <p className="text-gray-700 break-words">{log.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.manager?.name || 'Manager'} · {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Vendor Quotes — full width ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Vendor Quotes</h2>
          <div className="flex items-center gap-3">
            {lowestQuote !== null && (
              <span className="text-xs text-gray-500">
                Range: <span className="font-medium text-green-600">{formatCurrency(lowestQuote)}</span>
                {highestQuote !== lowestQuote && <> – <span className="font-medium text-orange-600">{formatCurrency(highestQuote!)}</span></>}
              </span>
            )}
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{quotesCount} quote{quotesCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No quotes received yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quotes.map((quote) => {
              const qsc = getStatusConfig(quote.status);
              return (
                <div key={quote.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition-all">
                  {/* Quote header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {quote.vendorName}
                      </h3>
                      {quote.quoteNumber && <p className="text-xs text-gray-400 mt-0.5">{quote.quoteNumber}</p>}
                    </div>
                    <span className={`shrink-0 ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${qsc.bg} ${qsc.text} ${qsc.border}`}>
                      {qsc.label}
                    </span>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-orange-50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-500">Grand Total</p>
                      <p className="font-bold text-orange-600 text-sm">{formatCurrency(quote.grandTotal)}</p>
                    </div>
                    {quote.dailyRate ? (
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500">Daily Rate</p>
                        <p className="font-semibold text-gray-800 text-sm">{formatCurrency(quote.dailyRate)}</p>
                      </div>
                    ) : quote.quotedAmount ? (
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500">Quoted</p>
                        <p className="font-semibold text-gray-800 text-sm">{formatCurrency(quote.quotedAmount)}</p>
                      </div>
                    ) : null}
                    {quote.totalDays ? (
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500">Days</p>
                        <p className="font-semibold text-gray-800 text-sm">{quote.totalDays}</p>
                      </div>
                    ) : null}
                    {quote.securityDeposit ? (
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500">Security Dep.</p>
                        <p className="font-semibold text-gray-800 text-sm">{formatCurrency(quote.securityDeposit)}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Vehicle */}
                  {(quote.vehicleName || quote.vehicleCategory || quote.vehicleNumber) && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3 text-xs text-gray-700 space-y-0.5">
                      {quote.vehicleName && <p><span className="text-gray-400">Vehicle:</span> {quote.vehicleName}</p>}
                      {quote.vehicleCategory && <p><span className="text-gray-400">Category:</span> {quote.vehicleCategory}</p>}
                      {quote.vehicleNumber && <p><span className="text-gray-400">Number:</span> {quote.vehicleNumber}</p>}
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{quote.vendorPhone}</span>
                    <span className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0" />{quote.vendorEmail}</span>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                      <p className="text-xs text-gray-700">{quote.notes}</p>
                    </div>
                  )}

                  {/* Valid until */}
                  {quote.validUntil && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      Valid until {formatDate(quote.validUntil)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Call Logs ── */}
      {callLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Vendor Call Logs
            <span className="ml-auto text-sm font-normal text-gray-500">{callLogs.length} call{callLogs.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Vendor</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {callLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900 text-sm">
                      {log.vendors?.businessName || log.vendors?.ownerName || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{log.bookingType}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-sm">{formatDateTime(log.clickedAt)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.source === 'app' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>{log.source}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
