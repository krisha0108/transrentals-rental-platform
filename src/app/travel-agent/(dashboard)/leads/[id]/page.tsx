'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  Flame,
  Target,
  Clock,
  BookOpen,
  CheckCircle2,
  IndianRupee,
  X,
  Car,
  Plus,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Strips an existing 91/+91 country-code prefix before re-adding it, so a
// number already saved as "+919876543210" doesn't become "919919876543210".
const waLink = (phone: string) => `https://wa.me/91${phone.replace(/^\+?91/, '')}`;

interface Note {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
}

interface FleetOption {
  id: string;
  vehicleName: string;
  vehicleType: string;
  registrationNumber: string | null;
  brand: string | null;
  model: string | null;
  seatingCapacity: number | null;
  coverImage: string | null;
  isActive: boolean;
}

interface VehicleAssignment {
  id: string;
  fleetId: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number | null;
  notes: string | null;
  vehicleName: string;
  registrationNumber: string | null;
  vehicleType: string;
  coverImage: string | null;
  brand: string | null;
  model: string | null;
  seatingCapacity: number | null;
}

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  source: string;
  tripType: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  destination: string | null;
  travelDate: string | null;
  returnDate: string | null;
  passengers: number | null;
  requirement: string | null;
  estimatedValue: number | null;
  quotedAmount: number | null;
  quoteAdvanceAmount: number | null;
  quoteAdvancePercent: number | null;
  quoteValidUntil: string | null;
  quoteTerms: string | null;
  quoteSentAt: string | null;
  customerAcceptedAt: string | null;
  paymentStatus: string | null;
  paymentTxnId: string | null;
  paymentNote: string | null;
  paymentProofImages: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  paymentRejectReason: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  nextFollowUp: string | null;
  lastContactAt: string | null;
  lostReason: string | null;
  convertedBookingId: string | null;
  createdAt: string;
  notes: Note[];
  captureLink: { id: string; slug: string; title: string } | null;
}

const STATUS_ORDER = ['NEW', 'CONTACTED', 'INTERESTED', 'QUOTED', 'NEGOTIATING', 'BOOKED', 'LOST', 'COLD'];

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-cyan-100 text-cyan-700',
  INTERESTED: 'bg-emerald-100 text-emerald-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  NEGOTIATING: 'bg-indigo-100 text-indigo-700',
  BOOKED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  COLD: 'bg-gray-100 text-gray-700',
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [advanceMode, setAdvanceMode] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [advanceFixed, setAdvanceFixed] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [quoteTerms, setQuoteTerms] = useState(
    'Advance is non-refundable. Balance payable before trip start. Cancellation 48h prior — 50% refund of balance.',
  );
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [converting, setConverting] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // ── Priority + next-follow-up (editable, mirrors the app) ──
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);

  // ── Vehicle assignment state ──
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [fleetOptions, setFleetOptions] = useState<FleetOption[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignFleetId, setAssignFleetId] = useState('');
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');
  const [assignAmount, setAssignAmount] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignStatus, setAssignStatus] = useState<'CONFIRMED' | 'TENTATIVE'>('CONFIRMED');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignConflict, setAssignConflict] = useState<string | null>(null);

  const loadAssignments = async () => {
    const res = await fetch(`/api/travel-agent/leads/${id}/vehicles`);
    if (res.ok) {
      const j = await res.json();
      setAssignments(j.assignments || []);
    }
  };

  const loadFleetOptions = async () => {
    const res = await fetch(`/api/travel-agent/fleet?isActive=true`);
    if (res.ok) {
      const j = await res.json();
      setFleetOptions((j.fleets || []).filter((f: FleetOption) => f.isActive));
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`);
      if (res.ok) setLead(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAssignments();
    loadFleetOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isoDate = (d: Date | string | null | undefined) => {
    if (!d) return '';
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const openAssignForm = () => {
    setAssignConflict(null);
    setAssignFleetId('');
    setAssignAmount('');
    setAssignNotes('');
    setAssignStatus('CONFIRMED');
    setAssignStart(isoDate(lead?.travelDate || new Date()));
    setAssignEnd(isoDate(lead?.returnDate || lead?.travelDate || new Date()));
    setShowAssignForm(true);
  };

  const submitAssign = async () => {
    if (!assignFleetId) {
      showToast({ type: 'error', title: 'Pick a vehicle' });
      return;
    }
    if (!assignStart || !assignEnd) {
      showToast({ type: 'error', title: 'Both start and end dates are required' });
      return;
    }
    setSubmittingAssign(true);
    setAssignConflict(null);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleetId: assignFleetId,
          startDate: new Date(assignStart + 'T00:00:00').toISOString(),
          endDate: new Date(assignEnd + 'T23:59:59').toISOString(),
          amount: assignAmount === '' ? null : Number(assignAmount),
          notes: assignNotes || null,
          status: assignStatus,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (res.status === 409 && j.conflict) {
          setAssignConflict(
            `Already booked: ${j.conflict.customerName || 'existing entry'} (${new Date(j.conflict.startDate).toLocaleDateString('en-IN')} → ${new Date(j.conflict.endDate).toLocaleDateString('en-IN')}). Mark Tentative to override.`,
          );
        } else {
          showToast({ type: 'error', title: j.error || 'Failed to assign' });
        }
        return;
      }
      showToast({ type: 'success', title: 'Vehicle assigned' });
      setShowAssignForm(false);
      await Promise.all([loadAssignments(), load()]);
    } finally {
      setSubmittingAssign(false);
    }
  };

  const unassign = async (bookingId: string) => {
    if (!confirm('Remove this vehicle assignment? It will also be removed from the fleet calendar.')) return;
    const res = await fetch(`/api/travel-agent/leads/${id}/vehicles/${bookingId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Vehicle unassigned' });
      await loadAssignments();
    } else {
      showToast({ type: 'error', title: 'Failed to unassign' });
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      if (res.ok) {
        setNoteText('');
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to add note' });
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    if (newStatus === 'LOST') {
      setShowLostForm(true);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: `Status updated to ${newStatus}` });
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to update status' });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const markLost = async () => {
    if (!lostReason.trim()) {
      showToast({ type: 'error', title: 'Please provide a reason' });
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LOST', lostReason }),
      });
      if (res.ok) {
        setShowLostForm(false);
        setLostReason('');
        await load();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const changePriority = async (newPriority: string) => {
    if (!lead || newPriority === lead.priority) return;
    setUpdatingPriority(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: `Priority set to ${newPriority}` });
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to update priority' });
      }
    } finally {
      setUpdatingPriority(false);
    }
  };

  const saveNextFollowUp = async () => {
    setUpdatingFollowUp(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextFollowUp: followUpDate || null }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: followUpDate ? 'Follow-up date set' : 'Follow-up date cleared' });
        setShowFollowUpPicker(false);
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to update follow-up date' });
      }
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  const deleteLead = async () => {
    if (!confirm('Permanently delete this lead?')) return;
    const res = await fetch(`/api/travel-agent/leads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Lead deleted' });
      router.push('/travel-agent/leads');
    }
  };

  const computeAdvance = (total: number): number => {
    if (advanceMode === 'FIXED') {
      const v = Number(advanceFixed);
      return Number.isFinite(v) && v > 0 ? Math.min(v, total) : 0;
    }
    const p = Number(advancePercent);
    if (!Number.isFinite(p) || p <= 0) return 0;
    return Math.round((total * Math.min(100, p)) / 100);
  };

  const sendQuote = async () => {
    const amount = Number(quoteAmount);
    if (!amount || amount <= 0) {
      showToast({ type: 'error', title: 'Please enter a valid amount' });
      return;
    }
    const advance = computeAdvance(amount);
    if (advance > amount) {
      showToast({ type: 'error', title: 'Advance cannot exceed total amount' });
      return;
    }
    const days = Number(validDays);
    const validUntil =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;

    setSubmittingQuote(true);
    try {
      const balance = amount - advance;
      const lines = [
        `Quote sent: ₹${amount.toLocaleString('en-IN')}`,
        advance > 0
          ? `Advance: ₹${advance.toLocaleString('en-IN')}${
              advanceMode === 'PERCENT' ? ` (${advancePercent}%)` : ''
            } • Balance: ₹${balance.toLocaleString('en-IN')}`
          : null,
        validUntil ? `Valid till ${new Date(validUntil).toLocaleDateString('en-IN')}` : null,
        quoteNote.trim() ? `Note: ${quoteNote.trim()}` : null,
      ].filter(Boolean);
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotedAmount: amount,
          quoteAdvanceAmount: advance > 0 ? advance : null,
          quoteAdvancePercent:
            advanceMode === 'PERCENT' && Number(advancePercent) > 0
              ? Number(advancePercent)
              : null,
          quoteValidUntil: validUntil,
          quoteTerms: quoteTerms.trim() || null,
          quoteSentAt: new Date().toISOString(),
          status: 'QUOTED',
          addNote: lines.join('\n'),
        }),
      });
      if (res.ok) {
        showToast({
          type: 'success',
          title: `Quote of ₹${amount.toLocaleString('en-IN')} sent`,
        });
        setShowQuoteForm(false);
        setQuoteNote('');
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to send quote' });
      }
    } finally {
      setSubmittingQuote(false);
    }
  };

  const startChat = async () => {
    if (!lead) return;
    try {
      const res = await fetch('/api/travel-agent-chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelAgentId: (lead as any).travelAgentId, // not on Lead interface but in DB
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          customerEmail: lead.customerEmail,
          leadId: lead.id,
          subject: lead.destination
            ? `Trip to ${lead.destination}`
            : 'Travel Enquiry',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.conversation?.id) {
          router.push(`/travel-agent/chats/${json.conversation.id}`);
          return;
        }
      }
      const j = await res.json().catch(() => ({}));
      showToast({ type: 'error', title: j.error || 'Could not start chat' });
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    }
  };

  const convertToBooking = async () => {
    if (!confirm('Convert this lead to a booking? Lead will be marked BOOKED.')) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const json = await res.json();
        showToast({ type: 'success', title: `Booking ${json.booking.bookingNumber} created` });
        router.push(`/travel-agent/bookings/${json.booking.id}`);
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to convert' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setConverting(false);
    }
  };

  const verifyPayment = async () => {
    if (!confirm('Mark this advance payment as verified? Lead will move to BOOKED.')) return;
    setVerifyingPayment(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAction: 'VERIFY' }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Payment verified' });
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to verify' });
      }
    } finally {
      setVerifyingPayment(false);
    }
  };

  const rejectPayment = async () => {
    if (!rejectReasonText.trim()) {
      showToast({ type: 'error', title: 'Please enter a reason' });
      return;
    }
    setVerifyingPayment(true);
    try {
      const res = await fetch(`/api/travel-agent/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAction: 'REJECT',
          paymentRejectReason: rejectReasonText.trim(),
        }),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Payment rejected' });
        setShowRejectForm(false);
        setRejectReasonText('');
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to reject' });
      }
    } finally {
      setVerifyingPayment(false);
    }
  };

  const proofImages: string[] = (() => {
    if (!lead?.paymentProofImages) return [];
    try {
      const arr = JSON.parse(lead.paymentProofImages);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Lead not found</p>
      </div>
    );
  }

  const openQuoteForm = () => {
    setQuoteAmount(lead.quotedAmount ? String(lead.quotedAmount) : '');
    if (lead.quoteAdvancePercent) {
      setAdvanceMode('PERCENT');
      setAdvancePercent(String(lead.quoteAdvancePercent));
    } else if (lead.quoteAdvanceAmount) {
      setAdvanceMode('FIXED');
      setAdvanceFixed(String(lead.quoteAdvanceAmount));
    }
    if (lead.quoteValidUntil) {
      const ms = new Date(lead.quoteValidUntil).getTime() - Date.now();
      const d = Math.max(1, Math.round(ms / 86400000));
      setValidDays(String(d));
    }
    if (lead.quoteTerms) setQuoteTerms(lead.quoteTerms);
    setShowQuoteForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* ── Top crumb + secondary actions ── */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/travel-agent/leads"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" /> All Leads
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/travel-agent/leads/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>
          <button
            onClick={deleteLead}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
            title="Delete lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Hero card: identity (left) + primary CTAs (right) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          {/* Left: identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{lead.customerName}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[lead.status]}`}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                  {lead.priority === 'HOT' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Flame className="w-2.5 h-2.5" /> HOT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Source: {lead.source.replace(/_/g, ' ')}
                  {lead.captureLink && ` • via ${lead.captureLink.title}`}
                  {lead.assignedToName && ` • Assigned to ${lead.assignedToName}`}
                </p>
              </div>
            </div>

            {/* Contact strip */}
            <div className="mt-4 flex items-center gap-2 flex-wrap text-sm">
              <a
                href={`tel:${lead.customerPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 text-gray-700"
              >
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.customerPhone}
              </a>
              <a
                href={waLink(lead.customerPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </a>
              {lead.customerEmail && (
                <a
                  href={`mailto:${lead.customerEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 text-gray-700 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {lead.customerEmail}
                </a>
              )}
            </div>
          </div>

          {/* Right: primary CTAs */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:w-[240px] shrink-0">
            <button
              onClick={openQuoteForm}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2.5 rounded-xl"
            >
              <IndianRupee className="w-4 h-4" />
              {lead.quotedAmount
                ? `Update Quote · ₹${lead.quotedAmount.toLocaleString('en-IN')}`
                : 'Send Quote'}
            </button>
            <button
              onClick={startChat}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-2.5 rounded-xl"
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            {lead.convertedBookingId ? (
              <Link
                href={`/travel-agent/bookings/${lead.convertedBookingId}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-2.5 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4" /> View Booking
              </Link>
            ) : (
              <button
                onClick={convertToBooking}
                disabled={converting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 px-3 py-2.5 rounded-xl"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Converting…
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" /> Convert to Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Status pill bar ── */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Status</span>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updatingStatus || lead.status === s}
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${
                  lead.status === s
                    ? `${STATUS_COLORS[s]} border-transparent ring-2 ring-emerald-400`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {showLostForm && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-700 mb-2">Why was this lead lost?</p>
              <textarea
                rows={2}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="e.g. Budget mismatch, went with competitor..."
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowLostForm(false)} className="text-xs text-gray-600 px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={markLost}
                  disabled={!lostReason.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Mark Lost
                </button>
              </div>
            </div>
          )}
          {lead.lostReason && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <strong>Lost reason:</strong> {lead.lostReason}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* ── Trip Details ── */}
        <section className="md:col-span-2 lg:col-span-8 lg:order-1 bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">Trip Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <Detail label="Trip Type" value={lead.tripType?.replace(/_/g, ' ')} />
              <Detail label="Destination" value={lead.destination} />
              <Detail label="Passengers" value={lead.passengers ? String(lead.passengers) : null} />
              <Detail label="Pickup" value={lead.pickupLocation} />
              <Detail label="Drop" value={lead.dropLocation} />
              <Detail
                label="Travel Date"
                value={lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN') : null}
              />
              <Detail
                label="Return Date"
                value={lead.returnDate ? new Date(lead.returnDate).toLocaleDateString('en-IN') : null}
              />
              <Detail
                label="Estimated Value"
                value={lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : null}
              />
              <Detail
                label="Quoted Amount"
                value={lead.quotedAmount ? `₹${lead.quotedAmount.toLocaleString('en-IN')}` : null}
              />
            </div>
            {lead.requirement && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Requirement</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.requirement}</p>
              </div>
            )}
        </section>

        {/* ── Lead Info (sits beside Trip Details at lg+) ── */}
        <section className="md:col-span-1 lg:col-span-4 lg:order-2 bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Lead Info</h2>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Created">
              {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </InfoRow>
            <InfoRow label="Priority">
              <select
                value={lead.priority}
                onChange={(e) => changePriority(e.target.value)}
                disabled={updatingPriority}
                className={`text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 ${
                  lead.priority === 'HOT' ? 'text-red-600 border-red-200 bg-red-50' :
                  lead.priority === 'WARM' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                  'text-blue-600 border-blue-200 bg-blue-50'
                }`}
              >
                <option value="HOT">HOT</option>
                <option value="WARM">WARM</option>
                <option value="COLD">COLD</option>
              </select>
            </InfoRow>
            {lead.lastContactAt && (
              <InfoRow label="Last contact">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {new Date(lead.lastContactAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short',
                  })}
                </span>
              </InfoRow>
            )}
            <InfoRow label="Next follow-up">
              {showFollowUpPicker ? (
                <span className="inline-flex items-center gap-1.5">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={saveNextFollowUp}
                    disabled={updatingFollowUp}
                    className="text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
                    title="Save"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFollowUpPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFollowUpDate(lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0, 10) : '');
                    setShowFollowUpPicker(true);
                  }}
                  className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:underline"
                >
                  <Calendar className="w-3 h-3" />
                  {lead.nextFollowUp
                    ? new Date(lead.nextFollowUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    : 'Set date'}
                </button>
              )}
            </InfoRow>
            {lead.captureLink && (
              <InfoRow label="Capture link">
                <span className="text-xs text-gray-700 truncate">{lead.captureLink.title}</span>
              </InfoRow>
            )}
          </dl>
        </section>

        {/* ── Active Quote (if present) ── */}
        {lead.quotedAmount && (
          <section className="md:col-span-1 lg:col-span-6 lg:order-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                    Active Quote
                  </p>
                  {lead.quoteValidUntil && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        new Date(lead.quoteValidUntil) > new Date()
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {new Date(lead.quoteValidUntil) > new Date()
                        ? `Valid till ${new Date(lead.quoteValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                        : 'Expired'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                    <p className="text-[10px] text-gray-500 uppercase">Total</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{lead.quotedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                    <p className="text-[10px] text-gray-500 uppercase">
                      Advance{lead.quoteAdvancePercent ? ` (${lead.quoteAdvancePercent}%)` : ''}
                    </p>
                    <p className="text-sm font-bold text-blue-700">
                      ₹{(lead.quoteAdvanceAmount ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 border border-blue-100">
                    <p className="text-[10px] text-gray-500 uppercase">Balance</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₹
                      {Math.max(
                        0,
                        lead.quotedAmount - (lead.quoteAdvanceAmount ?? 0),
                      ).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                {lead.quoteTerms && (
                  <div className="mt-3 text-xs text-gray-700">
                    <p className="font-semibold text-gray-600 mb-0.5">Terms</p>
                    <p className="whitespace-pre-wrap">{lead.quoteTerms}</p>
                  </div>
                )}
                {lead.quoteSentAt && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    Sent {new Date(lead.quoteSentAt).toLocaleString('en-IN')}
                  </p>
                )}
          </section>
        )}

        {/* ── Payment proof card ── */}
        {lead.customerAcceptedAt && lead.paymentStatus && (
          <section
            className={`md:col-span-2 lg:col-span-12 lg:order-5 rounded-2xl p-5 border ${
              lead.paymentStatus === 'VERIFIED'
                ? 'bg-emerald-50 border-emerald-200'
                : lead.paymentStatus === 'SUBMITTED'
                  ? 'bg-amber-50 border-amber-200'
                  : lead.paymentStatus === 'REJECTED'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
            }`}
          >
                <div className="flex items-center justify-between mb-2">
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      lead.paymentStatus === 'VERIFIED'
                        ? 'text-emerald-800'
                        : lead.paymentStatus === 'SUBMITTED'
                          ? 'text-amber-800'
                          : lead.paymentStatus === 'REJECTED'
                            ? 'text-red-800'
                            : 'text-blue-800'
                    }`}
                  >
                    Advance Payment —{' '}
                    {lead.paymentStatus === 'PENDING' && 'Awaiting customer'}
                    {lead.paymentStatus === 'SUBMITTED' && 'Proof submitted, verify'}
                    {lead.paymentStatus === 'VERIFIED' && 'Verified'}
                    {lead.paymentStatus === 'REJECTED' && 'Rejected'}
                  </p>
                  <span className="text-[10px] text-gray-500">
                    Customer accepted{' '}
                    {new Date(lead.customerAcceptedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </span>
                </div>

                {lead.paymentStatus === 'PENDING' && (
                  <p className="text-sm text-blue-800">
                    Customer has accepted the quote and is being shown the UPI / bank details.
                    They&apos;ll submit the transaction ID once paid.
                  </p>
                )}

                {(lead.paymentStatus === 'SUBMITTED' ||
                  lead.paymentStatus === 'VERIFIED' ||
                  lead.paymentStatus === 'REJECTED') &&
                  (lead.paymentTxnId || proofImages.length > 0 || lead.paymentSubmittedAt) && (
                    <>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-[10px] text-gray-500 uppercase">Transaction ID</p>
                          <p className="text-sm font-mono font-bold text-gray-900 break-all">
                            {lead.paymentTxnId || (
                              <span className="text-gray-400 font-sans font-normal">
                                Not provided — verify via screenshot
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-[10px] text-gray-500 uppercase">Submitted</p>
                          <p className="text-sm font-bold text-gray-900">
                            {lead.paymentSubmittedAt
                              ? new Date(lead.paymentSubmittedAt).toLocaleString('en-IN')
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {lead.paymentNote && (
                        <div className="mt-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-[10px] text-gray-500 uppercase">Customer note</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {lead.paymentNote}
                          </p>
                        </div>
                      )}

                      {proofImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-gray-500 uppercase mb-1.5">
                            Screenshots ({proofImages.length})
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {proofImages.map((src, i) => (
                              <a
                                key={i}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 transition"
                              >
                                <img
                                  src={src}
                                  alt={`proof-${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.paymentVerifiedAt && (
                        <p className="text-[11px] text-emerald-700 mt-2">
                          ✅ Verified {new Date(lead.paymentVerifiedAt).toLocaleString('en-IN')}
                        </p>
                      )}
                      {lead.paymentRejectReason && (
                        <p className="text-[11px] text-red-700 mt-2">
                          ❌ Rejected: {lead.paymentRejectReason}
                        </p>
                      )}
                    </>
                  )}

                {lead.paymentStatus === 'SUBMITTED' && !showRejectForm && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={verifyPayment}
                      disabled={verifyingPayment}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold px-3 py-2 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Mark Booked
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={verifyingPayment}
                      className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-2 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {showRejectForm && (
                  <div className="mt-3">
                    <textarea
                      rows={2}
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      placeholder="Reason (e.g. Wrong amount, txn not received...)"
                      className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectReasonText('');
                        }}
                        className="text-xs text-gray-600 px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={rejectPayment}
                        disabled={verifyingPayment || !rejectReasonText.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
          </section>
        )}

        {/* ── Assigned Vehicles ── */}
        <section className={`md:col-span-2 ${lead.quotedAmount ? 'lg:col-span-6' : 'lg:col-span-12'} lg:order-4 bg-white rounded-2xl border border-gray-200 p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" /> Assigned Vehicles ({assignments.length})
              </h2>
              <button
                onClick={openAssignForm}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Vehicle
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No vehicles assigned yet</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assign one of your fleet vehicles to this trip — it will appear on the fleet calendar automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-300 transition"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {a.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{a.vehicleName}</p>
                        {a.registrationNumber && (
                          <span className="font-mono text-[10px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {a.registrationNumber}
                          </span>
                        )}
                        {a.status === 'TENTATIVE' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                            TENTATIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.brand && <span>{a.brand}</span>}
                        {a.model && <span> • {a.model}</span>}
                        {a.seatingCapacity && (
                          <span className="ml-1">
                            <Users className="inline w-3 h-3" /> {a.seatingCapacity}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-700 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(a.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(a.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {a.amount != null && (
                          <span className="ml-2 text-emerald-700 font-semibold">
                            ₹{a.amount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </p>
                      {a.notes && a.notes !== `Assigned to lead ${lead.customerName}` && (
                        <p className="text-xs text-gray-500 mt-1 italic">{a.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Link
                        href={`/travel-agent/fleet/${a.fleetId}/edit`}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                        title="View vehicle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => unassign(a.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        title="Unassign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <Link
                  href="/travel-agent/fleet/calendar"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-1"
                >
                  View on fleet calendar →
                </Link>
              </div>
            )}
          </section>

        {/* ── Activity Timeline (full width) ── */}
        <section className="md:col-span-2 lg:col-span-12 lg:order-6 bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Activity Timeline ({lead.notes.length})
          </h2>

          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note... (e.g. Called customer, sent quote)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!noteText.trim() || submittingNote}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
            >
              {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {lead.notes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No activity yet. Add the first note above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lead.notes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-xl px-4 py-2.5">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {n.authorName && `${n.authorName} • `}
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Assign Vehicle Modal ── */}
      {showAssignForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !submittingAssign && setShowAssignForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-start justify-between">
              <div>
                <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wide">Assign Vehicle</p>
                <h2 className="text-lg font-bold mt-0.5">{lead.customerName}</h2>
                <p className="text-xs text-emerald-100 mt-1">
                  {lead.passengers || 1} pax
                  {lead.destination && ` • ${lead.destination}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                disabled={submittingAssign}
                className="text-white/70 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Vehicle *
                </label>
                {fleetOptions.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No active vehicles in your fleet.{' '}
                    <Link href="/travel-agent/fleet/add" className="font-semibold underline">Add one →</Link>
                  </p>
                ) : (
                  <select
                    value={assignFleetId}
                    onChange={(e) => {
                      setAssignFleetId(e.target.value);
                      setAssignConflict(null);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select vehicle…</option>
                    {fleetOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.vehicleName}
                        {f.registrationNumber ? ` (${f.registrationNumber})` : ''}
                        {f.seatingCapacity ? ` · ${f.seatingCapacity} seats` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">From *</label>
                  <input
                    type="date"
                    value={assignStart}
                    onChange={(e) => { setAssignStart(e.target.value); setAssignConflict(null); }}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">To *</label>
                  <input
                    type="date"
                    value={assignEnd}
                    onChange={(e) => { setAssignEnd(e.target.value); setAssignConflict(null); }}
                    required
                    min={assignStart}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Status</label>
                  <select
                    value={assignStatus}
                    onChange={(e) => setAssignStatus(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="TENTATIVE">Tentative (allow overlap)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    placeholder={lead.quotedAmount ? String(lead.quotedAmount) : 'Optional'}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Driver: Ramesh, special requirements…"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {assignConflict && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">{assignConflict}</p>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-emerald-800">
                💡 This will block the vehicle on your fleet calendar for these dates and copy the lead&apos;s pickup/drop info onto the entry.
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                disabled={submittingAssign}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAssign}
                disabled={submittingAssign || !assignFleetId || fleetOptions.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-5 py-2 rounded-xl"
              >
                {submittingAssign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Assigning…
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4" /> Assign Vehicle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Quote Modal ── */}
      {showQuoteForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !submittingQuote && setShowQuoteForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-100 font-semibold uppercase tracking-wide">
                  {lead.quotedAmount ? 'Update Quote' : 'Send Quote'}
                </p>
                <h2 className="text-lg font-bold mt-0.5">{lead.customerName}</h2>
                <p className="text-xs text-blue-100 mt-1">
                  {lead.passengers || 1} pax
                  {lead.destination && ` • ${lead.destination}`}
                  {lead.travelDate && ` • ${new Date(lead.travelDate).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuoteForm(false)}
                disabled={submittingQuote}
                className="text-white/70 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Quote Amount (₹) *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Total amount the customer will pay for this trip.
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min={0}
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="e.g. 12500"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {lead.estimatedValue && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Customer&apos;s estimated value: ₹
                    {lead.estimatedValue.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* ── Advance payment ── */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Advance Payment
                  </label>
                  <div className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAdvanceMode('PERCENT')}
                      className={`px-2.5 py-1 rounded-md ${
                        advanceMode === 'PERCENT'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      % of total
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdvanceMode('FIXED')}
                      className={`px-2.5 py-1 rounded-md ${
                        advanceMode === 'FIXED'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Fixed ₹
                    </button>
                  </div>
                </div>

                {advanceMode === 'PERCENT' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={advancePercent}
                        onChange={(e) => setAdvancePercent(e.target.value)}
                        className="flex-1 accent-blue-600"
                      />
                      <div className="relative w-20">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={advancePercent}
                          onChange={(e) => setAdvancePercent(e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['10', '20', '30', '50', '100'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAdvancePercent(p)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            advancePercent === p
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min={0}
                      value={advanceFixed}
                      onChange={(e) => setAdvanceFixed(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {Number(quoteAmount) > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-gray-500">Advance now</p>
                      <p className="text-base font-bold text-blue-700">
                        ₹{computeAdvance(Number(quoteAmount)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-gray-500">Balance on/before trip</p>
                      <p className="text-base font-bold text-gray-900">
                        ₹
                        {(
                          Number(quoteAmount) - computeAdvance(Number(quoteAmount))
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Validity ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Quote Valid For
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">days</span>
                  {Number(validDays) > 0 && (
                    <span className="text-xs text-gray-500 ml-auto">
                      Expires{' '}
                      <strong className="text-gray-800">
                        {new Date(
                          Date.now() + Number(validDays) * 86400000,
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* ── Terms ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Payment & Cancellation Terms
                  <span className="ml-1 text-xs font-normal text-gray-400">(shown to customer)</span>
                </label>
                <textarea
                  rows={3}
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  placeholder="e.g. Advance non-refundable. Balance before trip start."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ── Optional note ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Inclusions / extra note
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="e.g. Includes hotel + transport + breakfast."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800">
                💡 Lead moves to <strong>QUOTED</strong>. Customer pays the advance to confirm — balance is due before the trip starts.
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowQuoteForm(false)}
                disabled={submittingQuote}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendQuote}
                disabled={submittingQuote || !quoteAmount}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm px-5 py-2 rounded-xl"
              >
                {submittingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {lead.quotedAmount ? 'Update Quote' : 'Send Quote'}
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

function Item({ icon: Icon, value, href }: { icon: any; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 text-gray-700">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
  return href ? <a href={href} className="hover:text-emerald-700">{content}</a> : content;
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900 truncate">{value || '—'}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 text-right truncate">{children}</dd>
    </div>
  );
}
