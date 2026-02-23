'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, Car, Calendar, MapPin,
  CheckCircle2, XCircle, PlayCircle, AlertCircle,
  Banknote, Link2, MessageSquare,
  Edit3, Save, Loader2, Trash2, User, Clock,
  IndianRupee, Receipt, Pencil, Share2, Copy, Check,
  UserCircle2, Truck, X, ChevronRight, Bike,
  AlertTriangle, CheckCheck, Plus, Fuel, TrendingDown,
} from 'lucide-react';

interface AssignedDriver {
  id: string; name: string; phone: string;
  profilePhoto: string | null; licenseNumber: string | null; licenseExpiry: string | null;
}
interface AssignedVehicle {
  id: string; vehicleName: string | null; registrationNumber: string | null;
  color: string | null; fuelType: string | null; seatingCapacity: number | null;
}
interface DirectBooking {
  id: string; bookingNumber: string;
  customerName: string; customerPhone: string; customerEmail: string | null;
  serviceType: string; vehicleType: string | null;
  pickupDate: string | null; returnDate: string | null;
  pickupLocation: string | null; dropLocation: string | null;
  notes: string | null; status: string;
  paymentStatus: string; paymentMode: string | null;
  totalAmount: number | null; paidAmount: number;
  razorpayLinkId: string | null; vendorNotes: string | null;
  bookingSource: string; createdAt: string;
  assignedDriverId: string | null; assignedVehicleId: string | null;
  assignedAt: string | null;
  assignedDriver: AssignedDriver | null;
  assignedVehicle: AssignedVehicle | null;
}
interface DriverOption {
  id: string; name: string; phone: string; profilePhoto: string | null;
  status: string; licenseNumber: string | null; licenseExpiry: string | null;
  isAvailable: boolean; licenseExpired: boolean; attendanceStatus?: string | null;
}
interface VehicleOption {
  id: string; displayName: string; registrationNumber: string | null;
  color: string | null; fuelType: string | null; seatingCapacity: number | null;
  isAvailable: boolean; serviceName: string | null; serviceSlug: string | null;
}
interface BookingExpense {
  id: string; category: string; amount: number;
  note: string | null; expenseDate: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'fuel',           label: 'Fuel',           emoji: '⛽' },
  { value: 'driver_payment', label: 'Driver Payment',  emoji: '👤' },
  { value: 'toll',           label: 'Toll',            emoji: '🛣️' },
  { value: 'parking',        label: 'Parking',         emoji: '🅿️' },
  { value: 'maintenance',    label: 'Maintenance',     emoji: '🔧' },
  { value: 'cleaning',       label: 'Cleaning',        emoji: '🧹' },
  { value: 'other',          label: 'Other',           emoji: '📋' },
];

/* ── Status config ── */
const STATUS_CFG: Record<string, {
  label: string; headerGrad: string; headerText: string;
  dot: string; badge: string; badgeBg: string; icon: any;
}> = {
  inquiry:     { label: 'Inquiry',     headerGrad: 'from-amber-500 to-orange-500',   headerText: 'text-amber-600',   dot: 'bg-amber-400',   badge: 'text-amber-700',   badgeBg: 'bg-amber-100',   icon: AlertCircle },
  confirmed:   { label: 'Confirmed',   headerGrad: 'from-blue-600 to-indigo-600',    headerText: 'text-blue-600',    dot: 'bg-blue-500',    badge: 'text-blue-700',    badgeBg: 'bg-blue-100',    icon: CheckCircle2 },
  in_progress: { label: 'In Progress', headerGrad: 'from-violet-600 to-purple-600',  headerText: 'text-violet-600',  dot: 'bg-violet-500',  badge: 'text-violet-700',  badgeBg: 'bg-violet-100',  icon: PlayCircle },
  completed:   { label: 'Completed',   headerGrad: 'from-emerald-500 to-green-600',  headerText: 'text-emerald-600', dot: 'bg-emerald-500', badge: 'text-emerald-700', badgeBg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    headerGrad: 'from-red-500 to-rose-600',       headerText: 'text-red-600',     dot: 'bg-red-400',     badge: 'text-red-700',     badgeBg: 'bg-red-100',     icon: XCircle },
  cancelled:   { label: 'Cancelled',   headerGrad: 'from-gray-400 to-gray-500',      headerText: 'text-gray-500',    dot: 'bg-gray-300',    badge: 'text-gray-600',    badgeBg: 'bg-gray-100',    icon: XCircle },
};
const STATUS_FLOW: Record<string, { next: string; label: string; grad: string; icon: any }[]> = {
  inquiry:     [
    { next: 'confirmed',   label: 'Confirm Booking',    grad: 'from-blue-600 to-indigo-600',   icon: CheckCircle2 },
    { next: 'rejected',    label: 'Reject Request',     grad: 'from-red-500 to-rose-500',      icon: XCircle },
  ],
  confirmed:   [
    { next: 'in_progress', label: 'Mark as Started',    grad: 'from-violet-600 to-purple-600', icon: PlayCircle },
    { next: 'cancelled',   label: 'Cancel Booking',     grad: 'from-gray-400 to-gray-500',     icon: XCircle },
  ],
  in_progress: [
    { next: 'completed',   label: 'Mark as Completed',  grad: 'from-emerald-500 to-green-600', icon: CheckCircle2 },
  ],
  completed: [], rejected: [], cancelled: [],
};
const JOURNEY = ['inquiry', 'confirmed', 'in_progress', 'completed'];
const PAYMENT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Payment Pending',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  partial:     { label: 'Advance Paid',     color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  collected:   { label: 'Fully Paid',       color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  link_sent:   { label: 'Link Sent',        color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  paid_online: { label: 'Paid Online',      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  waived:      { label: 'Waived',           color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
};
const SERVICE_LABELS: Record<string, string> = {
  bike: '🏍️  Bike Rental', bus: '🚌  Bus & Tempo',
  'car-with-driver': '🚗  Car with Driver', 'self-drive': '🚙  Self-Drive Car',
  luxury: '✨  Luxury Car', transporter: '🚛  Transporter',
  'packers-movers': '📦  Packers & Movers', equipment: '🔧  Equipment Rental', general: '📋  General',
};

/* ── Structured extras keys + icons ── */
const EXTRA_KEYS: Record<string, { icon: string; label: string; color: string }> = {
  'Use Type':   { icon: '🏭', label: 'Use Type',   color: 'bg-slate-100 text-slate-700' },
  'Goods':      { icon: '📦', label: 'Goods',       color: 'bg-amber-50 text-amber-700' },
  'Weight':     { icon: '⚖️', label: 'Weight',      color: 'bg-blue-50 text-blue-700' },
  'Trip':       { icon: '🗺️', label: 'Trip Type',   color: 'bg-violet-50 text-violet-700' },
  'Time':       { icon: '⏰', label: 'Time',         color: 'bg-indigo-50 text-indigo-700' },
  'Passengers': { icon: '👥', label: 'Passengers',  color: 'bg-emerald-50 text-emerald-700' },
  'Helmets':    { icon: '⛑️', label: 'Helmets',     color: 'bg-orange-50 text-orange-700' },
  'Occasion':   { icon: '✨', label: 'Occasion',    color: 'bg-pink-50 text-pink-700' },
  'License':    { icon: '🪪', label: 'License',     color: 'bg-gray-100 text-gray-700' },
  'Duration':   { icon: '📅', label: 'Duration',    color: 'bg-cyan-50 text-cyan-700' },
  'Units':      { icon: '🔢', label: 'Units',        color: 'bg-teal-50 text-teal-700' },
  'Load':       { icon: '📦', label: 'Load Info',   color: 'bg-amber-50 text-amber-700' },
};
function parseNotes(raw: string | null): { extras: Record<string, string>; freeText: string } {
  if (!raw) return { extras: {}, freeText: '' };
  const lines = raw.split('\n');
  const extras: Record<string, string> = {};
  const freeLines: string[] = [];
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match && EXTRA_KEYS[match[1].trim()]) {
      extras[match[1].trim()] = match[2].trim();
    } else {
      freeLines.push(line);
    }
  }
  return { extras, freeText: freeLines.join('\n').trim() };
}

/* ─────────────────────────────────────────────────────────────────────── */
export default function DirectBookingDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const [booking, setBooking]     = useState<DirectBooking | null>(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);

  const [payModal, setPayModal]   = useState(false);
  const [payForm, setPayForm]     = useState({ mode: 'cash', amount: '', action: 'mark_paid' });

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal]   = useState('');
  const [copied, setCopied]       = useState(false);

  /* ── Expense state ── */
  const [expenses, setExpenses]         = useState<BookingExpense[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [expenseForm, setExpenseForm]   = useState({ category: 'fuel', amount: '', note: '' });
  const [addingExpense, setAddingExpense] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  /* ── Assignment state ── */
  const [assignModal, setAssignModal]   = useState<'driver' | 'vehicle' | null>(null);
  const [assignOptions, setAssignOptions] = useState<{ drivers: DriverOption[]; vehicles: VehicleOption[] } | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  useEffect(() => {
    fetch(`/api/vendor/direct-bookings/${params.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setBooking(d.booking); setNotesVal(d.booking?.vendorNotes || ''); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const loadExpenses = () => {
    fetch(`/api/vendor/direct-bookings/${params.id}/expenses`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setExpenses(d.expenses || []); setExpensesLoaded(true); });
  };

  const saveExpense = async () => {
    if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount))) return;
    setSavingExpense(true);
    const res = await fetch(`/api/vendor/direct-bookings/${params.id}/expenses`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: expenseForm.category,
        amount:   parseFloat(expenseForm.amount),
        note:     expenseForm.note || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setExpenses(prev => [data.expense, ...prev]);
      setExpenseForm({ category: 'fuel', amount: '', note: '' });
      setAddingExpense(false);
    }
    setSavingExpense(false);
  };

  const deleteExpense = async (expenseId: string) => {
    setDeletingExpenseId(expenseId);
    await fetch(`/api/vendor/direct-bookings/${params.id}/expenses/${expenseId}`, {
      method: 'DELETE', credentials: 'include',
    });
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    setDeletingExpenseId(null);
  };

  const update = async (data: object) => {
    setUpdating(true);
    const res  = await fetch(`/api/vendor/direct-bookings/${params.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) setBooking(json.booking);
    setUpdating(false);
    return res.ok;
  };

  const saveNotes = async () => { await update({ vendorNotes: notesVal }); setEditingNotes(false); };

  const handlePayment = async () => {
    const total = Number(booking?.totalAmount || 0);
    const existingPaid = Number(booking?.paidAmount || 0);

    if (payForm.action === 'mark_paid') {
      const newPaid = total > 0 ? total : existingPaid + parseFloat(payForm.amount || '0');
      const data: any = { paymentStatus: 'collected', paymentMode: payForm.mode, paidAmount: newPaid };
      if (total <= 0) data.totalAmount = newPaid; // fix totalAmount if it was 0
      await update(data);
    } else if (payForm.action === 'mark_partial') {
      const newPaid = existingPaid + parseFloat(payForm.amount || '0');
      if (total > 0 && newPaid >= total) {
        await update({ paymentStatus: 'collected', paymentMode: payForm.mode, paidAmount: total });
      } else {
        const data: any = { paymentStatus: 'partial', paymentMode: payForm.mode, paidAmount: newPaid };
        if (total <= 0) data.totalAmount = newPaid;
        await update(data);
      }
    } else if (payForm.action === 'send_whatsapp') {
      const bal = Math.max(0, total - existingPaid);
      const amt = bal > 0 ? bal : total;
      const msg = encodeURIComponent(`Dear ${booking?.customerName},\n\nPlease pay ₹${amt.toLocaleString('en-IN')} for your booking #${booking?.bookingNumber}.\n\nThank you!`);
      window.open(`https://wa.me/91${booking?.customerPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    }
    setPayModal(false);
  };

  const cancelBooking = async () => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;
    await fetch(`/api/vendor/direct-bookings/${params.id}`, { method: 'DELETE', credentials: 'include' });
    router.push('/vendor/direct-bookings');
  };

  const handleShare = async () => {
    if (!booking) return;
    const url  = `${window.location.origin}/track/${booking.bookingNumber}`;
    const text = `Track your booking #${booking.bookingNumber} here: ${url}`;
    if (navigator.share) {
      await navigator.share({ title: `Booking ${booking.bookingNumber}`, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  /* ── Assignment helpers ── */
  const openAssignModal = async (type: 'driver' | 'vehicle') => {
    setAssignModal(type);
    setAssignSearch('');
    if (!assignOptions) {
      setAssignLoading(true);
      const date = booking?.pickupDate ? new Date(booking.pickupDate).toISOString().split('T')[0] : '';
      const res  = await fetch(`/api/vendor/direct-bookings/assign-options${date ? `?date=${date}` : ''}`, { credentials: 'include' });
      const data = await res.json();
      setAssignOptions(data);
      setAssignLoading(false);
    }
  };

  const assignDriver = async (driverId: string | null) => {
    await update({ assignedDriverId: driverId });
    setAssignModal(null);
  };

  const assignVehicle = async (vehicleId: string | null) => {
    await update({ assignedVehicleId: vehicleId });
    setAssignModal(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen -m-6 bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading booking…</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen -m-6 bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 font-medium">Booking not found</p>
        <Link href="/vendor/direct-bookings" className="text-blue-600 text-sm mt-2 block hover:underline">← Back to bookings</Link>
      </div>
    </div>
  );

  const sc          = STATUS_CFG[booking.status] ?? STATUS_CFG.cancelled;
  const StatusIcon  = sc.icon;
  const pc          = PAYMENT_CFG[booking.paymentStatus] ?? { label: booking.paymentStatus, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
  const nextActions = STATUS_FLOW[booking.status] ?? [];
  const totalAmt    = Number(booking.totalAmount || 0);
  const paidAmt     = Number(booking.paidAmount  || 0);
  const displayAmt  = totalAmt > 0 ? totalAmt : paidAmt;
  const balanceDue  = totalAmt > 0 ? totalAmt - paidAmt : 0;
  const payPercent  = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : (paidAmt > 0 ? 100 : 0);
  const journeyStep = JOURNEY.indexOf(booking.status);
  const initials    = booking.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isTerminal  = booking.status === 'cancelled' || booking.status === 'rejected' || booking.status === 'completed';

  /* ── filtered options ── */
  const q = assignSearch.toLowerCase();
  const filteredDrivers  = (assignOptions?.drivers  ?? []).filter(d => d.name.toLowerCase().includes(q) || d.phone.includes(q));
  const filteredVehicles = (assignOptions?.vehicles ?? []).filter(v => (v.displayName + (v.registrationNumber ?? '')).toLowerCase().includes(q));

  return (
    <div className="min-h-screen -m-6 bg-gray-50">

      {/* ── Color hero header ── */}
      <div className={`bg-gradient-to-r ${sc.headerGrad} px-6 pt-5 pb-16`}>
        <div className="flex items-center justify-between">
          <Link href="/vendor/direct-bookings" className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> All Bookings
          </Link>
          <div className="flex items-center gap-2">
            {booking.bookingSource === 'shared_form' && (
              <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                <Link2 className="w-3 h-3" /> Via Form
              </span>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            {!isTerminal && (
              <button onClick={cancelBooking} className="text-white/60 hover:text-white transition" title="Cancel booking">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 mb-1">
          <p className="text-white/60 text-xs font-mono tracking-widest uppercase">{booking.bookingNumber}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{booking.customerName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1.5 bg-white/20 text-white text-sm px-3 py-1 rounded-full font-semibold">
              <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${pc.bg} ${pc.color}`}>{pc.label}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-4 sm:px-6 -mt-10 pb-8">

        {/* Journey tracker */}
        {!isTerminal && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4 mb-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 mx-8" />
              <div
                className={`absolute left-0 top-4 h-0.5 bg-gradient-to-r ${sc.headerGrad} mx-8 transition-all duration-500`}
                style={{ width: journeyStep >= 0 ? `${(journeyStep / (JOURNEY.length - 1)) * 100}%` : '0%' }}
              />
              {JOURNEY.map((step, i) => {
                const cfg = STATUS_CFG[step]; const Ic = cfg.icon;
                const done = journeyStep > i; const active = journeyStep === i;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                           : active ? `bg-gradient-to-br ${sc.headerGrad} shadow-md`
                           : 'bg-gray-100'
                    }`}>
                      <Ic className={`w-3.5 h-3.5 ${done || active ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* Customer card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-lg leading-tight">{booking.customerName}</p>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {booking.customerPhone}
                    </p>
                    {booking.customerEmail && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{booking.customerEmail}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
                <a href={`tel:${booking.customerPhone}`} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                  <Phone className="w-4 h-4" /> Call Now
                </a>
                <a
                  href={`https://wa.me/91${booking.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${booking.customerName}, regarding your booking #${booking.bookingNumber}...`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#25D366] hover:bg-green-50 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Trip details */}
            {(() => {
              const { extras, freeText } = parseNotes(booking.notes);
              const extraEntries = Object.entries(extras);
              return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Trip Details</p>
                  <div className="space-y-3">
                    {/* Service */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Car className="w-4 h-4 text-blue-500" /></div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Service</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">
                          {SERVICE_LABELS[booking.serviceType] ?? booking.serviceType}
                          {booking.vehicleType && <span className="text-gray-400 font-normal"> · {booking.vehicleType}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Structured extras (Use Type, Goods, Weight, Trip, etc.) */}
                    {extraEntries.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {extraEntries.map(([key, val]) => {
                          const cfg = EXTRA_KEYS[key];
                          return (
                            <span key={key} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${cfg.color}`}>
                              <span>{cfg.icon}</span>
                              <span className="text-[10px] opacity-70 font-normal">{cfg.label}:</span>
                              {val}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Dates */}
                    {(booking.pickupDate || booking.returnDate) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-violet-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Dates</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {formatDate(booking.pickupDate)}
                            {booking.returnDate && <span className="text-gray-400 font-normal"> → {formatDate(booking.returnDate)}</span>}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Route */}
                    {(booking.pickupLocation || booking.dropLocation) && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-emerald-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Route</p>
                          {booking.pickupLocation && <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.pickupLocation}</p>}
                          {booking.dropLocation && <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><span className="text-gray-300">→</span> {booking.dropLocation}</p>}
                        </div>
                      </div>
                    )}

                    {/* Customer free-text note */}
                    {freeText && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-amber-500" /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Customer Note</p>
                          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed whitespace-pre-line">{freeText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Assignment card ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assignment</p>
              </div>

              {/* Driver row */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <UserCircle2 className="w-5 h-5 text-blue-500" />
                    </div>
                    {booking.assignedDriver ? (
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Driver</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{booking.assignedDriver.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {booking.assignedDriver.phone}
                          {booking.assignedDriver.licenseNumber && (
                            <span className="ml-1 text-gray-400">· {booking.assignedDriver.licenseNumber}</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Driver</p>
                        <p className="text-sm text-gray-400 italic">Not assigned</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {booking.assignedDriver && (
                      <a href={`tel:${booking.assignedDriver.phone}`} className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                    )}
                    <button
                      onClick={() => openAssignModal('driver')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                    >
                      {booking.assignedDriver ? 'Change' : 'Assign'}
                    </button>
                    {booking.assignedDriver && (
                      <button onClick={() => assignDriver(null)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition" title="Remove driver">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle row */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-violet-500" />
                    </div>
                    {booking.assignedVehicle ? (
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Vehicle</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {booking.assignedVehicle.vehicleName || 'Vehicle'}
                          {booking.assignedVehicle.color && <span className="text-gray-400 font-normal"> · {booking.assignedVehicle.color}</span>}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          {booking.assignedVehicle.registrationNumber && <span className="font-mono">{booking.assignedVehicle.registrationNumber}</span>}
                          {booking.assignedVehicle.fuelType && <span className="text-gray-400">· {booking.assignedVehicle.fuelType}</span>}
                          {booking.assignedVehicle.seatingCapacity && <span className="text-gray-400">· {booking.assignedVehicle.seatingCapacity} seats</span>}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Vehicle</p>
                        <p className="text-sm text-gray-400 italic">Not assigned</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => openAssignModal('vehicle')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 transition"
                    >
                      {booking.assignedVehicle ? 'Change' : 'Assign'}
                    </button>
                    {booking.assignedVehicle && (
                      <button onClick={() => assignVehicle(null)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition" title="Remove vehicle">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned timestamp */}
              {booking.assignedAt && (
                <div className="px-5 pb-4 -mt-1">
                  <p className="text-[11px] text-gray-400">Assigned {formatDateTime(booking.assignedAt)}</p>
                </div>
              )}
            </div>

            {/* ── Expenses card ── */}
            {(() => {
              const totalExp   = expenses.reduce((s, e) => s + Number(e.amount), 0);
              const revenue    = Number(booking.totalAmount || 0);
              const collected  = Number(booking.paidAmount || 0);
              const netProfit  = collected - totalExp;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expenses</p>
                      {expenses.length > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          ₹{totalExp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!expensesLoaded) loadExpenses();
                        setAddingExpense(v => !v);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Expense
                    </button>
                  </div>

                  {/* Lazy load trigger */}
                  {!expensesLoaded && !addingExpense && (
                    <div className="px-5 pb-4">
                      <button
                        onClick={loadExpenses}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View all expenses
                      </button>
                    </div>
                  )}

                  {/* Add expense inline form */}
                  {addingExpense && (
                    <div className="mx-5 mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                          <select
                            value={expenseForm.category}
                            onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            {EXPENSE_CATEGORIES.map(c => (
                              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={expenseForm.amount}
                            onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Note (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Filled 30L at HP pump"
                          value={expenseForm.note}
                          onChange={e => setExpenseForm(p => ({ ...p, note: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveExpense}
                          disabled={savingExpense || !expenseForm.amount}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-60"
                        >
                          {savingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
                        </button>
                        <button
                          onClick={() => setAddingExpense(false)}
                          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expense list */}
                  {expensesLoaded && expenses.length === 0 && (
                    <p className="px-5 pb-4 text-sm text-gray-400 italic">No expenses recorded yet.</p>
                  )}
                  {expenses.length > 0 && (
                    <div className="divide-y divide-gray-100">
                      {expenses.map(exp => {
                        const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                        return (
                          <div key={exp.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-base shrink-0">
                              {cat?.emoji ?? '📋'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{cat?.label ?? exp.category}</p>
                              {exp.note && <p className="text-xs text-gray-400 truncate">{exp.note}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-red-600">−₹{Number(exp.amount).toLocaleString('en-IN')}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              disabled={deletingExpenseId === exp.id}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition ml-1 shrink-0"
                            >
                              {deletingExpenseId === exp.id
                                ? <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              }
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* P&L summary */}
                  {expenses.length > 0 && (
                    <div className="mx-5 mb-5 mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Revenue</span>
                        <span className="font-semibold text-gray-800">₹{revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Collected</span>
                        <span className="font-semibold text-emerald-600">₹{collected.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Expenses</span>
                        <span className="font-semibold text-red-600">−₹{totalExp.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="text-sm font-bold text-gray-700">Net Earnings</span>
                        <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Vendor notes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Private Notes</p>
                {!editingNotes ? (
                  <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button onClick={saveNotes} disabled={updating} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition">
                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} rows={3}
                  placeholder="Add private notes (only you can see this)…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" autoFocus />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed min-h-[2.5rem]">
                  {booking.vendorNotes || <span className="text-gray-400 italic">No notes yet. Tap Edit to add.</span>}
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Status actions */}
            {nextActions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
                <div className="space-y-2.5">
                  {nextActions.map((action) => {
                    const Ic = action.icon;
                    const isPrimary = action.next !== 'rejected' && action.next !== 'cancelled';
                    return (
                      <button key={action.next} onClick={() => update({ status: action.next })} disabled={updating}
                        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition active:scale-[0.98] disabled:opacity-60 ${
                          isPrimary ? `bg-gradient-to-r ${action.grad} text-white shadow-sm hover:shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ic className="w-4 h-4" />}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${pc.bg} ${pc.color}`}>{pc.label}</span>
              </div>
              {displayAmt > 0 ? (
                <>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400">{totalAmt > 0 ? 'Total Amount' : 'Amount Collected'}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-0.5">₹{displayAmt.toLocaleString('en-IN')}</p>
                    </div>
                    {totalAmt > 0 && paidAmt > 0 && paidAmt !== totalAmt && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Collected</p>
                        <p className="text-lg font-bold text-emerald-600">₹{paidAmt.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>
                  {totalAmt > 0 && (
                    <div className="mb-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${payPercent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${payPercent}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 text-right">{payPercent}% paid</p>
                    </div>
                  )}
                  {balanceDue > 0 && booking.paymentStatus !== 'collected' && booking.paymentStatus !== 'paid_online' && (
                    <div className="flex justify-between items-center bg-orange-50 border border-orange-100 rounded-xl px-3.5 py-2.5 mb-3">
                      <span className="text-sm font-semibold text-orange-700">Balance Due</span>
                      <span className="text-sm font-bold text-orange-700">₹{balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {booking.paymentMode && (
                    <p className="text-xs text-gray-400 mb-3">Mode: <span className="font-semibold text-gray-600 capitalize">{booking.paymentMode}</span></p>
                  )}
                </>
              ) : null}
              {booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.paymentStatus !== 'collected' && booking.paymentStatus !== 'paid_online' && (
                <div className="space-y-2 pt-1">
                  <button onClick={() => { setPayForm({ mode: 'cash', amount: String(balanceDue > 0 ? balanceDue : totalAmt || ''), action: 'mark_paid' }); setPayModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Mark as Fully Paid
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setPayForm({ mode: 'cash', amount: '', action: 'mark_partial' }); setPayModal(true); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition">
                      <Banknote className="w-3.5 h-3.5" /> Collect Advance
                    </button>
                    <button onClick={() => { setPayForm({ mode: 'whatsapp', amount: '', action: 'send_whatsapp' }); setPayModal(true); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1a9e4b] border border-[#25D366]/30 rounded-xl text-xs font-bold transition">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Send via WA
                    </button>
                  </div>
                </div>
              )}
              {(booking.paymentStatus === 'collected' || booking.paymentStatus === 'paid_online') && (
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">Payment fully settled</span>
                </div>
              )}
            </div>

            {/* Booking meta */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Booking Info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-xs font-semibold text-gray-700">{booking.bookingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Source</span>
                  <span className="font-semibold text-gray-700">{booking.bookingSource === 'shared_form' ? '🔗 Booking Form' : '✏️ Manual Entry'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-600 text-xs">{formatDateTime(booking.createdAt)}</span>
                </div>
              </div>
              <button onClick={handleShare}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-400 hover:text-blue-600 text-sm font-semibold transition group">
                {copied
                  ? <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600">Link Copied!</span></>
                  : <><Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Share Tracking Link with Customer</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {payForm.action === 'mark_paid' ? '✅ Mark as Paid' : payForm.action === 'mark_partial' ? '💵 Collect Advance' : '💬 Send via WhatsApp'}
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                {payForm.action === 'send_whatsapp' ? `Opens WhatsApp with a payment request to ${booking.customerName}` : 'Record the payment details below'}
              </p>
              {payForm.action !== 'send_whatsapp' && (
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Amount (₹)</label>
                    <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment Mode</label>
                    <select value={payForm.mode} onChange={e => setPayForm({ ...payForm, mode: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800">
                      <option value="cash">💵 Cash</option>
                      <option value="upi">📱 UPI</option>
                      <option value="card">💳 Card</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
              <button onClick={() => setPayModal(false)} className="py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition rounded-bl-3xl">Cancel</button>
              <button onClick={handlePayment} disabled={updating} className="py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition rounded-br-3xl">
                {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assignment Modal (centered dialog) ── */}
      {assignModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setAssignModal(null); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col"
               style={{ maxHeight: 'min(85vh, 600px)' }}>

            {/* Header */}
            <div className={`rounded-t-3xl px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 shrink-0 ${assignModal === 'driver' ? 'bg-blue-50' : 'bg-violet-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${assignModal === 'driver' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                  {assignModal === 'driver'
                    ? <UserCircle2 className="w-5 h-5 text-blue-600" />
                    : <Truck className="w-5 h-5 text-violet-600" />
                  }
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{assignModal === 'driver' ? 'Assign Driver' : 'Assign Vehicle'}</h3>
                  <p className="text-xs text-gray-400">{assignModal === 'driver' ? 'Select from your staff' : 'Select from your fleet'}</p>
                </div>
              </div>
              <button onClick={() => setAssignModal(null)} className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <input
                type="text"
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
                placeholder={assignModal === 'driver' ? 'Search by name or phone…' : 'Search by name or plate…'}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain rounded-b-3xl">
              {assignLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : assignModal === 'driver' ? (
                <>
                  {filteredDrivers.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-10">No drivers found</p>
                  )}
                  {filteredDrivers.map(driver => {
                    const isAssigned = booking.assignedDriverId === driver.id;
                    return (
                      <button key={driver.id} onClick={() => assignDriver(driver.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition border-b border-gray-50 text-left ${isAssigned ? 'bg-blue-50' : ''}`}>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {driver.profilePhoto
                            ? <img src={driver.profilePhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                            : driver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{driver.name}</p>
                            {!driver.isAvailable && (
                              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold shrink-0">Unavailable</span>
                            )}
                            {driver.licenseExpired && (
                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold shrink-0">License Expired</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{driver.phone}</p>
                          {driver.licenseNumber && <p className="text-xs text-gray-400">License: {driver.licenseNumber}</p>}
                        </div>
                        {isAssigned
                          ? <CheckCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        }
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {filteredVehicles.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-10">No vehicles found</p>
                  )}
                  {filteredVehicles.map(vehicle => {
                    const isAssigned = booking.assignedVehicleId === vehicle.id;
                    return (
                      <button key={vehicle.id} onClick={() => assignVehicle(vehicle.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-violet-50 transition border-b border-gray-50 text-left ${isAssigned ? 'bg-violet-50' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{vehicle.displayName}</p>
                            {!vehicle.isAvailable && (
                              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold shrink-0">Unavailable</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                            {vehicle.registrationNumber && <span className="font-mono">{vehicle.registrationNumber}</span>}
                            {vehicle.color && <span>· {vehicle.color}</span>}
                            {vehicle.fuelType && <span>· {vehicle.fuelType}</span>}
                            {vehicle.seatingCapacity && <span>· {vehicle.seatingCapacity} seats</span>}
                            {vehicle.serviceName && <span className="text-violet-500">· {vehicle.serviceName}</span>}
                          </div>
                        </div>
                        {isAssigned
                          ? <CheckCheck className="w-4 h-4 text-violet-600 shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        }
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
