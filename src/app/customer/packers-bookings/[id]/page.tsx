'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  UserCheck,
  Phone,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Navigation,
  Star,
  Copy,
  MessageCircle,
  Loader2,
  FileText,
  Home,
  Truck,
  Send,
  X,
  CreditCard,
  Shield,
  ShieldCheck,
  Box,
  Boxes,
  Briefcase,
  Building2,
  Weight,
  Layers,
  Wrench,
  Repeat,
  HardHat,
  Sparkles,
  StickyNote,
  IndianRupee,
} from 'lucide-react';
import { BookingPayment } from '@/components/payment/BookingPayment';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import BookingPaymentSafetyNotice from '@/components/customer/BookingPaymentSafetyNotice';
import RefundStatusCard from '@/components/customer/RefundStatusCard';
import {
  formatShiftingScope,
  formatPropertyTypeAndSize,
  formatVehicleType,
  formatDate as formatPackersDate,
} from '@/lib/packers-display';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PackersBooking {
  id: string;
  bookingNumber: string;
  customerId?: string;
  serviceType: string;
  shiftingType: string;
  propertySize?: string;
  pickupCity: string;
  pickupAddress: string;
  pickupFloor?: number;
  hasPickupLift?: boolean;
  dropCity: string;
  dropAddress: string;
  dropFloor?: number;
  hasDropLift?: boolean;
  scheduledDate: string;
  // ── Newly-added optional packers fields ──
  shiftingScope?: string;
  pickupPincode?: string;
  dropPincode?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  inventoryList?: string;
  boxesCount?: number;
  bagsCount?: number;
  estimatedWeight?: number;
  estimatedVolumeCubFt?: number;
  hasHeavyItems?: boolean;
  heavyItemsDesc?: string;
  hasFragileItems?: boolean;
  fragileItemsDesc?: string;
  needPacking?: boolean;
  needLoading?: boolean;
  needUnloading?: boolean;
  labourCount?: number;
  vehicleType?: string;
  partLoadAccepted?: boolean;
  needInsurance?: boolean;
  insuranceValue?: number;
  requiresPOD?: boolean;
  receiverName?: string;
  receiverPhone?: string;
  hasMultipleStops?: boolean;
  multipleStopsDetails?: string;
  quoteRequest?: any;
  scheduledTime?: string;
  teamLeaderName?: string;
  teamLeaderPhone?: string;
  teamSize?: number;
  vehicleNumbers?: string[];
  packingCharges: number;
  loadingCharges: number;
  transportCharges: number;
  unloadingCharges: number;
  unpackingCharges: number;
  storageCharges: number;
  insuranceCharges: number;
  materialCharges: number;
  gstAmount: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  status: string;
  paymentStatus?: string;
  packingOtp?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  packingOtpSent?: boolean;
  loadingOtpSent?: boolean;
  deliveryOtpSent?: boolean;
  packingStartedAt?: string;
  loadingStartedAt?: string;
  transitStartedAt?: string;
  unloadingStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  source?: string;
  rating?: number;
  review?: string;
  teamRating?: number;
  packingRating?: number;
  vendor?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  refundAmount?: number;
  quote?: {
    id: string;
    quoteNumber: string;
    vehicleType?: string;
    teamSize?: number;
    estimatedDuration?: number;
    packingCharges: number;
    loadingCharges: number;
    transportCharges: number;
    unloadingCharges: number;
    unpackingCharges: number;
    storageCharges: number;
    insuranceCharges: number;
    materialCharges: number;
    gstAmount: number;
    totalAmount: number;
    advanceAmount: number;
    advancePercent?: number;
    packingMaterials?: string;
    inclusions?: any;
    exclusions?: any;
    termsConditions?: any;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-amber-800', bgColor: 'bg-amber-100', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle },
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'text-indigo-800', bgColor: 'bg-indigo-100', icon: Users },
  PACKING: { label: 'Packing', color: 'text-teal-800', bgColor: 'bg-teal-100', icon: Package },
  LOADING: { label: 'Loading', color: 'text-cyan-800', bgColor: 'bg-cyan-100', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-800', bgColor: 'bg-purple-100', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: Truck },
  UNPACKING: { label: 'Unpacking', color: 'text-teal-800', bgColor: 'bg-teal-100', icon: Package },
  COMPLETED: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-100', icon: AlertCircle },
};

/** Progress rail — presentation only, derived from booking.status. No new state. */
const BOOKING_STEPS = [
  'Pending Payment',
  'Payment Review',
  'Advance Paid',
  'Confirmed',
  'Team Assigned',
  'Packing',
  'Loading',
  'In Transit',
  'Unloading',
  'Unpacking',
  'Completed',
];
const STEP_INDEX_BY_STATUS: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PAYMENT_SUBMITTED: 1,
  ADVANCE_PAID: 2,
  CONFIRMED: 3,
  TEAM_ASSIGNED: 4,
  PACKING: 5,
  LOADING: 6,
  IN_TRANSIT: 7,
  UNLOADING: 8,
  UNPACKING: 9,
  COMPLETED: 10,
};
const RAIL_HIDDEN_STATUSES = ['CANCELLED'];

const CANCEL_REASONS = [
  'Moving date needs to change',
  'Found a better deal elsewhere',
  'Plans have changed / Move cancelled',
  'Submitted by mistake',
  'Vendor not responding',
  'Service quality concerns',
  'Budget constraints',
  'Other',
];

const SERVICE_TYPES: Record<string, string> = {
  'home-local': 'Local Home Shifting',
  'home-intercity': 'Intercity Home Shifting',
  'office': 'Office Relocation',
  'vehicle': 'Vehicle Transportation',
  'international': 'International Moving',
  'full-service': 'Full Service',
};

const SHIFTING_TYPES: Record<string, string> = {
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  '4bhk': '4 BHK',
  'villa': 'Villa',
  'office-small': 'Small Office',
  'office-large': 'Large Office',
};

/** Card shell shared by every section on the page. */
function Card({
  title,
  aside,
  tone = 'default',
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  tone?: 'default' | 'danger' | 'warning';
  children: React.ReactNode;
}) {
  const shell =
    tone === 'danger'
      ? 'border-red-100'
      : tone === 'warning'
        ? 'border-amber-200'
        : 'border-gray-100';
  const head =
    tone === 'danger'
      ? 'border-red-100 bg-red-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-gray-50 bg-[#FCFDFC]';
  const label =
    tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-gray-400';
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${shell}`}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${head}`}>
        <p className={`quote-serif text-[17px] font-medium ${label}`}>{title}</p>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * One labelled value. Mirrors the visibility rule the shared
 * PackersRequestDetails component uses: nothing renders for an empty value.
 */
function Field({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  if (value === null || value === undefined || value === '' || value === false) return null;
  return (
    <div
      className={`group flex min-w-0 items-start gap-2.5 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(1,35,20,.35)] ${
        highlight ? 'border-[#C8F1DF] bg-[#E9FAF2]' : 'border-gray-100 bg-white hover:border-[#C8F1DF]'
      }`}
    >
      <span
        className={`mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] transition ${
          highlight ? 'bg-white text-[#056B3E]' : 'bg-gray-100 text-gray-500 group-hover:bg-[#E9FAF2] group-hover:text-[#056B3E]'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">{label}</span>
        <span
          className={`mt-0.5 block break-words text-[13.5px] leading-snug ${
            highlight ? 'font-extrabold text-[#056B3E]' : 'font-semibold text-gray-900'
          }`}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

/** Titled group of fields inside a card. */
function Group({
  icon: Icon,
  title,
  tint,
  children,
}: {
  icon: any;
  title: string;
  tint: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';
  children: React.ReactNode;
}) {
  const tints: Record<string, string> = {
    emerald: 'bg-[#E9FAF2] text-[#056B3E]',
    sky: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
    rose: 'bg-red-50 text-red-600',
    slate: 'bg-gray-100 text-gray-500',
  };
  return (
    <div className="mt-4 first:mt-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${tints[tint]}`}>
          <Icon className="h-3 w-3" />
        </span>
        <p className="quote-serif text-[17px] font-medium text-gray-500">{title}</p>
      </div>
      {children}
    </div>
  );
}

const FIELD_GRID = 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3';

/** OTP panel — same shape the bike/bus pages use. */
function OtpCard({
  label,
  otp,
  hint,
  gradient,
}: {
  label: string;
  otp: string;
  hint: string;
  gradient: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(420px 180px at 90% -20%, rgba(255,255,255,.25), transparent 60%)' }}
      />
      <div className="relative z-10">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/[0.72]">{label}</p>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3.5">
          <span className="flex gap-2">
            {otp.split('').map((d, i) => (
              <span
                key={i}
                className="flex h-[52px] w-11 items-center justify-center rounded-xl border border-white/[0.28] bg-white/[0.16] text-2xl font-extrabold tabular-nums"
              >
                {d}
              </span>
            ))}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(otp);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 text-[12.5px] font-bold transition hover:bg-white/[0.32]"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-3 text-[11.5px] text-white/[0.72]">{hint}</p>
      </div>
    </div>
  );
}

/** Right-rail key/value row. */
function MetaRow({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === '') return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 py-2.5 last:border-b-0">
      <span className="text-xs text-gray-400">{k}</span>
      <span className="break-words text-right text-[12.5px] font-semibold text-gray-800">{v}</span>
    </div>
  );
}

/** One action in the support card — icon, what it does, and where it goes. */
function HelpRow({
  icon: Icon,
  title,
  hint,
  href,
  onClick,
}: {
  icon: any;
  title: string;
  hint: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    'group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:border-[#C8F1DF] hover:bg-[#FCFDFC] hover:shadow-[0_8px_20px_-12px_rgba(1,35,20,.35)]';
  const inner = (
    <>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition group-hover:bg-[#E9FAF2] group-hover:text-[#056B3E]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-gray-800">{title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-gray-400">{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#056B3E]" />
    </>
  );
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}

/** Charge line in the payment summary. */
function ChargeRow({ label, amount }: { label: string; amount?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
      <span className="text-[12.5px] text-gray-500">{label}</span>
      <span className="text-[13px] font-bold tabular-nums text-gray-800">₹{amount?.toLocaleString('en-IN')}</span>
    </div>
  );
}

/** Safely turn the JSON-ish quote columns into a list. */
function toList(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
}

export default function CustomerPackersBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booking, setBooking] = useState<PackersBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [teamRating, setTeamRating] = useState(0);
  const [packingRating, setPackingRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Check authentication from localStorage
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (!customer) return;

    const fetchBooking = async () => {
      try {
        const identifier = customer.phone || customer.email;
        const response = await fetch(`/api/packers-bookings/${params.id}?phone=${encodeURIComponent(identifier)}`);
        const data = await response.json();

        if (data.success) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Booking not found');
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, customer]);

  const fetchChatMessages = async (showLoader = true) => {
    if (!booking?.id || !booking?.vendor?.id) return;

    try {
      if (showLoader) setIsLoadingMessages(true);
      const res = await fetch(
        `/api/customer/booking/${booking.id}/chat/${booking.vendor.id}?customer_id=${booking.customerId || ''}`
      );
      const data = await res.json();

      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !booking?.id || !booking?.vendor?.id) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch(`/api/customer/booking/${booking.id}/chat/${booking.vendor.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newChatMessage.trim(),
          customer_id: booking.customerId || '',
          customer_name: customer?.name
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNewChatMessage('');
        fetchChatMessages(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (showChat && booking?.id && booking?.vendor?.id) {
      fetchChatMessages(true);
      const interval = setInterval(() => fetchChatMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [showChat, booking?.id, booking?.vendor?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRawTime = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSubmitRating = async () => {
    if (rating === 0 || !booking) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/packers-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          rating,
          review,
          teamRating,
          packingRating
        })
      });

      const data = await response.json();
      if (data.success) {
        setBooking({ ...booking, rating, review, teamRating, packingRating });
        setShowRateModal(false);
      } else {
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const downloadInvoice = () => {
    if (!booking) return;
    window.open(`/api/packers-bookings/${booking.id}/invoice`, '_blank');
  };

  const handleCancelBooking = async () => {
    const finalReason = selectedCancelReason === 'Other' ? otherCancelReason.trim() : selectedCancelReason;
    if (!finalReason) {
      setCancelError(selectedCancelReason === 'Other' ? 'Please describe your reason' : 'Please select a reason');
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/packers-bookings/${booking?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        setBooking(prev => prev ? { ...prev, status: 'CANCELLED', cancellationReason: finalReason, cancelledBy: 'CUSTOMER', cancelledAt: new Date().toISOString() } : prev);
      } else {
        setCancelError(data.error || 'Failed to cancel booking');
      }
    } catch {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !customer) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#09B368]" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 p-4`}>
        <div className="max-w-2xl mx-auto">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600">{error || 'This booking does not exist or you do not have access to it.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  // Same merge the page has always fed to the shared packers details renderer:
  // booking columns first, quote-request columns win where both exist.
  const details: any = { ...booking, ...(booking.quoteRequest || {}) };

  const scopeLabel = formatShiftingScope(details.shiftingScope);
  const vehicleTypeLabel = formatVehicleType(details.vehicleType);
  const propertyLabel = formatPropertyTypeAndSize(booking.shiftingType, booking.propertySize || details.propertySize);
  const serviceLabel = SERVICE_TYPES[booking.serviceType] || booking.serviceType;
  const headline = SHIFTING_TYPES[booking.shiftingType] || propertyLabel || booking.shiftingType;

  const grandTotal =
    booking.totalAmount ||
    (booking.packingCharges || 0) +
      (booking.loadingCharges || 0) +
      (booking.transportCharges || 0) +
      (booking.unloadingCharges || 0) +
      (booking.unpackingCharges || 0) +
      (booking.storageCharges || 0) +
      (booking.insuranceCharges || 0) +
      (booking.materialCharges || 0) +
      (booking.gstAmount || 0);

  const currentStepIdx = STEP_INDEX_BY_STATUS[booking.status] ?? 0;
  const canCancel = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'].includes(booking.status);

  const inclusions = toList(booking.quote?.inclusions);
  const exclusions = toList(booking.quote?.exclusions);
  const terms = toList(booking.quote?.termsConditions);
  const packingMaterials = toList(booking.quote?.packingMaterials);

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />

      {/* ══════════════ Hero header ══════════════ */}
      <div className="relative overflow-hidden bg-[#012314] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(680px 300px at 90% -30%, rgba(255,255,255,.24), transparent 60%),' +
              'radial-gradient(460px 240px at 4% 130%, rgba(1,35,20,.6), transparent 58%),' +
              'repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 1px, transparent 1px 46px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          {/* Back link + status on one line */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.07] py-1 pl-2 pr-3 text-xs font-semibold text-white/[0.74] transition hover:-translate-x-0.5 hover:bg-white/[0.17] hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <div className={`px-3 py-1.5 rounded-full text-[11.5px] font-extrabold flex-shrink-0 whitespace-nowrap shadow-lg shadow-black/20 ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
          </div>

          {/* Title + stat strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 bg-white/[0.14] rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.24] shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">
                <Package className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="quote-serif text-[30px] sm:text-[38px] font-medium leading-tight tracking-[-0.01em]">{headline}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md border border-white/[0.14] bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white/80">
                    {booking.bookingNumber}
                  </span>
                  {booking.pickupCity && (
                    <span className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                      <MapPin className="w-3.5 h-3.5" />{booking.pickupCity}
                    </span>
                  )}
                  {scopeLabel && <span className="text-xs text-white/[0.62]">{scopeLabel}</span>}
                  {serviceLabel && <span className="text-xs text-white/[0.62]">{serviceLabel}</span>}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] sm:grid-cols-4 lg:w-auto">
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Moving Date</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="border-l border-white/[0.12] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Total Amount</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">₹{grandTotal?.toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t border-white/[0.12] px-5 py-3 sm:border-t-0 sm:border-l">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">
                  Advance {booking.quote?.advancePercent ? `${booking.quote.advancePercent}%` : ''}
                </p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {booking.advanceAmount ? `₹${booking.advanceAmount.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
              <div className="border-l border-t border-white/[0.12] px-5 py-3 sm:border-t-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/[0.58] whitespace-nowrap">Balance Due</p>
                <p className="mt-1 text-[17px] font-extrabold tabular-nums whitespace-nowrap">
                  {booking.balanceAmount != null ? `₹${booking.balanceAmount.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress rail — reflects booking.status, no new state */}
          {!RAIL_HIDDEN_STATUSES.includes(booking.status) && (
            <div className="mt-6 border-t border-white/[0.13] pt-5">
              <div className="flex items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_82%,transparent)] md:[mask-image:none]">
                {BOOKING_STEPS.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isNow = i === currentStepIdx;
                  return (
                    <div key={step} className="relative min-w-[104px] flex-1 text-center">
                      {i > 0 && (
                        <span className="absolute top-[10px] left-[calc(-50%+12px)] right-[calc(50%+12px)] h-0.5 overflow-hidden rounded-sm bg-white/20">
                          <span className={`block h-full rounded-sm bg-white transition-[width] duration-700 ${i <= currentStepIdx ? 'w-full' : 'w-0'}`} />
                        </span>
                      )}
                      <span
                        className={`relative z-10 mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition ${
                          isNow
                            ? 'border-amber-100 bg-amber-100 text-amber-800 shadow-[0_0_0_5px_rgba(254,243,199,.2)]'
                            : isDone
                              ? 'border-white bg-white text-[#056B3E]'
                              : 'border-white/30 bg-white/[0.16] text-white/50'
                        }`}
                      >
                        {isDone && <CheckCircle className="h-3 w-3" strokeWidth={3.5} />}
                        {isNow && <Clock className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={`mt-2.5 block whitespace-nowrap text-[11px] ${isNow ? 'font-bold text-white' : isDone ? 'font-semibold text-white/90' : 'font-semibold text-white/[0.55]'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ Body ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-5">

        {/* ══ Left column ══ */}
        <div className="flex min-w-0 flex-col gap-4">

          {/* Payment Required — amount stub beside the existing BookingPayment widget */}
          {booking.status === 'PENDING_PAYMENT' && booking.advanceAmount && (
            <section className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_20px_52px_-22px_rgba(1,35,20,.45)] lg:grid-cols-[1.08fr_0.92fr] lg:has-[[data-manual-payment]]:grid-cols-1">
              <div className="relative overflow-hidden bg-[linear-gradient(155deg,#01301B_0%,#056B3E_58%,#078F53_100%)] px-5 py-5 text-white">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(520px 240px at 100% -30%, rgba(42,210,145,.42), transparent 62%),' +
                      'repeating-linear-gradient(128deg, rgba(255,255,255,.045) 0 1px, transparent 1px 38px)',
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] border border-white/[0.22] bg-white/[0.16]">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[13px] font-extrabold">Complete Your Booking</span>
                      <span className="mt-px block text-[11px] text-white/[0.66]">Pay advance to confirm</span>
                    </span>
                  </div>
                  <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Advance Payment</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[38px] font-extrabold leading-none tracking-[-0.035em] tabular-nums sm:text-[44px]">
                      ₹{booking.advanceAmount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs tabular-nums text-white/[0.68]">
                      of ₹{grandTotal?.toLocaleString('en-IN')} total
                      {booking.quote?.advancePercent ? (
                        <> · <span className="font-bold text-white">{booking.quote.advancePercent}% advance</span></>
                      ) : null}
                    </span>
                  </div>
                  {booking.balanceAmount != null && (
                    <p className="mt-4 text-[11px] font-semibold text-white/[0.6]">
                      Balance on delivery · ₹{booking.balanceAmount.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/*
                The embedded widget ships deliberately tight "compact" spacing so it
                can survive narrow columns. This column has room, so its rows get
                nudged apart. Scoped with :not([data-manual-payment]) so the much
                taller UPI / bank-transfer panel keeps its own spacing untouched.
              */}
              <div
                className="flex flex-col justify-center gap-3.5 px-6 py-6
                  [&>div:not([data-manual-payment])>button]:!py-3
                  [&>div:not([data-manual-payment])>div]:!mt-3.5
                  [&>button]:!pt-3"
              >
                <BookingPayment
                  bookingId={booking.id}
                  bookingType="packers"
                  amount={booking.advanceAmount}
                  bookingNumber={booking.bookingNumber}
                  serviceSlug="packers-movers"
                  onSuccess={() => window.location.reload()}
                  embedded
                />
              </div>
            </section>
          )}

          {/* Payment Submitted - Under Review */}
          {booking.status === 'PAYMENT_SUBMITTED' && (
            <Card title="Payment Under Review" tone="warning">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
                <p className="text-[13px] leading-relaxed text-gray-600">
                  Your payment is being verified. This usually takes 15-30 minutes during business hours.
                  You will receive a notification once verified.
                </p>
              </div>
            </Card>
          )}

          {/* ── Move Route ── */}
          <Card
            title="Move Route"
            aside={scopeLabel ? <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold text-[#056B3E]">{scopeLabel}</span> : undefined}
          >
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              {/* Pickup */}
              <div className="rounded-2xl border border-[#C8F1DF] bg-[#E9FAF2] p-3.5 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#09B368]">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-[#056B3E]">Pickup</p>
                </div>
                <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{booking.pickupCity}</p>
                <p className="mt-0.5 break-words text-xs text-gray-500">{booking.pickupAddress}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {details.pickupPincode && (
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-gray-500">
                      PIN {details.pickupPincode}
                    </span>
                  )}
                  {details.pickupFloor != null && (
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-bold text-gray-500">
                      Floor {details.pickupFloor}
                    </span>
                  )}
                  {details.pickupFloor != null && (
                    <span className={`rounded-full border bg-white px-2 py-0.5 text-[10.5px] font-bold ${details.hasPickupLift ? 'border-[#C8F1DF] text-[#056B3E]' : 'border-red-200 text-red-700'}`}>
                      {details.hasPickupLift ? 'Lift available' : 'No lift'}
                    </span>
                  )}
                </div>
              </div>

              {/* Date pill */}
              <div className="flex flex-col items-center gap-1.5 px-1">
                <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1A15] px-3 py-1.5 text-[11.5px] font-bold text-white">
                  <Truck className="h-3 w-3" />
                  {formatDate(booking.scheduledDate)}
                </span>
                <span className="hidden h-0.5 w-full min-w-[34px] rounded-sm bg-[repeating-linear-gradient(90deg,#E4EBE7_0_5px,transparent_5px_10px)] sm:block" />
              </div>

              {/* Drop */}
              <div className="rounded-2xl border border-red-100 bg-red-50 p-3.5 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-red-500">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-red-700">Drop-off</p>
                </div>
                <p className="mt-2.5 text-[15px] font-extrabold text-gray-900">{booking.dropCity}</p>
                <p className="mt-0.5 break-words text-xs text-gray-500">{booking.dropAddress}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {details.dropPincode && (
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-gray-500">
                      PIN {details.dropPincode}
                    </span>
                  )}
                  {details.dropFloor != null && (
                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-bold text-gray-500">
                      Floor {details.dropFloor}
                    </span>
                  )}
                  {details.dropFloor != null && (
                    <span className={`rounded-full border bg-white px-2 py-0.5 text-[10.5px] font-bold ${details.hasDropLift ? 'border-[#C8F1DF] text-[#056B3E]' : 'border-red-200 text-red-700'}`}>
                      {details.hasDropLift ? 'Lift available' : 'No lift'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Moving Details ── */}
          <Card title="Moving Details">
            <div className={FIELD_GRID}>
              <Field icon={Wrench} label="Service Type" value={serviceLabel} />
              <Field icon={Home} label="Property" value={propertyLabel} />
              <Field icon={Navigation} label="Shifting Scope" value={scopeLabel} highlight />
              <Field icon={Calendar} label="Moving Date" value={formatDate(booking.scheduledDate)} />
              <Field icon={Clock} label="Moving Time" value={booking.scheduledTime ? formatRawTime(booking.scheduledTime) : null} />
              <Field
                icon={Truck}
                label="Expected Delivery"
                value={
                  details.expectedDeliveryDate
                    ? `${formatPackersDate(details.expectedDeliveryDate)}${details.expectedDeliveryTime ? ` · ${details.expectedDeliveryTime}` : ''}`
                    : null
                }
              />
            </div>
          </Card>

          {/* ── Move Information ── */}
          <Card
            title="Move Information"
            aside={
              details.requestNumber ? (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-gray-500">
                  {details.requestNumber}
                </span>
              ) : undefined
            }
          >
            {/* Trip Info */}
            <Group icon={ArrowRight} title="Trip Info" tint="emerald">
              <div className={FIELD_GRID}>
                <Field icon={ArrowRight} label="Shifting Scope" value={scopeLabel} highlight />
                <Field icon={MapPin} label="Pickup Pincode" value={details.pickupPincode} />
                <Field icon={MapPin} label="Drop Pincode" value={details.dropPincode} />
                <Field
                  icon={Calendar}
                  label="Expected Delivery"
                  value={
                    details.expectedDeliveryDate
                      ? `${formatPackersDate(details.expectedDeliveryDate)}${details.expectedDeliveryTime ? ` · ${details.expectedDeliveryTime}` : ''}`
                      : null
                  }
                />
              </div>
            </Group>

            {/* Property Access */}
            {(details.pickupFloor != null || details.dropFloor != null) && (
              <Group icon={Building2} title="Property Access" tint="sky">
                <div className={FIELD_GRID}>
                  <Field
                    icon={ArrowUpDown}
                    label="Pickup Floor"
                    value={
                      details.pickupFloor != null ? (
                        <span>
                          Floor {details.pickupFloor}
                          <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${details.hasPickupLift ? 'bg-[#E9FAF2] text-[#056B3E]' : 'bg-red-100 text-red-700'}`}>
                            {details.hasPickupLift ? 'Lift' : 'No lift'}
                          </span>
                        </span>
                      ) : null
                    }
                  />
                  <Field
                    icon={ArrowUpDown}
                    label="Drop Floor"
                    value={
                      details.dropFloor != null ? (
                        <span>
                          Floor {details.dropFloor}
                          <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${details.hasDropLift ? 'bg-[#E9FAF2] text-[#056B3E]' : 'bg-red-100 text-red-700'}`}>
                            {details.hasDropLift ? 'Lift' : 'No lift'}
                          </span>
                        </span>
                      ) : null
                    }
                  />
                </div>
              </Group>
            )}

            {/* Inventory */}
            <Group icon={Package} title="Inventory" tint="amber">
              {details.inventoryList && (
                <div className="mb-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-700">
                    <StickyNote className="h-3 w-3" /> Inventory List
                  </p>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-gray-900">{details.inventoryList}</p>
                </div>
              )}
              <div className={FIELD_GRID}>
                <Field icon={Weight} label="Estimated Weight" value={details.estimatedWeight ? `${details.estimatedWeight} kg` : null} highlight />
                <Field icon={Layers} label="Estimated Volume" value={details.estimatedVolumeCubFt ? `${details.estimatedVolumeCubFt} cuft` : null} />
                <Field icon={Box} label="Boxes" value={details.boxesCount} />
                <Field icon={Briefcase} label="Bags" value={details.bagsCount} />
                <Field
                  icon={HardHat}
                  label="Heavy Items"
                  value={details.hasHeavyItems ? (details.heavyItemsDesc ? `Yes – ${details.heavyItemsDesc}` : 'Yes') : null}
                />
                <Field
                  icon={Sparkles}
                  label="Fragile Items"
                  value={details.hasFragileItems ? (details.fragileItemsDesc ? `Yes – ${details.fragileItemsDesc}` : 'Yes') : null}
                />
              </div>
            </Group>

            {/* Services Required */}
            <Group icon={Wrench} title="Services Required" tint="violet">
              <div className={FIELD_GRID}>
                <Field icon={Package} label="Packing" value={details.needPacking ? 'Required' : null} />
                <Field icon={CheckCircle2} label="Loading" value={details.needLoading ? 'Required' : null} />
                <Field icon={CheckCircle2} label="Unloading" value={details.needUnloading ? 'Required' : null} />
                <Field icon={HardHat} label="Labour Count" value={details.labourCount} />
                <Field icon={Truck} label="Vehicle Type" value={vehicleTypeLabel} />
                <Field icon={Boxes} label="Part Load" value={details.partLoadAccepted ? 'Accepted' : null} />
                <Field
                  icon={ShieldCheck}
                  label="Insurance"
                  value={
                    details.needInsurance
                      ? details.insuranceValue
                        ? (
                          <span className="inline-flex items-center gap-0.5">
                            Yes <IndianRupee className="ml-0.5 h-3 w-3" />
                            {details.insuranceValue.toLocaleString('en-IN')}
                          </span>
                        )
                        : 'Yes'
                      : null
                  }
                />
                <Field icon={ShieldCheck} label="POD" value={details.requiresPOD ? 'Required' : null} />
              </div>
            </Group>

            {/* Receiver & Stops */}
            <Group icon={UserCheck} title="Receiver & Stops" tint="rose">
              <div className={FIELD_GRID}>
                <Field icon={User} label="Receiver Name" value={details.receiverName} />
                <Field icon={Phone} label="Receiver Phone" value={details.receiverPhone} />
                <Field
                  icon={Repeat}
                  label="Multiple Stops"
                  value={details.hasMultipleStops ? (details.multipleStopsDetails ? `Yes – ${details.multipleStopsDetails}` : 'Yes') : null}
                />
              </div>
            </Group>

            {/* Customer's own note from the quote request */}
            {details.requirements && (
              <Group icon={StickyNote} title="Your Requirements" tint="slate">
                <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] p-3.5">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-gray-800">{details.requirements}</p>
                </div>
              </Group>
            )}
          </Card>

          {/* ── OTPs — only shown when the team sends them ── */}
          {booking.packingOtp && booking.packingOtpSent && ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'].includes(booking.status) && (
            <OtpCard
              label="Packing Start OTP"
              otp={booking.packingOtp}
              hint="Share this with the team to start packing"
              gradient="bg-[linear-gradient(125deg,#056B3E,#09B368)] shadow-[0_18px_44px_-14px_rgba(9,179,104,.5)]"
            />
          )}
          {booking.loadingOtp && booking.loadingOtpSent && ['PACKING', 'LOADING'].includes(booking.status) && (
            <OtpCard
              label="Loading OTP"
              otp={booking.loadingOtp}
              hint="Share this to verify loading completion"
              gradient="bg-[linear-gradient(125deg,#0E7490,#06B6D4)] shadow-[0_18px_44px_-14px_rgba(6,182,212,.45)]"
            />
          )}
          {booking.deliveryOtp && booking.deliveryOtpSent && ['IN_TRANSIT', 'UNLOADING', 'UNPACKING'].includes(booking.status) && (
            <OtpCard
              label="Delivery Completion OTP"
              otp={booking.deliveryOtp}
              hint="Share this to confirm delivery completion"
              gradient="bg-[linear-gradient(125deg,#5B21B6,#8B5CF6)] shadow-[0_18px_44px_-14px_rgba(139,92,246,.45)]"
            />
          )}

          {/* ── Team & Vehicle ── */}
          {(booking.teamLeaderName || booking.vehicleNumbers) && (
            <Card title="Team & Vehicle">
              <div className={FIELD_GRID}>
                <Field icon={User} label="Team Leader" value={booking.teamLeaderName} />
                <Field icon={Phone} label="Leader Phone" value={booking.teamLeaderPhone} />
                <Field icon={Users} label="Team Size" value={booking.teamSize ? `${booking.teamSize} members` : null} />
              </div>
              {booking.vehicleNumbers && booking.vehicleNumbers.length > 0 && (
                <div className="mt-3 border-t border-gray-50 pt-3">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Vehicle Numbers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.vehicleNumbers.map((vehicle, idx) => (
                      <span key={idx} className="rounded-lg border border-[#C8F1DF] bg-[#E9FAF2] px-3 py-1.5 text-[12.5px] font-extrabold tabular-nums text-[#056B3E]">
                        {vehicle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {booking.teamLeaderPhone && (
                <a
                  href={`tel:${booking.teamLeaderPhone}`}
                  className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#09B368] px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
                >
                  <Phone className="h-4 w-4" />
                  Call Team Leader
                </a>
              )}
            </Card>
          )}

          {/* ── Quote Details ── */}
          {booking.quote && (
            <Card
              title="Quote Details"
              aside={
                <span className="rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#056B3E]">
                  {booking.quote.quoteNumber}
                </span>
              }
            >
              <div className={FIELD_GRID}>
                <Field icon={Truck} label="Vehicle Type" value={booking.quote.vehicleType} />
                <Field icon={Users} label="Team Size" value={booking.quote.teamSize ? `${booking.quote.teamSize} packers` : null} />
                <Field icon={Clock} label="Est. Duration" value={booking.quote.estimatedDuration} />
                <Field icon={Box} label="Packing Materials" value={packingMaterials.length > 0 ? packingMaterials.join(', ') : null} />
              </div>

              {inclusions.length > 0 && (
                <Group icon={CheckCircle} title="Inclusions" tint="emerald">
                  <div className="flex flex-wrap gap-1.5">
                    {inclusions.map((item: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#C8F1DF] bg-[#E9FAF2] px-2.5 py-1 text-[11.5px] font-bold text-[#056B3E]">
                        <CheckCircle className="h-3 w-3" />{item}
                      </span>
                    ))}
                  </div>
                </Group>
              )}

              {exclusions.length > 0 && (
                <Group icon={XCircle} title="Exclusions" tint="rose">
                  <div className="flex flex-wrap gap-1.5">
                    {exclusions.map((item: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11.5px] font-bold text-red-700">
                        <XCircle className="h-3 w-3" />{item}
                      </span>
                    ))}
                  </div>
                </Group>
              )}

              {terms.length > 0 && (
                <Group icon={FileText} title="Terms & Conditions" tint="slate">
                  <ul className="flex flex-col gap-2">
                    {terms.map((item: string, i: number) => (
                      <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-gray-500">
                        <span className="mt-px flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-[7px] bg-gray-100 text-[10px] font-extrabold tabular-nums text-gray-500">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Group>
              )}
            </Card>
          )}

          {/* ── Payment Summary ── */}
          <Card
            title="Payment Summary"
            aside={
              booking.paymentStatus ? (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-gray-500">
                  {booking.paymentStatus.toLowerCase()}
                </span>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
              {booking.packingCharges > 0 && <ChargeRow label="Packing Charges" amount={booking.packingCharges} />}
              {booking.loadingCharges > 0 && <ChargeRow label="Loading Charges" amount={booking.loadingCharges} />}
              <ChargeRow label="Transport Charges" amount={booking.transportCharges} />
              {booking.unloadingCharges > 0 && <ChargeRow label="Unloading Charges" amount={booking.unloadingCharges} />}
              {booking.unpackingCharges > 0 && <ChargeRow label="Unpacking Charges" amount={booking.unpackingCharges} />}
              {booking.storageCharges > 0 && <ChargeRow label="Storage Charges" amount={booking.storageCharges} />}
              {booking.insuranceCharges > 0 && <ChargeRow label="Insurance Charges" amount={booking.insuranceCharges} />}
              {booking.materialCharges > 0 && <ChargeRow label="Material Charges" amount={booking.materialCharges} />}
              {booking.gstAmount > 0 && <ChargeRow label="GST" amount={booking.gstAmount} />}
              <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-3.5">
                <span className="text-sm font-extrabold text-gray-900">Grand Total</span>
                <span className="text-xl font-extrabold tabular-nums text-[#056B3E]">₹{grandTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {booking.advanceAmount && booking.advanceAmount > 0 ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#C8F1DF] bg-[#E9FAF2]">
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#056B3E]">
                    Advance {booking.quote?.advancePercent ? `(${booking.quote.advancePercent}%)` : ''}
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums text-[#056B3E]">₹{booking.advanceAmount.toLocaleString('en-IN')}</span>
                </div>
                {booking.advancePaid && booking.advancePaid > 0 ? (
                  <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#056B3E]">
                      <CheckCircle className="h-3.5 w-3.5" /> Advance Paid
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-700">- ₹{booking.advancePaid.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                {booking.balanceAmount != null && (
                  <div className="flex items-center justify-between gap-3 border-t border-[#C8F1DF] px-3.5 py-2.5">
                    <span className="text-[12.5px] font-semibold text-[#056B3E]">Balance Due</span>
                    <span className="text-[13px] font-bold tabular-nums text-gray-700">₹{booking.balanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            ) : null}
          </Card>

          {/* ── Cancellation Details ── */}
          {booking.status === 'CANCELLED' && booking.cancelledAt && (
            <Card title="Cancellation Details" tone="danger">
              <div className="flex flex-col">
                <MetaRow
                  k="Cancelled At"
                  v={new Date(booking.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                />
                <MetaRow k="Cancelled By" v={booking.cancelledBy ? <span className="capitalize">{booking.cancelledBy.toLowerCase()}</span> : null} />
                <MetaRow k="Refund Amount" v={booking.refundAmount != null ? `₹${booking.refundAmount.toLocaleString('en-IN')}` : null} />
              </div>
              {booking.cancellationReason && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-red-700">Reason</p>
                  <p className="text-[13.5px] leading-relaxed text-red-800">{booking.cancellationReason}</p>
                </div>
              )}
            </Card>
          )}

          {/* ── Rating (for completed moves) ── */}
          {booking.status === 'COMPLETED' && booking.rating && (
            <Card title="Your Rating">
              <div className="flex flex-col gap-3.5">
                {[
                  { label: 'Overall Experience', value: booking.rating },
                  { label: 'Team Service', value: booking.teamRating },
                  { label: 'Packing Quality', value: booking.packingRating },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label}>
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">{label}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= value ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                          />
                        ))}
                        <span className="ml-1.5 text-[12.5px] font-bold text-gray-700">{value}/5</span>
                      </div>
                    </div>
                  ) : null
                )}
                {booking.review && (
                  <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-3.5 py-3">
                    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Your Review</p>
                    <p className="text-[13.5px] leading-relaxed text-gray-700">{booking.review}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── Rate prompt ── */}
          {booking.status === 'COMPLETED' && !booking.rating && (
            <Card title="Rate Your Move">
              <p className="mb-3 text-[12.5px] leading-relaxed text-gray-500">
                Your feedback helps us improve our service and helps other customers choose the right mover.
              </p>
              <button
                onClick={() => setShowRateModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#09B368] px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
              >
                <Star className="h-4 w-4 fill-white" />
                Rate Your Experience
              </button>
            </Card>
          )}

          {/* ── Cancel Booking ── */}
          {canCancel && (
            <Card title="Cancel Booking" tone="danger">
              <p className="mb-3 text-[12.5px] leading-relaxed text-gray-500">
                Need to cancel? You can cancel before the team is assigned. Refund eligibility depends on notice period.
              </p>
              <button
                onClick={() => { setShowCancelModal(true); setCancelError(null); setSelectedCancelReason(''); setOtherCancelReason(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-[13.5px] font-bold text-red-600 transition hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" />
                Cancel This Booking
              </button>
            </Card>
          )}
        </div>
        {/* ══ /Left column ══ */}

        {/* ══ Right rail ══ */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">

          {/* ── Booking Info ── */}
          <Card title="Booking Info">
            <div className="flex flex-col">
              <MetaRow k="Booking Number" v={<span className="tabular-nums">{booking.bookingNumber}</span>} />
              <MetaRow k="Request Number" v={details.requestNumber ? <span className="tabular-nums">{details.requestNumber}</span> : null} />
              <MetaRow k="Quote Number" v={booking.quote?.quoteNumber ? <span className="tabular-nums">{booking.quote.quoteNumber}</span> : null} />
              <MetaRow
                k="Booked On"
                v={new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
              />
              <MetaRow k="Booked By" v={customer?.name} />
              <MetaRow k="Contact" v={customer?.phone ? <span className="tabular-nums">{customer.phone}</span> : null} />
              <MetaRow k="Source" v={booking.source ? <span className="capitalize">{booking.source}</span> : null} />
              <MetaRow k="Payment Status" v={booking.paymentStatus ? <span className="capitalize">{booking.paymentStatus.toLowerCase()}</span> : null} />
            </div>
          </Card>

          {/* ── Vendor Details ── */}
          {booking.vendor && (
            <Card title="Vendor Details">
              <div className="flex items-center gap-3">
                <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-2xl border border-[#C8F1DF] bg-gradient-to-br from-[#E9FAF2] to-[#C8F1DF]">
                  <Package className="h-5 w-5 text-[#056B3E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold leading-tight text-gray-900">{booking.vendor.name}</p>
                  {booking.vendor.rating > 0 && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= Math.round(booking.vendor!.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      ))}
                      <span className="ml-1.5 text-[11.5px] font-semibold text-gray-500">{booking.vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {booking.vendor.phone && <p className="mt-1 text-xs tabular-nums text-gray-500">{booking.vendor.phone}</p>}
                </div>
              </div>
              <a
                href={`tel:${booking.vendor.phone}`}
                className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#09B368] px-4 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53]"
              >
                <Phone className="h-4 w-4" />
                Call Vendor
              </a>
              <button
                onClick={() => setShowChat(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12.5px] font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with Vendor
              </button>
            </Card>
          )}


          {/* ── Need a hand ── */}
          <Card title="Need a hand">
            <div className="relative overflow-hidden rounded-2xl border border-[#C8F1DF] bg-[linear-gradient(140deg,#E9FAF2_0%,#FFFFFF_78%)] p-3.5">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(240px 120px at 100% -40%, rgba(9,179,104,.16), transparent 62%)' }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#09B368] text-white shadow-lg shadow-[#09B368]/25">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-extrabold leading-tight text-gray-900">Questions about your move?</p>
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-gray-500">
                    Booking {booking.bookingNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <HelpRow
                icon={FileText}
                title="Download Invoice"
                hint="Tax invoice for this booking"
                onClick={downloadInvoice}
              />
              <HelpRow
                icon={MessageCircle}
                title="Contact Support"
                hint="Raise it with the TransRentals helpdesk"
                href="/customer/helpdesk"
              />
              <HelpRow
                icon={Layers}
                title="Back to Dashboard"
                hint="All your bookings in one place"
                href="/customer/dashboard"
              />
            </div>
          </Card>
        </aside>
        {/* ══ /Right rail ══ */}
      </div>

      {/* Outside the grid on purpose: the right rail is sticky, and a sticky
          grid item paints over anything sharing its rows. Full content width. */}
      <div className="max-w-7xl mx-auto space-y-5 px-4 pb-5 sm:px-6 lg:px-8">
        {/* Renders itself away when there is no refund to talk about. A refund
            is owed whether or not a vendor was ever assigned, so it does not
            sit behind the notice's vendor guard. */}
        <RefundStatusCard source="packers_bookings" bookingId={booking.id} />
        {booking.vendor && <BookingPaymentSafetyNotice />}
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012314]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9FAF2]">
                <Star className="h-8 w-8 fill-[#09B368] text-[#09B368]" />
              </div>
              <h2 className="quote-serif text-[30px] font-medium tracking-[-0.01em] text-gray-900">How was your move?</h2>
              <p className="text-[13px] text-gray-500">Your feedback helps us improve our service.</p>
            </div>

            <div className="mb-6 space-y-5">
              {[
                { label: 'Overall Experience', value: rating, set: setRating, size: 'h-10 w-10' },
                { label: 'Team Service', value: teamRating, set: setTeamRating, size: 'h-8 w-8' },
                { label: 'Packing Quality', value: packingRating, set: setPackingRating, size: 'h-8 w-8' },
              ].map(({ label, value, set, size }) => (
                <div key={label}>
                  <p className="mb-2 text-[12.5px] font-semibold text-gray-700">{label}</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => set(star)} className="p-1 transition-transform hover:scale-110">
                        <Star
                          className={`${size} transition-colors ${star <= value ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="mb-2 block text-[12.5px] font-semibold text-gray-700">
                  Share your experience (optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you like or what could be better?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[13px] outline-none transition-all focus:border-[#96E4C2] focus:ring-2 focus:ring-[#E9FAF2]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-[13.5px] font-bold text-gray-600 transition hover:bg-gray-50"
                onClick={() => setShowRateModal(false)}
                disabled={isSubmittingRating}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-[#09B368] px-6 py-3 text-[13.5px] font-bold text-white shadow-lg shadow-[#09B368]/25 transition hover:bg-[#078F53] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && booking?.vendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012314]/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-[linear-gradient(118deg,#056B3E_0%,#078F53_60%,#09B368_100%)] p-5 text-white">
              <div>
                <h3 className="quote-serif text-[23px] font-medium tracking-[-0.01em]">{booking.vendor.name}</h3>
                <p className="text-xs text-white/[0.72]">Packers Booking #{booking.bookingNumber}</p>
              </div>
              <button onClick={() => setShowChat(false)} className="rounded-full p-2 transition hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {isLoadingMessages ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#09B368]" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="mb-2 h-10 w-10" />
                  <p className="text-[13px]">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'customer' ? 'bg-[#09B368] text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="break-words text-[13px]">{msg.message}</p>
                      <p className={`mt-1 text-[11px] ${msg.sender_type === 'customer' ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendChatMessage()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:border-[#96E4C2] focus:ring-2 focus:ring-[#E9FAF2]"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!newChatMessage.trim() || isSendingMessage}
                  className="flex items-center gap-2 rounded-xl bg-[#09B368] px-5 py-3 text-[13.5px] font-bold text-white transition hover:bg-[#078F53] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Send className="h-4 w-4" />Send</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#012314]/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="quote-serif font-medium text-gray-900 text-[21px]">Cancel Booking</h3>
                <p className="text-xs tabular-nums text-gray-500">#{booking?.bookingNumber}</p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="mx-5 mb-2 mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-[13px] text-gray-700">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-semibold">{headline}</span>
              </div>
              <div className="mb-1 flex items-start gap-2 text-[13px] text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div>
                  <span>{booking?.pickupCity} → {booking?.dropCity}</span>
                  {(booking?.pickupAddress || booking?.dropAddress) && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {booking?.pickupAddress && <span>{booking.pickupAddress}</span>}
                      {booking?.pickupAddress && booking?.dropAddress && <span> → </span>}
                      {booking?.dropAddress && <span>{booking.dropAddress}</span>}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{booking?.scheduledDate ? formatDate(booking.scheduledDate) : '—'}</span>
              </div>
            </div>

            {/* Refund notice */}
            {booking?.advancePaid && booking.advancePaid > 0 ? (
              <div className="mx-5 mb-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-700">
                  Refund eligibility: 90% if cancelled 5+ days before moving date, 50% if 2–5 days before. No refund within 2 days.
                </p>
              </div>
            ) : null}

            {/* Reason Selection */}
            <div className="px-5 py-3">
              <p className="mb-3 text-[13px] font-bold text-gray-800">Why are you cancelling?</p>
              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selectedCancelReason === reason
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={selectedCancelReason === reason}
                      onChange={() => { setSelectedCancelReason(reason); setCancelError(null); }}
                      className="mt-0.5 accent-red-500"
                    />
                    <span className="text-[13px] text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedCancelReason === 'Other' && (
                <textarea
                  value={otherCancelReason}
                  onChange={(e) => { setOtherCancelReason(e.target.value); setCancelError(null); }}
                  placeholder="Please describe your reason..."
                  rows={3}
                  className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              )}

              {cancelError && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {cancelError}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-[13px] font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !selectedCancelReason}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (<><Loader2 className="h-4 w-4 animate-spin" />Cancelling...</>) : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
