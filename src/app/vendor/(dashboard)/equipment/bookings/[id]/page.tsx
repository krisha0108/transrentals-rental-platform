'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowLeft,
  CreditCard,
  Edit,
  RefreshCw,
  Users,
  Eye,
  Package,
  Shield,
  Key,
  FileText,
  MessageCircle,
} from 'lucide-react';
import VendorCallButton from '@/components/vendor/VendorCallButton';

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  equipmentCategory: string;
  equipmentName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryCity: string;
  deliveryAddress?: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  dailyRate: number;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: number;
  paymentStatus: string;
  securityDeposit: number;
  status: string;
  operatorName?: string;
  operatorPhone?: string;
  deliveryOtp?: string;
  returnOtp?: string;
  deliveredAt?: string;
  useStartedAt?: string;
  pickupScheduledAt?: string;
  returnedAt?: string;
  advancePaymentRef?: string;
  advancePaymentProof?: string;
  advancePaymentVerified?: boolean;
  customerNotes?: string;
  createdAt: string;
}

interface StaffOperator {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  isAvailable: boolean;
  isAvailableForDates?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT:    { label: 'Awaiting Advance',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAYMENT_SUBMITTED:  { label: 'Payment Review',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ADVANCE_PAID:       { label: 'Booking Confirmed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONFIRMED:          { label: 'Confirmed',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DELIVERED:          { label: 'Delivered',         color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  IN_USE:             { label: 'In Use',            color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PICKUP_SCHEDULED:   { label: 'Pickup Scheduled',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETURNED:           { label: 'Returned',          color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED:          { label: 'Completed',         color: 'bg-gray-50 text-gray-700 border-gray-200' },
  CANCELLED:          { label: 'Cancelled',         color: 'bg-red-50 text-red-700 border-red-200' },
  DROPPED:            { label: 'Dropped',           color: 'bg-red-50 text-red-700 border-red-200' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Payment Pending', color: 'bg-emerald-50 text-emerald-700' },
  SUBMITTED: { label: 'Payment Submitted', color: 'bg-emerald-50 text-emerald-700' },
  VERIFIED: { label: 'Payment Verified', color: 'bg-emerald-50 text-emerald-700' },
  PAID: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
  COMPLETED: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Payment Rejected', color: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-50 text-gray-700' },
};

const EQUIPMENT_CATEGORIES: Record<string, string> = {
  'excavator': 'Excavator',
  'bulldozer': 'Bulldozer',
  'crane': 'Crane',
  'forklift': 'Forklift',
  'loader': 'Loader',
  'grader': 'Grader',
  'compactor': 'Compactor',
  'generator': 'Generator',
  'concrete-mixer': 'Concrete Mixer',
  'scaffolding': 'Scaffolding',
};

// Equipment type ID to name mapping (IDs from customer booking form)
const EQUIPMENT_TYPE_NAMES: Record<string, string> = {
  '1': 'Grove Crane',
  '2': 'Truck Mounted Crane',
  '3': 'Tower Crane',
  '4': 'Telescopic Crane',
  '5': 'Rough Terrain Crane',
  '6': 'Overhead Crane',
  '7': 'Bulldozer',
  '8': 'Dumper',
  '9': 'Loader',
  '10': 'Excavators',
  '11': 'Backhoe Loader',
};

export default function VendorEquipmentBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<EquipmentBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    operatorName: '',
    operatorPhone: '',
  });

  const [staffOperators, setStaffOperators] = useState<StaffOperator[]>([]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/vendor/equipment-bookings/${id}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setAssignForm({
          operatorName: data.booking.operatorName || '',
          operatorPhone: data.booking.operatorPhone || '',
        });
      } else {
        setError(data.error || 'Failed to fetch booking');
      }
    } catch (err) {
      console.error('Failed to fetch booking:', err);
      setError('Failed to fetch booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffOperators = async (startDate?: string, endDate?: string) => {
    try {
      let url = '/api/vendor/staff/drivers';
      if (startDate && endDate) {
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const operators: StaffOperator[] = data.drivers || [];
        // Sort: available operators first, unavailable ones at the bottom
        operators.sort((a, b) => {
          const aUnavailable = a.isAvailableForDates === false ? 1 : 0;
          const bUnavailable = b.isAvailableForDates === false ? 1 : 0;
          return aUnavailable - bUnavailable;
        });
        setStaffOperators(operators);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // Fetch staff operators with booking dates once booking is loaded
  useEffect(() => {
    if (booking?.startDate && booking?.endDate) {
      fetchStaffOperators(booking.startDate, booking.endDate);
    } else {
      fetchStaffOperators();
    }
  }, [booking?.startDate, booking?.endDate]);

  const handleAssignSubmit = async () => {
    if (!assignForm.operatorName || !assignForm.operatorPhone) {
      alert('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/equipment-bookings/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });

      const data = await response.json();
      if (data.success) {
        fetchBooking();
        setShowAssignForm(false);
        alert('Operator assigned successfully');
      } else {
        alert(data.error || 'Failed to assign');
      }
    } catch (err) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getEquipmentCategoryName = (catId: string) => EQUIPMENT_CATEGORIES[catId] || catId;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gray-100 ${shimmer}`} />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-32 bg-gray-200 rounded-lg ${shimmer}`} />
              <div className={`h-5 w-20 bg-gray-100 rounded-full ${shimmer}`} />
              <div className={`h-5 w-24 bg-gray-100 rounded-full ${shimmer}`} />
            </div>
            <div className={`h-3 w-36 bg-gray-100 rounded ${shimmer}`} />
          </div>
        </div>

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 bg-emerald-100 rounded-xl ${shimmer}`} />
              <div className="space-y-2">
                <div className={`h-5 w-40 bg-gray-200 rounded-lg ${shimmer}`} />
                <div className={`h-3 w-28 bg-gray-100 rounded ${shimmer}`} />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className={`h-6 w-20 bg-gray-200 rounded-lg ml-auto ${shimmer}`} />
              <div className={`h-3 w-24 bg-gray-100 rounded ml-auto ${shimmer}`} />
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className={`h-2.5 w-12 bg-gray-100 rounded ${shimmer}`} />
                <div className={`h-4 w-24 bg-gray-200 rounded ${shimmer}`} />
                <div className={`h-2.5 w-16 bg-gray-100 rounded ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className={`h-4 w-24 bg-gray-200 rounded mb-3 ${shimmer}`} />
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-blue-50 rounded-full ${shimmer}`} />
                  <div className="space-y-1.5">
                    <div className={`h-4 w-28 bg-gray-200 rounded ${shimmer}`} />
                    <div className={`h-3 w-40 bg-gray-100 rounded ${shimmer}`} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className={`h-7 w-24 bg-gray-100 rounded-lg ${shimmer}`} />
                  <div className={`h-7 w-16 bg-gray-100 rounded-lg ${shimmer}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`h-4 w-20 bg-gray-200 rounded mb-3 ${shimmer}`} />
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className={`h-3 w-20 bg-gray-100 rounded ${shimmer}`} />
                    <div className={`h-3 w-16 bg-gray-200 rounded ${shimmer}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`h-4 w-32 bg-gray-200 rounded mb-4 ${shimmer}`} />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-6 h-6 bg-emerald-100 rounded-full ${shimmer}`} />
                    <div className="space-y-1 flex-1">
                      <div className={`h-3 w-24 bg-gray-200 rounded ${shimmer}`} />
                      <div className={`h-2.5 w-32 bg-gray-100 rounded ${shimmer}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Booking Not Found</h3>
        <p className="text-gray-400 text-sm mb-5">{error || 'The booking does not exist.'}</p>
        <button
          onClick={() => router.push('/vendor/equipment/bookings')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
  const balance = booking.totalAmount - (booking.advancePaid || 0);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/vendor/equipment/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">#{booking.bookingNumber}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${paymentConfig.color}`}>{paymentConfig.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Dropped Banner */}
      {booking.status === 'DROPPED' && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">This booking has been dropped</p>
            {(booking as any).dropReason && <p className="text-xs text-red-600 mt-0.5">Reason: {(booking as any).dropReason}</p>}
            {(booking as any).droppedAt && <p className="text-xs text-red-500 mt-0.5">Dropped: {new Date((booking as any).droppedAt).toLocaleString('en-IN')}</p>}
          </div>
        </div>
      )}

      {/* ── Equipment + Price Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-emerald-50/30 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{EQUIPMENT_TYPE_NAMES[booking.equipmentName] || booking.equipmentName}</h2>
              <p className="text-xs text-gray-400">{getEquipmentCategoryName(booking.equipmentCategory)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">₹{booking.dailyRate.toLocaleString()}/day × {booking.rentalDays}d</p>
          </div>
        </div>
        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { label: 'Start', value: new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: new Date(booking.startDate).toLocaleDateString('en-IN', { weekday: 'short' }) },
            { label: 'End',   value: new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: new Date(booking.endDate).toLocaleDateString('en-IN', { weekday: 'short' }) },
            { label: 'Duration', value: `${booking.rentalDays} day${booking.rentalDays > 1 ? 's' : ''}`, sub: booking.deliveryCity },
            { label: 'Deposit', value: `₹${booking.securityDeposit.toLocaleString()}`, sub: 'Refundable' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ══ Main Content ══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                {booking.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{booking.customerName}</p>
                {booking.customerEmail && <p className="text-xs text-gray-400 truncate">{booking.customerEmail}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {booking.customerPhone && (
                <VendorCallButton phone={booking.customerPhone} bookingType="equipment_booking" bookingId={booking.id} variant="blue" />
              )}
              {booking.customerEmail && (
                <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
              {booking.customerPhone && (
                <a href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Delivery Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> Delivery Location</h3>
            <p className="text-sm font-semibold text-gray-800">{booking.deliveryCity}</p>
            {booking.deliveryAddress && <p className="text-xs text-gray-500 mt-1">{booking.deliveryAddress}</p>}
          </div>

          {/* Operator Assignment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Operator Assignment
              </h3>
              {!booking.operatorName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition active:scale-95"
                >
                  Assign Operator
                </button>
              )}
              {booking.operatorName && !showAssignForm && ['DELIVERED', 'ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="text-emerald-600 text-xs font-semibold hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Change
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="p-5 bg-emerald-50/30 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Select Operator from Staff *</label>
                  {staffOperators.length > 0 ? (
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                      value={staffOperators.find(o => o.name === assignForm.operatorName)?.id || ''}
                      onChange={(e) => {
                        const operator = staffOperators.find(o => o.id === e.target.value);
                        if (operator) {
                          setAssignForm({ ...assignForm, operatorName: operator.name, operatorPhone: operator.phone });
                        }
                      }}
                    >
                      <option value="">-- Select Operator --</option>
                      {staffOperators.map(o => (
                        <option
                          key={o.id}
                          value={o.id}
                          disabled={o.isAvailableForDates === false}
                        >
                          {o.name} ({o.phone}){o.isAvailableForDates === false ? ' — Assigned for these dates' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={assignForm.operatorName}
                        onChange={(e) => setAssignForm({ ...assignForm, operatorName: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                        placeholder="Operator name"
                      />
                      <input
                        type="tel"
                        value={assignForm.operatorPhone}
                        onChange={(e) => setAssignForm({ ...assignForm, operatorPhone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                        placeholder="Operator phone"
                      />
                    </div>
                  )}

                  {assignForm.operatorName && staffOperators.length > 0 && (
                    <div className="mt-2 p-2.5 bg-white border border-gray-100 rounded-lg">
                      <p className="text-sm font-bold text-gray-900">{assignForm.operatorName}</p>
                      <p className="text-xs text-gray-500">{assignForm.operatorPhone}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignSubmit}
                    disabled={actionLoading || !assignForm.operatorName || !assignForm.operatorPhone}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition active:scale-95"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            ) : booking.operatorName ? (
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Assigned Operator</p>
                    <p className="text-sm font-bold text-gray-900">{booking.operatorName}</p>
                    <p className="text-xs text-emerald-600 font-semibold">{booking.operatorPhone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No operator assigned yet</p>
                {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition active:scale-95"
                  >
                    Assign Operator Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500" /> Customer Notes</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{booking.customerNotes}</p>
            </div>
          )}

          {/* Payment Proof */}
          {booking.advancePaymentProof && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Payment Proof</h3>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                <img src={booking.advancePaymentProof} alt="Payment Proof" className="w-full h-full object-cover" />
                <a href={booking.advancePaymentProof} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Eye className="text-white w-8 h-8" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ══ Sidebar ══ */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500" /> Payment</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Total Amount</span><span className="font-semibold text-gray-700">₹{booking.totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Security Deposit</span><span className="font-semibold text-gray-700">₹{booking.securityDeposit.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Advance Paid</span><span className="font-semibold text-emerald-600">₹{(booking.advancePaid || 0).toLocaleString()}</span></div>
              <div className="border-t border-gray-100 pt-2.5 mt-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900">Balance</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* OTP Codes */}
          {(booking.deliveryOtp || booking.returnOtp) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-emerald-600" /> OTP Codes</h3>
              <div className="space-y-2.5">
                {booking.deliveryOtp && ['CONFIRMED', 'DELIVERED'].includes(booking.status) && (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Delivery OTP</p>
                    <p className="text-2xl font-mono font-bold text-emerald-800">{booking.deliveryOtp}</p>
                  </div>
                )}
                {booking.returnOtp && ['PICKUP_SCHEDULED', 'RETURNED'].includes(booking.status) && (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Return OTP</p>
                    <p className="text-2xl font-mono font-bold text-emerald-800">{booking.returnOtp}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {booking.status === 'CONFIRMED' && booking.operatorName && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Awaiting Delivery</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Operator {booking.operatorName} will deliver with OTP verification.</p>
                </div>
              </div>
            </div>
          )}
          {['DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'].includes(booking.status) && (
            <div className="bg-cyan-50 rounded-2xl border border-cyan-100 p-4">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-cyan-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-cyan-800">Equipment On Rent</p>
                  <p className="text-[11px] text-cyan-700 mt-0.5">Currently in customer use.</p>
                </div>
              </div>
            </div>
          )}
          {booking.status === 'ADVANCE_PAID' && !booking.operatorName && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Assignment Pending</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Please assign an operator to proceed.</p>
                </div>
              </div>
            </div>
          )}
          {booking.status === 'COMPLETED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-800">Rental Completed!</h3>
              <p className="text-xs text-emerald-600 mt-0.5">Booking successfully completed.</p>
            </div>
          )}

          {/* Rental Progress Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> Rental Progress</h3>

            {(() => {
              const isDropped = booking.status === 'DROPPED';
              const paymentDone = booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status);
              const operatorDone = !!booking.operatorName;
              const delivered = ['DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status);
              const inUse = ['IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status);
              const pickupScheduled = ['PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status);
              const returned = ['RETURNED', 'COMPLETED'].includes(booking.status);
              const completed = booking.status === 'COMPLETED';

              let droppedAfterStep = -1;
              if (isDropped) {
                if (returned) droppedAfterStep = 5;
                else if (pickupScheduled) droppedAfterStep = 4;
                else if (inUse) droppedAfterStep = 3;
                else if (delivered) droppedAfterStep = 2;
                else if (operatorDone) droppedAfterStep = 1;
                else if (paymentDone) droppedAfterStep = 0;
              }

              const steps = [
                { label: 'Payment Verified', desc: 'Booking confirmed', done: paymentDone, icon: <CheckCircle className="w-3.5 h-3.5" />, time: null },
                { label: 'Operator Assigned', desc: 'Ready for delivery', done: operatorDone, icon: <Users className="w-3.5 h-3.5" />, time: null },
                { label: 'Delivered', desc: 'Equipment delivered', done: delivered, icon: <Wrench className="w-3.5 h-3.5" />, time: booking.deliveredAt },
                { label: 'In Use', desc: 'Equipment in operation', done: inUse, icon: <Package className="w-3.5 h-3.5" />, time: booking.useStartedAt },
                { label: 'Pickup Scheduled', desc: 'Ready for return', done: pickupScheduled, icon: <Navigation className="w-3.5 h-3.5" />, time: booking.pickupScheduledAt },
                { label: 'Returned', desc: 'Equipment returned', done: returned, icon: <CheckCircle className="w-3.5 h-3.5" />, time: booking.returnedAt },
                { label: 'Completed', desc: 'Rental completed', done: completed, icon: <CheckCircle className="w-3.5 h-3.5" />, time: null },
              ];

              const timelineItems: any[] = [];
              for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const isAfterDrop = isDropped && i > droppedAfterStep;
                timelineItems.push({
                  ...step,
                  bgClass: isAfterDrop ? 'bg-gray-100 text-gray-400' : (step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'),
                  textClass: isAfterDrop ? 'text-gray-400' : (step.done ? 'text-gray-900' : 'text-gray-400'),
                });
                if (isDropped && i === droppedAfterStep) {
                  timelineItems.push({
                    label: 'Booking Dropped', desc: (booking as any).dropReason ? `Reason: ${(booking as any).dropReason}` : 'Booking was dropped',
                    done: false, icon: <XCircle className="w-3.5 h-3.5" />, time: (booking as any).droppedAt,
                    isDroppedMarker: true, bgClass: 'bg-red-500 text-white', textClass: 'text-red-700',
                  });
                }
              }

              return (
                <div className="space-y-4 relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100" />
                  {timelineItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${item.bgClass}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${item.textClass}`}>{item.label}</p>
                        <p className={`text-[10px] ${item.isDroppedMarker ? 'text-red-500' : 'text-gray-400'}`}>{item.desc}</p>
                        {item.time && (
                          <p className={`text-[9px] font-mono mt-0.5 ${item.isDroppedMarker ? 'text-red-500' : 'text-emerald-600'}`}>
                            {new Date(item.time).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
