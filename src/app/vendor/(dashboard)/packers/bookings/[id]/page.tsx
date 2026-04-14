'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
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
  Home,
  Building,
  Key,
  Boxes,
  ArrowRight,
  TruckIcon,
  Loader2,
  FileText,
} from 'lucide-react';

interface PackersBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  shiftingType: string;
  movingService?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupCity: string;
  pickupAddress?: string;
  pickupFloor?: number;
  hasPickupLift?: boolean;
  dropCity: string;
  dropAddress?: string;
  dropFloor?: number;
  hasDropLift?: boolean;
  scheduledDate: string;
  teamSize?: number;
  propertyType?: string;
  propertySize?: string;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: boolean;
  paymentStatus: string;
  status: string;
  teamLeaderName?: string;
  teamLeaderPhone?: string;
  teamMembers?: string;
  vehicleNumber?: string;
  packingOtp?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  packingOtpSent?: boolean;
  loadingOtpSent?: boolean;
  deliveryOtpSent?: boolean;
  packingStartedAt?: string;
  packingCompletedAt?: string;
  loadingCompletedAt?: string;
  unloadingStartedAt?: string;
  unloadingCompletedAt?: string;
  completedAt?: string;
  advancePaymentRef?: string;
  advancePaymentProof?: string;
  advancePaymentVerified?: boolean;
  customerNotes?: string;
  createdAt: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
    propertySize?: string;
    inventoryList?: string;
  };
  acceptedQuote?: {
    id: string;
    quoteNumber: string;
    totalAmount: number;
  };
}

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status: string;
  isAvailableForDates?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT:   { label: 'Awaiting Advance',  color: 'text-yellow-700 border-yellow-200',   bgColor: 'bg-yellow-50' },
  PAYMENT_SUBMITTED: { label: 'Payment Review',    color: 'text-blue-700 border-blue-200',       bgColor: 'bg-blue-50' },
  ADVANCE_PAID:      { label: 'Booking Confirmed', color: 'text-emerald-700 border-emerald-200', bgColor: 'bg-emerald-50' },
  CONFIRMED:         { label: 'Confirmed',         color: 'text-emerald-700 border-emerald-200', bgColor: 'bg-emerald-50' },
  TEAM_ASSIGNED:     { label: 'Team Assigned',     color: 'text-emerald-700 border-emerald-200',   bgColor: 'bg-emerald-50' },
  PACKING:           { label: 'Packing',           color: 'text-violet-700 border-violet-200',   bgColor: 'bg-violet-50' },
  LOADING:           { label: 'Loading',           color: 'text-cyan-700 border-cyan-200',       bgColor: 'bg-cyan-50' },
  IN_TRANSIT:        { label: 'In Transit',        color: 'text-purple-700 border-purple-200',   bgColor: 'bg-purple-50' },
  UNLOADING:         { label: 'Unloading',         color: 'text-teal-700 border-teal-200',       bgColor: 'bg-teal-50' },
  UNPACKING:         { label: 'Unpacking',         color: 'text-pink-700 border-pink-200',       bgColor: 'bg-pink-50' },
  COMPLETED:         { label: 'Completed',         color: 'text-gray-700 border-gray-200',       bgColor: 'bg-gray-50' },
  CANCELLED:         { label: 'Cancelled',         color: 'text-red-700 border-red-200',         bgColor: 'bg-red-50' },
  DROPPED:           { label: 'Dropped',           color: 'text-red-700 border-red-200',         bgColor: 'bg-red-50' },
};

const PROPERTY_TYPES: Record<string, string> = {
  'apartment': 'Apartment',
  'independent-house': 'Independent House',
  'villa': 'Villa',
  'office': 'Office',
  'warehouse': 'Warehouse',
  'shop': 'Shop',
  'other': 'Other',
};

const PROPERTY_SIZES: Record<string, string> = {
  '1rk': '1 RK',
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  '4bhk': '4 BHK',
  '5bhk': '5+ BHK',
  'studio': 'Studio Apartment',
  'small-office': 'Small Office',
  'medium-office': 'Medium Office',
  'large-office': 'Large Office',
};

export default function VendorPackersBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<PackersBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teamLeaderName: '',
    teamLeaderPhone: '',
    teamMembers: '',
  });

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const handleOpenAssignForm = () => {
    setShowAssignForm(true);
    // Re-fetch staff with date-based availability when modal opens
    if (booking?.scheduledDate) {
      const dateStr = booking.scheduledDate.split('T')[0];
      fetchStaffMembers(dateStr, dateStr);
    }
  };

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/vendor/packers-bookings/${id}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setAssignForm({
          teamLeaderName: data.booking.teamLeaderName || '',
          teamLeaderPhone: data.booking.teamLeaderPhone || '',
          teamMembers: data.booking.teamMembers || '',
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

  const fetchStaffMembers = async (startDate?: string, endDate?: string) => {
    try {
      let url = '/api/vendor/staff';
      if (startDate && endDate) {
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        // Filter for active staff members who could be team leaders or helpers
        const activeStaff = data.staff?.filter((s: StaffMember) =>
          s.status === 'ACTIVE' && (s.role === 'DRIVER' || s.role === 'HELPER')
        ) || [];
        // Sort so unavailable staff appear at the bottom
        activeStaff.sort((a: StaffMember, b: StaffMember) => {
          if (a.isAvailableForDates === false && b.isAvailableForDates !== false) return 1;
          if (a.isAvailableForDates !== false && b.isAvailableForDates === false) return -1;
          return 0;
        });
        setStaffMembers(activeStaff);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // Re-fetch staff with date-based availability when booking loads
  useEffect(() => {
    if (booking?.scheduledDate) {
      const dateStr = booking.scheduledDate.split('T')[0];
      fetchStaffMembers(dateStr, dateStr);
    } else {
      fetchStaffMembers();
    }
  }, [booking?.scheduledDate]);

  const handleAssignSubmit = async () => {
    if (!assignForm.teamLeaderName || !assignForm.teamLeaderPhone) {
      alert('Please fill in team leader name and phone number');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/packers-bookings/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });

      const data = await response.json();
      if (data.success) {
        fetchBooking();
        setShowAssignForm(false);
        alert('Team assigned successfully');
      } else {
        alert(data.error || 'Failed to assign team');
      }
    } catch (err) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getPropertyTypeName = (id: string) => PROPERTY_TYPES[id] || id;
  const getPropertySizeName = (id: string) => PROPERTY_SIZES[id] || id;

  // Handle status actions with OTP
  const handleStatusAction = async (action: string, extraData?: any) => {
    if (!booking) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/vendor/packers-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await response.json();

      if (data.success) {
        fetchBooking();
        setShowOtpModal(null);
        setOtpInput('');
        setVehicleNumber('');
        alert(data.message || 'Action completed successfully');
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getBalanceAmount = () => {
    if (!booking) return 0;
    return booking.advancePaid ? booking.totalAmount - booking.advanceAmount : booking.totalAmount;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
        <button onClick={() => router.push('/vendor/packers/bookings')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const balanceAmount = getBalanceAmount();
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const ACTIVE_STATUSES = ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'];

  // Progress steps for moving timeline
  const paymentDone = booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status);
  const teamDone = !!booking.teamLeaderName;
  const packingDone = ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status);
  const loadingDone = ['LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status);
  const transitDone = ['IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status);
  const unloadingDone = ['UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status);
  const unpackingDone = ['UNPACKING', 'COMPLETED'].includes(booking.status);
  const completed = booking.status === 'COMPLETED';
  const isDropped = booking.status === 'DROPPED';

  const steps = [
    { label: 'Payment',    done: paymentDone,   icon: CheckCircle, time: null as any },
    { label: 'Team',       done: teamDone,      icon: Users,       time: null as any },
    { label: 'Packing',    done: packingDone,   icon: Boxes,       time: booking.packingStartedAt },
    { label: 'Loading',    done: loadingDone,   icon: Package,     time: booking.packingCompletedAt },
    { label: 'In Transit', done: transitDone,   icon: Navigation,  time: booking.loadingCompletedAt },
    { label: 'Unloading',  done: unloadingDone, icon: TruckIcon,   time: booking.unloadingStartedAt },
    { label: 'Unpacking',  done: unpackingDone, icon: Boxes,       time: booking.unloadingCompletedAt },
    { label: 'Completed',  done: completed,     icon: CheckCircle, time: booking.completedAt },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/vendor/packers/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">#{booking.bookingNumber}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.color} ${statusConfig.bgColor}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${booking.paymentStatus === 'PAID' || booking.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                {booking.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Dropped Banner */}
      {isDropped && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">This booking has been dropped</p>
            {(booking as any).dropReason && <p className="text-xs text-red-600 mt-0.5">Reason: {(booking as any).dropReason}</p>}
            {(booking as any).droppedAt && <p className="text-xs text-red-500 mt-0.5">Dropped: {new Date((booking as any).droppedAt).toLocaleString('en-IN')}</p>}
          </div>
        </div>
      )}

      {/* ── Service + Price Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-emerald-50/30 to-white gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
              <Package className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate capitalize">
                {booking.shiftingType?.toLowerCase()} Shifting
              </h2>
              <p className="text-xs text-gray-400">
                {[getPropertySizeName(booking.propertySize || ''), getPropertyTypeName(booking.propertyType || '')].filter(Boolean).join(' · ') || booking.serviceType}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">total amount</p>
          </div>
        </div>
        {/* Quick stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-t border-gray-100">
          {[
            { label: 'Pickup',   value: booking.pickupCity, sub: booking.pickupFloor !== undefined ? `Floor ${booking.pickupFloor}` : '' },
            { label: 'Drop-off', value: booking.dropCity,   sub: booking.dropFloor !== undefined ? `Floor ${booking.dropFloor}` : '' },
            { label: 'Date',     value: new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short' }) },
            { label: 'Team',     value: `${booking.teamSize || '—'} members`, sub: booking.teamLeaderName ? 'Assigned' : 'Pending' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ══ Main Content ══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Customer
            </h3>
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
                <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                  <User className="w-3 h-3" /> {booking.customerPhone}
                </a>
              )}
              {booking.customerEmail && (
                <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
              {booking.customerPhone && (
                <a href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all">
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Route Detail */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Route
            </h3>
            <div className="relative pl-6">
              <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-400 to-rose-400" />
              <div className="relative mb-4">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <div className="flex items-center gap-2 mb-0.5">
                  <Home className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-sm font-bold text-gray-900">{booking.pickupCity}</p>
                </div>
                {booking.pickupAddress && <p className="text-xs text-gray-500">{booking.pickupAddress}</p>}
                {booking.pickupFloor !== undefined && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Floor {booking.pickupFloor} · {booking.hasPickupLift ? 'Lift available' : 'No lift'}</p>
                )}
              </div>
              <div className="relative">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                <div className="flex items-center gap-2 mb-0.5">
                  <Building className="w-3.5 h-3.5 text-rose-600" />
                  <p className="text-sm font-bold text-gray-900">{booking.dropCity}</p>
                </div>
                {booking.dropAddress && <p className="text-xs text-gray-500">{booking.dropAddress}</p>}
                {booking.dropFloor !== undefined && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Floor {booking.dropFloor} · {booking.hasDropLift ? 'Lift available' : 'No lift'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customerNotes && (
            <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Customer Notes
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{booking.customerNotes}</p>
            </div>
          )}

          {/* Team Assignment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Team Assignment
              </h3>
              {!booking.teamLeaderName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button onClick={handleOpenAssignForm} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition active:scale-95">
                  Assign Team
                </button>
              )}
              {booking.teamLeaderName && !showAssignForm && ['TEAM_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) && (
                <button onClick={handleOpenAssignForm} className="text-emerald-600 text-xs font-bold hover:underline flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Change
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="p-5 bg-emerald-50/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Team Leader *</label>
                  {staffMembers.length > 0 ? (
                    <select
                      className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 bg-white"
                      value={staffMembers.find((s) => s.name === assignForm.teamLeaderName)?.id || ''}
                      onChange={(e) => {
                        const member = staffMembers.find((s) => s.id === e.target.value);
                        if (member) setAssignForm({ ...assignForm, teamLeaderName: member.name, teamLeaderPhone: member.phone });
                        else setAssignForm({ ...assignForm, teamLeaderName: '', teamLeaderPhone: '' });
                      }}
                    >
                      <option value="">-- Select team leader --</option>
                      {staffMembers.map((m) => (
                        <option key={m.id} value={m.id} disabled={m.isAvailableForDates === false}>
                          {m.name} ({m.phone}) - {m.role}{m.isAvailableForDates === false ? ' — Busy' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        type="text" placeholder="Name"
                        value={assignForm.teamLeaderName}
                        onChange={(e) => setAssignForm({ ...assignForm, teamLeaderName: e.target.value })}
                        className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <input
                        type="tel" placeholder="Phone"
                        value={assignForm.teamLeaderPhone}
                        onChange={(e) => setAssignForm({ ...assignForm, teamLeaderPhone: e.target.value })}
                        className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <Boxes className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                    Team Members (Optional)
                  </label>
                  <textarea
                    value={assignForm.teamMembers}
                    onChange={(e) => setAssignForm({ ...assignForm, teamMembers: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="Comma-separated names"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
                  <button onClick={() => setShowAssignForm(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold">Cancel</button>
                  <button
                    onClick={handleAssignSubmit}
                    disabled={actionLoading || !assignForm.teamLeaderName || !assignForm.teamLeaderPhone}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 active:scale-95 transition"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            ) : booking.teamLeaderName ? (
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Team Leader</p>
                    <p className="font-bold text-gray-900">{booking.teamLeaderName}</p>
                    <p className="text-emerald-600 text-xs font-medium">{booking.teamLeaderPhone}</p>
                  </div>
                </div>
                {booking.teamMembers && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Team Members</p>
                    <p className="text-xs text-gray-700">{booking.teamMembers}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No team assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Sidebar ══ */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Payment
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold text-gray-700">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Advance {booking.advancePaid ? '(Paid)' : '(Pending)'}</span>
                <span className={`font-semibold ${booking.advancePaid ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  ₹{booking.advanceAmount.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 mt-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900">Balance</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{balanceAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Hint */}
          {booking.status === 'ADVANCE_PAID' && !booking.teamLeaderName && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <p className="text-xs font-bold text-blue-800 mb-0.5">Assignment Pending</p>
              <p className="text-[11px] text-blue-700">Assign a team to proceed with the moving.</p>
            </div>
          )}
          {booking.status === 'TEAM_ASSIGNED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
              <p className="text-xs font-bold text-emerald-800 mb-0.5">Ready to Start</p>
              <p className="text-[11px] text-emerald-700">{booking.teamLeaderName} will start packing with OTP verification.</p>
            </div>
          )}
          {ACTIVE_STATUSES.includes(booking.status) && (
            <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-violet-100 rounded-full mb-2 animate-pulse">
                <Navigation className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-xs font-bold text-violet-800">Moving in Progress</p>
            </div>
          )}
          {booking.status === 'COMPLETED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-800">Booking Completed!</h3>
              {booking.completedAt && (
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {new Date(booking.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Moving Progress Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Moving Progress
            </h3>
            <div className="relative space-y-3">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 -mt-0.5">
                      <p className={`text-xs font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {step.time && (
                        <p className="text-[10px] text-emerald-600 font-mono">
                          {new Date(step.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Proof */}
          {booking.advancePaymentProof && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Payment Proof
              </h3>
              <div className="relative aspect-video bg-gray-50 rounded-xl overflow-hidden group border border-gray-100">
                <img src={booking.advancePaymentProof} alt="Payment Proof" className="w-full h-full object-cover" />
                <a href={booking.advancePaymentProof} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Eye className="text-white w-7 h-7" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
