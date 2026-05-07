'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  Package,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  Navigation,
  ArrowRight,
  Loader2,
  UserCheck,
  Car,
  XCircle,
  CreditCard,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TruckRequestDetails from '@/components/truck/TruckRequestDetails';

interface Booking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  vehicleCategory: string;
  vehicleName: string;
  truckBodyType?: string;
  tripDirection?: string;
  goodsType: string;
  goodsDescription?: string;
  estimatedVolume?: string;
  estimatedWeight?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress?: string;
  pickupPincode?: string;
  pickupFloor?: number | null;
  hasPickupLift?: boolean;
  dropCity: string;
  dropAddress?: string;
  dropPincode?: string;
  dropFloor?: number | null;
  hasDropLift?: boolean;
  estimatedDistance?: number;
  pickupDate: string;
  pickupTime: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  requiresLabour?: boolean;
  labourCount?: number;
  hasMultipleStops?: boolean;
  multipleStopsDetails?: string;
  receiverName?: string;
  receiverPhone?: string;
  requiresPOD?: boolean;
  isFlexibleDate?: boolean;
  needInsurance?: boolean;
  needPackaging?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  requirements?: string;
  assignedDriver?: { id: string; name: string; phone: string; licenseNumber?: string };
  assignedVehicle?: { id: string; registrationNumber?: string; vehicle_model?: { name: string } };
  quoteRequest?: any;
  acceptedQuote?: any;
  createdAt?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber?: string;
  licenseType?: string;
  profilePhoto?: string;
  isAvailableForDates?: boolean;
}

interface Vehicle {
  id: string;
  registrationNumber?: string;
  yearOfManufacture?: number;
  color?: string;
  vehicle_model?: { id: string; name: string };
  service?: { id: string; name: string };
  isAvailableForDates?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT:    { label: 'Pending Payment',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200',     icon: AlertCircle },
  PAYMENT_SUBMITTED:  { label: 'Payment Submitted', color: 'bg-orange-100 text-orange-700 border-orange-200',     icon: Clock },
  ADVANCE_PAID:       { label: 'Advance Paid',      color: 'bg-blue-100 text-blue-700 border-blue-200',           icon: CheckCircle },
  CONFIRMED:          { label: 'Confirmed',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: CheckCircle },
  VEHICLE_ASSIGNED:   { label: 'Vehicle Assigned',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200',     icon: Truck },
  LOADING:            { label: 'Loading',           color: 'bg-orange-100 text-orange-700 border-orange-200',     icon: Truck },
  IN_TRANSIT:         { label: 'In Transit',        color: 'bg-purple-100 text-purple-700 border-purple-200',     icon: Navigation },
  UNLOADING:          { label: 'Unloading',         color: 'bg-teal-100 text-teal-700 border-teal-200',           icon: Truck },
  COMPLETED:          { label: 'Completed',         color: 'bg-gray-100 text-gray-700 border-gray-200',           icon: CheckCircle },
  CANCELLED:          { label: 'Cancelled',         color: 'bg-red-100 text-red-700 border-red-200',              icon: AlertCircle },
  DROPPED:            { label: 'Dropped',           color: 'bg-red-100 text-red-700 border-red-200',              icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Payment Pending',   color: 'bg-yellow-50 text-yellow-700' },
  SUBMITTED:  { label: 'Payment Submitted', color: 'bg-amber-50 text-amber-700' },
  VERIFIED:   { label: 'Payment Verified',  color: 'bg-emerald-50 text-emerald-700' },
  PARTIAL:    { label: 'Partial Payment',   color: 'bg-orange-50 text-orange-700' },
  PAID:       { label: 'Paid',              color: 'bg-emerald-50 text-emerald-700' },
  COMPLETED:  { label: 'Paid',              color: 'bg-emerald-50 text-emerald-700' },
  REJECTED:   { label: 'Payment Rejected',  color: 'bg-red-50 text-red-700' },
  REFUNDED:   { label: 'Refunded',          color: 'bg-gray-50 text-gray-700' },
};

export default function VendorTruckBookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [manualDriverName, setManualDriverName] = useState('');
  const [manualDriverPhone, setManualDriverPhone] = useState('');
  const [manualVehicleNumber, setManualVehicleNumber] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMode, setAssignMode] = useState<'select' | 'manual'>('select');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vendor/truck-bookings/${id}`);
      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Failed to load booking');
      }
    } catch (err) {
      setError('Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async (pickupDate?: string) => {
    try {
      let url = '/api/vendor/resources?type=all';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(startDate)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        const driverList = data.drivers || [];
        driverList.sort((a: Driver, b: Driver) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setDrivers(driverList);
        const vehicleList = data.vehicles || [];
        vehicleList.sort((a: Vehicle, b: Vehicle) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setVehicles(vehicleList);
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    }
  };

  const handleOpenAssignModal = () => {
    fetchResources(booking?.pickupDate);
    setShowAssignModal(true);
    setSelectedVehicleId('');
    setSelectedDriverId('');
  };

  const handleAssign = async () => {
    if (assignMode === 'select') {
      if (!selectedDriverId && !manualDriverName) {
        alert('Please select or enter driver details');
        return;
      }
      if (!selectedVehicleId && !manualVehicleNumber) {
        alert('Please select or enter vehicle details');
        return;
      }
    } else {
      if (!manualDriverName || !manualDriverPhone || !manualVehicleNumber) {
        alert('Please fill all driver and vehicle details');
        return;
      }
    }

    setIsAssigning(true);
    try {
      const payload: any = { action: 'assign_driver' };

      if (assignMode === 'select') {
        if (selectedDriverId) {
          payload.assignedDriverId = selectedDriverId;
        } else {
          payload.driverName = manualDriverName;
          payload.driverPhone = manualDriverPhone;
        }

        if (selectedVehicleId) {
          payload.assignedVehicleId = selectedVehicleId;
          const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
          if (!selectedVehicle?.registrationNumber) {
            payload.vehicleNumber = manualVehicleNumber;
          }
        } else {
          payload.vehicleNumber = manualVehicleNumber;
        }
      } else {
        payload.driverName = manualDriverName;
        payload.driverPhone = manualDriverPhone;
        payload.vehicleNumber = manualVehicleNumber;
      }

      const response = await fetch(`/api/vendor/truck-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setShowAssignModal(false);
        fetchBooking();
        alert('Driver and vehicle assigned successfully!');
      } else {
        console.error('Assign error:', data);
        alert(data.error + (data.details ? `: ${data.details}` : ''));
      }
    } catch (err) {
      console.error('Assign error:', err);
      alert('Failed to assign driver and vehicle');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusAction = async (action: string, otp?: string) => {
    try {
      const response = await fetch(`/api/vendor/truck-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, otp }),
      });

      const data = await response.json();
      if (data.success) {
        fetchBooking();
        alert(data.message || 'Status updated');
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded-xl w-1/4"></div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-5 bg-gray-200 rounded w-1/2"></div><div className="h-3 bg-gray-100 rounded w-1/3"></div></div></div>
          <div className="grid grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="space-y-1"><div className="h-3 bg-gray-100 rounded w-1/2"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>)}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-20 bg-gray-100 rounded-xl"></div></div>
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
        <button onClick={() => router.push('/vendor/transporter/bookings')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const StatusIcon = statusConfig.icon;
  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
  const canAssign = ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status);
  const balanceAmount = booking.totalAmount - (booking.advancePaid || 0);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/vendor/transporter/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">#{booking.bookingNumber}</h1>
              <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border', statusConfig.color)}>
                <StatusIcon className="w-3 h-3" /> {statusConfig.label}
              </span>
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold', paymentConfig.color)}>{paymentConfig.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{booking.vehicleName} · {booking.serviceType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAssign && !booking.driverName && (
            <button onClick={handleOpenAssignModal} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 transition-all active:scale-95">
              <UserCheck className="w-3.5 h-3.5" /> Assign Driver & Vehicle
            </button>
          )}
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

      {/* ── Vehicle + Price Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50 via-emerald-50/30 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{booking.vehicleName}</h2>
              <p className="text-xs text-gray-400">{booking.goodsType || 'Transport'}</p>
              {booking.vehicleNumber && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Vehicle: {booking.vehicleNumber}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</p>
            {balanceAmount > 0 ? (
              <p className="text-xs text-emerald-600 font-bold">Balance ₹{balanceAmount.toLocaleString()}</p>
            ) : (
              <p className="text-xs text-emerald-600 font-bold">Fully paid</p>
            )}
          </div>
        </div>
        {/* Quick stats strip */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { label: 'Pickup',   value: formatDate(booking.pickupDate),                                    sub: booking.pickupTime || '—' },
            { label: 'Distance', value: booking.estimatedDistance ? `${booking.estimatedDistance} km` : '—', sub: 'Approx' },
            { label: 'Goods',    value: booking.goodsType || '—',                                          sub: 'Type' },
            { label: 'Advance',  value: `₹${(booking.advancePaid || 0).toLocaleString()}`,                  sub: booking.advancePaid > 0 ? 'Received' : 'Pending' },
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

          {/* Route */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Route Details
            </h3>
            <div className="flex items-stretch gap-3">
              <div className="flex-1 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Pickup</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.pickupCity}</p>
                {booking.pickupAddress && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{booking.pickupAddress}</p>}
              </div>
              <div className="flex items-center">
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </div>
              <div className="flex-1 bg-red-50/60 border border-red-100 rounded-xl p-3.5">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Drop</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.dropCity}</p>
                {booking.dropAddress && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{booking.dropAddress}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                {formatDate(booking.pickupDate)}{booking.pickupTime ? ` · ${booking.pickupTime}` : ''}
              </span>
              {booking.estimatedDistance && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  ~{booking.estimatedDistance} km
                </span>
              )}
            </div>
          </div>

          {/* Goods */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" /> Goods Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Goods Type</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.goodsType || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vehicle Required</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.vehicleName}</p>
              </div>
              {booking.goodsDescription && (
                <div className="sm:col-span-2 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description</p>
                  <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{booking.goodsDescription}</p>
                </div>
              )}
            </div>

            {/* Extended truck details */}
            <div className="mt-4">
              <TruckRequestDetails data={booking as any} hideVehicle />
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Customer
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                {booking.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{booking.customerName}</p>
                <p className="text-xs text-gray-400">{booking.customerEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {booking.customerPhone && (
                <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                  <Phone className="w-3 h-3" /> {booking.customerPhone}
                </a>
              )}
              {booking.customerEmail && (
                <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all">
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

          {/* Driver & Vehicle Info */}
          {(booking.driverName || booking.assignedDriver) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Assigned Driver & Vehicle
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Driver</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.driverName}</p>
                  {booking.driverPhone && (
                    <a href={`tel:${booking.driverPhone}`} className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {booking.driverPhone}
                    </a>
                  )}
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Vehicle Number</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{booking.vehicleNumber || '—'}</p>
                </div>
                {booking.loadingOtp && (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Loading OTP</p>
                    <p className="text-sm font-bold tracking-widest text-gray-900 mt-0.5">{booking.loadingOtp}</p>
                  </div>
                )}
                {booking.deliveryOtp && (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Delivery OTP</p>
                    <p className="text-sm font-bold tracking-widest text-gray-900 mt-0.5">{booking.deliveryOtp}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ Sidebar ══ */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Payment
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold text-gray-700">₹{booking.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Advance Paid</span>
                <span className="font-semibold text-emerald-600">₹{(booking.advancePaid || 0).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 mt-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900">Balance Due</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{balanceAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {canAssign && !booking.driverName && (
              <button
                onClick={handleOpenAssignModal}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4" /> Assign Driver & Vehicle
              </button>
            )}
          </div>

          {/* Booking Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> Booking Progress
            </h3>
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />

              {(() => {
                const isDropped = booking.status === 'DROPPED';
                const createdDone = true;
                const paymentDone = booking.advancePaid > 0 || ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status);
                const driverDone = !!booking.driverName || ['VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status);
                const loadingDone = ['LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status);
                const transitDone = ['IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status);
                const deliveredDone = booking.status === 'COMPLETED';

                let droppedAfterStep = -1;
                if (isDropped) {
                  if (transitDone) droppedAfterStep = 4;
                  else if (loadingDone) droppedAfterStep = 3;
                  else if (driverDone) droppedAfterStep = 2;
                  else if (paymentDone) droppedAfterStep = 1;
                  else droppedAfterStep = 0;
                }

                const steps = [
                  { label: 'Booking Created',           desc: 'Quote accepted by customer',                                                                                  done: createdDone,  icon: <CheckCircle className="w-3.5 h-3.5" /> },
                  { label: 'Advance Payment',           desc: paymentDone ? `₹${booking.advancePaid?.toLocaleString()} received` : 'Awaiting payment',                       done: paymentDone,  icon: paymentDone ? <CheckCircle className="w-3.5 h-3.5" /> : <IndianRupee className="w-3.5 h-3.5" /> },
                  { label: 'Driver & Vehicle Assigned', desc: booking.driverName ? `${booking.driverName} • ${booking.vehicleNumber || 'Vehicle assigned'}` : 'Pending',     done: driverDone,   icon: driverDone ? <CheckCircle className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" /> },
                  { label: 'Loading',                   desc: loadingDone ? 'Loading completed' : 'Waiting for driver',                                                      done: loadingDone,  icon: <Package className="w-3.5 h-3.5" /> },
                  { label: 'In Transit',                desc: transitDone ? 'Transit completed' : 'Pending',                                                                 done: transitDone,  icon: transitDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" /> },
                  { label: 'Delivered',                 desc: deliveredDone ? 'Successfully delivered' : 'Pending delivery',                                                 done: deliveredDone, icon: <CheckCircle className="w-3.5 h-3.5" /> },
                ];

                const timelineItems: any[] = [];
                for (let i = 0; i < steps.length; i++) {
                  const step = steps[i];
                  const isAfterDrop = isDropped && i > droppedAfterStep;
                  timelineItems.push({
                    ...step,
                    bgClass: isAfterDrop ? 'bg-gray-200 text-gray-400' : (step.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'),
                    textClass: isAfterDrop ? 'text-gray-400' : (step.done ? 'text-gray-900' : 'text-gray-400'),
                  });
                  if (isDropped && i === droppedAfterStep) {
                    timelineItems.push({
                      label: 'Booking Dropped',
                      desc: (booking as any).dropReason ? `Reason: ${(booking as any).dropReason}` : 'Booking was dropped',
                      done: false,
                      icon: <XCircle className="w-3.5 h-3.5" />,
                      isDroppedMarker: true,
                      bgClass: 'bg-red-600 text-white',
                      textClass: 'text-red-700',
                    });
                  }
                }

                return (
                  <div className="space-y-4">
                    {timelineItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${item.bgClass}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`text-xs font-bold ${item.textClass}`}>{item.label}</p>
                          <p className={`text-[11px] ${item.isDroppedMarker ? 'text-red-500' : 'text-gray-400'} mt-0.5`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {booking.status === 'CANCELLED' && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold">Booking Cancelled</span>
              </div>
            )}
          </div>

          {/* Completed banner */}
          {booking.status === 'COMPLETED' && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-800">Trip Completed!</h3>
              <p className="text-xs text-emerald-600 mt-0.5">Booking successfully delivered.</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ Assign Modal ══════════ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Assign Driver & Vehicle</h2>
              <p className="text-xs text-gray-500 mt-0.5">Select from your staff/fleet or enter manually</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Mode Toggle */}
              <div className="flex gap-1.5 bg-gray-100/80 rounded-xl p-1">
                <button
                  onClick={() => setAssignMode('select')}
                  className={cn('flex-1 py-2 px-4 rounded-lg text-xs font-bold transition', assignMode === 'select' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                >
                  Select from List
                </button>
                <button
                  onClick={() => setAssignMode('manual')}
                  className={cn('flex-1 py-2 px-4 rounded-lg text-xs font-bold transition', assignMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                >
                  Enter Manually
                </button>
              </div>

              {assignMode === 'select' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                      Select Driver
                    </label>
                    {drivers.length > 0 ? (
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                      >
                        <option value="">-- Select Driver --</option>
                        {drivers.map((driver) => {
                          const isAssignedForDates = driver.isAvailableForDates === false;
                          return (
                            <option key={driver.id} value={driver.id} disabled={isAssignedForDates}>
                              {driver.name} - {driver.phone} {driver.licenseNumber && `(${driver.licenseNumber})`}
                              {isAssignedForDates ? ' — Assigned for this date' : ''}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-700">
                        No drivers found. Add drivers in Staff Management or enter manually.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      <Car className="w-3.5 h-3.5 inline mr-1" />
                      Select Vehicle
                    </label>
                    {vehicles.length > 0 ? (
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                      >
                        <option value="">-- Select Vehicle --</option>
                        {vehicles.map((vehicle) => {
                          const isBookedForDates = vehicle.isAvailableForDates === false;
                          return (
                            <option key={vehicle.id} value={vehicle.id} disabled={isBookedForDates}>
                              {vehicle.registrationNumber || 'No Reg#'} - {vehicle.vehicle_model?.name || 'Unknown Model'}
                              {isBookedForDates ? ' — Booked for these dates' : ''}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-700">
                        No vehicles found. Add vehicles in Fleet Management or enter manually.
                      </div>
                    )}
                  </div>

                  {selectedVehicleId && !vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">Vehicle Number *</label>
                      <input
                        type="text"
                        value={manualVehicleNumber}
                        onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="MH12AB1234"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                      />
                    </div>
                  )}

                  {(!drivers.length || !vehicles.length) && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-3">Or enter details manually:</p>
                      {!drivers.length && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={manualDriverName}
                            onChange={(e) => setManualDriverName(e.target.value)}
                            placeholder="Driver Name"
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                          />
                          <input
                            type="tel"
                            value={manualDriverPhone}
                            onChange={(e) => setManualDriverPhone(e.target.value)}
                            placeholder="Driver Phone"
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                          />
                        </div>
                      )}
                      {!vehicles.length && (
                        <input
                          type="text"
                          value={manualVehicleNumber}
                          onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                          placeholder="Vehicle Number (e.g., MH12AB1234)"
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none mt-3"
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Driver Name *</label>
                    <input
                      type="text"
                      value={manualDriverName}
                      onChange={(e) => setManualDriverName(e.target.value)}
                      placeholder="Enter driver name"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Driver Phone *</label>
                    <input
                      type="tel"
                      value={manualDriverPhone}
                      onChange={(e) => setManualDriverPhone(e.target.value)}
                      placeholder="Enter driver phone"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      value={manualVehicleNumber}
                      onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="MH12AB1234"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={isAssigning}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
